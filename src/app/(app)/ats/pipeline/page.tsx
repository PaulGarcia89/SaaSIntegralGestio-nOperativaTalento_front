"use client";

import { Suspense, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Clock3, Eye, Search, X } from "lucide-react";
import { AsyncState } from "@/components/async-state";
import { InlineFeedback, PageHeader, Pagination } from "@/components/design-system";
import {
  CandidatePreviewDialog,
  FilterField,
  RecruitmentWorkspaceNav,
  StageChangeDialog,
} from "@/components/recruitment-workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { applicationNextAction, currentApplicationStage, formatApplicationDate } from "@/lib/applications";
import {
  fetchApplications,
  fetchVacancies,
  fetchVacancySetup,
  decideApplicationTransition,
  fetchRejectionReasons,
  updateApplication,
} from "@/lib/backend";
import type { VacancyApplicationDto, VacancyStageDto } from "@/lib/contracts";
import { trackProductEvent } from "@/lib/product-analytics";
import { useAppStore } from "@/store/app-store";

const ALL = "ALL";

function PipelineContent() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { currentBranch, currentUser, can } = useAppStore();
  const search = params.get("q") ?? "";
  const requestedVacancyId = params.get("vacancy") ?? ALL;
  const stageFilter = params.get("stage") ?? ALL;
  const age = params.get("age") ?? ALL;
  const page = Math.max(1, Number(params.get("page") ?? 1));
  const [stageChange, setStageChange] = useState<{
    application: VacancyApplicationDto;
    target: VacancyStageDto;
  } | null>(null);
  const [preview, setPreview] = useState<VacancyApplicationDto | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const vacanciesQuery = useQuery({
    queryKey: ["vacancies", "pipeline"],
    queryFn: fetchVacancies,
  });
  const vacancies = vacanciesQuery.data?.data ?? [];
  const effectiveVacancyId =
    requestedVacancyId !== ALL
      ? requestedVacancyId
      : vacancies[0]?.id;
  const setup = useQuery({
    queryKey: ["vacancy-setup", effectiveVacancyId],
    queryFn: () => fetchVacancySetup(effectiveVacancyId!),
    enabled: Boolean(effectiveVacancyId),
  });
  const applications = useQuery({
    queryKey: ["applications", currentBranch?.id, effectiveVacancyId, search, stageFilter, age, page],
    queryFn: () =>
      fetchApplications({
        branchId: currentBranch?.id,
        vacancyId: effectiveVacancyId,
        search: search || undefined,
        currentStageId: stageFilter === ALL ? undefined : stageFilter,
        appliedFrom: age === ALL ? undefined : new Date(Date.now() - Number(age) * 86_400_000).toISOString().slice(0, 10),
        page,
        pageSize: 100,
      }),
    enabled: Boolean(effectiveVacancyId),
  });
  const rejectionReasons = useQuery({ queryKey: ["application-rejection-reasons"], queryFn: fetchRejectionReasons });

  const stages = useMemo(
    () => [...(setup.data?.stages ?? [])].sort((a, b) => a.position - b.position),
    [setup.data?.stages],
  );
  const filtered = applications.data?.data ?? [];

  const move = useMutation({
    mutationFn: ({ application, stage, reason, rejectionReasonId }: { application: VacancyApplicationDto; stage: VacancyStageDto; reason?: string; rejectionReasonId?: string }) =>
      updateApplication(application.id, {
        currentStageId: stage.id,
        reason,
        rejectionReasonId,
        notes: application.notes ?? undefined,
      }),
    onSuccess: async (_, variables) => {
      trackProductEvent({
        name: "candidate_stage_changed",
        from: variables.application.currentStage?.name ?? variables.application.status,
        to: variables.stage.name,
      });
      setStageChange(null);
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });

  const decide = useMutation({
    mutationFn: ({ applicationId, requestId, approved }: { applicationId: string; requestId: string; approved: boolean }) =>
      decideApplicationTransition(applicationId, requestId, approved),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });

  function setFilter(name: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (!value || value === ALL) next.delete(name);
    else next.set(name, value);
    if (name === "vacancy") next.delete("stage");
    router.replace(`${pathname}${next.size ? `?${next.toString()}` : ""}`, { scroll: false });
  }

  const card = (application: VacancyApplicationDto, compact = false) => {
    const currentStage = currentApplicationStage(application, stages);
    const currentStageId = currentStage?.id ?? null;
    const allowedCodes = currentStage?.allowedNextStageCodes ?? [];
    const movableStages = stages.filter(
      (stage) => stage.applicationStatus !== "HIRED" && allowedCodes.includes(stage.code),
    );
    const pendingTransition = application.pendingTransitions?.[0];
    return (
      <Card level={2} key={application.id}>
        <CardContent
          className={`space-y-3 p-4 transition-opacity ${draggingId === application.id ? "opacity-50" : ""}`}
          draggable={can("applications.change_stage")}
          onDragStart={(event) => {
            if (!can("applications.change_stage")) return;
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("application-id", application.id);
            setDraggingId(application.id);
          }}
          onDragEnd={() => setDraggingId(null)}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{application.candidate.fullName}</p>
              <p className="text-sm text-text-secondary">{application.vacancy.title}</p>
            </div>
            {compact ? <Badge variant="secondary">{currentStage?.name ?? "Sin etapa"}</Badge> : null}
          </div>
          <div className="space-y-1 text-xs text-text-secondary">
            <p>Recibida: {formatApplicationDate(application.appliedAt)}</p>
            <p><span className="font-medium text-text-primary">Siguiente:</span> {applicationNextAction(application.status)}</p>
            {application.stageDueAt ? <p className={application.isStageOverdue ? "font-medium text-status-danger" : ""}><Clock3 className="mr-1 inline size-3.5" />{application.isStageOverdue ? "SLA vencido" : `SLA: ${formatApplicationDate(application.stageDueAt)}`}</p> : null}
          </div>
          {pendingTransition ? <div className="space-y-2 rounded-xl border border-status-warning/30 bg-status-warning/5 p-3 text-xs"><p className="font-medium">Pendiente: {pendingTransition.toStage.name}</p><p>{pendingTransition.approvals.length}/{pendingTransition.requiredApprovals} aprobaciones</p>{can("applications.change_stage") && pendingTransition.requestedByUserId !== currentUser.id ? <div className="flex gap-2"><Button size="sm" onClick={() => decide.mutate({ applicationId: application.id, requestId: pendingTransition.id, approved: true })} disabled={decide.isPending}><Check className="size-3.5" />Aprobar</Button><Button size="sm" variant="secondary" onClick={() => decide.mutate({ applicationId: application.id, requestId: pendingTransition.id, approved: false })} disabled={decide.isPending}><X className="size-3.5" />Rechazar</Button></div> : <p>La solicitud debe resolverla otro responsable.</p>}</div> : null}
          {can("applications.change_stage") && application.status !== "HIRED" && movableStages.length ? (
            <FilterField label="Mover a">
              <Select
                value={currentStageId ?? undefined}
                disabled={move.isPending}
                onValueChange={(stageId) => {
                  const target = stages.find((stage) => stage.id === stageId);
                  if (target && target.id !== currentStageId) {
                    setStageChange({ application, target });
                  }
                }}
              >
                <SelectTrigger aria-label={`Cambiar etapa de ${application.candidate.fullName}`}>
                  <SelectValue placeholder="Selecciona una etapa" />
                </SelectTrigger>
                <SelectContent>
                  {currentStage ? <SelectItem value={currentStage.id!}>{currentStage.name} (actual)</SelectItem> : null}
                  {movableStages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id!}>{stage.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>
          ) : null}
          {can("applications.change_stage") && application.status !== "HIRED" && !movableStages.length && !pendingTransition ? <p className="text-xs text-text-secondary">No hay transiciones habilitadas desde esta etapa.</p> : null}
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              setPreview(application);
              trackProductEvent({ name: "candidate_profile_opened", source: "pipeline" });
            }}
          >
            <Eye className="size-4" />Vista rápida
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (vacanciesQuery.isLoading) return <AsyncState state="loading" title="Cargando vacantes" />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reclutamiento"
        title="Flujo de selección por vacante"
        description="Opera las etapas personalizadas definidas para cada proceso de selección."
      />
      <RecruitmentWorkspaceNav />
      <section aria-label="Filtros del pipeline" className="grid gap-3 rounded-2xl border border-border-default bg-surface-elevated p-4 md:grid-cols-2 xl:grid-cols-4">
        <FilterField label="Buscar">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" />
            <Input value={search} onChange={(event) => setFilter("q", event.target.value)} placeholder="Nombre o correo" className="pl-9" />
          </div>
        </FilterField>
        <FilterField label="Vacante">
          <Select value={effectiveVacancyId ?? ALL} onValueChange={(value) => setFilter("vacancy", value)}>
            <SelectTrigger><SelectValue placeholder="Selecciona una vacante" /></SelectTrigger>
            <SelectContent>
              {vacancies.map((vacancy) => (
                <SelectItem key={vacancy.id} value={vacancy.id}>{vacancy.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
        <FilterField label="Etapa">
          <Select value={stageFilter} onValueChange={(value) => setFilter("stage", value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas las etapas</SelectItem>
              {stages.map((stage) => <SelectItem key={stage.id} value={stage.id!}>{stage.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </FilterField>
        <FilterField label="Fecha de postulación">
          <Select value={age} onValueChange={(value) => setFilter("age", value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Cualquier fecha</SelectItem>
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
            </SelectContent>
          </Select>
        </FilterField>
      </section>

      {!vacancies.length ? <InlineFeedback tone="info" title="No hay vacantes">Crea una vacante para configurar su flujo de selección.</InlineFeedback> : null}
      {setup.isLoading || applications.isLoading ? <AsyncState state="loading" title="Cargando pipeline" /> : null}
      {setup.isError || applications.isError ? <AsyncState state="error" title="No fue posible cargar el pipeline" onRetry={() => { void setup.refetch(); void applications.refetch(); }} /> : null}
      {move.isError ? <InlineFeedback tone="danger" title="No fue posible cambiar la etapa">{move.error instanceof Error ? move.error.message : "La postulación conserva su etapa anterior."}</InlineFeedback> : null}
      {decide.isError ? <InlineFeedback tone="danger" title="No fue posible registrar la aprobación">{decide.error instanceof Error ? decide.error.message : "Intenta nuevamente."}</InlineFeedback> : null}
      {setup.isSuccess && !stages.length ? <InlineFeedback tone="warning" title="Vacante sin etapas">Configura las etapas de esta vacante antes de operar candidatos.</InlineFeedback> : null}

      {stages.length ? (
        <>
          <p className="text-sm text-text-secondary" aria-live="polite">{applications.data?.meta.total ?? 0} {(applications.data?.meta.total ?? 0) === 1 ? "postulación encontrada" : "postulaciones encontradas"}</p>
          <div className="space-y-5 lg:hidden">
            {stages.map((stage) => {
              const items = filtered.filter((item) => currentApplicationStage(item, stages)?.id === stage.id);
              return (
                <section key={stage.id} aria-labelledby={`mobile-stage-${stage.id}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 id={`mobile-stage-${stage.id}`} className="font-semibold">{stage.name}</h2>
                    <Badge variant="secondary">{items.length}</Badge>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {items.map((item) => card(item, true))}
                    {!items.length ? <p className="rounded-xl border border-dashed p-4 text-center text-sm text-text-secondary">Sin postulaciones</p> : null}
                  </div>
                </section>
              );
            })}
          </div>
          <div className="hidden overflow-x-auto pb-4 lg:block">
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: `repeat(${stages.length}, minmax(240px, 1fr))`,
                minWidth: `${Math.max(stages.length * 255, 900)}px`,
              }}
              aria-label="Etapas personalizadas del pipeline"
            >
              {stages.map((stage) => {
                const items = filtered.filter((item) => currentApplicationStage(item, stages)?.id === stage.id);
                return (
                  <section
                    key={stage.id}
                    className={`rounded-2xl bg-surface-section p-3 transition-colors ${draggingId ? "outline outline-2 outline-dashed outline-primary/30" : ""}`}
                    aria-labelledby={`stage-${stage.id}`}
                    onDragOver={(event) => {
                      if (!draggingId) return;
                      event.preventDefault();
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const applicationId = event.dataTransfer.getData("application-id") || draggingId;
                      const application = filtered.find((item) => item.id === applicationId);
                      if (!application || !can("applications.change_stage")) return;
                      const currentStage = currentApplicationStage(application, stages);
                      if (currentStage?.id === stage.id) return;
                      setStageChange({ application, target: stage });
                      setDraggingId(null);
                    }}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h2 id={`stage-${stage.id}`} className="font-semibold">{stage.name}</h2>
                      <Badge variant="secondary">{items.length}</Badge>
                    </div>
                    <p className="mb-3 text-xs text-text-secondary">Suelta una tarjeta aquí para moverla.</p>
                    <div className="space-y-3">
                      {items.map((item) => card(item))}
                      {!items.length ? <p className="rounded-xl border border-dashed p-4 text-center text-sm text-text-secondary">Sin postulaciones</p> : null}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
          {applications.data?.meta && applications.data.meta.totalPages > 1 ? <Pagination page={applications.data.meta.page - 1} totalPages={applications.data.meta.totalPages} totalItems={applications.data.meta.total} pageSize={applications.data.meta.pageSize} onPageChange={(next) => setFilter("page", String(next + 1))} /> : null}
        </>
      ) : null}

      <StageChangeDialog
        application={stageChange?.application ?? null}
        targetStage={stageChange?.target ?? null}
        rejectionReasons={rejectionReasons.data}
        open={Boolean(stageChange)}
        pending={move.isPending}
        onOpenChange={(open) => { if (!open) setStageChange(null); }}
        onConfirm={(reason, rejectionReasonId) => {
          if (stageChange) move.mutate({ application: stageChange.application, stage: stageChange.target, reason, rejectionReasonId });
        }}
      />
      <CandidatePreviewDialog application={preview} open={Boolean(preview)} onOpenChange={(open) => { if (!open) setPreview(null); }} />
    </div>
  );
}

export default function PipelinePage() {
  return <Suspense fallback={<AsyncState state="loading" title="Preparando pipeline" />}><PipelineContent /></Suspense>;
}
