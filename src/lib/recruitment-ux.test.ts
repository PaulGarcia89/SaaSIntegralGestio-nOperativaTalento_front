import { describe, expect, it } from "vitest";
import { translate } from "@/i18n";
import {
  MAIN_PHASES,
  phaseMeaning,
  phaseQuestion,
  phaseTitle,
  RECRUITMENT_PHASES,
  dueLabel,
  firstNameOf,
  recruitmentAction,
  recruitmentPhaseOf,
  groupByPhase,
  stageMovesFor,
  toTodayItems,
  waitingLabel,
} from "@/lib/recruitment-ux";
import type { ApplicationStatusKey, OperationalDashboardItemDto, VacancyApplicationDto, VacancyStageDto } from "@/lib/contracts";

const item = (overrides: Partial<OperationalDashboardItemDto> = {}): OperationalDashboardItemDto => ({
  id: "item-1", kind: "task", title: "Revisar nueva postulación", description: "Ana Martínez · Cajera",
  tone: "info", module: "Reclutamiento", href: "/ats/candidates/c1", dueAt: null,
  occurredAt: "2026-09-04T10:00:00Z", recordLabel: "Ana Martínez", ...overrides,
});

const AHORA = Date.parse("2026-09-04T12:00:00Z");

describe("las cuatro fases", () => {
  it("agrupa los ocho estados del backend sin dejar ninguno fuera", () => {
    const statuses: ApplicationStatusKey[] = ["SUBMITTED", "REVIEWING", "INTERVIEW", "APPROVED", "REJECTED", "TRAINING", "HIRED", "WITHDRAWN"];
    statuses.forEach((status) => expect(recruitmentPhaseOf(status)).toBeTruthy());
    expect(recruitmentPhaseOf("SUBMITTED")).toBe("POSTULARON");
    expect(recruitmentPhaseOf("REVIEWING")).toBe("POSTULARON");
    expect(recruitmentPhaseOf("INTERVIEW")).toBe("CONOCIENDO");
    expect(recruitmentPhaseOf("APPROVED")).toBe("DECIDIDO");
    expect(recruitmentPhaseOf("HIRED")).toBe("TRABAJANDO");
    expect(recruitmentPhaseOf("TRAINING")).toBe("TRABAJANDO");
  });

  it("saca del camino principal a quienes ya no siguen en el proceso", () => {
    expect(recruitmentPhaseOf("REJECTED")).toBe("DESCARTADOS");
    expect(recruitmentPhaseOf("WITHDRAWN")).toBe("DESCARTADOS");
    expect(MAIN_PHASES).toHaveLength(4);
    expect(MAIN_PHASES.map((phase) => phase.id)).not.toContain("DESCARTADOS");
  });

  it("cada fase se presenta con una pregunta que el usuario reconoce, en los dos idiomas", () => {
    (["es", "en"] as const).forEach((locale) => {
      RECRUITMENT_PHASES.forEach((phase) => {
        expect(phaseTitle(phase.id, locale)).toBeTruthy();
        expect(phaseQuestion(phase.id, locale)).toContain("?");
        expect(phaseMeaning(phase.id, locale)).toBeTruthy();
      });
    });
    expect(phaseTitle("DECIDIDO", "es")).toBe("Decidí contratar");
    expect(phaseTitle("DECIDIDO", "en")).toBe("Decided to hire");
  });

  // Ninguna clave puede faltar: `translate` devuelve la clave misma cuando no
  // la encuentra, así que un hueco en el catálogo se vería en pantalla como
  // "recruit.phase.DECIDIDO.title". Esta prueba lo convierte en un fallo.
  it("no deja ninguna fase sin traducir en inglés", () => {
    RECRUITMENT_PHASES.forEach((phase) => {
      ["title", "question", "meaning"].forEach((part) => {
        const resolved = translate("en", `recruit.phase.${phase.id}.${part}`);
        expect(resolved).not.toBe(`recruit.phase.${phase.id}.${part}`);
      });
    });
  });

  it("la acción principal nombra a la persona y anticipa qué pasará", () => {
    expect(recruitmentAction("POSTULARON", "es").label("Ana")).toBe("Revisar a Ana");
    expect(recruitmentAction("POSTULARON", "en").label("Ana")).toBe("Review Ana");
    expect(recruitmentAction("DECIDIDO", "es").label("Ana")).toContain("oferta");
    expect(recruitmentAction("DECIDIDO", "en").label("Ana")).toContain("offer");
    expect(recruitmentAction("CONOCIENDO", "es").helper).toBeTruthy();
    expect(recruitmentAction("CONOCIENDO", "en").helper).toBeTruthy();
  });
});

describe("tiempo en lenguaje de persona", () => {
  it("nunca dice 'SLA': dice cuánto lleva esperando alguien", () => {
    expect(waitingLabel("2026-09-04T11:30:00Z", AHORA)).toBe("Llegó hace un momento");
    expect(waitingLabel("2026-09-04T09:00:00Z", AHORA)).toBe("Lleva 3 horas esperando");
    expect(waitingLabel("2026-09-03T12:00:00Z", AHORA)).toBe("Lleva 1 día esperando");
    expect(waitingLabel("2026-08-30T12:00:00Z", AHORA)).toBe("Lleva 5 días esperando");
    expect(waitingLabel(null, AHORA)).toBe("Sin fecha");
  });

  it("distingue lo que ya pasó de lo que viene", () => {
    expect(dueLabel("2026-09-04T15:00:00Z", AHORA)).toBe("Es hoy, en 3 horas");
    expect(dueLabel("2026-09-05T12:00:00Z", AHORA)).toBe("Es mañana");
    expect(dueLabel("2026-09-04T11:00:00Z", AHORA)).toBe("Se pasó hace 1 hora");
    expect(dueLabel("2026-09-04T11:50:00Z", AHORA)).toBe("Ya pasó la hora");
    expect(dueLabel("2026-09-01T12:00:00Z", AHORA)).toBe("Se pasó hace 3 días");
    expect(dueLabel(null, AHORA)).toBeNull();
  });

  it("toma el nombre de pila sin romperse con entradas raras", () => {
    expect(firstNameOf("Ana María Martínez")).toBe("Ana");
    expect(firstNameOf("  ")).toBe("esta persona");
  });
});

describe("la bandeja de Hoy", () => {
  it("solo trae lo que pertenece al día a día de reclutamiento", () => {
    const result = toTodayItems([item(), item({ id: "x", module: "Inventario" }), item({ id: "y", module: "Entrevistas" })], AHORA);
    expect(result).toHaveLength(2);
    expect(result.map((entry) => entry.id)).not.toContain("x");
  });

  it("separa a la persona del detalle del puesto", () => {
    const [entry] = toTodayItems([item()], AHORA);
    expect(entry.who).toBe("Ana Martínez");
    expect(entry.detail).toBe("Cajera");
    expect(entry.actionLabel).toBe("Revisar solicitud");
  });

  it("pone primero lo urgente", () => {
    const result = toTodayItems([
      item({ id: "tranquilo" }),
      item({ id: "urgente", tone: "danger" }),
    ], AHORA);
    expect(result[0].id).toBe("urgente");
    expect(result[0].urgent).toBe(true);
  });

  it("marca como urgente una entrevista cuya hora ya pasó", () => {
    const [entry] = toTodayItems([item({ title: "Preparar entrevista", module: "Entrevistas", dueAt: "2026-09-04T09:00:00Z" })], AHORA);
    expect(entry.urgent).toBe(true);
    expect(entry.when).toBe("Se pasó hace 3 horas");
    expect(entry.actionLabel).toBe("Ver entrevista");
  });

  it("no se rompe cuando el backend no envía nada", () => {
    expect(toTodayItems(undefined, AHORA)).toEqual([]);
    expect(toTodayItems([], AHORA)).toEqual([]);
  });
});

describe("mover a una persona de fase", () => {
  const stage = (code: string, position: number, status: ApplicationStatusKey, allowed: string[]): VacancyStageDto => ({
    code, name: code, position, applicationStatus: status, allowedNextStageCodes: allowed,
  });

  const STAGES: VacancyStageDto[] = [
    stage("nuevo", 0, "SUBMITTED", ["revision", "descartado"]),
    stage("revision", 1, "REVIEWING", ["entrevista", "descartado"]),
    stage("entrevista", 2, "INTERVIEW", ["aprobado", "descartado"]),
    stage("aprobado", 3, "APPROVED", []),
    stage("descartado", 9, "REJECTED", []),
  ];

  const application = (code: string): VacancyApplicationDto => ({
    id: "a1", status: "SUBMITTED", appliedAt: "2026-09-01T00:00:00Z", updatedAt: "2026-09-01T00:00:00Z",
    candidate: { id: "c1", fullName: "Ana Martínez", email: "ana@example.com" },
    vacancy: { id: "v1", title: "Cajera", branchId: "b1", stages: STAGES },
    currentStage: STAGES.find((entry) => entry.code === code),
  } as unknown as VacancyApplicationDto);

  it("propone una sola acción principal, y nunca es descartar", () => {
    const { primary, others } = stageMovesFor(application("revision"), STAGES);
    expect(primary?.stage.code).toBe("entrevista");
    expect(primary?.label).toBe("Invitar a entrevista");
    expect(primary?.needsReason).toBe(false);
    expect(others.map((move) => move.stage.code)).toEqual(["descartado"]);
  });

  it("nunca ofrece la etapa actual como destino", () => {
    const { primary, others } = stageMovesFor(application("entrevista"), STAGES);
    const codes = [primary?.stage.code, ...others.map((move) => move.stage.code)];
    expect(codes).not.toContain("entrevista");
  });

  it("marca el descarte como acción que exige motivo", () => {
    const { others } = stageMovesFor(application("entrevista"), STAGES);
    const descarte = others.find((move) => move.stage.code === "descartado");
    expect(descarte?.needsReason).toBe(true);
    expect(descarte?.label).toBe("Descartar");
  });

  it("no inventa transiciones: respeta lo que permite el backend", () => {
    const { primary, others } = stageMovesFor(application("aprobado"), STAGES);
    expect(primary).toBeNull();
    expect(others).toEqual([]);
  });

  it("no ofrece nada cuando el puesto no tiene etapas cargadas", () => {
    expect(stageMovesFor(application("revision"), [])).toEqual({ primary: null, others: [] });
  });

  it("agrupa a las personas por fase visible", () => {
    const grupos = groupByPhase([
      { ...application("nuevo"), id: "a", status: "SUBMITTED" } as VacancyApplicationDto,
      { ...application("entrevista"), id: "b", status: "INTERVIEW" } as VacancyApplicationDto,
      { ...application("descartado"), id: "c", status: "REJECTED" } as VacancyApplicationDto,
    ]);
    expect(grupos.POSTULARON).toHaveLength(1);
    expect(grupos.CONOCIENDO).toHaveLength(1);
    expect(grupos.DESCARTADOS).toHaveLength(1);
    expect(grupos.DECIDIDO).toHaveLength(0);
  });
});
