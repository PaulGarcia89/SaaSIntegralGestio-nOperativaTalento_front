# Red de seguridad UX — Fase 0

Infraestructura de verificación que debe estar en verde **antes** de empezar el
rediseño descrito en `UX_UI_AUDIT.md`. Su función es que cualquier cambio de
tokens, primitivas o navegación sea evaluable en vez de opinable.

---

## Qué cubre

| Suite | Qué protege | Comando |
|---|---|---|
| Accesibilidad autenticada | 22 pantallas × tema claro y oscuro, con axe-core (WCAG 2.2 AA) | `pnpm test:a11y:internal` |
| Adaptación horizontal | Las mismas 22 pantallas de 320 a 1280 px | incluida en el comando anterior |
| Línea base visual | 13 pantallas: composición, jerarquía, radios, sombras, color, espaciado | `pnpm test:visual` |
| Accesibilidad pública | Landing, login y portales de empleo | `pnpm test:a11y` |
| Contratos de rol | Cada rol ve solo lo autorizado | `pnpm test:e2e:roles` |
| Unidad | 124 pruebas de lógica de dominio | `pnpm test` |

**Antes de esta fase:** 6 rutas, solo tema claro, sin línea base visual.
**Después:** 22 rutas en ambos temas, más 39 capturas de referencia.

---

## Configuración

1. Copia la plantilla y rellena las credenciales:

   ```bash
   cp .env.e2e.example .env.e2e
   ```

2. Se necesitan credenciales de **6 roles** para cubrir el catálogo completo:
   `TENANT_ADMIN`, `HR_MANAGER`, `RECRUITER`, `INSTRUCTOR`, `INVENTORY_MANAGER`
   y `BRANCH_USER`.

   Cada pantalla se audita con el rol que realmente tiene acceso a ella según
   `src/lib/navigation.ts`. Sin esto, la mitad del catálogo mediría la pantalla
   de acceso denegado en lugar de la pantalla real.

3. Sin credenciales, las pruebas **se omiten con motivo explícito**; no fallan
   en silencio. Además, la primera prueba de la suite de accesibilidad enumera
   qué variables faltan.

---

## El catálogo de superficies

`tests/support/e2e-surfaces.ts` es la **fuente de verdad compartida**. Añadir
una pantalla ahí la incorpora automáticamente a la auditoría de accesibilidad,
al barrido de anchos y —si se marca `visual: true`— a la línea base visual.

No dupliques listas de rutas en las specs.

---

## Cómo se controla el tema en las pruebas

El tema **no** se deriva de `prefers-color-scheme`. `ThemeToggle` lee la
preferencia `ui-theme` desde `GET /auth/preferences` y aplica la clase `.dark`
sobre `<html>`.

Por eso:

- `page.emulateMedia({ colorScheme })` **no funciona**.
- Pulsar el botón de tema **tampoco sirve**: persistiría la preferencia con
  `PUT /auth/preferences/ui-theme` y el tema se filtraría a las demás pruebas
  que comparten la misma cuenta.

`forceTheme()` (`tests/support/e2e-theme.ts`) intercepta el endpoint: responde
el GET con el tema pedido y absorbe el PUT sin llegar al backend. Efecto
secundario deseable: `DomainTable` lee de ahí sus preferencias `table:*`, así
que todas las tablas se renderizan con columnas y orden por defecto.

`assertThemeApplied()` verifica que la clase quedó aplicada. Sin esa aserción,
una prueba de "modo oscuro" podría estar midiendo la paleta clara y pasar.

> **Por qué importa el tema oscuro:** `--primary` no se redefine en `.dark`, así
> que `text-primary` (229 usos) queda en ~3,76:1 sobre fondo oscuro y falla AA.
> Ese fallo solo es detectable auditando en oscuro. Es el hallazgo P0-1 de
> `UX_UI_AUDIT.md`.

---

## Línea base visual

### Generar las referencias por primera vez

```bash
pnpm test:visual:update
```

Revisa las 39 imágenes generadas en `tests/visual/__screenshots__/` **antes de
confirmarlas**. Son la definición de "correcto" para todo el rediseño.

### Verificar

```bash
pnpm test:visual
pnpm test:visual:report   # informe HTML con los diffs
```

### Qué protege y qué no

**Protege:** composición, jerarquía, radios, sombras, color, espaciado.
**No protege:** los datos.

Las cifras y fechas cambian con el entorno. Por eso:

- El reloj se congela en `2026-01-15T09:00:00Z` (`page.clock.setFixedTime`), de
  modo que las horas relativas ("Hace 3 min") y absolutas ("Actualizado: 14:32")
  son deterministas.
- El contador de notificaciones sin leer se enmascara.
- Se admite `maxDiffPixelRatio: 0.02`.
- Animaciones, transiciones, desplazamiento suave y cursor se neutralizan.

### Durante el rediseño

Las fases 1 a 7 **cambiarán estas capturas a propósito**. El flujo correcto es:

1. Aplicar el cambio.
2. `pnpm test:visual` → falla y muestra los diffs.
3. Revisar cada diff y confirmar que la diferencia es la buscada.
4. `pnpm test:visual:update` y confirmar las nuevas referencias en el mismo PR
   que el cambio.

Una captura que cambia **sin que nadie lo esperara** es exactamente lo que esta
suite existe para detectar. Ejemplo real: unificar el radio de `Input` a 12 px
(quick win QW-2) debe alterar los formularios, no las tablas. Si altera las
tablas, hay un efecto colateral que revisar.

---

## Omisiones legítimas

Una prueba se omite, sin fallar, cuando:

| Motivo | Mensaje |
|---|---|
| Faltan credenciales del rol | `Define E2E_<ROL>_EMAIL y E2E_<ROL>_PASSWORD…` |
| El entorno no habilita el módulo para ese rol | `El entorno de datos no habilita <ruta>… No es un fallo de accesibilidad.` |
| Barrido de anchos fuera de chromium | `El barrido de anchos se ejecuta una sola vez…` |
| Línea base móvil en oscuro | `La linea base movil se mantiene solo en tema claro.` |

Las omisiones por módulo deshabilitado dependen del plan y de los módulos
activos del tenant de pruebas. Si quieres cobertura completa, el tenant de
pruebas debe tener habilitados `ats`, `onboarding`, `training`,
`asset_inventory`, `restaurant_inventory`, `productivity` y `admin`.

---

## Puerta de calidad antes de cada merge

```bash
pnpm certify       # typecheck + lint + unit + build + audit de producción
pnpm test:visual   # línea base visual
```

### Línea base medida el 2026-09-03

| Comprobación | Resultado |
|---|---|
| `pnpm typecheck` | ✅ sin errores |
| `pnpm lint` | ✅ 0 errores · ⚠️ 36 avisos (todos `no-unused-vars`) |
| `pnpm test` (vitest) | ✅ 27 archivos · 124 pruebas |

Los 36 avisos son componentes definidos y nunca usados —código muerto en los
workspaces de restaurante, formación e inventario—. Se eliminan en la fase 3
del plan; se dejan documentados aquí para que la cifra no se confunda con una
regresión introducida después.

---

## Archivos de esta fase

```
tests/support/e2e-auth.ts          credenciales por rol, acceso y detección de acceso denegado
tests/support/e2e-theme.ts         forzado determinista de tema e idioma
tests/support/e2e-surfaces.ts      catálogo único de 22 superficies (13 con línea base visual)
tests/support/e2e-stabilize.ts     congelación de movimiento, espera de estabilidad y máscaras
tests/e2e/authenticated-accessibility.spec.ts   auditoría axe + barrido de anchos
tests/visual/visual-baseline.spec.ts            línea base visual
playwright.visual.config.ts        configuración aparte de la suite E2E
```
