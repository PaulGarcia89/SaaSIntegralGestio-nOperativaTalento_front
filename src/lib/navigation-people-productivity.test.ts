import { describe, expect, it } from "vitest";
import type { ModuleKey, PermissionKey, RoleKey } from "@/lib/contracts";
import { backendCodesToUiPermissions } from "@/lib/backend";
import {
  appNavigation,
  evaluateRouteAccess,
  getRoutePolicy,
  navSections,
  sectionForNavItem,
  visibleSections,
  type RouteAccessContext,
} from "@/lib/navigation";

/**
 * Personas y Productividad son dos módulos, no uno.
 *
 * Compartían sección de menú, «Personas y productividad», y el directorio de
 * empleados se protegía con el permiso y el módulo de Productividad. El backend
 * nunca los trató así: `/employees` exige `employees.read` y ningún módulo;
 * `/productivity` exige `productivity.view` Y el módulo AI_PRODUCTIVITY.
 *
 * Estas pruebas fijan las cuatro combinaciones que el encargo exige —solo
 * Personas, solo Productividad, ambos, ninguno— sobre la misma función que usa
 * la aplicación, `evaluateRouteAccess`, y sobre el mapeo real de permisos.
 */

function contexto(opciones: {
  permisos: PermissionKey[];
  modulos: ModuleKey[];
  rol?: RoleKey;
}): RouteAccessContext {
  const permisos = new Set<string>(opciones.permisos);
  const modulos = new Set<string>(opciones.modulos);
  return {
    sessionValid: true,
    tenantAllowed: true,
    subscriptionStatus: "active",
    role: opciones.rol ?? "admin_empresa",
    hasModule: (module) => modulos.has(module),
    hasFeature: (flag) => opciones.modulos.some((module) => flag === `module.${module}`),
    can: (permission) => permisos.has(permission),
    branchAvailable: true,
  };
}

const menu = (ctx: RouteAccessContext) =>
  appNavigation
    .filter((item) => item.showInNavigation !== false && evaluateRouteAccess(item, ctx).allowed)
    .map((item) => item.href);

const PERSONAS = ["/people/dashboard", "/employees"];
const PRODUCTIVIDAD = ["/productivity/dashboard", "/productivity/cameras"];

describe("Personas y Productividad son módulos independientes", () => {
  it("usuario con acceso solo a Personas: ve Personas y no ve Productividad", () => {
    const visible = menu(contexto({ permisos: ["employees.read"], modulos: ["dashboard", "profile"] }));
    for (const href of PERSONAS) expect(visible, href).toContain(href);
    for (const href of PRODUCTIVIDAD) expect(visible, href).not.toContain(href);
  });

  it("usuario con acceso solo a Productividad: ve Productividad y no ve Personas", () => {
    const visible = menu(
      contexto({
        permisos: ["productivity.view", "productivity.manage"],
        modulos: ["dashboard", "profile", "productivity"],
      }),
    );
    for (const href of PRODUCTIVIDAD) expect(visible, href).toContain(href);
    for (const href of PERSONAS) expect(visible, href).not.toContain(href);
  });

  it("usuario con acceso a ambos: ve los dos, en secciones distintas", () => {
    const ctx = contexto({
      permisos: ["employees.read", "productivity.view", "productivity.manage"],
      modulos: ["dashboard", "profile", "productivity"],
    });
    const visible = menu(ctx);
    for (const href of [...PERSONAS, ...PRODUCTIVIDAD]) expect(visible, href).toContain(href);

    const items = appNavigation.filter((item) => visible.includes(item.href));
    const secciones = visibleSections(items);
    expect(secciones).toContain("people");
    expect(secciones).toContain("productivity");
  });

  it("usuario sin acceso a ninguno: no ve ninguno de los dos", () => {
    const visible = menu(contexto({ permisos: [], modulos: ["dashboard", "profile", "productivity"] }));
    for (const href of [...PERSONAS, ...PRODUCTIVIDAD]) expect(visible, href).not.toContain(href);
  });

  it("empresa sin el módulo de Productividad: Personas sigue disponible y Productividad se bloquea por módulo", () => {
    const ctx = contexto({
      permisos: ["employees.read", "productivity.view"],
      modulos: ["dashboard", "profile"],
    });
    expect(evaluateRouteAccess(getRoutePolicy("/people")!, ctx).code).toBe("ALLOWED");
    expect(evaluateRouteAccess(getRoutePolicy("/employees")!, ctx).code).toBe("ALLOWED");
    expect(evaluateRouteAccess(getRoutePolicy("/productivity")!, ctx).code).toBe("MODULE_NOT_ENABLED");
    expect(evaluateRouteAccess(getRoutePolicy("/productivity/cameras")!, ctx).code).toBe("MODULE_NOT_ENABLED");
  });

  it("Personas no depende de ningún módulo comercial: el backend la protege solo por permiso", () => {
    for (const href of PERSONAS) {
      const policy = getRoutePolicy(href)!;
      expect(policy.module, href).toBe("people");
      expect(policy.permission, href).toBe("employees.read");
      expect(policy.requiresCommercialModule, href).toBe(false);
    }
  });
});

describe("acceso directo por URL", () => {
  it("las rutas del expediente caen bajo la política de Personas", () => {
    for (const pathname of ["/employees/abc", "/employees/abc/edit", "/employees/new", "/employees/import"]) {
      expect(getRoutePolicy(pathname)?.module, pathname).toBe("people");
    }
  });

  it("las rutas de cámaras caen bajo la política de Productividad", () => {
    expect(getRoutePolicy("/productivity/cameras")?.module).toBe("productivity");
    expect(getRoutePolicy("/productivity/cameras")?.permission).toBe("productivity.manage");
  });

  it("sin permiso de empleados, el expediente se deniega aunque el módulo de Productividad esté contratado", () => {
    const ctx = contexto({ permisos: ["productivity.view"], modulos: ["dashboard", "profile", "productivity"] });
    expect(evaluateRouteAccess(getRoutePolicy("/employees/abc")!, ctx).code).toBe("PERMISSION_DENIED");
  });
});

describe("navegación: dos secciones con nombre e icono propios", () => {
  it("ya no existe la sección «Personas y productividad»", () => {
    const etiquetas = navSections.map((section) => section.label.toLowerCase());
    expect(etiquetas).not.toContain("personas y productividad");
    expect(etiquetas).toContain("personas");
    expect(etiquetas).toContain("productividad");
  });

  it("cada entrada cae en su sección", () => {
    const porRuta = (href: string) => sectionForNavItem(appNavigation.find((item) => item.href === href)!);
    expect(porRuta("/people")).toBe("people");
    expect(porRuta("/employees")).toBe("people");
    expect(porRuta("/productivity")).toBe("productivity");
    expect(porRuta("/productivity/cameras")).toBe("productivity");
  });

  it("cada sección tiene una ruta principal propia", () => {
    const personas = appNavigation.filter((item) => item.section === "people" && item.showInNavigation !== false);
    const productividad = appNavigation.filter((item) => item.section === "productivity" && item.showInNavigation !== false);
    expect(personas[0]?.href).toBe("/people/dashboard");
    expect(personas[0]?.label).toBe("Dashboard");
    expect(productividad[0]?.href).toBe("/productivity/dashboard");
    expect(productividad[0]?.label).toBe("Dashboard");
  });
});

describe("el permiso de Productividad dice lo mismo que el servidor", () => {
  it("tener el módulo contratado no da productivity.view sin el código del rol", () => {
    // Antes bastaba con el módulo: un supervisor veía el menú y recibía 403
    // en cada pantalla, porque `/productivity/*` exige el código en el backend.
    const sinCodigo = backendCodesToUiPermissions(["employees.read"], ["productivity"], false);
    expect(sinCodigo).not.toContain("productivity.view");
  });

  it("tener el código sin el módulo tampoco da acceso", () => {
    const sinModulo = backendCodesToUiPermissions(["productivity.view"], [], false);
    expect(sinModulo).not.toContain("productivity.view");
  });

  it("módulo y código juntos sí", () => {
    const ambos = backendCodesToUiPermissions(["productivity.view", "productivity.manage"], ["productivity"], false);
    expect(ambos).toContain("productivity.view");
    expect(ambos).toContain("productivity.manage");
  });

  it("employees.read no depende de ningún módulo", () => {
    const soloPermiso = backendCodesToUiPermissions(["employees.read"], [], false);
    expect(soloPermiso).toContain("employees.read");
  });
});
