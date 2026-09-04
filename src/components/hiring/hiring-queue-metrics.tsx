"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchHiringContracts } from "@/lib/backend";
import { useAppStore } from "@/store/app-store";
import { hiringDeadlineState, hiringViewMatches, type HiringListView } from "@/lib/hiring-ux";
import { useLocale } from "@/components/locale-provider";

/**
 * Resumen de la bandeja.
 *
 * Las etiquetas dicen qué significa cada número en lenguaje de oficina, no de
 * sistema: "Fuera de plazo" en vez de "SLA vencido". El número va acompañado
 * siempre de su etiqueta, nunca solo de un color.
 */
// La vista guarda su identificador; la etiqueta se resuelve al pintarla, que
// es cuando se conoce el idioma. Guardarla aquí la congelaba en español.
const views: Array<{ id: HiringListView; labelKey: string }> = [
  { id: "ATTENTION", labelKey: "hiring.metrics.yours" },
  { id: "WAITING", labelKey: "hiring.metrics.waiting" },
  { id: "READY", labelKey: "hiring.metrics.ready" },
  { id: "COMPLETED", labelKey: "hiring.metrics.completed" },
];

export function HiringQueueMetrics() {
  const { t } = useLocale();
  const { can } = useAppStore();
  const query = useQuery({ queryKey: ["hiring-contracts", "metrics"], queryFn: () => fetchHiringContracts(), enabled: can("applications.view") });
  const rows = query.data?.data;
  if (!rows?.length) return null;

  const overdue = rows.filter((item) => hiringDeadlineState(item.deadlineAt) === "OVERDUE").length;
  const dueSoon = rows.filter((item) => hiringDeadlineState(item.deadlineAt) === "DUE_SOON").length;

  return (
    <section aria-label={t("hiring.metrics.aria")} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {views.map((view) => (
        <div key={view.id} className="rounded-2xl border border-border-default bg-surface-elevated p-4">
          <p className="text-base text-text-secondary">{t(view.labelKey)}</p>
          <p className="mt-1 text-3xl font-semibold text-text-primary">{rows.filter((item) => hiringViewMatches(item, view.id)).length}</p>
        </div>
      ))}
      <div className="rounded-2xl border border-status-danger/40 bg-status-danger/[0.05] p-4">
        <p className="text-base text-text-secondary">{t("hiring.metrics.overdue")}</p>
        <p className="mt-1 text-3xl font-semibold text-text-primary">{overdue}</p>
      </div>
      <div className="rounded-2xl border border-status-warning/40 bg-status-warning/[0.05] p-4">
        <p className="text-base text-text-secondary">{t("hiring.metrics.dueSoon")}</p>
        <p className="mt-1 text-3xl font-semibold text-text-primary">{dueSoon}</p>
      </div>
    </section>
  );
}
