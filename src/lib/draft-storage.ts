export const DEFAULT_DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

export interface DraftScope {
  namespace: string;
  tenantId: string;
  userId: string;
  resourceId?: string;
}

interface DraftEnvelope<T> {
  version: 1;
  scope: DraftScope;
  savedAt: number;
  expiresAt: number;
  value: T;
}

import { fetchMyPreferences, updateMyPreference } from "@/lib/backend";

const PREF_NAMESPACE = "drafts";
const PREFIX = "talentos.draft";

export function draftStorageKey(scope: DraftScope) {
  if (!scope.namespace || !scope.tenantId || !scope.userId) {
    throw new Error("El borrador requiere namespace, tenantId y userId.");
  }
  return [PREFIX, scope.namespace, scope.tenantId, scope.userId, scope.resourceId]
    .filter(Boolean)
    .map((value) => segment(String(value)))
    .join(":");
}

function sameScope(left: DraftScope, right: DraftScope) {
  return left.namespace === right.namespace && left.tenantId === right.tenantId && left.userId === right.userId && left.resourceId === right.resourceId;
}

function segment(value: string) {
  return encodeURIComponent(value.trim());
}

async function readDraftMap(now = Date.now(), includeExpired = false) {
  const preferences = await fetchMyPreferences().catch(() => ({} as Record<string, unknown>));
  const stored = preferences[PREF_NAMESPACE];
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return {};
  const entries = Object.entries(stored as Record<string, unknown>);
  return Object.fromEntries(entries.filter(([, value]) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const envelope = value as DraftEnvelope<unknown>;
    return envelope.version === 1 && (includeExpired || envelope.expiresAt > now);
  }));
}

async function writeDraftMap(map: Record<string, unknown>) {
  await updateMyPreference(PREF_NAMESPACE, map);
}

export async function saveScopedDraft<T>(scope: DraftScope, value: T, ttlMs = DEFAULT_DRAFT_TTL_MS, now = Date.now()) {
  const envelope: DraftEnvelope<T> = { version: 1, scope, savedAt: now, expiresAt: now + ttlMs, value };
  const key = draftStorageKey(scope);
  const map = await readDraftMap(now);
  map[key] = envelope;
  await writeDraftMap(map);
}

export async function loadScopedDraft<T>(scope: DraftScope, now = Date.now()): Promise<{ value: T; savedAt: number; expiresAt: number } | null> {
  const key = draftStorageKey(scope);
  try {
    const map = await readDraftMap(now);
    const envelope = map[key] as DraftEnvelope<T> | undefined;
    if (!envelope || envelope.version !== 1 || !sameScope(envelope.scope, scope) || envelope.expiresAt <= now) {
      if (Object.prototype.hasOwnProperty.call(map, key)) {
        delete map[key];
        await writeDraftMap(map);
      }
      return null;
    }
    return { value: envelope.value, savedAt: envelope.savedAt, expiresAt: envelope.expiresAt };
  } catch {
    return null;
  }
}

export async function removeScopedDraft(scope: DraftScope) {
  const key = draftStorageKey(scope);
  // Explicit deletion must also remove expired records left behind by a prior session.
  const map = await readDraftMap(Date.now(), true);
  if (Object.prototype.hasOwnProperty.call(map, key)) {
    delete map[key];
    await writeDraftMap(map);
  }
}

export async function purgeExpiredDrafts(now = Date.now()) {
  const map = await readDraftMap(now);
  await writeDraftMap(map);
}
