import { PageIntro, SectionCard, DataTable } from "@/components/ui";
import { reports } from "@/lib/mock-data";

export default function ReportsPage() {
  return (
    <>
      <PageIntro
        eyebrow="Reportes y analitica"
        title="Biblioteca de reportes, filtros y vistas guardadas."
        description="Disenado para lectura ejecutiva rapida y exploracion operativa profunda sin abrumar."
      />
      <SectionCard title="Biblioteca de reportes" subtitle="Analitica empresarial">
        <DataTable
          columns={["Reporte", "Propietario", "Cadencia"]}
          rows={reports.map((report) => [report.name, report.owner, report.cadence])}
        />
      </SectionCard>
    </>
  );
}
