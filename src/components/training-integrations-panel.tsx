"use client";

import { useUiText } from "@/components/ui-copy";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, BookOpen, History, Plus, Radio, RefreshCw, ShieldCheck, Webhook } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import {
  EmptyState,
  ErrorState,
  InlineNote,
  Metric,
  MetricRow,
  PageHeader,
  SkeletonRows,
  StatusBadge,
} from "@/components/system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTrainingScormLaunchUrl, createTrainingVirtualSession, createTrainingWebhook, decideTrainingRecommendation, executeTrainingOperation, fetchTrainingCourses, fetchTrainingIntegrations, fetchTrainingOperations, getApiErrorMessage, retryTrainingWebhookDelivery, testTrainingWebhooks, uploadTrainingScormPackage } from "@/lib/backend";
import type { TrainingOperationKind } from "@/lib/contracts";
import { technicalLabel } from "@/lib/ui-labels";
import {
  deliveryStatusLabel,
  deliveryStatusTone,
  formatDateTime,
  formatDuration,
  healthStatusLabel,
  healthStatusTone,
  packageStatusLabel,
  packageStatusTone,
  runKindLabel,
  runStatusLabel,
  runStatusTone,
} from "@/lib/training-labels";

type DialogKind = "scorm" | "webhook" | "session" | null;

export function TrainingIntegrationsPanel() {
  const uiText = useUiText();
  const client = useQueryClient();
  const [dialog, setDialog] = useState<DialogKind>(null);
  const query = useQuery({ queryKey: ["training-integrations"], queryFn: fetchTrainingIntegrations });
  const courses = useQuery({ queryKey: ["training-courses", "integration-select"], queryFn: () => fetchTrainingCourses({ pageSize: 100 }) });
  const refresh = async () => client.invalidateQueries({ queryKey: ["training-integrations"] });
  const mutation = useMutation({
    mutationFn: async ({ kind, input }: { kind: Exclude<DialogKind, null>; input: Record<string, unknown> }) => {
      if (kind === "scorm") return uploadTrainingScormPackage(input as Parameters<typeof uploadTrainingScormPackage>[0]);
      if (kind === "session") return createTrainingVirtualSession(input as Parameters<typeof createTrainingVirtualSession>[0]);
      return createTrainingWebhook(input as Parameters<typeof createTrainingWebhook>[0]);
    },
    onSuccess: async () => { await refresh(); setDialog(null); toast.success("Configuración guardada"); },
    onError: (error) => toast.error(getApiErrorMessage(error, uiText("No fue posible guardar la configuración."))),
  });
  const decision = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACCEPTED" | "DISMISSED" }) => decideTrainingRecommendation(id, status),
    onSuccess: async () => { await refresh(); toast.success("Decisión registrada con trazabilidad"); },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible registrar la decisión.")),
  });
  const webhookAction = useMutation({
    mutationFn: async (deliveryId?: string) => deliveryId
      ? { mode: "retry" as const, result: await retryTrainingWebhookDelivery(deliveryId) }
      : { mode: "test" as const, result: await testTrainingWebhooks() },
    onSuccess: async ({ mode, result }) => { await refresh(); toast.success(mode === "test" ? `${result.queued} entregas encoladas` : "Reintento encolado"); },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible encolar la entrega.")),
  });
  const launchScorm = async (id: string) => {
    const player = window.open("about:blank", "_blank");
    try {
      const { url } = await createTrainingScormLaunchUrl(id);
      if (player) player.location.href = url;
      else toast.error("El navegador bloqueó la ventana del reproductor. Permite ventanas emergentes para este sitio.");
    } catch (error) { player?.close(); toast.error(getApiErrorMessage(error, "No fue posible abrir el paquete.")); }
  };
  if (query.isLoading) return <SkeletonRows rows={6} label={uiText("Cargando las integraciones formativas")} />;
  if (query.isError) return <ErrorState title={uiText("No fue posible cargar las integraciones")} detail={getApiErrorMessage(query.error, uiText("Reintenta la consulta para continuar."))} onRetry={() => void query.refetch()} />;
  const data = query.data!;
  return <div className="space-y-6">
    <PageHeader eyebrow={uiText("Aprendizaje")} title={uiText("Integraciones formativas")} description={uiText("Supervisa SCORM, actividad xAPI, sesiones virtuales y webhooks sin exponer secretos.")} actions={<Button onClick={() => setDialog("scorm")}><Plus className="size-4" aria-hidden="true" />{uiText("Registrar paquete SCORM")}</Button>} /><IntegrationGuide />
    <MetricRow>{[{label:uiText("Paquetes SCORM"),value:data.packages.length},{label:uiText("Eventos xAPI"),value:data.xapiStatements},{label:uiText("Webhooks"),value:data.webhooks.length},{label:uiText("Sesiones próximas"),value:data.sessions.length},{label:uiText("Recursos publicados"),value:data.resources}].map((item)=><Metric key={item.label} label={item.label} value={String(item.value)} />)}</MetricRow>
    <Card><CardHeader><CardTitle>{uiText("Salud operativa")}</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><HealthItem label={uiText("Almacenamiento")} value={data.operations.storage.driver === "s3" ? `S3 · ${data.operations.storage.bucket}` : "Volumen local"} state={data.operations.storage.encryption ? "Cifrado" : "Sin cifrado"} /><HealthItem label={uiText("Antivirus")} value={data.operations.antivirus.mode === "disabled" ? "No configurado" : data.operations.antivirus.mode} state={data.operations.antivirus.required ? uiText("Obligatorio") : uiText("Opcional")} warning={data.operations.antivirus.mode === "disabled"} /><HealthItem label={uiText("Uso SCORM")} value={`${formatBytes(data.operations.usage.bytes)} / ${formatBytes(data.operations.limits.tenantQuotaBytes)}`} state={`${data.operations.usage.packages} / ${data.operations.limits.packageLimit} paquetes`} /><HealthItem label={uiText("Entregas fallidas")} value={String(data.operations.webhooks.failedDeliveries)} state={data.operations.webhooks.failedDeliveries ? uiText("Requiere atención") : "Operativo"} warning={data.operations.webhooks.failedDeliveries > 0} /></CardContent></Card>
    <TrainingOperationsCenter />
    <div className="grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle>SCORM</CardTitle></CardHeader><CardContent className="space-y-3">{data.packages.length?data.packages.map((item)=><div key={item.id} className="rounded-xl border p-4"><div className="flex flex-wrap items-center justify-between gap-3"><strong>{item.title}</strong><StatusBadge size="sm" tone={packageStatusTone(item.status)} label={packageStatusLabel(item.status)} /></div><p className="text-sm text-muted-foreground">{item.course.title} · SCORM {item.version} · {item._count.sessions} {uiText(" sesiones")}</p><Button size="sm" variant="secondary" className="mt-2" onClick={()=>launchScorm(item.id)}>{uiText("Abrir reproductor")}</Button></div>):<EmptyState reason="no-records" title={uiText("No hay paquetes SCORM")} description={uiText("Registra un paquete para reproducir contenido formativo dentro de la plataforma.")} action={<Button variant="secondary" onClick={()=>setDialog("scorm")}>{uiText("Registrar el primero")}</Button>} />}</CardContent></Card><Card><CardHeader className="flex-row items-center justify-between gap-2"><CardTitle>Webhooks</CardTitle><div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={()=>webhookAction.mutate(undefined)} disabled={webhookAction.isPending}>{uiText("Probar entrega")}</Button><Button size="sm" variant="secondary" onClick={()=>setDialog("webhook")}><Plus className="size-4" aria-hidden="true" />{uiText("Nuevo webhook")}</Button></div></CardHeader><CardContent className="space-y-3">{data.webhooks.length?data.webhooks.map((item)=><div key={item.id} className="rounded-xl border p-4"><div className="flex justify-between gap-3"><strong>{item.name}</strong><Badge variant={item.isActive&&item.deliveryReady?"success":"secondary"}>{item.deliveryReady?(item.isActive?uiText("Activo", undefined, "status"):"Inactivo"):"Reconfigurar"}</Badge></div><p className="truncate text-sm text-muted-foreground">{item.endpointUrl}</p><p className="mt-1 text-xs text-muted-foreground">{item.eventTypes.join(", ")}</p>{!item.deliveryReady?<div className="mt-2"><InlineNote tone="warning" title={uiText("Este webhook no puede entregar")}>{uiText("La configuración anterior no guardó un secreto recuperable. Crea un webhook nuevo con su secreto.")}</InlineNote></div>:null}{item.lastError?<p className="mt-2 text-xs text-destructive">{item.lastError}</p>:null}</div>):<EmptyState reason="no-records" title={uiText("No hay webhooks configurados")} description={uiText("Un webhook avisa a otro sistema cuando ocurre algo en la formación.")} action={<Button variant="secondary" onClick={()=>setDialog("webhook")}>{uiText("Configurar el primero")}</Button>} />}</CardContent></Card></div>
    <Card><CardHeader><CardTitle>{uiText("Entregas recientes")}</CardTitle></CardHeader><CardContent className="space-y-3">{data.deliveries.length?data.deliveries.map((item)=><div key={item.id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><strong>{technicalLabel(item.eventType)}</strong><StatusBadge size="sm" tone={deliveryStatusTone(item.status)} label={deliveryStatusLabel(item.status)} /></div><p className="text-xs text-muted-foreground">{item.webhook.name} · {item.attemptCount} {item.attemptCount === 1 ? "intento" : uiText("intentos")} · {formatDateTime(item.createdAt)}</p>{item.lastError?<p className="mt-1 text-xs text-destructive">{item.lastError}</p>:null}</div>{item.status==="FAILED"?<Button size="sm" variant="secondary" onClick={()=>webhookAction.mutate(item.id)}>{uiText("Reintentar")}</Button>:null}</div>):<EmptyState reason="no-records" title={uiText("Todavía no hay entregas")} description={uiText("Aquí aparecerán los envíos a los sistemas conectados.")} />}</CardContent></Card>
    <div className="grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle>{uiText("Próximas sesiones")}</CardTitle></CardHeader><CardContent className="space-y-3">{data.sessions.length?data.sessions.map((item)=><div key={item.id} className="rounded-xl border p-4"><strong>{item.title}</strong><p className="text-sm text-muted-foreground">{formatDateTime(item.startsAt)} · {item.timeZone}</p>{item.meetingUrl?<a className="text-sm text-brand underline" href={item.meetingUrl} target="_blank" rel="noreferrer">{uiText("Abrir reunión")}</a>:null}</div>):<EmptyState reason="no-records" title={uiText("No hay sesiones próximas")} description={uiText("Programa una sesión virtual para que aparezca en la agenda.")} action={<Button variant="secondary" onClick={()=>setDialog("session")}>{uiText("Programar una sesión")}</Button>} />}</CardContent></Card><Card><CardHeader><CardTitle>{uiText("Recomendaciones explicables")}</CardTitle></CardHeader><CardContent className="space-y-3">{data.recommendations.length?data.recommendations.map((item)=><div key={item.id} className="rounded-xl border p-4"><p className="text-sm">{item.reason}</p><p className="my-2 text-xs text-muted-foreground">{uiText("Es una sugerencia; requiere confirmación humana.")}</p><div className="flex gap-2"><Button size="sm" onClick={() => decision.mutate({id:item.id,status:"ACCEPTED"})}>{uiText("Aceptar")}</Button><Button size="sm" variant="secondary" onClick={() => decision.mutate({id:item.id,status:"DISMISSED"})}>{uiText("Descartar")}</Button></div></div>):<EmptyState reason="no-records" title={uiText("No hay recomendaciones pendientes")} description={uiText("Cuando el sistema detecte una oportunidad, aparecerá aquí para que una persona decida.")} />}</CardContent></Card></div>
    <IntegrationDialog kind={dialog} courses={courses.data?.items ?? []} pending={mutation.isPending} onClose={() => setDialog(null)} onSubmit={(kind,input)=>mutation.mutate({kind,input})} />
  </div>;
}

function IntegrationGuide() {
  const uiText = useUiText();
  return (
    <section aria-labelledby="integration-guide-title" className="rounded-2xl border border-border-default bg-surface-section p-4">
      <div className="mb-3">
        <h2 id="integration-guide-title" className="font-semibold">{uiText("Qué puedes conectar")}</h2>
        <p className="text-sm text-muted-foreground">{uiText("Elige la integración según el tipo de experiencia o sistema que necesitas supervisar.")}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <GuideItem icon={<BookOpen className="size-4" />} title="SCORM" description={uiText("Paquetes de contenido formativo que se reproducen dentro de la plataforma.")} />
        <GuideItem icon={<Radio className="size-4" />} title="xAPI" description={uiText("Eventos que registran actividad de aprendizaje y uso de recursos.")} />
        <GuideItem icon={<Webhook className="size-4" />} title={uiText("Webhooks")} description={uiText("Notificaciones automáticas para informar a otros sistemas sobre eventos.")} />
      </div>
    </section>
  );
}

function GuideItem({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return <div className="flex gap-3 rounded-xl border border-border-default bg-card p-3"><span className="mt-0.5 text-brand">{icon}</span><div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div></div>;
}

const operationLabels: Record<TrainingOperationKind, string> = {
  PROCESS_DUE_COURSES: "Procesar publicaciones",
  PROCESS_DUE_LAUNCHES: "Procesar campañas",
  RECOVER_WEBHOOKS: "Recuperar cola",
  RETRY_FAILED_WEBHOOKS: "Reintentar fallidas",
  CLEAR_STALE_LAUNCH_LOCKS: "Liberar bloqueos",
};

function TrainingOperationsCenter() {
  const uiText = useUiText();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["training-operations"],
    queryFn: fetchTrainingOperations,
    refetchInterval: 60_000,
  });
  const execute = useMutation({
    mutationFn: executeTrainingOperation,
    onSuccess: async (run) => {
      toast.success(run.status === "SUCCEEDED" ? "Operación completada" : "Operación registrada");
      await client.invalidateQueries({ queryKey: ["training-operations"] });
      await client.invalidateQueries({ queryKey: ["training-integrations"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "La operación no pudo completarse.")),
  });
  if (query.isLoading) return <SkeletonRows rows={4} label={uiText("Comprobando la operación formativa")} />;
  if (query.isError) return <ErrorState title={uiText("No fue posible consultar la operación")} detail={getApiErrorMessage(query.error, uiText("Reintenta la consulta para continuar."))} onRetry={() => void query.refetch()} />;
  const data = query.data!;
  return (
    <section className="space-y-4">
      <Card className={data.health.status === "CRITICAL" ? "border-destructive/40" : ""}>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><CardTitle className="flex items-center gap-2"><Activity className="size-5 text-brand" />{uiText("Centro de operaciones")}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{uiText("Atrasos reales, recuperación tenant-safe y evidencia de cada intervención.")}</p></div>
            <div className="text-right"><div className="flex items-center justify-end gap-2"><strong className="font-mono text-4xl tabular-figures">{data.health.score}</strong><StatusBadge tone={healthStatusTone(data.health.status)} label={healthStatusLabel(data.health.status)} /></div><p className="text-xs text-muted-foreground">{uiText("salud operativa / 100")}</p></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {data.checks.map((check) => (
              <div key={check.code} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2"><ShieldCheck className={check.status === "CRITICAL" ? "size-4 text-status-danger" : check.status === "WARNING" ? "size-4 text-status-warning" : "size-4 text-status-success"} aria-hidden="true" /><StatusBadge size="sm" tone={healthStatusTone(check.status)} label={healthStatusLabel(check.status)} /></div>
                <p className="mt-3 text-sm font-medium">{check.label}</p>
                <p className="text-xs text-muted-foreground">{check.count ? `${check.count} ${check.count === 1 ? "pendiente" : "pendientes"} · el más antiguo lleva ${check.ageMinutes} min` : "Sin atrasos"}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{uiText("Acciones de recuperación")}</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(operationLabels) as TrainingOperationKind[]).map((kind) => (
                <Button key={kind} size="sm" variant="secondary" disabled={execute.isPending} onClick={() => execute.mutate(kind)}>
                  <RefreshCw className={execute.isPending && execute.variables === kind ? "size-4 animate-spin" : "size-4"} />
                  {operationLabels[kind]}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><History className="size-5" />{uiText("Ejecuciones recientes")}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.runs.length ? data.runs.slice(0, 12).map((run) => (
              <div key={run.id} className="rounded-xl border p-3">
                <div className="flex flex-wrap items-center justify-between gap-3"><strong className="text-sm">{operationLabels[run.kind] ?? runKindLabel(run.kind)}</strong><StatusBadge size="sm" tone={runStatusTone(run.status)} label={runStatusLabel(run.status)} /></div>
                <p className="mt-1 text-xs text-muted-foreground">{run.actor ? `${run.actor.firstName} ${run.actor.lastName}` : uiText("Sistema")} · {formatDateTime(run.startedAt)}{run.durationMs !== null && run.durationMs !== undefined ? ` · ${formatDuration(run.durationMs)}` : ""}</p>
                {run.error ? <p className="mt-1 text-xs text-destructive">{run.error}</p> : null}
              </div>
            )) : <EmptyState reason="no-records" title={uiText("Todavía no hay recuperaciones manuales")} description={uiText("Cada acción de recuperación que ejecutes quedará registrada aquí.")} />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5" />{uiText("Auditoría formativa")}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.audit.length ? data.audit.slice(0, 15).map((event) => (
              <div key={event.id} className="rounded-xl border p-3">
                <div className="flex items-center justify-between gap-3"><strong className="truncate text-sm">{event.action ?? `${event.method} ${event.route}`}</strong><Badge variant={event.statusCode >= 400 ? "destructive" : "secondary"}>{event.statusCode}</Badge></div>
                <p className="mt-1 text-xs text-muted-foreground">{event.email ?? "Sistema"} · {formatDateTime(event.createdAt)}</p>
                {event.correlationId ? <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">correlation: {event.correlationId}</p> : null}
              </div>
            )) : <EmptyState reason="no-records" title={uiText("No hay eventos auditados")} description={uiText("La actividad sobre formación aparecerá aquí en cuanto ocurra.")} />}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function IntegrationDialog({ kind, courses, pending, onClose, onSubmit }: { kind: DialogKind; courses: Array<{id:string;title:string}>; pending:boolean; onClose:()=>void; onSubmit:(kind:Exclude<DialogKind,null>,input:Record<string,unknown>)=>void }) {
  const uiText = useUiText();
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!kind) return;
    const values: Record<string, unknown> = Object.fromEntries(new FormData(event.currentTarget));
    if (kind === "webhook") values.eventTypes = String(values.eventTypes).split(",").map((value)=>value.trim()).filter(Boolean);
    if (kind === "scorm") {
      const file = new FormData(event.currentTarget).get("file");
      if (!(file instanceof File) || !file.size) return;
      values.file = file;
    }
    onSubmit(kind, values);
  };
  const title = kind === "scorm" ? "Registrar paquete SCORM validado" : kind === "webhook" ? "Configurar webhook" : "Programar sesión virtual";
  return <Dialog open={Boolean(kind)} onOpenChange={(open)=>!open&&onClose()}><DialogContent><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{uiText("La operación queda aislada a la empresa activa y será auditada.")}</DialogDescription></DialogHeader>{kind?<form className="space-y-4" onSubmit={submit}>
    {kind === "scorm" ? <><div><Label>{uiText("Curso")}</Label><Select name="courseId" required><SelectTrigger><SelectValue placeholder={uiText("Selecciona un curso")} /></SelectTrigger><SelectContent>{courses.map((course)=><SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}</SelectContent></Select></div><Field name="title" label={uiText("Nombre del paquete")} /><div><Label htmlFor="file">{uiText("Paquete SCORM ZIP")}</Label><Input id="file" name="file" type="file" accept=".zip,application/zip" required /><p className="mt-1 text-xs text-muted-foreground">{uiText("Máximo 100 MB. Se valida manifest, rutas, tamaño expandido y checksum antes de almacenarlo.")}</p></div></> : null}
    {kind === "webhook" ? <><Field name="name" label={uiText("Nombre")} /><Field name="endpointUrl" label={uiText("Endpoint HTTPS")} type="url" /><Field name="eventTypes" label={uiText("Eventos separados por coma")} placeholder="course.assigned, course.completed" /><Field name="secret" label={uiText("Secreto de firma")} type="password" /></> : null}
    {kind === "session" ? <><Field name="title" label={uiText("Título")} /><Field name="startsAt" label={uiText("Inicio")} type="datetime-local" /><Field name="endsAt" label={uiText("Fin")} type="datetime-local" required={false} /><Field name="meetingUrl" label={uiText("Enlace de reunión")} type="url" /><Field name="timeZone" label={uiText("Zona horaria IANA")} placeholder="America/New_York" /><div><Label>{uiText("Curso relacionado (opcional)")}</Label><Select name="courseId"><SelectTrigger><SelectValue placeholder={uiText("Sin curso")} /></SelectTrigger><SelectContent>{courses.map((course)=><SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}</SelectContent></Select></div></> : null}
    <Button className="w-full" loading={pending} loadingLabel={uiText("Guardando…")}>{uiText("Guardar")}</Button>
  </form>:null}</DialogContent></Dialog>;
}

function Field({ name, label, type="text", placeholder, required=true }: {name:string;label:string;type?:string;placeholder?:string;required?:boolean}) {
  return <div><Label htmlFor={name}>{label}</Label><Input id={name} name={name} type={type} placeholder={placeholder} required={required} /></div>;
}

function HealthItem({ label, value, state, warning=false }: {label:string;value:string;state:string;warning?:boolean}) {
  return <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">{label}</p><strong className="mt-1 block">{value}</strong><p className={warning?"text-xs text-status-warning":"text-xs text-muted-foreground"}>{state}</p></div>;
}
function formatBytes(value:number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value/1024).toFixed(1)} KB`;
  if (value < 1024 ** 3) return `${(value/1024**2).toFixed(1)} MB`;
  return `${(value/1024**3).toFixed(1)} GB`;
}
