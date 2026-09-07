import { describe, expect, it } from "vitest";
import {
  formatMoney,
  formatQuantity,
  parseRestaurantPreview,
  restaurantOperationImpact,
  toNumber,
} from "@/lib/restaurant-operation";
import { canConfirm, consequenceSentence, initialOperationState } from "@/lib/operation-flow";

describe("toNumber", () => {
  it("acepta números y cadenas numéricas", () => {
    expect(toNumber(12.5)).toBe(12.5);
    expect(toNumber("12.5")).toBe(12.5);
  });

  it("descarta lo que no es un número finito en vez de propagar NaN", () => {
    // Un NaN colado en una cifra de inventario acaba pintando «NaN kg» en
    // pantalla, que es peor que no mostrar nada.
    expect(toNumber("dos kilos")).toBeNull();
    expect(toNumber(Infinity)).toBeNull();
    expect(toNumber(null)).toBeNull();
    expect(toNumber(undefined)).toBeNull();
  });
});

describe("parseRestaurantPreview", () => {
  it("entiende la forma con `items` y `totalCost`", () => {
    const { lines, totalCost } = parseRestaurantPreview({
      totalCost: 120.5,
      items: [{ ingredientId: "i1", ingredientName: "Harina 000", quantity: 28, unit: "kg", resultingStock: 12, totalCost: 120.5 }],
    });
    expect(lines).toHaveLength(1);
    expect(lines[0].name).toBe("Harina 000");
    expect(lines[0].quantity).toBe("28 kg");
    expect(lines[0].after).toBe("12 kg");
    expect(totalCost).toBe(120.5);
  });

  it("entiende la forma alternativa con `ingredients` y `wasteCost`", () => {
    // Los dos endpoints existen y devuelven nombres distintos para lo mismo.
    const { lines, totalCost } = parseRestaurantPreview({
      wasteCost: 40,
      ingredients: [{ id: "i2", name: "Aceite", requiredQuantity: 4, resultingQuantity: 2, wasteCost: 40 }],
    });
    expect(lines[0].name).toBe("Aceite");
    expect(lines[0].quantity).toBe("4");
    expect(lines[0].after).toBe("2");
    expect(totalCost).toBe(40);
  });

  it("suma el costo de las líneas cuando el total no viene", () => {
    const { totalCost } = parseRestaurantPreview({
      items: [{ id: "a", cost: 10 }, { id: "b", cost: 5 }],
    });
    expect(totalCost).toBe(15);
  });

  it("no suma si alguna línea no trae costo: inventaría un total falso", () => {
    const { totalCost } = parseRestaurantPreview({
      items: [{ id: "a", cost: 10 }, { id: "b" }],
    });
    expect(totalCost).toBeNull();
  });

  it("marca la existencia resultante negativa", () => {
    const { lines } = parseRestaurantPreview({ items: [{ id: "a", name: "Sal", resultingStock: -3 }] });
    expect(lines[0].negative).toBe(true);
  });

  it("no revienta con una forma inesperada", () => {
    // Que la pantalla se caiga por un campo renombrado es peor que un impacto
    // incompleto.
    expect(parseRestaurantPreview(null)).toEqual({ lines: [], totalCost: null });
    expect(parseRestaurantPreview("texto")).toEqual({ lines: [], totalCost: null });
    expect(parseRestaurantPreview({ items: "no es una lista" }).lines).toEqual([]);
    expect(parseRestaurantPreview({ items: [1, "dos", null] }).lines).toEqual([]);
  });

  it("recurre al identificador cuando no hay nombre", () => {
    const { lines } = parseRestaurantPreview({ items: [{ ingredientId: "i9" }] });
    expect(lines[0].name).toBe("i9");
  });
});

describe("formato", () => {
  it("usa la coma decimal española y no arrastra decimales inútiles", () => {
    expect(formatQuantity(12.5)).toBe("12,5");
    expect(formatQuantity(12)).toBe("12");
  });

  it("el importe siempre lleva dos decimales", () => {
    expect(formatMoney(1284.5)).toBe("USD 1284,50");
    expect(formatMoney(3, "EUR")).toBe("EUR 3,00");
  });
});

describe("restaurantOperationImpact", () => {
  const base = {
    headline: "Registrar merma en Bodega Central",
    affectedLabel: "ingredientes",
    responsible: "Paúl García",
    reducesStock: true,
  };

  it("una operación de inventario es SIEMPRE irreversible", () => {
    // Confirmar aplica el movimiento y queda en la auditoría inmutable;
    // revertirlo exige otra operación, que no es un «deshacer».
    const impact = restaurantOperationImpact({ ...base, preview: { items: [] } });
    expect(impact.irreversible).toBe(true);
  });

  it("cuenta los productos afectados", () => {
    const impact = restaurantOperationImpact({
      ...base,
      preview: { items: [{ id: "a" }, { id: "b" }, { id: "c" }] },
    });
    expect(impact.affectedCount).toBe(3);
    expect(impact.affectedLabel).toBe("ingredientes");
  });

  it("una existencia negativa es BLOQUEO, no aviso", () => {
    // Confirmarlo dejaría el inventario mintiendo sobre lo que hay en el
    // almacén, así que no se puede seguir.
    const impact = restaurantOperationImpact({
      ...base,
      preview: { items: [{ id: "a", name: "Sal", resultingStock: -2, unit: "kg" }] },
    });
    expect(impact.blockers).toHaveLength(1);
    expect(impact.blockers[0].cause).toContain("Sal");
    expect(impact.blockers[0].owner.length).toBeGreaterThan(0);
    expect(impact.blockers[0].resolution.length).toBeGreaterThan(0);
  });

  it("con un bloqueo NO se puede confirmar", () => {
    const impact = restaurantOperationImpact({
      ...base,
      preview: { items: [{ id: "a", name: "Sal", resultingStock: -2 }] },
    });
    const state = { ...initialOperationState(), step: "confirm" as const, impact };
    expect(canConfirm(state)).toBe(false);
  });

  it("sin bloqueos sí se puede confirmar", () => {
    const impact = restaurantOperationImpact({
      ...base,
      preview: { items: [{ id: "a", name: "Sal", resultingStock: 5 }] },
    });
    const state = { ...initialOperationState(), step: "confirm" as const, impact };
    expect(canConfirm(state)).toBe(true);
  });

  it("avisa cuando no se puede anticipar la existencia resultante", () => {
    const impact = restaurantOperationImpact({
      ...base,
      preview: { items: [{ id: "a", name: "Sal", quantity: 2 }] },
    });
    expect(impact.warnings.some((warning) => warning.code === "UNKNOWN_STOCK")).toBe(true);
  });

  it("conserva los avisos que ya traía la pantalla", () => {
    const impact = restaurantOperationImpact({
      ...base,
      preview: { items: [{ id: "a", resultingStock: 1 }] },
      extraWarnings: [{ code: "NO_WAREHOUSE", message: "Sin almacén seleccionado" }],
    });
    expect(impact.warnings.some((warning) => warning.code === "NO_WAREHOUSE")).toBe(true);
  });

  it("sin costo no inventa un impacto económico", () => {
    const impact = restaurantOperationImpact({ ...base, preview: { items: [{ id: "a" }] } });
    expect(impact.cost).toBeUndefined();
  });

  it("la frase de consecuencia dice el alcance, el importe y que no se deshace", () => {
    const impact = restaurantOperationImpact({
      ...base,
      preview: { totalCost: 1284.5, items: [{ id: "a", resultingStock: 1 }, { id: "b", resultingStock: 2 }] },
    });
    const sentence = consequenceSentence(impact);
    expect(sentence).toContain("2 ingredientes");
    expect(sentence).toContain("USD 1284,50");
    expect(sentence).toContain("no se puede deshacer");
  });

  it("una previsualización vacía no bloquea ni miente", () => {
    const impact = restaurantOperationImpact({ ...base, preview: {} });
    expect(impact.affectedCount).toBe(0);
    expect(impact.blockers).toHaveLength(0);
    expect(impact.warnings).toHaveLength(0);
  });
});
