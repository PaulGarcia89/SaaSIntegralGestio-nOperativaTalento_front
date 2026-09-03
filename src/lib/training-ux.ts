import type { TrainingAssignmentDto, TrainingOverviewDto } from "./contracts";

export function selectTrainingNextAssignment(
  overview?: TrainingOverviewDto,
  assignments: TrainingAssignmentDto[] = [],
) {
  return overview?.attentionRequired[0]
    ?? overview?.continueLearning[0]
    ?? overview?.upcomingDue[0]
    ?? overview?.newAssignments[0]
    ?? assignments.find((item) => (item.effectiveStatus ?? item.status) === "OVERDUE")
    ?? assignments.find((item) => (item.effectiveStatus ?? item.status) === "IN_PROGRESS")
    ?? assignments.find((item) => (item.effectiveStatus ?? item.status) === "NOT_STARTED");
}

export function formatTrainingRemainingTime(seconds: number) {
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}
