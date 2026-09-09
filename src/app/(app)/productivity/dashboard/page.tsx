"use client";

import { useUiText } from "@/components/ui-copy";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Play, RefreshCw, Sparkles } from "lucide-react";
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
import { BarChart, ChartCard } from "@/components/chart";
import { useLocale } from "@/components/locale-provider";

function formatMinutes(seconds: number) {
  return `${Math.max(0, Math.round(seconds / 60))} min`;
}

/**
 * Fecha y hora en el idioma activo.
 *
 * Antes estaba fijado a `"es"`, así que en inglés la pantalla seguía diciendo
 * «14 sept». El idioma es un argumento, no una constante.
 */
function formatTime(iso: string | null | undefined, locale: string, sinDato: string) {
  if (!iso) return sinDato;
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return sinDato;
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  }).format(fecha);
}

function DemoCameraPreview({ session }: { session: ProductivityDemoSession }) {
  const uiText = useUiText();
  const { locale } = useLocale();
  const summary = summarizeDemoSession(session);
  const activeEvent = summary.latestEvent;

  return (
    <Card level={2} className="overflow-hidden">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-brand">{uiText("Demo en vivo")}</p>
            <h2 className="text-xl font-semibold">{uiText("Grabación simulada de cámaras")}</h2>
          </div>
          <Badge variant={session.running ? "success" : "secondary"}>{session.running ? uiText("Simulación activa") : uiText("Pausada")}</Badge>
        </div>
        <div className="relative min-h-[360px] overflow-hidden rounded-3xl border border-border-default bg-surface-dark-1">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(38_94%_52%_/_0.26),transparent_28%),radial-gradient(circle_at_top_right,hsl(158_62%_45%_/_0.2),transparent_24%),linear-gradient(180deg,hsl(213_40%_10%_/_0.55),hsl(213_44%_7%_/_0.9))]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,hsl(210_22%_96%_/_0.03)_1px,transparent_1px),linear-gradient(hsl(210_22%_96%_/_0.03)_1px,transparent_1px)] bg-[size:42px_42px] opacity-35" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-[78%] w-[82%] rounded-[2rem] border border-surface-dark-ink/10 bg-[linear-gradient(135deg,hsl(213_38%_12%_/_0.8),hsl(213_34%_15%_/_0.58))] shadow-2xl backdrop-blur-sm">
              <div className="flex h-full flex-col justify-between p-5 text-surface-dark-ink">
                <div className="flex items-start justify-between gap-3">
                  <div className="rounded-full bg-black/45 px-3 py-1 text-xs uppercase tracking-[0.32em] text-surface-dark-ink/80">{uiText("Cámara ")}{session.cameras[0]?.name ?? "demo"}</div>
                  <div className="flex items-center gap-2 rounded-full border border-status-success/40 bg-status-success/15 px-3 py-1 text-xs font-medium text-status-success">
                    <span className="size-2 rounded-full bg-status-success" />
                    {uiText("En grabación")}</div>
                </div>
                <div className="grid gap-3 lg:grid-cols-[1.3fr_0.7fr]">
                  <div className="rounded-2xl border border-surface-dark-ink/10 bg-black/30 p-4 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-[0.3em] text-surface-dark-ink/60">{uiText("Zona activa")}</p>
                    <p className="mt-2 text-2xl font-semibold">{activeEvent?.zoneName ?? uiText("Sin eventos registrados")}</p>
                    <p className="mt-2 text-sm text-surface-dark-ink/80">{uiText("La cámara está registrando ocupación, flujo y tiempos de permanencia para generar productividad demo.")}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="secondary" className="border-surface-dark-ink/15 bg-surface-dark-ink/10 text-surface-dark-ink">{uiText("Personas ")}{activeEvent?.peopleDetected ?? 0}</Badge>
                      <Badge variant="secondary" className="border-surface-dark-ink/15 bg-surface-dark-ink/10 text-surface-dark-ink">{uiText("Productividad ")}{activeEvent?.productivityScore ?? 0}%</Badge>
                      <Badge variant="secondary" className="border-surface-dark-ink/15 bg-surface-dark-ink/10 text-surface-dark-ink">{uiText("Eventos ")}{summary.totalEvents}</Badge>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <div className="rounded-2xl border border-surface-dark-ink/10 bg-black/30 p-4 backdrop-blur-sm">
                      <p className="text-xs uppercase tracking-[0.3em] text-surface-dark-ink/60">{uiText("Estado")}</p>
                      <p className="mt-2 text-lg font-semibold">{uiText("Flujo operativo controlado")}</p>
                      <p className="text-sm text-surface-dark-ink/80">{activeEvent?.note ?? uiText("El demo simula capturas continuas con zonas activas.")}</p>
                    </div>
                    <div className="rounded-2xl border border-surface-dark-ink/10 bg-black/30 p-4 backdrop-blur-sm">
                      <p className="text-xs uppercase tracking-[0.3em] text-surface-dark-ink/60">{uiText("Última marca")}</p>
                      <p className="mt-2 text-lg font-semibold">{formatTime(summary.latestEvent?.occurredAt, locale, uiText("Sin actividad"))}</p>
                      <p className="text-sm text-surface-dark-ink/80">{uiText("La simulación avanza automáticamente mientras esté activa.")}</p>
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
  const uiText = useUiText();
  const { locale } = useLocale();
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
    return <AsyncState state="error" title={uiText("Selecciona una sucursal para revisar productividad")} />;
  }
  if (overview.isLoading || cameras.isLoading || zones.isLoading || events.isLoading) {
    return <AsyncState state="loading" title={uiText("Cargando demo de productividad")} />;
  }
  if (overview.isError || cameras.isError || zones.isError || events.isError) {
    const error = overview.error ?? cameras.error ?? zones.error ?? events.error;
    return <AsyncState state="error" title={uiText("No pudimos cargar Productividad")} description={error instanceof Error ? error.message : undefined} onRetry={() => void Promise.all([overview.refetch(), cameras.refetch(), zones.refetch(), events.refetch()])} />;
  }
  const overviewData = overview.data!;

  const visibleAlerts = alerts.data ?? [];

  /*
   * Procedencia de las zonas.
   *
   * Cuando el servidor no devuelve zonas medidas, esta pantalla caía a las de
   * la SIMULACIÓN y las pintaba bajo el mismo título, con el mismo aspecto y
   * sin ninguna marca: quien mirara no tenía forma de saber que estaba viendo
   * eventos inventados. Todo el cuidado de la sección de demostración —el
   * aviso, el arranque en pausa, la etiqueta DEMO— se perdía justo aquí.
   *
   * Se conserva la caída, porque enseñar la forma del módulo con datos de
   * ejemplo es útil, pero ahora la sección dice de dónde salen.
   */
  const zonasMedidas = insights.data?.zones ?? [];
  const zonasSimuladas = sessionSummary.byZone.map((item) => ({
    zone: { id: item.zone.id, name: item.zone.name },
    events: item.events,
    activeSeconds: item.activeSeconds,
    idleSeconds: item.idleSeconds,
    confidence: item.confidence,
  }));
  const zonasSonSimuladas = zonasMedidas.length === 0 && zonasSimuladas.length > 0;
  const visibleZones = zonasMedidas.length ? zonasMedidas : zonasSimuladas;

  const sinCamaras = session.cameras.length === 0;

  // Proporción de tiempo con actividad. Sin denominador no hay porcentaje:
  // un «0 %» sobre cero segundos medidos diría algo que no se sabe.
  const tiempoMedido = overviewData.activeSeconds + overviewData.idleSeconds;
  const usoPorcentaje = tiempoMedido > 0 ? Math.round((overviewData.activeSeconds / tiempoMedido) * 100) : null;
  const periodo = insights.data
    ? uiText("Del {{from}} al {{to}}", { from: insights.data.period.from, to: insights.data.period.to })
    : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={uiText("Productividad")}
        title={uiText("Dashboard de productividad")}
        description={uiText("Ocupación y flujo por zona, medidos con las cámaras registradas en esta sucursal. No evalúa a personas ni sustituye una decisión laboral.")}
      />

      <ActiveContext />

      {/* ---- 1. Qué necesita atención -----------------------------------
          Las alertas abiertas son lo único de esta pantalla que exige una
          acción. Si las hay, van antes que cualquier cifra. */}
      {visibleAlerts.length > 0 ? (
        <PageSection
          title={uiText("Alertas abiertas")}
          description={uiText("Situaciones que el sistema marcó para que alguien las mire.")}
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
                  <p className="mt-auto text-2xs text-ink-3">{formatTime(alert.createdAt, locale, uiText("Sin actividad"))}</p>
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
      <StatusTileRow label={uiText("Estado de la operación")}>
        <li className="min-w-0">
          <StatusTile
            title={uiText("Cámaras en línea")}
            // «3» no dice nada sin saber de cuántas. El total está en la misma
            // respuesta que la pantalla ya descarga.
            value={uiText("{{online}} de {{total}}", {
              online: overviewData.camerasOnline,
              total: session.cameras.length,
            })}
            context={uiText("Registrando ahora mismo en esta sucursal.")}
            status={
              overviewData.camerasOnline === 0
                ? { label: uiText("Ninguna activa"), tone: "warning" as const }
                : undefined
            }
            href="/productivity/cameras"
            actionLabel={uiText("Ver cámaras")}
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title={uiText("Zonas con actividad")}
            value={overviewData.zonesActive}
            context={uiText("Zonas que registraron movimiento en el periodo.")}
            href="/productivity/cameras"
            actionLabel={uiText("Ver zonas")}
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title={uiText("Alertas abiertas")}
            value={overviewData.alertsOpen}
            context={uiText("Sin revisar o sin resolver.")}
            status={
              overviewData.alertsOpen > 0
                ? { label: uiText("Requieren revisión"), tone: "warning" as const }
                : undefined
            }
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title={uiText("Uso de la sucursal")}
            value={uiText("{{n}} %", { n: usoPorcentaje ?? 0 })}
            context={uiText("Del tiempo medido, cuánto hubo actividad.")}
            scope={periodo}
          />
        </li>
      </StatusTileRow>

      {/* ---- 2.bis Cuánto tiempo hubo actividad -------------------------
          «45 min activos frente a 12 min sin actividad» era una proporción
          escrita en prosa. Es la medida que da nombre al módulo, así que se
          dibuja. */}
      {overviewData.activeSeconds + overviewData.idleSeconds > 0 ? (
        <ChartCard
          title={uiText("Tiempo medido en la sucursal")}
          subtitle={uiText("Cuánto de lo observado por las cámaras fue actividad")}
          period={periodo}
        >
          {/* Apilado y con las MISMAS dos series que el reparto por zona: son
              el mismo par de conceptos, y codificarlos de dos maneras en la
              misma pantalla obliga a aprender dos leyendas para una idea. */}
          <BarChart
            orientation="horizontal"
            mode="stacked"
            categories={[currentBranch?.name ?? uiText("Sucursal")]}
            series={[
              {
                id: "activo",
                name: uiText("Con actividad"),
                values: [Math.round(overviewData.activeSeconds / 60)],
              },
              {
                id: "inactivo",
                name: uiText("Sin actividad"),
                values: [Math.round(overviewData.idleSeconds / 60)],
              },
            ]}
            caption={uiText("Tiempo con y sin actividad en el periodo medido")}
            categoryLabel={uiText("Alcance")}
            formatValue={(valor) => uiText("{{n}} min", { n: valor })}
          />
        </ChartCard>
      ) : null}

      {/* ---- 3. Reparto por zona ----------------------------------------
          Era una lista donde había que comparar seis pares de minutos
          leyéndolos. Apiladas, activo sobre inactivo, la zona que peor está
          se ve sin contar. La confianza sigue al lado de cada medida: sin
          ella, el dato de una cámara mal calibrada se lee igual que uno
          fiable. */}
      {visibleZones.length > 0 ? (
        <ChartCard
          title={uiText("Actividad por zona")}
          subtitle={uiText("Cuánto tiempo estuvo activa cada zona")}
          period={zonasSonSimuladas ? undefined : periodo}
        >
          {/* La procedencia va DENTRO de la sección y antes del gráfico: si
              lo que se enseña sale de la simulación, hay que saberlo antes de
              leerlo, no después. */}
          {zonasSonSimuladas ? (
            <InlineNote tone="warning" title={uiText("Estas zonas salen de la simulación")} className="mb-4">
              {uiText("El servidor todavía no ha medido zonas en esta sucursal, así que se enseña la forma del módulo con los eventos de demostración. No son mediciones reales.")}
            </InlineNote>
          ) : null}

          <BarChart
            orientation="horizontal"
            mode="stacked"
            categories={visibleZones.slice(0, 6).map((item) => item.zone.name)}
            series={[
              {
                id: "activo",
                name: uiText("Con actividad"),
                values: visibleZones.slice(0, 6).map((item) => Math.round(item.activeSeconds / 60)),
              },
              {
                id: "inactivo",
                name: uiText("Sin actividad"),
                values: visibleZones.slice(0, 6).map((item) => Math.round(item.idleSeconds / 60)),
              },
            ]}
            caption={uiText("Minutos con y sin actividad en cada zona")}
            categoryLabel={uiText("Zona")}
            formatValue={(valor) => uiText("{{n}} min", { n: valor })}
          />

          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-line pt-3">
            {visibleZones.slice(0, 6).map((item) => (
              <li key={item.zone.id} className="flex items-center gap-2 text-2xs text-ink-3">
                <span className="truncate">{item.zone.name}</span>
                <StatusBadge
                  size="sm"
                  tone={item.confidence >= 70 ? "success" : item.confidence >= 40 ? "warning" : "danger"}
                  label={uiText("Confianza {{n}} %", { n: item.confidence })}
                />
              </li>
            ))}
          </ul>
        </ChartCard>
      ) : null}

      {/* ---- 4. Recomendaciones ----------------------------------------- */}
      {insights.data?.recommendations.length ? (
        <PageSection
          title={uiText("Para revisión humana")}
          description={uiText("Sugerencias derivadas de la medición. Ninguna se aplica sola.")}
          id="recomendaciones"
        >
          <ul className="grid gap-3 md:grid-cols-2">
            {insights.data.recommendations.map((item) => (
              <li key={item.zoneId}>
                <article className="flex h-full flex-col gap-2 rounded-lg border border-line bg-surface-1 p-4">
                  <h3 className="text-sm font-semibold text-ink-1">{item.title}</h3>
                  <p className="text-sm text-ink-2">{item.explanation}</p>
                  <p className="mt-auto text-sm font-medium text-accent-ink">
                    {uiText("Siguiente paso:")}{item.suggestedAction}
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
        title={uiText("Simulación de demostración")}
        description={uiText("Genera eventos de ejemplo para enseñar cómo se ve el módulo cuando hay actividad.")}
        id="simulacion"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setRunning((current) => !current)} disabled={sinCamaras}>
              {running ? <RefreshCw className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
              {running ? uiText("Detener simulación") : uiText("Iniciar simulación")}
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
              {createEvent.isPending ? uiText("Guardando…") : uiText("Generar un evento")}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <InlineNote tone="warning" title={uiText("Los eventos que genere se guardan en la base de datos")}>
            {uiText("Quedan marcados con origen «DEMO» y suman a los contadores de arriba. Úsalo para demostraciones, no sobre datos de operación real.")}</InlineNote>

          {sinCamaras ? (
            <EmptyState
              reason="no-records"
              title={uiText("No hay cámaras activas en esta sucursal")}
              description={uiText("Registra y activa una cámara antes de simular. No se generan datos sin una cámara real detrás.")}
              action={
                <Button asChild variant="secondary">
                  <Link href="/productivity/cameras">{uiText("Ir a Cámaras y zonas")}</Link>
                </Button>
              }
            />
          ) : null}

          {createEvent.isError ? (
            <InlineNote tone="danger" title={uiText("El evento no pudo almacenarse")}>
              {createEvent.error instanceof Error ? createEvent.error.message : uiText("El backend rechazó el registro.")}
            </InlineNote>
          ) : null}

          {!sinCamaras ? (
            <>
              {/* El recuadro de cámara falsa medía 360 px y, con sus cifras y
                  su línea de tiempo, ocupaba más pantalla que TODO lo real.
                  Sigue estando —enseña de un vistazo qué mide el módulo— pero
                  plegado: quien vaya a hacer una demostración lo abre. */}
              <details className="group rounded-lg border border-line bg-surface-1">
                <summary className="flex min-h-[var(--control-h-touch)] cursor-pointer list-none items-center gap-2 px-4 text-sm font-medium text-ink-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
                  <ChevronRight
                    className="size-4 shrink-0 text-ink-3 transition-transform group-open:rotate-90 motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                  {uiText("Ver la vista previa de la cámara simulada")}
                </summary>
                <div className="border-t border-line p-4">
                  <DemoCameraPreview session={session} />
                </div>
              </details>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <DemoFigure label={uiText("Productividad media")} value={`${Math.round(sessionSummary.averageProductivity)} %`} />
                <DemoFigure label={uiText("Eventos generados")} value={String(sessionSummary.totalEvents)} />
                <DemoFigure label={uiText("Tiempo activo simulado")} value={formatMinutes(sessionSummary.activeSeconds)} />
                <DemoFigure label={uiText("Cámaras en la simulación")} value={String(sessionSummary.activeCameras)} />
              </div>

              {session.events.length > 0 ? (
                <Timeline
                  entries={session.events.slice(0, 6).map((event) => ({
                    id: event.id,
                    title: event.label,
                    detail: `${event.cameraName} · ${event.zoneName} · ${event.peopleDetected} personas · ${event.productivityScore} % productividad`,
                    when: formatTime(event.occurredAt, locale, uiText("Sin actividad")),
                  }))}
                />
              ) : (
                <p className="rounded-lg border border-dashed border-line p-4 text-sm text-ink-2">
                  {uiText("Todavía no hay eventos de demostración para esta sucursal.")}</p>
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
