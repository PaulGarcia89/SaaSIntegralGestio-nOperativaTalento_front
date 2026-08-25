import { describe, expect, it } from "vitest";
import {
  canApproveCount,
  canConfirmRestaurantDocument,
  canEditRestaurantDocument,
  canProcessSalesImport,
  validateIngredientInput,
  validateOperationDraft,
  validateReceiptDraft,
} from "@/lib/restaurant-inventory";

describe("validaciones de inventario de restaurante", () => {
  it("rechaza una entrada incompleta y acepta una entrada válida", () => {
    expect(validateReceiptDraft({ branchId: "", warehouseId: "", receivedAt: "", lines: [] })).toEqual(expect.objectContaining({
      branchId: expect.any(String),
      warehouseId: expect.any(String),
      receivedAt: expect.any(String),
      lines: expect.any(String),
    }));
    expect(validateReceiptDraft({
      branchId: "branch-1",
      warehouseId: "warehouse-1",
      receivedAt: "2026-08-25T10:00",
      lines: [{ ingredientId: "ingredient-1", purchaseUnitId: "unit-1", purchaseQuantity: "2", unitCost: "4.50" }],
    })).toEqual({});
  });

  it("valida cantidades, costos y datos obligatorios de ingredientes", () => {
    expect(validateIngredientInput({ sku: "", name: "", purchaseUnit: "", inventoryUnit: "", conversionFactor: 0, minimumStock: -1 })).toEqual(expect.objectContaining({
      sku: expect.any(String),
      name: expect.any(String),
      conversionFactor: expect.any(String),
      minimumStock: expect.any(String),
    }));
    expect(validateIngredientInput({ sku: "TOM-001", name: "Tomate", purchaseUnit: "caja", inventoryUnit: "kg", conversionFactor: 10, minimumStock: 2 })).toEqual({});
  });

  it("protege operaciones sin nombre, líneas o cantidades válidas", () => {
    expect(validateOperationDraft({ name: "", lines: [] })).toBeTruthy();
    expect(validateOperationDraft({ name: "Merma", lines: [{ id: "ingredient-1", quantity: "0" }] })).toBeTruthy();
    expect(validateOperationDraft({ name: "Merma", lines: [{ id: "ingredient-1", quantity: "1.5" }] })).toBe("");
  });

  it("aplica reglas de estado y permisos para documentos", () => {
    expect(canEditRestaurantDocument("DRAFT")).toBe(true);
    expect(canEditRestaurantDocument("CONFIRMED")).toBe(false);
    expect(canConfirmRestaurantDocument("CANCELLED")).toBe(false);
    expect(canApproveCount("IN_REVIEW", true)).toBe(true);
    expect(canApproveCount("IN_REVIEW", false)).toBe(false);
  });

  it("bloquea importaciones con errores antes de procesarlas", () => {
    expect(canProcessSalesImport({ invalidRows: 1, duplicateRows: 0, productsWithoutRecipe: 0 })).toBe(false);
    expect(canProcessSalesImport({ invalidRows: 0, duplicateRows: 0, productsWithoutRecipe: 0 })).toBe(true);
  });
});
