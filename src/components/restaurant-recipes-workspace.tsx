"use client";

import { useState } from "react";
import { ArrowLeft, ChefHat, ChevronLeft, ChevronRight, Edit3, Filter, ListChecks, Plus, Save, Scale, Archive, CheckCircle2, Printer, GitCompareArrows, BookOpen, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { activateRestaurantRecipe, archiveRestaurantRecipe, createRestaurantRecipe, fetchRestaurantCategories, fetchRestaurantIngredients, fetchRestaurantRecipeCost, fetchRestaurantRecipes, fetchRestaurantUnits, getApiErrorMessage } from "@/lib/backend";
import { useAppStore } from "@/store/app-store";
import { InlineFeedback, PageHeader } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { RowTable } from "@/components/row-table";
import {
  EmptyState,
  ErrorState,
  InlineNote,
  SkeletonRows,
  StatusBadge,
  Stepper,
  type Tone,
} from "@/components/system";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RecipeRow = Record<string, unknown>;
type RecipeLine = { ingredientId: string; subrecipeId: string; unitId: string; quantity: string; wastePercentage: string };
type RecipeForm = { code: string; name: string; description: string; procedure: string; categoryId: string; recipeType: "MENU_ITEM" | "PREPARATION" | "YIELD"; yieldQuantity: string; yieldUnitId: string; outputIngredientId: string; sellingPrice: string; requiredStockPolicy: "BLOCK" | "WARN" | "ALLOW_NEGATIVE" };

const emptyForm: RecipeForm = { code: "", name: "", description: "", procedure: "", categoryId: "", recipeType: "MENU_ITEM", yieldQuantity: "1", yieldUnitId: "", outputIngredientId: "", sellingPrice: "", requiredStockPolicy: "BLOCK" };
const RECIPE_TYPE_LABEL: Record<RecipeForm["recipeType"], string> = { MENU_ITEM: "Plato", PREPARATION: "Preparación", YIELD: "Rendimiento" };
const RECIPE_STEPS = [{ label: "Qué es", icon: ChefHat }, { label: "Rendimiento", icon: Scale }, { label: "Componentes", icon: ListChecks }, { label: "Revisar", icon: CheckCircle2 }];
const typeDescriptions = { MENU_ITEM: "Plato vendido o consumido por porción.", PREPARATION: "Preparación por lotes reutilizable en otras recetas.", YIELD: "Transformación de una materia prima para controlar rendimiento y merma." };

export function RestaurantRecipesWorkspace() {
  const pathname = usePathname();
  const router = useRouter();
  const { can } = useAppStore();
  const showCosts = can("restaurant_inventory.commercial.view");
  const parts = pathname.split("/").filter(Boolean);
  const recipesIndex = parts.indexOf("recipes");
  const recipeId = recipesIndex >= 0 ? parts[recipesIndex + 1] : undefined;
  const mode = recipeId === "new" ? "new" : recipeId === "cost" ? "list" : recipeId ? (parts[recipesIndex + 2] === "cost" ? "cost" : parts[recipesIndex + 2] === "cookbook" ? "cookbook" : parts[recipesIndex + 2] === "edit" ? "edit" : "detail") : "list";
  const recipes = useQuery({ queryKey: ["restaurant-recipes"], queryFn: () => fetchRestaurantRecipes() });
  if (recipes.isLoading) return <SkeletonRows rows={5} label={"Cargando información"} />;
  if (recipes.error) return <ErrorState title={"No fue posible cargar la información"} detail={getApiErrorMessage(recipes.error, "No fue posible cargar las recetas.")} onRetry={() => { void (() => void recipes.refetch())(); }} />;
  const rows = (recipes.data ?? []) as unknown as RecipeRow[];
  if (mode === "list") return <RecipeList recipes={rows} showCosts={showCosts} onNew={() => router.push("/inventory/restaurant/recipes/new")} onOpen={(id) => router.push(`/inventory/restaurant/recipes/${id}`)} />;
  if (mode === "cost" && recipeId) return <SecureRecipeCost recipeId={recipeId} showCosts={showCosts} onBack={() => router.push("/inventory/restaurant/recipes")} onCookbook={() => router.push(`/inventory/restaurant/recipes/${recipeId}/cookbook`)} onNewVersion={can("restaurant_inventory.manage") ? () => router.push(`/inventory/restaurant/recipes/${recipeId}/edit`) : undefined} />;
  if (mode === "cookbook" && recipeId) return showCosts ? <RecipeCookbook recipe={rows.find((row) => String(row.id) === recipeId)} recipeId={recipeId} onBack={() => router.push(`/inventory/restaurant/recipes/${recipeId}`)} /> : <InlineFeedback tone="warning" title="Permiso comercial requerido">Tu perfil no tiene permiso para consultar costos de recetas.</InlineFeedback>;
  const selected = recipeId && recipeId !== "new" ? rows.find((row) => String(row.id) === recipeId) : undefined;
  return <RecipeEditor recipe={selected} isVersion={mode === "edit"} onBack={() => router.push("/inventory/restaurant/recipes")} />;
}

function RecipeList({ recipes, showCosts, onNew, onOpen }: { recipes: RecipeRow[]; showCosts: boolean; onNew: () => void; onOpen: (id: string) => void }) {
  const queryClient = useQueryClient();
  const { can } = useAppStore();
  const canManage = can("restaurant_inventory.manage");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [recipeType, setRecipeType] = useState("ALL");
  const [onlyWarnings, setOnlyWarnings] = useState(false);
  const action = useMutation({ mutationFn: ({ id, type }: { id: string; type: "activate" | "archive" }) => type === "activate" ? activateRestaurantRecipe(id) : archiveRestaurantRecipe(id), onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["restaurant-recipes"] }) });
  const visible = recipes.filter((row) => {
    const haystack = `${String(row.code ?? "")} ${String(row.name ?? "")}`.toLowerCase();
    const cost = Number(row.calculatedCost ?? 0);
    return haystack.includes(search.toLowerCase()) && (status === "ALL" || String(row.status) === status) && (recipeType === "ALL" || String(row.recipeType ?? (row.outputIngredientId ? "PREPARATION" : "MENU_ITEM")) === recipeType) && (!onlyWarnings || cost === 0);
  });
  return <div className="space-y-5"><PageHeader eyebrow="Producción" title="Recetas y preparaciones" description="Administra platos, preparaciones y rendimientos con costos calculados por el backend." actions={<Button onClick={onNew} disabled={!canManage}><Plus className="size-4" />Nueva receta</Button>} />{action.error ? <InlineFeedback tone="danger" title="No se pudo actualizar la receta">{getApiErrorMessage(action.error, "Revisa el estado de la receta.")}</InlineFeedback> : null}<Card level={1}><CardContent className="space-y-4 p-5"><div className="flex items-center gap-2 text-sm font-semibold"><Filter className="size-4 text-brand" />Filtros operativos</div><div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto]"><div><Label htmlFor="recipe-search">Buscar</Label><Input id="recipe-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Código o nombre" /></div><div><Label htmlFor="recipe-status">Estado</Label><select id="recipe-status" className="field" value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">Todos</option><option value="DRAFT">Borrador</option><option value="ACTIVE">Activa</option><option value="ARCHIVED">Archivada</option></select></div><div><Label htmlFor="recipe-type">Tipo</Label><select id="recipe-type" className="field" value={recipeType} onChange={(event) => setRecipeType(event.target.value)}><option value="ALL">Todos</option><option value="MENU_ITEM">Platos</option><option value="PREPARATION">Preparaciones</option><option value="YIELD">Rendimientos</option></select></div><label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={onlyWarnings} onChange={(event) => setOnlyWarnings(event.target.checked)} />Sin costo</label></div></CardContent></Card><ul aria-label="Recetas" className="grid gap-4 xl:grid-cols-2 [&>li]:min-w-0">{visible.map((row) => <SecureRecipeCard key={String(row.id)} row={row} canManage={canManage} showCosts={showCosts} onOpen={onOpen} onAction={(type) => action.mutate({ id: String(row.id), type })} />)}</ul>{!visible.length ? <InlineFeedback tone="info" title="Sin resultados">No hay recetas con los filtros seleccionados.</InlineFeedback> : null}</div>;
}

const RECIPE_STATUS: Record<string, { label: string; tone: Tone }> = {
  DRAFT: { label: "Borrador", tone: "neutral" },
  ACTIVE: { label: "Activa", tone: "success" },
  ARCHIVED: { label: "Archivada", tone: "blocked" },
};

/**
 * Tarjeta de receta en la lista: nombre, tipo, estado en palabras y —si se
 * puede ver— dos cifras que sí orientan: costo por porción y precio. El
 * costo del lote está en la ficha. Un botón principal («Consultar») y el
 * resto secundarios; «Activar» solo aparece en borradores.
 */
function SecureRecipeCard({ row, canManage, showCosts, onOpen, onAction }: { row: RecipeRow; canManage: boolean; showCosts: boolean; onOpen: (id: string) => void; onAction: (type: "activate" | "archive") => void }) {
  const status = String(row.status ?? "DRAFT"); const price = row.sellingPrice == null ? null : Number(row.sellingPrice);
  const badge = RECIPE_STATUS[status] ?? { label: status, tone: "neutral" as Tone };
  const portionCost = Number(row.calculatedCost ?? 0) / Math.max(1, Number(row.yieldQuantity ?? 1));
  const foodCost = price && price > 0 ? (portionCost / price) * 100 : null;
  return <li className="flex flex-col gap-4 rounded-lg border border-line bg-surface-1 p-4 sm:p-5">
    <div className="flex items-start gap-3">
      <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-fill/15 text-accent-ink"><ChefHat className="size-5" /></span>
      <div className="min-w-0 flex-1">
        <h2 className="line-clamp-2 break-words text-base font-semibold leading-snug text-ink-1">{String(row.name ?? "Sin nombre")}</h2>
        <p className="mt-0.5 truncate text-sm text-ink-2">{row.outputIngredientId ? "Preparación / rendimiento" : "Plato vendido"} · {String(row.code ?? "Sin código")} · v{String(row.version ?? 1)}</p>
      </div>
      <StatusBadge tone={badge.tone} label={badge.label} className="shrink-0" />
    </div>
    {showCosts ? <dl className="grid grid-cols-3 gap-3 [&>div]:min-w-0">
      <div><dt className="text-xs text-ink-3">Costo por porción</dt><dd className="font-mono text-base font-semibold tabular-nums text-ink-1">${portionCost.toFixed(2)}</dd></div>
      <div><dt className="text-xs text-ink-3">Precio venta</dt><dd className="font-mono text-base font-semibold tabular-nums text-ink-1">{price == null ? "—" : `$${price.toFixed(2)}`}</dd></div>
      <div><dt className="text-xs text-ink-3">Food cost</dt><dd className={cn("font-mono text-base font-semibold tabular-nums", foodCost == null ? "text-ink-1" : foodCost > 35 ? "text-status-warning" : "text-status-success")}>{foodCost == null ? "—" : `${foodCost.toFixed(1)}%`}</dd></div>
    </dl> : <p className="text-sm text-ink-3">Costos visibles solo con permiso comercial.</p>}
    <div className="flex flex-wrap gap-2 border-t border-line pt-4">
      <Button variant="secondary" onClick={() => onOpen(showCosts ? String(row.id) + "/cost" : String(row.id))}><ChevronRight className="size-4" />Consultar</Button>
      {status === "DRAFT" && canManage ? <Button onClick={() => onAction("activate")}><CheckCircle2 className="size-4" />Activar</Button> : null}
      {canManage ? <Button variant="ghost" onClick={() => onOpen(String(row.id) + "/edit")}><Edit3 className="size-4" />Nueva versión</Button> : null}
      {status !== "ARCHIVED" && canManage ? <Button variant="ghost" onClick={() => onAction("archive")}><Archive className="size-4" />Archivar</Button> : null}
    </div>
  </li>;
}

function SecureRecipeCost({ recipeId, showCosts, onBack, onCookbook, onNewVersion }: { recipeId: string; showCosts: boolean; onBack: () => void; onCookbook: () => void; onNewVersion?: () => void }) {
  const query = useQuery({ queryKey: ["restaurant-recipe-cost", recipeId], queryFn: () => fetchRestaurantRecipeCost(recipeId) });
  if (!showCosts) return <InlineFeedback tone="warning" title="Permiso comercial requerido">Tu perfil no tiene permiso para consultar costos de recetas.</InlineFeedback>;
  if (query.isLoading) return <SkeletonRows rows={5} label={"Cargando información"} />;
  if (query.error) return <ErrorState title={"No fue posible cargar la información"} detail={getApiErrorMessage(query.error, "No fue posible calcular el costo.")} onRetry={() => { void (() => void query.refetch())(); }} />;
  const data = query.data; const foodCost = data?.salePrice && data.salePrice > 0 ? (data.costPerPortion / data.salePrice) * 100 : null;
  return <div className="space-y-5"><PageHeader eyebrow="Costeo" title={data?.recipeName ?? "Costo de receta"} description="Consulta el costo por ingrediente, porción, precio y margen calculados por backend." actions={<span className="flex flex-wrap gap-2">{onNewVersion ? <Button onClick={onNewVersion}><Edit3 className="size-4" />Nueva versión</Button> : null}<Button variant="secondary" onClick={onCookbook}><BookOpen className="size-4" />Modo cookbook</Button><Button variant="secondary" onClick={onBack}><ArrowLeft className="size-4" />Volver a recetas</Button></span>} />{data ? <><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6"><Metric label="Costo lote" value={`$${data.totalCost.toFixed(2)}`} /><Metric label="Costo por porción" value={`$${data.costPerPortion.toFixed(2)}`} /><Metric label="Precio venta" value={data.salePrice == null ? "-" : `$${data.salePrice.toFixed(2)}`} /><Metric label="Food cost" value={foodCost == null ? "-" : `${foodCost.toFixed(1)}%`} /><Metric label="Margen" value={data.marginAmount == null ? "-" : `$${data.marginAmount.toFixed(2)}`} /><Metric label="Margen %" value={data.marginPercent == null ? "-" : `${data.marginPercent.toFixed(1)}%`} /></div><Card level={2}><CardContent className="p-5"><h2 className="font-semibold">Desglose de ingredientes</h2><RowTable caption="Desglose de ingredientes" headers={["Ingrediente", "Cantidad", "Unidad", "Costo unitario", "Costo total"]}>{data.ingredients.map((item) => <tr key={`${item.ingredientName}-${item.quantity}`}><td className="px-3 py-3">{item.ingredientName}</td><td className="px-3 py-3">{item.quantity}</td><td className="px-3 py-3">{item.unit}</td><td className="px-3 py-3">${item.unitCost.toFixed(2)}</td><td className="px-3 py-3">${item.ingredientCost.toFixed(2)}</td></tr>)}</RowTable></CardContent></Card><RecipeHistory history={data.history} /></> : null}</div>;
}

function RecipeCard({ row, canManage, onOpen, onAction }: { row: RecipeRow; canManage: boolean; onOpen: (id: string) => void; onAction: (type: "activate" | "archive") => void }) {
  const cost = Number(row.calculatedCost ?? 0);
  const price = row.sellingPrice == null ? null : Number(row.sellingPrice);
  const foodCost = price && price > 0 ? (cost / price) * 100 : null;
  const status = String(row.status ?? "DRAFT");
  return <Card level={2}><CardContent className="space-y-4 p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">{String(row.code ?? "Sin código")}</p><h2 className="mt-1 text-xl font-semibold">{String(row.name ?? "Sin nombre")}</h2><p className="mt-1 text-sm text-text-secondary">{row.outputIngredientId ? "Preparación / rendimiento" : "Plato vendido"} · versión {String(row.version ?? 1)}</p></div><Badge variant={status === "ACTIVE" ? "default" : status === "ARCHIVED" ? "secondary" : "outline"}>{status}</Badge></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-5"><Metric label="Costo lote" value={`$${cost.toFixed(2)}`} /><Metric label="Porción" value={`$${(cost / Math.max(1, Number(row.yieldQuantity ?? 1))).toFixed(2)}`} /><Metric label="Precio venta" value={price == null ? "-" : `$${price.toFixed(2)}`} /><Metric label="Food cost" value={foodCost == null ? "-" : `${foodCost.toFixed(1)}%`} /><Metric label="Margen" value={price && price > 0 ? `$${(price - cost / Math.max(1, Number(row.yieldQuantity ?? 1))).toFixed(2)}` : "-"} /></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => onOpen(String(row.id))}><ChevronRight className="size-4" />Consultar</Button>{canManage ? <Button size="sm" variant="ghost" onClick={() => onOpen(String(row.id) + "/edit")}><Edit3 className="size-4" />Nueva versión</Button> : null}{status === "DRAFT" && canManage ? <Button size="sm" onClick={() => onAction("activate")}><CheckCircle2 className="size-4" />Activar</Button> : null}{status !== "ARCHIVED" && canManage ? <Button size="sm" variant="ghost" onClick={() => onAction("archive")}><Archive className="size-4" />Archivar</Button> : null}</div></CardContent></Card>;
}

function RecipeEditor({ recipe, isVersion, onBack }: { recipe?: RecipeRow; isVersion: boolean; onBack: () => void }) {
  const { currentBranch, can } = useAppStore();
  const queryClient = useQueryClient();
  const canManage = can("restaurant_inventory.manage");
  const ingredients = useQuery({ queryKey: ["restaurant-recipe-ingredients"], queryFn: () => fetchRestaurantIngredients({ status: "ACTIVE", pageSize: 200 }) });
  const units = useQuery({ queryKey: ["restaurant-recipe-units"], queryFn: () => fetchRestaurantUnits({ status: "ACTIVE", pageSize: 200 }) });
  const categories = useQuery({ queryKey: ["restaurant-recipe-categories"], queryFn: () => fetchRestaurantCategories({ status: "ACTIVE", pageSize: 200 }) });
  const [form, setForm] = useState<RecipeForm>(() => recipe ? { code: String(recipe.code ?? ""), name: String(recipe.name ?? ""), description: String(recipe.description ?? ""), procedure: String(recipe.procedure ?? ""), categoryId: String(recipe.categoryId ?? ""), recipeType: recipe.outputIngredientId ? "PREPARATION" : "MENU_ITEM", yieldQuantity: String(recipe.yieldQuantity ?? "1"), yieldUnitId: String(recipe.yieldUnitId ?? ""), outputIngredientId: String(recipe.outputIngredientId ?? ""), sellingPrice: recipe.sellingPrice == null ? "" : String(recipe.sellingPrice), requiredStockPolicy: (String(recipe.requiredStockPolicy ?? "BLOCK") as RecipeForm["requiredStockPolicy"]) } : emptyForm);
  const [lines, setLines] = useState<RecipeLine[]>([]);
  const [saved, setSaved] = useState<RecipeRow | null>(null);
  const [step, setStep] = useState(0);
  const save = useMutation({ mutationFn: () => createRestaurantRecipe({ branchId: currentBranch?.id, code: form.code.trim(), name: form.name.trim(), description: form.description.trim() || undefined, procedure: form.procedure.trim() || undefined, categoryId: form.categoryId || undefined, type: form.recipeType, outputIngredientId: ["PREPARATION", "YIELD"].includes(form.recipeType) && form.outputIngredientId ? form.outputIngredientId : undefined, yieldQuantity: Number(form.yieldQuantity), yieldUnitId: form.yieldUnitId, sellingPrice: form.recipeType === "MENU_ITEM" && form.sellingPrice ? Number(form.sellingPrice) : undefined, requiredStockPolicy: form.requiredStockPolicy, items: lines.map((line, position) => ({ ...(line.subrecipeId ? { recipeId: line.subrecipeId } : { ingredientId: line.ingredientId }), quantity: Number(line.quantity), unitId: line.unitId, wastePercentage: Number(line.wastePercentage || 0), position })) }), onSuccess: (data) => { setSaved(data as unknown as RecipeRow); void queryClient.invalidateQueries({ queryKey: ["restaurant-recipes"] }); } });
  const ingredientOptions = ingredients.data?.data ?? [];
  const unitOptions = units.data?.data ?? [];
  const subrecipes = useQuery({ queryKey: ["restaurant-recipe-subrecipes"], queryFn: () => fetchRestaurantRecipes() });
  if (ingredients.isLoading || units.isLoading || categories.isLoading || subrecipes.isLoading) return <SkeletonRows rows={5} label={"Cargando información"} />;
  const invalid = !canManage || !form.code.trim() || !form.name.trim() || !form.yieldUnitId || Number(form.yieldQuantity) <= 0 || lines.some((line) => (!line.ingredientId && !line.subrecipeId) || !line.unitId || Number(line.quantity) <= 0);
  /*
   * Cuatro pasos en vez de cinco secciones en una sola página larga: qué es,
   * cuánto rinde, de qué se compone, y revisar y guardar. Cada paso valida
   * solo lo suyo y el botón «Continuar» dice qué falta en vez de apagarse
   * sin explicación. El costo lo calcula el servidor al guardar y se enseña
   * en el último paso, como antes.
   */
  const stepErrors: string[][] = [
    [!form.code.trim() ? "Falta el código" : "", !form.name.trim() ? "Falta el nombre" : ""].filter(Boolean),
    [Number(form.yieldQuantity) <= 0 ? "La cantidad producida debe ser mayor que cero" : "", !form.yieldUnitId ? "Falta la unidad de rendimiento" : ""].filter(Boolean),
    [lines.some((line) => (!line.ingredientId && !line.subrecipeId) || !line.unitId || Number(line.quantity) <= 0) ? "Cada línea necesita ingrediente o subreceta, unidad y cantidad" : ""].filter(Boolean),
    [],
  ];
  const stepDone = [form.code.trim() !== "" && form.name.trim() !== "", Number(form.yieldQuantity) > 0 && form.yieldUnitId !== "", lines.length > 0 && stepErrors[2].length === 0, Boolean(saved)];
  const portionCost = saved ? Number(saved.calculatedCost ?? 0) / Math.max(1, Number(form.yieldQuantity)) : null;
  const goTo = (index: number) => setStep(Math.max(0, Math.min(3, index)));

  return <div className="space-y-5"><PageHeader eyebrow={isVersion ? "Versionado" : "Producción"} title={isVersion ? `Nueva versión de ${form.name || "receta"}` : "Nueva receta"} description={isVersion ? "La versión anterior se conserva; el costo lo recalcula el servidor al guardar." : "Cuatro pasos. El costo lo calcula el servidor al guardar el borrador."} actions={<Button variant="secondary" onClick={onBack}><ArrowLeft className="size-4" />Volver a recetas</Button>} />
    {!canManage ? <InlineNote tone="blocked" title="Sin permiso para gestionar recetas">Puedes revisar el formulario, pero no guardar.</InlineNote> : null}
    <section className="rounded-lg border border-line bg-surface-1 p-5 shadow-e1 sm:p-6">
      <Stepper label="Pasos de la receta" steps={RECIPE_STEPS} current={step} completed={stepDone} freeNavigation onSelect={goTo} />
      <div className="mt-6 space-y-5 border-t border-line pt-6">
        {step === 0 ? <>
          <h2 className="text-lg font-semibold text-ink-1">¿Qué receta es?</h2>
          <div className="grid gap-4 md:grid-cols-2"><Field id="recipe-name" label="Nombre" value={form.name} onChange={(value) => setForm({ ...form, name: value })} /><Field id="recipe-code" label="Código" value={form.code} onChange={(value) => setForm({ ...form, code: value })} /><Select id="recipe-type" label="Tipo de receta" value={form.recipeType} options={[{ id: "MENU_ITEM", label: "Plato" }, { id: "PREPARATION", label: "Preparación" }, { id: "YIELD", label: "Rendimiento" }]} onChange={(value) => setForm({ ...form, recipeType: value as RecipeForm["recipeType"] })} /><Select id="recipe-category" label="Categoría" value={form.categoryId} options={(categories.data?.data ?? []).map((item) => ({ id: item.id, label: item.name }))} onChange={(value) => setForm({ ...form, categoryId: value })} /></div>
          <p className="text-sm text-ink-2">{typeDescriptions[form.recipeType]}</p>
          <details className="rounded-md border border-line"><summary className="min-h-[var(--control-h-base)] cursor-pointer list-none px-4 py-2 text-sm font-medium text-ink-1 [&::-webkit-details-marker]:hidden">Descripción y procedimiento <span className="font-normal text-ink-3">· opcional</span></summary><div className="space-y-4 border-t border-line p-4"><Field id="recipe-description" label="Descripción" value={form.description} onChange={(value) => setForm({ ...form, description: value })} /><div><Label htmlFor="recipe-procedure">Procedimiento</Label><textarea id="recipe-procedure" className="field min-h-32" value={form.procedure} onChange={(event) => setForm({ ...form, procedure: event.target.value })} placeholder="Preparación, tiempos, temperaturas y puntos de control." /></div></div></details>
        </> : null}

        {step === 1 ? <>
          <h2 className="text-lg font-semibold text-ink-1">¿Cuánto rinde?</h2>
          <div className="grid gap-4 md:grid-cols-3"><Field id="recipe-yield" label="Cantidad producida" type="number" value={form.yieldQuantity} onChange={(value) => setForm({ ...form, yieldQuantity: value })} /><Select id="recipe-yield-unit" label="Unidad de rendimiento" value={form.yieldUnitId} options={unitOptions.map((item) => ({ id: item.id, label: `${item.name} (${item.abbreviation})` }))} onChange={(value) => setForm({ ...form, yieldUnitId: value })} />{form.recipeType === "MENU_ITEM" ? <Field id="recipe-price" label="Precio de venta" type="number" value={form.sellingPrice} onChange={(value) => setForm({ ...form, sellingPrice: value })} /> : null}</div>
          <p className="text-sm text-ink-2">Ejemplos: 1 hamburguesa = 1 porción · una salsa produce 1,400 ml · 10 kg de tomate producen 8 kg limpios.</p>
          {["PREPARATION", "YIELD"].includes(form.recipeType) ? <Select id="recipe-output" label="Ingrediente resultante" value={form.outputIngredientId} options={ingredientOptions.map((item) => ({ id: item.id, label: `${item.sku} · ${item.name}` }))} onChange={(value) => setForm({ ...form, outputIngredientId: value })} /> : null}
        </> : null}

        {step === 2 ? <>
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold text-ink-1">¿De qué se compone?</h2><Button variant="secondary" onClick={() => setLines([...lines, { ingredientId: "", subrecipeId: "", unitId: "", quantity: "", wastePercentage: "0" }])}><Plus className="size-4" />Agregar línea</Button></div>
          {lines.length ? <ol className="space-y-3">{lines.map((line, index) => <li key={index} className="grid gap-3 rounded-md border border-line p-4 md:grid-cols-[1.4fr_1.4fr_1fr_1fr_1fr_auto] [&>*]:min-w-0"><Select id={`recipe-line-ingredient-${index}`} label="Ingrediente" value={line.ingredientId} options={ingredientOptions.map((item) => ({ id: item.id, label: `${item.sku} · ${item.name}` }))} onChange={(value) => setLines(lines.map((current, i) => i === index ? { ...current, ingredientId: value, subrecipeId: "" } : current))} /><Select id={`recipe-line-subrecipe-${index}`} label="o subreceta" value={line.subrecipeId} options={(subrecipes.data ?? []).filter((item) => String(item.id) !== String(recipe?.id ?? "")).map((item) => ({ id: item.id, label: `${item.code} · ${item.name}` }))} onChange={(value) => setLines(lines.map((current, i) => i === index ? { ...current, subrecipeId: value, ingredientId: "" } : current))} /><Field id={`recipe-line-quantity-${index}`} label="Cantidad" type="number" value={line.quantity} onChange={(value) => setLines(lines.map((current, i) => i === index ? { ...current, quantity: value } : current))} /><Select id={`recipe-line-unit-${index}`} label="Unidad" value={line.unitId} options={unitOptions.map((item) => ({ id: item.id, label: `${item.name} (${item.abbreviation})` }))} onChange={(value) => setLines(lines.map((current, i) => i === index ? { ...current, unitId: value } : current))} /><Field id={`recipe-line-waste-${index}`} label="Merma %" type="number" value={line.wastePercentage} onChange={(value) => setLines(lines.map((current, i) => i === index ? { ...current, wastePercentage: value } : current))} /><Button variant="ghost" className="self-end" aria-label={`Eliminar línea ${index + 1}`} onClick={() => setLines(lines.filter((_, i) => i !== index))}><Trash2 className="size-4" />Quitar</Button></li>)}</ol> : <EmptyState reason="no-records" title="Todavía no hay componentes" description="Añade ingredientes o subrecetas; el servidor calcula el costo del lote al guardar." action={<Button onClick={() => setLines([{ ingredientId: "", subrecipeId: "", unitId: "", quantity: "", wastePercentage: "0" }])}><Plus className="size-4" />Agregar la primera línea</Button>} />}
        </> : null}

        {step === 3 ? <>
          <h2 className="text-lg font-semibold text-ink-1">Revisar y guardar</h2>
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 [&>div]:min-w-0">
            <div><dt className="text-xs text-ink-3">Receta</dt><dd className="text-ink-1">{form.name || "—"} · {form.code || "—"}</dd></div>
            <div><dt className="text-xs text-ink-3">Tipo</dt><dd className="text-ink-1">{RECIPE_TYPE_LABEL[form.recipeType]}</dd></div>
            <div><dt className="text-xs text-ink-3">Rendimiento</dt><dd className="text-ink-1">{form.yieldQuantity} {String(unitOptions.find((item) => item.id === form.yieldUnitId)?.abbreviation ?? "")}</dd></div>
            <div><dt className="text-xs text-ink-3">Componentes</dt><dd className="text-ink-1">{lines.length}</dd></div>
            <div><dt className="text-xs text-ink-3">Sucursal</dt><dd className="text-ink-1">{currentBranch?.name ?? "Contexto actual"}</dd></div>
          </dl>
          <Select id="recipe-stock-policy" label="Si falta inventario al producir" value={form.requiredStockPolicy} options={[{ id: "BLOCK", label: "Bloquear la producción" }, { id: "WARN", label: "Avisar y permitir" }, { id: "ALLOW_NEGATIVE", label: "Permitir inventario negativo" }]} onChange={(value) => setForm({ ...form, requiredStockPolicy: value as RecipeForm["requiredStockPolicy"] })} />
          {stepErrors.slice(0, 3).some((errors) => errors.length) ? <InlineNote tone="warning" title="Falta algo en pasos anteriores">{stepErrors.flat().join(" · ")}</InlineNote> : null}
          {save.error ? <InlineNote tone="danger" title="No se pudo guardar">{getApiErrorMessage(save.error, "Revisa los campos y las equivalencias de unidades.")}</InlineNote> : null}
          {saved ? <div className="rounded-lg border border-status-success/40 bg-status-success/5 p-4"><p className="flex items-center gap-2 font-semibold text-ink-1"><CheckCircle2 className="size-5 text-status-success" aria-hidden="true" />Borrador guardado</p><dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 [&>div]:min-w-0"><div><dt className="text-xs text-ink-3">Costo lote</dt><dd className="font-mono font-semibold tabular-nums text-ink-1">${Number(saved.calculatedCost ?? 0).toFixed(2)}</dd></div><div><dt className="text-xs text-ink-3">Por porción</dt><dd className="font-mono font-semibold tabular-nums text-ink-1">${(portionCost ?? 0).toFixed(2)}</dd></div><div><dt className="text-xs text-ink-3">Food cost</dt><dd className="font-mono font-semibold tabular-nums text-ink-1">{form.sellingPrice && portionCost != null ? `${((portionCost / Number(form.sellingPrice)) * 100).toFixed(1)}%` : "—"}</dd></div><div><dt className="text-xs text-ink-3">Margen</dt><dd className="font-mono font-semibold tabular-nums text-ink-1">{form.sellingPrice && portionCost != null ? `$${(Number(form.sellingPrice) - portionCost).toFixed(2)}` : "—"}</dd></div></dl><p className="mt-3 text-sm text-ink-2">Puedes activarla desde la lista de recetas.</p></div> : null}
        </> : null}

        <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>{step > 0 ? <Button variant="ghost" onClick={() => goTo(step - 1)}><ChevronLeft className="size-4" />Anterior</Button> : <Button variant="ghost" onClick={onBack}>Descartar</Button>}</div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {step < 3 && stepErrors[step].length ? <p className="text-sm text-ink-2" role="status">{stepErrors[step].join(" · ")}</p> : null}
            {step < 3
              ? <Button disabled={stepErrors[step].length > 0} onClick={() => goTo(step + 1)}>Continuar<ChevronRight className="size-4" /></Button>
              : saved
                ? <Button onClick={onBack}>Volver a recetas<ChevronRight className="size-4" /></Button>
                : <Button disabled={invalid || save.isPending} onClick={() => save.mutate()}><Save className="size-4" />{save.isPending ? "Guardando…" : isVersion ? "Guardar nueva versión" : "Guardar borrador"}</Button>}
          </div>
        </div>
      </div>
    </section>
  </div>;
}

function RecipeCost({ recipeId, onBack, onCookbook }: { recipeId: string; onBack: () => void; onCookbook: () => void }) { const query = useQuery({ queryKey: ["restaurant-recipe-cost", recipeId], queryFn: () => fetchRestaurantRecipeCost(recipeId) }); if (query.isLoading) return <SkeletonRows rows={5} label={"Cargando información"} />; if (query.error) return <ErrorState title={"No fue posible cargar la información"} detail={getApiErrorMessage(query.error, "No fue posible calcular el costo.")} onRetry={() => { void (() => void query.refetch())(); }} />; const data = query.data; const foodCost = data?.salePrice && data.salePrice > 0 ? (data.costPerPortion / data.salePrice) * 100 : null; return <div className="space-y-5"><PageHeader eyebrow="Costeo" title={data?.recipeName ?? "Costo de receta"} description="Consulta el costo por ingrediente, porción, precio y margen calculados por backend." actions={<span className="flex flex-wrap gap-2"><Button variant="secondary" onClick={onCookbook}><BookOpen className="size-4" />Modo cookbook</Button><Button variant="secondary" onClick={onBack}><ArrowLeft className="size-4" />Volver a recetas</Button></span>} />{data ? <><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6"><Metric label="Costo lote" value={`$${data.totalCost.toFixed(2)}`} /><Metric label="Costo por porción" value={`$${data.costPerPortion.toFixed(2)}`} /><Metric label="Precio venta" value={data.salePrice == null ? "-" : `$${data.salePrice.toFixed(2)}`} /><Metric label="Food cost" value={foodCost == null ? "-" : `${foodCost.toFixed(1)}%`} /><Metric label="Margen" value={data.marginAmount == null ? "-" : `$${data.marginAmount.toFixed(2)}`} /><Metric label="Margen %" value={data.marginPercent == null ? "-" : `${data.marginPercent.toFixed(1)}%`} /></div><Card level={2}><CardContent className="p-5"><h2 className="font-semibold">Desglose de ingredientes</h2><RowTable caption="Desglose de ingredientes" headers={["Ingrediente", "Cantidad", "Unidad", "Costo unitario", "Costo total"]}>{data.ingredients.map((item) => <tr key={`${item.ingredientName}-${item.quantity}`}><td className="px-3 py-3">{item.ingredientName}</td><td className="px-3 py-3">{item.quantity}</td><td className="px-3 py-3">{item.unit}</td><td className="px-3 py-3">${item.unitCost.toFixed(2)}</td><td className="px-3 py-3">${item.ingredientCost.toFixed(2)}</td></tr>)}</RowTable></CardContent></Card><RecipeHistory history={data.history} /></> : null}</div>; }

function RecipeHistory({ history }: { history: Array<{ changedAt: string; changedBy: string; previousCost: number; newCost: number; reason?: string | null }> }) { const [compare, setCompare] = useState(0); const selected = history[compare]; return <Card level={2}><CardContent className="space-y-4 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Historial y comparación</h2><p className="text-sm text-text-secondary">Compara cada cambio de costo registrado por el backend.</p></div><GitCompareArrows className="size-5 text-brand" /></div>{history.length ? <><select className="field" value={compare} onChange={(event) => setCompare(Number(event.target.value))}>{history.map((item, index) => <option key={`${item.changedAt}-${index}`} value={index}>{new Date(item.changedAt).toLocaleString()} · {item.changedBy}</option>)}</select>{selected ? <div className="grid gap-3 sm:grid-cols-3"><Metric label="Costo anterior" value={`$${selected.previousCost.toFixed(2)}`} /><Metric label="Costo nuevo" value={`$${selected.newCost.toFixed(2)}`} /><Metric label="Variación" value={`$${(selected.newCost - selected.previousCost).toFixed(2)}`} /></div> : null}<p className="text-sm text-text-secondary">{selected?.reason ?? "Sin motivo registrado"}</p></> : <p className="text-sm text-text-secondary">No hay cambios históricos registrados.</p>}</CardContent></Card>; }

function RecipeCookbook({ recipe, recipeId, onBack }: { recipe?: RecipeRow; recipeId: string; onBack: () => void }) { const cost = useQuery({ queryKey: ["restaurant-recipe-cost", recipeId], queryFn: () => fetchRestaurantRecipeCost(recipeId) }); if (cost.isLoading) return <SkeletonRows rows={5} label={"Cargando información"} />; if (cost.error || !cost.data) return <ErrorState title={"No fue posible cargar la información"} detail={getApiErrorMessage(cost.error, "No fue posible preparar la receta para impresión.")} onRetry={() => { void (() => void cost.refetch())(); }} />; const data = cost.data; return <div className="mx-auto max-w-3xl space-y-5 print:max-w-none"><div className="flex flex-wrap justify-between gap-3 print:hidden"><Button variant="secondary" onClick={onBack}><ArrowLeft className="size-4" />Volver</Button><Button onClick={() => window.print()}><Printer className="size-4" />Imprimir cookbook</Button></div><Card className="print:border-0 print:shadow-none"><CardContent className="space-y-6 p-8"><div className="border-b border-border-default pb-5 text-center"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Cookbook de cocina</p><h1 className="mt-2 text-3xl font-bold">{String(recipe?.name ?? data.recipeName)}</h1><p className="mt-2 text-sm text-text-secondary">Código {String(recipe?.code ?? "-")} · Rendimiento {String(recipe?.yieldQuantity ?? "-")}</p></div><div className="grid gap-3 sm:grid-cols-3"><Metric label="Costo por lote" value={`$${data.totalCost.toFixed(2)}`} /><Metric label="Costo por porción" value={`$${data.costPerPortion.toFixed(2)}`} /><Metric label="Food cost" value={data.salePrice && data.salePrice > 0 ? `${((data.costPerPortion / data.salePrice) * 100).toFixed(1)}%` : "-"} /></div><div><h2 className="text-lg font-semibold">Ingredientes</h2><ul className="mt-3 space-y-2">{data.ingredients.map((item) => <li key={`${item.ingredientName}-${item.quantity}`} className="flex justify-between gap-4 border-b border-border-default pb-2"><span>{item.ingredientName}</span><span>{item.quantity} {item.unit}</span></li>)}</ul></div><div><h2 className="text-lg font-semibold">Procedimiento</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6">{String(recipe?.procedure ?? "Procedimiento no registrado.")}</p></div><p className="pt-4 text-center text-xs text-text-secondary">Documento generado desde el inventario de restaurante.</p></CardContent></Card></div>; }

function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl border border-border-default bg-surface-interactive p-3"><p className="text-xs text-text-secondary">{label}</p><p className="mt-1 font-semibold">{value}</p></div>; }
function Field({ id, label, value, onChange, type = "text" }: { id: string; label: string; value: string; onChange: (value: string) => void; type?: string }) { return <div><Label htmlFor={id}>{label}</Label><Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} /></div>; }
function Select({ id, label, value, options, onChange }: { id: string; label: string; value: string; options: Array<{ id: string; label: string }>; onChange: (value: string) => void }) { return <div><Label htmlFor={id}>{label}</Label><select id={id} className="field" value={value} onChange={(event) => onChange(event.target.value)}><option value="">Seleccionar</option>{options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></div>; }
