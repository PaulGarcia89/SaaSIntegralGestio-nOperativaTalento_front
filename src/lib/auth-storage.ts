import type { RoleKey, SessionDto } from "@/lib/contracts";

const MOCK_AUTH_STORAGE_KEY = "saas-integral.mock-auth";
// Keep demo sessions local to non-production builds so production only uses
// credentials and entities issued by the live backend.
const MOCK_BACKEND_ENABLED = false;

export type AuthSnapshot = { accessToken: string; tenantId: string; userId: string; role: RoleKey };
let memoryAuth: AuthSnapshot | null = null;

export function getStoredAuth() {
  if (memoryAuth) return memoryAuth;
  if (!MOCK_BACKEND_ENABLED || typeof window === "undefined") return null;
  const serialized = window.sessionStorage.getItem(MOCK_AUTH_STORAGE_KEY);
  if (!serialized) return null;
  try {
    memoryAuth = JSON.parse(serialized) as AuthSnapshot;
    return memoryAuth;
  } catch {
    window.sessionStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
    return null;
  }
}
export function persistAuth(auth: AuthSnapshot) {
  memoryAuth = auth;
  if (typeof window === "undefined") return;
  if (MOCK_BACKEND_ENABLED) {
    window.sessionStorage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify(auth));
  }
}
export function clearStoredAuth() {
  memoryAuth = null;
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
}
export function getStoredTenantId() { return ""; }
export function persistSelectedTenantId(_tenantId: string) {}
export function getStoredBranchId() { return ""; }
export function persistSelectedBranchId(_branchId: string) {}
export function getStoredSession(): SessionDto | null { const auth = getStoredAuth(); return auth ? { token: auth.accessToken, tenantId: auth.tenantId, userId: auth.userId, role: auth.role } : null; }
