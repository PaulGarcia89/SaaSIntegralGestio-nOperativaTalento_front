"use client";

import { useUiText } from "@/components/ui-copy";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchRestaurantLots,
  fetchRestaurantMovements,
  fetchRestaurantStock,
  getApiErrorMessage,
} from "@/lib/backend";
import { useAppStore } from "@/store/app-store";
import { useRestaurantInventoryContext } from "@/components/restaurant-inventory-context";
import {
  BlockedState,
  DataView,
  ErrorState,
  FilterBar,
  InlineNote,
  PageHeader,
  StatusBadge,
  type DataColumn,
} from "@/components/system";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { restaurantStatusLabel, restaurantStatusTone } from "@/components/restaurant-inventory-ui";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { estaBajoMinimo, faltaParaElMinimo, filtrarPorVencimiento, porUrgencia, porVencimiento, type FiltroDeVencimiento } from "@/lib/restaurant-stock-rows";
import { formatMoney, formatQuantity } from "@/lib/restaurant-operation";

/**
 * Existencias, lotes y Kardex del inventario de restaurante.
 *
 * Qué cambió
 * ----------
 * · Las tres vistas se dibujaban con un ayudante `Table` de 760 px de ancho
 *   mínimo dentro de un `overflow-x-auto`, y encima el producto IMPRIMÍA la
 *   instrucción «Desliza horizontalmente para consultar todas las columnas»:
 *   se le pedía a quien está de pie frente a la estantería con el teléfono en
 *   una mano que arrastrase una tabla de nueve columnas a ciegas. Ahora es
 *   `DataView`: tabla en escritorio, ficha jerarquizada en el teléfono, desde
 *   una sola declaración de columnas.
 * · El archivo contenía CUATRO funciones muertas —`StockView`, `LotsView`,
 *   `MovementView` y `MovementDetail`— duplicados anteriores de las versiones
 *   `Secure*` que sí usa el componente. Las muertas mostraban el costo
 *   promedio y el costo del lote SIN comprobar el permiso
 *   `restaurant_inventory.commercial.view`, que es justo lo que las `Secure*`
 *   protegen. Nadie las llamaba, pero cualquier reconexión futura habría
 *   filtrado costos. Se eliminan.
 * · Los estados y los tipos de movimiento salían con su código del backend
 *   (`AVAILABLE`, `EXPIRED`) y los importes como `$12.5`, sin separadores.
 * · Cargar reemplazaba la pantalla entera —encabezado incluido— por un aro
 *   girando, en las tres vistas.
 * · El cajón de detalle era un `<aside>` fijo a pantalla completa sin
 *   trampa de foco ni cierre con Escape, y en el teléfono tapaba todo sin
 *   respetar el área segura.
 *
 * Se conserva: el filtro de alertas por URL, los filtros del Kardex guardados
 * por usuario y sucursal, el selector de columnas, la exportación a CSV y la
 * comprobación de permiso sobre los costos.
 */

type View = "stock" | "lots" | "movements";
type ColumnKey = "date" | "ingredient" | "type" | "entry" | "exit" | "balance" | "cost" | "reference" | "user";

const defaultColumns: Record<ColumnKey, boolean> = {
  date: true,
  ingredient: true,
  type: true,
  entry: true,
  exit: true,
  balance: true,
  cost: true,
  reference: true,
  user: false,
};

const columnLabels: Record<ColumnKey, string> = {
  date: "Fecha",
  ingredient: "Ingrediente",
  type: "Tipo",
  entry: "Entrada",
  exit: "Salida",
  balance: "Saldo",
  cost: "Costo",
  reference: "Referencia",
  user: "Usuario",
};

export function RestaurantStockControlWorkspace({ view }: { view: View }) {
  const uiText = useUiText();
  const { currentBranch, currentUser, can } = useAppStore();
  const { warehouseId, warehouseName } = useRestaurantInventoryContext();
  const [selectedMovement, setSelectedMovement] = useState<Record<string, unknown> | null>(null);

  if (!currentBranch) {
    return (
      <BlockedState
        title={uiText("Falta elegir la sucursal")}
        cause="Las existencias son de una sucursal concreta y ahora mismo no hay ninguna activa."
        owner="Tú, desde el selector de sucursal"
        resolution="Elige una sucursal en la barra superior."
      />
    );
  }

  const showCosts = can("restaurant_inventory.commercial.view");

  if (view === "stock") {
    return (
      <StockView
        branchId={currentBranch.id}
        warehouseId={warehouseId}
        warehouseName={warehouseName}
        showCosts={showCosts}
      />
    );
  }
  if (view === "lots") {
    return <LotsView branchId={currentBranch.id} warehouseId={warehouseId} showCosts={showCosts} />;
  }
  return (
    <MovementView
      branchId={currentBranch.id}
      warehouseId={warehouseId}
      currentUserId={currentUser.id}
      showCosts={showCosts}
      selectedMovement={selectedMovement}
      onSelect={setSelectedMovement}
    />
  );
}

/* ── Existencias ─────────────────────────────────────────────────────────── */

/** Un lote tal y como lo entrega `balances()` dentro de cada fila de saldo. */
type LoteDeLaFila = {
  id?: string;
  lotNumber?: string | null;
  expirationDate?: string | null;
  remainingQuantity?: number | null;
  daysRemaining?: number | null;
  displayStatus?: string | null;
};

type FilaDeExistencias = Awaited<ReturnType<typeof fetchRestaurantStock>>[number] & {
  warehouseName?: string | null;
  lots?: LoteDeLaFila[];
  lastMovementAt?: string | null;
  lastMovementDate?: string | null;
};

type FiltroDeAlerta = "ALL" | "LOW" | "EXPIRED" | "NO_MOVEMENT";

function StockView({
  branchId,
  warehouseId,
  warehouseName,
  showCosts,
}: {
  branchId: string;
  warehouseId?: string;
  warehouseName: string;
  showCosts: boolean;
}) {
  const uiText = useUiText();
  const params = useSearchParams();
  const { compactMode } = useRestaurantInventoryContext();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FiltroDeAlerta>(() => (params.get("filter") as FiltroDeAlerta) ?? "ALL");
  const [seleccionado, setSeleccionado] = useState<FilaDeExistencias | null>(null);

  const query = useQuery({
    queryKey: ["restaurant-stock", branchId, warehouseId, search],
    queryFn: () => fetchRestaurantStock({ branchId, warehouseId, search }),
  });

  const sourceRows = (query.data ?? []) as FilaDeExistencias[];
  const hasMovementSignal = sourceRows.some((item) => {
    const row = item as unknown as Record<string, unknown>;
    return (
      Object.prototype.hasOwnProperty.call(row, "lastMovementAt") ||
      Object.prototype.hasOwnProperty.call(row, "lastMovementDate")
    );
  });

  const vencido = (item: FilaDeExistencias) =>
    String(item.status ?? "").toUpperCase().includes("EXPIRED") ||
    (item.lots ?? []).some((lote) => typeof lote.daysRemaining === "number" && lote.daysRemaining < 0);
  const sinMovimiento = (item: FilaDeExistencias) =>
    hasMovementSignal && !(item.lastMovementAt ?? item.lastMovementDate);

  /*
   * Cuántos hay de cada cosa, ANTES de filtrar.
   *
   * El filtro era un desplegable «Alertas» con cuatro opciones: había que
   * elegir una para descubrir si devolvía algo. La cifra al lado del nombre
   * responde la pregunta sin gastar un clic —«bajo mínimo: 0» es una respuesta
   * completa— y es la única forma de que el filtro vacío no parezca una
   * pantalla rota.
   */
  const conteos: Record<FiltroDeAlerta, number> = {
    ALL: sourceRows.length,
    LOW: sourceRows.filter(estaBajoMinimo).length,
    EXPIRED: sourceRows.filter(vencido).length,
    NO_MOVEMENT: sourceRows.filter(sinMovimiento).length,
  };

  const filtros: Array<{ id: FiltroDeAlerta; label: string; disponible: boolean }> = [
    { id: "ALL", label: "Todas", disponible: true },
    { id: "LOW", label: "Bajo mínimo", disponible: true },
    { id: "EXPIRED", label: "Vencidos", disponible: true },
    { id: "NO_MOVEMENT", label: "Sin movimiento", disponible: hasMovementSignal },
  ];

  // Los faltantes primero y por urgencia: quien abre esta pantalla con una
  // alerta encima no debería tener que ordenar una columna para encontrarlos.
  const rows = porUrgencia(
    sourceRows.filter((item) =>
      filter === "LOW" ? estaBajoMinimo(item)
      : filter === "EXPIRED" ? vencido(item)
      : filter === "NO_MOVEMENT" ? sinMovimiento(item)
      : true,
    ),
  );

  const columns: Array<DataColumn<FilaDeExistencias>> = [
    {
      key: "name",
      header: uiText("Ingrediente"),
      priority: "identity",
      render: (item) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-1">{item.name}</p>
          {item.sku ? <p className="truncate font-mono text-2xs text-ink-3">{item.sku}</p> : null}
        </div>
      ),
      sortValue: (item) => item.name,
    },
    {
      key: "stock",
      header: uiText("Existencia"),
      priority: "primary",
      numeric: true,
      render: (item) => (
        <span className="font-mono tabular-figures">
          {formatQuantity(item.stock)} {item.inventoryUnit}
        </span>
      ),
      sortValue: (item) => item.stock,
    },
    {
      key: "status",
      header: uiText("Situación"),
      priority: "primary",
      render: (item) =>
        estaBajoMinimo(item) ? (
          <StatusBadge
            size="sm"
            tone="danger"
            label={uiText("Faltan {{n}} {{unit}}", { n: formatQuantity(faltaParaElMinimo(item)), unit: item.inventoryUnit })}
          />
        ) : (
          <StatusBadge
            size="sm"
            tone={restaurantStatusTone(String(item.status ?? ""))}
            label={uiText(restaurantStatusLabel(String(item.status ?? "")))}
          />
        ),
      sortValue: (item) => (estaBajoMinimo(item) ? 0 : 1),
    },
    {
      key: "minimum",
      header: uiText("Mínimo"),
      priority: "secondary",
      numeric: true,
      render: (item) => (
        <span className="font-mono tabular-figures">
          {formatQuantity(item.minimumStock)} {item.inventoryUnit}
        </span>
      ),
      sortValue: (item) => item.minimumStock,
    },
    ...(showCosts
      ? [
          {
            key: "cost",
            header: uiText("Costo promedio"),
            priority: "secondary" as const,
            numeric: true,
            render: (item: FilaDeExistencias) => formatMoney(item.averageCost),
            sortValue: (item: FilaDeExistencias) => item.averageCost,
          },
        ]
      : []),
  ];

  return (
    <div className={compactMode ? "space-y-3" : "space-y-5"}>
      <PageHeader
        eyebrow="Control"
        title={uiText("Existencias")}
        description={uiText("Cuánto queda de cada ingrediente en este almacén y qué hay que reponer.")}
        meta={
          <>
            <span>{warehouseName}</span>
            <span>{rows.length} {uiText(" registros")}</span>
          </>
        }
        actions={
          <Button
            variant="secondary"
            onClick={() =>
              exportCsv(
                "existencias.csv",
                [
                  ["Ingrediente", "SKU", "Existencia", "Unidad", "Mínimo", ...(showCosts ? ["Costo promedio"] : [])],
                  ...rows.map((item) => [
                    item.name,
                    item.sku,
                    item.stock,
                    item.inventoryUnit,
                    item.minimumStock,
                    ...(showCosts ? [item.averageCost] : []),
                  ]),
                ],
              )
            }
          >
            <Download className="size-4" aria-hidden="true" />
            {uiText("Exportar CSV")}</Button>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchLabel={uiText("Buscar ingrediente por nombre o SKU")}
      />

      {/*
        Los contadores van FUERA del cajón de filtros.

        Dentro, `FilterBar` los esconde detrás de un botón «Filtros», que es
        justo donde no sirven: la cifra al lado del nombre existe para
        responder «¿tengo faltantes?» sin gastar un clic. Escondida detrás de
        un clic no responde nada.
      */}
      <nav aria-label={uiText("Alertas")} className="min-w-0">
        <ul className="-mx-1 flex min-w-0 gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filtros.map((opcion) => (
            <li key={opcion.id} className="shrink-0">
              <Button
                type="button"
                size="sm"
                variant={filter === opcion.id ? "default" : "secondary"}
                aria-pressed={filter === opcion.id}
                disabled={!opcion.disponible}
                className="min-h-[var(--control-h-touch)]"
                onClick={() => setFilter(opcion.id)}
              >
                {uiText(opcion.label, {}, "inventario")}
                <span className="font-mono tabular-figures">{opcion.disponible ? conteos[opcion.id] : "—"}</span>
              </Button>
            </li>
          ))}
        </ul>
      </nav>

      {filter === "NO_MOVEMENT" && !hasMovementSignal ? (
        <InlineNote tone="info" title={uiText("Esta señal no está disponible")}>
          {uiText("El servidor no entrega la fecha del último movimiento en este listado, así que no se puede saber cuáles llevan tiempo quietos.")}</InlineNote>
      ) : null}

      {query.error ? (
        <ErrorState
          title={uiText("No fue posible cargar las existencias")}
          detail={getApiErrorMessage(query.error, uiText("Reintenta la consulta para continuar."))}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <DataView
          rows={rows}
          loading={query.isLoading}
          columns={columns}
          getKey={(item) => item.id}
          caption={uiText("Existencias por ingrediente")}
          /*
           * La fila se puede abrir.
           *
           * Antes era papel: para saber qué lotes tenía un ingrediente, cuánto
           * le faltaba o registrar su merma había que memorizar el nombre,
           * salir a otra pantalla y volver a buscarlo. Ahora la fila abre lo
           * que se sabe de ese ingrediente y las operaciones que se pueden
           * hacer con él.
           */
          onRowAction={(item) => setSeleccionado(item)}
          rowActionLabel={(item) => uiText("Ver {{name}}", { name: item.name })}
          emptyReason={search || filter !== "ALL" ? "no-matches" : "no-records"}
          emptyAction={
            search || filter !== "ALL" ? undefined : (
              <Button asChild>
                <Link href="/inventory/restaurant/receipts">{uiText("Registrar una entrada")}</Link>
              </Button>
            )
          }
          onClearFilters={
            search || filter !== "ALL"
              ? () => {
                  setSearch("");
                  setFilter("ALL");
                }
              : undefined
          }
        />
      )}

      <DetalleDeIngrediente
        fila={seleccionado}
        warehouseName={warehouseName}
        showCosts={showCosts}
        onClose={() => setSeleccionado(null)}
      />
    </div>
  );
}

/**
 * Qué pasa con este ingrediente y qué puedo hacer con él.
 *
 * Todo lo que enseña sale de la fila que ya está en memoria —incluidos los
 * lotes, que `balances()` entrega dentro de cada saldo—, así que abrirlo no
 * cuesta una petición más. No inventa datos que el servidor no da: si la fila
 * no trae lotes, lo dice en vez de dejar un hueco.
 */
function DetalleDeIngrediente({
  fila,
  warehouseName,
  showCosts,
  onClose,
}: {
  fila: FilaDeExistencias | null;
  warehouseName: string;
  showCosts: boolean;
  onClose: () => void;
}) {
  const uiText = useUiText();
  if (!fila) return null;

  const falta = faltaParaElMinimo(fila);
  const lotes = (fila.lots ?? []).filter((lote) => Number(lote.remainingQuantity ?? 0) > 0);
  const datos: Array<[string, string]> = [
    [uiText("Existencia"), `${formatQuantity(fila.stock)} ${fila.inventoryUnit}`],
    [uiText("Mínimo"), `${formatQuantity(fila.minimumStock)} ${fila.inventoryUnit}`],
    [uiText("Almacén"), fila.warehouseName ?? warehouseName],
    ...(showCosts ? ([[uiText("Costo promedio"), formatMoney(fila.averageCost)]] as Array<[string, string]>) : []),
  ];

  return (
    <Dialog open onOpenChange={(abierto) => { if (!abierto) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{fila.name}</DialogTitle>
          <DialogDescription>
            {falta > 0
              ? uiText("Faltan {{n}} {{unit}} para llegar al mínimo de este almacén.", { n: formatQuantity(falta), unit: fila.inventoryUnit })
              : uiText("Por encima de su mínimo en este almacén.")}
          </DialogDescription>
        </DialogHeader>

        <dl className="mt-4 grid grid-cols-2 gap-3">
          {datos.map(([etiqueta, valor]) => (
            <div key={etiqueta} className="rounded-xl border border-line bg-surface-2 px-3 py-2">
              <dt className="text-2xs uppercase tracking-[0.14em] text-ink-3">{etiqueta}</dt>
              <dd className="mt-0.5 font-mono text-base font-semibold tabular-figures text-ink-1">{valor}</dd>
            </div>
          ))}
        </dl>

        <section className="mt-5">
          <h3 className="text-sm font-semibold text-ink-1">{uiText("Lotes con existencia")}</h3>
          {lotes.length ? (
            <ul className="mt-2 space-y-1">
              {lotes.map((lote, indice) => (
                <li key={lote.id ?? `${lote.lotNumber}-${indice}`} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg border border-line bg-surface-1 px-3 py-2">
                  <span className="min-w-0 flex-1 basis-32 truncate font-mono text-sm text-ink-1">{lote.lotNumber ?? uiText("Sin número de lote")}</span>
                  <span className="shrink-0 font-mono text-sm tabular-figures text-ink-1">{formatQuantity(Number(lote.remainingQuantity ?? 0))} {fila.inventoryUnit}</span>
                  <StatusBadge
                    size="sm"
                    tone={typeof lote.daysRemaining === "number" && lote.daysRemaining < 0 ? "danger" : typeof lote.daysRemaining === "number" && lote.daysRemaining <= 7 ? "warning" : "neutral"}
                    label={lote.expirationDate ? formatDate(String(lote.expirationDate)) : uiText("Sin vencimiento")}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-ink-2">{uiText("Este listado no trae lotes para el ingrediente.")}</p>
          )}
        </section>

        <section className="mt-5">
          <h3 className="text-sm font-semibold text-ink-1">{uiText("Qué puedes hacer con este ingrediente")}</h3>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {[
              { href: "/inventory/restaurant/receipts", label: "Registrar una entrada" },
              { href: "/inventory/restaurant/waste", label: "Registrar merma" },
              { href: "/inventory/restaurant/stock-counts", label: "Contar este almacén" },
              { href: "/inventory/restaurant/movements", label: "Ver sus movimientos" },
            ].map((accion) => (
              <li key={accion.href}>
                <Button asChild variant="secondary" className="w-full min-h-[var(--control-h-touch)] justify-start">
                  <Link href={accion.href}>{uiText(accion.label)}</Link>
                </Button>
              </li>
            ))}
          </ul>
        </section>
      </DialogContent>
    </Dialog>
  );
}

/* ── Lotes ───────────────────────────────────────────────────────────────── */

const EXPIRY_FILTERS: Array<[FiltroDeVencimiento, string]> = [
  ["", "Todos"],
  ["EXPIRED", "Vencidos"],
  ["7", "Vence en 7 días"],
  ["15", "Vence en 15 días"],
  ["30", "Vence en 30 días"],
];

function LotsView({
  branchId,
  warehouseId,
  showCosts,
}: {
  branchId: string;
  warehouseId?: string;
  showCosts: boolean;
}) {
  const uiText = useUiText();
  const params = useSearchParams();
  const { compactMode } = useRestaurantInventoryContext();
  const [filter, setFilter] = useState<FiltroDeVencimiento>(() => (params.get("filter") as FiltroDeVencimiento) ?? "");

  /*
   * El filtro ya no viaja al servidor.
   *
   * Se mandaba como `?expiry=…` y el controlador de `/lots` no lee ese
   * parámetro —acepta `status`, sucursal, almacén y paginación—, así que los
   * cuatro atajos devolvían exactamente la misma lista completa. Sin
   * paginación el endpoint entrega todos los lotes, de modo que filtrarlos
   * aquí da el mismo resultado que habría dado filtrarlos allí.
   */
  const query = useQuery({
    queryKey: ["restaurant-lots", branchId, warehouseId],
    queryFn: () => fetchRestaurantLots({ branchId, warehouseId }),
  });

  const todos = query.data ?? [];
  const rows = porVencimiento(filtrarPorVencimiento(todos, filter));
  const conteo = (opcion: FiltroDeVencimiento) => filtrarPorVencimiento(todos, opcion).length;

  const columns: Array<DataColumn<(typeof rows)[number]>> = [
    {
      key: "ingredient",
      header: uiText("Ingrediente"),
      priority: "identity",
      render: (item) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-1">{item.ingredientName}</p>
          {item.lotCode ? <p className="truncate font-mono text-2xs text-ink-3">{uiText("lote ")}{item.lotCode}</p> : null}
        </div>
      ),
      sortValue: (item) => item.ingredientName,
    },
    {
      key: "status",
      header: uiText("Alerta"),
      priority: "primary",
      /*
       * «Vence en 3 días» y no «EXPIRING».
       *
       * El rótulo salía del estado del lote, que dice si caduca pronto pero no
       * cuándo: dos lotes marcados igual podían estar a un día y a un mes. La
       * cuenta es lo accionable; el estado se conserva para lo que no caduca.
       */
      render: (item) => <AlertaDeVencimiento dias={item.daysRemaining} status={item.status} />,
      sortValue: (item) => item.daysRemaining ?? Number.MAX_SAFE_INTEGER,
    },
    {
      key: "expires",
      header: uiText("Vencimiento"),
      priority: "primary",
      render: (item) => formatDate(item.expiresAt),
      sortValue: (item) => item.expiresAt,
    },
    {
      key: "quantity",
      header: uiText("Cantidad"),
      priority: "secondary",
      numeric: true,
      render: (item) => (
        <span className="font-mono tabular-figures">
          {formatQuantity(item.remainingQuantity)} {item.unit}
        </span>
      ),
      sortValue: (item) => item.remainingQuantity,
    },
    {
      key: "warehouse",
      header: uiText("Almacén"),
      priority: "secondary",
      render: (item) => item.warehouseName,
      sortValue: (item) => item.warehouseName,
    },
    ...(showCosts
      ? [
          {
            key: "cost",
            header: uiText("Costo"),
            priority: "detail" as const,
            numeric: true,
            render: (item: (typeof rows)[number]) => formatMoney(item.cost),
            sortValue: (item: (typeof rows)[number]) => item.cost,
          },
        ]
      : []),
  ];

  return (
    <div className={compactMode ? "space-y-3" : "space-y-5"}>
      <PageHeader
        eyebrow={uiText("Trazabilidad")}
        title={uiText("Lotes y vencimientos")}
        description={uiText("Prioriza los lotes vencidos y los que están por vencer antes de tener que registrar una merma.")}
        meta={<span>{rows.length} {uiText(" lotes")}</span>}
        actions={
          <Button
            variant="secondary"
            onClick={() =>
              exportCsv(
                "lotes.csv",
                [
                  ["Ingrediente", "Lote", "Vencimiento", "Cantidad", "Unidad", ...(showCosts ? ["Costo"] : []), "Estado"],
                  ...rows.map((item) => [
                    item.ingredientName,
                    item.lotCode,
                    item.expiresAt,
                    item.remainingQuantity,
                    item.unit,
                    ...(showCosts ? [item.cost] : []),
                    item.status,
                  ]),
                ],
              )
            }
          >
            <Download className="size-4" aria-hidden="true" />
            {uiText("Exportar CSV")}</Button>
        }
      />

      {/* Los atajos de vencimiento caben en una fila que se desliza sola en el
          teléfono, sin apilarse en cuatro líneas. La cifra al lado dice cuántos
          hay antes de pulsarlos. */}
      <nav aria-label={uiText("Filtrar por vencimiento")}>
        <ul className="-mx-1 flex min-w-0 gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {EXPIRY_FILTERS.map(([id, label]) => (
            <li key={id || "all"} className="shrink-0">
              <Button
                size="sm"
                variant={filter === id ? "default" : "secondary"}
                aria-pressed={filter === id}
                className="min-h-[var(--control-h-touch)]"
                onClick={() => setFilter(id)}
              >
                {uiText(label, {}, "inventario")}
                <span className="font-mono tabular-figures">{conteo(id)}</span>
              </Button>
            </li>
          ))}
        </ul>
      </nav>

      {query.error ? (
        <ErrorState
          title={uiText("No fue posible cargar los lotes")}
          detail={getApiErrorMessage(query.error, uiText("Reintenta la consulta para continuar."))}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <DataView
          rows={rows}
          loading={query.isLoading}
          columns={columns}
          getKey={(item) => item.id}
          caption={uiText("Lotes y vencimientos")}
          emptyReason={filter ? "no-matches" : "no-records"}
          emptyAction={
            filter ? undefined : (
              <Button asChild>
                <Link href="/inventory/restaurant/receipts">{uiText("Registrar una entrada")}</Link>
              </Button>
            )
          }
          onClearFilters={filter ? () => setFilter("") : undefined}
        />
      )}
    </div>
  );
}

/**
 * Cuánto le queda a un lote, dicho en días.
 *
 * Un lote sin fecha de caducidad no es un problema ni una alerta: se muestra
 * su estado y ya. Los que sí caducan se ordenan solos por urgencia porque el
 * tono lo decide la cuenta, no una lista de códigos.
 */
function AlertaDeVencimiento({ dias, status }: { dias: number | null; status: string }) {
  const uiText = useUiText();
  if (dias === null) {
    return <StatusBadge size="sm" tone={restaurantStatusTone(status)} label={uiText(restaurantStatusLabel(status))} />;
  }
  if (dias < 0) {
    return <StatusBadge size="sm" tone="danger" label={uiText("Venció hace {{n}} días", { n: Math.abs(dias) })} />;
  }
  if (dias === 0) return <StatusBadge size="sm" tone="danger" label={uiText("Vence hoy")} />;
  if (dias === 1) return <StatusBadge size="sm" tone="warning" label={uiText("Vence mañana")} />;
  return (
    <StatusBadge
      size="sm"
      tone={dias <= 7 ? "warning" : "neutral"}
      label={uiText("Vence en {{n}} días", { n: dias })}
    />
  );
}

/* ── Kardex ──────────────────────────────────────────────────────────────── */

function MovementView({
  branchId,
  warehouseId,
  currentUserId,
  showCosts,
  selectedMovement,
  onSelect,
}: {
  branchId: string;
  warehouseId?: string;
  currentUserId: string;
  showCosts: boolean;
  selectedMovement: Record<string, unknown> | null;
  onSelect: (movement: Record<string, unknown> | null) => void;
}) {
  const uiText = useUiText();
  const storageKey = `restaurant-kardex-filters:${currentUserId}:${branchId}`;
  const [refresh, setRefresh] = useState(0);
  const stored = readFilters(storageKey);
  const search = String(stored.search ?? "");
  const type = String(stored.type ?? "ALL");
  const from = String(stored.from ?? "");
  const to = String(stored.to ?? "");
  const columns = {
    ...defaultColumns,
    cost: showCosts && defaultColumns.cost,
    ...((stored.columns ?? {}) as Partial<Record<ColumnKey, boolean>>),
  };

  const update = (patch: Record<string, unknown>) => {
    window.localStorage.setItem(storageKey, JSON.stringify({ ...stored, ...patch }));
    setRefresh((value) => value + 1);
  };
  void refresh;

  const query = useQuery({
    queryKey: ["restaurant-movements", branchId, warehouseId, search, type, from, to],
    queryFn: () => fetchRestaurantMovements({ branchId, warehouseId, from: from || undefined, to: to || undefined }),
  });

  const rows = (query.data ?? []).filter(
    (item) =>
      `${item.ingredientName} ${item.reference ?? ""}`.toLowerCase().includes(search.toLowerCase()) &&
      (type === "ALL" || item.type === type),
  );

  const exportRows = rows.map((item) => [
    item.date,
    item.ingredientName,
    item.type,
    item.entry,
    item.exit,
    item.balance,
    showCosts ? item.cost : "",
    item.reference ?? "",
    item.userName ?? "",
  ]);

  // El costo solo se ofrece si el permiso lo permite: la casilla no puede
  // encender una columna que esta persona no tiene derecho a ver.
  const pickable = (Object.keys(columnLabels) as ColumnKey[]).filter((key) => key !== "cost" || showCosts);

  const dataColumns: Array<DataColumn<(typeof rows)[number]>> = [
    columns.ingredient
      ? {
          key: "ingredient",
          header: columnLabels.ingredient,
          priority: "identity" as const,
          render: (item: (typeof rows)[number]) => item.ingredientName,
          sortValue: (item: (typeof rows)[number]) => item.ingredientName,
        }
      : null,
    columns.date
      ? {
          key: "date",
          header: columnLabels.date,
          priority: "primary" as const,
          render: (item: (typeof rows)[number]) => formatDate(item.date),
          sortValue: (item: (typeof rows)[number]) => item.date,
        }
      : null,
    columns.type
      ? {
          key: "type",
          header: columnLabels.type,
          priority: "primary" as const,
          render: (item: (typeof rows)[number]) => (
            <StatusBadge size="sm" tone="neutral" label={uiText(restaurantStatusLabel(item.type))} />
          ),
          sortValue: (item: (typeof rows)[number]) => item.type,
        }
      : null,
    columns.entry
      ? {
          key: "entry",
          header: columnLabels.entry,
          priority: "secondary" as const,
          numeric: true,
          render: (item: (typeof rows)[number]) => formatQuantity(item.entry),
          sortValue: (item: (typeof rows)[number]) => item.entry,
        }
      : null,
    columns.exit
      ? {
          key: "exit",
          header: columnLabels.exit,
          priority: "secondary" as const,
          numeric: true,
          render: (item: (typeof rows)[number]) => formatQuantity(item.exit),
          sortValue: (item: (typeof rows)[number]) => item.exit,
        }
      : null,
    columns.balance
      ? {
          key: "balance",
          header: columnLabels.balance,
          priority: "secondary" as const,
          numeric: true,
          render: (item: (typeof rows)[number]) => (
            <span className="font-mono tabular-figures">{formatQuantity(item.balance)}</span>
          ),
          sortValue: (item: (typeof rows)[number]) => item.balance,
        }
      : null,
    columns.cost && showCosts
      ? {
          key: "cost",
          header: columnLabels.cost,
          priority: "detail" as const,
          numeric: true,
          render: (item: (typeof rows)[number]) => formatMoney(item.cost),
          sortValue: (item: (typeof rows)[number]) => item.cost,
        }
      : null,
    columns.reference
      ? {
          key: "reference",
          header: columnLabels.reference,
          priority: "detail" as const,
          render: (item: (typeof rows)[number]) => item.reference ?? "—",
          sortValue: (item: (typeof rows)[number]) => item.reference ?? "",
        }
      : null,
    columns.user
      ? {
          key: "user",
          header: columnLabels.user,
          priority: "detail" as const,
          render: (item: (typeof rows)[number]) => item.userName ?? "—",
          sortValue: (item: (typeof rows)[number]) => item.userName ?? "",
        }
      : null,
  ].filter(Boolean) as Array<DataColumn<(typeof rows)[number]>>;

  const activeFilters = [search, type !== "ALL" ? type : "", from, to].filter(Boolean).length;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={uiText("Auditoría")}
        title={uiText("Kardex de movimientos")}
        description={uiText("Entradas, salidas y saldos. Los filtros se guardan por persona y sucursal.")}
        meta={<span>{rows.length} {uiText(" movimientos")}</span>}
        actions={
          <Button variant="secondary" onClick={() => exportCsv("kardex.csv", exportRows)}>
            <Download className="size-4" aria-hidden="true" />
            {uiText("Exportar CSV")}</Button>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={(value) => update({ search: value })}
        searchLabel={uiText("Buscar por ingrediente o referencia")}
        activeCount={activeFilters}
        onClear={() => update({ search: "", type: "ALL", from: "", to: "" })}
      >
        <div className="min-w-0">
          <Label htmlFor="kardex-type">{uiText("Tipo")}</Label>
          <select
            id="kardex-type"
            className={SELECT_CLASS}
            value={type}
            onChange={(event) => update({ type: event.target.value })}
          >
            <option value="ALL">{uiText("Todos")}</option>
            {Array.from(new Set((query.data ?? []).map((item) => item.type))).map((item) => (
              <option key={item} value={item}>
                {uiText(restaurantStatusLabel(item))}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0">
          <Label htmlFor="kardex-from">{uiText("Desde")}</Label>
          <Input id="kardex-from" type="date" value={from} onChange={(event) => update({ from: event.target.value })} />
        </div>
        <div className="min-w-0">
          <Label htmlFor="kardex-to">{uiText("Hasta")}</Label>
          <Input id="kardex-to" type="date" value={to} onChange={(event) => update({ to: event.target.value })} />
        </div>
      </FilterBar>

      <details className="rounded-md border border-line bg-surface-1 px-3 py-2 text-sm">
        <summary className="cursor-pointer list-none font-medium text-ink-1">{uiText("Columnas visibles")}</summary>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-3">
          {pickable.map((key) => (
            <label
              key={key}
              className="flex items-center gap-2 text-ink-1"
              style={{ minHeight: "var(--control-h-touch)" }}
            >
              <input
                type="checkbox"
                className="size-4 accent-[hsl(var(--accent-fill))]"
                checked={columns[key]}
                onChange={(event) => update({ columns: { ...columns, [key]: event.target.checked } })}
              />
              {columnLabels[key]}
            </label>
          ))}
        </div>
      </details>

      {query.error ? (
        <ErrorState
          title={uiText("No fue posible cargar el Kardex")}
          detail={getApiErrorMessage(query.error, uiText("Reintenta la consulta para continuar."))}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <DataView
          rows={rows}
          loading={query.isLoading}
          columns={dataColumns}
          getKey={(item) => item.id}
          caption={uiText("Movimientos de inventario")}
          onRowAction={(item) => onSelect(item as unknown as Record<string, unknown>)}
          rowActionLabel={(item) => `Ver el detalle del movimiento de ${item.ingredientName}`}
          emptyReason={activeFilters ? "no-matches" : "no-records"}
          // Un Kardex vacío no significa que falte un filtro: significa que
          // nada ha entrado ni salido todavía de este almacén. La salida es
          // registrar el primer movimiento, no quitar filtros que no hay.
          emptyAction={activeFilters ? undefined : (
            <Button asChild>
              <Link href="/inventory/restaurant/receipts">{uiText("Registrar una entrada")}</Link>
            </Button>
          )}
          onClearFilters={activeFilters ? () => update({ search: "", type: "ALL", from: "", to: "" }) : undefined}
        />
      )}

      {selectedMovement ? (
        <MovementDetail movement={selectedMovement} showCosts={showCosts} onClose={() => onSelect(null)} />
      ) : null}
    </div>
  );
}

/**
 * Detalle de un movimiento.
 *
 * Era un `<aside>` fijo, sin papel de diálogo real y sin cierre con Escape. En
 * el teléfono ocupaba la pantalla entera sin respetar el área segura, así que
 * el último dato quedaba bajo la barra de gestos.
 */
function MovementDetail({
  movement,
  showCosts,
  onClose,
}: {
  movement: Record<string, unknown>;
  showCosts: boolean;
  onClose: () => void;
}) {
  const uiText = useUiText();
  const values: Array<[string, unknown]> = [
    ["Fecha", formatDate(String(movement.date ?? ""))],
    ["Tipo", uiText(restaurantStatusLabel(String(movement.type ?? "")))],
    ["Entrada", formatQuantity(Number(movement.entry ?? 0))],
    ["Salida", formatQuantity(Number(movement.exit ?? 0))],
    ["Saldo", formatQuantity(Number(movement.balance ?? 0))],
    ...(showCosts ? ([["Costo", formatMoney(Number(movement.cost ?? 0))]] as Array<[string, unknown]>) : []),
    ["Referencia", movement.reference ?? "—"],
    ["Usuario", movement.userName ?? "—"],
  ];

  return (
    <>
      <button
        type="button"
        aria-label={uiText("Cerrar el detalle")}
        className="fixed inset-0 z-40 bg-ink-1/40"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={uiText("Detalle del movimiento")}
        onKeyDown={(event) => event.key === "Escape" && onClose()}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-line bg-surface-1 pb-[env(safe-area-inset-bottom)] shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line p-5">
          <div className="min-w-0">
            <p className="text-2xs uppercase tracking-[0.16em] text-ink-3">{uiText("Detalle del movimiento")}</p>
            <h2 className="truncate text-lg font-semibold text-ink-1">
              {String(movement.ingredientName ?? "Ingrediente")}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label={uiText("Cerrar el detalle")}>
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>
        <dl className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5 text-sm">
          {values.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 border-b border-line pb-2">
              <dt className="text-ink-2">{label}</dt>
              <dd className="font-medium text-ink-1">{String(value)}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </>
  );
}

const SELECT_CLASS =
  "w-full min-w-0 rounded-md border border-line-control bg-surface-1 px-3 min-h-[var(--control-h-touch)] sm:min-h-[var(--control-h-base)] text-base text-ink-1 sm:text-sm";

function formatDate(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es", { dateStyle: "medium" });
}

function readFilters(key: string): Record<string, unknown> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "{}");
  } catch {
    return {};
  }
}

function exportCsv(filename: string, rows: unknown[][]) {
  const csv = rows
    .map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
