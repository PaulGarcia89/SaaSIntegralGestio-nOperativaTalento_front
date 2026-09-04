"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Search } from "lucide-react";
import { toast } from "sonner";
import { AsyncState } from "@/components/async-state";
import { Pagination } from "@/components/design-system";
import { ReasonDialog } from "@/components/simple/reason-dialog";
import { MobileActionBar, PhaseChip, SimpleEmpty, SimpleHeader, SimpleScreen, SimpleSection, TAP_TARGET } from "@/components/simple/simple-ui";
import { fetchApplications, fetchRejectionReasons, fetchVacancies, fetchVacancySetup, undoApplicationTransition, updateApplication } from "@/lib/backend";
import type { ApplicationStatusKey, VacancyApplicationDto, VacancyStageDto } from "@/lib/contracts";
import {
  MAIN_PHASES,
  RECRUITMENT_PHASES,
  firstNameOf,
  groupByPhase,
  recruitmentPhase,
  recruitmentPhaseOf,
  stageMovesFor,
  waitingLabel,
  type RecruitmentPhaseId,
  type StageMove,
  phaseMeaning,
  phaseTitle,
} from "@/lib/recruitment-ux";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";

/**
 * "Postulaciones" — la fusión de Candidatos y Pipeline.
 *
 * Eran dos pantallas que mostraban lo mismo de dos maneras: una lista con siete
 * filtros y una tabla, y un tablero por etapas. Aquí hay una sola pantalla con
 * dos vistas de los mismos datos, tres filtros, y **una sola forma de mover a
 * alguien de fase**.
 *
 * Lo que se retiró y por qué:
 * - Arrastrar y soltar, el desplegable "Mover a" y el gesto de deslizar
 *   coexistían para la misma acción. Queda un botón que dice qué va a pasar.
 * - El desplegable ofrecía la etapa actual como opción, y un `if` la ignoraba
 *   en silencio. Ya no se ofrece.
 * - Los filtros de responsable, razón de descarte, SLA y tamaño de página
 *   salieron del camino principal: viven en "Más filtros", plegado.
 *
 * Lo que se conservó intacto: las transiciones válidas las decide el backend
 * (`allowedNextStageCodes`), el control de concurrencia (`expectedUpdatedAt`),
 * el motivo obligatorio al descartar y la posibilidad de deshacer.
 */

const ALL = "ALL";
const PHASE_STATUSES: Record<RecruitmentPhaseId, ApplicationStatusKey[]> = {
  POSTULARON: ["SUBMITTED", "REVIEWING"],
  CONOCIENDO: ["INTERVIEW"],
  DECIDIDO: ["APPROVED"],
  TRABAJANDO: ["HIRED", "TRAINING"],
  DESCARTADOS: ["REJECTED", "WITHDRAWN"],
};

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
}

function PersonCard({ application, moves, onMove, onReject, busy }: {
  application: VacancyApplicationDto;
  moves: { primary: StageMove | null; others: StageMove[] };
  onMove: (move: StageMove) => void;
  onReject: (move: StageMove) => void;
  busy: boolean;
}) {
  const { locale } = useLocale();
  const phase = recruitmentPhase(recruitmentPhaseOf(application.status));
  const name = application.candidate.fullName;

  return (
    <article className="rounded-2xl border border-border-default bg-surface-elevated p-4 sm:p-5">
      <div className="flex items-start gap-4">
        <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-semibold text-text-primary">
          {initials(name)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-semibold text-text-primary">{name}</h3>
          <p className="mt-1 text-text-primary">{application.vacancy.title}</p>
          <p className="mt-1 text-text-secondary">{application.vacancy.branch?.name ?? "Sin sucursal"}</p>
          <p className="mt-1 text-text-secondary">{waitingLabel(application.appliedAt)}</p>
          <div className="mt-3"><PhaseChip label={phaseTitle(phase.id, locale)} tone={phase.id === "DESCARTADOS" ? "neutral" : "waiting"} /></div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {moves.primary ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onMove(moves.primary!)}
            className={cn(TAP_TARGET, "flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 font-semibold text-text-on-accent disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus sm:w-auto")}
          >
            {moves.primary.label}
          </button>
        ) : null}

        <Link
          href={`/ats/candidates/${application.id}`}
          className={cn(TAP_TARGET, "flex w-full items-center justify-center gap-2 rounded-full border border-border-default px-5 font-semibold text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus sm:w-auto")}
        >
          Ver a {firstNameOf(name)}
          <ChevronRight className="size-5" aria-hidden="true" />
        </Link>
      </div>

      {moves.others.length ? (
        <div className="mt-3">
          <SimpleSection title="Otras opciones" hint={`${moves.others.length} disponible${moves.others.length === 1 ? "" : "s"}`}>
            <div className="flex flex-col gap-2">
              {moves.others.map((move) => (
                <button
                  key={move.stage.code}
                  type="button"
                  disabled={busy}
                  onClick={() => (move.needsReason ? onReject(move) : onMove(move))}
                  className={cn(TAP_TARGET, "rounded-full border px-5 font-semibold disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus", move.needsReason ? "border-status-danger/50 text-text-primary" : "border-border-default text-text-primary")}
                >
                  {move.label}
                </button>
              ))}
            </div>
          </SimpleSection>
        </div>
      ) : null}
    </article>
  );
}

function PeopleContent({ defaultView }: { defaultView: "lista" | "fases" }) {
  const { locale } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const client = useQueryClient();
  const { currentBranch } = useAppStore();

  const view = (params.get("view") as "lista" | "fases" | null) ?? defaultView;
  const search = params.get("q") ?? "";
  const vacancyId = params.get("vacancy") ?? ALL;
  const phase = (params.get("phase") as RecruitmentPhaseId | null) ?? null;
  const page = Math.max(1, Number(params.get("page") ?? 1));
  const [rejecting, setRejecting] = useState<{ application: VacancyApplicationDto; move: StageMove } | null>(null);

  const setParam = (name: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (!value || value === ALL) next.delete(name); else next.set(name, value);
    if (name !== "page") next.delete("page");
    router.replace(`${pathname}${next.size ? `?${next.toString()}` : ""}`, { scroll: false });
  };

  const applications = useQuery({
    queryKey: ["applications", "people", search, vacancyId, phase, page, currentBranch?.id],
    queryFn: () => fetchApplications({
      search: search || undefined,
      vacancyId: vacancyId === ALL ? undefined : vacancyId,
      status: phase ? PHASE_STATUSES[phase].join(",") : undefined,
      branchId: currentBranch?.id,
      page,
      pageSize: 20,
    }),
  });
  const vacancies = useQuery({ queryKey: ["vacancies", "people"], queryFn: fetchVacancies });
  const setup = useQuery({ queryKey: ["vacancy-setup", vacancyId], queryFn: () => fetchVacancySetup(vacancyId), enabled: vacancyId !== ALL });
  const rejectionReasons = useQuery({ queryKey: ["application-rejection-reasons"], queryFn: fetchRejectionReasons });

  const stages: VacancyStageDto[] = setup.data?.stages ?? [];
  const items = applications.data?.data ?? [];
  const meta = applications.data?.meta;

  const undo = useMutation({
    mutationFn: ({ applicationId, expectedUpdatedAt }: { applicationId: string; expectedUpdatedAt: string }) => undoApplicationTransition(applicationId, expectedUpdatedAt),
    onSuccess: async () => { toast.success("Listo, lo dejamos como estaba."); await client.invalidateQueries({ queryKey: ["applications"] }); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "No pudimos deshacer el cambio."),
  });

  const move = useMutation({
    mutationFn: ({ application, stage, reason, rejectionReasonId }: { application: VacancyApplicationDto; stage: VacancyStageDto; reason?: string; rejectionReasonId?: string }) =>
      updateApplication(application.id, {
        currentStageId: stage.id,
        reason,
        rejectionReasonId,
        notes: application.notes ?? undefined,
        expectedUpdatedAt: application.updatedAt,
      }),
    onSuccess: async (updated, variables) => {
      await client.invalidateQueries({ queryKey: ["applications"] });
      toast.success(`Listo. ${firstNameOf(variables.application.candidate.fullName)} pasó a ${variables.stage.name}.`, {
        action: { label: "Deshacer", onClick: () => undo.mutate({ applicationId: updated.id, expectedUpdatedAt: updated.updatedAt }) },
      });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "No pudimos mover a esta persona. Inténtalo otra vez."),
  });

  const renderCard = (application: VacancyApplicationDto) => (
    <PersonCard
      key={application.id}
      application={application}
      moves={stageMovesFor(application, stages)}
      busy={move.isPending}
      onMove={(selected) => move.mutate({ application, stage: selected.stage })}
      onReject={(selected) => setRejecting({ application, move: selected })}
    />
  );

  const selectClass = cn(TAP_TARGET, "w-full rounded-xl border border-border-default bg-surface-elevated px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus");

  return (
    <SimpleScreen>
      <SimpleHeader title="Postulaciones" help="Todas las postulaciones que están en algún punto del proceso. Elige cuál quieres ver." />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Cómo ver las postulaciones">
        {(["lista", "fases"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={view === option}
            onClick={() => setParam("view", option)}
            className={cn(TAP_TARGET, "rounded-full border px-5 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus", view === option ? "border-primary bg-primary text-text-on-accent" : "border-border-default bg-surface-elevated text-text-primary")}
          >
            {option === "lista" ? "En una lista" : "Por fases"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="space-y-2 font-medium text-text-primary" htmlFor="people-search">
          Buscar una persona
          <span className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
            <input
              id="people-search"
              value={search}
              onChange={(event) => setParam("q", event.target.value)}
              placeholder="Nombre o correo"
              className={cn(TAP_TARGET, "w-full rounded-xl border border-border-default bg-surface-elevated pl-10 pr-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus")}
            />
          </span>
        </label>

        <label className="space-y-2 font-medium text-text-primary" htmlFor="people-vacancy">
          Puesto
          <select id="people-vacancy" aria-label="Filtrar por puesto" value={vacancyId} onChange={(event) => setParam("vacancy", event.target.value)} className={selectClass}>
            <option value={ALL}>Todos los puestos</option>
            {(vacancies.data?.data ?? []).map((vacancy) => <option key={vacancy.id} value={vacancy.id}>{vacancy.title}</option>)}
          </select>
        </label>

        <label className="space-y-2 font-medium text-text-primary" htmlFor="people-phase">
          Fase
          <select id="people-phase" aria-label="Filtrar por fase" value={phase ?? ALL} onChange={(event) => setParam("phase", event.target.value)} className={selectClass}>
            <option value={ALL}>Todas las fases</option>
            {RECRUITMENT_PHASES.map((entry) => <option key={entry.id} value={entry.id}>{phaseTitle(entry.id, locale)}</option>)}
          </select>
        </label>
      </div>

      {vacancyId === ALL ? (
        <p className="text-text-secondary">
          Elige un puesto arriba si quieres mover a alguien de fase: cada puesto tiene sus propios pasos.
        </p>
      ) : null}

      {applications.isLoading ? <AsyncState state="loading" title="Buscando postulaciones" /> : null}
      {applications.isError ? <AsyncState state="error" title="No pudimos cargar las postulaciones" onRetry={() => void applications.refetch()} /> : null}

      {applications.isSuccess && !items.length ? (
        <SimpleEmpty
          title={search || vacancyId !== ALL || phase ? "No encontramos a nadie con esos criterios" : "Todavía no hay nadie en el proceso"}
          help={search || vacancyId !== ALL || phase
            ? "Prueba a quitar el puesto o la fase, o busca con otro nombre."
            : "Cuando alguien se postule a uno de tus puestos, aparecerá aquí."}
        />
      ) : null}

      {applications.isSuccess && items.length && view === "lista" ? (
        <div className="space-y-4">{items.map(renderCard)}</div>
      ) : null}

      {applications.isSuccess && items.length && view === "fases" ? (
        <div className="space-y-6">
          {MAIN_PHASES.map((entry) => {
            const people = groupByPhase(items)[entry.id];
            return (
              <section key={entry.id} aria-labelledby={`fase-${entry.id}`} className="space-y-3">
                <div>
                  <h2 id={`fase-${entry.id}`} className="text-2xl font-semibold text-text-primary">
                    {entry.step}. {phaseTitle(entry.id, locale)}
                    <span className="ml-2 text-text-secondary">({people.length})</span>
                  </h2>
                  <p className="text-text-secondary">{phaseMeaning(entry.id, locale)}</p>
                </div>
                {people.length ? people.map(renderCard) : <p className="rounded-2xl border border-dashed border-border-default p-4 text-text-secondary">Nadie en esta fase por ahora.</p>}
              </section>
            );
          })}
        </div>
      ) : null}

      {meta && meta.totalPages > 1 ? (
        <Pagination page={meta.page - 1} totalPages={meta.totalPages} totalItems={meta.total} pageSize={meta.pageSize} onPageChange={(next) => setParam("page", String(next + 1))} />
      ) : null}

      <SimpleSection title="Herramientas avanzadas" hint="Acciones en lote, exportar y automatizaciones">
        <p className="mb-3 text-text-secondary">
          Estas pantallas son más densas y están pensadas para quien ya conoce el sistema. Nada de lo que había se perdió: sigue aquí.
        </p>
        <div className="flex flex-col gap-2">
          <Link href="/ats/candidates/avanzado" className={cn(TAP_TARGET, "flex items-center justify-center rounded-full border border-border-default px-5 font-semibold text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus")}>
            Lista avanzada: filtros, acciones en lote y exportar
          </Link>
          <Link href="/ats/pipeline/avanzado" className={cn(TAP_TARGET, "flex items-center justify-center rounded-full border border-border-default px-5 font-semibold text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus")}>
            Tablero avanzado: arrastrar y soltar, aprobaciones y automatizaciones
          </Link>
        </div>
      </SimpleSection>

      <MobileActionBar>
        <Link href="/ats" className={cn(TAP_TARGET, "flex w-full items-center justify-center rounded-full bg-primary px-5 font-semibold text-text-on-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus")}>
          Volver a Hoy
        </Link>
      </MobileActionBar>

      <ReasonDialog
        open={Boolean(rejecting)}
        title={rejecting ? `Descartar a ${firstNameOf(rejecting.application.candidate.fullName)}` : "Descartar"}
        description="La persona dejará de avanzar en el proceso. El motivo queda guardado en su historial."
        confirmLabel="Sí, descartar"
        options={rejectionReasons.data?.map((reason) => ({ id: reason.id, label: reason.label }))}
        onOpenChange={(open) => !open && setRejecting(null)}
        onConfirm={({ reasonId, reason }) => {
          if (rejecting) move.mutate({ application: rejecting.application, stage: rejecting.move.stage, reason, rejectionReasonId: reasonId });
          setRejecting(null);
        }}
      />
    </SimpleScreen>
  );
}

export function PeopleWorkspace({ defaultView = "lista" }: { defaultView?: "lista" | "fases" }) {
  return (
    <Suspense fallback={<AsyncState state="loading" title="Preparando la lista de postulaciones" />}>
      <PeopleContent defaultView={defaultView} />
    </Suspense>
  );
}
