"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
  useCallback,
} from "react";
import type {
  AppDatasetsDto,
  ModuleKey,
  PermissionKey,
  RoleKey,
  SessionDto,
  TenantDto,
  UserDto,
} from "@/lib/contracts";
import {
  appDatasets,
  appNavigation,
  mockSession,
  mockTenants,
  mockUsers,
  rolePermissions,
} from "@/lib/mock-data";

type AppState = {
  tenants: TenantDto[];
  users: UserDto[];
  session: SessionDto | null;
  currentTenant: TenantDto;
  currentUser: UserDto;
  currentRole: RoleKey;
  datasets: AppDatasetsDto;
  setCurrentTenantId: (tenantId: string) => void;
  setCurrentRole: (role: RoleKey) => void;
  signIn: (email: string) => void;
  signOut: () => void;
  can: (permission: PermissionKey) => boolean;
  hasModule: (module: ModuleKey) => boolean;
  allowedNav: typeof appNavigation;
};

const AppStoreContext = createContext<AppState | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionDto | null>(mockSession);
  const [currentTenantId, setCurrentTenantId] = useState(mockSession.tenantId);
  const [currentRole, setCurrentRole] = useState<RoleKey>(mockSession.role);

  const currentTenant =
    mockTenants.find((tenant) => tenant.id === currentTenantId) ?? mockTenants[0];

  const currentUser = useMemo(() => {
    const fallbackUser =
      mockUsers.find((user) => user.tenantId === currentTenant.id) ?? mockUsers[0];

    return (
      mockUsers.find((user) => user.id === session?.userId && user.tenantId === currentTenant.id) ??
      { ...fallbackUser, role: currentRole }
    );
  }, [currentRole, currentTenant.id, session?.userId]);

  const can = useCallback(
    (permission: PermissionKey) => rolePermissions[currentRole].includes(permission),
    [currentRole],
  );
  const hasModule = useCallback(
    (module: ModuleKey) => currentTenant.enabledModules.includes(module),
    [currentTenant.enabledModules],
  );

  const allowedNav = useMemo(
    () =>
      appNavigation.filter(
        (item) => hasModule(item.module) && can(item.permission),
      ),
    [can, hasModule],
  );

  const datasets = appDatasets[currentTenant.slug] ?? appDatasets[mockTenants[0].slug];

  const value = useMemo<AppState>(
    () => ({
      tenants: mockTenants,
      users: mockUsers,
      session,
      currentTenant,
      currentUser,
      currentRole,
      datasets,
      setCurrentTenantId,
      setCurrentRole,
      signIn: (email: string) => {
        const matchedUser =
          mockUsers.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? mockUsers[0];
        setCurrentTenantId(matchedUser.tenantId);
        setCurrentRole(matchedUser.role);
        setSession({
          token: "mock-jwt-token",
          tenantId: matchedUser.tenantId,
          userId: matchedUser.id,
          role: matchedUser.role,
        });
      },
      signOut: () => {
        setSession(null);
        setCurrentRole("admin_empresa");
      },
      can,
      hasModule,
      allowedNav,
    }),
    [allowedNav, can, currentRole, currentTenant, currentUser, datasets, hasModule, session],
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
