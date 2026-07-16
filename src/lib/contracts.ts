export type PlanTier = "starter" | "growth" | "enterprise";
export type RoleKey = "admin_saas" | "admin_empresa" | "rrhh" | "lider_area" | "empleado";
export type ModuleKey =
  | "dashboard"
  | "ats"
  | "onboarding"
  | "training"
  | "productivity"
  | "inventory"
  | "admin"
  | "reports"
  | "notifications"
  | "profile";

export type PermissionKey =
  | "dashboard.view"
  | "ats.view"
  | "ats.manage"
  | "onboarding.view"
  | "onboarding.manage"
  | "training.view"
  | "training.manage"
  | "productivity.view"
  | "inventory.view"
  | "inventory.manage"
  | "admin.view"
  | "admin.users"
  | "admin.roles"
  | "admin.company"
  | "admin.subscription"
  | "reports.view"
  | "notifications.view"
  | "profile.view";

export const PLAN_TIERS = ["starter", "growth", "enterprise"] as const satisfies readonly PlanTier[];
export const ROLE_KEYS = ["admin_saas", "admin_empresa", "rrhh", "lider_area", "empleado"] as const satisfies readonly RoleKey[];
export const MODULE_KEYS = [
  "dashboard",
  "ats",
  "onboarding",
  "training",
  "productivity",
  "inventory",
  "admin",
  "reports",
  "notifications",
  "profile",
] as const satisfies readonly ModuleKey[];
export const PERMISSION_KEYS = [
  "dashboard.view",
  "ats.view",
  "ats.manage",
  "onboarding.view",
  "onboarding.manage",
  "training.view",
  "training.manage",
  "productivity.view",
  "inventory.view",
  "inventory.manage",
  "admin.view",
  "admin.users",
  "admin.roles",
  "admin.company",
  "admin.subscription",
  "reports.view",
  "notifications.view",
  "profile.view",
] as const satisfies readonly PermissionKey[];

export interface TenantDto {
  id: string;
  slug: string;
  name: string;
  plan: PlanTier;
  status?: "active" | "trial" | "suspended";
  enabledModules: ModuleKey[];
  branding: {
    accent: string;
    supportEmail: string;
  };
}

export interface BranchDto {
  id: string;
  tenantId: string;
  name: string;
  city: string;
  manager: string;
  employees: number;
  status: "active" | "inactive";
}

export interface RoleDefinitionDto {
  id: string;
  tenantId: string;
  name: string;
  scope: "global" | "tenant" | "module";
  permissions: PermissionKey[];
  members: number;
}

export interface SubscriptionDto {
  id: string;
  tenantId: string;
  plan: PlanTier;
  billingCycle: "monthly" | "annual";
  status: "active" | "trial" | "past_due";
  price: number;
  renewalDate: string;
}

export interface ModuleAssignmentDto {
  id: string;
  tenantId: string;
  module: ModuleKey;
  enabled: boolean;
  source: "plan" | "manual";
}

export interface UserDto {
  id: string;
  fullName: string;
  email: string;
  role: RoleKey;
  tenantId: string;
  status: "active" | "invited" | "suspended";
}

export interface SessionDto {
  token: string;
  tenantId: string;
  userId: string;
  role: RoleKey;
}

export interface VacancyDto {
  id: string;
  title: string;
  area: string;
  mode: "Remoto" | "Hibrido" | "Presencial";
  status: "Activa" | "Borrador" | "En entrevistas" | "Cerrada";
  location: string;
  applicants: number;
  owner: string;
  image?: string;
}

export interface CandidateDto {
  id: string;
  name: string;
  vacancyId?: string;
  role: string;
  stage: string;
  score: number;
  summary: string;
}

export interface HiringCriterionDto {
  id: string;
  label: string;
  weight: number;
  score?: number;
  note?: string;
}

export interface InterviewKitDto {
  id: string;
  stage: string;
  focus: string;
  interviewers: string[];
  criteria: HiringCriterionDto[];
}

export interface VacancyHiringPlanDto {
  vacancyId: string;
  scorecardTitle: string;
  advancementRule: string;
  interviewKits: InterviewKitDto[];
}

export interface CandidateReviewerFeedbackDto {
  id: string;
  reviewer: string;
  role: string;
  status: "submitted" | "pending";
  recommendation: "strong_yes" | "yes" | "mixed" | "no";
  submittedAt?: string;
  criteria: HiringCriterionDto[];
  summary: string;
}

export interface CandidateStructuredAssessmentDto {
  candidateId: string;
  vacancyId: string;
  currentStage: string;
  consolidatedRecommendation: "Avanzar" | "Avanzar con reserva" | "No avanzar";
  decisionSummary: string;
  feedbackPendingCount: number;
  advancementBlocked: boolean;
  stageCriteria: HiringCriterionDto[];
  reviewerFeedback: CandidateReviewerFeedbackDto[];
}

export interface AutomationJourneyDto {
  title: string;
  description: string;
  systems: string;
  status: string;
}

export interface AutomationRuleDto {
  id: string;
  name: string;
  trigger: string;
  scope: string;
  owners: string[];
  consequences: string[];
  auditability: string;
  status: "Activa" | "En seguimiento" | "Controlada";
}

export interface AutomationAuditEntryDto {
  id: string;
  employeeName: string;
  branch: string;
  trigger: string;
  ruleName: string;
  actor: string;
  executedAt: string;
  status: "Ejecutada" | "En riesgo" | "Bloqueada";
  summary: string;
  consequences: string[];
}

export interface AutomationQueueItemDto {
  id: string;
  name: string;
  trigger: string;
  nextAction: string;
  owner: string;
  status?: string;
}

export interface OnboardingDocumentDto {
  id: string;
  name: string;
  owner: string;
  status: string;
  expires: string;
}

export interface OnboardingReadinessDto {
  person: string;
  role: string;
  branch: string;
  readiness: string;
  blocker: string;
  owner: string;
  dueDate: string;
  dayOneReady: "Listo" | "En riesgo" | "No listo";
}

export interface OnboardingOwnerProgressDto {
  owner: string;
  progress: string;
  blocker: string;
  deadline: string;
}

export interface OnboardingActorTaskDto {
  id: string;
  title: string;
  description: string;
  status: "Pendiente" | "En curso" | "Completado" | "Bloqueado";
  deadline: string;
  sla: string;
  blocker: string;
  evidence: string[];
}

export interface OnboardingActorWorkspaceDto {
  owner: "Colaborador" | "Supervisor" | "RRHH" | "Cumplimiento";
  progress: string;
  blocker: string;
  deadline: string;
  sla: string;
  evidenceSummary: string;
  pendingCount: number;
  tasks: OnboardingActorTaskDto[];
}

export interface SignaturePackageDto {
  id: string;
  title: string;
  employeeName: string;
  status: string;
  participants: string;
  nextAction: string;
}

export interface CourseDto {
  id: string;
  title: string;
  progress: string;
  type: string;
}

export interface InventoryActivationDto {
  id: string;
  employeeName: string;
  item: string;
  branch: string;
  status: string;
  dueLabel: string;
}

export interface TrainingActivationDto {
  id: string;
  employeeName: string;
  courseTitle: string;
  branch: string;
  status: string;
  dueLabel: string;
}

export interface OperationalHandoffDto {
  id: string;
  employeeName: string;
  branch: string;
  status: string;
  nextAction: string;
  owner: string;
}

export interface ComplianceCheckpointDto {
  id: string;
  employeeName: string;
  branch: string;
  status: string;
  nextAction: string;
  owner: string;
}

export interface ProductivityRowDto {
  id: string;
  area: string;
  productivity: string;
  trend: string;
  alert: string;
}

export interface AccessTaskDto {
  id: string;
  employeeName: string;
  branch: string;
  system: string;
  status: string;
  nextAction: string;
}

export interface OperationalEventDto {
  id: string;
  employeeName: string;
  type: "hiring" | "branch_transfer" | "offboarding";
  title: string;
  description: string;
  status: string;
}

export interface MasterWorkflowStepDto {
  id: string;
  label: string;
  status: "completed" | "in_progress" | "pending";
  detail: string;
  owner: string;
  sla: string;
  targetDate: string;
}

export interface MasterWorkflowCardDto {
  employeeName: string;
  branchName: string;
  workflowType: "hiring" | "branch_transfer" | "offboarding";
  globalStatus: string;
  progressPercent: number;
  currentStage: string;
  summary: string;
  blockers: string[];
  steps: MasterWorkflowStepDto[];
  updatedAtLabel: string;
}

export interface CandidateApplicationTimelineItemDto {
  id: string;
  title: string;
  description: string;
  date: string;
  status: "completed" | "current" | "upcoming";
}

export interface CandidateApplicationDocumentDto {
  id: string;
  name: string;
  status: "received" | "pending" | "required";
  dueDate?: string;
}

export interface CandidateApplicationMessageDto {
  id: string;
  from: string;
  title: string;
  body: string;
  date: string;
  unread: boolean;
}

export interface CandidateApplicationDto {
  id: string;
  reference: string;
  candidateName: string;
  role: string;
  location: string;
  tenantName: string;
  status: "Postulacion recibida" | "En revision" | "En entrevistas" | "Documentos pendientes" | "Oferta enviada";
  stage: string;
  submittedAt: string;
  recruiter: string;
  nextStep: string;
  progress: number;
  timeline: CandidateApplicationTimelineItemDto[];
  documents: CandidateApplicationDocumentDto[];
  messages: CandidateApplicationMessageDto[];
}

export interface InventoryItemDto {
  id: string;
  item: string;
  stock: number;
  assigned: number;
  status: "Critico" | "Estable" | "Reposicion";
  location: string;
}

export interface AppDatasetsDto {
  vacancies: VacancyDto[];
  candidates: CandidateDto[];
  inventory: InventoryItemDto[];
}
