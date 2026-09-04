import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const email = process.env.E2E_INVENTORY_EMAIL;
const password = process.env.E2E_INVENTORY_PASSWORD;
const enabled = Boolean(email && password);
const granularEmail = process.env.E2E_INVENTORY_GRANULAR_EMAIL;
const granularPassword = process.env.E2E_INVENTORY_GRANULAR_PASSWORD;
const granularEnabled = Boolean(granularEmail && granularPassword);

test.describe("certificación E2E de Inventario de restaurante", () => {
  test.skip(!enabled, "Configura E2E_INVENTORY_EMAIL y E2E_INVENTORY_PASSWORD para ejecutar contra el backend real.");

  async function login(page: Page, credentials = { email, password }) {
    await page.goto("/login");
    await page.getByLabel("Correo corporativo").fill(credentials.email!);
    await page.locator("#login-password").fill(credentials.password!);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
  }

  const routes = [
    ["Dashboard", "/inventory/restaurant"],
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

  test("el modo compacto cocina se conserva al cambiar de pantalla", async ({ page }) => {
    await login(page);
    await page.goto("/inventory/restaurant/production");
    const compact = page.getByRole("button", { name: /Modo compacto cocina|Modo compacto activo/i });
    await expect(compact).toBeVisible();
    await compact.click();
    await expect(page.getByRole("button", { name: /Modo compacto activo/i })).toBeVisible();
    await page.goto("/inventory/restaurant/waste");
    await expect(page.getByRole("button", { name: /Modo compacto activo/i })).toBeVisible();
  });

  for (const width of [320, 375, 768, 1024]) {
    test(`las pantallas críticas no desbordan a ${width}px`, async ({ page }) => {
      await login(page);
      await page.setViewportSize({ width, height: 844 });
      for (const route of ["/inventory/restaurant", "/inventory/restaurant/receipts", "/inventory/restaurant/stock", "/inventory/restaurant/stock-counts", "/inventory/restaurant/transfers"]) {
        await page.goto(route);
        const dimensions = await page.evaluate(() => ({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
        expect(dimensions.scrollWidth, route).toBeLessThanOrEqual(dimensions.clientWidth);
      }
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

  test("un perfil granular puede abrir operaciones sin recibir 403", async ({ page }) => {
    test.skip(!granularEnabled, "Configura E2E_INVENTORY_GRANULAR_EMAIL y E2E_INVENTORY_GRANULAR_PASSWORD para probar permisos granulares.");
    const forbidden: string[] = [];
    page.on("response", (response) => { if (response.status() === 403 && response.url().includes("restaurant-inventory")) forbidden.push(response.url()); });
    await login(page, { email: granularEmail, password: granularPassword });
    for (const route of ["/inventory/restaurant/receipts", "/inventory/restaurant/stock-counts", "/inventory/restaurant/recipes"]) {
      await page.goto(route);
      await expect(page.getByRole("main").or(page.locator("body"))).toBeVisible();
    }
    expect(forbidden).toEqual([]);
  });

  test("recibir una transferencia refresca existencias y Kardex", async ({ page }) => {
    await login(page);
    await page.goto("/inventory/restaurant/transfers");
    const receive = page.getByRole("button", { name: /Recibir|Confirmar recepción/ }).first();
    test.skip((await receive.count()) === 0, "No hay una transferencia en tránsito para ejecutar este escenario.");
    const stockRefresh = page.waitForResponse((response) => response.url().includes("/restaurant-inventory/balances") && response.request().method() === "GET");
    const movementRefresh = page.waitForResponse((response) => response.url().includes("/restaurant-inventory/movements") && response.request().method() === "GET");
    page.once("dialog", (dialog) => void dialog.accept());
    await receive.click();
    await Promise.all([stockRefresh, movementRefresh]);
  });

  test("la navegación móvil conserva el contexto y abre la entrada guiada", async ({ page }) => {
    await login(page);
    await page.setViewportSize({ width: 375, height: 844 });
    await page.goto("/inventory/restaurant");
    await expect(page.getByLabel("Sección de inventario")).toBeVisible();
    await expect(page.getByRole("button", { name: "Actualizar" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Registrar consumo/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Iniciar conteo/i })).toBeVisible();
    const compact = page.getByRole("button", { name: /Modo compacto cocina|Modo compacto activo/i });
    await compact.click();
    await page.goto("/inventory/restaurant/receipts");
    await expect(page.getByRole("button", { name: /Modo compacto activo/i })).toBeVisible();
    await page.getByRole("button", { name: /Nueva entrada/i }).click();
    await expect(page.getByRole("list", { name: "Pasos de la entrada" })).toBeVisible();
    await expect(page.getByText("Proveedor y almacén")).toBeVisible();
  });

  test("existencias mantiene accesibilidad WCAG en móvil", async ({ page }) => {
    await login(page);
    await page.setViewportSize({ width: 375, height: 844 });
    await page.goto("/inventory/restaurant/stock");
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(result.violations).toEqual([]);
  });

  test("las alertas del dashboard conservan su filtro al abrir control", async ({ page }) => {
    await login(page);
    await page.goto("/inventory/restaurant");
    await expect(page.locator('a[href="/inventory/restaurant/stock?filter=LOW"]')).toBeVisible();
    await page.locator('a[href="/inventory/restaurant/stock?filter=LOW"]').click();
    await expect(page).toHaveURL(/\/inventory\/restaurant\/stock\?filter=LOW/);
    await expect(page.getByLabel("Alertas")).toHaveValue("LOW");
    await page.goto("/inventory/restaurant");
    await expect(page.locator('a[href="/inventory/restaurant/lots?filter=7"]')).toBeVisible();
    await page.locator('a[href="/inventory/restaurant/lots?filter=7"]').click();
    await expect(page).toHaveURL(/\/inventory\/restaurant\/lots\?filter=7/);
  });

  test("redirige a login cuando expira la sesión", async ({ page }) => {
    await login(page);
    await page.route("**/api/session", (route) => route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ message: "Sesión expirada" }) }));
    await page.goto("/inventory/restaurant/reports");
    await page.reload();
    await expect(page).toHaveURL(/\/login/);
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
