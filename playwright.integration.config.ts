import { defineConfig } from "@playwright/test";

const apiBaseURL = process.env.E2E_BACKEND_API_URL;

if (!apiBaseURL) {
  throw new Error(
    "E2E_BACKEND_API_URL es obligatoria para ejecutar las pruebas de integración del backend.",
  );
}

export default defineConfig({
  testDir: "./tests/integration",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: apiBaseURL.replace(/\/$/, ""),
    extraHTTPHeaders: { Accept: "application/json" },
  },
});
