import { cn } from "@/lib/utils";

/**
 * Marcador de carga con la forma del contenido que va a llegar.
 *
 * Sustituye al patrón de pantalla completa con un spinner centrado
 * (`AsyncState state="loading"`), que provoca un salto de diseño al llegar los
 * datos porque el contenido real casi siempre es más alto que la tarjeta del
 * spinner.
 *
 * Consolida además los 25 `animate-pulse` sueltos repartidos por el producto.
 */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-xl bg-surface-interactive", className)}
      {...props}
    />
  );
}

/** Bloque de líneas de texto. `lines` controla cuántas. */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn("h-4", index === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

/** Silueta de tabla: cabecera más `rows` filas. */
export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3" aria-busy="true">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex gap-3">
          {Array.from({ length: columns }).map((_, column) => (
            <Skeleton key={column} className="h-12 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Rejilla de tarjetas. */
export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="h-40 rounded-2xl" />
      ))}
    </div>
  );
}
