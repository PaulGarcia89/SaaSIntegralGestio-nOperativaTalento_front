"use client";

import * as React from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Casilla de verificación accesible.
 *
 * Se construye sobre un `<input type="checkbox">` real en lugar de recrear el
 * control: así el estado, el foco, el teclado y el anuncio del lector de
 * pantalla los aporta el navegador. El input queda transparente sobre la caja
 * dibujada, que solo es decoración.
 *
 * Sustituye a los 82 checkbox sueltos del producto y a los glifos `☑`/`☐` que
 * se usaban en `employees-workspace.tsx`, que no tenían rol ni estado y por lo
 * tanto eran invisibles para un lector de pantalla.
 *
 * `indeterminate` cubre el caso de "seleccionar todo" con selección parcial.
 */
export function Checkbox({
  className,
  indeterminate = false,
  label,
  ...props
}: Omit<React.ComponentProps<"input">, "type"> & { indeterminate?: boolean; label?: React.ReactNode }) {
  const ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const control = (
    // El área táctil mínima de 44 px la aporta el contenedor, no la caja de
    // 20 px: agrandar la caja la haría desproporcionada junto al texto.
    <span className="relative inline-flex size-11 shrink-0 items-center justify-center">
      <input
        ref={ref}
        type="checkbox"
        className="peer absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        {...props}
      />
      <span
        aria-hidden="true"
        className={cn(
          "flex size-5 items-center justify-center rounded-md border border-border-strong bg-surface-elevated text-primary-foreground transition",
          "peer-hover:border-primary",
          "peer-checked:border-primary peer-checked:bg-primary",
          "peer-indeterminate:border-primary peer-indeterminate:bg-primary",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-border-focus/40 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface-page",
          "peer-disabled:opacity-60",
          // `peer-checked:` solo alcanza a hermanos, y el icono es descendiente:
          // por eso la variante se aplica desde la caja con un selector hijo.
          "[&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100 peer-indeterminate:[&>svg]:opacity-100",
          className,
        )}
      >
        {indeterminate ? (
          <Minus className="size-3.5" strokeWidth={3} />
        ) : (
          <Check className="size-3.5" strokeWidth={3} />
        )}
      </span>
    </span>
  );

  if (!label) return control;

  return (
    <label className="inline-flex cursor-pointer items-center gap-1 text-sm text-text-primary">
      {control}
      <span>{label}</span>
    </label>
  );
}
