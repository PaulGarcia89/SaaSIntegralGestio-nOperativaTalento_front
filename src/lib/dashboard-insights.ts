import type { OperationalDashboardItemDto, OperationalDashboardTone } from "@/lib/contracts";

/**
 * Derivaciones del centro operativo.
 *
 * Regla que gobierna este archivo: **todo sale de registros reales**. El
 * endpoint `/dashboard/operational` entrega tareas, alertas, métricas y una
 * acción recomendada, pero NO entrega series temporales. En vez de inventar
 * una, los gráficos del Inicio se construyen a partir de `dueAt` y
 * `occurredAt`, que son campos reales de cada registro. Si algún día el
 * backend expone una serie de evolución, estos gráficos se sustituyen; hasta
 * entonces muestran lo que de verdad se sabe.
 *
 * Puro y sin React a propósito: es la parte que se puede probar.
 */

/* ==========================================================================
   VENCIMIENTOS
   ========================================================================== */

export type DueBucket = "overdue" | "today" | "week" | "later" | "none";

export const DUE_BUCKET_LABELS: Record<DueBucket, string> = {
  overdue: "Vencidos",
  today: "Vencen hoy",
  week: "Esta semana",
  later: "Más adelante",
  none: "Sin fecha",
};

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

function startOfDay(date: Date): number {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
}

/**
 * Clasifica un vencimiento.
 *
 * Se compara por DÍA y no por diferencia de milisegundos: algo que vence hoy a
 * las 09:00, consultado a las 17:00, está vencido; y algo que vence hoy a las
 * 23:00, consultado a las 08:00, vence hoy y no «en 15 horas». Restar
 * instantes daba las dos respuestas mal.
 */
export function dueBucket(dueAt: string | null | undefined, now: Date = new Date()): DueBucket {
  if (!dueAt) return "none";
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) return "none";

  if (due.getTime() < now.getTime()) return "overdue";

  const today = startOfDay(now);
  const dueDay = startOfDay(due);
  if (dueDay === today) return "today";
  if (dueDay - today <= 7 * DAY) return "week";
  return "later";
}

/** Reparto de un conjunto de registros por vencimiento, en orden de urgencia. */
export function bucketByDue(
  items: readonly OperationalDashboardItemDto[],
  now: Date = new Date(),
): Array<{ bucket: DueBucket; label: string; count: number }> {
  const counts: Record<DueBucket, number> = { overdue: 0, today: 0, week: 0, later: 0, none: 0 };
  for (const item of items) counts[dueBucket(item.dueAt, now)] += 1;
  return (["overdue", "today", "week", "later", "none"] as const).map((bucket) => ({
    bucket,
    label: DUE_BUCKET_LABELS[bucket],
    count: counts[bucket],
  }));
}

/**
 * Frase de vencimiento en lenguaje de persona.
 *
 * Trabaja en MINUTOS a propósito. Una versión anterior redondeaba a horas y
 * producía `-0`; como `-0 < 0` es falso en JavaScript, una tarea con diez
 * minutos de retraso decía «vence dentro de menos de una hora».
 */
export function dueLabel(dueAt: string | null | undefined, now: Date = new Date()): string {
  if (!dueAt) return "Sin fecha límite";
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) return "Sin fecha límite";

  const minutes = Math.round((due.getTime() - now.getTime()) / MINUTE);

  if (minutes < 0) {
    const late = Math.abs(minutes);
    if (late < 60) return `Vencido hace ${late} min`;
    if (late < 60 * 24) return `Vencido hace ${Math.floor(late / 60)} h`;
    const days = Math.floor(late / (60 * 24));
    return days === 1 ? "Vencido desde ayer" : `Vencido hace ${days} días`;
  }

  if (minutes < 60) return `Vence en ${minutes} min`;
  if (minutes < 60 * 24) return `Vence en ${Math.floor(minutes / 60)} h`;
  const days = Math.round(minutes / (60 * 24));
  return days === 1 ? "Vence mañana" : `Vence en ${days} días`;
}

/* ==========================================================================
   PRIORIDAD
   ========================================================================== */

const tonePriority: Record<OperationalDashboardTone, number> = {
  danger: 0,
  warning: 1,
  info: 2,
  success: 3,
};

/**
 * Ordena por urgencia: primero el tono, luego la fecha límite.
 *
 * Lo que no tiene fecha va al final de su tono, no al principio: sin fecha no
 * hay urgencia demostrable, y colarlo arriba desplaza algo que sí vence.
 */
export function sortByPriority(
  items: readonly OperationalDashboardItemDto[],
): OperationalDashboardItemDto[] {
  return [...items].sort((left, right) => {
    const byTone = tonePriority[left.tone] - tonePriority[right.tone];
    if (byTone !== 0) return byTone;
    if (left.dueAt && right.dueAt) return new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime();
    if (left.dueAt) return -1;
    if (right.dueAt) return 1;
    return new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime();
  });
}

/* ==========================================================================
   ACTIVIDAD
   ========================================================================== */

/**
 * Registros por día de los últimos `days` días, incluido hoy.
 *
 * Devuelve SIEMPRE la serie completa, con ceros en los días sin actividad: un
 * hueco en la serie se lee como «no hay dato», y aquí el cero es un dato.
 */
export function activityByDay(
  items: readonly OperationalDashboardItemDto[],
  now: Date = new Date(),
  days = 7,
): Array<{ key: string; label: string; count: number }> {
  const today = startOfDay(now);
  const counts = new Map<number, number>();

  for (const item of items) {
    const occurred = new Date(item.occurredAt);
    if (Number.isNaN(occurred.getTime())) continue;
    const day = startOfDay(occurred);
    if (day > today || day < today - (days - 1) * DAY) continue;
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  const formatter = new Intl.DateTimeFormat("es", { weekday: "short", day: "numeric" });
  const series: Array<{ key: string; label: string; count: number }> = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = today - offset * DAY;
    series.push({
      key: new Date(day).toISOString().slice(0, 10),
      label: formatter.format(new Date(day)),
      count: counts.get(day) ?? 0,
    });
  }
  return series;
}

/* ==========================================================================
   SALUD OPERATIVA
   ========================================================================== */

export type OperationalHealth = {
  /** 0-100. Cuanto más alto, mejor. */
  score: number;
  tone: OperationalDashboardTone;
  /** Frase que explica el número. Un indicador sin explicación no sirve. */
  summary: string;
  overdue: number;
  dueToday: number;
  blocking: number;
};

/**
 * Resume el estado de la operación en un número y una frase.
 *
 * El cálculo es deliberadamente simple y está escrito aquí, a la vista, en vez
 * de escondido en el componente: penaliza lo vencido con el doble de peso que
 * lo que vence hoy, y las alertas graves con el mismo peso que un vencimiento.
 * No pretende ser un modelo, sino un orden de magnitud honesto y explicable.
 */
export function operationalHealth(
  tasks: readonly OperationalDashboardItemDto[],
  alerts: readonly OperationalDashboardItemDto[],
  now: Date = new Date(),
): OperationalHealth {
  const overdue = tasks.filter((task) => dueBucket(task.dueAt, now) === "overdue").length;
  const dueToday = tasks.filter((task) => dueBucket(task.dueAt, now) === "today").length;
  const blocking = alerts.filter((alert) => alert.tone === "danger").length;

  const penalty = overdue * 2 + dueToday + blocking * 2;
  const total = Math.max(1, tasks.length + alerts.length);
  const score = Math.max(0, Math.min(100, Math.round(100 - (penalty / (total * 2)) * 100)));

  const tone: OperationalDashboardTone =
    overdue > 0 || blocking > 0 ? "danger" : dueToday > 0 ? "warning" : "success";

  const partes: string[] = [];
  if (overdue > 0) partes.push(overdue === 1 ? "1 pendiente vencido" : `${overdue} pendientes vencidos`);
  if (blocking > 0) partes.push(blocking === 1 ? "1 alerta grave" : `${blocking} alertas graves`);
  if (dueToday > 0) partes.push(dueToday === 1 ? "1 vence hoy" : `${dueToday} vencen hoy`);

  const summary = partes.length === 0 ? "Nada vencido ni bloqueado" : partes.join(" · ");

  return { score, tone, summary, overdue, dueToday, blocking };
}

/* ==========================================================================
   CARGA POR MÓDULO
   ==========================================================================
   `module` es un campo real de cada tarea y de cada alerta, y hasta ahora no
   se mostraba en ninguna parte: el Inicio decía CUÁNTO hay pendiente y CUÁNDO
   vence, pero no DÓNDE está. Esto último es lo que decide a qué pantalla ir.
   ========================================================================== */

export type ModuleLoad = {
  readonly module: string;
  /** Tareas y alertas del módulo dentro del alcance. */
  readonly total: number;
  /** Cuántas de ellas están vencidas. Es lo que ordena la atención. */
  readonly overdue: number;
};

/** Etiqueta de la fila que agrupa la cola larga. */
export const OTHER_MODULES_LABEL = "Otros";

/**
 * Reparto de la carga por módulo, de mayor a menor.
 *
 * Más allá de `limit` filas el gráfico deja de leerse, así que la cola se
 * pliega en una sola fila «Otros» en vez de seguir añadiendo barras. No se
 * descarta nada: los totales de «Otros» son la suma real de lo plegado.
 */
export function groupByModule(
  items: readonly OperationalDashboardItemDto[],
  now: Date = new Date(),
  limit = 6,
): ModuleLoad[] {
  const counts = new Map<string, { total: number; overdue: number }>();

  for (const item of items) {
    const key = item.module?.trim();
    if (!key) continue;
    const entry = counts.get(key) ?? { total: 0, overdue: 0 };
    entry.total += 1;
    if (dueBucket(item.dueAt, now) === "overdue") entry.overdue += 1;
    counts.set(key, entry);
  }

  const ordenados = [...counts.entries()]
    .map(([module, entry]) => ({ module, total: entry.total, overdue: entry.overdue }))
    // A igualdad de total manda lo vencido, y en último término el nombre,
    // para que dos consultas seguidas den siempre el mismo orden.
    .sort((a, b) => b.total - a.total || b.overdue - a.overdue || a.module.localeCompare(b.module, "es"));

  if (ordenados.length <= limit) return ordenados;

  const cabeza = ordenados.slice(0, limit - 1);
  const cola = ordenados.slice(limit - 1);
  return [
    ...cabeza,
    {
      module: OTHER_MODULES_LABEL,
      total: cola.reduce((suma, entrada) => suma + entrada.total, 0),
      overdue: cola.reduce((suma, entrada) => suma + entrada.overdue, 0),
    },
  ];
}

/* ==========================================================================
   TONO DE URGENCIA
   ==========================================================================
   Los cinco tramos de vencimiento NO son cinco categorías intercambiables:
   son una escala de urgencia. Pintarlos todos del mismo color hace que
   «Vencidos» y «Sin fecha» pesen lo mismo a la vista, que es justo lo
   contrario de lo que dicen los datos.
   ========================================================================== */

export type UrgencyTone = "danger" | "warning" | "info" | "neutral";

export const DUE_BUCKET_TONE: Record<DueBucket, UrgencyTone> = {
  overdue: "danger",
  today: "warning",
  week: "info",
  later: "neutral",
  none: "neutral",
};
