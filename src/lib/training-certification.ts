import type {
  TrainingCertificationPolicyDto,
  TrainingCourseDto,
} from "./contracts";
import { getTrainingAssessmentReadiness } from "./training-assessment";

export function getTrainingCertificationReadiness(
  course: TrainingCourseDto,
  policy?: TrainingCertificationPolicyDto | null,
) {
  const errors = [
    !policy?.isEnabled ? "Activa la certificación para este curso" : null,
    policy?.validityDays && policy.renewalWindowDays >= policy.validityDays
      ? "La ventana de renovación debe ser menor que la vigencia"
      : null,
    policy?.isEnabled && policy.requireAssessment &&
    (!course.quizzes?.length || course.quizzes.some((quiz) => !getTrainingAssessmentReadiness(quiz).ready))
      ? "Configura al menos una evaluación lista"
      : null,
  ].filter((error): error is string => Boolean(error));

  return { ready: errors.length === 0, errors };
}
