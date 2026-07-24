"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  Code2,
  Ellipsis,
  Gauge,
  Landmark,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  ReceiptText,
  Settings,
  Target,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavigationItem = { label: string; href: string; icon: LucideIcon };

const navigation: NavigationItem[] = [
  { label: "Inicio", href: "/inicio", icon: LayoutDashboard },
  { label: "Transacciones", href: "/transacciones", icon: ReceiptText },
  { label: "Tours", href: "/tours", icon: Map },
  { label: "Proyectos web", href: "/proyectos", icon: Code2 },
  { label: "Cuentas", href: "/cuentas", icon: WalletCards },
  { label: "Presupuestos", href: "/presupuestos", icon: Gauge },
  { label: "Metas", href: "/metas", icon: Target },
  { label: "Deudas", href: "/deudas", icon: Landmark },
  { label: "Calendario", href: "/calendario", icon: CalendarDays },
  { label: "Reportes", href: "/reportes", icon: BarChart3 },
];

function NavigationLink({
  item,
  compact = false,
  onNavigate,
}: {
  item: NavigationItem;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
        active
          ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/55 dark:text-emerald-300"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        compact && "flex-col gap-1 rounded-none px-1 py-2 text-[10px]",
      )}
    >
      <Icon className={cn("size-[18px] shrink-0", active && "text-emerald-600")} strokeWidth={2} />
      <span>{item.label}</span>
    </Link>
  );
}

export function DesktopSidebar({ userName, userEmail }: { userName: string; userEmail: string }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-[250px] shrink-0 border-r border-border bg-surface px-4 py-5 lg:flex lg:flex-col">
      <Brand className="px-2" />
      <nav className="soft-scrollbar mt-8 flex-1 space-y-1 overflow-y-auto" aria-label="Navegación principal">
        {navigation.map((item) => <NavigationLink key={item.href} item={item} />)}
      </nav>
      <div className="mt-4 border-t border-border pt-4">
        <NavigationLink item={{ label: "Configuración", href: "/configuracion", icon: Settings }} />
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-muted/70 p-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
            {userName.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{userName}</p>
            <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="icon" className="size-8" aria-label="Cerrar sesión">
              <LogOut className="size-4" />
            </Button>
          </form>
        </div>
      </div>
    </aside>
  );
}

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface/90 px-4 backdrop-blur-xl lg:hidden">
      <Brand />
      <MobileMenu trigger={<Button variant="ghost" size="icon" aria-label="Abrir menú"><Menu className="size-5" /></Button>} />
    </header>
  );
}

function MobileMenu({ trigger }: { trigger: React.ReactNode }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-x-3 bottom-3 z-50 max-h-[85dvh] overflow-y-auto rounded-3xl border border-border bg-surface p-5 shadow-2xl">
          <div className="mb-5 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">Todos los módulos</Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Cerrar menú"><X className="size-5" /></Button>
            </Dialog.Close>
          </div>
          <nav className="grid grid-cols-2 gap-2" aria-label="Todos los módulos">
            {navigation.map((item) => (
              <Dialog.Close asChild key={item.href}>
                <Link href={item.href} className="flex items-center gap-3 rounded-2xl border border-border p-4 text-sm font-medium hover:bg-muted">
                  <item.icon className="size-5 text-emerald-600" />
                  {item.label}
                </Link>
              </Dialog.Close>
            ))}
            <Dialog.Close asChild>
              <Link href="/configuracion" className="flex items-center gap-3 rounded-2xl border border-border p-4 text-sm font-medium hover:bg-muted">
                <Settings className="size-5 text-emerald-600" />
                Configuración
              </Link>
            </Dialog.Close>
          </nav>
          <form action={logoutAction} className="mt-4">
            <Button type="submit" variant="secondary" className="w-full">
              <LogOut className="size-4" /> Cerrar sesión
            </Button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function MobileBottomNavigation() {
  const primary = navigation.slice(0, 4);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden" aria-label="Navegación móvil">
      {primary.map((item) => <NavigationLink key={item.href} item={item} compact />)}
      <MobileMenu
        trigger={
          <button className="flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-medium text-muted-foreground">
            <Ellipsis className="size-[18px]" />
            Más
          </button>
        }
      />
    </nav>
  );
}
