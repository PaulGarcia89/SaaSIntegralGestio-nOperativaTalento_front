"use client";

import { useUiText } from "@/components/ui-copy";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  confirmRestaurantWaste,
  createRestaurantWaste,
  fetchRestaurantWastes,
  getApiErrorMessage,
  previewRestaurantWaste,
} from "@/lib/backend";
import {
  ConfirmPanel,
  ImpactReview,
  InlineNote,
  OperationResultView,
  OperationStepper,
  PageHeader,
  PageSection,
} from "@/components/system";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";
import {
  formatMoney,
  restaurantOperationImpact,
} from "@/lib/restaurant-operation";
import {
  initialOperationState,
  type OperationOutcome,
  type OperationState,
  type OperationStepId,
} from "@/lib/operation-flow";

/**
 * Registro de merma, con el patrón universal de operaciones.
 *
 * Qué cambió
 * ----------
 * · La etapa de confirmación mostraba el IDENTIFICADOR del documento en un
 *   distintivo: «Documento pendiente de confirmación · 7f3c1a…». Un
 *   identificador de base de datos no le dice nada a quien registra una merma,
 *   y el encargo pide estados comprensibles para personas, no códigos técnicos.
 * · No se avisaba de que la operación es IRREVERSIBLE. Confirmar aplica la
 *   salida al almacén y queda en la auditoría inmutable; revertirlo exige otra
 *   operación en sentido contrario, que no es un «deshacer».
 * · El resumen de impacto era una tabla de 580px de ancho mínimo dentro de un
 *   `overflow-x-auto`: en un teléfono había que arrastrarla a ciegas.
 * · Una existencia resultante negativa se mostraba como un número más. Ahora es
 *   un BLOQUEO: sacar más de lo que hay dejaría el inventario mintiendo sobre
 *   el almacén.
 *
 * El contrato del backend no cambia: se siguen usando previsualizar → crear
 * borrador → confirmar, en ese orden.
 */

type WasteLine = { ingredientId: string; unitId: string; quantity: string };
type Option = { id: string; label: string; unitId?: string };

const reasons = [
  "Vencimiento",
  "Producto dañado",
  "Error de preparación",
  "Merma de producción",
  "Derrame",
  "Conteo físico",
  "Otro",
];

const SELECT_CLASS = cn(
  "w-full min-w-0 rounded-md border border-line-control bg-surface-1 px-3",
  "min-h-[var(--control-h-touch)] sm:min-h-[var(--control-h-base)]",
  "text-base text-ink-1 sm:text-sm",
);

export function RestaurantWasteWorkflow({
  branchId,
  warehouseId,
  warehouseName,
  ingredients,
  units,
  canManage,
}: {
  branchId: string;
  warehouseId?: string;
  warehouseName?: string;
  ingredients: Option[];
  units: Option[];
  canManage: boolean;
}) {
  const uiText = useUiText();
  const queryClient = useQueryClient();
  const { currentUser } = useAppStore();

  const [step, setStep] = useState<OperationStepId>("record");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<WasteLine[]>([{ ingredientId: "", unitId: "", quantity: "" }]);
  const [preview, setPreview] = useState<unknown>(null);
  const [documentId, setDocumentId] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [outcome, setOutcome] = useState<OperationOutcome | null>(null);

  const payload = () => ({
    branchId,
    warehouseId,
    wasteDate: new Date().toISOString(),
    reason,
    notes: notes || undefined,
    items: lines.map((line) => ({
      ingredientId: line.ingredientId,
      quantity: Number(line.quantity),
      unitId: line.unitId,
    })),
  });

  const calculate = useMutation({
    mutationFn: () => previewRestaurantWaste(payload()),
    onSuccess: (data) => {
      setPreview(data);
      setStep("review");
    },
  });

  const prepare = useMutation({
    mutationFn: () => createRestaurantWaste(payload()),
    onSuccess: (data) => {
      setDocumentId(String((data as Record<string, unknown>).id ?? ""));
      setStep("confirm");
    },
  });

  const confirm = useMutation({
    mutationFn: () => confirmRestaurantWaste(documentId),
    onSuccess: async () => {
      setOutcome({
        status: "success",
        headline: "Merma registrada",
        detail: "La existencia y el costo del almacén ya reflejan la salida.",
        nextAction: { label: "Ver los movimientos", href: "/inventory/restaurant/movements" },
      });
      setStep("result");
      toast.success("Merma confirmada");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["restaurant-stock"] }),
        queryClient.invalidateQueries({ queryKey: ["restaurant-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["restaurant-decision-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["restaurant-movements"] }),
        queryClient.invalidateQueries({ queryKey: ["restaurant-wastes"] }),
      ]);
    },
    onError: (error) => {
      setOutcome({
        status: "error",
        headline: "No se pudo confirmar la merma",
        detail: getApiErrorMessage(error, "El servidor rechazó la operación."),
        retryable: true,
      });
      setStep("result");
    },
  });

  const pending = useQuery({
    queryKey: ["restaurant-wastes", branchId, "pending"],
    queryFn: () => fetchRestaurantWastes({ branchId, status: "DRAFT" }),
  });

  const invalid =
    !warehouseId ||
    !reason ||
    !lines.length ||
    lines.some((line) => !line.ingredientId || !line.unitId || Number(line.quantity) <= 0);

  const updateLine = (index: number, key: keyof WasteLine, value: string) =>
    setLines(lines.map((line, current) => (current === index ? { ...line, [key]: value } : line)));

  const selectIngredient = (index: number, value: string) => {
    const ingredient = ingredients.find((item) => item.id === value);
    setLines(
      lines.map((line, current) =>
        current === index ? { ...line, ingredientId: value, unitId: ingredient?.unitId ?? line.unitId } : line,
      ),
    );
  };

  const impact = preview
    ? restaurantOperationImpact({
        headline: `Registrar merma${warehouseName ? ` en ${warehouseName}` : ""}${reason ? ` · ${reason}` : ""}`,
        affectedLabel: lines.length === 1 ? "producto" : "productos",
        preview,
        responsible: currentUser.fullName,
        reducesStock: true,
      })
    : undefined;

  // «Seleccionar» se marca completado en cuanto hay al menos un producto
  // elegido: en esta operación elegir y registrar ocurren en la misma pantalla,
  // y fingir dos pasos separados sería inventarse un recorrido que no existe.
  const completed: OperationStepId[] = [];
  if (lines.some((line) => line.ingredientId)) completed.push("select");
  if (step === "review" || step === "confirm" || step === "result") completed.push("record");
  if (step === "confirm" || step === "result") completed.push("review");
  if (step === "result") completed.push("confirm");

  const operationState: OperationState = {
    ...initialOperationState(),
    step,
    completed,
    impact,
    submitting: confirm.isPending,
    outcome: outcome ?? undefined,
  };

  const reset = () => {
    setLines([{ ingredientId: "", unitId: "", quantity: "" }]);
    setReason("");
    setNotes("");
    setPreview(null);
    setDocumentId("");
    setAcknowledged(false);
    setOutcome(null);
    setStep("record");
  };

  const errorDeRegistro = calculate.error ?? prepare.error;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={uiText("Operación diaria")}
        title={uiText("Registrar merma")}
        description={uiText("Anota lo que se perdió, revisa cómo queda el almacén y confirma.")}
        meta={warehouseName ? <span>{uiText("Almacén: ")}{warehouseName}</span> : null}
      />

      <OperationStepper
        state={operationState}
        onStepChange={(target) => {
          // Solo hacia atrás y solo a un paso ya recorrido: `canNavigateTo` lo
          // decide, así que aquí basta con aplicarlo.
          setStep(target);
        }}
      />

      {!warehouseId ? (
        <InlineNote tone="warning" title={uiText("Falta elegir el almacén")}>
          {uiText("Selecciona un almacén antes de registrar la merma: sin él no se sabe de dónde sale el producto.")}</InlineNote>
      ) : null}

      {errorDeRegistro ? (
        <InlineNote tone="danger" title={uiText("No se pudo preparar la merma")}>
          {getApiErrorMessage(errorDeRegistro, "Revisa las líneas y vuelve a intentarlo.")}
        </InlineNote>
      ) : null}

      {/* ---- Registrar --------------------------------------------------- */}
      {step === "record" ? (
        <PageSection title={uiText("Qué se perdió")} boxed>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="waste-reason">{uiText("Motivo")}</Label>
              <select
                id="waste-reason"
                className={SELECT_CLASS}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              >
                <option value="">{uiText("Seleccionar motivo")}</option>
                {reasons.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="waste-notes">{uiText("Observaciones")}</Label>
              <Input
                id="waste-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder={uiText("Detalle opcional de la merma")}
              />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-ink-1">{uiText("Productos")}</h3>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setLines([...lines, { ingredientId: "", unitId: "", quantity: "" }])}
              >
                <Plus className="size-4" aria-hidden="true" />
                {uiText("Agregar")}</Button>
            </div>

            {lines.map((line, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-lg border border-line p-3 sm:grid-cols-[2fr_1.2fr_1fr_auto]"
              >
                <NativeSelect
                  id={`waste-ingredient-${index}`}
                  label={uiText("Producto")}
                  value={line.ingredientId}
                  options={ingredients}
                  onChange={(value) => selectIngredient(index, value)}
                />
                <NativeSelect
                  id={`waste-unit-${index}`}
                  label={uiText("Unidad")}
                  value={line.unitId}
                  options={units}
                  onChange={(value) => updateLine(index, "unitId", value)}
                />
                <div>
                  <Label htmlFor={`waste-quantity-${index}`}>{uiText("Cantidad")}</Label>
                  <Input
                    id={`waste-quantity-${index}`}
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={line.quantity}
                    onChange={(event) => updateLine(index, "quantity", event.target.value)}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="self-end"
                  onClick={() => setLines(lines.filter((_, current) => current !== index))}
                  disabled={lines.length === 1}
                  aria-label={`Quitar la línea ${index + 1}`}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            className="mt-5 w-full sm:w-auto"
            size="lg"
            disabled={!canManage || invalid}
            loading={calculate.isPending}
            loadingLabel="Calculando…"
            onClick={() => calculate.mutate()}
          >
            {uiText("Revisar impacto")}</Button>
        </PageSection>
      ) : null}

      {/* ---- Revisar impacto --------------------------------------------- */}
      {step === "review" && impact ? (
        <div className="space-y-4">
          <ImpactReview impact={impact} />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setStep("record")}>
              {uiText("Corregir el registro")}</Button>
            <Button
              size="lg"
              disabled={!canManage || impact.blockers.length > 0}
              loading={prepare.isPending}
              loadingLabel={uiText("Preparando…")}
              onClick={() => prepare.mutate()}
            >
              {uiText("Continuar")}</Button>
          </div>
        </div>
      ) : null}

      {/* ---- Confirmar ---------------------------------------------------- */}
      {step === "confirm" && impact ? (
        <ConfirmPanel
          state={operationState}
          operationName="Registrar merma"
          onConfirm={() => confirm.mutate()}
          onBack={() => setStep("review")}
          acknowledged={acknowledged}
          onAcknowledgedChange={setAcknowledged}
        />
      ) : null}

      {/* ---- Resultado ---------------------------------------------------- */}
      {step === "result" && outcome ? (
        <OperationResultView
          outcome={outcome}
          onRetry={() => confirm.mutate()}
          onStartAnother={reset}
          startAnotherLabel="Registrar otra merma"
        />
      ) : null}

      <PendingWasteInbox query={pending} />
    </div>
  );
}

function NativeSelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  const uiText = useUiText();
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      {/* `<select>` nativo a propósito: en un teléfono abre el selector del
          sistema operativo, que es más usable que cualquier lista a medida. */}
      <select id={id} className={SELECT_CLASS} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{uiText("Seleccionar")}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Mermas registradas y todavía sin confirmar.
 *
 * Se muestra siempre que haya alguna, también durante el registro: si alguien
 * dejó un borrador a medias, lo primero que conviene saber es que existe, para
 * no registrar dos veces la misma pérdida.
 */
function PendingWasteInbox({ query }: { query: ReturnType<typeof useQuery<Record<string, unknown>[]>> }) {
  const uiText = useUiText();
  if (query.isLoading || query.error || !query.data?.length) return null;
  return (
    <PageSection
      title={uiText("Mermas sin confirmar")}
      description={uiText("Quedaron preparadas pero todavía no salieron del almacén.")}
      boxed
    >
      <ul className="divide-y divide-line">
        {query.data.map((item) => (
          <li key={String(item.id)} className="flex items-baseline justify-between gap-3 py-2 text-sm">
            <span className="min-w-0 truncate text-ink-1">{String(item.reason ?? "Sin motivo")}</span>
            <span className="shrink-0 font-mono text-ink-2 tabular-figures">
              {formatMoney(Number(item.totalCost ?? item.wasteCost ?? 0))}
            </span>
          </li>
        ))}
      </ul>
    </PageSection>
  );
}
