"use client";

import { useUiText } from "@/components/ui-copy";

import { InventoryWorkspace } from "@/components/inventory-workspace";

export default function DeliveriesPage() {
  const uiText = useUiText();
  return <InventoryWorkspace initialStatus="RESERVED" title={uiText("Entregas de activos")} intent="deliveries" />;
}
