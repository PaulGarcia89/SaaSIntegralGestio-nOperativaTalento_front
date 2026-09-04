import { DEFAULT_LOCALE, FALLBACK_LOCALE, SUPPORTED_LOCALES, type SupportedLocale } from "./types";

export function normalizeLocale(value?: string | null): SupportedLocale | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase().replace("_", "-");
  if (normalized === "es" || normalized.startsWith("es-")) return "es";
  if (normalized === "en" || normalized.startsWith("en-")) return "en";
  return null;
}

export function resolveLocale(options: {
  manual?: string | null;
  user?: string | null;
  stored?: string | null;
  browser?: string | null;
  enabled?: readonly SupportedLocale[];
  portalDefault?: string | null;
  companyDefault?: string | null;
} = {}): SupportedLocale {
  const enabled = options.enabled?.length ? options.enabled : SUPPORTED_LOCALES;
  const candidates = [
    options.manual,
    options.user,
    options.stored,
    options.browser,
    options.portalDefault,
    options.companyDefault,
    DEFAULT_LOCALE,
  ];
  return candidates.map(normalizeLocale).find((candidate) => candidate && enabled.includes(candidate)) ??
    (enabled.includes(FALLBACK_LOCALE) ? FALLBACK_LOCALE : enabled[0] ?? DEFAULT_LOCALE);
}

/**
 * Idioma de las pantallas ANTERIORES al acceso (login, recuperar contraseña,
 * alta de empresa).
 *
 * Deliberadamente NO consulta el idioma del navegador. `resolveLocale` sí lo
 * hace, y eso es correcto una vez que sabemos quién es la persona; pero antes
 * de entrar produce un resultado equivocado: un Mac configurado en inglés
 * mostraba la pantalla de acceso en inglés a una plantilla hispanohablante,
 * pese a que el idioma por defecto del producto es el español. El catálogo
 * está completo en ambos idiomas (no faltaba ninguna traducción), así que el
 * problema nunca fue de traducción sino de a quién se le pregunta.
 *
 * Manda, por este orden: la elección explícita que la persona hizo con el
 * selector de idioma (`stored`), y si no la hay, `DEFAULT_LOCALE`. El
 * navegador vuelve a contar en cuanto hay sesión.
 */
export function resolveLocaleBeforeSignIn(options: {
  stored?: string | null;
  enabled?: readonly SupportedLocale[];
} = {}): SupportedLocale {
  return resolveLocale({ stored: options.stored, enabled: options.enabled });
}

export function getBrowserLocale() {
  if (typeof navigator === "undefined") return null;
  return normalizeLocale(navigator.language);
}
