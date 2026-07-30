# Auditoría de autorización del frontend

Fecha: 2026-07-23

## Fuente efectiva encontrada

- Sesión preliminar: cookie `talentos_frontend_session`, verificada por `proxy.ts`.
- Contexto efectivo: `GET /auth/me` (equivalente actual de `/me/context`).
- Campos consumidos: usuario, tenant activo, sucursal activa, sucursales autorizadas, roles, permisos, módulos, feature flags, suscripción, tenants permitidos e impersonación.
- Autoridad final: guards y permisos del backend. Los controles del frontend solo reducen exposición y errores de experiencia.

## Matriz de pantallas

| Ruta o pantalla | Módulo | Permiso esperado | Roles esperados | Validación actual | Problema encontrado | Corrección | Severidad |
|---|---|---|---|---|---|---|---|
| `/dashboard` | dashboard | `dashboard.view` | Todos autenticados | Proxy + RoutePolicy | Sin diferencia crítica | Se conserva | Baja |
| `/admin/tenants` | admin | `tenants.view` | SUPER_ADMIN | Usaba `admin.view` | Permiso demasiado amplio | Migrado a `tenants.view`; acciones con `tenants.create/update` | Crítica |
| `/admin/branches` | admin | `branches.view` | TENANT_ADMIN | Usaba `admin.company` | No distinguía lectura/edición | Ruta migrada a `branches.view` | Alta |
| `/admin/users` | admin | `users.view` | TENANT_ADMIN | Audiencia compartida y `admin.users` | Podía aparecer fuera de contexto tenant | Audiencia tenant + `users.view` | Crítica |
| `/admin/roles` | admin | `roles.view` | TENANT_ADMIN | `admin.roles` | Granularidad insuficiente | Ruta migrada a `roles.view` | Alta |
| `/admin/modules` | admin | `admin.company` | SUPER_ADMIN | RoutePolicy | Contrato backend aún usa permisos de módulos | Pendiente de permiso canónico del backend | Media |
| `/admin/subscription` | admin | `subscriptions.view` | SUPER_ADMIN | `admin.subscription` | Alias amplio | Compatibilidad conservada; migración pendiente | Media |
| `/admin/integrations` | admin | `platform.integrations.manage` | SUPER_ADMIN | Guard estricto | Correcto | Se conserva | Baja |
| `/ats/vacancies` | ats | `jobs.view` | TENANT_ADMIN, HR, RECRUITER | Usaba `ats.view` | Crear/publicar compartían `ats.manage` | Ruta `jobs.view`; creación `jobs.create` | Crítica |
| `/ats/pipeline` | ats | `applications.view` | TENANT_ADMIN, HR, RECRUITER | Usaba `ats.view/manage` | Cambio de etapa demasiado amplio | Ruta `applications.view`; acción `applications.change_stage` | Crítica |
| `/ats/candidates` | ats | `candidates.view` | TENANT_ADMIN, HR, RECRUITER | Usaba `ats.view` | No diferenciaba candidatos | Migrado a `candidates.view` | Alta |
| `/ats/candidates/:id` | ats | `candidates.view` | TENANT_ADMIN, HR, RECRUITER | Heredaba prefijo | Edición dependía de `ats.manage` | Edición usa `applications.change_stage` | Crítica |
| `/ats/interviews` | ats | `interviews.view` | HR, RECRUITER, INTERVIEWER | Usaba `ats.view` | No expresaba acceso asignado | Ruta migrada; filtrado “asignado” depende del backend | Alta |
| `/onboarding/*` | onboarding | `onboarding.view` | TENANT_ADMIN, HR, SUPERVISOR, EMPLOYEE | RoutePolicy | Falta granularidad documental | Contrato backend pendiente | Alta |
| `/training` | training | `courses.view` | Según asignación | Usa permiso agregado | Acciones aún dependen de APIs disponibles | Alias canónicos añadidos | Alta |
| `/training/evaluations` | training | `assessments.view` | Según asignación | Usa permiso agregado | Falta separación intento/gestión | Alias canónicos añadidos; UI pendiente | Alta |
| `/training/certificates` | training | `certificates.view` | INSTRUCTOR, EMPLOYEE | Usa permiso agregado | Falta emisión separada | Alias canónicos añadidos | Media |
| `/inventory/*` | inventory | `inventory.view` / `assets.*` | TENANT_ADMIN, SUPERVISOR, INVENTORY_MANAGER, EMPLOYEE | RoutePolicy + módulo | Backend no expone todavía todo el catálogo granular | Riesgo documentado | Alta |
| `/productivity` | productivity | `productivity.view_*` | SUPERVISOR, EMPLOYEE | Usa `productivity.view` | No diferencia propio/equipo/empresa | Catálogo añadido; contrato pendiente | Alta |
| `/reports` | reports | `reports.view` | Según permisos | RoutePolicy | Exportación no declara `reports.export` | Pendiente al habilitar exportación real | Media |
| `/profile` | profile | `profile.view` | Todos autenticados | RoutePolicy | Correcto | Se conserva | Baja |
| `/jobs`, `/apply` | público | Sin permiso de tenant | Público/candidato | Fuera del layout privado | Correcto | Se conserva | Baja |
| `/application-status` | candidato | Aplicaciones propias | CANDIDATE | Sesión temporal pública | Portal autenticado incompleto | Riesgo funcional pendiente | Alta |

## Matriz de roles encontrada

| Backend | Frontend | Contexto permitido |
|---|---|---|
| SUPERADMIN | `admin_saas` | Global; operativo solo durante impersonación explícita |
| PLATFORM_ADMIN | `admin_plataforma` | Tenants de `allowedTenantIds` |
| TENANT_ADMIN | `admin_empresa` | Tenant propio y sucursales autorizadas |
| HR_MANAGER | `rrhh` | Tenant/sucursales asignadas |
| RECRUITER | `reclutador` | Reclutamiento autorizado |
| INTERVIEWER | `entrevistador` | Entrevistas y candidatos asignados; backend debe filtrar recursos |
| INSTRUCTOR | `instructor` | Formación autorizada |
| SUPERVISOR | `supervisor` | Equipo/sucursales asignadas |
| INVENTORY_MANAGER | `encargado_inventario` | Inventario de sucursales asignadas |
| BRANCH_USER | `empleado` | Datos propios |
| CANDIDATE | `candidato` | Aplicaciones propias |

## Correcciones aplicadas

- `can`, `canAny`, `canAll`, `hasModule`, `hasFeature` y `canAccessBranch` disponibles desde un único contexto.
- `PermissionGate` reutilizable para acciones.
- Cada `NavItem` declara `requiredPermissions`, módulo, feature flag, audiencia y requisito de sucursal.
- Menú desktop y móvil consumen la misma lista `allowedNav`.
- SUPER_ADMIN global ya no recibe navegación operativa tenant sin impersonación.
- Alias entre permisos reales del backend (`vacancies.read`, `applications.update`, etc.) y el catálogo canónico de interfaz.
- Acciones críticas migradas a permisos granulares.

## Riesgos pendientes

- El backend no implementa aún todos los permisos del catálogo solicitado (activos, documentos, evaluaciones, productividad por alcance).
- INTERVIEWER, EMPLOYEE y CANDIDATE requieren filtrado de recursos en backend; ocultar UI no sustituye ese control.
- La cookie del proxy confirma sesión, pero la autorización granular continúa en cliente hasta que exista una sesión de servidor que exponga el contexto firmado.
- Varias rutas marcadas como no disponibles siguen fuera de navegación hasta que sus endpoints sean operativos.
