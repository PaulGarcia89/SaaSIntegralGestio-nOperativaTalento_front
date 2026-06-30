import { PageIntro, SectionCard, InfoList } from "@/components/ui";

export default function SignaturesPage() {
  return (
    <>
      <PageIntro
        eyebrow="Firma electronica"
        title="Seguimiento visual del proceso de firma para cada documento y participante."
        description="El diseno contempla preview del contrato, progreso por firmante y estados accionables como enviado, firmado o rechazado."
      />
      <SectionCard title="Flujo de firma" subtitle="Documentos activos">
        <InfoList
          items={[
            { title: "Contrato laboral", description: "Firmado por empresa y candidato", badge: "Completado" },
            { title: "Acuerdo de confidencialidad", description: "Pendiente firma del colaborador", badge: "Pendiente" },
            { title: "Autorizacion de datos", description: "Enviado hace 30 minutos", badge: "En transito" },
          ]}
        />
      </SectionCard>
    </>
  );
}
