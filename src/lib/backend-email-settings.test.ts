import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchCompanyEmailSettings } from "./backend";

afterEach(() => vi.unstubAllGlobals());
function mockResponse(body: string) {
  vi.stubGlobal("window", { setTimeout, clearTimeout, localStorage: { getItem: () => null }, sessionStorage: { getItem: () => null } });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { status: 200 })));
}
describe("company email settings", () => {
  it.each(["", "null"])("allows an unconfigured company response %j", async (body) => {
    mockResponse(body);
    expect(await fetchCompanyEmailSettings()).toBeNull();
  });
  it("preserves saved settings", async () => {
    const settings = { smtpHost: "mail.example.com", passwordConfigured: true };
    mockResponse(JSON.stringify(settings));
    expect(await fetchCompanyEmailSettings()).toEqual(settings);
  });
  it("does not silently accept malformed responses", async () => {
    mockResponse("<html>Proxy error</html>");
    await expect(fetchCompanyEmailSettings()).rejects.toThrow();
  });
});
