"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowRightLeft, Boxes, Plus, QrCode, RotateCcw, Wrench } from "lucide-react";
import { fetchInventoryAnalytics, fetchInventoryAssets, fetchInventoryMaintenance, getApiErrorMessage } from "@/lib/backend";
import { assetStatusLabel, assetStatusTone, formatDateTime } from "@/lib/inventory-labels";
import { useAppStore } from "@/store/app-store";
import {
  ActiveContext,
  EmptyState,
  ErrorState,
  InlineNote,
  NextAction,
  PageHeader,
  PageSection,
  SkeletonRows,
  StatusBadge,
  StatusTile,
  StatusTileRow,
} from "@/components/system";
import { Button } from "@/components/ui/button";

/**
 * Dashboard del inventario de activos: primera pantalla del módulo.
 *
 * Responde a cinco preguntas y nada más: cómo está el inventario de la
 * sucursal, qué necesita atención, qué hacer ahora, qué cambió hace poco y
 * por dónde entrar a cada operación. El listado de activos con filtros,
 * fichas y diálogos sigue en `/inventory/assets`; aquí solo se enlaza.
 *
 * Las cifras salen de `/inventory/analytics`, que cuenta en el servidor
 * sobre TODO el inventario de la sucursal. La lista de «cambió hace poco»
 * se arma con los activos ordenados por `updatedAt`, porque no existe un
 * endpoint de movimientos globales: se dice qué activo cambió y a qué estado
 * quedó, sin inventar el movimiento que lo dejó así.
 */

const RECIENTES = 6;

export function AssetsModuleDashboard() {
  const { can, currentBranch } = useAppStore();
  const canManage = can("asset_inventory.manage");
  const branchId = currentBranch?.id;

  const analytics = useQuery({
    queryKey: ["inventory-analytics", branchId ?? null],
    queryFn: () => fetchInventoryAnalytics(branchId),
    staleTime: 60_000,
  });
  const recientes = useQuery({
    queryKey: ["inventory-assets", "", "", branchId],
    queryFn: () => fetchInventoryAssets({ branchId }),
    staleTime: 60_000,
  });
  const mantenimiento = useQuery({
    queryKey: ["inventory-maintenance"],
    queryFn: fetchInventoryMaintenance,
    enabled: canManage,
    staleTime: 60_000,
  });

  const resumen = analytics.data;
  /** `undefined` mientras carga · `null` si el servidor no lo entrega. */
  const cifra = (valor?: number) =>
    analytics.isError ? null : analytics.isLoading ? undefined : resumen ? (valor ?? 0) : null;
  const porAtender = resumen ? resumen.assets.returnPending + resumen.assets.maintenance : undefined;

  const cambiosRecientes = [...(recientes.data ?? [])]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, RECIENTES);

  const ordenesAbiertas = (mantenimiento.data ?? []).filter((orden) => orden.status.toUpperCase() !== "RESOLVED");
  const hoy = new Date().toISOString();
  const ordenesVencidas = ordenesAbiertas.filter((orden) => orden.dueAt && orden.dueAt < hoy);

  const accion = siguienteAccion({ resumen, ordenesVencidas: ordenesVencidas.length, canManage });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operaciones"
        title="Dashboard de inventario de activos"
        description="Cómo está el inventario de la sucursal, qué necesita atención y por dónde seguir."
        actions={
          canManage ? (
            <Button asChild>
              <Link href="/inventory/assets">
                <Plus className="size-4" aria-hidden="true" />
                Registrar activo
              </Link>
            </Button>
          ) : undefined
        }
      />

      <ActiveContext />

      {accion ? (
        <NextAction
          label={accion.label}
          title={accion.title}
          detail={accion.detail}
          tone={accion.tone}
          href={accion.href}
          actionLabel={accion.actionLabel}
        />
      ) : null}

      {analytics.isError ? (
        <InlineNote tone="danger" title="No fue posible cargar las cifras del inventario">
          {getApiErrorMessage(analytics.error, "Reintenta la consulta para continuar.")}
        </InlineNote>
      ) : null}

      <StatusTileRow label="Estado del inventario de activos">
        <li className="min-w-0">
          <StatusTile
            title="Disponibles"
            value={cifra(resumen?.assets.available)}
            context="Listos para entregar a alguien."
            scope={currentBranch ? currentBranch.name : "Todas las sucursales"}
            href="/inventory/assets?status=AVAILABLE"
            actionLabel="Ver disponibles"
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title="En custodia"
            value={cifra(resumen?.assets.assigned)}
            context="Entregados y bajo la responsabilidad de una persona."
            scope={currentBranch ? currentBranch.name : "Todas las sucursales"}
            href="/inventory/assets?status=ASSIGNED"
            actionLabel="Ver en custodia"
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title="Requieren atención"
            value={cifra(porAtender)}
            context="Devoluciones pendientes y equipos en mantenimiento."
            status={
              typeof porAtender === "number" && porAtender > 0
                ? { label: "Hay pendientes", tone: "warning" as const }
                : undefined
            }
            href="/inventory/assets?status=RETURN_PENDING"
            actionLabel="Ver devoluciones"
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title="Existencias bajo mínimo"
            value={cifra(resumen?.stock.belowMinimum)}
            context="Referencias del almacén por debajo de su mínimo."
            status={
              resumen && resumen.stock.belowMinimum > 0 ? { label: "Reponer", tone: "danger" as const } : undefined
            }
            href="/inventory/assets/warehouse"
            actionLabel="Ver almacén"
          />
        </li>
      </StatusTileRow>

      <PageSection title="Operaciones" description="Las cuatro tareas del día, con icono y texto.">
        <ul className="grid gap-3 [&>li]:min-w-0 sm:grid-cols-2 xl:grid-cols-4">
          <QuickAction
            href="/inventory/deliveries"
            icon={<ArrowRightLeft className="size-5" aria-hidden="true" />}
            title="Entregar equipo"
            detail="Reservas esperando confirmación de entrega."
          />
          <QuickAction
            href="/inventory/returns"
            icon={<RotateCcw className="size-5" aria-hidden="true" />}
            title="Recibir devolución"
            detail={
              resumen
                ? `${resumen.assets.returnPending} ${resumen.assets.returnPending === 1 ? "devolución pendiente" : "devoluciones pendientes"}.`
                : "Equipos que vuelven y hay que validar."
            }
          />
          <QuickAction
            href="/inventory/assets/maintenance"
            icon={<Wrench className="size-5" aria-hidden="true" />}
            title="Mantenimiento"
            detail={
              resumen
                ? `${resumen.operations.openMaintenance} ${resumen.operations.openMaintenance === 1 ? "orden abierta" : "órdenes abiertas"}.`
                : "Órdenes de mantenimiento."
            }
          />
          <QuickAction
            href="/inventory/scan"
            icon={<QrCode className="size-5" aria-hidden="true" />}
            title="Escanear activo"
            detail="Abre la ficha leyendo su etiqueta."
          />
        </ul>
      </PageSection>

      <div className="grid gap-6 xl:grid-cols-2 [&>*]:min-w-0">
        <PageSection
          title="Cambió hace poco"
          description="Los últimos activos que cambiaron de estado o de custodia en esta sucursal."
          boxed
        >
          {recientes.isLoading ? (
            <SkeletonRows rows={4} />
          ) : recientes.isError ? (
            <ErrorState
              title="No fue posible cargar los activos"
              detail={getApiErrorMessage(recientes.error, "Reintenta la consulta para continuar.")}
              onRetry={() => void recientes.refetch()}
            />
          ) : cambiosRecientes.length === 0 ? (
            <EmptyState
              reason="no-records"
              title="Todavía no hay activos en esta sucursal"
              description="Registra el primero desde el listado de activos."
              action={
                canManage ? (
                  <Button asChild variant="outline">
                    <Link href="/inventory/assets">Ir al listado</Link>
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <ul className="divide-y divide-line">
              {cambiosRecientes.map((asset) => (
                <li key={asset.id} className="relative flex min-w-0 items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    {/* El enlace extiende su área a toda la fila: 44px de alto mínimo sin agrandar el texto. */}
                    <Link
                      href={`/inventory/assets?search=${encodeURIComponent(asset.assetTag)}`}
                      className="line-clamp-2 break-words font-medium text-ink-1 after:absolute after:inset-0 hover:underline"
                    >
                      {asset.item.name}
                    </Link>
                    <p className="truncate text-sm text-ink-2">
                      <span className="font-mono text-2xs text-ink-3">{asset.assetTag}</span>
                      {asset.employee ? ` · ${asset.employee.name}` : " · Sin asignar"}
                    </p>
                    <p className="font-mono text-2xs text-ink-3 tabular-figures">{formatDateTime(asset.updatedAt)}</p>
                  </div>
                  <StatusBadge size="sm" tone={assetStatusTone(asset.status)} label={assetStatusLabel(asset.status)} />
                </li>
              ))}
            </ul>
          )}
        </PageSection>

        <PageSection
          title="Mantenimiento atrasado"
          description="Órdenes abiertas cuya fecha límite ya pasó."
          boxed
        >
          {!canManage ? (
            <p className="text-sm text-ink-2">Solo quien gestiona el inventario ve las órdenes de mantenimiento.</p>
          ) : mantenimiento.isLoading ? (
            <SkeletonRows rows={3} />
          ) : mantenimiento.isError ? (
            <ErrorState
              title="No fue posible cargar el mantenimiento"
              detail={getApiErrorMessage(mantenimiento.error, "Reintenta la consulta para continuar.")}
              onRetry={() => void mantenimiento.refetch()}
            />
          ) : ordenesVencidas.length === 0 ? (
            <EmptyState
              reason="no-records"
              title="Nada atrasado"
              description={
                ordenesAbiertas.length > 0
                  ? `${ordenesAbiertas.length} ${ordenesAbiertas.length === 1 ? "orden abierta" : "órdenes abiertas"}, todas dentro de plazo.`
                  : "No hay órdenes de mantenimiento abiertas."
              }
              action={
                <Button asChild variant="outline">
                  <Link href="/inventory/assets/maintenance">Ver mantenimiento</Link>
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-line">
              {ordenesVencidas.slice(0, RECIENTES).map((orden) => (
                <li key={orden.id} className="flex min-w-0 items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="line-clamp-2 break-words font-medium text-ink-1">{orden.title}</p>
                    <p className="truncate text-sm text-ink-2">
                      {orden.asset.item.name} · <span className="font-mono text-2xs text-ink-3">{orden.asset.assetTag}</span>
                    </p>
                    <p className="font-mono text-2xs text-ink-3 tabular-figures">Vencía {formatDateTime(orden.dueAt)}</p>
                  </div>
                  <StatusBadge size="sm" tone="danger" label="Atrasada" />
                </li>
              ))}
            </ul>
          )}
        </PageSection>
      </div>

      <p className="text-sm text-ink-2">
        <Link href="/inventory/assets" className="inline-flex min-h-[var(--control-h-base)] items-center gap-1 font-medium text-ink-1 hover:underline">
          <Boxes className="size-4" aria-hidden="true" />
          Abrir el listado completo de activos
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </p>
    </div>
  );
}

function siguienteAccion({
  resumen,
  ordenesVencidas,
  canManage,
}: {
  resumen?: Awaited<ReturnType<typeof fetchInventoryAnalytics>>;
  ordenesVencidas: number;
  canManage: boolean;
}) {
  if (!resumen) return null;
  if (resumen.stock.belowMinimum > 0 && canManage) {
    return {
      label: "Lo más urgente",
      title: "Reponer las existencias bajo mínimo",
      detail: `${resumen.stock.belowMinimum} ${resumen.stock.belowMinimum === 1 ? "referencia está" : "referencias están"} por debajo del mínimo definido.`,
      tone: "danger" as const,
      href: "/inventory/assets/warehouse",
      actionLabel: "Ver almacén",
    };
  }
  if (ordenesVencidas > 0) {
    return {
      label: "Lo más urgente",
      title: "Resolver el mantenimiento atrasado",
      detail: `${ordenesVencidas} ${ordenesVencidas === 1 ? "orden pasó" : "órdenes pasaron"} su fecha límite.`,
      tone: "warning" as const,
      href: "/inventory/assets/maintenance",
      actionLabel: "Ver mantenimiento",
    };
  }
  if (resumen.assets.returnPending > 0) {
    return {
      label: "Lo siguiente",
      title: "Recibir y validar las devoluciones",
      detail: `${resumen.assets.returnPending} ${resumen.assets.returnPending === 1 ? "activo espera" : "activos esperan"} a que alguien los reciba.`,
      tone: "warning" as const,
      href: "/inventory/returns",
      actionLabel: "Ver devoluciones",
    };
  }
  return {
    label: "Todo al día",
    title: "No hay pendientes en el inventario",
    detail: `${resumen.assets.total} ${resumen.assets.total === 1 ? "activo registrado" : "activos registrados"} en la sucursal.`,
    tone: "progress" as const,
    href: "/inventory/assets",
    actionLabel: "Ver activos",
  };
}

function QuickAction({ href, icon, title, detail }: { href: string; icon: React.ReactNode; title: string; detail: string }) {
  return (
    <li className="min-w-0">
      <Link
        href={href}
        className="group flex h-full min-w-0 items-start gap-3 rounded-lg border border-line bg-surface-1 p-4 transition-colors hover:border-line-strong hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 text-ink-2">
          {icon}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-ink-1">{title}</span>
          <span className="mt-0.5 block text-sm text-ink-2">{detail}</span>
        </span>
      </Link>
    </li>
  );
}
