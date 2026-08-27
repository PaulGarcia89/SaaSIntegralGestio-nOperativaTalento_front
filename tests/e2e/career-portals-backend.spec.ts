import { test, expect } from "@playwright/test";

const backendUrl = process.env.E2E_BACKEND_API_URL?.replace(/\/$/, "");
const portalSlug = process.env.E2E_PRIVATE_PORTAL_SLUG ?? "marketplace";
const candidateEmail = process.env.E2E_CANDIDATE_EMAIL;
const candidatePassword = process.env.E2E_CANDIDATE_PASSWORD;

test.describe("career portals against the real backend", () => {
  test.beforeEach(() => {
    test.skip(process.env.E2E_REAL_BACKEND !== "true" || !backendUrl, "Configura E2E_REAL_BACKEND=true y E2E_BACKEND_API_URL para ejecutar contra el backend real.");
  });

  test("resolves a portal by slug and hostname", async ({ request }) => {
    const response = await request.get(`${backendUrl}/career-portals/resolve?slug=${encodeURIComponent(portalSlug)}`, { headers: process.env.E2E_CAREER_HOSTNAME ? { host: process.env.E2E_CAREER_HOSTNAME } : undefined });
    expect(response.ok()).toBeTruthy();
    expect(await response.json()).toEqual(expect.objectContaining({ id: expect.any(String), slug: expect.any(String), type: expect.any(String), access: expect.any(String) }));
  });

  test("loads the public vacancy contract", async ({ request }) => {
    const response = await request.get(`${backendUrl}/career-portals/${encodeURIComponent(portalSlug)}/vacancies?page=1&pageSize=10`);
    expect([200, 401, 403]).toContain(response.status());
    if (response.ok()) expect(await response.json()).toEqual(expect.objectContaining({ data: expect.any(Array) }));
  });

  test("authenticates a candidate and reads applications", async ({ request }) => {
    test.skip(!candidateEmail || !candidatePassword, "Configura E2E_CANDIDATE_EMAIL y E2E_CANDIDATE_PASSWORD para validar login.");
    const login = await request.post(`${backendUrl}/applicant-auth/login`, { data: { email: candidateEmail, password: candidatePassword, portalSlug } });
    expect(login.ok()).toBeTruthy();
    const loginBody = await login.json();
    const accessToken = loginBody.accessToken ?? loginBody.token;
    expect(accessToken).toEqual(expect.any(String));
    expect((await request.get(`${backendUrl}/candidate/applications`, { headers: { authorization: `Bearer ${accessToken}` } })).ok()).toBeTruthy();
  });

  test("submits an application only when mutation is explicitly enabled", async ({ request }) => {
    test.skip(process.env.E2E_ALLOW_APPLICATION_MUTATION !== "true" || !process.env.E2E_CANDIDATE_VACANCY_ID || !candidateEmail || !candidatePassword, "La postulación E2E requiere E2E_ALLOW_APPLICATION_MUTATION=true, vacante y credenciales dedicadas.");
    const login = await request.post(`${backendUrl}/applicant-auth/login`, { data: { email: candidateEmail, password: candidatePassword, portalSlug } });
    expect(login.ok()).toBeTruthy();
    const loginBody = await login.json();
    const accessToken = loginBody.accessToken ?? loginBody.token;
    const application = await request.post(`${backendUrl}/public/vacancies/${encodeURIComponent(process.env.E2E_CANDIDATE_VACANCY_ID!)}/applications`, { headers: { authorization: `Bearer ${accessToken}` }, data: { fullName: "E2E Candidate", email: candidateEmail, dynamicResponses: {} } });
    expect([200, 201, 409]).toContain(application.status());
  });
});
