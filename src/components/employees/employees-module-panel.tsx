"use client";

import Link from "next/link";
import { useQueries, useQuery } from "@tanstack/react-query";
import { ActiveContext, InlineNote, PageSection, StatusTile } from "@/components/system";
import { BarChart, ChartCard, ChartSkeleton } from "@/components/chart";
import { URGENCY_COLOR_CLASS } from "@/components/dashboard/operational-widgets";
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

/**
 * Estados del directorio que el backend acepta como filtro.
 *
 * `SUSPENDED` faltaba, y su ausencia no era inocua: las tres cifras se
 * presentaban al lado del Total, así que en cuanto había una persona
 * suspendida no sumaban y no había forma de saber dónde estaba la
 * diferencia. Cuatro cifras que cuadran valen más que tres que no.
 */
const ESTADOS = ["ACTIVE", "SUSPENDED", "INACTIVE", "TERMINATED"] as const;

/**
 * Color de cada estado.
 *
 * Es una escala de situación laboral, no una paleta categórica: el ámbar
 * queda para lo que exige mirar —suspendido— y el resto es grafito, más
 * apagado cuanto más lejos de la plantilla activa. Cada barra lleva su
 * nombre escrito al lado.
 */
const COLOR_ESTADO: Record<(typeof ESTADOS)[number], string> = {
  ACTIVE: "text-series-2",
  SUSPENDED: URGENCY_COLOR_CLASS.warning,
  INACTIVE: "text-series-2/45",
  TERMINATED: URGENCY_COLOR_CLASS.neutral,
};

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

  const etiquetaEstado: Record<(typeof ESTADOS)[number], string> = {
    ACTIVE: t("employees.panel.active"),
    SUSPENDED: t("employees.panel.suspended"),
    INACTIVE: t("employees.panel.inactive"),
    TERMINATED: t("employees.panel.terminated"),
  };

  const reparto = ESTADOS.map((estado, indice) => ({
    estado,
    label: etiquetaEstado[estado],
    total: cifra(porEstado[indice] ?? { isError: true }),
  }));
  const cargandoReparto = reparto.some((fila) => fila.total === undefined);
  const hayReparto = reparto.some((fila) => (fila.total ?? 0) > 0);

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

      {/* Una sola cifra de cabecera y el reparto dibujado.
          Antes eran cuatro tarjetas del mismo tamaño para cuatro números que
          son partes de un mismo total: la proporción, que es lo que se quiere
          saber al abrir el módulo, había que calcularla mentalmente. */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)] lg:items-start">
        {/* Una sola tarjeta no es una lista: `StatusTileRow` sigue siendo una
            rejilla de cuatro columnas en pantalla ancha y aquí la habría
            partido en cuatro tiras de 55px. */}
        <StatusTile
          title={t("employees.panel.total")}
          value={cifra(total)}
          context={t("employees.panel.totalContext")}
          scope={alcance}
          href={alDirectorio({ status: "all" })}
          actionLabel={t("employees.panel.seeAll")}
        />

        <ChartCard
          title={t("employees.panel.mixTitle")}
          subtitle={t("employees.panel.mixSubtitle")}
          period={alcance}
        >
          {cargandoReparto ? (
            <ChartSkeleton label={t("employees.panel.tilesLabel")} />
          ) : !hayReparto ? (
            <BarChart categories={[]} series={[]} emptyReason="sin-registros" />
          ) : (
            <>
              <BarChart
                orientation="horizontal"
                categories={reparto.map((fila) => fila.label)}
                series={[
                  { id: "estado", name: t("employees.panel.people"), values: reparto.map((fila) => fila.total ?? 0) },
                ]}
                categoryColorClasses={reparto.map((fila) => COLOR_ESTADO[fila.estado])}
                caption={t("employees.panel.mixCaption")}
                categoryLabel={t("employees.panel.state")}
                formatValue={(valor) => String(valor)}
              />
              {/* Cada estado sigue abriendo el directorio ya filtrado, que es
                  lo que hacían las cuatro tarjetas de antes. */}
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {reparto.map((fila) => (
                  <li key={fila.estado}>
                    <Link
                      href={alDirectorio({ status: fila.estado })}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface-1 px-3 text-sm text-ink-2 transition-colors hover:border-line-strong hover:text-ink-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                    >
                      <span aria-hidden="true" className={cn("size-2.5 shrink-0 rounded-sm bg-current", COLOR_ESTADO[fila.estado])} />
                      <span className="truncate">{fila.label}</span>
                      <span className="font-mono text-2xs tabular-figures text-ink-3">{fila.total ?? "—"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </ChartCard>
      </div>

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
