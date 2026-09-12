"use client";

import { useUiText } from "@/components/ui-copy";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Download, FileSpreadsheet } from "lucide-react";
import {
  configureRestaurantSalesImport, downloadRestaurantSalesImportTemplate,
  fetchRestaurantSalesImportHistory, fetchRestaurantSalesImportJob,
  fetchRestaurantSalesImportMappings, fetchRestaurantSalesImportSession,
  getApiErrorMessage, previewRestaurantSalesImport, processRestaurantSalesImport,
  saveRestaurantSalesImportColumnMap, saveRestaurantSalesImportMappings, validateRestaurantSalesImport,
} from "@/lib/backend";
import { useAppStore } from "@/store/app-store";
import { ModuleRouteGuard } from "@/components/module-route-guard";
import { InlineFeedback, PageHeader } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { RowTable } from "@/components/row-table";
import { confirmAction } from "@/components/confirm-action";
import {
  ErrorState,
  SkeletonRows,
} from "@/components/system";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SalesImportColumnExample, SalesImportMappingDto } from "@/lib/contracts";
import { canProcessSalesImport, salesImportMappingStatus, validateSalesImportFile } from "@/lib/restaurant-inventory";

const steps = ["Cargar archivo", "Configurar", "Mapear columnas", "Relacionar productos", "Validación", "Vista previa", "Procesamiento"];

function readSalesImportProgress() {
  if (typeof window === "undefined") return { sessionId: "", step: 0, fileName: "" };
  try {
    const saved = window.localStorage.getItem("restaurant-sales-import-progress");
    if (!saved) return { sessionId: "", step: 0, fileName: "" };
    const data = JSON.parse(saved) as { sessionId?: string; step?: number; fileName?: string };
    return { sessionId: data.sessionId ?? "", step: Math.min(data.step ?? 0, 6), fileName: data.fileName ?? "" };
  } catch {
    return { sessionId: "", step: 0, fileName: "" };
  }
}

export function RestaurantSalesImport() {
  return <ModuleRouteGuard module="restaurant_inventory" permission="restaurant_inventory.manage"><SalesImportInner /></ModuleRouteGuard>;
}

function SalesImportInner() {
  const uiText = useUiText();
  const { currentBranch } = useAppStore();
  const savedProgress = readSalesImportProgress();
  const [step, setStep] = useState(savedProgress.step);
  const [sessionId, setSessionId] = useState(savedProgress.sessionId);
  const [fileName, setFileName] = useState(savedProgress.fileName);
  const [fileError, setFileError] = useState("");
  const [validation, setValidation] = useState<import("@/lib/contracts").SalesImportValidationDto | null>(null);
  const [config, setConfig] = useState({ companyId: "", branchId: currentBranch?.id ?? "", warehouseId: "", dateFrom: "", dateTo: "", sourceSystem: "", grouping: "recipe" });
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [mappings, setMappings] = useState<SalesImportMappingDto[]>([]);
  const [preview, setPreview] = useState<import("@/lib/contracts").SalesImportPreviewDto | null>(null);
  const [jobId, setJobId] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const history = useQuery({ queryKey: ["restaurant-sales-import-history", currentBranch?.id], queryFn: () => fetchRestaurantSalesImportHistory({ branchId: currentBranch?.id }) });
  const restored = useQuery({ queryKey: ["restaurant-sales-import-session", sessionId], queryFn: () => fetchRestaurantSalesImportSession(sessionId), enabled: Boolean(sessionId && !validation) });
  const validate = useMutation({ mutationFn: (input: { file: File; branchId: string; warehouseId: string }) => validateRestaurantSalesImport(input), onSuccess: (data) => { setValidation(data); setSessionId(data.sessionId); setStep(1); } });
  const configure = useMutation({ mutationFn: () => configureRestaurantSalesImport(sessionId, config), onSuccess: () => setStep(2) });
  const loadMappings = useMutation({ mutationFn: () => fetchRestaurantSalesImportMappings(sessionId), onSuccess: (data) => { setMappings(data); setStep(3); } });
  const saveColumns = useMutation({ mutationFn: () => saveRestaurantSalesImportColumnMap(sessionId, columnMap), onSuccess: () => loadMappings.mutate() });
  const saveMappings = useMutation({ mutationFn: () => saveRestaurantSalesImportMappings(sessionId, mappings.map((item) => ({ id: item.id, recipeId: item.recipeId }))), onSuccess: () => setStep(4) });
  const makePreview = useMutation({ mutationFn: () => previewRestaurantSalesImport(sessionId), onSuccess: (data) => { setPreview(data); setStep(5); } });
  const process = useMutation({ mutationFn: () => processRestaurantSalesImport(sessionId), onSuccess: (data) => { setJobId(data.id); setStep(6); } });
  const job = useQuery({ queryKey: ["restaurant-sales-import-job", jobId], queryFn: () => fetchRestaurantSalesImportJob(jobId), enabled: Boolean(jobId), refetchInterval: (query) => ["COMPLETED", "PARTIAL", "FAILED", "CANCELLED"].includes(query.state.data?.status ?? "") ? false : 2000 });

  useEffect(() => { if (typeof window === "undefined" || !sessionId) return; window.localStorage.setItem("restaurant-sales-import-progress", JSON.stringify({ sessionId, step, fileName })); }, [fileName, sessionId, step]);
  const activeValidation = validation ?? restored.data ?? null;

  function selectFile(file: File) { const fileValidation = validateSalesImportFile(file.name, file.size); if (fileValidation) { setFileError(fileValidation); return; } if (!currentBranch?.id || !config.warehouseId) { setFileError("Selecciona la sucursal y el almacén antes de cargar el archivo."); return; } setFileError(""); setFileName(file.name); validate.mutate({ file, branchId: currentBranch.id, warehouseId: config.warehouseId }); }
  function next() { if (configure.isPending || saveColumns.isPending || loadMappings.isPending || saveMappings.isPending || makePreview.isPending) return; if (step === 1) configure.mutate(); else if (step === 2) saveColumns.mutate(); else if (step === 3) saveMappings.mutate(); else if (step === 4) makePreview.mutate(); }
  const mutationError = validate.error ?? configure.error ?? saveColumns.error ?? loadMappings.error ?? saveMappings.error ?? makePreview.error ?? process.error;
  return <div className="space-y-6"><PageHeader eyebrow={uiText("Inventario")} title={uiText("Importar ventas")} description={uiText("Carga ventas para generar consumos sólo después de validar y confirmar el procesamiento.")} /><StepBar current={step} /><Card level={1}><CardContent className="p-5 sm:p-7"><div className="mb-5 flex items-center justify-between gap-3"><div><p className="text-sm text-text-secondary">{uiText("Paso ")}{step + 1} {uiText(" de ")}{steps.length}</p><h2 className="text-xl font-semibold">{steps[step]}</h2></div><Badge variant="secondary">{uiText("Sin impacto hasta confirmar")}</Badge></div>{step === 0 ? <UploadStep inputRef={inputRef} fileName={fileName} pending={validate.isPending} error={fileError || validate.error} onFile={selectFile} onTemplate={() => void downloadRestaurantSalesImportTemplate()} /> : null}{step === 1 ? <ConfigureStep values={config} onChange={(values) => setConfig(values as typeof config)} /> : null}{step === 2 ? <ColumnsStep columns={activeValidation?.columns ?? []} map={columnMap} onChange={(key, value) => setColumnMap({ ...columnMap, [key]: value })} /> : null}{step === 3 ? <ProductsStep mappings={mappings} onChange={setMappings} /> : null}{step === 4 ? <ValidationStep data={activeValidation} /> : null}{step === 5 ? <PreviewStep data={preview} /> : null}{step === 6 ? <ProcessingStep job={job.data} loading={job.isLoading} retry={() => void job.refetch()} /> : null}{mutationError ? <InlineFeedback tone="danger" title={uiText("No se pudo continuar")}>{getApiErrorMessage(mutationError, "Revisa la información e inténtalo de nuevo.")}</InlineFeedback> : null}<div className="mt-7 flex flex-col-reverse gap-3 border-t border-border-default pt-5 sm:flex-row sm:justify-between"><Button variant="secondary" disabled={step === 0 || process.isPending} onClick={() => setStep((value) => Math.max(0, value - 1))}><ArrowLeft className="size-4" />{uiText("Anterior")}</Button>{step < 4 ? <Button disabled={step === 0 || configure.isPending || loadMappings.isPending || saveMappings.isPending} onClick={next}>{uiText("Continuar ")}<ArrowRight className="size-4" /></Button> : null}{step === 4 ? <Button disabled={makePreview.isPending || !activeValidation || !canProcessSalesImport(activeValidation)} onClick={next}>{uiText("Generar vista previa ")}<ArrowRight className="size-4" /></Button> : null}{step === 5 ? <Button disabled={process.isPending || !preview} onClick={() => { void confirmAction({ title: uiText("¿Procesar la importación?"), description: uiText("Cada venta del archivo descuenta los ingredientes de su receta."), consequence: uiText("Se generan consumos y movimientos de inventario para todas las filas válidas del archivo, de una sola vez."), confirmLabel: uiText("Procesar la importación"), irreversible: true }).then((ok) => ok && process.mutate()); }}><Check className="size-4" />{uiText("Confirmar procesamiento")}</Button> : null}</div></CardContent></Card><HistoryTable query={history} /></div>;
}

function StepBar({ current }: { current: number }) {
  const uiText = useUiText(); return <ol className="grid grid-cols-2 gap-2 sm:grid-cols-7" aria-label={uiText("Progreso de importación")}>{steps.map((label, index) => <li key={label} className="min-w-0"><div className={`h-2 rounded-full ${index <= current ? "bg-primary" : "bg-surface-interactive"}`} /><p className="mt-2 truncate text-xs text-text-secondary">{index + 1}. {label}</p></li>)}</ol>; }

function UploadStep({ inputRef, fileName, pending, error, onFile, onTemplate }: { inputRef: React.RefObject<HTMLInputElement | null>; fileName: string; pending: boolean; error: unknown; onFile: (file: File) => void; onTemplate: () => void }) {
  const uiText = useUiText(); const [dragging, setDragging] = useState(false); return <div className="space-y-5"><button type="button" className={`flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition ${dragging ? "border-primary bg-primary/10" : "border-border-default bg-surface-section"}`} onClick={() => inputRef.current?.click()} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); const file = e.dataTransfer.files.item(0); if (file) onFile(file); }}><FileSpreadsheet className="size-10 text-brand" /><span className="font-semibold">{uiText("Arrastra tu archivo aquí o selecciónalo")}</span><span className="text-sm text-text-secondary">{uiText("CSV o XLSX · máximo 10 MB")}</span>{fileName ? <Badge>{fileName}{pending ? " · validando…" : ""}</Badge> : null}</button><input ref={inputRef} hidden type="file" accept=".csv,.xlsx" onChange={(e) => { const file = e.target.files?.item(0); if (file) onFile(file); }} /><div className="grid gap-3 md:grid-cols-2"><InlineFeedback tone="info" title={uiText("Requisitos")}>{uiText("Incluye ID de venta, código o nombre de producto, cantidad y fecha/hora. La primera fila debe contener encabezados.")}</InlineFeedback><Card level={2}><CardContent className="flex items-center justify-between gap-3 p-4"><div><p className="font-medium">{uiText("Plantilla oficial")}</p><p className="text-sm text-text-secondary">{uiText("Descarga columnas y formato recomendado.")}</p></div><Button variant="secondary" onClick={onTemplate}><Download className="size-4" />{uiText("Descargar")}</Button></CardContent></Card></div>{error ? <InlineFeedback tone="danger" title={uiText("Archivo rechazado")}>{getApiErrorMessage(error, "Extensión o tamaño no válido.")}</InlineFeedback> : null}</div>; }

function ConfigureStep({ values, onChange }: { values: Record<string, string>; onChange: (values: Record<string, string>) => void }) {
  const uiText = useUiText(); const field = (key: string, label: string, type = "text") => <div><Label htmlFor={`sales-${key}`}>{label}</Label><Input id={`sales-${key}`} type={type} value={values[key] ?? ""} onChange={(e) => onChange({ ...values, [key]: e.target.value })} required={key !== "sourceSystem"} /></div>; return <div className="grid gap-4 sm:grid-cols-2">{field("companyId", "Empresa")}{field("branchId", "Sucursal")}{field("warehouseId", "Almacén")}{field("sourceSystem", "Sistema de origen (opcional)")}{field("dateFrom", "Fecha inicial", "date")}{field("dateTo", "Fecha final", "date")}<div><Label htmlFor="sales-grouping">{uiText("Forma de agrupación")}</Label><select id="sales-grouping" className="field" value={values.grouping} onChange={(e) => onChange({ ...values, grouping: e.target.value })}><option value="recipe">{uiText("Por receta")}</option><option value="sale">{uiText("Por venta")}</option><option value="day">{uiText("Por día")}</option></select></div></div>; }

function ColumnsStep({ columns, map, onChange }: { columns: SalesImportColumnExample[]; map: Record<string, string>; onChange: (key: string, value: string) => void }) {
  const uiText = useUiText(); return <div className="space-y-4"><p className="text-sm text-text-secondary">{uiText("Selecciona el encabezado del archivo para cada campo requerido. Los ejemplos provienen de la carga validada.")}</p><RowTable caption={uiText("Registros")} headers={["Campo", "Encabezado del archivo", "Ejemplos", "Requerido"]}>{columns.map((column) => <tr key={column.key}><td className="px-3 py-3 font-medium">{column.label}</td><td className="px-3 py-3"><Input value={map[column.key] ?? ""} onChange={(e) => onChange(column.key, e.target.value)} placeholder={uiText("Nombre de columna")} /></td><td className="px-3 py-3 text-text-secondary">{column.examples.join(" · ")}</td><td className="px-3 py-3">{column.required ? uiText("Sí") : "No"}</td></tr>)}</RowTable></div>; }

function ProductsStep({ mappings, onChange }: { mappings: SalesImportMappingDto[]; onChange: (items: SalesImportMappingDto[]) => void }) {
  const uiText = useUiText(); return <div className="space-y-4"><p className="text-sm text-text-secondary">{uiText("Relaciona cada producto externo con una receta existente. La correspondencia quedará guardada para futuras cargas.")}</p><RowTable caption={uiText("Registros")} headers={["Código externo", "Nombre externo", "Receta relacionada", "Estado"]}>{mappings.map((item, index) => <tr key={item.id}><td className="px-3 py-3">{item.externalCode}</td><td className="px-3 py-3">{item.externalName ?? "-"}</td><td className="px-3 py-3"><Input value={item.recipeId ?? ""} placeholder={uiText("ID de receta")} onChange={(e) => onChange(mappings.map((current, i) => i === index ? { ...current, recipeId: e.target.value, status: salesImportMappingStatus(e.target.value) } : current))} /></td><td className="px-3 py-3"><Badge variant={item.status === "MAPPED" ? "default" : "secondary"}>{item.status}</Badge></td></tr>)}</RowTable></div>; }

function ValidationStep({ data }: { data: import("@/lib/contracts").SalesImportValidationDto | null }) {
  const uiText = useUiText(); if (!data) return <InlineFeedback tone="warning" title={uiText("Validación pendiente")}>{uiText("Carga un archivo para iniciar la validación.")}</InlineFeedback>; return <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">{[["Total", data.totalRows], ["Válidas", data.validRows], ["Inválidas", data.invalidRows], ["Duplicadas", data.duplicateRows], ["Sin receta", data.productsWithoutRecipe], ["Stock insuficiente", data.insufficientInventory]].map(([label, value]) => <Metric key={String(label)} label={String(label)} value={value} />)}</div><div className="flex justify-end"><Button variant="secondary" disabled={!data.errors.length} onClick={() => downloadErrors(data.errors)}><Download className="size-4" />{uiText("Descargar errores")}</Button></div><PhaseErrors errors={data.errors} /></div>; }

function PhaseErrors({ errors }: { errors: Array<{ row: number; column?: string; message: string; code: string }> }) {
  const uiText = useUiText(); return errors.length ? <RowTable caption={uiText("Registros")} headers={["Fila", "Columna", "Error"]}>{errors.map((error, index) => <tr key={`${error.row}-${index}`}><td className="px-3 py-2">{error.row}</td><td className="px-3 py-2">{error.column ?? "-"}</td><td className="px-3 py-2">{error.message}</td></tr>)}</RowTable> : <InlineFeedback tone="success" title={uiText("Sin errores por fila")}>{uiText("La validación no reportó errores de fila.")}</InlineFeedback>; }

function PreviewStep({ data }: { data: import("@/lib/contracts").SalesImportPreviewDto | null }) {
  const uiText = useUiText(); if (!data) return <InlineFeedback tone="warning" title={uiText("Vista previa pendiente")}>{uiText("Ejecuta la validación para generar la vista previa.")}</InlineFeedback>; return <div className="space-y-4"><PhaseTable headers={["Receta", "Cantidad"]}>{data.recipes.map((item) => <tr key={item.recipeName}><td>{item.recipeName}</td><td>{item.quantity}</td></tr>)}</PhaseTable><PhaseTable headers={["Ingrediente", "Requerido", "Actual", "Resultante", "Advertencia"]}>{data.ingredients.map((item) => <tr key={item.ingredientName}><td>{item.ingredientName}</td><td>{item.requiredQuantity} {item.unit}</td><td>{item.currentStock} {item.unit}</td><td>{item.resultingStock} {item.unit}</td><td>{item.warning ?? "-"}</td></tr>)}</PhaseTable>{data.warnings.map((warning) => <InlineFeedback key={warning} tone="warning" title={uiText("Advertencia")}>{warning}</InlineFeedback>)}<p className="font-semibold">{uiText("Costo estimado: $")}{data.estimatedCost.toFixed(2)}</p></div>; }

function ProcessingStep({ job, loading, retry }: { job?: import("@/lib/contracts").SalesImportJobDto; loading: boolean; retry: () => void }) {
  const uiText = useUiText(); if (loading) return <SkeletonRows rows={5} label={"Consultando procesamiento"} />; if (!job) return <InlineFeedback tone="info" title={uiText("Listo para procesar")}>{uiText("La importación aún no ha sido confirmada.")}</InlineFeedback>; return <div className="space-y-5"><div><div className="mb-2 flex justify-between text-sm"><span>{job.status}</span><span>{job.progressPercent}%</span></div><div className="h-3 overflow-hidden rounded-full bg-surface-interactive"><div className="h-full bg-primary transition-all" style={{ width: `${job.progressPercent}%` }} /></div></div><div className="grid gap-3 sm:grid-cols-3"><Metric label={uiText("Procesadas")} value={job.processedRows} /><Metric label={uiText("Válidas")} value={job.validRows} /><Metric label={uiText("Errores")} value={job.errorRows} /></div>{job.message ? <InlineFeedback tone={job.status === "FAILED" ? "danger" : job.status === "PARTIAL" ? "warning" : "info"} title={uiText("Resultado")}>{job.message}</InlineFeedback> : null}<div className="flex flex-wrap gap-2">{job.consumptionUrl ? <Button asChild variant="secondary"><a href={job.consumptionUrl}>{uiText("Ver consumos generados")}</a></Button> : null}{job.movementsUrl ? <Button asChild variant="secondary"><a href={job.movementsUrl}>{uiText("Ver movimientos")}</a></Button> : null}{job.errorsUrl ? <Button asChild variant="secondary"><a href={job.errorsUrl}>{uiText("Descargar errores")}</a></Button> : null}{["FAILED", "PARTIAL"].includes(job.status) ? <Button variant="secondary" onClick={retry}>{uiText("Reintentar consulta")}</Button> : null}</div></div>; }

function HistoryTable({ query }: { query: ReturnType<typeof useQuery<import("@/lib/contracts").SalesImportHistoryDto[]>> }) {
  const uiText = useUiText(); return <Card level={2}><CardContent className="space-y-4 p-5"><h2 className="font-semibold">{uiText("Historial de importaciones")}</h2>{query.isLoading ? <SkeletonRows rows={5} label={uiText("Cargando información")} /> : query.error ? <ErrorState title={uiText("No fue posible cargar la información")} detail={uiText("Reintenta la consulta para continuar.")} onRetry={() => { void (() => void query.refetch())(); }} /> : <PhaseTable headers={["Archivo", "Fecha", "Sucursal", "Rango", "Válidas", "Errores", "Estado", "Usuario"]}>{(query.data ?? []).map((item) => <tr key={item.id}><td>{item.fileName}</td><td>{item.createdAt}</td><td>{item.branchName}</td><td>{item.dateFrom} - {item.dateTo}</td><td>{item.validRows}</td><td>{item.errorRows}</td><td><Badge>{item.status}</Badge></td><td>{item.userName}</td></tr>)}</PhaseTable>}</CardContent></Card>; }

function Metric({ label, value }: { label: string; value: React.ReactNode }) { return <Card level={2}><CardContent className="p-4"><p className="text-xs text-text-secondary">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></CardContent></Card>; }
function PhaseTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  const uiText = useUiText(); return <RowTable caption={uiText("Registros")} headers={headers}>{children}</RowTable>; }
function downloadErrors(errors: Array<{ row: number; column?: string; message: string; code: string }>) { const csv = ["fila,columna,error,codigo", ...errors.map((error) => [error.row, error.column ?? "", JSON.stringify(error.message), error.code].join(","))].join("\n"); const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "errores-importacion-ventas.csv"; anchor.click(); URL.revokeObjectURL(url); }
