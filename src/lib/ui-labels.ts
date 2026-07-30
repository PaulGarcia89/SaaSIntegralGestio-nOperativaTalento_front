import type { ModuleKey, RoleKey, TenantDto, UserDto } from "@/lib/contracts";

export const roleLabels: Record<RoleKey, string> = {
  admin_saas: "Superadministrador",
  admin_plataforma: "Administrador de plataforma",
  admin_empresa: "Administrador de empresa",
  rrhh: "Gerente de RRHH",
  reclutador: "Reclutador",
  entrevistador: "Entrevistador",
  instructor: "Instructor",
  supervisor: "Supervisor",
  encargado_inventario: "Encargado de inventario",
  empleado: "Empleado",
  candidato: "Candidato",
};

export const moduleLabels: Record<ModuleKey, string> = {
  dashboard: "Panel principal",
  ats: "Reclutamiento ATS",
  onboarding: "Incorporación",
  training: "Capacitación",
  productivity: "Productividad asistida",
  inventory: "Inventario",
  admin: "Administración",
  reports: "Reportes",
  notifications: "Notificaciones",
  profile: "Perfil",
};

export const tenantStatusLabels = {
  active: "Activo",
  trial: "Prueba",
  suspended: "Suspendido",
} as const;

export const userStatusLabels = {
  active: "Activo",
  invited: "Invitado",
  suspended: "Suspendido",
} as const;

export const branchStatusLabels = {
  active: "Activa",
  inactive: "Inactiva",
} as const;

export const scopeLabels = {
  global: "General",
  tenant: "Empresa",
  module: "Módulo",
} as const;

export const moduleSourceLabels = {
  plan: "Plan",
  manual: "Manual",
} as const;

export function getPreferredUserForTenant(
  users: UserDto[],
  tenantId: string,
  preserveSuperadmin: boolean,
) {
  const preferredRole = preserveSuperadmin ? "admin_saas" : "admin_empresa";

  return (
    users.find((user) => user.tenantId === tenantId && user.role === preferredRole) ??
    users.find((user) => user.tenantId === tenantId && user.role !== "admin_saas") ??
    users.find((user) => user.tenantId === tenantId) ??
    users[0] ??
    null
  );
}

export function getFallbackTenant(tenants: TenantDto[]) {
  return tenants[0] ?? null;
}
