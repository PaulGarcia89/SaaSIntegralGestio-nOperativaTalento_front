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
  AppDatasetsDto,
  BranchDto,
  ModuleKey,
  PermissionKey,
  RoleKey,
  SessionDto,
  TenantDto,
  UserDto,
} from "@/lib/contracts";
import {
  clearStoredAuth,
  fetchBranches,
  fetchCurrentAuthUser,
  fetchTenantUsers,
  fetchTenants,
  fetchWorkspaceDatasets,
  getStoredSession,
  getStoredTenantId,
  logoutCurrentSession,
  mapAuthUserToUi,
  persistSelectedTenantId,
} from "@/lib/backend";
import { appNavigation } from "@/lib/navigation";
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
  datasets: AppDatasetsDto;
  isBootstrapping: boolean;
  setCurrentTenantId: (tenantId: string) => void;
  setCurrentBranchId: (branchId: string) => void;
  setCurrentUserId: (userId: string) => void;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
  can: (permission: PermissionKey) => boolean;
  hasModule: (module: ModuleKey) => boolean;
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
    const storedSession = getStoredSession();
    const storedTenantId = getStoredTenantId();

    setSession(storedSession);
    setCurrentTenantIdState(storedTenantId || storedSession?.tenantId || "");
    setCurrentUserIdState(storedSession?.userId || "");
    setHasHydratedSession(true);
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
    enabled: hasHydratedSession && Boolean(session?.token),
  });

  const branchesQuery = useQuery({
    queryKey: ["branches", currentTenantId],
    queryFn: () => fetchBranches(currentTenantId),
    enabled: hasHydratedSession && Boolean(session?.token && currentTenantId),
  });

  const usersQuery = useQuery({
    queryKey: ["tenant-users", currentTenantId],
    queryFn: () => fetchTenantUsers(currentTenantId),
    enabled: hasHydratedSession && Boolean(session?.token && currentTenantId),
  });

  const datasetsQuery = useQuery({
    queryKey: ["workspace-datasets", currentTenantId],
    queryFn: () => fetchWorkspaceDatasets(currentTenantId),
    enabled: hasHydratedSession && Boolean(session?.token && currentTenantId),
  });

  const authContext = useMemo(
    () => (authQuery.data ? mapAuthUserToUi(authQuery.data) : null),
    [authQuery.data],
  );

  const tenants = useMemo(() => tenantsQuery.data ?? [], [tenantsQuery.data]);
  const branches = useMemo(() => branchesQuery.data ?? [], [branchesQuery.data]);
  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);

  useEffect(() => {
    if (!authContext) return;

    setSession({
      token: getStoredSession()?.token ?? "",
      tenantId: authContext.user.tenantId,
      userId: authContext.user.id,
      role: authContext.role,
    });
    setCurrentUserIdState(authContext.user.id);
    setCurrentTenantIdState((previous) => previous || getStoredTenantId() || authContext.user.tenantId);
  }, [authContext]);

  useEffect(() => {
    if (!authQuery.error) return;
    clearStoredAuth();
    setSession(null);
    setCurrentTenantIdState("");
    setCurrentBranchIdState("");
    setCurrentUserIdState("");
  }, [authQuery.error]);

  const currentTenant =
    tenants.find((tenant) => tenant.id === currentTenantId) ??
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
    () => branches.filter((branch) => branch.tenantId === currentTenant.id),
    [branches, currentTenant.id],
  );

  const tenantUsers = useMemo(
    () => users.filter((user) => user.tenantId === currentTenant.id),
    [currentTenant.id, users],
  );

  useEffect(() => {
    if (tenantBranches.length === 0) {
      setCurrentBranchIdState("");
      return;
    }

    const branchStillVisible = tenantBranches.some((branch) => branch.id === currentBranchId);
    if (!branchStillVisible) {
      setCurrentBranchIdState(tenantBranches[0]?.id ?? "");
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
  const currentPermissions = authContext?.permissions ?? [];
  const currentModules = currentTenant.enabledModules.length > 0
    ? currentTenant.enabledModules
    : authContext?.enabledModules ?? [];
  const datasets = useMemo(
    () => datasetsQuery.data ?? { vacancies: [], candidates: [], inventory: [] },
    [datasetsQuery.data],
  );
  const isBootstrapping =
    !hasHydratedSession ||
    (Boolean(session?.token) &&
      (authQuery.isLoading || tenantsQuery.isLoading || branchesQuery.isLoading || usersQuery.isLoading));

  const can = useCallback(
    (permission: PermissionKey) => currentPermissions.includes(permission),
    [currentPermissions],
  );

  const hasModule = useCallback(
    (module: ModuleKey) => currentModules.includes(module),
    [currentModules],
  );

  const allowedNav = useMemo(
    () =>
      appNavigation.filter((item) => {
        if (!hasModule(item.module) || !can(item.permission)) {
          return false;
        }

        if (item.audience === "saas") {
          return currentRole === "admin_saas";
        }

        if (item.audience === "tenant") {
          return currentRole === "admin_saas" || currentRole === "admin_empresa";
        }

        return true;
      }),
    [can, currentRole, hasModule],
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
      datasets,
      isBootstrapping,
      setCurrentTenantId: (tenantId: string) => {
        persistSelectedTenantId(tenantId);
        setCurrentTenantIdState(tenantId);
      },
      setCurrentBranchId: (branchId: string) => {
        setCurrentBranchIdState(branchId);
      },
      setCurrentUserId: (userId: string) => {
        setCurrentUserIdState(userId);
      },
      refreshSession,
      signOut,
      can,
      hasModule,
      allowedNav,
    }),
    [
      allowedNav,
      branches,
      can,
      currentBranch,
      currentRole,
      currentTenant,
      currentUser,
      datasets,
      hasModule,
      isBootstrapping,
      refreshSession,
      session,
      signOut,
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
