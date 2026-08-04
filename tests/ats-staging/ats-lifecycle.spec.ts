import { expect, request as playwrightRequest, test, type APIRequestContext } from "@playwright/test";

const apiUrl = process.env.E2E_ATS_BACKEND_URL!.replace(/\/$/, "");
const adminEmail = process.env.E2E_ATS_ADMIN_EMAIL!;
const adminPassword = process.env.E2E_ATS_ADMIN_PASSWORD!;
const tenantSlug = process.env.E2E_ATS_TENANT_SLUG;

let api: APIRequestContext;
let accessToken = "";
let tenantId = "";
let branchId = "";
let vacancyId = "";

test.beforeAll(async () => {
  api = await playwrightRequest.newContext({ baseURL: apiUrl, extraHTTPHeaders: { accept: "application/json" } });
  const login = await api.post("/api/auth/login", {
    data: { email: adminEmail, password: adminPassword, ...(tenantSlug ? { tenantSlug } : {}) },
  });
  expect(login.status(), await login.text()).toBe(201);
  const session = await login.json();
  accessToken = session.accessToken;
  tenantId = session.user.tenantId;
  branchId = process.env.E2E_ATS_BRANCH_ID || session.user.activeBranchId;
  expect(accessToken).toBeTruthy();
  expect(tenantId).toBeTruthy();
  expect(branchId).toBeTruthy();
});

test.afterAll(async () => {
  if (vacancyId) {
    await api.post(`/api/vacancies/${vacancyId}/archive`, {
      headers: scopedHeaders(),
      data: { reason: "Limpieza automática de certificación E2E de staging" },
    });
  }
  await api?.dispose();
});

test("certifica postulación y transición usando frontend y backend reales", async ({ page }) => {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const vacancyTitle = `Certificación ATS ${suffix}`;
  const candidateName = `Candidata Certificación ${suffix}`;
  const candidateEmail = `ats-cert-${suffix}@example.test`;

  await test.step("crear una vacante efímera con pipeline real", async () => {
    const response = await api.post("/api/vacancies", {
      headers: scopedHeaders(),
      data: {
        branchId,
        title: vacancyTitle,
        summary: "Vacante efímera de certificación E2E",
        description: "Comprueba frontend, API, base de datos, permisos y pipeline.",
        openings: 1,
        status: "OPEN",
        stages: [
          { code: "APPLIED", name: "Postulación E2E", position: 1, applicationStatus: "SUBMITTED", allowedNextStageCodes: ["SCREENING"] },
          { code: "SCREENING", name: "Revisión E2E", position: 2, applicationStatus: "REVIEWING", allowedNextStageCodes: ["APPROVED"] },
          { code: "APPROVED", name: "Aprobación E2E", position: 3, applicationStatus: "APPROVED", isTerminal: true },
        ],
      },
    });
    expect(response.status(), await response.text()).toBe(201);
    vacancyId = (await response.json()).id;
  });

  await test.step("registrar una postulación pública", async () => {
    const response = await api.post(`/api/public/vacancies/${vacancyId}/applications`, {
      data: {
        fullName: candidateName,
        email: candidateEmail,
        city: "Miami",
        coverLetter: "Postulación generada por la certificación visual de staging.",
        dynamicResponses: { source: "E2E_STAGING" },
      },
    });
    expect(response.status(), await response.text()).toBe(201);
    const application = await response.json();
    expect(application.currentStage.code).toBe("APPLIED");
  });

  await test.step("iniciar sesión por la interfaz", async () => {
    await page.goto("/login");
    await page.getByLabel("Correo corporativo").fill(adminEmail);
    await page.locator("#login-password").fill(adminPassword);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 20_000 });
  });

  await test.step("encontrar el expediente mediante filtros de servidor", async () => {
    await page.goto(`/ats/candidates?q=${encodeURIComponent(candidateEmail)}&vacancy=${vacancyId}`);
    await expect(page.getByText(candidateEmail, { exact: true })).toBeVisible();
    await expect(page.getByText("1 candidato en total")).toBeVisible();
  });

  await test.step("mover la postulación por el pipeline visual", async () => {
    await page.goto(`/ats/pipeline?vacancy=${vacancyId}&q=${encodeURIComponent(candidateEmail)}`);
    await expect(page.getByText(candidateName, { exact: true }).first()).toBeVisible();
    await page.getByRole("combobox", { name: `Cambiar etapa de ${candidateName}` }).click();
    await page.getByRole("option", { name: "Revisión E2E" }).click();
    await expect(page.getByRole("dialog")).toContainText("Postulación E2E → Revisión E2E");
    await page.getByRole("button", { name: "Confirmar cambio" }).click();
    await expect(page.getByRole("heading", { name: "Revisión E2E" }).first()).toBeVisible();
    await expect(page.getByText(candidateName, { exact: true }).first()).toBeVisible();
  });

  await test.step("confirmar la auditoría desde el perfil 360", async () => {
    await page.goto(`/ats/candidates?q=${encodeURIComponent(candidateEmail)}`);
    await page.getByRole("link", { name: /Abrir perfil 360/ }).click();
    await expect(page.getByRole("heading", { name: candidateName })).toBeVisible();
    await expect(page.getByText("Postulación E2E → Revisión E2E")).toBeVisible();
    await expect(page.getByText(/Responsable:/).last()).toBeVisible();
  });
});

function scopedHeaders() {
  return {
    authorization: `Bearer ${accessToken}`,
    "x-tenant-id": tenantId,
    "x-branch-id": branchId,
  };
}
