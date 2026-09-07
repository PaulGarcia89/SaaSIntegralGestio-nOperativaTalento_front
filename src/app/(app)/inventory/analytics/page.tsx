"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { fetchInventoryAnalytics, getApiErrorMessage } from "@/lib/backend";
import { useAppStore } from "@/store/app-store";
import {
  ErrorState,
  Metric,
  MetricRow,
  PageHeader,
  SkeletonRows,
} from "@/components/system";

/**
 * Indicadores del inventario de activos.
 *
 * Qué cambió
 * ----------
 * · Los dos `return` tempranos de carga y de error BORRABAN el encabezado: la
 *   persona perdía el título de la pantalla mientras esperaba, y al llegar los
 *   datos la maqueta saltaba. Ahora el encabezado se queda y solo cambia el
 *   cuerpo.
 * · Seis cifras y ninguna salida: «Reposición requerida: 7» no llevaba a
 *   ningún sitio. Ahora cada cifra que exige actuar enlaza con la pantalla
 *   donde se actúa.
 * · Las cifras que piden atención se distinguen de las que solo informan.
 */
export default function InventoryAnalyticsPage() {
  const { currentBranch } = useAppStore();
  const data = useQuery({
    queryKey: ["inventory-analytics", currentBranch?.id],
    queryFn: () => fetchInventoryAnalytics(currentBranch?.id),
  });

  const d = data.data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analítica operativa"
        title="Inventario en contexto"
        description="Disponibilidad, reposición y mantenimiento de la sucursal activa."
        meta={<span>{currentBranch?.name ?? "Sin sucursal"}</span>}
      />

      {data.isLoading ? (
        <SkeletonRows rows={3} label="Calculando los indicadores del inventario" />
      ) : data.isError || !d ? (
        <ErrorState
          title="No fue posible calcular la analítica"
          detail={getApiErrorMessage(data.error, "Reintenta la consulta para continuar.")}
          onRetry={() => void data.refetch()}
        />
      ) : (
        <>
          <MetricRow>
            <Metric label="Activos totales" value={String(d.assets.total)} />
            <Metric
              label="En custodia"
              value={String(d.assets.assigned)}
              detail={
                <Link className="underline underline-offset-2" href="/inventory/assets">
                  Ver el listado
                </Link>
              }
            />
            <Metric
              label="Reposición requerida"
              value={String(d.stock.reorder)}
              tone={d.stock.reorder > 0 ? "warning" : undefined}
              detail={
                d.stock.reorder > 0 ? (
                  <Link className="underline underline-offset-2" href="/inventory/warehouse">
                    Revisar el almacén
                  </Link>
                ) : (
                  "nada por reponer"
                )
              }
            />
            <Metric
              label="Bajo mínimo"
              value={String(d.stock.belowMinimum)}
              tone={d.stock.belowMinimum > 0 ? "danger" : undefined}
              detail={
                d.stock.belowMinimum > 0 ? (
                  <Link className="underline underline-offset-2" href="/inventory/warehouse">
                    Ver qué falta
                  </Link>
                ) : (
                  "todo por encima del mínimo"
                )
              }
            />
          </MetricRow>

          <MetricRow>
            <Metric
              label="Mantenimientos abiertos"
              value={String(d.operations.openMaintenance)}
              tone={d.operations.openMaintenance > 0 ? "warning" : undefined}
              detail={
                d.operations.openMaintenance > 0 ? (
                  <Link className="underline underline-offset-2" href="/inventory/maintenance">
                    Atenderlos
                  </Link>
                ) : (
                  "ninguno pendiente"
                )
              }
            />
            <Metric
              label="Compras en curso"
              value={String(d.operations.purchaseOrdersInProgress)}
              detail={
                d.operations.purchaseOrdersInProgress > 0 ? (
                  <Link className="underline underline-offset-2" href="/inventory/purchases">
                    Ver las órdenes
                  </Link>
                ) : (
                  "ninguna abierta"
                )
              }
            />
          </MetricRow>
        </>
      )}
    </div>
  );
}
