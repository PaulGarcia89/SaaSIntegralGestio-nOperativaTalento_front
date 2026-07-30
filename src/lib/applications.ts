import type { ApplicationStatusKey, ApplicationTimelineEventType } from "./contracts";

export const APPLICATION_STAGES: Array<{ key: ApplicationStatusKey; label: string; tone: "secondary" | "default" | "destructive" }> = [
  { key: "SUBMITTED", label: "Recibida", tone: "secondary" },
  { key: "REVIEWING", label: "En revisión", tone: "secondary" },
  { key: "INTERVIEW", label: "Entrevista", tone: "default" },
  { key: "APPROVED", label: "Aprobada", tone: "default" },
  { key: "TRAINING", label: "Formación", tone: "default" },
  { key: "HIRED", label: "Contratada", tone: "default" },
  { key: "REJECTED", label: "Descartada", tone: "destructive" },
];

export const TIMELINE_LABELS: Record<ApplicationTimelineEventType, string> = {
  VACANCY_PUBLISHED: "Vacante publicada",
  APPLIED: "Postulación recibida",
  CONTACTED: "Candidato contactado",
  INTERVIEW_SCHEDULED: "Entrevista programada",
  INTERVIEW_COMPLETED: "Entrevista completada",
  HIRED: "Contratación formalizada",
};

export function applicationStageLabel(status: ApplicationStatusKey) {
  return APPLICATION_STAGES.find((stage) => stage.key === status)?.label ?? status;
}

export function formatApplicationDate(value?: string | null) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function applicationNextAction(status: ApplicationStatusKey) {
  const actions: Record<ApplicationStatusKey, string> = {
    SUBMITTED: "Revisar la postulación",
    REVIEWING: "Decidir si avanza a entrevista",
    INTERVIEW: "Programar o completar entrevista",
    APPROVED: "Preparar decisión de contratación",
    TRAINING: "Revisar formación requerida",
    HIRED: "Iniciar incorporación",
    REJECTED: "Proceso cerrado",
  };
  return actions[status];
}
