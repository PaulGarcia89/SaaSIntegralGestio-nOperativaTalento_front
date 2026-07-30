import type { RoleKey, SessionDto } from "@/lib/contracts";

const LEGACY_AUTH_STORAGE_KEY = "saas-integral.auth";
const TENANT_STORAGE_KEY = "saas-integral.current-tenant";
const BRANCH_STORAGE_KEY = "saas-integral.current-branch";
const MOCK_AUTH_STORAGE_KEY = "saas-integral.mock-auth";
const MOCK_BACKEND_ENABLED = process.env.NEXT_PUBLIC_ENABLE_MOCK_BACKEND === "true";

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
  window.localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
  if (MOCK_BACKEND_ENABLED) {
    window.sessionStorage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify(auth));
  }
}
export function clearStoredAuth() {
  memoryAuth = null;
  if (typeof window === "undefined") return;
  [LEGACY_AUTH_STORAGE_KEY, TENANT_STORAGE_KEY, BRANCH_STORAGE_KEY].forEach((key) => window.localStorage.removeItem(key));
  window.sessionStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
}
export function getStoredTenantId() { return typeof window === "undefined" ? "" : window.localStorage.getItem(TENANT_STORAGE_KEY) ?? ""; }
export function persistSelectedTenantId(tenantId: string) { if (typeof window === "undefined") return; if (tenantId) window.localStorage.setItem(TENANT_STORAGE_KEY, tenantId); else window.localStorage.removeItem(TENANT_STORAGE_KEY); }
export function getStoredBranchId() { return typeof window === "undefined" ? "" : window.localStorage.getItem(BRANCH_STORAGE_KEY) ?? ""; }
export function persistSelectedBranchId(branchId: string) { if (typeof window === "undefined") return; if (branchId) window.localStorage.setItem(BRANCH_STORAGE_KEY, branchId); else window.localStorage.removeItem(BRANCH_STORAGE_KEY); }
export function getStoredSession(): SessionDto | null { const auth = getStoredAuth(); return auth ? { token: auth.accessToken, tenantId: auth.tenantId, userId: auth.userId, role: auth.role } : null; }
