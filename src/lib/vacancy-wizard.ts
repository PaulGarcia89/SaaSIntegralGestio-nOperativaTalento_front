/**
 * Modelo de pasos para crear o editar un puesto.
 *
 * El asistente tenía siete pasos y diecinueve campos. El backend solo exige
 * dos: `branchId` y `title` (`create-vacancy.dto.ts`; los otros veintitrés
 * llevan `@IsOptional`). Los demás requisitos los añade el frontend y **solo se
 * comprueban al publicar**: guardar un borrador nunca valida nada.
 *
 * Por eso se reagrupa en tres pasos en vez de recortar campos: no se elimina ni
 * se relaja ninguna validación, se reordena cuándo aparece cada cosa. Lo que no
 * hace falta para empezar vive en secciones plegadas.
 */

import { translate } from "@/i18n";
import type { SupportedLocale } from "@/i18n/types";

export type VacancyStepId = "PUESTO" | "CONDICIONES" | "REVISION";

export type VacancyStep = {
  id: VacancyStepId;
  index: number;
};

export const VACANCY_STEPS: VacancyStep[] = [
  { id: "PUESTO", index: 0 },
  { id: "CONDICIONES", index: 1 },
  { id: "REVISION", index: 2 },
];

/** Título del paso, como frase que el usuario reconoce. */
export function vacancyStepTitle(id: VacancyStepId, locale: SupportedLocale = "es"): string {
  return translate(locale, `vacancies.step.${id}.title`);
}

/** Qué se resuelve en ese paso, en una frase. */
export function vacancyStepHelp(id: VacancyStepId, locale: SupportedLocale = "es"): string {
  return translate(locale, `vacancies.step.${id}.help`);
}

/**
 * A qué paso pertenece cada error de validación.
 *
 * Antes esta correspondencia vivía dentro del componente, en una cadena de
 * ternarios de una sola línea. Extraerla permite probarla: si un error no
 * encuentra su paso, el usuario ve un botón que no avanza y ningún mensaje que
 * explique por qué.
 */
export function stepForVacancyError(fieldId: string): VacancyStepId {
  if (["vacancy-title", "vacancy-branch", "vacancy-image", "vacancy-openings"].includes(fieldId)) return "PUESTO";
  if (["vacancy-description", "vacancy-salary-max"].includes(fieldId)) return "CONDICIONES";
  // Preguntas del formulario y etapas del proceso viven en las secciones
  // avanzadas del último paso: quien no las toca nunca las ve, pero si las
  // rompe debe enterarse antes de publicar.
  return "REVISION";
}

export function vacancyStep(id: VacancyStepId): VacancyStep {
  return VACANCY_STEPS.find((step) => step.id === id) ?? VACANCY_STEPS[0];
}

export function vacancyStepAt(index: number): VacancyStep {
  return VACANCY_STEPS[Math.min(Math.max(index, 0), VACANCY_STEPS.length - 1)];
}
