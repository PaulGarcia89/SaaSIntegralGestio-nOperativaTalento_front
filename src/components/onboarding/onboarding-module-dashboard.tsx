"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ClipboardList, FileSignature, LineChart, ShieldCheck, Users } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { fetchOnboardingAnalytics, fetchOnboardingFlows, getApiErrorMessage } from "@/lib/backend";
import type { EmployeeOnboardingFlowDto } from "@/lib/contracts";
import { formatDate, formatDateTime } from "@/lib/platform-labels";
import { useAppStore } from "@/store/app-store";

/**
 * Dashboard de Incorporación: primera pantalla del módulo.
 *
 * Antes `/onboarding` redirigía al listado de incorporaciones, así que el
 * módulo abría sin decir cómo iba. Aquí responde lo de siempre: cuántas
 * incorporaciones hay en curso, cuáles están en riesgo o con tareas vencidas,
 * qué hacer ahora, qué pasó hace poco y por dónde entrar a operar.
 *
 * Dos fuentes reales, ninguna inventada:
 *   · `/onboarding/analytics`: total, tasa de finalización, cumplimiento
 *     documental, tiempo hasta productividad y expedientes en riesgo. Lo
 *     calcula el servidor sobre toda la sucursal.
 *   · `/onboarding/flows`: los expedientes con sus tareas, alertas y línea
 *     de tiempo. De ahí salen «requieren atención» y «cambió hace poco».
 *     Si hay más páginas de las que se cargan, se dice: una cifra parcial
 *     presentada como total engaña más que no enseñarla.
 */

const PAGINA = 50;
const MAX_ATENCION = 4;
const MAX_CAMBIOS = 6;

export function OnboardingModuleDashboard() {
  const { can, currentBranch } = useAppStore();
  const puedeVer = can("onboarding.view");
  const puedeGestionar = can("onboarding.manage");
  const branchId = currentBranch?.id;

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

  if (!puedeVer) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Personas" title="Dashboard de incorporación" />
        <EmptyState
          reason="no-records"
          title="No tienes acceso a las incorporaciones"
          description="Pide a quien administra la empresa el permiso para ver incorporaciones."
        />
      </div>
    );
  }

  const resumen = analitica.data?.summary;
  const flujos = expedientes.data?.items ?? [];
  const parcial = Boolean(expedientes.data && expedientes.data.total > flujos.length);
  const ahora = new Date().toISOString();

  const enCurso = flujos.filter((flujo) => flujo.status !== "COMPLETED" && flujo.status !== "CANCELLED");
  const tareasVencidas = (flujo: EmployeeOnboardingFlowDto) =>
    flujo.tasks.filter(
      (tarea) => tarea.dueDate && tarea.dueDate < ahora && (tarea.status === "PENDING" || tarea.status === "IN_PROGRESS" || tarea.status === "BLOCKED"),
    ).length;
  const totalVencidas = enCurso.reduce((suma, flujo) => suma + tareasVencidas(flujo), 0);

  /** Primero las que tienen alerta grave, luego las que tienen tareas vencidas, luego las bloqueadas. */
  const atencion = enCurso
    .map((flujo) => ({
      flujo,
      graves: flujo.alerts.filter((alerta) => alerta.severity === "danger").length,
      vencidas: tareasVencidas(flujo),
      bloqueadas: flujo.tasks.filter((tarea) => tarea.status === "BLOCKED").length,
    }))
    .filter((item) => item.graves > 0 || item.vencidas > 0 || item.bloqueadas > 0)
    .sort((a, b) => b.graves - a.graves || b.vencidas - a.vencidas || b.bloqueadas - a.bloqueadas);

  const siguiente = atencion[0]?.flujo ?? enCurso.find((flujo) => flujo.nextAction) ?? null;

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

  const cumplimiento =
    resumen && resumen.totalFlows > 0 ? Math.round(resumen.documentComplianceRate * (resumen.documentComplianceRate <= 1 ? 100 : 1)) : null;

  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        eyebrow="Personas"
        title="Dashboard de incorporación"
        description="Cómo van las incorporaciones de la sucursal, cuáles necesitan atención y qué hacer ahora."
        actions={
          <Button asChild variant="secondary">
            <Link href="/onboarding/documents">Ver incorporaciones</Link>
          </Button>
        }
      />

      <ActiveContext />

      {expedientes.isLoading ? (
        <SkeletonRows rows={3} label="Cargando incorporaciones" />
      ) : expedientes.isError ? (
        <ErrorState
          title="No fue posible cargar las incorporaciones"
          detail={getApiErrorMessage(expedientes.error, "Reintenta la consulta para continuar.")}
          onRetry={() => void expedientes.refetch()}
        />
      ) : siguiente ? (
        <NextAction
          label={atencion[0] ? "Lo más urgente" : "Lo siguiente"}
          title={`Abrir la incorporación de ${siguiente.employee.name}`}
          detail={describir(siguiente, tareasVencidas(siguiente))}
          href={`/onboarding/documents?flowId=${encodeURIComponent(siguiente.id)}`}
          actionLabel="Abrir"
          tone={atencion[0]?.graves ? "danger" : atencion[0] ? "warning" : "progress"}
        />
      ) : (
        <EmptyState
          reason="no-records"
          title={enCurso.length === 0 ? "No hay incorporaciones en curso" : "Nada pendiente por ahora"}
          description={
            enCurso.length === 0
              ? "Las incorporaciones nacen al cerrar una contratación. Cuando exista una, aparecerá aquí."
              : "Ninguna incorporación tiene tareas vencidas ni alertas."
          }
        />
      )}

      {analitica.isError ? (
        <InlineNote tone="danger" title="No fue posible cargar la analítica de incorporación">
          {getApiErrorMessage(analitica.error, "Reintenta la consulta para continuar.")}
        </InlineNote>
      ) : null}

      <StatusTileRow label="Estado de las incorporaciones">
        <li className="min-w-0">
          <StatusTile
            title="En curso"
            value={cifraExpedientes(enCurso.length)}
            context="Personas que todavía no terminaron su incorporación."
            scope={currentBranch ? currentBranch.name : "Todas las sucursales"}
            href="/onboarding/documents"
            actionLabel="Ver incorporaciones"
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title="En riesgo"
            value={cifraAnalitica(resumen?.atRisk)}
            context="Expedientes que el servidor marca con riesgo de retraso."
            status={resumen && resumen.atRisk > 0 ? { label: "Revisar", tone: "warning" as const } : undefined}
            href="/onboarding/analytics"
            actionLabel="Ver analítica"
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title="Tareas vencidas"
            value={cifraExpedientes(totalVencidas)}
            context="Tareas abiertas cuya fecha límite ya pasó."
            status={totalVencidas > 0 && expedientes.data ? { label: "Atrasado", tone: "danger" as const } : undefined}
            href="/onboarding/documents"
            actionLabel="Ver incorporaciones"
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title="Cumplimiento documental"
            value={analitica.isLoading ? undefined : cumplimiento === null ? null : `${cumplimiento} %`}
            context="Documentos aprobados sobre los requeridos."
            href="/onboarding/signatures"
            actionLabel="Ver documentos"
          />
        </li>
      </StatusTileRow>

      {parcial ? (
        <InlineNote tone="info" title={`Se muestran ${flujos.length} de ${expedientes.data?.total ?? 0} incorporaciones`}>
          Las cifras de arriba se cuentan sobre las cargadas. El listado completo está en Incorporaciones.
        </InlineNote>
      ) : null}

      <PageSection title="Operaciones del módulo" description="Cada pantalla dice para qué sirve, con icono y texto.">
        <ul className="grid gap-3 [&>li]:min-w-0 sm:grid-cols-2 xl:grid-cols-4">
          <Destino href="/onboarding/documents" icon={Users} label="Incorporaciones" detail="Cada expediente con sus tareas, documentos y avance." />
          <Destino href="/onboarding/signatures" icon={FileSignature} label="Documentos y firmas" detail="Paquetes por firmar y documentos por revisar." />
          <Destino href="/onboarding/analytics" icon={LineChart} label="Analítica" detail="Tiempos por etapa, riesgos y comparativas." />
          {puedeGestionar ? (
            <Destino href="/onboarding/compliance" icon={ShieldCheck} label="Cumplimiento" detail="Retención, evidencias de firma y políticas." />
          ) : (
            <Destino href="/onboarding/operations" icon={ClipboardList} label="Operaciones" detail="Tareas operativas ligadas a cada incorporación." />
          )}
        </ul>
      </PageSection>

      {atencion.length > 0 ? (
        <PageSection
          title="Requieren atención"
          description="Alertas graves, tareas vencidas o bloqueadas. Primero las más urgentes."
          id="atencion"
        >
          <EntityCardList label="Incorporaciones que requieren atención" columns={2}>
            {atencion.slice(0, MAX_ATENCION).map(({ flujo, graves, vencidas, bloqueadas }) => (
              <EntityCard
                key={flujo.id}
                title={flujo.employee.name}
                subtitle={[flujo.employee.jobTitle, flujo.branch.name].filter(Boolean).join(" · ")}
                avatarName={flujo.employee.name}
                status={
                  graves > 0
                    ? { label: "Alerta grave", tone: "danger" }
                    : vencidas > 0
                      ? { label: "Tareas vencidas", tone: "warning" }
                      : { label: "Bloqueada", tone: "blocked" }
                }
                facts={[
                  { label: "Vencidas", value: vencidas },
                  { label: "Bloqueadas", value: bloqueadas },
                  { label: "Inicio", value: formatDate(flujo.startedAt) },
                ]}
                progress={{ label: "Avance", value: flujo.progressPercent, max: 100 }}
                nextStep={flujo.nextAction?.title ?? flujo.alerts[0]?.message}
                href={`/onboarding/documents?flowId=${encodeURIComponent(flujo.id)}`}
              />
            ))}
          </EntityCardList>
        </PageSection>
      ) : null}

      <PageSection title="Cambió hace poco" description="Los últimos movimientos registrados en las incorporaciones cargadas." boxed>
        {expedientes.isLoading ? (
          <SkeletonRows rows={3} />
        ) : cambios.length === 0 ? (
          <EmptyState reason="no-records" title="Sin movimientos todavía" description="Cuando una incorporación avance, aparecerá aquí." />
        ) : (
          <Timeline entries={cambios} />
        )}
      </PageSection>
    </div>
  );
}

function describir(flujo: EmployeeOnboardingFlowDto, vencidas: number) {
  const partes: string[] = [];
  if (vencidas > 0) partes.push(`${vencidas} ${vencidas === 1 ? "tarea vencida" : "tareas vencidas"}`);
  const grave = flujo.alerts.find((alerta) => alerta.severity === "danger");
  if (grave) partes.push(grave.message);
  else if (flujo.nextAction) partes.push(`Siguiente: ${flujo.nextAction.title}`);
  partes.push(`${flujo.progressPercent} % completado`);
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
