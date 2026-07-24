import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SummaryCard({
  label,
  value,
  helper,
  change,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  helper?: string;
  change?: number | null;
  icon: LucideIcon;
  tone?: "neutral" | "income" | "expense";
}) {
  const positive = change != null && change >= 0;
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</p>
          <p className="mt-2 truncate text-xl font-semibold tracking-[-0.025em] text-foreground sm:text-2xl">{value}</p>
        </div>
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-xl",
            tone === "income" && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
            tone === "expense" && "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
            tone === "neutral" && "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="size-4.5" />
        </span>
      </div>
      <div className="mt-3 flex min-h-5 items-center gap-1.5 text-xs">
        {change != null && (
          <span className={cn("inline-flex items-center gap-0.5 font-semibold", positive ? "text-emerald-600" : "text-red-600")}>
            {positive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {Math.abs(change).toFixed(1)} %
          </span>
        )}
        <span className="truncate text-muted-foreground">{helper}</span>
      </div>
    </Card>
  );
}

