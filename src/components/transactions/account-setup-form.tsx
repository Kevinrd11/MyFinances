"use client";

import { useActionState } from "react";
import { Landmark, LoaderCircle, WalletCards } from "lucide-react";
import {
  createAccountAction,
  type FinanceActionState,
} from "@/app/(app)/transacciones/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: FinanceActionState = { status: "idle" };
const selectClass =
  "h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-foreground outline-none transition focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/12";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="mt-1.5 text-xs text-red-600">{messages[0]}</p>;
}

export function AccountSetupForm() {
  const [state, action, pending] = useActionState(createAccountAction, initialState);

  return (
    <form action={action} className="mt-6 grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor="account-name" className="mb-1.5 block text-xs font-semibold">
          Nombre de la cuenta
        </label>
        <Input
          id="account-name"
          name="name"
          placeholder="Ej. Cuenta principal, Efectivo o SINPE"
          required
          autoFocus
        />
        <FieldError messages={state.fieldErrors?.name} />
      </div>
      <div>
        <label htmlFor="account-type" className="mb-1.5 block text-xs font-semibold">
          Tipo
        </label>
        <div className="relative">
          <Landmark className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
          <select id="account-type" name="type" className={`${selectClass} pl-10`} defaultValue="BANK">
            <option value="BANK">Cuenta bancaria</option>
            <option value="CASH">Efectivo</option>
            <option value="SINPE">SINPE</option>
            <option value="CREDIT_CARD">Tarjeta de crédito</option>
            <option value="SAVINGS">Ahorros</option>
            <option value="INVESTMENT">Inversión</option>
            <option value="OTHER">Otra</option>
          </select>
        </div>
        <FieldError messages={state.fieldErrors?.type} />
      </div>
      <div>
        <label htmlFor="account-currency" className="mb-1.5 block text-xs font-semibold">
          Moneda
        </label>
        <select id="account-currency" name="currency" className={selectClass} defaultValue="CRC">
          <option value="CRC">Colones (CRC)</option>
          <option value="USD">Dólares (USD)</option>
        </select>
        <FieldError messages={state.fieldErrors?.currency} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="initial-balance" className="mb-1.5 block text-xs font-semibold">
          Saldo actual
        </label>
        <Input
          id="initial-balance"
          name="initialBalance"
          type="number"
          step="0.01"
          defaultValue="0"
          required
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Puede usar cero y registrar los movimientos después.
        </p>
        <FieldError messages={state.fieldErrors?.initialBalance} />
      </div>
      {state.message && (
        <p className="sm:col-span-2 text-sm text-red-600" role="alert">
          {state.message}
        </p>
      )}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : <WalletCards className="size-4" />}
          {pending ? "Creando cuenta…" : "Crear cuenta y continuar"}
        </Button>
      </div>
    </form>
  );
}

