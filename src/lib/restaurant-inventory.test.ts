import { describe, expect, it } from "vitest";
import { canApproveCount, canCancelRestaurantDocument, canConfirmRestaurantDocument, canEditRestaurantDocument, canProcessSalesImport, canViewRestaurantAudit, salesImportMappingStatus, toggleReportDirection, transferActions, validateIngredientInput, validateOperationDraft, validateReceiptDraft, validateRestaurantCatalogForm, validateSalesImportFile } from "./restaurant-inventory";

describe("restaurant inventory rules", () => {
  it("validates required ingredient fields and positive conversion", () => {
    expect(validateIngredientInput({ sku: "", name: "", purchaseUnit: "", inventoryUnit: "", conversionFactor: 0, minimumStock: -1 })).toEqual({
      sku: "El SKU es obligatorio.", name: "El nombre es obligatorio.", purchaseUnit: "La unidad de compra es obligatoria.",
      inventoryUnit: "La unidad de inventario es obligatoria.", conversionFactor: "La conversión debe ser mayor que cero.", minimumStock: "El stock mínimo no puede ser negativo.",
    });
  });

  it("allows complete ingredient data", () => {
    expect(validateIngredientInput({ sku: "TOM-001", name: "Tomate", purchaseUnit: "kg", inventoryUnit: "g", conversionFactor: 1000, minimumStock: 2 })).toEqual({});
  });

  it("validates catalog forms by resource", () => {
    expect(validateRestaurantCatalogForm("categories", { name: "", description: "" })).toHaveProperty("name");
    expect(validateRestaurantCatalogForm("units", { name: "Kg", abbreviation: "", type: "WEIGHT", conversionFactor: "0" })).toMatchObject({ abbreviation: expect.any(String), conversionFactor: expect.any(String) });
    expect(validateRestaurantCatalogForm("warehouses", { name: "Central", code: "", branchId: "" })).toMatchObject({ code: expect.any(String), branchId: expect.any(String) });
    expect(validateRestaurantCatalogForm("suppliers", { name: "Proveedor", email: "correo-invalido" })).toHaveProperty("email");
  });

  it("validates ingredient references and numeric constraints", () => {
    expect(validateRestaurantCatalogForm("ingredients", { name: "Tomate", sku: "", inventoryUnitId: "", purchaseUnitId: "", purchaseConversionFactor: "0", minimumStock: "-1" })).toMatchObject({ sku: expect.any(String), inventoryUnitId: expect.any(String), purchaseUnitId: expect.any(String), purchaseConversionFactor: expect.any(String), minimumStock: expect.any(String) });
    expect(validateRestaurantCatalogForm("ingredients", { name: "Tomate", sku: "TOM-1", inventoryUnitId: "unit-1", purchaseUnitId: "unit-1", purchaseConversionFactor: "1", minimumStock: "0" })).toEqual({});
  });

  it("validates receipt context, lines, quantities and costs", () => {
    expect(validateReceiptDraft({ receivedAt: "", lines: [] })).toMatchObject({ branchId: expect.any(String), warehouseId: expect.any(String), receivedAt: expect.any(String), lines: expect.any(String) });
    expect(validateReceiptDraft({ branchId: "b", warehouseId: "w", receivedAt: "2026-08-24", lines: [{ ingredientId: "i", purchaseUnitId: "u", purchaseQuantity: "2", unitCost: "4" }] })).toEqual({});
    expect(validateReceiptDraft({ branchId: "b", warehouseId: "w", receivedAt: "2026-08-24", lines: [{ ingredientId: "i", purchaseUnitId: "u", purchaseQuantity: "0", unitCost: "-1" }] })).toMatchObject({ "line-0-quantity": expect.any(String), "line-0-cost": expect.any(String) });
  });

  it("validates operation previews before sending them to the backend", () => {
    expect(validateOperationDraft({ name: "", lines: [] })).not.toBe("");
    expect(validateOperationDraft({ name: "Consumo", lines: [{ id: "recipe-1", quantity: "1" }] })).toBe("");
    expect(validateOperationDraft({ name: "Merma", lines: [{ id: "ingredient-1", quantity: "0" }] })).not.toBe("");
  });

  it("only allows draft documents to be edited, confirmed, or cancelled", () => {
    expect(canEditRestaurantDocument("DRAFT")).toBe(true);
    expect(canConfirmRestaurantDocument("DRAFT")).toBe(true);
    expect(canCancelRestaurantDocument("DRAFT")).toBe(true);
    expect(canEditRestaurantDocument("CONFIRMED")).toBe(false);
    expect(canConfirmRestaurantDocument("CONFIRMED")).toBe(false);
    expect(canCancelRestaurantDocument("CANCELLED")).toBe(false);
  });

  it("restricts count approval to review status and manage permission", () => {
    expect(canApproveCount("IN_REVIEW", true)).toBe(true);
    expect(canApproveCount("IN_REVIEW", false)).toBe(false);
    expect(canApproveCount("DRAFT", true)).toBe(false);
  });

  it("exposes transfer actions according to lifecycle state", () => {
    expect(transferActions("DRAFT")).toEqual({ canSend: true, canReceive: false, canCancel: true });
    expect(transferActions("IN_TRANSIT")).toEqual({ canSend: false, canReceive: true, canCancel: false });
    expect(transferActions("RECEIVED")).toEqual({ canSend: false, canReceive: false, canCancel: false });
  });

  it("validates sales import file type and size", () => {
    expect(validateSalesImportFile("ventas.csv", 1024)).toBeNull();
    expect(validateSalesImportFile("ventas.pdf", 1024)).toContain("CSV");
    expect(validateSalesImportFile("ventas.xlsx", 11 * 1024 * 1024)).toContain("10 MB");
  });

  it("tracks mapping and blocks processing with row or recipe errors", () => {
    expect(salesImportMappingStatus("recipe-1")).toBe("MAPPED");
    expect(salesImportMappingStatus(" ")).toBe("UNMAPPED");
    expect(canProcessSalesImport({ invalidRows: 0, duplicateRows: 0, productsWithoutRecipe: 0 })).toBe(true);
    expect(canProcessSalesImport({ invalidRows: 1, duplicateRows: 0, productsWithoutRecipe: 0 })).toBe(false);
  });

  it("protects audit and toggles report ordering", () => {
    expect(canViewRestaurantAudit(true)).toBe(true);
    expect(canViewRestaurantAudit(false)).toBe(false);
    expect(toggleReportDirection("date", "date", "asc")).toBe("desc");
    expect(toggleReportDirection("date", "amount", "desc")).toBe("asc");
  });
});
