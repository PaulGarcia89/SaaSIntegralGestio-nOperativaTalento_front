# Reporte QA Responsive y Touch

## Viewports exigidos

| Viewport | Público/candidato | Interno autenticado | Resultado actual |
| --- | --- | --- | --- |
| 320x568 | Cubierto parcialmente | Planificado | Público sin overflow; interno pendiente con cuenta E2E. |
| 360x640 | Landing existente | Planificado | Sin evidencia transversal interna. |
| 375x667 | Público/candidato | Planificado | Público sin overflow. |
| 390x844 | Público | Planificado | Público sin overflow. |
| 430x932 | Público/candidato | Planificado | Público sin overflow. |
| 768x1024 | No transversal | Planificado | Pendiente. |
| 1024x768 | No transversal | Planificado | Pendiente. |
| 1440x900 | RBAC escritorio | Manual/E2E | RBAC de escritorio pasó. |

## Evidencia ejecutada

- Vacantes públicas: sin desborde a 320, 375, 390 y 430 px en Chromium y Chrome móvil.
- Preboarding: sin desborde a 320, 375 y 430 px en Chromium y Chrome móvil.
- Login: prueba existente valida campos utilizables en 320 px y tamaño de fuente >=16 px.
- Safari iOS: no ejecutado; falta instalar WebKit de Playwright.

## Hallazgos

1. La prueba RBAC usa `getByRole("complementary")`, que corresponde al sidebar desktop y queda oculto en móvil. Es un defecto de prueba, no evidencia de fallo funcional móvil. Debe validar el botón `Menu`, abrir el drawer y verificar enlaces autorizados.
2. No hay evidencia de gestos sobre drawer, bottom sheets, swipe, drag-and-drop de ordenamiento ni alternativas touch para acciones de hover en todas las pantallas.
3. Las tablas internas usan progresivamente tarjetas móviles, pero falta una auditoría visual automatizada de cursos, compras, analítica y administración.

## Criterios de aprobación

- `scrollWidth <= clientWidth` en cada viewport y ruta crítica.
- Objetivos táctiles >=44x44 px para controles primarios.
- Modal/ResponsiveDialog visible, foco retenido y pie de acciones accesible sin quedar bajo el teclado virtual.
- Drawer abre/cierra con botón, Escape y toque fuera; no debe depender de hover.
- Toda interacción hover debe tener botón, menú contextual o gesto equivalente táctil.

## Matriz manual pendiente

| Área | Prueba touch requerida |
| --- | --- |
| ATS Pipeline | Arrastre de etapa o alternativa mediante botón/selector. |
| Cursos | Reordenamiento de módulos, footer de asistente y teclado virtual. |
| Inventario | Selección de activo, historial secuencial y acciones de custodia. |
| Onboarding | Expediente, bloqueo, asignación y carga documental. |
| Administración | Formularios largos, selects y diálogos en 320–430 px. |
