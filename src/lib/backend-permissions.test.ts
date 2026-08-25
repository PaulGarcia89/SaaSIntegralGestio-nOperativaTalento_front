import { describe, expect, it } from "vitest";
import { mapAuthUserToUi } from "./backend";

function authUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    userId: "user-1",
    sessionId: "session-1",
    email: "inventory@example.test",
    tenantId: "tenant-1",
    tenantSlug: "tenant-1",
    tenantName: "Tenant 1",
    roleScope: "BRANCH",
    allowedBranchIds: ["branch-1"],
    activeBranchId: "branch-1",
    availableBranches: [{ id: "branch-1", tenantId: "tenant-1", name: "Principal", location: "Miami" }],
    firstName: "Inventory",
    lastName: "User",
    isSuperAdmin: false,
    roles: ["INVENTORY_MANAGER"],
    permissions: [],
    enabledModules: ["RESTAURANT_INVENTORY"],
    featureFlags: [],
    subscriptionStatus: "ACTIVE",
    subscriptionGraceEndsAt: null,
    inventoryCapabilities: [{ code: "RESTAURANT_INVENTORY", enabled: true }],
    tenant: {
      id: "tenant-1",
      slug: "tenant-1",
      name: "Tenant 1",
      plan: "ENTERPRISE",
      enabledModules: ["RESTAURANT_INVENTORY"],
    },
    ...overrides,
  } as never;
}

describe("backend permission mapping", () => {
  it("maps inventory manager permissions to restaurant management", () => {
    const result = mapAuthUserToUi(authUser({
      permissions: ["inventory.read", "inventory.manage", "inventory.receipt.create"],
    }));

    expect(result.permissions).toEqual(expect.arrayContaining([
      "restaurant_inventory.view",
      "restaurant_inventory.manage",
    ]));
  });

  it("keeps read-only inventory access read-only", () => {
    const result = mapAuthUserToUi(authUser({
      roles: ["SUPERVISOR"],
      permissions: ["inventory.read"],
    }));

    expect(result.permissions).toContain("restaurant_inventory.view");
    expect(result.permissions).not.toContain("restaurant_inventory.manage");
  });

  it("does not expose restaurant inventory when its capability is disabled", () => {
    const result = mapAuthUserToUi(authUser({
      inventoryCapabilities: [{ code: "RESTAURANT_INVENTORY", enabled: false }],
      tenant: {
        id: "tenant-1",
        slug: "tenant-1",
        name: "Tenant 1",
        plan: "ENTERPRISE",
        enabledModules: ["INVENTORY"],
      },
      enabledModules: ["INVENTORY"],
    }));

    expect(result.enabledModules).not.toContain("restaurant_inventory");
  });
});
