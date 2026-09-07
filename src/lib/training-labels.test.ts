import { describe, expect, it } from "vitest";
import {
  courseDifficultyLabel,
  courseStatusLabel,
  courseStatusTone,
  deliveryStatusLabel,
  deliveryStatusTone,
  formatDateTime,
  formatDuration,
  formatMinutes,
  healthStatusLabel,
  healthStatusTone,
  improvementStatusLabel,
  launchStatusLabel,
  launchStatusTone,
  packageStatusLabel,
  progressStatusLabel,
  progressStatusTone,
  questionDifficultyLabel,
  runKindLabel,
  runStatusLabel,
  runStatusTone,
  severityLabel,
  severityTone,
} from "@/lib/training-labels";

describe("rótulos de capacitación", () => {
  it("traduce los estados de curso que el backend declara", () => {
    expect(courseStatusLabel("DRAFT")).toBe("Borrador");
    expect(courseStatusLabel("IN_REVIEW")).toBe("En revisión");
    expect(courseStatusLabel("PUBLISHED")).toBe("Publicado");
    expect(courseStatusLabel("RETIRED")).toBe("Retirado");
  });

  it("traduce la dificultad de cursos y de preguntas, que usan escalas distintas", () => {
    // El backend usa BEGINNER/INTERMEDIATE/ADVANCED para cursos y
    // EASY/MEDIUM/HARD para preguntas. Mezclarlas produce «Media» donde
    // correspondía «Intermedia».
    expect(courseDifficultyLabel("BEGINNER")).toBe("Inicial");
    expect(courseDifficultyLabel("ADVANCED")).toBe("Avanzada");
    expect(questionDifficultyLabel("EASY")).toBe("Fácil");
    expect(questionDifficultyLabel("HARD")).toBe("Difícil");
  });

  it("traduce el avance de una persona", () => {
    expect(progressStatusLabel("NOT_STARTED")).toBe("Sin empezar");
    expect(progressStatusLabel("OVERDUE")).toBe("Vencido");
  });

  it("traduce campañas, salud, envíos, ejecuciones, paquetes y mejoras", () => {
    expect(launchStatusLabel("ACTIVE")).toBe("En marcha");
    expect(healthStatusLabel("HEALTHY")).toBe("Todo en orden");
    expect(deliveryStatusLabel("DEAD_LETTER")).toBe("Descartado tras varios intentos");
    expect(runStatusLabel("SUCCEEDED")).toBe("Terminó bien");
    expect(runKindLabel("RECOVER_WEBHOOKS")).toBe("Recuperar webhooks");
    expect(packageStatusLabel("READY")).toBe("Listo");
    expect(improvementStatusLabel("VALIDATING")).toBe("En validación");
    expect(severityLabel("CRITICAL")).toBe("Crítica");
  });

  it("acepta el código en minúsculas: el backend no siempre normaliza", () => {
    expect(courseStatusLabel("published")).toBe("Publicado");
    expect(healthStatusTone("critical")).toBe("danger");
  });

  it("un estado desconocido se muestra legible, no en mayúsculas ni vacío", () => {
    // Que aparezca «Estado nuevo» es aceptable; que aparezca «ESTADO_NUEVO» o
    // que la pantalla se caiga, no.
    expect(courseStatusLabel("ESTADO_NUEVO")).toBe("Estado nuevo");
    expect(runStatusLabel("QUEUED")).toBe("Queued");
  });

  it("sin valor dice «Sin definir», nunca «undefined»", () => {
    expect(courseStatusLabel(undefined)).toBe("Sin definir");
    expect(courseStatusLabel(null)).toBe("Sin definir");
    expect(courseStatusLabel("")).toBe("Sin definir");
  });
});

describe("tonos", () => {
  it("el tono lo decide el significado, no la marca del tenant", () => {
    expect(courseStatusTone("PUBLISHED")).toBe("success");
    expect(courseStatusTone("PAUSED")).toBe("warning");
    expect(launchStatusTone("CANCELLED")).toBe("neutral");
    expect(progressStatusTone("OVERDUE")).toBe("danger");
    expect(deliveryStatusTone("FAILED")).toBe("danger");
    expect(runStatusTone("RUNNING")).toBe("progress");
  });

  it("un estado desconocido es neutro, no rojo", () => {
    // Pintar de rojo lo que el frontend no reconoce convierte un despliegue
    // del backend en una alarma falsa para toda la operación.
    expect(courseStatusTone("ESTADO_NUEVO")).toBe("neutral");
    expect(severityTone("DESCONOCIDA")).toBe("neutral");
    expect(courseStatusTone(undefined)).toBe("neutral");
  });

  it("una terminación cancelada es neutra, no un éxito ni un fallo", () => {
    expect(launchStatusTone("COMPLETED")).toBe("success");
    expect(launchStatusTone("CANCELLED")).toBe("neutral");
  });
});

describe("formatDuration", () => {
  it("por debajo del segundo la unidad natural es el milisegundo", () => {
    expect(formatDuration(412)).toBe("412 ms");
    expect(formatDuration(0)).toBe("0 ms");
  });

  it("compone minutos y segundos", () => {
    expect(formatDuration(1000)).toBe("1 s");
    expect(formatDuration(45_000)).toBe("45 s");
    expect(formatDuration(413_000)).toBe("6 min 53 s");
    expect(formatDuration(120_000)).toBe("2 min");
  });

  it("compone horas", () => {
    expect(formatDuration(3_600_000)).toBe("1 h");
    expect(formatDuration(5_400_000)).toBe("1 h 30 min");
  });

  it("un valor ausente o imposible no se dibuja como «NaN ms»", () => {
    expect(formatDuration(null)).toBe("—");
    expect(formatDuration(undefined)).toBe("—");
    expect(formatDuration(Number.NaN)).toBe("—");
    expect(formatDuration(-5)).toBe("—");
  });
});

describe("formatMinutes", () => {
  it("mantiene el minuto como unidad de origen", () => {
    expect(formatMinutes(45)).toBe("45 min");
    expect(formatMinutes(60)).toBe("1 h");
    expect(formatMinutes(95)).toBe("1 h 35 min");
  });

  it("cero minutos es cero, no «—»: un curso puede no tener duración estimada", () => {
    expect(formatMinutes(0)).toBe("0 min");
  });

  it("descarta lo que no es un número", () => {
    expect(formatMinutes(null)).toBe("—");
    expect(formatMinutes(Number.POSITIVE_INFINITY)).toBe("—");
  });
});

describe("formatDateTime", () => {
  it("una fecha inválida no se pinta como «Invalid Date»", () => {
    expect(formatDateTime("no es una fecha")).toBe("—");
    expect(formatDateTime(null)).toBe("—");
    expect(formatDateTime("")).toBe("—");
  });

  it("una fecha válida produce texto", () => {
    expect(formatDateTime("2026-03-14T10:30:00.000Z").length).toBeGreaterThan(0);
  });
});
