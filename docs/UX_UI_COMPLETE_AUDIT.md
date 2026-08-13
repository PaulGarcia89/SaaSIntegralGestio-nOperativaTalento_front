# Auditoría UX/UI completa - TalentOS

Fecha: 2026-08-08  
Alcance: frontend `src/app`, navegación, componentes, cliente HTTP, React Query y políticas visibles de acceso. No sustituye pruebas con usuarios, lector de pantalla ni validación de APIs productivas.

## Resumen ejecutivo

Se identificaron **70 pantallas**. La aplicación cuenta con una base SaaS madura: contexto tenant/sucursal, política de rutas, permisos efectivos, módulos, feature flags, estado de suscripción, React Query, feedback asíncrono y un sistema visual común. La mayor oportunidad no es añadir más páginas: es **consolidar las operaciones complejas, completar las rutas placeholder y reducir la densidad de formularios y tablas**.

| Indicador | Resultado |
| --- | --- |
| Pantallas implementadas y conectadas | 54 |
| Pantallas parciales o en integración | 10 |
| Placeholders/capabilities sin operación real | 6 |
| Responsive excelente o correcto | 44 |
| Responsive mejorable | 20 |
| Responsive no verificado visualmente | 6 |
| P0 | 2 |
| P1 | 9 |
| P2 | 17 |
| P3 | 13 |

## Lo que funciona bien

- `AppShell` decide acceso con sesión, tenant, sucursal, rol, permisos, módulos, feature flags y suscripción; no se limita a `role === ADMIN`.
- La navegación, el buscador `Ctrl/Cmd + K`, breadcrumbs, selector de contexto, drawer móvil y avisos de acceso denegado forman una base coherente.
- `PageHeader`, `ActionBar`, `Pagination`, `ResponsiveDataView`, `MobileFilterSheet`, `Wizard`, `InlineFeedback` y `AsyncState` resuelven patrones repetidos.
- ATS, onboarding, formación, inventario y reportes usan React Query con estados de carga/error y reintento en la mayoría de consultas críticas.
- Los portales de candidato y firma ofrecen una experiencia separada, con estados vacíos y fallos legibles.

## Hallazgos priorizados

| Pri. | Hallazgo | Impacto UX | Comercial | Frec. | Complejidad | Riesgo | Evidencia |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| P0 | Rutas de administración mostradas como no disponibles o capability placeholder; pueden aparecer en el inventario pero no completar la operación. | 5 | 5 | 3 | 3 | 4 | `/admin`, `/admin/audit`, `/admin/billing`, `/admin/global-users`, `/admin/settings` |
| P0 | Configuración de cámaras almacena URL y promete protección; falta validación UX, prueba de conexión, ayuda y editor real de zona. | 5 | 4 | 3 | 4 | 5 | `/productivity/cameras` |
| P1 | Formulario de onboarding concentra demasiadas responsabilidades (plantilla, tareas, documentos, ciclo de vida, cierre) en una sola pantalla extensa. | 5 | 5 | 4 | 4 | 3 | `/onboarding/documents` |
| P1 | Navegación oculta Pipeline, CRM, Comunicaciones y Scorecards aunque son funciones de uso diario de ATS. | 4 | 5 | 4 | 2 | 2 | `showInNavigation: false` |
| P1 | Búsqueda global navega solamente por rutas; no busca entidades, recientes ni resultados autorizados. | 4 | 4 | 4 | 4 | 2 | `AccessibleCommandPalette` |
| P1 | Varios formularios administrativos usan diálogos de mucha densidad y sin borrador/autoguardado consistente. | 4 | 4 | 3 | 3 | 3 | Empresas, planes, suscripciones, roles |
| P1 | El dashboard no prioriza universalmente la próxima acción por rol y sucursal frente a métricas. | 4 | 4 | 4 | 3 | 2 | `/dashboard` |
| P1 | No hay garantía estática de que toda acción/botón use el mismo permiso que el backend. | 5 | 5 | 3 | 4 | 5 | Dependencia de mapas frontend/backend |
| P1 | Columnas, selección masiva y exportación no son patrones homogéneos entre listados. | 4 | 4 | 4 | 3 | 2 | ATS, inventario, administración |
| P1 | La recuperación de contraseña y el registro de empresa siguen bloqueados por integración. | 4 | 5 | 3 | 4 | 3 | `/forgot-password`, `/register-company` |
| P2 | Tema oscuro existe aunque el blanco es predeterminado; falta verificación sistemática de contraste por tenant. | 3 | 3 | 2 | 2 | 3 | `globals.css`, branding dinámico |
| P2 | Algunos textos de interfaz usan traducciones/nombres inconsistentes: "Gestion", "suscripciónes", inglés técnico y nombres de módulos. | 3 | 3 | 4 | 1 | 1 | Administración e inventario |
| P2 | Tablas responsivas están resueltas solo en algunas páginas; otras dependen del scroll horizontal o de cards sin equivalencia. | 4 | 3 | 4 | 3 | 2 | Inventario, administración, onboarding |
| P2 | No hay una estrategia de borradores uniforme para flujos de creación largos. | 3 | 4 | 3 | 3 | 2 | Vacantes, onboarding, automatizaciones |
| P2 | Las notificaciones se consultan cada 60 segundos, pero falta agrupación por entidad y una acción masiva consistente. | 3 | 3 | 3 | 3 | 2 | Shell y `/notifications` |
| P3 | Varias páginas compactas no exponen metadatos de última actualización, ámbito y procedencia del dato. | 2 | 2 | 3 | 2 | 1 | Analíticas y Productividad |

## Navegación actual vs. recomendada

### Problemas

- El sidebar está organizado por módulos técnicos, no siempre por la tarea inmediata del rol.
- Cuatro áreas ATS fundamentales no aparecen en la navegación principal, obligando a conocer URLs o llegar desde enlaces contextuales.
- "Personas" mezcla empleados, incorporación y firma. "Operaciones" mezcla productividad e inventario sin una entrada de trabajo priorizada.
- Las rutas no disponibles están definidas junto a las rutas disponibles, lo que incrementa el riesgo de enlaces huérfanos.

### Principio recomendado

Cada rol debe abrir una **bandeja de trabajo** y después las áreas de administración. Mostrar máximo 5 destinos principales en móvil; el resto en "Ver más" o buscador.

| Rol | Inicio recomendado | Navegación primaria | Secundaria |
| --- | --- | --- | --- |
| SUPER_ADMIN | Salud de plataforma | Empresas, planes, suscripciones, integraciones | Auditoría, colas, configuración |
| TENANT_ADMIN | Prioridades de empresa | Equipo, reclutamiento, incorporaciones, aprendizaje, inventario | Reportes, automatizaciones, configuración |
| HR | Personas por resolver | Vacantes, candidatos, pipeline, incorporaciones | Comunicaciones, reportes |
| RECRUITER | Mi pipeline | Vacantes, candidatos, entrevistas, comunicaciones | CRM, scorecards, analítica |
| INTERVIEWER | Entrevistas asignadas | Agenda, scorecards | Perfil del candidato autorizado |
| INSTRUCTOR | Cursos por publicar | Cursos, evaluaciones, resultados | Rutas, certificados, inteligencia |
| SUPERVISOR | Equipo y alertas | Empleados, productividad, activos | Reportes |
| INVENTORY_MANAGER | Operación de almacén | Inventario, entregas, devoluciones, escaneo | Compras, mantenimiento, auditoría |
| EMPLOYEE | Mis pendientes | Cursos, mis activos, notificaciones | Perfil |
| CANDIDATE | Mi proceso | Estado, entrevistas, ofertas, perfil | Privacidad y soporte |

## Flujos críticos

| Flujo | Pasos actuales | Problema | Pasos recomendados | Mejora esperada |
| --- | ---: | --- | ---: | --- |
| Crear empresa | 3-4 | Alta densidad y registro público bloqueado | 3 | Wizard: empresa, administrador, plan; validación por paso |
| Crear sucursal | 2 | Contexto/alcance no siempre visible | 2 | Empresa preseleccionada, mapa/horario opcional |
| Crear usuario | 3 | Roles y sucursal se perciben como campos sueltos | 3 | Identidad, acceso, revisión |
| Publicar vacante | 4-6 | Wizard útil, pero la relación con requisición/pipeline requiere más contexto | 4 | Requisición, contenido, pipeline, revisión/publicación |
| Aplicar a vacante | 3-5 | Parsing/social login y privacidad son visibles, pero falta progreso persistente | 3 | Datos, CV, consentimiento, confirmación |
| Revisar candidato | 3 | Contexto repartido entre candidato, pipeline, entrevistas y CRM | 2 | Ficha única con acciones de etapa contextuales |
| Agendar entrevista | 4 | Integraciones y disponibilidad añaden complejidad | 3 | Participantes, horario, invitación/revisión |
| Contratar e iniciar onboarding | 2 | Buen rollback declarado, pero demasiados campos en modal | 2 | Condiciones de empleo, plantilla/revisión |
| Incorporación documental | 5+ | Pantalla sobrecargada | 3 | Bandeja, expediente, biblioteca/plantillas |
| Asignar curso | 3 | Administración y experiencia de alumno están separadas sin atajo claro | 2 | Seleccionar audiencia, curso, fecha |
| Crear/entregar activo | 3 | Datos de almacén, activo y custodia fragmentados | 3 | Existencias, custodia, evidencia |
| Configurar cámara | 2 | Sin chequeo de fuente ni edición de polígono | 4 | Fuente, prueba, zonas, revisión de privacidad |

## Tablas y formularios

### Tablas

| Área | Estado | Problema | Decisión de diseño |
| --- | --- | --- | --- |
| ATS candidatos/pipeline | Bueno | Variación entre filtros, bulk y columnas | DataGrid único con filtros guardados y selección explícita |
| ATS CRM | Bueno | Vistas múltiples en una pantalla densa | Separar en pestañas con URL persistente |
| Onboarding | Mejorable | El detalle se comporta como una gran tabla/formulario | Layout maestro-detalle y timeline lateral |
| Cursos | Mejorable | Gestión, contenido y resultados fragmentados | Unificar jerarquía curso > módulo > lección |
| Inventario | Mejorable | Tablas/capability pages no son uniformes | Cards móviles y columnas configurables desktop |
| Administración | Correcto | Diálogos densos y filtros escasos | Listado con panel de detalle y filtros persistentes |

### Formularios que deben ser wizard

- Empresa/administrador/suscripción.
- Vacante con requisición, ubicaciones, pipeline y publicación.
- Contratación con condiciones, fecha, plantilla y aprobaciones.
- Paquete de firma.
- Automatización no-code para reglas con varias condiciones y consecuencias.
- Compra/inventario cuando incluye proveedor, líneas, aprobación y recepción.
- Cámara/zona con comprobación de conectividad y límites de privacidad.

## Mobile, accesibilidad y rendimiento

### Mobile

- La base es correcta: `min-width: 320px`, drawer, barra rápida de tres destinos, filtros en hoja y tipografía mínima de 16px en controles.
- Faltan auditorías visuales automatizadas a 320, 360, 375, 390, 430, 768, 1024 y 1440 px; no puede afirmarse compatibilidad total solo por clases Tailwind.
- Sustituir diálogos grandes por pantalla/hoja completa en móvil para onboarding, entrevistas, automatizaciones y compras.
- Toda tabla debe tener tarjeta móvil semánticamente equivalente, no solo scroll horizontal.

### Accesibilidad WCAG 2.1 AA

- Positivo: skip link, `aria-current`, toolbar, navegación de command palette, roles de feedback y objetivos táctiles de 44px en varios componentes.
- Pendiente: prueba manual con teclado y NVDA/VoiceOver, contraste de branding por tenant, foco devuelto tras cerrar diálogos, etiquetas explícitas de todos los inputs inline y comunicación de cambios de datos asíncronos.
- Evitar que el color sea el único indicador de estado en tablas, pipeline y alertas.

### Rendimiento percibido

- React Query y estados `AsyncState` son una buena base.
- Priorizar skeletons estructurales en dashboards/listados en vez de paneles de carga genéricos.
- Añadir `staleTime`, prefetch de detalle al hover y actualizaciones optimistas solo para cambios reversibles.
- Medir tamaño de bundle de los paneles extensos y cargar editores/diálogos pesados bajo demanda.

## Design system

### Estándares existentes

Tokens semánticos, radios, superficies, estados, `Button`, `Card`, `Input`, `Select`, `Dialog`, `Tabs`, `Badge`, `Tooltip`, `PageHeader`, `ActionBar`, `Pagination`, `Wizard`, `MobileDrawer` y `MobileFilterSheet`.

### Estandarizar después

1. `ResponsiveDialog`/`ResponsiveSheet`: diálogo desktop y hoja fullscreen móvil.
2. `DataGrid`: filtros, orden, selección, exportación, cards móviles, preferencias de columna y empty state.
3. `EntityPage`: cabecera con estado, contexto, acciones, tabs y timeline.
4. `FormSection` y `FieldHelp`: consistencia de agrupación, ayuda, error y requeridos.
5. `MetricCard` con periodo, procedencia, alcance y acción siguiente.
6. `PermissionGate` a nivel de acción, con estado disabled explicado donde corresponda.

## 20 quick wins

1. Hacer visibles Pipeline, CRM, Comunicaciones y Scorecards desde ATS según permiso.
2. Corregir "Gestion" y "suscripciónes".
3. Marcar con claridad rutas en integración y quitar sus CTA del menú hasta completarlas.
4. Mantener filtro, página y tab en URL para ATS, reportes e inventario.
5. Añadir empty state con CTA en todos los listados sin datos.
6. Usar `MobileFilterSheet` en cada listado que tenga más de dos filtros.
7. Sustituir diálogos largos por `ResponsiveDialog`.
8. Añadir confirmación contextual y undo a archivado/borrado reversible.
9. Mostrar ámbito tenant/sucursal en encabezados de analítica.
10. Añadir fecha de actualización/procedencia a métricas.
11. Establecer un patrón único de error/reintento por consulta.
12. Añadir labels visibles a inputs que hoy dependen de placeholder.
13. Normalizar los CTA: una acción primaria por encabezado.
14. Dar a toda tabla una versión tarjeta móvil.
15. Añadir help text a acciones de permisos/suscripción bloqueados.
16. Resolver el foco y scroll tras abrir/cerrar modales.
17. Añadir tooltip a icon-only actions.
18. Separar acciones destructivas visualmente y exigir razón cuando afecten trazabilidad.
19. Añadir "recientes" y entidades al buscador global.
20. Crear pruebas de regresión visual y navegación para 320-1440 px.
