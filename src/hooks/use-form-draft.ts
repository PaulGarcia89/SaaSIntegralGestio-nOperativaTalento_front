"use client";

import { useEffect } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

export function useFormDraft<T extends FieldValues>(
  key: string,
  form: UseFormReturn<T, unknown, T>,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return;
    const saved = window.sessionStorage.getItem(key);
    if (saved) {
      try {
        form.reset(JSON.parse(saved) as T);
      } catch {
        window.sessionStorage.removeItem(key);
      }
    }

    return form.subscribe({
      formState: { values: true },
      callback: ({ values }) => window.sessionStorage.setItem(key, JSON.stringify(values)),
    });
  }, [enabled, form, key]);

  return () => window.sessionStorage.removeItem(key);
}
