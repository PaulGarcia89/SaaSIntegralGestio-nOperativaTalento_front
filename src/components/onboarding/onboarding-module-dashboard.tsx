"use client";

import { useUiText } from "@/components/ui-copy";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ClipboardList, FileSignature, Filter, LineChart as LineChartIcon, ShieldCheck, Users, X } from "lucide-react";
import {
  ActiveContext,
  EmptyState,
  EntityCard,
  EntityCardList,
  ErrorState,
  InlineNote,
  NextAction,
  PageHeader,
  PageSection,
  SkeletonRows,
  StatusTile,
  StatusTileRow,
  Timeline,
  type TimelineEntry,
} from "@/components/system";
import { BarChart, ChartCard, ChartSkeleton } from "@/components/chart";
import { ChartFilterChips, URGENCY_COLOR_CLASS } from "@/components/dashboard/operational-widgets";
import { Button } from "@/components/ui/button";
import { fetchOnboardingAnalytics, fetchOnboardingFlows, getApiErrorMessage } from "@/lib/backend";
import type { EmployeeOnboardingFlowDto } from "@/lib/contracts";
import {
  bucketByProgress,
  countTasks,
  countTasksIn,
  progressBand,
  sortByUrgency,
  type ProgressBand,
  type TaskBucket,
} from "@/lib/onboarding-insights";
import { formatDate, formatDateTime } from "@/lib/platform-labels";
import { useAppStore } from "@/store/app-store";

/**
 * Dashboard de Incorporación: primera pantalla del módulo.
 *
 * Antes `/onboarding` redirigía al listado de incorporaciones, así que el
 * módulo abría sin decir cómo iba. Aquí responde lo de siempre: cuántas
 * incorporaciones hay en curso, cómo van, cuáles están en riesgo o con tareas
 * vencidas, qué hacer ahora, dónde se atasca el proceso y por dónde entrar a
 * operar.
 *
 * Dos fuentes reales, ninguna inventada:
 *   · `/onboarding/analytics`: total, tasa de finalización, cumplimiento
 *     documental, tiempo hasta productividad, expedientes en riesgo y tiempo
 *     medio por etapa. Lo calcula el servidor sobre toda la sucursal.
 *   · `/onboarding/flows`: los expedientes con sus tareas, alertas y línea
 *     de tiempo. De ahí salen el avance, el estado de las tareas y la lista.
 *     Si hay más páginas de las que se cargan, se dice: una cifra parcial
 *     presentada como total engaña más que no enseñarla.
 *
 * Revisión de 2026-09
 * -------------------
 * · Era el único panel de módulo SIN un solo gráfico. Ahora hay tres, y los
 *   tres salen de datos que la pantalla ya descargaba: reparto por avance,
 *   estado de las tareas y tiempo medio por etapa. `timeByStage` venía en la
 *   misma respuesta de analítica y no se pintaba en ninguna parte.
 * · «En curso: 12» no decía si van bien. Doce al 10 % y doce al 90 % son la
 *   misma cifra y situaciones opuestas; `progressPercent` estaba en cada
 *   expediente sin agregarse.
 * · «Requieren atención» solo existía cuando había problemas, así que en un
 *   día tranquilo el panel del módulo no enseñaba a NINGUNA de las personas
 *   que se estaban incorporando. Ahora la lista es «en curso», ordenada por
 *   urgencia: sigue enseñando primero lo grave y ya no desaparece.
 * · Dos cifras de la misma fila se contaban sobre poblaciones distintas —las
 *   cargadas frente a todas— y el aviso salía debajo y solo a veces. Ahora
 *   cada tarjeta declara su alcance.
 * · Los gráficos de reparto son controles: filtran la lista de abajo. Se
 *   filtra la LISTA, nunca los gráficos, para no perder el contexto que
 *   justifica el filtro.
 */

const PAGINA = 50;
const MAX_CAMBIOS = 6;
/** Cuántas incorporaciones se enseñan antes de mandar al listado completo. */
const MAX_LISTA = 6;

/**
 * Muestra mínima para publicar un tiempo medio de etapa.
 *
 * Por debajo de esto una sola incorporación lenta mueve la media varios días.
 * El backend entrega `sampleSize` justo para poder tomar esta decisión.
 */
const MUESTRA_MINIMA = 3;

/**
 * Rampa de avance: UN tono, más oscuro cuanto más cerca del final.
 *
 * Es una escala de magnitud, no cuatro categorías, así que no lleva cuatro
 * colores distintos sino cuatro pasos del mismo. Los cuatro se separan lo
 * suficiente en claridad para distinguirse también en escala de grises, y
 * cada tramo lleva su nombre escrito al lado en el eje y en el filtro.
 */
const PROGRESS_COLOR: Record<ProgressBand, string> = {
  starting: "text-series-2/25",
  early: "text-series-2/50",
  half: "text-series-2/75",
  closing: "text-series-2",
};

/** Color de cada estado de tarea. Rojo y ámbar solo para lo que frena. */
const TASK_COLOR: Record<TaskBucket, string> = {
  overdue: URGENCY_COLOR_CLASS.danger,
  blocked: URGENCY_COLOR_CLASS.warning,
  inProgress: URGENCY_COLOR_CLASS.info,
  pending: URGENCY_COLOR_CLASS.neutral,
};

export function OnboardingModuleDashboard() {
  const uiText = useUiText();
  const { can, currentBranch } = useAppStore();
  const puedeVer = can("onboarding.view");
  const puedeGestionar = can("onboarding.manage");
  const branchId = currentBranch?.id;

  // Filtros de lectura: viven en la pantalla y no viajan al servidor.
  const [bandaFiltro, setBandaFiltro] = useState<ProgressBand | null>(null);
  const [tareaFiltro, setTareaFiltro] = useState<TaskBucket | null>(null);

  const analitica = useQuery({
    queryKey: ["onboarding-analytics", "module-dashboard", branchId ?? null],
    queryFn: () => fetchOnboardingAnalytics(branchId),
    enabled: puedeVer,
    staleTime: 60_000,
  });
  const expedientes = useQuery({
    queryKey: ["onboarding-flows", "module-dashboard", branchId ?? null],
    queryFn: () => fetchOnboardingFlows({ branchId, page: 1, pageSize: PAGINA }),
    enabled: puedeVer,
    staleTime: 60_000,
  });

  const flujos = useMemo(() => expedientes.data?.items ?? [], [expedientes.data]);
  // Un único instante para toda la pantalla: si cada cálculo leyera el reloj
  // por su cuenta, dos cifras de la misma vista podrían no cuadrar.
  const ahora = useMemo(() => new Date(), []);

  const enCurso = useMemo(
    () => flujos.filter((flujo) => flujo.status !== "COMPLETED" && flujo.status !== "CANCELLED"),
    [flujos],
  );
  const avance = useMemo(() => bucketByProgress(enCurso), [enCurso]);
  const tareas = useMemo(() => countTasks(enCurso, ahora), [enCurso, ahora]);
  const ordenadas = useMemo(() => sortByUrgency(enCurso, ahora), [enCurso, ahora]);

  if (!puedeVer) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow={uiText("Personas")} title={uiText("Dashboard de incorporación")} />
        <EmptyState
          reason="no-records"
          title={uiText("No tienes acceso a las incorporaciones")}
          description={uiText("Pide a quien administra la empresa el permiso para ver incorporaciones.")}
        />
      </div>
    );
  }

  const resumen = analitica.data?.summary;
  const parcial = Boolean(expedientes.data && expedientes.data.total > flujos.length);

  const etiquetaBanda: Record<ProgressBand, string> = {
    starting: uiText("Empezando"),
    early: uiText("Avanzando"),
    half: uiText("Pasada la mitad"),
    closing: uiText("Casi terminada"),
  };
  const etiquetaTarea: Record<TaskBucket, string> = {
    overdue: uiText("Vencidas"),
    blocked: uiText("Bloqueadas"),
    inProgress: uiText("En curso"),
    pending: uiText("Pendientes"),
  };

  const totalVencidas = tareas.find((entrada) => entrada.bucket === "overdue")?.count ?? 0;
  const filtrando = bandaFiltro !== null || tareaFiltro !== null;
  const limpiarFiltros = () => {
    setBandaFiltro(null);
    setTareaFiltro(null);
  };

  const visibles = ordenadas.filter(
    (entrada) =>
      (!bandaFiltro || progressBand(entrada.flow.progressPercent) === bandaFiltro) &&
      (!tareaFiltro || countTasksIn(entrada.flow, tareaFiltro, ahora) > 0),
  );

  const siguiente = ordenadas.find((entrada) => entrada.needsAttention)?.flow
    ?? enCurso.find((flujo) => flujo.nextAction)
    ?? null;
  const urgenciaSiguiente = siguiente ? ordenadas.find((entrada) => entrada.flow.id === siguiente.id) : undefined;

  const cambios: TimelineEntry[] = flujos
    .flatMap((flujo) =>
      flujo.timeline.map((evento) => ({
        id: `${flujo.id}-${evento.id}`,
        title: `${flujo.employee.name}: ${evento.title}`,
        detail: evento.description ?? undefined,
        when: formatDateTime(evento.occurredAt),
        who: evento.actor?.name ?? undefined,
        sortKey: evento.occurredAt,
      })),
    )
    .sort((a, b) => b.sortKey.localeCompare(a.sortKey))
    .slice(0, MAX_CAMBIOS)
    .map(({ id, title, detail, when, who }) => ({ id, title, detail, when, who }));

  /** `undefined` mientras carga · `null` si el servidor no lo entrega. */
  const cifraAnalitica = (valor?: number) =>
    analitica.isError ? null : analitica.isLoading ? undefined : resumen ? (valor ?? 0) : null;
  const cifraExpedientes = (valor: number) =>
    expedientes.isError ? null : expedientes.isLoading ? undefined : expedientes.data ? valor : null;

  // El backend ha entregado esta tasa como fracción y como porcentaje según la
  // versión, así que se normaliza en vez de confiar en una de las dos.
  const porcentaje = (valor?: number) =>
    typeof valor === "number" && Number.isFinite(valor)
      ? Math.round(valor * (valor <= 1 ? 100 : 1))
      : null;
  const cumplimiento = resumen && resumen.totalFlows > 0 ? porcentaje(resumen.documentComplianceRate) : null;
  const completitud = resumen ? porcentaje(resumen.completionRate) : null;

  const horas = (valor: number) =>
    valor < 24
      ? uiText("{{n}} h", { n: Math.round(valor) })
      : uiText("{{n}} d", { n: Math.round(valor / 24) });

  /** Alcance de cada cifra: sin decirlo, dos números de la misma fila mienten. */
  const alcanceSucursal = currentBranch ? currentBranch.name : uiText("Todas las sucursales");
  const alcanceCargadas = parcial
    ? uiText("{{scope}} · sobre {{n}} cargadas", { scope: alcanceSucursal, n: flujos.length })
    : alcanceSucursal;

  // Solo las etapas con muestra suficiente; el resto existe en Analítica.
  const etapas = (analitica.data?.timeByStage ?? []).filter(
    (etapa) => etapa.sampleSize >= MUESTRA_MINIMA && etapa.averageHours > 0,
  );
  // Una sola unidad en el eje: mezclar horas y días lo hace ilegible.
  const etapasEnHoras = etapas.every((etapa) => etapa.averageHours < 24);
  const valorEtapa = (h: number) => (etapasEnHoras ? h : h / 24);
  const formatoEtapa = (valor: number) =>
    etapasEnHoras ? uiText("{{n}} h", { n: Math.round(valor) }) : uiText("{{n}} d", { n: Math.round(valor) });

  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        eyebrow={uiText("Personas")}
        title={uiText("Dashboard de incorporación")}
        description={uiText("Cómo van las incorporaciones de la sucursal, cuáles necesitan atención y qué hacer ahora.")}
        actions={
          <Button asChild variant="secondary">
            <Link href="/onboarding/documents">{uiText("Ver incorporaciones")}</Link>
          </Button>
        }
      />

      <ActiveContext />

      {expedientes.isLoading ? (
        <SkeletonRows rows={3} label={uiText("Cargando incorporaciones")} />
      ) : expedientes.isError ? (
        <ErrorState
          title={uiText("No fue posible cargar las incorporaciones")}
          detail={getApiErrorMessage(expedientes.error, uiText("Reintenta la consulta para continuar."))}
          onRetry={() => void expedientes.refetch()}
        />
      ) : siguiente ? (
        <NextAction
          label={urgenciaSiguiente?.needsAttention ? uiText("Lo más urgente") : uiText("Lo siguiente")}
          title={uiText("Abrir la incorporación de {{name}}", { name: siguiente.employee.name })}
          detail={describir(siguiente, urgenciaSiguiente?.overdue ?? 0, uiText)}
          href={`/onboarding/documents?flowId=${encodeURIComponent(siguiente.id)}`}
          actionLabel={uiText("Abrir")}
          tone={urgenciaSiguiente?.critical ? "danger" : urgenciaSiguiente?.needsAttention ? "warning" : "progress"}
        />
      ) : (
        <EmptyState
          reason="no-records"
          title={enCurso.length === 0 ? uiText("No hay incorporaciones en curso") : uiText("Nada pendiente por ahora")}
          description={
            enCurso.length === 0
              ? uiText("Las incorporaciones nacen al cerrar una contratación. Cuando exista una, aparecerá aquí.")
              : uiText("Ninguna incorporación tiene tareas vencidas ni alertas.")
          }
        />
      )}

      {analitica.isError ? (
        <InlineNote tone="danger" title={uiText("No fue posible cargar la analítica de incorporación")}>
          {getApiErrorMessage(analitica.error, uiText("Reintenta la consulta para continuar."))}
        </InlineNote>
      ) : null}

      {/* ---- Cifras ------------------------------------------------------
          Seis, y cada una dice sobre qué población se cuenta. Antes «En curso»
          y «Tareas vencidas» salían de las cargadas mientras «En riesgo» y
          «Cumplimiento» salían de todas, sin distinguirlo. */}
      <StatusTileRow label={uiText("Estado de las incorporaciones")} className="xl:grid-cols-3">
        <li className="min-w-0">
          <StatusTile
            title={uiText("En curso")}
            value={cifraExpedientes(enCurso.length)}
            context={uiText("Personas que todavía no terminaron su incorporación.")}
            scope={alcanceCargadas}
            href="/onboarding/documents"
            actionLabel={uiText("Ver incorporaciones")}
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title={uiText("Tareas vencidas")}
            value={cifraExpedientes(totalVencidas)}
            context={uiText("Tareas abiertas cuya fecha límite ya pasó.")}
            status={totalVencidas > 0 && expedientes.data ? { label: uiText("Atrasado"), tone: "danger" as const } : undefined}
            scope={alcanceCargadas}
            href="/onboarding/documents"
            actionLabel={uiText("Ver incorporaciones")}
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title={uiText("En riesgo")}
            value={cifraAnalitica(resumen?.atRisk)}
            context={uiText("Expedientes que el servidor marca con riesgo de retraso.")}
            status={resumen && resumen.atRisk > 0 ? { label: uiText("Revisar"), tone: "warning" as const } : undefined}
            scope={alcanceSucursal}
            href="/onboarding/analytics"
            actionLabel={uiText("Ver analítica")}
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title={uiText("Cumplimiento documental")}
            value={analitica.isLoading ? undefined : cumplimiento === null ? null : uiText("{{n}} %", { n: cumplimiento })}
            context={uiText("Documentos aprobados sobre los requeridos.")}
            scope={alcanceSucursal}
            href="/onboarding/signatures"
            actionLabel={uiText("Ver documentos")}
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title={uiText("Incorporaciones completadas")}
            value={analitica.isLoading ? undefined : completitud === null ? null : uiText("{{n}} %", { n: completitud })}
            context={uiText("De las iniciadas, cuántas llegaron al final.")}
            scope={alcanceSucursal}
            href="/onboarding/analytics"
            actionLabel={uiText("Ver analítica")}
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title={uiText("Hasta productividad")}
            value={
              analitica.isLoading
                ? undefined
                : !resumen
                  ? null
                  : resumen.averageTimeToProductivityHours > 0
                    ? horas(resumen.averageTimeToProductivityHours)
                    : "—"
            }
            context={uiText("Desde que empieza la incorporación hasta que la persona está lista.")}
            scope={alcanceSucursal}
            href="/onboarding/analytics"
            actionLabel={uiText("Ver analítica")}
          />
        </li>
      </StatusTileRow>

      {/* ---- Gráficos ----------------------------------------------------
          Tres preguntas encadenadas —cómo van, qué las frena y dónde se
          atascan— en la misma forma y en la misma fila: se leen como un
          conjunto. Los dos primeros son además controles: filtran la lista
          de abajo. Se filtra la LISTA, nunca los gráficos, para no perder el
          contexto que justifica el filtro. */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <ChartCard
          title={uiText("Cómo van las que están en curso")}
          subtitle={uiText("Pulsa un tramo para filtrar la lista de abajo")}
          period={alcanceCargadas}
        >
          {expedientes.isLoading ? (
            <ChartSkeleton label={uiText("Cargando incorporaciones")} />
          ) : enCurso.length === 0 ? (
            <BarChart categories={[]} series={[]} emptyReason="sin-registros" />
          ) : (
            <>
              <BarChart
                orientation="horizontal"
                categories={avance.map((entrada) => etiquetaBanda[entrada.band])}
                series={[{ id: "avance", name: uiText("Incorporaciones"), values: avance.map((e) => e.count) }]}
                // El color dice cuánto se ha andado, no identidad: cada tramo
                // lleva su nombre escrito al lado, en el eje y en el filtro.
                categoryColorClasses={avance.map((entrada) => PROGRESS_COLOR[entrada.band])}
                caption={uiText("Incorporaciones en curso agrupadas por su avance")}
                categoryLabel={uiText("Tramo")}
                formatValue={(valor) => String(valor)}
              />
              <ChartFilterChips
                className="mt-4"
                label={uiText("Filtrar por tramo de avance")}
                selected={bandaFiltro}
                onSelect={(valor) => setBandaFiltro(valor as ProgressBand | null)}
                options={avance.map((entrada) => ({
                  value: entrada.band,
                  label: etiquetaBanda[entrada.band],
                  count: entrada.count,
                  colorClassName: PROGRESS_COLOR[entrada.band],
                }))}
              />
            </>
          )}
        </ChartCard>

        <ChartCard
          title={uiText("Qué frena las incorporaciones")}
          subtitle={uiText("Tareas abiertas por estado. Pulsa uno para filtrar la lista")}
          period={alcanceCargadas}
        >
          {expedientes.isLoading ? (
            <ChartSkeleton label={uiText("Cargando incorporaciones")} />
          ) : tareas.every((entrada) => entrada.count === 0) ? (
            <BarChart categories={[]} series={[]} emptyReason="sin-registros" />
          ) : (
            <>
              <BarChart
                orientation="horizontal"
                categories={tareas.map((entrada) => etiquetaTarea[entrada.bucket])}
                series={[{ id: "tareas", name: uiText("Tareas"), values: tareas.map((e) => e.count) }]}
                categoryColorClasses={tareas.map((entrada) => TASK_COLOR[entrada.bucket])}
                caption={uiText("Tareas abiertas de las incorporaciones en curso, por estado")}
                categoryLabel={uiText("Estado")}
                formatValue={(valor) => String(valor)}
              />
              <ChartFilterChips
                className="mt-4"
                label={uiText("Filtrar por estado de la tarea")}
                selected={tareaFiltro}
                onSelect={(valor) => setTareaFiltro(valor as TaskBucket | null)}
                options={tareas.map((entrada) => ({
                  value: entrada.bucket,
                  label: etiquetaTarea[entrada.bucket],
                  count: entrada.count,
                  colorClassName: TASK_COLOR[entrada.bucket],
                }))}
              />
            </>
          )}
        </ChartCard>
      {/* `timeByStage` venía en la misma respuesta de analítica y no se
          pintaba en ninguna parte de esta pantalla. */}
      <ChartCard
        title={uiText("Dónde se atasca el proceso")}
        subtitle={uiText("Tiempo medio de cada etapa. Solo las que tienen al menos {{min}} casos", { min: MUESTRA_MINIMA })}
        period={alcanceSucursal}
      >
        {analitica.isLoading ? (
          <ChartSkeleton label={uiText("Calculando analítica de incorporación")} />
        ) : analitica.isError || etapas.length === 0 ? (
          <BarChart categories={[]} series={[]} emptyReason="sin-registros" />
        ) : (
          <>
            <BarChart
              orientation="horizontal"
              categories={etapas.map((etapa) => uiText(etapa.label))}
              series={[
                { id: "etapas", name: uiText("Tiempo medio"), values: etapas.map((etapa) => valorEtapa(etapa.averageHours)) },
              ]}
              caption={uiText("Tiempo medio que tarda cada etapa de la incorporación")}
              categoryLabel={uiText("Etapa")}
              formatValue={formatoEtapa}
            />
            {/* El tamaño de la muestra sigue a la vista: sin él, una media de
                tres casos y una de trescientos se leen igual. */}
            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3 text-2xs text-ink-3">
              {etapas.map((etapa) => (
                <li key={etapa.label}>
                  {uiText(etapa.label)} · {uiText("muestra {{n}}", { n: etapa.sampleSize })}
                </li>
              ))}
            </ul>
          </>
        )}
        </ChartCard>
      </div>

      <PageSection
        title={uiText("Operaciones del módulo")}
        description={uiText("Cada pantalla dice para qué sirve, con icono y texto.")}
      >
        <ul className="grid gap-3 [&>li]:min-w-0 sm:grid-cols-2 xl:grid-cols-4">
          <Destino href="/onboarding/documents" icon={Users} label={uiText("Incorporaciones")} detail={uiText("Cada expediente con sus tareas, documentos y avance.")} />
          <Destino href="/onboarding/signatures" icon={FileSignature} label={uiText("Documentos y firmas")} detail={uiText("Paquetes por firmar y documentos por revisar.")} />
          <Destino href="/onboarding/analytics" icon={LineChartIcon} label={uiText("Analítica")} detail={uiText("Tiempos por etapa, riesgos y comparativas.")} />
          {puedeGestionar ? (
            <Destino href="/onboarding/compliance" icon={ShieldCheck} label={uiText("Cumplimiento")} detail={uiText("Retención, evidencias de firma y políticas.")} />
          ) : (
            <Destino href="/onboarding/operations" icon={ClipboardList} label={uiText("Operaciones")} detail={uiText("Tareas operativas ligadas a cada incorporación.")} />
          )}
        </ul>
      </PageSection>

      {/* ---- Lista -------------------------------------------------------
          Antes esta sección solo existía cuando había algo grave, así que en
          un día tranquilo el panel no enseñaba a nadie. Ahora enseña a todas
          las que están en curso, con lo urgente primero. */}
      {filtrando ? (
        <div
          role="status"
          className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-accent-line/40 bg-accent-fill/5 px-4 py-2.5"
        >
          <Filter className="size-4 shrink-0 text-accent-ink" aria-hidden="true" />
          <p className="min-w-0 text-sm text-ink-1">
            {uiText("Filtrando por")}{" "}
            <strong className="font-medium">
              {[bandaFiltro ? etiquetaBanda[bandaFiltro] : null, tareaFiltro ? etiquetaTarea[tareaFiltro] : null]
                .filter(Boolean)
                .join(" · ")}
            </strong>{" "}
            <span className="text-ink-2">{uiText("{{n}} incorporaciones", { n: visibles.length })}</span>
          </p>
          <button
            type="button"
            onClick={limpiarFiltros}
            className="ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-sm font-medium text-accent-ink underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <X className="size-4" aria-hidden="true" />
            {uiText("Quitar filtro")}
          </button>
        </div>
      ) : null}

      {enCurso.length > 0 ? (
        <PageSection
          title={uiText("Incorporaciones en curso")}
          description={uiText("Primero las que tienen alertas graves, tareas vencidas o bloqueadas.")}
          id="en-curso"
          actions={
            enCurso.length > MAX_LISTA ? (
              <Button asChild variant="secondary">
                <Link href="/onboarding/documents">{uiText("Ver todas")}</Link>
              </Button>
            ) : undefined
          }
        >
          {visibles.length === 0 ? (
            <EmptyState
              reason="no-matches"
              title={uiText("Nada coincide con el filtro que tienes puesto.")}
              description={uiText("Quita el filtro para volver a ver todas las incorporaciones en curso.")}
              onClearFilters={limpiarFiltros}
            />
          ) : (
            <EntityCardList label={uiText("Incorporaciones en curso")} columns={2}>
              {visibles.slice(0, MAX_LISTA).map(({ flow, critical, overdue, blocked }) => (
                <EntityCard
                  key={flow.id}
                  title={flow.employee.name}
                  subtitle={[flow.employee.jobTitle, flow.branch.name].filter(Boolean).join(" · ")}
                  avatarName={flow.employee.name}
                  status={
                    critical > 0
                      ? { label: uiText("Alerta grave"), tone: "danger" }
                      : overdue > 0
                        ? { label: uiText("Tareas vencidas"), tone: "warning" }
                        : blocked > 0
                          ? { label: uiText("Bloqueada"), tone: "blocked" }
                          : { label: uiText("En marcha"), tone: "progress" }
                  }
                  facts={[
                    { label: uiText("Vencidas"), value: overdue },
                    { label: uiText("Bloqueadas"), value: blocked },
                    { label: uiText("Inicio"), value: formatDate(flow.startedAt) },
                  ]}
                  progress={{ label: uiText("Avance"), value: flow.progressPercent, max: 100 }}
                  nextStep={flow.nextAction?.title ?? flow.alerts[0]?.message}
                  href={`/onboarding/documents?flowId=${encodeURIComponent(flow.id)}`}
                />
              ))}
            </EntityCardList>
          )}
        </PageSection>
      ) : null}

      <PageSection
        title={uiText("Cambió hace poco")}
        description={uiText("Los últimos movimientos registrados en las incorporaciones cargadas.")}
        boxed
      >
        {expedientes.isLoading ? (
          <SkeletonRows rows={3} />
        ) : cambios.length === 0 ? (
          <EmptyState
            reason="no-records"
            title={uiText("Sin movimientos todavía")}
            description={uiText("Cuando una incorporación avance, aparecerá aquí.")}
          />
        ) : (
          <Timeline entries={cambios} />
        )}
      </PageSection>
    </div>
  );
}

function describir(
  flujo: EmployeeOnboardingFlowDto,
  vencidas: number,
  uiText: (source: string, params?: Record<string, string | number>) => string,
) {
  const partes: string[] = [];
  if (vencidas > 0) partes.push(uiText("{{n}} tareas vencidas", { n: vencidas }));
  const grave = flujo.alerts.find((alerta) => alerta.severity === "danger");
  if (grave) partes.push(grave.message);
  else if (flujo.nextAction) partes.push(uiText("Siguiente: {{title}}", { title: flujo.nextAction.title }));
  partes.push(uiText("{{n}} % completado", { n: flujo.progressPercent }));
  return partes.join(" · ");
}

function Destino({ href, icon: Icon, label, detail }: { href: string; icon: typeof Users; label: string; detail: string }) {
  return (
    <li className="min-w-0">
      <Link
        href={href}
        className="flex h-full min-h-[var(--control-h-touch)] items-start gap-3 rounded-lg border border-line bg-surface-1 p-4 transition-colors hover:border-line-strong hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-md border border-line bg-surface-2 text-ink-2">
          <Icon className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1 font-medium text-ink-1">
            {label}
            <ArrowRight className="size-3.5 shrink-0 text-ink-3" aria-hidden="true" />
          </span>
          <span className="mt-1 block text-sm leading-relaxed text-ink-2">{detail}</span>
        </span>
      </Link>
    </li>
  );
}
