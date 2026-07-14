import Link from "next/link";
import { ModuleHeader, SectionCard, DataTable, SplitPanel, InfoList } from "@/components/ui";
import { productivityRows } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

export default function ProductivityPage() {
  return (
    <>
      <ModuleHeader
        eyebrow="Productividad con IA"
        title="Metricas explicables, alertas y comparativas por area en tiempo real."
        description="La interfaz distingue hechos de inferencias para dar confianza al usuario empresarial y facilitar decisiones."
        actions={
          <Button asChild>
            <Link href="/reports">Ver reportes</Link>
          </Button>
        }
        metrics={[
          { label: "Indice operativo", value: "89.1", detail: "Promedio consolidado de productividad entre sedes activas" },
          { label: "Alertas abiertas", value: "3", detail: "Casos con seguimiento recomendado por supervision" },
          { label: "Confianza del modelo", value: "87%", detail: "Calidad actual de inferencia sobre eventos y sensores" },
        ]}
      />
      <SplitPanel
        left={
          <SectionCard title="Rendimiento por area" subtitle="Indicadores">
            <DataTable
              columns={["Area", "Indice", "Tendencia", "Alertas"]}
              rows={productivityRows.map((row) => [
                row.area,
                row.productivity,
                row.trend,
                row.alert,
              ])}
            />
          </SectionCard>
        }
        right={
          <SectionCard title="Explicabilidad" subtitle="IA responsable">
            <InfoList
              items={[
                { title: "Fuente", description: "Sensores, eventos operativos y flujo de trabajo digital" },
                { title: "Confianza del modelo", description: "87% para los hallazgos actuales", badge: "Alta" },
                { title: "Recomendacion", description: "Revisar turnos extendidos en Logistica durante la tarde" },
              ]}
            />
          </SectionCard>
        }
      />
    </>
  );
}
