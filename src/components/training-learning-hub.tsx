"use client";

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Award,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ClipboardCheck,
  FilePenLine,
  ListChecks,
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
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
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
  fetchTrainingOverview,
  fetchTrainingAdminAssignments,
  fetchTrainingAdminCertificates,
  fetchTrainingAssessmentResults,
  fetchTrainingAssessments,
  fetchTrainingCourses,
  fetchTrainingLaunches,
  fetchUsers,
  getApiErrorMessage,
  heartbeatTrainingVideo,
  recordTrainingVideoEvent,
  resolveTrainingAssetUrl,
  submitTrainingPilotFeedback,
  startTrainingVideo,
  updateTrainingLessonProgress,
  updateTrainingLaunchStatus,
} from "@/lib/backend";
import type {
  LearnerTrainingCourseDto,
  TrainingAssignmentDto,
  TrainingCoursePilotDto,
  TrainingLaunchAudience,
  TrainingLaunchDto,
  TrainingLaunchStatus,
  TrainingProgressStatus,
  TrainingOverviewDto,
  PermissionKey,
} from "@/lib/contracts";
import { useAppStore } from "@/store/app-store";
import { getLocalTrainingVideo } from "@/lib/training-local-storage";
import { selectTrainingNextAssignment } from "@/lib/training-ux";

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
  const router = useRouter();
  const canManageTraining = can("training.manage");
  const canManageAssignments = can("courses.assign");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Aprendizaje"
        title="Centro de aprendizaje"
        description="Continúa tus cursos y consulta claramente qué formación requiere tu atención."
        actions={<div className="flex flex-wrap gap-2"><Button asChild variant="secondary"><Link href="/training/evaluations"><ClipboardCheck className="size-4" />Mis evaluaciones</Link></Button><Button asChild variant="secondary"><Link href="/training/certificates"><Award className="size-4" />Mis certificados</Link></Button></div>}
      />
      <Tabs defaultValue={canManageTraining ? "priorities" : "mine"}>
        <TabsList aria-label="Secciones de aprendizaje">
          {canManageTraining ? (
            <TabsTrigger value="priorities">Prioridades</TabsTrigger>
          ) : null}
          <TabsTrigger value="mine">Mis cursos</TabsTrigger>
          {canManageAssignments ? (
            <TabsTrigger value="assignments">Asignaciones</TabsTrigger>
          ) : null}
          {canManageAssignments ? (
            <TabsTrigger value="launches">Lanzamientos</TabsTrigger>
          ) : null}
          {canManageAssignments ? (
            <TabsTrigger value="tracking">Supervisión</TabsTrigger>
          ) : null}
        </TabsList>
        {canManageTraining ? (
          <TabsContent value="priorities" className="mt-6">
            <AdminLearningPriorities can={can} />
          </TabsContent>
        ) : null}
        <TabsContent value="mine" className="mt-6">
          <MyPilots onOpen={(id) => router.push(`/training/learn/${id}`)} />
          <MyCourses onOpen={(id) => router.push(`/training/learn/${id}`)} />
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
        {canManageTraining ? (
          <TabsContent value="tracking" className="mt-6">
            <AdminLearningTracking />
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}

function AdminLearningPriorities({ can }: { can: (permission: PermissionKey) => boolean }) {
  const assignments = useQuery({
    queryKey: ["training-admin-priority-assignments"],
    queryFn: () => fetchTrainingAdminAssignments({ page: 1, pageSize: 8 }),
  });
  const courses = useQuery({
    queryKey: ["training-admin-priority-courses"],
    queryFn: () => fetchTrainingCourses({ page: 1, pageSize: 100 }),
    enabled: can("courses.view"),
  });
  const assessments = useQuery({
    queryKey: ["training-admin-priority-assessments"],
    queryFn: fetchTrainingAssessments,
    enabled: can("assessments.manage"),
  });

  const assignmentSummary = assignments.data?.summary;
  const draftCourses = courses.data?.items.filter((course) => course.status === "DRAFT").length ?? 0;
  const reviewCourses = courses.data?.items.filter((course) => course.status === "IN_REVIEW").length ?? 0;
  const incompleteAssessments = assessments.data?.items.filter((assessment) => !assessment.readiness?.ready).length ?? 0;
  const attentionCount = (assignmentSummary?.overdue ?? 0) + reviewCourses + incompleteAssessments;
  const loading = assignments.isLoading || courses.isLoading || assessments.isLoading;

  if (loading) return <AsyncState state="loading" title="Cargando prioridades de aprendizaje" />;
  if (assignments.isError) {
    return <AsyncState state="error" title="No fue posible cargar las prioridades" description={getApiErrorMessage(assignments.error, "Reintenta para continuar.")} onRetry={() => void assignments.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-primary/20 bg-primary/5 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Administración</p>
            <h2 className="mt-1 text-2xl font-semibold">Qué requiere atención</h2>
            <p className="mt-1 max-w-2xl text-sm text-text-secondary">Gestiona el ciclo completo: crea, valida, publica, asigna y supervisa desde una única bandeja.</p>
          </div>
          <Badge variant={attentionCount ? "warning" : "success"}>{attentionCount ? `${attentionCount} pendientes` : "Todo al día"}</Badge>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <PriorityMetric label="Asignaciones vencidas" value={assignmentSummary?.overdue ?? 0} tone="danger" />
          <PriorityMetric label="Cursos en revisión" value={reviewCourses} tone="warning" />
          <PriorityMetric label="Evaluaciones incompletas" value={incompleteAssessments} tone="warning" />
        </div>
      </section>

      <section aria-labelledby="learning-admin-actions" className="space-y-3">
        <div>
          <h2 id="learning-admin-actions" className="text-lg font-semibold">Acciones del ciclo</h2>
          <p className="text-sm text-text-secondary">Cada acción abre el área especializada sin perder el contexto operativo.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <AdminActionCard icon={<FilePenLine className="size-5" />} title="Crear contenido" description={`${draftCourses} cursos en borrador`} href="/training/content" />
          <AdminActionCard icon={<ListChecks className="size-5" />} title="Validar" description={`${reviewCourses} cursos en revisión`} href="/training/content?status=IN_REVIEW" />
          <AdminActionCard icon={<Rocket className="size-5" />} title="Publicar y asignar" description="Distribuye cursos publicados" href="/training" />
          <AdminActionCard icon={<BarChart3 className="size-5" />} title="Supervisar y cerrar" description="Resultados, certificados y mejoras" href="/training/results" />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <AdminAttentionQueue
          assignments={assignments.data?.items ?? []}
          courses={courses.data?.items ?? []}
          assessments={assessments.data?.items ?? []}
        />

        <Card>
          <CardHeader><CardTitle>Siguiente acción recomendada</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {assignmentSummary?.overdue ? <PriorityNextStep icon={<AlertTriangle className="size-5" />} title="Resolver vencimientos" description="Revisa las asignaciones vencidas y contacta a las personas responsables." href="#admin-assignments" /> : reviewCourses ? <PriorityNextStep icon={<ListChecks className="size-5" />} title="Completar validaciones" description="Hay cursos esperando revisión antes de publicar." href="/training/content?status=IN_REVIEW" /> : incompleteAssessments ? <PriorityNextStep icon={<ClipboardCheck className="size-5" />} title="Completar evaluaciones" description="Algunas evaluaciones todavía no están listas para usarse." href="/training/evaluations" /> : <PriorityNextStep icon={<CheckCircle2 className="size-5" />} title="Mantener el ciclo" description="No hay bloqueos críticos. Consulta resultados o crea nuevo contenido." href="/training/results" />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AdminAttentionQueue({
  assignments,
  courses,
  assessments,
}: {
  assignments: TrainingAssignmentDto[];
  courses: Array<{ id: string; title: string; status: string }>;
  assessments: Array<{ id: string; title: string; course?: { title: string }; readiness?: { ready: boolean } }>;
}) {
  const overdueAssignments = assignments.filter((item) => (item.effectiveStatus ?? item.status) === "OVERDUE").slice(0, 4);
  const reviewCourses = courses.filter((course) => course.status === "IN_REVIEW").slice(0, 4);
  const incompleteAssessments = assessments.filter((assessment) => !assessment.readiness?.ready).slice(0, 4);
  const total = overdueAssignments.length + reviewCourses.length + incompleteAssessments.length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div><CardTitle>Cola de atención</CardTitle><p className="mt-1 text-sm text-text-secondary">Pendientes agrupados por tipo, responsable y resolución.</p></div>
        <Badge variant={total ? "warning" : "success"}>{total ? `${total} pendientes` : "Sin pendientes"}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {overdueAssignments.map((item) => (
          <AdminAttentionItem key={`assignment-${item.id}`} tone="danger" label="Asignación vencida" title={item.course?.title ?? item.title} detail={`${item.user ? `${item.user.firstName} ${item.user.lastName}` : "Usuario"} · ${item.progressPercent}%`} owner={item.assignedBy ? `${item.assignedBy.firstName} ${item.assignedBy.lastName}` : "Responsable de formación"} action="Revisar asignación" href="#admin-assignments" />
        ))}
        {reviewCourses.map((course) => (
          <AdminAttentionItem key={`course-${course.id}`} tone="warning" label="Curso en revisión" title={course.title} detail="Validar gates antes de publicar" owner="Responsable de contenido" action="Abrir revisión" href={`/training/content/${encodeURIComponent(course.id)}`} />
        ))}
        {incompleteAssessments.map((assessment) => (
          <AdminAttentionItem key={`assessment-${assessment.id}`} tone="warning" label="Evaluación incompleta" title={assessment.title} detail={assessment.course?.title ?? "Curso sin especificar"} owner="Responsable de evaluación" action="Completar evaluación" href="/training/evaluations" />
        ))}
        {!total ? <p className="py-6 text-center text-sm text-text-secondary">No hay cursos, asignaciones o evaluaciones que requieran atención.</p> : null}
      </CardContent>
    </Card>
  );
}

function AdminAttentionItem({
  tone,
  label,
  title,
  detail,
  owner,
  action,
  href,
}: {
  tone: "danger" | "warning";
  label: string;
  title: string;
  detail: string;
  owner: string;
  action: string;
  href: string;
}) {
  return <div className="flex flex-col gap-3 rounded-xl border border-border-default p-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant={tone === "danger" ? "destructive" : "secondary"}>{label}</Badge><span className="truncate font-medium">{title}</span></div><p className="mt-1 text-xs text-text-secondary">{detail}</p><p className="mt-1 text-xs text-text-secondary">Responsable: <strong className="font-medium text-foreground">{owner}</strong></p></div><Button asChild size="sm" variant="secondary" className="shrink-0"><Link href={href}>{action}<ArrowRight className="size-4" /></Link></Button></div>;
}

function AdminLearningTracking() {
  const [courseId, setCourseId] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [owner, setOwner] = useState("ALL");
  const assignments = useQuery({ queryKey: ["training-admin-tracking-assignments"], queryFn: () => fetchTrainingAdminAssignments({ page: 1, pageSize: 100 }) });
  const courses = useQuery({ queryKey: ["training-admin-tracking-courses"], queryFn: () => fetchTrainingCourses({ page: 1, pageSize: 100 }) });
  const certificates = useQuery({ queryKey: ["training-admin-tracking-certificates"], queryFn: fetchTrainingAdminCertificates });
  const results = useQuery({ queryKey: ["training-admin-tracking-results"], queryFn: () => fetchTrainingAssessmentResults(1) });

  if (assignments.isLoading || courses.isLoading || certificates.isLoading || results.isLoading) return <AsyncState state="loading" title="Cargando supervisión" />;
  if (assignments.isError) return <AsyncState state="error" title="No fue posible cargar la supervisión" description={getApiErrorMessage(assignments.error, "Reintenta para continuar.")} onRetry={() => void assignments.refetch()} />;

  const allAssignments = assignments.data?.items ?? [];
  const owners = Array.from(new Map(allAssignments.filter((item) => item.assignedBy).map((item) => [item.assignedBy!.id, `${item.assignedBy!.firstName} ${item.assignedBy!.lastName}`])).entries());
  const filtered = allAssignments.filter((item) => {
    const itemStatus = item.effectiveStatus ?? item.status;
    return (courseId === "ALL" || item.courseId === courseId) && (status === "ALL" || itemStatus === status) && (owner === "ALL" || item.assignedBy?.id === owner);
  });
  const overdue = filtered.filter((item) => (item.effectiveStatus ?? item.status) === "OVERDUE").length;
  const completed = filtered.filter((item) => (item.effectiveStatus ?? item.status) === "COMPLETED").length;
  const inProgress = filtered.filter((item) => (item.effectiveStatus ?? item.status) === "IN_PROGRESS").length;
  const certificatesForCourse = (certificates.data?.items ?? []).filter((item) => courseId === "ALL" || item.course?.id === courseId);
  const resultsForCourse = (results.data?.items ?? []).filter((item) => courseId === "ALL" || item.quiz?.courseId === courseId);

  return (
    <div className="space-y-5">
      <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Seguimiento</p><h2 className="mt-1 text-2xl font-semibold">Progreso y resultados</h2><p className="mt-1 text-sm text-text-secondary">Consulta avance, vencimientos, evaluaciones y certificados en el mismo contexto.</p></div>
      <Card><CardContent className="grid gap-3 p-4 md:grid-cols-3"><div><Label htmlFor="tracking-course">Curso</Label><Select value={courseId} onValueChange={setCourseId}><SelectTrigger id="tracking-course"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Todos los cursos</SelectItem>{(courses.data?.items ?? []).map((course) => <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}</SelectContent></Select></div><div><Label htmlFor="tracking-status">Estado</Label><Select value={status} onValueChange={setStatus}><SelectTrigger id="tracking-status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Todos los estados</SelectItem>{Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div><div><Label htmlFor="tracking-owner">Responsable</Label><Select value={owner} onValueChange={setOwner}><SelectTrigger id="tracking-owner"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Todos los responsables</SelectItem>{owners.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}</SelectContent></Select></div></CardContent></Card>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><TrackingMetric label="Asignaciones" value={filtered.length} /><TrackingMetric label="En progreso" value={inProgress} /><TrackingMetric label="Completadas" value={completed} tone="success" /><TrackingMetric label="Vencidas" value={overdue} tone="danger" /><TrackingMetric label="Certificados" value={certificatesForCourse.length} tone="success" /></div>
      <Card><CardHeader className="flex flex-row items-start justify-between gap-3"><div><CardTitle>Detalle de supervisión</CardTitle><p className="mt-1 text-sm text-text-secondary">{filtered.length} asignaciones · {resultsForCourse.length} intentos de evaluación · {certificatesForCourse.length} certificados</p></div><Button asChild variant="secondary" size="sm"><Link href="/training/results">Ver resultados <ArrowRight className="size-4" /></Link></Button></CardHeader><CardContent className="space-y-2">{filtered.slice(0, 12).map((item) => <div key={item.id} className="flex flex-col gap-2 rounded-xl border border-border-default p-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate font-medium">{item.course?.title ?? item.title}</p><p className="text-xs text-text-secondary">{item.user ? `${item.user.firstName} ${item.user.lastName}` : "Usuario"} · Responsable: {item.assignedBy ? `${item.assignedBy.firstName} ${item.assignedBy.lastName}` : "No asignado"}</p></div><div className="flex items-center gap-3"><span className="text-sm">{item.progressPercent}%</span><Badge variant={(item.effectiveStatus ?? item.status) === "OVERDUE" ? "destructive" : (item.effectiveStatus ?? item.status) === "COMPLETED" ? "success" : "secondary"}>{statusLabels[item.effectiveStatus ?? item.status]}</Badge></div></div>)}{!filtered.length ? <p className="py-8 text-center text-sm text-text-secondary">No hay datos para los filtros seleccionados.</p> : null}</CardContent></Card>
    </div>
  );
}

function TrackingMetric({ label, value, tone = "normal" }: { label: string; value: number; tone?: "normal" | "success" | "danger" }) {
  return <Card><CardContent className="p-4"><p className="text-xs text-text-secondary">{label}</p><p className={`mt-1 text-2xl font-semibold ${tone === "success" ? "text-status-success" : tone === "danger" ? "text-status-danger" : "text-foreground"}`}>{value}</p></CardContent></Card>;
}

function PriorityMetric({ label, value, tone }: { label: string; value: number; tone: "danger" | "warning" }) {
  return <div className="rounded-2xl border border-border-default bg-card p-4"><p className="text-xs text-text-secondary">{label}</p><p className={`mt-1 text-3xl font-semibold ${tone === "danger" ? "text-status-danger" : "text-status-warning"}`}>{value}</p></div>;
}

function AdminActionCard({ icon, title, description, href }: { icon: ReactNode; title: string; description: string; href: string }) {
  return <Link href={href} className="group rounded-2xl border border-border-default bg-card p-4 transition-colors hover:border-primary/50 hover:bg-primary/5"><span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-brand">{icon}</span><span className="mt-4 block font-semibold">{title}</span><span className="mt-1 block text-sm text-text-secondary">{description}</span><span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand">Abrir <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></span></Link>;
}

function PriorityNextStep({ icon, title, description, href }: { icon: ReactNode; title: string; description: string; href: string }) {
  return <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4"><div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card text-brand">{icon}</span><div><p className="font-semibold">{title}</p><p className="mt-1 text-sm text-text-secondary">{description}</p><Button asChild className="mt-4" size="sm"><Link href={href}>Resolver <ArrowRight className="size-4" /></Link></Button></div></div></div>;
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
            <div className="flex items-start gap-3"><FlaskConical className="size-6 text-brand" /><div><strong>{pilot.name}</strong><p className="text-sm text-text-secondary">{pilot.course?.title}</p></div></div>
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
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["my-training-assignments", status, search, page],
    queryFn: async () => {
      const [assignments, overview] = await Promise.all([
        fetchMyTrainingAssignments({ page, pageSize: 20, status: status || undefined, search: search || undefined }),
        fetchTrainingOverview(),
      ]);
      return { ...assignments, overview };
    },
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
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder="Curso, categoría o palabra clave"
          />
        </div>
        <div>
          <Label htmlFor="my-course-status">Estado</Label>
          <Select value={status || "ALL"} onValueChange={(value) => { setStatus(value === "ALL" ? "" : value); setPage(1); }}>
            <SelectTrigger id="my-course-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              {Object.entries(statusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <LearnerTrainingSummary
        assignments={query.data?.items ?? []}
        summary={query.data?.summary}
        overview={query.data?.overview}
        onOpen={onOpen}
      />

      {query.data?.items.length ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {query.data.items.map((assignment) => (
              <AssignmentCard key={assignment.id} assignment={assignment} onOpen={onOpen} />
            ))}
          </div>
          <Pagination page={page} totalPages={query.data.totalPages ?? 1} totalItems={query.data.total} pageSize={20} onPageChange={setPage} />
        </>
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

function LearnerTrainingSummary({
  assignments,
  summary,
  overview,
  onOpen,
}: {
  assignments: TrainingAssignmentDto[];
  summary?: { total: number; notStarted: number; inProgress: number; completed: number; overdue: number };
  overview?: TrainingOverviewDto;
  onOpen: (courseId: string) => void;
}) {
  const nextAssignment = selectTrainingNextAssignment(overview, assignments);

  if (!summary?.total && !nextAssignment) return null;

  return (
    <section aria-labelledby="training-summary-title" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
      <Card className="bg-surface-section">
        <CardHeader className="pb-3">
          <CardTitle id="training-summary-title" className="text-base">Tu formación</CardTitle>
          <p className="text-sm text-muted-foreground">Una vista rápida de lo que requiere tu atención.</p>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryMetric label="Pendientes" value={summary?.notStarted ?? 0} />
          <SummaryMetric label="En progreso" value={summary?.inProgress ?? 0} />
          <SummaryMetric label="Completados" value={summary?.completed ?? 0} tone="success" />
          <SummaryMetric label="Vencidos" value={summary?.overdue ?? 0} tone="danger" />
        </CardContent>
      </Card>

      <Card className={nextAssignment?.effectiveStatus === "OVERDUE" ? "border-status-danger/40 bg-status-danger/5" : "border-primary/30 bg-primary/5"}>
        <CardHeader className="pb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">Siguiente paso</p>
          <CardTitle className="text-base">{nextAssignment ? nextAssignment.title : "No hay acciones pendientes"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {nextAssignment ? (
            <>
              <p className="text-sm text-muted-foreground">
                {nextAssignment.effectiveStatus === "OVERDUE"
                  ? "Esta formación necesita atención porque ya superó su fecha límite."
                  : nextAssignment.effectiveStatus === "IN_PROGRESS"
                    ? "Retoma donde lo dejaste para mantener tu avance."
                    : "Empieza esta formación cuando tengas disponibilidad."}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={nextAssignment.effectiveStatus === "OVERDUE" ? "destructive" : nextAssignment.effectiveStatus === "COMPLETED" ? "success" : "secondary"}>
                  {statusLabels[nextAssignment.effectiveStatus ?? nextAssignment.status]}
                </Badge>
                <span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" />{nextAssignment.estimatedMinutes} min</span>
                {nextAssignment.dueAt ? <span className={`inline-flex items-center gap-1 ${nextAssignment.effectiveStatus === "OVERDUE" ? "font-semibold text-status-danger" : "text-muted-foreground"}`}><CalendarDays className="size-3.5" />{nextAssignment.effectiveStatus === "OVERDUE" ? "Venció" : "Vence"} {formatDate(nextAssignment.dueAt)}</span> : <span className="text-xs text-muted-foreground">Sin fecha límite</span>}
                {nextAssignment.isRequired ? <Badge variant="secondary">Obligatorio</Badge> : null}
              </div>
              {getTrainingStartBlocker(nextAssignment) ? (
                <div className="flex items-start gap-2 rounded-xl border border-status-warning/30 bg-status-warning-soft/40 p-3 text-sm text-status-warning" role="status">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <div><strong>Bloqueo:</strong> {getTrainingStartBlocker(nextAssignment)}</div>
                </div>
              ) : null}
              <Button className="w-full sm:w-auto" disabled={!nextAssignment.courseId} onClick={() => nextAssignment.courseId && onOpen(nextAssignment.courseId)}>
                <PlayCircle className="size-4" />
                {nextAssignment.effectiveStatus === "IN_PROGRESS" ? "Continuar formación" : nextAssignment.effectiveStatus === "OVERDUE" ? "Revisar formación" : "Iniciar formación"}
              </Button>
            </>
          ) : <p className="text-sm text-muted-foreground">Has completado todas las formaciones asignadas.</p>}
        </CardContent>
      </Card>
    </section>
  );
}

function SummaryMetric({ label, value, tone = "normal" }: { label: string; value: number; tone?: "normal" | "success" | "danger" }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${tone === "success" ? "text-status-success" : tone === "danger" ? "text-status-danger" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

function getTrainingStartBlocker(assignment: TrainingAssignmentDto) {
  const status = assignment.effectiveStatus ?? assignment.status;
  if (status === "OVERDUE") return "La fecha límite ya pasó. Revisa con tu responsable si necesitas una nueva fecha.";
  if (!assignment.courseId) return "Esta asignación no tiene un curso disponible. Contacta con quien la asignó.";
  return null;
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
          <div className="min-w-0">
            <CardTitle className="text-lg">{assignment.title}</CardTitle>
            {assignment.isRequired ? <Badge className="mt-2" variant="secondary">Obligatorio</Badge> : null}
          </div>
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
              <Button size="sm" variant="ghost" onClick={() => { if (window.confirm("¿Cancelar esta campaña? Las personas aún no asignadas ya no recibirán el curso.")) onStatus("CANCELLED"); }} disabled={pending}>
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
    <div id="admin-assignments" className="space-y-5">
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

      {query.data?.items.some((item) => ["OVERDUE", "IN_PROGRESS"].includes(item.effectiveStatus ?? item.status)) ? (
        <Card className="border-status-warning/40 bg-status-warning-soft/30">
          <CardHeader className="pb-3"><CardTitle className="text-base">Requiere atención</CardTitle><p className="text-sm text-muted-foreground">Prioriza las asignaciones vencidas o que necesitan seguimiento.</p></CardHeader>
          <CardContent className="space-y-2">{query.data.items.filter((item) => ["OVERDUE", "IN_PROGRESS"].includes(item.effectiveStatus ?? item.status)).slice(0, 5).map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3"><div><p className="font-medium">{item.course?.title ?? item.title}</p><p className="text-xs text-muted-foreground">{item.user ? `${item.user.firstName} ${item.user.lastName}` : "Usuario"} · {item.progressPercent}%</p></div><Badge variant={(item.effectiveStatus ?? item.status) === "OVERDUE" ? "destructive" : "secondary"}>{statusLabels[item.effectiveStatus ?? item.status]}</Badge></div>)}</CardContent>
        </Card>
      ) : null}

      {query.isLoading ? <AsyncState state="loading" /> : query.isError ? (
        <AsyncState state="error" onRetry={() => query.refetch()} />
      ) : query.data?.items.length ? (
        <>
          <div className="grid gap-3 md:hidden">{query.data.items.map((item) => <Card key={item.id}><CardContent className="space-y-3 p-4"><div><p className="font-semibold">{item.user ? `${item.user.firstName} ${item.user.lastName}` : "Usuario"}</p><p className="text-sm text-muted-foreground">{item.user?.email}</p></div><p className="text-sm font-medium">{item.course?.title ?? item.title}</p><div className="flex flex-wrap items-center justify-between gap-2"><Badge variant={(item.effectiveStatus ?? item.status) === "OVERDUE" ? "destructive" : "default"}>{statusLabels[item.effectiveStatus ?? item.status]}</Badge><span className="text-sm">{item.progressPercent}%</span></div><dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-muted-foreground">Vencimiento</dt><dd>{item.dueAt ? formatDate(item.dueAt) : "Sin fecha"}</dd></div><div><dt className="text-muted-foreground">Acciones</dt><dd><Button variant="ghost" size="icon" aria-label={`Retirar asignación de ${item.user ? `${item.user.firstName} ${item.user.lastName}` : "usuario"}`} onClick={() => { if (window.confirm("¿Retirar esta asignación? El avance histórico se conservará, pero dejará de estar activa.")) removeMutation.mutate(item.id); }}><Trash2 className="size-4" /></Button></dd></div></dl></CardContent></Card>)}</div>
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
                    <td className="p-4 text-right"><Button variant="ghost" size="icon" aria-label="Retirar asignación" onClick={() => { if (window.confirm("¿Retirar esta asignación? El avance histórico se conservará, pero dejará de estar activa.")) removeMutation.mutate(item.id); }}><Trash2 className="size-4" /></Button></td>
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
    mutationFn: async ({ event }: { event: VideoProgressEvent }) => {
      let lastError: unknown;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          if (event.eventType === "PLAY") return await startTrainingVideo(event);
          if (event.eventType === "HEARTBEAT") return await heartbeatTrainingVideo({ ...event, clientTimestamp: new Date().toISOString(), isPlaying: true });
          if (event.eventType === "COMPLETED") return await updateTrainingLessonProgress(event.lessonId, true);
          if (event.eventType === "PAUSE" || event.eventType === "SEEK" || event.eventType === "ENDED") return await recordTrainingVideoEvent(event.eventType === "ENDED" ? "ended" : "pause", event);
          return null;
        } catch (error) {
          lastError = error;
          if (attempt < 2) await new Promise((resolve) => window.setTimeout(resolve, 500 * 2 ** attempt));
        }
      }
      throw lastError;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["my-training-assignments"] });
      await queryClient.invalidateQueries({ queryKey: ["learner-course", courseId] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible sincronizar tu avance.")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader><DialogTitle>{query.data?.title ?? "Curso"}</DialogTitle><DialogDescription>{query.data?.summary ?? "Contenido y progreso del curso."}</DialogDescription></DialogHeader>
        {query.isLoading ? <AsyncState state="loading" /> : query.isError ? <AsyncState state="error" onRetry={() => query.refetch()} /> : query.data ? <CourseContent course={query.data} onVideoProgress={(event) => mutation.mutate({ event })} /> : null}
      </DialogContent>
    </Dialog>
  );
}

export type VideoProgressEvent = {
  assignmentId: string;
  lessonId: string;
  playbackSessionId: string;
  eventType: "PLAY" | "PAUSE" | "SEEK" | "HEARTBEAT" | "ENDED" | "COMPLETED";
  currentTimeSeconds: number;
  durationSeconds: number;
};

export function CourseContent({ course, onVideoProgress }: { course: LearnerTrainingCourseDto; onVideoProgress: (event: VideoProgressEvent) => Promise<unknown> | void }) {
  const lessons = course.modules.flatMap((module) => module.lessons);
  const currentLesson = lessons.find((lesson) => lesson.isRequired && !lesson.completed) ?? null;
  const pendingQuiz = course.quizSummary?.find((quiz) => !quiz.latestAttempt?.passed);
  return <div className="space-y-5">
    <div className="rounded-xl bg-muted p-4" aria-live="polite"><div className="flex justify-between text-sm"><span>Avance general</span><strong>{course.progress?.progressPercent ?? 0}%</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-background"><div className="h-full rounded-full bg-primary" style={{ width: `${course.progress?.progressPercent ?? 0}%` }} /></div></div>
    <CourseCurrentStep course={course} currentLesson={currentLesson} pendingQuiz={pendingQuiz} />
    {course.modules.map((module) => <Card key={module.id}><CardHeader><CardTitle>{module.title}</CardTitle><p className="text-sm text-muted-foreground">{module.description}</p></CardHeader><CardContent className="space-y-3">{module.lessons.map((lesson) => { const index = lessons.findIndex((item) => item.id === lesson.id); const nextLesson = lessons[index + 1]; const isCurrent = currentLesson?.id === lesson.id; return <div id={`lesson-${lesson.id}`} key={lesson.id} aria-current={isCurrent ? "step" : undefined} className={`scroll-mt-6 rounded-xl border p-4 ${isCurrent ? "border-primary bg-primary/5 shadow-sm" : ""}`}><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-semibold">{lesson.title}</h3><p className="mt-1 text-sm text-muted-foreground">{lesson.description}</p></div>{isCurrent ? <Badge>Ahora</Badge> : lesson.completed ? <Badge variant="success">Completada</Badge> : null}</div><div className="mt-4 space-y-3">{lesson.videoUrl ? <VideoLesson key={`${lesson.id}-video`} lesson={lesson} assignmentId={course.assignment?.id ?? ""} url={resolveTrainingAssetUrl(lesson.videoUrl) ?? lesson.videoUrl} onProgress={onVideoProgress} /> : <LocalVideoLesson courseId={course.id} lesson={lesson} assignmentId={course.assignment?.id ?? ""} onProgress={onVideoProgress} />}{lesson.blocks.map((block) => lesson.type === "VIDEO" && block.type === "VIDEO" ? null : block.type === "VIDEO" && block.resourceUrl ? <VideoLesson key={block.id} lesson={lesson} assignmentId={course.assignment?.id ?? ""} url={resolveTrainingAssetUrl(block.resourceUrl) ?? block.resourceUrl} onProgress={onVideoProgress} /> : <div key={block.id} className="rounded-lg bg-muted/70 p-3"><strong className="text-sm">{block.title ?? block.type}</strong>{block.resourceUrl ? <p className="mt-2"><a className="text-sm text-brand underline" href={block.resourceUrl} target="_blank" rel="noreferrer">Abrir recurso</a></p> : null}{block.content ? <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{typeof block.content === "object" && "text" in block.content ? String(block.content.text) : JSON.stringify(block.content)}</p> : null}</div>)}</div>{lesson.completed ? <p className="mt-3 inline-flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 className="size-4" />Completada y guardada</p> : null}{nextLesson ? <a href={`#lesson-${nextLesson.id}`} className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-brand underline-offset-4 hover:underline">Siguiente lección: {nextLesson.title} <span className="ml-1" aria-hidden="true">→</span></a> : lesson.completed ? <p className="mt-4 text-sm font-medium text-emerald-700">Has completado todo el contenido disponible.</p> : null}</div>; })}</CardContent></Card>)}
    {course.progress?.status === "COMPLETED" ? <Card className="border-status-success/30 bg-status-success-soft/30"><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-semibold">Formación completada</p><p className="text-sm text-muted-foreground">Consulta si tienes una credencial disponible.</p></div><Button asChild variant="secondary"><Link href="/training/certificates"><Award className="size-4" />Ver certificado</Link></Button></CardContent></Card> : null}
  </div>;
}

function CourseCurrentStep({ course, currentLesson, pendingQuiz }: { course: LearnerTrainingCourseDto; currentLesson: LearnerTrainingCourseDto["modules"][number]["lessons"][number] | null; pendingQuiz?: NonNullable<LearnerTrainingCourseDto["quizSummary"]>[number] }) {
  if (currentLesson) {
    return <Card className="border-primary/30 bg-primary/5"><CardHeader className="pb-3"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Ahora</p><CardTitle className="text-lg">{currentLesson.title}</CardTitle><p className="text-sm text-muted-foreground">{currentLesson.description || "Continúa con la siguiente lección obligatoria."}</p></CardHeader><CardContent className="flex flex-wrap items-center gap-3 pt-0"><Badge variant="secondary">{currentLesson.estimatedMinutes ?? 0} min</Badge><span className="text-sm text-muted-foreground">La lección actual está resaltada en el contenido.</span></CardContent></Card>;
  }
  if (pendingQuiz) {
    return <Card className="border-primary/30 bg-primary/5"><CardHeader className="pb-3"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Siguiente paso</p><CardTitle className="text-lg">Completar {pendingQuiz.title}</CardTitle><p className="text-sm text-muted-foreground">Necesitas demostrar el aprendizaje antes de cerrar esta formación.</p></CardHeader><CardContent className="pt-0"><Button asChild><Link href={`/training/evaluations?courseId=${encodeURIComponent(course.id)}`}><ClipboardCheck className="size-4" />Comenzar evaluación</Link></Button></CardContent></Card>;
  }
  return <Card className="border-status-success/30 bg-status-success-soft/30"><CardContent className="flex items-center gap-3 p-4"><CheckCircle2 className="size-5 text-status-success" /><div><p className="font-semibold">Contenido completado</p><p className="text-sm text-muted-foreground">No hay lecciones pendientes en este curso.</p></div></CardContent></Card>;
}

function LocalVideoLesson({ courseId, lesson, assignmentId, onProgress }: { courseId: string; lesson: LearnerTrainingCourseDto["modules"][number]["lessons"][number]; assignmentId: string; onProgress: (event: VideoProgressEvent) => Promise<unknown> | void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    let active = true;
    void getLocalTrainingVideo(courseId, lesson.id).then((record) => {
      if (!active) return;
      if (record) setUrl(URL.createObjectURL(record.blob));
      else setMissing(true);
    }).catch(() => undefined);
    return () => {
      active = false;
      setUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
    };
  }, [courseId, lesson.id]);
  if (url) return <VideoLesson lesson={lesson} assignmentId={assignmentId} url={url} onProgress={onProgress} />;
  return missing ? <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Este video se guardó localmente en el navegador del editor y todavía no está disponible en este navegador.</p> : <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">Cargando video local...</p>;
}

export function VideoLesson({ lesson, assignmentId, url, onProgress }: { lesson: LearnerTrainingCourseDto["modules"][number]["lessons"][number]; assignmentId: string; url: string; onProgress: (event: VideoProgressEvent) => Promise<unknown> | void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onProgressRef = useRef(onProgress);
  const sessionRef = useRef<string>(crypto.randomUUID());
  const lastSentRef = useRef(0);
  const completionSentRef = useRef(false);
  const [syncState, setSyncState] = useState("Listo para reproducir");
  const [watchPercent, setWatchPercent] = useState(0);
  const [mediaError, setMediaError] = useState(false);
  const savedPosition = lesson.videoProgress?.lastPositionSeconds ?? 0;
  const completionThreshold = lesson.requiredCompletionPercentage ?? 90;
  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const send = (eventType: VideoProgressEvent["eventType"]) => {
      const duration = Number.isFinite(video.duration) ? Math.round(video.duration) : 0;
      const current = Math.round(video.currentTime);
      if (eventType === "HEARTBEAT" && current === lastSentRef.current) return;
      lastSentRef.current = current;
      setSyncState("Sincronizando…");
      void Promise.resolve(onProgressRef.current({ assignmentId, lessonId: lesson.id, playbackSessionId: sessionRef.current, eventType, currentTimeSeconds: current, durationSeconds: duration })).then(() => setSyncState("Avance guardado")).catch(() => setSyncState("No fue posible guardar el avance"));
      if (!completionSentRef.current && duration > 0 && current / duration >= completionThreshold / 100) {
        completionSentRef.current = true;
        void Promise.resolve(onProgressRef.current({ assignmentId, lessonId: lesson.id, playbackSessionId: sessionRef.current, eventType: "COMPLETED", currentTimeSeconds: current, durationSeconds: duration })).then(() => setSyncState("Completado y guardado")).catch(() => setSyncState("No fue posible guardar la finalización"));
      }
    };
    const restore = () => { if (savedPosition > 0 && video.currentTime < 1) video.currentTime = savedPosition; };
    const heartbeat = window.setInterval(() => { if (!video.paused && !video.ended) send("HEARTBEAT"); }, 10_000);
    const onPlay = () => send("PLAY");
    const onPause = () => send("PAUSE");
    const onEnded = () => send("ENDED");
    const onSeeked = () => send("SEEK");
    const onVisibilityChange = () => { if (document.hidden && !video.paused) send("PAUSE"); };
    const onOnline = () => { if (!video.paused && !video.ended) send("HEARTBEAT"); };
    const onTimeUpdate = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) setWatchPercent(Math.min(100, Math.round((video.currentTime / video.duration) * 100)));
    };
    video.addEventListener("loadedmetadata", restore);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("timeupdate", onTimeUpdate);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("online", onOnline);
    return () => {
      if (!video.ended) send("PAUSE");
      window.clearInterval(heartbeat);
      video.removeEventListener("loadedmetadata", restore);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("timeupdate", onTimeUpdate);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("online", onOnline);
    };
  }, [assignmentId, completionThreshold, lesson.id, savedPosition]);

  return <div className="rounded-xl bg-black p-2"><video ref={videoRef} className="aspect-video w-full rounded-lg" controls playsInline preload="metadata" src={url} onError={() => { setMediaError(true); setSyncState("No fue posible reproducir este MP4"); }} aria-label={`Video de ${lesson.title}`} />{mediaError ? <p className="px-2 pt-2 text-xs text-amber-300">Verifica que el archivo sea un MP4 compatible (H.264/AAC) y vuelve a cargarlo desde el editor.</p> : null}<div className="px-2 pt-3"><div className="relative h-2 overflow-hidden rounded-full bg-white/20" role="progressbar" aria-label={`Avance del video ${watchPercent}%`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={watchPercent}><div className="h-full rounded-full bg-primary transition-[width] duration-200" style={{ width: `${watchPercent}%` }} /><span className="absolute inset-y-0 w-0.5 bg-white/80" style={{ left: `${completionThreshold}%` }} aria-hidden="true" /></div><div className="mt-1 flex justify-between text-[11px] text-white/70"><span>{watchPercent}% visto</span><span>Completa al {completionThreshold}%</span></div></div><p className="px-2 pb-1 pt-2 text-xs text-white/70" aria-live="polite">{syncState}</p></div>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date(value));
}
