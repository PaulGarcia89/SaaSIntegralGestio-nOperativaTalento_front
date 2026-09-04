"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ClipboardCheck, Download, MapPin, PackagePlus, Settings2, SlidersHorizontal } from "lucide-react";
import { adjustInventoryStock, countInventoryStock, createInventoryLocation, downloadInventoryMovements, fetchInventoryContext, fetchInventoryLocations, fetchInventoryWarehouse, updateInventoryStockPolicy } from "@/lib/backend";
import type { InventoryWarehouseStockDto } from "@/lib/contracts";
import { useAppStore } from "@/store/app-store";
import { AsyncState } from "@/components/async-state";
import { InlineFeedback, PageHeader } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type DialogKind = "location" | "adjustment" | "count" | "policy" | null;

export function InventoryWarehousePanel() {
  const { can, currentBranch } = useAppStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [selected, setSelected] = useState<InventoryWarehouseStockDto | null>(null);
  const canManage = can("asset_inventory.manage");
  const context = useQuery({ queryKey: ["inventory-context"], queryFn: fetchInventoryContext });
  const warehouse = useQuery({ queryKey: ["inventory-warehouse", currentBranch?.id, search, page], queryFn: () => fetchInventoryWarehouse({ branchId: currentBranch?.id, search: search || undefined, page, pageSize: 12 }) });
  const locations = useQuery({ queryKey: ["inventory-locations", currentBranch?.id], queryFn: () => fetchInventoryLocations(currentBranch?.id) });
  const refresh = async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ["inventory-warehouse"] }), queryClient.invalidateQueries({ queryKey: ["inventory-locations"] }), queryClient.invalidateQueries({ queryKey: ["inventory-catalog"] })]); };
  const needsAttention = warehouse.data?.items.filter((item) => item.needsReorder || item.belowMinimum).length ?? 0;

  return <div className="space-y-6">
    <PageHeader eyebrow="Inventario" title="Almacén y stock" description="Controla existencias no serializadas, ubicaciones, conteos y ajustes con trazabilidad por sucursal." actions={canManage ? <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => setDialog("location")}><MapPin className="size-4" />Nueva ubicación</Button><Button onClick={() => void downloadInventoryMovements(currentBranch?.id)}><Download className="size-4" />Exportar movimientos</Button></div> : undefined} />
    <section className="grid gap-3 sm:grid-cols-3" aria-label="Resumen de stock">
      <Metric icon={PackagePlus} label="Referencias en almacén" value={warehouse.data?.total ?? 0} />
      <Metric icon={AlertTriangle} label="Requieren reposición" value={needsAttention} tone={needsAttention ? "warning" : "normal"} />
      <Metric icon={MapPin} label="Ubicaciones activas" value={locations.data?.length ?? 0} />
    </section>
    {needsAttention ? <InlineFeedback tone="warning" title="Reposición requerida">Hay {needsAttention} referencia{needsAttention === 1 ? "" : "s"} por debajo del mínimo o del punto de reposición. Registra la recepción o un ajuste para mantener la trazabilidad.</InlineFeedback> : null}
    <Card level={2}><CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_220px]"><div><Label htmlFor="warehouse-search">Buscar referencia</Label><Input id="warehouse-search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="SKU o nombre del artículo" /></div><div><Label>Sucursal activa</Label><div className="mt-2 rounded-lg border border-border-default bg-surface-section px-3 py-2 text-sm">{currentBranch?.name || "Selecciona una sucursal"}</div></div></CardContent></Card>
    {warehouse.isLoading ? <AsyncState state="loading" title="Cargando existencias" /> : null}
    {warehouse.isError ? <AsyncState state="error" title="No pudimos cargar el almacén" onRetry={() => void warehouse.refetch()} /> : null}
    {warehouse.isSuccess && !warehouse.data.items.length ? <InlineFeedback tone="info" title="Sin stock registrado">Aún no hay existencias no serializadas para los filtros actuales. Los activos serializados se administran desde Inventario.</InlineFeedback> : null}
    {warehouse.data?.items.length ? <section className="grid gap-3 lg:grid-cols-2" aria-label="Existencias por artículo">{warehouse.data.items.map((stock) => <StockCard key={stock.id} stock={stock} canManage={canManage} onAdjust={() => { setSelected(stock); setDialog("adjustment"); }} onCount={() => { setSelected(stock); setDialog("count"); }} onPolicy={() => { setSelected(stock); setDialog("policy"); }} />)}</section> : null}
    {warehouse.data && warehouse.data.totalPages > 1 ? <nav className="flex items-center justify-between gap-3 rounded-xl border border-border-default bg-surface-section p-3" aria-label="Paginación de inventario"><p className="text-sm text-text-secondary">Página {warehouse.data.page} de {warehouse.data.totalPages} · {warehouse.data.total} referencias</p><div className="flex gap-2"><Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Anterior</Button><Button size="sm" variant="secondary" disabled={page >= warehouse.data.totalPages} onClick={() => setPage((value) => value + 1)}>Siguiente</Button></div></nav> : null}
    <WarehouseDialog kind={dialog} stock={selected} branchId={currentBranch?.id || ""} branches={context.data?.branches ?? []} locations={locations.data ?? []} onClose={() => { setDialog(null); setSelected(null); }} onSuccess={async () => { await refresh(); setDialog(null); setSelected(null); }} />
  </div>;
}

function StockCard({ stock, canManage, onAdjust, onCount, onPolicy }: { stock: InventoryWarehouseStockDto; canManage: boolean; onAdjust: () => void; onCount: () => void; onPolicy: () => void }) {
  const status = stock.belowMinimum ? "Bajo mínimo" : stock.needsReorder ? "Reponer" : "Estable";
  return <Card level={2}><CardContent className="space-y-4 p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold">{stock.item.name}</p><p className="text-sm text-text-secondary">{stock.item.sku} · {stock.branch.name}</p></div><Badge variant={stock.needsReorder || stock.belowMinimum ? "warning" : "secondary"}>{status}</Badge></div><div className="grid grid-cols-3 gap-2 rounded-xl bg-surface-section p-3 text-center"><MetricValue label="Disponible" value={`${stock.qtyLocal} ${stock.item.unitOfMeasure}`} /><MetricValue label="Mínimo" value={String(stock.minQty)} /><MetricValue label="Reponer en" value={String(stock.reorderPoint)} /></div>{canManage ? <div className="flex flex-wrap gap-2"><Button size="sm" onClick={onAdjust}><SlidersHorizontal className="size-4" />Ajustar</Button><Button size="sm" variant="secondary" onClick={onCount}><ClipboardCheck className="size-4" />Conteo</Button><Button size="sm" variant="secondary" onClick={onPolicy}><Settings2 className="size-4" />Alertas</Button></div> : null}</CardContent></Card>;
}

function WarehouseDialog({ kind, stock, branchId, branches, locations, onClose, onSuccess }: { kind: DialogKind; stock: InventoryWarehouseStockDto | null; branchId: string; branches: Array<{ id: string; name: string }>; locations: Array<{ id: string; name: string; code: string }>; onClose: () => void; onSuccess: () => Promise<void> }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const mutation = useMutation({ mutationFn: async () => {
    if (kind === "location") return createInventoryLocation({ branchId: values.branchId || branchId, code: values.code, name: values.name, type: values.type || undefined });
    if (!stock) throw new Error("Selecciona una referencia de stock");
    if (kind === "adjustment") return adjustInventoryStock({ itemId: stock.itemId, branchId: stock.branchId, quantity: Number(values.quantity), locationId: values.locationId || undefined, reason: values.reason });
    if (kind === "count") return countInventoryStock({ itemId: stock.itemId, branchId: stock.branchId, countedQty: Number(values.countedQty), notes: values.notes || undefined });
    return updateInventoryStockPolicy({ itemId: stock.itemId, branchId: stock.branchId, minQty: Number(values.minQty), reorderPoint: Number(values.reorderPoint), maxQty: values.maxQty ? Number(values.maxQty) : undefined });
  }, onSuccess });
  const set = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }));
  const title = kind === "location" ? "Nueva ubicación" : kind === "adjustment" ? "Ajustar existencias" : kind === "count" ? "Registrar conteo cíclico" : "Configurar alertas de reposición";
  return <Dialog open={Boolean(kind)} onOpenChange={(open) => !open && onClose()}><DialogContent><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{kind === "location" ? "Crea una ubicación interna para mejorar la trazabilidad del almacén." : "Esta operación genera un movimiento inmutable y queda disponible para conciliación y auditoría."}</DialogDescription></DialogHeader><div className="space-y-4">
    {kind === "location" ? <><Choice label="Sucursal" value={values.branchId || branchId} onChange={(value) => set("branchId", value)} options={branches.map((branch) => ({ value: branch.id, label: branch.name }))} /><Field label="Código" value={values.code} onChange={(value) => set("code", value)} placeholder="ALM-01" /><Field label="Nombre" value={values.name} onChange={(value) => set("name", value)} placeholder="Almacén principal" /><Field label="Tipo" value={values.type} onChange={(value) => set("type", value)} placeholder="Almacén, sala, estante..." /></> : null}
    {kind === "adjustment" && stock ? <><ReadOnly label="Referencia" value={`${stock.item.name} · disponible: ${stock.qtyLocal}`} /><Field label="Cantidad a sumar o restar" value={values.quantity} onChange={(value) => set("quantity", value)} placeholder="Ej.: 5 o -2" inputMode="numeric" /><Choice label="Ubicación (opcional)" value={values.locationId} onChange={(value) => set("locationId", value)} options={[{ value: "NONE", label: "Sin ubicación específica" }, ...locations.map((location) => ({ value: location.id, label: `${location.code} · ${location.name}` }))]} /><Field label="Motivo" value={values.reason} onChange={(value) => set("reason", value)} placeholder="Recepción de proveedor, corrección..." /></> : null}
    {kind === "count" && stock ? <><ReadOnly label="Referencia" value={`${stock.item.name} · esperado: ${stock.qtyLocal}`} /><Field label="Cantidad contada" value={values.countedQty} onChange={(value) => set("countedQty", value)} placeholder="0" inputMode="numeric" /><Field label="Observaciones" value={values.notes} onChange={(value) => set("notes", value)} placeholder="Opcional" /></> : null}
    {kind === "policy" && stock ? <><ReadOnly label="Referencia" value={stock.item.name} /><Field label="Stock mínimo" value={values.minQty || String(stock.minQty)} onChange={(value) => set("minQty", value)} inputMode="numeric" /><Field label="Punto de reposición" value={values.reorderPoint || String(stock.reorderPoint)} onChange={(value) => set("reorderPoint", value)} inputMode="numeric" /><Field label="Stock máximo" value={values.maxQty || (stock.maxQty ? String(stock.maxQty) : "")} onChange={(value) => set("maxQty", value)} placeholder="Opcional" inputMode="numeric" /></> : null}
    {mutation.isError ? <p role="alert" className="text-sm text-status-danger">No fue posible guardar. Revisa los campos obligatorios e inténtalo de nuevo.</p> : null}
    <Button className="w-full" disabled={mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? "Guardando…" : "Confirmar operación"}</Button>
  </div></DialogContent></Dialog>;
}

function Field({ label, value = "", onChange, placeholder, inputMode }: { label: string; value?: string; onChange: (value: string) => void; placeholder?: string; inputMode?: "numeric" | "text" }) { const id = label.toLowerCase().replaceAll(" ", "-"); return <div><Label htmlFor={id}>{label}</Label><Input id={id} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} inputMode={inputMode} /></div>; }
function Choice({ label, value = "", onChange, options }: { label: string; value?: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) { return <div><Label>{label}</Label><Select value={value} onValueChange={(value) => onChange(value === "NONE" ? "" : value)}><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>; }
function ReadOnly({ label, value }: { label: string; value: string }) { return <div><p className="text-sm font-medium">{label}</p><p className="mt-1 rounded-lg bg-surface-section p-3 text-sm text-text-secondary">{value}</p></div>; }
function Metric({ icon: Icon, label, value, tone = "normal" }: { icon: typeof PackagePlus; label: string; value: number; tone?: "normal" | "warning" }) { return <Card level={2}><CardContent className="flex items-center gap-4 p-4"><Icon className={`size-5 ${tone === "warning" ? "text-status-warning" : "text-brand"}`} /><div><p className="text-sm text-text-secondary">{label}</p><p className="text-2xl font-semibold">{value}</p></div></CardContent></Card>; }
function MetricValue({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-text-secondary">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>; }
