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

export type RestaurantCatalogKind = "categories" | "units" | "suppliers" | "warehouses" | "ingredients";

export function validateRestaurantCatalogForm(kind: RestaurantCatalogKind, input: Record<string, string>): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.name?.trim()) errors.name = "El nombre es obligatorio.";
  if (kind === "categories" && input.description?.length > 500) errors.description = "La descripción no puede superar 500 caracteres.";
  if (kind === "units") {
    if (!input.abbreviation?.trim()) errors.abbreviation = "La abreviatura es obligatoria.";
    if (!input.type?.trim()) errors.type = "El tipo de unidad es obligatorio.";
    if (!Number.isFinite(Number(input.conversionFactor)) || Number(input.conversionFactor) <= 0) errors.conversionFactor = "La conversión debe ser mayor que cero.";
  }
  if (kind === "suppliers" && input.email && !/^\S+@\S+\.\S+$/.test(input.email)) errors.email = "El correo no es válido.";
  if (kind === "warehouses") {
    if (!input.branchId?.trim()) errors.branchId = "La sucursal es obligatoria.";
    if (!input.code?.trim()) errors.code = "El código es obligatorio.";
  }
  if (kind === "ingredients") {
    if (!input.sku?.trim()) errors.sku = "El SKU es obligatorio.";
    if (!input.inventoryUnitId?.trim()) errors.inventoryUnitId = "La unidad de inventario es obligatoria.";
    if (!input.purchaseUnitId?.trim()) errors.purchaseUnitId = "La unidad de compra es obligatoria.";
    if (!Number.isFinite(Number(input.purchaseConversionFactor)) || Number(input.purchaseConversionFactor) <= 0) errors.purchaseConversionFactor = "La conversión debe ser mayor que cero.";
    if (!Number.isFinite(Number(input.minimumStock)) || Number(input.minimumStock) < 0) errors.minimumStock = "El stock mínimo no puede ser negativo.";
  }
  return errors;
}

export type ReceiptDraftLine = { ingredientId: string; purchaseUnitId: string; purchaseQuantity: string; unitCost: string };
export function validateReceiptDraft(input: { branchId?: string; warehouseId?: string; receivedAt: string; lines: ReceiptDraftLine[] }): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.branchId) errors.branchId = "La sucursal es obligatoria.";
  if (!input.warehouseId) errors.warehouseId = "El almacén es obligatorio.";
  if (!input.receivedAt) errors.receivedAt = "La fecha de entrada es obligatoria.";
  if (!input.lines.length) errors.lines = "Agrega al menos un ingrediente.";
  input.lines.forEach((line, index) => {
    if (!line.ingredientId) errors[`line-${index}-ingredient`] = "Selecciona un ingrediente.";
    if (!line.purchaseUnitId) errors[`line-${index}-unit`] = "Selecciona una unidad de compra.";
    if (!Number.isFinite(Number(line.purchaseQuantity)) || Number(line.purchaseQuantity) <= 0) errors[`line-${index}-quantity`] = "La cantidad debe ser mayor que cero.";
    if (!Number.isFinite(Number(line.unitCost)) || Number(line.unitCost) < 0) errors[`line-${index}-cost`] = "El costo no puede ser negativo.";
  });
  return errors;
}

export function validateOperationDraft(input: { name: string; lines: Array<{ id: string; quantity: string }> }): string {
  if (!input.name.trim()) return "El nombre, motivo o tipo de operación es obligatorio.";
  if (!input.lines.length || input.lines.some((line) => !line.id)) return "Selecciona al menos un ingrediente o receta.";
  if (input.lines.some((line) => !Number.isFinite(Number(line.quantity)) || Number(line.quantity) <= 0)) return "Las cantidades deben ser mayores que cero.";
  return "";
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
