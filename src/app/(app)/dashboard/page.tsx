"use client";

import { useUiText } from "@/components/ui-copy";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CircleCheck, Filter, RefreshCw, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchOperationalDashboard } from "@/lib/backend";
import type { OperationalDashboardItemDto, OperationalDashboardTone } from "@/lib/contracts";
import { useAppStore } from "@/store/app-store";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import {
  ErrorState,
  Metric,
  MetricRow,
  NextAction,
  PageHeader,
  PageSection,
  SkeletonRows,
  StatusBadge,
  type Tone,
} from "@/components/system";
import { BarChart, ChartCard, LineChart } from "@/components/chart";
import { ChartFilterChips, HealthMeter, URGENCY_COLOR_CLASS } from "@/components/dashboard/operational-widgets";
import {
  activityByDay,
  bucketByDue,
  DUE_BUCKET_TONE,
  dueBucket,
  dueLabel,
  groupByModule,
  operationalHealth,
  OTHER_MODULES_LABEL,
  sortByPriority,
  type DueBucket,
} from "@/lib/dashboard-insights";

/* ==========================================================================
   INICIO · CENTRO OPERATIVO
   ==========================================================================
   Qué cambió respecto de la versión anterior:

   · Antes la pantalla listaba métricas, tareas y alertas con el mismo peso
     visual, dentro de tarjetas iguales. Ahora hay UNA acción recomendada
     destacada y el resto se ordena por urgencia debajo.
   · Todo lo que se dibuja sale de campos REALES de cada registro —`dueAt`,
     `occurredAt`, `module`, `tone`—, no de datos inventados: el endpoint
     `/dashboard/operational` no entrega series temporales, y en vez de
     simular una se muestra lo que de verdad se sabe. La lógica vive en
     `lib/dashboard-insights.ts`, que está probada.
   · El instante de referencia es `generatedAt`, el del servidor, y no el reloj
     del navegador: así los tramos de vencimiento coinciden con los datos que
     se están mostrando y el render es determinista.

   Revisión de 2026-09: la forma de cada gráfico
   ---------------------------------------------
   Los tres gráficos anteriores eran barras verticales, y dos de los tres
   estaban en la forma equivocada:

   · «Pendientes por vencimiento» es un reparto de un total entre cinco
     tramos con ORDEN DE URGENCIA, con nombres largos y, casi siempre, tres
     tramos a cero. En vertical, media tinta eran columnas vacías y las
     etiquetas no cabían. Ahora son barras horizontales, y el color va por
     categoría: rojo lo vencido, ámbar lo de hoy, grafito el resto. Todas del
     mismo ámbar, «Vencidos» y «Sin fecha» pesaban lo mismo a la vista.
   · «Actividad de los últimos 7 días» es una serie temporal, y una serie
     temporal se lee en línea. En barras, un día con 13 registros dejaba los
     otros seis como rayas de un píxel. Ahora es un área, con cruceta y globo.
   · «Salud operativa» era una cifra más dentro de una fila de siete, con el
     mismo peso que «Vacantes activas». Es una proporción contra un límite:
     un medidor, y el ancla visual de la pantalla.

   Y falta un cuarto que los datos ya permitían: cada tarea y cada alerta
   traen su `module`, así que se puede decir DÓNDE se concentra el trabajo,
   que es lo que decide a qué pantalla ir. No se mostraba en ninguna parte.

   Los gráficos son controles, no adorno
   -------------------------------------
   Bajo los dos gráficos de reparto hay una fila de botones —etiqueta directa
   con su color y su cifra— que filtra las listas de pendientes y alertas. Se
   filtran las LISTAS, nunca los gráficos: si al pulsar «Vencidos» el gráfico
   se quedase con una sola barra, se perdería el contexto que justifica el
   filtro. Son botones de verdad, así que funcionan con teclado y con lector
   de pantalla sin añadir nada.

   El contrato del backend NO cambia: se consumen los mismos campos.
   ========================================================================== */

const roleTitles: Record<string, string> = {
  admin_saas: "dashboard.attentionPlatform",
  admin_plataforma: "dashboard.attentionPlatform",
  admin_empresa: "dashboard.attentionCompany",
  rrhh: "dashboard.peopleRecruitment",
  reclutador: "dashboard.recruitment",
  entrevistador: "dashboard.scheduleDecisions",
  instructor: "dashboard.learning",
  supervisor: "dashboard.team",
  inventario: "dashboard.inventory",
  empleado: "dashboard.yourAttention",
};

/** El tono del backend y el del sistema de diseño hablan el mismo idioma. */
const toneMap: Record<OperationalDashboardTone, Tone> = {
  info: "info",
  success: "success",
  warning: "warning",
  danger: "danger",
};

function OperationalItem({
  item,
  now,
  canOpen,
  openLabel,
}: {
  item: OperationalDashboardItemDto;
  now: Date;
  canOpen: boolean;
  openLabel: string;
}) {
  const bucket = dueBucket(item.dueAt, now);
  const overdue = bucket === "overdue";

  return (
    <li
      className={
        "flex flex-col gap-3 rounded-lg border bg-surface-1 p-4 sm:flex-row sm:items-center sm:justify-between " +
        (overdue ? "border-status-danger/40" : "border-line")
      }
    >
      <div className="min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={toneMap[item.tone]} label={item.recordLabel ?? item.module} size="sm" />
          {item.dueAt ? (
            <span
              className={
                "font-mono text-2xs tabular-figures " + (overdue ? "text-status-danger" : "text-ink-3")
              }
            >
              {dueLabel(item.dueAt, now)}
            </span>
          ) : null}
        </div>
        <p className="font-medium text-ink-1">{item.title}</p>
        {item.description ? <p className="text-sm text-ink-2">{item.description}</p> : null}
      </div>
      {canOpen ? (
        <Button asChild variant="secondary" size="sm" className="shrink-0">
          <Link href={item.href}>
            {openLabel}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </Button>
      ) : null}
    </li>
  );
}

export default function DashboardPage() {
  const uiText = useUiText();
  const { allowedNav, currentBranch, currentRole, currentTenant } = useAppStore();
  const { t } = useLocale();

  // Filtros de lectura: viven solo en la pantalla y no viajan al servidor. Se
  // aplican a las LISTAS, nunca a los gráficos.
  const [dueFilter, setDueFilter] = useState<DueBucket | null>(null);
  const [moduleFilter, setModuleFilter] = useState<string | null>(null);

  const dashboard = useQuery({
    // Empresa, sucursal y rol forman parte de la clave: sin ellos, al cambiar
    // de contexto se seguiría mostrando el panel del contexto anterior.
    queryKey: ["operational-dashboard", currentTenant.id, currentBranch?.id, currentRole],
    queryFn: fetchOperationalDashboard,
    refetchInterval: 60_000,
    staleTime: 20_000,
  });

  const data = dashboard.data;
  // Instante del servidor, no el del navegador: los tramos de vencimiento
  // tienen que corresponderse con los datos que se están mostrando.
  const now = useMemo(() => (data ? new Date(data.generatedAt) : new Date()), [data]);
  const everything = useMemo(() => (data ? [...data.tasks, ...data.alerts] : []), [data]);

  const health = useMemo(
    () => operationalHealth(data?.tasks ?? [], data?.alerts ?? [], now),
    [data, now],
  );
  const dueBuckets = useMemo(() => bucketByDue(everything, now), [everything, now]);
  const moduleLoad = useMemo(() => groupByModule(everything, now), [everything, now]);
  const activity = useMemo(() => activityByDay(everything, now, 7), [everything, now]);

  const matches = useMemo(
    () => (item: OperationalDashboardItemDto) =>
      (!dueFilter || dueBucket(item.dueAt, now) === dueFilter) &&
      (!moduleFilter || item.module === moduleFilter),
    [dueFilter, moduleFilter, now],
  );

  const tasks = useMemo(() => sortByPriority(data?.tasks ?? []).filter(matches), [data, matches]);
  const alerts = useMemo(() => sortByPriority(data?.alerts ?? []).filter(matches), [data, matches]);

  const canOpen = (href: string) =>
    href === "/dashboard" ||
    allowedNav.some(
      (item) => href === item.href || href.startsWith(`${item.href}/`) || href.startsWith(`${item.href}?`),
    );

  const header = (
    <PageHeader
      eyebrow={`${t("dashboard.home")} · ${t(`role.${currentRole}`)}`}
      title={t(roleTitles[currentRole] ?? "dashboard.operational")}
      description={uiText("Tareas, alertas y próximos pasos calculados desde registros reales dentro de tu alcance.")}
      meta={
        data ? (
          <>
            <span>
              {t("dashboard.period")}: {data.period.label}
            </span>
            <span>
              {t("dashboard.scope")}: {data.scope}
            </span>
            <span>
              {t("dashboard.source")}: {data.source}
            </span>
            <span className="font-mono tabular-figures">
              {t("dashboard.updated")}:{" "}
              {new Intl.DateTimeFormat(uiText.locale, { hour: "2-digit", minute: "2-digit" }).format(
                new Date(data.generatedAt),
              )}
            </span>
          </>
        ) : null
      }
      actions={
        <Button
          type="button"
          variant="secondary"
          onClick={() => dashboard.refetch()}
          loading={dashboard.isFetching}
          loadingLabel={t("dashboard.refresh")}
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          {t("dashboard.refresh")}
        </Button>
      }
    />
  );

  if (dashboard.isPending) {
    return (
      <div className="space-y-6">
        {header}
        <SkeletonRows rows={5} label={t("dashboard.loading")} />
      </div>
    );
  }

  if (dashboard.isError || !data) {
    return (
      <div className="space-y-6">
        {header}
        <ErrorState
          title={t("dashboard.error")}
          detail={t("dashboard.errorDescription")}
          onRetry={() => dashboard.refetch()}
        />
      </div>
    );
  }

  const hasDueData = dueBuckets.some((entry) => entry.count > 0);
  const hasModules = moduleLoad.length > 0;
  const hasActivity = activity.some((entry) => entry.count > 0);
  const filtering = dueFilter !== null || moduleFilter !== null;
  const totalOverdue = moduleLoad.reduce((sum, entry) => sum + entry.overdue, 0);
  const clearFilters = () => {
    setDueFilter(null);
    setModuleFilter(null);
  };

  return (
    <div className="space-y-6">
      {header}

      {/* ---- 1. La única acción recomendada ---------------------------- */}
      <div className="animate-rise-in">
        {data.nextAction && canOpen(data.nextAction.href) ? (
          <NextAction
            label={t("dashboard.nextAction")}
            title={data.nextAction.title}
            detail={
              data.nextAction.dueAt
                ? `${data.nextAction.description} · ${dueLabel(data.nextAction.dueAt, now)}`
                : data.nextAction.description
            }
            href={data.nextAction.href}
            actionLabel={t("dashboard.open")}
            tone={data.nextAction.tone === "danger" ? "danger" : data.nextAction.tone === "warning" ? "warning" : "progress"}
          />
        ) : (
          <section
            aria-labelledby="sin-urgencias"
            className="flex items-center gap-4 rounded-xl border border-status-success/30 bg-status-success/5 p-5"
          >
            <CircleCheck className="size-7 shrink-0 text-status-success" aria-hidden="true" />
            <div className="min-w-0">
              <h2 id="sin-urgencias" className="font-semibold text-ink-1">
                {t("dashboard.noUrgent")}
              </h2>
              <p className="text-sm text-ink-2">{t("dashboard.noUrgentDescription")}</p>
            </div>
          </section>
        )}
      </div>

      {/* ---- 2. Salud operativa e indicadores ---------------------------
          El medidor va aparte y primero: es el resumen de la pantalla, no una
          métrica más de la fila. Las tres cifras de su pie son exactamente lo
          que penaliza el número, y cada una filtra las listas. */}
      <div style={{ animationDelay: "60ms" }} className="grid animate-rise-in gap-4 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)] xl:items-start">
        <HealthMeter
          label={t("dashboard.health")}
          value={health.score}
          summary={health.summary}
          tone={health.tone === "danger" ? "danger" : health.tone === "warning" ? "warning" : "neutral"}
          breakdown={[
            {
              id: "overdue",
              label: t("dashboard.overdue"),
              count: health.overdue,
              tone: "danger",
              selected: dueFilter === "overdue",
              onSelect: () => setDueFilter(dueFilter === "overdue" ? null : "overdue"),
            },
            {
              id: "today",
              label: t("dashboard.dueToday"),
              count: health.dueToday,
              tone: "warning",
              selected: dueFilter === "today",
              onSelect: () => setDueFilter(dueFilter === "today" ? null : "today"),
            },
            { id: "blocking", label: t("dashboard.blockingAlerts"), count: health.blocking, tone: "danger" },
          ]}
          footnote={t("dashboard.healthFootnote")}
        />

        <PageSection title={t("dashboard.indicators")} id="indicadores">
          <MetricRow className="lg:grid-cols-3">
            {data.metrics.map((metric) => (
              <Metric
                key={metric.key}
                label={metric.label}
                value={String(metric.value)}
                tone={metric.tone === "danger" ? "danger" : metric.tone === "warning" ? "warning" : undefined}
                detail={
                  canOpen(metric.href) ? (
                    <Link
                      href={metric.href}
                      className="inline-flex min-h-11 items-center text-accent-ink underline underline-offset-2"
                    >
                      {t("dashboard.viewRecords")}
                    </Link>
                  ) : undefined
                }
              />
            ))}
          </MetricRow>
        </PageSection>
      </div>

      {/* ---- 3. Reparto: cuándo vence y dónde está ---------------------- */}
      <div style={{ animationDelay: "120ms" }} className="grid animate-rise-in gap-4 lg:grid-cols-2">
        <ChartCard
          title={uiText("Pendientes por vencimiento")}
          subtitle={uiText("Pulsa un tramo para filtrar las listas de abajo")}
          source={data.source}
          period={data.period.label}
        >
          {hasDueData ? (
            <>
              <BarChart
                orientation="horizontal"
                categories={dueBuckets.map((entry) => entry.label)}
                series={[
                  { id: "pendientes", name: uiText("Pendientes"), values: dueBuckets.map((entry) => entry.count) },
                ]}
                // El color dice urgencia, no identidad: el tramo lleva su
                // nombre escrito al lado en el eje y en el filtro.
                categoryColorClasses={dueBuckets.map((entry) => URGENCY_COLOR_CLASS[DUE_BUCKET_TONE[entry.bucket]])}
                caption={uiText("Pendientes agrupados por su fecha límite")}
                categoryLabel={uiText("Tramo")}
                formatValue={(value) => String(value)}
              />
              <ChartFilterChips
                className="mt-4"
                label={uiText("Filtrar por tramo de vencimiento")}
                selected={dueFilter}
                onSelect={(value) => setDueFilter(value as DueBucket | null)}
                options={dueBuckets.map((entry) => ({
                  value: entry.bucket,
                  label: entry.label,
                  count: entry.count,
                  colorClassName: URGENCY_COLOR_CLASS[DUE_BUCKET_TONE[entry.bucket]],
                }))}
              />
            </>
          ) : (
            <BarChart categories={[]} series={[]} emptyReason="sin-registros" />
          )}
        </ChartCard>

        <ChartCard
          title={uiText("Dónde se concentra el trabajo")}
          subtitle={
            // Interpolado, no concatenado: una plantilla con `${}` dentro de
            // `uiText` no existe como clave y se quedaría en español.
            totalOverdue > 0
              ? uiText("Tareas y alertas por módulo · {{count}} vencidas en total", { count: totalOverdue })
              : uiText("Tareas y alertas por módulo")
          }
          source={data.source}
          period={data.period.label}
        >
          {hasModules ? (
            <>
              <BarChart
                orientation="horizontal"
                categories={moduleLoad.map((entry) => entry.module)}
                series={[{ id: "carga", name: uiText("Registros"), values: moduleLoad.map((entry) => entry.total) }]}
                caption={uiText("Tareas y alertas abiertas en cada módulo")}
                categoryLabel={uiText("Módulo")}
                formatValue={(value) => String(value)}
              />
              <ChartFilterChips
                className="mt-4"
                label={uiText("Filtrar por módulo")}
                selected={moduleFilter}
                onSelect={setModuleFilter}
                // «Otros» agrupa la cola larga, así que no designa un módulo
                // real y no puede filtrar nada: se dibuja pero no se ofrece.
                options={moduleLoad
                  .filter((entry) => entry.module !== OTHER_MODULES_LABEL)
                  .map((entry) => ({ value: entry.module, label: entry.module, count: entry.total }))}
              />
            </>
          ) : (
            <BarChart categories={[]} series={[]} emptyReason="sin-registros" />
          )}
        </ChartCard>
      </div>

      {/* ---- 4. Tendencia ----------------------------------------------
          A todo el ancho: una serie temporal necesita recorrido horizontal
          para que se vea la forma, y en media columna siete días quedaban
          apretados contra el eje. */}
      <div style={{ animationDelay: "180ms" }} className="animate-rise-in">
        <ChartCard
          title={uiText("Actividad de los últimos 7 días")}
          subtitle={uiText("Tareas y alertas registradas cada día")}
          source={data.source}
          period={data.period.label}
        >
          {hasActivity ? (
            <LineChart
              series={[
                {
                  id: "actividad",
                  name: uiText("Registros"),
                  variant: "area",
                  points: activity.map((entry, index) => ({ x: index, y: entry.count, label: entry.label })),
                },
              ]}
              caption={uiText("Tareas y alertas registradas por día")}
              xLabel={uiText("Día")}
              formatValue={(value) => String(value)}
              formatX={(value) => activity[Math.round(value)]?.label ?? ""}
            />
          ) : (
            <LineChart series={[]} emptyReason="sin-registros" />
          )}
        </ChartCard>
      </div>

      {/* ---- 5. Alertas y pendientes ------------------------------------ */}
      {filtering ? (
        <div
          role="status"
          className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-accent-line/40 bg-accent-fill/5 px-4 py-2.5"
        >
          <Filter className="size-4 shrink-0 text-accent-ink" aria-hidden="true" />
          <p className="min-w-0 text-sm text-ink-1">
            {t("dashboard.filteredBy")}{" "}
            <strong className="font-medium">
              {[dueFilter ? dueBuckets.find((entry) => entry.bucket === dueFilter)?.label : null, moduleFilter]
                .filter(Boolean)
                .join(" · ")}
            </strong>{" "}
            <span className="text-ink-2">
              {t("dashboard.filteredCount", { tasks: tasks.length, alerts: alerts.length })}
            </span>
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-sm font-medium text-accent-ink underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <X className="size-4" aria-hidden="true" />
            {t("dashboard.clearFilter")}
          </button>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
        <PageSection
          title={t("dashboard.pendingTasks")}
          description={tasks.length > 0 ? `${tasks.length} en total, lo más urgente primero` : undefined}
          id="pendientes"
        >
          {tasks.length === 0 ? (
            <EmptyList
              message={filtering ? t("dashboard.noMatchesForFilter") : t("dashboard.noPendingTasks")}
              actionLabel={filtering ? t("dashboard.clearFilter") : undefined}
              onAction={filtering ? clearFilters : undefined}
            />
          ) : (
            <ul className="space-y-2">
              {tasks.map((item) => (
                <OperationalItem
                  key={item.id}
                  item={item}
                  now={now}
                  canOpen={canOpen(item.href)}
                  openLabel={t("dashboard.openRecord")}
                />
              ))}
            </ul>
          )}
        </PageSection>

        <PageSection title={t("dashboard.criticalAlerts")} id="alertas">
          {alerts.length === 0 ? (
            <EmptyList
              message={filtering ? t("dashboard.noMatchesForFilter") : t("dashboard.noCriticalAlerts")}
              actionLabel={filtering ? t("dashboard.clearFilter") : undefined}
              onAction={filtering ? clearFilters : undefined}
            />
          ) : (
            <ul className="space-y-2">
              {alerts.map((item) => (
                <OperationalItem
                  key={item.id}
                  item={item}
                  now={now}
                  canOpen={canOpen(item.href)}
                  openLabel={t("dashboard.open")}
                />
              ))}
            </ul>
          )}
        </PageSection>
      </div>

      <p className="text-2xs text-ink-3">{t("dashboard.autoUpdate")}</p>
    </div>
  );
}

/**
 * Lista vacía.
 *
 * Distingue «no hay nada» de «tu filtro no encuentra nada», que son dos
 * situaciones con salidas distintas: en la segunda se ofrece quitar el filtro,
 * porque si no, la pantalla parece rota.
 */
function EmptyList({
  message,
  actionLabel,
  onAction,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-lg border border-dashed border-line px-4 py-8 text-center">
      <p className="text-sm text-ink-2">{message}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-1 inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-accent-ink underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
