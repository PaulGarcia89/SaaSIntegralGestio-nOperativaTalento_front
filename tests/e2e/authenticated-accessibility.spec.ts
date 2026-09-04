import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { hasCredentials, openSurfaceResilient } from "../support/e2e-auth";
import { REQUIRED_ROLES, SURFACES } from "../support/e2e-surfaces";
import { sessionFile, storageStateFor } from "../support/e2e-session";
import { assertThemeApplied, forceLocale, forceTheme, THEMES } from "../support/e2e-theme";
import { waitForStableScreen } from "../support/e2e-stabilize";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/**
 * `public/sw.js` se registra en producción y responde a **todas** las peticiones
 * GET del mismo origen con `event.respondWith(fetch(...))`. Esa refetch ocurre
 * en el ámbito del service worker, que Playwright no enruta por omisión, así
 * que `page.route()` nunca llegaría a interceptar `/auth/preferences` y el tema
 * forzado no se aplicaría. Bloquearlo también elimina respuestas cacheadas.
 */
test.use({ serviceWorkers: "block" });

test.describe("cobertura de la auditoria", () => {
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
});

/**
 * Las pruebas se agrupan por rol para poder reutilizar la sesión: `globalSetup`
 * autentica una vez por rol y aquí solo se carga el estado guardado.
 *
 * Sin esto, cada una de las 67 pruebas iniciaba sesión por su cuenta y el
 * backend empezaba a devolver 429 (`auth-login`: 10 intentos por correo cada
 * 900 s), lo que se manifestaba como fallos de tiempo de espera en el login y
 * parecía una regresión del producto.
 */
for (const role of REQUIRED_ROLES) {
  const surfaces = SURFACES.filter((surface) => surface.role === role);
  if (!surfaces.length) continue;

  test.describe(`accesibilidad · ${role}`, () => {
    test.use({ storageState: sessionFile(role) });

    test.beforeEach(() => {
      test.skip(
        !hasCredentials(role) || !storageStateFor(role),
        `Define E2E_${role}_EMAIL y E2E_${role}_PASSWORD para auditar las pantallas de ${role}.`,
      );
    });

    for (const surface of surfaces) {
      for (const theme of THEMES) {
        test(`sin violaciones axe: ${surface.name} [${theme}]`, async ({ page }) => {
          await forceTheme(page, theme);
          await forceLocale(page, "es");

          const available = await openSurfaceResilient(page, surface.path, role);
          test.skip(
            !available,
            `El entorno de datos no habilita ${surface.path} para ${role} ` +
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

          // Se compara un resumen compacto en lugar del objeto completo de axe:
          // el diff de `violations` ocupa cientos de líneas de JSON y esconde la
          // información util. El detalle accionable va en el mensaje.
          const summary = results.violations.map(
            (violation) => `${violation.id} (${violation.impact ?? "sin impacto"}) x${violation.nodes.length}`,
          );

          expect(
            summary,
            `${surface.name} (${surface.path}) en tema ${theme}:\n${detail}`,
          ).toEqual([]);
        });
      }

      test(`${surface.name} se adapta de 320 a 1280 px`, async ({ page }, testInfo) => {
        // La prueba fija sus propios anchos, asi que repetirla en los proyectos
        // moviles solo duplicaria trabajo con un viewport que se sobrescribe.
        test.skip(
          testInfo.project.name !== "chromium",
          "El barrido de anchos se ejecuta una sola vez, en el proyecto chromium.",
        );

        await forceLocale(page, "es");

        const available = await openSurfaceResilient(page, surface.path, role);
        test.skip(!available, `${surface.path} no esta habilitada para ${role} en este entorno.`);

        for (const width of [320, 375, 390, 430, 768, 1024, 1280]) {
          await page.setViewportSize({ width, height: 844 });
          await waitForStableScreen(page);

          const { clientWidth, scrollWidth } = await page.evaluate(() => ({
            clientWidth: document.documentElement.clientWidth,
            scrollWidth: document.documentElement.scrollWidth,
          }));

          expect(
            scrollWidth,
            `${surface.path} desborda ${scrollWidth - clientWidth}px a ${width}px`,
          ).toBeLessThanOrEqual(clientWidth);
        }
      });
    }
  });
}
