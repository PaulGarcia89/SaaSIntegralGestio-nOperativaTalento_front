import type { Tone } from "@/components/system";
import type { InventoryAssetCondition, InventoryAssetStatus } from "@/lib/contracts";

/**
 * Vocabulario del inventario de activos: del código del backend a lenguaje de
 * persona.
 *
 * El módulo tenía un diccionario de estados encerrado dentro de
 * `inventory-workspace.tsx`, sin exportar y sin pruebas, mientras las demás
 * pantallas del mismo módulo volcaban los mismos códigos en crudo: el
 * empleado leía «ASSIGNED» sobre su propio portátil en «Mis activos», el
 * escáner mostraba «RETURN_PENDING» y el formulario de alta pedía elegir la
 * condición entre «NEW», «GOOD», «FAIR» y «DAMAGED».
 *
 * Las reglas son las mismas que en capacitación y en restaurante:
 *
 * 1. El rótulo sale del diccionario; un código desconocido se humaniza en vez
 *    de pintarse en mayúsculas o de dejar el hueco vacío.
 * 2. El tono lo decide el significado, no la marca del tenant.
 * 3. Un estado que el frontend no conoce es NEUTRO, nunca rojo: un despliegue
 *    del backend no puede convertirse en una alarma falsa para la operación.
 */

function humanize(code: string): string {
  return code
    .replaceAll("_", " ")
    .toLocaleLowerCase("es")
    .replace(/^./, (letter) => letter.toLocaleUpperCase("es"));
}

function lookup(map: Record<string, string>, value?: string | null): string {
  if (!value) return "Sin definir";
  return map[value.toUpperCase()] ?? humanize(value);
}

function toneFor(map: Record<string, Tone>, value?: string | null): Tone {
  if (!value) return "neutral";
  return map[value.toUpperCase()] ?? "neutral";
}

/* ── Estado de un activo ────────────────────────────────────────────────── */

const ASSET_STATUS: Record<InventoryAssetStatus | string, string> = {
  AVAILABLE: "Disponible",
  RESERVED: "Reservado",
  ASSIGNED: "Entregado",
  IN_TRANSIT: "En tránsito",
  RETURN_PENDING: "Devolución pendiente",
  MAINTENANCE: "En mantenimiento",
  LOST: "Perdido",
  RETIRED: "Retirado",
};

const ASSET_STATUS_TONE: Record<string, Tone> = {
  AVAILABLE: "success",
  RESERVED: "progress",
  ASSIGNED: "info",
  IN_TRANSIT: "progress",
  RETURN_PENDING: "warning",
  MAINTENANCE: "warning",
  LOST: "danger",
  RETIRED: "neutral",
};

export const assetStatusLabel = (value?: string | null) => lookup(ASSET_STATUS, value);
export const assetStatusTone = (value?: string | null) => toneFor(ASSET_STATUS_TONE, value);

/** Las opciones tal como se ofrecen en un desplegable, ya traducidas. */
export const ASSET_STATUS_OPTIONS: Array<{ value: InventoryAssetStatus; label: string }> = (
  ["AVAILABLE", "RESERVED", "ASSIGNED", "IN_TRANSIT", "RETURN_PENDING", "MAINTENANCE", "LOST", "RETIRED"] as const
).map((value) => ({ value, label: ASSET_STATUS[value] }));

/* ── Condición física ───────────────────────────────────────────────────── */

const CONDITION: Record<InventoryAssetCondition | string, string> = {
  NEW: "Nuevo",
  GOOD: "Buen estado",
  FAIR: "Con desgaste",
  DAMAGED: "Dañado",
};

const CONDITION_TONE: Record<string, Tone> = {
  NEW: "success",
  GOOD: "success",
  FAIR: "warning",
  DAMAGED: "danger",
};

export const conditionLabel = (value?: string | null) => lookup(CONDITION, value);
export const conditionTone = (value?: string | null) => toneFor(CONDITION_TONE, value);

export const CONDITION_OPTIONS: Array<{ value: InventoryAssetCondition; label: string }> = (
  ["NEW", "GOOD", "FAIR", "DAMAGED"] as const
).map((value) => ({ value, label: CONDITION[value] }));

/* ── Movimientos en la bitácora del activo ──────────────────────────────── */

const MOVEMENT: Record<string, string> = {
  REGISTERED: "Activo registrado",
  ASSIGNED: "Asignado a una persona",
  DELIVERED: "Entrega confirmada",
  TRANSFERRED: "Transferido de sucursal",
  RETURN_REQUESTED: "Devolución solicitada",
  RETURNED: "Activo recibido",
  RETURN_VALIDATED: "Devolución validada",
  RETIRED: "Dado de baja",
  LOST: "Declarado perdido",
  MAINTENANCE_OPENED: "Mantenimiento abierto",
  MAINTENANCE_RESOLVED: "Mantenimiento resuelto",
  ADJUSTED: "Existencia ajustada",
};

export const movementLabel = (value?: string | null) => lookup(MOVEMENT, value);

/* ── Órdenes de compra ──────────────────────────────────────────────────── */

const PURCHASE_STATUS: Record<string, string> = {
  DRAFT: "Pendiente de aprobación",
  APPROVED: "Aprobada",
  PARTIALLY_RECEIVED: "Recibida en parte",
  RECEIVED: "Recibida",
  COMPLETED: "Cerrada",
  CANCELLED: "Cancelada",
  REJECTED: "Rechazada",
};

const PURCHASE_TONE: Record<string, Tone> = {
  DRAFT: "progress",
  APPROVED: "info",
  PARTIALLY_RECEIVED: "warning",
  RECEIVED: "success",
  COMPLETED: "success",
  CANCELLED: "neutral",
  REJECTED: "danger",
};

export const purchaseStatusLabel = (value?: string | null) => lookup(PURCHASE_STATUS, value);
export const purchaseStatusTone = (value?: string | null) => toneFor(PURCHASE_TONE, value);

/* ── Mantenimiento ──────────────────────────────────────────────────────── */

const MAINTENANCE_TYPE: Record<string, string> = {
  PREVENTIVE: "Preventivo",
  CORRECTIVE: "Correctivo",
  INSPECTION: "Inspección",
  CALIBRATION: "Calibración",
  WARRANTY: "Garantía",
  OTHER: "Otro",
};

const MAINTENANCE_STATUS: Record<string, string> = {
  OPEN: "Abierto",
  IN_PROGRESS: "En curso",
  SCHEDULED: "Programado",
  RESOLVED: "Resuelto",
  CANCELLED: "Cancelado",
};

const MAINTENANCE_TONE: Record<string, Tone> = {
  OPEN: "warning",
  IN_PROGRESS: "progress",
  SCHEDULED: "progress",
  RESOLVED: "success",
  CANCELLED: "neutral",
};

export const maintenanceTypeLabel = (value?: string | null) => lookup(MAINTENANCE_TYPE, value);
export const maintenanceStatusLabel = (value?: string | null) => lookup(MAINTENANCE_STATUS, value);
export const maintenanceStatusTone = (value?: string | null) => toneFor(MAINTENANCE_TONE, value);

/**
 * Tipos de mantenimiento como opciones.
 *
 * El formulario pedía el tipo en un campo de texto libre, con «CORRECTIVO»
 * como valor inicial mientras el backend devuelve «CORRECTIVE»: se guardaba un
 * valor en español en un campo que luego se mostraba en inglés, y escribirlo
 * en minúsculas rompía la coherencia del dato.
 */
export const MAINTENANCE_TYPE_OPTIONS: Array<{ value: string; label: string }> = Object.entries(
  MAINTENANCE_TYPE,
).map(([value, label]) => ({ value, label }));

/* ── Auditoría del módulo ───────────────────────────────────────────────── */

const AUDIT_ACTION: Record<string, string> = {
  ASSET_REGISTERED: "Registró un activo",
  ASSET_ASSIGNED: "Asignó un activo",
  ASSET_DELIVERED: "Confirmó una entrega",
  ASSET_TRANSFERRED: "Transfirió un activo",
  ASSET_RETURN_REQUESTED: "Solicitó una devolución",
  ASSET_RETURNED: "Recibió una devolución",
  ASSET_RETURN_VALIDATED: "Validó una devolución",
  ASSET_RETIRED: "Dio de baja un activo",
  STOCK_ADJUSTED: "Ajustó existencias",
  STOCK_COUNTED: "Registró un conteo",
  PURCHASE_ORDER_CREATED: "Creó una orden de compra",
  PURCHASE_ORDER_APPROVED: "Aprobó una orden de compra",
  PURCHASE_ORDER_RECEIVED: "Recibió mercancía",
  MAINTENANCE_CREATED: "Abrió un mantenimiento",
  MAINTENANCE_RESOLVED: "Resolvió un mantenimiento",
};

export const auditActionLabel = (value?: string | null) => lookup(AUDIT_ACTION, value);

/* ── Formatos ───────────────────────────────────────────────────────────── */

/** Cantidad con coma decimal y sin decimales inútiles. */
export function formatQuantity(value: unknown): string {
  const number = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : Number.NaN;
  if (!Number.isFinite(number)) return "—";
  return new Intl.NumberFormat("es", { maximumFractionDigits: 2 }).format(number);
}

/**
 * Importe con su moneda.
 *
 * El módulo imprimía `{order.currency} {order.totalAmount}`, que producía
 * «USD 1250.5»: el código ISO delante y el número sin separadores ni
 * decimales fijos.
 */
export function formatMoney(value: unknown, currency = "USD"): string {
  const number = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : Number.NaN;
  if (!Number.isFinite(number)) return "—";
  try {
    return new Intl.NumberFormat("es", { style: "currency", currency, maximumFractionDigits: 2 }).format(number);
  } catch {
    // Una moneda que Intl no reconoce no puede tumbar la pantalla.
    return `${currency} ${new Intl.NumberFormat("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(number)}`;
  }
}

/** Fecha y hora en español, con la zona del navegador. */
export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es", { dateStyle: "medium", timeStyle: "short" });
}
