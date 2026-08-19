export type PlanTier = "starter" | "growth" | "enterprise";
export type SubscriptionAccessState = "active" | "trial" | "past_due" | "grace_period" | "suspended";
export type RoleKey =
  | "admin_saas"
  | "admin_plataforma"
  | "admin_empresa"
  | "rrhh"
  | "reclutador"
  | "entrevistador"
  | "instructor"
  | "supervisor"
  | "encargado_inventario"
  | "empleado"
  | "candidato";
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
  | "training.integrations.manage"
  | "productivity.view"
  | "productivity.manage"
  | "inventory.view"
  | "inventory.manage"
  | "admin.view"
  | "admin.users"
  | "admin.roles"
  | "admin.company"
  | "admin.subscription"
  | "reports.view"
  | "notifications.view"
  | "profile.view"
  | "tenants.view"
  | "tenants.create"
  | "tenants.update"
  | "branches.view"
  | "branches.create"
  | "branches.update"
  | "branches.delete"
  | "branches.switch"
  | "users.view"
  | "users.create"
  | "users.update"
  | "users.assign_roles"
  | "roles.view"
  | "roles.update"
  | "permissions.assign"
  | "jobs.view"
  | "jobs.create"
  | "jobs.update"
  | "jobs.publish"
  | "jobs.approve"
  | "vacancies.update"
  | "candidates.view"
  | "candidates.update"
  | "applications.view"
  | "applications.change_stage"
  | "applications.reject"
  | "applications.hire"
  | "employees.read"
  | "employees.create"
  | "employees.update"
  | "interviews.view"
  | "interviews.schedule"
  | "interviews.update"
  | "interviews.evaluate"
  | "scorecards.view"
  | "scorecards.complete"
  | "onboarding.start"
  | "documents.view"
  | "documents.upload"
  | "documents.request"
  | "documents.approve"
  | "documents.sign"
  | "courses.view"
  | "courses.create"
  | "courses.update"
  | "courses.review"
  | "courses.approve"
  | "courses.publish"
  | "courses.archive"
  | "courses.delete"
  | "courses.assign"
  | "courses.complete"
  | "assessments.view"
  | "assessments.manage"
  | "assessments.attempt"
  | "assessments.grade"
  | "certificates.view"
  | "certificates.issue"
  | "inventory.create"
  | "inventory.update"
  | "inventory.adjust"
  | "inventory.transfer"
  | "assets.view"
  | "assets.create"
  | "assets.assign"
  | "assets.return"
  | "productivity.view_self"
  | "productivity.view_team"
  | "productivity.view_company"
  | "reports.export"
  | "reports.global"
  | "audit.view"
  | "settings.view"
  | "settings.update"
  | "subscriptions.view"
  | "subscriptions.manage"
  | "profile.update"
  | "platform.tenant.switch"
  | "platform.tenant.impersonate"
  | "platform.integrations.manage";

export const PLAN_TIERS = ["starter", "growth", "enterprise"] as const satisfies readonly PlanTier[];
export const ROLE_KEYS = [
  "admin_saas",
  "admin_plataforma",
  "admin_empresa",
  "rrhh",
  "reclutador",
  "entrevistador",
  "instructor",
  "supervisor",
  "encargado_inventario",
  "empleado",
  "candidato",
] as const satisfies readonly RoleKey[];
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
  "training.integrations.manage",
  "productivity.view",
  "productivity.manage",
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
  "tenants.view",
  "tenants.create",
  "tenants.update",
  "branches.view",
  "branches.create",
  "branches.update",
  "branches.switch",
  "users.view",
  "users.create",
  "users.update",
  "users.assign_roles",
  "roles.view",
  "roles.update",
  "permissions.assign",
  "jobs.view",
  "jobs.create",
  "jobs.update",
  "jobs.publish",
  "jobs.approve",
  "candidates.view",
  "candidates.update",
  "applications.view",
  "applications.change_stage",
  "applications.reject",
  "applications.hire",
  "interviews.view",
  "interviews.schedule",
  "interviews.update",
  "interviews.evaluate",
  "scorecards.view",
  "scorecards.complete",
  "onboarding.start",
  "documents.view",
  "documents.upload",
  "documents.request",
  "documents.approve",
  "documents.sign",
  "courses.view",
  "courses.create",
  "courses.update",
  "courses.review",
  "courses.approve",
  "courses.publish",
  "courses.archive",
  "courses.delete",
  "courses.assign",
  "courses.complete",
  "assessments.view",
  "assessments.manage",
  "assessments.attempt",
  "assessments.grade",
  "certificates.view",
  "certificates.issue",
  "inventory.create",
  "inventory.update",
  "inventory.adjust",
  "inventory.transfer",
  "assets.view",
  "assets.create",
  "assets.assign",
  "assets.return",
  "productivity.view_self",
  "productivity.view_team",
  "productivity.view_company",
  "reports.export",
  "reports.global",
  "audit.view",
  "settings.view",
  "settings.update",
  "subscriptions.view",
  "subscriptions.manage",
  "profile.update",
  "platform.tenant.switch",
  "platform.tenant.impersonate",
  "platform.integrations.manage",
] as const satisfies readonly PermissionKey[];

export interface TenantDto {
  id: string;
  slug: string;
  name: string;
  plan: PlanTier;
  status?: "active" | "trial" | "suspended";
  enabledModules: ModuleKey[];
  branchCount?: number;
  employeeCount?: number;
  branding: {
    accent: string;
    supportEmail: string;
    productName?: string;
    logoUrl?: string;
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

export interface QueueOverviewDto {
  generatedAt: string;
  from: string;
  to: string;
  tenantScope: string;
  bus: {
    enabled: boolean;
    driver: string;
    workerCount: number;
    queues: string[];
  };
  summary: {
    totalEvents: number;
    pendingEvents: number;
    retryingJobs: number;
    failedJobs: number;
    processedEvents: number;
    deadLetterOpen: number;
    averageRetryCount: number;
  };
  statusBreakdown: Array<{ status: string; count: number }>;
  queueStatus: Array<{
    queueName: string;
    pending: number;
    queued: number;
    acknowledged: number;
    failed: number;
    total: number;
  }>;
  performance: {
    averageProcessingMs: number;
    p95ProcessingMs: number;
    averageEndToEndLatencyMs: number;
    maxEndToEndLatencyMs: number;
  };
}

export interface DeadLetterOverviewDto {
  generatedAt: string;
  tenantScope: string;
  limit: number;
  openCount: number;
  events: Array<{
    id: string;
    outboxEventId: string;
    dispatchId: string | null;
    queueName: string;
    eventName: string;
    eventVersion: number;
    tenant: { id: string; name: string; slug: string };
    branch: { id: string; name: string } | null;
    retryCount: number;
    reason: string;
    correlationId: string | null;
    firstFailedAt: string;
    lastFailedAt: string;
    resolvedAt: string | null;
    resolutionNote: string | null;
  }>;
}

export interface QueueThroughputDto {
  generatedAt: string;
  from: string;
  to: string;
  tenantScope: string;
  domains: Array<{
    domain: string;
    total: number;
    published: number;
    dispatched: number;
    processing: number;
    processed: number;
    failed: number;
    deadLetter: number;
    lastSeenAt: string | null;
  }>;
}

export interface QueueErrorsByTenantDto {
  generatedAt: string;
  from: string;
  to: string;
  tenantScope: string;
  tenants: Array<{
    tenantId: string;
    tenantName: string;
    tenantSlug: string;
    tenantStatus: string;
    failed: number;
    deadLetter: number;
    totalErrors: number;
    lastErrorAt: string | null;
    domains: Array<{ domain: string; count: number }>;
  }>;
}

export interface QueueMonitoringDto {
  overview: QueueOverviewDto;
  deadLetter: DeadLetterOverviewDto;
  throughput: QueueThroughputDto;
  errorsByTenant: QueueErrorsByTenantDto;
}

export type IntegrationCertificationStatus = "PASS" | "WARN" | "FAIL" | "SKIPPED";

export interface ProductionIntegrationCertificationDto {
  status: Exclude<IntegrationCertificationStatus, "SKIPPED">;
  mode: "CONFIGURATION" | "ACTIVE";
  environment: string;
  generatedAt: string;
  durationMs: number;
  summary: { passed: number; warnings: number; failed: number; skipped: number };
  checks: Array<{
    key: string;
    label: string;
    status: IntegrationCertificationStatus;
    configured: boolean;
    activeProbe: boolean;
    summary: string;
    durationMs: number;
    evidence: Record<string, unknown>;
    error?: string;
  }>;
}

export interface AtsStorageOperationsDto {
  generatedAt: string;
  skipped?: boolean;
  reason?: string;
  expiredResumes?: number;
  expiredImages?: number;
  configuration: {
    driver: string;
    provider: string;
    bucket: string | null;
    private: boolean;
    directSignedUrls: boolean;
    encryption: { enabled: boolean; mode: string };
    endpointUsesTls: boolean;
    credentialsConfigured: boolean;
  };
  usage: {
    usedBytes: number;
    alertBytes: number;
    freeTierBytes: number;
    usedPercentOfFreeTier: number;
    alertReached: boolean;
    bytesUntilAlert: number;
    files: number;
    resumes: { files: number; bytes: number };
    vacancyImages: { files: number; bytes: number };
  };
  retention: {
    enabled: boolean;
    resumeDays: number;
    vacancyImageDays: number;
    pendingExpiration: number;
  };
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

export interface PlanLimitsDto {
  maxUsers: number | null;
  maxBranches: number | null;
  maxActiveVacancies: number | null;
  maxCourses: number | null;
  maxAssets: number | null;
  storageGb: number | null;
}

export interface PlanAdminDto {
  id: string;
  code: "BASIC" | "PRO" | "ENTERPRISE";
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  limits: PlanLimitsDto;
  modules: Array<{ id: string; code: string; name: string }>;
  subscriptions: number;
}

export interface PlatformModuleDto {
  id: string;
  code: string;
  name: string;
  description?: string | null;
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

export type TrainingCourseStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "APPROVED"
  | "SCHEDULED"
  | "PUBLISHED"
  | "PAUSED"
  | "ARCHIVED"
  | "RETIRED";

export type TrainingContentBlockType =
  | "RICH_TEXT"
  | "VIDEO"
  | "FILE"
  | "LINK"
  | "QUIZ"
  | "TASK";

export interface TrainingContentBlockDto {
  id: string;
  lessonId: string;
  type: TrainingContentBlockType;
  title?: string | null;
  content?: Record<string, unknown> | null;
  resourceUrl?: string | null;
  sortOrder: number;
  isRequired: boolean;
}

export interface TrainingLessonDto {
  id: string;
  moduleId: string;
  title: string;
  description?: string | null;
  sortOrder: number;
  estimatedMinutes?: number | null;
  isRequired: boolean;
  blocks: TrainingContentBlockDto[];
}

export interface TrainingCourseModuleDto {
  id: string;
  courseId: string;
  title: string;
  description?: string | null;
  sortOrder: number;
  isRequired: boolean;
  lessons: TrainingLessonDto[];
}

export type TrainingCompetencyLevel = "AWARENESS" | "WORKING" | "PROFICIENT" | "EXPERT";
export type TrainingAudienceRuleType = "ROLE" | "JOB_TITLE" | "BRANCH" | "GROUP";
export type TrainingAudienceOperator = "EQUALS" | "CONTAINS";

export interface TrainingCompetencyDto {
  id: string;
  tenantId?: string | null;
  code: string;
  name: string;
  description?: string | null;
  framework?: string | null;
  isActive: boolean;
}

export interface TrainingCourseBriefDto {
  id?: string;
  courseId?: string;
  businessNeed: string;
  targetOutcome: string;
  successKpi: string;
  audienceDescription?: string | null;
  baselineMetric?: string | null;
  targetMetric?: string | null;
  riskIfNotCompleted?: string | null;
  contentOwnerId?: string | null;
  subjectMatterExpertId?: string | null;
  targetDate?: string | null;
}

export interface TrainingCourseCompetencyDto {
  id?: string;
  competencyId: string;
  targetLevel: TrainingCompetencyLevel;
  isRequired: boolean;
  sortOrder: number;
  competency?: TrainingCompetencyDto;
}

export interface TrainingLearningObjectiveDto {
  id?: string;
  competencyId?: string | null;
  statement: string;
  successCriteria: string;
  assessmentMethod: string;
  targetLevel: TrainingCompetencyLevel;
  isRequired: boolean;
  sortOrder: number;
  competency?: TrainingCompetencyDto | null;
}

export interface TrainingAudienceRuleDto {
  id?: string;
  ruleType: TrainingAudienceRuleType;
  operator: TrainingAudienceOperator;
  value: string;
  description?: string | null;
  sortOrder: number;
}

export interface TrainingCourseDesignDto {
  brief?: TrainingCourseBriefDto | null;
  competencies: TrainingCourseCompetencyDto[];
  objectives: TrainingLearningObjectiveDto[];
  audienceRules: TrainingAudienceRuleDto[];
  readiness: { ready: boolean; errors: string[] };
}

export interface TrainingCourseDesignInput {
  brief: TrainingCourseBriefDto;
  competencies: Array<Omit<TrainingCourseCompetencyDto, "id" | "competency">>;
  objectives: Array<Omit<TrainingLearningObjectiveDto, "id" | "competency">>;
  audienceRules: Array<Omit<TrainingAudienceRuleDto, "id">>;
}

export interface TrainingCategoryDto {
  id: string;
  tenantId?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  parentCategoryId?: string | null;
  sortOrder: number;
  isActive: boolean;
  childCategories?: TrainingCategoryDto[];
}

export interface TrainingCourseDto {
  id: string;
  tenantId?: string | null;
  categoryId?: string | null;
  category?: TrainingCategoryDto | null;
  title: string;
  slug: string;
  summary?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
  introVideoUrl?: string | null;
  estimatedMinutes: number;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  language: string;
  tags: string[];
  status: TrainingCourseStatus;
  isPublished: boolean;
  scheduledPublishAt?: string | null;
  scheduledRetireAt?: string | null;
  publishedAt?: string | null;
  retiredAt?: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  modules: TrainingCourseModuleDto[];
  quizzes?: TrainingQuizDto[];
  certificationPolicy?: TrainingCertificationPolicyDto | null;
  qualityReviews?: TrainingQualityReviewDto[];
  pilots?: TrainingCoursePilotDto[];
  _count?: { modules: number; assignments: number };
}

export type TrainingQualityReviewType = "CONTENT" | "PEDAGOGY" | "ACCESSIBILITY" | "COMPLIANCE";
export type TrainingQualityReviewStatus = "PENDING" | "APPROVED" | "CHANGES_REQUESTED";
export type TrainingPilotStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface TrainingQualityReviewDto {
  id: string;
  courseId: string;
  courseVersion: number;
  reviewType: TrainingQualityReviewType;
  status: TrainingQualityReviewStatus;
  reviewerId?: string | null;
  checklist: Record<string, unknown>;
  summary?: string | null;
  decidedAt?: string | null;
}

export interface TrainingPilotFeedbackDto {
  id: string;
  pilotId: string;
  userId: string;
  rating: number;
  clarityRating: number;
  relevanceRating: number;
  comment?: string | null;
  blockingIssue: boolean;
}

export interface TrainingCoursePilotDto {
  id: string;
  courseId: string;
  courseVersion: number;
  name: string;
  status: TrainingPilotStatus;
  participantIds: string[];
  successCriteria: { minResponses?: number; minAverageRating?: number };
  startsAt?: string | null;
  endsAt?: string | null;
  activatedAt?: string | null;
  completedAt?: string | null;
  feedback: TrainingPilotFeedbackDto[];
  metrics?: {
    participants: number;
    responses: number;
    averageRating: number;
    averageClarity: number;
    averageRelevance: number;
    blockingIssues: number;
  };
  course?: { id: string; title: string; summary?: string | null; coverImageUrl?: string | null };
}

export interface TrainingCourseQualityDto {
  courseId: string;
  courseVersion: number;
  reviews: TrainingQualityReviewDto[];
  pilots: TrainingCoursePilotDto[];
  readiness: { ready: boolean; errors: string[] };
}

export interface TrainingCourseListDto {
  items: TrainingCourseDto[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface TrainingCourseInput {
  title: string;
  slug?: string;
  summary?: string;
  description?: string;
  categoryId?: string;
  coverImageUrl?: string;
  introVideoUrl?: string;
  difficulty?: TrainingCourseDto["difficulty"];
  estimatedMinutes?: number;
  language?: string;
  tags?: string[];
  scope?: "TENANT" | "GLOBAL";
}

export interface TrainingCourseTransitionInput {
  reason?: string;
  scheduledPublishAt?: string;
  scheduledRetireAt?: string;
}

export type TrainingProgressStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "OVERDUE";

export interface TrainingAssignmentDto {
  id: string;
  courseId?: string | null;
  curriculumId?: string | null;
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  type: "COURSE" | "CURRICULUM";
  progressPercent: number;
  status: TrainingProgressStatus;
  effectiveStatus?: TrainingProgressStatus;
  dueAt?: string | null;
  startAt?: string | null;
  completedAt?: string | null;
  estimatedMinutes: number;
  isRequired?: boolean;
  course?: { id: string; title: string; coverImageUrl?: string | null };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    activeBranch?: { id: string; name: string } | null;
  };
  assignedBy?: { id: string; firstName: string; lastName: string } | null;
}

export interface TrainingAssignmentsListDto {
  items: TrainingAssignmentDto[];
  page?: number;
  pageSize?: number;
  total: number;
  totalPages?: number;
  summary?: {
    total: number;
    notStarted: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
}

export type TrainingLaunchStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED";

export type TrainingLaunchAudience = "USERS" | "ROLES" | "BRANCHES" | "TENANT";

export interface TrainingLaunchDto {
  id: string;
  tenantId: string;
  courseId: string;
  name: string;
  status: TrainingLaunchStatus;
  audience: TrainingLaunchAudience;
  targetIds: string[];
  resolvedUserIds: string[];
  nextAudienceIndex: number;
  batchSize: number;
  rolloutIntervalHours: number;
  isRequired: boolean;
  startAt?: string | null;
  dueAt?: string | null;
  nextBatchAt?: string | null;
  launchedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  course: { id: string; title: string; coverImageUrl?: string | null; version: number };
  createdBy?: { id: string; firstName: string; lastName: string } | null;
  metrics: {
    audience: number;
    processed: number;
    assigned: number;
    started: number;
    completed: number;
    overdue: number;
    averageProgress: number;
  };
}

export interface TrainingLaunchListDto {
  items: TrainingLaunchDto[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface TrainingLearningPathDto {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  objective?: string | null;
  targetAudience?: string | null;
  isPublished: boolean;
  pathCourses: Array<{
    id: string;
    courseId: string;
    sortOrder: number;
    isRequired: boolean;
    unlockAfterDays?: number | null;
    course: TrainingCourseDto;
    prerequisiteCourse?: { id: string; title: string } | null;
  }>;
  _count: { assignments: number };
}

export interface TrainingOnboardingRuleDto {
  id: string;
  name: string;
  dueDays: number;
  isRequired: boolean;
  isActive: boolean;
  jobTitlePattern?: string | null;
  roleCode?: string | null;
  onboardingTemplate?: { id: string; name: string; version: number } | null;
  branch?: { id: string; name: string } | null;
  curriculum?: { id: string; title: string } | null;
  course?: { id: string; title: string } | null;
}

export interface LearnerTrainingLessonDto extends TrainingLessonDto {
  completed: boolean;
  completedAt?: string | null;
}

export interface LearnerTrainingCourseDto extends Omit<TrainingCourseDto, "modules"> {
  modules: Array<
    Omit<TrainingCourseModuleDto, "lessons"> & {
      lessons: LearnerTrainingLessonDto[];
    }
  >;
  progress?: {
    progressPercent: number;
    status: TrainingProgressStatus;
    lastActivityAt?: string | null;
  } | null;
  assignment?: TrainingAssignmentDto | null;
  quizSummary?: Array<{
    id: string;
    title: string;
    description?: string | null;
    passingScore: number;
    maxAttempts?: number | null;
    timeLimitMinutes?: number | null;
    questionsCount: number;
    latestAttempt?: TrainingQuizAttemptDto | null;
  }>;
}

export type TrainingQuestionType =
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "TEXT";
export type TrainingQuestionDifficulty = "EASY" | "MEDIUM" | "HARD";
export type TrainingQuizFeedbackMode = "AFTER_SUBMISSION" | "AFTER_PASSING" | "NEVER";

export interface TrainingQuizOptionDto {
  id: string;
  label: string;
  isCorrect?: boolean;
}

export interface TrainingQuizQuestionDto {
  id: string;
  prompt: string;
  questionType: TrainingQuestionType;
  explanation?: string | null;
  points: number;
  requiresManualGrading: boolean;
  category?: string | null;
  difficulty: TrainingQuestionDifficulty;
  tags: string[];
  rubric?: Record<string, unknown> | null;
  sortOrder: number;
  options: TrainingQuizOptionDto[];
}

export interface TrainingQuizDto {
  id: string;
  courseId: string;
  title: string;
  description?: string | null;
  passingScore: number;
  maxAttempts?: number | null;
  timeLimitMinutes?: number | null;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  randomQuestionCount?: number | null;
  cooldownMinutes?: number | null;
  availableFrom?: string | null;
  availableUntil?: string | null;
  requireAllQuestions: boolean;
  feedbackMode: TrainingQuizFeedbackMode;
  rubric?: Record<string, unknown> | null;
  course?: { id: string; title: string; status?: string };
  questions: TrainingQuizQuestionDto[];
  _count?: { attempts: number };
  readiness?: { ready: boolean; errors: string[] };
}

export interface TrainingQuestionBankItemDto {
  id: string;
  prompt: string;
  questionType: TrainingQuestionType;
  explanation?: string | null;
  points: number;
  requiresManualGrading: boolean;
  category?: string | null;
  difficulty: TrainingQuestionDifficulty;
  tags: string[];
  rubric?: Record<string, unknown> | null;
  options: Array<{ label: string; isCorrect: boolean }>;
  updatedAt: string;
}

export interface TrainingQuizAttemptDto {
  id: string;
  quizId: string;
  startedAt: string;
  expiresAt?: string | null;
  submittedAt?: string | null;
  score?: number | null;
  passed?: boolean | null;
  status: "IN_PROGRESS" | "SUBMITTED" | "PENDING_REVIEW" | "GRADED";
  feedback?: string | null;
  questionIds: string[];
  quiz?: TrainingQuizDto;
  user?: { id: string; firstName: string; lastName: string; email: string };
  answers?: Array<{
    id: string;
    questionId: string;
    textAnswer?: string | null;
    selectedOptionIds: string[];
    isCorrect?: boolean | null;
    awardedPoints?: number | null;
    graderFeedback?: string | null;
    question: TrainingQuizQuestionDto;
  }>;
}

export interface TrainingCertificateDto {
  id: string;
  certificateNumber: string;
  verificationCode: string;
  certificateUrl: string;
  issuedAt: string;
  expiresAt?: string | null;
  revokedAt?: string | null;
  revocationReason?: string | null;
  supersededAt?: string | null;
  issuedReason?: "COMPLETION" | "MANUAL" | "RENEWAL";
  policyVersion?: number | null;
  evidenceSnapshot?: Record<string, unknown> | null;
  renewalEligible?: boolean;
  renewedFrom?: { id: string; certificateNumber: string } | null;
  status?: "VALID" | "EXPIRED" | "REVOKED" | "RENEWED";
  user?: { id: string; firstName: string; lastName: string; email: string };
  course?: { id: string; title: string } | null;
  curriculum?: { id: string; title: string } | null;
}

export interface TrainingCertificationPolicyDto {
  id?: string;
  tenantId: string;
  courseId: string;
  isEnabled: boolean;
  autoIssue: boolean;
  requireAssessment: boolean;
  requireAllRequiredLessons: boolean;
  validityDays?: number | null;
  renewalWindowDays: number;
  reminderDays: number[];
  certificateTitle?: string | null;
  certificateDescription?: string | null;
  signatoryName?: string | null;
  signatoryTitle?: string | null;
  badgeImageUrl?: string | null;
  version: number;
}

export interface TrainingCertificationPolicyResponse {
  policy: TrainingCertificationPolicyDto;
  readiness: { ready: boolean; errors: string[] };
}

export interface TrainingCertificationPolicyInput {
  isEnabled: boolean;
  autoIssue: boolean;
  requireAssessment: boolean;
  requireAllRequiredLessons: boolean;
  validityDays?: number;
  renewalWindowDays: number;
  reminderDays: number[];
  certificateTitle?: string;
  certificateDescription?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  badgeImageUrl?: string;
}

export interface PublicTrainingCertificateVerificationDto {
  verificationCode: string;
  certificateNumber: string;
  learnerName: string;
  title?: string | null;
  organization: string;
  issuedAt: string;
  expiresAt?: string | null;
  status: "VALID" | "EXPIRED" | "REVOKED" | "RENEWED";
  revocationReason?: string | null;
}

export interface TrainingAnalyticsDto {
  generatedAt: string;
  period: { from?: string | null; to?: string | null };
  summary: {
    assigned: number;
    uniqueLearners: number;
    completed: number;
    inProgress: number;
    overdue: number;
    averageProgress: number;
    completionRate: number;
    passRate: number;
  };
  byCourse: Array<{
    courseId: string;
    title: string;
    assigned: number;
    completed: number;
    overdue: number;
    averageProgress: number;
    passRate: number;
  }>;
  compliance: Array<{
    assignmentId: string;
    learnerId: string;
    learnerName: string;
    email: string;
    branch: string;
    courseId?: string | null;
    courseTitle: string;
    status: TrainingProgressStatus;
    progressPercent: number;
    dueAt?: string | null;
    completedAt?: string | null;
  }>;
}

export type TrainingIntelligenceRecordType = "ROLE_PROFILE" | "ASSESSMENT" | "CAREER_PLAN" | "FEEDBACK_360" | "ROI" | "FORECAST";

export interface TrainingIntelligenceDto {
  competencyProfiles: number;
  assessments: number;
  gaps: Array<{ userId: string; competencyId: string; score: number; targetScore: number; gap: number }>;
  careerPlans: { total: number; active: number };
  feedback: { responses: number; averageRating: number | null; averageNps: number | null };
  roi: { measurements: number; cost: number; benefit: number; roiPercent: number | null };
  forecasts: Array<{ id: string; cohortKey: string; assigned: number; completed: number; projectedCompletionRate: number; projectedOverdue: number; generatedAt: string }>;
}

export type TrainingImprovementStatus =
  | "OPEN"
  | "PLANNED"
  | "IN_PROGRESS"
  | "VALIDATING"
  | "COMPLETED"
  | "DISMISSED";

export type TrainingImprovementPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type TrainingImprovementSource = "ANALYTICS" | "PILOT" | "QUALITY" | "MANUAL";

export interface TrainingEffectivenessSignalDto {
  code: string;
  severity: "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  detail: string;
  recommendation: string;
  evidence: Record<string, number | string>;
}

export interface TrainingEffectivenessDto {
  generatedAt: string;
  period: { from?: string | null; to?: string | null };
  summary: {
    courses: number;
    averageHealthScore: number;
    criticalSignals: number;
    openSignals: number;
  };
  courses: Array<{
    courseId: string;
    title: string;
    version: number;
    healthScore: number;
    confidence: "LOW" | "MEDIUM" | "HIGH";
    metrics: {
      assigned: number;
      started: number;
      completed: number;
      overdue: number;
      startRate: number;
      completionRate: number;
      overdueRate: number;
      attempts: number;
      passRate: number;
      averageScore?: number | null;
      averageCompletionDays?: number | null;
      averagePilotRating?: number | null;
      blockingIssues: number;
      launchAudience: number;
      launchProcessed: number;
    };
    lessonJourney: Array<{
      lessonId: string;
      title: string;
      completed: number;
      completionRate: number;
      dropOffRate: number;
    }>;
    signals: TrainingEffectivenessSignalDto[];
  }>;
}

export interface TrainingCourseImprovementDto {
  id: string;
  tenantId: string;
  courseId: string;
  title: string;
  description?: string | null;
  status: TrainingImprovementStatus;
  priority: TrainingImprovementPriority;
  source: TrainingImprovementSource;
  signalCode?: string | null;
  evidence?: Record<string, unknown> | null;
  dueAt?: string | null;
  outcomeNotes?: string | null;
  completedAt?: string | null;
  createdAt: string;
  course: { id: string; title: string; version: number };
  owner?: { id: string; firstName: string; lastName: string; email: string } | null;
  createdBy?: { id: string; firstName: string; lastName: string } | null;
}

export type TrainingOperationKind =
  | "PROCESS_DUE_COURSES"
  | "PROCESS_DUE_LAUNCHES"
  | "RECOVER_WEBHOOKS"
  | "RETRY_FAILED_WEBHOOKS"
  | "CLEAR_STALE_LAUNCH_LOCKS";

export interface TrainingOperationsDto {
  generatedAt: string;
  health: {
    score: number;
    status: "HEALTHY" | "WARNING" | "CRITICAL";
    critical: number;
    warning: number;
  };
  checks: Array<{
    code: string;
    label: string;
    status: "HEALTHY" | "WARNING" | "CRITICAL";
    count: number;
    ageMinutes: number;
    targetMinutes: number;
  }>;
  counters: {
    dueCourses: number;
    dueLaunches: number;
    staleLaunchLocks: number;
    failedWebhooks: number;
    pendingWebhooks: number;
  };
  runs: Array<{
    id: string;
    kind: TrainingOperationKind;
    status: "RUNNING" | "SUCCEEDED" | "FAILED";
    result?: Record<string, unknown> | null;
    error?: string | null;
    startedAt: string;
    completedAt?: string | null;
    durationMs?: number | null;
    actor?: { id: string; firstName: string; lastName: string; email: string } | null;
  }>;
  audit: Array<{
    id: string;
    action?: string | null;
    route: string;
    method: string;
    statusCode: number;
    email?: string | null;
    correlationId?: string | null;
    createdAt: string;
  }>;
}

export interface TrainingCompliancePolicyDto {
  id: string;
  tenantId: string;
  courseId: string;
  isActive: boolean;
  dueDays: number;
  renewalDays?: number | null;
  reminderDays: number[];
  course: { id: string; title: string; status?: string };
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

export interface PublicVacancyDto {
  id: string;
  branchId?: string;
  requisitionId?: string | null;
  clonedFromVacancyId?: string | null;
  title: string;
  imageUrl?: string | null;
  status?: "DRAFT" | "OPEN" | "PUBLISHED" | "PAUSED" | "CLOSED" | "FILLED" | "ARCHIVED" | string | null;
  summary?: string | null;
  description?: string | null;
  requirements?: string | null;
  responsibilities?: string | null;
  benefits?: string | null;
  city?: string | null;
  country?: string | null;
  department?: string | null;
  seniority?: string | null;
  workMode?: string | null;
  employmentType?: string | null;
  openings?: number | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string | null;
  applicationFormSchema?: VacancyApplicationFormSchema | null;
  tenant?: { id: string; name: string; slug: string } | null;
  branch?: { id: string; name: string; location?: string | null } | null;
  locations?: Array<{ id: string; branchId: string; city?: string | null; country?: string | null; isPrimary: boolean; branch: { id: string; name: string; location?: string | null } }>;
  requisition?: { id: string; title: string; status: PersonnelRequisitionStatus } | null;
  stages?: VacancyStageDto[];
  responsibles?: VacancyResponsibleDto[];
}

export type VacancyApplicationFieldType = "TEXT" | "TEXTAREA" | "URL" | "NUMBER" | "SINGLE_SELECT" | "MULTI_SELECT" | "BOOLEAN";
export interface VacancyApplicationField { key: string; label: string; type: VacancyApplicationFieldType; required?: boolean; placeholder?: string; helperText?: string; options?: string[]; }
export interface VacancyApplicationSection { id?: string; title?: string; description?: string; fields: VacancyApplicationField[]; }
export interface VacancyApplicationFormSchema { version?: number; sections?: VacancyApplicationSection[]; fields?: VacancyApplicationField[]; }

export interface PublicVacancyListDto {
  data: PublicVacancyDto[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

export interface PublicApplicationInput {
  fullName: string;
  email: string;
  phone?: string;
  city?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  coverLetter?: string;
  dynamicResponses?: Record<string, unknown>;
}

export interface PublicApplicationReceipt {
  id: string;
  vacancyId: string;
  status: string;
  appliedAt?: string | null;
  createdAt?: string | null;
}

export interface CreateVacancyInput {
  branchId: string;
  locationBranchIds?: string[];
  requisitionId?: string;
  title: string;
  imageUrl?: string;
  summary?: string;
  description?: string;
  requirements?: string;
  responsibilities?: string;
  benefits?: string;
  city?: string;
  country?: string;
  department?: string;
  seniority?: string;
  workMode?: "REMOTE" | "HYBRID" | "ONSITE";
  employmentType?: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "TEMPORARY" | "INTERNSHIP";
  openings?: number;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  applicationFormSchema?: VacancyApplicationFormSchema;
  status?: "DRAFT" | "PUBLISHED" | "OPEN" | "PAUSED" | "CLOSED" | "FILLED" | "ARCHIVED";
}

export type PersonnelRequisitionStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "CANCELLED";
export interface PersonnelRequisitionInput {
  title: string;
  department?: string;
  justification: string;
  openings: number;
  budgetMin?: number;
  budgetMax?: number;
  currency: string;
  targetStartDate?: string;
  branchIds: string[];
  approverUserIds: string[];
  status: "DRAFT" | "PENDING_APPROVAL";
}
export interface PersonnelRequisitionDto extends Omit<PersonnelRequisitionInput, "status"> {
  id: string;
  status: PersonnelRequisitionStatus;
  submittedAt?: string | null;
  decidedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  requestedBy: { id: string; firstName: string; lastName: string; email: string };
  locations: Array<{ id: string; branchId: string; isPrimary: boolean; branch: { id: string; name: string; location?: string } }>;
  approvals: Array<{ id: string; approverUserId: string; status: "PENDING" | "APPROVED" | "REJECTED"; note?: string | null; approver: { id: string; firstName: string; lastName: string; email: string } }>;
  vacancies: Array<{ id: string; title: string; status: string }>;
}
export interface VacancyChangeEventDto {
  id: string;
  type: "CREATED" | "UPDATED" | "STATUS_CHANGED" | "CLONED" | "REQUISITION_LINKED" | "LOCATION_CHANGED";
  reason?: string | null;
  previousValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  createdAt: string;
  actor?: { id: string; firstName: string; lastName: string; email: string } | null;
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

export type ApplicationStatusKey = "SUBMITTED" | "REVIEWING" | "INTERVIEW" | "APPROVED" | "REJECTED" | "TRAINING" | "HIRED" | "WITHDRAWN";
export type ApplicationInterviewType = "PRESENTIAL" | "VIRTUAL" | "PHONE";
export type ApplicationTimelineEventType = "VACANCY_PUBLISHED" | "APPLIED" | "CONTACTED" | "INTERVIEW_SCHEDULED" | "INTERVIEW_RESCHEDULED" | "INTERVIEW_CANCELLED" | "INTERVIEW_COMPLETED" | "STAGE_CHANGE_REQUESTED" | "STAGE_CHANGE_APPROVED" | "STAGE_CHANGE_REJECTED" | "STAGE_CHANGED" | "HIRED" | "APPLICATION_WITHDRAWN" | "SLA_WARNING" | "SLA_ESCALATED" | "SLA_REASSIGNED" | "RECRUITER_ASSIGNED" | "OFFER_CREATED" | "OFFER_APPROVED" | "OFFER_SENT" | "OFFER_COUNTERED" | "OFFER_ACCEPTED" | "OFFER_REJECTED" | "OFFER_EXPIRED";

export interface ApplicationCandidateDto {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  resumeUrl?: string | null;
  resumeAvailable?: boolean;
  resumeFile?: { id: string; version: number; originalName: string; mimeType: string; sizeBytes: number } | null;
  createdAt: string;
  updatedAt: string;
}

export type TalentActivityType = "NOTE" | "EMAIL" | "CALL" | "MEETING" | "TASK" | "STATUS_CHANGE" | "POOL_CHANGE" | "TAG_CHANGE" | "MERGE";

export interface TalentPoolDto {
  id: string;
  tenantId: string;
  branchId?: string | null;
  name: string;
  description?: string | null;
  color?: string | null;
  isActive: boolean;
  memberCount?: number;
  branch?: { id: string; name: string } | null;
}

export interface TalentTagDto {
  id: string;
  tenantId: string;
  name: string;
  color?: string | null;
  isActive: boolean;
  _count?: { candidates: number };
}

export interface TalentActivityDto {
  id: string;
  type: TalentActivityType;
  subject: string;
  description?: string | null;
  dueAt?: string | null;
  completedAt?: string | null;
  actorId: string;
  createdAt: string;
}

export interface TalentCandidateDto {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  source?: string | null;
  doNotContact: boolean;
  crmStatus: "ACTIVE" | "MERGED" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
  applications: Array<{ id: string; status: ApplicationStatusKey; appliedAt: string; vacancy: { id: string; title: string; branchId: string; branch?: { id: string; name: string } | null }; currentStage?: { id: string; code: string; name: string } | null }>;
  tags: TalentTagDto[];
  pools: TalentPoolDto[];
  talentActivities: TalentActivityDto[];
  resumeFile?: { id: string; version: number; originalName: string } | null;
  mergeHistory: Array<{ id: string; sourceCandidateId: string; targetCandidateId: string; reason: string; movedApplications: number; movedFiles: number; createdAt: string }>;
}

export interface TalentCandidateListDto {
  data: TalentCandidateDto[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

export interface TalentCampaignDto {
  id: string;
  name: string;
  subject: string;
  status: "DRAFT" | "SCHEDULED" | "RUNNING" | "COMPLETED" | "CANCELLED";
  audiencePreparedAt?: string | null;
  audienceReviewedAt?: string | null;
  audienceReviewedById?: string | null;
  audienceReviewNote?: string | null;
  audienceFingerprint?: string | null;
  createdAt: string;
  segment: { id: string; name: string };
  _count: { recipients: number };
}

export interface TalentCampaignAudienceDto {
  data: Array<{ id: string; status: "PENDING" | "QUEUED" | "SKIPPED"; skipReason?: string | null; candidate: { id: string; fullName: string; email: string } }>;
  meta: { total: number; page: number; pageSize: number; totalPages: number };
  summary: { eligible: number; excluded: number };
  review: { audiencePreparedAt?: string | null; audienceReviewedAt?: string | null; audienceFingerprint?: string | null; audienceReviewNote?: string | null };
}

export interface DuplicateCandidateMatchDto {
  id: string;
  score: number;
  signals: string[];
  source: { id: string; fullName: string; email: string; phone?: string | null; city?: string | null; applications: number; updatedAt: string };
  target: { id: string; fullName: string; email: string; phone?: string | null; city?: string | null; applications: number; updatedAt: string };
  conflictingVacancyIds: string[];
}

export interface ApplicationVacancyDto extends PublicVacancyDto {
  id: string;
  branchId: string;
  branch?: { id: string; name: string; location?: string | null } | null;
  stages: VacancyStageDto[];
}

export interface ApplicationTimelineEventDto {
  id?: string;
  type: ApplicationTimelineEventType;
  at?: string | null;
  note?: string | null;
  actorType?: string;
  actorId?: string | null;
  actorDisplayName?: string | null;
  previousValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  reason?: string | null;
  source?: string;
  immutable?: boolean;
}

export interface VacancyApplicationDto {
  id: string;
  tenantId: string;
  vacancyId: string;
  candidateId: string;
  currentStageId?: string | null;
  status: ApplicationStatusKey;
  currentStage?: VacancyStageDto | null;
  stageEnteredAt?: string;
  stageDueAt?: string | null;
  isStageOverdue?: boolean;
  rejectionReason?: string | null;
  structuredRejectionReason?: RejectionReasonDto | null;
  assignedRecruiter?: { id: string; firstName: string; lastName: string; email: string } | null;
  sla?: { warningSentAt?: string | null; escalatedAt?: string | null; reassignedAt?: string | null };
  pendingTransitions?: ApplicationStageTransitionRequestDto[];
  coverLetter?: string | null;
  dynamicResponses?: Record<string, unknown> | null;
  notes?: string | null;
  interview?: { type?: ApplicationInterviewType | null; scheduledAt?: string | null; followUpAt?: string | null; observations?: string | null } | null;
  tracking?: { contactedAt?: string | null; interviewCompletedAt?: string | null; timelineEvents?: ApplicationTimelineEventDto[] | null } | null;
  interviews?: RecruitmentInterviewDto[];
  appliedAt: string;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  candidate: ApplicationCandidateDto;
  vacancy: ApplicationVacancyDto;
}

export type VacancyResponsibleRole = "OWNER" | "RECRUITER" | "HIRING_MANAGER" | "INTERVIEWER";
export type RecruitmentInterviewStatus = "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELED" | "NO_SHOW";
export type InterviewRecommendation = "STRONG_YES" | "YES" | "MIXED" | "NO";
export type CalendarProvider = "GOOGLE" | "MICROSOFT" | "ZOOM";
export type VideoConferenceProvider = "NONE" | "GOOGLE_MEET" | "MICROSOFT_TEAMS" | "ZOOM" | "MANUAL";
export type CalendarSyncStatus = "NOT_CONNECTED" | "PENDING" | "SYNCED" | "FAILED" | "CANCELLED";

export interface VacancyStageDto {
  id?: string;
  code: string;
  name: string;
  position: number;
  color?: string | null;
  applicationStatus: ApplicationStatusKey;
  isTerminal?: boolean;
  allowedNextStageCodes?: string[];
  requiredFields?: string[];
  requiresApproval?: boolean;
  requiredApprovals?: number;
  allowReopen?: boolean;
  slaHours?: number | null;
  slaWarningHoursBefore?: number;
  slaEscalationHours?: number;
  autoReassignAfterHours?: number | null;
}

// Read responses can include persistence metadata; vacancy writes must only use editable fields.
export type VacancyStageInput = Pick<
  VacancyStageDto,
  "code" | "name" | "position" | "color" | "applicationStatus" | "isTerminal" |
  "allowedNextStageCodes" | "requiredFields" | "requiresApproval" | "requiredApprovals" |
  "allowReopen" | "slaHours" | "slaWarningHoursBefore" | "slaEscalationHours" |
  "autoReassignAfterHours"
>;

export interface ApplicationStageTransitionRequestDto {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  requestedByUserId: string;
  requiredApprovals: number;
  reason?: string | null;
  requestedAt: string;
  fromStage?: VacancyStageDto | null;
  toStage: VacancyStageDto;
  approvals: Array<{
    id: string;
    reviewerUserId: string;
    approved: boolean;
    note?: string | null;
    decidedAt: string;
  }>;
}

export interface VacancyResponsibleDto {
  id?: string;
  userId: string;
  role: VacancyResponsibleRole;
  user?: { id: string; firstName: string; lastName: string; email: string };
}

export interface VacancySetupDto extends PublicVacancyDto {
  stages: VacancyStageDto[];
  responsibles: VacancyResponsibleDto[];
}

export interface InterviewScorecardRecordDto {
  id: string;
  overallRating: number;
  weightedScore?: number | string | null;
  recommendation: InterviewRecommendation;
  criteria: Record<string, unknown>;
  status?: "DRAFT" | "SIGNED";
  signedAt?: string | null;
  signatureHash?: string | null;
  strengths?: string | null;
  concerns?: string | null;
  comments?: string | null;
  submittedAt: string;
  reviewer?: { id: string; firstName: string; lastName: string };
  signedBy?: { id: string; firstName: string; lastName: string } | null;
  template?: { id: string; name: string; version: number } | null;
  responses?: ScorecardResponseDto[];
}

export type ScorecardCriterionType = "RATING" | "TEXT" | "BOOLEAN";

export interface ScorecardCriterionDto {
  id: string;
  key: string;
  label: string;
  description?: string | null;
  competencyCode?: string | null;
  competencyName?: string | null;
  type: ScorecardCriterionType;
  weight: number;
  isRequired: boolean;
  requiresEvidence: boolean;
  ratingAnchors?: Record<string, string> | null;
  sortOrder: number;
}

export interface ScorecardTemplateDto {
  id: string;
  vacancyId?: string | null;
  stageId?: string | null;
  name: string;
  instructions?: string | null;
  scope?: "VACANCY" | "TENANT";
  feedbackVisibility?: "IMMEDIATE" | "AFTER_OWN_SUBMISSION" | "AFTER_ALL_SUBMITTED" | "HIRING_MANAGER_ONLY";
  version: number;
  isActive: boolean;
  stage?: VacancyStageDto | null;
  criteria: ScorecardCriterionDto[];
}

export interface ScorecardResponseDto {
  id?: string;
  criterionId: string;
  criterionKey?: string;
  criterionLabel?: string;
  competencyCode?: string | null;
  competencyName?: string | null;
  criterionType?: ScorecardCriterionType;
  weight?: number;
  rating?: number | null;
  textValue?: string | null;
  booleanValue?: boolean | null;
  evidence?: string | null;
}

export interface ScorecardComparisonDto {
  evaluatorCount: number;
  feedbackLocked?: boolean;
  visibility?: ScorecardTemplateDto["feedbackVisibility"];
  evaluatorScores: Array<{
    reviewer: { id: string; firstName: string; lastName: string };
    weightedScore: number;
    overallRating: number;
    recommendation: InterviewRecommendation;
    signedAt?: string | null;
  }>;
  criteria: Array<{
    key: string;
    label?: string | null;
    competencyName?: string | null;
    ratings: number[];
    mean?: number | null;
    min?: number | null;
    max?: number | null;
    spread?: number | null;
  }>;
  biasSignals: Array<{
    code: string;
    severity: "LOW" | "MEDIUM" | "HIGH";
    message: string;
    reviewerUserId?: string;
    criterionKey?: string;
  }>;
  disclaimer: string;
}

export interface ScorecardContextDto {
  template?: ScorecardTemplateDto | null;
  scorecard?: InterviewScorecardRecordDto | null;
  canEdit: boolean;
  comparisons: ScorecardComparisonDto;
  assignment?: ScorecardEvaluatorAssignmentDto | null;
}

export interface ScorecardCompetencyDto {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  category?: string | null;
  behavioralAnchors?: Record<string, string> | null;
  isActive: boolean;
}

export type AiEvidenceSufficiency = "SUFFICIENT" | "PARTIAL" | "INSUFFICIENT";

export interface AiCompetencyAssessmentItemDto {
  id: string;
  criterionId?: string | null;
  competencyCode: string;
  competencyName: string;
  competencyDefinition?: string | null;
  weight: number;
  aiScore: number | string;
  confidence: number | string;
  sufficiency: AiEvidenceSufficiency;
  explanation: string;
  evidence: Array<{ sourceId: string; sourceLabel: string; quote: string; relevance?: string | null }>;
  missingInformation: string[];
  suggestedQuestions: string[];
  humanScore?: number | string | null;
  reviewerNotes?: string | null;
  reviewerConfirmed: boolean;
}

export interface AiCompetencyAssessmentDto {
  id: string;
  applicationId: string;
  version: number;
  status: "READY_FOR_REVIEW" | "SIGNED";
  provider: string;
  model: string;
  promptVersion: string;
  summary: string;
  generatedAt: string;
  reviewerNotes?: string | null;
  reviewedAt?: string | null;
  signedAt?: string | null;
  signatureHash?: string | null;
  generatedBy: { id: string; firstName: string; lastName: string };
  reviewedBy?: { id: string; firstName: string; lastName: string } | null;
  signedBy?: { id: string; firstName: string; lastName: string } | null;
  items: AiCompetencyAssessmentItemDto[];
}

export interface AiCompetencyAssessmentContextDto {
  assessment?: AiCompetencyAssessmentDto | null;
  guardrail: {
    assistantOnly: true;
    automaticRejection: false;
    changesApplicationStatus: false;
    requiresHumanSignature: true;
    message: string;
  };
  sourceAvailability: {
    coverLetter: boolean;
    applicationAnswers: boolean;
    interviewEvidence: boolean;
    externalAssessments: boolean;
    resumeContent: boolean;
    resumeNotice: string;
  };
}

export interface ScorecardEvaluatorAssignmentDto {
  id: string;
  interviewId: string;
  evaluatorUserId: string;
  criterionIds: string[];
  anonymousReview: boolean;
  evaluator?: { id: string; firstName: string; lastName: string };
}

export interface ExternalAssessmentDto {
  id: string;
  applicationId: string;
  provider: string;
  assessmentType: string;
  status: "DRAFT" | "INVITED" | "IN_PROGRESS" | "COMPLETED" | "EXPIRED" | "CANCELLED" | "ERROR";
  launchUrl?: string | null;
  reportUrl?: string | null;
  score?: number | string | null;
  percentile?: number | string | null;
  consentRecordedAt?: string | null;
  completedAt?: string | null;
}

export interface HiringManagerApprovalDto {
  id: string;
  applicationId: string;
  managerUserId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";
  recommendation?: InterviewRecommendation | null;
  rationale?: string | null;
  decidedAt?: string | null;
  manager: { id: string; firstName: string; lastName: string };
}

export interface EvaluatorCalibrationDto {
  id: string;
  evaluatorUserId: string;
  sampleSize: number;
  meanScore: number | string;
  panelMeanScore: number | string;
  meanDeviation: number | string;
  strictnessIndex: number | string;
  agreementRate: number | string;
  evidenceRate: number | string;
  calculatedAt: string;
  evaluator: { id: string; firstName: string; lastName: string };
}

export interface BiasValidationRunDto {
  id: string;
  methodologyVersion: string;
  populationField: string;
  sampleSize: number;
  selectionRateRatio?: number | string | null;
  effectSize?: number | string | null;
  pValue?: number | string | null;
  status: "INSUFFICIENT_DATA" | "EXPLORATORY" | "VALIDATED" | "REQUIRES_REVIEW";
  limitations: string;
  createdAt: string;
}

export interface HiringDecisionCommitteeDto {
  id: string;
  applicationId: string;
  status: "OPEN" | "DECIDED" | "CANCELLED";
  quorum: number;
  finalDecision?: InterviewRecommendation | null;
  rationale?: string | null;
  decidedAt?: string | null;
  members: Array<{
    id: string;
    userId: string;
    role: "CHAIR" | "MEMBER" | "OBSERVER";
    isRequired: boolean;
    vote?: InterviewRecommendation | null;
    voteRationale?: string | null;
    conflictOfInterestDeclared?: boolean | null;
    recusedAt?: string | null;
    votedAt?: string | null;
    user: { id: string; firstName: string; lastName: string; email: string };
  }>;
  comparisons: ScorecardComparisonDto[];
}

export interface CreateScorecardTemplateInput {
  vacancyId?: string;
  stageId?: string;
  scope?: "VACANCY" | "TENANT";
  feedbackVisibility?: ScorecardTemplateDto["feedbackVisibility"];
  name: string;
  instructions?: string;
  criteria: Array<{
    key: string;
    label: string;
    description?: string | null;
    competencyCode?: string | null;
    competencyName?: string | null;
    competencyId?: string;
    type: ScorecardCriterionType;
    weight: number;
    isRequired?: boolean;
    requiresEvidence?: boolean;
    ratingAnchors?: Record<string, string> | null;
  }>;
}

export interface RecruitmentInterviewDto {
  id: string;
  applicationId?: string;
  title: string;
  type: ApplicationInterviewType;
  timezone: string;
  startsAt: string;
  endsAt: string;
  location?: string | null;
  meetingUrl?: string | null;
  calendarProvider?: CalendarProvider | null;
  videoProvider: VideoConferenceProvider;
  externalEventId?: string | null;
  externalMeetingId?: string | null;
  calendarSyncStatus: CalendarSyncStatus;
  calendarSyncError?: string | null;
  calendarSyncedAt?: string | null;
  notes?: string | null;
  status: RecruitmentInterviewStatus;
  stage?: VacancyStageDto | null;
  interviewer?: { id: string; firstName: string; lastName: string; email?: string };
  application?: VacancyApplicationDto;
  scorecards?: InterviewScorecardRecordDto[];
  sequenceId?: string | null;
  sequenceOrder?: number | null;
  sequence?: { id: string; title: string; status: string } | null;
  participants?: InterviewParticipantDto[];
  resourceBookings?: Array<{ id: string; resource: InterviewResourceDto }>;
}

export type InterviewParticipantRole = "LEAD" | "PANELIST" | "SHADOW";
export type InterviewParticipantStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "SUBSTITUTED";
export interface InterviewParticipantDto {
  id: string;
  userId: string;
  role: InterviewParticipantRole;
  status: InterviewParticipantStatus;
  user: { id: string; firstName: string; lastName: string; email?: string };
}

export interface InterviewResourceDto {
  id: string;
  branchId: string;
  name: string;
  type: "ROOM" | "VIDEO_ROOM" | "EQUIPMENT" | "ACCESSIBILITY";
  capacity: number;
  location?: string | null;
}

export interface InterviewPoolDto {
  id: string;
  branchId?: string | null;
  name: string;
  description?: string | null;
  members: Array<{ id: string; userId: string; defaultRole: InterviewParticipantRole; priority: number; user: { id: string; firstName: string; lastName: string; email: string } }>;
}

export interface InterviewerProfileDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  interviewerProfile?: { trainingStatus: "NOT_STARTED" | "IN_TRAINING" | "SHADOWING" | "CERTIFIED" | "SUSPENDED"; shadowSessionsRequired: number; shadowSessionsCompleted: number; maxInterviewsPerDay: number; maxInterviewsPerWeek: number; autoSubstitutionEnabled: boolean } | null;
}

export interface RecruitmentInterviewListDto {
  data: RecruitmentInterviewDto[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

export interface ScheduleInterviewInput {
  applicationId: string;
  stageId?: string;
  interviewerUserId: string;
  title: string;
  type: ApplicationInterviewType;
  timezone: string;
  startsAt: string;
  endsAt: string;
  location?: string;
  meetingUrl?: string;
  calendarProvider?: CalendarProvider;
  videoProvider?: VideoConferenceProvider;
  allowConflict?: boolean;
  notes?: string;
  participantUserIds?: string[];
  shadowUserIds?: string[];
  poolId?: string;
  resourceIds?: string[];
  sequenceId?: string;
  sequenceOrder?: number;
}

export interface InterviewSchedulingPublicDto {
  title: string;
  type: ApplicationInterviewType;
  timezone: string;
  durationMinutes: number;
  expiresAt: string;
  candidate: { fullName: string };
  vacancy: { title: string };
  slots: Array<{ startsAt: string; endsAt: string }>;
}

export interface CalendarConnectionDto {
  id: string;
  provider: CalendarProvider;
  status: "ACTIVE" | "EXPIRED" | "REVOKED" | "ERROR";
  externalEmail?: string | null;
  scopes: string[];
  tokenExpiresAt?: string | null;
  lastSyncedAt?: string | null;
  lastError?: string | null;
}

export interface CalendarProviderConfigurationDto {
  provider: CalendarProvider;
  configured: boolean;
}

export interface InterviewerAvailabilityDto {
  interviewerUserId: string;
  timezone: string;
  busy: Array<{ startsAt: string; endsAt: string; source: "ATS" | "GOOGLE" | "MICROSOFT" }>;
  slots: Array<{ startsAt: string; endsAt: string }>;
}

export interface AvailabilitySettingsDto {
  id?: string;
  timezone: string;
  weeklySchedule: Record<string, Array<{ start: string; end: string }>>;
  bufferMinutes: number;
  minNoticeHours: number;
}

export type AtsCommunicationType = "APPLICATION_CONFIRMATION" | "STAGE_UPDATE" | "REJECTION" | "INTERVIEW_SCHEDULED" | "INTERVIEW_REMINDER" | "INTERVIEW_RESCHEDULED" | "INTERVIEW_CANCELLED" | "OFFER" | "APPROVAL_REQUEST" | "MANUAL";
export type AtsCommunicationAudience = "CANDIDATE" | "RESPONSIBLE";
export type AtsMessageStatus = "PENDING" | "PROCESSING" | "DELIVERED" | "FAILED" | "DEAD_LETTER" | "CANCELLED" | "SKIPPED";

export type JobOfferStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "SENT" | "COUNTERED" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "CANCELLED";
export type CompensationPeriodicity = "HOURLY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "ANNUAL";
export type JobOfferApprovalType = "FINANCIAL" | "MANAGERIAL";

export interface JobOfferVersionDto {
  id: string;
  version: number;
  source: "EMPLOYER" | "CANDIDATE";
  salaryAmount: string | number;
  currency: string;
  periodicity: CompensationPeriodicity;
  benefits?: string[] | null;
  jobTitle: string;
  employmentStartDate: string;
  validUntil: string;
  message?: string | null;
  counterproposalReason?: string | null;
  pdfSha256?: string | null;
  pdfGeneratedAt?: string | null;
  createdAt: string;
  signaturePackage?: {
    id: string;
    status: string;
    signedAt?: string | null;
    participants: Array<{ id: string; status: string; signedAt?: string | null }>;
  } | null;
}

export interface JobOfferDto {
  id: string;
  applicationId: string;
  branchId: string;
  status: JobOfferStatus;
  currentVersion: number;
  financialApproverId?: string | null;
  managerialApproverId?: string | null;
  acceptedAt?: string | null;
  rejectedAt?: string | null;
  expiredAt?: string | null;
  conversionWorkflowId?: string | null;
  conversionError?: string | null;
  createdAt: string;
  application: {
    candidate: { id: string; fullName: string; email: string };
    vacancy: { id: string; title: string; branchId: string; tenant?: { name: string } };
  };
  versions: JobOfferVersionDto[];
  approvals: Array<{
    id: string;
    version: number;
    type: JobOfferApprovalType;
    status: "PENDING" | "APPROVED" | "REJECTED";
    approverId?: string | null;
    decidedById?: string | null;
    notes?: string | null;
    decidedAt?: string | null;
  }>;
}

export interface CreateJobOfferInput {
  salaryAmount: number;
  currency: string;
  periodicity: CompensationPeriodicity;
  benefits?: string[];
  jobTitle: string;
  employmentStartDate: string;
  validUntil: string;
  message?: string;
  financialApproverId?: string;
  managerialApproverId?: string;
}

export interface AtsCommunicationTemplateDto {
  id: string;
  vacancyId?: string | null;
  stageCode?: string | null;
  type: AtsCommunicationType;
  audience: AtsCommunicationAudience;
  name: string;
  subject: string;
  body: string;
  version: number;
  isActive: boolean;
  createdAt: string;
}

export interface AtsMessageDto {
  id: string;
  eventKey?: string;
  type: AtsCommunicationType;
  audience: AtsCommunicationAudience;
  direction?: "OUTBOUND" | "INBOUND";
  channel?: "EMAIL";
  senderEmail?: string | null;
  recipientEmail: string;
  recipientName?: string | null;
  subject: string;
  body: string;
  status: AtsMessageStatus;
  readAt?: string | null;
  deliveredAt?: string | null;
  inReplyToMessageId?: string | null;
  internetMessageId?: string | null;
  scheduledAt: string;
  createdAt: string;
  template?: { id: string; name: string; version: number } | null;
  notification?: {
    deliveries: Array<{
      id: string;
      channel: "INTERNAL" | "EMAIL";
      status: AtsMessageStatus;
      attempts: number;
      maxAttempts: number;
      nextAttemptAt?: string | null;
      deliveredAt?: string | null;
      openedAt?: string | null;
      clickedAt?: string | null;
      bouncedAt?: string | null;
      complainedAt?: string | null;
      unsubscribedAt?: string | null;
      lastError?: string | null;
      providerMessageId?: string | null;
    }>;
  } | null;
  attachments?: Array<{ id: string; filename: string; mimeType: string; sizeBytes?: number | null; disposition?: string | null }>;
  application?: VacancyApplicationDto;
}

export type AtsConversationStatus = "OPEN" | "PENDING" | "CLOSED";

export interface AtsConversationDto {
  id: string;
  applicationId: string;
  status: AtsConversationStatus;
  assignedUserId?: string | null;
  unreadCount: number;
  lastMessageAt: string;
  lastInboundAt?: string | null;
  lastOutboundAt?: string | null;
  snoozedUntil?: string | null;
  archivedAt?: string | null;
  closedAt?: string | null;
  application: {
    id: string;
    status: ApplicationStatusKey;
    candidate: ApplicationCandidateDto;
    vacancy: ApplicationVacancyDto;
    assignedRecruiter?: { id: string; firstName: string; lastName: string; email: string } | null;
  };
  messages: AtsMessageDto[];
}

export interface AtsConversationListDto {
  data: AtsConversationDto[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
  summary: { unreadConversations: number; openConversations: number; unmatched: number };
}

export interface AtsUnmatchedInboundDto {
  id: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  body: string;
  occurredAt: string;
  attachments?: Array<{ id: string; filename: string; content_type: string; size?: number }> | null;
}

export interface CommunicationDomainDto {
  id: string;
  domain: string;
  fromName: string;
  fromEmail: string;
  replyToEmail?: string | null;
  dkimSelector: string;
  status: "PENDING" | "VERIFIED" | "FAILED";
  spfVerified: boolean;
  dkimVerified: boolean;
  dmarcVerified: boolean;
  reputationScore?: number | string | null;
  deliveryRate?: number | string | null;
  bounceRate?: number | string | null;
  complaintRate?: number | string | null;
  lastCheckedAt?: string | null;
}

export interface CreateAtsCommunicationTemplateInput {
  vacancyId?: string;
  stageCode?: string;
  type: AtsCommunicationType;
  audience: AtsCommunicationAudience;
  name: string;
  subject: string;
  body: string;
  isActive?: boolean;
}

export interface CandidateSessionDto {
  accessToken: string;
  expiresIn: number;
  candidate: CandidatePortalProfileDto;
}

export interface CandidatePortalProfileDto {
  id: string;
  email: string;
  fullName?: string | null;
  phone?: string | null;
  city?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  locale: "es" | "en";
  timezone: string;
  statusUpdates: boolean;
  interviewReminders: boolean;
  offerNotifications: boolean;
  marketingConsent: boolean;
  profileSource: string;
  externalIdentities?: Array<{ provider: string }>;
}

export interface CandidatePortalOverviewDto {
  communications: Array<{ id: string; applicationId: string; type: string; direction?: "INBOUND" | "OUTBOUND" | string; subject: string; body: string; status: string; deliveredAt?: string | null; readAt?: string | null; createdAt: string }>;
  offers: Array<{ id: string; applicationId: string; type: string; subject: string; body: string; status: string; deliveredAt?: string | null; createdAt: string }>;
  resumes: Array<{ id: string; applicationId?: string | null; version: number; status: string; originalName: string; mimeType: string; sizeBytes: number; createdAt: string }>;
  signatureDocuments: Array<{ id: string; status: string; signedAt?: string | null; tokenExpiresAt?: string | null; createdAt: string; signaturePackage: { id: string; title: string; status: string; dueDate?: string | null; sentAt?: string | null } }>;
  privacyRequests: Array<{ id: string; type: "EXPORT" | "ANONYMIZE" | "DELETE"; status: "PENDING" | "PROCESSING" | "COMPLETED" | "REJECTED" | "CANCELLED"; reason?: string | null; response?: string | null; requestedAt: string }>;
  supportRequests: Array<{ id: string; subject: string; message: string; status: string; response?: string | null; requestedAt: string }>;
}

export interface CandidatePreboardingDto {
  id: string;
  employee: { name: string; jobTitle?: string | null; email: string };
  status: string;
  readinessStatus?: string | null;
  startedAt: string;
  progressPercent: number;
  tasks: Array<{ id: string; title: string; description?: string | null; status: string; ownerType: string; dueDate?: string | null; required: boolean }>;
  documents: Array<{ id: string; originalName: string; status: string; createdAt: string; category: string }>;
  signatures: Array<{ id: string; title: string; status: string; dueDate?: string | null }>;
}

export interface ParsedResumeDto {
  fields: { fullName?: string; email?: string; phone?: string; linkedinUrl?: string };
  textPreview: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  requiresReview: boolean;
}

export interface VacancyApplicationListDto {
  data: VacancyApplicationDto[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

export interface ApplicationFilters {
  search?: string;
  status?: string;
  currentStageId?: string;
  vacancyId?: string;
  branchId?: string;
  assignedRecruiterId?: string;
  rejectionReasonId?: string;
  appliedFrom?: string;
  appliedTo?: string;
  overdueOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ApplicationSavedViewDto {
  id: string;
  name: string;
  filters: ApplicationFilters;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceViewDto {
  id: string;
  tenantId: string;
  userId: string;
  module: string;
  screen: string;
  workspaceKey: string | null;
  name: string;
  config: Record<string, unknown>;
  isShared: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RejectionReasonDto {
  id: string;
  code: string;
  label: string;
  category: "QUALIFICATIONS" | "EXPERIENCE" | "COMPENSATION" | "AVAILABILITY" | "LOCATION" | "CULTURE" | "CANDIDATE_DECISION" | "POSITION_CLOSED" | "DUPLICATE" | "OTHER";
}

export interface UpdateApplicationInput {
  status?: ApplicationStatusKey;
  currentStageId?: string;
  reason?: string;
  rejectionReasonId?: string;
  notes?: string;
  expectedUpdatedAt?: string;
  interview?: { type: ApplicationInterviewType; scheduledAt?: string | null; followUpAt?: string | null; observations?: string | null } | null;
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

export type NoCodeAutomationScope = "TENANT" | "BRANCH";
export type NoCodeAutomationTrigger =
  | "CANDIDATE_HIRED"
  | "APPLICATION_STAGE_CHANGED"
  | "APPLICATION_REJECTED"
  | "INTERVIEW_SCHEDULED"
  | "INTERVIEW_COMPLETED"
  | "EMPLOYEE_BRANCH_CHANGED"
  | "EMPLOYEE_OFFBOARDING_STARTED"
  | "ONBOARDING_COMPLETED"
  | "INVENTORY_ASSET_ASSIGNED"
  | "TRAINING_COMPLETED"
  | "OPERATION_HANDOFF_COMPLETED"
  | "COMPLIANCE_CLOSED";
export type NoCodeAutomationActionType =
  | "CREATE_ONBOARDING"
  | "ASSIGN_ASSET"
  | "PROVISION_ACCESS"
  | "ACTIVATE_TRAINING"
  | "CREATE_POLICY_CHECK"
  | "MARK_WORKFLOW_STAGE"
  | "NOTIFY_ACTOR"
  | "ARCHIVE_RECORD"
  | "REVOKE_ACCESS";
export type NoCodeAutomationExecutionStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "PARTIAL";
export type NoCodeAutomationCondition = {
  field: string;
  operator: "equals" | "not_equals" | "in" | "not_in" | "exists";
  value?: string | number | boolean | null;
  values?: Array<string | number | boolean>;
};
export type NoCodeAutomationAction = {
  type: NoCodeAutomationActionType;
  stepKey?: string;
  title?: string;
  message?: string;
  ownerLabel?: string;
  itemId?: string;
  courseId?: string;
  curriculumId?: string;
  quantity?: number;
  policyCode?: string;
  dueDate?: string;
  payload?: Record<string, unknown>;
};
export interface NoCodeAutomationRuleDto {
  id: string;
  tenantId: string;
  branchId: string | null;
  name: string;
  triggerEvent: NoCodeAutomationTrigger;
  scope: NoCodeAutomationScope;
  conditions: NoCodeAutomationCondition[] | null;
  consequences: NoCodeAutomationAction[];
  enabled: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}
export interface NoCodeAutomationCatalogDto {
  triggers: Array<{ value: NoCodeAutomationTrigger; label: string; description: string; fields: Array<{ value: string; label: string }> }>;
  conditionOperators: Array<{ value: NoCodeAutomationCondition["operator"]; label: string }>;
  actions: Array<{ value: NoCodeAutomationActionType; label: string; description: string; fields: string[] }>;
  scopes: Array<{ value: NoCodeAutomationScope; label: string }>;
  workflowStages: Array<{ value: string; label: string }>;
}
export interface NoCodeAutomationTemplateDto {
  key: string;
  name: string;
  description: string;
  triggerEvent: NoCodeAutomationTrigger;
  conditions: NoCodeAutomationCondition[];
  consequences: NoCodeAutomationAction[];
}
export interface NoCodeAutomationExecutionDto {
  id: string;
  branchId: string | null;
  triggerEvent: NoCodeAutomationTrigger;
  status: NoCodeAutomationExecutionStatus;
  result: string | null;
  startedAt: string;
  completedAt: string | null;
  rule: NoCodeAutomationRuleDto;
  employee?: { id: string; name: string } | null;
  candidate?: { id: string; fullName: string } | null;
  steps: Array<{ id: string; consequence: NoCodeAutomationActionType; status: string; result: string | null }>;
  auditTrail: Array<{ id: string; status: string; summary: string; occurredAt: string }>;
}
export interface NoCodeAutomationSimulationDto {
  matched: boolean;
  willExecute: boolean;
  message: string;
  conditions: Array<{ condition: NoCodeAutomationCondition; currentValue: unknown; matches: boolean }>;
  actions: Array<{ position: number; type: NoCodeAutomationActionType; valid: { ok: boolean; reason: string | null } }>;
}
export interface NoCodeAutomationOperationsOverviewDto {
  generatedAt: string;
  periodHours: number;
  rules: { active: number; total: number };
  executions: {
    total: number;
    completed: number;
    failed: number;
    inProgress: number;
    successRate: number;
    oldestPendingAt: string | null;
  };
  capacity: { ruleBatchLimit: number; retryBatchLimit: number; outboxMaxAttempts: number };
  topRules: Array<{ id: string; name: string; executions: number }>;
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

export type OnboardingTaskStatus = "PENDING" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED" | "CANCELLED";
export type OnboardingOwnerType = "SYSTEM" | "USER" | "EMPLOYEE" | "CANDIDATE" | "BRANCH" | "INVENTORY" | "TRAINING" | "ACCESS" | "SIGNATURE" | "ONBOARDING" | "PRODUCTIVITY";

export interface OnboardingTemplateTaskConfigDto {
  id?: string;
  taskKey: string;
  taskType: "DOCUMENT_COLLECTION" | "POLICY_REVIEW" | "MANAGER_CHECKLIST" | "HR_CHECKLIST" | "DAY_ONE_READINESS" | "ASSET_DELIVERY";
  title: string;
  description?: string | null;
  ownerType?: OnboardingOwnerType;
  ownerId?: string | null;
  dueOffsetDays?: number | null;
  dependsOnKeys?: string[];
  required?: boolean;
  sortOrder?: number;
}

export interface OnboardingTemplateDto {
  id: string;
  name: string;
  description?: string | null;
  version: number;
  isDefault: boolean;
  isActive?: boolean;
  status?: "DRAFT" | "PUBLISHED";
  effectiveFrom?: string;
  approvedAt?: string | null;
  approvedById?: string | null;
  supersedesId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  tasks: OnboardingTemplateTaskConfigDto[];
}

export interface OnboardingLibraryItemDto { id: string; type: "TASK" | "DOCUMENT" | "POLICY"; name: string; description?: string | null; content: Record<string, unknown>; countryCode?: string | null; isActive: boolean; }
export interface OnboardingRetentionPolicyDto { id: string; countryCode: string; documentCategory: string; retentionDays: number; legalBasis?: string | null; isActive: boolean; legalReviewStatus?: "DRAFT" | "APPROVED"; }
export interface OnboardingSignatureEvidenceDto { countryCode: string; framework: string; evidence: string[]; disclaimer: string; }
export interface OnboardingAnalyticsDto {
  summary: { totalFlows: number; completionRate: number; documentComplianceRate: number; averageTimeToProductivityHours: number; atRisk: number };
  timeByStage: Array<{ label: string; averageHours: number; sampleSize: number }>;
  timeByResponsible: Array<{ label: string; averageHours: number; sampleSize: number }>;
  risks: Array<{ id: string; employee: { jobTitle?: string | null }; branch: string; score: number; level: "HIGH" | "MEDIUM" | "LOW"; reasons: string[] }>;
  comparisons: Record<"branches" | "positions" | "cohorts" | "templates", Array<{ label: string; total: number; completionRate: number; averageCompletionHours: number }>>;
}

export interface OnboardingPerformanceObjectiveDto {
  id: string;
  title: string;
  description?: string | null;
  targetValue: number;
  currentValue: number;
  weight: number;
  dueDate?: string | null;
  completedAt?: string | null;
}

export interface OnboardingPerformanceEvaluationDto {
  id: string;
  periodDays: 30 | 60 | 90;
  score: number;
  notes?: string | null;
  completedAt: string;
}

export interface OnboardingPerformanceDto {
  objectives: OnboardingPerformanceObjectiveDto[];
  evaluations: OnboardingPerformanceEvaluationDto[];
  objectiveProgress: number;
  readyForProductivity: boolean;
}

export interface EmployeeOnboardingDocumentDto {
  id: string;
  category: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  scanStatus: string;
  storageVisibility?: "PRIVATE" | "PUBLIC" | null;
  encryptedAtRest?: boolean | null;
  scannedAt?: string | null;
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "SUPERSEDED" | "DELETED";
  version?: number;
  replacesDocumentId?: string | null;
  rejectionReason?: string | null;
  expiresAt?: string | null;
  taskId?: string | null;
  createdAt: string;
}

export interface EmployeeOnboardingTaskDto {
  id: string;
  taskKey: string;
  taskType: OnboardingTemplateTaskConfigDto["taskType"];
  title: string;
  description?: string | null;
  status: OnboardingTaskStatus;
  progressPercent: number;
  dueDate?: string | null;
  ownerType: OnboardingOwnerType;
  ownerId?: string | null;
  owner?: { id: string; name: string; email: string } | null;
  blockingReason?: string | null;
  waitingFor: string[];
  waitingForLabels: string[];
  dependsOnKeys?: string[];
  blocked: boolean;
  overdue: boolean;
  documents: Array<{ id: string; status: string }>;
  required?: boolean;
  sortOrder?: number;
}

export interface OnboardingTimelineActorDto {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  type?: "USER" | "SYSTEM" | string;
}

export interface OnboardingTimelineEventDto {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  occurredAt: string;
  actor?: OnboardingTimelineActorDto | null;
  payload?: Record<string, unknown> | null;
}

export interface EmployeeOnboardingFlowDto {
  id: string;
  status: OnboardingTaskStatus;
  readinessStatus?: string | null;
  startedAt: string;
  completedAt?: string | null;
  progressPercent: number;
  employee: { id: string; name: string; email: string; jobTitle?: string | null; supervisorUserId?: string | null };
  branch: { id: string; name: string };
  template?: { id: string; name: string; version: number } | null;
  tasks: EmployeeOnboardingTaskDto[];
  documents: EmployeeOnboardingDocumentDto[];
  signaturePackages?: Array<{ id: string; title: string; status: string; dueDate?: string | null; signedAt?: string | null; participants: Array<{ id: string; fullName: string; status: string }> }>;
  nextAction?: EmployeeOnboardingTaskDto | null;
  alerts: Array<{ taskId: string; severity: "warning" | "danger"; message: string }>;
  timeline: OnboardingTimelineEventDto[];
  workflow?: { operationalEvents?: Array<{ id: string; title: string; description?: string | null; occurredAt: string }> };
}

export interface EmployeeOnboardingFlowListDto {
  items: EmployeeOnboardingFlowDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface OnboardingAutomationOverviewDto {
  enabled: boolean;
  reminderHours: number;
  escalationHours: number;
  reassignmentHours: number;
  autoReassignmentEnabled: boolean;
  overdue: number;
  processing: boolean;
  generatedAt: string;
}

export interface OnboardingAutomationRunDto extends OnboardingAutomationOverviewDto {
  skipped: boolean;
  reason?: string;
  processed: number;
  reminders: number;
  escalations: number;
  reassignments: number;
}

export interface OnboardingContextDto {
  assignableUsers: Array<{
    id: string;
    email: string;
    name: string;
    activeBranchId?: string | null;
    roles: Array<{ code: string; name: string }>;
  }>;
}

export interface SignatureProviderDto {
  code: "INTERNAL" | "DOCUSIGN" | "DROPBOX_SIGN";
  name: string;
  configured: boolean;
  evidence?: string[];
  reason?: string;
  credentialsConfigured?: boolean;
}

export interface EnterpriseIntegrationDto {
  code: "DOCUSIGN" | "DROPBOX_SIGN" | "HRIS" | "PAYROLL" | "SCIM" | "GOOGLE_WORKSPACE" | "MICROSOFT_365" | "ITSM";
  name: string;
  category: "Firma" | "Personas" | "Identidad" | "Operaciones";
  capabilities: string[];
  configured: boolean;
  missing: string[];
  recommendedConfigured: boolean;
}

export interface ElectronicSignatureTemplateDto {
  id: string;
  name: string;
  description?: string | null;
  version: number;
  provider: SignatureProviderDto["code"];
  title: string;
  content: string;
  consentText: string;
  isDefault: boolean;
}

export interface ElectronicSignatureParticipantDto {
  id: string;
  email: string;
  fullName: string;
  roleLabel?: string | null;
  status: "PENDING" | "SIGNED" | "REJECTED";
  signedAt?: string | null;
  consentedAt?: string | null;
  lastReminderAt?: string | null;
}

export interface ElectronicSignaturePackageDto {
  id: string;
  title: string;
  status: "DRAFT" | "PENDING" | "PARTIALLY_SIGNED" | "COMPLETED" | "CANCELLED";
  externalProvider?: string | null;
  dueDate?: string | null;
  sentAt?: string | null;
  signedAt?: string | null;
  lastReminderAt?: string | null;
  employee?: { id: string; name: string; email: string } | null;
  onboardingFlow?: { id: string; readinessStatus?: string | null } | null;
  template?: { id: string; name: string; version: number; provider: string } | null;
  participants: ElectronicSignatureParticipantDto[];
  auditEvents: Array<{ id: string; action: string; outcome: string; requestId?: string | null; occurredAt: string; evidence?: Record<string, unknown> | null }>;
}

export interface PublicSigningContextDto {
  participant: { fullName: string; email: string; roleLabel?: string | null };
  package: { title: string; dueDate?: string | null; employeeName?: string | null };
  document: { title: string; content: string; consentText: string; version: number };
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

export interface HiringWorkflowResultDto {
  id: string;
  tenantId: string;
  employeeId: string;
  candidateId: string;
  branchId: string;
  workflowType: "HIRING";
  status: string;
  currentStageKey?: string | null;
  progressPercent: number;
  employee?: {
    id: string;
    name: string;
    email: string;
    jobTitle?: string | null;
    supervisorUserId?: string | null;
  } | null;
  onboardingFlow?: {
    id: string;
    status: string;
    startedAt: string;
    templateId?: string | null;
    tasks?: Array<{
      id: string;
      title: string;
      taskKey: string;
      status: string;
      dueDate?: string | null;
    }>;
  } | null;
  hiringFlow?: {
    id: string;
    applicationId?: string | null;
    status: string;
    hiredAt?: string | null;
  } | null;
  inventoryAssignments?: Array<{
    id: string;
    status: string;
    dueDate?: string | null;
  }>;
  steps: Array<{ id: string; label: string; status: string }>;
}

export interface HireCandidateInput {
  applicationId: string;
  branchId: string;
  employeeName?: string;
  employeeEmail?: string;
  jobTitle: string;
  supervisorUserId?: string;
  onboardingTemplateId?: string;
  employmentStartDate?: string;
  sourceModule?: "ATS";
  metadata?: Record<string, unknown>;
}

export interface HiringContextDto {
  application: {
    id: string;
    status: ApplicationStatusKey;
    candidate: {
      id: string;
      fullName: string;
      email: string;
    };
    vacancy: {
      id: string;
      title: string;
      openings: number;
      status: string;
    };
    branch: {
      id: string;
      name: string;
      location: string;
    };
  };
  supervisors: Array<{
    id: string;
    fullName: string;
    email: string;
    roles: Array<{
      code: string;
      name: string;
      scope: string;
    }>;
  }>;
  onboardingTemplates: Array<{
    id: string;
    name: string;
    description?: string | null;
    version: number;
    isDefault: boolean;
    taskCount: number;
  }>;
  existingHiring?: {
    workflowId: string;
    employeeId?: string | null;
  } | null;
  canHire: boolean;
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
  status: "Postulación recibida" | "En revisión" | "En entrevistas" | "Documentos pendientes" | "Oferta enviada";
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

export type InventoryAssetStatus = "AVAILABLE" | "RESERVED" | "ASSIGNED" | "IN_TRANSIT" | "RETURN_PENDING" | "MAINTENANCE" | "LOST" | "RETIRED";
export type InventoryAssetCondition = "NEW" | "GOOD" | "FAIR" | "DAMAGED";

export interface InventoryCatalogItemDto {
  id: string;
  sku: string;
  name: string;
  qtyGlobal: number;
  _count: { assets: number };
}

export interface InventoryEvidenceDto {
  id: string;
  type: "DELIVERY" | "TRANSFER" | "RETURN" | "VALIDATION";
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  createdAt: string;
}

export interface InventoryMovementDto {
  id: string;
  type: string;
  notes?: string | null;
  condition?: InventoryAssetCondition | null;
  occurredAt: string;
  fromBranch?: { id: string; name: string } | null;
  toBranch?: { id: string; name: string } | null;
  employee?: { id: string; name: string } | null;
  evidences: InventoryEvidenceDto[];
}

export interface InventoryAssetDto {
  id: string;
  itemId: string;
  branchId: string;
  employeeId?: string | null;
  assetTag: string;
  serialNumber?: string | null;
  status: InventoryAssetStatus;
  condition: InventoryAssetCondition;
  notes?: string | null;
  assignedAt?: string | null;
  deliveredAt?: string | null;
  returnedAt?: string | null;
  updatedAt: string;
  item: { id: string; sku: string; name: string };
  branch: { id: string; name: string; location: string };
  employee?: { id: string; name: string; email: string; jobTitle?: string | null } | null;
  evidences: InventoryEvidenceDto[];
  movements?: InventoryMovementDto[];
}

export interface InventoryContextDto {
  branches: Array<{ id: string; name: string; location: string }>;
  employees: Array<{ id: string; name: string; email: string; jobTitle?: string | null; branchAssignments: Array<{ branchId: string; isPrimary: boolean }> }>;
  workflowAssignments: Array<{ id: string; employeeId: string; branchId: string; dueDate?: string | null }>;
}

export interface InventoryLocationDto {
  id: string;
  branchId: string;
  code: string;
  name: string;
  type: string;
  isActive: boolean;
}

export interface InventoryWarehouseStockDto {
  id: string;
  itemId: string;
  branchId: string;
  qtyLocal: number;
  minQty: number;
  maxQty?: number | null;
  reorderPoint: number;
  needsReorder: boolean;
  belowMinimum: boolean;
  item: { id: string; sku: string; name: string; isSerialized: boolean; unitOfMeasure: string };
  branch: { id: string; name: string; location: string };
}

export interface InventoryWarehousePageDto {
  items: InventoryWarehouseStockDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AppDatasetsDto {
  vacancies: VacancyDto[];
  candidates: CandidateDto[];
  inventory: InventoryItemDto[];
}

export type OperationalDashboardTone = "info" | "success" | "warning" | "danger";

export interface OperationalDashboardItemDto {
  id: string;
  kind: "task" | "alert";
  title: string;
  description: string;
  tone: OperationalDashboardTone;
  module: string;
  href: string;
  dueAt: string | null;
  occurredAt: string;
  recordLabel: string | null;
}

export interface OperationalDashboardDto {
  role: string;
  scope: "GLOBAL" | "TENANT" | "BRANCH";
  period: { label: string; from: string; to: string };
  source: string;
  generatedAt: string;
  metrics: Array<{
    key: string;
    label: string;
    value: number;
    tone: OperationalDashboardTone;
    href: string;
  }>;
  tasks: OperationalDashboardItemDto[];
  alerts: OperationalDashboardItemDto[];
  nextAction: OperationalDashboardItemDto | null;
}

export interface ReportsOverviewDto {
  generatedAt: string;
  source: string;
  period: { from: string; to: string; label: string };
  scope: {
    type: "GLOBAL" | "TENANT" | "BRANCH";
    tenantId: string | null;
    branchId: string | null;
    branchName: string | null;
  };
  ats: {
    totals: {
      applications: number;
      activeVacancies: number;
      hired: number;
      rejected: number;
      conversionRate: number;
      averageTimeToHireHours: number;
    };
    byStatus: Array<{ status: string; count: number }>;
    timeByStage: Array<{ stage: string; averageHours: number; sampleSize: number }>;
  };
  onboarding: {
    totalFlows: number;
    completedFlows: number;
    completionRate: number;
    overdueTasks: number;
    blockedTasks: number;
    averageTaskProgress: number;
    byStatus: Array<{ status: string; count: number }>;
  };
  training: {
    totalAssignments: number;
    completed: number;
    overdue: number;
    inProgress: number;
    complianceRate: number;
    averageProgress: number;
    byStatus: Array<{ status: string; count: number }>;
  };
  inventory: {
    totalAssets: number;
    pendingActions: number;
    available: number;
    assigned: number;
    returnPending: number;
    maintenance: number;
    lost: number;
    byStatus: Array<{ status: string; count: number }>;
  };
}

export interface AtsAnalyticsDashboardDto {
  id: string;
  name: string;
  isDefault: boolean;
  filters: { reportType: "ATS_ANALYTICS"; query: Record<string, string | undefined>; widgets: string[] };
  updatedAt: string;
}

export interface AtsAnalyticsDto {
  generatedAt: string;
  source: string;
  period: { from: string; to: string; previousFrom: string; previousTo: string };
  scope: {
    type: "GLOBAL" | "TENANT" | "BRANCH";
    tenantId: string | null;
    branchId: string | null;
    branchName: string | null;
  };
  filters: {
    vacancyId: string | null;
    recruiterId: string | null;
    granularity: "day" | "week" | "month";
  };
  summary: {
    applications: number;
    uniqueCandidates: number;
    hires: number;
    rejected: number;
    withdrawn: number;
    activePipeline: number;
    conversionRate: number;
    rejectionRate: number;
    withdrawalRate: number;
    averageTimeToHireHours: number;
    medianTimeToHireHours: number;
    averageTimeToFirstReviewHours: number;
    averageCandidateAgeHours: number;
    changes: {
      applications: number;
      hires: number;
      conversionRate: number;
      averageTimeToHireHours: number;
    };
  };
  funnel: Array<{
    stageCode: string;
    stageName: string;
    reached: number;
    conversionRate: number;
    conversionFromApplications: number;
    dropOff: number;
    dropOffRate: number;
    averageHours: number;
    sampleSize: number;
  }>;
  trends: Array<{ period: string; applications: number; hires: number; rejected: number; withdrawn: number }>;
  sources: Array<{ source: string; applications: number; hires: number; rejected: number; conversionRate: number; rejectionRate: number; cost: number; currency: string | null; costPerApplication: number; costPerHire: number | null }>;
  vacancies: Array<{ id: string; title: string; status: string; openings: number; applications: number; active: number; hires: number; rejected: number; conversionRate: number; averageTimeToHireHours: number; daysOpen: number; fillRate: number }>;
  recruiters: Array<{ id: string | null; name: string; applications: number; active: number; hires: number; conversionRate: number; overdue: number; averageActiveStageHours: number }>;
  sla: { measurable: number; compliant: number; breached: number; complianceRate: number; warningSent: number; escalated: number; reassigned: number; byStage: Array<{ label: string; count: number }> };
  interviews: { total: number; scheduled: number; completed: number; cancelled: number; noShow: number; completionRate: number; noShowRate: number; cancellationRate: number; averageSchedulingLeadHours: number; averageDurationMinutes: number; averageScore: number; signedScorecards: number; byStatus: Array<{ status: string; count: number }> };
  offers: { total: number; sent: number; accepted: number; rejected: number; expired: number; countered: number; acceptanceRate: number; counterOfferRate: number; averageApprovalHours: number; averageResponseHours: number; byStatus: Array<{ status: string; count: number }> };
  qualityOfHire: { reviewed: number; byCheckpoint: Array<{ checkpointDays: number; reviews: number; averagePerformanceScore: number; retentionRate: number }> };
  rejectionReasons: Array<{ code: string | null; label: string; category: string | null; count: number; percentage: number }>;
  insights: Array<{ severity: "info" | "warning" | "critical"; code: string; title: string; detail: string }>;
}

export interface ReportExportDto {
  filename: string;
  mimeType: string;
  content: string;
  generatedAt: string;
}

export type NotificationCategory =
  | "GENERAL"
  | "ATS"
  | "ONBOARDING"
  | "TRAINING"
  | "INVENTORY"
  | "AUTOMATION"
  | "SECURITY"
  | "BILLING";

export interface NotificationDeliveryDto {
  id: string;
  channel: "INTERNAL" | "EMAIL";
  status: "PENDING" | "PROCESSING" | "DELIVERED" | "FAILED" | "DEAD_LETTER" | "SKIPPED";
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: string;
  deliveredAt?: string | null;
  lastError?: string | null;
  correlationId?: string | null;
  createdAt: string;
  notification?: { title: string; category: NotificationCategory };
}

export interface NotificationDto {
  id: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  category: NotificationCategory;
  title: string;
  message: string;
  sourceModule?: string | null;
  actionUrl?: string | null;
  correlationId?: string | null;
  readAt?: string | null;
  archivedAt?: string | null;
  createdAt: string;
  deliveries: NotificationDeliveryDto[];
}

export interface NotificationListDto {
  items: NotificationDto[];
  page: number;
  pageSize: number;
  total: number;
  unread: number;
}

export interface NotificationPreferenceDto {
  id: string | null;
  category: NotificationCategory;
  internalEnabled: boolean;
  emailEnabled: boolean;
  frequency: "IMMEDIATE" | "DAILY" | "WEEKLY" | "DISABLED";
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  timeZone: string;
}
