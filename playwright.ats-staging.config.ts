import { defineConfig, devices } from "@playwright/test";

const frontendUrl = required("E2E_ATS_FRONTEND_URL").replace(/\/$/, "");
required("E2E_ATS_BACKEND_URL");
required("E2E_ATS_ADMIN_EMAIL");
required("E2E_ATS_ADMIN_PASSWORD");

if (process.env.E2E_ATS_ENVIRONMENT !== "staging") {
  throw new Error("E2E_ATS_ENVIRONMENT=staging es obligatoria para la suite ATS con escrituras");
}
if (process.env.E2E_ATS_ALLOW_WRITES !== "true") {
  throw new Error("E2E_ATS_ALLOW_WRITES=true es obligatoria para confirmar datos efímeros en staging");
}

export default defineConfig({
  testDir: "./tests/ats-staging",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["json", { outputFile: "test-results/ats-staging-report.json" }]],
  use: {
    baseURL: frontendUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} es obligatoria`);
  return value;
}
