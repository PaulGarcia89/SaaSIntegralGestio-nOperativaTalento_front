import { describe, expect, it } from "vitest";
import {
  OPERATION_STEPS,
  adverseCount,
  advance,
  canConfirm,
  canNavigateTo,
  confirmBlockedReason,
  confirmLabel,
  consequenceSentence,
  goBack,
  initialOperationState,
  nextStep,
  normalizeBlocker,
  previousStep,
  sortBlockers,
  stepIndex,
  type OperationImpact,
  type OperationState,
} from "@/lib/operation-flow";

function impact(overrides: Partial<OperationImpact> = {}): OperationImpact {
  return {
    headline: "Ajuste de existencias en Bodega Central",
    affectedCount: 3,
    affectedLabel: "ingredientes",
    lines: [{ label: "Harina 000", before: "40 kg", after: "12 kg", adverse: true }],
    warnings: [],
    blockers: [],
    responsible: "Ana Molina",
    irreversible: false,
    ...overrides,
  };
}

function state(overrides: Partial<OperationState> = {}): OperationState {
  return { ...initialOperationState(), ...overrides };
}

describe("orden de los pasos", () => {
  it("son cinco y en el orden del contrato", () => {
    expect(OPERATION_STEPS).toEqual(["select", "record", "review", "confirm", "result"]);
  });

  it("stepIndex respeta el orden", () => {
    expect(stepIndex("select")).toBe(0);
    expect(stepIndex("result")).toBe(4);
  });
});

describe("nextStep", () => {
  it("avanza de seleccionar a registrar sin condiciones", () => {
    expect(nextStep(state({ step: "select" }))).toBe("record");
  });

  it("NO deja llegar a la revisión sin impacto calculado", () => {
    // Es el punto del patrón que existe para que nadie confirme a ciegas.
    expect(nextStep(state({ step: "record" }))).toBeNull();
  });

  it("deja llegar a la revisión en cuanto hay impacto", () => {
    expect(nextStep(state({ step: "record", impact: impact() }))).toBe("review");
  });

  it("NO deja llegar a confirmar si hay bloqueos", () => {
    const blocked = impact({
      blockers: [{ code: "NO_STOCK", cause: "Sin existencias", owner: "Bodega", resolution: "Recibir mercancía" }],
    });
    expect(nextStep(state({ step: "review", impact: blocked }))).toBeNull();
  });

  it("deja llegar a confirmar sin bloqueos", () => {
    expect(nextStep(state({ step: "review", impact: impact() }))).toBe("confirm");
  });

  it("NO deja llegar al resultado sin desenlace del servidor", () => {
    expect(nextStep(state({ step: "confirm", impact: impact() }))).toBeNull();
  });

  it("deja llegar al resultado con desenlace", () => {
    const done = state({
      step: "confirm",
      impact: impact(),
      outcome: { status: "success", headline: "Ajuste registrado" },
    });
    expect(nextStep(done)).toBe("result");
  });

  it("no hay nada después del resultado", () => {
    expect(nextStep(state({ step: "result" }))).toBeNull();
  });
});

describe("previousStep", () => {
  it("no retrocede desde el primer paso", () => {
    expect(previousStep(state({ step: "select" }))).toBeNull();
  });

  it("no retrocede desde el resultado: la operación ya se registró", () => {
    // Ofrecer "Atrás" aquí invitaría a repetir una operación ya aplicada.
    expect(previousStep(state({ step: "result" }))).toBeNull();
  });

  it("retrocede en los pasos intermedios", () => {
    expect(previousStep(state({ step: "confirm" }))).toBe("review");
  });
});

describe("canConfirm", () => {
  it("no se puede confirmar mientras se envía", () => {
    expect(canConfirm(state({ step: "confirm", impact: impact(), submitting: true }))).toBe(false);
  });

  it("no se puede confirmar sin impacto", () => {
    expect(canConfirm(state({ step: "confirm" }))).toBe(false);
  });

  it("no se puede confirmar con bloqueos", () => {
    const blocked = impact({
      blockers: [{ code: "X", cause: "c", owner: "o", resolution: "r" }],
    });
    expect(canConfirm(state({ step: "confirm", impact: blocked }))).toBe(false);
  });

  it("los avisos NO bloquean: solo informan", () => {
    const warned = impact({ warnings: [{ code: "LOW", message: "Quedará bajo el mínimo" }] });
    expect(canConfirm(state({ step: "confirm", impact: warned }))).toBe(true);
  });

  it("no se puede confirmar desde un paso anterior a la revisión", () => {
    expect(canConfirm(state({ step: "record", impact: impact() }))).toBe(false);
  });
});

describe("confirmBlockedReason", () => {
  it("devuelve null cuando sí se puede confirmar", () => {
    expect(confirmBlockedReason(state({ step: "confirm", impact: impact() }))).toBeNull();
  });

  it("prioriza el envío en curso sobre cualquier otra causa", () => {
    expect(confirmBlockedReason(state({ submitting: true }))).toContain("está registrando");
  });

  it("concuerda el número en singular y en plural", () => {
    const one = impact({ blockers: [{ code: "A", cause: "c", owner: "o", resolution: "r" }] });
    const two = impact({
      blockers: [
        { code: "A", cause: "c", owner: "o", resolution: "r" },
        { code: "B", cause: "c", owner: "o", resolution: "r" },
      ],
    });
    expect(confirmBlockedReason(state({ step: "confirm", impact: one }))).toContain("un bloqueo");
    expect(confirmBlockedReason(state({ step: "confirm", impact: two }))).toContain("2 bloqueos");
  });
});

describe("advance y goBack", () => {
  it("advance marca el paso actual como completado", () => {
    const next = advance(state({ step: "select" }));
    expect(next.step).toBe("record");
    expect(next.completed).toEqual(["select"]);
  });

  it("advance es idempotente en la lista de completados", () => {
    const once = advance(state({ step: "select" }));
    const back = goBack(once);
    const twice = advance(back);
    expect(twice.completed).toEqual(["select"]);
  });

  it("advance no hace nada si el paso no es alcanzable", () => {
    const stuck = state({ step: "record" });
    expect(advance(stuck)).toBe(stuck);
  });
});

describe("canNavigateTo", () => {
  it("siempre se puede quedar donde está", () => {
    expect(canNavigateTo(state({ step: "review" }), "review")).toBe(true);
  });

  it("se puede volver a un paso ya completado", () => {
    const current = state({ step: "review", completed: ["select", "record"] });
    expect(canNavigateTo(current, "record")).toBe(true);
  });

  it("NO se puede saltar hacia adelante aunque figure como completado", () => {
    // Evita que un estado inconsistente permita saltarse la revisión.
    const current = state({ step: "record", completed: ["select", "record", "review"] });
    expect(canNavigateTo(current, "review")).toBe(false);
  });

  it("desde el resultado no se navega a ningún otro paso", () => {
    const done = state({ step: "result", completed: [...OPERATION_STEPS] });
    expect(canNavigateTo(done, "select")).toBe(false);
  });
});

describe("textos derivados del impacto", () => {
  it("confirmLabel nombra la operación y avisa si es irreversible", () => {
    expect(confirmLabel("Registrar merma", false)).toBe("Registrar merma");
    expect(confirmLabel("Registrar merma", true)).toBe("Registrar merma definitivamente");
  });

  it("consequenceSentence dice el alcance y la reversibilidad", () => {
    const sentence = consequenceSentence(impact());
    expect(sentence).toContain("3 ingredientes");
    expect(sentence).toContain("Se puede revertir");
  });

  it("consequenceSentence incluye el importe cuando lo hay", () => {
    const sentence = consequenceSentence(
      impact({ cost: { label: "Costo", amount: "USD 1.240,00" }, irreversible: true }),
    );
    expect(sentence).toContain("USD 1.240,00");
    expect(sentence).toContain("no se puede deshacer");
  });
});

describe("adverseCount", () => {
  it("cuenta las líneas adversas y el costo adverso", () => {
    const value = adverseCount(
      impact({
        lines: [
          { label: "a", before: "1", after: "0", adverse: true },
          { label: "b", before: "1", after: "2" },
        ],
        cost: { label: "Costo", amount: "100", adverse: true },
      }),
    );
    expect(value).toBe(2);
  });

  it("es cero cuando nada empeora", () => {
    expect(adverseCount(impact({ lines: [{ label: "a", before: "1", after: "2" }] }))).toBe(0);
  });
});

describe("sortBlockers", () => {
  it("pone delante los que el usuario puede arreglar en esta pantalla", () => {
    const sorted = sortBlockers([
      { code: "REMOTE", cause: "c", owner: "Contabilidad", resolution: "r" },
      { code: "LOCAL", cause: "c", owner: "Tú", resolution: "r", fieldId: "quantity" },
    ]);
    expect(sorted.map((blocker) => blocker.code)).toEqual(["LOCAL", "REMOTE"]);
  });

  it("no muta el arreglo original", () => {
    const original = [
      { code: "A", cause: "c", owner: "o", resolution: "r" },
      { code: "B", cause: "c", owner: "o", resolution: "r", fieldId: "f" },
    ];
    sortBlockers(original);
    expect(original[0].code).toBe("A");
  });
});

describe("normalizeBlocker", () => {
  it("conserva lo que viene del backend", () => {
    const blocker = normalizeBlocker({ code: "NO_DOCS", message: "Faltan documentos", field: "docs" });
    expect(blocker.code).toBe("NO_DOCS");
    expect(blocker.cause).toBe("Faltan documentos");
    expect(blocker.fieldId).toBe("docs");
  });

  it("declara la carencia en vez de inventarse un responsable", () => {
    // Un responsable inventado manda al usuario a la persona equivocada;
    // "no se indicó" es una carencia visible que alguien acabará corrigiendo.
    const blocker = normalizeBlocker({ code: "X", message: "algo" });
    expect(blocker.owner).toContain("No se indicó");
    expect(blocker.resolution).toContain("administrador");
  });

  it("trata el texto en blanco como ausente", () => {
    const blocker = normalizeBlocker({ code: "X", message: "   ", owner: "  " });
    expect(blocker.cause).toContain("no explicó");
    expect(blocker.owner).toContain("No se indicó");
  });

  it("sobrevive a una respuesta vacía", () => {
    const blocker = normalizeBlocker({});
    expect(blocker.code).toBe("UNKNOWN");
    expect(blocker.cause.length).toBeGreaterThan(0);
  });
});
