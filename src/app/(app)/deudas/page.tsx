import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Landmark,
  Plus,
  ReceiptText,
  WalletCards,
  X,
} from "lucide-react";
import { differenceInCalendarDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { DebtActions } from "@/components/debts/debt-actions";
import { DebtForm } from "@/components/debts/debt-form";
import { DebtPaymentForm } from "@/components/debts/debt-payment-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getDebtsData, type DebtFilter } from "@/lib/data/debts";
import { formatMoney } from "@/lib/finance/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Deudas" };

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DebtsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const query = await searchParams;
  const requestedFilter = single(query.filter);
  const filter: DebtFilter =
    requestedFilter === "paid" || requestedFilter === "all" ? requestedFilter : "active";
  const data = await getDebtsData(user, filter);
  const paymentDebt = data.debts.find((debt) => debt.id === single(query.pay));
  const editDebt = data.debts.find(
    (debt) =>
      debt.id === single(query.edit) &&
      (debt.status === "ACTIVE" || debt.status === "OVERDUE"),
  );
  const newMode = single(query.new);
  const showNew = newMode === "payable" || newMode === "receivable" || newMode === "1";
  const newDirection = newMode === "receivable" ? "OWED_TO_ME" : "I_OWE";
  const created = single(query.created) === "1";
  const paid = single(query.paid) === "1";
  const updated = single(query.updated) === "1";
  const deleted = single(query.deleted) === "1";

  return (
    <div className="space-y-5 lg:space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
            Compromisos financieros
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
            Deudas
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Controle lo que debe, lo que le deben y cada abono.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link href="/deudas?new=receivable">
              <ArrowDownLeft className="size-4" /> Me deben
            </Link>
          </Button>
          <Button asChild>
            <Link href="/deudas?new=payable">
              <ArrowUpRight className="size-4" /> Yo debo
            </Link>
          </Button>
        </div>
      </section>

      {(created || paid || updated || deleted) && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/45 dark:text-emerald-300">
          <CheckCircle2 className="size-4 shrink-0" />
          {created
            ? "La deuda se guardó correctamente."
            : paid
              ? "El abono y su transacción se registraron correctamente."
              : updated
                ? "Los cambios de la deuda se guardaron correctamente."
                : "La deuda se eliminó correctamente."}
        </div>
      )}

      {(showNew || editDebt) && (
        <Card className="p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">
                {editDebt
                  ? "Editar deuda pendiente"
                  : newDirection === "OWED_TO_ME"
                  ? "Registrar dinero por cobrar"
                  : "Registrar deuda"}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {editDebt
                  ? "Actualice el monto, vencimiento, cuota, interés o información de referencia."
                  : newDirection === "OWED_TO_ME"
                  ? "Guarde quién le debe, cuánto falta por cobrar y la próxima fecha acordada."
                  : "Puede agregar cuotas, interés y vencimiento ahora o más adelante."}
              </p>
            </div>
            <Button asChild variant="ghost" size="icon" aria-label="Cerrar formulario">
              <Link href="/deudas">
                <X className="size-4" />
              </Link>
            </Button>
          </div>
          <DebtForm
            key={editDebt?.id ?? newDirection}
            defaultDirection={newDirection}
            debt={editDebt}
          />
        </Card>
      )}

      {paymentDebt && (
        <Card className="p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">
                {paymentDebt.direction === "I_OWE" ? "Registrar pago" : "Registrar cobro"}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {paymentDebt.person} · {formatMoney(paymentDebt.remaining, paymentDebt.currency)} pendiente
              </p>
            </div>
            <Button asChild variant="ghost" size="icon" aria-label="Cerrar formulario">
              <Link href="/deudas">
                <X className="size-4" />
              </Link>
            </Button>
          </div>
          {data.accounts.length ? (
            <DebtPaymentForm
              debt={paymentDebt}
              accounts={data.accounts}
              today={format(new Date(), "yyyy-MM-dd")}
            />
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/35">
              <div className="flex items-start gap-3">
                <WalletCards className="mt-0.5 size-5 shrink-0 text-amber-700" />
                <div>
                  <p className="text-sm font-semibold">Primero necesita una cuenta</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    El abono debe vincularse a la cuenta desde la que paga o en la que recibe el dinero.
                  </p>
                  <Button asChild size="sm" className="mt-3">
                    <Link href="/transacciones?new-account=1">Crear cuenta</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        <Card className="flex items-center gap-3 p-4 sm:p-5">
          <span className="grid size-10 place-items-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950">
            <ArrowUpRight className="size-4.5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Total que debe</p>
            <p className="mt-1 truncate text-lg font-semibold">
              {formatMoney(data.totals.payable, data.primaryCurrency)}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4 sm:p-5">
          <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950">
            <ArrowDownLeft className="size-4.5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Total por cobrar</p>
            <p className="mt-1 truncate text-lg font-semibold">
              {formatMoney(data.totals.receivable, data.primaryCurrency)}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4 sm:p-5">
          <span className="grid size-10 place-items-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950">
            <CalendarClock className="size-4.5" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">Vencen en 7 días</p>
            <p className="mt-1 text-lg font-semibold">{data.totals.dueSoon}</p>
          </div>
        </Card>
      </section>

      <div className="flex flex-wrap gap-2">
        {([
          ["active", "Activas"],
          ["paid", "Pagadas"],
          ["all", "Todas"],
        ] as const).map(([value, label]) => (
          <Link
            key={value}
            href={`/deudas?filter=${value}`}
            className={cn(
              "rounded-xl px-3.5 py-2 text-sm font-semibold transition",
              filter === value
                ? "bg-emerald-600 text-white"
                : "border border-border bg-surface text-muted-foreground hover:bg-muted",
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      {data.debts.length ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {data.debts.map((debt) => {
            const dueDays = debt.nextDueDate
              ? differenceInCalendarDays(new Date(debt.nextDueDate), new Date())
              : null;
            const overdue = dueDays !== null && dueDays < 0 && debt.status !== "PAID";
            const active = debt.status === "ACTIVE" || debt.status === "OVERDUE";

            return (
              <Card key={debt.id} className="overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-xl",
                        debt.direction === "I_OWE"
                          ? "bg-orange-50 text-orange-600 dark:bg-orange-950"
                          : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950",
                      )}
                    >
                      {debt.direction === "I_OWE" ? (
                        <ArrowUpRight className="size-4.5" />
                      ) : (
                        <ArrowDownLeft className="size-4.5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate font-semibold">{debt.person}</h2>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                            debt.status === "PAID"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                              : overdue
                                ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                                : "bg-muted text-muted-foreground",
                          )}
                        >
                          {debt.status === "PAID" ? "Pagada" : overdue ? "Vencida" : "Activa"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {debt.direction === "I_OWE" ? "Usted debe" : "Le deben"} ·{" "}
                        {formatMoney(debt.originalAmount, debt.currency)} original
                      </p>
                    </div>
                    {active && <DebtActions id={debt.id} />}
                  </div>

                  <div className="mt-5 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Saldo pendiente</p>
                      <p className="mt-1 text-2xl font-semibold">
                        {formatMoney(debt.remaining, debt.currency)}
                      </p>
                    </div>
                    <p className="text-right text-xs text-muted-foreground">
                      {Math.round(debt.progress)} % abonado
                    </p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        debt.direction === "I_OWE" ? "bg-orange-500" : "bg-emerald-600",
                      )}
                      style={{ width: `${debt.progress}%` }}
                    />
                  </div>

                  <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
                    <div className="rounded-xl bg-muted/55 p-3">
                      <span className="text-muted-foreground">Abonado</span>
                      <p className="mt-1 font-semibold">{formatMoney(debt.paid, debt.currency)}</p>
                    </div>
                    <div className="rounded-xl bg-muted/55 p-3">
                      <span className="text-muted-foreground">Próximo vencimiento</span>
                      <p className={cn("mt-1 font-semibold", overdue && "text-red-600")}>
                        {debt.nextDueDate
                          ? format(new Date(debt.nextDueDate), "d MMM yyyy", { locale: es })
                          : debt.status === "PAID"
                            ? "Completada"
                            : "Sin fecha"}
                      </p>
                    </div>
                  </div>

                  {(debt.installmentAmount || debt.interestRate) && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {debt.installmentAmount
                        ? `Cuota: ${formatMoney(debt.installmentAmount, debt.currency)}`
                        : ""}
                      {debt.installmentAmount && debt.interestRate ? " · " : ""}
                      {debt.interestRate ? `Interés: ${debt.interestRate} % anual` : ""}
                    </p>
                  )}

                  {active && (
                    <Button asChild variant="secondary" size="sm" className="mt-4 w-full">
                      <Link href={`/deudas?pay=${debt.id}`}>
                        <ReceiptText className="size-4" />
                        {debt.direction === "I_OWE" ? "Registrar pago" : "Registrar cobro"}
                      </Link>
                    </Button>
                  )}
                </div>

                {debt.payments.length > 0 && (
                  <div className="border-t border-border bg-muted/25 px-5 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      Últimos abonos
                    </p>
                    <div className="mt-3 space-y-2">
                      {debt.payments.slice(0, 3).map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between gap-3 text-xs">
                          <span className="text-muted-foreground">
                            {format(new Date(payment.date), "d MMM yyyy", { locale: es })}
                          </span>
                          <span className="font-semibold">
                            {formatMoney(payment.amount, debt.currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </section>
      ) : (
        <Card className="px-5 py-12 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted">
            {filter === "paid" ? (
              <CheckCircle2 className="size-5 text-muted-foreground" />
            ) : (
              <Landmark className="size-5 text-muted-foreground" />
            )}
          </span>
          <p className="mt-3 text-sm font-semibold">
            {filter === "paid" ? "Todavía no hay deudas pagadas" : "No hay deudas activas"}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
            Registre lo que debe o lo que le deben para dar seguimiento a saldos y vencimientos.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button asChild size="sm" variant="secondary">
              <Link href="/deudas?new=receivable">
                <ArrowDownLeft className="size-4" /> Me deben
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/deudas?new=payable">
                <Plus className="size-4" /> Yo debo
              </Link>
            </Button>
          </div>
        </Card>
      )}

      {data.totals.dueSoon > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/35">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-700" />
          <p>
            Tiene {data.totals.dueSoon} compromiso{data.totals.dueSoon === 1 ? "" : "s"} con
            vencimiento cercano. También puede revisarlo en el calendario.
          </p>
        </div>
      )}
    </div>
  );
}
