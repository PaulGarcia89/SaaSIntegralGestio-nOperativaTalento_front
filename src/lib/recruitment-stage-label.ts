import type { SupportedLocale } from "@/i18n/types";

const defaults: Record<string, { es: string; en: string; names: string[] }> = {
  APPLIED: { es: "Recibido", en: "Received", names: ["Recibido", "Received"] },
  SCREENING: { es: "En revisión", en: "In review", names: ["En revisión", "In review", "Under review"] },
  INTERVIEW: { es: "Entrevista", en: "Interview", names: ["Entrevista", "Interview"] },
  DECISION: { es: "Seleccionado", en: "Selected", names: ["Seleccionado", "Selected"] },
  REJECTED: { es: "Descartado", en: "Rejected", names: ["Descartado", "Rejected"] },
  HIRED: { es: "Contratado", en: "Hired", names: ["Contratado", "Hired"] },
};
const currentDefaults: Record<string, { es: string; en: string }> = {
  APPLIED: { es: "Postulación", en: "Application" },
  SCREENING: { es: "Revisión inicial", en: "Initial review" },
  INTERVIEW: { es: "Entrevistas", en: "Interviews" },
  DECISION: { es: "Decisión", en: "Decision" },
  HIRED: { es: "Contratación", en: "Hired" },
  REJECTED: { es: "No continúa", en: "Not moving forward" },
};
/** Only built-in stage names are translated. Company-defined labels remain unchanged. */
export function recruitmentStageLabel(stage: { code: string; name: string }, locale: SupportedLocale) {
  const current = currentDefaults[stage.code];
  if (current && [current.es, current.en].includes(stage.name)) return current[locale];
  const entry = defaults[stage.code];
  return entry?.names.includes(stage.name) ? entry[locale] : stage.name;
}
