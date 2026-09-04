"use client";

import { useQuery } from "@tanstack/react-query";
import { InlineFeedback } from "@/components/design-system";
import { fetchHiringContracts } from "@/lib/backend";
import { useAppStore } from "@/store/app-store";
import { hiringDeadlineState, hiringViewMatches, type HiringListView } from "@/lib/hiring-ux";

const views: Array<{ id: HiringListView; label: string }> = [
  { id: "ATTENTION", label: "Requieren atención" },
  { id: "WAITING", label: "Esperando candidato" },
  { id: "READY", label: "Listas para confirmar" },
  { id: "COMPLETED", label: "Completadas" },
];

export function HiringQueueMetrics() {
  const { can } = useAppStore();
  const query = useQuery({ queryKey: ["hiring-contracts", "metrics"], queryFn: () => fetchHiringContracts(), enabled: can("applications.view") });
  if (!query.data?.data?.length) return null;
  const overdue = query.data.data.filter((item) => hiringDeadlineState(item.deadlineAt) === "OVERDUE").length;
  const dueSoon = query.data.data.filter((item) => hiringDeadlineState(item.deadlineAt) === "DUE_SOON").length;
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6" aria-label="Resumen operativo de contrataciones">{views.map((view) => <div key={view.id} className="rounded-2xl border border-border-default bg-surface-elevated p-4"><p className="text-xs text-text-secondary">{view.label}</p><p className="mt-1 text-2xl font-semibold">{query.data.data.filter((item) => hiringViewMatches(item, view.id)).length}</p></div>)}<div className="rounded-2xl border border-status-danger/30 bg-status-danger/[0.04] p-4"><p className="text-xs text-text-secondary">SLA vencido</p><p className="mt-1 text-2xl font-semibold text-status-danger">{overdue}</p></div><div className="rounded-2xl border border-status-warning/30 bg-status-warning/[0.04] p-4"><p className="text-xs text-text-secondary">Vence en 48 h</p><p className="mt-1 text-2xl font-semibold text-status-warning">{dueSoon}</p></div></div>;
}
