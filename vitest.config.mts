import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": src,
    },
  },
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
