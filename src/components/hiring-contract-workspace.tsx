"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { AsyncState } from "@/components/async-state";
import { InlineFeedback, PageHeader } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { HiringCaseHeader, initials, longDate } from "@/components/hiring/hiring-case-header";
import { HiringQueueMetrics } from "@/components/hiring/hiring-queue-metrics";
import { HiringSecondaryDetails } from "@/components/hiring/hiring-details";
import {
  CancelledPanel,
  DocumentsPanel,
  OfferPanel,
  OutcomePanel,
  PreparationPanel,
  ReviewPanel,
  stageForView,
} from "@/components/hiring/hiring-stage-panels";
import { fetchHiringContract, fetchHiringContracts, fetchHiringDocuments, fetchHiringHistory, fetchHiringProgress } from "@/lib/backend";
import type { HiringContractDto } from "@/lib/contracts";
import {
  HIRING_GUIDED_QUEUE_ENABLED,
  HIRING_STAGES,
  hiringPriorityLabel,
  hiringStageIndex,
  hiringStatusLabel,
  hiringViewMatches,
  hiringWaitingLabel,
  resolveHiringCase,
  type HiringListView,
  type HiringStageId,
  hiringStageTitle,
} from "@/lib/hiring-ux";
import { useAppStore } from "@/store/app-store";
import { useLocale } from "@/components/locale-provider";

// Cada vista guarda su CLAVE, no su texto: la etiqueta se resuelve al pintarla,
// que es cuando se conoce el idioma.
const VIEWS: Array<[HiringListView, string]> = [
  ["ALL", "hiring.list.allF"],
  ["ATTENTION", "hiring.metrics.yours"],
  ["WAITING", "hiring.metrics.waiting"],
  ["READY", "hiring.metrics.ready"],
  ["COMPLETED", "hiring.metrics.completed"],
];

/* ================================ Lista ================================= */

function HiringCaseCard({ item }: { item: HiringContractDto }) {
  const { locale, t } = useLocale();
  const state = resolveHiringCase(item);
  const stage = HIRING_STAGES[state.stageIndex];
  const firstName = item.candidate.fullName.split(" ")[0] || "la persona";
  return (
    <Card level={2}>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start gap-4">
          <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-semibold text-text-primary">
            {initials(item.candidate.fullName)}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-text-primary">
              <Link href={`/hiring/${item.id}`} className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus">
                {item.candidate.fullName}
              </Link>
            </h3>
            <p className="mt-1 text-base text-text-primary">{item.roleTitle ?? item.vacancy.title}</p>
            <p className="mt-1 text-base text-text-secondary">{item.vacancy.tenant?.name ?? t("hiring.activeCompany")} · {item.branch.name}</p>
          </div>
          <Badge variant={state.completed ? "success" : state.cancelled ? "destructive" : state.blockers.length ? "warning" : "secondary"} className="text-sm">
            {hiringStatusLabel(item.status, locale)}
          </Badge>
        </div>

        <dl className="grid gap-3 border-t border-border-default pt-4 sm:grid-cols-2">
          <div>
            <dt className="text-base text-text-secondary">{t("hiring.list.stage")}</dt>
            <dd className="mt-0.5 text-base font-medium text-text-primary">{t("hiring.stepOfTitle", { step: stage.step, total: HIRING_STAGES.length, title: hiringStageTitle(stage.id, locale) })}</dd>
          </div>
          <div>
            <dt className="text-base text-text-secondary">{t("hiring.list.whatNext")}</dt>
            <dd className="mt-0.5 text-base font-medium text-text-primary">{state.primaryAction.label}</dd>
          </div>
          <div>
            <dt className="text-base text-text-secondary">{t("hiring.list.whoActs")}</dt>
            <dd className="mt-0.5 text-base text-text-primary">{hiringWaitingLabel(state.waitingOn, firstName)}</dd>
          </div>
          <div>
            <dt className="text-base text-text-secondary">{t("hiring.list.deadline")}</dt>
            <dd className="mt-0.5 text-base text-text-primary">{longDate(item.deadlineAt) ?? t("hiring.header.noDeadline")}</dd>
          </div>
        </dl>

        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href={`/hiring/${item.id}`}>
            Abrir contratación de {firstName}
            <ArrowRight className="size-5" aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function HiringContractListContent() {
  const { locale, t } = useLocale();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<HiringListView>(HIRING_GUIDED_QUEUE_ENABLED ? "ATTENTION" : "ALL");
  const [status, setStatus] = useState("");
  const [branch, setBranch] = useState("");
  const [priority, setPriority] = useState("");
  const { can } = useAppStore();
  const query = useQuery({ queryKey: ["hiring-contracts", search], queryFn: () => fetchHiringContracts({ search: search || undefined }), enabled: can("applications.view") });

  const all = useMemo(() => query.data?.data ?? [], [query.data]);
  const items = useMemo(() => all
    .filter((item) => hiringViewMatches(item, view) && (!status || item.status === status) && (!branch || item.branchId === branch) && (!priority || item.priority === priority))
    .sort((left, right) => {
      const weight = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 } as Record<string, number>;
      const overdue = (item: HiringContractDto) => (item.deadlineAt && new Date(item.deadlineAt).getTime() < Date.now() ? 1 : 0);
      return overdue(right) - overdue(left) || (weight[right.priority ?? ""] ?? 0) - (weight[left.priority ?? ""] ?? 0) || new Date(left.deadlineAt ?? "9999-12-31").getTime() - new Date(right.deadlineAt ?? "9999-12-31").getTime();
    }), [all, branch, priority, status, view]);

  const statuses = [...new Set(all.map((item) => item.status))];
  const branches = [...new Map(all.map((item) => [item.branchId, item.branch])).values()];
  const selectClass = "min-h-11 w-full rounded-xl border border-border-default bg-surface-elevated px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus";

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={t("hiring.list.eyebrow")}
        title={t("hiring.list.title")}
        description={t("hiring.list.description")}
        actions={<Button asChild variant="secondary"><Link href="/ats/candidates">{t("hiring.list.seeCandidates")}</Link></Button>}
      />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label={t("hiring.list.viewsAria")}>
        {VIEWS.map(([id, labelKey]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`hiring-tab-${id}`}
            aria-selected={view === id}
            aria-controls="hiring-tabpanel"
            tabIndex={view === id ? 0 : -1}
            onClick={() => setView(id)}
            className={`min-h-11 rounded-full border px-4 text-base font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus ${view === id ? "border-primary bg-primary text-text-on-accent" : "border-border-default bg-surface-elevated text-text-primary"}`}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>

      <Card level={2}>
        <CardContent className="space-y-4 p-4">
          <label className="block space-y-2 text-base font-medium text-text-primary" htmlFor="hiring-search">
            Buscar una contratación
            <span className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
              <Input id="hiring-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("hiring.list.searchPlaceholder")} className="pl-10 text-base" />
            </span>
          </label>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="space-y-2 text-base font-medium text-text-primary" htmlFor="hiring-filter-status">
              Estado
              <select id="hiring-filter-status" aria-label={t("hiring.list.filterStatus")} value={status} onChange={(event) => setStatus(event.target.value)} className={selectClass}>
                <option value="">{t("hiring.list.allM")}</option>
                {statuses.map((value) => <option key={value} value={value}>{hiringStatusLabel(value, locale)}</option>)}
              </select>
            </label>
            <label className="space-y-2 text-base font-medium text-text-primary" htmlFor="hiring-filter-branch">
              Sucursal
              <select id="hiring-filter-branch" aria-label={t("hiring.list.filterBranch")} value={branch} onChange={(event) => setBranch(event.target.value)} className={selectClass}>
                <option value="">{t("hiring.list.allF")}</option>
                {branches.map((value) => <option key={value.id} value={value.id}>{value.name}</option>)}
              </select>
            </label>
            <label className="space-y-2 text-base font-medium text-text-primary" htmlFor="hiring-filter-priority">
              Prioridad
              <select id="hiring-filter-priority" aria-label={t("hiring.list.filterPriority")} value={priority} onChange={(event) => setPriority(event.target.value)} className={selectClass}>
                <option value="">{t("hiring.list.allF")}</option>
                {["URGENT", "HIGH", "MEDIUM", "LOW"].map((value) => <option key={value} value={value}>{hiringPriorityLabel(value)}</option>)}
              </select>
            </label>
          </div>
        </CardContent>
      </Card>

      <div id="hiring-tabpanel" role="tabpanel" aria-labelledby={`hiring-tab-${view}`} tabIndex={-1} className="space-y-4">
        {query.isLoading ? <AsyncState state="loading" title={t("hiring.list.loading")} /> : null}
        {query.isError ? <AsyncState state="error" title={t("hiring.list.error")} onRetry={() => void query.refetch()} /> : null}
        {query.isSuccess && !items.length ? (
          <InlineFeedback tone="info" title={t("hiring.list.empty")}>
            Prueba con otra pestaña o quita los filtros. Las contrataciones aparecen aquí cuando una postulación es aprobada.
          </InlineFeedback>
        ) : null}
        {items.map((item) => <HiringCaseCard key={item.id} item={item} />)}
      </div>
    </div>
  );
}

export function HiringContractListPage() {
  return (
    <div className="space-y-5">
      <HiringQueueMetrics />
      <HiringContractListContent />
    </div>
  );
}

/* =============================== Detalle ================================ */

export function HiringContractDetailPage({ contractId }: { contractId: string }) {
  const { locale, t } = useLocale();
  const client = useQueryClient();
  const [requestedStage, setRequestedStage] = useState<HiringStageId | null>(null);

  const contract = useQuery({ queryKey: ["hiring-contract", contractId], queryFn: () => fetchHiringContract(contractId), enabled: Boolean(contractId) });
  const progress = useQuery({ queryKey: ["hiring-progress", contractId], queryFn: () => fetchHiringProgress(contractId), enabled: Boolean(contractId), refetchInterval: 15000 });
  const documents = useQuery({ queryKey: ["hiring-documents", contractId], queryFn: () => fetchHiringDocuments(contractId), enabled: Boolean(contractId) });
  const history = useQuery({ queryKey: ["hiring-history", contractId], queryFn: () => fetchHiringHistory(contractId), enabled: Boolean(contractId) });

  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["hiring-contract", contractId] }),
      client.invalidateQueries({ queryKey: ["hiring-progress", contractId] }),
      client.invalidateQueries({ queryKey: ["hiring-documents", contractId] }),
      client.invalidateQueries({ queryKey: ["hiring-history", contractId] }),
      client.invalidateQueries({ queryKey: ["hiring-contracts"] }),
    ]);
    setRequestedStage(null);
  };

  if (contract.isLoading) return <AsyncState state="loading" title={t("hiring.list.loadingOne")} />;
  if (contract.isError || !contract.data) return <AsyncState state="error" title={t("hiring.list.errorOne")} onRetry={() => void contract.refetch()} />;

  const item = contract.data;
  const state = resolveHiringCase(item, progress.data ?? item.progress, locale);
  const documentList = documents.data ?? item.documents;
  const stage = stageForView(state, requestedStage);
  const back = hiringStageIndex(stage) > 0 ? () => setRequestedStage(HIRING_STAGES[hiringStageIndex(stage) - 1].id) : undefined;

  return (
    <div className="space-y-6">
      <nav aria-label={t("profile.backAria")}>
        <Button asChild variant="secondary">
          <Link href="/hiring"><ArrowLeft className="size-4" aria-hidden="true" />{t("hiring.list.back")}</Link>
        </Button>
      </nav>

      <HiringCaseHeader contract={item} state={state} />

      {state.cancelled ? <CancelledPanel contract={item} /> : null}
      {!state.cancelled && stage === "PREPARACION" ? <PreparationPanel contract={item} state={state} onAdvance={() => setRequestedStage("OFERTA")} /> : null}
      {!state.cancelled && stage === "OFERTA" ? <OfferPanel contract={item} state={state} onBack={back} onRefresh={refresh} /> : null}
      {!state.cancelled && stage === "DOCUMENTOS" ? <DocumentsPanel contract={item} state={state} documents={documentList} onBack={back} onRefresh={refresh} /> : null}
      {!state.cancelled && stage === "REVISION" ? <ReviewPanel contract={item} state={state} documents={documentList} onBack={back} onRefresh={refresh} /> : null}
      {!state.cancelled && stage === "CONFIRMACION" ? <OutcomePanel contract={item} onRefresh={refresh} /> : null}

      <HiringSecondaryDetails
        contract={item}
        state={state}
        documents={documentList}
        history={history.data ?? item.stateHistory ?? []}
        onRefresh={refresh}
      />
    </div>
  );
}
