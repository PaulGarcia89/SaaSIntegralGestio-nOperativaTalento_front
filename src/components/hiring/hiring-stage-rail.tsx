import { Check } from "lucide-react";
import type { HiringContractStatus } from "@/lib/contracts";

export const hiringStages = ["Información", "Oferta", "Documentos", "Firmas", "Revisión", "Confirmación"] as const;

export function hiringStageIndex(status: HiringContractStatus) {
  if (["DRAFT", "DATA_REVIEW"].includes(status)) return 0;
  if (["OFFER_PREPARATION", "OFFER_SENT", "AWAITING_OFFER_RESPONSE", "OFFER_ACCEPTED"].includes(status)) return 1;
  if (status === "DOCUMENTS_PENDING") return 2;
  if (status === "SIGNATURES_PENDING") return 3;
  if (["COMPLIANCE_REVIEW", "READY_TO_HIRE"].includes(status)) return 4;
  return status === "HIRED" ? 5 : 0;
}

export function HiringStageRail({ status }: { status: HiringContractStatus }) {
  const current = hiringStageIndex(status);
  return <ol className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6" aria-label="Etapas de la contratación">{hiringStages.map((label, index) => <li key={label} className="flex items-center gap-2 text-sm"><span className={`flex size-7 shrink-0 items-center justify-center rounded-full border ${index < current ? "border-status-success/40 bg-status-success/10 text-status-success" : index === current ? "border-primary bg-primary text-text-on-accent" : "border-border-default text-text-secondary"}`} aria-current={index === current ? "step" : undefined}>{index < current ? <Check className="size-4" aria-hidden="true" /> : index + 1}</span><span className={index <= current ? "font-medium" : "text-text-secondary"}>{label}</span></li>)}</ol>;
}
