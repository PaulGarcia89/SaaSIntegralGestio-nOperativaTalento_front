import type { EmployeeOnboardingFlowDto, EmployeeOnboardingTaskDto } from "@/lib/contracts";

/**
 * Derivaciones del panel de Incorporación.
 *
 * Regla que gobierna este archivo, la misma que en `dashboard-insights`: todo
 * sale de registros reales. `/onboarding/flows` entrega cada expediente con su
 * avance y sus tareas, y `/onboarding/analytics` los tiempos por etapa. Aquí no
 * se estima nada; se agrega lo que ya viene.
 *
 * Puro y sin React a propósito: es la parte que se puede probar.
 */

/* ==========================================================================
   AVANCE
   ==========================================================================
   «En curso: 12» no dice si van bien. Doce incorporaciones al 10 % y doce al
   90 % son la misma cifra y situaciones opuestas. `progressPercent` viene en
   cada expediente y no se agregaba en ninguna parte.
   ========================================================================== */

export type ProgressBand = "starting" | "early" | "half" | "closing";

/** Tramos en orden de avance, del que menos ha andado al que casi termina. */
export const PROGRESS_BANDS: readonly ProgressBand[] = ["starting", "early", "half", "closing"] as const;

/**
 * Tramo de avance de un expediente.
 *
 * Los cortes son 25/50/75 y el tramo se decide por el porcentaje que entrega
 * el servidor, sin redondearlo antes: un 24,6 % es «empezando», no «avanzando».
 */
export function progressBand(percent: number): ProgressBand {
  const valor = Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : 0;
  if (valor < 25) return "starting";
  if (valor < 50) return "early";
  if (valor < 75) return "half";
  return "closing";
}

/** Reparto de expedientes por tramo de avance, siempre con los cuatro tramos. */
export function bucketByProgress(
  flows: readonly EmployeeOnboardingFlowDto[],
): Array<{ band: ProgressBand; count: number }> {
  const counts: Record<ProgressBand, number> = { starting: 0, early: 0, half: 0, closing: 0 };
  for (const flow of flows) counts[progressBand(flow.progressPercent)] += 1;
  // Se devuelven los cuatro aunque valgan cero: un tramo que desaparece se lee
  // como «no existe», y aquí el cero es un dato.
  return PROGRESS_BANDS.map((band) => ({ band, count: counts[band] }));
}

/* ==========================================================================
   ESTADO DE LAS TAREAS
   ==========================================================================
   Lo que de verdad frena una incorporación no es el expediente, es la tarea.
   El panel contaba las vencidas y nada más; bloqueadas y en curso estaban en
   los datos sin mirarse.
   ========================================================================== */

export type TaskBucket = "overdue" | "blocked" | "inProgress" | "pending";

/** En orden de urgencia: lo que hay que mirar primero va primero. */
export const TASK_BUCKETS: readonly TaskBucket[] = ["overdue", "blocked", "inProgress", "pending"] as const;

/**
 * Clasifica una tarea abierta.
 *
 * Devuelve `null` para lo cerrado o cancelado, que no es carga de trabajo.
 * El orden de comprobación importa: una tarea vencida Y bloqueada cuenta como
 * vencida, porque el vencimiento es lo que obliga a actuar hoy.
 *
 * Vencida se decide contra el instante que se pasa, no contra el reloj del
 * navegador leído aquí dentro: así el render es determinista y coincide con
 * el resto de la pantalla.
 */
export function taskBucket(task: EmployeeOnboardingTaskDto, now: Date): TaskBucket | null {
  if (task.status === "COMPLETED" || task.status === "CANCELLED") return null;
  const vence = task.dueDate ? new Date(task.dueDate) : null;
  const vencida = Boolean(vence && !Number.isNaN(vence.getTime()) && vence.getTime() < now.getTime());
  if (vencida) return "overdue";
  if (task.status === "BLOCKED") return "blocked";
  if (task.status === "IN_PROGRESS") return "inProgress";
  return "pending";
}

/** Recuento de tareas abiertas por estado, sobre los expedientes dados. */
export function countTasks(
  flows: readonly EmployeeOnboardingFlowDto[],
  now: Date,
): Array<{ bucket: TaskBucket; count: number }> {
  const counts: Record<TaskBucket, number> = { overdue: 0, blocked: 0, inProgress: 0, pending: 0 };
  for (const flow of flows) {
    for (const task of flow.tasks) {
      const bucket = taskBucket(task, now);
      if (bucket) counts[bucket] += 1;
    }
  }
  return TASK_BUCKETS.map((bucket) => ({ bucket, count: counts[bucket] }));
}

/** Cuántas tareas de un expediente caen en un estado. */
export function countTasksIn(flow: EmployeeOnboardingFlowDto, bucket: TaskBucket, now: Date): number {
  return flow.tasks.reduce((suma, task) => suma + (taskBucket(task, now) === bucket ? 1 : 0), 0);
}

/* ==========================================================================
   URGENCIA DEL EXPEDIENTE
   ==========================================================================
   Un único criterio de orden, escrito una vez. Antes vivía dentro del
   componente y solo servía para decidir quién entraba en «requieren
   atención»; ahora ordena toda la lista, que es lo que permite enseñarla
   entera sin que lo grave se pierda al final.
   ========================================================================== */

export type FlowUrgency = {
  readonly flow: EmployeeOnboardingFlowDto;
  /** Alertas que el servidor marca como graves. */
  readonly critical: number;
  readonly overdue: number;
  readonly blocked: number;
  /** Verdadero si algo de lo anterior obliga a mirar el expediente. */
  readonly needsAttention: boolean;
};

/** Ordena los expedientes por lo que obliga a actuar, de más a menos. */
export function sortByUrgency(
  flows: readonly EmployeeOnboardingFlowDto[],
  now: Date,
): FlowUrgency[] {
  return flows
    .map((flow) => {
      const critical = flow.alerts.filter((alerta) => alerta.severity === "danger").length;
      const overdue = countTasksIn(flow, "overdue", now);
      const blocked = countTasksIn(flow, "blocked", now);
      return { flow, critical, overdue, blocked, needsAttention: critical > 0 || overdue > 0 || blocked > 0 };
    })
    .sort(
      (a, b) =>
        b.critical - a.critical ||
        b.overdue - a.overdue ||
        b.blocked - a.blocked ||
        // A igualdad, primero quien menos ha avanzado: es quien más lejos está
        // de terminar y más margen hay para ayudarle.
        a.flow.progressPercent - b.flow.progressPercent ||
        a.flow.employee.name.localeCompare(b.flow.employee.name, "es"),
    );
}
