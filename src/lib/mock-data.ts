import type {
  AppDatasetsDto,
  BranchDto,
  CandidateDto,
  CandidateApplicationDto,
  CandidateStructuredAssessmentDto,
  CourseDto,
  AccessTaskDto,
  InventoryActivationDto,
  AutomationAuditEntryDto,
  AutomationJourneyDto,
  AutomationRuleDto,
  AutomationQueueItemDto,
  InventoryItemDto,
  OnboardingActorWorkspaceDto,
  OnboardingDocumentDto,
  OnboardingOwnerProgressDto,
  OnboardingReadinessDto,
  OperationalHandoffDto,
  OperationalEventDto,
  ProductivityRowDto,
  SignaturePackageDto,
  ComplianceCheckpointDto,
  TrainingActivationDto,
  VacancyHiringPlanDto,
  VacancyDto,
  ModuleKey,
  ModuleAssignmentDto,
  PermissionKey,
  RoleKey,
  RoleDefinitionDto,
  SessionDto,
  SubscriptionDto,
  TenantDto,
  UserDto,
} from "@/lib/contracts";

export const rolePermissions: Record<RoleKey, PermissionKey[]> = {
  admin_saas: [
    "dashboard.view",
    "ats.view",
    "ats.manage",
    "onboarding.view",
    "onboarding.manage",
    "training.view",
    "training.manage",
    "productivity.view",
    "employees.read",
    "employees.create",
    "employees.update",
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
    "platform.tenant.impersonate",
  ],
  admin_plataforma: [
    "dashboard.view",
    "admin.view",
    "admin.users",
    "admin.roles",
    "admin.company",
    "admin.subscription",
    "reports.view",
    "notifications.view",
    "profile.view",
    "platform.tenant.switch",
  ],
  admin_empresa: [
    "dashboard.view",
    "ats.view",
    "ats.manage",
    "onboarding.view",
    "onboarding.manage",
    "training.view",
    "training.manage",
    "productivity.view",
    "employees.read",
    "employees.create",
    "employees.update",
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
  ],
  rrhh: [
    "dashboard.view",
    "ats.view",
    "ats.manage",
    "onboarding.view",
    "onboarding.manage",
    "training.view",
    "training.manage",
    "reports.view",
    "notifications.view",
    "profile.view",
  ],
  reclutador: ["dashboard.view", "ats.view", "ats.manage", "reports.view", "notifications.view", "profile.view"],
  entrevistador: ["dashboard.view", "ats.view", "notifications.view", "profile.view"],
  instructor: ["dashboard.view", "training.view", "training.manage", "reports.view", "notifications.view", "profile.view"],
  supervisor: [
    "dashboard.view",
    "ats.view",
    "training.view",
    "productivity.view",
    "inventory.view",
    "reports.view",
    "notifications.view",
    "profile.view",
  ],
  encargado_inventario: ["dashboard.view", "inventory.view", "inventory.manage", "reports.view", "notifications.view", "profile.view"],
  empleado: ["dashboard.view", "onboarding.view", "training.view", "inventory.view", "notifications.view", "profile.view"],
  candidato: ["profile.view", "notifications.view"],
};

export const mockTenants: TenantDto[] = [
  {
    id: "tenant-1",
    slug: "talentos-cloud-usa",
    name: "TalentOS Cloud USA",
    plan: "enterprise",
    status: "active",
    enabledModules: ["dashboard", "ats", "onboarding", "training", "productivity", "inventory", "admin", "reports", "notifications", "profile"],
    branding: { accent: "#0EA5B7", supportEmail: "ops@talentoscloud.com" },
  },
  {
    id: "tenant-2",
    slug: "sunrise-health-florida",
    name: "Sunrise Health Florida",
    plan: "growth",
    status: "trial",
    enabledModules: ["dashboard", "ats", "onboarding", "training", "admin", "reports", "notifications", "profile"],
    branding: { accent: "#2563EB", supportEmail: "support@sunrisehealthfl.com" },
  },
  {
    id: "tenant-3",
    slug: "gulfshore-logistics",
    name: "Gulfshore Logistics",
    plan: "starter",
    status: "active",
    enabledModules: ["dashboard", "inventory", "notifications", "profile"],
    branding: { accent: "#14B8A6", supportEmail: "hello@gulfshorelogistics.com" },
  },
];

export const mockBranches: BranchDto[] = [
  {
    id: "branch-1",
    tenantId: "tenant-1",
    name: "Sede principal de Miami",
    city: "Miami, FL",
    manager: "Ava Thompson",
    employees: 82,
    status: "active",
  },
  {
    id: "branch-1b",
    tenantId: "tenant-1",
    name: "Centro operativo de Orlando",
    city: "Orlando, FL",
    manager: "Sophia Patel",
    employees: 46,
    status: "active",
  },
  {
    id: "branch-1c",
    tenantId: "tenant-1",
    name: "Hub logistico de Jacksonville",
    city: "Jacksonville, FL",
    manager: "Daniel Brooks",
    employees: 39,
    status: "active",
  },
  {
    id: "branch-2",
    tenantId: "tenant-2",
    name: "Centro asistencial de Orlando",
    city: "Orlando, FL",
    manager: "Olivia Carter",
    employees: 146,
    status: "active",
  },
  {
    id: "branch-3",
    tenantId: "tenant-2",
    name: "Hub clinico de Tampa",
    city: "Tampa, FL",
    manager: "Mason Reed",
    employees: 64,
    status: "active",
  },
  {
    id: "branch-4",
    tenantId: "tenant-3",
    name: "Patio de distribucion de Jacksonville",
    city: "Jacksonville, FL",
    manager: "Jordan Blake",
    employees: 51,
    status: "active",
  },
];

export const mockRoleDefinitions: RoleDefinitionDto[] = [
  {
    id: "role-def-1",
    tenantId: "tenant-1",
    name: "Superadministrador",
    scope: "global",
    permissions: rolePermissions.admin_saas,
    members: 1,
  },
  {
    id: "role-def-2",
    tenantId: "tenant-2",
    name: "RRHH",
    scope: "module",
    permissions: rolePermissions.rrhh,
    members: 6,
  },
  {
    id: "role-def-3",
    tenantId: "tenant-3",
    name: "Supervisor",
    scope: "module",
    permissions: rolePermissions.supervisor,
    members: 3,
  },
];

export const mockSubscriptions: SubscriptionDto[] = [
  {
    id: "sub-1",
    tenantId: "tenant-1",
    plan: "enterprise",
    billingCycle: "annual",
    status: "active",
    price: 4200,
    renewalDate: "2026-09-01",
  },
  {
    id: "sub-2",
    tenantId: "tenant-2",
    plan: "growth",
    billingCycle: "monthly",
    status: "trial",
    price: 890,
    renewalDate: "2026-07-15",
  },
  {
    id: "sub-3",
    tenantId: "tenant-3",
    plan: "starter",
    billingCycle: "annual",
    status: "active",
    price: 960,
    renewalDate: "2027-02-12",
  },
];

export const mockModuleAssignments: ModuleAssignmentDto[] = mockTenants.flatMap((tenant) =>
  (["dashboard", "ats", "onboarding", "training", "productivity", "inventory", "admin", "reports", "notifications", "profile"] as ModuleKey[]).map(
    (module) => ({
      id: `${tenant.id}-${module}`,
      tenantId: tenant.id,
      module,
      enabled: tenant.enabledModules.includes(module),
      source: tenant.enabledModules.includes(module) ? "plan" : "manual",
    }),
  ),
);

export const mockUsers: UserDto[] = [
  { id: "e2e-superadmin", fullName: "E2E Superadmin", email: "e2e.superadmin@example.test", role: "admin_saas", tenantId: "tenant-1", status: "active" },
  { id: "e2e-platform-admin", fullName: "E2E Platform Admin", email: "e2e.platform-admin@example.test", role: "admin_plataforma", tenantId: "tenant-1", status: "active" },
  { id: "e2e-tenant-admin", fullName: "E2E Tenant Admin", email: "e2e.tenant-admin@example.test", role: "admin_empresa", tenantId: "tenant-2", status: "active" },
  { id: "e2e-hr-manager", fullName: "E2E HR Manager", email: "e2e.hr-manager@example.test", role: "rrhh", tenantId: "tenant-2", status: "active" },
  { id: "e2e-recruiter", fullName: "E2E Recruiter", email: "e2e.recruiter@example.test", role: "reclutador", tenantId: "tenant-2", status: "active" },
  { id: "e2e-interviewer", fullName: "E2E Interviewer", email: "e2e.interviewer@example.test", role: "entrevistador", tenantId: "tenant-2", status: "active" },
  { id: "e2e-instructor", fullName: "E2E Instructor", email: "e2e.instructor@example.test", role: "instructor", tenantId: "tenant-2", status: "active" },
  { id: "e2e-supervisor", fullName: "E2E Supervisor", email: "e2e.supervisor@example.test", role: "supervisor", tenantId: "tenant-2", status: "active" },
  { id: "e2e-inventory-manager", fullName: "E2E Inventory Manager", email: "e2e.inventory-manager@example.test", role: "encargado_inventario", tenantId: "tenant-2", status: "active" },
  { id: "e2e-branch-user", fullName: "E2E Branch User", email: "e2e.branch-user@example.test", role: "empleado", tenantId: "tenant-2", status: "active" },
  { id: "e2e-candidate", fullName: "E2E Candidate", email: "e2e.candidate@example.test", role: "candidato", tenantId: "tenant-2", status: "active" },
  {
    id: "user-0",
    fullName: "Ava Thompson",
    email: "ava.thompson@talentoscloud.com",
    role: "admin_saas",
    tenantId: "tenant-1",
    status: "active",
  },
  {
    id: "user-5",
    fullName: "Noah Bennett",
    email: "noah.bennett@sunrisehealthfl.com",
    role: "admin_saas",
    tenantId: "tenant-2",
    status: "active",
  },
  {
    id: "user-7",
    fullName: "Sophia Patel",
    email: "sophia.patel@talentoscloud.com",
    role: "supervisor",
    tenantId: "tenant-1",
    status: "active",
  },
  {
    id: "user-8",
    fullName: "Daniel Brooks",
    email: "daniel.brooks@talentoscloud.com",
    role: "empleado",
    tenantId: "tenant-1",
    status: "active",
  },
  {
    id: "user-6",
    fullName: "Harper Stone",
    email: "harper.stone@gulfshorelogistics.com",
    role: "admin_saas",
    tenantId: "tenant-3",
    status: "active",
  },
  {
    id: "user-1",
    fullName: "Olivia Carter",
    email: "olivia.carter@sunrisehealthfl.com",
    role: "admin_empresa",
    tenantId: "tenant-2",
    status: "active",
  },
  {
    id: "user-2",
    fullName: "Mason Reed",
    email: "mason.reed@sunrisehealthfl.com",
    role: "rrhh",
    tenantId: "tenant-2",
    status: "active",
  },
  {
    id: "user-3",
    fullName: "Jordan Blake",
    email: "jordan.blake@gulfshorelogistics.com",
    role: "supervisor",
    tenantId: "tenant-3",
    status: "invited",
  },
  {
    id: "user-4",
    fullName: "Emma Collins",
    email: "emma.collins@gulfshorelogistics.com",
    role: "empleado",
    tenantId: "tenant-3",
    status: "active",
  },
];

export const mockSession: SessionDto = {
  token: "mock-jwt-token",
  tenantId: "tenant-1",
  userId: "user-0",
  role: "admin_saas",
};

export const marketingModules = [
  {
    title: "ATS y reclutamiento",
    copy: "Publica vacantes, organiza pipelines y programa entrevistas con scorecards y formularios por cargo.",
  },
  {
    title: "Incorporacion documental",
    copy: "Coordina firmas, checklists, vencimientos y seguimiento del ingreso en tiempo real.",
  },
  {
    title: "Capacitacion y certificacion",
    copy: "Biblioteca de cursos, evaluaciones obligatorias y progreso por persona, cargo y sede.",
  },
  {
    title: "Productividad con IA",
    copy: "Indicadores, alertas y reportes historicos con una capa explicable para decisiones operativas.",
  },
  {
    title: "Inventario y activos",
    copy: "Stock, movimientos, mantenimiento y asignación de herramientas o equipos a empleados.",
  },
  {
    title: "Administracion multiempresa",
    copy: "Planes, empresas, usuarios, permisos dinamicos y activacion modular por suscripcion.",
  },
];

export const dashboardKpis = [
  { label: "Vacantes activas", value: "37", detail: "+9% esta semana en Florida" },
  { label: "Incorporaciones en curso", value: "94", detail: "12 pendientes de firma en Miami y Orlando" },
  { label: "Cumplimiento formativo", value: "96%", detail: "3 cursos vencen hoy" },
  { label: "Productividad promedio", value: "89.1", detail: "IA detecta mejora en Jacksonville" },
];

export const alerts = [
  {
    title: "Incorporacion incompleta",
    description: "12 nuevos ingresos en Orlando aun esperan firma documental antes de su fecha de inicio.",
    tone: "warning",
  },
  {
    title: "Stock critico",
    description: "Faltan 9 scanners portatiles en Jacksonville y 6 tablets clinicas en Tampa.",
    tone: "danger",
  },
  {
    title: "Capacitacion vencida",
    description: "3 supervisores en Miami deben renovar la capacitacion OSHA e HIPAA esta semana.",
    tone: "info",
  },
];

export const pipelineStages = [
  { name: "Aplicados", count: 118 },
  { name: "Filtro RRHH", count: 54 },
  { name: "Entrevista", count: 24 },
  { name: "Oferta", count: 11 },
  { name: "Contratados", count: 7 },
];

export const jobs: VacancyDto[] = [
  {
    id: "vac-1",
    title: "Especialista senior de adquisicion de talento",
    area: "RRHH",
    mode: "Hibrido",
    status: "Activa",
    location: "Miami, FL",
    applicants: 38,
    owner: "Ava Thompson",
    image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "vac-2",
    title: "Coordinador clinico de incorporacion",
    area: "Operaciones",
    mode: "Presencial",
    status: "En entrevistas",
    location: "Orlando, FL",
    applicants: 26,
    owner: "Olivia Carter",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "vac-3",
    title: "Supervisor de operaciones de almacen",
    area: "Logistica",
    mode: "Presencial",
    status: "Activa",
    location: "Jacksonville, FL",
    applicants: 19,
    owner: "Jordan Blake",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "vac-4",
    title: "Analista de programas de capacitacion",
    area: "Aprendizaje",
    mode: "Remoto",
    status: "Borrador",
    location: "Tampa, FL",
    applicants: 0,
    owner: "Mason Reed",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
  },
];

export const candidates: CandidateDto[] = [
  { id: "can-1", vacancyId: "vac-1", name: "Lauren Bennett", role: "Especialista en adquisicion de talento", stage: "Entrevista tecnica", score: 93, summary: "Fuerte experiencia en reclutamiento de salud en hospitales del sur de Florida." },
  { id: "can-2", vacancyId: "vac-3", name: "Marcus Hill", role: "Supervisor de operaciones de almacen", stage: "Oferta enviada", score: 89, summary: "Solida experiencia liderando operaciones logisticas entre Jacksonville y Savannah." },
  { id: "can-3", vacancyId: "vac-2", name: "Natalie Brooks", role: "Coordinadora de incorporacion", stage: "Filtro RRHH", score: 86, summary: "Gran disciplina de procesos y experiencia en cumplimiento documental para equipos regulados." },
];

export const vacancyHiringPlans: VacancyHiringPlanDto[] = [
  {
    vacancyId: "vac-1",
    scorecardTitle: "Tarjeta de evaluación de talento senior",
    advancementRule: "No avanzar a decision final si falta retroalimentación de al menos un entrevistador del panel.",
    interviewKits: [
      {
        id: "kit-v1-rrhh",
        stage: "Filtro RRHH",
        focus: "Ajuste cultural y dominio del proceso de reclutamiento",
        interviewers: ["Ava Thompson"],
        criteria: [
          { id: "v1-rrhh-c1", label: "Contratación estructurada", weight: 30 },
          { id: "v1-rrhh-c2", label: "Gestion de interesados", weight: 35 },
          { id: "v1-rrhh-c3", label: "Experiencia del candidato", weight: 35 },
        ],
      },
      {
        id: "kit-v1-tech",
        stage: "Entrevista tecnica",
        focus: "Diseño de etapas del proceso, analítica ATS y cierre de vacantes críticas",
        interviewers: ["Ava Thompson", "Mason Reed", "Jordan Blake"],
        criteria: [
          { id: "v1-tech-c1", label: "Diseño de etapas del proceso", weight: 30 },
          { id: "v1-tech-c2", label: "Calidad de evaluación", weight: 35 },
          { id: "v1-tech-c3", label: "Influencia con lideres de contratacion", weight: 35 },
        ],
      },
    ],
  },
  {
    vacancyId: "vac-2",
    scorecardTitle: "Tarjeta de evaluación de incorporacion clinica",
    advancementRule: "Antes de entrevista final se debe completar la evaluación de cumplimiento y operación.",
    interviewKits: [
      {
        id: "kit-v2-ops",
        stage: "Filtro RRHH",
        focus: "Rigor documental y coordinación clínica",
        interviewers: ["Olivia Carter"],
        criteria: [
          { id: "v2-c1", label: "Cumplimiento documental", weight: 40 },
          { id: "v2-c2", label: "Seguimiento operativo", weight: 30 },
          { id: "v2-c3", label: "Comunicación interdisciplinaria", weight: 30 },
        ],
      },
    ],
  },
  {
    vacancyId: "vac-3",
    scorecardTitle: "Tarjeta de evaluación de supervisor operativo",
    advancementRule: "La oferta no se emite hasta consolidar recomendación final del panel.",
    interviewKits: [
      {
        id: "kit-v3-ops",
        stage: "Oferta",
        focus: "Liderazgo de turno, seguridad y productividad",
        interviewers: ["Jordan Blake", "Harper Stone"],
        criteria: [
          { id: "v3-c1", label: "Liderazgo en piso", weight: 35 },
          { id: "v3-c2", label: "Seguridad operacional", weight: 30 },
          { id: "v3-c3", label: "Indicadores y productividad", weight: 35 },
        ],
      },
    ],
  },
];

export const candidateStructuredAssessments: CandidateStructuredAssessmentDto[] = [
  {
    candidateId: "can-1",
    vacancyId: "vac-1",
    currentStage: "Entrevista tecnica",
    consolidatedRecommendation: "Avanzar con reserva",
    decisionSummary: "El panel reconoce alto potencial, pero falta cerrar retroalimentación de liderazgo cruzado antes de mover a decision final.",
    feedbackPendingCount: 1,
    advancementBlocked: true,
    stageCriteria: [
      { id: "can1-s1", label: "Diseño de etapas del proceso", weight: 30, score: 5, note: "Excelente criterio para etapas y embudos." },
      { id: "can1-s2", label: "Calidad de evaluación", weight: 35, score: 4, note: "Usa señales objetivas y preguntas consistentes." },
      { id: "can1-s3", label: "Influencia con lideres de contratacion", weight: 35, score: 4, note: "Buen manejo de interesados, con espacio para mayor velocidad de cierre." },
    ],
    reviewerFeedback: [
      {
        id: "can1-r1",
        reviewer: "Ava Thompson",
        role: "Lider de RRHH",
        status: "submitted",
        recommendation: "strong_yes",
        submittedAt: "15 jul 2026 · 9:15 AM ET",
        criteria: [
          { id: "can1-r1-c1", label: "Contratación estructurada", weight: 30, score: 5 },
          { id: "can1-r1-c2", label: "Gestion de interesados", weight: 35, score: 4 },
          { id: "can1-r1-c3", label: "Experiencia del candidato", weight: 35, score: 5 },
        ],
        summary: "Recomendación fuerte por consistencia metodológica y madurez para vacantes de alta prioridad.",
      },
      {
        id: "can1-r2",
        reviewer: "Mason Reed",
        role: "Gerente de RRHH",
        status: "submitted",
        recommendation: "yes",
        submittedAt: "15 jul 2026 · 10:05 AM ET",
        criteria: [
          { id: "can1-r2-c1", label: "Diseño de etapas del proceso", weight: 30, score: 4 },
          { id: "can1-r2-c2", label: "Calidad de evaluación", weight: 35, score: 4 },
          { id: "can1-r2-c3", label: "Influencia con hiring managers", weight: 35, score: 4 },
        ],
        summary: "Buen ajuste general y buen control del proceso, con reservas menores en coordinación multiárea.",
      },
      {
        id: "can1-r3",
        reviewer: "Jordan Blake",
        role: "Supervisor invitado al panel",
        status: "pending",
        recommendation: "mixed",
        criteria: [
          { id: "can1-r3-c1", label: "Comprensión operativa", weight: 50 },
          { id: "can1-r3-c2", label: "Velocidad de respuesta", weight: 50 },
        ],
        summary: "Retroalimentación pendiente de consolidar.",
      },
    ],
  },
  {
    candidateId: "can-2",
    vacancyId: "vac-3",
    currentStage: "Oferta enviada",
    consolidatedRecommendation: "Avanzar",
    decisionSummary: "Todos los evaluadores enviaron su tarjeta de evaluación y la decisión final ya está alineada para contratación.",
    feedbackPendingCount: 0,
    advancementBlocked: false,
    stageCriteria: [
      { id: "can2-s1", label: "Liderazgo en piso", weight: 35, score: 5, note: "Muy sólido en turnos y productividad." },
      { id: "can2-s2", label: "Seguridad operacional", weight: 30, score: 4, note: "Buena base y disciplina." },
      { id: "can2-s3", label: "Indicadores y productividad", weight: 35, score: 5, note: "Alta orientación a resultado." },
    ],
    reviewerFeedback: [
      {
        id: "can2-r1",
        reviewer: "Jordan Blake",
        role: "Supervisor de operaciones",
        status: "submitted",
        recommendation: "strong_yes",
        submittedAt: "14 jul 2026 · 5:40 PM ET",
        criteria: [
          { id: "can2-r1-c1", label: "Liderazgo en piso", weight: 35, score: 5 },
          { id: "can2-r1-c2", label: "Seguridad operacional", weight: 30, score: 4 },
          { id: "can2-r1-c3", label: "Indicadores y productividad", weight: 35, score: 5 },
        ],
        summary: "Perfil listo para asumir operación con mínima curva de adaptación.",
      },
    ],
  },
  {
    candidateId: "can-3",
    vacancyId: "vac-2",
    currentStage: "Filtro RRHH",
    consolidatedRecommendation: "Avanzar",
    decisionSummary: "Buen cumplimiento y disciplina documental; se recomienda avanzar a entrevista con foco en coordinación clínica.",
    feedbackPendingCount: 0,
    advancementBlocked: false,
    stageCriteria: [
      { id: "can3-s1", label: "Cumplimiento documental", weight: 40, score: 5, note: "Muy fuerte en trazabilidad." },
      { id: "can3-s2", label: "Seguimiento operativo", weight: 30, score: 4, note: "Buen orden y priorización." },
      { id: "can3-s3", label: "Comunicación interdisciplinaria", weight: 30, score: 4, note: "Buen potencial para clínica y RRHH." },
    ],
    reviewerFeedback: [
      {
        id: "can3-r1",
        reviewer: "Olivia Carter",
        role: "Administrador de empresa",
        status: "submitted",
        recommendation: "yes",
        submittedAt: "15 jul 2026 · 8:45 AM ET",
        criteria: [
          { id: "can3-r1-c1", label: "Cumplimiento documental", weight: 40, score: 5 },
          { id: "can3-r1-c2", label: "Seguimiento operativo", weight: 30, score: 4 },
          { id: "can3-r1-c3", label: "Comunicación interdisciplinaria", weight: 30, score: 4 },
        ],
        summary: "Recomendación positiva para continuar con entrevista enfocada en coordinación de ingreso.",
      },
    ],
  },
];

export const candidateApplications: CandidateApplicationDto[] = [
  {
    id: "application-1",
    reference: "APP-MIA-2026-0148",
    candidateName: "Lauren Bennett",
    role: "Especialista senior de adquisicion de talento",
    location: "Miami, FL",
    tenantName: "TalentOS Cloud USA",
    status: "En entrevistas",
    stage: "Entrevista tecnica",
    submittedAt: "11 jul 2026 · 9:40 AM ET",
    recruiter: "Ava Thompson",
    nextStep: "Entrevista tecnica confirmada para el 17 jul 2026 a las 10:00 AM ET.",
    progress: 72,
    timeline: [
      {
        id: "application-1-t1",
        title: "Postulación enviada",
        description: "Tu perfil fue recibido correctamente junto con tu CV.",
        date: "11 jul 2026",
        status: "completed",
      },
      {
        id: "application-1-t2",
        title: "Revision inicial completada",
        description: "RRHH validó experiencia base y afinidad con la vacante.",
        date: "12 jul 2026",
        status: "completed",
      },
      {
        id: "application-1-t3",
        title: "Entrevista tecnica",
        description: "Tu entrevista fue programada y espera confirmacion final del panel.",
        date: "17 jul 2026",
        status: "current",
      },
      {
        id: "application-1-t4",
        title: "Decision final",
        description: "Recibiras actualizacion despues de consolidar la retroalimentación del panel.",
        date: "Pendiente",
        status: "upcoming",
      },
    ],
    documents: [
      { id: "application-1-d1", name: "CV actualizado", status: "received" },
      { id: "application-1-d2", name: "Identificacion oficial", status: "received" },
      { id: "application-1-d3", name: "Certificacion SHRM / HRCI", status: "pending", dueDate: "16 jul 2026" },
    ],
    messages: [
      {
        id: "application-1-m1",
        from: "Ava Thompson",
        title: "Confirmacion de entrevista",
        body: "Tu perfil avanzó a entrevista tecnica. Enviaremos enlace y participantes en las proximas horas.",
        date: "14 jul 2026 · 3:20 PM ET",
        unread: true,
      },
      {
        id: "application-1-m2",
        from: "Equipo TalentOS Cloud USA",
        title: "Postulación recibida",
        body: "Gracias por aplicar. Tu experiencia ya esta siendo revisada por el equipo de reclutamiento.",
        date: "11 jul 2026 · 9:45 AM ET",
        unread: false,
      },
    ],
  },
  {
    id: "application-2",
    reference: "APP-ORL-2026-0109",
    candidateName: "Natalie Brooks",
    role: "Coordinador clinico de incorporacion",
    location: "Orlando, FL",
    tenantName: "Sunrise Health Florida",
    status: "Documentos pendientes",
    stage: "Validacion documental",
    submittedAt: "09 jul 2026 · 2:10 PM ET",
    recruiter: "Olivia Carter",
    nextStep: "Sube tu constancia de vacunacion y el formulario I-9 para continuar a entrevista.",
    progress: 48,
    timeline: [
      {
        id: "application-2-t1",
        title: "Postulación enviada",
        description: "La vacante recibio tu informacion y tus datos de contacto.",
        date: "09 jul 2026",
        status: "completed",
      },
      {
        id: "application-2-t2",
        title: "Revision de perfil",
        description: "El equipo identificó buen ajuste operativo para la vacante.",
        date: "10 jul 2026",
        status: "completed",
      },
      {
        id: "application-2-t3",
        title: "Documentos pendientes",
        description: "Faltan soportes regulatorios antes de programar la entrevista.",
        date: "15 jul 2026",
        status: "current",
      },
      {
        id: "application-2-t4",
        title: "Programacion de entrevista",
        description: "Una vez completos los documentos, se habilitara seleccion de horario.",
        date: "Pendiente",
        status: "upcoming",
      },
    ],
    documents: [
      { id: "application-2-d1", name: "CV actualizado", status: "received" },
      { id: "application-2-d2", name: "Formulario I-9", status: "required", dueDate: "17 jul 2026" },
      { id: "application-2-d3", name: "Constancia de vacunacion", status: "required", dueDate: "17 jul 2026" },
    ],
    messages: [
      {
        id: "application-2-m1",
        from: "Olivia Carter",
        title: "Documentos faltantes",
        body: "Tu perfil continúa en revisión, pero necesitamos completar los documentos regulatorios para avanzar.",
        date: "15 jul 2026 · 8:30 AM ET",
        unread: true,
      },
    ],
  },
];

export const interviews = [
  { candidate: "Marcus Hill", when: "Hoy · 3:00 PM ET", panel: "Operaciones", status: "Confirmada" },
  { candidate: "Natalie Brooks", when: "Manana · 9:30 AM ET", panel: "RRHH + Supervisor", status: "Retroalimentación pendiente" },
  { candidate: "Derek Coleman", when: "Viernes · 11:00 AM ET", panel: "Capacitacion", status: "Programada" },
];

export const documents: OnboardingDocumentDto[] = [
  { id: "doc-1", name: "Acuerdo laboral", owner: "Natalie Brooks", status: "Firmado", expires: "N/A" },
  { id: "doc-2", name: "Verificacion de antecedentes", owner: "Lauren Bennett", status: "Pendiente", expires: "2 jul 2026" },
  { id: "doc-3", name: "Acuse de recibo OSHA", owner: "Marcus Hill", status: "Revisado", expires: "N/A" },
];

export const onboardingActorChecklists = {
  colaborador: [
    { title: "Subir identificacion oficial", description: "Pendiente para Lauren Bennett antes del ingreso.", badge: "Pendiente · vence 16 jul" },
    { title: "Completar formulario fiscal", description: "Datos base y direccion verificados por el colaborador.", badge: "En curso · vence 16 jul" },
    { title: "Confirmar politica de privacidad", description: "Acuse digital requerido para cerrar expediente.", badge: "Bloquea dia 1" },
  ],
  manager: [
    { title: "Asignar buddy de ingreso", description: "El lider debe definir acompanamiento de la primera semana.", badge: "Hoy" },
    { title: "Confirmar plan del dia 1", description: "Horario, acceso al sitio y agenda de bienvenida.", badge: "Listo antes de 17 jul" },
    { title: "Validar herramientas del puesto", description: "Laptop, credenciales y materiales listos antes del inicio.", badge: "Bloqueo operativo" },
  ],
  rrhh: [
    { title: "Revisar expediente documental", description: "RRHH debe cerrar validacion de I-9, identidad y contrato.", badge: "Critico · vence hoy" },
    { title: "Habilitar firma electronica", description: "Paquete de NDA y contrato ya enviado al colaborador.", badge: "En seguimiento" },
    { title: "Liberar avance a contratado", description: "Solo despues de checklist completo por actor.", badge: "Dependiente" },
  ],
  compliance: [
    { title: "Validar antecedentes regulatorios", description: "Confirmar verificacion y politicas obligatorias antes del alta.", badge: "Cumplimiento" },
    { title: "Revisar constancias OSHA / HIPAA", description: "El expediente debe quedar trazable para auditoría interna.", badge: "Vence 17 jul" },
    { title: "Marcar expediente auditable", description: "Sin esta marca, el colaborador no debe quedar en estado listo.", badge: "Bloquea dia 1" },
  ],
} as const;

export const onboardingActorWorkspaces: OnboardingActorWorkspaceDto[] = [
  {
    owner: "Colaborador",
    progress: "74%",
    blocker: "Falta cargar identificación oficial y confirmar política de privacidad.",
    deadline: "16 jul 2026",
    sla: "Completar expediente personal antes del día 1",
    evidenceSummary: "2 soportes cargados, 1 documento crítico pendiente y 1 acuse sin firma.",
    pendingCount: 2,
    tasks: [
      {
        id: "actor-col-1",
        title: "Subir identificación oficial",
        description: "Pendiente para Lauren Bennett antes del ingreso.",
        status: "Pendiente",
        deadline: "16 jul 2026",
        sla: "Antes del cierre del jueves 16 de julio de 2026",
        blocker: "Sin identificación oficial no se valida expediente base.",
        evidence: ["CV actualizado recibido", "Formulario fiscal preliminar cargado"],
      },
      {
        id: "actor-col-2",
        title: "Completar formulario fiscal",
        description: "Datos base y dirección verificados por el colaborador.",
        status: "En curso",
        deadline: "16 jul 2026",
        sla: "Mismo día del alta documental",
        blocker: "Falta validación final de dirección.",
        evidence: ["W-4 iniciado", "Dirección principal confirmada"],
      },
      {
        id: "actor-col-3",
        title: "Confirmar política de privacidad",
        description: "Acuse digital requerido para cerrar expediente.",
        status: "Bloqueado",
        deadline: "17 jul 2026",
        sla: "Antes del viernes 17 de julio de 2026",
        blocker: "Bloquea día 1 hasta que quede aceptada la política.",
        evidence: ["Política enviada por correo", "Recordatorio pendiente de aceptación"],
      },
    ],
  },
  {
    owner: "Supervisor",
    progress: "88%",
    blocker: "Queda una asignación de equipo y la agenda final del primer día.",
    deadline: "17 jul 2026",
    sla: "Confirmar alistamiento operativo 24 horas antes del ingreso",
    evidenceSummary: "Buddy definido, agenda preliminar lista y equipo base reservado.",
    pendingCount: 1,
    tasks: [
      {
        id: "actor-sup-1",
        title: "Asignar compañero de ingreso",
        description: "El líder debe definir acompañamiento de la primera semana.",
        status: "Completado",
        deadline: "15 jul 2026",
        sla: "48 horas antes del ingreso",
        blocker: "Sin bloqueo",
        evidence: ["Buddy asignado: Mason Reed", "Agenda de shadowing preliminar aprobada"],
      },
      {
        id: "actor-sup-2",
        title: "Confirmar plan del día 1",
        description: "Horario, acceso al sitio y agenda de bienvenida.",
        status: "En curso",
        deadline: "17 jul 2026",
        sla: "Antes de las 9:00 AM del viernes 17 de julio de 2026",
        blocker: "Falta validar bloque final de bienvenida con RRHH.",
        evidence: ["Turno confirmado", "Agenda de bienvenida borrador"],
      },
      {
        id: "actor-sup-3",
        title: "Validar herramientas del puesto",
        description: "Laptop, credenciales y materiales listos antes del inicio.",
        status: "Pendiente",
        deadline: "17 jul 2026",
        sla: "Antes del ingreso operativo",
        blocker: "Activo principal sigue en preparación por inventario.",
        evidence: ["Laptop reservada", "Credencial física en impresión"],
      },
    ],
  },
  {
    owner: "RRHH",
    progress: "83%",
    blocker: "Falta una firma contractual y la validación final del expediente laboral.",
    deadline: "16 jul 2026",
    sla: "Cerrar expediente laboral dentro de 24 horas",
    evidenceSummary: "I-9 revisado, contrato emitido y paquete de firma enviado.",
    pendingCount: 2,
    tasks: [
      {
        id: "actor-rrhh-1",
        title: "Revisar expediente documental",
        description: "RRHH debe cerrar validación de I-9, identidad y contrato.",
        status: "En curso",
        deadline: "16 jul 2026",
        sla: "Antes del cierre del jueves 16 de julio de 2026",
        blocker: "La identificación oficial sigue pendiente.",
        evidence: ["I-9 validado", "Contrato cargado en expediente"],
      },
      {
        id: "actor-rrhh-2",
        title: "Habilitar firma electrónica",
        description: "Paquete de NDA y contrato ya enviado al colaborador.",
        status: "Pendiente",
        deadline: "16 jul 2026",
        sla: "Seguimiento cada 4 horas hasta firma",
        blocker: "Pendiente firma del colaborador.",
        evidence: ["NDA enviado", "Contrato enviado", "Recordatorio programado para las 3:00 PM ET"],
      },
      {
        id: "actor-rrhh-3",
        title: "Liberar avance a contratado",
        description: "Solo después de checklist completo por actor.",
        status: "Bloqueado",
        deadline: "17 jul 2026",
        sla: "Antes de activar el día 1",
        blocker: "No se libera mientras colaborador y cumplimiento no cierren su parte.",
        evidence: ["Regla de liberación configurada", "Checklist interáreas en seguimiento"],
      },
    ],
  },
  {
    owner: "Cumplimiento",
    progress: "69%",
    blocker: "Falta marcar expediente auditable y revisar constancias regulatorias.",
    deadline: "17 jul 2026",
    sla: "Completar control regulatorio antes del ingreso operativo",
    evidenceSummary: "Cribado preliminar validado, OSHA revisado y falta cierre auditable.",
    pendingCount: 2,
    tasks: [
      {
        id: "actor-cum-1",
        title: "Validar antecedentes regulatorios",
        description: "Confirmar verificación y políticas obligatorias antes del alta.",
        status: "En curso",
        deadline: "16 jul 2026",
        sla: "Antes del cierre del jueves 16 de julio de 2026",
        blocker: "Falta constancia final del proveedor externo.",
        evidence: ["Cribado preliminar validado", "Políticas regulatorias enviadas"],
      },
      {
        id: "actor-cum-2",
        title: "Revisar constancias OSHA / HIPAA",
        description: "El expediente debe quedar trazable para auditoría interna.",
        status: "Pendiente",
        deadline: "17 jul 2026",
        sla: "Antes del viernes 17 de julio de 2026",
        blocker: "Aún no se sube constancia final de privacidad.",
        evidence: ["OSHA revisado", "HIPAA en validación final"],
      },
      {
        id: "actor-cum-3",
        title: "Marcar expediente auditable",
        description: "Sin esta marca, el colaborador no debe quedar en estado listo.",
        status: "Bloqueado",
        deadline: "17 jul 2026",
        sla: "Previo a declarar día 1 listo",
        blocker: "Depende del cierre documental y firma final.",
        evidence: ["Regla auditable activa", "Checklist regulatorio pendiente de cierre"],
      },
    ],
  },
];

export const onboardingOperationalReadiness: OnboardingReadinessDto[] = [
  {
    person: "Lauren Bennett",
    role: "Especialista senior de adquisicion de talento",
    branch: "Miami, FL",
    readiness: "78%",
    blocker: "Identificacion oficial pendiente",
    owner: "Colaborador",
    dueDate: "16 jul 2026",
    dayOneReady: "No listo",
  },
  {
    person: "Natalie Brooks",
    role: "Coordinador clinico de incorporacion",
    branch: "Orlando, FL",
    readiness: "91%",
    blocker: "Firma final de NDA",
    owner: "RRHH",
    dueDate: "15 jul 2026",
    dayOneReady: "En riesgo",
  },
  {
    person: "Marcus Hill",
    role: "Supervisor de operaciones de almacen",
    branch: "Jacksonville, FL",
    readiness: "96%",
    blocker: "Sin bloqueos",
    owner: "Supervisor",
    dueDate: "Listo",
    dayOneReady: "Listo",
  },
];

export const onboardingProgressByOwner: OnboardingOwnerProgressDto[] = [
  {
    owner: "Colaborador",
    progress: "74%",
    blocker: "2 documentos sin carga final",
    deadline: "16 jul 2026",
  },
  {
    owner: "Supervisor",
    progress: "88%",
    blocker: "1 asignación de equipo pendiente",
    deadline: "17 jul 2026",
  },
  {
    owner: "RRHH",
    progress: "83%",
    blocker: "1 firma y 1 validacion contractual",
    deadline: "Hoy",
  },
  {
    owner: "Cumplimiento",
    progress: "69%",
    blocker: "Falta marcar expediente auditable",
    deadline: "17 jul 2026",
  },
];

export const signaturePackages: SignaturePackageDto[] = [
  {
    id: "sign-1",
    title: "Paquete de ingreso Lauren Bennett",
    employeeName: "Lauren Bennett",
    status: "Pendiente colaborador",
    participants: "Empresa, colaborador, RRHH",
    nextAction: "Enviar recordatorio y bloquear avance hasta firma.",
  },
  {
    id: "sign-2",
    title: "Paquete clinico Natalie Brooks",
    employeeName: "Natalie Brooks",
    status: "Completado",
    participants: "Empresa, colaborador",
    nextAction: "Expediente listo para cierre documental.",
  },
  {
    id: "sign-3",
    title: "Paquete operativo Marcus Hill",
    employeeName: "Marcus Hill",
    status: "En transito",
    participants: "Empresa, colaborador, supervisor",
    nextAction: "Esperando firma del supervisor para el equipo asignado.",
  },
];

export const courses: CourseDto[] = [
  { id: "course-1", title: "Incorporacion laboral en EE. UU.", progress: "100%", type: "Obligatorio" },
  { id: "course-2", title: "HIPAA y privacidad del paciente", progress: "72%", type: "Recertificacion" },
  { id: "course-3", title: "Fundamentos de liderazgo operativo", progress: "34%", type: "Desarrollo" },
];

export const evaluations = [
  { name: "Politicas internas", pending: "10 pendientes", passRate: "97%" },
  { name: "Fundamentos de seguridad OSHA", pending: "5 pendientes", passRate: "91%" },
  { name: "Estandares de atencion al cliente", pending: "14 pendientes", passRate: "94%" },
];

export const productivityRows: ProductivityRowDto[] = [
  { id: "prod-1", area: "Operaciones Miami", productivity: "92.4", trend: "+3.6%", alert: "Sin alertas activas" },
  { id: "prod-2", area: "Logistica Jacksonville", productivity: "85.7", trend: "-1.2%", alert: "2 ventanas atipicas de inactividad" },
  { id: "prod-3", area: "RRHH Orlando", productivity: "89.1", trend: "+2.8%", alert: "1 retraso de cumplimiento documental" },
];

export const inventoryRows: InventoryItemDto[] = [
  { id: "inv-1", item: "Escaneres portatiles", stock: 11, assigned: 46, status: "Critico", location: "Jacksonville, FL" },
  { id: "inv-2", item: "Tablets clinicas", stock: 27, assigned: 93, status: "Reposicion", location: "Tampa, FL" },
  { id: "inv-3", item: "Cascos de seguridad", stock: 76, assigned: 164, status: "Estable", location: "Miami, FL" },
];

export const inventoryActivations: InventoryActivationDto[] = [
  {
    id: "inv-act-1",
    employeeName: "Lauren Bennett",
    item: "Laptop corporativa + kit de acceso",
    branch: "Miami, FL",
    status: "Pendiente de asignación",
    dueLabel: "Antes del dia 1",
  },
  {
    id: "inv-act-2",
    employeeName: "Marcus Hill",
    item: "Escaner portatil + EPP",
    branch: "Jacksonville, FL",
    status: "En preparacion",
    dueLabel: "Turno de manana",
  },
];

export const trainingActivations: TrainingActivationDto[] = [
  {
    id: "train-act-1",
    employeeName: "Lauren Bennett",
    courseTitle: "Fundamentos de adquisicion de talento",
    branch: "Miami, FL",
    status: "Pendiente activacion",
    dueLabel: "Primeras 24 horas",
  },
  {
    id: "train-act-2",
    employeeName: "Natalie Brooks",
    courseTitle: "HIPAA y privacidad del paciente",
    branch: "Orlando, FL",
    status: "En curso",
    dueLabel: "Esta semana",
  },
];

export const operationalHandoffs: OperationalHandoffDto[] = [
  {
    id: "handoff-1",
    employeeName: "Lauren Bennett",
    branch: "Miami, FL",
    status: "Pendiente activacion",
    nextAction: "Confirmar acompanamiento inicial, acceso al panel principal y objetivos de la primera semana.",
    owner: "Supervisor + Operacion",
  },
  {
    id: "handoff-2",
    employeeName: "Marcus Hill",
    branch: "Jacksonville, FL",
    status: "Activo",
    nextAction: "Supervisar productividad del nuevo turno y validar adopcion operativa.",
    owner: "Supervisor",
  },
];

export const complianceCheckpoints: ComplianceCheckpointDto[] = [
  {
    id: "comp-1",
    employeeName: "Lauren Bennett",
    branch: "Miami, FL",
    status: "Pendiente revision",
    nextAction: "Cerrar expediente auditable, validar accesos y confirmar cumplimiento inicial.",
    owner: "RRHH + Cumplimiento",
  },
  {
    id: "comp-2",
    employeeName: "Natalie Brooks",
    branch: "Orlando, FL",
    status: "Completado",
    nextAction: "Expediente archivado y reglas regulatorias verificadas.",
    owner: "Cumplimiento",
  },
];

export const accessTasks: AccessTaskDto[] = [
  {
    id: "acc-1",
    employeeName: "Lauren Bennett",
    branch: "Miami, FL",
    system: "Suite RRHH + correo",
    status: "Provision pendiente",
    nextAction: "Activar correo, ATS y firma electronica antes del dia 1.",
  },
  {
    id: "acc-2",
    employeeName: "Marcus Hill",
    branch: "Jacksonville, FL",
    system: "Operacion + inventario",
    status: "Activo",
    nextAction: "Mantener permisos de supervisor y trazabilidad de escaner.",
  },
];

export const operationalEvents: OperationalEventDto[] = [
  {
    id: "op-1",
    employeeName: "Lauren Bennett",
    type: "hiring",
    title: "Alta disparada desde ATS",
    description: "Incorporacion, activo inicial, capacitación y accesos quedaron en cola operativa.",
    status: "En seguimiento",
  },
  {
    id: "op-2",
    employeeName: "Marcus Hill",
    type: "branch_transfer",
    title: "Cambio de sede en revision",
    description: "Se revisa continuidad de activos y productividad para nuevo contexto operativo.",
    status: "Pendiente confirmacion",
  },
];

export const users = [
  { name: "Ava Thompson", role: "Superadministrador", access: "Activo", lastSeen: "Hace 2 min" },
  { name: "Olivia Carter", role: "Administrador de empresa", access: "Activo", lastSeen: "Hace 18 min" },
  { name: "Jordan Blake", role: "Supervisor", access: "Invitado", lastSeen: "Nunca" },
];

export const notifications = [
  { title: "Firma completada", meta: "Paquete laboral firmado por Natalie Brooks en Orlando", kind: "success" },
  { title: "Alerta de stock bajo", meta: "Los escaneres portatiles estan por debajo del umbral en Jacksonville", kind: "warning" },
  { title: "Nueva postulación", meta: "19 nuevas postulaciones para Supervisor de operaciones de almacén", kind: "info" },
];

export const reports = [
  { name: "Embudo de contratacion por sucursal", owner: "RRHH", cadence: "Semanal" },
  { name: "Cumplimiento documental por fecha de ingreso", owner: "Incorporacion", cadence: "Diaria" },
  { name: "Productividad por sucursal", owner: "Operaciones", cadence: "Tiempo real" },
];

export const automationJourneys: AutomationJourneyDto[] = [
  {
    title: "Alta de colaborador",
    description: "Cuando una vacante pasa a contratado, comienza la incorporación documental, la asignación inicial de activos y la formación obligatoria.",
    systems: "ATS → Incorporacion → Inventario → Capacitacion",
    status: "Activo",
  },
  {
    title: "Cambio de sucursal",
    description: "Al mover a una persona entre Miami, Orlando o Jacksonville, se reevalúan activos asignados, cursos regulatorios y seguimiento productivo.",
    systems: "Usuarios → Inventario → Capacitacion → Productividad",
    status: "En seguimiento",
  },
  {
    title: "Dia 1 listo",
    description: "El ingreso no queda liberado hasta confirmar checklist por actor, firma completa y activos listos para operar.",
    systems: "Incorporacion → Firmas → Inventario",
    status: "Bloqueado por regla",
  },
];

export const automationQueue: AutomationQueueItemDto[] = [
  {
    id: "auto-1",
    name: "Lauren Bennett",
    trigger: "Contratacion aprobada",
    nextAction: "Asignar laptop y activar ruta Fundamentos de adquisicion de talento",
    owner: "RRHH + IT operativo",
    status: "Pendiente",
  },
  {
    id: "auto-2",
    name: "Natalie Brooks",
    trigger: "Expediente casi completo",
    nextAction: "Liberar firma final y habilitar curso HIPAA",
    owner: "RRHH + Cumplimiento",
    status: "En seguimiento",
  },
  {
    id: "auto-3",
    name: "Marcus Hill",
    trigger: "Cambio de turno y sede",
    nextAction: "Reasignar scanner y refrescar entrenamiento OSHA",
    owner: "Supervisor + Inventario",
    status: "Pendiente",
  },
];

export const automationRules: AutomationRuleDto[] = [
  {
    id: "rule-1",
    name: "Alta integral por contratación",
    trigger: "Contratación confirmada",
    scope: "RRHH + Inventario + Capacitación + Accesos",
    owners: ["RRHH", "Inventario", "Capacitación"],
    consequences: [
      "Crear incorporación documental",
      "Asignar activo inicial",
      "Provisionar correo y accesos base",
      "Activar ruta formativa obligatoria",
      "Registrar políticas y acuses iniciales",
    ],
    auditability: "Trazable por empresa, sucursal y persona contratada",
    status: "Activa",
  },
  {
    id: "rule-2",
    name: "Traslado con revalidación operativa",
    trigger: "Cambio de sucursal",
    scope: "Operación + Inventario + Capacitación",
    owners: ["Operación", "Inventario", "Supervisor"],
    consequences: [
      "Mover activo y credenciales",
      "Actualizar responsable operativo",
      "Revalidar accesos de sede",
      "Activar inducción de la nueva sucursal",
    ],
    auditability: "Trazable por sede origen, sede destino y responsable",
    status: "En seguimiento",
  },
  {
    id: "rule-3",
    name: "Baja con cierre seguro",
    trigger: "Baja confirmada",
    scope: "RRHH + Seguridad + Inventario",
    owners: ["RRHH", "Seguridad", "Inventario"],
    consequences: [
      "Retirar activos",
      "Cerrar correo y accesos",
      "Archivar expediente final",
      "Bloquear permisos operativos",
    ],
    auditability: "Trazable con evidencia de retiro y cierre de accesos",
    status: "Controlada",
  },
];

export const automationAudit: AutomationAuditEntryDto[] = [
  {
    id: "audit-1",
    employeeName: "Marcus Hill",
    branch: "Jacksonville, FL",
    trigger: "Contratación confirmada",
    ruleName: "Alta integral por contratación",
    actor: "Motor de automatización",
    executedAt: "16 jul 2026 · 9:10 AM ET",
    status: "Ejecutada",
    summary: "Se abrió incorporación, se reservó escáner portátil y se activó la ruta de seguridad operacional.",
    consequences: [
      "Incorporación abierta",
      "Activo reservado",
      "Accesos base creados",
      "Capacitación obligatoria activada",
    ],
  },
  {
    id: "audit-2",
    employeeName: "Lauren Bennett",
    branch: "Miami, FL",
    trigger: "Checklist documental incompleto",
    ruleName: "Alta integral por contratación",
    actor: "Regla de bloqueo de día 1",
    executedAt: "16 jul 2026 · 11:35 AM ET",
    status: "En riesgo",
    summary: "La incorporación sigue abierta, pero el expediente quedó marcado con riesgo por identificación pendiente.",
    consequences: [
      "Bloqueo preventivo del día 1",
      "Recordatorio automático al colaborador",
      "Aviso a RRHH y supervisor",
    ],
  },
  {
    id: "audit-3",
    employeeName: "Daniel Brooks",
    branch: "Orlando, FL",
    trigger: "Cambio de sucursal",
    ruleName: "Traslado con revalidación operativa",
    actor: "Supervisor de área",
    executedAt: "15 jul 2026 · 4:20 PM ET",
    status: "Ejecutada",
    summary: "Se actualizó la sede operativa y se disparó revalidación de accesos, activo y capacitación local.",
    consequences: [
      "Credenciales en actualización",
      "Activo en traslado",
      "Inducción de nueva sede abierta",
    ],
  },
];

export const appDatasets: Record<string, AppDatasetsDto> = {
  "talentos-cloud-usa": {
    vacancies: jobs,
    candidates,
    inventory: inventoryRows,
  },
  "sunrise-health-florida": {
    vacancies: [jobs[0], jobs[1], jobs[3]],
    candidates: [candidates[0], candidates[2]],
    inventory: [],
  },
  "gulfshore-logistics": {
    vacancies: [jobs[2]],
    candidates: [candidates[1]],
    inventory: inventoryRows,
  },
};
