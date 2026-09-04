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

### Requisito previo: hace falta un entorno con datos

Las suites autenticadas **no pueden ejecutarse en local sin backend**. Conviene
saber por qué antes de intentarlo:

`playwright.config.ts` arranca un servidor de desarrollo con
`NEXT_PUBLIC_ENABLE_MOCK_BACKEND=true` apuntando a un puerto muerto (39999), con
la intención de que el backend simulado tome el relevo. **Ese camino ya no
funciona:** `src/lib/backend.ts:204` fija

```ts
const MOCK_BACKEND_ENABLED = false;
```

de forma deliberada —el comentario adjunto explica que producción nunca debe
renderizar entidades simuladas—, así que `shouldUseMockBackend()` devuelve
siempre `false` y la variable de entorno se ignora.

Aunque se reactivara, no bastaría para la línea base:

| Métrica | Valor |
|---|---|
| Funciones de API que expone el frontend | 610 |
| Funciones implementadas en `mock-backend.ts` | 66 |
| Puntos de `backend.ts` con recurso al simulador | 14 |

El simulador cubre autenticación, empleados, vacantes, usuarios, sucursales y
roles, pero **no** `fetchOperationalDashboard`, `fetchApplications`,
`fetchRecruitmentInterviews`, `fetchRestaurantDashboard` ni el flujo de
contratación. Las pantallas más importantes del catálogo capturarían su estado
de error, y una línea base de estados de error no protege nada.

Por eso `playwright.visual.config.ts` **exige `E2E_BASE_URL`** y falla de
inmediato con instrucciones, en lugar de gastar dos minutos arrancando un
servidor condenado.

### Qué se necesita

1. Un despliegue accesible con backend y datos (staging o local con Postgres).
2. `.env.e2e` con credenciales de los 6 roles.
3. Un tenant de pruebas con los módulos habilitados (ver «Omisiones legítimas»).

### Generar las referencias por primera vez

```bash
E2E_BASE_URL=https://staging.tu-dominio.com pnpm test:visual:update
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

### Omisión pendiente: inventario de restaurante

`RESTAURANT_INVENTORY` está **deshabilitado en todos los tenants sembrados**
salvo `datalink-tech-corp`, que es una cuenta personal y no debe usarse para
pruebas automatizadas. Por eso `/inventory/restaurant` se omite y quedan 36
capturas en lugar de 39.

Es la omisión más costosa del catálogo: es el módulo con más pantallas (37
rutas) y el que la auditoría señala como más crítico. Para incorporarlo, activa
la capacidad en el tenant de pruebas:

```sql
UPDATE "TenantInventoryCapability" c
SET enabled = true, "activatedAt" = now(), "deactivatedAt" = NULL, "updatedAt" = now()
FROM "Tenant" t
WHERE t.id = c."tenantId"
  AND t.slug = 'talentos-cloud-usa'
  AND c.code = 'RESTAURANT_INVENTORY';
```

```bash
docker exec talento-postgres psql -U talento -d saas_integral -f -   # con el SQL anterior
pnpm test:visual:update                                             # regenera 39 capturas
```

Para revertirlo, el mismo `UPDATE` con `enabled = false`.

---

## Puerta de calidad antes de cada merge

```bash
pnpm certify       # typecheck + lint + unit + build + audit de producción
pnpm test:visual   # línea base visual
```

### Línea base medida el 2026-09-04

Entorno: stack local `docker-compose.self-hosted.yml` en `http://localhost`,
datos sembrados, 6 cuentas reales.

| Comprobación | Resultado |
|---|---|
| `pnpm typecheck` | ✅ sin errores |
| `pnpm lint` | ✅ 0 errores · ⚠️ 36 avisos (todos `no-unused-vars`) |
| `pnpm test` (vitest) | ✅ 27 archivos · 124 pruebas |
| `pnpm test:visual` | ✅ 39 capturas · estable en pasadas consecutivas |
| `pnpm test:a11y:internal` | ❌ 44 fallos · 20 pasan · 3 omitidas → **13 fallos · 54 pasan** tras la fase 1 |

Los 36 avisos de lint son componentes definidos y nunca usados —código muerto
en los workspaces de restaurante, formación e inventario—. Se eliminan en la
fase 3 del plan; se documentan aquí para que la cifra no se confunda después
con una regresión.

#### Accesibilidad: punto de partida real

**Punto de partida (antes de la fase 1): las 21 pantallas auditables incumplían
WCAG 2.2 AA en ambos temas. Ninguna pasaba.**

| Regla axe | Impacto | Pantallas afectadas (de 42 ejecuciones) |
|---|---|---|
| `color-contrast` | serious | **42** — todas |
| `link-name` | serious | **42** — todas |
| `button-name` | **critical** | 8 → `/ats/analytics`, `/ats/interviews`, `/onboarding/documents`, `/admin/users` |
| `label` | **critical** | 4 → `/ats/analytics`, `/ats/candidates` |
| `scrollable-region-focusable` | serious | 2 |

Que `color-contrast` y `link-name` fallen en **todas** las pantallas confirma el
diagnóstico de `UX_UI_AUDIT.md`: no son defectos de pantalla, son defectos de
las primitivas compartidas. Se corrigen una vez en `components/ds/`, no 21
veces.

#### Responsive: dos desbordamientos reales

| Pantalla | Desbordamiento |
|---|---|
| `/training` | **253 px a 320 px** |
| `/ats/analytics` | 18 px a 320 px |

Las otras 19 pantallas se adaptan correctamente de 320 a 1280 px.

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

---

## Resultado de la fase 1 (tokens y primitivas)

Medido el 2026-09-04 contra el mismo entorno.

| Regla axe | Antes | Después | Cambio |
|---|---|---|---|
| `link-name` | 42 | **0** | eliminada |
| `color-contrast` | 42 | **2** | −95 % |
| `button-name` (crítico) | 8 | 8 | pendiente |
| `label` (crítico) | 4 | 4 | pendiente |
| `scrollable-region-focusable` | 2 | 2 | pendiente |
| **Total de pruebas** | 44 fallan · 20 pasan | **13 fallan · 54 pasan** | |

### Qué lo consiguió

1. **`breadcrumb.tsx`** — el enlace de inicio contenía solo un icono, sin nombre
   accesible. Un componente compartido causaba las 42 violaciones de
   `link-name`.
2. **`tenant-branding.ts`** — se separó el color de marca de **relleno** del de
   **texto**. El acento del tenant se inyectaba en `--primary` y se usaba como
   color de texto sin validar contraste: con `#2563EB` daba 2,82:1 sobre la
   barra lateral y 3,14:1 sobre el fondo oscuro. Ahora `textOnLight`,
   `textOnDark` y `textOnSidebar` se ajustan hasta cumplir el umbral, con 45
   pruebas unitarias sobre 8 marcas incluidos casos degenerados.
3. **`--destructive`** — de `0 84% 60%` a `0 72% 45%`. El texto blanco encima
   pasó de 3,78:1 a 5,83:1, lo que corrige a la vez el badge de notificaciones
   y todos los botones destructivos.
4. **`--muted-foreground`** — margen suficiente para superficies teñidas.

### Lo que queda (fase 3)

Las 13 pruebas que siguen fallando ya no son sistémicas; son componentes
concretos:

| Problema | Dónde | Causa |
|---|---|---|
| `button-name` ×8 | `/ats/analytics`, `/ats/interviews`, `/onboarding/documents`, `/admin/users` | `SelectTrigger` de Radix sin nombre accesible cuando no hay `<label>` asociado |
| `label` ×4 | `/ats/analytics`, `/ats/candidates` | `input[type=file]` y `input[type=date]` sin etiqueta |
| `color-contrast` ×2 | `/notifications`, `/ats/analytics` | pendiente de localizar el nodo exacto |
| `scrollable-region-focusable` ×2 | — | contenedor con desplazamiento sin `tabindex` |
| Desbordamiento ×2 | `/training` (253 px), `/ats/analytics` (18 px) | responsive |
