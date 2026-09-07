/**
 * Patrón universal de operaciones.
 *
 * Todas las operaciones importantes del producto —contratar, transferir,
 * ajustar existencias, recibir mercancía, registrar consumo o merma, producir,
 * asignar, publicar un curso, lanzar una campaña— son la misma historia en
 * cinco actos:
 *
 *   1. Seleccionar      qué o a quién
 *   2. Registrar        los datos de la operación
 *   3. Revisar impacto  qué cambia si confirmo
 *   4. Confirmar        el punto de no retorno
 *   5. Ver resultado    qué pasó y qué sigue
 *
 * Hasta ahora cada pantalla resolvía esto por su cuenta y el resultado era
 * desigual: unas pedían confirmación y otras no, unas decían lo que iba a pasar
 * y otras solo "¿Estás seguro?", y ninguna avisaba de si la acción era
 * reversible. Este módulo centraliza LAS REGLAS; los componentes solo pintan.
 *
 * Es deliberadamente puro —sin React, sin red, sin DOM— porque es la parte que
 * de verdad se puede probar y la que no debe romperse en silencio.
 */

/** Los cinco actos, en orden. El orden es parte del contrato. */
export const OPERATION_STEPS = ["select", "record", "review", "confirm", "result"] as const;

export type OperationStepId = (typeof OPERATION_STEPS)[number];

/**
 * Un bloqueo: por qué no se puede continuar, de quién depende y cómo se
 * resuelve. Las tres cosas juntas, siempre.
 *
 * Un bloqueo sin responsable ni salida deja al usuario mirando un botón
 * apagado sin saber a quién escribir. Por eso `owner` y `resolution` no son
 * opcionales: si quien construye la pantalla no sabe responderlas, es que
 * todavía no entiende el bloqueo lo bastante como para mostrarlo.
 */
export type OperationBlocker = {
  /** Código estable del backend, para trazas. No se muestra al usuario. */
  code: string;
  /** Qué impide continuar, en lenguaje de persona. */
  cause: string;
  /** Quién puede resolverlo: un rol, un área o una persona concreta. */
  owner: string;
  /** Qué hay que hacer para desbloquearlo. */
  resolution: string;
  /** Campo del formulario al que apunta, si lo hay. Permite enfocarlo. */
  fieldId?: string;
};

/** Un aviso no bloqueante: conviene leerlo, pero no impide confirmar. */
export type OperationWarning = {
  code: string;
  message: string;
};

/**
 * Una línea del resumen de impacto: qué cambia, de qué a qué.
 *
 * `before`/`after` se muestran siempre juntos porque "quedan 12 unidades" no
 * dice nada sin saber que antes había 40.
 */
export type OperationImpactLine = {
  label: string;
  before: string;
  after: string;
  /** `true` si el cambio empeora la situación (baja de stock, sube un costo). */
  adverse?: boolean;
};

/** Impacto económico. Se separa del resto porque es lo primero que se mira. */
export type OperationCostImpact = {
  label: string;
  amount: string;
  /** Variación respecto a la referencia, ya formateada ("+12,4 %"). */
  variation?: string;
  adverse?: boolean;
};

export type OperationImpact = {
  /** Una frase que resume la operación entera. Es lo único que muchos leerán. */
  headline: string;
  /** Cuántos registros se ven afectados. Se muestra aunque sea 1. */
  affectedCount: number;
  affectedLabel: string;
  lines: OperationImpactLine[];
  cost?: OperationCostImpact;
  warnings: OperationWarning[];
  blockers: OperationBlocker[];
  /** Quién queda como responsable de la operación en la auditoría. */
  responsible: string;
  /**
   * `true` si la operación no se puede deshacer desde el producto.
   *
   * No es cosmético: cambia el texto del botón, exige una confirmación
   * explícita y se dice con todas las letras antes de confirmar.
   */
  irreversible: boolean;
};

export type OperationState = {
  step: OperationStepId;
  /** Pasos ya completados. Permite volver atrás sin perder el avance. */
  completed: OperationStepId[];
  impact?: OperationImpact;
  /** `true` mientras el servidor procesa la confirmación. */
  submitting: boolean;
  /** Se llena al terminar; su presencia es lo que habilita el paso `result`. */
  outcome?: OperationOutcome;
};

export type OperationOutcome =
  | { status: "success"; headline: string; detail?: string; nextAction?: { label: string; href: string } }
  | { status: "partial"; headline: string; detail: string; failures: string[] }
  | { status: "error"; headline: string; detail: string; retryable: boolean };

export function initialOperationState(): OperationState {
  return { step: "select", completed: [], submitting: false };
}

export function stepIndex(step: OperationStepId): number {
  return OPERATION_STEPS.indexOf(step);
}

/** Nombres visibles. Verbo en infinitivo: es lo que el usuario va a hacer. */
export const OPERATION_STEP_LABELS: Record<OperationStepId, string> = {
  select: "Seleccionar",
  record: "Registrar",
  review: "Revisar impacto",
  confirm: "Confirmar",
  result: "Resultado",
};

/**
 * ¿Se puede confirmar?
 *
 * Un solo sitio decide esto. Antes cada pantalla combinaba a su manera
 * "¿hay bloqueos?", "¿está enviando?" y "¿faltan datos?", y aparecían botones
 * habilitados que el backend rechazaba, o apagados sin que se supiera por qué.
 */
export function canConfirm(state: OperationState): boolean {
  if (state.submitting) return false;
  if (state.step !== "confirm" && state.step !== "review") return false;
  const impact = state.impact;
  if (!impact) return false;
  return impact.blockers.length === 0;
}

/**
 * Por qué NO se puede confirmar, para decírselo al usuario.
 *
 * Devuelve `null` cuando sí se puede: así quien lo llama no tiene que repetir
 * la condición de `canConfirm`.
 */
export function confirmBlockedReason(state: OperationState): string | null {
  if (state.submitting) return "La operación se está registrando. Espera a que termine.";
  if (!state.impact) return "Todavía no se ha calculado el impacto de la operación.";
  const count = state.impact.blockers.length;
  if (count === 0) return null;
  return count === 1
    ? "Hay un bloqueo que resolver antes de confirmar."
    : `Hay ${count} bloqueos que resolver antes de confirmar.`;
}

/**
 * Siguiente paso alcanzable, o `null` si no lo hay.
 *
 * `review` solo se alcanza con el impacto ya calculado, y `confirm` solo sin
 * bloqueos: es lo que impide que la interfaz ofrezca avanzar hacia una pantalla
 * que no puede hacer nada.
 */
export function nextStep(state: OperationState): OperationStepId | null {
  const index = stepIndex(state.step);
  if (index < 0 || index >= OPERATION_STEPS.length - 1) return null;
  const candidate = OPERATION_STEPS[index + 1];
  if (candidate === "review" && !state.impact) return null;
  if (candidate === "confirm" && !canConfirm({ ...state, step: "review" })) return null;
  if (candidate === "result" && !state.outcome) return null;
  return candidate;
}

/**
 * Paso anterior, o `null` en el primero.
 *
 * Desde `result` no se vuelve: la operación ya se registró y ofrecer "Atrás"
 * invitaría a repetirla. Quien quiera hacer otra, empieza una nueva.
 */
export function previousStep(state: OperationState): OperationStepId | null {
  if (state.step === "result") return null;
  const index = stepIndex(state.step);
  if (index <= 0) return null;
  return OPERATION_STEPS[index - 1];
}

/** Avanza marcando el paso actual como completado. Idempotente. */
export function advance(state: OperationState): OperationState {
  const target = nextStep(state);
  if (!target) return state;
  const completed = state.completed.includes(state.step) ? state.completed : [...state.completed, state.step];
  return { ...state, step: target, completed };
}

export function goBack(state: OperationState): OperationState {
  const target = previousStep(state);
  return target ? { ...state, step: target } : state;
}

/**
 * Un paso es navegable si ya se completó o si es el actual.
 *
 * Deja volver atrás a corregir sin permitir saltarse la revisión del impacto,
 * que es justo el paso que la gente se salta cuando se le deja.
 */
export function canNavigateTo(state: OperationState, target: OperationStepId): boolean {
  if (target === state.step) return true;
  if (state.step === "result") return false;
  return state.completed.includes(target) && stepIndex(target) < stepIndex(state.step);
}

/**
 * Texto del botón de confirmación.
 *
 * Nombra la operación en vez de decir "Confirmar" a secas, y avisa de la
 * irreversibilidad en la propia etiqueta: quien pulsa por costumbre al menos
 * lee la palabra que tiene bajo el dedo.
 */
export function confirmLabel(operationName: string, irreversible: boolean): string {
  return irreversible ? `${operationName} definitivamente` : operationName;
}

/**
 * Frase de consecuencia que se muestra junto al botón de confirmar.
 *
 * Se construye a partir del impacto real, nunca es un texto fijo: "Esta acción
 * no se puede deshacer" sin decir sobre qué es ruido que la gente aprende a
 * ignorar.
 */
export function consequenceSentence(impact: OperationImpact): string {
  const scope = `${impact.affectedCount} ${impact.affectedLabel}`;
  const cost = impact.cost ? ` Impacto económico: ${impact.cost.amount}.` : "";
  const reversibility = impact.irreversible
    ? " Una vez confirmada, no se puede deshacer desde el producto."
    : " Se puede revertir después.";
  return `Vas a registrar esta operación sobre ${scope}.${cost}${reversibility}`;
}

/**
 * Cuenta los cambios adversos del impacto.
 *
 * Se usa para decidir si la revisión se abre resaltada. Una operación con tres
 * bajadas de stock merece más atención que una que solo suma.
 */
export function adverseCount(impact: OperationImpact): number {
  const lines = impact.lines.filter((line) => line.adverse).length;
  return lines + (impact.cost?.adverse ? 1 : 0);
}

/**
 * Ordena los bloqueos poniendo delante los que apuntan a un campo.
 *
 * Los que el usuario puede arreglar él mismo, ahora y en esta pantalla, van
 * primero; los que dependen de otra persona, después.
 */
export function sortBlockers(blockers: OperationBlocker[]): OperationBlocker[] {
  return [...blockers].sort((left, right) => {
    const leftActionable = left.fieldId ? 0 : 1;
    const rightActionable = right.fieldId ? 0 : 1;
    return leftActionable - rightActionable;
  });
}

/**
 * Normaliza los bloqueos que llegan del backend.
 *
 * El backend emite `{code, message, field?}`; aquí se completan `owner` y
 * `resolution` con un valor honesto cuando no vienen. Es preferible decir "no
 * se indicó" a inventarse un responsable: lo primero es una carencia visible
 * que alguien acabará corrigiendo, lo segundo manda al usuario a la persona
 * equivocada.
 */
export function normalizeBlocker(raw: {
  code?: string;
  message?: string;
  field?: string;
  owner?: string;
  resolution?: string;
}): OperationBlocker {
  return {
    code: raw.code ?? "UNKNOWN",
    cause: raw.message?.trim() || "El servidor no explicó el motivo.",
    owner: raw.owner?.trim() || "No se indicó un responsable.",
    resolution: raw.resolution?.trim() || "Consulta con un administrador de la empresa.",
    fieldId: raw.field,
  };
}
