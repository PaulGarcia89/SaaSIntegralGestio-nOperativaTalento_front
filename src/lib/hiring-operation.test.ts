import { describe, expect, it } from "vitest";
import type { HiringContractBlockerDto } from "@/lib/contracts";
import {
  hiringBlockerToOperationBlocker,
  hiringConfirmationImpact,
  type HiringConfirmationInput,
} from "@/lib/hiring-operation";
import { canConfirm, consequenceSentence, initialOperationState } from "@/lib/operation-flow";

function input(overrides: Partial<HiringConfirmationInput> = {}): HiringConfirmationInput {
  return {
    candidateName: "Lucía Ferreira",
    roleTitle: "Cajera",
    branchName: "Centro",
    salaryText: "USD 950,00 mensuales",
    startDateText: "1 de mayo de 2025",
    documentsTotal: 5,
    documentsApproved: 5,
    pendingDocuments: 0,
    hasOnboardingFlow: true,
    responsible: "Paúl García",
    blockers: [],
    ...overrides,
  };
}

const blocker = (code: string, message = "Faltan documentos"): HiringContractBlockerDto =>
  ({ code, message } as HiringContractBlockerDto);

describe("hiringConfirmationImpact", () => {
  it("la operación es SIEMPRE irreversible", () => {
    // Confirmar crea el expediente del empleado, vincula sus documentos y
    // prepara su acceso; el producto no ofrece deshacer nada de eso.
    expect(hiringConfirmationImpact(input()).irreversible).toBe(true);
    expect(hiringConfirmationImpact(input({ blockers: [blocker("X")] })).irreversible).toBe(true);
  });

  it("enumera el estado actual y el resultado esperado de cada cambio", () => {
    const impact = hiringConfirmationImpact(input());
    for (const line of impact.lines) {
      expect(line.before.length).toBeGreaterThan(0);
      expect(line.after.length).toBeGreaterThan(0);
      expect(line.before).not.toBe(line.after);
    }
  });

  it("el plan de bienvenida solo aparece si la empresa lo tiene", () => {
    const con = hiringConfirmationImpact(input({ hasOnboardingFlow: true }));
    const sin = hiringConfirmationImpact(input({ hasOnboardingFlow: false }));
    expect(con.lines.length).toBe(sin.lines.length + 1);
  });

  it("sin fecha de inicio no se inventa una línea", () => {
    const impact = hiringConfirmationImpact(input({ startDateText: null }));
    expect(impact.lines.some((line) => line.after === "1 de mayo de 2025")).toBe(false);
  });

  it("el salario acordado se muestra como impacto económico", () => {
    const impact = hiringConfirmationImpact(input());
    expect(impact.cost?.amount).toBe("USD 950,00 mensuales");
  });

  it("sin salario no hay coste, pero sí un aviso", () => {
    const impact = hiringConfirmationImpact(input({ salaryText: null }));
    expect(impact.cost).toBeUndefined();
    expect(impact.warnings.some((warning) => warning.code === "NO_SALARY")).toBe(true);
  });

  it("un documento pendiente que no bloquea genera aviso, no bloqueo", () => {
    // El expediente del empleado nacería incompleto: merece decirse, pero no
    // impedir la operación si el backend la acepta.
    const impact = hiringConfirmationImpact(input({ pendingDocuments: 2 }));
    expect(impact.blockers).toHaveLength(0);
    expect(impact.warnings.some((warning) => warning.code === "DOCS_PENDING_NON_BLOCKING")).toBe(true);
  });

  it("si ya hay un bloqueo, no se duplica el mismo asunto como aviso", () => {
    const impact = hiringConfirmationImpact(input({
      pendingDocuments: 2,
      blockers: [blocker("REQUIRED_DOCUMENTS_MISSING")],
    }));
    expect(impact.warnings.some((warning) => warning.code === "DOCS_PENDING_NON_BLOCKING")).toBe(false);
  });

  it("afecta a una persona y lo dice, aunque sea una", () => {
    const impact = hiringConfirmationImpact(input());
    expect(impact.affectedCount).toBe(1);
    expect(impact.affectedLabel.length).toBeGreaterThan(0);
  });

  it("el responsable llega hasta la auditoría del impacto", () => {
    expect(hiringConfirmationImpact(input()).responsible).toBe("Paúl García");
  });
});

describe("integración con el patrón de operaciones", () => {
  it("sin bloqueos se puede confirmar", () => {
    const state = { ...initialOperationState(), step: "confirm" as const, impact: hiringConfirmationImpact(input()) };
    expect(canConfirm(state)).toBe(true);
  });

  it("con un bloqueo NO se puede confirmar", () => {
    const state = {
      ...initialOperationState(),
      step: "confirm" as const,
      impact: hiringConfirmationImpact(input({ blockers: [blocker("REQUIRED_DOCUMENTS_MISSING")] })),
    };
    expect(canConfirm(state)).toBe(false);
  });

  it("la frase de consecuencia avisa de que no se puede deshacer", () => {
    const sentence = consequenceSentence(hiringConfirmationImpact(input()));
    expect(sentence).toContain("no se puede deshacer");
    expect(sentence).toContain("USD 950,00");
  });
});

describe("hiringBlockerToOperationBlocker", () => {
  it("rellena causa, responsable y solución: las tres, siempre", () => {
    const mapped = hiringBlockerToOperationBlocker(blocker("REQUIRED_DOCUMENTS_MISSING"), "Lucía");
    expect(mapped.cause.length).toBeGreaterThan(0);
    expect(mapped.owner.length).toBeGreaterThan(0);
    expect(mapped.resolution.length).toBeGreaterThan(0);
    // La solución no puede quedarse en la clave de traducción sin traducir.
    expect(mapped.resolution).not.toContain("hiring.blocker");
  });

  it("un código desconocido no deja al usuario sin salida", () => {
    const mapped = hiringBlockerToOperationBlocker(blocker("ALGO_NUEVO", "Motivo del servidor"), "Lucía");
    expect(mapped.code).toBe("ALGO_NUEVO");
    expect(mapped.cause).toBe("Motivo del servidor");
    expect(mapped.resolution).not.toContain("hiring.blocker");
  });

  it("cada código conocido tiene su propia salida, no una genérica", () => {
    const codes = ["REQUIRED_DOCUMENTS_MISSING", "SIGNATURES_PENDING", "WAITING_CANDIDATE", "OFFER_NOT_CONFIGURED"];
    const resoluciones = codes.map((code) => hiringBlockerToOperationBlocker(blocker(code), "Lucía").resolution);
    expect(new Set(resoluciones).size).toBe(codes.length);
  });

  it("traduce al inglés cuando la sesión está en inglés", () => {
    const es = hiringBlockerToOperationBlocker(blocker("REQUIRED_DOCUMENTS_MISSING"), "Lucía", "es");
    const en = hiringBlockerToOperationBlocker(blocker("REQUIRED_DOCUMENTS_MISSING"), "Lucía", "en");
    expect(en.resolution).not.toBe(es.resolution);
  });
});
