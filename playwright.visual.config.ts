import { defineConfig, devices } from "@playwright/test";

/**
 * La línea base visual necesita una aplicación con datos reales detrás.
 *
 * No se levanta un servidor de desarrollo con backend simulado, como hace
 * `playwright.config.ts`, porque ese camino no funciona: `MOCK_BACKEND_ENABLED`
 * está fijado a `false` en `src/lib/backend.ts:204` (deliberadamente, para que
 * producción nunca renderice entidades simuladas), así que la simulación no se
 * activa aunque se pase `NEXT_PUBLIC_ENABLE_MOCK_BACKEND=true`. Sin backend,
 * cada pantalla capturaría su estado de error.
 *
 * Se falla de inmediato y con instrucciones, en lugar de gastar dos minutos
 * arrancando un servidor condenado. Es el mismo criterio que ya aplica
 * `playwright.critical-certification.config.ts`.
 */
if (!process.env.E2E_BASE_URL) {
  throw new Error(
    [
      "E2E_BASE_URL es obligatoria para la linea base visual.",
      "",
      "Apunta a un despliegue con backend y datos, por ejemplo:",
      "  E2E_BASE_URL=https://staging.tu-dominio.com pnpm test:visual:update",
      "",
      "Ademas necesitas credenciales de 6 roles en .env.e2e:",
      "  TENANT_ADMIN, HR_MANAGER, RECRUITER, INSTRUCTOR, INVENTORY_MANAGER, BRANCH_USER",
      "",
      "Detalle completo en docs/UX_SAFETY_NET.md.",
    ].join("\n"),
  );
}

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
    baseURL: process.env.E2E_BASE_URL,
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

  // Sin `webServer`: el objetivo lo aporta siempre `E2E_BASE_URL`, validada arriba.
});
