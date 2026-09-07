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
import { fetchTrainingAdminAssignments, fetchTrainingOverview } from "@/lib/backend";
import type { TrainingAssignmentDto } from "@/lib/contracts";
import { formatMinutes } from "@/lib/training-labels";
import { selectTrainingNextAssignment } from "@/lib/training-ux";
import { useLocale } from "@/components/locale-provider";

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

      <StatusTileRow label={t("training.panel.myTilesLabel")}>
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

      {/* Lo que debo completar. Vencidos primero: son los únicos que tienen
          consecuencia, y mezclarlos con el resto los esconde. */}
      {vencidos.length + enProgreso.length + nuevos.length > 0 ? (
        <PageSection
          title={t("training.panel.mustCompleteTitle")}
          description={t("training.panel.mustCompleteHelp")}
          id="por-completar"
        >
          <EntityCardList label={t("training.panel.mustCompleteTitle")} columns={2}>
            {[...vencidos, ...enProgreso, ...nuevos].slice(0, MAX_FICHAS).map((asignacion) => (
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

/* ==================== Panel de quien administra ========================= */

export function AdminTrainingPanel() {
  const { t } = useLocale();

  // `pageSize: 1`: el resumen lo calcula el servidor y el navegador no recibe
  // asignaciones que no va a mostrar. La lista completa vive en su pestaña.
  const resumen = useQuery({
    queryKey: ["training-admin-summary"],
    queryFn: () => fetchTrainingAdminAssignments({ page: 1, pageSize: 1 }),
    staleTime: 60_000,
  });

  const datos = resumen.data?.summary;

  /** `undefined` mientras carga · `null` si el servidor no entrega el resumen. */
  const cifra = (valor?: number) =>
    resumen.isError ? null : resumen.isLoading ? undefined : datos ? (valor ?? 0) : null;

  // Tasa de finalización: solo si hay denominador. Un «0 %» sobre cero
  // asignaciones no informa de nada.
  const tasa =
    datos && datos.total > 0 ? `${Math.round((datos.completed / datos.total) * 100)} %` : null;

  return (
    <div className="space-y-6">
      <ActiveContext />

      {resumen.isError ? (
        <ErrorState title={t("training.panel.adminErrorTitle")} onRetry={() => void resumen.refetch()} />
      ) : null}

      <StatusTileRow label={t("training.panel.adminTilesLabel")}>
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
            href="/training/results"
            actionLabel={t("training.panel.review")}
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title={t("training.panel.adminNotStarted")}
            value={cifra(datos?.notStarted)}
            context={t("training.panel.adminNotStartedContext")}
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title={t("training.panel.adminInProgress")}
            value={cifra(datos?.inProgress)}
            context={t("training.panel.adminInProgressContext")}
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
            href="/training/results"
            actionLabel={t("training.panel.seeResults")}
          />
        </li>
      </StatusTileRow>
    </div>
  );
}

/* ============================== Auxiliares ============================== */

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
