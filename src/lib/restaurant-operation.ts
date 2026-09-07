import type { OperationImpact, OperationImpactLine, OperationWarning } from "@/lib/operation-flow";

/**
 * Normalización de las previsualizaciones de inventario de restaurante.
 *
 * El backend devuelve la previsualización de cada operación —merma, consumo,
 * producción, ajuste— con nombres de campo distintos según el endpoint:
 * `items` o `ingredients`, `totalCost` o `wasteCost`, `resultingStock` o
 * `resultingQuantity`. Hasta ahora cada pantalla resolvía eso en línea, con
 * cadenas como `String(item.resultingStock ?? item.resultingQuantity ?? "-")`
 * repetidas en varios archivos: cuatro sitios donde equivocarse y ninguno
 * probado.
 *
 * Aquí se normaliza una vez y se convierte al impacto del patrón universal de
 * operaciones. Puro y sin React.
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Primer campo con un valor utilizable, probando los alias en orden. */
function firstDefined(source: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

/**
 * Número tolerante: descarta `NaN` e infinitos en vez de propagarlos.
 *
 * `null`, `undefined` y la cadena vacía se descartan ANTES de convertir, porque
 * `Number(null)` y `Number("")` valen 0 y ese cero es finito: sin este guarda,
 * una existencia desconocida se habría pintado como «0 kg» en vez de «—», que
 * es afirmar que el almacén está vacío cuando lo que pasa es que no se sabe.
 */
export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export type RestaurantPreviewLine = {
  id: string;
  name: string;
  /** Cantidad de la operación, ya formateada con su unidad si viene. */
  quantity: string;
  /** Existencia antes, si el backend la manda. */
  before: string | null;
  /** Existencia después. */
  after: string | null;
  cost: number | null;
  /** `true` si la existencia resultante es negativa. */
  negative: boolean;
};

/**
 * Extrae las líneas de una previsualización.
 *
 * Nunca lanza: una previsualización con una forma inesperada devuelve una
 * lista vacía, y quien llama decide qué hacer. Que la pantalla reviente por un
 * campo que cambió de nombre es peor que mostrar un impacto incompleto.
 */
export function parseRestaurantPreview(preview: unknown): {
  lines: RestaurantPreviewLine[];
  totalCost: number | null;
} {
  if (!isRecord(preview)) return { lines: [], totalCost: null };

  const rawLines = firstDefined(preview, ["items", "ingredients", "lines", "details"]);
  const array = Array.isArray(rawLines) ? rawLines : [];

  const lines: RestaurantPreviewLine[] = array.filter(isRecord).map((item, index) => {
    const name = firstDefined(item, ["ingredientName", "name", "productName", "recipeName", "ingredientId", "id"]);
    const quantity = toNumber(firstDefined(item, ["quantity", "requiredQuantity", "plannedQuantity", "countedQuantity"]));
    const unit = firstDefined(item, ["unit", "unitName", "unitSymbol", "inventoryUnit"]);
    const before = toNumber(firstDefined(item, ["currentStock", "availableQuantity", "stockBefore", "previousQuantity"]));
    const after = toNumber(firstDefined(item, ["resultingStock", "resultingQuantity", "stockAfter", "remainingQuantity"]));
    const cost = toNumber(firstDefined(item, ["totalCost", "wasteCost", "cost", "lineCost"]));

    const conUnidad = (value: number | null) =>
      value === null ? null : unit ? `${formatQuantity(value)} ${String(unit)}` : formatQuantity(value);

    return {
      id: String(firstDefined(item, ["ingredientId", "recipeId", "id"]) ?? index),
      name: String(name ?? "Sin nombre"),
      quantity: conUnidad(quantity) ?? "—",
      before: conUnidad(before),
      after: conUnidad(after),
      cost,
      negative: after !== null && after < 0,
    };
  });

  const totalCost =
    toNumber(firstDefined(preview, ["totalCost", "wasteCost", "totalAmount", "cost"])) ??
    (lines.length && lines.every((line) => line.cost !== null)
      ? lines.reduce((sum, line) => sum + (line.cost ?? 0), 0)
      : null);

  return { lines, totalCost };
}

/** Cantidad con separador decimal español y sin decimales inútiles. */
export function formatQuantity(value: number): string {
  return new Intl.NumberFormat("es", { maximumFractionDigits: 3 }).format(value);
}

/** Importe con dos decimales y separador español. */
export function formatMoney(value: number, currency = "USD"): string {
  return `${currency} ${new Intl.NumberFormat("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;
}

export type RestaurantOperationInput = {
  /** Nombre de la operación en una frase: "Registrar merma en Bodega Central". */
  headline: string;
  /** Qué se cuenta: "ingredientes", "recetas"… */
  affectedLabel: string;
  preview: unknown;
  responsible: string;
  currency?: string;
  /**
   * `true` si el saldo baja. Sirve para marcar como desfavorable un descenso de
   * existencias sin tener que deducirlo de las cifras, que en una producción
   * suben y bajan a la vez.
   */
  reducesStock?: boolean;
  /** Avisos que ya conoce la pantalla, como un almacén sin seleccionar. */
  extraWarnings?: OperationWarning[];
};

/**
 * Impacto de una operación de inventario.
 *
 * `irreversible` es siempre cierto: confirmar aplica el movimiento al almacén y
 * queda en la auditoría inmutable. Deshacerlo exige otra operación en sentido
 * contrario, que es una cosa distinta de un «deshacer».
 *
 * Una existencia resultante NEGATIVA se declara BLOQUEO y no aviso: significa
 * que se está sacando más de lo que hay, y confirmarlo dejaría el inventario
 * mintiendo sobre la realidad del almacén.
 */
export function restaurantOperationImpact(input: RestaurantOperationInput): OperationImpact {
  const { lines, totalCost } = parseRestaurantPreview(input.preview);
  const currency = input.currency ?? "USD";

  const impactLines: OperationImpactLine[] = lines.map((line) => ({
    label: line.name,
    before: line.before ?? "—",
    after: line.after ?? line.quantity,
    adverse: line.negative || (input.reducesStock === true && line.after !== null),
  }));

  const negativas = lines.filter((line) => line.negative);

  const warnings: OperationWarning[] = [...(input.extraWarnings ?? [])];
  const sinExistenciaConocida = lines.filter((line) => line.before === null && line.after === null).length;
  if (sinExistenciaConocida > 0 && lines.length > 0) {
    warnings.push({
      code: "UNKNOWN_STOCK",
      message:
        sinExistenciaConocida === 1
          ? "De un producto no se conoce la existencia resultante, así que no se puede anticipar cómo queda."
          : `De ${sinExistenciaConocida} productos no se conoce la existencia resultante, así que no se puede anticipar cómo quedan.`,
    });
  }

  return {
    headline: input.headline,
    affectedCount: lines.length,
    affectedLabel: input.affectedLabel,
    lines: impactLines,
    cost: totalCost === null ? undefined : {
      label: "Impacto en el costo del inventario",
      amount: formatMoney(totalCost, currency),
      adverse: input.reducesStock === true && totalCost > 0,
    },
    warnings,
    blockers: negativas.map((line) => ({
      code: `NEGATIVE_STOCK_${line.id}`,
      cause: `«${line.name}» quedaría en ${line.after}, por debajo de cero.`,
      owner: "Encargado de inventario de la sucursal",
      resolution:
        "Ajusta la cantidad de esta línea, o registra primero la entrada que falta para que el almacén tenga existencia.",
    })),
    responsible: input.responsible,
    irreversible: true,
  };
}
