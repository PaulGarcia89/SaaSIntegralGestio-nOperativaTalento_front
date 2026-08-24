export type RestaurantDocumentStatus = "DRAFT" | "CONFIRMED" | "CANCELLED";

export type IngredientFormInput = {
  sku: string;
  name: string;
  purchaseUnit: string;
  inventoryUnit: string;
  conversionFactor: number;
  minimumStock: number;
};

export function validateIngredientInput(input: IngredientFormInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.sku.trim()) errors.sku = "El SKU es obligatorio.";
  if (!input.name.trim()) errors.name = "El nombre es obligatorio.";
  if (!input.purchaseUnit.trim()) errors.purchaseUnit = "La unidad de compra es obligatoria.";
  if (!input.inventoryUnit.trim()) errors.inventoryUnit = "La unidad de inventario es obligatoria.";
  if (!Number.isFinite(input.conversionFactor) || input.conversionFactor <= 0) errors.conversionFactor = "La conversión debe ser mayor que cero.";
  if (!Number.isFinite(input.minimumStock) || input.minimumStock < 0) errors.minimumStock = "El stock mínimo no puede ser negativo.";
  return errors;
}

export function canEditRestaurantDocument(status: RestaurantDocumentStatus) {
  return status === "DRAFT";
}

export function canCancelRestaurantDocument(status: RestaurantDocumentStatus) {
  return status === "DRAFT";
}

export function canConfirmRestaurantDocument(status: RestaurantDocumentStatus) {
  return status === "DRAFT";
}

export type ProductionStatus = RestaurantDocumentStatus;
export type TransferStatus = "DRAFT" | "SENT" | "IN_TRANSIT" | "RECEIVED" | "CANCELLED";
export type CountStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "CANCELLED";

export function canApproveCount(status: CountStatus, canManage: boolean) {
  return canManage && status === "IN_REVIEW";
}

export function transferActions(status: TransferStatus) {
  return {
    canSend: status === "DRAFT",
    canReceive: status === "IN_TRANSIT",
    canCancel: status === "DRAFT" || status === "SENT",
  };
}

export function validateSalesImportFile(fileName: string, sizeBytes: number) {
  const extension = `.${fileName.split(".").pop()?.toLowerCase()}`;
  if (!(extension === ".csv" || extension === ".xlsx")) return "Sólo se admiten archivos CSV o XLSX.";
  if (sizeBytes > 10 * 1024 * 1024) return "El archivo supera el límite de 10 MB.";
  return null;
}

export function salesImportMappingStatus(recipeId?: string | null) {
  return recipeId?.trim() ? "MAPPED" : "UNMAPPED";
}

export function canProcessSalesImport(input: { invalidRows: number; duplicateRows: number; productsWithoutRecipe: number }) {
  return input.invalidRows === 0 && input.duplicateRows === 0 && input.productsWithoutRecipe === 0;
}

export function canViewRestaurantAudit(canManage: boolean) {
  return canManage;
}

export function toggleReportDirection(currentSort: string, nextSort: string, currentDirection: "asc" | "desc") {
  return currentSort === nextSort && currentDirection === "asc" ? "desc" : "asc";
}
