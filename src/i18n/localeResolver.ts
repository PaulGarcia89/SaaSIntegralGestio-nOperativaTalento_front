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

export function getBrowserLocale() {
  if (typeof navigator === "undefined") return null;
  return normalizeLocale(navigator.language);
}
