"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { completeTrainingAutomation, fetchTrainingWorkspace } from "@/lib/mock-backend";
import { useAppStore } from "@/store/app-store";
import { ModuleHeader, SectionCard, DataTable, SplitPanel, InfoList } from "@/components/ui";
import { automationJourneys } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

export default function TrainingPage() {
  const { currentTenant } = useAppStore();
  const queryClient = useQueryClient();
  const trainingQuery = useQuery({
    queryKey: ["training-workspace", currentTenant.id],
    queryFn: () => fetchTrainingWorkspace(currentTenant.id),
  });
  const refreshFlowQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["training-workspace", currentTenant.id] });
    queryClient.invalidateQueries({ queryKey: ["productivity-workspace", currentTenant.id] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-summary", currentTenant.id] });
    queryClient.invalidateQueries({ queryKey: ["master-workflow-card", currentTenant.id] });
    queryClient.invalidateQueries({ queryKey: ["admin-compliance-workspace", currentTenant.id] });
    queryClient.invalidateQueries({ queryKey: ["automation-summary", currentTenant.id] });
  };
  const completeTrainingMutation = useMutation({
    mutationFn: (employeeName: string) => completeTrainingAutomation(employeeName),
    onSuccess: () => {
      refreshFlowQueries();
      toast.success("Formación completada y transferencia operativa activada");
    },
    onError: (error: Error) => toast.error(error.message || "No se pudo cerrar la formación"),
  });

  if (trainingQuery.isLoading || !trainingQuery.data) {
    return <SectionCard title="Cargando entrenamiento" subtitle="Biblioteca">Preparando cursos, progreso y activaciones por contratacion.</SectionCard>;
  }

  return (
    <>
      <ModuleHeader
        eyebrow="Modulo de entrenamiento"
        title="Biblioteca de aprendizaje, progreso y rutas por cargo."
        description="La vista de capacitación prioriza cursos obligatorios, continuidad de aprendizaje y materiales audiovisuales."
        actions={
          <Button asChild>
            <Link href="/training/evaluations">Abrir evaluaciones</Link>
          </Button>
        }
        metrics={[
          { label: "Cursos activos", value: "3", detail: "Rutas entre incorporacion, cumplimiento y desarrollo" },
          { label: "Progreso promedio", value: "69%", detail: "Mejora sostenida en las ultimas dos semanas" },
          { label: "Certificaciones urgentes", value: "4", detail: "Renovaciones que vencen durante esta semana" },
        ]}
      />
      <SplitPanel
        left={
          <SectionCard title="Cursos activos" subtitle="Biblioteca">
            <div className="space-y-5">
              <DataTable
                columns={["Curso", "Progreso", "Tipo"]}
                rows={trainingQuery.data.courses.map((course) => [course.title, course.progress, course.type])}
              />

              <div className="space-y-3">
                {trainingQuery.data.activations.map((activation) => {
                  const isCompleted = activation.status === "Completado";
                  return (
                    <div
                      key={activation.id}
                      className="rounded-2xl border border-border/70 bg-secondary/25 p-4"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">
                            {activation.employeeName} · {activation.courseTitle}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {activation.branch}. Estado: {activation.status}. Objetivo: {activation.dueLabel}.
                          </p>
                        </div>
                        <Button
                          variant={isCompleted ? "secondary" : "default"}
                          disabled={isCompleted || completeTrainingMutation.isPending}
                          onClick={() => completeTrainingMutation.mutate(activation.employeeName)}
                        >
                          {isCompleted
                            ? "Formación cerrada"
                            : completeTrainingMutation.isPending
                              ? "Actualizando..."
                              : "Marcar formación completa"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </SectionCard>
        }
        right={
          <SectionCard title="Lectura de aprendizaje y paso a operación" subtitle="Seguimiento">
            <div className="space-y-5">
              <InfoList
                items={trainingQuery.data.activations.map((item) => ({
                  title: `${item.employeeName} · ${item.courseTitle}`,
                  description: `${item.branch}. Estado: ${item.status}. Objetivo: ${item.dueLabel}.`,
                  badge: "Activacion",
                }))}
              />

              <InfoList
                items={trainingQuery.data.handoffs.map((item) => ({
                  title: `${item.employeeName} · transferencia operativa`,
                  description: `${item.branch}. ${item.nextAction}`,
                  badge: item.status,
                }))}
              />

              <InfoList
                items={[
                  { title: "Mayor avance", description: "Incorporacion laboral en EE. UU. mantiene el mejor porcentaje de finalizacion", badge: "Fuerte" },
                  { title: "Riesgo de atraso", description: "HIPAA y privacidad del paciente requiere refuerzo en equipos clinicos", badge: "Atencion" },
                  { title: "Activacion automatica", description: "Las rutas obligatorias pueden activarse al aprobar contratacion o reasignar sede.", badge: "Flujo" },
                ]}
              />

              <InfoList
                items={automationJourneys.map((journey) => ({
                  title: journey.title,
                  description: journey.description,
                  badge: journey.status,
                }))}
              />
            </div>
          </SectionCard>
        }
      />
    </>
  );
}
