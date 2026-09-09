"use client";

import { useQuery } from "@tanstack/react-query";
import { GraduationCap } from "lucide-react";
import Link from "next/link";
import {
  ActiveContext,
  EmptyState,
  EntityCard,
  EntityCardList,
  ErrorState,
  NextAction,
  PageSection,
  SkeletonRows,
  StatusTile,
  StatusTileRow,
} from "@/components/system";
import { Button } from "@/components/ui/button";
import { BarChart, ChartCard, ChartSkeleton } from "@/components/chart";
import { URGENCY_COLOR_CLASS } from "@/components/dashboard/operational-widgets";
import { fetchTrainingAdminAssignments, fetchTrainingAnalytics, fetchTrainingOverview } from "@/lib/backend";
import type { TrainingAssignmentDto } from "@/lib/contracts";
import { formatMinutes } from "@/lib/training-labels";
import { selectTrainingNextAssignment } from "@/lib/training-ux";
import { useLocale } from "@/components/locale-provider";
import { useAppStore } from "@/store/app-store";

/* ==========================================================================
   PANEL DEL MÓDULO DE APRENDIZAJE
   ==========================================================================
   Dos panales distintos, nunca mezclados en la misma vista:

     · Quien aprende ve SU formación: qué continuar, qué debe, qué vence.
     · Quien administra ve el ESTADO DEL PROGRAMA: cuántos no han empezado,
       cuántos van tarde, qué proporción ha terminado.

   Son dos preguntas distintas y mezclarlas obliga a leer dos veces la misma
   pantalla para saber cuál de las dos se está mirando. Quien administra y
   además tiene cursos asignados encuentra los suyos en la pestaña «Mis
   cursos», que es el conmutador explícito entre ambos papeles.

   Patrones tomados de producto (verificados en documentación oficial)
   -------------------------------------------------------------------
   · TalentLMS: la tarjeta del curso es la unidad completa —progreso, plazo,
     entrada («Continuar») y salida (certificado)— en un solo objeto.
   · Docebo: la obligatoriedad se imprime EN la tarjeta, no se esconde en la
     configuración.
   · Sortly: el objeto se reconoce por su imagen; por eso la portada del curso
     va en la ficha y `EntityCard` acepta `coverSrc`.
   ========================================================================== */

/** Cuántas fichas caben antes de que la lista deje de leerse de un vistazo. */
const MAX_FICHAS = 4;

export function LearnerTrainingPanel() {
  const { t } = useLocale();
  const overview = useQuery({ queryKey: ["training-overview"], queryFn: fetchTrainingOverview });

  const datos = overview.data;
  const siguiente = selectTrainingNextAssignment(datos);

  /** `undefined` mientras carga · `null` si el servidor no lo entrega. */
  const cifra = (valor: number | undefined) =>
    overview.isError ? null : datos ? (valor ?? 0) : undefined;

  const enProgreso = datos?.inProgressAssignments ?? [];
  const vencidos = datos?.overdueAssignments ?? [];
  const nuevos = datos?.newAssignments ?? [];
  const completados = datos?.completedAssignments ?? [];
  // La cabecera de la pantalla prometía «qué vence pronto» y no estaba en
  // ninguna parte: `upcomingDue` venía en la respuesta sin usarse. Se quitan
  // los que ya están vencidos, que tienen su propia cifra y su propio color.
  const porVencer = (datos?.upcomingDue ?? []).filter(
    (asignacion) => (asignacion.effectiveStatus ?? asignacion.status) !== "OVERDUE",
  );

  /**
   * Intercala las cuatro categorías conservando la prioridad.
   *
   * Concatenarlas y cortar dejaba fuera categorías enteras. Repartir en
   * rondas —uno de cada, empezando por lo más urgente— garantiza que las
   * primeras fichas representen todo lo que hay, sin dejar de poner delante
   * lo vencido.
   */
  const porCompletar = intercalar([vencidos, porVencer, enProgreso, nuevos]);

  if (overview.isLoading) return <SkeletonRows rows={4} label={t("training.panel.loading")} />;
  if (overview.isError) {
    return <ErrorState title={t("training.panel.errorTitle")} onRetry={() => void overview.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <ActiveContext />

      {siguiente ? (
        <NextAction
          label={t("training.panel.keepLearning")}
          title={siguiente.title}
          detail={detalleDeAsignacion(siguiente, t)}
          href={`/training/learn/${siguiente.courseId ?? siguiente.id}`}
          actionLabel={
            siguiente.progressPercent > 0 ? t("training.panel.continue") : t("training.panel.start")
          }
          tone={
            (siguiente.effectiveStatus ?? siguiente.status) === "OVERDUE" ? "danger" : "progress"
          }
        />
      ) : (
        <EmptyState
          reason="no-records"
          title={t("training.panel.noneAssignedTitle")}
          description={t("training.panel.noneAssignedHelp")}
          action={
            <Button asChild variant="secondary">
              <Link href="/training/certificates">{t("training.panel.seeCertificates")}</Link>
            </Button>
          }
        />
      )}

      <StatusTileRow label={t("training.panel.myTilesLabel")} className="xl:grid-cols-5">
        <li className="min-w-0">
          <StatusTile
            title={t("training.panel.inProgress")}
            value={cifra(enProgreso.length)}
            context={t("training.panel.inProgressContext")}
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title={t("training.panel.toStart")}
            value={cifra(nuevos.length)}
            context={t("training.panel.toStartContext")}
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title={t("training.panel.dueSoon")}
            value={cifra(porVencer.length)}
            context={t("training.panel.dueSoonContext")}
            status={
              porVencer.length > 0 ? { label: t("training.panel.watch"), tone: "warning" as const } : undefined
            }
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title={t("training.panel.overdue")}
            value={cifra(vencidos.length)}
            context={t("training.panel.overdueContext")}
            status={
              vencidos.length > 0 ? { label: t("training.panel.late"), tone: "danger" as const } : undefined
            }
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title={t("training.panel.completed")}
            value={cifra(completados.length)}
            context={t("training.panel.completedContext")}
            href="/training/certificates"
            actionLabel={t("training.panel.seeCertificates")}
          />
        </li>
      </StatusTileRow>

      {/* Lo que debo completar.
          Antes se concatenaban vencidos, en curso y nuevos y se cortaba a
          cuatro: con tres vencidos y cinco en curso no aparecía ni un solo
          curso por empezar, aunque el rótulo dijera que estaban. Ahora se
          reparte el sitio: primero un vencido, luego uno por vencer, luego
          uno empezado, luego uno nuevo, y se vuelve a empezar. Lo urgente
          sigue yendo antes, pero ninguna categoría desaparece. */}
      {porCompletar.length > 0 ? (
        <PageSection
          title={t("training.panel.mustCompleteTitle")}
          description={t("training.panel.mustCompleteHelp")}
          id="por-completar"
          actions={
            porCompletar.length > MAX_FICHAS ? (
              <Button asChild variant="secondary">
                <Link href="/training">{t("training.panel.seeAllMine")}</Link>
              </Button>
            ) : undefined
          }
        >
          <EntityCardList label={t("training.panel.mustCompleteTitle")} columns={2}>
            {porCompletar.slice(0, MAX_FICHAS).map((asignacion) => (
              <li key={asignacion.id}>
                <TrainingAssignmentCard assignment={asignacion} />
              </li>
            ))}
          </EntityCardList>
        </PageSection>
      ) : null}
    </div>
  );
}

/**
 * Ficha de una asignación formativa.
 *
 * Lleva todo lo que el encargo pide en una tarjeta de curso: portada, título,
 * duración estimada, avance, obligatoriedad, fecha límite y próxima acción.
 * Lo que el servidor no entrega —una duración de 0 minutos, por ejemplo— no se
 * pinta: un «0 min» inventado es peor que la ausencia del dato.
 */
export function TrainingAssignmentCard({ assignment }: { assignment: TrainingAssignmentDto }) {
  const { t } = useLocale();
  const estado = assignment.effectiveStatus ?? assignment.status;
  const portada = assignment.coverImageUrl ?? assignment.course?.coverImageUrl ?? null;

  const datos = [
    assignment.estimatedMinutes > 0
      ? { label: t("training.panel.duration"), value: formatMinutes(assignment.estimatedMinutes) }
      : null,
    {
      label: t("training.panel.required"),
      value: assignment.isRequired ? t("training.panel.mandatory") : t("training.panel.optional"),
    },
    assignment.dueAt
      ? { label: t("training.panel.dueDate"), value: fechaLarga(assignment.dueAt) }
      : null,
  ].filter((dato): dato is { label: string; value: string } => dato !== null);

  return (
    <EntityCard
      title={assignment.title}
      coverSrc={portada}
      icon={portada ? undefined : <GraduationCap className="size-5" aria-hidden="true" />}
      subtitle={assignment.description ?? undefined}
      href={`/training/learn/${assignment.courseId ?? assignment.id}`}
      status={{
        label: t(`training.panel.status.${estado}`),
        tone:
          estado === "OVERDUE"
            ? "danger"
            : estado === "COMPLETED"
              ? "success"
              : estado === "IN_PROGRESS"
                ? "progress"
                : "neutral",
      }}
      facts={datos}
      progress={{
        label: t("common.progress"),
        value: assignment.progressPercent,
        detail: t("training.panel.percentDone", { n: Math.round(assignment.progressPercent) }),
      }}
      nextStep={
        assignment.progressPercent > 0 ? t("training.panel.continue") : t("training.panel.start")
      }
    />
  );
}

/* ==================== Panel de quien administra =========================
   Antes era una fila de cuatro tarjetas y nada más: ni acción recomendada, ni
   gráfico, ni lista. Decía cuántas personas iban tarde, pero no EN QUÉ CURSO,
   que es lo único que permite hacer algo al respecto.

   Ahora consulta también `/training/admin/analytics/overview`, que ya existía
   y no se pedía desde aquí. De ahí salen el progreso medio, la tasa de
   aprobación y —lo importante— `byCourse`: el reparto por curso con sus
   vencidos. Es una petición más, y es la única fuente de todo eso.

   Los tablones profundos —matriz de cumplimiento, rendimiento por curso
   ordenable, efectividad— se quedan en Resultados. Aquí solo va lo que hace
   falta para decidir a quién perseguir hoy.
   ======================================================================== */

/** Cuántos cursos se dibujan antes de que las barras dejen de compararse. */
const MAX_CURSOS = 6;

export function AdminTrainingPanel() {
  const { t } = useLocale();
  const { currentBranch } = useAppStore();
  const branchId = currentBranch?.id;

  // `pageSize: 1`: el resumen lo calcula el servidor y el navegador no recibe
  // asignaciones que no va a mostrar. La lista completa vive en su pestaña.
  const resumen = useQuery({
    queryKey: ["training-admin-summary", branchId ?? null],
    queryFn: () => fetchTrainingAdminAssignments({ page: 1, pageSize: 1, branchId }),
    staleTime: 60_000,
  });

  const analitica = useQuery({
    queryKey: ["training-analytics", "module-dashboard", branchId ?? null],
    queryFn: () => fetchTrainingAnalytics({ branchId }),
    staleTime: 300_000,
  });

  const datos = resumen.data?.summary;
  const programa = analitica.data?.summary;

  /** `undefined` mientras carga · `null` si el servidor no entrega el resumen. */
  const cifra = (valor?: number) =>
    resumen.isError ? null : resumen.isLoading ? undefined : datos ? (valor ?? 0) : null;
  const cifraPrograma = (valor?: number) =>
    analitica.isError ? null : analitica.isLoading ? undefined : programa ? (valor ?? 0) : null;

  // Tasa de finalización: solo si hay denominador. Un «0 %» sobre cero
  // asignaciones no informa de nada.
  const tasa =
    datos && datos.total > 0 ? `${Math.round((datos.completed / datos.total) * 100)} %` : null;

  const alcance = currentBranch ? currentBranch.name : t("common.allBranches");

  /*
   * Reparto por estado.
   *
   * Las cuatro cifras de arriba suman el total de asignaciones: son un reparto
   * de un todo, y como cuatro números sueltos no se ve la proporción. En
   * barras sí, y el color dice urgencia —rojo lo vencido, ámbar lo que ni
   * siquiera se ha abierto— en vez de tratar los cuatro estados como
   * intercambiables.
   */
  const reparto = datos
    ? [
        { id: "overdue", label: t("training.panel.adminOverdue"), value: datos.overdue, color: URGENCY_COLOR_CLASS.danger },
        { id: "notStarted", label: t("training.panel.adminNotStarted"), value: datos.notStarted, color: URGENCY_COLOR_CLASS.warning },
        { id: "inProgress", label: t("training.panel.adminInProgress"), value: datos.inProgress, color: URGENCY_COLOR_CLASS.info },
        { id: "completed", label: t("training.panel.adminCompletedShort"), value: datos.completed, color: URGENCY_COLOR_CLASS.neutral },
      ]
    : [];
  const hayReparto = reparto.some((entrada) => entrada.value > 0);

  /*
   * Dónde se atasca la formación.
   *
   * Los cursos con gente fuera de plazo, de más a menos. Es la respuesta a
   * «¿a quién persigo?»: sin esto el panel decía que hay doce personas tarde
   * y dejaba al lector abrir Resultados para averiguar en qué.
   */
  const cursos = [...(analitica.data?.byCourse ?? [])]
    .filter((curso) => curso.overdue > 0)
    .sort((a, b) => b.overdue - a.overdue || a.title.localeCompare(b.title))
    .slice(0, MAX_CURSOS);

  const peor = cursos[0];

  return (
    <div className="space-y-6">
      <ActiveContext />

      {resumen.isError ? (
        <ErrorState title={t("training.panel.adminErrorTitle")} onRetry={() => void resumen.refetch()} />
      ) : peor ? (
        <NextAction
          label={t("training.panel.needsAction")}
          title={t("training.panel.chaseCourse", { title: peor.title })}
          detail={t("training.panel.chaseDetail", {
            overdue: peor.overdue,
            assigned: peor.assigned,
            progress: Math.round(peor.averageProgress),
          })}
          href="/training/results"
          actionLabel={t("training.panel.seeResults")}
          tone="danger"
        />
      ) : datos && datos.total > 0 ? (
        <NextAction
          label={t("training.panel.onTrackLabel")}
          title={t("training.panel.onTrackTitle")}
          detail={t("training.panel.adminCompletionContext", { done: datos.completed, total: datos.total })}
          href="/training/results"
          actionLabel={t("training.panel.seeResults")}
          tone="progress"
        />
      ) : null}

      <StatusTileRow label={t("training.panel.adminTilesLabel")} className="xl:grid-cols-3">
        <li className="min-w-0">
          <StatusTile
            title={t("training.panel.adminOverdue")}
            value={cifra(datos?.overdue)}
            context={t("training.panel.adminOverdueContext")}
            status={
              datos && datos.overdue > 0
                ? { label: t("training.panel.needsAction"), tone: "danger" as const }
                : undefined
            }
            scope={alcance}
            href="/training/results"
            actionLabel={t("training.panel.review")}
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title={t("training.panel.adminNotStarted")}
            value={cifra(datos?.notStarted)}
            context={t("training.panel.adminNotStartedContext")}
            scope={alcance}
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title={t("training.panel.adminInProgress")}
            value={cifra(datos?.inProgress)}
            context={t("training.panel.adminInProgressContext")}
            scope={alcance}
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title={t("training.panel.adminCompletionRate")}
            value={resumen.isLoading ? undefined : tasa}
            context={
              datos && datos.total > 0
                ? t("training.panel.adminCompletionContext", { done: datos.completed, total: datos.total })
                : t("training.panel.adminCompletionNoBase")
            }
            scope={alcance}
            href="/training/results"
            actionLabel={t("training.panel.seeResults")}
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title={t("training.panel.averageProgress")}
            value={
              analitica.isLoading
                ? undefined
                : programa
                  ? t("training.panel.percentValue", { n: Math.round(programa.averageProgress) })
                  : null
            }
            context={t("training.panel.averageProgressContext")}
            scope={alcance}
            href="/training/results"
            actionLabel={t("training.panel.seeResults")}
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title={t("training.panel.passRate")}
            value={
              analitica.isLoading
                ? undefined
                : programa
                  ? t("training.panel.percentValue", { n: Math.round(programa.passRate) })
                  : null
            }
            context={t("training.panel.passRateContext", { learners: cifraPrograma(programa?.uniqueLearners) ?? 0 })}
            scope={alcance}
            href="/training/evaluations"
            actionLabel={t("training.panel.seeEvaluations")}
          />
        </li>
      </StatusTileRow>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title={t("training.panel.mixTitle")}
          subtitle={t("training.panel.mixSubtitle")}
          period={alcance}
        >
          {resumen.isLoading ? (
            <ChartSkeleton label={t("training.panel.adminLoading")} />
          ) : !hayReparto ? (
            <BarChart categories={[]} series={[]} emptyReason="sin-registros" />
          ) : (
            <BarChart
              orientation="horizontal"
              categories={reparto.map((entrada) => entrada.label)}
              series={[{ id: "estado", name: t("training.panel.assignments"), values: reparto.map((e) => e.value) }]}
              // El color dice urgencia, no identidad: cada estado lleva su
              // nombre escrito al lado en el eje.
              categoryColorClasses={reparto.map((entrada) => entrada.color)}
              caption={t("training.panel.mixCaption")}
              categoryLabel={t("training.panel.state")}
              formatValue={(valor) => String(valor)}
            />
          )}
        </ChartCard>

        <ChartCard
          title={t("training.panel.stuckTitle")}
          subtitle={t("training.panel.stuckSubtitle")}
          period={alcance}
        >
          {analitica.isLoading ? (
            <ChartSkeleton label={t("training.panel.adminLoading")} />
          ) : analitica.isError || cursos.length === 0 ? (
            <BarChart categories={[]} series={[]} emptyReason="sin-registros" />
          ) : (
            <>
              <BarChart
                orientation="horizontal"
                categories={cursos.map((curso) => curso.title)}
                series={[{ id: "vencidos", name: t("training.panel.overdue"), values: cursos.map((c) => c.overdue) }]}
                caption={t("training.panel.stuckCaption")}
                categoryLabel={t("training.panel.course")}
                formatValue={(valor) => String(valor)}
              />
              {/* Cuántos hay asignados en total detrás de cada barra: tres
                  vencidos sobre cuatro asignados y tres sobre trescientos no
                  son el mismo problema. */}
              <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3 text-2xs text-ink-3">
                {cursos.map((curso) => (
                  <li key={curso.courseId}>
                    {curso.title} · {t("training.panel.ofAssigned", { n: curso.assigned })}
                  </li>
                ))}
              </ul>
            </>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

/* ============================== Auxiliares ============================== */

/** Reparte por rondas: uno de cada lista, en orden, hasta agotarlas. */
export function intercalar<T>(listas: readonly (readonly T[])[]): T[] {
  const salida: T[] = [];
  const maximo = Math.max(0, ...listas.map((lista) => lista.length));
  for (let ronda = 0; ronda < maximo; ronda += 1) {
    for (const lista of listas) {
      const elemento = lista[ronda];
      if (elemento !== undefined) salida.push(elemento);
    }
  }
  return salida;
}

function detalleDeAsignacion(
  asignacion: TrainingAssignmentDto,
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  return [
    asignacion.progressPercent > 0
      ? t("training.panel.percentDone", { n: Math.round(asignacion.progressPercent) })
      : null,
    asignacion.estimatedMinutes > 0 ? formatMinutes(asignacion.estimatedMinutes) : null,
    asignacion.dueAt ? t("training.panel.dueOn", { date: fechaLarga(asignacion.dueAt) }) : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function fechaLarga(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date(value));
}
