# Reportes por módulo

La sección general de Reportes se retiró del menú. `/reports` redirige a Inicio; ya no renderiza ni consulta el resumen consolidado. Las claves antiguas de permisos y módulos se conservan por compatibilidad con suscripciones existentes, sin usarse como requisito de estos accesos.

| Módulo | Apartado Reportes |
| --- | --- |
| Reclutamiento | `/ats/analytics`: analítica y exportaciones de ATS |
| Incorporación | `/onboarding/analytics`: cumplimiento, tiempos y riesgos |
| Capacitación | `/training/results`: resultados y cumplimiento |
| Personas | `/people/reports`: personal y cumplimiento documental por sucursal |
| Productividad | `/productivity/reports`: actividad, tiempos y cobertura por sucursal |
| Inventario de activos | `/inventory/assets/analytics`: indicadores de activos |
| Inventario de restaurante | `/inventory/restaurant/reports`: informes y costos existentes |
| Administración | `/admin/reports`: resumen administrativo de la empresa |

Cada acceso conserva el permiso, audiencia, rol y módulo correspondiente. Los reportes nuevos de Personas y Productividad consultan únicamente su endpoint de módulo y separan la caché por empresa y sucursal. No se consulta el antiguo endpoint agregado. Inicio y Mi perfil siguen siendo navegación base, no módulos de reportes.

Validación: TypeScript correcto; 70 pruebas de navegación y permisos aprobadas; ESLint de los archivos nuevos sin errores. Incluye rechazo de acceso por permiso, empresa ajena y módulo comercial deshabilitado, y confirma que el módulo legado `reports` no es requisito.
