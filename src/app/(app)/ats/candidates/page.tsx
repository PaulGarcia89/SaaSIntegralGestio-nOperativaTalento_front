"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Search } from "lucide-react";
import { AsyncState } from "@/components/async-state";
import { InlineFeedback, PageHeader, ResponsiveDataView } from "@/components/design-system";
import { FilterField, RecruitmentWorkspaceNav } from "@/components/recruitment-workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { APPLICATION_STAGES, applicationNextAction, applicationStageLabel, formatApplicationDate } from "@/lib/applications";
import { fetchApplications } from "@/lib/backend";
import type { VacancyApplicationDto } from "@/lib/contracts";
import { trackProductEvent } from "@/lib/product-analytics";
import { useAppStore } from "@/store/app-store";

const ALL = "ALL";

function CandidatesContent() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { currentBranch } = useAppStore();
  const search = params.get("q") ?? "";
  const stage = params.get("stage") ?? ALL;
  const vacancyId = params.get("vacancy") ?? ALL;
  const applications = useQuery({ queryKey: ["applications", currentBranch?.id], queryFn: () => fetchApplications({ branchId: currentBranch?.id }) });
  const allItems = useMemo(() => applications.data?.data ?? [], [applications.data]);
  const vacancies = useMemo(() => Array.from(new Map(allItems.map((item) => [item.vacancy.id, item.vacancy.title])).entries()).sort((a, b) => a[1].localeCompare(b[1], "es")), [allItems]);
  const items = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es");
    return allItems.filter((item) => (!query || `${item.candidate.fullName} ${item.candidate.email} ${item.vacancy.title}`.toLocaleLowerCase("es").includes(query)) && (stage === ALL || item.status === stage) && (vacancyId === ALL || item.vacancy.id === vacancyId));
  }, [allItems, search, stage, vacancyId]);

  function setFilter(name: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (!value || value === ALL) next.delete(name); else next.set(name, value);
    router.replace(`${pathname}${next.size ? `?${next.toString()}` : ""}`, { scroll: false });
  }

  const candidateCard = (item: VacancyApplicationDto) => <div className="space-y-3"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{item.candidate.fullName}</p><p className="text-sm text-text-secondary">{item.candidate.email}</p></div><Badge variant="secondary">{applicationStageLabel(item.status)}</Badge></div><div className="space-y-1 text-sm"><p>{item.vacancy.title}</p><p className="text-text-secondary">{item.vacancy.branch?.name ?? "Sin sucursal"} · {formatApplicationDate(item.appliedAt)}</p><p><span className="font-medium">Siguiente:</span> {applicationNextAction(item.status)}</p></div><Button asChild variant="secondary"><Link href={`/ats/candidates/${item.id}`} onClick={() => trackProductEvent({ name: "candidate_profile_opened", source: "list" })}>Abrir perfil 360°<ArrowRight className="size-4" /></Link></Button></div>;

  return <div className="space-y-6"><PageHeader eyebrow="Reclutamiento" title="Candidatos" description="Encuentra una postulación y continúa desde su siguiente acción recomendada." /><RecruitmentWorkspaceNav /><section aria-label="Filtros de candidatos" className="grid gap-3 rounded-2xl border border-border-default bg-surface-elevated p-4 md:grid-cols-3"><FilterField label="Buscar"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" /><Input value={search} onChange={(event) => setFilter("q", event.target.value)} placeholder="Nombre, correo o vacante" className="pl-9" /></div></FilterField><FilterField label="Vacante"><Select value={vacancyId} onValueChange={(value) => setFilter("vacancy", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Todas las vacantes</SelectItem>{vacancies.map(([id, title]) => <SelectItem key={id} value={id}>{title}</SelectItem>)}</SelectContent></Select></FilterField><FilterField label="Etapa"><Select value={stage} onValueChange={(value) => setFilter("stage", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Todas las etapas</SelectItem>{APPLICATION_STAGES.map((item) => <SelectItem key={item.key} value={item.key}>{item.label}</SelectItem>)}</SelectContent></Select></FilterField></section><p className="text-sm text-text-secondary" aria-live="polite">{items.length} {items.length === 1 ? "candidato encontrado" : "candidatos encontrados"}</p>{applications.isLoading ? <AsyncState state="loading" title="Cargando candidatos" /> : null}{applications.isError ? <AsyncState state="error" title="No fue posible cargar candidatos" onRetry={() => void applications.refetch()} /> : null}{applications.isSuccess && !items.length ? <InlineFeedback tone="info" title="No hay resultados">Ajusta los filtros para encontrar otras postulaciones.</InlineFeedback> : null}{applications.isSuccess && items.length ? <ResponsiveDataView data={items} getKey={(item) => item.id} mobile={candidateCard} desktop={<div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{items.map((item) => <Card level={2} key={item.id}><CardContent className="p-5">{candidateCard(item)}</CardContent></Card>)}</div>} /> : null}</div>;
}

export default function CandidatesPage() {
  return <Suspense fallback={<AsyncState state="loading" title="Preparando candidatos" />}><CandidatesContent /></Suspense>;
}
