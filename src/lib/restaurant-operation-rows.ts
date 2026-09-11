import { numero, texto } from "./restaurant-stock-rows";

/* ==========================================================================
   NORMALIZACIÓN DE LAS OPERACIONES
   ==========================================================================
   El mismo desajuste que en saldos y lotes, en las pantallas donde se trabaja.

   Los endpoints de operación —transferencias, conteos, producciones— devuelven
   la fila de Prisma tal cual: `sourceWarehouseId`, `items`, `countedAt`. Las
   pantallas leen `originWarehouse`, `lines`, `createdAt`. Nada de eso coincide,
   y como TypeScript no ve lo que llega por la red, nada avisaba.

   Lo que se veía:

     · Transferencias: dos columnas con UUID crudo en «Origen» y «Destino»
       —teniendo el nombre del almacén en la misma respuesta, sin usar— y la
       columna «Detalle» con un guion en todas las filas, porque buscaba
       `lines` donde el servidor manda `items`.
     · Conteos: el nombre del almacén vacío y «undefined diferencias».

   Aquí se traduce sin tocar el contrato: los campos originales se conservan y
   sólo se añaden los alias. Lo que el servidor NO entrega no se inventa: se
   devuelve `null` y la pantalla dice que no se sabe, que es distinto de cero.
   ========================================================================== */

export type LineaDeOperacion = {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  lotCode: string;
};

function normalizarLineas(valor: unknown): LineaDeOperacion[] {
  if (!Array.isArray(valor)) return [];
  return valor.map((linea) => {
    const fila = (linea ?? {}) as Record<string, unknown>;
    return {
      ingredientId: texto(fila.ingredientId),
      // `enrichRows` ya pone `ingredientName` en cada ítem. Si faltara, el SKU
      // o el id son peores que el nombre pero infinitamente mejores que vacío.
      ingredientName: texto(fila.ingredientName, fila.ingredientSku, fila.ingredientId),
      quantity: numero(fila.quantity, fila.countedQuantity, fila.convertedInventoryQuantity),
      unit: texto(fila.unit, fila.unitAbbreviation, fila.unitName),
      lotCode: texto(fila.lotCode, fila.lotNumber),
    };
  });
}

/* ── Transferencias ──────────────────────────────────────────────────────── */

export type TransferenciaNormalizada = {
  id: string;
  originWarehouse: string;
  destinationWarehouse: string;
  createdAt: string;
  status: string;
  lines: LineaDeOperacion[];
};

export function normalizarTransferencia<T extends Record<string, unknown>>(fila: T): T & TransferenciaNormalizada {
  return {
    ...fila,
    id: texto(fila.id),
    /*
     * El nombre del almacén, no su identificador.
     *
     * La pantalla caía a `sourceWarehouseId` cuando `originWarehouse` no
     * existía —que era siempre—, así que la tabla enseñaba dos UUID. Y el
     * nombre venía en la misma respuesta, puesto por `enrichRows`, sin que
     * nadie lo leyera.
     */
    originWarehouse: texto(fila.originWarehouse, fila.sourceWarehouseName, fila.sourceWarehouseId),
    destinationWarehouse: texto(fila.destinationWarehouse, fila.destinationWarehouseName, fila.destinationWarehouseId),
    createdAt: texto(fila.createdAt, fila.sentAt),
    status: texto(fila.status),
    lines: normalizarLineas(fila.lines ?? fila.items),
  };
}

export function normalizarTransferencias<T extends Record<string, unknown>>(filas: readonly T[]) {
  return filas.map((fila) => normalizarTransferencia(fila));
}

/* ── Conteos ─────────────────────────────────────────────────────────────── */

export type ConteoNormalizado = {
  id: string;
  countNumber: string;
  warehouseName: string;
  createdAt: string;
  status: string;
  lines: LineaDeOperacion[];
  /**
   * Cuántas líneas salieron distintas de lo que decía el sistema.
   *
   * `null` mientras el conteo no está aprobado, y no `0`: el backend calcula
   * las diferencias EN la aprobación y hasta entonces las oculta —un conteo a
   * ciegas no debe enseñar la existencia teórica de antemano, que es
   * justamente lo que lo hace fiable—. La pantalla imprimía `undefined
   * diferencias`; decir «0 diferencias» habría sido peor, porque eso sí se
   * lee como un resultado.
   */
  differences: number | null;
};

/** Sólo un conteo aprobado tiene diferencias calculadas. */
export function conteoAprobado(status: string) {
  return String(status).toUpperCase() === "APPROVED";
}

export function normalizarConteo<T extends Record<string, unknown>>(fila: T): T & ConteoNormalizado {
  const status = texto(fila.status);
  const lines = normalizarLineas(fila.lines ?? fila.items);
  const items = Array.isArray(fila.items) ? (fila.items as Array<Record<string, unknown>>) : [];
  return {
    ...fila,
    id: texto(fila.id),
    countNumber: texto(fila.countNumber),
    warehouseName: texto(fila.warehouseName),
    // `countedAt` es la fecha del conteo; `createdAt` es cuándo se abrió el
    // documento. La pantalla pedía la segunda y no llegaba ninguna.
    createdAt: texto(fila.countedAt, fila.createdAt),
    status,
    lines,
    differences: conteoAprobado(status)
      ? items.filter((item) => numero(item.varianceQuantity) !== 0).length
      : null,
  };
}

export function normalizarConteos<T extends Record<string, unknown>>(filas: readonly T[]) {
  return filas.map((fila) => normalizarConteo(fila));
}
