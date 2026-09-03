import { describe, expect, it } from "vitest";
import { acquireTrainingAssessmentSubmit, clearTrainingAssessmentSubmitKey, getTrainingAssessmentSubmitKey, persistTrainingAssessmentSubmitKey, trainingAssessmentSubmitKey } from "./training-assessment-submit-storage";

function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  } as unknown as Storage;
}

describe("training assessment submit storage", () => {
  it("recupera la clave persistida del intento", () => {
    const local = storage();
    const first = persistTrainingAssessmentSubmitKey("attempt-1", local);
    expect(first).toBe(trainingAssessmentSubmitKey("attempt-1"));
    expect(getTrainingAssessmentSubmitKey("attempt-1", local)).toBe(first);
  });

  it("conserva la misma clave en reintentos y la elimina al completar", () => {
    const local = storage();
    const first = persistTrainingAssessmentSubmitKey("attempt-1", local);
    const retry = persistTrainingAssessmentSubmitKey("attempt-1", local);
    expect(retry).toBe(first);
    clearTrainingAssessmentSubmitKey("attempt-1", local);
    expect(getTrainingAssessmentSubmitKey("attempt-1", local)).toBeNull();
  });

  it("aísla claves entre intentos", () => {
    const local = storage();
    persistTrainingAssessmentSubmitKey("attempt-1", local);
    persistTrainingAssessmentSubmitKey("attempt-2", local);
    expect(getTrainingAssessmentSubmitKey("attempt-1", local)).toBe(trainingAssessmentSubmitKey("attempt-1"));
    expect(getTrainingAssessmentSubmitKey("attempt-2", local)).toBe(trainingAssessmentSubmitKey("attempt-2"));
  });

  it("bloquea un segundo envío mientras el primero está en curso", () => {
    const lock = { current: false };
    expect(acquireTrainingAssessmentSubmit(lock, false)).toBe(true);
    expect(acquireTrainingAssessmentSubmit(lock, true)).toBe(false);
  });
});
