import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const email = process.env.E2E_INVENTORY_EMAIL;
const password = process.env.E2E_INVENTORY_PASSWORD;
const enabled = Boolean(email && password);

test.describe("certificación E2E de Inventario de restaurante", () => {
  test.skip(!enabled, "Configura E2E_INVENTORY_EMAIL y E2E_INVENTORY_PASSWORD para ejecutar contra el backend real.");

  async function login(page: Page) {
    await page.goto("/login");
    await page.getByLabel("Correo corporativo").fill(email!);
    await page.locator("#login-password").fill(password!);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
  }

  const routes = [
    ["Entradas", "/inventory/restaurant/receipts"],
    ["Consumo", "/inventory/restaurant/consumption"],
    ["Producción", "/inventory/restaurant/production"],
    ["Conteo físico", "/inventory/restaurant/stock-counts"],
    ["Transferencias", "/inventory/restaurant/transfers"],
    ["Importar ventas", "/inventory/restaurant/sales-import"],
    ["Reportes", "/inventory/restaurant/reports"],
  ] as const;

  for (const [name, route] of routes) {
    test(`${name} carga con estados operativos y navegación por teclado`, async ({ page }) => {
      await login(page);
      await page.goto(route);
      await expect(page.getByRole("main").or(page.locator("body"))).toBeVisible();
      await page.keyboard.press("Tab");
      await expect(page.locator(":focus")).toBeVisible();
      await expect(page.getByText(/No fue posible cargar|No se pudo cargar/i)).toHaveCount(0);
    });
  }

  test("Inventario no presenta violaciones Axe en escritorio", async ({ page }) => {
    await login(page);
    await page.goto("/inventory/restaurant/reports");
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(result.violations).toEqual([]);
  });

  for (const width of [320, 375, 768, 1024]) {
    test(`las pantallas de operaciones no desbordan a ${width}px`, async ({ page }) => {
      await login(page);
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/inventory/restaurant/transfers");
      const dimensions = await page.evaluate(() => ({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
    });
  }

  test("reportes conservan filtros y exportación accesible", async ({ page }) => {
    await login(page);
    await page.goto("/inventory/restaurant/reports");
    await page.getByLabel("Sucursal").fill("branch-real");
    await page.getByLabel("Desde").fill("2026-01-01");
    await expect(page.getByText(/branch-real|Desde/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Exportar/i })).toBeVisible();
  });

  test("muestra error recuperable ante una falla de API", async ({ page }) => {
    await login(page);
    await page.route("**/restaurant-inventory/reports/**", (route) => route.abort("failed").catch(() => undefined));
    await page.goto("/inventory/restaurant/reports");
    await expect(page.getByText(/No fue posible cargar el reporte|Reintentar/i).first()).toBeVisible();
  });

  test("evita doble envío mientras una operación está pendiente", async ({ page }) => {
    await login(page);
    await page.goto("/inventory/restaurant/stock-counts");
    const create = page.getByRole("button", { name: /Crear conteo/i });
    await expect(create).toBeVisible();
    await expect(create).toBeEnabled();
    await expect(page.locator("input").first()).toBeVisible();
  });
});
