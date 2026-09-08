import { describe, expect, it } from "vitest";
import { appNavigation, navSections } from "@/lib/navigation";

/**
 * Regla principal del rediseño: la primera página de cada módulo es su
 * dashboard. Se comprueba sobre el menú real, no sobre una lista aparte,
 * para que un módulo nuevo sin dashboard rompa el test y no el producto.
 *
 * «Inicio» y «Reportes» no son módulos: Inicio ES el dashboard general y
 * Reportes es una sola pantalla de consulta. «Gobierno de plataforma» es el
 * área del administrador SaaS, fuera de los módulos que contrata una empresa;
 * su dashboard queda como trabajo aparte.
 */
const SIN_DASHBOARD_PROPIO = new Set(["inicio", "reportes", "plataforma"]);

/** Rutas cortas que se conservan por compatibilidad pero redirigen al dashboard. */
const ALIAS_REDIRIGIDOS = ["/ats", "/people", "/productivity", "/inventory/restaurant", "/onboarding"];

describe("cada módulo empieza por su dashboard", () => {
  for (const section of navSections) {
    if (SIN_DASHBOARD_PROPIO.has(section.id)) continue;

    it(`${section.label}: el primer ítem visible del menú es «Dashboard» y vive en …/dashboard`, () => {
      const visibles = appNavigation.filter((item) => item.section === section.id && item.showInNavigation !== false);
      expect(visibles.length, `la sección ${section.id} no tiene ítems visibles`).toBeGreaterThan(0);
      expect(visibles[0].label.startsWith("Dashboard"), `${section.id}: primer ítem = «${visibles[0].label}»`).toBe(true);
      expect(visibles[0].href.endsWith("/dashboard"), `${section.id}: primer href = ${visibles[0].href}`).toBe(true);
      expect(visibles[0].icon).toBe("dashboard");
    });
  }

  it("las rutas cortas de los módulos siguen declaradas (no se eliminan rutas), pero fuera del menú", () => {
    for (const href of ALIAS_REDIRIGIDOS) {
      const entry = appNavigation.find((item) => item.href === href);
      if (href === "/onboarding") {
        // Nunca tuvo entrada propia: /onboarding siempre redirigió.
        expect(entry).toBeUndefined();
        continue;
      }
      expect(entry, `${href} debe seguir declarada`).toBeDefined();
      expect(entry?.showInNavigation, `${href} no debe ocupar sitio en el menú`).toBe(false);
    }
  });

  it("el dashboard de cada módulo exige lo mismo que el módulo (módulo y permiso), nunca menos", () => {
    const dashboards = appNavigation.filter(
      (item) => item.href.endsWith("/dashboard") && item.href !== "/dashboard" && item.showInNavigation !== false,
    );
    expect(dashboards.length).toBeGreaterThanOrEqual(9);
    for (const dashboard of dashboards) {
      const hermanos = appNavigation.filter(
        (item) => item.section === dashboard.section && item.group === dashboard.group && item.href !== dashboard.href,
      );
      // El dashboard pertenece al mismo módulo que el resto de su grupo.
      expect(hermanos.some((item) => item.module === dashboard.module), `${dashboard.href}: módulo ${dashboard.module}`).toBe(true);
      expect(dashboard.permission).toBeTruthy();
    }
  });
});
