"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Interruptor de encendido/apagado.
 *
 * Se apoya en un `<input type="checkbox">` con `role="switch"`, que es la
 * semántica correcta: el lector de pantalla anuncia "activado/desactivado" en
 * lugar de "casilla marcada".
 *
 * Úsalo solo cuando el cambio surte efecto de inmediato. Si la preferencia se
 * confirma al guardar un formulario, corresponde `Checkbox`.
 */
export function Switch({
  className,
  label,
  ...props
}: Omit<React.ComponentProps<"input">, "type" | "role"> & { label?: React.ReactNode }) {
  const control = (
    <span className="relative inline-flex h-11 items-center">
      <input
        type="checkbox"
        role="switch"
        className="peer absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        {...props}
      />
      <span
        aria-hidden="true"
        className={cn(
          "flex h-6 w-11 items-center rounded-full border border-border-strong bg-surface-interactive p-0.5 transition",
          "peer-hover:border-primary",
          "peer-checked:border-primary peer-checked:bg-primary",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-border-focus/40 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface-page",
          "peer-disabled:opacity-60",
          "[&>span]:translate-x-0 peer-checked:[&>span]:translate-x-5",
          className,
        )}
      >
        <span className="size-4 rounded-full bg-surface-elevated shadow-sm transition-transform" />
      </span>
    </span>
  );

  if (!label) return control;

  return (
    <label className="inline-flex cursor-pointer items-center gap-3 text-sm text-text-primary">
      {control}
      <span>{label}</span>
    </label>
  );
}
