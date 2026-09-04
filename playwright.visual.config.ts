import { defineConfig, devices } from "@playwright/test";

/**
 * Configuración dedicada a la línea base visual.
 *
 * Vive aparte de `playwright.config.ts` a propósito: las capturas de
 * referencia requieren una aprobación explícita (`--update-snapshots`) y no
 * deben ejecutarse dentro de `pnpm test:e2e`, donde harían fallar a cualquiera
 * que aún no las haya generado.
 *
 * Escritorio se captura en tema claro y oscuro; movil solo en claro, que es el
 * tema por omisión del producto (`ThemeToggle` arranca en "light").
 * Son 13 pantallas x 2 temas en escritorio + 13 en movil = 39 referencias.
 */
export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: true,
  // Una captura no debe reintentarse: un reintento que pasa esconde inestabilidad.
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["list"], ["html", { outputFolder: "playwright-report-visual", open: "never" }]],
  snapshotPathTemplate: "tests/visual/__screenshots__/{projectName}/{arg}{ext}",

  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    // Tipografía y escala fijas: cualquier variación mueve todos los píxeles.
    deviceScaleFactor: 1,
    colorScheme: "light",
  },

  expect: {
    toHaveScreenshot: {
      // Tolerancia deliberada: los datos del entorno cambian entre ejecuciones.
      // Protege composición y estilo, no el contenido exacto.
      maxDiffPixelRatio: 0.02,
      threshold: 0.2,
      animations: "disabled",
      caret: "hide",
      scale: "css",
    },
  },

  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],

  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "NEXT_PUBLIC_API_URL=http://127.0.0.1:39999/api NEXT_PUBLIC_ENABLE_MOCK_BACKEND=true pnpm dev",
        url: "http://localhost:3000",
        reuseExistingServer: false,
        timeout: 120_000,
      },
});
