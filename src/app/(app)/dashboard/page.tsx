"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboardSummary } from "@/lib/mock-backend";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  InfoList,
  LoadingPanel,
  ModuleHeader,
  SectionCard,
  SplitPanel,
} from "@/components/ui";

export default function DashboardPage() {
  const { currentTenant } = useAppStore();
  const summaryQuery = useQuery({
    queryKey: ["dashboard-summary", currentTenant.id],
    queryFn: () => fetchDashboardSummary(currentTenant.id),
  });

  if (summaryQuery.isLoading || !summaryQuery.data) {
    return <LoadingPanel />;
  }

  return (
    <>
      <ModuleHeader
        eyebrow="Panel principal"
        title="Un centro de mando moderno para reclutamiento, onboarding y operaciones empresariales."
        description="El espacio principal prioriza lo que requiere accion ahora en las operaciones de Florida, manteniendo consistencia entre movil, escritorio y visibilidad por empresa."
        actions={
          <Button asChild>
            <Link href="/reports">Abrir reportes</Link>
          </Button>
        }
        metrics={summaryQuery.data.kpis}
      />

      <div className="space-y-12 xl:space-y-14">
        <SplitPanel
          left={
            <SectionCard title="Embudo de reclutamiento" subtitle="ATS">
              <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
                {summaryQuery.data.pipeline.map((stage) => (
                  <article key={stage.name} className="rounded-3xl border border-border/70 bg-secondary/40 p-5">
                    <p className="text-sm text-muted-foreground">{stage.name}</p>
                    <strong className="mt-3 block text-3xl font-semibold">{stage.count}</strong>
                  </article>
                ))}
              </div>
            </SectionCard>
          }
          right={
            <SectionCard title="Alertas de IA" subtitle="Inteligencia operativa">
              <InfoList
                items={summaryQuery.data.alerts.map((alert) => ({
                  title: alert.title,
                  description: alert.description,
                  badge: alert.tone,
                }))}
              />
            </SectionCard>
          }
        />

        <SectionCard title="Reportes destacados" subtitle="Analitica">
          <DataTable
            columns={["Reporte", "Responsable", "Frecuencia"]}
            rows={summaryQuery.data.reports.map((report) => [
              report.name,
              report.owner,
              report.cadence,
            ])}
          />
        </SectionCard>
      </div>
    </>
  );
}
