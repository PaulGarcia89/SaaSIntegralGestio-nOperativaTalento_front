# Scorecard de Usabilidad por Módulo

Puntuaciones estimadas de UX QA, 0–100. La nota final es el promedio no ponderado de las nueve dimensiones.

| Módulo | Learn | Discover | Eficiencia | Errores | Carga | Consist. | Feedback | Móvil | A11y | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Público y candidato | 88 | 86 | 82 | 78 | 83 | 84 | 82 | 86 | 84 | **84** |
| Dashboard y personas | 75 | 76 | 70 | 78 | 69 | 80 | 76 | 74 | 80 | **75** |
| ATS y reclutamiento | 76 | 75 | 77 | 83 | 68 | 79 | 81 | 74 | 79 | **77** |
| Onboarding | 72 | 70 | 73 | 84 | 65 | 78 | 82 | 69 | 78 | **75** |
| Capacitación | 74 | 73 | 74 | 80 | 67 | 80 | 79 | 70 | 78 | **75** |
| Inventario | 76 | 76 | 78 | 82 | 70 | 80 | 80 | 72 | 77 | **77** |
| Productividad | 68 | 70 | 68 | 76 | 72 | 77 | 72 | 74 | 77 | **73** |
| Reportes/notificaciones | 74 | 74 | 75 | 76 | 70 | 80 | 78 | 71 | 77 | **75** |
| Administración tenant | 75 | 76 | 73 | 82 | 68 | 81 | 79 | 71 | 77 | **76** |
| Gobierno SaaS | 62 | 64 | 60 | 75 | 66 | 78 | 65 | 66 | 75 | **68** |
| **Global** | **74** | **74** | **73** | **79** | **70** | **80** | **77** | **73** | **78** | **75** |

## Interpretación por módulo

| Módulo | Fortalezas | Riesgo principal | Métrica de validación posterior |
| --- | --- | --- | --- |
| Público/candidato | CTA, proceso, portal y privacidad | Idioma/borrador y entrevista autogestionada | Conversión aplicación iniciada -> enviada; abandono por paso. |
| Dashboard/personas | Contexto y acciones rápidas | Prioridades sin acción concreta, directorio limitado | Tiempo hasta primera tarea resuelta. |
| ATS | Filtros, pipeline, perfil 360, trazabilidad | Muchas vistas para una misma decisión | Tiempo para revisar y mover candidato; errores de transición. |
| Onboarding | Responsables, bloqueos, documentos y auditoría | Densidad de expediente/configuración | Tiempo hasta READY; tareas vencidas por responsable. |
| Capacitación | Wizard, contenido, evaluación y certificados | Terminología y alta densidad editorial | Tiempo para crear/publicar/assign curso. |
| Inventario | Activo, historial y acciones contextuales | Navegación entre stock/compras/mantenimiento | Tiempo alta -> entrega; errores de custodia. |
| Productividad | Permisos y contexto | KPI sin decisión sugerida | Alertas atendidas / alertas abiertas. |
| Reportes | Filtros y exportación | Información densa y filtros no compartidos | Uso de filtros, drill-down y exportación. |
| Administración | Roles, contexto y automatización | Lenguaje técnico y configuración extensa | Tiempo para usuario/rol usable. |
| Gobierno SaaS | Políticas de acceso estrictas | Destinos de capacidad no operativos | Tasa de llegada a destino sin completar acción. |

## Umbrales de salida UX

- Flujo crítico: >=80 en learnability, efficiency y feedback.
- Móvil: >=78 para todo flujo de empleado/candidato; >=72 para administración avanzada.
- Accesibilidad: >=85 y cero bloqueo por teclado/Axe en rutas críticas.
- Ninguna pantalla de gobierno debe permanecer <70 por más de una versión de producto.
