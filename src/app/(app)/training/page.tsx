import Link from "next/link";
import { ModuleHeader, SectionCard, DataTable, SplitPanel, InfoList } from "@/components/ui";
import { courses } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

export default function TrainingPage() {
  return (
    <>
      <ModuleHeader
        eyebrow="Modulo de entrenamiento"
        title="Biblioteca de aprendizaje, progreso y rutas por cargo."
        description="La home de training prioriza cursos obligatorios, continuidad de aprendizaje y materiales audiovisuales."
        actions={
          <Button asChild>
            <Link href="/training/evaluations">Abrir evaluaciones</Link>
          </Button>
        }
        metrics={[
          { label: "Cursos activos", value: "3", detail: "Rutas entre onboarding, cumplimiento y desarrollo" },
          { label: "Progreso promedio", value: "69%", detail: "Mejora sostenida en las ultimas dos semanas" },
          { label: "Certificaciones urgentes", value: "4", detail: "Renovaciones que vencen durante esta semana" },
        ]}
      />
      <SplitPanel
        left={
          <SectionCard title="Cursos activos" subtitle="Biblioteca">
            <DataTable
              columns={["Curso", "Progreso", "Tipo"]}
              rows={courses.map((course) => [course.title, course.progress, course.type])}
            />
          </SectionCard>
        }
        right={
          <SectionCard title="Lectura de aprendizaje" subtitle="Seguimiento">
            <InfoList
              items={[
                { title: "Mayor avance", description: "Onboarding laboral en EE. UU. mantiene el mejor porcentaje de finalizacion", badge: "Fuerte" },
                { title: "Riesgo de atraso", description: "HIPAA y privacidad del paciente requiere refuerzo en equipos clinicos", badge: "Atencion" },
                { title: "Proxima evolucion", description: "La biblioteca puede escalar hacia rutas por rol, lecciones y certificados descargables", badge: "Roadmap" },
              ]}
            />
          </SectionCard>
        }
      />
    </>
  );
}
