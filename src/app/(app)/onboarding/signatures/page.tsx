import Link from "next/link";
import { ModuleHeader, SectionCard, InfoList, SplitPanel } from "@/components/ui";
import { Button } from "@/components/ui/button";

export default function SignaturesPage() {
  return (
    <>
      <ModuleHeader
        eyebrow="Firma electronica"
        title="Seguimiento visual del proceso de firma para cada documento y participante."
        description="El diseno contempla preview del contrato, progreso por firmante y estados accionables como enviado, firmado o rechazado."
        actions={
          <Button asChild>
            <Link href="/onboarding/documents">Ver documentos</Link>
          </Button>
        }
        metrics={[
          { label: "Firmas completas", value: "1", detail: "Paquetes finalizados sin intervencion manual" },
          { label: "Pendientes", value: "1", detail: "Firmante principal aun no completa el proceso" },
          { label: "En transito", value: "1", detail: "Enviado recientemente a colaborador activo" },
        ]}
      />
      <SplitPanel
        left={
          <SectionCard title="Flujo de firma" subtitle="Documentos activos">
            <InfoList
              items={[
                { title: "Contrato laboral", description: "Firmado por empresa y candidato", badge: "Completado" },
                { title: "Acuerdo de confidencialidad", description: "Pendiente firma del colaborador", badge: "Pendiente" },
                { title: "Autorizacion de datos", description: "Enviado hace 30 minutos", badge: "En transito" },
              ]}
            />
          </SectionCard>
        }
        right={
          <SectionCard title="Orquestacion de firma" subtitle="Estado">
            <InfoList
              items={[
                { title: "Secuencia clara", description: "Primero firma empresa, luego colaborador y finalmente cierre documental", badge: "Flujo" },
                { title: "Riesgo controlado", description: "Los paquetes pendientes deben escalar si la firma no ocurre antes de la fecha limite" },
                { title: "Siguiente nivel", description: "La vista puede evolucionar hacia preview del PDF, timeline y recordatorios automáticos", badge: "Roadmap" },
              ]}
            />
          </SectionCard>
        }
      />
    </>
  );
}
