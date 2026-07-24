"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { deleteDebtAction } from "@/app/(app)/deudas/actions";
import { Button } from "@/components/ui/button";

export function DebtActions({ id }: { id: string }) {
  const deleteAction = deleteDebtAction.bind(null, id);

  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button asChild variant="ghost" size="icon" className="size-8" aria-label="Editar deuda">
        <Link href={`/deudas?edit=${id}`}>
          <Pencil className="size-4" />
        </Link>
      </Button>
      <form
        action={deleteAction}
        onSubmit={(event) => {
          if (
            !window.confirm(
              "¿Desea eliminar esta deuda? También se retirarán del balance los abonos vinculados.",
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-red-600"
          aria-label="Eliminar deuda"
        >
          <Trash2 className="size-4" />
        </Button>
      </form>
    </div>
  );
}
