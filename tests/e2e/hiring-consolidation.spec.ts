import { expect, test } from "@playwright/test";

const email = process.env.E2E_RECRUITER_EMAIL;
const password = process.env.E2E_RECRUITER_PASSWORD;

test.describe("centro de contrataciones consolidado", () => {
  test.skip(!email || !password, "Configura credenciales E2E de reclutador para certificar contrataciones.");

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Correo corporativo").fill(email!);
    await page.locator("#login-password").fill(password!);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
  });

  for (const width of [375, 768, 1280]) {
    test(`navega y conserva el layout a ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/hiring");
      await expect(page.getByRole("heading", { name: "Contrataciones" })).toBeVisible();
      await expect(page.getByRole("tablist", { name: "Vistas de contrataciones" })).toBeVisible();
      await expect(page.getByLabel("Filtrar por estado")).toBeVisible();
      const dimensions = await page.evaluate(() => ({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
    });
  }

  test("las vistas del flujo antiguo son accesibles por teclado", async ({ page }) => {
    await page.goto("/hiring");
    const waiting = page.getByRole("tab", { name: "Esperando candidato" });
    await waiting.focus();
    await expect(waiting).toBeFocused();
    await waiting.press("Enter");
    await expect(waiting).toHaveAttribute("aria-selected", "true");
  });
});
