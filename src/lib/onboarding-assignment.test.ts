import { describe, expect, it } from "vitest";
import { getOnboardingTaskOwnerInput } from "./onboarding-assignment";

describe("onboarding task assignment", () => {
  it("keeps the selected user for a nominal assignment", () => {
    expect(getOnboardingTaskOwnerInput("USER", " user-1 ")).toEqual({
      ownerType: "USER",
      ownerId: "user-1",
    });
  });

  it("requires an identity for nominal assignments", () => {
    expect(getOnboardingTaskOwnerInput("USER", "")).toBeNull();
  });

  it.each(["SYSTEM", "EMPLOYEE", "BRANCH", "INVENTORY", "TRAINING", "SIGNATURE"] as const)(
    "clears a previous user when assigning the task to %s",
    (ownerType) => {
      expect(getOnboardingTaskOwnerInput(ownerType, "old-user")).toEqual({
        ownerType,
        ownerId: null,
      });
    },
  );
});
