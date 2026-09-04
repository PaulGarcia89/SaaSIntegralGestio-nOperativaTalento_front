import type { ApplicationStatusKey, OperationalDashboardItemDto, VacancyApplicationDto, VacancyStageDto } from "@/lib/contracts";
import { currentApplicationStage } from "@/lib/applications";
import { translate } from "@/i18n";
import type { SupportedLocale } from "@/i18n/types";

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

/**
 * Una fase guarda su identificador y su número, nunca su texto.
 *
 * El texto se resuelve al leerlo con `phaseTitle`, `phaseQuestion` y
 * `phaseMeaning`, que reciben el idioma. Guardarlo aquí, como estaba, dejaba
 * cinco títulos en español incrustados en una constante de módulo: no había
 * forma de traducirlos sin recrear el objeto.
 */
export type RecruitmentPhase = {
  id: RecruitmentPhaseId;
  /** Número visible, empezando en 1. `null` para fases fuera del camino. */
  step: number | null;
};

export const RECRUITMENT_PHASES: RecruitmentPhase[] = [
  { id: "POSTULARON", step: 1 },
  { id: "CONOCIENDO", step: 2 },
  { id: "DECIDIDO", step: 3 },
  { id: "TRABAJANDO", step: 4 },
  { id: "DESCARTADOS", step: null },
];

/** Nombre visible de la fase. */
export function phaseTitle(id: RecruitmentPhaseId, locale: SupportedLocale = "es"): string {
  return translate(locale, `recruit.phase.${id}.title`);
}

/** La pregunta que responde esta fase, en la voz de quien contrata. */
export function phaseQuestion(id: RecruitmentPhaseId, locale: SupportedLocale = "es"): string {
  return translate(locale, `recruit.phase.${id}.question`);
}

/** Qué significa la fase, en una frase. */
export function phaseMeaning(id: RecruitmentPhaseId, locale: SupportedLocale = "es"): string {
  return translate(locale, `recruit.phase.${id}.meaning`);
}

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

/**
 * El nombre se interpola con `{{name}}` en vez de concatenarse: en inglés la
 * frase no coloca el nombre donde lo coloca el español ("Revisar a Ana" frente
 * a "Review Ana"), y una plantilla deja esa decisión en el catálogo.
 */
export function recruitmentAction(phase: RecruitmentPhaseId, locale: SupportedLocale = "es"): RecruitmentAction {
  return {
    label: (name: string) => translate(locale, `recruit.action.${phase}.label`, { name }),
    helper: translate(locale, `recruit.action.${phase}.helper`),
  };
}

/* ------------------------------------------------------------------------- *
 * Tiempo en lenguaje de persona
 *
 * "SLA vencido" no significa nada fuera de un manual. "Lleva 5 días esperando"
 * sí, y además dice implícitamente que alguien está esperando por ti.
 * ------------------------------------------------------------------------- */

export function waitingLabel(since?: string | null, now = Date.now(), locale: SupportedLocale = "es"): string {
  const t = (key: string, count?: number) => translate(locale, key, count === undefined ? {} : { count });
  if (!since) return t("recruit.waiting.noDate");
  const start = new Date(since).getTime();
  if (Number.isNaN(start)) return t("recruit.waiting.noDate");
  const minutes = Math.floor(Math.max(0, now - start) / 60_000);
  if (minutes < 60) return t("recruit.waiting.justNow");
  const hours = Math.floor(minutes / 60);
  // Singular y plural son claves distintas y no una `s` pegada al final: en
  // otros idiomas el plural no se forma asi, y "1 horas" es un error visible.
  if (hours < 24) return hours === 1 ? t("recruit.waiting.hour") : t("recruit.waiting.hours", hours);
  const days = Math.floor(hours / 24);
  if (days === 1) return t("recruit.waiting.day");
  if (days < 30) return t("recruit.waiting.days", days);
  const months = Math.floor(days / 30);
  return months === 1 ? t("recruit.waiting.month") : t("recruit.waiting.months", months);
}

export function dueLabel(dueAt?: string | null, now = Date.now(), locale: SupportedLocale = "es"): string | null {
  const t = (key: string, count?: number) => translate(locale, key, count === undefined ? {} : { count });
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
    return days === 1 ? t("recruit.due.overdueDay") : t("recruit.due.overdueDays", days);
  }
  if (minutes <= -60) {
    const hours = Math.floor(-minutes / 60);
    return hours === 1 ? t("recruit.due.overdueHour") : t("recruit.due.overdueHours", hours);
  }
  if (minutes < 0) return t("recruit.due.passed");
  if (minutes < 60) return t("recruit.due.soon");
  if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    return hours === 1 ? t("recruit.due.todayHour") : t("recruit.due.todayHours", hours);
  }
  const days = Math.round(minutes / 1440);
  return days === 1 ? t("recruit.due.tomorrow") : t("recruit.due.inDays", days);
}

export function firstNameOf(fullName: string, locale: SupportedLocale = "es"): string {
  return fullName.trim().split(/\s+/)[0] || translate(locale, "recruit.thisPerson");
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
export function toTodayItems(items: OperationalDashboardItemDto[] | undefined, now = Date.now(), locale: SupportedLocale = "es"): TodayItem[] {
  if (!items?.length) return [];
  return items
    .filter((item) => RECRUITMENT_MODULES.includes(item.module))
    .map((item) => {
      const [who, ...rest] = (item.description ?? "").split("·").map((part) => part.trim());
      const due = dueLabel(item.dueAt, now, locale);
      return {
        id: item.id,
        title: item.title,
        who: item.recordLabel ?? who ?? "",
        detail: rest.join(" · "),
        when: due ?? waitingLabel(item.occurredAt, now, locale),
        urgent: item.tone === "danger" || item.tone === "warning" || (item.dueAt ? new Date(item.dueAt).getTime() < now : false),
        href: item.href,
        actionLabel: todayActionLabel(item.module, locale),
      };
    })
    .sort((left, right) => Number(right.urgent) - Number(left.urgent));
}

/**
 * Etiqueta del botón de la tarjeta, a partir del módulo que envía el backend.
 *
 * Antes se deducía buscando palabras españolas ("postulaci", "entrevista") en
 * el TÍTULO que manda el servidor. Eso ataba la interfaz al idioma del backend:
 * en cuanto ese título dejara de estar en español, ninguna expresión coincidía
 * y todas las tarjetas caían en "Abrir".
 *
 * `module` sí es un identificador estable —`RECRUITMENT_MODULES` ya filtra por
 * él—, así que la deducción sobrevive al cambio de idioma. A cambio se pierde
 * la distinción entre oferta y documentos dentro de Contratación, que solo el
 * título permitía: ambas dicen ahora "Abrir contratación", que es cierto en los
 * dos casos. Distinguirlas de verdad exige que el backend mande su propio
 * identificador, no una frase.
 *
 * IMPORTANTE: `module` no debe traducirse en el backend. Es la clave de este
 * mapa y del filtro; traducirlo rompería ambos.
 */
function todayActionLabel(moduleName: string | undefined, locale: SupportedLocale = "es"): string {
  const keys: Record<string, string> = {
    Reclutamiento: "recruit.today.reviewApplication",
    Entrevistas: "recruit.today.viewInterview",
    "Contratación": "recruit.today.openHiring",
  };
  return translate(locale, (moduleName && keys[moduleName]) || "recruit.today.open");
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
export function stageMoveLabel(stage: VacancyStageDto, locale: SupportedLocale = "es"): string {
  switch (stage.applicationStatus) {
    case "INTERVIEW":
      return translate(locale, "recruit.move.interview");
    case "APPROVED":
      return translate(locale, "recruit.move.approve");
    case "REJECTED":
      return translate(locale, "recruit.move.reject");
    case "HIRED":
      return translate(locale, "recruit.move.hired");
    case "REVIEWING":
      return translate(locale, "recruit.move.reviewing");
    default:
      // `stage.name` es una etapa que configuró la empresa: se muestra tal cual
      // porque es su dato, no texto de la interfaz.
      return translate(locale, "recruit.move.other", { stage: stage.name });
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
  locale: SupportedLocale = "es",
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
    .map((stage) => ({ stage, label: stageMoveLabel(stage, locale), needsReason: stage.applicationStatus === "REJECTED" }));

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
