import Link from "next/link";
import { WalletCards } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link
      href="/inicio"
      className={cn("inline-flex items-center gap-2.5 font-semibold tracking-tight text-foreground", className)}
      aria-label="MyFinances, ir al inicio"
    >
      <span className="grid size-9 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-900/20">
        <WalletCards className="size-5" strokeWidth={2.2} aria-hidden="true" />
      </span>
      {!compact && (
        <span className="text-lg">
          My<span className="text-emerald-600">Finances</span>
        </span>
      )}
    </Link>
  );
}

