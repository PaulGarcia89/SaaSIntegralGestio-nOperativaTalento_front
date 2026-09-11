import { describe, expect, it } from "vitest";
import { entrevistasEnPie, exigeAgendarEntrevista, pendingInterviewResult, splitRejection, type StageMove } from "./recruitment-ux";
import type { VacancyApplicationDto, VacancyStageDto } from "@/lib/contracts";

const etapa = (code: string, needsReason = false): StageMove => ({
  stage: { code, name: code, position: 0, applicationStatus: needsReason ? "REJECTED" : "REVIEWING" } as StageMove["stage"],
  label: code,
  needsReason,
});

describe("separar el descarte del resto de movimientos", () => {
  it("lo saca de «otras opciones», que es donde estaba escondido", () => {
    const entrada = { primary: etapa("INTERVIEW"), others: [etapa("REJECTED", true)] };
    const salida = splitRejection(entrada);
    expect(salida.reject?.stage.code).toBe("REJECTED");
    expect(salida.primary?.stage.code).toBe("INTERVIEW");
    expect(salida.others).toEqual([]);
  });

  it("no inventa un descarte cuando la etapa no lo permite", () => {
    const salida = splitRejection({ primary: etapa("HIRED"), others: [] });
    expect(salida.reject).toBeNull();
    expect(salida.primary?.stage.code).toBe("HIRED");
  });

  it("si el único movimiento es el descarte, no lo deja también como principal", () => {
    // Pasaba en la última etapa antes de un terminal: el botón grande habría
    // sido «Descartar», que no es lo que se espera de la acción principal.
    const salida = splitRejection({ primary: etapa("REJECTED", true), others: [] });
    expect(salida.primary).toBeNull();
    expect(salida.reject?.stage.code).toBe("REJECTED");
  });

  it("conserva los movimientos que no son descarte", () => {
    const salida = splitRejection({ primary: etapa("DECISION"), others: [etapa("SCREENING"), etapa("REJECTED", true)] });
    expect(salida.others.map((move) => move.stage.code)).toEqual(["SCREENING"]);
  });
});

describe("exigeAgendarEntrevista", () => {
  const etapaEntrevista: VacancyStageDto = { code: "INTERVIEW", name: "Entrevistas", position: 2, applicationStatus: "INTERVIEW" };
  const etapaRevision: VacancyStageDto = { code: "SCREENING", name: "Revisión", position: 1, applicationStatus: "REVIEWING" };

  it("exige agenda al pasar a entrevistas sin ninguna entrevista", () => {
    expect(exigeAgendarEntrevista(etapaEntrevista, [])).toBe(true);
    expect(exigeAgendarEntrevista(etapaEntrevista, undefined)).toBe(true);
  });

  it("no exige nada si ya hay una entrevista en pie", () => {
    expect(exigeAgendarEntrevista(etapaEntrevista, [{ status: "SCHEDULED" }])).toBe(false);
    expect(exigeAgendarEntrevista(etapaEntrevista, [{ status: "COMPLETED" }])).toBe(false);
  });

  it("una entrevista cancelada no cuenta como agendada", () => {
    // Se canceló: no queda ninguna cita en pie, así que volver a pasar a la
    // etapa vuelve a exigir acordar día y hora.
    expect(exigeAgendarEntrevista(etapaEntrevista, [{ status: "CANCELED" }])).toBe(true);
    expect(entrevistasEnPie([{ status: "CANCELED" }, { status: "SCHEDULED" }])).toBe(1);
  });

  it("no se mete donde no la llaman: otras etapas no exigen entrevista", () => {
    expect(exigeAgendarEntrevista(etapaRevision, [])).toBe(false);
  });
});

describe("interview outcome before approval", () => {
  const approval = { applicationStatus: "APPROVED" } as VacancyStageDto;
  it("does not treat a no-show as an interview in progress", () => {
    expect(entrevistasEnPie([{ status: "NO_SHOW" }])).toBe(0);
  });
  it("requires completion when the process includes interviews", () => {
    const application = { status: "REVIEWING", interviews: [{ status: "SCHEDULED" }] } as VacancyApplicationDto;
    expect(pendingInterviewResult(application, approval, [{ applicationStatus: "INTERVIEW" } as VacancyStageDto])).toBe(true);
    expect(pendingInterviewResult({ ...application, interviews: [{ status: "COMPLETED" }] } as VacancyApplicationDto, approval, [])).toBe(false);
  });
});
