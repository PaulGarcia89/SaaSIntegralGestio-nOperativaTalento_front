import { MetricCard, PageIntro, SectionCard, SplitPanel, InfoList, DataTable } from "@/components/ui";
import { alerts, dashboardKpis, pipelineStages, reports } from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <>
      <PageIntro
        eyebrow="Dashboard principal"
        title="Visibilidad inmediata para reclutamiento, onboarding, training y operacion."
        description="La home privada prioriza lo que necesita accion hoy: indicadores, riesgos, tareas pendientes y salud operacional por area."
        actions={<a className="primary-button" href="/reports">Ver reportes</a>}
      />

      <div className="content-grid columns-4">
        {dashboardKpis.map((kpi) => (
          <MetricCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <SplitPanel
        left={
          <SectionCard title="Pipeline de seleccion" subtitle="ATS">
            <div className="stage-row">
              {pipelineStages.map((stage) => (
                <article key={stage.name} className="stage-card">
                  <span>{stage.name}</span>
                  <strong>{stage.count}</strong>
                </article>
              ))}
            </div>
          </SectionCard>
        }
        right={
          <SectionCard title="Alertas priorizadas" subtitle="IA operativa">
            <InfoList
              items={alerts.map((alert) => ({
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
          columns={["Reporte", "Propietario", "Cadencia"]}
          rows={reports.map((report) => [report.name, report.owner, report.cadence])}
        />
      </SectionCard>
    </>
  );
}
