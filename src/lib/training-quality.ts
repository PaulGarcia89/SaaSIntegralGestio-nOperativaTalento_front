import type {
  TrainingCoursePilotDto,
  TrainingQualityReviewDto,
  TrainingQualityReviewType,
} from "./contracts";

export const REQUIRED_TRAINING_REVIEW_TYPES: TrainingQualityReviewType[] = [
  "CONTENT",
  "PEDAGOGY",
  "ACCESSIBILITY",
  "COMPLIANCE",
];

export function getTrainingQualityReadiness(
  version: number,
  reviews: TrainingQualityReviewDto[] = [],
  pilots: TrainingCoursePilotDto[] = [],
) {
  const currentReviews = reviews.filter((review) => review.courseVersion === version);
  const currentPilots = pilots.filter((pilot) => pilot.courseVersion === version);
  const errors = [
    ...REQUIRED_TRAINING_REVIEW_TYPES
      .filter((type) => !currentReviews.some((review) => review.reviewType === type && review.status === "APPROVED"))
      .map((type) => `Falta aprobación de ${type.toLowerCase()}`),
    currentPilots.some((pilot) => pilot.status !== "CANCELLED") &&
    !currentPilots.some((pilot) => pilot.status === "COMPLETED")
      ? "El piloto de la versión actual no está completado"
      : null,
  ].filter((error): error is string => Boolean(error));

  return { ready: errors.length === 0, errors };
}
