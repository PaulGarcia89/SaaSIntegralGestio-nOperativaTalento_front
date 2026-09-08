"use client";

import { useMemo } from "react";
import { useLocale } from "@/components/locale-provider";
import { translateUiCopy } from "@/i18n/ui-copy";

/** Translates explicitly marked interface copy; never traverses user data. */
export function useUiText() {
  const { locale } = useLocale();
  return useMemo(() => Object.assign((source: string, params?: Record<string, string | number>, context?: string) => translateUiCopy(locale, source, params, context), { locale }), [locale]);
}
