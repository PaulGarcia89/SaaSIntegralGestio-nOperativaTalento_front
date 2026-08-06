"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Download, RefreshCw, Save, SlidersHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  downloadTextFile,
  fetchReportsExport,
  fetchReportsOverview,
  type ReportQuery,
} from "@/lib/backend";
import { useAppStore } from "@/store/app-store";
import { AsyncState } from "@/components/async-state";
import { MobileFilterSheet, PageHeader } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SavedFilter = { id: string; name: string; filters: ReportQuery };

const statusLabels: Record<string, string> = {
  SUBMITTED: "Recibida",
  REVIEWING: "En revisión",
  INTERVIEW: "Entrevista",
  OFFER: "Oferta",
  HIRED: "Contratada",
  REJECTED: "Descartada",
  PENDING: "Pendiente",
  IN_PROGRESS: "En curso",
  COMPLETED: "Completada",
  BLOCKED: "Bloqueada",
  CANCELLED: "Cancelada",
  NOT_STARTED: "Sin iniciar",
  OVERDUE: "Vencida",
  AVAILABLE: "Disponible",
  ASSIGNED: "Asignado",
  RETURN_PENDING: "Devolución pendiente",
  IN_TRANSIT: "En tránsito",
  MAINTENANCE: "Mantenimiento",
  LOST: "Perdido",
};

export default function ReportsPage() {
  const {
    can,
    currentBranch,
    currentRole,
    currentTenant,
    currentUser,
    tenantBranches,
  } = useAppStore();
  const [filters, setFilters] = useState<ReportQuery>(() => defaultFilters());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterName, setFilterName] = useState("");
  const storageKey = `talentos:report-filters:${currentUser.id}:${currentTenant.id}`;
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(storageKey);
        setSavedFilters(stored ? (JSON.parse(stored) as SavedFilter[]) : []);
      } catch {
        setSavedFilters([]);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [storageKey]);

  const query = useQuery({
    queryKey: ["reports-overview", currentTenant.id, filters],
    queryFn: () => fetchReportsOverview(filters),
    staleTime: 30_000,
  });
  const exporter = useMutation({
    mutationFn: () => fetchReportsExport(filters),
    onSuccess: (file) => {
      downloadTextFile(file);
      toast.success("Reporte exportado", { description: file.filename });
    },
    onError: () => toast.error("No fue posible exportar el reporte"),
  });
  const scopeOptions = useMemo(
    () => [
      { value: "all", label: currentRole === "admin_saas" ? "Contexto global" : "Todas las sucursales permitidas" },
      ...tenantBranches.map((branch) => ({ value: branch.id, label: branch.name })),
    ],
    [currentRole, tenantBranches],
  );

  const changePeriod = (days: number) => {
    const to = new Date();
    const from = new Date(to.getTime() - (days - 1) * 86_400_000);
    setFilters((current) => ({
      ...current,
      from: dateInput(from),
      to: dateInput(to),
    }));
  };
  const saveFilter = () => {
    const name = filterName.trim();
    if (!name) return;
    const next = [
      ...savedFilters.filter((item) => item.name.toLocaleLowerCase() !== name.toLocaleLowerCase()),
      { id: crypto.randomUUID(), name, filters },
    ];
    window.localStorage.setItem(storageKey, JSON.stringify(next));
    setSavedFilters(next);
    setFilterName("");
    toast.success("Filtro guardado");
  };
  const removeFilter = (id: string) => {
    const next = savedFilters.filter((item) => item.id !== id);
    window.localStorage.setItem(storageKey, JSON.stringify(next));
    setSavedFilters(next);
  };
  const resetFilters = () => setFilters(defaultFilters());
  const filterFields = (idPrefix: string) => <><div className="space-y-2"><Label htmlFor={`${idPrefix}-from`}>Desde</Label><Input id={`${idPrefix}-from`} type="date" value={filters.from ?? ""} onChange={(event) => setFilters({ ...filters, from: event.target.value })} /></div><div className="space-y-2"><Label htmlFor={`${idPrefix}-to`}>Hasta</Label><Input id={`${idPrefix}-to`} type="date" value={filters.to ?? ""} onChange={(event) => setFilters({ ...filters, to: event.target.value })} /></div><div className="space-y-2"><Label>Alcance</Label><FormSelect aria-label="Alcance por sucursal" value={filters.scope === "tenant" ? "all" : filters.branchId ?? currentBranch?.id ?? "all"} onValueChange={(value) => setFilters({ ...filters, branchId: value === "all" ? undefined : value, scope: value === "all" ? "tenant" : "context" })} options={scopeOptions} /></div><div className="flex flex-wrap gap-2 md:col-span-3">{[7, 30, 90].map((days) => <Button key={days} size="sm" variant="secondary" onClick={() => changePeriod(days)}>Últimos {days} días</Button>)}</div></>;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analítica operativa"
        title="Reportes y analítica"
        description="Mide reclutamiento, incorporación, formación e inventario con periodo, fuente y alcance verificables."
        actions={
          <div className="flex flex-wrap gap-2">
            {can("reports.export") ? (
              <Button onClick={() => exporter.mutate()} disabled={exporter.isPending || !query.data}>
                <Download className="size-4" aria-hidden="true" />
                {exporter.isPending ? "Exportando…" : "Exportar CSV"}
              </Button>
            ) : null}
            <Button variant="secondary" onClick={() => query.refetch()} disabled={query.isFetching}>
              <RefreshCw className={`size-4 ${query.isFetching ? "animate-spin" : ""}`} aria-hidden="true" />
              Actualizar
            </Button>
          </div>
        }
      />

      <div className="md:hidden"><Button variant="secondary" className="w-full" onClick={() => setFiltersOpen(true)}><SlidersHorizontal className="size-4" />Filtros de reportes</Button></div>
      <Card level={2} className="hidden md:block">
        <CardContent className="grid gap-4 p-4 lg:grid-cols-[1fr_1fr_1.2fr]">
          {filterFields("desktop-report")}
          <div className="flex flex-col gap-2 sm:flex-row lg:col-span-3">
            <Input aria-label="Nombre del filtro" placeholder="Nombre para guardar este filtro" value={filterName} onChange={(event) => setFilterName(event.target.value)} />
            <Button variant="secondary" onClick={saveFilter} disabled={!filterName.trim()}>
              <Save className="size-4" aria-hidden="true" />
              Guardar filtro
            </Button>
            {savedFilters.length ? (
              <FormSelect
                aria-label="Filtros guardados"
                placeholder="Aplicar filtro guardado"
                options={savedFilters.map((item) => ({ value: item.id, label: item.name }))}
                onValueChange={(id) => {
                  const selected = savedFilters.find((item) => item.id === id);
                  if (selected) setFilters(selected.filters);
                }}
                className="sm:max-w-64"
              />
            ) : null}
          </div>
          {savedFilters.length ? (
            <div className="flex flex-wrap gap-2 lg:col-span-3">
              {savedFilters.map((item) => (
                <Button key={item.id} size="sm" variant="ghost" onClick={() => removeFilter(item.id)} aria-label={`Eliminar filtro ${item.name}`}>
                  {item.name}
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </Button>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
      <MobileFilterSheet open={filtersOpen} onOpenChange={setFiltersOpen} title="Filtros de reportes" onClear={resetFilters}>{filterFields("mobile-report")}</MobileFilterSheet>

      {query.isPending ? (
        <AsyncState state="loading" title="Calculando indicadores" />
      ) : query.isError || !query.data ? (
        <AsyncState
          state="error"
          title="No fue posible cargar los reportes"
          description={query.error instanceof Error ? query.error.message : "Revisa el contexto y vuelve a intentarlo."}
          onRetry={() => query.refetch()}
        />
      ) : (
        <>
          <section className="flex flex-col gap-2 rounded-2xl border bg-surface-section p-4 text-sm text-text-secondary md:flex-row md:justify-between">
            <span><strong className="text-text-primary">Periodo:</strong> {query.data.period.label}</span>
            <span><strong className="text-text-primary">Fuente:</strong> {query.data.source}</span>
            <span><strong className="text-text-primary">Alcance:</strong> {query.data.scope.branchName ?? (query.data.scope.type === "GLOBAL" ? "Global" : currentBranch?.name ?? currentTenant.name)}</span>
            <span>Actualizado {formatDateTime(query.data.generatedAt)}</span>
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            <ReportSection title="ATS y tiempo por etapa" metrics={[
              ["Postulaciones", query.data.ats.totals.applications],
              ["Vacantes activas", query.data.ats.totals.activeVacancies],
              ["Conversión", `${query.data.ats.totals.conversionRate}%`],
              ["Tiempo hasta contratar", duration(query.data.ats.totals.averageTimeToHireHours)],
            ]}>
              <DataRows headers={["Etapa", "Promedio", "Muestra"]} rows={query.data.ats.timeByStage.map((item) => [item.stage, duration(item.averageHours), item.sampleSize])} />
            </ReportSection>
            <ReportSection title="Avance de onboarding" metrics={[
              ["Procesos", query.data.onboarding.totalFlows],
              ["Completados", query.data.onboarding.completedFlows],
              ["Avance", `${query.data.onboarding.completionRate}%`],
              ["Vencidas / bloqueadas", `${query.data.onboarding.overdueTasks} / ${query.data.onboarding.blockedTasks}`],
            ]}>
              <StatusRows rows={query.data.onboarding.byStatus} />
            </ReportSection>
            <ReportSection title="Cumplimiento formativo" metrics={[
              ["Asignaciones", query.data.training.totalAssignments],
              ["Completadas", query.data.training.completed],
              ["Cumplimiento", `${query.data.training.complianceRate}%`],
              ["Vencidas", query.data.training.overdue],
            ]}>
              <StatusRows rows={query.data.training.byStatus} />
            </ReportSection>
            <ReportSection title="Inventario y activos pendientes" metrics={[
              ["Activos", query.data.inventory.totalAssets],
              ["Pendientes", query.data.inventory.pendingActions],
              ["Asignados", query.data.inventory.assigned],
              ["Disponibles", query.data.inventory.available],
            ]}>
              <StatusRows rows={query.data.inventory.byStatus} />
            </ReportSection>
          </section>
        </>
      )}
    </div>
  );
}

function ReportSection({ title, metrics, children }: { title: string; metrics: Array<[string, string | number]>; children: React.ReactNode }) {
  return (
    <Card level={2}>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <dl className="grid grid-cols-2 gap-3">
          {metrics.map(([label, value]) => (
            <div key={label} className="rounded-xl border bg-surface-section p-3">
              <dt className="text-xs text-text-secondary">{label}</dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
        {children}
      </CardContent>
    </Card>
  );
}

function StatusRows({ rows }: { rows: Array<{ status: string; count: number }> }) {
  return <DataRows headers={["Estado", "Cantidad"]} rows={rows.map((item) => [statusLabels[item.status] ?? item.status, item.count])} />;
}

function DataRows({ headers, rows }: { headers: string[]; rows: Array<Array<string | number>> }) {
  return rows.length ? (
    <><div className="grid gap-3 md:hidden">{rows.map((row, index) => <article key={`${row[0]}-${index}`} className="rounded-xl border p-3"><p className="font-semibold">{row[0]}</p><dl className="mt-3 grid grid-cols-2 gap-3">{row.slice(1).map((cell, cellIndex) => <div key={headers[cellIndex + 1]}><dt className="text-xs text-text-secondary">{headers[cellIndex + 1]}</dt><dd className="mt-1 text-sm font-medium">{cell}</dd></div>)}</dl></article>)}</div><div className="hidden overflow-x-auto rounded-xl border md:block">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-interactive"><tr>{headers.map((header) => <th key={header} scope="col" className="px-3 py-2 font-medium">{header}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={`${row[0]}-${index}`} className="border-t">{row.map((cell, cellIndex) => <td key={cellIndex} className="px-3 py-2">{cell}</td>)}</tr>)}</tbody>
      </table>
    </div></>
  ) : <p className="rounded-xl bg-surface-section p-4 text-sm text-text-secondary">No hay registros para este periodo y alcance.</p>;
}

function defaultFilters(): ReportQuery {
  const to = new Date();
  const from = new Date(to.getTime() - 29 * 86_400_000);
  return { from: dateInput(from), to: dateInput(to) };
}

function dateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

function duration(hours: number) {
  if (hours < 24) return `${hours.toLocaleString("es-ES")} h`;
  return `${(hours / 24).toLocaleString("es-ES", { maximumFractionDigits: 1 })} días`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
