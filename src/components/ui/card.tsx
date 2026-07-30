import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, level = 2, ...props }: React.ComponentProps<"div"> & { level?: 1 | 2 | 3 }) {
  return (
    <div
      className={cn(
        "border bg-card text-card-foreground",
        level === 1 && "rounded-2xl border-primary/30 shadow-[0_16px_42px_rgba(15,23,42,0.10)]",
        level === 2 && "rounded-2xl border-border/70 shadow-[0_8px_24px_rgba(15,23,42,0.05)]",
        level === 3 && "rounded-xl border-border/60 bg-card/60 shadow-none",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 className={cn("text-lg font-semibold", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}
