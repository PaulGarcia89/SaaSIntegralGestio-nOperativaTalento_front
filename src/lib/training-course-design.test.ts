import { describe, expect, it } from "vitest";
import { getTrainingCourseDesignErrors } from "./training-course-design";

describe("training course design readiness", () => {
  it("reports every missing pedagogical foundation", () => {
    const errors = getTrainingCourseDesignErrors({
      brief: { businessNeed: "", targetOutcome: "", successKpi: "" },
      competencies: [],
      objectives: [],
      audienceRules: [],
    });

    expect(errors).toHaveLength(6);
  });

  it("accepts a measurable design foundation", () => {
    const errors = getTrainingCourseDesignErrors({
      brief: {
        businessNeed: "Reducir errores de entrega",
        targetOutcome: "Ejecutar el proceso sin omisiones",
        successKpi: "30% menos incidencias",
        audienceDescription: "Personal de inventario",
      },
      competencies: [{ competencyId: "competency-1", targetLevel: "WORKING", isRequired: true, sortOrder: 0 }],
      objectives: [{
        competencyId: "competency-1",
        statement: "Registrar una entrega correctamente",
        successCriteria: "100% de campos obligatorios",
        assessmentMethod: "Caso práctico",
        targetLevel: "WORKING",
        isRequired: true,
        sortOrder: 0,
      }],
      audienceRules: [],
    });

    expect(errors).toEqual([]);
  });
});
