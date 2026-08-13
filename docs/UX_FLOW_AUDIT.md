# Auditoría de flujos UX

| Flujo | Acciones actuales | Riesgo UX | Recomendación | Dependencia backend |
| --- | --- | --- | --- | --- |
| Crear empresa | Admin SaaS abre Empresas, completa dialog, crea. | Registro público bloqueado; alta no guiada. | Wizard con validación de slug, admin y plan. | Crear tenant, suscripción, usuario transaccional. |
| Crear sucursal | Seleccionar empresa, crear/editar sucursal. | Alcance del cambio poco visible. | Preselección de tenant, resumen de usuarios/activos afectados. | Branch CRUD y scope. |
| Crear usuario | Usuarios, dialog, rol y sucursal. | Sin invitación/revocación claramente centralizada. | Identidad → acceso → revisión. | User/role/branch assignment. |
| Asignar rol | Crear/editar roles. | Alto riesgo de escalamiento involuntario. | Matriz por módulo, diff de permisos y confirmación. | Role definitions/permisos efectivos. |
| Publicar vacante | Wizard, revisión y publicación. | Requisición/pipeline/ubicación fragmentados. | Requisición → contenido → pipeline → revisión. | Vacancy, requisition, stages, image upload. |
| Aplicar | Seleccionar vacante, completar formulario, CV/consentimiento. | Pérdida de progreso al abandonar. | Borrador y reanudar con aviso de privacidad. | Public vacancy, parsing, application. |
| Revisar candidato | Lista/pipeline → detalle. | Datos repartidos. | Ficha 360 con tabs y una acción de etapa primaria. | Application, timeline, resume signed URL. |
| Cambiar etapa | Pipeline/detalle, reglas y motivo. | Puede ocultar campos obligatorios. | Preflight que enumere requisito, aprobación y SLA. | Stage transition validation/audit. |
| Agendar entrevista | Elegir aplicación, participantes/disponibilidad, enviar. | Sobrecarga en diálogo. | Participantes → slots → comunicación. | Calendar/invitation/availability. |
| Contratar | Desde candidato aprobado, cargo/fecha/plantilla. | Dialog extenso. | Dos pasos y confirmación del rollback. | Hire transaction/onboarding flow. |
| Iniciar onboarding | Crear/aplicar plantilla o por contratación. | Entidades mezcladas. | Bandeja → detalle → checklist. | Flow/template/tasks. |
| Solicitar documentos | Tarea/documento/estado. | Sin jerarquía clara entre requisito y evidencia. | Acción desde tarea con estado de revisión. | Upload, review, lifecycle. |
| Asignar curso | Gestión/rutas/asignaciones. | Administración vs. alumno separados. | Seleccionar audiencia → curso/ruta → fecha. | Assignments/paths. |
| Completar curso | Curso → lección → progreso. | Offline y continuidad PENDIENTE. | Progreso local/sincronización diferida. | Progress/launch. |
| Presentar evaluación | Preguntas → enviar. | Falta prevención avanzada de fraude. | Progreso, guardado de respuesta, revisar antes de enviar. | Attempts/answers/submit. |
| Emitir certificado | Política y curso completado. | Renovación no visible en flujo. | Estado, vencimiento y descargar/compartir. | Certificate policy/issue. |
| Crear inventario | Catálogo/activo/stock. | Diferentes pantallas para la misma tarea. | Catálogo → stock → serializado/activo. | Catalog, warehouse, asset. |
| Asignar activo | Activo → persona → evidencia. | Custodia no siempre confirmada por receptor. | Persona, condición, evidencia, aceptación. | Assignment/evidence. |
| Consultar productividad | Dashboard por sucursal. | Riesgo de interpretar IA como decisión laboral. | Contexto, periodo, evidencia, revisión humana. | Overview/alerts/insights. |

## Reducción de fricción

- Mantener contexto de tenant/sucursal visible en todo flujo y conservar filtros al volver.
- Convertir operaciones de alto impacto en wizard de 2-4 pasos, no modales con todos los campos.
- Usar preflight para cambios que pueden fallar por permisos, estado, SLA o dependencias.
- Mostrar resultado y próximo paso tras mutaciones, no solo un toast.
