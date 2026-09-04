import type { Page } from "@playwright/test";

export type Theme = "light" | "dark";
export const THEMES: readonly Theme[] = ["light", "dark"];

/**
 * El tema NO se deriva de `prefers-color-scheme`.
 *
 * `ThemeToggle` lee la preferencia `ui-theme` desde `GET /auth/preferences` y
 * aplica la clase `.dark` sobre `<html>`; después persiste cada cambio con
 * `PUT /auth/preferences/ui-theme`. Por eso `page.emulateMedia()` no sirve, y
 * pulsar el botón tampoco: escribiría la preferencia en el backend y el tema
 * se filtraría a las demás pruebas que comparten la misma cuenta.
 *
 * La forma determinista es interceptar el endpoint:
 *  - GET  devuelve exactamente el tema pedido.
 *  - PUT  se responde 200 sin llegar al backend, de modo que la prueba nunca
 *         deja residuo en la cuenta compartida.
 *
 * Interceptar el GET tiene un efecto secundario deseable: `DomainTable` lee de
 * ahí sus preferencias `table:*`, así que todas las tablas se renderizan con
 * columnas y orden por defecto en lugar de heredar los ajustes de la cuenta.
 */
export async function forceTheme(page: Page, theme: Theme) {
  await page.route("**/auth/preferences**", async (route) => {
    const method = route.request().method();

    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ "ui-theme": { theme } }),
      });
      return;
    }

    // Absorbe la escritura para no contaminar la cuenta compartida.
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
}

/**
 * Fija el idioma para que la captura no dependa de la preferencia guardada en
 * la cuenta. Sin esto, una cuenta con `en` produce una pantalla distinta.
 */
export async function forceLocale(page: Page, locale: "es" | "en" = "es") {
  await page.route("**/me/preferences/locale", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ preferredLocale: locale }),
    });
  });
  await page.addInitScript((value) => {
    window.localStorage.setItem("talentos.locale", value);
  }, locale);
}

/**
 * Confirma que la clase `.dark` quedó (o no) aplicada. Se usa como aserción
 * previa a cualquier comprobación de contraste: sin esto, una prueba de "modo
 * oscuro" podría estar midiendo la paleta clara y pasar silenciosamente.
 */
export async function assertThemeApplied(page: Page, theme: Theme) {
  await page.waitForFunction(
    (expected) => document.documentElement.classList.contains("dark") === (expected === "dark"),
    theme,
    { timeout: 10_000 },
  );
}
