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
  NoCodeAutomationAction,
  NoCodeAutomationCatalogDto,
  NoCodeAutomationCondition,
  NoCodeAutomationExecutionDto,
  NoCodeAutomationExecutionStatus,
  NoCodeAutomationRuleDto,
  NoCodeAutomationOperationsOverviewDto,
  NoCodeAutomationScope,
  NoCodeAutomationSimulationDto,
  NoCodeAutomationTemplateDto,
  NoCodeAutomationTrigger,
  PublicApplicationInput,
  PublicApplicationReceipt,
  PublicTrainingCertificateVerificationDto,
  PublicVacancyDto,
  PublicVacancyListDto,
  CreateVacancyInput,
  VacancyApplicationDto,
  VacancyApplicationListDto,
  UpdateApplicationInput,
  QueueMonitoringDto,
  ProductionIntegrationCertificationDto,
  AtsStorageOperationsDto,
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
  TrainingCourseQualityDto,
  TrainingCoursePilotDto,
  TrainingPilotFeedbackDto,
  TrainingPilotStatus,
  TrainingQualityReviewStatus,
  TrainingQualityReviewType,
  TrainingCompetencyDto,
  TrainingCourseDesignDto,
  TrainingCourseDesignInput,
  TrainingLessonDto,
  TrainingAssignmentsListDto,
  TrainingLaunchAudience,
  TrainingLaunchDto,
  TrainingLaunchListDto,
  TrainingLaunchStatus,
  LearnerTrainingCourseDto,
  TrainingCertificateDto,
  TrainingCertificationPolicyInput,
  TrainingCertificationPolicyResponse,
  TrainingQuestionType,
  TrainingQuestionDifficulty,
  TrainingQuestionBankItemDto,
  TrainingQuizFeedbackMode,
  TrainingQuizAttemptDto,
  TrainingQuizDto,
  TrainingQuizQuestionDto,
  TrainingAnalyticsDto,
  TrainingIntelligenceDto,
  TrainingIntelligenceRecordType,
  TrainingCourseImprovementDto,
  TrainingEffectivenessDto,
  TrainingImprovementPriority,
  TrainingImprovementSource,
  TrainingImprovementStatus,
  TrainingOperationKind,
  TrainingOperationsDto,
  TrainingCompliancePolicyDto,
  VacancySetupDto,
  VacancyStageDto,
  VacancyStageInput,
  VacancyResponsibleDto,
  PersonnelRequisitionDto,
  PersonnelRequisitionInput,
  VacancyChangeEventDto,
  RecruitmentInterviewDto,
  ApplicationInterviewType,
  InterviewScorecardRecordDto,
  HiringDecisionCommitteeDto,
  ScheduleInterviewInput,
  InterviewRecommendation,
  CalendarConnectionDto,
  CalendarProvider,
  InterviewerAvailabilityDto,
  AvailabilitySettingsDto,
  CreateScorecardTemplateInput,
  ScorecardComparisonDto,
  ScorecardContextDto,
  ScorecardResponseDto,
  ScorecardTemplateDto,
  ScorecardCompetencyDto,
  ScorecardEvaluatorAssignmentDto,
  AiCompetencyAssessmentContextDto,
  AiCompetencyAssessmentDto,
  ExternalAssessmentDto,
  HiringManagerApprovalDto,
  EvaluatorCalibrationDto,
  BiasValidationRunDto,
  AtsCommunicationTemplateDto,
  AtsMessageDto,
  CreateAtsCommunicationTemplateInput,
  CandidateSessionDto,
  CandidatePortalProfileDto,
  CandidatePortalOverviewDto,
  CandidatePreboardingDto,
  ParsedResumeDto,
  HireCandidateInput,
  HiringContextDto,
  HiringWorkflowResultDto,
  EmployeeOnboardingDocumentDto,
  EmployeeOnboardingFlowDto,
  EmployeeOnboardingFlowListDto,
  OnboardingContextDto,
  OnboardingAutomationOverviewDto,
  OnboardingAutomationRunDto,
  OnboardingOwnerType,
  OnboardingTemplateDto,
  OnboardingTemplateTaskConfigDto,
  OnboardingLibraryItemDto,
  OnboardingRetentionPolicyDto,
  OnboardingSignatureEvidenceDto,
  OnboardingAnalyticsDto,
  OnboardingPerformanceDto,
  ElectronicSignaturePackageDto,
  ElectronicSignatureTemplateDto,
  PublicSigningContextDto,
  SignatureProviderDto,
  EnterpriseIntegrationDto,
  NotificationCategory,
  NotificationDeliveryDto,
  NotificationListDto,
  NotificationPreferenceDto,
  OperationalDashboardDto,
  ReportsOverviewDto,
  AtsAnalyticsDto,
  ReportExportDto,
  PlanAdminDto,
  PlanLimitsDto,
  PlatformModuleDto,
} from "@/lib/contracts";
import { applicationFormSchemaForApi } from "@/lib/application-form";
import { validateOnboardingDocumentFile } from "@/lib/onboarding-document-security";
import { PERMISSION_KEYS } from "@/lib/contracts";
import { authenticateUser as authenticateMockUser } from "@/lib/mock-backend";
import { deleteTrainingCourse as deleteMockTrainingCourse } from "@/lib/mock-backend";
import {
  bulkCreateEmployees as bulkCreateMockEmployees,
  assignEmployeeBranches as assignMockEmployeeBranches,
  createEmployee as createMockEmployee,
  deleteEmployee as deleteMockEmployee,
  fetchEmployeeDetail as fetchMockEmployeeDetail,
  fetchEmployees as fetchMockEmployees,
  restoreEmployee as restoreMockEmployee,
  transferEmployee as transferMockEmployee,
  updateEmployee as updateMockEmployee,
  updateEmployeeRole as updateMockEmployeeRole,
} from "@/lib/mock-backend";
import {
  clearStoredAuth,
  getStoredAuth,
  getStoredSession,
  persistAuth,
  type AuthSnapshot,
} from "@/lib/auth-storage";
export { clearStoredAuth, getStoredSession } from "@/lib/auth-storage";
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
// Production must always reflect the API. Allowing the mock fallback here can
// render entities that do not exist in PostgreSQL and make destructive actions fail.
const MOCK_BACKEND_ENABLED = process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_ENABLE_MOCK_BACKEND === "true";
const API_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS ?? "15000");
const STATIC_HOSTING = process.env.NEXT_PUBLIC_STATIC_HOSTING === "true";
const AUTH_API_BASE_URL = STATIC_HOSTING ? API_BASE_URL : "/api";

function normalizeSignedAssetUrl(url?: string | null) {
  if (!url) return url;
  try {
    const assetUrl = new URL(url);
    const apiUrl = new URL(
      API_BASE_URL,
      typeof window === "undefined" ? "http://localhost" : window.location.origin,
    );

    if (assetUrl.hostname === "localhost" || assetUrl.hostname === "127.0.0.1") {
      assetUrl.protocol = apiUrl.protocol;
      assetUrl.host = apiUrl.host;
    }

    const apiPathPrefix = apiUrl.pathname.replace(/\/$/, "");
    if (
      apiPathPrefix &&
      assetUrl.pathname.startsWith("/public/ats-files/") &&
      !assetUrl.pathname.startsWith(`${apiPathPrefix}/public/ats-files/`)
    ) {
      assetUrl.pathname = `${apiPathPrefix}${assetUrl.pathname}`;
    }

    return assetUrl.toString();
  } catch {
    return url;
  }
}

function normalizeVacancyImageUrl<T extends { imageUrl?: string | null }>(vacancy: T): T {
  return { ...vacancy, imageUrl: normalizeSignedAssetUrl(vacancy.imageUrl) };
}

// This legacy registration is not backed by the production database. Keep it
// out of administrative selectors until its original data source is reconciled.
const HIDDEN_LEGACY_TENANT_SLUGS = new Set(["superiortech"]);

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
  canAccessGlobalGovernance?: boolean;
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
  preferences?: Record<string, unknown>;
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
  retrySafe?: boolean;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown,
    public readonly requestId?: string,
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

export type CompanyRegistrationRequestInput = {
  companyName: string;
  branchName: string;
  branchLocation: string;
  adminName: string;
  adminEmail: string;
  password: string;
  plan: "BASIC" | "PRO" | "ENTERPRISE";
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  marketingConsent?: boolean;
  idempotencyKey?: string;
};

export type CompanyRegistrationRequestDto = {
  id: string;
  companyName: string;
  branchName: string;
  branchLocation: string;
  adminName: string;
  adminEmail: string;
  plan: "BASIC" | "PRO" | "ENTERPRISE";
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  tenantId?: string | null;
};

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
  "productivity.manage": ["productivity.manage"],
  "inventory.view": [],
  "inventory.manage": [],
  "employees.read": ["employees.read"],
  "employees.create": ["employees.create"],
  "employees.update": ["employees.update"],
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
  "branches.delete": ["branches.delete"],
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
  if (error instanceof ApiError) {
    return error.status === 404 || error.status === 405 || error.status >= 500;
  }

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
    canAccessGlobalGovernance: user.role === "admin_saas" || user.role === "admin_plataforma",
    availableBranches: branches.map((branch) => ({
      id: branch.id,
      tenantId: branch.tenantId,
      name: branch.name,
      location: branch.city,
    })),
    firstName: user.fullName.split(" ")[0] ?? "Usuario",
    lastName: user.fullName.split(" ").slice(1).join(" ") || "Sin apellido",
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
  const hasAdminAccess = isSuperAdmin;

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
  if (hasCode("branches.delete")) mapped.add("branches.delete");
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
  if (hasCode("employees.read")) mapped.add("employees.read");
  if (hasCode("employees.create")) mapped.add("employees.create");
  if (hasCode("employees.update")) mapped.add("employees.update");
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
  if (hasCode("productivity.manage")) {
    mapped.add("productivity.manage");
  }
  if (enabledModules.includes("reports")) {
    mapped.add("reports.view");
  }
  if (hasAdminAccess || hasAny("branches.") || hasAny("users.") || hasAny("roles.") || hasAny("tenants.") || hasAny("modules.") || hasAny("subscriptions.")) {
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
    lastName: parts.slice(1).join(" ") || "Sin apellido",
  };
}

function resolveTenantHeader(explicitTenantId?: string) {
  return explicitTenantId || getStoredAuth()?.tenantId || "";
}

function resolveBranchHeader() {
  return "";
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

function requestId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `web-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function waitForRetry(attempt: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, 250 * 2 ** attempt));
}

async function fetchSafeRead(input: RequestInfo | URL, init: RequestInit, enabled: boolean) {
  const attempts = enabled ? 3 : 1;
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetchWithTimeout(input, init);
      if (![408, 429, 502, 503, 504].includes(response.status) || attempt === attempts - 1) return response;
      await waitForRetry(attempt);
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1) throw error;
      await waitForRetry(attempt);
    }
  }
  throw lastError;
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
  if (!headers.has("x-request-id")) headers.set("x-request-id", requestId());
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
  const isSafeRead = (init.method ?? "GET").toUpperCase() === "GET" && options.retrySafe !== false;
  let response = await fetchSafeRead(`${requestBaseUrl}${path}`, {
    ...init,
    headers,
    credentials: init.credentials ?? "include",
  }, isSafeRead);

  if (response.status === 401 && options.auth !== false && options.retryOnUnauthorized !== false && auth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers.set("Authorization", `Bearer ${refreshed.accessToken}`);
      response = await fetchSafeRead(`${requestBaseUrl}${path}`, {
        ...init,
        headers,
        credentials: init.credentials ?? "include",
      }, isSafeRead);
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
        ? ((payload as { error: { message?: string; code?: string; details?: unknown; requestId?: string } }).error)
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
    const responseRequestId = response.headers.get("x-request-id");
    const errorRequestId = nestedError?.requestId
      ? String(nestedError.requestId)
      : responseRequestId ?? undefined;
    throw new ApiError(message, response.status, code, details, errorRequestId);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (options.responseType === "blob") {
    return (await response.blob()) as T;
  }

  return (await response.json()) as T;
}

export function submitCompanyRegistration(input: CompanyRegistrationRequestInput) {
  return request<CompanyRegistrationRequestDto>("/public/company-registrations", {
    method: "POST",
    body: JSON.stringify(input),
  }, { auth: false, retryOnUnauthorized: false });
}

export function fetchCompanyRegistrationRequests(status?: CompanyRegistrationRequestDto["status"]) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return request<CompanyRegistrationRequestDto[]>(`/admin/company-registrations${query}`);
}

export function approveCompanyRegistrationRequest(id: string, reviewNotes?: string) {
  return request<CompanyRegistrationRequestDto>(`/admin/company-registrations/${encodeURIComponent(id)}/approve`, {
    method: "POST",
    body: JSON.stringify({ reviewNotes }),
  });
}

export function rejectCompanyRegistrationRequest(id: string, reviewNotes: string) {
  return request<CompanyRegistrationRequestDto>(`/admin/company-registrations/${encodeURIComponent(id)}/reject`, {
    method: "POST",
    body: JSON.stringify({ reviewNotes }),
  });
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

export function fetchMyPreferences() {
  return request<Record<string, unknown>>("/auth/preferences");
}

export function updateMyPreference(namespace: string, value: unknown) {
  return request("/auth/preferences/" + encodeURIComponent(namespace), {
    method: "PUT",
    body: JSON.stringify({ value }),
  });
}

export function fetchWorkspaceViews(module: string, screen: string, workspaceKey?: string) {
  const query = new URLSearchParams({ module, screen });
  if (workspaceKey) query.set("workspaceKey", workspaceKey);
  return request<import("./contracts").WorkspaceViewDto[]>(`/auth/workspace-views?${query.toString()}`);
}

export function createWorkspaceView(input: { module: string; screen: string; workspaceKey?: string; name: string; config: Record<string, unknown>; isShared?: boolean; isDefault?: boolean }) {
  return request<import("./contracts").WorkspaceViewDto>("/auth/workspace-views", { method: "POST", body: JSON.stringify(input) });
}

export function updateWorkspaceView(id: string, input: { name: string; config: Record<string, unknown>; isShared?: boolean; isDefault?: boolean }) {
  return request<import("./contracts").WorkspaceViewDto>(`/auth/workspace-views/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(input) });
}

export function deleteWorkspaceView(id: string) {
  return request<{ deleted: boolean }>(`/auth/workspace-views/${encodeURIComponent(id)}`, { method: "DELETE" });
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
    return tenants
      .map(mapTenant)
      .filter((tenant) => !HIDDEN_LEGACY_TENANT_SLUGS.has(tenant.slug.toLowerCase()));
  } catch (error) {
    if (!shouldUseMockBackend(error)) {
      throw error;
    }

    return mockTenants.filter((tenant) => !HIDDEN_LEGACY_TENANT_SLUGS.has(tenant.slug.toLowerCase()));
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

export type EmployeeDirectoryItem = {
  id: string;
  name: string;
  email: string;
  status: string;
  branchAssignments: Array<{ id: string; role: string; isPrimary: boolean; branch: { id: string; name: string } }>;
  documentSummary?: { totalDocuments: number };
};

export type EmployeeDirectoryResponse = {
  data: EmployeeDirectoryItem[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
};

export type CreateEmployeeInput = {
  name: string;
  email: string;
  status?: "ACTIVE" | "INACTIVE" | "TERMINATED";
  primaryBranchId: string;
  primaryRole: string;
};

export type UpdateEmployeeInput = {
  name: string;
  email: string;
  status?: "ACTIVE" | "INACTIVE" | "TERMINATED";
};

export function createEmployee(input: CreateEmployeeInput) {
  return request<EmployeeDirectoryItem>("/employees", {
    method: "POST",
    body: JSON.stringify(input),
  }).catch(async (error) => {
    if (!shouldUseMockBackend(error)) throw error;
    return createMockEmployee(input);
  });
}

export function bulkCreateEmployees(employees: CreateEmployeeInput[]) {
  return request<{ created: number; employees: Array<{ id: string; email: string }> }>("/employees/bulk", {
    method: "POST",
    body: JSON.stringify({ employees }),
  }).catch(async (error) => {
    if (!shouldUseMockBackend(error)) throw error;
    return bulkCreateMockEmployees(employees);
  });
}

export function bulkUpdateEmployeeStatus(input: { employeeIds: string[]; status: "ACTIVE" | "INACTIVE" | "TERMINATED" }) {
  return request<{ updated: EmployeeDirectoryItem[]; previous: Array<{ id: string; name: string; email: string; status: string; jobTitle?: string | null }>; status: string }>("/employees/bulk/status", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function fetchEmployees(input: { search?: string; status?: string; branchId?: string; page?: number; pageSize?: number } = {}) {
  const query = new URLSearchParams();
  if (input.search) query.set("search", input.search);
  if (input.status) query.set("status", input.status);
  if (input.branchId) query.set("branchId", input.branchId);
  if (input.page) query.set("page", String(input.page));
  if (input.pageSize) query.set("pageSize", String(input.pageSize));
  return request<EmployeeDirectoryResponse>(`/employees${query.size ? `?${query}` : ""}`).catch(async (error) => {
    if (!shouldUseMockBackend(error)) throw error;
    return fetchMockEmployees(input);
  });
}

export function updateEmployee(id: string, input: UpdateEmployeeInput) {
  return request<EmployeeDirectoryItem>(`/employees/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  }).catch(async (error) => {
    if (!shouldUseMockBackend(error)) throw error;
    return updateMockEmployee(id, input);
  });
}

export function deleteEmployee(id: string) {
  return request(`/employees/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(async (error) => {
    if (!shouldUseMockBackend(error)) throw error;
    return deleteMockEmployee(id);
  });
}

export function restoreEmployee(id: string) {
  return request(`/employees/${encodeURIComponent(id)}/restore`, { method: "POST" }).catch(async (error) => {
    if (!shouldUseMockBackend(error)) throw error;
    return restoreMockEmployee(id);
  });
}

export function fetchEmployeeDetail(id: string) {
  return request<{
    employee: EmployeeDirectoryItem;
    documents: Array<{ id: string; title: string; status: string; updatedAt: string }>;
    history: Array<{ id: string; title: string; detail: string; at: string }>;
  }>(`/employees/${encodeURIComponent(id)}`).catch(async (error) => {
    if (!shouldUseMockBackend(error)) throw error;
    return fetchMockEmployeeDetail(id);
  });
}

export function transferEmployee(id: string, input: { branchId: string; role?: string }) {
  return request<EmployeeDirectoryItem>(`/employees/${encodeURIComponent(id)}/transfer`, {
    method: "POST",
    body: JSON.stringify(input),
  }).catch(async (error) => {
    if (!shouldUseMockBackend(error)) throw error;
    return transferMockEmployee(id, input);
  });
}

export function updateEmployeeRole(id: string, primaryRole: string) {
  return request<EmployeeDirectoryItem>(`/employees/${encodeURIComponent(id)}/role`, {
    method: "PATCH",
    body: JSON.stringify({ primaryRole }),
  }).catch(async (error) => {
    if (!shouldUseMockBackend(error)) throw error;
    return updateMockEmployeeRole(id, primaryRole);
  });
}

export function assignEmployeeBranches(id: string, branchIds: string[], primaryBranchId?: string, primaryRole?: string) {
  return request<EmployeeDirectoryItem>(`/employees/${encodeURIComponent(id)}/branches`, {
    method: "PUT",
    body: JSON.stringify({ branchIds, primaryBranchId, primaryRole }),
  }).catch(async (error) => {
    if (!shouldUseMockBackend(error)) throw error;
    return assignMockEmployeeBranches(id, branchIds, primaryBranchId, primaryRole);
  });
}

export type PlatformAuditEntry = { id: string; action: string; route?: string | null; branchId?: string | null; userId?: string | null; createdAt: string; metadata?: unknown };
export type PlatformAuditResponse = { items: PlatformAuditEntry[]; total: number; page: number; pageSize: number };

export function fetchPlatformAudit(input: { action?: string; page?: number; pageSize?: number } = {}) {
  const query = new URLSearchParams();
  if (input.action) query.set("action", input.action);
  if (input.page) query.set("page", String(input.page));
  if (input.pageSize) query.set("pageSize", String(input.pageSize));
  return request<PlatformAuditResponse>(`/audit/logs${query.size ? `?${query}` : ""}`);
}

export type BillingOverview = {
  billingCustomer: { provider: string; externalCustomerId: string; email?: string | null; name?: string | null } | null;
  subscription: { status?: string; startsAt?: string; endsAt?: string | null } | null;
  plan: { name?: string; code?: string } | null;
  recentInvoices: Array<{ id: string; number?: string | null; status?: string; amount?: string | number; currency?: string; issuedAt: string; dueAt?: string | null }>;
  enabledModules: string[];
};

export function fetchBillingOverview() { return request<BillingOverview>("/billing/overview"); }
export function fetchBillingInvoices() { return request<BillingOverview["recentInvoices"]>("/billing/invoices"); }

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

export async function fetchProductionIntegrationCertification(
  tenantId?: string,
): Promise<ProductionIntegrationCertificationDto> {
  const query = new URLSearchParams();
  if (tenantId) query.set("tenantId", tenantId);
  const suffix = query.size ? `?${query.toString()}` : "";
  return request<ProductionIntegrationCertificationDto>(`/metrics/integration-certification${suffix}`);
}

export async function runProductionIntegrationCertification(
  tenantId?: string,
): Promise<ProductionIntegrationCertificationDto> {
  return request<ProductionIntegrationCertificationDto>("/metrics/integration-certification/run", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(tenantId ? { tenantId } : {}),
  });
}

export async function fetchAtsStorageOperations(): Promise<AtsStorageOperationsDto> {
  return request<AtsStorageOperationsDto>("/metrics/ats-storage");
}

export async function runAtsStorageMaintenance(): Promise<AtsStorageOperationsDto> {
  return request<AtsStorageOperationsDto>("/metrics/ats-storage/maintenance", {
    method: "POST",
  });
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
  const result = await request<PublicVacancyListDto>(`/public/vacancies?${query.toString()}`, {}, { auth: false, retryOnUnauthorized: false });
  return { ...result, data: result.data.map(normalizeVacancyImageUrl) };
}

export async function fetchPublicVacancy(vacancyId: string): Promise<PublicVacancyDto> {
  return normalizeVacancyImageUrl(await request<PublicVacancyDto>(`/public/vacancies/${encodeURIComponent(vacancyId)}`, {}, { auth: false, retryOnUnauthorized: false }));
}

export function submitPublicApplication(vacancyId: string, input: PublicApplicationInput): Promise<PublicApplicationReceipt> {
  return request<PublicApplicationReceipt>(`/public/vacancies/${encodeURIComponent(vacancyId)}/applications`, {
    method: "POST",
    body: JSON.stringify(input),
  }, { auth: false, retryOnUnauthorized: false });
}

export function createVacancy(
  input: CreateVacancyInput,
  setup?: { stages: VacancyStageInput[]; responsibles: VacancyResponsibleDto[] },
): Promise<VacancySetupDto> {
  const safeInput = { ...input };
  delete safeInput.imageUrl;
  return request<VacancySetupDto>("/vacancies", {
    method: "POST",
    body: JSON.stringify({
      ...safeInput,
      stages: setup?.stages,
      responsibles: setup?.responsibles.map(({ userId, role }) => ({ userId, role })),
      applicationFormSchema: applicationFormSchemaForApi(input.applicationFormSchema),
      workMode: input.workMode === "ONSITE" ? "ON_SITE" : input.workMode,
      status: input.status === "PUBLISHED" ? "OPEN" : input.status === "DRAFT" ? "PAUSED" : input.status,
    }),
  });
}

export function updateVacancy(
  vacancyId: string,
  input: Partial<CreateVacancyInput>,
  setup?: { stages?: VacancyStageInput[]; responsibles?: VacancyResponsibleDto[] },
): Promise<VacancySetupDto> {
  const changes = { ...input };
  delete changes.imageUrl;
  const applicationFormSchema = changes.applicationFormSchema;
  const workMode = changes.workMode;
  const status = changes.status;
  delete changes.applicationFormSchema;
  delete changes.workMode;
  delete changes.status;
  return request<VacancySetupDto>(`/vacancies/${encodeURIComponent(vacancyId)}`, {
    method: "PATCH",
    body: JSON.stringify({
      ...changes,
      // Updating copy or compensation must not replace the pipeline or owners.
      // Those collections are only sent when the user changed them in the wizard.
      ...(setup?.stages !== undefined ? { stages: setup.stages } : {}),
      ...(setup?.responsibles !== undefined
        ? { responsibles: setup.responsibles.map(({ userId, role }) => ({ userId, role })) }
        : {}),
      ...(applicationFormSchema !== undefined ? { applicationFormSchema: applicationFormSchemaForApi(applicationFormSchema) } : {}),
      ...(workMode !== undefined ? { workMode: workMode === "ONSITE" ? "ON_SITE" : workMode } : {}),
      ...(status !== undefined ? { status: status === "PUBLISHED" ? "OPEN" : status === "DRAFT" ? "PAUSED" : status } : {}),
    }),
  });
}

export function cloneVacancy(vacancyId: string, reason?: string) {
  return request<PublicVacancyDto>(`/vacancies/${encodeURIComponent(vacancyId)}/clone`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function archiveVacancy(vacancyId: string, reason: string) {
  return request<PublicVacancyDto>(`/vacancies/${encodeURIComponent(vacancyId)}/archive`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function fetchVacancyHistory(vacancyId: string): Promise<VacancyChangeEventDto[]> {
  return request<VacancyChangeEventDto[]>(`/vacancies/${encodeURIComponent(vacancyId)}/history`);
}

export function fetchPersonnelRequisitions(): Promise<PersonnelRequisitionDto[]> {
  return request<PersonnelRequisitionDto[]>("/vacancies/requisitions/list");
}

export function createPersonnelRequisition(input: PersonnelRequisitionInput): Promise<PersonnelRequisitionDto> {
  return request<PersonnelRequisitionDto>("/vacancies/requisitions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function decidePersonnelRequisition(id: string, approved: boolean, note?: string): Promise<PersonnelRequisitionDto> {
  return request<PersonnelRequisitionDto>(`/vacancies/requisitions/${encodeURIComponent(id)}/${approved ? "approve" : "reject"}`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}

export async function uploadVacancyImage(vacancyId: string, image: File) {
  const body = new FormData();
  body.append("image", image);
  const result = await request<{ id: string; version: number; url: string; expiresAt: string }>(
    `/vacancies/${encodeURIComponent(vacancyId)}/image`,
    { method: "POST", body },
  );
  return { ...result, url: normalizeSignedAssetUrl(result.url) ?? result.url };
}

export async function fetchVacancies(): Promise<PublicVacancyListDto> {
  const result = await request<PublicVacancyListDto>("/vacancies?page=1&pageSize=100");
  return { ...result, data: result.data.map(normalizeVacancyImageUrl) };
}

export function fetchApplications(filters: import("./contracts").ApplicationFilters = {}): Promise<VacancyApplicationListDto> {
  const query = new URLSearchParams({ page: String(filters.page ?? 1), pageSize: String(filters.pageSize ?? 20) });
  Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== "") query.set(key, String(value)); });
  return request<VacancyApplicationListDto>(`/applications?${query.toString()}`);
}

export function fetchTalentCandidates(filters: { search?: string; poolId?: string; tagId?: string; branchId?: string; doNotContact?: boolean; page?: number; pageSize?: number } = {}) {
  const query = new URLSearchParams({ page: String(filters.page ?? 1), pageSize: String(filters.pageSize ?? 20) });
  Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== "") query.set(key, String(value)); });
  return request<import("./contracts").TalentCandidateListDto>(`/talent-crm/candidates?${query.toString()}`);
}

export function fetchTalentCandidate(candidateId: string) {
  return request<import("./contracts").TalentCandidateDto>(`/talent-crm/candidates/${encodeURIComponent(candidateId)}`);
}

export function updateTalentCandidate(candidateId: string, input: { fullName?: string; phone?: string; city?: string; linkedinUrl?: string; portfolioUrl?: string; source?: string; doNotContact?: boolean }) {
  return request<import("./contracts").TalentCandidateDto>(`/talent-crm/candidates/${encodeURIComponent(candidateId)}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function fetchTalentPools() { return request<import("./contracts").TalentPoolDto[]>("/talent-crm/pools"); }
export function createTalentPool(input: { name: string; description?: string; color?: string; branchId?: string }) { return request<import("./contracts").TalentPoolDto>("/talent-crm/pools", { method: "POST", body: JSON.stringify(input) }); }
export function updateTalentPool(poolId: string, input: { name?: string; description?: string; color?: string; isActive?: boolean }) { return request<import("./contracts").TalentPoolDto>(`/talent-crm/pools/${encodeURIComponent(poolId)}`, { method: "PATCH", body: JSON.stringify(input) }); }
export function addCandidateToTalentPool(poolId: string, candidateId: string) { return request<{ added: boolean }>(`/talent-crm/pools/${encodeURIComponent(poolId)}/members`, { method: "POST", body: JSON.stringify({ candidateId }) }); }
export function removeCandidateFromTalentPool(poolId: string, candidateId: string) { return request<{ removed: boolean }>(`/talent-crm/pools/${encodeURIComponent(poolId)}/members/${encodeURIComponent(candidateId)}`, { method: "DELETE" }); }

export function fetchTalentTags() { return request<import("./contracts").TalentTagDto[]>("/talent-crm/tags"); }
export function createTalentTag(input: { name: string; color?: string }) { return request<import("./contracts").TalentTagDto>("/talent-crm/tags", { method: "POST", body: JSON.stringify(input) }); }
export function addTalentTag(candidateId: string, tagId: string) { return request<{ added: boolean }>(`/talent-crm/candidates/${encodeURIComponent(candidateId)}/tags`, { method: "POST", body: JSON.stringify({ tagId }) }); }
export function removeTalentTag(candidateId: string, tagId: string) { return request<{ removed: boolean }>(`/talent-crm/candidates/${encodeURIComponent(candidateId)}/tags/${encodeURIComponent(tagId)}`, { method: "DELETE" }); }

export function createTalentActivity(candidateId: string, input: { type: import("./contracts").TalentActivityType; subject: string; description?: string; dueAt?: string; completed?: boolean }) { return request<import("./contracts").TalentActivityDto>(`/talent-crm/candidates/${encodeURIComponent(candidateId)}/activities`, { method: "POST", body: JSON.stringify(input) }); }
export function fetchDuplicateCandidates(minimumScore = 45) { return request<{ data: import("./contracts").DuplicateCandidateMatchDto[]; scannedCandidates: number; truncated: boolean; ignoredSharedValues: number }>(`/talent-crm/duplicates?minimumScore=${minimumScore}`); }
export function mergeTalentCandidates(input: { sourceCandidateId: string; targetCandidateId: string; reason: string }) { return request<{ auditId: string; sourceCandidateId: string; targetCandidateId: string; movedApplications: number; movedFiles: number }>("/talent-crm/duplicates/merge", { method: "POST", body: JSON.stringify(input) }); }
export function fetchTalentCampaigns() { return request<import("./contracts").TalentCampaignDto[]>("/talent-crm/campaigns"); }
export function fetchTalentSegments() { return request<Array<{ id: string; name: string; description?: string | null; candidateCount: number }>>("/talent-crm/segments"); }
export function createTalentCampaign(input: { segmentId: string; name: string; subject: string; body: string; scheduledAt?: string }) { return request<import("./contracts").TalentCampaignDto>("/talent-crm/campaigns", { method: "POST", body: JSON.stringify(input) }); }
export function prepareTalentCampaignAudience(campaignId: string) { return request<{ campaignId: string; total: number; eligible: number; excluded: number; audienceFingerprint: string }>(`/talent-crm/campaigns/${encodeURIComponent(campaignId)}/audience/prepare`, { method: "POST" }); }
export function fetchTalentCampaignAudience(campaignId: string, page = 1) { return request<import("./contracts").TalentCampaignAudienceDto>(`/talent-crm/campaigns/${encodeURIComponent(campaignId)}/audience?page=${page}&pageSize=20`); }
export function reviewTalentCampaignAudience(campaignId: string, input: { confirm: boolean; audienceFingerprint: string; note?: string }) { return request<import("./contracts").TalentCampaignDto>(`/talent-crm/campaigns/${encodeURIComponent(campaignId)}/audience/review`, { method: "POST", body: JSON.stringify(input) }); }

export function exportApplications(filters: import("./contracts").ApplicationFilters = {}) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== "" && key !== "page" && key !== "pageSize") query.set(key, String(value)); });
  return request<{ generatedAt: string; count: number; data: VacancyApplicationDto[] }>(`/applications/export?${query.toString()}`);
}

export function bulkUpdateApplications(input: { ids: string[]; status?: string; currentStageId?: string; assignedRecruiterId?: string; rejectionReasonId?: string; reason?: string; notes?: string; onlyUnassigned?: boolean; onlyOverdue?: boolean }) {
  return request<{ updated: number; skipped?: number }>("/applications/bulk/status", { method: "PATCH", body: JSON.stringify(input) });
}

export function fetchApplicationSavedViews(): Promise<import("./contracts").ApplicationSavedViewDto[]> {
  return request("/applications/saved-views/list");
}

export function createApplicationSavedView(input: { name: string; filters: import("./contracts").ApplicationFilters; isDefault?: boolean }): Promise<import("./contracts").ApplicationSavedViewDto> {
  return request("/applications/saved-views", { method: "POST", body: JSON.stringify(input) });
}

export function deleteApplicationSavedView(id: string) {
  return request<{ deleted: boolean }>(`/applications/saved-views/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function fetchRejectionReasons(): Promise<import("./contracts").RejectionReasonDto[]> {
  return request("/applications/rejection-reasons/list");
}

export function fetchApplication(applicationId: string): Promise<VacancyApplicationDto> {
  return request<VacancyApplicationDto>(`/applications/${encodeURIComponent(applicationId)}`);
}

export function fetchApplicationDecisionEvidence(applicationId: string) {
  return request<Record<string, unknown>>(`/applications/${encodeURIComponent(applicationId)}/decision-evidence`);
}

export function fetchResumeAccess(applicationId: string) {
  return request<{
    fileId: string;
    version: number;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    url: string;
    expiresAt: string;
  }>(`/applications/${encodeURIComponent(applicationId)}/files/resume`);
}

export function updateApplication(applicationId: string, input: UpdateApplicationInput): Promise<VacancyApplicationDto> {
  return request<VacancyApplicationDto>(`/applications/${encodeURIComponent(applicationId)}/status`, { method: "PATCH", body: JSON.stringify(input) });
}

export function undoApplicationTransition(applicationId: string, expectedUpdatedAt: string): Promise<VacancyApplicationDto> {
  return request<VacancyApplicationDto>(`/applications/${encodeURIComponent(applicationId)}/transitions/undo`, { method: "POST", body: JSON.stringify({ expectedUpdatedAt }) });
}

export function decideApplicationTransition(
  applicationId: string,
  requestId: string,
  approved: boolean,
  note?: string,
): Promise<VacancyApplicationDto> {
  const decision = approved ? "approve" : "reject";
  return request<VacancyApplicationDto>(
    `/applications/${encodeURIComponent(applicationId)}/transitions/${encodeURIComponent(requestId)}/${decision}`,
    { method: "POST", body: JSON.stringify({ note }) },
  );
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

export function fetchRecruitmentInterviews(filters: { status?: string; applicationId?: string; vacancyId?: string; interviewerUserId?: string; branchId?: string; resourceId?: string; startsFrom?: string; startsTo?: string; search?: string; page?: number; pageSize?: number } = {}) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== "") query.set(key, String(value)); });
  if (!query.has("page")) query.set("page", "1");
  if (!query.has("pageSize")) query.set("pageSize", "20");
  return request<import("./contracts").RecruitmentInterviewListDto>(`/recruitment/interviews?${query.toString()}`);
}

export function scheduleRecruitmentInterview(input: ScheduleInterviewInput) {
  return request<RecruitmentInterviewDto>("/recruitment/interviews", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function scheduleInterviewSequence(input: { applicationId: string; title: string; rounds: ScheduleInterviewInput[] }) {
  return request<{ id: string; status: string; interviews: RecruitmentInterviewDto[] }>("/recruitment/interview-sequences", { method: "POST", body: JSON.stringify(input) });
}

export function fetchInterviewPools() { return request<import("./contracts").InterviewPoolDto[]>("/recruitment/interview-pools"); }
export function createInterviewPool(input: { name: string; description?: string; branchId?: string; members: Array<{ userId: string; defaultRole: string; priority?: number }> }) { return request<import("./contracts").InterviewPoolDto>("/recruitment/interview-pools", { method: "POST", body: JSON.stringify(input) }); }
export function fetchInterviewResources(branchId?: string) { return request<import("./contracts").InterviewResourceDto[]>(`/recruitment/interview-resources${branchId ? `?branchId=${encodeURIComponent(branchId)}` : ""}`); }
export function createInterviewResource(input: { branchId: string; name: string; type: string; capacity?: number; location?: string }) { return request<import("./contracts").InterviewResourceDto>("/recruitment/interview-resources", { method: "POST", body: JSON.stringify(input) }); }
export function fetchInterviewerProfiles() { return request<import("./contracts").InterviewerProfileDto[]>("/recruitment/interviewer-profiles"); }
export function updateInterviewerProfile(userId: string, input: { trainingStatus: string; shadowSessionsRequired?: number; maxInterviewsPerDay?: number; maxInterviewsPerWeek?: number; autoSubstitutionEnabled?: boolean }) { return request(`/recruitment/interviewer-profiles/${encodeURIComponent(userId)}`, { method: "PUT", body: JSON.stringify(input) }); }
export function createInterviewSchedulingRequest(input: { applicationId: string; title: string; type: ApplicationInterviewType; timezone: string; durationMinutes: number; windowStartsAt: string; windowEndsAt: string; poolId?: string; interviewerUserIds?: string[]; shadowUserIds?: string[]; resourceIds?: string[] }) { return request<{ id: string; url: string; status: string }>("/recruitment/interview-scheduling-requests", { method: "POST", body: JSON.stringify(input) }); }
export function fetchInterviewCoordinationQueue(page = 1, pageSize = 20) { return request<{ interviews: RecruitmentInterviewDto[]; schedulingRequests: Array<{ id: string; title: string; status: string; expiresAt: string; application: VacancyApplicationDto }>; meta: { interviewCount: number; requestCount: number; page: number; pageSize: number } }>(`/recruitment/coordination-queue?page=${page}&pageSize=${pageSize}`); }
export function respondInterviewInvitation(id: string, accepted: boolean) { return request(`/recruitment/interviews/${encodeURIComponent(id)}/participants/me`, { method: "PATCH", body: JSON.stringify({ accepted }) }); }
export function fetchPublicInterviewScheduling(token: string) { return request<import("./contracts").InterviewSchedulingPublicDto>(`/public/interview-scheduling/${encodeURIComponent(token)}`, {}, { auth: false }); }
export function bookPublicInterviewScheduling(token: string, startsAt: string) { return request<{ booked: boolean; interviewId: string; startsAt: string; endsAt: string; timezone: string }>(`/public/interview-scheduling/${encodeURIComponent(token)}/book`, { method: "POST", body: JSON.stringify({ startsAt }) }, { auth: false }); }

export function updateRecruitmentInterview(id: string, input: Partial<Pick<RecruitmentInterviewDto, "status" | "timezone" | "startsAt" | "endsAt" | "location" | "meetingUrl" | "notes" | "calendarProvider" | "videoProvider">> & { allowConflict?: boolean }) {
  return request<RecruitmentInterviewDto>(`/recruitment/interviews/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function fetchCalendarConnections() {
  return request<CalendarConnectionDto[]>("/recruitment/calendar-connections");
}

export function fetchCalendarProviderConfiguration() {
  return request<import("./contracts").CalendarProviderConfigurationDto[]>("/recruitment/calendar-providers");
}

export function fetchCalendarAuthorizationUrl(
  provider: CalendarProvider,
  redirectUri: string,
) {
  return request<{ authorizationUrl: string; state: string }>(
    `/recruitment/calendar-connections/${provider}/authorize?redirectUri=${encodeURIComponent(redirectUri)}`,
  );
}

export function completeCalendarOAuth(
  provider: CalendarProvider,
  input: { code: string; state: string; redirectUri: string },
) {
  return request<CalendarConnectionDto>(
    `/recruitment/calendar-connections/${provider}/oauth`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function disconnectCalendar(provider: CalendarProvider) {
  return request<{ disconnected: boolean }>(
    `/recruitment/calendar-connections/${provider}`,
    { method: "DELETE" },
  );
}

export function fetchInterviewerAvailability(
  interviewerUserId: string,
  input: { startsAt: string; endsAt: string; durationMinutes?: number },
) {
  const query = new URLSearchParams({
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    ...(input.durationMinutes ? { durationMinutes: String(input.durationMinutes) } : {}),
  });
  return request<InterviewerAvailabilityDto>(
    `/recruitment/interviewers/${encodeURIComponent(interviewerUserId)}/availability?${query}`,
  );
}

export function fetchAvailabilitySettings() {
  return request<AvailabilitySettingsDto | null>("/recruitment/availability/settings");
}

export function updateAvailabilitySettings(input: AvailabilitySettingsDto) {
  return request<AvailabilitySettingsDto>("/recruitment/availability/settings", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function retryInterviewCalendarSync(id: string) {
  return request<RecruitmentInterviewDto>(
    `/recruitment/interviews/${encodeURIComponent(id)}/calendar/retry`,
    { method: "POST" },
  );
}

export function downloadInterviewInvitation(id: string) {
  return request<Blob>(
    `/recruitment/interviews/${encodeURIComponent(id)}/invitation.ics`,
    {},
    { responseType: "blob" },
  );
}

export function downloadCandidateInterviewInvitation(id: string) {
  return candidateRequest<Blob>(
    `/candidate/applications/interviews/${encodeURIComponent(id)}/invitation.ics`,
    { responseType: "blob" },
  );
}

export function fetchAtsCommunicationTemplates(vacancyId?: string) {
  const query = vacancyId ? `?vacancyId=${encodeURIComponent(vacancyId)}` : "";
  return request<AtsCommunicationTemplateDto[]>(`/ats/communications/templates${query}`);
}

export function createAtsCommunicationTemplate(input: CreateAtsCommunicationTemplateInput) {
  return request<AtsCommunicationTemplateDto>("/ats/communications/templates", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function fetchAtsCommunicationHistory(applicationId: string) {
  return request<AtsMessageDto[]>(
    `/ats/communications/applications/${encodeURIComponent(applicationId)}/history`,
  );
}

export function retryAtsCommunication(messageId: string) {
  return request(`/ats/communications/messages/${encodeURIComponent(messageId)}/retry`, {
    method: "POST",
  });
}

export function sendAtsOffer(applicationId: string, message?: string) {
  return request<AtsMessageDto[]>(
    `/ats/communications/applications/${encodeURIComponent(applicationId)}/offer`,
    { method: "POST", body: JSON.stringify({ message: message?.trim() || undefined }) },
  );
}

export function fetchJobOffers(applicationId: string) {
  return request<import("./contracts").JobOfferDto[]>(`/ats/offers/applications/${encodeURIComponent(applicationId)}`);
}

export function createJobOffer(applicationId: string, input: import("./contracts").CreateJobOfferInput) {
  return request<import("./contracts").JobOfferDto>(`/ats/offers/applications/${encodeURIComponent(applicationId)}`, { method: "POST", body: JSON.stringify(input) });
}

export function reviseJobOffer(offerId: string, input: import("./contracts").CreateJobOfferInput) {
  return request<import("./contracts").JobOfferDto>(`/ats/offers/${encodeURIComponent(offerId)}/versions`, { method: "POST", body: JSON.stringify(input) });
}

export function decideJobOfferApproval(offerId: string, input: { type: import("./contracts").JobOfferApprovalType; approved: boolean; notes?: string }) {
  return request<import("./contracts").JobOfferDto>(`/ats/offers/${encodeURIComponent(offerId)}/approvals`, { method: "POST", body: JSON.stringify(input) });
}

export function sendStructuredJobOffer(offerId: string) {
  return request<import("./contracts").JobOfferDto>(`/ats/offers/${encodeURIComponent(offerId)}/send`, { method: "POST" });
}

export function retryJobOfferConversion(offerId: string) {
  return request<import("./contracts").JobOfferDto>(`/ats/offers/${encodeURIComponent(offerId)}/retry-conversion`, { method: "POST" });
}

export function cancelJobOffer(offerId: string, reason?: string) {
  return request<{ cancelled: boolean }>(`/ats/offers/${encodeURIComponent(offerId)}/cancel`, { method: "POST", body: JSON.stringify({ reason }) });
}

export function downloadJobOfferPdf(offerId: string, version?: number) {
  const query = version ? `?version=${version}` : "";
  return request<Blob>(`/ats/offers/${encodeURIComponent(offerId)}/pdf${query}`, {}, { responseType: "blob" });
}

export function fetchCandidateJobOffers() {
  return candidateRequest<import("./contracts").JobOfferDto[]>("/candidate/offers");
}

export function downloadCandidateJobOfferPdf(offerId: string, version?: number) {
  const query = version ? `?version=${version}` : "";
  return candidateRequest<Blob>(`/candidate/offers/${encodeURIComponent(offerId)}/pdf${query}`, { responseType: "blob" });
}

export function createCandidateOfferSigningLink(offerId: string) {
  return candidateRequest<{ url: string; expiresAt: string }>(`/candidate/offers/${encodeURIComponent(offerId)}/signing-link`, { method: "POST" });
}

export function respondCandidateJobOffer(offerId: string, input: { decision: "REJECT"; reason?: string }) {
  return candidateRequest<{ rejected: boolean }>(`/candidate/offers/${encodeURIComponent(offerId)}/respond`, { method: "POST", body: JSON.stringify(input) });
}

export function counterCandidateJobOffer(offerId: string, input: { salaryAmount?: number; periodicity?: import("./contracts").CompensationPeriodicity; employmentStartDate?: string; reason: string }) {
  return candidateRequest<import("./contracts").JobOfferDto>(`/candidate/offers/${encodeURIComponent(offerId)}/counter`, { method: "POST", body: JSON.stringify(input) });
}

export function fetchCommunicationDomain() { return request<import("./contracts").CommunicationDomainDto | null>("/ats/communications/domain"); }
export function configureCommunicationDomain(input: { domain: string; fromName: string; fromEmail: string; replyToEmail?: string; dkimSelector?: string }) { return request<import("./contracts").CommunicationDomainDto>("/ats/communications/domain", { method: "PUT", body: JSON.stringify(input) }); }
export function verifyCommunicationDomain() { return request<import("./contracts").CommunicationDomainDto>("/ats/communications/domain/verify", { method: "POST" }); }
export function fetchCommunicationInbox(filters: { page?: number; pageSize?: number; search?: string } = {}) { const query = new URLSearchParams(); Object.entries(filters).forEach(([key, value]) => value != null && value !== "" && query.set(key, String(value))); return request<{ data: AtsMessageDto[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }>(`/ats/communications/inbox?${query}`); }
export function replyCandidateEmail(messageId: string, input: { subject: string; body: string }) { return request<AtsMessageDto[]>(`/ats/communications/messages/${encodeURIComponent(messageId)}/reply`, { method: "POST", body: JSON.stringify(input) }); }
export function fetchAtsConversations(filters: { page?: number; pageSize?: number; search?: string; status?: import("./contracts").AtsConversationStatus; assignedUserId?: string; assignedToMe?: boolean; unreadOnly?: boolean; archived?: boolean } = {}) { const query = new URLSearchParams(); Object.entries(filters).forEach(([key, value]) => value != null && value !== "" && query.set(key, String(value))); return request<import("./contracts").AtsConversationListDto>(`/ats/communications/conversations?${query}`); }
export function fetchAtsConversation(id: string) { return request<import("./contracts").AtsConversationDto>(`/ats/communications/conversations/${encodeURIComponent(id)}`); }
export function updateAtsConversation(id: string, input: { status?: import("./contracts").AtsConversationStatus; assignedUserId?: string | null; snoozedUntil?: string | null; archived?: boolean }) { return request<import("./contracts").AtsConversationDto>(`/ats/communications/conversations/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) }); }
export function markAtsConversationRead(id: string) { return request<{ readAt: string }>(`/ats/communications/conversations/${encodeURIComponent(id)}/read`, { method: "POST" }); }
export function composeCandidateEmail(applicationId: string, input: { subject: string; body: string }) { return request<AtsMessageDto[]>(`/ats/communications/applications/${encodeURIComponent(applicationId)}/messages`, { method: "POST", body: JSON.stringify(input) }); }
export function fetchUnmatchedInbound(page = 1, pageSize = 20) { return request<{ data: import("./contracts").AtsUnmatchedInboundDto[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }>(`/ats/communications/unmatched?page=${page}&pageSize=${pageSize}`); }
export function linkUnmatchedInbound(id: string, applicationId: string) { return request<AtsMessageDto>(`/ats/communications/unmatched/${encodeURIComponent(id)}/link`, { method: "POST", body: JSON.stringify({ applicationId }) }); }
export function ignoreUnmatchedInbound(id: string, reason: string) { return request<{ ignored: boolean }>(`/ats/communications/unmatched/${encodeURIComponent(id)}/ignore`, { method: "POST", body: JSON.stringify({ reason }) }); }
export function fetchAtsAttachmentAccess(id: string) { return request<{ id: string; filename: string; mimeType: string; sizeBytes?: number | null; url: string; expiresAt?: string }>(`/ats/communications/attachments/${encodeURIComponent(id)}/access`); }

export function submitInterviewScorecard(id: string, input: {
  criteria?: Record<string, unknown>;
  responses?: ScorecardResponseDto[];
  overallRating?: number;
  recommendation: InterviewRecommendation;
  strengths?: string;
  concerns?: string;
  comments?: string;
  sign?: boolean;
}) {
  return request<InterviewScorecardRecordDto>(`/recruitment/interviews/${encodeURIComponent(id)}/scorecard`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function fetchScorecardTemplates(vacancyId?: string, stageId?: string) {
  const query = new URLSearchParams();
  if (vacancyId) query.set("vacancyId", vacancyId);
  if (stageId) query.set("stageId", stageId);
  return request<ScorecardTemplateDto[]>(`/recruitment/scorecard-templates?${query}`);
}

export function createScorecardTemplate(input: CreateScorecardTemplateInput) {
  return request<ScorecardTemplateDto>("/recruitment/scorecard-templates", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateScorecardTemplateAdmin(id: string, input: { isActive?: boolean; feedbackVisibility?: ScorecardTemplateDto["feedbackVisibility"] }) { return request<ScorecardTemplateDto>(`/recruitment/scorecard-templates/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) }); }
export function duplicateScorecardTemplate(id: string, input: { vacancyId?: string; scope?: "VACANCY" | "TENANT"; name?: string }) { return request<ScorecardTemplateDto>(`/recruitment/scorecard-templates/${encodeURIComponent(id)}/duplicate`, { method: "POST", body: JSON.stringify(input) }); }
export function fetchScorecardCompetencies(includeInactive = false) { return request<ScorecardCompetencyDto[]>(`/recruitment/scorecard-competencies?includeInactive=${includeInactive}`); }
export function fetchAiCompetencyAssessment(applicationId: string) { return request<AiCompetencyAssessmentContextDto>(`/recruitment/applications/${encodeURIComponent(applicationId)}/competency-ai-assessment`); }
export function generateAiCompetencyAssessment(applicationId: string) { return request<AiCompetencyAssessmentDto>(`/recruitment/applications/${encodeURIComponent(applicationId)}/competency-ai-assessment`, { method: "POST" }); }
export function signAiCompetencyAssessment(applicationId: string, assessmentId: string, input: { items: Array<{ itemId: string; humanScore?: number; reviewerNotes?: string; confirmed: boolean }>; reviewerNotes?: string; acknowledgement: boolean }) { return request<AiCompetencyAssessmentDto>(`/recruitment/applications/${encodeURIComponent(applicationId)}/competency-ai-assessment/${encodeURIComponent(assessmentId)}/sign`, { method: "POST", body: JSON.stringify(input) }); }
export function createScorecardCompetency(input: Omit<ScorecardCompetencyDto, "id" | "isActive"> & { isActive?: boolean }) { return request<ScorecardCompetencyDto>("/recruitment/scorecard-competencies", { method: "POST", body: JSON.stringify(input) }); }
export function updateScorecardCompetency(id: string, input: Omit<ScorecardCompetencyDto, "id">) { return request<ScorecardCompetencyDto>(`/recruitment/scorecard-competencies/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) }); }
export function replaceScorecardAssignments(interviewId: string, assignments: Array<{ evaluatorUserId: string; criterionIds: string[]; anonymousReview?: boolean }>) { return request<ScorecardEvaluatorAssignmentDto[]>(`/recruitment/interviews/${encodeURIComponent(interviewId)}/scorecard-assignments`, { method: "PUT", body: JSON.stringify({ assignments }) }); }
export function fetchExternalAssessments(applicationId: string) { return request<ExternalAssessmentDto[]>(`/recruitment/applications/${encodeURIComponent(applicationId)}/external-assessments`); }
export function createExternalAssessment(input: { applicationId: string; provider: string; assessmentType: string; externalAssessmentId?: string; launchUrl?: string; expiresAt?: string; consentRecorded: boolean }) { return request<ExternalAssessmentDto>("/recruitment/external-assessments", { method: "POST", body: JSON.stringify(input) }); }
export function updateExternalAssessmentResult(id: string, input: { status: ExternalAssessmentDto["status"]; score?: number; percentile?: number; reportUrl?: string; result?: Record<string, unknown> }) { return request<ExternalAssessmentDto>(`/recruitment/external-assessments/${encodeURIComponent(id)}/result`, { method: "PATCH", body: JSON.stringify(input) }); }
export function fetchHiringManagerApproval(applicationId: string) { return request<HiringManagerApprovalDto | null>(`/recruitment/applications/${encodeURIComponent(applicationId)}/hiring-manager-approval`); }
export function assignHiringManager(applicationId: string, managerUserId: string) { return request<HiringManagerApprovalDto>(`/recruitment/applications/${encodeURIComponent(applicationId)}/hiring-manager-approval`, { method: "PUT", body: JSON.stringify({ managerUserId }) }); }
export function decideHiringManagerApproval(applicationId: string, input: { status: HiringManagerApprovalDto["status"]; recommendation: InterviewRecommendation; rationale: string }) { return request<HiringManagerApprovalDto>(`/recruitment/applications/${encodeURIComponent(applicationId)}/hiring-manager-approval/decision`, { method: "POST", body: JSON.stringify(input) }); }
export function fetchEvaluatorCalibration() { return request<EvaluatorCalibrationDto[]>("/recruitment/scorecard-calibration"); }
export function runEvaluatorCalibration() { return request<EvaluatorCalibrationDto[]>("/recruitment/scorecard-calibration/run", { method: "POST" }); }
export function fetchBiasValidations() { return request<BiasValidationRunDto[]>("/recruitment/scorecard-bias-validations"); }
export function runBiasValidation(input: { populationField: string; referenceGroup: { name: string; total: number; selected: number }; comparisonGroup: { name: string; total: number; selected: number } }) { return request<BiasValidationRunDto>("/recruitment/scorecard-bias-validations", { method: "POST", body: JSON.stringify(input) }); }

export function fetchInterviewScorecardContext(id: string) {
  return request<ScorecardContextDto>(
    `/recruitment/interviews/${encodeURIComponent(id)}/scorecard-context`,
  );
}

export function fetchInterviewScorecardComparison(id: string) {
  return request<ScorecardComparisonDto>(
    `/recruitment/interviews/${encodeURIComponent(id)}/scorecard-comparison`,
  );
}

export function fetchDecisionCommittee(applicationId: string) {
  return request<HiringDecisionCommitteeDto | null>(
    `/recruitment/applications/${encodeURIComponent(applicationId)}/decision-committee`,
  );
}

export function createDecisionCommittee(input: {
  applicationId: string;
  quorum: number;
  members: Array<{ userId: string; role: "CHAIR" | "MEMBER" | "OBSERVER"; isRequired?: boolean }>;
}) {
  return request<HiringDecisionCommitteeDto>("/recruitment/decision-committees", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function voteDecisionCommittee(id: string, input: {
  vote: InterviewRecommendation;
  rationale: string;
  conflictOfInterestDeclared: boolean;
  recuse?: boolean;
}) {
  return request(`/recruitment/decision-committees/${encodeURIComponent(id)}/vote`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function finalizeDecisionCommittee(id: string, input: {
  decision: InterviewRecommendation;
  rationale: string;
}) {
  return request<HiringDecisionCommitteeDto>(
    `/recruitment/decision-committees/${encodeURIComponent(id)}/finalize`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

let candidateSession: CandidateSessionDto | null = null;

function getCandidateAccessToken() {
  return candidateSession?.accessToken ?? "";
}

export function getCandidateSession(): CandidateSessionDto | null {
  return candidateSession;
}

export function clearCandidateSession() {
  candidateSession = null;
  if (typeof window !== "undefined") {
    void fetchWithTimeout(`${API_BASE_URL}/candidate-auth/logout`, { method: "POST", credentials: "include" }).catch(() => undefined);
  }
}

async function candidateRequest<T>(path: string, init: RequestInit & { responseType?: "json" | "blob" } = {}) {
  const { responseType = "json", ...fetchInit } = init;
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const token = getCandidateAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetchWithTimeout(`${API_BASE_URL}${path}`, { ...fetchInit, headers, credentials: "include" });
  if (!response.ok) {
    const payload = await readJsonSafe(response);
    const nestedError =
      typeof payload === "object" &&
      payload &&
      "error" in payload &&
      typeof (payload as { error?: unknown }).error === "object" &&
      (payload as { error?: unknown }).error !== null
        ? (payload as { error: { message?: string; code?: string; details?: unknown } }).error
        : null;
    const message = nestedError?.message
      ? String(nestedError.message)
      : typeof payload === "object" && payload && "message" in payload
        ? String((payload as { message?: unknown }).message)
        : `Error ${response.status}`;
    throw new ApiError(message, response.status, nestedError?.code, nestedError?.details);
  }
  return (responseType === "blob" ? response.blob() : response.json()) as Promise<T>;
}

export async function authenticateCandidate(email: string, password: string, mode: "login" | "register" = "login") {
  const session = await candidateRequest<CandidateSessionDto>(`/candidate-auth/${mode}`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  candidateSession = session;
  return session;
}

export function fetchCandidateApplications() {
  return candidateRequest<VacancyApplicationDto[]>("/candidate/applications");
}

export function requestCandidatePasswordReset(email: string): Promise<{ accepted: boolean; developmentToken?: string }> {
  return candidateRequest("/candidate-auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
}

export async function resetCandidatePassword(token: string, password: string) {
  const session = await candidateRequest<CandidateSessionDto>("/candidate-auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
  candidateSession = session;
  return session;
}

export function fetchCandidateProfile() {
  return candidateRequest<CandidatePortalProfileDto>("/candidate-auth/profile");
}

export function updateCandidateProfile(input: Partial<CandidatePortalProfileDto>) {
  return candidateRequest<CandidatePortalProfileDto>("/candidate-auth/profile", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function fetchCandidatePortalOverview() {
  return candidateRequest<CandidatePortalOverviewDto>("/candidate/applications/portal");
}

export function fetchCandidatePreboarding() { return candidateRequest<CandidatePreboardingDto | null>("/candidate/preboarding"); }
export function completeCandidatePreboardingTask(taskId: string) { return candidateRequest<CandidatePreboardingDto>(`/candidate/preboarding/tasks/${encodeURIComponent(taskId)}/complete`, { method: "PATCH" }); }
export function uploadCandidatePreboardingDocument(input: { file: File; taskId?: string; category?: string }) { const body = new FormData(); body.append("file", input.file); if (input.taskId) body.append("taskId", input.taskId); body.append("category", input.category ?? "OTHER"); return candidateRequest("/candidate/preboarding/documents", { method: "POST", body }); }

export function withdrawCandidateApplication(applicationId: string, reason?: string) {
  return candidateRequest<{ withdrawn: boolean }>(`/candidate/applications/${encodeURIComponent(applicationId)}/withdraw`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function createCandidatePrivacyRequest(type: "EXPORT" | "ANONYMIZE" | "DELETE", reason?: string) {
  return candidateRequest<CandidatePortalOverviewDto["privacyRequests"][number]>("/candidate/applications/privacy-requests", {
    method: "POST",
    body: JSON.stringify({ type, reason }),
  });
}

export function cancelCandidatePrivacyRequest(id: string) {
  return candidateRequest<CandidatePortalOverviewDto["privacyRequests"][number]>(`/candidate/applications/privacy-requests/${encodeURIComponent(id)}/cancel`, { method: "POST" });
}

export function markCandidateCommunicationRead(id: string) {
  return candidateRequest<{ id: string; readAt: string }>(`/candidate/applications/communications/${encodeURIComponent(id)}/read`, { method: "POST" });
}

export function replyCandidateCommunication(id: string, message: string) {
  return candidateRequest<{ id: string; applicationId: string; subject: string; body: string; direction: string; createdAt: string }>(`/candidate/applications/communications/${encodeURIComponent(id)}/reply`, { method: "POST", body: JSON.stringify({ message }) });
}

export function requestCandidateInterviewReschedule(id: string) {
  return candidateRequest<{ url: string }>(`/candidate/applications/interviews/${encodeURIComponent(id)}/reschedule`, { method: "POST" });
}

export function createCandidateSupportRequest(input: { subject: string; message: string }) {
  return candidateRequest<{ id: string; subject: string; message: string; status: string; requestedAt: string }>("/candidate/applications/support-requests", { method: "POST", body: JSON.stringify(input) });
}

export function parseCandidateResume(resume: File) {
  const body = new FormData();
  body.append("resume", resume);
  return candidateRequest<ParsedResumeDto>("/candidate/applications/resume/parse", { method: "POST", body });
}

export function fetchCandidateResumeAccess(id: string) {
  return candidateRequest<{ id: string; originalName: string; mimeType: string; sizeBytes: number; url: string; expiresAt: string }>(`/candidate/applications/resume/${encodeURIComponent(id)}/access`);
}

export function startCandidateSocialLogin(provider: "linkedin" | "indeed", returnUrl: string) {
  return candidateRequest<{ provider: string; authorizationUrl: string }>(`/candidate-auth/social/${provider}/start?returnUrl=${encodeURIComponent(returnUrl)}`);
}

export async function exchangeCandidateSocialCode(token: string) {
  const session = await candidateRequest<CandidateSessionDto>("/candidate-auth/social/exchange", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
  candidateSession = session;
  return session;
}

export function submitCandidateApplication(
  vacancyId: string,
  input: PublicApplicationInput,
  resume: File | null,
  consent: boolean,
  antiFraud?: { website?: string; formStartedAt?: string },
) {
  const body = new FormData();
  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    body.append(key, key === "dynamicResponses" ? JSON.stringify(value) : String(value));
  });
  body.append("resumeConsent", String(consent));
  body.append("resumeConsentVersion", "candidate-privacy-v1");
  if (antiFraud?.website) body.append("website", antiFraud.website);
  if (antiFraud?.formStartedAt) body.append("formStartedAt", antiFraud.formStartedAt);
  if (resume) body.append("resume", resume);
  return candidateRequest<PublicApplicationReceipt>(`/public/vacancies/${encodeURIComponent(vacancyId)}/applications`, {
    method: "POST",
    body,
  });
}

export type PublicApplicationDraftPayload = { step: number; form: PublicApplicationInput; flowVersion?: number; pausedAt?: string; resumedAt?: string };

export type PublicApplicationDraftResponse = {
  token: string;
  value: PublicApplicationDraftPayload | null;
  expiresAt: string | null;
};

export function fetchPublicApplicationDraft(vacancyId: string) {
  return request<PublicApplicationDraftResponse>(`/public/vacancies/${encodeURIComponent(vacancyId)}/applications/draft`, {}, { auth: false });
}

export function fetchCandidateApplicationDraft(vacancyId: string) {
  return candidateRequest<PublicApplicationDraftResponse>(`/candidate/applications/drafts/${encodeURIComponent(vacancyId)}`);
}

export function saveCandidateApplicationDraft(vacancyId: string, value: PublicApplicationDraftPayload) {
  return candidateRequest<{ expiresAt: string }>(`/candidate/applications/drafts/${encodeURIComponent(vacancyId)}`, { method: "PUT", body: JSON.stringify({ value }) });
}

export function savePublicApplicationDraft(vacancyId: string, value: PublicApplicationDraftPayload) {
  return request<PublicApplicationDraftResponse>(
    `/public/vacancies/${encodeURIComponent(vacancyId)}/applications/draft`,
    {
      method: "PUT",
      body: JSON.stringify({ value }),
    },
    { auth: false },
  );
}

export function deletePublicApplicationDraft(vacancyId: string) {
  return request<{ ok: boolean }>(`/public/vacancies/${encodeURIComponent(vacancyId)}/applications/draft`, { method: "DELETE" }, { auth: false });
}

export type CandidateConversionMetrics = {
  totals: { started: number; paused: number; resumed: number; submitted: number; completionRate: number; resumeRate: number };
  vacancies: Array<{ vacancyId: string; title: string; started: number; paused: number; resumed: number; submitted: number; completionRate: number; resumeRate: number }>;
};

export function fetchCandidateConversionMetrics() {
  return request<CandidateConversionMetrics>("/applications/conversion-metrics");
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

export function fetchTrainingCourseQuality(courseId: string) {
  return request<TrainingCourseQualityDto>(
    `/training/admin/courses/${encodeURIComponent(courseId)}/quality`,
  );
}

export function requestTrainingQualityReviews(
  courseId: string,
  reviewTypes: TrainingQualityReviewType[],
  reviewerId?: string,
) {
  return request<TrainingCourseQualityDto>(
    `/training/admin/courses/${encodeURIComponent(courseId)}/quality/reviews`,
    { method: "POST", body: JSON.stringify({ reviewTypes, reviewerId }) },
  );
}

export function decideTrainingQualityReview(
  reviewId: string,
  input: {
    status: TrainingQualityReviewStatus;
    checklist: Record<string, unknown>;
    summary?: string;
  },
) {
  return request<TrainingCourseQualityDto>(
    `/training/admin/quality-reviews/${encodeURIComponent(reviewId)}/decision`,
    { method: "PATCH", body: JSON.stringify(input) },
  );
}

export function createTrainingCoursePilot(
  courseId: string,
  input: {
    name: string;
    participantIds: string[];
    successCriteria: { minResponses: number; minAverageRating: number };
    startsAt?: string;
    endsAt?: string;
  },
) {
  return request<TrainingCoursePilotDto>(
    `/training/admin/courses/${encodeURIComponent(courseId)}/pilots`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function updateTrainingCoursePilotStatus(pilotId: string, status: TrainingPilotStatus) {
  return request<TrainingCoursePilotDto>(
    `/training/admin/course-pilots/${encodeURIComponent(pilotId)}/status`,
    { method: "PATCH", body: JSON.stringify({ status }) },
  );
}

export function fetchMyTrainingPilots() {
  return request<{ items: TrainingCoursePilotDto[] }>("/training/pilots");
}

export function submitTrainingPilotFeedback(
  pilotId: string,
  input: {
    rating: number;
    clarityRating: number;
    relevanceRating: number;
    comment?: string;
    blockingIssue?: boolean;
  },
) {
  return request<TrainingPilotFeedbackDto>(
    `/training/pilots/${encodeURIComponent(pilotId)}/feedback`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function fetchTrainingCourseDesign(courseId: string) {
  return request<TrainingCourseDesignDto>(
    `/training/admin/courses/${encodeURIComponent(courseId)}/design`,
  );
}

export function updateTrainingCourseDesign(courseId: string, input: TrainingCourseDesignInput) {
  return request<TrainingCourseDesignDto>(
    `/training/admin/courses/${encodeURIComponent(courseId)}/design`,
    { method: "PUT", body: JSON.stringify(input) },
  );
}

export function fetchTrainingCompetencies() {
  return request<TrainingCompetencyDto[]>("/training/admin/competencies");
}

export function createTrainingCompetency(input: {
  code: string;
  name: string;
  description?: string;
  framework?: string;
  scope?: "TENANT" | "GLOBAL";
}) {
  return request<TrainingCompetencyDto>("/training/admin/competencies", {
    method: "POST",
    body: JSON.stringify(input),
  });
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
  if (MOCK_BACKEND_ENABLED) {
    return deleteMockTrainingCourse(courseId);
  }

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
  input: { title: string; description?: string; sortOrder?: number; isRequired?: boolean },
) {
  return request<TrainingCourseModuleDto>(
    `/training/admin/courses/${encodeURIComponent(courseId)}/modules`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function updateTrainingCourseModule(
  moduleId: string,
  input: { title?: string; description?: string; sortOrder?: number; isRequired?: boolean },
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

export function duplicateTrainingCourseModule(moduleId: string) {
  return request<TrainingCourseModuleDto>(
    `/training/admin/modules/${encodeURIComponent(moduleId)}/duplicate`,
    { method: "POST" },
  );
}

export function reorderTrainingCourseModules(courseId: string, entityIds: string[]) {
  return request<{ ordered: boolean; entityIds: string[] }>(
    `/training/admin/courses/${encodeURIComponent(courseId)}/modules/order`,
    { method: "PUT", body: JSON.stringify({ entityIds }) },
  );
}

export function createTrainingLesson(
  moduleId: string,
  input: { title: string; description?: string; estimatedMinutes?: number; sortOrder?: number; isRequired?: boolean },
) {
  return request<TrainingLessonDto>(
    `/training/admin/modules/${encodeURIComponent(moduleId)}/lessons`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function updateTrainingLesson(
  lessonId: string,
  input: { title?: string; description?: string; estimatedMinutes?: number; sortOrder?: number; isRequired?: boolean },
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

export function duplicateTrainingLesson(lessonId: string) {
  return request<TrainingLessonDto>(
    `/training/admin/lessons/${encodeURIComponent(lessonId)}/duplicate`,
    { method: "POST" },
  );
}

export function reorderTrainingLessons(moduleId: string, entityIds: string[]) {
  return request<{ ordered: boolean; entityIds: string[] }>(
    `/training/admin/modules/${encodeURIComponent(moduleId)}/lessons/order`,
    { method: "PUT", body: JSON.stringify({ entityIds }) },
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
    isRequired?: boolean;
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
    isRequired?: boolean;
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

export function duplicateTrainingContentBlock(blockId: string) {
  return request<TrainingContentBlockDto>(
    `/training/admin/blocks/${encodeURIComponent(blockId)}/duplicate`,
    { method: "POST" },
  );
}

export function reorderTrainingContentBlocks(lessonId: string, entityIds: string[]) {
  return request<{ ordered: boolean; entityIds: string[] }>(
    `/training/admin/lessons/${encodeURIComponent(lessonId)}/blocks/order`,
    { method: "PUT", body: JSON.stringify({ entityIds }) },
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

export function fetchTrainingLaunches(filters: {
  page?: number;
  pageSize?: number;
  status?: TrainingLaunchStatus;
  courseId?: string;
  search?: string;
} = {}) {
  const query = new URLSearchParams({
    page: String(filters.page ?? 1),
    pageSize: String(filters.pageSize ?? 20),
  });
  if (filters.status) query.set("status", filters.status);
  if (filters.courseId) query.set("courseId", filters.courseId);
  if (filters.search) query.set("search", filters.search);
  return request<TrainingLaunchListDto>(
    `/training/admin/launches?${query.toString()}`,
  );
}

export function createTrainingLaunch(input: {
  courseId: string;
  name: string;
  audience: TrainingLaunchAudience;
  targetIds?: string[];
  batchSize?: number;
  rolloutIntervalHours?: number;
  startAt?: string;
  dueAt?: string;
  isRequired?: boolean;
}) {
  return request<TrainingLaunchDto>("/training/admin/launches", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deployTrainingLaunch(launchId: string) {
  return request<TrainingLaunchDto>(
    `/training/admin/launches/${encodeURIComponent(launchId)}/deploy`,
    { method: "POST" },
  );
}

export function updateTrainingLaunchStatus(
  launchId: string,
  status: TrainingLaunchStatus,
) {
  return request<TrainingLaunchDto>(
    `/training/admin/launches/${encodeURIComponent(launchId)}/status`,
    { method: "PATCH", body: JSON.stringify({ status }) },
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

export interface TrainingAssessmentInput {
  title: string;
  description?: string;
  passingScore: number;
  maxAttempts?: number;
  timeLimitMinutes?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  randomQuestionCount?: number;
  cooldownMinutes?: number;
  availableFrom?: string;
  availableUntil?: string;
  requireAllQuestions?: boolean;
  feedbackMode?: TrainingQuizFeedbackMode;
  rubric?: Record<string, unknown>;
}

export function createTrainingAssessment(
  courseId: string,
  input: TrainingAssessmentInput,
) {
  return request<TrainingQuizDto>(
    `/training/admin/courses/${encodeURIComponent(courseId)}/assessments`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function updateTrainingAssessment(quizId: string, input: Partial<TrainingAssessmentInput>) {
  return request<TrainingQuizDto>(
    `/training/admin/assessments/${encodeURIComponent(quizId)}`,
    { method: "PATCH", body: JSON.stringify(input) },
  );
}

export interface TrainingAssessmentQuestionInput {
  prompt: string;
  questionType: TrainingQuestionType;
  explanation?: string;
  points: number;
  requiresManualGrading?: boolean;
  category?: string;
  difficulty?: TrainingQuestionDifficulty;
  tags?: string[];
  rubric?: Record<string, unknown>;
  options: Array<{ label: string; isCorrect: boolean }>;
}

export function createTrainingAssessmentQuestion(
  quizId: string,
  input: TrainingAssessmentQuestionInput,
) {
  return request<TrainingQuizQuestionDto>(
    `/training/admin/assessments/${encodeURIComponent(quizId)}/questions`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function updateTrainingAssessmentQuestion(
  questionId: string,
  input: TrainingAssessmentQuestionInput,
) {
  return request<TrainingQuizQuestionDto>(
    `/training/admin/assessment-questions/${encodeURIComponent(questionId)}`,
    { method: "PATCH", body: JSON.stringify(input) },
  );
}

export function deleteTrainingAssessmentQuestion(questionId: string) {
  return request<{ deleted: boolean }>(
    `/training/admin/assessment-questions/${encodeURIComponent(questionId)}`,
    { method: "DELETE" },
  );
}

export function reorderTrainingAssessmentQuestions(quizId: string, entityIds: string[]) {
  return request<{ ordered: boolean; entityIds: string[] }>(
    `/training/admin/assessments/${encodeURIComponent(quizId)}/questions/order`,
    { method: "PUT", body: JSON.stringify({ entityIds }) },
  );
}

export function fetchTrainingQuestionBank(search = "") {
  const query = new URLSearchParams({ page: "1", pageSize: "100" });
  if (search) query.set("search", search);
  return request<{ items: TrainingQuestionBankItemDto[]; total: number }>(
    `/training/admin/assessment-question-bank?${query.toString()}`,
  );
}

export function createTrainingQuestionBankItem(input: TrainingAssessmentQuestionInput) {
  return request<TrainingQuestionBankItemDto>("/training/admin/assessment-question-bank", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function importTrainingQuestionBankItems(quizId: string, itemIds: string[]) {
  return request<TrainingQuizDto>(
    `/training/admin/assessments/${encodeURIComponent(quizId)}/questions/import`,
    { method: "POST", body: JSON.stringify({ itemIds }) },
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

export function fetchTrainingCertificationPolicy(courseId: string) {
  return request<TrainingCertificationPolicyResponse>(
    `/training/admin/courses/${encodeURIComponent(courseId)}/certification-policy`,
  );
}

export function updateTrainingCertificationPolicy(
  courseId: string,
  input: TrainingCertificationPolicyInput,
) {
  return request<TrainingCertificationPolicyResponse>(
    `/training/admin/courses/${encodeURIComponent(courseId)}/certification-policy`,
    { method: "PUT", body: JSON.stringify(input) },
  );
}

export function renewTrainingCertificate(certificateId: string, reason?: string) {
  return request<TrainingCertificateDto>(
    `/training/admin/certificates/${encodeURIComponent(certificateId)}/renew`,
    { method: "POST", body: JSON.stringify({ reason }) },
  );
}

export function verifyPublicTrainingCertificate(code: string) {
  return request<PublicTrainingCertificateVerificationDto>(
    `/public/training-certificates/${encodeURIComponent(code)}`,
    {},
    { auth: false, retryOnUnauthorized: false },
  );
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

export function fetchTrainingIntelligence() {
  return request<TrainingIntelligenceDto>("/training/admin/analytics/intelligence");
}

export function captureTrainingIntelligence(type: TrainingIntelligenceRecordType, payload: Record<string, unknown>) {
  return request("/training/admin/analytics/intelligence", { method: "POST", body: JSON.stringify({ type, payload }) });
}

export function fetchTrainingCompliancePolicies() {
  return request<{ items: TrainingCompliancePolicyDto[] }>(
    "/training/admin/analytics/compliance-policies",
  );
}

export function fetchTrainingEffectiveness(filters: {
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
  return request<TrainingEffectivenessDto>(
    `/training/admin/analytics/effectiveness${query.size ? `?${query}` : ""}`,
  );
}

export function fetchTrainingImprovements(filters: {
  courseId?: string;
  status?: TrainingImprovementStatus;
} = {}) {
  const query = new URLSearchParams();
  if (filters.courseId) query.set("courseId", filters.courseId);
  if (filters.status) query.set("status", filters.status);
  return request<{ items: TrainingCourseImprovementDto[] }>(
    `/training/admin/analytics/improvements${query.size ? `?${query}` : ""}`,
  );
}

export function createTrainingImprovement(input: {
  courseId: string;
  title: string;
  description?: string;
  ownerId?: string;
  priority?: TrainingImprovementPriority;
  source?: TrainingImprovementSource;
  signalCode?: string;
  evidence?: Record<string, unknown>;
  dueAt?: string;
}) {
  return request<TrainingCourseImprovementDto>(
    "/training/admin/analytics/improvements",
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function updateTrainingImprovement(
  improvementId: string,
  input: {
    status?: TrainingImprovementStatus;
    priority?: TrainingImprovementPriority;
    ownerId?: string;
    dueAt?: string;
    outcomeNotes?: string;
  },
) {
  return request<TrainingCourseImprovementDto>(
    `/training/admin/analytics/improvements/${encodeURIComponent(improvementId)}`,
    { method: "PATCH", body: JSON.stringify(input) },
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

export function fetchTrainingOperations() {
  return request<TrainingOperationsDto>("/training/admin/operations");
}

export function executeTrainingOperation(kind: TrainingOperationKind) {
  return request<TrainingOperationsDto["runs"][number]>(
    "/training/admin/operations/execute",
    { method: "POST", body: JSON.stringify({ kind }) },
  );
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

export function fetchOnboardingAnalytics(branchId?: string) {
  return request<OnboardingAnalyticsDto>(`/onboarding/analytics${branchId ? `?branchId=${encodeURIComponent(branchId)}` : ""}`);
}

export function fetchOnboardingPerformance(flowId: string) {
  return request<OnboardingPerformanceDto>(`/onboarding/flows/${encodeURIComponent(flowId)}/performance`);
}

export function createOnboardingPerformanceObjective(flowId: string, input: { title: string; description?: string; targetValue?: number; currentValue?: number; weight?: number; dueDate?: string }) {
  return request(`/onboarding/flows/${encodeURIComponent(flowId)}/performance/objectives`, { method: "POST", body: JSON.stringify(input) });
}

export function recordOnboardingPerformanceEvaluation(flowId: string, input: { periodDays: 30 | 60 | 90; score: number; notes?: string }) {
  return request(`/onboarding/flows/${encodeURIComponent(flowId)}/performance/evaluations`, { method: "POST", body: JSON.stringify(input) });
}

export function fetchOnboardingAutomationOverview() {
  return request<OnboardingAutomationOverviewDto>("/onboarding/operations/overview");
}

export function runOnboardingDueTaskAutomation() {
  return request<OnboardingAutomationRunDto>("/onboarding/operations/process-due", { method: "POST" });
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

export function reviseOnboardingTemplate(id: string, input: { description?: string; effectiveFrom?: string; tasks: OnboardingTemplateTaskConfigDto[] }) {
  return request<OnboardingTemplateDto>(`/onboarding/templates/${encodeURIComponent(id)}/revisions`, { method: "POST", body: JSON.stringify(input) });
}

export function approveOnboardingTemplate(id: string, input: { effectiveFrom?: string; isDefault?: boolean } = {}) {
  return request<OnboardingTemplateDto>(`/onboarding/templates/${encodeURIComponent(id)}/approve`, { method: "POST", body: JSON.stringify(input) });
}

export function fetchOnboardingLibrary() { return request<OnboardingLibraryItemDto[]>("/onboarding/library"); }
export function createOnboardingLibraryItem(input: { type: "TASK" | "DOCUMENT" | "POLICY"; name: string; description?: string; countryCode?: string; content?: Record<string, unknown> }) { return request<OnboardingLibraryItemDto>("/onboarding/library", { method: "POST", body: JSON.stringify(input) }); }
export function fetchOnboardingRetentionPolicies() { return request<OnboardingRetentionPolicyDto[]>("/onboarding/compliance/retention-policies"); }
export function saveOnboardingRetentionPolicy(input: { countryCode: string; documentCategory: string; retentionDays: number; legalBasis?: string }) { return request<OnboardingRetentionPolicyDto>("/onboarding/compliance/retention-policies", { method: "POST", body: JSON.stringify(input) }); }
export function approveOnboardingRetentionPolicy(id: string, reviewNote?: string) { return request<OnboardingRetentionPolicyDto>(`/onboarding/compliance/retention-policies/${encodeURIComponent(id)}/approve`, { method: "POST", body: JSON.stringify({ reviewNote }) }); }
export function fetchOnboardingSignatureEvidence(countryCode?: string) { return request<OnboardingSignatureEvidenceDto>(`/onboarding/compliance/signature-evidence${countryCode ? `?countryCode=${encodeURIComponent(countryCode)}` : ""}`); }
export function placeOnboardingLegalHold(flowId: string, input: { reason: string; reference?: string }) { return request(`/onboarding/flows/${encodeURIComponent(flowId)}/legal-holds`, { method: "POST", body: JSON.stringify(input) }); }
export function releaseOnboardingLegalHold(id: string) { return request(`/onboarding/legal-holds/${encodeURIComponent(id)}/release`, { method: "POST" }); }
export function exportOnboardingDossier(flowId: string) { return request(`/onboarding/flows/${encodeURIComponent(flowId)}/export`); }

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

export function applyOnboardingTemplateBulk(input: { flowIds: string[]; templateId: string; startDate?: string }) {
  return request<{ requested: number; applied: number; failed: Array<{ id: string; error?: string }> }>("/onboarding/flows/bulk-apply-template", { method: "POST", body: JSON.stringify(input) });
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
export function fetchProductivityOverview(branchId?: string) { return request<{ totalEvents:number; activeSeconds:number; idleSeconds:number; taskCount:number; camerasOnline:number; zonesActive:number; alertsOpen:number }>(`/productivity/overview${branchId ? `?branchId=${encodeURIComponent(branchId)}` : ""}`); }
export function fetchProductivityAlerts(branchId?: string) { return request<Array<{ id: string; status: string; title: string; description: string; createdAt: string }>>(`/productivity/alerts${branchId ? `?branchId=${encodeURIComponent(branchId)}` : ""}`); }
export function fetchProductivityInsights(branchId?: string) { return request<{ period: { from: string; to: string }; zones: Array<{ zone: { id: string; name: string }; events: number; activeSeconds: number; idleSeconds: number; confidence: number }>; recommendations: Array<{ zoneId: string; title: string; explanation: string; suggestedAction: string }> }>(`/productivity/insights${branchId ? `?branchId=${encodeURIComponent(branchId)}` : ""}`); }
export function fetchProductivityCameras(branchId?:string){return request<Array<{id:string;name:string;sourceType:string;status:string;lastHeartbeatAt?:string}>>(`/productivity/cameras${branchId?`?branchId=${encodeURIComponent(branchId)}`:""}`)}
export function createProductivityCamera(input:{branchId:string;name:string;sourceType?:string;description?:string;streamUrl?:string}){return request("/productivity/cameras",{method:"POST",body:JSON.stringify(input)})}
export function fetchProductivityZones(cameraId?:string){return request<Array<{id:string;cameraId:string;name:string;zoneType:string}>>(`/productivity/zones${cameraId?`?cameraId=${encodeURIComponent(cameraId)}`:""}`)}
export function createProductivityZone(input:{cameraId:string;name:string;zoneType:string;description?:string;polygonCoordinates:unknown}){return request("/productivity/zones",{method:"POST",body:JSON.stringify(input)})}
export type ProductivityEventDto = {
  id: string;
  cameraId: string;
  zoneId?: string | null;
  eventType: string;
  startedAt: string;
  endedAt?: string | null;
  durationSeconds?: number | null;
  confidence?: number | null;
  source: string;
  metadata?: Record<string, unknown> | null;
  cameraName?: string | null;
  zoneName?: string | null;
  createdAt: string;
};
export function fetchProductivityEvents(input:{branchId:string;source?:"DEMO"|"CV_SERVICE";limit?:number}) {
  const query = new URLSearchParams({ branchId: input.branchId });
  if (input.source) query.set("source", input.source);
  if (input.limit) query.set("limit", String(input.limit));
  return request<ProductivityEventDto[]>(`/productivity/events?${query.toString()}`);
}
export function createProductivityDemoEvent(input:{cameraId:string;zoneId?:string;eventType:string;startedAt:string;endedAt?:string;confidence?:number;metadata?:Record<string,unknown>;idempotencyKey:string}) {
  return request<{event:ProductivityEventDto;duplicate:boolean}>("/productivity/events/demo", { method:"POST", body:JSON.stringify(input) });
}
export function fetchInventoryAnalytics(branchId?: string) { return request<{ assets: { total: number; available: number; assigned: number; maintenance: number; returnPending: number }; stock: { references: number; reorder: number; belowMinimum: number }; operations: { openMaintenance: number; purchaseOrdersInProgress: number } }>(`/inventory/analytics${branchId ? `?branchId=${encodeURIComponent(branchId)}` : ""}`); }
export function fetchInventoryAuditTrail(filters: { branchId?: string; page?: number } = {}) { const q = new URLSearchParams(); if (filters.branchId) q.set("branchId", filters.branchId); if (filters.page) q.set("page", String(filters.page)); return request<{ items: Array<{ id: string; action?: string; email?: string; actorRole?: string; route: string; statusCode: number; createdAt: string; correlationId?: string }>; page: number; total: number; totalPages: number }>(`/inventory/audit-trail${q.size ? `?${q}` : ""}`); }
export function createInventoryCatalogItem(input: { sku: string; name: string }) {
  return request<import("./contracts").InventoryCatalogItemDto>("/inventory/catalog", { method: "POST", body: JSON.stringify(input) });
}
export function fetchInventoryContext() {
  return request<import("./contracts").InventoryContextDto>("/inventory/context");
}
export function fetchInventoryLocations(branchId?: string) {
  return request<import("./contracts").InventoryLocationDto[]>(`/inventory/locations${branchId ? `?branchId=${encodeURIComponent(branchId)}` : ""}`);
}
export function createInventoryLocation(input: { branchId: string; code: string; name: string; type?: string }) {
  return request<import("./contracts").InventoryLocationDto>("/inventory/locations", { method: "POST", body: JSON.stringify(input) });
}
export function fetchInventoryWarehouse(filters: { branchId?: string; search?: string; page?: number; pageSize?: number } = {}) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== "") query.set(key, String(value)); });
  return request<import("./contracts").InventoryWarehousePageDto>(`/inventory/warehouse${query.size ? `?${query}` : ""}`);
}
export function adjustInventoryStock(input: { itemId: string; branchId: string; quantity: number; locationId?: string; reason: string }) {
  return request("/inventory/warehouse/adjustments", { method: "POST", body: JSON.stringify(input) });
}
export function countInventoryStock(input: { itemId: string; branchId: string; countedQty: number; notes?: string }) {
  return request("/inventory/warehouse/counts", { method: "POST", body: JSON.stringify(input) });
}
export function updateInventoryStockPolicy(input: { itemId: string; branchId: string; minQty: number; reorderPoint: number; maxQty?: number }) {
  return request("/inventory/warehouse/policy", { method: "PATCH", body: JSON.stringify(input) });
}
export function fetchInventorySuppliers() { return request<Array<{ id: string; name: string; email?: string; phone?: string }>>("/inventory/suppliers"); }
export function createInventorySupplier(input: { name: string; email?: string; phone?: string; taxId?: string }) { return request("/inventory/suppliers", { method: "POST", body: JSON.stringify(input) }); }
export function fetchInventoryPurchaseOrders(branchId?: string) { return request<Array<{ id: string; code: string; status: string; totalAmount: string | number; currency: string; lines: Array<{ id: string; itemId: string; quantity: number; receivedQty: number; unitCost: string | number }> }>>(`/inventory/purchase-orders${branchId ? `?branchId=${encodeURIComponent(branchId)}` : ""}`); }
export function createInventoryPurchaseOrder(input: { branchId: string; supplierId: string; code: string; currency?: string; budgetAmount?: number; notes?: string; lines: Array<{ itemId: string; quantity: number; unitCost: number }> }) { return request("/inventory/purchase-orders", { method: "POST", body: JSON.stringify(input) }); }
export function approveInventoryPurchaseOrder(id: string) { return request(`/inventory/purchase-orders/${encodeURIComponent(id)}/approve`, { method: "POST" }); }
export function receiveInventoryPurchaseOrder(id: string, lines: Array<{ lineId: string; quantity: number }>) { return request(`/inventory/purchase-orders/${encodeURIComponent(id)}/receive`, { method: "POST", body: JSON.stringify({ lines }) }); }
export function fetchInventoryMaintenance() { return request<Array<{ id: string; type: string; status: string; title: string; dueAt?: string; costAmount?: string | number; currency: string; asset: { assetTag: string; item: { name: string }; branch: { name: string } } }>>("/inventory/maintenance"); }
export function createInventoryMaintenance(input: { assetId: string; title: string; type: string; dueAt?: string; costAmount?: number; vendor?: string; description?: string }) { return request("/inventory/maintenance", { method: "POST", body: JSON.stringify(input) }); }
export function resolveInventoryMaintenance(id: string, input: { costAmount?: number; notes?: string } = {}) { return request(`/inventory/maintenance/${encodeURIComponent(id)}/resolve`, { method: "POST", body: JSON.stringify(input) }); }
export function fetchInventoryAssets(filters: { status?: string; branchId?: string; search?: string } = {}) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value) query.set(key, value); });
  return request<import("./contracts").InventoryAssetDto[]>(`/inventory/assets${query.size ? `?${query}` : ""}`);
}
export function fetchMyInventoryAssets() { return request<import("./contracts").InventoryAssetDto[]>("/inventory/my-assets"); }
export function fetchInventoryAsset(id: string) {
  return request<import("./contracts").InventoryAssetDto>(`/inventory/assets/${encodeURIComponent(id)}`);
}
export function lookupInventoryAsset(assetTag: string) {
  return request<import("./contracts").InventoryAssetDto>(`/inventory/assets/lookup/${encodeURIComponent(assetTag)}`);
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
export async function downloadInventoryMovements(branchId?: string) {
  const auth = getStoredAuth();
  const headers = new Headers();
  if (auth?.accessToken) headers.set("Authorization", `Bearer ${auth.accessToken}`);
  const tenantId = resolveTenantHeader();
  if (tenantId) headers.set("x-tenant-id", tenantId);
  const query = branchId ? `?branchId=${encodeURIComponent(branchId)}` : "";
  const response = await fetchWithTimeout(`${API_BASE_URL}/inventory/warehouse/movements/export${query}`, { headers, credentials: "include" });
  if (!response.ok) throw new ApiError("No fue posible exportar los movimientos.", response.status);
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "movimientos-inventario.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function fetchSignatureProviders() {
  return request<SignatureProviderDto[]>("/signatures/providers");
}

export function fetchEnterpriseIntegrations() {
  return request<EnterpriseIntegrationDto[]>("/enterprise-integrations");
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

export type SaveNoCodeAutomationRuleInput = {
  name: string;
  triggerEvent: NoCodeAutomationTrigger;
  scope: NoCodeAutomationScope;
  branchId?: string;
  enabled?: boolean;
  conditions: NoCodeAutomationCondition[];
  consequences: NoCodeAutomationAction[];
};

export function fetchAutomationCatalog() {
  return request<NoCodeAutomationCatalogDto>("/automation/catalog");
}

export function fetchAutomationTemplates() {
  return request<NoCodeAutomationTemplateDto[]>("/automation/templates");
}

export function createAutomationFromTemplate(key: string, input?: { branchId?: string; enabled?: boolean }) {
  return request<NoCodeAutomationRuleDto>(`/automation/templates/${encodeURIComponent(key)}`, { method: "POST", body: JSON.stringify(input ?? {}) });
}

export function fetchAutomationRules(input?: { page?: number; pageSize?: number; enabled?: boolean; search?: string }) {
  const query = new URLSearchParams({ page: String(input?.page ?? 1), pageSize: String(input?.pageSize ?? 50) });
  if (input?.enabled !== undefined) query.set("enabled", String(input.enabled));
  if (input?.search) query.set("search", input.search);
  return request<{ data: NoCodeAutomationRuleDto[]; meta: { total: number; page: number; pageSize: number; totalPages: number } }>(`/automation/rules?${query.toString()}`);
}

export function createAutomationRule(input: SaveNoCodeAutomationRuleInput) {
  return request<NoCodeAutomationRuleDto>("/automation/rules", { method: "POST", body: JSON.stringify(input) });
}

export function updateAutomationRule(id: string, input: Partial<SaveNoCodeAutomationRuleInput>) {
  return request<NoCodeAutomationRuleDto>(`/automation/rules/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function duplicateAutomationRule(id: string) {
  return request<NoCodeAutomationRuleDto>(`/automation/rules/${encodeURIComponent(id)}/duplicate`, { method: "POST" });
}

export function deleteAutomationRule(id: string) {
  return request<{ deleted: boolean; disabled: boolean; message: string }>(`/automation/rules/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function simulateAutomationRule(id: string, input: { branchId?: string; workflowId?: string; employeeId?: string; candidateId?: string; payload?: Record<string, unknown> }) {
  return request<NoCodeAutomationSimulationDto>(`/automation/rules/${encodeURIComponent(id)}/simulate`, { method: "POST", body: JSON.stringify(input) });
}

export function fetchAutomationExecutions(input?: { page?: number; pageSize?: number; status?: NoCodeAutomationExecutionStatus; search?: string; ruleId?: string; from?: string; to?: string }) {
  const query = new URLSearchParams({ page: String(input?.page ?? 1), pageSize: String(input?.pageSize ?? 50) });
  if (input?.status) query.set("status", input.status);
  if (input?.search) query.set("search", input.search);
  if (input?.ruleId) query.set("ruleId", input.ruleId);
  if (input?.from) query.set("from", input.from);
  if (input?.to) query.set("to", input.to);
  return request<{ data: NoCodeAutomationExecutionDto[]; meta: { total: number; page: number; pageSize: number; totalPages: number } }>(`/automation/executions?${query.toString()}`);
}

export function fetchAutomationOperationsOverview() {
  return request<NoCodeAutomationOperationsOverviewDto>("/automation/operations/overview");
}

export function bulkUpdateAutomationRules(ids: string[], action: "ENABLE" | "DISABLE" | "DELETE") {
  return request<{ requested: number; updated: number; deleted: number; preserved: number }>("/automation/rules/bulk", { method: "POST", body: JSON.stringify({ ids, action }) });
}

export function retryAutomationExecution(id: string) {
  return request<NoCodeAutomationExecutionDto>(`/automation/executions/${encodeURIComponent(id)}/retry`, { method: "POST" });
}

export function bulkRetryAutomationExecutions(ids: string[]) {
  return request<{ requested: number; succeeded: number; failed: number; results: Array<{ id: string; ok: boolean; executionId?: string; error?: string }> }>("/automation/executions/bulk-retry", { method: "POST", body: JSON.stringify({ ids }) });
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

export type AtsAnalyticsQuery = ReportQuery & {
  vacancyId?: string;
  recruiterId?: string;
  granularity?: "day" | "week" | "month";
};

export type SavedReportFilterDto = {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  filters: ReportQuery;
  createdAt: string;
  updatedAt: string;
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

function atsAnalyticsQueryString(input: AtsAnalyticsQuery) {
  const query = new URLSearchParams(reportQueryString(input));
  if (input.vacancyId) query.set("vacancyId", input.vacancyId);
  if (input.recruiterId) query.set("recruiterId", input.recruiterId);
  if (input.granularity) query.set("granularity", input.granularity);
  return query.toString();
}

export function fetchReportsOverview(input: ReportQuery) {
  return request<ReportsOverviewDto>(`/reports/overview?${reportQueryString(input)}`);
}

export function fetchReportsExport(input: ReportQuery) {
  return request<ReportExportDto>(`/reports/export?${reportQueryString(input)}`);
}

export function fetchSavedReportFilters() {
  return request<SavedReportFilterDto[]>("/reports/saved-filters");
}

export function saveReportFilter(input: { name: string; filters: ReportQuery }) {
  return request<SavedReportFilterDto>("/reports/saved-filters", { method: "POST", body: JSON.stringify(input) });
}

export function deleteSavedReportFilter(id: string) {
  return request<{ deleted: boolean; id: string }>(`/reports/saved-filters/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function fetchAtsAnalytics(input: AtsAnalyticsQuery) {
  return request<AtsAnalyticsDto>(`/reports/ats-analytics?${atsAnalyticsQueryString(input)}`);
}

export function fetchAtsAnalyticsExport(input: AtsAnalyticsQuery) {
  return request<ReportExportDto>(`/reports/ats-analytics/export?${atsAnalyticsQueryString(input)}`);
}

export function fetchAtsAnalyticsDashboards() {
  return request<import("./contracts").AtsAnalyticsDashboardDto[]>("/reports/ats-analytics/dashboards");
}

export function saveAtsAnalyticsDashboard(input: AtsAnalyticsQuery & { name: string; widgets?: string[]; isDefault?: boolean }) {
  return request<import("./contracts").AtsAnalyticsDashboardDto>("/reports/ats-analytics/dashboards", { method: "POST", body: JSON.stringify(input) });
}

export function fetchAtsSourceCosts() { return request<Array<{ id: string; source: string; amount: string | number; currency: string; periodStart: string; periodEnd: string; notes?: string | null }>>("/reports/ats-analytics/source-costs"); }
export function saveAtsSourceCost(input: { source: string; amountCents: number; currency?: string; periodStart: string; periodEnd: string; notes?: string }) { return request("/reports/ats-analytics/source-costs", { method: "POST", body: JSON.stringify(input) }); }
export function fetchAtsHiringQuality() { return request<Array<{ id: string; name: string; jobTitle?: string | null; createdAt: string; sourceCandidate?: { source?: string | null } | null; checkpoints: Array<{ checkpointDays: number; due: boolean; review: { performanceScore: number; retained: boolean; managerComment?: string | null } | null }> }>>("/reports/ats-analytics/hiring-quality"); }
export function saveAtsHiringQuality(input: { employeeId: string; checkpointDays: 30 | 60 | 90; performanceScore: number; retained: boolean; managerComment?: string }) { return request("/reports/ats-analytics/hiring-quality", { method: "POST", body: JSON.stringify(input) }); }

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
  canAccessGlobalGovernance: boolean;
  allowedBranchIds: string[];
  allowedTenantIds: string[];
  activeBranchId: string | null;
  subscriptionStatus?: SubscriptionAccessState;
  subscriptionGraceEndsAt: string | null;
  impersonation: { active: boolean; tenantId?: string | null; startedAt?: string | null } | null;
  tenant: TenantDto;
} {
  const role = roleCodesToRoleKey(authUser.roles, authUser.isSuperAdmin);
  const canAccessGlobalGovernance = Boolean(
    authUser.canAccessGlobalGovernance ??
      (authUser.isGlobalContext && (role === "admin_saas" || role === "admin_plataforma")),
  );
  const enabledModules = deriveEnabledModules(
    authUser.tenant?.enabledModules ?? authUser.enabledModules,
    canAccessGlobalGovernance,
  );
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
    canAccessGlobalGovernance,
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
