"use client";

import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, RefreshCw } from "lucide-react";
import { downloadRestaurantReport, fetchRestaurantRecipeCost, fetchRestaurantRecipes, fetchRestaurantReport, getApiErrorMessage } from "@/lib/backend";
import { useAppStore } from "@/store/app-store";
import { InlineFeedback, PageHeader } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import {
  DataView,
  ErrorState,
  SkeletonRows,
} from "@/components/system";
import { RowTable } from "@/components/row-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RestaurantDecisionDashboard } from "@/components/restaurant-decision-dashboard";
import { RestaurantReportsWorkspace } from "@/components/restaurant-reports-workspace";

const reportOptions = [
  ["kardex", "Kardex"], ["valued-stock", "Existencias valorizadas"], ["receipts-by-supplier", "Entradas"], ["consumption-by-recipe", "Consumo"],
  ["waste-by-reason", "Desperdicios"], ["expiry", "Vencimientos"], ["count-variances", "Diferencias de conteo"],
  ["recipe-cost", "Costo por receta"], ["theoretical-margin", "Margen teórico"], ["theoretical-vs-real", "Consumo teórico vs real"], ["purchase-suggestions", "Sugerencias de compra"],
  ["audit", "Auditoría"],
] as const;

type Filters = { companyId: string; branchId: string; warehouseId: string; from: string; to: string; ingredientId: string; categoryId: string; recipeId: string; supplierId: string; page: number; pageSize: number; sort?: string; direction?: string };
const initialFilters: Filters = { companyId: "", branchId: "", warehouseId: "", from: "", to: "", ingredientId: "", categoryId: "", recipeId: "", supplierId: "", page: 1, pageSize: 20, sort: "", direction: "asc" };

export function RestaurantReportsView({ section }: { section: string }) {
  const { can } = useAppStore();
  if (section === "analytics") return <RestaurantDecisionDashboard />;
  if (section === "costs") return <RecipeCostScreen />;
  if (section === "audit") return can("restaurant_inventory.manage") ? <RestaurantReportsWorkspace initialReport="audit" /> : <InlineFeedback tone="warning" title="Permiso de auditoría requerido">Tu perfil no puede consultar la auditoría detallada.</InlineFeedback>;
  return <RestaurantReportsWorkspace initialReport={section === "purchase-suggestions" ? "purchase-suggestions" : undefined} />;
}


function ReportsScreen({ initialReport }: { initialReport?: string }) { const [report, setReport] = useState(initialReport ?? "kardex"); const [filters, setFilters] = useState<Filters>(initialFilters); const query = useQuery({ queryKey: ["restaurant-report", report, filters], queryFn: () => fetchRestaurantReport(report, filters) }); const setFilter = (key: keyof Filters, value: string | number) => setFilters({ ...filters, [key]: value, ...(key !== "page" ? { page: 1 } : {}) }); return <div className="space-y-5"><PageHeader eyebrow="Reportes" title="Reportes de inventario" description="Selecciona un reporte y aplica filtros al contexto actual." actions={<Button variant="secondary" disabled={query.isFetching} onClick={() => void query.refetch()}><RefreshCw className="size-4" />Actualizar</Button>} /><Card level={1}><CardContent className="space-y-4 p-5"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div><Label htmlFor="report-type">Reporte</Label><select id="report-type" className="field" value={report} onChange={(e) => { setReport(e.target.value); setFilters({ ...filters, page: 1 }); }}>{reportOptions.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div><FilterField id="report-company" label="Empresa" value={filters.companyId} onChange={(v) => setFilter("companyId", v)} /><FilterField id="report-branch" label="Sucursal" value={filters.branchId} onChange={(v) => setFilter("branchId", v)} /><FilterField id="report-warehouse" label="Almacén" value={filters.warehouseId} onChange={(v) => setFilter("warehouseId", v)} /><FilterField id="report-from" label="Desde" type="date" value={filters.from} onChange={(v) => setFilter("from", v)} /><FilterField id="report-to" label="Hasta" type="date" value={filters.to} onChange={(v) => setFilter("to", v)} /><FilterField id="report-ingredient" label="Ingrediente" value={filters.ingredientId} onChange={(v) => setFilter("ingredientId", v)} /><FilterField id="report-category" label="Categoría" value={filters.categoryId} onChange={(v) => setFilter("categoryId", v)} /><FilterField id="report-recipe" label="Receta" value={filters.recipeId} onChange={(v) => setFilter("recipeId", v)} /><FilterField id="report-supplier" label="Proveedor" value={filters.supplierId} onChange={(v) => setFilter("supplierId", v)} /></div><div className="flex flex-wrap gap-2 text-xs text-text-secondary">{Object.entries(filters).filter(([key, value]) => value && !["page", "pageSize", "sort", "direction"].includes(key)).map(([key, value]) => <Badge key={key} variant="secondary">{key}: {String(value)}</Badge>)}</div></CardContent></Card><ReportQueryState query={query}>{query.data ? <ReportTable report={report} data={query.data} filters={filters} onSort={(key) => setFilters({ ...filters, sort: key, direction: filters.sort === key && filters.direction === "asc" ? "desc" : "asc" })} onPage={(page) => setFilter("page", page)} /> : null}</ReportQueryState></div>; }

function ReportTable({ report, data, filters, onSort, onPage }: { report: string; data: import("@/lib/contracts").RestaurantReportDto; filters: Filters; onSort: (key: string) => void; onPage: (page: number) => void }) { return <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-text-secondary">Generado: {data.generatedAt} · Página {data.page} de {data.totalPages} · {data.total} registros</p><Button variant="secondary" onClick={() => void downloadRestaurantReport(report, filters)}><Download className="size-4" />Exportar</Button></div><div className="grid gap-3 sm:grid-cols-3">{data.summary.map((item) => <Metric key={item.label} label={item.label} value={item.value} />)}</div>{data.rows.length ? <DataView rows={data.rows.map((row, index) => ({ ...row, __key: `${String(row.id ?? index)}-${index}` }))} columns={data.columns.map((column, index) => ({ key: column.key, header: column.label, priority: index === 0 ? "identity" as const : index <= 2 ? "primary" as const : "secondary" as const, render: (row: Record<string, unknown>) => String(row[column.key] ?? "—"), sortValue: (row: Record<string, unknown>) => String(row[column.key] ?? "") }))} getKey={(row: Record<string, unknown>) => String(row.__key)} caption="Resultados del informe" sort={filters.sort ? { key: filters.sort, direction: filters.direction === "desc" ? "desc" : "asc" } : null} onSortChange={(next: { key: string; direction: "asc" | "desc" } | null) => onSort(next?.key ?? "")} /> : <InlineFeedback tone="info" title="Sin resultados">No hay datos para los filtros aplicados.</InlineFeedback>}<div className="flex justify-end gap-2"><Button size="sm" variant="secondary" disabled={data.page <= 1} onClick={() => onPage(data.page - 1)}>Anterior</Button><Button size="sm" variant="secondary" disabled={data.page >= data.totalPages} onClick={() => onPage(data.page + 1)}>Siguiente</Button></div></div>; }

function RecipeCostScreen() { const [recipeId, setRecipeId] = useState(""); const recipes = useQuery({ queryKey: ["restaurant-recipes"], queryFn: () => fetchRestaurantRecipes() }); const query = useQuery({ queryKey: ["restaurant-recipe-cost", recipeId], queryFn: () => fetchRestaurantRecipeCost(recipeId), enabled: Boolean(recipeId) }); return <div className="space-y-5"><PageHeader eyebrow="Rentabilidad" title="Costo de receta" description="Costos, márgenes e historial se calculan y versionan en el backend." /><Card level={2}><CardContent className="grid gap-3 p-5 sm:grid-cols-[minmax(260px,420px)_1fr] sm:items-end"><div><Label htmlFor="recipe-cost-select">Receta</Label><select id="recipe-cost-select" className="field mt-1" value={recipeId} onChange={(event) => setRecipeId(event.target.value)} disabled={recipes.isLoading}><option value="">Seleccionar receta</option>{(recipes.data ?? []).map((recipe) => <option key={recipe.id} value={recipe.id}>{recipe.code} · {recipe.name}</option>)}</select></div><span className="text-sm text-text-secondary">Selecciona una receta para consultar costo por porción, margen e historial.</span></CardContent></Card><ReportQueryState query={query}>{query.data ? <div className="space-y-4"><ReportTableSimple headers={["Ingrediente", "Cantidad", "Unidad", "Costo unitario", "Costo ingrediente"]} rows={query.data.ingredients.map((item) => [item.ingredientName, item.quantity, item.unit, `$${item.unitCost.toFixed(2)}`, `$${item.ingredientCost.toFixed(2)}`])} /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><Metric label="Costo total" value={`$${query.data.totalCost.toFixed(2)}`} /><Metric label="Costo por porción" value={`$${query.data.costPerPortion.toFixed(2)}`} /><Metric label="Precio venta" value={query.data.salePrice == null ? "-" : `$${query.data.salePrice.toFixed(2)}`} /><Metric label="Margen monetario" value={query.data.marginAmount == null ? "-" : `$${query.data.marginAmount.toFixed(2)}`} /><Metric label="Margen %" value={query.data.marginPercent == null ? "-" : `${query.data.marginPercent}%`} /></div><ReportTableSimple headers={["Fecha", "Usuario", "Costo anterior", "Costo nuevo", "Motivo"]} rows={query.data.history.map((item) => [item.changedAt, item.changedBy, `$${item.previousCost.toFixed(2)}`, `$${item.newCost.toFixed(2)}`, item.reason ?? "-"])} /></div> : null}</ReportQueryState></div>; }

export function AuditScreen() { return <ReportsScreen initialReport="audit" />; }

function ReportQueryState({ query, children }: { query: { isLoading: boolean; isFetching: boolean; error: unknown; refetch: () => unknown }; children: ReactNode }) { if (query.isLoading) return <SkeletonRows rows={5} label={"Cargando información"} />; if (query.error) return <ErrorState title={"No fue posible cargar la información"} detail={getApiErrorMessage(query.error, "No fue posible cargar el reporte.")} onRetry={() => { void (() => void query.refetch())(); }} />; return <>{query.isFetching ? <InlineFeedback tone="info" title="Actualizando">Consultando los datos más recientes.</InlineFeedback> : null}{children}</>; }
function FilterField({ id, label, value, onChange, type = "text" }: { id: string; label: string; value: string; onChange: (value: string) => void; type?: string }) { return <div><Label htmlFor={id}>{label}</Label><Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} /></div>; }
function Metric({ label, value }: { label: string; value: ReactNode }) { return <Card level={2}><CardContent className="p-4"><p className="text-xs text-text-secondary">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></CardContent></Card>; }
function ReportTableSimple({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return (
    <RowTable caption={headers.join(", ")} headers={headers}>
      {rows.map((row, index) => (
        <tr key={index}>
          {row.map((cell, cellIndex) => (
            <td key={cellIndex} className="px-4 py-3 align-top">
              {cell}
            </td>
          ))}
        </tr>
      ))}
    </RowTable>
  );
}
