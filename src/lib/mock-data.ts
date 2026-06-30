import type {
  AppDatasetsDto,
  ModuleKey,
  PermissionKey,
  RoleKey,
  SessionDto,
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
  { href: "/dashboard", label: "Dashboard", group: "General", module: "dashboard", permission: "dashboard.view" },
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
    slug: "grupo-andina",
    name: "Grupo Andina",
    plan: "enterprise",
    enabledModules: ["dashboard", "ats", "onboarding", "training", "productivity", "inventory", "admin", "reports", "notifications", "profile"],
    branding: { accent: "#0EA5B7", supportEmail: "soporte@grupoandina.com" },
  },
  {
    id: "tenant-2",
    slug: "salud-integral",
    name: "Salud Integral",
    plan: "growth",
    enabledModules: ["dashboard", "ats", "onboarding", "training", "reports", "notifications", "profile"],
    branding: { accent: "#2563EB", supportEmail: "ayuda@saludintegral.com" },
  },
  {
    id: "tenant-3",
    slug: "educa-norte",
    name: "Educa Norte",
    plan: "starter",
    enabledModules: ["dashboard", "training", "notifications", "profile"],
    branding: { accent: "#14B8A6", supportEmail: "admin@educanorte.edu" },
  },
];

export const mockUsers: UserDto[] = [
  {
    id: "user-1",
    fullName: "Sofia Herrera",
    email: "sofia.herrera@grupoandina.com",
    role: "admin_empresa",
    tenantId: "tenant-1",
    status: "active",
  },
  {
    id: "user-2",
    fullName: "Mario Suarez",
    email: "mario.suarez@grupoandina.com",
    role: "rrhh",
    tenantId: "tenant-1",
    status: "active",
  },
  {
    id: "user-3",
    fullName: "Diana Castro",
    email: "diana.castro@saludintegral.com",
    role: "lider_area",
    tenantId: "tenant-2",
    status: "invited",
  },
  {
    id: "user-4",
    fullName: "Nicolas Lopez",
    email: "nicolas.lopez@educanorte.edu",
    role: "empleado",
    tenantId: "tenant-3",
    status: "active",
  },
];

export const mockSession: SessionDto = {
  token: "mock-jwt-token",
  tenantId: "tenant-1",
  userId: "user-1",
  role: "admin_empresa",
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
    title: "Training y certificacion",
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
    title: "Administracion multi-tenant",
    copy: "Planes, empresas, usuarios, permisos dinamicos y activacion modular por suscripcion.",
  },
];

export const dashboardKpis = [
  { label: "Vacantes activas", value: "48", detail: "+12% esta semana" },
  { label: "Onboardings en curso", value: "126", detail: "18 pendientes de firma" },
  { label: "Cumplimiento formativo", value: "94%", detail: "4 cursos vencen hoy" },
  { label: "Productividad promedio", value: "87.6", detail: "IA detecta mejora en Operaciones" },
];

export const alerts = [
  {
    title: "Onboarding incompleto",
    description: "18 ingresos aun esperan firma documental antes de su fecha de inicio.",
    tone: "warning",
  },
  {
    title: "Stock critico",
    description: "Faltan 12 equipos de campo para la sede Bogota y 4 licencias temporales.",
    tone: "danger",
  },
  {
    title: "Capacitacion vencida",
    description: "4 lideres de operaciones deben renovar su certificacion obligatoria.",
    tone: "info",
  },
];

export const pipelineStages = [
  { name: "Aplicados", count: 124 },
  { name: "Filtro RRHH", count: 68 },
  { name: "Entrevista", count: 32 },
  { name: "Oferta", count: 12 },
  { name: "Contratados", count: 9 },
];

export const jobs = [
  { id: "vac-1", title: "Analista de reclutamiento", area: "RRHH", mode: "Hibrido", status: "Activa", location: "Bogota", applicants: 42, owner: "Sofia Herrera" },
  { id: "vac-2", title: "Supervisor de campo", area: "Operaciones", mode: "Presencial", status: "En entrevistas", location: "Medellin", applicants: 31, owner: "Mario Suarez" },
  { id: "vac-3", title: "Coordinador de onboarding", area: "Talento", mode: "Remoto", status: "Borrador", location: "Remoto", applicants: 0, owner: "Sofia Herrera" },
];

export const candidates = [
  { id: "can-1", name: "Laura Medina", role: "Product Designer", stage: "Entrevista tecnica", score: 91, summary: "Fuerte match para producto y colaboracion cross-funcional." },
  { id: "can-2", name: "Carlos Ospina", role: "Supervisor de campo", stage: "Oferta enviada", score: 88, summary: "Experiencia solida en operaciones de campo y liderazgo." },
  { id: "can-3", name: "Nina Salazar", role: "Analista RRHH", stage: "Filtro RRHH", score: 84, summary: "Buen ajuste cultural y dominio de coordinacion administrativa." },
];

export const interviews = [
  { candidate: "Carlos Ospina", when: "Hoy · 3:00 PM", panel: "Operaciones", status: "Confirmada" },
  { candidate: "Valentina Ruiz", when: "Manana · 9:30 AM", panel: "RRHH + Lider", status: "Pendiente feedback" },
  { candidate: "Javier Leon", when: "Viernes · 11:00 AM", panel: "Comercial", status: "Programada" },
];

export const documents = [
  { name: "Contrato laboral", owner: "Andres Peña", status: "Firmado", expires: "N/A" },
  { name: "Examen medico", owner: "Laura Medina", status: "Pendiente", expires: "2 jul 2026" },
  { name: "Certificado bancario", owner: "Carlos Ospina", status: "Revisado", expires: "N/A" },
];

export const courses = [
  { title: "Induccion corporativa", progress: "100%", type: "Obligatorio" },
  { title: "Seguridad operacional", progress: "72%", type: "Recertificacion" },
  { title: "Liderazgo de equipos", progress: "34%", type: "Desarrollo" },
];

export const evaluations = [
  { name: "Politicas internas", pending: "12 pendientes", passRate: "96%" },
  { name: "Seguridad industrial", pending: "4 pendientes", passRate: "89%" },
  { name: "Servicio al cliente", pending: "21 pendientes", passRate: "92%" },
];

export const productivityRows = [
  { area: "Operaciones", productivity: "91.2", trend: "+4.1%", alert: "Sin alertas" },
  { area: "Logistica", productivity: "84.9", trend: "-1.8%", alert: "2 patrones atipicos" },
  { area: "RRHH", productivity: "88.4", trend: "+2.3%", alert: "1 retraso documental" },
];

export const inventoryRows = [
  { id: "inv-1", item: "Tabletas de campo", stock: 14, assigned: 62, status: "Critico", location: "Bogota" },
  { id: "inv-2", item: "Cascos industriales", stock: 84, assigned: 210, status: "Estable", location: "Cali" },
  { id: "inv-3", item: "Lectores QR", stock: 28, assigned: 41, status: "Reposicion", location: "Medellin" },
];

export const users = [
  { name: "Sofia Herrera", role: "Admin Empresa", access: "Activo", lastSeen: "Hace 5 min" },
  { name: "Mario Suarez", role: "RRHH", access: "Activo", lastSeen: "Hace 1 h" },
  { name: "Diana Castro", role: "Lider de area", access: "Invitada", lastSeen: "Nunca" },
];

export const notifications = [
  { title: "Firma completada", meta: "Contrato laboral firmado por Laura Medina", kind: "success" },
  { title: "Stock bajo", meta: "Equipos de campo por debajo del umbral configurado", kind: "warning" },
  { title: "Nueva postulacion", meta: "23 nuevas aplicaciones para Supervisor de campo", kind: "info" },
];

export const reports = [
  { name: "Embudo de contratacion", owner: "RRHH", cadence: "Semanal" },
  { name: "Cumplimiento documental", owner: "Onboarding", cadence: "Diaria" },
  { name: "Productividad por area", owner: "Operaciones", cadence: "Tiempo real" },
];

export const appDatasets: Record<string, AppDatasetsDto> = {
  "grupo-andina": {
    vacancies: jobs,
    candidates,
    inventory: inventoryRows,
  },
  "salud-integral": {
    vacancies: [jobs[1]],
    candidates: [candidates[2]],
    inventory: [],
  },
  "educa-norte": {
    vacancies: [],
    candidates: [],
    inventory: [],
  },
};
