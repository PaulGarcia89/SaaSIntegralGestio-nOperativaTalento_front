import type { SupportedLocale } from "./types";

export function localizedDate(value: string | number | Date, locale: SupportedLocale, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale, options).format(new Date(value));
}

export function localizedNumber(value: number, locale: SupportedLocale, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function localizedCurrency(value: number, currency: string, locale: SupportedLocale) {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
}

export function relativeTime(value: number, unit: Intl.RelativeTimeFormatUnit, locale: SupportedLocale) {
  return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(value, unit);
}
