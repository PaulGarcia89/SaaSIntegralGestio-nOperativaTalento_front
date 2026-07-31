import { describe, expect, it } from "vitest";
import {
  getTrainingCourseWizardState,
  nextTrainingCourseWizardStep,
  previousTrainingCourseWizardStep,
} from "./training-course-wizard";
import type { TrainingCourseDto } from "./contracts";

function course(overrides: Partial<TrainingCourseDto> = {}): TrainingCourseDto {
  return {
    id: "course-1",
    tenantId: "tenant-1",
    title: "Seguridad operativa",
    slug: "seguridad-operativa",
    summary: "Prácticas seguras",
    description: "Aplicación de procedimientos seguros.",
    estimatedMinutes: 45,
    difficulty: "BEGINNER",
    language: "es",
    tags: [],
    status: "DRAFT",
    isPublished: false,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    modules: [{ id: "module-1", courseId: "course-1", title: "Inicio", sortOrder: 0, isRequired: true, lessons: [{ id: "lesson-1", moduleId: "module-1", title: "Conceptos", sortOrder: 0, estimatedMinutes: 15, isRequired: true, blocks: [{ id: "block-1", lessonId: "lesson-1", type: "RICH_TEXT", sortOrder: 0, isRequired: true }] }] }],
    quizzes: [],
    ...overrides,
  } as TrainingCourseDto;
}

describe("training course wizard", () => {
  it("requires general information, foundation and structure before review", () => {
    const result = getTrainingCourseWizardState(course(), {
      brief: null,
      competencies: [],
      objectives: [],
      audienceRules: [],
      readiness: { ready: false, errors: ["Falta fundamento"] },
    });

    expect(result.completed.GENERAL).toBe(true);
    expect(result.completed.STRUCTURE).toBe(true);
    expect(result.requiredReady).toBe(false);
  });

  it("marks the required authoring path ready without forcing optional phases", () => {
    const result = getTrainingCourseWizardState(course(), {
      brief: null,
      competencies: [],
      objectives: [],
      audienceRules: [],
      readiness: { ready: true, errors: [] },
    });

    expect(result.requiredReady).toBe(true);
    expect(result.completed.ASSESSMENT).toBe(false);
    expect(result.progressPercent).toBe(43);
  });

  it("moves safely through the ordered workflow", () => {
    expect(nextTrainingCourseWizardStep("GENERAL")).toBe("FOUNDATION");
    expect(previousTrainingCourseWizardStep("GENERAL")).toBe("GENERAL");
    expect(nextTrainingCourseWizardStep("PUBLISH")).toBe("PUBLISH");
  });

  it("keeps structure incomplete while a lesson has no duration", () => {
    const incomplete = course();
    incomplete.modules[0].lessons[0].estimatedMinutes = 0;

    expect(getTrainingCourseWizardState(incomplete).completed.STRUCTURE).toBe(false);
  });
});
