import type { OnboardingOwnerType } from "./contracts";

export interface OnboardingTaskOwnerInput {
  ownerType: OnboardingOwnerType;
  ownerId: string | null;
}

export function getOnboardingTaskOwnerInput(
  ownerType: OnboardingOwnerType,
  ownerId?: string,
): OnboardingTaskOwnerInput | null {
  if (ownerType === "USER") {
    const normalizedOwnerId = ownerId?.trim();
    return normalizedOwnerId
      ? { ownerType, ownerId: normalizedOwnerId }
      : null;
  }

  return { ownerType, ownerId: null };
}
