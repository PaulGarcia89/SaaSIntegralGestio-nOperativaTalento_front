"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchHiringContracts } from "@/lib/backend";
import { useAppStore } from "@/store/app-store";
import { hiringDeadlineState, hiringViewMatches, type HiringListView } from "@/lib/hiring-ux";

/**
 * Resumen de la bandeja.
 *
 * Las etiquetas dicen qué significa cada número en lenguaje de oficina, no de
 * sistema: "Fuera de plazo" en vez de "SLA vencido". El número va acompañado
 * siempre de su etiqueta, nunca solo de un color.
 */
const views: Array<{ id: HiringListView; label: string }> = [
  { id: "ATTENTION", label: "Te toca a ti" },
  { id: "WAITING", label: "Esperando a la persona" },
  { id: "READY", label: "Listas para confirmar" },
  { id: "COMPLETED", label: "Completadas" },
];

export function HiringQueueMetrics() {
  const { can } = useAppStore();
  const query = useQuery({ queryKey: ["hiring-contracts", "metrics"], queryFn: () => fetchHiringContracts(), enabled: can("applications.view") });
  const rows = query.data?.data;
  if (!rows?.length) return null;

  const overdue = rows.filter((item) => hiringDeadlineState(item.deadlineAt) === "OVERDUE").length;
  const dueSoon = rows.filter((item) => hiringDeadlineState(item.deadlineAt) === "DUE_SOON").length;

  return (
    <section aria-label="Resumen de contrataciones" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {views.map((view) => (
        <div key={view.id} className="rounded-2xl border border-border-default bg-surface-elevated p-4">
          <p className="text-base text-text-secondary">{view.label}</p>
          <p className="mt-1 text-3xl font-semibold text-text-primary">{rows.filter((item) => hiringViewMatches(item, view.id)).length}</p>
        </div>
      ))}
      <div className="rounded-2xl border border-status-danger/40 bg-status-danger/[0.05] p-4">
        <p className="text-base text-text-secondary">Fuera de plazo</p>
        <p className="mt-1 text-3xl font-semibold text-text-primary">{overdue}</p>
      </div>
      <div className="rounded-2xl border border-status-warning/40 bg-status-warning/[0.05] p-4">
        <p className="text-base text-text-secondary">Vencen en menos de dos días</p>
        <p className="mt-1 text-3xl font-semibold text-text-primary">{dueSoon}</p>
      </div>
    </section>
  );
}
