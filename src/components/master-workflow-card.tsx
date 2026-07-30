import { IntegrationUnavailable } from "@/components/integration-state";

export function MasterWorkflowCard() {
  return <IntegrationUnavailable title="Flujo maestro en integración" description="El flujo se mostrará cuando sus eventos y acciones estén respaldados por el backend." />;
}
