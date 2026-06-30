import { PageIntro, SectionCard, DataTable, SplitPanel, InfoList } from "@/components/ui";
import { productivityRows } from "@/lib/mock-data";

export default function ProductivityPage() {
  return (
    <>
      <PageIntro
        eyebrow="Productividad con IA"
        title="Metricas explicables, alertas y comparativas por area en tiempo real."
        description="La interfaz distingue hechos de inferencias para dar confianza al usuario empresarial y facilitar decisiones."
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
