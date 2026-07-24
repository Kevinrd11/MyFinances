import {
  addDays,
  addMonths,
  addQuarters,
  addWeeks,
  addYears,
  endOfMonth,
  format,
  startOfMonth,
} from "date-fns";
import { db } from "@/lib/db";
import type { SafeUser } from "@/lib/auth/types";
import type { SupportedCurrency } from "@/lib/finance/format";

export type CalendarEvent = {
  id: string;
  date: string;
  title: string;
  detail: string;
  href: string;
  tone: "income" | "expense" | "due" | "goal" | "project" | "tour";
  amount?: number;
  currency?: SupportedCurrency;
};

function validMonth(value?: string) {
  return value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)
    ? value
    : format(new Date(), "yyyy-MM");
}

function nextOccurrence(date: Date, frequency: string) {
  if (frequency === "WEEKLY") return addWeeks(date, 1);
  if (frequency === "BIWEEKLY") return addWeeks(date, 2);
  if (frequency === "QUARTERLY") return addQuarters(date, 1);
  if (frequency === "YEARLY") return addYears(date, 1);
  return addMonths(date, 1);
}

export async function getCalendarData(user: SafeUser, requestedMonth?: string) {
  const month = validMonth(requestedMonth);
  const monthStart = startOfMonth(new Date(`${month}-01T12:00:00`));
  const monthEnd = addDays(endOfMonth(monthStart), 1);

  const [transactions, recurring, debts, goals, projects, tours] = await db.$transaction(
    async (transaction) => {
      await transaction.$queryRaw`SELECT set_config('app.current_user_id', ${user.id}, true)`;

      return Promise.all([
        transaction.transaction.findMany({
          where: {
            userId: user.id,
            deletedAt: null,
            date: { gte: monthStart, lt: monthEnd },
            OR: [
              { type: { in: ["INCOME", "EXPENSE", "DEBT_PAYMENT", "GOAL_CONTRIBUTION"] } },
              { type: "TRANSFER", transferDirection: "OUT" },
            ],
          },
          select: {
            id: true,
            date: true,
            description: true,
            amount: true,
            currency: true,
            type: true,
            account: { select: { name: true } },
            category: { select: { name: true } },
          },
        }),
        transaction.recurringTransaction.findMany({
          where: {
            userId: user.id,
            isActive: true,
            nextDate: { lt: monthEnd },
            OR: [{ endDate: null }, { endDate: { gte: monthStart } }],
          },
          select: {
            id: true,
            nextDate: true,
            endDate: true,
            description: true,
            amount: true,
            currency: true,
            type: true,
            frequency: true,
          },
        }),
        transaction.debt.findMany({
          where: {
            userId: user.id,
            status: { in: ["ACTIVE", "OVERDUE"] },
            nextDueDate: { gte: monthStart, lt: monthEnd },
          },
          select: {
            id: true,
            nextDueDate: true,
            person: true,
            installmentAmount: true,
            originalAmount: true,
            currency: true,
            direction: true,
          },
        }),
        transaction.savingsGoal.findMany({
          where: {
            userId: user.id,
            isCompleted: false,
            deadline: { gte: monthStart, lt: monthEnd },
          },
          select: { id: true, deadline: true, name: true, targetAmount: true, currency: true },
        }),
        transaction.webProject.findMany({
          where: {
            userId: user.id,
            deletedAt: null,
            OR: [
              { deliveryDate: { gte: monthStart, lt: monthEnd } },
              { nextBillingDate: { gte: monthStart, lt: monthEnd } },
            ],
          },
          select: {
            id: true,
            name: true,
            deliveryDate: true,
            nextBillingDate: true,
            recurringAmount: true,
            currency: true,
          },
        }),
        transaction.tour.findMany({
          where: { userId: user.id, cancelledAt: null, date: { gte: monthStart, lt: monthEnd } },
          select: {
            id: true,
            date: true,
            baseIncome: true,
            currency: true,
            paymentStatus: true,
            tourType: { select: { name: true } },
          },
        }),
      ]);
    },
  );

  const events: CalendarEvent[] = transactions.map((item) => ({
    id: `transaction-${item.id}`,
    date: format(item.date, "yyyy-MM-dd"),
    title: item.description,
    detail: `${item.category?.name ?? "Transferencia"} · ${item.account.name}`,
    href: `/transacciones?month=${month}`,
    tone: item.type === "INCOME" ? "income" : item.type === "EXPENSE" ? "expense" : "due",
    amount: Number(item.amount),
    currency: item.currency as SupportedCurrency,
  }));

  for (const item of recurring) {
    let occurrence = item.nextDate;
    let guard = 0;
    while (occurrence < monthEnd && guard < 40) {
      if (occurrence >= monthStart && (!item.endDate || occurrence <= item.endDate)) {
        events.push({
          id: `recurring-${item.id}-${format(occurrence, "yyyy-MM-dd")}`,
          date: format(occurrence, "yyyy-MM-dd"),
          title: item.description,
          detail: "Movimiento recurrente",
          href: "/transacciones?new=expense",
          tone: item.type === "INCOME" ? "income" : "due",
          amount: Number(item.amount),
          currency: item.currency as SupportedCurrency,
        });
      }
      occurrence = nextOccurrence(occurrence, item.frequency);
      guard += 1;
    }
  }

  debts.forEach((item) => {
    if (!item.nextDueDate) return;
    events.push({
      id: `debt-${item.id}`,
      date: format(item.nextDueDate, "yyyy-MM-dd"),
      title: item.direction === "I_OWE" ? `Pago a ${item.person}` : `Cobro a ${item.person}`,
      detail: "Vencimiento de deuda",
      href: "/deudas",
      tone: "due",
      amount: Number(item.installmentAmount ?? item.originalAmount),
      currency: item.currency as SupportedCurrency,
    });
  });

  goals.forEach((item) => {
    if (!item.deadline) return;
    events.push({
      id: `goal-${item.id}`,
      date: format(item.deadline, "yyyy-MM-dd"),
      title: item.name,
      detail: "Fecha límite de meta",
      href: "/metas",
      tone: "goal",
      amount: Number(item.targetAmount),
      currency: item.currency as SupportedCurrency,
    });
  });

  projects.forEach((item) => {
    if (item.deliveryDate && item.deliveryDate >= monthStart && item.deliveryDate < monthEnd) {
      events.push({
        id: `project-delivery-${item.id}`,
        date: format(item.deliveryDate, "yyyy-MM-dd"),
        title: item.name,
        detail: "Entrega de proyecto",
        href: "/proyectos",
        tone: "project",
      });
    }
    if (item.nextBillingDate && item.nextBillingDate >= monthStart && item.nextBillingDate < monthEnd) {
      events.push({
        id: `project-billing-${item.id}`,
        date: format(item.nextBillingDate, "yyyy-MM-dd"),
        title: item.name,
        detail: "Próximo cobro",
        href: "/proyectos",
        tone: "income",
        amount: item.recurringAmount ? Number(item.recurringAmount) : undefined,
        currency: item.currency as SupportedCurrency,
      });
    }
  });

  tours.forEach((item) => {
    events.push({
      id: `tour-${item.id}`,
      date: format(item.date, "yyyy-MM-dd"),
      title: item.tourType.name,
      detail: item.paymentStatus === "PAID" ? "Tour pagado" : "Tour con pago pendiente",
      href: "/tours",
      tone: "tour",
      amount: Number(item.baseIncome),
      currency: item.currency as SupportedCurrency,
    });
  });

  return {
    month,
    events: events.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title)),
  };
}
