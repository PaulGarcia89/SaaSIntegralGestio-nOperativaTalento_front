"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboardSummary } from "@/lib/mock-backend";
import { useAppStore } from "@/store/app-store";
import { MasterWorkflowCard } from "@/components/master-workflow-card";
import { Badge } from "@/components/ui/badge";
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
        title="Un centro de mando moderno para reclutamiento, incorporacion y operaciones empresariales."
        description="El espacio principal prioriza lo que requiere accion ahora en las operaciones de Florida, manteniendo consistencia entre movil, escritorio y visibilidad por empresa."
        actions={
          <Button asChild>
            <Link href="/reports">Abrir reportes</Link>
          </Button>
        }
        metrics={summaryQuery.data.kpis}
      />

      <div className="space-y-12 xl:space-y-14">
        <MasterWorkflowCard />

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

        <SplitPanel
          left={
            <SectionCard title="Automatizaciones entre modulos" subtitle="RRHH + Inventario + Capacitacion">
              <InfoList
                items={summaryQuery.data.automationJourneys.map((journey) => ({
                  title: journey.title,
                  description: `${journey.description} Sistemas: ${journey.systems}.`,
                  badge: journey.status,
                }))}
              />
            </SectionCard>
          }
          right={
            <SectionCard title="Reglas activas y cola operativa" subtitle="Tareas disparadas">
              <InfoList
                items={summaryQuery.data.automationRules.map((rule) => ({
                  title: rule.name,
                  description: `${rule.trigger}. ${rule.scope}. ${rule.auditability}.`,
                  badge: rule.status,
                }))}
              />

              <div className="mt-5 space-y-3">
                {summaryQuery.data.automationQueue.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{item.name} · {item.trigger}</p>
                        <p className="text-sm leading-6 text-muted-foreground">{item.nextAction}</p>
                        <p className="text-sm text-muted-foreground">Responsable: {item.owner}</p>
                      </div>
                      <Badge variant={item.status === "Nuevo" ? "default" : "secondary"} className="rounded-full">
                        {item.status ?? "Flujo"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          }
        />

        <SectionCard title="Auditoria reciente de automatizaciones" subtitle="Trazabilidad ejecutada">
          <div className="grid gap-4 xl:grid-cols-3">
            {summaryQuery.data.automationAudit.map((entry) => (
              <article key={entry.id} className="rounded-3xl border border-border/70 bg-secondary/20 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{entry.employeeName}</p>
                    <p className="text-sm text-muted-foreground">{entry.branch}</p>
                  </div>
                  <Badge variant={entry.status === "Ejecutada" ? "secondary" : "outline"} className="rounded-full">
                    {entry.status}
                  </Badge>
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-foreground">{entry.ruleName}</p>
                  <p className="text-sm leading-6 text-muted-foreground">{entry.summary}</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    {entry.executedAt} · {entry.actor}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {entry.consequences.map((consequence) => (
                    <Badge key={consequence} variant="outline" className="rounded-full">
                      {consequence}
                    </Badge>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </SectionCard>
      </div>
    </>
  );
}
