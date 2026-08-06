"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BriefcaseBusiness, Clock3, DollarSign, Download, RefreshCw, Save, Star, Target, Users } from "lucide-react";
import { toast } from "sonner";
import { AsyncState } from "@/components/async-state";
import { InlineFeedback, PageHeader } from "@/components/design-system";
import { RecruitmentWorkspaceNav } from "@/components/recruitment-workspace";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type AtsAnalyticsQuery, downloadTextFile, fetchAtsAnalytics, fetchAtsAnalyticsDashboards, fetchAtsAnalyticsExport, fetchAtsHiringQuality, fetchAtsSourceCosts, fetchVacancies, saveAtsAnalyticsDashboard, saveAtsHiringQuality, saveAtsSourceCost } from "@/lib/backend";
import type { AtsAnalyticsDto } from "@/lib/contracts";
import { useAppStore } from "@/store/app-store";

export default function AtsAnalyticsPage() {
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
  const saveDashboard = useMutation({ mutationFn: () => saveAtsAnalyticsDashboard({ ...filters, name: dashboardName.trim(), widgets: ["summary", "funnel", "sources", "recruiters", "sla", "interviews", "offers"] }), onSuccess: async () => { setDashboardName(""); await dashboards.refetch(); toast.success("Dashboard guardado"); }, onError: () => toast.error("No fue posible guardar el dashboard") });
  const exporter = useMutation({
    mutationFn: () => fetchAtsAnalyticsExport(filters),
    onSuccess: (file) => { downloadTextFile(file); toast.success("Analítica ATS exportada", { description: file.filename }); },
    onError: () => toast.error("No fue posible exportar la analítica ATS"),
  });
  const recruiters = useMemo(() => tenantUsers.filter((user) => ["rrhh", "reclutador", "admin_empresa"].includes(user.role)), [tenantUsers]);

  const setPeriod = (days: number) => {
    const to = new Date();
    const from = new Date(to.getTime() - (days - 1) * 86_400_000);
    setFilters((current) => ({ ...current, from: inputDate(from), to: inputDate(to), granularity: days <= 31 ? "day" : days <= 120 ? "week" : "month" }));
  };

  return <div className="space-y-7">
    <PageHeader
      eyebrow="Inteligencia de reclutamiento"
      title="Analítica ATS"
      description="Convierte el pipeline en decisiones: velocidad, conversión, calidad de fuente, carga operativa y riesgo de SLA en un solo lugar."
      actions={<div className="flex flex-wrap gap-2">
        {can("candidates.update") ? <Button variant="secondary" onClick={() => setCostOpen(true)}><DollarSign className="size-4" />Registrar coste</Button> : null}
        {can("candidates.update") ? <Button variant="secondary" onClick={() => setQualityOpen(true)}><Star className="size-4" />Calidad 30/60/90</Button> : null}
        {can("reports.export") ? <Button onClick={() => exporter.mutate()} disabled={!analytics.data || exporter.isPending}><Download className="size-4" />{exporter.isPending ? "Exportando…" : "Exportar CSV"}</Button> : null}
        <Button variant="secondary" onClick={() => analytics.refetch()} disabled={analytics.isFetching}><RefreshCw className={`size-4 ${analytics.isFetching ? "animate-spin" : ""}`} />Actualizar</Button>
      </div>}
    />
    <RecruitmentWorkspaceNav />
    <Card level={2}><CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_auto_auto]"><FormSelect value="" placeholder="Cargar dashboard guardado" onValueChange={(value) => { const selected = dashboards.data?.find((item) => item.id === value); if (selected) setFilters(selected.filters.query as AtsAnalyticsQuery); }} options={(dashboards.data ?? []).map((item) => ({ value: item.id, label: item.isDefault ? `${item.name} (predeterminado)` : item.name }))} /><Input value={dashboardName} onChange={(event) => setDashboardName(event.target.value)} maxLength={100} placeholder="Nombre del dashboard actual" /><Button variant="secondary" disabled={dashboardName.trim().length < 2 || saveDashboard.isPending} onClick={() => saveDashboard.mutate()}><Save className="size-4" />Guardar vista</Button></CardContent></Card>

    <Card level={2} className="overflow-hidden">
      <div className="h-1 bg-[linear-gradient(90deg,var(--color-primary),var(--color-status-success),var(--color-status-warning))]" />
      <CardContent className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-6">
        <Filter label="Desde"><Input type="date" value={filters.from ?? ""} onChange={(event) => setFilters({ ...filters, from: event.target.value })} /></Filter>
        <Filter label="Hasta"><Input type="date" value={filters.to ?? ""} onChange={(event) => setFilters({ ...filters, to: event.target.value })} /></Filter>
        <Filter label="Sucursal"><FormSelect value={filters.scope === "tenant" ? "ALL" : filters.branchId ?? currentBranch?.id ?? "ALL"} onValueChange={(value) => setFilters({ ...filters, branchId: value === "ALL" ? undefined : value, scope: value === "ALL" ? "tenant" : "context" })} options={[{ value: "ALL", label: "Todas las permitidas" }, ...tenantBranches.map((branch) => ({ value: branch.id, label: branch.name }))]} /></Filter>
        <Filter label="Vacante"><FormSelect value={filters.vacancyId ?? "ALL"} onValueChange={(value) => setFilters({ ...filters, vacancyId: value === "ALL" ? undefined : value })} options={[{ value: "ALL", label: "Todas las vacantes" }, ...(vacancies.data?.data ?? []).map((vacancy) => ({ value: vacancy.id, label: vacancy.title }))]} /></Filter>
        <Filter label="Reclutador"><FormSelect value={filters.recruiterId ?? "ALL"} onValueChange={(value) => setFilters({ ...filters, recruiterId: value === "ALL" ? undefined : value })} options={[{ value: "ALL", label: "Todo el equipo" }, ...recruiters.map((user) => ({ value: user.id, label: user.fullName }))]} /></Filter>
        <Filter label="Agrupación"><FormSelect value={filters.granularity ?? "week"} onValueChange={(value) => setFilters({ ...filters, granularity: value as "day" | "week" | "month" })} options={[{ value: "day", label: "Diaria" }, { value: "week", label: "Semanal" }, { value: "month", label: "Mensual" }]} /></Filter>
        <div className="flex flex-wrap gap-2 md:col-span-2 xl:col-span-6">{[7, 30, 90, 180].map((days) => <Button key={days} size="sm" variant="secondary" onClick={() => setPeriod(days)}>{days} días</Button>)}</div>
      </CardContent>
    </Card>

    {analytics.isPending ? <AsyncState state="loading" title="Calculando el desempeño ATS" description="Estamos reconstruyendo embudos, tiempos, SLA, entrevistas y ofertas." /> : null}
    {analytics.isError ? <AsyncState state="error" title="No fue posible calcular la analítica ATS" description={analytics.error instanceof Error ? analytics.error.message : "Revisa el alcance y vuelve a intentarlo."} onRetry={() => analytics.refetch()} /> : null}
    {analytics.data ? <AnalyticsContent data={analytics.data} /> : null}
    <SourceCostDialog open={costOpen} onOpenChange={setCostOpen} />
    <HiringQualityDialog open={qualityOpen} onOpenChange={setQualityOpen} />
  </div>;
}

function AnalyticsContent({ data }: { data: AtsAnalyticsDto }) {
  return <div className="space-y-7">
    <section className="flex flex-col gap-2 rounded-2xl border bg-surface-section p-4 text-sm text-text-secondary lg:flex-row lg:items-center lg:justify-between">
      <span><strong className="text-text-primary">Periodo:</strong> {formatDate(data.period.from)} – {formatDate(data.period.to)}</span>
      <span><strong className="text-text-primary">Alcance:</strong> {data.scope.branchName ?? (data.scope.type === "GLOBAL" ? "Global" : "Toda la empresa")}</span>
      <span><strong className="text-text-primary">Fuente:</strong> datos persistentes</span>
      <span>Actualizado {formatDateTime(data.generatedAt)}</span>
    </section>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={Users} label="Postulaciones" value={data.summary.applications} change={data.summary.changes.applications} detail={`${data.summary.uniqueCandidates} candidatos únicos`} />
      <Metric icon={Target} label="Conversión a contratación" value={`${data.summary.conversionRate}%`} change={data.summary.changes.conversionRate} detail={`${data.summary.hires} contrataciones`} points />
      <Metric icon={Clock3} label="Tiempo medio de contratación" value={duration(data.summary.averageTimeToHireHours)} change={data.summary.changes.averageTimeToHireHours} detail={`Mediana ${duration(data.summary.medianTimeToHireHours)}`} inverse />
      <Metric icon={Activity} label="Cumplimiento de SLA" value={`${data.sla.complianceRate}%`} detail={`${data.sla.breached} fuera de SLA`} tone={data.sla.complianceRate < 70 ? "danger" : data.sla.complianceRate < 90 ? "warning" : "success"} />
    </section>

    {data.insights.length ? <section aria-labelledby="ats-insights"><h2 id="ats-insights" className="mb-3 text-xl font-semibold">Señales que requieren atención</h2><div className="grid gap-3 lg:grid-cols-2">{data.insights.map((insight) => <InlineFeedback key={insight.code} tone={insight.severity === "critical" ? "danger" : insight.severity === "warning" ? "warning" : "info"} title={insight.title}>{insight.detail}</InlineFeedback>)}</div></section> : <InlineFeedback tone="success" title="Operación ATS bajo control">No se detectaron alertas significativas en el periodo seleccionado.</InlineFeedback>}

    <section className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
      <Card level={2}><CardHeader><CardTitle>Embudo por etapas reales</CardTitle><p className="text-sm text-text-secondary">Conversión, pérdida y permanencia construidas desde el historial inmutable.</p></CardHeader><CardContent><Funnel rows={data.funnel} total={data.summary.applications} /></CardContent></Card>
      <Card level={2}><CardHeader><CardTitle>Volumen y decisiones</CardTitle><p className="text-sm text-text-secondary">Evolución {granularityLabel(data.filters.granularity).toLocaleLowerCase()} de nuevas postulaciones.</p></CardHeader><CardContent><Trend rows={data.trends} /></CardContent></Card>
    </section>

    <section className="grid gap-5 xl:grid-cols-3">
      <OperationalCard title="Entrevistas" value={`${data.interviews.completionRate}%`} label="completadas" rows={[["Sesiones", data.interviews.total], ["Ausencias", `${data.interviews.noShowRate}%`], ["Calificación media", data.interviews.averageScore || "—"], ["Anticipación", duration(data.interviews.averageSchedulingLeadHours)]]} />
      <OperationalCard title="Ofertas" value={`${data.offers.acceptanceRate}%`} label="aceptadas" rows={[["Emitidas", data.offers.total], ["Aceptadas", data.offers.accepted], ["Contrapropuestas", `${data.offers.counterOfferRate}%`], ["Tiempo de aprobación", duration(data.offers.averageApprovalHours)]]} />
      <OperationalCard title="SLA del pipeline" value={data.sla.breached} label="casos vencidos" rows={[["Medibles", data.sla.measurable], ["Advertencias", data.sla.warningSent], ["Escalados", data.sla.escalated], ["Reasignados", data.sla.reassigned]]} danger={data.sla.breached > 0} />
    </section>

    <section className="grid gap-5 xl:grid-cols-2">
      <TableCard title="Eficiencia y coste por fuente" headers={["Fuente", "Postulaciones", "Contrataciones", "Coste", "Coste/contratación"]} rows={data.sources.map((item) => [item.source, item.applications, item.hires, money(item.cost, item.currency), item.costPerHire === null ? "—" : money(item.costPerHire, item.currency)])} />
      <TableCard title="Calidad de contratación" headers={["Hito", "Revisiones", "Desempeño medio", "Retención"]} rows={data.qualityOfHire.byCheckpoint.map((item) => [`${item.checkpointDays} días`, item.reviews, item.averagePerformanceScore ? `${item.averagePerformanceScore}/5` : "—", `${item.retentionRate}%`])} />
      <TableCard title="Motivos de descarte" headers={["Motivo", "Categoría", "Casos", "Peso"]} rows={data.rejectionReasons.map((item) => [item.label, item.category ?? "Sin clasificar", item.count, `${item.percentage}%`])} />
      <TableCard title="Rendimiento por vacante" headers={["Vacante", "Postulaciones", "Contrataciones", "Cobertura", "Días abierta"]} rows={data.vacancies.map((item) => [item.title, item.applications, item.hires, `${item.fillRate}%`, item.daysOpen])} />
      <TableCard title="Carga por reclutador" headers={["Responsable", "Activas", "Fuera de SLA", "Conversión", "Edad media"]} rows={data.recruiters.map((item) => [item.name, item.active, item.overdue, `${item.conversionRate}%`, duration(item.averageActiveStageHours)])} />
    </section>
  </div>;
}

function Metric({ icon: Icon, label, value, change, detail, inverse, points, tone }: { icon: typeof Users; label: string; value: string | number; change?: number; detail: string; inverse?: boolean; points?: boolean; tone?: "success" | "warning" | "danger" }) {
  const favorable = change === undefined ? null : inverse ? change <= 0 : change >= 0;
  return <Card level={2} className="relative overflow-hidden"><div className={`absolute inset-x-0 top-0 h-1 ${tone === "danger" ? "bg-status-danger" : tone === "warning" ? "bg-status-warning" : tone === "success" ? "bg-status-success" : "bg-primary"}`} /><CardContent className="p-5"><div className="flex items-center justify-between"><Icon className="size-5 text-primary" />{change !== undefined ? <span className={`flex items-center text-xs font-semibold ${favorable ? "text-status-success" : "text-status-danger"}`}>{change >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}{Math.abs(change)}{points ? " pp" : "%"}</span> : null}</div><p className="mt-5 text-sm text-text-secondary">{label}</p><p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p><p className="mt-2 text-xs text-text-secondary">{detail}</p></CardContent></Card>;
}

function Funnel({ rows, total }: { rows: AtsAnalyticsDto["funnel"]; total: number }) {
  if (!rows.length) return <Empty />;
  return <ol className="space-y-4">{rows.map((row, index) => <li key={row.stageCode} className="grid gap-2 sm:grid-cols-[9rem_1fr_7rem]"><div><p className="truncate text-sm font-medium">{row.stageName}</p><p className="text-xs text-text-secondary">{duration(row.averageHours)} promedio</p></div><div className="self-center"><div className="h-8 overflow-hidden rounded-lg bg-surface-section"><div className="flex h-full min-w-10 items-center justify-end rounded-lg bg-[linear-gradient(90deg,var(--color-primary),color-mix(in_srgb,var(--color-primary)_65%,var(--color-status-success)))] px-2 text-xs font-semibold text-white transition-[width]" style={{ width: `${Math.max(4, total ? row.reached / total * 100 : 0)}%` }}>{row.reached}</div></div></div><div className="text-right text-xs"><p className="font-semibold">{index ? `${row.conversionRate}% continúa` : `${row.conversionFromApplications}% entra`}</p><p className={row.dropOff ? "text-status-danger" : "text-text-secondary"}>{row.dropOff} pérdidas</p></div></li>)}</ol>;
}

function Trend({ rows }: { rows: AtsAnalyticsDto["trends"] }) {
  if (!rows.length) return <Empty />;
  const max = Math.max(1, ...rows.map((row) => row.applications));
  return <div><div className="flex h-56 items-end gap-1.5 border-b border-border-default px-1">{rows.map((row) => <div key={row.period} className="group relative flex min-w-1 flex-1 items-end" title={`${formatDate(row.period)}: ${row.applications} postulaciones, ${row.hires} contrataciones`}><div className="w-full rounded-t bg-primary/75 transition-colors group-hover:bg-primary" style={{ height: `${Math.max(3, row.applications / max * 100)}%` }}><div className="w-full bg-status-success" style={{ height: `${row.applications ? row.hires / row.applications * 100 : 0}%` }} /></div></div>)}</div><div className="mt-3 flex items-center justify-between text-xs text-text-secondary"><span>{formatDate(rows[0].period)}</span><span className="flex gap-3"><i className="size-2 rounded-full bg-primary" />Postulaciones <i className="size-2 rounded-full bg-status-success" />Contrataciones</span><span>{formatDate(rows.at(-1)!.period)}</span></div></div>;
}

function OperationalCard({ title, value, label, rows, danger }: { title: string; value: string | number; label: string; rows: Array<[string, string | number]>; danger?: boolean }) {
  return <Card level={2}><CardHeader><div className="flex items-start justify-between"><div><CardTitle>{title}</CardTitle><p className={`mt-2 text-4xl font-semibold tabular-nums ${danger ? "text-status-danger" : ""}`}>{value}</p><p className="text-xs text-text-secondary">{label}</p></div>{danger ? <AlertTriangle className="size-5 text-status-danger" /> : <BriefcaseBusiness className="size-5 text-primary" />}</div></CardHeader><CardContent><dl className="grid grid-cols-2 gap-2">{rows.map(([name, metric]) => <div key={name} className="rounded-xl bg-surface-section p-3"><dt className="text-xs text-text-secondary">{name}</dt><dd className="mt-1 font-semibold tabular-nums">{metric}</dd></div>)}</dl></CardContent></Card>;
}

function TableCard({ title, headers, rows }: { title: string; headers: string[]; rows: Array<Array<string | number>> }) {
  return <Card level={2}><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent>{rows.length ? <div className="max-h-80 overflow-auto rounded-xl border"><table className="w-full text-left text-sm"><thead className="sticky top-0 bg-surface-interactive"><tr>{headers.map((header) => <th key={header} className="whitespace-nowrap px-3 py-2 font-medium">{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={`${row[0]}-${index}`} className="border-t">{row.map((cell, cellIndex) => <td key={cellIndex} className="whitespace-nowrap px-3 py-2">{cellIndex === 0 ? <span className="font-medium">{cell}</span> : cell}</td>)}</tr>)}</tbody></table></div> : <Empty />}</CardContent></Card>;
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
function SourceCostDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [source, setSource] = useState(""); const [amount, setAmount] = useState(""); const [currency, setCurrency] = useState("USD"); const [periodStart, setPeriodStart] = useState(inputDate(new Date())); const [periodEnd, setPeriodEnd] = useState(inputDate(new Date())); const [notes, setNotes] = useState("");
  const mutation = useMutation({ mutationFn: () => saveAtsSourceCost({ source, amountCents: Math.round(Number(amount) * 100), currency, periodStart: new Date(`${periodStart}T00:00:00.000Z`).toISOString(), periodEnd: new Date(`${periodEnd}T23:59:59.999Z`).toISOString(), notes: notes || undefined }), onSuccess: () => { setSource(""); setAmount(""); setNotes(""); onOpenChange(false); toast.success("Coste por fuente guardado"); }, onError: () => toast.error("No fue posible guardar el coste") });
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Registrar coste por fuente</DialogTitle><DialogDescription>El coste es manual y se usará para calcular coste por postulación y contratación.</DialogDescription></DialogHeader><div className="space-y-4"><Input value={source} onChange={(event) => setSource(event.target.value)} placeholder="Ej. LinkedIn, referido, feria laboral" /><div className="grid grid-cols-2 gap-3"><Input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Importe" /><Input value={currency} maxLength={3} onChange={(event) => setCurrency(event.target.value.toUpperCase())} placeholder="USD" /></div><div className="grid grid-cols-2 gap-3"><Input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} /><Input type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} /></div><textarea className="min-h-20 w-full rounded-xl border border-border-default bg-surface-elevated p-3 text-sm" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notas o comprobante interno" /><Button className="w-full" disabled={source.trim().length < 2 || !Number.isFinite(Number(amount)) || Number(amount) < 0 || mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? "Guardando…" : "Guardar coste"}</Button></div></DialogContent></Dialog>;
}

function HiringQualityDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const employees = useQuery({ queryKey: ["ats-hiring-quality"], queryFn: fetchAtsHiringQuality, enabled: open });
  const [employeeId, setEmployeeId] = useState(""); const [checkpointDays, setCheckpointDays] = useState<30 | 60 | 90>(30); const [performanceScore, setPerformanceScore] = useState("3"); const [retained, setRetained] = useState("yes"); const [comment, setComment] = useState("");
  const mutation = useMutation({ mutationFn: () => saveAtsHiringQuality({ employeeId, checkpointDays, performanceScore: Number(performanceScore), retained: retained === "yes", managerComment: comment || undefined }), onSuccess: async () => { setComment(""); await employees.refetch(); toast.success("Revisión de calidad registrada"); }, onError: () => toast.error("No fue posible registrar la revisión") });
  const eligible = (employees.data ?? []).filter((employee) => employee.checkpoints.some((checkpoint) => checkpoint.checkpointDays === checkpointDays && checkpoint.due));
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Calidad de contratación</DialogTitle><DialogDescription>Registra desempeño y retención reales a los 30, 60 o 90 días. Solo se muestran hitos ya vencidos.</DialogDescription></DialogHeader><div className="space-y-4"><FormSelect value={String(checkpointDays)} onValueChange={(value) => { setCheckpointDays(Number(value) as 30 | 60 | 90); setEmployeeId(""); }} options={[{ value: "30", label: "30 días" }, { value: "60", label: "60 días" }, { value: "90", label: "90 días" }]} /><FormSelect value={employeeId} placeholder="Selecciona un empleado contratado" onValueChange={setEmployeeId} options={eligible.map((employee) => ({ value: employee.id, label: `${employee.name}${employee.jobTitle ? ` · ${employee.jobTitle}` : ""}` }))} /><div className="grid grid-cols-2 gap-3"><FormSelect value={performanceScore} onValueChange={setPerformanceScore} options={[1, 2, 3, 4, 5].map((value) => ({ value: String(value), label: `${value}/5 desempeño` }))} /><FormSelect value={retained} onValueChange={setRetained} options={[{ value: "yes", label: "Permanece activo" }, { value: "no", label: "No permanece" }]} /></div><textarea className="min-h-20 w-full rounded-xl border border-border-default bg-surface-elevated p-3 text-sm" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Evidencia o comentario del responsable" /><Button className="w-full" disabled={!employeeId || mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? "Guardando…" : "Guardar revisión"}</Button></div></DialogContent></Dialog>;
}
function Empty() { return <p className="rounded-xl bg-surface-section p-4 text-sm text-text-secondary">No hay datos suficientes para este periodo y alcance.</p>; }
function defaultFilters(): AtsAnalyticsQuery { const to = new Date(); const from = new Date(to.getTime() - 89 * 86_400_000); return { from: inputDate(from), to: inputDate(to), scope: "tenant", granularity: "week" }; }
function inputDate(value: Date) { return value.toISOString().slice(0, 10); }
function formatDate(value: string) { return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value)); }
function formatDateTime(value: string) { return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function duration(hours: number) { if (!hours) return "0 h"; return hours < 24 ? `${hours.toLocaleString("es-ES")} h` : `${(hours / 24).toLocaleString("es-ES", { maximumFractionDigits: 1 })} días`; }
function money(amount: number, currency: string | null) { return new Intl.NumberFormat("es-ES", { style: "currency", currency: currency || "USD", maximumFractionDigits: 2 }).format(amount); }
function granularityLabel(value: AtsAnalyticsDto["filters"]["granularity"]) { return value === "day" ? "Diaria" : value === "week" ? "Semanal" : "Mensual"; }
