"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  BranchDto,
  ModuleKey,
  PermissionKey,
  RoleKey,
  SessionDto,
  SubscriptionAccessState,
  TenantDto,
  UserDto,
} from "@/lib/contracts";
import {
  clearStoredAuth,
  fetchBranches,
  fetchCurrentAuthUser,
  fetchTenantUsers,
  fetchTenants,
  getStoredSession,
  getStoredBranchId,
  getStoredTenantId,
  logoutCurrentSession,
  mapAuthUserToUi,
  persistSelectedTenantId,
  persistSelectedBranchId,
  updateBranchContext,
  updateTenantContext,
  restoreCurrentSession,
} from "@/lib/backend";
import { appNavigation, evaluateRouteAccess } from "@/lib/navigation";
import { getFallbackTenant } from "@/lib/ui-labels";

type AppState = {
  tenants: TenantDto[];
  branches: BranchDto[];
  tenantBranches: BranchDto[];
  users: UserDto[];
  tenantUsers: UserDto[];
  session: SessionDto | null;
  currentTenant: TenantDto;
  currentBranch: BranchDto | null;
  currentUser: UserDto;
  currentRole: RoleKey;
  currentSubscriptionStatus: SubscriptionAccessState;
  subscriptionGraceEndsAt: string | null;
  allowedTenantIds: string[];
  isBootstrapping: boolean;
  accessContextVerified: boolean;
  impersonation: { active: boolean; tenantId?: string | null; startedAt?: string | null } | null;
  setCurrentTenantId: (tenantId: string) => Promise<void>;
  setCurrentBranchId: (branchId: string) => Promise<void>;
  setCurrentUserId: (userId: string) => void;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
  can: (permission: PermissionKey) => boolean;
  canAny: (permissions: PermissionKey[]) => boolean;
  canAll: (permissions: PermissionKey[]) => boolean;
  hasModule: (module: ModuleKey) => boolean;
  hasFeature: (featureFlag: string) => boolean;
  canAccessBranch: (branchId: string) => boolean;
  allowedNav: typeof appNavigation;
};

const AppStoreContext = createContext<AppState | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionDto | null>(null);
  const [currentTenantId, setCurrentTenantIdState] = useState("");
  const [currentBranchId, setCurrentBranchIdState] = useState("");
  const [currentUserId, setCurrentUserIdState] = useState("");
  const [hasHydratedSession, setHasHydratedSession] = useState(false);

  useEffect(() => {
    const storedTenantId = getStoredTenantId();
    const storedBranchId = getStoredBranchId();
    void restoreCurrentSession().then((restoredSession) => {
      setSession(restoredSession);
      setCurrentTenantIdState(storedTenantId || restoredSession?.tenantId || "");
      setCurrentUserIdState(restoredSession?.userId || "");
      setCurrentBranchIdState(storedBranchId);
    }).finally(() => setHasHydratedSession(true));
  }, []);

  const authQuery = useQuery({
    queryKey: ["auth-me", session?.token],
    queryFn: fetchCurrentAuthUser,
    enabled: hasHydratedSession && Boolean(session?.token),
    retry: false,
  });

  const tenantsQuery = useQuery({
    queryKey: ["admin-tenants", session?.token],
    queryFn: fetchTenants,
    enabled: Boolean(authQuery.data && (authQuery.data.isSuperAdmin || authQuery.data.permissions.some((permission) => permission.startsWith("tenants.")))),
  });

  const isGlobalSuperAdmin = Boolean(
    authQuery.data?.isSuperAdmin && authQuery.data.isGlobalContext,
  );

  const branchesQuery = useQuery({
    queryKey: ["branches", currentTenantId],
    queryFn: () => fetchBranches(currentTenantId),
    enabled: Boolean(
      authQuery.data &&
      currentTenantId &&
      !isGlobalSuperAdmin &&
      (
        authQuery.data.permissions.includes("branches.read") ||
        ["platform_admin", "tenant_admin", "branch_admin"].includes(authQuery.data.roleScope)
      ),
    ),
    retry: false,
  });

  const usersQuery = useQuery({
    queryKey: ["tenant-users", currentTenantId],
    queryFn: () => fetchTenantUsers(currentTenantId),
    enabled: Boolean(
      authQuery.data?.permissions.some((permission) => permission.startsWith("users.")) &&
      currentTenantId &&
      !isGlobalSuperAdmin,
    ),
    retry: false,
  });

  const authContext = useMemo(
    () => (authQuery.data ? mapAuthUserToUi(authQuery.data) : null),
    [authQuery.data],
  );

  const tenants = useMemo(() => tenantsQuery.data ?? [], [tenantsQuery.data]);
  const branches = useMemo(
    () =>
      branchesQuery.data ??
      authQuery.data?.availableBranches.map((branch) => ({
        id: branch.id,
        tenantId: branch.tenantId,
        name: branch.name,
        city: branch.location,
        manager: "Pendiente",
        employees: 0,
        status: "active" as const,
      })) ??
      [],
    [authQuery.data?.availableBranches, branchesQuery.data],
  );
  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);

  useEffect(() => {
    if (!authContext) return;

    queueMicrotask(() => {
      setSession({
        token: getStoredSession()?.token ?? "",
        tenantId: authContext.user.tenantId,
        userId: authContext.user.id,
        role: authContext.role,
      });
      setCurrentUserIdState(authContext.user.id);
      setCurrentBranchIdState((previous) => previous || authContext.activeBranchId || "");
      setCurrentTenantIdState((previous) => previous || getStoredTenantId() || authContext.user.tenantId);
    });
  }, [authContext]);

  useEffect(() => {
    if (!authQuery.error) return;
    clearStoredAuth();
    if (process.env.NEXT_PUBLIC_STATIC_HOSTING !== "true") {
      void fetch("/api/session", { method: "DELETE" });
    }
    queueMicrotask(() => {
      setSession(null);
      setCurrentTenantIdState("");
      setCurrentBranchIdState("");
      setCurrentUserIdState("");
    });
  }, [authQuery.error]);

  const currentTenant =
    tenants.find((tenant) => tenant.id === currentTenantId) ??
    (authContext && (authContext.tenant.id === currentTenantId || authContext.tenant.id === session?.tenantId)
      ? authContext.tenant
      : null) ??
    getFallbackTenant(tenants) ??
    ({
      id: "",
      slug: "",
      name: "Sin empresa disponible",
      plan: "starter",
      status: "suspended",
      enabledModules: [],
      branding: {
        accent: "#0EA5B7",
        supportEmail: "",
      },
    } satisfies TenantDto);

  const tenantBranches = useMemo(
    () => branches.filter(
      (branch) =>
        branch.tenantId === currentTenant.id &&
        (!authContext || authContext.allowedBranchIds.includes(branch.id)),
    ),
    [authContext, branches, currentTenant.id],
  );

  const tenantUsers = useMemo(
    () => users.filter((user) => user.tenantId === currentTenant.id),
    [currentTenant.id, users],
  );

  useEffect(() => {
    if (tenantBranches.length === 0) {
      persistSelectedBranchId("");
      queueMicrotask(() => setCurrentBranchIdState(""));
      return;
    }

    const branchStillVisible = tenantBranches.some((branch) => branch.id === currentBranchId);
    if (!branchStillVisible) {
      const fallbackBranchId = tenantBranches[0]?.id ?? "";
      persistSelectedBranchId(fallbackBranchId);
      queueMicrotask(() => setCurrentBranchIdState(fallbackBranchId));
    }
  }, [currentBranchId, tenantBranches]);

  const currentBranch = useMemo(
    () => tenantBranches.find((branch) => branch.id === currentBranchId) ?? tenantBranches[0] ?? null,
    [currentBranchId, tenantBranches],
  );

  const currentUser = authContext?.user ??
    tenantUsers.find((user) => user.id === currentUserId) ??
    tenantUsers[0] ??
    ({
      id: "",
      fullName: "Sin usuario activo",
      email: "",
      role: "empleado",
      tenantId: currentTenant.id,
      status: "suspended",
    } satisfies UserDto);

  const currentRole = authContext?.role ?? currentUser.role;
  const accessContextVerified = Boolean(authContext && session?.token);
  const currentSubscriptionStatus: SubscriptionAccessState =
    authContext?.subscriptionStatus ?? currentTenant.status ?? "suspended";
  const subscriptionGraceEndsAt = authContext?.subscriptionGraceEndsAt ?? null;
  const allowedTenantIds = useMemo(
    () => authContext?.allowedTenantIds ?? (session?.tenantId ? [session.tenantId] : []),
    [authContext?.allowedTenantIds, session],
  );
  const currentPermissions = useMemo(() => authContext?.permissions ?? [], [authContext?.permissions]);
  const currentFeatures = useMemo(() => authContext?.featureFlags ?? [], [authContext?.featureFlags]);
  const currentModules = useMemo(
    () => authContext?.tenant.id === currentTenant.id
      ? authContext.enabledModules
      : currentTenant.enabledModules,
    [authContext, currentTenant.enabledModules, currentTenant.id],
  );
  const isBootstrapping =
    !hasHydratedSession ||
    (Boolean(session?.token) &&
      (authQuery.isLoading || tenantsQuery.isLoading || branchesQuery.isLoading || usersQuery.isLoading));

  const can = useCallback(
    (permission: PermissionKey) => currentRole === "admin_saas" || currentPermissions.includes(permission),
    [currentPermissions, currentRole],
  );
  const canAny = useCallback((permissions: PermissionKey[]) => permissions.some(can), [can]);
  const canAll = useCallback((permissions: PermissionKey[]) => permissions.every(can), [can]);

  const hasModule = useCallback(
    (module: ModuleKey) => currentModules.includes(module),
    [currentModules],
  );
  const hasFeature = useCallback((featureFlag: string) => currentFeatures.includes(featureFlag), [currentFeatures]);
  const canAccessBranch = useCallback(
    (branchId: string) => currentRole === "admin_saas" || Boolean(branchId && authContext?.allowedBranchIds.includes(branchId)),
    [authContext?.allowedBranchIds, currentRole],
  );

  const allowedNav = useMemo(
    () =>
      appNavigation.filter((item) => item.showInNavigation !== false && evaluateRouteAccess(item, {
        sessionValid: accessContextVerified,
        globalContext: isGlobalSuperAdmin,
        tenantAllowed: accessContextVerified && (currentRole === "admin_saas" || allowedTenantIds.includes(currentTenant.id)),
        subscriptionStatus: currentRole === "admin_saas" ? "active" : currentSubscriptionStatus,
        role: currentRole,
        hasModule,
        hasFeature,
        can,
        branchAvailable: Boolean(currentBranch),
      }).allowed),
    [accessContextVerified, allowedTenantIds, can, currentBranch, currentRole, currentSubscriptionStatus, currentTenant.id, hasFeature, hasModule, isGlobalSuperAdmin],
  );

  const refreshSession = useCallback(async () => {
    await authQuery.refetch();
    await tenantsQuery.refetch();
  }, [authQuery, tenantsQuery]);

  const signOut = useCallback(async () => {
    await logoutCurrentSession();
    setSession(null);
    setCurrentTenantIdState("");
    setCurrentBranchIdState("");
    setCurrentUserIdState("");
  }, []);

  const value = useMemo<AppState>(
    () => ({
      tenants,
      branches,
      tenantBranches,
      users,
      tenantUsers,
      session,
      currentTenant,
      currentBranch,
      currentUser,
      currentRole,
      currentSubscriptionStatus,
      subscriptionGraceEndsAt,
      allowedTenantIds,
      isBootstrapping,
      accessContextVerified,
      impersonation: authContext?.impersonation ?? null,
      setCurrentTenantId: async (tenantId: string) => {
        if (!accessContextVerified || currentRole !== "admin_plataforma" || !can("platform.tenant.switch") || !allowedTenantIds.includes(tenantId)) return;
        await updateTenantContext(tenantId);
        persistSelectedTenantId(tenantId);
        persistSelectedBranchId("");
        setCurrentBranchIdState("");
        setCurrentTenantIdState(tenantId);
      },
      setCurrentBranchId: async (branchId: string) => {
        if (currentRole === "admin_saas" || !tenantBranches.some((branch) => branch.id === branchId)) return;
        await updateBranchContext(branchId);
        persistSelectedBranchId(branchId);
        setCurrentBranchIdState(branchId);
      },
      setCurrentUserId: (userId: string) => {
        setCurrentUserIdState(userId);
      },
      refreshSession,
      signOut,
      can,
      canAny,
      canAll,
      hasModule,
      hasFeature,
      canAccessBranch,
      allowedNav,
    }),
    [
      accessContextVerified,
      allowedNav,
      allowedTenantIds,
      authContext?.impersonation,
      branches,
      can,
      canAny,
      canAll,
      canAccessBranch,
      currentBranch,
      currentRole,
      currentSubscriptionStatus,
      currentTenant,
      currentUser,
      hasModule,
      hasFeature,
      isBootstrapping,
      refreshSession,
      session,
      signOut,
      subscriptionGraceEndsAt,
      tenantBranches,
      tenantUsers,
      tenants,
      users,
    ],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const context = useContext(AppStoreContext);

  if (!context) {
    throw new Error("useAppStore must be used within AppStoreProvider");
  }

  return context;
}
