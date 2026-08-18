"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Download, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { AsyncState } from "@/components/async-state";
import { ActionBar, InlineFeedback, MobileFilterSheet, PageHeader, Pagination, ResponsiveDataView } from "@/components/design-system";
import { FilterField, RecruitmentWorkspaceNav } from "@/components/recruitment-workspace";
import { WorkspaceViewManager } from "@/components/workspace-view-manager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { applicationNextAction, applicationStageLabel, formatApplicationDate } from "@/lib/applications";
import { bulkUpdateApplications, exportApplications, fetchApplications, fetchRejectionReasons, fetchUsers, fetchVacancies, fetchVacancySetup } from "@/lib/backend";
import type { ApplicationFilters, VacancyApplicationDto } from "@/lib/contracts";
import { trackProductEvent } from "@/lib/product-analytics";
import { useAppStore } from "@/store/app-store";

const ALL = "ALL";

function downloadCsv(items: VacancyApplicationDto[]) {
  const rows = [["Candidato", "Correo", "Vacante", "Sucursal", "Etapa", "Estado", "Responsable", "Postulación", "SLA vencido", "Razón de descarte"], ...items.map((item) => [item.candidate.fullName, item.candidate.email, item.vacancy.title, item.vacancy.branch?.name ?? "", item.currentStage?.name ?? "", item.status, item.assignedRecruiter ? `${item.assignedRecruiter.firstName} ${item.assignedRecruiter.lastName}` : "", item.appliedAt, item.isStageOverdue ? "Sí" : "No", item.structuredRejectionReason?.label ?? ""])];
  const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `candidatos-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function CandidatesContent() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const { currentBranch } = useAppStore();
  const search = params.get("q") ?? "";
  const stage = params.get("stage") ?? ALL;
  const vacancyId = params.get("vacancy") ?? ALL;
  const overdueOnly = params.get("overdue") === "true";
  const assignedRecruiterId = params.get("recruiter") ?? ALL;
  const rejectionReasonId = params.get("rejection") ?? ALL;
  const page = Math.max(1, Number(params.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(10, Number(params.get("pageSize") ?? 20)));
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkStage, setBulkStage] = useState(ALL);
  const [bulkRecruiter, setBulkRecruiter] = useState(ALL);
  const [bulkRejectionReasonId, setBulkRejectionReasonId] = useState(ALL);
  const [bulkReason, setBulkReason] = useState("");
  const [bulkNotes, setBulkNotes] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = [search, vacancyId !== ALL, stage !== ALL, overdueOnly, assignedRecruiterId !== ALL, rejectionReasonId !== ALL].filter(Boolean).length;

  const filters: ApplicationFilters = {
    search: search || undefined,
    currentStageId: stage === ALL ? undefined : stage,
    vacancyId: vacancyId === ALL ? undefined : vacancyId,
    branchId: currentBranch?.id,
    overdueOnly: overdueOnly || undefined,
    assignedRecruiterId: assignedRecruiterId === ALL ? undefined : assignedRecruiterId,
    rejectionReasonId: rejectionReasonId === ALL ? undefined : rejectionReasonId,
    page,
    pageSize,
  };
  const applications = useQuery({ queryKey: ["applications", filters], queryFn: () => fetchApplications(filters) });
  const vacanciesQuery = useQuery({ queryKey: ["vacancies", "candidate-filters"], queryFn: fetchVacancies });
  const setup = useQuery({ queryKey: ["vacancy-setup", vacancyId], queryFn: () => fetchVacancySetup(vacancyId), enabled: vacancyId !== ALL });
  const users = useQuery({ queryKey: ["users", "ats-bulk"], queryFn: fetchUsers });
  const rejectionReasons = useQuery({ queryKey: ["application-rejection-reasons"], queryFn: fetchRejectionReasons });
  const items = applications.data?.data ?? [];
  const meta = applications.data?.meta;
  const stages = setup.data?.stages ?? [];
  const bulkTargetStage = stages.find((item) => item.id === bulkStage);

  function setFilter(name: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (!value || value === ALL || value === "false") next.delete(name); else next.set(name, value);
    if (name !== "page") next.delete("page");
    if (name === "vacancy") next.delete("stage");
    router.replace(`${pathname}${next.size ? `?${next.toString()}` : ""}`, { scroll: false });
    setSelected([]);
  }

  const bulk = useMutation({
    mutationFn: () => bulkUpdateApplications({ ids: selected, currentStageId: bulkStage === ALL ? undefined : bulkStage, assignedRecruiterId: bulkRecruiter === ALL ? undefined : bulkRecruiter, rejectionReasonId: bulkRejectionReasonId === ALL ? undefined : bulkRejectionReasonId, reason: bulkReason.trim() || undefined, notes: bulkNotes.trim() || undefined }),
    onSuccess: async (result) => { toast.success(`${result.updated} postulaciones actualizadas`); setSelected([]); setBulkStage(ALL); setBulkRecruiter(ALL); setBulkRejectionReasonId(ALL); setBulkReason(""); setBulkNotes(""); await queryClient.invalidateQueries({ queryKey: ["applications"] }); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "No fue posible actualizar la selección"),
  });
  const exporting = useMutation({ mutationFn: () => exportApplications(filters), onSuccess: (result) => { downloadCsv(result.data); toast.success(`${result.count} registros exportados`); }, onError: () => toast.error("No fue posible generar la exportación") });

  function applyView(viewFilters: ApplicationFilters) {
    const next = new URLSearchParams();
    if (viewFilters.search) next.set("q", viewFilters.search);
    if (viewFilters.vacancyId) next.set("vacancy", viewFilters.vacancyId);
    if (viewFilters.currentStageId) next.set("stage", viewFilters.currentStageId);
    if (viewFilters.overdueOnly) next.set("overdue", "true");
    if (viewFilters.assignedRecruiterId) next.set("recruiter", viewFilters.assignedRecruiterId);
    if (viewFilters.rejectionReasonId) next.set("rejection", viewFilters.rejectionReasonId);
    if (viewFilters.pageSize) next.set("pageSize", String(viewFilters.pageSize));
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  const candidateCard = (item: VacancyApplicationDto) => <div className="space-y-3"><div className="flex items-start gap-3"><input type="checkbox" aria-label={`Seleccionar ${item.candidate.fullName}`} checked={selected.includes(item.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...new Set([...current, item.id])] : current.filter((id) => id !== item.id))} className="mt-1 size-4" /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{item.candidate.fullName}</p><p className="text-sm text-text-secondary">{item.candidate.email}</p></div><Badge variant="secondary">{item.currentStage?.name ?? applicationStageLabel(item.status)}</Badge></div><div className="mt-3 space-y-1 text-sm"><p>{item.vacancy.title}</p><p className="text-text-secondary">{item.vacancy.branch?.name ?? "Sin sucursal"} · {formatApplicationDate(item.appliedAt)}</p><p><span className="font-medium">Siguiente:</span> {applicationNextAction(item.status)}</p>{item.isStageOverdue ? <p className="font-medium text-status-danger">SLA vencido</p> : null}</div></div></div><Button asChild variant="secondary"><Link href={`/ats/candidates/${item.id}`} onClick={() => trackProductEvent({ name: "candidate_profile_opened", source: "list" })}>Abrir perfil 360°<ArrowRight className="size-4" /></Link></Button></div>;

  return <div className="space-y-6"><PageHeader eyebrow="Reclutamiento" title="Candidatos" description="Opera el universo completo de postulaciones con filtros de servidor, acciones masivas y vistas reutilizables." actions={<Button variant="secondary" onClick={() => exporting.mutate()} disabled={exporting.isPending}><Download className="size-4" />{exporting.isPending ? "Generando…" : "Exportar todo"}</Button>} /><RecruitmentWorkspaceNav />
    <WorkspaceViewManager module="ats" screen="candidates" workspaceKey={currentBranch?.id} getConfig={() => ({ filters: { search, vacancyId: vacancyId === ALL ? undefined : vacancyId, currentStageId: stage === ALL ? undefined : stage, overdueOnly, assignedRecruiterId: assignedRecruiterId === ALL ? undefined : assignedRecruiterId, rejectionReasonId: rejectionReasonId === ALL ? undefined : rejectionReasonId, pageSize }, ordering: { pageSize }, columns: ["candidate", "vacancy", "stage", "nextAction"] })} onApply={(config) => applyView((config.filters ?? {}) as ApplicationFilters)} />
    <div className="md:hidden"><Button variant="secondary" className="w-full" onClick={() => setFiltersOpen(true)}><SlidersHorizontal className="size-4" />Filtros avanzados{activeFilterCount ? ` (${activeFilterCount})` : ""}</Button></div>
    <MobileFilterSheet open={filtersOpen} onOpenChange={setFiltersOpen} title="Filtrar candidatos" description="Los resultados se actualizan desde el servidor." onClear={() => { router.replace(pathname, { scroll: false }); setSelected([]); }}><CandidateFilters search={search} vacancyId={vacancyId} stage={stage} overdueOnly={overdueOnly} assignedRecruiterId={assignedRecruiterId} rejectionReasonId={rejectionReasonId} pageSize={pageSize} vacancies={vacanciesQuery.data?.data ?? []} stages={stages} users={users.data ?? []} rejectionReasons={rejectionReasons.data ?? []} setFilter={setFilter} /></MobileFilterSheet>
    <section aria-label="Filtros de candidatos" className="hidden gap-3 rounded-2xl border border-border-default bg-surface-elevated p-4 md:grid md:grid-cols-2 xl:grid-cols-4"><CandidateFilters search={search} vacancyId={vacancyId} stage={stage} overdueOnly={overdueOnly} assignedRecruiterId={assignedRecruiterId} rejectionReasonId={rejectionReasonId} pageSize={pageSize} vacancies={vacanciesQuery.data?.data ?? []} stages={stages} users={users.data ?? []} rejectionReasons={rejectionReasons.data ?? []} setFilter={setFilter} /></section>
    {selected.length ? <ActionBar sticky label="Acciones masivas"><p className="mr-auto text-sm font-medium">{selected.length} seleccionadas</p><Select value={bulkStage} onValueChange={(value) => { setBulkStage(value); setBulkRejectionReasonId(ALL); setBulkReason(""); }} disabled={vacancyId === ALL}><SelectTrigger className="w-52"><SelectValue placeholder="Mover a etapa" /></SelectTrigger><SelectContent><SelectItem value={ALL}>No cambiar etapa</SelectItem>{stages.map((item) => <SelectItem key={item.id} value={item.id!}>{item.name}</SelectItem>)}</SelectContent></Select><Select value={bulkRecruiter} onValueChange={setBulkRecruiter}><SelectTrigger className="w-56"><SelectValue placeholder="Asignar responsable" /></SelectTrigger><SelectContent><SelectItem value={ALL}>No reasignar</SelectItem>{users.data?.map((user) => <SelectItem key={user.id} value={user.id}>{user.fullName}</SelectItem>)}</SelectContent></Select>{bulkTargetStage?.applicationStatus === "REJECTED" ? <><Select value={bulkRejectionReasonId} onValueChange={setBulkRejectionReasonId}><SelectTrigger className="w-56"><SelectValue placeholder="Razón de descarte" /></SelectTrigger><SelectContent>{rejectionReasons.data?.map((reason) => <SelectItem key={reason.id} value={reason.id}>{reason.label}</SelectItem>)}</SelectContent></Select><Input value={bulkReason} onChange={(event) => setBulkReason(event.target.value)} className="w-64" placeholder="Observación del descarte" /></> : null}<Input value={bulkNotes} onChange={(event) => setBulkNotes(event.target.value)} className="w-64" maxLength={4000} placeholder="Nota interna para la selección" /><Button variant="secondary" onClick={() => { downloadCsv(items.filter((item) => selected.includes(item.id))); toast.success("Selección visible exportada"); }}><Download className="size-4" />Exportar visibles</Button><Button onClick={() => bulk.mutate()} disabled={bulk.isPending || (bulkStage === ALL && bulkRecruiter === ALL && !bulkNotes.trim()) || (bulkTargetStage?.applicationStatus === "REJECTED" && (bulkRejectionReasonId === ALL || !bulkReason.trim()))}>{bulk.isPending ? "Aplicando…" : "Aplicar a selección"}</Button><Button variant="ghost" onClick={() => setSelected([])}>Cancelar</Button></ActionBar> : null}
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-text-secondary" aria-live="polite">{meta?.total ?? 0} {(meta?.total ?? 0) === 1 ? "candidato" : "candidatos"} en total</p>{items.length ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={items.every((item) => selected.includes(item.id))} onChange={(event) => setSelected(event.target.checked ? [...new Set([...selected, ...items.map((item) => item.id)])] : selected.filter((id) => !items.some((item) => item.id === id)))} />Seleccionar esta página</label> : null}</div>
    {applications.isLoading ? <AsyncState state="loading" title="Cargando candidatos" /> : null}{applications.isError ? <AsyncState state="error" title="No fue posible cargar candidatos" onRetry={() => void applications.refetch()} /> : null}{applications.isSuccess && !items.length ? <InlineFeedback tone="info" title="No hay resultados">Ajusta los filtros para encontrar otras postulaciones.</InlineFeedback> : null}{applications.isSuccess && items.length ? <ResponsiveDataView data={items} getKey={(item) => item.id} mobile={candidateCard} desktop={<div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{items.map((item) => <Card level={2} key={item.id}><CardContent className="p-5">{candidateCard(item)}</CardContent></Card>)}</div>} /> : null}
    {meta && meta.totalPages > 0 ? <Pagination page={meta.page - 1} totalPages={meta.totalPages} totalItems={meta.total} pageSize={meta.pageSize} onPageChange={(next) => setFilter("page", String(next + 1))} /> : null}
  </div>;
}

export default function CandidatesPage() {
  return <Suspense fallback={<AsyncState state="loading" title="Preparando candidatos" />}><CandidatesContent /></Suspense>;
}

function CandidateFilters({ search, vacancyId, stage, overdueOnly, assignedRecruiterId, rejectionReasonId, pageSize, vacancies, stages, users, rejectionReasons, setFilter }: { search: string; vacancyId: string; stage: string; overdueOnly: boolean; assignedRecruiterId: string; rejectionReasonId: string; pageSize: number; vacancies: Array<{ id: string; title: string }>; stages: Array<{ id?: string; name: string }>; users: Array<{ id: string; fullName: string }>; rejectionReasons: Array<{ id: string; label: string }>; setFilter: (name: string, value: string) => void }) {
  return <><FilterField label="Buscar"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" /><Input value={search} onChange={(event) => setFilter("q", event.target.value)} placeholder="Nombre, correo o vacante" className="pl-9" /></div></FilterField><FilterField label="Vacante"><Select value={vacancyId} onValueChange={(value) => setFilter("vacancy", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Todas las vacantes</SelectItem>{vacancies.map((vacancy) => <SelectItem key={vacancy.id} value={vacancy.id}>{vacancy.title}</SelectItem>)}</SelectContent></Select></FilterField><FilterField label="Etapa"><Select value={stage} disabled={vacancyId === ALL} onValueChange={(value) => setFilter("stage", value)}><SelectTrigger><SelectValue placeholder="Elige una vacante" /></SelectTrigger><SelectContent><SelectItem value={ALL}>Todas las etapas</SelectItem>{stages.map((item) => <SelectItem key={item.id} value={item.id!}>{item.name}</SelectItem>)}</SelectContent></Select></FilterField><FilterField label="Responsable"><Select value={assignedRecruiterId} onValueChange={(value) => setFilter("recruiter", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Todos los responsables</SelectItem>{users.map((user) => <SelectItem key={user.id} value={user.id}>{user.fullName}</SelectItem>)}</SelectContent></Select></FilterField><FilterField label="Razón de descarte"><Select value={rejectionReasonId} onValueChange={(value) => setFilter("rejection", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Todas las razones</SelectItem>{rejectionReasons.map((reason) => <SelectItem key={reason.id} value={reason.id}>{reason.label}</SelectItem>)}</SelectContent></Select></FilterField><FilterField label="SLA"><Select value={String(overdueOnly)} onValueChange={(value) => setFilter("overdue", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="false">Todos</SelectItem><SelectItem value="true">Solo vencidos</SelectItem></SelectContent></Select></FilterField><FilterField label="Por página"><Select value={String(pageSize)} onValueChange={(value) => setFilter("pageSize", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[20, 50, 100].map((size) => <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}</SelectContent></Select></FilterField></>;
}
