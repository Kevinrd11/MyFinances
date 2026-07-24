import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  CheckCircle2,
  Filter,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  WalletCards,
  X,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { AccountSetupForm } from "@/components/transactions/account-setup-form";
import { DeleteTransactionButton } from "@/components/transactions/delete-transaction-button";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth/session";
import {
  getTransactionsData,
  type TransactionFilters,
  type TransactionKind,
} from "@/lib/data/transactions";
import { formatMoney } from "@/lib/finance/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Transacciones" };

const kinds: TransactionKind[] = ["INCOME", "EXPENSE", "TRANSFER"];

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const query = await searchParams;
  const requestedType = single(query.type);
  const filters: TransactionFilters = {
    month: single(query.month),
    account: single(query.account),
    query: single(query.q)?.trim().slice(0, 100),
    type: kinds.includes(requestedType as TransactionKind)
      ? (requestedType as TransactionKind)
      : undefined,
  };
  const data = await getTransactionsData(user, filters);
  const newKind = single(query.new);
  const defaultType: TransactionKind =
    newKind === "expense" ? "EXPENSE" : newKind === "transfer" ? "TRANSFER" : "INCOME";
  const editIncome = data.transactions.find(
    (transaction) => transaction.id === single(query.edit) && transaction.canEdit,
  );
  const showForm = Boolean(newKind) || Boolean(editIncome);
  const showAccountForm = single(query["new-account"]) === "1";
  const created = single(query.created) === "1";
  const updated = single(query.updated) === "1";

  if (data.accounts.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <section>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
            Libro financiero
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
            Transacciones
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Primero configure dónde guarda su dinero.
          </p>
        </section>
        <Card className="overflow-hidden p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <WalletCards className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">Cree su primera cuenta</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                El saldo y cada movimiento quedarán asociados a esta cuenta. Podrá agregar otras
                cuentas después.
              </p>
            </div>
          </div>
          <AccountSetupForm />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
            Libro financiero
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
            Transacciones
          </h1>
          <p className="mt-1.5 text-sm capitalize text-muted-foreground">
            {format(parseISO(`${data.month}-01`), "MMMM yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link href={`/transacciones?new-account=1&month=${data.month}`}>
              <WalletCards className="size-4" /> Nueva cuenta
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/transacciones?new=income&month=${data.month}`}>
              <Plus className="size-4" /> Nueva transacción
            </Link>
          </Button>
        </div>
      </section>

      {(created || updated) && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/45 dark:text-emerald-300">
          <CheckCircle2 className="size-4 shrink-0" />
          {updated
            ? "Los cambios del ingreso se guardaron correctamente."
            : "La transacción se guardó correctamente."}
        </div>
      )}

      {showForm && (
        <Card className="p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">
                {editIncome ? "Editar ingreso" : "Registrar movimiento"}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {editIncome
                  ? "Actualice la cuenta, categoría, monto o información del ingreso."
                  : "El saldo y el dashboard se actualizarán al guardar."}
              </p>
            </div>
            <Button asChild variant="ghost" size="icon" aria-label="Cerrar formulario">
              <Link href={`/transacciones?month=${data.month}`}>
                <X className="size-4" />
              </Link>
            </Button>
          </div>
          <TransactionForm
            key={editIncome?.id ?? defaultType}
            accounts={data.accounts}
            categories={data.categories}
            defaultType={editIncome ? "INCOME" : defaultType}
            today={format(new Date(), "yyyy-MM-dd")}
            income={
              editIncome
                ? {
                    id: editIncome.id,
                    accountId: editIncome.account.id,
                    categoryId: editIncome.category?.id ?? "",
                    amount: editIncome.amount,
                    date: editIncome.date,
                    description: editIncome.description,
                    paymentMethod: editIncome.paymentMethod,
                    notes: editIncome.notes,
                  }
                : undefined
            }
          />
        </Card>
      )}

      {showAccountForm && (
        <Card className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Agregar cuenta</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Registre otra cuenta para separar saldos o realizar transferencias.
              </p>
            </div>
            <Button asChild variant="ghost" size="icon" aria-label="Cerrar formulario">
              <Link href={`/transacciones?month=${data.month}`}>
                <X className="size-4" />
              </Link>
            </Button>
          </div>
          <AccountSetupForm />
        </Card>
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4 sm:p-5">
          <p className="text-xs font-medium text-muted-foreground">Ingresos del mes</p>
          <p className="mt-2 text-xl font-semibold text-emerald-600">
            {formatMoney(data.totals.income, data.primaryCurrency)}
          </p>
        </Card>
        <Card className="p-4 sm:p-5">
          <p className="text-xs font-medium text-muted-foreground">Gastos del mes</p>
          <p className="mt-2 text-xl font-semibold text-orange-600">
            {formatMoney(data.totals.expenses, data.primaryCurrency)}
          </p>
        </Card>
        <Card className="p-4 sm:p-5">
          <p className="text-xs font-medium text-muted-foreground">Resultado neto</p>
          <p
            className={cn(
              "mt-2 text-xl font-semibold",
              data.totals.net >= 0 ? "text-foreground" : "text-red-600",
            )}
          >
            {formatMoney(data.totals.net, data.primaryCurrency)}
          </p>
        </Card>
      </section>

      <Card className="p-4 sm:p-5">
        <form action="/transacciones" className="grid gap-3 md:grid-cols-[1fr_170px_180px_180px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={filters.query}
              placeholder="Buscar descripción o nota"
              className="pl-10"
            />
          </div>
          <select
            name="type"
            defaultValue={filters.type ?? ""}
            className="h-11 rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-emerald-500"
          >
            <option value="">Todos los tipos</option>
            <option value="INCOME">Ingresos</option>
            <option value="EXPENSE">Gastos</option>
            <option value="TRANSFER">Transferencias</option>
          </select>
          <select
            name="account"
            defaultValue={filters.account ?? ""}
            className="h-11 rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-emerald-500"
          >
            <option value="">Todas las cuentas</option>
            {data.accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
          <Input name="month" type="month" defaultValue={data.month} />
          <Button type="submit" variant="secondary">
            <Filter className="size-4" /> Filtrar
          </Button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-5">
          <div>
            <h2 className="font-semibold">Movimientos</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {data.transactions.length} resultado{data.transactions.length === 1 ? "" : "s"}
            </p>
          </div>
          {(filters.account || filters.query || filters.type) && (
            <Button asChild variant="ghost" size="sm">
              <Link href={`/transacciones?month=${data.month}`}>Limpiar filtros</Link>
            </Button>
          )}
        </div>
        {data.transactions.length ? (
          <div className="divide-y divide-border">
            {data.transactions.map((transaction) => {
              const income = transaction.type === "INCOME";
              const transfer = transaction.type === "TRANSFER";
              const Icon = income ? ArrowDownLeft : transfer ? ArrowLeftRight : ArrowUpRight;
              return (
                <div key={transaction.id} className="flex items-center gap-3 px-4 py-4 sm:px-5">
                  <span
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-xl",
                      income
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950"
                        : transfer
                          ? "bg-sky-50 text-sky-600 dark:bg-sky-950"
                          : "bg-orange-50 text-orange-600 dark:bg-orange-950",
                    )}
                  >
                    <Icon className="size-4.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{transaction.description}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {transaction.category?.name ?? "Transferencia"} · {transaction.account.name}
                      {transaction.paymentMethod ? ` · ${transaction.paymentMethod}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        income ? "text-emerald-600" : "text-foreground",
                      )}
                    >
                      {income ? "+" : transfer ? "↔ " : "−"}
                      {formatMoney(transaction.amount, transaction.currency)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {new Intl.DateTimeFormat("es-CR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(transaction.date))}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {transaction.canEdit && (
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label="Editar ingreso"
                      >
                        <Link href={`/transacciones?edit=${transaction.id}&month=${data.month}`}>
                          <Pencil className="size-4" />
                        </Link>
                      </Button>
                    )}
                    {transaction.canDelete && <DeleteTransactionButton id={transaction.id} />}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted">
              <ReceiptText className="size-5 text-muted-foreground" />
            </span>
            <p className="mt-3 text-sm font-semibold">No hay movimientos en este periodo</p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
              Registre un ingreso, gasto o transferencia, o cambie los filtros para consultar otro
              periodo.
            </p>
            <Button asChild size="sm" className="mt-4">
              <Link href={`/transacciones?new=income&month=${data.month}`}>
                <Plus className="size-4" /> Registrar movimiento
              </Link>
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
