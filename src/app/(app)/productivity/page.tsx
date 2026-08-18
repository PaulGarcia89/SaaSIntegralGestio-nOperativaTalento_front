"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Camera, Clock3, MapPinned, Play, RefreshCw, Sparkles, TriangleAlert } from "lucide-react";
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
import { InlineFeedback, PageHeader } from "@/components/design-system";
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
            <p className="text-sm font-medium text-primary">Demo en vivo</p>
            <h2 className="text-xl font-semibold">Grabación simulada de cámaras</h2>
          </div>
          <Badge variant={session.running ? "success" : "secondary"}>{session.running ? "Simulación activa" : "Pausada"}</Badge>
        </div>
        <div className="relative min-h-[360px] overflow-hidden rounded-3xl border border-border-default bg-slate-950">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.26),transparent_28%),radial-gradient(circle_at_top_right,rgba(34,197,94,0.2),transparent_24%),linear-gradient(180deg,rgba(15,23,42,0.55),rgba(2,6,23,0.9))]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:42px_42px] opacity-35" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-[78%] w-[82%] rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(17,24,39,0.8),rgba(30,41,59,0.58))] shadow-2xl backdrop-blur-sm">
              <div className="flex h-full flex-col justify-between p-5 text-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="rounded-full bg-black/45 px-3 py-1 text-xs uppercase tracking-[0.32em] text-white/80">Cámara {session.cameras[0]?.name ?? "demo"}</div>
                  <div className="flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-100">
                    <span className="size-2 rounded-full bg-emerald-400" />
                    En grabación
                  </div>
                </div>
                <div className="grid gap-3 lg:grid-cols-[1.3fr_0.7fr]">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60">Zona activa</p>
                    <p className="mt-2 text-2xl font-semibold">{activeEvent?.zoneName ?? "Sin eventos registrados"}</p>
                    <p className="mt-2 text-sm text-white/80">La cámara está registrando ocupación, flujo y tiempos de permanencia para generar productividad demo.</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="secondary" className="border-white/15 bg-white/10 text-white">Personas {activeEvent?.peopleDetected ?? 0}</Badge>
                      <Badge variant="secondary" className="border-white/15 bg-white/10 text-white">Productividad {activeEvent?.productivityScore ?? 0}%</Badge>
                      <Badge variant="secondary" className="border-white/15 bg-white/10 text-white">Eventos {summary.totalEvents}</Badge>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-sm">
                      <p className="text-xs uppercase tracking-[0.3em] text-white/60">Estado</p>
                      <p className="mt-2 text-lg font-semibold">Flujo operativo controlado</p>
                      <p className="text-sm text-white/80">{activeEvent?.note ?? "El demo simula capturas continuas con zonas activas."}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-sm">
                      <p className="text-xs uppercase tracking-[0.3em] text-white/60">Última marca</p>
                      <p className="mt-2 text-lg font-semibold">{formatTime(summary.latestEvent?.occurredAt)}</p>
                      <p className="text-sm text-white/80">La simulación avanza automáticamente mientras esté activa.</p>
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
  const [running, setRunning] = useState(true);
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
  const metricItems = [
    [Activity, "Eventos", overviewData.totalEvents],
    [Clock3, "Tiempo activo", formatMinutes(overviewData.activeSeconds)],
    [Clock3, "Sin actividad", formatMinutes(overviewData.idleSeconds)],
    [Camera, "Cámaras en línea", overviewData.camerasOnline],
    [MapPinned, "Zonas activas", overviewData.zonesActive],
    [TriangleAlert, "Alertas", overviewData.alertsOpen],
  ] as const;

  const visibleAlerts = alerts.data?.slice(0, 4) ?? [];
  const visibleZones = insights.data?.zones?.length ? insights.data.zones : sessionSummary.byZone.map((item) => ({
    zone: { id: item.zone.id, name: item.zone.name },
    events: item.events,
    activeSeconds: item.activeSeconds,
    idleSeconds: item.idleSeconds,
    confidence: item.confidence,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operación y capacidad"
        title="Productividad"
        description="Demostración visual de cámaras, zonas y eventos operativos. No representa evaluaciones automáticas ni decisiones laborales."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => setRunning((current) => !current)}
              disabled={session.cameras.length === 0}
            >
              {running ? <RefreshCw className="size-4" /> : <Play className="size-4" />}
              {running ? "Pausar demo" : "Reanudar demo"}
            </Button>
            <Button
              onClick={() => {
                const nextEvent = createNextDemoEvent(session);
                if (nextEvent) createEvent.mutate(nextEvent);
              }}
              disabled={session.cameras.length === 0 || createEvent.isPending}
            >
              <Sparkles className="size-4" />
              {createEvent.isPending ? "Guardando evento" : "Generar evento"}
            </Button>
          </>
        }
      />

      <InlineFeedback tone="info" title="Escenario de demostración activo">
        Cada captura demo se almacena en la base de datos y vuelve a consultarse desde el backend para poblar estas métricas.
      </InlineFeedback>

      {session.cameras.length === 0 ? (
        <InlineFeedback tone="warning" title="No hay cámaras activas en esta sucursal">
          Registra y activa una cámara en Cámaras y zonas antes de iniciar la demostración. No se generarán datos ficticios.
        </InlineFeedback>
      ) : null}

      {createEvent.isError ? (
        <InlineFeedback tone="danger" title="El evento no pudo almacenarse">
          {createEvent.error instanceof Error ? createEvent.error.message : "El backend rechazó el registro."}
        </InlineFeedback>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.9fr]">
        <DemoCameraPreview session={session} />
        <Card level={2}>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-primary">Resumen del demo</p>
                <h2 className="text-xl font-semibold">{currentBranch.name}</h2>
              </div>
              <Badge variant={running ? "success" : "secondary"}>{running ? "Grabando" : "En pausa"}</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-surface-section p-4">
                <p className="text-sm text-text-secondary">Productividad promedio</p>
                <p className="mt-2 text-3xl font-semibold">{Math.round(sessionSummary.averageProductivity)}%</p>
              </div>
              <div className="rounded-2xl bg-surface-section p-4">
                <p className="text-sm text-text-secondary">Eventos generados</p>
                <p className="mt-2 text-3xl font-semibold">{sessionSummary.totalEvents}</p>
              </div>
              <div className="rounded-2xl bg-surface-section p-4">
                <p className="text-sm text-text-secondary">Tiempo activo demo</p>
                <p className="mt-2 text-3xl font-semibold">{formatMinutes(sessionSummary.activeSeconds)}</p>
              </div>
              <div className="rounded-2xl bg-surface-section p-4">
                <p className="text-sm text-text-secondary">Cámaras vivas</p>
                <p className="mt-2 text-3xl font-semibold">{sessionSummary.activeCameras}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-border-default p-4">
              <p className="text-sm font-medium">Cámaras registradas</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {session.cameras.map((camera) => (
                  <Badge key={camera.id} variant="secondary">
                    {camera.name}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metricItems.map(([Icon, label, value]) => (
          <Card key={label} level={2}>
            <CardContent className="flex gap-3 p-4">
              <Icon className="size-5 text-primary" />
              <div>
                <p className="text-sm text-text-secondary">{label}</p>
                <p className="text-2xl font-semibold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card level={2}>
          <CardContent className="space-y-4 p-5">
            <h2 className="font-semibold">Línea de tiempo de actividad</h2>
            <div className="space-y-3">
              {session?.events.slice(0, 6).map((event) => (
                <div key={event.id} className="rounded-2xl border border-border-default bg-surface-section p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{event.label}</p>
                    <p className="text-xs text-text-secondary">{formatTime(event.occurredAt)}</p>
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">
                    {event.cameraName} · {event.zoneName} · {event.peopleDetected} personas detectadas · {event.productivityScore}% productividad
                  </p>
                </div>
              ))}
              {session.events.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border-default p-4 text-sm text-text-secondary">
                  Aún no hay eventos demo almacenados para esta sucursal.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card level={2}>
          <CardContent className="space-y-4 p-5">
            <h2 className="font-semibold">Zonas activas</h2>
            <div className="space-y-3">
              {visibleZones.slice(0, 4).map((item) => (
                <div key={item.zone.id} className="rounded-2xl bg-surface-section p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{item.zone.name}</p>
                    <Badge variant="secondary">{item.confidence}% confianza</Badge>
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">
                    {item.events} eventos · {formatMinutes(item.activeSeconds)} activos · {formatMinutes(item.idleSeconds)} inactivos
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {visibleAlerts.length ? (
        <Card level={2}>
          <CardContent className="space-y-3 p-5">
            <h2 className="font-semibold">Alertas recientes</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {visibleAlerts.map((alert) => (
                <div key={alert.id} className="rounded-2xl border border-border-default bg-surface-section p-4">
                  <p className="font-medium">{alert.title}</p>
                  <p className="mt-1 text-sm text-text-secondary">{alert.description}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-text-secondary">{alert.status}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {insights.data?.recommendations.length ? (
        <Card level={2}>
          <CardContent className="space-y-3 p-5">
            <h2 className="font-semibold">Recomendaciones para revisión humana</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {insights.data.recommendations.map((item) => (
                <div key={item.zoneId} className="rounded-2xl border border-primary/20 p-4">
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-sm text-text-secondary">{item.explanation}</p>
                  <p className="mt-2 text-sm font-medium text-primary">Siguiente paso: {item.suggestedAction}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
