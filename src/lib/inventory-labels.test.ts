import { describe, expect, it } from "vitest";
import {
  ASSET_STATUS_OPTIONS,
  CONDITION_OPTIONS,
  MAINTENANCE_TYPE_OPTIONS,
  assetStatusLabel,
  assetStatusTone,
  auditActionLabel,
  conditionLabel,
  conditionTone,
  formatDateTime,
  formatMoney,
  formatQuantity,
  maintenanceStatusLabel,
  maintenanceStatusTone,
  maintenanceTypeLabel,
  movementLabel,
  purchaseStatusLabel,
  purchaseStatusTone,
} from "@/lib/inventory-labels";

describe("estado de un activo", () => {
  it("traduce los ocho estados que declara el contrato", () => {
    expect(assetStatusLabel("AVAILABLE")).toBe("Disponible");
    expect(assetStatusLabel("ASSIGNED")).toBe("Entregado");
    expect(assetStatusLabel("RETURN_PENDING")).toBe("Devolución pendiente");
    expect(assetStatusLabel("RETIRED")).toBe("Retirado");
  });

  it("el tono distingue lo que exige actuar de lo que no", () => {
    // «Perdido» y «Disponible» se pintaban con la misma píldora gris en el
    // escáner: dos situaciones opuestas con el mismo aspecto.
    expect(assetStatusTone("AVAILABLE")).toBe("success");
    expect(assetStatusTone("LOST")).toBe("danger");
    expect(assetStatusTone("RETURN_PENDING")).toBe("warning");
    expect(assetStatusTone("RETIRED")).toBe("neutral");
  });

  it("las opciones del desplegable van traducidas, no en inglés", () => {
    // El formulario ofrecía literalmente NEW, GOOD, FAIR y DAMAGED.
    expect(ASSET_STATUS_OPTIONS).toHaveLength(8);
    expect(ASSET_STATUS_OPTIONS.every((option) => option.label !== option.value)).toBe(true);
  });
});

describe("condición física", () => {
  it("traduce las cuatro condiciones", () => {
    expect(conditionLabel("NEW")).toBe("Nuevo");
    expect(conditionLabel("GOOD")).toBe("Buen estado");
    expect(conditionLabel("FAIR")).toBe("Con desgaste");
    expect(conditionLabel("DAMAGED")).toBe("Dañado");
  });

  it("«dañado» es un problema y «nuevo» no", () => {
    expect(conditionTone("DAMAGED")).toBe("danger");
    expect(conditionTone("NEW")).toBe("success");
  });

  it("las cuatro opciones salen traducidas", () => {
    expect(CONDITION_OPTIONS.map((option) => option.label)).toEqual([
      "Nuevo",
      "Buen estado",
      "Con desgaste",
      "Dañado",
    ]);
  });
});

describe("movimientos, compras, mantenimiento y auditoría", () => {
  it("traduce los movimientos de la bitácora", () => {
    expect(movementLabel("RETURN_VALIDATED")).toBe("Devolución validada");
    expect(movementLabel("TRANSFERRED")).toBe("Transferido de sucursal");
  });

  it("traduce el estado de una orden de compra", () => {
    expect(purchaseStatusLabel("DRAFT")).toBe("Pendiente de aprobación");
    expect(purchaseStatusLabel("PARTIALLY_RECEIVED")).toBe("Recibida en parte");
    expect(purchaseStatusTone("RECEIVED")).toBe("success");
    expect(purchaseStatusTone("REJECTED")).toBe("danger");
  });

  it("traduce tipo y estado de mantenimiento", () => {
    expect(maintenanceTypeLabel("CORRECTIVE")).toBe("Correctivo");
    expect(maintenanceTypeLabel("PREVENTIVE")).toBe("Preventivo");
    expect(maintenanceStatusLabel("OPEN")).toBe("Abierto");
    expect(maintenanceStatusTone("OPEN")).toBe("warning");
    expect(maintenanceStatusTone("RESOLVED")).toBe("success");
  });

  it("el tipo de mantenimiento se elige de una lista, y todas van en español", () => {
    // El formulario pedía el tipo como texto libre, con «CORRECTIVO» inicial
    // mientras el backend devuelve «CORRECTIVE»: el dato quedaba incoherente.
    expect(MAINTENANCE_TYPE_OPTIONS.length).toBeGreaterThan(3);
    expect(MAINTENANCE_TYPE_OPTIONS.every((option) => option.value === option.value.toUpperCase())).toBe(true);
    expect(MAINTENANCE_TYPE_OPTIONS.every((option) => option.label !== option.value)).toBe(true);
  });

  it("traduce las acciones de la auditoría", () => {
    expect(auditActionLabel("PURCHASE_ORDER_RECEIVED")).toBe("Recibió mercancía");
    expect(auditActionLabel("ASSET_RETIRED")).toBe("Dio de baja un activo");
  });
});

describe("códigos desconocidos", () => {
  it("se muestran legibles, no en mayúsculas ni vacíos", () => {
    expect(assetStatusLabel("EN_REPARACION_EXTERNA")).toBe("En reparacion externa");
    expect(movementLabel("ALGO_NUEVO")).toBe("Algo nuevo");
    expect(auditActionLabel("ACCION_NUEVA")).toBe("Accion nueva");
  });

  it("son NEUTROS, nunca rojos", () => {
    // Un estado que el backend añada no puede aparecer como una alarma.
    expect(assetStatusTone("ESTADO_NUEVO")).toBe("neutral");
    expect(purchaseStatusTone("ESTADO_NUEVO")).toBe("neutral");
    expect(maintenanceStatusTone("ESTADO_NUEVO")).toBe("neutral");
  });

  it("sin valor dicen «Sin definir», nunca «undefined»", () => {
    expect(assetStatusLabel(undefined)).toBe("Sin definir");
    expect(conditionLabel(null)).toBe("Sin definir");
    expect(purchaseStatusLabel("")).toBe("Sin definir");
  });

  it("aceptan el código en minúsculas", () => {
    expect(assetStatusLabel("available")).toBe("Disponible");
    expect(conditionTone("damaged")).toBe("danger");
  });
});

describe("formatQuantity", () => {
  it("usa la coma decimal española y no arrastra decimales inútiles", () => {
    expect(formatQuantity(12.5)).toBe("12,5");
    expect(formatQuantity(12)).toBe("12");
    expect(formatQuantity("7")).toBe("7");
  });

  it("una cantidad ausente o no numérica no se pinta como «NaN»", () => {
    expect(formatQuantity(null)).toBe("—");
    expect(formatQuantity(undefined)).toBe("—");
    expect(formatQuantity("")).toBe("—");
    expect(formatQuantity("dos")).toBe("—");
  });

  it("el cero es cero, no «—»: una existencia agotada es un dato", () => {
    expect(formatQuantity(0)).toBe("0");
  });
});

describe("formatMoney", () => {
  it("acepta el número como cadena, que es como llega del backend", () => {
    // `totalAmount` viene como `string | number` y se imprimía «USD 1250.5».
    expect(formatMoney("1250.5", "USD")).toContain("1250,50");
    expect(formatMoney(3, "EUR")).toContain("3,00");
  });

  it("una moneda desconocida no tumba la pantalla", () => {
    expect(formatMoney(10, "XYZ")).toContain("10,00");
  });

  it("un importe ausente no se pinta como «NaN»", () => {
    expect(formatMoney(null)).toBe("—");
    expect(formatMoney(undefined)).toBe("—");
    expect(formatMoney("")).toBe("—");
  });
});

describe("formatDateTime", () => {
  it("una fecha inválida no se pinta como «Invalid Date»", () => {
    expect(formatDateTime("no es una fecha")).toBe("—");
    expect(formatDateTime(null)).toBe("—");
  });

  it("una fecha válida produce texto", () => {
    expect(formatDateTime("2026-03-14T10:30:00.000Z").length).toBeGreaterThan(0);
  });
});
