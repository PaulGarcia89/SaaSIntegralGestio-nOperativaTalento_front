import { describe, expect, it } from "vitest";
import { appNavigation, evaluateRouteAccess, getRoutePolicy, itemsBySection, navSections, type RouteAccessContext, type NavSection } from "./navigation";
const routes = [
  ["ats", "/ats/analytics"], ["onboarding", "/onboarding/analytics"], ["training", "/training/results"],
  ["people", "/people/reports"], ["productivity", "/productivity/reports"],
  ["asset_inventory", "/inventory/assets/analytics"], ["restaurant_inventory", "/inventory/restaurant/reports"],
  ["administracion", "/admin/reports"],
] as const;
const context: RouteAccessContext = { sessionValid: true, tenantAllowed: true, subscriptionStatus: "active", role: "admin_empresa", hasModule: () => true, hasFeature: () => true, can: () => true, branchAvailable: true };
describe("reports belong to their own module", () => {
  it("removes the general report section and keeps its legacy route hidden", () => {
    expect(navSections.some(section => section.id === "reportes")).toBe(false);
    expect(getRoutePolicy("/reports")?.showInNavigation).toBe(false);
    expect(appNavigation.filter(item => item.showInNavigation !== false).some(item => item.module === "reports")).toBe(false);
  });
  it.each(routes)("provides Reports inside %s", (section, href) => {
    const entries = itemsBySection(appNavigation, section as NavSection).flatMap(group => group.items);
    expect(entries.filter(item => item.label === "Reportes")).toHaveLength(1);
    const policy = getRoutePolicy(href)!;
    expect(policy.section).toBe(section);
    expect(policy.module).not.toBe("reports");
    expect(evaluateRouteAccess(policy, { ...context, hasModule: module => module !== "reports" }).allowed).toBe(true);
    expect(evaluateRouteAccess(policy, { ...context, can: () => false }).allowed).toBe(false);
    expect(evaluateRouteAccess(policy, { ...context, tenantAllowed: false }).allowed).toBe(false);
    if (policy.requiresCommercialModule !== false) {
      expect(evaluateRouteAccess(policy, { ...context, hasModule: module => module !== policy.module }).code).toBe("MODULE_NOT_ENABLED");
      expect(evaluateRouteAccess(policy, { ...context, hasFeature: () => false }).code).toBe("FEATURE_NOT_ENABLED");
    }
  });
});
