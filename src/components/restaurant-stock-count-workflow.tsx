"use client";

import { useEffect, useState } from "react";
import { Plus, Send, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  approveRestaurantStockCount,
  cancelRestaurantStockCount,
  createRestaurantStockCount,
  fetchRestaurantIngredients,
  fetchRestaurantStock,
  fetchRestaurantStockCounts,
  getApiErrorMessage,
  submitRestaurantStockCount,
} from "@/lib/backend";
import type { RestaurantStockCountDto } from "@/lib/contracts";
import { useRestaurantInventoryContext } from "@/components/restaurant-inventory-context";
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
} from "@/components/system";
import { RestaurantStatusBadge } from "@/components/restaurant-inventory-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { formatQuantity } from "@/lib/restaurant-operation";
import {
  initialOperationState,
  type OperationImpact,
  type OperationOutcome,
  type OperationState,
  type OperationStepId,
} from "@/lib/operation-flow";

/**
 * Conteo físico, con el patrón universal de operaciones.
 *
 * Qué cambió
 * ----------
 * · Toda la pantalla se reemplazaba por un aro girando mientras cargaban las
 *   tres consultas, y al llegar el contenido la maqueta saltaba. Ahora hay
 *   siluetas del alto que va a ocupar el contenido.
 * · La comparación era una tabla de 620px de ancho mínimo dentro de un
 *   `overflow-x-auto`, justo en la pantalla que más se usa en tablet y
 *   teléfono, contando de pie frente a la estantería.
 * · La aprobación ofrecía tres botones del mismo peso —«Enviar a revisión»,
 *   «Aprobar y aplicar», «Cancelar»— sin decir cuál es el siguiente paso
 *   recomendado, y «Aprobar y aplicar» ajustaba existencias sin ninguna
 *   confirmación, siendo irreversible.
 * · Los conteos pendientes mostraban su estado con el código del backend
 *   (`DRAFT`, `IN_REVIEW`).
 *
 * El contrato del backend no cambia: crear → enviar a revisión → aprobar o
 * cancelar, con el modo ciego tal como estaba.
 */

type CountLine = { ingredientId: string; quantity: string; reason: string };
type Ingredient = { id: string; sku?: string; name?: string; stock?: number; inventoryUnit?: string };
type CountRow = { name: string; unit: string; theoretical: number; counted: number; difference: number };

const SELECT_CLASS = cn(
  "w-full min-w-0 rounded-md border border-line-control bg-surface-1 px-3",
  "min-h-[var(--control-h-touch)] sm:min-h-[var(--control-h-base)]",
  "text-base text-ink-1 sm:text-sm",
);

const emptyLine = (): CountLine => ({ ingredientId: "", quantity: "", reason: "" });

export function RestaurantStockCountWorkflow({ branchId }: { branchId: string }) {
  const { warehouseId, warehouseName, setHasPendingChanges } = useRestaurantInventoryContext();
  const queryClient = useQueryClient();
  const { currentUser } = useAppStore();

  const [blind, setBlind] = useState(true);
  const [step, setStep] = useState<OperationStepId>("record");
  const [documentId, setDocumentId] = useState("");
  const [lines, setLines] = useState<CountLine[]>([emptyLine()]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [outcome, setOutcome] = useState<OperationOutcome | null>(null);

  const ingredients = useQuery({
    queryKey: ["restaurant-count-workflow-ingredients"],
    queryFn: () => fetchRestaurantIngredients({ status: "ACTIVE", pageSize: 200 }),
  });
  const stock = useQuery({
    queryKey: ["restaurant-count-workflow-stock", branchId, warehouseId],
    queryFn: () => fetchRestaurantStock({ branchId, warehouseId }),
    enabled: Boolean(warehouseId),
  });
  const counts = useQuery({
    queryKey: ["restaurant-counts", branchId],
    queryFn: () => fetchRestaurantStockCounts({ branchId }),
  });

  const create = useMutation({
    mutationFn: () =>
      createRestaurantStockCount({
        branchId,
        warehouseId,
        countedAt: new Date().toISOString(),
        blind,
        items: lines.map((line) => ({
          ingredientId: line.ingredientId,
          countedQuantity: Number(line.quantity),
          reason: line.reason || undefined,
        })),
      }),
    onSuccess: (data) => {
      setDocumentId(data.id);
      setAcknowledged(false);
      setStep("confirm");
      void queryClient.invalidateQueries({ queryKey: ["restaurant-counts"] });
    },
  });

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["restaurant-counts"] }),
      queryClient.invalidateQueries({ queryKey: ["restaurant-stock"] }),
      queryClient.invalidateQueries({ queryKey: ["restaurant-dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["restaurant-movements"] }),
      queryClient.invalidateQueries({ queryKey: ["restaurant-phase2-dashboard"] }),
    ]);

  const action = useMutation({
    mutationFn: (type: "submit" | "approve" | "cancel") =>
      type === "submit"
        ? submitRestaurantStockCount(documentId)
        : type === "approve"
          ? approveRestaurantStockCount(documentId)
          : cancelRestaurantStockCount(documentId),
    onSuccess: async (_, type) => {
      setOutcome(
        type === "approve"
          ? {
              status: "success",
              headline: "Conteo aprobado",
              detail: "Las diferencias ya ajustaron las existencias y quedaron como movimientos auditables.",
              nextAction: { label: "Ver los movimientos", href: "/inventory/restaurant/movements" },
            }
          : type === "submit"
            ? {
                status: "success",
                headline: "Conteo enviado a revisión",
                detail: "Todavía no se ajustaron existencias: esperan la aprobación de quien supervisa el almacén.",
              }
            : {
                status: "success",
                headline: "Conteo cancelado",
                detail: "No se aplicó ningún ajuste al inventario.",
              },
      );
      setStep("result");
      toast.success(
        type === "approve" ? "Conteo aprobado" : type === "submit" ? "Conteo enviado" : "Conteo cancelado",
      );
      await refresh();
    },
    onError: (error, type) => {
      setOutcome({
        status: "error",
        headline:
          type === "approve"
            ? "No se pudo aprobar el conteo"
            : type === "submit"
              ? "No se pudo enviar el conteo"
              : "No se pudo cancelar el conteo",
        detail: getApiErrorMessage(error, "El servidor rechazó la operación."),
        retryable: true,
      });
      setStep("result");
    },
  });

  const ingredientOptions = (ingredients.data?.data ?? []) as Ingredient[];
  const stockRows = (stock.data ?? []) as unknown as Ingredient[];

  const invalid =
    !warehouseId || lines.some((line) => !line.ingredientId || line.quantity === "" || Number(line.quantity) < 0);

  useEffect(() => {
    const hasDraft =
      step !== "record" ||
      Boolean(documentId) ||
      lines.some((line) => line.ingredientId || line.quantity || line.reason);
    setHasPendingChanges(hasDraft);
    return () => setHasPendingChanges(false);
  }, [documentId, lines, setHasPendingChanges, step]);

  const updateLine = (index: number, key: keyof CountLine, value: string) =>
    setLines(lines.map((line, current) => (current === index ? { ...line, [key]: value } : line)));

  const rows: CountRow[] = lines.map((line) => {
    const item = stockRows.find((row) => row.id === line.ingredientId);
    const theoretical = Number(item?.stock ?? 0);
    const counted = Number(line.quantity || 0);
    return {
      name:
        item?.name ??
        ingredientOptions.find((option) => option.id === line.ingredientId)?.name ??
        "Ingrediente",
      unit: item?.inventoryUnit ?? "",
      theoretical,
      counted,
      difference: counted - theoretical,
    };
  });

  const differing = rows.filter((row) => row.difference !== 0);

  const impact: OperationImpact = {
    headline: `Ajustar el inventario de ${warehouseName ?? "el almacén"} al conteo físico`,
    affectedCount: differing.length,
    affectedLabel: differing.length === 1 ? "ingrediente con diferencia" : "ingredientes con diferencia",
    lines: rows.map((row) => ({
      label: row.name,
      before: `${formatQuantity(row.theoretical)} ${row.unit}`.trim(),
      after: `${formatQuantity(row.counted)} ${row.unit}`.trim(),
      // Una diferencia negativa es faltante: hay menos de lo que el sistema
      // creía. Una positiva también merece revisión, pero no es una pérdida.
      adverse: row.difference < 0,
    })),
    warnings: differing.length
      ? [
          {
            code: "COUNT_DIFFERENCES",
            message: `${differing.length} ${differing.length === 1 ? "ingrediente cambia" : "ingredientes cambian"} de existencia al aprobar. Los demás quedan igual.`,
          },
        ]
      : [],
    blockers: [],
    responsible: currentUser.fullName,
    // Aprobar aplica los ajustes y genera movimientos auditables: revertirlo
    // exige otro conteo, no un «deshacer».
    irreversible: true,
  };

  const completed: OperationStepId[] = [];
  if (lines.some((line) => line.ingredientId)) completed.push("select");
  if (step !== "record") completed.push("record");
  if (step === "confirm" || step === "result") completed.push("review");
  if (step === "result") completed.push("confirm");

  const operationState: OperationState = {
    ...initialOperationState(),
    step,
    completed,
    impact,
    submitting: action.isPending,
    outcome: outcome ?? undefined,
  };

  const reset = () => {
    setLines([emptyLine()]);
    setDocumentId("");
    setAcknowledged(false);
    setOutcome(null);
    setStep("record");
  };

  const loading = ingredients.isLoading || stock.isLoading || counts.isLoading;
  const loadError = ingredients.error ?? stock.error ?? counts.error;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Control físico"
        title="Conteo físico"
        description="Cuenta en la estantería, compara contra lo que el sistema cree que hay y aprueba el ajuste."
        meta={
          <>
            {warehouseName ? <span>Almacén: {warehouseName}</span> : null}
            <span>{blind ? "Conteo ciego" : "Conteo abierto"}</span>
          </>
        }
      />

      {loading ? (
        <SkeletonRows rows={6} label="Cargando ingredientes y existencias" />
      ) : loadError ? (
        <ErrorState
          title="No fue posible cargar el conteo físico"
          detail={getApiErrorMessage(loadError, "Reintenta la consulta para continuar.")}
          onRetry={() => {
            void ingredients.refetch();
            void stock.refetch();
            void counts.refetch();
          }}
        />
      ) : (
        <>
          <OperationStepper state={operationState} onStepChange={setStep} />

          {!warehouseId ? (
            <InlineNote tone="warning" title="Falta elegir el almacén">
              Sin almacén no hay existencia teórica contra la que comparar. Selecciónalo arriba para empezar.
            </InlineNote>
          ) : null}

          {create.error ? (
            <InlineNote tone="danger" title="No se pudo crear el conteo">
              {getApiErrorMessage(create.error, "Revisa las cantidades e inténtalo de nuevo.")}
            </InlineNote>
          ) : null}

          {step === "select" || step === "record" ? (
            <PageSection
              title="Captura del conteo"
              description="Una línea por ingrediente contado. La observación es opcional."
              boxed
              actions={
                <label className="flex items-center gap-2 text-sm text-ink-2">
                  <input
                    type="checkbox"
                    className="size-4 accent-[hsl(var(--accent-fill))]"
                    checked={blind}
                    onChange={(event) => setBlind(event.target.checked)}
                  />
                  Conteo ciego
                </label>
              }
            >
              {blind ? (
                <InlineNote tone="info" title="Conteo ciego activo">
                  No se muestra la existencia que el sistema tiene registrada hasta el momento de aprobar, para que
                  el conteo no se sesgue.
                </InlineNote>
              ) : null}

              <div className="mt-4 space-y-4">
                {lines.map((line, index) => (
                  <div
                    key={index}
                    className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.4fr)_auto] md:items-end"
                  >
                    <div className="min-w-0">
                      <Label htmlFor={`count-ingredient-${index}`}>Ingrediente</Label>
                      <select
                        id={`count-ingredient-${index}`}
                        className={SELECT_CLASS}
                        value={line.ingredientId}
                        onChange={(event) => updateLine(index, "ingredientId", event.target.value)}
                      >
                        <option value="">Seleccionar</option>
                        {ingredientOptions.map((item) => (
                          <option key={item.id} value={item.id}>
                            {[item.sku, item.name].filter(Boolean).join(" · ")}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor={`count-quantity-${index}`}>Cantidad contada</Label>
                      <Input
                        id={`count-quantity-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={line.quantity}
                        onChange={(event) => updateLine(index, "quantity", event.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`count-reason-${index}`}>Observación</Label>
                      <Input
                        id={`count-reason-${index}`}
                        value={line.reason}
                        placeholder="Opcional"
                        onChange={(event) => updateLine(index, "reason", event.target.value)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      disabled={lines.length === 1}
                      onClick={() => setLines(lines.filter((_, current) => current !== index))}
                      aria-label={`Quitar la línea ${index + 1}`}
                    >
                      <X className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Button size="sm" variant="secondary" onClick={() => setLines([...lines, emptyLine()])}>
                  <Plus className="size-4" aria-hidden="true" />
                  Agregar ingrediente
                </Button>
                <Button size="lg" disabled={invalid} onClick={() => setStep("review")}>
                  Comparar con el sistema
                </Button>
              </div>
            </PageSection>
          ) : null}

          {step === "review" ? (
            <div className="space-y-4">
              {blind ? (
                <>
                  <InlineNote tone="info" title="La comparación queda oculta hasta la aprobación">
                    Elegiste conteo ciego: quien cuenta no ve la existencia registrada. El detalle completo aparece
                    en el paso de aprobación.
                  </InlineNote>
                  <PageSection title="Lo que registraste" boxed>
                    <ul className="divide-y divide-line">
                      {rows.map((row, index) => (
                        <li key={`${row.name}-${index}`} className="flex items-center justify-between gap-4 py-3">
                          <span className="min-w-0 truncate text-ink-1">{row.name}</span>
                          <span className="font-mono text-sm text-ink-1 tabular-figures">
                            {formatQuantity(row.counted)} {row.unit}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </PageSection>
                </>
              ) : (
                <ImpactReview impact={impact} />
              )}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="secondary" onClick={() => setStep("record")}>
                  Corregir la captura
                </Button>
                <Button
                  size="lg"
                  disabled={invalid}
                  loading={create.isPending}
                  loadingLabel="Guardando…"
                  onClick={() => create.mutate()}
                >
                  Crear el conteo
                </Button>
              </div>
            </div>
          ) : null}

          {step === "confirm" ? (
            <div className="space-y-3">
              {/* En el paso de aprobación el modo ciego ya no aplica: quien
                  aprueba necesita ver contra qué se está ajustando. */}
              <ConfirmPanel
                state={operationState}
                operationName="Aprobar y aplicar el conteo"
                onConfirm={() => action.mutate("approve")}
                onBack={() => setStep("review")}
                acknowledged={acknowledged}
                onAcknowledgedChange={setAcknowledged}
              />
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="ghost"
                  disabled={action.isPending}
                  onClick={() => action.mutate("cancel")}
                >
                  Descartar el conteo
                </Button>
                <Button
                  variant="secondary"
                  disabled={action.isPending}
                  onClick={() => action.mutate("submit")}
                >
                  <Send className="size-4" aria-hidden="true" />
                  Enviar a revisión de otra persona
                </Button>
              </div>
            </div>
          ) : null}

          {step === "result" && outcome ? (
            <OperationResultView
              outcome={outcome}
              onRetry={() => action.mutate("approve")}
              onStartAnother={reset}
              startAnotherLabel="Registrar otro conteo"
            />
          ) : null}

          <PendingCounts counts={counts.data ?? []} />
        </>
      )}
    </div>
  );
}

/** Conteos que todavía no ajustaron existencias. */
function PendingCounts({ counts }: { counts: RestaurantStockCountDto[] }) {
  const pending = counts.filter((item) => !["APPROVED", "CANCELLED"].includes(item.status));
  return (
    <PageSection
      title="Conteos pendientes"
      description="Documentos abiertos que todavía no ajustaron el inventario."
      boxed
    >
      {pending.length ? (
        <ul className="divide-y divide-line">
          {pending.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-ink-1">{item.warehouseName}</p>
                <p className="font-mono text-2xs text-ink-3 tabular-figures">
                  {new Date(item.createdAt).toLocaleString()} ·{" "}
                  {item.differences === 1 ? "1 diferencia" : `${item.differences} diferencias`}
                </p>
              </div>
              <RestaurantStatusBadge status={item.status} size="sm" />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          reason="no-records"
          title="No hay conteos pendientes"
          description="Todos los conteos registrados ya se aprobaron o se descartaron."
        />
      )}
    </PageSection>
  );
}
