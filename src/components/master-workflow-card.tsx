"use client";

import { useUiText } from "@/components/ui-copy";

import { IntegrationUnavailable } from "@/components/integration-state";

export function MasterWorkflowCard() {
  const uiText = useUiText();
  return <IntegrationUnavailable title={uiText("Flujo maestro en integración")} description={uiText("El flujo se mostrará cuando sus eventos y acciones estén respaldados por el backend.")} />;
}
