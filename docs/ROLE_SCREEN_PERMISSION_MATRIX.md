# Matriz de rol, pantalla y permiso

Leyenda: **C** controla, **E** edita, **V** ve, **P** propio, **A** asignado, **—** sin acceso. La matriz es UX; el backend debe validar el permiso específico y alcance tenant/sucursal en cada endpoint.

| Función | Super Admin | Tenant Admin | HR | Recruiter | Interviewer | Instructor | Supervisor | Inventory | Employee | Candidate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Gobierno de empresas/planes | C | — | — | — | — | — | — | — | — | — |
| Empresa, sucursales, usuarios, roles | C | C | V | — | — | — | — | — | — | — |
| Automatizaciones | C | C | E | — | — | — | — | — | — | — |
| Vacantes | C | C | E | E | V | — | — | — | — | — |
| Candidatos y pipeline | C | C | E | E | A | — | — | — | — | P |
| Entrevistas | C | C | E | E | A/E | — | — | — | — | P |
| Scorecards | C | C | E | E | E | — | — | — | — | — |
| Comunicaciones ATS | C | C | E | E | A | — | — | — | — | P |
| Onboarding | C | C | E | V | — | — | V | A | P | P |
| Firma | C | C | E | V | — | — | — | — | P | P |
| Cursos y asignaciones | C | C | E | V | — | C | V | — | P | — |
| Evaluaciones/certificados | C | C | E | — | — | C | — | — | P | — |
| Inventario y custodia | C | C | V | — | — | — | V | C | P | — |
| Productividad agregada | C | C | V | — | — | — | V | — | P limitado | — |
| Cámaras y zonas | C | C | — | — | — | — | — | — | — | — |
| Reportes | C | C | V | V ATS | — | V formación | V equipo | V inventario | P | — |
| Notificaciones | C | C | P | P | P | P | P | P | P | P |

## Permisos de navegación actuales

- Dashboard: `dashboard.view`
- ATS: `jobs.*`, `candidates.*`, `applications.*`, `interviews.*`, `scorecards.*`
- Onboarding: `onboarding.view`, `onboarding.manage`, `documents.*`
- Formación: `training.*`, `courses.*`, `assessments.*`, `certificates.*`
- Inventario: `inventory.*`, `assets.*`
- Productividad: `productivity.view`, `productivity.manage`
- Administración: `admin.*`, `users.*`, `roles.*`, `branches.*`, `tenants.*`, `subscriptions.*`
- Reportes/notificaciones/perfil: `reports.*`, `notifications.view`, `profile.*`

## Controles obligatorios

1. Ocultar enlaces no autorizados, pero también proteger rutas y botones de mutación.
2. No inferir permisos solo por rol; consumir `effectivePermissions`.
3. Incluir `tenantId`/`branchId` en cada consulta que requiera scope y hacer que el backend lo valide.
4. Refrescar permisos al cambiar de rol, plan, módulo, feature flag o sucursal.
5. Probar matriz por rol contra Railway antes de publicar cambios de política.

Nota: el rol `supervisor` también debe conservar acceso de solo lectura al inventario de restaurante (`restaurant_inventory.view`) para que la navegación y el guard de módulo sean consistentes.
