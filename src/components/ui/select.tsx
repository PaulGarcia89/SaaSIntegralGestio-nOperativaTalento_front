"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

/**
 * Deriva el nombre accesible del `<label>` que envuelve al disparador.
 *
 * El patrón dominante del producto es:
 *
 *     <label className="...">Sucursal<Select><SelectTrigger>…</Select></label>
 *
 * Un `<label>` solo nombra a controles de formulario nativos. El disparador de
 * Radix es un `<button role="combobox">`, así que ese texto visible NO le da
 * nombre: axe reportaba `button-name` (crítico) en 138 de los 144 disparadores
 * del producto.
 *
 * En lugar de añadir `aria-label` a mano en 138 sitios —con el riesgo de que el
 * rótulo visible y el accesible se separen con el tiempo—, se toma el texto del
 * `<label>` contenedor excluyendo el propio disparador, que es exactamente lo
 * que el usuario ve como rótulo.
 *
 * Un `aria-label` o `aria-labelledby` explícito siempre tiene prioridad.
 */
function useLabelFromWrapper(explicitLabel?: string, explicitLabelledBy?: string) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const [derived, setDerived] = React.useState<string>();

  React.useEffect(() => {
    if (explicitLabel || explicitLabelledBy) return;
    const trigger = ref.current;
    const label = trigger?.closest("label");
    if (!trigger || !label) return;

    // Se clona el rótulo y se elimina el disparador para quedarse solo con el
    // texto propio del rótulo, sin el valor actualmente seleccionado.
    const clone = label.cloneNode(true) as HTMLElement;
    const triggerIndex = Array.from(label.querySelectorAll("*")).indexOf(trigger);
    const cloneTrigger = clone.querySelectorAll("*")[triggerIndex];
    cloneTrigger?.remove();

    const text = clone.textContent?.replace(/\s+/g, " ").trim();
    if (text) setDerived(text);
  }, [explicitLabel, explicitLabelledBy]);

  return { ref, derived };
}

export function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  const { ref, derived } = useLabelFromWrapper(props["aria-label"], props["aria-labelledby"]);

  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex h-11 w-full items-center justify-between rounded-2xl border border-input bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring/40",
        className,
      )}
      {...props}
      // Después del spread: así un `aria-label={undefined}` explícito no borra
      // el nombre derivado del rótulo contenedor.
      aria-label={props["aria-label"] ?? derived}
    >
      {children}
      <SelectPrimitive.Icon>
        <ChevronDown className="size-4 text-muted-foreground" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          data-select-content=""
          className={cn(
            "z-[100000] min-w-[8rem] overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-lg",
            className,
          )}
          {...props}
      >
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        "relative flex cursor-default select-none items-center rounded-xl py-2 pl-8 pr-3 text-sm outline-none focus:bg-accent",
        className,
      )}
      {...props}
    >
      <span className="absolute left-3 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}
