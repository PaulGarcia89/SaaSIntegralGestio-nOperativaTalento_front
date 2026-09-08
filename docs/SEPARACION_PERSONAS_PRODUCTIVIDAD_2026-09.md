# Separación de Personas y Productividad

## 1. Estructura anterior

Una sola sección de menú, «Personas y productividad», con icono de personas,
que contenía:

| Ruta | Módulo (frontend) | Permiso (frontend) | Lo que exige el backend |
|---|---|---|---|
| `/employees` | `productivity` | `productivity.view` | `employees.read` — **sin módulo** |
| `/productivity` | `productivity` | `productivity.view` | `productivity.view` + módulo `AI_PRODUCTIVITY` |
| `/productivity/cameras` | `productivity` | `productivity.manage` | `productivity.manage` + módulo `AI_PRODUCTIVITY` |

Dos desajustes entre lo que enseñaba el menú y lo que hace el servidor:

1. **El directorio de empleados dependía del módulo de Productividad.** Una
   empresa sin `AI_PRODUCTIVITY` contratado perdía `/employees`, que el
   backend le habría servido: `EmployeesController` lleva `PermissionGuard`
   y ningún `@RequireModule`.
2. **`productivity.view` se concedía a todo el mundo con solo tener el
   módulo.** El backend exige el código `productivity.view` en el rol, que en
   los roles sembrados solo tiene el administrador de la empresa. Un
   supervisor veía el menú y recibía 403 en cada pantalla.

## 2. Clasificación de funciones

| Función | Módulo | Fuente |
|---|---|---|
| Directorio, expediente, alta, carga masiva, edición, estado laboral | **Personas** | `/employees/*` |
| Documentos del empleado, cumplimiento de nómina | **Personas** | `/employees/:id/documents`, `/payroll-compliance` |
| Resumen operativo, indicadores, tendencias | **Productividad** | `/productivity/overview`, `/insights` |
| Cámaras y zonas | **Productividad** | `/productivity/cameras`, `/zones` |
| Alertas y reglas de alerta | **Productividad** | `/productivity/alerts`, `/alert-rules` |
| Eventos, incluida la simulación | **Productividad** | `/productivity/events` |
| Incorporaciones en curso (solo lectura en el panel de Personas) | **Compartida** (Incorporación) | `/onboarding/analytics` |
| Empresa, sucursal | **Compartida** (armazón) | contexto activo |

Productividad **no** consulta ni administra empleados: no hay enlace de
`/productivity` a expedientes ni al revés. La única referencia cruzada es
el contexto activo (empresa y sucursal), que es del armazón.

## 3. Estructura final

### Navegación

```
PERSONAS            (icono: personas)
  Resumen de personas       /people
  Empleados                 /employees

PRODUCTIVIDAD       (icono: cámara)
  Resumen de productividad  /productivity
  Cámaras y zonas           /productivity/cameras
```

Cada sección se expande por separado, tiene su ruta principal, y el elemento
activo se marca dentro de su sección.

### Rutas

| Ruta | Estado |
|---|---|
| `/people` | **Nueva.** Panel del módulo de Personas. |
| `/employees`, `/employees/new`, `/employees/import`, `/employees/:id`, `/employees/:id/edit` | Sin cambios. Siguen siendo canónicas: 14 enlaces internos, el proxy y las pruebas apuntan a ellas. |
| `/people/employees`, `/people/employees/:id` | Ya existían como redirecciones a `/employees`. Se conservan. |
| `/productivity`, `/productivity/cameras` | Sin cambios. |

No se ha cambiado ninguna ruta existente. El encargo proponía mover el
directorio a `/people/employees`; se descartó porque el sentido actual de la
redirección es el contrario y hay consumidores internos. Personas gana su
panel en `/people` sin romper nada.

### Permisos

| Permiso UI | Antes | Ahora |
|---|---|---|
| `employees.read` | existía; no gobernaba el menú | gobierna `/people` y `/employees` |
| `productivity.view` | módulo contratado ⇒ concedido | módulo contratado **y** código `productivity.view` en el rol |
| `productivity.manage` | código en el rol | módulo contratado **y** código |

Ningún permiso del backend cambia. El frontend deja de conceder uno que el
servidor no concedía.

### Suscripciones

`people` es una clave de módulo **solo del frontend**, marcada como
capacidad base (`requiresCommercialModule: false`), igual que `admin`.
Refleja la realidad del backend: no existe `ModuleCode.PEOPLE`.

## 4. Lo que exigiría backend, presentado y NO ejecutado

El encargo pide poder habilitar Personas por suscripción (`people_enabled`).
Hoy Personas es una capacidad base que toda empresa tiene si sus roles
llevan `employees.*`. Hacerla contratable exige:

1. Añadir `PEOPLE` al enum `ModuleCode` de Prisma → **migración**.
2. `@RequireModule(ModuleCode.PEOPLE)` en `EmployeesController` → toda
   empresa existente **perdería el directorio** hasta que se le asigne el
   módulo. Hace falta un script de datos que lo asigne a todas las empresas
   activas en la misma migración.
3. Añadir el módulo al catálogo de planes y a la pantalla de módulos.
4. Decidir qué pasa con Incorporación y Contratación, que crean empleados:
   ¿exigen también `PEOPLE`?

Es un cambio de regla de negocio (qué se paga), no de interfaz. Queda
presentado para decisión.

## 5. Pruebas

`src/lib/navigation-people-productivity.test.ts` (16 pruebas nuevas):
solo Personas, solo Productividad, ambos, ninguno; empresa sin el módulo de
Productividad; acceso directo por URL a expedientes y cámaras; secciones y
rutas principales; y el mapeo real de permisos (`backendCodesToUiPermissions`).

Total: 602 pruebas en verde, tsc y ESLint limpios, build de Next completo.
