"use client";

import { useUiText } from "@/components/ui-copy";

import { useQuery } from "@tanstack/react-query";
import { Laptop, MapPin } from "lucide-react";
import Link from "next/link";
import { fetchMyInventoryAssets, getApiErrorMessage } from "@/lib/backend";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  SkeletonRows,
  StatusBadge,
} from "@/components/system";
import { assetStatusLabel, assetStatusTone, conditionLabel } from "@/lib/inventory-labels";

/**
 * Los activos que una persona tiene bajo su custodia.
 *
 * Qué cambió
 * ----------
 * · El estado se mostraba con el código del backend: el empleado —el usuario
 *   menos técnico del producto— leía «ASSIGNED» o «RETURN_PENDING» sobre su
 *   propio portátil. Es el peor sitio posible para un código de base de datos.
 * · No se comprobaba `isError`: si la consulta fallaba, la persona veía el
 *   título y nada debajo, sin saber si es que no tiene equipos o si el sistema
 *   falló. Son dos situaciones distintas y ahora se distinguen.
 * · El vacío no ofrecía ninguna salida.
 * · Desde aquí no se podía hacer lo único que alguien querría hacer: avisar de
 *   que devuelve el equipo. Ahora hay un enlace a devoluciones.
 */
export default function MyInventoryAssetsPage() {
  const uiText = useUiText();
  const assets = useQuery({ queryKey: ["my-inventory-assets"], queryFn: fetchMyInventoryAssets });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={uiText("Autoservicio")}
        title={uiText("Mis activos")}
        description={uiText("Los equipos y recursos que están bajo tu custodia.")}
        meta={assets.data?.length ? <span>{assets.data.length} {uiText(" en custodia")}</span> : null}
      />

      {assets.isLoading ? (
        <SkeletonRows rows={3} label={uiText("Cargando tus activos")} />
      ) : assets.isError ? (
        <ErrorState
          title={uiText("No fue posible cargar tus activos")}
          detail={getApiErrorMessage(assets.error, uiText("Reintenta la consulta para continuar."))}
          onRetry={() => void assets.refetch()}
        />
      ) : !assets.data?.length ? (
        <EmptyState
          reason="no-records"
          title={uiText("No tienes activos bajo tu custodia")}
          description={uiText("Cuando te entreguen un equipo aparecerá aquí, con su etiqueta y su número de serie.")}
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {assets.data.map((asset) => (
            <li key={asset.id} className="space-y-3 rounded-lg border border-line bg-surface-1 p-5">
              <Laptop className="size-5 text-ink-3" aria-hidden="true" />
              <div className="min-w-0">
                <p className="truncate font-medium text-ink-1">{asset.item.name}</p>
                <p className="truncate font-mono text-2xs text-ink-3">
                  {asset.assetTag} · {asset.serialNumber || "sin número de serie"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge size="sm" tone={assetStatusTone(asset.status)} label={assetStatusLabel(asset.status)} />
                {asset.condition ? (
                  <span className="text-2xs text-ink-3">{conditionLabel(asset.condition)}</span>
                ) : null}
              </div>
              <p className="flex items-center gap-1 text-sm text-ink-2">
                <MapPin className="size-4 shrink-0" aria-hidden="true" />
                {asset.branch.name}
              </p>
            </li>
          ))}
        </ul>
      )}

      {assets.data?.length ? (
        <p className="text-sm text-ink-2">
          {uiText("¿Vas a devolver alguno?")}{" "}
          <Link className="underline underline-offset-2" href="/inventory/returns">
            {uiText("avisa desde devoluciones")}</Link>{" "}
          {uiText("para que quien lleva el inventario lo reciba.")}</p>
      ) : null}
    </div>
  );
}
