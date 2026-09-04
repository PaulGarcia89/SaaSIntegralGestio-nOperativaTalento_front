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
/*
 * `text-base sm:text-sm`: Safari de iOS hace zoom automático sobre la página
 * al enfocar un campo cuya tipografía baja de 16px, y el usuario no tiene
 * forma evidente de deshacerlo: la maqueta salta y el resto del formulario
 * queda fuera de pantalla. 16px en móvil lo evita. A partir de `sm` (640px,
 * ya fuera de cualquier iPhone en vertical) se conserva 14px, así que ninguna
 * otra pantalla del producto cambia de aspecto en escritorio.
 */
export function Textarea({ className, rows = 4, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      rows={rows}
      className={cn(
        "flex w-full rounded-2xl border border-border-default bg-surface-elevated px-4 py-3 text-base text-text-primary outline-none transition sm:text-sm",
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
