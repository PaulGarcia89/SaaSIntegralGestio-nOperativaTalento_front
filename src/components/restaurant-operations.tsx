"use client";

import { useUiText } from "@/components/ui-copy";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import {
  activateRestaurantRecipe, archiveRestaurantRecipe, cancelRestaurantConsumption, cancelRestaurantProduction,
  cancelRestaurantWaste, confirmRestaurantConsumption, confirmRestaurantProductionWithJustification,
  confirmRestaurantWaste, createRestaurantConsumption, createRestaurantProduction, createRestaurantRecipe,
  createRestaurantWaste, fetchRestaurantIngredients, fetchRestaurantRecipes,
  fetchRestaurantUnits, getApiErrorMessage, previewRestaurantConsumption,
  previewRestaurantProduction, previewRestaurantWaste,
} from "@/lib/backend";
import { useAppStore } from "@/store/app-store";
import { validateOperationDraft } from "@/lib/restaurant-inventory";
import {
  ConfirmPanel,
  ErrorState,
  ImpactReview,
  InlineNote,
  OperationResultView,
  OperationStepper,
  PageHeader,
  PageSection,
  SkeletonRows,
} from "@/components/system";
import { InlineFeedback } from "@/components/design-system";
import { restaurantOperationImpact } from "@/lib/restaurant-operation";
import {
  initialOperationState,
  type OperationOutcome,
  type OperationState,
  type OperationStepId,
} from "@/lib/operation-flow";
import { Badge } from "@/components/ui/badge";
import { confirmAction } from "@/components/confirm-action";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RestaurantProductionWorkflow } from "@/components/restaurant-production-workflow";
import { RestaurantWasteWorkflow } from "@/components/restaurant-waste-workflow";

type Option = { id: string; label: string; unitId?: string; purchaseUnitId?: string };
type Line = { ingredientId: string; unitId: string; quantity: string; wastePercentage: string };
type Preview = Record<string, unknown> & { ingredients?: Array<Record<string, unknown>>; totalCost?: number };

export function RestaurantOperations({ section, warehouseId, warehouseName }: { section: "recipes" | "consumption" | "waste" | "production"; warehouseId?: string; warehouseName?: string }) {
  const uiText = useUiText();
  const { currentBranch, can } = useAppStore();
  const canManage = can("restaurant_inventory.manage");
  const ingredients = useQuery({ queryKey: ["restaurant-ops-ingredients"], queryFn: () => fetchRestaurantIngredients({ status: "ACTIVE", pageSize: 200 }) });
  const units = useQuery({ queryKey: ["restaurant-ops-units"], queryFn: () => fetchRestaurantUnits({ status: "ACTIVE", pageSize: 200 }) });
  const recipes = useQuery({ queryKey: ["restaurant-ops-recipes"], queryFn: () => fetchRestaurantRecipes() });
  if (!currentBranch) return <InlineFeedback tone="warning" title={uiText("Sucursal requerida")}>{uiText("Selecciona una sucursal para operar el inventario de restaurante.")}</InlineFeedback>;
  if (ingredients.isLoading || units.isLoading || recipes.isLoading) return <SkeletonRows rows={5} label={uiText("Cargando información")} />;
  const catalogError = ingredients.error ?? units.error ?? recipes.error;
  if (catalogError) return <ErrorState title={uiText("No fue posible cargar los catálogos")} detail={getApiErrorMessage(catalogError, uiText("Reintenta la consulta para continuar."))} onRetry={() => { void ingredients.refetch(); void units.refetch(); void recipes.refetch(); }} />;
  const ingredientOptions = (ingredients.data?.data ?? []).map((item) => { const record = item as unknown as Record<string, unknown>; return { id: item.id, label: `${item.sku} · ${item.name}`, unitId: String(record.inventoryUnitId ?? ""), purchaseUnitId: String(record.purchaseUnitId ?? "") }; });
  const unitOptions = (units.data?.data ?? []).map((item) => ({ id: item.id, label: `${item.name} (${item.abbreviation ?? ""})` }));
  const recipeOptions = (recipes.data ?? []).map((item) => { const record = item as unknown as Record<string, unknown>; return { id: String(record.id), label: `${String(record.code ?? "")} · ${String(record.name ?? "")}` }; });
  if (section === "recipes") return <RecipesView canManage={canManage} ingredientOptions={ingredientOptions} unitOptions={unitOptions} />;
  if (section === "production") return <RestaurantProductionWorkflow branchId={currentBranch.id} warehouseId={warehouseId} warehouseName={warehouseName} recipeOptions={recipeOptions} canManage={canManage} />;
  if (section === "waste") return <RestaurantWasteWorkflow branchId={currentBranch.id} warehouseId={warehouseId} warehouseName={warehouseName} ingredients={ingredientOptions} units={unitOptions} canManage={canManage} />;
  return <DocumentOperationView section={section} canManage={canManage} branchId={currentBranch.id} warehouseId={warehouseId} warehouseName={warehouseName} ingredientOptions={ingredientOptions} unitOptions={unitOptions} recipeOptions={recipeOptions} />;
}

function RecipesView({ canManage, ingredientOptions, unitOptions }: { canManage: boolean; ingredientOptions: Option[]; unitOptions: Option[] }) {
  const uiText = useUiText();
  const queryClient = useQueryClient(); const recipes = useQuery({ queryKey: ["restaurant-ops-recipes"], queryFn: () => fetchRestaurantRecipes() });
  const [form, setForm] = useState({ code: "", name: "", description: "", yieldQuantity: "1", yieldUnitId: "", sellingPrice: "", requiredStockPolicy: "BLOCK" });
  const [lines, setLines] = useState<Line[]>([]); const [error, setError] = useState(""); const [showAdvanced, setShowAdvanced] = useState(false);
  const save = useMutation({ mutationFn: () => createRestaurantRecipe({ ...form, yieldQuantity: Number(form.yieldQuantity), sellingPrice: form.sellingPrice ? Number(form.sellingPrice) : undefined, requiredStockPolicy: form.requiredStockPolicy, items: lines.map((line, position) => ({ ingredientId: line.ingredientId, quantity: Number(line.quantity), unitId: line.unitId, wastePercentage: Number(line.wastePercentage || 0), position })) }), onSuccess: () => { setForm({ code: "", name: "", description: "", yieldQuantity: "1", yieldUnitId: "", sellingPrice: "", requiredStockPolicy: "BLOCK" }); setLines([]); void queryClient.invalidateQueries({ queryKey: ["restaurant-ops-recipes"] }); } });
  const action = useMutation({ mutationFn: ({ id, type }: { id: string; type: "activate" | "archive" }) => type === "activate" ? activateRestaurantRecipe(id) : archiveRestaurantRecipe(id), onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["restaurant-ops-recipes"] }) });
  const submit = () => { const next = validateOperationDraft({ name: form.name, lines: lines.map((line) => ({ id: line.ingredientId, quantity: line.quantity })) }); setError(next); if (!next && canManage) save.mutate(); };
  return <div className="space-y-5"><PageHeader eyebrow={uiText("Configuración")} title={uiText("Recetas")} description={uiText("Define ingredientes y rendimiento. El costo se calcula en el backend.")} />{save.error || action.error ? <InlineFeedback tone="danger" title={uiText("No se pudo guardar")}>{getApiErrorMessage(save.error ?? action.error, "Revisa los datos.")}</InlineFeedback> : null}<Card level={2}><CardContent className="space-y-4 p-5"><h2 className="font-semibold">{uiText("Nueva receta")}</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Field id="recipe-code" label={uiText("Código")} value={form.code} onChange={(value) => setForm({ ...form, code: value })} /><Field id="recipe-name" label={uiText("Nombre")} value={form.name} onChange={(value) => setForm({ ...form, name: value })} /><Field id="recipe-yield" label={uiText("Rendimiento")} type="number" value={form.yieldQuantity} onChange={(value) => setForm({ ...form, yieldQuantity: value })} /><NativeSelect id="recipe-yield-unit" label={uiText("Unidad de rendimiento")} value={form.yieldUnitId} options={unitOptions} onChange={(value) => setForm({ ...form, yieldUnitId: value })} /></div><Button type="button" size="sm" variant="ghost" onClick={() => setShowAdvanced((value) => !value)}>{showAdvanced ? "Ocultar opciones avanzadas" : "Mostrar opciones avanzadas"}</Button>{showAdvanced ? <div className="grid gap-3 rounded-xl border border-border-default bg-surface-interactive/30 p-3 sm:grid-cols-3"><Field id="recipe-price" label={uiText("Precio de venta")} type="number" value={form.sellingPrice} onChange={(value) => setForm({ ...form, sellingPrice: value })} /><NativeSelect id="recipe-policy" label={uiText("Política de stock")} value={form.requiredStockPolicy} options={[{ id: "BLOCK", label: uiText("Bloquear") }, { id: "WARN", label: "Advertir" }, { id: "ALLOW_NEGATIVE", label: "Permitir negativo" }]} onChange={(value) => setForm({ ...form, requiredStockPolicy: value })} /><Field id="recipe-description" label={uiText("Descripción")} value={form.description} onChange={(value) => setForm({ ...form, description: value })} /></div> : null}<div className="space-y-3"><div className="flex items-center justify-between"><h3 className="font-medium">{uiText("Ingredientes")}</h3><Button size="sm" variant="secondary" disabled={!canManage} onClick={() => setLines([...lines, { ingredientId: "", unitId: "", quantity: "", wastePercentage: "0" }])}><Plus className="size-4" />{uiText("Agregar ingrediente")}</Button></div>{lines.map((line, index) => <div key={index} className="grid gap-2 rounded-xl border border-border-default p-3 sm:grid-cols-[2fr_1.2fr_1fr_1fr_auto]"><NativeSelect id={`recipe-ingredient-${index}`} label={uiText("Ingrediente")} value={line.ingredientId} options={ingredientOptions} onChange={(value) => { const ingredient = ingredientOptions.find((item) => item.id === value); setLines(lines.map((current, i) => i === index ? { ...current, ingredientId: value, unitId: ingredient?.unitId ?? current.unitId } : current)); }} /><NativeSelect id={`recipe-unit-${index}`} label={uiText("Unidad de inventario")} value={line.unitId} options={unitOptions} onChange={(value) => setLines(lines.map((current, i) => i === index ? { ...current, unitId: value } : current))} /><Field id={`recipe-quantity-${index}`} label={uiText("Cantidad")} type="number" value={line.quantity} onChange={(value) => setLines(lines.map((current, i) => i === index ? { ...current, quantity: value } : current))} /><Field id={`recipe-waste-${index}`} label={uiText("Merma %")} type="number" value={line.wastePercentage} onChange={(value) => setLines(lines.map((current, i) => i === index ? { ...current, wastePercentage: value } : current))} /><span className="flex items-end"><Button variant="ghost" size="sm" onClick={() => setLines(lines.filter((_, i) => i !== index))} aria-label={uiText("Eliminar ingrediente")}><Trash2 className="size-4" /></Button></span></div>)}</div>{error ? <InlineFeedback tone="danger" title={uiText("Validación")}>{error}</InlineFeedback> : null}<div className="flex justify-end"><Button disabled={!canManage || save.isPending} onClick={submit}>{save.isPending ? uiText("Guardando…") : uiText("Guardar borrador")}</Button></div>{save.data ? <InlineFeedback tone="success" title={uiText("Borrador creado")}>{uiText("El backend calculó el costo de la receta y guardó el documento.")}</InlineFeedback> : null}</CardContent></Card><Card level={2}><CardContent className="p-5"><h2 className="font-semibold">{uiText("Recetas registradas")}</h2><div className="mt-3 space-y-2">{(recipes.data ?? []).map((item) => { const record = item as unknown as Record<string, unknown>; const status = String(record.status ?? "DRAFT"); return <div key={String(record.id)} className="flex flex-wrap items-center justify-between gap-3 border-b border-border-default py-3"><span><strong>{String(record.code ?? "-")}</strong> · {String(record.name ?? "-")} {uiText(" · costo $")}{Number(record.calculatedCost ?? 0).toFixed(2)}</span><span className="flex items-center gap-2"><Badge>{status}</Badge>{status === "DRAFT" && canManage ? <Button size="sm" onClick={() => action.mutate({ id: String(record.id), type: "activate" })}>{uiText("Activar")}</Button> : null}{status !== "ARCHIVED" && canManage ? <Button size="sm" variant="secondary" onClick={() => { void confirmAction({ title: `¿Archivar «${String(record.name ?? "esta receta")}»?`, description: "Deja de poder usarse en consumos y producciones nuevas.", consequence: "Lo ya registrado con ella se conserva, y puedes volver a activarla cuando quieras.", confirmLabel: "Archivar" }).then((ok) => ok && action.mutate({ id: String(record.id), type: "archive" })); }}>{uiText("Archivar")}</Button> : null}</span></div>; })}</div></CardContent></Card></div>;
}

/**
 * Operación documental de inventario: consumo.
 *
 * Pasa al patrón universal. Qué cambió:
 *
 * · El campo «Almacén activo» mostraba el UUID del almacén en un `<input>` de
 *   solo lectura. Un identificador de base de datos no es información para
 *   quien registra una salida; ahora se muestra el nombre.
 * · La etapa de confirmación enseñaba «Documento DRAFT · <uuid>», y el mensaje
 *   de éxito repetía la referencia. Fuera los dos.
 * · Los turnos se mostraban con sus códigos en inglés —BREAKFAST, LUNCH,
 *   DINNER— tal cual salen del backend.
 * · La confirmación era un `window.confirm` del navegador: sin estilo, sin
 *   decir qué cambia y bloqueando el hilo. Ahora es `ConfirmPanel`, con el
 *   detalle del impacto y la casilla de irreversibilidad.
 * · El faltante de inventario era un aviso suelto que explicaba la regla del
 *   override en prosa. Ahora es un BLOQUEO con su salida, y el bloqueo
 *   desaparece solo cuando la justificación alcanza los 10 caracteres que el
 *   backend exige. La regla no cambia; cambia quién la explica.
 * · La tabla de previsualización tenía 620px de ancho mínimo dentro de un
 *   `overflow-x-auto`.
 *
 * El contrato del backend no cambia: previsualizar → crear borrador →
 * confirmar, con la justificación de override cuando hay faltante.
 */

/** Turnos del backend, en lenguaje de persona. La clave es el valor guardado. */
const SHIFT_LABELS: Record<string, string> = {
  BREAKFAST: "Desayuno",
  LUNCH: "Almuerzo",
  DINNER: "Cena",
  NIGHT: "Turno noche",
  OTHER: "Otro",
};

/** Mínimo que exige el backend para autorizar una salida con faltante. */
const JUSTIFICATION_MIN = 10;

function DocumentOperationView({ section, canManage, branchId, warehouseId, warehouseName, ingredientOptions, unitOptions, recipeOptions }: { section: "consumption" | "waste" | "production"; canManage: boolean; branchId: string; warehouseId?: string; warehouseName?: string; ingredientOptions: Option[]; unitOptions: Option[]; recipeOptions: Option[] }) {
  const uiText = useUiText();
  const queryClient = useQueryClient();
  const { currentUser } = useAppStore();
  const [step, setStep] = useState<OperationStepId>("select");
  const [recipeId, setRecipeId] = useState("");
  const [ingredientId, setIngredientId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [planned, setPlanned] = useState("1");
  const [actual, setActual] = useState("1");
  const [reason, setReason] = useState("");
  const [shift, setShift] = useState("LUNCH");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [documentId, setDocumentId] = useState("");
  const [justification, setJustification] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [outcome, setOutcome] = useState<OperationOutcome | null>(null);
  const [error, setError] = useState("");

  const title = section === "consumption" ? "Registrar salida" : section === "production" ? "Registrar producción" : "Registrar merma";
  const operationLabel = section === "consumption" ? "salida" : section === "production" ? "producción" : "merma";

  const input = section === "consumption"
    ? { branchId, warehouseId, consumptionDate: new Date().toISOString(), shift, items: [{ recipeId, quantitySold: Number(quantity) }] }
    : section === "production"
      ? { branchId, warehouseId, recipeId, plannedQuantity: Number(planned), actualYield: Number(actual), productionDate: new Date().toISOString() }
      : { branchId, warehouseId, wasteDate: new Date().toISOString(), reason, items: [{ ingredientId, quantity: Number(quantity), unitId }] };

  const previewMutation = useMutation<Preview, Error>({
    mutationFn: async () => (section === "consumption" ? await previewRestaurantConsumption(input) : section === "production" ? await previewRestaurantProduction(input) : await previewRestaurantWaste(input)) as Preview,
    onSuccess: (data) => { setPreview(data); setStep("review"); },
  });

  const create = useMutation<Record<string, unknown>, Error>({
    mutationFn: async () => {
      const result = section === "consumption" ? await createRestaurantConsumption(input) : section === "production" ? await createRestaurantProduction(input) : await createRestaurantWaste(input);
      return result as unknown as Record<string, unknown>;
    },
    onSuccess: (data) => { setDocumentId(String((data as Record<string, unknown>).id ?? "")); setStep("confirm"); },
  });

  const refreshInventory = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["restaurant-stock"] }),
      queryClient.invalidateQueries({ queryKey: ["restaurant-movements"] }),
      queryClient.invalidateQueries({ queryKey: ["restaurant-dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["restaurant-decision-dashboard"] }),
      queryClient.invalidateQueries({ queryKey: [`restaurant-${section}`] }),
    ]);
  };

  const confirm = useMutation({
    mutationFn: () => section === "consumption" ? confirmRestaurantConsumption(documentId, justification) : section === "production" ? confirmRestaurantProductionWithJustification(documentId, justification) : confirmRestaurantWaste(documentId, justification),
    onSuccess: async () => {
      setOutcome({
        status: "success",
        headline: `${title.replace("Registrar", "Se registró la")} correctamente`,
        detail: "Existencias, movimientos y métricas ya reflejan la operación.",
        nextAction: { label: "Ver los movimientos", href: "/inventory/restaurant/movements" },
      });
      setStep("result");
      await refreshInventory();
    },
    onError: (mutationError) => {
      setOutcome({
        status: "error",
        headline: `No se pudo confirmar la ${operationLabel}`,
        detail: getApiErrorMessage(mutationError, "El servidor rechazó la operación."),
        retryable: true,
      });
      setStep("result");
    },
  });

  const cancel = useMutation<Record<string, unknown>, Error>({
    mutationFn: async () => {
      const result = section === "consumption" ? await cancelRestaurantConsumption(documentId) : section === "production" ? await cancelRestaurantProduction(documentId, "Cancelación solicitada") : await cancelRestaurantWaste(documentId);
      return result as unknown as Record<string, unknown>;
    },
    onSuccess: async () => {
      setOutcome({ status: "success", headline: "Borrador descartado", detail: "No se aplicó ningún movimiento al inventario." });
      setStep("result");
      await refreshInventory();
    },
  });

  // El faltante lo declara el backend con `shortageQuantity`. Es un bloqueo que
  // el usuario PUEDE levantar: con una justificación de 10 caracteres el
  // servidor autoriza la salida. Por eso el bloqueo desaparece al escribirla,
  // en vez de dejar un botón apagado sin decir cómo encenderlo.
  const shortages = (preview?.ingredients ?? []).filter((row) => Number(row.shortageQuantity ?? 0) > 0);
  const justificationReady = justification.trim().length >= JUSTIFICATION_MIN;
  const shortageBlockers = shortages.length > 0 && !justificationReady
    ? [{
        code: "STOCK_SHORTAGE",
        cause: shortages.length === 1
          ? `No hay existencia suficiente de «${String(shortages[0].ingredientName ?? shortages[0].ingredientId ?? "un producto")}».`
          : `No hay existencia suficiente de ${shortages.length} productos.`,
        owner: "Encargado de inventario de la sucursal",
        resolution: `Registra primero la entrada que falta, o escribe abajo una justificación de al menos ${JUSTIFICATION_MIN} caracteres para autorizar la salida con faltante.`,
        fieldId: `${section}-justification`,
      }]
    : [];

  const impact = preview
    ? (() => {
        const base = restaurantOperationImpact({
          headline: `${title}${warehouseName ? ` en ${warehouseName}` : ""}`,
          affectedLabel: (preview.ingredients?.length ?? 0) === 1 ? "producto" : "productos",
          preview,
          responsible: currentUser.fullName,
          reducesStock: section !== "production",
        });
        return {
          ...base,
          // Los bloqueos por existencia negativa que detecta el normalizador y
          // el faltante que declara el backend son la misma preocupación vista
          // desde dos sitios: se muestran juntos, sin repetir.
          blockers: shortageBlockers.length > 0 ? shortageBlockers : base.blockers,
        };
      })()
    : undefined;

  const completed: OperationStepId[] = [];
  if (recipeId || ingredientId) completed.push("select");
  if (step === "record" || step === "review" || step === "confirm" || step === "result") completed.push("record");
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

  const calculate = () => {
    const next = validateOperationDraft({
      name: section === "waste" ? reason : section,
      lines: [{ id: section === "waste" ? ingredientId : recipeId, quantity: section === "production" ? planned : quantity }],
    });
    setError(next);
    if (next) return;
    if (!warehouseId) { setError("Falta elegir el almacén: sin él no se sabe de dónde sale el producto."); return; }
    previewMutation.mutate();
  };

  const reset = () => {
    setPreview(null);
    setDocumentId("");
    setJustification("");
    setAcknowledged(false);
    setOutcome(null);
    setError("");
    setStep("select");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={uiText("Operación diaria")}
        title={title}
        description={uiText("Registra, revisa cómo queda el almacén y confirma.")}
        meta={warehouseName ? <span>{uiText("Almacén: ")}{warehouseName}</span> : null}
      />

      <OperationStepper state={operationState} onStepChange={setStep} />

      {!warehouseId ? (
        <InlineNote tone="warning" title={uiText("Falta elegir el almacén")}>
          {uiText("Selecciona un almacén antes de registrar la")}{operationLabel}.
        </InlineNote>
      ) : null}

      {error || previewMutation.error || create.error || cancel.error ? (
        <InlineNote tone="danger" title={uiText("No se pudo preparar la operación")}>
          {error || getApiErrorMessage(previewMutation.error ?? create.error ?? cancel.error, "Revisa la información.")}
        </InlineNote>
      ) : null}

      {step === "select" || step === "record" ? (
        <PageSection title={`Datos de la ${operationLabel}`} boxed>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {section === "consumption" || section === "production"
              ? <NativeSelect id={`${section}-recipe`} label={uiText("Receta")} value={recipeId} options={recipeOptions} onChange={setRecipeId} />
              : <>
                  <NativeSelect id="waste-ingredient" label={uiText("Producto")} value={ingredientId} options={ingredientOptions} onChange={setIngredientId} />
                  <NativeSelect id="waste-unit" label={uiText("Unidad")} value={unitId} options={unitOptions} onChange={setUnitId} />
                </>}
            {section === "consumption" ? (
              <>
                <Field id="consumption-quantity" label={uiText("Cantidad vendida")} type="number" value={quantity} onChange={setQuantity} />
                <NativeSelect
                  id="consumption-shift"
                  label={uiText("Turno")}
                  value={shift}
                  options={Object.entries(SHIFT_LABELS).map(([id, label]) => ({ id, label }))}
                  onChange={setShift}
                />
              </>
            ) : section === "production" ? (
              <>
                <Field id="production-planned" label={uiText("Cantidad planificada")} type="number" value={planned} onChange={setPlanned} />
                <Field id="production-actual" label={uiText("Rendimiento real")} type="number" value={actual} onChange={setActual} />
              </>
            ) : (
              <>
                <Field id="waste-quantity" label={uiText("Cantidad")} type="number" value={quantity} onChange={setQuantity} />
                <Field id="waste-reason" label={uiText("Motivo")} value={reason} onChange={setReason} />
              </>
            )}
          </div>
          <Button
            className="mt-5 w-full sm:w-auto"
            size="lg"
            disabled={!canManage}
            loading={previewMutation.isPending}
            loadingLabel="Calculando…"
            onClick={calculate}
          >
            {uiText("Revisar impacto")}</Button>
        </PageSection>
      ) : null}

      {step === "review" && impact ? (
        <div className="space-y-4">
          <ImpactReview impact={impact} />
          {shortages.length > 0 ? (
            <PageSection title={uiText("Autorizar el faltante")} boxed>
              <p className="text-sm text-ink-2">
                {uiText("El servidor permite registrar la salida aunque no haya existencia suficiente, pero exige dejar por escrito por qué. Queda en la auditoría a nombre de")}{currentUser.fullName}.
              </p>
              <div className="mt-3">
                <Label htmlFor={`${section}-justification`}>{uiText("Justificación")}</Label>
                <Input
                  id={`${section}-justification`}
                  value={justification}
                  onChange={(event) => setJustification(event.target.value)}
                  placeholder={uiText("Explica por qué se autoriza el faltante")}
                  aria-describedby={`${section}-justification-help`}
                />
                <p id={`${section}-justification-help`} className="mt-1 font-mono text-2xs text-ink-3 tabular-figures">
                  {justification.trim().length} / {JUSTIFICATION_MIN} {uiText("caracteres mínimos")}</p>
              </div>
            </PageSection>
          ) : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setStep("record")}>{uiText("Corregir el registro")}</Button>
            <Button
              size="lg"
              disabled={!canManage || impact.blockers.length > 0}
              loading={create.isPending}
              loadingLabel={uiText("Preparando…")}
              onClick={() => create.mutate()}
            >
              {uiText("Continuar")}</Button>
          </div>
        </div>
      ) : null}

      {step === "confirm" && impact ? (
        <div className="space-y-3">
          <ConfirmPanel
            state={operationState}
            operationName={title}
            onConfirm={() => confirm.mutate()}
            onBack={() => setStep("review")}
            acknowledged={acknowledged}
            onAcknowledgedChange={setAcknowledged}
          />
          <div className="flex justify-end">
            <Button variant="ghost" loading={cancel.isPending} loadingLabel="Descartando…" onClick={() => cancel.mutate()}>
              {uiText("Descartar el borrador")}</Button>
          </div>
        </div>
      ) : null}

      {step === "result" && outcome ? (
        <OperationResultView
          outcome={outcome}
          onRetry={() => confirm.mutate()}
          onStartAnother={reset}
          startAnotherLabel={`Registrar otra ${operationLabel}`}
        />
      ) : null}
    </div>
  );
}
function NativeSelect({ id, label, value, options, onChange }: { id: string; label: string; value: string; options: Option[]; onChange: (value: string) => void }) {
  const uiText = useUiText(); return <div><Label htmlFor={id}>{label}</Label><select id={id} className="field" value={value} onChange={(event) => onChange(event.target.value)}><option value="">{uiText("Seleccionar")}</option>{options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></div>; }
function Field({ id, label, value, onChange, type = "text", placeholder }: { id: string; label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) { return <div><Label htmlFor={id}>{label}</Label><Input id={id} type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></div>; }
