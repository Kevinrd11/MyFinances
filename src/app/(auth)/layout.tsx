import { ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { Brand } from "@/components/brand";
import { redirectAuthenticatedUser } from "@/lib/auth/session";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  await redirectAuthenticatedUser();

  return (
    <main className="grid min-h-dvh bg-background lg:grid-cols-[minmax(360px,0.9fr)_1.1fr]">
      <section className="relative hidden overflow-hidden bg-[#062f24] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="pointer-events-none absolute inset-0 auth-grid opacity-30" />
        <div className="pointer-events-none absolute -right-24 top-1/4 size-96 rounded-full bg-emerald-400/15 blur-3xl" />
        <Brand className="relative text-white [&_span:last-child]:text-white" />

        <div className="relative max-w-xl">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs font-medium text-emerald-100">
            <Sparkles className="size-3.5" /> Claridad para cada colón
          </span>
          <h2 className="text-4xl font-medium leading-[1.12] tracking-[-0.04em] xl:text-5xl">
            Todo su dinero,
            <br />
            en una sola vista.
          </h2>
          <p className="mt-5 max-w-md text-base leading-7 text-emerald-100/70">
            Tours, proyectos web y finanzas personales conectados en un espacio privado.
          </p>
        </div>

        <div className="relative grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
            <ShieldCheck className="mb-3 size-5 text-emerald-300" />
            <p className="text-sm font-medium">Datos privados</p>
            <p className="mt-1 text-xs leading-5 text-emerald-100/55">Sesiones seguras y acceso aislado.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
            <TrendingUp className="mb-3 size-5 text-emerald-300" />
            <p className="text-sm font-medium">Decisiones claras</p>
            <p className="mt-1 text-xs leading-5 text-emerald-100/55">Información real, sin ruido contable.</p>
          </div>
        </div>
      </section>

      <section className="flex min-h-dvh flex-col px-5 py-6 sm:px-10 lg:px-14 xl:px-24">
        <Brand className="mb-12 lg:hidden" />
        <div className="flex flex-1 items-center justify-center py-8">{children}</div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          MyFinances · Su información financiera permanece privada.
        </p>
      </section>
    </main>
  );
}

