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
    return form.subscribe({
      formState: { values: true },
      callback: () => {
        void key;
      },
    });
  }, [enabled, form, key]);

  return () => {};
}
