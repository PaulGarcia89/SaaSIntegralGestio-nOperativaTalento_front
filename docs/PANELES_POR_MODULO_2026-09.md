# Paneles por módulo

> «La primera página de cada módulo debe ser su propio dashboard.»

Este documento registra la aplicación de esa regla: qué se auditó, qué se ha
hecho, con qué datos, y qué queda.

---

## 1. Auditoría de partida

Módulos con pantallas propias y su primera página **antes** de este trabajo:

| Módulo | Primera página | Qué era | ¿Panel? |
|---|---|---|---|
| `ats` | `/ats` | Bandeja «Hoy» | No |
| `ats` (contratación) | `/hiring` | Lista con seis cifras encima | No |
| `productivity` (personas) | `/employees` | Tabla del directorio | No |
| `onboarding` | `/onboarding/documents` | Lista de incorporaciones | Parcial |
| `training` | `/training` | Catálogo de cursos | No |
| `asset_inventory` | `/inventory/assets` | Lista de activos | No |
| `restaurant_inventory` | `/inventory/restaurant` | Lista | No (existe `/inventory/restaurant/dashboard`, pero es la **segunda** entrada) |

Hallazgos transversales:

- **Peticiones duplicadas.** `/hiring` pedía el listado dos veces: una para las
  cifras de cabecera y otra para la lista. Las dos podían discrepar.
- **Dos sistemas de diseño conviviendo.** `@/components/design-system`
  (`Card level={2}`, `text-text-primary`, `border-border-default`,
  `rounded-2xl`) frente a `@/components/system`. Las pantallas antiguas usaban
  el primero.
- **Cifras sin distinguir «cargando», «sin dato» y «cero».** Un `0` pintado
  mientras carga se lee como «todo en orden».
- **Gráficos ausentes.** El motor SVG propio (`@/components/chart`) solo se
  usaba en `/dashboard`.

---

## 2. Qué se ha hecho

### 2.1 Reclutamiento — `/ats`

Orden de lectura: encabezado → contexto activo → acción recomendada →
tarjetas de estado → fases → embudo → pendientes.

- Cuatro tarjetas: vacantes activas, postulaciones nuevas, entrevistas por
  coordinar, decisiones pendientes. Cada una abre su lista ya filtrada.
- **Embudo por etapa** desde `/reports/ats-analytics`.
- **Tiempo medio por etapa**, solo para etapas con `sampleSize >= 5`.

> **Por qué el embudo no sale de los conteos de la propia pantalla.** Esos
> conteos son ocupación de hoy. Quien fue rechazado tras la entrevista ya no
> aparece en «Conociendo», así que la caída entre fases mediría bajas, no
> conversión. El backend sí sigue cada postulación por las etapas que
> atravesó; el embudo viene de ahí.

Lo que **no** se muestra: variaciones ni tendencias en las tarjetas. El
endpoint entrega el estado de ahora, no una serie temporal.

### 2.2 Contratación — `/hiring`

- Cuatro tarjetas: te toca a ti, esperando a la persona, listas para
  confirmar, fuera de plazo.
- Acción recomendada: el caso más urgente de tu cola.
- Reparto por las cinco etapas del proceso.
- Lista operativa con pestañas, buscador y filtros, en `EntityCard`.
- **Una sola petición**: las cifras usan la clave `["hiring-contracts", ""]` y
  la lista `["hiring-contracts", search]`. Con el buscador vacío coinciden.
- Migrada del sistema de diseño antiguo al actual.

### 2.3 Personas — `/employees`

El directorio se conserva íntegro (acciones masivas, filtros guardados,
borrado reversible, exportación, panel de detalle). Lo que cambia es lo que se
ve **antes**: estado del personal por estado y reparto por sucursal. Las
tarjetas no navegan: dejan aplicado el filtro del directorio que está debajo.

Cada cifra es una consulta al listado con `pageSize: 1` leyendo `meta.total`:
cuenta el servidor y el navegador no recibe expedientes que no va a mostrar.

### 2.4 Aprendizaje — `/training`

**Un panel por papel, nunca los dos a la vez.** Quien administra ve el estado
del programa (vencidas, sin comenzar, en progreso, tasa de finalización);
quien aprende ve su formación (qué continuar, qué debe, qué vence, qué
completó). Quien es las dos cosas usa la pestaña «Mis cursos» como
conmutador explícito.

Se retiró el bloque de métricas duplicado de «Prioridades», que traía
«Asignaciones vencidas» con su propia consulta además de la del panel.

La tasa de finalización solo aparece si hay denominador: un «0 %» sobre cero
asignaciones no informa de nada, y sin base la tarjeta lo dice en palabras.

### 2.5 Inventario de activos — `/inventory/assets`

Las cifras se contaban en el navegador sobre la página de activos que había
llegado, así que «Activos visibles» era literalmente eso. Ahora salen de
`/inventory/analytics`, que las cuenta en el servidor sobre todo el
inventario de la sucursal y trae además el stock bajo mínimo y las órdenes
de mantenimiento abiertas, que el listado de activos no conoce.

Cuatro tarjetas y una fila de acciones frecuentes: entregar, recibir
devolución, mantenimiento y escanear, con icono **y** texto.

### 2.6 Inventario de restaurante — `/inventory/restaurant`

La primera pantalla apilaba tres cabeceras, dos acciones recomendadas
distintas, ocho cifras, cuatro tarjetas de acción, dos listas y dos gráficos
dibujados con `div`. Y dos peticiones que contaban cosas parecidas.

Queda una sola lectura. **Producto, cantidad, unidad y ubicación van
siempre juntos**: la unidad sale de `/restaurant-inventory/stock`, la única
fuente que la entrega, y es además la misma clave de consulta que usa la
pantalla «Existencias», así que al navegar allí no se vuelve a pedir.

El valor del inventario solo aparece con
`restaurant_inventory.commercial.view`. Sin ese permiso, esa cuarta tarjeta
muestra la diferencia de conteo, que no es dinero.

El análisis de decisiones no se pierde: ya vivía también en «Análisis», que
es donde corresponde a un informe de tercer nivel.

### 2.7 Productividad — `/productivity`

Al abrir la pantalla, el módulo empezaba a generar eventos inventados y a
guardarlos en la base de datos cada 3,2 segundos. Nadie había pedido nada:
bastaba con entrar. Ahora la simulación **arranca detenida**, vive en su
propia sección al final, y el aviso dice lo que va a pasar antes de que
nadie pulse.

El panel usa datos reales de `/productivity/overview`, `/alerts` e
`/insights`. La **confianza** de cada zona va escrita al lado de su medida:
sin ella, la medición de una cámara mal calibrada se lee igual que una
fiable.

---

## 2.bis Referencias comerciales estudiadas

Documentación oficial consultada. Se distingue lo verificado de lo propuesto.

| Patrón | Producto | Fuente | Aplicado en |
|---|---|---|---|
| La tarjeta de curso es la unidad completa: progreso, plazo, entrada y salida | TalentLMS | help.talentlms.com | `TrainingAssignmentCard` |
| La obligatoriedad se imprime en la tarjeta, no en la configuración | Docebo | help.docebo.com | `TrainingAssignmentCard` |
| El objeto se reconoce por su imagen | Sortly | help.sortly.com | `EntityCard.coverSrc` |
| Escala ordinal corta con color, sin promedios numéricos | Greenhouse | support.greenhouse.io | Pendiente (evaluaciones) |
| Persona única con estados encadenados | Workday | doc.workday.com | Pendiente |
| Etapa tipada, no solo nombrada | Workable | help.workable.com | Pendiente |
| Cada paso físico es un documento validable encadenado | Odoo | odoo.com/documentation | Pendiente |
| Transferencia con estado intermedio «En tránsito» | Zoho Inventory | zoho.com/inventory/help | Pendiente |

**No verificado.** `help.csod.com` (Cornerstone) devuelve `ROBOTS_DISALLOWED`
en toda su documentación de soporte; lo único accesible es material de
marketing, que no describe la interfaz. Las páginas de la app Barcode de
Odoo devolvieron solo el menú de navegación, sin cuerpo, en cinco versiones.

---

## 2.ter Una página «Dashboard» en cada módulo (2026-09-08)

Hasta aquí el panel de cada módulo vivía **dentro** de su primera pantalla
operativa (encima de la lista, encima de las pestañas). Ahora cada módulo tiene
una ruta propia `…/dashboard`, es el **primer ítem** de su sección en el menú y
se llama «Dashboard» en todos los módulos por igual.

| Módulo | Dashboard | Ruta corta anterior | Qué queda en la operación |
|---|---|---|---|
| Reclutamiento | `/ats/dashboard` | `/ats` → redirige | Vacantes, pipeline, candidatos, entrevistas… sin cambios |
| Contratación | sección «Contratación» dentro de `/ats/dashboard` (un módulo, un dashboard) | `/hiring/dashboard` → redirige a `/ats/dashboard#contrataciones` | `/hiring` conserva la lista con vistas, filtros y buscador (ya sin el panel repetido) |
| Personas | `/people/dashboard` | `/people` → redirige | `/employees` directorio |
| Incorporación | `/onboarding/dashboard` (**nuevo**) | `/onboarding` → redirige aquí (antes iba a Incorporaciones) | Incorporaciones, Documentos y firmas, analítica, cumplimiento |
| Aprendizaje | `/training/dashboard` | — | `/training` conserva las pestañas (prioridades, mis cursos, asignaciones, lanzamientos, supervisión) sin el panel encima |
| Productividad | `/productivity/dashboard` | `/productivity` → redirige | Cámaras |
| Inventario de activos | `/inventory/assets/dashboard` (**nuevo componente**) | — | `/inventory/assets` conserva la lista, fichas y diálogos; lee `?status=` y `?search=` de la URL para que las tarjetas del dashboard abran lo que prometen |
| Inventario de restaurante | `/inventory/restaurant/dashboard` (ya existía, ahora primero y visible) | `/inventory/restaurant` → redirige | Todo lo demás igual |
| Empresas y sucursales | `/admin/dashboard` (**nuevo**) | — | `/admin` sigue siendo el centro administrativo (índice de destinos) |

Paneles nuevos y sus datos reales:

- **Incorporación** (`components/onboarding/onboarding-module-dashboard.tsx`):
  `GET /onboarding/analytics` (en riesgo, cumplimiento documental) y
  `GET /onboarding/flows?pageSize=50` (en curso, tareas vencidas, alertas,
  línea de tiempo). Si hay más de 50, se dice que las cifras son parciales.
- **Inventario de activos** (`components/inventory/assets-module-dashboard.tsx`):
  `GET /inventory/analytics` (cifras), `GET /inventory/assets` ordenado por
  `updatedAt` («cambió hace poco»), `GET /inventory/maintenance` (atrasadas,
  solo con `asset_inventory.manage`).
- **Empresas y sucursales** (`components/admin/admin-module-dashboard.tsx`):
  `GET /branches`, `GET /users` del tenant, `GET /subscriptions` y
  `GET /audit/logs?pageSize=6`, cada uno solo si el rol tiene el permiso
  correspondiente; sin permiso la tarjeta lo dice en vez de quedar vacía.

Regla añadida (2026-09-08): **un solo dashboard por módulo y siempre el primer
ítem del menú**. `navigation-dashboards.test.ts` comprueba, sobre el menú real,
que cada sección empieza por «Dashboard» y que no hay dos en la misma sección.

Invariantes conservadas:

- Ninguna ruta se elimina: las rutas cortas siguen declaradas en `navigation.ts`
  (fuera del menú) y redirigen con `redirect()` del servidor.
- Cada dashboard exige el mismo módulo y permiso que el resto de su sección
  (`navigation-dashboards.test.ts` lo comprueba sobre el menú real).
- El pipeline `/ats/pipeline` y `/inventory/restaurant/dashboard` conservan sus
  políticas; `/onboarding/dashboard` hereda `onboarding.view`.
- Sin cambios de backend, modelos, migraciones ni permisos.

---

## 2.quater Flujo de contratación: revisión de usabilidad (2026-09-08)

Objetivo: que `/hiring/[id]` sea intuitivo, gráfico y con solo la información
necesaria en cada paso. Qué se cambió y por qué:

| Antes | Ahora |
|---|---|
| La etapa se decía tres veces: «Etapa 2 de 5 · 40 % completado», raíl de cinco tarjetas con «Pendiente / Etapa actual», y «Paso 2 de 5» en el panel | Un solo **paso a paso gráfico**: cinco círculos con icono unidos por una línea que se rellena; completada = verde con marca, actual = relleno oscuro y título en negrita, pendiente = hueco. Las etapas ya alcanzadas se pueden pulsar para volver a mirarlas |
| Cabecera con nombre, puesto, empresa, sucursal, correo, estado técnico, quién actúa, inicio, plazo y sueldo | Cabecera con **tres respuestas**: quién (nombre, puesto · sucursal), quién actúa (una sola pastilla: «Te toca a ti» / «Esperando a Ana» / «Completada») y, solo si existen, sueldo e inicio como dos datos con icono. El resto sigue en «Más detalles», plegado |
| Botón principal al final del panel, tras tablas de datos | **Acción principal arriba** del panel, destacada, con «qué pasa después» al lado; el detalle va debajo |
| Preparación: tabla de cinco filas que repetía la cabecera | Lista de comprobación gráfica (marca verde / aviso) con lo que hay que confirmar; solo el responsable puede fallar |
| Oferta: tabla de cinco filas con el estado dentro | Tres datos (puesto, sueldo, inicio) + estado como etiqueta; vencimiento en una línea |
| Documentos: lista con tipo·estado en texto y aviso largo de firmas | Barra «2 de 3 documentos obligatorios aprobados», icono de estado por documento (aprobado / rechazado / por revisar / esperando), aviso de firmas plegado |
| Revisión final: tabla de seis filas | Lista de comprobación con marcas; lo que falta sale en ámbar |
| Bloqueos en cajas de tres columnas | Una línea por bloqueo (qué falta · quién lo resuelve) y «¿Por qué?» desplegable |
| Ficha de la lista con estado técnico + etapa + quién actúa + «Paso 2 de 5» dos veces | Estado = quién actúa; avance con el nombre de la etapa; plazo; siguiente paso |
| Tokens del sistema antiguo (`text-text-primary`, `rounded-2xl`, `Card level`) | Tokens del sistema actual (`ink`, `line`, `surface`, `InlineNote`) |

Sin cambios de backend ni de la máquina de estados: `resolveHiringCase`,
`stageForView` y las mutaciones son las mismas. Verificado con specimen a 390 y
1440 px: sin desbordamiento, todos los controles ≥ 44 px.

## 2.quinquies Flujo de aprendizaje: revisión de usabilidad (2026-09-08)

Objetivo: que aprender un curso sea un camino guiado, gráfico y con solo lo
necesario en pantalla.

| Antes | Ahora |
|---|---|
| `/training/learn/[id]` pintaba todos los módulos con todas las lecciones desplegadas (video y bloques de cada una); había que recorrer la página entera para saber por dónde ibas | **Reproductor guiado**: una sola lección en pantalla —la que toca— y un índice al lado (escritorio) o plegado arriba (móvil) con el estado de cada lección: hecha (verde con marca), actual (play), pendiente (hueca) |
| Barra de avance con porcentaje | Barra **segmentada**: un tramo por lección; se ve cuántas faltan sin leer el número |
| Lecciones de lectura sin forma de darlas por terminadas (solo el video avanzaba) | **«Marcar como completada»** para lecturas, archivos y tareas (`PATCH /training/progress/lessons/:id`); el video sigue completándose al verlo |
| Bloques `RICH_TEXT` pintados como `{"html":"<p>…"}` | Texto enriquecido saneado por lista blanca (`training-rich-text.ts`, probado), enlaces y archivos con su botón |
| Lecciones de lectura mostraban «Cargando video local…» | Solo las lecciones de video buscan video |
| Evaluación y certificado en otras pantallas, sin relación visible | Aparecen como **últimos pasos del mismo índice** («Para terminar»); la evaluación se desbloquea al completar el contenido y el enlace lleva a `/training/evaluations?courseId=` |
| `/training/evaluations` ignoraba `courseId` | La evaluación del curso del que vienes va primero y resaltada |
| «Mis cursos» repetía las cuatro cifras del dashboard | Solo la acción recomendada y las fichas |

Sin cambios de backend. Verificado con specimen a 390 y 1440 px: sin
desbordamiento, todos los controles ≥ 44 px.

## 2.sexies Revisión de usabilidad del resto de módulos (2026-09-08)

Misma vara que en Contratación y Aprendizaje: intuitivo, gráfico, solo lo
necesario. Qué se cambió en cada flujo:

| Módulo · pantalla | Antes | Ahora |
|---|---|---|
| Incorporación · `/onboarding/documents` | El expediente repetía nombre y estado tres veces (cabecera, `FlowSummary`, alertas), cuatro cifras, y cada tarea enseñaba nueve botones | Una cabecera; **barra segmentada por tarea** (verde hecha, ámbar bloqueada, rojo vencida, gris pendiente) con leyenda; «Lo siguiente» y bloqueos una sola vez; cada tarea con **una acción principal** (Completar / Desbloquear), Evidencia y el resto en «Más»; sin los tres enlaces del encabezado que ya están en el dashboard |
| Reclutamiento · perfil de candidato | Fases como pastillas de texto | **Paso a paso con iconos** (`RecruitmentPhaseRail`), el mismo dibujo que en Contratación |
| Personas · expediente de empleado | Nombre y puesto repetidos en título, tarjeta y «Información básica»; ID interno visible | Una sola cabecera (quién, estado, sucursales, acciones) y una ficha sin el UUID |
| Inventario de restaurante · entrada de mercancía | Paso a paso propio con tokens antiguos | **`Stepper` del sistema**, compartido: lo usan también `Wizard` (vacante nueva, importación de empleados, importación de ventas) |
| Productividad · cámaras y zonas | Dos formularios primero, dos avisos explicativos, las cámaras al final | Primero lo que existe; el alta plegada en «Agregar cámara o zona» (abierta solo si no hay ninguna); sin avisos |
| Administración · usuarios | Cuatro cifras que ya da `/admin/dashboard` | Solo la lista y el alta |


Segunda pasada (misma fecha):

| Módulo · pantalla | Antes | Ahora |
|---|---|---|
| Personas · alta de empleado | Bloque fijo de cuatro «etapas» (siempre con la 2 resaltada), aviso «solo lo necesario», etiqueta «1 a 1» y una columna lateral con cifras y guía de la carga masiva | Solo el paso a paso real del formulario (con el `Stepper` del sistema) y un enlace de una línea a la carga masiva |
| Operaciones (activos, restaurante: consumo, merma, producción, conteos, compras) | `OperationStepper` como pastillas de texto con número | Mismo paso a paso gráfico del sistema; solo se puede volver a los pasos que la operación permite |

Componente nuevo del sistema: `Stepper` (`components/system/stepper.tsx`).
Sin cambios de backend. Verificado con specimen del expediente de
incorporación a 390 y 1440 px.

Tercera pasada (misma fecha):

| Módulo · pantalla | Antes | Ahora |
|---|---|---|
| Incorporación · `/onboarding/signatures` | Tres métricas (una decía «Proveedor activo: Interno»), un aviso que explicaba qué es un checksum, tarjetas con el estado en inglés (`PARTIALLY_SIGNED`) y un badge por firmante | Dos tarjetas de estado (esperando firma / completados) que filtran la lista; filtro Pendientes · Completados · Todos; cada paquete con **barra «1 de 2 firmas»**, «Lo siguiente» (enviar / esperando a X), firmantes con icono y palabra, vencimiento en ámbar si pasó, **un botón** (Enviar o Recordar) y plantilla/proveedor/último evento en «Más». Estados traducidos (`signatures.*` es/en) |
| Reclutamiento · `/ats/interviews` | Calendarios (tres proveedores) y el centro de coordinación ocupaban la primera pantalla y media; la agenda empezaba muy abajo; cada entrevista con dos badges técnicos, seis datos en rejilla, badges de panel «Nombre · Rol · Estado» y cuatro botones | Orden: **mis invitaciones sin responder → agenda → (plegado) calendarios → (plegado) centro de coordinación**. Filtros en un desplegable con punto cuando hay alguno activo y «Quitar filtros». Tarjeta: persona candidata y vacante, fecha completa con horas, estado en palabras, panel con icono por respuesta, «Abrir videollamada» como botón principal; zona horaria, etapa, calendario, recursos e .ics en «Más». Nada se quitó |
| Aprendizaje · editor de curso | Cabecera «Borrador y publicación» + barra «Avance editorial 43 %» + frase de ánimo + barra lateral con siete tarjetas + «Paso 3 de 7» encima del contenido: la etapa se decía tres veces | Estado del curso, **`Stepper` de siete pasos con iconos** (hecho por etapa, navegación libre) y una frase solo si falta algo para publicar. La «guía rápida» de tres tarjetas de la lista de cursos se quitó |
| Personas · `/employees/import` | Zona de subida con degradado, tres iconos decorativos, tres tarjetas «Paso 1/2/3» de texto, «Archivo seleccionado» dos veces, tres métricas y dos avisos | **El paso se deduce del estado** (sin archivo → Preparar; con errores → Validar; todo bien → Confirmar) y se pinta con el `Stepper`; solo se ve lo del paso actual: subida grande con la plantilla al lado, o archivo + «filas listas» + tabla con icono por fila + Cargar |
| Administración · sucursales | Tres cifras antes de la lista | Solo la lista (las cifras están en `/admin/dashboard`) |
| Inventario de restaurante · recetas | Tarjeta con código en mayúsculas, estado en inglés, cinco cifras y cuatro botones iguales | Tarjeta con icono, tipo · código · versión, estado en palabras, tres cifras que orientan (costo por porción, precio, **food cost** en verde/ámbar) y Consultar como acción principal |

`Stepper` gana dos opciones compatibles: `completed` (hecho por paso, para
asistentes no lineales) y `freeNavigation`. Verificado con specimen a 390 y
1440 px (tarjeta de firma, tarjeta de entrevista, carga de empleados): sin
desbordes, controles ≥ 44 px.

Cuarta pasada (misma fecha):

| Módulo · pantalla | Antes | Ahora |
|---|---|---|
| Inventario de restaurante · nueva receta / nueva versión | Cinco «secciones» en una sola página larga; el costo, la política de inventario y el botón al final de todo | **Cuatro pasos con el `Stepper`** (qué es · rendimiento · componentes · revisar): cada paso valida solo lo suyo y «Continuar» dice qué falta en vez de apagarse; descripción y procedimiento plegados como opcionales; el precio solo en platos; resumen y política de faltantes en el último paso; costo del servidor tras guardar |
| Inventario de restaurante · lista de recetas | «Consultar» abría el editor prefijado como «Crear receta»; la ficha de costo (`/cost`) no tenía ningún enlace | «Consultar» abre la ficha de costo (o el editor si no hay permiso comercial); la ficha gana «Nueva versión» |
| Personas · expediente (documentos, cumplimiento) | Avisos «Acceso permitido», «Cumplimiento del expediente: N requisitos», «Dónde se completan los documentos» | Solo una alerta cuando hay alertas de cumplimiento; el resto se quitó |
| Reclutamiento · CRM de talento (duplicados) | Caja explicando cómo se calcula el puntaje | Una línea con la cifra y la regla (nadie se fusiona sin confirmación); el cálculo en «¿Cómo se calcula?» |
| Aprendizaje · nuevo curso | Aviso en caja «El resto se configura después» | Una línea de texto bajo el formulario |

Verificado con specimen del paso «Componentes» a 390 y 1440 px.

## 3. Componentes nuevos del sistema

| Componente | Para qué |
|---|---|
| `StatusTile` / `StatusTileRow` | La tarjeta con la que abre cada panel. Distingue cargando / sin dato / cifra. Admite `href` o `onAction`. |
| `ActiveContext` | Empresa y sucursal sobre las que hablan las cifras, con rótulos para lector de pantalla. |
| `EntityCard` / `EntityCardList` | Ficha de persona u objeto: hasta tres datos, progreso y próximo paso. Admite portada rectangular (`coverSrc`). |

---

## 4. Método de revisión visual

Las pantallas autenticadas **no** se pueden mirar sirviendo el HTML del build:
el cliente rehidrata, no encuentra sesión y navega a `/login`. La revisión se
hace sobre una maqueta que carga el **CSS compilado real** del build y
reproduce el marcado de cada panel, medida a 390, 768 y 1440 px.

Se comprueba: desplazamiento horizontal, tamaño de texto mínimo, objetivos
táctiles y jerarquía visual.

Correcciones que salieron de esa revisión:

1. Las tarjetas de una fila no medían lo mismo → `h-full`.
2. «3 de septiembre · Fu…» escondía «Fuera de plazo» → `line-clamp-2`.
3. La barra proporcional del raíl le robaba sitio al nombre de la fase a
   390 px → aparece a partir de `sm`.
4. **37 px de desplazamiento horizontal a 390 px.** Un elemento de rejilla
   tiene `min-width: auto` y se niega a encogerse por debajo de su contenido
   mínimo; con un título largo la ficha medía 407 px dentro de 390.
   Arreglado con `[&>li]:min-w-0` en `EntityCardList` y `StatusTileRow` —en
   la lista, no en cada llamada, para que ninguna pantalla futura pueda
   reintroducirlo.
5. El nombre del producto llevaba `truncate` con `flex-1`, así que nunca
   forzaba el salto: a 390 px se leía «Harina de …». Ahora envuelve y baja
   la cantidad.

**Nada se ha verificado en un iPhone físico.** Todo es Chromium emulando esos
anchos.

---

## 5. Trabajo pendiente

### Paneles que faltan

Ninguno: desde 2026-09-08 cada módulo (incluidos Incorporación y
Administración) abre con su propia página «Dashboard» (§ 2.ter).

### Deuda menor de código — saldada (2026-09-08)

- Código muerto retirado: `RecipeCard` y `RecipeCost` (recetas), los
  parámetros `employeeId` y `onCompleteRequirement` de `Documents` en
  `employee-360.tsx`, y el archivo `hiring/hiring-queue-metrics.tsx`, que
  nadie importaba.
- Internacionalización completada en firma electrónica (`signatures.*`),
  entrevistas (`interviews.*`, incluidos días de la semana, avisos y
  confirmaciones), carga de empleados (`employees.import.*`) y todo el
  espacio de recetas (`recipes.*`: lista, tarjeta, ficha de costo, historial,
  cookbook y los cuatro pasos del editor). es/en con el mismo número de
  claves (3 063). Quedan como datos, no como interfaz, los valores por
  defecto que se envían al servidor (título «Entrevista», textos de la
  plantilla de firma).

### Docker: no verificado desde esta sesión

El acceso a la máquina va por un shell aislado que solo monta la carpeta del
proyecto: no ve `/Applications`, no encuentra el binario `docker` y
`localhost` no responde. **La reconstrucción de imágenes y la comprobación
en localhost no se han ejecutado.** El script del repositorio
`reconstruir-local.command` hace lo correcto —`down --remove-orphans`
seguido de `up -d --build`, sin borrar volúmenes con nombre— y debe
ejecutarlo una persona en la máquina.

### Separar Personas de Productividad — hecho antes de esta sesión

Quedó resuelto en `770a2e9` («Personas y Productividad: dos módulos»):
`/employees` se protege solo por `employees.read` (en el servidor cada ruta
de `EmployeesController` lleva ese permiso, ninguna `productivity.view`),
Personas tiene sección de menú propia y `requiresCommercialModule` está
apagado para el módulo `people`. No hacía falta migración ni cambio de
permisos. Esta nota reemplaza a la que lo daba por pendiente.

### Prueba de usabilidad

Sin realizar: requiere personas. El protocolo pedido —cinco usuarios, tres
tareas (evaluar un candidato, continuar un curso, recibir mercancía),
registrando éxito, errores, tiempo y peticiones de ayuda— queda como
entregable pendiente.

### Datos agregados de Personas — resuelto con `GET /employees/summary` (2026-09-08)

Nuevo endpoint en `EmployeesController`, declarado antes de `:id`:

| | |
|---|---|
| Permiso | `employees.read` (el mismo que la lista). Sin permiso nuevo, sin migración: solo lectura sobre tablas existentes |
| Alcance | Sucursal activa (o `?branchId=`, validada contra la empresa) y `buildBranchScopedWhere(actor)`, exactamente como `findAll`: quien no puede listar a alguien tampoco lo cuenta |
| `headcount` | Total y por estado (`groupBy`) |
| `incompleteProfiles` | Activos sin cargo, sin teléfono o sin contacto de emergencia; cifra total + muestra de 5 con qué falta |
| `documents` | Vigentes (no borrados ni sustituidos): sin revisar, vencidos, por vencer en 30 días; muestra de 5 ordenada por vencimiento |
| `recentChanges` | Últimas 10 entradas de `AuditLog` con `entityType = Employee` sobre expedientes del alcance |
| `truncated` | `true` si el alcance supera 2 000 expedientes (la auditoría se limita a esos) |

Prueba unitaria en `employees.service.spec.ts`. El panel `/people/dashboard`
gana la sección «Qué necesita atención» (tres tarjetas de estado, listas de
muestra enlazadas al expediente) y «Cambios recientes»; el aviso «el
servidor todavía no lo resume» desaparece. Verificado con specimen a 390 y
1440 px. Nota: `test/rbac/rbac-security.test.ts` tiene 4 fallos previos
(vacantes, portal de candidatos, entrevistadores, contratación) que no
dependen de este cambio; se reproducen igual sin él.
