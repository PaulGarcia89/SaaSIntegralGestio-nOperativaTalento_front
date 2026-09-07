# Rediseño visual · inventario, plan y cobertura

Estado: **en curso**. Este documento es la lista de cobertura del encargo
«modo visual como experiencia principal». Se actualiza a medida que avanza.

---

## 1. Inventario (medido, no estimado)

`python3 scripts/audit-visual.py` recorre cada `page.tsx` y su árbol de
componentes. Estado al empezar, sobre **108 pantallas**:

| señal | pantallas |
|---|---|
| `DataView` (tabla en escritorio, fichas en móvil) | 26 |
| tabla cruda sin `DataView` | 63 |
| `PageHeader` | 72 |
| `NextAction` (acción recomendada única) | 6 |
| `Metric` | 40 |
| `StatusBadge` | 89 |
| `EmptyState` | 89 |
| esqueleto de carga | 89 |
| algún gráfico | 1 |

### Lo que dice el inventario

1. **Los estados ya están resueltos.** Carga, vacío y error existen en 89 de
   108 pantallas y salen del sistema. No es ahí donde está el problema.
2. **La tarjeta no es todavía la experiencia principal.** Hay 26 pantallas con
   `DataView` y 63 con tablas propias. `DataView` ya produce fichas por debajo
   de `md`: falta adoptarlo, no construirlo.
3. **Los gráficos existen y no se usan.** `@/components/chart` es un motor SVG
   propio —líneas, barras, embudo, bala, minigráfico— con resumen en prosa y
   tabla de datos incluidos. Lo usa **una** pantalla. Aplicarlo a reclutamiento,
   incorporación, formación e inventario es sobre todo trabajo de conexión.
4. **Falta la ficha de entidad.** Las fichas de `DataView` son filas
   etiqueta/valor. Lo que el encargo pide —persona con iniciales, estado con
   icono y palabra, avance, próximo paso— no existía como componente.
5. **La acción recomendada casi no se usa.** `NextAction` está en 6 pantallas.

---

## 2. Decisiones del sistema visual

Se conserva «Grafito y ámbar» (`docs/SISTEMA_VISUAL.md`). Lo que se añade:

- **`EntityCard`** responde siempre a cuatro preguntas en el mismo orden:
  quién o qué es · en qué estado está · qué se sabe · qué sigue.
- **El estado nunca es solo color ni solo cifra.** «35 %» no dice si algo va
  tarde. El distintivo lleva icono y palabra, y el porcentaje va aparte.
- **Todo avance se dice con palabras además de dibujarse**: barra, cifra y
  detalle («5 de 12 tareas»). Una barra sin número obliga a estimar y no existe
  para un lector de pantalla.
- **Máximo tres datos por tarjeta.** Más que eso vuelve a ser una tabla.
- **La tarjeta entera es pulsable** por enlace extendido sobre el título, no
  envolviendo todo en un botón: el destino conserva nombre accesible y las
  acciones secundarias siguen siendo pulsables. Verificado por hit-test.
- **Nada depende de `hover`.**
- **Sin datos inventados.** Si el contrato no da una serie temporal, no se
  dibuja una tendencia: se muestra lo que sí se sabe o un estado vacío honesto.

---

## 3. Componentes compartidos

| Componente | Estado | Para qué |
|---|---|---|
| `EntityCard` | **nuevo** | Ficha de persona, documento, tarea, vacante, curso o recurso |
| `EntityCardList` | **nuevo** | Rejilla de fichas; una columna en móvil |
| `Avatar` + `initialsOf` | **nuevo** | Iniciales o foto; monocromo, para no competir con el estado |
| `ProgressMeter` | **nuevo** | Barra con rótulo, cifra y detalle |
| `DataView` | existente | Tabla en escritorio, fichas en móvil |
| `@/components/chart` | existente | Líneas, barras, embudo, bala, minigráfico |
| `PageHeader` `NextAction` `Metric` `StatusBadge` | existentes | |

---

## 4. Cobertura por módulo

Leyenda: ✔ hecho · ~ parcial · ✘ pendiente

| Módulo | Fichas | Gráfico | Acción recomendada | Verificado en móvil |
|---|---|---|---|---|
| Incorporación · documentos | ✔ | ✘ | ~ | ✔ |
| Inicio (dashboard) | ~ | ✔ | ✔ | ✔ |
| Empleados · directorio | ✔ `DataView` | ✘ | ✘ | ✔ |
| Reclutamiento · vacantes | ~ | ✘ embudo pendiente | ✘ | ✘ |
| Reclutamiento · candidatos y etapas | ~ | ✘ | ✘ | ✘ |
| Contratación | ✘ | ✘ | ✘ | ✘ |
| Documentos y firmas | ✘ | ✘ | ✘ | ✘ |
| Formación | ✘ | ✘ | ✘ | ✘ |
| Inventario de activos | ✘ | ✘ | ✘ | ✘ |
| Inventario de restaurante | ✘ | ✘ | ✘ | ✘ |
| Productividad y reportes | ✘ | ✘ | ✘ | ✘ |
| Administración | ~ | ✘ | ✘ | ✘ |

---

## 5. Verificación

Cada pantalla se comprueba a **375, 390 (iPhone 12), 428, 768 y 1440 px**:

- sin desplazamiento horizontal general;
- destino táctil efectivo ≥ 44 × 44 px, medido por hit-test y no por el
  recuadro del elemento —un enlace extendido tiene 23 px de alto y un destino
  de 358 × 294—;
- contraste con `scripts/audit-contrast.py`, que mide sobre píxeles;
- `scripts/audit-responsive.py` para desbordamiento;
- typecheck, ESLint, pruebas y build de las 92 páginas.

**Emulado, no en dispositivo real.** Todo lo anterior es Chromium con viewport
emulado. Safari de iOS no se ha probado en un iPhone físico; las diferencias
conocidas —zoom al enfocar campos menores de 16 px, áreas seguras— están
cubiertas por reglas del sistema, pero no verificadas en el dispositivo.
