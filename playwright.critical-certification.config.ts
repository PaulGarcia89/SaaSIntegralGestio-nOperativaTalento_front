import { defineConfig } from "@playwright/test";

if (!process.env.E2E_BACKEND_API_URL) {
  throw new Error("E2E_BACKEND_API_URL es obligatoria para la certificación crítica.");
}

export default defineConfig({
  testDir: "./tests/integration",
  testMatch: ["onboarding-lifecycle.spec.ts", "onboarding-scope.spec.ts", "training-inventory-certification.spec.ts"],
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: { baseURL: process.env.E2E_BACKEND_API_URL.replace(/\/$/, ""), extraHTTPHeaders: { Accept: "application/json" } },
});
