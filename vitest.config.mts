import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [
      "tests/e2e/**",
      "tests/integration/**",
      "tests/ats-staging/**",
      "node_modules/**",
      ".next/**",
    ],
  },
});
