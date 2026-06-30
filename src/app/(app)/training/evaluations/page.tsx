import { PageIntro, SectionCard, DataTable } from "@/components/ui";
import { evaluations } from "@/lib/mock-data";

export default function EvaluationsPage() {
  return (
    <>
      <PageIntro
        eyebrow="Evaluaciones"
        title="Intentos, aprobacion y certificacion sin perder trazabilidad."
        description="La experiencia de evaluacion debe ser directa, legible y lista para mobile o escritorio."
      />
      <SectionCard title="Evaluaciones activas" subtitle="Training">
        <DataTable
          columns={["Evaluacion", "Pendientes", "Aprobacion"]}
          rows={evaluations.map((evaluation) => [
            evaluation.name,
            evaluation.pending,
            evaluation.passRate,
          ])}
        />
      </SectionCard>
    </>
  );
}
