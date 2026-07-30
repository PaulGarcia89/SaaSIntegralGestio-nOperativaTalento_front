"use client";

import { Suspense, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Search } from "lucide-react";
import { AsyncState } from "@/components/async-state";
import { InlineFeedback, PageHeader } from "@/components/design-system";
import { CandidatePreviewDialog, FilterField, RecruitmentWorkspaceNav, StageChangeDialog } from "@/components/recruitment-workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { APPLICATION_STAGES, applicationNextAction, formatApplicationDate } from "@/lib/applications";
import { fetchApplications, updateApplication } from "@/lib/backend";
import type { ApplicationStatusKey, VacancyApplicationDto } from "@/lib/contracts";
import { trackProductEvent } from "@/lib/product-analytics";
import { useAppStore } from "@/store/app-store";

const ALL = "ALL";

function PipelineContent() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { currentBranch, can } = useAppStore();
  const search = params.get("q") ?? "";
  const vacancyId = params.get("vacancy") ?? ALL;
  const stageFilter = params.get("stage") ?? ALL;
  const age = params.get("age") ?? ALL;
  const [stageChange, setStageChange] = useState<{ application: VacancyApplicationDto; target: ApplicationStatusKey } | null>(null);
  const [preview, setPreview] = useState<VacancyApplicationDto | null>(null);
  const applications = useQuery({ queryKey: ["applications", currentBranch?.id], queryFn: () => fetchApplications({ branchId: currentBranch?.id }) });
  const move = useMutation({
    mutationFn: ({ application, status }: { application: VacancyApplicationDto; status: ApplicationStatusKey }) => updateApplication(application.id, { status, notes: application.notes ?? undefined }),
    onSuccess: async (_, variables) => {
      trackProductEvent({ name: "candidate_stage_changed", from: variables.application.status, to: variables.status });
      setStageChange(null);
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
  const allItems = useMemo(() => applications.data?.data ?? [], [applications.data]);
  const vacancies = useMemo(() => Array.from(new Map(allItems.map((item) => [item.vacancy.id, item.vacancy.title])).entries()).sort((a, b) => a[1].localeCompare(b[1], "es")), [allItems]);
  const filtered = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("es");
    const maximumDays = age === ALL ? null : Number(age);
    const now = applications.dataUpdatedAt;
    return allItems.filter((item) => {
      const matchesText = !normalized || `${item.candidate.fullName} ${item.candidate.email} ${item.vacancy.title}`.toLocaleLowerCase("es").includes(normalized);
      const matchesVacancy = vacancyId === ALL || item.vacancy.id === vacancyId;
      const matchesStage = stageFilter === ALL || item.status === stageFilter;
      const matchesAge = maximumDays === null || now - new Date(item.appliedAt).getTime() <= maximumDays * 86_400_000;
      return matchesText && matchesVacancy && matchesStage && matchesAge;
    });
  }, [age, allItems, applications.dataUpdatedAt, search, stageFilter, vacancyId]);

  function setFilter(name: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (!value || value === ALL) next.delete(name); else next.set(name, value);
    router.replace(`${pathname}${next.size ? `?${next.toString()}` : ""}`, { scroll: false });
    trackProductEvent({ name: "pipeline_filter_changed", filter: name, value, resultCount: filtered.length });
  }

  const card = (application: VacancyApplicationDto, compact = false) => <Card level={2} key={application.id}><CardContent className="space-y-3 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{application.candidate.fullName}</p><p className="text-sm text-text-secondary">{application.vacancy.title}</p></div>{compact ? <Badge variant="secondary">{APPLICATION_STAGES.find((stage) => stage.key === application.status)?.label}</Badge> : null}</div><div className="space-y-1 text-xs text-text-secondary"><p>Recibida: {formatApplicationDate(application.appliedAt)}</p><p><span className="font-medium text-text-primary">Siguiente:</span> {applicationNextAction(application.status)}</p></div>{can("applications.change_stage") ? <FilterField label="Mover a"><Select value={application.status} disabled={move.isPending} onValueChange={(status) => { if (status !== application.status) setStageChange({ application, target: status as ApplicationStatusKey }); }}><SelectTrigger aria-label={`Cambiar etapa de ${application.candidate.fullName}`}><SelectValue /></SelectTrigger><SelectContent>{APPLICATION_STAGES.map((option) => <SelectItem key={option.key} value={option.key}>{option.label}</SelectItem>)}</SelectContent></Select></FilterField> : null}<Button variant="secondary" className="w-full" onClick={() => { setPreview(application); trackProductEvent({ name: "candidate_profile_opened", source: "pipeline" }); }}><Eye className="size-4" />Vista rápida</Button></CardContent></Card>;

  return <div className="space-y-6">
    <PageHeader eyebrow="Reclutamiento" title="Candidatos" description="Revisa el trabajo pendiente y mueve postulaciones con contexto antes de confirmar." />
    <RecruitmentWorkspaceNav />
    <section aria-label="Filtros del pipeline" className="grid gap-3 rounded-2xl border border-border-default bg-surface-elevated p-4 md:grid-cols-2 xl:grid-cols-4">
      <FilterField label="Buscar"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" /><Input value={search} onChange={(event) => setFilter("q", event.target.value)} placeholder="Nombre, correo o vacante" className="pl-9" /></div></FilterField>
      <FilterField label="Vacante"><Select value={vacancyId} onValueChange={(value) => setFilter("vacancy", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Todas las vacantes</SelectItem>{vacancies.map(([id, title]) => <SelectItem key={id} value={id}>{title}</SelectItem>)}</SelectContent></Select></FilterField>
      <FilterField label="Etapa"><Select value={stageFilter} onValueChange={(value) => setFilter("stage", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Todas las etapas</SelectItem>{APPLICATION_STAGES.map((stage) => <SelectItem key={stage.key} value={stage.key}>{stage.label}</SelectItem>)}</SelectContent></Select></FilterField>
      <FilterField label="Fecha de postulación"><Select value={age} onValueChange={(value) => setFilter("age", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Cualquier fecha</SelectItem><SelectItem value="7">Últimos 7 días</SelectItem><SelectItem value="30">Últimos 30 días</SelectItem><SelectItem value="90">Últimos 90 días</SelectItem></SelectContent></Select></FilterField>
    </section>
    <p className="text-sm text-text-secondary" aria-live="polite">{filtered.length} {filtered.length === 1 ? "postulación encontrada" : "postulaciones encontradas"}</p>
    {applications.isLoading ? <AsyncState state="loading" title="Cargando pipeline" /> : null}
    {applications.isError ? <AsyncState state="error" title="No fue posible cargar el pipeline" onRetry={() => void applications.refetch()} /> : null}
    {move.isError ? <InlineFeedback tone="danger" title="No fue posible cambiar la etapa">La postulación conserva su estado anterior. Intenta nuevamente.</InlineFeedback> : null}
    {applications.isSuccess && !filtered.length ? <InlineFeedback tone="info" title="No hay resultados">Ajusta los filtros o elimina la búsqueda para ver más postulaciones.</InlineFeedback> : null}
    {applications.isSuccess && filtered.length ? <>
      <div className="space-y-5 lg:hidden">{APPLICATION_STAGES.map((stage) => { const items = filtered.filter((item) => item.status === stage.key); return items.length ? <section key={stage.key} aria-labelledby={`mobile-stage-${stage.key}`}><div className="mb-3 flex items-center justify-between"><h2 id={`mobile-stage-${stage.key}`} className="font-semibold">{stage.label}</h2><Badge variant="secondary">{items.length}</Badge></div><div className="grid gap-3 sm:grid-cols-2">{items.map((item) => card(item, true))}</div></section> : null; })}</div>
      <div className="hidden overflow-x-auto pb-4 lg:block"><div className="grid min-w-[1680px] grid-cols-7 gap-3" aria-label="Etapas del pipeline">{APPLICATION_STAGES.map((stage) => { const items = filtered.filter((item) => item.status === stage.key); return <section key={stage.key} className="rounded-2xl bg-surface-section p-3" aria-labelledby={`stage-${stage.key}`}><div className="mb-3 flex items-center justify-between"><h2 id={`stage-${stage.key}`} className="font-semibold">{stage.label}</h2><Badge variant="secondary">{items.length}</Badge></div><div className="space-y-3">{items.map((item) => card(item))}{!items.length ? <p className="rounded-xl border border-dashed p-4 text-center text-sm text-text-secondary">Sin postulaciones</p> : null}</div></section>; })}</div></div>
    </> : null}
    <StageChangeDialog application={stageChange?.application ?? null} targetStatus={stageChange?.target ?? null} open={Boolean(stageChange)} pending={move.isPending} onOpenChange={(open) => { if (!open) setStageChange(null); }} onConfirm={() => { if (stageChange) move.mutate({ application: stageChange.application, status: stageChange.target }); }} />
    <CandidatePreviewDialog application={preview} open={Boolean(preview)} onOpenChange={(open) => { if (!open) setPreview(null); }} />
  </div>;
}

export default function PipelinePage() {
  return <Suspense fallback={<AsyncState state="loading" title="Preparando pipeline" />}><PipelineContent /></Suspense>;
}
