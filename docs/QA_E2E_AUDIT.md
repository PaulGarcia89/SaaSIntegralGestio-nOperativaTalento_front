# Auditoría QA End-to-End SaaS

Fecha: 2026-08-13  
Rol de auditoría: Principal QA Engineer.  
Alcance: frontend, backend y base de datos de testing exclusivamente. Producción queda explícitamente excluida de toda escritura.

## Dictamen

**E2E destructivo no ejecutado de forma intencional.** No existe una configuración E2E activa en el entorno actual (`E2E_*` vacío) ni evidencia de que la `DATABASE_URL` local del backend sea una base aislada de testing. Ejecutar altas, contrataciones, cargas documentales o asignaciones en esas condiciones vulneraría el criterio de no usar producción/datos no dedicados.

La plataforma dispone de tres bases de automatización parciales:

| Suite existente | Cobertura | Seguridad de escritura | Estado |
| --- | --- | --- | --- |
| `tests/ats-staging/ats-lifecycle.spec.ts` | Vacante efímera -> postulación -> login UI -> pipeline -> auditoría | Requiere `E2E_ATS_ENVIRONMENT=staging` y `E2E_ATS_ALLOW_WRITES=true`; archiva la vacante. | No ejecutada: variables ausentes. |
| `tests/integration/onboarding-lifecycle.spec.ts` | Aprobado -> contratación -> tarea -> documento -> revisión | Requiere candidato aprobado exclusivo. | No ejecutada: variables ausentes. |
| `tests/integration/training-inventory-certification.spec.ts` | Catálogo, asignaciones, certificados, inventario y rechazo sin token | Requiere cuenta dedicada; actualmente mayormente consulta. | No ejecutada: variables ausentes. |

## Precondiciones obligatorias

1. Crear un backend `staging` aislado, con URL distinta de Railway producción y con datos sintéticos.
2. Crear `DATABASE_URL` y `SHADOW_DATABASE_URL` exclusivamente de pruebas; prohibir hostnames de producción mediante un guard de arranque CI.
3. Cargar `.env.e2e` fuera del repositorio con cuentas dedicadas por rol y tenant.
4. Crear dos tenants, dos sucursales por tenant, candidatos y vacantes efímeras etiquetadas `E2E`.
5. Habilitar limpieza idempotente por prefijo/tenant tras cada run, conservando screenshots, video, traces y reporte JSON como artefactos CI.
6. Instalar Chromium, WebKit y Chrome Android/Android emulado de Playwright antes de certificar móvil.

## Modelo de validación de persistencia

Cada paso no se aprueba por toast ni por DOM solamente. Debe conservar tres evidencias con el mismo identificador correlacionable:

| Capa | Evidencia requerida |
| --- | --- |
| Frontend | Estado visible tras refresh/deep link; notificación y acción disponible coherentes. |
| API | Respuesta 2xx/4xx esperada, `requestId`, id creado y lectura posterior GET. |
| Base de datos | Consulta read-only a base E2E o endpoint administrativo de auditoría que confirme tenant, sucursal, actor, estado y relación. |

## Multi-tab, concurrencia y recovery

| Escenario | Prueba requerida | Criterio de aprobación |
| --- | --- | --- |
| Dos pestañas candidato | P1 cambia etapa; P2 refresca o ejecuta acción antigua. | P2 recibe estado actual/conflicto controlado; no sobrescribe sin auditoría. |
| Dos reclutadores | Cambiar la misma etapa simultáneamente. | Una operación canónica, otra 409/estado actualizado; timeline inmutable. |
| Doble submit | Doble clic en crear usuario, publicar vacante, contratar, asignar curso/activo. | Un registro/operación, idempotencia o bloqueo explícito. |
| Pérdida de red | Interrumpir POST y recargar. | Borrador o estado recuperable; sin duplicado silencioso. |
| Token expirado | Expirar antes de mutación y después de cargar formulario. | 401 manejado, redirección/control de sesión y datos no enviados recuperables. |
| Cambio de rol | Quitar permiso en P2 mientras P1 está abierta. | Próxima petición 403, botones/ruta se actualizan o muestran acceso denegado. |

## Riesgos E2E abiertos

- Los tests API existentes validan API y en algunos casos frontend, pero no validan directamente SQL/Prisma de la base E2E.
- No hay orquestación declarada que levante backend + PostgreSQL + Redis de testing para los flujos completos.
- No hay fixture completo y autónomo para registrar empresa hasta certificado/activo/reporte en una misma corrida.
- No hay prueba de sincronización en múltiples pestañas, 409, offline, timeout o token revocado.
- Video/screenshot sólo están configurados para ATS staging y se retienen únicamente en fallo; falta extenderlo a todos los critical paths.

## Gate de certificación

No promover cambios de flujo crítico hasta que todas las rutas de [critical paths](QA_CRITICAL_PATHS.md) aprueben en staging aislado, Chromium y WebKit, con evidencias frontend/API/DB y limpieza confirmada.
