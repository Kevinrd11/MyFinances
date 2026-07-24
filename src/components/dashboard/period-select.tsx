"use client";

import { useRouter } from "next/navigation";
import { CalendarRange } from "lucide-react";
import type { DashboardPeriod } from "@/lib/data/dashboard";

export function PeriodSelect({ value }: { value: DashboardPeriod }) {
  const router = useRouter();
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Periodo del dashboard</span>
      <CalendarRange className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
      <select
        value={value}
        onChange={(event) => router.replace(`/inicio?period=${event.target.value}`)}
        className="h-10 appearance-none rounded-xl border border-border bg-surface py-0 pl-9 pr-8 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-emerald-500"
      >
        <option value="week">Esta semana</option>
        <option value="month">Este mes</option>
        <option value="previous-month">Mes anterior</option>
        <option value="three-months">Últimos tres meses</option>
        <option value="year">Este año</option>
      </select>
    </label>
  );
}

