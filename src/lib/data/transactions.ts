import { addMonths, format, startOfMonth } from "date-fns";
import { db } from "@/lib/db";
import type { SafeUser } from "@/lib/auth/types";
import { convertMoney, type SupportedCurrency } from "@/lib/finance/format";
import { calculateAccountBalance } from "@/lib/finance/ledger";

export type TransactionKind = "INCOME" | "EXPENSE" | "TRANSFER";
export type TransactionDisplayKind = TransactionKind | "DEBT_PAYMENT" | "GOAL_CONTRIBUTION";

export type TransactionFilters = {
  account?: string;
  month?: string;
  query?: string;
  type?: TransactionKind;
};

function validMonth(value?: string) {
  return value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)
    ? value
    : format(new Date(), "yyyy-MM");
}

export async function getTransactionsData(user: SafeUser, filters: TransactionFilters) {
  const month = validMonth(filters.month);
  const monthStart = startOfMonth(new Date(`${month}-01T12:00:00`));
  const monthEnd = addMonths(monthStart, 1);

  const [profile, accounts, categories, transactions] = await db.$transaction(async (transaction) => {
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
        orderBy: [{ createdAt: "asc" }, { name: "asc" }],
      }),
      transaction.category.findMany({
        where: {
          userId: user.id,
          isArchived: false,
          type: { in: ["INCOME", "EXPENSE"] },
        },
        select: { id: true, name: true, type: true, color: true },
        orderBy: [{ type: "asc" }, { name: "asc" }],
      }),
      transaction.transaction.findMany({
        where: {
          userId: user.id,
          deletedAt: null,
          date: { gte: monthStart, lt: monthEnd },
          ...(filters.type ? { type: filters.type } : {}),
          ...(filters.account ? { accountId: filters.account } : {}),
          ...(filters.query
            ? {
                OR: [
                  { description: { contains: filters.query, mode: "insensitive" } },
                  { notes: { contains: filters.query, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          amount: true,
          currency: true,
          exchangeRate: true,
          type: true,
          transferDirection: true,
          transferGroupId: true,
          date: true,
          description: true,
          notes: true,
          paymentMethod: true,
          isRecurring: true,
          account: { select: { id: true, name: true } },
          category: { select: { id: true, name: true, color: true } },
          tour: { select: { id: true } },
          projectPayment: { select: { id: true } },
          goalContribution: { select: { id: true } },
          debtPayment: { select: { id: true } },
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: 250,
      }),
    ]);
  });

  const primaryCurrency = user.primaryCurrency as SupportedCurrency;
  const defaultRate = Number(profile.defaultExchangeRate);
  const toPrimary = (amount: number, currency: SupportedCurrency, rate?: number | null) =>
    convertMoney(amount, currency, primaryCurrency, rate || defaultRate);

  const visibleTransactions = transactions.filter(
    (transaction) => transaction.type !== "TRANSFER" || transaction.transferDirection === "OUT",
  );
  const income = visibleTransactions
    .filter((transaction) => transaction.type === "INCOME")
    .reduce(
      (sum, transaction) =>
        sum +
        toPrimary(
          Number(transaction.amount),
          transaction.currency as SupportedCurrency,
          transaction.exchangeRate ? Number(transaction.exchangeRate) : null,
        ),
      0,
    );
  const expenses = visibleTransactions
    .filter((transaction) => transaction.type === "EXPENSE")
    .reduce(
      (sum, transaction) =>
        sum +
        toPrimary(
          Number(transaction.amount),
          transaction.currency as SupportedCurrency,
          transaction.exchangeRate ? Number(transaction.exchangeRate) : null,
        ),
      0,
    );

  return {
    month,
    primaryCurrency,
    totals: { income, expenses, net: income - expenses },
    accounts: accounts.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      currency: account.currency as SupportedCurrency,
      color: account.color,
      balance: calculateAccountBalance(
        Number(account.initialBalance),
        account.transactions.map((item) => ({
          amount: Number(item.amount),
          type: item.type,
          transferDirection: item.transferDirection,
        })),
      ),
    })),
    categories: categories.map((category) => ({
      ...category,
      type: category.type as "INCOME" | "EXPENSE",
    })),
    transactions: visibleTransactions.map((transaction) => ({
      id: transaction.id,
      amount: Number(transaction.amount),
      currency: transaction.currency as SupportedCurrency,
      type: transaction.type as TransactionDisplayKind,
      transferDirection: transaction.transferDirection,
      date: transaction.date.toISOString(),
      description: transaction.description,
      notes: transaction.notes,
      paymentMethod: transaction.paymentMethod,
      account: transaction.account,
      category: transaction.category,
      canEdit:
        transaction.type === "INCOME" &&
        !transaction.isRecurring &&
        !transaction.tour &&
        !transaction.projectPayment &&
        !transaction.goalContribution &&
        !transaction.debtPayment,
      canDelete:
        !transaction.isRecurring &&
        !transaction.tour &&
        !transaction.projectPayment &&
        !transaction.goalContribution &&
        !transaction.debtPayment,
    })),
  };
}
