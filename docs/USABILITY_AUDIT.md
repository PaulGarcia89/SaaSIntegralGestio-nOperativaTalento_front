# Auditoría Integral de Usabilidad

**Fecha:** 2026-08-13  
**Alcance:** inspección estática del frontend, rutas, componentes reutilizables, políticas de acceso y pruebas. No sustituye pruebas moderadas con clientes ni validación en dispositivos físicos.

## Resultado ejecutivo

**UX Usability Score: 76/100 - Bueno pero mejorable.**

Una persona nueva puede identificar la mayoría de los módulos y completar tareas simples gracias al encabezado, breadcrumb, navegación por grupos, acceso por rol y patrones de estado. La experiencia pierde claridad al entrar en operaciones complejas: algunos destinos administrativos son placeholders, varios módulos reúnen varias entidades en una misma pantalla y las tareas largas dependen de diálogos densos.

| Categoría | Peso | Nota | Evidencia |
| --- | ---: | ---: | --- |
| Claridad de navegación | 15% | 78 | Sidebar agrupado, breadcrumb, búsqueda global y rutas por permiso. |
| Facilidad de aprendizaje | 10% | 75 | Lenguaje mayormente operativo; quedan términos como `Talent CRM`, `Scorecards` y `Pipeline` que requieren contexto. |
| Velocidad para completar tareas | 15% | 73 | CRUD y wizard existen; entrevistas, onboarding y automatizaciones añaden carga. |
| Consistencia | 10% | 77 | `PageHeader`, `DomainTable`, `AsyncState`, diálogos y botones compartidos. |
| Prevención de errores | 10% | 81 | Validación, borradores, confirmaciones, permisos y aislamiento por tenant/sucursal. |
| Feedback del sistema | 10% | 78 | Toasts, `AsyncState`, estados de éxito y reintentos; falta una matriz completa por acción crítica. |
| Responsive / móvil | 10% | 73 | Base de 320 px, cards y tests; aún existen flujos densos y algunas tablas especializadas. |
| Accesibilidad | 5% | 79 | Skip link, labels, roles ARIA, foco y Axe en portal público; falta cobertura interna equivalente. |
| Arquitectura de información | 10% | 75 | Módulos bien agrupados; algunos destinos de administración y empleados no son operativos. |
| Carga cognitiva | 5% | 71 | ATS e inventario priorizan operación; onboarding, automatizaciones y curso concentran demasiadas decisiones. |

## Hallazgos críticos

| Prioridad | Hallazgo | Impacto | Recomendación |
| --- | --- | --- | --- |
| P0 | No hay pérdida de datos ni bypass de acceso confirmado. | - | Mantener la política central de rutas y las pruebas de alcance. |
| P1 | `Empleados`, Auditoría SaaS, Facturación, Usuarios globales y Configuración SaaS son capability pages. | Un usuario llega a un destino anunciado sin poder completar la tarea. | Convertirlas en flujos operativos o retirarlas temporalmente de navegación. |
| P1 | Entrevistas, onboarding, automatizaciones y edición de curso acumulan formularios largos en diálogos. | Eleva errores y tiempo en móvil. | `ResponsiveDialog` fullscreen en móvil, pasos y resumen persistente. |
| P1 | El menú muestra muchos destinos de igual peso. | La primera visita no comunica la siguiente tarea. | Añadir inicio por rol con tareas, alertas y acciones rápidas. |
| P2 | Tablas de dominio están bien resueltas, pero analítica y editores especializados pueden conservar densidad de escritorio. | Scroll, lectura lenta y acciones escondidas en móvil. | Definir una variante de tarjeta por entidad y filtros en hoja móvil. |
| P2 | Estados vacíos y de error son reutilizables, pero no hay catálogo de cobertura por módulo. | Inconsistencia futura y CTAs poco orientados. | Añadir matriz visual/E2E para carga, vacío, error, permiso y bloqueo. |
| P2 | Términos híbridos y técnicos no siempre explican la intención. | Curva de aprendizaje de perfiles no técnicos. | Usar nombre funcional + ayuda contextual: "Evaluaciones de entrevista (scorecards)". |

## Prueba de 5 segundos

| Pantalla | Ubicación | Acción | Información | Próximo paso | Resultado |
| --- | --- | --- | --- | --- | --- |
| Inicio público | Sí | Sí | Sí | Sí | PASS |
| Vacantes públicas | Sí | Sí | Sí | Sí | PASS |
| Dashboard | Sí | Parcial | Sí | Parcial | PARTIAL |
| Vacantes ATS | Sí | Sí | Sí | Sí | PASS |
| Pipeline ATS | Sí | Sí | Sí | Parcial | PARTIAL |
| Entrevistas | Sí | Parcial | Sí | Parcial | PARTIAL |
| Incorporaciones | Sí | Parcial | Parcial | Parcial | PARTIAL |
| Cursos | Sí | Sí | Sí | Sí | PASS |
| Inventario | Sí | Sí | Sí | Parcial | PARTIAL |
| Productividad | Sí | Parcial | Sí | Parcial | PARTIAL |
| Administración | Sí | Sí | Parcial | Sí | PARTIAL |

## Análisis de clics estimado

| Tarea | Flujo actual | Clics estimados | Objetivo | Mejora |
| --- | --- | ---: | ---: | --- |
| Crear empresa | Administración SaaS > Empresas > Nueva | 4-6 | 4 | Mantener wizard compacto y resumen de plan. |
| Crear sucursal | Administración > Sucursales > Nueva | 3-5 | 3 | Preseleccionar empresa y país. |
| Crear vacante | Vacantes > Crear > wizard > Publicar | 6-10 | 6-8 | Guardar borrador y mostrar resumen fijo. |
| Revisar candidato | Candidatos/Pipeline > detalle | 2-3 | 2 | Mantener enlaces desde lista y tablero. |
| Cambiar etapa | Pipeline > candidato > transición | 2-4 | 2 | Mostrar transición principal en tarjeta. |
| Agendar entrevista | Entrevistas > Nueva > formulario | 6-12 | 5-8 | Separar disponibilidad, panel y confirmación. |
| Contratar e iniciar onboarding | Detalle > contratar > flujo | 5-8 | 4-6 | Resumen de impacto antes de confirmar. |
| Crear curso | Gestionar cursos > nuevo > wizard | 5-10 | 5-7 | Plantillas y pasos con autoguardado. |
| Registrar/entregar activo | Inventario > activo > asignar | 4-7 | 3-5 | Acción contextual en detalle. |

## Conclusión

La plataforma ya es utilizable para operación guiada. Para reducir capacitación, el siguiente salto no es añadir más destinos: es convertir las tareas frecuentes por rol en entradas claras, reducir la densidad de formularios y completar los destinos que hoy solo describen capacidades.
