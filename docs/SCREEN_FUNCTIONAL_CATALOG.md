# Catálogo funcional por pantalla

Leyenda de permisos: se listan los permisos visibles en la política de navegación o en los controles de pantalla. El backend es la autoridad final; DTO/endpoints específicos quedan **PENDIENTE DE CONFIRMAR** si no son invocados por la página.

## Inventario completo

| ID | Módulo | Pantalla | Ruta | Rol principal | Permiso | Estado | Responsive | Problema principal |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P01 | Público | Inicio | `/` | Visitante | Público | Implementada | Correcto | Validar conversión y contraste real |
| P02 | Público | Vacantes públicas | `/jobs` | Candidato | Público | Implementada | Correcto | Filtros y guardado de búsqueda limitados |
| P03 | Público | Postulación | `/apply` | Candidato | Público | Implementada | Correcto | Falta borrador recuperable |
| P04 | Público | Estado de postulación | `/application-status` | Candidato | Sesión candidata | Implementada | Correcto | Sin central de mensajes completa |
| P05 | Público | Verificar certificado | `/certificates/verify/[code]` | Visitante | Público | Implementada | No verificada | Falta auditoría de verificación visible |
| P06 | Público | Firma | `/sign/[token]` | Firmante | Token | Implementada | Correcto | Validar accesibilidad legal local |
| P07 | Acceso | Iniciar sesión | `/login` | Todos | Público | Implementada | Correcto | Evitar revelar detalle de credenciales |
| P08 | Acceso | Recuperar contraseña | `/forgot-password` | Todos | Público | Parcial | Correcto | Integración real bloqueada |
| P09 | Acceso | Registrar empresa | `/register-company` | Visitante | Público | Parcial | Correcto | Flujo transaccional bloqueado |
| P10 | Candidato | Portal | `/candidate/portal` | Candidato | Sesión candidata | Implementada | Correcto | Navegación secundaria a consolidar |
| P11 | Candidato | Perfil y privacidad | `/candidate/profile` | Candidato | Sesión candidata | Implementada | Correcto | Preferencias de canal PENDIENTE |
| P12 | Candidato | Agenda autoservicio | `/candidate/interviews/schedule` | Candidato | Token | Implementada | Correcto | Sin cronología/alternativas visibles |
| P13 | Candidato | Preboarding | `/candidate/preboarding` | Empleado entrante | Token | Implementada | Correcto | Traducción de contenido PENDIENTE |
| P14 | Candidato | Restablecer contraseña | `/candidate/reset-password` | Candidato | Token | Implementada | No verificada | Requiere E2E de token |
| P15 | Inicio | Dashboard | `/dashboard` | Todos internos | `dashboard.view` | Implementada | Correcto | Personalización por rol limitada |
| P16 | Personas | Empleados | `/employees` | Supervisor/Admin | `productivity.view` | Parcial | Correcto | Es capability page, no directorio completo |
| P17 | Onboarding | Expedientes/documentos | `/onboarding/documents` | HR/Admin | `onboarding.view/manage` | Implementada | Mejorable | Densidad y diálogos extensos |
| P18 | Onboarding | Firmas | `/onboarding/signatures` | HR/Admin | `onboarding.view/manage` | Implementada | Mejorable | Integraciones externas PENDIENTE |
| P19 | Onboarding | Operación | `/onboarding/operations` | HR/Admin | `onboarding.manage` | Implementada | Correcto | Automatización necesita monitor operacional |
| P20 | Onboarding | Analítica | `/onboarding/analytics` | HR/Admin | `onboarding.view` | Implementada | Correcto | Productividad formal PENDIENTE |
| P21 | Onboarding | Cumplimiento | `/onboarding/compliance` | HR/Admin | `onboarding.manage` | Implementada | Correcto | Validación jurídica local PENDIENTE |
| P22 | ATS | Vacantes | `/ats/vacancies` | HR/Recruiter | `jobs.view/create/update/publish` | Implementada | Correcto | Editor post-publicación y filtros a reforzar |
| P23 | ATS | Pipeline | `/ats/pipeline` | HR/Recruiter | `applications.view/change_stage` | Implementada | Correcto | Está oculto del menú |
| P24 | ATS | Candidatos | `/ats/candidates` | HR/Recruiter | `candidates.view/update` | Implementada | Mejorable | Acciones masivas/columnas no uniformes |
| P25 | ATS | Detalle de candidato | `/ats/candidates/[id]` | HR/Recruiter | `applications.*` | Implementada | Mejorable | Acciones críticas en diálogo |
| P26 | ATS | Entrevistas | `/ats/interviews` | Recruiter/Interviewer | `interviews.view/schedule/update/evaluate` | Implementada | Mejorable | Agenda y filtros densos |
| P27 | ATS | Scorecards | `/ats/scorecards` | Recruiter/Interviewer | `scorecards.view/complete` | Implementada | Correcto | Comparación/calibración PENDIENTE |
| P28 | ATS | Comunicaciones | `/ats/communications` | HR/Recruiter | `applications.view` | Implementada | Mejorable | Bandeja bidireccional depende de proveedor |
| P29 | ATS | Talent CRM | `/ats/talent-crm` | HR/Recruiter | `candidates.view` | Implementada | Mejorable | Tres contextos en una sola página |
| P30 | ATS | Analítica | `/ats/analytics` | HR/Recruiter | `applications.view` | Implementada | Correcto | Editor de dashboards limitado |
| P31 | Formación | Cursos del alumno | `/training` | Empleado/Instructor | `training.view` | Implementada | Correcto | Descarga offline PENDIENTE |
| P32 | Formación | Gestionar cursos | `/training/content` | Instructor/Admin | `training.manage` | Implementada | Mejorable | Editor multimedia/coautoría PENDIENTE |
| P33 | Formación | Rutas y cumplimiento | `/training/paths` | Instructor/Admin | `training.manage` | Implementada | Correcto | Matriz de competencias necesita UI completa |
| P34 | Formación | Evaluaciones | `/training/evaluations` | Instructor/Empleado | `assessments.*` | Implementada | Correcto | Proctoring PENDIENTE |
| P35 | Formación | Resultados | `/training/results` | Instructor/Admin | `training.view` | Implementada | Correcto | Cohortes/benchmark PENDIENTE |
| P36 | Formación | Certificados | `/training/certificates` | Instructor/Empleado | `certificates.view/issue` | Implementada | Correcto | Renovaciones por lote PENDIENTE |
| P37 | Formación | Inteligencia | `/training/intelligence` | Instructor/HR | `training.manage` | Implementada | Correcto | UI de captura requiere madurez |
| P38 | Formación | Integraciones | `/training/integrations` | Instructor/Admin | `training.integrations.manage` | Implementada | Correcto | Certificación real PENDIENTE |
| P39 | Productividad | Dashboard | `/productivity` | Supervisor/Admin | `productivity.view` | Implementada | Correcto | Datos y evidencia de modelos limitados |
| P40 | Productividad | Cámaras y zonas | `/productivity/cameras` | Admin | `productivity.manage` | Parcial | Correcto | Sin prueba de conexión/editor de polígono |
| P41 | Inventario | Catálogo y activos | `/inventory` | Inventario/Admin | `inventory.view/manage` | Implementada | Mejorable | Tabla/listado según rol por uniformar |
| P42 | Inventario | Almacén y stock | `/inventory/warehouse` | Inventory manager | `inventory.manage` | Implementada | Correcto | Conteo/ciclo a profundizar |
| P43 | Inventario | Compras | `/inventory/purchases` | Inventory manager | `inventory.manage` | Implementada | Mejorable | Edición/cancelación/recepción rica PENDIENTE |
| P44 | Inventario | Mantenimiento | `/inventory/maintenance` | Inventory manager | `inventory.manage` | Implementada | Mejorable | Calendario preventivo PENDIENTE |
| P45 | Inventario | Escaneo | `/inventory/scan` | Inventario/Supervisor | `inventory.view` | Implementada | Correcto | Cámara/RFID reales PENDIENTE |
| P46 | Inventario | Mis activos | `/inventory/my-assets` | Empleado | `inventory.view` | Implementada | Correcto | Autoservicio de pérdida/solicitud PENDIENTE |
| P47 | Inventario | Entregas | `/inventory/deliveries` | Inventory manager | `inventory.view` | Parcial | No verificada | Depende de InventoryWorkspace |
| P48 | Inventario | Devoluciones | `/inventory/returns` | Inventory manager | `inventory.view` | Parcial | No verificada | Depende de InventoryWorkspace |
| P49 | Inventario | Analítica | `/inventory/analytics` | Inventory manager | `inventory.view` | Implementada | Correcto | Tendencias/coste PENDIENTE |
| P50 | Inventario | Auditoría | `/inventory/audit` | Inventory manager | `inventory.manage` | Implementada | Correcto | Filtros y exportación PENDIENTE |
| P51 | Reportes | Reportes globales | `/reports` | Roles autorizados | `reports.view/export` | Implementada | Correcto | Filtros guardados locales |
| P52 | Alertas | Notificaciones | `/notifications` | Interno | `notifications.view` | Implementada | Correcto | Agrupación/acciones masivas |
| P53 | Perfil | Mi perfil | `/profile` | Interno | `profile.view/update` | Implementada | Correcto | Preferencias completas PENDIENTE |
| P54 | Admin tenant | Resumen administrativo | `/admin` | Tenant admin | `admin.view` | Parcial | Correcto | Placeholder explícito |
| P55 | Admin tenant | Empresa | `/admin/company` | Tenant admin | `admin.company` | Parcial | No verificada | Verificar edición y branding |
| P56 | Admin tenant | Sucursales | `/admin/branches` | Tenant admin | `branches.view/create/update` | Implementada | Correcto | Formulario denso |
| P57 | Admin tenant | Usuarios | `/admin/users` | Tenant admin | `users.*` | Implementada | Correcto | Invitar/revocar y bulk PENDIENTE |
| P58 | Admin tenant | Roles | `/admin/roles` | Tenant admin | `roles.*` | Implementada | Correcto | Riesgo de permisos complejos |
| P59 | Admin tenant | Automatizaciones | `/admin/automations` | Tenant admin | `admin.view` | Implementada | Mejorable | Regla compleja en formulario largo |
| P60 | Admin tenant | Suscripción empresa | `/admin/company/subscription` | Tenant admin | `admin.subscription` | Parcial | No verificada | Ruta marcada no disponible |
| P61 | Admin SaaS | Empresas | `/admin/tenants` | Super admin | `tenants.*` | Implementada | Correcto | Formulario denso |
| P62 | Admin SaaS | Planes | `/admin/plans` | Super admin | `admin.subscription` | Implementada | Correcto | Requiere guardrails comerciales |
| P63 | Admin SaaS | Módulos | `/admin/modules` | Super admin | `admin.company` | Implementada | Correcto | Confirmación impacto masivo |
| P64 | Admin SaaS | Integraciones | `/admin/integrations` | Super admin | `platform.integrations.manage` | Parcial | No verificada | Certificación por proveedor |
| P65 | Admin SaaS | Suscripciones | `/admin/subscription` | Super admin | `admin.subscription` | Implementada | Correcto | Errores de copy visibles |
| P66 | Admin SaaS | Facturación | `/admin/billing` | Super admin | `admin.subscription` | Parcial | Correcto | Capability page |
| P67 | Admin SaaS | Usuarios globales | `/admin/global-users` | Super admin | `admin.users` | Parcial | Correcto | Capability page |
| P68 | Admin SaaS | Auditoría | `/admin/audit` | Super admin | `admin.view` | Parcial | Correcto | Capability page |
| P69 | Admin SaaS | Configuración | `/admin/settings` | Super admin | `admin.company` | Parcial | Correcto | Capability page |
| P70 | Admin SaaS | Colas y certificación | `/admin/queues` | Super admin | `admin.view` | Implementada | Correcto | Tres endpoints de observabilidad pendientes |

## Fichas funcionales compactas

Cada ficha resume objetivo, acciones, datos/componentes, dependencias y mejora prioritaria. Todas las páginas internas pasan por la política central de ruta: sesión, tenant, sucursal cuando aplica, rol, permisos, módulo, feature flag y suscripción activa/trial/grace.

### Público y candidato

| Pantalla | Objetivo y usuarios | Acciones y componentes | Backend / mejora prioritaria | Mobile |
| --- | --- | --- | --- | --- |
| Inicio | Explicar valor y conducir a empleo/acceso. Visitante. | CTA, módulos, flujo y roles. | Estático; medir eventos de conversión. | Hero corto, CTA visible sin scroll. |
| Vacantes | Descubrir oportunidades. Candidato. | Tarjetas, búsqueda/filtros, CTA aplicar. | `fetchPublicVacancies`; añadir alertas/búsquedas guardadas. | Filtros en hoja; tarjetas de una columna. |
| Postulación | Capturar candidatura y consentimiento. | Formulario, CV, parsing, login social. | `fetchPublicVacancy`, `submitCandidateApplication`, `parseCandidateResume`; añadir borrador. | Wizard de 3 pasos, progreso persistente. |
| Estado | Consultar progreso y retirar solicitud. | Timeline, entrevistas, retirada confirmada. | `fetchCandidateApplications`, `withdrawCandidateApplication`; añadir mensajes. | Timeline vertical, CTA destructivo separado. |
| Portal | Centro de entrevistas, ofertas, archivos. | Cards por aplicación, descarga, perfil. | Portal/candidaturas/ofertas; consolidar mensajes. | Tabs o acordeones. |
| Perfil/privacidad | Editar perfil y ejercer privacidad. | Formulario, preferencias, solicitudes. | Perfil y privacy requests; confirmar requisitos locales. | Campos agrupados, guardado fijo. |
| Agenda | Elegir horario autorizado. | Lista de slots y confirmación. | Scheduling público; añadir reprogramar/cancelar. | Botones grandes, zona horaria visible. |
| Preboarding | Completar tareas y documentos. | Progreso, carga y completar. | Preboarding candidato; traducción de contenido PENDIENTE. | Sin tabla; cards de tareas. |
| Firma | Consentir y firmar. | Consentimiento, nombre, feedback. | Contexto/firma pública; conservar evidencia. | Una columna, CTA fijo. |

### ATS

| Pantalla | Objetivo y usuarios | Acciones principales/secundarias | Datos y backend | UX/UI y mobile |
| --- | --- | --- | --- | --- |
| Vacantes | HR/Recruiter crean y administran requisiciones/vacantes. | Crear, editar, publicar, archivar, clonar, historial, requisición. | Vacantes, imágenes, requisiciones y decisiones. | Wizard de creación; en móvil cards y acciones overflow. |
| Pipeline | Mover y decidir postulaciones. | Seleccionar vacante, mover etapa, rechazar/reabrir. | Aplicaciones, setup, motivos. | Tiene adaptación mobile; exponer en menú. |
| Candidatos | Operar lista/pool de solicitantes. | Filtrar, vistas guardadas, bulk, exportar, abrir detalle. | Aplicaciones, vacantes, usuarios, saved views. | Consolidar filtro/selección/bulk en hoja móvil. |
| Detalle candidato | Tomar decisión contextual. | Guardar etapa/notas, CV firmado, comunicación, contratar. | Application, hiring context, historial, motivos. | Tabs: perfil, proceso, entrevistas, mensajes; dialog de contratación responsive. |
| Entrevistas | Coordinar agenda y evaluación. | Agendar secuencia, disponibilidad, invitación ICS, OAuth. | Entrevistas, calendarios, pools, recursos. | Agenda por día y hoja para formularios. |
| Scorecards | Capturar feedback estructurado. | Crear/usar plantilla, puntuar, firmar. | Scorecards/criterios PENDIENTE DE CONFIRMAR. | Preguntas una por pantalla o acordeón. |
| Comunicaciones | Operar mensajes y entregas. | Plantillas, envío/reintento, historial. | Comunicaciones ATS; proveedor/entregabilidad PENDIENTE. | Inbox con lista-detalle. |
| Talent CRM | Trabajar talento a largo plazo. | Pools, etiquetas, actividades, campañas, deduplicar/fusionar. | Candidatos/pools/tags/campañas/duplicados. | Separar CRM, campañas y duplicados por tab con URL. |
| Analítica | Entender embudo y coste/calidad. | Filtros, exportar, guardar dashboard, coste fuente, calidad 30/60/90. | Analytics ATS, dashboards, costes, calidad. | Tarjetas de KPI y tablas en cards. |

### Onboarding, formación, productividad, inventario y administración

| Pantalla/grupo | Objetivo | Acciones/componentes | Dependencias | Mejora principal |
| --- | --- | --- | --- | --- |
| Incorporaciones/documentos | Gestionar expediente, tareas, plantillas, carga/revisión/cierre. | Templates/versiones, tareas, drag/reorder, documentos, lifecycle. | Flujos, contexto, documentos, descargas. | Dividir en bandeja + expediente + biblioteca. |
| Firmas onboarding | Preparar paquetes vinculados al expediente. | Plantillas, proveedor, paquete, estado/evidencias. | Firma/proveedores/flows. | Certificar proveedor y usar hoja móvil. |
| Operaciones onboarding | Ejecutar automatizaciones/cohortes. | Aplicar template masivo, ejecutar automatización. | Templates, flows, overview. | Cola, simulación y auditoría legible. |
| Analítica/compliance onboarding | Medir y cumplir retención/firma. | Métricas, políticas, legal hold, export. | Analytics, retención, evidencias. | Mostrar alcance y fuentes de datos. |
| Cursos/contenido/rutas | Aprender y administrar currículo. | Crear cursos, módulos, lecciones, bloques, rutas/asignaciones. | Training endpoints. | Editor multimedia y estrategia offline. |
| Evaluaciones/resultados/certificados | Evaluar, calificar, emitir y renovar. | Banco, preguntas, intentos, resultados, certificados. | Assessments/certificates. | Proctoring y cohortes. |
| Inteligencia/integraciones training | Competencias, ROI, conectores y SCORM. | Ver inteligencia, webhooks, paquetes, sesiones. | Analytics/intelligence/integrations. | Explicar estado de certificación y permisos. |
| Productividad | Mostrar actividad agregada no decisional. | KPIs, alertas, recomendaciones explicables. | Overview, alerts, insights. | Métricas con periodo/alcance y drill-down autorizado. |
| Cámaras y zonas | Configurar fuentes y zonas. | Crear cámara/zona, listar estado. | Cameras/zones. | Prueba de conectividad, validación, polígono, privacidad. |
| Inventario | Gestionar catálogo, stock, compras, custodia y mantenimiento. | Crear/asignar/devolver, stock, proveedores, PO, auditoría. | Inventory endpoints. | DataGrid único + flujo de compra/recepción. |
| Reportes | Consumir y exportar métricas multi-módulo. | Filtros, guardar local, exportar. | Reports overview/export. | Filtros guardados backend y explicabilidad. |
| Notificaciones | Resolver alertas. | Leer, archivar, borrar, preferencias, reintentar. | Notifications/deliveries. | Agrupar por entidad y acciones masivas. |
| Administración tenant | Configurar empresa, sucursales, usuarios, roles y automations. | CRUD y automatizaciones. | Tenants/branches/users/roles/automation. | Completar resumen/suscripción y reducir diálogo denso. |
| Gobierno SaaS | Gobernar empresas, planes, módulos, suscripciones, colas. | CRUD, activación de módulos, certificación. | Platform APIs/queues. | Completar capabilities y endpoints faltantes. |

## Estados transversales

- **Loading:** predomina `AsyncState`; recomendable skeleton por estructura para dashboard/listado.
- **Empty:** bueno en ATS, firma, dashboard y varias páginas; normalizar CTA en el resto.
- **Error:** reintento es común; añadir copy contextual que conserve filtros y aporte `requestId` cuando exista.
- **Unauthorized:** `AccessDenied` centralizado con razón de sesión, tenant, suscripción, módulo, rol, permiso o sucursal.
- **Disabled:** hay botones pendientes, pero deben explicar siempre qué dato/permiso falta.

## Tablas auditadas

| Pantalla | Tabla/listado | P1 | P2 | P3 | Mejora |
| --- | --- | --- | --- | --- | --- |
| Candidatos | Aplicaciones | candidato, vacante, etapa, responsable, SLA | fuente, fecha | metadatos | selección/bulk, columnas guardadas |
| Pipeline | Kanban/etapas | candidato, etapa, antigüedad | entrevistador | etiquetas | acción accesible sin drag obligatorio |
| Talent CRM | Candidatos/campañas/duplicados | nombre, relación, actividad | tags/pool | señales | tabs persistentes y bulk |
| Vacantes | Cards | título, estado, ubicación | requisición | historial | vista tabla opcional |
| Inventario | Activos/stock | activo, estado, custodia, ubicación | coste | metadatos | grid y card móvil iguales |
| Admin | entidades | nombre, estado, rol/plan | creado/modificado | IDs | filtros, bulk y detalle lateral |
| Reportes | tablas KPI | dimensión, métrica, periodo | comparación | fuente | columnas responsivas y export contextual |

## Formularios auditados

| Formulario | Campos/pasos | Validaciones visibles | Problema | Mejora |
| --- | --- | --- | --- | --- |
| Vacante | 4+ pasos | Revisión/publicación | Relación requisición/pipeline compleja | Wizard con resumen fijo |
| Postulación | Datos/CV/consentimiento | Requeridos y tipo de archivo | Sin recuperación de borrador | Autoguardado y reanudar |
| Candidato/contratación | Cargo/fecha/template | Restricción de estado | Denso dentro de dialog | Hoja responsive de 2 pasos |
| Onboarding | Muchas funciones en misma vista | Archivo/ciclo de vida | Carga cognitiva extrema | Separar entidades y usar panel de detalle |
| Automatización | Trigger/condiciones/acciones | Orden de ejecución visual | Formulario técnico largo | Wizard con simulación |
| Plan/suscripción/empresa | CRUD administrable | Schema/form library | Modales densos | Panel lateral desktop, pantalla móvil |
| Cámara/zona | Fuente, URL, zona | Solo requerido básico | No verifica fuente ni polígono | Test de conexión y editor visual |
