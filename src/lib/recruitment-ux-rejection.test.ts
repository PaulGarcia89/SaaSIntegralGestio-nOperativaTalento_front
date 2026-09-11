import { describe, expect, it } from "vitest";
import { splitRejection, type StageMove } from "./recruitment-ux";

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
