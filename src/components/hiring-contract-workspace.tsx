"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { AsyncState } from "@/components/async-state";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-select";
import {
  ActiveContext,
  EmptyState,
  EntityCard,
  EntityCardList,
  ErrorState,
  FilterBar,
  InlineNote,
  NextAction,
  PageHeader,
  PageSection,
  SkeletonRows,
  StatusTile,
  StatusTileRow,
} from "@/components/system";
import { HiringCaseHeader, longDate } from "@/components/hiring/hiring-case-header";
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
  hiringDeadlineState,
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

/** Valor de «sin filtrar» en los selectores. Radix no admite cadena vacía. */
const TODOS = "ALL";

/* ============================ Panel del módulo ========================== */

/**
 * Contratación abre en su panel.
 *
 * Antes abría en una bandeja: seis cifras arriba, traídas por una consulta
 * propia que repetía la que ya hacía la lista, y debajo todas las
 * contrataciones en tarjetas del mismo peso. Para saber por dónde empezar
 * había que leerlas todas, y las cifras y las tarjetas podían discrepar
 * porque venían de dos peticiones distintas.
 *
 * Ahora responde en el orden en que se pregunta:
 *
 *   1. ¿Dónde estoy?            empresa y sucursal activas
 *   2. ¿Qué hago ahora?         una acción, la más urgente
 *   3. ¿Cómo va el módulo?      cuatro cifras con su acción
 *   4. ¿Qué está atrasado?      aviso de fuera de plazo, solo si lo hay
 *   5. ¿En qué punto está todo? reparto por etapa
 *   6. ¿Y el detalle?           la lista, con sus filtros
 *
 * Todo sale de la MISMA consulta. Cuando no hay búsqueda escrita, la clave de
 * las cifras y la de la lista coinciden y React Query hace una sola petición.
 */
function HiringModuleDashboard() {
  const { locale, t } = useLocale();
  const { can, tenantBranches } = useAppStore();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<HiringListView>(HIRING_GUIDED_QUEUE_ENABLED ? "ATTENTION" : "ALL");
  const [status, setStatus] = useState(TODOS);
  const [branch, setBranch] = useState(TODOS);
  const [priority, setPriority] = useState(TODOS);
  const allowed = can("applications.view");

  // Cifras del módulo: siempre sin búsqueda. Un panel que cambia sus totales
  // al escribir en el buscador deja de ser el estado del módulo.
  const panel = useQuery({
    queryKey: ["hiring-contracts", ""],
    queryFn: () => fetchHiringContracts(),
    enabled: allowed,
  });

  // Lista operativa. Con el buscador vacío es exactamente la consulta de
  // arriba, así que no hay segunda petición.
  const lista = useQuery({
    queryKey: ["hiring-contracts", search],
    queryFn: () => fetchHiringContracts({ search: search || undefined }),
    enabled: allowed,
  });

  const todas = useMemo(() => panel.data?.data ?? [], [panel.data]);
  const encontradas = useMemo(() => lista.data?.data ?? [], [lista.data]);

  const items = useMemo(
    () =>
      encontradas
        .filter(
          (item) =>
            hiringViewMatches(item, view) &&
            (status === TODOS || item.status === status) &&
            (branch === TODOS || item.branchId === branch) &&
            (priority === TODOS || item.priority === priority),
        )
        .sort(porUrgencia),
    [branch, encontradas, priority, status, view],
  );

  const cuenta = (vista: HiringListView) => todas.filter((item) => hiringViewMatches(item, vista)).length;
  const fueraDePlazo = todas.filter((item) => hiringDeadlineState(item.deadlineAt) === "OVERDUE").length;
  const vencenPronto = todas.filter((item) => hiringDeadlineState(item.deadlineAt) === "DUE_SOON").length;

  // Las cifras se cuentan sobre lo que el servidor devolvió. Si hay más de una
  // página, decirlo es obligatorio: un total parcial presentado como total
  // engaña más que no enseñarlo.
  const parcial = Boolean(panel.data && panel.data.meta.total > todas.length);

  /** `undefined` mientras carga, `null` si el servidor no responde. */
  const cifra = (valor: number) => (panel.isError ? null : panel.data ? valor : undefined);

  const tarjetas = [
    {
      title: t("hiring.metrics.yours"),
      value: cifra(cuenta("ATTENTION")),
      context: t("hiring.panel.yoursContext"),
      status:
        cuenta("ATTENTION") > 0 && panel.data
          ? { label: t("hiring.panel.needsYou"), tone: "warning" as const }
          : undefined,
    },
    {
      title: t("hiring.metrics.waiting"),
      value: cifra(cuenta("WAITING")),
      context: t("hiring.panel.waitingContext"),
    },
    {
      title: t("hiring.metrics.ready"),
      value: cifra(cuenta("READY")),
      context: t("hiring.panel.readyContext"),
      status:
        cuenta("READY") > 0 && panel.data
          ? { label: t("hiring.panel.canFinish"), tone: "success" as const }
          : undefined,
    },
    {
      title: t("hiring.metrics.overdue"),
      value: cifra(fueraDePlazo),
      context: t("hiring.panel.overdueContext"),
      status:
        fueraDePlazo > 0 && panel.data
          ? { label: t("hiring.panel.late"), tone: "danger" as const }
          : undefined,
    },
  ];

  // El primero de la cola de «te toca a ti», ya ordenado por urgencia.
  const siguiente = todas.filter((item) => hiringViewMatches(item, "ATTENTION")).sort(porUrgencia)[0];

  const reparto = HIRING_STAGES.map((etapa) => ({
    id: etapa.id,
    title: hiringStageTitle(etapa.id, locale),
    total: todas.filter((item) => resolveHiringCase(item).stage === etapa.id && !resolveHiringCase(item).cancelled).length,
  }));
  const maximo = Math.max(1, ...reparto.map((etapa) => etapa.total));

  const filtrosActivos = [status, branch, priority].filter((valor) => valor !== TODOS).length;
  const estados = [...new Set(todas.map((item) => item.status))];

  if (!allowed) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow={t("hiring.list.eyebrow")} title={t("hiring.list.title")} />
        <EmptyState reason="no-records" title={t("hiring.panel.noAccessTitle")} description={t("hiring.panel.noAccessHelp")} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        eyebrow={t("hiring.list.eyebrow")}
        title={t("hiring.list.title")}
        description={t("hiring.list.description")}
        actions={
          <Button asChild variant="secondary">
            <Link href="/ats/candidates">{t("hiring.list.seeCandidates")}</Link>
          </Button>
        }
      />

      <ActiveContext />

      {/* ---- 1. Qué hago ahora ------------------------------------------ */}
      {panel.isLoading ? (
        <SkeletonRows rows={3} label={t("hiring.list.loading")} />
      ) : panel.isError ? (
        <ErrorState title={t("hiring.list.error")} onRetry={() => void panel.refetch()} />
      ) : siguiente ? (
        <NextAction
          label={t("hiring.panel.nextLabel")}
          title={t("hiring.panel.openFor", { name: siguiente.candidate.fullName })}
          detail={[
            resolveHiringCase(siguiente, undefined, locale).primaryAction.label,
            longDate(siguiente.deadlineAt) ?? undefined,
          ]
            .filter(Boolean)
            .join(" · ")}
          href={`/hiring/${siguiente.id}`}
          actionLabel={t("common.open")}
          tone={hiringDeadlineState(siguiente.deadlineAt) === "OVERDUE" ? "danger" : "progress"}
        />
      ) : (
        <EmptyState
          reason="no-records"
          title={t("hiring.panel.nothingPendingTitle")}
          description={t("hiring.panel.nothingPendingHelp")}
        />
      )}

      {/* ---- 2. Cómo va el módulo --------------------------------------- */}
      <StatusTileRow label={t("hiring.panel.tilesLabel")}>
        {tarjetas.map((tarjeta) => (
          <li key={tarjeta.title} className="min-w-0">
            <StatusTile {...tarjeta} />
          </li>
        ))}
      </StatusTileRow>

      {parcial ? (
        <InlineNote tone="info" title={t("hiring.panel.partialTitle", { shown: todas.length, total: panel.data?.meta.total ?? 0 })}>
          {t("hiring.panel.partialHelp")}
        </InlineNote>
      ) : null}

      {vencenPronto > 0 ? (
        <InlineNote tone="warning" title={t("hiring.metrics.dueSoon")}>
          {t("hiring.panel.dueSoonHelp", { count: vencenPronto })}
        </InlineNote>
      ) : null}

      {/* ---- 3. En qué etapa está cada una ------------------------------
          Cinco etapas fijas: el reparto se lee de un vistazo y no compite con
          las cifras de arriba, que son estados y no etapas. */}
      <PageSection title={t("hiring.panel.stagesTitle")} description={t("hiring.panel.stagesHelp")} id="etapas">
        <ul className="space-y-1">
          {reparto.map((etapa) => (
            <li
              key={etapa.id}
              className="flex items-center gap-4 rounded-lg border border-line bg-surface-1 px-4 py-3"
            >
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-1">{etapa.title}</span>
              <span aria-hidden="true" className="hidden h-2 w-24 overflow-hidden rounded-full bg-surface-3 sm:block lg:w-40">
                <span
                  className="block h-full rounded-full bg-accent-fill"
                  style={{ width: `${Math.round((etapa.total / maximo) * 100)}%` }}
                />
              </span>
              <span className="w-12 shrink-0 text-right font-mono text-lg font-semibold tabular-figures text-ink-1">
                {etapa.total}
              </span>
            </li>
          ))}
        </ul>
      </PageSection>

      {/* ---- 4. La lista, con sus filtros ------------------------------- */}
      <PageSection title={t("hiring.panel.listTitle")} id="contrataciones">
        <div className="space-y-4">
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
                className={`min-h-[var(--control-h-touch)] rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:min-h-[var(--control-h-base)] ${
                  view === id
                    ? "border-action bg-action text-on-action"
                    : "border-line-control bg-surface-1 text-ink-1 hover:border-line-strong hover:bg-surface-2"
                }`}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>

          <FilterBar
            search={search}
            onSearchChange={setSearch}
            searchLabel={t("hiring.list.searchPlaceholder")}
            activeCount={filtrosActivos}
            onClear={() => {
              setStatus(TODOS);
              setBranch(TODOS);
              setPriority(TODOS);
            }}
          >
            <FormSelect
              aria-label={t("hiring.list.filterStatus")}
              value={status}
              onValueChange={setStatus}
              options={[
                { value: TODOS, label: t("hiring.list.allM") },
                ...estados.map((valor) => ({ value: valor, label: hiringStatusLabel(valor, locale) })),
              ]}
            />
            <FormSelect
              aria-label={t("hiring.list.filterBranch")}
              value={branch}
              onValueChange={setBranch}
              options={[
                { value: TODOS, label: t("common.allBranches") },
                ...tenantBranches.map((sucursal) => ({ value: sucursal.id, label: sucursal.name })),
              ]}
            />
            <FormSelect
              aria-label={t("hiring.list.filterPriority")}
              value={priority}
              onValueChange={setPriority}
              options={[
                { value: TODOS, label: t("hiring.list.allF") },
                ...["URGENT", "HIGH", "MEDIUM", "LOW"].map((valor) => ({
                  value: valor,
                  label: hiringPriorityLabel(valor, locale),
                })),
              ]}
            />
          </FilterBar>

          <div id="hiring-tabpanel" role="tabpanel" aria-labelledby={`hiring-tab-${view}`} tabIndex={-1}>
            {lista.isLoading ? <SkeletonRows rows={4} label={t("hiring.list.loading")} /> : null}
            {lista.isError ? <ErrorState title={t("hiring.list.error")} onRetry={() => void lista.refetch()} /> : null}
            {lista.isSuccess && !items.length ? (
              <EmptyState
                reason={search || filtrosActivos > 0 || view !== "ALL" ? "no-matches" : "no-records"}
                title={t("hiring.list.empty")}
                description={t("hiring.panel.emptyHelp")}
                onClearFilters={
                  filtrosActivos > 0 || search
                    ? () => {
                        setStatus(TODOS);
                        setBranch(TODOS);
                        setPriority(TODOS);
                        setSearch("");
                      }
                    : undefined
                }
              />
            ) : null}
            {items.length ? (
              <EntityCardList label={t("hiring.panel.listTitle")} columns={2}>
                {items.map((item) => (
                  <HiringCaseCard key={item.id} item={item} />
                ))}
              </EntityCardList>
            ) : null}
          </div>
        </div>
      </PageSection>
    </div>
  );
}

/** Fuera de plazo primero, luego prioridad, luego la fecha límite más cercana. */
function porUrgencia(left: HiringContractDto, right: HiringContractDto) {
  const peso = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 } as Record<string, number>;
  const vencido = (item: HiringContractDto) =>
    item.deadlineAt && new Date(item.deadlineAt).getTime() < Date.now() ? 1 : 0;
  return (
    vencido(right) - vencido(left) ||
    (peso[right.priority ?? ""] ?? 0) - (peso[left.priority ?? ""] ?? 0) ||
    new Date(left.deadlineAt ?? "9999-12-31").getTime() - new Date(right.deadlineAt ?? "9999-12-31").getTime()
  );
}

/**
 * Ficha de una contratación.
 *
 * Tres datos y un próximo paso. Antes eran cuatro pares etiqueta/valor en una
 * `<dl>` de dos columnas más un botón de ancho completo: la misma información
 * ocupando el doble y sin nada que destacara.
 */
function HiringCaseCard({ item }: { item: HiringContractDto }) {
  const { locale, t } = useLocale();
  const state = resolveHiringCase(item, undefined, locale);
  const stage = HIRING_STAGES[state.stageIndex];
  const nombre = item.candidate.fullName.split(" ")[0] || item.candidate.fullName;
  const plazo = hiringDeadlineState(item.deadlineAt);

  return (
    <EntityCard
      title={item.candidate.fullName}
      subtitle={`${item.roleTitle ?? item.vacancy.title} · ${item.branch.name}`}
      avatarName={item.candidate.fullName}
      href={`/hiring/${item.id}`}
      status={{
        label: hiringStatusLabel(item.status, locale),
        tone: state.completed
          ? "success"
          : state.cancelled
            ? "neutral"
            : state.blockers.length
              ? "warning"
              : "progress",
      }}
      facts={[
        {
          label: t("hiring.list.stage"),
          value: t("hiring.stepOfTitle", {
            step: stage.step,
            total: HIRING_STAGES.length,
            title: hiringStageTitle(stage.id, locale),
          }),
        },
        { label: t("hiring.list.whoActs"), value: hiringWaitingLabel(state.waitingOn, nombre, locale) },
        {
          label: t("hiring.list.deadline"),
          value: plazo === "OVERDUE"
            ? `${longDate(item.deadlineAt)} · ${t("hiring.metrics.overdue")}`
            : (longDate(item.deadlineAt) ?? t("hiring.header.noDeadline")),
        },
      ]}
      progress={{
        label: t("common.progress"),
        value: state.progressPercent,
        detail: t("hiring.panel.stageOf", { step: stage.step, total: HIRING_STAGES.length }),
      }}
      nextStep={state.primaryAction.label}
    />
  );
}

export function HiringContractListPage() {
  return <HiringModuleDashboard />;
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
