import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { CircleCheck, CircleX, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { technicalLabel } from "@/lib/ui-labels";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/10 text-primary",
        secondary: "border-border bg-secondary text-secondary-foreground",
        outline: "border-border bg-background text-foreground",
        success: "border-transparent bg-emerald-100 text-emerald-700",
        warning: "border-transparent bg-amber-100 text-amber-700",
        destructive: "border-transparent bg-rose-100 text-rose-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export function Badge({
  className,
  variant,
  children,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof badgeVariants>) {
  const StatusIcon = variant === "success" ? CircleCheck : variant === "warning" ? TriangleAlert : variant === "destructive" ? CircleX : null;
  const content = typeof children === "string" && /^[A-Z][A-Z0-9_]*$/.test(children) ? technicalLabel(children) : children;
  return <div className={cn(badgeVariants({ variant }), className)} {...props}>{StatusIcon ? <StatusIcon className="mr-1 size-3.5" aria-hidden="true" /> : null}{content}</div>;
}
