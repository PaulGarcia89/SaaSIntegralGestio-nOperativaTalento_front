import { afterEach, describe, expect, it, vi } from "vitest";
import { submitTrainingAssessment } from "./backend";

describe("submitTrainingAssessment HTTP contract", () => {
  afterEach(() => vi.unstubAllGlobals());

  function response() {
    return new Response(JSON.stringify({ id: "attempt-1", status: "GRADED", score: 100 }), { status: 200, headers: { "content-type": "application/json" } });
  }

  it("sends Idempotency-Key and keeps x-request-id", async () => {
    const fetchMock = vi.fn().mockImplementation(response);
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { setTimeout, clearTimeout });

    await submitTrainingAssessment("quiz-1", "attempt-1", "training-assessment-submit:attempt-1");

    const headers = new Headers(fetchMock.mock.calls[0]?.[1]?.headers);
    expect(headers.get("Idempotency-Key")).toBe("training-assessment-submit:attempt-1");
    expect(headers.get("x-request-id")).toBeTruthy();
  });

  it("mantiene compatibilidad sin clave explícita", async () => {
    const fetchMock = vi.fn().mockImplementation(response);
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { setTimeout, clearTimeout });

    await submitTrainingAssessment("quiz-1", "attempt-1");

    const headers = new Headers(fetchMock.mock.calls[0]?.[1]?.headers);
    expect(headers.get("Idempotency-Key")).toBeNull();
    expect(headers.get("x-request-id")).toBeTruthy();
  });

  it("reutiliza la misma clave cuando el cliente reintenta", async () => {
    const fetchMock = vi.fn().mockImplementation(response);
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { setTimeout, clearTimeout });
    const key = "training-assessment-submit:attempt-1";

    await submitTrainingAssessment("quiz-1", "attempt-1", key);
    await submitTrainingAssessment("quiz-1", "attempt-1", key);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get("Idempotency-Key")).toBe(key);
    expect(new Headers(fetchMock.mock.calls[1]?.[1]?.headers).get("Idempotency-Key")).toBe(key);
  });
});
