import { addDays, startOfDay } from "date-fns";
import { db } from "@/lib/db";
import type { SafeUser } from "@/lib/auth/types";
import { convertMoney, type SupportedCurrency } from "@/lib/finance/format";

export type DebtFilter = "active" | "paid" | "all";

export async function getDebtsData(user: SafeUser, filter: DebtFilter = "active") {
  const [profile, accounts, debts] = await db.$transaction(async (transaction) => {
    await transaction.$queryRaw`SELECT set_config('app.current_user_id', ${user.id}, true)`;

    return Promise.all([
      transaction.user.findUniqueOrThrow({
        where: { id: user.id },
        select: { defaultExchangeRate: true },
      }),
      transaction.account.findMany({
        where: { userId: user.id, isArchived: false },
        select: { id: true, name: true, currency: true },
        orderBy: [{ name: "asc" }],
      }),
      transaction.debt.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          direction: true,
          person: true,
          originalAmount: true,
          currency: true,
          interestRate: true,
          installmentAmount: true,
          nextDueDate: true,
          status: true,
          notes: true,
          createdAt: true,
          payments: {
            select: { id: true, amount: true, date: true, notes: true },
            orderBy: [{ date: "desc" }, { createdAt: "desc" }],
          },
        },
        orderBy: [{ status: "asc" }, { nextDueDate: "asc" }, { createdAt: "desc" }],
      }),
    ]);
  });

  const primaryCurrency = user.primaryCurrency as SupportedCurrency;
  const defaultRate = Number(profile.defaultExchangeRate);
  const toPrimary = (amount: number, currency: SupportedCurrency) =>
    convertMoney(amount, currency, primaryCurrency, defaultRate);
  const dueSoonLimit = addDays(startOfDay(new Date()), 7);

  const items = debts.map((debt) => {
    const paid = debt.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const original = Number(debt.originalAmount);
    const remaining = Math.max(original - paid, 0);

    return {
      id: debt.id,
      direction: debt.direction,
      person: debt.person,
      originalAmount: original,
      paid,
      remaining,
      progress: original > 0 ? Math.min((paid / original) * 100, 100) : 100,
      currency: debt.currency as SupportedCurrency,
      interestRate: debt.interestRate ? Number(debt.interestRate) : null,
      installmentAmount: debt.installmentAmount ? Number(debt.installmentAmount) : null,
      nextDueDate: debt.nextDueDate?.toISOString() ?? null,
      status: debt.status,
      notes: debt.notes,
      createdAt: debt.createdAt.toISOString(),
      payments: debt.payments.map((payment) => ({
        id: payment.id,
        amount: Number(payment.amount),
        date: payment.date.toISOString(),
        notes: payment.notes,
      })),
    };
  });

  const active = items.filter((item) => item.status === "ACTIVE" || item.status === "OVERDUE");
  const payable = active
    .filter((item) => item.direction === "I_OWE")
    .reduce((sum, item) => sum + toPrimary(item.remaining, item.currency), 0);
  const receivable = active
    .filter((item) => item.direction === "OWED_TO_ME")
    .reduce((sum, item) => sum + toPrimary(item.remaining, item.currency), 0);
  const dueSoon = active.filter(
    (item) => item.nextDueDate && new Date(item.nextDueDate) <= dueSoonLimit,
  ).length;

  return {
    primaryCurrency,
    filter,
    accounts: accounts.map((account) => ({
      id: account.id,
      name: account.name,
      currency: account.currency as SupportedCurrency,
    })),
    debts:
      filter === "active"
        ? items.filter((item) => item.status === "ACTIVE" || item.status === "OVERDUE")
        : filter === "paid"
          ? items.filter((item) => item.status === "PAID")
          : items,
    totals: { payable, receivable, dueSoon },
  };
}
