import type { ModuleKey, PermissionKey, RoleKey, SubscriptionAccessState } from "@/lib/contracts";

export type NavGroup = "Inicio" | "Personas" | "Productividad" | "Reclutamiento" | "Aprendizaje" | "Operaciones" | "Inventario de activos" | "Inventario de restaurante" | "Analítica" | "Administración" | "Gobierno de plataforma";
export type NavItem = { href: string; label: string; group: NavGroup; section: NavSection; module: ModuleKey; permission: PermissionKey; requiredPermissions: PermissionKey[]; audience: "shared" | "saas" | "tenant"; featureFlag: string; available: boolean; requiresCommercialModule?: boolean; showInNavigation?: boolean; subscriptionStates?: SubscriptionAccessState[]; branchRequired?: boolean; roles?: RoleKey[]; strictRoles?: boolean; icon: "dashboard" | "notifications" | "reports" | "profile" | "vacancies" | "candidates" | "interviews" | "documents" | "signatures" | "training" | "evaluations" | "productivity" | "inventory" | "admin" | "users" | "roles" | "company" | "tenants" | "branches" | "modules" | "subscription" | "queues" };
const live: SubscriptionAccessState[] = ["active", "trial", "grace_period"];


/* ==========================================================================
   SECCIONES POR INTENCIÓN
   ==========================================================================
   El menú tenía 90 entradas repartidas en 10 grupos que mezclaban intenciones:
   «Operaciones» acumulaba 35 ítems de restaurante junto a productividad y
   activos, y «Analítica» juntaba un panel de auditoría —algo que exige actuar—
   con un comparativo multiunidad —algo que se va a consultar—. Además, dos
   grupos declarados en el tipo (`Inventario de activos`, `Inventario de
   restaurante`) no los usaba NINGÚN ítem.

   La sección responde a «¿a qué vengo?», el grupo sigue respondiendo a «¿de
   qué área es?». Son dos ejes distintos y ahora conviven: la barra lateral
   muestra secciones, y dentro de cada sección agrupa por área.

   Se AÑADE un campo; no se toca `group`, ni `href`, ni `permission`, ni
   `module`, ni `roles`. Por eso ninguna política de acceso cambia y ningún
   enlace guardado se rompe.
   ========================================================================== */

export type NavSection =
  | "inicio"
  | "ats"
  | "onboarding"
  | "training"
  | "people"
  | "productivity"
  | "asset_inventory"
  | "restaurant_inventory"
  | "reportes"
  | "administracion"
  | "plataforma";

/**
 * Una sección por módulo.
 *
 * Contratar un módulo añade su sección entera; no contratarlo la quita entera.
 * Antes las secciones agrupaban por intención y repartían cada módulo entre
 * tres o cuatro sitios, así que al no contratar uno quedaban huecos por todo
 * el menú en vez de desaparecer un bloque.
 *
 * «Inicio» es la excepción deliberada: reúne el panel y el perfil, que no se
 * contratan —están siempre— y son una pantalla cada uno.
 */
export const navSections: ReadonlyArray<{ id: NavSection; label: string; hint: string }> = [
  { id: "inicio", label: "Inicio", hint: "Tu punto de partida" },
  { id: "ats", label: "Reclutamiento", hint: "Vacantes, candidatos y contratación" },
  { id: "onboarding", label: "Incorporación", hint: "Documentos y firmas de quien entra" },
  { id: "training", label: "Capacitación", hint: "Cursos, evaluaciones y certificados" },
  // Personas y Productividad eran UNA sección, «Personas y productividad»,
  // aunque el backend las trata como cosas distintas: /employees se protege
  // solo por permiso (`employees.read`) y /productivity exige además el
  // módulo AI_PRODUCTIVITY. Compartir sección hacía que una empresa sin
  // Productividad contratada perdiera también el directorio de empleados,
  // que sí tenía derecho a ver.
  { id: "people", label: "Personas", hint: "Empleados, expedientes y documentos" },
  { id: "productivity", label: "Productividad", hint: "Cámaras, zonas e indicadores" },
  { id: "asset_inventory", label: "Inventario de activos", hint: "Equipos, entregas y devoluciones" },
  { id: "restaurant_inventory", label: "Inventario de restaurante", hint: "Ingredientes, recetas y consumo" },
  { id: "reportes", label: "Reportes", hint: "Lo que se consulta y se exporta" },
  { id: "administracion", label: "Administración", hint: "Cómo se configura la empresa" },
  { id: "plataforma", label: "Gobierno de plataforma", hint: "Alcance multiempresa" },
];

/**
 * Pantallas que vigilan, no que analizan.
 *
 * La diferencia práctica: una pantalla de supervisión existe porque algo puede
 * estar mal y alguien tiene que actuar —un vencimiento, un descuadre, una
 * merma, una alerta—. Una de reportes existe para responder una pregunta.
 * Mezclarlas es lo que hacía que las alertas de vencimiento se perdieran entre
 * los comparativos de margen.
 */

/**
 * Pantallas de análisis que viven en un grupo de área, no en «Analítica».
 *
 * `/ats/analytics` está declarada en el grupo «Reclutamiento» pese a ser una
 * pantalla de análisis; lo detectó la prueba de secciones. Se corrige aquí y no
 * cambiando su `group`, porque el grupo sigue respondiendo a «¿de qué área
 * es?» y la respuesta —reclutamiento— es correcta.
 */

/**
 * Deriva la sección de un ítem.
 *
 * Se deriva en vez de declararse ítem a ítem porque 90 campos escritos a mano
 * son 90 oportunidades de equivocarse, y porque la regla general acierta en la
 * gran mayoría. Las excepciones están arriba, enumeradas y probadas.
 */
export function sectionForNavItem(item: { href: string; group: NavGroup; module: ModuleKey }): NavSection {
  // La sección es el módulo. Las dos excepciones son de audiencia, no de
  // intención: el módulo `admin` sirve a dos públicos distintos —la empresa y
  // la plataforma— y cada uno necesita su bloque.
  if (item.group === "Gobierno de plataforma") return "plataforma";
  if (item.module === "admin") return "administracion";
  if (item.module === "dashboard" || item.module === "profile") return "inicio";
  // Las alertas no son un módulo que se opere, son una capacidad transversal:
  // una sección con un único elemento llamado igual que ella —«Alertas ›
  // Alertas»— no es una sección, es una fila con un envoltorio.
  if (item.module === "notifications") return "administracion";
  if (item.module === "reports") return "reportes";
  return item.module as NavSection;
}

const configuredNavigation: Array<Omit<NavItem, "featureFlag" | "available" | "requiredPermissions" | "section">> = [
  { href: "/dashboard", label: "Inicio", group: "Inicio", module: "dashboard", permission: "dashboard.view", audience: "shared", icon: "dashboard" },
  { href: "/profile", label: "Mi perfil", group: "Inicio", module: "profile", permission: "profile.view", audience: "shared", icon: "profile" },
  // Personas es una capacidad base: el backend no tiene módulo comercial
  // para ella y protege /employees solo por permiso. `requiresCommercialModule`
  // se apaga abajo para el módulo `people`, igual que para `admin`.
  // Cada módulo abre en su «Dashboard»: una página con ese nombre, la primera
  // de su sección. Las rutas anteriores (/people, /ats, /productivity,
  // /inventory/restaurant) redirigen a ella y se conservan ocultas en el menú
  // para no romper enlaces guardados ni las pruebas de acceso.
  { href: "/people/dashboard", label: "Dashboard", group: "Personas", module: "people", permission: "employees.read", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "dashboard", roles: ["admin_saas", "admin_empresa", "supervisor"] },
  { href: "/people", label: "Resumen de personas", group: "Personas", module: "people", permission: "employees.read", audience: "shared", subscriptionStates: live, branchRequired: true, showInNavigation: false, icon: "dashboard", roles: ["admin_saas", "admin_empresa", "supervisor"] },
  { href: "/employees", label: "Empleados", group: "Personas", module: "people", permission: "employees.read", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "users", roles: ["admin_saas", "admin_empresa", "supervisor"] },
  { href: "/onboarding/dashboard", label: "Dashboard", group: "Personas", module: "onboarding", permission: "onboarding.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "dashboard" },
  { href: "/onboarding/documents", label: "Incorporaciones", group: "Personas", module: "onboarding", permission: "onboarding.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "documents" },
  { href: "/onboarding/signatures", label: "Documentos y firmas", group: "Personas", module: "onboarding", permission: "onboarding.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "signatures" },
  { href: "/ats/dashboard", label: "Dashboard", group: "Reclutamiento", module: "ats", permission: "applications.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "dashboard", roles: ["admin_saas", "admin_empresa", "rrhh", "reclutador"] },
  { href: "/ats", label: "Hoy", group: "Reclutamiento", module: "ats", permission: "applications.view", audience: "shared", subscriptionStates: live, branchRequired: true, showInNavigation: false, icon: "dashboard", roles: ["admin_saas", "admin_empresa", "rrhh", "reclutador"] },
  { href: "/ats/vacancies", label: "Vacantes", group: "Reclutamiento", module: "ats", permission: "jobs.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "vacancies", roles: ["admin_saas", "admin_empresa", "rrhh", "reclutador"] },
  // Fusionada dentro de "Postulaciones" como su vista "Por fases". La ruta y su
  // política de acceso se conservan para no romper enlaces guardados ni las
  // pruebas de permisos, pero deja de ocupar un sitio en el menú: dos entradas
  // al mismo destino es la duplicación que este rediseño vino a eliminar.
  { href: "/ats/pipeline", label: "Pipeline", group: "Reclutamiento", module: "ats", permission: "applications.view", audience: "shared", subscriptionStates: live, branchRequired: true, showInNavigation: false, icon: "candidates", roles: ["admin_saas", "admin_empresa", "rrhh", "reclutador"] },
  { href: "/ats/candidates", label: "Candidatos", group: "Reclutamiento", module: "ats", permission: "candidates.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "candidates", roles: ["admin_saas", "admin_empresa", "rrhh", "reclutador"] },
  { href: "/hiring/dashboard", label: "Dashboard de contratación", group: "Reclutamiento", module: "ats", permission: "applications.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "dashboard", showInNavigation: false, roles: ["admin_saas", "admin_empresa", "rrhh", "reclutador"] },
  { href: "/hiring", label: "Contrataciones", group: "Reclutamiento", module: "ats", permission: "applications.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "candidates", roles: ["admin_saas", "admin_empresa", "rrhh", "reclutador"] },
  { href: "/ats/talent-crm", label: "Base de talento", group: "Reclutamiento", module: "ats", permission: "candidates.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "candidates", roles: ["admin_saas", "admin_empresa", "rrhh", "reclutador"] },
  { href: "/ats/communications", label: "Comunicaciones", group: "Reclutamiento", module: "ats", permission: "applications.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "notifications", roles: ["admin_saas", "admin_empresa", "rrhh", "reclutador"] },
  { href: "/ats/interviews", label: "Entrevistas", group: "Reclutamiento", module: "ats", permission: "interviews.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "interviews", roles: ["admin_saas", "admin_empresa", "rrhh", "reclutador", "entrevistador"] },
  { href: "/ats/analytics", label: "Analítica ATS", group: "Reclutamiento", module: "ats", permission: "applications.view", audience: "shared", subscriptionStates: live, icon: "reports", roles: ["admin_saas", "admin_empresa", "rrhh", "reclutador"] },
  { href: "/ats/scorecards", label: "Evaluaciones de entrevista", group: "Reclutamiento", module: "ats", permission: "interviews.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "evaluations", roles: ["admin_saas", "admin_empresa", "rrhh", "reclutador"] },
  { href: "/training/dashboard", label: "Dashboard", group: "Aprendizaje", module: "training", permission: "training.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "dashboard" },
  { href: "/training", label: "Cursos", group: "Aprendizaje", module: "training", permission: "training.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "training" },
  { href: "/training/evaluations", label: "Evaluaciones", group: "Aprendizaje", module: "training", permission: "training.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "evaluations" },
  { href: "/training/results", label: "Resultados", group: "Aprendizaje", module: "training", permission: "training.view", audience: "shared", subscriptionStates: live, icon: "reports", roles: ["admin_saas", "admin_empresa", "instructor"] },
  { href: "/training/intelligence", label: "Inteligencia", group: "Aprendizaje", module: "training", permission: "training.manage", audience: "shared", subscriptionStates: live, icon: "reports", roles: ["admin_saas", "admin_empresa", "rrhh", "instructor"] },
  { href: "/training/certificates", label: "Certificados", group: "Aprendizaje", module: "training", permission: "training.view", audience: "shared", subscriptionStates: live, icon: "documents", roles: ["admin_saas", "admin_empresa", "instructor", "empleado"] },
  { href: "/training/content", label: "Gestionar cursos", group: "Aprendizaje", module: "training", permission: "training.manage", audience: "shared", subscriptionStates: live, icon: "training", roles: ["admin_saas", "admin_empresa", "rrhh", "instructor"] },
  { href: "/training/paths", label: "Rutas y cumplimiento", group: "Aprendizaje", module: "training", permission: "training.manage", audience: "shared", subscriptionStates: live, icon: "training", roles: ["admin_saas", "admin_empresa", "rrhh", "instructor"] },
  { href: "/training/integrations", label: "Integraciones formativas", group: "Aprendizaje", module: "training", permission: "training.integrations.manage", audience: "shared", subscriptionStates: live, icon: "training", roles: ["admin_saas", "admin_empresa", "rrhh", "instructor"] },
  { href: "/productivity/dashboard", label: "Dashboard", group: "Productividad", module: "productivity", permission: "productivity.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "dashboard", roles: ["admin_saas", "admin_empresa", "supervisor"] },
  { href: "/productivity", label: "Resumen de productividad", group: "Productividad", module: "productivity", permission: "productivity.view", audience: "shared", subscriptionStates: live, branchRequired: true, showInNavigation: false, icon: "productivity", roles: ["admin_saas", "admin_empresa", "supervisor"] },
  { href: "/productivity/cameras", label: "Cámaras y zonas", group: "Productividad", module: "productivity", permission: "productivity.manage", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "productivity", roles: ["admin_saas", "admin_empresa"] },
  // El selector entre los dos inventarios. No pertenece a ninguno de los dos
  // módulos: exigir `asset_inventory` hacía que una empresa con SOLO
  // restaurante recibiera «este módulo no está habilitado», que es falso. La
  // pantalla resuelve las cuatro combinaciones por su cuenta.
  { href: "/inventory", label: "Inventario", group: "Operaciones", module: "dashboard", permission: "dashboard.view", audience: "shared", subscriptionStates: live, branchRequired: true, showInNavigation: false, icon: "inventory", roles: ["admin_saas", "admin_empresa", "supervisor", "encargado_inventario", "empleado"] },
  { href: "/inventory/assets/dashboard", label: "Dashboard", group: "Operaciones", module: "asset_inventory", permission: "asset_inventory.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "dashboard", roles: ["admin_saas", "admin_empresa", "supervisor", "encargado_inventario", "empleado"] },
  { href: "/inventory/assets", label: "Activos", group: "Operaciones", module: "asset_inventory", permission: "asset_inventory.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "inventory", roles: ["admin_saas", "admin_empresa", "supervisor", "encargado_inventario", "empleado"] },
  { href: "/inventory/assets/warehouse", label: "Almacén y stock", group: "Operaciones", module: "asset_inventory", permission: "asset_inventory.manage", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "inventory", roles: ["admin_saas", "admin_empresa", "encargado_inventario"] },
  { href: "/inventory/assets/purchases", label: "Compras y proveedores", group: "Operaciones", module: "asset_inventory", permission: "asset_inventory.manage", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "inventory", roles: ["admin_saas", "admin_empresa", "encargado_inventario"] },
  { href: "/inventory/assets/maintenance", label: "Mantenimiento", group: "Operaciones", module: "asset_inventory", permission: "asset_inventory.manage", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "inventory", roles: ["admin_saas", "admin_empresa", "encargado_inventario"] },
  { href: "/inventory/scan", label: "Escanear activo", group: "Operaciones", module: "asset_inventory", permission: "asset_inventory.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "inventory", roles: ["admin_saas", "admin_empresa", "supervisor", "encargado_inventario"] },
  { href: "/inventory/my-assets", label: "Mis activos", group: "Operaciones", module: "asset_inventory", permission: "asset_inventory.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "inventory", roles: ["admin_saas", "admin_empresa", "supervisor", "encargado_inventario", "empleado"] },
  { href: "/inventory/assets/analytics", label: "Analítica de inventario", group: "Analítica", module: "asset_inventory", permission: "asset_inventory.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "reports", roles: ["admin_saas", "admin_empresa", "supervisor", "encargado_inventario"] },
  { href: "/inventory/assets/audit", label: "Auditoría de inventario", group: "Analítica", module: "asset_inventory", permission: "asset_inventory.manage", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "reports", roles: ["admin_saas", "admin_empresa", "encargado_inventario"] },
  { href: "/inventory/deliveries", label: "Entregas", group: "Operaciones", module: "asset_inventory", permission: "asset_inventory.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "inventory", roles: ["admin_saas", "admin_empresa", "encargado_inventario"] },
  { href: "/inventory/returns", label: "Devoluciones", group: "Operaciones", module: "asset_inventory", permission: "asset_inventory.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "inventory", roles: ["admin_saas", "admin_empresa", "encargado_inventario"] },
  { href: "/inventory/restaurant/dashboard", label: "Dashboard", group: "Operaciones", module: "restaurant_inventory", permission: "restaurant_inventory.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "dashboard", roles: ["admin_saas", "admin_empresa", "supervisor", "encargado_inventario"] },
  { href: "/inventory/restaurant", label: "Restaurante", group: "Operaciones", module: "restaurant_inventory", permission: "restaurant_inventory.view", audience: "shared", subscriptionStates: live, branchRequired: true, showInNavigation: false, icon: "inventory", roles: ["admin_saas", "admin_empresa", "supervisor", "encargado_inventario"] },
  { href: "/inventory/restaurant/ingredients", label: "Ingredientes", group: "Operaciones", module: "restaurant_inventory", permission: "restaurant_inventory.manage", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "inventory", roles: ["admin_saas", "admin_empresa", "encargado_inventario"] },
  { href: "/inventory/restaurant/receipts", label: "Entradas", group: "Operaciones", module: "restaurant_inventory", permission: "restaurant_inventory.manage", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "inventory", roles: ["admin_saas", "admin_empresa", "encargado_inventario"] },
  { href: "/inventory/restaurant/purchase-orders", label: "Órdenes de compra", group: "Operaciones", module: "restaurant_inventory", permission: "restaurant_inventory.manage", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "inventory", roles: ["admin_saas", "admin_empresa", "encargado_inventario"] },
  { href: "/inventory/restaurant/price-history", label: "Precios por proveedor", group: "Analítica", module: "restaurant_inventory", permission: "restaurant_inventory.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "reports", roles: ["admin_saas", "admin_empresa", "supervisor", "encargado_inventario"] },
  { href: "/inventory/restaurant/invoices", label: "Facturas OCR", group: "Operaciones", module: "restaurant_inventory", permission: "restaurant_inventory.manage", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "documents", roles: ["admin_saas", "admin_empresa", "encargado_inventario"] },
  { href: "/inventory/restaurant/recipes", label: "Recetas", group: "Operaciones", module: "restaurant_inventory", permission: "restaurant_inventory.manage", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "training", roles: ["admin_saas", "admin_empresa", "encargado_inventario"] },
  { href: "/inventory/restaurant/consumption", label: "Consumo", group: "Operaciones", module: "restaurant_inventory", permission: "restaurant_inventory.manage", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "reports", roles: ["admin_saas", "admin_empresa", "encargado_inventario"] },
  { href: "/inventory/restaurant/sales-import", label: "Importar ventas", group: "Operaciones", module: "restaurant_inventory", permission: "restaurant_inventory.manage", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "inventory", roles: ["admin_saas", "admin_empresa", "encargado_inventario"] },
  { href: "/inventory/restaurant/reports", label: "Reportes", group: "Analítica", module: "restaurant_inventory", permission: "restaurant_inventory.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "reports", roles: ["admin_saas", "admin_empresa", "supervisor", "encargado_inventario"] },
  { href: "/inventory/restaurant/analytics", label: "Análisis", group: "Analítica", module: "restaurant_inventory", permission: "restaurant_inventory.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "reports", roles: ["admin_saas", "admin_empresa", "supervisor", "encargado_inventario"] },
  { href: "/inventory/restaurant/costs", label: "Costos y rentabilidad", group: "Analítica", module: "restaurant_inventory", permission: "restaurant_inventory.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "reports", roles: ["admin_saas", "admin_empresa", "supervisor", "encargado_inventario"] },
  { href: "/inventory/restaurant/purchase-suggestions", label: "Sugerencias de compra", group: "Analítica", module: "restaurant_inventory", permission: "restaurant_inventory.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "reports", roles: ["admin_saas", "admin_empresa", "supervisor", "encargado_inventario"] },
  { href: "/inventory/restaurant/audit", label: "Auditoría", group: "Analítica", module: "restaurant_inventory", permission: "restaurant_inventory.manage", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "reports", roles: ["admin_saas", "admin_empresa", "encargado_inventario"] },
  { href: "/inventory/restaurant/production", label: "Producción", group: "Operaciones", module: "restaurant_inventory", permission: "restaurant_inventory.manage", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "reports", roles: ["admin_saas", "admin_empresa", "encargado_inventario"] },
  { href: "/inventory/restaurant/transfers", label: "Transferencias", group: "Operaciones", module: "restaurant_inventory", permission: "restaurant_inventory.manage", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "inventory", roles: ["admin_saas", "admin_empresa", "encargado_inventario"] },
  { href: "/inventory/restaurant/waste", label: "Desperdicios", group: "Operaciones", module: "restaurant_inventory", permission: "restaurant_inventory.manage", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "reports", roles: ["admin_saas", "admin_empresa", "encargado_inventario"] },
  { href: "/inventory/restaurant/lots", label: "Lotes", group: "Operaciones", module: "restaurant_inventory", permission: "restaurant_inventory.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "inventory", roles: ["admin_saas", "admin_empresa", "encargado_inventario"] },
  { href: "/inventory/restaurant/stock-counts", label: "Conteos", group: "Operaciones", module: "restaurant_inventory", permission: "restaurant_inventory.manage", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "inventory", roles: ["admin_saas", "admin_empresa", "encargado_inventario"] },
  { href: "/inventory/restaurant/expiry-alerts", label: "Alertas de vencimiento", group: "Operaciones", module: "restaurant_inventory", permission: "restaurant_inventory.expiry_alerts.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "notifications", roles: ["admin_saas", "admin_empresa", "supervisor", "encargado_inventario"] },
  { href: "/inventory/restaurant/count-schedules", label: "Conteos programados", group: "Operaciones", module: "restaurant_inventory", permission: "restaurant_inventory.counts.schedule", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "inventory", roles: ["admin_saas", "admin_empresa", "encargado_inventario"] },
  { href: "/inventory/restaurant/variance", label: "Teórico vs real", group: "Analítica", module: "restaurant_inventory", permission: "restaurant_inventory.variance.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "reports", roles: ["admin_saas", "admin_empresa", "supervisor", "encargado_inventario"] },
  { href: "/inventory/restaurant/shrinkage", label: "Merma", group: "Analítica", module: "restaurant_inventory", permission: "restaurant_inventory.shrinkage.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "reports", roles: ["admin_saas", "admin_empresa", "supervisor", "encargado_inventario"] },
  { href: "/inventory/restaurant/audit-log", label: "Auditoría inmutable", group: "Analítica", module: "restaurant_inventory", permission: "restaurant_inventory.audit.read", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "reports", roles: ["admin_saas", "admin_empresa", "encargado_inventario"] },
  { href: "/inventory/restaurant/forecast", label: "Pronóstico de demanda", group: "Analítica", module: "restaurant_inventory", permission: "restaurant_inventory.commercial.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "reports", roles: ["admin_saas", "admin_empresa", "supervisor", "encargado_inventario"] },
  { href: "/inventory/restaurant/branch-costs", label: "Costos por sucursal", group: "Analítica", module: "restaurant_inventory", permission: "restaurant_inventory.commercial.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "reports", roles: ["admin_saas", "admin_empresa", "supervisor"] },
  { href: "/inventory/restaurant/recipe-margins", label: "Margen por receta", group: "Analítica", module: "restaurant_inventory", permission: "restaurant_inventory.commercial.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "reports", roles: ["admin_saas", "admin_empresa", "supervisor", "encargado_inventario"] },
  { href: "/inventory/restaurant/unit-comparison", label: "Comparativo multiunidad", group: "Analítica", module: "restaurant_inventory", permission: "restaurant_inventory.commercial.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "reports", roles: ["admin_saas", "admin_empresa", "supervisor"] },
  { href: "/inventory/restaurant/commissary", label: "Comisariato", group: "Operaciones", module: "restaurant_inventory", permission: "restaurant_inventory.commissary.manage", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "inventory", roles: ["admin_saas", "admin_empresa", "encargado_inventario"] },
  { href: "/inventory/restaurant/purchase-budget", label: "Presupuesto de compras", group: "Analítica", module: "restaurant_inventory", permission: "restaurant_inventory.budgets.manage", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "reports", roles: ["admin_saas", "admin_empresa", "supervisor"] },
  { href: "/inventory/restaurant/adjustments", label: "Ajustes", group: "Operaciones", module: "restaurant_inventory", permission: "restaurant_inventory.manage", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "inventory", roles: ["admin_saas", "admin_empresa", "encargado_inventario"] },
  { href: "/inventory/restaurant/movements", label: "Movimientos", group: "Operaciones", module: "restaurant_inventory", permission: "restaurant_inventory.view", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "reports", roles: ["admin_saas", "admin_empresa", "encargado_inventario"] },
  { href: "/inventory/restaurant/settings", label: "Configuración", group: "Administración", module: "restaurant_inventory", permission: "restaurant_inventory.manage", audience: "shared", subscriptionStates: live, branchRequired: true, icon: "admin", roles: ["admin_saas", "admin_empresa", "encargado_inventario"] },
  { href: "/reports", label: "Reportes", group: "Analítica", module: "reports", permission: "reports.view", audience: "shared", subscriptionStates: live, icon: "reports" },
  { href: "/admin/dashboard", label: "Dashboard", group: "Administración", module: "admin", permission: "admin.view", audience: "tenant", icon: "dashboard" },
  { href: "/notifications", label: "Alertas", group: "Administración", module: "notifications", permission: "notifications.view", audience: "shared", icon: "notifications" },
  { href: "/admin/company", label: "Configuración de empresa", group: "Administración", module: "admin", permission: "admin.company", audience: "tenant", icon: "company" },
  { href: "/admin/branches", label: "Sucursales", group: "Administración", module: "admin", permission: "branches.view", audience: "tenant", requiresCommercialModule: false, icon: "branches" },
  { href: "/admin/users", label: "Usuarios", group: "Administración", module: "admin", permission: "admin.users", audience: "tenant", icon: "users" },
  { href: "/admin/roles", label: "Roles y permisos", group: "Administración", module: "admin", permission: "admin.roles", audience: "tenant", icon: "roles" },
  { href: "/admin/automations", label: "Automatizaciones", group: "Administración", module: "admin", permission: "admin.view", audience: "tenant", icon: "queues", roles: ["admin_saas", "admin_empresa"] },
  { href: "/admin/company/subscription", label: "Suscripción", group: "Administración", module: "admin", permission: "admin.subscription", audience: "tenant", icon: "subscription", roles: ["admin_saas", "admin_empresa"] },
  { href: "/admin", label: "Resumen administrativo", group: "Administración", module: "admin", permission: "admin.view", audience: "tenant", icon: "admin" },
  { href: "/admin/tenants", label: "Gestión de empresas", group: "Gobierno de plataforma", module: "admin", permission: "tenants.view", audience: "saas", icon: "tenants" },
  { href: "/admin/company-registrations", label: "Solicitudes de empresa", group: "Gobierno de plataforma", module: "admin", permission: "tenants.view", audience: "saas", icon: "tenants" },
  { href: "/admin/plans", label: "Planes", group: "Gobierno de plataforma", module: "admin", permission: "admin.subscription", audience: "saas", icon: "subscription" },
  { href: "/admin/modules", label: "Módulos", group: "Gobierno de plataforma", module: "admin", permission: "admin.company", audience: "saas", icon: "modules" },
  { href: "/admin/integrations", label: "Gobierno de integraciones", group: "Gobierno de plataforma", module: "admin", permission: "platform.integrations.manage", audience: "saas", icon: "queues", roles: ["admin_saas"], strictRoles: true },
  { href: "/admin/subscription", label: "Suscripciones", group: "Gobierno de plataforma", module: "admin", permission: "admin.subscription", audience: "saas", icon: "subscription" },
  { href: "/admin/billing", label: "Facturación", group: "Gobierno de plataforma", module: "admin", permission: "admin.subscription", audience: "saas", icon: "subscription" },
  { href: "/admin/global-users", label: "Usuarios globales", group: "Gobierno de plataforma", module: "admin", permission: "admin.users", audience: "saas", icon: "users" },
  { href: "/admin/audit", label: "Auditoría", group: "Gobierno de plataforma", module: "admin", permission: "audit.view", audience: "saas", icon: "reports" },
  { href: "/admin/settings", label: "Configuración", group: "Gobierno de plataforma", module: "admin", permission: "admin.company", audience: "saas", icon: "company" },
];

const unavailableRouteHrefs = new Set(["/admin/settings"]);

export const appNavigation: NavItem[] = configuredNavigation.map((item) => ({
  ...item,
  section: sectionForNavItem(item),
  requiredPermissions: [item.permission],
  featureFlag: `module.${item.module}`,
  // Las capacidades base se deciden por MÓDULO, no por el área en la que cae
  // la pantalla. Al mirar el área, `/inventory/restaurant/settings` —que está
  // en «Administración»— se libraba de la puerta del módulo, así que una
  // empresa sin el inventario de restaurante contratado veía igualmente su
  // sección con la configuración dentro.
  requiresCommercialModule: (["dashboard", "profile", "admin", "people"] as string[]).includes(item.module)
    ? false
    : item.requiresCommercialModule,
  available: !unavailableRouteHrefs.has(item.href),
}));

export function getRoutePolicy(pathname: string) { return [...appNavigation].sort((a, b) => b.href.length - a.href.length).find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)); }
export function isAudienceAllowed(audience: NavItem["audience"], role: RoleKey) { if (audience === "saas") return role === "admin_saas" || role === "admin_plataforma"; if (audience === "tenant") return role === "admin_saas" || role === "admin_plataforma" || role === "admin_empresa"; return true; }
export function isRoleAllowed(roles: NavItem["roles"], role: RoleKey, strictRoles = false) { if (!strictRoles && role === "admin_plataforma" && roles?.includes("admin_saas")) return true; return !roles || roles.includes(role); }
export type RouteAccessContext = { sessionValid: boolean; tenantAllowed: boolean; globalContext?: boolean; subscriptionStatus: SubscriptionAccessState; role: RoleKey; hasModule: (module: ModuleKey) => boolean; hasFeature: (featureFlag: string) => boolean; can: (permission: PermissionKey) => boolean; branchAvailable: boolean };
export type RouteAccessDecision = { allowed: boolean; code: "ALLOWED" | "AUTH_REQUIRED" | "TENANT_ACCESS_DENIED" | "SUBSCRIPTION_BLOCKED" | "MODULE_NOT_ENABLED" | "FEATURE_NOT_ENABLED" | "ROUTE_NOT_READY" | "ROLE_NOT_ALLOWED" | "PERMISSION_DENIED" | "BRANCH_REQUIRED"; reason: string; requestId?: string };
export function evaluateRouteAccess(policy: NavItem, context: RouteAccessContext): RouteAccessDecision {
  if (!context.sessionValid) return { allowed: false, code: "AUTH_REQUIRED", reason: "Tu sesión terminó o no pudo verificarse." };
  if ((context.role === "admin_saas" || context.role === "admin_plataforma") && context.globalContext) {
    if (policy.audience === "tenant" || policy.branchRequired) {
      return { allowed: false, code: policy.branchRequired ? "BRANCH_REQUIRED" : "ROLE_NOT_ALLOWED", reason: "Selecciona un contexto de empresa autorizado para acceder a esta sección." };
    }
    return policy.available
      ? { allowed: true, code: "ALLOWED", reason: "" }
      : { allowed: false, code: "ROUTE_NOT_READY", reason: "Esta función todavía no está disponible en el entorno productivo." };
  }
  if (!context.tenantAllowed) return { allowed: false, code: "TENANT_ACCESS_DENIED", reason: "La empresa seleccionada no pertenece a tu alcance autorizado." };
  if (policy.subscriptionStates && !policy.subscriptionStates.includes(context.subscriptionStatus)) return { allowed: false, code: "SUBSCRIPTION_BLOCKED", reason: "La suscripción actual no permite acceder a esta sección." };
  if (policy.requiresCommercialModule !== false && !context.hasModule(policy.module)) return { allowed: false, code: "MODULE_NOT_ENABLED", reason: "Esta función no está activa para la empresa." };
  if (policy.requiresCommercialModule !== false && !context.hasFeature(policy.featureFlag)) return { allowed: false, code: "FEATURE_NOT_ENABLED", reason: "Esta función no está habilitada para tu contexto." };
  if (!policy.available) return { allowed: false, code: "ROUTE_NOT_READY", reason: "Esta función todavía no está disponible en el entorno productivo." };
  if (!isAudienceAllowed(policy.audience, context.role) || !isRoleAllowed(policy.roles, context.role, policy.strictRoles)) return { allowed: false, code: "ROLE_NOT_ALLOWED", reason: "Esta sección no está asignada a tu perfil." };
  // El dashboard es la entrada base del workspace. El endpoint de datos sigue
  // validando autorización en backend, pero la navegación no debe bloquear la
  // sesión por una omisión del permiso sintético dashboard.view.
  if (policy.href === "/dashboard") return { allowed: true, code: "ALLOWED", reason: "" };
  if (!policy.requiredPermissions.every(context.can)) return { allowed: false, code: "PERMISSION_DENIED", reason: "No tienes el permiso necesario para esta acción." };
  if (policy.branchRequired && !context.branchAvailable) return { allowed: false, code: "BRANCH_REQUIRED", reason: "Selecciona una sucursal autorizada para continuar." };
  return { allowed: true, code: "ALLOWED", reason: "" };
}
export const candidateNavigation = [
  { href: "/", label: "Volver al sitio público", available: true },
  { href: "/jobs", label: "Vacantes", available: true },
  { href: "/apply", label: "Iniciar postulación", available: true },
  { href: "/application-status", label: "Mis postulaciones", available: true },
  { href: "/candidate/portal", label: "Centro del candidato", available: true },
  { href: "/candidate/training", label: "Aprendizaje", available: false },
  { href: "/candidate/evaluations", label: "Evaluaciones", available: false },
  { href: "/candidate/profile", label: "Perfil y privacidad", available: true },
] as const;


/** Secciones que contienen al menos un ítem visible, en el orden canónico. */
export function visibleSections(items: readonly NavItem[]): NavSection[] {
  const present = new Set(items.filter((item) => item.showInNavigation !== false).map((item) => item.section));
  return navSections.map((section) => section.id).filter((id) => present.has(id));
}

/** Ítems de una sección, agrupados por área y conservando el orden original. */
export function itemsBySection(items: readonly NavItem[], section: NavSection) {
  const visible = items.filter((item) => item.section === section && item.showInNavigation !== false);
  const groups: Array<{ group: NavGroup; items: NavItem[] }> = [];
  for (const item of visible) {
    const existing = groups.find((candidate) => candidate.group === item.group);
    if (existing) existing.items.push(item);
    else groups.push({ group: item.group, items: [item] });
  }
  return groups;
}

/** Sección a la que pertenece una ruta, para saber qué abrir en la barra. */
export function sectionForPath(items: readonly NavItem[], pathname: string): NavSection {
  const policy = getRoutePolicy(pathname);
  return policy?.section ?? "inicio";
}
