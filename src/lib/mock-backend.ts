import type {
  AppDatasetsDto,
  BranchDto,
  CandidateDto,
  InventoryItemDto,
  ModuleAssignmentDto,
  ModuleKey,
  RoleDefinitionDto,
  RoleKey,
  SessionDto,
  SubscriptionDto,
  TenantDto,
  UserDto,
  VacancyDto,
} from "@/lib/contracts";
import {
  alerts,
  appNavigation,
  candidates,
  dashboardKpis,
  mockBranches,
  mockModuleAssignments,
  mockRoleDefinitions,
  mockSession,
  mockSubscriptions,
  mockTenants,
  mockUsers,
  pipelineStages,
  reports,
  rolePermissions,
  inventoryRows,
  jobs,
} from "@/lib/mock-data";

const wait = (ms = 160) => new Promise((resolve) => setTimeout(resolve, ms));
const makeId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

let tenantsDb: TenantDto[] = structuredClone(mockTenants);
let usersDb: UserDto[] = structuredClone(mockUsers);
let branchesDb: BranchDto[] = structuredClone(mockBranches);
let roleDefinitionsDb: RoleDefinitionDto[] = structuredClone(mockRoleDefinitions);
let subscriptionsDb: SubscriptionDto[] = structuredClone(mockSubscriptions);
let moduleAssignmentsDb: ModuleAssignmentDto[] = structuredClone(mockModuleAssignments);
let vacanciesDb: VacancyDto[] = structuredClone(jobs);
const candidatesDb: CandidateDto[] = structuredClone(candidates);
const inventoryDb: InventoryItemDto[] = structuredClone(inventoryRows);

function getTenantById(tenantId: string): TenantDto {
  return tenantsDb.find((tenant) => tenant.id === tenantId) ?? tenantsDb[0];
}

function getUserByEmail(email: string): UserDto {
  return usersDb.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? usersDb[0];
}

export async function authenticateUser(email: string): Promise<SessionDto> {
  await wait();
  const matchedUser = getUserByEmail(email);

  return {
    token: "mock-jwt-token",
    tenantId: matchedUser.tenantId,
    userId: matchedUser.id,
    role: matchedUser.role,
  };
}

export async function fetchNavigationSchema(tenantId: string, role: RoleKey) {
  await wait();
  const tenant = getTenantById(tenantId);
  const permissions = rolePermissions[role];

  return appNavigation.filter(
    (item) =>
      tenant.enabledModules.includes(item.module) && permissions.includes(item.permission),
  );
}

export async function fetchWorkspaceDatasets(tenantId: string): Promise<AppDatasetsDto> {
  await wait();
  const tenant = getTenantById(tenantId);

  if (tenant.id === "tenant-2") {
    return {
      vacancies: vacanciesDb.filter((vacancy) => ["Orlando, FL", "Tampa, FL"].includes(vacancy.location)),
      candidates: candidatesDb.filter((candidate) =>
        ["Talent Acquisition Specialist", "Onboarding Coordinator"].includes(candidate.role),
      ),
      inventory: inventoryDb.filter((item) => item.location === "Tampa, FL"),
    };
  }

  if (tenant.id === "tenant-3") {
    return {
      vacancies: vacanciesDb.filter((vacancy) => vacancy.location === "Jacksonville, FL"),
      candidates: candidatesDb.filter((candidate) => candidate.role === "Warehouse Operations Supervisor"),
      inventory: inventoryDb.filter((item) => item.location === "Jacksonville, FL"),
    };
  }

  return {
    vacancies: vacanciesDb,
    candidates: candidatesDb,
    inventory: inventoryDb,
  };
}

export async function fetchDashboardSummary(tenantId: string) {
  await wait();
  return {
    kpis: dashboardKpis,
    alerts,
    pipeline: pipelineStages,
    reports,
    totals: {
      vacancies: vacanciesDb.length,
      candidates: candidatesDb.length,
      inventory: inventoryDb.length,
      tenantId,
    },
  };
}

export async function fetchVacancies(tenantId: string): Promise<VacancyDto[]> {
  await wait();
  const tenant = getTenantById(tenantId);
  if (tenant.id === "tenant-2") {
    return vacanciesDb.filter((vacancy) => ["Orlando, FL", "Tampa, FL"].includes(vacancy.location));
  }
  if (tenant.id === "tenant-3") {
    return vacanciesDb.filter((vacancy) => vacancy.location === "Jacksonville, FL");
  }
  return vacanciesDb;
}

export async function createVacancy(input: Omit<VacancyDto, "id">) {
  await wait();
  const newVacancy: VacancyDto = { ...input, id: makeId("vac") };
  vacanciesDb = [newVacancy, ...vacanciesDb];
  return newVacancy;
}

export async function updateVacancy(id: string, input: Omit<VacancyDto, "id">) {
  await wait();
  vacanciesDb = vacanciesDb.map((vacancy) => (vacancy.id === id ? { ...vacancy, ...input } : vacancy));
  return vacanciesDb.find((vacancy) => vacancy.id === id)!;
}

export async function deleteVacancy(id: string) {
  await wait();
  vacanciesDb = vacanciesDb.filter((vacancy) => vacancy.id !== id);
  return { id };
}

export async function fetchCandidates(tenantId: string): Promise<CandidateDto[]> {
  await wait();
  if (tenantId === "tenant-2") {
    return candidatesDb.filter((candidate) =>
      ["Talent Acquisition Specialist", "Onboarding Coordinator"].includes(candidate.role),
    );
  }
  if (tenantId === "tenant-3") {
    return candidatesDb.filter((candidate) => candidate.role === "Warehouse Operations Supervisor");
  }
  return candidatesDb;
}

export async function fetchInventory(tenantId: string): Promise<InventoryItemDto[]> {
  await wait();
  if (tenantId === "tenant-2") {
    return inventoryDb.filter((item) => item.location === "Tampa, FL");
  }
  if (tenantId === "tenant-3") {
    return inventoryDb.filter((item) => item.location === "Jacksonville, FL");
  }
  return inventoryDb;
}

export async function fetchTenantUsers(tenantId: string): Promise<UserDto[]> {
  await wait();
  return usersDb.filter((user) => user.tenantId === tenantId);
}

export async function fetchUsers(): Promise<UserDto[]> {
  await wait();
  return usersDb;
}

export async function createTenantUser(input: Omit<UserDto, "id">) {
  await wait();
  const user: UserDto = { ...input, id: makeId("user") };
  usersDb = [user, ...usersDb];
  return user;
}

export async function updateTenantUser(id: string, input: Omit<UserDto, "id">) {
  await wait();
  usersDb = usersDb.map((user) => (user.id === id ? { ...user, ...input } : user));
  return usersDb.find((user) => user.id === id)!;
}

export async function deleteTenantUser(id: string) {
  await wait();
  usersDb = usersDb.filter((user) => user.id !== id);
  return { id };
}

export async function fetchTenants() {
  await wait();
  return tenantsDb;
}

export async function createTenant(input: Omit<TenantDto, "id">) {
  await wait();
  const tenant: TenantDto = { ...input, id: makeId("tenant") };
  tenantsDb = [tenant, ...tenantsDb];
  subscriptionsDb = [
    {
      id: makeId("sub"),
      tenantId: tenant.id,
      plan: tenant.plan,
      billingCycle: "monthly",
      status: tenant.status === "trial" ? "trial" : "active",
      price: tenant.plan === "enterprise" ? 3000 : tenant.plan === "growth" ? 600 : 199,
      renewalDate: "2026-08-01",
    },
    ...subscriptionsDb,
  ];
  moduleAssignmentsDb = [
    ...moduleAssignmentsDb,
    ...(["dashboard", "ats", "onboarding", "training", "productivity", "inventory", "admin", "reports", "notifications", "profile"] as ModuleKey[]).map(
      (module) => ({
        id: `${tenant.id}-${module}`,
        tenantId: tenant.id,
        module,
        enabled: tenant.enabledModules.includes(module),
        source: tenant.enabledModules.includes(module) ? ("plan" as const) : ("manual" as const),
      }),
    ),
  ];
  return tenant;
}

export async function updateTenant(id: string, input: Omit<TenantDto, "id">) {
  await wait();
  tenantsDb = tenantsDb.map((tenant) => (tenant.id === id ? { ...tenant, ...input } : tenant));
  moduleAssignmentsDb = moduleAssignmentsDb.map((item) =>
    item.tenantId === id
      ? { ...item, enabled: input.enabledModules.includes(item.module) }
      : item,
  );
  return tenantsDb.find((tenant) => tenant.id === id)!;
}

export async function deleteTenant(id: string) {
  await wait();
  tenantsDb = tenantsDb.filter((tenant) => tenant.id !== id);
  branchesDb = branchesDb.filter((branch) => branch.tenantId !== id);
  usersDb = usersDb.filter((user) => user.tenantId !== id);
  subscriptionsDb = subscriptionsDb.filter((subscription) => subscription.tenantId !== id);
  moduleAssignmentsDb = moduleAssignmentsDb.filter((module) => module.tenantId !== id);
  roleDefinitionsDb = roleDefinitionsDb.filter((role) => role.tenantId !== id);
  return { id };
}

export async function fetchBranches(tenantId?: string) {
  await wait();
  return tenantId ? branchesDb.filter((branch) => branch.tenantId === tenantId) : branchesDb;
}

export async function createBranch(input: Omit<BranchDto, "id">) {
  await wait();
  const branch: BranchDto = { ...input, id: makeId("branch") };
  branchesDb = [branch, ...branchesDb];
  return branch;
}

export async function updateBranch(id: string, input: Omit<BranchDto, "id">) {
  await wait();
  branchesDb = branchesDb.map((branch) => (branch.id === id ? { ...branch, ...input } : branch));
  return branchesDb.find((branch) => branch.id === id)!;
}

export async function deleteBranch(id: string) {
  await wait();
  branchesDb = branchesDb.filter((branch) => branch.id !== id);
  return { id };
}

export async function fetchRoleDefinitions(tenantId: string) {
  await wait();
  return roleDefinitionsDb.filter((role) => role.tenantId === tenantId);
}

export async function createRoleDefinition(input: Omit<RoleDefinitionDto, "id">) {
  await wait();
  const role: RoleDefinitionDto = { ...input, id: makeId("role") };
  roleDefinitionsDb = [role, ...roleDefinitionsDb];
  return role;
}

export async function updateRoleDefinition(id: string, input: Omit<RoleDefinitionDto, "id">) {
  await wait();
  roleDefinitionsDb = roleDefinitionsDb.map((role) => (role.id === id ? { ...role, ...input } : role));
  return roleDefinitionsDb.find((role) => role.id === id)!;
}

export async function deleteRoleDefinition(id: string) {
  await wait();
  roleDefinitionsDb = roleDefinitionsDb.filter((role) => role.id !== id);
  return { id };
}

export async function fetchSubscriptions() {
  await wait();
  return subscriptionsDb;
}

export async function updateSubscription(id: string, input: Omit<SubscriptionDto, "id">) {
  await wait();
  subscriptionsDb = subscriptionsDb.map((subscription) =>
    subscription.id === id ? { ...subscription, ...input } : subscription,
  );
  return subscriptionsDb.find((subscription) => subscription.id === id)!;
}

export async function createSubscription(input: Omit<SubscriptionDto, "id">) {
  await wait();
  const subscription: SubscriptionDto = { ...input, id: makeId("sub") };
  subscriptionsDb = [subscription, ...subscriptionsDb];
  return subscription;
}

export async function deleteSubscription(id: string) {
  await wait();
  subscriptionsDb = subscriptionsDb.filter((subscription) => subscription.id !== id);
  return { id };
}

export async function fetchModuleAssignments(tenantId?: string) {
  await wait();
  return tenantId
    ? moduleAssignmentsDb.filter((assignment) => assignment.tenantId === tenantId)
    : moduleAssignmentsDb;
}

export async function updateModuleAssignment(id: string, input: Omit<ModuleAssignmentDto, "id">) {
  await wait();
  moduleAssignmentsDb = moduleAssignmentsDb.map((assignment) =>
    assignment.id === id ? { ...assignment, ...input } : assignment,
  );
  const tenant = tenantsDb.find((item) => item.id === input.tenantId);
  if (tenant) {
    const enabled = moduleAssignmentsDb
      .filter((assignment) => assignment.tenantId === input.tenantId && assignment.enabled)
      .map((assignment) => assignment.module);
    tenant.enabledModules = enabled;
  }
  return moduleAssignmentsDb.find((assignment) => assignment.id === id)!;
}

export async function fetchInitialSession() {
  await wait(80);
  return mockSession;
}

export async function sendPasswordReset(email: string) {
  await wait(500);
  return { success: true, email };
}

export async function registerCompany(input: { companyName: string; adminName: string; plan: string }) {
  await wait(600);
  return { success: true, ...input };
}
