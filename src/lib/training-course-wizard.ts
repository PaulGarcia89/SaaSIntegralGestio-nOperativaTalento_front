import type { TrainingCourseDesignDto, TrainingCourseDto } from "@/lib/contracts";
import { getTrainingAssessmentReadiness } from "./training-assessment";
import { getTrainingCertificationReadiness } from "./training-certification";
import { getTrainingQualityReadiness } from "./training-quality";

export type TrainingCourseWizardStep =
  | "GENERAL"
  | "FOUNDATION"
  | "STRUCTURE"
  | "ASSESSMENT"
  | "CERTIFICATION"
  | "PREVIEW"
  | "PUBLISH";

export const TRAINING_COURSE_WIZARD_STEPS: Array<{
  id: TrainingCourseWizardStep;
  label: string;
  description: string;
  required: boolean;
}> = [
  { id: "GENERAL", label: "Información", description: "Identidad, propósito y duración", required: true },
  { id: "FOUNDATION", label: "Fundamento", description: "Audiencia, competencias y objetivos", required: true },
  { id: "STRUCTURE", label: "Estructura", description: "Módulos, lecciones y contenido", required: true },
  { id: "ASSESSMENT", label: "Evaluación", description: "Comprobación del aprendizaje", required: false },
  { id: "CERTIFICATION", label: "Certificación", description: "Evidencia y vigencia", required: false },
  { id: "PREVIEW", label: "Vista previa", description: "Experiencia del participante", required: false },
  { id: "PUBLISH", label: "Revisión", description: "Validación y publicación", required: true },
];

export function getTrainingCourseWizardState(
  course: TrainingCourseDto,
  design?: TrainingCourseDesignDto,
  previewed = false,
) {
  const general = Boolean(
    course.title.trim() &&
    course.summary?.trim() &&
    course.description?.trim() &&
    course.estimatedMinutes > 0,
  );
  const structure = Boolean(
    course.modules.length &&
    course.modules.every((module) =>
      module.lessons.length &&
      module.lessons.every((lesson) => (lesson.estimatedMinutes ?? 0) > 0 && lesson.blocks.length),
    ),
  );
  const completed: Record<TrainingCourseWizardStep, boolean> = {
    GENERAL: general,
    FOUNDATION: Boolean(design?.readiness.ready),
    STRUCTURE: structure,
    ASSESSMENT: Boolean(
      course.quizzes?.length &&
      course.quizzes.every((quiz) => getTrainingAssessmentReadiness(quiz).ready),
    ),
    CERTIFICATION: getTrainingCertificationReadiness(course, course.certificationPolicy).ready,
    PREVIEW: previewed,
    PUBLISH: getTrainingQualityReadiness(course.version, course.qualityReviews, course.pilots).ready,
  };
  const requiredReady = completed.GENERAL && completed.FOUNDATION && completed.STRUCTURE;
  const completedCount = TRAINING_COURSE_WIZARD_STEPS.filter((step) => completed[step.id]).length;
  return {
    completed,
    requiredReady,
    completedCount,
    progressPercent: Math.round((completedCount / TRAINING_COURSE_WIZARD_STEPS.length) * 100),
  };
}

export function nextTrainingCourseWizardStep(step: TrainingCourseWizardStep) {
  const index = TRAINING_COURSE_WIZARD_STEPS.findIndex((item) => item.id === step);
  return TRAINING_COURSE_WIZARD_STEPS[Math.min(index + 1, TRAINING_COURSE_WIZARD_STEPS.length - 1)].id;
}

export function previousTrainingCourseWizardStep(step: TrainingCourseWizardStep) {
  const index = TRAINING_COURSE_WIZARD_STEPS.findIndex((item) => item.id === step);
  return TRAINING_COURSE_WIZARD_STEPS[Math.max(index - 1, 0)].id;
}
