import { InventoryWarehousePanel } from "@/components/inventory-warehouse-panel";

/**
 * Almacén y existencias del inventario de activos.
 *
 * Esta página redirigía a `/inventory`, el selector de módulo. Como el menú
 * lateral publica «Almacén y stock» apuntando a `/inventory/assets/warehouse`
 * y el catch-all de `assets` lo reescribe a `/inventory/warehouse`, pulsar esa
 * entrada dejaba a la persona en el selector, sin explicación y sin haber
 * llegado a ninguna parte.
 *
 * `InventoryWarehousePanel` —existencias por ubicación, ajustes, conteos
 * cíclicos y políticas de reposición— estaba construido pero no lo importaba
 * ningún archivo del proyecto: una funcionalidad completa, inalcanzable.
 */
export default function InventoryWarehousePage() {
  return <InventoryWarehousePanel />;
}
