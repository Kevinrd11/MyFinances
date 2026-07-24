"use server";

import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { DEFAULT_CATEGORIES } from "@/lib/auth/default-categories";
import { clearRateLimit, checkRateLimit, registerFailedAttempt } from "@/lib/auth/rate-limit";
import { createSession, deleteSession, requestFingerprint } from "@/lib/auth/session";
import type { AuthActionState } from "@/lib/auth/types";
import {
  loginSchema,
  recoverySchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/auth/validation";

function fieldErrors(error: { flatten: () => { fieldErrors: Record<string, string[]> } }) {
  return error.flatten().fieldErrors as AuthActionState["fieldErrors"];
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrors(parsed.error) };
  }

  const fingerprint = await requestFingerprint();
  const limit = await checkRateLimit(`login:${parsed.data.email}:${fingerprint.ipAddress}`);
  if (!limit.allowed) {
    return {
      status: "error",
      message: `Demasiados intentos. Intente nuevamente en ${Math.ceil(limit.retryAfterSeconds / 60)} min.`,
    };
  }

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, passwordHash: true },
  });
  const valid = user ? await bcrypt.compare(parsed.data.password, user.passwordHash) : false;

  if (!user || !valid) {
    await registerFailedAttempt(limit.keyHash);
    return { status: "error", message: "El correo o la contraseña no son correctos." };
  }

  await clearRateLimit(limit.keyHash);
  await createSession(user.id);
  await db.auditLog.create({
    data: { userId: user.id, action: "LOGIN", entity: "Session", entityId: user.id },
  });
  redirect("/inicio");
}

export async function registerAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (process.env.ALLOW_REGISTRATION !== "true") {
    return {
      status: "error",
      message: "El registro está cerrado. Habilítelo temporalmente en la configuración del servidor.",
    };
  }

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrors(parsed.error) };
  }

  const fingerprint = await requestFingerprint();
  const limit = await checkRateLimit(`register:${fingerprint.ipAddress}`);
  if (!limit.allowed) {
    return { status: "error", message: "Espere unos minutos antes de volver a intentarlo." };
  }

  const existing = await db.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
  if (existing) {
    await registerFailedAttempt(limit.keyHash);
    return { status: "error", message: "No fue posible crear la cuenta con esos datos." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await db.$transaction(async (transaction) => {
    const created = await transaction.user.create({
      data: { name: parsed.data.name, email: parsed.data.email, passwordHash },
      select: { id: true },
    });

    await transaction.$queryRaw`SELECT set_config('app.current_user_id', ${created.id}, true)`;
    await transaction.category.createMany({
      data: DEFAULT_CATEGORIES.map((category) => ({ ...category, userId: created.id })),
    });
    await transaction.auditLog.create({
      data: { userId: created.id, action: "REGISTER", entity: "User", entityId: created.id },
    });
    return created;
  });

  await clearRateLimit(limit.keyHash);
  await createSession(user.id);
  redirect("/inicio");
}

export async function requestPasswordResetAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = recoverySchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrors(parsed.error) };
  }

  const fingerprint = await requestFingerprint();
  const limit = await checkRateLimit(`recovery:${parsed.data.email}:${fingerprint.ipAddress}`);
  if (!limit.allowed) {
    return { status: "error", message: "Espere unos minutos antes de solicitar otro enlace." };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
  let developmentResetUrl: string | undefined;

  if (user) {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await db.$transaction([
      db.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
      db.passwordResetToken.create({
        data: { userId: user.id, tokenHash: tokenHash(token), expiresAt },
      }),
    ]);

    if (
      process.env.NODE_ENV === "development" &&
      process.env.PASSWORD_RESET_DELIVERY === "development"
    ) {
      developmentResetUrl = `/restablecer?token=${encodeURIComponent(token)}`;
    }
  }

  await registerFailedAttempt(limit.keyHash);
  return {
    status: "success",
    message: "Si el correo existe, se generó un enlace válido durante 30 minutos.",
    developmentResetUrl,
  };
}

export async function resetPasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrors(parsed.error), message: "Revise los datos." };
  }

  const resetToken = await db.passwordResetToken.findUnique({
    where: { tokenHash: tokenHash(parsed.data.token) },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
    return { status: "error", message: "El enlace es inválido o ya venció." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await db.$transaction([
    db.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    db.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
    db.session.deleteMany({ where: { userId: resetToken.userId } }),
    db.auditLog.create({
      data: {
        userId: resetToken.userId,
        action: "PASSWORD_RESET",
        entity: "User",
        entityId: resetToken.userId,
      },
    }),
  ]);

  return { status: "success", message: "Contraseña actualizada. Ya puede iniciar sesión." };
}

export async function logoutAction() {
  await deleteSession();
  redirect("/iniciar-sesion");
}
