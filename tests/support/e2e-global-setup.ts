import { chromium, type FullConfig } from "@playwright/test";
import { REQUIRED_ROLES } from "./e2e-surfaces";
import { ensureSession } from "./e2e-session";

/**
 * Autentica una vez por rol antes de que arranquen los workers.
 *
 * Se ejecuta en un solo proceso a propósito: si cada prueba se autenticara, o
 * si lo hiciera cada worker, se superaría el límite de 10 accesos por correo
 * cada 15 minutos que impone el backend.
 *
 * Un fallo aquí no interrumpe la ejecución: las pruebas del rol afectado se
 * omitirán con su motivo, que es más informativo que un error de arranque.
 */
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL ?? process.env.E2E_BASE_URL;
  const browser = await chromium.launch();

  try {
    for (const role of REQUIRED_ROLES) {
      try {
        const file = await ensureSession(browser, role, baseURL);
        console.log(file ? `  sesión lista: ${role}` : `  sin credenciales: ${role}`);
      } catch (error) {
        console.warn(`  no se pudo autenticar ${role} en ${baseURL}: ${(error as Error).message}`);
      }
    }
  } finally {
    await browser.close();
  }
}
