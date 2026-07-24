import Link from "next/link";
import { Bell, Plus, Search } from "lucide-react";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AppHeader({ firstName }: { firstName: string }) {
  return (
    <header className="hidden h-[72px] items-center justify-between border-b border-border bg-surface/85 px-6 backdrop-blur-xl lg:flex xl:px-8">
      <div>
        <p className="text-sm font-semibold text-foreground">Hola, {firstName}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Aquí está su panorama financiero.</p>
      </div>
      <div className="flex items-center gap-2.5">
        <label className="relative hidden xl:block">
          <span className="sr-only">Buscar</span>
          <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input className="h-9 w-56 bg-muted/60 pl-9" placeholder="Buscar..." />
        </label>
        <ThemeToggle />
        <Button variant="ghost" size="icon" aria-label="Notificaciones" className="relative">
          <Bell className="size-4.5" />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-emerald-500" />
        </Button>
        <Button asChild size="sm">
          <Link href="/transacciones?new=income"><Plus className="size-4" /> Nueva transacción</Link>
        </Button>
      </div>
    </header>
  );
}

