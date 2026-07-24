"use client";

import { useActionState, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, LoaderCircle } from "lucide-react";
import {
  createDebtAction,
  type DebtActionState,
  updateDebtAction,
} from "@/app/(app)/deudas/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const initialState: DebtActionState = { status: "idle" };
const selectClass =
  "h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-foreground outline-none transition focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/12";

function FieldError({ messages }: { messages?: string[] }) {
  return messages?.length ? <p className="mt-1.5 text-xs text-red-600">{messages[0]}</p> : null;
}

export function DebtForm({
  defaultDirection = "I_OWE",
  debt,
}: {
  defaultDirection?: "I_OWE" | "OWED_TO_ME";
  debt?: {
    id: string;
    direction: "I_OWE" | "OWED_TO_ME";
    person: string;
    originalAmount: number;
    paid: number;
    currency: "CRC" | "USD";
    interestRate: number | null;
    installmentAmount: number | null;
    nextDueDate: string | null;
    notes: string | null;
  };
}) {
  const initialDirection = debt?.direction ?? defaultDirection;
  const [direction, setDirection] = useState<"I_OWE" | "OWED_TO_ME">(initialDirection);
  const formAction = debt ? updateDebtAction.bind(null, debt.id) : createDebtAction;
  const [state, action, pending] = useActionState(formAction, initialState);
  const identityLocked = Boolean(debt && debt.paid > 0);

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <p className="mb-2 text-xs font-semibold">¿Quién debe el dinero?</p>
        <div className="grid grid-cols-2 gap-2">
          {([
            ["I_OWE", "Yo debo", ArrowUpRight],
            ["OWED_TO_ME", "Me deben", ArrowDownLeft],
          ] as const).map(([value, label, Icon]) => (
            <label
              key={value}
              className={cn(
                "flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition",
                direction === value
                  ? value === "I_OWE"
                    ? "border-orange-400 bg-orange-50 text-orange-800 dark:bg-orange-950/45 dark:text-orange-300"
                    : "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/55 dark:text-emerald-300"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              <input
                className="sr-only"
                type="radio"
                name="direction"
                value={value}
                checked={direction === value}
                disabled={identityLocked}
                onChange={() => setDirection(value)}
              />
              <Icon className="size-4" /> {label}
            </label>
          ))}
        </div>
        {identityLocked && (
          <>
            <input type="hidden" name="direction" value={direction} />
            <p className="mt-2 text-xs text-muted-foreground">
              La dirección y la moneda se conservan porque esta deuda ya tiene abonos.
            </p>
          </>
        )}
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="debt-person" className="mb-1.5 block text-xs font-semibold">
          {direction === "I_OWE" ? "Persona o entidad a quien debe" : "Persona o entidad que le debe"}
        </label>
        <Input
          id="debt-person"
          name="person"
          defaultValue={debt?.person}
          placeholder="Ej. Banco, familiar o cliente"
          required
        />
        <FieldError messages={state.fieldErrors?.person} />
      </div>
      <div>
        <label htmlFor="debt-amount" className="mb-1.5 block text-xs font-semibold">
          Monto original
        </label>
        <Input
          id="debt-amount"
          name="originalAmount"
          type="number"
          min="0.01"
          step="0.01"
          inputMode="decimal"
          defaultValue={debt?.originalAmount}
          placeholder="0.00"
          required
        />
        <FieldError messages={state.fieldErrors?.originalAmount} />
      </div>
      <div>
        <label htmlFor="debt-currency" className="mb-1.5 block text-xs font-semibold">
          Moneda
        </label>
        <select
          id="debt-currency"
          name="currency"
          className={selectClass}
          defaultValue={debt?.currency ?? "CRC"}
          disabled={identityLocked}
        >
          <option value="CRC">Colones (CRC)</option>
          <option value="USD">Dólares (USD)</option>
        </select>
        {identityLocked && <input type="hidden" name="currency" value={debt?.currency} />}
      </div>
      <div>
        <label htmlFor="debt-installment" className="mb-1.5 block text-xs font-semibold">
          Cuota esperada <span className="font-normal text-muted-foreground">(opcional)</span>
        </label>
        <Input
          id="debt-installment"
          name="installmentAmount"
          type="number"
          min="0"
          step="0.01"
          defaultValue={debt?.installmentAmount ?? ""}
        />
      </div>
      <div>
        <label htmlFor="debt-due-date" className="mb-1.5 block text-xs font-semibold">
          Próximo vencimiento <span className="font-normal text-muted-foreground">(opcional)</span>
        </label>
        <Input
          id="debt-due-date"
          name="nextDueDate"
          type="date"
          defaultValue={debt?.nextDueDate?.slice(0, 10) ?? ""}
        />
      </div>
      <div>
        <label htmlFor="debt-interest" className="mb-1.5 block text-xs font-semibold">
          Interés anual % <span className="font-normal text-muted-foreground">(opcional)</span>
        </label>
        <Input
          id="debt-interest"
          name="interestRate"
          type="number"
          min="0"
          step="0.0001"
          defaultValue={debt?.interestRate ?? ""}
        />
      </div>
      <div>
        <label htmlFor="debt-notes" className="mb-1.5 block text-xs font-semibold">
          Nota <span className="font-normal text-muted-foreground">(opcional)</span>
        </label>
        <Input
          id="debt-notes"
          name="notes"
          maxLength={500}
          defaultValue={debt?.notes ?? ""}
          placeholder="Condiciones o referencia"
        />
      </div>
      {state.message && (
        <p className="sm:col-span-2 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
          {state.message}
        </p>
      )}
      <div className="sm:col-span-2 flex justify-end">
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending && <LoaderCircle className="size-4 animate-spin" />}
          {pending
            ? "Guardando…"
            : debt
              ? "Guardar cambios"
              : direction === "I_OWE"
              ? "Guardar deuda"
              : "Guardar cuenta por cobrar"}
        </Button>
      </div>
    </form>
  );
}
