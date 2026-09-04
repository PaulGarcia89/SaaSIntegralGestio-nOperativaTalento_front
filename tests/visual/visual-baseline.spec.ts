import { expect, test } from "@playwright/test";
import { hasCredentials, openSurface, signIn } from "../support/e2e-auth";
import { surfaceSlug, VISUAL_SURFACES } from "../support/e2e-surfaces";
import { assertThemeApplied, forceLocale, forceTheme, THEMES } from "../support/e2e-theme";
import { FIXED_CLOCK, masksFor, prepareForScreenshot } from "../support/e2e-stabilize";

/**
 * Línea base visual de las 13 pantallas de mayor tráfico operativo.
 *
 * Qué protege: composición, jerarquía, radios, sombras, color y espaciado.
 * Qué NO protege: los datos. Las cifras y fechas cambian con el entorno; por
 * eso el reloj se congela, las regiones volátiles se enmascaran y se admite
 * una tolerancia de diferencia.
 *
 * Cómo se usa durante el rediseño: los cambios de las fases 1 a 7 alterarán
 * estas capturas a propósito. El flujo correcto es revisar el diff, confirmar
 * que la diferencia es la buscada y volver a aprobar con
 * `pnpm test:visual:update`. Una captura que cambia sin que nadie lo esperara
 * es exactamente lo que esta suite existe para detectar.
 */
/**
 * Se bloquea `public/sw.js` por el mismo motivo que en la suite de
 * accesibilidad: intercepta todas las GET del mismo origen, impide que
 * `page.route()` fuerce el tema y puede servir respuestas cacheadas que harían
 * inestable la captura.
 */
test.use({ serviceWorkers: "block" });

test.describe("linea base visual", () => {
  test.beforeEach(async ({ page }) => {
    // Fija el instante para que las horas relativas y absolutas no muevan píxeles.
    await page.clock.setFixedTime(FIXED_CLOCK);
  });

  for (const surface of VISUAL_SURFACES) {
    for (const theme of THEMES) {
      test(`${surface.name} [${theme}]`, async ({ page }, testInfo) => {
        test.skip(
          !hasCredentials(surface.role),
          `Define E2E_${surface.role}_EMAIL y E2E_${surface.role}_PASSWORD para capturar ${surface.path}.`,
        );
        // Movil solo en tema claro: es el tema por omision del producto y
        // duplicar el catalogo movil no aporta senal proporcional a su coste.
        test.skip(
          theme === "dark" && testInfo.project.name === "mobile",
          "La linea base movil se mantiene solo en tema claro.",
        );

        await forceTheme(page, theme);
        await forceLocale(page, "es");
        await signIn(page, surface.role);

        const available = await openSurface(page, surface.path);
        test.skip(
          !available,
          `${surface.path} no esta habilitada para ${surface.role} en este entorno de datos.`,
        );

        await assertThemeApplied(page, theme);
        await prepareForScreenshot(page);

        await expect(page).toHaveScreenshot(`${surfaceSlug(surface)}-${theme}.png`, {
          fullPage: true,
          animations: "disabled",
          mask: masksFor(page, surface.mask),
        });
      });
    }
  }
});
