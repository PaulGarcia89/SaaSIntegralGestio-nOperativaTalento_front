"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, CircleAlert, History, Merge, NotebookPen, Plus, Search, Tags, UserRoundSearch, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { AsyncState } from "@/components/async-state";
import { InlineFeedback, PageHeader, Pagination } from "@/components/design-system";
import { RecruitmentWorkspaceNav } from "@/components/recruitment-workspace";
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
  mergeTalentCandidates,
} from "@/lib/backend";
import type { DuplicateCandidateMatchDto, TalentCandidateDto, TalentActivityType } from "@/lib/contracts";
import { useAppStore } from "@/store/app-store";

const ALL = "ALL";

export default function TalentCrmPage() {
  const queryClient = useQueryClient();
  const { currentBranch } = useAppStore();
  const [view, setView] = useState<"crm" | "duplicates">("crm");
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
  const duplicates = useQuery({ queryKey: ["talent-crm", "duplicates"], queryFn: () => fetchDuplicateCandidates(45), enabled: view === "duplicates" });

  async function refreshCrm() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["talent-crm"] }),
      queryClient.invalidateQueries({ queryKey: ["applications"] }),
    ]);
  }

  const addPool = useMutation({ mutationFn: ({ candidateId, selectedPoolId }: { candidateId: string; selectedPoolId: string }) => addCandidateToTalentPool(selectedPoolId, candidateId), onSuccess: async () => { toast.success("Candidato agregado al pool"); await refreshCrm(); }, onError: showError });
  const addTag = useMutation({ mutationFn: ({ candidateId, selectedTagId }: { candidateId: string; selectedTagId: string }) => addTalentTag(candidateId, selectedTagId), onSuccess: async () => { toast.success("Etiqueta agregada"); await refreshCrm(); }, onError: showError });

  const meta = candidates.data?.meta;
  return <div className="space-y-6">
    <PageHeader eyebrow="Reclutamiento" title="Talent CRM" description="Cultiva relaciones con talento, segmenta perfiles y resuelve duplicados sin perder el historial." actions={<div className="flex gap-2"><Button variant="secondary" onClick={() => setTagOpen(true)}><Tags className="size-4" />Nueva etiqueta</Button><Button onClick={() => setPoolOpen(true)}><Plus className="size-4" />Nuevo pool</Button></div>} />
    <RecruitmentWorkspaceNav />
    <section className="grid gap-4 md:grid-cols-3">
      <Metric icon={<UsersRound className="size-5" />} label="Talento visible" value={meta?.total ?? "—"} detail={currentBranch?.name ?? "Alcance de empresa"} />
      <Metric icon={<Tags className="size-5" />} label="Pools activos" value={pools.data?.filter((item) => item.isActive).length ?? "—"} detail="Segmentos reutilizables" />
      <Metric icon={<UserRoundSearch className="size-5" />} label="Coincidencias" value={duplicates.data?.data.length ?? (view === "duplicates" ? "—" : "Revisar")} detail="Nunca se fusionan automáticamente" />
    </section>
    <div className="flex w-fit rounded-xl border border-border-default bg-surface-elevated p-1">
      <Button variant={view === "crm" ? "default" : "ghost"} size="sm" onClick={() => setView("crm")}><UsersRound className="size-4" />Base de talento</Button>
      <Button variant={view === "duplicates" ? "default" : "ghost"} size="sm" onClick={() => setView("duplicates")}><Merge className="size-4" />Duplicados</Button>
    </div>

    {view === "crm" ? <>
      <section aria-label="Filtros del Talent CRM" className="grid gap-3 rounded-2xl border border-border-default bg-surface-elevated p-4 md:grid-cols-3">
        <label className="space-y-1.5 text-sm font-medium">Buscar<div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} className="pl-9" placeholder="Nombre, correo, teléfono o ciudad" /></div></label>
        <label className="space-y-1.5 text-sm font-medium">Pool<Select value={poolId} onValueChange={(value) => { setPoolId(value); setPage(1); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Todos los pools</SelectItem>{pools.data?.filter((item) => item.isActive).map((pool) => <SelectItem key={pool.id} value={pool.id}>{pool.name} · {pool.memberCount ?? 0}</SelectItem>)}</SelectContent></Select></label>
        <label className="space-y-1.5 text-sm font-medium">Etiqueta<Select value={tagId} onValueChange={(value) => { setTagId(value); setPage(1); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Todas las etiquetas</SelectItem>{tagsQuery.data?.filter((item) => item.isActive).map((tag) => <SelectItem key={tag.id} value={tag.id}>{tag.name}</SelectItem>)}</SelectContent></Select></label>
      </section>
      {candidates.isLoading ? <AsyncState state="loading" title="Preparando la base de talento" /> : null}
      {candidates.isError ? <AsyncState state="error" title="No fue posible cargar el Talent CRM" onRetry={() => void candidates.refetch()} /> : null}
      {candidates.isSuccess && !candidates.data.data.length ? <InlineFeedback tone="info" title="Sin perfiles para estos filtros">Prueba otro pool, etiqueta o término de búsqueda.</InlineFeedback> : null}
      <div className="grid gap-4 xl:grid-cols-2">{candidates.data?.data.map((candidate) => <CandidateCard key={candidate.id} candidate={candidate} pools={pools.data ?? []} tags={tagsQuery.data ?? []} onAddPool={(selectedPoolId) => addPool.mutate({ candidateId: candidate.id, selectedPoolId })} onAddTag={(selectedTagId) => addTag.mutate({ candidateId: candidate.id, selectedTagId })} onActivity={() => setActivityCandidate(candidate)} />)}</div>
      {meta && meta.totalPages > 0 ? <Pagination page={meta.page - 1} totalPages={meta.totalPages} totalItems={meta.total} pageSize={meta.pageSize} onPageChange={(next) => setPage(next + 1)} /> : null}
    </> : <DuplicateQueue query={duplicates} onMerge={setMergeMatch} />}

    <CreatePoolDialog open={poolOpen} onOpenChange={setPoolOpen} branchId={currentBranch?.id} onCreated={refreshCrm} />
    <CreateTagDialog open={tagOpen} onOpenChange={setTagOpen} onCreated={refreshCrm} />
    <ActivityDialog candidate={activityCandidate} onOpenChange={(open) => !open && setActivityCandidate(null)} onCreated={refreshCrm} />
    <MergeDialog match={mergeMatch} onOpenChange={(open) => !open && setMergeMatch(null)} onMerged={async () => { setMergeMatch(null); await refreshCrm(); }} />
  </div>;
}

function CandidateCard({ candidate, pools, tags, onAddPool, onAddTag, onActivity }: { candidate: TalentCandidateDto; pools: Awaited<ReturnType<typeof fetchTalentPools>>; tags: Awaited<ReturnType<typeof fetchTalentTags>>; onAddPool: (id: string) => void; onAddTag: (id: string) => void; onActivity: () => void }) {
  const availablePools = pools.filter((pool) => pool.isActive && !candidate.pools.some((item) => item.id === pool.id));
  const availableTags = tags.filter((tag) => tag.isActive && !candidate.tags.some((item) => item.id === tag.id));
  const latestApplication = candidate.applications[0];
  return <Card level={2}><CardContent className="space-y-4 p-5">
    <div className="flex items-start justify-between gap-4"><div className="min-w-0"><h2 className="truncate text-lg font-semibold">{candidate.fullName}</h2><p className="truncate text-sm text-text-secondary">{candidate.email}</p><p className="mt-1 text-xs text-text-secondary">{candidate.phone || "Sin teléfono"} · {candidate.city || "Sin ciudad"}</p></div>{candidate.doNotContact ? <Badge variant="destructive">No contactar</Badge> : <Badge variant="secondary">Disponible</Badge>}</div>
    <div className="flex flex-wrap gap-2">{candidate.tags.map((tag) => <span key={tag.id} className="rounded-full border px-2.5 py-1 text-xs font-medium" style={{ borderColor: tag.color ?? undefined }}>{tag.name}</span>)}{candidate.pools.map((pool) => <Badge key={pool.id} variant="outline">{pool.name}</Badge>)}{!candidate.tags.length && !candidate.pools.length ? <span className="text-xs text-text-secondary">Sin segmentación todavía</span> : null}</div>
    <div className="grid gap-2 rounded-xl bg-surface-section p-3 text-sm sm:grid-cols-2"><div><p className="text-xs text-text-secondary">Último proceso</p><p className="font-medium">{latestApplication?.vacancy.title ?? "Sin postulaciones"}</p></div><div><p className="text-xs text-text-secondary">Actividad</p><p className="font-medium">{candidate.talentActivities[0]?.subject ?? "Sin seguimiento"}</p></div></div>
    <div className="grid gap-2 sm:grid-cols-2"><Select onValueChange={onAddPool}><SelectTrigger aria-label={`Agregar ${candidate.fullName} a un pool`}><SelectValue placeholder="Agregar a pool" /></SelectTrigger><SelectContent>{availablePools.length ? availablePools.map((pool) => <SelectItem key={pool.id} value={pool.id}>{pool.name}</SelectItem>) : <SelectItem value="none" disabled>Sin pools disponibles</SelectItem>}</SelectContent></Select><Select onValueChange={onAddTag}><SelectTrigger aria-label={`Etiquetar a ${candidate.fullName}`}><SelectValue placeholder="Agregar etiqueta" /></SelectTrigger><SelectContent>{availableTags.length ? availableTags.map((tag) => <SelectItem key={tag.id} value={tag.id}>{tag.name}</SelectItem>) : <SelectItem value="none" disabled>Sin etiquetas disponibles</SelectItem>}</SelectContent></Select></div>
    <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={onActivity}><NotebookPen className="size-4" />Registrar actividad</Button>{latestApplication ? <Button asChild variant="ghost"><Link href={`/ats/candidates/${latestApplication.id}`}>Abrir expediente<History className="size-4" /></Link></Button> : null}</div>
  </CardContent></Card>;
}

function DuplicateQueue({ query, onMerge }: { query: ReturnType<typeof useQuery<{ data: DuplicateCandidateMatchDto[]; scannedCandidates: number; truncated: boolean; ignoredSharedValues: number }>>; onMerge: (match: DuplicateCandidateMatchDto) => void }) {
  if (query.isLoading) return <AsyncState state="loading" title="Comparando identidades" />;
  if (query.isError) return <AsyncState state="error" title="No fue posible analizar duplicados" onRetry={() => void query.refetch()} />;
  if (!query.data?.data.length) return <InlineFeedback tone="success" title="No hay coincidencias pendientes">Se analizaron {query.data?.scannedCandidates ?? 0} perfiles activos.</InlineFeedback>;
  return <div className="space-y-4"><InlineFeedback tone="info" title={`${query.data.data.length} coincidencias para revisión`}>El puntaje combina teléfono, LinkedIn, CV, nombre, correo y ciudad. Los valores compartidos por más de dos perfiles se excluyen automáticamente.{query.data.ignoredSharedValues ? ` Se ignoraron ${query.data.ignoredSharedValues} valores repetidos.` : ""} La decisión siempre requiere confirmación humana.</InlineFeedback>{query.data.truncated ? <InlineFeedback tone="warning" title="Análisis parcial">Se revisaron los 1.000 perfiles más recientes. Usa procesos programados para volúmenes mayores.</InlineFeedback> : null}<div className="grid gap-4 xl:grid-cols-2">{query.data.data.map((match) => <Card key={match.id} level={2}><CardContent className="space-y-4 p-5"><div className="flex items-center justify-between"><Badge variant={match.score >= 75 ? "destructive" : "secondary"}>{match.score}% coincidencia</Badge>{match.conflictingVacancyIds.length ? <span className="flex items-center gap-1 text-xs font-medium text-status-warning"><CircleAlert className="size-4" />Conflicto de vacante</span> : null}</div><div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr]"><Identity candidate={match.source} /><ArrowRightLeft className="m-auto size-5 text-text-secondary" /><Identity candidate={match.target} /></div><div className="flex flex-wrap gap-2">{match.signals.map((signal) => <Badge key={signal} variant="outline">{signal}</Badge>)}</div><Button className="w-full" disabled={Boolean(match.conflictingVacancyIds.length)} onClick={() => onMerge(match)}><Merge className="size-4" />Revisar y fusionar</Button>{match.conflictingVacancyIds.length ? <p className="text-xs text-text-secondary">Primero resuelve las postulaciones de ambos perfiles en la misma vacante.</p> : null}</CardContent></Card>)}</div></div>;
}

function Identity({ candidate }: { candidate: DuplicateCandidateMatchDto["source"] }) { return <div className="min-w-0 rounded-xl bg-surface-section p-3"><p className="truncate font-semibold">{candidate.fullName}</p><p className="truncate text-xs text-text-secondary">{candidate.email}</p><p className="mt-2 text-xs">{candidate.applications} procesos · {candidate.city || "Sin ciudad"}</p></div>; }

function Metric({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string | number; detail: string }) { return <Card level={2}><CardContent className="flex items-center gap-4 p-5"><span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">{icon}</span><div><p className="text-sm text-text-secondary">{label}</p><p className="text-2xl font-semibold">{value}</p><p className="text-xs text-text-secondary">{detail}</p></div></CardContent></Card>; }

function CreatePoolDialog({ open, onOpenChange, branchId, onCreated }: { open: boolean; onOpenChange: (open: boolean) => void; branchId?: string; onCreated: () => Promise<void> }) {
  const [name, setName] = useState(""); const [description, setDescription] = useState("");
  const mutation = useMutation({ mutationFn: () => createTalentPool({ name, description: description || undefined, branchId }), onSuccess: async () => { setName(""); setDescription(""); onOpenChange(false); toast.success("Pool de talento creado"); await onCreated(); }, onError: showError });
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Nuevo pool de talento</DialogTitle><DialogDescription>Crea un segmento reutilizable para búsquedas futuras, campañas o vacantes próximas.</DialogDescription></DialogHeader><div className="space-y-4"><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. Supervisores de operaciones" /><textarea className="min-h-28 w-full rounded-xl border border-border-default bg-surface-elevated p-3 text-sm" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Perfil buscado y propósito del pool" /><Button className="w-full" disabled={name.trim().length < 2 || mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? "Creando…" : "Crear pool"}</Button></div></DialogContent></Dialog>;
}

function CreateTagDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (open: boolean) => void; onCreated: () => Promise<void> }) {
  const [name, setName] = useState(""); const [color, setColor] = useState("#2563eb");
  const mutation = useMutation({ mutationFn: () => createTalentTag({ name, color }), onSuccess: async () => { setName(""); onOpenChange(false); toast.success("Etiqueta creada"); await onCreated(); }, onError: showError });
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Nueva etiqueta</DialogTitle><DialogDescription>Clasifica competencias, disponibilidad, seniority o cualquier señal útil.</DialogDescription></DialogHeader><div className="space-y-4"><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. Disponible inmediatamente" /><label className="flex items-center gap-3 text-sm font-medium">Color<Input type="color" className="h-11 w-20 p-1" value={color} onChange={(event) => setColor(event.target.value)} /></label><Button className="w-full" disabled={name.trim().length < 2 || mutation.isPending} onClick={() => mutation.mutate()}>Crear etiqueta</Button></div></DialogContent></Dialog>;
}

function ActivityDialog({ candidate, onOpenChange, onCreated }: { candidate: TalentCandidateDto | null; onOpenChange: (open: boolean) => void; onCreated: () => Promise<void> }) {
  const [type, setType] = useState<TalentActivityType>("NOTE"); const [subject, setSubject] = useState(""); const [description, setDescription] = useState(""); const [dueAt, setDueAt] = useState("");
  const mutation = useMutation({ mutationFn: () => createTalentActivity(candidate!.id, { type, subject, description: description || undefined, dueAt: dueAt ? new Date(dueAt).toISOString() : undefined }), onSuccess: async () => { setSubject(""); setDescription(""); setDueAt(""); onOpenChange(false); toast.success("Actividad registrada"); await onCreated(); }, onError: showError });
  return <Dialog open={Boolean(candidate)} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Registrar actividad</DialogTitle><DialogDescription>{candidate?.fullName}. Conserva el contexto para la próxima interacción.</DialogDescription></DialogHeader><div className="space-y-4"><Select value={type} onValueChange={(value) => setType(value as TalentActivityType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="NOTE">Nota</SelectItem><SelectItem value="CALL">Llamada</SelectItem><SelectItem value="EMAIL">Correo</SelectItem><SelectItem value="MEETING">Reunión</SelectItem><SelectItem value="TASK">Tarea</SelectItem></SelectContent></Select><Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Asunto" /><textarea className="min-h-28 w-full rounded-xl border border-border-default bg-surface-elevated p-3 text-sm" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Detalles y próximo paso" />{type === "TASK" ? <label className="space-y-1.5 text-sm font-medium">Vencimiento<Input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></label> : null}<Button className="w-full" disabled={subject.trim().length < 2 || mutation.isPending} onClick={() => mutation.mutate()}>Guardar actividad</Button></div></DialogContent></Dialog>;
}

function MergeDialog({ match, onOpenChange, onMerged }: { match: DuplicateCandidateMatchDto | null; onOpenChange: (open: boolean) => void; onMerged: () => Promise<void> }) {
  const [swapped, setSwapped] = useState(false); const [reason, setReason] = useState("");
  const source = swapped ? match?.target : match?.source; const target = swapped ? match?.source : match?.target;
  const mutation = useMutation({ mutationFn: () => mergeTalentCandidates({ sourceCandidateId: source!.id, targetCandidateId: target!.id, reason }), onSuccess: async (result) => { setReason(""); setSwapped(false); toast.success(`Fusión completada: ${result.movedApplications} procesos y ${result.movedFiles} archivos trasladados`); await onMerged(); }, onError: showError });
  return <Dialog open={Boolean(match)} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Confirmar perfil maestro</DialogTitle><DialogDescription>La operación es transaccional y auditada. El perfil origen quedará marcado como fusionado, no se eliminará.</DialogDescription></DialogHeader>{source && target ? <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr]"><div className="rounded-xl border border-status-warning/30 p-3"><p className="text-xs text-text-secondary">Se fusionará</p><p className="font-semibold">{source.fullName}</p><p className="truncate text-xs">{source.email}</p></div><Button size="icon" variant="ghost" aria-label="Intercambiar perfil maestro" onClick={() => setSwapped((value) => !value)}><ArrowRightLeft className="size-4" /></Button><div className="rounded-xl border border-primary/40 bg-primary/5 p-3"><p className="text-xs text-text-secondary">Perfil maestro</p><p className="font-semibold">{target.fullName}</p><p className="truncate text-xs">{target.email}</p></div></div><div className="flex gap-3 rounded-xl bg-surface-section p-4 text-sm"><CircleAlert className="size-5 shrink-0" /><p>Se moverán postulaciones, CV, pools, etiquetas y actividades. El historial de cada proceso permanece intacto.</p></div><textarea className="min-h-28 w-full rounded-xl border border-border-default bg-surface-elevated p-3 text-sm" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Motivo de la fusión y evidencia revisada (obligatorio)" /><Button className="w-full" disabled={reason.trim().length < 10 || mutation.isPending} onClick={() => mutation.mutate()}><Merge className="size-4" />{mutation.isPending ? "Fusionando…" : "Fusionar de forma auditada"}</Button></div> : null}</DialogContent></Dialog>;
}

function showError(error: unknown) { toast.error(error instanceof Error ? error.message : "No fue posible completar la operación"); }
