/**
 * Normalización de las filas de `/restaurant-inventory/balances`.
 *
 * El endpoint entrega el saldo con los nombres del modelo —`ingredientName`,
 * `quantityOnHand`, `unitAbbreviation`, `ingredientSku`, `stockStatus`— y la
 * pantalla «Existencias» y el panel del módulo leen los del DTO de ingrediente
 * —`name`, `stock`, `inventoryUnit`, `sku`, `status`—. Coincidían exactamente
 * dos campos, `minimumStock` y `averageCost`: por eso el mínimo y el costo
 * promedio salían bien mientras la columna «Ingrediente» salía vacía y
 * «Existencia» salía «NaN undefined».
 *
 * El daño no era cosmético. `item.stock < item.minimumStock` comparaba
 * `undefined` contra un número, que es `false` SIEMPRE, así que:
 *
 *   · el badge «Bajo mínimo» no se encendía nunca,
 *   · el filtro de alertas «Bajo mínimo» devolvía cero filas,
 *   · y el bloque «Empieza por aquí» del panel del módulo —que se calcula con
 *     la misma comparación— nunca proponía reponer: el panel afirmaba que no
 *     había nada urgente aunque no quedara producto en el almacén.
 *
 * Se resuelve en el cliente y no en el servidor: el contrato del backend no se
 * toca, los campos originales se conservan íntegros y solo se AÑADEN los alias
 * que el front ya esperaba. Si mañana el endpoint empieza a entregar `name` o
 * `stock` directamente, esos valores mandan y esta función no estorba.
 */

/** Los alias que el frontend del módulo lee en las filas de existencias. */
export type ExistenciaNormalizada = {
  id: string;
  name: string;
  sku: string;
  stock: number;
  minimumStock: number;
  inventoryUnit: string;
  averageCost: number;
  status: string;
};

/** Primer valor que no sea `null` ni `undefined`. El `0` y el `""` cuentan. */
function primero<T>(...valores: Array<T | null | undefined>): T | undefined {
  for (const valor of valores) if (valor !== null && valor !== undefined) return valor;
  return undefined;
}

/** Primer valor legible como texto. Compartido con los normalizadores de operaciones. */
export function texto(...valores: unknown[]): string {
  const valor = primero(...(valores as Array<unknown>));
  return valor === undefined ? "" : String(valor);
}

/**
 * Número o `0`.
 *
 * Nunca devuelve `NaN`: una cantidad ilegible en pantalla es peor que un cero,
 * porque «NaN» no se puede comparar ni ordenar y arrastra el error a las
 * alertas. Un `0` mal leído se ve como faltante, que es el lado seguro.
 */
/** Primer valor legible como número, nunca `NaN`. Compartido con los normalizadores de operaciones. */
export function numero(...valores: unknown[]): number {
  const valor = primero(...(valores as Array<unknown>));
  if (valor === undefined || valor === "") return 0;
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : 0;
}

export function normalizarExistencia<T extends Record<string, unknown>>(fila: T): T & ExistenciaNormalizada {
  return {
    ...fila,
    id: texto(fila.id, fila.ingredientId),
    name: texto(fila.name, fila.ingredientName, fila.ingredientSku, fila.sku),
    sku: texto(fila.sku, fila.ingredientSku),
    // `availableQuantity` primero: es lo que se puede usar hoy, que es la
    // pregunta de quien mira esta pantalla. `quantityOnHand` es el saldo bruto.
    stock: numero(fila.stock, fila.availableQuantity, fila.quantityOnHand),
    minimumStock: numero(fila.minimumStock),
    // La abreviatura antes que el nombre largo: en una celda numérica «kg»
    // cabe y «Kilogramo» empuja la cifra fuera de la columna en 390 px.
    inventoryUnit: texto(fila.inventoryUnit, fila.unitAbbreviation, fila.unitName),
    averageCost: numero(fila.averageCost, fila.cost, fila.unitCost),
    status: texto(fila.status, fila.stockStatus),
  };
}

export function normalizarExistencias<T extends Record<string, unknown>>(filas: readonly T[]): Array<T & ExistenciaNormalizada> {
  return filas.map((fila) => normalizarExistencia(fila));
}

/**
 * Está por debajo de su mínimo.
 *
 * Una sola definición para las tres pantallas que la preguntaban por separado
 * —«Existencias», su filtro y el panel del módulo—. El mínimo en cero significa
 * «sin mínimo definido», no «todo es faltante»: sin esta guarda, dar de alta un
 * ingrediente sin mínimo lo metía en la lista de faltantes el mismo día.
 */
export function estaBajoMinimo(fila: { stock: number; minimumStock: number }): boolean {
  return fila.minimumStock > 0 && fila.stock < fila.minimumStock;
}

/** Cuánto falta para volver al mínimo. `0` si no falta nada. */
export function faltaParaElMinimo(fila: { stock: number; minimumStock: number }): number {
  return estaBajoMinimo(fila) ? fila.minimumStock - fila.stock : 0;
}

/**
 * Orden de urgencia: primero el que está más lejos de su mínimo en proporción.
 *
 * Proporción y no diferencia: faltar 2 kg de un mínimo de 3 kg deja la cocina
 * parada hoy; faltar 2 kg de un mínimo de 200 kg no.
 */
export function porUrgencia<T extends { stock: number; minimumStock: number }>(filas: readonly T[]): T[] {
  return [...filas].sort(
    (izq, der) => izq.stock / Math.max(1, izq.minimumStock) - der.stock / Math.max(1, der.minimumStock),
  );
}

/* ========================================================================== */

/**
 * Normalización de las filas de `/restaurant-inventory/lots`.
 *
 * El mismo desajuste que en los saldos, en la pantalla donde más duele. El
 * endpoint entrega la fila del lote con los nombres del modelo —`lotNumber`,
 * `expirationDate`, `unitCost`— y la pantalla «Lotes y vencimientos» leía
 * `lotCode`, `expiresAt` y `unit`. Resultado: el código de lote salía vacío y
 * **la columna «Vencimiento» ponía «—» en todas las filas**, en la pantalla
 * cuyo único trabajo es decir qué se vence. Además, sin fecha no había con qué
 * ordenar: el lote que caduca mañana aparecía donde tocase.
 *
 * `unitName` y `unitAbbreviation` los entrega el servidor desde que `lots()` y
 * `expiryAlerts()` hacen el mismo join que ya hacía `balances()`.
 */
export type LoteNormalizado = {
  id: string;
  ingredientName: string;
  lotCode: string;
  expiresAt: string;
  receivedAt: string;
  remainingQuantity: number;
  unit: string;
  cost: number;
  warehouseName: string;
  status: string;
  /** Días hasta el vencimiento. Negativo si ya venció, `null` si no caduca. */
  daysRemaining: number | null;
};

export function normalizarLote<T extends Record<string, unknown>>(fila: T): T & LoteNormalizado {
  const vence = texto(fila.expiresAt, fila.expirationDate);
  return {
    ...fila,
    id: texto(fila.id),
    ingredientName: texto(fila.ingredientName, fila.ingredientSku, fila.ingredientId),
    lotCode: texto(fila.lotCode, fila.lotNumber),
    expiresAt: vence,
    receivedAt: texto(fila.receivedAt),
    remainingQuantity: numero(fila.remainingQuantity, fila.quantity),
    unit: texto(fila.unit, fila.unitAbbreviation, fila.unitName),
    cost: numero(fila.cost, fila.unitCost),
    warehouseName: texto(fila.warehouseName),
    status: texto(fila.status, fila.lotStatus),
    daysRemaining: typeof fila.daysRemaining === "number" ? fila.daysRemaining : diasParaVencer(vence),
  };
}

export function normalizarLotes<T extends Record<string, unknown>>(filas: readonly T[]): Array<T & LoteNormalizado> {
  return filas.map((fila) => normalizarLote(fila));
}

/**
 * Días que faltan para el vencimiento. `null` si el lote no caduca.
 *
 * Se cuenta por días de calendario y no por horas: un lote que caduca hoy a
 * las once de la noche vence HOY, no «en 0,4 días», y quien mira la pantalla a
 * las nueve de la mañana necesita verlo entre lo de hoy.
 */
export function diasParaVencer(valor: string, ahora = new Date()): number | null {
  if (!valor) return null;
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return null;
  const dia = (referencia: Date) => Date.UTC(referencia.getUTCFullYear(), referencia.getUTCMonth(), referencia.getUTCDate());
  return Math.round((dia(fecha) - dia(ahora)) / 86400000);
}

export type FiltroDeVencimiento = "" | "EXPIRED" | "7" | "15" | "30";

/**
 * El filtro de vencimiento, en el cliente.
 *
 * Los cuatro atajos de la pantalla —«Vencidos», «7», «15», «30 días»— se
 * mandaban al servidor como `?expiry=…`, y el controlador de `/lots` **no lee
 * ese parámetro**: acepta `status`, `branchId`, `warehouseId` y la paginación,
 * nada más. Los cuatro botones devolvían la lista entera, idéntica. Y el
 * enlace «Ver lotes» del panel, que apunta a `?filter=7`, aterrizaba en esa
 * misma lista sin filtrar.
 *
 * Se resuelve aquí porque `/lots` sin paginación devuelve el listado completo:
 * filtrar en el cliente da el mismo resultado que filtrar en el servidor, sin
 * cambiar el contrato ni añadir un parámetro que nadie más usa.
 */
export function filtrarPorVencimiento<T extends { daysRemaining: number | null }>(
  filas: readonly T[],
  filtro: FiltroDeVencimiento,
): T[] {
  if (!filtro) return [...filas];
  if (filtro === "EXPIRED") return filas.filter((fila) => fila.daysRemaining !== null && fila.daysRemaining < 0);
  const dias = Number(filtro);
  // Lo ya vencido entra en «vence en 7 días»: es más urgente, no menos, y
  // esconderlo del atajo que se usa para planificar la semana era la forma más
  // rápida de que se quedara en el estante.
  return filas.filter((fila) => fila.daysRemaining !== null && fila.daysRemaining <= dias);
}

/** Lo que vence antes, primero. Lo que no caduca, al final. */
export function porVencimiento<T extends { daysRemaining: number | null }>(filas: readonly T[]): T[] {
  return [...filas].sort((izq, der) => (izq.daysRemaining ?? Infinity) - (der.daysRemaining ?? Infinity));
}
