import { PERMISSION_KEYS, type PermissionKey } from "@/lib/contracts";

/**
 * Los 97 permisos del producto, en lenguaje de persona.
 *
 * Por qué existe
 * --------------
 * La pantalla que gobierna quién ve qué mostraba las claves tal como están en
 * la base de datos: `courses.assign`, `applications.hire`,
 * `platform.tenant.impersonate`. Las 97 de golpe, en una sola fila envolvente,
 * sin agrupar, sin buscador y sin una palabra que explicara qué hace ninguna.
 * Un administrador de empresa veía mezclados sus permisos con los de la
 * plataforma.
 *
 * Es la única familia de códigos del sistema que no tenía traducción, y
 * justamente la que más se enseña: `ui-labels.ts` ya traducía roles, módulos,
 * estados de empresa, de usuario, de sucursal y alcances.
 *
 * Qué guarda cada entrada
 * -----------------------
 * · `label`   — qué permite hacer, en una frase corta y en infinitivo.
 * · `detail`  — la consecuencia concreta de darlo o quitarlo. No repite el
 *               rótulo: dice qué pantalla se abre, qué botón aparece o qué
 *               dato se puede tocar.
 * · `group`   — el área del producto, para poder plegar la matriz.
 * · `kind`    — `view` o `manage`. Sirve para detectar el error más común al
 *               componer un rol: dar permiso de gestionar sin el de ver, que
 *               produce un rol que no puede llegar a la pantalla que gestiona.
 *
 * Un permiso que el backend añada y aquí falte NO rompe la pantalla: se
 * muestra con su clave humanizada y en el grupo «Otros permisos», que es
 * mejor que ocultarlo —dejaría de poder asignarse— o que romper.
 */

export type PermissionGroup =
  | "general"
  | "ats"
  | "onboarding"
  | "training"
  | "productivity"
  | "assets"
  | "restaurant"
  | "reports"
  | "admin"
  | "platform"
  | "other";

export const PERMISSION_GROUP_LABELS: Record<PermissionGroup, string> = {
  general: "Acceso general",
  ats: "Reclutamiento",
  onboarding: "Incorporación",
  training: "Capacitación",
  productivity: "Productividad",
  assets: "Inventario de activos",
  restaurant: "Inventario de restaurante",
  reports: "Reportes",
  admin: "Administración de la empresa",
  platform: "Plataforma",
  other: "Otros permisos",
};

/** Orden en que se presentan los grupos: de lo cotidiano a lo excepcional. */
export const PERMISSION_GROUP_ORDER: PermissionGroup[] = [
  "general",
  "ats",
  "onboarding",
  "training",
  "productivity",
  "assets",
  "restaurant",
  "reports",
  "admin",
  "platform",
  "other",
];

export type PermissionInfo = {
  label: string;
  detail: string;
  group: PermissionGroup;
  kind: "view" | "manage";
};

const CATALOG: Partial<Record<PermissionKey, PermissionInfo>> = {
  /* ── Acceso general ─────────────────────────────────────────────────── */
  "dashboard.view": {
    label: "Entrar al inicio",
    detail: "Sin esto, quien inicia sesión no ve la pantalla de inicio ni sus pendientes.",
    group: "general",
    kind: "view",
  },
  "notifications.view": {
    label: "Ver sus notificaciones",
    detail: "Los avisos que le llegan a esa persona; no los de nadie más.",
    group: "general",
    kind: "view",
  },
  "profile.view": {
    label: "Ver su propio perfil",
    detail: "Sus datos personales y su configuración de cuenta.",
    group: "general",
    kind: "view",
  },
  "profile.update": {
    label: "Editar su propio perfil",
    detail: "Cambiar su nombre, su foto y sus preferencias.",
    group: "general",
    kind: "manage",
  },

  /* ── Reclutamiento ──────────────────────────────────────────────────── */
  "ats.view": {
    label: "Entrar a reclutamiento",
    detail: "Abre el módulo. Sin esto, el resto de permisos de reclutamiento no llegan a usarse.",
    group: "ats",
    kind: "view",
  },
  "ats.manage": {
    label: "Configurar reclutamiento",
    detail: "Etapas del proceso, plantillas y ajustes del módulo.",
    group: "ats",
    kind: "manage",
  },
  "jobs.view": { label: "Ver las vacantes", detail: "El listado y la ficha de cada puesto abierto.", group: "ats", kind: "view" },
  "jobs.create": { label: "Crear vacantes", detail: "Abrir un puesto nuevo, todavía sin publicar.", group: "ats", kind: "manage" },
  "jobs.update": { label: "Editar vacantes", detail: "Cambiar el texto, el salario y los requisitos de un puesto.", group: "ats", kind: "manage" },
  "jobs.publish": {
    label: "Publicar vacantes",
    detail: "La deja visible en el portal público, donde cualquiera puede postularse.",
    group: "ats",
    kind: "manage",
  },
  "jobs.approve": {
    label: "Aprobar vacantes",
    detail: "Autoriza que un puesto pase a publicarse. Suele reservarse a quien controla el presupuesto.",
    group: "ats",
    kind: "manage",
  },
  "candidates.view": { label: "Ver candidatos", detail: "Las personas que se han postulado y sus datos de contacto.", group: "ats", kind: "view" },
  "candidates.update": { label: "Editar candidatos", detail: "Corregir sus datos y añadir notas a su ficha.", group: "ats", kind: "manage" },
  "applications.view": { label: "Ver postulaciones", detail: "En qué etapa está cada persona dentro de cada proceso.", group: "ats", kind: "view" },
  "applications.change_stage": {
    label: "Mover de etapa",
    detail: "Avanzar o retroceder a una persona en el proceso. Puede disparar avisos automáticos.",
    group: "ats",
    kind: "manage",
  },
  "applications.reject": {
    label: "Descartar postulaciones",
    detail: "Cierra el proceso de esa persona y, según la configuración, le envía la comunicación.",
    group: "ats",
    kind: "manage",
  },
  "applications.hire": {
    label: "Contratar",
    detail: "Convierte al candidato en empleado y arranca su incorporación. Es el final del embudo.",
    group: "ats",
    kind: "manage",
  },
  "interviews.view": { label: "Ver entrevistas", detail: "La agenda de entrevistas y quiénes participan.", group: "ats", kind: "view" },
  "interviews.schedule": { label: "Agendar entrevistas", detail: "Reservar fecha y avisar a la persona candidata.", group: "ats", kind: "manage" },
  "interviews.update": { label: "Reprogramar entrevistas", detail: "Cambiar fecha, participantes o cancelarlas.", group: "ats", kind: "manage" },
  "interviews.evaluate": { label: "Evaluar entrevistas", detail: "Dejar la valoración después de entrevistar.", group: "ats", kind: "manage" },
  "scorecards.view": { label: "Ver evaluaciones de entrevista", detail: "Las valoraciones que dejó cada entrevistador.", group: "ats", kind: "view" },
  "scorecards.complete": { label: "Completar evaluaciones", detail: "Rellenar la plantilla de valoración de un candidato.", group: "ats", kind: "manage" },

  /* ── Incorporación ──────────────────────────────────────────────────── */
  "onboarding.view": { label: "Entrar a incorporación", detail: "Abre el módulo y sus expedientes.", group: "onboarding", kind: "view" },
  "onboarding.manage": { label: "Configurar incorporación", detail: "Plantillas, tareas y plazos del proceso.", group: "onboarding", kind: "manage" },
  "onboarding.start": { label: "Iniciar una incorporación", detail: "Arranca el expediente de una persona recién contratada.", group: "onboarding", kind: "manage" },
  "documents.view": { label: "Ver documentos", detail: "Los expedientes documentales de las personas.", group: "onboarding", kind: "view" },
  "documents.upload": { label: "Subir documentos", detail: "Adjuntar archivos al expediente de alguien.", group: "onboarding", kind: "manage" },
  "documents.request": { label: "Solicitar documentos", detail: "Pedirle a una persona que entregue un documento.", group: "onboarding", kind: "manage" },
  "documents.approve": {
    label: "Aprobar documentos",
    detail: "Dar por válido lo que entregó. Suele ser el paso que desbloquea la contratación.",
    group: "onboarding",
    kind: "manage",
  },
  "documents.sign": { label: "Firmar documentos", detail: "Firmar electrónicamente en nombre de la empresa.", group: "onboarding", kind: "manage" },

  /* ── Capacitación ───────────────────────────────────────────────────── */
  "training.view": { label: "Entrar a capacitación", detail: "Abre el módulo y sus cursos asignados.", group: "training", kind: "view" },
  "training.manage": { label: "Administrar capacitación", detail: "Rutas, campañas, asignaciones y analítica del módulo.", group: "training", kind: "manage" },
  "training.integrations.manage": {
    label: "Configurar integraciones formativas",
    detail: "SCORM, webhooks y sesiones virtuales. Toca claves y endpoints externos.",
    group: "training",
    kind: "manage",
  },
  "courses.view": { label: "Ver cursos", detail: "El catálogo de cursos de la empresa.", group: "training", kind: "view" },
  "courses.create": { label: "Crear cursos", detail: "Dar de alta un curso nuevo, en borrador.", group: "training", kind: "manage" },
  "courses.update": { label: "Editar cursos", detail: "Cambiar contenido, módulos y lecciones.", group: "training", kind: "manage" },
  "courses.review": { label: "Revisar cursos", detail: "Dejar observaciones antes de que se apruebe.", group: "training", kind: "manage" },
  "courses.approve": { label: "Aprobar cursos", detail: "Dar el visto bueno de calidad antes de publicar.", group: "training", kind: "manage" },
  "courses.publish": {
    label: "Publicar cursos",
    detail: "Lo deja disponible para asignarse a personas de la empresa.",
    group: "training",
    kind: "manage",
  },
  "courses.archive": { label: "Archivar cursos", detail: "Lo retira del catálogo sin borrar lo ya cursado.", group: "training", kind: "manage" },
  "courses.delete": {
    label: "Eliminar cursos",
    detail: "Borrado definitivo. Conviene reservarlo: archivar cubre casi todos los casos.",
    group: "training",
    kind: "manage",
  },
  "courses.assign": {
    label: "Asignar cursos",
    detail: "Obligar a una persona o a un grupo a completar una formación, con su fecha límite.",
    group: "training",
    kind: "manage",
  },
  "courses.complete": { label: "Marcar cursos como completados", detail: "Dar por hecha una formación sin que la persona la haga.", group: "training", kind: "manage" },
  "assessments.view": { label: "Ver evaluaciones", detail: "Los cuestionarios y sus preguntas.", group: "training", kind: "view" },
  "assessments.manage": { label: "Administrar evaluaciones", detail: "Crear cuestionarios, preguntas y criterios de aprobación.", group: "training", kind: "manage" },
  "assessments.attempt": { label: "Rendir evaluaciones", detail: "Contestar los cuestionarios asignados.", group: "training", kind: "manage" },
  "assessments.grade": { label: "Calificar evaluaciones", detail: "Corregir a mano lo que no se corrige solo.", group: "training", kind: "manage" },
  "certificates.view": { label: "Ver certificados", detail: "Las credenciales emitidas y su vigencia.", group: "training", kind: "view" },
  "certificates.issue": { label: "Emitir certificados", detail: "Generar la credencial verificable de una persona.", group: "training", kind: "manage" },

  /* ── Productividad ──────────────────────────────────────────────────── */
  "productivity.view": { label: "Entrar a productividad", detail: "Abre el módulo. Lo que se vea dentro lo deciden los tres permisos de alcance de abajo.", group: "productivity", kind: "view" },
  "productivity.manage": { label: "Configurar productividad", detail: "Metas, cámaras y ajustes del módulo.", group: "productivity", kind: "manage" },
  "productivity.view_self": { label: "Ver sus propios datos", detail: "Solo su actividad, no la de nadie más.", group: "productivity", kind: "view" },
  "productivity.view_team": {
    label: "Ver los datos de su equipo",
    detail: "La actividad de las personas a su cargo. Es información sensible sobre personas.",
    group: "productivity",
    kind: "view",
  },
  "productivity.view_company": {
    label: "Ver los datos de toda la empresa",
    detail: "La actividad de cualquier persona de la empresa, esté o no a su cargo.",
    group: "productivity",
    kind: "view",
  },

  /* ── Inventario de activos ──────────────────────────────────────────── */
  "asset_inventory.view": { label: "Entrar al inventario de activos", detail: "Abre el módulo de equipos y herramientas.", group: "assets", kind: "view" },
  "asset_inventory.manage": {
    label: "Operar el inventario de activos",
    detail: "Entregar, transferir, recibir devoluciones, ajustar existencias y dar de baja.",
    group: "assets",
    kind: "manage",
  },
  "assets.view": { label: "Ver los activos", detail: "El listado de equipos y de quién los tiene.", group: "assets", kind: "view" },
  "assets.create": { label: "Registrar activos", detail: "Dar de alta un equipo con su etiqueta y su número de serie.", group: "assets", kind: "manage" },
  "assets.assign": { label: "Asignar activos", detail: "Poner un equipo bajo la custodia de una persona.", group: "assets", kind: "manage" },
  "assets.return": { label: "Recibir devoluciones", detail: "Dar por devuelto un equipo y validar en qué estado llegó.", group: "assets", kind: "manage" },
  "inventory.create": { label: "Crear registros de inventario", detail: "Dar de alta artículos y ubicaciones.", group: "assets", kind: "manage" },
  "inventory.update": { label: "Editar registros de inventario", detail: "Corregir datos de artículos y ubicaciones.", group: "assets", kind: "manage" },
  "inventory.adjust": {
    label: "Ajustar existencias",
    detail: "Cambiar la cantidad registrada. Genera un movimiento inmutable en la auditoría.",
    group: "assets",
    kind: "manage",
  },
  "inventory.transfer": { label: "Transferir entre almacenes", detail: "Mover existencias de una ubicación a otra.", group: "assets", kind: "manage" },

  /* ── Inventario de restaurante ──────────────────────────────────────── */
  "restaurant_inventory.view": {
    label: "Entrar al inventario de restaurante",
    detail: "Abre el módulo de ingredientes, recetas y consumos.",
    group: "restaurant",
    kind: "view",
  },
  "restaurant_inventory.manage": {
    label: "Operar el inventario de restaurante",
    detail: "Registrar entradas, consumos, mermas, producción, conteos y transferencias.",
    group: "restaurant",
    kind: "manage",
  },

  // Los concede el backend, pero faltaban en PERMISSION_KEYS, así que la
  // matriz de roles no los ofrecía y once pantallas de inventario eran
  // inalcanzables para cualquier persona de una empresa.
  "restaurant_inventory.adjustments.create": {
    label: "Ajustar existencias",
    detail: "Corregir a mano lo que hay en stock cuando el recuento no cuadra. Queda registrado con su motivo.",
    group: "restaurant",
    kind: "manage",
  },
  "restaurant_inventory.audit.read": {
    label: "Ver la auditoría del inventario",
    detail: "Consultar quién movió cada cosa y cuándo, sin poder alterar el registro.",
    group: "restaurant",
    kind: "view",
  },
  "restaurant_inventory.budgets.manage": {
    label: "Gestionar el presupuesto de compras",
    detail: "Fijar cuánto se puede gastar por periodo y ver cuánto queda disponible.",
    group: "restaurant",
    kind: "manage",
  },
  "restaurant_inventory.commercial.view": {
    label: "Ver costes y márgenes",
    detail: "Acceder al dinero: coste por sucursal, margen por receta y comparativo entre unidades.",
    group: "restaurant",
    kind: "view",
  },
  "restaurant_inventory.commissary.manage": {
    label: "Gestionar el comisariato",
    detail: "Operar la cocina central que abastece al resto de sucursales.",
    group: "restaurant",
    kind: "manage",
  },
  "restaurant_inventory.counts.approve": {
    label: "Aprobar conteos físicos",
    detail: "Dar por bueno un recuento y trasladar sus diferencias al stock real.",
    group: "restaurant",
    kind: "manage",
  },
  "restaurant_inventory.counts.schedule": {
    label: "Programar conteos",
    detail: "Dejar planificados los recuentos periódicos y a quién le tocan.",
    group: "restaurant",
    kind: "manage",
  },
  "restaurant_inventory.expiry_alerts.view": {
    label: "Ver alertas de caducidad",
    detail: "Consultar qué lotes están por vencer antes de que haya que tirarlos.",
    group: "restaurant",
    kind: "view",
  },
  "restaurant_inventory.operations.confirm": {
    label: "Confirmar operaciones de inventario",
    detail: "Dar por firme un movimiento que otra persona registró. Es el segundo par de ojos.",
    group: "restaurant",
    kind: "manage",
  },
  "restaurant_inventory.operations.create": {
    label: "Registrar operaciones de inventario",
    detail: "Anotar entradas, salidas y consumos, dejándolos pendientes de confirmación.",
    group: "restaurant",
    kind: "manage",
  },
  "restaurant_inventory.receipts.confirm": {
    label: "Confirmar recepciones",
    detail: "Dar por recibida una entrega, con lo que la mercancía entra al stock.",
    group: "restaurant",
    kind: "manage",
  },
  "restaurant_inventory.receipts.create": {
    label: "Registrar recepciones",
    detail: "Anotar lo que llega del proveedor antes de confirmarlo contra la orden.",
    group: "restaurant",
    kind: "manage",
  },
  "restaurant_inventory.recipes.manage": {
    label: "Gestionar recetas",
    detail: "Definir de qué se compone cada plato, que es lo que descuenta el stock al vender.",
    group: "restaurant",
    kind: "manage",
  },
  "restaurant_inventory.settings.manage": {
    label: "Configurar el módulo de restaurante",
    detail: "Cambiar parámetros que afectan a cómo opera todo el inventario de la empresa.",
    group: "restaurant",
    kind: "manage",
  },
  "restaurant_inventory.shrinkage.view": {
    label: "Ver mermas",
    detail: "Consultar cuánto se pierde por caducidad, rotura o desperdicio, y dónde.",
    group: "restaurant",
    kind: "view",
  },
  "restaurant_inventory.transfers.manage": {
    label: "Gestionar traslados entre sucursales",
    detail: "Mover existencias de una sucursal a otra y confirmar su llegada.",
    group: "restaurant",
    kind: "manage",
  },
  "restaurant_inventory.variance.view": {
    label: "Ver la varianza teórico contra real",
    detail: "Comparar lo que debería haber según las ventas con lo que hay de verdad.",
    group: "restaurant",
    kind: "view",
  },

  /* ── Reportes ───────────────────────────────────────────────────────── */
  "reports.view": { label: "Ver reportes", detail: "Los informes de la sucursal o el alcance que tenga la persona.", group: "reports", kind: "view" },
  "reports.export": {
    label: "Exportar reportes",
    detail: "Descargar los datos en CSV. Lo descargado sale del control del producto.",
    group: "reports",
    kind: "manage",
  },
  "reports.global": {
    label: "Ver reportes de todas las sucursales",
    detail: "Sin esto, los informes se limitan a la sucursal activa.",
    group: "reports",
    kind: "view",
  },
  "audit.view": { label: "Ver la auditoría", detail: "Quién hizo cada operación crítica y cuándo.", group: "reports", kind: "view" },

  /* ── Administración de la empresa ───────────────────────────────────── */
  "admin.view": { label: "Entrar a administración", detail: "Abre el área de administración. Sin esto, el resto no llega a usarse.", group: "admin", kind: "view" },
  "admin.users": { label: "Administrar usuarios", detail: "Crear, editar y desactivar cuentas de la empresa.", group: "admin", kind: "manage" },
  "admin.roles": {
    label: "Administrar roles y permisos",
    detail: "Da acceso a ESTA pantalla. Quitárselo a su propio rol deja sin forma de volver a entrar.",
    group: "admin",
    kind: "manage",
  },
  "admin.company": { label: "Administrar la empresa", detail: "Datos de la empresa, correo, portal de empleo y ajustes generales.", group: "admin", kind: "manage" },
  "admin.subscription": { label: "Administrar la suscripción", detail: "Plan contratado, facturación y límites.", group: "admin", kind: "manage" },
  "users.view": { label: "Ver usuarios", detail: "El listado de cuentas de la empresa.", group: "admin", kind: "view" },
  "users.create": { label: "Crear usuarios", detail: "Invitar a alguien nuevo a la empresa.", group: "admin", kind: "manage" },
  "users.update": { label: "Editar usuarios", detail: "Cambiar datos, sucursal o estado de una cuenta.", group: "admin", kind: "manage" },
  "users.assign_roles": {
    label: "Asignar roles a usuarios",
    detail: "Decidir qué puede hacer cada persona. Equivale a repartir todos los demás permisos.",
    group: "admin",
    kind: "manage",
  },
  "roles.view": { label: "Ver los roles", detail: "Consultar la matriz sin poder cambiarla.", group: "admin", kind: "view" },
  "roles.update": { label: "Editar los roles", detail: "Cambiar el nombre y el alcance de un rol.", group: "admin", kind: "manage" },
  "permissions.assign": {
    label: "Cambiar los permisos de un rol",
    detail: "Añadir o quitar permisos. Es el permiso que reparte permisos: dárselo a alguien equivale a darle todo.",
    group: "admin",
    kind: "manage",
  },
  "branches.view": { label: "Ver las sucursales", detail: "El listado de sedes de la empresa.", group: "admin", kind: "view" },
  "branches.create": { label: "Crear sucursales", detail: "Dar de alta una sede nueva.", group: "admin", kind: "manage" },
  "branches.update": { label: "Editar sucursales", detail: "Cambiar datos o desactivar una sede.", group: "admin", kind: "manage" },
  "branches.switch": {
    label: "Cambiar de sucursal",
    detail: "Trabajar en una sede distinta de la suya. Sin esto, queda fijado a la que tenga asignada.",
    group: "admin",
    kind: "view",
  },
  "tenants.view": { label: "Ver empresas", detail: "El listado de empresas de la plataforma.", group: "admin", kind: "view" },
  "tenants.create": { label: "Crear empresas", detail: "Dar de alta una empresa nueva con su suscripción.", group: "admin", kind: "manage" },
  "tenants.update": { label: "Editar empresas", detail: "Cambiar datos, plan o estado de una empresa. Suspenderla corta el acceso a todos sus usuarios.", group: "admin", kind: "manage" },
  "settings.view": { label: "Ver la configuración", detail: "Los ajustes técnicos de la empresa.", group: "admin", kind: "view" },
  "settings.update": { label: "Cambiar la configuración", detail: "Modificar ajustes que afectan a toda la empresa.", group: "admin", kind: "manage" },
  "subscriptions.view": { label: "Ver suscripciones", detail: "Plan, precio y estado de la contratación.", group: "admin", kind: "view" },
  "subscriptions.manage": { label: "Administrar suscripciones", detail: "Cambiar de plan, renovar o cancelar.", group: "admin", kind: "manage" },

  /* ── Plataforma ─────────────────────────────────────────────────────── */
  "platform.tenant.switch": {
    label: "Cambiar de empresa",
    detail: "Moverse entre empresas de la plataforma. Es un permiso de operador, no de cliente.",
    group: "platform",
    kind: "view",
  },
  "platform.tenant.impersonate": {
    label: "Suplantar a un usuario",
    detail: "Entrar como si fuera otra persona y ver todos sus datos. El permiso más delicado del producto.",
    group: "platform",
    kind: "manage",
  },
  "platform.integrations.manage": {
    label: "Administrar integraciones de plataforma",
    detail: "Colas, webhooks y almacenamiento comunes a todas las empresas.",
    group: "platform",
    kind: "manage",
  },
};

/** Humaniza una clave que el catálogo todavía no cubre. */
function humanize(key: string): string {
  return key
    .replaceAll(".", " · ")
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toLocaleUpperCase("es"));
}

export function permissionInfo(key: string): PermissionInfo {
  const known = CATALOG[key as PermissionKey];
  if (known) return known;
  return {
    label: humanize(key),
    detail: "Este permiso todavía no está descrito. Consulta con quien administra la plataforma antes de asignarlo.",
    group: "other",
    kind: key.endsWith(".view") ? "view" : "manage",
  };
}

export const permissionLabel = (key: string) => permissionInfo(key).label;

/** El permiso de «ver» del mismo módulo, si existe. */
export function viewCounterpart(key: string): PermissionKey | null {
  const [domain] = key.split(".");
  const candidate = `${domain}.view`;
  if (candidate === key) return null;
  // `PermissionKey` es más ancho que `PERMISSION_KEYS`: el tipo admite claves
  // que la matriz todavía no ofrece. Solo se propone un «ver» asignable.
  const offered: readonly string[] = PERMISSION_KEYS;
  return offered.includes(candidate) ? (candidate as PermissionKey) : null;
}

/**
 * Permisos de gestión seleccionados cuyo «ver» del mismo módulo falta.
 *
 * Es el error más común al componer un rol: se marca «Publicar cursos» y se
 * olvida «Entrar a capacitación», con lo que el rol no llega a la pantalla que
 * tiene permiso de gestionar.
 */
export function manageWithoutView(selected: readonly string[]): Array<{ manage: string; view: PermissionKey }> {
  const chosen = new Set(selected);
  const gaps: Array<{ manage: string; view: PermissionKey }> = [];
  for (const key of selected) {
    if (permissionInfo(key).kind !== "manage") continue;
    const view = viewCounterpart(key);
    if (view && !chosen.has(view)) gaps.push({ manage: key, view });
  }
  return gaps;
}

/** Los permisos agrupados y ordenados, listos para pintar la matriz. */
export function groupedPermissions(keys: readonly string[] = PERMISSION_KEYS) {
  const buckets = new Map<PermissionGroup, string[]>();
  for (const key of keys) {
    const { group } = permissionInfo(key);
    const bucket = buckets.get(group) ?? [];
    bucket.push(key);
    buckets.set(group, bucket);
  }
  return PERMISSION_GROUP_ORDER.filter((group) => buckets.has(group)).map((group) => ({
    group,
    label: PERMISSION_GROUP_LABELS[group],
    // Dentro de cada grupo, «ver» antes que «gestionar»: es el orden en que se
    // componen los roles.
    keys: (buckets.get(group) ?? []).sort((left, right) => {
      const kinds = permissionInfo(left).kind === permissionInfo(right).kind;
      if (!kinds) return permissionInfo(left).kind === "view" ? -1 : 1;
      return permissionLabel(left).localeCompare(permissionLabel(right), "es");
    }),
  }));
}

/** Busca por rótulo, descripción o clave técnica. */
export function matchesPermission(key: string, term: string): boolean {
  const needle = term
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();
  if (!needle) return true;
  const info = permissionInfo(key);
  const haystack = `${key} ${info.label} ${info.detail}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");
  return haystack.includes(needle);
}

/** Qué cambia entre dos conjuntos de permisos, ya traducido. */
export function permissionDiff(before: readonly string[], after: readonly string[]) {
  const previous = new Set(before);
  const next = new Set(after);
  return {
    added: after.filter((key) => !previous.has(key)),
    removed: before.filter((key) => !next.has(key)),
  };
}
