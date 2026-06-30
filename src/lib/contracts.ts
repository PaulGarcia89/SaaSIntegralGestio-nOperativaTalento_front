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

export interface TenantDto {
  id: string;
  slug: string;
  name: string;
  plan: PlanTier;
  enabledModules: ModuleKey[];
  branding: {
    accent: string;
    supportEmail: string;
  };
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
}

export interface CandidateDto {
  id: string;
  name: string;
  role: string;
  stage: string;
  score: number;
  summary: string;
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
