import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function ModulePlaceholder({
  title,
  description,
  phase,
  icon: Icon,
}: {
  title: string;
  description: string;
  phase: number;
  icon: LucideIcon;
}) {
  return (
    <div className="mx-auto max-w-3xl pt-4 sm:pt-12">
      <Card className="relative overflow-hidden p-6 sm:p-10">
        <div className="absolute -right-16 -top-16 size-48 rounded-full bg-emerald-100/60 blur-3xl dark:bg-emerald-900/30" />
        <div className="relative">
          <span className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            <Icon className="size-5.5" />
          </span>
          <p className="mt-7 text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Fase {phase}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{title}</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
          <div className="mt-7 flex items-center gap-2 rounded-xl border border-border bg-muted/55 p-3 text-xs text-muted-foreground">
            <LockKeyhole className="size-4 shrink-0 text-emerald-600" />
            La ruta ya está protegida. Sus datos se integrarán aquí sin alterar el libro financiero.
          </div>
          <Button asChild variant="secondary" className="mt-6">
            <Link href="/inicio"><ArrowLeft className="size-4" /> Volver al dashboard</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}

