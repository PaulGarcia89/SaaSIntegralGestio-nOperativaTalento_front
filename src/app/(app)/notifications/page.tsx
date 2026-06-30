import { PageIntro, SectionCard, InfoList } from "@/components/ui";
import { notifications } from "@/lib/mock-data";

export default function NotificationsPage() {
  return (
    <>
      <PageIntro
        eyebrow="Centro de notificaciones"
        title="Feed priorizado, filtrable y accionable."
        description="El centro de alertas debe reducir ruido y llevar al usuario directamente a la tarea relevante."
      />
      <SectionCard title="Actividad reciente" subtitle="Inbox operativo">
        <InfoList
          items={notifications.map((notification) => ({
            title: notification.title,
            description: notification.meta,
            badge: notification.kind,
          }))}
        />
      </SectionCard>
    </>
  );
}
