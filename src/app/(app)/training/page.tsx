import { PageIntro, SectionCard, DataTable } from "@/components/ui";
import { courses } from "@/lib/mock-data";

export default function TrainingPage() {
  return (
    <>
      <PageIntro
        eyebrow="Modulo de entrenamiento"
        title="Biblioteca de aprendizaje, progreso y rutas por cargo."
        description="La home de training prioriza cursos obligatorios, continuidad de aprendizaje y materiales audiovisuales."
      />
      <SectionCard title="Cursos activos" subtitle="Biblioteca">
        <DataTable
          columns={["Curso", "Progreso", "Tipo"]}
          rows={courses.map((course) => [course.title, course.progress, course.type])}
        />
      </SectionCard>
    </>
  );
}
