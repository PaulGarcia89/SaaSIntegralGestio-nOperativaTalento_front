import esCommon from "./locales/es/common.json";
import enCommon from "./locales/en/common.json";
import type { SupportedLocale, TranslationCatalog, TranslationParams } from "./types";
import { FALLBACK_LOCALE } from "./types";

export const catalogs: Record<SupportedLocale, TranslationCatalog> = {
  es: esCommon,
  en: enCommon,
};

export function translate(locale: SupportedLocale, key: string, params: TranslationParams = {}) {
  const template = catalogs[locale][key] ?? catalogs[FALLBACK_LOCALE][key] ?? key;
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(params[name] ?? `{{${name}}}`));
}

export * from "./formats";
export * from "./localeResolver";
export * from "./types";
