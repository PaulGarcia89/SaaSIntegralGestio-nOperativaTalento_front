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
  status?: "active" | "trial" | "suspended";
  enabledModules: ModuleKey[];
  branding: {
    accent: string;
    supportEmail: string;
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
