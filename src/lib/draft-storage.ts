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

const PREFIX = "talentos.draft";

function segment(value: string) {
  return encodeURIComponent(value.trim());
}

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

export function saveScopedDraft<T>(scope: DraftScope, value: T, ttlMs = DEFAULT_DRAFT_TTL_MS, now = Date.now()) {
  if (typeof window === "undefined") return;
  const envelope: DraftEnvelope<T> = { version: 1, scope, savedAt: now, expiresAt: now + ttlMs, value };
  window.sessionStorage.setItem(draftStorageKey(scope), JSON.stringify(envelope));
}

export function loadScopedDraft<T>(scope: DraftScope, now = Date.now()): { value: T; savedAt: number; expiresAt: number } | null {
  if (typeof window === "undefined") return null;
  const key = draftStorageKey(scope);
  try {
    const envelope = JSON.parse(window.sessionStorage.getItem(key) ?? "null") as DraftEnvelope<T> | null;
    if (!envelope || envelope.version !== 1 || !sameScope(envelope.scope, scope) || envelope.expiresAt <= now) {
      window.sessionStorage.removeItem(key);
      return null;
    }
    return { value: envelope.value, savedAt: envelope.savedAt, expiresAt: envelope.expiresAt };
  } catch {
    window.sessionStorage.removeItem(key);
    return null;
  }
}

export function removeScopedDraft(scope: DraftScope) {
  if (typeof window !== "undefined") window.sessionStorage.removeItem(draftStorageKey(scope));
}

export function purgeExpiredDrafts(now = Date.now()) {
  if (typeof window === "undefined") return;
  for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
    const key = window.sessionStorage.key(index);
    if (!key?.startsWith(`${PREFIX}:`)) continue;
    try {
      const envelope = JSON.parse(window.sessionStorage.getItem(key) ?? "null") as DraftEnvelope<unknown> | null;
      if (!envelope || envelope.version !== 1 || envelope.expiresAt <= now) window.sessionStorage.removeItem(key);
    } catch {
      window.sessionStorage.removeItem(key);
    }
  }
}
