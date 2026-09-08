"use client";

import Link from "next/link";
import { useQueries, useQuery } from "@tanstack/react-query";
import { ActiveContext, InlineNote, PageSection, StatusTile, StatusTileRow } from "@/components/system";
import { fetchEmployees } from "@/lib/backend";
import { useLocale } from "@/components/locale-provider";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

/* ==========================================================================
   PANEL DEL MÓDULO DE PERSONAS
   ==========================================================================
   El directorio sigue siendo el directorio. Lo que cambia es lo que se ve
   ANTES de él: hasta ahora la pantalla abría con una tabla y había que
   filtrarla para saber cuánta gente hay activa; ahora abre con el estado del
   módulo y el directorio queda como el segundo nivel.

   De dónde salen las cifras
   -------------------------
   No hay endpoint de resumen para empleados. Cada cifra es una consulta al
   listado con `pageSize: 1` leyendo solo `meta.total`: el servidor cuenta y
   el navegador no recibe ni un expediente que no vaya a mostrar. Es el mismo
   patrón que usa el panel de reclutamiento.

   Lo que NO se muestra, y por qué
   -------------------------------
   El encargo pide además «perfiles incompletos» y «documentos pendientes o
   próximos a vencer». El backend expone esa información por empleado
   (`/employees/:id/payroll-compliance`), no agregada, así que la única forma
   de enseñarla aquí sería contarla sobre la página cargada y presentar un
   parcial como total. Queda anotada como trabajo pendiente de servidor en
   lugar de inventada.
   ========================================================================== */

/** Estados del directorio que el backend acepta como filtro. */
const ESTADOS = ["ACTIVE", "INACTIVE", "TERMINATED"] as const;

/** Máximo de sucursales con recuento propio. Más allá, la lista deja de
 *  leerse de un vistazo y se convierte en otra tabla. */
const MAX_SUCURSALES = 8;

/**
 * Enlaces al directorio con el filtro ya puesto.
 *
 * El panel vive en /people y el directorio en /employees. Cada tarjeta abre
 * el directorio filtrado por lo que la tarjeta cuenta, y el directorio da
 * prioridad a lo que llega en la URL sobre el filtro guardado.
 */
const alDirectorio = (params: Record<string, string>) => {
  const query = new URLSearchParams(params);
  return `/employees${query.size ? `?${query}` : ""}`;
};

export function EmployeesModulePanel() {
  const { t } = useLocale();
  const { currentTenant, currentBranch, tenantBranches } = useAppStore();
  const alcance = currentBranch?.name ?? t("common.allBranches");

  const total = useQuery({
    queryKey: ["employee-count", "all", currentTenant.id, currentBranch?.id ?? null],
    queryFn: () => fetchEmployees({ branchId: currentBranch?.id, page: 1, pageSize: 1 }),
    staleTime: 60_000,
  });

  const porEstado = useQueries({
    queries: ESTADOS.map((estado) => ({
      queryKey: ["employee-count", estado, currentTenant.id, currentBranch?.id ?? null],
      queryFn: () => fetchEmployees({ status: estado, branchId: currentBranch?.id, page: 1, pageSize: 1 }),
      staleTime: 60_000,
    })),
  });

  // Reparto por sucursal. Solo tiene sentido cuando se está mirando toda la
  // empresa: con una sucursal activa, el reparto es esa sucursal y nada más.
  const sucursales = currentBranch ? [] : tenantBranches.slice(0, MAX_SUCURSALES);
  const porSucursal = useQueries({
    queries: sucursales.map((sucursal) => ({
      queryKey: ["employee-count", "branch", sucursal.id],
      queryFn: () => fetchEmployees({ branchId: sucursal.id, page: 1, pageSize: 1 }),
      staleTime: 60_000,
    })),
  });

  /** `undefined` mientras carga · `null` si el servidor no lo entrega. */
  const cifra = (consulta: { isError: boolean; data?: { meta?: { total: number } } }) =>
    consulta.isError ? null : consulta.data?.meta?.total;

  const activos = cifra(porEstado[0] ?? { isError: true });
  const inactivos = cifra(porEstado[1] ?? { isError: true });
  const desvinculados = cifra(porEstado[2] ?? { isError: true });

  const repartoSucursales = sucursales.map((sucursal, indice) => ({
    id: sucursal.id,
    name: sucursal.name,
    total: cifra(porSucursal[indice] ?? { isError: true }),
  }));
  const maximo = Math.max(1, ...repartoSucursales.map((fila) => fila.total ?? 0));
  const faltanSucursales = !currentBranch && tenantBranches.length > MAX_SUCURSALES;

  return (
    <div className="space-y-5">
      <ActiveContext />

      <StatusTileRow label={t("employees.panel.tilesLabel")}>
        <li className="min-w-0">
          <StatusTile
            title={t("employees.panel.active")}
            value={activos}
            context={t("employees.panel.activeContext")}
            scope={alcance}
            href={alDirectorio({ status: "ACTIVE" })}
            actionLabel={t("employees.panel.filter")}
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title={t("employees.panel.inactive")}
            value={inactivos}
            context={t("employees.panel.inactiveContext")}
            scope={alcance}
            href={alDirectorio({ status: "INACTIVE" })}
            actionLabel={t("employees.panel.filter")}
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title={t("employees.panel.terminated")}
            value={desvinculados}
            context={t("employees.panel.terminatedContext")}
            scope={alcance}
            href={alDirectorio({ status: "TERMINATED" })}
            actionLabel={t("employees.panel.filter")}
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title={t("employees.panel.total")}
            value={cifra(total)}
            context={t("employees.panel.totalContext")}
            scope={alcance}
            href={alDirectorio({ status: "all" })}
            actionLabel={t("employees.panel.seeAll")}
          />
        </li>
      </StatusTileRow>

      {repartoSucursales.length > 1 ? (
        <PageSection
          title={t("employees.panel.byBranchTitle")}
          description={t("employees.panel.byBranchHelp")}
          id="reparto-sucursales"
        >
          <ul className="space-y-1">
            {repartoSucursales.map((fila) => (
              <li key={fila.id}>
                <Link
                  href={alDirectorio({ branch: fila.id })}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-lg border border-line bg-surface-1 px-4 py-3 text-left",
                    "min-h-[var(--control-h-touch)] sm:min-h-[var(--control-h-base)]",
                    "transition-colors hover:border-line-strong hover:bg-surface-2",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-1">{fila.name}</span>
                  <span
                    aria-hidden="true"
                    className="hidden h-2 w-24 overflow-hidden rounded-full bg-surface-3 sm:block lg:w-40"
                  >
                    <span
                      className="block h-full rounded-full bg-accent-fill"
                      style={{ width: `${Math.round(((fila.total ?? 0) / maximo) * 100)}%` }}
                    />
                  </span>
                  <span className="w-14 shrink-0 text-right font-mono text-lg font-semibold tabular-figures text-ink-1">
                    {fila.total ?? "—"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {faltanSucursales ? (
            <InlineNote tone="info" title={t("employees.panel.moreBranchesTitle", { max: MAX_SUCURSALES })}>
              {t("employees.panel.moreBranchesHelp")}
            </InlineNote>
          ) : null}
        </PageSection>
      ) : null}
    </div>
  );
}
