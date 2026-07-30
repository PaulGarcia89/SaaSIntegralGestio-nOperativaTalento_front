import { beforeEach, describe, expect, it, vi } from "vitest";
import { draftStorageKey, loadScopedDraft, purgeExpiredDrafts, saveScopedDraft } from "./draft-storage";

const scope = { namespace: "vacancy", tenantId: "tenant-a", userId: "user-a" };

function storageMock() {
  const data = new Map<string, string>();
  return {
    get length() { return data.size; },
    clear: () => data.clear(),
    getItem: (key: string) => data.get(key) ?? null,
    key: (index: number) => [...data.keys()][index] ?? null,
    removeItem: (key: string) => data.delete(key),
    setItem: (key: string, value: string) => data.set(key, value),
  } as Storage;
}

beforeEach(() => vi.stubGlobal("window", { sessionStorage: storageMock() }));

describe("draft storage", () => {
  it("aísla el borrador por tenant y usuario", () => {
    saveScopedDraft(scope, { title: "Vacante" }, 1000, 100);
    expect(loadScopedDraft<{ title: string }>(scope, 200)?.value.title).toBe("Vacante");
    expect(loadScopedDraft({ ...scope, userId: "user-b" }, 200)).toBeNull();
    expect(loadScopedDraft({ ...scope, tenantId: "tenant-b" }, 200)).toBeNull();
  });

  it("elimina borradores vencidos", () => {
    saveScopedDraft(scope, { title: "Vacante" }, 100, 100);
    expect(loadScopedDraft(scope, 201)).toBeNull();
    expect(window.sessionStorage.getItem(draftStorageKey(scope))).toBeNull();
  });

  it("purga registros vencidos sin borrar los vigentes", () => {
    saveScopedDraft(scope, { title: "Vigente" }, 1000, 100);
    const expired = { ...scope, resourceId: "expired" };
    saveScopedDraft(expired, { title: "Vencido" }, 50, 100);
    purgeExpiredDrafts(200);
    expect(loadScopedDraft(scope, 200)).not.toBeNull();
    expect(window.sessionStorage.getItem(draftStorageKey(expired))).toBeNull();
  });
});
