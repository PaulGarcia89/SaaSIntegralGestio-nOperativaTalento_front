"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRightLeft,
  ClipboardList,
  Download,
  PackagePlus,
  RefreshCw,
  Trash2,
  Truck,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  ActiveContext,
  EmptyState,
  ErrorState,
  InlineNote,
  NextAction,
  PageSection,
  SkeletonRows,
  StatusBadge,
  StatusTile,
  StatusTileRow,
} from "@/components/system";
import { BarChart, ChartCard, ChartSkeleton } from "@/components/chart";
import { Button } from "@/components/ui/button";
import {
  fetchRestaurantAdvancedDashboard,
  fetchRestaurantDashboard,
  fetchRestaurantStock,
  getApiErrorMessage,
} from "@/lib/backend";
import type { PermissionKey } from "@/lib/contracts";
import { useAppStore } from "@/store/app-store";
import { useRestaurantInventoryContext } from "@/components/restaurant-inventory-context";

/* ==========================================================================
   PANEL DEL INVENTARIO DE RESTAURANTE
   ==========================================================================
   Antes, la primera pantalla del módulo apilaba TRES cabeceras —la del
   armazón, «¿Qué necesitas hacer?» y «Dashboard orientado a decisiones»—,
   dos acciones recomendadas distintas, ocho cifras, cuatro tarjetas de
   acción, dos listas y dos gráficos dibujados a mano con `div`. Y dos
   peticiones al servidor que contaban cosas parecidas.

   Queda una sola lectura, en el orden en que se pregunta:

     ¿dónde estoy?    sucursal y almacén activos
     ¿qué hago ahora?  una acción, la más urgente
     ¿cómo va?         cuatro cifras
     ¿qué me falta?    faltantes y vencimientos, con su unidad
     ¿qué opero?       las cinco operaciones del día
     ¿y la tendencia?  consumo del periodo

   Producto, cantidad, unidad y ubicación van SIEMPRE juntos: la unidad sale
   de `/restaurant-inventory/stock`, que es la única fuente que la entrega, y
   la ubicación es el almacén activo, escrito arriba.
   ========================================================================== */

type Operacion = {
  key: string;
  label: string;
  detail: string;
  href: string;
  icon: ReactNode;
  permissions: PermissionKey[];
};

const OPERACIONES: Operacion[] = [
  {
    key: "receipts",
    label: "Recibir productos",
    detail: "Registra una entrada de mercancía.",
    href: "/inventory/restaurant/receipts",
    icon: <Truck className="size-5" aria-hidden="true" />,
    permissions: ["restaurant_inventory.manage", "restaurant_inventory.receipts.create"],
  },
  {
    key: "consumption",
    label: "Registrar salida",
    detail: "Descuenta consumo o producción.",
    href: "/inventory/restaurant/consumption",
    icon: <PackagePlus className="size-5" aria-hidden="true" />,
    permissions: ["restaurant_inventory.manage", "restaurant_inventory.operations.create"],
  },
  {
    key: "waste",
    label: "Registrar merma",
    detail: "Producto perdido o dañado.",
    href: "/inventory/restaurant/waste",
    icon: <Trash2 className="size-5" aria-hidden="true" />,
    permissions: ["restaurant_inventory.manage", "restaurant_inventory.operations.create"],
  },
  {
    key: "transfers",
    label: "Transferir productos",
    detail: "Mueve existencias entre almacenes.",
    href: "/inventory/restaurant/transfers",
    icon: <ArrowRightLeft className="size-5" aria-hidden="true" />,
    permissions: ["restaurant_inventory.manage", "restaurant_inventory.transfers.manage"],
  },
  {
    key: "stock-counts",
    label: "Realizar conteo",
    detail: "Compara existencia física y teórica.",
    href: "/inventory/restaurant/stock-counts",
    icon: <ClipboardList className="size-5" aria-hidden="true" />,
    permissions: ["restaurant_inventory.manage", "restaurant_inventory.counts.approve"],
  },
];

/** Cuántas filas de alerta caben antes de que la lista deje de leerse. */
const MAX_ALERTAS = 5;

export function RestaurantModulePanel() {
  const { currentBranch, can, canAny } = useAppStore();
  const { warehouseId, warehouseName } = useRestaurantInventoryContext();

  // Ver dinero es una decisión de permiso, no de diseño. Sin
  // `commercial.view` el panel no enseña el valor del inventario.
  const puedeVerValor = can("restaurant_inventory.commercial.view");

  const avanzado = useQuery({
    queryKey: ["restaurant-decision-dashboard", currentBranch?.id, warehouseId],
    queryFn: () => fetchRestaurantAdvancedDashboard({ branchId: currentBranch?.id ?? "", warehouseId: warehouseId ?? "" }),
    enabled: Boolean(currentBranch?.id),
  });

  // Solo por las entradas en borrador: es lo único que el panel necesita y el
  // dashboard avanzado no entrega.
  const basico = useQuery({
    queryKey: ["restaurant-operational-home", currentBranch?.id, warehouseId],
    queryFn: () => fetchRestaurantDashboard({ branchId: currentBranch?.id, warehouseId }),
    enabled: Boolean(currentBranch?.id && warehouseId),
  });

  // Misma clave que usa la pantalla «Existencias»: al navegar allí no se
  // vuelve a pedir. Es la ÚNICA fuente que trae la unidad de medida.
  const existencias = useQuery({
    queryKey: ["restaurant-stock", currentBranch?.id, warehouseId],
    queryFn: () => fetchRestaurantStock({ branchId: currentBranch?.id, warehouseId }),
    enabled: Boolean(currentBranch?.id),
  });

  const datos = avanzado.data;
  // Un punto por día: si el servidor aún manda un punto por movimiento (misma
  // fecha repetida), aquí se suman. Sin esto, diez salidas del mismo día eran
  // diez barras superpuestas con cifras encima unas de otras.
  const tendencia = agruparPorDia(datos?.consumptionTrend ?? []);
  const entradasBorrador = basico.data?.recentReceipts.filter((item) => item.status === "DRAFT").length;

  const bajoMinimo = (existencias.data ?? [])
    .filter((item) => item.stock < item.minimumStock)
    .sort((izq, der) => izq.stock / Math.max(1, izq.minimumStock) - der.stock / Math.max(1, der.minimumStock));

  const vencimientos = datos?.upcomingExpirations ?? [];
  const operaciones = OPERACIONES.filter((operacion) => canAny(operacion.permissions));

  /** `undefined` mientras carga · `null` si el servidor no lo entrega. */
  const cifra = (valor: number | undefined, consulta: { isError: boolean; isLoading: boolean }) =>
    consulta.isError ? null : consulta.isLoading ? undefined : (valor ?? null);

  if (avanzado.isLoading && existencias.isLoading) {
    return <SkeletonRows rows={5} label="Cargando el estado del inventario" />;
  }

  if (avanzado.isError && existencias.isError) {
    return (
      <ErrorState
        title="No fue posible cargar el estado del inventario"
        detail={getApiErrorMessage(avanzado.error, "Reintenta la consulta para continuar.")}
        onRetry={() => {
          void avanzado.refetch();
          void existencias.refetch();
        }}
      />
    );
  }

  // Una sola acción recomendada, elegida por urgencia real: lo que falta para
  // cocinar hoy pesa más que lo que vence esta semana, y ambas por encima de
  // un documento que espera confirmación.
  const recomendada = bajoMinimo.length
    ? {
        title: `Reponer ${bajoMinimo.length} producto${bajoMinimo.length === 1 ? "" : "s"} bajo mínimo`,
        detail: `Empieza por ${bajoMinimo[0].name}: ${bajoMinimo[0].stock} ${bajoMinimo[0].inventoryUnit} frente a un mínimo de ${bajoMinimo[0].minimumStock}.`,
        href: "/inventory/restaurant/purchase-suggestions",
        actionLabel: "Ver sugerencias de compra",
        tone: "danger" as const,
      }
    : vencimientos.length
      ? {
          title: `${vencimientos.length} lote${vencimientos.length === 1 ? "" : "s"} próximo${vencimientos.length === 1 ? "" : "s"} a vencer`,
          detail: `El primero es ${vencimientos[0].name}, lote ${vencimientos[0].lot}, el ${fechaCorta(vencimientos[0].expiresAt)}.`,
          href: "/inventory/restaurant/lots?filter=7",
          actionLabel: "Revisar lotes",
          tone: "warning" as const,
        }
      : entradasBorrador
        ? {
            title: `${entradasBorrador} entrada${entradasBorrador === 1 ? "" : "s"} esperando confirmación`,
            detail: "La mercancía no suma al inventario hasta que la entrada se confirma.",
            href: "/inventory/restaurant/receipts?status=DRAFT",
            actionLabel: "Revisar entradas",
            tone: "progress" as const,
          }
        : null;

  return (
    <div className="space-y-6">
      <ActiveContext extra={`Almacén: ${warehouseName}`} />

      {/* ---- 1. Qué hago ahora ------------------------------------------ */}
      {recomendada ? (
        <NextAction
          label="Empieza por aquí"
          title={recomendada.title}
          detail={recomendada.detail}
          href={recomendada.href}
          actionLabel={recomendada.actionLabel}
          tone={recomendada.tone}
        />
      ) : (
        <EmptyState
          reason="no-records"
          title="No hay nada urgente en este almacén"
          description="Sin faltantes, sin lotes por vencer y sin entradas esperando confirmación. Puedes seguir con la operación del día."
        />
      )}

      {/* ---- 2. Cómo va el inventario ----------------------------------- */}
      <StatusTileRow label="Estado del inventario">
        <li className="min-w-0">
          <StatusTile
            title="Bajo mínimo"
            value={cifra(existencias.data ? bajoMinimo.length : undefined, existencias)}
            context="Productos por debajo de su existencia mínima."
            status={bajoMinimo.length > 0 ? { label: "Reponer", tone: "danger" as const } : undefined}
            href="/inventory/restaurant/stock?filter=LOW"
            actionLabel="Ver faltantes"
            scope={warehouseName}
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title="Próximos a vencer"
            value={cifra(datos ? vencimientos.length : undefined, avanzado)}
            context="Lotes que caducan en los próximos días."
            status={vencimientos.length > 0 ? { label: "Revisar", tone: "warning" as const } : undefined}
            href="/inventory/restaurant/lots?filter=7"
            actionLabel="Ver lotes"
            scope={warehouseName}
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title="Entradas por confirmar"
            value={cifra(entradasBorrador, basico)}
            context="No suman al inventario hasta confirmarse."
            href="/inventory/restaurant/receipts?status=DRAFT"
            actionLabel="Revisar entradas"
            scope={warehouseName}
          />
        </li>
        {puedeVerValor ? (
          <li className="min-w-0">
            <StatusTile
              title="Valor del inventario"
              value={datos ? formatoMoneda(datos.inventoryValue) : cifra(undefined, avanzado)}
              context="Valorado al costo promedio del almacén activo."
              href="/inventory/restaurant/costs"
              actionLabel="Ver costos"
              scope={warehouseName}
            />
          </li>
        ) : (
          <li className="min-w-0">
            <StatusTile
              title="Diferencia de conteo"
              value={datos ? formatoNumero(datos.inventoryDifference) : cifra(undefined, avanzado)}
              context="Diferencia entre existencia teórica y contada."
              href="/inventory/restaurant/variance"
              actionLabel="Ver diferencias"
              scope={warehouseName}
            />
          </li>
        )}
      </StatusTileRow>

      {/* ---- 3. Qué falta y qué vence ------------------------------------
          Producto, cantidad, unidad y ubicación, siempre juntos. */}
      {bajoMinimo.length > 0 ? (
        <PageSection
          title="Productos bajo mínimo"
          description={`En ${warehouseName}. Ordenados por lo lejos que están de su mínimo.`}
          id="bajo-minimo"
          actions={
            <Button asChild variant="secondary" size="sm">
              <Link href="/inventory/restaurant/stock?filter=LOW">Ver todos</Link>
            </Button>
          }
        >
          <ul className="space-y-1">
            {bajoMinimo.slice(0, MAX_ALERTAS).map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border border-line bg-surface-1 px-4 py-3"
              >
                <span className="min-w-0 flex-1 basis-40">
                  <span className="block break-words text-sm font-medium text-ink-1">{item.name}</span>
                  <span className="block truncate text-xs text-ink-3">{warehouseName}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-mono text-sm font-semibold tabular-figures text-ink-1">
                    {item.stock} {item.inventoryUnit}
                  </span>
                  <span className="block font-mono text-2xs text-ink-3 tabular-figures">
                    mínimo {item.minimumStock} {item.inventoryUnit}
                  </span>
                </span>
                <StatusBadge size="sm" tone="danger" label="Bajo mínimo" />
              </li>
            ))}
          </ul>
        </PageSection>
      ) : null}

      {vencimientos.length > 0 ? (
        <PageSection
          title="Lotes próximos a vencer"
          description="Registra la merma o dales salida antes de perder el producto."
          id="vencimientos"
          actions={
            <Button asChild variant="secondary" size="sm">
              <Link href="/inventory/restaurant/lots?filter=7">Ver todos</Link>
            </Button>
          }
        >
          <ul className="space-y-1">
            {vencimientos.slice(0, MAX_ALERTAS).map((lote) => (
              <li
                key={`${lote.name}-${lote.lot}`}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border border-line bg-surface-1 px-4 py-3"
              >
                <span className="min-w-0 flex-1 basis-40">
                  <span className="block break-words text-sm font-medium text-ink-1">{lote.name}</span>
                  <span className="block truncate font-mono text-xs text-ink-3">Lote {lote.lot}</span>
                </span>
                <span className="shrink-0 font-mono text-sm tabular-figures text-ink-1">{lote.quantity}</span>
                <StatusBadge size="sm" tone="warning" label={`Vence ${fechaCorta(lote.expiresAt)}`} />
              </li>
            ))}
          </ul>
        </PageSection>
      ) : null}

      {/* ---- 4. Las operaciones del día --------------------------------- */}
      {operaciones.length > 0 ? (
        <PageSection title="Operaciones del día" id="operaciones">
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {operaciones.map((operacion) => (
              <li key={operacion.key} className="min-w-0">
                <Link
                  href={operacion.href}
                  className="group flex h-full min-w-0 items-start gap-3 rounded-lg border border-line bg-surface-1 p-4 transition-colors hover:border-line-strong hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 text-ink-2">
                    {operacion.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink-1">{operacion.label}</span>
                    <span className="mt-0.5 block text-sm text-ink-2">{operacion.detail}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </PageSection>
      ) : null}

      {/* ---- 5. Tendencia ------------------------------------------------
          Barras y no líneas: `consumptionTrend` compara periodos cerrados,
          que son categorías, no una serie continua. */}
      <ChartCard
        title="Consumo por periodo"
        subtitle="Cuánto se consumió en cada periodo cerrado, para ver si el gasto se mueve."
        period={warehouseName}
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void avanzado.refetch()}
              disabled={avanzado.isFetching}
            >
              <RefreshCw
                className={`size-4 ${avanzado.isFetching ? "animate-spin motion-reduce:animate-none" : ""}`}
                aria-hidden="true"
              />
              {avanzado.isFetching ? "Actualizando…" : "Actualizar"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                exportarCsv("inventario-restaurante.csv", [
                  ["Indicador", "Valor"],
                  ["Valor del inventario", datos?.inventoryValue ?? ""],
                  ["Consumo del periodo", datos?.periodConsumption ?? ""],
                  ["Merma", datos?.waste ?? ""],
                  ["Diferencia de conteo", datos?.inventoryDifference ?? ""],
                ])
              }
              disabled={!datos}
            >
              <Download className="size-4" aria-hidden="true" />
              CSV
            </Button>
          </div>
        }
      >
        {avanzado.isLoading ? (
          <ChartSkeleton label="Cargando el consumo del periodo" />
        ) : avanzado.isError ? (
          <InlineNote tone="warning" title="No fue posible cargar la tendencia">
            El resto del panel sigue siendo válido. Vuelve a cargar para reintentarlo.
          </InlineNote>
        ) : (
          <BarChart
            categories={tendencia.map((punto) => punto.label)}
            series={[
              {
                id: "consumo",
                name: "Consumo",
                values: tendencia.map((punto) => punto.value),
              },
            ]}
            categoryLabel="Periodo"
            caption="Consumo registrado en cada periodo cerrado del almacén activo."
            formatValue={formatoMoneda}
            emptyReason="sin-registros"
          />
        )}
      </ChartCard>
    </div>
  );
}

/* ============================== Auxiliares ============================== */

function agruparPorDia(puntos: Array<{ label: string; value: number }>) {
  const porDia = new Map<string, number>();
  for (const punto of puntos) porDia.set(punto.label, (porDia.get(punto.label) ?? 0) + punto.value);
  return [...porDia.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([label, value]) => ({ label: fechaCorta(label), value }));
}

/** «2026-09-01T05:22:36.580Z» → «1 sept 2026». Si no es fecha, se deja tal cual. */
function fechaCorta(valor: string) {
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;
  return new Intl.DateTimeFormat("es", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(fecha);
}

function formatoMoneda(valor: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(valor);
}

function formatoNumero(valor: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(valor);
}

function exportarCsv(nombre: string, filas: unknown[][]) {
  const csv = filas
    .map((fila) => fila.map((valor) => `"${String(valor ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = nombre;
  anchor.click();
  URL.revokeObjectURL(url);
}
