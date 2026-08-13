export type ProductEvent =
  | { name: "flow_step_viewed"; flow: string; step: number }
  | { name: "flow_step_back"; flow: string; from: number; to: number }
  | { name: "flow_completed"; flow: string; durationMs?: number }
  | { name: "form_error"; form: string; field?: string; status?: number }
  | { name: "search_used"; resultCount: number }
  | { name: "pipeline_filter_changed"; filter: string; value: string; resultCount: number }
  | { name: "candidate_stage_changed"; from: string; to: string }
  | { name: "candidate_profile_opened"; source: "list" | "pipeline" }
  | { name: "error_recovered"; context: string }
  | { name: "quick_action_opened"; action: string; role: string }
  | { name: "navigation_favorite_toggled"; href: string; enabled: boolean }
  | { name: "flow_duration"; flow: "vacancy" | "interview" | "hire" | "course_assignment"; durationMs: number; outcome: "completed" | "abandoned" }
  | { name: "filter_used"; surface: string; activeCount: number }
  | { name: "export_used"; surface: string }
  | { name: "automation_template_used"; template: string };

export function trackProductEvent(event: ProductEvent) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("talentos:product-event", { detail: { ...event, occurredAt: new Date().toISOString() } }));
}
