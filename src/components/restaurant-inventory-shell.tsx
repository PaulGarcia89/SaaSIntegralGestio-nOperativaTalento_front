"use client";

import { useUiText } from "@/components/ui-copy";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { ModuleRouteGuard } from "@/components/module-route-guard";
import { InlineFeedback } from "@/components/design-system";
import { PageHeader } from "@/components/system";
import { RestaurantPhase2View } from "@/components/restaurant-inventory-phase2";
import { RestaurantSalesImport } from "@/components/restaurant-sales-import";
import { RestaurantReportsView } from "@/components/restaurant-reports";
import { RestaurantInventoryCatalog } from "@/components/restaurant-inventory-catalog";
import { RestaurantReceiptsScreen } from "@/components/restaurant-receipts";
import { RestaurantOperations } from "@/components/restaurant-operations";
import { RestaurantRecipesWorkspace } from "@/components/restaurant-recipes-workspace";
import { RestaurantInventoryContextBar, RestaurantInventoryContextProvider, useRestaurantInventoryContext } from "@/components/restaurant-inventory-context";
import { RestaurantActionBar } from "@/components/restaurant/restaurant-actions";
import { RestaurantModulePanel } from "@/components/restaurant/restaurant-module-panel";
import { RestaurantStockControlWorkspace } from "@/components/restaurant-stock-control-workspace";
import { RestaurantPurchasingWorkspace } from "@/components/restaurant-purchasing-workspace";
import { RestaurantAdvancedControlWorkspace } from "@/components/restaurant-advanced-control-workspace";
import { RestaurantCommercialIntelligenceWorkspace } from "@/components/restaurant-commercial-intelligence-workspace";

import { restaurantSections as taskGroups } from "@/lib/restaurant-navigation";
import { getRoutePolicy, isRoleAllowed } from "@/lib/navigation";
import { useLocale } from "@/components/locale-provider";

export function RestaurantInventoryShell() {
  return <ModuleRouteGuard module="restaurant_inventory" permission="restaurant_inventory.view"><RestaurantInventoryContextProvider><RestaurantInventoryInner /></RestaurantInventoryContextProvider></ModuleRouteGuard>;
}

function RestaurantInventoryInner() {
  const pathname = usePathname();
  const router = useRouter();
  const section = pathname.includes("/recipes") ? "recipes" : taskGroups.flatMap((task) => task.items).find((item) => item.key !== "dashboard" && pathname.endsWith(`/${item.key}`))?.key ?? "dashboard";
  const { currentUser, can } = useAppStore();
  const { t } = useLocale();
  const label = (value: string) => { const key = `nav.${value}`; const translated = t(key); return translated === key ? value : translated; };
  const { warehouseId, warehouseName, compactMode } = useRestaurantInventoryContext();
  const visibleTasks = taskGroups.map((task) => ({ ...task, items: task.items.filter((item) => { const policy = getRoutePolicy(item.href); return policy && isRoleAllowed(policy.roles, currentUser.role, policy.strictRoles) && policy.requiredPermissions.every(can); }) })).filter((task) => task.items.length);
  const activeTask = visibleTasks.find((task) => task.items.some((item) => item.key === section))?.key ?? "summary";
  const task = visibleTasks.find((item) => item.key === activeTask) ?? visibleTasks[0];
  const currentItem = task?.items.find((item) => item.key === section);
  if (!currentItem) return <InlineFeedback tone="warning" title={t("restaurant.accessDenied")} />;
  /*
   * El «modo cocina» APRETABA el texto a 14 px (`text-sm`), que es lo contrario
   * de lo que hace falta en una cocina: se mira de lejos, de pie y a veces con
   * guantes. Ahora reduce la separación entre bloques —gana altura útil— y
   * agranda los objetivos táctiles, sin tocar el tamaño de la letra.
   */
  return <div className={compactMode ? "space-y-3" : "space-y-6"} data-compact={compactMode ? "true" : "false"}>
    {/*
      Una sola capa de navegación dentro de la página.

      Antes había tres apiladas antes del contenido: una cuadrícula de seis
      botones para elegir «área», debajo una sección «Área activa» que repetía
      el nombre y la descripción de esa área, y dentro de ella otra fila de
      botones con las pantallas. Y encima, la barra lateral ya lleva estas
      mismas rutas agrupadas por intención desde el rediseño de navegación.

      Queda lo único que la barra lateral no da: saltar entre las pantallas
      HERMANAS del área en la que ya estás. El área la decide la ruta, no un
      selector: elegir un área sin ir a ninguna de sus pantallas no hacía nada.

      El filtro por permiso (`can(item.permission)`) se conserva intacto.
    */}
    {/*
      Un solo título por pantalla.

      Aquí se pintaba un `PageHeader` con «Inventario / Existencias» y justo
      debajo la pantalla pintaba el suyo con «Control / Existencias»: el mismo
      título dos veces, y entre ambos la tarjeta de contexto. En 390 px eso era
      la pantalla entera antes del primer dato. El título lo pone cada pantalla,
      que es la única que sabe su descripción y sus acciones; las dos pantallas
      del armazón que no traían el suyo —el panel y la portada de configuración—
      lo llevan ahora dentro.
    */}

    <RestaurantInventoryContextBar />

    {task && task.items.length > 1 ? (
      <nav aria-label={label(task.label)} className="min-w-0">
        <label className="block text-sm md:hidden" htmlFor="restaurant-section-view">
          {label("Ir a")}
          <select id="restaurant-section-view" className="field mt-1 w-full" value={currentItem?.href ?? ""}
            onChange={event => router.push(event.target.value)}>
            {task.items.map(item => <option key={item.key} value={item.href}>{label(item.label)}</option>)}
          </select>
        </label>
        <ul className="hidden flex-wrap gap-2 md:flex">
          {task.items.map(item => <li key={item.key}>
            <Link href={item.href} aria-current={section === item.key ? "page" : undefined}
              className={`flex min-h-11 items-center rounded-md border px-3 text-sm ${section === item.key ? "border-accent-line/50 bg-accent-fill/10 font-medium text-ink-1" : "border-line bg-surface-1 text-ink-2 hover:border-line-strong"}`}>
              {label(item.label)}
            </Link>
          </li>)}
        </ul>
      </nav>
    ) : null}

    <RestaurantActionBar />

    {/*
      Un panel, no tres pantallas apiladas.

      Aquí se pintaban a la vez «¿Qué necesitas hacer?» y «Dashboard orientado
      a decisiones»: dos cabeceras más la del armazón, dos acciones
      recomendadas distintas, ocho cifras, cuatro tarjetas de acción, dos
      listas y dos gráficos dibujados con `div`. Y dos peticiones que contaban
      cosas parecidas.

      El análisis de decisiones NO se pierde: ya vive en «Análisis»
      (`/inventory/restaurant/analytics`), que es donde corresponde a un
      informe de tercer nivel.
    */}
    {section === "dashboard" ? <RestaurantModulePanel /> : null}
    {section === "ingredients" ? <RestaurantInventoryCatalog kind="ingredients" /> : null}
    {section === "purchase-orders" ? <RestaurantPurchasingWorkspace hideNavigation key={section} initialView="orders" /> : null}
    {section === "price-history" ? <RestaurantPurchasingWorkspace hideNavigation key={section} initialView="prices" /> : null}
    {section === "purchase-suggestions" ? <RestaurantPurchasingWorkspace hideNavigation key={section} initialView="suggestions" /> : null}
    {section === "invoices" ? <RestaurantPurchasingWorkspace hideNavigation key={section} initialView="invoices" /> : null}
    {section === "expiry-alerts" ? <RestaurantAdvancedControlWorkspace hideNavigation key={section} initialView="fefo" /> : null}
    {section === "count-schedules" ? <RestaurantAdvancedControlWorkspace hideNavigation key={section} initialView="counts" /> : null}
    {section === "variance" ? <RestaurantAdvancedControlWorkspace hideNavigation key={section} initialView="variance" /> : null}
    {section === "shrinkage" ? <RestaurantAdvancedControlWorkspace hideNavigation key={section} initialView="shrinkage" /> : null}
    {section === "audit-log" ? <RestaurantAdvancedControlWorkspace hideNavigation key={section} initialView="audit" /> : null}
    {section === "forecast" ? <RestaurantCommercialIntelligenceWorkspace hideNavigation key={section} initialView="forecast" /> : null}
    {section === "branch-costs" ? <RestaurantCommercialIntelligenceWorkspace hideNavigation key={section} initialView="branches" /> : null}
    {section === "recipe-margins" ? <RestaurantCommercialIntelligenceWorkspace hideNavigation key={section} initialView="margins" /> : null}
    {section === "unit-comparison" ? <RestaurantCommercialIntelligenceWorkspace hideNavigation key={section} initialView="comparison" /> : null}
    {section === "commissary" ? <RestaurantCommercialIntelligenceWorkspace hideNavigation key={section} initialView="commissary" /> : null}
    {section === "purchase-budget" ? <RestaurantCommercialIntelligenceWorkspace hideNavigation key={section} initialView="budget" /> : null}
    {section === "receipts" ? <RestaurantReceiptsScreen /> : null}
    {section === "recipes" ? <RestaurantRecipesWorkspace /> : null}
    {section === "consumption" ? <RestaurantOperations section="consumption" warehouseId={warehouseId} warehouseName={warehouseName} /> : null}
    {section === "waste" ? <RestaurantOperations section="waste" warehouseId={warehouseId} warehouseName={warehouseName} /> : null}
    {section === "stock" ? <RestaurantStockControlWorkspace view="stock" /> : null}
    {section === "movements" ? <RestaurantStockControlWorkspace view="movements" /> : null}
    {["lots", "stock-counts", "adjustments", "transfers"].includes(section) ? <RestaurantPhase2View section={section} /> : null}
    {section === "production" ? <RestaurantOperations section="production" warehouseId={warehouseId} warehouseName={warehouseName} /> : null}
    {section === "sales-import" ? <RestaurantSalesImport /> : null}
    {section === "settings" ? <RestaurantInventorySettings /> : null}
    {["reports", "analytics", "costs", "audit"].includes(section) ? <RestaurantReportsView section={section} /> : null}
    {["categories", "units", "suppliers", "warehouses"].includes(section) ? <RestaurantInventoryCatalog kind={section as "categories" | "units" | "suppliers" | "warehouses"} /> : null}
  </div>;
}

function RestaurantInventorySettings() {
  const uiText = useUiText();
  const { t } = useLocale();
  const pages = taskGroups.find(group => group.key === "settings")!.items.filter(item => item.key !== "settings");
  return <div className="space-y-5"><PageHeader
    eyebrow={uiText("Inventario de restaurante")}
    title={uiText("Configuración")}
    description={uiText("Los catálogos que el resto del módulo usa: categorías, unidades y almacenes.")}
  /><div className="grid gap-4 md:grid-cols-3">{pages.map(page =>
    <Link key={page.key} href={page.href} className="rounded-xl border border-line bg-surface-1 p-5 text-ink-1 transition hover:border-accent-line">
      <h2 className="font-semibold">{t(`nav.${page.label}`)}</h2>
      <p className="mt-2 text-sm text-ink-2">{t(`restaurant.settings.${page.key}`)}</p>
    </Link>
  )}</div></div>;
}

/*
 * Aquí vivían cuatro pantallas muertas: `ReceiptsScreen`, `RecipesScreen`,
 * `ConsumptionScreen` y `WasteScreen`. Ninguna se importaba desde ningún
 * sitio —el armazón enruta a `RestaurantReceiptsScreen`,
 * `RestaurantRecipesWorkspace` y `RestaurantOperations`— y eran versiones
 * anteriores que se quedaron al migrar.
 *
 * No eran inertes. `RecipesScreen` pintaba `recipe.lines.length` y
 * `/restaurant-inventory/recipes` no incluye las líneas de la receta: el día
 * que alguien volviera a enrutar ese componente, la pantalla reventaría al
 * leer `.length` de `undefined`. Y las cuatro enseñaban importes —costo de
 * receta, total de la entrada, costo del consumo— sin comprobar
 * `restaurant_inventory.commercial.view`, que es justo el permiso que las
 * pantallas vivas respetan.
 */
