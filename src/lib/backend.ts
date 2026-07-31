"use client";

import type {
  BranchDto,
  ModuleAssignmentDto,
  ModuleKey,
  PermissionKey,
  RoleDefinitionDto,
  RoleKey,
  SessionDto,
  SubscriptionDto,
  SubscriptionAccessState,
  TenantDto,
  UserDto,
  PlanTier,
  PublicApplicationInput,
  PublicApplicationReceipt,
  PublicVacancyDto,
  PublicVacancyListDto,
  CreateVacancyInput,
  VacancyApplicationDto,
  VacancyApplicationListDto,
  UpdateApplicationInput,
  QueueMonitoringDto,
  QueueOverviewDto,
  DeadLetterOverviewDto,
  QueueThroughputDto,
  QueueErrorsByTenantDto,
  TrainingCategoryDto,
  TrainingContentBlockDto,
  TrainingCourseDto,
  TrainingCourseInput,
  TrainingCourseListDto,
  TrainingCourseModuleDto,
  TrainingCourseTransitionInput,
  TrainingLessonDto,
  TrainingAssignmentsListDto,
  LearnerTrainingCourseDto,
  TrainingCertificateDto,
  TrainingQuestionType,
  TrainingQuizAttemptDto,
  TrainingQuizDto,
  TrainingQuizQuestionDto,
  TrainingAnalyticsDto,
  TrainingCompliancePolicyDto,
  VacancySetupDto,
  VacancyStageDto,
  VacancyResponsibleDto,
  RecruitmentInterviewDto,
  ScheduleInterviewInput,
  InterviewRecommendation,
  CandidateSessionDto,
  HireCandidateInput,
  HiringContextDto,
  HiringWorkflowResultDto,
  EmployeeOnboardingDocumentDto,
  EmployeeOnboardingFlowDto,
  EmployeeOnboardingFlowListDto,
  OnboardingContextDto,
  OnboardingOwnerType,
  OnboardingTemplateDto,
  OnboardingTemplateTaskConfigDto,
  ElectronicSignaturePackageDto,
  ElectronicSignatureTemplateDto,
  PublicSigningContextDto,
  SignatureProviderDto,
  NotificationCategory,
  NotificationDeliveryDto,
  NotificationListDto,
  NotificationPreferenceDto,
  OperationalDashboardDto,
  ReportsOverviewDto,
  ReportExportDto,
  PlanAdminDto,
  PlanLimitsDto,
  PlatformModuleDto,
} from "@/lib/contracts";
import { applicationFormSchemaForApi } from "@/lib/application-form";
import { validateOnboardingDocumentFile } from "@/lib/onboarding-document-security";
import { PERMISSION_KEYS } from "@/lib/contracts";
import { authenticateUser as authenticateMockUser } from "@/lib/mock-backend";
import {
  clearStoredAuth,
  getStoredAuth,
  getStoredBranchId,
  getStoredSession,
  getStoredTenantId,
  persistAuth,
  persistSelectedTenantId,
  type AuthSnapshot,
} from "@/lib/auth-storage";
export { clearStoredAuth, getStoredBranchId, getStoredSession, getStoredTenantId, persistSelectedBranchId, persistSelectedTenantId } from "@/lib/auth-storage";
import {
  mockBranches,
  mockTenants,
  mockUsers,
  rolePermissions,
} from "@/lib/mock-data";

const DEFAULT_PRODUCTION_API_URL = "https://saasintegralgestio-noperativatalentoback-production.up.railway.app/api";
const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "production" ? DEFAULT_PRODUCTION_API_URL : "/api")
).replace(/\/$/, "");
const MOCK_BACKEND_ENABLED = process.env.NEXT_PUBLIC_ENABLE_MOCK_BACKEND === "true";
const API_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS ?? "15000");
const STATIC_HOSTING = process.env.NEXT_PUBLIC_STATIC_HOSTING === "true";
const AUTH_API_BASE_URL = STATIC_HOSTING ? API_BASE_URL : "/api";

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
  allowedTenantIds?: string[];
  impersonation?: { active: boolean; tenantId?: string | null; startedAt?: string | null } | null;
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
  isGlobalContext?: boolean;
  roles: string[];
  permissions: string[];
  enabledModules: string[];
  featureFlags?: string[];
  tenantCapabilities?: {
    enabledModules?: string[];
    plan?: {
      code: string;
      name: string;
    } | null;
  };
  subscriptionStatus?: "ACTIVE" | "TRIALING" | "PAST_DUE" | "GRACE_PERIOD" | "SUSPENDED" | "active" | "trial" | "past_due" | "grace_period" | "suspended";
  subscriptionGraceEndsAt?: string | null;
  tenant?: {
    id: string;
    slug: string;
    name: string;
    plan: string;
    enabledModules: string[];
    branding?: {
      accent?: string;
      supportEmail?: string;
      productName?: string | null;
      logoUrl?: string | null;
    };
  };
};

type LoginResponse = {
  user: BackendAuthUser;
  accessToken: string;
  expiresIn?: number;
};

type BackendTenant = {
  id: string;
  name: string;
  slug: string;
  status?: string;
  planCode?: string | null;
  enabledModules?: string[];
  branchCount?: number;
  employeeCount?: number;
  capabilities?: {
    planModules?: string[];
    enabledModules?: string[];
    featureFlags?: Array<{
      id: string;
      moduleCode: string;
      enabled: boolean;
    }>;
  };
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
  description?: string | null;
  limits?: Partial<PlanLimitsDto> | null;
  planModules?: Array<{ module: PlatformModuleDto }>;
  _count?: { subscriptions?: number };
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

type RequestOptions = {
  auth?: boolean;
  authBridge?: boolean;
  retryOnUnauthorized?: boolean;
  tenantId?: string;
  responseType?: "json" | "blob";
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof ApiError)) return error instanceof Error ? error.message : fallback;
  if (error.status === 400) return `La solicitud no es válida. ${error.message}`;
  if (error.status === 401) return "Tu sesión expiró o las credenciales no son correctas.";
  if (error.status === 403) return "No tienes permiso para realizar esta acción.";
  if (error.status === 404) return "No encontramos el recurso solicitado.";
  if (error.status === 409) return `Existe un conflicto con la información actual. ${error.message}`;
  if (error.status === 422) return `Revisa los datos ingresados. ${error.message}`;
  if (error.status === 429) return "Se alcanzó el límite de solicitudes. Espera un momento y vuelve a intentarlo.";
  if (error.status >= 500) return "El servicio no está disponible en este momento. Inténtalo nuevamente.";
  return error.message || fallback;
}

const uiPermissionToBackendCodes: Partial<Record<PermissionKey, string[]>> = {
  "dashboard.view": [],
  "ats.view": ["vacancies.read", "applications.read"],
  "ats.manage": ["vacancies.create", "vacancies.update", "vacancies.delete", "applications.create", "applications.update", "applications.delete"],
  "onboarding.view": ["applications.read"],
  "onboarding.manage": ["applications.update"],
  "training.view": ["training.read"],
  "training.manage": [
    "training.create",
    "training.update",
    "training.delete",
    "training.course.create",
    "training.course.update",
    "training.course.review",
    "training.course.approve",
    "training.course.publish",
    "training.course.archive",
    "training.course.delete",
    "training.assign",
    "training.progress.read",
  ],
  "training.integrations.manage": ["training.integrations.manage"],
  "productivity.view": [],
  "inventory.view": [],
  "inventory.manage": [],
  "admin.view": ["tenants.read"],
  "admin.users": ["users.read", "users.create", "users.update", "users.delete"],
  "admin.roles": ["roles.read", "roles.create", "roles.update", "roles.delete", "permissions.read"],
  "admin.company": ["tenants.read", "tenants.update", "branches.read", "branches.create", "branches.update", "branches.delete", "modules.read", "modules.update"],
  "admin.subscription": ["subscriptions.read", "subscriptions.create", "subscriptions.update", "subscriptions.delete", "plans.read"],
  "reports.view": ["metrics.read"],
  "reports.export": ["applications.export"],
  "notifications.view": [],
  "profile.view": [],
  "platform.tenant.switch": ["platform.tenant.switch"],
  "platform.tenant.impersonate": ["platform.tenant.impersonate"],
  "platform.integrations.manage": ["platform.integrations.manage"],
  "tenants.view": ["tenants.read"],
  "tenants.create": ["tenants.create"],
  "tenants.update": ["tenants.update"],
  "branches.view": ["branches.read"],
  "branches.create": ["branches.create"],
  "branches.update": ["branches.update"],
  "branches.switch": ["branch.switch"],
  "users.view": ["users.read"],
  "users.create": ["users.create"],
  "users.update": ["users.update"],
  "users.assign_roles": ["users.update"],
  "roles.view": ["roles.read"],
  "roles.update": ["roles.update"],
  "permissions.assign": ["roles.update", "permissions.read"],
  "jobs.view": ["vacancies.read"],
  "jobs.create": ["vacancies.create"],
  "jobs.update": ["vacancies.update"],
  "jobs.publish": ["vacancies.update"],
  "candidates.view": ["applications.read"],
  "candidates.update": ["applications.update"],
  "applications.view": ["applications.read"],
  "applications.change_stage": ["applications.update"],
  "interviews.view": ["applications.read"],
  "interviews.schedule": ["applications.update"],
  "interviews.update": ["applications.update"],
  "interviews.evaluate": ["applications.update"],
  "scorecards.view": ["applications.read"],
  "scorecards.complete": ["applications.update"],
  "courses.view": ["training.read"],
  "courses.create": ["training.create"],
  "courses.update": ["training.update"],
  "courses.assign": ["training.update"],
  "assessments.view": ["training.read"],
  "assessments.manage": ["training.update"],
  "assessments.grade": ["training.update"],
  "certificates.view": ["training.read"],
  "certificates.issue": ["training.update"],
  "subscriptions.view": ["subscriptions.read"],
  "subscriptions.manage": ["subscriptions.create", "subscriptions.update", "subscriptions.delete"],
  "audit.view": ["automation.audit.read"],
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

function shouldUseMockBackend(error: unknown) {
  return MOCK_BACKEND_ENABLED && isApiUnavailable(error);
}

function buildMockBackendCodes(permission: PermissionKey): string[] {
  return uiPermissionToBackendCodes[permission] ?? [permission];
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
    roles: [
      user.role === "admin_saas" ? "SUPERADMIN"
      : user.role === "admin_plataforma" ? "PLATFORM_ADMIN"
      : user.role === "admin_empresa" ? "TENANT_ADMIN"
      : user.role === "rrhh" ? "HR_MANAGER"
      : user.role === "reclutador" ? "RECRUITER"
      : user.role === "entrevistador" ? "INTERVIEWER"
      : user.role === "instructor" ? "INSTRUCTOR"
      : user.role === "supervisor" ? "SUPERVISOR"
      : user.role === "encargado_inventario" ? "INVENTORY_MANAGER"
      : user.role === "candidato" ? "CANDIDATE"
      : "EMPLOYEE",
    ],
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

function moduleCodeToModuleKey(code: string): ModuleKey | null {
  switch (code.toUpperCase()) {
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
    case "PRODUCTIVITY":
      return "productivity";
    case "REPORTS":
      return "reports";
    default:
      return null;
  }
}

function planCodeToPlanTier(code?: string | null): PlanTier {
  switch (code?.toUpperCase()) {
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

function normalizeSubscriptionAccessStatus(
  status: BackendAuthUser["subscriptionStatus"],
): SubscriptionAccessState | undefined {
  const normalized = status?.toUpperCase();
  if (normalized === "ACTIVE") return "active";
  if (normalized === "TRIALING" || normalized === "TRIAL") return "trial";
  if (normalized === "PAST_DUE") return "past_due";
  if (normalized === "GRACE_PERIOD") return "grace_period";
  if (normalized === "SUSPENDED") return "suspended";
  return undefined;
}

function roleCodesToRoleKey(roleCodes: string[], isSuperAdmin: boolean): RoleKey {
  if (isSuperAdmin || roleCodes.includes("SUPERADMIN")) return "admin_saas";
  if (roleCodes.includes("PLATFORM_ADMIN") || roleCodes.includes("SAAS_ADMIN")) return "admin_plataforma";
  if (roleCodes.includes("TENANT_ADMIN") || roleCodes.includes("ADMIN")) return "admin_empresa";
  if (roleCodes.includes("HR_MANAGER")) return "rrhh";
  if (roleCodes.includes("RECRUITER")) return "reclutador";
  if (roleCodes.includes("INTERVIEWER")) return "entrevistador";
  if (roleCodes.includes("INSTRUCTOR") || roleCodes.includes("TRAINER")) return "instructor";
  if (roleCodes.includes("SUPERVISOR") || roleCodes.includes("BRANCH_ADMIN")) return "supervisor";
  if (roleCodes.includes("INVENTORY_MANAGER")) return "encargado_inventario";
  if (roleCodes.includes("CANDIDATE")) return "candidato";
  return "empleado";
}

function roleKeyToBackendCode(role: RoleKey) {
  const codes: Record<RoleKey, string> = {
    admin_saas: "SUPERADMIN",
    admin_plataforma: "PLATFORM_ADMIN",
    admin_empresa: "TENANT_ADMIN",
    rrhh: "HR_MANAGER",
    reclutador: "RECRUITER",
    entrevistador: "INTERVIEWER",
    instructor: "INSTRUCTOR",
    supervisor: "SUPERVISOR",
    encargado_inventario: "INVENTORY_MANAGER",
    empleado: "BRANCH_USER",
    candidato: "CANDIDATE",
  };
  return codes[role];
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

  if (isSuperAdmin) {
    PERMISSION_KEYS.forEach((permission) => mapped.add(permission));
  }
  if (hasCode("tenants.read")) mapped.add("tenants.view");
  if (hasCode("training.integrations.manage")) mapped.add("training.integrations.manage");
  if (hasCode("tenants.create")) mapped.add("tenants.create");
  if (hasCode("tenants.update")) mapped.add("tenants.update");
  if (hasCode("branches.read")) mapped.add("branches.view");
  if (hasCode("branches.create")) mapped.add("branches.create");
  if (hasCode("branches.update")) mapped.add("branches.update");
  if (hasCode("branch.switch") || hasCode("branches.switch")) mapped.add("branches.switch");
  if (hasCode("users.read")) mapped.add("users.view");
  if (hasCode("users.create")) mapped.add("users.create");
  if (hasCode("users.update")) {
    mapped.add("users.update");
    mapped.add("users.assign_roles");
  }
  if (hasCode("roles.read")) mapped.add("roles.view");
  if (hasCode("roles.update")) {
    mapped.add("roles.update");
    mapped.add("permissions.assign");
  }
  if (hasCode("vacancies.read")) mapped.add("jobs.view");
  if (hasCode("vacancies.create")) mapped.add("jobs.create");
  if (hasCode("vacancies.update")) {
    mapped.add("jobs.update");
    mapped.add("jobs.publish");
  }
  if (hasCode("applications.read")) {
    mapped.add("applications.view");
    mapped.add("candidates.view");
    mapped.add("interviews.view");
    mapped.add("scorecards.view");
  }
  if (hasCode("applications.update")) {
    mapped.add("applications.change_stage");
    mapped.add("applications.reject");
    mapped.add("applications.hire");
    mapped.add("candidates.update");
    mapped.add("interviews.schedule");
    mapped.add("interviews.update");
    mapped.add("interviews.evaluate");
    mapped.add("scorecards.complete");
  }
  if (hasCode("training.read")) {
    mapped.add("courses.view");
    mapped.add("assessments.view");
    mapped.add("certificates.view");
  }
  if (hasCode("training.create")) mapped.add("courses.create");
  if (hasCode("training.update")) {
    mapped.add("courses.update");
    mapped.add("courses.assign");
    mapped.add("assessments.manage");
    mapped.add("assessments.grade");
    mapped.add("certificates.issue");
  }
  if (hasCode("training.course.read")) mapped.add("courses.view");
  if (hasCode("training.course.create")) mapped.add("courses.create");
  if (hasCode("training.course.update")) mapped.add("courses.update");
  if (hasCode("training.course.review")) mapped.add("courses.review");
  if (hasCode("training.course.approve")) mapped.add("courses.approve");
  if (hasCode("training.course.publish")) mapped.add("courses.publish");
  if (hasCode("training.course.archive")) mapped.add("courses.archive");
  if (hasCode("training.course.delete")) mapped.add("courses.delete");
  if (hasCode("training.assign")) mapped.add("courses.assign");
  if (hasCode("subscriptions.read")) mapped.add("subscriptions.view");
  if (hasCode("subscriptions.create") || hasCode("subscriptions.update") || hasCode("subscriptions.delete")) mapped.add("subscriptions.manage");
  if (hasCode("automation.audit.read") || hasCode("tenants.read")) mapped.add("audit.view");

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
  if (
    hasCode("training.create") ||
    hasCode("training.update") ||
    hasCode("training.delete") ||
    codes.some((code) => code.startsWith("training.course."))
  ) {
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
  if (hasCode("platform.tenant.switch") || hasCode("platform.tenants.switch")) {
    mapped.add("platform.tenant.switch");
  }
  if (hasCode("platform.tenant.impersonate") || hasCode("platform.tenants.impersonate")) {
    mapped.add("platform.tenant.impersonate");
  }
  if (isSuperAdmin || hasCode("platform.integrations.manage")) {
    mapped.add("platform.integrations.manage");
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
    branchCount: tenant.branchCount ?? 0,
    employeeCount: tenant.employeeCount ?? 0,
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

function resolveBranchHeader() {
  return getStoredBranchId();
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

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const abortFromCaller = () => controller.abort(init.signal?.reason);
  init.signal?.addEventListener("abort", abortFromCaller, { once: true });

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new ApiError(
        "La solicitud tardó demasiado. Verifica tu conexión y vuelve a intentarlo.",
        408,
        "REQUEST_TIMEOUT",
      );
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
    init.signal?.removeEventListener("abort", abortFromCaller);
  }
}

async function refreshAccessToken() {
  const storedAuth = getStoredAuth();

  try {
    const response = await fetchWithTimeout(`${AUTH_API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        clearStoredAuth();
        return null;
      }

      return storedAuth;
    }

    const payload = (await response.json()) as LoginResponse;
    const snapshot = buildSessionSnapshot(payload);
    persistAuth(snapshot);
    await establishFrontendSession(snapshot.accessToken);
    return snapshot;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      clearStoredAuth();
      return null;
    }

    return storedAuth;
  }
}

async function establishFrontendSession(accessToken: string) {
  if (STATIC_HOSTING) return;
  const response = await fetchWithTimeout("/api/session", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(MOCK_BACKEND_ENABLED ? { "x-demo-session": "true" } : {}),
    },
  });
  if (!response.ok) {
    throw new ApiError(
      "No fue posible establecer la sesión segura del frontend.",
      response.status,
      "FRONTEND_SESSION_FAILED",
    );
  }
}

export async function restoreCurrentSession() {
  if (MOCK_BACKEND_ENABLED) {
    return getStoredSession();
  }
  const snapshot = await refreshAccessToken();
  return snapshot ? getStoredSession() : null;
}

async function request<T>(path: string, init: RequestInit = {}, options: RequestOptions = {}): Promise<T> {
  const auth = getStoredAuth();
  const headers = new Headers(init.headers);
  const tenantId = resolveTenantHeader(options.tenantId);
  const branchId = resolveBranchHeader();

  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth !== false && auth?.accessToken) {
    headers.set("Authorization", `Bearer ${auth.accessToken}`);
  }

  if (options.auth !== false && tenantId) {
    headers.set("x-tenant-id", tenantId);
  }

  if (options.auth !== false && branchId) {
    headers.set("x-branch-id", branchId);
  }

  const requestBaseUrl = options.authBridge ? AUTH_API_BASE_URL : API_BASE_URL;
  let response = await fetchWithTimeout(`${requestBaseUrl}${path}`, {
    ...init,
    headers,
    credentials: init.credentials ?? "include",
  });

  if (response.status === 401 && options.auth !== false && options.retryOnUnauthorized !== false && auth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers.set("Authorization", `Bearer ${refreshed.accessToken}`);
      response = await fetchWithTimeout(`${requestBaseUrl}${path}`, {
        ...init,
        headers,
        credentials: init.credentials ?? "include",
      });
    }
  }

  if (!response.ok) {
    const payload = await readJsonSafe(response);
    const nestedError =
      typeof payload === "object" &&
      payload &&
      "error" in payload &&
      typeof (payload as { error?: unknown }).error === "object" &&
      (payload as { error?: unknown }).error !== null
        ? ((payload as { error: { message?: string; code?: string; details?: unknown } }).error)
        : null;
    const message =
      nestedError?.message
        ? String(nestedError.message)
        : typeof payload === "object" && payload && "message" in payload
          ? String((payload as { message?: string }).message)
        : `Error ${response.status}`;
    const code = nestedError?.code
      ? String(nestedError.code)
      : typeof payload === "object" && payload && "code" in payload
        ? String((payload as { code?: string }).code)
        : undefined;
    const details = nestedError?.details !== undefined
      ? nestedError.details
      : typeof payload === "object" && payload && "details" in payload
        ? (payload as { details?: unknown }).details
        : undefined;
    throw new ApiError(message, response.status, code, details);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (options.responseType === "blob") {
    return (await response.blob()) as T;
  }

  return (await response.json()) as T;
}

async function fetchBackendPlans() {
  return request<BackendPlan[]>("/plans");
}

function mapAdminPlan(plan: BackendPlan): PlanAdminDto {
  return {
    id: plan.id,
    code: plan.code as PlanAdminDto["code"],
    name: plan.name,
    description: plan.description ?? "",
    priceMonthly: Number(plan.priceMonthly ?? 0),
    priceYearly: Number(plan.priceYearly ?? 0),
    limits: {
      maxUsers: plan.limits?.maxUsers ?? null,
      maxBranches: plan.limits?.maxBranches ?? null,
      maxActiveVacancies: plan.limits?.maxActiveVacancies ?? null,
      maxCourses: plan.limits?.maxCourses ?? null,
      maxAssets: plan.limits?.maxAssets ?? null,
      storageGb: plan.limits?.storageGb ?? null,
    },
    modules: plan.planModules?.map((entry) => entry.module) ?? [],
    subscriptions: plan._count?.subscriptions ?? 0,
  };
}

export async function fetchPlanCatalog() {
  return (await fetchBackendPlans()).map(mapAdminPlan);
}

export function fetchPlatformModulesCatalog() {
  return request<PlatformModuleDto[]>("/modules");
}

export async function createPlan(input: Omit<PlanAdminDto, "id" | "subscriptions" | "modules"> & { moduleIds: string[] }) {
  const result = await request<BackendPlan>("/plans", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return mapAdminPlan(result);
}

export async function updatePlan(id: string, input: Omit<PlanAdminDto, "id" | "subscriptions" | "modules" | "code"> & { code?: PlanAdminDto["code"]; moduleIds: string[] }) {
  const result = await request<BackendPlan>(`/plans/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return mapAdminPlan(result);
}

export function deletePlan(id: string) {
  return request(`/plans/${id}`, { method: "DELETE" });
}

async function fetchPermissionsCatalog(tenantId: string) {
  return request<BackendPermission[]>("/permissions", {}, { tenantId });
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

async function resolvePermissionIdsFromUiPermissions(permissions: PermissionKey[], tenantId: string) {
  const catalog = await fetchPermissionsCatalog(tenantId);
  const backendCodes = new Set<string>();

  for (const permission of permissions) {
    for (const code of uiPermissionToBackendCodes[permission] ?? [permission]) {
      backendCodes.add(code);
    }
  }

  return catalog
    .filter((permission) => backendCodes.has(permission.code))
    .map((permission) => permission.id);
}

async function resolvePlanId(plan: PlanTier) {
  const plans = await fetchBackendPlans();
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
  if (MOCK_BACKEND_ENABLED) {
    return authenticateWithExplicitMock(input.email);
  }
  try {
    const payload = await request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    }, { auth: false, authBridge: true, retryOnUnauthorized: false });

    const snapshot = buildSessionSnapshot(payload);
    persistAuth(snapshot);
    persistSelectedTenantId(snapshot.tenantId);
    await establishFrontendSession(snapshot.accessToken);

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
    if (!shouldUseMockBackend(error)) {
      throw error;
    }
    return authenticateWithExplicitMock(input.email);
  }
}

async function authenticateWithExplicitMock(email: string) {
  const session = await authenticateMockUser(email);
  const authUser = buildMockAuthUser(session.userId);
  const snapshot: AuthSnapshot = {
    accessToken: session.token,
    tenantId: session.tenantId,
    userId: session.userId,
    role: session.role,
  };

  persistAuth(snapshot);
  persistSelectedTenantId(snapshot.tenantId);
  await establishFrontendSession(snapshot.accessToken);

  return {
    session,
    user: mapAuthUserToUi(authUser).user,
    authUser,
  };
}

export async function fetchCurrentAuthUser() {
  try {
    return await request<BackendAuthUser>("/auth/me");
  } catch (error) {
    if (!shouldUseMockBackend(error)) {
      throw error;
    }

    const session = getStoredSession();
    if (!session) {
      throw error;
    }

    return buildMockAuthUser(session.userId);
  }
}

export function updateTenantContext(tenantId: string) {
  return request<BackendAuthUser>("/auth/context/tenant", { method: "PUT", body: JSON.stringify({ tenantId }) });
}

export function updateBranchContext(branchId: string) {
  return request<BackendAuthUser>("/auth/context/branch", { method: "PUT", body: JSON.stringify({ branchId }) });
}

export async function logoutCurrentSession() {
  try {
    await request("/auth/logout", { method: "POST" }, { authBridge: true });
  } catch (error) {
    // Logout must be idempotent: if the session is already invalid/expired,
    // we still clear local auth state and continue the sign-out flow.
    if (!(error instanceof ApiError) || error.status !== 401) {
      throw error;
    }
  } finally {
    clearStoredAuth();
    if (!STATIC_HOSTING) {
      await fetch("/api/session", { method: "DELETE" }).catch(() => undefined);
    }
  }
}

export async function fetchTenants(): Promise<TenantDto[]> {
  try {
    const tenants = await request<BackendTenant[]>("/tenants");
    return tenants.map(mapTenant);
  } catch (error) {
    if (!shouldUseMockBackend(error)) {
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
    if (!shouldUseMockBackend(error)) {
      throw error;
    }

    return tenantId ? mockBranches.filter((branch) => branch.tenantId === tenantId) : mockBranches;
  }
}

export async function fetchBranchesForTenants(tenantIds: string[]): Promise<BranchDto[]> {
  if (tenantIds.length === 0) return [];
  const branches = await Promise.all(tenantIds.map((tenantId) => fetchBranches(tenantId)));
  return branches.flat();
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

export async function deleteBranch(id: string, tenantId: string) {
  await request(`/branches/${id}`, { method: "DELETE" }, { tenantId });
  return { id };
}

export async function fetchTenantUsers(tenantId: string): Promise<UserDto[]> {
  try {
    const users = await request<BackendUser[]>("/users", {}, { tenantId });
    return users.map(mapUser);
  } catch (error) {
    if (!shouldUseMockBackend(error)) {
      throw error;
    }

    return mockUsers.filter((user) => user.tenantId === tenantId);
  }
}

export async function fetchGlobalUsers(): Promise<UserDto[]> {
  const users = await request<BackendUser[]>("/users/global");
  return users.map(mapUser);
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
  const targetRoleCode = roleKeyToBackendCode(input.role);
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
  const targetRoleCode = roleKeyToBackendCode(input.role);
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

export async function deleteTenantUser(id: string, tenantId: string) {
  await request(`/users/${id}`, { method: "DELETE" }, { tenantId });
  return { id };
}

export async function fetchRoleDefinitions(tenantId: string): Promise<RoleDefinitionDto[]> {
  const roles = await fetchRolesForTenant(tenantId);
  return roles.map(mapRole);
}

export async function createRoleDefinition(input: Omit<RoleDefinitionDto, "id">) {
  const permissionIds = await resolvePermissionIdsFromUiPermissions(input.permissions, input.tenantId);
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
  const permissionIds = await resolvePermissionIdsFromUiPermissions(input.permissions, input.tenantId);
  const role = await request<BackendRole>(`/roles/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      name: input.name,
      permissionIds,
    }),
  }, { tenantId: input.tenantId });

  return mapRole(role);
}

export async function deleteRoleDefinition(id: string, tenantId: string) {
  await request(`/roles/${id}`, { method: "DELETE" }, { tenantId });
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
  const tenants = await request<BackendTenant[]>("/tenants");
  const assignmentsByTenant = new Map<string, Map<ModuleKey, ModuleAssignmentDto>>();

  for (const tenant of tenants) {
    const planModules = new Set(tenant.capabilities?.planModules ?? []);
    const enabledModules = new Set(
      tenant.capabilities?.enabledModules ?? tenant.enabledModules ?? [],
    );
    const flagsByCode = new Map(
      (tenant.capabilities?.featureFlags ?? []).map((flag) => [flag.moduleCode, flag]),
    );
    const moduleCodes = new Set([
      ...planModules,
      ...enabledModules,
      ...flagsByCode.keys(),
    ]);
    const modules = new Map<ModuleKey, ModuleAssignmentDto>();

    for (const code of moduleCodes) {
      const moduleKey = moduleCodeToModuleKey(code);
      if (!moduleKey) continue;

      const previous = modules.get(moduleKey);
      const belongsToPlan = planModules.has(code);
      const enabled = enabledModules.has(code) || flagsByCode.get(code)?.enabled === true;
      modules.set(moduleKey, {
        id: previous?.id ?? flagsByCode.get(code)?.id ?? `${tenant.id}-${moduleKey}`,
        tenantId: tenant.id,
        module: moduleKey,
        enabled: Boolean(previous?.enabled || enabled),
        source: previous?.source === "plan" || belongsToPlan ? "plan" : "manual",
      });
    }

    assignmentsByTenant.set(tenant.id, modules);
  }

  return [...assignmentsByTenant.values()].flatMap((modules) => [...modules.values()]);
}

export async function fetchQueueMonitoring(input: {
  from: string;
  to: string;
  tenantId?: string;
  deadLetterLimit?: number;
}): Promise<QueueMonitoringDto> {
  const range = new URLSearchParams({ from: input.from, to: input.to });
  const deadLetter = new URLSearchParams({
    limit: String(input.deadLetterLimit ?? 50),
  });
  if (input.tenantId) {
    range.set("tenantId", input.tenantId);
    deadLetter.set("tenantId", input.tenantId);
  }

  const [overview, deadLetterOverview, throughput, errorsByTenant] = await Promise.all([
    request<QueueOverviewDto>(`/metrics/queue-overview?${range.toString()}`),
    request<DeadLetterOverviewDto>(`/metrics/dead-letter?${deadLetter.toString()}`),
    request<QueueThroughputDto>(`/metrics/throughput-by-domain?${range.toString()}`),
    request<QueueErrorsByTenantDto>(`/metrics/queue-errors-by-tenant?${range.toString()}`),
  ]);

  return {
    overview,
    deadLetter: deadLetterOverview,
    throughput,
    errorsByTenant,
  };
}

export async function updateModuleAssignment(
  _id: string,
  input: Omit<ModuleAssignmentDto, "id">,
) {
  const moduleCodes =
    input.module === "ats"
      ? ["ATS"]
      : input.module === "onboarding"
        ? ["ONBOARDING", "DOCUMENTS"]
        : input.module === "training"
          ? ["TRAINING"]
          : input.module === "inventory"
            ? ["INVENTORY"]
            : input.module === "productivity"
              ? ["AI_PRODUCTIVITY"]
              : input.module === "reports"
                ? ["REPORTS"]
                : [];

  if (moduleCodes.length === 0) {
    return {
      ...input,
      id: `${input.tenantId}-${input.module}`,
    };
  }

  await Promise.all(moduleCodes.map((moduleCode) =>
    request(`/feature-flags/global/${input.tenantId}/${moduleCode}`, {
      method: "PUT",
      body: JSON.stringify({ enabled: input.enabled }),
    }),
  ));

  return {
    ...input,
    id: `${input.tenantId}-${input.module}`,
  };
}

export async function fetchPublicVacancies(search = ""): Promise<PublicVacancyListDto> {
  const query = new URLSearchParams({ page: "1", pageSize: "100" });
  if (search.trim()) query.set("search", search.trim());
  return request<PublicVacancyListDto>(`/public/vacancies?${query.toString()}`, {}, { auth: false, retryOnUnauthorized: false });
}

export function fetchPublicVacancy(vacancyId: string): Promise<PublicVacancyDto> {
  return request<PublicVacancyDto>(`/public/vacancies/${encodeURIComponent(vacancyId)}`, {}, { auth: false, retryOnUnauthorized: false });
}

export function submitPublicApplication(vacancyId: string, input: PublicApplicationInput): Promise<PublicApplicationReceipt> {
  return request<PublicApplicationReceipt>(`/public/vacancies/${encodeURIComponent(vacancyId)}/applications`, {
    method: "POST",
    body: JSON.stringify(input),
  }, { auth: false, retryOnUnauthorized: false });
}

export function createVacancy(
  input: CreateVacancyInput,
  setup?: { stages: VacancyStageDto[]; responsibles: VacancyResponsibleDto[] },
): Promise<VacancySetupDto> {
  return request<VacancySetupDto>("/vacancies", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      stages: setup?.stages,
      responsibles: setup?.responsibles.map(({ userId, role }) => ({ userId, role })),
      applicationFormSchema: applicationFormSchemaForApi(input.applicationFormSchema),
      workMode: input.workMode === "ONSITE" ? "ON_SITE" : input.workMode,
      status: input.status === "PUBLISHED" ? "OPEN" : "PAUSED",
    }),
  });
}

export function fetchVacancies(): Promise<PublicVacancyListDto> {
  return request<PublicVacancyListDto>("/vacancies?page=1&pageSize=100");
}

export function fetchApplications(filters: { search?: string; status?: string; vacancyId?: string; branchId?: string } = {}): Promise<VacancyApplicationListDto> {
  const query = new URLSearchParams({ page: "1", pageSize: "100" });
  Object.entries(filters).forEach(([key, value]) => { if (value) query.set(key, value); });
  return request<VacancyApplicationListDto>(`/applications?${query.toString()}`);
}

export function fetchApplication(applicationId: string): Promise<VacancyApplicationDto> {
  return request<VacancyApplicationDto>(`/applications/${encodeURIComponent(applicationId)}`);
}

export function updateApplication(applicationId: string, input: UpdateApplicationInput): Promise<VacancyApplicationDto> {
  return request<VacancyApplicationDto>(`/applications/${encodeURIComponent(applicationId)}/status`, { method: "PATCH", body: JSON.stringify(input) });
}

export function hireCandidate(input: HireCandidateInput) {
  return request<HiringWorkflowResultDto>("/workflows/hiring", {
    method: "POST",
    body: JSON.stringify({ ...input, sourceModule: "ATS" }),
  });
}

export function fetchHiringContext(applicationId: string) {
  return request<HiringContextDto>(
    `/workflows/hiring/context/${encodeURIComponent(applicationId)}`,
  );
}

export function fetchVacancySetup(vacancyId: string) {
  return request<VacancySetupDto>(`/recruitment/vacancies/${encodeURIComponent(vacancyId)}/setup`);
}

export function replaceVacancyStages(vacancyId: string, stages: VacancyStageDto[]) {
  return request<VacancySetupDto>(`/recruitment/vacancies/${encodeURIComponent(vacancyId)}/stages`, {
    method: "PUT",
    body: JSON.stringify({ stages }),
  });
}

export function replaceVacancyResponsibles(vacancyId: string, responsibles: VacancyResponsibleDto[]) {
  return request<VacancySetupDto>(`/recruitment/vacancies/${encodeURIComponent(vacancyId)}/responsibles`, {
    method: "PUT",
    body: JSON.stringify({ responsibles: responsibles.map(({ userId, role }) => ({ userId, role })) }),
  });
}

export function fetchRecruitmentInterviews(filters: { status?: string; applicationId?: string } = {}) {
  const query = new URLSearchParams();
  if (filters.status) query.set("status", filters.status);
  if (filters.applicationId) query.set("applicationId", filters.applicationId);
  return request<RecruitmentInterviewDto[]>(`/recruitment/interviews?${query.toString()}`);
}

export function scheduleRecruitmentInterview(input: ScheduleInterviewInput) {
  return request<RecruitmentInterviewDto>("/recruitment/interviews", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateRecruitmentInterview(id: string, input: Partial<Pick<RecruitmentInterviewDto, "status" | "timezone" | "startsAt" | "endsAt" | "location" | "meetingUrl" | "notes">>) {
  return request<RecruitmentInterviewDto>(`/recruitment/interviews/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function submitInterviewScorecard(id: string, input: {
  criteria: Record<string, unknown>;
  overallRating: number;
  recommendation: InterviewRecommendation;
  strengths?: string;
  concerns?: string;
  comments?: string;
}) {
  return request(`/recruitment/interviews/${encodeURIComponent(id)}/scorecard`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

const CANDIDATE_SESSION_KEY = "talentos.candidate-session";

function getCandidateAccessToken() {
  if (typeof window === "undefined") return "";
  try {
    return (JSON.parse(sessionStorage.getItem(CANDIDATE_SESSION_KEY) ?? "null") as CandidateSessionDto | null)?.accessToken ?? "";
  } catch {
    return "";
  }
}

async function candidateRequest<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  const token = getCandidateAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetchWithTimeout(`${API_BASE_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    const payload = await readJsonSafe(response);
    const message = typeof payload === "object" && payload && "message" in payload ? String(payload.message) : `Error ${response.status}`;
    throw new ApiError(message, response.status);
  }
  return response.json() as Promise<T>;
}

export async function authenticateCandidate(email: string, password: string, mode: "login" | "register" = "login") {
  const session = await candidateRequest<CandidateSessionDto>(`/candidate-auth/${mode}`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  sessionStorage.setItem(CANDIDATE_SESSION_KEY, JSON.stringify(session));
  return session;
}

export function fetchCandidateApplications() {
  return candidateRequest<VacancyApplicationDto[]>("/candidate/applications");
}

export function submitCandidateApplication(vacancyId: string, input: PublicApplicationInput) {
  return candidateRequest<PublicApplicationReceipt>(`/public/vacancies/${encodeURIComponent(vacancyId)}/applications`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function fetchTrainingCourses(filters: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  scope?: "TENANT" | "GLOBAL";
  categoryId?: string;
} = {}) {
  const query = new URLSearchParams();
  query.set("page", String(filters.page ?? 1));
  query.set("pageSize", String(filters.pageSize ?? 20));
  if (filters.search) query.set("search", filters.search);
  if (filters.status) query.set("status", filters.status);
  if (filters.scope) query.set("scope", filters.scope);
  if (filters.categoryId) query.set("categoryId", filters.categoryId);
  return request<TrainingCourseListDto>(`/training/admin/courses?${query.toString()}`);
}

export function fetchTrainingCourse(courseId: string) {
  return request<TrainingCourseDto>(
    `/training/admin/courses/${encodeURIComponent(courseId)}`,
  );
}

export function fetchTrainingCoursePreview(courseId: string) {
  return request<TrainingCourseDto>(
    `/training/admin/courses/${encodeURIComponent(courseId)}/preview`,
  );
}

export function createTrainingCourse(input: TrainingCourseInput) {
  return request<TrainingCourseDto>("/training/admin/courses", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateTrainingCourse(courseId: string, input: Partial<TrainingCourseInput>) {
  return request<TrainingCourseDto>(
    `/training/admin/courses/${encodeURIComponent(courseId)}`,
    { method: "PATCH", body: JSON.stringify(input) },
  );
}

export function duplicateTrainingCourse(courseId: string, title?: string) {
  return request<TrainingCourseDto>(
    `/training/admin/courses/${encodeURIComponent(courseId)}/duplicate`,
    { method: "POST", body: JSON.stringify({ title }) },
  );
}

export function deleteTrainingCourse(courseId: string) {
  return request<{ deleted: boolean; id: string }>(
    `/training/admin/courses/${encodeURIComponent(courseId)}`,
    { method: "DELETE" },
  );
}

export function transitionTrainingCourse(
  courseId: string,
  action:
    | "submit-review"
    | "return-draft"
    | "approve"
    | "schedule"
    | "publish"
    | "pause"
    | "archive"
    | "retire",
  input: TrainingCourseTransitionInput = {},
) {
  return request<TrainingCourseDto>(
    `/training/admin/courses/${encodeURIComponent(courseId)}/${action}`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function fetchTrainingCategories() {
  return request<TrainingCategoryDto[]>("/training/admin/categories");
}

export function createTrainingCategory(input: {
  name: string;
  description?: string;
  parentCategoryId?: string;
  scope?: "TENANT" | "GLOBAL";
}) {
  return request<TrainingCategoryDto>("/training/admin/categories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function createTrainingCourseModule(
  courseId: string,
  input: { title: string; description?: string; sortOrder?: number },
) {
  return request<TrainingCourseModuleDto>(
    `/training/admin/courses/${encodeURIComponent(courseId)}/modules`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function updateTrainingCourseModule(
  moduleId: string,
  input: { title?: string; description?: string; sortOrder?: number },
) {
  return request<TrainingCourseModuleDto>(
    `/training/admin/modules/${encodeURIComponent(moduleId)}`,
    { method: "PATCH", body: JSON.stringify(input) },
  );
}

export function deleteTrainingCourseModule(moduleId: string) {
  return request<{ deleted: boolean; id: string }>(
    `/training/admin/modules/${encodeURIComponent(moduleId)}`,
    { method: "DELETE" },
  );
}

export function createTrainingLesson(
  moduleId: string,
  input: { title: string; description?: string; estimatedMinutes?: number; sortOrder?: number },
) {
  return request<TrainingLessonDto>(
    `/training/admin/modules/${encodeURIComponent(moduleId)}/lessons`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function updateTrainingLesson(
  lessonId: string,
  input: { title?: string; description?: string; estimatedMinutes?: number; sortOrder?: number },
) {
  return request<TrainingLessonDto>(
    `/training/admin/lessons/${encodeURIComponent(lessonId)}`,
    { method: "PATCH", body: JSON.stringify(input) },
  );
}

export function deleteTrainingLesson(lessonId: string) {
  return request<{ deleted: boolean; id: string }>(
    `/training/admin/lessons/${encodeURIComponent(lessonId)}`,
    { method: "DELETE" },
  );
}

export function createTrainingContentBlock(
  lessonId: string,
  input: {
    type: TrainingContentBlockDto["type"];
    title?: string;
    content?: Record<string, unknown>;
    resourceUrl?: string;
    sortOrder?: number;
  },
) {
  return request<TrainingContentBlockDto>(
    `/training/admin/lessons/${encodeURIComponent(lessonId)}/blocks`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function updateTrainingContentBlock(
  blockId: string,
  input: {
    type?: TrainingContentBlockDto["type"];
    title?: string;
    content?: Record<string, unknown>;
    resourceUrl?: string;
    sortOrder?: number;
  },
) {
  return request<TrainingContentBlockDto>(
    `/training/admin/blocks/${encodeURIComponent(blockId)}`,
    { method: "PATCH", body: JSON.stringify(input) },
  );
}

export function deleteTrainingContentBlock(blockId: string) {
  return request<{ deleted: boolean; id: string }>(
    `/training/admin/blocks/${encodeURIComponent(blockId)}`,
    { method: "DELETE" },
  );
}

export function fetchMyTrainingAssignments(filters: {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
} = {}) {
  const query = new URLSearchParams({
    page: String(filters.page ?? 1),
    pageSize: String(filters.pageSize ?? 20),
  });
  if (filters.status) query.set("status", filters.status);
  if (filters.search) query.set("search", filters.search);
  return request<TrainingAssignmentsListDto>(
    `/training/assignments?${query.toString()}`,
  );
}

export function fetchLearnerTrainingCourse(courseId: string) {
  return request<LearnerTrainingCourseDto>(
    `/training/courses/${encodeURIComponent(courseId)}`,
  );
}

export function updateTrainingLessonProgress(
  lessonId: string,
  completed: boolean,
) {
  return request<{ id: string; isCompleted: boolean; completedAt?: string | null }>(
    `/training/progress/lessons/${encodeURIComponent(lessonId)}`,
    { method: "PATCH", body: JSON.stringify({ completed }) },
  );
}

export function fetchTrainingAdminAssignments(filters: {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
  courseId?: string;
  branchId?: string;
  overdue?: boolean;
} = {}) {
  const query = new URLSearchParams({
    page: String(filters.page ?? 1),
    pageSize: String(filters.pageSize ?? 20),
  });
  if (filters.status) query.set("status", filters.status);
  if (filters.search) query.set("search", filters.search);
  if (filters.courseId) query.set("courseId", filters.courseId);
  if (filters.branchId) query.set("branchId", filters.branchId);
  if (filters.overdue) query.set("overdue", "true");
  return request<TrainingAssignmentsListDto>(
    `/training/admin/assignments?${query.toString()}`,
  );
}

export function createTrainingAssignments(input: {
  courseId: string;
  audience: "USERS" | "ROLES" | "BRANCHES" | "TENANT";
  targetIds?: string[];
  startAt?: string;
  dueAt?: string;
  isRequired?: boolean;
}) {
  return request<{
    course: { id: string; title: string };
    requested: number;
    created: number;
    skipped: number;
  }>("/training/admin/assignments", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deleteTrainingAssignment(assignmentId: string) {
  return request<{ deleted: boolean }>(
    `/training/admin/assignments/${encodeURIComponent(assignmentId)}`,
    { method: "DELETE" },
  );
}

export function fetchTrainingLearningPaths() {
  return request<import("./contracts").TrainingLearningPathDto[]>("/training/admin/learning-paths");
}
export function createTrainingLearningPath(input: { title: string; description?: string; objective?: string; targetAudience?: string; isPublished?: boolean }) {
  return request<import("./contracts").TrainingLearningPathDto>("/training/admin/learning-paths", { method: "POST", body: JSON.stringify(input) });
}
export function addTrainingPathCourse(pathId: string, input: { courseId: string; prerequisiteCourseId?: string; sortOrder?: number; isRequired?: boolean; unlockAfterDays?: number }) {
  return request(`/training/admin/learning-paths/${encodeURIComponent(pathId)}/courses`, { method: "POST", body: JSON.stringify(input) });
}
export function removeTrainingPathCourse(pathId: string, courseId: string) {
  return request(`/training/admin/learning-paths/${encodeURIComponent(pathId)}/courses/${encodeURIComponent(courseId)}`, { method: "DELETE" });
}
export function fetchTrainingOnboardingRules() {
  return request<import("./contracts").TrainingOnboardingRuleDto[]>("/training/admin/learning-paths/onboarding-rules");
}
export function createTrainingOnboardingRule(input: { name: string; onboardingTemplateId?: string; branchId?: string; curriculumId?: string; courseId?: string; jobTitlePattern?: string; roleCode?: string; dueDays: number; isRequired?: boolean }) {
  return request<import("./contracts").TrainingOnboardingRuleDto>("/training/admin/learning-paths/onboarding-rules", { method: "POST", body: JSON.stringify(input) });
}
export function deleteTrainingOnboardingRule(id: string) {
  return request(`/training/admin/learning-paths/onboarding-rules/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function fetchTrainingAssessments() {
  return request<{ items: TrainingQuizDto[] }>("/training/admin/assessments");
}

export function createTrainingAssessment(
  courseId: string,
  input: {
    title: string;
    description?: string;
    passingScore: number;
    maxAttempts?: number;
    timeLimitMinutes?: number;
    shuffleQuestions?: boolean;
  },
) {
  return request<TrainingQuizDto>(
    `/training/admin/courses/${encodeURIComponent(courseId)}/assessments`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function createTrainingAssessmentQuestion(
  quizId: string,
  input: {
    prompt: string;
    questionType: TrainingQuestionType;
    explanation?: string;
    points: number;
    requiresManualGrading?: boolean;
    options: Array<{ label: string; isCorrect: boolean }>;
  },
) {
  return request<TrainingQuizQuestionDto>(
    `/training/admin/assessments/${encodeURIComponent(quizId)}/questions`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function deleteTrainingAssessment(quizId: string) {
  return request<{ deleted: boolean }>(
    `/training/admin/assessments/${encodeURIComponent(quizId)}`,
    { method: "DELETE" },
  );
}

export function startTrainingAssessment(quizId: string) {
  return request<TrainingQuizAttemptDto & { quiz: TrainingQuizDto }>(
    `/training/quizzes/${encodeURIComponent(quizId)}/attempts`,
    { method: "POST" },
  );
}

export function saveTrainingAssessmentAnswer(
  quizId: string,
  attemptId: string,
  input: { questionId: string; optionId?: string; selectedOptionIds?: string[]; textAnswer?: string },
) {
  return request(
    `/training/quizzes/${encodeURIComponent(quizId)}/attempts/${encodeURIComponent(attemptId)}/answers`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function submitTrainingAssessment(quizId: string, attemptId: string) {
  return request<TrainingQuizAttemptDto>(
    `/training/quizzes/${encodeURIComponent(quizId)}/attempts/${encodeURIComponent(attemptId)}/submit`,
    { method: "POST", body: JSON.stringify({}) },
  );
}

export function fetchTrainingAssessmentResults(page = 1) {
  return request<{ items: TrainingQuizAttemptDto[]; total: number; page: number; pageSize: number }>(
    `/training/admin/assessment-results?page=${page}&pageSize=20`,
  );
}

export function gradeTrainingAssessment(
  attemptId: string,
  input: {
    answers: Array<{ answerId: string; awardedPoints: number; feedback?: string }>;
    feedback?: string;
  },
) {
  return request<TrainingQuizAttemptDto>(
    `/training/admin/assessment-attempts/${encodeURIComponent(attemptId)}/grade`,
    { method: "PATCH", body: JSON.stringify(input) },
  );
}

export function fetchMyTrainingCertificates() {
  return request<{ items: TrainingCertificateDto[] }>("/training/certificates");
}

export function fetchTrainingAdminCertificates() {
  return request<{ items: TrainingCertificateDto[] }>("/training/admin/certificates");
}

export function revokeTrainingCertificate(certificateId: string, reason: string) {
  return request<TrainingCertificateDto>(
    `/training/admin/certificates/${encodeURIComponent(certificateId)}/revoke`,
    { method: "POST", body: JSON.stringify({ reason }) },
  );
}

export function fetchTrainingAnalytics(filters: {
  courseId?: string;
  branchId?: string;
  from?: string;
  to?: string;
} = {}) {
  const query = new URLSearchParams();
  if (filters.courseId) query.set("courseId", filters.courseId);
  if (filters.branchId) query.set("branchId", filters.branchId);
  if (filters.from) query.set("from", filters.from);
  if (filters.to) query.set("to", filters.to);
  return request<TrainingAnalyticsDto>(
    `/training/admin/analytics/overview${query.size ? `?${query}` : ""}`,
  );
}

export function fetchTrainingCompliancePolicies() {
  return request<{ items: TrainingCompliancePolicyDto[] }>(
    "/training/admin/analytics/compliance-policies",
  );
}

export function upsertTrainingCompliancePolicy(input: {
  courseId: string;
  isActive?: boolean;
  dueDays: number;
  renewalDays?: number;
  reminderDays: number[];
}) {
  return request<TrainingCompliancePolicyDto>(
    "/training/admin/analytics/compliance-policies",
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function fetchTrainingIntegrations() {
  return request<{
    packages: Array<{ id: string; title: string; version: string; status: string; launchUrl: string; course: { title: string }; _count: { sessions: number } }>;
    xapiStatements: number;
    webhooks: Array<{ id: string; name: string; endpointUrl: string; eventTypes: string[]; isActive: boolean; deliveryReady: boolean; lastStatus?: string | null; lastError?: string | null }>;
    deliveries: Array<{ id: string; eventType: string; status: string; attemptCount: number; responseStatus?: number | null; lastError?: string | null; createdAt: string; deliveredAt?: string | null; webhook: { name: string } }>;
    sessions: Array<{ id: string; title: string; startsAt: string; meetingUrl?: string | null; timeZone: string }>;
    resources: number;
    recommendations: Array<{ id: string; reason: string; status: string }>;
    operations: {
      storage: { driver: string; bucket: string | null; encryption: boolean };
      antivirus: { mode: string; required: boolean };
      limits: { maxUploadBytes: number; tenantQuotaBytes: number; packageLimit: number };
      usage: { bytes: number; packages: number };
      webhooks: { failedDeliveries: number };
    };
  }>("/training/integrations");
}

export function createTrainingWebhook(input: { name: string; endpointUrl: string; eventTypes: string[]; secret: string }) {
  return request("/training/integrations/webhooks", { method: "POST", body: JSON.stringify(input) });
}

export function createTrainingScormPackage(input: { courseId: string; title: string; version: string; launchUrl: string; checksum: string }) {
  return request("/training/integrations/scorm-packages", { method: "POST", body: JSON.stringify(input) });
}

export function uploadTrainingScormPackage(input: { courseId: string; title: string; file: File }) {
  const body = new FormData();
  body.set("courseId", input.courseId);
  body.set("title", input.title);
  body.set("file", input.file);
  return request("/training/integrations/scorm-packages/upload", { method: "POST", body });
}

export function testTrainingWebhooks() {
  return request<{ eventId: string; queued: number }>("/training/integrations/webhooks/test", { method: "POST" });
}

export function retryTrainingWebhookDelivery(id: string) {
  return request<{ queued: boolean }>(`/training/integrations/webhook-deliveries/${encodeURIComponent(id)}/retry`, { method: "POST" });
}

export function createTrainingScormLaunchUrl(id: string) {
  return request<{ url: string }>(`/training/integrations/scorm-packages/${encodeURIComponent(id)}/launch-url`);
}

export function rotateTrainingWebhookSecret(id: string, secret: string) {
  return request(`/training/integrations/webhooks/${encodeURIComponent(id)}/secret`, { method: "PATCH", body: JSON.stringify({ secret }) });
}

export function createTrainingVirtualSession(input: {
  title: string;
  startsAt: string;
  endsAt?: string;
  meetingUrl: string;
  timeZone: string;
  courseId?: string;
}) {
  return request("/training/integrations/sessions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function decideTrainingRecommendation(
  id: string,
  status: "ACCEPTED" | "DISMISSED",
) {
  return request(
    `/training/integrations/recommendations/${encodeURIComponent(id)}/${status}`,
    { method: "PATCH" },
  );
}

export function fetchOnboardingTemplates() {
  return request<OnboardingTemplateDto[]>("/onboarding/templates");
}

export function updateOnboardingTemplateStatus(id: string, input: { isActive?: boolean; isDefault?: boolean }) {
  return request<OnboardingTemplateDto>(`/onboarding/templates/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function fetchOnboardingContext(branchId?: string) {
  const query = branchId ? `?branchId=${encodeURIComponent(branchId)}` : "";
  return request<OnboardingContextDto>(`/onboarding/context${query}`);
}

export function createOnboardingTemplate(input: {
  name: string;
  description?: string;
  isDefault?: boolean;
  tasks: OnboardingTemplateTaskConfigDto[];
}) {
  return request<OnboardingTemplateDto>("/onboarding/templates", { method: "POST", body: JSON.stringify(input) });
}

export function fetchOnboardingFlows(filters: string | { branchId?: string; search?: string; status?: string; page?: number; pageSize?: number } = {}) {
  const normalized = typeof filters === "string" ? { branchId: filters } : filters;
  const query = new URLSearchParams();
  Object.entries(normalized).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  return request<EmployeeOnboardingFlowListDto>(`/onboarding/flows${query.size ? `?${query}` : ""}`);
}

export function applyOnboardingTemplate(flowId: string, templateId: string) {
  return request<EmployeeOnboardingFlowDto>(`/onboarding/flows/${encodeURIComponent(flowId)}/apply-template`, {
    method: "POST",
    body: JSON.stringify({ templateId }),
  });
}

export function updateOnboardingTask(taskId: string, input: {
  status?: string;
  progressPercent?: number;
  dueDate?: string;
  ownerType?: OnboardingOwnerType;
  ownerId?: string | null;
  blockingReason?: string | null;
  title?: string;
  description?: string;
  taskType?: OnboardingTemplateTaskConfigDto["taskType"];
  dependsOnKeys?: string[];
  required?: boolean;
  sortOrder?: number;
}) {
  return request<EmployeeOnboardingFlowDto>(`/onboarding/tasks/${encodeURIComponent(taskId)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function createOnboardingTask(flowId: string, input: OnboardingTemplateTaskConfigDto) {
  return request<EmployeeOnboardingFlowDto>(`/onboarding/flows/${encodeURIComponent(flowId)}/tasks`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function reorderOnboardingTasks(flowId: string, items: Array<{ id: string; sortOrder: number }>) {
  return request<EmployeeOnboardingFlowDto>(`/onboarding/flows/${encodeURIComponent(flowId)}/tasks/reorder`, {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}

export function deleteOnboardingTask(taskId: string) {
  return request<EmployeeOnboardingFlowDto>(`/onboarding/tasks/${encodeURIComponent(taskId)}`, { method: "DELETE" });
}

export async function uploadOnboardingDocument(flowId: string, input: { file: File; taskId?: string; category: string }) {
  const validationError = await validateOnboardingDocumentFile(input.file);
  if (validationError) throw new Error(validationError);

  const body = new FormData();
  body.set("file", input.file);
  body.set("category", input.category);
  if (input.taskId) body.set("taskId", input.taskId);
  return request(`/onboarding/flows/${encodeURIComponent(flowId)}/documents`, { method: "POST", body });
}

export function reviewOnboardingDocument(id: string, status: "APPROVED" | "REJECTED", reason?: string) {
  return request(`/onboarding/documents/${encodeURIComponent(id)}/review`, {
    method: "PATCH",
    body: JSON.stringify({ status, reason }),
  });
}

export async function replaceOnboardingDocument(id: string, file: File) {
  const validationError = await validateOnboardingDocumentFile(file);
  if (validationError) throw new Error(validationError);
  const body = new FormData();
  body.set("file", file);
  return request<EmployeeOnboardingDocumentDto>(`/onboarding/documents/${encodeURIComponent(id)}/replace`, { method: "POST", body });
}

export function updateOnboardingDocumentLifecycle(id: string, expiresAt?: string) {
  return request<EmployeeOnboardingDocumentDto>(`/onboarding/documents/${encodeURIComponent(id)}/lifecycle`, {
    method: "PATCH",
    body: JSON.stringify({ expiresAt }),
  });
}

export function deleteOnboardingDocument(id: string) {
  return request<{ deleted: boolean; id: string }>(`/onboarding/documents/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function completeOnboardingFlow(flowId: string) {
  return request<EmployeeOnboardingFlowDto>(`/onboarding/flows/${encodeURIComponent(flowId)}/complete`, { method: "POST" });
}

export function downloadOnboardingDocument(id: string) {
  return request<Blob>(
    `/onboarding/documents/${encodeURIComponent(id)}/download`,
    {},
    { responseType: "blob" },
  );
}

export function fetchInventoryCatalog() {
  return request<import("./contracts").InventoryCatalogItemDto[]>("/inventory/catalog");
}
export function createInventoryCatalogItem(input: { sku: string; name: string }) {
  return request<import("./contracts").InventoryCatalogItemDto>("/inventory/catalog", { method: "POST", body: JSON.stringify(input) });
}
export function fetchInventoryContext() {
  return request<import("./contracts").InventoryContextDto>("/inventory/context");
}
export function fetchInventoryAssets(filters: { status?: string; branchId?: string; search?: string } = {}) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value) query.set(key, value); });
  return request<import("./contracts").InventoryAssetDto[]>(`/inventory/assets${query.size ? `?${query}` : ""}`);
}
export function fetchInventoryAsset(id: string) {
  return request<import("./contracts").InventoryAssetDto>(`/inventory/assets/${encodeURIComponent(id)}`);
}
export function createInventoryAsset(input: { itemId: string; branchId: string; assetTag: string; serialNumber?: string; condition?: string; notes?: string }) {
  return request<import("./contracts").InventoryAssetDto>("/inventory/assets", { method: "POST", body: JSON.stringify(input) });
}
export function assignInventoryAsset(id: string, input: { employeeId: string; workflowAssignmentId?: string; notes?: string }) {
  return request(`/inventory/assets/${encodeURIComponent(id)}/assign`, { method: "POST", body: JSON.stringify(input) });
}
function inventoryForm(input: { evidence?: File; notes?: string; condition?: string; toBranchId?: string; status?: string }) {
  const body = new FormData();
  if (input.evidence) body.set("evidence", input.evidence);
  if (input.notes) body.set("notes", input.notes);
  if (input.condition) body.set("condition", input.condition);
  if (input.toBranchId) body.set("toBranchId", input.toBranchId);
  if (input.status) body.set("status", input.status);
  return body;
}
export function deliverInventoryAsset(id: string, input: { evidence?: File; notes?: string; condition?: string }) {
  return request(`/inventory/assets/${encodeURIComponent(id)}/deliver`, { method: "POST", body: inventoryForm(input) });
}
export function transferInventoryAsset(id: string, input: { toBranchId: string; evidence?: File; notes?: string; condition?: string }) {
  return request(`/inventory/assets/${encodeURIComponent(id)}/transfer`, { method: "POST", body: inventoryForm(input) });
}
export function requestInventoryReturn(id: string, notes?: string) {
  return request(`/inventory/assets/${encodeURIComponent(id)}/request-return`, { method: "POST", body: JSON.stringify({ notes }) });
}
export function receiveInventoryReturn(id: string, input: { evidence?: File; notes?: string; condition?: string }) {
  return request(`/inventory/assets/${encodeURIComponent(id)}/return`, { method: "POST", body: inventoryForm(input) });
}
export function validateInventoryReturn(id: string, input: { status: string; evidence?: File; notes?: string; condition?: string }) {
  return request(`/inventory/assets/${encodeURIComponent(id)}/validate-return`, { method: "PATCH", body: inventoryForm(input) });
}
export async function downloadInventoryEvidence(id: string, filename: string) {
  const auth = getStoredAuth();
  const headers = new Headers();
  if (auth?.accessToken) headers.set("Authorization", `Bearer ${auth.accessToken}`);
  const tenantId = resolveTenantHeader();
  if (tenantId) headers.set("x-tenant-id", tenantId);
  const response = await fetchWithTimeout(`${API_BASE_URL}/inventory/evidence/${encodeURIComponent(id)}`, { headers, credentials: "include" });
  if (!response.ok) throw new ApiError("No fue posible descargar la evidencia.", response.status);
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function fetchSignatureProviders() {
  return request<SignatureProviderDto[]>("/signatures/providers");
}

export function fetchSignatureTemplates() {
  return request<ElectronicSignatureTemplateDto[]>("/signatures/templates");
}

export function createSignatureTemplate(input: {
  name: string;
  description?: string;
  title: string;
  content: string;
  consentText: string;
  provider: string;
  isDefault?: boolean;
}) {
  return request<ElectronicSignatureTemplateDto>("/signatures/templates", { method: "POST", body: JSON.stringify(input) });
}

export function fetchSignaturePackages() {
  return request<ElectronicSignaturePackageDto[]>("/signatures/packages");
}

export function createSignaturePackage(input: {
  onboardingFlowId: string;
  templateId: string;
  title?: string;
  dueDate?: string;
  participants: Array<{ email: string; fullName: string; roleLabel?: string }>;
}) {
  return request<ElectronicSignaturePackageDto>("/signatures/packages", { method: "POST", body: JSON.stringify(input) });
}

export function sendSignaturePackage(id: string) {
  return request<{ packageId: string; provider: string; signingLinks: Array<{ participantId: string; email: string; url: string }> }>(`/signatures/packages/${encodeURIComponent(id)}/send`, { method: "POST" });
}

export function remindSignaturePackage(id: string) {
  return request<{ packageId: string; provider: string; signingLinks: Array<{ participantId: string; email: string; url: string }> }>(`/signatures/packages/${encodeURIComponent(id)}/remind`, { method: "POST" });
}

export function fetchPublicSigningContext(token: string) {
  return request<PublicSigningContextDto>(`/public/signatures/${encodeURIComponent(token)}`, {}, { auth: false });
}

export function submitPublicSignature(token: string, input: { accepted: boolean; typedName: string }) {
  return request<{ signed: boolean; packageId: string; signedAt: string }>(`/public/signatures/${encodeURIComponent(token)}/consent`, { method: "POST", body: JSON.stringify(input) }, { auth: false });
}

export function fetchNotifications(input?: {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
  category?: NotificationCategory;
  status?: "active" | "archived" | "all";
}) {
  const query = new URLSearchParams({
    page: String(input?.page ?? 1),
    pageSize: String(input?.pageSize ?? 50),
    status: input?.status ?? "active",
  });
  if (input?.unreadOnly) query.set("unreadOnly", "true");
  if (input?.category) query.set("category", input.category);
  return request<NotificationListDto>(`/notifications?${query.toString()}`);
}

export function markNotificationRead(id: string) {
  return request(`/notifications/${encodeURIComponent(id)}/read`, { method: "PATCH" });
}

export function markAllNotificationsRead() {
  return request<{ updated: number }>("/notifications/read-all", { method: "PATCH" });
}

export function archiveNotification(id: string) {
  return request(`/notifications/${encodeURIComponent(id)}/archive`, { method: "PATCH" });
}

export function deleteNotification(id: string) {
  return request(`/notifications/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function fetchNotificationPreferences() {
  return request<NotificationPreferenceDto[]>("/notifications/preferences/me");
}

export function updateNotificationPreference(input: NotificationPreferenceDto) {
  return request<NotificationPreferenceDto>("/notifications/preferences/me", {
    method: "PATCH",
    body: JSON.stringify({
      category: input.category,
      internalEnabled: input.internalEnabled,
      emailEnabled: input.emailEnabled,
      frequency: input.frequency,
      quietHoursStart: input.quietHoursStart || undefined,
      quietHoursEnd: input.quietHoursEnd || undefined,
      timeZone: input.timeZone,
    }),
  });
}

export function fetchNotificationDeliveries(input?: {
  status?: NotificationDeliveryDto["status"];
  channel?: NotificationDeliveryDto["channel"];
}) {
  const query = new URLSearchParams({ page: "1", pageSize: "100" });
  if (input?.status) query.set("status", input.status);
  if (input?.channel) query.set("channel", input.channel);
  return request<{ items: NotificationDeliveryDto[]; total: number }>(
    `/notifications/deliveries?${query.toString()}`,
  );
}

export function retryNotificationDelivery(id: string) {
  return request<NotificationDeliveryDto>(
    `/notifications/deliveries/${encodeURIComponent(id)}/retry`,
    { method: "POST" },
  );
}

export function fetchOperationalDashboard() {
  return request<OperationalDashboardDto>("/dashboard/operational");
}

export type ReportQuery = {
  from?: string;
  to?: string;
  branchId?: string;
  tenantId?: string;
  scope?: "context" | "tenant";
};

function reportQueryString(input: ReportQuery) {
  const query = new URLSearchParams();
  if (input.from) query.set("from", input.from);
  if (input.to) query.set("to", input.to);
  if (input.branchId) query.set("branchId", input.branchId);
  if (input.tenantId) query.set("tenantId", input.tenantId);
  if (input.scope) query.set("scope", input.scope);
  return query.toString();
}

export function fetchReportsOverview(input: ReportQuery) {
  return request<ReportsOverviewDto>(`/reports/overview?${reportQueryString(input)}`);
}

export function fetchReportsExport(input: ReportQuery) {
  return request<ReportExportDto>(`/reports/export?${reportQueryString(input)}`);
}

export function downloadTextFile(file: ReportExportDto) {
  const blob = new Blob([file.content], { type: file.mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function mapAuthUserToUi(authUser: BackendAuthUser): {
  user: UserDto;
  permissions: PermissionKey[];
  enabledModules: ModuleKey[];
  featureFlags: string[];
  role: RoleKey;
  allowedBranchIds: string[];
  allowedTenantIds: string[];
  activeBranchId: string | null;
  subscriptionStatus?: SubscriptionAccessState;
  subscriptionGraceEndsAt: string | null;
  impersonation: { active: boolean; tenantId?: string | null; startedAt?: string | null } | null;
  tenant: TenantDto;
} {
  const enabledModules = deriveEnabledModules(
    authUser.tenant?.enabledModules ?? authUser.enabledModules,
    authUser.isSuperAdmin || authUser.permissions.some((code) => code.startsWith("tenants.") || code.startsWith("users.") || code.startsWith("roles.")),
  );
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
    featureFlags: [
      ...new Set([
        ...(authUser.featureFlags ?? []),
        ...enabledModules.map((module) => `module.${module}`),
      ]),
    ],
    role,
    allowedBranchIds: authUser.allowedBranchIds,
    allowedTenantIds: authUser.allowedTenantIds ?? [authUser.tenantId],
    activeBranchId: authUser.activeBranchId,
    subscriptionStatus: normalizeSubscriptionAccessStatus(authUser.subscriptionStatus),
    subscriptionGraceEndsAt: authUser.subscriptionGraceEndsAt ?? null,
    impersonation: authUser.impersonation ?? null,
    tenant: {
      id: authUser.tenant?.id ?? authUser.tenantId,
      slug: authUser.tenant?.slug ?? authUser.tenantSlug,
      name: authUser.tenant?.name ?? authUser.tenantName,
      plan: planCodeToPlanTier(authUser.tenant?.plan),
      status: normalizeSubscriptionAccessStatus(authUser.subscriptionStatus) === "suspended" ? "suspended" : "active",
      enabledModules,
      branding: {
        accent: authUser.tenant?.branding?.accent ?? "#0EA5B7",
        supportEmail: authUser.tenant?.branding?.supportEmail ?? "",
        productName: authUser.tenant?.branding?.productName ?? undefined,
        logoUrl: authUser.tenant?.branding?.logoUrl ?? undefined,
      },
    },
  };
}
