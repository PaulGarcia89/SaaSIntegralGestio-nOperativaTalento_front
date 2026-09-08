"use client";

import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { useAppStore } from "@/store/app-store";
import { fetchEmployeesSummary, fetchProductivityOverview, getApiErrorMessage } from "@/lib/backend";
import { ErrorState, PageHeader, SkeletonRows } from "@/components/system";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ReportRow = { key: string; value: number };

function ReportView({ module, rows, pending, error, refresh, updated }: {
  module: "people" | "productivity"; rows: ReportRow[]; pending: boolean;
  error: unknown; refresh: () => void; updated: number;
}) {
  const { t, locale } = useLocale();
  const { currentTenant, currentBranch } = useAppStore();
  return <div className="space-y-5">
    <PageHeader eyebrow={t(`moduleReports.${module}`)} title={t("nav.Reportes")} description={t(`moduleReports.${module}Description`)} actions={<Button variant="secondary" onClick={refresh}><RefreshCw className="size-4" />{t("moduleReports.refresh")}</Button>} />
    <p className="text-sm text-muted-foreground">{currentTenant.name} · {currentBranch?.name}{updated ? ` · ${t("moduleReports.updated")} ${new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(updated)}` : ""}</p>
    {pending ? <SkeletonRows rows={4} label={t("moduleReports.loading")} /> : error ? <ErrorState title={t("moduleReports.error")} detail={getApiErrorMessage(error, t("moduleReports.retry"))} onRetry={refresh} /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{rows.map(row => <Card key={row.key}><CardContent className="p-5"><p className="text-sm text-muted-foreground">{t(`moduleReports.${row.key}`)}</p><p className="mt-2 text-3xl font-semibold tabular-nums">{new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(row.value)}</p></CardContent></Card>)}</div>}
  </div>;
}

export function PeopleReports() {
  const { currentTenant, currentBranch, can } = useAppStore();
  const query = useQuery({ queryKey: ["people-reports", currentTenant.id, currentBranch?.id], queryFn: () => fetchEmployeesSummary(currentBranch?.id), enabled: Boolean(currentBranch) && can("employees.read") });
  const data = query.data;
  const rows: ReportRow[] = data ? [
    { key: "employees", value: data.headcount.total }, { key: "activeEmployees", value: data.headcount.active },
    { key: "inactiveEmployees", value: data.headcount.inactive }, { key: "suspendedEmployees", value: data.headcount.suspended },
    { key: "terminatedEmployees", value: data.headcount.terminated }, { key: "incompleteProfiles", value: data.incompleteProfiles.count },
    { key: "pendingDocuments", value: data.documents.pendingReview }, { key: "expiredDocuments", value: data.documents.expired },
    { key: "expiringDocuments", value: data.documents.expiringWithin30Days },
  ] : [];
  return <ReportView module="people" rows={rows} pending={query.isPending} error={query.error} updated={query.dataUpdatedAt} refresh={() => void query.refetch()} />;
}

export function ProductivityReports() {
  const { currentTenant, currentBranch, can, hasModule } = useAppStore();
  const query = useQuery({ queryKey: ["productivity-reports", currentTenant.id, currentBranch?.id], queryFn: () => fetchProductivityOverview(currentBranch?.id), enabled: Boolean(currentBranch) && can("productivity.view") && hasModule("productivity") });
  const data = query.data;
  const rows: ReportRow[] = data ? [
    { key: "events", value: data.totalEvents }, { key: "activeMinutes", value: data.activeSeconds / 60 },
    { key: "idleMinutes", value: data.idleSeconds / 60 }, { key: "tasks", value: data.taskCount },
    { key: "cameras", value: data.camerasOnline }, { key: "zones", value: data.zonesActive }, { key: "alerts", value: data.alertsOpen },
  ] : [];
  return <ReportView module="productivity" rows={rows} pending={query.isPending} error={query.error} updated={query.dataUpdatedAt} refresh={() => void query.refetch()} />;
}
