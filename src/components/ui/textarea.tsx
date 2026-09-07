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
        // Mismo origen que `Input`: `.field` ya trae la variante de área de
        // texto —bloque, altura mínima y redimensionado vertical—.
        "field",
        className,
      )}
      {...props}
    />
  );
}
