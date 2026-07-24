import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-5 text-center">
      <div>
        <p className="text-sm font-bold text-emerald-600">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Esta página no existe</h1>
        <p className="mt-3 text-sm text-muted-foreground">Vuelva a su panorama financiero.</p>
        <Button asChild className="mt-6"><Link href="/inicio">Ir al inicio</Link></Button>
      </div>
    </main>
  );
}

