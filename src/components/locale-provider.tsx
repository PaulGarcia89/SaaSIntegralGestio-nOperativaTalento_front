"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { fetchMyPreferences, fetchPreferredLocale, updateMyPreference, updatePreferredLocale } from "@/lib/backend";
import { getBrowserLocale, normalizeLocale, resolveLocale } from "@/i18n/localeResolver";
import { translate } from "@/i18n";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type SupportedLocale, type TranslationParams } from "@/i18n/types";

const STORAGE_KEY = "talentos.locale";
const COOKIE_KEY = "talentos-locale";
type LocaleContextValue = { locale: SupportedLocale; enabledLocales: readonly SupportedLocale[]; setLocale: (locale: SupportedLocale) => void; t: (key: string, params?: TranslationParams) => string };
const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStoredLocale() {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored) return normalizeLocale(stored);
  return normalizeLocale(document.cookie.split(";").find((item) => item.trim().startsWith(`${COOKIE_KEY}=`))?.split("=")[1]);
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(DEFAULT_LOCALE);
  const enabledLocales = SUPPORTED_LOCALES;

  useEffect(() => {
    let cancelled = false;
    const stored = readStoredLocale();
    void fetchPreferredLocale()
      .then((preference) => {
        if (cancelled) return;
        const userLocale = preference.preferredLocale;
        setLocaleState(resolveLocale({ user: userLocale, stored, browser: getBrowserLocale(), enabled: enabledLocales }));
      })
      .catch(() => {
        void fetchMyPreferences()
          .then((preferences) => {
            if (cancelled) return;
            const preference = preferences["ui-locale"];
            const userLocale = typeof preference === "string" ? preference : typeof preference === "object" && preference !== null && "locale" in preference ? String(preference.locale) : null;
            setLocaleState(resolveLocale({ user: userLocale, stored, browser: getBrowserLocale(), enabled: enabledLocales }));
          })
          .catch(() => {
            if (!cancelled) setLocaleState(resolveLocale({ stored, browser: getBrowserLocale(), enabled: enabledLocales }));
          });
      });
    return () => { cancelled = true; };
  }, [enabledLocales]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.cookie = `${COOKIE_KEY}=${locale}; path=/; max-age=31536000; samesite=lax`;
  }, [locale]);

  const setLocale = useCallback((nextLocale: SupportedLocale) => {
    if (!enabledLocales.includes(nextLocale)) return;
    setLocaleState(nextLocale);
    window.localStorage.setItem(STORAGE_KEY, nextLocale);
    void updatePreferredLocale(nextLocale).catch(() => updateMyPreference("ui-locale", { locale: nextLocale }).catch(() => undefined));
  }, [enabledLocales]);

  const value = useMemo(() => ({ locale, enabledLocales, setLocale, t: (key: string, params?: TranslationParams) => translate(locale, key, params) }), [locale, enabledLocales, setLocale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale debe utilizarse dentro de LocaleProvider");
  return context;
}
