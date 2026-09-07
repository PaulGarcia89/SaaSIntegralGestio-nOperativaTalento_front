import type { Tone } from "@/components/system";

/**
 * Vocabulario de la auditoría de la plataforma.
 *
 * El registro de auditoría es la pantalla a la que se acude cuando algo salió
 * mal y hay que averiguar quién hizo qué. Mostraba las acciones tal como las
 * escribe el backend: `TRANSFER_EMPLOYEE_BRANCH`, `RECOMPUTE_MASTER_WORKFLOW`,
 * `TAMPERED`. Quien audita no tiene por qué leer constantes de código.
 *
 * Las tres reglas de siempre:
 *
 * 1. El rótulo sale del diccionario; un código no descrito se humaniza en vez
 *    de quedarse en mayúsculas, y nunca se oculta —ocultar un evento de
 *    auditoría es peor que mostrarlo mal—.
 * 2. El tono lo decide el significado. `TAMPERED` (un documento manipulado) es
 *    grave; `UPDATED` no lo es.
 * 3. Una acción desconocida es NEUTRA. Pintar de rojo lo que no entendemos
 *    entrena a quien audita a ignorar el rojo.
 */

export type AuditDomain =
  | "acceso"
  | "personas"
  | "contratacion"
  | "documentos"
  | "inventario"
  | "automatizacion"
  | "configuracion"
  | "otro";

export const AUDIT_DOMAIN_LABELS: Record<AuditDomain, string> = {
  acceso: "Acceso y seguridad",
  personas: "Personas",
  contratacion: "Contratación",
  documentos: "Documentos y firmas",
  inventario: "Inventario y compras",
  automatizacion: "Automatizaciones",
  configuracion: "Configuración",
  otro: "Otros",
};

export const AUDIT_DOMAIN_ORDER: AuditDomain[] = [
  "acceso",
  "personas",
  "contratacion",
  "documentos",
  "inventario",
  "automatizacion",
  "configuracion",
  "otro",
];

export type AuditActionInfo = {
  label: string;
  detail: string;
  domain: AuditDomain;
  tone: Tone;
};

const ACTIONS: Record<string, AuditActionInfo> = {
  // ── Acceso ────────────────────────────────────────────────────────────
  AUTH_LOGIN: {
    label: "Inicio de sesión",
    detail: "Alguien entró al producto con sus credenciales.",
    domain: "acceso",
    tone: "neutral",
  },
  ENABLE: {
    label: "Habilitación",
    detail: "Se activó un módulo, una regla o un acceso.",
    domain: "configuracion",
    tone: "info",
  },
  DISABLE: {
    label: "Deshabilitación",
    detail: "Se desactivó un módulo, una regla o un acceso.",
    domain: "configuracion",
    tone: "warning",
  },

  // ── Personas ──────────────────────────────────────────────────────────
  EMPLOYEE_RECORD_REGISTERED: {
    label: "Alta de expediente",
    detail: "Se creó el expediente de una persona en la empresa.",
    domain: "personas",
    tone: "success",
  },
  TRANSFER_EMPLOYEE_BRANCH: {
    label: "Traslado de sucursal",
    detail: "Una persona pasó a depender de otra sucursal.",
    domain: "personas",
    tone: "info",
  },
  START_OFFBOARDING: {
    label: "Inicio de salida",
    detail: "Se abrió el proceso de salida de una persona.",
    domain: "personas",
    tone: "warning",
  },
  CANDIDATE_SSN_UPDATED: {
    label: "Cambio de identificación",
    detail: "Se modificó el documento de identidad de una persona candidata.",
    domain: "personas",
    tone: "warning",
  },

  // ── Contratación ──────────────────────────────────────────────────────
  HIRE_CANDIDATE: {
    label: "Contratación",
    detail: "Se contrató a una persona candidata y pasó a la plantilla.",
    domain: "contratacion",
    tone: "success",
  },
  SEND_OFFER: {
    label: "Envío de oferta",
    detail: "Se preparó y envió una oferta a una persona candidata.",
    domain: "contratacion",
    tone: "info",
  },
  OFFER_SENT: {
    label: "Oferta entregada",
    detail: "La oferta llegó a la persona candidata.",
    domain: "contratacion",
    tone: "info",
  },
  CREATE_CONTRACT: {
    label: "Creación de contrato",
    detail: "Se generó el contrato de una persona.",
    domain: "contratacion",
    tone: "info",
  },
  CONFIRM_CONTRACT: {
    label: "Confirmación de contrato",
    detail: "El contrato quedó firme y en vigor.",
    domain: "contratacion",
    tone: "success",
  },
  CANCEL_CONTRACT: {
    label: "Anulación de contrato",
    detail: "Se dejó sin efecto un contrato ya creado.",
    domain: "contratacion",
    tone: "danger",
  },
  APPROVE: {
    label: "Aprobación",
    detail: "Alguien con permiso aprobó un paso que estaba pendiente.",
    domain: "contratacion",
    tone: "success",
  },
  SCHEDULED_PUBLICATION: {
    label: "Publicación programada",
    detail: "Se dejó una vacante lista para publicarse en una fecha futura.",
    domain: "contratacion",
    tone: "info",
  },
  SCHEDULED_RETIREMENT: {
    label: "Retirada programada",
    detail: "Se dejó una vacante lista para retirarse en una fecha futura.",
    domain: "contratacion",
    tone: "info",
  },

  // ── Documentos y firmas ───────────────────────────────────────────────
  SEND_DOCUMENTS: {
    label: "Envío de documentos",
    detail: "Se enviaron documentos a una persona para que los complete.",
    domain: "documentos",
    tone: "info",
  },
  EMPLOYEE_DOCUMENT_UPLOADED: {
    label: "Documento cargado",
    detail: "Se subió un documento al expediente de una persona.",
    domain: "documentos",
    tone: "info",
  },
  EMPLOYEE_DOCUMENT_REPLACED: {
    label: "Documento sustituido",
    detail: "Se reemplazó un documento del expediente por otra versión.",
    domain: "documentos",
    tone: "warning",
  },
  CONSENT_SIGNED: {
    label: "Consentimiento firmado",
    detail: "Una persona firmó un consentimiento y quedó registrado.",
    domain: "documentos",
    tone: "success",
  },
  DOCUSEAL_SUBMISSION_CREATED: {
    label: "Firma electrónica iniciada",
    detail: "Se abrió un envío de firma electrónica.",
    domain: "documentos",
    tone: "info",
  },
  DOCUSEAL_SUBMISSION_COMPLETED: {
    label: "Firma electrónica completada",
    detail: "Todas las partes firmaron el envío.",
    domain: "documentos",
    tone: "success",
  },
  PACKAGE_CREATED: {
    label: "Paquete creado",
    detail: "Se armó un paquete de documentos para una persona.",
    domain: "documentos",
    tone: "info",
  },
  PACKAGE_SENT: {
    label: "Paquete enviado",
    detail: "El paquete de documentos salió hacia su destinatario.",
    domain: "documentos",
    tone: "info",
  },
  PACKAGE_COMPLETED: {
    label: "Paquete completado",
    detail: "El paquete quedó cerrado con todo lo que pedía.",
    domain: "documentos",
    tone: "success",
  },
  REMINDER_SENT: {
    label: "Recordatorio enviado",
    detail: "Se avisó a alguien de algo que tenía pendiente.",
    domain: "documentos",
    tone: "neutral",
  },
  TAMPERED: {
    label: "Documento alterado",
    detail: "El contenido no coincide con lo firmado. Revísalo antes que nada.",
    domain: "documentos",
    tone: "danger",
  },
  DESIGN_UPDATED: {
    label: "Plantilla modificada",
    detail: "Cambió el diseño de una plantilla de documento.",
    domain: "documentos",
    tone: "info",
  },

  // ── Inventario y compras ──────────────────────────────────────────────
  RECEIPT_CONFIRMED: {
    label: "Recepción confirmada",
    detail: "Se dio por recibida una entrega y entró al inventario.",
    domain: "inventario",
    tone: "success",
  },
  CONFIRMED_FROM_PURCHASE_ORDER: {
    label: "Recepción desde orden de compra",
    detail: "La entrada de inventario se confirmó contra una orden de compra.",
    domain: "inventario",
    tone: "success",
  },
  COUNT_APPROVED: {
    label: "Conteo aprobado",
    detail: "Se aprobó un conteo físico y las diferencias pasaron al stock.",
    domain: "inventario",
    tone: "warning",
  },

  // ── Automatizaciones ──────────────────────────────────────────────────
  EXECUTION_STARTED: {
    label: "Ejecución iniciada",
    detail: "Una automatización empezó a correr.",
    domain: "automatizacion",
    tone: "info",
  },
  EXECUTION_FINISHED: {
    label: "Ejecución terminada",
    detail: "La automatización llegó al final de su recorrido.",
    domain: "automatizacion",
    tone: "success",
  },
  RULE_SKIPPED: {
    label: "Regla omitida",
    detail: "La regla existía pero no se aplicó a este caso.",
    domain: "automatizacion",
    tone: "neutral",
  },
  RULES_NOT_FOUND: {
    label: "Sin reglas aplicables",
    detail: "No había ninguna regla que cubriera lo que ocurrió.",
    domain: "automatizacion",
    tone: "warning",
  },
  ADD_WORKFLOW_EVENT: {
    label: "Evento añadido al flujo",
    detail: "Se registró un paso adicional dentro de un flujo en curso.",
    domain: "automatizacion",
    tone: "info",
  },
  RECOMPUTE_MASTER_WORKFLOW: {
    label: "Flujo recalculado",
    detail: "Se recalculó el flujo maestro y sus pasos pendientes.",
    domain: "automatizacion",
    tone: "info",
  },
  UPDATE_WORKFLOW_STEP_STATUS: {
    label: "Cambio de estado de un paso",
    detail: "Un paso del flujo pasó a otro estado.",
    domain: "automatizacion",
    tone: "info",
  },
  UPDATE_WORKFLOW_STEP_PROGRESS: {
    label: "Avance de un paso",
    detail: "Se registró progreso dentro de un paso del flujo.",
    domain: "automatizacion",
    tone: "neutral",
  },
  QUALITY_CHANGES_REQUESTED: {
    label: "Cambios solicitados",
    detail: "Una revisión de calidad devolvió el trabajo con correcciones.",
    domain: "automatizacion",
    tone: "warning",
  },

  // ── Configuración y datos ─────────────────────────────────────────────
  CREATED: {
    label: "Creación",
    detail: "Se creó un registro nuevo desde alguna pantalla del producto.",
    domain: "configuracion",
    tone: "success",
  },
  UPDATED: { label: "Modificación", detail: "Se modificó un registro existente.", domain: "configuracion", tone: "info" },
  UPSERT: {
    label: "Creación o modificación",
    detail: "Se guardó un registro: se creó si no existía y se actualizó si ya estaba.",
    domain: "configuracion",
    tone: "info",
  },
  DELETE: {
    label: "Eliminación",
    detail: "Se eliminó un registro. Es el evento que más conviene revisar.",
    domain: "configuracion",
    tone: "danger",
  },
  DUPLICATED: {
    label: "Duplicación",
    detail: "Se creó una copia de un registro existente.",
    domain: "configuracion",
    tone: "info",
  },
};

/** Se humaniza en vez de mostrar la constante: `TRANSFER_EMPLOYEE_BRANCH`. */
export function humanizeAction(code: string): string {
  const clean = code.trim().replace(/[_.-]+/g, " ").toLocaleLowerCase("es");
  if (!clean) return "Acción sin nombre";
  return clean.charAt(0).toLocaleUpperCase("es") + clean.slice(1);
}

export function auditActionInfo(code: unknown): AuditActionInfo {
  if (typeof code !== "string" || code.trim() === "") {
    return {
      label: "Acción sin registrar",
      detail: "El evento llegó sin acción. Consúltalo con quien mantenga la plataforma.",
      domain: "otro",
      tone: "neutral",
    };
  }
  const known = ACTIONS[code];
  if (known) return known;
  return {
    label: humanizeAction(code),
    detail: "Acción que esta pantalla todavía no describe. Se muestra tal cual llegó, sin interpretarla.",
    domain: "otro",
    tone: "neutral",
  };
}

export const auditActionLabel = (code: unknown) => auditActionInfo(code).label;

/** Todos los códigos descritos, ya agrupados y ordenados para un desplegable. */
export function auditActionOptions(): Array<{ group: string; options: Array<{ value: string; label: string }> }> {
  return AUDIT_DOMAIN_ORDER.map((domain) => ({
    group: AUDIT_DOMAIN_LABELS[domain],
    options: Object.keys(ACTIONS)
      .filter((code) => ACTIONS[code].domain === domain)
      .map((code) => ({ value: code, label: ACTIONS[code].label }))
      .sort((a, b) => a.label.localeCompare(b.label, "es")),
  })).filter((group) => group.options.length > 0);
}

/** Lista plana, para un `FormSelect` que no admite grupos. */
export function auditActionFlatOptions(): Array<{ value: string; label: string }> {
  return auditActionOptions().flatMap((group) =>
    group.options.map((option) => ({ value: option.value, label: `${group.group} · ${option.label}` })),
  );
}

/** Códigos descritos. Se exporta para poder comprobarlo en pruebas. */
export const DESCRIBED_AUDIT_ACTIONS = Object.keys(ACTIONS);

/**
 * Filtro de texto sobre lo ya cargado.
 *
 * La API filtra por acción EXACTA y no ofrece búsqueda libre, así que el
 * cuadro de texto solo puede afinar la página que ya está en pantalla. Que lo
 * haga bien —y que la pantalla lo diga— es mejor que fingir una búsqueda
 * global que el servidor no tiene.
 */
export function matchesAuditEntry(
  entry: { action?: string; route?: string | null; userId?: string | null },
  term: string,
): boolean {
  const needle = term.trim().toLocaleLowerCase("es");
  if (!needle) return true;
  const haystack = [
    entry.action ?? "",
    auditActionLabel(entry.action),
    auditActionInfo(entry.action).detail,
    entry.route ?? "",
    entry.userId ?? "",
  ]
    .join(" ")
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return haystack.includes(needle.normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
}
