import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Área de texto con la misma forma que `Input`.
 *
 * Existían 55 `<textarea>` sueltos repartidos por el producto con al menos ocho
 * combinaciones distintas de radio, relleno, borde y fondo (`rounded-xl` vs
 * `rounded-2xl`, `p-3` vs `p-4`, `bg-background` vs `bg-surface-elevated`).
 * Ninguna coincidía con `Input`, así que un formulario con ambos controles no
 * parecía diseñado por la misma mano.
 *
 * `rows` fija la altura inicial; para un mínimo distinto, pasa `className`
 * con `min-h-*`.
 */
export function Textarea({ className, rows = 4, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      rows={rows}
      className={cn(
        "flex w-full rounded-2xl border border-border-default bg-surface-elevated px-4 py-3 text-sm text-text-primary outline-none transition",
        "hover:border-border-strong",
        "focus-visible:border-border-focus focus-visible:ring-2 focus-visible:ring-border-focus/30",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "aria-[invalid=true]:border-status-danger aria-[invalid=true]:ring-status-danger/30",
        className,
      )}
      {...props}
    />
  );
}
