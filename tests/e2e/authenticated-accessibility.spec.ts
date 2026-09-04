import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { hasCredentials, openSurface, signIn } from "../support/e2e-auth";
import { REQUIRED_ROLES, SURFACES } from "../support/e2e-surfaces";
import { assertThemeApplied, forceLocale, forceTheme, THEMES } from "../support/e2e-theme";
import { waitForStableScreen } from "../support/e2e-stabilize";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/**
 * Auditoría de accesibilidad de las superficies internas.
 *
 * Cubre las 22 pantallas del catálogo compartido en tema claro y oscuro. El
 * tema oscuro importa especialmente: `--primary` no se redefine en `.dark`,
 * así que el contraste del texto de marca solo puede comprobarse ahí.
 *
 * Cada pantalla se ejecuta con el rol que realmente tiene acceso a ella según
 * `src/lib/navigation.ts`, en lugar de usar una única cuenta de reclutador
 * para todo. Sin esto, la mitad del catálogo mediría la pantalla de acceso
 * denegado en vez de la pantalla real.
 */
test.describe("accesibilidad autenticada", () => {
  test("estan configuradas las credenciales de todos los roles del catalogo", () => {
    const missing = REQUIRED_ROLES.filter((role) => !hasCredentials(role)).flatMap((role) => [
      `E2E_${role}_EMAIL`,
      `E2E_${role}_PASSWORD`,
    ]);

    expect(
      missing,
      `Faltan variables E2E para cubrir el catalogo completo:\n${missing.join("\n")}\n` +
        "Consulta .env.e2e.example. Sin ellas la suite omite pantallas en silencio.",
    ).toEqual([]);
  });

  for (const surface of SURFACES) {
    for (const theme of THEMES) {
      test(`sin violaciones axe: ${surface.name} [${theme}]`, async ({ page }) => {
        test.skip(
          !hasCredentials(surface.role),
          `Define E2E_${surface.role}_EMAIL y E2E_${surface.role}_PASSWORD para auditar ${surface.path}.`,
        );

        await forceTheme(page, theme);
        await forceLocale(page, "es");
        await signIn(page, surface.role);

        const available = await openSurface(page, surface.path);
        test.skip(
          !available,
          `El entorno de datos no habilita ${surface.path} para ${surface.role} ` +
            `(modulo "${surface.module}"). No es un fallo de accesibilidad.`,
        );

        await assertThemeApplied(page, theme);
        await waitForStableScreen(page);

        const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();

        // El mensaje enumera regla, impacto y nodo para que el fallo sea
        // accionable sin tener que reproducirlo a mano.
        const detail = results.violations
          .map(
            (violation) =>
              `- [${violation.impact ?? "sin impacto"}] ${violation.id}: ${violation.help}\n` +
              violation.nodes
                .slice(0, 3)
                .map((node) => `    ${node.target.join(" ")}`)
                .join("\n"),
          )
          .join("\n");

        expect(
          results.violations,
          `${surface.name} (${surface.path}) en tema ${theme}:\n${detail}`,
        ).toEqual([]);
      });
    }
  }
});

/**
 * Comprobación de desbordamiento horizontal.
 *
 * Se conserva de la versión anterior de este archivo y se amplía a todas las
 * superficies del catálogo, no solo a `/ats/candidates`.
 */
test.describe("sin desbordamiento horizontal", () => {
  const widths = [320, 375, 390, 430, 768, 1024, 1280];

  for (const surface of SURFACES) {
    test(`${surface.name} se adapta de 320 a 1280 px`, async ({ page }, testInfo) => {
      // La prueba fija sus propios anchos, asi que repetirla en los proyectos
      // moviles solo duplicaria trabajo con un viewport que se sobrescribe.
      test.skip(
        testInfo.project.name !== "chromium",
        "El barrido de anchos se ejecuta una sola vez, en el proyecto chromium.",
      );
      test.skip(
        !hasCredentials(surface.role),
        `Define E2E_${surface.role}_EMAIL y E2E_${surface.role}_PASSWORD para verificar ${surface.path}.`,
      );

      await forceLocale(page, "es");
      await signIn(page, surface.role);

      const available = await openSurface(page, surface.path);
      test.skip(!available, `${surface.path} no esta habilitada para ${surface.role} en este entorno.`);

      for (const width of widths) {
        await page.setViewportSize({ width, height: 844 });
        await waitForStableScreen(page);

        const { clientWidth, scrollWidth } = await page.evaluate(() => ({
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
        }));

        expect(scrollWidth, `${surface.path} desborda ${scrollWidth - clientWidth}px a ${width}px`).toBeLessThanOrEqual(
          clientWidth,
        );
      }
    });
  }
});
