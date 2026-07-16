import Link from "next/link";
import { ModuleHeader, SectionCard, DataTable, SplitPanel, InfoList } from "@/components/ui";
import { reports } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
  return (
    <>
      <ModuleHeader
        eyebrow="Reportes y analitica"
        title="Biblioteca de reportes, filtros y vistas guardadas."
        description="Disenado para lectura ejecutiva rapida y exploracion operativa profunda sin abrumar."
        actions={
          <Button asChild>
            <Link href="/productivity">Abrir productividad</Link>
          </Button>
        }
        metrics={[
          { label: "Reportes activos", value: "3", detail: "Entre reclutamiento, incorporacion y operaciones" },
          { label: "Cadencias vivas", value: "3", detail: "Semanal, diaria y tiempo real en una sola biblioteca" },
          { label: "Vistas guardadas", value: "12", detail: "Consultas frecuentes listas para ejecutivos y lideres" },
        ]}
      />
      <SplitPanel
        left={
          <SectionCard title="Biblioteca de reportes" subtitle="Analitica empresarial">
            <DataTable
              columns={["Reporte", "Propietario", "Cadencia"]}
              rows={reports.map((report) => [report.name, report.owner, report.cadence])}
            />
          </SectionCard>
        }
        right={
          <SectionCard title="Lectura ejecutiva" subtitle="Contexto">
            <InfoList
              items={[
                { title: "Consulta mas usada", description: "Embudo de contratacion por sucursal concentra la mayor demanda operativa", badge: "Top" },
                { title: "Uso en tiempo real", description: "Productividad por sucursal es la pieza mas sensible para supervisores y operaciones", badge: "Live" },
                { title: "Escalabilidad", description: "La vista puede evolucionar hacia filtros persistentes, exportacion y dashboards guardados", badge: "Roadmap" },
              ]}
            />
          </SectionCard>
        }
      />
    </>
  );
}
