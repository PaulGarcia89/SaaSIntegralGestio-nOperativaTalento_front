import { describe, expect, it } from "vitest";
import { formatTrainingRemainingTime, selectTrainingNextAssignment } from "./training-ux";

const assignment = (id: string, status: "OVERDUE" | "IN_PROGRESS" | "NOT_STARTED") => ({
  id,
  status,
  title: id,
  type: "COURSE" as const,
  progressPercent: 0,
  estimatedMinutes: 10,
});

describe("training UX helpers", () => {
  it("prioritizes backend attention order for the next action", () => {
    const next = selectTrainingNextAssignment({
      attentionRequired: [assignment("overdue", "OVERDUE")],
      continueLearning: [assignment("progress", "IN_PROGRESS")],
      upcomingDue: [],
      newAssignments: [],
      recentlyCompleted: [],
      optionalAssignments: [],
      pendingAssessments: [],
      overdueAssignments: [],
      inProgressAssignments: [],
      completedAssignments: [],
      upcomingEvents: [],
    }, [assignment("fallback", "NOT_STARTED")]);

    expect(next?.id).toBe("overdue");
  });

  it("formats remaining time for the learner timer", () => {
    expect(formatTrainingRemainingTime(125)).toBe("02:05");
  });
});
