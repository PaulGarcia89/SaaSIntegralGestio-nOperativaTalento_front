import { describe, expect, it } from "vitest";
import type { EmployeeOnboardingFlowDto, EmployeeOnboardingTaskDto } from "@/lib/contracts";
import {
  blockerOwner,
  blockerResolution,
  onboardingBlockers,
  onboardingHeadline,
  onboardingProgress,
} from "@/lib/onboarding-operation";

function task(overrides: Partial<EmployeeOnboardingTaskDto> = {}): EmployeeOnboardingTaskDto {
  return {
    id: "t1",
    taskKey: "docs",
    taskType: "DOCUMENT",
    title: "Entregar documentos",
    status: "IN_PROGRESS",
    progressPercent: 0,
    ownerType: "ONBOARDING",
    waitingFor: [],
    waitingForLabels: [],
    blocked: false,
    overdue: false,
    documents: [],
    ...overrides,
  } as EmployeeOnboardingTaskDto;
}

function flow(overrides: Partial<EmployeeOnboardingFlowDto> = {}): EmployeeOnboardingFlowDto {
  return {
    id: "f1",
    status: "IN_PROGRESS",
    startedAt: "2025-04-01T10:00:00.000Z",
    progressPercent: 40,
    employee: { id: "e1", name: "Lucía Ferreira", email: "lucia@empresa.com" },
    branch: { id: "b1", name: "Centro" },
    tasks: [],
    documents: [],
    alerts: [],
    timeline: [],
    ...overrides,
  } as EmployeeOnboardingFlowDto;
}

describe("blockerOwner", () => {
  it("prefiere la persona concreta cuando el backend la manda", () => {
    const owner = blockerOwner(task({ owner: { id: "u1", name: "Ana Molina", email: "ana@empresa.com" } }));
    expect(owner).toBe("Ana Molina");
  });

  it("recurre al equipo del tipo cuando no hay persona", () => {
    expect(blockerOwner(task({ ownerType: "SIGNATURE" }))).toContain("firmas");
    expect(blockerOwner(task({ ownerType: "INVENTORY" }))).toContain("inventario");
  });

  it("declara la carencia en vez de inventarse un responsable", () => {
    // Un nombre inventado manda al usuario a la persona equivocada.
    expect(blockerOwner(task({ ownerType: "USER" }))).toContain("Sin responsable");
    expect(blockerOwner(undefined)).toContain("Sin responsable");
  });

  it("una automatización también es un responsable, y se dice", () => {
    expect(blockerOwner(task({ ownerType: "SYSTEM" }))).toContain("Automatización");
  });
});

describe("blockerResolution", () => {
  it("las dependencias van PRIMERO: subir un documento no desbloquea una espera", () => {
    const resolution = blockerResolution(
      task({ waitingForLabels: ["Firmar contrato"], documents: [{ id: "d1", status: "PENDING" }] }),
    );
    expect(resolution).toContain("Firmar contrato");
    expect(resolution).not.toContain("documento");
  });

  it("enumera varias dependencias", () => {
    const resolution = blockerResolution(task({ waitingForLabels: ["Firmar contrato", "Alta en nómina"] }));
    expect(resolution).toContain("Firmar contrato, Alta en nómina");
  });

  it("cuenta los documentos que faltan y no los ya aprobados o firmados", () => {
    const resolution = blockerResolution(
      task({
        documents: [
          { id: "d1", status: "APPROVED" },
          { id: "d2", status: "SIGNED" },
          { id: "d3", status: "PENDING" },
          { id: "d4", status: "REJECTED" },
        ],
      }),
    );
    expect(resolution).toContain("2 documentos");
  });

  it("concuerda el singular de un solo documento", () => {
    const resolution = blockerResolution(task({ documents: [{ id: "d1", status: "PENDING" }] }));
    expect(resolution).toContain("el documento pendiente");
  });

  it("una tarea vencida sin nada más pendiente dice que venció", () => {
    expect(blockerResolution(task({ overdue: true }))).toContain("venció");
  });

  it("sin nada de lo anterior, la salida es completar la tarea", () => {
    expect(blockerResolution(task({ title: "Entregar uniforme" }))).toContain("Entregar uniforme");
  });

  it("sin tarea no deja al usuario sin salida", () => {
    expect(blockerResolution(undefined).length).toBeGreaterThan(0);
  });

  it("ignora las etiquetas de dependencia en blanco", () => {
    const resolution = blockerResolution(task({ waitingForLabels: ["  ", ""], title: "Firmar" }));
    expect(resolution).toContain("Firmar");
  });
});

describe("onboardingBlockers", () => {
  it("separa lo que bloquea de lo que solo avisa", () => {
    // Pintarlos igual enseña a la gente a ignorar los dos.
    const resultado = onboardingBlockers(
      flow({
        tasks: [task({ id: "t1" }), task({ id: "t2", title: "Uniforme" })],
        alerts: [
          { taskId: "t1", severity: "danger", message: "Falta el contrato firmado" },
          { taskId: "t2", severity: "warning", message: "El uniforme llega tarde" },
        ],
      }),
    );
    expect(resultado.blocking).toHaveLength(1);
    expect(resultado.warnings).toHaveLength(1);
    expect(resultado.blocking[0].cause).toBe("Falta el contrato firmado");
  });

  it("cada bloqueo trae las tres respuestas", () => {
    const resultado = onboardingBlockers(
      flow({
        tasks: [task({ id: "t1", owner: { id: "u1", name: "Ana Molina", email: "a@b.c" } })],
        alerts: [{ taskId: "t1", severity: "danger", message: "Falta algo" }],
      }),
    );
    const blocker = resultado.blocking[0];
    expect(blocker.cause.length).toBeGreaterThan(0);
    expect(blocker.owner).toBe("Ana Molina");
    expect(blocker.resolution.length).toBeGreaterThan(0);
  });

  it("una alerta cuya tarea ya no existe no rompe la pantalla", () => {
    const resultado = onboardingBlockers(
      flow({ tasks: [], alerts: [{ taskId: "fantasma", severity: "danger", message: "Algo pasó" }] }),
    );
    expect(resultado.blocking).toHaveLength(1);
    expect(resultado.blocking[0].owner).toContain("Sin responsable");
  });

  it("un mensaje vacío recurre al título de la tarea", () => {
    const resultado = onboardingBlockers(
      flow({
        tasks: [task({ id: "t1", title: "Entregar documentos" })],
        alerts: [{ taskId: "t1", severity: "danger", message: "   " }],
      }),
    );
    expect(resultado.blocking[0].cause).toBe("Entregar documentos");
  });

  it("sin alertas no hay nada que mostrar", () => {
    const resultado = onboardingBlockers(flow());
    expect(resultado.blocking).toHaveLength(0);
    expect(resultado.warnings).toHaveLength(0);
  });
});

describe("onboardingHeadline", () => {
  it("un expediente cerrado lo dice y no habla de bloqueos", () => {
    expect(onboardingHeadline(flow({ status: "COMPLETED" }))).toEqual({
      label: "Expediente cerrado",
      tone: "success",
    });
  });

  it("un aviso NO se anuncia como bloqueo", () => {
    // El defecto original: cualquier alerta pintaba «Bloqueado por
    // documentación», aunque fuera solo un aviso y no tuviera que ver con
    // documentación.
    const resultado = onboardingHeadline(
      flow({
        tasks: [task({ id: "t1" })],
        alerts: [{ taskId: "t1", severity: "warning", message: "Llega tarde" }],
      }),
    );
    expect(resultado.tone).toBe("warning");
    expect(resultado.label).toBe("1 aviso");
  });

  it("cuenta los bloqueos y concuerda el plural", () => {
    const resultado = onboardingHeadline(
      flow({
        tasks: [task({ id: "t1" }), task({ id: "t2" })],
        alerts: [
          { taskId: "t1", severity: "danger", message: "a" },
          { taskId: "t2", severity: "danger", message: "b" },
        ],
      }),
    );
    expect(resultado.label).toBe("2 bloqueos por resolver");
    expect(resultado.tone).toBe("danger");
  });

  it("el bloqueo pesa más que el aviso", () => {
    const resultado = onboardingHeadline(
      flow({
        tasks: [task({ id: "t1" }), task({ id: "t2" })],
        alerts: [
          { taskId: "t1", severity: "warning", message: "a" },
          { taskId: "t2", severity: "danger", message: "b" },
        ],
      }),
    );
    expect(resultado.tone).toBe("danger");
  });

  it("sin alertas, en marcha", () => {
    expect(onboardingHeadline(flow()).tone).toBe("progress");
  });
});

describe("onboardingProgress", () => {
  it("cuenta completadas, pendientes y vencidas", () => {
    const resultado = onboardingProgress(
      flow({
        tasks: [
          task({ id: "1", status: "COMPLETED" }),
          task({ id: "2", status: "IN_PROGRESS", overdue: true }),
          task({ id: "3", status: "PENDING" }),
        ],
      }),
    );
    expect(resultado).toEqual({ total: 3, completed: 1, pending: 2, overdue: 1 });
  });

  it("una tarea completada no cuenta como vencida aunque lo estuviera", () => {
    const resultado = onboardingProgress(
      flow({ tasks: [task({ id: "1", status: "COMPLETED", overdue: true })] }),
    );
    expect(resultado.overdue).toBe(0);
  });

  it("sin tareas no divide por cero ni miente", () => {
    expect(onboardingProgress(flow())).toEqual({ total: 0, completed: 0, pending: 0, overdue: 0 });
  });
});
