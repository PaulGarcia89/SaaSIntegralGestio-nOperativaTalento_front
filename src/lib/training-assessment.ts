import type { TrainingQuizDto } from "./contracts";

export function getTrainingAssessmentReadiness(quiz: TrainingQuizDto) {
  const errors = [
    quiz.questions.length === 0 ? "Agrega al menos una pregunta" : null,
    quiz.randomQuestionCount && quiz.randomQuestionCount > quiz.questions.length
      ? "La selección aleatoria excede las preguntas disponibles"
      : null,
    quiz.questions.some((question) => question.requiresManualGrading && !question.rubric)
      ? "Las preguntas manuales requieren una rúbrica"
      : null,
  ].filter((error): error is string => Boolean(error));

  return { ready: errors.length === 0, errors };
}
