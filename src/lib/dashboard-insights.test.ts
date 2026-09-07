import { describe, expect, it } from "vitest";
import type { OperationalDashboardItemDto, OperationalDashboardTone } from "@/lib/contracts";
import {
  activityByDay,
  bucketByDue,
  dueBucket,
  dueLabel,
  operationalHealth,
  sortByPriority,
} from "@/lib/dashboard-insights";

/** Referencia fija: martes 15 de abril de 2025, 12:00 hora local. */
const NOW = new Date(2025, 3, 15, 12, 0, 0);

function item(overrides: Partial<OperationalDashboardItemDto> = {}): OperationalDashboardItemDto {
  return {
    id: Math.random().toString(36).slice(2),
    kind: "task",
    title: "Revisar documento",
    description: "",
    tone: "info" as OperationalDashboardTone,
    module: "onboarding",
    href: "/onboarding/documents",
    dueAt: null,
    occurredAt: NOW.toISOString(),
    recordLabel: null,
    ...overrides,
  };
}

const at = (year: number, month: number, day: number, hour = 12, minute = 0) =>
  new Date(year, month, day, hour, minute).toISOString();

describe("dueBucket", () => {
  it("sin fecha es 'none'", () => {
    expect(dueBucket(null, NOW)).toBe("none");
    expect(dueBucket(undefined, NOW)).toBe("none");
  });

  it("una fecha ilegible no revienta ni miente: es 'none'", () => {
    expect(dueBucket("no es una fecha", NOW)).toBe("none");
  });

  it("lo pasado está vencido aunque sea del mismo día", () => {
    // El caso que fallaba al comparar solo por día: vencía hoy a las 09:00 y a
    // las 12:00 seguía apareciendo como «vence hoy».
    expect(dueBucket(at(2025, 3, 15, 9, 0), NOW)).toBe("overdue");
  });

  it("lo que vence más tarde hoy es 'today'", () => {
    expect(dueBucket(at(2025, 3, 15, 23, 0), NOW)).toBe("today");
  });

  it("mañana y hasta siete días es 'week'", () => {
    expect(dueBucket(at(2025, 3, 16), NOW)).toBe("week");
    expect(dueBucket(at(2025, 3, 22), NOW)).toBe("week");
  });

  it("más allá de siete días es 'later'", () => {
    expect(dueBucket(at(2025, 3, 23), NOW)).toBe("later");
  });
});

describe("bucketByDue", () => {
  it("devuelve los cinco tramos en orden de urgencia, con ceros incluidos", () => {
    const result = bucketByDue([item({ dueAt: at(2025, 3, 14) })], NOW);
    expect(result.map((entry) => entry.bucket)).toEqual(["overdue", "today", "week", "later", "none"]);
    expect(result[0].count).toBe(1);
    // El cero es un dato, no un hueco: se devuelve.
    expect(result[3].count).toBe(0);
  });

  it("cuenta cada registro una sola vez", () => {
    const items = [
      item({ dueAt: at(2025, 3, 14) }),
      item({ dueAt: at(2025, 3, 15, 20) }),
      item({ dueAt: at(2025, 3, 18) }),
      item({ dueAt: null }),
    ];
    const total = bucketByDue(items, NOW).reduce((sum, entry) => sum + entry.count, 0);
    expect(total).toBe(items.length);
  });
});

describe("dueLabel", () => {
  it("no dice «dentro de menos de una hora» a algo que ya venció", () => {
    // El defecto original: se redondeaba a horas, salía -0, y como `-0 < 0` es
    // falso en JavaScript, diez minutos de retraso se leían como futuro.
    expect(dueLabel(at(2025, 3, 15, 11, 50), NOW)).toBe("Vencido hace 10 min");
  });

  it("usa horas y días cuando corresponde", () => {
    expect(dueLabel(at(2025, 3, 15, 9, 0), NOW)).toBe("Vencido hace 3 h");
    expect(dueLabel(at(2025, 3, 14, 12, 0), NOW)).toBe("Vencido desde ayer");
    expect(dueLabel(at(2025, 3, 12, 12, 0), NOW)).toBe("Vencido hace 3 días");
  });

  it("mira al futuro con las mismas unidades", () => {
    expect(dueLabel(at(2025, 3, 15, 12, 40), NOW)).toBe("Vence en 40 min");
    expect(dueLabel(at(2025, 3, 15, 17, 0), NOW)).toBe("Vence en 5 h");
    expect(dueLabel(at(2025, 3, 16, 12, 0), NOW)).toBe("Vence mañana");
    expect(dueLabel(at(2025, 3, 20, 12, 0), NOW)).toBe("Vence en 5 días");
  });

  it("sin fecha lo dice, no lo deja en blanco", () => {
    expect(dueLabel(null, NOW)).toBe("Sin fecha límite");
    expect(dueLabel("basura", NOW)).toBe("Sin fecha límite");
  });
});

describe("sortByPriority", () => {
  it("el tono manda sobre la fecha", () => {
    const sorted = sortByPriority([
      item({ id: "info-hoy", tone: "info", dueAt: at(2025, 3, 15, 13) }),
      item({ id: "grave-lejos", tone: "danger", dueAt: at(2025, 3, 30) }),
    ]);
    expect(sorted[0].id).toBe("grave-lejos");
  });

  it("dentro del mismo tono, primero lo que vence antes", () => {
    const sorted = sortByPriority([
      item({ id: "tarde", tone: "warning", dueAt: at(2025, 3, 20) }),
      item({ id: "pronto", tone: "warning", dueAt: at(2025, 3, 16) }),
    ]);
    expect(sorted.map((entry) => entry.id)).toEqual(["pronto", "tarde"]);
  });

  it("lo que no tiene fecha va detrás de lo que sí la tiene", () => {
    // Sin fecha no hay urgencia demostrable; colarlo arriba desplaza algo real.
    const sorted = sortByPriority([
      item({ id: "sin-fecha", tone: "warning", dueAt: null }),
      item({ id: "con-fecha", tone: "warning", dueAt: at(2025, 3, 30) }),
    ]);
    expect(sorted.map((entry) => entry.id)).toEqual(["con-fecha", "sin-fecha"]);
  });

  it("no muta el arreglo original", () => {
    const original = [item({ id: "a", tone: "info" }), item({ id: "b", tone: "danger" })];
    sortByPriority(original);
    expect(original[0].id).toBe("a");
  });
});

describe("activityByDay", () => {
  it("devuelve la serie completa aunque no haya actividad", () => {
    const series = activityByDay([], NOW, 7);
    expect(series).toHaveLength(7);
    expect(series.every((day) => day.count === 0)).toBe(true);
  });

  it("termina en hoy y empieza hace days-1 días", () => {
    const series = activityByDay([], NOW, 7);
    expect(series[6].key).toBe("2025-04-15");
    expect(series[0].key).toBe("2025-04-09");
  });

  it("agrupa por día natural, no por ventanas de 24 horas", () => {
    const series = activityByDay(
      [item({ occurredAt: at(2025, 3, 15, 1) }), item({ occurredAt: at(2025, 3, 15, 23) })],
      NOW,
      7,
    );
    expect(series[6].count).toBe(2);
  });

  it("descarta lo que cae fuera de la ventana y lo que está en el futuro", () => {
    const series = activityByDay(
      [item({ occurredAt: at(2025, 3, 1) }), item({ occurredAt: at(2025, 3, 20) })],
      NOW,
      7,
    );
    expect(series.reduce((sum, day) => sum + day.count, 0)).toBe(0);
  });

  it("ignora fechas ilegibles sin romperse", () => {
    const series = activityByDay([item({ occurredAt: "ayer por la tarde" })], NOW, 7);
    expect(series.reduce((sum, day) => sum + day.count, 0)).toBe(0);
  });
});

describe("operationalHealth", () => {
  it("sin nada pendiente, la salud es máxima y lo dice con palabras", () => {
    const health = operationalHealth([], [], NOW);
    expect(health.score).toBe(100);
    expect(health.tone).toBe("success");
    expect(health.summary).toBe("Nada vencido ni bloqueado");
  });

  it("un vencido basta para poner el tono en peligro", () => {
    const health = operationalHealth([item({ dueAt: at(2025, 3, 14) })], [], NOW);
    expect(health.tone).toBe("danger");
    expect(health.overdue).toBe(1);
    expect(health.summary).toContain("1 pendiente vencido");
  });

  it("una alerta grave también, aunque no haya nada vencido", () => {
    const health = operationalHealth([], [item({ kind: "alert", tone: "danger" })], NOW);
    expect(health.tone).toBe("danger");
    expect(health.blocking).toBe(1);
  });

  it("lo que vence hoy avisa pero no alarma", () => {
    const health = operationalHealth([item({ dueAt: at(2025, 3, 15, 20) })], [], NOW);
    expect(health.tone).toBe("warning");
    expect(health.summary).toContain("1 vence hoy");
  });

  it("el resumen concuerda en plural", () => {
    const health = operationalHealth(
      [item({ dueAt: at(2025, 3, 13) }), item({ dueAt: at(2025, 3, 14) })],
      [],
      NOW,
    );
    expect(health.summary).toContain("2 pendientes vencidos");
  });

  it("la puntuación queda siempre entre 0 y 100", () => {
    const muchos = Array.from({ length: 40 }, () => item({ dueAt: at(2025, 3, 1) }));
    const health = operationalHealth(muchos, muchos.map((entry) => ({ ...entry, kind: "alert" as const, tone: "danger" as const })), NOW);
    expect(health.score).toBeGreaterThanOrEqual(0);
    expect(health.score).toBeLessThanOrEqual(100);
  });
});
