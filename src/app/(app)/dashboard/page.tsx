"use client";

import Link from "next/link";
import { ArrowRight, CircleCheck, RefreshCw } from "lucide-react";
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
import { BarChart, ChartCard } from "@/components/chart";
import {
  activityByDay,
  bucketByDue,
  dueBucket,
  dueLabel,
  operationalHealth,
  sortByPriority,
} from "@/lib/dashboard-insights";

/* ==========================================================================
   INICIO · CENTRO OPERATIVO
   ==========================================================================
   Qué cambió respecto de la versión anterior:

   · Antes la pantalla listaba métricas, tareas y alertas con el mismo peso
     visual, dentro de tarjetas iguales. Ahora hay UNA acción recomendada
     destacada y el resto se ordena por urgencia debajo.
   · Se añaden dos gráficos. Los dos salen de campos REALES de cada registro
     —`dueAt` y `occurredAt`—, no de datos inventados: el endpoint
     `/dashboard/operational` no entrega series temporales, y en vez de
     simular una se muestra lo que de verdad se sabe. La lógica vive en
     `lib/dashboard-insights.ts`, que está probada.
   · El instante de referencia es `generatedAt`, el del servidor, y no el reloj
     del navegador: así los tramos de vencimiento coinciden con los datos que
     se están mostrando y el render es determinista.

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
  const { allowedNav, currentBranch, currentRole, currentTenant } = useAppStore();
  const { t } = useLocale();

  const dashboard = useQuery({
    // Empresa, sucursal y rol forman parte de la clave: sin ellos, al cambiar
    // de contexto se seguiría mostrando el panel del contexto anterior.
    queryKey: ["operational-dashboard", currentTenant.id, currentBranch?.id, currentRole],
    queryFn: fetchOperationalDashboard,
    refetchInterval: 60_000,
    staleTime: 20_000,
  });

  const canOpen = (href: string) =>
    href === "/dashboard" ||
    allowedNav.some(
      (item) => href === item.href || href.startsWith(`${item.href}/`) || href.startsWith(`${item.href}?`),
    );

  const header = (
    <PageHeader
      eyebrow={`${t("dashboard.home")} · ${t(`role.${currentRole}`)}`}
      title={t(roleTitles[currentRole] ?? "dashboard.operational")}
      description="Tareas, alertas y próximos pasos calculados desde registros reales dentro de tu alcance."
      meta={
        dashboard.data ? (
          <>
            <span>
              {t("dashboard.period")}: {dashboard.data.period.label}
            </span>
            <span>
              {t("dashboard.scope")}: {dashboard.data.scope}
            </span>
            <span>
              {t("dashboard.source")}: {dashboard.data.source}
            </span>
            <span className="font-mono tabular-figures">
              {t("dashboard.updated")}:{" "}
              {new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit" }).format(
                new Date(dashboard.data.generatedAt),
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

  if (dashboard.isError || !dashboard.data) {
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

  const data = dashboard.data;
  // Instante del servidor, no el del navegador: los tramos de vencimiento
  // tienen que corresponderse con los datos que se están mostrando.
  const now = new Date(data.generatedAt);
  const tasks = sortByPriority(data.tasks);
  const alerts = sortByPriority(data.alerts);
  const health = operationalHealth(data.tasks, data.alerts, now);
  const dueBuckets = bucketByDue(data.tasks, now);
  const activity = activityByDay([...data.tasks, ...data.alerts], now, 7);
  const hasDueData = dueBuckets.some((entry) => entry.count > 0);
  const hasActivity = activity.some((entry) => entry.count > 0);

  return (
    <div className="space-y-6">
      {header}

      {/* ---- 1. La única acción recomendada ---------------------------- */}
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

      {/* ---- 2. Salud operativa e indicadores --------------------------- */}
      <PageSection title={t("dashboard.indicators")} id="indicadores">
        <MetricRow>
          <Metric
            label="Salud operativa"
            value={`${health.score}%`}
            detail={health.summary}
            tone={health.tone === "info" ? undefined : health.tone === "danger" ? "danger" : health.tone === "warning" ? "warning" : "success"}
          />
          {data.metrics.map((metric) => (
            <Metric
              key={metric.key}
              label={metric.label}
              value={String(metric.value)}
              tone={metric.tone === "danger" ? "danger" : metric.tone === "warning" ? "warning" : undefined}
              detail={
                canOpen(metric.href) ? (
                  <Link href={metric.href} className="text-accent-ink underline underline-offset-2">
                    {t("dashboard.viewRecords")}
                  </Link>
                ) : undefined
              }
            />
          ))}
        </MetricRow>
      </PageSection>

      {/* ---- 3. Tendencias --------------------------------------------- */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Pendientes por vencimiento"
          subtitle="Reparto de los pendientes que tienes a la vista"
          source={data.source}
          period={data.period.label}
        >
          {hasDueData ? (
            <BarChart
              categories={dueBuckets.map((entry) => entry.label)}
              series={[{ id: "pendientes", name: "Pendientes", values: dueBuckets.map((entry) => entry.count) }]}
              caption="Pendientes agrupados por su fecha límite"
              categoryLabel="Tramo"
              formatValue={(value) => String(value)}
            />
          ) : (
            <BarChart categories={[]} series={[]} emptyReason="sin-registros" />
          )}
        </ChartCard>

        <ChartCard
          title="Actividad de los últimos 7 días"
          subtitle="Tareas y alertas registradas cada día"
          source={data.source}
          period={data.period.label}
        >
          {hasActivity ? (
            <BarChart
              categories={activity.map((entry) => entry.label)}
              series={[{ id: "actividad", name: "Registros", values: activity.map((entry) => entry.count) }]}
              caption="Tareas y alertas registradas por día"
              categoryLabel="Día"
              formatValue={(value) => String(value)}
            />
          ) : (
            <BarChart categories={[]} series={[]} emptyReason="sin-registros" />
          )}
        </ChartCard>
      </div>

      {/* ---- 4. Alertas y pendientes ------------------------------------ */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
        <PageSection
          title={t("dashboard.pendingTasks")}
          description={tasks.length > 0 ? `${tasks.length} en total, lo más urgente primero` : undefined}
          id="pendientes"
        >
          {tasks.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-sm text-ink-2">
              {t("dashboard.noPendingTasks")}
            </p>
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
            <p className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-sm text-ink-2">
              {t("dashboard.noCriticalAlerts")}
            </p>
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
