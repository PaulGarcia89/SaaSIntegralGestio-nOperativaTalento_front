"use client";

import { cn } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";

/**
 * `tone="dark"` es aditivo y solo cambia colores: sobre un fondo grafito, el
 * control claro por defecto se lee como un parche pegado encima. Ninguna
 * llamada existente cambia de aspecto.
 */
export function LanguageSelector({ compact = false, tone = "light" }: { compact?: boolean; tone?: "light" | "dark" }) {
  const { locale, enabledLocales, setLocale, t } = useLocale();
  if (enabledLocales.length < 2) return null;
  const dark = tone === "dark";
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="sr-only">{t("language.select")}</span>
      <select value={locale} onChange={(event) => setLocale(event.target.value as "es" | "en")} aria-label={t("language.select")} className={cn(
        "min-h-[var(--control-h-touch)] rounded-lg border px-2 text-base sm:text-sm outline-none transition-colors",
        dark
          ? "border-surface-dark-ink/20 bg-surface-dark-ink/[0.08] text-surface-dark-ink focus:border-accent-fill focus:ring-2 focus:ring-accent-fill/30"
          : "border-border bg-background text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/30",
      )}>
        <option value="es">{compact ? "ES" : t("language.spanish")}</option>
        <option value="en">{compact ? "EN" : t("language.english")}</option>
      </select>
    </label>
  );
}
