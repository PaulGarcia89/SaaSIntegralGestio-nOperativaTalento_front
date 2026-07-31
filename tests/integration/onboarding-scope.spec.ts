import {
  expect,
  request as playwrightRequest,
  test,
  type APIRequestContext,
  type APIResponse,
} from "@playwright/test";

type AccountName = "MANAGER" | "VIEWER" | "OTHER_BRANCH" | "OTHER_TENANT";

type AuthenticatedAccount = {
  accessToken: string;
  tenantId: string;
  allowedBranchIds: string[];
  activeBranchId: string | null;
};

type OnboardingFlow = {
  id: string;
  branch: { id: string; name: string };
  tasks: Array<{ id: string; status: string }>;
};

type ScopeFixture = {
  account: AuthenticatedAccount;
  branchId: string;
  flows: OnboardingFlow[];
};

const requiredAccounts: AccountName[] = [
  "MANAGER",
  "VIEWER",
  "OTHER_BRANCH",
  "OTHER_TENANT",
];

function credentials(name: AccountName) {
  return {
    email: process.env[`E2E_ONBOARDING_${name}_EMAIL`] ?? "",
    password: process.env[`E2E_ONBOARDING_${name}_PASSWORD`] ?? "",
  };
}

function authHeaders(account: AuthenticatedAccount, tenantId: string, branchId: string) {
  return {
    Authorization: `Bearer ${account.accessToken}`,
    "x-tenant-id": tenantId,
    "x-branch-id": branchId,
  };
}

async function authenticate(api: APIRequestContext, name: AccountName) {
  const account = credentials(name);
  const response = await api.post("/auth/login", { data: account });
  expect(response.ok(), `No fue posible autenticar la cuenta ${name}.`).toBe(true);

  const payload = await response.json() as {
    accessToken: string;
    user: {
      tenantId: string;
      allowedBranchIds?: string[];
      activeBranchId?: string | null;
    };
  };

  return {
    accessToken: payload.accessToken,
    tenantId: payload.user.tenantId,
    allowedBranchIds: payload.user.allowedBranchIds ?? [],
    activeBranchId: payload.user.activeBranchId ?? null,
  } satisfies AuthenticatedAccount;
}

async function fetchScope(
  api: APIRequestContext,
  account: AuthenticatedAccount,
  branchId: string,
) {
  const response = await api.get(`/onboarding/flows?branchId=${encodeURIComponent(branchId)}`, {
    headers: authHeaders(account, account.tenantId, branchId),
  });
  expect(response.ok(), `No fue posible consultar onboarding para ${branchId}.`).toBe(true);
  const payload = await response.json() as { items: OnboardingFlow[] };
  return { account, branchId, flows: payload.items } satisfies ScopeFixture;
}

async function expectRejectedOrIsolated(
  response: APIResponse,
  forbiddenFlowIds: Set<string>,
) {
  if ([401, 403, 404].includes(response.status())) return;

  expect(response.status(), "El backend debe rechazar o aislar el alcance solicitado.").toBe(200);
  const payload = await response.json() as { items?: OnboardingFlow[] };
  const leakedIds = (payload.items ?? [])
    .map((flow) => flow.id)
    .filter((id) => forbiddenFlowIds.has(id));
  expect(leakedIds, "La respuesta contiene incorporaciones fuera del alcance del token.").toEqual([]);
}

test.describe.serial("seguridad backend de onboarding", () => {
  let api: APIRequestContext;
  let manager: ScopeFixture;
  let viewer: ScopeFixture;
  let otherBranch: ScopeFixture;
  let otherTenant: ScopeFixture;

  test.beforeAll(async () => {
    const missing = requiredAccounts.flatMap((name) => {
      const account = credentials(name);
      return [
        ...(!account.email ? [`E2E_ONBOARDING_${name}_EMAIL`] : []),
        ...(!account.password ? [`E2E_ONBOARDING_${name}_PASSWORD`] : []),
      ];
    });
    expect(missing, `Faltan credenciales de integración:\n${missing.join("\n")}`).toEqual([]);

    api = await playwrightRequest.newContext({
      baseURL: process.env.E2E_BACKEND_API_URL!.replace(/\/$/, ""),
      extraHTTPHeaders: { Accept: "application/json" },
    });

    const [managerAccount, viewerAccount, otherBranchAccount, otherTenantAccount] =
      await Promise.all(requiredAccounts.map((name) => authenticate(api, name)));

    expect(viewerAccount.tenantId, "El visor debe pertenecer al tenant del gestor.").toBe(managerAccount.tenantId);
    expect(otherBranchAccount.tenantId, "La cuenta de otra sucursal debe compartir tenant.").toBe(managerAccount.tenantId);
    expect(otherTenantAccount.tenantId, "La cuenta externa debe pertenecer a otro tenant.").not.toBe(managerAccount.tenantId);

    const managerBranchId = managerAccount.activeBranchId ?? managerAccount.allowedBranchIds[0];
    const viewerBranchId = viewerAccount.allowedBranchIds.includes(managerBranchId)
      ? managerBranchId
      : viewerAccount.activeBranchId ?? viewerAccount.allowedBranchIds[0];
    const otherBranchId = [
      otherBranchAccount.activeBranchId,
      ...otherBranchAccount.allowedBranchIds,
    ].find((branchId): branchId is string =>
      Boolean(branchId && branchId !== managerBranchId && !managerAccount.allowedBranchIds.includes(branchId)),
    );
    const otherTenantBranchId = otherTenantAccount.activeBranchId ?? otherTenantAccount.allowedBranchIds[0];

    expect(managerBranchId, "El gestor necesita una sucursal activa.").toBeTruthy();
    expect(viewerBranchId, "El visor necesita acceso a la sucursal del gestor.").toBe(managerBranchId);
    expect(otherBranchId, "Se necesita una sucursal del mismo tenant fuera del alcance del gestor.").toBeTruthy();
    expect(otherTenantBranchId, "La cuenta de otro tenant necesita una sucursal activa.").toBeTruthy();

    [manager, viewer, otherBranch, otherTenant] = await Promise.all([
      fetchScope(api, managerAccount, managerBranchId),
      fetchScope(api, viewerAccount, viewerBranchId),
      fetchScope(api, otherBranchAccount, otherBranchId!),
      fetchScope(api, otherTenantAccount, otherTenantBranchId),
    ]);

    expect(manager.flows.length, "La sucursal principal necesita al menos una incorporación sembrada.").toBeGreaterThan(0);
    expect(otherBranch.flows.length, "La segunda sucursal necesita al menos una incorporación sembrada.").toBeGreaterThan(0);
    expect(otherTenant.flows.length, "El segundo tenant necesita al menos una incorporación sembrada.").toBeGreaterThan(0);
    expect(manager.flows[0].tasks.length, "La incorporación principal necesita al menos una tarea.").toBeGreaterThan(0);
  });

  test.afterAll(async () => {
    await api?.dispose();
  });

  test("requiere autenticación para consultar incorporaciones", async () => {
    const response = await api.get("/onboarding/flows");
    expect([401, 403]).toContain(response.status());
  });

  test("mantiene al visor dentro de la misma sucursal", async () => {
    const managerIds = manager.flows.map((flow) => flow.id).sort();
    const viewerIds = viewer.flows.map((flow) => flow.id).sort();
    expect(viewerIds).toEqual(managerIds);
    expect(viewer.flows.every((flow) => flow.branch.id === manager.branchId)).toBe(true);
  });

  test("no permite leer incorporaciones de otra sucursal manipulando headers", async () => {
    const response = await api.get(
      `/onboarding/flows?branchId=${encodeURIComponent(otherBranch.branchId)}`,
      {
        headers: authHeaders(
          manager.account,
          manager.account.tenantId,
          otherBranch.branchId,
        ),
      },
    );
    await expectRejectedOrIsolated(
      response,
      new Set(otherBranch.flows.map((flow) => flow.id)),
    );
  });

  test("no permite leer incorporaciones de otro tenant manipulando headers", async () => {
    const response = await api.get(
      `/onboarding/flows?branchId=${encodeURIComponent(otherTenant.branchId)}`,
      {
        headers: authHeaders(
          manager.account,
          otherTenant.account.tenantId,
          otherTenant.branchId,
        ),
      },
    );
    await expectRejectedOrIsolated(
      response,
      new Set(otherTenant.flows.map((flow) => flow.id)),
    );
  });

  test("rechaza mutaciones de un usuario con permiso de solo lectura", async () => {
    const taskId = manager.flows[0].tasks[0].id;
    const response = await api.patch(`/onboarding/tasks/${encodeURIComponent(taskId)}`, {
      headers: authHeaders(viewer.account, viewer.account.tenantId, viewer.branchId),
      data: {},
    });
    expect(response.status()).toBe(403);
  });

  test("bloquea acceso directo a tareas de otra sucursal", async () => {
    const foreignTaskId = otherBranch.flows[0].tasks[0]?.id;
    expect(foreignTaskId, "La incorporación externa necesita una tarea.").toBeTruthy();
    const response = await api.patch(`/onboarding/tasks/${encodeURIComponent(foreignTaskId!)}`, {
      headers: authHeaders(manager.account, manager.account.tenantId, manager.branchId),
      data: {},
    });
    expect([403, 404]).toContain(response.status());
  });

  test("bloquea acceso directo a tareas de otro tenant", async () => {
    const foreignTaskId = otherTenant.flows[0].tasks[0]?.id;
    expect(foreignTaskId, "La incorporación de otro tenant necesita una tarea.").toBeTruthy();
    const response = await api.patch(`/onboarding/tasks/${encodeURIComponent(foreignTaskId!)}`, {
      headers: authHeaders(manager.account, manager.account.tenantId, manager.branchId),
      data: {},
    });
    expect([403, 404]).toContain(response.status());
  });
});
