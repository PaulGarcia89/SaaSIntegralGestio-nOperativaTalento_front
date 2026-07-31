import { describe, expect, it } from "vitest";
import type { OnboardingTimelineEventDto } from "./contracts";
import { getOnboardingTimelineActor } from "./onboarding-timeline";

const baseEvent: OnboardingTimelineEventDto = {
  id: "event-1",
  type: "TASK_UPDATED",
  title: "Tarea actualizada",
  occurredAt: "2026-07-30T12:00:00.000Z",
};

describe("onboarding timeline actor", () => {
  it("uses the actor returned by the current API contract", () => {
    expect(
      getOnboardingTimelineActor({
        ...baseEvent,
        actor: {
          id: "user-1",
          name: "Ana Torres",
          email: "ana@example.com",
          role: "Recursos Humanos",
          type: "USER",
        },
      }),
    ).toEqual({ name: "Ana Torres", detail: "Recursos Humanos" });
  });

  it("supports actor data stored in legacy payloads", () => {
    expect(
      getOnboardingTimelineActor({
        ...baseEvent,
        payload: {
          performedByName: "Carlos Ruiz",
          performedByEmail: "carlos@example.com",
        },
      }),
    ).toEqual({ name: "Carlos Ruiz", detail: "carlos@example.com" });
  });

  it("identifies automated events without assigning them to a person", () => {
    expect(
      getOnboardingTimelineActor({
        ...baseEvent,
        actor: { type: "SYSTEM" },
      }),
    ).toEqual({ name: "Sistema / automatización" });
  });

  it("makes missing audit attribution explicit", () => {
    expect(getOnboardingTimelineActor(baseEvent)).toEqual({
      name: "Responsable no registrado",
    });
  });
});
