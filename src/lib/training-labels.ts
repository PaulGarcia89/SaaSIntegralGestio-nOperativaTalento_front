import type { Tone } from "@/components/system";

/**
 * Vocabulario de capacitación: del código del backend a lenguaje de persona.
 *
 * El módulo volcaba los enumerados tal cual salen del servidor —«HEALTHY»,
 * «CRITICAL», «DELIVERED», «SUCCEEDED», «BEGINNER», «EASY»— en distintivos que
 * lee gente de operaciones, no quien programó la API. El encargo pide estados
 * comprensibles para personas, no códigos técnicos.
 *
 * Cada estado trae además su TONO, porque el color tampoco puede decidirse en
 * la pantalla: «Aprobado» pintado con el color de marca del tenant se lee como
 * un problema en una empresa de marca roja. Aquí el tono lo decide el
 * significado, y siempre viaja acompañado de la palabra (nunca color solo).
 *
 * Un estado que el frontend no conoce NO es un error: se muestra tal cual y en
 * neutro. Inventar un rótulo o pintarlo de rojo sería peor que no traducirlo.
 */

/** Traduce un código desconocido a algo legible en vez de dejarlo en mayúsculas. */
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

/* ── Estado de un curso ─────────────────────────────────────────────────── */

const COURSE_STATUS: Record<string, string> = {
  DRAFT: "Borrador",
  IN_REVIEW: "En revisión",
  APPROVED: "Aprobado",
  SCHEDULED: "Programado",
  PUBLISHED: "Publicado",
  PAUSED: "Pausado",
  ARCHIVED: "Archivado",
  RETIRED: "Retirado",
};

const COURSE_STATUS_TONE: Record<string, Tone> = {
  DRAFT: "neutral",
  IN_REVIEW: "progress",
  APPROVED: "success",
  SCHEDULED: "progress",
  PUBLISHED: "success",
  PAUSED: "warning",
  ARCHIVED: "neutral",
  RETIRED: "neutral",
};

export const courseStatusLabel = (value?: string | null) => lookup(COURSE_STATUS, value);
export const courseStatusTone = (value?: string | null) => toneFor(COURSE_STATUS_TONE, value);

/* ── Dificultad ─────────────────────────────────────────────────────────── */

const COURSE_DIFFICULTY: Record<string, string> = {
  BEGINNER: "Inicial",
  INTERMEDIATE: "Intermedia",
  ADVANCED: "Avanzada",
};

const QUESTION_DIFFICULTY: Record<string, string> = {
  EASY: "Fácil",
  MEDIUM: "Media",
  HARD: "Difícil",
};

export const courseDifficultyLabel = (value?: string | null) => lookup(COURSE_DIFFICULTY, value);
export const questionDifficultyLabel = (value?: string | null) => lookup(QUESTION_DIFFICULTY, value);

/* ── Avance de una persona en un curso ──────────────────────────────────── */

const PROGRESS_STATUS: Record<string, string> = {
  NOT_STARTED: "Sin empezar",
  IN_PROGRESS: "En curso",
  COMPLETED: "Completado",
  OVERDUE: "Vencido",
};

const PROGRESS_TONE: Record<string, Tone> = {
  NOT_STARTED: "neutral",
  IN_PROGRESS: "progress",
  COMPLETED: "success",
  OVERDUE: "danger",
};

export const progressStatusLabel = (value?: string | null) => lookup(PROGRESS_STATUS, value);
export const progressStatusTone = (value?: string | null) => toneFor(PROGRESS_TONE, value);

/* ── Campañas de lanzamiento ────────────────────────────────────────────── */

const LAUNCH_STATUS: Record<string, string> = {
  DRAFT: "Borrador",
  SCHEDULED: "Programada",
  ACTIVE: "En marcha",
  PAUSED: "Pausada",
  COMPLETED: "Terminada",
  CANCELLED: "Cancelada",
};

const LAUNCH_TONE: Record<string, Tone> = {
  DRAFT: "neutral",
  SCHEDULED: "progress",
  ACTIVE: "progress",
  PAUSED: "warning",
  COMPLETED: "success",
  CANCELLED: "neutral",
};

export const launchStatusLabel = (value?: string | null) => lookup(LAUNCH_STATUS, value);
export const launchStatusTone = (value?: string | null) => toneFor(LAUNCH_TONE, value);

/* ── Salud de las integraciones y sus comprobaciones ────────────────────── */

const HEALTH_STATUS: Record<string, string> = {
  HEALTHY: "Todo en orden",
  WARNING: "Requiere atención",
  CRITICAL: "Requiere acción inmediata",
  DEGRADED: "Degradado",
};

const HEALTH_TONE: Record<string, Tone> = {
  HEALTHY: "success",
  WARNING: "warning",
  CRITICAL: "danger",
  DEGRADED: "warning",
};

export const healthStatusLabel = (value?: string | null) => lookup(HEALTH_STATUS, value);
export const healthStatusTone = (value?: string | null) => toneFor(HEALTH_TONE, value);

/* ── Envíos de webhook ──────────────────────────────────────────────────── */

const DELIVERY_STATUS: Record<string, string> = {
  PENDING: "Pendiente de envío",
  PROCESSING: "Enviando",
  DELIVERED: "Entregado",
  FAILED: "Falló",
  DEAD_LETTER: "Descartado tras varios intentos",
  CANCELLED: "Cancelado",
  SKIPPED: "Omitido",
};

const DELIVERY_TONE: Record<string, Tone> = {
  PENDING: "progress",
  PROCESSING: "progress",
  DELIVERED: "success",
  FAILED: "danger",
  DEAD_LETTER: "danger",
  CANCELLED: "neutral",
  SKIPPED: "neutral",
};

export const deliveryStatusLabel = (value?: string | null) => lookup(DELIVERY_STATUS, value);
export const deliveryStatusTone = (value?: string | null) => toneFor(DELIVERY_TONE, value);

/* ── Ejecuciones de procesos automáticos ────────────────────────────────── */

const RUN_STATUS: Record<string, string> = {
  RUNNING: "En ejecución",
  SUCCEEDED: "Terminó bien",
  FAILED: "Falló",
};

const RUN_TONE: Record<string, Tone> = {
  RUNNING: "progress",
  SUCCEEDED: "success",
  FAILED: "danger",
};

const RUN_KIND: Record<string, string> = {
  PROCESS_DUE_COURSES: "Procesar cursos que vencen",
  PROCESS_DUE_LAUNCHES: "Procesar campañas programadas",
  RECOVER_WEBHOOKS: "Recuperar webhooks",
  RETRY_FAILED_WEBHOOKS: "Reintentar webhooks fallidos",
  CLEAR_STALE_LAUNCH_LOCKS: "Liberar bloqueos de campañas",
};

export const runStatusLabel = (value?: string | null) => lookup(RUN_STATUS, value);
export const runStatusTone = (value?: string | null) => toneFor(RUN_TONE, value);
export const runKindLabel = (value?: string | null) => lookup(RUN_KIND, value);

/* ── Paquetes SCORM ─────────────────────────────────────────────────────── */

const PACKAGE_STATUS: Record<string, string> = {
  PENDING: "Pendiente de procesar",
  PROCESSING: "Procesando",
  READY: "Listo",
  VALIDATED: "Validado",
  FAILED: "Falló",
  ARCHIVED: "Archivado",
};

const PACKAGE_TONE: Record<string, Tone> = {
  PENDING: "progress",
  PROCESSING: "progress",
  READY: "success",
  VALIDATED: "success",
  FAILED: "danger",
  ARCHIVED: "neutral",
};

export const packageStatusLabel = (value?: string | null) => lookup(PACKAGE_STATUS, value);
export const packageStatusTone = (value?: string | null) => toneFor(PACKAGE_TONE, value);

/* ── Señales de efectividad y mejoras ───────────────────────────────────── */

const SEVERITY: Record<string, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};

const SEVERITY_TONE: Record<string, Tone> = {
  LOW: "neutral",
  MEDIUM: "warning",
  HIGH: "warning",
  CRITICAL: "danger",
};

export const severityLabel = (value?: string | null) => lookup(SEVERITY, value);
export const severityTone = (value?: string | null) => toneFor(SEVERITY_TONE, value);

const IMPROVEMENT_STATUS: Record<string, string> = {
  OPEN: "Abierta",
  PLANNED: "Planificada",
  IN_PROGRESS: "En curso",
  VALIDATING: "En validación",
  COMPLETED: "Cerrada",
  DISMISSED: "Descartada",
};

const IMPROVEMENT_TONE: Record<string, Tone> = {
  OPEN: "warning",
  PLANNED: "progress",
  IN_PROGRESS: "progress",
  VALIDATING: "progress",
  COMPLETED: "success",
  DISMISSED: "neutral",
};

export const improvementStatusLabel = (value?: string | null) => lookup(IMPROVEMENT_STATUS, value);
export const improvementStatusTone = (value?: string | null) => toneFor(IMPROVEMENT_TONE, value);

/* ── Formatos ───────────────────────────────────────────────────────────── */

/**
 * Duración legible a partir de milisegundos.
 *
 * «412847 ms» no le dice nada a nadie; «6 min 53 s», sí. Por debajo del
 * segundo se conservan los milisegundos, que ahí sí son la unidad natural.
 */
export function formatDuration(ms?: number | null): string {
  if (ms === null || ms === undefined || !Number.isFinite(ms) || ms < 0) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;

  const totalSeconds = Math.round(ms / 1000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);

  if (hours > 0) return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
  if (minutes > 0) return seconds > 0 ? `${minutes} min ${seconds} s` : `${minutes} min`;
  return `${seconds} s`;
}

/**
 * Duración de un curso en minutos, tal como la guarda el backend.
 *
 * Se separa de `formatDuration` a propósito: aquí la unidad de origen es el
 * minuto y redondear a segundos no aporta nada.
 */
export function formatMinutes(minutes?: number | null): string {
  if (minutes === null || minutes === undefined || !Number.isFinite(minutes) || minutes < 0) return "—";
  const whole = Math.round(minutes);
  if (whole < 60) return `${whole} min`;
  const hours = Math.floor(whole / 60);
  const rest = whole % 60;
  return rest > 0 ? `${hours} h ${rest} min` : `${hours} h`;
}

/** Fecha y hora en español, con la zona del navegador. */
export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es", { dateStyle: "medium", timeStyle: "short" });
}
