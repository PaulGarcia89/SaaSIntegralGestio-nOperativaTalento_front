import Link from "next/link";
import { InfoList, ModuleHeader, SectionCard, DataTable, SplitPanel } from "@/components/ui";
import { evaluations } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

export default function EvaluationsPage() {
  return (
    <>
      <ModuleHeader
        eyebrow="Evaluaciones"
        title="Intentos, aprobacion y certificacion sin perder trazabilidad."
        description="La experiencia de evaluacion debe ser directa, legible y lista para mobile o escritorio."
        actions={
          <Button asChild>
            <Link href="/training">Abrir entrenamiento</Link>
          </Button>
        }
        metrics={[
          { label: "Evaluaciones activas", value: "3", detail: "Distribuidas entre cumplimiento, seguridad y servicio" },
          { label: "Promedio de aprobacion", value: "94%", detail: "Mejora de 3 puntos respecto al ultimo ciclo" },
          { label: "Recordatorios enviados", value: "18", detail: "Notificaciones automaticas durante la semana" },
        ]}
      />
      <SplitPanel
        left={
          <SectionCard title="Evaluaciones activas" subtitle="Capacitacion">
            <DataTable
              columns={["Evaluacion", "Pendientes", "Aprobacion"]}
              rows={evaluations.map((evaluation) => [
                evaluation.name,
                evaluation.pending,
                evaluation.passRate,
              ])}
            />
          </SectionCard>
        }
        right={
          <SectionCard title="Lectura operativa" subtitle="Seguimiento">
            <InfoList
              items={[
                { title: "Cumplimiento mas alto", description: "Politicas internas mantiene el mejor indice y menor rezago" },
                { title: "Punto de riesgo", description: "Seguridad OSHA concentra la mayor cantidad de pendientes esta semana", badge: "Atencion" },
                { title: "Automatizacion sugerida", description: "Programar recordatorios 48 horas antes del vencimiento de cada evaluacion", badge: "IA" },
              ]}
            />
          </SectionCard>
        }
      />
    </>
  );
}
