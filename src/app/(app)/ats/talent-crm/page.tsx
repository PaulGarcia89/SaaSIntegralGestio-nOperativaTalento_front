"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, CircleAlert, History, MailCheck, Merge, NotebookPen, Plus, Search, ShieldCheck, Tags, UserRoundSearch, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { AsyncState } from "@/components/async-state";
import { InlineFeedback, PageHeader, Pagination } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  addCandidateToTalentPool,
  addTalentTag,
  createTalentActivity,
  createTalentPool,
  createTalentTag,
  fetchDuplicateCandidates,
  fetchTalentCandidates,
  fetchTalentPools,
  fetchTalentTags,
  fetchTalentCampaigns,
  fetchTalentCampaignAudience,
  fetchTalentSegments,
  mergeTalentCandidates,
  createTalentCampaign,
  prepareTalentCampaignAudience,
  reviewTalentCampaignAudience,
} from "@/lib/backend";
import type { DuplicateCandidateMatchDto, TalentCampaignDto, TalentCandidateDto, TalentActivityType } from "@/lib/contracts";
import { useAppStore } from "@/store/app-store";
import { useLocale } from "@/components/locale-provider";

const ALL = "ALL";

export default function TalentCrmPage() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { currentBranch } = useAppStore();
  const [view, setView] = useState<"crm" | "duplicates" | "campaigns">("crm");
  const [search, setSearch] = useState("");
  const [poolId, setPoolId] = useState(ALL);
  const [tagId, setTagId] = useState(ALL);
  const [page, setPage] = useState(1);
  const [poolOpen, setPoolOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const [activityCandidate, setActivityCandidate] = useState<TalentCandidateDto | null>(null);
  const [mergeMatch, setMergeMatch] = useState<DuplicateCandidateMatchDto | null>(null);

  const filters = { search: search || undefined, poolId: poolId === ALL ? undefined : poolId, tagId: tagId === ALL ? undefined : tagId, branchId: currentBranch?.id, page, pageSize: 20 };
  const candidates = useQuery({ queryKey: ["talent-crm", "candidates", filters], queryFn: () => fetchTalentCandidates(filters), enabled: view === "crm" });
  const pools = useQuery({ queryKey: ["talent-crm", "pools"], queryFn: fetchTalentPools });
  const tagsQuery = useQuery({ queryKey: ["talent-crm", "tags"], queryFn: fetchTalentTags });
  // Se consulta siempre, no solo dentro de su pestaña. Antes la tarjeta mostraba
  // la palabra "Revisar" en lugar de un número, así que había que hacer clic
  // para saber si valía la pena hacer clic.
  const duplicates = useQuery({ queryKey: ["talent-crm", "duplicates"], queryFn: () => fetchDuplicateCandidates(45) });
  const campaigns = useQuery({ queryKey: ["talent-crm", "campaigns"], queryFn: fetchTalentCampaigns, enabled: view === "campaigns" });

  async function refreshCrm() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["talent-crm"] }),
      queryClient.invalidateQueries({ queryKey: ["applications"] }),
    ]);
  }

  const addPool = useMutation({ mutationFn: ({ candidateId, selectedPoolId }: { candidateId: string; selectedPoolId: string }) => addCandidateToTalentPool(selectedPoolId, candidateId), onSuccess: async () => { toast.success(t("talent.addedToList")); await refreshCrm(); }, onError: (error: unknown) => showError(error, t("talent.operationFailed")) });
  const addTag = useMutation({ mutationFn: ({ candidateId, selectedTagId }: { candidateId: string; selectedTagId: string }) => addTalentTag(candidateId, selectedTagId), onSuccess: async () => { toast.success(t("talent.tagAdded")); await refreshCrm(); }, onError: (error: unknown) => showError(error, t("talent.operationFailed")) });

  const meta = candidates.data?.meta;
  return <div className="space-y-6">
    <PageHeader eyebrow="Reclutamiento" title={t("talent.title")} description={t("talent.description")} actions={<div className="flex gap-2"><Button variant="secondary" onClick={() => setTagOpen(true)}><Tags className="size-4" />{t("talent.newTag")}</Button><Button onClick={() => setPoolOpen(true)}><Plus className="size-4" />{t("talent.newList")}</Button></div>} />
    <section className="grid gap-4 md:grid-cols-3">
      <Metric icon={<UsersRound className="size-5" />} label="Talento visible" value={meta?.total ?? "—"} detail={currentBranch?.name ?? "Alcance de empresa"} />
      <Metric icon={<Tags className="size-5" />} label="Listas activas" value={pools.data?.filter((item) => item.isActive).length ?? "—"} detail="Grupos que puedes reutilizar" />
      <Metric icon={<UserRoundSearch className="size-5" />} label="Posibles duplicados" value={duplicates.isLoading ? "…" : duplicates.data?.data.length ?? 0} detail={duplicates.isSuccess && !duplicates.data.data.length ? "No encontramos personas repetidas" : "Nunca se unen solas: tú decides"} />
    </section>
    <div className="flex w-fit rounded-xl border border-border-default bg-surface-elevated p-1">
      <Button variant={view === "crm" ? "default" : "ghost"} size="sm" onClick={() => setView("crm")}><UsersRound className="size-4" />{t("talent.title")}</Button>
      <Button variant={view === "duplicates" ? "default" : "ghost"} size="sm" onClick={() => setView("duplicates")}><Merge className="size-4" />Duplicados</Button>
      <Button variant={view === "campaigns" ? "default" : "ghost"} size="sm" onClick={() => setView("campaigns")}><MailCheck className="size-4" />{t("talent.campaigns")}</Button>
    </div>

    {view === "crm" ? <>
      <section aria-label={t("talent.filtersAria")} className="grid gap-3 rounded-2xl border border-border-default bg-surface-elevated p-4 md:grid-cols-3">
        <label className="space-y-1.5 text-sm font-medium">{t("talent.search")}<div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} className="pl-9" placeholder={t("talent.searchPlaceholder")} /></div></label>
        <label className="space-y-1.5 text-sm font-medium">{t("talent.list")}<Select value={poolId} onValueChange={(value) => { setPoolId(value); setPage(1); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>{t("talent.allLists")}</SelectItem>{pools.data?.filter((item) => item.isActive).map((pool) => <SelectItem key={pool.id} value={pool.id}>{pool.name} · {pool.memberCount ?? 0}</SelectItem>)}</SelectContent></Select></label>
        <label className="space-y-1.5 text-sm font-medium">Etiqueta<Select value={tagId} onValueChange={(value) => { setTagId(value); setPage(1); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>{t("talent.allTags")}</SelectItem>{tagsQuery.data?.filter((item) => item.isActive).map((tag) => <SelectItem key={tag.id} value={tag.id}>{tag.name}</SelectItem>)}</SelectContent></Select></label>
      </section>
      {candidates.isLoading ? <AsyncState state="loading" title={t("talent.preparing")} /> : null}
      {candidates.isError ? <AsyncState state="error" title={t("talent.loadError")} onRetry={() => void candidates.refetch()} /> : null}
      {candidates.isSuccess && !candidates.data.data.length ? (
        search || poolId !== ALL || tagId !== ALL
          ? <InlineFeedback tone="info" title={t("talent.noMatches")}>{t("talent.noMatchesHelp")}</InlineFeedback>
          : <InlineFeedback tone="info" title={`Todavía no hay nadie en ${currentBranch?.name ?? "esta sucursal"}`}>{t("talent.emptyHelp")}</InlineFeedback>
      ) : null}
      <div className="grid gap-4 xl:grid-cols-2">{candidates.data?.data.map((candidate) => <CandidateCard key={candidate.id} candidate={candidate} pools={pools.data ?? []} tags={tagsQuery.data ?? []} onAddPool={(selectedPoolId) => addPool.mutate({ candidateId: candidate.id, selectedPoolId })} onAddTag={(selectedTagId) => addTag.mutate({ candidateId: candidate.id, selectedTagId })} onActivity={() => setActivityCandidate(candidate)} />)}</div>
      {meta && meta.totalPages > 0 ? <Pagination page={meta.page - 1} totalPages={meta.totalPages} totalItems={meta.total} pageSize={meta.pageSize} onPageChange={(next) => setPage(next + 1)} /> : null}
    </> : view === "duplicates" ? <DuplicateQueue query={duplicates} onMerge={setMergeMatch} /> : <CampaignQueue campaigns={campaigns} onChanged={refreshCrm} />}

    <CreatePoolDialog open={poolOpen} onOpenChange={setPoolOpen} branchId={currentBranch?.id} onCreated={refreshCrm} />
    <CreateTagDialog open={tagOpen} onOpenChange={setTagOpen} onCreated={refreshCrm} />
    <ActivityDialog candidate={activityCandidate} onOpenChange={(open) => !open && setActivityCandidate(null)} onCreated={refreshCrm} />
    <MergeDialog match={mergeMatch} onOpenChange={(open) => !open && setMergeMatch(null)} onMerged={async () => { setMergeMatch(null); await refreshCrm(); }} />
  </div>;
}

function CampaignQueue({ campaigns, onChanged }: { campaigns: ReturnType<typeof useQuery<TalentCampaignDto[]>>; onChanged: () => Promise<void> }) {
  const { t } = useLocale();
  const [selected, setSelected] = useState<TalentCampaignDto | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  if (campaigns.isLoading) return <AsyncState state="loading" title={t("talent.loadingCampaigns")} />;
  if (campaigns.isError) return <AsyncState state="error" title={t("talent.campaignsError")} onRetry={() => void campaigns.refetch()} />;
  return <div className="space-y-4"><div className="flex justify-end"><Button onClick={() => setCreateOpen(true)}><Plus className="size-4" />{t("talent.newCampaign")}</Button></div><InlineFeedback tone="info" title={t("talent.protectedSends")}>{t("talent.protectedSendsBody")}</InlineFeedback>{!campaigns.data?.length ? <InlineFeedback tone="info" title={t("talent.noCampaigns")}>{t("talent.noCampaignsBody")}</InlineFeedback> : <div className="grid gap-4 xl:grid-cols-2">{campaigns.data.map((campaign) => <Card key={campaign.id} level={2}><CardContent className="space-y-4 p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">{campaign.name}</h2><p className="text-sm text-text-secondary">{campaign.segment.name}</p></div><Badge variant={campaign.audienceReviewedAt ? "default" : "secondary"}>{campaign.audienceReviewedAt ? t("talent.audienceConfirmed") : t("talent.pendingReview")}</Badge></div><p className="line-clamp-2 text-sm text-text-secondary">{campaign.subject}</p><div className="grid grid-cols-2 gap-2 rounded-xl bg-surface-section p-3 text-sm"><div><p className="text-xs text-text-secondary">{t("talent.audienceReady")}</p><p className="font-semibold">{campaign._count.recipients || t("talent.notPrepared")}</p></div><div><p className="text-xs text-text-secondary">{t("talent.status")}</p><p className="font-semibold">{campaign.status}</p></div></div><Button className="w-full" variant="secondary" onClick={() => setSelected(campaign)}><ShieldCheck className="size-4" />{t("talent.reviewAudience")}</Button></CardContent></Card>)}</div>}<CreateCampaignDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={onChanged} /><CampaignAudienceDialog campaign={selected} onOpenChange={(open) => !open && setSelected(null)} onChanged={onChanged} /></div>;
}

function CreateCampaignDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (open: boolean) => void; onCreated: () => Promise<void> }) {
  const { t } = useLocale();
  const segments = useQuery({ queryKey: ["talent-crm", "segments"], queryFn: fetchTalentSegments, enabled: open });
  const [segmentId, setSegmentId] = useState(""); const [name, setName] = useState(""); const [subject, setSubject] = useState(""); const [body, setBody] = useState("");
  const mutation = useMutation({ mutationFn: () => createTalentCampaign({ segmentId, name, subject, body }), onSuccess: async () => { setSegmentId(""); setName(""); setSubject(""); setBody(""); onOpenChange(false); toast.success(t("talent.campaignCreated")); await onCreated(); }, onError: (error: unknown) => showError(error, t("talent.operationFailed")) });
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{t("talent.newEmailCampaign")}</DialogTitle><DialogDescription>{t("talent.campaignDraftNote")}</DialogDescription></DialogHeader><div className="space-y-4"><Select value={segmentId} onValueChange={setSegmentId}><SelectTrigger><SelectValue placeholder={t("talent.selectSegment")} /></SelectTrigger><SelectContent>{segments.data?.length ? segments.data.map((segment) => <SelectItem key={segment.id} value={segment.id}>{segment.name} · {segment.candidateCount} perfiles</SelectItem>) : <SelectItem value="none" disabled>{t("talent.noSegments")}</SelectItem>}</SelectContent></Select>{segments.data && !segments.data.length ? <p className="text-xs text-text-secondary">{t("talent.createListFirst")}</p> : null}<Input value={name} onChange={(event) => setName(event.target.value)} placeholder={t("talent.campaignName")} /><Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder={t("talent.emailSubject")} /><textarea className="min-h-32 w-full rounded-xl border border-border-default bg-surface-elevated p-3 text-base sm:text-sm" value={body} onChange={(event) => setBody(event.target.value)} placeholder={t("talent.emailBody")} /><Button className="w-full" disabled={!segmentId || name.trim().length < 2 || subject.trim().length < 2 || body.trim().length < 2 || mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? t("talent.creating") : t("talent.createCampaignDraft")}</Button></div></DialogContent></Dialog>;
}

function CampaignAudienceDialog({ campaign, onOpenChange, onChanged }: { campaign: TalentCampaignDto | null; onOpenChange: (open: boolean) => void; onChanged: () => Promise<void> }) {
  const { t } = useLocale();
  const audience = useQuery({ queryKey: ["talent-crm", "campaign-audience", campaign?.id], queryFn: () => fetchTalentCampaignAudience(campaign!.id), enabled: Boolean(campaign?.id) });
  const prepare = useMutation({ mutationFn: () => prepareTalentCampaignAudience(campaign!.id), onSuccess: async () => { toast.success(t("talent.audienceNoEmails")); await onChanged(); await audience.refetch(); }, onError: (error: unknown) => showError(error, t("talent.operationFailed")) });
  const review = useMutation({ mutationFn: () => reviewTalentCampaignAudience(campaign!.id, { confirm: true, audienceFingerprint: audience.data!.review.audienceFingerprint!, note: t("talent.manualReviewNote") }), onSuccess: async () => { toast.success(t("talent.audienceAudited")); await onChanged(); await audience.refetch(); }, onError: (error: unknown) => showError(error, t("talent.operationFailed")) });
  return <Dialog open={Boolean(campaign)} onOpenChange={onOpenChange}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{t("talent.audienceReview")}</DialogTitle><DialogDescription>{campaign?.name}. Esta pantalla no envía correos.</DialogDescription></DialogHeader><div className="space-y-4">{!audience.data?.review.audiencePreparedAt ? <InlineFeedback tone="warning" title={t("talent.audienceNotPrepared")}>{t("talent.audienceReviewBody")}</InlineFeedback> : <><div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-primary/10 p-3"><p className="text-xs text-text-secondary">{t("talent.withConsent")}</p><p className="text-xl font-semibold">{audience.data.summary.eligible}</p></div><div className="rounded-xl bg-status-warning/10 p-3"><p className="text-xs text-text-secondary">Excluidos</p><p className="text-xl font-semibold">{audience.data.summary.excluded}</p></div></div><div className="max-h-56 space-y-2 overflow-auto">{audience.data.data.map((recipient) => <div key={recipient.id} className="rounded-lg border border-border-default p-3 text-sm"><p className="font-medium">{recipient.candidate.fullName}</p><p className="text-xs text-text-secondary">{recipient.candidate.email}</p>{recipient.skipReason ? <p className="mt-1 text-xs text-status-warning">Excluido: {recipient.skipReason}</p> : <p className="mt-1 text-xs text-status-success">{t("talent.eligibleWithConsent")}</p>}</div>)}</div>{audience.data.review.audienceReviewedAt ? <InlineFeedback tone="success" title={t("talent.audienceConfirmed")}>{t("talent.reviewRecorded")}</InlineFeedback> : <Button className="w-full" disabled={!audience.data.review.audienceFingerprint || review.isPending} onClick={() => review.mutate()}><ShieldCheck className="size-4" />Confirmar audiencia revisada</Button>}</>}</div><Button className="w-full" variant="secondary" disabled={prepare.isPending} onClick={() => prepare.mutate()}>{prepare.isPending ? "Calculando…" : t("talent.prepareOrRecalc")}</Button></DialogContent></Dialog>;
}

function CandidateCard({ candidate, pools, tags, onAddPool, onAddTag, onActivity }: { candidate: TalentCandidateDto; pools: Awaited<ReturnType<typeof fetchTalentPools>>; tags: Awaited<ReturnType<typeof fetchTalentTags>>; onAddPool: (id: string) => void; onAddTag: (id: string) => void; onActivity: () => void }) {
  const { t } = useLocale();
  const availablePools = pools.filter((pool) => pool.isActive && !candidate.pools.some((item) => item.id === pool.id));
  const availableTags = tags.filter((tag) => tag.isActive && !candidate.tags.some((item) => item.id === tag.id));
  const latestApplication = candidate.applications[0];
  return <Card level={2}><CardContent className="space-y-4 p-5">
    <div className="flex items-start justify-between gap-4"><div className="min-w-0"><h2 className="truncate text-lg font-semibold">{candidate.fullName}</h2><p className="truncate text-sm text-text-secondary">{candidate.email}</p><p className="mt-1 text-xs text-text-secondary">{candidate.phone || t("talent.noPhone")} · {candidate.city || t("talent.noCity")}</p></div>{candidate.doNotContact ? <Badge variant="destructive">{t("talent.doNotContact")}</Badge> : <Badge variant="secondary">Disponible</Badge>}</div>
    <div className="flex flex-wrap gap-2">{candidate.tags.map((tag) => <span key={tag.id} className="rounded-full border px-2.5 py-1 text-xs font-medium" style={{ borderColor: tag.color ?? undefined }}>{tag.name}</span>)}{candidate.pools.map((pool) => <Badge key={pool.id} variant="outline">{pool.name}</Badge>)}{!candidate.tags.length && !candidate.pools.length ? <span className="text-xs text-text-secondary">{t("talent.noSegmentYet")}</span> : null}</div>
    <div className="grid gap-2 rounded-xl bg-surface-section p-3 text-sm sm:grid-cols-2"><div><p className="text-xs text-text-secondary">{t("talent.lastRun")}</p><p className="font-medium">{latestApplication?.vacancy.title ?? t("talent.noApplications")}</p></div><div><p className="text-xs text-text-secondary">Actividad</p><p className="font-medium">{candidate.talentActivities[0]?.subject ?? t("talent.noFollowUp")}</p></div></div>
    <div className="grid gap-2 sm:grid-cols-2"><Select onValueChange={onAddPool}><SelectTrigger aria-label={`Agregar ${candidate.fullName} a un pool`}><SelectValue placeholder={t("talent.addToList")} /></SelectTrigger><SelectContent>{availablePools.length ? availablePools.map((pool) => <SelectItem key={pool.id} value={pool.id}>{pool.name}</SelectItem>) : <SelectItem value="none" disabled>{t("talent.noListsYet")}</SelectItem>}</SelectContent></Select><Select onValueChange={onAddTag}><SelectTrigger aria-label={`Etiquetar a ${candidate.fullName}`}><SelectValue placeholder={t("talent.addTag")} /></SelectTrigger><SelectContent>{availableTags.length ? availableTags.map((tag) => <SelectItem key={tag.id} value={tag.id}>{tag.name}</SelectItem>) : <SelectItem value="none" disabled>{t("talent.noTags")}</SelectItem>}</SelectContent></Select></div>
    <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={onActivity}><NotebookPen className="size-4" />{t("talent.recordActivity")}</Button>{latestApplication ? <Button asChild variant="ghost"><Link href={`/ats/candidates/${latestApplication.id}`}>{t("talent.openRecord")}<History className="size-4" /></Link></Button> : null}</div>
  </CardContent></Card>;
}

function DuplicateQueue({ query, onMerge }: { query: ReturnType<typeof useQuery<{ data: DuplicateCandidateMatchDto[]; scannedCandidates: number; truncated: boolean; ignoredSharedValues: number }>>; onMerge: (match: DuplicateCandidateMatchDto) => void }) {
  const { t } = useLocale();
  if (query.isLoading) return <AsyncState state="loading" title="Comparando identidades" />;
  if (query.isError) return <AsyncState state="error" title={t("talent.duplicatesError")} onRetry={() => void query.refetch()} />;
  if (!query.data?.data.length) return <InlineFeedback tone="success" title={t("talent.noDuplicates")}>Se analizaron {query.data?.scannedCandidates ?? 0} perfiles activos.</InlineFeedback>;
  return <div className="space-y-4"><InlineFeedback tone="info" title={`${query.data.data.length} coincidencias para revisión`}>El puntaje combina teléfono, LinkedIn, CV, nombre, correo y ciudad. Los valores compartidos por más de dos perfiles se excluyen automáticamente.{query.data.ignoredSharedValues ? ` Se ignoraron ${query.data.ignoredSharedValues} valores repetidos.` : ""} La decisión siempre requiere confirmación humana.</InlineFeedback>{query.data.truncated ? <InlineFeedback tone="warning" title={t("talent.partialAnalysis")}>{t("talent.partialAnalysisBody")}</InlineFeedback> : null}<div className="grid gap-4 xl:grid-cols-2">{query.data.data.map((match) => <Card key={match.id} level={2}><CardContent className="space-y-4 p-5"><div className="flex items-center justify-between"><Badge variant={match.score >= 75 ? "destructive" : "secondary"}>{match.score}% coincidencia</Badge>{match.conflictingVacancyIds.length ? <span className="flex items-center gap-1 text-xs font-medium text-status-warning"><CircleAlert className="size-4" />{t("talent.vacancyConflict")}</span> : null}</div><div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr]"><Identity candidate={match.source} /><ArrowRightLeft className="m-auto size-5 text-text-secondary" /><Identity candidate={match.target} /></div><div className="flex flex-wrap gap-2">{match.signals.map((signal) => <Badge key={signal} variant="outline">{signal}</Badge>)}</div><Button className="w-full" disabled={Boolean(match.conflictingVacancyIds.length)} onClick={() => onMerge(match)}><Merge className="size-4" />{t("talent.reviewAndMerge")}</Button>{match.conflictingVacancyIds.length ? <p className="text-xs text-text-secondary">{t("talent.resolveFirst")}</p> : null}</CardContent></Card>)}</div></div>;
}

function Identity({ candidate }: { candidate: DuplicateCandidateMatchDto["source"] }) {
  const { t } = useLocale();
  return <div className="min-w-0 rounded-xl bg-surface-section p-3"><p className="truncate font-semibold">{candidate.fullName}</p><p className="truncate text-xs text-text-secondary">{candidate.email}</p><p className="mt-2 text-xs">{candidate.applications} procesos · {candidate.city || t("talent.noCity")}</p></div>; }

function Metric({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string | number; detail: string }) { return <Card level={2}><CardContent className="flex items-center gap-4 p-5"><span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-brand">{icon}</span><div><p className="text-sm text-text-secondary">{label}</p><p className="text-2xl font-semibold">{value}</p><p className="text-xs text-text-secondary">{detail}</p></div></CardContent></Card>; }

function CreatePoolDialog({ open, onOpenChange, branchId, onCreated }: { open: boolean; onOpenChange: (open: boolean) => void; branchId?: string; onCreated: () => Promise<void> }) {
  const { t } = useLocale();
  const [name, setName] = useState(""); const [description, setDescription] = useState("");
  const mutation = useMutation({ mutationFn: () => createTalentPool({ name, description: description || undefined, branchId }), onSuccess: async () => { setName(""); setDescription(""); onOpenChange(false); toast.success(t("talent.listCreated")); await onCreated(); }, onError: (error: unknown) => showError(error, t("talent.operationFailed")) });
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{t("talent.newTalentList")}</DialogTitle><DialogDescription>{t("talent.newListBody")}</DialogDescription></DialogHeader><div className="space-y-4"><Input value={name} onChange={(event) => setName(event.target.value)} placeholder={t("talent.listNamePlaceholder")} /><textarea className="min-h-28 w-full rounded-xl border border-border-default bg-surface-elevated p-3 text-base sm:text-sm" value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t("talent.listPurposePlaceholder")} /><Button className="w-full" disabled={name.trim().length < 2 || mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? t("talent.creating") : t("talent.createList")}</Button></div></DialogContent></Dialog>;
}

function CreateTagDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (open: boolean) => void; onCreated: () => Promise<void> }) {
  const { t } = useLocale();
  const [name, setName] = useState(""); const [color, setColor] = useState("#2563eb");
  const mutation = useMutation({ mutationFn: () => createTalentTag({ name, color }), onSuccess: async () => { setName(""); onOpenChange(false); toast.success(t("talent.tagCreated")); await onCreated(); }, onError: (error: unknown) => showError(error, t("talent.operationFailed")) });
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{t("talent.newTag")}</DialogTitle><DialogDescription>{t("talent.tagHelp")}</DialogDescription></DialogHeader><div className="space-y-4"><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. Disponible inmediatamente" /><label className="flex items-center gap-3 text-sm font-medium">Color<Input type="color" className="h-11 w-20 p-1" value={color} onChange={(event) => setColor(event.target.value)} /></label><Button className="w-full" disabled={name.trim().length < 2 || mutation.isPending} onClick={() => mutation.mutate()}>Crear etiqueta</Button></div></DialogContent></Dialog>;
}

function ActivityDialog({ candidate, onOpenChange, onCreated }: { candidate: TalentCandidateDto | null; onOpenChange: (open: boolean) => void; onCreated: () => Promise<void> }) {
  const { t } = useLocale();
  const [type, setType] = useState<TalentActivityType>("NOTE"); const [subject, setSubject] = useState(""); const [description, setDescription] = useState(""); const [dueAt, setDueAt] = useState("");
  const mutation = useMutation({ mutationFn: () => createTalentActivity(candidate!.id, { type, subject, description: description || undefined, dueAt: dueAt ? new Date(dueAt).toISOString() : undefined }), onSuccess: async () => { setSubject(""); setDescription(""); setDueAt(""); onOpenChange(false); toast.success(t("talent.activityRecorded")); await onCreated(); }, onError: (error: unknown) => showError(error, t("talent.operationFailed")) });
  return <Dialog open={Boolean(candidate)} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{t("talent.recordActivity")}</DialogTitle><DialogDescription>{candidate?.fullName}. Conserva el contexto para la próxima interacción.</DialogDescription></DialogHeader><div className="space-y-4"><Select value={type} onValueChange={(value) => setType(value as TalentActivityType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="NOTE">{t("talent.activity.NOTE")}</SelectItem><SelectItem value="CALL">{t("talent.activity.CALL")}</SelectItem><SelectItem value="EMAIL">{t("talent.activity.EMAIL")}</SelectItem><SelectItem value="MEETING">{t("talent.activity.MEETING")}</SelectItem><SelectItem value="TASK">{t("talent.activity.TASK")}</SelectItem></SelectContent></Select><Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder={t("talent.subject")} /><textarea className="min-h-28 w-full rounded-xl border border-border-default bg-surface-elevated p-3 text-base sm:text-sm" value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t("talent.activityDetails")} />{type === "TASK" ? <label className="space-y-1.5 text-sm font-medium">{t("talent.dueAt")}<Input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></label> : null}<Button className="w-full" disabled={subject.trim().length < 2 || mutation.isPending} onClick={() => mutation.mutate()}>{t("talent.saveActivity")}</Button></div></DialogContent></Dialog>;
}

function MergeDialog({ match, onOpenChange, onMerged }: { match: DuplicateCandidateMatchDto | null; onOpenChange: (open: boolean) => void; onMerged: () => Promise<void> }) {
  const { t } = useLocale();
  const [swapped, setSwapped] = useState(false); const [reason, setReason] = useState("");
  const source = swapped ? match?.target : match?.source; const target = swapped ? match?.source : match?.target;
  const mutation = useMutation({ mutationFn: () => mergeTalentCandidates({ sourceCandidateId: source!.id, targetCandidateId: target!.id, reason }), onSuccess: async (result) => { setReason(""); setSwapped(false); toast.success(t("talent.mergeDone", { applications: result.movedApplications, files: result.movedFiles })); await onMerged(); }, onError: (error: unknown) => showError(error, t("talent.operationFailed")) });
  return <Dialog open={Boolean(match)} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{t("talent.confirmMaster")}</DialogTitle><DialogDescription>{t("talent.mergeNote")}</DialogDescription></DialogHeader>{source && target ? <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr]"><div className="rounded-xl border border-status-warning/30 p-3"><p className="text-xs text-text-secondary">{t("talent.willMerge")}</p><p className="font-semibold">{source.fullName}</p><p className="truncate text-xs">{source.email}</p></div><Button size="icon" variant="ghost" aria-label={t("talent.swapMaster")} onClick={() => setSwapped((value) => !value)}><ArrowRightLeft className="size-4" /></Button><div className="rounded-xl border border-primary/40 bg-primary/5 p-3"><p className="text-xs text-text-secondary">{t("talent.masterProfile")}</p><p className="font-semibold">{target.fullName}</p><p className="truncate text-xs">{target.email}</p></div></div><div className="flex gap-3 rounded-xl bg-surface-section p-4 text-sm"><CircleAlert className="size-5 shrink-0" /><p>{t("talent.mergeWhat")}</p></div><textarea className="min-h-28 w-full rounded-xl border border-border-default bg-surface-elevated p-3 text-base sm:text-sm" value={reason} onChange={(event) => setReason(event.target.value)} placeholder={t("talent.mergeReasonPlaceholder")} /><Button className="w-full" disabled={reason.trim().length < 10 || mutation.isPending} onClick={() => mutation.mutate()}><Merge className="size-4" />{mutation.isPending ? t("talent.merging") : t("talent.mergeAudited")}</Button></div> : null}</DialogContent></Dialog>;
}

// No es un componente, asi que no puede usar el hook: recibe el texto de
// reserva ya traducido por quien la llama.
function showError(error: unknown, fallback: string) { toast.error(error instanceof Error ? error.message : fallback); }
