"use client";

import { useState } from "react";
import { ArrowLeft, ChefHat, ChevronLeft, ChevronRight, Edit3, Filter, ListChecks, Plus, Save, Scale, Archive, CheckCircle2, Printer, GitCompareArrows, BookOpen, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { activateRestaurantRecipe, archiveRestaurantRecipe, createRestaurantRecipe, fetchRestaurantCategories, fetchRestaurantIngredients, fetchRestaurantRecipeCost, fetchRestaurantRecipes, fetchRestaurantUnits, getApiErrorMessage } from "@/lib/backend";
import { useAppStore } from "@/store/app-store";
import { useLocale } from "@/components/locale-provider";
import { InlineFeedback, PageHeader } from "@/components/design-system";
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
const RECIPE_TYPE_KEY: Record<RecipeForm["recipeType"], string> = { MENU_ITEM: "recipes.type.MENU_ITEM", PREPARATION: "recipes.type.PREPARATION", YIELD: "recipes.yield" };
const RECIPE_STEPS = [{ key: "recipes.step.what", icon: ChefHat }, { key: "recipes.yield", icon: Scale }, { key: "recipes.components", icon: ListChecks }, { key: "recipes.step.review", icon: CheckCircle2 }];
const TYPE_HELP_KEY = { MENU_ITEM: "recipes.typeHelp.MENU_ITEM", PREPARATION: "recipes.typeHelp.PREPARATION", YIELD: "recipes.typeHelp.YIELD" };

export function RestaurantRecipesWorkspace() {
  const { t } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { can } = useAppStore();
  const showCosts = can("restaurant_inventory.commercial.view");
  const parts = pathname.split("/").filter(Boolean);
  const recipesIndex = parts.indexOf("recipes");
  const recipeId = recipesIndex >= 0 ? parts[recipesIndex + 1] : undefined;
  const mode = recipeId === "new" ? "new" : recipeId === "cost" ? "list" : recipeId ? (parts[recipesIndex + 2] === "cost" ? "cost" : parts[recipesIndex + 2] === "cookbook" ? "cookbook" : parts[recipesIndex + 2] === "edit" ? "edit" : "detail") : "list";
  const recipes = useQuery({ queryKey: ["restaurant-recipes"], queryFn: () => fetchRestaurantRecipes() });
  if (recipes.isLoading) return <SkeletonRows rows={5} label={t("recipes.loading")} />;
  if (recipes.error) return <ErrorState title={t("recipes.loadError")} detail={getApiErrorMessage(recipes.error, t("recipes.loadRecipesError"))} onRetry={() => { void (() => void recipes.refetch())(); }} />;
  const rows = (recipes.data ?? []) as unknown as RecipeRow[];
  if (mode === "list") return <RecipeList recipes={rows} showCosts={showCosts} onNew={() => router.push("/inventory/restaurant/recipes/new")} onOpen={(id) => router.push(`/inventory/restaurant/recipes/${id}`)} />;
  if (mode === "cost" && recipeId) return <SecureRecipeCost recipeId={recipeId} showCosts={showCosts} onBack={() => router.push("/inventory/restaurant/recipes")} onCookbook={() => router.push(`/inventory/restaurant/recipes/${recipeId}/cookbook`)} onNewVersion={can("restaurant_inventory.manage") ? () => router.push(`/inventory/restaurant/recipes/${recipeId}/edit`) : undefined} />;
  if (mode === "cookbook" && recipeId) return showCosts ? <RecipeCookbook recipe={rows.find((row) => String(row.id) === recipeId)} recipeId={recipeId} onBack={() => router.push(`/inventory/restaurant/recipes/${recipeId}`)} /> : <InlineFeedback tone="warning" title={t("recipes.commercialPermissionTitle")}>{t("recipes.commercialPermissionBody")}</InlineFeedback>;
  const selected = recipeId && recipeId !== "new" ? rows.find((row) => String(row.id) === recipeId) : undefined;
  return <RecipeEditor recipe={selected} isVersion={mode === "edit"} onBack={() => router.push("/inventory/restaurant/recipes")} />;
}

function RecipeList({ recipes, showCosts, onNew, onOpen }: { recipes: RecipeRow[]; showCosts: boolean; onNew: () => void; onOpen: (id: string) => void }) {
  const { t } = useLocale();
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
  return <div className="space-y-5"><PageHeader eyebrow={t("recipes.eyebrow")} title={t("recipes.title")} description={t("recipes.description")} actions={<Button onClick={onNew} disabled={!canManage}><Plus className="size-4" />{t("recipes.new")}</Button>} />{action.error ? <InlineFeedback tone="danger" title={t("recipes.updateError")}>{getApiErrorMessage(action.error, t("recipes.updateErrorBody"))}</InlineFeedback> : null}<Card level={1}><CardContent className="space-y-4 p-5"><div className="flex items-center gap-2 text-sm font-semibold"><Filter className="size-4 text-brand" />{t("recipes.filters")}</div><div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto]"><div><Label htmlFor="recipe-search">{t("recipes.search")}</Label><Input id="recipe-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("recipes.searchPlaceholder")} /></div><div><Label htmlFor="recipe-status">{t("recipes.status")}</Label><select id="recipe-status" className="field" value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">{t("recipes.all")}</option><option value="DRAFT">{t("recipes.status.DRAFT")}</option><option value="ACTIVE">{t("recipes.status.ACTIVE")}</option><option value="ARCHIVED">{t("recipes.status.ARCHIVED")}</option></select></div><div><Label htmlFor="recipe-type">{t("recipes.type")}</Label><select id="recipe-type" className="field" value={recipeType} onChange={(event) => setRecipeType(event.target.value)}><option value="ALL">{t("recipes.all")}</option><option value="MENU_ITEM">{t("recipes.type.MENU_ITEM.plural")}</option><option value="PREPARATION">{t("recipes.type.PREPARATION.plural")}</option><option value="YIELD">{t("recipes.type.YIELD.plural")}</option></select></div><label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={onlyWarnings} onChange={(event) => setOnlyWarnings(event.target.checked)} />{t("recipes.noCost")}</label></div></CardContent></Card><ul aria-label={t("recipes.listAria")} className="grid gap-4 xl:grid-cols-2 [&>li]:min-w-0">{visible.map((row) => <SecureRecipeCard key={String(row.id)} row={row} canManage={canManage} showCosts={showCosts} onOpen={onOpen} onAction={(type) => action.mutate({ id: String(row.id), type })} />)}</ul>{!visible.length ? <InlineFeedback tone="info" title={t("recipes.noResults")}>{t("recipes.noResultsHelp")}</InlineFeedback> : null}</div>;
}

const RECIPE_STATUS: Record<string, { key: string; tone: Tone }> = {
  DRAFT: { key: "recipes.status.DRAFT", tone: "neutral" },
  ACTIVE: { key: "recipes.status.ACTIVE", tone: "success" },
  ARCHIVED: { key: "recipes.status.ARCHIVED", tone: "blocked" },
};

/**
 * Tarjeta de receta en la lista: nombre, tipo, estado en palabras y —si se
 * puede ver— dos cifras que sí orientan: costo por porción y precio. El
 * costo del lote está en la ficha. Un botón principal («Consultar») y el
 * resto secundarios; «Activar» solo aparece en borradores.
 */
function SecureRecipeCard({ row, canManage, showCosts, onOpen, onAction }: { row: RecipeRow; canManage: boolean; showCosts: boolean; onOpen: (id: string) => void; onAction: (type: "activate" | "archive") => void }) {
  const { t } = useLocale();
  const status = String(row.status ?? "DRAFT"); const price = row.sellingPrice == null ? null : Number(row.sellingPrice);
  const badge = RECIPE_STATUS[status];
  const portionCost = Number(row.calculatedCost ?? 0) / Math.max(1, Number(row.yieldQuantity ?? 1));
  const foodCost = price && price > 0 ? (portionCost / price) * 100 : null;
  return <li className="flex flex-col gap-4 rounded-lg border border-line bg-surface-1 p-4 sm:p-5">
    <div className="flex items-start gap-3">
      <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-fill/15 text-accent-ink"><ChefHat className="size-5" /></span>
      <div className="min-w-0 flex-1">
        <h2 className="line-clamp-2 break-words text-base font-semibold leading-snug text-ink-1">{String(row.name ?? t("recipes.noName"))}</h2>
        <p className="mt-0.5 truncate text-sm text-ink-2">{row.outputIngredientId ? t("recipes.kindPreparation") : t("recipes.kindDish")} · {String(row.code ?? t("recipes.noCode"))} · v{String(row.version ?? 1)}</p>
      </div>
      <StatusBadge tone={badge?.tone ?? "neutral"} label={badge ? t(badge.key) : status} className="shrink-0" />
    </div>
    {showCosts ? <dl className="grid grid-cols-3 gap-3 [&>div]:min-w-0">
      <div><dt className="text-xs text-ink-3">{t("recipes.costPerPortion")}</dt><dd className="font-mono text-base font-semibold tabular-nums text-ink-1">${portionCost.toFixed(2)}</dd></div>
      <div><dt className="text-xs text-ink-3">{t("recipes.salePriceShort")}</dt><dd className="font-mono text-base font-semibold tabular-nums text-ink-1">{price == null ? "—" : `$${price.toFixed(2)}`}</dd></div>
      <div><dt className="text-xs text-ink-3">{t("recipes.foodCost")}</dt><dd className={cn("font-mono text-base font-semibold tabular-nums", foodCost == null ? "text-ink-1" : foodCost > 35 ? "text-status-warning" : "text-status-success")}>{foodCost == null ? "—" : `${foodCost.toFixed(1)}%`}</dd></div>
    </dl> : <p className="text-sm text-ink-3">{t("recipes.costsHidden")}</p>}
    <div className="flex flex-wrap gap-2 border-t border-line pt-4">
      <Button variant="secondary" onClick={() => onOpen(showCosts ? String(row.id) + "/cost" : String(row.id))}><ChevronRight className="size-4" />{t("recipes.view")}</Button>
      {status === "DRAFT" && canManage ? <Button onClick={() => onAction("activate")}><CheckCircle2 className="size-4" />{t("recipes.activate")}</Button> : null}
      {canManage ? <Button variant="ghost" onClick={() => onOpen(String(row.id) + "/edit")}><Edit3 className="size-4" />{t("recipes.newVersion")}</Button> : null}
      {status !== "ARCHIVED" && canManage ? <Button variant="ghost" onClick={() => onAction("archive")}><Archive className="size-4" />{t("recipes.archive")}</Button> : null}
    </div>
  </li>;
}

function SecureRecipeCost({ recipeId, showCosts, onBack, onCookbook, onNewVersion }: { recipeId: string; showCosts: boolean; onBack: () => void; onCookbook: () => void; onNewVersion?: () => void }) {
  const { t } = useLocale();
  const query = useQuery({ queryKey: ["restaurant-recipe-cost", recipeId], queryFn: () => fetchRestaurantRecipeCost(recipeId) });
  if (!showCosts) return <InlineFeedback tone="warning" title={t("recipes.commercialPermissionTitle")}>{t("recipes.commercialPermissionBody")}</InlineFeedback>;
  if (query.isLoading) return <SkeletonRows rows={5} label={t("recipes.loading")} />;
  if (query.error) return <ErrorState title={t("recipes.loadError")} detail={getApiErrorMessage(query.error, t("recipes.costError"))} onRetry={() => { void (() => void query.refetch())(); }} />;
  const data = query.data; const foodCost = data?.salePrice && data.salePrice > 0 ? (data.costPerPortion / data.salePrice) * 100 : null;
  return <div className="space-y-5"><PageHeader eyebrow={t("recipes.costingEyebrow")} title={data?.recipeName ?? t("recipes.costTitle")} description={t("recipes.costDescription")} actions={<span className="flex flex-wrap gap-2">{onNewVersion ? <Button onClick={onNewVersion}><Edit3 className="size-4" />{t("recipes.newVersion")}</Button> : null}<Button variant="secondary" onClick={onCookbook}><BookOpen className="size-4" />{t("recipes.cookbookMode")}</Button><Button variant="secondary" onClick={onBack}><ArrowLeft className="size-4" />{t("recipes.backToRecipes")}</Button></span>} />{data ? <><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6"><Metric label={t("recipes.batchCost")} value={`$${data.totalCost.toFixed(2)}`} /><Metric label={t("recipes.costPerPortion")} value={`$${data.costPerPortion.toFixed(2)}`} /><Metric label={t("recipes.salePriceShort")} value={data.salePrice == null ? "-" : `$${data.salePrice.toFixed(2)}`} /><Metric label={t("recipes.foodCost")} value={foodCost == null ? "-" : `${foodCost.toFixed(1)}%`} /><Metric label={t("recipes.margin")} value={data.marginAmount == null ? "-" : `$${data.marginAmount.toFixed(2)}`} /><Metric label={t("recipes.marginPercent")} value={data.marginPercent == null ? "-" : `${data.marginPercent.toFixed(1)}%`} /></div><Card level={2}><CardContent className="p-5"><h2 className="font-semibold">{t("recipes.ingredientBreakdown")}</h2><RowTable caption={t("recipes.ingredientBreakdown")} headers={[t("recipes.ingredient"), t("recipes.quantity"), t("recipes.unit"), t("recipes.unitCost"), t("recipes.totalCost")]}>{data.ingredients.map((item) => <tr key={`${item.ingredientName}-${item.quantity}`}><td className="px-3 py-3">{item.ingredientName}</td><td className="px-3 py-3">{item.quantity}</td><td className="px-3 py-3">{item.unit}</td><td className="px-3 py-3">${item.unitCost.toFixed(2)}</td><td className="px-3 py-3">${item.ingredientCost.toFixed(2)}</td></tr>)}</RowTable></CardContent></Card><RecipeHistory history={data.history} /></> : null}</div>;
}

function RecipeEditor({ recipe, isVersion, onBack }: { recipe?: RecipeRow; isVersion: boolean; onBack: () => void }) {
  const { t } = useLocale();
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
  if (ingredients.isLoading || units.isLoading || categories.isLoading || subrecipes.isLoading) return <SkeletonRows rows={5} label={t("recipes.loading")} />;
  const invalid = !canManage || !form.code.trim() || !form.name.trim() || !form.yieldUnitId || Number(form.yieldQuantity) <= 0 || lines.some((line) => (!line.ingredientId && !line.subrecipeId) || !line.unitId || Number(line.quantity) <= 0);
  /*
   * Cuatro pasos en vez de cinco secciones en una sola página larga: qué es,
   * cuánto rinde, de qué se compone, y revisar y guardar. Cada paso valida
   * solo lo suyo y el botón «Continuar» dice qué falta en vez de apagarse
   * sin explicación. El costo lo calcula el servidor al guardar y se enseña
   * en el último paso, como antes.
   */
  const stepErrors: string[][] = [
    [!form.code.trim() ? t("recipes.error.code") : "", !form.name.trim() ? t("recipes.error.name") : ""].filter(Boolean),
    [Number(form.yieldQuantity) <= 0 ? t("recipes.error.yieldQuantity") : "", !form.yieldUnitId ? t("recipes.error.yieldUnit") : ""].filter(Boolean),
    [lines.some((line) => (!line.ingredientId && !line.subrecipeId) || !line.unitId || Number(line.quantity) <= 0) ? t("recipes.error.lines") : ""].filter(Boolean),
    [],
  ];
  const stepDone = [form.code.trim() !== "" && form.name.trim() !== "", Number(form.yieldQuantity) > 0 && form.yieldUnitId !== "", lines.length > 0 && stepErrors[2].length === 0, Boolean(saved)];
  const portionCost = saved ? Number(saved.calculatedCost ?? 0) / Math.max(1, Number(form.yieldQuantity)) : null;
  const goTo = (index: number) => setStep(Math.max(0, Math.min(3, index)));

  return <div className="space-y-5"><PageHeader eyebrow={isVersion ? t("recipes.versionEyebrow") : t("recipes.eyebrow")} title={isVersion ? `Nueva versión de ${form.name || "receta"}` : t("recipes.new")} description={isVersion ? t("recipes.versionDescription") : t("recipes.newDescription")} actions={<Button variant="secondary" onClick={onBack}><ArrowLeft className="size-4" />{t("recipes.backToRecipes")}</Button>} />
    {!canManage ? <InlineNote tone="blocked" title={t("recipes.noManageTitle")}>{t("recipes.noManageBody")}</InlineNote> : null}
    <section className="rounded-lg border border-line bg-surface-1 p-5 shadow-e1 sm:p-6">
      <Stepper label={t("recipes.stepsAria")} steps={RECIPE_STEPS.map((item) => ({ label: t(item.key), icon: item.icon }))} current={step} completed={stepDone} freeNavigation onSelect={goTo} />
      <div className="mt-6 space-y-5 border-t border-line pt-6">
        {step === 0 ? <>
          <h2 className="text-lg font-semibold text-ink-1">{t("recipes.stepWhatTitle")}</h2>
          <div className="grid gap-4 md:grid-cols-2"><Field id="recipe-name" label={t("recipes.name")} value={form.name} onChange={(value) => setForm({ ...form, name: value })} /><Field id="recipe-code" label={t("recipes.code")} value={form.code} onChange={(value) => setForm({ ...form, code: value })} /><Select id="recipe-type" label={t("recipes.recipeType")} value={form.recipeType} options={[{ id: "MENU_ITEM", label: t("recipes.type.MENU_ITEM") }, { id: "PREPARATION", label: t("recipes.type.PREPARATION") }, { id: "YIELD", label: t("recipes.yield") }]} onChange={(value) => setForm({ ...form, recipeType: value as RecipeForm["recipeType"] })} /><Select id="recipe-category" label={t("recipes.category")} value={form.categoryId} options={(categories.data?.data ?? []).map((item) => ({ id: item.id, label: item.name }))} onChange={(value) => setForm({ ...form, categoryId: value })} /></div>
          <p className="text-sm text-ink-2">{t(TYPE_HELP_KEY[form.recipeType])}</p>
          <details className="rounded-md border border-line"><summary className="min-h-[var(--control-h-base)] cursor-pointer list-none px-4 py-2 text-sm font-medium text-ink-1 [&::-webkit-details-marker]:hidden">{t("recipes.descriptionAndProcedure")} <span className="font-normal text-ink-3">{t("recipes.optional")}</span></summary><div className="space-y-4 border-t border-line p-4"><Field id="recipe-description" label={t("recipes.descriptionField")} value={form.description} onChange={(value) => setForm({ ...form, description: value })} /><div><Label htmlFor="recipe-procedure">{t("recipes.procedure")}</Label><textarea id="recipe-procedure" className="field min-h-32" value={form.procedure} onChange={(event) => setForm({ ...form, procedure: event.target.value })} placeholder={t("recipes.procedurePlaceholder")} /></div></div></details>
        </> : null}

        {step === 1 ? <>
          <h2 className="text-lg font-semibold text-ink-1">{t("recipes.stepYieldTitle")}</h2>
          <div className="grid gap-4 md:grid-cols-3"><Field id="recipe-yield" label={t("recipes.yieldQuantity")} type="number" value={form.yieldQuantity} onChange={(value) => setForm({ ...form, yieldQuantity: value })} /><Select id="recipe-yield-unit" label={t("recipes.yieldUnit")} value={form.yieldUnitId} options={unitOptions.map((item) => ({ id: item.id, label: `${item.name} (${item.abbreviation})` }))} onChange={(value) => setForm({ ...form, yieldUnitId: value })} />{form.recipeType === "MENU_ITEM" ? <Field id="recipe-price" label={t("recipes.salePrice")} type="number" value={form.sellingPrice} onChange={(value) => setForm({ ...form, sellingPrice: value })} /> : null}</div>
          <p className="text-sm text-ink-2">{t("recipes.yieldExamples")}</p>
          {["PREPARATION", "YIELD"].includes(form.recipeType) ? <Select id="recipe-output" label={t("recipes.outputIngredient")} value={form.outputIngredientId} options={ingredientOptions.map((item) => ({ id: item.id, label: `${item.sku} · ${item.name}` }))} onChange={(value) => setForm({ ...form, outputIngredientId: value })} /> : null}
        </> : null}

        {step === 2 ? <>
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold text-ink-1">{t("recipes.stepComponentsTitle")}</h2><Button variant="secondary" onClick={() => setLines([...lines, { ingredientId: "", subrecipeId: "", unitId: "", quantity: "", wastePercentage: "0" }])}><Plus className="size-4" />{t("recipes.addLine")}</Button></div>
          {lines.length ? <ol className="space-y-3">{lines.map((line, index) => <li key={index} className="grid gap-3 rounded-md border border-line p-4 md:grid-cols-[1.4fr_1.4fr_1fr_1fr_1fr_auto] [&>*]:min-w-0"><Select id={`recipe-line-ingredient-${index}`} label={t("recipes.ingredient")} value={line.ingredientId} options={ingredientOptions.map((item) => ({ id: item.id, label: `${item.sku} · ${item.name}` }))} onChange={(value) => setLines(lines.map((current, i) => i === index ? { ...current, ingredientId: value, subrecipeId: "" } : current))} /><Select id={`recipe-line-subrecipe-${index}`} label={t("recipes.orSubrecipe")} value={line.subrecipeId} options={(subrecipes.data ?? []).filter((item) => String(item.id) !== String(recipe?.id ?? "")).map((item) => ({ id: item.id, label: `${item.code} · ${item.name}` }))} onChange={(value) => setLines(lines.map((current, i) => i === index ? { ...current, subrecipeId: value, ingredientId: "" } : current))} /><Field id={`recipe-line-quantity-${index}`} label={t("recipes.quantity")} type="number" value={line.quantity} onChange={(value) => setLines(lines.map((current, i) => i === index ? { ...current, quantity: value } : current))} /><Select id={`recipe-line-unit-${index}`} label={t("recipes.unit")} value={line.unitId} options={unitOptions.map((item) => ({ id: item.id, label: `${item.name} (${item.abbreviation})` }))} onChange={(value) => setLines(lines.map((current, i) => i === index ? { ...current, unitId: value } : current))} /><Field id={`recipe-line-waste-${index}`} label={t("recipes.waste")} type="number" value={line.wastePercentage} onChange={(value) => setLines(lines.map((current, i) => i === index ? { ...current, wastePercentage: value } : current))} /><Button variant="ghost" className="self-end" aria-label={`Eliminar línea ${index + 1}`} onClick={() => setLines(lines.filter((_, i) => i !== index))}><Trash2 className="size-4" />{t("recipes.remove")}</Button></li>)}</ol> : <EmptyState reason="no-records" title={t("recipes.noComponentsTitle")} description={t("recipes.noComponentsHelp")} action={<Button onClick={() => setLines([{ ingredientId: "", subrecipeId: "", unitId: "", quantity: "", wastePercentage: "0" }])}><Plus className="size-4" />{t("recipes.addFirstLine")}</Button>} />}
        </> : null}

        {step === 3 ? <>
          <h2 className="text-lg font-semibold text-ink-1">{t("recipes.stepReviewTitle")}</h2>
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 [&>div]:min-w-0">
            <div><dt className="text-xs text-ink-3">{t("recipes.recipe")}</dt><dd className="text-ink-1">{form.name || "—"} · {form.code || "—"}</dd></div>
            <div><dt className="text-xs text-ink-3">{t("recipes.type")}</dt><dd className="text-ink-1">{t(RECIPE_TYPE_KEY[form.recipeType])}</dd></div>
            <div><dt className="text-xs text-ink-3">{t("recipes.yield")}</dt><dd className="text-ink-1">{form.yieldQuantity} {String(unitOptions.find((item) => item.id === form.yieldUnitId)?.abbreviation ?? "")}</dd></div>
            <div><dt className="text-xs text-ink-3">{t("recipes.components")}</dt><dd className="text-ink-1">{lines.length}</dd></div>
            <div><dt className="text-xs text-ink-3">{t("recipes.branch")}</dt><dd className="text-ink-1">{currentBranch?.name ?? t("recipes.currentContext")}</dd></div>
          </dl>
          <Select id="recipe-stock-policy" label={t("recipes.stockPolicy")} value={form.requiredStockPolicy} options={[{ id: "BLOCK", label: t("recipes.stockPolicy.BLOCK") }, { id: "WARN", label: t("recipes.stockPolicy.WARN") }, { id: "ALLOW_NEGATIVE", label: t("recipes.stockPolicy.ALLOW_NEGATIVE") }]} onChange={(value) => setForm({ ...form, requiredStockPolicy: value as RecipeForm["requiredStockPolicy"] })} />
          {stepErrors.slice(0, 3).some((errors) => errors.length) ? <InlineNote tone="warning" title={t("recipes.previousStepsIncomplete")}>{stepErrors.flat().join(" · ")}</InlineNote> : null}
          {save.error ? <InlineNote tone="danger" title={t("recipes.saveError")}>{getApiErrorMessage(save.error, t("recipes.saveErrorBody"))}</InlineNote> : null}
          {saved ? <div className="rounded-lg border border-status-success/40 bg-status-success/5 p-4"><p className="flex items-center gap-2 font-semibold text-ink-1"><CheckCircle2 className="size-5 text-status-success" aria-hidden="true" />{t("recipes.draftSaved")}</p><dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 [&>div]:min-w-0"><div><dt className="text-xs text-ink-3">{t("recipes.batchCost")}</dt><dd className="font-mono font-semibold tabular-nums text-ink-1">${Number(saved.calculatedCost ?? 0).toFixed(2)}</dd></div><div><dt className="text-xs text-ink-3">{t("recipes.perPortion")}</dt><dd className="font-mono font-semibold tabular-nums text-ink-1">${(portionCost ?? 0).toFixed(2)}</dd></div><div><dt className="text-xs text-ink-3">{t("recipes.foodCost")}</dt><dd className="font-mono font-semibold tabular-nums text-ink-1">{form.sellingPrice && portionCost != null ? `${((portionCost / Number(form.sellingPrice)) * 100).toFixed(1)}%` : "—"}</dd></div><div><dt className="text-xs text-ink-3">{t("recipes.margin")}</dt><dd className="font-mono font-semibold tabular-nums text-ink-1">{form.sellingPrice && portionCost != null ? `$${(Number(form.sellingPrice) - portionCost).toFixed(2)}` : "—"}</dd></div></dl><p className="mt-3 text-sm text-ink-2">{t("recipes.activateHint")}</p></div> : null}
        </> : null}

        <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>{step > 0 ? <Button variant="ghost" onClick={() => goTo(step - 1)}><ChevronLeft className="size-4" />{t("recipes.previous")}</Button> : <Button variant="ghost" onClick={onBack}>{t("recipes.discard")}</Button>}</div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {step < 3 && stepErrors[step].length ? <p className="text-sm text-ink-2" role="status">{stepErrors[step].join(" · ")}</p> : null}
            {step < 3
              ? <Button disabled={stepErrors[step].length > 0} onClick={() => goTo(step + 1)}>{t("recipes.continue")}<ChevronRight className="size-4" /></Button>
              : saved
                ? <Button onClick={onBack}>{t("recipes.backToRecipes")}<ChevronRight className="size-4" /></Button>
                : <Button disabled={invalid || save.isPending} onClick={() => save.mutate()}><Save className="size-4" />{save.isPending ? t("recipes.saving") : isVersion ? t("recipes.saveNewVersion") : t("recipes.saveDraft")}</Button>}
          </div>
        </div>
      </div>
    </section>
  </div>;
}

function RecipeHistory({ history }: { history: Array<{ changedAt: string; changedBy: string; previousCost: number; newCost: number; reason?: string | null }> }) { const { t } = useLocale(); const [compare, setCompare] = useState(0); const selected = history[compare]; return <Card level={2}><CardContent className="space-y-4 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">{t("recipes.historyTitle")}</h2><p className="text-sm text-text-secondary">{t("recipes.historyHelp")}</p></div><GitCompareArrows className="size-5 text-brand" /></div>{history.length ? <><select className="field" value={compare} onChange={(event) => setCompare(Number(event.target.value))}>{history.map((item, index) => <option key={`${item.changedAt}-${index}`} value={index}>{new Date(item.changedAt).toLocaleString()} · {item.changedBy}</option>)}</select>{selected ? <div className="grid gap-3 sm:grid-cols-3"><Metric label={t("recipes.previousCost")} value={`$${selected.previousCost.toFixed(2)}`} /><Metric label={t("recipes.newCost")} value={`$${selected.newCost.toFixed(2)}`} /><Metric label={t("recipes.variation")} value={`$${(selected.newCost - selected.previousCost).toFixed(2)}`} /></div> : null}<p className="text-sm text-text-secondary">{selected?.reason ?? t("recipes.noReason")}</p></> : <p className="text-sm text-text-secondary">{t("recipes.noHistory")}</p>}</CardContent></Card>; }

function RecipeCookbook({ recipe, recipeId, onBack }: { recipe?: RecipeRow; recipeId: string; onBack: () => void }) { const { t } = useLocale(); const cost = useQuery({ queryKey: ["restaurant-recipe-cost", recipeId], queryFn: () => fetchRestaurantRecipeCost(recipeId) }); if (cost.isLoading) return <SkeletonRows rows={5} label={t("recipes.loading")} />; if (cost.error || !cost.data) return <ErrorState title={t("recipes.loadError")} detail={getApiErrorMessage(cost.error, t("recipes.cookbookError"))} onRetry={() => { void (() => void cost.refetch())(); }} />; const data = cost.data; return <div className="mx-auto max-w-3xl space-y-5 print:max-w-none"><div className="flex flex-wrap justify-between gap-3 print:hidden"><Button variant="secondary" onClick={onBack}><ArrowLeft className="size-4" />{t("recipes.back")}</Button><Button onClick={() => window.print()}><Printer className="size-4" />{t("recipes.printCookbook")}</Button></div><Card className="print:border-0 print:shadow-none"><CardContent className="space-y-6 p-8"><div className="border-b border-border-default pb-5 text-center"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">{t("recipes.cookbookTitle")}</p><h1 className="mt-2 text-3xl font-bold">{String(recipe?.name ?? data.recipeName)}</h1><p className="mt-2 text-sm text-text-secondary">Código {String(recipe?.code ?? "-")} · Rendimiento {String(recipe?.yieldQuantity ?? "-")}</p></div><div className="grid gap-3 sm:grid-cols-3"><Metric label={t("recipes.costPerBatch")} value={`$${data.totalCost.toFixed(2)}`} /><Metric label={t("recipes.costPerPortion")} value={`$${data.costPerPortion.toFixed(2)}`} /><Metric label={t("recipes.foodCost")} value={data.salePrice && data.salePrice > 0 ? `${((data.costPerPortion / data.salePrice) * 100).toFixed(1)}%` : "-"} /></div><div><h2 className="text-lg font-semibold">{t("recipes.ingredients")}</h2><ul className="mt-3 space-y-2">{data.ingredients.map((item) => <li key={`${item.ingredientName}-${item.quantity}`} className="flex justify-between gap-4 border-b border-border-default pb-2"><span>{item.ingredientName}</span><span>{item.quantity} {item.unit}</span></li>)}</ul></div><div><h2 className="text-lg font-semibold">{t("recipes.procedure")}</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6">{String(recipe?.procedure ?? t("recipes.noProcedure"))}</p></div><p className="pt-4 text-center text-xs text-text-secondary">{t("recipes.cookbookFooter")}</p></CardContent></Card></div>; }

function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl border border-border-default bg-surface-interactive p-3"><p className="text-xs text-text-secondary">{label}</p><p className="mt-1 font-semibold">{value}</p></div>; }
function Field({ id, label, value, onChange, type = "text" }: { id: string; label: string; value: string; onChange: (value: string) => void; type?: string }) { return <div><Label htmlFor={id}>{label}</Label><Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} /></div>; }
function Select({ id, label, value, options, onChange }: { id: string; label: string; value: string; options: Array<{ id: string; label: string }>; onChange: (value: string) => void }) { const { t } = useLocale(); return <div><Label htmlFor={id}>{label}</Label><select id={id} className="field" value={value} onChange={(event) => onChange(event.target.value)}><option value="">{t("recipes.select")}</option>{options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></div>; }
