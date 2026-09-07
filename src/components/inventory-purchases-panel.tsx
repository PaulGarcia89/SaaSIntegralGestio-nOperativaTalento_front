"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import {
  approveInventoryPurchaseOrder,
  createInventoryPurchaseOrder,
  createInventorySupplier,
  fetchInventoryCatalog,
  fetchInventoryPurchaseOrders,
  fetchInventorySuppliers,
  getApiErrorMessage,
  receiveInventoryPurchaseOrder,
} from "@/lib/backend";
import { useAppStore } from "@/store/app-store";
import {
  ConfirmPanel,
  EmptyState,
  ErrorState,
  ImpactReview,
  InlineNote,
  OperationResultView,
  OperationStepper,
  PageHeader,
  PageSection,
  SkeletonRows,
  StatusBadge,
} from "@/components/system";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  formatMoney,
  formatQuantity,
  purchaseStatusLabel,
  purchaseStatusTone,
} from "@/lib/inventory-labels";
import {
  initialOperationState,
  type OperationImpact,
  type OperationOutcome,
  type OperationState,
  type OperationStepId,
} from "@/lib/operation-flow";

type Order = Awaited<ReturnType<typeof fetchInventoryPurchaseOrders>>[number];
type OrderLine = Order["lines"][number];
type CatalogItem = { id: string; name: string; sku: string };

/**
 * Compras y proveedores del inventario de activos.
 *
 * Qué cambió
 * ----------
 * · «Recibir pendiente» daba por recibida, con UN clic, la totalidad de todas
 *   las líneas pendientes y movía existencias reales. No había selección de
 *   líneas ni cantidades parciales —aunque el endpoint las acepta—, no se veía
 *   el impacto, no se pedía confirmación, no se advertía de que no se deshace,
 *   y no había captura de errores: si el servidor fallaba, no pasaba nada
 *   visible y quedaba la impresión de que la mercancía había entrado. Es la
 *   operación con mayor coste de equivocación del módulo y ahora sigue el
 *   patrón universal.
 * · «Aprobar» comprometía el importe de la orden sin mostrarlo.
 * · El estado salía en crudo —`DRAFT`, `APPROVED`, `PARTIALLY_RECEIVED`— y en
 *   un distintivo con el color de marca del tenant, no con el del significado.
 * · El importe se imprimía como `{currency} {totalAmount}`, es decir «USD
 *   1250.5»: código ISO delante y número sin formato.
 * · El alta de orden solo admitía UNA línea, no calculaba el total y enviaba
 *   `NaN` cuando un campo numérico quedaba vacío.
 * · Sin estado vacío, sin estado de error, y dos botones del mismo peso en el
 *   encabezado.
 *
 * El contrato del backend no cambia.
 */
export function InventoryPurchasesPanel() {
  const { currentBranch, currentUser } = useAppStore();
  const queryClient = useQueryClient();

  const [dialog, setDialog] = useState<"supplier" | "order" | null>(null);
  const [receiving, setReceiving] = useState<Order | null>(null);
  const [approving, setApproving] = useState<Order | null>(null);

  const suppliers = useQuery({ queryKey: ["inventory-suppliers"], queryFn: fetchInventorySuppliers });
  const catalog = useQuery({ queryKey: ["inventory-catalog"], queryFn: fetchInventoryCatalog });
  const orders = useQuery({
    queryKey: ["inventory-orders", currentBranch?.id],
    queryFn: () => fetchInventoryPurchaseOrders(currentBranch?.id),
  });

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["inventory-orders"] }),
      queryClient.invalidateQueries({ queryKey: ["inventory-warehouse"] }),
      queryClient.invalidateQueries({ queryKey: ["inventory-analytics"] }),
    ]);

  const approve = useMutation({
    mutationFn: (order: Order) => approveInventoryPurchaseOrder(order.id),
    onSuccess: async () => {
      setApproving(null);
      await refresh();
    },
  });

  const pending = orders.data?.filter((order) => !["RECEIVED", "COMPLETED", "CANCELLED"].includes(order.status)) ?? [];
  const closed = orders.data?.filter((order) => ["RECEIVED", "COMPLETED", "CANCELLED"].includes(order.status)) ?? [];

  const catalogById = useMemo(() => {
    const map = new Map<string, CatalogItem>();
    for (const item of catalog.data ?? []) map.set(item.id, item as CatalogItem);
    return map;
  }, [catalog.data]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Abastecimiento"
        title="Compras y proveedores"
        description="Solicita, aprueba y recibe compras viendo antes su efecto sobre las existencias."
        meta={<span>{currentBranch?.name ?? "Sin sucursal"}</span>}
        actions={
          <Button onClick={() => setDialog("order")}>
            <Plus className="size-4" aria-hidden="true" />
            Nueva orden de compra
          </Button>
        }
      />

      {approve.error ? (
        <InlineNote tone="danger" title="No se pudo aprobar la orden">
          {getApiErrorMessage(approve.error, "El servidor rechazó la aprobación.")}
        </InlineNote>
      ) : null}

      {orders.isLoading ? (
        <SkeletonRows rows={4} label="Cargando las órdenes de compra" />
      ) : orders.isError ? (
        <ErrorState
          title="No fue posible cargar las órdenes"
          detail={getApiErrorMessage(orders.error, "Reintenta la consulta para continuar.")}
          onRetry={() => void orders.refetch()}
        />
      ) : !orders.data?.length ? (
        <EmptyState
          reason="no-records"
          title="Todavía no hay órdenes de compra"
          description="Una orden reserva lo que se va a comprar; al recibirla, la mercancía entra en el almacén."
          action={
            <Button onClick={() => setDialog("order")}>
              <Plus className="size-4" aria-hidden="true" />
              Crear la primera orden
            </Button>
          }
        />
      ) : (
        <>
          <PageSection title="Abiertas" description="Órdenes que aún esperan aprobación o mercancía.">
            {pending.length ? (
              <OrderList
                orders={pending}
                catalogById={catalogById}
                onApprove={setApproving}
                onReceive={setReceiving}
              />
            ) : (
              <InlineNote tone="success" title="Nada pendiente">
                Todas las órdenes están recibidas o cerradas.
              </InlineNote>
            )}
          </PageSection>

          {closed.length ? (
            <PageSection title="Cerradas" description="Historial de compras ya completadas.">
              <OrderList orders={closed} catalogById={catalogById} />
            </PageSection>
          ) : null}
        </>
      )}

      <PageSection
        title="Proveedores"
        description={`${suppliers.data?.length ?? 0} registrados.`}
        actions={
          <Button size="sm" variant="secondary" onClick={() => setDialog("supplier")}>
            <Plus className="size-4" aria-hidden="true" />
            Nuevo proveedor
          </Button>
        }
      >
        {suppliers.isLoading ? (
          <SkeletonRows rows={2} label="Cargando los proveedores" />
        ) : suppliers.data?.length ? (
          <ul className="divide-y divide-line">
            {suppliers.data.map((supplier) => (
              <li key={supplier.id} className="py-3 text-sm text-ink-1">
                {supplier.name}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            reason="no-records"
            title="No hay proveedores"
            description="Una orden de compra necesita un proveedor al que pedírsela."
            action={
              <Button variant="secondary" onClick={() => setDialog("supplier")}>
                Registrar el primero
              </Button>
            }
          />
        )}
      </PageSection>

      <PurchaseDialog
        kind={dialog}
        suppliers={suppliers.data ?? []}
        catalog={(catalog.data ?? []) as CatalogItem[]}
        branchId={currentBranch?.id ?? ""}
        onClose={() => setDialog(null)}
        onSuccess={async () => {
          await refresh();
          setDialog(null);
        }}
      />

      {/* Aprobar compromete el importe de la orden: se enseña antes. */}
      <Dialog open={Boolean(approving)} onOpenChange={(open) => !open && setApproving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Aprobar la orden {approving?.code}?</DialogTitle>
            <DialogDescription>
              Queda autorizada para recibirse. Todavía no entra nada al almacén: eso ocurre al registrar la
              recepción.
            </DialogDescription>
          </DialogHeader>
          <InlineNote tone="warning" title="Importe que se compromete">
            {approving ? formatMoney(approving.totalAmount, approving.currency) : "—"} en{" "}
            {approving?.lines.length === 1 ? "1 línea" : `${approving?.lines.length ?? 0} líneas`}.
          </InlineNote>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setApproving(null)}>
              Todavía no
            </Button>
            <Button
              loading={approve.isPending}
              loadingLabel="Aprobando…"
              onClick={() => approving && approve.mutate(approving)}
            >
              Aprobar la orden
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {receiving ? (
        <ReceiveDialog
          order={receiving}
          catalogById={catalogById}
          responsible={currentUser.fullName}
          onClose={() => setReceiving(null)}
          onDone={refresh}
        />
      ) : null}
    </div>
  );
}

function OrderList({
  orders,
  catalogById,
  onApprove,
  onReceive,
}: {
  orders: Order[];
  catalogById: Map<string, CatalogItem>;
  onApprove?: (order: Order) => void;
  onReceive?: (order: Order) => void;
}) {
  return (
    <ul className="divide-y divide-line">
      {orders.map((order) => {
        const outstanding = order.lines.filter((line) => line.receivedQty < line.quantity);
        return (
          <li key={order.id} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 py-4">
            <div className="min-w-0">
              <p className="font-medium text-ink-1">{order.code}</p>
              <p className="font-mono text-2xs text-ink-3 tabular-figures">
                {order.lines.length === 1 ? "1 línea" : `${order.lines.length} líneas`} ·{" "}
                {formatMoney(order.totalAmount, order.currency)}
                {outstanding.length
                  ? ` · ${outstanding.length === 1 ? "1 línea sin recibir" : `${outstanding.length} líneas sin recibir`}`
                  : " · todo recibido"}
              </p>
              <ul className="mt-2 space-y-0.5 text-2xs text-ink-3">
                {order.lines.slice(0, 3).map((line) => (
                  <li key={line.id} className="truncate">
                    {catalogById.get(line.itemId)?.name ?? "Artículo"} ·{" "}
                    {formatQuantity(line.receivedQty)} de {formatQuantity(line.quantity)} recibidas
                  </li>
                ))}
                {order.lines.length > 3 ? <li>y {order.lines.length - 3} más</li> : null}
              </ul>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <StatusBadge
                size="sm"
                tone={purchaseStatusTone(order.status)}
                label={purchaseStatusLabel(order.status)}
              />
              {onApprove && order.status === "DRAFT" ? (
                <Button size="sm" onClick={() => onApprove(order)}>
                  Aprobar
                </Button>
              ) : null}
              {onReceive && ["APPROVED", "PARTIALLY_RECEIVED"].includes(order.status) && outstanding.length ? (
                <Button size="sm" variant="secondary" onClick={() => onReceive(order)}>
                  Registrar recepción
                </Button>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Recepción de mercancía, con el patrón universal.
 *
 * Se recibe LÍNEA A LÍNEA y en la cantidad que realmente llegó, que es lo que
 * ocurre en un muelle: el proveedor manda ocho de diez y se registran ocho.
 * Antes se daba por recibido todo lo pendiente de golpe.
 */
function ReceiveDialog({
  order,
  catalogById,
  responsible,
  onClose,
  onDone,
}: {
  order: Order;
  catalogById: Map<string, CatalogItem>;
  responsible: string;
  onClose: () => void;
  onDone: () => Promise<unknown>;
}) {
  const outstanding = order.lines.filter((line) => line.receivedQty < line.quantity);

  const [step, setStep] = useState<OperationStepId>("record");
  const [quantities, setQuantities] = useState<Record<string, string>>(() =>
    Object.fromEntries(outstanding.map((line) => [line.id, String(line.quantity - line.receivedQty)])),
  );
  const [acknowledged, setAcknowledged] = useState(false);
  const [outcome, setOutcome] = useState<OperationOutcome | null>(null);

  const entered = outstanding
    .map((line) => ({ line, value: Number(quantities[line.id] ?? "") }))
    .filter((entry) => Number.isFinite(entry.value) && entry.value > 0);

  const overReceived = entered.filter(
    (entry) => entry.value > entry.line.quantity - entry.line.receivedQty,
  );

  const mutation = useMutation({
    mutationFn: () =>
      receiveInventoryPurchaseOrder(
        order.id,
        entered.map((entry) => ({ lineId: entry.line.id, quantity: entry.value })),
      ),
    onSuccess: async () => {
      setOutcome({
        status: "success",
        headline: "Recepción registrada",
        detail: "Las existencias del almacén ya reflejan la mercancía recibida.",
        nextAction: { label: "Ver el almacén", href: "/inventory/warehouse" },
      });
      setStep("result");
      await onDone();
    },
    onError: (error) => {
      setOutcome({
        status: "error",
        headline: "No se pudo registrar la recepción",
        detail: getApiErrorMessage(error, "El servidor rechazó la operación."),
        retryable: true,
      });
      setStep("result");
    },
  });

  const name = (line: OrderLine) => catalogById.get(line.itemId)?.name ?? "Artículo";

  const impact: OperationImpact = {
    headline: `Registrar la recepción de la orden ${order.code}`,
    affectedCount: entered.length,
    affectedLabel: entered.length === 1 ? "artículo" : "artículos",
    lines: entered.map((entry) => ({
      label: name(entry.line),
      before: `${formatQuantity(entry.line.receivedQty)} de ${formatQuantity(entry.line.quantity)} recibidas`,
      after: `${formatQuantity(entry.line.receivedQty + entry.value)} de ${formatQuantity(entry.line.quantity)} recibidas`,
    })),
    cost: {
      label: "Valor de lo que entra",
      amount: formatMoney(
        entered.reduce((total, entry) => total + entry.value * Number(entry.line.unitCost || 0), 0),
        order.currency,
      ),
    },
    warnings:
      entered.length < outstanding.length
        ? [
            {
              code: "PARTIAL",
              message: `Quedan ${outstanding.length - entered.length} ${
                outstanding.length - entered.length === 1 ? "línea" : "líneas"
              } sin recibir. La orden seguirá abierta.`,
            },
          ]
        : [],
    blockers: [
      ...(entered.length === 0
        ? [
            {
              code: "NOTHING_TO_RECEIVE",
              cause: "No has indicado ninguna cantidad recibida.",
              owner: "Quien registra la recepción",
              resolution: "Escribe cuánto llegó de al menos un artículo.",
            },
          ]
        : []),
      ...overReceived.map((entry) => ({
        code: "OVER_RECEIVED",
        cause: `De ${name(entry.line)} se pidieron ${formatQuantity(
          entry.line.quantity - entry.line.receivedQty,
        )} y estás registrando ${formatQuantity(entry.value)}.`,
        owner: "Encargado de compras",
        resolution:
          "Corrige la cantidad, o amplía primero la orden: registrar de más dejaría el inventario reflejando algo que no se pidió.",
        fieldId: `receive-${entry.line.id}`,
      })),
    ],
    responsible,
    // La entrada de mercancía queda como movimiento inmutable: corregirla
    // exige otra operación en sentido contrario, no un «deshacer».
    irreversible: true,
  };

  const operationState: OperationState = {
    ...initialOperationState(),
    step,
    completed: step === "record" ? ["select"] : step === "review" ? ["select", "record"] : ["select", "record", "review"],
    impact,
    submitting: mutation.isPending,
    outcome: outcome ?? undefined,
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Recepción de la orden {order.code}</DialogTitle>
          <DialogDescription>
            Registra cuánto llegó realmente de cada artículo. Puede ser menos de lo pedido.
          </DialogDescription>
        </DialogHeader>

        <OperationStepper state={operationState} onStepChange={setStep} />

        {step === "select" || step === "record" ? (
          <div className="space-y-4">
            <ul className="space-y-3">
              {outstanding.map((line) => {
                const remaining = line.quantity - line.receivedQty;
                return (
                  <li key={line.id} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_10rem] sm:items-end">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink-1">{name(line)}</p>
                      <p className="font-mono text-2xs text-ink-3 tabular-figures">
                        pendiente: {formatQuantity(remaining)} · coste unitario{" "}
                        {formatMoney(line.unitCost, order.currency)}
                      </p>
                    </div>
                    <div>
                      <Label htmlFor={`receive-${line.id}`}>Cantidad recibida</Label>
                      <Input
                        id={`receive-${line.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={quantities[line.id] ?? ""}
                        onChange={(event) =>
                          setQuantities((current) => ({ ...current, [line.id]: event.target.value }))
                        }
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={() => setStep("review")}>Revisar impacto</Button>
            </div>
          </div>
        ) : null}

        {step === "review" ? (
          <div className="space-y-4">
            <ImpactReview impact={impact} />
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => setStep("record")}>
                Corregir las cantidades
              </Button>
              <Button
                disabled={impact.blockers.length > 0}
                onClick={() => {
                  setAcknowledged(false);
                  setStep("confirm");
                }}
              >
                Continuar
              </Button>
            </div>
          </div>
        ) : null}

        {step === "confirm" ? (
          <ConfirmPanel
            state={operationState}
            operationName="Registrar la recepción"
            onConfirm={() => mutation.mutate()}
            onBack={() => setStep("review")}
            acknowledged={acknowledged}
            onAcknowledgedChange={setAcknowledged}
          />
        ) : null}

        {step === "result" && outcome ? (
          <OperationResultView
            outcome={outcome}
            onRetry={() => mutation.mutate()}
            onStartAnother={onClose}
            startAnotherLabel="Cerrar"
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

type DraftLine = { itemId: string; quantity: string; unitCost: string };

function PurchaseDialog({
  kind,
  suppliers,
  catalog,
  branchId,
  onClose,
  onSuccess,
}: {
  kind: "supplier" | "order" | null;
  suppliers: Array<{ id: string; name: string }>;
  catalog: CatalogItem[];
  branchId: string;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [lines, setLines] = useState<DraftLine[]>([{ itemId: "", quantity: "", unitCost: "" }]);
  const set = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }));

  const parsedLines = lines.map((line) => ({
    itemId: line.itemId,
    quantity: Number(line.quantity),
    unitCost: Number(line.unitCost),
  }));
  const validLines = parsedLines.filter(
    (line) => line.itemId && Number.isFinite(line.quantity) && line.quantity > 0 && Number.isFinite(line.unitCost),
  );
  const total = validLines.reduce((sum, line) => sum + line.quantity * line.unitCost, 0);
  const currency = values.currency?.trim() || "USD";

  const mutation = useMutation({
    mutationFn: () =>
      kind === "supplier"
        ? createInventorySupplier({ name: values.name, email: values.email, phone: values.phone, taxId: values.taxId })
        : createInventoryPurchaseOrder({
            branchId,
            supplierId: values.supplierId,
            code: values.code,
            currency,
            budgetAmount: values.budget?.trim() ? Number(values.budget) : undefined,
            notes: values.notes,
            lines: validLines,
          }),
    onSuccess,
  });

  const missing: string[] = [];
  if (kind === "supplier" && !values.name?.trim()) missing.push("el nombre del proveedor");
  if (kind === "order") {
    if (!values.code?.trim()) missing.push("el código de la orden");
    if (!values.supplierId) missing.push("el proveedor");
    if (!validLines.length) missing.push("al menos una línea con artículo, cantidad y coste");
  }

  const budget = values.budget?.trim() ? Number(values.budget) : Number.NaN;
  const overBudget = Number.isFinite(budget) && total > budget;

  return (
    <Dialog open={Boolean(kind)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{kind === "supplier" ? "Nuevo proveedor" : "Nueva orden de compra"}</DialogTitle>
          <DialogDescription>
            {kind === "supplier"
              ? "Los datos del proveedor al que se le pedirán las compras."
              : "Al aprobarla se compromete el importe; la mercancía entra al almacén al registrar la recepción."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {kind === "supplier" ? (
            <>
              <Field id="supplier-name" label="Nombre" value={values.name} onChange={(v) => set("name", v)} />
              <Field id="supplier-email" label="Correo" type="email" value={values.email} onChange={(v) => set("email", v)} />
              <Field id="supplier-phone" label="Teléfono" type="tel" value={values.phone} onChange={(v) => set("phone", v)} />
              <Field id="supplier-tax" label="Identificación fiscal" value={values.taxId} onChange={(v) => set("taxId", v)} />
            </>
          ) : null}

          {kind === "order" ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="order-code" label="Código" value={values.code} onChange={(v) => set("code", v)} />
                <div>
                  <Label htmlFor="order-supplier">Proveedor</Label>
                  <Select value={values.supplierId ?? ""} onValueChange={(value) => set("supplierId", value)}>
                    <SelectTrigger id="order-supplier">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Antes solo se podía pedir un artículo por orden. */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-ink-1">Artículos</p>
                {lines.map((line, index) => (
                  <div key={index} className="grid gap-2 sm:grid-cols-[minmax(0,2fr)_7rem_8rem_auto] sm:items-end">
                    <div className="min-w-0">
                      <Label htmlFor={`order-item-${index}`}>Artículo</Label>
                      <Select
                        value={line.itemId}
                        onValueChange={(value) =>
                          setLines(lines.map((current, i) => (i === index ? { ...current, itemId: value } : current)))
                        }
                      >
                        <SelectTrigger id={`order-item-${index}`}>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {catalog.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} · {item.sku}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`order-qty-${index}`}>Cantidad</Label>
                      <Input
                        id={`order-qty-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={line.quantity}
                        onChange={(event) =>
                          setLines(
                            lines.map((current, i) =>
                              i === index ? { ...current, quantity: event.target.value } : current,
                            ),
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor={`order-cost-${index}`}>Coste unitario</Label>
                      <Input
                        id={`order-cost-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={line.unitCost}
                        onChange={(event) =>
                          setLines(
                            lines.map((current, i) =>
                              i === index ? { ...current, unitCost: event.target.value } : current,
                            ),
                          )
                        }
                      />
                    </div>
                    {lines.length > 1 ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Quitar la línea ${index + 1}`}
                        onClick={() => setLines(lines.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    ) : null}
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setLines([...lines, { itemId: "", quantity: "", unitCost: "" }])}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Agregar artículo
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field id="order-currency" label="Moneda" value={values.currency ?? "USD"} onChange={(v) => set("currency", v)} />
                <Field
                  id="order-budget"
                  label="Presupuesto"
                  type="number"
                  value={values.budget}
                  onChange={(v) => set("budget", v)}
                />
                <Field id="order-notes" label="Notas" value={values.notes} onChange={(v) => set("notes", v)} />
              </div>

              {/* Antes se firmaba la orden sin ver cuánto sumaba. */}
              <div className="flex items-baseline justify-between rounded-md border border-line bg-surface-2 px-4 py-3">
                <span className="text-sm text-ink-2">Total de la orden</span>
                <span className="font-mono text-lg tabular-figures text-ink-1">{formatMoney(total, currency)}</span>
              </div>

              {overBudget ? (
                <InlineNote tone="warning" title="Por encima del presupuesto">
                  El total supera el presupuesto que indicaste ({formatMoney(budget, currency)}).
                </InlineNote>
              ) : null}
            </>
          ) : null}

          {mutation.isError ? (
            <InlineNote tone="danger" title="No se pudo guardar">
              {getApiErrorMessage(mutation.error, "El servidor rechazó los datos.")}
            </InlineNote>
          ) : null}

          {missing.length ? (
            <p className="text-sm text-ink-2">
              Falta {missing.length === 1 ? missing[0] : `${missing.slice(0, -1).join(", ")} y ${missing.at(-1)}`}.
            </p>
          ) : null}

          <Button
            className="w-full"
            disabled={missing.length > 0}
            loading={mutation.isPending}
            loadingLabel="Guardando…"
            onClick={() => mutation.mutate()}
          >
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  id,
  label,
  value = "",
  onChange,
  type = "text",
}: {
  id: string;
  label: string;
  value?: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        inputMode={type === "number" ? "decimal" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
