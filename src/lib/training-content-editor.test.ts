import { describe, expect, it } from "vitest";
import { moveTrainingEntity, trainingBlockSummary } from "./training-content-editor";

describe("training content editor", () => {
  it("moves an entity without mutating the original order", () => {
    const original = ["a", "b", "c"];
    expect(moveTrainingEntity(original, "b", -1)).toEqual(["b", "a", "c"]);
    expect(original).toEqual(["a", "b", "c"]);
  });

  it("keeps boundary items in place", () => {
    expect(moveTrainingEntity(["a", "b"], "a", -1)).toEqual(["a", "b"]);
    expect(moveTrainingEntity(["a", "b"], "b", 1)).toEqual(["a", "b"]);
  });

  it("summarizes practical and accessible blocks", () => {
    expect(trainingBlockSummary("TASK", { evidenceType: "Archivo entregable" })).toBe(
      "Archivo entregable",
    );
    expect(trainingBlockSummary("VIDEO", { transcriptUrl: "https://example.com" })).toBe(
      "Con transcripción",
    );
  });
});
