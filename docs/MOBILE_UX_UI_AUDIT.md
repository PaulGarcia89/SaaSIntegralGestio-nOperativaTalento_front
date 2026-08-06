# Auditoría UX/UI Mobile-First

**Fecha:** 2026-08-06  
**Alcance:** `frontend-app`, rutas públicas, autenticación, área protegida y componentes compartidos.  
**Método:** revisión estática de rutas, componentes, estilos globales y suite Playwright. Esta auditoría no modifica código funcional.

## Resumen ejecutivo

La base móvil es buena y ya evita varios problemas que normalmente bloquean una aplicación operativa: tema claro predeterminado, ancho mínimo de 320 px, supresión de desbordamiento horizontal global, texto alineado al inicio, controles de 16 px y navegación inferior con áreas táctiles de al menos 48 px. El ATS también tiene dos patrones correctos y reutilizables: el pipeline se apila por etapa en móvil y la lista de candidatos usa tarjetas bajo el breakpoint `md`.

El riesgo principal no es el marco global, sino la inconsistencia entre módulos. Existen tablas nativas, formularios de alta densidad y diálogos complejos que aún dependen de un diseño de escritorio o de desplazamiento horizontal. La navegación inferior no se deriva completamente de las rutas autorizadas del rol, lo que degrada la experiencia de usuarios que no operan ATS. La suite E2E solo ejecuta Chromium de escritorio, por lo que no protege contra regresiones de 320-480 px, foco en diálogos ni desbordamientos.

### Línea base

| Indicador | Estado |
|---|---|
| Rutas de página inventariadas | 54 |
| Breakpoints a validar | 320, 360, 375, 390, 412, 430, 480, 768, 1024 y 1280+ px |
| P0 | 0 |
| P1 | 8 |
| P2 | 11 |
| P3 | 5 |
| Total de hallazgos | 24 |

No se clasificó ningún hallazgo como P0 porque no se identificó una pérdida confirmada de datos ni un bloqueo universal de uso. Los P1 sí deben resolverse antes de declarar una experiencia móvil consistente para todos los módulos y roles.

## Qué ya está resuelto

- Tema claro predeterminado sin seguir automáticamente `prefers-color-scheme`.
- `body` protege un ancho mínimo de 320 px, evita `overflow-x` y aplica `text-align: start`.
- Campos `input`, `select` y `textarea` mantienen 16 px para evitar zoom automático de Safari iOS.
- La barra inferior usa cuatro acciones y objetivos táctiles de al menos 48 px, con área segura para dispositivos con notch.
- El menú móvil abre un panel lateral con altura dinámica, scroll contenido y área segura inferior.
- `ResponsiveDataView` permite cambiar de escritorio a tarjetas en móvil.
- `PageHeader`, `ActionBar`, paginación, estados vacíos/error/carga y wizard comparten una base accesible.
- El pipeline ATS presenta etapas como secciones apiladas por debajo de `lg`, en vez de forzar el kanban ancho.
- Candidatos usa filtros de servidor, paginación y tarjetas en móvil.

## Inventario de pantallas y estado responsive

| Área | Rutas representativas | Estado | Riesgo dominante | Acción recomendada |
|---|---|---|---|---|
| Público y candidato | `/`, `/jobs`, `/apply`, `/application-status`, `/candidate/*`, `/sign/[token]` | Parcial | Formularios y estados de seguimiento no tienen matriz móvil automatizada | Validar flujo de postulación de 320-430 px y formularios largos |
| Autenticación | `/login`, `/forgot-password`, `/register-company`, `/candidate/reset-password` | Parcial | Falta prueba de teclado, zoom iOS y mensajes de error estrechos | Añadir E2E de viewport y foco |
| Shell protegida | `/(app)/*` | Parcial | Barra inferior genérica no se adapta íntegramente a rol y módulo | Derivar accesos de `allowedNav` y política de ruta |
| ATS candidatos | `/ats/candidates`, `/ats/candidates/[id]` | Bueno | Acciones masivas y filtros se vuelven largos a 320 px | Convertir filtros/acciones extensos a hoja móvil |
| ATS pipeline | `/ats/pipeline` | Bueno | Selector, filtros y varias tarjetas por etapa elevan longitud de scroll | Añadir resumen plegable y contador de filtros activos |
| ATS vacantes e entrevistas | `/ats/vacancies`, `/ats/interviews` | Parcial | Diálogos con formularios multi-sección | Patrón de modal móvil de pantalla completa y footer fijo |
| ATS analítica, scorecards y CRM | `/ats/analytics`, `/ats/scorecards`, `/ats/talent-crm`, `/ats/communications` | Parcial | Tablas, gráficas, filtros y tablas de score | Tarjetas de KPI prioritarias y tablas transformadas |
| Incorporación | `/onboarding/documents`, `/onboarding/signatures` | Parcial | Diálogos y flujos de evidencia documental | Validar carga, revisión y firma en viewport estrecho |
| Aprendizaje | `/training`, `/training/content`, `/training/paths`, `/training/evaluations`, `/training/results`, `/training/certificates`, `/training/integrations` | Parcial | Editor de curso denso, tabla de 900 px y wizard lateral | Flujo móvil dedicado para creación/edición |
| Inventario | `/inventory`, `/inventory/deliveries`, `/inventory/returns` | Parcial | Panel de detalle fijo de 390 px a partir de `xl` y modales operativos | Asegurar colapso a detalle secuencial y CTA persistente |
| Dashboard, productividad y reportes | `/dashboard`, `/productivity`, `/reports` | Parcial | Métricas, tablas y filtros de alta densidad | Priorizar métricas y usar lista/tarjeta bajo `md` |
| Administración | `/admin/*` | Parcial | CRUD y diálogos repetidos, baja cobertura móvil | Estándar único de formularios y tablas para admin |

## Hallazgos priorizados

### P1: corregir antes de declarar la experiencia móvil completa

| ID | Hallazgo | Impacto | Evidencia | Recomendación |
|---|---|---|---|---|
| M-01 | La barra inferior enlaza siempre a Inicio y Avisos, mientras el resto de accesos proviene de permisos. | Roles sin acceso a esos destinos pueden recibir accesos irrelevantes o terminar en denegación. | `src/components/app-shell.tsx` | Construir las cuatro acciones desde `allowedNav`; usar prioridades por rol y ocultar lo no autorizado. |
| M-02 | La acción primaria móvil se etiqueta siempre como “Talento” y solo busca candidatos/vacantes. | Aprendizaje, inventario, incorporación y administración pierden una entrada contextual. | `src/components/app-shell.tsx` | Definir una taxonomía de acción primaria por módulo habilitado y ruta actual. |
| M-03 | Existen tablas nativas sin conversión consistente a tarjetas. | Desplazamiento horizontal, columnas inaccesibles y lectura lenta en 320-480 px. | `src/app/(app)/ats/analytics/page.tsx`, `src/app/(app)/reports/page.tsx`, `src/components/domain.tsx`, `src/components/training-analytics-dashboard.tsx` | Exigir `ResponsiveDataView` o una variante `DataTableMobile` en datos operativos. |
| M-04 | El gestor de cursos conserva una tabla con `min-w-[900px]`. | La administración de cursos obliga a scroll horizontal en teléfono. | `src/components/training-course-manager.tsx` | Sustituir por tarjetas de curso en móvil; reservar tabla para `md+`. |
| M-05 | Programar entrevista contiene un formulario muy extenso en un diálogo estándar. | Pérdida de contexto, CTA fuera de vista y errores difíciles de corregir en móvil. | `src/app/(app)/ats/interviews/page.tsx` | Usar hoja/pantalla completa móvil, secciones plegables y footer de confirmación fijo. |
| M-06 | Vacantes, incorporación, CRM, inventario y capacitación repiten diálogos densos. | Patrón inconsistente de altura, scroll y acciones de cancelación/confirmación. | `src/app/(app)/ats/vacancies/page.tsx`, `src/app/(app)/onboarding/*`, `src/components/inventory-workspace.tsx`, `src/components/training-*.tsx` | Crear `ResponsiveDialog`: modal centrado en escritorio y full-screen/bottom-sheet en móvil. |
| M-07 | Filtros y acciones masivas ocupan múltiples campos simultáneos. | La tarea principal queda muy abajo, especialmente al filtrar candidatos y analítica. | `src/app/(app)/ats/candidates/page.tsx`, `src/app/(app)/ats/analytics/page.tsx`, `src/app/(app)/reports/page.tsx` | Mostrar búsqueda y filtro principal; mover filtros avanzados a hoja con chips y “Limpiar”. |
| M-08 | Playwright usa solo Desktop Chrome. | No hay prevención automática de solapamiento, scroll lateral, zoom/foco ni navegación móvil. | `playwright.config.ts`, `tests/e2e/*` | Incorporar perfiles iPhone/Android y aserción de overflow/foco en rutas críticas. |

### P2: mejora relevante para productividad, accesibilidad y consistencia

| ID | Hallazgo | Evidencia | Recomendación |
|---|---|---|---|
| M-09 | Dashboard y analítica concentran KPI, filtros, gráficas y tablas sin jerarquía móvil explícita. | `src/app/(app)/dashboard/page.tsx`, `src/app/(app)/ats/analytics/page.tsx` | Priorizar 3-4 KPI, colapsar secundarios y habilitar “ver detalle”. |
| M-10 | Reportes conserva tabla con scroll horizontal. | `src/app/(app)/reports/page.tsx` | Convertir filas a tarjetas con columnas configurables en móvil. |
| M-11 | El wizard usa scroll horizontal para pasos. | `src/components/design-system.tsx` | Mostrar paso actual y progreso, con selector accesible para todos los pasos. |
| M-12 | Paginación agrupa texto, campo numérico y controles en una sola línea. | `src/components/design-system.tsx` | Apilar resumen y navegación bajo 360 px; mantener botones de 44 px. |
| M-13 | Las vistas guardadas y chips de filtros pueden prolongar la cabecera. | `src/app/(app)/ats/candidates/page.tsx` | Limitar a una línea con “Ver todas” o trasladar a filtros. |
| M-14 | Varias cuadrículas de 2-6 columnas dependen de breakpoints dispersos. | ATS, capacitación, administración e inventario | Definir tokens de grid: `stack`, `compact`, `dashboard`, `form`. |
| M-15 | Las listas largas de checkboxes de panelistas, observadores y recursos no ofrecen búsqueda. | `src/app/(app)/ats/interviews/page.tsx` | Añadir búsqueda, contador de seleccionados y selección resumida. |
| M-16 | La interfaz de inventario mezcla catálogo y panel de detalle en un layout de escritorio. | `src/components/inventory-workspace.tsx` | En móvil, abrir detalle como pantalla/hoja independiente. |
| M-17 | Algunas acciones de icono dependen de tooltip. | Componentes UI y cabeceras | Asegurar etiqueta accesible, objetivo táctil de 44 px y texto visible en móvil cuando sea crítico. |
| M-18 | No existe una matriz visual de estados: vacío, error, carga, bloqueo y sin permiso por módulo. | `src/components/async-state.tsx`, `src/components/access-state.tsx` | Añadir historias/E2E de estado por área crítica. |
| M-19 | No hay medición explícita de rendimiento móvil por ruta. | Configuración de pruebas actual | Añadir presupuesto de JS/LCP y revisión Lighthouse en CI informativa. |

### P3: refinamiento y deuda de diseño

| ID | Hallazgo | Evidencia | Recomendación |
|---|---|---|---|
| M-20 | El menú móvil presenta toda la estructura administrativa sin una capa de tareas frecuentes. | `src/components/app-shell.tsx` | Añadir “Recientes” y “Acciones rápidas” según rol. |
| M-21 | No hay especificación central de densidad móvil para tarjetas operativas. | Componentes de dominio | Documentar títulos, metadatos, CTA, badges y máximo de acciones visibles. |
| M-22 | Falta tratamiento específico para orientación horizontal y tablets compactas. | Estilos globales | Probar 480x320 y 768 px; ajustar alturas y sticky UI. |
| M-23 | Las animaciones y transiciones no se auditan con `prefers-reduced-motion`. | Estilos/componentes UI | Revisar y respetar reducción de movimiento. |
| M-24 | No hay catálogo visual de componentes responsive. | `docs/` | Publicar una guía de patrones con ejemplos reales. |

## Los 10 cambios de mayor impacto

1. Derivar la barra inferior de la navegación autorizada y del módulo activo.
2. Crear un único `ResponsiveDialog` para formularios críticos.
3. Convertir tablas operativas a tarjetas bajo `md`.
4. Adaptar el gestor de cursos, empezando por la tabla de 900 px.
5. Mover filtros avanzados a una hoja móvil con chips de estado.
6. Diseñar el flujo móvil completo de entrevista: programación, disponibilidad, panel y confirmación.
7. Convertir la vista de detalle de inventario a una hoja/pantalla móvil.
8. Reordenar dashboard y analítica por prioridad de decisión, no por paridad con escritorio.
9. Añadir pruebas Playwright de 320, 375, 390, 430, 768 y 1024 px.
10. Añadir controles de scroll horizontal, foco, teclado, lectores de pantalla y área táctil a CI.

## Plan de implementación propuesto

### Fase A: Fundaciones compartidas

- Implementar `ResponsiveDialog` y `MobileFilterSheet` en el sistema de diseño.
- Convertir `ActionBar` sticky para que no cubra formularios ni la barra inferior.
- Crear tokens de grid, espaciado, densidad de tarjeta y CTA móvil.
- Hacer la navegación inferior dependiente de `allowedNav`, módulo y rol.

### Fase B: Flujos operativos P1

- ATS: entrevistas, vacantes, candidatos, pipeline, analítica y comunicaciones.
- Capacitación: tabla de cursos, editor y vista previa.
- Inventario: catálogo, detalle, entrega, devolución y trazabilidad.
- Incorporación: documentos, firma y resolución de tareas.

### Fase C: Dashboards, administración y calidad

- Migrar reportes, administración y analítica a vistas móviles por prioridad.
- Añadir estados vacíos, de error, de permisos y de carga a la matriz visual.
- Revisar jerarquía de lectura, truncamiento, wrap de textos y CTA por rol.

### Fase D: Validación y rendimiento

- Ejecutar pruebas manuales visuales en 320, 360, 375, 390, 412, 430, 480, 768, 1024 y 1280+ px.
- Añadir Playwright para iPhone SE, iPhone 14, Pixel 7 y tablet.
- Probar login, postulación, pipeline, entrevista, carga documental, capacitación, inventario y administración por rol.
- Medir LCP, interacción, bundle y consultas de cada ruta crítica antes/después.

## Matriz de validación por tarea

| Flujo | 320-430 px | 768 px | 1024+ px | Criterios de salida |
|---|---|---|---|---|
| Inicio de sesión y recuperación | Una columna, teclado sin zoom | Formulario contenido | Centrado | Sin corte, foco visible y errores anunciados |
| Postulación pública | Pasos claros, carga de archivo usable | Dos columnas opcionales | Layout editorial | Sin scroll lateral ni pérdida de datos |
| Pipeline ATS | Etapas apiladas, selector de vacante | Dos columnas de tarjetas | Kanban | Cambio de etapa accesible y CTA visible |
| Candidatos | Tarjetas, filtros en hoja | Tabla/tarjetas según densidad | Grid existente | Filtro, selección y paginación utilizables |
| Entrevistas | Hoja completa, secciones plegables | Modal amplio | Modal escritorio | Confirmación siempre alcanzable |
| Curso y aprendizaje | Tarjetas y wizard vertical | Panel adaptativo | Editor dos columnas | No depende de tabla de 900 px |
| Inventario | Lista y detalle secuencial | Split adaptable | Split desktop | Operaciones y adjuntos sin solapamiento |
| Reportes/analítica | KPI antes que tabla | Gráficas y filtros reordenados | Vista completa | Lectura sin scroll horizontal obligatorio |

## Accesibilidad y guardas funcionales

- Mantener permisos, tenant, sucursal, planes y feature flags en cada ruta y CTA; la adaptación móvil nunca debe renderizar accesos que omitan `evaluateRouteAccess`.
- Preservar foco al abrir/cerrar hojas y diálogos, incluidas acciones destructivas y errores de validación.
- Mantener `aria-live` para carga, conteos, errores y éxito de operación.
- Validar contraste, estados de foco, tamaño táctil mínimo de 44 x 44 px y operación sin hover.
- Evitar truncar datos críticos de candidato, documento, estado, SLA o consentimiento; usar wrap, resumen expandible o detalle.

## Riesgos y decisiones

- No conviene aplicar reglas globales que cambien cada tabla o modal sin una migración por patrón: puede romper flujos administrativos y la semántica de datos.
- El cambio de navegación inferior necesita pruebas por rol, tenant, plan y módulo antes de publicarse.
- Las tarjetas móviles reducen columnas visibles; cada lista debe definir cuáles son los 3-5 datos decisivos y un detalle progresivo.
- Se requiere validación visual real posterior, porque la auditoría actual es estática y no reemplaza pruebas en Safari iOS ni Android Chrome.

## Archivos de referencia

- `src/app/globals.css`
- `src/components/app-shell.tsx`
- `src/components/design-system.tsx`
- `src/components/training-course-manager.tsx`
- `src/components/inventory-workspace.tsx`
- `src/app/(app)/ats/candidates/page.tsx`
- `src/app/(app)/ats/pipeline/page.tsx`
- `src/app/(app)/ats/interviews/page.tsx`
- `src/app/(app)/ats/analytics/page.tsx`
- `src/app/(app)/reports/page.tsx`
- `playwright.config.ts`
- `tests/e2e/public-accessibility.spec.ts`
- `tests/e2e/role-navigation.spec.ts`

## Siguiente paso

Esperar aprobación para iniciar la Fase A. La implementación debe ejecutarse por lotes pequeños, con verificación de tipos, lint, pruebas E2E por viewport y revisión visual de cada flujo afectado.
