import { describe, expect, it } from "vitest";
import {
  appNavigation,
  candidateNavigation,
  evaluateRouteAccess,
  getRoutePolicy,
  isAudienceAllowed,
  isRoleAllowed,
  itemsBySection,
  navSections,
  sectionForPath,
  visibleSections,
  type RouteAccessContext,
} from "./navigation";

describe("navigation policy", () => {

  it("restricts SaaS and tenant audiences", () => {
    expect(isAudienceAllowed("saas", "admin_saas")).toBe(true);
    expect(isAudienceAllowed("saas", "admin_plataforma")).toBe(true);
    expect(isAudienceAllowed("saas", "admin_empresa")).toBe(false);
    expect(isAudienceAllowed("tenant", "admin_plataforma")).toBe(true);
    expect(isAudienceAllowed("tenant", "admin_empresa")).toBe(true);
    expect(isAudienceAllowed("tenant", "empleado")).toBe(false);
  });

  it("assigns a semantic icon to every navigation item", () => {
    expect(appNavigation.every((item) => Boolean(item.icon))).toBe(true);
    expect(new Set(appNavigation.map((item) => item.icon)).size).toBeGreaterThan(5);
  });

  it("separates role-specific workspaces", () => {
    const interviews = getRoutePolicy("/ats/interviews");
    const pipeline = getRoutePolicy("/ats/pipeline");
    const communications = getRoutePolicy("/ats/communications");
    expect(isRoleAllowed(interviews?.roles, "entrevistador")).toBe(true);
    expect(isRoleAllowed(pipeline?.roles, "entrevistador")).toBe(false);
    expect(isRoleAllowed(pipeline?.roles, "reclutador")).toBe(true);
    expect(communications?.permission).toBe("applications.view");
    expect(communications?.branchRequired).toBe(true);
    expect(isRoleAllowed(communications?.roles, "reclutador")).toBe(true);
    expect(isRoleAllowed(communications?.roles, "entrevistador")).toBe(false);
  });

  it("keeps the operational ATS workspaces visible in navigation", () => {
    const atsItems = appNavigation.filter((item) => item.module === "ats");
    for (const href of ["/ats/talent-crm", "/ats/communications", "/ats/scorecards"]) {
      expect(atsItems.find((item) => item.href === href)?.showInNavigation).not.toBe(false);
    }
  });

  it("separates restaurant inventory read and management routes", () => {
    expect(getRoutePolicy("/inventory/restaurant")?.permission).toBe("restaurant_inventory.view");
    expect(getRoutePolicy("/inventory/restaurant/dashboard")?.permission).toBe("restaurant_inventory.view");
    expect(getRoutePolicy("/inventory/restaurant/ingredients")?.permission).toBe("restaurant_inventory.manage");
    expect(isRoleAllowed(getRoutePolicy("/inventory/restaurant")?.roles, "supervisor")).toBe(true);
    expect(isRoleAllowed(getRoutePolicy("/inventory/restaurant/ingredients")?.roles, "supervisor")).toBe(false);
    expect(isRoleAllowed(getRoutePolicy("/inventory/restaurant/ingredients")?.roles, "encargado_inventario")).toBe(true);
  });

  it("centralizes the candidate portal navigation", () => {
    expect(candidateNavigation.filter((item) => item.available).map((item) => item.href)).toEqual(["/", "/jobs", "/apply", "/application-status", "/candidate/portal", "/candidate/profile"]);
  });

  it("evaluates access criteria in the required order", () => {
    const basePolicy = getRoutePolicy("/ats/pipeline");
    expect(basePolicy).toBeDefined();
    const policy = { ...basePolicy!, available: true };

    const allowed: RouteAccessContext = {
      sessionValid: true,
      tenantAllowed: true,
      subscriptionStatus: "active",
      role: "reclutador",
      hasModule: () => true,
      hasFeature: () => true,
      can: () => true,
      branchAvailable: true,
    };

    const cases: Array<[Partial<RouteAccessContext>, string]> = [
      [{ sessionValid: false, tenantAllowed: false }, "AUTH_REQUIRED"],
      [{ tenantAllowed: false, subscriptionStatus: "suspended" }, "TENANT_ACCESS_DENIED"],
      [{ subscriptionStatus: "suspended", hasModule: () => false }, "SUBSCRIPTION_BLOCKED"],
      [{ hasModule: () => false, role: "empleado" }, "MODULE_NOT_ENABLED"],
      [{ hasFeature: () => false, role: "empleado" }, "FEATURE_NOT_ENABLED"],
      [{ role: "empleado", can: () => false }, "ROLE_NOT_ALLOWED"],
      [{ can: () => false, branchAvailable: false }, "PERMISSION_DENIED"],
      [{ branchAvailable: false }, "BRANCH_REQUIRED"],
    ];

    for (const [override, expectedCode] of cases) {
      expect(evaluateRouteAccess(policy!, { ...allowed, ...override }).code).toBe(expectedCode);
    }

    expect(evaluateRouteAccess(policy, allowed).code).toBe("ALLOWED");
  });

  it("allows the authenticated workspace entry without a synthetic dashboard permission", () => {
    const dashboard = getRoutePolicy("/dashboard");
    expect(dashboard).toBeDefined();
    expect(evaluateRouteAccess(dashboard!, {
      sessionValid: true,
      tenantAllowed: true,
      subscriptionStatus: "suspended",
      role: "empleado",
      hasModule: () => false,
      hasFeature: () => false,
      can: () => false,
      branchAvailable: false,
    }).code).toBe("ALLOWED");
  });

  it("does not authorize a workspace before the backend context is verified", () => {
    const dashboard = getRoutePolicy("/dashboard");
    expect(evaluateRouteAccess(dashboard!, {
      sessionValid: false,
      tenantAllowed: true,
      subscriptionStatus: "active",
      role: "admin_empresa",
      hasModule: () => true,
      hasFeature: () => true,
      can: () => true,
      branchAvailable: true,
    }).code).toBe("AUTH_REQUIRED");
  });

  it("keeps the global superadministrator out of tenant operations until impersonation", () => {
    const restrictedContext: RouteAccessContext = {
      sessionValid: true,
      tenantAllowed: false,
      globalContext: true,
      subscriptionStatus: "suspended",
      role: "admin_saas",
      hasModule: () => false,
      hasFeature: () => false,
      can: () => false,
      branchAvailable: false,
    };
    expect(evaluateRouteAccess({ ...getRoutePolicy("/ats/candidates")!, available: true }, restrictedContext).code).toBe("BRANCH_REQUIRED");
    expect(evaluateRouteAccess({ ...getRoutePolicy("/admin/branches")!, available: true }, restrictedContext).code).toBe("ROLE_NOT_ALLOWED");
    expect(evaluateRouteAccess({ ...getRoutePolicy("/admin/tenants")!, available: true }, restrictedContext).code).toBe("ALLOWED");
    expect(evaluateRouteAccess({ ...getRoutePolicy("/reports")!, available: false }, restrictedContext).code).toBe("ROUTE_NOT_READY");
  });

  it("allows platform administrators into global governance without a tenant context", () => {
    const platformContext: RouteAccessContext = {
      sessionValid: true,
      tenantAllowed: false,
      globalContext: true,
      subscriptionStatus: "suspended",
      role: "admin_plataforma",
      hasModule: () => false,
      hasFeature: () => false,
      can: () => true,
      branchAvailable: false,
    };

    expect(evaluateRouteAccess({ ...getRoutePolicy("/admin/tenants")!, available: true }, platformContext).code).toBe("ALLOWED");
    expect(evaluateRouteAccess({ ...getRoutePolicy("/ats/candidates")!, available: true }, platformContext).code).toBe("BRANCH_REQUIRED");
  });

  it("reserves bus and queue governance for the superadministrator", () => {
    const policy = getRoutePolicy("/admin/integrations");
    expect(policy).toBeDefined();
    expect(isRoleAllowed(policy?.roles, "admin_saas", policy?.strictRoles)).toBe(true);
    expect(isRoleAllowed(policy?.roles, "admin_plataforma", policy?.strictRoles)).toBe(false);
    expect(isRoleAllowed(policy?.roles, "admin_empresa", policy?.strictRoles)).toBe(false);
  });

  it("requires the contracted module even when the permission exists", () => {
    const policy = { ...getRoutePolicy("/ats/vacancies")!, available: true };
    const decision = evaluateRouteAccess(policy, {
      sessionValid: true,
      tenantAllowed: true,
      subscriptionStatus: "active",
      role: "rrhh",
      hasModule: () => false,
      hasFeature: () => true,
      can: () => true,
      branchAvailable: true,
    });
    expect(decision.code).toBe("MODULE_NOT_ENABLED");
  });

  it("blocks an expired subscription before evaluating permissions", () => {
    const policy = { ...getRoutePolicy("/inventory")!, available: true };
    const decision = evaluateRouteAccess(policy, {
      sessionValid: true,
      tenantAllowed: true,
      subscriptionStatus: "past_due",
      role: "encargado_inventario",
      hasModule: () => true,
      hasFeature: () => true,
      can: () => true,
      branchAvailable: true,
    });
    expect(decision.code).toBe("SUBSCRIPTION_BLOCKED");
  });

  it("keeps the pipeline route reachable but out of the menu after merging it into Postulaciones", () => {
    const pipeline = appNavigation.find((item) => item.href === "/ats/pipeline");
    // La ruta sigue existiendo y conserva su política de acceso: hay enlaces
    // guardados apuntando ahí y las pruebas de permisos dependen de ella.
    expect(pipeline).toBeDefined();
    expect(pipeline?.permission).toBe("applications.view");
    // Pero no ocupa un sitio en el menú: su contenido es la vista "Por fases"
    // de /ats/candidates, y dos entradas al mismo destino confunden.
    expect(pipeline?.showInNavigation).toBe(false);
    expect(appNavigation.find((item) => item.href === "/ats/candidates")?.showInNavigation).not.toBe(false);
  });

  it("allows an interviewer to assigned-work routes but not the full pipeline", () => {
    const context: RouteAccessContext = {
      sessionValid: true,
      tenantAllowed: true,
      subscriptionStatus: "active",
      role: "entrevistador",
      hasModule: () => true,
      hasFeature: () => true,
      can: () => true,
      branchAvailable: true,
    };
    expect(evaluateRouteAccess({ ...getRoutePolicy("/ats/interviews")!, available: true }, context).code).toBe("ALLOWED");
    expect(evaluateRouteAccess({ ...getRoutePolicy("/ats/pipeline")!, available: true }, context).code).toBe("ROLE_NOT_ALLOWED");
  });

  it("separates learning administration from the employee learning experience", () => {
    const policy = { ...getRoutePolicy("/training/paths")!, available: true };
    const base: Omit<RouteAccessContext, "role"> = {
      sessionValid: true,
      tenantAllowed: true,
      subscriptionStatus: "active",
      hasModule: () => true,
      hasFeature: () => true,
      can: () => true,
      branchAvailable: true,
    };
    expect(evaluateRouteAccess(policy, { ...base, role: "instructor" }).code).toBe("ALLOWED");
    expect(evaluateRouteAccess(policy, { ...base, role: "rrhh" }).code).toBe("ALLOWED");
    expect(evaluateRouteAccess(policy, { ...base, role: "empleado" }).code).toBe("ROLE_NOT_ALLOWED");
    expect(evaluateRouteAccess(policy, { ...base, role: "candidato" }).code).toBe("ROLE_NOT_ALLOWED");
  });

  it("denies direct URL access when a required permission is absent", () => {
    const policy = { ...getRoutePolicy("/admin/users")!, available: true };
    const decision = evaluateRouteAccess(policy, {
      sessionValid: true,
      tenantAllowed: true,
      subscriptionStatus: "active",
      role: "admin_empresa",
      hasModule: () => true,
      hasFeature: () => true,
      can: () => false,
      branchAvailable: true,
    });
    expect(decision.code).toBe("PERMISSION_DENIED");
  });

  it("requires an authorized branch for branch-scoped routes", () => {
    const policy = { ...getRoutePolicy("/productivity")!, available: true };
    const decision = evaluateRouteAccess(policy, {
      sessionValid: true,
      tenantAllowed: true,
      subscriptionStatus: "active",
      role: "supervisor",
      hasModule: () => true,
      hasFeature: () => true,
      can: () => true,
      branchAvailable: false,
    });
    expect(decision.code).toBe("BRANCH_REQUIRED");
  });

  it("updates route and menu eligibility immediately after a permission change", () => {
    const policy = { ...getRoutePolicy("/admin/users")!, available: true };
    const permissions = new Set<string>();
    const context: RouteAccessContext = {
      sessionValid: true,
      tenantAllowed: true,
      subscriptionStatus: "active",
      role: "admin_empresa",
      hasModule: () => true,
      hasFeature: () => true,
      can: (permission) => permissions.has(permission),
      branchAvailable: true,
    };

    expect(evaluateRouteAccess(policy, context).code).toBe("PERMISSION_DENIED");
    permissions.add("admin.users");
    expect(evaluateRouteAccess(policy, context).code).toBe("ALLOWED");
    permissions.delete("admin.users");
    expect(evaluateRouteAccess(policy, context).code).toBe("PERMISSION_DENIED");
  });

  it("declares a feature flag and operational state for every protected route", () => {
    expect(appNavigation.every((item) => item.featureFlag.startsWith("module.") && item.requiredPermissions.length > 0 && typeof item.available === "boolean")).toBe(true);
    expect(evaluateRouteAccess(getRoutePolicy("/reports")!, { ...({ sessionValid: true, tenantAllowed: true, subscriptionStatus: "active", role: "admin_saas", hasModule: () => true, hasFeature: () => true, can: () => true, branchAvailable: true } satisfies RouteAccessContext) }).code).toBe("ALLOWED");
  });
});

/* ==========================================================================
   SECCIONES POR INTENCIÓN
   ==========================================================================
   Documentan la reagrupación del menú: 90 entradas que estaban en 10 grupos
   mezclando «de qué área es» con «a qué vengo». El grupo se conserva; la
   sección es el eje nuevo.
   ========================================================================== */

describe("secciones de navegación", () => {
  it("todo ítem tiene una sección de la lista canónica", () => {
    const known = new Set(navSections.map((section) => section.id));
    for (const item of appNavigation) {
      expect(known.has(item.section), `${item.href} → ${item.section}`).toBe(true);
    }
  });

  it("la reagrupación NO cambia ninguna política de acceso", () => {
    // La garantía que hace segura esta refactorización: se añadió un campo,
    // no se tocó ni una ruta, ni un permiso, ni un módulo, ni un rol.
    for (const item of appNavigation) {
      expect(item.requiredPermissions).toEqual([item.permission]);
      expect(item.featureFlag).toBe(`module.${item.module}`);
    }
  });

  it("cada módulo ocupa una sola sección", () => {
    // Es la regla del menú: contratar un módulo añade su sección entera y no
    // contratarlo la quita entera. Un módulo repartido entre secciones deja
    // huecos por todo el menú en vez de desaparecer de un bloque.
    const sectionsByModule = new Map<string, Set<string>>();
    for (const item of appNavigation) {
      if (item.module === "admin") continue; // sirve a empresa y a plataforma
      const seen = sectionsByModule.get(item.module) ?? new Set<string>();
      seen.add(item.section);
      sectionsByModule.set(item.module, seen);
    }
    const scattered = [...sectionsByModule.entries()]
      .filter(([, seen]) => seen.size > 1)
      .map(([module, seen]) => `${module} está en ${[...seen].join(", ")}`);
    expect(scattered).toEqual([]);
  });

  it("la sección de un módulo se llama como el módulo", () => {
    const section = (href: string) => appNavigation.find((item) => item.href === href)?.section;
    expect(section("/ats")).toBe("ats");
    expect(section("/ats/analytics")).toBe("ats");
    expect(section("/training")).toBe("training");
    expect(section("/training/results")).toBe("training");
    expect(section("/inventory/restaurant/receipts")).toBe("restaurant_inventory");
    expect(section("/inventory/restaurant/recipe-margins")).toBe("restaurant_inventory");
    expect(section("/inventory/restaurant/settings")).toBe("restaurant_inventory");
    expect(section("/inventory/assets")).toBe("asset_inventory");
    // Las alertas viven en Administración: una sección con un único elemento
    // llamado igual que ella no es una sección.
    expect(section("/notifications")).toBe("administracion");
  });

  it("administración y gobierno de plataforma no se mezclan", () => {
    // La única excepción a «una sección por módulo»: `admin` sirve a dos
    // públicos y cada uno necesita su bloque.
    const section = (href: string) => appNavigation.find((item) => item.href === href)?.section;
    expect(section("/admin/users")).toBe("administracion");
    expect(section("/admin/branches")).toBe("administracion");
    expect(section("/admin/tenants")).toBe("plataforma");
    expect(section("/admin/plans")).toBe("plataforma");
  });

  it("toda sección declarada tiene al menos una pantalla", () => {
    const used = new Set(appNavigation.map((item) => item.section));
    const empty = navSections.map((section) => section.id).filter((id) => !used.has(id));
    expect(empty).toEqual([]);
  });

  it("visibleSections respeta el orden canónico y omite las vacías", () => {
    const soloAdmin = appNavigation.filter((item) => item.section === "administracion");
    expect(visibleSections(soloAdmin)).toEqual(["administracion"]);

    const mezcla = appNavigation.filter((item) =>
      ["/admin/users", "/ats", "/dashboard"].includes(item.href),
    );
    // El orden sale de `navSections`, no del orden en que llegan los ítems.
    expect(visibleSections(mezcla)).toEqual(["inicio", "ats", "administracion"]);
  });

  it("visibleSections ignora los ítems ocultos del menú", () => {
    // `/ats/pipeline` sigue existiendo como ruta pero no ocupa sitio en el menú.
    const oculto = appNavigation.filter((item) => item.href === "/ats/pipeline");
    expect(oculto[0]?.showInNavigation).toBe(false);
    expect(visibleSections(oculto)).toEqual([]);
  });

  it("itemsBySection conserva el área como segundo nivel", () => {
    const grupos = itemsBySection(appNavigation, "administracion");
    expect(grupos.length).toBeGreaterThan(0);
    for (const grupo of grupos) {
      expect(grupo.items.every((item) => item.group === grupo.group)).toBe(true);
      expect(grupo.items.every((item) => item.showInNavigation !== false)).toBe(true);
    }
  });

  it("sectionForPath resuelve la sección de una subruta", () => {
    expect(sectionForPath(appNavigation, "/ats/vacancies/nueva-vacante")).toBe("ats");
    expect(sectionForPath(appNavigation, "/admin/users")).toBe("administracion");
  });

  it("sectionForPath cae en inicio ante una ruta desconocida", () => {
    expect(sectionForPath(appNavigation, "/ruta/que/no/existe")).toBe("inicio");
  });
});

describe("el menú promete lo que la pantalla concede", () => {
  /**
   * `/admin/users` aparecía en el menú con `users.view` mientras la pantalla
   * exigía `admin.users`, y lo mismo pasaba en roles y en auditoría: quien
   * tuviera el primer permiso y no el segundo veía la entrada y se topaba con
   * el bloqueo al entrar. El menú no debe ofrecer lo que no se puede abrir.
   */
  it("cada ruta del menú pide el mismo permiso que su pantalla", async () => {
    const { readFileSync, existsSync } = await import("node:fs");
    const { join } = await import("node:path");
    const mismatches: string[] = [];

    for (const item of appNavigation) {
      const file = join(process.cwd(), "src/app/(app)", item.href, "page.tsx");
      if (!existsSync(file)) continue;
      const body = readFileSync(file, "utf8");
      // Solo la comprobación que corta la pantalla entera, no los permisos
      // de un botón suelto dentro de ella.
      const gates = [...body.matchAll(/if\s*\(\s*!\s*can\("([a-z_.]+)"\)\s*\)/g)].map((match) => match[1]);
      if (gates.length > 0 && !gates.includes(item.permission)) {
        mismatches.push(`${item.href}: menú pide ${item.permission}, la pantalla exige ${gates.join(" o ")}`);
      }
    }

    expect(mismatches).toEqual([]);
  });
});
