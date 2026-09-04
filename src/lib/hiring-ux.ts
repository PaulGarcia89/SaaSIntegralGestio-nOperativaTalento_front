import { translate } from "@/i18n";
import type { SupportedLocale } from "@/i18n/types";
import type {
  HiringContractBlockerDto,
  HiringContractDto,
  HiringContractProgressDto,
  HiringContractStatus,
} from "@/lib/contracts";

export type HiringListView = "ALL" | "ATTENTION" | "WAITING" | "READY" | "COMPLETED";

// Permite activar gradualmente la bandeja priorizada sin cambiar el workflow.
export const HIRING_GUIDED_QUEUE_ENABLED = process.env.NEXT_PUBLIC_HIRING_GUIDED_QUEUE !== "false";

/** Nombre visible del estado técnico. Se usa solo en auditoría y filtros. */
export function hiringStatusLabel(status: HiringContractStatus, locale: SupportedLocale = "es") {
  return translate(locale, `hiring.status.${status}`);
}

export function hiringPhaseLabel(status: HiringContractStatus, locale: SupportedLocale = "es") {
  if (["DRAFT", "DATA_REVIEW"].includes(status)) return translate(locale, "hiring.phase.info");
  if (["OFFER_PREPARATION", "OFFER_SENT", "AWAITING_OFFER_RESPONSE", "OFFER_ACCEPTED"].includes(status)) return translate(locale, "hiring.phase.offer");
  if (status === "DOCUMENTS_PENDING") return translate(locale, "hiring.phase.documents");
  if (status === "SIGNATURES_PENDING") return translate(locale, "hiring.phase.signatures");
  if (["COMPLIANCE_REVIEW", "READY_TO_HIRE"].includes(status)) return translate(locale, "hiring.phase.review");
  return translate(locale, "hiring.phase.confirmation");
}

export type HiringStatusGuidance = {
  description: string;
  expectedActor: string;
  requiredData: string;
};

/**
 * Cada estado responde tres cosas: qué pasa, quién tiene la pelota y qué dato
 * hace falta. El texto vive en el catálogo; aquí solo queda quién es el actor,
 * que es una decisión de proceso y no una frase.
 */
const guidanceActor: Record<HiringContractStatus, string> = {
  DRAFT: "hiring.actor.hr",
  DATA_REVIEW: "hiring.actor.hr",
  OFFER_PREPARATION: "hiring.actor.hr",
  OFFER_SENT: "hiring.actor.candidate",
  AWAITING_OFFER_RESPONSE: "hiring.actor.candidate",
  OFFER_ACCEPTED: "hiring.actor.hr",
  DOCUMENTS_PENDING: "hiring.actor.both",
  SIGNATURES_PENDING: "hiring.actor.candidate",
  COMPLIANCE_REVIEW: "hiring.actor.hr",
  READY_TO_HIRE: "hiring.actor.hr",
  HIRED: "hiring.actor.hr",
  CANCELLED: "hiring.actor.none",
};

export function hiringStatusGuidance(status: HiringContractStatus, locale: SupportedLocale = "es"): HiringStatusGuidance {
  return {
    description: translate(locale, `hiring.guidance.${status}.description`),
    expectedActor: translate(locale, guidanceActor[status]),
    requiredData: translate(locale, `hiring.guidance.${status}.requiredData`),
  };
}

export function hiringOfferStatusLabel(status?: string | null, locale: SupportedLocale = "es") {
  const known = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"];
  if (status && known.includes(status)) return translate(locale, `hiring.offerStatus.${status}`);
  return status ?? translate(locale, "hiring.offerStatus.none");
}

export function hiringSignatureStatusLabel(status?: string | null, locale: SupportedLocale = "es") {
  const known = ["PENDING", "SENT", "COMPLETED", "SIGNED", "REJECTED", "EXPIRED"];
  if (status && known.includes(status)) return translate(locale, `hiring.signature.${status}`);
  return status ?? translate(locale, "hiring.signature.none");
}

export function hiringDeadlineState(deadlineAt?: string | null, now = Date.now()) {
  if (!deadlineAt) return "NO_DEADLINE" as const;
  const deadline = new Date(deadlineAt).getTime();
  if (Number.isNaN(deadline)) return "NO_DEADLINE" as const;
  if (deadline < now) return "OVERDUE" as const;
  if (deadline - now <= 48 * 60 * 60 * 1000) return "DUE_SOON" as const;
  return "ON_TRACK" as const;
}

const legacyActionCodes = ["CONFIGURE_OFFER", "SEND_OFFER", "WAIT_OFFER_RESPONSE", "REQUEST_DOCUMENTS", "REVIEW_DOCUMENTS", "SEND_SIGNATURES", "WAIT_SIGNATURES", "REVIEW_COMPLIANCE", "CONFIRM_HIRING"];

const attentionStatuses: HiringContractStatus[] = ["DRAFT", "DATA_REVIEW", "OFFER_PREPARATION", "OFFER_ACCEPTED", "DOCUMENTS_PENDING", "COMPLIANCE_REVIEW", "READY_TO_HIRE"];
const waitingStatuses: HiringContractStatus[] = ["OFFER_SENT", "AWAITING_OFFER_RESPONSE", "SIGNATURES_PENDING"];

export function hiringActionLabel(action: string | null | undefined, status: HiringContractStatus, locale: SupportedLocale = "es") {
  if (action && legacyActionCodes.includes(action)) return translate(locale, `hiring.legacy.${action}`);
  const normalized = action?.toUpperCase().replaceAll(" ", "_");
  if (normalized && legacyActionCodes.includes(normalized)) return translate(locale, `hiring.legacy.${normalized}`);
  if (status === "HIRED") return translate(locale, "hiring.legacy.completed");
  if (status === "CANCELLED") return translate(locale, "hiring.legacy.noActions");
  return action?.replaceAll("_", " ") || translate(locale, "hiring.action.NONE.label");
}

export function hiringDocumentStatusLabel(status: string, locale: SupportedLocale = "es") {
  const known = ["REQUIRED", "REQUESTED", "RECEIVED", "UNDER_REVIEW", "APPROVED", "REJECTED", "SIGNED", "WAIVED"];
  return known.includes(status) ? translate(locale, `hiring.doc.${status}`) : status;
}

export function hiringPriorityLabel(priority?: string | null, locale: SupportedLocale = "es") {
  const known = ["LOW", "MEDIUM", "HIGH", "URGENT"];
  return priority && known.includes(priority) ? translate(locale, `hiring.priority.${priority}`) : translate(locale, "hiring.priority.none");
}

export function hiringViewMatches(item: HiringContractDto, view: HiringListView) {
  if (view === "ATTENTION") return attentionStatuses.includes(item.status);
  if (view === "WAITING") return waitingStatuses.includes(item.status);
  if (view === "READY") return ["COMPLIANCE_REVIEW", "READY_TO_HIRE"].includes(item.status);
  if (view === "COMPLETED") return item.status === "HIRED";
  return true;
}

export function pendingHiringDocuments(item: HiringContractDto) {
  return item.documents.filter((document) => document.required && !["APPROVED", "SIGNED", "WAIVED"].includes(document.status)).length;
}

/* ------------------------------------------------------------------------- *
 * Modelo de cinco etapas
 *
 * El backend tiene doce estados técnicos. Una persona que contrata a alguien
 * dos veces al mes no debe aprenderlos: piensa en "¿por dónde voy?", y la
 * respuesta útil son cinco pasos. Este bloque traduce los doce estados a esas
 * cinco etapas y deja el estado técnico disponible solo para auditoría.
 * ------------------------------------------------------------------------- */

export type HiringStageId = "PREPARACION" | "OFERTA" | "DOCUMENTOS" | "REVISION" | "CONFIRMACION";

export type HiringStage = {
  id: HiringStageId;
  /** Número visible para el usuario, empezando en 1. */
  step: number;
};

export const HIRING_STAGES: HiringStage[] = [
  { id: "PREPARACION", step: 1 },
  { id: "OFERTA", step: 2 },
  { id: "DOCUMENTOS", step: 3 },
  { id: "REVISION", step: 4 },
  { id: "CONFIRMACION", step: 5 },
];

/** Nombre visible de la etapa. */
export function hiringStageTitle(stage: HiringStageId, locale: SupportedLocale = "es") {
  return translate(locale, `hiring.stage.${stage}.title`);
}

/** Qué ocurre en la etapa, en una frase. */
export function hiringStageSummary(stage: HiringStageId, locale: SupportedLocale = "es") {
  return translate(locale, `hiring.stage.${stage}.summary`);
}

const stageByStatus: Record<HiringContractStatus, HiringStageId> = {
  DRAFT: "PREPARACION",
  DATA_REVIEW: "PREPARACION",
  OFFER_PREPARATION: "OFERTA",
  OFFER_SENT: "OFERTA",
  AWAITING_OFFER_RESPONSE: "OFERTA",
  OFFER_ACCEPTED: "DOCUMENTOS",
  DOCUMENTS_PENDING: "DOCUMENTOS",
  SIGNATURES_PENDING: "DOCUMENTOS",
  COMPLIANCE_REVIEW: "REVISION",
  READY_TO_HIRE: "REVISION",
  HIRED: "CONFIRMACION",
  CANCELLED: "CONFIRMACION",
};

export function hiringStageOf(status: HiringContractStatus): HiringStageId {
  return stageByStatus[status];
}

export function hiringStageIndex(stage: HiringStageId) {
  return HIRING_STAGES.findIndex((item) => item.id === stage);
}

export function hiringStage(stage: HiringStageId) {
  return HIRING_STAGES[hiringStageIndex(stage)];
}

/* ------------------------------------------------------------------------- *
 * Normalización de la respuesta de progreso
 *
 * El resolver del backend emite objetos para `blockers` y `nextAction`, pero
 * históricamente hubo versiones que enviaban cadenas y el tipo del frontend
 * declaraba cadenas. Normalizamos ambas formas en vez de confiar en una: es
 * barato, y evita que un cambio de forma vuelva a romper la pantalla entera.
 * ------------------------------------------------------------------------- */

export function normalizeHiringBlockers(raw: unknown): HiringContractBlockerDto[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry) => {
    if (typeof entry === "string") return entry.trim() ? [{ code: "UNKNOWN", message: entry }] : [];
    if (entry && typeof entry === "object") {
      const candidate = entry as Partial<HiringContractBlockerDto>;
      if (typeof candidate.message === "string" && candidate.message.trim()) {
        return [{ code: typeof candidate.code === "string" ? candidate.code : "UNKNOWN", message: candidate.message, field: typeof candidate.field === "string" ? candidate.field : undefined }];
      }
    }
    return [];
  });
}

export function normalizeHiringActionCode(raw: unknown): string | null {
  if (typeof raw === "string") return raw.trim() || null;
  if (raw && typeof raw === "object") {
    const candidate = raw as { code?: unknown };
    if (typeof candidate.code === "string") return candidate.code;
  }
  return null;
}

/* ------------------------------------------------------------------------- *
 * Bloqueos explicados
 *
 * La regla del rediseño es que nunca se muestra un botón apagado sin decir por
 * qué. Cada bloqueo responde cuatro preguntas: qué falta, por qué hace falta,
 * quién lo resuelve y qué se habilita cuando esté hecho.
 * ------------------------------------------------------------------------- */

export type HiringBlockerExplanation = {
  code: string;
  /** Qué falta, en la voz del usuario. */
  what: string;
  /** Por qué se necesita. */
  why: string;
  /** Quién debe resolverlo. */
  who: string;
  /** Qué se habilita cuando se resuelva. */
  unlocks: string;
};

export function explainHiringBlocker(blocker: HiringContractBlockerDto, candidateName?: string, locale: SupportedLocale = "es"): HiringBlockerExplanation {
  const name = candidateName || translate(locale, "hiring.candidateFallback");
  switch (blocker.code) {
    case "REQUIRED_DOCUMENTS_MISSING":
      return { code: blocker.code, what: blocker.message, why: translate(locale, "hiring.blocker.docs.why"), who: translate(locale, "hiring.blocker.docs.who", { name }), unlocks: translate(locale, "hiring.blocker.docs.unlocks") };
    case "SIGNATURES_PENDING":
      return { code: blocker.code, what: blocker.message, why: translate(locale, "hiring.blocker.signatures.why"), who: translate(locale, "hiring.blocker.signatures.who", { name }), unlocks: translate(locale, "hiring.blocker.signatures.unlocks") };
    case "WAITING_CANDIDATE":
      return { code: blocker.code, what: blocker.message, why: translate(locale, "hiring.blocker.waiting.why"), who: translate(locale, "hiring.blocker.waiting.who", { name }), unlocks: translate(locale, "hiring.blocker.waiting.unlocks") };
    case "OFFER_NOT_CONFIGURED":
      return { code: blocker.code, what: translate(locale, "hiring.blocker.offer.what"), why: translate(locale, "hiring.blocker.offer.why"), who: translate(locale, "hiring.blocker.offer.who"), unlocks: translate(locale, "hiring.blocker.offer.unlocks") };
    default:
      return { code: blocker.code || "UNKNOWN", what: blocker.message, why: translate(locale, "hiring.blocker.default.why"), who: translate(locale, "hiring.blocker.default.who"), unlocks: translate(locale, "hiring.blocker.default.unlocks") };
  }
}

/* ------------------------------------------------------------------------- *
 * Acción principal
 *
 * En cada pantalla hay exactamente una. La etiqueta dice qué se va a hacer, no
 * "Continuar" ni "Procesar", y `helper` dice qué pasará después de pulsarla.
 * ------------------------------------------------------------------------- */

export type HiringPrimaryActionCode =
  | "REVIEW_DATA"
  | "PREPARE_OFFER"
  | "SEND_OFFER"
  | "REVIEW_RESPONSE"
  | "REQUEST_DOCUMENTS"
  | "REVIEW_DOCUMENTS"
  | "REVIEW_HIRING"
  | "CONFIRM_HIRING"
  | "VIEW_EMPLOYEE"
  | "NONE";

export type HiringPrimaryAction = {
  code: HiringPrimaryActionCode;
  label: string;
  /** Qué sucederá después de ejecutar la acción. */
  helper: string;
};

/**
 * Estado consolidado de una contratación, listo para pintar.
 *
 * Se calcula en un solo sitio para que la cabecera, la barra de etapas, el
 * panel de la etapa actual y la lista digan siempre lo mismo. Cuando estaba
 * repartido por la pantalla, "Reenviar a firma" y "Enviar documentos a firma"
 * aparecían a la vez porque cada bloque decidía por su cuenta.
 */
export type HiringCaseState = {
  status: HiringContractStatus;
  stage: HiringStageId;
  stageIndex: number;
  /** Avance en porcentaje, derivado de la etapa y no del campo persistido. */
  progressPercent: number;
  cancelled: boolean;
  completed: boolean;
  pendingDocuments: number;
  blockers: HiringContractBlockerDto[];
  /** `true` cuando el backend aceptaría una confirmación ahora mismo. */
  canConfirm: boolean;
  primaryAction: HiringPrimaryAction;
  /** Quién tiene la pelota. */
  waitingOn: "EMPRESA" | "CANDIDATO" | "NADIE";
};

const CONFIRMABLE_STATUSES: HiringContractStatus[] = ["OFFER_ACCEPTED", "DOCUMENTS_PENDING", "SIGNATURES_PENDING", "COMPLIANCE_REVIEW", "READY_TO_HIRE"];

export function resolveHiringCase(contract: HiringContractDto, progress?: HiringContractProgressDto | null, locale: SupportedLocale = "es"): HiringCaseState {
  const status = contract.status;
  const blockers = normalizeHiringBlockers(progress?.blockers ?? contract.progress?.blockers);
  const pendingDocuments = pendingHiringDocuments(contract);
  const cancelled = status === "CANCELLED";
  const completed = status === "HIRED";

  // El backend acepta `confirm` en OFFER_ACCEPTED, COMPLIANCE_REVIEW y
  // READY_TO_HIRE siempre que no queden documentos obligatorios pendientes.
  // Derivamos aquí la misma condición para que la etapa "Revisión final" sea
  // alcanzable también en contratos antiguos que quedaron detenidos en
  // DOCUMENTS_PENDING o SIGNATURES_PENDING antes de completar la máquina de
  // estados del backend.
  const canConfirm = !cancelled && !completed && CONFIRMABLE_STATUSES.includes(status) && pendingDocuments === 0;

  const declaredStage = hiringStageOf(status);
  const stage: HiringStageId = canConfirm && hiringStageIndex(declaredStage) < hiringStageIndex("REVISION") ? "REVISION" : declaredStage;
  const stageIndex = hiringStageIndex(stage);

  const waitingOn: HiringCaseState["waitingOn"] = cancelled || completed
    ? "NADIE"
    : blockers.some((blocker) => blocker.code === "WAITING_CANDIDATE" || blocker.code === "SIGNATURES_PENDING")
      ? "CANDIDATO"
      : "EMPRESA";

  return {
    status,
    stage,
    stageIndex,
    progressPercent: cancelled ? 0 : Math.round(((completed ? HIRING_STAGES.length : stageIndex) / HIRING_STAGES.length) * 100),
    cancelled,
    completed,
    pendingDocuments,
    blockers,
    canConfirm,
    primaryAction: resolvePrimaryAction({ status, stage, canConfirm, pendingDocuments, hasOffer: Boolean(contract.jobOfferId) }, locale),
    waitingOn,
  };
}

function resolvePrimaryAction({ status, stage, canConfirm, pendingDocuments, hasOffer }: { status: HiringContractStatus; stage: HiringStageId; canConfirm: boolean; pendingDocuments: number; hasOffer: boolean }, locale: SupportedLocale = "es"): HiringPrimaryAction {
  const t = (key: string) => translate(locale, key);
  if (status === "CANCELLED") return { code: "NONE", label: t("hiring.action.NONE.cancelled.label"), helper: t("hiring.action.NONE.cancelled.helper") };
  if (status === "HIRED") return { code: "VIEW_EMPLOYEE", label: t("hiring.action.VIEW_EMPLOYEE.label"), helper: t("hiring.action.VIEW_EMPLOYEE.helper") };
  if (canConfirm && stage === "REVISION") return { code: "CONFIRM_HIRING", label: t("hiring.action.CONFIRM_HIRING.label"), helper: t("hiring.action.CONFIRM_HIRING.helper") };

  switch (stage) {
    case "PREPARACION":
      return { code: "PREPARE_OFFER", label: t("hiring.action.PREPARE_OFFER.label"), helper: t("hiring.action.PREPARE_OFFER.helperFromPrep") };
    case "OFERTA":
      if (!hasOffer) return { code: "PREPARE_OFFER", label: t("hiring.action.PREPARE_OFFER.label"), helper: t("hiring.action.PREPARE_OFFER.helperNoOffer") };
      if (status === "OFFER_SENT" || status === "AWAITING_OFFER_RESPONSE") return { code: "REVIEW_RESPONSE", label: t("hiring.action.REVIEW_RESPONSE.label"), helper: t("hiring.action.REVIEW_RESPONSE.helper") };
      return { code: "SEND_OFFER", label: t("hiring.action.SEND_OFFER.label"), helper: t("hiring.action.SEND_OFFER.helper") };
    case "DOCUMENTOS":
      if (pendingDocuments > 0) return { code: "REVIEW_DOCUMENTS", label: t("hiring.action.REVIEW_DOCUMENTS.label"), helper: t("hiring.action.REVIEW_DOCUMENTS.helper") };
      return { code: "REQUEST_DOCUMENTS", label: t("hiring.action.REQUEST_DOCUMENTS.label"), helper: t("hiring.action.REQUEST_DOCUMENTS.helper") };
    case "REVISION":
      return { code: "REVIEW_HIRING", label: t("hiring.action.REVIEW_HIRING.label"), helper: t("hiring.action.REVIEW_HIRING.helper") };
    default:
      return { code: "NONE", label: t("hiring.action.NONE.label"), helper: t("hiring.action.NONE.helper") };
  }
}

/* ------------------------------------------------------------------------- *
 * Etiquetas de dominio en lenguaje cotidiano
 * ------------------------------------------------------------------------- */

export function hiringDocumentTypeLabel(type: string, locale: SupportedLocale = "es") {
  const known = ["IDENTIFICATION", "TAX", "ELIGIBILITY", "AGREEMENT", "POLICY", "LICENSE", "OTHER"];
  return known.includes(type) ? translate(locale, `hiring.docType.${type}`) : translate(locale, "hiring.docType.fallback");
}

/**
 * Los identificadores de plantilla de DocuSeal (`w9`, `i9`…) no significan nada
 * para quien contrata. Se traducen aquí y el identificador queda solo en la
 * sección de auditoría.
 */
export function hiringTemplateLabel(templateKey: string, locale: SupportedLocale = "es") {
  const keys: Record<string, string> = { w9: "hiring.template.w9", i9: "hiring.template.i9", "food-employee-reporting": "hiring.template.food" };
  return keys[templateKey] ? translate(locale, keys[templateKey]) : templateKey.replaceAll("-", " ");
}

export function hiringWaitingLabel(waitingOn: HiringCaseState["waitingOn"], candidateName: string, locale: SupportedLocale = "es") {
  if (waitingOn === "CANDIDATO") return translate(locale, "hiring.waiting.candidate", { name: candidateName });
  if (waitingOn === "EMPRESA") return translate(locale, "hiring.waiting.company");
  return translate(locale, "hiring.waiting.none");
}
