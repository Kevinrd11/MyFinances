import {
  addMonths,
  endOfMonth,
  format,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from "date-fns";
import { es } from "date-fns/locale";
import { db } from "@/lib/db";
import { convertMoney, type SupportedCurrency } from "@/lib/finance/format";
import { calculateAccountBalance } from "@/lib/finance/ledger";
import type { SafeUser } from "@/lib/auth/types";

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

export type DashboardPeriod = "week" | "month" | "previous-month" | "three-months" | "year";

export async function getDashboardData(user: SafeUser, period: DashboardPeriod = "month") {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const nextMonthStart = addMonths(monthStart, 1);
  const periodRange = (() => {
    if (period === "week") {
      const start = startOfWeek(now, { weekStartsOn: 1 });
      return { start, end: now, previousStart: subDays(start, 7), previousEnd: start, label: "esta semana" };
    }
    if (period === "previous-month") {
      const start = subMonths(monthStart, 1);
      return { start, end: monthStart, previousStart: subMonths(start, 1), previousEnd: start, label: format(start, "MMMM yyyy", { locale: es }) };
    }
    if (period === "three-months") {
      const start = startOfMonth(subMonths(now, 2));
      return { start, end: now, previousStart: subMonths(start, 3), previousEnd: start, label: "últimos tres meses" };
    }
    if (period === "year") {
      const start = startOfYear(now);
      return { start, end: now, previousStart: subYears(start, 1), previousEnd: start, label: format(now, "yyyy") };
    }
    return {
      start: monthStart,
      end: now,
      previousStart: subMonths(monthStart, 1),
      previousEnd: monthStart,
      label: format(monthStart, "MMMM yyyy", { locale: es }),
    };
  })();
  const trendStart = startOfMonth(subMonths(now, 5));
  const queryStart = periodRange.previousStart < trendStart ? periodRange.previousStart : trendStart;

  const [profile, accounts, transactions, budgets, goals, debts, pendingTours, activeProjects] =
    await db.$transaction(async (transaction) => {
      await transaction.$queryRaw`SELECT set_config('app.current_user_id', ${user.id}, true)`;
      return Promise.all([
      transaction.user.findUniqueOrThrow({
        where: { id: user.id },
        select: { defaultExchangeRate: true },
      }),
      transaction.account.findMany({
        where: { userId: user.id, isArchived: false },
        select: {
          id: true,
          name: true,
          type: true,
          currency: true,
          color: true,
          initialBalance: true,
          transactions: {
            where: { deletedAt: null },
            select: { amount: true, type: true, transferDirection: true },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      transaction.transaction.findMany({
        where: { userId: user.id, deletedAt: null, date: { gte: queryStart, lt: nextMonthStart } },
        select: {
          id: true,
          amount: true,
          currency: true,
          exchangeRate: true,
          type: true,
          transferDirection: true,
          date: true,
          description: true,
          source: true,
          category: { select: { name: true, color: true } },
          account: { select: { name: true } },
        },
        orderBy: { date: "desc" },
      }),
      transaction.budget.findMany({
        where: { userId: user.id, month: { gte: monthStart, lt: nextMonthStart } },
        select: { amount: true, currency: true, categoryId: true },
      }),
      transaction.savingsGoal.findMany({
        where: { userId: user.id, isCompleted: false },
        select: {
          id: true,
          name: true,
          targetAmount: true,
          currency: true,
          contributions: { select: { amount: true } },
        },
        orderBy: { deadline: "asc" },
        take: 3,
      }),
      transaction.debt.findMany({
        where: {
          userId: user.id,
          direction: "I_OWE",
          status: { in: ["ACTIVE", "OVERDUE"] },
        },
        select: {
          originalAmount: true,
          currency: true,
          payments: { select: { amount: true } },
        },
      }),
      transaction.tour.count({ where: { userId: user.id, paymentStatus: { in: ["PENDING", "PARTIAL", "OVERDUE"] } } }),
      transaction.webProject.count({
        where: {
          userId: user.id,
          deletedAt: null,
          status: { in: ["APPROVED", "IN_PROGRESS", "WAITING_CLIENT", "DELIVERED"] },
        },
      }),
      ]);
    });

  const primaryCurrency = user.primaryCurrency as SupportedCurrency;
  const defaultRate = Number(profile.defaultExchangeRate);
  const toPrimary = (amount: number, currency: SupportedCurrency, rate?: number | null) =>
    convertMoney(amount, currency, primaryCurrency, rate || defaultRate);

  const accountData = accounts.map((account) => {
    const balance = calculateAccountBalance(
      Number(account.initialBalance),
      account.transactions.map((transaction) => ({
        amount: Number(transaction.amount),
        type: transaction.type,
        transferDirection: transaction.transferDirection,
      })),
    );
    return {
      id: account.id,
      name: account.name,
      type: account.type,
      currency: account.currency as SupportedCurrency,
      color: account.color,
      balance,
      consolidated: toPrimary(balance, account.currency as SupportedCurrency),
    };
  });

  const financialTransactions = transactions.filter((transaction) =>
    transaction.type === "INCOME" || transaction.type === "EXPENSE",
  );
  const value = (transaction: (typeof transactions)[number]) =>
    toPrimary(
      Number(transaction.amount),
      transaction.currency as SupportedCurrency,
      transaction.exchangeRate ? Number(transaction.exchangeRate) : null,
    );

  function totalsBetween(start: Date, end: Date) {
    const inPeriod = financialTransactions.filter((transaction) => transaction.date >= start && transaction.date < end);
    const income = inPeriod.filter((transaction) => transaction.type === "INCOME").reduce((sum, transaction) => sum + value(transaction), 0);
    const expenses = inPeriod.filter((transaction) => transaction.type === "EXPENSE").reduce((sum, transaction) => sum + value(transaction), 0);
    return { income, expenses, net: income - expenses };
  }

  const current = totalsBetween(periodRange.start, periodRange.end);
  const previous = totalsBetween(periodRange.previousStart, periodRange.previousEnd);
  const netChange = previous.net === 0 ? null : ((current.net - previous.net) / Math.abs(previous.net)) * 100;

  const monthlyTrend = Array.from({ length: 6 }, (_, index) => {
    const date = addMonths(trendStart, index);
    const totals = totalsBetween(startOfMonth(date), addMonths(startOfMonth(date), 1));
    return {
      month: format(date, "MMM", { locale: es }).replace(".", ""),
      Ingresos: Math.round(totals.income),
      Gastos: Math.round(totals.expenses),
    };
  });

  const selectedExpenses = financialTransactions.filter(
    (transaction) =>
      transaction.type === "EXPENSE" &&
      transaction.date >= periodRange.start &&
      transaction.date < periodRange.end,
  );
  const expenseMap = new Map<string, { name: string; value: number; color: string }>();
  for (const transaction of selectedExpenses) {
    const name = transaction.category?.name ?? "Sin categoría";
    const currentValue = expenseMap.get(name);
    expenseMap.set(name, {
      name,
      value: (currentValue?.value ?? 0) + value(transaction),
      color: transaction.category?.color ?? "#94a3b8",
    });
  }

  const selectedIncome = financialTransactions.filter(
    (transaction) =>
      transaction.type === "INCOME" &&
      transaction.date >= periodRange.start &&
      transaction.date < periodRange.end,
  );
  const incomeSources = [
    { key: "TOURS", name: "Tours", color: "#059669" },
    { key: "WEB_PROJECTS", name: "Páginas web", color: "#0d9488" },
    { key: "OTHER", name: "Otros", color: "#84cc16" },
  ].map((source) => ({
    ...source,
    value: selectedIncome
      .filter((transaction) =>
        source.key === "OTHER"
          ? transaction.source !== "TOURS" && transaction.source !== "WEB_PROJECTS"
          : transaction.source === source.key,
      )
      .reduce((sum, transaction) => sum + value(transaction), 0),
  }));

  const currentMonthExpenses = financialTransactions.filter(
    (transaction) => transaction.type === "EXPENSE" && transaction.date >= monthStart,
  );
  const budgeted = budgets.reduce(
    (sum, budget) => sum + toPrimary(Number(budget.amount), budget.currency as SupportedCurrency),
    0,
  );
  const budgetSpent = currentMonthExpenses.reduce((sum, transaction) => sum + value(transaction), 0);

  const goalData = goals.map((goal) => {
    const saved = goal.contributions.reduce((sum, contribution) => sum + Number(contribution.amount), 0);
    const target = Number(goal.targetAmount);
    return {
      id: goal.id,
      name: goal.name,
      currency: goal.currency as SupportedCurrency,
      saved,
      target,
      progress: target > 0 ? Math.min((saved / target) * 100, 100) : 0,
    };
  });

  const debtBalance = debts.reduce((sum, debt) => {
    const paid = debt.payments.reduce((total, payment) => total + Number(payment.amount), 0);
    return sum + toPrimary(Math.max(Number(debt.originalAmount) - paid, 0), debt.currency as SupportedCurrency);
  }, 0);

  const latestTransactions = transactions.slice(0, 7).map((transaction) => ({
    id: transaction.id,
    description: transaction.description,
    account: transaction.account.name,
    category: transaction.category?.name ?? (transaction.type === "TRANSFER" ? "Transferencia" : "Sin categoría"),
    date: transaction.date.toISOString(),
    type: transaction.type,
    amount: Number(transaction.amount),
    currency: transaction.currency as SupportedCurrency,
  }));

  const totalBalance = accountData.reduce((sum, account) => sum + account.consolidated, 0);
  const toursIncome = incomeSources.find((source) => source.key === "TOURS")?.value ?? 0;
  const webIncome = incomeSources.find((source) => source.key === "WEB_PROJECTS")?.value ?? 0;

  const insights: { tone: "positive" | "warning" | "neutral"; text: string }[] = [];
  if (current.expenses > previous.expenses && previous.expenses > 0) {
    insights.push({ tone: "warning", text: "Sus gastos aumentaron frente al mes anterior." });
  }
  if (pendingTours > 0) {
    insights.push({ tone: "warning", text: `Tiene ${pendingTours} pago${pendingTours === 1 ? "" : "s"} de tours pendiente${pendingTours === 1 ? "" : "s"}.` });
  }
  if (budgeted > 0 && budgetSpent / budgeted >= 0.75) {
    insights.push({ tone: "warning", text: "Ya utilizó al menos 75 % de su presupuesto mensual." });
  }
  if (toursIncome > webIncome && toursIncome > 0) {
    insights.push({ tone: "positive", text: "Este mes los tours generan más ingresos que los proyectos web." });
  }
  if (insights.length === 0) {
    insights.push({
      tone: "neutral",
      text: financialTransactions.length === 0
        ? "Registre su primera transacción para comenzar a recibir información útil."
        : "Sus finanzas no presentan alertas importantes en este momento.",
    });
  }

  return {
    primaryCurrency,
    periodLabel: periodRange.label,
    totalBalance,
    current,
    previous,
    netChange,
    accounts: accountData,
    monthlyTrend,
    expenseDistribution: [...expenseMap.values()].sort((a, b) => b.value - a.value),
    incomeSources,
    budget: {
      budgeted,
      spent: budgetSpent,
      progress: budgeted > 0 ? Math.min((budgetSpent / budgeted) * 100, 120) : 0,
    },
    goals: goalData,
    debtBalance,
    pendingTours,
    activeProjects,
    latestTransactions,
    toursIncome,
    webIncome,
    insights,
    netWorthSeries: monthlyTrend.map((point, index) => ({
      month: point.month,
      Patrimonio: Math.round(totalBalance - current.net + monthlyTrend.slice(0, index + 1).reduce((sum, item) => sum + item.Ingresos - item.Gastos, 0)),
    })),
    monthEnd: endOfMonth(now).toISOString(),
  };
}
