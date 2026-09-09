"use client";

import { useUiText } from "@/components/ui-copy";

import Link from "next/link";
import { useQueries, useQuery } from "@tanstack/react-query";
import { ArrowRight, BriefcaseBusiness, CircleCheck, CircleSlash, Inbox, MessagesSquare, Plus } from "lucide-react";
import { MobileActionBar, TaskCard } from "@/components/simple/simple-ui";
import { HiringEmbeddedPanel } from "@/components/hiring-contract-workspace";
import {
  ActiveContext,
  ErrorState,
  EmptyState,
  InlineNote,
  PageHeader,
  PageSection,
  SkeletonRows,
  StatusBadge,
  StatusTile,
  StatusTileRow,
} from "@/components/system";
import { BarChart, ChartCard, ChartSkeleton, FunnelChart, LineChart, type FunnelStage } from "@/components/chart";
import {
  fetchApplications,
  fetchAtsAnalytics,
  fetchInterviewCoordinationQueue,
  fetchOperationalDashboardInLocale,
  fetchVacancies,
} from "@/lib/backend";
import type { ApplicationStatusKey } from "@/lib/contracts";
import { MAIN_PHASES, phaseTitle, phaseMeaning, toTodayItems, type RecruitmentPhaseId } from "@/lib/recruitment-ux";
import { useLocale } from "@/components/locale-provider";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";

/**
 * "Hoy" — la única bandeja de trabajo del módulo.
 *
 * Sustituye a "Requiere atención", que descargaba 100 postulaciones y 100
 * entrevistas para filtrarlas en el navegador y aplicaba un criterio de
 * prioridad propio, distinto del que ya calculaba el backend. Eso producía
 * cuatro listas de "lo que me toca" que podían contradecirse.
 *
 * Ahora la lista viene de `/dashboard/operational`, el mismo endpoint que
 * alimenta el panel principal, y los contadores por fase se piden al servidor
 * con `pageSize: 1` leyendo solo el total. El navegador ya no recibe registros
 * que no va a mostrar.
 *
 * Qué cambió con el rediseño visual
 * ---------------------------------
 * · Las cuatro tarjetas idénticas de fase se sustituyen por un raíl
 *   proporcional: la misma información, más el reparto entre fases, en un
 *   tercio de la altura y sin repetir cuatro cajas iguales.
 * · La tarea más urgente se separa del resto como ACCIÓN RECOMENDADA. Antes
 *   todas las tareas pesaban lo mismo y había que leerlas todas para saber por
 *   dónde empezar.
 * · La clave de consulta incorpora empresa y sucursal. Sin ellas, al cambiar de
 *   contexto se seguía viendo la bandeja del contexto anterior.
 */

const PHASE_STATUSES: Record<RecruitmentPhaseId, ApplicationStatusKey[]> = {
  POSTULARON: ["SUBMITTED", "REVIEWING"],
  CONOCIENDO: ["INTERVIEW"],
  DECIDIDO: ["APPROVED"],
  TRABAJANDO: ["HIRED", "TRAINING"],
  DESCARTADOS: ["REJECTED", "WITHDRAWN"],
};

/**
 * Ventana del embudo.
 *
 * El embudo NO se deriva de los conteos por fase de esta misma pantalla. Esos
 * conteos son ocupación de hoy —cuánta gente hay ahora mismo en cada sitio— y
 * dibujarlos como embudo afirmaría una conversión que esos números no
 * demuestran: quien fue rechazado tras la entrevista ya no aparece en
 * «Conociendo», así que la caída entre fases mediría bajas, no conversión.
 *
 * El embudo viene de `/reports/ats-analytics`, donde el backend sí sigue a cada
 * postulación por las etapas que atravesó y publica, por etapa, cuántas
 * llegaron (`reached`) y con qué tamaño de muestra (`sampleSize`).
 */
const DIAS_EMBUDO = 90;

/**
 * Muestra mínima para publicar un tiempo medio por etapa.
 *
 * Por debajo de esto una sola contratación lenta mueve la media varios días y
 * el número engaña más de lo que informa. El backend entrega `sampleSize`
 * justo para poder tomar esta decisión en vez de adivinarla.
 */
const MUESTRA_MINIMA = 5;

function ventanaEmbudo(hoy: string, branchId?: string) {
  const hasta = new Date(`${hoy}T00:00:00.000Z`);
  const desde = new Date(hasta.getTime() - (DIAS_EMBUDO - 1) * 86_400_000);
  return {
    from: desde.toISOString().slice(0, 10),
    to: hoy,
    branchId,
    // Sin sucursal activa se consulta toda la empresa, igual que el resto del
    // panel: el alcance escrito bajo cada tarjeta dice cuál de los dos es.
    scope: branchId ? ("context" as const) : ("tenant" as const),
    granularity: "week" as const,
  };
}

/**
 * Fases del proceso, como tarjetas de destino.
 *
 * Misma pieza que usa el Centro administrativo: icono en un cuadrado con
 * borde, título con flecha, descripción debajo y la tarjeta entera pulsable.
 * Se cambia por petición expresa: la versión anterior era una fila por fase
 * con una barra proporcional, y se pidió que se viera igual que el resto de
 * accesos del sistema.
 *
 * La cifra sigue siendo el dato —cuánta gente hay ahora en cada fase— y va a
 * la derecha del título, en cifras de ancho fijo, para que las cuatro
 * tarjetas se comparen de un vistazo. Se sigue sin presentar como embudo:
 * estos totales son ocupación actual, no una cohorte seguida en el tiempo.
 */
const PHASE_ICONS: Record<RecruitmentPhaseId, typeof Inbox> = {
  POSTULARON: Inbox,
  CONOCIENDO: MessagesSquare,
  DECIDIDO: CircleCheck,
  TRABAJANDO: BriefcaseBusiness,
  DESCARTADOS: CircleSlash,
};

function PhaseRail({
  phases,
  locale,
}: {
  phases: Array<{
    id: RecruitmentPhaseId;
    total: number | undefined;
    loading: boolean;
    /** Aviso de que esa fase pide una acción, no solo que tiene gente. */
    status?: { label: string; tone: "warning" | "progress" };
  }>;
  locale: "es" | "en";
}) {
  return (
    <ul className="grid gap-3 [&>li]:min-w-0 sm:grid-cols-2 xl:grid-cols-4">
      {phases.map((phase) => {
        const Icon = PHASE_ICONS[phase.id];
        return (
          <li key={phase.id}>
            <Link
              href={`/ats/candidates?phase=${phase.id}`}
              className="flex h-full min-h-[var(--control-h-touch)] items-start gap-3 rounded-lg border border-line bg-surface-1 p-4 transition-colors hover:border-line-strong hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-md border border-line bg-surface-2 text-ink-2"
              >
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-1 font-medium text-ink-1">
                    <span className="min-w-0">{phaseTitle(phase.id, locale)}</span>
                    <ArrowRight className="size-3.5 shrink-0 text-ink-3" aria-hidden="true" />
                  </span>
                  <span className="shrink-0 font-mono text-2xl font-semibold leading-none tabular-figures text-ink-1">
                    {phase.loading ? "—" : (phase.total ?? 0)}
                  </span>
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-ink-2">{phaseMeaning(phase.id, locale)}</span>
                {/* La urgencia vive donde vive la cifra. Antes estaba en unas
                    tarjetas aparte que repetían este mismo número. */}
                {phase.status ? (
                  <span className="mt-2 block">
                    <StatusBadge size="sm" tone={phase.status.tone} label={phase.status.label} />
                  </span>
                ) : null}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function TodayPage() {
  const uiText = useUiText();
  const { can, currentBranch, currentTenant } = useAppStore();
  const { locale, t } = useLocale();
  const allowed = can("applications.view");

  const dashboard = useQuery({
    // Empresa y sucursal forman parte de la clave: sin ellas, al cambiar de
    // contexto se seguiría mostrando la bandeja del contexto anterior.
    queryKey: ["operational-dashboard", currentTenant.id, currentBranch?.id, locale],
    queryFn: () => fetchOperationalDashboardInLocale(locale),
    enabled: allowed,
    refetchInterval: 60_000,
  });

  // Un conteo por fase, pidiendo una sola fila y leyendo `meta.total`.
  const counts = useQueries({
    queries: MAIN_PHASES.map((phase) => ({
      queryKey: ["application-count", phase.id, currentBranch?.id ?? null],
      queryFn: () =>
        fetchApplications({
          status: PHASE_STATUSES[phase.id].join(","),
          branchId: currentBranch?.id,
          page: 1,
          pageSize: 1,
        }),
      enabled: allowed,
      staleTime: 60_000,
    })),
  });

  // Entrevistas por coordinar: el endpoint ya entrega el conteo, así que la
  // tarjeta no estima nada.
  const coordinacion = useQuery({
    queryKey: ["interview-coordination", currentTenant.id, currentBranch?.id],
    queryFn: () => fetchInterviewCoordinationQueue(1, 1),
    enabled: allowed,
    staleTime: 60_000,
  });

  // La fecha entra en la clave para que el embudo se rehaga al cambiar de día
  // sin dejar la ventana congelada en la que se calculó al abrir la pestaña.
  const hoy = new Date().toISOString().slice(0, 10);

  // Vacantes abiertas. El endpoint entrega una página de 100; si hubiera más de
  // una página este recuento sería parcial, y la tarjeta prefiere decir que no
  // tiene el dato antes que enseñar un número corto como si fuera el total.
  const vacantes = useQuery({
    queryKey: ["vacancies", "ats-panel", currentTenant.id],
    queryFn: fetchVacancies,
    enabled: allowed,
    staleTime: 60_000,
  });

  // Embudo real por etapa, calculado por el backend sobre el histórico.
  const analitica = useQuery({
    queryKey: ["ats-analytics", "ats-panel", currentTenant.id, currentBranch?.id ?? null, hoy],
    queryFn: () => fetchAtsAnalytics(ventanaEmbudo(hoy, currentBranch?.id)),
    enabled: allowed,
    staleTime: 300_000,
  });

  const items = toTodayItems(
    [...(dashboard.data?.tasks ?? []), ...(dashboard.data?.alerts ?? [])],
    undefined,
    locale,
  );

  if (!allowed) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow={uiText("Reclutamiento")} title={t("ats.today.title")} />
        <EmptyState reason="no-records" title={t("ats.today.noAccessTitle")} description={t("ats.today.noAccessHelp")} />
      </div>
    );
  }

  // `toTodayItems` ya ordena lo urgente primero, así que el primero es el que
  // toca. Se separa del resto en vez de mezclarlo: si todas las tareas pesan lo
  // mismo, hay que leerlas todas para saber por dónde empezar.
  const [recommended, ...rest] = items;

  const phases = MAIN_PHASES.map((phase, index) => {
    const total = counts[index]?.data?.meta.total;
    const pide = typeof total === "number" && total > 0;
    return {
      id: phase.id,
      total,
      loading: Boolean(counts[index]?.isLoading),
      status:
        phase.id === "POSTULARON" && pide
          ? { label: t("ats.panel.needsReview"), tone: "warning" as const }
          : phase.id === "DECIDIDO" && pide
            ? { label: t("ats.panel.awaitingDecision"), tone: "progress" as const }
            : undefined,
    };
  });

  // Alcance escrito al pie de cada tarjeta. Las mismas cifras significan cosas
  // distintas en una sucursal y en toda la empresa; sin decirlo no hay forma de
  // saber cuál se está mirando.
  const alcance = currentBranch?.name ?? t("common.allBranches");

  const vacantesActivas = (() => {
    if (vacantes.isError) return null;
    const pagina = vacantes.data;
    if (!pagina) return undefined;
    if (pagina.meta.totalPages > 1) return null;
    return pagina.data.filter((vacante) =>
      ["OPEN", "PUBLISHED"].includes(String(vacante.status ?? "").toUpperCase()),
    ).length;
  })();

  const porCoordinar = coordinacion.isError
    ? null
    : coordinacion.data
      ? coordinacion.data.meta.interviewCount + coordinacion.data.meta.requestCount
      : undefined;

  const textoDuracion = (horas: number) =>
    horas < 24
      ? t("ats.panel.hoursShort", { n: Math.round(horas) })
      : t("ats.panel.daysShort", {
          n: (horas / 24).toLocaleString(locale === "es" ? "es-ES" : "en-US", {
            maximumFractionDigits: 1,
          }),
        });

  const resumen = analitica.data?.summary;

  /**
   * Variación real frente al periodo anterior.
   *
   * La calcula el backend (`summary.changes`) comparando la ventana de 90 días
   * con la anterior, así que no hay nada estimado aquí. Se omite por debajo de
   * una décima: «+0,0 %» ocupa sitio y no dice nada.
   *
   * `mejorSiBaja` invierte la lectura para el tiempo hasta contratar, que es
   * la única cifra del panel donde bajar es la buena noticia.
   */
  const variacion = (
    valor: number | undefined,
    { unidad, mejorSiBaja = false }: { unidad: "porcentaje" | "puntos"; mejorSiBaja?: boolean },
  ): { label: string; tone: "success" | "warning" } | undefined => {
    if (typeof valor !== "number" || !Number.isFinite(valor) || Math.abs(valor) < 0.1) return undefined;
    const magnitud = Math.abs(valor).toLocaleString(locale === "es" ? "es-ES" : "en-US", {
      maximumFractionDigits: 1,
    });
    const texto = `${valor > 0 ? "+" : "−"}${magnitud}${unidad === "puntos" ? " pp" : " %"}`;
    return {
      label: t("ats.panel.vsPrevious", { value: texto }),
      tone: (mejorSiBaja ? valor < 0 : valor > 0) ? "success" : "warning",
    };
  };

  /** Alcance y ventana de las cifras que salen de la analítica. */
  const alcanceAnalitica = `${alcance} · ${t("ats.panel.funnelPeriod", { days: DIAS_EMBUDO })}`;

  /*
   * Cuatro tarjetas, y ninguna repite al reparto por fase de más abajo.
   *
   * Antes dos de las cuatro —«Postulaciones nuevas» y «Decisiones
   * pendientes»— eran exactamente las cifras de las fases POSTULARON y
   * DECIDIDO, dibujadas otra vez en otra forma. Su urgencia no se ha perdido:
   * se movió a la insignia de la propia fase, que es donde ya estaba el
   * número.
   *
   * En su lugar entran las dos preguntas que el panel no sabía contestar:
   * cuánta gente acaba contratada y cuánto se tarda. Las dos vienen de la
   * misma respuesta que ya se descargaba para el embudo, con la variación
   * real frente al periodo anterior.
   */
  const tarjetas = [
    {
      title: t("ats.panel.activeVacancies"),
      value: vacantesActivas,
      context: t("ats.panel.activeVacanciesContext"),
      href: "/ats/vacancies",
      actionLabel: t("ats.panel.seeVacancies"),
      scope: alcance,
    },
    {
      title: t("ats.panel.interviews"),
      value: porCoordinar,
      context: t("ats.panel.interviewsContext"),
      href: "/ats/interviews",
      actionLabel: t("ats.panel.seeInterviews"),
      scope: alcance,
    },
    {
      title: t("ats.panel.conversion"),
      value: analitica.isError
        ? null
        : resumen
          // `${n}%` daba «8.3%» en español. El separador decimal y el espacio
          // antes del signo dependen del idioma.
          ? t("ats.panel.percentValue", {
              value: resumen.conversionRate.toLocaleString(locale === "es" ? "es-ES" : "en-US", {
                maximumFractionDigits: 1,
              }),
            })
          : undefined,
      context: t("ats.panel.conversionContext"),
      trend: variacion(resumen?.changes.conversionRate, { unidad: "puntos" }),
      href: "/ats/analytics",
      actionLabel: t("ats.panel.seeReports"),
      scope: alcanceAnalitica,
    },
    {
      title: t("ats.panel.timeToHire"),
      value: analitica.isError
        ? null
        : resumen
          ? resumen.averageTimeToHireHours > 0
            ? textoDuracion(resumen.averageTimeToHireHours)
            : "—"
          : undefined,
      context: t("ats.panel.timeToHireContext"),
      // Tardar menos es mejor: la flecha hacia abajo aquí es buena noticia.
      trend: variacion(resumen?.changes.averageTimeToHireHours, { unidad: "porcentaje", mejorSiBaja: true }),
      href: "/ats/analytics",
      actionLabel: t("ats.panel.seeReports"),
      scope: alcanceAnalitica,
    },
  ];

  /*
   * Tendencia semanal.
   *
   * `trends` viene en la MISMA respuesta que el embudo, así que esto no cuesta
   * una petición más: la pantalla ya lo tenía descargado y lo tiraba. El
   * backend rellena con ceros las semanas sin movimiento, de modo que un hueco
   * en la serie no existe y el cero es un dato, no una laguna.
   *
   * Dos series y no cuatro: postulaciones y contrataciones son la entrada y la
   * salida del proceso. Rechazos y bajas están en Reportes, que es donde se va
   * a investigar el porqué.
   */
  const tendencia = analitica.data?.trends ?? [];
  const hayTendencia = tendencia.some((fila) => fila.applications > 0 || fila.hires > 0);
  const etiquetaSemana = (indice: number) => {
    const fila = tendencia[Math.round(indice)];
    if (!fila) return "";
    const fecha = new Date(`${fila.period}T00:00:00.000Z`);
    return Number.isNaN(fecha.getTime())
      ? fila.period
      : new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-US", {
          day: "numeric",
          month: "short",
          timeZone: "UTC",
        }).format(fecha);
  };

  const embudo: FunnelStage[] = (analitica.data?.funnel ?? []).map((etapa) => ({
    id: etapa.stageCode,
    name: uiText(etapa.stageName),
    value: etapa.reached,
  }));

  // Solo las etapas con muestra suficiente. El resto existe en el backend, pero
  // publicar su media aquí sería presentar ruido como medida.
  const tiempos = (analitica.data?.funnel ?? []).filter(
    (etapa) => etapa.sampleSize >= MUESTRA_MINIMA && etapa.averageHours > 0,
  );

  /*
   * Unidad única para el eje de tiempos.
   *
   * `textoDuracion` cambia de horas a días al pasar de 24, que está bien para
   * una cifra suelta pero rompe un eje: quedaba «0 h · 1 d · 2,1 d». Un eje
   * mezcla unidades nunca, así que se elige una para todo el gráfico según el
   * mayor valor y las barras se dibujan en esa unidad.
   */
  const enHoras = tiempos.every((etapa) => etapa.averageHours < 24);
  const valorTiempo = (horas: number) => (enHoras ? horas : horas / 24);
  const formatoTiempo = (valor: number) =>
    enHoras
      ? t("ats.panel.hoursShort", { n: Math.round(valor) })
      : t("ats.panel.daysShort", {
          n: valor.toLocaleString(locale === "es" ? "es-ES" : "en-US", { maximumFractionDigits: 1 }),
        });

  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        eyebrow={uiText("Reclutamiento")}
        title={t("ats.today.title")}
        description={t("ats.today.help")}
        actions={
          can("jobs.create") ? (
            <Button asChild>
              <Link href="/ats/vacancies/new">
                <Plus className="size-4" aria-hidden="true" />
                {t("vacancies.new")}
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* ---- 0. Contexto activo ---------------------------------------- */}
      <ActiveContext />

      {/* ---- 1. Lo siguiente ------------------------------------------- */}
      {dashboard.isLoading ? (
        <SkeletonRows rows={4} label={t("ats.today.loading")} />
      ) : dashboard.isError ? (
        <ErrorState title={t("ats.today.errorTitle")} onRetry={() => void dashboard.refetch()} />
      ) : recommended ? (
        <section
          aria-labelledby="recruit-next"
          className="relative overflow-hidden rounded-xl border border-accent-line/40 bg-surface-1 p-5 shadow-e2 sm:p-6"
        >
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-accent-fill" />
          <div className="flex flex-col gap-4 pl-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="min-w-0 space-y-1">
              <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-accent-ink">
                {t("dashboard.nextAction")}
              </p>
              <h2 id="recruit-next" className="text-lg font-semibold text-ink-1 sm:text-xl">
                {recommended.title}
              </h2>
              {recommended.who ? <p className="text-base font-medium text-ink-1">{recommended.who}</p> : null}
              <p className="text-sm text-ink-2">
                {[recommended.detail, recommended.when].filter(Boolean).join(" · ")}
              </p>
            </div>
            <Button asChild size="lg" className="shrink-0">
              <Link href={recommended.href}>
                {recommended.actionLabel}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>
      ) : (
        <EmptyState
          reason="no-records"
          title={t("ats.today.emptyTitle")}
          description={t("ats.today.emptyHelp")}
          action={
            <Button asChild variant="secondary">
              <Link href="/ats/vacancies">{t("ats.today.openVacancies")}</Link>
            </Button>
          }
        />
      )}

      {/* ---- 2. Cómo está el módulo -------------------------------------
          Cuatro cifras, no doce. Cada una abre la lista ya filtrada. */}
      <StatusTileRow label={t("ats.panel.tilesLabel")}>
        {tarjetas.map((tarjeta) => (
          <li key={tarjeta.title} className="min-w-0">
            <StatusTile {...tarjeta} scope={alcance} />
          </li>
        ))}
      </StatusTileRow>

      {/* ---- 3. El resto de pendientes ---------------------------------- */}
      {rest.length > 0 ? (
        <PageSection
          title={t("ats.today.yourTasks")}
          actions={
            <StatusBadge
              tone="progress"
              label={
                rest.length === 1
                  ? t("ats.today.pendingOne")
                  : t("ats.today.pendingMany", { count: rest.length })
              }
            />
          }
          id="pendientes"
        >
          <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3 [&>article]:min-w-0 [&>article]:break-words">
            {rest.map((item) => (
              <TaskCard
                key={item.id}
                title={item.title}
                who={item.who}
                detail={item.detail}
                when={item.when}
                urgent={item.urgent}
                href={item.href}
                actionLabel={item.actionLabel}
              />
            ))}
          </div>
        </PageSection>
      ) : null}

      {/* ---- 4. Reparto por fase ----------------------------------------
          Dónde está ahora mismo la gente. Es un gráfico y a la vez una
          navegación: cada fila abre su fase. */}
      <PageSection title={t("ats.today.phasesNav")} description={t("ats.panel.phasesHelp")} id="fases">
        <PhaseRail phases={phases} locale={locale} />
      </PageSection>

      {/* ---- 5. Tendencia ------------------------------------------------
          Pregunta que responde: ¿vamos mejor o peor que antes? El panel no
          sabía contestarla, y el dato ya venía en la misma respuesta que el
          embudo. A todo el ancho: una serie de trece semanas necesita
          recorrido horizontal para que se vea la forma. */}
      <ChartCard
        title={t("ats.panel.trendTitle")}
        subtitle={t("ats.panel.trendSubtitle")}
        period={t("ats.panel.funnelPeriod", { days: DIAS_EMBUDO })}
        source={analitica.data?.source ? uiText(analitica.data.source) : undefined}
      >
        {analitica.isLoading ? (
          <ChartSkeleton label={t("ats.panel.funnelLoading")} />
        ) : analitica.isError ? (
          <InlineNote tone="warning" title={t("ats.panel.funnelErrorTitle")}>
            {t("ats.panel.funnelErrorHelp")}
          </InlineNote>
        ) : hayTendencia ? (
          <LineChart
            series={[
              {
                id: "applications",
                name: t("ats.panel.applicationsSeries"),
                points: tendencia.map((fila, indice) => ({ x: indice, y: fila.applications })),
              },
              {
                id: "hires",
                name: t("ats.panel.hiresSeries"),
                points: tendencia.map((fila, indice) => ({ x: indice, y: fila.hires })),
              },
            ]}
            caption={t("ats.panel.trendCaption")}
            xLabel={t("ats.panel.week")}
            formatValue={(valor) => String(valor)}
            formatX={etiquetaSemana}
          />
        ) : (
          <LineChart series={[]} emptyReason="sin-registros" />
        )}
      </ChartCard>

      {/* ---- 6. Embudo y tiempo por etapa --------------------------------
          Dos preguntas distintas sobre lo mismo, una al lado de la otra:
          dónde se pierde la gente y dónde se pierde el tiempo. El tiempo
          por etapa era una lista de texto debajo del embudo; comparar cuatro
          magnitudes leyendo cifras es justo el trabajo de unas barras. */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title={t("ats.panel.funnelTitle")}
          subtitle={t("ats.panel.funnelSubtitle")}
          period={t("ats.panel.funnelPeriod", { days: DIAS_EMBUDO })}
          source={analitica.data?.source ? uiText(analitica.data.source) : undefined}
        >
          {analitica.isLoading ? (
            <ChartSkeleton label={t("ats.panel.funnelLoading")} />
          ) : analitica.isError ? (
            <InlineNote tone="warning" title={t("ats.panel.funnelErrorTitle")}>
              {t("ats.panel.funnelErrorHelp")}
            </InlineNote>
          ) : (
            <FunnelChart
              stages={embudo}
              stageLabel={t("ats.panel.stage")}
              caption={t("ats.panel.funnelCaption")}
              emptyReason="sin-registros"
            />
          )}
        </ChartCard>

        <ChartCard
          title={t("ats.panel.stageTimeTitle")}
          subtitle={t("ats.panel.stageTimeHelp", { min: MUESTRA_MINIMA })}
          period={t("ats.panel.funnelPeriod", { days: DIAS_EMBUDO })}
          source={analitica.data?.source ? uiText(analitica.data.source) : undefined}
        >
          {analitica.isLoading ? (
            <ChartSkeleton label={t("ats.panel.funnelLoading")} />
          ) : analitica.isError ? (
            <InlineNote tone="warning" title={t("ats.panel.funnelErrorTitle")}>
              {t("ats.panel.funnelErrorHelp")}
            </InlineNote>
          ) : tiempos.length > 0 ? (
            <>
              <BarChart
                orientation="horizontal"
                categories={tiempos.map((etapa) => uiText(etapa.stageName))}
                series={[
                  {
                    id: "horas",
                    name: t("ats.panel.averageTime"),
                    values: tiempos.map((etapa) => valorTiempo(etapa.averageHours)),
                  },
                ]}
                caption={t("ats.panel.stageTimeCaption")}
                categoryLabel={t("ats.panel.stage")}
                formatValue={formatoTiempo}
              />
              {/* El tamaño de la muestra sigue a la vista: sin él, una media
                  de siete casos y una de setecientos se leen igual. */}
              <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3 text-2xs text-ink-3">
                {tiempos.map((etapa) => (
                  <li key={etapa.stageCode}>
                    {uiText(etapa.stageName)} · {t("ats.panel.sample", { n: etapa.sampleSize })}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <BarChart
              categories={[]}
              series={[]}
              emptyReason="sin-registros"
            />
          )}
        </ChartCard>
      </div>

      {/* ---- Contratación ------------------------------------------------
          Última fase del mismo módulo. Tenía su propio «Dashboard de
          contratación» en el menú, es decir, dos dashboards para Reclutamiento.
          Ahora es una sección de este: cifras, siguiente paso, reparto por
          etapa y las que requieren atención. La lista completa sigue en
          `/hiring`. */}
      <PageSection
        title={t("hiring.dashboard.title")}
        description={t("hiring.dashboard.description")}
        id="contrataciones"
        actions={
          <Button asChild variant="secondary">
            <Link href="/hiring">{t("hiring.dashboard.openList")}</Link>
          </Button>
        }
      >
        <HiringEmbeddedPanel />
      </PageSection>

      <MobileActionBar>
        <Button asChild size="lg" className="w-full">
          <Link href="/ats/candidates">{t("ats.today.allApplications")}</Link>
        </Button>
      </MobileActionBar>
    </div>
  );
}
