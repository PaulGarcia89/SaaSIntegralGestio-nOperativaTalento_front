import { expect, request as playwrightRequest, test, type APIRequestContext } from "@playwright/test";

const enabled = process.env.E2E_INVENTORY_API_ENABLED === "true";
const apiUrl = process.env.E2E_BACKEND_API_URL?.replace(/\/$/, "");
const email = process.env.E2E_INVENTORY_EMAIL;
const password = process.env.E2E_INVENTORY_PASSWORD;
const branchId = process.env.E2E_INVENTORY_BRANCH_ID;
const warehouseId = process.env.E2E_INVENTORY_WAREHOUSE_ID;
const ingredientId = process.env.E2E_INVENTORY_INGREDIENT_ID;
const unitId = process.env.E2E_INVENTORY_UNIT_ID;

test.describe("contrato API de transacciones de inventario de restaurante", () => {
  test.skip(!enabled || !apiUrl || !email || !password || !branchId || !warehouseId || !ingredientId || !unitId, "Configura fixtures dedicados y E2E_INVENTORY_API_ENABLED=true.");

  let api: APIRequestContext;
  let token = "";

  test.beforeAll(async () => {
    api = await playwrightRequest.newContext({ baseURL: apiUrl, extraHTTPHeaders: { Accept: "application/json" } });
    const login = await api.post("/auth/login", { data: { email, password } });
    expect(login.ok()).toBeTruthy();
    const session = await login.json();
    token = String(session.accessToken ?? session.token ?? "");
    expect(token).toBeTruthy();
  });

  test.afterAll(async () => {
    await api?.dispose();
  });

  test("rechaza operaciones sin contexto de sucursal y almacén", async () => {
    const response = await api.post("/restaurant-inventory/wastes", {
      headers: { Authorization: `Bearer ${token}` },
      data: { reason: "Prueba de validación", items: [] },
    });
    expect([400, 403, 422]).toContain(response.status());
  });

  test("mantiene idempotencia al crear y confirmar una merma", async () => {
    const key = `inventory-cert-${Date.now()}`;
    const headers = { Authorization: `Bearer ${token}`, "x-branch-id": branchId!, "Idempotency-Key": key };
    const payload = { branchId, warehouseId, wasteDate: new Date().toISOString(), reason: "Prueba de validación", items: [{ ingredientId, unitId, quantity: 0.01 }] };
    const first = await api.post("/restaurant-inventory/wastes", { headers, data: payload });
    const second = await api.post("/restaurant-inventory/wastes", { headers, data: payload });
    expect(first.ok()).toBeTruthy();
    expect(second.ok()).toBeTruthy();
    const firstBody = await first.json();
    const secondBody = await second.json();
    expect(secondBody.id).toBe(firstBody.id);

    const confirmKey = `${key}-confirm`;
    const confirmHeaders = { ...headers, "Idempotency-Key": confirmKey };
    const confirmed = await api.post(`/restaurant-inventory/wastes/${firstBody.id}/confirm`, { headers: confirmHeaders, data: {} });
    const repeated = await api.post(`/restaurant-inventory/wastes/${firstBody.id}/confirm`, { headers: confirmHeaders, data: {} });
    expect(confirmed.ok()).toBeTruthy();
    expect(repeated.ok()).toBeTruthy();
    expect((await repeated.json()).id).toBe(firstBody.id);
  });
});
