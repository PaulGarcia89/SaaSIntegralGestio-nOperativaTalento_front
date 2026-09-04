"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Activity,
  BarChart3,
  CheckCircle2,
  Download,
  Lightbulb,
  Settings2,
  Target,
  Users,
  X,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AsyncState } from "@/components/async-state";
import { PageHeader } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchBranches,
  fetchTrainingAnalytics,
  fetchTrainingCompliancePolicies,
  fetchTrainingCourses,
  fetchTrainingEffectiveness,
  fetchTrainingImprovements,
  fetchUsers,
  createTrainingImprovement,
  getApiErrorMessage,
  updateTrainingImprovement,
  upsertTrainingCompliancePolicy,
} from "@/lib/backend";
import type {
  TrainingAnalyticsDto,
  TrainingCourseImprovementDto,
  TrainingEffectivenessDto,
  TrainingEffectivenessSignalDto,
  TrainingImprovementPriority,
  TrainingImprovementStatus,
} from "@/lib/contracts";

const statusLabels = {
  NOT_STARTED: "Pendiente",
  IN_PROGRESS: "En progreso",
  COMPLETED: "Completado",
  OVERDUE: "Vencido",
};

export function TrainingAnalyticsDashboard() {
  const [courseId, setCourseId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [policyOpen, setPolicyOpen] = useState(false);
  const analytics = useQuery({
    queryKey: ["training-analytics", courseId, branchId, from, to],
    queryFn: () =>
      fetchTrainingAnalytics({
        courseId: courseId || undefined,
        branchId: branchId || undefined,
        from: from || undefined,
        to: to || undefined,
      }),
  });
  const courses = useQuery({
    queryKey: ["training-analytics-courses"],
    queryFn: () => fetchTrainingCourses({ pageSize: 100 }),
  });
  const branches = useQuery({ queryKey: ["training-analytics-branches"], queryFn: () => fetchBranches() });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Aprendizaje"
        title="Analítica y cumplimiento"
        description="Prioriza vencimientos, mide resultados y conserva evidencia operativa de la formación."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setPolicyOpen(true)}>
              <Settings2 />Políticas
            </Button>
            <Button
              onClick={() => analytics.data && exportCompliance(analytics.data)}
              disabled={!analytics.data}
            >
              <Download />Exportar CSV
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="grid gap-3 py-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <Label htmlFor="analytics-course">Curso</Label>
            <Select value={courseId || "ALL"} onValueChange={(value) => setCourseId(value === "ALL" ? "" : value)}>
              <SelectTrigger id="analytics-course"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="ALL">Todos</SelectItem>{courses.data?.items.map((course) => <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="analytics-branch">Sucursal</Label>
            <Select value={branchId || "ALL"} onValueChange={(value) => setBranchId(value === "ALL" ? "" : value)}>
              <SelectTrigger id="analytics-branch"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="ALL">Todas</SelectItem>{branches.data?.map((branch) => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label htmlFor="analytics-from">Desde</Label><Input id="analytics-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></div>
          <div><Label htmlFor="analytics-to">Hasta</Label><Input id="analytics-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} /></div>
        </CardContent>
      </Card>

      <AnalyticsScopeSummary
        courseId={courseId}
        courseTitle={courses.data?.items.find((course) => course.id === courseId)?.title}
        branchId={branchId}
        branchName={branches.data?.find((branch) => branch.id === branchId)?.name}
        from={from}
        to={to}
        onClear={() => { setCourseId(""); setBranchId(""); setFrom(""); setTo(""); }}
      />

      {analytics.isLoading ? <AsyncState state="loading" title="Calculando indicadores" /> : null}
      {analytics.isError ? <AsyncState state="error" title="No fue posible calcular la analítica" description={getApiErrorMessage(analytics.error, "Reintenta la consulta.")} onRetry={() => analytics.refetch()} /> : null}
      {analytics.data ? (
        <>
          <MetricGrid data={analytics.data} />
          <CoursePerformance data={analytics.data} />
          <EffectivenessPanel
            filters={{
              courseId: courseId || undefined,
              branchId: branchId || undefined,
              from: from || undefined,
              to: to || undefined,
            }}
          />
          <ComplianceMatrix data={analytics.data} />
          <p className="text-xs text-muted-foreground">
            Fuente: asignaciones, progreso e intentos reales · Actualizado {new Date(analytics.data.generatedAt).toLocaleString("es")}
          </p>
        </>
      ) : null}
      <CompliancePolicyDialog open={policyOpen} onOpenChange={setPolicyOpen} />
    </div>
  );
}

function AnalyticsScopeSummary({
  courseId,
  courseTitle,
  branchId,
  branchName,
  from,
  to,
  onClear,
}: {
  courseId: string;
  courseTitle?: string;
  branchId: string;
  branchName?: string;
  from: string;
  to: string;
  onClear: () => void;
}) {
  const filtered = Boolean(courseId || branchId || from || to);
  return <div className="flex flex-col gap-3 rounded-2xl border border-border-default bg-surface-section px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between" aria-live="polite"><div className="flex flex-wrap items-center gap-2"><span className="font-medium">Alcance: {filtered ? "filtros seleccionados" : "toda la organización"}</span>{courseId ? <Badge variant="secondary">Curso: {courseTitle ?? "Seleccionado"}</Badge> : null}{branchId ? <Badge variant="secondary">Sucursal: {branchName ?? "Seleccionada"}</Badge> : null}{from ? <Badge variant="secondary">Desde: {from}</Badge> : null}{to ? <Badge variant="secondary">Hasta: {to}</Badge> : null}</div>{filtered ? <Button type="button" variant="ghost" size="sm" className="self-start sm:self-auto" onClick={onClear}><X className="size-4" />Restablecer</Button> : <span className="text-text-secondary">Sin filtros aplicados</span>}</div>;
}

function MetricGrid({ data }: { data: TrainingAnalyticsDto }) {
  const metrics = [
    { label: "Participantes", value: data.summary.uniqueLearners, icon: Users },
    { label: "Finalización", value: `${data.summary.completionRate}%`, icon: CheckCircle2 },
    { label: "Aprobación", value: `${data.summary.passRate}%`, icon: BarChart3 },
    { label: "Vencidos", value: data.summary.overdue, icon: AlertTriangle },
  ];
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <Card key={metric.label}><CardContent className="py-5"><metric.icon className="size-5 text-brand" /><p className="mt-4 text-sm text-muted-foreground">{metric.label}</p><strong className="text-3xl">{metric.value}</strong></CardContent></Card>)}</div>;
}

function CoursePerformance({ data }: { data: TrainingAnalyticsDto }) {
  return <Card><CardHeader><CardTitle>Rendimiento por curso</CardTitle></CardHeader><CardContent>{data.byCourse.length ? <><div className="grid gap-3 md:hidden">{data.byCourse.map((course) => <article key={course.courseId} className="rounded-xl border p-3"><p className="font-semibold">{course.title}</p><dl className="mt-3 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-muted-foreground">Asignados</dt><dd>{course.assigned}</dd></div><div><dt className="text-muted-foreground">Completados</dt><dd>{course.completed}</dd></div><div><dt className="text-muted-foreground">Progreso</dt><dd>{course.averageProgress}%</dd></div><div><dt className="text-muted-foreground">Aprobación</dt><dd>{course.passRate}%</dd></div><div><dt className="text-muted-foreground">Vencidos</dt><dd>{course.overdue}</dd></div></dl></article>)}</div><div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[720px] text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-3">Curso</th><th>Asignados</th><th>Completados</th><th>Progreso</th><th>Aprobación</th><th>Vencidos</th></tr></thead><tbody>{data.byCourse.map((course) => <tr key={course.courseId} className="border-b last:border-0"><td className="p-3 font-medium">{course.title}</td><td>{course.assigned}</td><td>{course.completed}</td><td>{course.averageProgress}%</td><td>{course.passRate}%</td><td>{course.overdue}</td></tr>)}</tbody></table></div></> : <p className="py-8 text-center text-muted-foreground">No hay datos para el periodo seleccionado.</p>}</CardContent></Card>;
}

function EffectivenessPanel({
  filters,
}: {
  filters: { courseId?: string; branchId?: string; from?: string; to?: string };
}) {
  const [createContext, setCreateContext] = useState<{
    courseId: string;
    courseTitle: string;
    signal?: TrainingEffectivenessSignalDto;
  } | null>(null);
  const effectiveness = useQuery({
    queryKey: ["training-effectiveness", filters],
    queryFn: () => fetchTrainingEffectiveness(filters),
  });
  const improvements = useQuery({
    queryKey: ["training-improvements", filters.courseId],
    queryFn: () => fetchTrainingImprovements({ courseId: filters.courseId }),
  });
  if (effectiveness.isLoading) return <AsyncState state="loading" title="Midiendo efectividad" />;
  if (effectiveness.isError) {
    return <AsyncState state="error" title="No fue posible medir la efectividad" description={getApiErrorMessage(effectiveness.error, "Reintenta la consulta.")} onRetry={() => effectiveness.refetch()} />;
  }
  if (!effectiveness.data) return null;
  const data = effectiveness.data;
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Mejora continua</p>
          <h2 className="mt-1 text-2xl font-semibold">Efectividad del aprendizaje</h2>
          <p className="text-sm text-muted-foreground">Combina adopción, finalización, evaluación, vencimiento y evidencia del piloto.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant={data.summary.criticalSignals ? "destructive" : "success"}>{data.summary.criticalSignals} críticas</Badge>
          <Badge variant="secondary">{data.summary.openSignals} señales</Badge>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <EffectivenessMetric icon={Activity} label="Salud promedio" value={`${data.summary.averageHealthScore}/100`} />
        <EffectivenessMetric icon={Target} label="Cursos medidos" value={data.summary.courses} />
        <EffectivenessMetric icon={AlertTriangle} label="Señales abiertas" value={data.summary.openSignals} />
        <EffectivenessMetric icon={Lightbulb} label="Mejoras registradas" value={improvements.data?.items.length ?? 0} />
      </div>
      <div className="grid gap-4">
        {data.courses.map((course) => (
          <CourseEffectivenessCard
            key={course.courseId}
            course={course}
            onCreate={(signal) => setCreateContext({ courseId: course.courseId, courseTitle: course.title, signal })}
          />
        ))}
      </div>
      <ImprovementBacklog
        items={improvements.data?.items ?? []}
        loading={improvements.isLoading}
        onCreate={() => {
          const course = data.courses[0];
          if (course) setCreateContext({ courseId: course.courseId, courseTitle: course.title });
        }}
      />
      <CreateImprovementDialog
        context={createContext}
        open={Boolean(createContext)}
        onOpenChange={(open) => !open && setCreateContext(null)}
      />
    </section>
  );
}

function EffectivenessMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
}) {
  return <Card><CardContent className="py-5"><Icon className="size-5 text-brand" /><p className="mt-3 text-sm text-muted-foreground">{label}</p><strong className="text-3xl">{value}</strong></CardContent></Card>;
}

function CourseEffectivenessCard({
  course,
  onCreate,
}: {
  course: TrainingEffectivenessDto["courses"][number];
  onCreate: (signal: TrainingEffectivenessSignalDto) => void;
}) {
  const healthTone = course.healthScore >= 80 ? "text-emerald-600" : course.healthScore >= 60 ? "text-amber-600" : "text-red-600";
  return (
    <Card>
      <CardHeader className="border-b bg-muted/25">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><CardTitle>{course.title}</CardTitle><p className="mt-1 text-sm text-muted-foreground">Versión {course.version} · confianza {course.confidence === "HIGH" ? "alta" : course.confidence === "MEDIUM" ? "media" : "baja"}</p></div>
          <div className="text-right"><p className={`text-4xl font-bold ${healthTone}`}>{course.healthScore}</p><p className="text-xs text-muted-foreground">índice de salud</p></div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 py-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {[
            ["Inicio", `${course.metrics.startRate}%`],
            ["Finalización", `${course.metrics.completionRate}%`],
            ["Aprobación", `${course.metrics.passRate}%`],
            ["Vencimiento", `${course.metrics.overdueRate}%`],
            ["Duración", course.metrics.averageCompletionDays === null ? "—" : `${course.metrics.averageCompletionDays} d`],
            ["Piloto", course.metrics.averagePilotRating === null ? "—" : `${course.metrics.averagePilotRating}/5`],
          ].map(([label, value]) => <div key={label} className="rounded-xl bg-muted/60 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value}</p></div>)}
        </div>
        {course.signals.length ? (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Señales que requieren atención</h3>
            {course.signals.map((signal) => (
              <div key={signal.code} className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 md:flex-row md:items-center">
                <AlertTriangle className={signal.severity === "CRITICAL" ? "size-5 shrink-0 text-red-600" : "size-5 shrink-0 text-amber-600"} />
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong>{signal.title}</strong><Badge variant={signal.severity === "CRITICAL" ? "destructive" : "secondary"}>{signal.severity}</Badge></div><p className="text-sm text-muted-foreground">{signal.detail} {signal.recommendation}</p></div>
                <Button size="sm" variant="secondary" onClick={() => onCreate(signal)}><Lightbulb className="size-4" />Crear mejora</Button>
              </div>
            ))}
          </div>
        ) : <p className="rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-700">No se detectaron señales con evidencia suficiente para este periodo.</p>}
        {course.lessonJourney.length ? (
          <div>
            <h3 className="mb-3 text-sm font-semibold">Recorrido por lección</h3>
            <div className="grid gap-2">
              {course.lessonJourney.map((lesson) => (
                <div key={lesson.lessonId} className="grid gap-2 rounded-lg border p-3 md:grid-cols-[minmax(180px,1fr)_minmax(180px,2fr)_90px] md:items-center">
                  <span className="truncate text-sm font-medium">{lesson.title}</span>
                  <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${lesson.completionRate}%` }} /></div>
                  <span className={lesson.dropOffRate >= 20 ? "text-sm font-semibold text-red-600" : "text-sm text-muted-foreground"}>{lesson.completionRate}% · -{lesson.dropOffRate}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

const improvementStatusLabels: Record<TrainingImprovementStatus, string> = {
  OPEN: "Abierta",
  PLANNED: "Planificada",
  IN_PROGRESS: "En ejecución",
  VALIDATING: "Validando",
  COMPLETED: "Completada",
  DISMISSED: "Descartada",
};

function ImprovementBacklog({
  items,
  loading,
  onCreate,
}: {
  items: TrainingCourseImprovementDto[];
  loading: boolean;
  onCreate: () => void;
}) {
  const queryClient = useQueryClient();
  const [completing, setCompleting] = useState<TrainingCourseImprovementDto | null>(null);
  const mutation = useMutation({
    mutationFn: ({ id, status, outcomeNotes }: { id: string; status: TrainingImprovementStatus; outcomeNotes?: string }) =>
      updateTrainingImprovement(id, { status, outcomeNotes }),
    onSuccess: async () => {
      toast.success("Iniciativa actualizada");
      setCompleting(null);
      await queryClient.invalidateQueries({ queryKey: ["training-improvements"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible actualizar la iniciativa.")),
  });
  const next: Partial<Record<TrainingImprovementStatus, { status: TrainingImprovementStatus; label: string }>> = {
    OPEN: { status: "PLANNED", label: "Planificar" },
    PLANNED: { status: "IN_PROGRESS", label: "Iniciar" },
    IN_PROGRESS: { status: "VALIDATING", label: "Validar" },
    DISMISSED: { status: "OPEN", label: "Reabrir" },
  };
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3"><div><CardTitle>Pendientes de mejora</CardTitle><p className="text-sm text-muted-foreground">Convierte evidencia en acciones con responsable y criterio de cierre.</p></div><Button size="sm" onClick={onCreate}><Lightbulb className="size-4" />Nueva mejora</Button></div>
      </CardHeader>
      <CardContent>
        {loading ? <AsyncState state="loading" /> : items.length ? (
          <div className="space-y-3">
            {items.map((item) => {
              const nextAction = next[item.status];
              return (
                <div key={item.id} className="grid gap-3 rounded-xl border p-4 lg:grid-cols-[minmax(0,1fr)_180px_auto] lg:items-center">
                  <div><div className="flex flex-wrap items-center gap-2"><strong>{item.title}</strong><Badge variant={item.priority === "CRITICAL" ? "destructive" : "secondary"}>{item.priority}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{item.course.title} · {item.owner ? `${item.owner.firstName} ${item.owner.lastName}` : "Sin responsable"}{item.dueAt ? ` · vence ${new Date(item.dueAt).toLocaleDateString("es")}` : ""}</p></div>
                  <Badge variant={item.status === "COMPLETED" ? "success" : "secondary"}>{improvementStatusLabels[item.status]}</Badge>
                  <div className="flex gap-2">
                    {nextAction ? <Button size="sm" variant="secondary" disabled={mutation.isPending} onClick={() => mutation.mutate({ id: item.id, status: nextAction.status })}>{nextAction.label}</Button> : null}
                    {item.status === "VALIDATING" ? <Button size="sm" disabled={mutation.isPending} onClick={() => setCompleting(item)}>Cerrar</Button> : null}
                    {["OPEN", "PLANNED"].includes(item.status) ? <Button size="sm" variant="ghost" disabled={mutation.isPending} onClick={() => mutation.mutate({ id: item.id, status: "DISMISSED" })}>Descartar</Button> : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : <p className="py-8 text-center text-sm text-muted-foreground">No hay iniciativas registradas para este filtro.</p>}
      </CardContent>
      <CompleteImprovementDialog key={completing?.id ?? "none"} improvement={completing} open={Boolean(completing)} onOpenChange={(open) => !open && setCompleting(null)} onComplete={(outcomeNotes) => completing && mutation.mutate({ id: completing.id, status: "COMPLETED", outcomeNotes })} pending={mutation.isPending} />
    </Card>
  );
}

function CreateImprovementDialog({
  context,
  open,
  onOpenChange,
}: {
  context: { courseId: string; courseTitle: string; signal?: TrainingEffectivenessSignalDto } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const users = useQuery({ queryKey: ["training-improvement-users"], queryFn: fetchUsers, enabled: open });
  const mutation = useMutation({
    mutationFn: createTrainingImprovement,
    onSuccess: async () => {
      toast.success("Mejora añadida a los pendientes");
      onOpenChange(false);
      await queryClient.invalidateQueries({ queryKey: ["training-improvements"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible crear la mejora.")),
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!context) return;
    const data = new FormData(event.currentTarget);
    const dueAt = String(data.get("dueAt") || "");
    mutation.mutate({
      courseId: context.courseId,
      title: String(data.get("title")),
      description: String(data.get("description") || "") || undefined,
      ownerId: String(data.get("ownerId") || "") || undefined,
      priority: String(data.get("priority")) as TrainingImprovementPriority,
      source: context.signal ? "ANALYTICS" : "MANUAL",
      signalCode: context.signal?.code,
      evidence: context.signal?.evidence,
      dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
    });
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Crear iniciativa de mejora</DialogTitle><DialogDescription>{context?.courseTitle}{context?.signal ? ` · basada en ${context.signal.title}` : ""}</DialogDescription></DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div><Label htmlFor="improvement-title">Título</Label><Input id="improvement-title" name="title" maxLength={180} defaultValue={context?.signal ? `Corregir: ${context.signal.title}` : ""} required /></div>
          <div><Label htmlFor="improvement-description">Descripción y criterio esperado</Label><textarea id="improvement-description" name="description" className="min-h-24 w-full rounded-xl border bg-background p-3 text-sm" defaultValue={context?.signal?.recommendation ?? ""} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Prioridad</Label><Select name="priority" defaultValue={context?.signal?.severity === "CRITICAL" ? "CRITICAL" : context?.signal ? "HIGH" : "MEDIUM"}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="LOW">Baja</SelectItem><SelectItem value="MEDIUM">Media</SelectItem><SelectItem value="HIGH">Alta</SelectItem><SelectItem value="CRITICAL">Crítica</SelectItem></SelectContent></Select></div>
            <div><Label>Responsable</Label><Select name="ownerId"><SelectTrigger><SelectValue placeholder="Asignar después" /></SelectTrigger><SelectContent>{users.data?.map((user) => <SelectItem key={user.id} value={user.id}>{user.fullName}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div><Label htmlFor="improvement-due">Fecha objetivo</Label><Input id="improvement-due" name="dueAt" type="date" /></div>
          <Button className="w-full" disabled={mutation.isPending}>{mutation.isPending ? "Creando…" : "Añadir a pendientes"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CompleteImprovementDialog({
  improvement,
  open,
  onOpenChange,
  onComplete,
  pending,
}: {
  improvement: TrainingCourseImprovementDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (outcomeNotes: string) => void;
  pending: boolean;
}) {
  const [notes, setNotes] = useState("");
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Cerrar mejora</DialogTitle><DialogDescription>{improvement?.title}. Documenta el resultado para conservar evidencia verificable.</DialogDescription></DialogHeader><div><Label htmlFor="outcome-notes">Resultado observado</Label><textarea id="outcome-notes" className="min-h-28 w-full rounded-xl border bg-background p-3 text-sm" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Describe qué cambió y cómo se verificó…" /></div><Button disabled={notes.trim().length < 10 || pending} onClick={() => onComplete(notes)}>{pending ? "Cerrando…" : "Confirmar cierre"}</Button></DialogContent></Dialog>;
}

function ComplianceMatrix({ data }: { data: TrainingAnalyticsDto }) {
  return <Card><CardHeader><CardTitle>Matriz de cumplimiento</CardTitle></CardHeader><CardContent><div className="grid gap-3">{data.compliance.slice(0, 100).map((row) => <div key={row.assignmentId} className="grid gap-3 rounded-xl border p-4 md:grid-cols-[1.2fr_1fr_160px_100px] md:items-center"><div><strong>{row.learnerName}</strong><p className="text-xs text-muted-foreground">{row.email} · {row.branch}</p></div><div><p className="font-medium">{row.courseTitle}</p><p className="text-xs text-muted-foreground">{row.dueAt ? `Vence ${new Date(row.dueAt).toLocaleDateString("es")}` : "Sin vencimiento"}</p></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${row.progressPercent}%` }} /></div><Badge variant={row.status === "COMPLETED" ? "success" : row.status === "OVERDUE" ? "destructive" : "secondary"}>{statusLabels[row.status]}</Badge></div>)}</div></CardContent></Card>;
}

function CompliancePolicyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const courses = useQuery({ queryKey: ["training-policy-courses"], queryFn: () => fetchTrainingCourses({ pageSize: 100 }) });
  const policies = useQuery({ queryKey: ["training-compliance-policies"], queryFn: fetchTrainingCompliancePolicies, enabled: open });
  const mutation = useMutation({
    mutationFn: upsertTrainingCompliancePolicy,
    onSuccess: () => {
      toast.success("Política de cumplimiento guardada");
      queryClient.invalidateQueries({ queryKey: ["training-compliance-policies"] });
      onOpenChange(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo guardar la política")),
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    mutation.mutate({
      courseId: String(data.get("courseId")),
      dueDays: Number(data.get("dueDays")),
      renewalDays: Number(data.get("renewalDays")) || undefined,
      reminderDays: String(data.get("reminderDays") || "7,2").split(",").map(Number).filter((value) => Number.isInteger(value) && value >= 0),
      isActive: true,
    });
  }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Política de cumplimiento</DialogTitle><DialogDescription>Define la fecha límite, renovación y anticipación de recordatorios para un curso obligatorio.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={submit}><div><Label>Curso</Label><Select name="courseId" required><SelectTrigger><SelectValue placeholder="Selecciona un curso" /></SelectTrigger><SelectContent>{courses.data?.items.map((course) => <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}</SelectContent></Select></div><div className="grid grid-cols-2 gap-3"><div><Label htmlFor="dueDays">Días para completar</Label><Input id="dueDays" name="dueDays" type="number" min="1" defaultValue="30" required /></div><div><Label htmlFor="renewalDays">Renovar cada</Label><Input id="renewalDays" name="renewalDays" type="number" min="1" placeholder="365 días" /></div></div><div><Label htmlFor="reminderDays">Recordar antes (días)</Label><Input id="reminderDays" name="reminderDays" defaultValue="7,2" /><p className="mt-1 text-xs text-muted-foreground">Separa varios valores con comas.</p></div>{policies.data?.items.length ? <p className="text-xs text-muted-foreground">{policies.data.items.length} políticas configuradas actualmente.</p> : null}<Button className="w-full" disabled={mutation.isPending}>Guardar política</Button></form></DialogContent></Dialog>;
}

function exportCompliance(data: TrainingAnalyticsDto) {
  const header = ["Participante", "Correo", "Sucursal", "Curso", "Estado", "Progreso", "Vencimiento"];
  const rows = data.compliance.map((row) => [row.learnerName, row.email, row.branch, row.courseTitle, statusLabels[row.status], `${row.progressPercent}%`, row.dueAt ?? ""]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `cumplimiento-formativo-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}
