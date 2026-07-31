import { describe, expect, it } from "vitest";
import type { TrainingQualityReviewDto } from "./contracts";
import { getTrainingQualityReadiness, REQUIRED_TRAINING_REVIEW_TYPES } from "./training-quality";

const reviews = REQUIRED_TRAINING_REVIEW_TYPES.map((reviewType, index) => ({
  id: `review-${index}`,
  courseId: "course-1",
  courseVersion: 3,
  reviewType,
  status: "APPROVED",
  checklist: {},
})) as TrainingQualityReviewDto[];

describe("training quality readiness", () => {
  it("accepts all approvals for the current version", () => {
    expect(getTrainingQualityReadiness(3, reviews).ready).toBe(true);
  });

  it("ignores approvals from an obsolete version", () => {
    expect(getTrainingQualityReadiness(4, reviews).ready).toBe(false);
  });

  it("requires a started pilot to be completed", () => {
    expect(getTrainingQualityReadiness(3, reviews, [{
      id: "pilot-1",
      courseId: "course-1",
      courseVersion: 3,
      name: "Pilot",
      status: "ACTIVE",
      participantIds: [],
      successCriteria: {},
      feedback: [],
    }]).ready).toBe(false);
  });
});
