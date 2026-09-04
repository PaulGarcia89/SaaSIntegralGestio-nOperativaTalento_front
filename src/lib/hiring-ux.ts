import type { HiringContractDto, HiringContractStatus } from "@/lib/contracts";

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
  return ({ PENDING: "Pendiente", SENT: "Enviado", COMPLETED: "Completado", SIGNED: "Firmado", REJECTED: "Requiere corrección" } as Record<string, string>)[status ?? ""] ?? status ?? "Sin estado";
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
  return ({ REQUIRED: "Pendiente", RECEIVED: "Recibido", UNDER_REVIEW: "En revisión", APPROVED: "Aprobado", REJECTED: "Requiere corrección", SIGNED: "Firmado", WAIVED: "Exento" } as Record<string, string>)[status] ?? status;
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
