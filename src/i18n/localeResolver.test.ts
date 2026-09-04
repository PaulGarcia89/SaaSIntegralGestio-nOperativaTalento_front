import { describe, expect, it } from "vitest";
import { normalizeLocale, resolveLocale, resolveLocaleBeforeSignIn } from "./localeResolver";

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

describe("resolveLocaleBeforeSignIn", () => {
  // El defecto real: un Mac en inglés mostraba la pantalla de acceso en inglés
  // a una plantilla hispanohablante. No faltaba ninguna traducción; el catálogo
  // está completo. Lo que fallaba era a quién se le preguntaba el idioma.
  it("ignora el navegador antes de que haya sesión", () => {
    expect(resolveLocaleBeforeSignIn({ enabled: ["es", "en"] })).toBe("es");
  });

  it("respeta la elección explícita del selector de idioma", () => {
    expect(resolveLocaleBeforeSignIn({ stored: "en", enabled: ["es", "en"] })).toBe("en");
    expect(resolveLocaleBeforeSignIn({ stored: "es", enabled: ["es", "en"] })).toBe("es");
  });

  it("cae en español si lo guardado no es un idioma soportado", () => {
    expect(resolveLocaleBeforeSignIn({ stored: "fr-FR", enabled: ["es", "en"] })).toBe("es");
  });

  it("no ofrece un idioma deshabilitado aunque esté guardado", () => {
    expect(resolveLocaleBeforeSignIn({ stored: "en", enabled: ["es"] })).toBe("es");
  });
});
