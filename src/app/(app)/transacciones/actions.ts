"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { convertMoney, type SupportedCurrency } from "@/lib/finance/format";

export type FinanceActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

const accountSchema = z.object({
  name: z.string().trim().min(2, "Ingrese un nombre.").max(60),
  type: z.enum(["CASH", "BANK", "SINPE", "CREDIT_CARD", "SAVINGS", "INVESTMENT", "OTHER"]),
  currency: z.enum(["CRC", "USD"]),
  initialBalance: z.coerce.number().finite().min(-999999999).max(999999999),
});

const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  accountId: z.string().min(1, "Seleccione una cuenta."),
  destinationAccountId: z.string().optional(),
  categoryId: z.string().optional(),
  amount: z.coerce.number().positive("Ingrese un monto mayor que cero.").max(999999999),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Seleccione una fecha válida."),
  description: z.string().trim().min(2, "Ingrese una descripción.").max(120),
  paymentMethod: z.string().trim().max(50).optional(),
  notes: z.string().trim().max(500).optional(),
});

function errors(error: z.ZodError) {
  return error.flatten().fieldErrors as Record<string, string[]>;
}

function refreshFinanceViews() {
  revalidatePath("/transacciones");
  revalidatePath("/calendario");
  revalidatePath("/inicio");
  revalidatePath("/reportes");
}

export async function createAccountAction(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const parsed = accountSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    currency: formData.get("currency"),
    initialBalance: formData.get("initialBalance"),
  });
  if (!parsed.success) return { status: "error", fieldErrors: errors(parsed.error) };

  const user = await requireUser();
  await db.$transaction(async (transaction) => {
    await transaction.$queryRaw`SELECT set_config('app.current_user_id', ${user.id}, true)`;
    const account = await transaction.account.create({
      data: { ...parsed.data, userId: user.id },
      select: { id: true },
    });
    await transaction.auditLog.create({
      data: {
        userId: user.id,
        action: "CREATE",
        entity: "Account",
        entityId: account.id,
      },
    });
  });

  refreshFinanceViews();
  redirect("/transacciones?new=income");
}

export async function createTransactionAction(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const parsed = transactionSchema.safeParse({
    type: formData.get("type"),
    accountId: formData.get("accountId"),
    destinationAccountId: formData.get("destinationAccountId") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    amount: formData.get("amount"),
    date: formData.get("date"),
    description: formData.get("description"),
    paymentMethod: formData.get("paymentMethod") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { status: "error", fieldErrors: errors(parsed.error) };

  const user = await requireUser();
  const data = parsed.data;
  let actionError: string | undefined;

  await db.$transaction(async (transaction) => {
    await transaction.$queryRaw`SELECT set_config('app.current_user_id', ${user.id}, true)`;
    const [profile, account, category] = await Promise.all([
      transaction.user.findUniqueOrThrow({
        where: { id: user.id },
        select: { primaryCurrency: true, defaultExchangeRate: true },
      }),
      transaction.account.findFirst({
        where: { id: data.accountId, userId: user.id, isArchived: false },
        select: { id: true, currency: true, name: true },
      }),
      data.categoryId
        ? transaction.category.findFirst({
            where: { id: data.categoryId, userId: user.id, isArchived: false },
            select: { id: true, type: true, name: true },
          })
        : null,
    ]);

    if (!account) {
      actionError = "La cuenta seleccionada ya no está disponible.";
      return;
    }
    if (data.type !== "TRANSFER" && (!category || category.type !== data.type)) {
      actionError = "Seleccione una categoría correspondiente al tipo de movimiento.";
      return;
    }

    const date = new Date(`${data.date}T12:00:00-06:00`);
    const rate = Number(profile.defaultExchangeRate);
    const convertedAmount = convertMoney(
      data.amount,
      account.currency as SupportedCurrency,
      profile.primaryCurrency as SupportedCurrency,
      rate,
    );
    const common = {
      userId: user.id,
      amount: data.amount,
      currency: account.currency,
      exchangeRate: account.currency === profile.primaryCurrency ? null : rate,
      convertedAmount,
      date,
      description: data.description,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
    };

    if (data.type === "TRANSFER") {
      if (!data.destinationAccountId || data.destinationAccountId === account.id) {
        actionError = "Seleccione una cuenta de destino diferente.";
        return;
      }
      const destination = await transaction.account.findFirst({
        where: { id: data.destinationAccountId, userId: user.id, isArchived: false },
        select: { id: true, currency: true, name: true },
      });
      if (!destination) {
        actionError = "La cuenta de destino ya no está disponible.";
        return;
      }
      if (destination.currency !== account.currency) {
        actionError = "Por ahora, las transferencias deben usar cuentas con la misma moneda.";
        return;
      }

      const transferGroupId = randomUUID();
      const created = await transaction.transaction.create({
        data: {
          ...common,
          accountId: account.id,
          type: "TRANSFER",
          transferDirection: "OUT",
          transferGroupId,
          description: data.description || `Transferencia a ${destination.name}`,
        },
        select: { id: true },
      });
      await transaction.transaction.create({
        data: {
          ...common,
          accountId: destination.id,
          type: "TRANSFER",
          transferDirection: "IN",
          transferGroupId,
          description: data.description || `Transferencia desde ${account.name}`,
        },
      });
      await transaction.auditLog.create({
        data: {
          userId: user.id,
          action: "CREATE_TRANSFER",
          entity: "Transaction",
          entityId: created.id,
        },
      });
      return;
    }

    const created = await transaction.transaction.create({
      data: {
        ...common,
        accountId: account.id,
        categoryId: category?.id,
        type: data.type,
        source:
          data.type === "INCOME"
            ? category?.name === "Tours"
              ? "TOURS"
              : category?.name === "Páginas web"
                ? "WEB_PROJECTS"
                : "OTHER"
            : null,
      },
      select: { id: true },
    });
    await transaction.auditLog.create({
      data: {
        userId: user.id,
        action: "CREATE",
        entity: "Transaction",
        entityId: created.id,
      },
    });
  });

  if (actionError) return { status: "error", message: actionError };
  refreshFinanceViews();
  redirect(`/transacciones?created=1&month=${data.date.slice(0, 7)}`);
}

export async function updateIncomeAction(
  id: string,
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const parsed = transactionSchema.safeParse({
    type: formData.get("type"),
    accountId: formData.get("accountId"),
    categoryId: formData.get("categoryId") || undefined,
    amount: formData.get("amount"),
    date: formData.get("date"),
    description: formData.get("description"),
    paymentMethod: formData.get("paymentMethod") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { status: "error", fieldErrors: errors(parsed.error) };
  if (parsed.data.type !== "INCOME") {
    return { status: "error", message: "Solo se pueden editar ingresos desde esta opción." };
  }

  const user = await requireUser();
  const data = parsed.data;
  let actionError: string | undefined;

  await db.$transaction(async (transaction) => {
    await transaction.$queryRaw`SELECT set_config('app.current_user_id', ${user.id}, true)`;
    const [profile, existing, account, category] = await Promise.all([
      transaction.user.findUniqueOrThrow({
        where: { id: user.id },
        select: { primaryCurrency: true, defaultExchangeRate: true },
      }),
      transaction.transaction.findFirst({
        where: { id, userId: user.id, type: "INCOME", deletedAt: null },
        select: {
          id: true,
          accountId: true,
          categoryId: true,
          amount: true,
          currency: true,
          date: true,
          description: true,
          paymentMethod: true,
          notes: true,
          isRecurring: true,
          tour: { select: { id: true } },
          projectPayment: { select: { id: true } },
          goalContribution: { select: { id: true } },
          debtPayment: { select: { id: true } },
        },
      }),
      transaction.account.findFirst({
        where: { id: data.accountId, userId: user.id, isArchived: false },
        select: { id: true, currency: true },
      }),
      data.categoryId
        ? transaction.category.findFirst({
            where: {
              id: data.categoryId,
              userId: user.id,
              isArchived: false,
              type: "INCOME",
            },
            select: { id: true, name: true },
          })
        : null,
    ]);

    if (!existing) {
      actionError = "El ingreso ya no existe.";
      return;
    }
    if (
      existing.isRecurring ||
      existing.tour ||
      existing.projectPayment ||
      existing.goalContribution ||
      existing.debtPayment
    ) {
      actionError = "Este ingreso pertenece a otro módulo y debe editarse desde su origen.";
      return;
    }
    if (!account) {
      actionError = "La cuenta seleccionada ya no está disponible.";
      return;
    }
    if (!category) {
      actionError = "Seleccione una categoría de ingreso válida.";
      return;
    }

    const date = new Date(`${data.date}T12:00:00-06:00`);
    const rate = Number(profile.defaultExchangeRate);
    const convertedAmount = convertMoney(
      data.amount,
      account.currency as SupportedCurrency,
      profile.primaryCurrency as SupportedCurrency,
      rate,
    );
    await transaction.transaction.update({
      where: { id: existing.id },
      data: {
        accountId: account.id,
        categoryId: category.id,
        amount: data.amount,
        currency: account.currency,
        exchangeRate: account.currency === profile.primaryCurrency ? null : rate,
        convertedAmount,
        date,
        description: data.description,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        source:
          category.name === "Tours"
            ? "TOURS"
            : category.name === "Páginas web"
              ? "WEB_PROJECTS"
              : "OTHER",
      },
    });
    await transaction.auditLog.create({
      data: {
        userId: user.id,
        action: "UPDATE",
        entity: "Transaction",
        entityId: existing.id,
        before: {
          accountId: existing.accountId,
          categoryId: existing.categoryId,
          amount: Number(existing.amount),
          currency: existing.currency,
          date: existing.date.toISOString(),
          description: existing.description,
          paymentMethod: existing.paymentMethod,
          notes: existing.notes,
        },
        after: {
          accountId: account.id,
          categoryId: category.id,
          amount: data.amount,
          currency: account.currency,
          date: date.toISOString(),
          description: data.description,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
        },
      },
    });
  });

  if (actionError) return { status: "error", message: actionError };
  refreshFinanceViews();
  redirect(`/transacciones?updated=1&month=${data.date.slice(0, 7)}`);
}

export async function deleteTransactionAction(id: string) {
  const user = await requireUser();

  await db.$transaction(async (transaction) => {
    await transaction.$queryRaw`SELECT set_config('app.current_user_id', ${user.id}, true)`;
    const existing = await transaction.transaction.findFirst({
      where: { id, userId: user.id, deletedAt: null },
      select: {
        id: true,
        transferGroupId: true,
        isRecurring: true,
        tour: { select: { id: true } },
        projectPayment: { select: { id: true } },
        goalContribution: { select: { id: true } },
        debtPayment: { select: { id: true } },
      },
    });
    if (!existing) return;
    if (
      existing.isRecurring ||
      existing.tour ||
      existing.projectPayment ||
      existing.goalContribution ||
      existing.debtPayment
    ) {
      return;
    }

    if (existing.transferGroupId) {
      await transaction.transaction.updateMany({
        where: { userId: user.id, transferGroupId: existing.transferGroupId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
    } else {
      await transaction.transaction.update({
        where: { id: existing.id },
        data: { deletedAt: new Date() },
      });
    }
    await transaction.auditLog.create({
      data: {
        userId: user.id,
        action: "DELETE",
        entity: "Transaction",
        entityId: existing.id,
      },
    });
  });

  refreshFinanceViews();
}
