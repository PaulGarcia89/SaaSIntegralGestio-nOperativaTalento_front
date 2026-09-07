import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Superficie elevada.
 *
 * En esta dirección la jerarquía la construyen la CAPA y la LÍNEA de 1px, no
 * la sombra. Por eso los tres niveles se diferencian sobre todo por su
 * superficie y su borde, y las sombras (`--shadow-e*`) son cortas y frías; en
 * tema oscuro incluyen una luz superior de 1px, que es lo que hace que una
 * tarjeta parezca una placa y no un recorte.
 *
 * Antes los tres niveles llevaban sombras literales
 * (`shadow-[0_16px_42px_rgba(15,23,42,0.10)]`) escritas en el componente.
 */
export function Card({ className, level = 2, ...props }: React.ComponentProps<"div"> & { level?: 1 | 2 | 3 }) {
  return (
    <div
      className={cn(
        "bg-surface-1 text-ink-1",
        // Nivel 1: lo destacado de la pantalla. Filo de marca y elevación real.
        level === 1 && "rounded-xl border border-accent-line/40 shadow-e2",
        // Nivel 2: la caja de trabajo habitual.
        level === 2 && "rounded-xl border border-line shadow-e1",
        // Nivel 3: agrupación ligera. Sin sombra: dentro de otra caja, una
        // sombra sobre otra sombra ensucia sin aportar profundidad.
        level === 3 && "rounded-lg border border-line bg-surface-2 shadow-none",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5 p-5", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 className={cn("font-display text-base font-semibold text-ink-1", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-sm text-ink-2", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-5 pb-5", className)} {...props} />;
}
