import type {
  EmployeeOnboardingFlowDto,
  EmployeeOnboardingTaskDto,
  OnboardingOwnerType,
} from "@/lib/contracts";
import type { OperationBlocker } from "@/lib/operation-flow";

/**
 * Bloqueos de una incorporación, con las tres respuestas obligatorias.
 *
 * El backend manda `alerts` con `{taskId, severity, message}`: dice QUÉ pasa,
 * pero no quién lo resuelve ni cómo. La pantalla lo mostraba como un distintivo
 * que decía «Bloqueado por documentación» y ahí se acababa la información, así
 * que el usuario veía que estaba parado y no sabía a quién escribir.
 *
 * Aquí se cruza cada alerta con su tarea —que sí trae responsable, dependencias
 * pendientes, documentos y vencimiento— para poder responder las tres.
 *
 * Puro y sin React: es la parte que se puede probar.
 */

/**
 * Quién resuelve.
 *
 * Se prefiere la persona concreta cuando el backend la manda; si no, el equipo
 * al que corresponde por tipo. Cuando no hay ni lo uno ni lo otro se declara la
 * carencia en vez de inventarse un responsable: «sin responsable asignado» es
 * un problema visible que alguien acabará corrigiendo, y un nombre inventado
 * manda al usuario a la persona equivocada.
 */
export function blockerOwner(task: EmployeeOnboardingTaskDto | undefined): string {
  if (!task) return "Sin responsable asignado.";
  if (task.owner?.name) return task.owner.name;

  const porTipo: Record<OnboardingOwnerType, string> = {
    SYSTEM: "Automatización del sistema",
    USER: "Sin responsable asignado.",
    EMPLOYEE: "La persona que se incorpora",
    CANDIDATE: "La persona candidata",
    BRANCH: "La sucursal",
    INVENTORY: "Equipo de inventario",
    TRAINING: "Equipo de formación",
    ACCESS: "Equipo de accesos",
    SIGNATURE: "Equipo de documentos y firmas",
    ONBOARDING: "Equipo de incorporación",
    PRODUCTIVITY: "Equipo de productividad",
  };
  return porTipo[task.ownerType] ?? "Sin responsable asignado.";
}

/**
 * Cómo se resuelve.
 *
 * Se mira el estado real de la tarea, en orden de qué hay que hacer primero:
 * una tarea que espera a otra no se desbloquea subiendo un documento.
 */
export function blockerResolution(task: EmployeeOnboardingTaskDto | undefined): string {
  if (!task) return "Abre la incorporación y revisa qué tarea está detenida.";

  const dependencias = task.waitingForLabels?.filter((label) => label.trim()) ?? [];
  if (dependencias.length > 0) {
    return dependencias.length === 1
      ? `Antes hay que completar «${dependencias[0]}».`
      : `Antes hay que completar: ${dependencias.join(", ")}.`;
  }

  const documentosPendientes = (task.documents ?? []).filter(
    (documento) => documento.status !== "APPROVED" && documento.status !== "SIGNED",
  ).length;
  if (documentosPendientes > 0) {
    return documentosPendientes === 1
      ? `Sube y aprueba el documento pendiente de «${task.title}».`
      : `Sube y aprueba los ${documentosPendientes} documentos pendientes de «${task.title}».`;
  }

  if (task.blockingReason?.trim()) {
    return `Resuelve el motivo registrado y reanuda «${task.title}».`;
  }

  if (task.overdue) {
    return `«${task.title}» venció. Retómala o reasígnala a alguien disponible.`;
  }

  return `Completa la tarea «${task.title}».`;
}

/**
 * Alertas del backend convertidas en bloqueos con causa, responsable y salida.
 *
 * Se conserva la severidad: un aviso (`warning`) no impide seguir y un bloqueo
 * (`danger`) sí. Quien llama decide qué hacer con cada grupo; aquí solo se
 * separan, porque pintarlos igual enseña a la gente a ignorar los dos.
 */
export function onboardingBlockers(flow: EmployeeOnboardingFlowDto): {
  blocking: OperationBlocker[];
  warnings: OperationBlocker[];
} {
  const porId = new Map(flow.tasks.map((task) => [task.id, task]));
  const blocking: OperationBlocker[] = [];
  const warnings: OperationBlocker[] = [];

  for (const alerta of flow.alerts ?? []) {
    const task = porId.get(alerta.taskId);
    const blocker: OperationBlocker = {
      code: alerta.taskId,
      cause: alerta.message?.trim() || task?.title || "El servidor no explicó el motivo.",
      owner: blockerOwner(task),
      resolution: blockerResolution(task),
    };
    if (alerta.severity === "danger") blocking.push(blocker);
    else warnings.push(blocker);
  }

  return { blocking, warnings };
}

/**
 * Estado de la incorporación en una frase, para el distintivo de la cabecera.
 *
 * Antes decía «Bloqueado por documentación» siempre que hubiera CUALQUIER
 * alerta, incluidas las que solo eran avisos, y aunque el bloqueo no tuviera
 * nada que ver con documentación.
 */
export function onboardingHeadline(flow: EmployeeOnboardingFlowDto): {
  label: string;
  tone: "success" | "warning" | "danger" | "progress";
} {
  if (flow.status === "COMPLETED") return { label: "Expediente cerrado", tone: "success" };
  if (flow.status === "CANCELLED") return { label: "Incorporación cancelada", tone: "warning" };

  const { blocking, warnings } = onboardingBlockers(flow);
  if (blocking.length > 0) {
    return {
      label: blocking.length === 1 ? "1 bloqueo por resolver" : `${blocking.length} bloqueos por resolver`,
      tone: "danger",
    };
  }
  if (warnings.length > 0) {
    return {
      label: warnings.length === 1 ? "1 aviso" : `${warnings.length} avisos`,
      tone: "warning",
    };
  }
  return { label: "En marcha, sin bloqueos", tone: "progress" };
}

/** Cuántas tareas quedan y cuántas vencieron. Para el resumen de la cabecera. */
export function onboardingProgress(flow: EmployeeOnboardingFlowDto) {
  const total = flow.tasks.length;
  const completed = flow.tasks.filter((task) => task.status === "COMPLETED").length;
  const overdue = flow.tasks.filter((task) => task.overdue && task.status !== "COMPLETED").length;
  return { total, completed, pending: total - completed, overdue };
}
