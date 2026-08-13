import { expect, request as playwrightRequest, test, type APIRequestContext } from "@playwright/test";

const enabled = process.env.E2E_CERTIFICATION_ENABLED === "true";

test.describe.serial("certificación autenticada de capacitación e inventario", () => {
  test.skip(!enabled, "Activa E2E_CERTIFICATION_ENABLED=true con una cuenta dedicada de certificación.");

  let api: APIRequestContext;
  let headers: Record<string, string>;

  test.beforeAll(async () => {
    api = await playwrightRequest.newContext({ baseURL: process.env.E2E_BACKEND_API_URL!.replace(/\/$/, ""), extraHTTPHeaders: { Accept: "application/json" } });
    const login = await api.post("/auth/login", { data: { email: process.env.E2E_CERTIFICATION_EMAIL, password: process.env.E2E_CERTIFICATION_PASSWORD } });
    expect(login.ok(), await login.text()).toBe(true);
    const session = await login.json() as { accessToken: string; user: { tenantId: string; activeBranchId?: string | null; allowedBranchIds?: string[] } };
    const branchId = process.env.E2E_CERTIFICATION_BRANCH_ID ?? session.user.activeBranchId ?? session.user.allowedBranchIds?.[0];
    expect(branchId, "La cuenta de certificación requiere una sucursal autorizada.").toBeTruthy();
    headers = { Authorization: `Bearer ${session.accessToken}`, "x-tenant-id": session.user.tenantId, "x-branch-id": branchId! };
  });

  test.afterAll(async () => { await api?.dispose(); });

  test("capacitación expone catálogo, asignaciones y certificados dentro del tenant", async () => {
    const [catalog, assignments, certificates] = await Promise.all([
      api.get("/training/catalog?page=1&pageSize=20", { headers }),
      api.get("/training/assignments?page=1&pageSize=20", { headers }),
      api.get("/training/certificates", { headers }),
    ]);
    expect(catalog.ok(), await catalog.text()).toBe(true);
    expect(assignments.ok(), await assignments.text()).toBe(true);
    expect(certificates.ok(), await certificates.text()).toBe(true);
  });

  test("inventario expone catálogo, stock, activos y operaciones dentro de la sucursal", async () => {
    const [catalog, warehouse, assets] = await Promise.all([
      api.get("/inventory/catalog", { headers }),
      api.get("/inventory/warehouse?page=1&pageSize=20", { headers }),
      api.get("/inventory/assets", { headers }),
    ]);
    expect(catalog.ok(), await catalog.text()).toBe(true);
    expect(warehouse.ok(), await warehouse.text()).toBe(true);
    expect(assets.ok(), await assets.text()).toBe(true);
  });

  test("rechaza una consulta sin token en módulos protegidos", async () => {
    const [training, inventory] = await Promise.all([api.get("/training/catalog"), api.get("/inventory/catalog")]);
    expect([401, 403]).toContain(training.status());
    expect([401, 403]).toContain(inventory.status());
  });
});
