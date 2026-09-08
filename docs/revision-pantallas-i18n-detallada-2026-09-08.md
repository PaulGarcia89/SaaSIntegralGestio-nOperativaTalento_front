# Revisión detallada de textos de interfaz — ES / EN

Revisión del código de 118 rutas. Se encontraron textos de interfaz escritos directamente en español en 88 rutas y 1953 ubicaciones únicas. Una misma ubicación puede afectar varias rutas.

Esta revisión busca nodos JSX de texto y atributos visibles (títulos, etiquetas, descripciones y ayudas); excluye comentarios y datos de la empresa. No detecta todas las cadenas dinámicas, opciones definidas en constantes, mensajes del servidor, exportaciones o diálogos que necesitan abrirse. Una ruta sin hallazgos no queda certificada como bilingüe. La revisión anterior por expresiones regulares es más amplia, pero también más propensa a falsos positivos.

## Correcciones aplicadas posteriormente

Se conectaron los textos estáticos detectados al idioma activo en Administración, Capacitación, Restaurante, Activos, Personas, ATS, Incorporación y Productividad. Se agregó un catálogo de copia de interfaz con más de 5.000 entradas y un hook reactivo; los contenidos introducidos por la empresa conservan su idioma original. También se adaptaron mensajes del reproductor estricto, avisos de acciones y fechas dentro de componentes.

Validación: TypeScript sin errores; 73 pruebas aprobadas, incluida cobertura de todas las llamadas estáticas a `uiText`; ESLint sin errores (24 advertencias); compilación de producción Docker aprobada. Frontend local reconstruido. La comprobación en Chrome se retomó tras desbloquear macOS. Se verificó el dashboard administrativo en inglés y español y se detectaron casos adicionales en Usuarios, Cursos y Reportes de restaurante: metadatos de tablas, filtros, opciones, contadores y enlaces. Se corrigieron esas ubicaciones y se amplió la migración a otros 46 archivos (176 ubicaciones). Las pruebas ampliadas suman 75 casos aprobados; TypeScript y ESLint siguen sin errores (24 advertencias).

Los hallazgos siguientes conservan el inventario previo a la corrección; sus números de línea son históricos. Esta validación de código no certifica todos los estados dinámicos: constantes de opciones, formatos en funciones auxiliares, mensajes del servidor y exportaciones requieren revisión adicional.

## Hallazgos confirmados y orden de corrección

| Prioridad | Área | Evidencia y trabajo necesario |
|---|---|---|
| Alta | Capacitación | `training/course-player.tsx:304,449,621` contiene avisos fijos. `strict-video-lesson.tsx` fija los mensajes de reproducción y avance. Traducir también evaluación, finalización, reintentos y certificados, preservando títulos y contenidos creados por la empresa. |
| Alta | Restaurante | `restaurant-reports-workspace.tsx:24` fija título, filtros, botones y errores. Las rutas comparten la misma estructura, por eso un arreglo debe aplicarse en los componentes comunes. |
| Alta | Activos | `inventory/assets-module-dashboard.tsx:83,119,170` fija títulos, indicadores y operaciones. Revisar altas, entregas, devoluciones, mantenimiento y sus diálogos. |
| Alta | Administración | `admin/users/page.tsx:174,227,287` y `admin/roles/page.tsx:213,237,493` mantienen avisos de acceso, búsqueda y permisos en español. Priorizar advertencias de acciones sensibles. |
| Media | Personas, ATS, incorporación y productividad | Traducción mezclada con textos fijos en páginas y componentes. Revisar formularios, validaciones, estados y paneles secundarios. |

### Fechas y valores dinámicos

Se confirmó el idioma fijo `es` en `training-learning-hub.tsx:1551`, `training-course-manager.tsx:170`, `training-analytics-dashboard.tsx:170` y `restaurant-stock-control-workspace.tsx:816`. Deben recibir el idioma seleccionado. El idioma del contenido del curso (por ejemplo, un campo `language: "es"`) es un dato diferente y no debe cambiarse junto al idioma de la interfaz.

### Criterio de aceptación por pantalla

- Cambiar ES→EN→ES sin recargar y conservar filtros y datos introducidos.
- Comprobar encabezado, botones, filtros, columnas, paginación, ayudas accesibles y formatos.
- Abrir los diálogos y probar estados vacío, carga, error y confirmación.
- Revisar opciones y mensajes dinámicos, que no están totalmente cubiertos por el escáner JSX.
- No traducir nombres de personas, empresas, sucursales, productos ni contenido escrito por usuarios.

## Resumen completo por ruta

| Ruta | Textos JSX fijos detectados |
|---|---:|
| `/` | 0 |
| `/admin` | 6 |
| `/admin/audit` | 15 |
| `/admin/automations` | 47 |
| `/admin/billing` | 19 |
| `/admin/branches` | 6 |
| `/admin/company` | 20 |
| `/admin/company-registrations` | 17 |
| `/admin/company/career-portal` | 22 |
| `/admin/company/subscription` | 18 |
| `/admin/dashboard` | 0 |
| `/admin/global-users` | 27 |
| `/admin/integrations` | 40 |
| `/admin/modules` | 15 |
| `/admin/plans` | 21 |
| `/admin/queues` | 0 |
| `/admin/roles` | 28 |
| `/admin/settings` | 5 |
| `/admin/subscription` | 36 |
| `/admin/tenants` | 30 |
| `/admin/users` | 27 |
| `/applicant/dashboard` | 0 |
| `/applicant/login` | 0 |
| `/applicant/register` | 0 |
| `/application-resume` | 1 |
| `/application-status` | 0 |
| `/apply` | 7 |
| `/ats` | 0 |
| `/ats/analytics` | 6 |
| `/ats/candidates` | 3 |
| `/ats/candidates/[id]` | 7 |
| `/ats/candidates/[id]/avanzado` | 91 |
| `/ats/candidates/avanzado` | 6 |
| `/ats/communications` | 26 |
| `/ats/dashboard` | 16 |
| `/ats/interviews` | 50 |
| `/ats/pipeline` | 0 |
| `/ats/pipeline/avanzado` | 3 |
| `/ats/scorecards` | 21 |
| `/ats/talent-crm` | 8 |
| `/ats/vacancies` | 2 |
| `/ats/vacancies/[id]/edit` | 2 |
| `/ats/vacancies/new` | 2 |
| `/candidate/interviews/schedule` | 1 |
| `/candidate/portal` | 1 |
| `/candidate/preboarding` | 0 |
| `/candidate/profile` | 2 |
| `/candidate/reset-password` | 0 |
| `/careers` | 0 |
| `/careers/applicant/login` | 1 |
| `/careers/jobs` | 0 |
| `/careers/jobs/[jobSlug]` | 0 |
| `/certificates/verify/[code]` | 6 |
| `/company/[companySlug]/applicant/login` | 1 |
| `/company/[companySlug]/jobs` | 0 |
| `/company/[companySlug]/jobs/[jobSlug]` | 0 |
| `/company/[companySlug]/private-jobs` | 0 |
| `/company/[companySlug]/private-jobs/[jobSlug]` | 0 |
| `/dashboard` | 4 |
| `/employees` | 49 |
| `/employees/[id]` | 50 |
| `/employees/[id]/edit` | 48 |
| `/employees/import` | 48 |
| `/employees/new` | 48 |
| `/forgot-password` | 2 |
| `/hiring` | 16 |
| `/hiring/[id]` | 16 |
| `/hiring/dashboard` | 0 |
| `/inventory` | 8 |
| `/inventory/analytics` | 11 |
| `/inventory/assets` | 31 |
| `/inventory/assets/[...slug]` | 0 |
| `/inventory/assets/dashboard` | 19 |
| `/inventory/audit` | 7 |
| `/inventory/deliveries` | 31 |
| `/inventory/maintenance` | 19 |
| `/inventory/my-assets` | 4 |
| `/inventory/purchases` | 36 |
| `/inventory/restaurant` | 0 |
| `/inventory/restaurant/[...slug]` | 341 |
| `/inventory/restaurant/dashboard` | 341 |
| `/inventory/returns` | 31 |
| `/inventory/scan` | 6 |
| `/inventory/warehouse` | 22 |
| `/jobs` | 0 |
| `/jobs/[jobSlug]` | 0 |
| `/login` | 2 |
| `/notifications` | 3 |
| `/onboarding` | 0 |
| `/onboarding/analytics` | 9 |
| `/onboarding/compliance` | 20 |
| `/onboarding/dashboard` | 20 |
| `/onboarding/documents` | 67 |
| `/onboarding/operations` | 13 |
| `/onboarding/signatures` | 1 |
| `/people` | 0 |
| `/people/dashboard` | 0 |
| `/people/employees` | 0 |
| `/people/employees/[id]` | 0 |
| `/productivity` | 0 |
| `/productivity/cameras` | 26 |
| `/productivity/dashboard` | 28 |
| `/profile` | 7 |
| `/register-company` | 0 |
| `/reports` | 18 |
| `/sign/[token]` | 9 |
| `/training` | 98 |
| `/training/certificates` | 72 |
| `/training/content` | 210 |
| `/training/content/[courseId]` | 210 |
| `/training/content/new` | 210 |
| `/training/dashboard` | 3 |
| `/training/evaluations` | 72 |
| `/training/integrations` | 40 |
| `/training/intelligence` | 21 |
| `/training/learn/[courseId]` | 123 |
| `/training/paths` | 40 |
| `/training/results` | 45 |

## Evidencia por ruta afectada

### /admin

- `src/app/(app)/admin/page.tsx:160`: Administración
- `src/app/(app)/admin/page.tsx:166`: Ver el plan contratado
- `src/app/(app)/admin/page.tsx:173`: Ajustes que afectan a las personas que trabajan dentro.
- `src/app/(app)/admin/page.tsx:180`: Gobierno de la plataforma
- `src/app/(app)/admin/page.tsx:181`: Alcanza a todas las empresas a la vez. Los cambios de aquí afectan a gente de fuera de la tuya.
- `src/app/(app)/admin/page.tsx:189`: Tu rol no tiene ninguna pantalla de administración asignada. Si necesitas alguna, pídesela a quien administra la empresa.

### /admin/audit

- `src/app/(app)/admin/audit/page.tsx:82`: Sin acceso a la auditoría
- `src/app/(app)/admin/audit/page.tsx:98`: Gobierno de la plataforma
- `src/app/(app)/admin/audit/page.tsx:99`: Auditoría
- `src/app/(app)/admin/audit/page.tsx:100`: Qué se hizo, en qué ruta y cuándo, dentro de tu alcance. Los registros no se pueden editar ni borrar desde aquí: es su razón de ser.
- `src/app/(app)/admin/audit/page.tsx:103`: La acción se filtra en el servidor; el texto afina lo que ya está en pantalla.
- `src/app/(app)/admin/audit/page.tsx:106`: Acción
- `src/app/(app)/admin/audit/page.tsx:118`: Afinar esta página
- `src/app/(app)/admin/audit/page.tsx:123`: Ruta, acción o identificador de usuario
- `src/app/(app)/admin/audit/page.tsx:127`: Busca dentro de los
- `src/app/(app)/admin/audit/page.tsx:127`: eventos cargados, no en todo el histórico.
- `src/app/(app)/admin/audit/page.tsx:143`: Quitar los filtros
- `src/app/(app)/admin/audit/page.tsx:150`: Cargando la auditoría
- `src/app/(app)/admin/audit/page.tsx:153`: No fue posible cargar la auditoría
- `src/app/(app)/admin/audit/page.tsx:164`: En esta página
- `src/app/(app)/admin/audit/page.tsx:198`: El texto filtra solo lo cargado. Para buscar en todo el histórico, filtra por acción: eso sí llega al servidor.

### /admin/automations

- `src/app/(app)/admin/automations/page.tsx:111`: Preparando el estudio de automatización
- `src/app/(app)/admin/automations/page.tsx:113`: No fue posible cargar las automatizaciones
- `src/app/(app)/admin/automations/page.tsx:117`: Administración
- `src/app/(app)/admin/automations/page.tsx:117`: Automatización no-code
- `src/app/(app)/admin/automations/page.tsx:117`: Diseña reglas y opera grandes volúmenes con procesamiento durable, lotes y trazabilidad.
- `src/app/(app)/admin/automations/page.tsx:117`: Nueva automatización
- `src/app/(app)/admin/automations/page.tsx:121`: Tasa de éxito
- `src/app/(app)/admin/automations/page.tsx:124`: Procesamiento mediante outbox durable, workers y recuperación automática de eventos bloqueados.
- `src/app/(app)/admin/automations/page.tsx:124`: Sin acumulación pendiente
- `src/app/(app)/admin/automations/page.tsx:124`: Reglas con mayor volumen, últimas 24 h
- `src/app/(app)/admin/automations/page.tsx:124`: Sin ejecuciones en el periodo.
- `src/app/(app)/admin/automations/page.tsx:125`: Plantillas listas para usar
- `src/app/(app)/admin/automations/page.tsx:125`: Crea un borrador desde escenarios habituales, revísalo y simúlalo antes de activarlo. Nunca se ejecuta una plantilla al crearla.
- `src/app/(app)/admin/automations/page.tsx:129`: Buscar reglas por nombre
- `src/app/(app)/admin/automations/page.tsx:132`: Versión
- `src/app/(app)/admin/automations/page.tsx:135`: Crea tu primera automatización
- `src/app/(app)/admin/automations/page.tsx:135`: Conecta eventos reales del sistema con acciones auditables. La regla inicia como borrador para que puedas simularla.
- `src/app/(app)/admin/automations/page.tsx:135`: Crear regla
- `src/app/(app)/admin/automations/page.tsx:137`: Buscar regla, empleado o candidato
- `src/app/(app)/admin/automations/page.tsx:137`: Reintentar (
- `src/app/(app)/admin/automations/page.tsx:137`: Reintentar ejecución
- `src/app/(app)/admin/automations/page.tsx:137`: No hay ejecuciones para estos filtros.
- `src/app/(app)/admin/automations/page.tsx:160`: Construye la secuencia de arriba hacia abajo. Las reglas nuevas se guardan desactivadas.
- `src/app/(app)/admin/automations/page.tsx:161`: Ej. Preparar incorporación al contratar
- `src/app/(app)/admin/automations/page.tsx:163`: Sin condiciones, la regla se ejecuta siempre.
- `src/app/(app)/admin/automations/page.tsx:163`: Condición
- `src/app/(app)/admin/automations/page.tsx:163`: Eliminar condición
- `src/app/(app)/admin/automations/page.tsx:164`: El orden visual es el orden de ejecución.
- `src/app/(app)/admin/automations/page.tsx:164`: Acción
- `src/app/(app)/admin/automations/page.tsx:165`: Simulación segura
- `src/app/(app)/admin/automations/page.tsx:165`: El sistema construirá un evento de prueba con las condiciones configuradas y validará la secuencia sin ejecutar acciones ni modificar datos.
- `src/app/(app)/admin/automations/page.tsx:166`: Cancelar
- `src/app/(app)/admin/automations/page.tsx:171`: Vista del flujo
- `src/app/(app)/admin/automations/page.tsx:171`: Esta es la secuencia que se ejecutará; se actualiza mientras configuras la regla.
- `src/app/(app)/admin/automations/page.tsx:182`: Subir acción
- `src/app/(app)/admin/automations/page.tsx:182`: Bajar acción
- `src/app/(app)/admin/automations/page.tsx:182`: Eliminar acción
- `src/app/(app)/admin/automations/page.tsx:186`: Resultado de la simulación
- `src/app/(app)/admin/automations/page.tsx:186`: Se ejecutaría para cualquier evento.
- `src/app/(app)/admin/automations/page.tsx:190`: Auditoría
- `src/app/(app)/admin/automations/page.tsx:199`: Página
- `src/app/(app)/admin/automations/page.tsx:199`: de
- `src/components/design-system.tsx:50`: Buscar funciones…
- `src/components/ui.tsx:199`: Cargando la pantalla
- `src/components/ui.tsx:213`: Cargando los registros
- `src/components/confirm-action.tsx:104`: Qué cambia
- `src/components/confirm-action.tsx:111`: El movimiento queda en la auditoría. Corregirlo exige registrar otra operación en sentido contrario.

### /admin/billing

- `src/app/(app)/admin/billing/page.tsx:74`: Cargando la facturación
- `src/app/(app)/admin/billing/page.tsx:78`: No fue posible cargar la facturación
- `src/app/(app)/admin/billing/page.tsx:96`: Gobierno de la plataforma
- `src/app/(app)/admin/billing/page.tsx:97`: Facturación
- `src/app/(app)/admin/billing/page.tsx:98`: Plan contratado, quién figura como cliente de facturación y las últimas facturas emitidas.
- `src/app/(app)/admin/billing/page.tsx:103`: Estado del cobro
- `src/app/(app)/admin/billing/page.tsx:105`: Pasarela de cobro
- `src/app/(app)/admin/billing/page.tsx:110`: Facturas sin pagar
- `src/app/(app)/admin/billing/page.tsx:117`: No hay cliente de facturación configurado
- `src/app/(app)/admin/billing/page.tsx:118`: Sin cliente configurado en la pasarela no se pueden emitir facturas ni cobrar renovaciones. Habla con quien administra la plataforma antes de que venza el periodo en curso.
- `src/app/(app)/admin/billing/page.tsx:124`: La suscripción tiene fecha de fin
- `src/app/(app)/admin/billing/page.tsx:125`: Termina el
- `src/app/(app)/admin/billing/page.tsx:125`: . A partir de esa fecha deja de renovarse sola.
- `src/app/(app)/admin/billing/page.tsx:131`: Lo que se emitió y en qué estado quedó cada documento.
- `src/app/(app)/admin/billing/page.tsx:136`: Todavía no hay facturas
- `src/app/(app)/admin/billing/page.tsx:137`: Las facturas aparecerán aquí en cuanto la pasarela emita la primera.
- `src/app/(app)/admin/billing/page.tsx:155`: Emitida el
- `src/app/(app)/admin/billing/page.tsx:174`: Qué cubre el plan
- `src/app/(app)/admin/billing/page.tsx:174`: Módulos incluidos en lo que se está pagando.

### /admin/branches

- `src/components/admin-crud.tsx:135`: Qué desaparece
- `src/components/admin-crud.tsx:140`: Una vez eliminado, no hay forma de recuperarlo desde el producto.
- `src/components/admin-crud.tsx:148`: Cancelar
- `src/hooks/use-unsaved-changes.tsx:51`: Cambios sin guardar
- `src/hooks/use-unsaved-changes.tsx:57`: Hay cambios sin guardar
- `src/hooks/use-unsaved-changes.tsx:57`: Elige qué hacer antes de salir de esta pantalla.

### /admin/company

- `src/app/(app)/admin/company/page.tsx:78`: Configuración
- `src/app/(app)/admin/company/page.tsx:80`: Los ajustes que afectan a toda la empresa: dónde opera, quién entra, cómo se presenta y desde qué dirección envía correo.
- `src/app/(app)/admin/company/page.tsx:83`: Ver el portal de empleo
- `src/app/(app)/admin/company/page.tsx:91`: Sucursales
- `src/app/(app)/admin/company/page.tsx:95`: Ajustes de la empresa
- `src/app/(app)/admin/company/page.tsx:95`: Cada uno abre la pantalla donde se cambia de verdad.
- `src/app/(app)/admin/company/page.tsx:126`: Módulos habilitados
- `src/app/(app)/admin/company/page.tsx:127`: Lo que la empresa tiene contratado y aparece en el menú de su gente.
- `src/app/(app)/admin/company/page.tsx:131`: Esta empresa no tiene ningún módulo habilitado. Quien administra la plataforma puede activarlos.
- `src/app/(app)/admin/company/page.tsx:146`: Desde qué dirección salen las invitaciones, las ofertas y los recordatorios de la empresa.
- `src/app/(app)/admin/company/page.tsx:151`: Si no se configura, el producto envía desde su remitente por defecto y quien recibe el correo no reconoce a la empresa.
- `src/components/company-email-settings.tsx:73`: Correo electrónico de la empresa
- `src/components/company-email-settings.tsx:74`: Configura el SMTP propio de esta empresa. La contraseña se cifra y nunca se muestra en pantalla.
- `src/components/company-email-settings.tsx:77`: Cargando configuración...
- `src/components/company-email-settings.tsx:84`: Contraseña
- `src/components/company-email-settings.tsx:84`: Déjala vacía para conservar la actual.
- `src/components/company-email-settings.tsx:87`: Nombre del remitente
- `src/components/company-email-settings.tsx:90`: Activar este SMTP para los envíos
- `src/components/company-email-settings.tsx:92`: Destinatario de prueba
- `src/components/company-email-settings.tsx:93`: Último intento fallido:

### /admin/company-registrations

- `src/app/(app)/admin/company-registrations/page.tsx:117`: Sin acceso a las solicitudes
- `src/app/(app)/admin/company-registrations/page.tsx:132`: Gobierno de la plataforma
- `src/app/(app)/admin/company-registrations/page.tsx:133`: Solicitudes de empresa
- `src/app/(app)/admin/company-registrations/page.tsx:134`: Revisa cada registro antes de crear la empresa, su suscripción, su sede principal y el acceso de quien la administrará.
- `src/app/(app)/admin/company-registrations/page.tsx:138`: Cargando las solicitudes
- `src/app/(app)/admin/company-registrations/page.tsx:141`: No fue posible cargar las solicitudes
- `src/app/(app)/admin/company-registrations/page.tsx:149`: Pendientes de revisar
- `src/app/(app)/admin/company-registrations/page.tsx:161`: Las altas enviadas desde el registro público aparecerán aquí para que alguien las revise.
- `src/app/(app)/admin/company-registrations/page.tsx:203`: Quien la administrará
- `src/app/(app)/admin/company-registrations/page.tsx:251`: Qué se crea al aprobar
- `src/app/(app)/admin/company-registrations/page.tsx:252`: La empresa, su suscripción de prueba, la sede «
- `src/app/(app)/admin/company-registrations/page.tsx:252`: » y el acceso de
- `src/app/(app)/admin/company-registrations/page.tsx:257`: Qué pasa al rechazar
- `src/app/(app)/admin/company-registrations/page.tsx:258`: La solicitud queda cerrada. Tu observación es lo único que quien la envió va a leer para saber qué corregir antes de volver a intentarlo.
- `src/app/(app)/admin/company-registrations/page.tsx:265`: Observación
- `src/app/(app)/admin/company-registrations/page.tsx:281`: No se pudo guardar la decisión
- `src/app/(app)/admin/company-registrations/page.tsx:288`: Cancelar

### /admin/company/career-portal

- `src/components/career-portal-settings.tsx:49`: Cargando configuración del portal
- `src/components/career-portal-settings.tsx:50`: No pudimos cargar el portal
- `src/components/career-portal-settings.tsx:50`: El backend debe habilitar la configuración de career portals para este tenant.
- `src/components/career-portal-settings.tsx:54`: Administración de talento
- `src/components/career-portal-settings.tsx:54`: Portal de empleos
- `src/components/career-portal-settings.tsx:54`: Configura la experiencia pública o privada de
- `src/components/career-portal-settings.tsx:54`: . El tenant se resuelve por la sesión del administrador y nunca por un `companyId` enviado desde el navegador.
- `src/components/career-portal-settings.tsx:56`: Acceso y publicación
- `src/components/career-portal-settings.tsx:57`: Tipo de portal
- `src/components/career-portal-settings.tsx:57`: Público
- `src/components/career-portal-settings.tsx:57`: Privado estándar
- `src/components/career-portal-settings.tsx:58`: Solo invitación
- `src/components/career-portal-settings.tsx:61`: Prefijo de ruta
- `src/components/career-portal-settings.tsx:63`: Familia tipográfica
- `src/components/career-portal-settings.tsx:63`: Correo de soporte
- `src/components/career-portal-settings.tsx:65`: Título
- `src/components/career-portal-settings.tsx:65`: Subtítulo
- `src/components/career-portal-settings.tsx:65`: Descripción
- `src/components/career-portal-settings.tsx:65`: Texto del pie
- `src/components/career-portal-settings.tsx:66`: Previsualización
- `src/components/career-portal-settings.tsx:67`: No fue posible guardar la configuración.
- `src/components/career-portal-settings.tsx:67`: Configuración guardada.

### /admin/company/subscription

- `src/app/(app)/admin/company/subscription/page.tsx:59`: Sin acceso al plan contratado
- `src/app/(app)/admin/company/subscription/page.tsx:67`: Cargando el plan contratado
- `src/app/(app)/admin/company/subscription/page.tsx:71`: No fue posible cargar el plan contratado
- `src/app/(app)/admin/company/subscription/page.tsx:87`: Qué está contratado, qué se paga, cuándo renueva y qué módulos cubre.
- `src/app/(app)/admin/company/subscription/page.tsx:93`: Esta empresa no tiene ningún plan asignado
- `src/app/(app)/admin/company/subscription/page.tsx:94`: Sin plan no hay renovación ni cobro registrados. Quien administra la plataforma puede asignar uno.
- `src/app/(app)/admin/company/subscription/page.tsx:101`: Estado del cobro
- `src/app/(app)/admin/company/subscription/page.tsx:112`: Próxima renovación
- `src/app/(app)/admin/company/subscription/page.tsx:128`: El último cobro no se completó
- `src/app/(app)/admin/company/subscription/page.tsx:129`: El acceso de tu gente sigue abierto por ahora, pero la empresa puede quedar suspendida si el pago no se regulariza. Desde aquí no se puede pagar: avisa a quien administra la plataforma.
- `src/app/(app)/admin/company/subscription/page.tsx:133`: La empresa está en periodo de prueba
- `src/app/(app)/admin/company/subscription/page.tsx:134`: El acceso termina cuando venza la prueba, el
- `src/app/(app)/admin/company/subscription/page.tsx:134`: . Para continuar hay que contratar un plan con quien administra la plataforma.
- `src/app/(app)/admin/company/subscription/page.tsx:140`: Qué cubre el plan
- `src/app/(app)/admin/company/subscription/page.tsx:141`: Los módulos habilitados son los que aparecen en el menú de las personas de la empresa.
- `src/app/(app)/admin/company/subscription/page.tsx:144`: Configuración de empresa
- `src/app/(app)/admin/company/subscription/page.tsx:150`: No hay ningún módulo habilitado. Quien administra la plataforma puede activarlos.
- `src/app/(app)/admin/company/subscription/page.tsx:168`: sucursales ·

### /admin/global-users

- `src/app/(app)/admin/users/page.tsx:174`: Sin acceso a la gestión de usuarios
- `src/app/(app)/admin/users/page.tsx:192`: Usuarios
- `src/app/(app)/admin/users/page.tsx:214`: Cargando los usuarios
- `src/app/(app)/admin/users/page.tsx:217`: No fue posible cargar los usuarios
- `src/app/(app)/admin/users/page.tsx:227`: Vista de solo lectura
- `src/app/(app)/admin/users/page.tsx:228`: Desde la vista global se consulta, no se modifica. Para crear, editar o eliminar a alguien, entra a su empresa: así el cambio queda registrado dentro del alcance correcto.
- `src/app/(app)/admin/users/page.tsx:257`: Correo electrónico
- `src/app/(app)/admin/users/page.tsx:259`: Es con lo que entra al producto.
- `src/app/(app)/admin/users/page.tsx:271`: Decide qué pantallas ve y qué puede hacer en cada una.
- `src/app/(app)/admin/users/page.tsx:287`: No puedes suspenderte a ti mismo
- `src/app/(app)/admin/users/page.tsx:288`: Quedarías sin poder entrar y sin nadie que pueda revertirlo desde tu propia sesión. Si quieres dejar de administrar, pide a otra persona con permiso de administración que haga el cambio.
- `src/app/(app)/admin/users/page.tsx:292`: Estás quitándote tus propios permisos de administración
- `src/app/(app)/admin/users/page.tsx:293`: Al guardar dejarás de ver esta pantalla y no podrás deshacerlo tú mismo. Asegúrate de que queda otra persona con rol de administración en la empresa.
- `src/app/(app)/admin/users/page.tsx:298`: La sesión que tenga abierta deja de servir en cuanto recargue. Sus datos, su historial y sus asignaciones se conservan intactos: reactivarla le devuelve el acceso tal como estaba.
- `src/app/(app)/admin/users/page.tsx:313`: Cancelar
- `src/app/(app)/admin/users/page.tsx:386`: · tú
- `src/app/(app)/admin/users/page.tsx:459`: Eliminar borra la cuenta. Si solo quieres que deje de entrar por un tiempo, suspéndela: se puede deshacer.
- `src/app/(app)/admin/users/page.tsx:466`: Pierde el acceso de inmediato: la sesión que tenga abierta deja de servir al recargar.
- `src/app/(app)/admin/users/page.tsx:468`: Deja de constar como
- `src/app/(app)/admin/users/page.tsx:470`: Lo que ya registró (vacantes, cursos, movimientos) sigue existiendo y conserva su firma.
- `src/app/(app)/admin/users/page.tsx:471`: Volver a darle acceso exige crear la cuenta otra vez desde cero.
- `src/components/admin-crud.tsx:135`: Qué desaparece
- `src/components/admin-crud.tsx:140`: Una vez eliminado, no hay forma de recuperarlo desde el producto.
- `src/components/admin-crud.tsx:148`: Cancelar
- `src/hooks/use-unsaved-changes.tsx:51`: Cambios sin guardar
- `src/hooks/use-unsaved-changes.tsx:57`: Hay cambios sin guardar
- `src/hooks/use-unsaved-changes.tsx:57`: Elige qué hacer antes de salir de esta pantalla.

### /admin/integrations

- `src/app/(app)/admin/integrations/page.tsx:124`: Sin acceso a la consola de plataforma
- `src/app/(app)/admin/integrations/page.tsx:133`: Consultando el bus y las colas
- `src/app/(app)/admin/integrations/page.tsx:151`: No fue posible cargar la operación del bus
- `src/app/(app)/admin/integrations/page.tsx:169`: Gobierno de plataforma
- `src/app/(app)/admin/integrations/page.tsx:171`: Procesamiento, reintentos, latencia y eventos descartados de toda la plataforma. Vista de solo lectura: desde aquí no se reintenta ni se borra nada.
- `src/app/(app)/admin/integrations/page.tsx:192`: Configurar actualización automática
- `src/app/(app)/admin/integrations/page.tsx:226`: Certificación de integraciones de producción
- `src/app/(app)/admin/integrations/page.tsx:236`: La prueba activa autentica Resend, escribe y elimina un objeto efímero en cada bucket, valida una muestra limpia y EICAR en ClamAV, y comprueba perfiles OAuth sin crear reuniones.
- `src/app/(app)/admin/integrations/page.tsx:252`: Revisando la configuración desplegada...
- `src/app/(app)/admin/integrations/page.tsx:256`: No fue posible inspeccionar las integraciones
- `src/app/(app)/admin/integrations/page.tsx:257`: Verifica que el backend actualizado esté desplegado y que tu rol tenga permisos operativos.
- `src/app/(app)/admin/integrations/page.tsx:316`: R2 privado, cifrado y con retención automática
- `src/app/(app)/admin/integrations/page.tsx:318`: Los archivos se entregan mediante enlaces temporales directos. El sistema elimina objetos vencidos y avisa antes de alcanzar 8 GB de consumo administrado.
- `src/app/(app)/admin/integrations/page.tsx:335`: Calculando uso y retención...
- `src/app/(app)/admin/integrations/page.tsx:339`: No fue posible consultar el almacenamiento
- `src/app/(app)/admin/integrations/page.tsx:340`: Verifica que el backend actualizado esté desplegado y que tu rol tenga permisos operativos.
- `src/app/(app)/admin/integrations/page.tsx:348`: Imágenes
- `src/app/(app)/admin/integrations/page.tsx:364`: · Retención de CV
- `src/app/(app)/admin/integrations/page.tsx:364`: días · Imágenes
- `src/app/(app)/admin/integrations/page.tsx:365`: días ·
- `src/app/(app)/admin/integrations/page.tsx:365`: pendientes de vencer · Actualizado
- `src/app/(app)/admin/integrations/page.tsx:373`: imágenes vencidas.
- `src/app/(app)/admin/integrations/page.tsx:396`: Sin actividad de colas
- `src/app/(app)/admin/integrations/page.tsx:396`: No se registraron despachos durante el periodo seleccionado.
- `src/app/(app)/admin/integrations/page.tsx:415`: Sin eventos por dominio
- `src/app/(app)/admin/integrations/page.tsx:415`: Amplía el periodo para consultar actividad histórica.
- `src/app/(app)/admin/integrations/page.tsx:432`: Sin errores por empresa
- `src/app/(app)/admin/integrations/page.tsx:432`: No hay fallos registrados en el periodo seleccionado.
- `src/app/(app)/admin/integrations/page.tsx:455`: Ningún evento fue descartado
- `src/app/(app)/admin/integrations/page.tsx:456`: Todo lo que entró a la cola acabó procesándose o sigue en reintento.
- `src/app/(app)/admin/integrations/page.tsx:475`: Vista de solo lectura. El backend aún no expone acciones seguras para reintentar o resolver eventos.
- `src/app/(app)/admin/integrations/page.tsx:484`: Para ver el contenido de un evento, sus intentos y su identificador de correlación hace falta una versión del servidor que todavía no está desplegada.
- `src/app/(app)/admin/integrations/page.tsx:490`: No se pueden ver los procesos que consumen la cola
- `src/app/(app)/admin/integrations/page.tsx:491`: Cuántas instancias hay, cuánto procesan y cuándo dieron señal de vida requiere una versión del servidor que todavía no está desplegada.
- `src/app/(app)/admin/integrations/page.tsx:494`: Auditoría operativa
- `src/app/(app)/admin/integrations/page.tsx:497`: No hay auditoría de las acciones sobre la cola
- `src/app/(app)/admin/integrations/page.tsx:498`: Requiere una versión del servidor que todavía no está desplegada. No se muestra nada inventado mientras tanto.
- `src/components/design-system.tsx:50`: Buscar funciones…
- `src/components/ui.tsx:199`: Cargando la pantalla
- `src/components/ui.tsx:213`: Cargando los registros

### /admin/modules

- `src/app/(app)/admin/modules/page.tsx:64`: Sin acceso a los módulos por empresa
- `src/app/(app)/admin/modules/page.tsx:72`: Cargando módulos
- `src/app/(app)/admin/modules/page.tsx:73`: No fue posible cargar los módulos
- `src/app/(app)/admin/modules/page.tsx:78`: Gestión de módulos
- `src/app/(app)/admin/modules/page.tsx:79`: Qué módulos ve cada empresa. Apagar uno lo quita del menú de todas sus personas de inmediato; los datos se conservan.
- `src/app/(app)/admin/modules/page.tsx:99`: No hay módulos visibles
- `src/app/(app)/admin/modules/page.tsx:100`: Ajusta el filtro para revisar las asignaciones disponibles.
- `src/app/(app)/admin/modules/page.tsx:156`: Asignación
- `src/components/admin-crud.tsx:135`: Qué desaparece
- `src/components/admin-crud.tsx:140`: Una vez eliminado, no hay forma de recuperarlo desde el producto.
- `src/components/admin-crud.tsx:148`: Cancelar
- `src/components/confirm-action.tsx:104`: Qué cambia
- `src/components/confirm-action.tsx:111`: El movimiento queda en la auditoría. Corregirlo exige registrar otra operación en sentido contrario.
- `src/components/ui.tsx:199`: Cargando la pantalla
- `src/components/ui.tsx:213`: Cargando los registros

### /admin/plans

- `src/app/(app)/admin/plans/page.tsx:133`: Sin acceso al catálogo de planes
- `src/app/(app)/admin/plans/page.tsx:140`: Cargando catálogo de planes
- `src/app/(app)/admin/plans/page.tsx:142`: No fue posible cargar los planes
- `src/app/(app)/admin/plans/page.tsx:148`: Gobierno de plataforma
- `src/app/(app)/admin/plans/page.tsx:149`: Planes y límites
- `src/app/(app)/admin/plans/page.tsx:150`: Define precios, módulos incluidos y límites operativos. Un valor sin límite se muestra como ilimitado.
- `src/app/(app)/admin/plans/page.tsx:158`: Los cambios afectan nuevas verificaciones de capacidad
- `src/app/(app)/admin/plans/page.tsx:159`: No se eliminan datos existentes automáticamente cuando un límite se reduce. Las operaciones posteriores deben respetar el nuevo máximo.
- `src/app/(app)/admin/plans/page.tsx:183`: Límites operativos
- `src/app/(app)/admin/plans/page.tsx:194`: Módulos incluidos
- `src/app/(app)/admin/plans/page.tsx:198`: Sin módulos incluidos
- `src/app/(app)/admin/plans/page.tsx:239`: Configura el catálogo comercial y los límites verificables del servicio.
- `src/app/(app)/admin/plans/page.tsx:244`: Nivel del plan
- `src/app/(app)/admin/plans/page.tsx:258`: Descripción
- `src/app/(app)/admin/plans/page.tsx:260`: Límites
- `src/app/(app)/admin/plans/page.tsx:276`: Módulos incluidos
- `src/app/(app)/admin/plans/page.tsx:296`: No fue posible guardar
- `src/app/(app)/admin/plans/page.tsx:298`: Cancelar
- `src/components/design-system.tsx:50`: Buscar funciones…
- `src/components/confirm-action.tsx:104`: Qué cambia
- `src/components/confirm-action.tsx:111`: El movimiento queda en la auditoría. Corregirlo exige registrar otra operación en sentido contrario.

### /admin/roles

- `src/app/(app)/admin/roles/page.tsx:164`: Sin acceso a roles y permisos
- `src/app/(app)/admin/roles/page.tsx:214`: Qué puede hacer cada persona. Un cambio aquí afecta a todo el mundo que tenga ese rol.
- `src/app/(app)/admin/roles/page.tsx:230`: Buscar por rol, alcance o permiso
- `src/app/(app)/admin/roles/page.tsx:237`: Buscar por rol, alcance o permiso
- `src/app/(app)/admin/roles/page.tsx:244`: No fue posible cargar los roles
- `src/app/(app)/admin/roles/page.tsx:254`: Roles de la empresa
- `src/app/(app)/admin/roles/page.tsx:261`: Crear el primer rol
- `src/app/(app)/admin/roles/page.tsx:296`: El rol deja de existir y de poder asignarse.
- `src/app/(app)/admin/roles/page.tsx:303`: asignado y perderán de golpe todo lo que este rol les permitía. Asígnales otro rol antes de eliminarlo.
- `src/app/(app)/admin/roles/page.tsx:493`: Faltan permisos de acceso
- `src/app/(app)/admin/roles/page.tsx:505`: Añadir los que faltan
- `src/app/(app)/admin/roles/page.tsx:515`: No se pudo guardar
- `src/app/(app)/admin/roles/page.tsx:541`: Entiendo que si este es mi rol perderé el acceso a esta pantalla y necesitaré que otra persona me lo devuelva.
- `src/app/(app)/admin/roles/page.tsx:551`: Nombre del rol
- `src/app/(app)/admin/roles/page.tsx:555`: Encargado de almacén
- `src/app/(app)/admin/roles/page.tsx:584`: este rol. El recuento lo lleva el servidor.
- `src/app/(app)/admin/roles/page.tsx:599`: Buscar permiso
- `src/app/(app)/admin/roles/page.tsx:606`: Buscar: contratar, inventario, publicar…
- `src/app/(app)/admin/roles/page.tsx:612`: Ningún permiso coincide con «
- `src/app/(app)/admin/roles/page.tsx:630`: de
- `src/app/(app)/admin/roles/page.tsx:692`: Cancelar
- `src/app/(app)/admin/roles/page.tsx:701`: Revisar el impacto
- `src/components/admin-crud.tsx:135`: Qué desaparece
- `src/components/admin-crud.tsx:140`: Una vez eliminado, no hay forma de recuperarlo desde el producto.
- `src/components/admin-crud.tsx:148`: Cancelar
- `src/hooks/use-unsaved-changes.tsx:51`: Cambios sin guardar
- `src/hooks/use-unsaved-changes.tsx:57`: Hay cambios sin guardar
- `src/hooks/use-unsaved-changes.tsx:57`: Elige qué hacer antes de salir de esta pantalla.

### /admin/settings

- `src/app/(app)/admin/settings/page.tsx:2`: Configuración general
- `src/app/(app)/admin/settings/page.tsx:2`: Parámetros globales, políticas operativas y configuración transversal del SaaS.
- `src/components/capability-page.tsx:5`: Integración pendiente
- `src/components/capability-page.tsx:5`: La navegación y el acceso ya están aplicados. Los registros aparecerán cuando el servicio entregue la información; esta vista no genera datos simulados.
- `src/components/design-system.tsx:50`: Buscar funciones…

### /admin/subscription

- `src/app/(app)/admin/subscription/page.tsx:219`: Sin acceso a las suscripciones
- `src/app/(app)/admin/subscription/page.tsx:251`: Gobierno de la plataforma
- `src/app/(app)/admin/subscription/page.tsx:253`: Plan, ciclo de cobro, precio y fecha de renovación de cada empresa. El precio que se guarda es el del catálogo del plan elegido.
- `src/app/(app)/admin/subscription/page.tsx:254`: Nueva suscripción
- `src/app/(app)/admin/subscription/page.tsx:258`: Cargando las suscripciones
- `src/app/(app)/admin/subscription/page.tsx:261`: No fue posible cargar las suscripciones
- `src/app/(app)/admin/subscription/page.tsx:277`: Al día
- `src/app/(app)/admin/subscription/page.tsx:282`: Con pago vencido
- `src/app/(app)/admin/subscription/page.tsx:288`: Empresas sin suscripción
- `src/app/(app)/admin/subscription/page.tsx:301`: El precio lo fija el catálogo del plan y del ciclo elegidos: no se escribe a mano.
- `src/app/(app)/admin/subscription/page.tsx:312`: Selecciona la empresa
- `src/app/(app)/admin/subscription/page.tsx:319`: sucursales ·
- `src/app/(app)/admin/subscription/page.tsx:334`: Ciclo de cobro
- `src/app/(app)/admin/subscription/page.tsx:342`: Estado del cobro
- `src/app/(app)/admin/subscription/page.tsx:355`: Precio que se cobrará
- `src/app/(app)/admin/subscription/page.tsx:363`: Sale del catálogo: plan
- `src/app/(app)/admin/subscription/page.tsx:364`: . Es exactamente el importe que se guarda.
- `src/app/(app)/admin/subscription/page.tsx:370`: Fecha de renovación
- `src/app/(app)/admin/subscription/page.tsx:389`: Marcar el pago como vencido no corta el acceso
- `src/app/(app)/admin/subscription/page.tsx:390`: La empresa sigue entrando con normalidad. Para cortar el acceso hay que suspenderla desde la pantalla de empresas: son dos decisiones distintas y se toman por separado a propósito.
- `src/app/(app)/admin/subscription/page.tsx:405`: Cancelar
- `src/app/(app)/admin/subscription/page.tsx:556`: Próxima renovación
- `src/app/(app)/admin/subscription/page.tsx:562`: Estado de la empresa
- `src/app/(app)/admin/subscription/page.tsx:570`: sucursales ·
- `src/app/(app)/admin/subscription/page.tsx:577`: Módulos habilitados en la empresa
- `src/app/(app)/admin/subscription/page.tsx:602`: La empresa se queda sin plan registrado. Su gente sigue entrando: cortar el acceso es otra decisión, y se toma desde la pantalla de empresas.
- `src/app/(app)/admin/subscription/page.tsx:610`: Deja de constar el plan
- `src/app/(app)/admin/subscription/page.tsx:613`: Se pierde la renovación pactada para el
- `src/app/(app)/admin/subscription/page.tsx:615`: aparecerá como «Sin registro» hasta que se le cree otra suscripción.
- `src/app/(app)/admin/subscription/page.tsx:618`: El acceso de sus
- `src/components/admin-crud.tsx:135`: Qué desaparece
- `src/components/admin-crud.tsx:140`: Una vez eliminado, no hay forma de recuperarlo desde el producto.
- `src/components/admin-crud.tsx:148`: Cancelar
- `src/hooks/use-unsaved-changes.tsx:51`: Cambios sin guardar
- `src/hooks/use-unsaved-changes.tsx:57`: Hay cambios sin guardar
- `src/hooks/use-unsaved-changes.tsx:57`: Elige qué hacer antes de salir de esta pantalla.

### /admin/tenants

- `src/app/(app)/admin/tenants/page.tsx:265`: Sin acceso a las empresas
- `src/app/(app)/admin/tenants/page.tsx:316`: Sin registro
- `src/app/(app)/admin/tenants/page.tsx:352`: Gobierno de la plataforma
- `src/app/(app)/admin/tenants/page.tsx:354`: Alta, edición y control operativo de las empresas suscritas. Suspender o eliminar una afecta a todas las personas que trabajan dentro.
- `src/app/(app)/admin/tenants/page.tsx:371`: Cargando las empresas
- `src/app/(app)/admin/tenants/page.tsx:374`: No fue posible cargar las empresas
- `src/app/(app)/admin/tenants/page.tsx:395`: Con pago vencido
- `src/app/(app)/admin/tenants/page.tsx:423`: Nombre de la empresa
- `src/app/(app)/admin/tenants/page.tsx:430`: Identificador en la dirección web
- `src/app/(app)/admin/tenants/page.tsx:433`: Es lo que aparece en el enlace del portal público. Cambiarlo rompe los enlaces ya compartidos.
- `src/app/(app)/admin/tenants/page.tsx:460`: Correo de soporte
- `src/app/(app)/admin/tenants/page.tsx:467`: Color de marca
- `src/app/(app)/admin/tenants/page.tsx:471`: Elegir el color de marca
- `src/app/(app)/admin/tenants/page.tsx:485`: Módulos habilitados
- `src/app/(app)/admin/tenants/page.tsx:487`: Un módulo apagado desaparece del menú de todas las personas de la empresa. Los datos se conservan y vuelven a estar accesibles si se rehabilita.
- `src/app/(app)/admin/tenants/page.tsx:548`: Cancelar
- `src/app/(app)/admin/tenants/page.tsx:641`: Suscripción
- `src/app/(app)/admin/tenants/page.tsx:658`: Próxima renovación
- `src/app/(app)/admin/tenants/page.tsx:666`: Sucursales
- `src/app/(app)/admin/tenants/page.tsx:679`: módulos habilitados
- `src/app/(app)/admin/tenants/page.tsx:704`: El borrado arrastra todo lo que cuelga de esta empresa. No hay papelera ni forma de recuperarlo.
- `src/app/(app)/admin/tenants/page.tsx:712`: con su configuración.
- `src/app/(app)/admin/tenants/page.tsx:716`: y sus accesos: dejarán de poder entrar de inmediato.
- `src/app/(app)/admin/tenants/page.tsx:719`: módulos asignados y los datos registrados dentro de ellos.
- `src/components/admin-crud.tsx:135`: Qué desaparece
- `src/components/admin-crud.tsx:140`: Una vez eliminado, no hay forma de recuperarlo desde el producto.
- `src/components/admin-crud.tsx:148`: Cancelar
- `src/hooks/use-unsaved-changes.tsx:51`: Cambios sin guardar
- `src/hooks/use-unsaved-changes.tsx:57`: Hay cambios sin guardar
- `src/hooks/use-unsaved-changes.tsx:57`: Elige qué hacer antes de salir de esta pantalla.

### /admin/users

- `src/app/(app)/admin/users/page.tsx:174`: Sin acceso a la gestión de usuarios
- `src/app/(app)/admin/users/page.tsx:192`: Usuarios
- `src/app/(app)/admin/users/page.tsx:214`: Cargando los usuarios
- `src/app/(app)/admin/users/page.tsx:217`: No fue posible cargar los usuarios
- `src/app/(app)/admin/users/page.tsx:227`: Vista de solo lectura
- `src/app/(app)/admin/users/page.tsx:228`: Desde la vista global se consulta, no se modifica. Para crear, editar o eliminar a alguien, entra a su empresa: así el cambio queda registrado dentro del alcance correcto.
- `src/app/(app)/admin/users/page.tsx:257`: Correo electrónico
- `src/app/(app)/admin/users/page.tsx:259`: Es con lo que entra al producto.
- `src/app/(app)/admin/users/page.tsx:271`: Decide qué pantallas ve y qué puede hacer en cada una.
- `src/app/(app)/admin/users/page.tsx:287`: No puedes suspenderte a ti mismo
- `src/app/(app)/admin/users/page.tsx:288`: Quedarías sin poder entrar y sin nadie que pueda revertirlo desde tu propia sesión. Si quieres dejar de administrar, pide a otra persona con permiso de administración que haga el cambio.
- `src/app/(app)/admin/users/page.tsx:292`: Estás quitándote tus propios permisos de administración
- `src/app/(app)/admin/users/page.tsx:293`: Al guardar dejarás de ver esta pantalla y no podrás deshacerlo tú mismo. Asegúrate de que queda otra persona con rol de administración en la empresa.
- `src/app/(app)/admin/users/page.tsx:298`: La sesión que tenga abierta deja de servir en cuanto recargue. Sus datos, su historial y sus asignaciones se conservan intactos: reactivarla le devuelve el acceso tal como estaba.
- `src/app/(app)/admin/users/page.tsx:313`: Cancelar
- `src/app/(app)/admin/users/page.tsx:386`: · tú
- `src/app/(app)/admin/users/page.tsx:459`: Eliminar borra la cuenta. Si solo quieres que deje de entrar por un tiempo, suspéndela: se puede deshacer.
- `src/app/(app)/admin/users/page.tsx:466`: Pierde el acceso de inmediato: la sesión que tenga abierta deja de servir al recargar.
- `src/app/(app)/admin/users/page.tsx:468`: Deja de constar como
- `src/app/(app)/admin/users/page.tsx:470`: Lo que ya registró (vacantes, cursos, movimientos) sigue existiendo y conserva su firma.
- `src/app/(app)/admin/users/page.tsx:471`: Volver a darle acceso exige crear la cuenta otra vez desde cero.
- `src/components/admin-crud.tsx:135`: Qué desaparece
- `src/components/admin-crud.tsx:140`: Una vez eliminado, no hay forma de recuperarlo desde el producto.
- `src/components/admin-crud.tsx:148`: Cancelar
- `src/hooks/use-unsaved-changes.tsx:51`: Cambios sin guardar
- `src/hooks/use-unsaved-changes.tsx:57`: Hay cambios sin guardar
- `src/hooks/use-unsaved-changes.tsx:57`: Elige qué hacer antes de salir de esta pantalla.

### /application-resume

- `src/app/application-resume/page.tsx:32`: Preparando reanudación

### /apply

- `src/app/apply/page.tsx:225`: a verificar lo que escribiste aquí, y autorizas a tus empleadores anteriores y a las personas que indiques a darnos información sobre tu trabajo, tu preparación y tu idoneidad para el puesto.
- `src/app/apply/page.tsx:225`: , a tus empleadores anteriores y a las personas consultadas de cualquier responsabilidad por habérnosla dado.
- `src/app/apply/page.tsx:225`: a ofrecerte uno, y el empleo puede terminarse en cualquier momento.
- `src/app/apply/page.tsx:225`: He leído lo anterior, confirmo que lo que escribí es cierto y autorizo que
- `src/app/apply/page.tsx:225`: use mis datos para este proceso.
- `src/app/apply/page.tsx:227`: Consulta el estado de esta postulación y revisa aquí las próximas entrevistas o mensajes de
- `src/app/apply/page.tsx:318`: Añadir tu experiencia y referencias

### /ats/analytics

- `src/app/(app)/ats/analytics/page.tsx:71`: días
- `src/app/(app)/ats/analytics/page.tsx:104`: Evolución
- `src/app/(app)/ats/analytics/page.tsx:104`: de nuevas postulaciones.
- `src/app/(app)/ats/analytics/page.tsx:136`: borrador(es) pausados sin reanudación. Revisa claridad, longitud y campos obligatorios de las vacantes con mayor volumen.
- `src/app/(app)/ats/analytics/page.tsx:146`: pérdidas
- `src/components/design-system.tsx:50`: Buscar funciones…

### /ats/candidates

- `src/components/recruitment/people-workspace.tsx:403`: Estas pantallas son más densas y están pensadas para quien ya conoce el sistema. Nada de lo que había se perdió: sigue aquí.
- `src/components/simple/reason-dialog.tsx:50`: ¿Por qué?
- `src/components/simple/reason-dialog.tsx:64`: Cuéntanos un poco más

### /ats/candidates/[id]

- `src/components/recruitment/person-profile.tsx:187`: Se postuló para
- `src/components/recruitment/person-profile.tsx:202`: salió del proceso. Su expediente se conserva y sigue apareciendo en la fase «
- `src/components/recruitment/person-profile.tsx:252`: Ver el currículum de
- `src/components/recruitment/person-profile.tsx:330`: Cómo llegó hasta aquí
- `src/components/recruitment/person-profile.tsx:402`: La ficha completa tiene todo lo anterior más las evaluaciones de entrevista, el comité de decisión, el gestor de ofertas y la agenda. Nada se perdió: sigue ahí.
- `src/components/simple/reason-dialog.tsx:50`: ¿Por qué?
- `src/components/simple/reason-dialog.tsx:64`: Cuéntanos un poco más

### /ats/candidates/[id]/avanzado

- `src/app/(app)/ats/candidates/[id]/avanzado/page.tsx:117`: El empleado fue creado y la incorporación se activó automáticamente. Flujo:
- `src/app/(app)/ats/candidates/[id]/avanzado/page.tsx:121`: La contratación quedó registrada sin estados parciales. Se generaron
- `src/app/(app)/ats/candidates/[id]/avanzado/page.tsx:121`: tareas de incorporación y la solicitud de inventario quedó pendiente.
- `src/app/(app)/ats/candidates/[id]/avanzado/page.tsx:132`: La entrevista de
- `src/app/(app)/ats/candidates/[id]/avanzado/page.tsx:132`: necesita una recomendación y resultado.
- `src/app/(app)/ats/candidates/[id]/avanzado/page.tsx:133`: . Al terminar, registra la evaluación desde esta misma sección.
- `src/app/(app)/ats/candidates/[id]/avanzado/page.tsx:208`: Consenso de evaluadores ·
- `src/app/(app)/ats/candidates/[id]/avanzado/page.tsx:208`: evaluación(es) firmada(s) comparables.
- `src/app/(app)/ats/candidates/[id]/avanzado/page.tsx:239`: Abrir reunión
- `src/app/(app)/ats/candidates/[id]/avanzado/page.tsx:265`: Reintentar
- `src/components/decision-committee-card.tsx:46`: Comité de decisión
- `src/components/decision-committee-card.tsx:47`: Consultando comité…
- `src/components/decision-committee-card.tsx:48`: Forma un panel para separar evaluación individual y decisión final, con quórum obligatorio.
- `src/components/decision-committee-card.tsx:48`: Preside el comité
- `src/components/decision-committee-card.tsx:48`: Crear comité
- `src/components/decision-committee-card.tsx:48`: Aún no se ha formado un comité.
- `src/components/decision-committee-card.tsx:49`: votos para quórum
- `src/components/decision-committee-card.tsx:49`: Justificación
- `src/components/decision-committee-card.tsx:49`: Declaro que revisé posibles conflictos de interés.
- `src/components/decision-committee-card.tsx:49`: Cerrar decisión
- `src/components/decision-committee-card.tsx:49`: Puedes consultar el comité; solo sus miembros registran voto.
- `src/components/decision-committee-card.tsx:50`: No fue posible completar la operación
- `src/components/decision-committee-card.tsx:55`: Recomendación
- `src/components/decision-committee-card.tsx:55`: Avanzar con alta confianza
- `src/components/design-system.tsx:50`: Buscar funciones…
- `src/components/job-offer-manager.tsx:90`: Compensación, PDF, firma y conversión en un solo expediente.
- `src/components/job-offer-manager.tsx:93`: Sin oferta preparada
- `src/components/job-offer-manager.tsx:93`: Crea la oferta directamente y envíala a firma cuando esté lista.
- `src/components/job-offer-manager.tsx:95`: No fue posible completar la operación
- `src/components/job-offer-manager.tsx:102`: · versión
- `src/components/job-offer-manager.tsx:102`: Creada el
- `src/components/job-offer-manager.tsx:103`: Compensación
- `src/components/job-offer-manager.tsx:105`: Contrapropuesta del candidato
- `src/components/job-offer-manager.tsx:107`: Conversión completada
- `src/components/job-offer-manager.tsx:107`: La aceptación creó automáticamente el flujo de contratación
- `src/components/job-offer-manager.tsx:107`: Aceptada, conversión pendiente
- `src/components/job-offer-manager.tsx:108`: Reintentar conversión
- `src/components/job-offer-manager.tsx:108`: Nueva versión
- `src/components/job-offer-manager.tsx:108`: Cancelar oferta
- `src/components/job-offer-manager.tsx:115`: Fecha de ingreso
- `src/components/job-offer-manager.tsx:115`: Beneficios, uno por línea
- `src/components/job-offer-manager.tsx:115`: Mensaje para el candidato
- `src/components/job-offer-manager.tsx:115`: La oferta será creada directamente por un usuario administrador y quedará lista para enviarse a firma.
- `src/components/job-offer-manager.tsx:115`: Cancelar
- `src/components/scorecard-dialog.tsx:30`: Ficha de evaluación estructurada
- `src/components/scorecard-dialog.tsx:30`: Evalúa evidencia observable. La puntuación se calcula por peso y la firma bloquea cambios posteriores.
- `src/components/scorecard-dialog.tsx:31`: Preparando criterios y evaluación…
- `src/components/scorecard-dialog.tsx:32`: No fue posible cargar la ficha de evaluación
- `src/components/scorecard-dialog.tsx:86`: Evaluación firmada e inmutable
- `src/components/scorecard-dialog.tsx:86`: Firmada el
- `src/components/scorecard-dialog.tsx:86`: . Crea una nueva entrevista si se requiere otra evaluación.
- `src/components/scorecard-dialog.tsx:99`: Sí
- `src/components/scorecard-dialog.tsx:104`: Puntuación ponderada
- `src/components/scorecard-dialog.tsx:105`: Esta entrevista usa la ficha de evaluación general heredada.
- `src/components/scorecard-dialog.tsx:105`: para habilitar pesos y competencias.
- `src/components/scorecard-dialog.tsx:105`: Calificación general:
- `src/components/scorecard-dialog.tsx:105`: Calificación general
- `src/components/scorecard-dialog.tsx:106`: Recomendación
- `src/components/scorecard-dialog.tsx:109`: No fue posible guardar
- `src/components/scorecard-dialog.tsx:110`: Puedes continuar editando hasta firmarlo.
- `src/components/scorecard-dialog.tsx:111`: Al firmar, la ficha de evaluación y sus respuestas quedan bloqueadas para preservar la auditoría.
- `src/components/scorecard-dialog.tsx:112`: Guardar borrador
- `src/components/scorecard-dialog.tsx:118`: Puntuación
- `src/components/scorecard-dialog.tsx:118`: Recomendación
- `src/components/scorecard-dialog.tsx:124`: Retroalimentación protegida
- `src/components/scorecard-dialog.tsx:124`: La comparación se revelará según la política configurada:
- `src/components/scorecard-dialog.tsx:124`: . Esto evita influencia entre evaluadores antes de cerrar sus respuestas.
- `src/components/scorecard-dialog.tsx:125`: Comparación entre evaluadores
- `src/components/scorecard-dialog.tsx:125`: evaluación(es) firmada(s). Las alertas apoyan revisión humana y no deciden automáticamente.
- `src/components/scorecard-dialog.tsx:125`: Sin señales de revisión automática
- `src/components/scorecard-dialog.tsx:125`: No se detectaron discrepancias amplias, lenguaje sensible ni patrones extremos en las evaluaciones firmadas.
- `src/components/competency-ai-assistant.tsx:24`: Asistente de competencias
- `src/components/competency-ai-assistant.tsx:24`: Versión
- `src/components/competency-ai-assistant.tsx:26`: Asistencia, no decisión automática
- `src/components/competency-ai-assistant.tsx:27`: Cargando evaluación asistida…
- `src/components/competency-ai-assistant.tsx:28`: No fue posible cargar el análisis
- `src/components/competency-ai-assistant.tsx:28`: Reintenta al actualizar el expediente.
- `src/components/competency-ai-assistant.tsx:30`: Genera una lectura explicable usando las competencias configuradas en la vacante y solo las evidencias internas disponibles.
- `src/components/competency-ai-assistant.tsx:30`: Tienes acceso de consulta. Un responsable de selección puede generar la evaluación.
- `src/components/competency-ai-assistant.tsx:31`: No fue posible generar el análisis
- `src/components/competency-ai-assistant.tsx:51`: Revisión humana firmada
- `src/components/competency-ai-assistant.tsx:51`: el
- `src/components/competency-ai-assistant.tsx:51`: . Esta versión es inmutable.
- `src/components/competency-ai-assistant.tsx:51`: Conclusión del reclutador
- `src/components/competency-ai-assistant.tsx:51`: Resume tu validación humana, discrepancias y evidencia adicional.
- `src/components/competency-ai-assistant.tsx:51`: Confirmo que revisé la evidencia y que esta firma no rechaza, aprueba ni cambia de etapa automáticamente al candidato.
- `src/components/competency-ai-assistant.tsx:51`: Confirma cada competencia antes de firmar.
- `src/components/competency-ai-assistant.tsx:57`: No se encontró evidencia textual verificable.
- `src/components/competency-ai-assistant.tsx:57`: Información insuficiente
- `src/components/competency-ai-assistant.tsx:57`: Puntuación humana
- `src/components/competency-ai-assistant.tsx:57`: Observación

### /ats/candidates/avanzado

- `src/components/design-system.tsx:50`: Buscar funciones…
- `src/components/workspace-view-manager.tsx:75`: Aún no hay vistas guardadas para este workspace.
- `src/components/workspace-view-manager.tsx:78`: Nombre de la vista
- `src/components/workspace-view-manager.tsx:79`: Compartir con el workspace
- `src/components/workspace-view-manager.tsx:81`: Guardar configuración
- `src/components/workspace-view-manager.tsx:84`: Importar configuración de vista desde un archivo JSON

### /ats/communications

- `src/components/communication-operations-console.tsx:78`: Sin leer
- `src/components/communication-operations-console.tsx:79`: Sin asociar
- `src/components/communication-operations-console.tsx:86`: Todos los estados
- `src/components/communication-operations-console.tsx:86`: Mías
- `src/components/communication-operations-console.tsx:87`: Sin leer
- `src/components/communication-operations-console.tsx:91`: No fue posible cargar la bandeja
- `src/components/communication-operations-console.tsx:93`: Bandeja vacía
- `src/components/communication-operations-console.tsx:93`: No hay conversaciones para estos filtros.
- `src/components/communication-operations-console.tsx:98`: Abriendo conversación
- `src/components/communication-operations-console.tsx:98`: No fue posible abrir la conversación
- `src/components/communication-operations-console.tsx:120`: Archivar conversación
- `src/components/communication-operations-console.tsx:120`: Sin responsable
- `src/components/communication-operations-console.tsx:120`: Sin responsable
- `src/components/communication-operations-console.tsx:122`: Se enviará únicamente por correo y quedará auditado.
- `src/components/communication-operations-console.tsx:137`: Selecciona un expediente para conservar tenant, sucursal y trazabilidad correctos.
- `src/components/communication-operations-console.tsx:146`: Correos sin asociar
- `src/components/communication-operations-console.tsx:146`: Ningún correo se pierde. Vincúlalo a una postulación o documenta por qué debe ignorarse.
- `src/components/communication-operations-console.tsx:146`: No hay correos pendientes de clasificación.
- `src/components/communication-operations-console.tsx:146`: Buscar candidato o vacante
- `src/components/communication-operations-console.tsx:146`: Motivo para ignorar este correo
- `src/components/communication-operations-console.tsx:146`: Ignorar con motivo
- `src/components/communication-operations-console.tsx:155`: Configura envío y recepción con SPF, DKIM, DMARC y MX en Resend.
- `src/components/communication-operations-console.tsx:155`: Guardar
- `src/components/communication-operations-console.tsx:158`: Selecciona una conversación
- `src/components/communication-operations-console.tsx:158`: Consulta todo el historial, responde y coordina el siguiente paso desde un solo lugar.
- `src/components/design-system.tsx:50`: Buscar funciones…

### /ats/dashboard

- `src/components/hiring/hiring-details.tsx:155`: La contratación se cerrará y no se podrá retomar desde aquí. Tendrás que escribir el motivo.
- `src/components/hiring/hiring-details.tsx:158`: Cancelar contratación
- `src/components/design-system.tsx:50`: Buscar funciones…
- `src/components/hiring/hiring-stage-panels.tsx:229`: te dé su respuesta, regístrala aquí.
- `src/components/hiring/hiring-stage-panels.tsx:233`: Aceptó la oferta
- `src/components/hiring/hiring-stage-panels.tsx:236`: No aceptó la oferta
- `src/components/hiring/hiring-stage-panels.tsx:265`: La oferta se redacta en el perfil de reclutamiento de la persona. Aquí eliges cuál enviar.
- `src/components/hiring/hiring-stage-panels.tsx:278`: Elige la oferta que se enviará
- `src/components/hiring/hiring-stage-panels.tsx:288`: Versión
- `src/components/hiring/hiring-stage-panels.tsx:299`: Primero hay que redactar la oferta en el perfil de reclutamiento. Cuando exista, vuelve aquí para enviarla.
- `src/components/hiring/hiring-stage-panels.tsx:462`: ¿Necesitas otro documento?
- `src/components/hiring/hiring-stage-panels.tsx:475`: Firmas electrónicas
- `src/components/hiring/hiring-stage-panels.tsx:479`: El sistema necesita el expediente del empleado creado para poder enviar los documentos a firma, y ese expediente se crea al confirmar. Primero reúne y aprueba los documentos de arriba.
- `src/components/hiring/hiring-stage-panels.tsx:483`: verá el documento en su lista de pendientes.
- `src/components/hiring/hiring-stage-panels.tsx:580`: Tu perfil permite revisar esta contratación, pero no cerrarla. Pídeselo a la persona responsable de recursos humanos.
- `src/components/hiring/hiring-stage-panels.tsx:682`: Cancelada el

### /ats/interviews

- `src/components/confirm-action.tsx:104`: Qué cambia
- `src/components/confirm-action.tsx:111`: El movimiento queda en la auditoría. Corregirlo exige registrar otra operación en sentido contrario.
- `src/components/design-system.tsx:50`: Buscar funciones…
- `src/components/interview-coordination-console.tsx:34`: Centro de coordinación
- `src/components/interview-coordination-console.tsx:34`: Grupos, carga, preparación de entrevistadores, salas y pendientes operativos.
- `src/components/interview-coordination-console.tsx:34`: Atención del coordinador
- `src/components/interview-coordination-console.tsx:35`: Preparación y límites
- `src/components/interview-coordination-console.tsx:35`: sesiones de observación
- `src/components/interview-coordination-console.tsx:35`: Sin iniciar
- `src/components/interview-coordination-console.tsx:35`: En formación
- `src/components/interview-coordination-console.tsx:35`: Observación
- `src/components/interview-coordination-console.tsx:35`: /día
- `src/components/interview-coordination-console.tsx:36`: Crear grupo de entrevistadores
- `src/components/interview-coordination-console.tsx:36`: El orden define prioridad para sustituciones automáticas.
- `src/components/interview-coordination-console.tsx:36`: Nombre del grupo
- `src/components/interview-coordination-console.tsx:36`: Crear grupo
- `src/components/interview-coordination-console.tsx:37`: Crear sala o recurso
- `src/components/interview-coordination-console.tsx:37`: Las reservas se validarán contra cruces de horario.
- `src/components/interview-coordination-console.tsx:37`: Sala física
- `src/components/interview-coordination-console.tsx:37`: Sala de video
- `src/components/interview-coordination-console.tsx:37`: Apoyo de accesibilidad
- `src/components/interview-coordination-console.tsx:37`: Ubicación
- `src/components/interview-coordination-console.tsx:37`: Crear recurso
- `src/components/scorecard-dialog.tsx:30`: Ficha de evaluación estructurada
- `src/components/scorecard-dialog.tsx:30`: Evalúa evidencia observable. La puntuación se calcula por peso y la firma bloquea cambios posteriores.
- `src/components/scorecard-dialog.tsx:31`: Preparando criterios y evaluación…
- `src/components/scorecard-dialog.tsx:32`: No fue posible cargar la ficha de evaluación
- `src/components/scorecard-dialog.tsx:86`: Evaluación firmada e inmutable
- `src/components/scorecard-dialog.tsx:86`: Firmada el
- `src/components/scorecard-dialog.tsx:86`: . Crea una nueva entrevista si se requiere otra evaluación.
- `src/components/scorecard-dialog.tsx:99`: Sí
- `src/components/scorecard-dialog.tsx:104`: Puntuación ponderada
- `src/components/scorecard-dialog.tsx:105`: Esta entrevista usa la ficha de evaluación general heredada.
- `src/components/scorecard-dialog.tsx:105`: para habilitar pesos y competencias.
- `src/components/scorecard-dialog.tsx:105`: Calificación general:
- `src/components/scorecard-dialog.tsx:105`: Calificación general
- `src/components/scorecard-dialog.tsx:106`: Recomendación
- `src/components/scorecard-dialog.tsx:109`: No fue posible guardar
- `src/components/scorecard-dialog.tsx:110`: Puedes continuar editando hasta firmarlo.
- `src/components/scorecard-dialog.tsx:111`: Al firmar, la ficha de evaluación y sus respuestas quedan bloqueadas para preservar la auditoría.
- `src/components/scorecard-dialog.tsx:112`: Guardar borrador
- `src/components/scorecard-dialog.tsx:118`: Puntuación
- `src/components/scorecard-dialog.tsx:118`: Recomendación
- `src/components/scorecard-dialog.tsx:124`: Retroalimentación protegida
- `src/components/scorecard-dialog.tsx:124`: La comparación se revelará según la política configurada:
- `src/components/scorecard-dialog.tsx:124`: . Esto evita influencia entre evaluadores antes de cerrar sus respuestas.
- `src/components/scorecard-dialog.tsx:125`: Comparación entre evaluadores
- `src/components/scorecard-dialog.tsx:125`: evaluación(es) firmada(s). Las alertas apoyan revisión humana y no deciden automáticamente.
- `src/components/scorecard-dialog.tsx:125`: Sin señales de revisión automática
- `src/components/scorecard-dialog.tsx:125`: No se detectaron discrepancias amplias, lenguaje sensible ni patrones extremos en las evaluaciones firmadas.

### /ats/pipeline/avanzado

- `src/components/design-system.tsx:50`: Buscar funciones…
- `src/components/confirm-action.tsx:104`: Qué cambia
- `src/components/confirm-action.tsx:111`: El movimiento queda en la auditoría. Corregirlo exige registrar otra operación en sentido contrario.

### /ats/scorecards

- `src/app/(app)/ats/scorecards/page.tsx:144`: La versión
- `src/app/(app)/ats/scorecards/page.tsx:144`: quedó activa; las versiones anteriores permanecen como historial.
- `src/app/(app)/ats/scorecards/page.tsx:147`: Visibilidad de la retroalimentación:
- `src/components/scorecard-governance-console.tsx:35`: Gobierno y calidad de evaluación
- `src/components/scorecard-governance-console.tsx:35`: Biblioteca compartida, revisión ciega, calibración histórica y controles estadísticos auditables.
- `src/components/scorecard-governance-console.tsx:36`: Biblioteca global de competencias
- `src/components/scorecard-governance-console.tsx:36`: Código
- `src/components/scorecard-governance-console.tsx:36`: Categoría
- `src/components/scorecard-governance-console.tsx:37`: Asignación y revisión anónima
- `src/components/scorecard-governance-console.tsx:37`: Selecciona una entrevista con plantilla.
- `src/components/scorecard-governance-console.tsx:37`: Ocultar identidad hasta que finalicen las evaluaciones
- `src/components/scorecard-governance-console.tsx:37`: Guardar asignación
- `src/components/scorecard-governance-console.tsx:38`: Calibración de evaluadores
- `src/components/scorecard-governance-console.tsx:38`: Calcular últimos 180 días
- `src/components/scorecard-governance-console.tsx:38`: % · desviación
- `src/components/scorecard-governance-console.tsx:38`: Aún no hay una muestra histórica calculada.
- `src/components/scorecard-governance-console.tsx:39`: Validación de indicadores de sesgo
- `src/components/scorecard-governance-console.tsx:39`: Prueba de tasas de selección y significancia sobre datos agregados. No demuestra causalidad ni reemplaza validación independiente.
- `src/components/scorecard-governance-console.tsx:39`: Dimensión analizada
- `src/components/scorecard-governance-console.tsx:39`: Ejecutar análisis
- `src/components/design-system.tsx:50`: Buscar funciones…

### /ats/talent-crm

- `src/app/(app)/ats/talent-crm/page.tsx:135`: . Esta pantalla no envía correos.
- `src/app/(app)/ats/talent-crm/page.tsx:157`: coincidencias para revisión.
- `src/app/(app)/ats/talent-crm/page.tsx:157`: Ninguna se fusiona sola: cada una la confirma una persona.
- `src/app/(app)/ats/talent-crm/page.tsx:157`: ¿Cómo se calcula?
- `src/app/(app)/ats/talent-crm/page.tsx:157`: El puntaje combina teléfono, LinkedIn, CV, nombre, correo y ciudad; los valores compartidos por más de dos perfiles se excluyen.
- `src/app/(app)/ats/talent-crm/page.tsx:177`: Crear etiqueta
- `src/app/(app)/ats/talent-crm/page.tsx:184`: . Conserva el contexto para la próxima interacción.
- `src/components/design-system.tsx:50`: Buscar funciones…

### /ats/vacancies

- `src/app/(app)/ats/vacancies/page.tsx:312`: Crear vacante
- `src/components/design-system.tsx:50`: Buscar funciones…

### /ats/vacancies/[id]/edit

- `src/app/(app)/ats/vacancies/page.tsx:312`: Crear vacante
- `src/components/design-system.tsx:50`: Buscar funciones…

### /ats/vacancies/new

- `src/app/(app)/ats/vacancies/page.tsx:312`: Crear vacante
- `src/components/design-system.tsx:50`: Buscar funciones…

### /candidate/interviews/schedule

- `src/components/design-system.tsx:50`: Buscar funciones…

### /candidate/portal

- `src/components/design-system.tsx:50`: Buscar funciones…

### /candidate/profile

- `src/app/candidate/profile/page.tsx:39`: Español
- `src/components/design-system.tsx:50`: Buscar funciones…

### /careers/applicant/login

- `src/app/careers/applicant/login/page.tsx:9`: Acceso al portal de talento

### /certificates/verify/[code]

- `src/components/training-certificate-verification.tsx:63`: Verificando la credencial
- `src/components/training-certificate-verification.tsx:96`: Certificado de aprendizaje
- `src/components/training-certificate-verification.tsx:117`: Organización
- `src/components/training-certificate-verification.tsx:118`: Número
- `src/components/training-certificate-verification.tsx:119`: Emisión
- `src/components/training-certificate-verification.tsx:131`: Verificación oficial

### /company/[companySlug]/applicant/login

- `src/app/company/[companySlug]/applicant/login/page.tsx:9`: Acceso privado de postulantes

### /dashboard

- `src/app/(app)/dashboard/page.tsx:145`: Tareas, alertas y próximos pasos calculados desde registros reales dentro de tu alcance.
- `src/app/(app)/dashboard/page.tsx:288`: Pendientes agrupados por su fecha límite
- `src/app/(app)/dashboard/page.tsx:298`: Actividad de los últimos 7 días
- `src/app/(app)/dashboard/page.tsx:307`: Tareas y alertas registradas por día

### /employees

- `src/app/(app)/employees/page.tsx:11`: Cargando el directorio
- `src/components/employees-workspace.tsx:195`: No fue posible cargar el directorio
- `src/components/employees-workspace.tsx:262`: Busca, filtra y entra al expediente sin cargar información innecesaria.
- `src/components/employees-workspace.tsx:322`: Buscar
- `src/components/employees-workspace.tsx:342`: Todas las sucursales
- `src/components/employees-workspace.tsx:348`: Por página
- `src/components/employees-workspace.tsx:377`: La vista muestra resultados paginados para mantener la pantalla rápida.
- `src/components/employees-workspace.tsx:382`: empleados seleccionados para acciones masivas.
- `src/components/employees-workspace.tsx:386`: Exportar selección
- `src/components/employees-workspace.tsx:389`: Limpiar selección
- `src/components/employees-workspace.tsx:419`: Filtros de empleados
- `src/components/employees-workspace.tsx:420`: Selecciona un estado, sucursal o búsqueda para reducir resultados.
- `src/components/employees-workspace.tsx:448`: Buscar
- `src/components/employees-workspace.tsx:462`: Todas las sucursales
- `src/components/employees-workspace.tsx:488`: No hay empleados que coincidan con los filtros actuales.
- `src/components/employees-workspace.tsx:497`: No hay más empleados para cargar.
- `src/components/employees-workspace.tsx:503`: Detalle del empleado
- `src/components/employees-workspace.tsx:504`: Historial, documentos y contexto operativo del expediente.
- `src/components/employees-workspace.tsx:506`: Cargando detalle del expediente
- `src/components/employees-workspace.tsx:574`: Se eliminará lógicamente el expediente del directorio y podrás restaurarlo luego.
- `src/components/employees-workspace.tsx:581`: Cancelar
- `src/components/employees-workspace.tsx:689`: Tipo de pago
- `src/components/employees-workspace.tsx:689`: Comisión
- `src/components/employees-workspace.tsx:689`: Frecuencia de pago
- `src/components/employees-workspace.tsx:689`: Método de pago
- `src/components/employees-workspace.tsx:689`: Tarjeta de pago
- `src/components/employees-workspace.tsx:689`: Proveedor de nómina
- `src/components/employees-workspace.tsx:689`: Elegible para overtime
- `src/components/employees-workspace.tsx:690`: Información fiscal protegida
- `src/components/employees-workspace.tsx:690`: El SSN se cifra en el servidor y nunca vuelve a mostrarse completo. No lo incluyas en notas o archivos no protegidos.
- `src/components/employees-workspace.tsx:690`: Documentos del expediente
- `src/components/employees-workspace.tsx:690`: Adjunta fotos o PDF para SSN, W-4, I-9 o Florida New Hire. Se subirán al expediente cuando guardes.
- `src/components/employees-workspace.tsx:691`: Enviar documentos a firma con DocuSeal
- `src/components/employees-workspace.tsx:691`: Selecciona los documentos que deben salir al correo del empleado al terminar el alta. El estado y el PDF firmado volverán al expediente automáticamente.
- `src/components/employees-workspace.tsx:691`: Se enviará a
- `src/components/employees-workspace.tsx:691`: DocuSeal no está configurado todavía. Define la API key y los IDs de las plantillas en el backend.
- `src/components/employees-workspace.tsx:692`: Capacitación, licencias y activos
- `src/components/employees-workspace.tsx:692`: Al crear el expediente, el checklist deja pendientes las capacitaciones obligatorias, licencias profesionales y activos requeridos. Se asignan desde sus módulos especializados.
- `src/components/employees-workspace.tsx:692`: Offer letter, agreement, NDA, handbook y documentos de seguridad se cargan después desde la pestaña Documentos del expediente.
- `src/components/employees-workspace.tsx:692`: Contacto de emergencia
- `src/components/employees-workspace.tsx:692`: Relación
- `src/components/employees-workspace.tsx:692`: Teléfono
- `src/components/employees-workspace.tsx:693`: Revisa antes de crear
- `src/components/employees-workspace.tsx:693`: El backend generará un Employee ID, los perfiles protegidos y el checklist inicial auditable.
- `src/components/employees-workspace.tsx:693`: Nómina
- `src/components/employees-workspace.tsx:728`: Checklist generado automáticamente
- `src/components/employees-workspace.tsx:728`: La creación del empleado registra estos requisitos como pendientes o no requeridos según las opciones elegidas. La evidencia se administra desde el expediente.
- `src/components/employees-workspace.tsx:1254`: Directorio de empleados
- `src/components/design-system.tsx:50`: Buscar funciones…

### /employees/[id]

- `src/components/employee-360.tsx:104`: Preparamos la información laboral y la trazabilidad del empleado.
- `src/components/employee-360.tsx:105`: No fue posible cargar el expediente
- `src/components/employee-360.tsx:127`: sucursales
- `src/components/employee-360.tsx:143`: Nómina
- `src/components/employee-360.tsx:148`: Auditoría
- `src/components/employee-360.tsx:208`: Documento del expediente
- `src/components/employee-360.tsx:209`: Solo el administrador de empresa puede ver o reemplazar el archivo sensible.
- `src/components/employee-360.tsx:218`: Versión
- `src/components/employee-360.tsx:219`: Tamaño
- `src/components/employee-360.tsx:227`: Notas internas del expediente
- `src/components/employee-360.tsx:249`: Solo el administrador de empresa puede ver o reemplazar archivos sensibles.
- `src/components/employee-360.tsx:271`: Sube el archivo asociado al requisito para dejar trazabilidad en el expediente.
- `src/components/employee-360.tsx:282`: Notas internas del expediente
- `src/components/employee-360.tsx:285`: Cancelar
- `src/components/employee-360.tsx:331`: Documentos en el expediente
- `src/components/employee-360.tsx:343`: Cargando nómina
- `src/components/employee-360.tsx:343`: Consultamos la configuración de nómina autorizada.
- `src/components/employee-360.tsx:344`: No fue posible cargar nómina
- `src/components/employee-360.tsx:349`: Configuración de nómina
- `src/components/employee-360.tsx:349`: Tipo de pago
- `src/components/employee-360.tsx:349`: Elegible para horas extra
- `src/components/employee-360.tsx:349`: ID de nómina
- `src/components/employee-360.tsx:349`: Nómina aún no configurada
- `src/components/employee-360.tsx:349`: El expediente está preparado para enlazar una integración de nómina, pero el proveedor aún no ha registrado datos para este empleado.
- `src/components/employee-360.tsx:349`: Información protegida
- `src/components/employee-360.tsx:349`: Las tasas de pago y referencias externas no se solicitan ni se muestran hasta que el backend publique permisos y operaciones específicas de compensación.
- `src/components/employee-360.tsx:365`: El expediente solo muestra valores enmascarados. Las configuraciones y documentos sensibles se gestionan mediante permisos y endpoints específicos.
- `src/components/employee-360.tsx:389`: Consultamos el expediente documental.
- `src/components/employee-360.tsx:395`: Documentos del expediente
- `src/components/employee-360.tsx:415`: Solo el administrador de empresa puede ver o reemplazar archivos sensibles.
- `src/components/employee-360.tsx:416`: Solicitudes de firma DocuSeal
- `src/components/employee-360.tsx:416`: Envía un documento al correo del empleado y guarda el PDF firmado automáticamente al completarse.
- `src/components/employee-360.tsx:416`: DocuSeal aún no está configurado en el backend.
- `src/components/employee-360.tsx:440`: Aún no hay documentos
- `src/components/employee-360.tsx:445`: Requisitos del expediente
- `src/components/employee-360.tsx:472`: Sin permiso de cumplimiento
- `src/components/employee-360.tsx:472`: No cuentas con acceso al cumplimiento de este empleado.
- `src/components/employee-360.tsx:473`: Calculamos el estado del expediente.
- `src/components/employee-360.tsx:474`: Sin datos de cumplimiento
- `src/components/employee-360.tsx:474`: El cumplimiento se habilita cuando exista información disponible para este expediente.
- `src/components/employee-360.tsx:485`: Requisitos del expediente
- `src/components/employee-360.tsx:495`: Código:
- `src/components/employee-360.tsx:511`: Alertas del expediente
- `src/components/employee-360.tsx:517`: Actividad del expediente
- `src/components/employee-360.tsx:517`: Todavía no hay eventos de historial.
- `src/components/employee-360.tsx:521`: Cargando auditoría
- `src/components/employee-360.tsx:522`: No fue posible cargar auditoría
- `src/components/employee-360.tsx:524`: Alertas del expediente
- `src/components/employee-360.tsx:524`: Trazabilidad del expediente
- `src/components/design-system.tsx:50`: Buscar funciones…

### /employees/[id]/edit

- `src/components/employee-edit-page.tsx:118`: Preparamos los datos laborales, nómina y cumplimiento del empleado.
- `src/components/employee-edit-page.tsx:119`: No fue posible cargar el editor
- `src/components/employee-edit-page.tsx:131`: Edición completa y auditable
- `src/components/employee-edit-page.tsx:131`: Cada bloque se guarda en su dominio de backend y genera trazabilidad. SSN y tasas existentes permanecen protegidos; introduce un valor solo cuando quieras reemplazarlo.
- `src/components/employee-edit-page.tsx:134`: Información personal
- `src/components/employee-edit-page.tsx:134`: Identidad legal y datos protegidos del expediente.
- `src/components/employee-edit-page.tsx:139`: Fecha de nacimiento
- `src/components/employee-edit-page.tsx:140`: Número de seguridad social parcial
- `src/components/employee-edit-page.tsx:142`: Canales personales y de trabajo para el expediente.
- `src/components/employee-edit-page.tsx:145`: Teléfono
- `src/components/employee-edit-page.tsx:146`: Dirección
- `src/components/employee-edit-page.tsx:147`: Apartamento / línea 2
- `src/components/employee-edit-page.tsx:151`: País
- `src/components/employee-edit-page.tsx:153`: Información laboral
- `src/components/employee-edit-page.tsx:153`: Cargo, sucursal, supervisor, fechas y estado de la relación laboral.
- `src/components/employee-edit-page.tsx:157`: Sin supervisor
- `src/components/employee-edit-page.tsx:158`: Fecha de contratación
- `src/components/employee-edit-page.tsx:159`: Fecha de inicio
- `src/components/employee-edit-page.tsx:160`: Tipo de empleo
- `src/components/employee-edit-page.tsx:161`: Estado de la relación laboral
- `src/components/employee-edit-page.tsx:162`: Estado del empleado
- `src/components/employee-edit-page.tsx:163`: Clasificación laboral
- `src/components/employee-edit-page.tsx:165`: Nómina
- `src/components/employee-edit-page.tsx:165`: Configuración de pago, frecuencia, overtime y referencia de payroll.
- `src/components/employee-edit-page.tsx:166`: Tipo de pago
- `src/components/employee-edit-page.tsx:168`: Frecuencia de pago
- `src/components/employee-edit-page.tsx:169`: Método de pago
- `src/components/employee-edit-page.tsx:170`: Proveedor de nómina
- `src/components/employee-edit-page.tsx:173`: Inicio de semana laboral
- `src/components/employee-edit-page.tsx:174`: Hora de inicio
- `src/components/employee-edit-page.tsx:175`: Elegible para overtime
- `src/components/employee-edit-page.tsx:177`: W-4, I-9, E-Verify y Florida New Hire para el expediente de Florida.
- `src/components/employee-edit-page.tsx:182`: Primer día de empleo
- `src/components/employee-edit-page.tsx:185`: Reverificación requerida
- `src/components/employee-edit-page.tsx:187`: Fecha límite Florida New Hire
- `src/components/employee-edit-page.tsx:193`: Adjunta foto o PDF para SSN, W-4, I-9 o Florida New Hire. Los archivos quedan preparados para el expediente.
- `src/components/employee-edit-page.tsx:226`: Contacto de emergencia
- `src/components/employee-edit-page.tsx:226`: Información operativa, separada de payroll.
- `src/components/employee-edit-page.tsx:228`: Relación
- `src/components/employee-edit-page.tsx:229`: Teléfono
- `src/components/employee-edit-page.tsx:233`: Firma con DocuSeal
- `src/components/employee-edit-page.tsx:233`: Envía documentos laborales a
- `src/components/employee-edit-page.tsx:233`: y recibe el PDF firmado en el expediente.
- `src/components/employee-edit-page.tsx:233`: DocuSeal no está configurado todavía en el backend.
- `src/components/employee-edit-page.tsx:234`: Los documentos, licencias, capacitación, seguridad y activos se administran desde el expediente, sin perder su trazabilidad.
- `src/components/employee-edit-page.tsx:235`: El checklist aparecerá al crear los requisitos aplicables.
- `src/components/employee-edit-page.tsx:244`: Déjalo vacío para conservar el valor protegido.
- `src/components/design-system.tsx:50`: Buscar funciones…

### /employees/import

- `src/components/employees-workspace.tsx:195`: No fue posible cargar el directorio
- `src/components/employees-workspace.tsx:262`: Busca, filtra y entra al expediente sin cargar información innecesaria.
- `src/components/employees-workspace.tsx:322`: Buscar
- `src/components/employees-workspace.tsx:342`: Todas las sucursales
- `src/components/employees-workspace.tsx:348`: Por página
- `src/components/employees-workspace.tsx:377`: La vista muestra resultados paginados para mantener la pantalla rápida.
- `src/components/employees-workspace.tsx:382`: empleados seleccionados para acciones masivas.
- `src/components/employees-workspace.tsx:386`: Exportar selección
- `src/components/employees-workspace.tsx:389`: Limpiar selección
- `src/components/employees-workspace.tsx:419`: Filtros de empleados
- `src/components/employees-workspace.tsx:420`: Selecciona un estado, sucursal o búsqueda para reducir resultados.
- `src/components/employees-workspace.tsx:448`: Buscar
- `src/components/employees-workspace.tsx:462`: Todas las sucursales
- `src/components/employees-workspace.tsx:488`: No hay empleados que coincidan con los filtros actuales.
- `src/components/employees-workspace.tsx:497`: No hay más empleados para cargar.
- `src/components/employees-workspace.tsx:503`: Detalle del empleado
- `src/components/employees-workspace.tsx:504`: Historial, documentos y contexto operativo del expediente.
- `src/components/employees-workspace.tsx:506`: Cargando detalle del expediente
- `src/components/employees-workspace.tsx:574`: Se eliminará lógicamente el expediente del directorio y podrás restaurarlo luego.
- `src/components/employees-workspace.tsx:581`: Cancelar
- `src/components/employees-workspace.tsx:689`: Tipo de pago
- `src/components/employees-workspace.tsx:689`: Comisión
- `src/components/employees-workspace.tsx:689`: Frecuencia de pago
- `src/components/employees-workspace.tsx:689`: Método de pago
- `src/components/employees-workspace.tsx:689`: Tarjeta de pago
- `src/components/employees-workspace.tsx:689`: Proveedor de nómina
- `src/components/employees-workspace.tsx:689`: Elegible para overtime
- `src/components/employees-workspace.tsx:690`: Información fiscal protegida
- `src/components/employees-workspace.tsx:690`: El SSN se cifra en el servidor y nunca vuelve a mostrarse completo. No lo incluyas en notas o archivos no protegidos.
- `src/components/employees-workspace.tsx:690`: Documentos del expediente
- `src/components/employees-workspace.tsx:690`: Adjunta fotos o PDF para SSN, W-4, I-9 o Florida New Hire. Se subirán al expediente cuando guardes.
- `src/components/employees-workspace.tsx:691`: Enviar documentos a firma con DocuSeal
- `src/components/employees-workspace.tsx:691`: Selecciona los documentos que deben salir al correo del empleado al terminar el alta. El estado y el PDF firmado volverán al expediente automáticamente.
- `src/components/employees-workspace.tsx:691`: Se enviará a
- `src/components/employees-workspace.tsx:691`: DocuSeal no está configurado todavía. Define la API key y los IDs de las plantillas en el backend.
- `src/components/employees-workspace.tsx:692`: Capacitación, licencias y activos
- `src/components/employees-workspace.tsx:692`: Al crear el expediente, el checklist deja pendientes las capacitaciones obligatorias, licencias profesionales y activos requeridos. Se asignan desde sus módulos especializados.
- `src/components/employees-workspace.tsx:692`: Offer letter, agreement, NDA, handbook y documentos de seguridad se cargan después desde la pestaña Documentos del expediente.
- `src/components/employees-workspace.tsx:692`: Contacto de emergencia
- `src/components/employees-workspace.tsx:692`: Relación
- `src/components/employees-workspace.tsx:692`: Teléfono
- `src/components/employees-workspace.tsx:693`: Revisa antes de crear
- `src/components/employees-workspace.tsx:693`: El backend generará un Employee ID, los perfiles protegidos y el checklist inicial auditable.
- `src/components/employees-workspace.tsx:693`: Nómina
- `src/components/employees-workspace.tsx:728`: Checklist generado automáticamente
- `src/components/employees-workspace.tsx:728`: La creación del empleado registra estos requisitos como pendientes o no requeridos según las opciones elegidas. La evidencia se administra desde el expediente.
- `src/components/employees-workspace.tsx:1254`: Directorio de empleados
- `src/components/design-system.tsx:50`: Buscar funciones…

### /employees/new

- `src/components/employees-workspace.tsx:195`: No fue posible cargar el directorio
- `src/components/employees-workspace.tsx:262`: Busca, filtra y entra al expediente sin cargar información innecesaria.
- `src/components/employees-workspace.tsx:322`: Buscar
- `src/components/employees-workspace.tsx:342`: Todas las sucursales
- `src/components/employees-workspace.tsx:348`: Por página
- `src/components/employees-workspace.tsx:377`: La vista muestra resultados paginados para mantener la pantalla rápida.
- `src/components/employees-workspace.tsx:382`: empleados seleccionados para acciones masivas.
- `src/components/employees-workspace.tsx:386`: Exportar selección
- `src/components/employees-workspace.tsx:389`: Limpiar selección
- `src/components/employees-workspace.tsx:419`: Filtros de empleados
- `src/components/employees-workspace.tsx:420`: Selecciona un estado, sucursal o búsqueda para reducir resultados.
- `src/components/employees-workspace.tsx:448`: Buscar
- `src/components/employees-workspace.tsx:462`: Todas las sucursales
- `src/components/employees-workspace.tsx:488`: No hay empleados que coincidan con los filtros actuales.
- `src/components/employees-workspace.tsx:497`: No hay más empleados para cargar.
- `src/components/employees-workspace.tsx:503`: Detalle del empleado
- `src/components/employees-workspace.tsx:504`: Historial, documentos y contexto operativo del expediente.
- `src/components/employees-workspace.tsx:506`: Cargando detalle del expediente
- `src/components/employees-workspace.tsx:574`: Se eliminará lógicamente el expediente del directorio y podrás restaurarlo luego.
- `src/components/employees-workspace.tsx:581`: Cancelar
- `src/components/employees-workspace.tsx:689`: Tipo de pago
- `src/components/employees-workspace.tsx:689`: Comisión
- `src/components/employees-workspace.tsx:689`: Frecuencia de pago
- `src/components/employees-workspace.tsx:689`: Método de pago
- `src/components/employees-workspace.tsx:689`: Tarjeta de pago
- `src/components/employees-workspace.tsx:689`: Proveedor de nómina
- `src/components/employees-workspace.tsx:689`: Elegible para overtime
- `src/components/employees-workspace.tsx:690`: Información fiscal protegida
- `src/components/employees-workspace.tsx:690`: El SSN se cifra en el servidor y nunca vuelve a mostrarse completo. No lo incluyas en notas o archivos no protegidos.
- `src/components/employees-workspace.tsx:690`: Documentos del expediente
- `src/components/employees-workspace.tsx:690`: Adjunta fotos o PDF para SSN, W-4, I-9 o Florida New Hire. Se subirán al expediente cuando guardes.
- `src/components/employees-workspace.tsx:691`: Enviar documentos a firma con DocuSeal
- `src/components/employees-workspace.tsx:691`: Selecciona los documentos que deben salir al correo del empleado al terminar el alta. El estado y el PDF firmado volverán al expediente automáticamente.
- `src/components/employees-workspace.tsx:691`: Se enviará a
- `src/components/employees-workspace.tsx:691`: DocuSeal no está configurado todavía. Define la API key y los IDs de las plantillas en el backend.
- `src/components/employees-workspace.tsx:692`: Capacitación, licencias y activos
- `src/components/employees-workspace.tsx:692`: Al crear el expediente, el checklist deja pendientes las capacitaciones obligatorias, licencias profesionales y activos requeridos. Se asignan desde sus módulos especializados.
- `src/components/employees-workspace.tsx:692`: Offer letter, agreement, NDA, handbook y documentos de seguridad se cargan después desde la pestaña Documentos del expediente.
- `src/components/employees-workspace.tsx:692`: Contacto de emergencia
- `src/components/employees-workspace.tsx:692`: Relación
- `src/components/employees-workspace.tsx:692`: Teléfono
- `src/components/employees-workspace.tsx:693`: Revisa antes de crear
- `src/components/employees-workspace.tsx:693`: El backend generará un Employee ID, los perfiles protegidos y el checklist inicial auditable.
- `src/components/employees-workspace.tsx:693`: Nómina
- `src/components/employees-workspace.tsx:728`: Checklist generado automáticamente
- `src/components/employees-workspace.tsx:728`: La creación del empleado registra estos requisitos como pendientes o no requeridos según las opciones elegidas. La evidencia se administra desde el expediente.
- `src/components/employees-workspace.tsx:1254`: Directorio de empleados
- `src/components/design-system.tsx:50`: Buscar funciones…

### /forgot-password

- `src/components/integration-state.tsx:15`: Modo de prueba local: los datos y acciones de esta sesión no son productivos.
- `src/components/design-system.tsx:50`: Buscar funciones…

### /hiring

- `src/components/hiring/hiring-details.tsx:155`: La contratación se cerrará y no se podrá retomar desde aquí. Tendrás que escribir el motivo.
- `src/components/hiring/hiring-details.tsx:158`: Cancelar contratación
- `src/components/design-system.tsx:50`: Buscar funciones…
- `src/components/hiring/hiring-stage-panels.tsx:229`: te dé su respuesta, regístrala aquí.
- `src/components/hiring/hiring-stage-panels.tsx:233`: Aceptó la oferta
- `src/components/hiring/hiring-stage-panels.tsx:236`: No aceptó la oferta
- `src/components/hiring/hiring-stage-panels.tsx:265`: La oferta se redacta en el perfil de reclutamiento de la persona. Aquí eliges cuál enviar.
- `src/components/hiring/hiring-stage-panels.tsx:278`: Elige la oferta que se enviará
- `src/components/hiring/hiring-stage-panels.tsx:288`: Versión
- `src/components/hiring/hiring-stage-panels.tsx:299`: Primero hay que redactar la oferta en el perfil de reclutamiento. Cuando exista, vuelve aquí para enviarla.
- `src/components/hiring/hiring-stage-panels.tsx:462`: ¿Necesitas otro documento?
- `src/components/hiring/hiring-stage-panels.tsx:475`: Firmas electrónicas
- `src/components/hiring/hiring-stage-panels.tsx:479`: El sistema necesita el expediente del empleado creado para poder enviar los documentos a firma, y ese expediente se crea al confirmar. Primero reúne y aprueba los documentos de arriba.
- `src/components/hiring/hiring-stage-panels.tsx:483`: verá el documento en su lista de pendientes.
- `src/components/hiring/hiring-stage-panels.tsx:580`: Tu perfil permite revisar esta contratación, pero no cerrarla. Pídeselo a la persona responsable de recursos humanos.
- `src/components/hiring/hiring-stage-panels.tsx:682`: Cancelada el

### /hiring/[id]

- `src/components/hiring/hiring-details.tsx:155`: La contratación se cerrará y no se podrá retomar desde aquí. Tendrás que escribir el motivo.
- `src/components/hiring/hiring-details.tsx:158`: Cancelar contratación
- `src/components/design-system.tsx:50`: Buscar funciones…
- `src/components/hiring/hiring-stage-panels.tsx:229`: te dé su respuesta, regístrala aquí.
- `src/components/hiring/hiring-stage-panels.tsx:233`: Aceptó la oferta
- `src/components/hiring/hiring-stage-panels.tsx:236`: No aceptó la oferta
- `src/components/hiring/hiring-stage-panels.tsx:265`: La oferta se redacta en el perfil de reclutamiento de la persona. Aquí eliges cuál enviar.
- `src/components/hiring/hiring-stage-panels.tsx:278`: Elige la oferta que se enviará
- `src/components/hiring/hiring-stage-panels.tsx:288`: Versión
- `src/components/hiring/hiring-stage-panels.tsx:299`: Primero hay que redactar la oferta en el perfil de reclutamiento. Cuando exista, vuelve aquí para enviarla.
- `src/components/hiring/hiring-stage-panels.tsx:462`: ¿Necesitas otro documento?
- `src/components/hiring/hiring-stage-panels.tsx:475`: Firmas electrónicas
- `src/components/hiring/hiring-stage-panels.tsx:479`: El sistema necesita el expediente del empleado creado para poder enviar los documentos a firma, y ese expediente se crea al confirmar. Primero reúne y aprueba los documentos de arriba.
- `src/components/hiring/hiring-stage-panels.tsx:483`: verá el documento en su lista de pendientes.
- `src/components/hiring/hiring-stage-panels.tsx:580`: Tu perfil permite revisar esta contratación, pero no cerrarla. Pídeselo a la persona responsable de recursos humanos.
- `src/components/hiring/hiring-stage-panels.tsx:682`: Cancelada el

### /inventory

- `src/components/inventory-entry.tsx:46`: Inventario
- `src/components/inventory-entry.tsx:47`: Elige con qué inventario vas a trabajar.
- `src/components/inventory-entry.tsx:51`: Cargando los módulos de inventario
- `src/components/inventory-entry.tsx:54`: Falta elegir la empresa
- `src/components/inventory-entry.tsx:61`: Esta empresa no tiene inventario activo
- `src/components/inventory-entry.tsx:71`: Inventario de activos
- `src/components/inventory-entry.tsx:79`: Inventario de restaurante
- `src/components/inventory-entry.tsx:80`: Ingredientes y recetas: entradas, consumo, producción, mermas y conteos.

### /inventory/analytics

- `src/app/(app)/inventory/analytics/page.tsx:41`: Analítica operativa
- `src/app/(app)/inventory/analytics/page.tsx:42`: Inventario en contexto
- `src/app/(app)/inventory/analytics/page.tsx:43`: Disponibilidad, reposición y mantenimiento de la sucursal activa.
- `src/app/(app)/inventory/analytics/page.tsx:48`: Calculando los indicadores del inventario
- `src/app/(app)/inventory/analytics/page.tsx:51`: No fue posible calcular la analítica
- `src/app/(app)/inventory/analytics/page.tsx:64`: Ver el listado
- `src/app/(app)/inventory/analytics/page.tsx:69`: Reposición requerida
- `src/app/(app)/inventory/analytics/page.tsx:75`: Revisar el almacén
- `src/app/(app)/inventory/analytics/page.tsx:83`: Bajo mínimo
- `src/app/(app)/inventory/analytics/page.tsx:89`: Ver qué falta
- `src/app/(app)/inventory/analytics/page.tsx:119`: Ver las órdenes

### /inventory/assets

- `src/app/(app)/inventory/assets/page.tsx:4`: Inventario de activos
- `src/components/inventory-workspace.tsx:250`: Elige un activo disponible y usa «Asignar». La entrega quedará ligada a su expediente de incorporación
- `src/components/inventory-workspace.tsx:255`: La persona no está en esta sucursal
- `src/components/inventory-workspace.tsx:256`: Cambia de sucursal arriba para poder asignarle un activo.
- `src/components/inventory-workspace.tsx:283`: Buscar
- `src/components/inventory-workspace.tsx:287`: Etiqueta, número de serie o tipo de activo
- `src/components/inventory-workspace.tsx:301`: Todos los estados
- `src/components/inventory-workspace.tsx:315`: No fue posible cargar el inventario
- `src/components/inventory-workspace.tsx:327`: Activos del inventario
- `src/components/inventory-workspace.tsx:335`: Registrar el primer activo
- `src/components/inventory-workspace.tsx:364`: Todavía no hay tipos de activo
- `src/components/inventory-workspace.tsx:367`: Crear un tipo de activo
- `src/components/inventory-workspace.tsx:371`: Cada activo pertenece a un tipo (portátil, monitor, taladro). Crea el primero para poder registrar activos.
- `src/components/inventory-workspace.tsx:475`: En custodia de
- `src/components/inventory-workspace.tsx:499`: Registrar la entrega
- `src/components/inventory-workspace.tsx:505`: Solicitar devolución
- `src/components/inventory-workspace.tsx:510`: Recibir el activo
- `src/components/inventory-workspace.tsx:515`: Validar en qué estado llegó
- `src/components/inventory-workspace.tsx:523`: Dar de baja
- `src/components/inventory-workspace.tsx:531`: Historial del activo
- `src/components/inventory-workspace.tsx:536`: Todavía no hay movimientos registrados para este activo.
- `src/components/inventory-workspace.tsx:563`: Cada movimiento queda en la auditoría y no se puede borrar.
- `src/components/inventory-workspace.tsx:758`: Nombre del tipo de activo
- `src/components/inventory-workspace.tsx:769`: Tipo de activo
- `src/components/inventory-workspace.tsx:783`: Etiqueta única
- `src/components/inventory-workspace.tsx:789`: Número de serie
- `src/components/inventory-workspace.tsx:813`: Sucursal de destino
- `src/components/inventory-workspace.tsx:832`: ¿En qué estado queda?
- `src/components/inventory-workspace.tsx:862`: Queda adjunta al movimiento del activo y no se puede sustituir después.
- `src/components/inventory-workspace.tsx:868`: No se pudo completar la operación
- `src/components/inventory-workspace.tsx:1088`: Condición

### /inventory/assets/dashboard

- `src/components/inventory/assets-module-dashboard.tsx:83`: Dashboard de inventario de activos
- `src/components/inventory/assets-module-dashboard.tsx:84`: Cómo está el inventario de la sucursal, qué necesita atención y por dónde seguir.
- `src/components/inventory/assets-module-dashboard.tsx:111`: No fue posible cargar las cifras del inventario
- `src/components/inventory/assets-module-dashboard.tsx:116`: Estado del inventario de activos
- `src/components/inventory/assets-module-dashboard.tsx:139`: Requieren atención
- `src/components/inventory/assets-module-dashboard.tsx:153`: Existencias bajo mínimo
- `src/components/inventory/assets-module-dashboard.tsx:160`: Ver almacén
- `src/components/inventory/assets-module-dashboard.tsx:165`: Las cuatro tareas del día, con icono y texto.
- `src/components/inventory/assets-module-dashboard.tsx:176`: Recibir devolución
- `src/components/inventory/assets-module-dashboard.tsx:204`: Cambió hace poco
- `src/components/inventory/assets-module-dashboard.tsx:205`: Los últimos activos que cambiaron de estado o de custodia en esta sucursal.
- `src/components/inventory/assets-module-dashboard.tsx:212`: No fue posible cargar los activos
- `src/components/inventory/assets-module-dashboard.tsx:219`: Todavía no hay activos en esta sucursal
- `src/components/inventory/assets-module-dashboard.tsx:220`: Registra el primero desde el listado de activos.
- `src/components/inventory/assets-module-dashboard.tsx:256`: Órdenes abiertas cuya fecha límite ya pasó.
- `src/components/inventory/assets-module-dashboard.tsx:260`: Solo quien gestiona el inventario ve las órdenes de mantenimiento.
- `src/components/inventory/assets-module-dashboard.tsx:265`: No fue posible cargar el mantenimiento
- `src/components/inventory/assets-module-dashboard.tsx:293`: Vencía
- `src/components/inventory/assets-module-dashboard.tsx:306`: Abrir el listado completo de activos

### /inventory/audit

- `src/app/(app)/inventory/audit/page.tsx:52`: Auditoría de inventario
- `src/app/(app)/inventory/audit/page.tsx:53`: Quién hizo cada operación crítica, cuándo y con qué resultado.
- `src/app/(app)/inventory/audit/page.tsx:58`: Cargando la auditoría
- `src/app/(app)/inventory/audit/page.tsx:61`: No fue posible cargar la auditoría
- `src/app/(app)/inventory/audit/page.tsx:69`: Aquí quedará constancia de cada entrega, devolución, ajuste y recepción del inventario.
- `src/app/(app)/inventory/audit/page.tsx:102`: Detalle técnico
- `src/app/(app)/inventory/audit/page.tsx:111`: Correlación

### /inventory/deliveries

- `src/app/(app)/inventory/deliveries/page.tsx:4`: Entregas de activos
- `src/components/inventory-workspace.tsx:250`: Elige un activo disponible y usa «Asignar». La entrega quedará ligada a su expediente de incorporación
- `src/components/inventory-workspace.tsx:255`: La persona no está en esta sucursal
- `src/components/inventory-workspace.tsx:256`: Cambia de sucursal arriba para poder asignarle un activo.
- `src/components/inventory-workspace.tsx:283`: Buscar
- `src/components/inventory-workspace.tsx:287`: Etiqueta, número de serie o tipo de activo
- `src/components/inventory-workspace.tsx:301`: Todos los estados
- `src/components/inventory-workspace.tsx:315`: No fue posible cargar el inventario
- `src/components/inventory-workspace.tsx:327`: Activos del inventario
- `src/components/inventory-workspace.tsx:335`: Registrar el primer activo
- `src/components/inventory-workspace.tsx:364`: Todavía no hay tipos de activo
- `src/components/inventory-workspace.tsx:367`: Crear un tipo de activo
- `src/components/inventory-workspace.tsx:371`: Cada activo pertenece a un tipo (portátil, monitor, taladro). Crea el primero para poder registrar activos.
- `src/components/inventory-workspace.tsx:475`: En custodia de
- `src/components/inventory-workspace.tsx:499`: Registrar la entrega
- `src/components/inventory-workspace.tsx:505`: Solicitar devolución
- `src/components/inventory-workspace.tsx:510`: Recibir el activo
- `src/components/inventory-workspace.tsx:515`: Validar en qué estado llegó
- `src/components/inventory-workspace.tsx:523`: Dar de baja
- `src/components/inventory-workspace.tsx:531`: Historial del activo
- `src/components/inventory-workspace.tsx:536`: Todavía no hay movimientos registrados para este activo.
- `src/components/inventory-workspace.tsx:563`: Cada movimiento queda en la auditoría y no se puede borrar.
- `src/components/inventory-workspace.tsx:758`: Nombre del tipo de activo
- `src/components/inventory-workspace.tsx:769`: Tipo de activo
- `src/components/inventory-workspace.tsx:783`: Etiqueta única
- `src/components/inventory-workspace.tsx:789`: Número de serie
- `src/components/inventory-workspace.tsx:813`: Sucursal de destino
- `src/components/inventory-workspace.tsx:832`: ¿En qué estado queda?
- `src/components/inventory-workspace.tsx:862`: Queda adjunta al movimiento del activo y no se puede sustituir después.
- `src/components/inventory-workspace.tsx:868`: No se pudo completar la operación
- `src/components/inventory-workspace.tsx:1088`: Condición

### /inventory/maintenance

- `src/app/(app)/inventory/maintenance/page.tsx:165`: Ciclo de vida
- `src/app/(app)/inventory/maintenance/page.tsx:166`: Mantenimiento de activos
- `src/app/(app)/inventory/maintenance/page.tsx:167`: Trabajos preventivos y correctivos, con su coste y su fecha objetivo.
- `src/app/(app)/inventory/maintenance/page.tsx:168`: sin cerrar
- `src/app/(app)/inventory/maintenance/page.tsx:178`: No se pudo cerrar el mantenimiento
- `src/app/(app)/inventory/maintenance/page.tsx:184`: Cargando los mantenimientos
- `src/app/(app)/inventory/maintenance/page.tsx:187`: No fue posible cargar los mantenimientos
- `src/app/(app)/inventory/maintenance/page.tsx:195`: Registra uno cuando un activo necesite revisión, reparación o calibración.
- `src/app/(app)/inventory/maintenance/page.tsx:199`: Registrar el primero
- `src/app/(app)/inventory/maintenance/page.tsx:206`: Sin cerrar
- `src/app/(app)/inventory/maintenance/page.tsx:207`: Trabajos que todavía mantienen un activo fuera de servicio.
- `src/app/(app)/inventory/maintenance/page.tsx:213`: Todos los mantenimientos registrados están cerrados.
- `src/app/(app)/inventory/maintenance/page.tsx:219`: Historial de los trabajos ya resueltos.
- `src/app/(app)/inventory/maintenance/page.tsx:240`: Cerrar el mantenimiento
- `src/app/(app)/inventory/maintenance/page.tsx:242`: Registra cómo terminó el trabajo antes de darlo por resuelto.
- `src/app/(app)/inventory/maintenance/page.tsx:261`: Qué se hizo
- `src/app/(app)/inventory/maintenance/page.tsx:392`: Título del trabajo
- `src/app/(app)/inventory/maintenance/page.tsx:396`: Cambio de batería
- `src/app/(app)/inventory/maintenance/page.tsx:454`: Descripción

### /inventory/my-assets

- `src/app/(app)/inventory/my-assets/page.tsx:39`: Los equipos y recursos que están bajo tu custodia.
- `src/app/(app)/inventory/my-assets/page.tsx:55`: Cuando te entreguen un equipo aparecerá aquí, con su etiqueta y su número de serie.
- `src/app/(app)/inventory/my-assets/page.tsx:85`: ¿Vas a devolver alguno?
- `src/app/(app)/inventory/my-assets/page.tsx:89`: para que quien lleva el inventario lo reciba.

### /inventory/purchases

- `src/components/inventory-purchases-panel.tsx:122`: Solicita, aprueba y recibe compras viendo antes su efecto sobre las existencias.
- `src/components/inventory-purchases-panel.tsx:127`: Nueva orden de compra
- `src/components/inventory-purchases-panel.tsx:133`: No se pudo aprobar la orden
- `src/components/inventory-purchases-panel.tsx:139`: Cargando las órdenes de compra
- `src/components/inventory-purchases-panel.tsx:142`: No fue posible cargar las órdenes
- `src/components/inventory-purchases-panel.tsx:149`: Todavía no hay órdenes de compra
- `src/components/inventory-purchases-panel.tsx:150`: Una orden reserva lo que se va a comprar; al recibirla, la mercancía entra en el almacén.
- `src/components/inventory-purchases-panel.tsx:154`: Crear la primera orden
- `src/components/inventory-purchases-panel.tsx:160`: Órdenes que aún esperan aprobación o mercancía.
- `src/components/inventory-purchases-panel.tsx:170`: Todas las órdenes están recibidas o cerradas.
- `src/components/inventory-purchases-panel.tsx:176`: Historial de compras ya completadas.
- `src/components/inventory-purchases-panel.tsx:194`: Cargando los proveedores
- `src/components/inventory-purchases-panel.tsx:207`: Una orden de compra necesita un proveedor al que pedírsela.
- `src/components/inventory-purchases-panel.tsx:210`: Registrar el primero
- `src/components/inventory-purchases-panel.tsx:233`: ¿Aprobar la orden
- `src/components/inventory-purchases-panel.tsx:235`: Queda autorizada para recibirse. Todavía no entra nada al almacén: eso ocurre al registrar la recepción.
- `src/components/inventory-purchases-panel.tsx:245`: Todavía no
- `src/components/inventory-purchases-panel.tsx:252`: Aprobar la orden
- `src/components/inventory-purchases-panel.tsx:301`: de
- `src/components/inventory-purchases-panel.tsx:304`: más
- `src/components/inventory-purchases-panel.tsx:320`: Registrar recepción
- `src/components/inventory-purchases-panel.tsx:465`: Recepción de la orden
- `src/components/inventory-purchases-panel.tsx:467`: Registra cuánto llegó realmente de cada artículo. Puede ser menos de lo pedido.
- `src/components/inventory-purchases-panel.tsx:507`: Cancelar
- `src/components/inventory-purchases-panel.tsx:519`: Corregir las cantidades
- `src/components/inventory-purchases-panel.tsx:634`: Teléfono
- `src/components/inventory-purchases-panel.tsx:635`: Identificación fiscal
- `src/components/inventory-purchases-panel.tsx:642`: Código
- `src/components/inventory-purchases-panel.tsx:662`: Artículos
- `src/components/inventory-purchases-panel.tsx:666`: Artículo
- `src/components/inventory-purchases-panel.tsx:739`: Agregar artículo
- `src/components/inventory-purchases-panel.tsx:757`: Total de la orden
- `src/components/inventory-purchases-panel.tsx:762`: Por encima del presupuesto
- `src/components/inventory-purchases-panel.tsx:763`: El total supera el presupuesto que indicaste (
- `src/components/inventory-purchases-panel.tsx:770`: No se pudo guardar
- `src/components/inventory-purchases-panel.tsx:788`: Guardar

### /inventory/restaurant/[...slug]

- `src/components/restaurant-inventory-shell.tsx:89`: Almacén:
- `src/components/restaurant-inventory-shell.tsx:184`: No hay registros para este contexto.
- `src/components/restaurant-inventory-shell.tsx:186`: Entradas de mercancía
- `src/components/restaurant-inventory-shell.tsx:186`: Confirma únicamente después de revisar el resumen. Un documento confirmado no puede editarse.
- `src/components/restaurant-inventory-shell.tsx:186`: Cancelar
- `src/components/restaurant-inventory-shell.tsx:188`: Producción
- `src/components/restaurant-inventory-shell.tsx:188`: El costo total, costo por porción y margen estimado son calculados por el backend.
- `src/components/restaurant-inventory-shell.tsx:188`: Porción
- `src/components/restaurant-inventory-shell.tsx:190`: Operación
- `src/components/restaurant-inventory-shell.tsx:190`: Registro de consumo
- `src/components/restaurant-inventory-shell.tsx:190`: Calcula el consumo con la vista previa del backend antes de confirmar.
- `src/components/restaurant-inventory-shell.tsx:190`: Vista previa del consumo
- `src/components/restaurant-inventory-shell.tsx:190`: Inventario insuficiente
- `src/components/restaurant-inventory-shell.tsx:192`: Registra la merma con motivo, cantidad, unidad y observaciones.
- `src/components/restaurant-inventory-shell.tsx:192`: El backend confirmó el movimiento.
- `src/components/restaurant-inventory-shell.tsx:194`: Consulta existencias, mínimos, costo promedio y valor total.
- `src/components/restaurant-inventory-shell.tsx:196`: Auditoría
- `src/components/restaurant-inventory-shell.tsx:196`: Consulta de solo lectura con documento de referencia y usuario.
- `src/components/access-state.tsx:23`: Verificando tu sesión y tu espacio de trabajo
- `src/components/access-state.tsx:138`: Código de soporte:
- `src/components/design-system.tsx:50`: Buscar funciones…
- `src/components/confirm-action.tsx:104`: Qué cambia
- `src/components/confirm-action.tsx:111`: El movimiento queda en la auditoría. Corregirlo exige registrar otra operación en sentido contrario.
- `src/components/restaurant-inventory-phase2.tsx:28`: Selecciona una sucursal para operar este módulo.
- `src/components/restaurant-inventory-phase2.tsx:29`: Permiso de gestión requerido
- `src/components/restaurant-inventory-phase2.tsx:29`: Tu perfil puede consultar, pero no modificar esta sección.
- `src/components/restaurant-inventory-phase2.tsx:46`: Operación diaria
- `src/components/restaurant-inventory-phase2.tsx:46`: Selecciona origen y destino, revisa el impacto y registra el envío.
- `src/components/restaurant-inventory-phase2.tsx:46`: No se pudo completar la transferencia
- `src/components/restaurant-inventory-phase2.tsx:46`: El borrador fue creado. La siguiente acción es enviarlo desde la lista.
- `src/components/restaurant-inventory-phase2.tsx:46`: Almacén origen
- `src/components/restaurant-inventory-phase2.tsx:46`: Almacén destino
- `src/components/restaurant-inventory-phase2.tsx:46`: Selecciona un almacén destino diferente al origen.
- `src/components/restaurant-inventory-phase2.tsx:46`: Las cantidades se expresan en la unidad de inventario configurada para cada producto.
- `src/components/restaurant-inventory-phase2.tsx:46`: Agregar línea
- `src/components/restaurant-inventory-phase2.tsx:46`: . Se registrarán
- `src/components/restaurant-inventory-phase2.tsx:46`: línea(s) como borrador. La existencia sólo cambiará al recibir.
- `src/components/restaurant-inventory-phase2.tsx:46`: Confirmar recepción
- `src/components/restaurant-inventory-phase2.tsx:46`: Cancelar transferencia
- `src/components/restaurant-inventory-phase2.tsx:50`: Registra la diferencia, revisa el saldo resultante y confirma el movimiento.
- `src/components/restaurant-inventory-phase2.tsx:50`: No se pudo aplicar el ajuste
- `src/components/restaurant-inventory-phase2.tsx:50`: Almacén
- `src/components/restaurant-inventory-phase2.tsx:50`: · diferencia de
- `src/components/restaurant-inventory-phase2.tsx:50`: unidades de inventario en
- `src/components/restaurant-inventory-phase2.tsx:50`: Confirmación irreversible
- `src/components/restaurant-inventory-phase2.tsx:50`: El ajuste modificará existencias y creará un movimiento auditable.
- `src/components/restaurant-inventory-phase2.tsx:50`: El movimiento fue creado y existencias, movimientos y métricas ya fueron actualizados.
- `src/components/restaurant-inventory-phase2.tsx:51`: Eliminar línea
- `src/components/restaurant-stock-count-workflow.tsx:278`: Control físico
- `src/components/restaurant-stock-count-workflow.tsx:279`: Conteo físico
- `src/components/restaurant-stock-count-workflow.tsx:280`: Cuenta en la estantería, compara contra lo que el sistema cree que hay y aprueba el ajuste.
- `src/components/restaurant-stock-count-workflow.tsx:283`: Almacén:
- `src/components/restaurant-stock-count-workflow.tsx:293`: No fue posible cargar el conteo físico
- `src/components/restaurant-stock-count-workflow.tsx:306`: Falta elegir el almacén
- `src/components/restaurant-stock-count-workflow.tsx:307`: Sin almacén no hay existencia teórica contra la que comparar. Selecciónalo arriba para empezar.
- `src/components/restaurant-stock-count-workflow.tsx:312`: No se pudo crear el conteo
- `src/components/restaurant-stock-count-workflow.tsx:319`: Captura del conteo
- `src/components/restaurant-stock-count-workflow.tsx:320`: Una línea por ingrediente contado. La observación es opcional.
- `src/components/restaurant-stock-count-workflow.tsx:336`: No se muestra la existencia que el sistema tiene registrada hasta el momento de aprobar, para que el conteo no se sesgue.
- `src/components/restaurant-stock-count-workflow.tsx:376`: Observación
- `src/components/restaurant-stock-count-workflow.tsx:402`: Comparar con el sistema
- `src/components/restaurant-stock-count-workflow.tsx:412`: La comparación queda oculta hasta la aprobación
- `src/components/restaurant-stock-count-workflow.tsx:413`: Elegiste conteo ciego: quien cuenta no ve la existencia registrada. El detalle completo aparece en el paso de aprobación.
- `src/components/restaurant-stock-count-workflow.tsx:435`: Corregir la captura
- `src/components/restaurant-stock-count-workflow.tsx:444`: Crear el conteo
- `src/components/restaurant-stock-count-workflow.tsx:468`: Descartar el conteo
- `src/components/restaurant-stock-count-workflow.tsx:476`: Enviar a revisión de otra persona
- `src/components/restaurant-stock-count-workflow.tsx:504`: Documentos abiertos que todavía no ajustaron el inventario.
- `src/components/restaurant-stock-count-workflow.tsx:526`: Todos los conteos registrados ya se aprobaron o se descartaron.
- `src/components/restaurant-inventory-context.tsx:131`: Almacén activo
- `src/components/restaurant-inventory-context.tsx:131`: Seleccionar almacén
- `src/components/restaurant-inventory-context.tsx:134`: No se pudieron cargar los almacenes
- `src/components/restaurant-inventory-context.tsx:135`: Sin almacenes disponibles
- `src/components/restaurant-inventory-context.tsx:135`: La sucursal actual no tiene un almacén activo asignado.
- `src/components/restaurant-inventory-ui.tsx:30`: No fue posible cargar la información
- `src/components/restaurant-stock-control-workspace.tsx:98`: Falta elegir la sucursal
- `src/components/restaurant-stock-control-workspace.tsx:199`: Bajo mínimo
- `src/components/restaurant-stock-control-workspace.tsx:236`: Busca ingredientes y detecta riesgos de mínimo, vencimiento o falta de movimiento.
- `src/components/restaurant-stock-control-workspace.tsx:281`: Bajo mínimo
- `src/components/restaurant-stock-control-workspace.tsx:284`: Sin movimiento
- `src/components/restaurant-stock-control-workspace.tsx:291`: Esta señal no está disponible
- `src/components/restaurant-stock-control-workspace.tsx:292`: El servidor no entrega la fecha del último movimiento en este listado, así que no se puede saber cuáles llevan tiempo quietos.
- `src/components/restaurant-stock-control-workspace.tsx:299`: No fue posible cargar las existencias
- `src/components/restaurant-stock-control-workspace.tsx:425`: Prioriza los lotes vencidos y los que están por vencer antes de tener que registrar una merma.
- `src/components/restaurant-stock-control-workspace.tsx:471`: No fue posible cargar los lotes
- `src/components/restaurant-stock-control-workspace.tsx:650`: Auditoría
- `src/components/restaurant-stock-control-workspace.tsx:651`: Kardex de movimientos
- `src/components/restaurant-stock-control-workspace.tsx:652`: Entradas, salidas y saldos. Los filtros se guardan por persona y sucursal.
- `src/components/restaurant-stock-control-workspace.tsx:718`: No fue posible cargar el Kardex
- `src/components/restaurant-stock-control-workspace.tsx:728`: Movimientos de inventario
- `src/components/restaurant-stock-control-workspace.tsx:774`: Cerrar el detalle
- `src/components/restaurant-stock-control-workspace.tsx:781`: Detalle del movimiento
- `src/components/restaurant-stock-control-workspace.tsx:787`: Detalle del movimiento
- `src/components/restaurant-stock-control-workspace.tsx:792`: Cerrar el detalle
- `src/components/restaurant-sales-import.tsx:79`: Inventario
- `src/components/restaurant-sales-import.tsx:79`: Carga ventas para generar consumos sólo después de validar y confirmar el procesamiento.
- `src/components/restaurant-sales-import.tsx:79`: de
- `src/components/restaurant-sales-import.tsx:79`: Sin impacto hasta confirmar
- `src/components/restaurant-sales-import.tsx:82`: Progreso de importación
- `src/components/restaurant-sales-import.tsx:84`: Arrastra tu archivo aquí o selecciónalo
- `src/components/restaurant-sales-import.tsx:84`: CSV o XLSX · máximo 10 MB
- `src/components/restaurant-sales-import.tsx:84`: Incluye ID de venta, código o nombre de producto, cantidad y fecha/hora. La primera fila debe contener encabezados.
- `src/components/restaurant-sales-import.tsx:86`: Forma de agrupación
- `src/components/restaurant-sales-import.tsx:86`: Por día
- `src/components/restaurant-sales-import.tsx:88`: Selecciona el encabezado del archivo para cada campo requerido. Los ejemplos provienen de la carga validada.
- `src/components/restaurant-sales-import.tsx:88`: Nombre de columna
- `src/components/restaurant-sales-import.tsx:90`: Relaciona cada producto externo con una receta existente. La correspondencia quedará guardada para futuras cargas.
- `src/components/restaurant-sales-import.tsx:90`: ID de receta
- `src/components/restaurant-sales-import.tsx:92`: Validación pendiente
- `src/components/restaurant-sales-import.tsx:92`: Carga un archivo para iniciar la validación.
- `src/components/restaurant-sales-import.tsx:94`: Sin errores por fila
- `src/components/restaurant-sales-import.tsx:94`: La validación no reportó errores de fila.
- `src/components/restaurant-sales-import.tsx:96`: Ejecuta la validación para generar la vista previa.
- `src/components/restaurant-sales-import.tsx:98`: Listo para procesar
- `src/components/restaurant-sales-import.tsx:98`: La importación aún no ha sido confirmada.
- `src/components/restaurant-sales-import.tsx:98`: Válidas
- `src/components/restaurant-sales-import.tsx:98`: Reintentar consulta
- `src/components/restaurant-sales-import.tsx:100`: Historial de importaciones
- `src/components/restaurant-reports.tsx:37`: Permiso de auditoría requerido
- `src/components/restaurant-reports.tsx:37`: Tu perfil no puede consultar la auditoría detallada.
- `src/components/restaurant-reports.tsx:42`: Reportes de inventario
- `src/components/restaurant-reports.tsx:42`: Almacén
- `src/components/restaurant-reports.tsx:42`: Categoría
- `src/components/restaurant-reports.tsx:44`: · Página
- `src/components/restaurant-reports.tsx:44`: de
- `src/components/restaurant-reports.tsx:44`: Resultados del informe
- `src/components/restaurant-reports.tsx:44`: Sin resultados
- `src/components/restaurant-reports.tsx:44`: No hay datos para los filtros aplicados.
- `src/components/restaurant-reports.tsx:46`: Costo de receta
- `src/components/restaurant-reports.tsx:46`: Costos, márgenes e historial se calculan y versionan en el backend.
- `src/components/restaurant-reports.tsx:46`: Selecciona una receta para consultar costo por porción, margen e historial.
- `src/components/restaurant-reports.tsx:46`: Costo por porción
- `src/components/restaurant-reports.tsx:50`: Consultando los datos más recientes.
- `src/components/restaurant-decision-dashboard.tsx:17`: Aún no hay datos de operación
- `src/components/restaurant-decision-dashboard.tsx:17`: Prioriza compras, vencimientos, mermas y diferencias con datos confirmados del backend.
- `src/components/restaurant-decision-dashboard.tsx:17`: Ingredientes críticos
- `src/components/restaurant-decision-dashboard.tsx:17`: Próximos vencimientos
- `src/components/restaurant-decision-dashboard.tsx:17`: Sugerencias de compra
- `src/components/restaurant-decision-dashboard.tsx:17`: Recetas de mayor costo
- `src/components/restaurant-decision-dashboard.tsx:18`: Abrir acción
- `src/components/restaurant-decision-dashboard.tsx:19`: Sin alertas
- `src/components/restaurant-decision-dashboard.tsx:20`: Sin datos para graficar
- `src/components/restaurant-reports-workspace.tsx:24`: Reportes para decidir
- `src/components/restaurant-reports-workspace.tsx:24`: Guarda filtros frecuentes y exporta los resultados para operación o dirección.
- `src/components/restaurant-reports-workspace.tsx:24`: Guardar filtros
- `src/components/restaurant-reports-workspace.tsx:24`: Estos filtros quedan disponibles para este usuario y sucursal.
- `src/components/restaurant-reports-workspace.tsx:25`: Resultado del informe
- `src/components/restaurant-reports-workspace.tsx:25`: Sin resultados
- `src/components/restaurant-reports-workspace.tsx:25`: Prueba otro rango de fechas o cambia el almacén para encontrar movimientos.
- `src/components/restaurant-reports-workspace.tsx:25`: Variación teórico vs real
- `src/components/restaurant-reports-workspace.tsx:25`: Revisa las filas con diferencia y genera un conteo físico o una acción de ajuste.
- `src/components/restaurant-inventory-catalog.tsx:91`: Catálogo
- `src/components/restaurant-inventory-catalog.tsx:91`: Datos maestros administrados por empresa y consultados desde el backend.
- `src/components/restaurant-inventory-catalog.tsx:123`: No se pudo completar la operación
- `src/components/restaurant-inventory-catalog.tsx:130`: No fue posible cargar el catálogo
- `src/components/restaurant-inventory-catalog.tsx:175`: ¿Desactivar «
- `src/components/restaurant-inventory-catalog.tsx:177`: Dejará de poder elegirse en recetas, compras y movimientos nuevos.
- `src/components/restaurant-inventory-catalog.tsx:181`: Los movimientos, recetas y documentos que ya lo usan siguen intactos y se pueden seguir consultando. Puedes volver a activarlo desde el filtro «Inactivos».
- `src/components/restaurant-inventory-catalog.tsx:321`: Nuevo almacén
- `src/components/restaurant-inventory-catalog.tsx:321`: Falta elegir la sucursal
- `src/components/restaurant-inventory-catalog.tsx:321`: Un almacén pertenece a una sucursal; elígela en la barra superior antes de crearlo.
- `src/components/restaurant-inventory-catalog.tsx:324`: Categoría
- `src/components/restaurant-inventory-catalog.tsx:324`: Unidad de inventario
- `src/components/restaurant-inventory-catalog.tsx:324`: Unidad de compra
- `src/components/restaurant-inventory-catalog.tsx:324`: No se pudieron cargar las opciones
- `src/components/restaurant-inventory-catalog.tsx:324`: No se pudo guardar
- `src/components/restaurant-inventory-catalog.tsx:324`: Cancelar
- `src/components/restaurant-receipts.tsx:58`: Entradas de mercancía
- `src/components/restaurant-receipts.tsx:58`: Crea borradores, revisa conversiones calculadas por el backend y confirma sólo cuando el detalle sea correcto.
- `src/components/restaurant-receipts.tsx:59`: No se pudieron cargar los catálogos
- `src/components/restaurant-receipts.tsx:60`: No se pudo completar la operación
- `src/components/restaurant-receipts.tsx:62`: Selecciona una sucursal para consultar entradas.
- `src/components/restaurant-receipts.tsx:71`: Los documentos procesados no pueden editarse.
- `src/components/restaurant-receipts.tsx:75`: Entrada de mercancía
- `src/components/restaurant-receipts.tsx:75`: Almacén
- `src/components/restaurant-receipts.tsx:75`: Unidad de compra
- `src/components/restaurant-receipts.tsx:75`: Cálculo del backend
- `src/components/restaurant-receipts.tsx:75`: Sin movimientos aún
- `src/components/restaurant-receipts.tsx:75`: Cancelar
- `src/components/restaurant-receipts.tsx:75`: Guardar borrador
- `src/components/restaurant-receipts.tsx:75`: No hay sucursal activa para guardar la entrada.
- `src/components/restaurant-receipts.tsx:78`: Bandeja de pendientes
- `src/components/restaurant-receipts.tsx:78`: Entradas guardadas que aún no actualizan existencias.
- `src/components/restaurant-receipts.tsx:78`: No hay documentos pendientes para esta sucursal.
- `src/components/restaurant-receipts.tsx:80`: Documentos de entrada
- `src/components/restaurant-receipts.tsx:80`: Los documentos confirmados son sólo lectura.
- `src/components/restaurant-receipts.tsx:80`: Cancelar
- `src/components/restaurant-receipts.tsx:80`: No hay entradas para la sucursal actual.
- `src/components/restaurant-receipts.tsx:94`: Impacto de la recepción por ingrediente
- `src/components/restaurant-receipts.tsx:117`: Revisa el resumen antes de aplicar el documento.
- `src/components/restaurant-receipts.tsx:117`: Esta acción es irreversible
- `src/components/restaurant-receipts.tsx:117`: Al confirmar, se actualizarán existencias, costos, lotes y movimientos. El documento no podrá editarse.
- `src/components/restaurant-receipt-wizard.tsx:40`: Entrada de mercancía
- `src/components/restaurant-receipt-wizard.tsx:40`: Completa el flujo y revisa el impacto antes de confirmar.
- `src/components/restaurant-receipt-wizard.tsx:41`: Pasos de la entrada
- `src/components/restaurant-receipt-wizard.tsx:42`: 1. Proveedor y almacén
- `src/components/restaurant-receipt-wizard.tsx:42`: Almacén
- `src/components/restaurant-receipt-wizard.tsx:43`: La conversión a unidad de inventario la calcula el backend.
- `src/components/restaurant-receipt-wizard.tsx:43`: Agregar línea
- `src/components/restaurant-receipt-wizard.tsx:43`: Unidad de compra
- `src/components/restaurant-receipt-wizard.tsx:44`: Registra la trazabilidad de cada línea antes de calcular el impacto.
- `src/components/restaurant-receipt-wizard.tsx:45`: No hay movimientos aplicados hasta confirmar el documento.
- `src/components/restaurant-receipt-wizard.tsx:45`: Calcula la vista previa para conocer cantidades, conversiones y costo estimado.
- `src/components/restaurant-receipt-wizard.tsx:46`: 5. Confirmación
- `src/components/restaurant-receipt-wizard.tsx:46`: Confirmación irreversible
- `src/components/restaurant-receipt-wizard.tsx:46`: Al confirmar se actualizarán existencias, lotes, movimientos y costo promedio del almacén seleccionado.
- `src/components/restaurant-receipt-wizard.tsx:46`: Primero se guardará el documento como borrador y luego podrás confirmar la aplicación.
- `src/components/restaurant-receipt-wizard.tsx:46`: Falta la vista previa
- `src/components/restaurant-receipt-wizard.tsx:46`: Regresa al paso anterior y calcula el impacto antes de continuar.
- `src/components/restaurant-receipt-wizard.tsx:47`: Cancelar
- `src/components/restaurant-receipt-wizard.tsx:47`: Revisar confirmación
- `src/components/restaurant-receipt-wizard.tsx:47`: Guardar y confirmar
- `src/components/restaurant-receipt-wizard.tsx:48`: No hay sucursal activa para guardar la entrada.
- `src/components/restaurant-receipt-wizard.tsx:52`: Impacto de la recepción por ingrediente
- `src/components/restaurant-operations.tsx:54`: Selecciona una sucursal para operar el inventario de restaurante.
- `src/components/restaurant-operations.tsx:57`: No fue posible cargar los catálogos
- `src/components/restaurant-operations.tsx:74`: Configuración
- `src/components/restaurant-operations.tsx:74`: Define ingredientes y rendimiento. El costo se calcula en el backend.
- `src/components/restaurant-operations.tsx:74`: No se pudo guardar
- `src/components/restaurant-operations.tsx:74`: Código
- `src/components/restaurant-operations.tsx:74`: Unidad de rendimiento
- `src/components/restaurant-operations.tsx:74`: Precio de venta
- `src/components/restaurant-operations.tsx:74`: Política de stock
- `src/components/restaurant-operations.tsx:74`: Descripción
- `src/components/restaurant-operations.tsx:74`: Unidad de inventario
- `src/components/restaurant-operations.tsx:74`: Validación
- `src/components/restaurant-operations.tsx:74`: El backend calculó el costo de la receta y guardó el documento.
- `src/components/restaurant-operations.tsx:277`: Operación diaria
- `src/components/restaurant-operations.tsx:279`: Registra, revisa cómo queda el almacén y confirma.
- `src/components/restaurant-operations.tsx:280`: Almacén:
- `src/components/restaurant-operations.tsx:286`: Falta elegir el almacén
- `src/components/restaurant-operations.tsx:287`: Selecciona un almacén antes de registrar la
- `src/components/restaurant-operations.tsx:292`: No se pudo preparar la operación
- `src/components/restaurant-operations.tsx:346`: Autorizar el faltante
- `src/components/restaurant-operations.tsx:348`: El servidor permite registrar la salida aunque no haya existencia suficiente, pero exige dejar por escrito por qué. Queda en la auditoría a nombre de
- `src/components/restaurant-operations.tsx:352`: Justificación
- `src/components/restaurant-operations.tsx:357`: Explica por qué se autoriza el faltante
- `src/components/restaurant-operations.tsx:361`: caracteres mínimos
- `src/components/restaurant-operations.tsx:367`: Corregir el registro
- `src/components/restaurant-operations.tsx:393`: Descartar el borrador
- `src/components/restaurant-production-workflow.tsx:313`: Operación diaria
- `src/components/restaurant-production-workflow.tsx:314`: Producción
- `src/components/restaurant-production-workflow.tsx:315`: Elige las recetas, define cantidades, revisa cómo queda el almacén y confirma.
- `src/components/restaurant-production-workflow.tsx:316`: Almacén:
- `src/components/restaurant-production-workflow.tsx:322`: Falta elegir el almacén
- `src/components/restaurant-production-workflow.tsx:323`: Sin almacén no se sabe de dónde salen los ingredientes. Selecciónalo arriba para continuar.
- `src/components/restaurant-production-workflow.tsx:328`: No se pudo calcular el impacto
- `src/components/restaurant-production-workflow.tsx:336`: Puedes agrupar varias recetas en una misma operación.
- `src/components/restaurant-production-workflow.tsx:385`: Cuánto se planificó producir y cuánto rindió realmente.
- `src/components/restaurant-production-workflow.tsx:421`: Cambiar las recetas
- `src/components/restaurant-production-workflow.tsx:441`: Autorizar el faltante
- `src/components/restaurant-production-workflow.tsx:443`: El servidor permite producir aunque no haya existencia suficiente, pero exige dejar por escrito por qué. Queda en la auditoría a nombre de
- `src/components/restaurant-production-workflow.tsx:447`: Justificación
- `src/components/restaurant-production-workflow.tsx:452`: Explica por qué se autoriza el faltante
- `src/components/restaurant-production-workflow.tsx:456`: caracteres mínimos
- `src/components/restaurant-production-workflow.tsx:464`: Corregir las cantidades
- `src/components/restaurant-production-workflow.tsx:511`: Producción pendiente
- `src/components/restaurant-production-workflow.tsx:512`: Documentos en borrador que todavía no actualizan existencias.
- `src/components/restaurant-production-workflow.tsx:519`: Cargando la producción pendiente
- `src/components/restaurant-production-workflow.tsx:538`: No hay producción pendiente
- `src/components/restaurant-production-workflow.tsx:539`: Todo lo registrado ya se aplicó al inventario.
- `src/components/restaurant-waste-workflow.tsx:233`: Operación diaria
- `src/components/restaurant-waste-workflow.tsx:235`: Anota lo que se perdió, revisa cómo queda el almacén y confirma.
- `src/components/restaurant-waste-workflow.tsx:236`: Almacén:
- `src/components/restaurant-waste-workflow.tsx:249`: Falta elegir el almacén
- `src/components/restaurant-waste-workflow.tsx:250`: Selecciona un almacén antes de registrar la merma: sin él no se sabe de dónde sale el producto.
- `src/components/restaurant-waste-workflow.tsx:255`: No se pudo preparar la merma
- `src/components/restaurant-waste-workflow.tsx:262`: Qué se perdió
- `src/components/restaurant-waste-workflow.tsx:286`: Detalle opcional de la merma
- `src/components/restaurant-waste-workflow.tsx:367`: Corregir el registro
- `src/components/restaurant-waste-workflow.tsx:450`: Mermas sin confirmar
- `src/components/restaurant-waste-workflow.tsx:451`: Quedaron preparadas pero todavía no salieron del almacén.
- `src/components/restaurant-recipes-workspace.tsx:218`: Código
- `src/components/restaurant/restaurant-module-panel.tsx:166`: Cargando el estado del inventario
- `src/components/restaurant/restaurant-module-panel.tsx:172`: No fue posible cargar el estado del inventario
- `src/components/restaurant/restaurant-module-panel.tsx:218`: Empieza por aquí
- `src/components/restaurant/restaurant-module-panel.tsx:228`: No hay nada urgente en este almacén
- `src/components/restaurant/restaurant-module-panel.tsx:229`: Sin faltantes, sin lotes por vencer y sin entradas esperando confirmación. Puedes seguir con la operación del día.
- `src/components/restaurant/restaurant-module-panel.tsx:234`: Estado del inventario
- `src/components/restaurant/restaurant-module-panel.tsx:237`: Bajo mínimo
- `src/components/restaurant/restaurant-module-panel.tsx:248`: Próximos a vencer
- `src/components/restaurant/restaurant-module-panel.tsx:270`: Valor del inventario
- `src/components/restaurant/restaurant-module-panel.tsx:281`: Diferencia de conteo
- `src/components/restaurant/restaurant-module-panel.tsx:296`: Productos bajo mínimo
- `src/components/restaurant/restaurant-module-panel.tsx:320`: mínimo
- `src/components/restaurant/restaurant-module-panel.tsx:323`: Bajo mínimo
- `src/components/restaurant/restaurant-module-panel.tsx:332`: Lotes próximos a vencer
- `src/components/restaurant/restaurant-module-panel.tsx:333`: Registra la merma o dales salida antes de perder el producto.
- `src/components/restaurant/restaurant-module-panel.tsx:361`: Operaciones del día
- `src/components/restaurant/restaurant-module-panel.tsx:425`: Cargando el consumo del periodo
- `src/components/restaurant/restaurant-module-panel.tsx:427`: No fue posible cargar la tendencia
- `src/components/restaurant/restaurant-module-panel.tsx:428`: El resto del panel sigue siendo válido. Vuelve a cargar para reintentarlo.
- `src/components/restaurant/restaurant-module-panel.tsx:441`: Consumo registrado en cada periodo cerrado del almacén activo.
- `src/components/restaurant-purchasing-workspace.tsx:32`: Ordena, aprueba, recibe y controla costos de proveedores desde un mismo flujo.
- `src/components/restaurant-purchasing-workspace.tsx:32`: Órdenes de compra
- `src/components/restaurant-purchasing-workspace.tsx:43`: No se pudo actualizar la orden
- `src/components/restaurant-purchasing-workspace.tsx:43`: Órdenes de compra
- `src/components/restaurant-purchasing-workspace.tsx:43`: Recepción parcial, diferencias de precio y aprobación quedan trazadas.
- `src/components/restaurant-purchasing-workspace.tsx:55`: Nueva orden de compra
- `src/components/restaurant-purchasing-workspace.tsx:55`: Almacén:
- `src/components/restaurant-purchasing-workspace.tsx:55`: No se pudo guardar
- `src/components/restaurant-purchasing-workspace.tsx:55`: Agregar línea
- `src/components/restaurant-purchasing-workspace.tsx:55`: Eliminar línea
- `src/components/restaurant-purchasing-workspace.tsx:55`: Cancelar
- `src/components/restaurant-purchasing-workspace.tsx:60`: Órdenes de compra
- `src/components/restaurant-purchasing-workspace.tsx:60`: No hay órdenes para el contexto actual.
- `src/components/restaurant-purchasing-workspace.tsx:63`: Historial de precios por proveedor
- `src/components/restaurant-purchasing-workspace.tsx:63`: Compara último costo, promedio y variación antes de crear una orden.
- `src/components/restaurant-purchasing-workspace.tsx:65`: La cantidad considera existencia, nivel objetivo y días de cobertura.
- `src/components/restaurant-purchasing-workspace.tsx:65`: días
- `src/components/restaurant-purchasing-workspace.tsx:67`: Bandeja de facturas OCR
- `src/components/restaurant-purchasing-workspace.tsx:67`: Carga facturas para extracción y revisión antes de conciliarlas con una orden.
- `src/components/restaurant-purchasing-workspace.tsx:67`: No se pudo procesar la factura
- `src/components/restaurant-advanced-control-workspace.tsx:25`: Control avanzado de inventario
- `src/components/restaurant-advanced-control-workspace.tsx:25`: FEFO, vencimientos, conteos programados, variación y auditoría inmutable.
- `src/components/restaurant-advanced-control-workspace.tsx:25`: Teórico vs real
- `src/components/restaurant-advanced-control-workspace.tsx:25`: Auditoría inmutable
- `src/components/restaurant-advanced-control-workspace.tsx:28`: FEFO y alertas de vencimiento
- `src/components/restaurant-advanced-control-workspace.tsx:28`: Prioriza el lote con vencimiento más próximo y evita consumir lotes posteriores antes de tiempo.
- `src/components/restaurant-advanced-control-workspace.tsx:30`: Programa conteos por zona o ingredientes críticos sin bloquear toda la operación.
- `src/components/restaurant-advanced-control-workspace.tsx:30`: Próximo conteo
- `src/components/restaurant-advanced-control-workspace.tsx:32`: Variación actual versus teórica
- `src/components/restaurant-advanced-control-workspace.tsx:34`: Alertas de shrinkage
- `src/components/restaurant-advanced-control-workspace.tsx:34`: Detecta pérdidas, sobreporcionamiento, robo o registros incompletos a partir de la variación.
- `src/components/restaurant-advanced-control-workspace.tsx:36`: Auditoría inmutable
- `src/components/restaurant-advanced-control-workspace.tsx:36`: Registro de cambios de inventario que no puede editarse desde el cliente.
- `src/components/restaurant-commercial-intelligence-workspace.tsx:43`: Decisiones comerciales de inventario
- `src/components/restaurant-commercial-intelligence-workspace.tsx:43`: Pronostica demanda, controla costos, compara unidades y protege el presupuesto de compras.
- `src/components/restaurant-commercial-intelligence-workspace.tsx:57`: Almacén:
- `src/components/restaurant-commercial-intelligence-workspace.tsx:58`: Pronóstico de demanda
- `src/components/restaurant-commercial-intelligence-workspace.tsx:58`: Proyección de consumo para anticipar compras y reducir quiebres o sobreinventario.
- `src/components/restaurant-commercial-intelligence-workspace.tsx:59`: Compara compras, consumo, inventario y food cost por unidad operativa.
- `src/components/restaurant-commercial-intelligence-workspace.tsx:60`: Identifica recetas rentables y aquellas cuyo costo está erosionando el margen.
- `src/components/restaurant-commercial-intelligence-workspace.tsx:61`: Observa indicadores equivalentes entre sucursales para detectar mejores prácticas y desviaciones.
- `src/components/restaurant-commercial-intelligence-workspace.tsx:63`: Centraliza producción, abastecimiento y distribución interna entre sucursales.
- `src/components/restaurant-commercial-intelligence-workspace.tsx:63`: Crear
- `src/components/restaurant-commercial-intelligence-workspace.tsx:63`: No se pudo crear
- `src/components/restaurant-commercial-intelligence-workspace.tsx:64`: Presupuesto y control de compras
- `src/components/restaurant-commercial-intelligence-workspace.tsx:64`: Controla presupuesto, comprometido, recibido y disponible antes de confirmar compras.
- `src/components/restaurant-commercial-intelligence-workspace.tsx:64`: Guardar presupuesto
- `src/components/restaurant-commercial-intelligence-workspace.tsx:64`: No se pudo guardar

### /inventory/restaurant/dashboard

- `src/components/restaurant-inventory-shell.tsx:89`: Almacén:
- `src/components/restaurant-inventory-shell.tsx:184`: No hay registros para este contexto.
- `src/components/restaurant-inventory-shell.tsx:186`: Entradas de mercancía
- `src/components/restaurant-inventory-shell.tsx:186`: Confirma únicamente después de revisar el resumen. Un documento confirmado no puede editarse.
- `src/components/restaurant-inventory-shell.tsx:186`: Cancelar
- `src/components/restaurant-inventory-shell.tsx:188`: Producción
- `src/components/restaurant-inventory-shell.tsx:188`: El costo total, costo por porción y margen estimado son calculados por el backend.
- `src/components/restaurant-inventory-shell.tsx:188`: Porción
- `src/components/restaurant-inventory-shell.tsx:190`: Operación
- `src/components/restaurant-inventory-shell.tsx:190`: Registro de consumo
- `src/components/restaurant-inventory-shell.tsx:190`: Calcula el consumo con la vista previa del backend antes de confirmar.
- `src/components/restaurant-inventory-shell.tsx:190`: Vista previa del consumo
- `src/components/restaurant-inventory-shell.tsx:190`: Inventario insuficiente
- `src/components/restaurant-inventory-shell.tsx:192`: Registra la merma con motivo, cantidad, unidad y observaciones.
- `src/components/restaurant-inventory-shell.tsx:192`: El backend confirmó el movimiento.
- `src/components/restaurant-inventory-shell.tsx:194`: Consulta existencias, mínimos, costo promedio y valor total.
- `src/components/restaurant-inventory-shell.tsx:196`: Auditoría
- `src/components/restaurant-inventory-shell.tsx:196`: Consulta de solo lectura con documento de referencia y usuario.
- `src/components/access-state.tsx:23`: Verificando tu sesión y tu espacio de trabajo
- `src/components/access-state.tsx:138`: Código de soporte:
- `src/components/design-system.tsx:50`: Buscar funciones…
- `src/components/confirm-action.tsx:104`: Qué cambia
- `src/components/confirm-action.tsx:111`: El movimiento queda en la auditoría. Corregirlo exige registrar otra operación en sentido contrario.
- `src/components/restaurant-inventory-phase2.tsx:28`: Selecciona una sucursal para operar este módulo.
- `src/components/restaurant-inventory-phase2.tsx:29`: Permiso de gestión requerido
- `src/components/restaurant-inventory-phase2.tsx:29`: Tu perfil puede consultar, pero no modificar esta sección.
- `src/components/restaurant-inventory-phase2.tsx:46`: Operación diaria
- `src/components/restaurant-inventory-phase2.tsx:46`: Selecciona origen y destino, revisa el impacto y registra el envío.
- `src/components/restaurant-inventory-phase2.tsx:46`: No se pudo completar la transferencia
- `src/components/restaurant-inventory-phase2.tsx:46`: El borrador fue creado. La siguiente acción es enviarlo desde la lista.
- `src/components/restaurant-inventory-phase2.tsx:46`: Almacén origen
- `src/components/restaurant-inventory-phase2.tsx:46`: Almacén destino
- `src/components/restaurant-inventory-phase2.tsx:46`: Selecciona un almacén destino diferente al origen.
- `src/components/restaurant-inventory-phase2.tsx:46`: Las cantidades se expresan en la unidad de inventario configurada para cada producto.
- `src/components/restaurant-inventory-phase2.tsx:46`: Agregar línea
- `src/components/restaurant-inventory-phase2.tsx:46`: . Se registrarán
- `src/components/restaurant-inventory-phase2.tsx:46`: línea(s) como borrador. La existencia sólo cambiará al recibir.
- `src/components/restaurant-inventory-phase2.tsx:46`: Confirmar recepción
- `src/components/restaurant-inventory-phase2.tsx:46`: Cancelar transferencia
- `src/components/restaurant-inventory-phase2.tsx:50`: Registra la diferencia, revisa el saldo resultante y confirma el movimiento.
- `src/components/restaurant-inventory-phase2.tsx:50`: No se pudo aplicar el ajuste
- `src/components/restaurant-inventory-phase2.tsx:50`: Almacén
- `src/components/restaurant-inventory-phase2.tsx:50`: · diferencia de
- `src/components/restaurant-inventory-phase2.tsx:50`: unidades de inventario en
- `src/components/restaurant-inventory-phase2.tsx:50`: Confirmación irreversible
- `src/components/restaurant-inventory-phase2.tsx:50`: El ajuste modificará existencias y creará un movimiento auditable.
- `src/components/restaurant-inventory-phase2.tsx:50`: El movimiento fue creado y existencias, movimientos y métricas ya fueron actualizados.
- `src/components/restaurant-inventory-phase2.tsx:51`: Eliminar línea
- `src/components/restaurant-stock-count-workflow.tsx:278`: Control físico
- `src/components/restaurant-stock-count-workflow.tsx:279`: Conteo físico
- `src/components/restaurant-stock-count-workflow.tsx:280`: Cuenta en la estantería, compara contra lo que el sistema cree que hay y aprueba el ajuste.
- `src/components/restaurant-stock-count-workflow.tsx:283`: Almacén:
- `src/components/restaurant-stock-count-workflow.tsx:293`: No fue posible cargar el conteo físico
- `src/components/restaurant-stock-count-workflow.tsx:306`: Falta elegir el almacén
- `src/components/restaurant-stock-count-workflow.tsx:307`: Sin almacén no hay existencia teórica contra la que comparar. Selecciónalo arriba para empezar.
- `src/components/restaurant-stock-count-workflow.tsx:312`: No se pudo crear el conteo
- `src/components/restaurant-stock-count-workflow.tsx:319`: Captura del conteo
- `src/components/restaurant-stock-count-workflow.tsx:320`: Una línea por ingrediente contado. La observación es opcional.
- `src/components/restaurant-stock-count-workflow.tsx:336`: No se muestra la existencia que el sistema tiene registrada hasta el momento de aprobar, para que el conteo no se sesgue.
- `src/components/restaurant-stock-count-workflow.tsx:376`: Observación
- `src/components/restaurant-stock-count-workflow.tsx:402`: Comparar con el sistema
- `src/components/restaurant-stock-count-workflow.tsx:412`: La comparación queda oculta hasta la aprobación
- `src/components/restaurant-stock-count-workflow.tsx:413`: Elegiste conteo ciego: quien cuenta no ve la existencia registrada. El detalle completo aparece en el paso de aprobación.
- `src/components/restaurant-stock-count-workflow.tsx:435`: Corregir la captura
- `src/components/restaurant-stock-count-workflow.tsx:444`: Crear el conteo
- `src/components/restaurant-stock-count-workflow.tsx:468`: Descartar el conteo
- `src/components/restaurant-stock-count-workflow.tsx:476`: Enviar a revisión de otra persona
- `src/components/restaurant-stock-count-workflow.tsx:504`: Documentos abiertos que todavía no ajustaron el inventario.
- `src/components/restaurant-stock-count-workflow.tsx:526`: Todos los conteos registrados ya se aprobaron o se descartaron.
- `src/components/restaurant-inventory-context.tsx:131`: Almacén activo
- `src/components/restaurant-inventory-context.tsx:131`: Seleccionar almacén
- `src/components/restaurant-inventory-context.tsx:134`: No se pudieron cargar los almacenes
- `src/components/restaurant-inventory-context.tsx:135`: Sin almacenes disponibles
- `src/components/restaurant-inventory-context.tsx:135`: La sucursal actual no tiene un almacén activo asignado.
- `src/components/restaurant-inventory-ui.tsx:30`: No fue posible cargar la información
- `src/components/restaurant-stock-control-workspace.tsx:98`: Falta elegir la sucursal
- `src/components/restaurant-stock-control-workspace.tsx:199`: Bajo mínimo
- `src/components/restaurant-stock-control-workspace.tsx:236`: Busca ingredientes y detecta riesgos de mínimo, vencimiento o falta de movimiento.
- `src/components/restaurant-stock-control-workspace.tsx:281`: Bajo mínimo
- `src/components/restaurant-stock-control-workspace.tsx:284`: Sin movimiento
- `src/components/restaurant-stock-control-workspace.tsx:291`: Esta señal no está disponible
- `src/components/restaurant-stock-control-workspace.tsx:292`: El servidor no entrega la fecha del último movimiento en este listado, así que no se puede saber cuáles llevan tiempo quietos.
- `src/components/restaurant-stock-control-workspace.tsx:299`: No fue posible cargar las existencias
- `src/components/restaurant-stock-control-workspace.tsx:425`: Prioriza los lotes vencidos y los que están por vencer antes de tener que registrar una merma.
- `src/components/restaurant-stock-control-workspace.tsx:471`: No fue posible cargar los lotes
- `src/components/restaurant-stock-control-workspace.tsx:650`: Auditoría
- `src/components/restaurant-stock-control-workspace.tsx:651`: Kardex de movimientos
- `src/components/restaurant-stock-control-workspace.tsx:652`: Entradas, salidas y saldos. Los filtros se guardan por persona y sucursal.
- `src/components/restaurant-stock-control-workspace.tsx:718`: No fue posible cargar el Kardex
- `src/components/restaurant-stock-control-workspace.tsx:728`: Movimientos de inventario
- `src/components/restaurant-stock-control-workspace.tsx:774`: Cerrar el detalle
- `src/components/restaurant-stock-control-workspace.tsx:781`: Detalle del movimiento
- `src/components/restaurant-stock-control-workspace.tsx:787`: Detalle del movimiento
- `src/components/restaurant-stock-control-workspace.tsx:792`: Cerrar el detalle
- `src/components/restaurant-sales-import.tsx:79`: Inventario
- `src/components/restaurant-sales-import.tsx:79`: Carga ventas para generar consumos sólo después de validar y confirmar el procesamiento.
- `src/components/restaurant-sales-import.tsx:79`: de
- `src/components/restaurant-sales-import.tsx:79`: Sin impacto hasta confirmar
- `src/components/restaurant-sales-import.tsx:82`: Progreso de importación
- `src/components/restaurant-sales-import.tsx:84`: Arrastra tu archivo aquí o selecciónalo
- `src/components/restaurant-sales-import.tsx:84`: CSV o XLSX · máximo 10 MB
- `src/components/restaurant-sales-import.tsx:84`: Incluye ID de venta, código o nombre de producto, cantidad y fecha/hora. La primera fila debe contener encabezados.
- `src/components/restaurant-sales-import.tsx:86`: Forma de agrupación
- `src/components/restaurant-sales-import.tsx:86`: Por día
- `src/components/restaurant-sales-import.tsx:88`: Selecciona el encabezado del archivo para cada campo requerido. Los ejemplos provienen de la carga validada.
- `src/components/restaurant-sales-import.tsx:88`: Nombre de columna
- `src/components/restaurant-sales-import.tsx:90`: Relaciona cada producto externo con una receta existente. La correspondencia quedará guardada para futuras cargas.
- `src/components/restaurant-sales-import.tsx:90`: ID de receta
- `src/components/restaurant-sales-import.tsx:92`: Validación pendiente
- `src/components/restaurant-sales-import.tsx:92`: Carga un archivo para iniciar la validación.
- `src/components/restaurant-sales-import.tsx:94`: Sin errores por fila
- `src/components/restaurant-sales-import.tsx:94`: La validación no reportó errores de fila.
- `src/components/restaurant-sales-import.tsx:96`: Ejecuta la validación para generar la vista previa.
- `src/components/restaurant-sales-import.tsx:98`: Listo para procesar
- `src/components/restaurant-sales-import.tsx:98`: La importación aún no ha sido confirmada.
- `src/components/restaurant-sales-import.tsx:98`: Válidas
- `src/components/restaurant-sales-import.tsx:98`: Reintentar consulta
- `src/components/restaurant-sales-import.tsx:100`: Historial de importaciones
- `src/components/restaurant-reports.tsx:37`: Permiso de auditoría requerido
- `src/components/restaurant-reports.tsx:37`: Tu perfil no puede consultar la auditoría detallada.
- `src/components/restaurant-reports.tsx:42`: Reportes de inventario
- `src/components/restaurant-reports.tsx:42`: Almacén
- `src/components/restaurant-reports.tsx:42`: Categoría
- `src/components/restaurant-reports.tsx:44`: · Página
- `src/components/restaurant-reports.tsx:44`: de
- `src/components/restaurant-reports.tsx:44`: Resultados del informe
- `src/components/restaurant-reports.tsx:44`: Sin resultados
- `src/components/restaurant-reports.tsx:44`: No hay datos para los filtros aplicados.
- `src/components/restaurant-reports.tsx:46`: Costo de receta
- `src/components/restaurant-reports.tsx:46`: Costos, márgenes e historial se calculan y versionan en el backend.
- `src/components/restaurant-reports.tsx:46`: Selecciona una receta para consultar costo por porción, margen e historial.
- `src/components/restaurant-reports.tsx:46`: Costo por porción
- `src/components/restaurant-reports.tsx:50`: Consultando los datos más recientes.
- `src/components/restaurant-decision-dashboard.tsx:17`: Aún no hay datos de operación
- `src/components/restaurant-decision-dashboard.tsx:17`: Prioriza compras, vencimientos, mermas y diferencias con datos confirmados del backend.
- `src/components/restaurant-decision-dashboard.tsx:17`: Ingredientes críticos
- `src/components/restaurant-decision-dashboard.tsx:17`: Próximos vencimientos
- `src/components/restaurant-decision-dashboard.tsx:17`: Sugerencias de compra
- `src/components/restaurant-decision-dashboard.tsx:17`: Recetas de mayor costo
- `src/components/restaurant-decision-dashboard.tsx:18`: Abrir acción
- `src/components/restaurant-decision-dashboard.tsx:19`: Sin alertas
- `src/components/restaurant-decision-dashboard.tsx:20`: Sin datos para graficar
- `src/components/restaurant-reports-workspace.tsx:24`: Reportes para decidir
- `src/components/restaurant-reports-workspace.tsx:24`: Guarda filtros frecuentes y exporta los resultados para operación o dirección.
- `src/components/restaurant-reports-workspace.tsx:24`: Guardar filtros
- `src/components/restaurant-reports-workspace.tsx:24`: Estos filtros quedan disponibles para este usuario y sucursal.
- `src/components/restaurant-reports-workspace.tsx:25`: Resultado del informe
- `src/components/restaurant-reports-workspace.tsx:25`: Sin resultados
- `src/components/restaurant-reports-workspace.tsx:25`: Prueba otro rango de fechas o cambia el almacén para encontrar movimientos.
- `src/components/restaurant-reports-workspace.tsx:25`: Variación teórico vs real
- `src/components/restaurant-reports-workspace.tsx:25`: Revisa las filas con diferencia y genera un conteo físico o una acción de ajuste.
- `src/components/restaurant-inventory-catalog.tsx:91`: Catálogo
- `src/components/restaurant-inventory-catalog.tsx:91`: Datos maestros administrados por empresa y consultados desde el backend.
- `src/components/restaurant-inventory-catalog.tsx:123`: No se pudo completar la operación
- `src/components/restaurant-inventory-catalog.tsx:130`: No fue posible cargar el catálogo
- `src/components/restaurant-inventory-catalog.tsx:175`: ¿Desactivar «
- `src/components/restaurant-inventory-catalog.tsx:177`: Dejará de poder elegirse en recetas, compras y movimientos nuevos.
- `src/components/restaurant-inventory-catalog.tsx:181`: Los movimientos, recetas y documentos que ya lo usan siguen intactos y se pueden seguir consultando. Puedes volver a activarlo desde el filtro «Inactivos».
- `src/components/restaurant-inventory-catalog.tsx:321`: Nuevo almacén
- `src/components/restaurant-inventory-catalog.tsx:321`: Falta elegir la sucursal
- `src/components/restaurant-inventory-catalog.tsx:321`: Un almacén pertenece a una sucursal; elígela en la barra superior antes de crearlo.
- `src/components/restaurant-inventory-catalog.tsx:324`: Categoría
- `src/components/restaurant-inventory-catalog.tsx:324`: Unidad de inventario
- `src/components/restaurant-inventory-catalog.tsx:324`: Unidad de compra
- `src/components/restaurant-inventory-catalog.tsx:324`: No se pudieron cargar las opciones
- `src/components/restaurant-inventory-catalog.tsx:324`: No se pudo guardar
- `src/components/restaurant-inventory-catalog.tsx:324`: Cancelar
- `src/components/restaurant-receipts.tsx:58`: Entradas de mercancía
- `src/components/restaurant-receipts.tsx:58`: Crea borradores, revisa conversiones calculadas por el backend y confirma sólo cuando el detalle sea correcto.
- `src/components/restaurant-receipts.tsx:59`: No se pudieron cargar los catálogos
- `src/components/restaurant-receipts.tsx:60`: No se pudo completar la operación
- `src/components/restaurant-receipts.tsx:62`: Selecciona una sucursal para consultar entradas.
- `src/components/restaurant-receipts.tsx:71`: Los documentos procesados no pueden editarse.
- `src/components/restaurant-receipts.tsx:75`: Entrada de mercancía
- `src/components/restaurant-receipts.tsx:75`: Almacén
- `src/components/restaurant-receipts.tsx:75`: Unidad de compra
- `src/components/restaurant-receipts.tsx:75`: Cálculo del backend
- `src/components/restaurant-receipts.tsx:75`: Sin movimientos aún
- `src/components/restaurant-receipts.tsx:75`: Cancelar
- `src/components/restaurant-receipts.tsx:75`: Guardar borrador
- `src/components/restaurant-receipts.tsx:75`: No hay sucursal activa para guardar la entrada.
- `src/components/restaurant-receipts.tsx:78`: Bandeja de pendientes
- `src/components/restaurant-receipts.tsx:78`: Entradas guardadas que aún no actualizan existencias.
- `src/components/restaurant-receipts.tsx:78`: No hay documentos pendientes para esta sucursal.
- `src/components/restaurant-receipts.tsx:80`: Documentos de entrada
- `src/components/restaurant-receipts.tsx:80`: Los documentos confirmados son sólo lectura.
- `src/components/restaurant-receipts.tsx:80`: Cancelar
- `src/components/restaurant-receipts.tsx:80`: No hay entradas para la sucursal actual.
- `src/components/restaurant-receipts.tsx:94`: Impacto de la recepción por ingrediente
- `src/components/restaurant-receipts.tsx:117`: Revisa el resumen antes de aplicar el documento.
- `src/components/restaurant-receipts.tsx:117`: Esta acción es irreversible
- `src/components/restaurant-receipts.tsx:117`: Al confirmar, se actualizarán existencias, costos, lotes y movimientos. El documento no podrá editarse.
- `src/components/restaurant-receipt-wizard.tsx:40`: Entrada de mercancía
- `src/components/restaurant-receipt-wizard.tsx:40`: Completa el flujo y revisa el impacto antes de confirmar.
- `src/components/restaurant-receipt-wizard.tsx:41`: Pasos de la entrada
- `src/components/restaurant-receipt-wizard.tsx:42`: 1. Proveedor y almacén
- `src/components/restaurant-receipt-wizard.tsx:42`: Almacén
- `src/components/restaurant-receipt-wizard.tsx:43`: La conversión a unidad de inventario la calcula el backend.
- `src/components/restaurant-receipt-wizard.tsx:43`: Agregar línea
- `src/components/restaurant-receipt-wizard.tsx:43`: Unidad de compra
- `src/components/restaurant-receipt-wizard.tsx:44`: Registra la trazabilidad de cada línea antes de calcular el impacto.
- `src/components/restaurant-receipt-wizard.tsx:45`: No hay movimientos aplicados hasta confirmar el documento.
- `src/components/restaurant-receipt-wizard.tsx:45`: Calcula la vista previa para conocer cantidades, conversiones y costo estimado.
- `src/components/restaurant-receipt-wizard.tsx:46`: 5. Confirmación
- `src/components/restaurant-receipt-wizard.tsx:46`: Confirmación irreversible
- `src/components/restaurant-receipt-wizard.tsx:46`: Al confirmar se actualizarán existencias, lotes, movimientos y costo promedio del almacén seleccionado.
- `src/components/restaurant-receipt-wizard.tsx:46`: Primero se guardará el documento como borrador y luego podrás confirmar la aplicación.
- `src/components/restaurant-receipt-wizard.tsx:46`: Falta la vista previa
- `src/components/restaurant-receipt-wizard.tsx:46`: Regresa al paso anterior y calcula el impacto antes de continuar.
- `src/components/restaurant-receipt-wizard.tsx:47`: Cancelar
- `src/components/restaurant-receipt-wizard.tsx:47`: Revisar confirmación
- `src/components/restaurant-receipt-wizard.tsx:47`: Guardar y confirmar
- `src/components/restaurant-receipt-wizard.tsx:48`: No hay sucursal activa para guardar la entrada.
- `src/components/restaurant-receipt-wizard.tsx:52`: Impacto de la recepción por ingrediente
- `src/components/restaurant-operations.tsx:54`: Selecciona una sucursal para operar el inventario de restaurante.
- `src/components/restaurant-operations.tsx:57`: No fue posible cargar los catálogos
- `src/components/restaurant-operations.tsx:74`: Configuración
- `src/components/restaurant-operations.tsx:74`: Define ingredientes y rendimiento. El costo se calcula en el backend.
- `src/components/restaurant-operations.tsx:74`: No se pudo guardar
- `src/components/restaurant-operations.tsx:74`: Código
- `src/components/restaurant-operations.tsx:74`: Unidad de rendimiento
- `src/components/restaurant-operations.tsx:74`: Precio de venta
- `src/components/restaurant-operations.tsx:74`: Política de stock
- `src/components/restaurant-operations.tsx:74`: Descripción
- `src/components/restaurant-operations.tsx:74`: Unidad de inventario
- `src/components/restaurant-operations.tsx:74`: Validación
- `src/components/restaurant-operations.tsx:74`: El backend calculó el costo de la receta y guardó el documento.
- `src/components/restaurant-operations.tsx:277`: Operación diaria
- `src/components/restaurant-operations.tsx:279`: Registra, revisa cómo queda el almacén y confirma.
- `src/components/restaurant-operations.tsx:280`: Almacén:
- `src/components/restaurant-operations.tsx:286`: Falta elegir el almacén
- `src/components/restaurant-operations.tsx:287`: Selecciona un almacén antes de registrar la
- `src/components/restaurant-operations.tsx:292`: No se pudo preparar la operación
- `src/components/restaurant-operations.tsx:346`: Autorizar el faltante
- `src/components/restaurant-operations.tsx:348`: El servidor permite registrar la salida aunque no haya existencia suficiente, pero exige dejar por escrito por qué. Queda en la auditoría a nombre de
- `src/components/restaurant-operations.tsx:352`: Justificación
- `src/components/restaurant-operations.tsx:357`: Explica por qué se autoriza el faltante
- `src/components/restaurant-operations.tsx:361`: caracteres mínimos
- `src/components/restaurant-operations.tsx:367`: Corregir el registro
- `src/components/restaurant-operations.tsx:393`: Descartar el borrador
- `src/components/restaurant-production-workflow.tsx:313`: Operación diaria
- `src/components/restaurant-production-workflow.tsx:314`: Producción
- `src/components/restaurant-production-workflow.tsx:315`: Elige las recetas, define cantidades, revisa cómo queda el almacén y confirma.
- `src/components/restaurant-production-workflow.tsx:316`: Almacén:
- `src/components/restaurant-production-workflow.tsx:322`: Falta elegir el almacén
- `src/components/restaurant-production-workflow.tsx:323`: Sin almacén no se sabe de dónde salen los ingredientes. Selecciónalo arriba para continuar.
- `src/components/restaurant-production-workflow.tsx:328`: No se pudo calcular el impacto
- `src/components/restaurant-production-workflow.tsx:336`: Puedes agrupar varias recetas en una misma operación.
- `src/components/restaurant-production-workflow.tsx:385`: Cuánto se planificó producir y cuánto rindió realmente.
- `src/components/restaurant-production-workflow.tsx:421`: Cambiar las recetas
- `src/components/restaurant-production-workflow.tsx:441`: Autorizar el faltante
- `src/components/restaurant-production-workflow.tsx:443`: El servidor permite producir aunque no haya existencia suficiente, pero exige dejar por escrito por qué. Queda en la auditoría a nombre de
- `src/components/restaurant-production-workflow.tsx:447`: Justificación
- `src/components/restaurant-production-workflow.tsx:452`: Explica por qué se autoriza el faltante
- `src/components/restaurant-production-workflow.tsx:456`: caracteres mínimos
- `src/components/restaurant-production-workflow.tsx:464`: Corregir las cantidades
- `src/components/restaurant-production-workflow.tsx:511`: Producción pendiente
- `src/components/restaurant-production-workflow.tsx:512`: Documentos en borrador que todavía no actualizan existencias.
- `src/components/restaurant-production-workflow.tsx:519`: Cargando la producción pendiente
- `src/components/restaurant-production-workflow.tsx:538`: No hay producción pendiente
- `src/components/restaurant-production-workflow.tsx:539`: Todo lo registrado ya se aplicó al inventario.
- `src/components/restaurant-waste-workflow.tsx:233`: Operación diaria
- `src/components/restaurant-waste-workflow.tsx:235`: Anota lo que se perdió, revisa cómo queda el almacén y confirma.
- `src/components/restaurant-waste-workflow.tsx:236`: Almacén:
- `src/components/restaurant-waste-workflow.tsx:249`: Falta elegir el almacén
- `src/components/restaurant-waste-workflow.tsx:250`: Selecciona un almacén antes de registrar la merma: sin él no se sabe de dónde sale el producto.
- `src/components/restaurant-waste-workflow.tsx:255`: No se pudo preparar la merma
- `src/components/restaurant-waste-workflow.tsx:262`: Qué se perdió
- `src/components/restaurant-waste-workflow.tsx:286`: Detalle opcional de la merma
- `src/components/restaurant-waste-workflow.tsx:367`: Corregir el registro
- `src/components/restaurant-waste-workflow.tsx:450`: Mermas sin confirmar
- `src/components/restaurant-waste-workflow.tsx:451`: Quedaron preparadas pero todavía no salieron del almacén.
- `src/components/restaurant-recipes-workspace.tsx:218`: Código
- `src/components/restaurant/restaurant-module-panel.tsx:166`: Cargando el estado del inventario
- `src/components/restaurant/restaurant-module-panel.tsx:172`: No fue posible cargar el estado del inventario
- `src/components/restaurant/restaurant-module-panel.tsx:218`: Empieza por aquí
- `src/components/restaurant/restaurant-module-panel.tsx:228`: No hay nada urgente en este almacén
- `src/components/restaurant/restaurant-module-panel.tsx:229`: Sin faltantes, sin lotes por vencer y sin entradas esperando confirmación. Puedes seguir con la operación del día.
- `src/components/restaurant/restaurant-module-panel.tsx:234`: Estado del inventario
- `src/components/restaurant/restaurant-module-panel.tsx:237`: Bajo mínimo
- `src/components/restaurant/restaurant-module-panel.tsx:248`: Próximos a vencer
- `src/components/restaurant/restaurant-module-panel.tsx:270`: Valor del inventario
- `src/components/restaurant/restaurant-module-panel.tsx:281`: Diferencia de conteo
- `src/components/restaurant/restaurant-module-panel.tsx:296`: Productos bajo mínimo
- `src/components/restaurant/restaurant-module-panel.tsx:320`: mínimo
- `src/components/restaurant/restaurant-module-panel.tsx:323`: Bajo mínimo
- `src/components/restaurant/restaurant-module-panel.tsx:332`: Lotes próximos a vencer
- `src/components/restaurant/restaurant-module-panel.tsx:333`: Registra la merma o dales salida antes de perder el producto.
- `src/components/restaurant/restaurant-module-panel.tsx:361`: Operaciones del día
- `src/components/restaurant/restaurant-module-panel.tsx:425`: Cargando el consumo del periodo
- `src/components/restaurant/restaurant-module-panel.tsx:427`: No fue posible cargar la tendencia
- `src/components/restaurant/restaurant-module-panel.tsx:428`: El resto del panel sigue siendo válido. Vuelve a cargar para reintentarlo.
- `src/components/restaurant/restaurant-module-panel.tsx:441`: Consumo registrado en cada periodo cerrado del almacén activo.
- `src/components/restaurant-purchasing-workspace.tsx:32`: Ordena, aprueba, recibe y controla costos de proveedores desde un mismo flujo.
- `src/components/restaurant-purchasing-workspace.tsx:32`: Órdenes de compra
- `src/components/restaurant-purchasing-workspace.tsx:43`: No se pudo actualizar la orden
- `src/components/restaurant-purchasing-workspace.tsx:43`: Órdenes de compra
- `src/components/restaurant-purchasing-workspace.tsx:43`: Recepción parcial, diferencias de precio y aprobación quedan trazadas.
- `src/components/restaurant-purchasing-workspace.tsx:55`: Nueva orden de compra
- `src/components/restaurant-purchasing-workspace.tsx:55`: Almacén:
- `src/components/restaurant-purchasing-workspace.tsx:55`: No se pudo guardar
- `src/components/restaurant-purchasing-workspace.tsx:55`: Agregar línea
- `src/components/restaurant-purchasing-workspace.tsx:55`: Eliminar línea
- `src/components/restaurant-purchasing-workspace.tsx:55`: Cancelar
- `src/components/restaurant-purchasing-workspace.tsx:60`: Órdenes de compra
- `src/components/restaurant-purchasing-workspace.tsx:60`: No hay órdenes para el contexto actual.
- `src/components/restaurant-purchasing-workspace.tsx:63`: Historial de precios por proveedor
- `src/components/restaurant-purchasing-workspace.tsx:63`: Compara último costo, promedio y variación antes de crear una orden.
- `src/components/restaurant-purchasing-workspace.tsx:65`: La cantidad considera existencia, nivel objetivo y días de cobertura.
- `src/components/restaurant-purchasing-workspace.tsx:65`: días
- `src/components/restaurant-purchasing-workspace.tsx:67`: Bandeja de facturas OCR
- `src/components/restaurant-purchasing-workspace.tsx:67`: Carga facturas para extracción y revisión antes de conciliarlas con una orden.
- `src/components/restaurant-purchasing-workspace.tsx:67`: No se pudo procesar la factura
- `src/components/restaurant-advanced-control-workspace.tsx:25`: Control avanzado de inventario
- `src/components/restaurant-advanced-control-workspace.tsx:25`: FEFO, vencimientos, conteos programados, variación y auditoría inmutable.
- `src/components/restaurant-advanced-control-workspace.tsx:25`: Teórico vs real
- `src/components/restaurant-advanced-control-workspace.tsx:25`: Auditoría inmutable
- `src/components/restaurant-advanced-control-workspace.tsx:28`: FEFO y alertas de vencimiento
- `src/components/restaurant-advanced-control-workspace.tsx:28`: Prioriza el lote con vencimiento más próximo y evita consumir lotes posteriores antes de tiempo.
- `src/components/restaurant-advanced-control-workspace.tsx:30`: Programa conteos por zona o ingredientes críticos sin bloquear toda la operación.
- `src/components/restaurant-advanced-control-workspace.tsx:30`: Próximo conteo
- `src/components/restaurant-advanced-control-workspace.tsx:32`: Variación actual versus teórica
- `src/components/restaurant-advanced-control-workspace.tsx:34`: Alertas de shrinkage
- `src/components/restaurant-advanced-control-workspace.tsx:34`: Detecta pérdidas, sobreporcionamiento, robo o registros incompletos a partir de la variación.
- `src/components/restaurant-advanced-control-workspace.tsx:36`: Auditoría inmutable
- `src/components/restaurant-advanced-control-workspace.tsx:36`: Registro de cambios de inventario que no puede editarse desde el cliente.
- `src/components/restaurant-commercial-intelligence-workspace.tsx:43`: Decisiones comerciales de inventario
- `src/components/restaurant-commercial-intelligence-workspace.tsx:43`: Pronostica demanda, controla costos, compara unidades y protege el presupuesto de compras.
- `src/components/restaurant-commercial-intelligence-workspace.tsx:57`: Almacén:
- `src/components/restaurant-commercial-intelligence-workspace.tsx:58`: Pronóstico de demanda
- `src/components/restaurant-commercial-intelligence-workspace.tsx:58`: Proyección de consumo para anticipar compras y reducir quiebres o sobreinventario.
- `src/components/restaurant-commercial-intelligence-workspace.tsx:59`: Compara compras, consumo, inventario y food cost por unidad operativa.
- `src/components/restaurant-commercial-intelligence-workspace.tsx:60`: Identifica recetas rentables y aquellas cuyo costo está erosionando el margen.
- `src/components/restaurant-commercial-intelligence-workspace.tsx:61`: Observa indicadores equivalentes entre sucursales para detectar mejores prácticas y desviaciones.
- `src/components/restaurant-commercial-intelligence-workspace.tsx:63`: Centraliza producción, abastecimiento y distribución interna entre sucursales.
- `src/components/restaurant-commercial-intelligence-workspace.tsx:63`: Crear
- `src/components/restaurant-commercial-intelligence-workspace.tsx:63`: No se pudo crear
- `src/components/restaurant-commercial-intelligence-workspace.tsx:64`: Presupuesto y control de compras
- `src/components/restaurant-commercial-intelligence-workspace.tsx:64`: Controla presupuesto, comprometido, recibido y disponible antes de confirmar compras.
- `src/components/restaurant-commercial-intelligence-workspace.tsx:64`: Guardar presupuesto
- `src/components/restaurant-commercial-intelligence-workspace.tsx:64`: No se pudo guardar

### /inventory/returns

- `src/app/(app)/inventory/returns/page.tsx:4`: Devoluciones y validación
- `src/components/inventory-workspace.tsx:250`: Elige un activo disponible y usa «Asignar». La entrega quedará ligada a su expediente de incorporación
- `src/components/inventory-workspace.tsx:255`: La persona no está en esta sucursal
- `src/components/inventory-workspace.tsx:256`: Cambia de sucursal arriba para poder asignarle un activo.
- `src/components/inventory-workspace.tsx:283`: Buscar
- `src/components/inventory-workspace.tsx:287`: Etiqueta, número de serie o tipo de activo
- `src/components/inventory-workspace.tsx:301`: Todos los estados
- `src/components/inventory-workspace.tsx:315`: No fue posible cargar el inventario
- `src/components/inventory-workspace.tsx:327`: Activos del inventario
- `src/components/inventory-workspace.tsx:335`: Registrar el primer activo
- `src/components/inventory-workspace.tsx:364`: Todavía no hay tipos de activo
- `src/components/inventory-workspace.tsx:367`: Crear un tipo de activo
- `src/components/inventory-workspace.tsx:371`: Cada activo pertenece a un tipo (portátil, monitor, taladro). Crea el primero para poder registrar activos.
- `src/components/inventory-workspace.tsx:475`: En custodia de
- `src/components/inventory-workspace.tsx:499`: Registrar la entrega
- `src/components/inventory-workspace.tsx:505`: Solicitar devolución
- `src/components/inventory-workspace.tsx:510`: Recibir el activo
- `src/components/inventory-workspace.tsx:515`: Validar en qué estado llegó
- `src/components/inventory-workspace.tsx:523`: Dar de baja
- `src/components/inventory-workspace.tsx:531`: Historial del activo
- `src/components/inventory-workspace.tsx:536`: Todavía no hay movimientos registrados para este activo.
- `src/components/inventory-workspace.tsx:563`: Cada movimiento queda en la auditoría y no se puede borrar.
- `src/components/inventory-workspace.tsx:758`: Nombre del tipo de activo
- `src/components/inventory-workspace.tsx:769`: Tipo de activo
- `src/components/inventory-workspace.tsx:783`: Etiqueta única
- `src/components/inventory-workspace.tsx:789`: Número de serie
- `src/components/inventory-workspace.tsx:813`: Sucursal de destino
- `src/components/inventory-workspace.tsx:832`: ¿En qué estado queda?
- `src/components/inventory-workspace.tsx:862`: Queda adjunta al movimiento del activo y no se puede sustituir después.
- `src/components/inventory-workspace.tsx:868`: No se pudo completar la operación
- `src/components/inventory-workspace.tsx:1088`: Condición

### /inventory/scan

- `src/app/(app)/inventory/scan/page.tsx:41`: Operación móvil
- `src/app/(app)/inventory/scan/page.tsx:43`: Escribe la etiqueta, o escanéala con el lector del dispositivo, para ver de quién es y en qué estado está.
- `src/app/(app)/inventory/scan/page.tsx:46`: Etiqueta del activo
- `src/app/(app)/inventory/scan/page.tsx:48`: Si tu dispositivo tiene lector de códigos, colócate en este campo y escanea: el valor se escribe solo.
- `src/app/(app)/inventory/scan/page.tsx:81`: No se encontró el activo
- `src/app/(app)/inventory/scan/page.tsx:120`: En custodia de

### /inventory/warehouse

- `src/components/inventory-warehouse-panel.tsx:144`: Bajo mínimo
- `src/components/inventory-warehouse-panel.tsx:185`: Inventario
- `src/components/inventory-warehouse-panel.tsx:186`: Almacén y stock
- `src/components/inventory-warehouse-panel.tsx:187`: Existencias no serializadas, ubicaciones, conteos y ajustes, con trazabilidad por sucursal.
- `src/components/inventory-warehouse-panel.tsx:193`: Nueva ubicación
- `src/components/inventory-warehouse-panel.tsx:208`: Registra la recepción de una compra o un ajuste para que la existencia vuelva a cuadrar con lo que hay en la estantería.
- `src/components/inventory-warehouse-panel.tsx:214`: Referencias en almacén
- `src/components/inventory-warehouse-panel.tsx:216`: Bajo mínimo
- `src/components/inventory-warehouse-panel.tsx:228`: Buscar
- `src/components/inventory-warehouse-panel.tsx:235`: SKU o nombre del artículo
- `src/components/inventory-warehouse-panel.tsx:266`: No fue posible cargar el almacén
- `src/components/inventory-warehouse-panel.tsx:277`: Existencias por artículo
- `src/components/inventory-warehouse-panel.tsx:286`: Añadir
- `src/components/inventory-warehouse-panel.tsx:456`: Código
- `src/components/inventory-warehouse-panel.tsx:457`: Almacén principal
- `src/components/inventory-warehouse-panel.tsx:458`: Almacén, sala, estante…
- `src/components/inventory-warehouse-panel.tsx:474`: Ubicación (opcional)
- `src/components/inventory-warehouse-panel.tsx:519`: Stock mínimo
- `src/components/inventory-warehouse-panel.tsx:527`: Punto de reposición
- `src/components/inventory-warehouse-panel.tsx:535`: Stock máximo
- `src/components/inventory-warehouse-panel.tsx:546`: No se pudo guardar
- `src/components/inventory-warehouse-panel.tsx:570`: Crear la ubicación

### /login

- `src/components/integration-state.tsx:15`: Modo de prueba local: los datos y acciones de esta sesión no son productivos.
- `src/components/design-system.tsx:50`: Buscar funciones…

### /notifications

- `src/components/design-system.tsx:50`: Buscar funciones…
- `src/components/ui.tsx:199`: Cargando la pantalla
- `src/components/ui.tsx:213`: Cargando los registros

### /onboarding/analytics

- `src/app/(app)/onboarding/analytics/page.tsx:15`: Calculando analítica de incorporación
- `src/app/(app)/onboarding/analytics/page.tsx:16`: No pudimos cargar la analítica
- `src/app/(app)/onboarding/analytics/page.tsx:18`: Analítica de incorporación
- `src/app/(app)/onboarding/analytics/page.tsx:18`: Mide tiempos operativos, cumplimiento y riesgo de abandono con señales explicables.
- `src/app/(app)/onboarding/analytics/page.tsx:21`: Riesgo de no incorporación o abandono
- `src/app/(app)/onboarding/analytics/page.tsx:21`: No hay expedientes con señales de riesgo activas.
- `src/app/(app)/onboarding/analytics/page.tsx:26`: Aún no hay tareas completadas suficientes.
- `src/app/(app)/onboarding/analytics/page.tsx:27`: Sin datos para comparar.
- `src/components/design-system.tsx:50`: Buscar funciones…

### /onboarding/compliance

- `src/app/(app)/onboarding/compliance/page.tsx:36`: Cumplimiento de incorporación
- `src/app/(app)/onboarding/compliance/page.tsx:36`: Gobierna contenido reutilizable, conservación de expedientes y evidencia de firma por país.
- `src/app/(app)/onboarding/compliance/page.tsx:38`: Tareas, documentos y políticas disponibles para diseñar nuevas versiones de plantillas.
- `src/app/(app)/onboarding/compliance/page.tsx:38`: Política
- `src/app/(app)/onboarding/compliance/page.tsx:38`: Descripción
- `src/app/(app)/onboarding/compliance/page.tsx:39`: Retención y legal hold
- `src/app/(app)/onboarding/compliance/page.tsx:39`: Las reglas definen conservación mínima. Un legal hold activo bloquea la eliminación de documentos del expediente. La aprobación registra una revisión operativa por país, pero no sustituye el criterio de asesoría jurídica local.
- `src/app/(app)/onboarding/compliance/page.tsx:39`: País
- `src/app/(app)/onboarding/compliance/page.tsx:39`: Categoría
- `src/app/(app)/onboarding/compliance/page.tsx:39`: Días de retención
- `src/app/(app)/onboarding/compliance/page.tsx:39`: Guardar regla
- `src/app/(app)/onboarding/compliance/page.tsx:39`: días
- `src/app/(app)/onboarding/compliance/page.tsx:39`: Registrar revisión local
- `src/app/(app)/onboarding/compliance/page.tsx:41`: Perfil de evidencia para firma electrónica
- `src/app/(app)/onboarding/compliance/page.tsx:41`: País
- `src/app/(app)/onboarding/compliance/page.tsx:42`: Control del expediente
- `src/app/(app)/onboarding/compliance/page.tsx:42`: Selecciona una incorporación
- `src/app/(app)/onboarding/compliance/page.tsx:42`: Motivo del legal hold
- `src/app/(app)/onboarding/compliance/page.tsx:42`: Litigio, auditoría o investigación
- `src/components/design-system.tsx:50`: Buscar funciones…

### /onboarding/dashboard

- `src/components/onboarding/onboarding-module-dashboard.tsx:72`: Dashboard de incorporación
- `src/components/onboarding/onboarding-module-dashboard.tsx:75`: No tienes acceso a las incorporaciones
- `src/components/onboarding/onboarding-module-dashboard.tsx:76`: Pide a quien administra la empresa el permiso para ver incorporaciones.
- `src/components/onboarding/onboarding-module-dashboard.tsx:135`: Dashboard de incorporación
- `src/components/onboarding/onboarding-module-dashboard.tsx:136`: Cómo van las incorporaciones de la sucursal, cuáles necesitan atención y qué hacer ahora.
- `src/components/onboarding/onboarding-module-dashboard.tsx:150`: No fue posible cargar las incorporaciones
- `src/components/onboarding/onboarding-module-dashboard.tsx:176`: No fue posible cargar la analítica de incorporación
- `src/components/onboarding/onboarding-module-dashboard.tsx:181`: Estado de las incorporaciones
- `src/components/onboarding/onboarding-module-dashboard.tsx:199`: Ver analítica
- `src/components/onboarding/onboarding-module-dashboard.tsx:225`: Las cifras de arriba se cuentan sobre las cargadas. El listado completo está en Incorporaciones.
- `src/components/onboarding/onboarding-module-dashboard.tsx:229`: Operaciones del módulo
- `src/components/onboarding/onboarding-module-dashboard.tsx:229`: Cada pantalla dice para qué sirve, con icono y texto.
- `src/components/onboarding/onboarding-module-dashboard.tsx:233`: Analítica
- `src/components/onboarding/onboarding-module-dashboard.tsx:244`: Requieren atención
- `src/components/onboarding/onboarding-module-dashboard.tsx:245`: Alertas graves, tareas vencidas o bloqueadas. Primero las más urgentes.
- `src/components/onboarding/onboarding-module-dashboard.tsx:248`: Incorporaciones que requieren atención
- `src/components/onboarding/onboarding-module-dashboard.tsx:276`: Cambió hace poco
- `src/components/onboarding/onboarding-module-dashboard.tsx:276`: Los últimos movimientos registrados en las incorporaciones cargadas.
- `src/components/onboarding/onboarding-module-dashboard.tsx:280`: Sin movimientos todavía
- `src/components/onboarding/onboarding-module-dashboard.tsx:280`: Cuando una incorporación avance, aparecerá aquí.

### /onboarding/documents

- `src/app/(app)/onboarding/documents/page.tsx:473`: Cada persona que entra, con sus tareas, responsables y evidencias hasta el primer día.
- `src/app/(app)/onboarding/documents/page.tsx:509`: En incorporación
- `src/app/(app)/onboarding/documents/page.tsx:521`: No pudimos cargar las incorporaciones
- `src/app/(app)/onboarding/documents/page.tsx:609`: Continuar la incorporación en otro módulo
- `src/app/(app)/onboarding/documents/page.tsx:618`: Inventario
- `src/app/(app)/onboarding/documents/page.tsx:623`: Capacitación
- `src/app/(app)/onboarding/documents/page.tsx:632`: Empleados en incorporación
- `src/app/(app)/onboarding/documents/page.tsx:633`: Empleados en incorporación
- `src/app/(app)/onboarding/documents/page.tsx:677`: de
- `src/app/(app)/onboarding/documents/page.tsx:688`: Esta incorporación no tiene plantilla
- `src/app/(app)/onboarding/documents/page.tsx:714`: Aplica una plantilla para estandarizar responsables, fechas y dependencias.
- `src/app/(app)/onboarding/documents/page.tsx:767`: Firmas de incorporación
- `src/app/(app)/onboarding/documents/page.tsx:796`: Sin paquetes de firma
- `src/app/(app)/onboarding/documents/page.tsx:797`: Crea el paquete desde Firma electrónica; al completarse actualizará automáticamente este onboarding.
- `src/app/(app)/onboarding/documents/page.tsx:826`: Cierre del expediente
- `src/app/(app)/onboarding/documents/page.tsx:848`: Versiones de plantillas
- `src/app/(app)/onboarding/documents/page.tsx:849`: Crea nuevas versiones sin modificar los expedientes que ya utilizan una versión anterior.
- `src/app/(app)/onboarding/documents/page.tsx:859`: Nueva versión
- `src/app/(app)/onboarding/documents/page.tsx:883`: . La observación quedará visible y auditada.
- `src/app/(app)/onboarding/documents/page.tsx:893`: Define la caducidad de
- `src/app/(app)/onboarding/documents/page.tsx:893`: o déjala vacía si no expira.
- `src/app/(app)/onboarding/documents/page.tsx:894`: Fecha de caducidad
- `src/app/(app)/onboarding/documents/page.tsx:894`: Guardar vigencia
- `src/app/(app)/onboarding/documents/page.tsx:900`: La nueva carga será la versión
- `src/app/(app)/onboarding/documents/page.tsx:900`: ; la anterior conservará su trazabilidad.
- `src/app/(app)/onboarding/documents/page.tsx:902`: Cargar nueva versión
- `src/app/(app)/onboarding/documents/page.tsx:911`: Diseña un checklist reutilizable. El orden determina qué tareas pueden configurarse como dependencias.
- `src/app/(app)/onboarding/documents/page.tsx:925`: Descripción
- `src/app/(app)/onboarding/documents/page.tsx:944`: Se propondrá automáticamente durante nuevas contrataciones.
- `src/app/(app)/onboarding/documents/page.tsx:951`: Tareas de la lista de verificación
- `src/app/(app)/onboarding/documents/page.tsx:953`: Configura responsables, vencimientos y dependencias antes de guardar.
- `src/app/(app)/onboarding/documents/page.tsx:1001`: La plantilla está vacía
- `src/app/(app)/onboarding/documents/page.tsx:1002`: Agrega una tarea para poder crear el checklist.
- `src/app/(app)/onboarding/documents/page.tsx:1011`: Revisa la configuración
- `src/app/(app)/onboarding/documents/page.tsx:1042`: Responsable y fecha límite
- `src/app/(app)/onboarding/documents/page.tsx:1044`: . Asigna una persona concreta o deriva la tarea al equipo operativo correspondiente.
- `src/app/(app)/onboarding/documents/page.tsx:1049`: Tipo de responsable
- `src/app/(app)/onboarding/documents/page.tsx:1089`: Cargando personas de la sucursal…
- `src/app/(app)/onboarding/documents/page.tsx:1106`: La tarea aparecerá en la cola funcional de este responsable sin vincularse a una persona concreta.
- `src/app/(app)/onboarding/documents/page.tsx:1111`: Fecha límite
- `src/app/(app)/onboarding/documents/page.tsx:1157`: . Registra la causa y el contexto necesario para que el responsable pueda resolverla.
- `src/app/(app)/onboarding/documents/page.tsx:1162`: Motivo del bloqueo
- `src/app/(app)/onboarding/documents/page.tsx:1194`: Describe qué falta, quién debe intervenir y cualquier dato útil para resolver el bloqueo.
- `src/app/(app)/onboarding/documents/page.tsx:1199`: Esta observación quedará visible en el checklist y registrada en el timeline.
- `src/app/(app)/onboarding/documents/page.tsx:1237`: PDF, JPEG o PNG, máximo 15 MB. El archivo se analiza, almacena de forma privada y queda pendiente de revisión.
- `src/app/(app)/onboarding/documents/page.tsx:1254`: Validación en dos etapas
- `src/app/(app)/onboarding/documents/page.tsx:1255`: El navegador valida formato y tamaño antes del envío. La revisión y descarga solo se habilitan cuando el servidor confirma escaneo seguro y almacenamiento privado.
- `src/app/(app)/onboarding/documents/page.tsx:1345`: Título
- `src/app/(app)/onboarding/documents/page.tsx:1353`: Tipo de tarea
- `src/app/(app)/onboarding/documents/page.tsx:1376`: Descripción
- `src/app/(app)/onboarding/documents/page.tsx:1413`: Vence después de
- `src/app/(app)/onboarding/documents/page.tsx:1428`: días
- `src/app/(app)/onboarding/documents/page.tsx:1479`: Es la primera tarea y puede comenzar sin dependencias.
- `src/app/(app)/onboarding/documents/page.tsx:1492`: Tarea obligatoria para completar la incorporación
- `src/app/(app)/onboarding/documents/page.tsx:1529`: Configura el trabajo individual sin modificar la plantilla de origen.
- `src/app/(app)/onboarding/documents/page.tsx:1532`: Título
- `src/app/(app)/onboarding/documents/page.tsx:1533`: Descripción
- `src/app/(app)/onboarding/documents/page.tsx:1538`: Obligatoria para cerrar el expediente
- `src/app/(app)/onboarding/documents/page.tsx:1643`: Más
- `src/app/(app)/onboarding/documents/page.tsx:1654`: Cancelar tarea
- `src/app/(app)/onboarding/documents/page.tsx:1669`: Esta incorporación todavía no tiene tareas.
- `src/app/(app)/onboarding/documents/page.tsx:1673`: de
- `src/app/(app)/onboarding/documents/page.tsx:1752`: Sin actividad registrada
- `src/app/(app)/onboarding/documents/page.tsx:1753`: Las actualizaciones de tareas y documentos aparecerán aquí con fecha y responsable.
- `src/app/(app)/onboarding/documents/page.tsx:1785`: Sin documentos cargados
- `src/app/(app)/onboarding/documents/page.tsx:1786`: Usa “Evidencia” en una tarea para incorporar archivos al expediente privado.
- `src/components/design-system.tsx:50`: Buscar funciones…

### /onboarding/operations

- `src/app/(app)/onboarding/operations/page.tsx:43`: Cargando automatización de incorporación
- `src/app/(app)/onboarding/operations/page.tsx:44`: No fue posible cargar la automatización
- `src/app/(app)/onboarding/operations/page.tsx:47`: Incorporación
- `src/app/(app)/onboarding/operations/page.tsx:47`: Automatización operativa
- `src/app/(app)/onboarding/operations/page.tsx:47`: Controla tareas vencidas, recordatorios, escalamiento y reasignación segura por disponibilidad y carga.
- `src/app/(app)/onboarding/operations/page.tsx:52`: Reasignación
- `src/app/(app)/onboarding/operations/page.tsx:55`: Procesamiento de vencimientos
- `src/app/(app)/onboarding/operations/page.tsx:57`: El worker se ejecuta periódicamente. Esta acción permite una ejecución controlada: evita duplicados, conserva el historial y solo reasigna cuando el responsable no está disponible en la sucursal.
- `src/app/(app)/onboarding/operations/page.tsx:62`: Cohortes de ingreso
- `src/app/(app)/onboarding/operations/page.tsx:63`: Selecciona expedientes pendientes, una plantilla y una fecha de inicio común. La operación conserva tareas completadas y registra cada cambio en el timeline.
- `src/app/(app)/onboarding/operations/page.tsx:63`: Fecha de inicio
- `src/app/(app)/onboarding/operations/page.tsx:63`: No hay expedientes en incorporación para formar una cohorte.
- `src/components/design-system.tsx:50`: Buscar funciones…

### /onboarding/signatures

- `src/components/design-system.tsx:50`: Buscar funciones…

### /productivity/cameras

- `src/app/(app)/productivity/cameras/page.tsx:99`: Sin permiso para administrar cámaras
- `src/app/(app)/productivity/cameras/page.tsx:100`: Solicita a un administrador el permiso de gestión de productividad.
- `src/app/(app)/productivity/cameras/page.tsx:111`: Las cámaras y zonas siempre se configuran dentro de una sucursal autorizada.
- `src/app/(app)/productivity/cameras/page.tsx:118`: Cargando cámaras y zonas
- `src/app/(app)/productivity/cameras/page.tsx:121`: No fue posible cargar la configuración
- `src/app/(app)/productivity/cameras/page.tsx:130`: Configuración operativa
- `src/app/(app)/productivity/cameras/page.tsx:131`: Cámaras y zonas
- `src/app/(app)/productivity/cameras/page.tsx:132`: Registra fuentes por sucursal y define las zonas que se analizarán en Productividad.
- `src/app/(app)/productivity/cameras/page.tsx:145`: Agregar cámara o zona
- `src/app/(app)/productivity/cameras/page.tsx:154`: Registrar cámara
- `src/app/(app)/productivity/cameras/page.tsx:155`: Conecta una fuente ya autorizada por el equipo de infraestructura.
- `src/app/(app)/productivity/cameras/page.tsx:162`: Ej. Recepción principal
- `src/app/(app)/productivity/cameras/page.tsx:168`: Tipo de fuente
- `src/app/(app)/productivity/cameras/page.tsx:181`: URL de stream
- `src/app/(app)/productivity/cameras/page.tsx:190`: Opcional cuando el procesador de video administra la fuente por separado.
- `src/app/(app)/productivity/cameras/page.tsx:208`: La primera zona usa un contorno base; podrás ajustarlo al conectar el editor visual.
- `src/app/(app)/productivity/cameras/page.tsx:212`: Cámara
- `src/app/(app)/productivity/cameras/page.tsx:215`: Selecciona una cámara
- `src/app/(app)/productivity/cameras/page.tsx:227`: Nombre de zona
- `src/app/(app)/productivity/cameras/page.tsx:236`: Tipo de zona
- `src/app/(app)/productivity/cameras/page.tsx:280`: Última señal
- `src/app/(app)/productivity/cameras/page.tsx:298`: Aún no hay cámaras configuradas en
- `src/app/(app)/productivity/cameras/page.tsx:318`: Cámara:
- `src/app/(app)/productivity/cameras/page.tsx:325`: Sin zonas todavía
- `src/app/(app)/productivity/cameras/page.tsx:326`: Define al menos una zona para que la simulación empiece a generar productividad por área.
- `src/components/design-system.tsx:50`: Buscar funciones…

### /productivity/dashboard

- `src/app/(app)/productivity/dashboard/page.tsx:58`: Grabación simulada de cámaras
- `src/app/(app)/productivity/dashboard/page.tsx:69`: Cámara
- `src/app/(app)/productivity/dashboard/page.tsx:72`: En grabación
- `src/app/(app)/productivity/dashboard/page.tsx:79`: La cámara está registrando ocupación, flujo y tiempos de permanencia para generar productividad demo.
- `src/app/(app)/productivity/dashboard/page.tsx:93`: Última marca
- `src/app/(app)/productivity/dashboard/page.tsx:95`: La simulación avanza automáticamente mientras esté activa.
- `src/app/(app)/productivity/dashboard/page.tsx:212`: Selecciona una sucursal para revisar productividad
- `src/app/(app)/productivity/dashboard/page.tsx:215`: Cargando demo de productividad
- `src/app/(app)/productivity/dashboard/page.tsx:240`: Dashboard de productividad
- `src/app/(app)/productivity/dashboard/page.tsx:241`: Ocupación y flujo por zona, medidos con las cámaras registradas en esta sucursal. No evalúa a personas ni sustituye una decisión laboral.
- `src/app/(app)/productivity/dashboard/page.tsx:252`: Situaciones que el sistema marcó para que alguien las mire.
- `src/app/(app)/productivity/dashboard/page.tsx:276`: Estado de la operación
- `src/app/(app)/productivity/dashboard/page.tsx:279`: Cámaras en línea
- `src/app/(app)/productivity/dashboard/page.tsx:288`: Ver cámaras
- `src/app/(app)/productivity/dashboard/page.tsx:293`: Zonas con actividad
- `src/app/(app)/productivity/dashboard/page.tsx:326`: Cuánto tiempo estuvo activa cada zona y con qué confianza lo midió la cámara.
- `src/app/(app)/productivity/dashboard/page.tsx:358`: Para revisión humana
- `src/app/(app)/productivity/dashboard/page.tsx:359`: Sugerencias derivadas de la medición. Ninguna se aplica sola.
- `src/app/(app)/productivity/dashboard/page.tsx:383`: Simulación de demostración
- `src/app/(app)/productivity/dashboard/page.tsx:384`: Genera eventos de ejemplo para enseñar cómo se ve el módulo cuando hay actividad.
- `src/app/(app)/productivity/dashboard/page.tsx:407`: Los eventos que genere se guardan en la base de datos
- `src/app/(app)/productivity/dashboard/page.tsx:408`: Quedan marcados con origen «DEMO» y suman a los contadores de arriba. Úsalo para demostraciones, no sobre datos de operación real.
- `src/app/(app)/productivity/dashboard/page.tsx:415`: No hay cámaras activas en esta sucursal
- `src/app/(app)/productivity/dashboard/page.tsx:416`: Registra y activa una cámara antes de simular. No se generan datos sin una cámara real detrás.
- `src/app/(app)/productivity/dashboard/page.tsx:419`: Ir a Cámaras y zonas
- `src/app/(app)/productivity/dashboard/page.tsx:426`: El evento no pudo almacenarse
- `src/app/(app)/productivity/dashboard/page.tsx:439`: Cámaras en la simulación
- `src/app/(app)/productivity/dashboard/page.tsx:453`: Todavía no hay eventos de demostración para esta sucursal.

### /profile

- `src/app/(app)/profile/page.tsx:15`: Perfil del usuario
- `src/app/(app)/profile/page.tsx:17`: Control personal de acceso y preferencias.
- `src/app/(app)/profile/page.tsx:29`: Idioma y región
- `src/app/(app)/profile/page.tsx:32`: Idioma de la interfaz
- `src/app/(app)/profile/page.tsx:33`: El cambio se aplica inmediatamente y se conserva en este dispositivo.
- `src/components/ui.tsx:199`: Cargando la pantalla
- `src/components/ui.tsx:213`: Cargando los registros

### /reports

- `src/app/(app)/reports/page.tsx:130`: Últimos
- `src/app/(app)/reports/page.tsx:130`: días
- `src/app/(app)/reports/page.tsx:135`: Analítica operativa
- `src/app/(app)/reports/page.tsx:136`: Reportes y analítica
- `src/app/(app)/reports/page.tsx:137`: Mide reclutamiento, incorporación, formación e inventario con periodo, fuente y alcance verificables.
- `src/app/(app)/reports/page.tsx:154`: Filtros de reportes
- `src/app/(app)/reports/page.tsx:159`: Nombre del filtro
- `src/app/(app)/reports/page.tsx:159`: Nombre para guardar este filtro
- `src/app/(app)/reports/page.tsx:189`: Filtros de reportes
- `src/app/(app)/reports/page.tsx:196`: No fue posible cargar los reportes
- `src/app/(app)/reports/page.tsx:209`: tareas de incorporación vencidas o bloqueadas,
- `src/app/(app)/reports/page.tsx:209`: acciones pendientes de inventario.
- `src/app/(app)/reports/page.tsx:209`: Sin excepciones críticas en el periodo
- `src/app/(app)/reports/page.tsx:209`: No encontramos tareas vencidas, bloqueos ni acciones de inventario pendientes dentro de los filtros activos.
- `src/app/(app)/reports/page.tsx:220`: Avance de onboarding
- `src/app/(app)/reports/page.tsx:236`: Inventario y activos pendientes
- `src/app/(app)/reports/page.tsx:282`: No hay registros para este periodo y alcance.
- `src/components/design-system.tsx:50`: Buscar funciones…

### /sign/[token]

- `src/app/sign/[token]/page.tsx:24`: La solicitud no está disponible
- `src/app/sign/[token]/page.tsx:24`: El enlace puede haber vencido, haber sido utilizado o no ser válido.
- `src/app/sign/[token]/page.tsx:25`: Registramos tu consentimiento y las evidencias de la firma. Puedes cerrar esta ventana.
- `src/app/sign/[token]/page.tsx:25`: Ir al sitio público
- `src/app/sign/[token]/page.tsx:28`: Versión
- `src/app/sign/[token]/page.tsx:28`: · El contenido se verifica mediante suma de comprobación al firmar.
- `src/app/sign/[token]/page.tsx:29`: Se guardarán fecha, versión, suma de comprobación y huellas no reversibles para la auditoría.
- `src/app/sign/[token]/page.tsx:29`: No pudimos registrar la firma. Comprueba que el nombre coincida y vuelve a intentarlo.
- `src/components/design-system.tsx:50`: Buscar funciones…

### /training

- `src/components/training-learning-hub.tsx:143`: Continúa tus cursos, asigna formación y supervisa el avance del programa.
- `src/components/training-learning-hub.tsx:155`: Secciones de aprendizaje
- `src/components/training-learning-hub.tsx:167`: Supervisión
- `src/components/training-learning-hub.tsx:221`: Cargando las prioridades de aprendizaje
- `src/components/training-learning-hub.tsx:223`: No fue posible cargar las prioridades
- `src/components/training-learning-hub.tsx:239`: Acciones del ciclo
- `src/components/training-learning-hub.tsx:240`: Cada acción abre el área especializada sin perder el contexto operativo.
- `src/components/training-learning-hub.tsx:243`: Crear contenido
- `src/components/training-learning-hub.tsx:258`: Siguiente acción recomendada
- `src/components/training-learning-hub.tsx:260`: Revisa las asignaciones vencidas y contacta a las personas responsables.
- `src/components/training-learning-hub.tsx:260`: Hay cursos esperando revisión antes de publicar.
- `src/components/training-learning-hub.tsx:260`: Algunas evaluaciones todavía no están listas para usarse.
- `src/components/training-learning-hub.tsx:260`: Mantener el ciclo
- `src/components/training-learning-hub.tsx:260`: No hay bloqueos críticos. Consulta resultados o crea nuevo contenido.
- `src/components/training-learning-hub.tsx:285`: Cola de atención
- `src/components/training-learning-hub.tsx:285`: Pendientes agrupados por tipo, responsable y resolución.
- `src/components/training-learning-hub.tsx:290`: Asignación vencida
- `src/components/training-learning-hub.tsx:293`: Curso en revisión
- `src/components/training-learning-hub.tsx:296`: Evaluación incompleta
- `src/components/training-learning-hub.tsx:298`: No hay cursos, asignaciones o evaluaciones que requieran atención.
- `src/components/training-learning-hub.tsx:333`: Cargando la supervisión
- `src/components/training-learning-hub.tsx:334`: No fue posible cargar la supervisión
- `src/components/training-learning-hub.tsx:350`: Consulta avance, vencimientos, evaluaciones y certificados en el mismo contexto.
- `src/components/training-learning-hub.tsx:351`: Todos los cursos
- `src/components/training-learning-hub.tsx:351`: Todos los estados
- `src/components/training-learning-hub.tsx:351`: Todos los responsables
- `src/components/training-learning-hub.tsx:353`: Detalle de supervisión
- `src/components/training-learning-hub.tsx:353`: intentos de evaluación ·
- `src/components/training-learning-hub.tsx:353`: No hay datos para los filtros seleccionados.
- `src/components/training-learning-hub.tsx:438`: Prueba contenido antes de su publicación y reporta cualquier bloqueo.
- `src/components/training-learning-hub.tsx:443`: Dar retroalimentación
- `src/components/training-learning-hub.tsx:449`: Retroalimentación del piloto
- `src/components/training-learning-hub.tsx:449`: Tu evaluación define si esta versión puede publicarse.
- `src/components/training-learning-hub.tsx:453`: Encontré un problema que bloquea la publicación
- `src/components/training-learning-hub.tsx:454`: Enviar retroalimentación
- `src/components/training-learning-hub.tsx:491`: Buscar
- `src/components/training-learning-hub.tsx:496`: Curso, categoría o palabra clave
- `src/components/training-learning-hub.tsx:565`: Tu formación
- `src/components/training-learning-hub.tsx:589`: No tienes formación pendiente
- `src/components/training-learning-hub.tsx:595`: Antes de empezar
- `src/components/training-learning-hub.tsx:717`: Congela una audiencia, distribuye por lotes y mide adopción sin perder trazabilidad.
- `src/components/training-learning-hub.tsx:720`: Nueva campaña
- `src/components/training-learning-hub.tsx:722`: Cargando las campañas
- `src/components/training-learning-hub.tsx:723`: No fue posible cargar las campañas
- `src/components/training-learning-hub.tsx:747`: Todavía no hay campañas
- `src/components/training-learning-hub.tsx:748`: Una campaña congela la audiencia y reparte el curso por lotes, para que puedas medir la adopción sin perder el rastro de a quién le llegó.
- `src/components/training-learning-hub.tsx:749`: Crear la primera campaña
- `src/components/training-learning-hub.tsx:785`: · versión
- `src/components/training-learning-hub.tsx:794`: Despliegue de audiencia
- `src/components/training-learning-hub.tsx:808`: Lotes de
- `src/components/training-learning-hub.tsx:845`: Cancelar campaña
- `src/components/training-learning-hub.tsx:855`: ¿Cancelar la campaña «
- `src/components/training-learning-hub.tsx:857`: Quienes ya la recibieron conservan su curso y su avance. Lo que se detiene es el reparto de lo que queda. No se puede reanudar: habría que crear otra campaña.
- `src/components/training-learning-hub.tsx:861`: A quién afecta
- `src/components/training-learning-hub.tsx:867`: Mantener la campaña
- `src/components/training-learning-hub.tsx:876`: Cancelar la campaña
- `src/components/training-learning-hub.tsx:1065`: Nueva campaña de lanzamiento
- `src/components/training-learning-hub.tsx:1066`: Registra los datos, revisa a quién afecta y confirma.
- `src/components/training-learning-hub.tsx:1073`: Nombre de campaña
- `src/components/training-learning-hub.tsx:1075`: Personas específicas
- `src/components/training-learning-hub.tsx:1075`: Sucursales
- `src/components/training-learning-hub.tsx:1075`: Toda la empresa
- `src/components/training-learning-hub.tsx:1092`: Toda la empresa
- `src/components/training-learning-hub.tsx:1093`: Se congelará la lista de personas activas que haya en este momento.
- `src/components/training-learning-hub.tsx:1100`: Fecha límite
- `src/components/training-learning-hub.tsx:1105`: Formación obligatoria
- `src/components/training-learning-hub.tsx:1106`: Se mostrará como requisito para toda la audiencia.
- `src/components/training-learning-hub.tsx:1110`: Cancelar
- `src/components/training-learning-hub.tsx:1120`: Corregir los datos
- `src/components/training-learning-hub.tsx:1227`: Seguimiento de asignaciones
- `src/components/training-learning-hub.tsx:1228`: Consulta avance, vencimientos y formación pendiente.
- `src/components/training-learning-hub.tsx:1249`: Requiere atención
- `src/components/training-learning-hub.tsx:1249`: Prioriza las asignaciones vencidas o que necesitan seguimiento.
- `src/components/training-learning-hub.tsx:1269`: Asignaciones de formación
- `src/components/training-learning-hub.tsx:1270`: Asignar el primer curso
- `src/components/training-learning-hub.tsx:1285`: No fue posible cargar las asignaciones
- `src/components/training-learning-hub.tsx:1300`: ¿Retirar esta asignación?
- `src/components/training-learning-hub.tsx:1307`: Qué pasa con lo avanzado
- `src/components/training-learning-hub.tsx:1325`: Retirar la asignación
- `src/components/training-learning-hub.tsx:1377`: Define la audiencia y las fechas de cumplimiento.
- `src/components/training-learning-hub.tsx:1380`: Personas específicas
- `src/components/training-learning-hub.tsx:1380`: Sucursales
- `src/components/training-learning-hub.tsx:1380`: Toda la empresa
- `src/components/training-learning-hub.tsx:1381`: El curso se asignará a todas las personas activas de la empresa.
- `src/components/training-learning-hub.tsx:1382`: Fecha límite
- `src/components/training-learning-hub.tsx:1383`: Cancelar
- `src/components/training-learning-hub.tsx:1421`: Cargando el contenido del curso
- `src/components/training-learning-hub.tsx:1421`: No fue posible cargar el curso
- `src/components/training-learning-hub.tsx:1443`: Siguiente lección:
- `src/components/training-learning-hub.tsx:1443`: Has completado todo el contenido disponible.
- `src/components/training-learning-hub.tsx:1444`: Formación completada
- `src/components/training-learning-hub.tsx:1450`: La lección actual está resaltada en el contenido.
- `src/components/training-learning-hub.tsx:1453`: Necesitas demostrar el aprendizaje antes de cerrar esta formación.
- `src/components/training-learning-hub.tsx:1453`: Comenzar evaluación
- `src/components/training-learning-hub.tsx:1477`: Este video no está disponible aquí
- `src/components/training-learning-hub.tsx:1477`: Se guardó localmente en el navegador de quien lo editó y todavía no se ha subido.
- `src/components/training-learning-hub.tsx:1547`: Verifica que el archivo sea un MP4 compatible (H.264/AAC) y vuelve a cargarlo desde el editor.
- `src/components/strict-video-lesson.tsx:63`: Porcentaje de video visto y validado

### /training/certificates

- `src/components/training-assessments.tsx:123`: Diseña instrumentos de evaluación, configura intentos y controla el criterio de aprobación.
- `src/components/training-assessments.tsx:124`: Nueva evaluación
- `src/components/training-assessments.tsx:126`: Cargando las evaluaciones
- `src/components/training-assessments.tsx:128`: No fue posible cargar las evaluaciones
- `src/components/training-assessments.tsx:138`: % mínimo
- `src/components/training-assessments.tsx:149`: Falta algo para poder usarla
- `src/components/training-assessments.tsx:174`: Aún no hay evaluaciones
- `src/components/training-assessments.tsx:174`: Una evaluación mide lo aprendido y decide si alguien aprueba el curso.
- `src/components/training-assessments.tsx:174`: Crear la primera evaluación
- `src/components/training-assessments.tsx:183`: ¿Eliminar la evaluación «
- `src/components/training-assessments.tsx:185`: Se borran también sus preguntas y sus reglas. No se puede deshacer.
- `src/components/training-assessments.tsx:189`: El servidor no permitirá borrarla
- `src/components/training-assessments.tsx:190`: , y borrarla dejaría esos resultados sin la evaluación que los explica. Retírala del curso en su lugar.
- `src/components/training-assessments.tsx:207`: Eliminar la evaluación
- `src/components/training-assessments.tsx:225`: Estado de tus evaluaciones
- `src/components/training-assessments.tsx:226`: Revisa la preparación antes de abrir una evaluación individual.
- `src/components/training-assessments.tsx:230`: Listas para usar
- `src/components/training-assessments.tsx:231`: Requieren revisión
- `src/components/training-assessments.tsx:300`: Nueva evaluación
- `src/components/training-assessments.tsx:300`: Define las reglas generales. Después podrás agregar preguntas.
- `src/components/training-assessments.tsx:303`: Título
- `src/components/training-assessments.tsx:304`: Descripción
- `src/components/training-assessments.tsx:306`: Aprobación %
- `src/components/training-assessments.tsx:361`: Reglas de evaluación
- `src/components/training-assessments.tsx:361`: Controla disponibilidad, selección, intentos y retroalimentación.
- `src/components/training-assessments.tsx:363`: Título
- `src/components/training-assessments.tsx:364`: Descripción
- `src/components/training-assessments.tsx:366`: Aprobación %
- `src/components/training-assessments.tsx:371`: Retroalimentación
- `src/components/training-assessments.tsx:377`: Rúbrica general
- `src/components/training-assessments.tsx:377`: Criterios generales de calidad
- `src/components/training-assessments.tsx:383`: Guardar reglas
- `src/components/training-assessments.tsx:439`: Selección única
- `src/components/training-assessments.tsx:439`: Selección múltiple
- `src/components/training-assessments.tsx:443`: Categoría
- `src/components/training-assessments.tsx:444`: Básica
- `src/components/training-assessments.tsx:449`: Opción
- `src/components/training-assessments.tsx:449`: Opción correcta
- `src/components/training-assessments.tsx:449`: Opción
- `src/components/training-assessments.tsx:453`: Explicación posterior
- `src/components/training-assessments.tsx:454`: procedimiento, prevención
- `src/components/training-assessments.tsx:455`: Rúbrica de calificación
- `src/components/training-assessments.tsx:456`: Guardar también en el banco de preguntas
- `src/components/training-assessments.tsx:457`: Guardar pregunta
- `src/components/training-assessments.tsx:485`: Banco de preguntas
- `src/components/training-assessments.tsx:485`: Selecciona preguntas validadas para copiarlas a
- `src/components/training-assessments.tsx:486`: Cargando el banco de preguntas
- `src/components/training-assessments.tsx:499`: El banco de preguntas está vacío
- `src/components/training-assessments.tsx:499`: Al crear una pregunta, marca «Guardar también en el banco» para poder reutilizarla en otras evaluaciones.
- `src/components/training-assessments.tsx:542`: Completa tus evaluaciones pendientes y consulta claramente el resultado de cada intento.
- `src/components/training-assessments.tsx:545`: Evaluación de
- `src/components/training-assessments.tsx:545`: % para aprobar
- `src/components/training-assessments.tsx:545`: Último resultado:
- `src/components/training-assessments.tsx:545`: Retroalimentación:
- `src/components/training-assessments.tsx:545`: Cuando un curso asignado incluya una evaluación, aparecerá aquí.
- `src/components/training-assessments.tsx:561`: Consulta tu último intento antes de volver a empezar.
- `src/components/training-assessments.tsx:566`: En revisión
- `src/components/training-assessments.tsx:704`: Responde todas las preguntas antes de enviar. El envío es definitivo.
- `src/components/training-assessments.tsx:745`: Cargando los resultados
- `src/components/training-assessments.tsx:766`: Aún no hay intentos
- `src/components/training-assessments.tsx:766`: Los resultados aparecerán aquí en cuanto alguien rinda una evaluación.
- `src/components/training-assessments.tsx:779`: Resumen de resultados
- `src/components/training-assessments.tsx:780`: intentos en total · estados calculados para esta página.
- `src/components/training-assessments.tsx:784`: Revisión pendiente
- `src/components/training-assessments.tsx:797`: Revisión pendiente
- `src/components/training-assessments.tsx:820`: Consulta credenciales verificables, evidencia, vigencia y cadena de renovación.
- `src/components/training-assessments.tsx:821`: Cargando los certificados
- `src/components/training-assessments.tsx:840`: Número:
- `src/components/training-assessments.tsx:841`: Emisión:
- `src/components/training-assessments.tsx:854`: Aún no hay certificados
- `src/components/training-assessments.tsx:854`: Al aprobar un curso que los emite, el certificado aparecerá aquí.
- `src/components/training-assessments.tsx:867`: Estado de credenciales

### /training/content

- `src/components/training-course-manager.tsx:245`: Gestión de cursos
- `src/components/training-course-manager.tsx:246`: Diseña, revisa y publica experiencias formativas con trazabilidad editorial.
- `src/components/training-course-manager.tsx:266`: Buscar
- `src/components/training-course-manager.tsx:270`: Título, resumen o identificador
- `src/components/training-course-manager.tsx:295`: Categoría
- `src/components/training-course-manager.tsx:310`: Nueva categoría
- `src/components/training-course-manager.tsx:320`: Búsqueda:
- `src/components/training-course-manager.tsx:323`: Categoría:
- `src/components/training-course-manager.tsx:330`: Mostrando el catálogo completo
- `src/components/training-course-manager.tsx:335`: No fue posible cargar los cursos
- `src/components/training-course-manager.tsx:347`: Catálogo de cursos
- `src/components/training-course-manager.tsx:354`: Crear el primer curso
- `src/components/training-course-manager.tsx:444`: Nueva categoría
- `src/components/training-course-manager.tsx:444`: Agrupa cursos y crea subcategorías para facilitar su descubrimiento.
- `src/components/training-course-manager.tsx:450`: Descripción
- `src/components/training-course-manager.tsx:453`: Categoría superior
- `src/components/training-course-manager.tsx:454`: Categoría principal
- `src/components/training-course-manager.tsx:458`: Toda la plataforma
- `src/components/training-course-manager.tsx:461`: Cancelar
- `src/components/training-course-manager.tsx:593`: Pensado para apoyarse en video. Cuando una lección es audiovisual, se completa al alcanzar el
- `src/components/training-course-manager.tsx:593`: % de reproducción.
- `src/components/training-course-manager.tsx:642`: Crear curso
- `src/components/training-course-manager.tsx:643`: Empieza con lo esencial. Podrás añadir contenido, evaluaciones, certificación y configuración avanzada en el editor.
- `src/components/training-course-manager.tsx:647`: Información inicial
- `src/components/training-course-manager.tsx:651`: Título del curso
- `src/components/training-course-manager.tsx:651`: Usa un nombre claro para que las personas lo encuentren fácilmente.
- `src/components/training-course-manager.tsx:652`: Ej. Seguridad básica en el trabajo
- `src/components/training-course-manager.tsx:654`: Opcional. Una frase breve sobre lo que aprenderán las personas.
- `src/components/training-course-manager.tsx:655`: Ej. Principios y prácticas para trabajar de forma segura.
- `src/components/training-course-manager.tsx:657`: Categoría
- `src/components/training-course-manager.tsx:657`: Opcional. Puedes crear o cambiar categorías más adelante.
- `src/components/training-course-manager.tsx:658`: Sin categoría
- `src/components/training-course-manager.tsx:658`: Sin categoría
- `src/components/training-course-manager.tsx:661`: La plantilla visual crea módulos y lecciones base listas para recibir videos locales.
- `src/components/training-course-manager.tsx:672`: Crear como curso visual
- `src/components/training-course-manager.tsx:674`: Prioriza videos de apoyo y deja visible la regla de avance al 90% para completar.
- `src/components/training-course-manager.tsx:682`: Opcional, pero recomendado para cursos visuales. Sirve como apoyo de bienvenida.
- `src/components/training-course-manager.tsx:697`: Dificultad, duración, idioma, etiquetas, portada y visibilidad se configuran después, en el editor.
- `src/components/training-course-manager.tsx:698`: Cancelar
- `src/components/training-course-manager.tsx:777`: Título
- `src/components/training-course-manager.tsx:780`: Categoría
- `src/components/training-course-manager.tsx:783`: Sin categoría
- `src/components/training-course-manager.tsx:790`: Configuración avanzada
- `src/components/training-course-manager.tsx:792`: Estos datos mejoran la organización y la presentación, pero no son necesarios para guardar el contenido básico.
- `src/components/training-course-manager.tsx:793`: Descripción
- `src/components/training-course-manager.tsx:803`: Duración estimada (minutos)
- `src/components/training-course-manager.tsx:803`: Puedes ajustarla cuando definas las lecciones.
- `src/components/training-course-manager.tsx:806`: URL opcional de la imagen del curso.
- `src/components/training-course-manager.tsx:810`: Opcional. Sirve como apoyo visual y entrada rápida al contenido.
- `src/components/training-course-manager.tsx:813`: Separa las etiquetas con comas para facilitar la búsqueda.
- `src/components/training-course-manager.tsx:820`: Cancelar
- `src/components/training-course-manager.tsx:873`: Asistente editorial con guardado por etapa y requisitos de publicación.
- `src/components/training-course-manager.tsx:897`: Etapas del curso
- `src/components/training-course-manager.tsx:907`: Cargando el curso
- `src/components/training-course-manager.tsx:908`: No fue posible cargar el curso
- `src/components/training-course-manager.tsx:936`: Continuar a evaluación
- `src/components/training-course-manager.tsx:997`: Comprobación del aprendizaje
- `src/components/training-course-manager.tsx:1003`: preguntas · Aprobación
- `src/components/training-course-manager.tsx:1011`: Evaluación recomendada
- `src/components/training-course-manager.tsx:1012`: El curso todavía no tiene una evaluación. Puedes continuar, pero una evaluación permitirá comprobar los objetivos en la fase de medición.
- `src/components/training-course-manager.tsx:1058`: Cargando el curso
- `src/components/training-course-manager.tsx:1059`: No fue posible cargar el curso
- `src/components/training-course-manager.tsx:1063`: Certificación, vigencia y renovación
- `src/components/training-course-manager.tsx:1067`: Configuración incompleta
- `src/components/training-course-manager.tsx:1069`: Habilita una credencial verificable para este curso.
- `src/components/training-course-manager.tsx:1070`: Emisión automática
- `src/components/training-course-manager.tsx:1070`: Se emite al cumplir toda la evidencia.
- `src/components/training-course-manager.tsx:1071`: Exigir evaluación
- `src/components/training-course-manager.tsx:1071`: Todas las evaluaciones deben estar aprobadas.
- `src/components/training-course-manager.tsx:1072`: Valida progreso antes de emitir.
- `src/components/training-course-manager.tsx:1075`: Vigencia (días)
- `src/components/training-course-manager.tsx:1075`: Sin vencimiento
- `src/components/training-course-manager.tsx:1076`: Ventana de renovación
- `src/components/training-course-manager.tsx:1077`: Avisos antes de vencer
- `src/components/training-course-manager.tsx:1080`: Título de la credencial
- `src/components/training-course-manager.tsx:1081`: URL de insignia
- `src/components/training-course-manager.tsx:1082`: Nombre del firmante
- `src/components/training-course-manager.tsx:1083`: Cargo del firmante
- `src/components/training-course-manager.tsx:1085`: Descripción de la credencial
- `src/components/training-course-manager.tsx:1096`: Experiencia del participante
- `src/components/training-course-manager.tsx:1098`: Abre una simulación de solo lectura para revisar portada, secuencia, títulos y recursos. No guarda progreso ni modifica el curso.
- `src/components/training-course-manager.tsx:1099`: Esta sesión ya abrió la experiencia del participante.
- `src/components/training-course-manager.tsx:1102`: Continuar a revisión
- `src/components/training-course-manager.tsx:1131`: Revisión antes de publicar
- `src/components/training-course-manager.tsx:1132`: Confirma el alcance y completa los requisitos antes de cambiar el estado del curso.
- `src/components/training-course-manager.tsx:1137`: El curso todavía no puede enviarse a revisión
- `src/components/training-course-manager.tsx:1142`: Información, fundamento pedagógico y estructura están preparados para revisión.
- `src/components/training-course-manager.tsx:1145`: Recomendación
- `src/components/training-course-manager.tsx:1145`: Añade una evaluación antes de publicar para medir el aprendizaje.
- `src/components/training-course-manager.tsx:1177`: Checklist de publicación
- `src/components/training-course-manager.tsx:1177`: La publicación conserva la versión y el historial del curso.
- `src/components/training-course-manager.tsx:1185`: · La validación de calidad se muestra debajo antes de publicar.
- `src/components/training-course-manager.tsx:1220`: Cargando el curso
- `src/components/training-course-manager.tsx:1221`: No fue posible cargar el curso
- `src/components/training-course-manager.tsx:1226`: Control de calidad · versión
- `src/components/training-course-manager.tsx:1226`: Las aprobaciones anteriores no se reutilizan cuando cambia la versión.
- `src/components/training-course-manager.tsx:1242`: Solicitar las cuatro revisiones
- `src/components/training-course-manager.tsx:1243`: Primero envía el curso a revisión
- `src/components/training-course-manager.tsx:1243`: El envío abrirá una nueva versión editorial y creará automáticamente los cuatro gates.
- `src/components/training-course-manager.tsx:1245`: Piloto de la versión
- `src/components/training-course-manager.tsx:1245`: Opcional; si se crea, debe cumplir sus criterios antes del go-live.
- `src/components/training-course-manager.tsx:1245`: Crear piloto
- `src/components/training-course-manager.tsx:1251`: Cerrar con éxito
- `src/components/training-course-manager.tsx:1251`: Cancelar
- `src/components/training-course-manager.tsx:1254`: No se creó un piloto para esta versión.
- `src/components/training-course-manager.tsx:1256`: Pendiente para aprobar
- `src/components/training-course-manager.tsx:1256`: Todos los gates de calidad están aprobados.
- `src/components/training-course-manager.tsx:1288`: Registra evidencia y una decisión explícita para esta versión.
- `src/components/training-course-manager.tsx:1291`: Decisión
- `src/components/training-course-manager.tsx:1293`: Registrar decisión
- `src/components/training-course-manager.tsx:1320`: Crear piloto
- `src/components/training-course-manager.tsx:1320`: Selecciona participantes y define la evidencia mínima para autorizar el go-live.
- `src/components/training-course-manager.tsx:1323`: Respuestas mínimas
- `src/components/training-course-manager.tsx:1323`: Promedio mínimo
- `src/components/training-course-manager.tsx:1325`: Crear piloto
- `src/components/training-course-manager.tsx:1354`: módulos ·
- `src/components/training-course-manager.tsx:1358`: Detalles técnicos
- `src/components/training-course-manager.tsx:1360`: Versión editorial
- `src/components/training-course-manager.tsx:1361`: Identificador del curso
- `src/components/training-course-manager.tsx:1400`: Información
- `src/components/training-course-manager.tsx:1429`: Estructura del curso
- `src/components/training-course-manager.tsx:1430`: Construye módulos, lecciones, recursos y práctica en el orden exacto que seguirá el participante.
- `src/components/training-course-manager.tsx:1434`: Sin módulos
- `src/components/training-course-manager.tsx:1434`: Añade un módulo para comenzar a estructurar el curso.
- `src/components/training-course-manager.tsx:1437`: Título del nuevo módulo
- `src/components/training-course-manager.tsx:1437`: Título del nuevo módulo
- `src/components/training-course-manager.tsx:1438`: Añadir módulo
- `src/components/training-course-manager.tsx:1483`: Título del módulo
- `src/components/training-course-manager.tsx:1483`: Descripción del módulo
- `src/components/training-course-manager.tsx:1483`: Qué logrará el participante en este módulo
- `src/components/training-course-manager.tsx:1483`: Módulo obligatorio
- `src/components/training-course-manager.tsx:1486`: Guardar
- `src/components/training-course-manager.tsx:1488`: Título de la nueva lección
- `src/components/training-course-manager.tsx:1488`: Nueva lección
- `src/components/training-course-manager.tsx:1488`: Lección
- `src/components/training-course-manager.tsx:1547`: Título de la lección
- `src/components/training-course-manager.tsx:1547`: Duración estimada en minutos
- `src/components/training-course-manager.tsx:1547`: Descripción de la lección
- `src/components/training-course-manager.tsx:1547`: Objetivo y contexto de la lección
- `src/components/training-course-manager.tsx:1547`: Lección obligatoria
- `src/components/training-course-manager.tsx:1547`: Porcentaje para completar video
- `src/components/training-course-manager.tsx:1548`: Guardar
- `src/components/training-course-manager.tsx:1550`: Copia local de respaldo
- `src/components/training-course-manager.tsx:1550`: La copia local sirve para este navegador; la disponibilidad para participantes depende del archivo subido al servidor.
- `src/components/training-course-manager.tsx:1616`: Configura el recurso, la actividad o la evaluación con criterios claros para el participante.
- `src/components/training-course-manager.tsx:1620`: Título
- `src/components/training-course-manager.tsx:1622`: URL de transcripción
- `src/components/training-course-manager.tsx:1622`: URL de subtítulos
- `src/components/training-course-manager.tsx:1623`: Nota de accesibilidad
- `src/components/training-course-manager.tsx:1623`: Ej. PDF etiquetado y apto para lector de pantalla
- `src/components/training-course-manager.tsx:1624`: Validación del supervisor
- `src/components/training-course-manager.tsx:1624`: Criterios de aceptación
- `src/components/training-course-manager.tsx:1624`: Qué debe demostrar para aprobar
- `src/components/training-course-manager.tsx:1625`: Este contenido es obligatorio para completar la lección
- `src/components/training-course-manager.tsx:1626`: Cancelar
- `src/components/training-course-manager.tsx:1626`: Guardar
- `src/components/training-course-manager.tsx:1636`: Programar publicación
- `src/components/training-course-manager.tsx:1636`: El backend publicará el curso automáticamente en la fecha indicada.
- `src/components/training-course-manager.tsx:1638`: Publicar el
- `src/components/training-course-manager.tsx:1639`: Retirar el (opcional)
- `src/components/training-course-manager.tsx:1640`: Cancelar
- `src/components/training-course-manager.tsx:1652`: Vista previa del participante
- `src/components/training-course-manager.tsx:1653`: Revisión de solo lectura: no guarda progreso ni modifica el curso.
- `src/components/training-course-manager.tsx:1657`: Preparando la vista previa
- `src/components/training-course-manager.tsx:1658`: No fue posible abrir la vista previa
- `src/components/training-course-manager.tsx:1659`: Recurso de apoyo visual para arrancar el curso.
- `src/components/training-course-manager.tsx:1659`: Lección
- `src/components/training-course-manager.tsx:1659`: Se completa con
- `src/components/training-course-manager.tsx:1659`: % de visualización
- `src/components/training-course-manager.tsx:1677`: No fue posible cargar el video.
- `src/components/admin-crud.tsx:135`: Qué desaparece
- `src/components/admin-crud.tsx:140`: Una vez eliminado, no hay forma de recuperarlo desde el producto.
- `src/components/admin-crud.tsx:148`: Cancelar
- `src/components/design-system.tsx:50`: Buscar funciones…
- `src/components/training-course-foundation.tsx:84`: Cargando el diseño pedagógico
- `src/components/training-course-foundation.tsx:88`: No fue posible cargar el diseño pedagógico
- `src/components/training-course-foundation.tsx:181`: Fundación pedagógica
- `src/components/training-course-foundation.tsx:182`: Define por qué existe el curso, a quién sirve y qué desempeño debe producir.
- `src/components/training-course-foundation.tsx:190`: Antes de enviar a revisión
- `src/components/training-course-foundation.tsx:197`: Lo esencial del curso
- `src/components/training-course-foundation.tsx:198`: Describe el problema, el cambio esperado, cómo medirlo y para quién es. Lo demás es opcional.
- `src/components/training-course-foundation.tsx:201`: ¿Qué necesidad resuelve este curso?
- `src/components/training-course-foundation.tsx:202`: ¿Qué podrá hacer la persona al terminar?
- `src/components/training-course-foundation.tsx:203`: ¿Cómo sabrás que funcionó?
- `src/components/training-course-foundation.tsx:204`: ¿Para quién es?
- `src/components/training-course-foundation.tsx:206`: Añadir contexto opcional
- `src/components/training-course-foundation.tsx:208`: Línea base
- `src/components/training-course-foundation.tsx:210`: Responsable del contenido
- `src/components/training-course-foundation.tsx:211`: Experto de negocio
- `src/components/training-course-foundation.tsx:213`: Riesgo de no completar
- `src/components/training-course-foundation.tsx:222`: Selecciona la habilidad observable que este curso ayuda a desarrollar. Se requiere al menos una para publicarlo.
- `src/components/training-course-foundation.tsx:227`: una capacidad que puede observarse o evaluarse, como “Atención al cliente” o “Manejo seguro de alimentos”.
- `src/components/training-course-foundation.tsx:227`: Código:
- `src/components/training-course-foundation.tsx:227`: su identificador único para buscarla y reutilizarla en rutas y reportes, por ejemplo
- `src/components/training-course-foundation.tsx:227`: . No es necesario crear una nueva si ya existe una adecuada.
- `src/components/training-course-foundation.tsx:252`: Crear una competencia nueva
- `src/components/training-course-foundation.tsx:253`: Úsalo solo si no existe una competencia reutilizable. El código debe ser corto y único, por ejemplo
- `src/components/training-course-foundation.tsx:255`: Código de competencia
- `src/components/training-course-foundation.tsx:256`: Nombre de competencia
- `src/components/training-course-foundation.tsx:256`: Ej.: Cierre de venta consultivo
- `src/components/training-course-foundation.tsx:257`: Crear
- `src/components/training-course-foundation.tsx:265`: Objetivos de aprendizaje
- `src/components/training-course-foundation.tsx:269`: Al finalizar, la persona podrá…
- `src/components/training-course-foundation.tsx:270`: Criterio de éxito
- `src/components/training-course-foundation.tsx:271`: Método de evaluación
- `src/components/training-course-foundation.tsx:273`: Sin competencia
- `src/components/training-course-foundation.tsx:284`: Segmentación avanzada
- `src/components/training-course-foundation.tsx:284`: Opcional. Úsala si necesitas asignar el curso automáticamente por rol, puesto, sucursal o grupo.
- `src/components/training-course-foundation.tsx:290`: Valor de audiencia
- `src/components/training-course-foundation.tsx:347`: Sin asignar

### /training/content/[courseId]

- `src/components/training-course-manager.tsx:245`: Gestión de cursos
- `src/components/training-course-manager.tsx:246`: Diseña, revisa y publica experiencias formativas con trazabilidad editorial.
- `src/components/training-course-manager.tsx:266`: Buscar
- `src/components/training-course-manager.tsx:270`: Título, resumen o identificador
- `src/components/training-course-manager.tsx:295`: Categoría
- `src/components/training-course-manager.tsx:310`: Nueva categoría
- `src/components/training-course-manager.tsx:320`: Búsqueda:
- `src/components/training-course-manager.tsx:323`: Categoría:
- `src/components/training-course-manager.tsx:330`: Mostrando el catálogo completo
- `src/components/training-course-manager.tsx:335`: No fue posible cargar los cursos
- `src/components/training-course-manager.tsx:347`: Catálogo de cursos
- `src/components/training-course-manager.tsx:354`: Crear el primer curso
- `src/components/training-course-manager.tsx:444`: Nueva categoría
- `src/components/training-course-manager.tsx:444`: Agrupa cursos y crea subcategorías para facilitar su descubrimiento.
- `src/components/training-course-manager.tsx:450`: Descripción
- `src/components/training-course-manager.tsx:453`: Categoría superior
- `src/components/training-course-manager.tsx:454`: Categoría principal
- `src/components/training-course-manager.tsx:458`: Toda la plataforma
- `src/components/training-course-manager.tsx:461`: Cancelar
- `src/components/training-course-manager.tsx:593`: Pensado para apoyarse en video. Cuando una lección es audiovisual, se completa al alcanzar el
- `src/components/training-course-manager.tsx:593`: % de reproducción.
- `src/components/training-course-manager.tsx:642`: Crear curso
- `src/components/training-course-manager.tsx:643`: Empieza con lo esencial. Podrás añadir contenido, evaluaciones, certificación y configuración avanzada en el editor.
- `src/components/training-course-manager.tsx:647`: Información inicial
- `src/components/training-course-manager.tsx:651`: Título del curso
- `src/components/training-course-manager.tsx:651`: Usa un nombre claro para que las personas lo encuentren fácilmente.
- `src/components/training-course-manager.tsx:652`: Ej. Seguridad básica en el trabajo
- `src/components/training-course-manager.tsx:654`: Opcional. Una frase breve sobre lo que aprenderán las personas.
- `src/components/training-course-manager.tsx:655`: Ej. Principios y prácticas para trabajar de forma segura.
- `src/components/training-course-manager.tsx:657`: Categoría
- `src/components/training-course-manager.tsx:657`: Opcional. Puedes crear o cambiar categorías más adelante.
- `src/components/training-course-manager.tsx:658`: Sin categoría
- `src/components/training-course-manager.tsx:658`: Sin categoría
- `src/components/training-course-manager.tsx:661`: La plantilla visual crea módulos y lecciones base listas para recibir videos locales.
- `src/components/training-course-manager.tsx:672`: Crear como curso visual
- `src/components/training-course-manager.tsx:674`: Prioriza videos de apoyo y deja visible la regla de avance al 90% para completar.
- `src/components/training-course-manager.tsx:682`: Opcional, pero recomendado para cursos visuales. Sirve como apoyo de bienvenida.
- `src/components/training-course-manager.tsx:697`: Dificultad, duración, idioma, etiquetas, portada y visibilidad se configuran después, en el editor.
- `src/components/training-course-manager.tsx:698`: Cancelar
- `src/components/training-course-manager.tsx:777`: Título
- `src/components/training-course-manager.tsx:780`: Categoría
- `src/components/training-course-manager.tsx:783`: Sin categoría
- `src/components/training-course-manager.tsx:790`: Configuración avanzada
- `src/components/training-course-manager.tsx:792`: Estos datos mejoran la organización y la presentación, pero no son necesarios para guardar el contenido básico.
- `src/components/training-course-manager.tsx:793`: Descripción
- `src/components/training-course-manager.tsx:803`: Duración estimada (minutos)
- `src/components/training-course-manager.tsx:803`: Puedes ajustarla cuando definas las lecciones.
- `src/components/training-course-manager.tsx:806`: URL opcional de la imagen del curso.
- `src/components/training-course-manager.tsx:810`: Opcional. Sirve como apoyo visual y entrada rápida al contenido.
- `src/components/training-course-manager.tsx:813`: Separa las etiquetas con comas para facilitar la búsqueda.
- `src/components/training-course-manager.tsx:820`: Cancelar
- `src/components/training-course-manager.tsx:873`: Asistente editorial con guardado por etapa y requisitos de publicación.
- `src/components/training-course-manager.tsx:897`: Etapas del curso
- `src/components/training-course-manager.tsx:907`: Cargando el curso
- `src/components/training-course-manager.tsx:908`: No fue posible cargar el curso
- `src/components/training-course-manager.tsx:936`: Continuar a evaluación
- `src/components/training-course-manager.tsx:997`: Comprobación del aprendizaje
- `src/components/training-course-manager.tsx:1003`: preguntas · Aprobación
- `src/components/training-course-manager.tsx:1011`: Evaluación recomendada
- `src/components/training-course-manager.tsx:1012`: El curso todavía no tiene una evaluación. Puedes continuar, pero una evaluación permitirá comprobar los objetivos en la fase de medición.
- `src/components/training-course-manager.tsx:1058`: Cargando el curso
- `src/components/training-course-manager.tsx:1059`: No fue posible cargar el curso
- `src/components/training-course-manager.tsx:1063`: Certificación, vigencia y renovación
- `src/components/training-course-manager.tsx:1067`: Configuración incompleta
- `src/components/training-course-manager.tsx:1069`: Habilita una credencial verificable para este curso.
- `src/components/training-course-manager.tsx:1070`: Emisión automática
- `src/components/training-course-manager.tsx:1070`: Se emite al cumplir toda la evidencia.
- `src/components/training-course-manager.tsx:1071`: Exigir evaluación
- `src/components/training-course-manager.tsx:1071`: Todas las evaluaciones deben estar aprobadas.
- `src/components/training-course-manager.tsx:1072`: Valida progreso antes de emitir.
- `src/components/training-course-manager.tsx:1075`: Vigencia (días)
- `src/components/training-course-manager.tsx:1075`: Sin vencimiento
- `src/components/training-course-manager.tsx:1076`: Ventana de renovación
- `src/components/training-course-manager.tsx:1077`: Avisos antes de vencer
- `src/components/training-course-manager.tsx:1080`: Título de la credencial
- `src/components/training-course-manager.tsx:1081`: URL de insignia
- `src/components/training-course-manager.tsx:1082`: Nombre del firmante
- `src/components/training-course-manager.tsx:1083`: Cargo del firmante
- `src/components/training-course-manager.tsx:1085`: Descripción de la credencial
- `src/components/training-course-manager.tsx:1096`: Experiencia del participante
- `src/components/training-course-manager.tsx:1098`: Abre una simulación de solo lectura para revisar portada, secuencia, títulos y recursos. No guarda progreso ni modifica el curso.
- `src/components/training-course-manager.tsx:1099`: Esta sesión ya abrió la experiencia del participante.
- `src/components/training-course-manager.tsx:1102`: Continuar a revisión
- `src/components/training-course-manager.tsx:1131`: Revisión antes de publicar
- `src/components/training-course-manager.tsx:1132`: Confirma el alcance y completa los requisitos antes de cambiar el estado del curso.
- `src/components/training-course-manager.tsx:1137`: El curso todavía no puede enviarse a revisión
- `src/components/training-course-manager.tsx:1142`: Información, fundamento pedagógico y estructura están preparados para revisión.
- `src/components/training-course-manager.tsx:1145`: Recomendación
- `src/components/training-course-manager.tsx:1145`: Añade una evaluación antes de publicar para medir el aprendizaje.
- `src/components/training-course-manager.tsx:1177`: Checklist de publicación
- `src/components/training-course-manager.tsx:1177`: La publicación conserva la versión y el historial del curso.
- `src/components/training-course-manager.tsx:1185`: · La validación de calidad se muestra debajo antes de publicar.
- `src/components/training-course-manager.tsx:1220`: Cargando el curso
- `src/components/training-course-manager.tsx:1221`: No fue posible cargar el curso
- `src/components/training-course-manager.tsx:1226`: Control de calidad · versión
- `src/components/training-course-manager.tsx:1226`: Las aprobaciones anteriores no se reutilizan cuando cambia la versión.
- `src/components/training-course-manager.tsx:1242`: Solicitar las cuatro revisiones
- `src/components/training-course-manager.tsx:1243`: Primero envía el curso a revisión
- `src/components/training-course-manager.tsx:1243`: El envío abrirá una nueva versión editorial y creará automáticamente los cuatro gates.
- `src/components/training-course-manager.tsx:1245`: Piloto de la versión
- `src/components/training-course-manager.tsx:1245`: Opcional; si se crea, debe cumplir sus criterios antes del go-live.
- `src/components/training-course-manager.tsx:1245`: Crear piloto
- `src/components/training-course-manager.tsx:1251`: Cerrar con éxito
- `src/components/training-course-manager.tsx:1251`: Cancelar
- `src/components/training-course-manager.tsx:1254`: No se creó un piloto para esta versión.
- `src/components/training-course-manager.tsx:1256`: Pendiente para aprobar
- `src/components/training-course-manager.tsx:1256`: Todos los gates de calidad están aprobados.
- `src/components/training-course-manager.tsx:1288`: Registra evidencia y una decisión explícita para esta versión.
- `src/components/training-course-manager.tsx:1291`: Decisión
- `src/components/training-course-manager.tsx:1293`: Registrar decisión
- `src/components/training-course-manager.tsx:1320`: Crear piloto
- `src/components/training-course-manager.tsx:1320`: Selecciona participantes y define la evidencia mínima para autorizar el go-live.
- `src/components/training-course-manager.tsx:1323`: Respuestas mínimas
- `src/components/training-course-manager.tsx:1323`: Promedio mínimo
- `src/components/training-course-manager.tsx:1325`: Crear piloto
- `src/components/training-course-manager.tsx:1354`: módulos ·
- `src/components/training-course-manager.tsx:1358`: Detalles técnicos
- `src/components/training-course-manager.tsx:1360`: Versión editorial
- `src/components/training-course-manager.tsx:1361`: Identificador del curso
- `src/components/training-course-manager.tsx:1400`: Información
- `src/components/training-course-manager.tsx:1429`: Estructura del curso
- `src/components/training-course-manager.tsx:1430`: Construye módulos, lecciones, recursos y práctica en el orden exacto que seguirá el participante.
- `src/components/training-course-manager.tsx:1434`: Sin módulos
- `src/components/training-course-manager.tsx:1434`: Añade un módulo para comenzar a estructurar el curso.
- `src/components/training-course-manager.tsx:1437`: Título del nuevo módulo
- `src/components/training-course-manager.tsx:1437`: Título del nuevo módulo
- `src/components/training-course-manager.tsx:1438`: Añadir módulo
- `src/components/training-course-manager.tsx:1483`: Título del módulo
- `src/components/training-course-manager.tsx:1483`: Descripción del módulo
- `src/components/training-course-manager.tsx:1483`: Qué logrará el participante en este módulo
- `src/components/training-course-manager.tsx:1483`: Módulo obligatorio
- `src/components/training-course-manager.tsx:1486`: Guardar
- `src/components/training-course-manager.tsx:1488`: Título de la nueva lección
- `src/components/training-course-manager.tsx:1488`: Nueva lección
- `src/components/training-course-manager.tsx:1488`: Lección
- `src/components/training-course-manager.tsx:1547`: Título de la lección
- `src/components/training-course-manager.tsx:1547`: Duración estimada en minutos
- `src/components/training-course-manager.tsx:1547`: Descripción de la lección
- `src/components/training-course-manager.tsx:1547`: Objetivo y contexto de la lección
- `src/components/training-course-manager.tsx:1547`: Lección obligatoria
- `src/components/training-course-manager.tsx:1547`: Porcentaje para completar video
- `src/components/training-course-manager.tsx:1548`: Guardar
- `src/components/training-course-manager.tsx:1550`: Copia local de respaldo
- `src/components/training-course-manager.tsx:1550`: La copia local sirve para este navegador; la disponibilidad para participantes depende del archivo subido al servidor.
- `src/components/training-course-manager.tsx:1616`: Configura el recurso, la actividad o la evaluación con criterios claros para el participante.
- `src/components/training-course-manager.tsx:1620`: Título
- `src/components/training-course-manager.tsx:1622`: URL de transcripción
- `src/components/training-course-manager.tsx:1622`: URL de subtítulos
- `src/components/training-course-manager.tsx:1623`: Nota de accesibilidad
- `src/components/training-course-manager.tsx:1623`: Ej. PDF etiquetado y apto para lector de pantalla
- `src/components/training-course-manager.tsx:1624`: Validación del supervisor
- `src/components/training-course-manager.tsx:1624`: Criterios de aceptación
- `src/components/training-course-manager.tsx:1624`: Qué debe demostrar para aprobar
- `src/components/training-course-manager.tsx:1625`: Este contenido es obligatorio para completar la lección
- `src/components/training-course-manager.tsx:1626`: Cancelar
- `src/components/training-course-manager.tsx:1626`: Guardar
- `src/components/training-course-manager.tsx:1636`: Programar publicación
- `src/components/training-course-manager.tsx:1636`: El backend publicará el curso automáticamente en la fecha indicada.
- `src/components/training-course-manager.tsx:1638`: Publicar el
- `src/components/training-course-manager.tsx:1639`: Retirar el (opcional)
- `src/components/training-course-manager.tsx:1640`: Cancelar
- `src/components/training-course-manager.tsx:1652`: Vista previa del participante
- `src/components/training-course-manager.tsx:1653`: Revisión de solo lectura: no guarda progreso ni modifica el curso.
- `src/components/training-course-manager.tsx:1657`: Preparando la vista previa
- `src/components/training-course-manager.tsx:1658`: No fue posible abrir la vista previa
- `src/components/training-course-manager.tsx:1659`: Recurso de apoyo visual para arrancar el curso.
- `src/components/training-course-manager.tsx:1659`: Lección
- `src/components/training-course-manager.tsx:1659`: Se completa con
- `src/components/training-course-manager.tsx:1659`: % de visualización
- `src/components/training-course-manager.tsx:1677`: No fue posible cargar el video.
- `src/components/admin-crud.tsx:135`: Qué desaparece
- `src/components/admin-crud.tsx:140`: Una vez eliminado, no hay forma de recuperarlo desde el producto.
- `src/components/admin-crud.tsx:148`: Cancelar
- `src/components/design-system.tsx:50`: Buscar funciones…
- `src/components/training-course-foundation.tsx:84`: Cargando el diseño pedagógico
- `src/components/training-course-foundation.tsx:88`: No fue posible cargar el diseño pedagógico
- `src/components/training-course-foundation.tsx:181`: Fundación pedagógica
- `src/components/training-course-foundation.tsx:182`: Define por qué existe el curso, a quién sirve y qué desempeño debe producir.
- `src/components/training-course-foundation.tsx:190`: Antes de enviar a revisión
- `src/components/training-course-foundation.tsx:197`: Lo esencial del curso
- `src/components/training-course-foundation.tsx:198`: Describe el problema, el cambio esperado, cómo medirlo y para quién es. Lo demás es opcional.
- `src/components/training-course-foundation.tsx:201`: ¿Qué necesidad resuelve este curso?
- `src/components/training-course-foundation.tsx:202`: ¿Qué podrá hacer la persona al terminar?
- `src/components/training-course-foundation.tsx:203`: ¿Cómo sabrás que funcionó?
- `src/components/training-course-foundation.tsx:204`: ¿Para quién es?
- `src/components/training-course-foundation.tsx:206`: Añadir contexto opcional
- `src/components/training-course-foundation.tsx:208`: Línea base
- `src/components/training-course-foundation.tsx:210`: Responsable del contenido
- `src/components/training-course-foundation.tsx:211`: Experto de negocio
- `src/components/training-course-foundation.tsx:213`: Riesgo de no completar
- `src/components/training-course-foundation.tsx:222`: Selecciona la habilidad observable que este curso ayuda a desarrollar. Se requiere al menos una para publicarlo.
- `src/components/training-course-foundation.tsx:227`: una capacidad que puede observarse o evaluarse, como “Atención al cliente” o “Manejo seguro de alimentos”.
- `src/components/training-course-foundation.tsx:227`: Código:
- `src/components/training-course-foundation.tsx:227`: su identificador único para buscarla y reutilizarla en rutas y reportes, por ejemplo
- `src/components/training-course-foundation.tsx:227`: . No es necesario crear una nueva si ya existe una adecuada.
- `src/components/training-course-foundation.tsx:252`: Crear una competencia nueva
- `src/components/training-course-foundation.tsx:253`: Úsalo solo si no existe una competencia reutilizable. El código debe ser corto y único, por ejemplo
- `src/components/training-course-foundation.tsx:255`: Código de competencia
- `src/components/training-course-foundation.tsx:256`: Nombre de competencia
- `src/components/training-course-foundation.tsx:256`: Ej.: Cierre de venta consultivo
- `src/components/training-course-foundation.tsx:257`: Crear
- `src/components/training-course-foundation.tsx:265`: Objetivos de aprendizaje
- `src/components/training-course-foundation.tsx:269`: Al finalizar, la persona podrá…
- `src/components/training-course-foundation.tsx:270`: Criterio de éxito
- `src/components/training-course-foundation.tsx:271`: Método de evaluación
- `src/components/training-course-foundation.tsx:273`: Sin competencia
- `src/components/training-course-foundation.tsx:284`: Segmentación avanzada
- `src/components/training-course-foundation.tsx:284`: Opcional. Úsala si necesitas asignar el curso automáticamente por rol, puesto, sucursal o grupo.
- `src/components/training-course-foundation.tsx:290`: Valor de audiencia
- `src/components/training-course-foundation.tsx:347`: Sin asignar

### /training/content/new

- `src/components/training-course-manager.tsx:245`: Gestión de cursos
- `src/components/training-course-manager.tsx:246`: Diseña, revisa y publica experiencias formativas con trazabilidad editorial.
- `src/components/training-course-manager.tsx:266`: Buscar
- `src/components/training-course-manager.tsx:270`: Título, resumen o identificador
- `src/components/training-course-manager.tsx:295`: Categoría
- `src/components/training-course-manager.tsx:310`: Nueva categoría
- `src/components/training-course-manager.tsx:320`: Búsqueda:
- `src/components/training-course-manager.tsx:323`: Categoría:
- `src/components/training-course-manager.tsx:330`: Mostrando el catálogo completo
- `src/components/training-course-manager.tsx:335`: No fue posible cargar los cursos
- `src/components/training-course-manager.tsx:347`: Catálogo de cursos
- `src/components/training-course-manager.tsx:354`: Crear el primer curso
- `src/components/training-course-manager.tsx:444`: Nueva categoría
- `src/components/training-course-manager.tsx:444`: Agrupa cursos y crea subcategorías para facilitar su descubrimiento.
- `src/components/training-course-manager.tsx:450`: Descripción
- `src/components/training-course-manager.tsx:453`: Categoría superior
- `src/components/training-course-manager.tsx:454`: Categoría principal
- `src/components/training-course-manager.tsx:458`: Toda la plataforma
- `src/components/training-course-manager.tsx:461`: Cancelar
- `src/components/training-course-manager.tsx:593`: Pensado para apoyarse en video. Cuando una lección es audiovisual, se completa al alcanzar el
- `src/components/training-course-manager.tsx:593`: % de reproducción.
- `src/components/training-course-manager.tsx:642`: Crear curso
- `src/components/training-course-manager.tsx:643`: Empieza con lo esencial. Podrás añadir contenido, evaluaciones, certificación y configuración avanzada en el editor.
- `src/components/training-course-manager.tsx:647`: Información inicial
- `src/components/training-course-manager.tsx:651`: Título del curso
- `src/components/training-course-manager.tsx:651`: Usa un nombre claro para que las personas lo encuentren fácilmente.
- `src/components/training-course-manager.tsx:652`: Ej. Seguridad básica en el trabajo
- `src/components/training-course-manager.tsx:654`: Opcional. Una frase breve sobre lo que aprenderán las personas.
- `src/components/training-course-manager.tsx:655`: Ej. Principios y prácticas para trabajar de forma segura.
- `src/components/training-course-manager.tsx:657`: Categoría
- `src/components/training-course-manager.tsx:657`: Opcional. Puedes crear o cambiar categorías más adelante.
- `src/components/training-course-manager.tsx:658`: Sin categoría
- `src/components/training-course-manager.tsx:658`: Sin categoría
- `src/components/training-course-manager.tsx:661`: La plantilla visual crea módulos y lecciones base listas para recibir videos locales.
- `src/components/training-course-manager.tsx:672`: Crear como curso visual
- `src/components/training-course-manager.tsx:674`: Prioriza videos de apoyo y deja visible la regla de avance al 90% para completar.
- `src/components/training-course-manager.tsx:682`: Opcional, pero recomendado para cursos visuales. Sirve como apoyo de bienvenida.
- `src/components/training-course-manager.tsx:697`: Dificultad, duración, idioma, etiquetas, portada y visibilidad se configuran después, en el editor.
- `src/components/training-course-manager.tsx:698`: Cancelar
- `src/components/training-course-manager.tsx:777`: Título
- `src/components/training-course-manager.tsx:780`: Categoría
- `src/components/training-course-manager.tsx:783`: Sin categoría
- `src/components/training-course-manager.tsx:790`: Configuración avanzada
- `src/components/training-course-manager.tsx:792`: Estos datos mejoran la organización y la presentación, pero no son necesarios para guardar el contenido básico.
- `src/components/training-course-manager.tsx:793`: Descripción
- `src/components/training-course-manager.tsx:803`: Duración estimada (minutos)
- `src/components/training-course-manager.tsx:803`: Puedes ajustarla cuando definas las lecciones.
- `src/components/training-course-manager.tsx:806`: URL opcional de la imagen del curso.
- `src/components/training-course-manager.tsx:810`: Opcional. Sirve como apoyo visual y entrada rápida al contenido.
- `src/components/training-course-manager.tsx:813`: Separa las etiquetas con comas para facilitar la búsqueda.
- `src/components/training-course-manager.tsx:820`: Cancelar
- `src/components/training-course-manager.tsx:873`: Asistente editorial con guardado por etapa y requisitos de publicación.
- `src/components/training-course-manager.tsx:897`: Etapas del curso
- `src/components/training-course-manager.tsx:907`: Cargando el curso
- `src/components/training-course-manager.tsx:908`: No fue posible cargar el curso
- `src/components/training-course-manager.tsx:936`: Continuar a evaluación
- `src/components/training-course-manager.tsx:997`: Comprobación del aprendizaje
- `src/components/training-course-manager.tsx:1003`: preguntas · Aprobación
- `src/components/training-course-manager.tsx:1011`: Evaluación recomendada
- `src/components/training-course-manager.tsx:1012`: El curso todavía no tiene una evaluación. Puedes continuar, pero una evaluación permitirá comprobar los objetivos en la fase de medición.
- `src/components/training-course-manager.tsx:1058`: Cargando el curso
- `src/components/training-course-manager.tsx:1059`: No fue posible cargar el curso
- `src/components/training-course-manager.tsx:1063`: Certificación, vigencia y renovación
- `src/components/training-course-manager.tsx:1067`: Configuración incompleta
- `src/components/training-course-manager.tsx:1069`: Habilita una credencial verificable para este curso.
- `src/components/training-course-manager.tsx:1070`: Emisión automática
- `src/components/training-course-manager.tsx:1070`: Se emite al cumplir toda la evidencia.
- `src/components/training-course-manager.tsx:1071`: Exigir evaluación
- `src/components/training-course-manager.tsx:1071`: Todas las evaluaciones deben estar aprobadas.
- `src/components/training-course-manager.tsx:1072`: Valida progreso antes de emitir.
- `src/components/training-course-manager.tsx:1075`: Vigencia (días)
- `src/components/training-course-manager.tsx:1075`: Sin vencimiento
- `src/components/training-course-manager.tsx:1076`: Ventana de renovación
- `src/components/training-course-manager.tsx:1077`: Avisos antes de vencer
- `src/components/training-course-manager.tsx:1080`: Título de la credencial
- `src/components/training-course-manager.tsx:1081`: URL de insignia
- `src/components/training-course-manager.tsx:1082`: Nombre del firmante
- `src/components/training-course-manager.tsx:1083`: Cargo del firmante
- `src/components/training-course-manager.tsx:1085`: Descripción de la credencial
- `src/components/training-course-manager.tsx:1096`: Experiencia del participante
- `src/components/training-course-manager.tsx:1098`: Abre una simulación de solo lectura para revisar portada, secuencia, títulos y recursos. No guarda progreso ni modifica el curso.
- `src/components/training-course-manager.tsx:1099`: Esta sesión ya abrió la experiencia del participante.
- `src/components/training-course-manager.tsx:1102`: Continuar a revisión
- `src/components/training-course-manager.tsx:1131`: Revisión antes de publicar
- `src/components/training-course-manager.tsx:1132`: Confirma el alcance y completa los requisitos antes de cambiar el estado del curso.
- `src/components/training-course-manager.tsx:1137`: El curso todavía no puede enviarse a revisión
- `src/components/training-course-manager.tsx:1142`: Información, fundamento pedagógico y estructura están preparados para revisión.
- `src/components/training-course-manager.tsx:1145`: Recomendación
- `src/components/training-course-manager.tsx:1145`: Añade una evaluación antes de publicar para medir el aprendizaje.
- `src/components/training-course-manager.tsx:1177`: Checklist de publicación
- `src/components/training-course-manager.tsx:1177`: La publicación conserva la versión y el historial del curso.
- `src/components/training-course-manager.tsx:1185`: · La validación de calidad se muestra debajo antes de publicar.
- `src/components/training-course-manager.tsx:1220`: Cargando el curso
- `src/components/training-course-manager.tsx:1221`: No fue posible cargar el curso
- `src/components/training-course-manager.tsx:1226`: Control de calidad · versión
- `src/components/training-course-manager.tsx:1226`: Las aprobaciones anteriores no se reutilizan cuando cambia la versión.
- `src/components/training-course-manager.tsx:1242`: Solicitar las cuatro revisiones
- `src/components/training-course-manager.tsx:1243`: Primero envía el curso a revisión
- `src/components/training-course-manager.tsx:1243`: El envío abrirá una nueva versión editorial y creará automáticamente los cuatro gates.
- `src/components/training-course-manager.tsx:1245`: Piloto de la versión
- `src/components/training-course-manager.tsx:1245`: Opcional; si se crea, debe cumplir sus criterios antes del go-live.
- `src/components/training-course-manager.tsx:1245`: Crear piloto
- `src/components/training-course-manager.tsx:1251`: Cerrar con éxito
- `src/components/training-course-manager.tsx:1251`: Cancelar
- `src/components/training-course-manager.tsx:1254`: No se creó un piloto para esta versión.
- `src/components/training-course-manager.tsx:1256`: Pendiente para aprobar
- `src/components/training-course-manager.tsx:1256`: Todos los gates de calidad están aprobados.
- `src/components/training-course-manager.tsx:1288`: Registra evidencia y una decisión explícita para esta versión.
- `src/components/training-course-manager.tsx:1291`: Decisión
- `src/components/training-course-manager.tsx:1293`: Registrar decisión
- `src/components/training-course-manager.tsx:1320`: Crear piloto
- `src/components/training-course-manager.tsx:1320`: Selecciona participantes y define la evidencia mínima para autorizar el go-live.
- `src/components/training-course-manager.tsx:1323`: Respuestas mínimas
- `src/components/training-course-manager.tsx:1323`: Promedio mínimo
- `src/components/training-course-manager.tsx:1325`: Crear piloto
- `src/components/training-course-manager.tsx:1354`: módulos ·
- `src/components/training-course-manager.tsx:1358`: Detalles técnicos
- `src/components/training-course-manager.tsx:1360`: Versión editorial
- `src/components/training-course-manager.tsx:1361`: Identificador del curso
- `src/components/training-course-manager.tsx:1400`: Información
- `src/components/training-course-manager.tsx:1429`: Estructura del curso
- `src/components/training-course-manager.tsx:1430`: Construye módulos, lecciones, recursos y práctica en el orden exacto que seguirá el participante.
- `src/components/training-course-manager.tsx:1434`: Sin módulos
- `src/components/training-course-manager.tsx:1434`: Añade un módulo para comenzar a estructurar el curso.
- `src/components/training-course-manager.tsx:1437`: Título del nuevo módulo
- `src/components/training-course-manager.tsx:1437`: Título del nuevo módulo
- `src/components/training-course-manager.tsx:1438`: Añadir módulo
- `src/components/training-course-manager.tsx:1483`: Título del módulo
- `src/components/training-course-manager.tsx:1483`: Descripción del módulo
- `src/components/training-course-manager.tsx:1483`: Qué logrará el participante en este módulo
- `src/components/training-course-manager.tsx:1483`: Módulo obligatorio
- `src/components/training-course-manager.tsx:1486`: Guardar
- `src/components/training-course-manager.tsx:1488`: Título de la nueva lección
- `src/components/training-course-manager.tsx:1488`: Nueva lección
- `src/components/training-course-manager.tsx:1488`: Lección
- `src/components/training-course-manager.tsx:1547`: Título de la lección
- `src/components/training-course-manager.tsx:1547`: Duración estimada en minutos
- `src/components/training-course-manager.tsx:1547`: Descripción de la lección
- `src/components/training-course-manager.tsx:1547`: Objetivo y contexto de la lección
- `src/components/training-course-manager.tsx:1547`: Lección obligatoria
- `src/components/training-course-manager.tsx:1547`: Porcentaje para completar video
- `src/components/training-course-manager.tsx:1548`: Guardar
- `src/components/training-course-manager.tsx:1550`: Copia local de respaldo
- `src/components/training-course-manager.tsx:1550`: La copia local sirve para este navegador; la disponibilidad para participantes depende del archivo subido al servidor.
- `src/components/training-course-manager.tsx:1616`: Configura el recurso, la actividad o la evaluación con criterios claros para el participante.
- `src/components/training-course-manager.tsx:1620`: Título
- `src/components/training-course-manager.tsx:1622`: URL de transcripción
- `src/components/training-course-manager.tsx:1622`: URL de subtítulos
- `src/components/training-course-manager.tsx:1623`: Nota de accesibilidad
- `src/components/training-course-manager.tsx:1623`: Ej. PDF etiquetado y apto para lector de pantalla
- `src/components/training-course-manager.tsx:1624`: Validación del supervisor
- `src/components/training-course-manager.tsx:1624`: Criterios de aceptación
- `src/components/training-course-manager.tsx:1624`: Qué debe demostrar para aprobar
- `src/components/training-course-manager.tsx:1625`: Este contenido es obligatorio para completar la lección
- `src/components/training-course-manager.tsx:1626`: Cancelar
- `src/components/training-course-manager.tsx:1626`: Guardar
- `src/components/training-course-manager.tsx:1636`: Programar publicación
- `src/components/training-course-manager.tsx:1636`: El backend publicará el curso automáticamente en la fecha indicada.
- `src/components/training-course-manager.tsx:1638`: Publicar el
- `src/components/training-course-manager.tsx:1639`: Retirar el (opcional)
- `src/components/training-course-manager.tsx:1640`: Cancelar
- `src/components/training-course-manager.tsx:1652`: Vista previa del participante
- `src/components/training-course-manager.tsx:1653`: Revisión de solo lectura: no guarda progreso ni modifica el curso.
- `src/components/training-course-manager.tsx:1657`: Preparando la vista previa
- `src/components/training-course-manager.tsx:1658`: No fue posible abrir la vista previa
- `src/components/training-course-manager.tsx:1659`: Recurso de apoyo visual para arrancar el curso.
- `src/components/training-course-manager.tsx:1659`: Lección
- `src/components/training-course-manager.tsx:1659`: Se completa con
- `src/components/training-course-manager.tsx:1659`: % de visualización
- `src/components/training-course-manager.tsx:1677`: No fue posible cargar el video.
- `src/components/admin-crud.tsx:135`: Qué desaparece
- `src/components/admin-crud.tsx:140`: Una vez eliminado, no hay forma de recuperarlo desde el producto.
- `src/components/admin-crud.tsx:148`: Cancelar
- `src/components/design-system.tsx:50`: Buscar funciones…
- `src/components/training-course-foundation.tsx:84`: Cargando el diseño pedagógico
- `src/components/training-course-foundation.tsx:88`: No fue posible cargar el diseño pedagógico
- `src/components/training-course-foundation.tsx:181`: Fundación pedagógica
- `src/components/training-course-foundation.tsx:182`: Define por qué existe el curso, a quién sirve y qué desempeño debe producir.
- `src/components/training-course-foundation.tsx:190`: Antes de enviar a revisión
- `src/components/training-course-foundation.tsx:197`: Lo esencial del curso
- `src/components/training-course-foundation.tsx:198`: Describe el problema, el cambio esperado, cómo medirlo y para quién es. Lo demás es opcional.
- `src/components/training-course-foundation.tsx:201`: ¿Qué necesidad resuelve este curso?
- `src/components/training-course-foundation.tsx:202`: ¿Qué podrá hacer la persona al terminar?
- `src/components/training-course-foundation.tsx:203`: ¿Cómo sabrás que funcionó?
- `src/components/training-course-foundation.tsx:204`: ¿Para quién es?
- `src/components/training-course-foundation.tsx:206`: Añadir contexto opcional
- `src/components/training-course-foundation.tsx:208`: Línea base
- `src/components/training-course-foundation.tsx:210`: Responsable del contenido
- `src/components/training-course-foundation.tsx:211`: Experto de negocio
- `src/components/training-course-foundation.tsx:213`: Riesgo de no completar
- `src/components/training-course-foundation.tsx:222`: Selecciona la habilidad observable que este curso ayuda a desarrollar. Se requiere al menos una para publicarlo.
- `src/components/training-course-foundation.tsx:227`: una capacidad que puede observarse o evaluarse, como “Atención al cliente” o “Manejo seguro de alimentos”.
- `src/components/training-course-foundation.tsx:227`: Código:
- `src/components/training-course-foundation.tsx:227`: su identificador único para buscarla y reutilizarla en rutas y reportes, por ejemplo
- `src/components/training-course-foundation.tsx:227`: . No es necesario crear una nueva si ya existe una adecuada.
- `src/components/training-course-foundation.tsx:252`: Crear una competencia nueva
- `src/components/training-course-foundation.tsx:253`: Úsalo solo si no existe una competencia reutilizable. El código debe ser corto y único, por ejemplo
- `src/components/training-course-foundation.tsx:255`: Código de competencia
- `src/components/training-course-foundation.tsx:256`: Nombre de competencia
- `src/components/training-course-foundation.tsx:256`: Ej.: Cierre de venta consultivo
- `src/components/training-course-foundation.tsx:257`: Crear
- `src/components/training-course-foundation.tsx:265`: Objetivos de aprendizaje
- `src/components/training-course-foundation.tsx:269`: Al finalizar, la persona podrá…
- `src/components/training-course-foundation.tsx:270`: Criterio de éxito
- `src/components/training-course-foundation.tsx:271`: Método de evaluación
- `src/components/training-course-foundation.tsx:273`: Sin competencia
- `src/components/training-course-foundation.tsx:284`: Segmentación avanzada
- `src/components/training-course-foundation.tsx:284`: Opcional. Úsala si necesitas asignar el curso automáticamente por rol, puesto, sucursal o grupo.
- `src/components/training-course-foundation.tsx:290`: Valor de audiencia
- `src/components/training-course-foundation.tsx:347`: Sin asignar

### /training/dashboard

- `src/components/training/training-module-dashboard.tsx:102`: Dashboard de aprendizaje
- `src/components/training/training-module-dashboard.tsx:117`: Operaciones del módulo
- `src/components/training/training-module-dashboard.tsx:117`: Cada pantalla dice para qué sirve, con icono y texto.

### /training/evaluations

- `src/components/training-assessments.tsx:123`: Diseña instrumentos de evaluación, configura intentos y controla el criterio de aprobación.
- `src/components/training-assessments.tsx:124`: Nueva evaluación
- `src/components/training-assessments.tsx:126`: Cargando las evaluaciones
- `src/components/training-assessments.tsx:128`: No fue posible cargar las evaluaciones
- `src/components/training-assessments.tsx:138`: % mínimo
- `src/components/training-assessments.tsx:149`: Falta algo para poder usarla
- `src/components/training-assessments.tsx:174`: Aún no hay evaluaciones
- `src/components/training-assessments.tsx:174`: Una evaluación mide lo aprendido y decide si alguien aprueba el curso.
- `src/components/training-assessments.tsx:174`: Crear la primera evaluación
- `src/components/training-assessments.tsx:183`: ¿Eliminar la evaluación «
- `src/components/training-assessments.tsx:185`: Se borran también sus preguntas y sus reglas. No se puede deshacer.
- `src/components/training-assessments.tsx:189`: El servidor no permitirá borrarla
- `src/components/training-assessments.tsx:190`: , y borrarla dejaría esos resultados sin la evaluación que los explica. Retírala del curso en su lugar.
- `src/components/training-assessments.tsx:207`: Eliminar la evaluación
- `src/components/training-assessments.tsx:225`: Estado de tus evaluaciones
- `src/components/training-assessments.tsx:226`: Revisa la preparación antes de abrir una evaluación individual.
- `src/components/training-assessments.tsx:230`: Listas para usar
- `src/components/training-assessments.tsx:231`: Requieren revisión
- `src/components/training-assessments.tsx:300`: Nueva evaluación
- `src/components/training-assessments.tsx:300`: Define las reglas generales. Después podrás agregar preguntas.
- `src/components/training-assessments.tsx:303`: Título
- `src/components/training-assessments.tsx:304`: Descripción
- `src/components/training-assessments.tsx:306`: Aprobación %
- `src/components/training-assessments.tsx:361`: Reglas de evaluación
- `src/components/training-assessments.tsx:361`: Controla disponibilidad, selección, intentos y retroalimentación.
- `src/components/training-assessments.tsx:363`: Título
- `src/components/training-assessments.tsx:364`: Descripción
- `src/components/training-assessments.tsx:366`: Aprobación %
- `src/components/training-assessments.tsx:371`: Retroalimentación
- `src/components/training-assessments.tsx:377`: Rúbrica general
- `src/components/training-assessments.tsx:377`: Criterios generales de calidad
- `src/components/training-assessments.tsx:383`: Guardar reglas
- `src/components/training-assessments.tsx:439`: Selección única
- `src/components/training-assessments.tsx:439`: Selección múltiple
- `src/components/training-assessments.tsx:443`: Categoría
- `src/components/training-assessments.tsx:444`: Básica
- `src/components/training-assessments.tsx:449`: Opción
- `src/components/training-assessments.tsx:449`: Opción correcta
- `src/components/training-assessments.tsx:449`: Opción
- `src/components/training-assessments.tsx:453`: Explicación posterior
- `src/components/training-assessments.tsx:454`: procedimiento, prevención
- `src/components/training-assessments.tsx:455`: Rúbrica de calificación
- `src/components/training-assessments.tsx:456`: Guardar también en el banco de preguntas
- `src/components/training-assessments.tsx:457`: Guardar pregunta
- `src/components/training-assessments.tsx:485`: Banco de preguntas
- `src/components/training-assessments.tsx:485`: Selecciona preguntas validadas para copiarlas a
- `src/components/training-assessments.tsx:486`: Cargando el banco de preguntas
- `src/components/training-assessments.tsx:499`: El banco de preguntas está vacío
- `src/components/training-assessments.tsx:499`: Al crear una pregunta, marca «Guardar también en el banco» para poder reutilizarla en otras evaluaciones.
- `src/components/training-assessments.tsx:542`: Completa tus evaluaciones pendientes y consulta claramente el resultado de cada intento.
- `src/components/training-assessments.tsx:545`: Evaluación de
- `src/components/training-assessments.tsx:545`: % para aprobar
- `src/components/training-assessments.tsx:545`: Último resultado:
- `src/components/training-assessments.tsx:545`: Retroalimentación:
- `src/components/training-assessments.tsx:545`: Cuando un curso asignado incluya una evaluación, aparecerá aquí.
- `src/components/training-assessments.tsx:561`: Consulta tu último intento antes de volver a empezar.
- `src/components/training-assessments.tsx:566`: En revisión
- `src/components/training-assessments.tsx:704`: Responde todas las preguntas antes de enviar. El envío es definitivo.
- `src/components/training-assessments.tsx:745`: Cargando los resultados
- `src/components/training-assessments.tsx:766`: Aún no hay intentos
- `src/components/training-assessments.tsx:766`: Los resultados aparecerán aquí en cuanto alguien rinda una evaluación.
- `src/components/training-assessments.tsx:779`: Resumen de resultados
- `src/components/training-assessments.tsx:780`: intentos en total · estados calculados para esta página.
- `src/components/training-assessments.tsx:784`: Revisión pendiente
- `src/components/training-assessments.tsx:797`: Revisión pendiente
- `src/components/training-assessments.tsx:820`: Consulta credenciales verificables, evidencia, vigencia y cadena de renovación.
- `src/components/training-assessments.tsx:821`: Cargando los certificados
- `src/components/training-assessments.tsx:840`: Número:
- `src/components/training-assessments.tsx:841`: Emisión:
- `src/components/training-assessments.tsx:854`: Aún no hay certificados
- `src/components/training-assessments.tsx:854`: Al aprobar un curso que los emite, el certificado aparecerá aquí.
- `src/components/training-assessments.tsx:867`: Estado de credenciales

### /training/integrations

- `src/components/training-integrations-panel.tsx:77`: Cargando las integraciones formativas
- `src/components/training-integrations-panel.tsx:78`: No fue posible cargar las integraciones
- `src/components/training-integrations-panel.tsx:81`: Supervisa SCORM, actividad xAPI, sesiones virtuales y webhooks sin exponer secretos.
- `src/components/training-integrations-panel.tsx:85`: Registra un paquete para reproducir contenido formativo dentro de la plataforma.
- `src/components/training-integrations-panel.tsx:85`: Registrar el primero
- `src/components/training-integrations-panel.tsx:85`: La configuración anterior no guardó un secreto recuperable. Crea un webhook nuevo con su secreto.
- `src/components/training-integrations-panel.tsx:85`: Un webhook avisa a otro sistema cuando ocurre algo en la formación.
- `src/components/training-integrations-panel.tsx:85`: Configurar el primero
- `src/components/training-integrations-panel.tsx:86`: Reintentar
- `src/components/training-integrations-panel.tsx:86`: Todavía no hay entregas
- `src/components/training-integrations-panel.tsx:86`: Aquí aparecerán los envíos a los sistemas conectados.
- `src/components/training-integrations-panel.tsx:87`: Próximas sesiones
- `src/components/training-integrations-panel.tsx:87`: Abrir reunión
- `src/components/training-integrations-panel.tsx:87`: No hay sesiones próximas
- `src/components/training-integrations-panel.tsx:87`: Programa una sesión virtual para que aparezca en la agenda.
- `src/components/training-integrations-panel.tsx:87`: Programar una sesión
- `src/components/training-integrations-panel.tsx:87`: Es una sugerencia; requiere confirmación humana.
- `src/components/training-integrations-panel.tsx:87`: Cuando el sistema detecte una oportunidad, aparecerá aquí para que una persona decida.
- `src/components/training-integrations-panel.tsx:96`: Qué puedes conectar
- `src/components/training-integrations-panel.tsx:97`: Elige la integración según el tipo de experiencia o sistema que necesitas supervisar.
- `src/components/training-integrations-panel.tsx:100`: Paquetes de contenido formativo que se reproducen dentro de la plataforma.
- `src/components/training-integrations-panel.tsx:101`: Eventos que registran actividad de aprendizaje y uso de recursos.
- `src/components/training-integrations-panel.tsx:102`: Notificaciones automáticas para informar a otros sistemas sobre eventos.
- `src/components/training-integrations-panel.tsx:136`: Comprobando la operación formativa
- `src/components/training-integrations-panel.tsx:137`: No fue posible consultar la operación
- `src/components/training-integrations-panel.tsx:144`: Centro de operaciones
- `src/components/training-integrations-panel.tsx:144`: Atrasos reales, recuperación tenant-safe y evidencia de cada intervención.
- `src/components/training-integrations-panel.tsx:159`: Acciones de recuperación
- `src/components/training-integrations-panel.tsx:181`: Todavía no hay recuperaciones manuales
- `src/components/training-integrations-panel.tsx:181`: Cada acción de recuperación que ejecutes quedará registrada aquí.
- `src/components/training-integrations-panel.tsx:185`: Auditoría formativa
- `src/components/training-integrations-panel.tsx:193`: La actividad sobre formación aparecerá aquí en cuanto ocurra.
- `src/components/training-integrations-panel.tsx:215`: La operación queda aislada a la empresa activa y será auditada.
- `src/components/training-integrations-panel.tsx:216`: Nombre del paquete
- `src/components/training-integrations-panel.tsx:216`: Máximo 100 MB. Se valida manifest, rutas, tamaño expandido y checksum antes de almacenarlo.
- `src/components/training-integrations-panel.tsx:217`: Secreto de firma
- `src/components/training-integrations-panel.tsx:218`: Título
- `src/components/training-integrations-panel.tsx:218`: Enlace de reunión
- `src/components/training-integrations-panel.tsx:218`: Sin curso
- `src/components/training-integrations-panel.tsx:219`: Guardar

### /training/intelligence

- `src/components/training-intelligence-panel.tsx:134`: Inteligencia de aprendizaje
- `src/components/training-intelligence-panel.tsx:135`: Competencias, carrera, feedback, retorno y previsiones, sin mezclar datos entre empresas.
- `src/components/training-intelligence-panel.tsx:139`: Registrar señal
- `src/components/training-intelligence-panel.tsx:145`: Cargando la inteligencia de aprendizaje
- `src/components/training-intelligence-panel.tsx:148`: No fue posible cargar la inteligencia de aprendizaje
- `src/components/training-intelligence-panel.tsx:155`: Perfiles de competencia
- `src/components/training-intelligence-panel.tsx:157`: Planes de carrera activos
- `src/components/training-intelligence-panel.tsx:158`: Respuestas de feedback
- `src/components/training-intelligence-panel.tsx:160`: Retorno de la inversión
- `src/components/training-intelligence-panel.tsx:170`: Distancia entre el nivel evaluado y el nivel esperado.
- `src/components/training-intelligence-panel.tsx:195`: Aún no hay brechas calculadas
- `src/components/training-intelligence-panel.tsx:196`: Registra evaluaciones de competencia para que aparezcan aquí.
- `src/components/training-intelligence-panel.tsx:202`: Previsión de cumplimiento
- `src/components/training-intelligence-panel.tsx:223`: de
- `src/components/training-intelligence-panel.tsx:224`: en riesgo de vencer · calculada el
- `src/components/training-intelligence-panel.tsx:233`: Todavía no hay previsiones
- `src/components/training-intelligence-panel.tsx:234`: Registra una previsión para empezar el seguimiento de la cohorte.
- `src/components/training-intelligence-panel.tsx:243`: Registrar una previsión
- `src/components/training-intelligence-panel.tsx:256`: Registrar señal
- `src/components/training-intelligence-panel.tsx:258`: Elige el tipo y completa los datos. Los identificadores se toman de las personas, los cursos y las competencias que ya existen.
- `src/components/training-intelligence-panel.tsx:285`: Guardar registro

### /training/learn/[courseId]

- `src/app/(app)/training/learn/[courseId]/page.tsx:57`: Cargando el contenido de la capacitación
- `src/app/(app)/training/learn/[courseId]/page.tsx:60`: No fue posible cargar la capacitación
- `src/components/training-learning-hub.tsx:143`: Continúa tus cursos, asigna formación y supervisa el avance del programa.
- `src/components/training-learning-hub.tsx:155`: Secciones de aprendizaje
- `src/components/training-learning-hub.tsx:167`: Supervisión
- `src/components/training-learning-hub.tsx:221`: Cargando las prioridades de aprendizaje
- `src/components/training-learning-hub.tsx:223`: No fue posible cargar las prioridades
- `src/components/training-learning-hub.tsx:239`: Acciones del ciclo
- `src/components/training-learning-hub.tsx:240`: Cada acción abre el área especializada sin perder el contexto operativo.
- `src/components/training-learning-hub.tsx:243`: Crear contenido
- `src/components/training-learning-hub.tsx:258`: Siguiente acción recomendada
- `src/components/training-learning-hub.tsx:260`: Revisa las asignaciones vencidas y contacta a las personas responsables.
- `src/components/training-learning-hub.tsx:260`: Hay cursos esperando revisión antes de publicar.
- `src/components/training-learning-hub.tsx:260`: Algunas evaluaciones todavía no están listas para usarse.
- `src/components/training-learning-hub.tsx:260`: Mantener el ciclo
- `src/components/training-learning-hub.tsx:260`: No hay bloqueos críticos. Consulta resultados o crea nuevo contenido.
- `src/components/training-learning-hub.tsx:285`: Cola de atención
- `src/components/training-learning-hub.tsx:285`: Pendientes agrupados por tipo, responsable y resolución.
- `src/components/training-learning-hub.tsx:290`: Asignación vencida
- `src/components/training-learning-hub.tsx:293`: Curso en revisión
- `src/components/training-learning-hub.tsx:296`: Evaluación incompleta
- `src/components/training-learning-hub.tsx:298`: No hay cursos, asignaciones o evaluaciones que requieran atención.
- `src/components/training-learning-hub.tsx:333`: Cargando la supervisión
- `src/components/training-learning-hub.tsx:334`: No fue posible cargar la supervisión
- `src/components/training-learning-hub.tsx:350`: Consulta avance, vencimientos, evaluaciones y certificados en el mismo contexto.
- `src/components/training-learning-hub.tsx:351`: Todos los cursos
- `src/components/training-learning-hub.tsx:351`: Todos los estados
- `src/components/training-learning-hub.tsx:351`: Todos los responsables
- `src/components/training-learning-hub.tsx:353`: Detalle de supervisión
- `src/components/training-learning-hub.tsx:353`: intentos de evaluación ·
- `src/components/training-learning-hub.tsx:353`: No hay datos para los filtros seleccionados.
- `src/components/training-learning-hub.tsx:438`: Prueba contenido antes de su publicación y reporta cualquier bloqueo.
- `src/components/training-learning-hub.tsx:443`: Dar retroalimentación
- `src/components/training-learning-hub.tsx:449`: Retroalimentación del piloto
- `src/components/training-learning-hub.tsx:449`: Tu evaluación define si esta versión puede publicarse.
- `src/components/training-learning-hub.tsx:453`: Encontré un problema que bloquea la publicación
- `src/components/training-learning-hub.tsx:454`: Enviar retroalimentación
- `src/components/training-learning-hub.tsx:491`: Buscar
- `src/components/training-learning-hub.tsx:496`: Curso, categoría o palabra clave
- `src/components/training-learning-hub.tsx:565`: Tu formación
- `src/components/training-learning-hub.tsx:589`: No tienes formación pendiente
- `src/components/training-learning-hub.tsx:595`: Antes de empezar
- `src/components/training-learning-hub.tsx:717`: Congela una audiencia, distribuye por lotes y mide adopción sin perder trazabilidad.
- `src/components/training-learning-hub.tsx:720`: Nueva campaña
- `src/components/training-learning-hub.tsx:722`: Cargando las campañas
- `src/components/training-learning-hub.tsx:723`: No fue posible cargar las campañas
- `src/components/training-learning-hub.tsx:747`: Todavía no hay campañas
- `src/components/training-learning-hub.tsx:748`: Una campaña congela la audiencia y reparte el curso por lotes, para que puedas medir la adopción sin perder el rastro de a quién le llegó.
- `src/components/training-learning-hub.tsx:749`: Crear la primera campaña
- `src/components/training-learning-hub.tsx:785`: · versión
- `src/components/training-learning-hub.tsx:794`: Despliegue de audiencia
- `src/components/training-learning-hub.tsx:808`: Lotes de
- `src/components/training-learning-hub.tsx:845`: Cancelar campaña
- `src/components/training-learning-hub.tsx:855`: ¿Cancelar la campaña «
- `src/components/training-learning-hub.tsx:857`: Quienes ya la recibieron conservan su curso y su avance. Lo que se detiene es el reparto de lo que queda. No se puede reanudar: habría que crear otra campaña.
- `src/components/training-learning-hub.tsx:861`: A quién afecta
- `src/components/training-learning-hub.tsx:867`: Mantener la campaña
- `src/components/training-learning-hub.tsx:876`: Cancelar la campaña
- `src/components/training-learning-hub.tsx:1065`: Nueva campaña de lanzamiento
- `src/components/training-learning-hub.tsx:1066`: Registra los datos, revisa a quién afecta y confirma.
- `src/components/training-learning-hub.tsx:1073`: Nombre de campaña
- `src/components/training-learning-hub.tsx:1075`: Personas específicas
- `src/components/training-learning-hub.tsx:1075`: Sucursales
- `src/components/training-learning-hub.tsx:1075`: Toda la empresa
- `src/components/training-learning-hub.tsx:1092`: Toda la empresa
- `src/components/training-learning-hub.tsx:1093`: Se congelará la lista de personas activas que haya en este momento.
- `src/components/training-learning-hub.tsx:1100`: Fecha límite
- `src/components/training-learning-hub.tsx:1105`: Formación obligatoria
- `src/components/training-learning-hub.tsx:1106`: Se mostrará como requisito para toda la audiencia.
- `src/components/training-learning-hub.tsx:1110`: Cancelar
- `src/components/training-learning-hub.tsx:1120`: Corregir los datos
- `src/components/training-learning-hub.tsx:1227`: Seguimiento de asignaciones
- `src/components/training-learning-hub.tsx:1228`: Consulta avance, vencimientos y formación pendiente.
- `src/components/training-learning-hub.tsx:1249`: Requiere atención
- `src/components/training-learning-hub.tsx:1249`: Prioriza las asignaciones vencidas o que necesitan seguimiento.
- `src/components/training-learning-hub.tsx:1269`: Asignaciones de formación
- `src/components/training-learning-hub.tsx:1270`: Asignar el primer curso
- `src/components/training-learning-hub.tsx:1285`: No fue posible cargar las asignaciones
- `src/components/training-learning-hub.tsx:1300`: ¿Retirar esta asignación?
- `src/components/training-learning-hub.tsx:1307`: Qué pasa con lo avanzado
- `src/components/training-learning-hub.tsx:1325`: Retirar la asignación
- `src/components/training-learning-hub.tsx:1377`: Define la audiencia y las fechas de cumplimiento.
- `src/components/training-learning-hub.tsx:1380`: Personas específicas
- `src/components/training-learning-hub.tsx:1380`: Sucursales
- `src/components/training-learning-hub.tsx:1380`: Toda la empresa
- `src/components/training-learning-hub.tsx:1381`: El curso se asignará a todas las personas activas de la empresa.
- `src/components/training-learning-hub.tsx:1382`: Fecha límite
- `src/components/training-learning-hub.tsx:1383`: Cancelar
- `src/components/training-learning-hub.tsx:1421`: Cargando el contenido del curso
- `src/components/training-learning-hub.tsx:1421`: No fue posible cargar el curso
- `src/components/training-learning-hub.tsx:1443`: Siguiente lección:
- `src/components/training-learning-hub.tsx:1443`: Has completado todo el contenido disponible.
- `src/components/training-learning-hub.tsx:1444`: Formación completada
- `src/components/training-learning-hub.tsx:1450`: La lección actual está resaltada en el contenido.
- `src/components/training-learning-hub.tsx:1453`: Necesitas demostrar el aprendizaje antes de cerrar esta formación.
- `src/components/training-learning-hub.tsx:1453`: Comenzar evaluación
- `src/components/training-learning-hub.tsx:1477`: Este video no está disponible aquí
- `src/components/training-learning-hub.tsx:1477`: Se guardó localmente en el navegador de quien lo editó y todavía no se ha subido.
- `src/components/training-learning-hub.tsx:1547`: Verifica que el archivo sea un MP4 compatible (H.264/AAC) y vuelve a cargarlo desde el editor.
- `src/components/strict-video-lesson.tsx:63`: Porcentaje de video visto y validado
- `src/components/training/course-player.tsx:121`: Lecciones del curso
- `src/components/training/course-player.tsx:159`: Para terminar
- `src/components/training/course-player.tsx:171`: Evaluación
- `src/components/training/course-player.tsx:205`: Vence el
- `src/components/training/course-player.tsx:219`: Sin empezar
- `src/components/training/course-player.tsx:259`: Contenido del curso
- `src/components/training/course-player.tsx:268`: Contenido del curso
- `src/components/training/course-player.tsx:295`: Para terminar
- `src/components/training/course-player.tsx:300`: Para aprobar
- `src/components/training/course-player.tsx:304`: Antes, termina las lecciones
- `src/components/training/course-player.tsx:305`: . La evaluación se abre cuando el contenido esté completo.
- `src/components/training/course-player.tsx:310`: Último resultado:
- `src/components/training/course-player.tsx:310`: %. Puedes volver a intentarlo
- `src/components/training/course-player.tsx:319`: Comenzar evaluación
- `src/components/training/course-player.tsx:325`: Comenzar evaluación
- `src/components/training/course-player.tsx:330`: Volver a las lecciones
- `src/components/training/course-player.tsx:404`: Lección
- `src/components/training/course-player.tsx:404`: de
- `src/components/training/course-player.tsx:444`: Esta lección no tiene contenido todavía
- `src/components/training/course-player.tsx:444`: Quien administra el curso puede añadirlo desde «Gestionar cursos».
- `src/components/training/course-player.tsx:449`: No se pudo guardar el avance
- `src/components/training/course-player.tsx:464`: Se marca como completada al terminar de ver el video.
- `src/components/training/course-player.tsx:621`: No fue posible cargar el video

### /training/paths

- `src/components/training-paths-manager.tsx:127`: Rutas y automatización
- `src/components/training-paths-manager.tsx:128`: Ordena cursos con prerrequisitos y asigna formación automáticamente desde la incorporación.
- `src/components/training-paths-manager.tsx:138`: Incorporación preseleccionada
- `src/components/training-paths-manager.tsx:146`: Cargando las rutas formativas
- `src/components/training-paths-manager.tsx:149`: No fue posible cargar las rutas
- `src/components/training-paths-manager.tsx:157`: Todavía no hay rutas de aprendizaje
- `src/components/training-paths-manager.tsx:158`: Una ruta ordena varios cursos publicados con sus prerrequisitos, para que cada persona los haga en el orden correcto.
- `src/components/training-paths-manager.tsx:162`: Crear la primera ruta
- `src/components/training-paths-manager.tsx:226`: No se pudo quitar el curso
- `src/components/training-paths-manager.tsx:234`: Esta ruta todavía está vacía
- `src/components/training-paths-manager.tsx:235`: Agrega el primer curso publicado para definir por dónde empieza.
- `src/components/training-paths-manager.tsx:238`: Agregar el primer curso
- `src/components/training-paths-manager.tsx:310`: ¿Quitar «
- `src/components/training-paths-manager.tsx:310`: » de la ruta?
- `src/components/training-paths-manager.tsx:312`: Deja de formar parte de la secuencia. Las personas que ya lo completaron conservan su avance; a las que no lo hayan empezado dejará de exigírseles dentro de esta ruta.
- `src/components/training-paths-manager.tsx:326`: Quitar de la ruta
- `src/components/training-paths-manager.tsx:335`: ¿Eliminar la regla «
- `src/components/training-paths-manager.tsx:337`: Las próximas incorporaciones dejarán de recibir esta formación automáticamente. Las asignaciones que la regla ya creó se conservan.
- `src/components/training-paths-manager.tsx:342`: No se pudo eliminar la regla
- `src/components/training-paths-manager.tsx:356`: Eliminar la regla
- `src/components/training-paths-manager.tsx:413`: Asignación automática desde la incorporación
- `src/components/training-paths-manager.tsx:414`: Cada regla conecta una plantilla de incorporación con un curso o una ruta.
- `src/components/training-paths-manager.tsx:424`: Cargando las reglas de incorporación
- `src/components/training-paths-manager.tsx:427`: No fue posible cargar las reglas
- `src/components/training-paths-manager.tsx:434`: Sin reglas automáticas
- `src/components/training-paths-manager.tsx:435`: Con una regla, cada persona que se incorpora recibe su formación sin que nadie tenga que asignarla a mano.
- `src/components/training-paths-manager.tsx:438`: Crear la primera regla
- `src/components/training-paths-manager.tsx:450`: · vence a los
- `src/components/training-paths-manager.tsx:451`: días ·
- `src/components/training-paths-manager.tsx:562`: La configuración se aplica respetando permisos, trazabilidad y fechas límite reales.
- `src/components/training-paths-manager.tsx:568`: Título
- `src/components/training-paths-manager.tsx:569`: Descripción
- `src/components/training-paths-manager.tsx:600`: Habilitar después de días
- `src/components/training-paths-manager.tsx:610`: Nombre de la regla
- `src/components/training-paths-manager.tsx:612`: Plantilla de incorporación
- `src/components/training-paths-manager.tsx:625`: Alcance de sucursal
- `src/components/training-paths-manager.tsx:664`: Código de rol (opcional)
- `src/components/training-paths-manager.tsx:669`: Días para completar
- `src/components/training-paths-manager.tsx:678`: No se pudo guardar la configuración
- `src/components/training-paths-manager.tsx:696`: Guardar configuración

### /training/results

- `src/components/training-analytics-dashboard.tsx:106`: Analítica y cumplimiento
- `src/components/training-analytics-dashboard.tsx:107`: Prioriza vencimientos, mide resultados y conserva evidencia operativa de la formación.
- `src/components/training-analytics-dashboard.tsx:111`: Políticas
- `src/components/training-analytics-dashboard.tsx:154`: Calculando los indicadores
- `src/components/training-analytics-dashboard.tsx:155`: No fue posible calcular la analítica
- `src/components/training-analytics-dashboard.tsx:197`: Sin filtros aplicados
- `src/components/training-analytics-dashboard.tsx:204`: Finalización
- `src/components/training-analytics-dashboard.tsx:205`: Aprobación
- `src/components/training-analytics-dashboard.tsx:234`: Ordena por cualquier columna para encontrar dónde se atasca la formación.
- `src/components/training-analytics-dashboard.tsx:263`: Midiendo la efectividad
- `src/components/training-analytics-dashboard.tsx:265`: No fue posible medir la efectividad
- `src/components/training-analytics-dashboard.tsx:274`: Efectividad del aprendizaje
- `src/components/training-analytics-dashboard.tsx:275`: Combina adopción, finalización, evaluación, vencimiento y evidencia del piloto.
- `src/components/training-analytics-dashboard.tsx:278`: críticas
- `src/components/training-analytics-dashboard.tsx:279`: señales
- `src/components/training-analytics-dashboard.tsx:286`: Señales abiertas
- `src/components/training-analytics-dashboard.tsx:331`: Versión
- `src/components/training-analytics-dashboard.tsx:332`: índice de salud sobre 100
- `src/components/training-analytics-dashboard.tsx:348`: Señales que requieren atención
- `src/components/training-analytics-dashboard.tsx:353`: Crear mejora
- `src/components/training-analytics-dashboard.tsx:357`: Sin señales de alerta
- `src/components/training-analytics-dashboard.tsx:357`: No se detectaron señales con evidencia suficiente en este periodo.
- `src/components/training-analytics-dashboard.tsx:360`: Recorrido por lección
- `src/components/training-analytics-dashboard.tsx:425`: Pendientes de mejora
- `src/components/training-analytics-dashboard.tsx:425`: Convierte evidencia en acciones con responsable y criterio de cierre.
- `src/components/training-analytics-dashboard.tsx:428`: Cargando las iniciativas de mejora
- `src/components/training-analytics-dashboard.tsx:445`: No hay iniciativas con estos filtros
- `src/components/training-analytics-dashboard.tsx:445`: Cambia el curso, la sucursal o el periodo, o crea una mejora a partir de una señal.
- `src/components/training-analytics-dashboard.tsx:492`: Crear iniciativa de mejora
- `src/components/training-analytics-dashboard.tsx:494`: Título
- `src/components/training-analytics-dashboard.tsx:495`: Descripción y criterio esperado
- `src/components/training-analytics-dashboard.tsx:497`: Crítica
- `src/components/training-analytics-dashboard.tsx:498`: Asignar después
- `src/components/training-analytics-dashboard.tsx:522`: . Documenta el resultado para conservar evidencia verificable.
- `src/components/training-analytics-dashboard.tsx:522`: Describe qué cambió y cómo se verificó…
- `src/components/training-analytics-dashboard.tsx:571`: Matriz de cumplimiento
- `src/components/training-analytics-dashboard.tsx:578`: Matriz de cumplimiento
- `src/components/training-analytics-dashboard.tsx:607`: Política de cumplimiento
- `src/components/training-analytics-dashboard.tsx:607`: Define la fecha límite, renovación y anticipación de recordatorios para un curso obligatorio.
- `src/components/training-analytics-dashboard.tsx:607`: Días para completar
- `src/components/training-analytics-dashboard.tsx:607`: 365 días
- `src/components/training-analytics-dashboard.tsx:607`: Recordar antes (días)
- `src/components/training-analytics-dashboard.tsx:607`: Separa varios valores con comas.
- `src/components/training-analytics-dashboard.tsx:607`: políticas configuradas actualmente.
- `src/components/training-analytics-dashboard.tsx:607`: Guardar política


## Cierre de comprobación en Chrome

Usuarios: se verificaron búsqueda, filtros, columnas, rol y regreso EN → ES. Reportes: se verificaron filtros, ubicación no registrada, modo compacto y resumen en inglés. Se separó por contexto la palabra «Activo» para distinguir estados (Active) de bienes de inventario (Asset), con prueba de regresión. Las pruebas de navegador fueron representativas, no una certificación de todos los diálogos y estados del sistema.

## Corrección de las capturas de Reclutamiento y Mis cursos

La consulta del dashboard operativo de ATS ahora distingue el idioma en su clave de caché y lo envía explícitamente al servidor. Se traduce la copia operativa conocida, conservando nombres y puestos. El embudo localiza su resumen accesible, porcentajes y etiquetas. Las fechas del resumen de contratación usan el idioma activo.

Mis cursos: se corrigieron acciones, estados, vencimientos, avisos previos, textos accesibles y fechas; se conserva el contenido creado por la empresa. «Vencido» usa el contexto de formación (Overdue).

Validación: 28 pruebas enfocadas aprobadas, TypeScript y compilación Docker correctos; ESLint sin errores, una advertencia previa de componente sin uso. En Chrome se confirmaron Start course, Continue course, Pending, In progress, Overdue y fechas inglesas; en ATS se confirmaron Review new application, Prepare interview, resumen del embudo y fechas. Se comprobó el regreso de ATS a español. Docker local actualizado; no publicación Git en esta corrección.
