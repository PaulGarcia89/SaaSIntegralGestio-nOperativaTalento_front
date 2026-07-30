import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-2xl border border-border-default bg-surface-elevated px-4 py-2 text-sm text-text-primary outline-none transition hover:border-border-strong focus-visible:border-border-focus focus-visible:ring-2 focus-visible:ring-border-focus/30 disabled:cursor-not-allowed disabled:bg-surface-interactive disabled:text-text-disabled aria-invalid:border-status-danger aria-invalid:ring-2 aria-invalid:ring-status-danger/20 data-[success=true]:border-status-success",
        className,
      )}
      {...props}
    />
  );
}
