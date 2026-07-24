import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "icon";
};

export function Button({
  asChild,
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return (
    <Component
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-semibold outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-55",
        variant === "primary" && "bg-emerald-600 text-white shadow-sm shadow-emerald-950/10 hover:bg-emerald-700",
        variant === "secondary" && "border border-border bg-surface text-foreground hover:bg-muted",
        variant === "ghost" && "text-muted-foreground hover:bg-muted hover:text-foreground",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        size === "md" && "h-11 px-4 text-sm",
        size === "sm" && "h-9 px-3 text-sm",
        size === "icon" && "size-10",
        className,
      )}
      {...props}
    />
  );
}

