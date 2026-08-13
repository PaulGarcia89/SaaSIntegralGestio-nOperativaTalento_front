# Hoja de Ruta de Mejoras de Usabilidad

## Top 10 problemas por impacto

| Prioridad | Problema | Usuario | Impacto | Complejidad |
| --- | --- | --- | ---: | ---: |
| P1 | Capability pages en Gobierno SaaS y Empleados. | Superadmin, supervisor | 5 | 3 |
| P1 | Formularios extensos en diálogos. | ATS, onboarding, capacitación, inventario | 5 | 3 |
| P1 | Inicio no prioriza siempre la siguiente tarea por rol. | Todos | 5 | 3 |
| P1 | Cobertura móvil interna y E2E limitada. | Todos móviles | 5 | 3 |
| P2 | Múltiples entidades en CRM, onboarding e inventario. | Operadores | 4 | 4 |
| P2 | Analítica con poca orientación a acción. | HR, supervisores | 4 | 2 |
| P2 | Filtros/bulk de alta densidad. | ATS y reportes | 4 | 2 |
| P2 | Ayuda insuficiente en términos técnicos. | Usuarios nuevos | 3 | 1 |
| P2 | Estados vacíos no normalizados por módulo. | Todos | 3 | 2 |
| P3 | Falta guía de patrones responsive. | Equipo de producto | 3 | 1 |

## 20 quick wins

| # | Pantalla | Cambio | Impacto | Esfuerzo |
| ---: | --- | --- | --- | --- |
| 1 | Sidebar | Resaltar "Mi trabajo" según rol. | Descubribilidad | S |
| 2 | Dashboard | Tres tareas antes de KPI secundarios. | Priorización | S |
| 3 | ATS | Renombrar Scorecards como "Evaluaciones de entrevista". | Aprendizaje | S |
| 4 | ATS | Tooltip/ayuda para Pipeline y CRM. | Aprendizaje | S |
| 5 | Candidatos | Contador visible de filtros activos. | Eficiencia | S |
| 6 | Entrevistas | Resumen de selección persistente. | Prevención de errores | M |
| 7 | Onboarding | "Siguiente responsable" en expediente. | Acción clara | S |
| 8 | Cursos | CTA "Crear desde plantilla". | Velocidad | S |
| 9 | Inventario | CTA de entrega en detalle del activo. | Eficiencia | S |
| 10 | Reportes | Resumen de filtros y periodo aplicado. | Claridad | S |
| 11 | Errores | Añadir requestId cuando backend lo entregue. | Soporte | S |
| 12 | Vacíos | CTA estándar por entidad. | Activación | S |
| 13 | Móvil | Convertir filtros avanzados en hoja. | Usabilidad | M |
| 14 | Móvil | Footer fijo en formularios largos. | Finalización | M |
| 15 | Admin | Confirmación de impacto para roles y módulos. | Seguridad | S |
| 16 | Candidato | Ampliar borrador a cuenta autenticada. | Conversión | M |
| 17 | Productividad | Acción sugerida por alerta. | Decisión | S |
| 18 | Navegación | Mostrar recientes por rol. | Eficiencia | M |
| 19 | Accesibilidad | Axe sobre rutas autenticadas críticas. | Calidad | M |
| 20 | Pruebas | Añadir viewports iPhone/Android/tablet. | Prevención de regresión | M |

## Fases

### Fase 1 - Fundaciones (P1)

1. Implementar `ResponsiveDialog` y normalizar formularios móviles.
2. Añadir inicio por rol: pendientes, alertas y acción principal.
3. Ocultar o completar las capability pages.
4. Ampliar Playwright a 320, 375, 390, 430, 768 y 1024 px.

### Fase 2 - Flujos frecuentes (P1/P2)

1. ATS: entrevista, decisión, candidato y filtros.
2. Onboarding: bandeja, expediente y biblioteca de plantillas.
3. Capacitación: wizard y gestión de cursos móvil.
4. Inventario: detalle secuencial y entrega/devolución.

### Fase 3 - Claridad operacional (P2)

1. Dashboards orientados a tareas y excepciones.
2. Vistas guardadas y filtros persistentes desde backend.
3. Estados vacíos/error/permiso coherentes y con CTA.
4. Glosario de términos y ayuda contextual.

### Fase 4 - Validación continua (P2/P3)

1. Pruebas moderadas con 5 usuarios por rol crítico.
2. Métricas: tiempo de tarea, abandono, errores y clics.
3. Auditoría WCAG interna y validación en Safari iOS/Android.
4. Presupuesto de rendimiento móvil por ruta crítica.

## Criterios de salida

- Todas las rutas visibles permiten completar una acción real o se ocultan.
- Las tareas frecuentes funcionan sin scroll horizontal a 320 px.
- Cada acción crítica tiene carga, éxito, error recuperable y preservación de datos.
- Ninguna adaptación móvil evade tenant, sucursal, rol, permisos, módulo, feature flag o suscripción.
- Los flujos ATS, onboarding, capacitación e inventario pasan E2E por rol y viewport.

## Variables de certificación

Las pruebas productivas nunca deben usar usuarios de operación. Configura una cuenta dedicada y datos aislados antes de ejecutar `pnpm test:certify:critical`:

- `E2E_BACKEND_API_URL`
- `E2E_CERTIFICATION_ENABLED=true`
- `E2E_CERTIFICATION_EMAIL`
- `E2E_CERTIFICATION_PASSWORD`
- `E2E_CERTIFICATION_BRANCH_ID`
- Variables existentes `E2E_ONBOARDING_*` y `E2E_ATS_*` para mutaciones controladas.

El flujo ATS se ejecuta desde `tests/ats-staging/ats-lifecycle.spec.ts`; onboarding, seguridad de alcance, capacitación e inventario se agrupan en la configuración crítica. Ejecutar únicamente contra un tenant de certificación, nunca sobre información de clientes.
