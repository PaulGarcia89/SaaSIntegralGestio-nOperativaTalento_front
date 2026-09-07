"use client";

import { Download } from "lucide-react";
import { type ReactNode, useEffect, useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BlockedState,
  DataView,
  EmptyState,
  FilterBar,
  PageSection,
  Pagination,
  type ColumnPriority,
  type DataColumn as SystemColumn,
  type SortState,
} from "@/components/system";
import { fetchMyPreferences, updateMyPreference } from "@/lib/backend";

/**
 * Primitivas de dominio compartidas por doce pantallas de administración.
 *
 * Este archivo es la palanca más larga del rediseño: `DomainTable`,
 * `FilterToolbar` y `StateCard` los usan Usuarios, Roles, Sucursales,
 * Empresas, Suscripciones, Planes, Módulos, Colas, Auditoría, Solicitudes de
 * empresa y Notificaciones. Migrarlo pasa esas pantallas al sistema sin
 * editarlas una por una, así que la API pública se conserva ENTERA: mismos
 * nombres, mismas props, mismo comportamiento observable.
 *
 * Qué cambia por dentro
 * ---------------------
 * · La tabla mantenía DOS listas: una cuadrícula de fichas para móvil, con
 *   cada columna en una fila etiqueta/valor, y una tabla para escritorio. En
 *   un iPhone eso producía una torre de seis filas por registro, con la
 *   información importante —el nombre— al mismo peso visual que el resto.
 *   Ahora es `DataView`: una sola declaración de columnas, tabla en
 *   escritorio y ficha jerarquizada en el teléfono, donde el identificador es
 *   el título y las dos columnas siguientes se leen a su lado.
 * · El estado vacío era una caja gris con la frase «No hay registros para
 *   mostrar», sin distinguir «no hay nada» de «no hay nada con estos
 *   filtros», que son dos situaciones con salidas distintas.
 * · Los botones de filtro se apilaban en tres o cuatro filas en pantallas
 *   estrechas. Ahora se pliegan tras un botón «Filtros» que muestra cuántos
 *   hay activos, y solo en el teléfono: en escritorio siguen a la vista.
 * · La barra inferior mezclaba el tamaño de página, la exportación y la
 *   paginación en una fila que en 320 px se desbordaba.
 * · Los colores venían de la paleta anterior (`bg-secondary/60`, `border/70`,
 *   `bg-card/82`) y no respondían a los tokens del sistema.
 *
 * Lo que se conserva sin tocar: el orden por columna, la persistencia de
 * columnas visibles y de orden en las preferencias del usuario, la
 * exportación a CSV, el tamaño de página y la búsqueda con normalización de
 * acentos.
 */

type ToolbarOption = {
  label: string;
  value: string;
};

export function matchesSearchAndFilter(
  values: Array<string | number | boolean | null | undefined>,
  searchValue: string,
  filterValue: string,
) {
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es")
      .trim();
  const searchable = normalize(values.join(" "));
  return searchable.includes(normalize(searchValue)) && searchable.includes(normalize(filterValue));
}

/**
 * Búsqueda más un grupo de filtros excluyentes.
 *
 * En un iPhone los botones de filtro ocupaban tres o cuatro filas antes de
 * llegar al contenido. Ahora viven detrás de «Filtros», con el número de
 * filtros activos, y se despliegan solos en escritorio.
 */
export function FilterToolbar({
  searchPlaceholder,
  options,
  searchValue,
  onSearchChange,
  filterValue,
  onFilterChange,
}: {
  searchPlaceholder: string;
  options: ToolbarOption[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  filterValue: string;
  onFilterChange: (value: string) => void;
}) {
  // El primer valor de la lista es el «todos» de cada pantalla: solo cuenta
  // como filtro activo lo que se aparta de él.
  const defaultValue = options[0]?.value ?? "";
  const active = filterValue !== defaultValue ? 1 : 0;

  return (
    <FilterBar
      search={searchValue}
      onSearchChange={onSearchChange}
      searchLabel={searchPlaceholder}
      activeCount={active}
      onClear={() => onFilterChange(defaultValue)}
    >
      <div className="flex min-w-0 flex-wrap gap-2" role="group" aria-label="Filtros">
        {options.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={filterValue === option.value ? "default" : "secondary"}
            onClick={() => onFilterChange(option.value)}
            aria-pressed={filterValue === option.value}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </FilterBar>
  );
}

/** Vacío o sin permiso, con la forma que el sistema da a cada uno. */
export function StateCard({
  title,
  description,
  tone,
  action,
}: {
  title: string;
  description: string;
  tone: "empty" | "restricted";
  action?: ReactNode;
}) {
  if (tone === "restricted") {
    return (
      <BlockedState
        title={title}
        cause={description}
        owner="Quien administra los permisos de tu empresa"
        resolution="Pide que te asignen un rol con acceso a esta pantalla."
        action={action}
      />
    );
  }
  return <EmptyState reason="no-records" title={title} description={description} action={action} />;
}

export function DrawerPreview({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <PageSection title={title} description={subtitle} boxed className="h-full">
      {children}
    </PageSection>
  );
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

type DataColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  exportValue?: (row: T) => string | number | boolean | null | undefined;
  sortValue?: (row: T) => string | number | boolean | null | undefined;
  excludeFromExport?: boolean;
  sortable?: boolean;
  /** Solo en la tabla de escritorio. */
  mobileHidden?: boolean;
  mobileLabel?: string;
  headerClassName?: string;
  cellClassName?: string;
  /** Jerarquía explícita en la ficha del teléfono. Si falta, se deduce. */
  priority?: ColumnPriority;
  numeric?: boolean;
};

function primitiveRenderValue<T>(column: DataColumn<T>, row: T) {
  const rendered = column.render(row);
  return typeof rendered === "string" || typeof rendered === "number" || typeof rendered === "boolean"
    ? rendered
    : "";
}

function sortableValue<T>(column: DataColumn<T>, row: T): string | number {
  const raw = column.sortValue
    ? column.sortValue(row)
    : column.exportValue
      ? column.exportValue(row)
      : primitiveRenderValue(column, row);
  if (typeof raw === "number") return raw;
  return String(raw ?? "");
}

function exportCsv<T>(columns: DataColumn<T>[], data: T[]) {
  const exportColumns = columns.filter((column) => !column.excludeFromExport && column.key !== "actions");
  const header = exportColumns.map((c) => c.header).join(",");
  const rows = data.map((row) =>
    exportColumns
      .map((c) => {
        const val = String(c.exportValue ? (c.exportValue(row) ?? "") : primitiveRenderValue(c, row));
        return val.includes(",") || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
      })
      .join(","),
  );
  const csvContent = ["\uFEFF", header, ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `export_${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Jerarquía de la ficha en el teléfono.
 *
 * Sin esto, `DataView` recibiría seis columnas del mismo peso y la ficha
 * volvería a ser la torre de pares etiqueta/valor que había antes. La regla:
 * la primera columna identifica el registro, las dos siguientes se leen a su
 * lado, el resto va en el cuerpo, y lo marcado como `mobileHidden` solo se ve
 * en la tabla de escritorio.
 */
function derivePriority<T>(column: DataColumn<T>, visible: DataColumn<T>[]): ColumnPriority {
  if (column.priority) return column.priority;
  if (column.mobileHidden) return "detail";
  const rank = visible.filter((candidate) => !candidate.mobileHidden).indexOf(column);
  if (rank === 0) return "identity";
  if (rank <= 2) return "primary";
  return "secondary";
}

export function DomainTable<T>({
  data,
  columns,
  onSelect,
  getKey,
  pageSize: initialPageSize = 10,
  exportable,
  mobileRender,
  preferencesKey,
  caption = "Registros",
  emptyAction,
  onClearFilters,
}: {
  data: T[];
  columns: DataColumn<T>[];
  onSelect?: (row: T) => void;
  getKey: (row: T) => string;
  pageSize?: number;
  exportable?: boolean;
  /** Reservado: ninguna pantalla lo usa; `DataView` compone la ficha. */
  mobileRender?: (row: T) => ReactNode;
  preferencesKey?: string;
  /** Título accesible de la tabla, para distinguirla cuando hay varias. */
  caption?: string;
  emptyAction?: ReactNode;
  /** Si se pasa, el vacío se lee como «ningún resultado con estos filtros». */
  onClearFilters?: () => void;
}) {
  void mobileRender;

  const pageSizeId = useId();
  const [page, setPage] = useState(0);
  const dataIdentity = data.map(getKey).join("|");
  const [paginationIdentity, setPaginationIdentity] = useState(dataIdentity);
  if (paginationIdentity !== dataIdentity) {
    setPaginationIdentity(dataIdentity);
    setPage(0);
  }

  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sort, setSort] = useState<SortState>(null);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => columns.map((column) => column.key));
  const columnKeySignature = columns.map((column) => column.key).join("|");
  const visibleColumns = columns.filter((column) => visibleColumnKeys.includes(column.key));

  useEffect(() => {
    if (!preferencesKey) return;
    let active = true;
    void fetchMyPreferences()
      .then((preferences) => {
        if (!active) return;
        const stored = preferences[`table:${preferencesKey}`] as
          | { visibleColumnKeys?: string[]; sortKey?: string | null; sortDir?: "asc" | "desc" }
          | undefined;
        if (stored?.visibleColumnKeys?.length) {
          setVisibleColumnKeys(
            stored.visibleColumnKeys.filter((key) => columns.some((column) => column.key === key)),
          );
        }
        if (stored?.sortKey && columns.some((column) => column.key === stored.sortKey)) {
          setSort({ key: stored.sortKey, direction: stored.sortDir ?? "asc" });
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [columnKeySignature, preferencesKey]);

  function persist(next: { visibleColumnKeys?: string[]; sortKey?: string | null; sortDir?: "asc" | "desc" }) {
    if (!preferencesKey) return;
    void updateMyPreference(`table:${preferencesKey}`, {
      visibleColumnKeys,
      sortKey: sort?.key ?? null,
      sortDir: sort?.direction ?? "asc",
      ...next,
    }).catch(() => undefined);
  }

  // El orden es CONTROLADO porque se guarda en las preferencias del usuario:
  // si la vista lo llevase por dentro, se perdería en cada montaje.
  const sortedData = useMemo(() => {
    if (!sort) return data;
    const column = columns.find((candidate) => candidate.key === sort.key);
    if (!column) return data;
    const factor = sort.direction === "asc" ? 1 : -1;
    return [...data].sort((a, b) => {
      const left = sortableValue(column, a);
      const right = sortableValue(column, b);
      if (typeof left === "number" && typeof right === "number") return factor * (left - right);
      return factor * String(left).localeCompare(String(right), "es", { numeric: true });
    });
  }, [data, sort, columns]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const effectivePage = Math.min(page, totalPages - 1);
  const paginatedData = useMemo(
    () => sortedData.slice(effectivePage * pageSize, (effectivePage + 1) * pageSize),
    [sortedData, effectivePage, pageSize],
  );

  const systemColumns: Array<SystemColumn<T>> = visibleColumns.map((column) => ({
    key: column.key,
    header: column.header,
    priority: derivePriority(column, visibleColumns),
    render: column.render,
    numeric: column.numeric,
    // `DataView` solo ofrece ordenar la columna que declara un valor de orden:
    // así una columna no ordenable no presenta una cabecera que no responde.
    sortValue: column.sortable ? (row: T) => sortableValue(column, row) : undefined,
  }));

  return (
    <div className="space-y-3">
      <DataView
        rows={paginatedData}
        columns={systemColumns}
        getKey={getKey}
        caption={caption}
        sort={sort}
        onSortChange={(next) => {
          setSort(next);
          persist({ sortKey: next?.key ?? null, sortDir: next?.direction ?? "asc" });
        }}
        onRowAction={onSelect}
        rowActionLabel={() => "Ver detalle"}
        emptyReason={onClearFilters ? "no-matches" : "no-records"}
        emptyAction={emptyAction}
        onClearFilters={onClearFilters}
      />

      {/* Solo aparece cuando hay más de una página o algo que exportar: antes
          la barra se pintaba entera y en 320 px se desbordaba. */}
      {sortedData.length > pageSize || exportable ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-2xs text-ink-2">
            <label htmlFor={pageSizeId}>Mostrar</label>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPage(0);
              }}
            >
              <SelectTrigger id={pageSizeId} className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {exportable ? (
              <Button variant="secondary" size="sm" onClick={() => exportCsv(columns, sortedData)}>
                <Download className="size-4" aria-hidden="true" />
                Exportar CSV
              </Button>
            ) : null}
            {sortedData.length > pageSize ? (
              <Pagination
                page={effectivePage}
                totalItems={sortedData.length}
                pageSize={pageSize}
                onPageChange={setPage}
              />
            ) : null}
          </div>
        </div>
      ) : null}

      {preferencesKey ? (
        <details className="rounded-md border border-line bg-surface-1 px-3 py-2 text-sm">
          <summary className="flex cursor-pointer list-none items-center gap-2 font-medium text-ink-1">
            Columnas visibles
          </summary>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-3">
            {columns
              .filter((column) => column.key !== "actions")
              .map((column) => {
                const checked = visibleColumnKeys.includes(column.key);
                const onlyOne = visibleColumnKeys.length === 1 && checked;
                return (
                  <label
                    key={column.key}
                    className="flex items-center gap-2 text-ink-1"
                    style={{ minHeight: "var(--control-h-touch)" }}
                  >
                    <input
                      type="checkbox"
                      className="size-4 accent-[hsl(var(--accent-fill))]"
                      checked={checked}
                      disabled={onlyOne}
                      onChange={(event) => {
                        const next = event.target.checked
                          ? [...visibleColumnKeys, column.key]
                          : visibleColumnKeys.filter((key) => key !== column.key);
                        setVisibleColumnKeys(next);
                        persist({ visibleColumnKeys: next });
                      }}
                    />
                    {column.mobileLabel ?? column.header}
                  </label>
                );
              })}
          </div>
        </details>
      ) : null}

    </div>
  );
}
