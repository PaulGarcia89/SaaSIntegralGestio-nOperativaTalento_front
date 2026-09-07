# Sistema visual «Grafito y ámbar»

Documentación breve del sistema de diseño de TalentOS. Rediseño del 2026-09-06.

---

## 1. El concepto en una frase

**Instrumento de precisión, no panel de administración.** La jerarquía la
construyen las capas de superficie y las líneas de 1 px, no las sombras difusas
ni los degradados. El ámbar es el único color cromático del sistema.

### Los tres papeles del ámbar

El ámbar no decora. Aparece exactamente en tres sitios y en ningún otro:

1. **La acción recomendada** — el filo izquierdo de `NextAction`, el relleno del
   botón primario en tema oscuro.
2. **El foco** — el anillo de 2 px de cualquier elemento enfocable.
3. **La serie principal de un gráfico** — `--series-1`.

Si aparece en un cuarto sitio, el sistema ha empezado a diluirse.

### Lo que el sistema NO hace

- No usa púrpura sobre blanco. El avatar tenía un degradado violeta-índigo; se
  retiró.
- No mete cada bloque en una tarjeta. `PageSection` no lleva caja por defecto:
  la jerarquía la da el titular.
- No comunica ningún estado solo con color. Todo estado lleva icono **y**
  palabra.
- No usa sombras difusas para simular profundidad. En tema oscuro, la
  profundidad la da una luz superior de 1 px, que es lo que hace que una
  tarjeta parezca una placa y no un recorte.

---

## 2. Tokens

Todos viven en `src/app/globals.css`. **Ningún componente escribe un color, un
espacio, un radio, una sombra, un z-index ni una duración literal.**

### Color

Cada par texto/superficie está verificado contra WCAG 2.2 AA: 4,5:1 para texto
normal y 3:1 para bordes de control y foco, **incluidos los chips teñidos al
10 %** sobre las cuatro superficies. Los valores se validaron como enteros HSL,
que es exactamente lo que acaba en el CSS: validar el valor fraccionario y
redondear después es como una versión anterior dejó pasar un 4,47:1.

| Grupo | Tokens | Para qué |
|---|---|---|
| Superficies | `canvas` `surface-1` `surface-2` `surface-3` | Las cuatro capas. La elevación es un cambio de capa, no una sombra |
| Tinta | `ink-1` `ink-2` `ink-3` `ink-disabled` | Texto principal, secundario, terciario e inactivo |
| Líneas | `line` `line-strong` `line-control` | Decorativa, de énfasis y **de control** |
| Acción | `action` `on-action` | El botón primario |
| Acento | `accent-ink` `accent-line` `accent-fill` `on-accent-fill` | Los tres papeles del ámbar |
| Estado | `status-info` `status-success` `status-warning` `status-danger` | Semántica, nunca paleta categórica |
| Series | `series-1` … `series-5` `grid` | Gráficos |

**Dos reglas de color que no se pueden romper:**

1. **El ámbar claro (`accent-fill`) nunca hace de borde sobre fondo claro.** Da
   1,91:1. Para eso existe `accent-line`, que es el ámbar oscurecido.
2. **El borde de un control es `line-control`, no `line`.** WCAG 1.4.11 exige
   3:1 para el límite visual de un control; la línea decorativa de una tarjeta
   no llega, y era la que se usaba en los campos.

Si se cambia un valor, hay que revalidar el par. El script de validación
recorre todos los pares y los chips teñidos.

### Densidad

`[data-density]` reescala espaciado, tipografía y alturas de control. **Ningún
componente conoce la densidad**: solo lee los tokens.

| | Cómoda (por defecto) | Compacta |
|---|---|---|
| Cuerpo | 17 px | 15 px |
| Objetivo táctil móvil | 56 px | 44 px |
| Alto de fila | 56 px | 40 px |

En ninguna de las dos el objetivo táctil en móvil baja de 44 px, que es el
mínimo de WCAG 2.5.8. La densidad cómoda conserva la escala accesible acordada
el 04-09, para que el producto siga siendo usable por alguien sin experiencia
informática.

### Tipografía

**Geist** y **Geist Mono**, variables, autoalojadas bajo SIL OFL 1.1
(`public/fonts/OFL.txt`). Se sirven desde el propio dominio: sin petición a un
tercero no hay salto de maqueta, no se filtra la IP del usuario y el build no
depende de la red.

- `geistSans` es display **y** cuerpo. La diferencia entre titular y párrafo la
  marcan el peso, el tamaño y el interletraje, no dos familias: en una interfaz
  operativa, dos familias compiten.
- `geistMono` es para **cifras** y códigos. Ahí el ancho fijo evita que un
  número salte al pasar de 199 a 200.
- Sans 69,7 KB con `preload`; Mono 71,6 KB sin `preload`, porque solo aparece
  en cifras sueltas por encima del pliegue.

`next/font` exige **literales**: las listas de reserva van escritas dentro de
la llamada. Extraerlas a una constante rompe el build.

### Espaciado, radios, elevación, z-index y movimiento

- **Espaciado**: ritmo de 4 px, `--space-1` a `--space-10`, reescalado por
  densidad.
- **Radios**: `--r-xs` a `--r-3xl`. El botón pasó de píldora a `rounded-md`;
  una píldora en cada botón es la silueta más reconocible de plantilla.
- **Elevación**: `--elev-1` a `--elev-4`. Solo e1 y e2 en contenido; e3 y e4
  para lo que flota (menús, hojas, diálogos).
- **Z-index**: una escala **nombrada** — `--z-sticky`, `--z-mobile-nav`,
  `--z-action-bar`, `--z-overlay`, `--z-drawer`, `--z-modal`, `--z-popover`,
  `--z-toast`, `--z-tooltip`, `--z-skip-link`. Antes convivían `z-30`, `z-40`,
  `z-[99999]` y `z-[999999]` decididos pantalla a pantalla.
- **Movimiento**: `--dur-instant` 80 ms · `--dur-exit` 120 ms · `--dur-fast`
  140 ms · `--dur-base` 200 ms · `--dur-slow` 320 ms. **La salida siempre es
  más rápida que la entrada**: al volver atrás, la interfaz tiene que sentirse
  instantánea. Sin rebote: sobre datos operativos, el sobreimpulso se lee como
  descuido.

---

## 3. Navegación

Dos ejes que ahora conviven:

- **Sección** responde a «¿a qué vengo?» — operación diaria, supervisión,
  reportes, administración, gobierno de plataforma.
- **Grupo** sigue respondiendo a «¿de qué área es?».

La barra lateral muestra secciones; dentro de cada sección agrupa por área, y
solo la sección activa aparece abierta.

La sección se **deriva** (`sectionForNavItem`), no se declara ítem a ítem: 90
campos escritos a mano son 90 oportunidades de equivocarse. Las excepciones
están enumeradas y probadas.

**Lo que separa supervisión de reportes:** una pantalla de supervisión existe
porque algo puede estar mal y alguien tiene que actuar — un vencimiento, un
descuadre, una merma, una alerta. Una de reportes existe para responder una
pregunta. Mezclarlas es lo que hacía que las alertas de vencimiento se
perdieran entre los comparativos de margen.

Se **añadió un campo**: no cambió ninguna ruta, permiso, módulo ni rol.

---

## 4. Componentes

`@/components/system` es el punto de entrada único.

| Componente | Para qué |
|---|---|
| `PageHeader` | El **único** `h1` de la pantalla |
| `ActionBar` / `MobileActionBar` | Acciones de página; la móvil se apila sobre la navegación |
| `PageSection` | Bloque con título accesible. Sin caja por defecto |
| `NextAction` | La **única** acción recomendada. Recibe una, no una lista |
| `Metric` / `MetricRow` | Cifra con rótulo, separada por línea y no por tarjeta |
| `StatusBadge` | Icono + palabra. Nunca solo color |
| `BlockerList` | Causa, responsable y solución. Las tres, siempre |
| `WarningList` | Avisos que no bloquean, distintos de los bloqueos |
| `EmptyState` | Distingue «no hay registros» de «no hay resultados con estos filtros» |
| `ErrorState` | Muestra el mensaje real del servidor y la referencia de soporte |
| `BlockedState` | Aquí no hay nada que reintentar: hay a quién pedírselo |
| `SkeletonRows` | Silueta con la forma y la altura de lo que va a llegar |
| `DataView` | Tabla en escritorio, **fichas** en móvil. Dos composiciones, no una encogida |
| `FilterBar` | En móvil los filtros se pliegan tras un botón que dice cuántos hay activos |
| `Pagination` | |
| `OperationStepper` `ImpactReview` `ConfirmPanel` `OperationResultView` | El patrón universal |
| `Timeline` | |

### `DataView`: qué hace distinto

Una tabla de ocho columnas dentro de un `overflow-x-auto` no es responsive: es
una tabla que en un teléfono hay que arrastrar a ciegas. Cada columna declara
su **prioridad**:

- `identity` — es el título de la ficha en móvil
- `primary` — estado o cifra clave, se ve siempre
- `secondary` — contexto, en el cuerpo de la ficha
- `detail` — solo en la tabla de escritorio

---

## 5. El patrón universal de operaciones

**Seleccionar → Registrar → Revisar impacto → Confirmar → Ver resultado.**

Las reglas viven en `src/lib/operation-flow.ts`, que es puro y está probado.
Los componentes solo pintan; ninguno decide por su cuenta si se puede
confirmar: se lo pregunta a `canConfirm`.

### Antes de confirmar se muestra siempre

- Estado actual y resultado esperado, en la misma fila
- Cuántos registros se ven afectados, aunque sea uno
- Impacto económico, si aplica
- Avisos (no bloquean) y bloqueos (sí bloquean), pintados distinto
- Quién queda como responsable en la auditoría
- **Si la acción es irreversible**, con todas las letras y exigiendo una
  casilla explícita

### Reglas del flujo

- `review` no se alcanza sin el impacto calculado. Es el paso que existe para
  que nadie confirme a ciegas.
- `confirm` no se alcanza con bloqueos.
- **Desde `result` no se vuelve.** La operación ya se registró; ofrecer «Atrás»
  invitaría a repetirla.
- Un bloqueo lleva **causa, responsable y solución**. Si quien construye la
  pantalla no sabe responder las tres, es que todavía no entiende el bloqueo lo
  bastante como para mostrarlo. `normalizeBlocker` prefiere declarar «no se
  indicó un responsable» a inventarse uno: lo primero es una carencia visible
  que alguien acabará corrigiendo, lo segundo manda al usuario a la persona
  equivocada.

Aplicado en `src/lib/hiring-operation.ts` para la confirmación de contratación,
donde `irreversible` es siempre cierto: confirmar crea el expediente del
empleado y el producto no ofrece deshacerlo.

---

## 6. Gráficos

Motor propio en `@/components/chart`, sin dependencias. La matemática está en
`scales.ts` y los componentes solo pintan.

Tipos: línea/área, barras (agrupadas y apiladas), embudo, bullet contra
objetivo y sparkline.

### Reglas que no son opcionales

1. **Nunca se distingue una serie solo por color.** Cada una lleva además un
   patrón de trazo distinto y una etiqueta directa. La leyenda muestra el
   patrón real, no un cuadrado de color.
2. **Resumen textual en el DOM**, generado a partir de los datos: qué muestra,
   el rango, el valor inicial y final, y la variación.
3. **Tabla de datos de respaldo** en un `<details>`. El dibujo es una vía de
   lectura, no la única.
4. **Teclado**: los puntos son enfocables y muestran el mismo detalle que el
   ratón. Nada informativo depende de `:hover`.
5. **Estado sin datos** que explica *por qué* no hay datos, distinguiendo
   «todavía no hay registros» de «no hay resultados con estos filtros». Nunca
   se dibujan ejes vacíos.
6. La línea es **recta, sin curvas de Bézier**: en datos operativos, una curva
   suave inventa valores entre puntos que no existen.

---

## 7. iPhone

- `viewportFit: "cover"` en `layout.tsx`. Sin él, `env(safe-area-inset-*)` vale
  cero y las barras inferiores fijas quedan bajo el indicador de inicio.
- **Sin `maximumScale`**: bloquear el zoom rompe WCAG 1.4.4. El zoom automático
  de Safari al enfocar un campo se evita por la vía correcta, que es no bajar
  de 16 px en los controles nativos.
- `--mobile-nav-space` lo define el armazón y lo consume `MobileActionBar` para
  apilarse **encima** de la navegación inferior. Vive ahí y no en `globals.css`
  porque solo es cierta mientras esa navegación está en el árbol.
- Toda barra fija emite un espaciador en el flujo normal. Sin él, el último
  elemento de la lista queda debajo y es inalcanzable: el desplazamiento ya
  llegó al final.

---

## 8. Accesibilidad

- Foco: un anillo de 2 px con 2 px de separación y 3:1 contra la superficie,
  declarado **una sola vez** en `globals.css`. Los componentes ya no declaran
  el suyo.
- `prefers-reduced-motion`: sin animación de entrada, sin barrido en las
  siluetas de carga.
- El resumen de errores de formulario es enfocable, lleva `role="alert"` y cada
  entrada enlaza a su campo; los errores en línea se conservan.
- Ningún estado depende solo del color.
- Los gráficos entregan resumen textual y tabla de respaldo.

---

## 9. Migración

Los nombres de token antiguos (`--background`, `--card`, `--muted-foreground`,
`--surface-*`, `--text-*`, `--status-*`) **se conservan** y apuntan a la paleta
nueva. Por eso las ~300 pantallas existentes adoptaron la dirección visual sin
editarlas una por una, y la migración al vocabulario nuevo puede ser gradual.

| De | A |
|---|---|
| `components/ui.tsx` → `ModuleHeader` | `PageHeader` + `MetricRow` |
| `components/ui.tsx` → `MetricCard` | `Metric` |
| `components/ui.tsx` → `DataTable` | `DataView` |
| `design-system.tsx` → `InlineFeedback` | `InlineNote` |
| `design-system.tsx` → `Wizard` | `OperationStepper` |
| `design-system.tsx` → `ResponsiveDataView` | `DataView` |
| `design-system.tsx` → `Pagination` (con `totalPages`) | `Pagination` (deriva las páginas del total) |
| `components/async-state.tsx` → `AsyncState state="loading"` | `SkeletonRows` / `SkeletonBlock` |
| `components/async-state.tsx` → `AsyncState state="error"` | `ErrorState` |
| `simple/simple-ui.tsx` → `PhaseChip` | `StatusBadge` |

Los módulos anteriores siguen existiendo y funcionando; lo que cambia es a
dónde apuntan las pantallas nuevas.

### Vocabulario: nunca volcar un enumerado del backend

Un estado del servidor —`PUBLISHED`, `HEALTHY`, `DELIVERED`, `BEGINNER`— no es
texto de interfaz. Cada módulo tiene su diccionario, con pruebas:

| Módulo | Archivo |
|---|---|
| Inventario de restaurante | `components/restaurant-inventory-ui.tsx` |
| Capacitación | `lib/training-labels.ts` |

Tres reglas, iguales en los dos:

1. El **rótulo** sale del diccionario; si el código no está, se humaniza
   (`ESTADO_NUEVO` → «Estado nuevo»), nunca se pinta en mayúsculas ni se deja
   vacío.
2. El **tono** lo decide el significado, no la marca del tenant. «Aprobado»
   pintado con el color corporativo se lee como un problema en una empresa de
   marca roja.
3. Un estado **desconocido** es neutro, jamás rojo: un despliegue del backend
   no puede convertirse en una alarma falsa para toda la operación.

El tono siempre viaja acompañado de la palabra (`StatusBadge` lleva icono y
texto): el color solo no informa a quien no lo distingue.

---

## 10. Branding por tenant

Sigue funcionando y no se recortó. Lo que cambió:

- El **botón primario** usa `--action`, del sistema, y no `--primary`, del
  tenant. El contraste del botón dependía de una decisión del cliente; con una
  marca clara, el texto encima bajaba de AA.
- El tenant ya **no** repinta `--ring` ni `--accent`. El foco es del sistema y
  su valor está validado; `--accent` recibía un color al 93 % de luminosidad
  que en tema oscuro dejaba el hover casi blanco — un defecto real, no una
  decisión.
- La marca sigue viva en los distintivos, los chips, el texto de marca y la
  marca de la barra lateral.

**Acoplamiento a vigilar:** `lib/tenant-branding.ts` valida el color de marca
contra tres superficies **copiadas** de `globals.css`, y su test repite esas
constantes. Si cambian `--canvas`, su variante oscura o `--sidebar`, hay que
actualizar los dos archivos o las garantías de contraste dejan de ser ciertas.
