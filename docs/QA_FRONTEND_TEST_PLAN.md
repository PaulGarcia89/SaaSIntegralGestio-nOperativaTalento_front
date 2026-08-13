# Plan Maestro de Pruebas Frontend

## Estrategia

| Capa | Objetivo | Ejecución |
| --- | --- | --- |
| Smoke | Rutas públicas, login, shell y 404 | Cada PR |
| RBAC | Menú, ruta directa, 403 UI y API por rol/tenant/sucursal | Cada PR con backend E2E |
| Critical path | Vacante->postulación->entrevista->oferta->contratación; onboarding; curso; inventario | Diario/antes de deploy |
| Responsive/a11y | Viewports, Axe, teclado y foco | Cada PR |
| Resiliencia | 3G, Slow 4G, offline, timeout, 429, 500 y reintentos | Diario |
| Carga | Listas paginadas, filtros y exportación con volúmenes | Semanal |

## Ruta: matriz mínima por cada pantalla

- Autorizado, no autorizado, sesión expirada y URL directa.
- Refresh, back, forward, deep link, ruta inexistente y cambio de contexto tenant/sucursal.
- Loading, empty, error, success, forbidden, offline y timeout.
- Desktop y los viewports de [reporte responsive](QA_RESPONSIVE_REPORT.md).

## Formularios

Aplicar la batería a vacante, candidatura, entrevista, oferta/contratación, tarea/documento onboarding, curso, asignación de curso, activo, usuario y automatización:

- Vacío, mínimo, completo, inválido, extremo, caracteres especiales, pegado y autocomplete.
- Enter, Escape, tab order, submit doble, cancelación, refresh y aviso de cambios no guardados.
- Error de servidor 400/403/409/429/500 y preservación de datos.

## Tablas y listados

- Paginación servidor, filtros combinados, búsqueda, limpiar filtros, vistas guardadas, selección y acción masiva.
- Exportación, estado vacío, carga, error 500 y volumen >=10.000 registros paginados.
- Validar que las tarjetas móviles exponen las acciones críticas sin scroll horizontal.

## Sesión y permisos

- Expirar token durante una mutación y validar redirección/mensaje sin pérdida del borrador.
- Logout y revocación en otra pestaña.
- Cambio de permiso/módulo/suscripción/sucursal con sesión abierta.
- Confirmar 403 de API y estado `AccessDenied` de UI con requestId.

## Métricas y performance

- Capturar `flow_duration` para vacante, entrevista, contratación y asignación de curso.
- Capturar abandono al salir con formulario sucio; `form_error` por campo y estado HTTP.
- Medir uso de filtros, exportaciones y automatizaciones.
- Establecer budgets: LCP <2.5s, INP <200ms, CLS <0.1 en rutas públicas; medir rutas internas tras autenticación.

## First-time user

| Rol | Primer objetivo | Fricción a comprobar |
| --- | --- | --- |
| SUPER_ADMIN | Crear/administrar tenant | Contexto global vs tenant y rutas exclusivas. |
| TENANT_ADMIN | Configurar empresa y usuarios | Módulos, suscripción y permisos. |
| HR | Crear vacante e iniciar onboarding | Flujo completo y responsables. |
| RECRUITER | Gestionar candidatos y entrevista | Filtros, siguiente acción y comunicación. |
| INSTRUCTOR | Crear curso/asignación | Editor, SCORM y publicación. |
| SUPERVISOR | Revisar equipo y tareas | Contexto de sucursal. |
| EMPLOYEE | Curso, activos y preboarding | Navegación reducida y autoservicio. |
| CANDIDATE | Postular, entrevista y privacidad | Idioma, borrador y recuperación. |

## Suite de regresión propuesta

1. Smoke de todas las rutas navegables permitidas por cada rol.
2. RBAC desktop y móvil con selector de drawer correcto.
3. ATS, Onboarding, Capacitación e Inventario end-to-end con datos aislados.
4. Doble submit de crear usuario, publicar vacante, contratar, asignar curso y asignar activo.
5. Axe público e interno; test visual responsive de rutas críticas.
6. Red degradada y sesión expirada antes de cada despliegue.
