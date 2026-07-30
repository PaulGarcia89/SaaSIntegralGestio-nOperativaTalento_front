"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Download,
  Settings2,
  Users,
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
  getApiErrorMessage,
  upsertTrainingCompliancePolicy,
} from "@/lib/backend";
import type { TrainingAnalyticsDto } from "@/lib/contracts";

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
            <Label>Curso</Label>
            <Select value={courseId || "ALL"} onValueChange={(value) => setCourseId(value === "ALL" ? "" : value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="ALL">Todos</SelectItem>{courses.data?.items.map((course) => <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Sucursal</Label>
            <Select value={branchId || "ALL"} onValueChange={(value) => setBranchId(value === "ALL" ? "" : value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="ALL">Todas</SelectItem>{branches.data?.map((branch) => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label htmlFor="analytics-from">Desde</Label><Input id="analytics-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></div>
          <div><Label htmlFor="analytics-to">Hasta</Label><Input id="analytics-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} /></div>
        </CardContent>
      </Card>

      {analytics.isLoading ? <AsyncState state="loading" title="Calculando indicadores" /> : null}
      {analytics.isError ? <AsyncState state="error" title="No fue posible calcular la analítica" description={getApiErrorMessage(analytics.error, "Reintenta la consulta.")} onRetry={() => analytics.refetch()} /> : null}
      {analytics.data ? (
        <>
          <MetricGrid data={analytics.data} />
          <CoursePerformance data={analytics.data} />
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

function MetricGrid({ data }: { data: TrainingAnalyticsDto }) {
  const metrics = [
    { label: "Participantes", value: data.summary.uniqueLearners, icon: Users },
    { label: "Finalización", value: `${data.summary.completionRate}%`, icon: CheckCircle2 },
    { label: "Aprobación", value: `${data.summary.passRate}%`, icon: BarChart3 },
    { label: "Vencidos", value: data.summary.overdue, icon: AlertTriangle },
  ];
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <Card key={metric.label}><CardContent className="py-5"><metric.icon className="size-5 text-primary" /><p className="mt-4 text-sm text-muted-foreground">{metric.label}</p><strong className="text-3xl">{metric.value}</strong></CardContent></Card>)}</div>;
}

function CoursePerformance({ data }: { data: TrainingAnalyticsDto }) {
  return <Card><CardHeader><CardTitle>Rendimiento por curso</CardTitle></CardHeader><CardContent>{data.byCourse.length ? <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-3">Curso</th><th>Asignados</th><th>Completados</th><th>Progreso</th><th>Aprobación</th><th>Vencidos</th></tr></thead><tbody>{data.byCourse.map((course) => <tr key={course.courseId} className="border-b last:border-0"><td className="p-3 font-medium">{course.title}</td><td>{course.assigned}</td><td>{course.completed}</td><td>{course.averageProgress}%</td><td>{course.passRate}%</td><td>{course.overdue}</td></tr>)}</tbody></table></div> : <p className="py-8 text-center text-muted-foreground">No hay datos para el periodo seleccionado.</p>}</CardContent></Card>;
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
