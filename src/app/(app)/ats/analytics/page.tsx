"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BriefcaseBusiness, Clock3, DollarSign, Download, RefreshCw, Save, Star, Target, Users } from "lucide-react";
import { toast } from "sonner";
import { AsyncState } from "@/components/async-state";
import { InlineFeedback, PageHeader } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type AtsAnalyticsQuery, downloadTextFile, fetchAtsAnalytics, fetchAtsAnalyticsDashboards, fetchAtsAnalyticsExport, fetchAtsHiringQuality, fetchAtsSourceCosts, fetchCandidateConversionMetrics, fetchVacancies, saveAtsAnalyticsDashboard, saveAtsHiringQuality, saveAtsSourceCost } from "@/lib/backend";
import type { AtsAnalyticsDto } from "@/lib/contracts";
import { useAppStore } from "@/store/app-store";
import { useLocale } from "@/components/locale-provider";

export default function AtsAnalyticsPage() {
  const { t } = useLocale();
  const { can, currentBranch, currentTenant, tenantBranches, tenantUsers } = useAppStore();
  const [filters, setFilters] = useState<AtsAnalyticsQuery>(() => defaultFilters());
  const [dashboardName, setDashboardName] = useState("");
  const [costOpen, setCostOpen] = useState(false);
  const [qualityOpen, setQualityOpen] = useState(false);
  const vacancies = useQuery({ queryKey: ["vacancies", "ats-analytics"], queryFn: fetchVacancies });
  const analytics = useQuery({
    queryKey: ["ats-analytics", currentTenant.id, filters],
    queryFn: () => fetchAtsAnalytics(filters),
    staleTime: 30_000,
  });
  const dashboards = useQuery({ queryKey: ["ats-analytics-dashboards"], queryFn: fetchAtsAnalyticsDashboards });
  const candidateJourney = useQuery({ queryKey: ["candidate-conversion-metrics", currentTenant.id], queryFn: fetchCandidateConversionMetrics, staleTime: 30_000 });
  const saveDashboard = useMutation({ mutationFn: () => saveAtsAnalyticsDashboard({ ...filters, name: dashboardName.trim(), widgets: ["summary", "funnel", "sources", "recruiters", "sla", "interviews", "offers"] }), onSuccess: async () => { setDashboardName(""); await dashboards.refetch(); toast.success("Dashboard guardado"); }, onError: () => toast.error("No fue posible guardar el dashboard") });
  const exporter = useMutation({
    mutationFn: () => fetchAtsAnalyticsExport(filters),
    onSuccess: (file) => { downloadTextFile(file); toast.success(t("analytics.exported"), { description: file.filename }); },
    onError: () => toast.error(t("analytics.exportFailed")),
  });
  const recruiters = useMemo(() => tenantUsers.filter((user) => ["rrhh", "reclutador", "admin_empresa"].includes(user.role)), [tenantUsers]);

  const setPeriod = (days: number) => {
    const to = new Date();
    const from = new Date(to.getTime() - (days - 1) * 86_400_000);
    setFilters((current) => ({ ...current, from: inputDate(from), to: inputDate(to), granularity: days <= 31 ? "day" : days <= 120 ? "week" : "month" }));
  };

  return <div className="space-y-7">
    <PageHeader
      eyebrow={t("analytics.eyebrow")}
      title={t("analytics.title")}
      description={t("analytics.description")}
      actions={<div className="flex flex-wrap gap-2">
        {can("candidates.update") ? <Button variant="secondary" onClick={() => setCostOpen(true)}><DollarSign className="size-4" />Registrar coste</Button> : null}
        {can("candidates.update") ? <Button variant="secondary" onClick={() => setQualityOpen(true)}><Star className="size-4" />Calidad 30/60/90</Button> : null}
        {can("reports.export") ? <Button onClick={() => exporter.mutate()} disabled={!analytics.data || exporter.isPending}><Download className="size-4" />{exporter.isPending ? "Exportando…" : t("analytics.exportCsv")}</Button> : null}
        <Button variant="secondary" onClick={() => analytics.refetch()} disabled={analytics.isFetching}><RefreshCw className={`size-4 ${analytics.isFetching ? "animate-spin" : ""}`} />Actualizar</Button>
      </div>}
    />
    <Card level={2}><CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_auto_auto]"><FormSelect value="" placeholder="Cargar dashboard guardado" onValueChange={(value) => { const selected = dashboards.data?.find((item) => item.id === value); if (selected) setFilters(selected.filters.query as AtsAnalyticsQuery); }} options={(dashboards.data ?? []).map((item) => ({ value: item.id, label: item.isDefault ? `${item.name} (predeterminado)` : item.name }))} /><Input value={dashboardName} onChange={(event) => setDashboardName(event.target.value)} maxLength={100} placeholder={t("analytics.dashboardName")} /><Button variant="secondary" disabled={dashboardName.trim().length < 2 || saveDashboard.isPending} onClick={() => saveDashboard.mutate()}><Save className="size-4" />{t("analytics.saveView")}</Button></CardContent></Card>

    <Card level={2} className="overflow-hidden">
      <div className="h-1 bg-[linear-gradient(90deg,var(--color-primary),var(--color-status-success),var(--color-status-warning))]" />
      <CardContent className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-6">
        <Filter label={t("analytics.from")}><Input type="date" value={filters.from ?? ""} onChange={(event) => setFilters({ ...filters, from: event.target.value })} /></Filter>
        <Filter label={t("analytics.to")}><Input type="date" value={filters.to ?? ""} onChange={(event) => setFilters({ ...filters, to: event.target.value })} /></Filter>
        <Filter label={t("analytics.branch")}><FormSelect value={filters.scope === "tenant" ? "ALL" : filters.branchId ?? currentBranch?.id ?? "ALL"} onValueChange={(value) => setFilters({ ...filters, branchId: value === "ALL" ? undefined : value, scope: value === "ALL" ? "tenant" : "context" })} options={[{ value: "ALL", label: t("analytics.allAllowed") }, ...tenantBranches.map((branch) => ({ value: branch.id, label: branch.name }))]} /></Filter>
        <Filter label={t("analytics.vacancy")}><FormSelect value={filters.vacancyId ?? "ALL"} onValueChange={(value) => setFilters({ ...filters, vacancyId: value === "ALL" ? undefined : value })} options={[{ value: "ALL", label: t("analytics.allVacancies") }, ...(vacancies.data?.data ?? []).map((vacancy) => ({ value: vacancy.id, label: vacancy.title }))]} /></Filter>
        <Filter label={t("analytics.recruiter")}><FormSelect value={filters.recruiterId ?? "ALL"} onValueChange={(value) => setFilters({ ...filters, recruiterId: value === "ALL" ? undefined : value })} options={[{ value: "ALL", label: t("analytics.wholeTeam") }, ...recruiters.map((user) => ({ value: user.id, label: user.fullName }))]} /></Filter>
        <Filter label={t("analytics.grouping")}><FormSelect value={filters.granularity ?? "week"} onValueChange={(value) => setFilters({ ...filters, granularity: value as "day" | "week" | "month" })} options={[{ value: "day", label: "Diaria" }, { value: "week", label: "Semanal" }, { value: "month", label: "Mensual" }]} /></Filter>
        <div className="flex flex-wrap gap-2 md:col-span-2 xl:col-span-6">{[7, 30, 90, 180].map((days) => <Button key={days} size="sm" variant="secondary" onClick={() => setPeriod(days)}>{days} días</Button>)}</div>
      </CardContent>
    </Card>

    {analytics.isPending ? <AsyncState state="loading" title={t("analytics.calculating")} description={t("analytics.calculatingBody")} /> : null}
    {analytics.isError ? <AsyncState state="error" title={t("analytics.calcError")} description={analytics.error instanceof Error ? analytics.error.message : t("analytics.checkScope")} onRetry={() => analytics.refetch()} /> : null}
    {analytics.data ? <AnalyticsContent data={analytics.data} candidateJourney={candidateJourney.data} /> : null}
    <SourceCostDialog open={costOpen} onOpenChange={setCostOpen} />
    <HiringQualityDialog open={qualityOpen} onOpenChange={setQualityOpen} />
  </div>;
}

function AnalyticsContent({ data, candidateJourney }: { data: AtsAnalyticsDto; candidateJourney?: Awaited<ReturnType<typeof fetchCandidateConversionMetrics>> }) {
  const { t } = useLocale();
  return <div className="space-y-7">
    <section className="flex flex-col gap-2 rounded-2xl border bg-surface-section p-4 text-sm text-text-secondary lg:flex-row lg:items-center lg:justify-between">
      <span><strong className="text-text-primary">Periodo:</strong> {formatDate(data.period.from)} – {formatDate(data.period.to)}</span>
      <span><strong className="text-text-primary">Alcance:</strong> {data.scope.branchName ?? (data.scope.type === "GLOBAL" ? "Global" : t("analytics.wholeCompany"))}</span>
      <span><strong className="text-text-primary">Fuente:</strong> datos persistentes</span>
      <span>Actualizado {formatDateTime(data.generatedAt)}</span>
    </section>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={Users} label={t("analytics.applications")} value={data.summary.applications} change={data.summary.changes.applications} detail={`${data.summary.uniqueCandidates} candidatos únicos`} />
      <Metric icon={Target} label={t("analytics.conversionToHire")} value={`${data.summary.conversionRate}%`} change={data.summary.changes.conversionRate} detail={`${data.summary.hires} contrataciones`} points />
      <Metric icon={Clock3} label={t("analytics.avgTimeToHire")} value={duration(data.summary.averageTimeToHireHours)} change={data.summary.changes.averageTimeToHireHours} detail={`Mediana ${duration(data.summary.medianTimeToHireHours)}`} inverse />
      <Metric icon={Activity} label={t("analytics.slaCompliance")} value={`${data.sla.complianceRate}%`} detail={`${data.sla.breached} fuera de SLA`} tone={data.sla.complianceRate < 70 ? "danger" : data.sla.complianceRate < 90 ? "warning" : "success"} />
    </section>

    {data.insights.length ? <section aria-labelledby="ats-insights"><h2 id="ats-insights" className="mb-3 text-xl font-semibold">{t("analytics.signals")}</h2><div className="grid gap-3 lg:grid-cols-2">{data.insights.map((insight) => <InlineFeedback key={insight.code} tone={insight.severity === "critical" ? "danger" : insight.severity === "warning" ? "warning" : "info"} title={insight.title}>{insight.detail}</InlineFeedback>)}</div></section> : <InlineFeedback tone="success" title={t("analytics.underControl")}>{t("analytics.noSignals")}</InlineFeedback>}

    <section className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
      <Card level={2}><CardHeader><CardTitle>{t("analytics.funnel")}</CardTitle><p className="text-sm text-text-secondary">{t("analytics.funnelBody")}</p></CardHeader><CardContent><Funnel rows={data.funnel} total={data.summary.applications} /></CardContent></Card>
      <Card level={2}><CardHeader><CardTitle>{t("analytics.volumeAndDecisions")}</CardTitle><p className="text-sm text-text-secondary">Evolución {granularityLabel(data.filters.granularity).toLocaleLowerCase()} de nuevas postulaciones.</p></CardHeader><CardContent><Trend rows={data.trends} /></CardContent></Card>
    </section>

    <CandidateJourneyCard data={candidateJourney} />

    <section className="grid gap-5 xl:grid-cols-3">
      <OperationalCard title={t("analytics.interviews")} value={`${data.interviews.completionRate}%`} label="completadas" rows={[["Sesiones", data.interviews.total], ["Ausencias", `${data.interviews.noShowRate}%`], [t("analytics.avgRating"), data.interviews.averageScore || "—"], ["Anticipación", duration(data.interviews.averageSchedulingLeadHours)]]} />
      <OperationalCard title="Ofertas" value={`${data.offers.acceptanceRate}%`} label="aceptadas" rows={[["Emitidas", data.offers.total], ["Aceptadas", data.offers.accepted], ["Contrapropuestas", `${data.offers.counterOfferRate}%`], [t("analytics.approvalTime"), duration(data.offers.averageApprovalHours)]]} />
      <OperationalCard title={t("analytics.slaPipeline")} value={data.sla.breached} label="casos vencidos" rows={[["Medibles", data.sla.measurable], ["Advertencias", data.sla.warningSent], ["Escalados", data.sla.escalated], ["Reasignados", data.sla.reassigned]]} danger={data.sla.breached > 0} />
    </section>

    <section className="grid gap-5 xl:grid-cols-2">
      <TableCard title={t("analytics.efficiencyAndCost")} headers={["Fuente", t("analytics.applications"), t("analytics.hires"), "Coste", "Coste/contratación"]} rows={data.sources.map((item) => [item.source, item.applications, item.hires, money(item.cost, item.currency), item.costPerHire === null ? "—" : money(item.costPerHire, item.currency)])} />
      <TableCard title={t("analytics.hireQuality")} headers={["Hito", "Revisiones", t("analytics.avgPerformance"), t("analytics.retention")]} rows={data.qualityOfHire.byCheckpoint.map((item) => [`${item.checkpointDays} días`, item.reviews, item.averagePerformanceScore ? `${item.averagePerformanceScore}/5` : "—", `${item.retentionRate}%`])} />
      <TableCard title={t("analytics.rejectionReasons")} headers={[t("analytics.reason"), t("analytics.category"), "Casos", "Peso"]} rows={data.rejectionReasons.map((item) => [item.label, item.category ?? t("analytics.unclassified"), item.count, `${item.percentage}%`])} />
      <TableCard title={t("analytics.vacancyPerformance")} headers={[t("analytics.vacancy"), t("analytics.applications"), t("analytics.hires"), "Cobertura", t("analytics.daysOpen")]} rows={data.vacancies.map((item) => [item.title, item.applications, item.hires, `${item.fillRate}%`, item.daysOpen])} />
      <TableCard title={t("analytics.recruiterLoad")} headers={[t("analytics.owner"), "Activas", t("analytics.outOfSla"), t("analytics.conversion"), "Edad media"]} rows={data.recruiters.map((item) => [item.name, item.active, item.overdue, `${item.conversionRate}%`, duration(item.averageActiveStageHours)])} />
    </section>
  </div>;
}

function CandidateJourneyCard({ data }: { data?: Awaited<ReturnType<typeof fetchCandidateConversionMetrics>> }) {
  const { t } = useLocale();
  if (!data) return <Card level={2}><CardHeader><CardTitle>{t("analytics.applicationConversion")}</CardTitle></CardHeader><CardContent><p className="text-sm text-text-secondary">{t("analytics.loadingDrafts")}</p></CardContent></Card>;
  const { totals } = data;
  const stages = [
    ["Iniciaron", totals.started, "bg-primary"],
    ["Pausaron", totals.paused, "bg-status-warning"],
    ["Reanudaron", totals.resumed, "bg-status-info"],
    ["Enviaron", totals.submitted, "bg-status-success"],
  ] as const;
  const max = Math.max(1, ...stages.map(([, value]) => value));
  return <section className="grid gap-5 xl:grid-cols-[1.35fr_1fr]"><Card level={2}><CardHeader><CardTitle>{t("analytics.applicationConversion")}</CardTitle><p className="text-sm text-text-secondary">{t("analytics.realBehavior")}</p></CardHeader><CardContent className="space-y-4">{stages.map(([label, value, color]) => <div key={label} className="grid grid-cols-[7rem_1fr_4rem] items-center gap-3 text-sm"><span className="font-medium">{label}</span><div className="h-7 overflow-hidden rounded-lg bg-surface-section"><div className={`flex h-full min-w-8 items-center justify-end rounded-lg px-2 text-xs font-semibold text-white ${color}`} style={{ width: `${Math.max(5, value / max * 100)}%` }}>{value}</div></div><span className="text-right tabular-nums text-text-secondary">{totals.started ? `${Math.round(value / totals.started * 100)}%` : "0%"}</span></div>)}</CardContent></Card><Card level={2}><CardHeader><CardTitle>{t("analytics.dropoffSignal")}</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1"><div className="rounded-xl bg-surface-section p-4"><p className="text-sm text-text-secondary">{t("analytics.completion")}</p><p className="mt-1 text-3xl font-semibold">{totals.completionRate}%</p><p className="mt-1 text-xs text-text-secondary">{t("analytics.startToSubmit")}</p></div><div className="rounded-xl bg-surface-section p-4"><p className="text-sm text-text-secondary">{t("analytics.recovery")}</p><p className="mt-1 text-3xl font-semibold">{totals.resumeRate}%</p><p className="mt-1 text-xs text-text-secondary">{t("analytics.ofPausedDrafts")}</p></div>{totals.paused > totals.resumed ? <p className="sm:col-span-2 xl:col-span-1 text-sm text-status-warning">Hay {totals.paused - totals.resumed} borrador(es) pausados sin reanudación. Revisa claridad, longitud y campos obligatorios de las vacantes con mayor volumen.</p> : <p className="sm:col-span-2 xl:col-span-1 text-sm text-status-success">{t("analytics.recoveryCovers")}</p>}</CardContent></Card></section>;
}

function Metric({ icon: Icon, label, value, change, detail, inverse, points, tone }: { icon: typeof Users; label: string; value: string | number; change?: number; detail: string; inverse?: boolean; points?: boolean; tone?: "success" | "warning" | "danger" }) {
  const favorable = change === undefined ? null : inverse ? change <= 0 : change >= 0;
  return <Card level={2} className="relative overflow-hidden"><div className={`absolute inset-x-0 top-0 h-1 ${tone === "danger" ? "bg-status-danger" : tone === "warning" ? "bg-status-warning" : tone === "success" ? "bg-status-success" : "bg-primary"}`} /><CardContent className="p-5"><div className="flex items-center justify-between"><Icon className="size-5 text-brand" />{change !== undefined ? <span className={`flex items-center text-xs font-semibold ${favorable ? "text-status-success" : "text-status-danger"}`}>{change >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}{Math.abs(change)}{points ? " pp" : "%"}</span> : null}</div><p className="mt-5 text-sm text-text-secondary">{label}</p><p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p><p className="mt-2 text-xs text-text-secondary">{detail}</p></CardContent></Card>;
}

function Funnel({ rows, total }: { rows: AtsAnalyticsDto["funnel"]; total: number }) {
  if (!rows.length) return <Empty />;
  return <ol className="space-y-4">{rows.map((row, index) => <li key={row.stageCode} className="grid gap-2 sm:grid-cols-[9rem_1fr_7rem]"><div><p className="truncate text-sm font-medium">{row.stageName}</p><p className="text-xs text-text-secondary">{duration(row.averageHours)} promedio</p></div><div className="self-center"><div className="h-8 overflow-hidden rounded-lg bg-surface-section"><div className="flex h-full min-w-10 items-center justify-end rounded-lg bg-[linear-gradient(90deg,var(--color-primary),color-mix(in_srgb,var(--color-primary)_65%,var(--color-status-success)))] px-2 text-xs font-semibold text-white transition-[width]" style={{ width: `${Math.max(4, total ? row.reached / total * 100 : 0)}%` }}>{row.reached}</div></div></div><div className="text-right text-xs"><p className="font-semibold">{index ? `${row.conversionRate}% continúa` : `${row.conversionFromApplications}% entra`}</p><p className={row.dropOff ? "text-status-danger" : "text-text-secondary"}>{row.dropOff} pérdidas</p></div></li>)}</ol>;
}

function Trend({ rows }: { rows: AtsAnalyticsDto["trends"] }) {
  const { t } = useLocale();
  if (!rows.length) return <Empty />;
  const max = Math.max(1, ...rows.map((row) => row.applications));
  return <div><div className="flex h-56 items-end gap-1.5 border-b border-border-default px-1">{rows.map((row) => <div key={row.period} className="group relative flex min-w-1 flex-1 items-end" title={`${formatDate(row.period)}: ${row.applications} postulaciones, ${row.hires} contrataciones`}><div className="w-full rounded-t bg-primary/75 transition-colors group-hover:bg-primary" style={{ height: `${Math.max(3, row.applications / max * 100)}%` }}><div className="w-full bg-status-success" style={{ height: `${row.applications ? row.hires / row.applications * 100 : 0}%` }} /></div></div>)}</div><div className="mt-3 flex items-center justify-between text-xs text-text-secondary"><span>{formatDate(rows[0].period)}</span><span className="flex gap-3"><i className="size-2 rounded-full bg-primary" />Postulaciones <i className="size-2 rounded-full bg-status-success" />{t("analytics.hires")}</span><span>{formatDate(rows.at(-1)!.period)}</span></div></div>;
}

function OperationalCard({ title, value, label, rows, danger }: { title: string; value: string | number; label: string; rows: Array<[string, string | number]>; danger?: boolean }) {
  return <Card level={2}><CardHeader><div className="flex items-start justify-between"><div><CardTitle>{title}</CardTitle><p className={`mt-2 text-4xl font-semibold tabular-nums ${danger ? "text-status-danger" : ""}`}>{value}</p><p className="text-xs text-text-secondary">{label}</p></div>{danger ? <AlertTriangle className="size-5 text-status-danger" /> : <BriefcaseBusiness className="size-5 text-brand" />}</div></CardHeader><CardContent><dl className="grid grid-cols-2 gap-2">{rows.map(([name, metric]) => <div key={name} className="rounded-xl bg-surface-section p-3"><dt className="text-xs text-text-secondary">{name}</dt><dd className="mt-1 font-semibold tabular-nums">{metric}</dd></div>)}</dl></CardContent></Card>;
}

function TableCard({ title, headers, rows }: { title: string; headers: string[]; rows: Array<Array<string | number>> }) {
  return <Card level={2}><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent>{rows.length ? <><div className="grid gap-3 md:hidden">{rows.map((row, index) => <article key={`${row[0]}-${index}`} className="rounded-xl border border-border-default p-3"><p className="font-semibold">{row[0]}</p><dl className="mt-3 grid grid-cols-2 gap-3">{row.slice(1).map((cell, cellIndex) => <div key={headers[cellIndex + 1]}><dt className="text-xs text-text-secondary">{headers[cellIndex + 1]}</dt><dd className="mt-1 text-sm font-medium">{cell}</dd></div>)}</dl></article>)}</div><div tabIndex={0} role="group" aria-label={title} className="hidden max-h-80 overflow-auto rounded-xl border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus md:block"><table className="w-full text-left text-sm"><thead className="sticky top-0 bg-surface-interactive"><tr>{headers.map((header) => <th key={header} className="whitespace-nowrap px-3 py-2 font-medium">{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={`${row[0]}-${index}`} className="border-t">{row.map((cell, cellIndex) => <td key={cellIndex} className="whitespace-nowrap px-3 py-2">{cellIndex === 0 ? <span className="font-medium">{cell}</span> : cell}</td>)}</tr>)}</tbody></table></div></> : <Empty />}</CardContent></Card>;
}

// El `<Label>` suelto no estaba asociado a su control: los `<input type="date">`
// quedaban sin nombre accesible (`label`, crítico). Un `<label>` que envuelve al
// control lo asocia de forma nativa, y `SelectTrigger` deriva de él su nombre.
function Filter({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block space-y-2"><span className="text-sm font-medium text-foreground">{label}</span>{children}</label>; }
function SourceCostDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useLocale();
  const [source, setSource] = useState(""); const [amount, setAmount] = useState(""); const [currency, setCurrency] = useState("USD"); const [periodStart, setPeriodStart] = useState(inputDate(new Date())); const [periodEnd, setPeriodEnd] = useState(inputDate(new Date())); const [notes, setNotes] = useState("");
  const mutation = useMutation({ mutationFn: () => saveAtsSourceCost({ source, amountCents: Math.round(Number(amount) * 100), currency, periodStart: new Date(`${periodStart}T00:00:00.000Z`).toISOString(), periodEnd: new Date(`${periodEnd}T23:59:59.999Z`).toISOString(), notes: notes || undefined }), onSuccess: () => { setSource(""); setAmount(""); setNotes(""); onOpenChange(false); toast.success("Coste por fuente guardado"); }, onError: () => toast.error("No fue posible guardar el coste") });
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{t("analytics.recordSourceCost")}</DialogTitle><DialogDescription>{t("analytics.costManual")}</DialogDescription></DialogHeader><div className="space-y-4"><Input value={source} onChange={(event) => setSource(event.target.value)} placeholder={t("analytics.sourcePlaceholder")} /><div className="grid grid-cols-2 gap-3"><Input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder={t("analytics.amount")} /><Input value={currency} maxLength={3} onChange={(event) => setCurrency(event.target.value.toUpperCase())} placeholder="USD" /></div><div className="grid grid-cols-2 gap-3"><Input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} /><Input type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} /></div><textarea className="min-h-20 w-full rounded-xl border border-border-default bg-surface-elevated p-3 text-base sm:text-sm" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={t("analytics.notesPlaceholder")} /><Button className="w-full" disabled={source.trim().length < 2 || !Number.isFinite(Number(amount)) || Number(amount) < 0 || mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? "Guardando…" : t("analytics.saveCost")}</Button></div></DialogContent></Dialog>;
}

function HiringQualityDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useLocale();
  const employees = useQuery({ queryKey: ["ats-hiring-quality"], queryFn: fetchAtsHiringQuality, enabled: open });
  const [employeeId, setEmployeeId] = useState(""); const [checkpointDays, setCheckpointDays] = useState<30 | 60 | 90>(30); const [performanceScore, setPerformanceScore] = useState("3"); const [retained, setRetained] = useState("yes"); const [comment, setComment] = useState("");
  const mutation = useMutation({ mutationFn: () => saveAtsHiringQuality({ employeeId, checkpointDays, performanceScore: Number(performanceScore), retained: retained === "yes", managerComment: comment || undefined }), onSuccess: async () => { setComment(""); await employees.refetch(); toast.success("Revisión de calidad registrada"); }, onError: () => toast.error("No fue posible registrar la revisión") });
  const eligible = (employees.data ?? []).filter((employee) => employee.checkpoints.some((checkpoint) => checkpoint.checkpointDays === checkpointDays && checkpoint.due));
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{t("analytics.hireQuality")}</DialogTitle><DialogDescription>{t("analytics.hireQualityBody")}</DialogDescription></DialogHeader><div className="space-y-4"><FormSelect value={String(checkpointDays)} onValueChange={(value) => { setCheckpointDays(Number(value) as 30 | 60 | 90); setEmployeeId(""); }} options={[{ value: "30", label: t("analytics.days30") }, { value: "60", label: t("analytics.days60") }, { value: "90", label: t("analytics.days90") }]} /><FormSelect value={employeeId} placeholder={t("analytics.selectEmployee")} onValueChange={setEmployeeId} options={eligible.map((employee) => ({ value: employee.id, label: `${employee.name}${employee.jobTitle ? ` · ${employee.jobTitle}` : ""}` }))} /><div className="grid grid-cols-2 gap-3"><FormSelect value={performanceScore} onValueChange={setPerformanceScore} options={[1, 2, 3, 4, 5].map((value) => ({ value: String(value), label: `${value}/5 desempeño` }))} /><FormSelect value={retained} onValueChange={setRetained} options={[{ value: "yes", label: t("analytics.staysActive") }, { value: "no", label: t("analytics.doesNotStay") }]} /></div><textarea className="min-h-20 w-full rounded-xl border border-border-default bg-surface-elevated p-3 text-base sm:text-sm" value={comment} onChange={(event) => setComment(event.target.value)} placeholder={t("analytics.evidencePlaceholder")} /><Button className="w-full" disabled={!employeeId || mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? "Guardando…" : t("analytics.saveReview")}</Button></div></DialogContent></Dialog>;
}
function Empty() {
  const { t } = useLocale();
  return <p className="rounded-xl bg-surface-section p-4 text-sm text-text-secondary">{t("analytics.noData")}</p>; }
function defaultFilters(): AtsAnalyticsQuery { const to = new Date(); const from = new Date(to.getTime() - 89 * 86_400_000); return { from: inputDate(from), to: inputDate(to), scope: "tenant", granularity: "week" }; }
function inputDate(value: Date) { return value.toISOString().slice(0, 10); }
function formatDate(value: string) { return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value)); }
function formatDateTime(value: string) { return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function duration(hours: number) { if (!hours) return "0 h"; return hours < 24 ? `${hours.toLocaleString("es-ES")} h` : `${(hours / 24).toLocaleString("es-ES", { maximumFractionDigits: 1 })} días`; }
function money(amount: number, currency: string | null) { return new Intl.NumberFormat("es-ES", { style: "currency", currency: currency || "USD", maximumFractionDigits: 2 }).format(amount); }
function granularityLabel(value: AtsAnalyticsDto["filters"]["granularity"]) { return value === "day" ? "Diaria" : value === "week" ? "Semanal" : "Mensual"; }
