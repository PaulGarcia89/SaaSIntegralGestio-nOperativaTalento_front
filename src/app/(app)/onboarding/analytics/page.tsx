"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BarChart3, Clock3, FileCheck2, Gauge, UsersRound } from "lucide-react";
import { fetchOnboardingAnalytics } from "@/lib/backend";
import { useAppStore } from "@/store/app-store";
import { AsyncState } from "@/components/async-state";
import { PageHeader } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OnboardingAnalyticsPage() {
  const { currentBranch } = useAppStore();
  const query = useQuery({ queryKey: ["onboarding-analytics", currentBranch?.id], queryFn: () => fetchOnboardingAnalytics(currentBranch?.id) });
  if (query.isLoading) return <AsyncState state="loading" title="Calculando analítica de incorporación" />;
  if (query.isError || !query.data) return <AsyncState state="error" title="No pudimos cargar la analítica" onRetry={() => void query.refetch()} />;
  const { summary, comparisons } = query.data;
  return <div className="space-y-7"><PageHeader eyebrow="Personas" title="Analítica de incorporación" description="Mide tiempos operativos, cumplimiento y riesgo de abandono con señales explicables." />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><Metric icon={UsersRound} label="Expedientes" value={String(summary.totalFlows)} /><Metric icon={Gauge} label="Completitud" value={`${summary.completionRate}%`} /><Metric icon={FileCheck2} label="Documentos" value={`${summary.documentComplianceRate}%`} /><Metric icon={Clock3} label="Hasta productividad" value={hours(summary.averageTimeToProductivityHours)} /><Metric icon={AlertTriangle} label="En riesgo" value={String(summary.atRisk)} tone={summary.atRisk ? "warning" : "success"} /></section>
    <section className="grid gap-5 xl:grid-cols-2"><TableCard title="Tiempo por etapa" icon={Clock3} rows={query.data.timeByStage} /><TableCard title="Tiempo por responsable" icon={UsersRound} rows={query.data.timeByResponsible} /></section>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="size-5 text-amber-600" />Riesgo de no incorporación o abandono</CardTitle></CardHeader><CardContent className="space-y-3">{query.data.risks.length ? query.data.risks.map((risk) => <div key={risk.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"><div><p className="font-medium">{risk.branch} · {risk.employee.jobTitle || "Sin puesto"}</p><p className="text-sm text-muted-foreground">{risk.reasons.join(" · ")}</p></div><Badge variant={risk.level === "HIGH" ? "destructive" : "warning"}>{risk.level === "HIGH" ? "Alto" : "Medio"} · {risk.score}</Badge></div>) : <p className="text-sm text-muted-foreground">No hay expedientes con señales de riesgo activas.</p>}</CardContent></Card>
    <section className="grid gap-5 xl:grid-cols-2"><Comparison title="Por sede" rows={comparisons.branches} /><Comparison title="Por puesto" rows={comparisons.positions} /><Comparison title="Por cohorte" rows={comparisons.cohorts} /><Comparison title="Por plantilla" rows={comparisons.templates} /></section>
  </div>;
}
function Metric({ icon: Icon, label, value, tone }: { icon: typeof Clock3; label: string; value: string; tone?: "warning" | "success" }) { return <Card><CardContent className="flex items-center gap-3 p-4"><Icon className={`size-5 ${tone === "warning" ? "text-amber-600" : "text-primary"}`} /><div><p className="text-xs text-muted-foreground">{label}</p><p className="font-semibold">{value}</p></div></CardContent></Card>; }
function TableCard({ title, icon: Icon, rows }: { title: string; icon: typeof Clock3; rows: Array<{ label: string; averageHours: number; sampleSize: number }> }) { return <Card><CardHeader><CardTitle className="flex items-center gap-2"><Icon className="size-5 text-primary" />{title}</CardTitle></CardHeader><CardContent className="space-y-2">{rows.slice(0, 8).map((row) => <div key={row.label} className="grid grid-cols-[1fr_auto_auto] gap-3 rounded-lg bg-muted/40 p-3 text-sm"><span className="truncate font-medium">{row.label}</span><span>{hours(row.averageHours)}</span><span className="text-muted-foreground">{row.sampleSize} casos</span></div>)}{!rows.length ? <p className="text-sm text-muted-foreground">Aún no hay tareas completadas suficientes.</p> : null}</CardContent></Card>; }
function Comparison({ title, rows }: { title: string; rows: Array<{ label: string; total: number; completionRate: number; averageCompletionHours: number }> }) { return <Card><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="size-5 text-primary" />{title}</CardTitle></CardHeader><CardContent className="space-y-2">{rows.slice(0, 8).map((row) => <div key={row.label} className="rounded-lg border p-3"><div className="flex justify-between gap-3"><span className="truncate font-medium">{row.label}</span><span>{row.completionRate}%</span></div><p className="mt-1 text-xs text-muted-foreground">{row.total} expedientes · cierre en {hours(row.averageCompletionHours)}</p></div>)}{!rows.length ? <p className="text-sm text-muted-foreground">Sin datos para comparar.</p> : null}</CardContent></Card>; }
function hours(value: number) { return value ? `${value < 48 ? `${value} h` : `${Math.round(value / 24)} d`}` : "Sin datos"; }
