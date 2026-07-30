import { expect, test, type Page } from "@playwright/test";

type RoleContract = {
  role: string;
  allowedPath: string;
  allowedHeading: RegExp;
  deniedPath?: string;
};

const roles: RoleContract[] = [
  { role: "SUPERADMIN", allowedPath: "/admin/tenants", allowedHeading: /Empresas/i },
  { role: "PLATFORM_ADMIN", allowedPath: "/admin/tenants", allowedHeading: /Empresas/i, deniedPath: "/ats/candidates" },
  { role: "TENANT_ADMIN", allowedPath: "/admin/company", allowedHeading: /Empresa/i, deniedPath: "/admin/tenants" },
  { role: "HR_MANAGER", allowedPath: "/ats/vacancies", allowedHeading: /Vacantes/i, deniedPath: "/admin/tenants" },
  { role: "RECRUITER", allowedPath: "/ats/candidates", allowedHeading: /Candidatos/i, deniedPath: "/admin/tenants" },
  { role: "INTERVIEWER", allowedPath: "/profile", allowedHeading: /Preferencias, seguridad/i, deniedPath: "/admin/tenants" },
  { role: "INSTRUCTOR", allowedPath: "/training/paths", allowedHeading: /Rutas, vencimientos y automatización/i, deniedPath: "/admin/tenants" },
  { role: "SUPERVISOR", allowedPath: "/profile", allowedHeading: /Preferencias, seguridad/i, deniedPath: "/admin/tenants" },
  { role: "INVENTORY_MANAGER", allowedPath: "/profile", allowedHeading: /Preferencias, seguridad/i, deniedPath: "/admin/tenants" },
  { role: "BRANCH_USER", allowedPath: "/profile", allowedHeading: /Preferencias, seguridad/i, deniedPath: "/admin/tenants" },
  { role: "CANDIDATE", allowedPath: "/profile", allowedHeading: /Preferencias, seguridad/i, deniedPath: "/admin/tenants" },
];

const syntheticAccounts: Record<string, string> = {
  SUPERADMIN: "e2e.superadmin@example.test",
  PLATFORM_ADMIN: "e2e.platform-admin@example.test",
  TENANT_ADMIN: "e2e.tenant-admin@example.test",
  HR_MANAGER: "e2e.hr-manager@example.test",
  RECRUITER: "e2e.recruiter@example.test",
  INTERVIEWER: "e2e.interviewer@example.test",
  INSTRUCTOR: "e2e.instructor@example.test",
  SUPERVISOR: "e2e.supervisor@example.test",
  INVENTORY_MANAGER: "e2e.inventory-manager@example.test",
  BRANCH_USER: "e2e.branch-user@example.test",
  CANDIDATE: "e2e.candidate@example.test",
};

function credentials(role: string) {
  return {
    email: process.env[`E2E_${role}_EMAIL`] ?? syntheticAccounts[role] ?? "",
    password: process.env[`E2E_${role}_PASSWORD`] ?? "SyntheticOnly123!",
  };
}

async function login(page: Page, role: string) {
  const account = credentials(role);
  await page.goto("/login");
  await page.getByLabel("Correo corporativo").fill(account.email);
  await page.locator("#login-password").fill(account.password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
  await expect(page.getByRole("complementary").first()).toBeVisible();
}

test("la configuración incluye credenciales para todos los roles obligatorios", () => {
  const missing = roles.flatMap(({ role }) => [
    ...(!credentials(role).email ? [`E2E_${role}_EMAIL`] : []),
    ...(!credentials(role).password ? [`E2E_${role}_PASSWORD`] : []),
  ]);
  expect(missing, `Faltan variables E2E obligatorias:\n${missing.join("\n")}`).toEqual([]);
});

for (const contract of roles) {
  test.describe(contract.role, () => {
    test("inicia sesión y muestra solamente el contexto autorizado", async ({ page }) => {
      await login(page, contract.role);
      await page.goto(contract.allowedPath);
      await expect(page.getByRole("heading", { name: contract.allowedHeading }).first()).toBeVisible();
      await expect(page.getByText(/No tienes acceso a esta sección/i)).toHaveCount(0);
    });

    if (contract.deniedPath) {
      test("bloquea una ruta fuera de su alcance", async ({ page }) => {
        await login(page, contract.role);
        await page.goto(contract.deniedPath!);
        await expect(page.getByText(/No tienes acceso a esta sección|no está asignada a tu perfil|permiso necesario/i).first()).toBeVisible();
      });
    }
  });
}
