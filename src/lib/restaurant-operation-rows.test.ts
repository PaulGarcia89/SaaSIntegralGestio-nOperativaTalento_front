import { describe, expect, it } from "vitest";
import {
  conteoAprobado,
  normalizarConteo,
  normalizarConteos,
  normalizarTransferencia,
  normalizarTransferencias,
} from "./restaurant-operation-rows";

/** La fila tal y como la construye `transfers()` del backend. */
const transferenciaDelServidor = {
  id: "tr-1",
  sourceBranchId: "b1",
  sourceWarehouseId: "3f2a1b9c-0000-4000-8000-000000000001",
  destinationWarehouseId: "8d4e7f21-0000-4000-8000-000000000002",
  sourceWarehouseName: "Bodega principal",
  destinationWarehouseName: "Cocina fría",
  status: "DRAFT",
  createdAt: "2026-09-10T12:00:00.000Z",
  items: [
    { id: "i1", ingredientId: "ing-1", ingredientName: "Tomate riñón", quantity: 12, lotId: null },
    { id: "i2", ingredientId: "ing-2", ingredientName: "Queso mozzarella", quantity: 4 },
  ],
};

describe("normalizarTransferencia", () => {
  it("enseña el nombre del almacén y no su identificador", () => {
    const fila = normalizarTransferencia(transferenciaDelServidor);
    expect(fila.originWarehouse).toBe("Bodega principal");
    expect(fila.destinationWarehouse).toBe("Cocina fría");
  });

  it("cae al identificador sólo si el servidor no mandó el nombre", () => {
    const fila = normalizarTransferencia({ id: "x", sourceWarehouseId: "w-1", destinationWarehouseId: "w-2" });
    expect(fila.originWarehouse).toBe("w-1");
    expect(fila.destinationWarehouse).toBe("w-2");
  });

  it("encuentra el detalle donde el servidor lo manda, que es `items` y no `lines`", () => {
    const fila = normalizarTransferencia(transferenciaDelServidor);
    expect(fila.lines.map((linea) => linea.ingredientName)).toEqual(["Tomate riñón", "Queso mozzarella"]);
    expect(fila.lines.map((linea) => linea.quantity)).toEqual([12, 4]);
  });

  it("nunca deja una línea sin nombre: cae al SKU o al identificador", () => {
    const fila = normalizarTransferencia({ id: "x", items: [{ ingredientId: "ing-9" }] });
    expect(fila.lines[0].ingredientName).toBe("ing-9");
  });

  it("una transferencia sin líneas devuelve una lista vacía, no revienta", () => {
    expect(normalizarTransferencia({ id: "x" }).lines).toEqual([]);
    expect(normalizarTransferencia({ id: "x", items: null }).lines).toEqual([]);
  });

  it("conserva intactos los campos originales del contrato", () => {
    const fila = normalizarTransferencia(transferenciaDelServidor);
    expect(fila.sourceWarehouseId).toBe("3f2a1b9c-0000-4000-8000-000000000001");
    expect(fila.items).toHaveLength(2);
  });

  it("normaliza la lista completa", () => {
    expect(normalizarTransferencias([transferenciaDelServidor])[0].originWarehouse).toBe("Bodega principal");
  });
});

/** La fila tal y como la construye `stockCounts()`, que enmascara un conteo no aprobado. */
const conteoEnRevision = {
  id: "cnt-1",
  countNumber: "CNT-0004",
  branchId: "b1",
  warehouseId: "w1",
  countedAt: "2026-09-10T08:00:00.000Z",
  createdAt: "2026-09-09T18:00:00.000Z",
  status: "IN_REVIEW",
  items: [
    { id: "i1", ingredientId: "ing-1", ingredientName: "Tomate riñón", countedQuantity: 10 },
    { id: "i2", ingredientId: "ing-2", ingredientName: "Sal", countedQuantity: 3 },
  ],
};

const conteoAprobadoDelServidor = {
  ...conteoEnRevision,
  status: "APPROVED",
  items: [
    { id: "i1", ingredientId: "ing-1", ingredientName: "Tomate riñón", countedQuantity: 10, systemQuantity: 12, varianceQuantity: -2 },
    { id: "i2", ingredientId: "ing-2", ingredientName: "Sal", countedQuantity: 3, systemQuantity: 3, varianceQuantity: 0 },
  ],
};

describe("normalizarConteo", () => {
  it("usa la fecha del conteo, que es la que el documento tiene", () => {
    expect(normalizarConteo(conteoEnRevision).createdAt).toBe("2026-09-10T08:00:00.000Z");
  });

  it("encuentra las líneas en `items`", () => {
    expect(normalizarConteo(conteoEnRevision).lines.map((l) => l.ingredientName)).toEqual(["Tomate riñón", "Sal"]);
    expect(normalizarConteo(conteoEnRevision).lines.map((l) => l.quantity)).toEqual([10, 3]);
  });

  it("no dice cuántas diferencias hay mientras el conteo no está aprobado", () => {
    // El backend oculta las varianzas hasta la aprobación: decir «0» sería
    // afirmar un resultado que todavía no se ha calculado.
    expect(normalizarConteo(conteoEnRevision).differences).toBeNull();
  });

  it("cuenta las líneas que salieron distintas una vez aprobado", () => {
    expect(normalizarConteo(conteoAprobadoDelServidor).differences).toBe(1);
  });

  it("un conteo aprobado sin ninguna varianza dice cero, que ya es un resultado", () => {
    const fila = normalizarConteo({ ...conteoAprobadoDelServidor, items: [{ ingredientId: "a", varianceQuantity: 0 }] });
    expect(fila.differences).toBe(0);
  });

  it("deja el almacén vacío en vez de inventarlo cuando el servidor no lo manda", () => {
    expect(normalizarConteo(conteoEnRevision).warehouseName).toBe("");
  });

  it("normaliza la lista completa", () => {
    expect(normalizarConteos([conteoEnRevision, conteoAprobadoDelServidor]).map((c) => c.differences)).toEqual([null, 1]);
  });
});

describe("conteoAprobado", () => {
  it("reconoce el estado sin depender de mayúsculas", () => {
    expect(conteoAprobado("APPROVED")).toBe(true);
    expect(conteoAprobado("approved")).toBe(true);
    expect(conteoAprobado("IN_REVIEW")).toBe(false);
    expect(conteoAprobado("")).toBe(false);
  });
});
