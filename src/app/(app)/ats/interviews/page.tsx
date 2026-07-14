import Link from "next/link";
import { ModuleHeader, SectionCard, DataTable, SplitPanel, InfoList } from "@/components/ui";
import { interviews } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

export default function InterviewsPage() {
  return (
    <>
      <ModuleHeader
        eyebrow="Entrevistas"
        title="Agenda, slots disponibles y feedback estructurado."
        description="Diseño para coordinar paneles, recordatorios, scorecards y seguimiento de decisiones sin salir del ATS."
        actions={
          <Button asChild>
            <Link href="/ats/candidates">Ver postulantes</Link>
          </Button>
        }
        metrics={[
          { label: "Entrevistas de hoy", value: "8", detail: "Paneles distribuidos entre Miami, Orlando y Tampa" },
          { label: "Slots confirmados", value: "92%", detail: "Coordinacion alta entre candidatos y entrevistadores" },
          { label: "Feedback pendiente", value: "3", detail: "Scorecards por cerrar antes del corte diario" },
        ]}
      />
      <SplitPanel
        left={
          <SectionCard title="Agenda de entrevistas" subtitle="Calendario y lista">
            <DataTable
              columns={["Candidato", "Horario", "Panel", "Estado"]}
              rows={interviews.map((item) => [item.candidate, item.when, item.panel, item.status])}
            />
          </SectionCard>
        }
        right={
          <SectionCard title="Coordinacion de paneles" subtitle="Operacion">
            <InfoList
              items={[
                { title: "Carga balanceada", description: "Los paneles tecnicos concentran la mayor demanda y deben priorizar disponibilidad por sucursal", badge: "Agenda" },
                { title: "Calidad de feedback", description: "La interfaz esta lista para evolucionar a scorecards, notas y resumen asistido por IA" },
                { title: "Riesgo del dia", description: "Tres entrevistas requieren confirmacion final de entrevistador antes del mediodia", badge: "Seguimiento" },
              ]}
            />
          </SectionCard>
        }
      />
    </>
  );
}
