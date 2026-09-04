import { describe, expect, it } from "vitest";
import { translate } from "@/i18n";
import { VACANCY_STEPS, stepForVacancyError, vacancyStep, vacancyStepAt, vacancyStepHelp, vacancyStepTitle } from "@/lib/vacancy-wizard";

describe("asistente de puestos", () => {
  it("tiene tres pasos, no siete", () => {
    expect(VACANCY_STEPS).toHaveLength(3);
    expect(VACANCY_STEPS.map((step) => step.id)).toEqual(["PUESTO", "CONDICIONES", "REVISION"]);
  });

  it("cada paso explica qué se resuelve en él, en los dos idiomas", () => {
    (["es", "en"] as const).forEach((locale) => {
      VACANCY_STEPS.forEach((step) => {
        expect(vacancyStepTitle(step.id, locale)).toBeTruthy();
        expect(vacancyStepHelp(step.id, locale)).toBeTruthy();
      });
    });
    expect(vacancyStepTitle("PUESTO", "es")).toBe("El puesto");
    expect(vacancyStepTitle("PUESTO", "en")).toBe("The role");
  });

  // `translate` devuelve la clave misma cuando no la encuentra, así que un
  // hueco en el catálogo inglés se vería en pantalla como
  // "vacancies.step.PUESTO.help" sin que nada fallara. Esto lo convierte en un
  // fallo de prueba.
  it("no deja ningún paso sin traducir al inglés", () => {
    VACANCY_STEPS.forEach((step) => {
      ["title", "help"].forEach((part) => {
        const key = `vacancies.step.${step.id}.${part}`;
        expect(translate("en", key)).not.toBe(key);
      });
    });
  });

  it("lleva cada error obligatorio a su paso, para que el usuario sepa dónde corregirlo", () => {
    expect(stepForVacancyError("vacancy-title")).toBe("PUESTO");
    expect(stepForVacancyError("vacancy-branch")).toBe("PUESTO");
    expect(stepForVacancyError("vacancy-image")).toBe("PUESTO");
    expect(stepForVacancyError("vacancy-openings")).toBe("PUESTO");
    expect(stepForVacancyError("vacancy-description")).toBe("CONDICIONES");
    expect(stepForVacancyError("vacancy-salary-max")).toBe("CONDICIONES");
  });

  it("manda a revisión lo que vive en las secciones avanzadas", () => {
    expect(stepForVacancyError("question-0")).toBe("REVISION");
    expect(stepForVacancyError("stage-name-2")).toBe("REVISION");
    expect(stepForVacancyError("stage-code-0")).toBe("REVISION");
  });

  it("nunca deja un error sin paso: un botón que no avanza sin explicación es lo peor que puede pasar", () => {
    expect(stepForVacancyError("campo-que-alguien-anada-manana")).toBe("REVISION");
  });

  it("resuelve pasos por identificador y por índice sin salirse del rango", () => {
    expect(vacancyStep("CONDICIONES").index).toBe(1);
    expect(vacancyStepAt(-5).id).toBe("PUESTO");
    expect(vacancyStepAt(99).id).toBe("REVISION");
  });
});
