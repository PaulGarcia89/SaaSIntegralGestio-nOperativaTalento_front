import type { HiringContractDto, HiringContractStatus } from "@/lib/contracts";

export type HiringListView = "ALL" | "ATTENTION" | "WAITING" | "READY" | "COMPLETED";

export const hiringStatusLabels: Record<HiringContractStatus, string> = { DRAFT: "Borrador", DATA_REVIEW: "Revisión de datos", OFFER_PREPARATION: "Preparando oferta", OFFER_SENT: "Oferta enviada", AWAITING_OFFER_RESPONSE: "Esperando candidato", OFFER_ACCEPTED: "Oferta aceptada", DOCUMENTS_PENDING: "Documentos pendientes", SIGNATURES_PENDING: "Firmas pendientes", COMPLIANCE_REVIEW: "Revisión final", READY_TO_HIRE: "Lista para confirmar", HIRED: "Contratación confirmada", CANCELLED: "Cancelada" };

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
