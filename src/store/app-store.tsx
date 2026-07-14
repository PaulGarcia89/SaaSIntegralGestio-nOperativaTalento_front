"use client";

import {
  createContext,
  useCallback,
  useContext,
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
  fetchBranches,
  fetchTenants,
  fetchUsers,
  fetchWorkspaceDatasets,
} from "@/lib/mock-backend";
import { appNavigation, mockSession, rolePermissions } from "@/lib/mock-data";
import { getFallbackTenant, getPreferredUserForTenant } from "@/lib/ui-labels";

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
  signIn: (email: string) => void;
  signOut: () => void;
  can: (permission: PermissionKey) => boolean;
  hasModule: (module: ModuleKey) => boolean;
  allowedNav: typeof appNavigation;
};

const AppStoreContext = createContext<AppState | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionDto | null>(mockSession);
  const [currentTenantId, setCurrentTenantIdState] = useState(mockSession.tenantId);
  const [currentUserId, setCurrentUserIdState] = useState(mockSession.userId);
  const [currentBranchId, setCurrentBranchIdState] = useState("");

  const tenantsQuery = useQuery({
    queryKey: ["admin-tenants"],
    queryFn: fetchTenants,
  });
  const branchesQuery = useQuery({
    queryKey: ["branches"],
    queryFn: () => fetchBranches(),
  });
  const usersQuery = useQuery({
    queryKey: ["all-users"],
    queryFn: fetchUsers,
  });
  const datasetsQuery = useQuery({
    queryKey: ["workspace-datasets", currentTenantId],
    queryFn: () => fetchWorkspaceDatasets(currentTenantId),
    enabled: Boolean(currentTenantId),
  });

  const tenants = useMemo(() => tenantsQuery.data ?? [], [tenantsQuery.data]);
  const branches = useMemo(() => branchesQuery.data ?? [], [branchesQuery.data]);
  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);

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

  const currentBranch = useMemo(
    () => tenantBranches.find((branch) => branch.id === currentBranchId) ?? tenantBranches[0] ?? null,
    [currentBranchId, tenantBranches],
  );

  const currentUser = useMemo(
    () =>
      tenantUsers.find((user) => user.id === currentUserId) ??
      users.find((user) => user.id === currentUserId) ??
      tenantUsers[0] ??
      users[0] ??
      ({
        id: "",
        fullName: "Sin usuario activo",
        email: "",
        role: "empleado",
        tenantId: currentTenant.id,
        status: "suspended",
      } satisfies UserDto),
    [currentTenant.id, currentUserId, tenantUsers, users],
  );

  const currentRole = currentUser.role;
  const datasets = useMemo(
    () => datasetsQuery.data ?? { vacancies: [], candidates: [], inventory: [] },
    [datasetsQuery.data],
  );
  const isBootstrapping = tenantsQuery.isLoading || branchesQuery.isLoading || usersQuery.isLoading;

  const syncSession = useCallback(
    (user: UserDto | null) => {
      if (!user) {
        setSession(null);
        setCurrentTenantIdState("");
        setCurrentUserIdState("");
        setCurrentBranchIdState("");
        return;
      }

      const nextBranchId = branches.find((branch) => branch.tenantId === user.tenantId)?.id ?? "";

      setCurrentTenantIdState(user.tenantId);
      setCurrentUserIdState(user.id);
      setCurrentBranchIdState(nextBranchId);
      setSession({
        token: "mock-jwt-token",
        tenantId: user.tenantId,
        userId: user.id,
        role: user.role,
      });
    },
    [branches],
  );

  const can = useCallback(
    (permission: PermissionKey) => rolePermissions[currentRole]?.includes(permission) ?? false,
    [currentRole],
  );

  const hasModule = useCallback(
    (module: ModuleKey) => currentTenant.enabledModules.includes(module),
    [currentTenant.enabledModules],
  );

  const allowedNav = useMemo(
    () => appNavigation.filter((item) => hasModule(item.module) && can(item.permission)),
    [can, hasModule],
  );

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
        const fallbackUser = getPreferredUserForTenant(
          users,
          tenantId,
          currentRole === "admin_saas",
        );
        syncSession(fallbackUser);
      },
      setCurrentBranchId: (branchId: string) => {
        setCurrentBranchIdState(branchId);
      },
      setCurrentUserId: (userId: string) => {
        const matchedUser = users.find((user) => user.id === userId) ?? null;
        syncSession(matchedUser);
      },
      signIn: (email: string) => {
        const matchedUser =
          users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
        syncSession(matchedUser);
      },
      signOut: () => {
        syncSession(null);
      },
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
      session,
      syncSession,
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
