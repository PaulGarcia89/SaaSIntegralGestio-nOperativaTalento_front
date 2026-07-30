import type { VacancyApplicationField, VacancyApplicationFormSchema } from "@/lib/contracts";

export function getApplicationFields(schema?: VacancyApplicationFormSchema | null): VacancyApplicationField[] {
  return [...(schema?.fields ?? []), ...(schema?.sections ?? []).flatMap((section) => section.fields ?? [])];
}

export function missingRequiredApplicationFields(schema: VacancyApplicationFormSchema | null | undefined, responses: Record<string, unknown> = {}) {
  return getApplicationFields(schema).filter((field) => {
    if (!field.required) return false;
    const value = responses[field.key];
    if (field.type === "BOOLEAN") return value !== true;
    if (Array.isArray(value)) return value.length === 0;
    return typeof value !== "number" && (typeof value !== "string" || !value.trim());
  });
}
