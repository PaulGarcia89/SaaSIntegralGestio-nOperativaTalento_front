export type ProductEvent =
  | { name: "flow_step_viewed"; flow: string; step: number }
  | { name: "flow_step_back"; flow: string; from: number; to: number }
  | { name: "flow_completed"; flow: string; durationMs?: number }
  | { name: "form_error"; form: string; field?: string; status?: number }
  | { name: "search_used"; resultCount: number }
  | { name: "pipeline_filter_changed"; filter: string; value: string; resultCount: number }
  | { name: "candidate_stage_changed"; from: string; to: string }
  | { name: "candidate_profile_opened"; source: "list" | "pipeline" }
  | { name: "error_recovered"; context: string };

export function trackProductEvent(event: ProductEvent) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("talentos:product-event", { detail: { ...event, occurredAt: new Date().toISOString() } }));
}
