"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, ArrowRight, CalendarClock, CalendarPlus, CheckCircle2, Circle, ClipboardCheck, Download, ExternalLink, Mail, MapPin, Phone, RotateCcw, UserCheck } from "lucide-react";
import { AsyncState } from "@/components/async-state";
import { DecisionCommitteeCard } from "@/components/decision-committee-card";
import { JobOfferManager } from "@/components/job-offer-manager";
import { ScorecardDialog } from "@/components/scorecard-dialog";
import { CompetencyAiAssistant } from "@/components/competency-ai-assistant";
import { ActionBar, InlineFeedback, PageHeader } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { applicationStageLabel, formatApplicationDate } from "@/lib/applications";
import { createDocuSealHiringBundle, createDocuSealHiringBundleForApplication, createHiringContract, fetchApplication, fetchApplicationDecisionEvidence, fetchAtsCommunicationHistory, fetchDocuSealHiringBundleStatus, fetchHiringContext, fetchInterviewScorecardComparison, fetchInterviewerProfiles, fetchJobOffers, fetchRejectionReasons, fetchResumeAccess, hireCandidate, retryAtsCommunication, scheduleRecruitmentInterview, updateApplication } from "@/lib/backend";
import type { AtsMessageDto, CalendarProvider, JobOfferDto, ScorecardComparisonDto, VacancyApplicationDto } from "@/lib/contracts";
import { technicalLabel } from "@/lib/ui-labels";
import { useAppStore } from "@/store/app-store";
import { useLocale } from "@/components/locale-provider";

export default function CandidateProfilePage() {
  const { t } = useLocale();
  const { id } = useParams<{ id: string }>();
  const application = useQuery({ queryKey: ["application", id], queryFn: () => fetchApplication(id), enabled: Boolean(id) });
  return <div className="space-y-6"><Button asChild variant="ghost"><Link href="/ats/candidates"><ArrowLeft className="size-4" />{t("p360.back")}</Link></Button>{application.isLoading ? <AsyncState state="loading" title={t("p360.loading")} /> : null}{application.isError ? <AsyncState state="error" title={t("p360.loadError")} onRetry={() => void application.refetch()} /> : null}{application.data ? <CandidateProfile application={application.data} /> : null}</div>;
}

function CandidateProfile({ application }: { application: VacancyApplicationDto }) {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { can } = useAppStore();
  const [activeSection, setActiveSection] = useState<"review" | "evaluate" | "decide" | "transfer">(
    application.status === "APPROVED" || application.status === "HIRED" ? "transfer" : application.status === "INTERVIEW" ? "evaluate" : "review",
  );
  const [scoreInterviewId, setScoreInterviewId] = useState("");
  const [currentStageId, setCurrentStageId] = useState(application.currentStageId ?? application.currentStage?.id ?? "");
  const [notes, setNotes] = useState(application.notes ?? "");
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionReasonId, setRejectionReasonId] = useState("");
  const [hireOpen, setHireOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [jobTitle, setJobTitle] = useState(application.vacancy.title);
  const [supervisorUserId, setSupervisorUserId] = useState("");
  const [onboardingTemplateId, setOnboardingTemplateId] = useState("");
  const [docuSealSent, setDocuSealSent] = useState(false);
  const [employmentStartDate, setEmploymentStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const hiringContext = useQuery({ queryKey: ["hiring-context", application.id], queryFn: () => fetchHiringContext(application.id), enabled: hireOpen && application.status === "APPROVED" && can("applications.hire") });
  const communications = useQuery({
    queryKey: ["ats-communications", application.id],
    queryFn: () => fetchAtsCommunicationHistory(application.id),
    // Keep delivery badges current while the background worker is processing.
    refetchInterval: (query) => query.state.data?.some((message) => ["PENDING", "PROCESSING"].includes(message.status)) ? 5000 : false,
  });
  const offers = useQuery({ queryKey: ["job-offers", application.id], queryFn: () => fetchJobOffers(application.id) });
  const rejectionReasons = useQuery({ queryKey: ["application-rejection-reasons"], queryFn: fetchRejectionReasons });
  const resumeAccess = useMutation({ mutationFn: () => fetchResumeAccess(application.id), onSuccess: (access) => window.open(access.url, "_blank", "noopener,noreferrer") });
  const decisionEvidence = useMutation({
    mutationFn: () => fetchApplicationDecisionEvidence(application.id),
    onSuccess: (evidence) => {
      const url = URL.createObjectURL(new Blob([JSON.stringify(evidence, null, 2)], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `expediente-decision-${application.candidate.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    },
  });
  const save = useMutation({ mutationFn: () => updateApplication(application.id, { currentStageId: currentStageId || undefined, reason: rejectionReason.trim() || undefined, rejectionReasonId: rejectionReasonId || undefined, notes: notes.trim() || undefined, interview: application.interview?.type ? { type: application.interview.type, scheduledAt: application.interview.scheduledAt, followUpAt: application.interview.followUpAt, observations: application.interview.observations } : undefined }), onSuccess: async (updated) => { queryClient.setQueryData(["application", application.id], updated); setCurrentStageId(updated.currentStageId ?? updated.currentStage?.id ?? ""); setRejectionReason(""); setRejectionReasonId(""); await queryClient.invalidateQueries({ queryKey: ["applications"] }); } });
  const hiringDocuments = useMutation({ mutationFn: createDocuSealHiringBundle, onSuccess: () => setDocuSealSent(true) });
  const createContract = useMutation({ mutationFn: () => createHiringContract(application.id, { roleTitle: jobTitle.trim() || application.vacancy.title }), onSuccess: async (contract) => { await queryClient.invalidateQueries({ queryKey: ["hiring-contracts"] }); window.location.assign(`/hiring/${contract.id}`); } });
  const docuSealStatus = useQuery({ queryKey: ["docuseal-hiring-status", application.id], queryFn: () => fetchDocuSealHiringBundleStatus(application.id), enabled: application.status === "HIRED", refetchInterval: (query) => query.state.data?.allCompleted ? false : 5000 });
  const resendHiringDocuments = useMutation({ mutationFn: () => createDocuSealHiringBundleForApplication(application.id), onSuccess: async () => { setDocuSealSent(true); await docuSealStatus.refetch(); } });
  const hire = useMutation({ mutationFn: () => hireCandidate({ applicationId: application.id, branchId: application.vacancy.branchId, employeeName: application.candidate.fullName, employeeEmail: application.candidate.email, jobTitle: jobTitle.trim(), supervisorUserId: supervisorUserId || undefined, onboardingTemplateId: onboardingTemplateId || hiringContext.data?.onboardingTemplates.find((template) => template.isDefault)?.id || hiringContext.data?.onboardingTemplates[0]?.id, employmentStartDate: employmentStartDate ? new Date(`${employmentStartDate}T12:00:00`).toISOString() : undefined, metadata: { source: "candidate-360" } }), onSuccess: async (result) => { await queryClient.invalidateQueries({ queryKey: ["application", application.id] }); await queryClient.invalidateQueries({ queryKey: ["applications"] }); await queryClient.invalidateQueries({ queryKey: ["onboarding-flows"] }); if (result.employeeId) void hiringDocuments.mutateAsync(result.employeeId).catch(() => undefined); } });
  const retryMessage = useMutation({ mutationFn: retryAtsCommunication, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["ats-communications", application.id] }); } });
  const responses = Object.entries(application.dynamicResponses ?? {});
  const stages = [...(application.vacancy.stages ?? [])].sort((a, b) => a.position - b.position);
  const originalStageId = application.currentStageId ?? application.currentStage?.id ?? "";
  const allowedCodes = application.currentStage?.allowedNextStageCodes ?? [];
  const movableStages = stages.filter((stage) => stage.applicationStatus !== "HIRED" && (stage.id === originalStageId || allowedCodes.includes(stage.code)));
  const selectedStage = stages.find((stage) => stage.id === currentStageId);
  const currentStageLabel = application.currentStage?.name ?? applicationStageLabel(application.status);
  const links = [{ label: "LinkedIn", href: application.candidate.linkedinUrl }, { label: "Portafolio", href: application.candidate.portfolioUrl }].filter((item): item is { label: string; href: string } => Boolean(item.href));
  const scorecards = (application.interviews ?? []).flatMap((interview) => (interview.scorecards ?? []).map((scorecard) => ({ interview, scorecard })));

  return <div className="space-y-6"><PageHeader eyebrow="Perfil 360°" title={application.candidate.fullName} description={`${application.vacancy.title} · ${application.vacancy.branch?.name ?? t("p360.noBranch")}`} actions={<div className="flex flex-wrap gap-2"><Badge variant="secondary">{currentStageLabel}</Badge>{can("reports.export") ? <Button variant="secondary" onClick={() => decisionEvidence.mutate()} disabled={decisionEvidence.isPending}><Download className="size-4" />{decisionEvidence.isPending ? "Preparando evidencia…" : t("p360.exportRecord")}</Button> : null}</div>} />
    {activeSection === "transfer" ? <HiringProgressGuide application={application} offers={offers.data ?? []} docuSealSent={docuSealSent} docuSealStatus={docuSealStatus.data} canHire={can("applications.hire")} canCreateContract={can("applications.update") || can("candidates.update") || can("applications.hire")} canSendDocuments={can("employees.update")} canManage={can("applications.change_stage")} onHire={() => setHireOpen(true)} onCreateContract={() => setTransferOpen(true)} creatingContract={createContract.isPending} onSendDocuments={() => resendHiringDocuments.mutate()} sendingDocuments={resendHiringDocuments.isPending} /> : null}
    {createContract.isError ? <InlineFeedback tone="danger" title={t("p360.sendFailed")}>{createContract.error instanceof Error ? createContract.error.message : t("p360.sendFailedBody")}</InlineFeedback> : null}
    <CandidateContextSummary application={application} currentStageLabel={currentStageLabel} />
    <nav aria-label={t("p360.stagesAria")} className="grid gap-2 border-b border-border-default pb-2 sm:grid-cols-4">{([ ["review", t("p360.review"), t("p360.summaryAndRequirements")], ["evaluate", "Evaluar", t("p360.interviewsAndEvidence")], ["decide", "Decidir", t("p360.resultAndReason")], ["transfer", t("p360.transferOrClose"), t("p360.hireOrReject")] ] as const).map(([key, label, description]) => <button type="button" key={key} aria-current={activeSection === key ? "step" : undefined} onClick={() => setActiveSection(key)} className={`rounded-xl border p-3 text-left transition-colors ${activeSection === key ? "border-primary bg-primary/10" : "border-border-default bg-surface-elevated hover:border-primary/50"}`}><span className="block text-sm font-semibold">{label}</span><span className="mt-1 block text-xs text-text-secondary">{description}</span></button>)}</nav>
    {activeSection === "transfer" ? <JobOfferManager applicationId={application.id} jobTitle={application.vacancy.title} canManage={can("applications.change_stage")} /> : null}
    {save.isSuccess ? <InlineFeedback tone="success" title="Cambios guardados">{save.data.pendingTransitions?.length ? t("p360.stagePending") : t("p360.stageUpdated")}</InlineFeedback> : null}{save.isError ? <InlineFeedback tone="danger" title={t("p360.saveFailed")}>{save.error instanceof Error ? save.error.message : t("p360.changesNotApplied")}</InlineFeedback> : null}
    <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]"><div className="space-y-5">
      {activeSection === "review" ? <div className="space-y-5" aria-label={t("p360.reviewApplication")}>
      <Card id="perfil" level={2}><CardHeader><CardTitle>{t("p360.contactInfo")}</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2"><Detail icon={<Mail />} label={t("p360.email")} value={application.candidate.email} /><Detail icon={<Phone />} label={t("p360.phone")} value={application.candidate.phone ?? t("p360.notReported")} /><Detail icon={<MapPin />} label={t("p360.city")} value={application.candidate.city ?? t("p360.notReportedF")} /><Detail icon={<CalendarClock />} label={t("p360.application")} value={formatApplicationDate(application.appliedAt)} /><div className="flex flex-wrap gap-2 sm:col-span-2">{links.map((link) => <Button key={link.label} asChild variant="secondary"><a href={link.href} target="_blank" rel="noreferrer">{link.label}<ExternalLink className="size-4" /></a></Button>)}{application.candidate.resumeAvailable ? <Button variant="secondary" onClick={() => resumeAccess.mutate()} disabled={resumeAccess.isPending}>{resumeAccess.isPending ? "Generando acceso…" : `Abrir CV${application.candidate.resumeFile ? ` v${application.candidate.resumeFile.version}` : ""}`}<ExternalLink className="size-4" /></Button> : null}</div>{resumeAccess.isError ? <p className="text-sm text-status-danger sm:col-span-2">{t("p360.cvError")}</p> : null}</CardContent></Card>
      <Card level={2}><CardHeader><CardTitle>{t("p360.application")}</CardTitle></CardHeader><CardContent className="space-y-5"><Section title={t("p360.coverLetter")} empty={t("p360.noCoverLetter")}>{application.coverLetter}</Section><section><h3 className="font-semibold">{t("p360.formAnswers")}</h3>{responses.length ? <dl className="mt-3 grid gap-3 sm:grid-cols-2">{responses.map(([key, value]) => <div key={key} className="rounded-xl bg-surface-section p-3"><dt className="text-xs font-medium text-text-secondary">{key.replaceAll("_", " ")}</dt><dd className="mt-1 text-sm">{Array.isArray(value) ? value.join(", ") : typeof value === "boolean" ? value ? "Sí" : "No" : String(value)}</dd></div>)}</dl> : <p className="mt-2 text-sm text-text-secondary">{t("p360.noAnswers")}</p>}</section></CardContent></Card>
      </div> : null}
      {activeSection === "evaluate" ? <div className="space-y-5" aria-label={t("p360.evaluateCandidate")}>
      <EvaluationStatusCard application={application} onComplete={(interviewId) => setScoreInterviewId(interviewId)} canEvaluate={can("scorecards.complete")} />
      <InterviewScheduler application={application} canSchedule={can("interviews.schedule")} />
      <Card level={2}><CardHeader><CardTitle>{t("p360.scorecards")}</CardTitle></CardHeader><CardContent className="space-y-4">{scorecards.length ? <><div className="grid gap-3 sm:grid-cols-3"><Summary label="Evaluaciones" value={String(scorecards.length)} /><Summary label="Firmadas" value={String(scorecards.filter(({ scorecard }) => scorecard.status === "SIGNED").length)} /><Summary label="Promedio simple" value={`${(scorecards.reduce((total, { scorecard }) => total + Number(scorecard.weightedScore ?? (scorecard.overallRating ?? 0) * 20), 0) / scorecards.length).toFixed(1)}/100`} /></div>{(application.interviews ?? []).filter((interview) => interview.scorecards?.length).map((interview) => <ScorecardConsensus key={interview.id} interviewId={interview.id} stageName={interview.stage?.name ?? t("p360.interview")} />)}{scorecards.map(({ interview, scorecard }) => <div key={scorecard.id} className="rounded-xl border border-border-default p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold">{interview.stage?.name ?? t("p360.interview")} · {interview.interviewer ? `${interview.interviewer.firstName} ${interview.interviewer.lastName}` : t("p360.noEvaluator")}</p><p className="text-sm text-text-secondary">{scorecard.status}{scorecard.signedAt ? ` · firmada ${formatApplicationDate(scorecard.signedAt)}` : ""}</p></div><Badge variant="secondary">{Number(scorecard.weightedScore ?? (scorecard.overallRating ?? 0) * 20).toFixed(1)}/100</Badge></div><div className="mt-3 grid gap-2 sm:grid-cols-3"><Summary label={t("p360.recommendation")} value={scorecard.recommendation} /><Summary label="Fortalezas" value={scorecard.strengths || "Sin registrar"} /><Summary label="Riesgos" value={scorecard.concerns || "Sin registrar"} /></div></div>)}</> : <p className="text-sm text-text-secondary">{t("p360.noScorecards")}</p>}</CardContent></Card>
      <CompetencyAiAssistant applicationId={application.id} canManage={can("applications.change_stage")} />
      <ScorecardDialog interviewId={scoreInterviewId} onClose={() => setScoreInterviewId("")} />
      </div> : null}
    </div><aside className="space-y-5">
      {activeSection === "decide" ? <div className="space-y-5" aria-label={t("p360.decideApplication")}>
      <DecisionCommitteeCard applicationId={application.id} />
      <Card id="proceso" level={1}><CardHeader><CardTitle>{t("p360.nextSuggested")}</CardTitle></CardHeader><CardContent className="space-y-4">{application.status === "HIRED" ? <InlineFeedback tone="success" title={t("p360.hiringFormalized")}>{t("p360.finalStageNote")}</InlineFeedback> : can("applications.change_stage") ? <>{application.pendingTransitions?.[0] ? <InlineFeedback tone="warning" title={t("p360.pendingApproval")}>Destino: {application.pendingTransitions[0].toStage.name} · {application.pendingTransitions[0].approvals.length}/{application.pendingTransitions[0].requiredApprovals} aprobaciones.</InlineFeedback> : null}<label className="space-y-2 text-sm font-medium">{t("p360.vacancyStage")}<Select value={currentStageId || undefined} onValueChange={setCurrentStageId}><SelectTrigger><SelectValue placeholder={t("p360.pickStage")} /></SelectTrigger><SelectContent>{movableStages.map((stage) => <SelectItem key={stage.id} value={stage.id!}>{stage.name}</SelectItem>)}</SelectContent></Select></label>{selectedStage?.applicationStatus === "REJECTED" && selectedStage.id !== originalStageId ? <div className="space-y-3"><label className="block space-y-2 text-sm font-medium">{t("p360.rejectionReason")} <span className="text-status-danger">*</span><Select value={rejectionReasonId} onValueChange={setRejectionReasonId}><SelectTrigger><SelectValue placeholder={t("p360.pickAnalyticReason")} /></SelectTrigger><SelectContent>{rejectionReasons.data?.map((reason) => <SelectItem key={reason.id} value={reason.id}>{reason.label}</SelectItem>)}</SelectContent></Select></label><label className="block space-y-2 text-sm font-medium" htmlFor="candidate-rejection-reason">Observaciones <span className="text-status-danger">*</span><textarea id="candidate-rejection-reason" value={rejectionReason} maxLength={2000} rows={3} onChange={(event) => setRejectionReason(event.target.value)} className="w-full rounded-xl border border-border-default bg-surface-elevated p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus" /></label></div> : null}<label className="block space-y-2 text-sm font-medium" htmlFor="candidate-notes">{t("p360.internalNotes")}<textarea id="candidate-notes" value={notes} maxLength={4000} rows={6} onChange={(event) => setNotes(event.target.value)} className="w-full rounded-xl border border-border-default bg-surface-elevated p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus" /></label><ActionBar><Button onClick={() => save.mutate()} disabled={save.isPending || (selectedStage?.applicationStatus === "REJECTED" && selectedStage.id !== originalStageId && (!rejectionReasonId || !rejectionReason.trim())) || (currentStageId === originalStageId && notes === (application.notes ?? ""))}>{save.isPending ? "Guardando…" : selectedStage?.requiresApproval && selectedStage.id !== originalStageId ? "Solicitar aprobación" : "Guardar cambios"}</Button></ActionBar></> : <p className="text-sm text-text-secondary">{t("p360.readOnly")}</p>}</CardContent></Card>
      </div> : null}
      {activeSection === "review" ? <Card id="mensajes" level={2}><CardHeader><CardTitle>{t("p360.messages")}</CardTitle></CardHeader><CardContent>{communications.isLoading ? <p className="text-sm text-text-secondary">{t("p360.loadingHistory")}</p> : communications.isError ? <InlineFeedback tone="danger" title={t("p360.messagesError")}>{t("p360.retryDeliveries")}</InlineFeedback> : communications.data?.length ? <CommunicationHistory messages={communications.data} retryPending={retryMessage.isPending} onRetry={(messageId) => retryMessage.mutate(messageId)} /> : <p className="text-sm text-text-secondary">{t("p360.noMessages")}</p>}</CardContent></Card> : null}
    </aside></div>
    {hire.isSuccess ? <InlineFeedback tone={hiringDocuments.isError ? "warning" : "success"} title={t("p360.hiringFormalized")}>El empleado fue creado y la incorporación se activó automáticamente. Flujo: {hire.data.id}{hiringDocuments.isPending ? ` ${t("p360.docusealSending")}` : hiringDocuments.isError ? ` La contratación quedó creada, pero DocuSeal requiere atención: ${hiringDocuments.error instanceof Error ? hiringDocuments.error.message : t("p360.checkTemplates")}.` : ` ${t("p360.docusealDone")}`}</InlineFeedback> : null}
    {resendHiringDocuments.isSuccess ? <InlineFeedback tone="success" title={t("p360.docusealSent")}>{t("p360.docusealSentBody")}</InlineFeedback> : null}
    {resendHiringDocuments.isError ? <InlineFeedback tone="danger" title={t("p360.docusealError")}>{resendHiringDocuments.error instanceof Error ? resendHiringDocuments.error.message : t("p360.docusealRetry")}</InlineFeedback> : null}
    <Dialog open={transferOpen} onOpenChange={setTransferOpen}><DialogContent><DialogHeader><DialogTitle>{t("p360.sendToHiring")}</DialogTitle><DialogDescription>{t("p360.sendToHiringBody")}</DialogDescription></DialogHeader><div className="space-y-4"><dl className="grid gap-3 rounded-xl bg-surface-section p-4 text-sm sm:grid-cols-2"><Summary label={t("p360.candidate")} value={application.candidate.fullName} /><Summary label={t("p360.vacancy")} value={application.vacancy.title} /><Summary label={t("p360.company")} value={application.vacancy.tenant?.name ?? t("p360.activeCompany")} /><Summary label={t("p360.branch")} value={application.vacancy.branch?.name ?? application.vacancy.branchId} /><Summary label="Cargo" value={jobTitle || application.vacancy.title} /><Summary label="Resultado" value={t("p360.selectedForHiring")} /></dl><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-status-success/30 bg-status-success/5 p-4 text-sm"><p className="font-semibold">{t("p360.willTransfer")}</p><p className="mt-2 text-text-secondary">{t("p360.willTransferBody")}</p></div><div className="rounded-xl border border-border-default p-4 text-sm"><p className="font-semibold">{t("p360.willStay")}</p><p className="mt-2 text-text-secondary">{t("p360.willStayBody")}</p></div></div>{createContract.isError ? <InlineFeedback tone="danger" title={t("p360.sendFailed")}>{createContract.error instanceof Error ? createContract.error.message : t("p360.checkActive")}</InlineFeedback> : null}<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="secondary" onClick={() => setTransferOpen(false)} disabled={createContract.isPending}>{t("actions.cancel")}</Button><Button onClick={() => createContract.mutate()} disabled={createContract.isPending || application.status !== "APPROVED"}>{createContract.isPending ? "Enviando…" : t("p360.confirmSend")}<ArrowRight className="size-4" /></Button></div></div></DialogContent></Dialog>
    <Dialog open={hireOpen} onOpenChange={setHireOpen}><DialogContent><DialogHeader><DialogTitle>{t("p360.formalizeHiring")}</DialogTitle><DialogDescription>{t("p360.formalizeBody")}</DialogDescription></DialogHeader><div className="space-y-4"><dl className="grid gap-3 rounded-xl bg-surface-section p-4 text-sm"><Summary label="Empleado" value={application.candidate.fullName} /><Summary label={t("p360.company")} value={application.vacancy.tenant?.name ?? t("p360.activeCompany")} /><Summary label={t("p360.branch")} value={application.vacancy.branch?.name ?? application.vacancy.branchId} /><Summary label={t("p360.email")} value={application.candidate.email} /></dl>{hiringContext.isLoading ? <AsyncState state="loading" title={t("p360.preparingHiring")} /> : null}{hiringContext.isError ? <AsyncState state="error" title={t("p360.prepareError")} onRetry={() => void hiringContext.refetch()} /> : null}{hiringContext.data?.existingHiring ? <InlineFeedback tone="info" title={t("p360.alreadyHired")}>{t("p360.alreadyHiredBody")}</InlineFeedback> : null}{hire.isSuccess ? <InlineFeedback tone="success" title={t("p360.employeeCreated")}>La contratación quedó registrada sin estados parciales. Se generaron {hire.data.onboardingFlow?.tasks?.length ?? 0} tareas de incorporación y la solicitud de inventario quedó pendiente.<div className="mt-3 flex flex-wrap gap-2"><Button asChild size="sm"><Link href={`/onboarding/documents?flowId=${encodeURIComponent(hire.data.onboardingFlow?.id ?? "")}`}>{t("p360.openOnboarding")}</Link></Button><Button size="sm" variant="secondary" onClick={() => setHireOpen(false)}>Cerrar</Button></div></InlineFeedback> : null}{!hire.isSuccess && hiringContext.isSuccess && !hiringContext.data.existingHiring ? <><label className="space-y-2 text-sm font-medium" htmlFor="hire-job-title">{t("p360.role")}<Input id="hire-job-title" value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} /></label><label className="space-y-2 text-sm font-medium" htmlFor="hire-start-date">{t("p360.startDate")}<Input id="hire-start-date" type="date" value={employmentStartDate} onChange={(event) => setEmploymentStartDate(event.target.value)} /></label><label className="space-y-2 text-sm font-medium">{t("p360.supervisor")}<Select value={supervisorUserId || "none"} onValueChange={(value) => setSupervisorUserId(value === "none" ? "" : value)}><SelectTrigger><SelectValue placeholder={t("p360.pickSupervisor")} /></SelectTrigger><SelectContent><SelectItem value="none">{t("p360.noSupervisor")}</SelectItem>{hiringContext.data.supervisors.map((user) => <SelectItem key={user.id} value={user.id}>{user.fullName}{user.roles[0] ? ` · ${user.roles[0].name}` : ""}</SelectItem>)}</SelectContent></Select></label><label className="space-y-2 text-sm font-medium">{t("p360.onboardingTemplate")}<Select value={onboardingTemplateId || hiringContext.data.onboardingTemplates.find((template) => template.isDefault)?.id || hiringContext.data.onboardingTemplates[0]?.id || "automatic"} onValueChange={(value) => setOnboardingTemplateId(value === "automatic" ? "" : value)}><SelectTrigger><SelectValue placeholder={t("p360.pickTemplate")} /></SelectTrigger><SelectContent>{hiringContext.data.onboardingTemplates.length ? hiringContext.data.onboardingTemplates.map((template) => <SelectItem key={template.id} value={template.id}>{template.name} v{template.version} · {template.taskCount} tareas{template.isDefault ? " · predeterminada" : ""}</SelectItem>) : <SelectItem value="automatic">{t("p360.basicChecklist")}</SelectItem>}</SelectContent></Select></label>{hire.isError ? <InlineFeedback tone="danger" title={t("p360.hireFailed")}>{hire.error instanceof Error ? hire.error.message : "La operación fue revertida completamente."}</InlineFeedback> : null}<Button className="w-full" onClick={() => hire.mutate()} disabled={jobTitle.trim().length < 2 || !employmentStartDate || hire.isPending || !hiringContext.data.canHire}>{hire.isPending ? "Formalizando contratación…" : "Confirmar contratación y activar incorporación"}</Button><p className="text-xs text-text-secondary">{t("p360.atomicNote")}</p></> : null}</div></DialogContent></Dialog>

  </div>;
}

function EvaluationStatusCard({ application, onComplete, canEvaluate }: { application: VacancyApplicationDto; onComplete: (interviewId: string) => void; canEvaluate: boolean }) {
  const { t } = useLocale();
  const interviews = application.interviews ?? [];
  const [now] = useState(() => Date.now());
  const pending = interviews.find((interview) => interview.status === "COMPLETED" && (!interview.scorecards?.length || interview.scorecards.some((scorecard) => scorecard.status !== "SIGNED")));
  const upcoming = interviews.find((interview) => ["SCHEDULED", "CONFIRMED"].includes(interview.status) && new Date(interview.startsAt).getTime() >= now);
  if (pending) return <InlineFeedback tone="warning" title={t("p360.pendingEvaluation")}><span>La entrevista de {formatApplicationDate(pending.startsAt)} necesita una recomendación y resultado.</span>{canEvaluate ? <Button className="mt-3" size="sm" onClick={() => onComplete(pending.id)}><ClipboardCheck className="size-4" />{t("p360.completeScorecard")}</Button> : <p className="mt-2 text-sm">{t("p360.authorizedEvaluator")}</p>}</InlineFeedback>;
  if (upcoming) return <InlineFeedback tone="info" title={t("p360.nextInterview")}>{formatApplicationDate(upcoming.startsAt)} · {upcoming.timezone}. Al terminar, registra la evaluación desde esta misma sección.</InlineFeedback>;
  if (!interviews.length) return <InlineFeedback tone="info" title={t("p360.noInterviewYet")}>{t("p360.scheduleToEvaluate")}</InlineFeedback>;
  return <InlineFeedback tone="success" title={t("p360.evaluationsUpToDate")}>{t("p360.allEvaluated")}</InlineFeedback>;
}

function CandidateContextSummary({ application, currentStageLabel }: { application: VacancyApplicationDto; currentStageLabel: string }) {
  const { t } = useLocale();
  const responsible = application.assignedRecruiter ? `${application.assignedRecruiter.firstName} ${application.assignedRecruiter.lastName}` : t("p360.unassigned");
  const nextAction = application.status === "APPROVED" ? t("p360.sendToHiring") : application.status === "INTERVIEW" ? t("p360.completeEvalOrDecision") : application.status === "REVIEWING" ? t("p360.scheduleInterview") : application.status === "SUBMITTED" ? t("p360.reviewApplication") : t("p360.step.reviewRecord");
  return <Card level={2} className="border-primary/20 bg-primary/[0.03]"><CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-5"><Summary label={t("p360.vacancy")} value={application.vacancy.title} /><Summary label={t("p360.stage")} value={currentStageLabel} /><Summary label={t("p360.owner")} value={responsible} /><Summary label={t("p360.lastActivity")} value={formatApplicationDate(application.updatedAt)} /><div><p className="text-xs text-text-secondary">{t("p360.nextAction")}</p><p className="mt-1 text-sm font-semibold text-brand">{nextAction}</p></div>{application.isStageOverdue ? <InlineFeedback tone="danger" title="SLA vencido">{t("p360.priorityAttention")}</InlineFeedback> : null}{application.pendingTransitions?.some((transition) => transition.status === "PENDING") ? <InlineFeedback tone="warning" title="Cambio pendiente">{t("p360.transitionWaiting")}</InlineFeedback> : null}</CardContent></Card>;
}

type GuideStepState = "complete" | "pending" | "attention";

function HiringProgressGuide({ application, offers, docuSealSent, docuSealStatus, canHire, canCreateContract, canSendDocuments, canManage, onHire, onCreateContract, creatingContract, onSendDocuments, sendingDocuments }: { application: VacancyApplicationDto; offers: JobOfferDto[]; docuSealSent: boolean; docuSealStatus?: { allSent: boolean; allCompleted: boolean } | null; canHire: boolean; canCreateContract: boolean; canSendDocuments: boolean; canManage: boolean; onHire: () => void; onCreateContract: () => void; creatingContract: boolean; onSendDocuments: () => void; sendingDocuments: boolean }) {
  const { t } = useLocale();
  const activeOffer = offers[0];
  const offerAccepted = activeOffer?.status === "ACCEPTED" || application.status === "HIRED";
  const interviewCompleted = application.interviews?.some((interview) => interview.status === "COMPLETED") ?? false;
  const evaluationComplete = ["APPROVED", "HIRED"].includes(application.status) || interviewCompleted;
  const decisionComplete = ["APPROVED", "HIRED"].includes(application.status);
  const hiringStarted = application.status === "HIRED";
  const documentsSent = Boolean(docuSealStatus?.allSent || docuSealSent);
  const documentsComplete = Boolean(docuSealStatus?.allCompleted);
  const hiringComplete = hiringStarted && documentsComplete;
  const steps: Array<{ label: string; state: GuideStepState; detail: string }> = [
    { label: t("p360.application"), state: "complete", detail: t("p360.step.received") },
    { label: t("p360.step.evaluation"), state: evaluationComplete ? "complete" : "pending", detail: evaluationComplete ? t("p360.step.interviewDone") : t("p360.step.reviewAndSchedule") },
    { label: t("p360.step.decision"), state: decisionComplete ? "complete" : application.status === "REJECTED" ? "attention" : "pending", detail: decisionComplete ? t("p360.step.approved") : application.status === "REJECTED" ? t("p360.step.notContinuing") : t("p360.step.recordDecision") },
    { label: "Oferta", state: offerAccepted ? "complete" : activeOffer ? "attention" : "pending", detail: offerAccepted ? t("p360.step.offerAccepted") : activeOffer ? t("p360.step.offerNeedsAction") : t("p360.step.prepareOffer") },
    { label: t("p360.step.documents"), state: documentsComplete ? "complete" : documentsSent ? "attention" : "pending", detail: documentsComplete ? t("p360.step.docsDone") : documentsSent ? t("p360.docsSentBody") : t("p360.step.sendDocs") },
    { label: t("p360.step.hiring"), state: hiringComplete ? "complete" : hiringStarted ? "pending" : "pending", detail: hiringComplete ? t("p360.step.hiringDone") : hiringStarted ? t("p360.step.hiringStarted") : t("p360.step.formalizeAfterDocs") },
    { label: t("p360.step.onboarding"), state: hiringComplete ? "pending" : "pending", detail: hiringComplete ? t("p360.step.startOnboarding") : t("p360.step.afterHiring") },
  ];
  const currentIndex = steps.findIndex((step) => step.state !== "complete");
  const currentStep = currentIndex === -1 ? steps.length - 1 : currentIndex;
  const next = steps[currentStep];
  const action = application.status === "REJECTED" || application.status === "WITHDRAWN"
    ? { label: t("p360.step.reviewRecord"), href: "#perfil" }
    : application.status === "HIRED" && !documentsSent && canSendDocuments
      ? { label: sendingDocuments ? t("p360.sendingDocs") : t("p360.sendDocuseal"), onClick: onSendDocuments }
      : application.status === "HIRED" && !documentsComplete
        ? { label: t("p360.waitingSignature"), href: "#mensajes" }
        : application.status === "HIRED"
        ? { label: t("p360.startOnboarding"), href: "/onboarding/documents" }
        : application.status === "APPROVED" && canCreateContract
          ? { label: creatingContract ? t("p360.sending") : t("p360.sendToHiring"), onClick: onCreateContract }
          : { label: activeOffer ? "Gestionar oferta" : "Preparar oferta", href: "#job-offers" };

  return <Card level={1} className="overflow-hidden border-primary/25 bg-primary/[0.03]"><CardContent className="space-y-5 p-5 sm:p-6">
    <div><p className="text-sm font-medium text-brand">{t("p360.transferToHiring")}</p><h2 className="mt-1 text-xl font-semibold">{t("p360.transferHint")}</h2><p className="mt-1 text-sm text-text-secondary">Paso actual: <span className="font-medium text-text-primary">{next.label}</span></p></div>
    {offerAccepted && !hiringComplete ? <InlineFeedback tone="success" title={t("p360.offerAccepted")}>{t("p360.offerAcceptedBody")}</InlineFeedback> : null}
    {documentsSent && !documentsComplete ? <InlineFeedback tone="success" title={t("p360.docsSent")}>{t("p360.docsSentBody")}</InlineFeedback> : null}
    {hiringComplete ? <InlineFeedback tone="success" title={t("p360.hiringDone")}>{t("p360.hiringDoneBody")}</InlineFeedback> : null}
    <ol className="grid gap-2 md:grid-cols-7" aria-label={t("p360.hiringProgressAria")}>{steps.map((step, index) => <li key={step.label} className="min-w-0"><div className={`flex items-center gap-2 rounded-xl border p-3 ${index === currentStep ? "border-primary bg-primary/10" : "border-border-default bg-surface-elevated"}`}>{step.state === "complete" ? <CheckCircle2 className="size-5 shrink-0 text-status-success" /> : step.state === "attention" ? <AlertTriangle className="size-5 shrink-0 text-status-warning" /> : <Circle className="size-5 shrink-0 text-text-secondary" />}<span className="text-sm font-medium">{step.label}</span></div>{index < steps.length - 1 ? <ArrowRight className="mx-auto my-1 hidden size-4 text-text-secondary md:block" aria-hidden="true" /> : null}</li>)}</ol>
    <div className="flex flex-col gap-4 rounded-xl border border-border-default bg-surface-elevated p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium text-brand">Siguiente paso recomendado</p><p className="mt-1 font-semibold">{next.detail}</p></div>{"onClick" in action ? <Button onClick={action.onClick} disabled={sendingDocuments}>{action.label}<ArrowRight className="size-4" /></Button> : <Button asChild><a href={action.href}>{action.label}<ArrowRight className="size-4" /></a></Button>}</div>
    <ul className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">{steps.map((step) => <li key={`${step.label}-detail`} className="flex items-start gap-2 text-text-secondary">{step.state === "complete" ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-status-success" /> : step.state === "attention" ? <AlertTriangle className="mt-0.5 size-4 shrink-0 text-status-warning" /> : <Circle className="mt-0.5 size-4 shrink-0" />}<span><strong className="font-medium text-text-primary">{step.label}:</strong> {step.detail}</span></li>)}</ul>
    {!canManage && !canHire ? <p className="text-xs text-text-secondary">{t("p360.viewAccessNote")}</p> : null}
  </CardContent></Card>;
}

function ScorecardConsensus({ interviewId, stageName }: { interviewId: string; stageName: string }) {
  const { t } = useLocale();
  const comparison = useQuery({ queryKey: ["scorecard-comparison", interviewId], queryFn: () => fetchInterviewScorecardComparison(interviewId) });
  if (comparison.isLoading || comparison.isError || !comparison.data?.evaluatorCount) return null;
  if (comparison.data.feedbackLocked) return <InlineFeedback tone="info" title={`Comparación protegida · ${stageName}`}>{t("p360.crossResultsHidden")}</InlineFeedback>;
  return <ScorecardConsensusSummary stageName={stageName} comparison={comparison.data} />;
}

function ScorecardConsensusSummary({ stageName, comparison }: { stageName: string; comparison: ScorecardComparisonDto }) {
  const { t } = useLocale();
  const scores = comparison.evaluatorScores.map((item) => item.weightedScore);
  const average = scores.reduce((total, score) => total + score, 0) / scores.length;
  const spread = Math.max(...scores) - Math.min(...scores);
  const disagreements = comparison.criteria.filter((criterion) => (criterion.spread ?? 0) >= 2);
  return <section className="rounded-xl border border-primary/25 bg-primary/5 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">Consenso de evaluadores · {stageName}</p><p className="text-sm text-text-secondary">{comparison.evaluatorCount} evaluación(es) firmada(s) comparables.</p></div><Badge variant={spread >= 20 ? "warning" : "success"}>{spread >= 20 ? t("p360.needsCalibration") : "Acuerdo estable"}</Badge></div><div className="mt-3 grid gap-3 sm:grid-cols-3"><Summary label="Promedio ponderado" value={`${average.toFixed(1)}/100`} /><Summary label={t("p360.evaluatorSpread")} value={`${spread.toFixed(1)} puntos`} /><Summary label={t("p360.reviewSignals")} value={String(comparison.biasSignals.length)} /></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{comparison.evaluatorScores.map((item) => <div key={item.reviewer.id} className="rounded-lg bg-surface-elevated p-3 text-sm"><p className="font-medium">{item.reviewer.firstName} {item.reviewer.lastName}</p><p className="text-text-secondary">{item.weightedScore.toFixed(1)}/100 · {item.recommendation}</p></div>)}</div>{disagreements.length ? <div className="mt-3 rounded-lg border border-status-warning/30 bg-status-warning/5 p-3 text-sm"><p className="font-medium">{t("p360.mostDisagreement")}</p><p className="mt-1 text-text-secondary">{disagreements.slice(0, 3).map((item) => `${item.label ?? item.key} (${item.min ?? "-"}–${item.max ?? "-"})`).join(" · ")}</p></div> : null}{comparison.biasSignals.length ? <p className="mt-3 text-sm text-status-warning">{comparison.biasSignals[0]?.message}</p> : null}</section>;
}

function InterviewScheduler({ application, canSchedule }: { application: VacancyApplicationDto; canSchedule: boolean }) {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(`Entrevista · ${application.vacancy.title}`);
  const [type, setType] = useState<"PRESENTIAL" | "VIRTUAL" | "PHONE">("VIRTUAL");
  const [interviewerUserId, setInterviewerUserId] = useState("");
  const [startsAt, setStartsAt] = useState(() => defaultInterviewDate(60));
  const [duration, setDuration] = useState("60");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [location, setLocation] = useState("");
  const [calendarProvider, setCalendarProvider] = useState<"NONE" | CalendarProvider>("NONE");
  const [timezone, setTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  const interviewers = useQuery({ queryKey: ["interviewer-profiles"], queryFn: fetchInterviewerProfiles, enabled: open && canSchedule });
  const schedule = useMutation({
    mutationFn: () => {
      if (!interviewerUserId) throw new Error(t("p360.pickInterviewer"));
      const start = new Date(startsAt);
      const end = new Date(start.getTime() + Number(duration) * 60_000);
      return scheduleRecruitmentInterview({ applicationId: application.id, interviewerUserId, title: title.trim(), type, timezone, startsAt: start.toISOString(), endsAt: end.toISOString(), calendarProvider: calendarProvider === "NONE" ? undefined : calendarProvider, meetingUrl: type === "VIRTUAL" ? meetingUrl.trim() || undefined : undefined, location: type === "PRESENTIAL" ? location.trim() || undefined : undefined });
    },
    onSuccess: async () => {
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["application", application.id] });
      await queryClient.invalidateQueries({ queryKey: ["recruitment-interviews"] });
    },
  });
  const interviews = application.interviews ?? [];
  return <Card id="entrevistas" level={2}><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>{t("p360.interviews")}</CardTitle>{canSchedule ? <Button size="sm" onClick={() => setOpen(true)}><CalendarPlus className="size-4" />{t("p360.scheduleInterview")}</Button> : null}</div></CardHeader><CardContent>{interviews.length ? <div className="space-y-3">{interviews.map((interview) => <div key={interview.id} className="rounded-xl border border-border-default p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{interview.title}</p><p className="text-sm text-text-secondary">{interview.type} · {formatApplicationDate(interview.startsAt)} · {interview.timezone}</p><p className="text-sm text-text-secondary">Entrevistador: {interview.interviewer ? `${interview.interviewer.firstName} ${interview.interviewer.lastName}` : t("p360.unassigned")}</p></div><Badge variant="secondary">{technicalLabel(interview.status)}</Badge></div>{interview.meetingUrl ? <Button asChild size="sm" variant="secondary" className="mt-3"><a href={interview.meetingUrl} target="_blank" rel="noreferrer">Abrir reunión <ExternalLink className="size-4" /></a></Button> : null}</div>)}</div> : application.interview ? <dl className="grid gap-3 sm:grid-cols-2"><Summary label={t("p360.type")} value={application.interview.type ?? t("p360.undefinedValue")} /><Summary label="Programada" value={formatApplicationDate(application.interview.scheduledAt)} /><Summary label="Seguimiento" value={formatApplicationDate(application.interview.followUpAt)} /><Summary label={t("p360.observations")} value={application.interview.observations ?? t("p360.noObservations")} /></dl> : <p className="text-sm text-text-secondary">{t("p360.noInterviewScheduled")}</p>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="sm:max-w-3xl"><DialogHeader><DialogTitle>{t("p360.scheduleInterview")}</DialogTitle><DialogDescription>{t("p360.scheduleBody")}</DialogDescription></DialogHeader><div className="space-y-4"><label className="block space-y-2 text-sm font-medium" htmlFor="interview-title">{t("p360.titleField")}<Input id="interview-title" value={title} onChange={(event) => setTitle(event.target.value)} /></label><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium" htmlFor="interview-type">{t("p360.type")}<Select value={type} onValueChange={(value) => setType(value as typeof type)}><SelectTrigger id="interview-type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="VIRTUAL">Virtual</SelectItem><SelectItem value="PRESENTIAL">Presencial</SelectItem><SelectItem value="PHONE">{t("p360.typePhone")}</SelectItem></SelectContent></Select></label><label className="space-y-2 text-sm font-medium" htmlFor="interview-interviewer">{t("p360.interviewer")}<Select value={interviewerUserId} onValueChange={setInterviewerUserId}><SelectTrigger id="interview-interviewer"><SelectValue placeholder={interviewers.isLoading ? "Cargando..." : t("p360.pickPerson")} /></SelectTrigger><SelectContent>{interviewers.data?.map((person) => <SelectItem key={person.id} value={person.id}>{person.firstName} {person.lastName}</SelectItem>)}</SelectContent></Select></label><div className="space-y-2 sm:col-span-2"><span className="text-sm font-medium">{t("p360.dateTime")}</span><div className="grid gap-2 sm:grid-cols-2"><label className="space-y-1 text-xs text-muted-foreground" htmlFor="interview-date">{t("p360.date")}<Input id="interview-date" type="date" value={startsAt.slice(0, 10)} onChange={(event) => setStartsAt(`${event.target.value}T${startsAt.slice(11, 16)}`)} /></label><label className="space-y-1 text-xs text-muted-foreground" htmlFor="interview-time">Hora<Input id="interview-time" type="time" value={startsAt.slice(11, 16)} onChange={(event) => setStartsAt(`${startsAt.slice(0, 10)}T${event.target.value}`)} /></label></div></div><label className="space-y-2 text-sm font-medium" htmlFor="interview-duration">{t("p360.duration")}<Select value={duration} onValueChange={setDuration}><SelectTrigger id="interview-duration"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="30">30 minutos</SelectItem><SelectItem value="45">45 minutos</SelectItem><SelectItem value="60">60 minutos</SelectItem><SelectItem value="90">90 minutos</SelectItem></SelectContent></Select></label><label className="space-y-2 text-sm font-medium" htmlFor="interview-calendar">Calendario<Select value={calendarProvider} onValueChange={(value) => setCalendarProvider(value as typeof calendarProvider)}><SelectTrigger id="interview-calendar"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="NONE">{t("p360.internalOnly")}</SelectItem><SelectItem value="GOOGLE">Google Calendar</SelectItem><SelectItem value="MICROSOFT">Microsoft Outlook</SelectItem><SelectItem value="ZOOM">Zoom</SelectItem></SelectContent></Select></label><label className="space-y-2 text-sm font-medium" htmlFor="interview-timezone">Zona horaria<Input id="interview-timezone" value={timezone} onChange={(event) => setTimezone(event.target.value)} /></label></div>{type === "VIRTUAL" ? <label className="block space-y-2 text-sm font-medium" htmlFor="interview-meeting-url">{t("p360.meetingLink")}<Input id="interview-meeting-url" type="url" placeholder="https://..." value={meetingUrl} onChange={(event) => setMeetingUrl(event.target.value)} /></label> : null}{type === "PRESENTIAL" ? <label className="block space-y-2 text-sm font-medium" htmlFor="interview-location">{t("p360.location")}<Input id="interview-location" value={location} onChange={(event) => setLocation(event.target.value)} /></label> : null}{schedule.isError ? <InlineFeedback tone="danger" title={t("p360.scheduleFailed")}>{schedule.error instanceof Error ? schedule.error.message : t("p360.checkAndRetry")}</InlineFeedback> : null}<ActionBar><Button variant="secondary" onClick={() => setOpen(false)}>{t("actions.cancel")}</Button><Button onClick={() => schedule.mutate()} disabled={schedule.isPending || !interviewerUserId || !title.trim()}>{schedule.isPending ? "Programando..." : t("p360.confirmInterview")}</Button></ActionBar></div></DialogContent></Dialog>
  </CardContent></Card>;
}

function defaultInterviewDate(minutesFromNow: number) {
  const date = new Date(Date.now() + minutesFromNow * 60_000);
  date.setSeconds(0, 0);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="flex gap-3 [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0"><span aria-hidden="true">{icon}</span><div><p className="text-xs text-text-secondary">{label}</p><p className="break-words text-sm font-medium">{value}</p></div></div>; }
function Summary({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs text-text-secondary">{label}</dt><dd className="mt-1 text-sm font-medium">{value}</dd></div>; }
function Section({ title, empty, children }: { title: string; empty: string; children?: string | null }) { return <section><h3 className="font-semibold">{title}</h3><p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">{children || empty}</p></section>; }
function CommunicationHistory({ messages, retryPending, onRetry }: { messages: AtsMessageDto[]; retryPending: boolean; onRetry: (messageId: string) => void }) {
  const { t } = useLocale();
  const groups = Array.from(messages.reduce((grouped, message) => {
    const key = message.eventKey ?? `message:${message.id}`;
    const group = grouped.get(key) ?? [];
    group.push(message);
    grouped.set(key, group);
    return grouped;
  }, new Map<string, AtsMessageDto[]>()));

  return <ol className="space-y-4">{groups.map(([eventKey, copies]) => {
    const message = copies[0];
    return <li key={eventKey} className="rounded-xl border border-border-default p-3"><div><p className="font-medium">{message.subject}</p><p className="mt-1 text-xs text-text-secondary">{copies.length} {copies.length === 1 ? "destinatario" : "destinatarios"}</p></div><p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-text-secondary">{message.body}</p><div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-secondary"><span>{formatApplicationDate(message.createdAt)}</span><span>{technicalLabel(message.type)}</span>{message.template ? <span>{message.template.name} v{message.template.version}</span> : <span>{t("p360.systemTemplate")}</span>}</div><ul className="mt-3 space-y-2 border-t border-border-default pt-3">{copies.map((copy) => { const delivery = copy.notification?.deliveries.find((item) => item.channel === "EMAIL"); const retryable = delivery?.status === "FAILED" || delivery?.status === "DEAD_LETTER"; return <li key={copy.id} className="flex flex-wrap items-center justify-between gap-2 text-xs"><div><span className="font-medium">{copy.recipientName || copy.recipientEmail}</span><span className="text-text-secondary"> · {copy.audience === "CANDIDATE" ? t("p360.candidate") : t("p360.owner")}{delivery ? ` · ${delivery.attempts}/${delivery.maxAttempts} intentos` : ""}</span>{delivery?.lastError ? <p className="mt-1 text-status-danger">{delivery.lastError}</p> : null}</div><div className="flex items-center gap-2"><Badge variant={copy.status === "DELIVERED" ? "default" : copy.status === "FAILED" || copy.status === "DEAD_LETTER" ? "destructive" : "secondary"}>{communicationStatusLabel(copy.status, t)}</Badge>{retryable ? <Button size="sm" variant="secondary" onClick={() => onRetry(copy.id)} disabled={retryPending}><RotateCcw className="size-4" />Reintentar</Button> : null}</div></li>; })}</ul></li>;
  })}</ol>;
}
// No es un componente: recibe la funcion de traduccion de quien la llama.
function communicationStatusLabel(status: string, t: (key: string) => string) {
  const keys: Record<string, string> = { PENDING: "p360.comm.PENDING", PROCESSING: "p360.comm.PROCESSING", DELIVERED: "p360.comm.DELIVERED", FAILED: "p360.comm.FAILED", DEAD_LETTER: "p360.retriesExhausted", CANCELLED: "p360.comm.CANCELLED", SKIPPED: "p360.notSent" };
  return keys[status] ? t(keys[status]) : status;
}
