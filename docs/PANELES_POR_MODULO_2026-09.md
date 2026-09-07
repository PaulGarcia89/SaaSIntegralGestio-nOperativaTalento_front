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

---

## 3. Componentes nuevos del sistema

| Componente | Para qué |
|---|---|
| `StatusTile` / `StatusTileRow` | La tarjeta con la que abre cada panel. Distingue cargando / sin dato / cifra. Admite `href` o `onAction`. |
| `ActiveContext` | Empresa y sucursal sobre las que hablan las cifras, con rótulos para lector de pantalla. |
| `EntityCard` / `EntityCardList` | Ficha de persona u objeto: hasta tres datos, progreso y próximo paso. |

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

**Nada se ha verificado en un iPhone físico.** Todo es Chromium emulando esos
anchos.

---

## 5. Trabajo pendiente

### Paneles que faltan

- `onboarding` — `/onboarding/documents`
- `training` — `/training`, separando la experiencia del empleado de la
  administrativa
- `asset_inventory` — `/inventory/assets`
- `restaurant_inventory` — `/inventory/restaurant`, que debe pasar a ser el
  panel (hoy vive en `/inventory/restaurant/dashboard`)
- `productivity` — `/productivity`
- Empresas y sucursales, suscripciones

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
