"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, LoaderCircle, LockKeyhole, Mail, UserRound } from "lucide-react";
import {
  loginAction,
  registerAction,
  requestPasswordResetAction,
  resetPasswordAction,
} from "@/app/(auth)/actions";
import { initialAuthState } from "@/lib/auth/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuthMode = "login" | "register" | "recovery" | "reset";

const actions = {
  login: loginAction,
  register: registerAction,
  recovery: requestPasswordResetAction,
  reset: resetPasswordAction,
};

const copy = {
  login: { title: "Bienvenido de nuevo", subtitle: "Ingrese para ver el estado real de su dinero.", submit: "Ingresar" },
  register: { title: "Cree su espacio financiero", subtitle: "Sus datos estarán aislados y disponibles solo para usted.", submit: "Crear cuenta" },
  recovery: { title: "Recupere su acceso", subtitle: "Le daremos un enlace temporal si encontramos su cuenta.", submit: "Solicitar enlace" },
  reset: { title: "Defina una nueva contraseña", subtitle: "Use una contraseña nueva y difícil de adivinar.", submit: "Actualizar contraseña" },
};

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{messages[0]}</p>;
}

export function AuthForm({ mode, token }: { mode: AuthMode; token?: string }) {
  const [state, formAction, pending] = useActionState(actions[mode], initialAuthState);
  const content = copy[mode];

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Finanzas bajo control</p>
        <h1 className="text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">{content.title}</h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">{content.subtitle}</p>
      </div>

      <form action={formAction} className="space-y-4" noValidate>
        {mode === "reset" && <input type="hidden" name="token" value={token ?? ""} />}

        {mode === "register" && (
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">Nombre</span>
            <span className="relative block">
              <UserRound className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-muted-foreground" aria-hidden="true" />
              <Input name="name" autoComplete="name" placeholder="Su nombre" className="pl-10" required />
            </span>
            <FieldError messages={state.fieldErrors?.name} />
          </label>
        )}

        {mode !== "reset" && (
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">Correo electrónico</span>
            <span className="relative block">
              <Mail className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-muted-foreground" aria-hidden="true" />
              <Input name="email" type="email" autoComplete="email" inputMode="email" placeholder="usted@correo.com" className="pl-10" required />
            </span>
            <FieldError messages={state.fieldErrors?.email} />
          </label>
        )}

        {(mode === "login" || mode === "register" || mode === "reset") && (
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">
              {mode === "reset" ? "Nueva contraseña" : "Contraseña"}
            </span>
            <span className="relative block">
              <LockKeyhole className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-muted-foreground" aria-hidden="true" />
              <Input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} className="pl-10" required />
            </span>
            <FieldError messages={state.fieldErrors?.password} />
          </label>
        )}

        {(mode === "register" || mode === "reset") && (
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">Confirmar contraseña</span>
            <Input name="confirmPassword" type="password" autoComplete="new-password" required />
            <FieldError messages={state.fieldErrors?.confirmPassword} />
          </label>
        )}

        {mode === "login" && (
          <div className="flex justify-end">
            <Link href="/recuperar" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400">
              ¿Olvidó su contraseña?
            </Link>
          </div>
        )}

        {state.message && (
          <div
            role="status"
            className={`flex gap-2.5 rounded-xl border p-3 text-sm ${
              state.status === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
            }`}
          >
            {state.status === "success" ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <AlertCircle className="mt-0.5 size-4 shrink-0" />}
            <span>{state.message}</span>
          </div>
        )}

        {state.developmentResetUrl && (
          <Button asChild variant="secondary" className="w-full">
            <Link href={state.developmentResetUrl}>Abrir enlace de desarrollo</Link>
          </Button>
        )}

        <Button type="submit" className="mt-2 w-full" disabled={pending}>
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : content.submit}
          {!pending && <ArrowRight className="size-4" aria-hidden="true" />}
        </Button>
      </form>

      <div className="mt-7 text-center text-sm text-muted-foreground">
        {mode === "login" && (
          <>¿Necesita una cuenta? <Link className="font-semibold text-emerald-700 dark:text-emerald-400" href="/registro">Crear cuenta</Link></>
        )}
        {mode === "register" && (
          <>¿Ya tiene acceso? <Link className="font-semibold text-emerald-700 dark:text-emerald-400" href="/iniciar-sesion">Iniciar sesión</Link></>
        )}
        {(mode === "recovery" || mode === "reset") && (
          <Link className="font-semibold text-emerald-700 dark:text-emerald-400" href="/iniciar-sesion">Volver al inicio de sesión</Link>
        )}
      </div>
    </div>
  );
}

