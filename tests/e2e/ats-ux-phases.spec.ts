import { expect, test } from "@playwright/test";

const email = process.env.E2E_RECRUITER_EMAIL;
const password = process.env.E2E_RECRUITER_PASSWORD;
const applicationId = process.env.E2E_APPLICATION_ID;
const vacancyId = process.env.E2E_VACANCY_ID;

test.describe("ATS UX por fases", () => {
  test.skip(!email || !password, "Configura credenciales E2E de reclutador para certificar el ATS.");

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Correo corporativo").fill(email!);
    await page.locator("#login-password").fill(password!);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
  });

  for (const width of [320, 375, 430, 1280]) {
    test(`/ats conserva el contexto y no desborda a ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/ats");
      await expect(page.getByRole("heading", { name: "Requiere atención" })).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Vistas de candidatos" })).toBeVisible();
      const dimensions = await page.evaluate(() => ({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
    });
  }

  test("la bandeja ofrece accesos directos a las tareas ATS", async ({ page }) => {
    await page.goto("/ats");
    await expect(page.getByRole("link", { name: /Ver todos los candidatos/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "Gestionar vacantes" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Abrir agenda de entrevistas" })).toBeVisible();
  });

  test("el detalle del candidato permite cambiar de etapa UX", async ({ page }) => {
    test.skip(!applicationId, "Configura E2E_APPLICATION_ID para certificar el detalle del candidato.");
    await page.goto(`/ats/candidates/${applicationId}`);
    for (const label of ["Revisar", "Evaluar", "Decidir", "Transferir o cerrar"]) {
      const step = page.getByRole("button", { name: new RegExp(label) });
      await expect(step).toBeVisible();
      await step.click();
      await expect(step).toHaveAttribute("aria-current", "step");
    }
  });
});

test.describe("postulación pública UX", () => {
  test.skip(!vacancyId, "Configura E2E_VACANCY_ID para certificar el progreso público.");

  test("muestra la vacante y el acceso antes de iniciar", async ({ page }) => {
    await page.goto(`/apply?vacancyId=${encodeURIComponent(vacancyId!)}`);
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("heading", { name: /iniciar sesión|crear una cuenta/i })).toBeVisible();
  });
});
