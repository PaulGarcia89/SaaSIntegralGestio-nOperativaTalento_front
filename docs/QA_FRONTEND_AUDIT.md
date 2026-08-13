# Auditoría QA Profunda de Frontend

Fecha: 2026-08-13  
Alcance: `frontend-app`, rutas App Router, navegación, RBAC, UX, responsive, accesibilidad y suites Playwright.  
Método: revisión estática, ejecución no destructiva de Playwright local y análisis de cobertura. No se modificó código de aplicación durante esta auditoría.

## Resultado ejecutivo

La aplicación tiene una base sólida de control de acceso: la política central evalúa sesión, tenant, suscripción, módulo, feature flag, rol, permiso y sucursal antes de renderizar una ruta. También existen estados de acceso, errores y reintentos en pantallas principales. La certificación integral no está lista todavía por tres hallazgos de alta prioridad.

| Severidad | Hallazgo | Evidencia | Impacto |
| --- | --- | --- | --- |
| Alta | La localización del portal de candidato no responde al parámetro `lang=en` esperado por la prueba. | `public-accessibility.spec.ts`, Chromium y Chrome móvil. | No se puede certificar navegación bilingüe. |
| Alta | WebKit no está instalado, por lo que Safari iOS no se prueba. | Playwright informa ausencia de `webkit-2311/pw_run.sh`. | No hay evidencia para Safari iOS. |
| Alta | La suite RBAC asume sidebar de escritorio en móvil. | 22 fallos Chrome móvil por `aside[role=complementary]` oculto a propósito. | La suite no certifica RBAC móvil, aunque no demuestra una fuga de permisos. |
| Media | Persistencia de filtros de Reportes es `localStorage`, no backend. | `reports/page.tsx`. | Vistas no se comparten ni sobreviven a otro dispositivo. |
| Media | No hay cobertura automatizada de red degradada, 429, 500, timeout, offline, sesión revocada ni cambio de permisos en caliente. | Revisión de `tests/`. | Riesgo de regresión en recuperación de errores y datos no guardados. |
| Media | No hay suite E2E que cubra todos los dobles submit críticos. | Cobertura actual ATS/onboarding/integration parcial. | Riesgo residual de duplicados en operaciones críticas. |

## Controles comprobados

- Las rutas internas se resuelven mediante `evaluateRouteAccess` en `src/lib/navigation.ts`.
- El rechazo de acceso ofrece mensaje, acción de recuperación y `requestId` cuando existe.
- La navegación deriva de `allowedNav`; no se deben renderizar rutas fuera de permiso, módulo, suscripción o sucursal.
- Playwright público ejecutó correctamente 26 casos en Chromium y Chrome móvil antes de los fallos conocidos.
- RBAC de escritorio completó 24 casos: acceso permitido y rechazo de una ruta fuera de alcance por rol.

## Cobertura y brechas

| Área | Estado | Observación |
| --- | --- | --- |
| Rutas públicas y candidatas | Parcialmente automatizada | Hay smoke, accesibilidad y overflow en rutas seleccionadas. |
| Rutas internas | Parcial | Hay RBAC de escritorio; falta matriz completa de URL directa, refresh, historial y sesión expirada. |
| Menú por rol | Parcial | El modelo central es correcto; la verificación móvil falla por un selector de prueba incorrecto. |
| Formularios | Insuficiente | No existe matriz sistemática de vacío, extremos, pegado, doble submit, cancelación y cambios no guardados. |
| Tablas | Parcial | ATS tiene paginación/filtros; falta prueba de volumen, 500 y exportaciones por módulo. |
| Responsive | Parcial | Público cubre 320–430; interno propone 320–1024 pero requiere credenciales E2E. |
| Accesibilidad | Parcial | Axe público existe; rutas internas requieren cuenta dedicada y Safari/WebKit. |
| Network y sesiones | Insuficiente | No hay simulación programada de offline, timeout, 429, refresh token ni revocación. |
| Rendimiento | Insuficiente | No hay budgets Lighthouse/Web Vitals ni trazas de interacción en CI. |

## Decisión de salida

No certificar como "QA completo" hasta: instalar WebKit, adaptar la suite RBAC a navegación móvil, corregir o alinear la localización del candidato, y ejecutar las rutas internas con cuentas E2E dedicadas. Las rutas de escritorio y los controles RBAC revisados son aptos para continuar pruebas de regresión.

Véanse [matriz de pantallas](QA_SCREEN_MATRIX.md), [reporte responsive](QA_RESPONSIVE_REPORT.md), [reporte de accesibilidad](QA_ACCESSIBILITY_REPORT.md), [plan](QA_FRONTEND_TEST_PLAN.md) y [resultados](QA_FRONTEND_TEST_RESULTS.md).
