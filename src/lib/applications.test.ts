import { describe, expect, it } from "vitest";
import {
  APPLICATION_STAGES,
  APPLICATION_STAGE_CHANGE_OPTIONS,
  applicationNextAction,
  applicationStageLabel,
} from "./applications";

describe("application stages", () => {
  it("shows every persisted stage in read-only views", () => {
    expect(APPLICATION_STAGES.map((stage) => stage.key)).toContain("HIRED");
    expect(applicationStageLabel("HIRED")).toBe("Contratada");
  });

  it("does not offer HIRED as a manual stage change", () => {
    expect(APPLICATION_STAGE_CHANGE_OPTIONS.map((stage) => stage.key)).not.toContain("HIRED");
  });

  it("provides an operational next action for every stage", () => {
    for (const stage of APPLICATION_STAGES) {
      expect(applicationNextAction(stage.key)).toBeTruthy();
    }
  });
});
