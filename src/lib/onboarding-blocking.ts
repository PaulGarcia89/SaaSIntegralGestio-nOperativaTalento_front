export const ONBOARDING_BLOCK_REASONS = [
  { value: "DOCUMENTATION", label: "Documentación incompleta" },
  { value: "DEPENDENCY", label: "Dependencia pendiente" },
  { value: "APPROVAL", label: "Aprobación pendiente" },
  { value: "ACCESS", label: "Acceso o credenciales" },
  { value: "RESOURCE", label: "Recurso no disponible" },
  { value: "OTHER", label: "Otro motivo" },
] as const;

export type OnboardingBlockReasonCode =
  (typeof ONBOARDING_BLOCK_REASONS)[number]["value"];

export function buildOnboardingBlockingReason(
  reasonCode: OnboardingBlockReasonCode | "",
  observations: string,
) {
  const reason = ONBOARDING_BLOCK_REASONS.find((item) => item.value === reasonCode);
  const normalizedObservations = observations.trim().replace(/\s+/g, " ");

  if (!reason || !normalizedObservations) return null;
  return `${reason.label}: ${normalizedObservations}`;
}
