# Auditoría Heurística de Nielsen

| Heurística | Nota 1-5 | Evidencia | Mejora prioritaria |
| --- | ---: | --- | --- |
| Visibilidad del estado | 4 | `AsyncState`, toasts, badges, progreso y reintentos. | Estados de acción uniforme para todos los CRUD críticos. |
| Correspondencia con mundo real | 4 | Vacantes, candidatos, entregas, cursos y sucursales usan lenguaje operativo. | Aclarar Pipeline, CRM, Scorecards y términos de IA. |
| Control y libertad | 4 | Borradores, cancelar privacidad, volver, cerrar diálogos y acciones de restauración. | Reprogramar agenda candidata y deshacer operaciones no destructivas. |
| Consistencia y estándares | 4 | `PageHeader`, `DomainTable`, botones y acceso central. | Unificar formularios densos y nombres de acciones secundarias. |
| Prevención de errores | 4 | Validación de archivo, permisos, tenant/sucursal, confirmaciones y formularios. | Previsualización de impacto en bulk, roles y automatizaciones. |
| Reconocer antes que recordar | 4 | Sidebar, breadcrumb, comandos y etiquetas de estado. | Resúmenes de flujo y ayuda contextual en operaciones complejas. |
| Flexibilidad y eficiencia | 3 | Búsqueda, filtros, paginación, exportación y rutas directas. | Vistas guardadas consistentes, acciones masivas y atajos por rol. |
| Diseño estético y minimalista | 4 | Design tokens, tarjetas, tipografía legible y tema claro. | Reducir paneles concurrentes en onboarding, CRM y dashboards. |
| Recuperación de errores | 4 | Mensajes en lenguaje claro, reintento y preservación de contexto. | Incluir `requestId`, causa y CTA contextual en todas las APIs. |
| Ayuda y documentación | 3 | Textos de apoyo y documentación técnica. | Guías de primer uso y explicación contextual por rol. |

## Estados transversales

- **Carga:** `AsyncState` es consistente; añadir skeletons de estructura en listas/dashboards.
- **Vacío:** normalizar "qué significa", "por qué" y CTA en todos los módulos.
- **Error:** no exponer errores crudos; conservar filtros y añadir reintento contextual.
- **Acceso:** `AccessDenied` explica sesión, tenant, suscripción, módulo, rol, permiso o sucursal.
- **Deshabilitado:** los botones deben describir el dato, permiso o condición faltante.

## Accesibilidad

La base cumple una parte importante de WCAG: `skip link`, labels, foco, objetivos táctiles, `aria-live`, tamaños mínimos y Axe sobre el portal público. Falta ampliar Axe y pruebas de teclado/foco a rutas internas autenticadas, diálogos, tablas, cambio de contexto y formularios administrativos.
