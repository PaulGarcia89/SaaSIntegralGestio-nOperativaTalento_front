# Roadmap UX/UI priorizado

## Sprint 1 - P0/P1 de confianza y tareas críticas

- Completar o retirar de navegación las rutas capability/placeholder.
- Implementar `ResponsiveDialog` y migrar contratación, onboarding, entrevistas, automatización, compras y cámara/zona.
- Convertir cámaras y zonas en flujo seguro: validación, prueba, zona visual, error y consentimiento/privacidad.
- Añadir pruebas de acceso a ruta/botón/API por tenant, sucursal, rol, módulo y suscripción.

## Sprint 2 - Navegación y flujos

- Exponer Pipeline, CRM, Comunicaciones y Scorecards dentro de ATS.
- Crear bandejas por rol: recruiter, HR, instructor, inventory manager, supervisor y candidate.
- Persistir contexto, filtros, tabs y página en URL.
- Añadir "recientes" y entidades autorizadas al buscador global.

## Sprint 3 - Tablas y formularios

- Construir `DataGrid` responsive con filtros, orden, selección, exportación y preferencias de columna.
- Reducir onboarding a bandeja, expediente y biblioteca.
- Aplicar wizard con borradores a empresa, vacante, contratación, compra y automatización.

## Sprint 4 - Dashboards

- Definir un dashboard de próxima acción por rol, no un dashboard universal.
- Añadir ámbito, periodo, fecha de actualización, fuente y drill-down a cada KPI.
- Habilitar filtros guardados y vistas compartidas respaldadas por backend.

## Sprint 5 - Mobile

- Regresión visual automatizada en 320, 360, 375, 390, 430, 768, 1024 y 1440 px.
- Ningún dialog largo en móvil; usar hoja/pantalla completa.
- Cards móviles equivalentes para todas las tablas y CTA fijo cuando haya un formulario largo.

## Sprint 6 - Accesibilidad y design system

- Auditoría WCAG 2.1 AA manual/automática: contraste tenant, teclado, lector de pantalla, zoom, reduced motion.
- Estandarizar `EntityPage`, `FormSection`, `PermissionGate`, `DataGrid` y estados vacíos/errores.
- Corregir copy, nomenclatura y mezcla de términos en todos los módulos.

## Sprint 7 - Funciones avanzadas

- Borradores/autoguardado, comentarios, timeline y favoritos según necesidad por entidad.
- Inbox de comunicación realmente bidireccional y centro de notificaciones agrupado.
- Personalización de paneles y automatizaciones con simulación/observabilidad.

## Diez mejoras de mayor impacto

1. Completar las rutas administrativas actualmente parciales.
2. Reorganizar navegación ATS alrededor del pipeline del recruiter.
3. Dividir onboarding documental en tres vistas coordinadas.
4. Estandarizar DataGrid y hojas móviles.
5. Añadir editor seguro de cámaras/zona con verificación.
6. Convertir alta de empresa y vacante en wizard con borrador.
7. Construir búsqueda global de entidades autorizadas.
8. Dashboard por rol con próxima acción y SLA.
9. Pruebas de permisos multiempresa y visual móvil como gate de despliegue.
10. Auditoría WCAG y contraste de branding por tenant.
