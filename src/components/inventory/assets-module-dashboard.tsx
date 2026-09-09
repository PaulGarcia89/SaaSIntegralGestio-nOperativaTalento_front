"use client";

import { useUiText } from "@/components/ui-copy";

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
import { BarChart, ChartCard, ChartSkeleton } from "@/components/chart";
import { URGENCY_COLOR_CLASS } from "@/components/dashboard/operational-widgets";

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
  const uiText = useUiText();
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

  /*
   * Reparto de activos por estado.
   *
   * El servidor cuenta `total` sobre TODOS los estados con un `groupBy`, pero
   * solo desglosa cuatro. Lo que sobra —retirados, perdidos, reservados— no
   * aparecía en ninguna tarjeta y nadie lo notaba. Aquí se calcula el resto y
   * se dibuja solo si existe: una barra «Otros» de cero sería ruido, pero
   * ocultar veinte activos que no están en ninguna parte es peor.
   */
  const desglosado = resumen
    ? resumen.assets.available + resumen.assets.assigned + resumen.assets.maintenance + resumen.assets.returnPending
    : 0;
  const otrosEstados = resumen ? Math.max(0, resumen.assets.total - desglosado) : 0;
  const repartoActivos = resumen
    ? [
        { id: "AVAILABLE", label: uiText("Disponibles"), value: resumen.assets.available, color: "text-series-2", href: "/inventory/assets?status=AVAILABLE" },
        { id: "ASSIGNED", label: uiText("En custodia"), value: resumen.assets.assigned, color: "text-series-2/50", href: "/inventory/assets?status=ASSIGNED" },
        { id: "RETURN_PENDING", label: uiText("Devolución pendiente"), value: resumen.assets.returnPending, color: URGENCY_COLOR_CLASS.warning, href: "/inventory/assets?status=RETURN_PENDING" },
        { id: "MAINTENANCE", label: uiText("En mantenimiento"), value: resumen.assets.maintenance, color: URGENCY_COLOR_CLASS.danger, href: "/inventory/assets?status=MAINTENANCE" },
        ...(otrosEstados > 0
          ? [{ id: "OTHER", label: uiText("Otros estados"), value: otrosEstados, color: URGENCY_COLOR_CLASS.neutral, href: "/inventory/assets" }]
          : []),
      ]
    : [];
  const hayReparto = repartoActivos.some((fila) => fila.value > 0);

  /*
   * Estado del almacén.
   *
   * `belowMinimum` (qty < mínimo) y `reorder` (qty <= punto de pedido) se
   * calculan con DOS umbrales distintos sobre la misma referencia, así que no
   * son conjuntos excluyentes y NO se pueden apilar como si repartieran el
   * total. Van como dos medidas contra el mismo denominador, y el denominador
   * se dice en el subtítulo.
   */
  const almacen = resumen
    ? [
        { id: "below", label: uiText("Bajo mínimo"), value: resumen.stock.belowMinimum, color: URGENCY_COLOR_CLASS.danger },
        { id: "reorder", label: uiText("En punto de pedido"), value: resumen.stock.reorder, color: URGENCY_COLOR_CLASS.warning },
      ]
    : [];
  const hayAlmacen = almacen.some((fila) => fila.value > 0);
  const alcance = currentBranch ? currentBranch.name : uiText("Todas las sucursales");

  const cambiosRecientes = [...(recientes.data ?? [])]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, RECIENTES);

  const ordenesAbiertas = (mantenimiento.data ?? []).filter((orden) => orden.status.toUpperCase() !== "RESOLVED");
  const hoy = new Date().toISOString();
  const ordenesVencidas = ordenesAbiertas.filter((orden) => orden.dueAt && orden.dueAt < hoy);

  const accion = siguienteAccion({ resumen, ordenesVencidas: ordenesVencidas.length, canManage, uiText });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={uiText("Operaciones")}
        title={uiText("Dashboard de inventario de activos")}
        description={uiText("Cómo está el inventario de la sucursal, qué necesita atención y por dónde seguir.")}
        actions={
          canManage ? (
            <Button asChild>
              <Link href="/inventory/assets">
                <Plus className="size-4" aria-hidden="true" />
                {uiText("Registrar activo")}</Link>
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
        <InlineNote tone="danger" title={uiText("No fue posible cargar las cifras del inventario")}>
          {getApiErrorMessage(analytics.error, uiText("Reintenta la consulta para continuar."))}
        </InlineNote>
      ) : null}

      {/* Cifras que NO están en los gráficos de abajo: el total, lo que pide
          acción y lo que hay en curso con proveedores. «Disponibles» y «En
          custodia» eran tarjetas y ahora son barras del reparto, que dice lo
          mismo y además enseña la proporción. */}
      <StatusTileRow label={uiText("Estado del inventario de activos")} className="xl:grid-cols-3">
        <li className="min-w-0">
          <StatusTile
            title={uiText("Activos registrados")}
            value={cifra(resumen?.assets.total)}
            context={uiText("Todos los equipos de la sucursal, en cualquier estado.")}
            scope={alcance}
            href="/inventory/assets"
            actionLabel={uiText("Ver activos")}
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title={uiText("Requieren atención")}
            value={cifra(porAtender)}
            context={uiText("Devoluciones pendientes y equipos en mantenimiento.")}
            status={
              typeof porAtender === "number" && porAtender > 0
                ? { label: uiText("Hay pendientes"), tone: "warning" as const }
                : undefined
            }
            scope={alcance}
            href="/inventory/assets?status=RETURN_PENDING"
            actionLabel={uiText("Ver devoluciones")}
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title={uiText("Compras en curso")}
            // Venía en la misma respuesta y no se enseñaba en ninguna parte,
            // aunque el módulo tiene su pantalla de compras.
            value={cifra(resumen?.operations.purchaseOrdersInProgress)}
            context={uiText("Órdenes de compra abiertas con proveedores.")}
            scope={alcance}
            href="/inventory/purchases"
            actionLabel={uiText("Ver compras")}
          />
        </li>
      </StatusTileRow>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title={uiText("Dónde están los activos")}
          subtitle={uiText("Cada estado abre el listado ya filtrado")}
          period={alcance}
        >
          {analytics.isLoading ? (
            <ChartSkeleton label={uiText("Estado del inventario de activos")} />
          ) : !hayReparto ? (
            <BarChart categories={[]} series={[]} emptyReason="sin-registros" />
          ) : (
            <>
              <BarChart
                orientation="horizontal"
                categories={repartoActivos.map((fila) => fila.label)}
                series={[
                  { id: "estado", name: uiText("Activos"), values: repartoActivos.map((fila) => fila.value) },
                ]}
                categoryColorClasses={repartoActivos.map((fila) => fila.color)}
                caption={uiText("Activos agrupados por su estado")}
                categoryLabel={uiText("Estado")}
                formatValue={(valor) => String(valor)}
              />
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {repartoActivos.map((fila) => (
                  <li key={fila.id}>
                    <Link
                      href={fila.href}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface-1 px-3 text-sm text-ink-2 transition-colors hover:border-line-strong hover:text-ink-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                    >
                      <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-sm bg-current ${fila.color}`} />
                      <span className="truncate">{fila.label}</span>
                      <span className="font-mono text-2xs tabular-figures text-ink-3">{fila.value}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </ChartCard>

        <ChartCard
          title={uiText("Qué falta en el almacén")}
          subtitle={
            resumen
              ? uiText("Sobre {{n}} referencias. Bajo mínimo y punto de pedido se miden con umbrales distintos, así que se solapan", { n: resumen.stock.references })
              : uiText("Referencias por debajo de sus umbrales")
          }
          period={alcance}
        >
          {analytics.isLoading ? (
            <ChartSkeleton label={uiText("Qué falta en el almacén")} />
          ) : !hayAlmacen ? (
            <EmptyState
              reason="no-records"
              title={uiText("Nada por reponer")}
              description={uiText("Ninguna referencia está por debajo de su mínimo ni ha llegado a su punto de pedido.")}
              action={
                <Button asChild variant="outline">
                  <Link href="/inventory/warehouse">{uiText("Ver almacén")}</Link>
                </Button>
              }
            />
          ) : (
            <>
              <BarChart
                orientation="horizontal"
                categories={almacen.map((fila) => fila.label)}
                series={[
                  { id: "almacen", name: uiText("Referencias"), values: almacen.map((fila) => fila.value) },
                ]}
                categoryColorClasses={almacen.map((fila) => fila.color)}
                caption={uiText("Referencias por debajo de sus umbrales de reposición")}
                categoryLabel={uiText("Umbral")}
                formatValue={(valor) => String(valor)}
              />
              <p className="mt-4 border-t border-line pt-3 text-2xs leading-5 text-ink-3">
                {uiText("«Bajo mínimo» es lo que ya está en falta. «En punto de pedido» es lo que todavía se puede reponer a tiempo, e incluye lo anterior cuando el punto de pedido está por encima del mínimo.")}
              </p>
            </>
          )}
        </ChartCard>
      </div>

      <PageSection title={uiText("Operaciones")} description={uiText("Las cuatro tareas del día, con icono y texto.")}>
        <ul className="grid gap-3 [&>li]:min-w-0 sm:grid-cols-2 xl:grid-cols-4">
          <QuickAction
            href="/inventory/deliveries"
            icon={<ArrowRightLeft className="size-5" aria-hidden="true" />}
            title={uiText("Entregar equipo")}
            detail={uiText("Reservas esperando confirmación de entrega.")}
          />
          <QuickAction
            href="/inventory/returns"
            icon={<RotateCcw className="size-5" aria-hidden="true" />}
            title={uiText("Recibir devolución")}
            detail={
              resumen
                ? uiText("{{n}} devoluciones pendientes.", { n: resumen.assets.returnPending })
                : uiText("Equipos que vuelven y hay que validar.")
            }
          />
          <QuickAction
            href="/inventory/maintenance"
            icon={<Wrench className="size-5" aria-hidden="true" />}
            title={uiText("Mantenimiento")}
            detail={
              resumen
                ? uiText("{{n}} órdenes abiertas.", { n: resumen.operations.openMaintenance })
                : uiText("Órdenes de mantenimiento.")
            }
          />
          <QuickAction
            href="/inventory/scan"
            icon={<QrCode className="size-5" aria-hidden="true" />}
            title={uiText("Escanear activo")}
            detail={uiText("Abre la ficha leyendo su etiqueta.")}
          />
        </ul>
      </PageSection>

      <div className="grid gap-6 xl:grid-cols-2 [&>*]:min-w-0">
        <PageSection
          title={uiText("Cambió hace poco")}
          description={uiText("Los últimos activos que cambiaron de estado o de custodia en esta sucursal.")}
          boxed
        >
          {recientes.isLoading ? (
            <SkeletonRows rows={4} />
          ) : recientes.isError ? (
            <ErrorState
              title={uiText("No fue posible cargar los activos")}
              detail={getApiErrorMessage(recientes.error, uiText("Reintenta la consulta para continuar."))}
              onRetry={() => void recientes.refetch()}
            />
          ) : cambiosRecientes.length === 0 ? (
            <EmptyState
              reason="no-records"
              title={uiText("Todavía no hay activos en esta sucursal")}
              description={uiText("Registra el primero desde el listado de activos.")}
              action={
                canManage ? (
                  <Button asChild variant="outline">
                    <Link href="/inventory/assets">{uiText("Ir al listado")}</Link>
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
                      {asset.employee ? ` · ${asset.employee.name}` : ` · ${uiText("Sin asignar")}`}
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
          title={uiText("Mantenimiento atrasado")}
          description={uiText("Órdenes abiertas cuya fecha límite ya pasó.")}
          boxed
        >
          {!canManage ? (
            <p className="text-sm text-ink-2">{uiText("Solo quien gestiona el inventario ve las órdenes de mantenimiento.")}</p>
          ) : mantenimiento.isLoading ? (
            <SkeletonRows rows={3} />
          ) : mantenimiento.isError ? (
            <ErrorState
              title={uiText("No fue posible cargar el mantenimiento")}
              detail={getApiErrorMessage(mantenimiento.error, uiText("Reintenta la consulta para continuar."))}
              onRetry={() => void mantenimiento.refetch()}
            />
          ) : ordenesVencidas.length === 0 ? (
            <EmptyState
              reason="no-records"
              title={uiText("Nada atrasado")}
              description={
                ordenesAbiertas.length > 0
                  ? uiText("{{n}} órdenes abiertas, todas dentro de plazo.", { n: ordenesAbiertas.length })
                  : uiText("No hay órdenes de mantenimiento abiertas.")
              }
              action={
                <Button asChild variant="outline">
                  <Link href="/inventory/maintenance">{uiText("Ver mantenimiento")}</Link>
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
                    <p className="font-mono text-2xs text-ink-3 tabular-figures">{uiText("Vencía ")}{formatDateTime(orden.dueAt)}</p>
                  </div>
                  <StatusBadge size="sm" tone="danger" label={uiText("Atrasada")} />
                </li>
              ))}
            </ul>
          )}
        </PageSection>
      </div>

      <p className="text-sm text-ink-2">
        <Link href="/inventory/assets" className="inline-flex min-h-[var(--control-h-base)] items-center gap-1 font-medium text-ink-1 hover:underline">
          <Boxes className="size-4" aria-hidden="true" />
          {uiText("Abrir el listado completo de activos")}<ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </p>
    </div>
  );
}

/**
 * La acción recomendada.
 *
 * Devolvía sus rótulos, títulos, detalles y hasta el texto del botón como
 * literales en español, así que el elemento más prominente de la pantalla se
 * quedaba sin traducir de principio a fin. Ahora recibe el traductor y no
 * escribe ni una palabra por su cuenta.
 */
function siguienteAccion({
  resumen,
  ordenesVencidas,
  canManage,
  uiText,
}: {
  resumen?: Awaited<ReturnType<typeof fetchInventoryAnalytics>>;
  ordenesVencidas: number;
  canManage: boolean;
  uiText: (source: string, params?: Record<string, string | number>) => string;
}) {
  if (!resumen) return null;
  if (resumen.stock.belowMinimum > 0 && canManage) {
    return {
      label: uiText("Lo más urgente"),
      title: uiText("Reponer las existencias bajo mínimo"),
      detail: uiText("{{n}} referencias están por debajo del mínimo definido.", { n: resumen.stock.belowMinimum }),
      tone: "danger" as const,
      href: "/inventory/warehouse",
      actionLabel: uiText("Ver almacén"),
    };
  }
  if (ordenesVencidas > 0) {
    return {
      label: uiText("Lo más urgente"),
      title: uiText("Resolver el mantenimiento atrasado"),
      detail: uiText("{{n}} órdenes pasaron su fecha límite.", { n: ordenesVencidas }),
      tone: "warning" as const,
      href: "/inventory/maintenance",
      actionLabel: uiText("Ver mantenimiento"),
    };
  }
  if (resumen.assets.returnPending > 0) {
    return {
      label: uiText("Lo siguiente"),
      title: uiText("Recibir y validar las devoluciones"),
      detail: uiText("{{n}} activos esperan a que alguien los reciba.", { n: resumen.assets.returnPending }),
      tone: "warning" as const,
      href: "/inventory/returns",
      actionLabel: uiText("Ver devoluciones"),
    };
  }
  return {
    label: uiText("Todo al día"),
    title: uiText("No hay pendientes en el inventario"),
    detail: uiText("{{n}} activos registrados en la sucursal.", { n: resumen.assets.total }),
    tone: "progress" as const,
    href: "/inventory/assets",
    actionLabel: uiText("Ver activos"),
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
