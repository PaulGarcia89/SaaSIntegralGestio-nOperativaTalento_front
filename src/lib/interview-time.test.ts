import { describe, expect, it } from "vitest";
import { interviewStartInZone } from "./interview-time";
describe("interview dates", () => {
  it("uses the selected zone in summer and winter", () => {
    expect(interviewStartInZone("2026-09-15T10:00", "America/New_York").toISOString()).toBe("2026-09-15T14:00:00.000Z");
    expect(interviewStartInZone("2026-12-15T10:00", "America/New_York").toISOString()).toBe("2026-12-15T15:00:00.000Z");
  });
  it("supports fractional-hour offsets", () => expect(interviewStartInZone("2026-09-15T10:00", "Asia/Kathmandu").toISOString()).toBe("2026-09-15T04:15:00.000Z"));
  it("rejects DST gaps and ambiguous hours", () => {
    expect(() => interviewStartInZone("2026-03-08T02:30", "America/New_York")).toThrow("no existe");
    expect(() => interviewStartInZone("2026-11-01T01:30", "America/New_York")).toThrow("dos veces");
  });
  it("rejects invalid dates and zones", () => {
    expect(() => interviewStartInZone("2026-02-30T10:00", "UTC")).toThrow();
    expect(() => interviewStartInZone("2026-09-15T10:00", "Wrong/Zone")).toThrow();
  });
});
