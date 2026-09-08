"use client";

import { useUiText } from "@/components/ui-copy";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchInventoryAuditTrail, getApiErrorMessage } from "@/lib/backend";
import { useAppStore } from "@/store/app-store";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  PageSection,
  Pagination,
  SkeletonRows,
  StatusBadge,
} from "@/components/system";
import { roleLabels } from "@/lib/ui-labels";
import { auditActionLabel, formatDateTime } from "@/lib/inventory-labels";
import type { RoleKey } from "@/lib/contracts";

/**
 * Auditoría del inventario.
 *
 * Qué cambió
 * ----------
 * Cada evento mostraba cuatro identificadores técnicos seguidos: el código de
 * acción del backend sin traducir, la ruta HTTP interna
 * (`/inventory/warehouse/adjustments`), el código de estado («HTTP 201») y el
 * identificador de correlación. Quien audita necesita saber QUÉ pasó y QUIÉN
 * lo hizo; la ruta y el identificador solo sirven cuando algo va mal, así que
 * ahora viven en un detalle que se despliega.
 *
 * Además: el rol se imprimía con su clave, existiendo `roleLabels`; la fecha
 * salía en el formato del navegador; no había estado vacío —una lista vacía
 * dejaba una caja de un píxel—; y la paginación eran dos botones que no decían
 * en qué página se estaba.
 *
 * El resultado de la operación se pintaba como texto («HTTP 500» junto a
 * «HTTP 201», indistinguibles). Ahora un fallo se ve como fallo.
 */
export default function InventoryAuditPage() {
  const uiText = useUiText();
  const { currentBranch } = useAppStore();
  const [page, setPage] = useState(1);
  const audit = useQuery({
    queryKey: ["inventory-audit", currentBranch?.id, page],
    queryFn: () => fetchInventoryAuditTrail({ branchId: currentBranch?.id, page }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={uiText("Gobierno")}
        title={uiText("Auditoría de inventario")}
        description={uiText("Quién hizo cada operación crítica, cuándo y con qué resultado.")}
        meta={<span>{currentBranch?.name ?? "Todas las sucursales"}</span>}
      />

      {audit.isLoading ? (
        <SkeletonRows rows={6} label={uiText("Cargando la auditoría")} />
      ) : audit.isError ? (
        <ErrorState
          title={uiText("No fue posible cargar la auditoría")}
          detail={getApiErrorMessage(audit.error, uiText("Reintenta la consulta para continuar."))}
          onRetry={() => void audit.refetch()}
        />
      ) : !audit.data?.items.length ? (
        <EmptyState
          reason="no-records"
          title={uiText("No hay operaciones registradas")}
          description={uiText("Aquí quedará constancia de cada entrega, devolución, ajuste y recepción del inventario.")}
        />
      ) : (
        <>
          <PageSection title={uiText("Operaciones registradas")}>
            <ul className="divide-y divide-line">
              {audit.data.items.map((item) => {
                const failed = item.statusCode >= 400;
                return (
                  <li key={item.id} className="py-4">
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                      <div className="min-w-0">
                        <p className="font-medium text-ink-1">{auditActionLabel(item.action)}</p>
                        <p className="text-sm text-ink-2">
                          {item.email || "Sistema"}
                          {item.actorRole
                            ? ` · ${roleLabels[item.actorRole as RoleKey] ?? item.actorRole}`
                            : ""}{" "}
                          · {formatDateTime(item.createdAt)}
                        </p>
                      </div>
                      <StatusBadge
                        size="sm"
                        tone={failed ? "danger" : "success"}
                        label={failed ? "No se completó" : uiText("Completada")}
                      />
                    </div>

                    {/* La ruta, el código HTTP y el identificador de
                        correlación son para quien investiga una incidencia, no
                        para quien revisa la operación del día. */}
                    <details className="mt-2">
                      <summary className="cursor-pointer text-2xs text-ink-3 hover:text-ink-2">
                        {uiText("Detalle técnico")}</summary>
                      <dl className="mt-2 grid gap-1 font-mono text-2xs text-ink-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-x-3">
                        <dt>{uiText("Ruta")}</dt>
                        <dd className="break-all">{item.route ?? "no registrada"}</dd>
                        <dt>{uiText("Respuesta")}</dt>
                        <dd>{item.statusCode}</dd>
                        {item.correlationId ? (
                          <>
                            <dt>{uiText("Correlación")}</dt>
                            <dd className="break-all">{item.correlationId}</dd>
                          </>
                        ) : null}
                      </dl>
                    </details>
                  </li>
                );
              })}
            </ul>
          </PageSection>

          {/* El total lo da el servidor: derivarlo de `totalPages` produciría
              una cifra inventada en la última página. */}
          <Pagination
            page={page - 1}
            totalItems={audit.data.total}
            pageSize={Math.max(1, Math.ceil(audit.data.total / Math.max(1, audit.data.totalPages)))}
            onPageChange={(nextPage) => setPage(nextPage + 1)}
          />
        </>
      )}
    </div>
  );
}
