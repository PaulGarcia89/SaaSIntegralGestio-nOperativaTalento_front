"use client";

import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Download, Search, ShieldAlert, SearchX } from "lucide-react";
import { type ReactNode, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type ToolbarOption = {
  label: string;
  value: string;
};

export function FilterToolbar({
  searchPlaceholder,
  options,
  activeValue,
  onChange,
}: {
  searchPlaceholder: string;
  options: ToolbarOption[];
  activeValue: string;
  onChange: (value: string) => void;
}) {
  const resultCount = options.find((o) => o.value === activeValue)?.label ?? "";

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
            value={activeValue}
            onChange={(event) => onChange(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtros">
          {options.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={activeValue === option.value ? "default" : "secondary"}
              onClick={() => onChange(option.value)}
              aria-pressed={activeValue === option.value}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
      <div aria-live="polite" className="sr-only">
        {resultCount ? `Mostrando: ${resultCount}` : ""}
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
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Card className="border-dashed border-border/70 bg-card/80">
        <CardContent className="flex flex-col items-center gap-4 px-6 py-12 text-center">
          <div
            className={cn(
              "flex size-14 items-center justify-center rounded-2xl",
              tone === "restricted"
                ? "bg-gradient-to-br from-amber-100 to-rose-100 dark:from-amber-900/30 dark:to-rose-900/30"
                : "bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30",
            )}
          >
            {tone === "restricted" ? (
              <ShieldAlert className="size-7 text-amber-600 dark:text-amber-400" />
            ) : (
              <SearchX className="size-7 text-cyan-600 dark:text-cyan-400" />
            )}
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">{title}</h3>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{description}</p>
          </div>
          {action ? <div>{action}</div> : null}
        </CardContent>
      </Card>
    </motion.div>
  );
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
        <Badge variant="outline" className="w-fit rounded-full">
          {subtitle}
        </Badge>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function exportCsv<T>(columns: Array<{ key: string; header: string; render: (row: T) => ReactNode }>, data: T[]) {
  const header = columns.map((c) => c.header).join(",");
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const val = String(c.render(row) ?? "");
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
}: {
  data: T[];
  columns: Array<{
    key: string;
    header: string;
    render: (row: T) => ReactNode;
    sortable?: boolean;
    headerClassName?: string;
    cellClassName?: string;
  }>;
  onSelect?: (row: T) => void;
  getKey: (row: T) => string;
  pageSize?: number;
  exportable?: boolean;
  tableClassName?: string;
}) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return data;
    return [...data].sort((a, b) => {
      const aVal = String(col.render(a) ?? "");
      const bVal = String(col.render(b) ?? "");
      const cmp = aVal.localeCompare(bVal, "es", { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir, columns]);

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(
    () => sortedData.slice(page * pageSize, (page + 1) * pageSize),
    [sortedData, page, pageSize],
  );

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
      <div className="overflow-hidden rounded-xl border border-border/70">
        <div className="overflow-x-auto">
          <table className={cn("w-full min-w-[720px] text-left text-sm", tableClassName)}>
            <thead className="bg-secondary/60">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "px-4 py-3 font-medium text-muted-foreground",
                      column.sortable && "cursor-pointer select-none hover:text-foreground",
                      column.headerClassName,
                    )}
                    onClick={column.sortable ? () => handleSort(column.key) : undefined}
                  >
                    <span className="flex items-center gap-1.5">
                      {column.header}
                      {column.sortable ? (
                        sortKey === column.key ? (
                          sortDir === "asc" ? (
                            <ArrowUp className="size-3" />
                          ) : (
                            <ArrowDown className="size-3" />
                          )
                        ) : (
                          <ArrowUpDown className="size-3 opacity-40" />
                        )
                      ) : null}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70 bg-card">
              {paginatedData.map((row) => (
                <tr
                  key={getKey(row)}
                  onClick={() => onSelect?.(row)}
                  onKeyDown={(e) => {
                    if (onSelect && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      onSelect(row);
                    }
                  }}
                  tabIndex={onSelect ? 0 : undefined}
                  role={onSelect ? "button" : undefined}
                  className={cn("transition-colors", onSelect ? "cursor-pointer hover:bg-accent/40 focus-visible:outline-2 focus-visible:outline-primary" : "")}
                >
                  {columns.map((column) => (
                    <td
                      key={`${getKey(row)}-${column.key}`}
                      className={cn("px-4 py-3 align-middle", column.cellClassName)}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Mostrar</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPage(0);
              }}
            >
              <SelectTrigger className="h-7 w-16 rounded-lg text-xs">
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
            <span>de {sortedData.length} registros</span>
          </div>
          <div className="flex items-center gap-2">
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
            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="size-3" />
              </Button>
              <span className="px-2 text-xs text-muted-foreground">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <ChevronRight className="size-3" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
