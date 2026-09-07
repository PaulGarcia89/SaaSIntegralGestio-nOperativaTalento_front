"use client";

import Link from "next/link";
import { useQueries, useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { MobileActionBar, TaskCard } from "@/components/simple/simple-ui";
import {
  ErrorState,
  EmptyState,
  PageHeader,
  PageSection,
  SkeletonRows,
  StatusBadge,
} from "@/components/system";
import { fetchApplications, fetchOperationalDashboard } from "@/lib/backend";
import type { ApplicationStatusKey } from "@/lib/contracts";
import { MAIN_PHASES, phaseTitle, phaseMeaning, toTodayItems, type RecruitmentPhaseId } from "@/lib/recruitment-ux";
import { useLocale } from "@/components/locale-provider";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { seriesColorClass } from "@/components/chart";

/**
 * "Hoy" — la única bandeja de trabajo del módulo.
 *
 * Sustituye a "Requiere atención", que descargaba 100 postulaciones y 100
 * entrevistas para filtrarlas en el navegador y aplicaba un criterio de
 * prioridad propio, distinto del que ya calculaba el backend. Eso producía
 * cuatro listas de "lo que me toca" que podían contradecirse.
 *
 * Ahora la lista viene de `/dashboard/operational`, el mismo endpoint que
 * alimenta el panel principal, y los contadores por fase se piden al servidor
 * con `pageSize: 1` leyendo solo el total. El navegador ya no recibe registros
 * que no va a mostrar.
 *
 * Qué cambió con el rediseño visual
 * ---------------------------------
 * · Las cuatro tarjetas idénticas de fase se sustituyen por un raíl
 *   proporcional: la misma información, más el reparto entre fases, en un
 *   tercio de la altura y sin repetir cuatro cajas iguales.
 * · La tarea más urgente se separa del resto como ACCIÓN RECOMENDADA. Antes
 *   todas las tareas pesaban lo mismo y había que leerlas todas para saber por
 *   dónde empezar.
 * · La clave de consulta incorpora empresa y sucursal. Sin ellas, al cambiar de
 *   contexto se seguía viendo la bandeja del contexto anterior.
 */

const PHASE_STATUSES: Record<RecruitmentPhaseId, ApplicationStatusKey[]> = {
  POSTULARON: ["SUBMITTED", "REVIEWING"],
  CONOCIENDO: ["INTERVIEW"],
  DECIDIDO: ["APPROVED"],
  TRABAJANDO: ["HIRED", "TRAINING"],
  DESCARTADOS: ["REJECTED", "WITHDRAWN"],
};

/**
 * Raíl de fases.
 *
 * Es un gráfico y a la vez una navegación, que es justo lo que un gráfico no
 * puede ser: cada fila lleva su nombre, su cifra y una barra proporcional, y
 * entera es un enlace.
 *
 * La barra es decorativa (`aria-hidden`): la cifra ya está en el texto, así
 * que quien usa un lector de pantalla no pierde nada. Deliberadamente NO se
 * presenta como embudo de conversión: estos totales son ocupación actual de
 * cada fase, no una cohorte seguida en el tiempo, y dibujarlos como embudo
 * afirmaría una conversión que estos números no demuestran.
 */
function PhaseRail({
  phases,
  locale,
}: {
  phases: Array<{ id: RecruitmentPhaseId; total: number | undefined; loading: boolean }>;
  locale: "es" | "en";
}) {
  const known = phases.filter((phase) => typeof phase.total === "number");
  const max = Math.max(1, ...known.map((phase) => phase.total ?? 0));
  const sum = known.reduce((total, phase) => total + (phase.total ?? 0), 0);

  return (
    <ul className="space-y-1">
      {phases.map((phase, index) => {
        const total = phase.total;
        const share = typeof total === "number" && sum > 0 ? Math.round((total / sum) * 100) : null;
        return (
          <li key={phase.id}>
            <Link
              href={`/ats/candidates?phase=${phase.id}`}
              className={cn(
                "group flex items-center gap-4 rounded-lg border border-line bg-surface-1 px-4 py-3",
                "min-h-[var(--control-h-touch)] sm:min-h-[var(--control-h-base)]",
                "transition-colors hover:border-line-strong hover:bg-surface-2",
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-ink-1">{phaseTitle(phase.id, locale)}</span>
                <span className="block truncate text-xs text-ink-3">{phaseMeaning(phase.id, locale)}</span>
              </span>

              {/* Barra proporcional. Se oculta por debajo de 380px: a ese ancho
                  compite con el nombre de la fase y gana el nombre. */}
              <span
                aria-hidden="true"
                className="hidden h-2 w-24 overflow-hidden rounded-full bg-surface-3 xs:block lg:w-40"
              >
                <span
                  className={cn("block h-full rounded-full bg-current", seriesColorClass(index))}
                  style={{ width: `${typeof total === "number" ? Math.round((total / max) * 100) : 0}%` }}
                />
              </span>

              <span className="w-16 shrink-0 text-right">
                <span className="block font-mono text-lg font-semibold text-ink-1 tabular-figures">
                  {phase.loading ? "—" : (total ?? 0)}
                </span>
                {share !== null ? (
                  <span className="block font-mono text-2xs text-ink-3 tabular-figures">{share}%</span>
                ) : null}
              </span>

              <ArrowRight
                className="size-4 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function TodayPage() {
  const { can, currentBranch, currentTenant } = useAppStore();
  const { locale, t } = useLocale();
  const allowed = can("applications.view");

  const dashboard = useQuery({
    // Empresa y sucursal forman parte de la clave: sin ellas, al cambiar de
    // contexto se seguiría mostrando la bandeja del contexto anterior.
    queryKey: ["operational-dashboard", currentTenant.id, currentBranch?.id],
    queryFn: fetchOperationalDashboard,
    enabled: allowed,
    refetchInterval: 60_000,
  });

  // Un conteo por fase, pidiendo una sola fila y leyendo `meta.total`.
  const counts = useQueries({
    queries: MAIN_PHASES.map((phase) => ({
      queryKey: ["application-count", phase.id, currentBranch?.id ?? null],
      queryFn: () =>
        fetchApplications({
          status: PHASE_STATUSES[phase.id].join(","),
          branchId: currentBranch?.id,
          page: 1,
          pageSize: 1,
        }),
      enabled: allowed,
      staleTime: 60_000,
    })),
  });

  const items = toTodayItems(
    [...(dashboard.data?.tasks ?? []), ...(dashboard.data?.alerts ?? [])],
    undefined,
    locale,
  );

  if (!allowed) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Reclutamiento" title={t("ats.today.title")} />
        <EmptyState reason="no-records" title={t("ats.today.noAccessTitle")} description={t("ats.today.noAccessHelp")} />
      </div>
    );
  }

  // `toTodayItems` ya ordena lo urgente primero, así que el primero es el que
  // toca. Se separa del resto en vez de mezclarlo: si todas las tareas pesan lo
  // mismo, hay que leerlas todas para saber por dónde empezar.
  const [recommended, ...rest] = items;

  const phases = MAIN_PHASES.map((phase, index) => ({
    id: phase.id,
    total: counts[index]?.data?.meta.total,
    loading: Boolean(counts[index]?.isLoading),
  }));

  return (
    <div className="space-y-6 pb-4">
      <PageHeader eyebrow="Reclutamiento" title={t("ats.today.title")} description={t("ats.today.help")} />

      {/* ---- 1. Lo siguiente ------------------------------------------- */}
      {dashboard.isLoading ? (
        <SkeletonRows rows={4} label={t("ats.today.loading")} />
      ) : dashboard.isError ? (
        <ErrorState title={t("ats.today.errorTitle")} onRetry={() => void dashboard.refetch()} />
      ) : recommended ? (
        <section
          aria-labelledby="recruit-next"
          className="relative overflow-hidden rounded-xl border border-accent-line/40 bg-surface-1 p-5 shadow-e2 sm:p-6"
        >
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-accent-fill" />
          <div className="flex flex-col gap-4 pl-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="min-w-0 space-y-1">
              <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-accent-ink">
                {t("dashboard.nextAction")}
              </p>
              <h2 id="recruit-next" className="text-lg font-semibold text-ink-1 sm:text-xl">
                {recommended.title}
              </h2>
              {recommended.who ? <p className="text-base font-medium text-ink-1">{recommended.who}</p> : null}
              <p className="text-sm text-ink-2">
                {[recommended.detail, recommended.when].filter(Boolean).join(" · ")}
              </p>
            </div>
            <Button asChild size="lg" className="shrink-0">
              <Link href={recommended.href}>
                {recommended.actionLabel}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>
      ) : (
        <EmptyState
          reason="no-records"
          title={t("ats.today.emptyTitle")}
          description={t("ats.today.emptyHelp")}
          action={
            <Button asChild variant="secondary">
              <Link href="/ats/vacancies">{t("ats.today.openVacancies")}</Link>
            </Button>
          }
        />
      )}

      {/* ---- 2. Reparto por fase ---------------------------------------- */}
      <PageSection
        title={t("ats.today.phasesNav")}
        description="Cuántas personas hay ahora mismo en cada fase del proceso."
        id="fases"
      >
        <PhaseRail phases={phases} locale={locale} />
      </PageSection>

      {/* ---- 3. El resto de pendientes ---------------------------------- */}
      {rest.length > 0 ? (
        <PageSection
          title={t("ats.today.yourTasks")}
          actions={
            <StatusBadge
              tone="progress"
              label={
                rest.length === 1
                  ? t("ats.today.pendingOne")
                  : t("ats.today.pendingMany", { count: rest.length })
              }
            />
          }
          id="pendientes"
        >
          <div className="space-y-2">
            {rest.map((item) => (
              <TaskCard
                key={item.id}
                title={item.title}
                who={item.who}
                detail={item.detail}
                when={item.when}
                urgent={item.urgent}
                href={item.href}
                actionLabel={item.actionLabel}
              />
            ))}
          </div>
        </PageSection>
      ) : null}

      <MobileActionBar>
        <Button asChild size="lg" className="w-full">
          <Link href="/ats/candidates">{t("ats.today.allApplications")}</Link>
        </Button>
      </MobileActionBar>
    </div>
  );
}
