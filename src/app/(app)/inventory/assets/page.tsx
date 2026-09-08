"use client";

import { useUiText } from "@/components/ui-copy";

import { InventoryWorkspace } from "@/components/inventory-workspace";

export default function InventoryAssetsEntry() {
  const uiText = useUiText();
  return <InventoryWorkspace title={uiText("Inventario de activos")} />;
}
