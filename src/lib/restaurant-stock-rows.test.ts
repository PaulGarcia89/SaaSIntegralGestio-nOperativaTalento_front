import { describe, expect, it } from "vitest";
import {
  diasParaVencer,
  estaBajoMinimo,
  faltaParaElMinimo,
  normalizarExistencia,
  normalizarExistencias,
  filtrarPorVencimiento,
  normalizarLote,
  porUrgencia,
  porVencimiento,
} from "./restaurant-stock-rows";

/**
 * La fila tal y como la construye `balances()` del backend
 * (`restaurant-inventory.service.ts` + `mapBalanceForUx`). Si el servidor
 * cambia estos nombres, estas pruebas caen y avisan antes que la pantalla.
 */
const filaDelServidor = {
  id: "bal-1",
  ingredientId: "ing-1",
  ingredientName: "Tomate riñón",
  ingredientSku: "VEG-001",
  quantityOnHand: 4.5,
  availableQuantity: 4.5,
  minimumStock: 12,
  averageCost: 1.35,
  unitName: "Kilogramo",
  unitAbbreviation: "kg",
  warehouseName: "Bodega principal",
  stockStatus: "LOW_STOCK",
  displayStatus: "Bajo mínimo",
  blocked: true,
};

describe("normalizarExistencia", () => {
  it("traduce los nombres del servidor a los que lee la pantalla", () => {
    const fila = normalizarExistencia(filaDelServidor);
    expect(fila.name).toBe("Tomate riñón");
    expect(fila.sku).toBe("VEG-001");
    expect(fila.stock).toBe(4.5);
    expect(fila.inventoryUnit).toBe("kg");
    expect(fila.minimumStock).toBe(12);
    expect(fila.averageCost).toBe(1.35);
    expect(fila.status).toBe("LOW_STOCK");
  });

  it("conserva intactos todos los campos originales del contrato", () => {
    const fila = normalizarExistencia(filaDelServidor);
    expect(fila.ingredientName).toBe("Tomate riñón");
    expect(fila.quantityOnHand).toBe(4.5);
    expect(fila.unitAbbreviation).toBe("kg");
    expect(fila.displayStatus).toBe("Bajo mínimo");
    expect(fila.warehouseName).toBe("Bodega principal");
    expect(fila.blocked).toBe(true);
  });

  it("nunca deja una cantidad en NaN, que era lo que se pintaba en la tabla", () => {
    const fila = normalizarExistencia({ id: "x", ingredientName: "Sal" });
    expect(Number.isNaN(fila.stock)).toBe(false);
    expect(fila.stock).toBe(0);
    expect(Number.isNaN(fila.averageCost)).toBe(false);
    expect(fila.inventoryUnit).toBe("");
  });

  it("prefiere la cantidad disponible sobre el saldo bruto", () => {
    const fila = normalizarExistencia({ id: "x", quantityOnHand: 10, availableQuantity: 6 });
    expect(fila.stock).toBe(6);
  });

  it("respeta los nombres nuevos si el servidor empieza a entregarlos", () => {
    const fila = normalizarExistencia({ ...filaDelServidor, name: "Tomate", stock: 99, inventoryUnit: "u" });
    expect(fila.name).toBe("Tomate");
    expect(fila.stock).toBe(99);
    expect(fila.inventoryUnit).toBe("u");
  });

  it("cae al SKU cuando el ingrediente no trae nombre, en vez de dejar la celda vacía", () => {
    const fila = normalizarExistencia({ id: "x", ingredientName: null, ingredientSku: "VEG-009" });
    expect(fila.name).toBe("VEG-009");
  });

  it("toma el identificador del ingrediente cuando la fila no trae id propio", () => {
    const fila = normalizarExistencia({ ingredientId: "ing-7" });
    expect(fila.id).toBe("ing-7");
  });

  it("acepta cantidades que llegan como texto", () => {
    const fila = normalizarExistencia({ id: "x", quantityOnHand: "3.25", minimumStock: "10" });
    expect(fila.stock).toBe(3.25);
    expect(fila.minimumStock).toBe(10);
  });
});

describe("estaBajoMinimo", () => {
  it("detecta el faltante que la comparación anterior nunca encontraba", () => {
    expect(estaBajoMinimo(normalizarExistencia(filaDelServidor))).toBe(true);
  });

  it("no marca faltante lo que está justo en el mínimo", () => {
    expect(estaBajoMinimo({ stock: 12, minimumStock: 12 })).toBe(false);
  });

  it("un mínimo sin definir no convierte el ingrediente en faltante", () => {
    expect(estaBajoMinimo({ stock: 0, minimumStock: 0 })).toBe(false);
  });

  it("calcula cuánto falta para volver al mínimo", () => {
    expect(faltaParaElMinimo({ stock: 4.5, minimumStock: 12 })).toBe(7.5);
    expect(faltaParaElMinimo({ stock: 20, minimumStock: 12 })).toBe(0);
  });
});

describe("porUrgencia", () => {
  it("pone delante lo que está más lejos de su mínimo en proporción, no en cantidad", () => {
    const filas = [
      { id: "harina", stock: 198, minimumStock: 200 },
      { id: "sal", stock: 1, minimumStock: 3 },
    ];
    expect(porUrgencia(filas).map((fila) => fila.id)).toEqual(["sal", "harina"]);
  });

  it("no muta el arreglo recibido", () => {
    const filas = [
      { id: "a", stock: 9, minimumStock: 10 },
      { id: "b", stock: 1, minimumStock: 10 },
    ];
    porUrgencia(filas);
    expect(filas.map((fila) => fila.id)).toEqual(["a", "b"]);
  });
});

describe("normalizarExistencias", () => {
  it("normaliza la lista completa", () => {
    const filas = normalizarExistencias([filaDelServidor, { id: "b", ingredientName: "Sal", quantityOnHand: 2 }]);
    expect(filas.map((fila) => fila.name)).toEqual(["Tomate riñón", "Sal"]);
    expect(filas.every((fila) => Number.isFinite(fila.stock))).toBe(true);
  });
});

/* ========================================================================== */

/** La fila tal y como la construye `lots()` del backend. */
const loteDelServidor = {
  id: "lot-1",
  ingredientId: "ing-1",
  ingredientName: "Queso mozzarella",
  lotNumber: "L-3312",
  expirationDate: "2026-09-14T00:00:00.000Z",
  receivedAt: "2026-09-01T00:00:00.000Z",
  remainingQuantity: 6,
  unitCost: 7.8,
  unitName: "Kilogramo",
  unitAbbreviation: "kg",
  warehouseName: "Bodega principal",
  status: "ACTIVE",
  lotStatus: "EXPIRING",
  daysRemaining: 3,
};

describe("normalizarLote", () => {
  it("traduce los nombres del servidor a los que lee la pantalla", () => {
    const lote = normalizarLote(loteDelServidor);
    expect(lote.lotCode).toBe("L-3312");
    expect(lote.expiresAt).toBe("2026-09-14T00:00:00.000Z");
    expect(lote.unit).toBe("kg");
    expect(lote.cost).toBe(7.8);
    expect(lote.remainingQuantity).toBe(6);
  });

  it("conserva intactos los campos originales del contrato", () => {
    const lote = normalizarLote(loteDelServidor);
    expect(lote.lotNumber).toBe("L-3312");
    expect(lote.expirationDate).toBe("2026-09-14T00:00:00.000Z");
    expect(lote.unitCost).toBe(7.8);
  });

  it("calcula los días restantes cuando el servidor no los manda", () => {
    const lote = normalizarLote(
      { id: "x", expirationDate: "2026-09-14T00:00:00.000Z" },
    );
    expect(typeof lote.daysRemaining).toBe("number");
  });

  it("deja los días en null cuando el lote no caduca, en vez de inventar una fecha", () => {
    const lote = normalizarLote({ id: "x", lotNumber: "L-1", remainingQuantity: 2 });
    expect(lote.daysRemaining).toBeNull();
    expect(lote.expiresAt).toBe("");
  });
});

describe("diasParaVencer", () => {
  const ahora = new Date("2026-09-11T09:00:00.000Z");

  it("cuenta días de calendario, no horas: lo que caduca esta noche vence hoy", () => {
    expect(diasParaVencer("2026-09-11T23:00:00.000Z", ahora)).toBe(0);
  });

  it("cuenta hacia adelante y hacia atrás", () => {
    expect(diasParaVencer("2026-09-14T00:00:00.000Z", ahora)).toBe(3);
    expect(diasParaVencer("2026-09-09T00:00:00.000Z", ahora)).toBe(-2);
  });

  it("devuelve null para lo que no tiene fecha o la tiene ilegible", () => {
    expect(diasParaVencer("", ahora)).toBeNull();
    expect(diasParaVencer("mañana", ahora)).toBeNull();
  });
});

describe("filtrarPorVencimiento", () => {
  const filas = [
    { id: "vencido", daysRemaining: -2 },
    { id: "hoy", daysRemaining: 0 },
    { id: "semana", daysRemaining: 5 },
    { id: "mes", daysRemaining: 22 },
    { id: "sin-fecha", daysRemaining: null },
  ];

  it("sin filtro devuelve todo", () => {
    expect(filtrarPorVencimiento(filas, "").length).toBe(5);
  });

  it("«Vencidos» deja solo lo que ya pasó de fecha", () => {
    expect(filtrarPorVencimiento(filas, "EXPIRED").map((f) => f.id)).toEqual(["vencido"]);
  });

  it("incluye lo ya vencido en los plazos: es más urgente, no menos", () => {
    expect(filtrarPorVencimiento(filas, "7").map((f) => f.id)).toEqual(["vencido", "hoy", "semana"]);
  });

  it("un plazo mayor incluye al menor", () => {
    expect(filtrarPorVencimiento(filas, "30").map((f) => f.id)).toEqual(["vencido", "hoy", "semana", "mes"]);
  });

  it("nunca mete en un plazo lo que no caduca", () => {
    for (const filtro of ["EXPIRED", "7", "15", "30"] as const) {
      expect(filtrarPorVencimiento(filas, filtro).some((f) => f.id === "sin-fecha"), filtro).toBe(false);
    }
  });

  it("no muta el arreglo recibido", () => {
    filtrarPorVencimiento(filas, "7");
    expect(filas.map((f) => f.id)).toEqual(["vencido", "hoy", "semana", "mes", "sin-fecha"]);
  });
});

describe("porVencimiento", () => {
  it("pone delante lo que caduca antes y al final lo que no caduca", () => {
    const filas = [
      { id: "sin-fecha", daysRemaining: null },
      { id: "mes", daysRemaining: 22 },
      { id: "vencido", daysRemaining: -2 },
      { id: "semana", daysRemaining: 5 },
    ];
    expect(porVencimiento(filas).map((f) => f.id)).toEqual(["vencido", "semana", "mes", "sin-fecha"]);
  });
});
