"use client";

import { useActionState, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, LoaderCircle } from "lucide-react";
import {
  createTransactionAction,
  type FinanceActionState,
  updateIncomeAction,
} from "@/app/(app)/transacciones/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Kind = "INCOME" | "EXPENSE" | "TRANSFER";

type AccountOption = {
  id: string;
  name: string;
  currency: "CRC" | "USD";
};

type CategoryOption = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  color: string;
};

type EditableIncome = {
  id: string;
  accountId: string;
  categoryId: string;
  amount: number;
  date: string;
  description: string;
  paymentMethod: string | null;
  notes: string | null;
};

const initialState: FinanceActionState = { status: "idle" };
const selectClass =
  "h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-foreground outline-none transition focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/12";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="mt-1.5 text-xs text-red-600">{messages[0]}</p>;
}

export function TransactionForm({
  accounts,
  categories,
  defaultType,
  today,
  income,
}: {
  accounts: AccountOption[];
  categories: CategoryOption[];
  defaultType: Kind;
  today: string;
  income?: EditableIncome;
}) {
  const [type, setType] = useState<Kind>(income ? "INCOME" : defaultType);
  const formAction = income
    ? updateIncomeAction.bind(null, income.id)
    : createTransactionAction;
  const [state, action, pending] = useActionState(formAction, initialState);
  const availableCategories = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type],
  );

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <p className="mb-2 text-xs font-semibold">Tipo de movimiento</p>
        {income ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500 bg-emerald-50 px-3 py-3 text-sm font-semibold text-emerald-800 dark:bg-emerald-950/55 dark:text-emerald-300">
            <ArrowDownLeft className="size-4" /> Ingreso
            <input type="hidden" name="type" value="INCOME" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {([
              ["INCOME", "Ingreso", ArrowDownLeft],
              ["EXPENSE", "Gasto", ArrowUpRight],
              ["TRANSFER", "Transferencia", ArrowLeftRight],
            ] as const).map(([value, label, Icon]) => (
              <label
                key={value}
                className={cn(
                  "flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-2 py-3 text-xs font-semibold transition sm:text-sm",
                  type === value
                    ? value === "INCOME"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/55 dark:text-emerald-300"
                      : value === "EXPENSE"
                        ? "border-orange-400 bg-orange-50 text-orange-800 dark:bg-orange-950/45 dark:text-orange-300"
                        : "border-sky-400 bg-sky-50 text-sky-800 dark:bg-sky-950/45 dark:text-sky-300"
                    : "border-border bg-surface text-muted-foreground hover:bg-muted",
                )}
              >
                <input
                  className="sr-only"
                  type="radio"
                  name="type"
                  value={value}
                  checked={type === value}
                  onChange={() => setType(value)}
                />
                <Icon className="size-4" />
                <span className="truncate">{label}</span>
              </label>
            ))}
          </div>
        )}
        <FieldError messages={state.fieldErrors?.type} />
      </div>

      <div>
        <label htmlFor="transaction-account" className="mb-1.5 block text-xs font-semibold">
          {type === "TRANSFER" ? "Cuenta de origen" : "Cuenta"}
        </label>
        <select
          id="transaction-account"
          name="accountId"
          className={selectClass}
          defaultValue={income?.accountId}
          required
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} · {account.currency}
            </option>
          ))}
        </select>
        <FieldError messages={state.fieldErrors?.accountId} />
      </div>

      {type === "TRANSFER" ? (
        <div>
          <label htmlFor="destination-account" className="mb-1.5 block text-xs font-semibold">
            Cuenta de destino
          </label>
          <select
            id="destination-account"
            name="destinationAccountId"
            className={selectClass}
            defaultValue=""
            required
          >
            <option value="" disabled>
              Seleccionar destino
            </option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} · {account.currency}
              </option>
            ))}
          </select>
          <FieldError messages={state.fieldErrors?.destinationAccountId} />
        </div>
      ) : (
        <div>
          <label htmlFor="transaction-category" className="mb-1.5 block text-xs font-semibold">
            Categoría
          </label>
          <select
            key={type}
            id="transaction-category"
            name="categoryId"
            className={selectClass}
            defaultValue={income?.categoryId ?? ""}
            required
          >
            <option value="" disabled>
              Seleccionar categoría
            </option>
            {availableCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <FieldError messages={state.fieldErrors?.categoryId} />
        </div>
      )}

      <div>
        <label htmlFor="transaction-amount" className="mb-1.5 block text-xs font-semibold">
          Monto
        </label>
        <Input
          id="transaction-amount"
          name="amount"
          type="number"
          min="0.01"
          max="999999999"
          step="0.01"
          placeholder="0.00"
          inputMode="decimal"
          defaultValue={income?.amount}
          required
        />
        <FieldError messages={state.fieldErrors?.amount} />
      </div>
      <div>
        <label htmlFor="transaction-date" className="mb-1.5 block text-xs font-semibold">
          Fecha
        </label>
        <Input
          id="transaction-date"
          name="date"
          type="date"
          defaultValue={income?.date.slice(0, 10) ?? today}
          required
        />
        <FieldError messages={state.fieldErrors?.date} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="transaction-description" className="mb-1.5 block text-xs font-semibold">
          Descripción
        </label>
        <Input
          id="transaction-description"
          name="description"
          defaultValue={income?.description}
          placeholder={
            type === "INCOME"
              ? "Ej. Pago de cliente"
              : type === "EXPENSE"
                ? "Ej. Compra de supermercado"
                : "Ej. Ahorro del mes"
          }
          maxLength={120}
          required
        />
        <FieldError messages={state.fieldErrors?.description} />
      </div>
      <div>
        <label htmlFor="payment-method" className="mb-1.5 block text-xs font-semibold">
          Medio de pago <span className="font-normal text-muted-foreground">(opcional)</span>
        </label>
        <Input
          id="payment-method"
          name="paymentMethod"
          defaultValue={income?.paymentMethod ?? ""}
          placeholder="SINPE, efectivo, tarjeta…"
          maxLength={50}
        />
      </div>
      <div>
        <label htmlFor="transaction-notes" className="mb-1.5 block text-xs font-semibold">
          Nota <span className="font-normal text-muted-foreground">(opcional)</span>
        </label>
        <Input
          id="transaction-notes"
          name="notes"
          defaultValue={income?.notes ?? ""}
          placeholder="Detalle adicional"
          maxLength={500}
        />
      </div>

      {state.message && (
        <p className="sm:col-span-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/45 dark:text-red-300" role="alert">
          {state.message}
        </p>
      )}
      <div className="sm:col-span-2 flex justify-end">
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending && <LoaderCircle className="size-4 animate-spin" />}
          {pending ? "Guardando…" : income ? "Guardar cambios" : "Guardar transacción"}
        </Button>
      </div>
    </form>
  );
}
