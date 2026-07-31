import { describe, expect, it } from "vitest";
import type { TrainingQuizDto } from "./contracts";
import { getTrainingAssessmentReadiness } from "./training-assessment";

function quiz(overrides: Partial<TrainingQuizDto> = {}): TrainingQuizDto {
  return {
    id: "quiz-1",
    courseId: "course-1",
    title: "Evaluación final",
    passingScore: 80,
    shuffleQuestions: true,
    shuffleOptions: true,
    requireAllQuestions: true,
    feedbackMode: "AFTER_SUBMISSION",
    questions: [{
      id: "question-1",
      prompt: "Describe el procedimiento",
      questionType: "TEXT",
      points: 5,
      requiresManualGrading: true,
      difficulty: "MEDIUM",
      tags: [],
      sortOrder: 0,
      rubric: { criteria: "Incluye todos los pasos" },
      options: [],
    }],
    ...overrides,
  };
}

describe("training assessment readiness", () => {
  it("accepts a manual question with a rubric", () => {
    expect(getTrainingAssessmentReadiness(quiz()).ready).toBe(true);
  });

  it("rejects manual questions without a rubric", () => {
    const item = quiz();
    item.questions[0].rubric = null;
    expect(getTrainingAssessmentReadiness(item).errors).toContain(
      "Las preguntas manuales requieren una rúbrica",
    );
  });

  it("rejects a random sample larger than the question pool", () => {
    expect(getTrainingAssessmentReadiness(quiz({ randomQuestionCount: 2 })).ready).toBe(false);
  });
});
