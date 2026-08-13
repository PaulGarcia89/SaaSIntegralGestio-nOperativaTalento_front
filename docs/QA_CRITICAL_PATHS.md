# Caminos Críticos E2E

## Flujo completo esperado

`Empresa -> Sucursal -> Usuario/Rol -> Vacante -> Candidatura -> Revisión -> Entrevista -> Evaluación -> Contratación -> Onboarding -> Documento -> Curso -> Evaluación -> Certificado -> Activo -> Productividad -> Reporte`

Cada caso usa IDs con prefijo `e2e-<runId>`, dos tenants (`A`, `B`) y dos sucursales por tenant. Toda creación se limpia al terminar y se registra en auditoría.

| # | Flujo | Happy path y persistencia | Negativo / edge / retry | Rol y aislamiento |
| --- | --- | --- | --- | --- |
| 1 | Registrar empresa | Registrar tenant, GET y lectura DB verifican slug/plan/actor. | Slug duplicado, email inválido, refresh tras POST, doble submit. | Superadmin; tenant B no visible. |
| 2 | Crear sucursal | Crear sucursal A1, GET tenant y DB confirman `tenantId`. | Nombre duplicado, sede fuera de tenant, retry. | Tenant admin; usuario B recibe 403. |
| 3 | Crear usuario | Usuario A1 creado, login y relación de sucursal persistentes. | Email duplicado, contraseña débil, doble submit. | Tenant admin; HR no puede crear. |
| 4 | Asignar rol | Rol de reclutador visible al refrescar sesión y en DB. | Rol inexistente, revocar durante sesión, 403 API. | Tenant admin; sin fuga entre tenants. |
| 5 | Publicar vacante | Vacante y etapas publicadas; GET público y DB coinciden. | Campos requeridos, pipeline inválido, publicar dos veces, refresh borrador. | Recruiter autorizado; empleado 403. |
| 6 | Aplicar candidato | Candidatura pública crea candidato/aplicación/stage inicial. | Email ya aplicado, CV inválido, token/captcha si aplica, retry red. | Público; candidaturas de A no visibles en B. |
| 7 | Revisar candidato | Lista filtrada, perfil, CV y timeline reflejan la aplicación. | Sin permiso, filtro vacío, refresh, URL directa. | Recruiter; interviewer sólo alcance permitido. |
| 8 | Cambiar etapa | Transición permitida, actor, anterior/nuevo y motivo en API/DB/timeline. | Transición no permitida, rechazo sin motivo, concurrencia 409, retry. | Recruiter; tenant/sucursal B 403. |
| 9 | Agendar entrevista | Entrevista, zona, ICS/link y participante persistidos. | Cruce horario, enlace vencido, reprogramar/cancelar, dos coordinadores. | Recruiter/interviewer según permiso. |
| 10 | Evaluar candidato | Scorecard firmado, criterios y decisión visibles tras refresh. | Pregunta requerida vacía, edición posterior a firma, evaluador no asignado. | Interviewer; comité separado. |
| 11 | Contratar candidato | Empleado, workflow y onboarding creados transaccionalmente; API/DB sin parciales. | Doble click, candidato ya contratado, fallo intermedio/rollback. | HR/recruiter con `applications.hire`. |
| 12 | Iniciar onboarding | Flujo, plantilla, tareas/responsables y próximo paso aparecen. | Plantilla inaccesible, sucursal errónea, refresh. | HR/supervisor; tenant B aislado. |
| 13 | Solicitar documento | Tarea documental y notificación/timeline persistidos. | Tipo no permitido, fecha límite inválida, responsable sin alcance. | Onboarding manager. |
| 14 | Completar documento | Upload privado, hash/scan, revisión y auditoría confirmados. | MIME/tamaño/antivirus, pérdida de red, documento duplicado/versionado. | Candidato/empleado; manager revisa. |
| 15 | Asignar curso | Asignación y vencimiento visibles para alumno/instructor/API/DB. | Curso retirado, asignación duplicada, batch retry. | Instructor/HR; empleado sólo ve propio. |
| 16 | Completar curso | Lecciones/progreso completan estado de asignación. | Offline/progreso concurrente, contenido no disponible, refresh. | Empleado. |
| 17 | Presentar evaluación | Intento, nota y límite de intentos persistentes. | Respuesta vacía, timeout durante submit, doble envío. | Empleado; instructor consulta. |
| 18 | Emitir certificado | Certificado verificable por código y registro DB. | No aprobar evaluación, emisión repetida, revocación. | Sistema/instructor autorizado. |
| 19 | Crear activo | Catálogo/activo/tag/serie/ubicación persisten. | Tag/serie duplicado, datos incompletos, retry. | Inventory manager; tenant B 403. |
| 20 | Asignar activo | Custodia, movimiento, evidencia y empleado coinciden en tres capas. | Activo no disponible, doble asignación, dos usuarios concurrentes. | Inventory manager; empleado consulta propio. |
| 21 | Consultar productividad | Métricas cargan por sucursal con fuente/periodo. | Sin permiso, sin cámara/datos, timeout, refresh. | Supervisor/admin; employee no ve datos de otros. |
| 22 | Generar reporte | KPI -> drill-down/export y metadatos de periodo/alcance coherentes. | Filtro inválido, export concurrente, 429/500/retry. | `reports.export`; tenant B sin datos A. |

## Orquestación por caso

1. Crear identidad/fixture por API con un `runId` único.
2. Ejecutar interacción por navegador Playwright.
3. Verificar respuesta de red con `page.waitForResponse` o API autenticada.
4. Refrescar y abrir deep link en una segunda página.
5. Ejecutar consulta read-only a DB de testing o endpoint de auditoría.
6. Ejecutar negativo, edge, retry, permiso denegado y aislamiento cross-tenant.
7. Capturar screenshot en cada hito y video/trace ante fallo.
8. Limpiar registros por `runId`; verificar que no permanecen datos E2E.

## Artefactos Playwright

Para cada critical path configurar `trace: "retain-on-failure"`, `screenshot: "only-on-failure"`, `video: "retain-on-failure"` y reporte JSON/JUnit. Para fallos de concurrencia conservar además el estado de ambas páginas y respuestas HTTP correlacionadas.
