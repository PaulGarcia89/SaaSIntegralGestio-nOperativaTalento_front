import type { Page } from "@playwright/test";

/**
 * Roles reconocidos por la plataforma, con el mismo nombre que usan las
 * variables de entorno `E2E_<ROL>_EMAIL` / `E2E_<ROL>_PASSWORD`.
 *
 * Es la misma convención que ya usaba `tests/e2e/role-navigation.spec.ts`;
 * se centraliza aquí para que la auditoría de accesibilidad y la línea base
 * visual no dupliquen credenciales ni el procedimiento de acceso.
 */
export type E2ERole =
  | "SUPERADMIN"
  | "PLATFORM_ADMIN"
  | "TENANT_ADMIN"
  | "HR_MANAGER"
  | "RECRUITER"
  | "INTERVIEWER"
  | "INSTRUCTOR"
  | "SUPERVISOR"
  | "INVENTORY_MANAGER"
  | "BRANCH_USER"
  | "CANDIDATE";

export type E2ECredentials = { email: string; password: string };

export function credentialsFor(role: E2ERole): E2ECredentials {
  return {
    email: process.env[`E2E_${role}_EMAIL`] ?? "",
    password: process.env[`E2E_${role}_PASSWORD`] ?? "",
  };
}

export function hasCredentials(role: E2ERole) {
  const { email, password } = credentialsFor(role);
  return Boolean(email && password);
}

/**
 * Inicia sesión con el rol indicado y espera a que el shell autenticado esté
 * montado. No asume ninguna ruta de destino: la pantalla concreta la decide
 * cada prueba.
 */
export async function signIn(page: Page, role: E2ERole) {
  const { email, password } = credentialsFor(role);
  if (!email || !password) {
    throw new Error(
      `Faltan credenciales para ${role}. Define E2E_${role}_EMAIL y E2E_${role}_PASSWORD.`,
    );
  }

  await page.goto("/login");
  await page.getByLabel("Correo corporativo").fill(email);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await page.waitForURL((url) => !/\/login(?:\?|$)/.test(url.pathname + url.search));
}

/**
 * Texto con el que `AccessDenied` comunica que la ruta no corresponde al
 * perfil actual. Se usa para distinguir "la pantalla falló" de "este rol no
 * debería estar viendo esta pantalla en este entorno de datos".
 */
export const ACCESS_DENIED_PATTERN =
  /No tienes acceso a esta sección|no está asignada a tu perfil|permiso necesario|no está habilitado|Suscripción requerida/i;

/**
 * Navega a `path` y determina si la pantalla quedó realmente disponible.
 *
 * Devuelve `false` cuando el entorno de datos no habilita el módulo para ese
 * rol (por plan, por módulo deshabilitado o por falta de sucursal). Esto NO es
 * un fallo del producto: es una diferencia de fixture, y la prueba debe
 * omitirse de forma explícita en lugar de reportar un falso negativo.
 */
export async function openSurface(page: Page, path: string) {
  await page.goto(path);
  await page.locator("main").first().waitFor({ state: "visible" });
  const denied = await page.getByText(ACCESS_DENIED_PATTERN).first().isVisible().catch(() => false);
  return !denied;
}
