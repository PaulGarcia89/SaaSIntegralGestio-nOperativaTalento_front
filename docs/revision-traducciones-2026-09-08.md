# Revisión de traducciones ES / EN — 8 de septiembre de 2026

## Alcance y evidencia

Se revisaron estáticamente las 118 rutas y sus dependencias con `scripts/audit-i18n.py`. Las cifras son indicios de textos fijos, no certificación visual: el detector usa expresiones regulares, puede incluir falsos positivos y no detecta todos los textos procedentes del backend ni todas las dependencias. Los nombres propios, contenido de cursos y datos introducidos por usuarios no deben traducirse automáticamente.

## Corregido

`/admin/dashboard`: títulos, descripciones, botones, accesos, conteos, estados, roles, módulos, fechas, renovación y etiqueta de auditoría sin acción. Usa el selector de idioma existente y catálogos ES/EN. Se añadieron pruebas de cobertura de claves y formatos.

## Pendientes detectados en las demás pantallas

1. Capacitación: listado, reproductor, evaluaciones, certificados, resultados, integraciones y rutas; textos en componentes compartidos y mensajes de avance.
2. Inventarios: activos, entregas, devoluciones, compras y almacén; restaurante tiene navegación parcialmente traducida, pero formularios y reportes conservan textos fijos.
3. Administración: usuarios, roles, empresa, suscripciones y auditoría; el dashboard corregido no corrige automáticamente estos destinos.
4. Personas, incorporación, reclutamiento y productividad: existen traducciones, pero permanecen mensajes, formularios y etiquetas fijas.

Para cada grupo: extraer los textos a claves semánticas, añadir ES/EN, pasar el idioma a formatos y etiquetas, probar estados vacío/error/carga, diálogos y cambio ES→EN→ES. No alterar ni traducir los datos de la empresa. No se debe considerar terminado un módulo solo porque cambie su menú.

## Salida del detector después de corregir el dashboard

El detector puede seguir marcando una ruta por componentes compartidos. Cada hallazgo requiere revisión contextual.

```text
PANTALLAS ANALIZADAS: 118  (página + su árbol de componentes)
  ✔ cambian de idioma enteras       31
  ~ cambian a medias                55
  ✘ no cambian nada                 32

=== NO CAMBIAN NADA ===
    185 cadenas   /training/learn/[courseId]
    160 cadenas   /training
    107 cadenas   /training/evaluations
    107 cadenas   /training/certificates
     88 cadenas   /inventory/returns
     88 cadenas   /inventory/assets
     88 cadenas   /inventory/deliveries
     64 cadenas   /training/results
     56 cadenas   /admin/tenants
     54 cadenas   /admin/subscription
     53 cadenas   /training/integrations
     53 cadenas   /inventory/purchases
     52 cadenas   /training/paths
     51 cadenas   /inventory/assets/dashboard
     49 cadenas   /inventory/warehouse
     48 cadenas   /admin/users
     43 cadenas   /admin/roles
     39 cadenas   /onboarding/dashboard
     32 cadenas   /admin/company
     30 cadenas   /admin/company-registrations
     29 cadenas   /inventory/maintenance
     27 cadenas   /admin
     25 cadenas   /training/intelligence
     25 cadenas   /admin/audit
     22 cadenas   /admin/billing
     19 cadenas   /admin/company/subscription
     15 cadenas   /inventory
     14 cadenas   /certificates/verify/[code]
     12 cadenas   /inventory/audit
     12 cadenas   /inventory/analytics
     10 cadenas   /inventory/scan
      7 cadenas   /inventory/my-assets

=== CAMBIAN A MEDIAS (las 25 peores) ===
    572 sueltas /  185 traducidas   /inventory/restaurant/[...slug]
    572 sueltas /  185 traducidas   /inventory/restaurant/dashboard
    270 sueltas /   41 traducidas   /training/content
    270 sueltas /   41 traducidas   /training/content/[courseId]
    270 sueltas /   41 traducidas   /training/content/new
    130 sueltas /   25 traducidas   /onboarding/documents
    109 sueltas /  224 traducidas   /ats/candidates/[id]/avanzado
     86 sueltas /   28 traducidas   /employees/[id]
     75 sueltas /   84 traducidas   /employees
     74 sueltas /   28 traducidas   /admin/integrations
     74 sueltas /   84 traducidas   /employees/new
     74 sueltas /   84 traducidas   /employees/import
     72 sueltas /   28 traducidas   /admin/automations
     64 sueltas /   28 traducidas   /employees/[id]/edit
     57 sueltas /  191 traducidas   /ats/interviews
     39 sueltas /    3 traducidas   /admin/modules
     38 sueltas /    3 traducidas   /productivity/dashboard
     35 sueltas /   28 traducidas   /productivity/cameras
     33 sueltas /    3 traducidas   /admin/company/career-portal
     33 sueltas /   52 traducidas   /ats/communications
     32 sueltas /   28 traducidas   /admin/plans
     29 sueltas /   28 traducidas   /reports
     25 sueltas /   25 traducidas   /onboarding/compliance
     23 sueltas /   57 traducidas   /ats/scorecards
     19 sueltas /   28 traducidas   /onboarding/operations

```
