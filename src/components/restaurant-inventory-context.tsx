"use client";

import { useUiText } from "@/components/ui-copy";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { MapPin, Rows3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchRestaurantWarehouses, getApiErrorMessage } from "@/lib/backend";
import { useAppStore } from "@/store/app-store";
import { confirmAction } from "@/components/confirm-action";
import { InlineFeedback } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Warehouse = { id: string; branchId?: string; code?: string; name?: string; location?: string; address?: string; city?: string; state?: string };
type InventoryContextValue = {
  warehouseId: string;
  warehouseName: string;
  warehouses: Warehouse[];
  setWarehouseId: (id: string) => void;
  hasPendingChanges: boolean;
  setHasPendingChanges: (value: boolean) => void;
  compactMode: boolean;
  toggleCompactMode: () => void;
  isLoading: boolean;
  error: unknown;
};

const InventoryContext = createContext<InventoryContextValue | null>(null);

export function RestaurantInventoryContextProvider({ children }: { children: ReactNode }) {
  const { currentBranch, currentTenant, currentUser } = useAppStore();
  const [, refreshSelection] = useState(0);
  const [, refreshCompactMode] = useState(0);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const storageKey = `restaurant-inventory-warehouse:${currentUser.id || "anonymous"}:${currentBranch?.id || "none"}`;
  const compactStorageKey = `restaurant-inventory-compact:${currentUser.id || "anonymous"}`;
  const warehousesQuery = useQuery({
    queryKey: ["restaurant-global-warehouses", currentTenant.id],
    queryFn: () => fetchRestaurantWarehouses({ status: "ACTIVE", pageSize: 200 }),
    enabled: Boolean(currentTenant.id),
  });
  const warehouses = ((warehousesQuery.data?.data ?? []) as Warehouse[]).filter((item) => !currentBranch?.id || item.branchId === currentBranch.id);
  const persistedWarehouseId = typeof window === "undefined" ? "" : window.localStorage.getItem(storageKey) ?? "";
  const compactMode = typeof window !== "undefined" && window.localStorage.getItem(compactStorageKey) === "true";
  const selected = warehouses.find((item) => item.id === persistedWarehouseId) ?? warehouses[0];
  const setWarehouseId = (id: string) => {
    window.localStorage.setItem(storageKey, id);
    refreshSelection((value) => value + 1);
  };
  const toggleCompactMode = () => {
    window.localStorage.setItem(compactStorageKey, String(!compactMode));
    refreshCompactMode((value) => value + 1);
  };
  useEffect(() => {
    if (!hasPendingChanges) return;
    const preventLoss = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", preventLoss);
    return () => window.removeEventListener("beforeunload", preventLoss);
  }, [hasPendingChanges]);
  const value: InventoryContextValue = {
    warehouseId: selected?.id ?? "",
    warehouseName: selected ? `${selected.code ? `${selected.code} · ` : ""}${selected.name ?? "Almacén"}` : "Sin almacén",
    warehouses,
    setWarehouseId,
    hasPendingChanges,
    setHasPendingChanges,
    compactMode,
    toggleCompactMode,
    isLoading: warehousesQuery.isLoading,
    error: warehousesQuery.error,
  };

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useRestaurantInventoryContext() {
  const value = useContext(InventoryContext);
  if (!value) throw new Error("useRestaurantInventoryContext debe usarse dentro del proveedor de inventario");
  return value;
}

/**
 * Dónde estoy, en una línea.
 *
 * Era una tarjeta de tres columnas, pegada arriba y presente en las 38
 * pantallas del módulo: un rótulo «CONTEXTO OPERATIVO», la frase «Sucursal ·
 * Almacén» repetida, los dos desplegables completos y un botón de modo cocina
 * con el mismo peso visual que ellos. Ocupaba alto permanente para una
 * decisión que se toma una vez al día, y en 390 px empujaba el primer dato
 * fuera de la pantalla.
 *
 * Ahora es una línea que responde «dónde estoy» y un botón que abre el cambio
 * cuando hace falta. La ubicación del almacén se escribe UNA vez: antes salía
 * dentro de cada `<option>` y otra vez en un párrafo debajo, así que
 * «Ubicación no registrada» aparecía dos veces seguidas en pantalla.
 *
 * Se conserva íntegra la guarda de cambios sin guardar: cambiar de sucursal o
 * de almacén en mitad de un registro sigue avisando de lo que se descarta.
 */
export function RestaurantInventoryContextBar() {
  const uiText = useUiText();
  const { currentBranch, tenantBranches, setCurrentBranchId } = useAppStore();
  const { warehouseId, warehouses, setWarehouseId, hasPendingChanges, setHasPendingChanges, warehouseName, compactMode, toggleCompactMode, isLoading, error } = useRestaurantInventoryContext();
  const [abierto, setAbierto] = useState(false);

  /**
   * Cambiar de sucursal o de almacén descarta lo que se esté registrando.
   *
   * Era el último `window.confirm` del producto, y encima el peor sitio para
   * uno: la barra de contexto vive en TODAS las pantallas del módulo, así que
   * cualquiera que tocase el selector con un consumo a medias veía una caja
   * gris del sistema operativo preguntando por «esta ubicación». Ahora dice
   * qué se pierde y el botón nombra la acción.
   */
  const guard = (perform: () => void) => {
    if (!hasPendingChanges) {
      perform();
      return;
    }
    void confirmAction({
      title: "Tienes cambios sin guardar",
      description: "Estás en mitad de un registro que todavía no se ha confirmado.",
      consequence: "Si cambias de contexto ahora, lo que llevas escrito se descarta y hay que empezarlo de nuevo.",
      confirmLabel: "Descartar y cambiar",
      cancelLabel: "Seguir donde estoy",
    }).then((ok) => {
      if (ok) perform();
    });
  };
  const changeBranch = (id: string) => {
    if (id === currentBranch?.id) return;
    guard(() => {
      setHasPendingChanges(false);
      void setCurrentBranchId(id);
    });
  };
  const changeWarehouse = (id: string) => {
    if (id === warehouseId) return;
    guard(() => {
      setHasPendingChanges(false);
      setWarehouseId(id);
    });
  };
  const location = (warehouse: Warehouse) => warehouse.location ?? warehouse.address ?? ([warehouse.city, warehouse.state].filter(Boolean).join(", ") || "");
  const ubicacion = location(warehouses.find((item) => item.id === warehouseId) ?? {} as Warehouse);

  return <div className="sticky top-2 z-20 space-y-2">
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-line bg-surface-1 px-3 py-2 shadow-e1">
      <MapPin className="size-4 shrink-0 text-ink-3" aria-hidden="true" />
      <p className="min-w-0 flex-1 basis-40 truncate text-sm text-ink-2" aria-live="polite">
        <span className="font-medium text-ink-1">{currentBranch?.name ?? uiText("Sin sucursal")}</span>
        {" · "}{warehouseName}
        {ubicacion ? <span className="text-ink-3">{" · "}{ubicacion}</span> : null}
      </p>
      {hasPendingChanges ? <span className="shrink-0 rounded-md border border-line bg-surface-2 px-2 py-0.5 text-2xs font-medium text-ink-2">{uiText("Cambios pendientes")}</span> : null}
      <Button type="button" size="sm" variant="secondary" className="shrink-0" onClick={() => setAbierto(true)}>
        {uiText("Cambiar")}
      </Button>
    </div>

    {error ? <InlineFeedback tone="danger" title={uiText("No se pudieron cargar los almacenes")}>{getApiErrorMessage(error, "Revisa la conexión e inténtalo de nuevo.")}</InlineFeedback> : null}
    {!isLoading && currentBranch && !warehouses.length ? <InlineFeedback tone="warning" title={uiText("Sin almacenes disponibles")}>{uiText("La sucursal actual no tiene un almacén activo asignado.")}</InlineFeedback> : null}

    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{uiText("Dónde estás trabajando")}</DialogTitle>
          <DialogDescription>{uiText("Todo lo que registres y todo lo que veas pertenece a esta sucursal y a este almacén.")}</DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <div>
            <Label htmlFor="restaurant-global-branch">{uiText("Sucursal activa")}</Label>
            <select id="restaurant-global-branch" className="field mt-1" value={currentBranch?.id ?? ""} onChange={(event) => changeBranch(event.target.value)}>
              <option value="">{uiText("Seleccionar sucursal")}</option>
              {tenantBranches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="restaurant-global-warehouse">{uiText("Almacén activo")}</Label>
            <select id="restaurant-global-warehouse" className="field mt-1" value={warehouseId} onChange={(event) => changeWarehouse(event.target.value)} disabled={isLoading || !currentBranch}>
              <option value="">{uiText("Seleccionar almacén")}</option>
              {warehouses.map((warehouse) => {
                const donde = location(warehouse);
                return <option key={warehouse.id} value={warehouse.id}>{`${warehouse.code ? `${warehouse.code} · ` : ""}${warehouse.name ?? "Almacén"}${donde ? ` · ${donde}` : ""}`}</option>;
              })}
            </select>
          </div>
          {/*
            El modo cocina es una preferencia de quien mira, no un contexto de
            trabajo: tenía el mismo peso visual que los dos selectores y se
            confundía con ellos. Y ya no encoge la letra —lo contrario de lo
            que hace falta a un metro de la pantalla—: gana altura juntando los
            bloques y agranda los objetivos táctiles.
          */}
          <div className="rounded-xl border border-line bg-surface-2 p-3">
            <Button type="button" variant={compactMode ? "default" : "secondary"} className="w-full min-h-[var(--control-h-touch)]" onClick={toggleCompactMode}>
              <Rows3 className="size-4" aria-hidden="true" />
              {compactMode ? uiText("Modo cocina activo") : uiText("Activar modo cocina")}
            </Button>
            <p className="mt-2 text-sm text-ink-2">{uiText("Botones más grandes y menos espacio entre bloques, para usar el módulo de pie y con las manos ocupadas.")}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>;
}
