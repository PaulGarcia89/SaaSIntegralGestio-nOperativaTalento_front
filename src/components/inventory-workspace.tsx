"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, Boxes, ClipboardCheck, History, PackageCheck, Plus, RotateCcw, UserRound } from "lucide-react";
import {
  assignInventoryAsset, createInventoryAsset, createInventoryCatalogItem, deliverInventoryAsset,
  fetchInventoryAsset, fetchInventoryAssets, fetchInventoryCatalog, fetchInventoryContext,
  receiveInventoryReturn, requestInventoryReturn, transferInventoryAsset, validateInventoryReturn,
  downloadInventoryEvidence,
} from "@/lib/backend";
import type { InventoryAssetCondition, InventoryAssetDto, InventoryAssetStatus } from "@/lib/contracts";
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

const statusLabels: Record<InventoryAssetStatus, string> = {
  AVAILABLE: "Disponible", RESERVED: "Reservado", ASSIGNED: "Entregado", IN_TRANSIT: "En tránsito",
  RETURN_PENDING: "Devolución pendiente", MAINTENANCE: "Mantenimiento", LOST: "Perdido", RETIRED: "Retirado",
};
const conditions: InventoryAssetCondition[] = ["NEW", "GOOD", "FAIR", "DAMAGED"];

export function InventoryWorkspace({ initialStatus = "", title = "Inventario y activos" }: { initialStatus?: InventoryAssetStatus | ""; title?: string }) {
  const searchParams = useSearchParams();
  const requestedEmployeeId = searchParams.get("employeeId") ?? "";
  const requestedFlowId = searchParams.get("flowId") ?? "";
  const queryClient = useQueryClient();
  const { can, currentBranch } = useAppStore();
  const canManage = can("inventory.manage");
  const [status, setStatus] = useState<string>(initialStatus);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [dialog, setDialog] = useState<"catalog" | "asset" | "assign" | "deliver" | "transfer" | "return" | "validate" | null>(null);
  const catalog = useQuery({ queryKey: ["inventory-catalog"], queryFn: fetchInventoryCatalog });
  const context = useQuery({ queryKey: ["inventory-context"], queryFn: fetchInventoryContext });
  const assets = useQuery({ queryKey: ["inventory-assets", status, search, currentBranch?.id], queryFn: () => fetchInventoryAssets({ status: status || undefined, search: search || undefined, branchId: currentBranch?.id }) });
  const detail = useQuery({ queryKey: ["inventory-asset", selectedId], queryFn: () => fetchInventoryAsset(selectedId), enabled: Boolean(selectedId) });
  const selected = detail.data ?? assets.data?.find(asset => asset.id === selectedId) ?? assets.data?.[0] ?? null;
  const requestedEmployee = context.data?.employees.find(employee => employee.id === requestedEmployeeId);
  const refresh = async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ["inventory-assets"] }), queryClient.invalidateQueries({ queryKey: ["inventory-asset"] }), queryClient.invalidateQueries({ queryKey: ["inventory-catalog"] })]); };

  const counts = useMemo(() => ({
    total: assets.data?.length ?? 0,
    available: assets.data?.filter(asset => asset.status === "AVAILABLE").length ?? 0,
    assigned: assets.data?.filter(asset => asset.status === "ASSIGNED").length ?? 0,
    attention: assets.data?.filter(asset => ["RETURN_PENDING", "MAINTENANCE", "LOST"].includes(asset.status)).length ?? 0,
  }), [assets.data]);

  return <div className="space-y-6">
    <PageHeader eyebrow="Operaciones" title={title} description="Controla catálogo, custodia, evidencia, transferencias y devoluciones con trazabilidad por activo." actions={canManage ? <div className="flex gap-2"><Button variant="secondary" onClick={() => setDialog("catalog")}><Plus className="size-4" />Categoría</Button><Button onClick={() => setDialog("asset")}><Plus className="size-4" />Registrar activo</Button></div> : undefined} />
    {requestedEmployee ? <InlineFeedback tone="success" title="Empleado preseleccionado">{requestedEmployee.name}. Selecciona un activo disponible y usa “Asignar”; se conservará el vínculo con la incorporación {requestedFlowId}.</InlineFeedback> : null}
    {requestedEmployeeId && context.isSuccess && !requestedEmployee ? <InlineFeedback tone="warning" title="Empleado fuera de alcance">El empleado solicitado no pertenece a la sucursal activa.</InlineFeedback> : null}
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumen de inventario"><Metric icon={Boxes} label="Activos visibles" value={counts.total} /><Metric icon={PackageCheck} label="Disponibles" value={counts.available} /><Metric icon={UserRound} label="En custodia" value={counts.assigned} /><Metric icon={ClipboardCheck} label="Requieren atención" value={counts.attention} /></section>
    <Card level={2}><CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_240px]"><div><Label htmlFor="asset-search">Buscar</Label><Input id="asset-search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Etiqueta, serie o tipo de activo" /></div><div><Label htmlFor="asset-status">Estado</Label><Select value={status || "ALL"} onValueChange={value => setStatus(value === "ALL" ? "" : value)}><SelectTrigger id="asset-status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Todos</SelectItem>{Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div></CardContent></Card>
    {assets.isLoading ? <AsyncState state="loading" title="Cargando activos" /> : null}
    {assets.isError ? <AsyncState state="error" title="No pudimos cargar el inventario" onRetry={() => void assets.refetch()} /> : null}
    {assets.isSuccess && !assets.data.length ? <InlineFeedback tone="info" title="No hay activos en esta vista">Registra el primer activo o cambia los filtros. No se muestran datos simulados.</InlineFeedback> : null}
    {assets.data?.length ? <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
      <section className="grid content-start gap-3 sm:grid-cols-2 2xl:grid-cols-3" aria-label="Activos">{assets.data.map(asset => <AssetCard key={asset.id} asset={asset} selected={asset.id === selected?.id} onClick={() => setSelectedId(asset.id)} />)}</section>
      {selected ? <AssetDetail asset={selected} loading={detail.isFetching} canManage={canManage} onAction={setDialog} /> : null}
    </div> : null}
    <InventoryDialog kind={dialog} asset={selected} catalog={catalog.data ?? []} context={context.data} initialEmployeeId={requestedEmployee?.id} onClose={() => setDialog(null)} onSuccess={async () => { await refresh(); setDialog(null); }} />
  </div>;
}

function AssetCard({ asset, selected, onClick }: { asset: InventoryAssetDto; selected: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`min-h-44 rounded-2xl border p-4 text-left transition ${selected ? "border-primary bg-primary/5" : "bg-surface-section hover:bg-surface-interactive"}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold">{asset.item.name}</p><p className="text-sm text-text-secondary">{asset.assetTag} · {asset.serialNumber || "Sin serie"}</p></div><Badge>{statusLabels[asset.status]}</Badge></div><dl className="mt-5 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-text-secondary">Sucursal</dt><dd>{asset.branch.name}</dd></div><div><dt className="text-text-secondary">Condición</dt><dd>{asset.condition}</dd></div><div className="col-span-2"><dt className="text-text-secondary">Custodia</dt><dd>{asset.employee?.name || "Sin asignar"}</dd></div></dl></button>;
}

function AssetDetail({ asset, loading, canManage, onAction }: { asset: InventoryAssetDto; loading: boolean; canManage: boolean; onAction: (action: "assign" | "deliver" | "transfer" | "return" | "validate") => void }) {
  const moves = asset.movements ?? [];
  return <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start"><Card level={1}><CardContent className="space-y-4 p-5"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">Activo {asset.assetTag}</p><h2 className="text-xl font-semibold">{asset.item.name}</h2><p className="text-sm text-text-secondary">{asset.branch.name} · {asset.condition}</p></div>{asset.employee ? <div className="rounded-xl bg-secondary/50 p-3"><p className="text-xs text-text-secondary">Empleado responsable</p><p className="font-semibold">{asset.employee.name}</p><p className="text-sm text-text-secondary">{asset.employee.jobTitle || asset.employee.email}</p></div> : null}{canManage ? <div className="flex flex-wrap gap-2">{asset.status === "AVAILABLE" ? <><Button size="sm" onClick={() => onAction("assign")}>Asignar</Button><Button size="sm" variant="secondary" onClick={() => onAction("transfer")}><ArrowRightLeft className="size-4" />Transferir</Button></> : null}{asset.status === "RESERVED" ? <Button size="sm" onClick={() => onAction("deliver")}>Registrar entrega</Button> : null}{asset.status === "ASSIGNED" || asset.status === "RETURN_PENDING" ? <Button size="sm" variant="secondary" onClick={() => onAction("return")}><RotateCcw className="size-4" />Recibir devolución</Button> : null}{asset.status === "RETURN_PENDING" && asset.returnedAt ? <Button size="sm" onClick={() => onAction("validate")}>Validar estado</Button> : null}<Button asChild size="sm" variant="secondary"><Link href={`/inventory/maintenance?assetId=${encodeURIComponent(asset.id)}`}>Mantenimiento</Link></Button></div> : null}</CardContent></Card>
    <Card level={2}><CardContent className="p-5"><div className="mb-4 flex items-center gap-2"><History className="size-4 text-primary" /><h3 className="font-semibold">Historial y trazabilidad</h3>{loading ? <span className="text-xs text-text-secondary">Actualizando…</span> : null}</div>{!moves.length ? <p className="text-sm text-text-secondary">Selecciona el activo para cargar su bitácora.</p> : <ol className="space-y-4">{moves.map(move => <li key={move.id} className="border-l-2 border-primary/25 pl-4"><p className="font-medium">{movementLabel(move.type)}</p><p className="text-xs text-text-secondary">{new Date(move.occurredAt).toLocaleString()} · {move.employee?.name || move.toBranch?.name || asset.branch.name}</p>{move.notes ? <p className="mt-1 text-sm text-text-secondary">{move.notes}</p> : null}{move.evidences.map(file => <button type="button" key={file.id} className="mt-2 block text-xs font-medium text-primary underline" onClick={() => void downloadInventoryEvidence(file.id, file.originalName)}>{file.originalName}</button>)}</li>)}</ol>}</CardContent></Card></aside>;
}

function InventoryDialog({ kind, asset, catalog, context, initialEmployeeId, onClose, onSuccess }: { kind: string | null; asset: InventoryAssetDto | null; catalog: Array<{ id: string; name: string; sku: string }>; context?: Awaited<ReturnType<typeof fetchInventoryContext>>; initialEmployeeId?: string; onClose: () => void; onSuccess: () => Promise<void> }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File>();
  const mutation = useMutation({ mutationFn: async () => {
    if (kind === "catalog") return createInventoryCatalogItem({ sku: values.sku, name: values.name });
    if (kind === "asset") return createInventoryAsset({ itemId: values.itemId, branchId: values.branchId, assetTag: values.assetTag, serialNumber: values.serialNumber, condition: values.condition });
    if (!asset) throw new Error("Selecciona un activo");
    if (kind === "assign") { const employeeId = values.employeeId || initialEmployeeId || ""; const workflow = context?.workflowAssignments.find(item => item.employeeId === employeeId && item.branchId === asset.branchId); return assignInventoryAsset(asset.id, { employeeId, workflowAssignmentId: workflow?.id, notes: values.notes }); }
    if (kind === "deliver") return deliverInventoryAsset(asset.id, { evidence: file, notes: values.notes, condition: values.condition });
    if (kind === "transfer") return transferInventoryAsset(asset.id, { toBranchId: values.toBranchId, evidence: file, notes: values.notes, condition: values.condition });
    if (kind === "return") { if (asset.status === "ASSIGNED") await requestInventoryReturn(asset.id, values.notes); return receiveInventoryReturn(asset.id, { evidence: file, notes: values.notes, condition: values.condition }); }
    return validateInventoryReturn(asset.id, { status: values.status, evidence: file, notes: values.notes, condition: values.condition });
  }, onSuccess });
  const set = (key: string, value: string) => setValues(current => ({ ...current, [key]: value }));
  const needsFile = ["deliver", "transfer", "return", "validate"].includes(kind ?? "");
  return <Dialog open={Boolean(kind)} onOpenChange={open => !open && onClose()}><DialogContent><DialogHeader><DialogTitle>{dialogTitle(kind)}</DialogTitle><DialogDescription>La operación quedará registrada en la trazabilidad del activo y en la auditoría del sistema.</DialogDescription></DialogHeader><div className="space-y-4">
    {kind === "catalog" ? <><Field label="SKU" value={values.sku} onChange={value => set("sku", value)} /><Field label="Nombre del tipo de activo" value={values.name} onChange={value => set("name", value)} /></> : null}
    {kind === "asset" ? <><Choice label="Tipo de activo" value={values.itemId} onChange={value => set("itemId", value)} options={catalog.map(item => ({ value: item.id, label: `${item.name} · ${item.sku}` }))} /><Choice label="Sucursal" value={values.branchId} onChange={value => set("branchId", value)} options={(context?.branches ?? []).map(branch => ({ value: branch.id, label: branch.name }))} /><Field label="Etiqueta única" value={values.assetTag} onChange={value => set("assetTag", value)} /><Field label="Número de serie" value={values.serialNumber} onChange={value => set("serialNumber", value)} /><Condition value={values.condition} onChange={value => set("condition", value)} /></> : null}
    {kind === "assign" ? <Choice label="Empleado" value={values.employeeId || initialEmployeeId} onChange={value => set("employeeId", value)} options={(context?.employees.filter(employee => employee.branchAssignments.some(branch => branch.branchId === asset?.branchId)) ?? []).map(employee => ({ value: employee.id, label: `${employee.name} · ${employee.jobTitle || employee.email}` }))} /> : null}
    {kind === "transfer" ? <Choice label="Sucursal de destino" value={values.toBranchId} onChange={value => set("toBranchId", value)} options={(context?.branches.filter(branch => branch.id !== asset?.branchId) ?? []).map(branch => ({ value: branch.id, label: branch.name }))} /> : null}
    {["deliver", "return", "validate"].includes(kind ?? "") ? <Condition value={values.condition} onChange={value => set("condition", value)} /> : null}
    {kind === "validate" ? <Choice label="Resultado de validación" value={values.status} onChange={value => set("status", value)} options={[{ value: "AVAILABLE", label: "Disponible" }, { value: "MAINTENANCE", label: "Enviar a mantenimiento" }, { value: "RETIRED", label: "Retirar definitivamente" }]} /> : null}
    {!["catalog", "asset"].includes(kind ?? "") ? <Field label="Notas operativas" value={values.notes} onChange={value => set("notes", value)} /> : null}
    {needsFile ? <div><Label htmlFor="inventory-evidence">Evidencia (PDF, JPG o PNG)</Label><Input id="inventory-evidence" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={event => setFile(event.target.files?.[0])} /></div> : null}
    {mutation.isError ? <p role="alert" className="text-sm text-status-danger">No fue posible completar la operación. Revisa los datos e inténtalo nuevamente.</p> : null}
    <Button className="w-full" disabled={mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? "Registrando…" : "Confirmar operación"}</Button>
  </div></DialogContent></Dialog>;
}

function Field({ label, value = "", onChange }: { label: string; value?: string; onChange: (value: string) => void }) { const id = label.toLowerCase().replaceAll(" ", "-"); return <div><Label htmlFor={id}>{label}</Label><Input id={id} value={value} onChange={event => onChange(event.target.value)} /></div>; }
function Choice({ label, value = "", onChange, options }: { label: string; value?: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) { return <div><Label>{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger><SelectContent>{options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>; }
function Condition({ value, onChange }: { value?: string; onChange: (value: string) => void }) { return <Choice label="Condición" value={value} onChange={onChange} options={conditions.map(condition => ({ value: condition, label: condition }))} />; }
function Metric({ icon: Icon, label, value }: { icon: typeof Boxes; label: string; value: number }) { return <Card level={2}><CardContent className="flex items-center gap-4 p-4"><Icon className="size-5 text-primary" /><div><p className="text-sm text-text-secondary">{label}</p><p className="text-2xl font-semibold">{value}</p></div></CardContent></Card>; }
function dialogTitle(kind: string | null) { return ({ catalog: "Nueva categoría", asset: "Registrar activo", assign: "Asignar a empleado", deliver: "Confirmar entrega", transfer: "Transferir entre sucursales", return: "Recibir devolución", validate: "Validar devolución" } as Record<string, string>)[kind ?? ""] ?? "Operación de inventario"; }
function movementLabel(type: string) { return ({ REGISTERED: "Activo registrado", ASSIGNED: "Asignado a empleado", DELIVERED: "Entrega confirmada", TRANSFERRED: "Transferido de sucursal", RETURN_REQUESTED: "Devolución solicitada", RETURNED: "Activo recibido", RETURN_VALIDATED: "Devolución validada" } as Record<string, string>)[type] ?? type; }
