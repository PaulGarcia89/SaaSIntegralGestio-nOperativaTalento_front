import { beforeEach, describe, expect, it, vi } from "vitest";
import { draftStorageKey, loadScopedDraft, purgeExpiredDrafts, removeScopedDraft, saveScopedDraft } from "./draft-storage";

const fetchMyPreferences = vi.fn();
const updateMyPreference = vi.fn();

vi.mock("@/lib/backend", () => ({
  fetchMyPreferences: () => fetchMyPreferences(),
  updateMyPreference: (...args: unknown[]) => updateMyPreference(...args),
}));

const scope = { namespace: "vacancy", tenantId: "tenant-a", userId: "user-a" };

beforeEach(() => {
  fetchMyPreferences.mockReset();
  updateMyPreference.mockReset();
});

describe("draft storage", () => {
  it("aísla el borrador por tenant y usuario", async () => {
    fetchMyPreferences.mockResolvedValue({
      drafts: {
        [draftStorageKey(scope)]: {
          version: 1,
          scope,
          savedAt: 100,
          expiresAt: 1100,
          value: { title: "Vacante" },
        },
      },
    });

    await expect(loadScopedDraft<{ title: string }>(scope, 200)).resolves.toMatchObject({ value: { title: "Vacante" } });
    await expect(loadScopedDraft({ ...scope, userId: "user-b" }, 200)).resolves.toBeNull();
  });

  it("persiste y elimina drafts mediante preferencias", async () => {
    fetchMyPreferences.mockResolvedValue({ drafts: {} });
    await saveScopedDraft(scope, { title: "Vacante" }, 1000, 100);
    expect(updateMyPreference).toHaveBeenCalledWith("drafts", expect.objectContaining({ [draftStorageKey(scope)]: expect.objectContaining({ value: { title: "Vacante" } }) }));

    fetchMyPreferences.mockResolvedValue({ drafts: { [draftStorageKey(scope)]: { version: 1, scope, savedAt: 100, expiresAt: 1100, value: { title: "Vacante" } } } });
    await removeScopedDraft(scope);
    expect(updateMyPreference).toHaveBeenLastCalledWith("drafts", {});
  });

  it("purga registros vencidos sin tocar los vigentes", async () => {
    fetchMyPreferences.mockResolvedValue({
      drafts: {
        [draftStorageKey(scope)]: { version: 1, scope, savedAt: 100, expiresAt: 1100, value: { title: "Vigente" } },
        [draftStorageKey({ ...scope, resourceId: "expired" })]: { version: 1, scope: { ...scope, resourceId: "expired" }, savedAt: 100, expiresAt: 150, value: { title: "Vencido" } },
      },
    });

    await purgeExpiredDrafts(200);
    expect(updateMyPreference).toHaveBeenCalledWith("drafts", expect.objectContaining({ [draftStorageKey(scope)]: expect.anything() }));
    expect(updateMyPreference).toHaveBeenCalledWith("drafts", expect.not.objectContaining({ [draftStorageKey({ ...scope, resourceId: "expired" })]: expect.anything() }));
  });
});
