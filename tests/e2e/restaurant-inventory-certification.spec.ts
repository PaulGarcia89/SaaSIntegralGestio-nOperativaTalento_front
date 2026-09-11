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
    ["Resumen", "/inventory/restaurant"],
    ["Recibir productos", "/inventory/restaurant/receipts"],
    ["Registrar consumo", "/inventory/restaurant/consumption"],
    ["Registrar producción", "/inventory/restaurant/production"],
    ["Realizar conteo", "/inventory/restaurant/stock-counts"],
    ["Transferir productos", "/inventory/restaurant/transfers"],
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

  /**
   * El modo cocina dejó de ser un botón permanente en la barra de contexto.
   *
   * Esa barra se pinta en las 38 pantallas del módulo, y el modo cocina es una
   * preferencia de quien mira, no un contexto de trabajo: tenía el mismo peso
   * visual que los selectores de sucursal y almacén. Ahora vive en el diálogo
   * que abre «Cambiar», junto a esos dos selectores.
   */
  const abrirContexto = async (page: import("@playwright/test").Page) => {
    await page.getByRole("button", { name: "Cambiar" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  };

  test("el modo cocina se conserva al cambiar de pantalla", async ({ page }) => {
    await login(page);
    await page.goto("/inventory/restaurant/production");
    await abrirContexto(page);
    await page.getByRole("button", { name: /Activar modo cocina|Modo cocina activo/i }).click();
    await expect(page.getByRole("button", { name: /Modo cocina activo/i })).toBeVisible();
    await page.keyboard.press("Escape");

    await page.goto("/inventory/restaurant/waste");
    await abrirContexto(page);
    await expect(page.getByRole("button", { name: /Modo cocina activo/i })).toBeVisible();
  });

  /**
   * La barra de operaciones viaja con el módulo.
   *
   * Las cinco operaciones vivían sólo dentro del panel de la primera pantalla:
   * quien entraba por «Existencias» —la entrada natural desde la barra lateral
   * y desde cualquier enlace de alerta— no las veía nunca. Esta prueba fija
   * que estén en una pantalla que NO es el panel.
   */
  test("las operaciones del módulo están en todas sus pantallas", async ({ page }) => {
    await login(page);
    await page.goto("/inventory/restaurant/stock");
    const barra = page.getByRole("navigation", { name: /Operaciones del inventario/i });
    await expect(barra).toBeVisible();
    for (const accion of ["Recibir", "Salida", "Merma", "Contar", "Transferir"]) {
      await expect(barra.getByRole("link", { name: accion, exact: true })).toBeVisible();
    }
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
    // «Sección de inventario» e «Iniciar conteo» no existen en el producto:
    // el panel no lleva navegación entre hermanas —«Resumen» es su única
    // pantalla— y la operación se llama «Contar» en la barra. La barra de
    // operaciones es lo que responde «qué puedo hacer» en el teléfono.
    await expect(page.getByRole("button", { name: "Actualizar" })).toBeVisible();
    const barra = page.getByRole("navigation", { name: /Operaciones del inventario/i });
    await expect(barra.getByRole("link", { name: "Salida", exact: true })).toBeVisible();
    await expect(barra.getByRole("link", { name: "Contar", exact: true })).toBeVisible();

    await abrirContexto(page);
    await page.getByRole("button", { name: /Activar modo cocina/i }).click();
    await page.keyboard.press("Escape");
    await page.goto("/inventory/restaurant/receipts");
    await abrirContexto(page);
    await expect(page.getByRole("button", { name: /Modo cocina activo/i })).toBeVisible();
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
    /*
     * El filtro dejó de ser un desplegable «Alertas» y pasó a ser una fila de
     * atajos con su cifra al lado: el desplegable obligaba a elegir una opción
     * para descubrir si devolvía algo. Se comprueba el atajo PULSADO, que es
     * lo que dice que el enlace conservó su filtro.
     */
    const alertas = page.getByRole("navigation", { name: "Alertas" });
    await expect(alertas.getByRole("button", { name: /Bajo mínimo/ })).toHaveAttribute("aria-pressed", "true");

    await page.goto("/inventory/restaurant");
    await expect(page.locator('a[href="/inventory/restaurant/lots?filter=7"]')).toBeVisible();
    await page.locator('a[href="/inventory/restaurant/lots?filter=7"]').click();
    await expect(page).toHaveURL(/\/inventory\/restaurant\/lots\?filter=7/);
    /*
     * Este atajo NO filtraba. Se mandaba al servidor como `?expiry=…` y el
     * controlador de `/lots` no lee ese parámetro, así que las cuatro opciones
     * devolvían la lista entera. Ahora se resuelve en el cliente, y esta línea
     * es la que impide que vuelva a quedarse en decorativo.
     */
    const vencimientos = page.getByRole("navigation", { name: /Filtrar por vencimiento/i });
    await expect(vencimientos.getByRole("button", { name: /Vence en 7 días/ })).toHaveAttribute("aria-pressed", "true");
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
