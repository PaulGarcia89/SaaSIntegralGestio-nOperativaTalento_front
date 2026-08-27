import type {
  ApplicationStatusKey,
  ApplicationTimelineEventType,
  VacancyApplicationDto,
  VacancyStageDto,
} from "./contracts";
import { translate } from "@/i18n";
import type { SupportedLocale } from "@/i18n/types";

export const APPLICATION_STAGES: Array<{ key: ApplicationStatusKey; label: string; tone: "secondary" | "default" | "destructive" }> = [
  { key: "SUBMITTED", label: "Recibida", tone: "secondary" },
  { key: "REVIEWING", label: "En revisión", tone: "secondary" },
  { key: "INTERVIEW", label: "Entrevista", tone: "default" },
  { key: "APPROVED", label: "Aprobada", tone: "default" },
  { key: "TRAINING", label: "Formación", tone: "default" },
  { key: "HIRED", label: "Contratada", tone: "default" },
  { key: "REJECTED", label: "Descartada", tone: "destructive" },
  { key: "WITHDRAWN", label: "Retirada", tone: "secondary" },
];

export const APPLICATION_STAGE_CHANGE_OPTIONS = APPLICATION_STAGES.filter(
  (stage) => stage.key !== "HIRED" && stage.key !== "WITHDRAWN",
);

export const TIMELINE_LABELS: Record<ApplicationTimelineEventType, string> = {
  VACANCY_PUBLISHED: "Vacante publicada",
  APPLIED: "Postulación recibida",
  CONTACTED: "Candidato contactado",
  INTERVIEW_SCHEDULED: "Entrevista programada",
  INTERVIEW_RESCHEDULED: "Entrevista reprogramada",
  INTERVIEW_CANCELLED: "Entrevista cancelada",
  INTERVIEW_COMPLETED: "Entrevista completada",
  STAGE_CHANGE_REQUESTED: "Cambio de etapa solicitado",
  STAGE_CHANGE_APPROVED: "Aprobación de etapa registrada",
  STAGE_CHANGE_REJECTED: "Cambio de etapa rechazado",
  STAGE_CHANGED: "Etapa actualizada",
  HIRED: "Contratación formalizada",
  APPLICATION_WITHDRAWN: "Postulación retirada por el candidato",
  SLA_WARNING: "Aviso preventivo de SLA",
  SLA_ESCALATED: "SLA escalado",
  SLA_REASSIGNED: "Reasignación automática por SLA",
  RECRUITER_ASSIGNED: "Responsable de reclutamiento asignado",
  OFFER_CREATED: "Oferta laboral creada",
  OFFER_APPROVED: "Oferta laboral aprobada",
  OFFER_SENT: "Oferta laboral enviada",
  OFFER_COUNTERED: "Contrapropuesta recibida",
  OFFER_ACCEPTED: "Oferta laboral aceptada",
  OFFER_REJECTED: "Oferta laboral rechazada",
  OFFER_EXPIRED: "Oferta laboral vencida",
};

export function applicationStageLabel(status: ApplicationStatusKey, locale: SupportedLocale = "es") {
  const key = ({ SUBMITTED: "ats.applicationReceived", REVIEWING: "ats.applicationReviewing", INTERVIEW: "ats.applicationInterview", APPROVED: "ats.applicationApproved", TRAINING: "ats.applicationTraining", HIRED: "ats.applicationHired", REJECTED: "ats.applicationRejected", WITHDRAWN: "ats.applicationWithdrawn" } as Record<ApplicationStatusKey, string>)[status];
  return key ? translate(locale, key) : status;
}

export function currentApplicationStage(
  application: Pick<VacancyApplicationDto, "currentStageId" | "currentStage" | "status" | "vacancy">,
  stages: VacancyStageDto[] = application.vacancy.stages ?? [],
) {
  return application.currentStage
    ?? stages.find((stage) => stage.id === application.currentStageId)
    ?? stages.find((stage) => stage.applicationStatus === application.status)
    ?? null;
}

export function formatApplicationDate(value?: string | null, locale: SupportedLocale = "es") {
  if (!value) return translate(locale, "ats.noDate");
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function applicationNextAction(status: ApplicationStatusKey, locale: SupportedLocale = "es") {
  const keys: Record<ApplicationStatusKey, string> = {
    SUBMITTED: "ats.nextReview", REVIEWING: "ats.nextInterview", INTERVIEW: "ats.nextSchedule", APPROVED: "ats.nextHiring",
    TRAINING: "ats.nextTraining", HIRED: "ats.nextOnboarding", REJECTED: "ats.nextClosed", WITHDRAWN: "ats.nextWithdrawn",
  };
  return translate(locale, keys[status]);
}
