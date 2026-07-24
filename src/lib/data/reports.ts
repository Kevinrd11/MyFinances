import {
  addDays,
  addMonths,
  eachMonthOfInterval,
  format,
  isAfter,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { db } from "@/lib/db";
import type { SafeUser } from "@/lib/auth/types";
import { convertMoney, type SupportedCurrency } from "@/lib/finance/format";
import { calculateAccountBalance } from "@/lib/finance/ledger";

export type ReportFilters = {
  account?: string;
  from?: string;
  to?: string;
};

function validDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = parseISO(value);
  return isValid(date) ? startOfDay(date) : null;
}

export function resolveReportRange(filters: ReportFilters) {
  const today = startOfDay(new Date());
  let start = validDate(filters.from) ?? startOfMonth(subMonths(today, 5));
  let end = validDate(filters.to) ?? today;

  if (isAfter(start, end)) [start, end] = [end, start];
  const earliest = subMonths(end, 59);
  if (start < earliest) start = earliest;

  const endExclusive = addDays(end, 1);
  const duration = endExclusive.getTime() - start.getTime();
  const previousEnd = start;
  const previousStart = new Date(start.getTime() - duration);

  return {
    start,
    end,
    endExclusive,
    previousStart,
    previousEnd,
    from: format(start, "yyyy-MM-dd"),
    to: format(end, "yyyy-MM-dd"),
    label: `${format(start, "d MMM yyyy", { locale: es })} – ${format(end, "d MMM yyyy", { locale: es })}`,
  };
}

export async function getReportData(user: SafeUser, filters: ReportFilters) {
  const range = resolveReportRange(filters);
  const [profile, accounts, transactions] = await db.$transaction(async (transaction) => {
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
        orderBy: [{ name: "asc" }],
      }),
      transaction.transaction.findMany({
        where: {
          userId: user.id,
          deletedAt: null,
          date: { gte: range.previousStart, lt: range.endExclusive },
          type: { in: ["INCOME", "EXPENSE"] },
          ...(filters.account ? { accountId: filters.account } : {}),
        },
        select: {
          id: true,
          amount: true,
          currency: true,
          exchangeRate: true,
          convertedAmount: true,
          date: true,
          type: true,
          description: true,
          source: true,
          paymentMethod: true,
          notes: true,
          account: { select: { id: true, name: true } },
          category: { select: { name: true, color: true } },
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      }),
    ]);
  });

  const primaryCurrency = user.primaryCurrency as SupportedCurrency;
  const defaultRate = Number(profile.defaultExchangeRate);
  const value = (transaction: (typeof transactions)[number]) =>
    convertMoney(
      Number(transaction.amount),
      transaction.currency as SupportedCurrency,
      primaryCurrency,
      transaction.exchangeRate ? Number(transaction.exchangeRate) : defaultRate,
    );
  const currentTransactions = transactions.filter(
    (transaction) => transaction.date >= range.start && transaction.date < range.endExclusive,
  );
  const previousTransactions = transactions.filter(
    (transaction) =>
      transaction.date >= range.previousStart && transaction.date < range.previousEnd,
  );

  function totals(items: typeof transactions) {
    const income = items
      .filter((transaction) => transaction.type === "INCOME")
      .reduce((sum, transaction) => sum + value(transaction), 0);
    const expenses = items
      .filter((transaction) => transaction.type === "EXPENSE")
      .reduce((sum, transaction) => sum + value(transaction), 0);
    return { income, expenses, net: income - expenses };
  }

  const current = totals(currentTransactions);
  const previous = totals(previousTransactions);
  const change = (now: number, before: number) =>
    before === 0 ? null : ((now - before) / Math.abs(before)) * 100;

  const expenseMap = new Map<string, { name: string; value: number; color: string }>();
  const incomeMap = new Map<string, { name: string; value: number; color: string }>();
  const accountMap = new Map<
    string,
    { id: string; name: string; income: number; expenses: number; net: number }
  >();

  for (const transaction of currentTransactions) {
    const amount = value(transaction);
    const categoryName = transaction.category?.name ?? "Sin categoría";
    const categoryColor = transaction.category?.color ?? "#94a3b8";
    const targetMap = transaction.type === "INCOME" ? incomeMap : expenseMap;
    const currentCategory = targetMap.get(categoryName);
    targetMap.set(categoryName, {
      name: categoryName,
      value: (currentCategory?.value ?? 0) + amount,
      color: categoryColor,
    });

    const accountItem = accountMap.get(transaction.account.id) ?? {
      id: transaction.account.id,
      name: transaction.account.name,
      income: 0,
      expenses: 0,
      net: 0,
    };
    if (transaction.type === "INCOME") accountItem.income += amount;
    else accountItem.expenses += amount;
    accountItem.net = accountItem.income - accountItem.expenses;
    accountMap.set(transaction.account.id, accountItem);
  }

  const monthStarts = eachMonthOfInterval({ start: range.start, end: range.end });
  const monthlyTrend = monthStarts.map((month) => {
    const nextMonth = addMonths(month, 1);
    const monthItems = currentTransactions.filter(
      (transaction) => transaction.date >= month && transaction.date < nextMonth,
    );
    const monthTotals = totals(monthItems);
    return {
      month: format(month, monthStarts.length > 12 ? "MMM yy" : "MMM", { locale: es }).replace(".", ""),
      Ingresos: Math.round(monthTotals.income),
      Gastos: Math.round(monthTotals.expenses),
      net: monthTotals.net,
    };
  });

  const sourceDefinitions = [
    { key: "TOURS", name: "Tours", color: "#059669" },
    { key: "WEB_PROJECTS", name: "Páginas web", color: "#0d9488" },
    { key: "SALARY", name: "Salario", color: "#3b82f6" },
    { key: "OTHER", name: "Otros", color: "#84cc16" },
  ];
  const incomeTransactions = currentTransactions.filter((item) => item.type === "INCOME");
  const incomeSources = sourceDefinitions.map((source) => ({
    ...source,
    value: incomeTransactions
      .filter((transaction) =>
        source.key === "OTHER"
          ? !transaction.source || transaction.source === "OTHER"
          : transaction.source === source.key,
      )
      .reduce((sum, transaction) => sum + value(transaction), 0),
  }));

  const accountBalances = accounts.map((account) => {
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
      currency: account.currency as SupportedCurrency,
      color: account.color,
      balance,
      consolidated: convertMoney(
        balance,
        account.currency as SupportedCurrency,
        primaryCurrency,
        defaultRate,
      ),
    };
  });

  const days = Math.max(
    Math.ceil((range.endExclusive.getTime() - range.start.getTime()) / 86_400_000),
    1,
  );
  const sortedExpenses = currentTransactions
    .filter((transaction) => transaction.type === "EXPENSE")
    .map((transaction) => ({
      id: transaction.id,
      description: transaction.description,
      category: transaction.category?.name ?? "Sin categoría",
      account: transaction.account.name,
      date: transaction.date.toISOString(),
      amount: Number(transaction.amount),
      currency: transaction.currency as SupportedCurrency,
      primaryValue: value(transaction),
    }))
    .sort((a, b) => b.primaryValue - a.primaryValue);

  const savingsRate = current.income > 0 ? (current.net / current.income) * 100 : 0;
  const expenseDistribution = [...expenseMap.values()].sort((a, b) => b.value - a.value);
  const incomeDistribution = [...incomeMap.values()].sort((a, b) => b.value - a.value);
  const accountActivity = [...accountMap.values()].sort(
    (a, b) => b.income + b.expenses - (a.income + a.expenses),
  );
  const totalBalance = accountBalances.reduce((sum, account) => sum + account.consolidated, 0);

  const insights: string[] = [];
  if (current.income === 0 && current.expenses === 0) {
    insights.push("No hay movimientos en el periodo seleccionado.");
  } else {
    if (savingsRate >= 20) insights.push(`Ahorró ${Math.round(savingsRate)} % de sus ingresos en este periodo.`);
    if (savingsRate < 0) insights.push("Los gastos superaron los ingresos en el periodo seleccionado.");
    if (expenseDistribution[0]) {
      insights.push(
        `${expenseDistribution[0].name} fue su categoría de mayor gasto con ${Math.round(
          (expenseDistribution[0].value / Math.max(current.expenses, 1)) * 100,
        )} % del total.`,
      );
    }
    if (previous.expenses > 0 && current.expenses < previous.expenses) {
      insights.push("Sus gastos disminuyeron frente al periodo anterior comparable.");
    }
  }

  return {
    range: {
      from: range.from,
      to: range.to,
      label: range.label,
    },
    selectedAccount: filters.account ?? "",
    primaryCurrency,
    current,
    previous,
    changes: {
      income: change(current.income, previous.income),
      expenses: change(current.expenses, previous.expenses),
      net: change(current.net, previous.net),
    },
    transactionCount: currentTransactions.length,
    averageDailyExpense: current.expenses / days,
    savingsRate,
    totalBalance,
    monthlyTrend,
    expenseDistribution,
    incomeDistribution,
    incomeSources,
    accountActivity,
    accountBalances,
    largestExpenses: sortedExpenses.slice(0, 5),
    accounts: accounts.map((account) => ({
      id: account.id,
      name: account.name,
      currency: account.currency as SupportedCurrency,
    })),
    transactions: currentTransactions.map((transaction) => ({
      id: transaction.id,
      date: transaction.date.toISOString(),
      type: transaction.type,
      description: transaction.description,
      category: transaction.category?.name ?? "Sin categoría",
      account: transaction.account.name,
      amount: Number(transaction.amount),
      currency: transaction.currency as SupportedCurrency,
      convertedAmount: value(transaction),
      paymentMethod: transaction.paymentMethod,
      notes: transaction.notes,
    })),
    insights: insights.slice(0, 3),
  };
}
