import { describe, expect, it } from "vitest";
import type { TrainingCertificationPolicyDto, TrainingCourseDto } from "./contracts";
import { getTrainingCertificationReadiness } from "./training-certification";

const course = { id: "course-1", quizzes: [] } as unknown as TrainingCourseDto;
const policy: TrainingCertificationPolicyDto = {
  tenantId: "tenant-1",
  courseId: "course-1",
  isEnabled: true,
  autoIssue: true,
  requireAssessment: false,
  requireAllRequiredLessons: true,
  validityDays: 365,
  renewalWindowDays: 30,
  reminderDays: [30, 7, 1],
  version: 1,
};

describe("training certification readiness", () => {
  it("accepts completion-only certification", () => {
    expect(getTrainingCertificationReadiness(course, policy).ready).toBe(true);
  });

  it("requires a ready assessment when configured", () => {
    expect(getTrainingCertificationReadiness(course, { ...policy, requireAssessment: true }).ready)
      .toBe(false);
  });

  it("rejects a renewal window longer than validity", () => {
    expect(getTrainingCertificationReadiness(course, {
      ...policy,
      validityDays: 30,
      renewalWindowDays: 30,
    }).ready).toBe(false);
  });
});
