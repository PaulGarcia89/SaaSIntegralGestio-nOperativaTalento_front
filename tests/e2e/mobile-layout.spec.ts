import { expect, test } from "@playwright/test";

const viewports = [320, 360, 375, 390, 412, 430, 480, 768, 1024, 1280];

for (const width of viewports) {
  test(`la landing no desborda a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Contrata, capacita y gestiona a tu equipo desde una sola plataforma." })).toBeVisible();
    const dimensions = await page.evaluate(() => ({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  });
}

test("el inicio de sesión conserva campos utilizables en 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/login");
  await expect(page.getByLabel("Correo corporativo")).toBeVisible();
  await expect(page.locator("#login-password")).toBeVisible();
  const inputFontSize = await page.getByLabel("Correo corporativo").evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
  expect(inputFontSize).toBeGreaterThanOrEqual(16);
});
