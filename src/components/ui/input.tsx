import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Campo de texto.
 *
 * Tres decisiones que conviene no revertir:
 *
 * 1. `text-base sm:text-sm`. Safari de iOS hace zoom sobre la página al enfocar
 *    un control nativo cuya tipografía baja de 16px, y el usuario no tiene
 *    forma evidente de deshacerlo: la maqueta salta y el resto del formulario
 *    queda fuera de pantalla. A partir de `sm` (640px, ya fuera de cualquier
 *    iPhone en vertical) se conserva el tamaño menor.
 *
 * 2. El borde es `--line-control`, mucho más oscuro que la línea decorativa.
 *    WCAG 1.4.11 exige 3:1 para el límite visual de un control; la línea de
 *    separación de una tarjeta no llega, y era la que se usaba aquí.
 *
 * 3. La altura sale de `--control-h-*`, que reescala con la densidad, en vez de
 *    estar fija en `h-11`.
 */
export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex w-full min-w-0 rounded-md border border-line-control bg-surface-1 px-3 py-2",
        "min-h-[var(--control-h-touch)] sm:min-h-[var(--control-h-base)]",
        "text-base text-ink-1 sm:text-sm",
        "placeholder:text-ink-3",
        "outline-none transition-colors duration-[var(--dur-fast)]",
        "hover:border-ink-3",
        "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-ink-disabled",
        "aria-invalid:border-status-danger aria-invalid:bg-status-danger/5",
        "data-[success=true]:border-status-success",
        className,
      )}
      {...props}
    />
  );
}
