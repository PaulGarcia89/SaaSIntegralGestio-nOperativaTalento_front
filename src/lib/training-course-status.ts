import type { TrainingCourseStatus } from "@/lib/contracts";

/**
 * Estados en los que el BACKEND permite editar el contenido de un curso.
 *
 * Espejo de `editableStatuses` en
 * `BackEnd/src/training/training-admin.service.ts`. El servidor rechaza con 409
 * cualquier escritura sobre la fundación pedagógica o la estructura de un curso
 * que no esté en uno de estos cuatro estados; la pantalla solo comprobaba el
 * PERMISO (`courses.update`) y no el estado, así que dibujaba el formulario
 * entero, dejaba rellenarlo y fallaba al guardar con un mensaje del servidor
 * sin traducir. La regla del servidor es correcta —el contenido de un curso
 * publicado no puede cambiar bajo los pies de quien lo está cursando—; lo que
 * faltaba era decirlo ANTES.
 */
export const ESTADOS_CONTENIDO_EDITABLE: readonly TrainingCourseStatus[] = [
  "DRAFT",
  "IN_REVIEW",
  "APPROVED",
  "PAUSED",
];

export function contenidoEsEditable(status: TrainingCourseStatus) {
  return ESTADOS_CONTENIDO_EDITABLE.includes(status);
}

/**
 * Qué hacer cuando el contenido está bloqueado.
 *
 * `accion` nombra la transición que devuelve el curso a un estado editable, y
 * sale de la tabla de transiciones del backend (`allowedTrainingCourseTransitions`):
 * PUBLISHED admite PAUSED y SCHEDULED admite DRAFT. ARCHIVED solo puede pasar a
 * RETIRED y RETIRED no admite nada: ahí no hay vuelta y hay que decirlo, no
 * dejar al usuario buscando un botón que no existe.
 */
export type SalidaBloqueo =
  | { tipo: "transicion"; accion: "pause" | "return-draft" }
  | { tipo: "sin-salida" };

export function salidaDelBloqueo(status: TrainingCourseStatus): SalidaBloqueo | null {
  if (contenidoEsEditable(status)) return null;
  if (status === "PUBLISHED") return { tipo: "transicion", accion: "pause" };
  if (status === "SCHEDULED") return { tipo: "transicion", accion: "return-draft" };
  return { tipo: "sin-salida" };
}
