"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, Clock3, ClipboardCheck, UserRound } from "lucide-react";
import { AsyncState } from "@/components/async-state";
import { InlineFeedback, PageHeader } from "@/components/design-system";
import { RecruitmentWorkspaceNav } from "@/components/recruitment-workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchApplications, fetchRecruitmentInterviews } from "@/lib/backend";
import type { RecruitmentInterviewDto, VacancyApplicationDto } from "@/lib/contracts";
import { applicationNextAction, currentApplicationStage, formatApplicationDate } from "@/lib/applications";
import { useAppStore } from "@/store/app-store";

type AttentionKind = "new" | "interview" | "evaluation" | "decision" | "inactive" | "hiring" | "sla";

type AttentionItem = {
  application: VacancyApplicationDto;
  kind: AttentionKind;
  label: string;
  detail: string;
  priority: number;
  href: string;
  action: string;
  age: string;
};

const kindConfig: Record<AttentionKind, { title: string; description: string; icon: typeof UserRound; tone: "default" | "warning" | "danger" }> = {
  new: { title: "Nuevas postulaciones", description: "Candidatos que aún no tienen una primera revisión.", icon: UserRound, tone: "default" },
  interview: { title: "Entrevistas próximas", description: "Sesiones que requieren preparación o seguimiento.", icon: CalendarDays, tone: "default" },
  evaluation: { title: "Evaluaciones pendientes", description: "Entrevistas completadas sin una ficha registrada.", icon: ClipboardCheck, tone: "warning" },
  decision: { title: "Decisiones pendientes", description: "Candidatos listos para definir el siguiente paso.", icon: CheckCircle2, tone: "warning" },
  inactive: { title: "Sin actividad", description: "Postulaciones activas sin actualización reciente.", icon: Clock3, tone: "warning" },
  hiring: { title: "Pendientes de contratación", description: "Candidatos seleccionados que requieren transferencia.", icon: ArrowRight, tone: "default" },
  sla: { title: "SLA vencido", description: "Procesos que necesitan atención prioritaria.", icon: AlertTriangle, tone: "danger" },
};

function ageLabel(value: string) {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 60) return `Hace ${Math.max(1, minutes)} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} día${days === 1 ? "" : "s"}`;
}

function getItem(application: VacancyApplicationDto, interviews: RecruitmentInterviewDto[]): AttentionItem | null {
  const now = Date.now();
  const applicationInterviews = interviews.filter((item) => item.applicationId === application.id || item.application?.id === application.id);
  const upcoming = applicationInterviews.find((item) => ["SCHEDULED", "CONFIRMED"].includes(item.status) && new Date(item.startsAt).getTime() >= now);
  const completedWithoutScorecard = applicationInterviews.some((item) => item.status === "COMPLETED" && !item.scorecards?.length);
  const stage = currentApplicationStage(application, application.vacancy.stages ?? []);
  const base = { application, age: ageLabel(application.updatedAt), href: `/ats/candidates/${application.id}` };

  if (application.status === "REJECTED" || application.status === "WITHDRAWN" || application.status === "HIRED") return null;
  if (application.isStageOverdue) return { ...base, kind: "sla", label: "SLA vencido", detail: stage?.name ?? applicationNextAction(application.status), priority: 0, action: "Revisar proceso" };
  if (application.pendingTransitions?.some((item) => item.status === "PENDING")) return { ...base, kind: "decision", label: "Cambio pendiente de aprobación", detail: stage?.name ?? "Revisión requerida", priority: 1, action: "Revisar solicitud" };
  if (application.status === "SUBMITTED") return { ...base, kind: "new", label: "Nueva postulación", detail: "Primera revisión pendiente", priority: 2, action: "Revisar postulación" };
  if (upcoming) return { ...base, kind: "interview", label: "Entrevista próxima", detail: `${new Date(upcoming.startsAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short", timeZone: upcoming.timezone })} · ${upcoming.timezone}`, priority: 3, action: "Ver entrevista" };
  if (completedWithoutScorecard) return { ...base, kind: "evaluation", label: "Evaluación pendiente", detail: "La entrevista terminó sin ficha registrada", priority: 4, action: "Registrar evaluación" };
  if (application.status === "APPROVED") return { ...base, kind: "hiring", label: "Seleccionado para contratación", detail: "La transferencia aún no se ha completado", priority: 5, action: "Enviar a contratación" };
  if (application.status === "INTERVIEW" && application.tracking?.interviewCompletedAt) return { ...base, kind: "decision", label: "Decisión pendiente", detail: stage?.name ?? "Revisar resultados", priority: 6, action: "Tomar decisión" };
  const inactiveDays = (now - new Date(application.updatedAt).getTime()) / 86_400_000;
  if (inactiveDays >= 7) return { ...base, kind: "inactive", label: "Sin actividad", detail: `${stage?.name ?? "Proceso activo"} · última actividad ${formatApplicationDate(application.updatedAt)}`, priority: 7, action: "Retomar proceso" };
  return null;
}

export default function AtsAttentionPage() {
  const { currentBranch, currentTenant } = useAppStore();
  const applications = useQuery({
    queryKey: ["applications", "ats-attention", currentBranch?.id],
    queryFn: () => fetchApplications({ branchId: currentBranch?.id, page: 1, pageSize: 100 }),
  });
  const interviews = useQuery({
    queryKey: ["recruitment-interviews", "ats-attention", currentBranch?.id],
    queryFn: () => fetchRecruitmentInterviews({ branchId: currentBranch?.id, page: 1, pageSize: 100, startsFrom: new Date().toISOString() }),
  });
  const items = useMemo(() => {
    const result = (applications.data?.data ?? []).map((application) => getItem(application, interviews.data?.data ?? [])).filter((item): item is AttentionItem => Boolean(item));
    return result.sort((a, b) => a.priority - b.priority || new Date(a.application.updatedAt).getTime() - new Date(b.application.updatedAt).getTime());
  }, [applications.data?.data, interviews.data?.data]);
  const grouped = useMemo(() => Object.keys(kindConfig).map((kind) => ({ kind: kind as AttentionKind, items: items.filter((item) => item.kind === kind) })).filter((group) => group.items.length), [items]);
  const total = applications.data?.meta.total ?? 0;
  const inspected = applications.data?.data.length ?? 0;

  return <div className="space-y-7">
    <PageHeader eyebrow="Reclutamiento" title="Requiere atención" description="Un punto de entrada para saber qué candidatos necesitan una acción ahora." actions={<Button asChild variant="secondary"><Link href="/ats/candidates">Ver todos los candidatos<ArrowRight className="size-4" /></Link></Button>} />
    <RecruitmentWorkspaceNav />
    <section className="rounded-2xl border border-border-default bg-surface-section p-4 text-sm text-text-secondary"><p><strong className="text-text-primary">Contexto:</strong> {currentTenant?.name ?? "Empresa activa"}{currentBranch ? ` · ${currentBranch.name}` : " · Todas las sucursales permitidas"}</p><p className="mt-1">Se revisaron {inspected} de {total} postulaciones más recientes del alcance actual. La bandeja prioriza la primera acción disponible; abre candidatos para consultar el resto.</p></section>
    {applications.isLoading || interviews.isLoading ? <AsyncState state="loading" title="Preparando prioridades" description="Revisando postulaciones, entrevistas y actividad reciente." /> : null}
    {applications.isError ? <AsyncState state="error" title="No fue posible cargar la bandeja" description="Las prioridades no están disponibles en este momento." onRetry={() => void applications.refetch()} /> : null}
    {applications.isSuccess && !grouped.length ? <InlineFeedback tone="success" title="No hay pendientes críticos">No encontramos postulaciones activas que requieran una acción inmediata.</InlineFeedback> : null}
    {grouped.map(({ kind, items: groupItems }) => {
      const config = kindConfig[kind];
      const Icon = config.icon;
      return <section key={kind} aria-labelledby={`attention-${kind}`} className="space-y-3"><div className="flex items-start gap-3"><div className={`rounded-xl p-2 ${config.tone === "danger" ? "bg-status-danger/10 text-status-danger" : config.tone === "warning" ? "bg-status-warning/10 text-status-warning" : "bg-primary/10 text-primary"}`}><Icon className="size-5" /></div><div><h2 id={`attention-${kind}`} className="font-semibold">{config.title} <span className="text-text-secondary">({groupItems.length})</span></h2><p className="text-sm text-text-secondary">{config.description}</p></div></div><div className="grid gap-3 lg:grid-cols-2">{groupItems.slice(0, 6).map((item) => <Card key={item.application.id} level={2}><CardContent className="space-y-4 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold">{item.application.candidate.fullName}</p><p className="truncate text-sm text-text-secondary">{item.application.vacancy.title} · {item.application.vacancy.branch?.name ?? "Sucursal no disponible"}</p></div><Badge variant={config.tone === "danger" ? "destructive" : config.tone === "warning" ? "warning" : "secondary"}>{item.label}</Badge></div><div className="grid gap-2 text-sm sm:grid-cols-2"><p><span className="font-medium">Etapa:</span> {item.application.currentStage?.name ?? "Sin etapa"}</p><p><span className="font-medium">Responsable:</span> {item.application.assignedRecruiter ? `${item.application.assignedRecruiter.firstName} ${item.application.assignedRecruiter.lastName}` : "Sin asignar"}</p><p><span className="font-medium">Antigüedad:</span> {item.age}</p><p><span className="font-medium">Última actividad:</span> {formatApplicationDate(item.application.updatedAt)}</p></div><p className="rounded-xl bg-surface-section p-3 text-sm"><span className="font-medium">Próxima acción:</span> {item.action}<span className="mt-1 block text-text-secondary">{item.detail}</span></p><Button asChild className="w-full" variant={config.tone === "danger" ? "default" : "secondary"}><Link href={item.href}>{item.action}<ArrowRight className="size-4" /></Link></Button></CardContent></Card>)}</div>{groupItems.length > 6 ? <Button asChild variant="ghost" size="sm"><Link href="/ats/candidates">Ver los {groupItems.length - 6} restantes en candidatos</Link></Button> : null}</section>;
    })}
    <Card level={1}><CardHeader><CardTitle>Accesos rápidos</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2"><Button asChild variant="secondary"><Link href="/ats/vacancies">Gestionar vacantes</Link></Button><Button asChild variant="secondary"><Link href="/ats/interviews">Abrir agenda de entrevistas</Link></Button><Button asChild variant="secondary"><Link href="/ats/scorecards">Ver scorecards</Link></Button></CardContent></Card>
  </div>;
}
