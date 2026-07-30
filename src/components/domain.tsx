"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Download, Search } from "lucide-react";
import { type ReactNode, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { InlineFeedback, Pagination, ResponsiveDataView } from "@/components/design-system";

type ToolbarOption = {
  label: string;
  value: string;
};

export function matchesSearchAndFilter(
  values: Array<string | number | boolean | null | undefined>,
  searchValue: string,
  filterValue: string,
) {
  const normalize = (value: string) => value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();
  const searchable = normalize(values.join(" "));
  return searchable.includes(normalize(searchValue)) && searchable.includes(normalize(filterValue));
}

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
  const activeFilterLabel = options.find((o) => o.value === filterValue)?.label ?? "";

  return (
    <div className="rounded-2xl border border-border/70 bg-card/82 p-3 shadow-[0_16px_56px_-40px_rgba(15,23,42,0.24)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            role="search"
            aria-label={searchPlaceholder}
            className="border-white/60 bg-background/80 pl-10"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtros">
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
      </div>
      <div aria-live="polite" className="sr-only">
        {activeFilterLabel ? `Filtro activo: ${activeFilterLabel}` : ""}
      </div>
    </div>
  );
}

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
  return <InlineFeedback tone={tone === "restricted" ? "warning" : "info"} title={title} action={action}>{description}</InlineFeedback>;
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
    <Card className="h-full border-border/70 bg-card/85">
      <CardHeader>
        <p className="text-sm font-medium text-muted-foreground">{subtitle}</p>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
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
  mobileHidden?: boolean;
  mobileLabel?: string;
  headerClassName?: string;
  cellClassName?: string;
};

function primitiveRenderValue<T>(column: DataColumn<T>, row: T) {
  const rendered = column.render(row);
  return typeof rendered === "string" || typeof rendered === "number" || typeof rendered === "boolean" ? rendered : "";
}

function exportCsv<T>(columns: DataColumn<T>[], data: T[]) {
  const exportColumns = columns.filter((column) => !column.excludeFromExport && column.key !== "actions");
  const header = exportColumns.map((c) => c.header).join(",");
  const rows = data.map((row) =>
    exportColumns
      .map((c) => {
        const val = String(c.exportValue ? c.exportValue(row) ?? "" : primitiveRenderValue(c, row));
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

export function DomainTable<T>({
  data,
  columns,
  onSelect,
  getKey,
  pageSize: initialPageSize = 10,
  exportable,
  tableClassName,
  mobileRender,
}: {
  data: T[];
  columns: DataColumn<T>[];
  onSelect?: (row: T) => void;
  getKey: (row: T) => string;
  pageSize?: number;
  exportable?: boolean;
  tableClassName?: string;
  mobileRender?: (row: T) => ReactNode;
}) {
  const [page, setPage] = useState(0);
  const dataIdentity = data.map(getKey).join("|");
  const [paginationIdentity, setPaginationIdentity] = useState(dataIdentity);
  if (paginationIdentity !== dataIdentity) {
    setPaginationIdentity(dataIdentity);
    setPage(0);
  }
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return data;
    return [...data].sort((a, b) => {
      const aVal = String(col.sortValue ? col.sortValue(a) ?? "" : col.exportValue ? col.exportValue(a) ?? "" : primitiveRenderValue(col, a));
      const bVal = String(col.sortValue ? col.sortValue(b) ?? "" : col.exportValue ? col.exportValue(b) ?? "" : primitiveRenderValue(col, b));
      const cmp = aVal.localeCompare(bVal, "es", { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir, columns]);

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const effectivePage = Math.min(page, Math.max(0, totalPages - 1));
  const paginatedData = useMemo(
    () => sortedData.slice(effectivePage * pageSize, (effectivePage + 1) * pageSize),
    [sortedData, effectivePage, pageSize],
  );
  const rangeStart = sortedData.length ? effectivePage * pageSize + 1 : 0;
  const rangeEnd = Math.min((effectivePage + 1) * pageSize, sortedData.length);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  if (sortedData.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-border/70">
        <div className="p-8 text-center text-sm text-muted-foreground">
          No hay registros para mostrar
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ResponsiveDataView data={paginatedData} getKey={getKey} desktop={null} mobile={(row) => <div className="space-y-3">
              {mobileRender
                ? mobileRender(row)
                : columns.filter((column) => !column.mobileHidden).map((column) => (
                    <div key={`${getKey(row)}-mobile-${column.key}`} className="grid grid-cols-[minmax(90px,0.4fr)_1fr] gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0">
                      <span className="text-xs font-medium text-muted-foreground">{column.mobileLabel ?? column.header}</span>
                      <div className="min-w-0 text-sm text-foreground">{column.render(row)}</div>
                    </div>
                  ))}
              {onSelect ? (
                <Button type="button" variant="secondary" className="w-full" onClick={() => onSelect(row)}>
                  Ver detalle
                </Button>
              ) : null}
            </div>} />

      <div className="hidden overflow-hidden rounded-xl border border-border/70 md:block">
        <div className="overflow-x-auto">
          <table className={cn("w-full text-left text-sm", tableClassName)}>
            <thead className="bg-secondary/60">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "px-4 py-3 font-medium text-muted-foreground",
                      column.headerClassName,
                    )}
                    aria-sort={column.sortable && sortKey === column.key ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
                  >
                    {column.sortable ? (
                    <button type="button" className="flex items-center gap-1.5 rounded-sm hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" onClick={() => handleSort(column.key)}>
                      {column.header}
                      {sortKey === column.key ? (
                          sortDir === "asc" ? (
                            <ArrowUp className="size-3" aria-hidden="true" />
                          ) : (
                            <ArrowDown className="size-3" aria-hidden="true" />
                          )
                        ) : (
                          <ArrowUpDown className="size-3 opacity-40" aria-hidden="true" />
                        )}
                    </button>
                    ) : <span>{column.header}</span>}
                  </th>
                ))}
                {onSelect ? <th scope="col" className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70 bg-card">
              {paginatedData.map((row) => (
                <tr
                  key={getKey(row)}
                  className="transition-colors hover:bg-accent/20"
                >
                  {columns.map((column) => (
                    <td
                      key={`${getKey(row)}-${column.key}`}
                      className={cn("px-4 py-3 align-middle", column.cellClassName)}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                  {onSelect ? (
                    <td className="px-4 py-3 text-right">
                      <Button type="button" variant="secondary" size="sm" onClick={() => onSelect(row)} aria-label={`Ver detalle del registro ${getKey(row)}`}>
                        Ver detalle
                      </Button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Mostrar</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPage(0);
              }}
            >
              <SelectTrigger className="h-11 w-20 rounded-lg text-xs">
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
            <span>{rangeStart}–{rangeEnd} de {sortedData.length}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {exportable ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => exportCsv(columns, sortedData)}
                className="gap-1.5 text-xs"
              >
                <Download className="size-3" />
                CSV
              </Button>
            ) : null}
            <Pagination page={effectivePage} totalPages={totalPages} totalItems={sortedData.length} pageSize={pageSize} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}
