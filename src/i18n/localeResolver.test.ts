import { describe, expect, it } from "vitest";
import { normalizeLocale, resolveLocale } from "./localeResolver";

describe("localeResolver", () => {
  it("normaliza variantes regionales soportadas", () => {
    expect(normalizeLocale("en-US")).toBe("en");
    expect(normalizeLocale("es_EC")).toBe("es");
    expect(normalizeLocale("fr-FR")).toBeNull();
  });

  it("respeta la prioridad y los idiomas habilitados", () => {
    expect(resolveLocale({ manual: "en", user: "es", enabled: ["es", "en"] })).toBe("en");
    expect(resolveLocale({ manual: "en", user: "es", enabled: ["es"] })).toBe("es");
    expect(resolveLocale({ browser: "en-US", enabled: ["es", "en"] })).toBe("en");
  });

  it("usa español como fallback cuando no hay un locale válido", () => {
    expect(resolveLocale({ manual: "fr", browser: "de-DE", enabled: ["es", "en"] })).toBe("es");
  });
});
