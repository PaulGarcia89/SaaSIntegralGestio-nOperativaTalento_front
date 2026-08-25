"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchRestaurantWarehouses, getApiErrorMessage } from "@/lib/backend";
import { useAppStore } from "@/store/app-store";
import { InlineFeedback } from "@/components/design-system";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

type Warehouse = { id: string; branchId?: string; code?: string; name?: string; location?: string; address?: string; city?: string; state?: string };
type InventoryContextValue = {
  warehouseId: string;
  warehouseName: string;
  warehouses: Warehouse[];
  setWarehouseId: (id: string) => void;
  isLoading: boolean;
  error: unknown;
};

const InventoryContext = createContext<InventoryContextValue | null>(null);

export function RestaurantInventoryContextProvider({ children }: { children: ReactNode }) {
  const { currentBranch, currentTenant, currentUser } = useAppStore();
  const [, refreshSelection] = useState(0);
  const storageKey = `restaurant-inventory-warehouse:${currentUser.id || "anonymous"}:${currentBranch?.id || "none"}`;
  const warehousesQuery = useQuery({
    queryKey: ["restaurant-global-warehouses", currentTenant.id],
    queryFn: () => fetchRestaurantWarehouses({ status: "ACTIVE", pageSize: 200 }),
    enabled: Boolean(currentTenant.id),
  });
  const warehouses = ((warehousesQuery.data?.data ?? []) as Warehouse[]).filter((item) => !currentBranch?.id || item.branchId === currentBranch.id);
  const persistedWarehouseId = typeof window === "undefined" ? "" : window.localStorage.getItem(storageKey) ?? "";
  const selected = warehouses.find((item) => item.id === persistedWarehouseId) ?? warehouses[0];
  const setWarehouseId = (id: string) => {
    window.localStorage.setItem(storageKey, id);
    refreshSelection((value) => value + 1);
  };
  const value: InventoryContextValue = {
    warehouseId: selected?.id ?? "",
    warehouseName: selected ? `${selected.code ? `${selected.code} · ` : ""}${selected.name ?? "Almacén"}` : "Sin almacén",
    warehouses,
    setWarehouseId,
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

export function RestaurantInventoryContextBar() {
  const { currentBranch, tenantBranches, setCurrentBranchId } = useAppStore();
  const { warehouseId, warehouses, setWarehouseId, warehouseName, isLoading, error } = useRestaurantInventoryContext();
  const location = (warehouse: Warehouse) => warehouse.location ?? warehouse.address ?? ([warehouse.city, warehouse.state].filter(Boolean).join(", ") || "Ubicación no registrada");
  return <div className="space-y-3">
    <Card level={1}><CardContent className="grid gap-4 p-4 md:grid-cols-2">
      <div><Label htmlFor="restaurant-global-branch">Sucursal activa</Label><select id="restaurant-global-branch" className="mt-1 h-11 w-full rounded-2xl border border-border-default bg-surface-elevated px-3" value={currentBranch?.id ?? ""} onChange={(event) => void setCurrentBranchId(event.target.value)}><option value="">Seleccionar sucursal</option>{tenantBranches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></div>
      <div><Label htmlFor="restaurant-global-warehouse">Almacén activo</Label><select id="restaurant-global-warehouse" className="mt-1 h-11 w-full rounded-2xl border border-border-default bg-surface-elevated px-3" value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)} disabled={isLoading || !currentBranch}><option value="">Seleccionar almacén</option>{warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{`${warehouse.code ? `${warehouse.code} · ` : ""}${warehouse.name ?? "Almacén"} · ${location(warehouse)}`}</option>)}</select><p className="mt-1 text-xs text-text-secondary">{warehouseName} · {selectedLocation(warehouses, warehouseId)}</p></div>
    </CardContent></Card>
    {error ? <InlineFeedback tone="danger" title="No se pudieron cargar los almacenes">{getApiErrorMessage(error, "Revisa la conexión e inténtalo de nuevo.")}</InlineFeedback> : null}
    {!isLoading && currentBranch && !warehouses.length ? <InlineFeedback tone="warning" title="Sin almacenes disponibles">La sucursal actual no tiene un almacén activo asignado.</InlineFeedback> : null}
  </div>;
}

function selectedLocation(warehouses: Warehouse[], warehouseId: string) {
  const warehouse = warehouses.find((item) => item.id === warehouseId);
  return warehouse?.location ?? warehouse?.address ?? ([warehouse?.city, warehouse?.state].filter(Boolean).join(", ") || "Ubicación no registrada");
}
