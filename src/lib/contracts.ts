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
  | "candidates.view"
  | "candidates.update"
  | "applications.view"
  | "applications.change_stage"
  | "applications.reject"
  | "applications.hire"
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
  _count?: { modules: number; assignments: number };
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
  course?: { id: string; title: string; status?: string };
  questions: TrainingQuizQuestionDto[];
  _count?: { attempts: number };
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
  verificationCode: string;
  certificateUrl: string;
  issuedAt: string;
  expiresAt?: string | null;
  revokedAt?: string | null;
  revocationReason?: string | null;
  status?: "VALID" | "EXPIRED" | "REVOKED";
  user?: { id: string; firstName: string; lastName: string; email: string };
  course?: { id: string; title: string } | null;
  curriculum?: { id: string; title: string } | null;
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
  title: string;
  imageUrl?: string | null;
  status?: "DRAFT" | "OPEN" | "PUBLISHED" | "PAUSED" | "CLOSED" | string | null;
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
  applicationFormSchema?: VacancyApplicationFormSchema | null;
  tenant?: { id: string; name: string; slug: string } | null;
  branch?: { id: string; name: string; location?: string | null } | null;
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
  resumeUrl?: string;
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
  status?: "DRAFT" | "PUBLISHED";
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

export type ApplicationStatusKey = "SUBMITTED" | "REVIEWING" | "INTERVIEW" | "APPROVED" | "REJECTED" | "TRAINING" | "HIRED";
export type ApplicationInterviewType = "PRESENTIAL" | "VIRTUAL" | "PHONE";
export type ApplicationTimelineEventType = "VACANCY_PUBLISHED" | "APPLIED" | "CONTACTED" | "INTERVIEW_SCHEDULED" | "INTERVIEW_COMPLETED" | "HIRED";

export interface ApplicationCandidateDto {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  resumeUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationVacancyDto extends PublicVacancyDto {
  id: string;
  branchId: string;
  branch?: { id: string; name: string; location?: string | null } | null;
}

export interface ApplicationTimelineEventDto {
  type: ApplicationTimelineEventType;
  at?: string | null;
  note?: string | null;
}

export interface VacancyApplicationDto {
  id: string;
  tenantId: string;
  vacancyId: string;
  candidateId: string;
  status: ApplicationStatusKey;
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

export interface VacancyStageDto {
  id?: string;
  code: string;
  name: string;
  position: number;
  color?: string | null;
  isTerminal?: boolean;
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
  recommendation: InterviewRecommendation;
  criteria: Record<string, unknown>;
  strengths?: string | null;
  concerns?: string | null;
  comments?: string | null;
  submittedAt: string;
  reviewer?: { id: string; firstName: string; lastName: string };
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
  notes?: string | null;
  status: RecruitmentInterviewStatus;
  stage?: VacancyStageDto | null;
  interviewer?: { id: string; firstName: string; lastName: string; email?: string };
  application?: VacancyApplicationDto;
  scorecards?: InterviewScorecardRecordDto[];
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
  notes?: string;
}

export interface CandidateSessionDto {
  accessToken: string;
  expiresIn: number;
  candidate: { id: string; email: string };
}

export interface VacancyApplicationListDto {
  data: VacancyApplicationDto[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

export interface UpdateApplicationInput {
  status: ApplicationStatusKey;
  notes?: string;
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
  createdAt?: string;
  updatedAt?: string;
  tasks: OnboardingTemplateTaskConfigDto[];
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
