"use client";

import { useUiText } from "@/components/ui-copy";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, MapPin, Minus, Plus } from "lucide-react";
import {
  adjustInventoryStock,
  countInventoryStock,
  createInventoryLocation,
  downloadInventoryMovements,
  fetchInventoryContext,
  fetchInventoryLocations,
  fetchInventoryWarehouse,
  getApiErrorMessage,
  updateInventoryStockPolicy,
} from "@/lib/backend";
import type { InventoryWarehouseStockDto } from "@/lib/contracts";
import { useAppStore } from "@/store/app-store";
import {
  ConfirmPanel,
  DataView,
  ErrorState,
  ImpactReview,
  InlineNote,
  Metric,
  MetricRow,
  PageHeader,
  PageSection,
  Pagination,
  StatusBadge,
  type DataColumn,
} from "@/components/system";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatQuantity } from "@/lib/inventory-labels";
import { initialOperationState, type OperationImpact, type OperationState } from "@/lib/operation-flow";

type DialogKind = "location" | "add" | "remove" | "count" | "policy" | null;

const PAGE_SIZE = 12;

/**
 * Almacén y existencias no serializadas.
 *
 * Esta pantalla estaba construida pero NO LA IMPORTABA NADIE: la ruta
 * `/inventory/warehouse` hacía `redirect("/inventory")`, así que pulsar
 * «Almacén y stock» en el menú dejaba a la persona en el selector de módulo.
 * Al recuperarla se corrigen los defectos que arrastraba:
 *
 * · El ajuste pedía la cantidad CON SIGNO en un solo campo («Ej.: 5 o -2»).
 *   Un menos olvidado sumaba en vez de restar, y el movimiento es inmutable.
 *   Peor todavía: el campo declaraba `inputMode="numeric"`, que en los
 *   teclados de móvil no ofrece el signo menos, así que desde un teléfono
 *   directamente no se podía restar. Ahora son dos acciones distintas,
 *   «Añadir» y «Retirar», y la cantidad siempre es positiva.
 * · Ni el ajuste ni el conteo mostraban el resultado antes de confirmar,
 *   teniendo el dato delante: un conteo que declara 3 donde el sistema espera
 *   300 se aceptaba sin un solo aviso.
 * · La política permitía guardar un mínimo por encima del punto de reposición
 *   —que nunca dispararía el aviso— sin decir nada.
 * · «Exportar movimientos» estaba pintado como acción PRIMARIA siendo la menos
 *   importante, y se disparaba con `void`: sin indicación de progreso y sin
 *   manejo de error, así que la persona pulsaba y no pasaba nada visible.
 * · «Bajo mínimo» y «Reponer» compartían el mismo tono: dos urgencias
 *   distintas con el mismo aspecto.
 * · El error del formulario era una frase fija que ocultaba la respuesta del
 *   servidor, y la paginación estaba hecha a mano.
 *
 * El contrato del backend no cambia: `adjustInventoryStock` sigue recibiendo
 * una cantidad con signo; lo que cambia es quién le pone el signo.
 */
export function InventoryWarehousePanel() {
  const uiText = useUiText();
  const { can, currentBranch } = useAppStore();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [selected, setSelected] = useState<InventoryWarehouseStockDto | null>(null);

  const canManage = can("asset_inventory.manage");

  const context = useQuery({ queryKey: ["inventory-context"], queryFn: fetchInventoryContext });
  const warehouse = useQuery({
    queryKey: ["inventory-warehouse", currentBranch?.id, search, page],
    queryFn: () =>
      fetchInventoryWarehouse({
        branchId: currentBranch?.id,
        search: search || undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
  });
  const locations = useQuery({
    queryKey: ["inventory-locations", currentBranch?.id],
    queryFn: () => fetchInventoryLocations(currentBranch?.id),
  });

  const exportMovements = useMutation({
    mutationFn: () => downloadInventoryMovements(currentBranch?.id),
  });

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["inventory-warehouse"] }),
      queryClient.invalidateQueries({ queryKey: ["inventory-locations"] }),
      queryClient.invalidateQueries({ queryKey: ["inventory-catalog"] }),
      queryClient.invalidateQueries({ queryKey: ["inventory-analytics"] }),
    ]);
  };

  const belowMinimum = warehouse.data?.items.filter((item) => item.belowMinimum).length ?? 0;
  const needsReorder = warehouse.data?.items.filter((item) => item.needsReorder && !item.belowMinimum).length ?? 0;

  const open = (stock: InventoryWarehouseStockDto, kind: DialogKind) => {
    setSelected(stock);
    setDialog(kind);
  };

  const columns: Array<DataColumn<InventoryWarehouseStockDto>> = [
    {
      key: "item",
      header: uiText("Referencia"),
      priority: "identity",
      render: (stock) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-1">{stock.item.name}</p>
          <p className="truncate font-mono text-2xs text-ink-3">
            {stock.item.sku} · {stock.branch.name}
          </p>
        </div>
      ),
      sortValue: (stock) => stock.item.name,
    },
    {
      key: "state",
      header: "Situación",
      priority: "primary",
      render: (stock) =>
        stock.belowMinimum ? (
          <StatusBadge size="sm" tone="danger" label={uiText("Bajo mínimo")} />
        ) : stock.needsReorder ? (
          <StatusBadge size="sm" tone="warning" label={uiText("Toca reponer")} />
        ) : (
          <StatusBadge size="sm" tone="success" label={uiText("Estable")} />
        ),
      sortValue: (stock) => (stock.belowMinimum ? 0 : stock.needsReorder ? 1 : 2),
    },
    {
      key: "available",
      header: uiText("Disponible"),
      priority: "primary",
      numeric: true,
      render: (stock) => (
        <span className="font-mono tabular-figures">
          {formatQuantity(stock.qtyLocal)} {stock.item.unitOfMeasure}
        </span>
      ),
      sortValue: (stock) => stock.qtyLocal,
    },
    {
      key: "min",
      header: "Mínimo",
      priority: "secondary",
      numeric: true,
      render: (stock) => formatQuantity(stock.minQty),
      sortValue: (stock) => stock.minQty,
    },
    {
      key: "reorder",
      header: "Reponer en",
      priority: "detail",
      numeric: true,
      render: (stock) => formatQuantity(stock.reorderPoint),
      sortValue: (stock) => stock.reorderPoint,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={uiText("Inventario")}
        title={uiText("Almacén y stock")}
        description={uiText("Existencias no serializadas, ubicaciones, conteos y ajustes, con trazabilidad por sucursal.")}
        meta={<span>{currentBranch?.name ?? "Sin sucursal"}</span>}
        actions={
          canManage ? (
            <Button variant="secondary" onClick={() => setDialog("location")}>
              <MapPin className="size-4" aria-hidden="true" />
              {uiText("Nueva ubicación")}</Button>
          ) : undefined
        }
      />

      {belowMinimum > 0 || needsReorder > 0 ? (
        <InlineNote
          tone={belowMinimum > 0 ? "danger" : "warning"}
          title={
            belowMinimum > 0
              ? `${belowMinimum} ${belowMinimum === 1 ? "referencia está" : "referencias están"} por debajo del mínimo`
              : `${needsReorder} ${needsReorder === 1 ? "referencia ha llegado" : "referencias han llegado"} al punto de reposición`
          }
        >
          {uiText("Registra la recepción de una compra o un ajuste para que la existencia vuelva a cuadrar con lo que hay en la estantería.")}</InlineNote>
      ) : null}

      <MetricRow>
        <Metric label={uiText("Referencias en almacén")} value={String(warehouse.data?.total ?? 0)} />
        <Metric
          label={uiText("Bajo mínimo")}
          value={String(belowMinimum)}
          tone={belowMinimum > 0 ? "danger" : undefined}
        />
        <Metric
          label={uiText("Toca reponer")}
          value={String(needsReorder)}
          tone={needsReorder > 0 ? "warning" : undefined}
        />
        <Metric label={uiText("Ubicaciones activas")} value={String(locations.data?.length ?? 0)} />
      </MetricRow>

      <PageSection title={uiText("Buscar")} boxed>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div>
            <Label htmlFor="warehouse-search">{uiText("Referencia")}</Label>
            <Input
              id="warehouse-search"
              value={search}
              placeholder={uiText("SKU o nombre del artículo")}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
          {/* Exportar es una acción secundaria y ahora informa de su progreso
              y de sus fallos: antes se disparaba con `void` y no pasaba nada
              visible ni al empezar ni al fallar. */}
          <Button
            variant="secondary"
            loading={exportMovements.isPending}
            loadingLabel={uiText("Preparando…")}
            onClick={() => exportMovements.mutate()}
          >
            <Download className="size-4" aria-hidden="true" />
            {uiText("Exportar movimientos")}</Button>
        </div>
        {exportMovements.isError ? (
          <div className="mt-3">
            <InlineNote tone="danger" title={uiText("No se pudo exportar")}>
              {getApiErrorMessage(exportMovements.error, "El servidor rechazó la descarga.")}
            </InlineNote>
          </div>
        ) : null}
      </PageSection>

      {warehouse.isError ? (
        <ErrorState
          title={uiText("No fue posible cargar el almacén")}
          detail={getApiErrorMessage(warehouse.error, uiText("Reintenta la consulta para continuar."))}
          onRetry={() => void warehouse.refetch()}
        />
      ) : (
        <>
          <DataView
            rows={warehouse.data?.items ?? []}
            loading={warehouse.isLoading}
            columns={columns}
            getKey={(stock) => stock.id}
            caption={uiText("Existencias por artículo")}
            emptyReason={search ? "no-matches" : "no-records"}
            onClearFilters={search ? () => setSearch("") : undefined}
            rowActions={
              canManage
                ? (stock) => (
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button size="sm" variant="secondary" onClick={() => open(stock, "add")}>
                        <Plus className="size-4" aria-hidden="true" />
                        {uiText("Añadir")}</Button>
                      <Button size="sm" variant="secondary" onClick={() => open(stock, "remove")}>
                        <Minus className="size-4" aria-hidden="true" />
                        {uiText("Retirar")}</Button>
                      <Button size="sm" variant="ghost" onClick={() => open(stock, "count")}>
                        {uiText("Conteo")}</Button>
                      <Button size="sm" variant="ghost" onClick={() => open(stock, "policy")}>
                        {uiText("Alertas")}</Button>
                    </div>
                  )
                : undefined
            }
          />

          {warehouse.data && warehouse.data.total > PAGE_SIZE ? (
            <Pagination
              page={page - 1}
              totalItems={warehouse.data.total}
              pageSize={warehouse.data.pageSize}
              onPageChange={(nextPage) => setPage(nextPage + 1)}
            />
          ) : null}
        </>
      )}

      <WarehouseDialog
        kind={dialog}
        stock={selected}
        branchId={currentBranch?.id || ""}
        branches={context.data?.branches ?? []}
        locations={locations.data ?? []}
        onClose={() => {
          setDialog(null);
          setSelected(null);
        }}
        onSuccess={async () => {
          await refresh();
          setDialog(null);
          setSelected(null);
        }}
      />
    </div>
  );
}

function WarehouseDialog({
  kind,
  stock,
  branchId,
  branches,
  locations,
  onClose,
  onSuccess,
}: {
  kind: DialogKind;
  stock: InventoryWarehouseStockDto | null;
  branchId: string;
  branches: Array<{ id: string; name: string }>;
  locations: Array<{ id: string; name: string; code: string }>;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}) {
  const uiText = useUiText();
  const { currentUser } = useAppStore();
  const [values, setValues] = useState<Record<string, string>>({});
  const [acknowledged, setAcknowledged] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      if (kind === "location") {
        return createInventoryLocation({
          branchId: values.branchId || branchId,
          code: values.code,
          name: values.name,
          type: values.type || undefined,
        });
      }
      if (!stock) throw new Error("Selecciona una referencia de stock");

      // El signo lo pone la acción elegida, no la persona escribiéndolo en el
      // campo: un menos olvidado sumaba donde había que restar.
      if (kind === "add" || kind === "remove") {
        const magnitude = Math.abs(Number(values.quantity));
        return adjustInventoryStock({
          itemId: stock.itemId,
          branchId: stock.branchId,
          quantity: kind === "add" ? magnitude : -magnitude,
          locationId: values.locationId || undefined,
          reason: values.reason,
        });
      }
      if (kind === "count") {
        return countInventoryStock({
          itemId: stock.itemId,
          branchId: stock.branchId,
          countedQty: Number(values.countedQty),
          notes: values.notes || undefined,
        });
      }
      return updateInventoryStockPolicy({
        itemId: stock.itemId,
        branchId: stock.branchId,
        minQty: Number(values.minQty ?? stock.minQty),
        reorderPoint: Number(values.reorderPoint ?? stock.reorderPoint),
        maxQty: values.maxQty ? Number(values.maxQty) : undefined,
      });
    },
    onSuccess,
  });

  const set = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }));

  const title =
    kind === "location"
      ? "Nueva ubicación"
      : kind === "add"
        ? "Añadir existencias"
        : kind === "remove"
          ? "Retirar existencias"
          : kind === "count"
            ? "Registrar un conteo"
            : "Alertas de reposición";

  const impact = kind && stock ? buildImpact(kind, stock, values, currentUser.fullName) : undefined;

  const operationState: OperationState = {
    ...initialOperationState(),
    step: "confirm",
    completed: ["select", "record", "review"],
    impact,
    submitting: mutation.isPending,
  };

  const unit = stock?.item.unitOfMeasure ?? "";

  return (
    <Dialog
      open={Boolean(kind)}
      onOpenChange={(open) => {
        if (!open) {
          setValues({});
          setAcknowledged(false);
          mutation.reset();
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {kind === "location"
              ? "Una ubicación interna para saber en qué estante está cada cosa."
              : "El movimiento queda registrado de forma inmutable y disponible para conciliación y auditoría."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {kind === "location" ? (
            <>
              <Choice
                id="location-branch"
                label={uiText("Sucursal")}
                value={values.branchId || branchId}
                onChange={(value) => set("branchId", value)}
                options={branches.map((branch) => ({ value: branch.id, label: branch.name }))}
              />
              <Field id="location-code" label={uiText("Código")} value={values.code} placeholder={uiText("ALM-01")} onChange={(v) => set("code", v)} />
              <Field id="location-name" label={uiText("Nombre")} value={values.name} placeholder={uiText("Almacén principal")} onChange={(v) => set("name", v)} />
              <Field id="location-type" label={uiText("Tipo")} value={values.type} placeholder={uiText("Almacén, sala, estante…")} onChange={(v) => set("type", v)} />
            </>
          ) : null}

          {(kind === "add" || kind === "remove") && stock ? (
            <>
              <Field
                id="adjust-quantity"
                label={kind === "add" ? `Cuánto entra (${unit})` : `Cuánto sale (${unit})`}
                type="number"
                min="0"
                value={values.quantity}
                onChange={(v) => set("quantity", v)}
              />
              <Choice
                id="adjust-location"
                label={uiText("Ubicación (opcional)")}
                value={values.locationId}
                onChange={(value) => set("locationId", value)}
                options={[
                  { value: "NONE", label: "Sin ubicación concreta" },
                  ...locations.map((location) => ({
                    value: location.id,
                    label: `${location.code} · ${location.name}`,
                  })),
                ]}
              />
              <Field
                id="adjust-reason"
                label={uiText("Motivo")}
                value={values.reason}
                placeholder={kind === "add" ? "Recepción de proveedor, corrección…" : "Rotura, consumo interno, corrección…"}
                onChange={(v) => set("reason", v)}
              />
            </>
          ) : null}

          {kind === "count" && stock ? (
            <>
              <Field
                id="count-quantity"
                label={`Cuánto has contado (${unit})`}
                type="number"
                min="0"
                value={values.countedQty}
                onChange={(v) => set("countedQty", v)}
              />
              <Field
                id="count-notes"
                label={uiText("Observaciones")}
                value={values.notes}
                placeholder={uiText("Opcional")}
                onChange={(v) => set("notes", v)}
              />
            </>
          ) : null}

          {kind === "policy" && stock ? (
            <>
              <Field
                id="policy-min"
                label={uiText("Stock mínimo")}
                type="number"
                min="0"
                value={values.minQty ?? String(stock.minQty)}
                onChange={(v) => set("minQty", v)}
              />
              <Field
                id="policy-reorder"
                label={uiText("Punto de reposición")}
                type="number"
                min="0"
                value={values.reorderPoint ?? String(stock.reorderPoint)}
                onChange={(v) => set("reorderPoint", v)}
              />
              <Field
                id="policy-max"
                label={uiText("Stock máximo")}
                type="number"
                min="0"
                value={values.maxQty ?? (stock.maxQty ? String(stock.maxQty) : "")}
                placeholder={uiText("Opcional")}
                onChange={(v) => set("maxQty", v)}
              />
            </>
          ) : null}

          {mutation.isError ? (
            <InlineNote tone="danger" title={uiText("No se pudo guardar")}>
              {getApiErrorMessage(mutation.error, "El servidor rechazó la operación.")}
            </InlineNote>
          ) : null}

          {impact ? (
            <>
              <ImpactReview impact={impact} />
              <ConfirmPanel
                state={operationState}
                operationName={title}
                onConfirm={() => mutation.mutate()}
                acknowledged={acknowledged}
                onAcknowledgedChange={setAcknowledged}
              />
            </>
          ) : (
            <Button
              className="w-full"
              disabled={!values.code?.trim() || !values.name?.trim()}
              loading={mutation.isPending}
              loadingLabel={uiText("Guardando…")}
              onClick={() => mutation.mutate()}
            >
              {uiText("Crear la ubicación")}</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * El resultado de la operación, con los datos que la pantalla ya tenía.
 *
 * Ninguna de las tres operaciones de stock lo mostraba, teniendo `qtyLocal`
 * delante.
 */
function buildImpact(
  kind: Exclude<DialogKind, null>,
  stock: InventoryWarehouseStockDto,
  values: Record<string, string>,
  responsible: string,
): OperationImpact | undefined {
  if (kind === "location") return undefined;

  const unit = stock.item.unitOfMeasure;
  const blockers: OperationImpact["blockers"] = [];
  const warnings: OperationImpact["warnings"] = [];
  const lines: OperationImpact["lines"] = [];

  if (kind === "add" || kind === "remove") {
    const magnitude = Math.abs(Number(values.quantity));
    const valid = Number.isFinite(magnitude) && magnitude > 0;
    const after = kind === "add" ? stock.qtyLocal + magnitude : stock.qtyLocal - magnitude;

    lines.push({
      label: stock.item.name,
      before: `${formatQuantity(stock.qtyLocal)} ${unit}`,
      after: valid ? `${formatQuantity(after)} ${unit}` : "—",
      adverse: kind === "remove",
    });

    if (!valid) {
      blockers.push({
        code: "NO_QUANTITY",
        cause: "No has indicado cuánto.",
        owner: "Quien registra el movimiento",
        resolution: "Escribe una cantidad mayor que cero.",
        fieldId: "adjust-quantity",
      });
    } else if (after < 0) {
      // Dejar la existencia en negativo haría que el inventario mintiera
      // sobre lo que hay en la estantería.
      blockers.push({
        code: "NEGATIVE_STOCK",
        cause: `Solo hay ${formatQuantity(stock.qtyLocal)} ${unit} y estás retirando ${formatQuantity(magnitude)}.`,
        owner: "Encargado del almacén",
        resolution: "Registra primero la entrada que falta, o retira como mucho lo que hay.",
        fieldId: "adjust-quantity",
      });
    } else if (valid && after < stock.minQty) {
      warnings.push({
        code: "BELOW_MINIMUM",
        message: `Quedará por debajo del mínimo (${formatQuantity(stock.minQty)} ${unit}).`,
      });
    }

    if (!values.reason?.trim()) {
      blockers.push({
        code: "NO_REASON",
        cause: "No has escrito el motivo del ajuste.",
        owner: "Quien registra el movimiento",
        resolution: "Explica por qué cambia la existencia: es lo que quedará en la auditoría.",
        fieldId: "adjust-reason",
      });
    }
  }

  if (kind === "count") {
    const counted = Number(values.countedQty);
    const valid = Number.isFinite(counted) && counted >= 0 && values.countedQty?.trim() !== "";
    const difference = valid ? counted - stock.qtyLocal : 0;

    lines.push({
      label: stock.item.name,
      before: `${formatQuantity(stock.qtyLocal)} ${unit} según el sistema`,
      after: valid ? `${formatQuantity(counted)} ${unit} contados` : "—",
      adverse: difference < 0,
    });

    if (!valid) {
      blockers.push({
        code: "NO_COUNT",
        cause: "No has indicado la cantidad contada.",
        owner: "Quien hace el conteo",
        resolution: "Escribe cuántas unidades hay realmente.",
        fieldId: "count-quantity",
      });
    } else if (difference !== 0) {
      lines.push({
        label: "Diferencia",
        before: "0",
        after: `${difference > 0 ? "+" : "−"}${formatQuantity(Math.abs(difference))} ${unit}`,
        adverse: difference < 0,
      });
      // Un conteo muy alejado de lo esperado suele ser un dedazo, no un
      // descuadre real: se avisa antes de aplicarlo, no después.
      const ratio = stock.qtyLocal > 0 ? Math.abs(difference) / stock.qtyLocal : 1;
      if (ratio >= 0.5) {
        warnings.push({
          code: "LARGE_GAP",
          message: `La diferencia es de un ${Math.round(ratio * 100)} % sobre lo esperado. Comprueba que no falte un dígito.`,
        });
      }
    }
  }

  if (kind === "policy") {
    const min = Number(values.minQty ?? stock.minQty);
    const reorder = Number(values.reorderPoint ?? stock.reorderPoint);

    lines.push({
      label: "Stock mínimo",
      before: `${formatQuantity(stock.minQty)} ${unit}`,
      after: Number.isFinite(min) ? `${formatQuantity(min)} ${unit}` : "—",
    });
    lines.push({
      label: "Punto de reposición",
      before: `${formatQuantity(stock.reorderPoint)} ${unit}`,
      after: Number.isFinite(reorder) ? `${formatQuantity(reorder)} ${unit}` : "—",
    });

    if (Number.isFinite(min) && Number.isFinite(reorder) && min > reorder) {
      // Con el mínimo por encima del punto de reposición, el aviso de
      // «toca reponer» nunca llegaría a tiempo.
      blockers.push({
        code: "MIN_ABOVE_REORDER",
        cause: `El mínimo (${formatQuantity(min)}) es mayor que el punto de reposición (${formatQuantity(reorder)}).`,
        owner: "Encargado del almacén",
        resolution:
          "El punto de reposición debe estar por encima del mínimo: es el aviso que llega antes de quedarse corto.",
        fieldId: "policy-reorder",
      });
    }

    if (Number.isFinite(min) && stock.qtyLocal < min) {
      warnings.push({
        code: "ALREADY_BELOW",
        message: `Con este mínimo, la referencia pasa a estar bajo mínimo desde ya (hay ${formatQuantity(stock.qtyLocal)} ${unit}).`,
      });
    }
  }

  return {
    headline:
      kind === "policy"
        ? `Cambiar las alertas de ${stock.item.name}`
        : kind === "count"
          ? `Cuadrar ${stock.item.name} con el conteo físico`
          : `${kind === "add" ? "Añadir a" : "Retirar de"} ${stock.item.name}`,
    affectedCount: 1,
    affectedLabel: "referencia",
    lines,
    warnings,
    blockers,
    responsible,
    // La política solo cambia umbrales de aviso; los movimientos de stock son
    // inmutables y corregirlos exige otro movimiento.
    irreversible: kind !== "policy",
  };
}

function Field({
  id,
  label,
  value = "",
  onChange,
  placeholder,
  type = "text",
  min,
}: {
  id: string;
  label: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  min?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        min={min}
        step={type === "number" ? "0.01" : undefined}
        inputMode={type === "number" ? "decimal" : undefined}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function Choice({
  id,
  label,
  value = "",
  onChange,
  options,
}: {
  id: string;
  label: string;
  value?: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  const uiText = useUiText();
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={(next) => onChange(next === "NONE" ? "" : next)}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={uiText("Seleccionar")} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
