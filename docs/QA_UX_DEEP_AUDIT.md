# Auditoría QA Profunda de Usabilidad y UX

Fecha: 2026-08-13  
Método: evaluación experta de tareas reales, inspección de rutas/componentes y heurísticas de Nielsen. Las puntuaciones y tiempos son estimaciones de UX QA; no sustituyen sesiones moderadas, analítica de producción ni pruebas con personas usuarias.

## Resultado ejecutivo

**Puntuación global estimada: 75/100.** La plataforma es operable por usuarios entrenados y presenta buenos controles de permisos, contexto y recuperación. Para personas nuevas, el reto no es descubrir módulos sino decidir entre múltiples vistas, términos técnicos y formularios largos en operaciones sensibles.

### Qué funciona bien

- La orientación está disponible mediante breadcrumb, encabezados, contexto de empresa/sucursal, navegación por rol, recientes, favoritos y búsqueda.
- Los listados principales priorizan filtros de servidor, selección, estados vacíos y reintentos.
- Los flujos más sensibles incluyen confirmación, permisos y trazabilidad.
- El shell interno tiene acciones rápidas derivadas sólo de rutas autorizadas y glosario contextual.

### Qué frena tareas reales

- ATS divide la misma decisión entre Vacantes, Pipeline, Candidatos, Entrevistas, CRM, Comunicaciones y Scorecards; el usuario nuevo debe saber cuál abrir primero.
- Programar entrevistas, automatizaciones y editar cursos concentran muchos campos/decisiones en diálogos.
- Onboarding reúne expediente, tareas, documentos, plantillas, firmas y cierre; su arquitectura es potente, pero la bandeja y detalle aún exigen conocimiento previo.
- Productividad comunica indicadores, pero no siempre hace evidente una acción siguiente de alto valor.
- Parte del gobierno SaaS sigue siendo de capacidad/información y no de tarea completada.

## Metodología y escala

Cada dimensión se evalúa de 0 a 100. `90+` excelente, `80–89` fuerte, `70–79` utilizable con fricción, `60–69` necesita rediseño focal, `<60` riesgo alto.

| Dimensión | Pregunta operativa |
| --- | --- |
| Learnability | ¿Una persona nueva entiende cómo empezar sin formación? |
| Discoverability | ¿Encuentra la función cuando la necesita? |
| Efficiency | ¿Completa el trabajo con pocos pasos y cambios de contexto? |
| Error rate | ¿Previene, explica y recupera errores? |
| Cognitive load | ¿Cuántas decisiones/elementos debe sostener mentalmente? |
| Consistency | ¿Los patrones se repiten entre módulos? |
| Feedback | ¿Se entiende carga, éxito, bloqueo y siguiente acción? |
| Mobile usability | ¿La tarea sigue siendo viable con toque y pantalla pequeña? |
| Accessibility | ¿El flujo mantiene semántica, foco, texto y controles utilizables? |

## Heurísticas de Nielsen

| Heurística | Estado | Evidencia / riesgo |
| --- | --- | --- |
| Visibilidad del estado | Fuerte | `AsyncState`, badges, timeline, progreso y toasts; falta cobertura uniforme en mutaciones complejas. |
| Coincidencia con mundo real | Media | "Vacante", "candidato", "activo" son claros; Pipeline, Talent CRM, Scorecards, SCORM e IA requieren apoyo contextual. |
| Control y libertad | Media-fuerte | Cancelar, volver, reintentar y archivos de auditoría existen; cambios no guardados no son consistentes entre todos los formularios. |
| Consistencia y estándares | Fuerte | `PageHeader`, diálogo, filtros y cards reutilizados; quedan diálogos antiguos densos. |
| Prevención de errores | Fuerte | Permisos, validación, confirmaciones y transacciones; falta evidencia integral de offline/doble submit. |
| Reconocimiento sobre recuerdo | Media | Glosario y navegación frecuente mejoran; ATS y onboarding aún obligan a recordar qué vista contiene cada entidad. |
| Flexibilidad y eficiencia | Fuerte | Filtros, vistas, acciones masivas, recientes y favoritos; varias acciones comunes requieren entrar a detalle. |
| Diseño minimalista | Media | Formularios de entrevistas, automatizaciones y curso presentan demasiadas decisiones por paso. |
| Recuperación de errores | Media-fuerte | Mensajes y retry frecuentes; falta requestId consistente y recuperación de borradores autenticados. |
| Ayuda y documentación | Media-fuerte | Glosario y descripciones; falta onboarding inicial guiado por rol con checklist de éxito. |

## Simulación first-time user

| Persona | Primer objetivo | Resultado estimado | Principal fricción |
| --- | --- | --- | --- |
| SUPER_ADMIN | Crear tenant, plan y módulos | 72 | Gobierno mezcla configuración, información y rutas aún no operativas. |
| TENANT_ADMIN | Preparar sucursal, usuarios y roles | 76 | Vocabulario de permisos y alcance requiere conocimiento SaaS. |
| HR | Publicar vacante y contratar | 78 | Debe alternar entre ATS, perfil, oferta y onboarding. |
| RECRUITER | Priorizar candidatos y entrevista | 80 | Tiene buena navegación por rol; decidir Pipeline vs Candidatos vs CRM no es inmediato. |
| INSTRUCTOR | Crear/asignar curso | 74 | Asistente editorial es claro, pero sus conceptos y pasos son numerosos. |
| SUPERVISOR | Ver equipo, onboarding y productividad | 71 | Empleados/productividad no siempre priorizan una acción concreta. |
| EMPLOYEE | Completar curso y consultar activos | 82 | Navegación reducida y tareas personales comprensibles. |
| CANDIDATE | Postular y seguir proceso | 84 | Portal es claro; idioma y borrador autenticado son puntos de riesgo. |

## Prueba de 5 segundos

Pregunta: tras cinco segundos, ¿se entiende dónde estoy, qué puedo hacer y cuál es el siguiente paso?

| Pantalla | Dónde estoy | Acción principal | Siguiente paso | Resultado |
| --- | --- | --- | --- | --- |
| Landing | Sí | Sí | Sí | PASS |
| Vacantes públicas | Sí | Sí | Sí | PASS |
| Dashboard | Sí | Sí, si hay siguiente acción | Parcial si no hay prioridades | PARTIAL |
| Vacantes ATS | Sí | Sí | Sí | PASS |
| Pipeline | Sí | Parcial | Parcial | PARTIAL |
| Perfil 360 candidato | Sí | Sí | Sí | PASS |
| Entrevistas | Sí | Parcial por cantidad de configuraciones | Parcial | PARTIAL |
| Onboarding documental | Sí | Sí en expediente seleccionado | Parcial entre biblioteca/operación | PARTIAL |
| Gestionar cursos | Sí | Sí | Sí | PASS |
| Inventario | Sí | Sí | Sí para activo seleccionado | PASS |
| Automatizaciones | Sí | Sí | Parcial por terminología de reglas | PARTIAL |
| Productividad | Sí | Parcial | Parcial | PARTIAL |

## Recomendaciones priorizadas

1. Consolidar entradas ATS según tarea: "Revisar candidatos", "Programar entrevista", "Tomar decisión"; dejar las vistas técnicas como secundarias.
2. Convertir diálogos largos a wizard móvil con resumen persistente, validación por paso y aviso de cambios no guardados.
3. Dar a Onboarding una bandeja enfocada en riesgo: próxima tarea, responsable, vencimiento y bloqueo antes de bibliotecas/configuración.
4. Convertir Productividad en una pantalla de excepción y acción recomendada, no sólo indicadores.
5. Implementar onboarding inicial por rol con checklist que desaparezca al completar tareas de éxito.
6. Ejecutar pruebas moderadas con cinco participantes por rol prioritario y comparar con las estimaciones de [scorecard](QA_USABILITY_SCORECARD.md).
