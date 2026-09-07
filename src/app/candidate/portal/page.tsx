"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Download, FileClock, FileText, Mail, Send, ShieldCheck, Signature, Upload, UserCircle2 } from "lucide-react";
import { createCandidateSupportRequest, downloadCandidateInterviewInvitation, exchangeCandidateSocialCode, fetchCandidateApplications, fetchCandidateJobOffers, fetchCandidatePortalOverview, fetchCandidatePreboarding, fetchCandidateResumeAccess, getCandidateSession, markCandidateCommunicationRead, replyCandidateCommunication, requestCandidateInterviewReschedule, uploadCandidateResume } from "@/lib/backend";
import { toast } from "sonner";
import { CandidateNav } from "@/components/candidate-nav";
import { CandidateAuthCard } from "@/components/candidate-auth-card";
import { CandidateJobOffers } from "@/components/candidate-job-offers";
import { AsyncState } from "@/components/async-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { technicalLabel } from "@/lib/ui-labels";
import { trackProductEvent } from "@/lib/product-analytics";
import { useLocale } from "@/components/locale-provider";

function CandidatePortalContent() {
  const queryClient = useQueryClient();
  const params = useSearchParams();
  const { locale, t } = useLocale();
  const lang = locale;
  const [authenticated, setAuthenticated] = useState(() => Boolean(getCandidateSession()));
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [replyMessage, setReplyMessage] = useState<Record<string, string>>({});
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const socialCode = params.get("socialCode");
  useEffect(() => {
    if (!socialCode || authenticated) return;
    void exchangeCandidateSocialCode(socialCode).then(() => setAuthenticated(true));
  }, [authenticated, socialCode]);
  const applications = useQuery({ queryKey: ["candidate-applications", authenticated, locale], queryFn: fetchCandidateApplications, enabled: authenticated });
  const overview = useQuery({ queryKey: ["candidate-portal", authenticated, locale], queryFn: fetchCandidatePortalOverview, enabled: authenticated });
  const jobOffers = useQuery({ queryKey: ["candidate-job-offers", authenticated, locale], queryFn: fetchCandidateJobOffers, enabled: authenticated });
  const preboarding = useQuery({ queryKey: ["candidate-preboarding", authenticated, locale], queryFn: fetchCandidatePreboarding, enabled: authenticated });
  const portalOverview = overview.data ?? {
    communications: [],
    offers: [],
    resumes: [],
    signatureDocuments: [],
    privacyRequests: [],
    supportRequests: [],
  };
  const candidateOffers = jobOffers.data ?? [];
  const recentApplication = useMemo(() => applications.data?.[0] ?? null, [applications.data]);
  const pendingInterviews = useMemo(() => applications.data?.flatMap((item) => (item.interviews ?? []).map((interview) => ({ application: item, interview }))).filter(({ interview }) => interview.status !== "CANCELED") ?? [], [applications.data]);
  const activePrivacyRequests = portalOverview.privacyRequests.filter((item) => item.status === "PENDING" || item.status === "PROCESSING");
  const markRead = useMutation({ mutationFn: markCandidateCommunicationRead, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["candidate-portal"] }) });
  const reply = useMutation({ mutationFn: ({ id, message }: { id: string; message: string }) => replyCandidateCommunication(id, message), onSuccess: async () => { setReplyMessage({}); toast.success(t("candidate.portal.replySent")); await queryClient.invalidateQueries({ queryKey: ["candidate-portal"] }); }, onError: () => toast.error(t("candidate.portal.replyError")) });
  const reschedule = useMutation({ mutationFn: requestCandidateInterviewReschedule, onSuccess: ({ url }) => window.location.assign(url), onError: () => toast.error(t("candidate.portal.rescheduleError")) });
  const support = useMutation({ mutationFn: () => createCandidateSupportRequest({ subject: supportSubject.trim(), message: supportMessage.trim() }), onSuccess: async () => { setSupportSubject(""); setSupportMessage(""); toast.success("Solicitud enviada al equipo de soporte"); await queryClient.invalidateQueries({ queryKey: ["candidate-portal"] }); }, onError: () => toast.error("No fue posible enviar la solicitud") });
  const uploadResume = useMutation({ mutationFn: uploadCandidateResume, onSuccess: async () => { toast.success(t("candidate.portal.resumeUpdated")); await Promise.all([queryClient.invalidateQueries({ queryKey: ["candidate-portal"] }), queryClient.invalidateQueries({ queryKey: ["candidate-applications"] })]); }, onError: (cause) => toast.error(cause instanceof Error ? cause.message : t("candidate.portal.resumeError")) });
  const selectResume = (file: File | undefined) => { if (!file) return; uploadResume.mutate(file); };
  return <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 pb-12 pt-2"><CandidateNav />
    {!authenticated ? <CandidateAuthCard lang={lang} returnPath={"/candidate/portal?lang=" + lang} onAuthenticated={() => setAuthenticated(true)} /> : null}
    {applications.isLoading ? <AsyncState state="loading" title={t("candidate.portal.loading")} /> : null}
    {applications.isError ? <AsyncState state="error" title={t("candidate.portal.loadError")} description={t("candidate.portal.loadErrorDetail")} onRetry={() => { void applications.refetch(); }} /> : null}
    {authenticated && applications.data ? <>
      <header className="rounded-[2rem] border bg-card p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <Badge variant="secondary">{t("candidate.portal.badge")}</Badge>
            <h1 className="text-3xl font-semibold tracking-tight">{t("candidate.portal.title")}</h1>
            <p className="max-w-3xl text-muted-foreground">{t("candidate.portal.description")}</p>
            <div className="flex flex-wrap gap-2">
              <Button asChild><Link href={"/candidate/profile?lang=" + lang} onClick={() => trackProductEvent({ name: "quick_action_opened", action: "profile", role: "candidate" })}>{t("candidate.portal.managePrivacy")}</Link></Button>
              <Button asChild variant="secondary"><Link href="/candidate/preboarding" onClick={() => trackProductEvent({ name: "quick_action_opened", action: "preboarding", role: "candidate" })}>{t("candidate.portal.viewPreboarding")}</Link></Button>
              <Button asChild variant="secondary"><Link href={"/application-status?lang=" + lang} onClick={() => trackProductEvent({ name: "quick_action_opened", action: "applications", role: "candidate" })}>{t("candidate.portal.history")}</Link></Button>
            </div>
          </div>
          <div className="grid gap-2 rounded-2xl border bg-surface-section p-4 text-sm">
            <div className="flex items-center gap-2"><UserCircle2 className="size-4 text-brand" />{recentApplication?.vacancy.title ?? t("candidate.portal.noRecent")}</div>
            <div className="flex items-center gap-2"><FileClock className="size-4 text-brand" />{recentApplication?.currentStage?.name ?? recentApplication?.status ?? t("candidate.portal.pendingActivity")}</div>
            <div className="flex items-center gap-2"><ShieldCheck className="size-4 text-brand" />{activePrivacyRequests.length ? t("candidate.portal.privacyActive", { count: activePrivacyRequests.length }) : t("candidate.portal.privacyNone")}</div>
          </div>
        </div>
      </header>
      <section aria-labelledby="portal-summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><h2 id="portal-summary" className="sr-only">{t("candidate.portal.summary")}</h2><Metric icon={<Send />} label={t("candidate.portal.metric.applications")} value={applications.data.length} /><Metric icon={<CalendarDays />} label={t("candidate.portal.metric.interviews")} value={applications.data.flatMap((item) => item.interviews ?? []).length} /><Metric icon={<Mail />} label={t("candidate.portal.metric.offers")} value={candidateOffers.length} /><Metric icon={<FileText />} label={t("candidate.portal.metric.documents")} value={portalOverview.resumes.length + portalOverview.signatureDocuments.length} /></section>
      <section aria-labelledby="self-service-title" className="space-y-3">
        <h2 id="self-service-title" className="text-2xl font-semibold">{t("candidate.portal.quickActions")}</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <QuickAction label={t("actions.open")} title={t("candidate.portal.action.profile")} description={t("candidate.portal.action.profileHint")} href={"/candidate/profile?lang=" + lang} icon={<UserCircle2 className="size-5" />} />
          <QuickAction label={t("actions.open")} title={t("candidate.portal.action.applications")} description={t("candidate.portal.action.applicationsHint")} href={"/application-status?lang=" + lang} icon={<Send className="size-5" />} />
          <QuickAction label={t("actions.open")} title={t("candidate.portal.action.documents")} description={t("candidate.portal.action.documentsHint")} href="#documents" icon={<FileText className="size-5" />} />
          <QuickAction label={t("actions.open")} title={t("candidate.portal.action.privacy")} description={t("candidate.portal.action.privacyHint")} href={"/candidate/profile?lang=" + lang} icon={<ShieldCheck className="size-5" />} />
        </div>
      </section>
      <section aria-labelledby="applications-title" className="space-y-3">
        <h2 id="applications-title" className="text-2xl font-semibold">{t("candidate.portal.applications")}</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {applications.data.map((application) => <Card key={application.id}><CardHeader><div className="flex items-start justify-between gap-3"><CardTitle>{application.vacancy.title}</CardTitle><Badge>{application.currentStage?.name ?? application.status}</Badge></div><p className="text-sm text-muted-foreground">{application.vacancy.tenant?.name ?? ""} · {application.vacancy.branch?.name ?? t("candidate.portal.noBranch")}</p></CardHeader><CardContent className="space-y-4"><ol aria-label={t("candidate.portal.timeline")} className="space-y-3 border-l pl-5">{application.tracking?.timelineEvents?.slice(-4).map((event) => <li key={event.id ?? event.type} className="relative"><span aria-hidden="true" className="absolute -left-[1.65rem] top-1 size-3 rounded-full bg-primary" /><p className="font-medium">{timelineLabel(event.type, t)}</p><p className="text-sm text-muted-foreground">{event.at ? new Date(event.at).toLocaleString(lang) : t("candidate.portal.pending")}{event.note ? ` · ${event.note}` : ""}</p></li>)}</ol><div className="space-y-2"><p className="text-sm font-medium">{t("candidate.portal.nextSteps")}</p><p className="text-sm text-muted-foreground">{application.pendingTransitions?.[0] ? t("candidate.portal.pendingApproval", { stage: application.pendingTransitions[0].toStage.name }) : application.interviews?.length ? t("candidate.portal.hasInterviews") : t("candidate.portal.underReview")}</p></div><div className="flex flex-wrap gap-2"><Button asChild variant="secondary"><Link href={`/application-status?reference=${encodeURIComponent(application.id)}`}>{t("candidate.portal.openTracking")}</Link></Button>{!["HIRED", "WITHDRAWN"].includes(application.status) ? <Button asChild variant="ghost"><Link href={"/candidate/profile?lang=" + lang}>{t("candidate.portal.privacy")}</Link></Button> : null}</div></CardContent></Card>)}
        </div>
        {!applications.data.length ? <Empty text={t("candidate.portal.noApplications")} /> : null}
      </section>
      <section aria-labelledby="interviews-title" className="space-y-3"><h2 id="interviews-title" className="text-2xl font-semibold">{t("candidate.portal.metric.interviews")}</h2>{pendingInterviews.map(({ application, interview }) => <Card key={interview.id}><CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_auto]"><div><p className="font-semibold">{interview.title}</p><p className="mt-1 text-sm text-muted-foreground">{application.vacancy.title} · {new Date(interview.startsAt).toLocaleString(lang, { timeZone: interview.timezone })}</p><p className="text-sm text-muted-foreground">{interview.timezone} · {technicalLabel(interview.status)}</p></div><div className="flex flex-col gap-2">{interview.meetingUrl ? <Button asChild><a href={interview.meetingUrl} target="_blank" rel="noreferrer">{t("candidate.portal.joinMeeting")}</a></Button> : null}<Button variant="secondary" disabled={reschedule.isPending} onClick={() => reschedule.mutate(interview.id)}>{reschedule.isPending ? t("actions.preparing") : t("candidate.portal.reschedule")}</Button><Button asChild variant="ghost"><Link href="/candidate/preboarding">{t("candidate.portal.prepareStart")}</Link></Button></div></CardContent></Card>)}{!pendingInterviews.length ? <Empty text={t("candidate.portal.noInterviews")} /> : null}</section>
      <CandidateInterviewCalendar interviews={applications.data.flatMap((application) => (application.interviews ?? []).map((interview) => ({ id: interview.id, title: interview.title, startsAt: interview.startsAt, status: interview.status })))} />
      <CandidateJobOffers offers={candidateOffers} onRefresh={() => { void jobOffers.refetch(); void applications.refetch(); }} />
      <section aria-labelledby="notifications-title" className="space-y-3"><div className="flex items-center justify-between gap-3"><h2 id="notifications-title" className="text-2xl font-semibold">{t("candidate.portal.messages")}</h2><Badge variant="secondary">{portalOverview.communications.filter((item) => !item.readAt && item.direction !== "INBOUND").length} {t("candidate.portal.unread")}</Badge></div><p className="text-sm text-muted-foreground">{t("candidate.portal.messagesHint")}</p>{overview.isError ? <SectionUnavailable onRetry={() => { void overview.refetch(); }} /> : <><div className="grid gap-4 lg:grid-cols-2">{portalOverview.communications.map((message) => <Card key={message.id} className={!message.readAt && message.direction !== "INBOUND" ? "border-primary/40" : undefined}><CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle>{message.subject}</CardTitle><p className="mt-1 text-xs text-muted-foreground">{message.direction === "INBOUND" ? t("candidate.portal.you") : t("candidate.portal.recruitingTeam")}</p></div><Badge variant="secondary">{message.direction === "INBOUND" ? t("candidate.portal.sent") : message.readAt ? t("candidate.portal.read") : t("candidate.portal.new")}</Badge></div></CardHeader><CardContent><p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">{message.body}</p>{message.direction !== "INBOUND" ? <div className="mt-4 space-y-2 border-t pt-3"><textarea value={replyMessage[message.id] ?? ""} onChange={(event) => setReplyMessage((current) => ({ ...current, [message.id]: event.target.value }))} maxLength={4000} className="min-h-20 w-full rounded-xl border bg-background p-3 text-base sm:text-sm" placeholder={t("candidate.portal.replyPlaceholder")} /><Button size="sm" disabled={!replyMessage[message.id]?.trim() || reply.isPending} onClick={() => reply.mutate({ id: message.id, message: replyMessage[message.id] })}>{reply.isPending ? t("actions.sending") : t("candidate.portal.sendReply")}</Button></div> : null}<div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>{new Date(message.createdAt).toLocaleString(lang)}</span><span>{message.status}</span>{message.deliveredAt ? <span>{t("candidate.portal.delivered", { at: new Date(message.deliveredAt).toLocaleString(lang) })}</span> : null}{!message.readAt && message.direction !== "INBOUND" ? <Button size="sm" variant="ghost" disabled={markRead.isPending} onClick={() => markRead.mutate(message.id)}>{t("candidate.portal.markRead")}</Button> : null}</div></CardContent></Card>)}</div>{!portalOverview.communications.length ? <Empty text={t("candidate.portal.noMessages")} /> : null}</>}</section>
      <section aria-labelledby="documents-title" id="documents" className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-3"><h2 id="documents-title" className="text-2xl font-semibold">{t("candidate.portal.documents")}</h2><><input ref={resumeInputRef} type="file" accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" disabled={uploadResume.isPending} onChange={(event) => { selectResume(event.target.files?.[0]); event.target.value = ""; }} /><Button type="button" disabled={uploadResume.isPending} onClick={() => resumeInputRef.current?.click()}><Upload className="size-4" />{uploadResume.isPending ? t("actions.uploading") : portalOverview.resumes.length ? t("candidate.portal.replaceResume") : t("candidate.portal.uploadResume")}</Button></></div>{overview.isError ? <SectionUnavailable onRetry={() => { void overview.refetch(); }} /> : <><div className="grid gap-4 lg:grid-cols-2">{portalOverview.resumes.map((document) => <Card key={document.id}><CardContent className="space-y-3 p-5"><div className="flex items-center gap-3"><FileText className="size-5" /><div className="min-w-0 flex-1"><p className="truncate font-medium">{document.originalName}</p><p className="text-sm text-muted-foreground">{t("candidate.portal.resumeVersion", { version: document.version })} · {technicalLabel(document.status)} · {new Date(document.createdAt).toLocaleDateString(lang)}</p></div><div className="flex flex-wrap justify-end gap-2"><Button size="sm" variant="secondary" onClick={() => void fetchCandidateResumeAccess(document.id).then(({ url }) => window.open(url, "_blank", "noopener,noreferrer"))}><Download className="size-4" />{t("actions.download")}</Button>{document.status === "ACTIVE" ? <Button size="sm" variant="outline" disabled={uploadResume.isPending} onClick={() => resumeInputRef.current?.click()}><Upload className="size-4" />{t("actions.replace")}</Button> : null}</div></div><p className="text-xs text-muted-foreground">{document.status === "ACTIVE" ? t("candidate.portal.resumeCurrent") : t("candidate.portal.resumePrevious")} {t("candidate.portal.resumeAccess")}</p></CardContent></Card>)}{portalOverview.signatureDocuments.map((document) => <Card key={document.id}><CardContent className="space-y-3 p-5"><div className="flex items-center gap-3"><Signature className="size-5" /><div><p className="font-medium">{document.signaturePackage.title}</p><p className="text-sm text-muted-foreground">{technicalLabel(document.status)}</p></div></div><p className="text-xs text-muted-foreground">{t("candidate.portal.signatureExpires", { date: document.tokenExpiresAt ? new Date(document.tokenExpiresAt).toLocaleDateString(lang) : t("candidate.portal.noDate") })}</p></CardContent></Card>)}</div>{!portalOverview.resumes.length && !portalOverview.signatureDocuments.length ? <Empty text={t("candidate.portal.noDocuments")} /> : null}</>}</section>
      <section aria-labelledby="requests-title" className="space-y-3"><h2 id="requests-title" className="text-2xl font-semibold">{t("candidate.portal.privacySupport")}</h2><div className="grid gap-4 lg:grid-cols-2"><Card><CardContent className="space-y-3 p-5"><p className="font-semibold">{t("candidate.portal.privacyRequests")}</p>{overview.isError ? <SectionUnavailable onRetry={() => { void overview.refetch(); }} /> : <>{portalOverview.privacyRequests.map((item) => <div key={item.id} className="rounded-xl border p-3 text-sm"><div className="flex justify-between gap-3"><span>{item.type}</span><Badge variant="secondary">{item.status}</Badge></div><p className="mt-1 text-muted-foreground">{new Date(item.requestedAt).toLocaleDateString(lang)}{item.response ? ` · ${item.response}` : ""}</p></div>)}{!portalOverview.privacyRequests.length ? <p className="text-sm text-muted-foreground">{t("candidate.portal.noPrivacyRequests")}</p> : null}</>}<Button asChild variant="secondary"><Link href="/candidate/profile">{t("candidate.portal.privacy")}</Link></Button></CardContent></Card><Card><CardContent className="space-y-3 p-5"><p className="font-semibold">{t("candidate.portal.support")}</p>{overview.isError ? <SectionUnavailable onRetry={() => { void overview.refetch(); }} /> : <>{portalOverview.supportRequests.map((item) => <div key={item.id} className="rounded-xl border p-3 text-sm"><div className="flex justify-between gap-3"><span>{item.subject}</span><Badge variant="secondary">{item.status}</Badge></div><p className="mt-1 text-muted-foreground">{item.response ?? t("candidate.portal.sentOn", { date: new Date(item.requestedAt).toLocaleDateString(lang) })}</p></div>)}<Input value={supportSubject} onChange={(event) => setSupportSubject(event.target.value)} maxLength={160} placeholder={t("candidate.portal.subject")} /><textarea value={supportMessage} onChange={(event) => setSupportMessage(event.target.value)} maxLength={4000} className="min-h-24 w-full rounded-xl border bg-background p-3 text-base sm:text-sm" placeholder={t("candidate.portal.howCanWeHelp")} /><Button disabled={!supportSubject.trim() || !supportMessage.trim() || support.isPending} onClick={() => support.mutate()}>{support.isPending ? t("actions.sending") : t("candidate.portal.sendRequest")}</Button></>}</CardContent></Card></div></section>
      {preboarding.data ? <section aria-labelledby="preboarding-title" className="space-y-3"><h2 id="preboarding-title" className="text-2xl font-semibold">{t("candidate.portal.preboarding")}</h2><Card><CardContent className="space-y-4 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{preboarding.data.employee.name}</p><p className="text-sm text-muted-foreground">{preboarding.data.employee.jobTitle ?? t("candidate.portal.noRole")} · {t("candidate.portal.percentComplete", { percent: preboarding.data.progressPercent })}</p></div><Button asChild variant="secondary"><Link href="/candidate/preboarding">{t("candidate.portal.openPreboarding")}</Link></Button></div><div className="grid gap-3 md:grid-cols-3"><MiniMetric label={t("candidate.portal.metric.tasks")} value={preboarding.data.tasks.length} /><MiniMetric label={t("candidate.portal.metric.documents")} value={preboarding.data.documents.length} /><MiniMetric label={t("candidate.portal.metric.signatures")} value={preboarding.data.signatures.length} /></div></CardContent></Card></section> : null}
    </> : null}
  </main>;
}

export default function CandidatePortalPage() { return <Suspense fallback={<AsyncState state="loading" />}><CandidatePortalContent /></Suspense>; }

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) { return <Card><CardContent className="flex items-center gap-4 p-5"><span className="text-brand">{icon}</span><div><p className="text-2xl font-semibold">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div></CardContent></Card>; }
function MiniMetric({ label, value }: { label: string; value: number }) { return <div className="rounded-xl bg-surface-section p-4"><p className="text-2xl font-semibold">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div>; }
function Empty({ text }: { text: string }) { return <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">{text}</p>; }
function SectionUnavailable({ onRetry }: { onRetry: () => void }) { const { t } = useLocale(); return <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground"><span>{t("candidate.portal.sectionUnavailable")}</span><Button size="sm" variant="secondary" onClick={onRetry}>{t("actions.retry")}</Button></div>; }
function QuickAction({ title, description, href, icon, label }: { title: string; description: string; href: string; icon: React.ReactNode; label: string }) { return <Card className="group border-border-default/70 bg-card transition hover:-translate-y-0.5 hover:shadow-md"><CardContent className="space-y-3 p-5"><div className="flex items-center gap-3"><span className="rounded-xl bg-primary/10 p-2 text-brand">{icon}</span><div><p className="font-semibold">{title}</p><p className="text-sm text-muted-foreground">{description}</p></div></div><Button asChild variant="secondary" className="w-full"><Link href={href}>{label}</Link></Button></CardContent></Card>; }
// Las diez etiquetas del historial estaban escritas en español dentro de esta
// función a nivel de módulo, fuera del alcance del idioma. Ahora recibe `t`.
const TIMELINE_KEYS = [
  "VACANCY_PUBLISHED", "APPLIED", "CONTACTED", "INTERVIEW_SCHEDULED", "INTERVIEW_RESCHEDULED",
  "INTERVIEW_CANCELLED", "INTERVIEW_COMPLETED", "STAGE_CHANGED", "HIRED", "APPLICATION_WITHDRAWN",
] as const;

function timelineLabel(type: string, t: (key: string) => string) {
  // Un tipo que el backend añada y aquí no esté no se enmascara: se muestra su
  // código, que es información, en vez de un texto inventado.
  return TIMELINE_KEYS.includes(type as (typeof TIMELINE_KEYS)[number]) ? t(`candidate.timeline.${type}`) : type;
}

function CandidateInterviewCalendar({ interviews }: { interviews: Array<{ id: string; title: string; startsAt: string; status: string }> }) {
  const { t, locale } = useLocale();
  const [downloadingId, setDownloadingId] = useState("");
  const download = async (interview: { id: string; title: string }) => {
    setDownloadingId(interview.id);
    try {
      const blob = await downloadCandidateInterviewInvitation(interview.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `entrevista-${interview.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || interview.id}.ics`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingId("");
    }
  };
  const active = interviews.filter((item) => item.status !== "CANCELED");
  if (!active.length) return null;
  return <section aria-labelledby="calendar-title" className="rounded-2xl border bg-card p-5"><h2 id="calendar-title" className="text-lg font-semibold">{t("candidate.calendar.title")}</h2><p className="mt-1 text-sm text-muted-foreground">{t("candidate.calendar.description")}</p><div className="mt-4 flex flex-wrap gap-2">{active.map((interview) => <Button key={interview.id} size="sm" variant="secondary" onClick={() => void download(interview)} disabled={downloadingId === interview.id}><Download className="size-4" />{downloadingId === interview.id ? t("actions.preparing") : t("candidate.calendar.add", { date: new Date(interview.startsAt).toLocaleDateString(locale, { day: "2-digit", month: "short" }) })}</Button>)}</div></section>;
}
