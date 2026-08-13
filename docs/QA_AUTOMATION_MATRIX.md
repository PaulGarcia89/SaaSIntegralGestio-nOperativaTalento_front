# Matriz de Automatización QA

Fecha: 2026-08-13. Esta matriz convierte la suite de regresión en pipelines y artefactos reproducibles. Los entornos de prueba deben ser aislados y contener datos sintéticos.

## Cobertura actual y objetivo

| Área | Cobertura existente | Objetivo inmediato | Herramienta principal | Prioridad |
| --- | --- | --- | --- | --- |
| UI pública, móvil y a11y | `tests/e2e/public-accessibility.spec.ts`, `mobile-layout.spec.ts` | Añadir journeys de postulación y estados de red | Playwright + Axe | P0 |
| Navegación por rol | `tests/e2e/role-navigation.spec.ts` | Contrato completo menú/ruta/CTA con datos por rol | Playwright | P0 |
| ATS lifecycle | `tests/ats-staging/ats-lifecycle.spec.ts`; backend ATS E2E | Oferta, entrevista, contratación y cleanup | Playwright + Supertest | P0 |
| Onboarding | Integración lifecycle y scope | Preboarding, firma, cierre, reintentos y automatización | Playwright + Supertest/Jest | P0 |
| Capacitación/Inventario | Certificación de catálogo/operación | Journeys de escritura y concurrencia | Playwright + Supertest | P0 |
| Backend RBAC | `test/rbac/*`, scope onboarding | Matriz de todos los endpoints y cambio de rol en sesión | Jest + Supertest | P0 |
| Seguridad de archivos | Sin cobertura E2E de UI completa | MIME/magic bytes, URL firmada, cuarentena y límites | Supertest + servicio sandbox | P0 |
| Productividad/Reportes | Smoke visual indirecto | Permisos, alertas, export y estados 403/500 | Playwright + Supertest | P1 |
| Integraciones | Scripts de certificación | Contract tests con sandboxes y webhooks duplicados | Jest/Supertest | P1 |
| Carga | k6 ATS de solo lectura | Flujos lectura/escritura controlados y umbrales | k6 | P1 |

## Mapeo prueba a capa y ejecución

| Suite | IDs | Capa | Herramienta | Entorno/datos | Disparador | Artefactos |
| --- | --- | --- | --- | --- | --- | --- |
| Smoke | `SMK-*` | UI + API | Playwright, Supertest | Staging efímero, fixtures mínimos | PR, deploy staging | HTML report, traces en fallo, resumen API |
| Critical | `CRT-*` | E2E transaccional | Playwright, Supertest, Jest | DB de certificación aislada; `runId` | Merge, migración, promoción | Trace, screenshot, requests sanitizados |
| Core | `COR-*` | Funcional/API | Playwright, Jest, Supertest | Testing persistente con limpieza | Diario y cambios de módulo | JUnit/HTML, cobertura |
| Full | `FUL-*` | Sistema completo | Playwright, Supertest | Testing con dataset voluminoso | Nocturno/release | Reporte consolidado |
| Security | `SEC-*` | API/UI/dep | Jest, Supertest, ZAP pasivo, audit | Sandbox aislado | Cambio auth/RBAC, semanal | SARIF, reporte de dependencia |
| Mobile | `MOB-*` | UI responsive | Playwright, Axe, dispositivos reales | Local/staging; cuentas sintéticas | Cambio visual, diario | Screenshots por viewport |
| RBAC | `RBAC-*` | API + UI | Supertest, Playwright | Tenant A/B y ramas A/B | Cambio rol/ruta/API | Matriz de denegaciones |

## Estructura recomendada

```text
frontend-app/
  tests/
    e2e/                 # smoke, rutas, UX y móvil
    regression/          # critical/core/full por módulo
    fixtures/             # login, datos, cleanup, rutas
  playwright.*.config.ts  # local, staging y certificación
BackEnd/
  test/
    e2e/                 # Supertest contra Nest + DB test
    rbac/                # matriz endpoint/rol/alcanze
    integration/         # storage, colas, workers y webhooks
  test/factories/        # tenants, sucursales, usuarios, datos únicos
```

## Convenciones técnicas obligatorias

| Aspecto | Regla |
| --- | --- |
| Identificadores | `runId = suite-timestamp-random`; todos los correos/títulos/activos usan el prefijo. |
| Datos | Crear por API/factory, nunca depender de usuarios de producción ni de datos compartidos. |
| Limpieza | `afterEach/afterAll` archiva o elimina sólo entidades con `runId`; un job nocturno detecta residuos. |
| Esperas | Esperar respuesta, selector estable o evento de dominio; prohibidos `waitForTimeout` salvo simulación explícita de red. |
| Idempotencia | Cada mutación crítica se ejecuta dos veces; segunda no genera efecto adicional. |
| Red | Mock sólo para estados UI. Para recorridos críticos, usar backend/DB reales de testing. |
| Secretos | Variables CI secretas por rol; logs y traces se sanitizan. |
| Paralelismo | Un tenant/sucursal por worker o lock de factory; no compartir activos/candidaturas. |
| Flakiness | Reintentar máximo dos veces en CI; investigar si falla en dos ejecuciones consecutivas. |

## Variables de entorno mínimas

| Variable | Uso |
| --- | --- |
| `E2E_BASE_URL` | URL del frontend de testing/staging. |
| `E2E_BACKEND_API_URL` | API aislada para integración. |
| `E2E_*_EMAIL`, `E2E_*_PASSWORD` | Credenciales sintéticas por rol, ya usadas por la suite de navegación. |
| `E2E_CERTIFICATION_ENABLED` | Habilita certificación que muta datos aislados. |
| `E2E_TENANT_A_ID`, `E2E_TENANT_B_ID` | Fixtures de aislamiento multiempresa. |
| `E2E_BRANCH_A_ID`, `E2E_BRANCH_B_ID` | Fixtures de aislamiento de sucursal. |
| `E2E_RUN_ID` | Opcional; CI lo genera si no existe. |

## Gate de CI propuesto

| Etapa | Comando/acción | Bloquea merge | Observación |
| --- | --- | --- | --- |
| Calidad estática frontend | `pnpm typecheck && pnpm lint && pnpm test` | Sí | Ejecutar antes de E2E. |
| Calidad estática backend | `npm run build && npm test` | Sí | Incluye unitarias/Jest. |
| Smoke UI | `pnpm test:e2e` filtrado a `SMK-*` | Sí | Paralelo por navegador sólo cuando datos estén aislados. |
| RBAC/API | `npm run test:rbac && npm run test:e2e` filtrado | Sí | Debe usar DB test. |
| Accessibility | `pnpm test:a11y && pnpm test:a11y:internal` | Sí para violación crítica | Analizar también flujos autenticados. |
| Security | `pnpm audit:production` y `npm run audit:production` | Sí para críticas | Añadir secret scanning/ZAP pasivo. |
| Critical certification | `pnpm test:certify:critical` + backend E2E | Sí para promoción | Sólo con `E2E_CERTIFICATION_ENABLED=true`. |
| Nocturno | Full + móvil + carga | No para merge; sí para release | Abrir incidencia automática al fallar. |

## Prioridad de implementación

1. Etiquetar las pruebas existentes como `SMK`, `RBAC`, `MOB` y asegurar credenciales de testing por rol.
2. Añadir factories, aislamiento por tenant/sucursal y cleanup para ATS -> onboarding -> training -> inventory.
3. Implementar `CRT-001`, `CRT-005`, `CRT-007`, `CRT-008` y `CRT-010` contra DB de certificación.
4. Completar los contract tests de archivos, webhooks, rate limiting y mutaciones idempotentes.
5. Ejecutar full/móvil/seguridad/carga cada noche; medir duración, flakiness y cobertura de requisitos.

## Métricas de salud de automatización

| Métrica | Objetivo |
| --- | --- |
| Duración smoke | <10 min |
| Duración critical | <25 min |
| Flakiness semanal | <2% |
| Bloqueantes automatizados | 100% |
| Rutas críticas con prueba RBAC API + UI | 100% |
| Flujos críticos en móvil | 100% |
| Fallos con trace/screenshot/requestId | 100% |
| Datos residuales por ejecución | 0 |
