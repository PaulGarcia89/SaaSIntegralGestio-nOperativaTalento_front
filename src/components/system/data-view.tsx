"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, ChevronsUpDown, Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, SkeletonRows } from "@/components/system/feedback";

/* ==========================================================================
   VISTA DE DATOS
   ==========================================================================
   Una tabla de ocho columnas dentro de un `overflow-x-auto` no es una tabla
   responsive: es una tabla que en un teléfono hay que arrastrar a ciegas. Aquí
   la misma declaración de columnas produce DOS presentaciones distintas:

     · escritorio → `<table>` real, con cabeceras y orden por columna
     · móvil      → una lista de fichas donde cada fila es una unidad legible

   No es una tabla encogida: es otra composición con los mismos datos. Por eso
   cada columna declara su `priority`, que decide qué se ve en la ficha móvil.
   ========================================================================== */

export type ColumnPriority =
  /** Identifica la fila. Es el título de la ficha en móvil. */
  | "identity"
  /** Estado o cifra clave. Se ve siempre, junto al título. */
  | "primary"
  /** Contexto útil. Se ve en el cuerpo de la ficha. */
  | "secondary"
  /** Solo en la tabla de escritorio y en la vista de detalle. */
  | "detail";

export type DataColumn<T> = {
  key: string;
  header: string;
  priority: ColumnPriority;
  render: (row: T) => ReactNode;
  /** Valor plano para ordenar y exportar. Sin esto la columna no se ordena. */
  sortValue?: (row: T) => string | number;
  /** Alinea a la derecha. Úsalo para toda columna numérica. */
  numeric?: boolean;
  /** Ancho sugerido en escritorio (clase de Tailwind). */
  width?: string;
};

export type DataViewProps<T> = {
  rows: T[];
  columns: DataColumn<T>[];
  getKey: (row: T) => string;
  /** Título accesible de la tabla. Obligatorio: una tabla sin `caption` no se
   *  puede identificar cuando hay varias en la pantalla. */
  caption: string;
  loading?: boolean;
  /** Acción por fila. En móvil hace que la ficha entera sea pulsable. */
  onRowAction?: (row: T) => void;
  rowActionLabel?: (row: T) => string;
  /** Se pinta al final de cada ficha móvil y en la última columna de la tabla. */
  rowActions?: (row: T) => ReactNode;
  emptyReason?: "no-records" | "no-matches";
  emptyAction?: ReactNode;
  onClearFilters?: () => void;
  className?: string;
};

type SortState = { key: string; direction: "asc" | "desc" } | null;

function compare(a: string | number, b: string | number) {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "es", { numeric: true, sensitivity: "base" });
}

export function DataView<T>({
  rows,
  columns,
  getKey,
  caption,
  loading = false,
  onRowAction,
  rowActionLabel,
  rowActions,
  emptyReason = "no-records",
  emptyAction,
  onClearFilters,
  className,
}: DataViewProps<T>) {
  const [sort, setSort] = useState<SortState>(null);
  const captionId = useId();

  const sorted = (() => {
    if (!sort) return rows;
    const column = columns.find((candidate) => candidate.key === sort.key);
    if (!column?.sortValue) return rows;
    const factor = sort.direction === "asc" ? 1 : -1;
    return [...rows].sort((left, right) => factor * compare(column.sortValue!(left), column.sortValue!(right)));
  })();

  if (loading) return <SkeletonRows rows={6} label={`Cargando ${caption.toLowerCase()}`} />;

  if (rows.length === 0) {
    return <EmptyState reason={emptyReason} action={emptyAction} onClearFilters={onClearFilters} />;
  }

  const identity = columns.find((column) => column.priority === "identity") ?? columns[0];
  const primary = columns.filter((column) => column.priority === "primary");
  const secondary = columns.filter((column) => column.priority === "secondary");

  function toggleSort(key: string) {
    setSort((current) => {
      if (current?.key !== key) return { key, direction: "asc" };
      if (current.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  }

  return (
    <div className={cn("min-w-0", className)}>
      {/* ---------------- Escritorio ---------------- */}
      <div className="hidden overflow-hidden rounded-xl border border-line bg-surface-1 md:block">
        <table className="w-full border-collapse text-sm">
          <caption id={captionId} className="sr-only">
            {caption}
            {sort ? `. Ordenada por ${columns.find((c) => c.key === sort.key)?.header}, ${sort.direction === "asc" ? "ascendente" : "descendente"}` : ""}
          </caption>
          <thead>
            <tr className="border-b border-line bg-surface-2">
              {columns.map((column) => {
                const sortable = Boolean(column.sortValue);
                const active = sort?.key === column.key;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={active ? (sort!.direction === "asc" ? "ascending" : "descending") : sortable ? "none" : undefined}
                    className={cn(
                      "px-4 py-3 text-2xs font-semibold uppercase tracking-[0.08em] text-ink-2",
                      column.numeric ? "text-right" : "text-left",
                      column.width,
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-xs hover:text-ink-1",
                          active && "text-accent-ink",
                        )}
                      >
                        {column.header}
                        <ChevronsUpDown className="size-3" aria-hidden="true" />
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
              {rowActions ? (
                <th scope="col" className="px-4 py-3 text-right text-2xs font-semibold uppercase tracking-[0.08em] text-ink-2">
                  <span className="sr-only">Acciones</span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr
                key={getKey(row)}
                className="border-b border-line last:border-0 transition-colors hover:bg-surface-2/60"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "px-4 align-middle text-ink-1",
                      column.numeric && "text-right font-mono tabular-figures",
                    )}
                    style={{ height: "var(--row-h)" }}
                  >
                    {column.render(row)}
                  </td>
                ))}
                {rowActions ? <td className="px-4 text-right">{rowActions(row)}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---------------- Móvil ----------------
          Cada fila es una ficha. El título es la columna de identidad, y las
          columnas `detail` NO se pintan: para eso está la vista de detalle. */}
      <ul className="space-y-2 md:hidden" aria-label={caption}>
        {sorted.map((row) => {
          const content = (
            <>
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0 flex-1 font-semibold text-ink-1">{identity.render(row)}</div>
                {primary.length > 0 ? (
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {primary.map((column) => (
                      <div key={column.key} className={cn(column.numeric && "font-mono tabular-figures")}>
                        {column.render(row)}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              {secondary.length > 0 ? (
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {secondary.map((column) => (
                    <div key={column.key} className="min-w-0">
                      <dt className="text-2xs text-ink-3">{column.header}</dt>
                      <dd className={cn("truncate text-ink-1", column.numeric && "font-mono tabular-figures")}>
                        {column.render(row)}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </>
          );

          return (
            <li key={getKey(row)}>
              {onRowAction ? (
                <button
                  type="button"
                  onClick={() => onRowAction(row)}
                  aria-label={rowActionLabel?.(row)}
                  className="block w-full rounded-lg border border-line bg-surface-1 p-4 text-left transition-colors active:bg-surface-2"
                  style={{ minHeight: "var(--control-h-touch)" }}
                >
                  {content}
                </button>
              ) : (
                <div className="rounded-lg border border-line bg-surface-1 p-4">{content}</div>
              )}
              {rowActions ? <div className="mt-2 flex flex-wrap gap-2 px-1">{rowActions(row)}</div> : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ==========================================================================
   BARRA DE FILTROS
   ==========================================================================
   En móvil los filtros se pliegan tras un botón que dice CUÁNTOS hay activos.
   Una fila de cinco desplegables en un teléfono empuja el contenido fuera de
   la pantalla y esconde justo lo que se venía a mirar.
   ========================================================================== */

export function FilterBar({
  search,
  onSearchChange,
  searchLabel = "Buscar",
  activeCount = 0,
  onClear,
  children,
}: {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchLabel?: string;
  /** Número de filtros distintos del valor por defecto. */
  activeCount?: number;
  onClear?: () => void;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const searchId = useId();
  const panelId = useId();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {onSearchChange ? (
          <div className="relative min-w-0 flex-1">
            <label htmlFor={searchId} className="sr-only">
              {searchLabel}
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3"
              aria-hidden="true"
            />
            <Input
              id={searchId}
              type="search"
              value={search ?? ""}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchLabel}
              className="pl-9"
            />
          </div>
        ) : null}

        {children ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls={panelId}
            className="shrink-0 lg:hidden"
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            Filtros
            {activeCount > 0 ? (
              <span className="ml-1 rounded-full bg-accent-fill px-1.5 font-mono text-2xs text-on-accent-fill tabular-figures">
                {activeCount}
              </span>
            ) : null}
          </Button>
        ) : null}
      </div>

      {children ? (
        <div
          id={panelId}
          className={cn("flex flex-wrap items-end gap-3", open ? "flex" : "hidden lg:flex")}
        >
          {children}
          {activeCount > 0 && onClear ? (
            <Button type="button" variant="ghost" onClick={onClear}>
              <X className="size-4" aria-hidden="true" />
              Quitar filtros
            </Button>
          ) : null}
        </div>
      ) : null}

      {/* Recuento en voz alta: quien navega con lector necesita saber que el
          filtro tuvo efecto sin recorrer la lista entera. */}
      <p className="sr-only" aria-live="polite">
        {activeCount === 0 ? "Sin filtros aplicados" : `${activeCount} filtros aplicados`}
      </p>
    </div>
  );
}

/* ==========================================================================
   PAGINACIÓN
   ========================================================================== */

export function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
}: {
  /** Índice de página empezando en 0, como en el resto del producto. */
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, totalItems);

  if (totalItems <= pageSize) return null;

  return (
    <nav aria-label="Paginación" className="flex flex-wrap items-center justify-between gap-3 pt-2">
      <p className="font-mono text-xs text-ink-2 tabular-figures">
        {start}–{end} de {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          disabled={page <= 0}
          onClick={() => onPageChange(page - 1)}
          aria-label="Página anterior"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Button>
        <span className="font-mono text-xs text-ink-2 tabular-figures">
          {page + 1} / {totalPages}
        </span>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          aria-label="Página siguiente"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
