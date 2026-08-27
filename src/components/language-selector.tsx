"use client";

import { useLocale } from "@/components/locale-provider";

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { locale, enabledLocales, setLocale, t } = useLocale();
  if (enabledLocales.length < 2) return null;
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="sr-only">{t("language.select")}</span>
      <select value={locale} onChange={(event) => setLocale(event.target.value as "es" | "en")} aria-label={t("language.select")} className="h-9 rounded-lg border border-border bg-background px-2 text-sm">
        <option value="es">{compact ? "ES" : t("language.spanish")}</option>
        <option value="en">{compact ? "EN" : t("language.english")}</option>
      </select>
    </label>
  );
}
