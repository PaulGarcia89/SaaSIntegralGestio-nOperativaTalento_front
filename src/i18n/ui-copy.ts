import english from "./locales/en/ui-copy.json";
import type { SupportedLocale } from "./types";

const dictionary: Record<string, string> = english;

/** Source-key catalog for migrating legacy interface copy incrementally. */
export function translateUiCopy(locale: SupportedLocale, source: string, params: Record<string, string | number> = {}, context?: string): string {
  const key = source.trim();
  const lookup = context ? `${context}::${key}` : key;
  const translated = locale === "en" && Object.hasOwn(dictionary, lookup) ? dictionary[lookup] : undefined;
  const result = translated === undefined ? source : source.slice(0, source.indexOf(key)) + translated + source.slice(source.indexOf(key) + key.length);
  return result.replace(/\{\{(\w+)\}\}/g, (match, name: string) => Object.hasOwn(params, name) ? String(params[name]) : match);
}
