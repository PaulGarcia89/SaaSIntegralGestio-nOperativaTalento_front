"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useState, type ReactNode } from "react";
import { applicationStageLabel } from "@/lib/applications";
import type { RejectionReasonDto, VacancyApplicationDto, VacancyStageDto } from "@/lib/contracts";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/design-system";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocale } from "@/components/locale-provider";

/*
 * `RecruitmentWorkspaceNav` se retiró.
 *
 * Era una fila de pestañas horizontales que repetía, con otros nombres, los
 * mismos destinos que el menú lateral: el lateral decía "Pipeline" y la pestaña
 * "Flujo de selección"; el lateral "Scorecards" y la pestaña "Evaluaciones de
 * entrevista". Dos mapas para el mismo territorio obligan a aprender los dos y
 * no ayudan en ninguno.
 */

export function StageChangeDialog({ application, targetStage, rejectionReasons = [], open, pending, onOpenChange, onConfirm }: { application: VacancyApplicationDto | null; targetStage: VacancyStageDto | null; rejectionReasons?: RejectionReasonDto[]; open: boolean; pending: boolean; onOpenChange: (open: boolean) => void; onConfirm: (reason?: string, rejectionReasonId?: string) => void }) {
  const { t } = useLocale();
  const [reason, setReason] = useState("");
  const [rejectionReasonId, setRejectionReasonId] = useState("");
  if (!application || !targetStage) return null;
  const currentLabel = application.currentStage?.name ?? applicationStageLabel(application.status);
  const rejection = targetStage.applicationStatus === "REJECTED";
  const selectedReason = rejectionReasons.find((item) => item.id === rejectionReasonId);
  const needsDetail = selectedReason?.category === "OTHER";
  return <ResponsiveDialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) { setReason(""); setRejectionReasonId(""); } onOpenChange(nextOpen); }} title={t("ats.confirmStage")} description={t("ats.reviewImpact")} footer={<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="secondary" onClick={() => onOpenChange(false)} disabled={pending}>{t("ats.keepReviewing")}</Button><Button onClick={() => onConfirm(reason.trim() || undefined, rejectionReasonId || undefined)} disabled={pending || (rejection && (!rejectionReasonId || (needsDetail && !reason.trim())))}>{pending ? t("ats.updating") : targetStage.requiresApproval ? t("ats.requestApproval") : t("ats.confirmChange")}<ArrowRight className="size-4" /></Button></div>}><div className="space-y-4"><dl className="grid gap-3 rounded-xl bg-surface-section p-4 text-sm"><div><dt className="text-text-secondary">{t("ats.candidate")}</dt><dd className="font-medium">{application.candidate.fullName}</dd></div><div><dt className="text-text-secondary">{t("ats.change")}</dt><dd className="font-medium">{currentLabel} → {targetStage.name}</dd></div>{targetStage.requiresApproval ? <div><dt className="text-text-secondary">{t("ats.approval")}</dt><dd className="font-medium">{t("ats.requiresApprovals", { count: Math.max(1, targetStage.requiredApprovals ?? 1) })}</dd></div> : null}</dl><div className="flex gap-3 rounded-xl border border-status-warning/30 bg-status-warning/5 p-4 text-sm"><AlertTriangle className="size-5 shrink-0" aria-hidden="true" /><p>{t(`ats.consequence${targetStage.applicationStatus.charAt(0) + targetStage.applicationStatus.slice(1).toLowerCase()}`)}</p></div>{rejection ? <div className="space-y-3"><label className="block space-y-2 text-sm font-medium">{t("ats.rejectionReason")} <span className="text-status-danger">*</span><Select value={rejectionReasonId} onValueChange={setRejectionReasonId}><SelectTrigger><SelectValue placeholder={t("ats.selectRejectionReason")} /></SelectTrigger><SelectContent>{rejectionReasons.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select></label><label className="block space-y-2 text-sm font-medium">{t("ats.notes")} {needsDetail ? <span className="text-status-danger">*</span> : <span className="font-normal text-text-secondary">({t("ats.optional")})</span>}<textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} placeholder={t("ats.additionalContext")} className="w-full rounded-xl border border-border-default bg-surface-elevated p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus" /></label></div> : null}</div></ResponsiveDialog>;
}

export function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return <label className="space-y-1.5 text-sm font-medium"><span>{label}</span>{children}</label>;
}

export function CandidatePreviewDialog({ application, open, onOpenChange }: { application: VacancyApplicationDto | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useLocale();
  if (!application) return null;
  const responses = Object.entries(application.dynamicResponses ?? {});
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>{application.candidate.fullName}</DialogTitle><DialogDescription>{application.vacancy.title} · {application.currentStage?.name ?? applicationStageLabel(application.status)}</DialogDescription></DialogHeader><div className="space-y-5"><dl className="grid gap-3 rounded-xl bg-surface-section p-4 text-sm sm:grid-cols-2"><div><dt className="text-text-secondary">{t("ats.email")}</dt><dd className="break-all font-medium">{application.candidate.email}</dd></div><div><dt className="text-text-secondary">{t("ats.phone")}</dt><dd className="font-medium">{application.candidate.phone || t("ats.notProvided")}</dd></div><div><dt className="text-text-secondary">{t("ats.city")}</dt><dd className="font-medium">{application.candidate.city || t("ats.notProvided")}</dd></div><div><dt className="text-text-secondary">{t("ats.branch")}</dt><dd className="font-medium">{application.vacancy.branch?.name || t("ats.notProvided")}</dd></div></dl><section><h3 className="font-semibold">{t("ats.coverLetter")}</h3><p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">{application.coverLetter || t("ats.noCoverLetter")}</p></section>{responses.length ? <section><h3 className="font-semibold">{t("ats.highlightedAnswers")}</h3><dl className="mt-3 grid gap-3 sm:grid-cols-2">{responses.slice(0, 4).map(([key, value]) => <div key={key} className="rounded-xl border border-border-default p-3"><dt className="text-xs text-text-secondary">{key.replaceAll("_", " ")}</dt><dd className="mt-1 text-sm">{Array.isArray(value) ? value.join(", ") : String(value)}</dd></div>)}</dl></section> : null}<Button asChild className="w-full"><Link href={`/ats/candidates/${application.id}`}>{t("ats.openFullProfile")}<ArrowRight className="size-4" /></Link></Button></div></DialogContent></Dialog>;
}
