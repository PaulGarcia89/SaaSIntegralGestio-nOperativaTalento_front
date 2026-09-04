import type {
  HiringContractBlockerDto,
  HiringContractDto,
  HiringContractProgressDto,
  HiringContractStatus,
} from "@/lib/contracts";

export type HiringListView = "ALL" | "ATTENTION" | "WAITING" | "READY" | "COMPLETED";

// Permite activar gradualmente la bandeja priorizada sin cambiar el workflow.
export const HIRING_GUIDED_QUEUE_ENABLED = process.env.NEXT_PUBLIC_HIRING_GUIDED_QUEUE !== "false";

export const hiringStatusLabels: Record<HiringContractStatus, string> = { DRAFT: "Borrador", DATA_REVIEW: "Revisión de datos", OFFER_PREPARATION: "Preparando oferta", OFFER_SENT: "Oferta enviada", AWAITING_OFFER_RESPONSE: "Esperando candidato", OFFER_ACCEPTED: "Oferta aceptada", DOCUMENTS_PENDING: "Documentos pendientes", SIGNATURES_PENDING: "Firmas pendientes", COMPLIANCE_REVIEW: "Revisión final", READY_TO_HIRE: "Lista para confirmar", HIRED: "Contratación confirmada", CANCELLED: "Cancelada" };

export function hiringPhaseLabel(status: HiringContractStatus) {
  if (["DRAFT", "DATA_REVIEW"].includes(status)) return "Información";
  if (["OFFER_PREPARATION", "OFFER_SENT", "AWAITING_OFFER_RESPONSE", "OFFER_ACCEPTED"].includes(status)) return "Oferta";
  if (status === "DOCUMENTS_PENDING") return "Documentos";
  if (status === "SIGNATURES_PENDING") return "Firmas";
  if (["COMPLIANCE_REVIEW", "READY_TO_HIRE"].includes(status)) return "Revisión";
  return "Confirmación";
}

export type HiringStatusGuidance = {
  description: string;
  expectedActor: string;
  requiredData: string;
};

const statusGuidance: Record<HiringContractStatus, HiringStatusGuidance> = {
  DRAFT: { description: "La contratación fue creada y necesita una revisión inicial.", expectedActor: "RR. HH.", requiredData: "Puesto, prioridad y fecha límite" },
  DATA_REVIEW: { description: "Confirma que los datos heredados del ATS sean correctos.", expectedActor: "RR. HH.", requiredData: "Datos del candidato y del puesto" },
  OFFER_PREPARATION: { description: "Selecciona o configura la oferta que se enviará al candidato.", expectedActor: "RR. HH.", requiredData: "Oferta laboral vigente" },
  OFFER_SENT: { description: "La oferta fue enviada y queda pendiente de respuesta.", expectedActor: "Candidato", requiredData: "Respuesta del candidato" },
  AWAITING_OFFER_RESPONSE: { description: "La contratación está detenida hasta recibir la decisión del candidato.", expectedActor: "Candidato", requiredData: "Aceptación o rechazo de la oferta" },
  OFFER_ACCEPTED: { description: "La oferta fue aceptada; prepara los requisitos documentales.", expectedActor: "RR. HH.", requiredData: "Checklist documental" },
  DOCUMENTS_PENDING: { description: "Faltan documentos o hay documentos que requieren corrección.", expectedActor: "Candidato / RR. HH.", requiredData: "Documentos obligatorios revisados" },
  SIGNATURES_PENDING: { description: "Los documentos fueron enviados a firma y falta completar el proceso.", expectedActor: "Candidato", requiredData: "Firmas completadas" },
  COMPLIANCE_REVIEW: { description: "Revisa que el expediente cumpla todos los requisitos antes de confirmar.", expectedActor: "RR. HH.", requiredData: "Documentos y firmas aprobados" },
  READY_TO_HIRE: { description: "El expediente está listo para crear o vincular al empleado.", expectedActor: "RR. HH.", requiredData: "Validación final sin bloqueos" },
  HIRED: { description: "La contratación fue confirmada y el resultado está disponible.", expectedActor: "RR. HH.", requiredData: "Seguimiento de empleado y onboarding" },
  CANCELLED: { description: "La contratación fue cancelada y no tiene acciones pendientes.", expectedActor: "Sin responsable", requiredData: "Motivo registrado" },
};

export function hiringStatusGuidance(status: HiringContractStatus) {
  return statusGuidance[status];
}

export function hiringOfferStatusLabel(status?: string | null) {
  return ({ DRAFT: "Borrador", PENDING_APPROVAL: "Pendiente de aprobación", APPROVED: "Aprobada", SENT: "Enviada", ACCEPTED: "Aceptada", REJECTED: "Rechazada", EXPIRED: "Vencida" } as Record<string, string>)[status ?? ""] ?? status ?? "Sin oferta vinculada";
}

export function hiringSignatureStatusLabel(status?: string | null) {
  return ({ PENDING: "Pendiente", SENT: "Enviado", COMPLETED: "Completado", SIGNED: "Firmado", REJECTED: "Requiere corrección", EXPIRED: "Vencido" } as Record<string, string>)[status ?? ""] ?? status ?? "Sin estado";
}

export function hiringDeadlineState(deadlineAt?: string | null, now = Date.now()) {
  if (!deadlineAt) return "NO_DEADLINE" as const;
  const deadline = new Date(deadlineAt).getTime();
  if (Number.isNaN(deadline)) return "NO_DEADLINE" as const;
  if (deadline < now) return "OVERDUE" as const;
  if (deadline - now <= 48 * 60 * 60 * 1000) return "DUE_SOON" as const;
  return "ON_TRACK" as const;
}

const actionLabels: Record<string, string> = { CONFIGURE_OFFER: "Configurar oferta", SEND_OFFER: "Enviar oferta", WAIT_OFFER_RESPONSE: "Esperar respuesta del candidato", REQUEST_DOCUMENTS: "Solicitar documentos", REVIEW_DOCUMENTS: "Revisar documentos", SEND_SIGNATURES: "Enviar a firma", WAIT_SIGNATURES: "Esperar firmas", REVIEW_COMPLIANCE: "Revisar contratación", CONFIRM_HIRING: "Confirmar contratación" };

const attentionStatuses: HiringContractStatus[] = ["DRAFT", "DATA_REVIEW", "OFFER_PREPARATION", "OFFER_ACCEPTED", "DOCUMENTS_PENDING", "COMPLIANCE_REVIEW", "READY_TO_HIRE"];
const waitingStatuses: HiringContractStatus[] = ["OFFER_SENT", "AWAITING_OFFER_RESPONSE", "SIGNATURES_PENDING"];

export function hiringActionLabel(action: string | null | undefined, status: HiringContractStatus) {
  if (action && actionLabels[action]) return actionLabels[action];
  const normalized = action?.toUpperCase().replaceAll(" ", "_");
  if (normalized && actionLabels[normalized]) return actionLabels[normalized];
  if (status === "HIRED") return "Contratación completada";
  if (status === "CANCELLED") return "Sin acciones";
  return action?.replaceAll("_", " ") || "Revisar contratación";
}

export function hiringDocumentStatusLabel(status: string) {
  return ({ REQUIRED: "Pendiente", REQUESTED: "Solicitado", RECEIVED: "Recibido", UNDER_REVIEW: "En revisión", APPROVED: "Aprobado", REJECTED: "Requiere corrección", SIGNED: "Firmado", WAIVED: "Exento" } as Record<string, string>)[status] ?? status;
}

export function hiringPriorityLabel(priority?: string | null) {
  return ({ LOW: "Baja", MEDIUM: "Normal", HIGH: "Alta", URGENT: "Urgente" } as Record<string, string>)[priority ?? ""] ?? "Sin prioridad";
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
  title: string;
  /** Qué ocurre en esta etapa, en una frase. */
  summary: string;
};

export const HIRING_STAGES: HiringStage[] = [
  { id: "PREPARACION", step: 1, title: "Preparación", summary: "Revisamos a quién vas a contratar y en qué condiciones." },
  { id: "OFERTA", step: 2, title: "Oferta laboral", summary: "Envías la oferta a la persona y esperas su respuesta." },
  { id: "DOCUMENTOS", step: 3, title: "Documentos", summary: "Reúnes y apruebas los documentos que la empresa necesita." },
  { id: "REVISION", step: 4, title: "Revisión final", summary: "Compruebas que no falte nada antes de cerrar la contratación." },
  { id: "CONFIRMACION", step: 5, title: "Confirmación", summary: "Se crea el perfil del empleado y queda listo para trabajar." },
];

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

export function explainHiringBlocker(blocker: HiringContractBlockerDto, candidateName = "la persona candidata"): HiringBlockerExplanation {
  switch (blocker.code) {
    case "REQUIRED_DOCUMENTS_MISSING":
      return { code: blocker.code, what: blocker.message, why: "La empresa necesita el expediente completo antes de dar de alta a alguien.", who: `${candidateName} debe enviarlos y tú debes aprobarlos.`, unlocks: "Cuando estén aprobados podrás pasar a la revisión final." };
    case "SIGNATURES_PENDING":
      return { code: blocker.code, what: blocker.message, why: "Los documentos firmados son el respaldo legal de la contratación.", who: `${candidateName} debe firmarlos desde el correo que recibió.`, unlocks: "Cuando termine de firmar, la contratación queda lista para cerrarse." };
    case "WAITING_CANDIDATE":
      return { code: blocker.code, what: blocker.message, why: "No se piden documentos hasta saber si la persona acepta el puesto.", who: `${candidateName} debe responder a la oferta.`, unlocks: "Con su respuesta podrás continuar o preparar una oferta nueva." };
    case "OFFER_NOT_CONFIGURED":
      return { code: blocker.code, what: "Todavía no hay una oferta vinculada a esta contratación.", why: "La oferta define sueldo, jornada y fecha de inicio; sin ella no hay nada que enviar.", who: "Tú, desde el perfil de reclutamiento de la persona.", unlocks: "Con la oferta vinculada podrás enviarla al candidato." };
    default:
      return { code: blocker.code || "UNKNOWN", what: blocker.message, why: "Es un requisito del proceso de contratación.", who: "Revisa el detalle de la etapa actual.", unlocks: "Al resolverlo podrás continuar con el siguiente paso." };
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

export function resolveHiringCase(contract: HiringContractDto, progress?: HiringContractProgressDto | null): HiringCaseState {
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
    primaryAction: resolvePrimaryAction({ status, stage, canConfirm, pendingDocuments, hasOffer: Boolean(contract.jobOfferId) }),
    waitingOn,
  };
}

function resolvePrimaryAction({ status, stage, canConfirm, pendingDocuments, hasOffer }: { status: HiringContractStatus; stage: HiringStageId; canConfirm: boolean; pendingDocuments: number; hasOffer: boolean }): HiringPrimaryAction {
  if (status === "CANCELLED") return { code: "NONE", label: "Sin acciones pendientes", helper: "Esta contratación fue cancelada. Puedes consultar el historial." };
  if (status === "HIRED") return { code: "VIEW_EMPLOYEE", label: "Ver empleado", helper: "Abre el expediente de la persona que acabas de contratar." };
  if (canConfirm && stage === "REVISION") return { code: "CONFIRM_HIRING", label: "Confirmar contratación", helper: "Se creará el perfil del empleado y se preparará su acceso." };

  switch (stage) {
    case "PREPARACION":
      return { code: "PREPARE_OFFER", label: "Preparar oferta", helper: "Pasarás a elegir la oferta laboral que recibirá la persona." };
    case "OFERTA":
      if (!hasOffer) return { code: "PREPARE_OFFER", label: "Preparar oferta", helper: "Elegirás la oferta laboral que recibirá la persona." };
      if (status === "OFFER_SENT" || status === "AWAITING_OFFER_RESPONSE") return { code: "REVIEW_RESPONSE", label: "Revisar respuesta", helper: "Registrarás si la persona aceptó o rechazó la oferta." };
      return { code: "SEND_OFFER", label: "Enviar oferta", helper: "La persona recibirá la oferta y podrá responderla." };
    case "DOCUMENTOS":
      if (pendingDocuments > 0) return { code: "REVIEW_DOCUMENTS", label: "Revisar documentos", helper: "Aprobarás los documentos recibidos o pedirás correcciones." };
      return { code: "REQUEST_DOCUMENTS", label: "Solicitar documentos", helper: "La persona verá qué documentos debe enviar." };
    case "REVISION":
      return { code: "REVIEW_HIRING", label: "Revisar contratación", helper: "Comprobarás el resumen antes de cerrar la contratación." };
    default:
      return { code: "NONE", label: "Revisar contratación", helper: "Consulta el detalle de la contratación." };
  }
}

/* ------------------------------------------------------------------------- *
 * Etiquetas de dominio en lenguaje cotidiano
 * ------------------------------------------------------------------------- */

export function hiringDocumentTypeLabel(type: string) {
  return ({ IDENTIFICATION: "Identificación oficial", TAX: "Información fiscal", ELIGIBILITY: "Permiso para trabajar", AGREEMENT: "Contrato o acuerdo", POLICY: "Políticas de la empresa", LICENSE: "Licencia o certificación", OTHER: "Otro documento" } as Record<string, string>)[type] ?? "Documento";
}

/**
 * Los identificadores de plantilla de DocuSeal (`w9`, `i9`…) no significan nada
 * para quien contrata. Se traducen aquí y el identificador queda solo en la
 * sección de auditoría.
 */
export function hiringTemplateLabel(templateKey: string) {
  return ({ w9: "Formulario W-9 (información fiscal)", i9: "Formulario I-9 (permiso para trabajar)", "food-employee-reporting": "Acuerdo de manipulación de alimentos" } as Record<string, string>)[templateKey] ?? templateKey.replaceAll("-", " ");
}

export function hiringWaitingLabel(waitingOn: HiringCaseState["waitingOn"], candidateName: string) {
  if (waitingOn === "CANDIDATO") return `Esperando a ${candidateName}`;
  if (waitingOn === "EMPRESA") return "Te toca a ti";
  return "Sin acciones pendientes";
}
