"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { convertMoney, type SupportedCurrency } from "@/lib/finance/format";

export type DebtActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

const optionalNumber = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().finite().nonnegative().max(999999999).optional(),
);

const debtSchema = z.object({
  direction: z.enum(["I_OWE", "OWED_TO_ME"]),
  person: z.string().trim().min(2, "Ingrese el nombre de la persona o entidad.").max(100),
  originalAmount: z.coerce.number().positive("Ingrese un monto mayor que cero.").max(999999999),
  currency: z.enum(["CRC", "USD"]),
  interestRate: optionalNumber,
  installmentAmount: optionalNumber,
  nextDueDate: z.string().optional(),
  notes: z.string().trim().max(500).optional(),
});

const paymentSchema = z.object({
  debtId: z.string().min(1),
  accountId: z.string().min(1, "Seleccione una cuenta."),
  amount: z.coerce.number().positive("Ingrese un monto mayor que cero.").max(999999999),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Seleccione una fecha válida."),
  nextDueDate: z.string().optional(),
  notes: z.string().trim().max(500).optional(),
});

function errors(error: z.ZodError) {
  return error.flatten().fieldErrors as Record<string, string[]>;
}

function optionalDate(value?: string) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00-06:00`)
    : null;
}

function refreshDebtViews() {
  revalidatePath("/deudas");
  revalidatePath("/transacciones");
  revalidatePath("/calendario");
  revalidatePath("/inicio");
  revalidatePath("/reportes");
}

export async function createDebtAction(
  _previousState: DebtActionState,
  formData: FormData,
): Promise<DebtActionState> {
  const parsed = debtSchema.safeParse({
    direction: formData.get("direction"),
    person: formData.get("person"),
    originalAmount: formData.get("originalAmount"),
    currency: formData.get("currency"),
    interestRate: formData.get("interestRate"),
    installmentAmount: formData.get("installmentAmount"),
    nextDueDate: formData.get("nextDueDate") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { status: "error", fieldErrors: errors(parsed.error) };

  const user = await requireUser();
  await db.$transaction(async (transaction) => {
    await transaction.$queryRaw`SELECT set_config('app.current_user_id', ${user.id}, true)`;
    const created = await transaction.debt.create({
      data: {
        userId: user.id,
        ...parsed.data,
        nextDueDate: optionalDate(parsed.data.nextDueDate),
      },
      select: { id: true },
    });
    await transaction.auditLog.create({
      data: { userId: user.id, action: "CREATE", entity: "Debt", entityId: created.id },
    });
  });

  refreshDebtViews();
  redirect("/deudas?created=1");
}

export async function updateDebtAction(
  id: string,
  _previousState: DebtActionState,
  formData: FormData,
): Promise<DebtActionState> {
  const parsed = debtSchema.safeParse({
    direction: formData.get("direction"),
    person: formData.get("person"),
    originalAmount: formData.get("originalAmount"),
    currency: formData.get("currency"),
    interestRate: formData.get("interestRate"),
    installmentAmount: formData.get("installmentAmount"),
    nextDueDate: formData.get("nextDueDate") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { status: "error", fieldErrors: errors(parsed.error) };

  const user = await requireUser();
  const data = parsed.data;
  let actionError: string | undefined;

  await db.$transaction(async (transaction) => {
    await transaction.$queryRaw`SELECT set_config('app.current_user_id', ${user.id}, true)`;
    const existing = await transaction.debt.findFirst({
      where: {
        id,
        userId: user.id,
        status: { in: ["ACTIVE", "OVERDUE"] },
      },
      select: {
        id: true,
        direction: true,
        person: true,
        originalAmount: true,
        currency: true,
        interestRate: true,
        installmentAmount: true,
        nextDueDate: true,
        notes: true,
        payments: { select: { amount: true } },
      },
    });
    if (!existing) {
      actionError = "La deuda ya no está pendiente o no existe.";
      return;
    }

    const paid = existing.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    if (
      paid > 0 &&
      (data.direction !== existing.direction || data.currency !== existing.currency)
    ) {
      actionError = "No puede cambiar la dirección ni la moneda después de registrar abonos.";
      return;
    }
    if (paid > 0 && data.originalAmount <= paid) {
      actionError = `El monto original debe ser mayor que el total abonado (${paid.toFixed(2)}).`;
      return;
    }

    const nextDueDate = optionalDate(data.nextDueDate);
    const overdue = nextDueDate ? nextDueDate < new Date() : false;
    await transaction.debt.update({
      where: { id: existing.id },
      data: {
        ...data,
        nextDueDate,
        status: overdue ? "OVERDUE" : "ACTIVE",
      },
    });
    await transaction.auditLog.create({
      data: {
        userId: user.id,
        action: "UPDATE",
        entity: "Debt",
        entityId: existing.id,
        before: {
          person: existing.person,
          originalAmount: Number(existing.originalAmount),
          direction: existing.direction,
          currency: existing.currency,
          interestRate: existing.interestRate ? Number(existing.interestRate) : null,
          installmentAmount: existing.installmentAmount
            ? Number(existing.installmentAmount)
            : null,
          nextDueDate: existing.nextDueDate?.toISOString() ?? null,
          notes: existing.notes,
        },
        after: {
          ...data,
          nextDueDate: nextDueDate?.toISOString() ?? null,
        },
      },
    });
  });

  if (actionError) return { status: "error", message: actionError };
  refreshDebtViews();
  redirect("/deudas?updated=1");
}

export async function deleteDebtAction(id: string) {
  const user = await requireUser();
  let deleted = false;

  await db.$transaction(async (transaction) => {
    await transaction.$queryRaw`SELECT set_config('app.current_user_id', ${user.id}, true)`;
    const existing = await transaction.debt.findFirst({
      where: {
        id,
        userId: user.id,
        status: { in: ["ACTIVE", "OVERDUE"] },
      },
      select: {
        id: true,
        person: true,
        originalAmount: true,
        currency: true,
        payments: {
          select: { transactionId: true },
        },
      },
    });
    if (!existing) return;

    const transactionIds = existing.payments
      .map((payment) => payment.transactionId)
      .filter((transactionId): transactionId is string => Boolean(transactionId));
    if (transactionIds.length > 0) {
      await transaction.transaction.updateMany({
        where: {
          id: { in: transactionIds },
          userId: user.id,
          deletedAt: null,
        },
        data: { deletedAt: new Date() },
      });
    }
    await transaction.debt.delete({ where: { id: existing.id } });
    await transaction.auditLog.create({
      data: {
        userId: user.id,
        action: "DELETE",
        entity: "Debt",
        entityId: existing.id,
        before: {
          person: existing.person,
          originalAmount: Number(existing.originalAmount),
          currency: existing.currency,
          paymentTransactions: transactionIds,
        },
      },
    });
    deleted = true;
  });

  if (!deleted) redirect("/deudas");
  refreshDebtViews();
  redirect("/deudas?deleted=1");
}

export async function recordDebtPaymentAction(
  _previousState: DebtActionState,
  formData: FormData,
): Promise<DebtActionState> {
  const parsed = paymentSchema.safeParse({
    debtId: formData.get("debtId"),
    accountId: formData.get("accountId"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    nextDueDate: formData.get("nextDueDate") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { status: "error", fieldErrors: errors(parsed.error) };

  const user = await requireUser();
  const data = parsed.data;
  let actionError: string | undefined;

  await db.$transaction(async (transaction) => {
    await transaction.$queryRaw`SELECT set_config('app.current_user_id', ${user.id}, true)`;
    const [profile, debt, account] = await Promise.all([
      transaction.user.findUniqueOrThrow({
        where: { id: user.id },
        select: { primaryCurrency: true, defaultExchangeRate: true },
      }),
      transaction.debt.findFirst({
        where: { id: data.debtId, userId: user.id, status: { in: ["ACTIVE", "OVERDUE"] } },
        select: {
          id: true,
          direction: true,
          person: true,
          originalAmount: true,
          currency: true,
          nextDueDate: true,
          payments: { select: { amount: true } },
        },
      }),
      transaction.account.findFirst({
        where: { id: data.accountId, userId: user.id, isArchived: false },
        select: { id: true, currency: true },
      }),
    ]);

    if (!debt) {
      actionError = "La deuda ya no está activa.";
      return;
    }
    if (!account) {
      actionError = "La cuenta seleccionada ya no está disponible.";
      return;
    }
    if (account.currency !== debt.currency) {
      actionError = "La cuenta y la deuda deben usar la misma moneda.";
      return;
    }

    const paid = debt.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const remaining = Math.max(Number(debt.originalAmount) - paid, 0);
    if (data.amount > remaining + 0.001) {
      actionError = "El abono no puede superar el saldo pendiente.";
      return;
    }

    const date = new Date(`${data.date}T12:00:00-06:00`);
    const rate = Number(profile.defaultExchangeRate);
    const convertedAmount = convertMoney(
      data.amount,
      debt.currency as SupportedCurrency,
      profile.primaryCurrency as SupportedCurrency,
      rate,
    );
    const financialTransaction = await transaction.transaction.create({
      data: {
        userId: user.id,
        accountId: account.id,
        type: debt.direction === "I_OWE" ? "DEBT_PAYMENT" : "INCOME",
        amount: data.amount,
        currency: debt.currency,
        exchangeRate: debt.currency === profile.primaryCurrency ? null : rate,
        convertedAmount,
        date,
        description:
          debt.direction === "I_OWE"
            ? `Abono de deuda a ${debt.person}`
            : `Cobro de deuda a ${debt.person}`,
        source: debt.direction === "OWED_TO_ME" ? "OTHER" : null,
        notes: data.notes,
      },
      select: { id: true },
    });
    await transaction.debtPayment.create({
      data: {
        userId: user.id,
        debtId: debt.id,
        transactionId: financialTransaction.id,
        amount: data.amount,
        date,
        notes: data.notes,
      },
    });

    const completed = paid + data.amount >= Number(debt.originalAmount) - 0.001;
    await transaction.debt.update({
      where: { id: debt.id },
      data: {
        status: completed ? "PAID" : "ACTIVE",
        nextDueDate: completed
          ? null
          : optionalDate(data.nextDueDate) ?? debt.nextDueDate,
      },
    });
    await transaction.auditLog.create({
      data: {
        userId: user.id,
        action: "PAYMENT",
        entity: "Debt",
        entityId: debt.id,
        after: { amount: data.amount, transactionId: financialTransaction.id, completed },
      },
    });
  });

  if (actionError) return { status: "error", message: actionError };
  refreshDebtViews();
  redirect("/deudas?paid=1");
}
