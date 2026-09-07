import { describe, it } from "vitest";
import type { ModuleKey } from "@/lib/contracts";
import { appNavigation, evaluateRouteAccess, itemsBySection, navSections, visibleSections } from "@/lib/navigation";

function menuFor(modules: ModuleKey[]) {
  const enabled = new Set<string>(modules);
  return appNavigation.filter((item) => item.showInNavigation !== false && evaluateRouteAccess(item, {
    sessionValid: true, tenantAllowed: true, subscriptionStatus: "active", role: "admin_empresa",
    hasModule: (m) => enabled.has(m), hasFeature: (f) => modules.some((m) => f === `module.${m}`),
    can: () => true, branchAvailable: true,
  }).allowed);
}
describe("vista previa", () => {
  it("imprime el menú por suscripción", () => {
    const cases: Array<[string, ModuleKey[]]> = [
      ["BÁSICA (panel, perfil, reclutamiento)", ["dashboard", "profile", "ats"]],
      ["CRECIMIENTO (+ incorporación, capacitación, alertas)", ["dashboard", "profile", "ats", "onboarding", "training", "notifications", "admin"]],
      ["EMPRESARIAL (restaurante completo)", ["dashboard", "profile", "ats", "onboarding", "training", "productivity", "asset_inventory", "restaurant_inventory", "notifications", "reports", "admin"]],
    ];
    for (const [name, modules] of cases) {
      const visible = menuFor(modules);
      console.log(`\n### ${name} — ${visible.length} pantallas`);
      for (const id of visibleSections(visible)) {
        const groups = itemsBySection(visible, id);
        const total = groups.reduce((n, g) => n + g.items.length, 0);
        console.log(`  ▸ ${navSections.find((s) => s.id === id)!.label}  (${total})`
          + (groups.length > 1 ? `   áreas: ${groups.map((g) => `${g.group}:${g.items.length}`).join(", ")}` : ""));
      }
    }
  });
});
