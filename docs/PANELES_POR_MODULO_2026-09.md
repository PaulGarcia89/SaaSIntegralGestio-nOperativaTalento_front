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

## 2.septies Portada nueva (2026-09-08)

Rediseño completo de `/` con las piezas del propio sistema, sin fotografías
de archivo ni logotipos de clientes inventados:

| Sección | Qué enseña | Movimiento |
|---|---|---|
| Hero | Titular con verbo que cambia (Contrata · Incorpora · Capacita · Gestiona), dos acciones y **el panel real de Reclutamiento** maquetado con los tokens de la aplicación; tres tarjetas flotantes (candidata confirmada, aviso de existencias, firma completada) | Entrada escalonada, flotación lenta, perspectiva suave en escritorio que se aplana al posar el puntero, dos luces de fondo que derivan en 30 s |
| Cinta de módulos | Los ocho módulos con icono | Marquesina lenta (46 s), se detiene al posar el puntero o al enfocar |
| Producto (`#producto`) | Pestañas por módulo con una maqueta de cada pantalla (pipeline, expediente de incorporación, reproductor, personas, existencias, productividad) y tres capacidades | Rotación automática cada 7 s con barra de tiempo; se detiene al elegir; flechas del teclado; en móvil las pestañas son fichas desplazables |
| Flujo (`#soluciones`) | Ocho etapas numeradas sobre una línea | La línea se dibuja al entrar en pantalla; tarjetas escalonadas |
| Multiempresa | Esquema empresa → tres sucursales con su alcance | Conectores que se dibujan |
| Módulos a medida (`#planes`) | Interruptores reales por módulo con recuento en vivo | Sin animación más allá del cambio de estado |
| Roles | Seis roles con una línea de qué ve cada uno | Escalonado |
| Cómo funciona (`#como-funciona`), portal de candidatos, cierre y pie | Contenido anterior con la retícula y el ámbar de la marca | Escalonado |

Archivos: `landing-hero.tsx`, `landing-showcase.tsx`, `landing-mocks.tsx`,
`public/motion.tsx` (Reveal, RevealGroup, RotatingWord, Float sobre
framer-motion, ya presente en el proyecto), `landing-sections.tsx`,
`page.tsx`; en `globals.css`, `.public-grid`, `.public-glow`,
`.public-marquee`, `.public-tilt`. Todo el texto pasa por `t()`
(`landing.hero.*`, `landing.mock.*`, `landing.strip.*`, `landing.flow.*`,
`landing.branches.*`, `landing.plans.*`, `landing.roles.*Hint`) y la prueba
de la portada sigue vigilando que no haya literales. `prefers-reduced-motion`
apaga todo el movimiento (los componentes usan `useReducedMotion` y el CSS
global corta las animaciones). Verificado a 390, 768 y 1440 px sin
desbordes y con todos los enlaces y botones ≥ 44 px.

## 2.octies Portal de empleos `/jobs` (2026-09-08)

La misma gramática de la portada aplicada a la única pantalla que ve quien
busca trabajo. Cambios respecto de la versión anterior:

| Antes | Ahora | Por qué |
|---|---|---|
| Buscador suelto bajo el titular | Campo de 56 px DENTRO del hero grafito, con botón de borrar | En un portal de empleo buscar es la primera acción, no una más |
| Sin forma de acotar | Facetas de modalidad, área y ciudad calculadas sobre las vacantes existentes, con recuento por botón | Si nadie publica remoto, «Remoto» no aparece; el recuento dice el resultado antes de pulsar |
| Tarjeta = foto + dos insignias + botón | Jornada, sueldo cuando existe y número de plazas; tarjeta entera pulsable con UN solo elemento enfocable (enlace estirado sobre el título) | Son las tres preguntas que se hacen antes de abrir una oferta |
| Imagen de archivo cuando la vacante no traía foto | Panel de marca con el icono del área | No fingir una fotografía que no existe |
| — | Sección «cómo es postularse» (tres pasos) y acceso a seguir la postulación | El miedo de quien busca trabajo es el silencio |

Archivos: `careers/vacancy-card.tsx`, `careers/careers-sections.tsx`,
`career-portal-shell.tsx`, `candidate-nav.tsx` (variante `tone="dark"`).
Las primitivas de movimiento y las clases de fondo pasaron de `landing-*` a
`public-*` para que portada y portal compartan UNA definición; la portada no
cambia de aspecto. La prueba de textos a mano se movió a
`components/public/public-i18n.test.ts` y ahora cubre las dos superficies.
Verificado a 390, 768 y 1440 px: sin desbordes; las tarjetas de una fila
miden lo mismo (`h-full`).

## 2.novies Inicio de sesión (2026-09-08)

Es la única pantalla que ve TODO el mundo. Correcciones, por orden de
impacto real:

1. **Los campos no declaraban `autocomplete`.** Ni el llavero de iOS ni
   ningún gestor de contraseñas ofrecía rellenar nada. Ahora `username` y
   `current-password`, con `type="email"`, `inputmode`, `autocapitalize` y
   `enterkeyhint`. Es la mejora más útil del cambio y no se ve.
2. **En móvil el panel de marketing iba primero.** En un iPhone había que
   pasar un titular y dos tarjetas antes de ver el campo del correo. El
   panel grande existe solo a partir de `lg`; en móvil queda una banda
   compacta y el formulario entra entero en la primera pantalla (851 px de
   página frente a 844 de ventana).
3. **Tres botones apilados del mismo tamaño** —entrar, «olvidé mi
   contraseña» y «volver al sitio»— competían entre sí. Solo entrar es una
   acción; los otros dos son enlaces y se ven como tales.
4. **La casilla «recordar» no hacía nada:** no existe tal parámetro en
   `POST /auth/login`. Ahora recuerda el CORREO en el dispositivo y el
   rótulo lo dice. Se lee con `useSyncExternalStore` —instantánea `null` en
   el servidor— para no hidratar mal ni encadenar renders.
5. El botón de ver la contraseña medía 16 px; ahora 44.
6. Se pasó de `bg-card` / `text-muted-foreground` / `border-border` a los
   tokens del sistema.
7. El panel de marca medía 850 px de alto y en un portátil de 844 px el
   titular se comía la marca y el pie. Recortado a ~750 px.

`LanguageSelector` gana `tone="dark"` (aditivo, ninguna llamada existente
cambia de aspecto): el control claro sobre grafito se leía como una pegatina.

Se conserva: `authenticateUser` y su contrato, el `returnTo` validado contra
rutas relativas, el resumen accesible de errores, el atajo del entorno de
prueba y todas las claves de traducción anteriores.

Verificado a 390, 428, 768, 1440 y 1920 px sobre el **HTML real del build**
(no una maqueta): sin desplazamiento horizontal, objetivos táctiles de 44 px
o más y campo de correo a 17 px en móvil, por encima del umbral de zoom de
Safari.

## 2.decies Inicio: la forma de cada gráfico (2026-09-08)

Dos de los tres gráficos del centro operativo estaban en la forma equivocada,
y faltaba el que los datos ya permitían.

| Antes | Ahora | Por qué |
|---|---|---|
| «Pendientes por vencimiento» en barras verticales, todas del mismo ámbar, con tres de cinco tramos a cero | Barras **horizontales** con color por urgencia: rojo lo vencido, ámbar lo de hoy, grafito el resto | Es un reparto entre tramos con orden de urgencia y nombres largos. En vertical media tinta eran columnas vacías, y con un solo color «Vencidos» y «Sin fecha» pesaban lo mismo a la vista |
| «Actividad de los últimos 7 días» en barras | **Área temporal** con cruceta y globo | Una serie temporal se lee en línea. En barras, un día con 13 registros dejaba los otros seis como rayas de un píxel |
| «Salud operativa» como una cifra más entre siete | **Medidor** con pista, cifra grande y el desglose que la penaliza | Es una proporción contra un límite y el resumen de la pantalla, no una métrica de la fila |
| — | **«Dónde se concentra el trabajo»**: carga por módulo | Cada tarea y cada alerta traen su `module` y no se mostraba en ninguna parte. Es lo que decide a qué pantalla ir |

**Los gráficos son controles.** Bajo los dos de reparto hay una fila de
botones —etiqueta directa con su color y su cifra— que filtra las listas de
pendientes y alertas; las tres cifras del pie del medidor hacen lo mismo. Se
filtran las LISTAS, nunca los gráficos: si al pulsar «Vencidos» el gráfico se
quedase con una sola barra se perdería el contexto que justifica el filtro.
Son botones de verdad, así que funcionan con teclado y con lector de pantalla
sin añadir nada. Cuando hay filtro puesto, la lista vacía distingue «no hay
nada» de «tu filtro no encuentra nada» y ofrece quitarlo.

Piezas nuevas en `components/dashboard/operational-widgets.tsx` (`HealthMeter`
con `role="meter"` y sus tres valores, `ChartFilterChips`). De compartido solo
se añadió, de forma aditiva: `groupByModule` y `DUE_BUCKET_TONE` en
`lib/dashboard-insights.ts` —con nueve pruebas nuevas, incluidas las del
plegado de la cola en «Otros» sin perder registros— y la prop
`categoryColorClasses` de `BarChart`, que solo tiene efecto con una sola serie
y con tonos de estado, nunca como paleta categórica. Ninguna llamada existente
cambia de aspecto.

Se corrigió además que los enlaces «Ver registros» de las métricas medían
14 px de alto, por debajo del mínimo táctil.

Verificado a 390, 768 y 1440 px sin desbordes, sobre una maqueta que **renderiza
los componentes de verdad** —los tres gráficos y el medidor salen de
`renderToStaticMarkup`, no están dibujados a mano— con el CSS compilado del
proyecto.

Pendiente, fuera del alcance de esta pantalla: `LineChart` dibuja leyenda
aunque haya una sola serie, mientras que `BarChart` la omite. Igualarlo tocaría
todos los gráficos de línea de la aplicación.

## 2.undecies Panel de Reclutamiento (2026-09-08)

| Antes | Ahora | Por qué |
|---|---|---|
| Cuatro tarjetas de estado, dos de ellas repitiendo cifras del reparto por fase: «Postulaciones nuevas» = fase POSTULARON, «Decisiones pendientes» = fase DECIDIDO | Las tarjetas cubren solo lo que las fases no cubren —vacantes activas y entrevistas por coordinar— más **conversión a contratación** y **tiempo hasta contratar** | El mismo número dos veces en dos formas obliga a descubrir que son el mismo. La urgencia de las dos retiradas no se pierde: pasa a una insignia en la propia fase, donde ya estaba el número |
| Sin ninguna variación: «el backend entrega el estado de ahora, no una serie temporal» | Variación real en las dos cifras nuevas | El comentario estaba desfasado. `summary.changes` compara la ventana de 90 días con la anterior y ya se descargaba. La prop `trend` de `StatusTile` llevaba existiendo sin usarse |
| Sin tendencia | **«Cómo evoluciona el proceso»**: postulaciones y contrataciones por semana | `trends[]` viene en la MISMA respuesta que el embudo. La pantalla lo descargaba y lo tiraba, y sin él no podía contestar si el reclutamiento va mejor o peor que antes |
| «Tiempo medio por etapa» como lista de texto bajo el embudo | **Barras horizontales** en su propia tarjeta, al lado del embudo | Comparar cuatro magnitudes leyendo cifras es el trabajo de unas barras. El tamaño de muestra sigue escrito al pie: sin él, una media de 7 casos y una de 700 se leen igual |

Dos correcciones de detalle: el eje de tiempos mezclaba unidades («0 h · 1 d ·
2,1 d») porque el formateador salta de horas a días en 24; ahora se elige una
sola unidad para todo el gráfico según el mayor valor. Y la conversión se
imprimía como `${n}%`, que en español daba «8.3%» en vez de «8,3 %».

Se corrigió también `TaskCard`: el enlace de acción llevaba `flex w-full
sm:w-auto`, y un elemento de BLOQUE con `width:auto` ocupa todo el ancho, así
que el `sm:w-auto` no encogía nada y en escritorio salían tres botones oscuros
a todo el ancho compitiendo con la acción recomendada. Pasa a `inline-flex`.
Esta pantalla es la única que usa el componente.

No se tocó el embudo —está bien planteado y su nota sobre por qué NO se deriva
de las cifras de ocupación sigue siendo correcta—, ni el panel de contratación
incrustado, ni el backend.

Verificado a 390, 768 y 1440 px sin desbordes, sobre una maqueta que renderiza
los componentes de verdad con el CSS compilado del proyecto.

## 2.duodecies Panel de Incorporación (2026-09-08)

Era el **único panel de módulo sin un solo gráfico**: cuatro cifras, una
rejilla de accesos, tarjetas y una línea de tiempo.

| Antes | Ahora | Por qué |
|---|---|---|
| «En curso: 12» y nada más | **«Cómo van las que están en curso»**: reparto por tramo de avance | Doce incorporaciones al 10 % y doce al 90 % son la misma cifra y situaciones opuestas. `progressPercent` venía en cada expediente sin agregarse |
| Solo se contaban las tareas vencidas | **«Qué frena las incorporaciones»**: vencidas, bloqueadas, en curso y pendientes | Lo que frena una incorporación es la tarea, no el expediente. Bloqueadas y en curso estaban en los datos sin mirarse |
| — | **«Dónde se atasca el proceso»**: tiempo medio por etapa | `timeByStage` venía en la misma respuesta de analítica que la pantalla ya descargaba y no se pintaba aquí |
| Cuatro cifras | Seis: entran **completitud** y **tiempo hasta productividad** | Son los dos resultados del módulo y no aparecían en su panel |
| «En curso» y «Tareas vencidas» se contaban sobre las 50 cargadas; «En riesgo» y «Cumplimiento» sobre todas, sin distinguirlo | Cada tarjeta declara su alcance | Dos cifras de la misma fila que cuentan poblaciones distintas mienten si no lo dicen. El aviso de «parcial» salía debajo y solo a veces |
| «Requieren atención» solo existía si había problemas | **«Incorporaciones en curso»**, ordenada por urgencia | En un día tranquilo el panel del módulo no enseñaba a NINGUNA de las personas que se estaban incorporando |

Los dos gráficos de reparto son controles: filtran la lista. Se filtra la
LISTA, nunca los gráficos, por la misma razón que en el Inicio.

**Agujero de traducción cerrado.** Buena parte de los textos de esta pantalla
estaban escritos a pelo, fuera de `uiText`, así que en inglés se quedaban en
español —«Personas que todavía no terminaron su incorporación», «Tareas
abiertas cuya fecha límite ya pasó», «Atrasado», «Alerta grave», «Avance»…—.
La prueba que vigila esto solo mira lo que ya está marcado, así que no los
veía. Son 53 cadenas nuevas en el diccionario inglés.

Lógica nueva en `lib/onboarding-insights.ts` (tramos de avance, estado de
tarea, orden por urgencia), pura y con 14 pruebas: entre ellas que una tarea
vencida Y bloqueada cuenta como vencida —el vencimiento es lo que obliga a
actuar hoy—, que un porcentaje imposible no inventa un tramo, y que el orden
es estable con independencia del orden del arreglo de entrada.

Verificado a 390, 768 y 1440 px sin desbordes, sobre una maqueta que renderiza
los componentes de verdad con el CSS compilado del proyecto.

## 2.terdecies Panel de Capacitación (2026-09-08)

Son dos paneles distintos según el papel, y cada uno tenía su problema.

### Quien administra: eran cuatro números y nada más

| Antes | Ahora | Por qué |
|---|---|---|
| Una fila de cuatro tarjetas; ni acción recomendada, ni gráfico, ni lista | **Acción recomendada**: el curso con más personas fuera de plazo, con cuántas son de cuántas asignadas y su avance medio | Era el único panel de módulo que no decía por dónde empezar |
| Vencidas, sin comenzar, en progreso y completadas como cuatro cifras sueltas | **«Cómo va el programa»**: el mismo reparto en barras, con color de urgencia | Las cuatro suman el total de asignaciones: es un reparto de un todo, y como números separados no se ve la proporción |
| Decía cuántas personas van tarde, pero no en qué curso | **«Dónde se atasca la formación»**: cursos con gente fuera de plazo, de más a menos, con cuántos hay asignados detrás de cada barra | Es la respuesta a «¿a quién persigo?». Tres vencidos sobre cuatro asignados y tres sobre trescientos no son el mismo problema |
| — | **Avance medio** y **aprobación** como cifras | `/training/admin/analytics/overview` ya existía y no se consultaba desde aquí; de ahí sale todo lo anterior |

Es una petición más, y es la única fuente de `byCourse`, del avance medio y de
la tasa de aprobación. Los tablones profundos —matriz de cumplimiento,
rendimiento por curso ordenable, efectividad— se quedan en Resultados.

### Quien aprende

- **La cabecera prometía «qué vence pronto» y no estaba en ninguna parte.**
  `upcomingDue` venía en la respuesta sin usarse. Ahora es cifra y entra en la
  lista, descontando lo que ya está vencido, que tiene su propia cifra.
- **La lista se comía unas categorías con otras.** Concatenaba vencidos, en
  curso y nuevos y cortaba a cuatro fichas: con tres vencidos y cinco en curso
  no aparecía ni un solo curso por empezar, aunque el rótulo dijera que
  estaban. Ahora reparte por rondas —uno de cada, empezando por lo más
  urgente—, así que las primeras fichas representan todo lo que hay sin dejar
  de poner delante lo vencido. `intercalar` está en cinco pruebas, incluida la
  que reproduce exactamente ese caso.

**Agujero de traducción cerrado** en la pantalla contenedora: los rótulos y
descripciones de los siete accesos del módulo, la descripción de la cabecera y
el botón principal estaban escritos a pelo, fuera de `uiText`.

Verificado a 390, 768 y 1440 px sin desbordes, en los dos papeles, sobre
maquetas que renderizan los componentes de verdad con el CSS compilado.

## 2.quaterdecies Panel de Personas (2026-09-08)

| Antes | Ahora | Por qué |
|---|---|---|
| Activos, Inactivos y Desvinculados junto al Total | Los **cuatro** estados, con **Suspendidos** | El sistema tiene cuatro estados y solo se consultaban tres, así que en cuanto había una persona suspendida las cifras no sumaban el total y no había forma de saber dónde estaba la diferencia. El filtro ya existía en el backend; simplemente no se pedía |
| Cuatro tarjetas del mismo tamaño para cuatro partes de un mismo total | Una cifra de cabecera y el **reparto en barras**, con una fila de enlaces al directorio ya filtrado | La proporción, que es lo que se quiere saber al abrir el módulo, había que calcularla mentalmente. Los enlaces conservan lo que hacían las tarjetas |
| «Perfiles incompletos», «documentos por vencer» y «documentos sin revisar» sin declarar alcance | Cada tarjeta declara el suyo, y se avisa cuando contradice al de arriba | `GET /employees/summary` **exige** una sucursal: esas cifras son siempre de UNA, mientras las de plantilla cuentan toda la empresa si no hay sucursal activa. Dos filas de la misma pantalla contando poblaciones distintas sin decirlo es peor que no enseñar la segunda |
| La cifra de perfiles incompletos aparecía sin su regla | Se imprime el criterio que manda el servidor en `criteria` | Un recuento sin el criterio con el que se calculó no se puede discutir |

Nueve tarjetas seguidas en tres filas pasan a una cifra, un gráfico y dos
filas de tres.

No se tocó el reparto por sucursal: es una navegación —cada fila abre el
directorio filtrado— y no solo un gráfico. Queda anotado que su barra está
dibujada a mano en vez de con el motor de gráficos, así que no tiene tabla de
respaldo ni globo; cambiarlo costaría la navegación y se deja para cuando el
motor acepte barras navegables.

Verificado a 390, 768 y 1440 px sin desbordes, sobre una maqueta que renderiza
los componentes de verdad con el CSS compilado del proyecto.

## 2.quindecies Panel de Productividad (2026-09-08)

### Lo importante: la pantalla enseñaba datos simulados sin decirlo

Cuando el servidor no devolvía zonas medidas en `insights`, «Actividad por
zona» caía a `sessionSummary.byZone`, construido con los eventos de origen
`DEMO`, y los pintaba bajo el mismo título, con el mismo aspecto y sin
ninguna marca. Todo el cuidado que hay en la sección de simulación —el aviso,
el arranque en pausa, la etiqueta DEMO— se perdía justo ahí.

Se conserva la caída, porque enseñar la forma del módulo con datos de ejemplo
es útil cuando todavía no hay medición, pero ahora la sección lo dice **antes
del gráfico**, no después.

### El resto

| Antes | Ahora | Por qué |
|---|---|---|
| «Tiempo activo: 45 min · frente a 12 min sin actividad» en prosa | **«Tiempo medido en la sucursal»**, barra apilada, y una cifra de **uso de la sucursal** | Es una proporción, y es la medida que da nombre al módulo |
| «Actividad por zona» como lista de seis pares de minutos | **Barras apiladas** por zona, con la confianza de cada medida debajo | Comparar seis pares de minutos leyéndolos es justo el trabajo de unas barras. La confianza sigue al lado: sin ella, el dato de una cámara mal calibrada se lee igual que uno fiable |
| «Cámaras en línea: 3» | «3 **de 5**» | El total estaba en la misma respuesta ya descargada |
| El recuadro de cámara falsa (360 px) más sus cifras y su línea de tiempo ocupaban más pantalla que todo lo real | La vista previa se **pliega** | La simulación sigue estando, con su aviso y su arranque en pausa; deja de dominar |

Los dos gráficos usan **la misma codificación** para el mismo par de
conceptos. La primera versión pintaba «con/sin actividad» de dos maneras
distintas en la misma pantalla, lo que obliga a aprender dos leyendas para
una sola idea.

**Idioma fijado y agujero de traducción.** `Intl.DateTimeFormat("es", …)`
estaba escrito a mano, así que en inglés la pantalla seguía diciendo
«14 sept»; ahora el idioma es un argumento. Y otras 29 cadenas estaban fuera
de `uiText`: «Registrando ahora mismo en esta sucursal», «Sin revisar o sin
resolver», «Iniciar simulación», «Confianza 70 %»…

Verificado a 390, 768 y 1440 px sin desbordes, sobre una maqueta que renderiza
los componentes de verdad con el CSS compilado del proyecto.

## 2.sexdecies Panel de Inventario de activos (2026-09-09)

| Antes | Ahora | Por qué |
|---|---|---|
| «Disponibles» y «En custodia» sueltas, y «Requieren atención» sumando devoluciones con mantenimiento en un número ya indescomponible | **«Dónde están los activos»**: reparto por estado en barras, con cada barra enlazando al listado filtrado | Es un reparto y se leía como cifras inconexas |
| El servidor cuenta `total` sobre TODOS los estados pero solo desglosa cuatro | Se calcula el **resto** y se dibuja como «Otros estados» cuando existe | Los retirados, perdidos o reservados no aparecían en ninguna tarjeta y nadie lo notaba |
| Del almacén se pintaba solo `belowMinimum` | **«Qué falta en el almacén»** con las dos medidas y el denominador (`references`) en el subtítulo | «En punto de pedido» es el aviso temprano: lo que todavía se puede reponer a tiempo |
| — | **Compras en curso** | `operations.purchaseOrdersInProgress` venía en la misma respuesta, existe la pantalla de compras, y no se enseñaba en ninguna parte |

**Bajo mínimo y punto de pedido NO se apilan.** El servidor los calcula con
dos umbrales distintos sobre la misma referencia (`qty < minQty` y
`qty <= reorderPoint`), y nada garantiza que el punto de pedido esté por
encima del mínimo, así que no son conjuntos excluyentes y presentarlos como
un reparto sería mentir sobre el total. Van como dos medidas contra el mismo
denominador, con una nota que explica el solape.

**La acción recomendada estaba escrita a pelo, entera.** `siguienteAccion`
devolvía rótulo, título, detalle y texto del botón como literales en español:
el elemento más prominente de la pantalla se quedaba sin traducir de
principio a fin. Ahora recibe el traductor y no escribe ni una palabra por su
cuenta. Con las descripciones de las tarjetas y de los accesos, son 40 cadenas
nuevas en el diccionario inglés.

Los enlaces a `/inventory/assets/maintenance` y `/inventory/assets/warehouse`
pasan a `/inventory/maintenance` y `/inventory/warehouse`: las primeras
funcionaban, pero solo a través del alias `[...slug]` que redirige, así que
ahorraban un salto y dejaban la pantalla con dos formas de nombrar la misma
ruta.

### Corrección en el motor de gráficos

`ANCHO_MAXIMO_BANDA` era 96 px para las dos orientaciones. En vertical es una
columna normal; en horizontal son 96 px de ALTO —más de tres veces la fila de
30 px que el propio gráfico reserva— y con dos categorías la barra llenaba la
tarjeta como una losa. El tope pasa a depender de la orientación. Mejora
todos los gráficos horizontales de la aplicación, no solo los de esta
pantalla.

Verificado a 390, 768 y 1440 px sin desbordes, sobre una maqueta que renderiza
los componentes de verdad con el CSS compilado del proyecto.

## 2.septdecies Panel de Inventario de restaurante (2026-09-09)

| Antes | Ahora | Por qué |
|---|---|---|
| Existencias y movimientos como cifras sueltas; `waste` y `periodConsumption` llegaban en la respuesta y se descartaban | **«A dónde va el producto»**: consumo del periodo frente a merma, en el mismo gráfico | Son las dos salidas del inventario: por separado no se puede juzgar si la merma es tolerable |
| — | Tarjetas de **merma** y **consumo del periodo** | Los datos ya viajaban; no aparecían en ninguna pantalla |
| Fechas e importes formateados con literales fijos | `fechaCorta(valor, locale)`, `formatoMoneda(valor, locale)`, `formatoNumero(valor, locale)` | En inglés se leían fechas y separadores en formato español |

**Código muerto retirado.** `restaurant-inventory-shell.tsx` conservaba
`DashboardScreen`, `RecentList`, `StockScreen` y `MovementsScreen`: pantallas
completas que ninguna ruta montaba desde el rediseño, con sus importaciones.
Se eliminan junto con los importes que solo ellas usaban.

Verificado a 390, 768 y 1440 px sin desbordes.

## 2.octodecies El selector de idioma (2026-09-09)

Era el único control de la aplicación que no salía del sistema de diseño: un
`<select>` nativo con tokens heredados (`border-border`, `bg-background`,
`text-foreground`, `focus:ring-primary`, `rounded-lg`). En cualquier pantalla
—y de forma llamativa sobre el hero grafito de `/jobs`— se leía como un widget
del sistema operativo pegado entre los botones: galón del navegador, radio
distinto, fondo blanco donde todo lo demás era oscuro.

| Antes | Ahora |
|---|---|
| El `<select>` nativo se dibujaba a sí mismo | El `<select>` va **transparente sobre una superficie propia**: icono `Languages`, etiqueta y galón `ChevronDown` los dibuja el componente |
| `rounded-lg`, altura fija `--control-h-touch` | `shape="control"` (por defecto) copia `Button variant="secondary"`: `rounded-md` y alturas `--control-h-touch` / `sm:--control-h-base`; `shape="pill"` copia las píldoras de `CandidateNav` |
| `focus:ring-primary` | `focus-within:outline-2 outline-offset-2` sobre `outline-focus` (claro) o `accent-fill` (oscuro), el mismo anillo que el resto |

**El elemento sigue siendo un `<select>` nativo**, con las mismas opciones, el
mismo `setLocale`, el mismo `aria-label` y el mismo selector a pantalla
completa en iOS. Solo deja de imponer su aspecto. El `<select>` se extiende
con `-inset-px` para cubrir también el borde: con `inset-0` quedaba 2 px más
bajo que el control y el área tocable no llegaba a los 44 px.

Llamadas corregidas:

- `candidate-nav.tsx` pasa `shape="pill"` y **propaga su propio `tone`**. Era
  el fallo visible en `/jobs`: la barra se pintaba oscura y el selector se
  quedaba blanco.
- `landing-header.tsx` pasa `tone="dark"` en la cabecera y en el menú móvil
  —los dos van sobre grafito—, y en el menú `w-full justify-start` para que la
  fila ocupe el ancho como las demás.
- `login`, `profile`, `forgot-password` y las dos de `app-shell` no cambian de
  llamada: heredan la forma «control», que es la de sus vecinos.

Verificado con maqueta de los componentes reales a 390, 768 y 1440 px: sin
desbordes, ningún objetivo por debajo de 44 px, y alturas idénticas a las de
`Button` (56 px en móvil, 44 px desde `sm`).

## 2.novodecies Barra lateral contraíble (2026-09-09)

Contraída, la barra pasa de 264 px a un carril de 68 px con los iconos de
sección; la columna de contenido gana los 196 px por sí sola, porque ya era
`flex-1` dentro de la misma fila.

### Por qué el estado vive en `html[data-nav]` y no en clases de React

El servidor no puede saber qué eligió el usuario. Cualquier clase calculada a
partir de la preferencia haría que el marcado del servidor y el del cliente
discreparan en la hidratación, y además se vería la barra ancha saltando a
estrecha en cuanto React tomara el control. El atributo lo escribe
`APPEARANCE_BOOT_SCRIPT` antes del primer pintado y queda FUERA del árbol de
React: ni discrepa ni parpadea. Es el mismo camino que ya seguían el tema y la
densidad.

**El marcado es el mismo en los dos estados.** Contraída no se renderiza otra
barra: se ocultan los rótulos con `display:none`, que además los saca del árbol
de accesibilidad y del orden de tabulación —justo lo que debe pasar con algo que
no está a la vista—.

### El asomo

Un carril de iconos sin más obliga a expandir y volver a contraer para cada
salto de pantalla. Al apuntar la barra, al llevarle el foco o al pulsar una
sección, vuelve a su forma completa **desbordando hacia la derecha**: el
`aside` conserva sus 68 px, así que el contenido no se recoloca a cada paso del
puntero. Se cierra con Esc, al salir el puntero, al salir el foco y al navegar.

Se abre también con foco y con pulsación, no solo al pasar por encima: un asomo
que dependiera del ratón dejaría el carril inservible con teclado. Al cerrarlo
con Esc el foco vuelve al conmutador, porque lo que lo tenía acaba de ocultarse
y si no el foco cae al documento.

### Accesibilidad

| Riesgo | Respuesta |
|---|---|
| Sin rótulo visible, el botón de sección se queda sin nombre | `aria-label` permanente con el mismo texto que el rótulo visible (cumple «etiqueta en el nombre») |
| «Aquí estás» solo por color de icono | Se añade el MISMO filo ámbar que ya marca el enlace activo, para no inventar un segundo lenguaje |
| Empresa · sucursal · rol salen de la barra | Vuelven a la franja superior, donde ya viven en móvil (`.app-context-line`) |
| Estado del conmutador | `aria-pressed`, `aria-controls="app-sidebar"` y etiqueta que dice la acción, no el estado |
| Movimiento | La transición de ancho se anula bajo `prefers-reduced-motion` |

Los objetivos del carril siguen en 44 px (`--control-h-base`), y por debajo de
`xl` no cambia nada: allí la barra es un cajón y una franja inferior.

### Persistencia — sin cambios de contrato

La preferencia va al almacén genérico de preferencias que ya existe
(`PUT /auth/preferences/:namespace`, tabla clave/valor sin lista blanca) bajo el
espacio de nombres `ui-nav`, con espejo en `localStorage` para acertar el primer
pintado. **Sin migración, sin endpoint nuevo, sin permiso nuevo.**

### Nota sobre la hoja de estilos

La marca de sección activa se pinta con un elemento propio y su utilidad de
color, no con `background-color` desde `globals.css`: `globals.layers.test.ts`
lo rechaza, y con razón —una regla sin capa anula en silencio todas las
utilidades que toquen esa propiedad—.

Verificado a 1440 px en los tres estados sobre una maqueta que renderiza la
barra real con el CSS compilado: expandida 264/264 px, contraída 68/68 px con
cero enlaces en el árbol y las 10 secciones presentes, asomo 68 px de carril con
panel de 264 px. Sin desbordes horizontales.

### 2.novodecies.bis El bloque de contexto de la barra (2026-09-09)

Eran tres filas idénticas de 12px, rótulo a la izquierda y valor a la derecha,
todas del mismo peso. Nada destacaba, el ojo cruzaba el hueco en cada fila y los
valores se recortaban en media línea.

| Antes | Ahora | Por qué |
|---|---|---|
| «Empresa: DATALINK TECH CORP» dos líneas debajo de «DATALINK TECH CORP» en la cabecera | La fila **solo aparece cuando el nombre de la empresa NO es el de la cabecera** (marca blanca) | El bloque gastaba su primera línea en repetir algo que estaba a 40px |
| Rótulo y valor al mismo tamaño y peso | Rótulo de 10px en versalitas **encima**; valor de 14px seminegrita en línea completa | Es la jerarquía del propio dato: el rótulo se lee una vez, el valor cada vez |
| `truncate` en media columna | Línea entera con `break-words` | «Sucursal Coral Way — Salón principal» se cortaba a la mitad |
| «Activa» como rótulo | `workspace.activeBranch` («Sucursal activa») | Suelto, «Activa» es un adjetivo sin sustantivo; además `branches.active` es el ESTADO de una sucursal en su tabla, otro significado |
| El cargo era el `dt` y la persona el `dd` | La persona es lo que se lee, con iniciales, y el cargo la matiza debajo | La persona aparecía como definición de su cargo |
| `bg-sidebar-accent/60` | `bg-sidebar-accent` | El bloque tenía que separarse del fondo de la barra, no fundirse con él |

Las iniciales salen de `initialsOf`, que ya existía para las tarjetas de
entidad; no se ha escrito una segunda versión.

El nombre de la empresa en la cabecera pasa de `truncate` a dos líneas: al dejar
de repetirse abajo, la cabecera es su ÚNICO sitio y recortado quedaba ilegible
(«DATALINK TECH CO…»).

### Segunda pasada: el panel se dibuja con luz, no con borde (2026-09-09)

La primera versión ordenaba bien la información pero seguía leyéndose barata, y
la causa era el fondo: `--sidebar-accent` es 14% de luminosidad sobre un
`--sidebar` de 8%. Seis puntos de diferencia no se ven, así que el borde acababa
haciendo todo el trabajo y el bloque parecía un recuadro dibujado encima de la
barra en lugar de una superficie por encima de ella.

| Cambio | Motivo |
|---|---|
| `bg-sidebar-accent` + `border` → velo de blanco al 6% con filo interior al 8%, `rounded-xl`, `p-3.5` | El panel se levanta de verdad; sin borde duro que compita con el de la propia barra |
| Iconos `MapPin` / `Building2` → **punto de 8px**, encendido en ámbar con halo para la sucursal activa y hueco para la empresa | A 16px un icono de mapa es una mancha que no se identifica, y competía con los iconos del menú, que sí significan algo. El ámbar es el mismo que marca la sección activa: en toda la barra significa una sola cosa, «aquí estás» |
| Plan en texto gris suelto → **distintivo** | Es un dato categórico, y un dato categórico dibujado como prosa se lee como pie de foto |
| Cuadro de marca 36px `rounded-lg` → 40px `rounded-xl` con filo interior y sombra | Era el único elemento con color de la zona y estaba dibujado plano |
| Nombre de la persona `font-medium` → `font-semibold`, cargo con dos líneas | El cargo se recortaba («Administrador de empr…») |

El punto vive DENTRO del `<dd>`, posicionado, y no como tercer hijo del
contenedor: una `<dl>` solo admite `dt`/`dd` —o un `div` que los agrupe—, así
que un `span` suelto entre medias sería marcado inválido. Posicionado, además,
se alinea con la PRIMERA línea del valor aunque este ocupe dos.

Contraste recalculado sobre los tokens nuevos —el medidor automático no sabe
leer `color-mix`, que es en lo que Tailwind v4 resuelve los modificadores de
opacidad—: rótulos de 10px, 5,41:1; distintivo del plan, 6,45:1; valores,
14,5:1. AA pide 4,5:1.


## 2.vicies Plantilla de los correos (2026-09-09)

**No había plantilla que estilizar: no había correo en HTML.**
`communication-delivery.service.ts` enviaba `text: notification.message` y nada
más, por SMTP y por Resend. Un candidato recibía un párrafo suelto, sin
remitente reconocible, sin saber de qué empresa venía, a qué vacante
correspondía ni en qué punto del proceso estaba. Para mucha gente ese correo es
el ÚNICO contacto con el producto.

### Lo que ahora lleva el correo

Filo superior con el color de la empresa, cuadro de iniciales o logotipo,
título, mensaje, **tarjeta de contexto** —Empresa, Sucursal, Vacante y Etapa,
esta última como distintivo—, botón de acción y pie con el motivo del envío y el
correo de soporte.

Los datos ya estaban en la base y no salían en ninguna parte. La postulación se
localiza por dos caminos, en este orden: el mensaje del ATS cuando el correo ES
una respuesta de la conversación, y si no el `applicationId` que los avisos de
etapa, entrevista y SLA **ya guardaban en su `payload`** sin que nadie lo
leyera. Sin ninguno de los dos no se inventa nada: quedan las filas que sí se
saben —empresa, y la sucursal activa del destinatario—, y las vacías no se
dibujan.

### Decisiones de la plantilla

| Decisión | Motivo |
|---|---|
| Tablas y estilos en línea | Outlook de Windows compone con el motor de Word: ignora `flex`, `grid`, `float` y casi toda hoja externa o incrustada. Una maqueta moderna se desarma justo en el cliente corporativo donde más se leen estos correos |
| Un único `<style>`, solo con una consulta de medios | Outlook de escritorio la ignora —y allí la ventana siempre es ancha, así que la maqueta fija de 600px es la correcta—; en el móvil, rótulo y valor en la misma fila no caben y se apilan |
| **Todo valor interpolado se escapa** | El nombre de una empresa, de una vacante o de una sucursal los escribe un usuario: sin escapar, un `<` rompe el correo y una etiqueta completa lo convierte en vector de inyección |
| El botón va siempre en tinta oscura | El color del inquilino es arbitrario: un amarillo de marca con texto blanco encima no llega ni de lejos a AA. La marca se nota en el filo, el cuadro de iniciales y el distintivo de etapa, donde el contraste se CALCULA (`tintaSobre`) en vez de suponerse |
| `urlAccion` solo acepta `http(s)` | Un `javascript:` o un `data:` convertiría el botón principal del correo en un enlace hostil |
| Línea de vista previa oculta | Sin ella, la bandeja rellena ese hueco con el primer texto que encuentre, que suele ser «Ver en la plataforma» |
| El color de marca que no sea hexadecimal se descarta | Se escribía dentro de un atributo `style`: cualquier otra cosa se colaba tal cual |

### Compatibilidad

El correo sale como `multipart/alternative`. **El texto plano se conserva** —el
mensaje íntegro, primero, y el contexto después—, así que el hilado de
respuestas del ATS, que se apoya en el texto citado, no cambia de
comportamiento. Quien filtre el HTML sigue recibiendo todo.

El cuerpo se compone DESPUÉS de validar la configuración del proveedor: si la
configuración está incompleta, ya no se consulta la base de datos para nada.

**Sin migración, sin esquema nuevo, sin endpoint nuevo, sin permiso nuevo.** El
`include` de Prisma que ya existía se amplía en solo lectura (sucursal activa
del destinatario) y se añade una consulta de lectura **solo cuando** la
notificación pertenece a una postulación.

15 pruebas nuevas (10 de la plantilla, 5 del servicio): escapado, filas vacías,
esquemas de URL hostiles, color inválido, tinta legible sobre marca clara y
oscura, ausencia de `flex`/`grid`, y que empresa, sucursal, vacante y etapa
aparecen en las DOS partes del correo. `npx nest build` EXIT 0.
`scripts/preview-notification-email.ts` genera los dos casos para revisarlos en
un cliente real sin enviar nada.

## 2.unvicies Los dibujos de la portada en pantalla pequeña (2026-09-10)

Las dos ilustraciones animadas de la portada no existían por debajo de cierto
ancho, y el fallo era distinto en cada una.

### Ciclo de vida: la línea no estaba

La línea que une las ocho etapas era `hidden lg:block`. En un teléfono quedaban
ocho iconos sueltos en dos columnas —es decir, exactamente lo contrario de lo
que dice la sección: ocho funciones inconexas en lugar de ocho etapas
consecutivas de un mismo flujo—.

Ahora, por debajo de `xl`, el mismo trazo se dibuja **en vertical**: un riel con
los ocho nodos numerados en columna, con la misma animación de dibujado.

**El corte pasa de `lg` a `xl`.** Entre 1024 y 1280 la lista era de cuatro
columnas en DOS filas y la línea, que es una sola horizontal, solo cruzaba la
primera: la segunda fila de etapas se quedaba igual de suelta que en el
teléfono. La horizontal solo tiene sentido donde las ocho etapas caben en una
fila.

**El trazo ya no llega al borde.** Empieza en el centro del primer icono y
termina en el del último; antes seguía más allá de «Productividad» hasta el
margen, como si el flujo continuara.

### Segunda pasada: tarjetas encadenadas, no un riel de iconos

El riel vertical resolvía el problema —ya se veía el flujo— pero seguía siendo
un gráfico de líneas: ocho iconos y ocho palabras colgando de un pelo de 1px,
con media pantalla vacía a la derecha y nada donde apoyar la vista.

| Antes | Ahora | Motivo |
|---|---|---|
| Renglón suelto: icono de 64px con distintivo numérico + palabra | **Tarjeta** a ancho completo: icono de 44px sobre tinte ámbar, rótulo «Etapa N» y nombre | La tarjeta ocupa el ancho y da sitio a la jerarquía rótulo/nombre. El icono deja de ser un cuadro blanco con borde que competía con la tarjeta que lo contiene |
| Riel continuo de 1px cruzando los iconos | **Eslabón** de 2px entre tarjeta y tarjeta, en ámbar | Un trazo que atraviesa ocho cajas se lee como eje de un gráfico; un tramo corto entre piezas se lee como cadena. Y a 2px sobre la separación, se ve |
| Una columna hasta `xl` | Dos columnas de `md` a `xl`, llenadas **por columnas** (1-4 · 5-8) | A ancho completo la tarjeta dejaba media pantalla vacía. `grid-flow-col` con cuatro filas mantiene la lectura hacia abajo, así que el eslabón sigue significando lo mismo; el de la quinta etapa se oculta en ese corte porque encabeza la segunda columna |
| Animación: dibujado del riel | Cada eslabón crece de arriba abajo, escalonado tras su tarjeta | Se conserva el gesto del flujo y se reparte, en vez de concentrarlo en un trazo único |

`landing.flow.stageBadge` («Etapa {{number}}» / «Stage {{number}}») ya estaba
traducido en los dos idiomas y no lo usaba ningún componente: era una clave
huérfana escrita justamente para esto.

En escritorio no cambia nada: allí el número sigue sobre el icono y la tarjeta
se desactiva entera (`xl:border-0 xl:bg-transparent xl:p-0 xl:shadow-none`).

### Multisucursal: tres columnas de 85px

Las tarjetas de sucursal eran `grid-cols-3` a cualquier ancho. A 390px medían
85px: el nombre de la ciudad se recortaba a «Mia…» y cada elemento del alcance
caía en tres líneas. Ahora se apilan por debajo de `sm` y el abanico se
sustituye por un tronco vertical al costado, que dice lo mismo —cuelgan de la
empresa— sin pedir tres columnas.

**El abanico además no apuntaba a donde debía.** Su ancho estaba limitado a
`max-w-md` y centrado, mientras que las tarjetas ocupaban todo el contenedor,
así que las curvas exteriores no llegaban al centro de su tarjeta; y sus
extremos estaban en el 15% y el 85% cuando los centros de tres columnas iguales
están en 1/6 y 5/6. Con `preserveAspectRatio="none"` y ancho completo, el trazo
se estira con el contenedor y aterriza donde debe a cualquier ancho;
`vectorEffect="non-scaling-stroke"` evita que ese estirado deforme el grosor.

### La trampa que se repitió tres veces

Un `<svg>` con `viewBox` tiene **relación de aspecto intrínseca**. Colocado en
absoluto con `top` y `bottom` (o `left` y `right`), la relación gana y la altura
—o el ancho— se queda en la que dicta el viewBox: un riel de 2px de ancho con
`viewBox="0 0 1 100"` medía 200px de alto en vez de estirarse los 560 que le
tocaban, y la horizontal recortada se quedaba en 400px. La solución es la misma
en los tres casos: el contenedor se coloca en absoluto y el `svg` solo lo
rellena con `h-full w-full`.

Verificado a 390, 768, 1100 y 1440 px sin desbordes horizontales, con las tres
líneas midiendo lo que les corresponde en cada corte.

## 2.duovicies No se podía editar un curso publicado (2026-09-11)

Síntoma: en `/training/content/<id>`, el botón «Guardar fundación pedagógica»
devolvía *«Existe un conflicto con la información actual. Course content cannot
be edited in its current status»* —con la segunda mitad en inglés— después de
haber rellenado el formulario entero.

### No es un fallo del servidor

`training-admin.service.ts` solo admite escribir contenido en cuatro estados
(`editableStatuses`: DRAFT, IN_REVIEW, APPROVED, PAUSED). La regla es correcta:
**el contenido de un curso publicado no puede cambiar bajo los pies de quien lo
está cursando.**

### El fallo estaba en la pantalla

`editable={can("courses.update")}`: se comprobaba el PERMISO y nunca el ESTADO.
Sobre un curso publicado, programado, archivado o retirado la pantalla dibujaba
el formulario entero, habilitado, dejaba rellenarlo y fallaba al guardar. El
mismo archivo ya tenía la lista correcta de estados unas líneas más abajo —el
botón «Información» sí la usaba—, así que la información estaba y no se aplicaba
donde importaba.

| Antes | Ahora |
|---|---|
| El formulario se habilita con solo tener permiso | `contenidoEditable = permiso && contenidoEsEditable(status)`, con la lista en `lib/training-course-status.ts`, espejo de la del backend y con prueba que falla si divergen |
| El bloqueo se descubre al guardar, en inglés a medias | Aviso **arriba** de los pasos «Fundamento» y «Estructura», antes de escribir nada |
| No se dice qué hacer | El aviso trae la salida real y su botón |

### Las salidas salen de la tabla de transiciones, no de una suposición

`allowedTrainingCourseTransitions` admite PUBLISHED → PAUSED y SCHEDULED →
DRAFT. Así que: publicado, se pausa, se edita y se vuelve a publicar —quien ya
lo empezó conserva su avance—; programado, se devuelve a borrador. Archivado
solo puede pasar a retirado y retirado no admite nada: ahí **no hay vuelta**, y
el aviso lo dice en lugar de dejar a la persona buscando un botón que no existe.

**Un curso programado estaba encerrado.** La acción `return-draft` de la barra
editorial solo se ofrecía para IN_REVIEW aunque el backend la admite desde
SCHEDULED: ni se podía editar ni devolver a borrador. Se añade SCHEDULED a esa
acción.

Si falta el permiso en vez del estado, el aviso lo dice con otras palabras
(«Solo lectura») en vez de proponer una transición que tampoco se puede hacer;
y si se puede editar pero no transicionar, el aviso pide que lo haga quien
administre la capacitación.

5 pruebas nuevas del módulo de estados y 11 cadenas nuevas en el diccionario
inglés. 689 pruebas en verde, `next build` EXIT 0.

## 2.tervicies El botón de guardar de los diálogos era invisible (2026-09-11)

Síntoma: «Nueva evaluación» no tenía botón de guardar. Y la «✕» de cerrar
aparecía en la esquina **inferior izquierda** del diálogo en vez de arriba a la
derecha.

Las dos cosas salían de la misma línea de `DialogContent`, un apaño para fijar
al pie el último botón de un diálogo.

### 1. El botón existía y era blanco sobre blanco

`[&>form>button:last-child]:bg-card` repintaba el botón con el color de la
tarjeta —blanco en tema claro— mientras su texto seguía siendo
`text-on-action`, que también es blanco. **Contraste 1:1.** El selector de
variante (`.clase > form > button:last-child`) gana en especificidad a la clase
propia del botón, así que el botón no tenía forma de defenderse.

Medido sobre la maqueta con los componentes reales:

| | fondo | texto |
|---|---|---|
| Antes | `rgb(255,255,255)` | `rgb(255,255,255)` |
| Ahora | `rgb(24,34,48)` | `rgb(255,255,255)` |

Y `bg-card` **ni siquiera cumplía su función**: la franja que puede
transparentarse al desplazar es la que queda POR DEBAJO del botón fijo, no el
botón, que es opaco por sí mismo.

### 2. El bloque `[&>button:last-child]` solo alcanzaba a la «✕»

El último hijo directo de `DialogContent` es **siempre** el botón de cerrar,
porque se renderiza después de `{children}`. De modo que ese bloque nunca llegó
a un botón de contenido: lo único que hacía era imponerle `sticky bottom-0` a
la «✕», que gana a su propio `absolute right-3 top-3` y la mandaba abajo a la
izquierda. Se elimina entero.

El comportamiento útil —el último botón del formulario fijo al pie— se conserva
con `sticky bottom-0 z-10 py-3`, sin el repintado.

`training-assessments.tsx` repetía el mismo apaño, con el mismo fallo, en tres
diálogos más (nueva pregunta, reglas y banco de preguntas): eran copias
redundantes de lo que ya hace `DialogContent`, así que se quitan. **El arreglo
alcanza a todos los diálogos de la aplicación**, no solo al de evaluaciones.

Verificado con maqueta antes/después de los componentes reales. 689 pruebas,
`next build` EXIT 0.

## 2.quatervicies Revisión del flujo de video en cursos (2026-09-11)

### La causa probable: el proxy cortaba antes que la aplicación

`deploy/nginx.self-hosted.conf` traía `client_max_body_size 50m` mientras el
backend anuncia 500 MB (`TRAINING_VIDEO_MAX_UPLOAD_BYTES=524288000`). **Todo
video de más de 50 MB —es decir, de más de dos o tres minutos a calidad
razonable— lo rechazaba nginx con un 413 antes de que la petición llegara a
Nest.** El límite real de la aplicación no se aplicaba nunca y el usuario solo
veía «No fue posible cargar el video».

El proxy pasa a 512m, deliberadamente POR ENCIMA del límite de la aplicación:
así quien decide y explica el rechazo es Nest, con su mensaje, y no el proxy con
un 413 sin contexto. Se añade además `proxy_request_buffering off` —sin él,
nginx guarda el archivo entero en disco antes de hablar con Nest— y se suben
`proxy_send_timeout` y `client_body_timeout` a 600s: una subida de cientos de
megabytes por una línea doméstica supera de sobra los 60s por omisión.

### El rechazo silencioso mandaba al sitio equivocado

El `fileFilter` de multer descartaba el archivo con `callback(null, false)`, que
lo tira **en silencio**. El controlador recibía entonces `file === undefined` y
el servicio respondía *«A video file or an authorized video URL is required»*:
«no enviaste archivo» a alguien que sí lo envió. Quien subía un `.mov`, o un
`.mp4` que su equipo declara como `video/quicktime`, recibía un mensaje que
apuntaba al sitio equivocado.

Ahora rechaza con `BadRequestException('Only MP4 video files are supported')`. Y
el tipo declarado por el navegador deja de ser decisivo: hay equipos donde un
`.mp4` llega sin tipo o como `application/octet-stream`, así que manda la
extensión y el tipo solo descarta cuando dice explícitamente otra cosa. El
servicio vuelve a comprobarlo: no se relaja nada.

### Lo que se puede saber al elegir el archivo, se dice al elegir el archivo

No había ninguna comprobación en el navegador: se elegía un archivo de 800 MB,
se esperaban varios minutos y se fallaba al final. `lib/training-video-upload.ts`
revisa extensión, tipo y tamaño en el momento de elegirlo, con un mensaje que
dice cuánto pesa y cuál es el máximo. Es cortesía y **no sustituye** a la
comprobación del servidor, que sigue siendo la autoridad.

### La copia local se escribía antes de que el servidor aceptara

`saveLocalTrainingVideo` corría ANTES de `uploadTrainingVideo`. Si la subida
fallaba, en ese navegador quedaba una copia de un video que nunca llegó al
servidor: la lección se veía aquí y en ningún otro sitio. Ahora el servidor
primero y la copia local después.

6 pruebas nuevas. 695 pruebas en el frontend, `next build` EXIT 0;
`npx nest build` EXIT 0 y la suite del backend igual que antes del cambio.

### Pendiente de decidir: la reproducción carga el archivo ENTERO en memoria

`readVideo` llama a `TrainingObjectStorageService.readKey`, que devuelve un
`Buffer` completo —`readFile` en sistema de archivos, `Body.toArray()` en S3— y
solo después recorta el rango pedido. Con el tope actual, **cada petición de
rango de un video de 500 MB reserva 500 MB de RAM**, y un navegador emite varias
por reproducción. Afecta por igual al endpoint del administrador
(`/courses/:courseId/lessons/:lessonId/video`) y al del participante
(`/video/assignments/:assignmentId/lessons/:lessonId/file`).

Es el fallo más grave de los encontrados y el que tumbará el proceso en cuanto
los cursos con video se usen de verdad, pero arreglarlo es reescribir los dos
endpoints para transmitir por flujo (`createReadStream` con `start`/`end` en
sistema de archivos, `Range` en la petición a S3) en vez de leer y recortar. No
cambia contratos ni base de datos, pero sí es una reescritura con su propia
verificación, así que queda propuesto y no ejecutado.

## 2.quinvicies Un curso pausado quedaba encerrado para siempre (2026-09-11)

Síntoma: curso en **Pausado**, requisitos editoriales completos, los cuatro
gates de calidad en «No solicitada» y el botón **Publicar** fallando con
*«Quality gates are incomplete: Falta aprobación de content; pedagogy;
accessibility; compliance»*. Sin ninguna acción en pantalla que permitiera
solicitarlos.

### La cadena

1. Publicar exige `assertQualityApproved(courseId, course.version)`: los cuatro
   gates aprobados **para la versión actual**.
2. Los gates solo se crean al entrar en `IN_REVIEW`, y `requestQualityReviews`
   exige ese mismo estado.
3. Editar la fundación pedagógica dispara `DESIGN_UPDATED`, que hace
   `version: { increment: 1 }`. Las aprobaciones de la versión anterior dejan de
   valer —la propia pantalla lo advierte: «Las aprobaciones anteriores no se
   reutilizan cuando cambia la versión».
4. `allowedTrainingCourseTransitions.PAUSED` era `[PUBLISHED, ARCHIVED,
   RETIRED]`: **ninguna salida hacia el ciclo editorial.**

Resultado: pausar un curso publicado, editarlo y querer volver a publicarlo
dejaba el curso en un estado del que solo se salía archivando o retirando. El
curso no se podía publicar **nunca más**. Y se llegaba ahí siguiendo las
instrucciones de la propia pantalla, que recomienda pausar para editar.

### El arreglo

`PAUSED` admite ahora `IN_REVIEW` y `DRAFT`. Enviar a revisión desde pausado
crea los cuatro gates de la versión actual con la lógica que ya existía; volver
a borrador permite seguir editando. La barra editorial ofrece las dos acciones,
y el panel de calidad explica en pausado por qué los gates están sin solicitar y
qué hacer, en vez de mostrar cuatro «No solicitada» junto a un botón de publicar
que falla.

**Sin migración, sin esquema nuevo, sin permisos nuevos, sin endpoints nuevos:**
`return-draft` y `submit-review` ya existían y siguen pidiendo
`training.course.review`. Dos aserciones nuevas en
`training-admin.service.spec.ts` fijan las dos salidas para que nadie las
vuelva a cerrar sin darse cuenta.

### Cómo salir de un curso ya encerrado

Para un curso que llegó a este estado antes del arreglo, la ruta es la misma una
vez desplegado: **Enviar a revisión → aprobar los cuatro gates → Publicar**. Sin
el arreglo, la única salida era duplicar el curso (`POST
courses/:courseId/duplicate`), que devuelve una copia en borrador.

16 pruebas en la suite del servicio, 695 en el frontend, `nest build` y
`next build` EXIT 0.

## 2.sexvicies Asignar un curso a personas (2026-09-11)

### El agujero del flujo

Publicar un curso **no lo pone en manos de nadie**. Hasta que se asigna, no
aparece en «Mis cursos» de ninguna persona. Y la asignación vivía aquí:

> Menú → **Cursos** → pestaña **Asignaciones** (la tercera de cinco) → botón
> «Asignar curso» → desplegable donde hay que **volver a elegir** el curso
> recién publicado.

Es decir, en una entrada del menú DISTINTA de «Gestionar cursos», que es donde
se crea y se publica. Nada en el asistente de publicación lo decía: terminaba
con un «Curso: Publicado» y ahí acababa. Quien no supiera de antemano que
«Cursos» y «Gestionar cursos» son cosas distintas —y la diferencia no está
escrita en ninguna parte— no tenía forma de encontrarlo.

### El arreglo: el botón donde está el curso

`AssignCourseDialog` sale de `training-learning-hub.tsx` a su propio archivo y
acepta un curso preseleccionado. Con eso:

- **En la lista de cursos**, cada curso publicado tiene **«Asignar»** como
  acción principal de su fila.
- **Al publicar**, el diálogo se abre solo, con el curso ya elegido. El paso
  siguiente deja de ser algo que haya que adivinar.
- En «Cursos → Asignaciones» sigue estando, ahora sin curso preseleccionado.

### El diálogo, reescrito para quien no es técnico

| Antes | Ahora |
|---|---|
| «Audiencia» en un desplegable: USERS · ROLES · BRANCHES · TENANT | **«¿Quién debe hacerlo?»** con las cuatro opciones a la vista y explicadas: «Personas concretas · Las eliges una a una» |
| Cajón de casillas de 224px **sin buscador** | Buscador por nombre o correo, lista de 12px por fila con el correo debajo, contador «N seleccionadas» y «Quitar todas» |
| Botón «Crear asignaciones» | **«Asignar a 3»** — dice lo que va a pasar antes de pulsar |
| Fechas con hora (`datetime-local`) | Fecha sola, con la regla escrita: «Si lo dejas vacío, desde hoy» / «sin vencimiento» |
| «3 asignaciones creadas» | «Asignado a 3 personas. 2 ya lo tenían.» — `skipped` venía en la respuesta y se descartaba, así que asignar dos veces parecía no hacer nada |
| Si no hay cursos publicados, desplegable vacío sin explicación | Aviso que dice por qué y dónde publicarlo |

Las fechas se envían a mediodía (`T12:00:00`) para que el huso horario no mueva
un vencimiento al día anterior.

De paso se retira `CoursePlayer` de `training-learning-hub.tsx`: 47 líneas de
código muerto desde que el reproductor se movió a `/training/learn/[courseId]`.

30 cadenas nuevas en el diccionario inglés. 695 pruebas, `next build` EXIT 0.

### Lo que queda propuesto y no ejecutado

**Los nombres del menú.** «Cursos» y «Gestionar cursos» no se distinguen por su
nombre, y son dos mundos: el primero es dónde se asigna y se cursa, el segundo
dónde se crea. Algo como «Mi aprendizaje» y «Catálogo de cursos» —o unificar
ambas— resolvería la confusión de raíz, pero toca navegación, permisos y rutas
de toda la sección.

**El asistente de siete pasos.** Para publicar un curso hay que recorrer
Información, Fundamento, Estructura, Evaluación, Certificación, Vista previa y
Revisión, y además aprobar cuatro gates de calidad. Es un proceso editorial
serio y está bien que exista para una empresa que lo necesite, pero para quien
solo quiere subir un video y asignarlo es desproporcionado. Un «modo simple»
—título, contenido, publicar— que deje el circuito completo como opción
avanzada es un cambio de producto, no de pantalla, y merece decidirse aparte.

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
