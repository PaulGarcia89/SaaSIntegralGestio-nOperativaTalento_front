import type { E2ERole } from "./e2e-auth";

export type Surface = {
  /** Ruta interna, tal como aparece en `src/lib/navigation.ts`. */
  path: string;
  /** Nombre legible; se usa en el título de la prueba y en el del archivo de captura. */
  name: string;
  /** Rol con acceso a la pantalla según la política de `navigation.ts`. */
  role: E2ERole;
  /** Módulo de `ModuleKey` al que pertenece; documenta por qué puede omitirse. */
  module: string;
  /**
   * `true` cuando la pantalla forma parte de la línea base visual.
   * Se eligieron las 12 superficies con más tráfico operativo y las que el
   * plan de rediseño va a tocar primero.
   */
  visual?: boolean;
  /**
   * Selectores CSS con contenido volátil (marcas de tiempo, contadores) que se
   * enmascaran en la captura para que la línea base no dependa de los datos.
   */
  mask?: string[];
};

/**
 * Catálogo único de superficies auditadas.
 *
 * Es la fuente de verdad compartida por la auditoría de accesibilidad y la
 * línea base visual: añadir una pantalla aquí la incorpora automáticamente a
 * ambas suites.
 *
 * El rol de cada superficie sale de las restricciones declaradas en
 * `src/lib/navigation.ts`. Cuando el entorno de datos no habilita un módulo
 * para ese rol, la prueba se omite con motivo explícito en lugar de fallar.
 *
 * Asignación de roles y datos sembrados
 * -------------------------------------
 * El seed local no incluye cuentas con contraseña conocida para `RECRUITER`,
 * `INSTRUCTOR`, `INVENTORY_MANAGER` ni `BRANCH_USER`. Esas superficies se
 * auditan con `TENANT_ADMIN`, que el backend traduce a `admin_empresa`
 * (`src/lib/backend.ts:758`) y que figura en la lista de roles autorizados de
 * todas ellas en `navigation.ts`.
 *
 * Es cobertura válida, pero no idéntica: un reclutador ve menos acciones que un
 * administrador de empresa. Cuando existan esas cuentas, basta con devolver
 * aquí el rol original para recuperar la fidelidad.
 */
export const SURFACES: readonly Surface[] = [
  // Inicio
  { path: "/dashboard", name: "Inicio operativo", role: "TENANT_ADMIN", module: "dashboard", visual: true },
  { path: "/profile", name: "Mi perfil", role: "TENANT_EMPLEADO", module: "profile" },

  // Reclutamiento
  { path: "/ats", name: "ATS requiere atencion", role: "TENANT_ADMIN", module: "ats", visual: true },
  { path: "/ats/vacancies", name: "Vacantes", role: "TENANT_ADMIN", module: "ats", visual: true },
  { path: "/ats/pipeline", name: "Pipeline", role: "TENANT_ADMIN", module: "ats", visual: true },
  { path: "/ats/candidates", name: "Candidatos", role: "TENANT_ADMIN", module: "ats", visual: true },
  { path: "/ats/interviews", name: "Entrevistas", role: "TENANT_ADMIN", module: "ats" },
  { path: "/ats/analytics", name: "Analitica ATS", role: "TENANT_ADMIN", module: "ats" },
  { path: "/hiring", name: "Contrataciones", role: "HR_MANAGER", module: "ats", visual: true },

  // Personas
  { path: "/employees", name: "Empleados", role: "TENANT_ADMIN", module: "productivity", visual: true },
  { path: "/onboarding/documents", name: "Incorporaciones", role: "HR_MANAGER", module: "onboarding", visual: true },
  { path: "/onboarding/signatures", name: "Documentos y firmas", role: "HR_MANAGER", module: "onboarding" },

  // Aprendizaje
  { path: "/training", name: "Cursos", role: "TENANT_ADMIN", module: "training", visual: true },
  { path: "/training/content", name: "Gestionar cursos", role: "TENANT_ADMIN", module: "training" },

  // Inventario
  { path: "/inventory", name: "Inventario de activos", role: "TENANT_ADMIN", module: "asset_inventory", visual: true },
  { path: "/inventory/restaurant", name: "Inventario de restaurante", role: "TENANT_ADMIN", module: "restaurant_inventory", visual: true },

  // Analítica y avisos
  { path: "/reports", name: "Reportes", role: "TENANT_ADMIN", module: "reports" },
  { path: "/notifications", name: "Alertas", role: "TENANT_ADMIN", module: "notifications" },

  // Administración
  { path: "/admin/users", name: "Usuarios", role: "TENANT_ADMIN", module: "admin", visual: true },
  // Pantalla P0 del plan de rediseño: la línea base protege su estado actual.
  { path: "/admin/roles", name: "Roles y permisos", role: "TENANT_ADMIN", module: "admin", visual: true },
  { path: "/admin/branches", name: "Sucursales", role: "TENANT_ADMIN", module: "admin" },
  { path: "/admin/company", name: "Configuracion de empresa", role: "TENANT_ADMIN", module: "admin" },
];

export const VISUAL_SURFACES = SURFACES.filter((surface) => surface.visual);

/** Roles que necesitan credenciales para que la suite cubra todo el catálogo. */
export const REQUIRED_ROLES = [...new Set(SURFACES.map((surface) => surface.role))];

/** Identificador estable para nombrar archivos de captura. */
export function surfaceSlug(surface: Surface) {
  return surface.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
