import type { TrainingCourseDesignInput } from "@/lib/contracts";

export function getTrainingCourseDesignErrors(input: TrainingCourseDesignInput) {
  return [
    !input.brief.businessNeed.trim() ? "Define la necesidad del negocio" : null,
    !input.brief.targetOutcome.trim() ? "Define el resultado esperado" : null,
    !input.brief.successKpi.trim() ? "Define el KPI de éxito" : null,
    !input.brief.audienceDescription?.trim() && !input.audienceRules.length ? "Define la audiencia" : null,
    !input.competencies.length ? "Selecciona al menos una competencia" : null,
    !input.objectives.length ? "Agrega al menos un objetivo de aprendizaje" : null,
    input.objectives.some((item) => !item.statement.trim() || !item.successCriteria.trim() || !item.assessmentMethod.trim())
      ? "Completa todos los campos de los objetivos"
      : null,
  ].filter((item): item is string => Boolean(item));
}
