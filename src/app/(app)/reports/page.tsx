import { IntegrationUnavailable } from "@/components/integration-state";

export default function ReportsPage() {
  return <IntegrationUnavailable title="Reportes en integración" description="No se mostrarán métricas estáticas. Los reportes aparecerán cuando incluyan fuente, periodo y actualización verificables." />;
}
