import type { ModuleKey, PermissionKey } from "@/lib/contracts";

export type NavItem = {
  href: string;
  label: string;
  group: "General" | "RRHH" | "Operacion" | "Gobierno SaaS" | "Empresa";
  module: ModuleKey;
  permission: PermissionKey;
  audience: "shared" | "saas" | "tenant";
};

export const appNavigation: NavItem[] = [
  { href: "/dashboard", label: "Panel principal", group: "General", module: "dashboard", permission: "dashboard.view", audience: "shared" },
  { href: "/notifications", label: "Notificaciones", group: "General", module: "notifications", permission: "notifications.view", audience: "shared" },
  { href: "/reports", label: "Reportes", group: "General", module: "reports", permission: "reports.view", audience: "shared" },
  { href: "/profile", label: "Perfil", group: "General", module: "profile", permission: "profile.view", audience: "shared" },
  { href: "/ats/vacancies", label: "Vacantes", group: "RRHH", module: "ats", permission: "ats.view", audience: "shared" },
  { href: "/ats/candidates", label: "Postulantes", group: "RRHH", module: "ats", permission: "ats.view", audience: "shared" },
  { href: "/ats/interviews", label: "Entrevistas", group: "RRHH", module: "ats", permission: "ats.view", audience: "shared" },
  { href: "/onboarding/documents", label: "Documentos", group: "RRHH", module: "onboarding", permission: "onboarding.view", audience: "shared" },
  { href: "/onboarding/signatures", label: "Firma electronica", group: "RRHH", module: "onboarding", permission: "onboarding.view", audience: "shared" },
  { href: "/training", label: "Entrenamiento", group: "RRHH", module: "training", permission: "training.view", audience: "shared" },
  { href: "/training/evaluations", label: "Evaluaciones", group: "RRHH", module: "training", permission: "training.view", audience: "shared" },
  { href: "/productivity", label: "Productividad IA", group: "Operacion", module: "productivity", permission: "productivity.view", audience: "shared" },
  { href: "/inventory", label: "Inventario", group: "Operacion", module: "inventory", permission: "inventory.view", audience: "shared" },
  { href: "/admin", label: "Centro administrativo", group: "Empresa", module: "admin", permission: "admin.view", audience: "shared" },
  { href: "/admin/users", label: "Usuarios", group: "Empresa", module: "admin", permission: "admin.users", audience: "tenant" },
  { href: "/admin/branches", label: "Sucursales", group: "Empresa", module: "admin", permission: "admin.company", audience: "tenant" },
  { href: "/admin/roles", label: "Roles y permisos", group: "Empresa", module: "admin", permission: "admin.roles", audience: "tenant" },
  { href: "/admin/company", label: "Configuracion empresa", group: "Empresa", module: "admin", permission: "admin.company", audience: "tenant" },
  { href: "/admin/tenants", label: "Empresas", group: "Gobierno SaaS", module: "admin", permission: "admin.view", audience: "saas" },
  { href: "/admin/modules", label: "Modulos", group: "Gobierno SaaS", module: "admin", permission: "admin.company", audience: "saas" },
  { href: "/admin/subscription", label: "Planes y suscripciones", group: "Gobierno SaaS", module: "admin", permission: "admin.subscription", audience: "saas" },
];
