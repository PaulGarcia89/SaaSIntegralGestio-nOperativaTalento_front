"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { AsyncState } from "@/components/async-state";
import { MobileActionBar, PhaseChip, SimpleEmpty, SimpleHeader, SimpleScreen, TaskCard, TAP_TARGET } from "@/components/simple/simple-ui";
import { fetchApplications, fetchOperationalDashboard } from "@/lib/backend";
import type { ApplicationStatusKey } from "@/lib/contracts";
import { MAIN_PHASES, toTodayItems, type RecruitmentPhaseId } from "@/lib/recruitment-ux";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

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
 */

const PHASE_STATUSES: Record<RecruitmentPhaseId, ApplicationStatusKey[]> = {
  POSTULARON: ["SUBMITTED", "REVIEWING"],
  CONOCIENDO: ["INTERVIEW"],
  DECIDIDO: ["APPROVED"],
  TRABAJANDO: ["HIRED", "TRAINING"],
  DESCARTADOS: ["REJECTED", "WITHDRAWN"],
};

export default function TodayPage() {
  const { can, currentBranch } = useAppStore();
  const allowed = can("applications.view");

  const dashboard = useQuery({
    queryKey: ["operational-dashboard"],
    queryFn: fetchOperationalDashboard,
    enabled: allowed,
    refetchInterval: 60_000,
  });

  // Un conteo por fase, pidiendo una sola fila y leyendo `meta.total`.
  const counts = useQueries({
    queries: MAIN_PHASES.map((phase) => ({
      queryKey: ["application-count", phase.id, currentBranch?.id ?? null],
      queryFn: () => fetchApplications({ status: PHASE_STATUSES[phase.id].join(","), branchId: currentBranch?.id, page: 1, pageSize: 1 }),
      enabled: allowed,
      staleTime: 60_000,
    })),
  });

  const items = useMemo(() => toTodayItems([...(dashboard.data?.tasks ?? []), ...(dashboard.data?.alerts ?? [])]), [dashboard.data]);

  if (!allowed) {
    return (
      <SimpleScreen>
        <SimpleHeader title="Hoy" />
        <SimpleEmpty title="No tienes acceso a esta sección" help="Pídele a la persona que administra el sistema que te dé permiso para ver las postulaciones." />
      </SimpleScreen>
    );
  }

  return (
    <SimpleScreen>
      <SimpleHeader
        title="Hoy"
        help="Esto es todo lo que necesita tu atención ahora mismo. Cuando termines, la lista se queda vacía."
      />

      <nav aria-label="Postulaciones por fase">
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {MAIN_PHASES.map((phase, index) => {
            const total = counts[index]?.data?.meta.total;
            return (
              <li key={phase.id}>
                <Link
                  href={`/ats/candidates?phase=${phase.id}`}
                  className={cn(TAP_TARGET, "flex h-full flex-col justify-between rounded-2xl border border-border-default bg-surface-elevated p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus")}
                >
                  <span className="text-text-secondary">{phase.title}</span>
                  <span className="mt-2 text-3xl font-semibold text-text-primary">
                    {counts[index]?.isLoading ? "—" : (total ?? 0)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <section aria-labelledby="hoy-tareas" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="hoy-tareas" className="text-2xl font-semibold text-text-primary">Lo que te toca</h2>
          {items.length ? <PhaseChip label={`${items.length} pendiente${items.length === 1 ? "" : "s"}`} tone="attention" /> : null}
        </div>

        {dashboard.isLoading ? <AsyncState state="loading" title="Buscando lo que necesita tu atención" /> : null}
        {dashboard.isError ? (
          <AsyncState state="error" title="No pudimos cargar tus pendientes" onRetry={() => void dashboard.refetch()} />
        ) : null}

        {dashboard.isSuccess && !items.length ? (
          <SimpleEmpty
            title="No tienes nada pendiente"
            help="Cuando alguien se postule o tengas una entrevista cerca, aparecerá aquí."
            action={
              <Link href="/ats/vacancies" className={cn(TAP_TARGET, "inline-flex items-center rounded-full border border-border-default px-5 font-semibold text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus")}>
                Ver mis puestos abiertos
              </Link>
            }
          />
        ) : null}

        {items.map((item) => (
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
      </section>

      <MobileActionBar>
        <Link
          href="/ats/candidates"
          className={cn(TAP_TARGET, "flex w-full items-center justify-center rounded-full bg-primary px-5 font-semibold text-text-on-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus")}
        >
          Ver todas las postulaciones
        </Link>
      </MobileActionBar>
    </SimpleScreen>
  );
}
