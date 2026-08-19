import { describe, expect, it } from "vitest";
import {
  appNavigation,
  candidateNavigation,
  evaluateRouteAccess,
  getRoutePolicy,
  isAudienceAllowed,
  isRoleAllowed,
  type RouteAccessContext,
} from "./navigation";

describe("navigation policy", () => {
  it("resolves the most specific route policy", () => {
    expect(getRoutePolicy("/admin/users")?.permission).toBe("users.view");
    expect(getRoutePolicy("/admin/users/invitations")?.href).toBe("/admin/users");
  });

  it("does not resolve unknown protected routes", () => {
    expect(getRoutePolicy("/internal/unknown")).toBeUndefined();
  });

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
    for (const href of ["/ats/pipeline", "/ats/talent-crm", "/ats/communications", "/ats/scorecards"]) {
      expect(atsItems.find((item) => item.href === href)?.showInNavigation).not.toBe(false);
    }
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
    permissions.add("users.view");
    expect(evaluateRouteAccess(policy, context).code).toBe("ALLOWED");
    permissions.delete("users.view");
    expect(evaluateRouteAccess(policy, context).code).toBe("PERMISSION_DENIED");
  });

  it("declares a feature flag and operational state for every protected route", () => {
    expect(appNavigation.every((item) => item.featureFlag.startsWith("module.") && item.requiredPermissions.length > 0 && typeof item.available === "boolean")).toBe(true);
    expect(evaluateRouteAccess(getRoutePolicy("/reports")!, { ...({ sessionValid: true, tenantAllowed: true, subscriptionStatus: "active", role: "admin_saas", hasModule: () => true, hasFeature: () => true, can: () => true, branchAvailable: true } satisfies RouteAccessContext) }).code).toBe("ALLOWED");
  });
});
