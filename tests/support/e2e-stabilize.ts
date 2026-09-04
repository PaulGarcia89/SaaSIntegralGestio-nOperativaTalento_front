import type { Locator, Page } from "@playwright/test";

/**
 * Instante fijo para todas las capturas.
 *
 * Varias pantallas renderizan horas relativas ("Hace 3 min") y absolutas
 * ("Actualizado: 14:32") calculadas con `Date.now()`. Sin congelar el reloj,
 * cada ejecución produciría píxeles distintos y la línea base sería inútil.
 */
export const FIXED_CLOCK = new Date("2026-01-15T09:00:00.000Z");

/**
 * Regiones con contenido inherentemente volátil que se enmascaran en todas las
 * capturas. No dependen de los datos de la pantalla, sino del estado de la
 * cuenta, por lo que cambiarían sin que nadie haya tocado la interfaz.
 */
const GLOBAL_MASK_SELECTORS = [
  // Contador de notificaciones sin leer del encabezado.
  '[aria-label^="Abrir notificaciones"] span',
];

/**
 * Neutraliza todo lo que produce diferencias de píxeles sin significado:
 * animaciones, transiciones, desplazamiento suave y el cursor de texto.
 */
export async function freezeMotion(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
      html { scroll-behavior: auto !important; }
      * { caret-color: transparent !important; }
    `,
  });
}

/**
 * Espera a que la pantalla deje de moverse: sin peticiones en vuelo, sin
 * regiones marcadas como ocupadas y sin indicadores de carga girando.
 *
 * `AsyncState` expone `aria-busy`, y el resto del sistema usa `animate-spin`
 * para los spinners, así que ambos sirven como señal de "todavía cargando".
 */
export async function waitForStableScreen(page: Page) {
  // Todas las esperas van acotadas y absorben su propio fallo: son señales de
  // "ya se puede capturar", no aserciones. Sin límite explícito, una pantalla
  // que nunca alcanza `networkidle` —por sondeo periódico o una conexión
  // abierta— consumiría el tiempo completo de la prueba y la mataría. Ocurrió
  // con `/training` en movil.
  await page.locator("main").first().waitFor({ state: "visible", timeout: 30_000 });

  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);

  await page
    .waitForFunction(
      () =>
        document.querySelectorAll('[aria-busy="true"]').length === 0 &&
        document.querySelectorAll(".animate-spin").length === 0,
      undefined,
      { timeout: 15_000 },
    )
    .catch(() => undefined);

  // `document.fonts.ready` puede no resolverse nunca si queda una fuente en
  // vuelo; se le pone su propio limite.
  await page
    .evaluate(
      () =>
        Promise.race([
          document.fonts?.ready ?? Promise.resolve(),
          new Promise((resolve) => setTimeout(resolve, 5_000)),
        ]),
    )
    .catch(() => undefined);
}

/** Prepara la página para una captura reproducible. */
export async function prepareForScreenshot(page: Page) {
  await freezeMotion(page);
  await waitForStableScreen(page);
}

/** Construye los localizadores a enmascarar para una superficie concreta. */
export function masksFor(page: Page, extraSelectors: readonly string[] = []): Locator[] {
  return [...GLOBAL_MASK_SELECTORS, ...extraSelectors].map((selector) => page.locator(selector));
}
