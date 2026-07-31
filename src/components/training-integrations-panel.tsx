"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, BookOpen, CalendarDays, History, Plus, Radio, RefreshCw, ShieldCheck, Webhook } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AsyncState } from "@/components/async-state";
import { PageHeader } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTrainingScormLaunchUrl, createTrainingVirtualSession, createTrainingWebhook, decideTrainingRecommendation, executeTrainingOperation, fetchTrainingCourses, fetchTrainingIntegrations, fetchTrainingOperations, getApiErrorMessage, retryTrainingWebhookDelivery, testTrainingWebhooks, uploadTrainingScormPackage } from "@/lib/backend";
import type { TrainingOperationKind } from "@/lib/contracts";

type DialogKind = "scorm" | "webhook" | "session" | null;

export function TrainingIntegrationsPanel() {
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
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible guardar la configuración.")),
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
  if (query.isLoading) return <AsyncState state="loading" title="Cargando integraciones formativas" />;
  if (query.isError) return <AsyncState state="error" title="No fue posible cargar las integraciones" description={getApiErrorMessage(query.error, "Reintenta para continuar.")} onRetry={() => query.refetch()} />;
  const data = query.data!;
  return <div className="space-y-6">
    <PageHeader eyebrow="Aprendizaje" title="Integraciones formativas" description="Supervisa SCORM, actividad xAPI, sesiones virtuales y webhooks sin exponer secretos." actions={<div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => setDialog("webhook")}><Plus />Webhook</Button><Button variant="secondary" onClick={() => setDialog("session")}><Plus />Sesión virtual</Button><Button onClick={() => setDialog("scorm")}><Plus />Registrar SCORM</Button></div>} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{[{label:"Paquetes SCORM",value:data.packages.length,icon:BookOpen},{label:"Eventos xAPI",value:data.xapiStatements,icon:Radio},{label:"Webhooks",value:data.webhooks.length,icon:Webhook},{label:"Sesiones próximas",value:data.sessions.length,icon:CalendarDays},{label:"Recursos publicados",value:data.resources,icon:BookOpen}].map((item)=><Card key={item.label}><CardContent className="py-5"><item.icon className="size-5 text-primary"/><p className="mt-3 text-sm text-muted-foreground">{item.label}</p><strong className="text-3xl">{item.value}</strong></CardContent></Card>)}</div>
    <Card><CardHeader><CardTitle>Salud operativa</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><HealthItem label="Almacenamiento" value={data.operations.storage.driver === "s3" ? `S3 · ${data.operations.storage.bucket}` : "Volumen local"} state={data.operations.storage.encryption ? "Cifrado" : "Sin cifrado"} /><HealthItem label="Antivirus" value={data.operations.antivirus.mode === "disabled" ? "No configurado" : data.operations.antivirus.mode} state={data.operations.antivirus.required ? "Obligatorio" : "Opcional"} warning={data.operations.antivirus.mode === "disabled"} /><HealthItem label="Uso SCORM" value={`${formatBytes(data.operations.usage.bytes)} / ${formatBytes(data.operations.limits.tenantQuotaBytes)}`} state={`${data.operations.usage.packages} / ${data.operations.limits.packageLimit} paquetes`} /><HealthItem label="Entregas fallidas" value={String(data.operations.webhooks.failedDeliveries)} state={data.operations.webhooks.failedDeliveries ? "Requiere atención" : "Operativo"} warning={data.operations.webhooks.failedDeliveries > 0} /></CardContent></Card>
    <TrainingOperationsCenter />
    <div className="grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle>SCORM</CardTitle></CardHeader><CardContent className="space-y-3">{data.packages.length?data.packages.map((item)=><div key={item.id} className="rounded-xl border p-4"><div className="flex justify-between gap-3"><strong>{item.title}</strong><Badge>{item.status}</Badge></div><p className="text-sm text-muted-foreground">{item.course.title} · SCORM {item.version} · {item._count.sessions} sesiones</p><Button size="sm" variant="secondary" className="mt-2" onClick={()=>launchScorm(item.id)}>Abrir reproductor</Button></div>):<p className="text-sm text-muted-foreground">No hay paquetes almacenados.</p>}</CardContent></Card><Card><CardHeader className="flex-row items-center justify-between"><CardTitle>Webhooks</CardTitle><Button size="sm" variant="secondary" onClick={()=>webhookAction.mutate(undefined)} disabled={webhookAction.isPending}>Probar entrega</Button></CardHeader><CardContent className="space-y-3">{data.webhooks.length?data.webhooks.map((item)=><div key={item.id} className="rounded-xl border p-4"><div className="flex justify-between gap-3"><strong>{item.name}</strong><Badge variant={item.isActive&&item.deliveryReady?"success":"secondary"}>{item.deliveryReady?(item.isActive?"Activo":"Inactivo"):"Reconfigurar"}</Badge></div><p className="truncate text-sm text-muted-foreground">{item.endpointUrl}</p><p className="mt-1 text-xs text-muted-foreground">{item.eventTypes.join(", ")}</p>{!item.deliveryReady?<p className="mt-2 text-xs text-status-warning">Configuración anterior sin secreto recuperable. Crea un webhook nuevo.</p>:null}{item.lastError?<p className="mt-2 text-xs text-destructive">{item.lastError}</p>:null}</div>):<p className="text-sm text-muted-foreground">No hay webhooks configurados.</p>}</CardContent></Card></div>
    <Card><CardHeader><CardTitle>Entregas recientes</CardTitle></CardHeader><CardContent className="space-y-3">{data.deliveries.length?data.deliveries.map((item)=><div key={item.id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><strong>{item.eventType}</strong><Badge variant={item.status==="DELIVERED"?"success":item.status==="FAILED"?"destructive":"secondary"}>{item.status}</Badge></div><p className="text-xs text-muted-foreground">{item.webhook.name} · {item.attemptCount} intentos · {new Date(item.createdAt).toLocaleString()}</p>{item.lastError?<p className="mt-1 text-xs text-destructive">{item.lastError}</p>:null}</div>{item.status==="FAILED"?<Button size="sm" variant="secondary" onClick={()=>webhookAction.mutate(item.id)}>Reintentar</Button>:null}</div>):<p className="text-sm text-muted-foreground">Todavía no hay entregas.</p>}</CardContent></Card>
    <div className="grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle>Próximas sesiones</CardTitle></CardHeader><CardContent className="space-y-3">{data.sessions.length?data.sessions.map((item)=><div key={item.id} className="rounded-xl border p-4"><strong>{item.title}</strong><p className="text-sm text-muted-foreground">{new Date(item.startsAt).toLocaleString()} · {item.timeZone}</p>{item.meetingUrl?<a className="text-sm text-primary underline" href={item.meetingUrl} target="_blank" rel="noreferrer">Abrir reunión</a>:null}</div>):<p className="text-sm text-muted-foreground">No hay sesiones virtuales próximas.</p>}</CardContent></Card><Card><CardHeader><CardTitle>Recomendaciones explicables</CardTitle></CardHeader><CardContent className="space-y-3">{data.recommendations.length?data.recommendations.map((item)=><div key={item.id} className="rounded-xl border p-4"><p className="text-sm">{item.reason}</p><p className="my-2 text-xs text-muted-foreground">Es una sugerencia; requiere confirmación humana.</p><div className="flex gap-2"><Button size="sm" onClick={() => decision.mutate({id:item.id,status:"ACCEPTED"})}>Aceptar</Button><Button size="sm" variant="secondary" onClick={() => decision.mutate({id:item.id,status:"DISMISSED"})}>Descartar</Button></div></div>):<p className="text-sm text-muted-foreground">No hay recomendaciones pendientes.</p>}</CardContent></Card></div>
    <IntegrationDialog kind={dialog} courses={courses.data?.items ?? []} pending={mutation.isPending} onClose={() => setDialog(null)} onSubmit={(kind,input)=>mutation.mutate({kind,input})} />
  </div>;
}

const operationLabels: Record<TrainingOperationKind, string> = {
  PROCESS_DUE_COURSES: "Procesar publicaciones",
  PROCESS_DUE_LAUNCHES: "Procesar campañas",
  RECOVER_WEBHOOKS: "Recuperar cola",
  RETRY_FAILED_WEBHOOKS: "Reintentar fallidas",
  CLEAR_STALE_LAUNCH_LOCKS: "Liberar bloqueos",
};

function TrainingOperationsCenter() {
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
  if (query.isLoading) return <AsyncState state="loading" title="Comprobando operación formativa" />;
  if (query.isError) return <AsyncState state="error" title="No fue posible consultar la operación" description={getApiErrorMessage(query.error, "Reintenta la consulta.")} onRetry={() => query.refetch()} />;
  const data = query.data!;
  const healthVariant = data.health.status === "CRITICAL" ? "destructive" : data.health.status === "HEALTHY" ? "success" : "secondary";
  return (
    <section className="space-y-4">
      <Card className={data.health.status === "CRITICAL" ? "border-destructive/40" : ""}>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><CardTitle className="flex items-center gap-2"><Activity className="size-5 text-primary" />Centro de operaciones</CardTitle><p className="mt-1 text-sm text-muted-foreground">Atrasos reales, recuperación tenant-safe y evidencia de cada intervención.</p></div>
            <div className="text-right"><div className="flex items-center justify-end gap-2"><strong className="text-4xl">{data.health.score}</strong><Badge variant={healthVariant}>{data.health.status}</Badge></div><p className="text-xs text-muted-foreground">salud operativa / 100</p></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {data.checks.map((check) => (
              <div key={check.code} className="rounded-xl border p-4">
                <div className="flex items-center justify-between gap-2"><ShieldCheck className={check.status === "CRITICAL" ? "size-4 text-destructive" : check.status === "WARNING" ? "size-4 text-amber-600" : "size-4 text-emerald-600"} /><Badge variant={check.status === "CRITICAL" ? "destructive" : check.status === "HEALTHY" ? "success" : "secondary"}>{check.status}</Badge></div>
                <p className="mt-3 text-sm font-medium">{check.label}</p>
                <p className="text-xs text-muted-foreground">{check.count ? `${check.count} pendiente(s) · ${check.ageMinutes} min` : "Sin atrasos"}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Acciones de recuperación</p>
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
          <CardHeader><CardTitle className="flex items-center gap-2"><History className="size-5" />Ejecuciones recientes</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.runs.length ? data.runs.slice(0, 12).map((run) => (
              <div key={run.id} className="rounded-xl border p-3">
                <div className="flex items-center justify-between gap-3"><strong className="text-sm">{operationLabels[run.kind]}</strong><Badge variant={run.status === "FAILED" ? "destructive" : run.status === "SUCCEEDED" ? "success" : "secondary"}>{run.status}</Badge></div>
                <p className="mt-1 text-xs text-muted-foreground">{run.actor ? `${run.actor.firstName} ${run.actor.lastName}` : "Sistema"} · {new Date(run.startedAt).toLocaleString("es")}{run.durationMs !== null && run.durationMs !== undefined ? ` · ${run.durationMs} ms` : ""}</p>
                {run.error ? <p className="mt-1 text-xs text-destructive">{run.error}</p> : null}
              </div>
            )) : <p className="py-8 text-center text-sm text-muted-foreground">Todavía no hay recuperaciones manuales.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5" />Auditoría formativa</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.audit.length ? data.audit.slice(0, 15).map((event) => (
              <div key={event.id} className="rounded-xl border p-3">
                <div className="flex items-center justify-between gap-3"><strong className="truncate text-sm">{event.action ?? `${event.method} ${event.route}`}</strong><Badge variant={event.statusCode >= 400 ? "destructive" : "secondary"}>{event.statusCode}</Badge></div>
                <p className="mt-1 text-xs text-muted-foreground">{event.email ?? "Sistema"} · {new Date(event.createdAt).toLocaleString("es")}</p>
                {event.correlationId ? <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">correlation: {event.correlationId}</p> : null}
              </div>
            )) : <p className="py-8 text-center text-sm text-muted-foreground">No hay eventos formativos auditados.</p>}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function IntegrationDialog({ kind, courses, pending, onClose, onSubmit }: { kind: DialogKind; courses: Array<{id:string;title:string}>; pending:boolean; onClose:()=>void; onSubmit:(kind:Exclude<DialogKind,null>,input:Record<string,unknown>)=>void }) {
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
  return <Dialog open={Boolean(kind)} onOpenChange={(open)=>!open&&onClose()}><DialogContent><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>La operación queda aislada al tenant activo y será auditada.</DialogDescription></DialogHeader>{kind?<form className="space-y-4" onSubmit={submit}>
    {kind === "scorm" ? <><div><Label>Curso</Label><Select name="courseId" required><SelectTrigger><SelectValue placeholder="Selecciona un curso" /></SelectTrigger><SelectContent>{courses.map((course)=><SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}</SelectContent></Select></div><Field name="title" label="Nombre del paquete" /><div><Label htmlFor="file">Paquete SCORM ZIP</Label><Input id="file" name="file" type="file" accept=".zip,application/zip" required /><p className="mt-1 text-xs text-muted-foreground">Máximo 100 MB. Se valida manifest, rutas, tamaño expandido y checksum antes de almacenarlo.</p></div></> : null}
    {kind === "webhook" ? <><Field name="name" label="Nombre" /><Field name="endpointUrl" label="Endpoint HTTPS" type="url" /><Field name="eventTypes" label="Eventos separados por coma" placeholder="course.assigned, course.completed" /><Field name="secret" label="Secreto de firma" type="password" /></> : null}
    {kind === "session" ? <><Field name="title" label="Título" /><Field name="startsAt" label="Inicio" type="datetime-local" /><Field name="endsAt" label="Fin" type="datetime-local" required={false} /><Field name="meetingUrl" label="Enlace de reunión" type="url" /><Field name="timeZone" label="Zona horaria IANA" placeholder="America/New_York" /><div><Label>Curso relacionado (opcional)</Label><Select name="courseId"><SelectTrigger><SelectValue placeholder="Sin curso" /></SelectTrigger><SelectContent>{courses.map((course)=><SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}</SelectContent></Select></div></> : null}
    <Button className="w-full" disabled={pending}>{pending?"Guardando…":"Guardar"}</Button>
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
