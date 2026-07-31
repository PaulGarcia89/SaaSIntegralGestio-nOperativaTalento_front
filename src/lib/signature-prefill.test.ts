import { describe, expect, it } from "vitest";
import { findSignaturePackageFlowPrefill } from "./signature-prefill";

const flows = [
  {
    id: "flow-1",
    employee: {
      id: "employee-1",
      name: "María López",
      email: "maria@example.com",
    },
  },
];

describe("signature package preselection", () => {
  it("prefills the package from the requested onboarding flow", () => {
    expect(findSignaturePackageFlowPrefill(flows, "flow-1")).toEqual({
      onboardingFlowId: "flow-1",
      fullName: "María López",
      email: "maria@example.com",
    });
  });

  it("does not fall back to another flow when the requested id is invalid", () => {
    expect(findSignaturePackageFlowPrefill(flows, "unknown")).toBeNull();
  });
});
