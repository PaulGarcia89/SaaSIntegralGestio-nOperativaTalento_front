"use client";

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
  const { currentBranch, currentUser, can } = useAppStore();
  const { warehouseId, warehouseName } = useRestaurantInventoryContext();
  const [selectedMovement, setSelectedMovement] = useState<Record<string, unknown> | null>(null);

  if (!currentBranch) {
    return (
      <BlockedState
        title="Falta elegir la sucursal"
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
  const params = useSearchParams();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(() => params.get("filter") ?? "ALL");

  const query = useQuery({
    queryKey: ["restaurant-stock", branchId, warehouseId, search],
    queryFn: () => fetchRestaurantStock({ branchId, warehouseId, search }),
  });

  const sourceRows = query.data ?? [];
  const hasMovementSignal = sourceRows.some((item) => {
    const row = item as unknown as Record<string, unknown>;
    return (
      Object.prototype.hasOwnProperty.call(row, "lastMovementAt") ||
      Object.prototype.hasOwnProperty.call(row, "lastMovementDate")
    );
  });

  const rows = sourceRows.filter((item) => {
    const row = item as unknown as Record<string, unknown>;
    const low = item.stock < item.minimumStock;
    const expired = String(item.status ?? "").toUpperCase().includes("EXPIRED");
    const lastMovement = row.lastMovementAt ?? row.lastMovementDate;
    const noMovement = hasMovementSignal && !lastMovement;
    return filter === "LOW" ? low : filter === "EXPIRED" ? expired : filter === "NO_MOVEMENT" ? noMovement : true;
  });

  const columns: Array<DataColumn<(typeof rows)[number]>> = [
    {
      key: "name",
      header: "Ingrediente",
      priority: "identity",
      render: (item) => item.name,
      sortValue: (item) => item.name,
    },
    {
      key: "stock",
      header: "Existencia",
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
      header: "Situación",
      priority: "primary",
      render: (item) =>
        item.stock < item.minimumStock ? (
          <StatusBadge size="sm" tone="danger" label="Bajo mínimo" />
        ) : (
          <StatusBadge
            size="sm"
            tone={restaurantStatusTone(String(item.status ?? ""))}
            label={restaurantStatusLabel(String(item.status ?? ""))}
          />
        ),
      sortValue: (item) => (item.stock < item.minimumStock ? 0 : 1),
    },
    {
      key: "minimum",
      header: "Mínimo",
      priority: "secondary",
      numeric: true,
      render: (item) => formatQuantity(item.minimumStock),
      sortValue: (item) => item.minimumStock,
    },
    ...(showCosts
      ? [
          {
            key: "cost",
            header: "Costo promedio",
            priority: "secondary" as const,
            numeric: true,
            render: (item: (typeof rows)[number]) => formatMoney(item.averageCost),
            sortValue: (item: (typeof rows)[number]) => item.averageCost,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Control"
        title="Existencias"
        description="Busca ingredientes y detecta riesgos de mínimo, vencimiento o falta de movimiento."
        meta={
          <>
            <span>{warehouseName}</span>
            <span>{rows.length} registros</span>
          </>
        }
        actions={
          <Button
            variant="secondary"
            onClick={() =>
              exportCsv(
                "existencias.csv",
                rows.map((item) => [
                  item.name,
                  item.stock,
                  item.inventoryUnit,
                  item.minimumStock,
                  showCosts ? item.averageCost : "",
                ]),
              )
            }
          >
            <Download className="size-4" aria-hidden="true" />
            Exportar CSV
          </Button>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchLabel="Buscar ingrediente por nombre o SKU"
        activeCount={filter !== "ALL" ? 1 : 0}
        onClear={() => setFilter("ALL")}
      >
        <div className="min-w-0">
          <Label htmlFor="stock-filter">Alertas</Label>
          <select
            id="stock-filter"
            className={SELECT_CLASS}
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="ALL">Todas</option>
            <option value="LOW">Bajo mínimo</option>
            <option value="EXPIRED">Vencidos</option>
            <option value="NO_MOVEMENT" disabled={!hasMovementSignal}>
              Sin movimiento{!hasMovementSignal ? " (no disponible)" : ""}
            </option>
          </select>
        </div>
      </FilterBar>

      {filter === "NO_MOVEMENT" && !hasMovementSignal ? (
        <InlineNote tone="info" title="Esta señal no está disponible">
          El servidor no entrega la fecha del último movimiento en este listado, así que no se puede saber cuáles
          llevan tiempo quietos.
        </InlineNote>
      ) : null}

      {query.error ? (
        <ErrorState
          title="No fue posible cargar las existencias"
          detail={getApiErrorMessage(query.error, "Reintenta la consulta para continuar.")}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <DataView
          rows={rows}
          loading={query.isLoading}
          columns={columns}
          getKey={(item) => item.id}
          caption="Existencias por ingrediente"
          emptyReason={search || filter !== "ALL" ? "no-matches" : "no-records"}
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
    </div>
  );
}

/* ── Lotes ───────────────────────────────────────────────────────────────── */

const EXPIRY_FILTERS: Array<[string, string]> = [
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
  const params = useSearchParams();
  const [filter, setFilter] = useState(() => params.get("filter") ?? "");

  const query = useQuery({
    queryKey: ["restaurant-lots", branchId, warehouseId, filter],
    queryFn: () => fetchRestaurantLots({ branchId, warehouseId, expiry: filter || undefined }),
  });

  const rows = query.data ?? [];

  const columns: Array<DataColumn<(typeof rows)[number]>> = [
    {
      key: "ingredient",
      header: "Ingrediente",
      priority: "identity",
      render: (item) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-1">{item.ingredientName}</p>
          <p className="truncate font-mono text-2xs text-ink-3">lote {item.lotCode}</p>
        </div>
      ),
      sortValue: (item) => item.ingredientName,
    },
    {
      key: "status",
      header: "Alerta",
      priority: "primary",
      render: (item) => (
        <StatusBadge
          size="sm"
          tone={restaurantStatusTone(item.status)}
          label={restaurantStatusLabel(item.status)}
        />
      ),
      sortValue: (item) => item.status,
    },
    {
      key: "expires",
      header: "Vencimiento",
      priority: "primary",
      render: (item) => formatDate(item.expiresAt),
      sortValue: (item) => item.expiresAt,
    },
    {
      key: "quantity",
      header: "Cantidad",
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
      header: "Almacén",
      priority: "secondary",
      render: (item) => item.warehouseName,
      sortValue: (item) => item.warehouseName,
    },
    ...(showCosts
      ? [
          {
            key: "cost",
            header: "Costo",
            priority: "detail" as const,
            numeric: true,
            render: (item: (typeof rows)[number]) => formatMoney(item.cost),
            sortValue: (item: (typeof rows)[number]) => item.cost,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Trazabilidad"
        title="Lotes y vencimientos"
        description="Prioriza los lotes vencidos y los que están por vencer antes de tener que registrar una merma."
        meta={<span>{rows.length} lotes</span>}
        actions={
          <Button
            variant="secondary"
            onClick={() =>
              exportCsv(
                "lotes.csv",
                rows.map((item) => [
                  item.ingredientName,
                  item.lotCode,
                  item.expiresAt,
                  item.remainingQuantity,
                  showCosts ? item.cost : "",
                  item.status,
                ]),
              )
            }
          >
            <Download className="size-4" aria-hidden="true" />
            Exportar CSV
          </Button>
        }
      />

      {/* Los atajos de vencimiento caben en una fila que se desliza sola en el
          teléfono, sin apilarse en cuatro líneas. */}
      <nav aria-label="Filtrar por vencimiento">
        <ul className="min-w-0 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {EXPIRY_FILTERS.map(([id, label]) => (
            <li key={id || "all"} className="shrink-0">
              <Button
                size="sm"
                variant={filter === id ? "default" : "secondary"}
                aria-pressed={filter === id}
                onClick={() => setFilter(id)}
              >
                {label}
              </Button>
            </li>
          ))}
        </ul>
      </nav>

      {query.error ? (
        <ErrorState
          title="No fue posible cargar los lotes"
          detail={getApiErrorMessage(query.error, "Reintenta la consulta para continuar.")}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <DataView
          rows={rows}
          loading={query.isLoading}
          columns={columns}
          getKey={(item) => item.id}
          caption="Lotes y vencimientos"
          emptyReason={filter ? "no-matches" : "no-records"}
          onClearFilters={filter ? () => setFilter("") : undefined}
        />
      )}
    </div>
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
            <StatusBadge size="sm" tone="neutral" label={restaurantStatusLabel(item.type)} />
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
        eyebrow="Auditoría"
        title="Kardex de movimientos"
        description="Entradas, salidas y saldos. Los filtros se guardan por persona y sucursal."
        meta={<span>{rows.length} movimientos</span>}
        actions={
          <Button variant="secondary" onClick={() => exportCsv("kardex.csv", exportRows)}>
            <Download className="size-4" aria-hidden="true" />
            Exportar CSV
          </Button>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={(value) => update({ search: value })}
        searchLabel="Buscar por ingrediente o referencia"
        activeCount={activeFilters}
        onClear={() => update({ search: "", type: "ALL", from: "", to: "" })}
      >
        <div className="min-w-0">
          <Label htmlFor="kardex-type">Tipo</Label>
          <select
            id="kardex-type"
            className={SELECT_CLASS}
            value={type}
            onChange={(event) => update({ type: event.target.value })}
          >
            <option value="ALL">Todos</option>
            {Array.from(new Set((query.data ?? []).map((item) => item.type))).map((item) => (
              <option key={item} value={item}>
                {restaurantStatusLabel(item)}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0">
          <Label htmlFor="kardex-from">Desde</Label>
          <Input id="kardex-from" type="date" value={from} onChange={(event) => update({ from: event.target.value })} />
        </div>
        <div className="min-w-0">
          <Label htmlFor="kardex-to">Hasta</Label>
          <Input id="kardex-to" type="date" value={to} onChange={(event) => update({ to: event.target.value })} />
        </div>
      </FilterBar>

      <details className="rounded-md border border-line bg-surface-1 px-3 py-2 text-sm">
        <summary className="cursor-pointer list-none font-medium text-ink-1">Columnas visibles</summary>
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
          title="No fue posible cargar el Kardex"
          detail={getApiErrorMessage(query.error, "Reintenta la consulta para continuar.")}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <DataView
          rows={rows}
          loading={query.isLoading}
          columns={dataColumns}
          getKey={(item) => item.id}
          caption="Movimientos de inventario"
          onRowAction={(item) => onSelect(item as unknown as Record<string, unknown>)}
          rowActionLabel={(item) => `Ver el detalle del movimiento de ${item.ingredientName}`}
          emptyReason={activeFilters ? "no-matches" : "no-records"}
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
  const values: Array<[string, unknown]> = [
    ["Fecha", formatDate(String(movement.date ?? ""))],
    ["Tipo", restaurantStatusLabel(String(movement.type ?? ""))],
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
        aria-label="Cerrar el detalle"
        className="fixed inset-0 z-40 bg-ink-1/40"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Detalle del movimiento"
        onKeyDown={(event) => event.key === "Escape" && onClose()}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-line bg-surface-1 pb-[env(safe-area-inset-bottom)] shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line p-5">
          <div className="min-w-0">
            <p className="text-2xs uppercase tracking-[0.16em] text-ink-3">Detalle del movimiento</p>
            <h2 className="truncate text-lg font-semibold text-ink-1">
              {String(movement.ingredientName ?? "Ingrediente")}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar el detalle">
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
