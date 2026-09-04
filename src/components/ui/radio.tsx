"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Botón de opción accesible, con la misma técnica que `Checkbox`: un
 * `<input type="radio">` real, transparente, sobre la marca dibujada.
 *
 * Agrupar varias opciones exige el mismo `name` y un contenedor con
 * `role="radiogroup"` y su etiqueta, para que el lector de pantalla anuncie
 * cuántas opciones hay y cuál está activa.
 */
export function Radio({
  className,
  label,
  ...props
}: Omit<React.ComponentProps<"input">, "type"> & { label?: React.ReactNode }) {
  const control = (
    <span className="relative inline-flex size-11 shrink-0 items-center justify-center">
      <input
        type="radio"
        className="peer absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        {...props}
      />
      <span
        aria-hidden="true"
        className={cn(
          "flex size-5 items-center justify-center rounded-full border border-border-strong bg-surface-elevated transition",
          "peer-hover:border-primary",
          "peer-checked:border-primary",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-border-focus/40 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface-page",
          "peer-disabled:opacity-60",
          "[&>span]:opacity-0 peer-checked:[&>span]:opacity-100",
          className,
        )}
      >
        <span className="size-2.5 rounded-full bg-primary transition" />
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
