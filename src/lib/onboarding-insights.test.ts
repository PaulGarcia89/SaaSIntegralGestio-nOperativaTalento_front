import { describe, expect, it } from "vitest";
import type { EmployeeOnboardingFlowDto, EmployeeOnboardingTaskDto } from "@/lib/contracts";
import {
  bucketByProgress,
  countTasks,
  countTasksIn,
  progressBand,
  sortByUrgency,
  taskBucket,
} from "@/lib/onboarding-insights";

/** Referencia fija: martes 15 de abril de 2025, 12:00 hora local. */
const NOW = new Date(2025, 3, 15, 12, 0, 0);
const at = (dia: number) => new Date(2025, 3, dia, 12, 0, 0).toISOString();

function tarea(overrides: Partial<EmployeeOnboardingTaskDto> = {}): EmployeeOnboardingTaskDto {
  return {
    id: Math.random().toString(36).slice(2),
    taskKey: "k",
    taskType: "MANUAL",
    title: "Tarea",
    status: "PENDING",
    progressPercent: 0,
    ownerType: "USER",
    waitingFor: [],
    waitingForLabels: [],
    blocked: false,
    overdue: false,
    documents: [],
    ...overrides,
  } as EmployeeOnboardingTaskDto;
}

function flujo(overrides: Partial<EmployeeOnboardingFlowDto> = {}): EmployeeOnboardingFlowDto {
  return {
    id: Math.random().toString(36).slice(2),
    status: "IN_PROGRESS",
    startedAt: at(1),
    progressPercent: 50,
    employee: { id: "e", name: "Ana", email: "a@b.c" },
    branch: { id: "b", name: "Kendall" },
    tasks: [],
    documents: [],
    alerts: [],
    timeline: [],
    ...overrides,
  } as EmployeeOnboardingFlowDto;
}

describe("progressBand", () => {
  it("corta en 25, 50 y 75", () => {
    expect(progressBand(0)).toBe("starting");
    expect(progressBand(24.6)).toBe("starting");
    expect(progressBand(25)).toBe("early");
    expect(progressBand(49.9)).toBe("early");
    expect(progressBand(50)).toBe("half");
    expect(progressBand(75)).toBe("closing");
    expect(progressBand(100)).toBe("closing");
  });

  it("un porcentaje imposible no revienta ni inventa un tramo", () => {
    expect(progressBand(Number.NaN)).toBe("starting");
    expect(progressBand(-30)).toBe("starting");
    expect(progressBand(1000)).toBe("closing");
  });
});

describe("bucketByProgress", () => {
  it("devuelve siempre los cuatro tramos, aunque valgan cero", () => {
    const resultado = bucketByProgress([flujo({ progressPercent: 10 })]);
    expect(resultado.map((e) => e.band)).toEqual(["starting", "early", "half", "closing"]);
    expect(resultado.map((e) => e.count)).toEqual([1, 0, 0, 0]);
  });

  it("reparte sin perder expedientes", () => {
    const flujos = [10, 30, 60, 80, 95].map((p) => flujo({ progressPercent: p }));
    const resultado = bucketByProgress(flujos);
    expect(resultado.reduce((s, e) => s + e.count, 0)).toBe(5);
    expect(resultado.map((e) => e.count)).toEqual([1, 1, 1, 2]);
  });
});

describe("taskBucket", () => {
  it("lo cerrado y lo cancelado no son carga de trabajo", () => {
    expect(taskBucket(tarea({ status: "COMPLETED" }), NOW)).toBeNull();
    expect(taskBucket(tarea({ status: "CANCELLED" }), NOW)).toBeNull();
  });

  it("vencida gana a bloqueada: el vencimiento es lo que obliga a actuar hoy", () => {
    expect(taskBucket(tarea({ status: "BLOCKED", dueDate: at(10) }), NOW)).toBe("overdue");
  });

  it("distingue bloqueada, en curso y pendiente", () => {
    expect(taskBucket(tarea({ status: "BLOCKED" }), NOW)).toBe("blocked");
    expect(taskBucket(tarea({ status: "IN_PROGRESS" }), NOW)).toBe("inProgress");
    expect(taskBucket(tarea({ status: "PENDING" }), NOW)).toBe("pending");
  });

  it("una fecha futura o ilegible no cuenta como vencida", () => {
    expect(taskBucket(tarea({ dueDate: at(20) }), NOW)).toBe("pending");
    expect(taskBucket(tarea({ dueDate: "no es una fecha" }), NOW)).toBe("pending");
  });
});

describe("countTasks", () => {
  it("cuenta por estado sobre todos los expedientes", () => {
    const resultado = countTasks(
      [
        flujo({ tasks: [tarea({ dueDate: at(10) }), tarea({ status: "BLOCKED" })] }),
        flujo({ tasks: [tarea({ status: "IN_PROGRESS" }), tarea(), tarea({ status: "COMPLETED" })] }),
      ],
      NOW,
    );
    expect(Object.fromEntries(resultado.map((e) => [e.bucket, e.count]))).toEqual({
      overdue: 1,
      blocked: 1,
      inProgress: 1,
      pending: 1,
    });
  });

  it("countTasksIn mira un solo expediente", () => {
    const uno = flujo({ tasks: [tarea({ dueDate: at(10) }), tarea({ dueDate: at(11) }), tarea()] });
    expect(countTasksIn(uno, "overdue", NOW)).toBe(2);
    expect(countTasksIn(uno, "pending", NOW)).toBe(1);
  });
});

describe("sortByUrgency", () => {
  it("primero lo grave, luego lo vencido, luego lo bloqueado", () => {
    const grave = flujo({ employee: { id: "1", name: "Grave", email: "g@x.c" }, alerts: [{ taskId: "t", severity: "danger", message: "m" }] });
    const vencido = flujo({ employee: { id: "2", name: "Vencido", email: "v@x.c" }, tasks: [tarea({ dueDate: at(10) })] });
    const bloqueado = flujo({ employee: { id: "3", name: "Bloqueado", email: "b@x.c" }, tasks: [tarea({ status: "BLOCKED" })] });
    const tranquilo = flujo({ employee: { id: "4", name: "Tranquilo", email: "t@x.c" } });

    const orden = sortByUrgency([tranquilo, bloqueado, vencido, grave], NOW).map((e) => e.flow.employee.name);
    expect(orden).toEqual(["Grave", "Vencido", "Bloqueado", "Tranquilo"]);
  });

  it("marca cuáles piden atención y cuáles no", () => {
    const resultado = sortByUrgency([flujo({ tasks: [tarea({ status: "BLOCKED" })] }), flujo()], NOW);
    expect(resultado.map((e) => e.needsAttention)).toEqual([true, false]);
  });

  it("a igualdad, primero quien menos ha avanzado", () => {
    const orden = sortByUrgency(
      [
        flujo({ progressPercent: 80, employee: { id: "1", name: "Casi", email: "c@x.c" } }),
        flujo({ progressPercent: 20, employee: { id: "2", name: "Empezando", email: "e@x.c" } }),
      ],
      NOW,
    ).map((e) => e.flow.employee.name);
    expect(orden).toEqual(["Empezando", "Casi"]);
  });

  it("con todo igual el orden es estable, no el del arreglo", () => {
    const a = flujo({ employee: { id: "1", name: "Zeta", email: "z@x.c" } });
    const b = flujo({ employee: { id: "2", name: "Alfa", email: "a@x.c" } });
    expect(sortByUrgency([a, b], NOW).map((e) => e.flow.employee.name)).toEqual(["Alfa", "Zeta"]);
    expect(sortByUrgency([b, a], NOW).map((e) => e.flow.employee.name)).toEqual(["Alfa", "Zeta"]);
  });
});
