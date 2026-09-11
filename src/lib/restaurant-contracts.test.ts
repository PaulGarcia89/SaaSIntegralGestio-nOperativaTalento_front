import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { normalizarExistencia, normalizarLote } from "./restaurant-stock-rows";
import { normalizarConteo, normalizarTransferencia } from "./restaurant-operation-rows";

/* ==========================================================================
   EL DEFECTO QUE APARECIÓ OCHO VECES
   ==========================================================================
   La pantalla lee `item.stock`; el servidor manda `quantityOnHand`. La
   pantalla lee `item.lotCode`; el servidor manda `lotNumber`. La pantalla lee
   `row.lines`; el servidor manda `items`. Ocho veces, en ocho listados
   distintos, y ninguna la vio nadie.

   Por qué no la vio nadie
   -----------------------
   TypeScript no mira el cable. `request<RestaurantLotDto[]>(...)` es una
   AFIRMACIÓN, no una comprobación: el compilador cree lo que se le declara y
   el servidor manda lo que le da la gana. Así que `item.expiresAt` compila,
   arranca y se pinta —como `undefined`— sin que el typecheck, el build ni las
   pruebas digan una palabra.

   Lo que se veía, en producto: la columna «Vencimiento» con un guion en TODAS
   las filas de la pantalla cuyo único trabajo es decir qué caduca; dos UUID
   crudos donde iban el almacén de origen y el de destino; «undefined
   diferencias»; «USD 0,00» en mermas que costaron dinero; y un panel que
   afirmaba «no hay nada urgente» con la cocina sin producto, porque
   `undefined < 12` es `false`.

   Qué hace esta prueba
   --------------------
   Dos cosas, y la segunda es la que importa:

   1. Pasa por cada normalizador una fila COMO LA CONSTRUYE EL BACKEND —copiada
      de `restaurant-inventory.service.ts`— y comprueba que sale con los
      nombres que la pantalla lee.

   2. Exige que TODO `fetchRestaurant*` de `backend.ts` esté clasificado aquí
      abajo. Un listado nuevo no compila una excusa: o se declara verificado
      con su motivo, o esta prueba falla. Es lo único que puede impedir la
      novena vez.
   ========================================================================== */

/**
 * Cómo llega cada listado, y por qué se le cree.
 *
 * `explicito`   — el backend construye la respuesta campo por campo, así que
 *                 los nombres son los que el cliente declara. Se anota dónde.
 * `normalizado` — el backend devuelve la fila de Prisma y el cliente traduce.
 * `cliente`     — el propio `fetch*` mapea campo por campo antes de devolver.
 * `sin-listado` — no devuelve filas de tabla (un resumen, un archivo, un id).
 */
type Garantia = "explicito" | "normalizado" | "cliente" | "sin-listado";

const LISTADOS: Record<string, { garantia: Garantia; nota: string }> = {
  // ── El backend arma la respuesta a mano ──────────────────────────────────
  Receipts: { garantia: "explicito", nota: "receipts() arma cada campo y cada línea" },
  PriceHistory: { garantia: "explicito", nota: "priceHistory() devuelve un objeto calculado" },
  PurchaseSuggestions: { garantia: "explicito", nota: "suggestions() arma el objeto" },
  ExpiryAlerts: { garantia: "explicito", nota: "expiryAlertList() arma el objeto" },
  Variance: { garantia: "explicito", nota: "analytics/variance arma el objeto" },
  ShrinkageAlerts: { garantia: "explicito", nota: "alerts/shrinkage arma el objeto" },
  AuditLog: { garantia: "explicito", nota: "audit-log arma el objeto" },
  DemandForecast: { garantia: "explicito", nota: "demandForecast() arma el objeto" },
  BranchCosts: { garantia: "explicito", nota: "branchCosts() arma el objeto" },
  RecipeMargins: { garantia: "explicito", nota: "recipeMargins() arma el objeto" },
  UnitComparison: { garantia: "explicito", nota: "unitComparison() arma el objeto" },
  CountSchedules: { garantia: "explicito", nota: "count-schedules arma el objeto" },
  PurchaseBudgets: { garantia: "explicito", nota: "budgets() arma el objeto" },
  Commissaries: { garantia: "explicito", nota: "commissary list() arma el objeto" },

  // ── El cliente traduce la fila de Prisma ─────────────────────────────────
  Stock: { garantia: "normalizado", nota: "normalizarExistencias: ingredientName→name, quantityOnHand→stock" },
  Lots: { garantia: "normalizado", nota: "normalizarLotes: lotNumber→lotCode, expirationDate→expiresAt" },
  Transfers: { garantia: "normalizado", nota: "normalizarTransferencias: sourceWarehouseName→originWarehouse, items→lines" },
  StockCounts: { garantia: "normalizado", nota: "normalizarConteos: countedAt→createdAt, items→lines" },

  // ── El propio fetch mapea ────────────────────────────────────────────────
  Movements: { garantia: "cliente", nota: "fetchRestaurantMovements mapea campo por campo" },
  Invoices: { garantia: "cliente", nota: "fetchRestaurantInvoices mapea totalAmount→total" },

  /*
   * Listados que devuelven la fila de Prisma y la pantalla ya lee esos mismos
   * nombres. Se dejan anotados porque son los candidatos naturales al noveno
   * caso: cualquier campo nuevo que la pantalla invente sin que el servidor lo
   * mande cae aquí.
   */
  Categories: { garantia: "explicito", nota: "la fila de Prisma ES el contrato: name, description, status" },
  Units: { garantia: "explicito", nota: "la fila de Prisma ES el contrato: name, abbreviation, type" },
  Suppliers: { garantia: "explicito", nota: "la fila de Prisma ES el contrato: name, contactName, email" },
  Warehouses: { garantia: "explicito", nota: "la fila de Prisma ES el contrato; la sucursal se resuelve en el cliente" },
  Ingredients: { garantia: "explicito", nota: "ingredients() añade categoryName e inventoryUnitName" },
  Recipes: { garantia: "explicito", nota: "recipes() devuelve la receta enriquecida" },
  Consumptions: { garantia: "explicito", nota: "consumptions() devuelve el registro con sus items" },
  Wastes: { garantia: "explicito", nota: "wastes() añade totalCost" },
  Productions: { garantia: "explicito", nota: "productions() añade preparationName y consumedCost" },
  PurchaseOrders: { garantia: "explicito", nota: "la orden de Prisma; proveedor y almacén se resuelven en el cliente" },

  // ── No devuelven filas de tabla ──────────────────────────────────────────
  Dashboard: { garantia: "sin-listado", nota: "resumen" },
  AdvancedDashboard: { garantia: "sin-listado", nota: "resumen de decisiones" },
  Phase: { garantia: "sin-listado", nota: "resumen de fase 2" },
  Report: { garantia: "sin-listado", nota: "informe con columnas declaradas por el servidor" },
  RecipeCost: { garantia: "sin-listado", nota: "costo de una receta" },
  Audit: { garantia: "sin-listado", nota: "informe de auditoría" },
  SalesImportHistory: { garantia: "sin-listado", nota: "historial de importaciones" },
  SalesImportJob: { garantia: "sin-listado", nota: "estado de un trabajo" },
  SalesImportSession: { garantia: "sin-listado", nota: "validación de una sesión" },
  SalesImportMappings: { garantia: "sin-listado", nota: "no expuesto por el backend" },
};

describe("contratos de los listados del inventario de restaurante", () => {
  /**
   * La red de seguridad.
   *
   * Sin esto, el próximo `fetchRestaurantLoQueSea` entra sin que nadie se
   * pregunte si los nombres coinciden, que es exactamente como entraron los
   * ocho anteriores.
   */
  it("obliga a clasificar cada listado nuevo antes de usarlo", () => {
    const fuente = readFileSync(join(process.cwd(), "src/lib/backend.ts"), "utf8");
    const encontrados = [...fuente.matchAll(/export (?:async )?function fetchRestaurant([A-Za-z]+)/g)].map((m) => m[1]);
    expect(encontrados.length).toBeGreaterThan(30);

    const sinClasificar = encontrados.filter((nombre) => !(nombre in LISTADOS));
    expect(sinClasificar, "clasifica estos listados en LISTADOS").toEqual([]);

    const sobrantes = Object.keys(LISTADOS).filter((nombre) => !encontrados.includes(nombre));
    expect(sobrantes, "estos listados ya no existen en backend.ts").toEqual([]);
  });

  /**
   * Cada muestra es la fila tal y como la construye el servicio del backend.
   * Si el backend cambia esos nombres, estas comprobaciones caen aquí —en
   * milisegundos y con el nombre del campo— en vez de en una celda vacía que
   * nadie relaciona con nada.
   */
  describe("la fila del servidor sale con los nombres que la pantalla lee", () => {
    it("existencias: /restaurant-inventory/balances", () => {
      const fila = normalizarExistencia({
        id: "bal-1", ingredientId: "ing-1", ingredientName: "Tomate riñón", ingredientSku: "VEG-001",
        quantityOnHand: 4.5, availableQuantity: 4.5, minimumStock: 12, averageCost: 1.35,
        unitName: "Kilogramo", unitAbbreviation: "kg", stockStatus: "LOW_STOCK",
      });
      expect(fila.name).toBeTruthy();
      expect(fila.inventoryUnit).toBeTruthy();
      expect(Number.isFinite(fila.stock)).toBe(true);
      // La comparación que el panel usa para decidir si hay algo urgente.
      expect(fila.stock < fila.minimumStock).toBe(true);
    });

    it("lotes: /restaurant-inventory/lots", () => {
      const fila = normalizarLote({
        id: "lot-1", ingredientId: "ing-1", ingredientName: "Queso mozzarella", lotNumber: "L-3312",
        expirationDate: "2026-09-14T00:00:00.000Z", remainingQuantity: 6, unitCost: 7.8,
        unitName: "Kilogramo", unitAbbreviation: "kg", status: "ACTIVE",
      });
      expect(fila.lotCode).toBeTruthy();
      expect(fila.expiresAt).toBeTruthy();
      expect(fila.unit).toBeTruthy();
      expect(typeof fila.daysRemaining).toBe("number");
    });

    it("transferencias: /restaurant-inventory/transfers", () => {
      const fila = normalizarTransferencia({
        id: "tr-1", sourceWarehouseId: "w-1", destinationWarehouseId: "w-2",
        sourceWarehouseName: "Bodega principal", destinationWarehouseName: "Cocina fría",
        status: "DRAFT", items: [{ ingredientId: "ing-1", ingredientName: "Tomate riñón", quantity: 12 }],
      });
      // Ni un identificador donde va un nombre.
      expect(fila.originWarehouse).not.toMatch(/^w-/);
      expect(fila.destinationWarehouse).not.toMatch(/^w-/);
      expect(fila.lines).toHaveLength(1);
      expect(fila.lines[0].ingredientName).toBe("Tomate riñón");
    });

    it("conteos: /restaurant-inventory/stock-counts", () => {
      const fila = normalizarConteo({
        id: "cnt-1", countNumber: "CNT-0004", warehouseName: "Bodega principal",
        countedAt: "2026-09-10T08:00:00.000Z", status: "IN_REVIEW",
        items: [{ ingredientId: "ing-1", ingredientName: "Tomate riñón", countedQuantity: 10 }],
      });
      expect(fila.createdAt).toBeTruthy();
      expect(fila.lines).toHaveLength(1);
      // Un conteo sin aprobar no tiene diferencias calculadas: decir «0» sería
      // afirmar un resultado que el backend todavía no ha computado.
      expect(fila.differences).toBeNull();
    });
  });

  /**
   * El error que más caro salió no fue un hueco vacío: fue un `NaN` y un
   * `undefined` metidos en una comparación numérica. `undefined < 12` es
   * `false`, así que el panel del módulo no encontró NUNCA un faltante.
   */
  it("nunca deja un número sin valor donde hay una comparación", () => {
    const incompleta = normalizarExistencia({ id: "x", ingredientName: "Sal" });
    expect(Number.isNaN(incompleta.stock)).toBe(false);
    expect(Number.isNaN(incompleta.minimumStock)).toBe(false);
    expect(Number.isNaN(incompleta.averageCost)).toBe(false);

    const loteIncompleto = normalizarLote({ id: "x" });
    expect(Number.isNaN(loteIncompleto.remainingQuantity)).toBe(false);
    expect(Number.isNaN(loteIncompleto.cost)).toBe(false);
  });
});
