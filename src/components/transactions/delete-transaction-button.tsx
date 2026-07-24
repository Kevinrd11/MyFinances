"use client";

import { Trash2 } from "lucide-react";
import { deleteTransactionAction } from "@/app/(app)/transacciones/actions";
import { Button } from "@/components/ui/button";

export function DeleteTransactionButton({ id }: { id: string }) {
  const action = deleteTransactionAction.bind(null, id);

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm("¿Desea eliminar esta transacción?")) event.preventDefault();
      }}
    >
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground hover:text-red-600"
        aria-label="Eliminar transacción"
      >
        <Trash2 className="size-4" />
      </Button>
    </form>
  );
}

