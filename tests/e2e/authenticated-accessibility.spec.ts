import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const credentials = {
  email: process.env.E2E_RECRUITER_EMAIL,
  password: process.env.E2E_RECRUITER_PASSWORD,
};

test.describe("accesibilidad y movil autenticados", () => {
  test.skip(!credentials.email || !credentials.password, "Configura E2E_RECRUITER_EMAIL y E2E_RECRUITER_PASSWORD para certificar rutas internas.");

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Correo corporativo").fill(credentials.email!);
    await page.locator("#login-password").fill(credentials.password!);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
  });

  for (const route of ["/dashboard", "/ats/candidates", "/ats/pipeline", "/training/content", "/inventory", "/onboarding/documents"]) {
    test(`sin violaciones Axe detectables: ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      expect(results.violations).toEqual([]);
    });
  }

  for (const width of [320, 375, 390, 430, 768, 1024]) {
    test(`ATS no desborda a ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/ats/candidates");
      const dimensions = await page.evaluate(() => ({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
    });
  }
});
