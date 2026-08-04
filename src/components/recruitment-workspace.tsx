"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useState, type ReactNode } from "react";
import { applicationStageLabel } from "@/lib/applications";
import type { ApplicationStatusKey, RejectionReasonDto, VacancyApplicationDto, VacancyStageDto } from "@/lib/contracts";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function RecruitmentWorkspaceNav() {
  const pathname = usePathname();
  const items = [
    { href: "/ats/candidates", label: "Candidatos" },
    { href: "/ats/talent-crm", label: "Talent CRM" },
    { href: "/ats/pipeline", label: "Flujo de selección" },
    { href: "/ats/communications", label: "Comunicaciones" },
    { href: "/ats/scorecards", label: "Fichas de evaluación" },
    { href: "/ats/analytics", label: "Analítica" },
  ];
  return <nav aria-label="Vistas de candidatos" className="flex gap-1 overflow-x-auto border-b border-border-default">
    {items.map((item) => {
      const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
      return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn("flex min-h-11 items-center border-b-2 px-4 text-sm font-medium", active ? "border-primary text-text-primary" : "border-transparent text-text-secondary hover:text-text-primary")}>{item.label}</Link>;
    })}
  </nav>;
}

const consequences: Record<ApplicationStatusKey, string> = {
  SUBMITTED: "La postulación volverá a la bandeja de nuevas candidaturas.",
  REVIEWING: "Quedará marcada para revisión del equipo de reclutamiento.",
  INTERVIEW: "El siguiente paso recomendado será programar una entrevista.",
  APPROVED: "Quedará lista para iniciar la decisión de contratación.",
  REJECTED: "Se cerrará el proceso para esta postulación. No se enviará comunicación automática desde esta pantalla.",
  TRAINING: "Quedará pendiente de las actividades formativas configuradas.",
  HIRED: "Se marcará como contratada. La creación del empleado y su incorporación requieren confirmación en el flujo correspondiente.",
  WITHDRAWN: "La postulación fue retirada voluntariamente por el candidato y no puede asignarse manualmente.",
};

export function StageChangeDialog({ application, targetStage, rejectionReasons = [], open, pending, onOpenChange, onConfirm }: { application: VacancyApplicationDto | null; targetStage: VacancyStageDto | null; rejectionReasons?: RejectionReasonDto[]; open: boolean; pending: boolean; onOpenChange: (open: boolean) => void; onConfirm: (reason?: string, rejectionReasonId?: string) => void }) {
  const [reason, setReason] = useState("");
  const [rejectionReasonId, setRejectionReasonId] = useState("");
  if (!application || !targetStage) return null;
  const currentLabel = application.currentStage?.name ?? applicationStageLabel(application.status);
  const rejection = targetStage.applicationStatus === "REJECTED";
  const selectedReason = rejectionReasons.find((item) => item.id === rejectionReasonId);
  const needsDetail = selectedReason?.category === "OTHER";
  return <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) { setReason(""); setRejectionReasonId(""); } onOpenChange(nextOpen); }}><DialogContent><DialogHeader><DialogTitle>Confirmar cambio de etapa</DialogTitle><DialogDescription>Revisa el impacto antes de actualizar la postulación.</DialogDescription></DialogHeader><div className="space-y-4"><dl className="grid gap-3 rounded-xl bg-surface-section p-4 text-sm"><div><dt className="text-text-secondary">Candidato</dt><dd className="font-medium">{application.candidate.fullName}</dd></div><div><dt className="text-text-secondary">Cambio</dt><dd className="font-medium">{currentLabel} → {targetStage.name}</dd></div>{targetStage.requiresApproval ? <div><dt className="text-text-secondary">Aprobación</dt><dd className="font-medium">Requiere {Math.max(1, targetStage.requiredApprovals ?? 1)} aprobación(es)</dd></div> : null}</dl><div className="flex gap-3 rounded-xl border border-status-warning/30 bg-status-warning/5 p-4 text-sm"><AlertTriangle className="size-5 shrink-0" aria-hidden="true" /><p>{consequences[targetStage.applicationStatus]}</p></div>{rejection ? <div className="space-y-3"><label className="block space-y-2 text-sm font-medium">Razón de descarte <span className="text-status-danger">*</span><Select value={rejectionReasonId} onValueChange={setRejectionReasonId}><SelectTrigger><SelectValue placeholder="Selecciona una razón analítica" /></SelectTrigger><SelectContent>{rejectionReasons.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select></label><label className="block space-y-2 text-sm font-medium">Observaciones {needsDetail ? <span className="text-status-danger">*</span> : <span className="font-normal text-text-secondary">(opcional)</span>}<textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} placeholder="Contexto adicional para el equipo" className="w-full rounded-xl border border-border-default bg-surface-elevated p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus" /></label></div> : null}<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="secondary" onClick={() => onOpenChange(false)} disabled={pending}>Seguir revisando</Button><Button onClick={() => onConfirm(reason.trim() || undefined, rejectionReasonId || undefined)} disabled={pending || (rejection && (!rejectionReasonId || (needsDetail && !reason.trim())))}>{pending ? "Actualizando…" : targetStage.requiresApproval ? "Solicitar aprobación" : "Confirmar cambio"}<ArrowRight className="size-4" /></Button></div></div></DialogContent></Dialog>;
}

export function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return <label className="space-y-1.5 text-sm font-medium"><span>{label}</span>{children}</label>;
}

export function CandidatePreviewDialog({ application, open, onOpenChange }: { application: VacancyApplicationDto | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  if (!application) return null;
  const responses = Object.entries(application.dynamicResponses ?? {});
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>{application.candidate.fullName}</DialogTitle><DialogDescription>{application.vacancy.title} · {application.currentStage?.name ?? applicationStageLabel(application.status)}</DialogDescription></DialogHeader><div className="space-y-5"><dl className="grid gap-3 rounded-xl bg-surface-section p-4 text-sm sm:grid-cols-2"><div><dt className="text-text-secondary">Correo</dt><dd className="break-all font-medium">{application.candidate.email}</dd></div><div><dt className="text-text-secondary">Teléfono</dt><dd className="font-medium">{application.candidate.phone || "No informado"}</dd></div><div><dt className="text-text-secondary">Ciudad</dt><dd className="font-medium">{application.candidate.city || "No informada"}</dd></div><div><dt className="text-text-secondary">Sucursal</dt><dd className="font-medium">{application.vacancy.branch?.name || "No informada"}</dd></div></dl><section><h3 className="font-semibold">Carta de presentación</h3><p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">{application.coverLetter || "No se adjuntó una carta de presentación."}</p></section>{responses.length ? <section><h3 className="font-semibold">Respuestas destacadas</h3><dl className="mt-3 grid gap-3 sm:grid-cols-2">{responses.slice(0, 4).map(([key, value]) => <div key={key} className="rounded-xl border border-border-default p-3"><dt className="text-xs text-text-secondary">{key.replaceAll("_", " ")}</dt><dd className="mt-1 text-sm">{Array.isArray(value) ? value.join(", ") : String(value)}</dd></div>)}</dl></section> : null}<Button asChild className="w-full"><Link href={`/ats/candidates/${application.id}`}>Abrir perfil completo<ArrowRight className="size-4" /></Link></Button></div></DialogContent></Dialog>;
}
