import Link from "next/link";
import { ModuleHeader, SectionCard, InfoList, SplitPanel } from "@/components/ui";
import { notifications } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

export default function NotificationsPage() {
  return (
    <>
      <ModuleHeader
        eyebrow="Centro de notificaciones"
        title="Feed priorizado, filtrable y accionable."
        description="El centro de alertas debe reducir ruido y llevar al usuario directamente a la tarea relevante."
        actions={
          <Button asChild>
            <Link href="/reports">Abrir reportes</Link>
          </Button>
        }
        metrics={[
          { label: "Alertas no leidas", value: "6", detail: "Concentradas en firma, stock y reclutamiento" },
          { label: "Prioridad alta", value: "2", detail: "Incidentes que requieren atencion hoy" },
          { label: "Automatizadas", value: "83%", detail: "Generadas por reglas de negocio y monitoreo IA" },
        ]}
      />
      <SplitPanel
        left={
          <SectionCard title="Actividad reciente" subtitle="Inbox operativo">
            <InfoList
              items={notifications.map((notification) => ({
                title: notification.title,
                description: notification.meta,
                badge: notification.kind,
              }))}
            />
          </SectionCard>
        }
        right={
          <SectionCard title="Reglas de atencion" subtitle="Orquestacion">
            <InfoList
              items={[
                { title: "Firma y onboarding", description: "Se priorizan notificaciones cercanas a fecha de ingreso y vencimientos documentales", badge: "Critico" },
                { title: "Operaciones e inventario", description: "Alertas de stock y productividad se agrupan para evitar fatiga de notificaciones" },
                { title: "Acciones sugeridas", description: "Cada alerta puede evolucionar hacia CTA directos a reporte, vacante o expediente", badge: "UX" },
              ]}
            />
          </SectionCard>
        }
      />
    </>
  );
}
