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
      // `tests/` es territorio de Playwright; las pruebas de vitest viven en `src/`.
      // Se excluye el directorio completo en lugar de enumerar subcarpetas: así,
      // añadir una suite nueva de Playwright no vuelve a romper `pnpm test`.
      "tests/**",
      "node_modules/**",
      ".next/**",
    ],
  },
});
