import { describe, expect, it } from "vitest";
import {
  APPLICATION_STAGES,
  APPLICATION_STAGE_CHANGE_OPTIONS,
  applicationNextAction,
  applicationStageLabel,
  currentApplicationStage,
} from "./applications";
import type { VacancyApplicationDto, VacancyStageDto } from "./contracts";

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

  it("uses the vacancy-specific current stage before the global status fallback", () => {
    const stages: VacancyStageDto[] = [
      { id: "screen", code: "SCREEN", name: "Filtro cultural", position: 0, applicationStatus: "REVIEWING" },
      { id: "technical", code: "TECH", name: "Prueba técnica", position: 1, applicationStatus: "REVIEWING" },
    ];
    const application = {
      currentStageId: "technical",
      currentStage: null,
      status: "REVIEWING",
      vacancy: { stages },
    } as Pick<VacancyApplicationDto, "currentStageId" | "currentStage" | "status" | "vacancy">;

    expect(currentApplicationStage(application)?.name).toBe("Prueba técnica");
  });

  it("falls back to the mapped stage for legacy applications", () => {
    const stages: VacancyStageDto[] = [
      { id: "applied", code: "APPLIED", name: "Recibida", position: 0, applicationStatus: "SUBMITTED" },
    ];
    const application = {
      currentStageId: null,
      currentStage: null,
      status: "SUBMITTED",
      vacancy: { stages },
    } as Pick<VacancyApplicationDto, "currentStageId" | "currentStage" | "status" | "vacancy">;

    expect(currentApplicationStage(application)?.id).toBe("applied");
  });
});
