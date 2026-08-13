# Matriz QA de Pantallas

Convenciones: Estado `I` implementada, `R` restringida por acceso, `P` placeholder/no lista. Mobile indica evaluación estática del patrón y cobertura automatizada disponible: `C` cubierta, `P` parcial, `N` no cubierta. Riesgo considera negocio, permisos y complejidad.

| Pantalla | Ruta | Rol / permiso principal | Módulo | Estado | Mobile | Riesgo |
| --- | --- | --- | --- | --- | --- | --- |
| Inicio público | `/` | Visitante | Público | I | C | Bajo |
| Vacantes públicas | `/jobs` | Visitante | ATS | I | C | Medio |
| Postulación | `/apply` | Visitante | ATS | I | P | Alto |
| Estado postulación | `/application-status` | Candidato | ATS | I | C | Medio |
| Login | `/login` | Visitante | Auth | I | C | Alto |
| Recuperar contraseña | `/forgot-password` | Visitante | Auth | I | P | Alto |
| Registro empresa | `/register-company` | Visitante | SaaS | I | P | Alto |
| Portal candidato | `/candidate/portal` | Candidato autenticado | ATS | I | C | Alto |
| Perfil candidato | `/candidate/profile` | Candidato autenticado | ATS | I | C | Alto |
| Agenda candidato | `/candidate/interviews/schedule` | Token candidato | ATS | I | P | Alto |
| Preboarding candidato | `/candidate/preboarding` | Candidato autenticado | Onboarding | I | C | Alto |
| Restablecer candidato | `/candidate/reset-password` | Token candidato | Auth | I | C | Alto |
| Verificar certificado | `/certificates/verify/[code]` | Visitante | Capacitación | I | P | Medio |
| Firma pública | `/sign/[token]` | Firmante por token | Firma | I | P | Alto |
| Inicio operativo | `/dashboard` | `dashboard.view` | Dashboard | I | P | Alto |
| Mi perfil | `/profile` | `profile.view` | Perfil | I | P | Medio |
| Empleados | `/employees` | Productividad; admin/supervisor | Personas | I | P | Alto |
| Incorporaciones | `/onboarding/documents` | `onboarding.view` | Onboarding | I | P | Alto |
| Firmas | `/onboarding/signatures` | `onboarding.view` | Onboarding | I | P | Alto |
| Automatización onboarding | `/onboarding/operations` | Onboarding | Onboarding | I | P | Alto |
| Analítica onboarding | `/onboarding/analytics` | Onboarding | Onboarding | I | P | Medio |
| Cumplimiento onboarding | `/onboarding/compliance` | Onboarding | Onboarding | I | P | Alto |
| Vacantes internas | `/ats/vacancies` | `jobs.view` | ATS | I | P | Alto |
| Flujo selección | `/ats/pipeline` | `applications.view` | ATS | I | P | Alto |
| Candidatos | `/ats/candidates` | `candidates.view` | ATS | I | P | Alto |
| Perfil candidato | `/ats/candidates/[id]` | `candidates.view` | ATS | I | P | Alto |
| Talent CRM | `/ats/talent-crm` | `candidates.view` | ATS | I | P | Alto |
| Comunicaciones ATS | `/ats/communications` | `applications.view` | ATS | I | P | Alto |
| Entrevistas | `/ats/interviews` | `interviews.view` | ATS | I | P | Alto |
| Scorecards | `/ats/scorecards` | `interviews.view` | ATS | I | P | Alto |
| Analítica ATS | `/ats/analytics` | `applications.view` | ATS | I | P | Medio |
| Aprendizaje personal | `/training` | `training.view` | Capacitación | I | P | Alto |
| Evaluaciones | `/training/evaluations` | `training.view` | Capacitación | I | P | Alto |
| Resultados | `/training/results` | Instructor/admin | Capacitación | I | P | Medio |
| Inteligencia formativa | `/training/intelligence` | `training.manage` | Capacitación | I | P | Alto |
| Certificados | `/training/certificates` | `training.view` | Capacitación | I | P | Medio |
| Gestionar cursos | `/training/content` | `training.manage` | Capacitación | I | P | Alto |
| Rutas y cumplimiento | `/training/paths` | `training.manage` | Capacitación | I | P | Alto |
| Integraciones formativas | `/training/integrations` | `training.integrations.manage` | Capacitación | I | P | Alto |
| Productividad | `/productivity` | `productivity.view` | Productividad | I | P | Alto |
| Cámaras y zonas | `/productivity/cameras` | `productivity.manage` | Productividad | I | P | Alto |
| Inventario | `/inventory` | `inventory.view` | Inventario | I | P | Alto |
| Almacén y stock | `/inventory/warehouse` | `inventory.manage` | Inventario | I | P | Alto |
| Compras | `/inventory/purchases` | `inventory.manage` | Inventario | I | P | Alto |
| Mantenimiento | `/inventory/maintenance` | `inventory.manage` | Inventario | I | P | Alto |
| Escáner | `/inventory/scan` | `inventory.view` | Inventario | I | P | Alto |
| Mis activos | `/inventory/my-assets` | `inventory.view` | Inventario | I | P | Medio |
| Entregas | `/inventory/deliveries` | `inventory.view` | Inventario | I | P | Alto |
| Devoluciones | `/inventory/returns` | `inventory.view` | Inventario | I | P | Alto |
| Analítica inventario | `/inventory/analytics` | `inventory.view` | Inventario | I | P | Medio |
| Auditoría inventario | `/inventory/audit` | `inventory.manage` | Inventario | I | P | Alto |
| Reportes | `/reports` | `reports.view` | Reportes | I | P | Medio |
| Alertas | `/notifications` | `notifications.view` | Notificaciones | I | P | Medio |
| Resumen administración | `/admin` | `admin.view` | Administración | I | P | Medio |
| Empresa | `/admin/company` | `admin.company` | Administración | I | P | Alto |
| Sucursales | `/admin/branches` | `branches.view` | Administración | I | P | Alto |
| Usuarios | `/admin/users` | `users.view` | Administración | I | P | Alto |
| Roles | `/admin/roles` | `roles.view` | Administración | I | P | Alto |
| Automatizaciones | `/admin/automations` | `admin.view` | Administración | I | P | Alto |
| Suscripción empresa | `/admin/company/subscription` | `admin.subscription` | Administración | I | P | Alto |
| Empresas SaaS | `/admin/tenants` | `tenants.view` | Gobierno | I | P | Alto |
| Planes | `/admin/plans` | `admin.subscription` | Gobierno | I | P | Alto |
| Módulos | `/admin/modules` | `admin.company` | Gobierno | I | P | Alto |
| Integraciones SaaS | `/admin/integrations` | `platform.integrations.manage` | Gobierno | I | P | Alto |
| Suscripciones SaaS | `/admin/subscription` | `admin.subscription` | Gobierno | I | P | Alto |
| Facturación | `/admin/billing` | `admin.subscription` | Gobierno | I | P | Alto |
| Usuarios globales | `/admin/global-users` | `admin.users` | Gobierno | I | P | Alto |
| Auditoría SaaS | `/admin/audit` | `admin.view` | Gobierno | I | P | Alto |
| Configuración SaaS | `/admin/settings` | `admin.company` | Gobierno | P | N | Bajo |

Rutas API UI: `/api/auth/[action]` y `/api/session`; deben validarse mediante pruebas de sesión, no como pantallas.
