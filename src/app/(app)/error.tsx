"use client";

import { CircleAlert, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PrivateError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Card className="mx-auto mt-16 max-w-lg p-8 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950"><CircleAlert className="size-5" /></span>
      <h1 className="mt-5 text-xl font-semibold">No pudimos cargar esta información</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">Sus datos no se modificaron. Intente de nuevo y, si continúa, revise la conexión con la base de datos.</p>
      <Button onClick={reset} className="mt-6"><RotateCcw className="size-4" /> Reintentar</Button>
    </Card>
  );
}

