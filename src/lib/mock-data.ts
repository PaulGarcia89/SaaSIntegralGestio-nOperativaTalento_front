import type {
  AppDatasetsDto,
  BranchDto,
  CandidateDto,
  InventoryItemDto,
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

export type NavItem = {
  href: string;
  label: string;
  group: "General" | "RRHH" | "Operacion" | "Administracion";
  module: ModuleKey;
  permission: PermissionKey;
};

export const appNavigation: NavItem[] = [
  { href: "/dashboard", label: "Panel principal", group: "General", module: "dashboard", permission: "dashboard.view" },
  { href: "/notifications", label: "Notificaciones", group: "General", module: "notifications", permission: "notifications.view" },
  { href: "/reports", label: "Reportes", group: "General", module: "reports", permission: "reports.view" },
  { href: "/ats/vacancies", label: "Vacantes", group: "RRHH", module: "ats", permission: "ats.view" },
  { href: "/ats/candidates", label: "Postulantes", group: "RRHH", module: "ats", permission: "ats.view" },
  { href: "/ats/interviews", label: "Entrevistas", group: "RRHH", module: "ats", permission: "ats.view" },
  { href: "/onboarding/documents", label: "Documentos", group: "RRHH", module: "onboarding", permission: "onboarding.view" },
  { href: "/onboarding/signatures", label: "Firma electronica", group: "RRHH", module: "onboarding", permission: "onboarding.view" },
  { href: "/training", label: "Entrenamiento", group: "RRHH", module: "training", permission: "training.view" },
  { href: "/training/evaluations", label: "Evaluaciones", group: "RRHH", module: "training", permission: "training.view" },
  { href: "/productivity", label: "Productividad IA", group: "Operacion", module: "productivity", permission: "productivity.view" },
  { href: "/inventory", label: "Inventario", group: "Operacion", module: "inventory", permission: "inventory.view" },
  { href: "/admin", label: "Panel SaaS", group: "Administracion", module: "admin", permission: "admin.view" },
  { href: "/admin/tenants", label: "Empresas", group: "Administracion", module: "admin", permission: "admin.view" },
  { href: "/admin/branches", label: "Sucursales", group: "Administracion", module: "admin", permission: "admin.company" },
  { href: "/admin/modules", label: "Modulos", group: "Administracion", module: "admin", permission: "admin.company" },
  { href: "/admin/users", label: "Usuarios", group: "Administracion", module: "admin", permission: "admin.users" },
  { href: "/admin/roles", label: "Roles y permisos", group: "Administracion", module: "admin", permission: "admin.roles" },
  { href: "/admin/company", label: "Configuracion empresa", group: "Administracion", module: "admin", permission: "admin.company" },
  { href: "/admin/subscription", label: "Suscripcion", group: "Administracion", module: "admin", permission: "admin.subscription" },
  { href: "/profile", label: "Perfil", group: "Administracion", module: "profile", permission: "profile.view" },
];

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
  admin_empresa: [
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
  lider_area: [
    "dashboard.view",
    "ats.view",
    "training.view",
    "productivity.view",
    "inventory.view",
    "reports.view",
    "notifications.view",
    "profile.view",
  ],
  empleado: ["dashboard.view", "training.view", "notifications.view", "profile.view"],
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
    permissions: rolePermissions.lider_area,
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
    role: "lider_area",
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
    title: "Onboarding documental",
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
    copy: "Stock, movimientos, mantenimiento y asignacion de herramientas o equipos a empleados.",
  },
  {
    title: "Administracion multiempresa",
    copy: "Planes, empresas, usuarios, permisos dinamicos y activacion modular por suscripcion.",
  },
];

export const dashboardKpis = [
  { label: "Vacantes activas", value: "37", detail: "+9% esta semana en Florida" },
  { label: "Onboardings en curso", value: "94", detail: "12 pendientes de firma en Miami y Orlando" },
  { label: "Cumplimiento formativo", value: "96%", detail: "3 cursos vencen hoy" },
  { label: "Productividad promedio", value: "89.1", detail: "IA detecta mejora en Jacksonville" },
];

export const alerts = [
  {
    title: "Onboarding incompleto",
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
    title: "Coordinador clinico de onboarding",
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
  { id: "can-1", name: "Lauren Bennett", role: "Especialista en adquisicion de talento", stage: "Entrevista tecnica", score: 93, summary: "Fuerte experiencia en reclutamiento de salud en hospitales del sur de Florida." },
  { id: "can-2", name: "Marcus Hill", role: "Supervisor de operaciones de almacen", stage: "Oferta enviada", score: 89, summary: "Solida experiencia liderando operaciones logisticas entre Jacksonville y Savannah." },
  { id: "can-3", name: "Natalie Brooks", role: "Coordinadora de onboarding", stage: "Filtro RRHH", score: 86, summary: "Gran disciplina de procesos y experiencia en cumplimiento documental para equipos regulados." },
];

export const interviews = [
  { candidate: "Marcus Hill", when: "Hoy · 3:00 PM ET", panel: "Operaciones", status: "Confirmada" },
  { candidate: "Natalie Brooks", when: "Manana · 9:30 AM ET", panel: "RRHH + Supervisor", status: "Pendiente feedback" },
  { candidate: "Derek Coleman", when: "Viernes · 11:00 AM ET", panel: "Capacitacion", status: "Programada" },
];

export const documents = [
  { name: "Acuerdo laboral", owner: "Natalie Brooks", status: "Firmado", expires: "N/A" },
  { name: "Verificacion de antecedentes", owner: "Lauren Bennett", status: "Pendiente", expires: "2 jul 2026" },
  { name: "Acuse de recibo OSHA", owner: "Marcus Hill", status: "Revisado", expires: "N/A" },
];

export const courses = [
  { title: "Onboarding laboral en EE. UU.", progress: "100%", type: "Obligatorio" },
  { title: "HIPAA y privacidad del paciente", progress: "72%", type: "Recertificacion" },
  { title: "Fundamentos de liderazgo operativo", progress: "34%", type: "Desarrollo" },
];

export const evaluations = [
  { name: "Politicas internas", pending: "10 pendientes", passRate: "97%" },
  { name: "Fundamentos de seguridad OSHA", pending: "5 pendientes", passRate: "91%" },
  { name: "Estandares de atencion al cliente", pending: "14 pendientes", passRate: "94%" },
];

export const productivityRows = [
  { area: "Operaciones Miami", productivity: "92.4", trend: "+3.6%", alert: "Sin alertas activas" },
  { area: "Logistica Jacksonville", productivity: "85.7", trend: "-1.2%", alert: "2 ventanas atipicas de inactividad" },
  { area: "RRHH Orlando", productivity: "89.1", trend: "+2.8%", alert: "1 retraso de cumplimiento documental" },
];

export const inventoryRows: InventoryItemDto[] = [
  { id: "inv-1", item: "Escaneres portatiles", stock: 11, assigned: 46, status: "Critico", location: "Jacksonville, FL" },
  { id: "inv-2", item: "Tablets clinicas", stock: 27, assigned: 93, status: "Reposicion", location: "Tampa, FL" },
  { id: "inv-3", item: "Cascos de seguridad", stock: 76, assigned: 164, status: "Estable", location: "Miami, FL" },
];

export const users = [
  { name: "Ava Thompson", role: "Superadministrador", access: "Activo", lastSeen: "Hace 2 min" },
  { name: "Olivia Carter", role: "Administrador de empresa", access: "Activo", lastSeen: "Hace 18 min" },
  { name: "Jordan Blake", role: "Supervisor", access: "Invitado", lastSeen: "Nunca" },
];

export const notifications = [
  { title: "Firma completada", meta: "Paquete laboral firmado por Natalie Brooks en Orlando", kind: "success" },
  { title: "Alerta de stock bajo", meta: "Los escaneres portatiles estan por debajo del umbral en Jacksonville", kind: "warning" },
  { title: "Nueva postulacion", meta: "19 nuevas postulaciones para Supervisor de operaciones de almacen", kind: "info" },
];

export const reports = [
  { name: "Embudo de contratacion por sucursal", owner: "RRHH", cadence: "Semanal" },
  { name: "Cumplimiento documental por fecha de ingreso", owner: "Onboarding", cadence: "Diaria" },
  { name: "Productividad por sucursal", owner: "Operaciones", cadence: "Tiempo real" },
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
