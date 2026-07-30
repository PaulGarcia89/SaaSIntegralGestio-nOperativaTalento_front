import { InlineFeedback, PageHeader } from "@/components/design-system";

export function CapabilityPage({ title, description, capability }: { title: string; description: string; capability: string }) {
  return (
    <div className="space-y-5"><PageHeader eyebrow={capability} title={title} description={description} /><InlineFeedback tone="info" title="Integración pendiente">La navegación y el acceso ya están aplicados. Los registros aparecerán cuando el backend entregue el contrato; esta vista no genera datos simulados.</InlineFeedback></div>
  );
}
