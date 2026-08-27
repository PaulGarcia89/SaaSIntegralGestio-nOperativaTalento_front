import type { VacancyApplicationField, VacancyApplicationFormSchema } from "@/lib/contracts";
import type { SupportedLocale } from "@/i18n/types";

export function localizedApplicationFormSchema(schema: VacancyApplicationFormSchema | null | undefined, locale: SupportedLocale): VacancyApplicationFormSchema | null {
  if (!schema) return null;
  return {
    ...schema,
    sections: schema.sections?.map((section) => ({
      ...section,
      ...(section.translations?.[locale] ?? {}),
      fields: section.fields.map((field) => ({ ...field, ...(field.translations?.[locale] ?? {}) })),
    })),
    fields: schema.fields?.map((field) => ({ ...field, ...(field.translations?.[locale] ?? {}) })),
  };
}

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

export function applicationFormSchemaForApi(
  schema?: VacancyApplicationFormSchema | null,
): { sections: Array<{ id: string; title: string; description?: string; fields: Array<VacancyApplicationField & { required: boolean }> }> } {
  const sourceSections = schema?.sections?.length
    ? schema.sections
    : schema?.fields?.length
      ? [{ id: "application", title: "Preguntas adicionales", fields: schema.fields }]
      : [];

  return {
    sections: sourceSections.map((section, index) => ({
      id: section.id?.trim() || `section-${index + 1}`,
      title: section.title?.trim() || `Sección ${index + 1}`,
      ...(section.description?.trim() ? { description: section.description.trim() } : {}),
      fields: section.fields.map((field) => ({
        ...field,
        required: Boolean(field.required),
      })),
    })),
  };
}
