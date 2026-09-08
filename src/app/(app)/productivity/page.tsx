"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Play, RefreshCw, Sparkles } from "lucide-react";
import {
  createProductivityDemoEvent,
  fetchProductivityAlerts,
  fetchProductivityCameras,
  fetchProductivityEvents,
  fetchProductivityInsights,
  fetchProductivityOverview,
  fetchProductivityZones,
} from "@/lib/backend";
import {
  createDemoSession,
  createNextDemoEvent,
  summarizeDemoSession,
  type ProductivityDemoSession,
} from "@/lib/productivity-demo";
import { useAppStore } from "@/store/app-store";
import { AsyncState } from "@/components/async-state";
import {
  ActiveContext,
  EmptyState,
  InlineNote,
  PageHeader,
  PageSection,
  StatusBadge,
  StatusTile,
  StatusTileRow,
  Timeline,
} from "@/components/system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function formatMinutes(seconds: number) {
  return `${Math.max(0, Math.round(seconds / 60))} min`;
}

function formatTime(iso?: string | null) {
  if (!iso) return "Sin actividad";
  return new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }).format(new Date(iso));
}

function DemoCameraPreview({ session }: { session: ProductivityDemoSession }) {
  const summary = summarizeDemoSession(session);
  const activeEvent = summary.latestEvent;

  return (
    <Card level={2} className="overflow-hidden">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-brand">Demo en vivo</p>
            <h2 className="text-xl font-semibold">Grabación simulada de cámaras</h2>
          </div>
          <Badge variant={session.running ? "success" : "secondary"}>{session.running ? "Simulación activa" : "Pausada"}</Badge>
        </div>
        <div className="relative min-h-[360px] overflow-hidden rounded-3xl border border-border-default bg-surface-dark-1">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(38_94%_52%_/_0.26),transparent_28%),radial-gradient(circle_at_top_right,hsl(158_62%_45%_/_0.2),transparent_24%),linear-gradient(180deg,hsl(213_40%_10%_/_0.55),hsl(213_44%_7%_/_0.9))]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,hsl(210_22%_96%_/_0.03)_1px,transparent_1px),linear-gradient(hsl(210_22%_96%_/_0.03)_1px,transparent_1px)] bg-[size:42px_42px] opacity-35" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-[78%] w-[82%] rounded-[2rem] border border-surface-dark-ink/10 bg-[linear-gradient(135deg,hsl(213_38%_12%_/_0.8),hsl(213_34%_15%_/_0.58))] shadow-2xl backdrop-blur-sm">
              <div className="flex h-full flex-col justify-between p-5 text-surface-dark-ink">
                <div className="flex items-start justify-between gap-3">
                  <div className="rounded-full bg-black/45 px-3 py-1 text-xs uppercase tracking-[0.32em] text-surface-dark-ink/80">Cámara {session.cameras[0]?.name ?? "demo"}</div>
                  <div className="flex items-center gap-2 rounded-full border border-status-success/40 bg-status-success/15 px-3 py-1 text-xs font-medium text-status-success">
                    <span className="size-2 rounded-full bg-status-success" />
                    En grabación
                  </div>
                </div>
                <div className="grid gap-3 lg:grid-cols-[1.3fr_0.7fr]">
                  <div className="rounded-2xl border border-surface-dark-ink/10 bg-black/30 p-4 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-[0.3em] text-surface-dark-ink/60">Zona activa</p>
                    <p className="mt-2 text-2xl font-semibold">{activeEvent?.zoneName ?? "Sin eventos registrados"}</p>
                    <p className="mt-2 text-sm text-surface-dark-ink/80">La cámara está registrando ocupación, flujo y tiempos de permanencia para generar productividad demo.</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="secondary" className="border-surface-dark-ink/15 bg-surface-dark-ink/10 text-surface-dark-ink">Personas {activeEvent?.peopleDetected ?? 0}</Badge>
                      <Badge variant="secondary" className="border-surface-dark-ink/15 bg-surface-dark-ink/10 text-surface-dark-ink">Productividad {activeEvent?.productivityScore ?? 0}%</Badge>
                      <Badge variant="secondary" className="border-surface-dark-ink/15 bg-surface-dark-ink/10 text-surface-dark-ink">Eventos {summary.totalEvents}</Badge>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <div className="rounded-2xl border border-surface-dark-ink/10 bg-black/30 p-4 backdrop-blur-sm">
                      <p className="text-xs uppercase tracking-[0.3em] text-surface-dark-ink/60">Estado</p>
                      <p className="mt-2 text-lg font-semibold">Flujo operativo controlado</p>
                      <p className="text-sm text-surface-dark-ink/80">{activeEvent?.note ?? "El demo simula capturas continuas con zonas activas."}</p>
                    </div>
                    <div className="rounded-2xl border border-surface-dark-ink/10 bg-black/30 p-4 backdrop-blur-sm">
                      <p className="text-xs uppercase tracking-[0.3em] text-surface-dark-ink/60">Última marca</p>
                      <p className="mt-2 text-lg font-semibold">{formatTime(summary.latestEvent?.occurredAt)}</p>
                      <p className="text-sm text-surface-dark-ink/80">La simulación avanza automáticamente mientras esté activa.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProductivityPage() {
  const { currentBranch } = useAppStore();
  const branchId = currentBranch?.id;
  const queryClient = useQueryClient();
  /*
   * La simulación arranca DETENIDA.
   *
   * Antes empezaba sola al abrir la pantalla y escribía un evento inventado
   * en la base de datos cada 3,2 segundos. Nadie había pedido nada: bastaba
   * con entrar. Eso mezcla datos simulados con datos reales en la misma tabla
   * y, cuanto más tiempo se deja la pestaña abierta, más difícil es
   * distinguirlos después. Ahora hay que pulsar «Iniciar simulación», y el
   * aviso dice antes de pulsarlo qué va a pasar.
   */
  const [running, setRunning] = useState(false);
  const [frame, setFrame] = useState(0);

  const overview = useQuery({
    queryKey: ["productivity-overview", branchId],
    queryFn: () => fetchProductivityOverview(branchId),
    enabled: Boolean(branchId),
  });
  const alerts = useQuery({
    queryKey: ["productivity-alerts", branchId],
    queryFn: () => fetchProductivityAlerts(branchId),
    enabled: Boolean(branchId),
  });
  const insights = useQuery({
    queryKey: ["productivity-insights", branchId],
    queryFn: () => fetchProductivityInsights(branchId),
    enabled: Boolean(branchId),
  });
  const cameras = useQuery({
    queryKey: ["productivity-cameras", branchId],
    queryFn: () => fetchProductivityCameras(branchId),
    enabled: Boolean(branchId),
  });
  const zones = useQuery({
    queryKey: ["productivity-zones", branchId],
    queryFn: () => fetchProductivityZones(),
    enabled: Boolean(branchId),
  });
  const events = useQuery({
    queryKey: ["productivity-events", branchId, "DEMO"],
    queryFn: () => fetchProductivityEvents({ branchId: branchId!, source: "DEMO", limit: 100 }),
    enabled: Boolean(branchId),
    refetchInterval: running ? 3500 : false,
  });

  const session = useMemo(
    () =>
      createDemoSession({
        cameras: cameras.data ?? [],
        zones: zones.data ?? [],
        events: events.data ?? [],
        running,
        frame,
      }),
    [cameras.data, events.data, frame, running, zones.data],
  );
  const sessionRef = useRef(session);
  const pendingRef = useRef(false);
  const createEventRef = useRef<(input: ReturnType<typeof createNextDemoEvent>) => void>(() => undefined);
  const createEvent = useMutation({
    mutationFn: createProductivityDemoEvent,
    onSuccess: async () => {
      setFrame((current) => current + 1);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["productivity-events", branchId] }),
        queryClient.invalidateQueries({ queryKey: ["productivity-overview", branchId] }),
        queryClient.invalidateQueries({ queryKey: ["productivity-alerts", branchId] }),
        queryClient.invalidateQueries({ queryKey: ["productivity-insights", branchId] }),
      ]);
    },
  });
  const persistDemoEvent = createEvent.mutate;

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    pendingRef.current = createEvent.isPending;
  }, [createEvent.isPending]);

  useEffect(() => {
    createEventRef.current = (input) => {
      if (input) persistDemoEvent(input);
    };
  }, [persistDemoEvent]);

  useEffect(() => {
    if (!running || session.cameras.length === 0) return;
    const id = window.setInterval(() => {
      if (pendingRef.current) return;
      const nextEvent = createNextDemoEvent(sessionRef.current);
      createEventRef.current(nextEvent);
    }, 3200);
    return () => window.clearInterval(id);
  }, [running, session.cameras.length]);

  const sessionSummary = useMemo(() => summarizeDemoSession(session), [session]);

  if (!branchId) {
    return <AsyncState state="error" title="Selecciona una sucursal para revisar productividad" />;
  }
  if (overview.isLoading || cameras.isLoading || zones.isLoading || events.isLoading) {
    return <AsyncState state="loading" title="Cargando demo de productividad" />;
  }
  if (overview.isError || cameras.isError || zones.isError || events.isError) {
    const error = overview.error ?? cameras.error ?? zones.error ?? events.error;
    return <AsyncState state="error" title="No pudimos cargar Productividad" description={error instanceof Error ? error.message : undefined} onRetry={() => void Promise.all([overview.refetch(), cameras.refetch(), zones.refetch(), events.refetch()])} />;
  }
  const overviewData = overview.data!;

  const visibleAlerts = alerts.data ?? [];
  const visibleZones = insights.data?.zones?.length
    ? insights.data.zones
    : sessionSummary.byZone.map((item) => ({
        zone: { id: item.zone.id, name: item.zone.name },
        events: item.events,
        activeSeconds: item.activeSeconds,
        idleSeconds: item.idleSeconds,
        confidence: item.confidence,
      }));

  const sinCamaras = session.cameras.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operación y capacidad"
        title="Productividad"
        description="Ocupación y flujo por zona, medidos con las cámaras registradas en esta sucursal. No evalúa a personas ni sustituye una decisión laboral."
      />

      <ActiveContext />

      {/* ---- 1. Qué necesita atención -----------------------------------
          Las alertas abiertas son lo único de esta pantalla que exige una
          acción. Si las hay, van antes que cualquier cifra. */}
      {visibleAlerts.length > 0 ? (
        <PageSection
          title="Alertas abiertas"
          description="Situaciones que el sistema marcó para que alguien las mire."
          id="alertas"
        >
          <ul className="grid gap-3 md:grid-cols-2">
            {visibleAlerts.slice(0, 4).map((alert) => (
              <li key={alert.id}>
                <article className="flex h-full flex-col gap-2 rounded-lg border border-status-warning/40 bg-surface-1 p-4">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <h3 className="min-w-0 text-sm font-semibold text-ink-1">{alert.title}</h3>
                    <StatusBadge size="sm" tone="warning" label={alert.status} />
                  </div>
                  <p className="text-sm text-ink-2">{alert.description}</p>
                  <p className="mt-auto text-2xs text-ink-3">{formatTime(alert.createdAt)}</p>
                </article>
              </li>
            ))}
          </ul>
        </PageSection>
      ) : null}

      {/* ---- 2. Cómo está la sucursal -----------------------------------
          Cifras del backend, no de la simulación. Cuatro, no seis: «Eventos»
          y «Sin actividad» son detalle del periodo y viven en el desglose por
          zona, que es donde se pueden interpretar. */}
      <StatusTileRow label="Estado de la operación">
        <li className="min-w-0">
          <StatusTile
            title="Cámaras en línea"
            value={overviewData.camerasOnline}
            context="Registrando ahora mismo en esta sucursal."
            status={
              overviewData.camerasOnline === 0
                ? { label: "Ninguna activa", tone: "warning" as const }
                : undefined
            }
            href="/productivity/cameras"
            actionLabel="Ver cámaras"
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title="Zonas con actividad"
            value={overviewData.zonesActive}
            context="Zonas que registraron movimiento en el periodo."
            href="/productivity/cameras"
            actionLabel="Ver zonas"
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title="Alertas abiertas"
            value={overviewData.alertsOpen}
            context="Sin revisar o sin resolver."
            status={
              overviewData.alertsOpen > 0
                ? { label: "Requieren revisión", tone: "warning" as const }
                : undefined
            }
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title="Tiempo activo"
            value={formatMinutes(overviewData.activeSeconds)}
            context={`Frente a ${formatMinutes(overviewData.idleSeconds)} sin actividad.`}
            scope={insights.data ? `Del ${insights.data.period.from} al ${insights.data.period.to}` : undefined}
          />
        </li>
      </StatusTileRow>

      {/* ---- 3. Reparto por zona ---------------------------------------- */}
      {visibleZones.length > 0 ? (
        <PageSection
          title="Actividad por zona"
          description="Cuánto tiempo estuvo activa cada zona y con qué confianza lo midió la cámara."
          id="zonas"
        >
          <ul className="space-y-1">
            {visibleZones.slice(0, 6).map((item) => (
              <li
                key={item.zone.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border border-line bg-surface-1 px-4 py-3"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink-1">{item.zone.name}</span>
                  <span className="block truncate text-xs text-ink-3">
                    {item.events} eventos · {formatMinutes(item.activeSeconds)} activos · {formatMinutes(item.idleSeconds)} inactivos
                  </span>
                </span>
                {/* La confianza acompaña siempre a la medida: sin ella, un
                    porcentaje de una cámara mal calibrada se lee igual que
                    uno fiable. */}
                <StatusBadge
                  size="sm"
                  tone={item.confidence >= 70 ? "success" : item.confidence >= 40 ? "warning" : "danger"}
                  label={`Confianza ${item.confidence} %`}
                />
              </li>
            ))}
          </ul>
        </PageSection>
      ) : null}

      {/* ---- 4. Recomendaciones ----------------------------------------- */}
      {insights.data?.recommendations.length ? (
        <PageSection
          title="Para revisión humana"
          description="Sugerencias derivadas de la medición. Ninguna se aplica sola."
          id="recomendaciones"
        >
          <ul className="grid gap-3 md:grid-cols-2">
            {insights.data.recommendations.map((item) => (
              <li key={item.zoneId}>
                <article className="flex h-full flex-col gap-2 rounded-lg border border-line bg-surface-1 p-4">
                  <h3 className="text-sm font-semibold text-ink-1">{item.title}</h3>
                  <p className="text-sm text-ink-2">{item.explanation}</p>
                  <p className="mt-auto text-sm font-medium text-accent-ink">
                    Siguiente paso: {item.suggestedAction}
                  </p>
                </article>
              </li>
            ))}
          </ul>
        </PageSection>
      ) : null}

      {/* ---- 5. Simulación de demostración ------------------------------
          Separada del resto y apagada de fábrica. Todo lo de arriba son
          cifras del backend; esto de aquí escribe eventos inventados en la
          misma base de datos, y el aviso lo dice ANTES de que nadie pulse. */}
      <PageSection
        title="Simulación de demostración"
        description="Genera eventos de ejemplo para enseñar cómo se ve el módulo cuando hay actividad."
        id="simulacion"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setRunning((current) => !current)} disabled={sinCamaras}>
              {running ? <RefreshCw className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
              {running ? "Detener simulación" : "Iniciar simulación"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                const nextEvent = createNextDemoEvent(session);
                if (nextEvent) createEvent.mutate(nextEvent);
              }}
              disabled={sinCamaras || createEvent.isPending}
            >
              <Sparkles className="size-4" aria-hidden="true" />
              {createEvent.isPending ? "Guardando…" : "Generar un evento"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <InlineNote tone="warning" title="Los eventos que genere se guardan en la base de datos">
            Quedan marcados con origen «DEMO» y suman a los contadores de arriba. Úsalo para demostraciones, no
            sobre datos de operación real.
          </InlineNote>

          {sinCamaras ? (
            <EmptyState
              reason="no-records"
              title="No hay cámaras activas en esta sucursal"
              description="Registra y activa una cámara antes de simular. No se generan datos sin una cámara real detrás."
              action={
                <Button asChild variant="secondary">
                  <Link href="/productivity/cameras">Ir a Cámaras y zonas</Link>
                </Button>
              }
            />
          ) : null}

          {createEvent.isError ? (
            <InlineNote tone="danger" title="El evento no pudo almacenarse">
              {createEvent.error instanceof Error ? createEvent.error.message : "El backend rechazó el registro."}
            </InlineNote>
          ) : null}

          {!sinCamaras ? (
            <>
              <DemoCameraPreview session={session} />

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <DemoFigure label="Productividad media" value={`${Math.round(sessionSummary.averageProductivity)} %`} />
                <DemoFigure label="Eventos generados" value={String(sessionSummary.totalEvents)} />
                <DemoFigure label="Tiempo activo simulado" value={formatMinutes(sessionSummary.activeSeconds)} />
                <DemoFigure label="Cámaras en la simulación" value={String(sessionSummary.activeCameras)} />
              </div>

              {session.events.length > 0 ? (
                <Timeline
                  entries={session.events.slice(0, 6).map((event) => ({
                    id: event.id,
                    title: event.label,
                    detail: `${event.cameraName} · ${event.zoneName} · ${event.peopleDetected} personas · ${event.productivityScore} % productividad`,
                    when: formatTime(event.occurredAt),
                  }))}
                />
              ) : (
                <p className="rounded-lg border border-dashed border-line p-4 text-sm text-ink-2">
                  Todavía no hay eventos de demostración para esta sucursal.
                </p>
              )}
            </>
          ) : null}
        </div>
      </PageSection>
    </div>
  );
}

/** Cifra de la simulación. Va en gris y sin acción: no es una medida real. */
function DemoFigure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 p-4">
      <p className="text-sm text-ink-2">{label}</p>
      <p className="mt-1 font-mono text-2xl font-semibold tabular-figures text-ink-1">{value}</p>
    </div>
  );
}
