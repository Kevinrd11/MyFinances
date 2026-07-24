import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CircleAlert,
  Landmark,
  Lightbulb,
  Map,
  Plus,
  ReceiptText,
  Target,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { CashFlowChart, DistributionChart } from "@/components/dashboard/charts";
import { PeriodSelect } from "@/components/dashboard/period-select";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { DashboardData, DashboardPeriod } from "@/lib/data/dashboard";
import { formatMoney } from "@/lib/finance/format";
import { cn } from "@/lib/utils";

function SectionTitle({ title, link, href }: { title: string; link?: string; href?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      {link && href && <Link href={href} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400">{link}<ArrowRight className="size-3.5" /></Link>}
    </div>
  );
}

export function DashboardContent({ data, period }: { data: DashboardData; period: DashboardPeriod }) {
  const incomeChange = data.previous.income > 0 ? ((data.current.income - data.previous.income) / data.previous.income) * 100 : null;
  const expenseChange = data.previous.expenses > 0 ? ((data.current.expenses - data.previous.expenses) / data.previous.expenses) * 100 : null;
  const hasTransactions = data.latestTransactions.length > 0;

  return (
    <div className="space-y-5 lg:space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Resumen financiero</p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">Su dinero, con claridad.</h1>
          <p className="mt-1.5 text-sm capitalize text-muted-foreground">{data.periodLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <PeriodSelect value={period} />
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/transacciones?new=income"><Plus className="size-4" /> Registrar</Link>
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard label="Balance disponible" value={formatMoney(data.totalBalance, data.primaryCurrency)} helper={`${data.accounts.length} cuenta${data.accounts.length === 1 ? "" : "s"}`} icon={WalletCards} />
        <SummaryCard label="Ingresos" value={formatMoney(data.current.income, data.primaryCurrency)} helper="vs. periodo anterior" change={incomeChange} icon={ArrowDownLeft} tone="income" />
        <SummaryCard label="Gastos" value={formatMoney(data.current.expenses, data.primaryCurrency)} helper="vs. periodo anterior" change={expenseChange} icon={ArrowUpRight} tone="expense" />
        <SummaryCard label="Ganancia neta" value={formatMoney(data.current.net, data.primaryCurrency)} helper="vs. periodo anterior" change={data.netChange} icon={TrendingUp} tone={data.current.net >= 0 ? "income" : "expense"} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,.75fr)]">
        <Card className="min-w-0 p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Ingresos y gastos</h2>
              <p className="mt-1 text-xs text-muted-foreground">Evolución de los últimos seis meses</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-600" />Ingresos</span>
              <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-orange-500" />Gastos</span>
            </div>
          </div>
          <div className="h-[270px] w-full"><CashFlowChart data={data.monthlyTrend} currency={data.primaryCurrency} /></div>
        </Card>

        <Card className="p-4 sm:p-5">
          <SectionTitle title="Gastos por categoría" link="Ver reporte" href="/reportes" />
          <div className="mt-2 grid grid-cols-[140px_1fr] items-center gap-2 xl:grid-cols-1">
            <div className="h-[175px]"><DistributionChart data={data.expenseDistribution} currency={data.primaryCurrency} /></div>
            <div className="space-y-2.5">
              {data.expenseDistribution.slice(0, 4).map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">{item.name}</span>
                  <span className="font-semibold">{formatMoney(item.value, data.primaryCurrency, true)}</span>
                </div>
              ))}
              {data.expenseDistribution.length === 0 && <p className="text-xs leading-5 text-muted-foreground">Aún no hay gastos en este periodo.</p>}
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <Card className="p-4 sm:p-5">
          <SectionTitle title="Fuentes de ingreso" link="Analizar" href="/reportes" />
          <div className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/45">
                <Map className="mb-3 size-5 text-emerald-700 dark:text-emerald-400" />
                <p className="text-xs text-muted-foreground">Tours</p>
                <p className="mt-1 text-lg font-semibold">{formatMoney(data.toursIncome, data.primaryCurrency, true)}</p>
              </div>
              <div className="rounded-2xl bg-teal-50 p-4 dark:bg-teal-950/45">
                <BriefcaseBusiness className="mb-3 size-5 text-teal-700 dark:text-teal-400" />
                <p className="text-xs text-muted-foreground">Páginas web</p>
                <p className="mt-1 text-lg font-semibold">{formatMoney(data.webIncome, data.primaryCurrency, true)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
              <span className="text-muted-foreground">Actividad en curso</span>
              <span className="font-semibold">{data.activeProjects} proyecto{data.activeProjects === 1 ? "" : "s"}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <SectionTitle title="Presupuesto mensual" link="Administrar" href="/presupuestos" />
          <div className="mt-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-2xl font-semibold">{data.budget.budgeted > 0 ? `${Math.round(data.budget.progress)} %` : "Sin definir"}</p>
                <p className="mt-1 text-xs text-muted-foreground">utilizado este mes</p>
              </div>
              <GaugeLabel progress={data.budget.progress} />
            </div>
            <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full rounded-full transition-all", data.budget.progress >= 100 ? "bg-red-500" : data.budget.progress >= 75 ? "bg-amber-500" : "bg-emerald-600")} style={{ width: `${Math.min(data.budget.progress, 100)}%` }} />
            </div>
            <div className="mt-3 flex justify-between text-xs text-muted-foreground">
              <span>{formatMoney(data.budget.spent, data.primaryCurrency)} gastado</span>
              <span>{formatMoney(data.budget.budgeted, data.primaryCurrency)} asignado</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <SectionTitle title="Panorama pendiente" link="Revisar" href="/deudas" />
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3 rounded-xl bg-muted/65 p-3">
              <span className="grid size-9 place-items-center rounded-xl bg-surface text-red-500"><Landmark className="size-4.5" /></span>
              <div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">Deudas pendientes</p><p className="mt-0.5 font-semibold">{formatMoney(data.debtBalance, data.primaryCurrency)}</p></div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-muted/65 p-3">
              <span className="grid size-9 place-items-center rounded-xl bg-surface text-amber-500"><CircleAlert className="size-4.5" /></span>
              <div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">Pagos de tours</p><p className="mt-0.5 font-semibold">{data.pendingTours} pendiente{data.pendingTours === 1 ? "" : "s"}</p></div>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,.75fr)]">
        <Card className="overflow-hidden">
          <div className="p-4 pb-2 sm:p-5 sm:pb-3"><SectionTitle title="Últimas transacciones" link="Ver todas" href="/transacciones" /></div>
          {hasTransactions ? (
            <div className="divide-y divide-border">
              {data.latestTransactions.map((transaction) => {
                const income = transaction.type === "INCOME" || (transaction.type === "TRANSFER" && transaction.amount > 0);
                return (
                  <div key={transaction.id} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                    <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", income ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950" : "bg-orange-50 text-orange-600 dark:bg-orange-950")}>
                      {income ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{transaction.description}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{transaction.category} · {transaction.account}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-sm font-semibold", income ? "text-emerald-600" : "text-foreground")}>{income ? "+" : "−"}{formatMoney(transaction.amount, transaction.currency)}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{new Intl.DateTimeFormat("es-CR", { day: "2-digit", month: "short" }).format(new Date(transaction.date))}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-10 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted"><ReceiptText className="size-5 text-muted-foreground" /></span>
              <p className="mt-3 text-sm font-semibold">Todavía no hay movimientos</p>
              <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-muted-foreground">Registre un ingreso o gasto para que su dashboard cobre vida.</p>
              <Button asChild size="sm" className="mt-4"><Link href="/transacciones?new=income"><Plus className="size-4" /> Primera transacción</Link></Button>
            </div>
          )}
        </Card>

        <div className="space-y-5">
          <Card className="p-4 sm:p-5">
            <SectionTitle title="Metas de ahorro" link="Ver metas" href="/metas" />
            <div className="mt-4 space-y-4">
              {data.goals.map((goal) => (
                <div key={goal.id}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                    <span className="truncate font-medium">{goal.name}</span>
                    <span className="font-semibold text-emerald-600">{Math.round(goal.progress)} %</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${goal.progress}%` }} /></div>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">{formatMoney(goal.saved, goal.currency)} de {formatMoney(goal.target, goal.currency)}</p>
                </div>
              ))}
              {data.goals.length === 0 && (
                <div className="py-3 text-center">
                  <Target className="mx-auto size-6 text-muted-foreground" />
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">Cree una meta para visualizar su progreso.</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900 dark:bg-emerald-950/35 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white"><Lightbulb className="size-4.5" /></span>
              <div>
                <h2 className="text-sm font-semibold">Información útil</h2>
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{data.insights[0].text}</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <div className="fixed bottom-20 right-4 z-20 sm:hidden">
        <Button asChild size="icon" className="size-12 rounded-full shadow-lg">
          <Link href="/transacciones?new=income" aria-label="Registrar transacción"><Plus className="size-5" /></Link>
        </Button>
      </div>
    </div>
  );
}

function GaugeLabel({ progress }: { progress: number }) {
  if (progress === 0) return <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">Pendiente</span>;
  if (progress >= 100) return <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">Superado</span>;
  if (progress >= 75) return <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">Atención</span>;
  return <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Normal</span>;
}
