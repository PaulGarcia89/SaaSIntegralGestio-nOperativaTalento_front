import { describe, expect, it } from "vitest";
import { buildOnboardingBlockingReason } from "./onboarding-blocking";

describe("onboarding task blocking", () => {
  it("combines the operational reason with normalized observations", () => {
    expect(
      buildOnboardingBlockingReason(
        "DOCUMENTATION",
        "  Falta constancia\n fiscal del empleado.  ",
      ),
    ).toBe("Documentación incompleta: Falta constancia fiscal del empleado.");
  });

  it("requires a reason", () => {
    expect(buildOnboardingBlockingReason("", "Existe una incidencia")).toBeNull();
  });

  it("requires observations", () => {
    expect(buildOnboardingBlockingReason("ACCESS", "   ")).toBeNull();
  });
});
