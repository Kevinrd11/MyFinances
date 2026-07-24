"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import {
  recordDebtPaymentAction,
  type DebtActionState,
} from "@/app/(app)/deudas/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney, type SupportedCurrency } from "@/lib/finance/format";

const initialState: DebtActionState = { status: "idle" };
const selectClass =
  "h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-foreground outline-none transition focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/12";

function FieldError({ messages }: { messages?: string[] }) {
  return messages?.length ? <p className="mt-1.5 text-xs text-red-600">{messages[0]}</p> : null;
}

export function DebtPaymentForm({
  debt,
  accounts,
  today,
}: {
  debt: {
    id: string;
    direction: "I_OWE" | "OWED_TO_ME";
    person: string;
    remaining: number;
    installmentAmount: number | null;
    currency: SupportedCurrency;
  };
  accounts: { id: string; name: string; currency: SupportedCurrency }[];
  today: string;
}) {
  const [state, action, pending] = useActionState(recordDebtPaymentAction, initialState);
  const compatibleAccounts = accounts.filter((account) => account.currency === debt.currency);

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="debtId" value={debt.id} />
      <div className="sm:col-span-2 rounded-xl bg-muted/65 p-3 text-sm">
        <span className="text-muted-foreground">Saldo pendiente: </span>
        <strong>{formatMoney(debt.remaining, debt.currency)}</strong>
      </div>
      <div>
        <label htmlFor="payment-account" className="mb-1.5 block text-xs font-semibold">
          {debt.direction === "I_OWE" ? "Cuenta desde la que paga" : "Cuenta que recibe"}
        </label>
        <select
          id="payment-account"
          name="accountId"
          className={selectClass}
          defaultValue=""
          required
        >
          <option value="" disabled>
            Seleccionar cuenta
          </option>
          {compatibleAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} · {account.currency}
            </option>
          ))}
        </select>
        <FieldError messages={state.fieldErrors?.accountId} />
        {!compatibleAccounts.length && (
          <p className="mt-1.5 text-xs text-amber-700">
            Necesita una cuenta en {debt.currency} para registrar el abono.
          </p>
        )}
      </div>
      <div>
        <label htmlFor="payment-amount" className="mb-1.5 block text-xs font-semibold">
          Monto del abono
        </label>
        <Input
          id="payment-amount"
          name="amount"
          type="number"
          min="0.01"
          max={debt.remaining}
          step="0.01"
          defaultValue={Math.min(debt.installmentAmount ?? debt.remaining, debt.remaining)}
          required
        />
        <FieldError messages={state.fieldErrors?.amount} />
      </div>
      <div>
        <label htmlFor="payment-date" className="mb-1.5 block text-xs font-semibold">
          Fecha del abono
        </label>
        <Input id="payment-date" name="date" type="date" defaultValue={today} required />
      </div>
      <div>
        <label htmlFor="next-payment-date" className="mb-1.5 block text-xs font-semibold">
          Siguiente vencimiento <span className="font-normal text-muted-foreground">(opcional)</span>
        </label>
        <Input id="next-payment-date" name="nextDueDate" type="date" />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="payment-notes" className="mb-1.5 block text-xs font-semibold">
          Nota <span className="font-normal text-muted-foreground">(opcional)</span>
        </label>
        <Input id="payment-notes" name="notes" maxLength={500} placeholder="Comprobante o referencia" />
      </div>
      {state.message && (
        <p className="sm:col-span-2 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
          {state.message}
        </p>
      )}
      <div className="sm:col-span-2 flex justify-end">
        <Button type="submit" disabled={pending || !compatibleAccounts.length} className="w-full sm:w-auto">
          {pending && <LoaderCircle className="size-4 animate-spin" />}
          {pending ? "Registrando…" : debt.direction === "I_OWE" ? "Registrar pago" : "Registrar cobro"}
        </Button>
      </div>
    </form>
  );
}
