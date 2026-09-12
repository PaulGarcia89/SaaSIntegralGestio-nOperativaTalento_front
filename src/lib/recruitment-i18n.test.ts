import { describe, expect, it } from "vitest";
import { translateUiCopy } from "@/i18n/ui-copy";
import { technicalLabel } from "./ui-labels";
import { recruitmentStageLabel } from "./recruitment-stage-label";

describe("recruitment language switching", () => {
  it("switches interview, evaluation and offer states without changing their codes", () => {
    for (const [code, es, en] of [
      ["SCHEDULED", "Programado", "Scheduled"],
      ["STRONG_YES", "Sí rotundo", "Strong yes"],
      ["SIGNED", "Firmado", "Signed"],
    ]) {
      expect(technicalLabel(code, "es")).toBe(es);
      expect(technicalLabel(code, "en")).toBe(en);
      expect(technicalLabel(code, "es")).toBe(es);
    }
  });

  it("translates built-in stages in either direction but preserves company labels", () => {
    expect(recruitmentStageLabel({ code: "SCREENING", name: "Revisión inicial" }, "en")).toBe("Initial review");
    expect(recruitmentStageLabel({ code: "SCREENING", name: "En revisión" }, "en")).toBe("In review");
    expect(recruitmentStageLabel({ code: "SCREENING", name: "In review" }, "es")).toBe("En revisión");
    expect(recruitmentStageLabel({ code: "SCREENING", name: "Revisión de cocina" }, "en")).toBe("Revisión de cocina");
    expect(recruitmentStageLabel({ code: "CUSTOM", name: "Entrevista" }, "en")).toBe("Entrevista");
  });

  it("keeps candidate-provided names intact inside translated messages", () => {
    expect(translateUiCopy("en", "Seleccionar {{name}}", { name: "Esperanza Contratado" })).toBe("Select Esperanza Contratado");
    expect(translateUiCopy("en", "{{count}} postulaciones actualizadas", { count: 3 })).toBe("3 applications updated");
  });
});
