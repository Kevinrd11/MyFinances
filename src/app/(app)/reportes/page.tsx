import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Download,
  Landmark,
  Lightbulb,
  ReceiptText,
  Search,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { format, startOfMonth, subMonths, startOfYear } from "date-fns";
import { CashFlowChart, DistributionChart } from "@/components/dashboard/charts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth/session";
import { getReportData } from "@/lib/data/reports";
import { formatMoney } from "@/lib/finance/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Reportes" };

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function MetricCard({
  label,
  value,
  helper,
  change,
  icon: Icon,
  tone,
  invertChange = false,
}: {
  label: string;
  value: string;
  helper: string;
  change: number | null;
  icon: typeof TrendingUp;
  tone: "income" | "expense" | "neutral";
  invertChange?: boolean;
}) {
  const favorable = change !== null && (invertChange ? change <= 0 : change >= 0);
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</p>
          <p className="mt-2 truncate text-xl font-semibold tracking-[-0.025em] sm:text-2xl">
            {value}
          </p>
        </div>
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-xl",
            tone === "income" && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950",
            tone === "expense" && "bg-orange-50 text-orange-700 dark:bg-orange-950",
            tone === "neutral" && "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="size-4.5" />
        </span>
      </div>
      <div className="mt-3 flex min-h-5 items-center gap-1.5 text-xs">
        {change !== null && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-semibold",
              favorable ? "text-emerald-600" : "text-red-600",
            )}
          >
            {change >= 0 ? (
              <ArrowUpRight className="size-3.5" />
            ) : (
              <ArrowDownRight className="size-3.5" />
            )}
            {Math.abs(change).toFixed(1)} %
          </span>
        )}
        <span className="truncate text-muted-foreground">{helper}</span>
      </div>
    </Card>
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const query = await searchParams;
  const filters = {
    from: single(query.from),
    to: single(query.to),
    account: single(query.account),
  };
  const report = await getReportData(user, filters);
  const today = new Date();
  const preset = (start: Date, end = today) =>
    `/reportes?from=${format(start, "yyyy-MM-dd")}&to=${format(end, "yyyy-MM-dd")}`;
  const exportParams = new URLSearchParams({
    from: report.range.from,
    to: report.range.to,
    ...(report.selectedAccount ? { account: report.selectedAccount } : {}),
  });
  const maxSource = Math.max(...report.incomeSources.map((source) => source.value), 1);

  return (
    <div className="space-y-5 lg:space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
            Inteligencia financiera
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
            Reportes
          </h1>
          <p className="mt-1.5 text-sm capitalize text-muted-foreground">{report.range.label}</p>
        </div>
        <Button asChild variant="secondary">
          <Link href={`/reportes/exportar?${exportParams.toString()}`}>
            <Download className="size-4" /> Exportar CSV
          </Link>
        </Button>
      </section>

      <Card className="p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          <Link
            href={preset(startOfMonth(today))}
            className="rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            Este mes
          </Link>
          <Link
            href={preset(startOfMonth(subMonths(today, 2)))}
            className="rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            3 meses
          </Link>
          <Link
            href={preset(startOfMonth(subMonths(today, 5)))}
            className="rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            6 meses
          </Link>
          <Link
            href={preset(startOfYear(today))}
            className="rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            Este año
          </Link>
          <Link
            href={preset(startOfMonth(subMonths(today, 11)))}
            className="rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            12 meses
          </Link>
        </div>
        <form action="/reportes" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.2fr_auto]">
          <label>
            <span className="mb-1.5 block text-xs font-semibold">Desde</span>
            <Input name="from" type="date" defaultValue={report.range.from} required />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold">Hasta</span>
            <Input name="to" type="date" defaultValue={report.range.to} required />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold">Cuenta</span>
            <select
              name="account"
              defaultValue={report.selectedAccount}
              className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none focus:border-emerald-500"
            >
              <option value="">Todas las cuentas</option>
              {report.accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} · {account.currency}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" variant="secondary" className="self-end">
            <Search className="size-4" /> Aplicar
          </Button>
        </form>
      </Card>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard
          label="Ingresos"
          value={formatMoney(report.current.income, report.primaryCurrency)}
          helper="vs. periodo anterior"
          change={report.changes.income}
          icon={ArrowDownLeft}
          tone="income"
        />
        <MetricCard
          label="Gastos"
          value={formatMoney(report.current.expenses, report.primaryCurrency)}
          helper="vs. periodo anterior"
          change={report.changes.expenses}
          icon={ArrowUpRight}
          tone="expense"
          invertChange
        />
        <MetricCard
          label="Resultado neto"
          value={formatMoney(report.current.net, report.primaryCurrency)}
          helper="vs. periodo anterior"
          change={report.changes.net}
          icon={TrendingUp}
          tone={report.current.net >= 0 ? "income" : "expense"}
        />
        <MetricCard
          label="Balance disponible"
          value={formatMoney(report.totalBalance, report.primaryCurrency)}
          helper={`${report.accountBalances.length} cuenta${report.accountBalances.length === 1 ? "" : "s"}`}
          change={null}
          icon={WalletCards}
          tone="neutral"
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Tasa de ahorro</p>
          <p
            className={cn(
              "mt-1 text-xl font-semibold",
              report.savingsRate >= 0 ? "text-emerald-600" : "text-red-600",
            )}
          >
            {report.savingsRate.toFixed(1)} %
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Gasto diario promedio</p>
          <p className="mt-1 text-xl font-semibold">
            {formatMoney(report.averageDailyExpense, report.primaryCurrency)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Movimientos analizados</p>
          <p className="mt-1 text-xl font-semibold">{report.transactionCount}</p>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,.75fr)]">
        <Card className="min-w-0 p-4 sm:p-5">
          <div className="mb-4">
            <h2 className="font-semibold">Flujo de caja</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Ingresos y gastos agrupados por mes
            </p>
          </div>
          <div className="h-[300px] w-full">
            <CashFlowChart data={report.monthlyTrend} currency={report.primaryCurrency} />
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <h2 className="font-semibold">Gastos por categoría</h2>
          <p className="mt-1 text-xs text-muted-foreground">Distribución del periodo</p>
          <div className="mt-2 h-[210px]">
            <DistributionChart
              data={report.expenseDistribution}
              currency={report.primaryCurrency}
            />
          </div>
          <div className="mt-2 space-y-2">
            {report.expenseDistribution.slice(0, 4).map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="min-w-0 flex-1 truncate text-muted-foreground">{item.name}</span>
                <span className="font-semibold">
                  {formatMoney(item.value, report.primaryCurrency, true)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card className="p-4 sm:p-5">
          <h2 className="font-semibold">Fuentes de ingreso</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Origen de los ingresos registrados
          </p>
          <div className="mt-5 space-y-4">
            {report.incomeSources.map((source) => (
              <div key={source.key}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                  <span className="font-medium">{source.name}</span>
                  <span className="font-semibold">
                    {formatMoney(source.value, report.primaryCurrency)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(source.value / maxSource) * 100}%`,
                      backgroundColor: source.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-border p-4 sm:p-5">
            <h2 className="font-semibold">Actividad por cuenta</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Entradas y salidas del periodo
            </p>
          </div>
          {report.accountActivity.length ? (
            <div className="divide-y divide-border">
              {report.accountActivity.map((account) => (
                <div key={account.id} className="grid grid-cols-[1fr_auto] gap-3 px-4 py-3.5 sm:px-5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{account.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      +{formatMoney(account.income, report.primaryCurrency)} · −
                      {formatMoney(account.expenses, report.primaryCurrency)}
                    </p>
                  </div>
                  <p
                    className={cn(
                      "self-center text-sm font-semibold",
                      account.net >= 0 ? "text-emerald-600" : "text-red-600",
                    )}
                  >
                    {formatMoney(account.net, report.primaryCurrency)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-10 text-center text-xs text-muted-foreground">
              Sin actividad en las cuentas seleccionadas.
            </div>
          )}
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)]">
        <Card className="overflow-hidden">
          <div className="border-b border-border p-4 sm:p-5">
            <h2 className="font-semibold">Mayores gastos</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Los cinco movimientos de mayor impacto
            </p>
          </div>
          {report.largestExpenses.length ? (
            <div className="divide-y divide-border">
              {report.largestExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950">
                    <ReceiptText className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{expense.description}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {expense.category} · {expense.account}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {formatMoney(expense.amount, expense.currency)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {new Intl.DateTimeFormat("es-CR", {
                        day: "2-digit",
                        month: "short",
                      }).format(new Date(expense.date))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-10 text-center text-xs text-muted-foreground">
              No hay gastos en este periodo.
            </div>
          )}
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/65 p-4 dark:border-emerald-900 dark:bg-emerald-950/30 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white">
              <Lightbulb className="size-4.5" />
            </span>
            <div>
              <h2 className="font-semibold">Lecturas del periodo</h2>
              <div className="mt-3 space-y-3 text-xs leading-5 text-muted-foreground">
                {report.insights.map((insight) => (
                  <p key={insight}>{insight}</p>
                ))}
                {!report.insights.length && <p>No hay alertas importantes en este periodo.</p>}
              </div>
            </div>
          </div>
        </Card>
      </section>

      {report.transactionCount === 0 && (
        <Card className="px-5 py-10 text-center">
          <BarChart3 className="mx-auto size-7 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold">Este periodo todavía no tiene datos</p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
            Cambie las fechas o registre transacciones para generar análisis financieros.
          </p>
          <Button asChild size="sm" className="mt-4">
            <Link href="/transacciones?new=income">
              <Landmark className="size-4" /> Registrar movimiento
            </Link>
          </Button>
        </Card>
      )}
    </div>
  );
}
