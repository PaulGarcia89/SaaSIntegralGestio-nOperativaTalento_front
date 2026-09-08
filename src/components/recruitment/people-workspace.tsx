"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { ReasonDialog } from "@/components/simple/reason-dialog";
import { MobileActionBar, SimpleSection } from "@/components/simple/simple-ui";
import {
  EmptyState,
  ErrorState,
  FilterBar,
  PageHeader,
  Pagination,
  SkeletonRows,
  StatusBadge,
} from "@/components/system";
import { Button } from "@/components/ui/button";
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
 * "Personas" — la fusión de Candidatos y Pipeline.
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
 *
 * Qué cambió con el rediseño visual
 * ---------------------------------
 * La ficha de persona pasa de tarjeta apilada a FILA: en escritorio se lee como
 * una tabla —nombre, puesto, fase, espera y acciones en columnas alineadas— y
 * por debajo de `md` vuelve a apilarse. Antes cada persona ocupaba ~190px de
 * alto en cualquier ancho, así que en un monitor amplio cabían cuatro personas
 * y había que desplazarse para comparar. No se usa `DataView` porque cada fila
 * tiene varias acciones y una sección plegable, y eso dentro de una celda de
 * `<table>` es peor que una fila compuesta.
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

/** Clase compartida de los desplegables nativos.
 *
 *  Se conserva `<select>` nativo a propósito: en un teléfono abre el selector
 *  del sistema operativo, que es más usable que cualquier lista a medida.
 *  `text-base` evita el zoom automático de Safari al enfocarlo. */
const SELECT_CLASS = cn(
  "w-full min-w-0 rounded-md border border-line-control bg-surface-1 px-3",
  "min-h-[var(--control-h-touch)] sm:min-h-[var(--control-h-base)]",
  "text-base text-ink-1 sm:text-sm",
);

function PersonRow({ application, moves, onMove, onReject, busy }: {
  application: VacancyApplicationDto;
  moves: { primary: StageMove | null; others: StageMove[] };
  onMove: (move: StageMove) => void;
  onReject: (move: StageMove) => void;
  busy: boolean;
}) {
  const { locale, t } = useLocale();
  const phase = recruitmentPhase(recruitmentPhaseOf(application.status));
  const name = application.candidate.fullName;

  return (
    <article className="rounded-lg border border-line bg-surface-1 p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        {/* Identidad */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-2 font-display text-sm font-semibold text-ink-2"
          >
            {initials(name)}
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-ink-1">{name}</h3>
            <p className="truncate text-sm text-ink-2">{application.vacancy.title}</p>
            <p className="truncate text-xs text-ink-3 md:hidden">
              {application.vacancy.branch?.name ?? t("people.noBranch")} · {waitingLabel(application.appliedAt)}
            </p>
          </div>
        </div>

        {/* Contexto: en escritorio son dos columnas alineadas; en móvil ya se
            mostró bajo el nombre, así que aquí se oculta. */}
        <div className="hidden w-40 shrink-0 md:block">
          <p className="truncate text-sm text-ink-2">{application.vacancy.branch?.name ?? t("people.noBranch")}</p>
          <p className="truncate font-mono text-xs text-ink-3 tabular-figures">{waitingLabel(application.appliedAt)}</p>
        </div>

        <div className="shrink-0 md:w-36">
          <StatusBadge
            label={phaseTitle(phase.id, locale)}
            tone={phase.id === "DESCARTADOS" ? "neutral" : phase.id === "TRABAJANDO" ? "success" : "progress"}
          />
        </div>

        {/* Acciones: una principal y el enlace a la ficha. */}
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:justify-end">
          {moves.primary ? (
            <Button type="button" disabled={busy} onClick={() => onMove(moves.primary!)}>
              {moves.primary.label}
            </Button>
          ) : null}
          <Button asChild variant="secondary">
            <Link href={`/ats/candidates/${application.id}`}>
              {t("people.seePerson", { name: firstNameOf(name, locale) })}
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>

      {moves.others.length ? (
        <div className="mt-3">
          <SimpleSection
            title={t("people.otherOptions")}
            hint={moves.others.length === 1 ? t("people.availableOne") : t("people.availableMany", { count: moves.others.length })}
          >
            <div className="flex flex-wrap gap-2">
              {moves.others.map((move) => (
                <Button
                  key={move.stage.code}
                  type="button"
                  variant={move.needsReason ? "destructive" : "secondary"}
                  disabled={busy}
                  onClick={() => (move.needsReason ? onReject(move) : onMove(move))}
                >
                  {move.label}
                </Button>
              ))}
            </div>
          </SimpleSection>
        </div>
      ) : null}
    </article>
  );
}

function PeopleContent({ defaultView }: { defaultView: "lista" | "fases" }) {
  const { locale, t } = useLocale();
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
  const activeFilters = [search ? 1 : 0, vacancyId !== ALL ? 1 : 0, phase ? 1 : 0].reduce((a, b) => a + b, 0);

  const undo = useMutation({
    mutationFn: ({ applicationId, expectedUpdatedAt }: { applicationId: string; expectedUpdatedAt: string }) => undoApplicationTransition(applicationId, expectedUpdatedAt),
    onSuccess: async () => { toast.success(t("people.undone")); await client.invalidateQueries({ queryKey: ["applications"] }); },
    onError: (error) => toast.error(error instanceof Error ? error.message : t("people.undoFailed")),
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
    onError: (error) => toast.error(error instanceof Error ? error.message : t("people.moveFailed")),
  });

  const renderRow = (application: VacancyApplicationDto) => (
    <PersonRow
      key={application.id}
      application={application}
      moves={stageMovesFor(application, stages)}
      busy={move.isPending}
      onMove={(selected) => move.mutate({ application, stage: selected.stage })}
      onReject={(selected) => setRejecting({ application, move: selected })}
    />
  );

  return (
    <div className="space-y-5 pb-4">
      <PageHeader
        eyebrow="Reclutamiento"
        title={t("people.title")}
        description={t("people.help")}
        actions={
          <div className="flex gap-1 rounded-md border border-line bg-surface-2 p-1" role="tablist" aria-label={t("people.viewsAria")}>
            {(["lista", "fases"] as const).map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={view === option}
                onClick={() => setParam("view", option)}
                className={cn(
                  "rounded-sm px-3 text-sm font-medium transition-colors",
                  "min-h-[calc(var(--control-h-base)-0.5rem)]",
                  view === option ? "bg-surface-1 text-ink-1 shadow-e1" : "text-ink-2 hover:text-ink-1",
                )}
              >
                {option === "lista" ? t("people.viewList") : t("people.viewPhases")}
              </button>
            ))}
          </div>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={(value) => setParam("q", value)}
        searchLabel={t("people.searchPlaceholder")}
        activeCount={activeFilters}
        onClear={() => {
          const next = new URLSearchParams(params.toString());
          ["q", "vacancy", "phase", "page"].forEach((name) => next.delete(name));
          router.replace(`${pathname}${next.size ? `?${next.toString()}` : ""}`, { scroll: false });
        }}
      >
        <label className="min-w-0 flex-1 space-y-1.5 sm:max-w-56" htmlFor="people-vacancy">
          <span className="block text-xs font-medium text-ink-2">{t("people.vacancy")}</span>
          <select
            id="people-vacancy"
            aria-label={t("people.filterVacancy")}
            value={vacancyId}
            onChange={(event) => setParam("vacancy", event.target.value)}
            className={SELECT_CLASS}
          >
            <option value={ALL}>{t("people.allVacancies")}</option>
            {(vacancies.data?.data ?? []).map((vacancy) => (
              <option key={vacancy.id} value={vacancy.id}>{vacancy.title}</option>
            ))}
          </select>
        </label>

        <label className="min-w-0 flex-1 space-y-1.5 sm:max-w-48" htmlFor="people-phase">
          <span className="block text-xs font-medium text-ink-2">{t("people.phase")}</span>
          <select
            id="people-phase"
            aria-label={t("people.filterPhase")}
            value={phase ?? ALL}
            onChange={(event) => setParam("phase", event.target.value)}
            className={SELECT_CLASS}
          >
            <option value={ALL}>{t("people.allPhases")}</option>
            {RECRUITMENT_PHASES.map((entry) => (
              <option key={entry.id} value={entry.id}>{phaseTitle(entry.id, locale)}</option>
            ))}
          </select>
        </label>
      </FilterBar>

      {/* Sin vacante elegida no se sabe qué etapas tiene el proceso, así que no
          hay acción principal que ofrecer. Se dice, en vez de mostrar filas sin
          botón y dejar que el usuario deduzca por qué. */}
      {vacancyId === ALL ? <p className="text-sm text-ink-3">{t("people.pickVacancyHint")}</p> : null}

      {applications.isLoading ? <SkeletonRows rows={5} label={t("people.loading")} /> : null}
      {applications.isError ? (
        <ErrorState title={t("people.errorTitle")} onRetry={() => void applications.refetch()} />
      ) : null}

      {applications.isSuccess && items.length === 0 ? (
        <EmptyState
          reason={activeFilters > 0 ? "no-matches" : "no-records"}
          title={activeFilters > 0 ? t("people.noMatches") : t("people.emptyTitle")}
          description={activeFilters > 0 ? t("people.noMatchesHelp") : t("people.emptyHelp")}
          onClearFilters={
            activeFilters > 0
              ? () => {
                  const next = new URLSearchParams(params.toString());
                  ["q", "vacancy", "phase", "page"].forEach((name) => next.delete(name));
                  router.replace(`${pathname}${next.size ? `?${next.toString()}` : ""}`, { scroll: false });
                }
              : undefined
          }
        />
      ) : null}

      {applications.isSuccess && items.length > 0 && view === "lista" ? (
        <div className="space-y-2">{items.map(renderRow)}</div>
      ) : null}

      {applications.isSuccess && items.length > 0 && view === "fases" ? (
        <div className="space-y-6">
          {MAIN_PHASES.map((entry) => {
            const people = groupByPhase(items)[entry.id];
            return (
              <section key={entry.id} aria-labelledby={`fase-${entry.id}`} className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-2">
                  <div className="min-w-0">
                    <h2 id={`fase-${entry.id}`} className="text-base font-semibold text-ink-1">
                      <span className="font-mono text-ink-3 tabular-figures">{entry.step}.</span>{" "}
                      {phaseTitle(entry.id, locale)}
                    </h2>
                    <p className="text-sm text-ink-2">{phaseMeaning(entry.id, locale)}</p>
                  </div>
                  <span className="font-mono text-lg font-semibold text-ink-1 tabular-figures">{people.length}</span>
                </div>
                {people.length ? (
                  <div className="space-y-2">{people.map(renderRow)}</div>
                ) : (
                  <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-ink-2">
                    {t("people.noneInPhase")}
                  </p>
                )}
              </section>
            );
          })}
        </div>
      ) : null}

      {meta ? (
        <Pagination
          page={meta.page - 1}
          pageSize={meta.pageSize}
          totalItems={meta.total}
          onPageChange={(next) => setParam("page", String(next + 1))}
        />
      ) : null}

      <SimpleSection title={t("people.advancedTools")} hint={t("people.advancedHint")}>
        <p className="mb-3 text-sm text-ink-2">
          Estas pantallas son más densas y están pensadas para quien ya conoce el sistema. Nada de lo que había se perdió: sigue aquí.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="secondary">
            <Link href="/ats/candidates/avanzado">Lista avanzada: filtros, acciones en lote y exportar</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/ats/pipeline/avanzado">Tablero avanzado: arrastrar y soltar, aprobaciones y automatizaciones</Link>
          </Button>
        </div>
      </SimpleSection>

      <MobileActionBar>
        <Button asChild size="lg" className="w-full">
          <Link href="/ats/dashboard">Volver al dashboard</Link>
        </Button>
      </MobileActionBar>

      <ReasonDialog
        open={Boolean(rejecting)}
        title={rejecting ? `Descartar a ${firstNameOf(rejecting.application.candidate.fullName)}` : "Descartar"}
        description={t("people.rejectDescription")}
        confirmLabel={t("people.confirmReject")}
        options={rejectionReasons.data?.map((reason) => ({ id: reason.id, label: reason.label }))}
        onOpenChange={(open) => !open && setRejecting(null)}
        onConfirm={({ reasonId, reason }) => {
          if (rejecting) move.mutate({ application: rejecting.application, stage: rejecting.move.stage, reason, rejectionReasonId: reasonId });
          setRejecting(null);
        }}
      />
    </div>
  );
}

export function PeopleWorkspace({ defaultView = "lista" }: { defaultView?: "lista" | "fases" }) {
  const { t } = useLocale();
  return (
    <Suspense fallback={<SkeletonRows rows={5} label={t("people.preparing")} />}>
      <PeopleContent defaultView={defaultView} />
    </Suspense>
  );
}
