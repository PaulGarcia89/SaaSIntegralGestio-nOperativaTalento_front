"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CalendarClock, Check, FileCheck2, FileSignature, Plus, Upload, UserRoundCheck } from "lucide-react";
import {
  applyOnboardingTemplate,
  createOnboardingTemplate,
  fetchOnboardingFlows,
  fetchOnboardingTemplates,
  reviewOnboardingDocument,
  updateOnboardingTask,
  uploadOnboardingDocument,
} from "@/lib/backend";
import type { EmployeeOnboardingFlowDto, EmployeeOnboardingTaskDto, OnboardingTemplateTaskConfigDto } from "@/lib/contracts";
import { useAppStore } from "@/store/app-store";
import { AsyncState } from "@/components/async-state";
import { InlineFeedback, PageHeader } from "@/components/design-system";
import { FileUpload } from "@/components/ui/file-upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const starterTasks: OnboardingTemplateTaskConfigDto[] = [
  { taskKey: "documents", taskType: "DOCUMENT_COLLECTION", title: "Documentos de ingreso", description: "Recopilar y validar documentos obligatorios.", ownerType: "ROLE", dueOffsetDays: 2, dependsOnKeys: [], required: true, sortOrder: 0 },
  { taskKey: "hr-checklist", taskType: "HR_CHECKLIST", title: "Validación de RRHH", description: "Confirmar expediente, datos laborales y políticas.", ownerType: "ROLE", dueOffsetDays: 4, dependsOnKeys: ["documents"], required: true, sortOrder: 1 },
  { taskKey: "manager-checklist", taskType: "MANAGER_CHECKLIST", title: "Preparación del supervisor", description: "Definir objetivos, agenda y acompañamiento del primer día.", ownerType: "ROLE", dueOffsetDays: 5, dependsOnKeys: ["hr-checklist"], required: true, sortOrder: 2 },
  { taskKey: "day-one", taskType: "DAY_ONE_READINESS", title: "Preparación del primer día", description: "Verificar accesos, equipo, agenda y persona responsable.", ownerType: "ROLE", dueOffsetDays: 7, dependsOnKeys: ["manager-checklist"], required: true, sortOrder: 3 },
  { taskKey: "asset-delivery", taskType: "ASSET_DELIVERY", title: "Entrega de equipo de trabajo", description: "Asignar el activo, confirmar custodia y conservar evidencia.", ownerType: "ROLE", dueOffsetDays: 6, dependsOnKeys: ["hr-checklist"], required: true, sortOrder: 4 },
];

export default function OnboardingDocumentsPage() {
  const queryClient = useQueryClient();
  const { currentBranch, can } = useAppStore();
  const [selectedId, setSelectedId] = useState("");
  const [templateOpen, setTemplateOpen] = useState(false);
  const [uploadTask, setUploadTask] = useState<EmployeeOnboardingTaskDto | null>(null);
  const [templateName, setTemplateName] = useState("Incorporación estándar");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const flows = useQuery({ queryKey: ["onboarding-flows", currentBranch?.id], queryFn: () => fetchOnboardingFlows(currentBranch?.id) });
  const templates = useQuery({ queryKey: ["onboarding-templates"], queryFn: fetchOnboardingTemplates });
  const selected = useMemo(() => flows.data?.items.find((flow) => flow.id === selectedId) ?? flows.data?.items[0] ?? null, [flows.data, selectedId]);

  const refresh = async () => queryClient.invalidateQueries({ queryKey: ["onboarding-flows"] });
  const createTemplate = useMutation({
    mutationFn: () => createOnboardingTemplate({ name: templateName, description: "Checklist reutilizable con dependencias y fechas relativas.", isDefault: true, tasks: starterTasks }),
    onSuccess: async (template) => { await queryClient.invalidateQueries({ queryKey: ["onboarding-templates"] }); setSelectedTemplateId(template.id); setTemplateOpen(false); },
  });
  const applyTemplate = useMutation({ mutationFn: () => applyOnboardingTemplate(selected!.id, selectedTemplateId), onSuccess: refresh });
  const updateTask = useMutation({ mutationFn: ({ id, status, blockingReason }: { id: string; status?: string; blockingReason?: string }) => updateOnboardingTask(id, { status, blockingReason }), onSuccess: refresh });
  const upload = useMutation({
    mutationFn: () => uploadOnboardingDocument(selected!.id, { file: files[0], taskId: uploadTask?.id, category: uploadTask?.taskType ?? "OTHER" }),
    onSuccess: async () => { await refresh(); setUploadTask(null); setFiles([]); },
  });
  const review = useMutation({ mutationFn: ({ id, status }: { id: string; status: "APPROVED" | "REJECTED" }) => reviewOnboardingDocument(id, status), onSuccess: refresh });

  return <div className="space-y-7">
    <PageHeader eyebrow="Personas" title="Incorporación y documentos" description="Coordina responsables, vencimientos, dependencias y evidencias desde la contratación hasta un primer día listo." actions={can("onboarding.manage") ? <Button variant="secondary" onClick={() => setTemplateOpen(true)}><Plus className="size-4" />Nueva plantilla</Button> : undefined} />
    {flows.isLoading ? <AsyncState state="loading" title="Cargando incorporaciones" /> : null}
    {flows.isError ? <AsyncState state="error" title="No pudimos cargar las incorporaciones" onRetry={() => void flows.refetch()} /> : null}
    {flows.isSuccess && !flows.data.items.length ? <InlineFeedback tone="info" title="Todavía no hay incorporaciones">Al contratar formalmente a un candidato se creará aquí su expediente y recorrido de ingreso.</InlineFeedback> : null}
    {selected ? <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="space-y-3" aria-label="Empleados en incorporación">{flows.data?.items.map((flow) => <button key={flow.id} type="button" onClick={() => setSelectedId(flow.id)} className={`w-full rounded-2xl border p-4 text-left transition ${flow.id === selected.id ? "border-primary bg-primary/5" : "bg-surface-section hover:bg-surface-interactive"}`}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{flow.employee.name}</p><p className="text-sm text-text-secondary">{flow.employee.jobTitle || "Puesto por confirmar"} · {flow.branch.name}</p></div><Badge>{flow.progressPercent}%</Badge></div><Progress value={flow.progressPercent} /><p className="mt-3 text-xs text-text-secondary">{flow.nextAction ? `Siguiente: ${flow.nextAction.title}` : "Sin tareas disponibles"}</p></button>)}</aside>
      <main className="space-y-5">
        <FlowSummary flow={selected} />
        {!selected.template ? <InlineFeedback tone="warning" title="Esta incorporación no tiene plantilla" action={can("onboarding.manage") ? <div className="flex gap-2"><Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}><SelectTrigger className="min-w-52"><SelectValue placeholder="Seleccionar plantilla" /></SelectTrigger><SelectContent>{templates.data?.map((template) => <SelectItem key={template.id} value={template.id}>{template.name} v{template.version}</SelectItem>)}</SelectContent></Select><Button disabled={!selectedTemplateId || applyTemplate.isPending} onClick={() => applyTemplate.mutate()}>Aplicar</Button></div> : undefined}>Aplica una plantilla para estandarizar responsables, fechas y dependencias.</InlineFeedback> : null}
        {selected.alerts.length ? <section className="space-y-2" aria-labelledby="onboarding-alerts"><h2 id="onboarding-alerts" className="font-semibold">Alertas y bloqueos</h2>{selected.alerts.map((alert) => <InlineFeedback key={`${alert.taskId}-${alert.message}`} tone={alert.severity} title={alert.severity === "danger" ? "Atención inmediata" : "Tarea bloqueada"}>{alert.message}</InlineFeedback>)}</section> : null}
        <section className="space-y-3" aria-labelledby="onboarding-checklist"><div className="flex items-center justify-between"><h2 id="onboarding-checklist" className="text-lg font-semibold">Checklist y timeline</h2><span className="text-sm text-text-secondary">{selected.tasks.filter((task) => task.status === "COMPLETED").length} de {selected.tasks.length} completadas</span></div>{selected.tasks.map((task, index) => <TaskRow key={task.id} task={task} index={index} canManage={can("onboarding.manage")} onComplete={() => updateTask.mutate({ id: task.id, status: "COMPLETED" })} onBlock={() => updateTask.mutate({ id: task.id, status: "BLOCKED", blockingReason: "Requiere intervención antes de continuar" })} onUnblock={() => updateTask.mutate({ id: task.id, status: "IN_PROGRESS", blockingReason: "" })} onUpload={() => setUploadTask(task)} pending={updateTask.isPending} />)}</section>
        <section className="space-y-3" aria-labelledby="onboarding-signatures"><div className="flex items-center justify-between gap-3"><h2 id="onboarding-signatures" className="text-lg font-semibold">Firmas de incorporación</h2><Button asChild size="sm" variant="secondary"><Link href="/onboarding/signatures"><FileSignature className="size-4" />Gestionar firmas</Link></Button></div>{selected.signaturePackages?.length ? selected.signaturePackages.map((item) => <Card key={item.id} level={3}><CardContent className="flex flex-wrap items-center gap-4 p-4"><FileSignature className="size-5 text-primary" /><div className="min-w-0 flex-1"><p className="font-medium">{item.title}</p><p className="text-xs text-text-secondary">{item.participants.filter((participant) => participant.status === "SIGNED").length}/{item.participants.length} firmantes · {item.dueDate ? `vence ${new Date(item.dueDate).toLocaleDateString()}` : "sin fecha límite"}</p></div><Badge>{item.status}</Badge></CardContent></Card>) : <InlineFeedback tone="info" title="Sin paquetes de firma">Crea el paquete desde Firma electrónica; al completarse actualizará automáticamente este onboarding.</InlineFeedback>}</section>
        <Documents flow={selected} canManage={can("onboarding.manage")} onReview={(id, status) => review.mutate({ id, status })} />
      </main>
    </div> : null}
    <Dialog open={templateOpen} onOpenChange={setTemplateOpen}><DialogContent><DialogHeader><DialogTitle>Nueva plantilla de onboarding</DialogTitle><DialogDescription>Se creará una versión reutilizable con documentos, validación de RRHH, preparación del supervisor y readiness del primer día.</DialogDescription></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label htmlFor="template-name">Nombre</Label><Input id="template-name" value={templateName} onChange={(event) => setTemplateName(event.target.value)} /></div><ol className="space-y-2 text-sm">{starterTasks.map((task, index) => <li key={task.taskKey} className="rounded-xl bg-secondary/50 p-3"><strong>{index + 1}. {task.title}</strong><p className="text-text-secondary">{task.description} · vence en {task.dueOffsetDays} días</p></li>)}</ol><Button className="w-full" disabled={!templateName.trim() || createTemplate.isPending} onClick={() => createTemplate.mutate()}>{createTemplate.isPending ? "Creando…" : "Crear plantilla"}</Button></div></DialogContent></Dialog>
    <Dialog open={Boolean(uploadTask)} onOpenChange={(open) => !open && setUploadTask(null)}><DialogContent><DialogHeader><DialogTitle>Cargar documento seguro</DialogTitle><DialogDescription>PDF, JPEG o PNG, máximo 15 MB. El archivo se almacena de forma privada y queda pendiente de revisión.</DialogDescription></DialogHeader><FileUpload accept=".pdf,.jpg,.jpeg,.png" maxFiles={1} onFiles={setFiles} /><Button disabled={!files[0] || upload.isPending} onClick={() => upload.mutate()}>{upload.isPending ? "Protegiendo y cargando…" : "Cargar al expediente"}</Button>{upload.isError ? <p role="alert" className="text-sm text-status-danger">No fue posible cargar el documento.</p> : null}</DialogContent></Dialog>
  </div>;
}

function FlowSummary({ flow }: { flow: EmployeeOnboardingFlowDto }) {
  return <Card level={1}><CardHeader><div className="flex flex-wrap items-start justify-between gap-4"><div><CardTitle>{flow.employee.name}</CardTitle><p className="text-sm text-text-secondary">{flow.employee.jobTitle || "Puesto por confirmar"} · {flow.branch.name}</p></div><Badge>{flow.readinessStatus === "READY" ? "Listo para iniciar" : "En incorporación"}</Badge></div></CardHeader><CardContent className="grid gap-4 sm:grid-cols-3"><Metric icon={UserRoundCheck} label="Avance" value={`${flow.progressPercent}%`} /><Metric icon={CalendarClock} label="Inicio" value={new Date(flow.startedAt).toLocaleDateString()} /><Metric icon={FileCheck2} label="Expediente" value={`${flow.documents.length} documentos`} />{flow.nextAction ? <div className="sm:col-span-3 rounded-xl border border-primary/25 bg-primary/5 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-primary">Siguiente acción</p><p className="mt-1 font-semibold">{flow.nextAction.title}</p><p className="text-sm text-text-secondary">{flow.nextAction.description}</p></div> : null}</CardContent></Card>;
}

function TaskRow({ task, index, canManage, onComplete, onBlock, onUnblock, onUpload, pending }: { task: EmployeeOnboardingTaskDto; index: number; canManage: boolean; onComplete: () => void; onBlock: () => void; onUnblock: () => void; onUpload: () => void; pending: boolean }) {
  return <Card level={task.overdue || task.blocked ? 1 : 2}><CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start"><div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${task.status === "COMPLETED" ? "bg-status-success/15 text-status-success" : task.blocked ? "bg-status-warning/15 text-status-warning" : "bg-secondary text-text-secondary"}`}>{task.status === "COMPLETED" ? <Check className="size-5" /> : task.blocked ? <AlertTriangle className="size-5" /> : index + 1}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{task.title}</h3><Badge>{task.status}</Badge>{task.overdue ? <Badge variant="destructive">Vencida</Badge> : null}</div><p className="mt-1 text-sm text-text-secondary">{task.description}</p><div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-text-secondary"><span>Responsable: {task.ownerType === "ROLE" ? "Rol asignado" : task.ownerType}</span><span>Fecha límite: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "Sin definir"}</span>{task.waitingFor.length ? <span>Depende de: {task.waitingFor.join(", ")}</span> : null}</div>{task.blockingReason ? <p className="mt-2 text-sm text-status-warning">{task.blockingReason}</p> : null}</div>{canManage && task.status !== "COMPLETED" ? <div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={onUpload}><Upload className="size-4" />Evidencia</Button><Button size="sm" variant="ghost" onClick={task.blockingReason ? onUnblock : onBlock} disabled={pending}>{task.blockingReason ? "Desbloquear" : "Bloquear"}</Button><Button size="sm" onClick={onComplete} disabled={task.blocked || pending}>Completar</Button></div> : null}</CardContent></Card>;
}

function Documents({ flow, canManage, onReview }: { flow: EmployeeOnboardingFlowDto; canManage: boolean; onReview: (id: string, status: "APPROVED" | "REJECTED") => void }) {
  return <section className="space-y-3" aria-labelledby="employee-documents"><h2 id="employee-documents" className="text-lg font-semibold">Expediente documental</h2>{!flow.documents.length ? <InlineFeedback tone="info" title="Sin documentos cargados">Usa “Evidencia” en una tarea para incorporar archivos al expediente privado.</InlineFeedback> : flow.documents.map((document) => <Card key={document.id} level={3}><CardContent className="flex flex-wrap items-center gap-4 p-4"><FileCheck2 className="size-5 text-primary" /><div className="min-w-0 flex-1"><p className="truncate font-medium">{document.originalName}</p><p className="text-xs text-text-secondary">{document.category} · {(document.sizeBytes / 1024).toFixed(0)} KB · análisis {document.scanStatus.toLowerCase()}</p></div><Badge>{document.status}</Badge>{canManage && document.status === "PENDING_REVIEW" ? <div className="flex gap-2"><Button size="sm" variant="ghost" onClick={() => onReview(document.id, "REJECTED")}>Rechazar</Button><Button size="sm" onClick={() => onReview(document.id, "APPROVED")}>Aprobar</Button></div> : null}</CardContent></Card>)}</section>;
}

function Progress({ value }: { value: number }) { return <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary" aria-label={`Progreso ${value}%`}><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${value}%` }} /></div>; }
function Metric({ icon: Icon, label, value }: { icon: typeof UserRoundCheck; label: string; value: string }) { return <div className="flex items-center gap-3 rounded-xl bg-secondary/40 p-3"><Icon className="size-5 text-primary" /><div><p className="text-xs text-text-secondary">{label}</p><p className="font-semibold">{value}</p></div></div>; }
