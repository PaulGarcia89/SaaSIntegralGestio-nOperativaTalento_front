"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Activity, RefreshCw } from "lucide-react";
import { AsyncState } from "@/components/async-state";
import { DomainTable, StateCard } from "@/components/domain";
import { PageHeader } from "@/components/design-system";
import { MetricCard, SectionCard } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-select";
import { ApiError, fetchQueueMonitoring } from "@/lib/backend";
import { useAppStore } from "@/store/app-store";

const periodOptions = [
  { label: "Últimas 24 horas", value: "24" },
  { label: "Últimos 7 días", value: "168" },
  { label: "Últimos 30 días", value: "720" },
];
const refreshOptions = [
  { label: "Actualización apagada", value: "0" },
  { label: "Cada 5 segundos", value: "5" },
  { label: "Cada 15 segundos", value: "15" },
  { label: "Cada 30 segundos", value: "30" },
];

function formatDate(value: string | null) {
  if (!value) return "Sin actividad";
  return new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDuration(value: number) {
  if (value < 1_000) return `${Math.round(value)} ms`;
  return `${(value / 1_000).toFixed(2)} s`;
}

export default function QueueManagementPage() {
  const { currentRole, tenants } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [tenantId, setTenantId] = useState(() => searchParams.get("tenant") || "all");
  const [periodHours, setPeriodHours] = useState(() => searchParams.get("period") || "24");
  const [refreshSeconds, setRefreshSeconds] = useState(() => searchParams.get("refresh") || "0");
  const [asOf, setAsOf] = useState(() => Date.now());
  const dateRange = useMemo(() => {
    const to = new Date(asOf);
    const from = new Date(asOf - Number(periodHours) * 60 * 60 * 1_000);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [asOf, periodHours]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("tenant", tenantId);
    next.set("period", periodHours);
    next.set("refresh", refreshSeconds);
    const query = next.toString();
    if (query !== searchParams.toString()) {
      router.replace(`${pathname}?${query}`, { scroll: false });
    }
  }, [pathname, periodHours, refreshSeconds, router, searchParams, tenantId]);

  const monitoringQuery = useQuery({
    queryKey: ["queue-monitoring", tenantId, periodHours, asOf],
    queryFn: () =>
      fetchQueueMonitoring({
        ...dateRange,
        tenantId: tenantId === "all" ? undefined : tenantId,
        deadLetterLimit: 50,
      }),
    enabled: currentRole === "admin_saas",
    retry: false,
    refetchInterval: Number(refreshSeconds) > 0 ? Number(refreshSeconds) * 1_000 : false,
  });

  if (currentRole !== "admin_saas") {
    return (
      <StateCard
        tone="restricted"
        title="Consola exclusiva de superadministración"
        description="La supervisión global del bus y las colas requiere alcance de superadministrador."
      />
    );
  }

  if (monitoringQuery.isLoading) {
    return <AsyncState state="loading" title="Consultando el bus y las colas" />;
  }

  if (monitoringQuery.isError || !monitoringQuery.data) {
    const status = monitoringQuery.error instanceof ApiError ? monitoringQuery.error.status : 500;
    const errorDescription =
      status === 401
        ? "La sesión expiró. Inicia sesión nuevamente."
        : status === 403
          ? "Tu sesión no tiene el permiso platform.integrations.manage."
          : status === 404
            ? "El backend actual no expone uno o más endpoints de observabilidad."
            : status === 429
              ? "Se alcanzó el límite de consultas. Espera antes de reintentar."
              : "El servicio de observabilidad no está disponible. Conservamos tus filtros para reintentar.";
    return (
      <AsyncState
        state="error"
        title="No fue posible cargar la operación del bus"
        description={errorDescription}
        onRetry={() => void monitoringQuery.refetch()}
      />
    );
  }

  const { overview, deadLetter, throughput, errorsByTenant } = monitoringQuery.data;
  const healthy = overview.summary.failedJobs === 0 && deadLetter.openCount === 0;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Gobierno de plataforma"
        title="Bus de eventos y colas"
        description="Supervisa procesamiento, reintentos, latencia y eventos enviados a dead letter en toda la plataforma."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <FormSelect
              aria-label="Filtrar por empresa"
              className="min-w-52"
              value={tenantId}
              onValueChange={setTenantId}
              options={[
                { label: "Todas las empresas", value: "all" },
                ...tenants.map((tenant) => ({ label: tenant.name, value: tenant.id })),
              ]}
            />
            <FormSelect
              aria-label="Seleccionar periodo"
              className="min-w-44"
              value={periodHours}
              onValueChange={setPeriodHours}
              options={periodOptions}
            />
            <FormSelect
              aria-label="Configurar actualización automática"
              className="min-w-48"
              value={refreshSeconds}
              onValueChange={setRefreshSeconds}
              options={refreshOptions}
            />
            <Button type="button" variant="secondary" onClick={() => setAsOf(Date.now())}>
              <RefreshCw className="size-4" aria-hidden="true" />
              Actualizar
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/80 px-5 py-4">
        <div className="flex items-center gap-3">
          <Activity className="size-5 text-primary" aria-hidden="true" />
          <div>
            <p className="font-medium">Estado operativo</p>
            <p className="text-sm text-muted-foreground">
              Actualizado {formatDate(overview.generatedAt)} · Alcance {tenantId === "all" ? "global" : "por empresa"}
            </p>
            <p className="text-xs text-muted-foreground">
              Driver {overview.bus.driver} · {overview.bus.enabled ? "habilitado" : "deshabilitado"} ·{" "}
              {overview.bus.workerCount} workers activos
            </p>
          </div>
        </div>
        <Badge variant={healthy ? "success" : "warning"}>
          {healthy ? "Sin incidencias abiertas" : "Requiere atención"}
        </Badge>
      </div>

      <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-4">
        <MetricCard label="Eventos procesados" value={String(overview.summary.processedEvents)} detail={`${overview.summary.totalEvents} eventos recibidos`} period={periodOptions.find((option) => option.value === periodHours)?.label} />
        <MetricCard label="Pendientes" value={String(overview.summary.pendingEvents)} detail={`${overview.summary.retryingJobs} en reintento`} period={periodOptions.find((option) => option.value === periodHours)?.label} />
        <MetricCard label="Fallidos" value={String(overview.summary.failedJobs)} detail={`${deadLetter.openCount} en dead letter`} period={periodOptions.find((option) => option.value === periodHours)?.label} />
        <MetricCard label="Latencia p95" value={formatDuration(overview.performance.p95ProcessingMs)} detail={`Promedio ${formatDuration(overview.performance.averageProcessingMs)}`} period={periodOptions.find((option) => option.value === periodHours)?.label} />
      </div>

      <SectionCard title="Estado por cola" subtitle="Procesamiento">
        {overview.queueStatus.length === 0 ? (
          <StateCard tone="empty" title="Sin actividad de colas" description="No se registraron despachos durante el periodo seleccionado." />
        ) : (
          <DomainTable
            data={overview.queueStatus}
            getKey={(queue) => queue.queueName}
            columns={[
              { key: "queue", header: "Cola", render: (queue) => queue.queueName, exportValue: (queue) => queue.queueName },
              { key: "queued", header: "En cola", sortable: true, render: (queue) => queue.queued, sortValue: (queue) => queue.queued },
              { key: "ack", header: "Confirmados", sortable: true, render: (queue) => queue.acknowledged, sortValue: (queue) => queue.acknowledged },
              { key: "failed", header: "Fallidos", sortable: true, render: (queue) => queue.failed, sortValue: (queue) => queue.failed },
              { key: "total", header: "Total", sortable: true, render: (queue) => queue.total, sortValue: (queue) => queue.total },
            ]}
          />
        )}
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Rendimiento por dominio" subtitle="Eventos">
          {throughput.domains.length === 0 ? (
            <StateCard tone="empty" title="Sin eventos por dominio" description="Amplía el periodo para consultar actividad histórica." />
          ) : (
            <DomainTable
              data={throughput.domains}
              getKey={(domain) => domain.domain}
              columns={[
                { key: "domain", header: "Dominio", render: (domain) => domain.domain },
                { key: "processed", header: "Procesados", sortable: true, render: (domain) => domain.processed, sortValue: (domain) => domain.processed },
                { key: "failed", header: "Fallidos", sortable: true, render: (domain) => domain.failed + domain.deadLetter, sortValue: (domain) => domain.failed + domain.deadLetter },
                { key: "last", header: "Última actividad", render: (domain) => formatDate(domain.lastSeenAt) },
              ]}
            />
          )}
        </SectionCard>

        <SectionCard title="Errores por empresa" subtitle="Riesgo">
          {errorsByTenant.tenants.length === 0 ? (
            <StateCard tone="empty" title="Sin errores por empresa" description="No hay fallos registrados en el periodo seleccionado." />
          ) : (
            <DomainTable
              data={errorsByTenant.tenants}
              getKey={(tenant) => tenant.tenantId}
              columns={[
                { key: "tenant", header: "Empresa", render: (tenant) => tenant.tenantName },
                { key: "failed", header: "Fallidos", sortable: true, render: (tenant) => tenant.failed, sortValue: (tenant) => tenant.failed },
                { key: "dead", header: "Dead letter", sortable: true, render: (tenant) => tenant.deadLetter, sortValue: (tenant) => tenant.deadLetter },
                { key: "last", header: "Último error", render: (tenant) => formatDate(tenant.lastErrorAt) },
              ]}
            />
          )}
        </SectionCard>
      </div>

      <SectionCard title="Dead letter" subtitle={`${deadLetter.openCount} abiertos`}>
        {deadLetter.events.length === 0 ? (
          <StateCard tone="empty" title="Sin eventos en dead letter" description="No hay eventos pendientes de revisión." />
        ) : (
          <DomainTable
            exportable
            data={deadLetter.events}
            getKey={(event) => event.id}
            columns={[
              { key: "status", header: "Estado", render: (event) => event.resolvedAt ? "Resuelto" : "Abierto", exportValue: (event) => event.resolvedAt ? "Resuelto" : "Abierto" },
              { key: "queue", header: "Cola", render: (event) => event.queueName },
              { key: "event", header: "Evento", render: (event) => event.eventName },
              { key: "tenant", header: "Empresa", render: (event) => event.tenant.name },
              { key: "retries", header: "Reintentos", sortable: true, render: (event) => event.retryCount, sortValue: (event) => event.retryCount },
              { key: "reason", header: "Motivo", render: (event) => event.reason },
              { key: "date", header: "Último fallo", render: (event) => formatDate(event.lastFailedAt) },
            ]}
          />
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Vista de solo lectura. El backend aún no expone acciones seguras para reintentar o resolver eventos.
        </p>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard title="Eventos y trazabilidad" subtitle="Endpoint pendiente">
          <StateCard tone="empty" title="Función no disponible" description="Falta GET /api/admin/event-bus/events y su detalle para consultar payload sanitizado, intentos y correlation ID." />
        </SectionCard>
        <SectionCard title="Consumidores" subtitle="Endpoint pendiente">
          <StateCard tone="empty" title="Función no disponible" description="Falta GET /api/admin/event-bus/consumers para mostrar instancias, concurrencia, throughput y heartbeat." />
        </SectionCard>
        <SectionCard title="Auditoría operativa" subtitle="Endpoint pendiente">
          <StateCard tone="empty" title="Función no disponible" description="Falta GET /api/admin/event-bus/audit. No se simulan acciones ni registros de auditoría." />
        </SectionCard>
      </div>
    </div>
  );
}
