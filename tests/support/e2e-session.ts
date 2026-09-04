import fs from "node:fs";
import path from "node:path";
import type { Browser } from "@playwright/test";
import { hasCredentials, signIn, type E2ERole } from "./e2e-auth";
import { forceLocale } from "./e2e-theme";

/**
 * Sesiones reutilizables por rol.
 *
 * `POST /auth/login` está limitado a 10 intentos por correo cada 900 s
 * (`auth.controller.ts`, `@RateLimit({ name: 'auth-login', limit: 10,
 * windowSeconds: 900, scope: 'email' })`).
 *
 * La suite tiene 67 pruebas y casi todas usaban `TENANT_ADMIN`, así que una
 * sola ejecución superaba el límite con creces: el backend empezaba a devolver
 * 429 y las pruebas fallaban por tiempo de espera en el login. Parecía una
 * regresión del producto y no lo era.
 *
 * La solución es autenticarse una vez por rol, guardar el estado del navegador
 * y reutilizarlo. Una ejecución pasa de ~67 accesos a 6, y las ejecuciones
 * seguidas dentro de la ventana de frescura no hacen ninguno.
 */
const STATE_DIR = path.join(process.cwd(), "test-results", ".sessions");

/**
 * Cuánto se reutiliza un estado guardado.
 *
 * Diez minutos es cómodamente inferior a la caducidad del token de acceso
 * (15 min, `JWT_ACCESS_EXPIRES_IN`) y suficiente para encadenar ejecuciones
 * durante el desarrollo sin volver a autenticarse.
 */
const FRESHNESS_MS = 10 * 60_000;

export function sessionFile(role: E2ERole) {
  return path.join(STATE_DIR, `${role}.json`);
}

function isFresh(file: string) {
  try {
    return Date.now() - fs.statSync(file).mtimeMs < FRESHNESS_MS;
  } catch {
    return false;
  }
}

/**
 * Garantiza que exista un estado de sesión utilizable para el rol.
 *
 * Pensado para ejecutarse en `globalSetup`, en un único proceso y antes de que
 * arranquen los workers: así los accesos no se multiplican por el paralelismo.
 */
export async function ensureSession(browser: Browser, role: E2ERole, baseURL?: string) {
  if (!hasCredentials(role)) return null;

  const file = sessionFile(role);
  if (isFresh(file)) return file;

  fs.mkdirSync(STATE_DIR, { recursive: true });
  // `signIn` navega a "/login" en relativo, así que el contexto necesita baseURL.
  const context = await browser.newContext({ serviceWorkers: "block", baseURL });
  try {
    const page = await context.newPage();
    // Idioma fijo también aquí: el estado guardado incluye la cookie y el
    // almacenamiento de idioma, así que conviene que sea el mismo que usan las
    // pruebas.
    await forceLocale(page, "es");
    await signIn(page, role);
    await context.storageState({ path: file });
    return file;
  } finally {
    await context.close();
  }
}

/**
 * Devuelve el estado guardado del rol, o `undefined` si no hay ninguno.
 *
 * `undefined` es un valor válido para `storageState`: significa "contexto sin
 * autenticar", y la prueba se omitirá por falta de credenciales.
 */
export function storageStateFor(role: E2ERole) {
  const file = sessionFile(role);
  return fs.existsSync(file) ? file : undefined;
}
