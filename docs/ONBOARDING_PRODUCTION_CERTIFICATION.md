# Certificacion de onboarding en produccion

El workflow `Onboarding production certification` valida el ciclo completo:

1. candidato aprobado a empleado;
2. flujo y tarea de incorporacion;
3. carga y revision documental;
4. evidencia del actor en el timeline;
5. aislamiento por permiso, sucursal y tenant.

No debe usar empresas ni cuentas de clientes. Configure el entorno protegido de GitHub
`onboarding-production` con aprobacion requerida y un tenant exclusivo de certificacion.
La prueba crea registros operativos auditables.

## Variables del entorno

| Variable | Uso |
| --- | --- |
| `ONBOARDING_PRODUCTION_BACKEND_URL` | URL de Railway, incluyendo `/api`. |
| `ONBOARDING_PRODUCTION_APPROVED_APPLICATION_ID` | Postulacion aprobada dedicada a la certificacion. |
| `ONBOARDING_PRODUCTION_BRANCH_ID` | Sucursal de esa postulacion. |

## Secretos del entorno

| Secreto | Uso |
| --- | --- |
| `ONBOARDING_PRODUCTION_MANAGER_EMAIL` y `ONBOARDING_PRODUCTION_MANAGER_PASSWORD` | Gestor con permisos de onboarding. |
| `ONBOARDING_PRODUCTION_VIEWER_EMAIL` y `ONBOARDING_PRODUCTION_VIEWER_PASSWORD` | Usuario de solo lectura en la misma sucursal. |
| `ONBOARDING_PRODUCTION_OTHER_BRANCH_EMAIL` y `ONBOARDING_PRODUCTION_OTHER_BRANCH_PASSWORD` | Usuario de otra sucursal del mismo tenant. |
| `ONBOARDING_PRODUCTION_OTHER_TENANT_EMAIL` y `ONBOARDING_PRODUCTION_OTHER_TENANT_PASSWORD` | Usuario de un tenant diferente. |

## Certificacion de integraciones

La consola `/admin/queues`, disponible para `admin_saas`, expone la certificacion activa.
La ejecucion activa hace una escritura, lectura, comprobacion SHA-256 y eliminacion de
un objeto efimero en cada bucket; tambien valida la muestra limpia y EICAR en ClamAV.
No almacena secretos ni tokens en los reportes.

La configuracion de Railway debe usar `DOCUMENT_STORAGE_DRIVER=s3`, un bucket privado,
TLS, credenciales limitadas y cifrado SSE. El boton de certificacion es el unico que
ejecuta las sondas activas; la vista inicial solo inspecciona configuracion.
