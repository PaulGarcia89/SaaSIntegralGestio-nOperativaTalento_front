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
