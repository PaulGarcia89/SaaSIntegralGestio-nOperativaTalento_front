import type { OnboardingTimelineEventDto } from "./contracts";

export interface OnboardingTimelineActorDisplay {
  name: string;
  detail?: string;
}

export function getOnboardingTimelineActor(
  event: OnboardingTimelineEventDto,
): OnboardingTimelineActorDisplay {
  const directActor = actorFromUnknown(event.actor);
  if (directActor) return directActor;

  const payloadActor = actorFromUnknown(event.payload?.actor);
  if (payloadActor) return payloadActor;

  const name = firstString(event.payload, [
    "actorName",
    "performedByName",
    "responsibleName",
    "userName",
  ]);
  const detail = firstString(event.payload, [
    "actorRole",
    "performedByRole",
    "responsibleRole",
    "actorEmail",
    "performedByEmail",
  ]);

  return name
    ? { name, detail }
    : { name: "Responsable no registrado" };
}

function actorFromUnknown(value: unknown): OnboardingTimelineActorDisplay | null {
  if (typeof value === "string" && value.trim()) {
    return { name: value.trim() };
  }
  if (!isRecord(value)) return null;

  const name = firstString(value, ["name", "fullName", "displayName"]);
  const type = firstString(value, ["type"]);
  const detail = firstString(value, ["role", "roleLabel", "email"]);

  if (name) return { name, detail };
  if (type === "SYSTEM") return { name: "Sistema / automatización", detail };
  return null;
}

function firstString(
  source: Record<string, unknown> | null | undefined,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = source?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
