# Suite QA de Regresión

Fecha: 2026-08-13  
Propósito: prevenir regresiones funcionales, de seguridad y experiencia antes de publicar. Esta es una especificación ejecutable: cada prueba debe tener datos aislados, trazabilidad y limpieza.

## Reglas de ejecución

- **No usar producción para operaciones destructivas.** `test`, `staging` y `certification` deben tener `DATABASE_URL`, bucket, colas, dominios y cuentas propios.
- Toda entidad creada incluye un prefijo único, por ejemplo `E2E-<runId>`, y se archiva o elimina mediante el endpoint permitido al terminar.
- Playwright valida interfaz, navegación, red y persistencia visible. Jest/Supertest valida API, base de datos, permisos, transacciones e idempotencia.
- Un `403`, `401`, `409`, `422` o `429` es aprobado sólo si la API y la interfaz muestran el resultado previsto sin filtrar información ni perder contexto.
- Adjuntar `trace`, screenshot y respuesta de API al fallar. Nunca guardar tokens, contraseñas ni datos personales en artefactos.

## SMOKE

Se ejecuta en cada pull request y tras desplegar a staging. Debe durar menos de 10 minutos y bloquear publicación.

| ID | Módulo | Precondición / usuario | Pasos y datos | Resultado esperado | Severidad | Automatizable / herramienta |
| --- | --- | --- | --- | --- | --- | --- |
| SMK-001 | Plataforma | Frontend y API de testing disponibles; `TENANT_ADMIN` | Abrir `/`, `/login`, iniciar sesión y cargar dashboard. | Assets cargan, sesión se crea y shell muestra tenant/sucursal. | Bloqueante | Sí, Playwright |
| SMK-002 | RBAC | Cuentas dedicadas por rol | Login con recruiter, instructor, inventario y admin; abrir ruta permitida y una prohibida. | Menú y URL respetan permiso; prohibida muestra estado controlado. | Crítica | Sí, Playwright + Supertest |
| SMK-003 | ATS | `HR_MANAGER`, sucursal de testing | Crear vacante `E2E-<runId>`, postular candidato único, buscarlo y moverlo a la siguiente etapa permitida. | Vacante, candidatura, etapa y evento se persisten; no se duplica. | Bloqueante | Sí, Playwright + Supertest |
| SMK-004 | Onboarding | Empleado/candidatura aprobada aislada; `HR_MANAGER` | Abrir expediente, completar una tarea y cargar documento permitido de prueba. | Progreso, actor, evidencia y estado se actualizan. | Bloqueante | Sí, Playwright + Supertest |
| SMK-005 | Capacitación | Curso publicado de prueba; `INSTRUCTOR` y `EMPLOYEE` | Asignar curso, abrirlo como empleado y completar evaluación aprobatoria. | Asignación/progreso se guardan y se emite certificado cuando aplica. | Bloqueante | Sí, Playwright + Supertest |
| SMK-006 | Inventario | Activo serializado de prueba; `INVENTORY_MANAGER` | Crear/usar activo, asignarlo a empleado y consultar historial. | Custodia, movimiento y auditoría son consistentes. | Bloqueante | Sí, Playwright + Supertest |
| SMK-007 | Productividad/reportes | `SUPERVISOR` con datos de prueba | Cargar resumen, alertas y exportación/reporte no destructivo. | KPI o estado vacío claro, sin 5xx ni fuga de otro tenant. | Crítica | Sí, Playwright + Supertest |
| SMK-008 | Móvil/a11y | Build local o staging | Abrir landing y login en 320 px; ejecutar Axe en ruta pública. | Sin overflow crítico ni violación Axe A/AA crítica. | Crítica | Sí, Playwright + Axe |

## CRITICAL

Se ejecuta en cada merge a `main`, antes de promover staging y tras migraciones. Incluye recuperación, doble submit y aislamiento.

| ID | Módulo | Precondición / usuario | Pasos y datos | Resultado esperado | Severidad | Automatizable / herramienta |
| --- | --- | --- | --- | --- | --- | --- |
| CRT-001 | ATS | Tenant A/B, admin de A | Vacante -> postulación pública -> revisión -> entrevista -> scorecard -> oferta -> aceptación -> contratación. | Cada transición autorizada queda auditada; contratación crea un único empleado/onboarding. | Bloqueante | Sí, Playwright + Supertest |
| CRT-002 | ATS | Candidato en etapa de rechazo | Intentar rechazo sin motivo, reapertura y transición no permitida. | Validación exige motivo; sólo reglas configuradas permiten avanzar/reabrir. | Crítica | Sí, Supertest + Playwright |
| CRT-003 | Entrevistas | Pool/panelistas de testing | Programar, reprogramar y cancelar con zona horaria; recargar entre cada acción. | Una sola entrevista vigente, notificaciones/eventos coherentes e ICS consistente. | Crítica | Sí, Playwright + Supertest |
| CRT-004 | Oferta/firma | Oferta temporal y firmante de prueba | Crear oferta estructurada, solicitar aprobación, generar documento, firmar/rechazar/vencer. | Versiones y firmas no se alteran; aceptación activa sólo una conversión. | Bloqueante | Sí, Supertest; Playwright para UI |
| CRT-005 | Onboarding | Empleado nuevo con plantilla versionada | Conversión -> preboarding -> tarea -> documento -> revisión -> firma -> cierre. | Checklist, responsable, documentos y timeline persisten; `READY/COMPLETED` sólo con reglas satisfechas. | Bloqueante | Sí, Playwright + Supertest |
| CRT-006 | Onboarding | Tarea vencida y ausente simulada | Ejecutar worker de recordatorio/escalamiento/reasignación dos veces. | Primera ejecución actúa; segunda es idempotente y queda auditada. | Crítica | Sí, Jest + Supertest |
| CRT-007 | Capacitación | Curso, SCORM/evaluación y empleado aislados | Asignar, completar contenido, fallar y reintentar examen, aprobar y renovar. | Progreso, intentos, certificado y vencimiento se calculan una vez. | Bloqueante | Sí, Playwright + Supertest |
| CRT-008 | Inventario | Dos operadores, activo y stock de prueba | Asignación concurrente, devolución, transferencia y evidencia. | Sin doble custodia ni stock negativo; conflicto responde `409` controlado. | Bloqueante | Sí, Jest/Supertest + Playwright |
| CRT-009 | Sesión | Usuario autenticado | Revocar/caducar token, refrescar, abrir segunda pestaña y cambiar permiso. | UI cierra/renueva sesión según contrato; no conserva acceso previo. | Crítica | Sí, Playwright + Supertest |
| CRT-010 | Multiempresa | Tenant A/B y mismas entidades nominales | Manipular `x-tenant-id`, `x-branch-id`, IDs y URL directa en ATS/onboarding/training/inventory. | `403/404` sin metadatos ni registros del otro alcance. | Bloqueante | Sí, Supertest + Playwright |

## CORE

Se ejecuta diariamente y al modificar el módulo correspondiente.

| ID | Módulo | Precondición / usuario | Pasos y datos | Resultado esperado | Severidad | Automatizable / herramienta |
| --- | --- | --- | --- | --- | --- | --- |
| COR-001 | Administración | `TENANT_ADMIN` | Crear/editar sucursal, usuario y rol; desactivar usuario. | Alcance, permisos y auditoría se recalculan correctamente. | Crítica | Sí, Playwright + Supertest |
| COR-002 | ATS | Recruiter con datos paginados | Buscar, filtros guardados, orden, selección masiva, exportar y navegar páginas. | Total/resultado de servidor correctos; acciones respetan selección y permiso. | Alta | Sí, Playwright |
| COR-003 | Talent CRM | Recruiter | Crear segmento, consentimiento, campaña en modo manual, marcar entrega y revisar deduplicación. | Audiencia sólo incluye consentidos; campañas no se envían sin aprobación. | Crítica | Sí, Supertest + Playwright |
| COR-004 | Archivos ATS | Usuario autorizado | Cargar PDF/DOCX permitido y archivos con MIME/firma/tamaño inválidos. | Sólo archivo seguro queda en cuarentena/almacenamiento previsto; URL no es pública permanente. | Crítica | Sí, Supertest |
| COR-005 | Onboarding | HR/supervisor | Crear plantilla, editar borrador, publicar versión, bloquear/rechazar con observación y filtrar expedientes. | Historial inmutable, versión vigente y motivo visibles. | Alta | Sí, Playwright + Supertest |
| COR-006 | Preboarding | Employee/candidate | Completar datos/documentos desde móvil, alternar idioma y retomar borrador. | Progreso persiste, controles son accesibles y no exige acceso administrativo. | Alta | Sí, Playwright |
| COR-007 | Capacitación | Instructor | Crear desde plantilla, editar por bloques, guardar borrador, publicar, asignar ruta y revisar analítica. | Autoguardado/borrador y estados del curso coherentes. | Alta | Sí, Playwright + Supertest |
| COR-008 | Inventario | Inventory manager | Alta, QR, mantenimiento, orden de compra, ajuste y conteo cíclico. | Eventos financieros/operativos conservan trazabilidad y validaciones. | Alta | Sí, Supertest; Playwright UI |
| COR-009 | Productividad | Supervisor | Crear configuración/cámara consentida, alertas y vista de equipo. | Consentimiento/rol requerido, métricas y estados vacíos claros. | Crítica | Sí, Playwright + Supertest |
| COR-010 | Reportes | Admin/HR | Guardar filtro, drill-down, exportar y volver al reporte. | Filtro y período se conservan; exportación coincide con alcance. | Alta | Sí, Playwright + Supertest |
| COR-011 | Automatizaciones | Tenant admin | Crear desde plantilla, simular, aprobar, activar y revisar ejecución/reintento. | Simulación no muta datos; ejecución idempotente y auditada. | Crítica | Sí, Jest + Supertest + Playwright |
| COR-012 | Estados UX | Roles representativos | Forzar loading, empty, 401, 403, 429, timeout, 500 y offline. | Explica estado, conserva contexto y ofrece reintento seguro. | Alta | Sí, Playwright route mocking |

## FULL REGRESSION

Se ejecuta cada noche y antes de una versión mayor. Recorre todo CORE más los siguientes casos.

| ID | Módulo | Precondición / usuario | Pasos y datos | Resultado esperado | Severidad | Automatizable / herramienta |
| --- | --- | --- | --- | --- | --- | --- |
| FUL-001 | Rutas | Matriz completa de roles/planes | Visitar cada ruta autorizada, prohibida, inexistente, deep link, refresh, back y forward. | No hay pantalla rota ni acceso por URL directa; fallback preserva orientación. | Alta | Sí, Playwright |
| FUL-002 | Formularios | Datos límite aislados | Vacío, mínimo, máximo, Unicode, pegado, autocomplete, cancelar, refresh y doble submit por cada formulario crítico. | Validación accesible; sin registros dobles, pérdida de datos ni foco erróneo. | Crítica | Parcial, Playwright + Vitest |
| FUL-003 | Tablas | Volumen alto de fixtures | Paginación, orden, filtros combinados, selección y exportación en todos los listados. | Servidor pagina; UI conserva filtros y no desborda. | Alta | Sí, Playwright + Supertest |
| FUL-004 | Notificaciones | Eventos de módulos aislados | Generar, leer, reintentar y configurar preferencias. | Una notificación por evento, sin duplicados, con enlaces autorizados. | Alta | Sí, Jest + Supertest |
| FUL-005 | Auditoría/retención | Registros sujetos a política | Exportar, anonimizar, legal hold y ejecutar retención en sandbox. | Se respeta hold, queda evidencia y no se eliminan datos fuera de alcance. | Crítica | Sí, Supertest + integración storage |
| FUL-006 | Integraciones | Mocks/sandboxes proveedor | Correo, calendario, firma, storage, antivirus, HRIS/SCIM con reintento y webhook duplicado. | Adaptador verifica firma, timeout, reintento e idempotencia sin exponer secretos. | Crítica | Sí, Jest/Supertest + contract tests |

## SECURITY REGRESSION

Se ejecuta en cada merge que cambia autenticación/autorización, y semanalmente en staging.

| ID | Módulo | Precondición / usuario | Pasos y datos | Resultado esperado | Severidad | Automatizable / herramienta |
| --- | --- | --- | --- | --- | --- | --- |
| SEC-001 | Autenticación | Cuenta de prueba | Credenciales erróneas, fuerza bruta controlada, reset y token revocado. | Mensajes seguros, rate limit, sesión inválida y sin enumeración de correo. | Bloqueante | Sí, Supertest |
| SEC-002 | RBAC/ABAC | Roles y tenants A/B | Matriz endpoint x rol x tenant x sucursal, GET/POST/PATCH/DELETE. | Denegación consistente y sin datos laterales. | Bloqueante | Sí, Jest/Supertest |
| SEC-003 | Frontend | Usuario sin permiso | Ocultar CTA, abrir URL, interceptar API `403`. | Acción no aparece; ruta/API bloqueadas y UI recuperable. | Crítica | Sí, Playwright + Supertest |
| SEC-004 | Archivos | Archivos inocuos/maliciosos de laboratorio | MIME falso, magic bytes inválidos, zip sospechoso, macro, >15MB, URL firmada vencida. | Rechazo/cuarentena/auditoría sin ejecución o URL pública. | Bloqueante | Sí, Supertest |
| SEC-005 | API | Ambiente aislado | IDOR, mass assignment, payload excesivo, XSS almacenado/reflejado, CSRF según mecanismo. | Validación, encoding y límites sin fuga ni mutación indebida. | Bloqueante | Sí, Supertest + OWASP ZAP pasivo |
| SEC-006 | Dependencias | Código compilable | Ejecutar auditoría de dependencias y revisión de secretos. | Sin vulnerabilidad crítica conocida ni secreto comprometido. | Crítica | Sí, `pnpm audit`, `npm audit`, secret scanning |

## MOBILE REGRESSION

Se ejecuta en cada cambio visual y diariamente en los flujos críticos.

| ID | Módulo | Precondición / usuario | Pasos y datos | Resultado esperado | Severidad | Automatizable / herramienta |
| --- | --- | --- | --- | --- | --- | --- |
| MOB-001 | Shell/navegación | Roles representative | 320, 360, 375, 390, 430, 768, 1024 y 1440 px; abrir/cerrar nav inferior/menú. | Sin overflow horizontal; accesos sólo autorizados y área táctil suficiente. | Crítica | Sí, Playwright |
| MOB-002 | ATS | Recruiter | Buscar candidato, filtros en hoja móvil, mover etapa y abrir perfil. | Filtros/CTA alcanzables sin hover; diálogo ocupa pantalla si corresponde. | Alta | Sí, Playwright |
| MOB-003 | Onboarding | Employee/HR | Retomar preboarding, adjuntar documento, completar tarea y firmar. | Footer Guardar/Cancelar visible, foco correcto y carga tolerante a red lenta. | Crítica | Sí, Playwright |
| MOB-004 | Capacitación | Employee/instructor | Abrir curso, responder evaluación y crear borrador de curso. | Progreso no se pierde; controles/SCORM no requieren hover o tabla ancha. | Alta | Sí, Playwright |
| MOB-005 | Inventario | Inventory manager | Buscar/escanear, entregar y devolver activo. | Tarjetas secuenciales y cámara/permiso manejados sin bloquear. | Alta | Sí, Playwright emulación + dispositivo real periódico |

## RBAC REGRESSION

Se ejecuta en cada cambio de navegación, permisos o endpoints.

| ID | Módulo | Precondición / usuario | Pasos y datos | Resultado esperado | Severidad | Automatizable / herramienta |
| --- | --- | --- | --- | --- | --- | --- |
| RBAC-001 | Navegación | SUPERADMIN a CANDIDATE | Comparar menú desktop/móvil con contrato de navegación de cada rol. | Misma política visible; módulos/acciones no autorizados no aparecen. | Bloqueante | Sí, Playwright |
| RBAC-002 | ATS | Recruiter, interviewer, HR, viewer | Crear/editar/mover/exportar/contratar y probar acciones restringidas. | Capacidades mínimas y límites por rol se cumplen. | Bloqueante | Sí, Supertest + Playwright |
| RBAC-003 | Onboarding | HR, supervisor, employee, candidato | Ver/editar expedientes, tareas, documentos y firma de otras sucursales. | Alcance por tenant/sucursal/relación se impone en UI y API. | Bloqueante | Sí, Supertest + Playwright |
| RBAC-004 | Capacitación/Inventario | Instructor, employee, inventory manager | Administrar curso/activo y consultar recursos de otra sucursal. | Lectura/escritura separadas correctamente. | Crítica | Sí, Supertest + Playwright |
| RBAC-005 | Cambio de permiso | Usuario activo | Retirar rol durante sesión y reintentar URL/API. | Sesión se actualiza o deniega inmediatamente según contrato. | Crítica | Sí, Playwright + Supertest |

## Criterios de salida

- SMOKE y todos los casos Bloqueantes: 100% aprobados.
- CRITICAL: 100% aprobados antes de producción; una excepción requiere riesgo aceptado, fecha y owner.
- CORE: >=98% aprobados, sin fallo Crítico abierto.
- FULL/MOBILE/RBAC/SECURITY: >=95% aprobados; ningún hallazgo Bloqueante/Crítico sin mitigación.
- Cada fallo incluye `runId`, entorno, usuario sintético, requestId, screenshot/trace y referencia de incidencia.
