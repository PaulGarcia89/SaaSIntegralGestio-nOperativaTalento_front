"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Activity, Database, RefreshCw, ShieldCheck } from "lucide-react";
import { AsyncState } from "@/components/async-state";
import { DomainTable, StateCard } from "@/components/domain";
import { PageHeader } from "@/components/design-system";
import { MetricCard, SectionCard } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-select";
import {
  ApiError,
  fetchAtsStorageOperations,
  fetchProductionIntegrationCertification,
  fetchQueueMonitoring,
  runProductionIntegrationCertification,
  runAtsStorageMaintenance,
} from "@/lib/backend";
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

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  const units = ["KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)) - 1, units.length - 1);
  return `${(value / 1024 ** (index + 1)).toFixed(index > 0 ? 2 : 1)} ${units[index]}`;
}

function evidenceValue(value: unknown) {
  if (value === null || value === undefined) return "No informado";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
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
  const certificationQuery = useQuery({
    queryKey: ["production-integration-certification", tenantId],
    queryFn: () => fetchProductionIntegrationCertification(tenantId === "all" ? undefined : tenantId),
    enabled: currentRole === "admin_saas",
    retry: false,
  });
  const certificationMutation = useMutation({
    mutationFn: (targetTenantId?: string) => runProductionIntegrationCertification(targetTenantId),
  });
  const storageQuery = useQuery({
    queryKey: ["ats-storage-operations"],
    queryFn: fetchAtsStorageOperations,
    enabled: currentRole === "admin_saas",
    retry: false,
  });
  const storageMaintenanceMutation = useMutation({
    mutationFn: runAtsStorageMaintenance,
    onSuccess: (data) => {
      storageQuery.refetch();
      return data;
    },
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
  const selectedCertificationTenant = tenantId === "all" ? undefined : tenantId;
  const certification = certificationMutation.data
    && certificationMutation.variables === selectedCertificationTenant
    ? certificationMutation.data
    : certificationQuery.data;

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
              Controlador {overview.bus.driver} · {overview.bus.enabled ? "habilitado" : "deshabilitado"} ·{" "}
              {overview.bus.workerCount} workers activos
            </p>
          </div>
        </div>
        <Badge variant={healthy ? "success" : "warning"}>
          {healthy ? "Sin incidencias abiertas" : "Requiere atención"}
        </Badge>
      </div>

      <SectionCard
        title="Certificación de integraciones de producción"
        subtitle={certification?.mode === "ACTIVE" ? "Evidencia activa" : "Configuración"}
      >
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex max-w-3xl gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="font-medium">Resend, almacenamiento privado, antivirus y calendarios</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  La prueba activa autentica Resend, escribe y elimina un objeto efímero en cada bucket,
                  valida una muestra limpia y EICAR en ClamAV, y comprueba perfiles OAuth sin crear reuniones.
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => certificationMutation.mutate(selectedCertificationTenant)}
              disabled={certificationMutation.isPending}
            >
              <ShieldCheck className="size-4" aria-hidden="true" />
              {certificationMutation.isPending ? "Certificando..." : "Ejecutar certificación segura"}
            </Button>
          </div>

          {certificationQuery.isLoading && !certification ? (
            <p className="text-sm text-muted-foreground">Revisando la configuración desplegada...</p>
          ) : certificationQuery.isError && !certification ? (
            <StateCard
              tone="empty"
              title="No fue posible inspeccionar las integraciones"
              description="Verifica que el backend actualizado esté desplegado y que tu rol tenga permisos operativos."
            />
          ) : certification ? (
            <>
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-background/60 px-4 py-3">
                <Badge variant={certification.status === "PASS" ? "success" : certification.status === "FAIL" ? "destructive" : "warning"}>
                  {certification.status === "PASS" ? "Certificado" : certification.status === "FAIL" ? "Fallido" : "Con advertencias"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {certification.summary.passed} correctas · {certification.summary.warnings} advertencias · {certification.summary.failed} fallidas
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatDate(certification.generatedAt)} · {formatDuration(certification.durationMs)}
                </span>
              </div>
              <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                {certification.checks.map((check) => (
                  <article key={check.key} className="rounded-xl border border-border/70 bg-background/55 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium">{check.label}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{check.summary}</p>
                      </div>
                      <Badge variant={check.status === "PASS" ? "success" : check.status === "FAIL" ? "destructive" : "warning"}>
                        {check.status === "PASS" ? "Correcto" : check.status === "FAIL" ? "Falló" : check.status === "SKIPPED" ? "Omitido" : "Advertencia"}
                      </Badge>
                    </div>
                    <dl className="mt-4 space-y-2 text-xs">
                      {Object.entries(check.evidence).map(([key, value]) => (
                        <div key={key} className="flex items-start justify-between gap-4 border-t border-border/50 pt-2">
                          <dt className="text-muted-foreground">{key}</dt>
                          <dd className="max-w-[65%] break-words text-right font-medium">{evidenceValue(value)}</dd>
                        </div>
                      ))}
                    </dl>
                    {check.error ? <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{check.error}</p> : null}
                  </article>
                ))}
              </div>
            </>
          ) : null}

          {certificationMutation.isError ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              La certificación no pudo completarse. Revisa conectividad, credenciales y logs del backend.
            </p>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard title="Almacenamiento privado ATS" subtitle="Plan sin gasto adicional">
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex max-w-3xl gap-3">
              <Database className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="font-medium">R2 privado, cifrado y con retención automática</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Los archivos se entregan mediante enlaces temporales directos. El sistema elimina objetos vencidos
                  y avisa antes de alcanzar 8 GB de consumo administrado.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => storageMaintenanceMutation.mutate()}
              disabled={storageMaintenanceMutation.isPending}
            >
              <RefreshCw className={`size-4 ${storageMaintenanceMutation.isPending ? "animate-spin" : ""}`} aria-hidden="true" />
              {storageMaintenanceMutation.isPending ? "Ejecutando..." : "Ejecutar mantenimiento"}
            </Button>
          </div>

          {storageQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Calculando uso y retención...</p>
          ) : storageQuery.isError || !storageQuery.data ? (
            <StateCard
              tone="empty"
              title="No fue posible consultar el almacenamiento"
              description="Verifica que el backend actualizado esté desplegado y que tu rol tenga permisos operativos."
            />
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Uso actual" value={formatBytes(storageQuery.data.usage.usedBytes)} detail={`${storageQuery.data.usage.files} archivos privados`} period={`${storageQuery.data.usage.usedPercentOfFreeTier}% del nivel configurado`} />
                <MetricCard label="Alerta preventiva" value={formatBytes(storageQuery.data.usage.alertBytes)} detail={storageQuery.data.usage.alertReached ? "Umbral alcanzado" : `${formatBytes(storageQuery.data.usage.bytesUntilAlert)} disponibles antes de alertar`} />
                <MetricCard label="CV" value={String(storageQuery.data.usage.resumes.files)} detail={formatBytes(storageQuery.data.usage.resumes.bytes)} />
                <MetricCard label="Imágenes" value={String(storageQuery.data.usage.vacancyImages.files)} detail={formatBytes(storageQuery.data.usage.vacancyImages.bytes)} />
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {[
                  ["Bucket privado", storageQuery.data.configuration.private],
                  ["Cifrado AES-256", storageQuery.data.configuration.encryption.enabled],
                  ["URLs firmadas directas", storageQuery.data.configuration.directSignedUrls],
                  ["Credenciales configuradas", storageQuery.data.configuration.credentialsConfigured],
                ].map(([label, enabled]) => (
                  <div key={String(label)} className="flex items-center justify-between rounded-xl border border-border/70 bg-background/55 px-4 py-3">
                    <span className="text-sm">{label}</span>
                    <Badge variant={enabled ? "success" : "warning"}>{enabled ? "Activo" : "Pendiente"}</Badge>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Proveedor {storageQuery.data.configuration.provider} · Retención de CV {storageQuery.data.retention.resumeDays} días ·
                Imágenes {storageQuery.data.retention.vacancyImageDays} días · {storageQuery.data.retention.pendingExpiration} pendientes de vencer ·
                Actualizado {formatDate(storageQuery.data.generatedAt)}
              </p>
            </>
          )}

          {storageMaintenanceMutation.isSuccess ? (
            <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
              Mantenimiento completado: {storageMaintenanceMutation.data.expiredResumes ?? 0} CV y {storageMaintenanceMutation.data.expiredImages ?? 0} imágenes vencidas.
            </p>
          ) : null}
          {storageMaintenanceMutation.isError ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              No fue posible completar el mantenimiento. Revisa la conexión y los permisos del bucket.
            </p>
          ) : null}
        </div>
      </SectionCard>

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
