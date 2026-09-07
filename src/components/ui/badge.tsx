import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { CircleCheck, CircleX, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { technicalLabel } from "@/lib/ui-labels";

/**
 * Distintivo.
 *
 * Los tonos semánticos usaban paletas sueltas de Tailwind
 * (`bg-emerald-100 text-emerald-700`, `bg-amber-100`, `bg-rose-100`), que no
 * cambiaban con el tema: en modo oscuro quedaba un chip claro sobre grafito.
 * Ahora salen de los tokens de estado, cuyo contraste está validado a 4,5:1
 * contra la superficie teñida al 10 % en la que se apoyan.
 *
 * `success`, `warning` y `destructive` llevan icono además de color, porque el
 * color por sí solo no comunica el estado a quien no lo distingue.
 */
const badgeVariants = cva(
  "inline-flex max-w-full items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        // La marca del tenant sigue viva aquí: es su sitio natural.
        default: "border-transparent bg-primary/10 text-brand",
        secondary: "border-line bg-surface-2 text-ink-1",
        outline: "border-line-control bg-transparent text-ink-1",
        success: "border-status-success/30 bg-status-success/10 text-status-success",
        warning: "border-status-warning/30 bg-status-warning/10 text-status-warning",
        destructive: "border-status-danger/30 bg-status-danger/10 text-status-danger",
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
  const StatusIcon =
    variant === "success" ? CircleCheck : variant === "warning" ? TriangleAlert : variant === "destructive" ? CircleX : null;
  // Traduce un código del backend (`AWAITING_SIGNATURE`) a lenguaje de persona.
  const content = typeof children === "string" && /^[A-Z][A-Z0-9_]*$/.test(children) ? technicalLabel(children) : children;
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {StatusIcon ? <StatusIcon className="mr-1 size-3 shrink-0" aria-hidden="true" /> : null}
      <span className="truncate">{content}</span>
    </div>
  );
}
