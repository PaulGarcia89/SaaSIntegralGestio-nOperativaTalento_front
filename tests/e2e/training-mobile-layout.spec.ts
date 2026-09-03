import { expect, test } from "@playwright/test";

const credentials = {
  email: process.env.E2E_RECRUITER_EMAIL,
  password: process.env.E2E_RECRUITER_PASSWORD,
};

const routes = [
  "/training",
  "/training/content",
  "/training/paths",
  "/training/evaluations",
  "/training/results",
  "/training/certificates",
  "/training/integrations",
  "/training/intelligence",
];

test.describe("capacitación responsive", () => {
  test.skip(!credentials.email || !credentials.password, "Configura credenciales E2E para certificar capacitación móvil.");

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Correo corporativo").fill(credentials.email!);
    await page.locator("#login-password").fill(credentials.password!);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
  });

  for (const route of routes) {
    for (const width of [320, 375, 430]) {
      test(`${route} no desborda a ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 844 });
        await page.goto(route);
        await expect(page.locator("main")).toBeVisible();
        const dimensions = await page.evaluate(() => ({
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
        }));
        expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
      });
    }
  }
});
