# Resultados de Pruebas Frontend

Fecha de ejecución: 2026-08-13. Entorno: desarrollo local, mock backend habilitado por Playwright. Las pruebas no escribieron contra producción.

## Ejecuciones

| Comando | Resultado | Detalle |
| --- | --- | --- |
| `npm run typecheck` | PASS | Correcto en verificación previa de la entrega. |
| `npm run lint` | PASS con 2 warnings | Warnings preexistentes: import no usado en ATS Analytics e Inventory Purchases. |
| `npm run build` | PASS | 71 rutas generadas. |
| `npm run test:a11y` | FAIL | 26 passed, 16 failed. |
| `npm run test:e2e:roles` | FAIL | 24 passed (Chromium), 42 failed por aserción móvil/WebKit. |

## Fallos confirmados

### QA-001: idioma del portal de candidato no cambia con `lang=en`

- Severidad: Alta.
- Evidencia: `tests/e2e/public-accessibility.spec.ts:40` falla en Chromium y Chrome móvil al no encontrar `navigation[aria-label="Candidate navigation"]`.
- Reproducción: abrir `/candidate/portal?lang=en`.
- Esperado: navegación y enlace de perfil en inglés; enlace para volver a español.
- Actual: la navegación no expone el nombre esperado en inglés.

### QA-002: WebKit no disponible

- Severidad: Alta para certificación, no defecto funcional confirmado.
- Evidencia: Playwright no encuentra `webkit-2311/pw_run.sh`.
- Impacto: 14 fallos de a11y público y 20 fallos RBAC Safari sin ejecutar la aplicación.
- Acción: instalar navegadores Playwright en CI/local y ejecutar de nuevo.

### QA-003: suite RBAC no adapta la aserción al menú móvil

- Severidad: Alta para confianza de pruebas, baja para funcionalidad confirmada.
- Evidencia: `role-navigation.spec.ts:52` exige `aside[role=complementary]` visible; en móvil el sidebar desktop se oculta por diseño.
- Impacto: 22 fallos Chrome móvil para todos los roles.
- Acción: abrir `Menu`/drawer y validar exclusivamente enlaces autorizados; mantener la validación de desktop separada.

## Casos que pasaron

- Accesibilidad Axe público y portal candidato en Chromium/Chrome móvil.
- Overflow de `/jobs` a 320, 375, 390 y 430 px en Chromium/Chrome móvil.
- Overflow de preboarding a 320, 375 y 430 px en Chromium/Chrome móvil.
- RBAC de escritorio: roles SUPERADMIN, PLATFORM_ADMIN, TENANT_ADMIN, HR_MANAGER, RECRUITER, INTERVIEWER, INSTRUCTOR, SUPERVISOR, INVENTORY_MANAGER, BRANCH_USER y CANDIDATE validan acceso permitido y una ruta denegada cuando corresponde.

## No ejecutado / pendiente

- Rutas internas Axe: necesitan `E2E_RECRUITER_EMAIL` y `E2E_RECRUITER_PASSWORD` contra entorno dedicado.
- APIs reales 403, tenant/sucursal, sesiones revocadas y refresh tokens.
- Network throttling, offline, timeout, 429, 500 y retry.
- Doble submit y persistencia de formularios de operaciones críticas.
- Safari iOS/WebKit y dispositivos Android reales.
- Performance/Lighthouse y pruebas de carga de UI.
