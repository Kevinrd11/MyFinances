import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/12",
        className,
      )}
      {...props}
    />
  );
}

