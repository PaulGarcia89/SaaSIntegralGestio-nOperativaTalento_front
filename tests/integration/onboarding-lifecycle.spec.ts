import {
  expect,
  request as playwrightRequest,
  test,
  type APIRequestContext,
} from "@playwright/test";

type LoginPayload = {
  accessToken: string;
  user: {
    tenantId: string;
    activeBranchId?: string | null;
    allowedBranchIds?: string[];
  };
};

type HiringResult = {
  employeeId: string;
  onboardingFlow?: {
    id: string;
    tasks?: Array<{ id: string; status: string }>;
  } | null;
};

const applicationId = process.env.E2E_ONBOARDING_APPROVED_APPLICATION_ID;

test.describe.serial("ciclo completo de incorporación contra backend", () => {
  test.skip(!applicationId, "Requiere un candidato aprobado dedicado para una prueba destructiva.");

  let api: APIRequestContext;
  let headers: Record<string, string>;

  test.beforeAll(async () => {
    api = await playwrightRequest.newContext({
      baseURL: process.env.E2E_BACKEND_API_URL!.replace(/\/$/, ""),
      extraHTTPHeaders: { Accept: "application/json" },
    });
    const login = await api.post("/auth/login", {
      data: {
        email: process.env.E2E_ONBOARDING_MANAGER_EMAIL,
        password: process.env.E2E_ONBOARDING_MANAGER_PASSWORD,
      },
    });
    expect(login.ok()).toBe(true);
    const payload = await login.json() as LoginPayload;
    const branchId =
      process.env.E2E_ONBOARDING_APPROVED_APPLICATION_BRANCH_ID ??
      payload.user.activeBranchId ??
      payload.user.allowedBranchIds?.[0];
    expect(branchId, "La prueba requiere la sucursal del candidato aprobado.").toBeTruthy();
    headers = {
      Authorization: `Bearer ${payload.accessToken}`,
      "x-tenant-id": payload.user.tenantId,
      "x-branch-id": branchId!,
    };
  });

  test.afterAll(async () => {
    await api?.dispose();
  });

  test("candidato aprobado → empleado → flujo → tarea → documento → revisión", async () => {
    const branchId = headers["x-branch-id"];
    const hiring = await api.post("/workflows/hiring", {
      headers,
      data: {
        applicationId,
        branchId,
        jobTitle: process.env.E2E_ONBOARDING_JOB_TITLE ?? "Colaborador E2E",
        sourceModule: "ATS",
        metadata: { source: "playwright-onboarding-lifecycle" },
      },
    });
    expect(hiring.ok(), await hiring.text()).toBe(true);
    const workflow = await hiring.json() as HiringResult;
    expect(workflow.employeeId).toBeTruthy();
    expect(workflow.onboardingFlow?.id).toBeTruthy();
    expect(workflow.onboardingFlow?.tasks?.length).toBeGreaterThan(0);

    const flowId = workflow.onboardingFlow!.id;
    const taskId = workflow.onboardingFlow!.tasks![0].id;
    const taskUpdate = await api.patch(`/onboarding/tasks/${taskId}`, {
      headers,
      data: { status: "COMPLETED" },
    });
    expect(taskUpdate.ok(), await taskUpdate.text()).toBe(true);

    const upload = await api.post(`/onboarding/flows/${flowId}/documents`, {
      headers,
      multipart: {
        taskId,
        category: "IDENTITY",
        file: {
          name: "onboarding-e2e.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF"),
        },
      },
    });
    expect(upload.ok(), await upload.text()).toBe(true);
    const document = await upload.json() as {
      id: string;
      storageVisibility: string;
      encryptedAtRest: boolean;
      scannedAt: string;
    };
    expect(document.storageVisibility).toBe("PRIVATE");
    expect(document.encryptedAtRest).toBe(true);
    expect(document.scannedAt).toBeTruthy();

    const review = await api.patch(`/onboarding/documents/${document.id}/review`, {
      headers,
      data: { status: "APPROVED" },
    });
    expect(review.ok(), await review.text()).toBe(true);

    const flowResponse = await api.get(`/onboarding/flows/${flowId}`, { headers });
    expect(flowResponse.ok()).toBe(true);
    const flow = await flowResponse.json() as {
      documents: Array<{ id: string; status: string }>;
      timeline: Array<{ actor?: { id?: string; name: string; type: string } }>;
    };
    expect(flow.documents).toContainEqual(expect.objectContaining({ id: document.id, status: "APPROVED" }));
    expect(flow.timeline.some((event) => event.actor?.type === "USER" && event.actor.id)).toBe(true);
  });
});
