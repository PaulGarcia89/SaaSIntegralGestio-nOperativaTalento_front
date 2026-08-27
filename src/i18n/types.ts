export const SUPPORTED_LOCALES = ["es", "en"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = "es";
export const FALLBACK_LOCALE: SupportedLocale = "es";

export type TranslationParams = Record<string, number | string>;
export type TranslationCatalog = Record<string, string>;
