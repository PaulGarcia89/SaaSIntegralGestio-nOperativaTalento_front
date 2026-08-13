# Mapa de Fricción de Usuarios

Las métricas son estimaciones de recorrido para personas nuevas; deben sustituirse por telemetría y pruebas moderadas. Tiempo asume datos disponibles y conexión normal.

| Tarea real | Rol | Pantallas | Clics | Tiempo estimado | Decisiones | Memoria requerida | Errores posibles | Fricción |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- | --- |
| Crear tenant y activar módulos | Superadmin | 3–4 | 6–9 | 4–7 min | 7 | Plan, módulo, contexto global/tenant | Plan equivocado, módulo no habilitado | Alta |
| Crear sucursal y usuario | Tenant admin | 2–3 | 5–8 | 3–5 min | 6 | País, sucursal, rol y permisos | Alcance/rol incorrecto, email duplicado | Media-alta |
| Publicar vacante | HR/recruiter | 1 wizard + lista | 7–11 | 5–9 min | 9 | Puesto, requisitos, etapas, responsables | Etapa/transición/requisición incompleta | Alta |
| Revisar y avanzar candidato | Recruiter | 2 | 3–5 | 1–3 min | 4 | Qué vista usar, reglas de etapa | Transición prohibida, descarte sin motivo | Media |
| Programar entrevista | Recruiter | 1–2 | 8–15 | 5–10 min | 12 | Disponibilidad, panelistas, recursos, proveedor | Cruce calendario, zona horaria, OAuth | Muy alta |
| Completar scorecard | Interviewer | 1–2 | 4–8 | 4–8 min | 6 | Criterios y evidencia de entrevista | Incompleto, sesgo, firma posterior | Media-alta |
| Contratar candidato | HR | 2 | 5–8 | 3–6 min | 6 | Fecha, supervisor, plantilla onboarding | Duplicado, permiso, rollback | Alta |
| Resolver expediente onboarding | HR/supervisor | 2–4 | 6–12 | 8–20 min | 10 | Dependencias, responsable, documento, firma | Bloqueos, vencimiento, versión documento | Muy alta |
| Crear y publicar curso | Instructor | 1 wizard | 8–14 | 10–25 min | 11 | Objetivos, bloques, evaluación, certificado | Publicar sin calidad, SCORM confuso | Muy alta |
| Asignar curso | Instructor/HR | 2 | 4–7 | 2–4 min | 5 | Audiencia, vencimiento, ruta | Duplicado, curso no publicado | Media |
| Registrar y entregar activo | Inventario | 2 | 5–9 | 4–7 min | 7 | Activo, etiqueta, sucursal, empleado, evidencia | Doble asignación, estado inválido | Alta |
| Atender alerta productividad | Supervisor | 2–3 | 3–6 | 2–5 min | 4 | Contexto/umbral y acción posible | Alertas sin acción, permiso insuficiente | Media |
| Filtrar/exportar reporte | Admin/HR | 1 | 3–6 | 1–3 min | 4 | Alcance, periodo, indicador | Filtro local no compartido, export demasiado amplio | Media |

## Puntos de fricción por momento

| Momento | Señal de fricción | Causa probable | Intervención UX |
| --- | --- | --- | --- |
| Antes de empezar | Usuario duda qué módulo abrir | Menú rico, tareas repartidas | Inicio por rol y CTAs "hacer X". |
| Durante formulario | Usuario se detiene en un campo técnico | Términos, demasiadas opciones, dependencias invisibles | Ayuda in situ, valores predeterminados, pasos y validación progresiva. |
| Antes de confirmar | Miedo a efecto irreversible | Impacto de contratación, automatización o entrega no resumido | Resumen de impacto, reversibilidad y actor/responsable. |
| Tras error | Reintento sin entender qué cambió | Mensaje genérico o contexto perdido | Error por campo, requestId, conservar borrador y CTA de recuperación. |
| En móvil | Desplazamiento prolongado o acción fuera de vista | Diálogo largo, tabla o panel lateral | Pantalla completa, footer fijo, tarjetas secuenciales y hoja de filtros. |

## Funciones ocultas o ambiguas

| Elemento | Por qué es difícil de descubrir | Solución priorizada |
| --- | --- | --- |
| Pipeline vs Candidatos vs Talent CRM | Tres puertas para el mismo universo de talento | Subtítulo orientado a tarea y atajos en detalle. |
| Scorecards | Nombre técnico y separado de entrevista | Renombrar como "Evaluaciones de entrevista" en todos los puntos. |
| SCORM | Estándar técnico sin modelo mental de instructor nuevo | Ayuda contextual, ejemplo y validación de paquete. |
| Automatizaciones | Reglas/condiciones/consecuencias son un lenguaje de sistema | Plantillas por evento, simulación visual e impacto legible. |
| Cumplimiento onboarding | Ruta de administración no se interpreta como parte del expediente | Biblioteca claramente separada y enlaces desde tarea/documento. |
| Productividad | Indicador sin siguiente acción | Tarjeta de excepción con CTA y responsable. |

## Plan de investigación para validar el mapa

1. Cinco participantes nuevos: recruiter, HR, instructor, supervisor e inventory manager.
2. Medir éxito, tiempo, clics, errores, verbalizaciones y confianza por cada tarea crítica.
3. Aplicar prueba de cinco segundos antes de cada tarea y SUS al finalizar.
4. Comparar métricas con los eventos ya definidos: duración de flujo, filtros, exportaciones, abandonos y errores de formulario.
5. Priorizar cualquier tarea crítica con éxito <80%, SUS <75 o duración >25% sobre estimación.
