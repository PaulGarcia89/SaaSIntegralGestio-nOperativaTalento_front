"use client";

import type {
  AppDatasetsDto,
  BranchDto,
  ModuleAssignmentDto,
  ModuleKey,
  PermissionKey,
  RoleDefinitionDto,
  RoleKey,
  SessionDto,
  SubscriptionDto,
  TenantDto,
  UserDto,
  PlanTier,
} from "@/lib/contracts";
import { authenticateUser as authenticateMockUser } from "@/lib/mock-backend";
import {
  appDatasets,
  mockBranches,
  mockTenants,
  mockUsers,
  rolePermissions,
} from "@/lib/mock-data";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api").replace(/\/$/, "");
const AUTH_STORAGE_KEY = "saas-integral.auth";
const TENANT_STORAGE_KEY = "saas-integral.current-tenant";

type AuthSnapshot = {
  accessToken: string;
  refreshToken: string;
  tenantId: string;
  userId: string;
  role: RoleKey;
};

type BackendAuthUser = {
  id: string;
  userId: string;
  sessionId: string | null;
  email: string;
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  roleScope: string;
  allowedBranchIds: string[];
  activeBranchId: string | null;
  availableBranches: Array<{
    id: string;
    tenantId: string;
    name: string;
    location: string;
  }>;
  firstName: string;
  lastName: string;
  isSuperAdmin: boolean;
  roles: string[];
  permissions: string[];
  enabledModules: string[];
  tenantCapabilities?: {
    enabledModules?: string[];
    plan?: {
      code: string;
      name: string;
    } | null;
  };
};

type LoginResponse = {
  user: BackendAuthUser;
  accessToken: string;
  refreshToken: string;
};

type BackendTenant = {
  id: string;
  name: string;
  slug: string;
  status?: string;
  planCode?: string | null;
  enabledModules?: string[];
};

type BackendBranch = {
  id: string;
  tenantId: string;
  name: string;
  location: string;
};

type BackendPermission = {
  id: string;
  code: string;
  name: string;
};

type BackendRole = {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  rolePermissions: Array<{
    permission: BackendPermission;
  }>;
  _count?: {
    userRoles?: number;
  };
};

type BackendUser = {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  isSuperAdmin: boolean;
  activeBranchId?: string | null;
  userRoles?: Array<{
    role: {
      code: string;
      name: string;
    };
  }>;
  userPermissions?: Array<{
    permission: BackendPermission;
  }>;
  allowedBranchIds?: string[];
};

type BackendPlan = {
  id: string;
  code: string;
  name: string;
  priceMonthly?: string | null;
  priceYearly?: string | null;
};

type BackendSubscription = {
  id: string;
  tenantId: string;
  status: string;
  startsAt: string;
  endsAt?: string | null;
  trialEndsAt?: string | null;
  tenant?: {
    id: string;
    name: string;
  };
  plan: BackendPlan;
};

type BackendFeatureFlag = {
  id: string;
  code: string;
  name: string;
  enabled: boolean;
  planEnabled: boolean;
  featureFlag: {
    id: string;
  } | null;
};

type RequestOptions = {
  auth?: boolean;
  retryOnUnauthorized?: boolean;
  tenantId?: string;
};

const uiPermissionToBackendCodes: Record<PermissionKey, string[]> = {
  "dashboard.view": [],
  "ats.view": ["vacancies.read", "applications.read"],
  "ats.manage": ["vacancies.create", "vacancies.update", "vacancies.delete", "applications.create", "applications.update", "applications.delete"],
  "onboarding.view": ["applications.read"],
  "onboarding.manage": ["applications.update"],
  "training.view": ["training.read"],
  "training.manage": ["training.create", "training.update", "training.delete"],
  "productivity.view": [],
  "inventory.view": [],
  "inventory.manage": [],
  "admin.view": ["tenants.read"],
  "admin.users": ["users.read", "users.create", "users.update", "users.delete"],
  "admin.roles": ["roles.read", "roles.create", "roles.update", "roles.delete", "permissions.read"],
  "admin.company": ["tenants.read", "tenants.update", "branches.read", "branches.create", "branches.update", "branches.delete", "modules.read", "modules.update"],
  "admin.subscription": ["subscriptions.read", "subscriptions.create", "subscriptions.update", "subscriptions.delete", "plans.read"],
  "reports.view": ["plans.read"],
  "notifications.view": [],
  "profile.view": [],
};

function isApiUnavailable(error: unknown) {
  if (!(error instanceof Error)) return false;

  return (
    error.message.includes("Error 404") ||
    error.message.includes("Failed to fetch") ||
    error.message.includes("fetch failed") ||
    error.message.includes("NetworkError")
  );
}

function buildMockBackendCodes(permission: PermissionKey): string[] {
  return uiPermissionToBackendCodes[permission];
}

function buildMockAuthUser(userId: string): BackendAuthUser {
  const user = mockUsers.find((item) => item.id === userId) ?? mockUsers[0];
  const tenant = mockTenants.find((item) => item.id === user.tenantId) ?? mockTenants[0];
  const branches = mockBranches.filter((branch) => branch.tenantId === tenant.id);
  const permissions = rolePermissions[user.role].flatMap(buildMockBackendCodes);

  return {
    id: user.id,
    userId: user.id,
    sessionId: "mock-session",
    email: user.email,
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    tenantName: tenant.name,
    roleScope: user.role,
    allowedBranchIds: branches.map((branch) => branch.id),
    activeBranchId: branches[0]?.id ?? null,
    availableBranches: branches.map((branch) => ({
      id: branch.id,
      tenantId: branch.tenantId,
      name: branch.name,
      location: branch.city,
    })),
    firstName: user.fullName.split(" ")[0] ?? "Usuario",
    lastName: user.fullName.split(" ").slice(1).join(" ") || "Demo",
    isSuperAdmin: user.role === "admin_saas",
    roles: [user.role === "admin_saas" ? "SUPERADMIN" : user.role === "admin_empresa" ? "TENANT_ADMIN" : user.role === "rrhh" ? "HR_MANAGER" : user.role === "lider_area" ? "SUPERVISOR" : "EMPLOYEE"],
    permissions,
    enabledModules: tenant.enabledModules.map((module) => {
      switch (module) {
        case "ats":
          return "ATS";
        case "onboarding":
          return "ONBOARDING";
        case "training":
          return "TRAINING";
        case "inventory":
          return "INVENTORY";
        case "productivity":
          return "AI_PRODUCTIVITY";
        case "reports":
          return "REPORTS";
        default:
          return module.toUpperCase();
      }
    }),
    tenantCapabilities: {
      enabledModules: tenant.enabledModules.map((module) => module.toUpperCase()),
      plan: {
        code: tenant.plan.toUpperCase(),
        name: tenant.plan,
      },
    },
  };
}

function getStoredAuth(): AuthSnapshot | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthSnapshot;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

function persistAuth(auth: AuthSnapshot) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

export function clearStoredAuth() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.localStorage.removeItem(TENANT_STORAGE_KEY);
}

export function getStoredTenantId() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(TENANT_STORAGE_KEY) ?? "";
}

export function persistSelectedTenantId(tenantId: string) {
  if (typeof window === "undefined") return;

  if (!tenantId) {
    window.localStorage.removeItem(TENANT_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(TENANT_STORAGE_KEY, tenantId);
}

export function getStoredSession(): SessionDto | null {
  const auth = getStoredAuth();
  if (!auth) return null;

  return {
    token: auth.accessToken,
    tenantId: auth.tenantId,
    userId: auth.userId,
    role: auth.role,
  };
}

function moduleCodeToModuleKey(code: string): ModuleKey | null {
  switch (code) {
    case "ATS":
      return "ats";
    case "ONBOARDING":
    case "DOCUMENTS":
      return "onboarding";
    case "TRAINING":
      return "training";
    case "INVENTORY":
      return "inventory";
    case "AI_PRODUCTIVITY":
      return "productivity";
    case "REPORTS":
      return "reports";
    default:
      return null;
  }
}

function planCodeToPlanTier(code?: string | null): PlanTier {
  switch (code) {
    case "ENTERPRISE":
      return "enterprise";
    case "PRO":
      return "growth";
    default:
      return "starter";
  }
}

function planTierToPlanCode(plan: PlanTier) {
  switch (plan) {
    case "enterprise":
      return "ENTERPRISE";
    case "growth":
      return "PRO";
    default:
      return "BASIC";
  }
}

function normalizeTenantStatus(status?: string): TenantDto["status"] {
  switch (status) {
    case "ACTIVE":
      return "active";
    case "SUSPENDED":
      return "suspended";
    default:
      return "trial";
  }
}

function normalizeUserStatus(status?: string): UserDto["status"] {
  switch (status) {
    case "ACTIVE":
      return "active";
    case "SUSPENDED":
      return "suspended";
    default:
      return "invited";
  }
}

function roleCodesToRoleKey(roleCodes: string[], isSuperAdmin: boolean): RoleKey {
  if (isSuperAdmin || roleCodes.includes("SUPERADMIN")) return "admin_saas";
  if (roleCodes.includes("TENANT_ADMIN") || roleCodes.includes("ADMIN")) return "admin_empresa";
  if (roleCodes.includes("HR_MANAGER")) return "rrhh";
  if (roleCodes.includes("SUPERVISOR") || roleCodes.includes("BRANCH_ADMIN")) return "lider_area";
  return "empleado";
}

function deriveEnabledModules(source: string[] | undefined, includeAdmin = false): ModuleKey[] {
  const enabled = new Set<ModuleKey>(["dashboard", "notifications", "profile"]);

  for (const code of source ?? []) {
    const mapped = moduleCodeToModuleKey(code);
    if (mapped) enabled.add(mapped);
  }

  if (includeAdmin) enabled.add("admin");
  return [...enabled];
}

function backendCodesToUiPermissions(codes: string[], enabledModules: ModuleKey[], isSuperAdmin: boolean): PermissionKey[] {
  const mapped = new Set<PermissionKey>(["dashboard.view", "notifications.view", "profile.view"]);
  const hasAny = (prefix: string) => codes.some((code) => code.startsWith(prefix));
  const hasCode = (code: string) => codes.includes(code);
  const hasAdminAccess =
    isSuperAdmin ||
    hasAny("tenants.") ||
    hasAny("branches.") ||
    hasAny("users.") ||
    hasAny("roles.") ||
    hasAny("subscriptions.") ||
    hasAny("modules.");

  if (enabledModules.includes("ats") || hasAny("vacancies.") || hasAny("applications.")) {
    mapped.add("ats.view");
  }
  if (hasCode("vacancies.create") || hasCode("vacancies.update") || hasCode("vacancies.delete") || hasCode("applications.create") || hasCode("applications.update") || hasCode("applications.delete")) {
    mapped.add("ats.manage");
  }
  if (enabledModules.includes("onboarding")) {
    mapped.add("onboarding.view");
  }
  if (hasCode("applications.update")) {
    mapped.add("onboarding.manage");
  }
  if (enabledModules.includes("training") || hasAny("training.")) {
    mapped.add("training.view");
  }
  if (hasCode("training.create") || hasCode("training.update") || hasCode("training.delete")) {
    mapped.add("training.manage");
  }
  if (enabledModules.includes("inventory")) {
    mapped.add("inventory.view");
  }
  if (enabledModules.includes("productivity")) {
    mapped.add("productivity.view");
  }
  if (enabledModules.includes("reports")) {
    mapped.add("reports.view");
  }
  if (hasAdminAccess) {
    mapped.add("admin.view");
  }
  if (hasAny("users.")) {
    mapped.add("admin.users");
  }
  if (hasAny("roles.") || hasCode("permissions.read")) {
    mapped.add("admin.roles");
  }
  if (hasAny("tenants.") || hasAny("branches.") || hasAny("modules.")) {
    mapped.add("admin.company");
  }
  if (hasAny("subscriptions.")) {
    mapped.add("admin.subscription");
  }

  return [...mapped];
}

function mapTenant(tenant: BackendTenant): TenantDto {
  const enabledModules = deriveEnabledModules(tenant.enabledModules, true);

  return {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    plan: planCodeToPlanTier(tenant.planCode),
    status: normalizeTenantStatus(tenant.status),
    enabledModules,
    branding: {
      accent: "#0EA5B7",
      supportEmail: `support@${tenant.slug}.com`,
    },
  };
}

function mapBranch(branch: BackendBranch): BranchDto {
  return {
    id: branch.id,
    tenantId: branch.tenantId,
    name: branch.name,
    city: branch.location,
    manager: "Pendiente",
    employees: 0,
    status: "active",
  };
}

function mapUser(user: BackendUser): UserDto {
  const roleCodes = user.userRoles?.map((entry) => entry.role.code) ?? [];

  return {
    id: user.id,
    fullName: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    role: roleCodesToRoleKey(roleCodes, user.isSuperAdmin),
    tenantId: user.tenantId,
    status: normalizeUserStatus(user.status),
  };
}

function mapRole(role: BackendRole): RoleDefinitionDto {
  const enabledModules = deriveEnabledModules(undefined, true);
  const permissions = backendCodesToUiPermissions(
    role.rolePermissions.map((entry) => entry.permission.code),
    enabledModules,
    role.code === "SUPERADMIN",
  );

  return {
    id: role.id,
    tenantId: role.tenantId,
    name: role.name,
    scope: role.code === "SUPERADMIN" ? "global" : role.code === "TENANT_ADMIN" ? "tenant" : "module",
    permissions,
    members: role._count?.userRoles ?? 0,
  };
}

function mapSubscription(subscription: BackendSubscription): SubscriptionDto {
  const monthlyPrice = Number(subscription.plan.priceMonthly ?? 0);
  const yearlyPrice = Number(subscription.plan.priceYearly ?? 0);
  const isAnnual = Boolean(subscription.endsAt && yearlyPrice > 0);

  return {
    id: subscription.id,
    tenantId: subscription.tenantId,
    plan: planCodeToPlanTier(subscription.plan.code),
    billingCycle: isAnnual ? "annual" : "monthly",
    status:
      subscription.status === "ACTIVE"
        ? "active"
        : subscription.status === "TRIALING"
          ? "trial"
          : "past_due",
    price: isAnnual ? yearlyPrice : monthlyPrice,
    renewalDate: subscription.endsAt ?? subscription.trialEndsAt ?? subscription.startsAt,
  };
}

function buildSessionSnapshot(payload: LoginResponse): AuthSnapshot {
  const role = roleCodesToRoleKey(payload.user.roles, payload.user.isSuperAdmin);

  return {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    tenantId: payload.user.tenantId,
    userId: payload.user.id,
    role,
  };
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "Usuario",
    lastName: parts.slice(1).join(" ") || "Demo",
  };
}

function resolveTenantHeader(explicitTenantId?: string) {
  return explicitTenantId || getStoredTenantId() || getStoredAuth()?.tenantId || "";
}

async function readJsonSafe(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function refreshAccessToken() {
  const auth = getStoredAuth();
  if (!auth?.refreshToken) return null;

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: auth.refreshToken }),
  });

  if (!response.ok) {
    clearStoredAuth();
    return null;
  }

  const payload = (await response.json()) as LoginResponse;
  const snapshot = buildSessionSnapshot(payload);
  persistAuth(snapshot);
  return snapshot;
}

async function request<T>(path: string, init: RequestInit = {}, options: RequestOptions = {}): Promise<T> {
  const auth = getStoredAuth();
  const headers = new Headers(init.headers);
  const tenantId = resolveTenantHeader(options.tenantId);

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth !== false && auth?.accessToken) {
    headers.set("Authorization", `Bearer ${auth.accessToken}`);
  }

  if (options.auth !== false && tenantId) {
    headers.set("x-tenant-id", tenantId);
  }

  let response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401 && options.auth !== false && options.retryOnUnauthorized !== false && auth?.refreshToken) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers.set("Authorization", `Bearer ${refreshed.accessToken}`);
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers,
      });
    }
  }

  if (!response.ok) {
    const payload = await readJsonSafe(response);
    const message =
      typeof payload === "object" && payload && "message" in payload
        ? String((payload as { message?: string }).message)
        : `Error ${response.status}`;
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function fetchPlans() {
  return request<BackendPlan[]>("/plans");
}

async function fetchPermissionsCatalog() {
  return request<BackendPermission[]>("/permissions");
}

async function fetchRolesForTenant(tenantId: string) {
  return request<BackendRole[]>("/roles", {}, { tenantId });
}

function buildRoleCode(name: string, scope: RoleDefinitionDto["scope"]) {
  return `${scope}_${name}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

async function resolvePermissionIdsFromUiPermissions(permissions: PermissionKey[]) {
  const catalog = await fetchPermissionsCatalog();
  const backendCodes = new Set<string>();

  for (const permission of permissions) {
    for (const code of uiPermissionToBackendCodes[permission]) {
      backendCodes.add(code);
    }
  }

  return catalog
    .filter((permission) => backendCodes.has(permission.code))
    .map((permission) => permission.id);
}

async function resolvePlanId(plan: PlanTier) {
  const plans = await fetchPlans();
  const targetCode = planTierToPlanCode(plan);
  const matched = plans.find((entry) => entry.code === targetCode);

  if (!matched) {
    throw new Error(`No se encontro el plan ${plan}`);
  }

  return matched.id;
}

async function syncTenantModules(tenantId: string, modules: ModuleKey[]) {
  const moduleCodes = new Set(
    modules
      .map((module) => {
        switch (module) {
          case "ats":
            return "ATS";
          case "onboarding":
            return "ONBOARDING";
          case "training":
            return "TRAINING";
          case "inventory":
            return "INVENTORY";
          case "productivity":
            return "AI_PRODUCTIVITY";
          case "reports":
            return "REPORTS";
          default:
            return null;
        }
      })
      .filter(Boolean) as string[],
  );

  for (const moduleCode of ["ATS", "ONBOARDING", "TRAINING", "INVENTORY", "AI_PRODUCTIVITY", "REPORTS"]) {
    await request(`/feature-flags/${moduleCode}`, {
      method: "PUT",
      body: JSON.stringify({ enabled: moduleCodes.has(moduleCode) }),
    }, { tenantId });
  }
}

export async function authenticateUser(input: {
  email: string;
  password: string;
  tenantSlug?: string;
  activeBranchId?: string;
}) {
  try {
    const payload = await request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    }, { auth: false, retryOnUnauthorized: false });

    const snapshot = buildSessionSnapshot(payload);
    persistAuth(snapshot);
    persistSelectedTenantId(snapshot.tenantId);

    return {
      session: {
        token: snapshot.accessToken,
        tenantId: snapshot.tenantId,
        userId: snapshot.userId,
        role: snapshot.role,
      } satisfies SessionDto,
      user: mapUser({
        id: payload.user.id,
        tenantId: payload.user.tenantId,
        email: payload.user.email,
        firstName: payload.user.firstName,
        lastName: payload.user.lastName,
        status: "ACTIVE",
        isSuperAdmin: payload.user.isSuperAdmin,
        userRoles: payload.user.roles.map((code) => ({ role: { code, name: code } })),
      }),
      authUser: payload.user,
    };
  } catch (error) {
    if (!isApiUnavailable(error)) {
      throw error;
    }

    const session = await authenticateMockUser(input.email);
    const authUser = buildMockAuthUser(session.userId);
    const snapshot: AuthSnapshot = {
      accessToken: session.token,
      refreshToken: "mock-refresh-token",
      tenantId: session.tenantId,
      userId: session.userId,
      role: session.role,
    };

    persistAuth(snapshot);
    persistSelectedTenantId(snapshot.tenantId);

    return {
      session,
      user: mapAuthUserToUi(authUser).user,
      authUser,
    };
  }
}

export async function fetchCurrentAuthUser() {
  try {
    return await request<BackendAuthUser>("/auth/me");
  } catch (error) {
    if (!isApiUnavailable(error)) {
      throw error;
    }

    const session = getStoredSession();
    if (!session) {
      throw error;
    }

    return buildMockAuthUser(session.userId);
  }
}

export async function logoutCurrentSession() {
  try {
    await request("/auth/logout", { method: "POST" });
  } finally {
    clearStoredAuth();
  }
}

export async function fetchTenants(): Promise<TenantDto[]> {
  try {
    const tenants = await request<BackendTenant[]>("/tenants");
    return tenants.map(mapTenant);
  } catch (error) {
    if (!isApiUnavailable(error)) {
      throw error;
    }

    return mockTenants;
  }
}

export async function createTenant(input: Omit<TenantDto, "id">) {
  const tenant = await request<BackendTenant>("/tenants", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      slug: input.slug,
      status: input.status === "active" ? "ACTIVE" : input.status === "suspended" ? "SUSPENDED" : "INACTIVE",
    }),
  });

  const planId = await resolvePlanId(input.plan);
  await request("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      tenantId: tenant.id,
      planId,
      status: input.status === "trial" ? "TRIALING" : "ACTIVE",
      startsAt: new Date().toISOString(),
      trialEndsAt: input.status === "trial" ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() : undefined,
    }),
  });
  await syncTenantModules(tenant.id, input.enabledModules);

  return mapTenant((await request<BackendTenant>(`/tenants/${tenant.id}`)));
}

export async function updateTenant(id: string, input: Omit<TenantDto, "id">) {
  await request(`/tenants/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      name: input.name,
      slug: input.slug,
      status: input.status === "active" ? "ACTIVE" : input.status === "suspended" ? "SUSPENDED" : "INACTIVE",
    }),
  });

  const subscriptions = await fetchSubscriptions();
  const currentSubscription = subscriptions.find((subscription) => subscription.tenantId === id);
  const planId = await resolvePlanId(input.plan);

  if (currentSubscription) {
    await request(`/subscriptions/${currentSubscription.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        planId,
        status: input.status === "trial" ? "TRIALING" : "ACTIVE",
      }),
    });
  }

  await syncTenantModules(id, input.enabledModules);
  return mapTenant((await request<BackendTenant>(`/tenants/${id}`)));
}

export async function deleteTenant(id: string) {
  await request(`/tenants/${id}`, { method: "DELETE" });
  return { id };
}

export async function fetchBranches(tenantId?: string): Promise<BranchDto[]> {
  try {
    const response = await request<{ data: BackendBranch[] }>("/branches?page=1&pageSize=100", {}, { tenantId });
    return response.data.map(mapBranch);
  } catch (error) {
    if (!isApiUnavailable(error)) {
      throw error;
    }

    return tenantId ? mockBranches.filter((branch) => branch.tenantId === tenantId) : mockBranches;
  }
}

export async function createBranch(input: Omit<BranchDto, "id">) {
  const branch = await request<BackendBranch>("/branches", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      location: input.city,
    }),
  }, { tenantId: input.tenantId });

  return mapBranch(branch);
}

export async function updateBranch(id: string, input: Omit<BranchDto, "id">) {
  const branch = await request<BackendBranch>(`/branches/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      name: input.name,
      location: input.city,
    }),
  }, { tenantId: input.tenantId });

  return mapBranch(branch);
}

export async function deleteBranch(id: string) {
  await request(`/branches/${id}`, { method: "DELETE" });
  return { id };
}

export async function fetchTenantUsers(tenantId: string): Promise<UserDto[]> {
  try {
    const users = await request<BackendUser[]>("/users", {}, { tenantId });
    return users.map(mapUser);
  } catch (error) {
    if (!isApiUnavailable(error)) {
      throw error;
    }

    return mockUsers.filter((user) => user.tenantId === tenantId);
  }
}

export async function fetchUsers(): Promise<UserDto[]> {
  const tenantId = resolveTenantHeader();
  return fetchTenantUsers(tenantId);
}

export async function createTenantUser(input: Omit<UserDto, "id">) {
  const [roles, branches] = await Promise.all([
    fetchRolesForTenant(input.tenantId),
    fetchBranches(input.tenantId),
  ]);
  const branchIds = branches.map((branch) => branch.id);
  const activeBranchId = branchIds[0];
  const { firstName, lastName } = splitFullName(input.fullName);
  const targetRoleCode =
    input.role === "admin_saas" || input.role === "admin_empresa"
      ? "TENANT_ADMIN"
      : input.role === "rrhh"
        ? "HR_MANAGER"
        : input.role === "lider_area"
          ? "SUPERVISOR"
          : "BRANCH_USER";
  const role = roles.find((entry) => entry.code === targetRoleCode) ?? roles[0];

  const created = await request<BackendUser>("/users", {
    method: "POST",
    body: JSON.stringify({
      tenantId: input.tenantId,
      email: input.email,
      password: "ChangeMe123!",
      firstName,
      lastName,
      status: input.status === "active" ? "ACTIVE" : input.status === "suspended" ? "SUSPENDED" : "INVITED",
      roleIds: role ? [role.id] : [],
      allowedBranchIds: branchIds,
      activeBranchId,
    }),
  }, { tenantId: input.tenantId });

  return mapUser(created);
}

export async function updateTenantUser(id: string, input: Omit<UserDto, "id">) {
  const [roles, branches] = await Promise.all([
    fetchRolesForTenant(input.tenantId),
    fetchBranches(input.tenantId),
  ]);
  const branchIds = branches.map((branch) => branch.id);
  const activeBranchId = branchIds[0];
  const { firstName, lastName } = splitFullName(input.fullName);
  const targetRoleCode =
    input.role === "admin_saas" || input.role === "admin_empresa"
      ? "TENANT_ADMIN"
      : input.role === "rrhh"
        ? "HR_MANAGER"
        : input.role === "lider_area"
          ? "SUPERVISOR"
          : "BRANCH_USER";
  const role = roles.find((entry) => entry.code === targetRoleCode) ?? roles[0];

  const updated = await request<BackendUser>(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      email: input.email,
      firstName,
      lastName,
      status: input.status === "active" ? "ACTIVE" : input.status === "suspended" ? "SUSPENDED" : "INVITED",
      roleIds: role ? [role.id] : [],
      allowedBranchIds: branchIds,
      activeBranchId,
    }),
  }, { tenantId: input.tenantId });

  return mapUser(updated);
}

export async function deleteTenantUser(id: string) {
  await request(`/users/${id}`, { method: "DELETE" });
  return { id };
}

export async function fetchRoleDefinitions(tenantId: string): Promise<RoleDefinitionDto[]> {
  const roles = await fetchRolesForTenant(tenantId);
  return roles.map(mapRole);
}

export async function createRoleDefinition(input: Omit<RoleDefinitionDto, "id">) {
  const permissionIds = await resolvePermissionIdsFromUiPermissions(input.permissions);
  const role = await request<BackendRole>("/roles", {
    method: "POST",
    body: JSON.stringify({
      code: buildRoleCode(input.name, input.scope),
      name: input.name,
      permissionIds,
    }),
  }, { tenantId: input.tenantId });

  return mapRole(role);
}

export async function updateRoleDefinition(id: string, input: Omit<RoleDefinitionDto, "id">) {
  const permissionIds = await resolvePermissionIdsFromUiPermissions(input.permissions);
  const role = await request<BackendRole>(`/roles/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      name: input.name,
      permissionIds,
    }),
  }, { tenantId: input.tenantId });

  return mapRole(role);
}

export async function deleteRoleDefinition(id: string) {
  await request(`/roles/${id}`, { method: "DELETE" });
  return { id };
}

export async function fetchSubscriptions(): Promise<SubscriptionDto[]> {
  const subscriptions = await request<BackendSubscription[]>("/subscriptions");
  return subscriptions.map(mapSubscription);
}

export async function createSubscription(input: Omit<SubscriptionDto, "id">) {
  const planId = await resolvePlanId(input.plan);
  const created = await request<BackendSubscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      tenantId: input.tenantId,
      planId,
      status: input.status === "trial" ? "TRIALING" : input.status === "past_due" ? "PAST_DUE" : "ACTIVE",
      startsAt: new Date().toISOString(),
      endsAt: input.billingCycle === "annual" ? input.renewalDate : undefined,
      trialEndsAt: input.status === "trial" ? input.renewalDate : undefined,
    }),
  });

  return mapSubscription(created);
}

export async function updateSubscription(id: string, input: Omit<SubscriptionDto, "id">) {
  const planId = await resolvePlanId(input.plan);
  const updated = await request<BackendSubscription>(`/subscriptions/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      planId,
      status: input.status === "trial" ? "TRIALING" : input.status === "past_due" ? "PAST_DUE" : "ACTIVE",
      endsAt: input.billingCycle === "annual" ? input.renewalDate : null,
      trialEndsAt: input.status === "trial" ? input.renewalDate : null,
    }),
  });

  return mapSubscription(updated);
}

export async function deleteSubscription(id: string) {
  await request(`/subscriptions/${id}`, { method: "DELETE" });
  return { id };
}

export async function fetchModuleAssignments(): Promise<ModuleAssignmentDto[]> {
  const tenants = await fetchTenants();
  const assignments = await Promise.all(
    tenants.map(async (tenant) => {
      const flags = await request<BackendFeatureFlag[]>("/feature-flags", {}, { tenantId: tenant.id });
      return flags
        .map((flag) => {
          const moduleKey = moduleCodeToModuleKey(flag.code);
          if (!moduleKey) return null;

          return {
            id: flag.featureFlag?.id ?? `${tenant.id}-${moduleKey}`,
            tenantId: tenant.id,
            module: moduleKey,
            enabled: flag.enabled,
            source: flag.planEnabled ? "plan" : "manual",
          } satisfies ModuleAssignmentDto;
        })
        .filter(Boolean) as ModuleAssignmentDto[];
    }),
  );

  return assignments.flat();
}

export async function updateModuleAssignment(
  _id: string,
  input: Omit<ModuleAssignmentDto, "id">,
) {
  const moduleCode =
    input.module === "ats"
      ? "ATS"
      : input.module === "onboarding"
        ? "ONBOARDING"
        : input.module === "training"
          ? "TRAINING"
          : input.module === "inventory"
            ? "INVENTORY"
            : input.module === "productivity"
              ? "AI_PRODUCTIVITY"
              : input.module === "reports"
                ? "REPORTS"
                : null;

  if (!moduleCode) {
    return {
      ...input,
      id: `${input.tenantId}-${input.module}`,
    };
  }

  await request(`/feature-flags/${moduleCode}`, {
    method: "PUT",
    body: JSON.stringify({ enabled: input.enabled }),
  }, { tenantId: input.tenantId });

  return {
    ...input,
    id: `${input.tenantId}-${input.module}`,
  };
}

export async function fetchWorkspaceDatasets(tenantId: string): Promise<AppDatasetsDto> {
  const tenant = mockTenants.find((item) => item.id === tenantId);

  if (!tenant) {
    return {
      vacancies: [],
      candidates: [],
      inventory: [],
    };
  }

  return appDatasets[tenant.slug] ?? {
    vacancies: [],
    candidates: [],
    inventory: [],
  };
}

export function mapAuthUserToUi(authUser: BackendAuthUser): {
  user: UserDto;
  permissions: PermissionKey[];
  enabledModules: ModuleKey[];
  role: RoleKey;
} {
  const enabledModules = deriveEnabledModules(authUser.enabledModules, authUser.isSuperAdmin || authUser.permissions.some((code) => code.startsWith("tenants.") || code.startsWith("users.") || code.startsWith("roles.")));
  const role = roleCodesToRoleKey(authUser.roles, authUser.isSuperAdmin);

  return {
    user: {
      id: authUser.id,
      fullName: `${authUser.firstName} ${authUser.lastName}`.trim(),
      email: authUser.email,
      role,
      tenantId: authUser.tenantId,
      status: "active",
    },
    permissions: backendCodesToUiPermissions(authUser.permissions, enabledModules, authUser.isSuperAdmin),
    enabledModules,
    role,
  };
}
