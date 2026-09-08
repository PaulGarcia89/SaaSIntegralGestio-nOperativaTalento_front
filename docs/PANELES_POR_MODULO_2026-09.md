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

- `onboarding` — `/onboarding/documents`
- Empresas y sucursales, suscripciones, roles y permisos

### Docker: no verificado desde esta sesión

El acceso a la máquina va por un shell aislado que solo monta la carpeta del
proyecto: no ve `/Applications`, no encuentra el binario `docker` y
`localhost` no responde. **La reconstrucción de imágenes y la comprobación
en localhost no se han ejecutado.** El script del repositorio
`reconstruir-local.command` hace lo correcto —`down --remove-orphans`
seguido de `up -d --build`, sin borrar volúmenes con nombre— y debe
ejecutarlo una persona en la máquina.

### Separar Personas de Productividad

`/employees` exige hoy el permiso `productivity.view`. Separarlo toca
permisos y migración en el backend; queda identificado y **sin tocar** a la
espera de confirmación explícita.

### Prueba de usabilidad

Sin realizar: requiere personas. El protocolo pedido —cinco usuarios, tres
tareas (evaluar un candidato, continuar un curso, recibir mercancía),
registrando éxito, errores, tiempo y peticiones de ayuda— queda como
entregable pendiente.

### Datos que el backend no agrega hoy

El encargo pide en Personas «perfiles incompletos» y «documentos pendientes o
próximos a vencer». El backend expone eso **por empleado**
(`/employees/:id/payroll-compliance`), no agregado. Mostrarlo aquí exigiría
contarlo sobre la página cargada y presentar un parcial como total, así que
queda anotado en lugar de inventado. Requiere un endpoint de resumen.

Lo mismo con «cambios recientes» del módulo de Personas: hay auditoría por
empleado, no un feed del módulo.

### Traducciones

Quedan ~2.900 cadenas en castellano dentro de `.tsx`. Las tres bibliotecas
compartidas (`lib/backend.ts`, `lib/operation-flow.ts`, `lib/ui-labels.ts`)
necesitan una decisión de API: devolver claves en lugar de texto.

### Docker

La reconstrucción de imágenes locales sigue pendiente a propósito, hasta que
los paneles restantes estén hechos. Cuando toque: reconstruir imágenes
locales, actualizar contenedores, **conservar base de datos y volúmenes**,
verificar front y back en localhost. Sin despliegues remotos ni `git push`.
