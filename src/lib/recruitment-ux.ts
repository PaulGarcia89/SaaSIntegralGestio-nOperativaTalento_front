import type { ApplicationStatusKey, OperationalDashboardItemDto, VacancyApplicationDto, VacancyStageDto } from "@/lib/contracts";
import { currentApplicationStage } from "@/lib/applications";

/* ------------------------------------------------------------------------- *
 * Las cuatro fases
 *
 * El backend tiene ocho estados de postulación. Quien contrata dos veces al
 * mes no necesita aprenderlos: necesita saber por dónde va cada persona. Los
 * ocho estados se agrupan en cuatro fases con nombres que se entienden sin
 * explicación, y los estados técnicos quedan disponibles para auditoría.
 *
 * Nada cambia en el backend: la agrupación vive aquí.
 * ------------------------------------------------------------------------- */

export type RecruitmentPhaseId = "POSTULARON" | "CONOCIENDO" | "DECIDIDO" | "TRABAJANDO" | "DESCARTADOS";

export type RecruitmentPhase = {
  id: RecruitmentPhaseId;
  /** Número visible, empezando en 1. `null` para fases fuera del camino. */
  step: number | null;
  title: string;
  /** La pregunta que responde esta fase. */
  question: string;
  /** Qué significa, en una frase. */
  meaning: string;
};

export const RECRUITMENT_PHASES: RecruitmentPhase[] = [
  { id: "POSTULARON", step: 1, title: "Se postularon", question: "¿A quién miro?", meaning: "Personas que enviaron su solicitud y todavía no has revisado." },
  { id: "CONOCIENDO", step: 2, title: "Los estoy conociendo", question: "¿Con quién hablo?", meaning: "Personas con entrevista pendiente o ya entrevistadas." },
  { id: "DECIDIDO", step: 3, title: "Decidí contratar", question: "¿A quién le hago oferta?", meaning: "Personas aprobadas que esperan su oferta de trabajo." },
  { id: "TRABAJANDO", step: 4, title: "Ya trabaja aquí", question: "¿Quién entró?", meaning: "Personas contratadas o en formación." },
  { id: "DESCARTADOS", step: null, title: "Descartados", question: "¿A quién dije que no?", meaning: "Personas que no siguieron en el proceso." },
];

const phaseByStatus: Record<ApplicationStatusKey, RecruitmentPhaseId> = {
  SUBMITTED: "POSTULARON",
  REVIEWING: "POSTULARON",
  INTERVIEW: "CONOCIENDO",
  APPROVED: "DECIDIDO",
  HIRED: "TRABAJANDO",
  TRAINING: "TRABAJANDO",
  REJECTED: "DESCARTADOS",
  WITHDRAWN: "DESCARTADOS",
};

export function recruitmentPhaseOf(status: ApplicationStatusKey): RecruitmentPhaseId {
  return phaseByStatus[status];
}

export function recruitmentPhase(id: RecruitmentPhaseId): RecruitmentPhase {
  return RECRUITMENT_PHASES.find((phase) => phase.id === id) ?? RECRUITMENT_PHASES[0];
}

/** Las fases del camino principal, sin los descartados. */
export const MAIN_PHASES = RECRUITMENT_PHASES.filter((phase) => phase.step !== null);

/* ------------------------------------------------------------------------- *
 * Acción principal por fase
 *
 * Una sola por pantalla, escrita como una frase que dice qué va a pasar. Nada
 * de "Avanzar", "Procesar" ni "Gestionar": el usuario debe poder predecir el
 * resultado antes de pulsar.
 * ------------------------------------------------------------------------- */

export type RecruitmentAction = {
  label: (firstName: string) => string;
  /** Qué ocurrirá después de pulsar. */
  helper: string;
};

const actionByPhase: Record<RecruitmentPhaseId, RecruitmentAction> = {
  POSTULARON: { label: (name) => `Revisar a ${name}`, helper: "Verás su solicitud y decidirás si la invitas a una entrevista." },
  CONOCIENDO: { label: (name) => `Ver la entrevista de ${name}`, helper: "Verás cuándo es la entrevista y podrás anotar cómo fue." },
  DECIDIDO: { label: (name) => `Preparar la oferta de ${name}`, helper: "Pasarás a la contratación para enviarle su oferta de trabajo." },
  TRABAJANDO: { label: (name) => `Ver a ${name}`, helper: "Verás su expediente como parte del equipo." },
  DESCARTADOS: { label: (name) => `Ver a ${name}`, helper: "Consultarás su historial y el motivo registrado." },
};

export function recruitmentAction(phase: RecruitmentPhaseId): RecruitmentAction {
  return actionByPhase[phase];
}

/* ------------------------------------------------------------------------- *
 * Tiempo en lenguaje de persona
 *
 * "SLA vencido" no significa nada fuera de un manual. "Lleva 5 días esperando"
 * sí, y además dice implícitamente que alguien está esperando por ti.
 * ------------------------------------------------------------------------- */

export function waitingLabel(since?: string | null, now = Date.now()): string {
  if (!since) return "Sin fecha";
  const start = new Date(since).getTime();
  if (Number.isNaN(start)) return "Sin fecha";
  const minutes = Math.floor(Math.max(0, now - start) / 60_000);
  if (minutes < 60) return "Llegó hace un momento";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Lleva ${hours} hora${hours === 1 ? "" : "s"} esperando`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Lleva 1 día esperando";
  if (days < 30) return `Lleva ${days} días esperando`;
  const months = Math.floor(days / 30);
  return `Lleva ${months} mes${months === 1 ? "" : "es"} esperando`;
}

export function dueLabel(dueAt?: string | null, now = Date.now()): string | null {
  if (!dueAt) return null;
  const due = new Date(dueAt).getTime();
  if (Number.isNaN(due)) return null;

  // Se calcula en minutos a propósito. Redondear a horas producía `-0` para un
  // retraso de pocos minutos, y en JavaScript `-0 < 0` es falso: una entrevista
  // con diez minutos de retraso se anunciaba como "es dentro de menos de una
  // hora". Lo detectó una prueba, no un usuario.
  const minutes = Math.round((due - now) / 60_000);

  if (minutes <= -1440) {
    const days = Math.floor(-minutes / 1440);
    return `Se pasó hace ${days} día${days === 1 ? "" : "s"}`;
  }
  if (minutes <= -60) {
    const hours = Math.floor(-minutes / 60);
    return `Se pasó hace ${hours} hora${hours === 1 ? "" : "s"}`;
  }
  if (minutes < 0) return "Ya pasó la hora";
  if (minutes < 60) return "Es dentro de menos de una hora";
  if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    return `Es hoy, en ${hours} hora${hours === 1 ? "" : "s"}`;
  }
  const days = Math.round(minutes / 1440);
  return days === 1 ? "Es mañana" : `Es en ${days} días`;
}

export function firstNameOf(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || "esta persona";
}

/* ------------------------------------------------------------------------- *
 * La bandeja de "Hoy"
 *
 * Antes existían cuatro bandejas de "atención" con cuatro criterios distintos
 * y dos fuentes de verdad: el panel principal la calculaba en el backend y
 * `/ats` se descargaba 200 registros para filtrarlos en el navegador. Aquí hay
 * una sola, alimentada del mismo endpoint que el panel principal, de modo que
 * no puedan volver a discrepar.
 * ------------------------------------------------------------------------- */

/** Los módulos cuyas tareas pertenecen al día a día de reclutamiento. */
const RECRUITMENT_MODULES = ["Reclutamiento", "Entrevistas", "Contratación"];

export type TodayItem = {
  id: string;
  /** Qué pasó, en la voz del usuario. */
  title: string;
  /** A quién se refiere. */
  who: string;
  /** Detalle secundario: puesto, sucursal. */
  detail: string;
  /** Cuándo llegó o para cuándo es. */
  when: string;
  urgent: boolean;
  href: string;
  actionLabel: string;
};

/**
 * Convierte los elementos del panel operativo del backend en tarjetas legibles.
 *
 * Se preserva el texto que envía el backend en lugar de reescribirlo aquí: es
 * la única fuente de verdad, y duplicar su criterio en el cliente es
 * exactamente lo que produjo las cuatro bandejas divergentes.
 */
export function toTodayItems(items: OperationalDashboardItemDto[] | undefined, now = Date.now()): TodayItem[] {
  if (!items?.length) return [];
  return items
    .filter((item) => RECRUITMENT_MODULES.includes(item.module))
    .map((item) => {
      const [who, ...rest] = (item.description ?? "").split("·").map((part) => part.trim());
      const due = dueLabel(item.dueAt, now);
      return {
        id: item.id,
        title: item.title,
        who: item.recordLabel ?? who ?? "",
        detail: rest.join(" · "),
        when: due ?? waitingLabel(item.occurredAt, now),
        urgent: item.tone === "danger" || item.tone === "warning" || (item.dueAt ? new Date(item.dueAt).getTime() < now : false),
        href: item.href,
        actionLabel: todayActionLabel(item.title),
      };
    })
    .sort((left, right) => Number(right.urgent) - Number(left.urgent));
}

function todayActionLabel(title: string): string {
  if (/postulaci/i.test(title)) return "Revisar solicitud";
  if (/entrevista/i.test(title)) return "Ver entrevista";
  if (/oferta/i.test(title)) return "Ver oferta";
  if (/document/i.test(title)) return "Revisar documentos";
  if (/contrata/i.test(title)) return "Abrir contratación";
  return "Abrir";
}

/* ------------------------------------------------------------------------- *
 * Mover a una persona de etapa
 *
 * Antes había tres formas simultáneas de hacerlo: arrastrar y soltar, un
 * desplegable "Mover a" que incluía la etapa actual como opción inerte, y en
 * móvil un gesto de deslizar anunciado solo en un texto de 12 px. Tres formas
 * de hacer lo mismo significa que ninguna se aprende.
 *
 * Aquí se calcula UNA acción principal —la que se usa en la gran mayoría de los
 * casos— y se dejan las demás en un menú secundario. Las reglas de qué
 * transiciones son válidas siguen siendo las del backend: se leen de
 * `allowedNextStageCodes`, no se inventan.
 * ------------------------------------------------------------------------- */

export type StageMove = {
  stage: VacancyStageDto;
  /** Etiqueta que dice qué va a pasar, no "avanzar". */
  label: string;
  /** Descartar exige motivo: el backend lo pide y la persona merece saberlo. */
  needsReason: boolean;
};

/**
 * Traduce el destino a una frase que anticipa el resultado.
 *
 * "Avanzar" no dice a dónde. "Invitar a entrevista" sí, y además permite
 * predecir qué recibirá el candidato.
 */
export function stageMoveLabel(stage: VacancyStageDto): string {
  switch (stage.applicationStatus) {
    case "INTERVIEW":
      return "Invitar a entrevista";
    case "APPROVED":
      return "Aprobar para contratación";
    case "REJECTED":
      return "Descartar";
    case "HIRED":
      return "Marcar como contratado";
    case "REVIEWING":
      return "Empezar a revisar";
    default:
      return `Mover a ${stage.name}`;
  }
}

/**
 * Devuelve la acción principal y las secundarias para una persona.
 *
 * La principal es el siguiente paso natural: la etapa permitida más cercana
 * hacia adelante que no sea un descarte. El descarte nunca es la acción
 * principal, por muy permitido que esté: destacarlo invita a pulsarlo por
 * inercia.
 */
export function stageMovesFor(
  application: VacancyApplicationDto,
  stages: VacancyStageDto[],
): { primary: StageMove | null; others: StageMove[] } {
  if (!stages.length) return { primary: null, others: [] };

  const current = currentApplicationStage(application, stages);
  const allowedCodes = current?.allowedNextStageCodes ?? [];
  if (!allowedCodes.length) return { primary: null, others: [] };

  const currentPosition = current?.position ?? -1;
  const moves: StageMove[] = stages
    // La etapa actual se excluye aquí. Antes aparecía en el desplegable con el
    // sufijo "(actual)" y un `if` la ignoraba en silencio: una opción visible
    // que no hacía nada.
    .filter((stage) => stage.code !== current?.code && allowedCodes.includes(stage.code))
    .sort((left, right) => left.position - right.position)
    .map((stage) => ({ stage, label: stageMoveLabel(stage), needsReason: stage.applicationStatus === "REJECTED" }));

  const forward = moves.find((move) => !move.needsReason && move.stage.position > currentPosition);
  const primary = forward ?? moves.find((move) => !move.needsReason) ?? null;

  return { primary, others: moves.filter((move) => move !== primary) };
}

/** Agrupa personas por la fase visible, conservando el orden de llegada. */
export function groupByPhase(applications: VacancyApplicationDto[]): Record<RecruitmentPhaseId, VacancyApplicationDto[]> {
  const groups = { POSTULARON: [], CONOCIENDO: [], DECIDIDO: [], TRABAJANDO: [], DESCARTADOS: [] } as Record<RecruitmentPhaseId, VacancyApplicationDto[]>;
  applications.forEach((application) => groups[recruitmentPhaseOf(application.status)].push(application));
  return groups;
}
