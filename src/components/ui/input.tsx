import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * `text-base sm:text-sm`: Safari de iOS hace zoom automático sobre la página
 * al enfocar un campo cuya tipografía baja de 16px, y el usuario no tiene
 * forma evidente de deshacerlo: la maqueta salta y el resto del formulario
 * queda fuera de pantalla. 16px en móvil lo evita. A partir de `sm` (640px,
 * ya fuera de cualquier iPhone en vertical) se conserva 14px, así que ninguna
 * otra pantalla del producto cambia de aspecto en escritorio.
 */
export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-2xl border border-border-default bg-surface-elevated px-4 py-2 text-base text-text-primary sm:text-sm outline-none transition hover:border-border-strong focus-visible:border-border-focus focus-visible:ring-2 focus-visible:ring-border-focus/30 disabled:cursor-not-allowed disabled:bg-surface-interactive disabled:text-text-disabled aria-invalid:border-status-danger aria-invalid:ring-2 aria-invalid:ring-status-danger/20 data-[success=true]:border-status-success",
        className,
      )}
      {...props}
    />
  );
}
