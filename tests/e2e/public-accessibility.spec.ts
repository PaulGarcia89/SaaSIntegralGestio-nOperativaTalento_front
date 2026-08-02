import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const width of [320, 375, 390, 430]) {
  test(`portal de vacantes sin desborde a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/jobs");
    await expect(page.locator("html")).toHaveJSProperty("scrollWidth", width);
    const smallTargets = await page.locator("body > div a:visible, body > div button:visible").evaluateAll((elements) => elements.filter((element) => element.getBoundingClientRect().height < 44).map((element) => element.textContent?.trim()));
    expect(smallTargets).toEqual([]);
  });
}

test("portal público sin violaciones WCAG A/AA detectables", async ({ page }) => {
  await page.goto("/jobs");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations).toEqual([]);
});

for (const route of ["/application-status", "/candidate/portal", "/candidate/profile", "/candidate/reset-password?token=invalid-development-token-00000000"]) {
  test(`portal ATS de candidato accesible: ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page.getByRole("navigation")).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

test("navegación del candidato cambia entre español e inglés", async ({ page }) => {
  await page.goto("/candidate/portal?lang=en");
  await expect(page.getByRole("navigation", { name: "Candidate navigation" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Profile and privacy" })).toBeVisible();
  await page.getByRole("link", { name: "Español" }).click();
  await expect(page.getByRole("navigation", { name: "Navegación del candidato" })).toBeVisible();
});
