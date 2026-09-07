"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchPlatformAudit, getApiErrorMessage } from "@/lib/backend";
import {
  AUDIT_DOMAIN_LABELS,
  auditActionFlatOptions,
  auditActionInfo,
  matchesAuditEntry,
} from "@/lib/audit-labels";
import { formatDateTime, shortId } from "@/lib/platform-labels";
import {
  BlockedState,
  EmptyState,
  ErrorState,
  InlineNote,
  Metric,
  MetricRow,
  PageHeader,
  PageSection,
  Pagination,
  SkeletonRows,
  StatusBadge,
} from "@/components/system";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store/app-store";

/**
 * Auditoría de la plataforma.
 *
 * El filtro estaba roto de dos maneras a la vez, y las dos daban siempre cero
 * resultados:
 *
 * 1. Los botones ofrecían «Usuarios», «Empresa» y «Seguridad» con los valores
 *    `USER`, `TENANT` y `AUTH`. El servidor compara la acción por igualdad
 *    exacta (`action: query.action`) y **no existe ninguna acción llamada
 *    `USER`**: las acciones reales son `AUTH_LOGIN`, `HIRE_CANDIDATE`,
 *    `TAMPERED`… Pulsar cualquiera de esos botones vaciaba la pantalla.
 * 2. El cuadro de texto y los botones escribían en la MISMA variable
 *    (`searchValue={action}` y `filterValue={action}`), así que escribir
 *    borraba el filtro y pulsar un botón borraba lo escrito. Además, lo
 *    escrito se enviaba al servidor como acción exacta: cualquier texto libre
 *    devolvía cero.
 *
 * Ahora el desplegable ofrece las acciones reales con su nombre en español, y
 * el cuadro de texto afina lo ya cargado —la API no tiene búsqueda libre, y la
 * pantalla lo dice en vez de fingirla—.
 *
 * Lo tercero: se pedían 50 registros por página y se mostraba «N eventos
 * encontrados» sin ninguna forma de llegar al 51. Ahora hay paginación real.
 *
 * Y las acciones dejan de mostrarse como constantes del backend, que era lo
 * peor de todo en la única pantalla a la que se acude cuando algo salió mal.
 */

const PAGE_SIZE = 25;
const ACTION_OPTIONS = [{ value: "", label: "Todas las acciones" }, ...auditActionFlatOptions()];

export default function AuditPage() {
  const { can } = useAppStore();
  const [action, setAction] = useState("");
  const [term, setTerm] = useState("");
  // `Pagination` cuenta desde 0 como el resto del producto; la API cuenta
  // desde 1. La conversión vive aquí y en un solo sitio.
  const [page, setPage] = useState(0);

  const audit = useQuery({
    queryKey: ["platform-audit", action, page],
    queryFn: () => fetchPlatformAudit({ action: action || undefined, page: page + 1, pageSize: PAGE_SIZE }),
    // Sin esto, cada cambio de página borra la lista y deja la pantalla en
    // blanco: en auditoría se compara una página con la siguiente.
    placeholderData: keepPreviousData,
  });

  if (!can("audit.view")) {
    return (
      <BlockedState
        title="Sin acceso a la auditoría"
        cause="El registro de auditoría contiene la actividad de todas las personas de la empresa."
        owner="Quien administra la empresa"
        resolution="Si necesitas consultarlo, pide el permiso «Ver auditoría»."
      />
    );
  }

  const items = audit.data?.items ?? [];
  const visible = items.filter((item) => matchesAuditEntry(item, term));
  const total = audit.data?.total ?? 0;
  const hasServerFilter = action !== "";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gobierno de la plataforma"
        title="Auditoría"
        description="Qué se hizo, en qué ruta y cuándo, dentro de tu alcance. Los registros no se pueden editar ni borrar desde aquí: es su razón de ser."
      />

      <PageSection title="Filtros" description="La acción se filtra en el servidor; el texto afina lo que ya está en pantalla.">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="min-w-0 space-y-2">
            <Label>Acción</Label>
            <FormSelect
              value={action}
              onValueChange={(value) => {
                setAction(value);
                setPage(0);
              }}
              options={ACTION_OPTIONS}
            />
            {action ? <p className="text-2xs text-ink-3">{auditActionInfo(action).detail}</p> : null}
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor="audit-term">Afinar esta página</Label>
            <Input
              id="audit-term"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Ruta, acción o identificador de usuario"
              autoComplete="off"
            />
            <p className="text-2xs text-ink-3">
              Busca dentro de los {items.length} eventos cargados, no en todo el histórico.
            </p>
          </div>
        </div>

        {action || term ? (
          <div className="mt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setAction("");
                setTerm("");
                setPage(0);
              }}
            >
              Quitar los filtros
            </Button>
          </div>
        ) : null}
      </PageSection>

      {audit.isLoading ? (
        <SkeletonRows rows={8} label="Cargando la auditoría" />
      ) : audit.isError ? (
        <ErrorState
          title="No fue posible cargar la auditoría"
          detail={getApiErrorMessage(audit.error, "Reintenta la consulta para continuar.")}
          onRetry={() => void audit.refetch()}
        />
      ) : (
        <>
          <MetricRow>
            <Metric
              label={hasServerFilter ? "Eventos con esta acción" : "Eventos en tu alcance"}
              value={String(total)}
            />
            <Metric label="En esta página" value={String(items.length)} detail={`De ${PAGE_SIZE} por página`} />
            <Metric
              label="Que conviene revisar"
              value={String(items.filter((item) => auditActionInfo(item.action).tone === "danger").length)}
              detail="Eliminaciones y documentos alterados"
              tone={items.some((item) => auditActionInfo(item.action).tone === "danger") ? "danger" : undefined}
            />
          </MetricRow>

          {visible.length === 0 ? (
            <EmptyState
              reason={action || term ? "no-matches" : "no-records"}
              title={action || term ? "Ningún evento coincide" : "Todavía no hay eventos registrados"}
              description={
                term && items.length > 0
                  ? "Hay eventos en esta página, pero ninguno contiene ese texto. Prueba a quitarlo o a cambiar de página."
                  : action
                    ? "Nadie ha hecho todavía esta acción dentro de tu alcance."
                    : "La actividad quedará registrada aquí en cuanto ocurra."
              }
              onClearFilters={
                action || term
                  ? () => {
                      setAction("");
                      setTerm("");
                      setPage(0);
                    }
                  : undefined
              }
            />
          ) : (
            <>
              {term && visible.length < items.length ? (
                <InlineNote tone="info" title={`${visible.length} de ${items.length} eventos de esta página`}>
                  El texto filtra solo lo cargado. Para buscar en todo el histórico, filtra por acción: eso sí llega al
                  servidor.
                </InlineNote>
              ) : null}

              <ul className="space-y-2">
                {visible.map((item) => {
                  const info = auditActionInfo(item.action);
                  return (
                    <li key={item.id} className="rounded-lg border border-line bg-surface-1 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge size="sm" tone={info.tone} label={info.label} />
                            <span className="text-2xs text-ink-3">{AUDIT_DOMAIN_LABELS[info.domain]}</span>
                          </div>
                          <p className="mt-2 text-sm text-ink-2">{info.detail}</p>
                          <p className="mt-1 break-all font-mono text-2xs text-ink-3">
                            {item.route ?? "Ruta no registrada"}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <time dateTime={item.createdAt} className="block text-2xs text-ink-2">
                            {formatDateTime(item.createdAt)}
                          </time>
                          <p className="mt-1 text-2xs text-ink-3">
                            {item.branchId ? "Sucursal" : "Empresa"}
                            {item.userId ? ` · ${shortId(item.userId)}` : ""}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                totalItems={total}
                onPageChange={(next) => {
                  setPage(next);
                  if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
