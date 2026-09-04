"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  CalendarClock,
  CheckCircle2,
  Clock3,
  RefreshCw,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchOperationalDashboard } from "@/lib/backend";
import type {
  OperationalDashboardItemDto,
  OperationalDashboardTone,
} from "@/lib/contracts";
import { useAppStore } from "@/store/app-store";
import {
  InlineFeedback,
  PageHeader,
} from "@/components/design-system";
import { AsyncState } from "@/components/async-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/components/locale-provider";

const toneStyles: Record<OperationalDashboardTone, string> = {
  info: "border-status-info/30 bg-status-info/5",
  success: "border-status-success/30 bg-status-success/5",
  warning: "border-status-warning/35 bg-status-warning/5",
  danger: "border-status-danger/35 bg-status-danger/5",
};

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

export default function DashboardPage() {
  const {
    allowedNav,
    currentBranch,
    currentRole,
    currentTenant,
  } = useAppStore();
  const { locale, t } = useLocale();
  const dashboard = useQuery({
    queryKey: [
      "operational-dashboard",
      currentTenant.id,
      currentBranch?.id,
      currentRole,
    ],
    queryFn: fetchOperationalDashboard,
    refetchInterval: 60_000,
    staleTime: 20_000,
  });
  const canOpen = (href: string) =>
    href === "/dashboard" ||
    allowedNav.some(
      (item) =>
        href === item.href ||
        href.startsWith(`${item.href}/`) ||
        href.startsWith(`${item.href}?`),
    );

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={`${t("dashboard.home")} · ${t(`role.${currentRole}`)}`}
        title={t(roleTitles[currentRole] ?? "dashboard.operational")}
        description="Tareas, alertas y próximos pasos calculados desde registros reales dentro de tu alcance."
        actions={
          <Button
            type="button"
            variant="secondary"
            onClick={() => dashboard.refetch()}
            disabled={dashboard.isFetching}
          >
            <RefreshCw
              className={`size-4 ${dashboard.isFetching ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            {t("dashboard.refresh")}
          </Button>
        }
      />

      {dashboard.isPending ? (
        <AsyncState state="loading" title={t("dashboard.loading")} />
      ) : dashboard.isError || !dashboard.data ? (
        <AsyncState
          state="error"
          title={t("dashboard.error")}
          description={t("dashboard.errorDescription")}
          onRetry={() => dashboard.refetch()}
        />
      ) : (
        <>
          <section
            aria-label={t("dashboard.sourceLabel")}
            className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-surface-section p-4 text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <span>
                    <strong className="text-text-primary">{t("dashboard.period")}:</strong>{" "}
                {dashboard.data.period.label}
              </span>
              <span>
                    <strong className="text-text-primary">{t("dashboard.source")}:</strong>{" "}
                {dashboard.data.source}
              </span>
              <span>
                    <strong className="text-text-primary">{t("dashboard.scope")}:</strong>{" "}
                    {scopeLabel(dashboard.data.scope, currentBranch?.name, t)}
              </span>
            </div>
            <span className="shrink-0">
                {t("dashboard.updated")} {formatDateTime(dashboard.data.generatedAt, locale)}
            </span>
          </section>

          {dashboard.data.nextAction ? (
            <section aria-labelledby="next-action-title">
              <Card
                level={1}
                className={`border-2 ${toneStyles[dashboard.data.nextAction.tone]}`}
              >
                <CardContent className="flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-surface-elevated">
                      <CalendarClock className="size-6" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                        {t("dashboard.nextAction")}
                      </p>
                      <h2 id="next-action-title" className="mt-1 text-xl font-semibold">
                        {dashboard.data.nextAction.title}
                      </h2>
                      <p className="mt-1 text-sm text-text-secondary">
                        {dashboard.data.nextAction.description}
                      </p>
                      <ItemMetadata item={dashboard.data.nextAction} locale={locale} t={t} />
                    </div>
                  </div>
                  {canOpen(dashboard.data.nextAction.href) ? (
                    <Button asChild className="shrink-0">
                      <Link href={dashboard.data.nextAction.href}>
                        {t("dashboard.openRecord")}
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            </section>
          ) : (
            <InlineFeedback tone="success" title={t("dashboard.noUrgent")}>
              {t("dashboard.noUrgentDescription")}
            </InlineFeedback>
          )}

          <section
            aria-label={t("dashboard.indicators")}
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            {dashboard.data.metrics.map((metric) => (
              <Card
                level={2}
                key={metric.key}
                className={toneStyles[metric.tone]}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base">{metric.label}</CardTitle>
                    <StatusIcon tone={metric.tone} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-3xl font-semibold tabular-nums">
                    {metric.value}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {dashboard.data.period.label} · {dashboard.data.source}
                  </p>
                  {canOpen(metric.href) ? (
                    <Button asChild variant="secondary" className="w-full">
                      <Link href={metric.href}>
                        {t("dashboard.viewRecords")}
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </section>

          <div className="grid gap-5 xl:grid-cols-2">
            <OperationalList
              title={t("dashboard.pendingTasks")}
              emptyTitle={t("dashboard.noPendingTasks")}
              icon={<Clock3 className="size-5" aria-hidden="true" />}
              items={dashboard.data.tasks}
              canOpen={canOpen}
              emptyDescription={t("dashboard.autoUpdate")}
              openLabel={t("dashboard.open")}
              locale={locale}
              t={t}
            />
            <OperationalList
              title={t("dashboard.criticalAlerts")}
              emptyTitle={t("dashboard.noCriticalAlerts")}
              icon={<BellRing className="size-5" aria-hidden="true" />}
              items={dashboard.data.alerts}
              canOpen={canOpen}
              emptyDescription={t("dashboard.autoUpdate")}
              openLabel={t("dashboard.open")}
              locale={locale}
              t={t}
            />
          </div>
        </>
      )}
    </div>
  );
}

function OperationalList({
  title,
  emptyTitle,
  icon,
  items,
  canOpen,
  emptyDescription,
  openLabel,
  locale,
  t,
}: {
  title: string;
  emptyTitle: string;
  icon: React.ReactNode;
  items: OperationalDashboardItemDto[];
  canOpen: (href: string) => boolean;
  emptyDescription: string;
  openLabel: string;
  locale: string;
  t: (key: string) => string;
}) {
  return (
    <Card level={2}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
          <Badge variant="secondary">{items.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-center">
            <CheckCircle2
              className="size-8 text-status-success"
              aria-hidden="true"
            />
            <p className="font-medium">{emptyTitle}</p>
            <p className="text-sm text-text-secondary">
              {emptyDescription}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/70">
            {items.map((item) => (
              <li key={`${item.kind}-${item.id}`} className="py-4 first:pt-0 last:pb-0">
                <article className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <StatusIcon tone={item.tone} />
                    <div>
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="mt-1 text-sm text-text-secondary">
                        {item.description}
                      </p>
                      <ItemMetadata item={item} locale={locale} t={t} />
                    </div>
                  </div>
                  {canOpen(item.href) ? (
                    <Button asChild size="sm" variant="secondary" className="shrink-0">
                      <Link href={item.href} aria-label={`${openLabel} ${item.title}`}>
                        {openLabel}
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  ) : null}
                </article>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ItemMetadata({ item, locale, t }: { item: OperationalDashboardItemDto; locale: string; t: (key: string) => string }) {
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
      <span>{item.module}</span>
      {item.recordLabel ? <span>{t("dashboard.record")}: {item.recordLabel}</span> : null}
      {item.dueAt ? <span>{t("dashboard.due")}: {formatDateTime(item.dueAt, locale)}</span> : null}
      <span>{t("dashboard.updated")}: {formatDateTime(item.occurredAt, locale)}</span>
    </div>
  );
}

function StatusIcon({ tone }: { tone: OperationalDashboardTone }) {
  if (tone === "success") {
    return <CheckCircle2 className="size-5 shrink-0 text-status-success" aria-hidden="true" />;
  }
  if (tone === "danger" || tone === "warning") {
    return (
      <AlertTriangle
        className={`size-5 shrink-0 ${
          tone === "danger" ? "text-status-danger" : "text-status-warning"
        }`}
        aria-hidden="true"
      />
    );
  }
  return <Clock3 className="size-5 shrink-0 text-status-info" aria-hidden="true" />;
}

function formatDateTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function scopeLabel(scope: "GLOBAL" | "TENANT" | "BRANCH", branch: string | undefined, t: (key: string) => string) {
  if (scope === "GLOBAL") return t("dashboard.allCompanies");
  if (scope === "BRANCH") return branch ?? t("dashboard.activeBranch");
  return t("dashboard.activeCompany");
}
