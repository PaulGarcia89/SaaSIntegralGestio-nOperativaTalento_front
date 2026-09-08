"use client";

import { useUiText } from "@/components/ui-copy";

import { InventoryWorkspace } from "@/components/inventory-workspace";

export default function ReturnsPage() {
  const uiText = useUiText();
  return <InventoryWorkspace initialStatus="RETURN_PENDING" title={uiText("Devoluciones y validación")} intent="returns" />;
}
