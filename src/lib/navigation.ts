import type { ModuleKey, PermissionKey, RoleKey, SubscriptionAccessState } from "@/lib/contracts";

export type NavGroup = "Inicio" | "Personas" | "Reclutamiento" | "Aprendizaje" | "Operaciones" | "Analítica" | "Administración" | "Gobierno de plataforma";
export type NavItem = { href: string; label: string; group: NavGroup; module: ModuleKey; permission: PermissionKey; requiredPermissions: PermissionKey[]; audience: "shared" | "saas" | "tenant"; featureFlag: string; available: boolean; requiresCommercialModule?: boolean; showInNavigation?: boolean; subscriptionStates?: SubscriptionAccessState[]; branchRequired?: boolean; roles?: RoleKey[]; strictRoles?: boolean; icon: "dashboard" | "notifications" | "reports" | "profile" | "vacancies" | "candidates" | "interviews" | "documents" | "signatures" | "training" | "evaluations" | "productivity" | "inventory" | "admin" | "users" | "roles" | "company" | "tenants" | "branches" | "modules" | "subscription" | "queues" };
const live: SubscriptionAccessState[] = ["active", "trial", "grace_period"];

const configuredNavigation: Array<Omit<NavItem, "featureFlag" | "available" | "requiredPermissions">> = [
  { href: "/dashboard", label: "Inicio", group: "Inicio", module: "dashboard", permission: "dashboard.view", audience: "shared", icon: "dashboard" },
  { href: "/profile", label: "Mi perfil", group: "Inicio", module: "profile", permission: "profile.view", audience: "shared", icon: "profile" },
  { href: "/employees", label: "Empleados", group: "Personas", module: "productivity", permission: "productivity.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "users", roles: ["admin_saas", "admin_empresa", "supervisor"] },
  { href: "/onboarding/documents", label: "Incorporaciones", group: "Personas", module: "onboarding", permission: "onboarding.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "documents" },
  { href: "/onboarding/signatures", label: "Documentos y firmas", group: "Personas", module: "onboarding", permission: "onboarding.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "signatures" },
  { href: "/ats/vacancies", label: "Vacantes", group: "Reclutamiento", module: "ats", permission: "jobs.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "vacancies", roles: ["admin_saas", "admin_empresa", "rrhh", "reclutador"] },
  { href: "/ats/pipeline", label: "Pipeline", group: "Reclutamiento", module: "ats", permission: "applications.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "candidates", roles: ["admin_saas", "admin_empresa", "rrhh", "reclutador"] },
  { href: "/ats/candidates", label: "Candidatos", group: "Reclutamiento", module: "ats", permission: "candidates.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "candidates", roles: ["admin_saas", "admin_empresa", "rrhh", "reclutador"] },
  { href: "/ats/talent-crm", label: "Talent CRM", group: "Reclutamiento", module: "ats", permission: "candidates.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "candidates", roles: ["admin_saas", "admin_empresa", "rrhh", "reclutador"] },
  { href: "/ats/communications", label: "Comunicaciones", group: "Reclutamiento", module: "ats", permission: "applications.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "notifications", roles: ["admin_saas", "admin_empresa", "rrhh", "reclutador"] },
  { href: "/ats/interviews", label: "Entrevistas", group: "Reclutamiento", module: "ats", permission: "interviews.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "interviews", roles: ["admin_saas", "admin_empresa", "rrhh", "reclutador", "entrevistador"] },
  { href: "/ats/analytics", label: "Analítica ATS", group: "Reclutamiento", module: "ats", permission: "applications.view", audience: "shared", subscriptionStates: live, icon: "reports", roles: ["admin_saas", "admin_empresa", "rrhh", "reclutador"] },
  { href: "/ats/scorecards", label: "Scorecards", group: "Reclutamiento", module: "ats", permission: "interviews.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "evaluations", roles: ["admin_saas", "admin_empresa", "rrhh", "reclutador"] },
  { href: "/training", label: "Cursos", group: "Aprendizaje", module: "training", permission: "training.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "training" },
  { href: "/training/evaluations", label: "Evaluaciones", group: "Aprendizaje", module: "training", permission: "training.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "evaluations" },
  { href: "/training/results", label: "Resultados", group: "Aprendizaje", module: "training", permission: "training.view", audience: "shared", subscriptionStates: live, icon: "reports", roles: ["admin_saas", "admin_empresa", "instructor"] },
  { href: "/training/intelligence", label: "Inteligencia", group: "Aprendizaje", module: "training", permission: "training.manage", audience: "shared", subscriptionStates: live, icon: "reports", roles: ["admin_saas", "admin_empresa", "rrhh", "instructor"] },
  { href: "/training/certificates", label: "Certificados", group: "Aprendizaje", module: "training", permission: "training.view", audience: "shared", subscriptionStates: live, icon: "documents", roles: ["admin_saas", "admin_empresa", "instructor", "empleado"] },
  { href: "/training/content", label: "Gestionar cursos", group: "Aprendizaje", module: "training", permission: "training.manage", audience: "shared", subscriptionStates: live, icon: "training", roles: ["admin_saas", "admin_empresa", "rrhh", "instructor"] },
  { href: "/training/paths", label: "Rutas y cumplimiento", group: "Aprendizaje", module: "training", permission: "training.manage", audience: "shared", subscriptionStates: live, icon: "training", roles: ["admin_saas", "admin_empresa", "rrhh", "instructor"] },
  { href: "/training/integrations", label: "Integraciones formativas", group: "Aprendizaje", module: "training", permission: "training.integrations.manage", audience: "shared", subscriptionStates: live, icon: "training", roles: ["admin_saas", "admin_empresa", "rrhh", "instructor"] },
  { href: "/productivity", label: "Productividad", group: "Operaciones", module: "productivity", permission: "productivity.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "productivity", roles: ["admin_saas", "admin_empresa", "supervisor"] },
  { href: "/productivity/cameras", label: "Cámaras y zonas", group: "Operaciones", module: "productivity", permission: "productivity.manage", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "productivity", roles: ["admin_saas", "admin_empresa"] },
  { href: "/inventory", label: "Inventario", group: "Operaciones", module: "inventory", permission: "inventory.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "inventory", roles: ["admin_saas", "admin_empresa", "supervisor", "encargado_inventario", "empleado"] },
  { href: "/inventory/warehouse", label: "Almacén y stock", group: "Operaciones", module: "inventory", permission: "inventory.manage", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "inventory", roles: ["admin_saas", "admin_empresa", "encargado_inventario"] },
  { href: "/inventory/purchases", label: "Compras y proveedores", group: "Operaciones", module: "inventory", permission: "inventory.manage", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "inventory", roles: ["admin_saas", "admin_empresa", "encargado_inventario"] },
  { href: "/inventory/maintenance", label: "Mantenimiento", group: "Operaciones", module: "inventory", permission: "inventory.manage", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "inventory", roles: ["admin_saas", "admin_empresa", "encargado_inventario"] },
  { href: "/inventory/scan", label: "Escanear activo", group: "Operaciones", module: "inventory", permission: "inventory.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "inventory", roles: ["admin_saas", "admin_empresa", "supervisor", "encargado_inventario"] },
  { href: "/inventory/my-assets", label: "Mis activos", group: "Operaciones", module: "inventory", permission: "inventory.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "inventory", roles: ["admin_saas", "admin_empresa", "supervisor", "encargado_inventario", "empleado"] },
  { href: "/inventory/analytics", label: "Analítica de inventario", group: "Analítica", module: "inventory", permission: "inventory.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "reports", roles: ["admin_saas", "admin_empresa", "supervisor", "encargado_inventario"] },
  { href: "/inventory/audit", label: "Auditoría de inventario", group: "Analítica", module: "inventory", permission: "inventory.manage", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "reports", roles: ["admin_saas", "admin_empresa", "encargado_inventario"] },
  { href: "/inventory/deliveries", label: "Entregas", group: "Operaciones", module: "inventory", permission: "inventory.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "inventory", roles: ["admin_saas", "admin_empresa", "encargado_inventario"] },
  { href: "/inventory/returns", label: "Devoluciones", group: "Operaciones", module: "inventory", permission: "inventory.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "inventory", roles: ["admin_saas", "admin_empresa", "encargado_inventario"] },
  { href: "/reports", label: "Reportes", group: "Analítica", module: "reports", permission: "reports.view", audience: "shared", subscriptionStates: live, icon: "reports" },
  { href: "/notifications", label: "Alertas", group: "Analítica", module: "notifications", permission: "notifications.view", audience: "shared", icon: "notifications" },
  { href: "/admin/company", label: "Configuración de empresa", group: "Administración", module: "admin", permission: "admin.company", audience: "tenant", icon: "company" },
  { href: "/admin/branches", label: "Sucursales", group: "Administración", module: "admin", permission: "branches.view", audience: "tenant", requiresCommercialModule: false, icon: "branches" },
  { href: "/admin/users", label: "Usuarios", group: "Administración", module: "admin", permission: "users.view", audience: "tenant", icon: "users" },
  { href: "/admin/roles", label: "Roles y permisos", group: "Administración", module: "admin", permission: "roles.view", audience: "tenant", icon: "roles" },
  { href: "/admin/automations", label: "Automatizaciones", group: "Administración", module: "admin", permission: "admin.view", audience: "tenant", icon: "queues", roles: ["admin_saas", "admin_empresa"] },
  { href: "/admin/company/subscription", label: "Suscripción", group: "Administración", module: "admin", permission: "admin.subscription", audience: "tenant", icon: "subscription", roles: ["admin_saas", "admin_empresa"] },
  { href: "/admin", label: "Resumen administrativo", group: "Administración", module: "admin", permission: "admin.view", audience: "tenant", icon: "admin" },
  { href: "/admin/tenants", label: "Gestión de empresas", group: "Gobierno de plataforma", module: "admin", permission: "tenants.view", audience: "saas", icon: "tenants" },
  { href: "/admin/company-registrations", label: "Solicitudes de empresa", group: "Gobierno de plataforma", module: "admin", permission: "tenants.view", audience: "saas", icon: "tenants" },
  { href: "/admin/plans", label: "Planes", group: "Gobierno de plataforma", module: "admin", permission: "admin.subscription", audience: "saas", icon: "subscription" },
  { href: "/admin/modules", label: "Módulos", group: "Gobierno de plataforma", module: "admin", permission: "admin.company", audience: "saas", icon: "modules" },
  { href: "/admin/integrations", label: "Gobierno de integraciones", group: "Gobierno de plataforma", module: "admin", permission: "platform.integrations.manage", audience: "saas", icon: "queues", roles: ["admin_saas"], strictRoles: true },
  { href: "/admin/subscription", label: "Suscripciones", group: "Gobierno de plataforma", module: "admin", permission: "admin.subscription", audience: "saas", icon: "subscription" },
  { href: "/admin/billing", label: "Facturación", group: "Gobierno de plataforma", module: "admin", permission: "admin.subscription", audience: "saas", icon: "subscription" },
  { href: "/admin/global-users", label: "Usuarios globales", group: "Gobierno de plataforma", module: "admin", permission: "admin.users", audience: "saas", icon: "users" },
  { href: "/admin/audit", label: "Auditoría", group: "Gobierno de plataforma", module: "admin", permission: "admin.view", audience: "saas", icon: "reports" },
  { href: "/admin/settings", label: "Configuración", group: "Gobierno de plataforma", module: "admin", permission: "admin.company", audience: "saas", icon: "company" },
];

const unavailableRouteHrefs = new Set(["/admin/settings"]);

export const appNavigation: NavItem[] = configuredNavigation.map((item) => ({
  ...item,
  requiredPermissions: [item.permission],
  featureFlag: `module.${item.module}`,
  // Administración es una agrupación de gobierno del tenant, no un módulo comercial.
  requiresCommercialModule: item.group === "Administración" ? false : item.requiresCommercialModule,
  available: !unavailableRouteHrefs.has(item.href),
}));

export function getRoutePolicy(pathname: string) { return [...appNavigation].sort((a, b) => b.href.length - a.href.length).find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)); }
export function isAudienceAllowed(audience: NavItem["audience"], role: RoleKey) { if (audience === "saas") return role === "admin_saas" || role === "admin_plataforma"; if (audience === "tenant") return role === "admin_saas" || role === "admin_plataforma" || role === "admin_empresa"; return true; }
export function isRoleAllowed(roles: NavItem["roles"], role: RoleKey, strictRoles = false) { if (!strictRoles && role === "admin_plataforma" && roles?.includes("admin_saas")) return true; return !roles || roles.includes(role); }
export type RouteAccessContext = { sessionValid: boolean; tenantAllowed: boolean; globalContext?: boolean; subscriptionStatus: SubscriptionAccessState; role: RoleKey; hasModule: (module: ModuleKey) => boolean; hasFeature: (featureFlag: string) => boolean; can: (permission: PermissionKey) => boolean; branchAvailable: boolean };
export type RouteAccessDecision = { allowed: boolean; code: "ALLOWED" | "AUTH_REQUIRED" | "TENANT_ACCESS_DENIED" | "SUBSCRIPTION_BLOCKED" | "MODULE_NOT_ENABLED" | "FEATURE_NOT_ENABLED" | "ROUTE_NOT_READY" | "ROLE_NOT_ALLOWED" | "PERMISSION_DENIED" | "BRANCH_REQUIRED"; reason: string; requestId?: string };
export function evaluateRouteAccess(policy: NavItem, context: RouteAccessContext): RouteAccessDecision {
  if (!context.sessionValid) return { allowed: false, code: "AUTH_REQUIRED", reason: "Tu sesión terminó o no pudo verificarse." };
  if ((context.role === "admin_saas" || context.role === "admin_plataforma") && context.globalContext) {
    if (policy.audience === "tenant" || policy.branchRequired) {
      return { allowed: false, code: policy.branchRequired ? "BRANCH_REQUIRED" : "ROLE_NOT_ALLOWED", reason: "Selecciona un contexto de empresa autorizado para acceder a esta sección." };
    }
    return policy.available
      ? { allowed: true, code: "ALLOWED", reason: "" }
      : { allowed: false, code: "ROUTE_NOT_READY", reason: "Esta función todavía no está disponible en el entorno productivo." };
  }
  if (!context.tenantAllowed) return { allowed: false, code: "TENANT_ACCESS_DENIED", reason: "La empresa seleccionada no pertenece a tu alcance autorizado." };
  if (policy.subscriptionStates && !policy.subscriptionStates.includes(context.subscriptionStatus)) return { allowed: false, code: "SUBSCRIPTION_BLOCKED", reason: "La suscripción actual no permite acceder a esta sección." };
  if (policy.requiresCommercialModule !== false && !context.hasModule(policy.module)) return { allowed: false, code: "MODULE_NOT_ENABLED", reason: "Esta función no está activa para la empresa." };
  if (policy.requiresCommercialModule !== false && !context.hasFeature(policy.featureFlag)) return { allowed: false, code: "FEATURE_NOT_ENABLED", reason: "Esta función no está habilitada para tu contexto." };
  if (!policy.available) return { allowed: false, code: "ROUTE_NOT_READY", reason: "Esta función todavía no está disponible en el entorno productivo." };
  if (!isAudienceAllowed(policy.audience, context.role) || !isRoleAllowed(policy.roles, context.role, policy.strictRoles)) return { allowed: false, code: "ROLE_NOT_ALLOWED", reason: "Esta sección no está asignada a tu perfil." };
  if (!policy.requiredPermissions.every(context.can)) return { allowed: false, code: "PERMISSION_DENIED", reason: "No tienes el permiso necesario para esta acción." };
  if (policy.branchRequired && !context.branchAvailable) return { allowed: false, code: "BRANCH_REQUIRED", reason: "Selecciona una sucursal autorizada para continuar." };
  return { allowed: true, code: "ALLOWED", reason: "" };
}
export const candidateNavigation = [
  { href: "/", label: "Volver al sitio público", available: true },
  { href: "/jobs", label: "Vacantes", available: true },
  { href: "/apply", label: "Iniciar postulación", available: true },
  { href: "/application-status", label: "Mis postulaciones", available: true },
  { href: "/candidate/portal", label: "Centro del candidato", available: true },
  { href: "/candidate/training", label: "Aprendizaje", available: false },
  { href: "/candidate/evaluations", label: "Evaluaciones", available: false },
  { href: "/candidate/profile", label: "Perfil y privacidad", available: true },
] as const;
