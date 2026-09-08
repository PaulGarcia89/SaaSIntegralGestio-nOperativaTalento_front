import { describe, expect, it } from "vitest";
import { MODULE_KEYS, type ModuleKey } from "@/lib/contracts";
import { appNavigation, evaluateRouteAccess, itemsBySection, visibleSections } from "@/lib/navigation";

/**
 * El menú según lo que la empresa tiene contratado.
 *
 * Cada módulo se habilita por separado —una suscripción básica no trae todos—,
 * así que el menú tiene que abrirse módulo a módulo y no arrastrar nada de un
 * módulo que la empresa no paga. Estas pruebas fijan ese comportamiento sobre
 * la misma función que usa la aplicación, `evaluateRouteAccess`, en vez de
 * sobre una copia de su lógica.
 */

/** Lo que ve una empresa con estos módulos contratados y todos los permisos. */
function menuFor(modules: ModuleKey[]) {
  const enabled = new Set<string>(modules);
  return appNavigation.filter(
    (item) =>
      item.showInNavigation !== false &&
      evaluateRouteAccess(item, {
        sessionValid: true,
        tenantAllowed: true,
        subscriptionStatus: "active",
        role: "admin_empresa",
        hasModule: (module) => enabled.has(module),
        hasFeature: (flag) => modules.some((module) => flag === `module.${module}`),
        can: () => true,
        branchAvailable: true,
      }).allowed,
  );
}

/** Una suscripción mínima: lo básico para entrar y contratar gente. */
const BASIC: ModuleKey[] = ["dashboard", "profile", "ats"];

describe("el menú se abre módulo a módulo", () => {
  it("una suscripción básica no trae las pantallas de los módulos que no paga", () => {
    const visible = menuFor(BASIC);
    // Sin excluir las capacidades base por bandera: se comprueba por módulo.
    // La exención se decidía por el ÁREA de la pantalla, así que
    // `/inventory/restaurant/settings` —que cae en «Administración»— se
    // libraba de la puerta y una empresa sin restaurante veía su sección.
    // `people` también es base: el backend no tiene módulo comercial para
    // Personas y protege /employees solo por permiso (`employees.read`).
    const BASE: ModuleKey[] = ["dashboard", "profile", "admin", "people"];
    const intruders = visible.filter(
      (item) => !BASIC.includes(item.module) && !BASE.includes(item.module),
    );
    expect(intruders.map((item) => item.href)).toEqual([]);
  });

  it("contratar un módulo no arrastra ninguna pantalla de otro", () => {
    for (const moduleKey of MODULE_KEYS) {
      const withModule = menuFor([...BASIC, moduleKey]).map((item) => item.href);
      const without = menuFor(BASIC).map((item) => item.href);
      const added = withModule.filter((href) => !without.includes(href));
      const foreign = added
        .map((href) => appNavigation.find((item) => item.href === href)!)
        .filter((item) => item.module !== moduleKey);
      expect(
        foreign.map((item) => `${moduleKey} arrastró ${item.href} (${item.module})`),
      ).toEqual([]);
    }
  });

  it("cada módulo aporta al menos una pantalla cuando se contrata", () => {
    // Un módulo que se paga y no añade nada al menú es un módulo que la
    // empresa no puede usar aunque lo tenga contratado.
    const mute: string[] = [];
    for (const moduleKey of MODULE_KEYS) {
      const added = menuFor([...BASIC, moduleKey]).filter((item) => item.module === moduleKey);
      if (added.length === 0 && !BASIC.includes(moduleKey)) mute.push(moduleKey);
    }
    expect(mute).toEqual([]);
  });
});

describe("el menú no enseña envoltorios vacíos", () => {
  it("ninguna sección visible se queda sin elementos, con cualquier combinación", () => {
    const combinations: ModuleKey[][] = [
      BASIC,
      [...BASIC, "restaurant_inventory"],
      [...BASIC, "asset_inventory"],
      [...BASIC, "training"],
      [...BASIC, "onboarding", "productivity"],
      [...MODULE_KEYS],
    ];

    for (const modules of combinations) {
      const visible = menuFor(modules);
      for (const section of visibleSections(visible)) {
        const groups = itemsBySection(visible, section);
        expect(groups.length, `sección ${section} sin áreas con ${modules.join()}`).toBeGreaterThan(0);
        for (const group of groups) {
          expect(
            group.items.length,
            `área ${group.group} vacía en ${section} con ${modules.join()}`,
          ).toBeGreaterThan(0);
        }
      }
    }
  });

  it("sin ningún módulo contratado no queda ninguna sección operativa", () => {
    // Solo deberían sobrevivir las capacidades base, que no son comerciales.
    const visible = menuFor([]);
    const commercial = visible.filter((item) => item.requiresCommercialModule !== false);
    expect(commercial.map((item) => item.href)).toEqual([]);
  });
});

describe("la puerta del módulo va antes que la del permiso", () => {
  it("tener el permiso no abre un módulo que la empresa no contrató", () => {
    const restaurant = appNavigation.find((item) => item.href === "/inventory/restaurant")!;
    const decision = evaluateRouteAccess(restaurant, {
      sessionValid: true,
      tenantAllowed: true,
      subscriptionStatus: "active",
      role: "admin_empresa",
      hasModule: () => false,
      hasFeature: () => false,
      can: () => true,
      branchAvailable: true,
    });
    expect(decision.code).toBe("MODULE_NOT_ENABLED");
  });

  it("contratar el módulo no basta sin el permiso", () => {
    const restaurant = appNavigation.find((item) => item.href === "/inventory/restaurant")!;
    const decision = evaluateRouteAccess(restaurant, {
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
});

describe("los dos inventarios son módulos independientes", () => {
  const withOnly = (module: ModuleKey) => menuFor(["dashboard", "profile", "admin", module]);

  it("contratar restaurante no exige contratar activos", () => {
    const restaurant = withOnly("restaurant_inventory");
    expect(restaurant.some((item) => item.href === "/inventory/restaurant/dashboard")).toBe(true);
    expect(restaurant.some((item) => item.module === "asset_inventory")).toBe(false);
  });

  it("contratar activos no exige contratar restaurante", () => {
    const assets = withOnly("asset_inventory");
    expect(assets.some((item) => item.href === "/inventory/assets")).toBe(true);
    expect(assets.some((item) => item.module === "restaurant_inventory")).toBe(false);
  });

  it("el selector de inventario no pertenece a ninguno de los dos", () => {
    // Estaba declarado con `module: "asset_inventory"`, así que una empresa
    // con SOLO restaurante recibía «este módulo no está habilitado» al
    // abrirlo, siendo falso: el que no tiene es el otro.
    const entry = appNavigation.find((item) => item.href === "/inventory")!;
    expect(entry.module).not.toBe("asset_inventory");
    expect(entry.module).not.toBe("restaurant_inventory");

    for (const moduleKey of ["asset_inventory", "restaurant_inventory"] as ModuleKey[]) {
      const decision = evaluateRouteAccess(entry, {
        sessionValid: true,
        tenantAllowed: true,
        subscriptionStatus: "active",
        role: "admin_empresa",
        hasModule: (candidate) => candidate === moduleKey,
        hasFeature: () => true,
        can: () => true,
        branchAvailable: true,
      });
      expect(decision.code, `con solo ${moduleKey}`).toBe("ALLOWED");
    }
  });
});
