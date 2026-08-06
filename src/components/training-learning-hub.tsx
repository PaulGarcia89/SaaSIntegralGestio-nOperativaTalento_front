"use client";

import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  PlayCircle,
  Plus,
  FlaskConical,
  Pause,
  Rocket,
  RotateCcw,
  Trash2,
  Users,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AsyncState } from "@/components/async-state";
import { PageHeader, Pagination } from "@/components/design-system";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createTrainingAssignments,
  createTrainingLaunch,
  deleteTrainingAssignment,
  deployTrainingLaunch,
  fetchBranches,
  fetchLearnerTrainingCourse,
  fetchMyTrainingAssignments,
  fetchMyTrainingPilots,
  fetchTrainingAdminAssignments,
  fetchTrainingCourses,
  fetchTrainingLaunches,
  fetchUsers,
  getApiErrorMessage,
  submitTrainingPilotFeedback,
  updateTrainingLaunchStatus,
  updateTrainingLessonProgress,
} from "@/lib/backend";
import type {
  LearnerTrainingCourseDto,
  TrainingAssignmentDto,
  TrainingCoursePilotDto,
  TrainingLaunchAudience,
  TrainingLaunchDto,
  TrainingLaunchStatus,
  TrainingProgressStatus,
} from "@/lib/contracts";
import { useAppStore } from "@/store/app-store";

const statusLabels: Record<TrainingProgressStatus, string> = {
  NOT_STARTED: "Pendiente",
  IN_PROGRESS: "En progreso",
  COMPLETED: "Completado",
  OVERDUE: "Vencido",
};

const roleTargets = [
  { id: "TENANT_ADMIN", label: "Administradores de empresa" },
  { id: "HR_MANAGER", label: "RR. HH." },
  { id: "INSTRUCTOR", label: "Instructores" },
  { id: "SUPERVISOR", label: "Supervisores" },
  { id: "EMPLOYEE", label: "Empleados" },
];

export function TrainingLearningHub() {
  const { can } = useAppStore();
  const [courseId, setCourseId] = useState<string | null>(null);
  const canManageAssignments = can("courses.assign");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Aprendizaje"
        title="Centro de aprendizaje"
        description="Continúa tus cursos y consulta claramente qué formación requiere tu atención."
      />
      <Tabs defaultValue="mine">
        <TabsList aria-label="Secciones de aprendizaje">
          <TabsTrigger value="mine">Mis cursos</TabsTrigger>
          {canManageAssignments ? (
            <TabsTrigger value="assignments">Asignaciones</TabsTrigger>
          ) : null}
          {canManageAssignments ? (
            <TabsTrigger value="launches">Lanzamientos</TabsTrigger>
          ) : null}
        </TabsList>
        <TabsContent value="mine" className="mt-6">
          <MyPilots onOpen={(id) => setCourseId(id)} />
          <MyCourses onOpen={(id) => setCourseId(id)} />
        </TabsContent>
        {canManageAssignments ? (
          <TabsContent value="assignments" className="mt-6">
            <AssignmentManagement />
          </TabsContent>
        ) : null}
        {canManageAssignments ? (
          <TabsContent value="launches" className="mt-6">
            <LaunchManagement />
          </TabsContent>
        ) : null}
      </Tabs>
      <CoursePlayer
        courseId={courseId}
        open={Boolean(courseId)}
        onOpenChange={(open) => !open && setCourseId(null)}
      />
    </div>
  );
}

function MyPilots({ onOpen }: { onOpen: (courseId: string) => void }) {
  const queryClient = useQueryClient();
  const [feedbackPilot, setFeedbackPilot] = useState<TrainingCoursePilotDto | null>(null);
  const query = useQuery({ queryKey: ["my-training-pilots"], queryFn: fetchMyTrainingPilots });
  const feedback = useMutation({
    mutationFn: ({ pilotId, input }: { pilotId: string; input: Parameters<typeof submitTrainingPilotFeedback>[1] }) =>
      submitTrainingPilotFeedback(pilotId, input),
    onSuccess: () => {
      toast.success("Gracias por compartir tu experiencia");
      setFeedbackPilot(null);
      queryClient.invalidateQueries({ queryKey: ["my-training-pilots"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible guardar tu retroalimentación.")),
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!feedbackPilot) return;
    const data = new FormData(event.currentTarget);
    feedback.mutate({
      pilotId: feedbackPilot.id,
      input: {
        rating: Number(data.get("rating")),
        clarityRating: Number(data.get("clarityRating")),
        relevanceRating: Number(data.get("relevanceRating")),
        comment: String(data.get("comment") || "") || undefined,
        blockingIssue: data.get("blockingIssue") === "on",
      },
    });
  }
  if (!query.data?.items.length) return null;
  return (
    <section className="mb-6 space-y-3">
      <div><h2 className="text-lg font-semibold">Pilotos activos</h2><p className="text-sm text-text-secondary">Prueba contenido antes de su publicación y reporta cualquier bloqueo.</p></div>
      <div className="grid gap-3 md:grid-cols-2">{query.data.items.map((pilot) => (
        <Card key={pilot.id} className="border-primary/30">
          <CardContent className="space-y-4 py-5">
            <div className="flex items-start gap-3"><FlaskConical className="size-6 text-primary" /><div><strong>{pilot.name}</strong><p className="text-sm text-text-secondary">{pilot.course?.title}</p></div></div>
            <div className="flex gap-2"><Button className="flex-1" onClick={() => pilot.course && onOpen(pilot.course.id)}><PlayCircle />Abrir piloto</Button><Button variant="secondary" onClick={() => setFeedbackPilot(pilot)}>Dar retroalimentación</Button></div>
          </CardContent>
        </Card>
      ))}</div>
      <Dialog open={Boolean(feedbackPilot)} onOpenChange={(open) => !open && setFeedbackPilot(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Retroalimentación del piloto</DialogTitle><DialogDescription>Tu evaluación define si esta versión puede publicarse.</DialogDescription></DialogHeader>
          <form className="space-y-4" onSubmit={submit}>
            <div className="grid gap-3 sm:grid-cols-3">{[["rating", "Valor general"], ["clarityRating", "Claridad"], ["relevanceRating", "Relevancia"]].map(([name, label]) => <div key={name}><Label>{label}</Label><Select name={name} defaultValue="5"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[5, 4, 3, 2, 1].map((value) => <SelectItem key={value} value={String(value)}>{value}/5</SelectItem>)}</SelectContent></Select></div>)}</div>
            <div><Label htmlFor="pilot-comment">Comentarios</Label><textarea id="pilot-comment" name="comment" className="min-h-28 w-full rounded-xl border border-border-default bg-surface-elevated p-3" /></div>
            <label className="flex items-center gap-3 rounded-xl bg-status-warning-soft p-3 text-sm"><input type="checkbox" name="blockingIssue" />Encontré un problema que bloquea la publicación</label>
            <Button className="w-full" disabled={feedback.isPending}>Enviar retroalimentación</Button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function MyCourses({ onOpen }: { onOpen: (courseId: string) => void }) {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const query = useQuery({
    queryKey: ["my-training-assignments", status, search],
    queryFn: () =>
      fetchMyTrainingAssignments({
        pageSize: 50,
        status: status || undefined,
        search: search || undefined,
      }),
  });

  if (query.isLoading) return <AsyncState state="loading" title="Cargando tus cursos" />;
  if (query.isError)
    return (
      <AsyncState
        state="error"
        title="No fue posible cargar tus cursos"
        description={getApiErrorMessage(query.error, "Reintenta para continuar.")}
        onRetry={() => query.refetch()}
      />
    );

  return (
    <div className="space-y-5">
      <div className="grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-[1fr_240px]">
        <div>
          <Label htmlFor="my-course-search">Buscar</Label>
          <Input
            id="my-course-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Curso, categoría o palabra clave"
          />
        </div>
        <div>
          <Label>Estado</Label>
          <Select value={status || "ALL"} onValueChange={(value) => setStatus(value === "ALL" ? "" : value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              {Object.entries(statusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {query.data?.items.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {query.data.items.map((assignment) => (
            <AssignmentCard key={assignment.id} assignment={assignment} onOpen={onOpen} />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <BookOpen className="mx-auto size-9 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">No tienes cursos en esta vista</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Cuando te asignen una formación aparecerá aquí con su fecha y progreso.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AssignmentCard({
  assignment,
  onOpen,
}: {
  assignment: TrainingAssignmentDto;
  onOpen: (courseId: string) => void;
}) {
  const effectiveStatus = assignment.effectiveStatus ?? assignment.status;
  return (
    <Card className="overflow-hidden">
      {assignment.coverImageUrl ? (
        <div
          className="h-36 bg-cover bg-center"
          style={{ backgroundImage: `url(${JSON.stringify(assignment.coverImageUrl)})` }}
          role="img"
          aria-label={`Portada de ${assignment.title}`}
        />
      ) : null}
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg">{assignment.title}</CardTitle>
          <Badge variant={effectiveStatus === "OVERDUE" ? "destructive" : effectiveStatus === "COMPLETED" ? "success" : "default"}>
            {statusLabels[effectiveStatus]}
          </Badge>
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{assignment.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span>Progreso</span><strong>{assignment.progressPercent}%</strong>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${assignment.progressPercent}%` }} />
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Clock3 className="size-4" />{assignment.estimatedMinutes} min</span>
          {assignment.dueAt ? <span className="inline-flex items-center gap-1"><CalendarDays className="size-4" />Vence {formatDate(assignment.dueAt)}</span> : null}
        </div>
        <Button
          className="w-full"
          disabled={!assignment.courseId}
          onClick={() => assignment.courseId && onOpen(assignment.courseId)}
        >
          <PlayCircle className="size-4" />
          {assignment.progressPercent > 0 ? "Continuar curso" : "Comenzar curso"}
        </Button>
      </CardContent>
    </Card>
  );
}

const launchStatusLabels: Record<TrainingLaunchStatus, string> = {
  DRAFT: "Borrador",
  SCHEDULED: "Programado",
  ACTIVE: "En despliegue",
  PAUSED: "Pausado",
  COMPLETED: "Distribuido",
  CANCELLED: "Cancelado",
};

function LaunchManagement() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const query = useQuery({
    queryKey: ["training-launches", page],
    queryFn: () => fetchTrainingLaunches({ page, pageSize: 12 }),
  });
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["training-launches"] });
    await queryClient.invalidateQueries({ queryKey: ["training-admin-assignments"] });
  };
  const deploy = useMutation({
    mutationFn: deployTrainingLaunch,
    onSuccess: async () => {
      toast.success("Lote distribuido correctamente");
      await refresh();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible distribuir el lote.")),
  });
  const status = useMutation({
    mutationFn: ({ id, next }: { id: string; next: TrainingLaunchStatus }) =>
      updateTrainingLaunchStatus(id, next),
    onSuccess: async () => {
      toast.success("Estado del lanzamiento actualizado");
      await refresh();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible actualizar el lanzamiento.")),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Lanzamientos controlados</h2>
          <p className="text-sm text-muted-foreground">
            Congela una audiencia, distribuye por lotes y mide adopción sin perder trazabilidad.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Rocket className="size-4" />Nueva campaña</Button>
      </div>
      {query.isLoading ? <AsyncState state="loading" title="Cargando lanzamientos" /> : null}
      {query.isError ? <AsyncState state="error" title="No fue posible cargar los lanzamientos" onRetry={() => query.refetch()} /> : null}
      {query.data?.items.length ? (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            {query.data.items.map((launch) => (
              <LaunchCard
                key={launch.id}
                launch={launch}
                pending={deploy.isPending || status.isPending}
                onDeploy={() => deploy.mutate(launch.id)}
                onStatus={(next) => status.mutate({ id: launch.id, next })}
              />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={query.data.totalPages}
            totalItems={query.data.total}
            pageSize={12}
            onPageChange={setPage}
          />
        </>
      ) : query.isSuccess ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Rocket className="mx-auto size-9 text-muted-foreground" />
            <p className="mt-3 font-medium">Todavía no hay campañas de lanzamiento</p>
            <p className="text-sm text-muted-foreground">Crea una para distribuir un curso publicado con control de alcance.</p>
          </CardContent>
        </Card>
      ) : null}
      <CreateLaunchDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function LaunchCard({
  launch,
  pending,
  onDeploy,
  onStatus,
}: {
  launch: TrainingLaunchDto;
  pending: boolean;
  onDeploy: () => void;
  onStatus: (status: TrainingLaunchStatus) => void;
}) {
  const rolloutPercent = launch.metrics.audience
    ? Math.round((launch.metrics.processed / launch.metrics.audience) * 100)
    : 0;
  const badgeVariant = launch.status === "CANCELLED"
    ? "destructive"
    : launch.status === "COMPLETED"
      ? "success"
      : "secondary";
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{launch.name}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {launch.course.title} · versión {launch.course.version}
            </p>
          </div>
          <Badge variant={badgeVariant}>{launchStatusLabels[launch.status]}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 py-5">
        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span>Despliegue de audiencia</span>
            <strong>{launch.metrics.processed}/{launch.metrics.audience}</strong>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${rolloutPercent}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Lotes de {launch.batchSize}{launch.rolloutIntervalHours ? ` cada ${launch.rolloutIntervalHours} h` : " sin espera"}
            {launch.nextBatchAt ? ` · próximo ${new Date(launch.nextBatchAt).toLocaleString("es")}` : ""}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Asignados", launch.metrics.assigned],
            ["Iniciaron", launch.metrics.started],
            ["Completaron", launch.metrics.completed],
            ["Vencidos", launch.metrics.overdue],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-muted/60 p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 text-xl font-semibold">{value}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Progreso promedio: <strong className="text-foreground">{launch.metrics.averageProgress}%</strong></p>
          <div className="flex flex-wrap gap-2">
            {launch.status === "DRAFT" || launch.status === "ACTIVE" ? (
              <Button size="sm" onClick={onDeploy} disabled={pending}>
                <Rocket className="size-4" />{launch.status === "DRAFT" ? "Iniciar" : "Siguiente lote"}
              </Button>
            ) : null}
            {launch.status === "ACTIVE" || launch.status === "SCHEDULED" ? (
              <Button size="sm" variant="secondary" onClick={() => onStatus("PAUSED")} disabled={pending}>
                <Pause className="size-4" />Pausar
              </Button>
            ) : null}
            {launch.status === "PAUSED" ? (
              <Button size="sm" onClick={() => onStatus("ACTIVE")} disabled={pending}>
                <RotateCcw className="size-4" />Reanudar
              </Button>
            ) : null}
            {["DRAFT", "SCHEDULED", "ACTIVE", "PAUSED"].includes(launch.status) ? (
              <Button size="sm" variant="ghost" onClick={() => onStatus("CANCELLED")} disabled={pending}>
                Cancelar
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateLaunchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const [courseId, setCourseId] = useState("");
  const [audience, setAudience] = useState<TrainingLaunchAudience>("USERS");
  const [targets, setTargets] = useState<string[]>([]);
  const courses = useQuery({ queryKey: ["launch-courses"], queryFn: () => fetchTrainingCourses({ status: "PUBLISHED", pageSize: 100 }), enabled: open });
  const users = useQuery({ queryKey: ["launch-users"], queryFn: fetchUsers, enabled: open && audience === "USERS" });
  const branches = useQuery({ queryKey: ["launch-branches"], queryFn: () => fetchBranches(), enabled: open && audience === "BRANCHES" });
  const mutation = useMutation({
    mutationFn: createTrainingLaunch,
    onSuccess: async (launch) => {
      toast.success(launch.status === "SCHEDULED" ? "Lanzamiento programado" : "Campaña preparada");
      onOpenChange(false);
      setCourseId("");
      setTargets([]);
      await queryClient.invalidateQueries({ queryKey: ["training-launches"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible crear la campaña.")),
  });
  const options =
    audience === "USERS" ? (users.data ?? []).map((item) => ({ id: item.id, label: `${item.fullName} · ${item.email}` })) :
    audience === "BRANCHES" ? (branches.data ?? []).map((item) => ({ id: item.id, label: item.name })) :
    audience === "ROLES" ? roleTargets : [];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const startAt = String(data.get("startAt") || "");
    const dueAt = String(data.get("dueAt") || "");
    mutation.mutate({
      name: String(data.get("name")),
      courseId,
      audience,
      targetIds: audience === "TENANT" ? undefined : targets,
      batchSize: Number(data.get("batchSize")) || 100,
      rolloutIntervalHours: Number(data.get("rolloutIntervalHours")) || 0,
      startAt: startAt ? new Date(startAt).toISOString() : undefined,
      dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
      isRequired: data.get("isRequired") === "on",
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nueva campaña de lanzamiento</DialogTitle>
          <DialogDescription>La audiencia se congela al crear la campaña para conservar una trazabilidad exacta.</DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={submit}>
          <div><Label htmlFor="launch-name">Nombre de campaña</Label><Input id="launch-name" name="name" maxLength={140} placeholder="Cumplimiento anual 2026" required /></div>
          <div><Label>Curso publicado</Label><Select value={courseId} onValueChange={setCourseId}><SelectTrigger><SelectValue placeholder="Selecciona un curso" /></SelectTrigger><SelectContent>{courses.data?.items.map((course) => <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Audiencia</Label><Select value={audience} onValueChange={(value) => { setAudience(value as TrainingLaunchAudience); setTargets([]); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="USERS">Personas específicas</SelectItem><SelectItem value="ROLES">Roles</SelectItem><SelectItem value="BRANCHES">Sucursales</SelectItem><SelectItem value="TENANT">Toda la empresa</SelectItem></SelectContent></Select></div>
          {audience !== "TENANT" ? (
            <fieldset className="max-h-48 space-y-1 overflow-y-auto rounded-xl border p-3">
              <legend className="px-1 text-sm font-medium">Destinatarios</legend>
              {options.map((option) => <label key={option.id} className="flex min-h-10 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-muted"><input type="checkbox" checked={targets.includes(option.id)} onChange={(event) => setTargets(event.target.checked ? [...targets, option.id] : targets.filter((id) => id !== option.id))}/><span>{option.label}</span></label>)}
            </fieldset>
          ) : <p className="rounded-xl bg-muted p-4 text-sm">Se congelará la lista actual de personas activas de la empresa.</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label htmlFor="launch-batch">Personas por lote</Label><Input id="launch-batch" name="batchSize" type="number" min={1} max={1000} defaultValue={100} /></div>
            <div><Label htmlFor="launch-interval">Intervalo entre lotes (horas)</Label><Input id="launch-interval" name="rolloutIntervalHours" type="number" min={0} max={720} defaultValue={0} /></div>
            <div><Label htmlFor="launch-start">Inicio programado</Label><Input id="launch-start" name="startAt" type="datetime-local" /></div>
            <div><Label htmlFor="launch-due">Fecha límite</Label><Input id="launch-due" name="dueAt" type="datetime-local" /></div>
          </div>
          <label className="flex items-center gap-3 rounded-xl border p-4"><input name="isRequired" type="checkbox" defaultChecked /><span><strong className="block text-sm">Formación obligatoria</strong><span className="text-xs text-muted-foreground">Se mostrará como requisito para toda la audiencia.</span></span></label>
          <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="submit" disabled={!courseId || (audience !== "TENANT" && !targets.length) || mutation.isPending}>{mutation.isPending ? "Preparando…" : "Crear campaña"}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AssignmentManagement() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const query = useQuery({
    queryKey: ["training-admin-assignments", page],
    queryFn: () => fetchTrainingAdminAssignments({ page, pageSize: 20 }),
  });
  const removeMutation = useMutation({
    mutationFn: deleteTrainingAssignment,
    onSuccess: async () => {
      toast.success("Asignación retirada");
      await queryClient.invalidateQueries({ queryKey: ["training-admin-assignments"] });
      await queryClient.invalidateQueries({ queryKey: ["my-training-assignments"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible retirar la asignación.")),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Seguimiento de asignaciones</h2>
          <p className="text-sm text-muted-foreground">Consulta avance, vencimientos y formación pendiente.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="size-4" />Asignar curso</Button>
      </div>

      {query.data?.summary ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ["Total", query.data.summary.total],
            ["Pendientes", query.data.summary.notStarted],
            ["En progreso", query.data.summary.inProgress],
            ["Completados", query.data.summary.completed],
            ["Vencidos", query.data.summary.overdue],
          ].map(([label, value]) => (
            <Card key={label}><CardContent className="p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></CardContent></Card>
          ))}
        </div>
      ) : null}

      {query.isLoading ? <AsyncState state="loading" /> : query.isError ? (
        <AsyncState state="error" onRetry={() => query.refetch()} />
      ) : query.data?.items.length ? (
        <>
          <div className="grid gap-3 md:hidden">{query.data.items.map((item) => <Card key={item.id}><CardContent className="space-y-3 p-4"><div><p className="font-semibold">{item.user ? `${item.user.firstName} ${item.user.lastName}` : "Usuario"}</p><p className="text-sm text-muted-foreground">{item.user?.email}</p></div><p className="text-sm font-medium">{item.course?.title ?? item.title}</p><div className="flex flex-wrap items-center justify-between gap-2"><Badge variant={(item.effectiveStatus ?? item.status) === "OVERDUE" ? "destructive" : "default"}>{statusLabels[item.effectiveStatus ?? item.status]}</Badge><span className="text-sm">{item.progressPercent}%</span></div><dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-muted-foreground">Vencimiento</dt><dd>{item.dueAt ? formatDate(item.dueAt) : "Sin fecha"}</dd></div><div><dt className="text-muted-foreground">Acciones</dt><dd><Button variant="ghost" size="icon" aria-label={`Retirar asignación de ${item.user ? `${item.user.firstName} ${item.user.lastName}` : "usuario"}`} onClick={() => removeMutation.mutate(item.id)}><Trash2 className="size-4" /></Button></dd></div></dl></CardContent></Card>)}</div>
          <div className="hidden overflow-x-auto rounded-2xl border bg-card md:block">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-muted/60 text-left">
                <tr><th className="p-4">Persona</th><th className="p-4">Curso</th><th className="p-4">Estado</th><th className="p-4">Progreso</th><th className="p-4">Vencimiento</th><th className="p-4 text-right">Acciones</th></tr>
              </thead>
              <tbody>
                {query.data.items.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-4"><strong>{item.user ? `${item.user.firstName} ${item.user.lastName}` : "Usuario"}</strong><br/><span className="text-muted-foreground">{item.user?.email}</span></td>
                    <td className="p-4">{item.course?.title ?? item.title}</td>
                    <td className="p-4"><Badge variant={(item.effectiveStatus ?? item.status) === "OVERDUE" ? "destructive" : "default"}>{statusLabels[item.effectiveStatus ?? item.status]}</Badge></td>
                    <td className="p-4">{item.progressPercent}%</td>
                    <td className="p-4">{item.dueAt ? formatDate(item.dueAt) : "Sin fecha"}</td>
                    <td className="p-4 text-right"><Button variant="ghost" size="icon" aria-label="Retirar asignación" onClick={() => removeMutation.mutate(item.id)}><Trash2 className="size-4" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={query.data.totalPages ?? 1}
            totalItems={query.data.total}
            pageSize={20}
            onPageChange={setPage}
          />
        </>
      ) : (
        <Card className="border-dashed"><CardContent className="py-10 text-center"><Users className="mx-auto size-8 text-muted-foreground"/><p className="mt-3 font-medium">Todavía no hay asignaciones</p></CardContent></Card>
      )}
      <CreateAssignmentDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function CreateAssignmentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const [courseId, setCourseId] = useState("");
  const [audience, setAudience] = useState<"USERS" | "ROLES" | "BRANCHES" | "TENANT">("USERS");
  const [targets, setTargets] = useState<string[]>([]);
  const [startAt, setStartAt] = useState("");
  const [dueAt, setDueAt] = useState("");
  const courses = useQuery({ queryKey: ["published-training-courses"], queryFn: () => fetchTrainingCourses({ status: "PUBLISHED", pageSize: 100 }), enabled: open });
  const users = useQuery({ queryKey: ["assignment-users"], queryFn: fetchUsers, enabled: open && audience === "USERS" });
  const branches = useQuery({ queryKey: ["assignment-branches"], queryFn: () => fetchBranches(), enabled: open && audience === "BRANCHES" });
  const mutation = useMutation({
    mutationFn: createTrainingAssignments,
    onSuccess: async (result) => {
      toast.success(`${result.created} asignación${result.created === 1 ? "" : "es"} creada${result.created === 1 ? "" : "s"}`);
      onOpenChange(false);
      setTargets([]);
      await queryClient.invalidateQueries({ queryKey: ["training-admin-assignments"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible asignar el curso.")),
  });

  const options =
    audience === "USERS" ? (users.data ?? []).map((item) => ({ id: item.id, label: `${item.fullName} · ${item.email}` })) :
    audience === "BRANCHES" ? (branches.data ?? []).map((item) => ({ id: item.id, label: item.name })) :
    audience === "ROLES" ? roleTargets : [];

  function submit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate({
      courseId,
      audience,
      targetIds: audience === "TENANT" ? undefined : targets,
      startAt: startAt ? new Date(startAt).toISOString() : undefined,
      dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
      isRequired: true,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>Asignar curso</DialogTitle><DialogDescription>Define la audiencia y las fechas de cumplimiento.</DialogDescription></DialogHeader>
        <form className="space-y-5" onSubmit={submit}>
          <div><Label>Curso publicado</Label><Select value={courseId} onValueChange={setCourseId}><SelectTrigger><SelectValue placeholder="Selecciona un curso" /></SelectTrigger><SelectContent>{courses.data?.items.map((course) => <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Audiencia</Label><Select value={audience} onValueChange={(value) => { setAudience(value as typeof audience); setTargets([]); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="USERS">Personas específicas</SelectItem><SelectItem value="ROLES">Roles</SelectItem><SelectItem value="BRANCHES">Sucursales</SelectItem><SelectItem value="TENANT">Toda la empresa</SelectItem></SelectContent></Select></div>
          {audience !== "TENANT" ? <fieldset className="max-h-56 space-y-2 overflow-y-auto rounded-xl border p-3"><legend className="px-1 text-sm font-medium">Selecciona destinatarios</legend>{options.map((option) => <label key={option.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-muted"><input type="checkbox" checked={targets.includes(option.id)} onChange={(event) => setTargets(event.target.checked ? [...targets, option.id] : targets.filter((id) => id !== option.id))}/><span>{option.label}</span></label>)}</fieldset> : <p className="rounded-xl bg-muted p-4 text-sm">El curso se asignará a todas las personas activas de la empresa.</p>}
          <div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="assignment-start">Disponible desde</Label><Input id="assignment-start" type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} /></div><div><Label htmlFor="assignment-due">Fecha límite</Label><Input id="assignment-due" type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></div></div>
          <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="submit" disabled={!courseId || (audience !== "TENANT" && targets.length === 0) || mutation.isPending}>{mutation.isPending ? "Asignando…" : "Crear asignaciones"}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CoursePlayer({ courseId, open, onOpenChange }: { courseId: string | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["learner-course", courseId], queryFn: () => fetchLearnerTrainingCourse(courseId!), enabled: Boolean(open && courseId) });
  const mutation = useMutation({
    mutationFn: ({ lessonId, completed }: { lessonId: string; completed: boolean }) => updateTrainingLessonProgress(lessonId, completed),
    onSuccess: async () => {
      await query.refetch();
      await queryClient.invalidateQueries({ queryKey: ["my-training-assignments"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible guardar tu avance.")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader><DialogTitle>{query.data?.title ?? "Curso"}</DialogTitle><DialogDescription>{query.data?.summary ?? "Contenido y progreso del curso."}</DialogDescription></DialogHeader>
        {query.isLoading ? <AsyncState state="loading" /> : query.isError ? <AsyncState state="error" onRetry={() => query.refetch()} /> : query.data ? <CourseContent course={query.data} onToggle={(lessonId, completed) => mutation.mutate({ lessonId, completed })} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function CourseContent({ course, onToggle }: { course: LearnerTrainingCourseDto; onToggle: (lessonId: string, completed: boolean) => void }) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-muted p-4"><div className="flex justify-between text-sm"><span>Avance general</span><strong>{course.progress?.progressPercent ?? 0}%</strong></div></div>
      {course.modules.map((module) => <Card key={module.id}><CardHeader><CardTitle>{module.title}</CardTitle><p className="text-sm text-muted-foreground">{module.description}</p></CardHeader><CardContent className="space-y-3">{module.lessons.map((lesson) => <div key={lesson.id} className="rounded-xl border p-4"><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold">{lesson.title}</h3><p className="mt-1 text-sm text-muted-foreground">{lesson.description}</p></div><Button variant={lesson.completed ? "secondary" : "default"} onClick={() => onToggle(lesson.id, !lesson.completed)}>{lesson.completed ? <CheckCircle2 className="size-4"/> : <PlayCircle className="size-4"/>}{lesson.completed ? "Completada" : "Marcar completada"}</Button></div><div className="mt-4 space-y-2">{lesson.blocks.map((block) => <div key={block.id} className="rounded-lg bg-muted/70 p-3"><strong className="text-sm">{block.title ?? block.type}</strong>{block.resourceUrl ? <p className="mt-2"><a className="text-sm text-primary underline" href={block.resourceUrl} target="_blank" rel="noreferrer">Abrir recurso</a></p> : null}{block.content ? <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{typeof block.content === "object" && "text" in block.content ? String(block.content.text) : JSON.stringify(block.content)}</p> : null}</div>)}</div></div>)}</CardContent></Card>)}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date(value));
}
