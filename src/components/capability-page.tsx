"use client";

import { useUiText } from "@/components/ui-copy";

import { InlineFeedback, PageHeader } from "@/components/design-system";

export function CapabilityPage({ title, description, capability }: { title: string; description: string; capability: string }) {
  const uiText = useUiText();
  return (
    <div className="space-y-5"><PageHeader eyebrow={capability} title={title} description={description} /><InlineFeedback tone="info" title={uiText("Integración pendiente")}>{uiText("La navegación y el acceso ya están aplicados. Los registros aparecerán cuando el servicio entregue la información; esta vista no genera datos simulados.")}</InlineFeedback></div>
  );
}
