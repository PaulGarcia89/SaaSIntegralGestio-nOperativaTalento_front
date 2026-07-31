import type { TrainingContentBlockType } from "./contracts";

export function moveTrainingEntity(ids: string[], id: string, direction: -1 | 1) {
  const index = ids.indexOf(id);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= ids.length) return ids;

  const reordered = [...ids];
  [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];
  return reordered;
}

export function trainingBlockSummary(
  type: TrainingContentBlockType,
  content?: Record<string, unknown> | null,
) {
  if (type === "TASK") return String(content?.evidenceType || "Actividad práctica");
  if (type === "QUIZ") return content?.quizId ? "Evaluación vinculada" : "Evaluación por configurar";
  if (type === "VIDEO" && content?.transcriptUrl) return "Con transcripción";
  if (type === "FILE" && content?.accessibilityNote) return String(content.accessibilityNote);
  return null;
}
