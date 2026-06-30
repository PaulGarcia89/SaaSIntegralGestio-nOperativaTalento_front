import { PageIntro, SectionCard, DataTable } from "@/components/ui";
import { interviews } from "@/lib/mock-data";

export default function InterviewsPage() {
  return (
    <>
      <PageIntro
        eyebrow="Entrevistas"
        title="Agenda, slots disponibles y feedback estructurado."
        description="Diseño para coordinar paneles, recordatorios, scorecards y seguimiento de decisiones sin salir del ATS."
      />
      <SectionCard title="Agenda de entrevistas" subtitle="Calendario y lista">
        <DataTable
          columns={["Candidato", "Horario", "Panel", "Estado"]}
          rows={interviews.map((item) => [item.candidate, item.when, item.panel, item.status])}
        />
      </SectionCard>
    </>
  );
}
