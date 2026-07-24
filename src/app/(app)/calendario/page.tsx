import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Plus,
} from "lucide-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getCalendarData, type CalendarEvent } from "@/lib/data/calendar";
import { formatMoney } from "@/lib/finance/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Calendario financiero" };

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const toneStyles: Record<CalendarEvent["tone"], string> = {
  income: "bg-emerald-500",
  expense: "bg-orange-500",
  due: "bg-red-500",
  goal: "bg-violet-500",
  project: "bg-sky-500",
  tour: "bg-teal-500",
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const query = await searchParams;
  const data = await getCalendarData(user, single(query.month));
  const monthDate = parseISO(`${data.month}-01`);
  const calendarStart = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const today = format(new Date(), "yyyy-MM-dd");
  const requestedDay = single(query.day);
  const selectedDay =
    requestedDay && /^\d{4}-\d{2}-\d{2}$/.test(requestedDay) && requestedDay.startsWith(data.month)
      ? requestedDay
      : today.startsWith(data.month)
        ? today
        : `${data.month}-01`;
  const eventsByDay = new Map<string, CalendarEvent[]>();
  data.events.forEach((event) => {
    eventsByDay.set(event.date, [...(eventsByDay.get(event.date) ?? []), event]);
  });
  const selectedEvents = eventsByDay.get(selectedDay) ?? [];
  const previousMonth = format(addMonths(monthDate, -1), "yyyy-MM");
  const nextMonth = format(addMonths(monthDate, 1), "yyyy-MM");
  const incomeEvents = data.events.filter((event) => event.tone === "income").length;
  const attentionEvents = data.events.filter(
    (event) => event.tone === "due" || event.tone === "expense",
  ).length;

  return (
    <div className="space-y-5 lg:space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
            Agenda financiera
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
            Calendario
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Movimientos, cobros y vencimientos en un mismo lugar.
          </p>
        </div>
        <Button asChild>
          <Link href="/transacciones?new=income">
            <Plus className="size-4" /> Nueva transacción
          </Link>
        </Button>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Card className="flex items-center gap-3 p-4">
          <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950">
            <ArrowDownLeft className="size-4.5" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">Entradas</p>
            <p className="mt-0.5 font-semibold">{incomeEvents}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <span className="grid size-10 place-items-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950">
            <Clock3 className="size-4.5" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">Salidas y vencimientos</p>
            <p className="mt-0.5 font-semibold">{attentionEvents}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <span className="grid size-10 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950">
            <CalendarDays className="size-4.5" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">Eventos del mes</p>
            <p className="mt-0.5 font-semibold">{data.events.length}</p>
          </div>
        </Card>
      </section>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon" aria-label="Mes anterior">
              <Link href={`/calendario?month=${previousMonth}`}>
                <ChevronLeft className="size-4" />
              </Link>
            </Button>
            <h2 className="min-w-36 text-center text-base font-semibold capitalize">
              {format(monthDate, "MMMM yyyy", { locale: es })}
            </h2>
            <Button asChild variant="ghost" size="icon" aria-label="Mes siguiente">
              <Link href={`/calendario?month=${nextMonth}`}>
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link href={`/calendario?month=${today.slice(0, 7)}&day=${today}`}>Hoy</Link>
          </Button>
        </div>

        <div className="grid grid-cols-7 border-b border-border bg-muted/45">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
            <div
              key={day}
              className="px-1 py-2.5 text-center text-[10px] font-bold uppercase tracking-wide text-muted-foreground sm:text-xs"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDay.get(key) ?? [];
            const selected = key === selectedDay;
            const currentMonth = isSameMonth(day, monthDate);
            return (
              <Link
                key={key}
                href={`/calendario?month=${data.month}&day=${key}`}
                className={cn(
                  "min-h-20 border-b border-r border-border p-1.5 transition hover:bg-muted/55 sm:min-h-28 sm:p-2",
                  !currentMonth && "bg-muted/25 text-muted-foreground/50",
                  selected && "bg-emerald-50/70 ring-1 ring-inset ring-emerald-400 dark:bg-emerald-950/25",
                )}
              >
                <span
                  className={cn(
                    "grid size-6 place-items-center rounded-full text-xs font-semibold sm:size-7",
                    key === today && "bg-emerald-600 text-white",
                  )}
                >
                  {format(day, "d")}
                </span>
                <div className="mt-1 flex flex-wrap gap-1 sm:block sm:space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div key={event.id}>
                      <span
                        className={cn(
                          "block size-1.5 rounded-full sm:hidden",
                          toneStyles[event.tone],
                        )}
                      />
                      <div className="hidden items-center gap-1.5 truncate rounded-md bg-muted/75 px-1.5 py-1 text-[10px] sm:flex">
                        <span className={cn("size-1.5 shrink-0 rounded-full", toneStyles[event.tone])} />
                        <span className="truncate">{event.title}</span>
                      </div>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="hidden text-[9px] text-muted-foreground sm:block">
                      +{dayEvents.length - 3} más
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </Card>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Card className="overflow-hidden">
          <div className="border-b border-border px-4 py-4 sm:px-5">
            <h2 className="font-semibold capitalize">
              {format(parseISO(selectedDay), "EEEE d 'de' MMMM", { locale: es })}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {selectedEvents.length} evento{selectedEvents.length === 1 ? "" : "s"}
            </p>
          </div>
          {selectedEvents.length ? (
            <div className="divide-y divide-border">
              {selectedEvents.map((event) => (
                <Link
                  key={event.id}
                  href={event.href}
                  className="flex items-center gap-3 px-4 py-4 transition hover:bg-muted/45 sm:px-5"
                >
                  <span className={cn("size-2.5 shrink-0 rounded-full", toneStyles[event.tone])} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{event.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{event.detail}</p>
                  </div>
                  {event.amount !== undefined && event.currency && (
                    <p className="text-sm font-semibold">
                      {formatMoney(event.amount, event.currency)}
                    </p>
                  )}
                  {event.tone === "income" ? (
                    <ArrowDownLeft className="size-4 text-emerald-600" />
                  ) : event.tone === "expense" || event.tone === "due" ? (
                    <ArrowUpRight className="size-4 text-orange-600" />
                  ) : (
                    <CircleDollarSign className="size-4 text-muted-foreground" />
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-5 py-10 text-center">
              <CalendarDays className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">Día libre de compromisos financieros</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Seleccione otra fecha o registre un movimiento.
              </p>
            </div>
          )}
        </Card>

        <Card className="p-4 sm:p-5">
          <h2 className="text-sm font-semibold">Tipos de evento</h2>
          <div className="mt-4 space-y-3 text-xs text-muted-foreground">
            {[
              ["income", "Ingresos y cobros"],
              ["expense", "Gastos"],
              ["due", "Pagos y vencimientos"],
              ["goal", "Metas de ahorro"],
              ["project", "Proyectos web"],
              ["tour", "Tours"],
            ].map(([tone, label]) => (
              <div key={tone} className="flex items-center gap-2">
                <span
                  className={cn(
                    "size-2.5 rounded-full",
                    toneStyles[tone as CalendarEvent["tone"]],
                  )}
                />
                {label}
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
