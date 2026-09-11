"use client";

import { useUiText } from "@/components/ui-copy";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  confirmRestaurantProduction,
  createRestaurantProduction,
  fetchRestaurantProductions,
  getApiErrorMessage,
  previewRestaurantProduction,
} from "@/lib/backend";
import type { RestaurantProductionDto } from "@/lib/contracts";
import {
  ConfirmPanel,
  EmptyState,
  ImpactReview,
  InlineNote,
  OperationResultView,
  OperationStepper,
  PageHeader,
  PageSection,
} from "@/components/system";
import { RestaurantQueryState, RestaurantStatusBadge } from "@/components/restaurant-inventory-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { formatMoney, formatQuantity } from "@/lib/restaurant-operation";
import {
  initialOperationState,
  type OperationBlocker,
  type OperationImpact,
  type OperationImpactLine,
  type OperationOutcome,
  type OperationState,
  type OperationStepId,
} from "@/lib/operation-flow";

/**
 * Producción de recetas, con el patrón universal de operaciones.
 *
 * Qué cambió
 * ----------
 * · Había SEIS etapas para cinco rótulos, y una de ellas —«3. Ingredientes
 *   requeridos»— no mostraba ningún ingrediente: sólo la frase «el backend
 *   calculará cantidades, conversiones y costo». Era un clic que no informaba
 *   nada, así que desaparece. Quedan los cinco pasos del patrón.
 * · La comparación de existencias vivía en una tabla de 620px de ancho mínimo
 *   dentro de un `overflow-x-auto`: en un teléfono había que arrastrarla a
 *   ciegas. Ahora es el impacto línea a línea, que se lee en cualquier ancho.
 * · El faltante era un aviso que decía «puedes continuar sólo con una
 *   justificación de al menos 10 caracteres si el permiso de override está
 *   habilitado»: describía la regla, no la salida. Ahora es un BLOQUEO con su
 *   causa, su responsable y su solución, y se levanta solo al escribir la
 *   justificación que el backend exige.
 * · No se advertía que la operación es IRREVERSIBLE, siendo que confirma y
 *   aplica los movimientos de TODAS las recetas seleccionadas.
 * · La bandeja de pendientes pintaba el estado con su código en inglés
 *   (`DRAFT`, `IN_PROGRESS`).
 * · Si la tercera receta fallaba, las dos primeras ya se habían aplicado y la
 *   pantalla no lo decía. Ahora el resultado distingue el éxito del éxito
 *   PARCIAL y nombra qué recetas quedaron sin aplicar.
 *
 * El contrato del backend no cambia: previsualizar → crear borrador →
 * confirmar, una vez por receta, con la justificación cuando hay faltante.
 */

type RecipeOption = { id: string; label: string };
type ProductionLine = { recipeId: string; plannedQuantity: string; actualYield: string };
type ProductionPreview = Awaited<ReturnType<typeof previewRestaurantProduction>>;

/** Mínimo que exige el backend para autorizar una producción con faltante. */
const JUSTIFICATION_MIN = 10;

const SELECT_CLASS = cn(
  "w-full min-w-0 rounded-md border border-line-control bg-surface-1 px-3",
  "min-h-[var(--control-h-touch)] sm:min-h-[var(--control-h-base)]",
  "text-base text-ink-1 sm:text-sm",
);

const emptyLine = (): ProductionLine => ({ recipeId: "", plannedQuantity: "1", actualYield: "1" });

export function RestaurantProductionWorkflow({
  branchId,
  warehouseId,
  warehouseName,
  recipeOptions,
  canManage,
}: {
  branchId: string;
  warehouseId?: string;
  warehouseName?: string;
  recipeOptions: RecipeOption[];
  canManage: boolean;
}) {
  const uiText = useUiText();
  const queryClient = useQueryClient();
  const { currentUser } = useAppStore();

  const [step, setStep] = useState<OperationStepId>("select");
  const [lines, setLines] = useState<ProductionLine[]>([emptyLine()]);
  const [previews, setPreviews] = useState<ProductionPreview[]>([]);
  const [justification, setJustification] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [outcome, setOutcome] = useState<OperationOutcome | null>(null);

  const payload = (line: ProductionLine) => ({
    branchId,
    warehouseId,
    recipeId: line.recipeId,
    plannedQuantity: Number(line.plannedQuantity),
    actualYield: Number(line.actualYield),
    productionDate: new Date().toISOString(),
  });

  const recipeLabel = (line: ProductionLine, index: number) =>
    previews[index]?.preparationName ||
    recipeOptions.find((option) => option.id === line.recipeId)?.label ||
    `Receta ${index + 1}`;

  const calculate = useMutation({
    mutationFn: () => Promise.all(lines.map((line) => previewRestaurantProduction(payload(line)))),
    onSuccess: (data) => {
      setPreviews(data);
      setStep("review");
    },
  });

  const prepare = () => {
    setAcknowledged(false);
    setStep("confirm");
  };

  /**
   * Cada receta es su propio documento en el backend: se crea el borrador y se
   * confirma, una por una. Si una falla a mitad de camino, las anteriores YA
   * están aplicadas; por eso se lleva la cuenta y se devuelve, en vez de
   * propagar un error que haría creer que no se aplicó nada.
   */
  const confirm = useMutation({
    mutationFn: async () => {
      const applied: string[] = [];
      const failures: string[] = [];
      for (const [index, line] of lines.entries()) {
        const label = recipeLabel(line, index);
        try {
          const draft = await createRestaurantProduction({
            ...payload(line),
            justification: justification || undefined,
          });
          await confirmRestaurantProduction(draft.id);
          applied.push(label);
        } catch (error) {
          failures.push(`${label}: ${getApiErrorMessage(error, "el servidor rechazó la producción")}`);
        }
      }
      return { applied, failures };
    },
    onSuccess: async ({ applied, failures }) => {
      if (failures.length === 0) {
        setOutcome({
          status: "success",
          headline: applied.length === 1 ? "Producción registrada" : `${applied.length} producciones registradas`,
          detail: "Existencias, costos y movimientos ya reflejan la operación.",
          nextAction: { label: "Ver los movimientos", href: "/inventory/restaurant/movements" },
        });
        toast.success("Producción confirmada");
      } else if (applied.length === 0) {
        setOutcome({
          status: "error",
          headline: "No se registró ninguna producción",
          detail: failures.join(" · "),
          retryable: true,
        });
      } else {
        setOutcome({
          status: "partial",
          headline: `Se aplicaron ${applied.length} de ${lines.length} producciones`,
          detail:
            "Las que sí se aplicaron ya movieron existencias y no se deshacen desde aquí. Vuelve a registrar solo las que fallaron.",
          failures,
        });
      }
      setStep("result");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["restaurant-stock"] }),
        queryClient.invalidateQueries({ queryKey: ["restaurant-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["restaurant-decision-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["restaurant-movements"] }),
        queryClient.invalidateQueries({ queryKey: ["restaurant-productions"] }),
        queryClient.invalidateQueries({ queryKey: ["restaurant-phase2-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["restaurant-recipes"] }),
        queryClient.invalidateQueries({ queryKey: ["restaurant-recipe-cost"] }),
      ]);
    },
  });

  const pending = useQuery({
    queryKey: ["restaurant-productions", branchId, "pending"],
    queryFn: async () =>
      (await fetchRestaurantProductions({ branchId })).filter((item) =>
        ["DRAFT", "PENDING", "IN_PROGRESS"].includes(item.status),
      ),
  });

  const recipesChosen = lines.every((line) => line.recipeId) && lines.length > 0;
  const quantitiesValid = lines.every(
    (line) => Number(line.plannedQuantity) > 0 && Number(line.actualYield) > 0,
  );
  const ready = Boolean(warehouseId) && recipesChosen && quantitiesValid;

  const justificationReady = justification.trim().length >= JUSTIFICATION_MIN;

  /**
   * El impacto se arma con lo que el backend YA devuelve por ingrediente:
   * cuánto hay y cuánto se consume. La resta no es una estimación nuestra, es
   * la aritmética de esos dos campos.
   */
  const impact: OperationImpact | undefined = previews.length
    ? (() => {
        const many = previews.length > 1;
        const impactLines: OperationImpactLine[] = [];
        const shortages: string[] = [];

        previews.forEach((preview, index) => {
          const dish = preview.preparationName || recipeLabel(lines[index] ?? emptyLine(), index);
          preview.ingredients.forEach((ingredient) => {
            const after = ingredient.availableQuantity - ingredient.requiredQuantity;
            impactLines.push({
              label: many ? `${ingredient.ingredientName} · ${dish}` : ingredient.ingredientName,
              before: `${formatQuantity(ingredient.availableQuantity)} ${ingredient.unit}`,
              after: `${formatQuantity(after)} ${ingredient.unit}`,
              adverse: true,
            });
            if (!ingredient.sufficient) shortages.push(`${ingredient.ingredientName} (${dish})`);
          });
        });

        const blockers: OperationBlocker[] =
          shortages.length > 0 && !justificationReady
            ? [
                {
                  code: "INGREDIENT_SHORTAGE",
                  cause:
                    shortages.length === 1
                      ? `No hay existencia suficiente de ${shortages[0]}.`
                      : `No hay existencia suficiente de ${shortages.length} ingredientes: ${shortages.slice(0, 3).join(", ")}${shortages.length > 3 ? "…" : ""}.`,
                  owner: "Encargado de inventario de la sucursal",
                  resolution: `Registra primero la entrada que falta, o escribe abajo una justificación de al menos ${JUSTIFICATION_MIN} caracteres para autorizar la producción con faltante.`,
                  fieldId: "production-justification",
                },
              ]
            : [];

        const cost = previews.reduce((total, preview) => total + preview.consumedCost, 0);

        return {
          headline: `Producir ${previews.length === 1 ? previews[0].preparationName || "una receta" : `${previews.length} recetas`}${warehouseName ? ` en ${warehouseName}` : ""}`,
          affectedCount: impactLines.length,
          affectedLabel: impactLines.length === 1 ? "ingrediente" : "ingredientes",
          lines: impactLines,
          cost: { label: "Costo de los ingredientes consumidos", amount: formatMoney(cost), adverse: true },
          warnings:
            shortages.length > 0 && justificationReady
              ? [
                  {
                    code: "SHORTAGE_OVERRIDE",
                    message: `Se produce con faltante en ${shortages.length} ${shortages.length === 1 ? "ingrediente" : "ingredientes"}. Tu justificación queda en la auditoría.`,
                  },
                ]
              : [],
          blockers,
          responsible: currentUser.fullName,
          // Confirmar crea y aplica los movimientos de todas las recetas: no
          // hay «deshacer», hay que registrar la operación inversa.
          irreversible: true,
        } satisfies OperationImpact;
      })()
    : undefined;

  const completed: OperationStepId[] = [];
  if (recipesChosen) completed.push("select");
  if (previews.length || step === "review" || step === "confirm" || step === "result") completed.push("record");
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

  const updateLine = (index: number, key: keyof ProductionLine, value: string) =>
    setLines(lines.map((line, current) => (current === index ? { ...line, [key]: value } : line)));

  const reset = () => {
    setLines([emptyLine()]);
    setPreviews([]);
    setJustification("");
    setAcknowledged(false);
    setOutcome(null);
    setStep("select");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={uiText("Operación diaria")}
        title={uiText("Producción")}
        description={uiText("Elige las recetas, define cantidades, revisa cómo queda el almacén y confirma.")}
        meta={warehouseName ? <span>{uiText("Almacén: ")}{warehouseName}</span> : null}
      />

      <OperationStepper state={operationState} onStepChange={setStep} />

      {!warehouseId ? (
        <InlineNote tone="warning" title={uiText("Falta elegir el almacén")}>
          {uiText("Sin almacén no se sabe de dónde salen los ingredientes. Selecciónalo arriba para continuar.")}</InlineNote>
      ) : null}

      {calculate.error ? (
        <InlineNote tone="danger" title={uiText("No se pudo calcular el impacto")}>
          {getApiErrorMessage(calculate.error, "Revisa las recetas y las cantidades.")}
        </InlineNote>
      ) : null}

      {step === "select" ? (
        <PageSection
          title={uiText("Recetas a producir")}
          description={uiText("Puedes agrupar varias recetas en una misma operación.")}
          boxed
        >
          <div className="space-y-3">
            {lines.map((line, index) => (
              <div key={index} className="flex flex-wrap items-end gap-3">
                <div className="min-w-0 flex-1">
                  <Label htmlFor={`production-recipe-${index}`}>{uiText("Receta ")}{index + 1}</Label>
                  <select
                    id={`production-recipe-${index}`}
                    className={SELECT_CLASS}
                    value={line.recipeId}
                    onChange={(event) => updateLine(index, "recipeId", event.target.value)}
                  >
                    <option value="">{uiText("Seleccionar")}</option>
                    {recipeOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                {lines.length > 1 ? (
                  <Button
                    variant="ghost"
                    onClick={() => setLines(lines.filter((_, current) => current !== index))}
                    aria-label={`Quitar la receta ${index + 1}`}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button size="sm" variant="secondary" onClick={() => setLines([...lines, emptyLine()])}>
              <Plus className="size-4" aria-hidden="true" />
              {uiText("Agregar otra receta")}</Button>
            <Button size="lg" disabled={!recipesChosen} onClick={() => setStep("record")}>
              {uiText("Continuar")}</Button>
          </div>
        </PageSection>
      ) : null}

      {step === "record" ? (
        <PageSection
          title={uiText("Cantidades")}
          description={uiText("Cuánto se planificó producir y cuánto rindió realmente.")}
          boxed
        >
          <div className="space-y-4">
            {lines.map((line, index) => (
              <div key={index} className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] sm:items-end">
                <p className="min-w-0 truncate font-medium text-ink-1">{recipeLabel(line, index)}</p>
                <div>
                  <Label htmlFor={`production-planned-${index}`}>{uiText("Cantidad planificada")}</Label>
                  <Input
                    id={`production-planned-${index}`}
                    type="number"
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    value={line.plannedQuantity}
                    onChange={(event) => updateLine(index, "plannedQuantity", event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`production-yield-${index}`}>{uiText("Rendimiento real")}</Label>
                  <Input
                    id={`production-yield-${index}`}
                    type="number"
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    value={line.actualYield}
                    onChange={(event) => updateLine(index, "actualYield", event.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setStep("select")}>
              {uiText("Cambiar las recetas")}</Button>
            <Button
              size="lg"
              disabled={!ready}
              loading={calculate.isPending}
              loadingLabel="Calculando…"
              onClick={() => calculate.mutate()}
            >
              {uiText("Revisar impacto")}</Button>
          </div>
        </PageSection>
      ) : null}

      {step === "review" && impact ? (
        <div className="space-y-4">
          <ImpactReview impact={impact} />

          {impact.blockers.length > 0 || justificationReady ? (
            <PageSection title={uiText("Autorizar el faltante")} boxed>
              <p className="text-sm text-ink-2">
                {uiText("El servidor permite producir aunque no haya existencia suficiente, pero exige dejar por escrito por qué. Queda en la auditoría a nombre de")}{currentUser.fullName}.
              </p>
              <div className="mt-3">
                <Label htmlFor="production-justification">{uiText("Justificación")}</Label>
                <Input
                  id="production-justification"
                  value={justification}
                  onChange={(event) => setJustification(event.target.value)}
                  placeholder={uiText("Explica por qué se autoriza el faltante")}
                  aria-describedby="production-justification-help"
                />
                <p id="production-justification-help" className="mt-1 font-mono text-2xs text-ink-3 tabular-figures">
                  {justification.trim().length} / {JUSTIFICATION_MIN} {uiText("caracteres mínimos")}</p>
              </div>
            </PageSection>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setStep("record")}>
              {uiText("Corregir las cantidades")}</Button>
            <Button size="lg" disabled={!canManage || impact.blockers.length > 0} onClick={prepare}>
              {uiText("Continuar")}</Button>
          </div>
        </div>
      ) : null}

      {step === "confirm" && impact ? (
        <ConfirmPanel
          state={operationState}
          operationName="Registrar producción"
          onConfirm={() => confirm.mutate()}
          onBack={() => setStep("review")}
          acknowledged={acknowledged}
          onAcknowledgedChange={setAcknowledged}
        />
      ) : null}

      {step === "result" && outcome ? (
        <OperationResultView
          outcome={outcome}
          onRetry={() => confirm.mutate()}
          onStartAnother={reset}
          startAnotherLabel="Registrar otra producción"
        />
      ) : null}

      <PendingProductionInbox query={pending} />
    </div>
  );
}

/**
 * Borradores que todavía no movieron existencias.
 *
 * Antes el estado se mostraba con su código (`DRAFT`, `IN_PROGRESS`) y el
 * importe con un `$` fijo aunque el resto del módulo formatea la moneda.
 */
/** Cómo se nombra una orden de producción cuando el listado no trae la receta. */
function etiquetaDeOrden(item: RestaurantProductionDto) {
  const fila = item as unknown as Record<string, unknown>;
  const lote = String(fila.lotNumber ?? "");
  return lote ? `Lote ${lote}` : String(fila.id ?? "");
}

function PendingProductionInbox({
  query,
}: {
  query: ReturnType<typeof useQuery<RestaurantProductionDto[]>>;
}) {
  const uiText = useUiText();
  return (
    <PageSection
      title={uiText("Producción pendiente")}
      description={uiText("Documentos en borrador que todavía no actualizan existencias.")}
      boxed
    >
      <RestaurantQueryState
        loading={query.isLoading}
        error={query.error}
        retry={() => void query.refetch()}
        label={uiText("Cargando la producción pendiente")}
      >
        {query.data?.length ? (
          <ul className="divide-y divide-line">
            {query.data.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
                {/*
                  `preparationName` y `consumedCost` los entrega la VISTA
                  PREVIA de producción, que es una respuesta construida a mano;
                  el listado devuelve la orden de Prisma, que sólo guarda
                  `recipeId` y `lotNumber`. Así que el nombre salía vacío y el
                  costo salía «USD 0,00» en todas las órdenes pendientes.

                  Ahora `productions()` resuelve el nombre por `recipeId` y
                  suma el costo de las líneas de salida. El respaldo por lote
                  se conserva para una orden cuya receta se archivó: identifica
                  la orden por lo que la etiqueta en la cocina en vez de dejar
                  la fila sin nombre.
                */}
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink-1">
                    {item.preparationName || etiquetaDeOrden(item)}
                  </p>
                  <p className="font-mono text-2xs text-ink-3 tabular-figures">
                    {formatQuantity(item.plannedQuantity)}{uiText(" planificadas")}
                    {` · ${formatMoney(Number(item.consumedCost ?? 0))}`}
                  </p>
                </div>
                <RestaurantStatusBadge status={item.status} size="sm" />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            reason="no-records"
            title={uiText("No hay producción pendiente")}
            description={uiText("Todo lo registrado ya se aplicó al inventario.")}
          />
        )}
      </RestaurantQueryState>
    </PageSection>
  );
}
