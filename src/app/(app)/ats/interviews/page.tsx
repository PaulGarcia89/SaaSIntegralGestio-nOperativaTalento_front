"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BellRing, CalendarDays, CalendarPlus, CalendarX, ChevronDown, CircleCheck, CircleX, Clock3, Download, Link2, Plus, RefreshCw, Search, Star, Users } from "lucide-react";
import { completeCalendarOAuth, createInterviewSchedulingRequest, disconnectCalendar, downloadInterviewInvitation, fetchApplications, fetchAvailabilitySettings, fetchCalendarAuthorizationUrl, fetchCalendarConnections, fetchCalendarProviderConfiguration, fetchInterviewPools, fetchInterviewResources, fetchInterviewerAvailability, fetchRecruitmentInterviews, respondInterviewInvitation, retryInterviewCalendarSync, scheduleInterviewSequence, scheduleRecruitmentInterview, updateAvailabilitySettings, updateRecruitmentInterview } from "@/lib/backend";
import type { ApplicationInterviewType, AvailabilitySettingsDto, CalendarProvider, RecruitmentInterviewDto, ScheduleInterviewInput, VideoConferenceProvider } from "@/lib/contracts";
import { getApiErrorMessage } from "@/lib/backend";
import { confirmAction } from "@/components/confirm-action";
import { useAppStore } from "@/store/app-store";
import { InlineFeedback, Pagination } from "@/components/design-system";
import { Avatar, EmptyState, PageHeader, StatusBadge, type Tone } from "@/components/system";
import { cn } from "@/lib/utils";
import { InterviewCoordinationConsole } from "@/components/interview-coordination-console";
import { AsyncState } from "@/components/async-state";
import { ScorecardDialog } from "@/components/scorecard-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { technicalLabel } from "@/lib/ui-labels";
import { useLocale } from "@/components/locale-provider";

const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const weekdays = [["1", "Lunes"], ["2", "Martes"], ["3", "Miércoles"], ["4", "Jueves"], ["5", "Viernes"], ["6", "Sábado"], ["0", "Domingo"]] as const;
const defaultAvailability: AvailabilitySettingsDto = {
  timezone: defaultTimezone,
  weeklySchedule: Object.fromEntries(weekdays.slice(0, 5).map(([day]) => [day, [{ start: "09:00", end: "17:00" }]])),
  bufferMinutes: 15,
  minNoticeHours: 2,
};

export default function InterviewsPage() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { tenantUsers, can, currentBranch, currentUser } = useAppStore();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<RecruitmentInterviewDto | null>(null);
  const [reschedule, setReschedule] = useState({ startsAt: "", endsAt: "" });
  const [scoreInterviewId, setScoreInterviewId] = useState("");
  const [form, setForm] = useState<ScheduleInterviewInput>({ applicationId: "", interviewerUserId: "", title: "Entrevista", type: "VIRTUAL", timezone: defaultTimezone, startsAt: "", endsAt: "" });
  const [scheduleMode, setScheduleMode] = useState<"DIRECT" | "SELF_SERVICE">("DIRECT");
  const [extraRounds, setExtraRounds] = useState<Array<{ title: string; startsAt: string; endsAt: string }>>([]);
  const [filters, setFilters] = useState({ search: "", status: "ALL", interviewerUserId: "ALL", startsFrom: "", startsTo: "", page: 1, pageSize: 20 });
  // Antes el tono salía de `oauthFeedback.includes("correctamente")`: al
  // cambiar la traducción, un error se habría pintado como éxito.
  const [oauthFeedback, setOauthFeedback] = useState<{ tone: "success" | "danger"; message: string } | null>(null);
  const [availabilityRequested, setAvailabilityRequested] = useState(false);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [availabilityForm, setAvailabilityForm] = useState<AvailabilitySettingsDto>(defaultAvailability);
  const interviews = useQuery({ queryKey: ["recruitment-interviews", filters, currentBranch?.id], queryFn: () => fetchRecruitmentInterviews({ search: filters.search || undefined, status: filters.status === "ALL" ? undefined : filters.status, interviewerUserId: filters.interviewerUserId === "ALL" ? undefined : filters.interviewerUserId, startsFrom: filters.startsFrom || undefined, startsTo: filters.startsTo || undefined, branchId: currentBranch?.id, page: filters.page, pageSize: filters.pageSize }) });
  const applications = useQuery({ queryKey: ["applications", "interview-scheduler"], queryFn: () => fetchApplications({ pageSize: 100 }) });
  const pools = useQuery({ queryKey: ["interview-pools"], queryFn: fetchInterviewPools });
  const resources = useQuery({ queryKey: ["interview-resources", currentBranch?.id], queryFn: () => fetchInterviewResources(currentBranch?.id), enabled: Boolean(currentBranch?.id) });
  const connections = useQuery({ queryKey: ["calendar-connections"], queryFn: fetchCalendarConnections });
  const providerConfiguration = useQuery({ queryKey: ["calendar-provider-configuration"], queryFn: fetchCalendarProviderConfiguration });
  const availabilitySettings = useQuery({ queryKey: ["availability-settings"], queryFn: fetchAvailabilitySettings });
  const availability = useQuery({
    queryKey: ["interviewer-availability", form.interviewerUserId, form.startsAt, form.endsAt],
    queryFn: () => fetchInterviewerAvailability(form.interviewerUserId, {
      startsAt: form.startsAt,
      endsAt: new Date(new Date(form.startsAt).getTime() + 7 * 24 * 60 * 60_000).toISOString(),
      durationMinutes: form.startsAt && form.endsAt ? Math.max(15, Math.round((new Date(form.endsAt).getTime() - new Date(form.startsAt).getTime()) / 60_000)) : 60,
    }),
    enabled: availabilityRequested && Boolean(form.interviewerUserId && form.startsAt && form.endsAt),
  });
  const schedule = useMutation({ onError: (error) => toast.error(getApiErrorMessage(error, t("interviews.scheduleErrorBody"))), mutationFn: async (input: ScheduleInterviewInput) => {
    if (scheduleMode === "SELF_SERVICE") {
      const durationMinutes = Math.max(15, Math.round((new Date(input.endsAt).getTime() - new Date(input.startsAt).getTime()) / 60_000));
      return createInterviewSchedulingRequest({ applicationId: input.applicationId, title: input.title, type: input.type, timezone: input.timezone, durationMinutes, windowStartsAt: input.startsAt, windowEndsAt: new Date(new Date(input.startsAt).getTime() + 14 * 86_400_000).toISOString(), poolId: input.poolId, interviewerUserIds: [input.interviewerUserId, ...(input.participantUserIds ?? [])], shadowUserIds: input.shadowUserIds, resourceIds: input.resourceIds });
    }
    if (extraRounds.length) return scheduleInterviewSequence({ applicationId: input.applicationId, title: `${input.title} · Secuencia`, rounds: [input, ...extraRounds.map((round) => ({ ...input, title: round.title, startsAt: round.startsAt, endsAt: round.endsAt }))] });
    return scheduleRecruitmentInterview(input);
  }, onSuccess: async (result) => { await queryClient.invalidateQueries({ queryKey: ["recruitment-interviews"] }); await queryClient.invalidateQueries({ queryKey: ["interview-coordination-queue"] }); if ("url" in result) { await navigator.clipboard?.writeText(result.url); toast.success(t("interviews.linkCreated")); } else { toast.success(extraRounds.length ? "Secuencia programada" : t("interviews.scheduled")); } setScheduleOpen(false); setExtraRounds([]); } });
  const updateInterview = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateRecruitmentInterview>[1] }) => updateRecruitmentInterview(id, input),
    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["recruitment-interviews"] });
      await queryClient.invalidateQueries({ queryKey: ["interview-coordination-queue"] });
      toast.success(variables.input.status === "CANCELED" ? "Entrevista cancelada. Se avisó al panel." : "Entrevista reprogramada");
      setEditingInterview(null);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible actualizar la entrevista.")),
  });
  const connectCalendar = useMutation({ onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible iniciar la autorización del calendario.")), mutationFn: async (provider: CalendarProvider) => { const redirectUri = `${window.location.origin}/ats/interviews?calendarProvider=${provider}`; const authorization = await fetchCalendarAuthorizationUrl(provider, redirectUri); window.location.assign(authorization.authorizationUrl); } });
  const disconnect = useMutation({
    mutationFn: disconnectCalendar,
    onSuccess: async () => { toast.success("Calendario desconectado"); await queryClient.invalidateQueries({ queryKey: ["calendar-connections"] }); },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible desconectar el calendario.")),
  });
  const retrySync = useMutation({
    mutationFn: retryInterviewCalendarSync,
    onSuccess: async () => { toast.success("Sincronización reintentada"); await queryClient.invalidateQueries({ queryKey: ["recruitment-interviews"] }); },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible reintentar la sincronización.")),
  });
  const invitationResponse = useMutation({ onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible registrar tu respuesta.")), mutationFn: ({ interviewId, accepted }: { interviewId: string; accepted: boolean }) => respondInterviewInvitation(interviewId, accepted), onSuccess: async (_, variables) => { toast.success(variables.accepted ? t("interviews.participationConfirmed") : t("interviews.invitationDeclined")); await queryClient.invalidateQueries({ queryKey: ["recruitment-interviews"] }); await queryClient.invalidateQueries({ queryKey: ["interview-coordination-queue"] }); } });
  const saveAvailability = useMutation({ mutationFn: updateAvailabilitySettings, onSuccess: async (saved) => { queryClient.setQueryData(["availability-settings"], saved); toast.success("Disponibilidad guardada"); setAvailabilityOpen(false); } });
  const downloadIcs = useMutation({ onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible descargar la invitación.")), mutationFn: async (interviewId: string) => ({ interviewId, blob: await downloadInterviewInvitation(interviewId) }), onSuccess: ({ interviewId, blob }) => { const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `entrevista-${interviewId}.ics`; anchor.click(); URL.revokeObjectURL(url); } });
  const candidates = applications.data?.data ?? [];
  const sorted = useMemo(() => [...(interviews.data?.data ?? [])].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()), [interviews.data?.data]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const provider = params.get("calendarProvider") as CalendarProvider | null;
    if (!code || !state || !provider || !["GOOGLE", "MICROSOFT", "ZOOM"].includes(provider)) return;
    const redirectUri = `${window.location.origin}/ats/interviews?calendarProvider=${provider}`;
    void completeCalendarOAuth(provider, { code, state, redirectUri })
      .then(async () => { setOauthFeedback({ tone: "success", message: t("interviews.providerConnected", { provider }) }); await queryClient.invalidateQueries({ queryKey: ["calendar-connections"] }); })
      .catch((error: unknown) => setOauthFeedback({ tone: "danger", message: getApiErrorMessage(error, t("interviews.connectionFailed")) }))
      .finally(() => window.history.replaceState({}, "", "/ats/interviews"));
  }, [queryClient, t]);

  const myPending = sorted.filter((interview) => interview.participants?.some((participant) => participant.userId === currentUser.id && participant.status === "PENDING"));
  const filtersActive = Boolean(filters.search || filters.status !== "ALL" || filters.interviewerUserId !== "ALL" || filters.startsFrom || filters.startsTo);
  const anyCalendarConnected = connections.data?.some((item) => item.status === "ACTIVE") ?? false;

  /*
   * Orden de la pantalla: lo que me toca a mí (invitaciones sin responder),
   * luego la agenda, y al final —plegados— los calendarios y el centro de
   * coordinación. Antes esos dos bloques ocupaban la primera pantalla y media
   * y la agenda empezaba muy abajo; nada de lo que había se ha quitado, solo
   * se ha bajado y cerrado con `<details>`.
   */
  return <div className="space-y-7"><PageHeader eyebrow="Reclutamiento" title={t("interviews.title")} description={t("interviews.description")} actions={can("interviews.schedule") ? <Button onClick={() => setScheduleOpen(true)}><Plus className="size-4" />{t("interviews.schedule")}</Button> : undefined} />
    {oauthFeedback ? <InlineFeedback tone={oauthFeedback.tone} title={t("interviews.calendarConnection")}>{oauthFeedback.message}</InlineFeedback> : null}
    {myPending.length ? <section aria-labelledby="my-invitations-title" className="space-y-3 rounded-lg border border-status-warning/40 bg-status-warning/5 p-4 sm:p-5"><h2 id="my-invitations-title" className="flex items-center gap-2 text-lg font-semibold text-ink-1"><BellRing className="size-5 text-status-warning" aria-hidden="true" />{t("interviews.myInvitations", { count: myPending.length })}</h2><ul className="space-y-2">{myPending.map((interview) => <li key={interview.id} className="flex flex-col justify-between gap-3 rounded-md bg-surface-1 p-3 sm:flex-row sm:items-center"><div className="min-w-0"><p className="truncate font-medium text-ink-1">{interview.application?.candidate.fullName ?? interview.title}</p><p className="text-sm text-ink-2">{new Date(interview.startsAt).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" })} · {interview.title}</p></div><div className="flex gap-2"><Button onClick={() => invitationResponse.mutate({ interviewId: interview.id, accepted: true })} disabled={invitationResponse.isPending}><CircleCheck className="size-4" />Aceptar</Button><Button variant="secondary" onClick={() => invitationResponse.mutate({ interviewId: interview.id, accepted: false })} disabled={invitationResponse.isPending}>Rechazar</Button></div></li>)}</ul></section> : null}

    <section aria-labelledby="agenda-title" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="agenda-title" className="text-lg font-semibold text-ink-1">{t("interviews.agenda")}{interviews.data?.meta ? <span className="ml-2 font-mono text-base font-normal tabular-nums text-ink-3">{interviews.data.meta.total}</span> : null}</h2>
        <details className="group relative w-full sm:w-auto" open={filtersActive}>
          <summary className="inline-flex min-h-[var(--control-h-base)] cursor-pointer list-none items-center gap-2 rounded-md border border-line bg-surface-1 px-3 text-sm font-medium text-ink-1 hover:bg-surface-2 [&::-webkit-details-marker]:hidden"><Search className="size-4" aria-hidden="true" />{t("interviews.filters")}{filtersActive ? <span className="size-2 rounded-full bg-action" aria-label={t("interviews.filtersActive")} /> : null}</summary>
          <div aria-label={t("interviews.filtersAria")} className="mt-3 grid gap-3 rounded-lg border border-line bg-surface-1 p-4 sm:absolute sm:right-0 sm:z-20 sm:w-[min(40rem,calc(100vw-2rem))] sm:shadow-e3 md:grid-cols-2"><label className="relative md:col-span-2"><span className="sr-only">{t("interviews.search")}</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" /><Input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value, page: 1 })} className="pl-9" placeholder={t("interviews.searchPlaceholder")} /></label><Select value={filters.status} onValueChange={(status) => setFilters({ ...filters, status, page: 1 })}><SelectTrigger aria-label={t("interviews.allStatuses")}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">{t("interviews.allStatuses")}</SelectItem><SelectItem value="SCHEDULED">Programadas</SelectItem><SelectItem value="CONFIRMED">Confirmadas</SelectItem><SelectItem value="COMPLETED">Completadas</SelectItem><SelectItem value="CANCELED">Canceladas</SelectItem></SelectContent></Select><Select value={filters.interviewerUserId} onValueChange={(interviewerUserId) => setFilters({ ...filters, interviewerUserId, page: 1 })}><SelectTrigger aria-label={t("interviews.allInterviewers")}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">{t("interviews.allInterviewers")}</SelectItem>{tenantUsers.map((user) => <SelectItem key={user.id} value={user.id}>{user.fullName}</SelectItem>)}</SelectContent></Select><Input aria-label={t("interviews.from")} type="date" value={filters.startsFrom} onChange={(event) => setFilters({ ...filters, startsFrom: event.target.value, page: 1 })} /><Input aria-label={t("interviews.to")} type="date" value={filters.startsTo ? filters.startsTo.slice(0, 10) : ""} onChange={(event) => setFilters({ ...filters, startsTo: event.target.value ? `${event.target.value}T23:59:59.999Z` : "", page: 1 })} /><Select value={String(filters.pageSize)} onValueChange={(value) => setFilters({ ...filters, pageSize: Number(value), page: 1 })}><SelectTrigger aria-label={t("interviews.pageSize")}><SelectValue /></SelectTrigger><SelectContent>{[20, 50, 100].map((size) => <SelectItem key={size} value={String(size)}>{size} por página</SelectItem>)}</SelectContent></Select>{filtersActive ? <Button variant="ghost" onClick={() => setFilters({ search: "", status: "ALL", interviewerUserId: "ALL", startsFrom: "", startsTo: "", page: 1, pageSize: filters.pageSize })}>{t("interviews.clearFilters")}</Button> : null}</div>
        </details>
      </div>
      {interviews.isLoading ? <AsyncState state="loading" title="Cargando agenda" /> : null}
      {interviews.isError ? <AsyncState state="error" title={t("interviews.loadError")} onRetry={() => void interviews.refetch()} /> : null}
      {interviews.isSuccess && !sorted.length ? (filtersActive
        ? <EmptyState reason="no-matches" onClearFilters={() => setFilters({ search: "", status: "ALL", interviewerUserId: "ALL", startsFrom: "", startsTo: "", page: 1, pageSize: filters.pageSize })} />
        : <EmptyState reason="no-records" title={t("interviews.none")} description={t("interviews.noneHelp")} action={can("interviews.schedule") ? <Button onClick={() => setScheduleOpen(true)}><Plus className="size-4" />{t("interviews.schedule")}</Button> : undefined} />) : null}
      {sorted.length ? <ul aria-label={t("interviews.agenda")} className="grid gap-4 xl:grid-cols-2 [&>li]:min-w-0">{sorted.map((interview) => <InterviewCard key={interview.id} interview={interview} canScore={can("scorecards.complete")} canSchedule={can("interviews.schedule")} busy={downloadIcs.isPending || retrySync.isPending} onScore={() => setScoreInterviewId(interview.id)} onReschedule={() => { setEditingInterview(interview); setReschedule({ startsAt: interview.startsAt, endsAt: interview.endsAt }); }} onDownload={() => downloadIcs.mutate(interview.id)} onRetrySync={() => retrySync.mutate(interview.id)} />)}</ul> : null}
      {interviews.data?.meta && interviews.data.meta.totalPages > 0 ? <Pagination page={interviews.data.meta.page - 1} totalPages={interviews.data.meta.totalPages} totalItems={interviews.data.meta.total} pageSize={interviews.data.meta.pageSize} onPageChange={(page) => setFilters({ ...filters, page: page + 1 })} /> : null}
    </section>

    <details className="group rounded-lg border border-line bg-surface-1" open={Boolean(oauthFeedback)}>
      <summary className="flex min-h-[var(--control-h-touch)] cursor-pointer list-none items-center gap-3 px-4 py-3 sm:px-5 [&::-webkit-details-marker]:hidden"><CalendarDays className="size-5 shrink-0 text-ink-3" aria-hidden="true" /><span className="min-w-0 flex-1"><span className="block text-base font-semibold text-ink-1">{t("interviews.calendars")}</span><span className="block truncate text-sm text-ink-2">{anyCalendarConnected ? t("interviews.calendarConnectedHint") : t("interviews.calendarNotConnectedHint")}</span></span><ChevronDown className="size-5 shrink-0 text-ink-3 transition-transform group-open:rotate-180" aria-hidden="true" /></summary>
      <div className="space-y-4 border-t border-line px-4 py-4 sm:px-5"><p className="text-sm text-ink-2">{t("interviews.calendarBody")}</p>{providerConfiguration.data?.some((item) => !item.configured) ? <InlineFeedback tone="warning" title={t("interviews.oauthPending")}>{t("interviews.oauthBody")}</InlineFeedback> : null}<ul className="grid gap-3 sm:grid-cols-3 [&>li]:min-w-0">{(["GOOGLE", "MICROSOFT", "ZOOM"] as CalendarProvider[]).map((provider) => { const connection = connections.data?.find((item) => item.provider === provider && item.status === "ACTIVE"); const configured = providerConfiguration.data?.find((item) => item.provider === provider)?.configured === true; return <li key={provider} className="rounded-lg border border-line p-3"><div className="flex items-center justify-between gap-2"><p className="min-w-0 truncate font-medium text-ink-1">{provider === "GOOGLE" ? "Google Calendar / Meet" : provider === "MICROSOFT" ? "Outlook / Teams" : "Zoom"}</p><StatusBadge tone={connection ? "success" : configured ? "neutral" : "warning"} label={connection ? "Conectado" : configured ? t("interviews.readyToAuthorize") : t("interviews.setupRequired")} /></div><p className="mt-1 truncate text-xs text-ink-3">{connection?.externalEmail || (configured ? t("interviews.authorizeAccount") : t("interviews.missingCredentials"))}</p>{connection ? <Button className="mt-3" size="sm" variant="ghost" disabled={disconnect.isPending} onClick={() => void confirmAction({ title: `¿Desconectar ${provider === "GOOGLE" ? "Google Calendar" : provider === "MICROSOFT" ? "Outlook" : "Zoom"}?`, description: "Las entrevistas futuras dejarán de aparecer en ese calendario.", consequence: "Los eventos ya creados se quedan donde están, pero no se actualizan si se reprograma ni se borran si se cancela. Volver a conectar exige autorizar la cuenta otra vez.", confirmLabel: "Desconectar el calendario" }).then((ok) => ok && disconnect.mutate(provider))}>Desconectar</Button> : <Button className="mt-3" size="sm" variant="secondary" onClick={() => connectCalendar.mutate(provider)} disabled={!configured || providerConfiguration.isLoading || connectCalendar.isPending}><Link2 className="size-4" />{configured ? "Conectar" : t("interviews.unavailable")}</Button>}</li>; })}</ul><Button variant="secondary" onClick={() => { setAvailabilityForm(availabilitySettings.data ?? defaultAvailability); setAvailabilityOpen(true); }}><Clock3 className="size-4" />Configurar mi disponibilidad</Button></div>
    </details>

    <details className="group rounded-lg border border-line bg-surface-1">
      <summary className="flex min-h-[var(--control-h-touch)] cursor-pointer list-none items-center gap-3 px-4 py-3 sm:px-5 [&::-webkit-details-marker]:hidden"><Users className="size-5 shrink-0 text-ink-3" aria-hidden="true" /><span className="min-w-0 flex-1"><span className="block text-base font-semibold text-ink-1">{t("interviews.coordination")}</span><span className="block truncate text-sm text-ink-2">{t("interviews.coordinationHint")}</span></span><ChevronDown className="size-5 shrink-0 text-ink-3 transition-transform group-open:rotate-180" aria-hidden="true" /></summary>
      <div className="border-t border-line p-4 sm:p-5"><InterviewCoordinationConsole /></div>
    </details>
    <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}><DialogContent className="max-h-[92dvh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]"><DialogHeader><DialogTitle>{t("interviews.schedule")}</DialogTitle><DialogDescription>{t("interviews.scheduleBody")}</DialogDescription></DialogHeader><div className="grid gap-4"><SelectField label={t("interviews.coordinationMode")} value={scheduleMode} onValueChange={(value) => setScheduleMode(value as "DIRECT" | "SELF_SERVICE")} options={[{ value: "DIRECT", label: t("interviews.direct") }, { value: "SELF_SERVICE", label: t("interviews.selfService") }]} /><SelectField label="Candidatura" value={form.applicationId} onValueChange={(value) => setForm({ ...form, applicationId: value })} options={candidates.map((item) => ({ value: item.id, label: `${item.candidate.fullName} · ${item.vacancy.title}` }))} /><SelectField label={t("interviews.leadInterviewer")} value={form.interviewerUserId} onValueChange={(value) => { setForm({ ...form, interviewerUserId: value }); setAvailabilityRequested(false); }} options={tenantUsers.map((user) => ({ value: user.id, label: `${user.fullName} · ${user.role}` }))} /><SelectField label={t("interviews.substituteGroup")} value={form.poolId ?? "NONE"} onValueChange={(value) => setForm({ ...form, poolId: value === "NONE" ? undefined : value })} options={[{ value: "NONE", label: t("interviews.noGroup") }, ...(pools.data ?? []).map((pool) => ({ value: pool.id, label: pool.name }))]} /><fieldset className="rounded-xl border p-3"><legend className="px-1 text-sm font-medium">{t("interviews.panelists")}</legend><div className="grid max-h-32 gap-2 overflow-y-auto sm:grid-cols-2">{tenantUsers.filter((user) => user.id !== form.interviewerUserId).map((user) => <label key={user.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.participantUserIds?.includes(user.id) ?? false} onChange={(event) => setForm({ ...form, participantUserIds: event.target.checked ? [...(form.participantUserIds ?? []), user.id] : (form.participantUserIds ?? []).filter((id) => id !== user.id) })} />{user.fullName}</label>)}</div></fieldset><fieldset className="rounded-xl border p-3"><legend className="px-1 text-sm font-medium">{t("interviews.shadowing")}</legend><div className="grid max-h-28 gap-2 overflow-y-auto sm:grid-cols-2">{tenantUsers.filter((user) => user.id !== form.interviewerUserId && !form.participantUserIds?.includes(user.id)).map((user) => <label key={user.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.shadowUserIds?.includes(user.id) ?? false} onChange={(event) => setForm({ ...form, shadowUserIds: event.target.checked ? [...(form.shadowUserIds ?? []), user.id] : (form.shadowUserIds ?? []).filter((id) => id !== user.id) })} />{user.fullName}</label>)}</div></fieldset>{resources.data?.length ? <fieldset className="rounded-xl border p-3"><legend className="px-1 text-sm font-medium">{t("interviews.roomsAndResources")}</legend><div className="grid gap-2 sm:grid-cols-2">{resources.data.map((resource) => <label key={resource.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.resourceIds?.includes(resource.id) ?? false} onChange={(event) => setForm({ ...form, resourceIds: event.target.checked ? [...(form.resourceIds ?? []), resource.id] : (form.resourceIds ?? []).filter((id) => id !== resource.id) })} />{resource.name} · {technicalLabel(resource.type)}</label>)}</div></fieldset> : null}<Field label={t("interviews.titleField")} value={form.title} onChange={(value) => setForm({ ...form, title: value })} /><SelectField label={t("interviews.type")} value={form.type} onValueChange={(value) => setForm({ ...form, type: value as ApplicationInterviewType })} options={[{ value: "VIRTUAL", label: t("interviews.type.VIRTUAL") }, { value: "PRESENTIAL", label: t("interviews.type.PRESENTIAL") }, { value: "PHONE", label: t("interviews.type.PHONE") }]} /><SelectField label={t("interviews.calendar")} value={form.calendarProvider ?? "NONE"} onValueChange={(value) => setForm({ ...form, calendarProvider: value === "NONE" ? undefined : value as CalendarProvider, videoProvider: value === "NONE" && form.videoProvider !== "ZOOM" ? "NONE" : form.videoProvider })} options={[{ value: "NONE", label: t("interviews.atsOnly") }, { value: "GOOGLE", label: "Google Calendar" }, { value: "MICROSOFT", label: "Microsoft Outlook" }]} /><SelectField label={t("interviews.videoCall")} value={form.videoProvider ?? "NONE"} onValueChange={(value) => { const videoProvider = value as VideoConferenceProvider; setForm({ ...form, videoProvider, calendarProvider: videoProvider === "GOOGLE_MEET" ? "GOOGLE" : videoProvider === "MICROSOFT_TEAMS" ? "MICROSOFT" : form.calendarProvider }); }} options={[{ value: "NONE", label: t("interviews.noVideo") }, { value: "GOOGLE_MEET", label: "Google Meet" }, { value: "MICROSOFT_TEAMS", label: "Microsoft Teams" }, { value: "ZOOM", label: "Zoom" }, { value: "MANUAL", label: t("interviews.manualLink") }]} /><Field label={t("interviews.timezone")} value={form.timezone} onChange={(value) => setForm({ ...form, timezone: value })} /><Field label={scheduleMode === "SELF_SERVICE" ? t("interviews.windowStart") : t("interviews.start")} type="datetime-local" value={form.startsAt} onChange={(value) => { setForm({ ...form, startsAt: localDateTimeToIso(value) }); setAvailabilityRequested(false); }} /><Field label={scheduleMode === "SELF_SERVICE" ? t("interviews.sessionUntil") : t("interviews.end")} type="datetime-local" value={form.endsAt} onChange={(value) => { setForm({ ...form, endsAt: localDateTimeToIso(value) }); setAvailabilityRequested(false); }} />{form.videoProvider === "MANUAL" ? <Field label={t("interviews.meetingLink")} type="url" value={form.meetingUrl ?? ""} onChange={(value) => setForm({ ...form, meetingUrl: value })} /> : null}{scheduleMode === "DIRECT" ? <><Button variant="secondary" onClick={() => setAvailabilityRequested(true)} disabled={!form.interviewerUserId || !form.startsAt || !form.endsAt}><CalendarPlus className="size-4" />{t("interviews.checkAvailability")}</Button>{availability.isFetching ? <p className="text-sm text-text-secondary">{t("interviews.checkingAvailability")}</p> : null}{availability.data ? <div className="space-y-2 rounded-xl bg-surface-section p-3"><p className="text-sm font-medium">{availability.data.slots.length} horarios disponibles</p><div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto">{availability.data.slots.slice(0, 12).map((slot) => <Button key={slot.startsAt} size="sm" variant={form.startsAt === slot.startsAt ? "default" : "secondary"} onClick={() => setForm({ ...form, startsAt: slot.startsAt, endsAt: slot.endsAt })}>{new Date(slot.startsAt).toLocaleString("es", { dateStyle: "short", timeStyle: "short" })}</Button>)}</div></div> : null}<div className="space-y-3 rounded-xl border p-3"><div className="flex items-center justify-between"><p className="text-sm font-medium">{t("interviews.sequence")}</p><Button size="sm" variant="secondary" onClick={() => setExtraRounds([...extraRounds, { title: `Ronda ${extraRounds.length + 2}`, startsAt: "", endsAt: "" }])}><Plus className="size-4" />{t("interviews.round")}</Button></div>{extraRounds.map((round, index) => <div key={index} className="grid gap-2 sm:grid-cols-3"><Input value={round.title} onChange={(event) => setExtraRounds(extraRounds.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item))} /><Input type="datetime-local" value={toLocalDateTimeValue(round.startsAt)} onChange={(event) => setExtraRounds(extraRounds.map((item, itemIndex) => itemIndex === index ? { ...item, startsAt: localDateTimeToIso(event.target.value) } : item))} /><Input type="datetime-local" value={toLocalDateTimeValue(round.endsAt)} onChange={(event) => setExtraRounds(extraRounds.map((item, itemIndex) => itemIndex === index ? { ...item, endsAt: localDateTimeToIso(event.target.value) } : item))} /></div>)}</div></> : <InlineFeedback tone="info" title={t("interviews.tempLink")}>{t("interviews.tempLinkBody")}</InlineFeedback>}{availability.isError ? <InlineFeedback tone="danger" title={t("interviews.availabilityError")}>{getApiErrorMessage(availability.error, "Intenta nuevamente.")}</InlineFeedback> : null}<Button onClick={() => schedule.mutate(form)} disabled={!form.applicationId || !form.interviewerUserId || !form.startsAt || !form.endsAt || schedule.isPending || extraRounds.some((round) => !round.startsAt || !round.endsAt) || (form.videoProvider === "MANUAL" && !form.meetingUrl)}>{schedule.isPending ? t("interviews.processing") : scheduleMode === "SELF_SERVICE" ? t("interviews.createAndSendLink") : extraRounds.length ? t("interviews.scheduleSequence") : t("interviews.confirm")}</Button>{schedule.isError ? <InlineFeedback tone="danger" title={t("interviews.scheduleError")}>{getApiErrorMessage(schedule.error, t("interviews.scheduleErrorBody"))}</InlineFeedback> : null}</div></DialogContent></Dialog>
    <ScorecardDialog interviewId={scoreInterviewId} onClose={() => setScoreInterviewId("")} />
    <Dialog open={Boolean(editingInterview)} onOpenChange={(open) => !open && setEditingInterview(null)}><DialogContent><DialogHeader><DialogTitle>{t("interviews.rescheduleOrCancel")}</DialogTitle><DialogDescription>{t("interviews.rescheduleBody")}</DialogDescription></DialogHeader><div className="space-y-4"><Field label="Nuevo inicio" type="datetime-local" value={reschedule.startsAt} onChange={(value) => setReschedule((current) => ({ ...current, startsAt: localDateTimeToIso(value) }))} /><Field label="Nuevo fin" type="datetime-local" value={reschedule.endsAt} onChange={(value) => setReschedule((current) => ({ ...current, endsAt: localDateTimeToIso(value) }))} />{updateInterview.isError ? <InlineFeedback tone="danger" title={t("interviews.updateError")}>{getApiErrorMessage(updateInterview.error, t("interviews.checkDates"))}</InlineFeedback> : null}<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between"><Button
                variant="destructive"
                disabled={updateInterview.isPending}
                onClick={() =>
                  editingInterview &&
                  void confirmAction({
                    title: `¿Cancelar «${editingInterview.title}»?`,
                    description: `${editingInterview.application?.candidate.fullName ?? "La persona candidata"} y el panel recibirán el aviso de cancelación.`,
                    consequence:
                      "Se libera la sala reservada y se borra el evento del calendario conectado. Reprogramar exige volver a coordinar con todo el panel: si solo cambia la hora, usa «Confirmar nueva fecha» en vez de cancelar.",
                    confirmLabel: "Cancelar la entrevista",
                    irreversible: true,
                  }).then((ok) => ok && updateInterview.mutate({ id: editingInterview.id, input: { status: "CANCELED" } }))
                }
              ><CalendarX className="size-4" />{t("interviews.cancel")}</Button><Button onClick={() => editingInterview && updateInterview.mutate({ id: editingInterview.id, input: reschedule })} disabled={updateInterview.isPending || !reschedule.startsAt || !reschedule.endsAt}>{updateInterview.isPending ? "Actualizando…" : t("interviews.confirmNewDate")}</Button></div></div></DialogContent></Dialog>
    <Dialog open={availabilityOpen} onOpenChange={setAvailabilityOpen}><DialogContent><DialogHeader><DialogTitle>{t("interviews.myAvailability")}</DialogTitle><DialogDescription>{t("interviews.availabilityBody")}</DialogDescription></DialogHeader><div className="space-y-4"><Field label={t("interviews.timezone")} value={availabilityForm.timezone} onChange={(timezone) => setAvailabilityForm((current) => ({ ...current, timezone }))} /><div className="grid gap-3">{weekdays.map(([day, label]) => { const range = availabilityForm.weeklySchedule[day]?.[0]; return <div key={day} className="grid items-center gap-2 rounded-xl border border-border-default p-3 sm:grid-cols-[110px_1fr_1fr]"><label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={Boolean(range)} onChange={(event) => setAvailabilityForm((current) => ({ ...current, weeklySchedule: { ...current.weeklySchedule, [day]: event.target.checked ? [{ start: "09:00", end: "17:00" }] : [] } }))} />{label}</label><Input aria-label={`Inicio ${label}`} type="time" value={range?.start ?? "09:00"} disabled={!range} onChange={(event) => setAvailabilityForm((current) => ({ ...current, weeklySchedule: { ...current.weeklySchedule, [day]: [{ start: event.target.value, end: range?.end ?? "17:00" }] } }))} /><Input aria-label={`Fin ${label}`} type="time" value={range?.end ?? "17:00"} disabled={!range} onChange={(event) => setAvailabilityForm((current) => ({ ...current, weeklySchedule: { ...current.weeklySchedule, [day]: [{ start: range?.start ?? "09:00", end: event.target.value }] } }))} /></div>; })}</div><div className="grid gap-3 sm:grid-cols-2"><Field label={t("interviews.buffer")} type="number" value={String(availabilityForm.bufferMinutes)} onChange={(value) => setAvailabilityForm((current) => ({ ...current, bufferMinutes: Number(value) }))} /><Field label={t("interviews.minNotice")} type="number" value={String(availabilityForm.minNoticeHours)} onChange={(value) => setAvailabilityForm((current) => ({ ...current, minNoticeHours: Number(value) }))} /></div>{saveAvailability.isError ? <InlineFeedback tone="danger" title={t("interviews.saveError")}>{getApiErrorMessage(saveAvailability.error, t("interviews.checkSchedules"))}</InlineFeedback> : null}<Button className="w-full" onClick={() => saveAvailability.mutate(availabilityForm)} disabled={saveAvailability.isPending}>{saveAvailability.isPending ? "Guardando…" : t("interviews.saveAvailability")}</Button></div></DialogContent></Dialog>
  </div>;
}

function sentenceCase(value: string) {
  return value.charAt(0).toLocaleUpperCase("es") + value.slice(1);
}

function localDateTimeToIso(value: string) {
  return value ? new Date(value).toISOString() : "";
}

function toLocalDateTimeValue(value: string) {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { const id = label.toLowerCase().replace(/\W+/g, "-"); return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} type={type} value={type === "datetime-local" ? toLocalDateTimeValue(value) : value} onChange={(event) => onChange(type === "datetime-local" ? localDateTimeToIso(event.target.value) : event.target.value)} /></div>; }
function SelectField({ label, value, onValueChange, options }: { label: string; value: string; onValueChange: (value: string) => void; options: Array<{ value: string; label: string }> }) { return <label className="block space-y-2"><span className="text-sm font-medium text-foreground">{label}</span><Select value={value} onValueChange={onValueChange}><SelectTrigger><SelectValue placeholder={`Selecciona ${label.toLowerCase()}`} /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></label>; }
function Summary({ label, value }: { label: string; value?: string | null }) {
  const { t } = useLocale();
  return <div className="min-w-0"><dt className="text-xs text-ink-3">{label}</dt><dd className="truncate text-ink-1">{value || t("interviews.undefined")}</dd></div>; }
// No es un componente: recibe la funcion de traduccion de quien la llama.
function calendarSyncLabel(status: RecruitmentInterviewDto["calendarSyncStatus"], t: (key: string) => string) {
  const keys: Record<string, string> = { NOT_CONNECTED: "interviews.atsOnlyShort", PENDING: "interviews.sync.PENDING", SYNCED: "interviews.sync.SYNCED", FAILED: "interviews.calendarError", CANCELLED: "interviews.sync.CANCELLED" };
  return keys[status] ? t(keys[status]) : status;
}

const INTERVIEW_TONE: Record<string, Tone> = { SCHEDULED: "progress", CONFIRMED: "success", COMPLETED: "success", CANCELED: "danger", NO_SHOW: "danger" };
const PARTICIPANT_ICON: Record<string, { icon: typeof CircleCheck; className: string }> = {
  ACCEPTED: { icon: CircleCheck, className: "text-status-success" },
  PENDING: { icon: Clock3, className: "text-status-warning" },
  DECLINED: { icon: CircleX, className: "text-status-danger" },
  SUBSTITUTED: { icon: CircleX, className: "text-ink-3" },
};

/**
 * Una entrevista en la agenda.
 *
 * Lo que se ve sin abrir nada: quién es la persona candidata y para qué
 * vacante, cuándo es (fecha completa, en su zona horaria), en qué estado está
 * y quién forma el panel con icono por respuesta. El botón principal es
 * «Abrir videollamada» si hay enlace; después evaluar y reprogramar.
 *
 * Antes la tarjeta llevaba dos insignias técnicas, seis datos en rejilla
 * (zona horaria, etapa, proveedor de calendario, videollamada…), las
 * insignias del panel con rol y estado en texto, y cuatro botones al mismo
 * nivel. Todo eso sigue disponible en «Más», y el error de sincronización se
 * sigue mostrando arriba, porque ese sí exige hacer algo.
 */
function InterviewCard({ interview, canScore, canSchedule, busy, onScore, onReschedule, onDownload, onRetrySync }: { interview: RecruitmentInterviewDto; canScore: boolean; canSchedule: boolean; busy: boolean; onScore: () => void; onReschedule: () => void; onDownload: () => void; onRetrySync: () => void }) {
  const { t } = useLocale();
  const tone = INTERVIEW_TONE[interview.status] ?? "neutral";
  const editable = canSchedule && interview.status !== "CANCELED" && interview.status !== "COMPLETED";
  const start = new Date(interview.startsAt);
  const title = interview.application?.candidate.fullName ?? interview.title;
  const subtitle = [interview.application?.vacancy.title, interview.sequence ? `${interview.sequence.title} · ${interview.sequenceOrder! + 1}. ${interview.title}` : interview.title].filter(Boolean).join(" · ");
  const lead = interview.interviewer ? `${interview.interviewer.firstName} ${interview.interviewer.lastName}` : null;
  const modality = [technicalLabel(interview.type), interview.videoProvider && interview.videoProvider !== "NONE" ? technicalLabel(interview.videoProvider) : null].filter(Boolean).join(" · ");

  return (
    <li className={cn("flex flex-col gap-4 rounded-lg border bg-surface-1 p-4 sm:p-5", interview.calendarSyncStatus === "FAILED" ? "border-status-danger/50" : "border-line")}>
      <div className="flex flex-wrap items-start gap-3">
        <Avatar name={title} />
        <div className="min-w-0 flex-1 basis-40">
          <h3 className="line-clamp-2 break-words text-base font-semibold leading-snug text-ink-1">{title}</h3>
          <p className="line-clamp-2 text-sm text-ink-2">{subtitle}</p>
        </div>
        <div className="order-last basis-full sm:order-none sm:basis-auto sm:shrink-0"><StatusBadge tone={tone} label={technicalLabel(interview.status)} /></div>
      </div>

      <div className="flex items-start gap-3 rounded-md bg-surface-2 p-3">
        <CalendarDays className="mt-0.5 size-5 shrink-0 text-accent-ink" aria-hidden="true" />
        <div className="min-w-0">
          <p className="font-medium text-ink-1">{sentenceCase(start.toLocaleString("es", { timeZone: interview.timezone, dateStyle: "full" }))}</p>
          <p className="text-sm text-ink-2">{start.toLocaleString("es", { timeZone: interview.timezone, timeStyle: "short" })} – {new Date(interview.endsAt).toLocaleString("es", { timeZone: interview.timezone, timeStyle: "short" })} · {modality}</p>
        </div>
      </div>

      <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 [&>div]:min-w-0">
        {lead ? <div><dt className="text-xs text-ink-3">{t("interviews.lead")}</dt><dd className="truncate text-ink-1">{lead}</dd></div> : null}
        {interview.participants?.length ? <div className="sm:col-span-2"><dt className="text-xs text-ink-3">{t("interviews.panel")}</dt><dd><ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">{interview.participants.map((item) => { const state = PARTICIPANT_ICON[item.status] ?? PARTICIPANT_ICON.PENDING; const Icon = state.icon; return <li key={item.id} className="inline-flex items-center gap-1.5 text-ink-1"><Icon className={cn("size-4 shrink-0", state.className)} aria-hidden="true" />{item.user.firstName} {item.user.lastName}<span className="sr-only">, {technicalLabel(item.status)}</span></li>; })}</ul></dd></div> : null}
      </dl>

      {interview.calendarSyncError ? <InlineFeedback tone="danger" title={t("interviews.syncPending")}>{interview.calendarSyncError}</InlineFeedback> : null}
      {interview.scorecards?.length ? <ul className="space-y-1 rounded-md border border-line px-3 py-2 text-sm" aria-label={t("interviews.scorecards")}>{interview.scorecards.map((item) => <li key={item.id} className="flex items-center gap-2"><Star className="size-4 shrink-0 text-status-warning" aria-hidden="true" /><strong className="tabular-nums">{item.overallRating}/5</strong><span className="text-ink-2">· {technicalLabel(item.recommendation)} · {item.reviewer?.firstName} {item.reviewer?.lastName}</span></li>)}</ul> : null}

      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
        {interview.meetingUrl && interview.status !== "CANCELED" && interview.status !== "COMPLETED" ? <Button asChild><a href={interview.meetingUrl} target="_blank" rel="noreferrer"><Link2 className="size-4" />{t("interviews.openCall")}</a></Button> : null}
        {canScore ? <Button variant="secondary" onClick={onScore}><Star className="size-4" />{t("interviews.fillScorecard")}</Button> : null}
        {editable ? <Button variant="secondary" onClick={onReschedule}><Clock3 className="size-4" />{t("interviews.reschedule")}</Button> : null}
        {interview.calendarSyncStatus === "FAILED" ? <Button variant="secondary" onClick={onRetrySync} disabled={busy}><RefreshCw className="size-4" />{t("interviews.retrySync")}</Button> : null}
        <details className="group ml-auto basis-full sm:basis-auto">
          <summary className="inline-flex min-h-[var(--control-h-base)] cursor-pointer list-none items-center gap-1 text-sm font-medium text-ink-2 hover:text-ink-1 [&::-webkit-details-marker]:hidden"><span className="group-open:hidden">{t("interviews.more")}</span><span className="hidden group-open:inline">{t("interviews.less")}</span></summary>
          <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 [&>div]:min-w-0">
            <Summary label={t("interviews.timezone")} value={interview.timezone} />
            <Summary label={t("interviews.stage")} value={interview.stage?.name} />
            <Summary label={t("interviews.calendar")} value={interview.calendarProvider ? `${technicalLabel(interview.calendarProvider)} · ${calendarSyncLabel(interview.calendarSyncStatus, t)}` : t("interviews.atsIcsOnly")} />
            {interview.resourceBookings?.length ? <Summary label={t("interviews.resources")} value={interview.resourceBookings.map((item) => item.resource.name).join(", ")} /> : null}
            {interview.participants?.length ? <div className="sm:col-span-2"><dt className="text-xs text-ink-3">{t("interviews.panel")}</dt><dd className="text-ink-1">{interview.participants.map((item) => `${item.user.firstName} ${item.user.lastName} · ${technicalLabel(item.role)} · ${technicalLabel(item.status)}`).join("; ")}</dd></div> : null}
          </dl>
          <Button className="mt-3" variant="ghost" size="sm" onClick={onDownload} disabled={busy}><Download className="size-4" />{t("interviews.downloadIcs")}</Button>
        </details>
      </div>
    </li>
  );
}
