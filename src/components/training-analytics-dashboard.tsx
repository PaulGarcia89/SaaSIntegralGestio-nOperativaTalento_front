"use client";

import { useUiText } from "@/components/ui-copy";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Download,
  Lightbulb,
  Settings2,
  X,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  DataView,
  EmptyState,
  ErrorState,
  InlineNote,
  Metric,
  MetricRow,
  PageHeader,
  PageSection,
  SkeletonRows,
  StatusBadge,
  type DataColumn,
} from "@/components/system";
import {
  formatDateTime,
  progressStatusTone,
  severityLabel,
  severityTone,
} from "@/lib/training-labels";
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
  const uiText = useUiText();
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
        eyebrow={uiText("Aprendizaje")}
        title={uiText("Analítica y cumplimiento")}
        description={uiText("Prioriza vencimientos, mide resultados y conserva evidencia operativa de la formación.")}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setPolicyOpen(true)}>
              <Settings2 />{uiText("Políticas")}</Button>
            <Button
              onClick={() => analytics.data && exportCompliance(analytics.data)}
              disabled={!analytics.data}
            >
              <Download />{uiText("Exportar CSV")}</Button>
          </div>
        }
      />

      <Card>
        <CardContent className="grid gap-3 py-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <Label htmlFor="analytics-course">{uiText("Curso")}</Label>
            <Select value={courseId || "ALL"} onValueChange={(value) => setCourseId(value === "ALL" ? "" : value)}>
              <SelectTrigger id="analytics-course"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="ALL">{uiText("Todos")}</SelectItem>{courses.data?.items.map((course) => <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="analytics-branch">{uiText("Sucursal")}</Label>
            <Select value={branchId || "ALL"} onValueChange={(value) => setBranchId(value === "ALL" ? "" : value)}>
              <SelectTrigger id="analytics-branch"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="ALL">{uiText("Todas")}</SelectItem>{branches.data?.map((branch) => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label htmlFor="analytics-from">{uiText("Desde")}</Label><Input id="analytics-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></div>
          <div><Label htmlFor="analytics-to">{uiText("Hasta")}</Label><Input id="analytics-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} /></div>
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

      {analytics.isLoading ? <SkeletonRows rows={6} label={uiText("Calculando los indicadores")} /> : null}
      {analytics.isError ? <ErrorState title={uiText("No fue posible calcular la analítica")} detail={getApiErrorMessage(analytics.error, uiText("Reintenta la consulta para continuar."))} onRetry={() => void analytics.refetch()} /> : null}
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
            {uiText("Fuente: asignaciones, progreso e intentos reales · Actualizado")}{new Date(analytics.data.generatedAt).toLocaleString(uiText.locale)}
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
  const uiText = useUiText();
  const filtered = Boolean(courseId || branchId || from || to);
  return <div className="flex flex-col gap-3 rounded-2xl border border-border-default bg-surface-section px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between" aria-live="polite"><div className="flex flex-wrap items-center gap-2"><span className="font-medium">{uiText("Alcance: ")}{filtered ? "filtros seleccionados" : "toda la organización"}</span>{courseId ? <Badge variant="secondary">{uiText("Curso: ")}{courseTitle ?? "Seleccionado"}</Badge> : null}{branchId ? <Badge variant="secondary">{uiText("Sucursal: ")}{branchName ?? "Seleccionada"}</Badge> : null}{from ? <Badge variant="secondary">{uiText("Desde: ")}{from}</Badge> : null}{to ? <Badge variant="secondary">{uiText("Hasta: ")}{to}</Badge> : null}</div>{filtered ? <Button type="button" variant="ghost" size="sm" className="self-start sm:self-auto" onClick={onClear}><X className="size-4" />{uiText("Restablecer")}</Button> : <span className="text-text-secondary">{uiText("Sin filtros aplicados")}</span>}</div>;
}

function MetricGrid({ data }: { data: TrainingAnalyticsDto }) {
  const uiText = useUiText();
  return (
    <MetricRow>
      <Metric label={uiText("Participantes")} value={String(data.summary.uniqueLearners)} />
      <Metric label={uiText("Finalización")} value={`${data.summary.completionRate} %`} />
      <Metric label={uiText("Aprobación")} value={`${data.summary.passRate} %`} />
      <Metric
        label={uiText("Vencidos")}
        value={String(data.summary.overdue)}
        tone={data.summary.overdue > 0 ? "danger" : undefined}
      />
    </MetricRow>
  );
}

function CoursePerformance({ data }: { data: TrainingAnalyticsDto }) {
  const uiText = useUiText();
  const columns: Array<DataColumn<TrainingAnalyticsDto["byCourse"][number]>> = [
    { key: "title", header: uiText("Curso"), priority: "identity", render: (row) => row.title, sortValue: (row) => row.title },
    { key: "assigned", header: uiText("Asignados"), priority: "secondary", numeric: true, render: (row) => row.assigned, sortValue: (row) => row.assigned },
    { key: "completed", header: uiText("Completados"), priority: "primary", numeric: true, render: (row) => row.completed, sortValue: (row) => row.completed },
    { key: "progress", header: uiText("Progreso medio"), priority: "secondary", numeric: true, render: (row) => `${row.averageProgress} %`, sortValue: (row) => row.averageProgress },
    { key: "pass", header: uiText("Aprobación"), priority: "secondary", numeric: true, render: (row) => `${row.passRate} %`, sortValue: (row) => row.passRate },
    {
      key: "overdue",
      header: uiText("Vencidos"),
      priority: "primary",
      numeric: true,
      // El vencimiento es lo que obliga a actuar: se destaca cuando lo hay.
      render: (row) => (row.overdue > 0 ? <span className="font-medium text-status-danger">{row.overdue}</span> : row.overdue),
      sortValue: (row) => row.overdue,
    },
  ];

  return (
    <PageSection title={uiText("Rendimiento por curso")} description={uiText("Ordena por cualquier columna para encontrar dónde se atasca la formación.")}>
      <DataView
        rows={data.byCourse}
        columns={columns}
        getKey={(row) => row.courseId}
        caption={uiText("Rendimiento por curso")}
      />
    </PageSection>
  );
}

function EffectivenessPanel({
  filters,
}: {
  filters: { courseId?: string; branchId?: string; from?: string; to?: string };
}) {
  const uiText = useUiText();
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
  if (effectiveness.isLoading) return <SkeletonRows rows={5} label={uiText("Midiendo la efectividad")} />;
  if (effectiveness.isError) {
    return <ErrorState title={uiText("No fue posible medir la efectividad")} detail={getApiErrorMessage(effectiveness.error, uiText("Reintenta la consulta para continuar."))} onRetry={() => void effectiveness.refetch()} />;
  }
  if (!effectiveness.data) return null;
  const data = effectiveness.data;
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">{uiText("Mejora continua")}</p>
          <h2 className="mt-1 text-2xl font-semibold">{uiText("Efectividad del aprendizaje")}</h2>
          <p className="text-sm text-muted-foreground">{uiText("Combina adopción, finalización, evaluación, vencimiento y evidencia del piloto.")}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant={data.summary.criticalSignals ? "destructive" : "success"}>{data.summary.criticalSignals} {uiText(" críticas")}</Badge>
          <Badge variant="secondary">{data.summary.openSignals} {uiText(" señales")}</Badge>
        </div>
      </div>
      <MetricRow>
        <Metric label={uiText("Salud promedio")} value={`${data.summary.averageHealthScore}`} detail="sobre 100" />
        <Metric label={uiText("Cursos medidos")} value={String(data.summary.courses)} />
        <Metric
          label={uiText("Señales abiertas")}
          value={String(data.summary.openSignals)}
          tone={data.summary.openSignals > 0 ? "warning" : undefined}
        />
        <Metric label={uiText("Mejoras registradas")} value={String(improvements.data?.items.length ?? 0)} />
      </MetricRow>
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


function CourseEffectivenessCard({
  course,
  onCreate,
}: {
  course: TrainingEffectivenessDto["courses"][number];
  onCreate: (signal: TrainingEffectivenessSignalDto) => void;
}) {
  const uiText = useUiText();
  const healthTone = course.healthScore >= 80 ? "text-status-success" : course.healthScore >= 60 ? "text-status-warning" : "text-status-danger";
  return (
    <Card>
      <CardHeader className="border-b bg-muted/25">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><CardTitle>{course.title}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{uiText("Versión ")}{course.version} {uiText(" · confianza ")}{course.confidence === "HIGH" ? "alta" : course.confidence === "MEDIUM" ? "media" : "baja"}</p></div>
          <div className="text-right"><p className={`font-mono text-4xl font-semibold tabular-figures ${healthTone}`}>{course.healthScore}</p><p className="text-xs text-muted-foreground">{uiText("índice de salud sobre 100")}</p></div>
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
            <h3 className="text-sm font-semibold">{uiText("Señales que requieren atención")}</h3>
            {course.signals.map((signal) => (
              <div key={signal.code} className={`flex flex-col gap-3 rounded-md border p-4 md:flex-row md:items-center ${signal.severity === "CRITICAL" ? "border-status-danger/40 bg-status-danger/5" : "border-status-warning/40 bg-status-warning/5"}`}>
                <AlertTriangle className={signal.severity === "CRITICAL" ? "size-5 shrink-0 text-status-danger" : "size-5 shrink-0 text-status-warning"} aria-hidden="true" />
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong>{signal.title}</strong><StatusBadge size="sm" tone={severityTone(signal.severity)} label={`Severidad ${severityLabel(signal.severity).toLocaleLowerCase("es")}`} /></div><p className="text-sm text-muted-foreground">{signal.detail} {signal.recommendation}</p></div>
                <Button size="sm" variant="secondary" onClick={() => onCreate(signal)}><Lightbulb className="size-4" />{uiText("Crear mejora")}</Button>
              </div>
            ))}
          </div>
        ) : <InlineNote tone="success" title={uiText("Sin señales de alerta")}>{uiText("No se detectaron señales con evidencia suficiente en este periodo.")}</InlineNote>}
        {course.lessonJourney.length ? (
          <div>
            <h3 className="mb-3 text-sm font-semibold">{uiText("Recorrido por lección")}</h3>
            <div className="grid gap-2">
              {course.lessonJourney.map((lesson) => (
                <div key={lesson.lessonId} className="grid gap-2 rounded-lg border p-3 md:grid-cols-[minmax(180px,1fr)_minmax(180px,2fr)_90px] md:items-center">
                  <span className="truncate text-sm font-medium">{lesson.title}</span>
                  <div
                    className="h-2 overflow-hidden rounded-full bg-surface-3"
                    role="progressbar"
                    aria-valuenow={lesson.completionRate}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Finalización de ${lesson.title}`}
                  >
                    <div className="h-full rounded-full bg-accent-fill" style={{ width: `${lesson.completionRate}%` }} />
                  </div>
                  <span className={lesson.dropOffRate >= 20 ? "font-mono text-sm font-semibold tabular-figures text-status-danger" : "font-mono text-sm tabular-figures text-muted-foreground"}>{lesson.completionRate} {uiText(" % · abandono ")}{lesson.dropOffRate} %</span>
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
  const uiText = useUiText();
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
    OPEN: { status: "PLANNED", label: uiText("Planificar") },
    PLANNED: { status: "IN_PROGRESS", label: uiText("Iniciar") },
    IN_PROGRESS: { status: "VALIDATING", label: uiText("Validar") },
    DISMISSED: { status: "OPEN", label: uiText("Reabrir") },
  };
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3"><div><CardTitle>{uiText("Pendientes de mejora")}</CardTitle><p className="text-sm text-muted-foreground">{uiText("Convierte evidencia en acciones con responsable y criterio de cierre.")}</p></div><Button size="sm" onClick={onCreate}><Lightbulb className="size-4" />{uiText("Nueva mejora")}</Button></div>
      </CardHeader>
      <CardContent>
        {loading ? <SkeletonRows rows={4} label={uiText("Cargando las iniciativas de mejora")} /> : items.length ? (
          <div className="space-y-3">
            {items.map((item) => {
              const nextAction = next[item.status];
              return (
                <div key={item.id} className="grid gap-3 rounded-xl border p-4 lg:grid-cols-[minmax(0,1fr)_180px_auto] lg:items-center">
                  <div><div className="flex flex-wrap items-center gap-2"><strong>{item.title}</strong><StatusBadge size="sm" tone={severityTone(item.priority)} label={`Prioridad ${severityLabel(item.priority).toLocaleLowerCase("es")}`} /></div><p className="mt-1 text-sm text-muted-foreground">{item.course.title} · {item.owner ? `${item.owner.firstName} ${item.owner.lastName}` : uiText("Sin responsable")}{item.dueAt ? ` · vence ${new Date(item.dueAt).toLocaleDateString(uiText.locale)}` : ""}</p></div>
                  <Badge variant={item.status === "COMPLETED" ? "success" : "secondary"}>{improvementStatusLabels[item.status]}</Badge>
                  <div className="flex gap-2">
                    {nextAction ? <Button size="sm" variant="secondary" disabled={mutation.isPending} onClick={() => mutation.mutate({ id: item.id, status: nextAction.status })}>{nextAction.label}</Button> : null}
                    {item.status === "VALIDATING" ? <Button size="sm" disabled={mutation.isPending} onClick={() => setCompleting(item)}>{uiText("Cerrar")}</Button> : null}
                    {["OPEN", "PLANNED"].includes(item.status) ? <Button size="sm" variant="ghost" disabled={mutation.isPending} onClick={() => mutation.mutate({ id: item.id, status: "DISMISSED" })}>{uiText("Descartar")}</Button> : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : <EmptyState reason="no-matches" title={uiText("No hay iniciativas con estos filtros")} description={uiText("Cambia el curso, la sucursal o el periodo, o crea una mejora a partir de una señal.")} />}
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
  const uiText = useUiText();
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
        <DialogHeader><DialogTitle>{uiText("Crear iniciativa de mejora")}</DialogTitle><DialogDescription>{context?.courseTitle}{context?.signal ? ` · basada en ${context.signal.title}` : ""}</DialogDescription></DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div><Label htmlFor="improvement-title">{uiText("Título")}</Label><Input id="improvement-title" name="title" maxLength={180} defaultValue={context?.signal ? `Corregir: ${context.signal.title}` : ""} required /></div>
          <div><Label htmlFor="improvement-description">{uiText("Descripción y criterio esperado")}</Label><textarea id="improvement-description" name="description" className="field min-h-24" defaultValue={context?.signal?.recommendation ?? ""} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>{uiText("Prioridad")}</Label><Select name="priority" defaultValue={context?.signal?.severity === "CRITICAL" ? "CRITICAL" : context?.signal ? "HIGH" : "MEDIUM"}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="LOW">{uiText("Baja")}</SelectItem><SelectItem value="MEDIUM">{uiText("Media")}</SelectItem><SelectItem value="HIGH">{uiText("Alta")}</SelectItem><SelectItem value="CRITICAL">{uiText("Crítica")}</SelectItem></SelectContent></Select></div>
            <div><Label>{uiText("Responsable")}</Label><Select name="ownerId"><SelectTrigger><SelectValue placeholder={uiText("Asignar después")} /></SelectTrigger><SelectContent>{users.data?.map((user) => <SelectItem key={user.id} value={user.id}>{user.fullName}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div><Label htmlFor="improvement-due">{uiText("Fecha objetivo")}</Label><Input id="improvement-due" name="dueAt" type="date" /></div>
          <Button className="w-full" disabled={mutation.isPending}>{mutation.isPending ? uiText("Creando…") : "Añadir a pendientes"}</Button>
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
  const uiText = useUiText();
  const [notes, setNotes] = useState("");
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{uiText("Cerrar mejora")}</DialogTitle><DialogDescription>{improvement?.title}{uiText(". Documenta el resultado para conservar evidencia verificable.")}</DialogDescription></DialogHeader><div><Label htmlFor="outcome-notes">{uiText("Resultado observado")}</Label><textarea id="outcome-notes" className="field min-h-28" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={uiText("Describe qué cambió y cómo se verificó…")} /></div><Button disabled={notes.trim().length < 10} loading={pending} loadingLabel="Cerrando…" onClick={() => onComplete(notes)}>{"Confirmar cierre"}</Button></DialogContent></Dialog>;
}

const COMPLIANCE_LIMIT = 100;

function ComplianceMatrix({ data }: { data: TrainingAnalyticsDto }) {
  const uiText = useUiText();
  const shown = data.compliance.slice(0, COMPLIANCE_LIMIT);
  const truncated = data.compliance.length > COMPLIANCE_LIMIT;

  const columns: Array<DataColumn<TrainingAnalyticsDto["compliance"][number]>> = [
    {
      key: "learner",
      header: uiText("Persona"),
      priority: "identity",
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-1">{row.learnerName}</p>
          <p className="truncate text-2xs text-ink-3">{row.email} · {row.branch}</p>
        </div>
      ),
      sortValue: (row) => row.learnerName,
    },
    { key: "course", header: uiText("Curso"), priority: "secondary", render: (row) => row.courseTitle, sortValue: (row) => row.courseTitle },
    {
      key: "due",
      header: uiText("Vencimiento"),
      priority: "secondary",
      render: (row) => (row.dueAt ? formatDateTime(row.dueAt) : "Sin vencimiento"),
      sortValue: (row) => row.dueAt ?? "",
    },
    {
      key: "progress",
      header: uiText("Avance"),
      priority: "primary",
      numeric: true,
      render: (row) => <span className="font-mono tabular-figures">{row.progressPercent} %</span>,
      sortValue: (row) => row.progressPercent,
    },
    {
      key: "status",
      header: uiText("Estado"),
      priority: "primary",
      render: (row) => <StatusBadge size="sm" tone={progressStatusTone(row.status)} label={statusLabels[row.status]} />,
      sortValue: (row) => row.status,
    },
  ];

  return (
    <PageSection
      title={uiText("Matriz de cumplimiento")}
      description={
        truncated
          ? `Las primeras ${COMPLIANCE_LIMIT} asignaciones, de ${data.compliance.length}. Afina los filtros o exporta el CSV para verlas todas.`
          : "Cada asignación con su avance y su fecha límite."
      }
    >
      <DataView rows={shown} columns={columns} getKey={(row) => row.assignmentId} caption={uiText("Matriz de cumplimiento")} />
    </PageSection>
  );
}

function CompliancePolicyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const uiText = useUiText();
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
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{uiText("Política de cumplimiento")}</DialogTitle><DialogDescription>{uiText("Define la fecha límite, renovación y anticipación de recordatorios para un curso obligatorio.")}</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={submit}><div><Label>{uiText("Curso")}</Label><Select name="courseId" required><SelectTrigger><SelectValue placeholder={uiText("Selecciona un curso")} /></SelectTrigger><SelectContent>{courses.data?.items.map((course) => <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}</SelectContent></Select></div><div className="grid grid-cols-2 gap-3"><div><Label htmlFor="dueDays">{uiText("Días para completar")}</Label><Input id="dueDays" name="dueDays" type="number" min="1" defaultValue="30" required /></div><div><Label htmlFor="renewalDays">{uiText("Renovar cada")}</Label><Input id="renewalDays" name="renewalDays" type="number" min="1" placeholder={uiText("365 días")} /></div></div><div><Label htmlFor="reminderDays">{uiText("Recordar antes (días)")}</Label><Input id="reminderDays" name="reminderDays" defaultValue="7,2" /><p className="mt-1 text-xs text-muted-foreground">{uiText("Separa varios valores con comas.")}</p></div>{policies.data?.items.length ? <p className="text-xs text-muted-foreground">{policies.data.items.length} {uiText(" políticas configuradas actualmente.")}</p> : null}<Button className="w-full" disabled={mutation.isPending}>{uiText("Guardar política")}</Button></form></DialogContent></Dialog>;
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
