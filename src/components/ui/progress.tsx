import { cn } from "@/lib/utils";

/**
 * Barra de progreso determinada.
 *
 * Expone `role="progressbar"` con sus valores ARIA, que es lo que faltaba en
 * las implementaciones locales: había al menos una barra dibujada solo con un
 * `div` de ancho porcentual, invisible para un lector de pantalla.
 */
export function Progress({
  value,
  max = 100,
  label,
  className,
}: {
  value: number;
  max?: number;
  /** Nombre accesible. Obligatorio salvo que un `aria-labelledby` externo lo aporte. */
  label: string;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(max, value));
  const percent = max === 0 ? 0 : (clamped / max) * 100;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-interactive", className)}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width]"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
