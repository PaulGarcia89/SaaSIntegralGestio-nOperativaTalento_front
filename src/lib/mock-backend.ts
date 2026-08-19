import type {
  AppDatasetsDto,
  BranchDto,
  CandidateDto,
  CandidateApplicationDto,
  CandidateStructuredAssessmentDto,
  AccessTaskDto,
  AutomationAuditEntryDto,
  AutomationJourneyDto,
  AutomationRuleDto,
  AutomationQueueItemDto,
  CourseDto,
  ComplianceCheckpointDto,
  InventoryActivationDto,
  InventoryItemDto,
  MasterWorkflowCardDto,
  MasterWorkflowStepDto,
  ModuleAssignmentDto,
  ModuleKey,
  OnboardingDocumentDto,
  OnboardingOwnerProgressDto,
  OnboardingReadinessDto,
  OperationalHandoffDto,
  OperationalEventDto,
  ProductivityRowDto,
  RoleDefinitionDto,
  RoleKey,
  SessionDto,
  SignaturePackageDto,
  SubscriptionDto,
  TenantDto,
  TrainingActivationDto,
  UserDto,
  VacancyHiringPlanDto,
  VacancyDto,
} from "@/lib/contracts";
import {
  accessTasks,
  automationAudit,
  alerts,
  automationJourneys,
  automationRules,
  automationQueue,
  candidates,
  candidateApplications,
  candidateStructuredAssessments,
  complianceCheckpoints,
  courses,
  dashboardKpis,
  documents,
  inventoryActivations,
  mockBranches,
  mockModuleAssignments,
  mockRoleDefinitions,
  mockSession,
  mockSubscriptions,
  mockTenants,
  mockUsers,
  onboardingOperationalReadiness,
  onboardingProgressByOwner,
  onboardingActorWorkspaces,
  operationalHandoffs,
  operationalEvents,
  pipelineStages,
  productivityRows,
  reports,
  rolePermissions,
  inventoryRows,
  jobs,
  signaturePackages,
  trainingActivations,
  vacancyHiringPlans,
} from "@/lib/mock-data";
import { appNavigation } from "@/lib/navigation";

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
const candidateApplicationsDb: CandidateApplicationDto[] = structuredClone(candidateApplications);
const candidateStructuredAssessmentsDb: CandidateStructuredAssessmentDto[] = structuredClone(candidateStructuredAssessments);
const vacancyHiringPlansDb: VacancyHiringPlanDto[] = structuredClone(vacancyHiringPlans);
let onboardingDocumentsDb: OnboardingDocumentDto[] = structuredClone(documents);
let onboardingReadinessDb: OnboardingReadinessDto[] = structuredClone(onboardingOperationalReadiness);
let onboardingOwnerProgressDb: OnboardingOwnerProgressDto[] = structuredClone(onboardingProgressByOwner);
const onboardingActorWorkspacesDb = structuredClone(onboardingActorWorkspaces);
let signaturePackagesDb: SignaturePackageDto[] = structuredClone(signaturePackages);
const automationJourneysDb: AutomationJourneyDto[] = structuredClone(automationJourneys);
const automationRulesDb: AutomationRuleDto[] = structuredClone(automationRules);
let automationAuditDb: AutomationAuditEntryDto[] = structuredClone(automationAudit);
let automationQueueDb: AutomationQueueItemDto[] = structuredClone(automationQueue);
const inventoryDb: InventoryItemDto[] = structuredClone(inventoryRows);
let inventoryActivationsDb: InventoryActivationDto[] = structuredClone(inventoryActivations);
let coursesDb: CourseDto[] = structuredClone(courses);
let trainingActivationsDb: TrainingActivationDto[] = structuredClone(trainingActivations);
let operationalHandoffsDb: OperationalHandoffDto[] = structuredClone(operationalHandoffs);
let complianceCheckpointsDb: ComplianceCheckpointDto[] = structuredClone(complianceCheckpoints);
const productivityRowsDb: ProductivityRowDto[] = structuredClone(productivityRows);
let accessTasksDb: AccessTaskDto[] = structuredClone(accessTasks);
let operationalEventsDb: OperationalEventDto[] = structuredClone(operationalEvents);
type EmployeeRecord = {
  id: string;
  name: string;
  email: string;
  status: "ACTIVE" | "INACTIVE" | "TERMINATED";
  branchAssignments: Array<{ id: string; role: string; isPrimary: boolean; branch: { id: string; name: string } }>;
  documentSummary?: { totalDocuments: number };
};

let employeesDb: EmployeeRecord[] = [
  {
    id: "emp-1",
    name: "Paul Garcia",
    email: "datalinkprotech@gmail.com",
    status: "ACTIVE",
    branchAssignments: [
      { id: "emp-1-a1", role: "Administrador de empresa", isPrimary: true, branch: { id: "branch-1", name: "Sede principal de Miami" } },
    ],
    documentSummary: { totalDocuments: 0 },
  },
  {
    id: "emp-2",
    name: "Luis Sosa",
    email: "luissosa@lessa.com",
    status: "ACTIVE",
    branchAssignments: [
      { id: "emp-2-a1", role: "Supervisor", isPrimary: true, branch: { id: "branch-1b", name: "Centro operativo de Orlando" } },
    ],
    documentSummary: { totalDocuments: 0 },
  },
];

function getTenantById(tenantId: string): TenantDto {
  return tenantsDb.find((tenant) => tenant.id === tenantId) ?? tenantsDb[0];
}

function getUserByEmail(email: string): UserDto {
  return usersDb.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? usersDb[0];
}

function updateAutomationRuleStatus(ruleName: string, status: AutomationRuleDto["status"]) {
  const rule = automationRulesDb.find((item) => item.name === ruleName);
  if (rule) {
    rule.status = status;
  }
}

function appendAutomationAudit(entry: Omit<AutomationAuditEntryDto, "id">) {
  automationAuditDb = [{ id: makeId("audit"), ...entry }, ...automationAuditDb];
}

function normalizeOperationalDate(label?: string) {
  if (!label) return "17 jul 2026";

  const normalized = label.toLowerCase();
  if (normalized === "hoy") return "16 jul 2026";
  if (normalized === "listo") return "16 jul 2026";
  if (normalized === "esta semana") return "19 jul 2026";
  if (normalized === "primeras 24 horas") return "17 jul 2026";
  if (normalized === "turno de manana") return "17 jul 2026";
  if (normalized === "antes de cierre de jornada") return "16 jul 2026";
  if (normalized === "ruta habilitada") return "17 jul 2026";
  if (normalized === "ruta completada") return "16 jul 2026";
  if (normalized === "activo listo para operar") return "16 jul 2026";

  return label;
}

function buildMasterWorkflowCard(employeeName: string): MasterWorkflowCardDto | null {
  const readiness = onboardingReadinessDb.find((item) => item.person === employeeName);
  if (!readiness) return null;

  const signaturePackage = signaturePackagesDb.find((item) => item.employeeName === employeeName);
  const inventoryActivation = inventoryActivationsDb.find((item) => item.employeeName === employeeName);
  const trainingActivation = trainingActivationsDb.find((item) => item.employeeName === employeeName);
  const operationalHandoff = operationalHandoffsDb.find((item) => item.employeeName === employeeName);
  const complianceCheckpoint = complianceCheckpointsDb.find((item) => item.employeeName === employeeName);
  const queueItem = automationQueueDb.find(
    (item) =>
      item.name === employeeName &&
      (item.trigger === "Contratacion confirmada" || item.trigger === "Contratacion aprobada"),
  );
  const eventItem = operationalEventsDb.find((item) => item.employeeName === employeeName && item.type === "hiring");

  const steps: MasterWorkflowStepDto[] = [
    {
      id: "step-candidate",
      label: "Candidatura",
      status: "completed",
      detail: "La persona ya completó su postulación y fue priorizada en las etapas del proceso.",
      owner: "Candidato + RRHH",
      sla: "Revision inicial en 24 horas",
      targetDate: "11 jul 2026",
    },
    {
      id: "step-hiring",
      label: "Contratacion",
      status: queueItem || eventItem ? "completed" : "pending",
      detail: eventItem?.title ?? "Decision final aun no consolidada",
      owner: queueItem?.owner ?? "RRHH + lider de contratacion",
      sla: "Decision final en 48 horas",
      targetDate: queueItem || eventItem ? "15 jul 2026" : "17 jul 2026",
    },
    {
      id: "step-onboarding",
      label: "Incorporacion",
      status: signaturePackage?.status === "Completado" ? "completed" : signaturePackage ? "in_progress" : "pending",
      detail: signaturePackage?.nextAction ?? readiness.blocker,
      owner: readiness.owner,
      sla: "Expediente listo antes del dia 1",
      targetDate: normalizeOperationalDate(readiness.dueDate),
    },
    {
      id: "step-formation",
      label: "Formacion",
      status: trainingActivation?.status === "Completado" ? "completed" : trainingActivation ? "in_progress" : "pending",
      detail: trainingActivation ? `${trainingActivation.courseTitle} · ${trainingActivation.status}` : "Ruta no activada",
      owner: trainingActivation ? "Formacion + supervisor" : "Formacion",
      sla: "Ruta obligatoria dentro de 72 horas",
      targetDate: normalizeOperationalDate(trainingActivation?.dueLabel ?? inventoryActivation?.dueLabel),
    },
    {
      id: "step-operation",
      label: "Operacion",
      status: operationalHandoff?.status === "Operativo" ? "completed" : operationalHandoff ? "in_progress" : "pending",
      detail: operationalHandoff?.nextAction ?? "Transferencia operativa pendiente",
      owner: operationalHandoff?.owner ?? "Supervisor + Operacion",
      sla: "Transferencia en 24 horas tras formación",
      targetDate: operationalHandoff?.status === "Operativo" ? "16 jul 2026" : "17 jul 2026",
    },
    {
      id: "step-compliance",
      label: "Administracion y cumplimiento",
      status: complianceCheckpoint?.status === "Completado" ? "completed" : complianceCheckpoint ? "in_progress" : "pending",
      detail: complianceCheckpoint?.nextAction ?? "Cierre administrativo pendiente",
      owner: complianceCheckpoint?.owner ?? "RRHH + Cumplimiento",
      sla: "Cierre auditable dentro de 48 horas",
      targetDate: complianceCheckpoint?.status === "Completado" ? "16 jul 2026" : "18 jul 2026",
    },
  ];

  const completedCount = steps.filter((step) => step.status === "completed").length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);
  const blockers = [
    readiness.blocker !== "Sin bloqueos" ? readiness.blocker : "",
    ...steps
      .filter((step) => step.status !== "completed")
      .map((step) => step.detail),
  ].filter(Boolean);

  return {
    employeeName,
    branchName: readiness.branch,
    workflowType: "hiring",
    globalStatus: queueItem?.status ?? eventItem?.status ?? readiness.dayOneReady,
    progressPercent,
    currentStage:
      progressPercent === 100
        ? "Ciclo completo"
        : progressPercent >= 84
          ? "Administracion y cumplimiento"
          : progressPercent >= 67
            ? "Operacion"
            : progressPercent >= 50
              ? "Formacion"
              : progressPercent >= 34
          ? "Incorporacion"
                : "Contratacion"
        ,
    summary:
      eventItem?.description ??
      queueItem?.nextAction ??
      "El flujo maestro consolida candidatura, contratación, incorporacion, formacion, operacion y cumplimiento.",
    blockers,
    steps,
    updatedAtLabel: "Actualizado hace instantes",
  };
}

function syncHiringMasterFlow(employeeName: string) {
  const onboardingReady = signaturePackagesDb.some(
    (pkg) => pkg.employeeName === employeeName && pkg.status === "Completado",
  );
  const assetAssigned = inventoryActivationsDb.some(
    (item) => item.employeeName === employeeName && item.status === "Asignado",
  );
  const trainingCompleted = trainingActivationsDb.some(
    (item) => item.employeeName === employeeName && item.status === "Completado",
  );
  const operationCompleted = operationalHandoffsDb.some(
    (item) => item.employeeName === employeeName && item.status === "Operativo",
  );
  const complianceCompleted = complianceCheckpointsDb.some(
    (item) => item.employeeName === employeeName && item.status === "Completado",
  );

  const queueItem = automationQueueDb.find(
    (item) =>
      item.name === employeeName &&
      (item.trigger === "Contratacion confirmada" || item.trigger === "Contratacion aprobada"),
  );
  const eventItem = operationalEventsDb.find(
    (item) => item.employeeName === employeeName && item.type === "hiring",
  );

  if (queueItem) {
    if (onboardingReady && assetAssigned && trainingCompleted && operationCompleted && complianceCompleted) {
      queueItem.status = "Ciclo completo";
      queueItem.nextAction = "Candidato contratado, incorporado, formado, operativo y validado por cumplimiento.";
    } else if (onboardingReady && assetAssigned && trainingCompleted && operationCompleted) {
      queueItem.status = "En cumplimiento";
      queueItem.nextAction = "Solo falta cerrar administración y cumplimiento para completar el ciclo.";
    } else if (onboardingReady && assetAssigned && trainingCompleted) {
      queueItem.status = "Listo para operacion";
      queueItem.nextAction = "La persona puede pasar a transferencia operativa y seguimiento productivo.";
    } else if (onboardingReady && assetAssigned) {
      queueItem.status = "Listo para formacion";
      queueItem.nextAction = "Incorporacion y activo cerrados; ahora debe completar formacion obligatoria.";
    } else if (onboardingReady) {
      queueItem.status = "Incorporacion completa";
      queueItem.nextAction = "Solo falta confirmar la asignación del activo para cerrar el flujo.";
    } else if (assetAssigned) {
      queueItem.status = "Activo asignado";
      queueItem.nextAction = "Solo falta completar la incorporacion para cerrar el flujo maestro.";
    } else {
      queueItem.status = "Nuevo";
    }
  }

  if (eventItem) {
    if (onboardingReady && assetAssigned && trainingCompleted && operationCompleted && complianceCompleted) {
      eventItem.status = "Ciclo completo";
      eventItem.description = `${employeeName} cerró candidatura, contratación, incorporacion, formación, operación y cumplimiento.`;
    } else if (onboardingReady && assetAssigned && trainingCompleted && operationCompleted) {
      eventItem.status = "En cumplimiento";
      eventItem.description = `${employeeName} ya opera en la sede y solo queda el cierre administrativo y de cumplimiento.`;
    } else if (onboardingReady && assetAssigned && trainingCompleted) {
      eventItem.status = "Listo para operacion";
      eventItem.description = `${employeeName} completó la formación y ya puede pasar a transferencia operativa.`;
    } else if (onboardingReady && assetAssigned) {
      eventItem.status = "Listo para formacion";
      eventItem.description = `${employeeName} completó la incorporacion y recibió su activo; la siguiente etapa es la formación obligatoria.`;
    } else if (onboardingReady) {
      eventItem.status = "Incorporacion completa";
      eventItem.description = `${employeeName} ya completó la incorporación; queda pendiente la asignación final del activo.`;
    } else if (assetAssigned) {
      eventItem.status = "Activo asignado";
      eventItem.description = `${employeeName} ya tiene activo asignado; queda pendiente el cierre de la incorporacion.`;
    } else {
      eventItem.status = "Activo";
    }
  }

  if (onboardingReady && assetAssigned) {
    const readiness = onboardingReadinessDb.find((item) => item.person === employeeName);
    if (readiness) {
      readiness.readiness = "100%";
      readiness.blocker = "Sin bloqueos";
      readiness.owner = "RRHH";
      readiness.dueDate = "Listo";
      readiness.dayOneReady = "Listo";
    }

    trainingActivationsDb = trainingActivationsDb.map((item) =>
      item.employeeName === employeeName
        ? { ...item, status: item.status === "Pendiente activacion" ? "Activo" : item.status, dueLabel: "Ruta habilitada" }
        : item,
    );
    accessTasksDb = accessTasksDb.map((item) =>
      item.employeeName === employeeName
        ? { ...item, status: "Activo", nextAction: "Accesos base, incorporacion y capacitación ya quedaron habilitados." }
        : item,
    );
  }
}

function mapEmployeeFromInput(input: { name: string; email: string; status?: "ACTIVE" | "INACTIVE" | "TERMINATED"; primaryBranchId: string; primaryRole: string }) {
  const branch = branchesDb.find((item) => item.id === input.primaryBranchId);
  if (!branch) throw new Error("Sucursal no encontrada");
  return {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    status: input.status ?? "ACTIVE",
    branchAssignments: [{ id: makeId("emp-asg"), role: input.primaryRole.trim(), isPrimary: true, branch: { id: branch.id, name: branch.name } }],
  };
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

export async function fetchEmployees(input: { search?: string; status?: string; branchId?: string; page?: number; pageSize?: number } = {}) {
  await wait();
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.max(1, input.pageSize ?? 20);
  const search = (input.search ?? "").trim().toLowerCase();
  const filtered = employeesDb.filter((employee) => {
    const primary = employee.branchAssignments.find((assignment) => assignment.isPrimary) ?? employee.branchAssignments[0];
    const matchesSearch = !search || employee.name.toLowerCase().includes(search) || employee.email.toLowerCase().includes(search);
    const matchesStatus = !input.status || employee.status === input.status;
    const matchesBranch = !input.branchId || primary?.branch.id === input.branchId;
    return matchesSearch && matchesStatus && matchesBranch;
  });
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const items = filtered.slice((page - 1) * pageSize, page * pageSize);
  return { data: items, meta: { total, page, pageSize, totalPages } };
}

export async function createEmployee(input: { name: string; email: string; status?: "ACTIVE" | "INACTIVE" | "TERMINATED"; primaryBranchId: string; primaryRole: string }) {
  await wait();
  const created = { id: makeId("emp"), ...mapEmployeeFromInput(input), documentSummary: { totalDocuments: 0 } };
  employeesDb = [created, ...employeesDb];
  return created;
}

export async function bulkCreateEmployees(employees: Array<{ name: string; email: string; status?: "ACTIVE" | "INACTIVE" | "TERMINATED"; primaryBranchId: string; primaryRole: string }>) {
  await wait();
  const createdEmployees = employees.map((employee) => {
    const created = { id: makeId("emp"), ...mapEmployeeFromInput(employee), documentSummary: { totalDocuments: 0 } };
    return created;
  });
  employeesDb = [...createdEmployees, ...employeesDb];
  return { created: createdEmployees.length, employees: createdEmployees.map((employee) => ({ id: employee.id, email: employee.email })) };
}

export async function updateEmployee(id: string, input: { name: string; email: string; status?: "ACTIVE" | "INACTIVE" | "TERMINATED"; primaryBranchId: string; primaryRole: string }) {
  await wait();
  employeesDb = employeesDb.map((employee) => (employee.id === id ? { id, ...mapEmployeeFromInput(input), documentSummary: employee.documentSummary } : employee));
  const updated = employeesDb.find((employee) => employee.id === id);
  if (!updated) throw new Error("Empleado no encontrado");
  return updated;
}

export async function deleteEmployee(id: string) {
  await wait();
  employeesDb = employeesDb.filter((employee) => employee.id !== id);
  return { id };
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
        ["Especialista en adquisicion de talento", "Coordinador de incorporacion"].includes(candidate.role),
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
  const workflowCard = await fetchMasterWorkflowCard(tenantId);
  const tenant = getTenantById(tenantId);
  const branchCities = branchesDb
    .filter((branch) => branch.tenantId === tenant.id)
    .map((branch) => branch.city);
  const audit =
    tenant.id === "tenant-1"
      ? automationAuditDb
      : automationAuditDb.filter((item) => branchCities.includes(item.branch));
  return {
    kpis: dashboardKpis,
    alerts,
    pipeline: pipelineStages,
    reports,
    automationJourneys: automationJourneysDb,
    automationRules: automationRulesDb,
    automationAudit: audit,
    automationQueue: automationQueueDb,
    totals: {
      vacancies: vacanciesDb.length,
      candidates: candidatesDb.length,
      inventory: inventoryDb.length,
      tenantId,
    },
    workflowCard,
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
      ["Especialista en adquisicion de talento", "Coordinador de incorporacion"].includes(candidate.role),
    );
  }
  if (tenantId === "tenant-3") {
    return candidatesDb.filter((candidate) => candidate.role === "Warehouse Operations Supervisor");
  }
  return candidatesDb;
}

export async function fetchCandidateApplications(): Promise<CandidateApplicationDto[]> {
  await wait();
  return candidateApplicationsDb;
}

export async function fetchCandidateApplication(id: string): Promise<CandidateApplicationDto | null> {
  await wait();
  return candidateApplicationsDb.find((application) => application.id === id) ?? null;
}

export async function fetchCandidateStructuredAssessments(
  tenantId: string,
): Promise<CandidateStructuredAssessmentDto[]> {
  await wait();
  const visibleCandidates = await fetchCandidates(tenantId);
  const visibleIds = new Set(visibleCandidates.map((candidate) => candidate.id));
  return candidateStructuredAssessmentsDb.filter((assessment) => visibleIds.has(assessment.candidateId));
}

export async function fetchAutomationSummary() {
  await wait();
  return {
    journeys: automationJourneysDb,
    rules: automationRulesDb,
    audit: automationAuditDb,
    queue: automationQueueDb,
  };
}

export async function fetchOnboardingWorkspace(tenantId: string) {
  await wait();
  const tenant = getTenantById(tenantId);
  const branchCities = branchesDb
    .filter((branch) => branch.tenantId === tenant.id)
    .map((branch) => branch.city);

  return {
    documents:
      tenant.id === "tenant-1"
        ? onboardingDocumentsDb
        : onboardingDocumentsDb.filter((item) =>
            onboardingReadinessDb.some((entry) => entry.person === item.owner && branchCities.includes(entry.branch)),
          ),
    signaturePackages:
      tenant.id === "tenant-1"
        ? signaturePackagesDb
        : signaturePackagesDb.filter((item) =>
            onboardingReadinessDb.some((entry) => entry.person === item.employeeName && branchCities.includes(entry.branch)),
          ),
    readiness:
      tenant.id === "tenant-1"
        ? onboardingReadinessDb
        : onboardingReadinessDb.filter((item) => branchCities.includes(item.branch)),
    progressByOwner: onboardingOwnerProgressDb,
    actorWorkspaces: onboardingActorWorkspacesDb,
  };
}

export async function fetchInventoryActivations(tenantId: string) {
  await wait();
  const tenant = getTenantById(tenantId);
  const branchCities = branchesDb
    .filter((branch) => branch.tenantId === tenant.id)
    .map((branch) => branch.city);

  if (tenant.id === "tenant-1") {
    return inventoryActivationsDb;
  }

  return inventoryActivationsDb.filter((item) => branchCities.includes(item.branch));
}

export async function fetchTrainingWorkspace(tenantId: string) {
  await wait();
  const tenant = getTenantById(tenantId);
  const branchCities = branchesDb
    .filter((branch) => branch.tenantId === tenant.id)
    .map((branch) => branch.city);

  return {
    courses: coursesDb,
    activations:
      tenant.id === "tenant-1"
        ? trainingActivationsDb
        : trainingActivationsDb.filter((item) => branchCities.includes(item.branch)),
    handoffs:
      tenant.id === "tenant-1"
        ? operationalHandoffsDb
        : operationalHandoffsDb.filter((item) => branchCities.includes(item.branch)),
  };
}

export async function fetchProductivityWorkspace(tenantId: string) {
  await wait();
  const tenant = getTenantById(tenantId);
  const branchCities = branchesDb
    .filter((branch) => branch.tenantId === tenant.id)
    .map((branch) => branch.city);

  return {
    rows:
      tenant.id === "tenant-1"
        ? productivityRowsDb
        : productivityRowsDb.filter((row) => branchCities.some((city) => row.area.includes(city.split(",")[0]))),
    accessTasks:
      tenant.id === "tenant-1"
        ? accessTasksDb
        : accessTasksDb.filter((item) => branchCities.includes(item.branch)),
    handoffs:
      tenant.id === "tenant-1"
        ? operationalHandoffsDb
        : operationalHandoffsDb.filter((item) => branchCities.includes(item.branch)),
    compliance:
      tenant.id === "tenant-1"
        ? complianceCheckpointsDb
        : complianceCheckpointsDb.filter((item) => branchCities.includes(item.branch)),
    events:
      tenant.id === "tenant-1"
        ? operationalEventsDb
        : operationalEventsDb.filter((item) => branchCities.some((city) => item.description.includes(city.split(",")[0]) || item.title.includes(city.split(",")[0]))),
    automationRules: automationRulesDb,
    automationAudit:
      tenant.id === "tenant-1"
        ? automationAuditDb
        : automationAuditDb.filter((item) => branchCities.includes(item.branch)),
    actors:
      tenant.id === "tenant-1"
        ? onboardingReadinessDb.map((item) => ({ name: item.person, branch: item.branch, role: item.role }))
        : onboardingReadinessDb
            .filter((item) => branchCities.includes(item.branch))
            .map((item) => ({ name: item.person, branch: item.branch, role: item.role })),
  };
}

export async function fetchMasterWorkflowCard(tenantId: string): Promise<MasterWorkflowCardDto | null> {
  await wait();
  const tenant = getTenantById(tenantId);
  const branchCities = branchesDb
    .filter((branch) => branch.tenantId === tenant.id)
    .map((branch) => branch.city);

  const visibleEmployees = onboardingReadinessDb
    .filter((item) => tenant.id === "tenant-1" || branchCities.includes(item.branch))
    .map((item) => item.person);

  const priorityEmployee =
    automationQueueDb.find(
      (item) =>
        visibleEmployees.includes(item.name) &&
        (item.trigger === "Contratacion confirmada" || item.trigger === "Contratacion aprobada"),
    )?.name ??
    operationalEventsDb.find(
      (item) => visibleEmployees.includes(item.employeeName) && item.type === "hiring",
    )?.employeeName ??
    visibleEmployees[0];

  return priorityEmployee ? buildMasterWorkflowCard(priorityEmployee) : null;
}

export async function fetchAdminComplianceWorkspace(tenantId: string) {
  await wait();
  const tenant = getTenantById(tenantId);
  const branchCities = branchesDb
    .filter((branch) => branch.tenantId === tenant.id)
    .map((branch) => branch.city);

  return {
    handoffs:
      tenant.id === "tenant-1"
        ? operationalHandoffsDb
        : operationalHandoffsDb.filter((item) => branchCities.includes(item.branch)),
    compliance:
      tenant.id === "tenant-1"
        ? complianceCheckpointsDb
        : complianceCheckpointsDb.filter((item) => branchCities.includes(item.branch)),
    accessTasks:
      tenant.id === "tenant-1"
        ? accessTasksDb
        : accessTasksDb.filter((item) => branchCities.includes(item.branch)),
    events:
      tenant.id === "tenant-1"
        ? operationalEventsDb
        : operationalEventsDb.filter((item) => branchCities.some((city) => item.description.includes(city.split(",")[0]) || item.title.includes(city.split(",")[0]))),
    automationRules: automationRulesDb,
    automationAudit:
      tenant.id === "tenant-1"
        ? automationAuditDb
        : automationAuditDb.filter((item) => branchCities.includes(item.branch)),
  };
}

export async function triggerCandidateHiringAutomation(candidateId: string) {
  await wait();
  const candidate = candidatesDb.find((item) => item.id === candidateId);
  const assessment = candidateStructuredAssessmentsDb.find((item) => item.candidateId === candidateId);
  const vacancy = vacanciesDb.find((item) => item.id === candidate?.vacancyId);

  if (!candidate || !assessment || !vacancy) {
    throw new Error("Candidato no encontrado");
  }

  if (assessment.advancementBlocked) {
    throw new Error("Aun falta retroalimentación obligatoria");
  }

  candidate.stage = "Contratado";
  assessment.currentStage = "Contratado";
  assessment.consolidatedRecommendation = "Avanzar";
  assessment.decisionSummary =
    "La contratación fue confirmada y ya se activó el flujo operativo para incorporacion, activos y formación.";

  const existing = automationQueueDb.find((item) => item.name === candidate.name && item.trigger === "Contratacion confirmada");

  if (!existing) {
    automationQueueDb = [
      {
        id: makeId("auto"),
        name: candidate.name,
        trigger: "Contratacion confirmada",
        nextAction: `Crear incorporacion, asignar activo inicial y activar ruta formativa para ${candidate.role}.`,
        owner: "RRHH + Inventario + Capacitacion",
        status: "Nuevo",
      },
      ...automationQueueDb,
    ];
  }

  if (!onboardingReadinessDb.some((item) => item.person === candidate.name)) {
    onboardingReadinessDb = [
      {
        person: candidate.name,
        role: candidate.role,
        branch: vacancy.location,
        readiness: "24%",
        blocker: "Identificacion oficial y formulario fiscal pendientes",
        owner: "Colaborador",
        dueDate: "18 jul 2026",
        dayOneReady: "No listo",
      },
      ...onboardingReadinessDb,
    ];
  }

  if (!onboardingDocumentsDb.some((item) => item.owner === candidate.name && item.name === "Expediente inicial de contratacion")) {
    onboardingDocumentsDb = [
      {
        id: makeId("doc"),
        name: "Expediente inicial de contratacion",
        owner: candidate.name,
        status: "Pendiente carga",
        expires: "18 jul 2026",
      },
      ...onboardingDocumentsDb,
    ];
  }

  onboardingOwnerProgressDb = onboardingOwnerProgressDb.map((item) => {
    if (item.owner === "Colaborador") {
      return { ...item, blocker: `Pendientes iniciales para ${candidate.name}`, deadline: "18 jul 2026" };
    }
    if (item.owner === "Supervisor") {
      return { ...item, blocker: `Asignar herramientas y agenda del dia 1 para ${candidate.name}`, deadline: "18 jul 2026" };
    }
    if (item.owner === "RRHH") {
      return { ...item, blocker: `Abrir expediente y firma contractual de ${candidate.name}`, deadline: "Hoy" };
    }
    return item;
  });

  if (!inventoryActivationsDb.some((item) => item.employeeName === candidate.name)) {
    inventoryActivationsDb = [
      {
        id: makeId("invact"),
        employeeName: candidate.name,
        item: candidate.role.toLowerCase().includes("incorporacion")
          ? "Tablet clinica + credenciales"
          : candidate.role.toLowerCase().includes("operaciones")
            ? "Escaner portatil + EPP"
            : "Laptop corporativa + accesos",
        branch: vacancy.location,
        status: "Pendiente de asignación",
        dueLabel: "Antes del dia 1",
      },
      ...inventoryActivationsDb,
    ];
  }

  if (!trainingActivationsDb.some((item) => item.employeeName === candidate.name)) {
    const courseTitle = candidate.role.toLowerCase().includes("operaciones")
      ? "Ruta OSHA y seguridad operacional"
      : candidate.role.toLowerCase().includes("incorporacion")
        ? "Ruta clinica de ingreso y cumplimiento"
        : "Talent Acquisition Foundations";

    trainingActivationsDb = [
      {
        id: makeId("trainact"),
        employeeName: candidate.name,
        courseTitle,
        branch: vacancy.location,
        status: "Pendiente activacion",
        dueLabel: "Primeras 24 horas",
      },
      ...trainingActivationsDb,
    ];

    if (!coursesDb.some((course) => course.title === courseTitle)) {
      coursesDb = [
        {
          id: makeId("course"),
          title: courseTitle,
          progress: "0%",
          type: "Ruta automatizada",
        },
        ...coursesDb,
      ];
    }
  }

  if (!signaturePackagesDb.some((item) => item.employeeName === candidate.name)) {
    signaturePackagesDb = [
      {
        id: makeId("sign"),
        title: `Paquete de ingreso ${candidate.name}`,
        employeeName: candidate.name,
        status: "Pendiente colaborador",
        participants: "Empresa, colaborador, RRHH",
        nextAction: "Completar firma para habilitar el cierre de la incorporacion.",
      },
      ...signaturePackagesDb,
    ];
  }

  if (!accessTasksDb.some((item) => item.employeeName === candidate.name && item.system === "Correo + onboarding + training")) {
    accessTasksDb = [
      {
        id: makeId("acc"),
        employeeName: candidate.name,
        branch: vacancy.location,
        system: "Correo + incorporacion + capacitacion",
        status: "Provision pendiente",
        nextAction: "Crear accesos base, firma electronica y rutas obligatorias antes del dia 1.",
      },
      ...accessTasksDb,
    ];
  }

  operationalEventsDb = [
    {
      id: makeId("opevt"),
      employeeName: candidate.name,
      type: "hiring",
      title: "Alta automatizada confirmada",
      description: `Se activaron incorporacion, activo inicial, accesos y capacitacion para ${candidate.name} en ${vacancy.location}.`,
      status: "Activo",
    },
    ...operationalEventsDb.filter((item) => !(item.employeeName === candidate.name && item.type === "hiring")),
  ];

  updateAutomationRuleStatus("Alta integral por contratación", "Activa");
  appendAutomationAudit({
    employeeName: candidate.name,
    branch: vacancy.location,
    trigger: "Contratación confirmada",
    ruleName: "Alta integral por contratación",
    actor: "Motor de automatización",
    executedAt: "16 jul 2026 · 1:05 PM ET",
    status: "Ejecutada",
    summary: `Se activaron incorporación, activo inicial, accesos base y capacitación para ${candidate.name}.`,
    consequences: [
      "Incorporación creada",
      "Activo inicial en cola",
      "Accesos base en provisión",
      "Ruta formativa obligatoria activada",
      "Políticas iniciales pendientes de acuse",
    ],
  });

  syncHiringMasterFlow(candidate.name);

  return {
    candidate,
    assessment,
    queue: automationQueueDb,
  };
}

export async function triggerBranchTransferAutomation(personName: string, targetBranchId: string) {
  await wait();
  const targetBranch = branchesDb.find((branch) => branch.id === targetBranchId);
  const readiness = onboardingReadinessDb.find((item) => item.person === personName);

  if (!targetBranch || !readiness) {
    throw new Error("No se pudo preparar el cambio de sucursal");
  }

  readiness.branch = targetBranch.city;
  readiness.owner = "Supervisor";
  readiness.blocker = `Validar activos, permisos y productividad para ${targetBranch.name}`;
  readiness.dueDate = "48 horas";
  readiness.dayOneReady = "En riesgo";

  inventoryActivationsDb = [
    {
      id: makeId("invact"),
      employeeName: personName,
      item: "Reasignación de activo y credenciales de sede",
      branch: targetBranch.city,
      status: "Traslado pendiente",
      dueLabel: "Antes del cambio de turno",
    },
    ...inventoryActivationsDb.filter((item) => !(item.employeeName === personName && item.status === "Traslado pendiente")),
  ];

  trainingActivationsDb = [
    {
      id: makeId("trainact"),
      employeeName: personName,
      courseTitle: `Induccion operativa de ${targetBranch.city}`,
      branch: targetBranch.city,
      status: "Revalidacion pendiente",
      dueLabel: "Primeras 24 horas en nueva sede",
    },
    ...trainingActivationsDb.filter((item) => !(item.employeeName === personName && item.status === "Revalidacion pendiente")),
  ];

  if (!coursesDb.some((course) => course.title === `Induccion operativa de ${targetBranch.city}`)) {
    coursesDb = [
      {
        id: makeId("course"),
        title: `Induccion operativa de ${targetBranch.city}`,
        progress: "0%",
        type: "Revalidacion por sede",
      },
      ...coursesDb,
    ];
  }

  accessTasksDb = [
    {
      id: makeId("acc"),
      employeeName: personName,
      branch: targetBranch.city,
      system: "Permisos operativos + trazabilidad",
      status: "Actualizacion pendiente",
      nextAction: "Actualizar responsable, permisos de sede y accesos operativos del colaborador.",
    },
    ...accessTasksDb.filter((item) => !(item.employeeName === personName && item.system === "Permisos operativos + trazabilidad")),
  ];

  const areaLabel =
    targetBranch.city.includes("Miami")
      ? "Operaciones Miami"
      : targetBranch.city.includes("Orlando")
        ? "RRHH Orlando"
        : "Logistica Jacksonville";
  const productivityRow = productivityRowsDb.find((row) => row.area === areaLabel);
  if (productivityRow) {
    productivityRow.alert = `Cambio de sucursal en seguimiento para ${personName}`;
    productivityRow.trend = targetBranch.city.includes("Miami") ? "+1.1%" : targetBranch.city.includes("Orlando") ? "+0.7%" : "-0.4%";
  }

  automationQueueDb = [
    {
      id: makeId("auto"),
      name: personName,
      trigger: "Cambio de sucursal",
      nextAction: `Mover activos, actualizar responsable y revisar productividad para ${targetBranch.city}.`,
      owner: "Operacion + Inventario + Capacitacion",
      status: "Nuevo",
    },
    ...automationQueueDb.filter((item) => !(item.name === personName && item.trigger === "Cambio de sucursal")),
  ];

  operationalEventsDb = [
    {
      id: makeId("opevt"),
      employeeName: personName,
      type: "branch_transfer",
      title: "Cambio de sucursal activado",
      description: `${personName} fue movido a ${targetBranch.city} con revision de activos, permisos y productividad.`,
      status: "En seguimiento",
    },
    ...operationalEventsDb.filter((item) => !(item.employeeName === personName && item.type === "branch_transfer")),
  ];

  updateAutomationRuleStatus("Traslado con revalidación operativa", "En seguimiento");
  appendAutomationAudit({
    employeeName: personName,
    branch: targetBranch.city,
    trigger: "Cambio de sucursal",
    ruleName: "Traslado con revalidación operativa",
    actor: "Supervisor de área",
    executedAt: "16 jul 2026 · 1:18 PM ET",
    status: "Ejecutada",
    summary: `${personName} fue movido a ${targetBranch.city} y se dispararon activo, accesos y reinducción local.`,
    consequences: [
      "Activo en traslado",
      "Responsable operativo actualizado",
      "Accesos de sede en revisión",
      "Capacitación de revalidación abierta",
    ],
  });

  return {
    branch: targetBranch,
    readiness,
  };
}

export async function triggerOffboardingAutomation(personName: string) {
  await wait();
  const readiness = onboardingReadinessDb.find((item) => item.person === personName);

  if (!readiness) {
    throw new Error("No se pudo preparar la baja");
  }

  onboardingDocumentsDb = [
    {
      id: makeId("doc"),
      name: "Expediente de baja y archivo final",
      owner: personName,
      status: "Pendiente archivo",
      expires: "Hoy",
    },
    ...onboardingDocumentsDb.filter((item) => !(item.owner === personName && item.name === "Expediente de baja y archivo final")),
  ];

  readiness.blocker = "Retiro de activos, cierre de accesos y archivo final";
  readiness.owner = "RRHH";
  readiness.dueDate = "Hoy";
  readiness.dayOneReady = "No listo";

  inventoryActivationsDb = [
    {
      id: makeId("invact"),
      employeeName: personName,
      item: "Retiro integral de activos",
      branch: readiness.branch,
      status: "Retiro programado",
      dueLabel: "Antes de cierre de jornada",
    },
    ...inventoryActivationsDb.filter((item) => !(item.employeeName === personName && item.status === "Retiro programado")),
  ];

  accessTasksDb = [
    {
      id: makeId("acc"),
      employeeName: personName,
      branch: readiness.branch,
      system: "Correo + apps + accesos de sede",
      status: "Cierre pendiente",
      nextAction: "Revocar accesos, cerrar sesión activa y archivar identidad operativa.",
    },
    ...accessTasksDb.filter((item) => !(item.employeeName === personName && item.system === "Correo + apps + accesos de sede")),
  ];

  automationQueueDb = [
    {
      id: makeId("auto"),
      name: personName,
      trigger: "Baja confirmada",
      nextAction: "Retirar activos, cerrar accesos y archivar expediente del colaborador.",
      owner: "RRHH + Inventario + Seguridad",
      status: "Nuevo",
    },
    ...automationQueueDb.filter((item) => !(item.name === personName && item.trigger === "Baja confirmada")),
  ];

  operationalEventsDb = [
    {
      id: makeId("opevt"),
      employeeName: personName,
      type: "offboarding",
      title: "Baja automatizada iniciada",
      description: `${personName} entra en flujo de retiro de activos, cierre de accesos y archivo documental.`,
      status: "Critico",
    },
    ...operationalEventsDb.filter((item) => !(item.employeeName === personName && item.type === "offboarding")),
  ];

  updateAutomationRuleStatus("Baja con cierre seguro", "En seguimiento");
  appendAutomationAudit({
    employeeName: personName,
    branch: readiness.branch,
    trigger: "Baja confirmada",
    ruleName: "Baja con cierre seguro",
    actor: "RRHH",
    executedAt: "16 jul 2026 · 1:24 PM ET",
    status: "En riesgo",
    summary: `${personName} entró en flujo de baja con retiro de activos y cierre de accesos todavía pendientes.`,
    consequences: [
      "Expediente de baja abierto",
      "Retiro de activos programado",
      "Cierre de accesos en cola",
      "Archivo documental pendiente",
    ],
  });

  return {
    readiness,
  };
}

export async function completeOnboardingAutomation(employeeName: string) {
  await wait();
  const signaturePackage = signaturePackagesDb.find((item) => item.employeeName === employeeName);
  const readiness = onboardingReadinessDb.find((item) => item.person === employeeName);

  if (!signaturePackage || !readiness) {
    throw new Error("No se pudo completar la incorporacion");
  }

  signaturePackage.status = "Completado";
  signaturePackage.nextAction = "Paquete documental completo y listo para cierre operativo.";

  readiness.readiness = "92%";
  readiness.blocker = "Esperando la asignación final del activo";
  readiness.owner = "Inventario";
  readiness.dueDate = "Hoy";
  readiness.dayOneReady = "En riesgo";

  onboardingDocumentsDb = onboardingDocumentsDb.map((item) =>
    item.owner === employeeName ? { ...item, status: "Revisado" } : item,
  );

  appendAutomationAudit({
    employeeName,
    branch: readiness.branch,
    trigger: "Incorporación completada",
    ruleName: "Alta integral por contratación",
    actor: "RRHH",
    executedAt: "16 jul 2026 · 1:30 PM ET",
    status: "Ejecutada",
    summary: `La incorporación documental quedó cerrada y el flujo pasó a espera de activo final para ${employeeName}.`,
    consequences: [
      "Expediente revisado",
      "Firma completada",
      "Bloqueo documental levantado",
    ],
  });

  syncHiringMasterFlow(employeeName);

  return {
    signaturePackage,
    readiness,
  };
}

export async function confirmInventoryAssignmentAutomation(employeeName: string) {
  await wait();
  const activation = inventoryActivationsDb.find((item) => item.employeeName === employeeName);

  if (!activation) {
    throw new Error("No se pudo confirmar la asignación del activo");
  }

  activation.status = "Asignado";
  activation.dueLabel = "Activo listo para operar";

  appendAutomationAudit({
    employeeName,
    branch: activation.branch,
    trigger: "Activo asignado",
    ruleName: "Alta integral por contratación",
    actor: "Inventario",
    executedAt: "16 jul 2026 · 1:36 PM ET",
    status: "Ejecutada",
    summary: `El activo principal quedó asignado a ${employeeName} y el flujo puede avanzar a formación.`,
    consequences: [
      "Activo asignado",
      "Trazabilidad de entrega registrada",
      "Etapa de formación habilitada",
    ],
  });

  syncHiringMasterFlow(employeeName);

  return {
    activation,
  };
}

export async function completeTrainingAutomation(employeeName: string) {
  await wait();
  const activation = trainingActivationsDb.find((item) => item.employeeName === employeeName);
  const readiness = onboardingReadinessDb.find((item) => item.person === employeeName);

  if (!activation || !readiness) {
    throw new Error("No se pudo completar la formación");
  }

  activation.status = "Completado";
  activation.dueLabel = "Ruta completada";

  const existingHandoff = operationalHandoffsDb.find((item) => item.employeeName === employeeName);
  if (existingHandoff) {
    existingHandoff.status = "Activo";
    existingHandoff.nextAction = "Validar shadowing, objetivos de primera semana y adopcion del rol en operacion.";
    existingHandoff.owner = "Supervisor + Operacion";
  } else {
    operationalHandoffsDb = [
      {
        id: makeId("handoff"),
        employeeName,
        branch: readiness.branch,
        status: "Activo",
        nextAction: "Validar shadowing, objetivos de primera semana y adopcion del rol en operacion.",
        owner: "Supervisor + Operacion",
      },
      ...operationalHandoffsDb,
    ];
  }

  operationalEventsDb = [
    {
      id: makeId("opevt"),
      employeeName,
      type: "hiring",
      title: "Formacion completada",
      description: `${employeeName} cerró la ruta obligatoria y queda listo para transferencia operativa en ${readiness.branch}.`,
      status: "Listo para operacion",
    },
    ...operationalEventsDb.filter(
      (item) => !(item.employeeName === employeeName && item.type === "hiring" && item.title === "Formacion completada"),
    ),
  ];

  appendAutomationAudit({
    employeeName,
    branch: readiness.branch,
    trigger: "Formación completada",
    ruleName: "Alta integral por contratación",
    actor: "Capacitación",
    executedAt: "16 jul 2026 · 1:42 PM ET",
    status: "Ejecutada",
    summary: `${employeeName} completó la ruta obligatoria y quedó listo para transferencia operativa.`,
    consequences: [
      "Ruta obligatoria cerrada",
      "Paso a operación habilitado",
      "Supervisor notificado",
    ],
  });

  syncHiringMasterFlow(employeeName);

  return {
    activation,
  };
}

export async function completeOperationalHandoffAutomation(employeeName: string) {
  await wait();
  const handoff = operationalHandoffsDb.find((item) => item.employeeName === employeeName);
  const readiness = onboardingReadinessDb.find((item) => item.person === employeeName);

  if (!handoff || !readiness) {
    throw new Error("No se pudo completar el paso a operacion");
  }

  handoff.status = "Operativo";
  handoff.nextAction = "Seguimiento normal en productividad y primeros indicadores del puesto.";
  handoff.owner = "Operacion";

  const existingCheckpoint = complianceCheckpointsDb.find((item) => item.employeeName === employeeName);
  if (existingCheckpoint) {
    existingCheckpoint.status = "Pendiente revision";
    existingCheckpoint.nextAction = "Cerrar expediente auditable, validar accesos y confirmar cumplimiento inicial.";
    existingCheckpoint.owner = "RRHH + Cumplimiento";
  } else {
    complianceCheckpointsDb = [
      {
        id: makeId("comp"),
        employeeName,
        branch: readiness.branch,
        status: "Pendiente revision",
        nextAction: "Cerrar expediente auditable, validar accesos y confirmar cumplimiento inicial.",
        owner: "RRHH + Cumplimiento",
      },
      ...complianceCheckpointsDb,
    ];
  }

  operationalEventsDb = [
    {
      id: makeId("opevt"),
      employeeName,
      type: "hiring",
      title: "Transferencia operativa completada",
      description: `${employeeName} ya está operativo en ${readiness.branch} y entra en cierre administrativo y de cumplimiento.`,
      status: "En cumplimiento",
    },
    ...operationalEventsDb.filter(
      (item) => !(item.employeeName === employeeName && item.type === "hiring" && item.title === "Transferencia operativa completada"),
    ),
  ];

  appendAutomationAudit({
    employeeName,
    branch: readiness.branch,
    trigger: "Transferencia operativa completada",
    ruleName: "Alta integral por contratación",
    actor: "Operación",
    executedAt: "16 jul 2026 · 1:48 PM ET",
    status: "Ejecutada",
    summary: `${employeeName} pasó a operación y el flujo entró en cierre administrativo y de cumplimiento.`,
    consequences: [
      "Estado operativo habilitado",
      "Seguimiento productivo activado",
      "Cierre administrativo abierto",
    ],
  });

  syncHiringMasterFlow(employeeName);

  return {
    handoff,
  };
}

export async function completeComplianceAutomation(employeeName: string) {
  await wait();
  const checkpoint = complianceCheckpointsDb.find((item) => item.employeeName === employeeName);

  if (!checkpoint) {
    throw new Error("No se pudo cerrar cumplimiento");
  }

  checkpoint.status = "Completado";
  checkpoint.nextAction = "Expediente auditable cerrado y cumplimiento inicial validado.";
  checkpoint.owner = "Cumplimiento";

  operationalEventsDb = [
    {
      id: makeId("opevt"),
      employeeName,
      type: "hiring",
      title: "Cierre administrativo completado",
      description: `${employeeName} ya completó el ciclo integral y queda trazado como flujo cerrado por empresa y sucursal.`,
      status: "Ciclo completo",
    },
    ...operationalEventsDb.filter(
      (item) => !(item.employeeName === employeeName && item.type === "hiring" && item.title === "Cierre administrativo completado"),
    ),
  ];

  updateAutomationRuleStatus("Alta integral por contratación", "Controlada");
  appendAutomationAudit({
    employeeName,
    branch: checkpoint.branch,
    trigger: "Cumplimiento cerrado",
    ruleName: "Alta integral por contratación",
    actor: "Cumplimiento",
    executedAt: "16 jul 2026 · 1:54 PM ET",
    status: "Ejecutada",
    summary: `${employeeName} cerró su expediente auditable y el ciclo quedó completo por empresa y sucursal.`,
    consequences: [
      "Expediente auditable cerrado",
      "Accesos iniciales validados",
      "Ciclo maestro marcado como completo",
    ],
  });

  syncHiringMasterFlow(employeeName);

  return {
    checkpoint,
  };
}

export async function fetchVacancyHiringPlans(tenantId: string): Promise<VacancyHiringPlanDto[]> {
  await wait();
  const visibleVacancies = await fetchVacancies(tenantId);
  const visibleIds = new Set(visibleVacancies.map((vacancy) => vacancy.id));
  return vacancyHiringPlansDb.filter((plan) => visibleIds.has(plan.vacancyId));
}

export async function deleteTrainingCourse(courseId: string) {
  await wait();
  const course = coursesDb.find((item) => item.id === courseId);

  if (!course) {
    throw new Error("Curso no encontrado");
  }

  coursesDb = coursesDb.filter((item) => item.id !== courseId);
  trainingActivationsDb = trainingActivationsDb.filter((item) => item.courseTitle !== course.title);

  return { deleted: true, id: courseId };
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
