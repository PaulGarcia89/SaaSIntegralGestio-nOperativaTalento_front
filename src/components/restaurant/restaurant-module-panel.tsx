"use client";

import { useUiText } from "@/components/ui-copy";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Download,
  RefreshCw,
} from "lucide-react";
import {
  EmptyState,
  ErrorState,
  InlineNote,
  NextAction,
  PageHeader,
  PageSection,
  SkeletonRows,
  StatusBadge,
  StatusTile,
  StatusTileRow,
} from "@/components/system";
import { BarChart, ChartCard, ChartSkeleton } from "@/components/chart";
import { URGENCY_COLOR_CLASS } from "@/components/dashboard/operational-widgets";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import {
  fetchRestaurantAdvancedDashboard,
  fetchRestaurantDashboard,
  fetchRestaurantStock,
  getApiErrorMessage,
} from "@/lib/backend";
import { useAppStore } from "@/store/app-store";
import { useRestaurantInventoryContext } from "@/components/restaurant-inventory-context";
import { estaBajoMinimo, porUrgencia } from "@/lib/restaurant-stock-rows";

/* ==========================================================================
   PANEL DEL INVENTARIO DE RESTAURANTE
   ==========================================================================
   Antes, la primera pantalla del módulo apilaba TRES cabeceras —la del
   armazón, «¿Qué necesitas hacer?» y «Dashboard orientado a decisiones»—,
   dos acciones recomendadas distintas, ocho cifras, cuatro tarjetas de
   acción, dos listas y dos gráficos dibujados a mano con `div`. Y dos
   peticiones al servidor que contaban cosas parecidas.

   Queda una sola lectura, en el orden en que se pregunta:

     ¿dónde estoy?    sucursal y almacén activos
     ¿qué hago ahora?  una acción, la más urgente
     ¿cómo va?         cuatro cifras
     ¿qué me falta?    faltantes y vencimientos, con su unidad
     ¿qué opero?       las cinco operaciones del día
     ¿y la tendencia?  consumo del periodo

   Producto, cantidad, unidad y ubicación van SIEMPRE juntos: la unidad sale
   de `/restaurant-inventory/stock`, que es la única fuente que la entrega, y
   la ubicación es el almacén activo, escrito arriba.
   ========================================================================== */



/** Cuántas filas de alerta caben antes de que la lista deje de leerse. */
const MAX_ALERTAS = 5;

export function RestaurantModulePanel() {
  const uiText = useUiText();
  const { locale } = useLocale();
  const { currentBranch, can } = useAppStore();
  const { warehouseId, warehouseName } = useRestaurantInventoryContext();

  // Ver dinero es una decisión de permiso, no de diseño. Sin
  // `commercial.view` el panel no enseña el valor del inventario.
  const puedeVerValor = can("restaurant_inventory.commercial.view");

  const avanzado = useQuery({
    queryKey: ["restaurant-decision-dashboard", currentBranch?.id, warehouseId],
    queryFn: () => fetchRestaurantAdvancedDashboard({ branchId: currentBranch?.id ?? "", warehouseId: warehouseId ?? "" }),
    enabled: Boolean(currentBranch?.id),
  });

  // Solo por las entradas en borrador: es lo único que el panel necesita y el
  // dashboard avanzado no entrega.
  const basico = useQuery({
    queryKey: ["restaurant-operational-home", currentBranch?.id, warehouseId],
    queryFn: () => fetchRestaurantDashboard({ branchId: currentBranch?.id, warehouseId }),
    enabled: Boolean(currentBranch?.id && warehouseId),
  });

  // Misma clave que usa la pantalla «Existencias»: al navegar allí no se
  // vuelve a pedir. Es la ÚNICA fuente que trae la unidad de medida.
  const existencias = useQuery({
    queryKey: ["restaurant-stock", currentBranch?.id, warehouseId],
    queryFn: () => fetchRestaurantStock({ branchId: currentBranch?.id, warehouseId }),
    enabled: Boolean(currentBranch?.id),
  });

  const datos = avanzado.data;
  // Un punto por día: si el servidor aún manda un punto por movimiento (misma
  // fecha repetida), aquí se suman. Sin esto, diez salidas del mismo día eran
  // diez barras superpuestas con cifras encima unas de otras.
  const tendencia = agruparPorDia(datos?.consumptionTrend ?? [], locale);
  const entradasBorrador = basico.data?.recentReceipts.filter((item) => item.status === "DRAFT").length;

  /*
   * Faltantes.
   *
   * La comparación vivía aquí escrita a mano y comparaba `undefined` contra un
   * número —el endpoint de saldos nunca entregó `stock`—, así que daba `false`
   * siempre y esta lista salía vacía en todos los almacenes. El panel decía
   * «no hay nada urgente» con la cocina sin producto. Ahora el dato llega
   * normalizado desde `fetchRestaurantStock` y la regla es la misma función
   * que usa la pantalla «Existencias», para que no puedan volver a discrepar.
   */
  const bajoMinimo = porUrgencia((existencias.data ?? []).filter(estaBajoMinimo));

  const vencimientos = datos?.upcomingExpirations ?? [];

  /*
   * A dónde va el producto.
   *
   * `waste` y `periodConsumption` venían en la misma respuesta, salían en el
   * CSV que exporta este propio panel… y no se pintaban en ninguna parte. En
   * un inventario de restaurante la merma es el dinero que se tira: la cifra
   * más accionable que hay, y la única que se puede bajar mañana.
   *
   * La proporción se calcula sobre la SALIDA total del periodo —lo consumido
   * más lo tirado—, no sobre el consumo: «un 8 % de merma» solo significa
   * algo si se dice respecto de qué.
   */
  const salidaTotal = datos ? datos.periodConsumption + datos.waste : 0;
  const mermaPorcentaje = datos && salidaTotal > 0 ? Math.round((datos.waste / salidaTotal) * 100) : null;
  const reparto = datos
    ? [
        { id: "consumo", label: uiText("Consumo"), value: datos.periodConsumption, color: "text-series-2" },
        { id: "merma", label: uiText("Merma"), value: datos.waste, color: URGENCY_COLOR_CLASS.danger },
      ]
    : [];

  /** `undefined` mientras carga · `null` si el servidor no lo entrega. */
  const cifra = (valor: number | undefined, consulta: { isError: boolean; isLoading: boolean }) =>
    consulta.isError ? null : consulta.isLoading ? undefined : (valor ?? null);

  if (avanzado.isLoading && existencias.isLoading) {
    return <SkeletonRows rows={5} label={uiText("Cargando el estado del inventario")} />;
  }

  if (avanzado.isError && existencias.isError) {
    return (
      <ErrorState
        title={uiText("No fue posible cargar el estado del inventario")}
        detail={getApiErrorMessage(avanzado.error, uiText("Reintenta la consulta para continuar."))}
        onRetry={() => {
          void avanzado.refetch();
          void existencias.refetch();
        }}
      />
    );
  }

  // Una sola acción recomendada, elegida por urgencia real: lo que falta para
  // cocinar hoy pesa más que lo que vence esta semana, y ambas por encima de
  // un documento que espera confirmación.
  const recomendada = bajoMinimo.length
    ? {
        title: uiText("Reponer {{n}} productos bajo mínimo", { n: bajoMinimo.length }),
        detail: uiText("Empieza por {{name}}: {{stock}} {{unit}} frente a un mínimo de {{min}}.", {
          name: bajoMinimo[0].name,
          stock: bajoMinimo[0].stock,
          unit: bajoMinimo[0].inventoryUnit,
          min: bajoMinimo[0].minimumStock,
        }),
        href: "/inventory/restaurant/purchase-suggestions",
        actionLabel: uiText("Ver sugerencias de compra"),
        tone: "danger" as const,
      }
    : vencimientos.length
      ? {
          title: uiText("{{n}} lotes próximos a vencer", { n: vencimientos.length }),
          detail: uiText("El primero es {{name}}, lote {{lot}}, el {{date}}.", {
            name: vencimientos[0].name,
            lot: vencimientos[0].lot,
            date: fechaCorta(vencimientos[0].expiresAt, locale),
          }),
          href: "/inventory/restaurant/lots?filter=7",
          actionLabel: uiText("Revisar lotes"),
          tone: "warning" as const,
        }
      : entradasBorrador
        ? {
            title: uiText("{{n}} entradas esperando confirmación", { n: entradasBorrador }),
            detail: uiText("La mercancía no suma al inventario hasta que la entrada se confirma."),
            href: "/inventory/restaurant/receipts?status=DRAFT",
            actionLabel: uiText("Revisar entradas"),
            tone: "progress" as const,
          }
        : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={uiText("Inventario de restaurante")}
        title={uiText("Resumen")}
        description={uiText("Lo urgente primero, luego cómo va el almacén y a dónde se está yendo el producto.")}
        meta={<span>{warehouseName}</span>}
      />

      {/* ---- 1. Qué hago ahora ------------------------------------------ */}
      {recomendada ? (
        <NextAction
          label={uiText("Empieza por aquí")}
          title={recomendada.title}
          detail={recomendada.detail}
          href={recomendada.href}
          actionLabel={recomendada.actionLabel}
          tone={recomendada.tone}
        />
      ) : (
        <EmptyState
          reason="no-records"
          title={uiText("No hay nada urgente en este almacén")}
          description={uiText("Sin faltantes, sin lotes por vencer y sin entradas esperando confirmación. Puedes seguir con la operación del día.")}
        />
      )}

      {/* ---- 2. Cómo va el inventario ----------------------------------- */}
      <StatusTileRow label={uiText("Estado del inventario")} className="xl:grid-cols-3">
        <li className="min-w-0">
          <StatusTile
            title={uiText("Bajo mínimo")}
            value={cifra(existencias.data ? bajoMinimo.length : undefined, existencias)}
            context={uiText("Productos por debajo de su existencia mínima.")}
            status={bajoMinimo.length > 0 ? { label: uiText("Reponer"), tone: "danger" as const } : undefined}
            href="/inventory/restaurant/stock?filter=LOW"
            actionLabel={uiText("Ver faltantes")}
            scope={warehouseName}
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title={uiText("Próximos a vencer")}
            value={cifra(datos ? vencimientos.length : undefined, avanzado)}
            context={uiText("Lotes que caducan en los próximos días.")}
            status={vencimientos.length > 0 ? { label: uiText("Revisar"), tone: "warning" as const } : undefined}
            href="/inventory/restaurant/lots?filter=7"
            actionLabel={uiText("Ver lotes")}
            scope={warehouseName}
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title={uiText("Entradas por confirmar")}
            value={cifra(entradasBorrador, basico)}
            context={uiText("No suman al inventario hasta confirmarse.")}
            href="/inventory/restaurant/receipts?status=DRAFT"
            actionLabel={uiText("Revisar entradas")}
            scope={warehouseName}
          />
        </li>
        {puedeVerValor ? (
          <li className="min-w-0">
            <StatusTile
              title={uiText("Merma del periodo")}
              // Salía en el CSV de este mismo panel y no en la pantalla.
              value={datos ? formatoMoneda(datos.waste, locale) : cifra(undefined, avanzado)}
              context={
                mermaPorcentaje === null
                  ? uiText("Producto perdido, dañado o caducado.")
                  : uiText("El {{n}} % de todo lo que salió del almacén.", { n: mermaPorcentaje })
              }
              status={
                mermaPorcentaje !== null && mermaPorcentaje >= 5
                  ? { label: uiText("Alta"), tone: "danger" as const }
                  : undefined
              }
              href="/inventory/restaurant/waste"
              actionLabel={uiText("Ver mermas")}
              scope={warehouseName}
            />
          </li>
        ) : null}
        {puedeVerValor ? (
          <li className="min-w-0">
            <StatusTile
              title={uiText("Consumo del periodo")}
              value={datos ? formatoMoneda(datos.periodConsumption, locale) : cifra(undefined, avanzado)}
              context={uiText("Producto que salió para cocinar o vender.")}
              href="/inventory/restaurant/consumption"
              actionLabel={uiText("Ver consumo")}
              scope={warehouseName}
            />
          </li>
        ) : null}
        {puedeVerValor ? (
          <li className="min-w-0">
            <StatusTile
              title={uiText("Valor del inventario")}
              value={datos ? formatoMoneda(datos.inventoryValue, locale) : cifra(undefined, avanzado)}
              context={uiText("Valorado al costo promedio del almacén activo.")}
              href="/inventory/restaurant/costs"
              actionLabel={uiText("Ver costos")}
              scope={warehouseName}
            />
          </li>
        ) : (
          <li className="min-w-0">
            <StatusTile
              title={uiText("Diferencia de conteo")}
              value={datos ? formatoNumero(datos.inventoryDifference, locale) : cifra(undefined, avanzado)}
              context={uiText("Diferencia entre existencia teórica y contada.")}
              href="/inventory/restaurant/variance"
              actionLabel={uiText("Ver diferencias")}
              scope={warehouseName}
            />
          </li>
        )}
      </StatusTileRow>

      {/* ---- 3. Qué falta y qué vence ------------------------------------
          Producto, cantidad, unidad y ubicación, siempre juntos. */}
      {bajoMinimo.length > 0 ? (
        <PageSection
          title={uiText("Productos bajo mínimo")}
          description={uiText("En {{warehouse}}. Ordenados por lo lejos que están de su mínimo.", { warehouse: warehouseName })}
          id="bajo-minimo"
          actions={
            <Button asChild variant="secondary" size="sm">
              <Link href="/inventory/restaurant/stock?filter=LOW">{uiText("Ver todos")}</Link>
            </Button>
          }
        >
          <ul className="space-y-1">
            {bajoMinimo.slice(0, MAX_ALERTAS).map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border border-line bg-surface-1 px-4 py-3"
              >
                <span className="min-w-0 flex-1 basis-40">
                  <span className="block break-words text-sm font-medium text-ink-1">{item.name}</span>
                  <span className="block truncate text-xs text-ink-3">{warehouseName}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-mono text-sm font-semibold tabular-figures text-ink-1">
                    {item.stock} {item.inventoryUnit}
                  </span>
                  <span className="block font-mono text-2xs text-ink-3 tabular-figures">
                    {uiText("mínimo ")}{item.minimumStock} {item.inventoryUnit}
                  </span>
                </span>
                <StatusBadge size="sm" tone="danger" label={uiText("Bajo mínimo")} />
              </li>
            ))}
          </ul>
        </PageSection>
      ) : null}

      {vencimientos.length > 0 ? (
        <PageSection
          title={uiText("Lotes próximos a vencer")}
          description={uiText("Registra la merma o dales salida antes de perder el producto.")}
          id="vencimientos"
          actions={
            <Button asChild variant="secondary" size="sm">
              <Link href="/inventory/restaurant/lots?filter=7">{uiText("Ver todos")}</Link>
            </Button>
          }
        >
          <ul className="space-y-1">
            {vencimientos.slice(0, MAX_ALERTAS).map((lote) => (
              <li
                key={`${lote.name}-${lote.lot}`}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border border-line bg-surface-1 px-4 py-3"
              >
                <span className="min-w-0 flex-1 basis-40">
                  <span className="block break-words text-sm font-medium text-ink-1">{lote.name}</span>
                  <span className="block truncate font-mono text-xs text-ink-3">{uiText("Lote ")}{lote.lot}</span>
                </span>
                <span className="shrink-0 font-mono text-sm tabular-figures text-ink-1">{lote.quantity}</span>
                <StatusBadge size="sm" tone="warning" label={uiText("Vence {{date}}", { date: fechaCorta(lote.expiresAt, locale) })} />
              </li>
            ))}
          </ul>
        </PageSection>
      ) : null}

      {/* Las cinco operaciones del día vivían aquí, y SOLO aquí: quien entraba
          por «Existencias» no las veía nunca. Ahora son la barra del módulo
          (`restaurant-actions.tsx`), que se pinta encima de todas sus
          pantallas. Repetirlas aquí volvería a apilar dos rejillas de lo
          mismo en la primera pantalla. */}

      {/* ---- 5. A dónde va el producto ----------------------------------
          Solo si se puede ver dinero: sin `commercial.view` estas dos cifras
          no se enseñan en ninguna parte del panel, y un gráfico de importes
          sería la puerta de atrás a lo mismo. */}
      {puedeVerValor && datos && salidaTotal > 0 ? (
        <ChartCard
          title={uiText("A dónde va el producto")}
          subtitle={uiText("De todo lo que salió del almacén, cuánto se cocinó y cuánto se tiró")}
          period={warehouseName}
        >
          <BarChart
            orientation="horizontal"
            categories={reparto.map((fila) => fila.label)}
            series={[{ id: "salida", name: uiText("Importe"), values: reparto.map((fila) => fila.value) }]}
            categoryColorClasses={reparto.map((fila) => fila.color)}
            caption={uiText("Reparto de la salida del periodo entre consumo y merma")}
            categoryLabel={uiText("Destino")}
            formatValue={(valor) => formatoMoneda(valor, locale)}
          />
          <p className="mt-4 border-t border-line pt-3 text-2xs leading-5 text-ink-3">
            {uiText("El porcentaje de merma se calcula sobre la salida total del periodo —lo consumido más lo tirado—, no sobre el consumo.")}
          </p>
        </ChartCard>
      ) : null}

      {/* ---- 6. Tendencia ------------------------------------------------
          Barras y no líneas: `consumptionTrend` compara periodos cerrados,
          que son categorías, no una serie continua. */}
      <ChartCard
        title={uiText("Consumo por periodo")}
        subtitle={uiText("Cuánto se consumió en cada periodo cerrado, para ver si el gasto se mueve.")}
        period={warehouseName}
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void avanzado.refetch()}
              disabled={avanzado.isFetching}
            >
              <RefreshCw
                className={`size-4 ${avanzado.isFetching ? "animate-spin motion-reduce:animate-none" : ""}`}
                aria-hidden="true"
              />
              {avanzado.isFetching ? uiText("Actualizando…") : uiText("Actualizar")}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                exportarCsv("inventario-restaurante.csv", [
                  ["Indicador", "Valor"],
                  ["Valor del inventario", datos?.inventoryValue ?? ""],
                  ["Consumo del periodo", datos?.periodConsumption ?? ""],
                  ["Merma", datos?.waste ?? ""],
                  ["Diferencia de conteo", datos?.inventoryDifference ?? ""],
                ])
              }
              disabled={!datos}
            >
              <Download className="size-4" aria-hidden="true" />
              CSV
            </Button>
          </div>
        }
      >
        {avanzado.isLoading ? (
          <ChartSkeleton label={uiText("Cargando el consumo del periodo")} />
        ) : avanzado.isError ? (
          <InlineNote tone="warning" title={uiText("No fue posible cargar la tendencia")}>
            {uiText("El resto del panel sigue siendo válido. Vuelve a cargar para reintentarlo.")}</InlineNote>
        ) : (
          <BarChart
            categories={tendencia.map((punto) => punto.label)}
            series={[
              {
                id: "consumo",
                name: uiText("Consumo"),
                values: tendencia.map((punto) => punto.value),
              },
            ]}
            categoryLabel={uiText("Periodo")}
            caption={uiText("Consumo registrado en cada periodo cerrado del almacén activo.")}
            formatValue={(valor) => formatoMoneda(valor, locale)}
            emptyReason="sin-registros"
          />
        )}
      </ChartCard>
    </div>
  );
}

/* ============================== Auxiliares ============================== */

function agruparPorDia(puntos: Array<{ label: string; value: number }>, locale: string) {
  const porDia = new Map<string, number>();
  for (const punto of puntos) porDia.set(punto.label, (porDia.get(punto.label) ?? 0) + punto.value);
  return [...porDia.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([label, value]) => ({ label: fechaCorta(label, locale), value }));
}

/**
 * «2026-09-01T05:22:36.580Z» → «1 sept 2026». Si no es fecha, se deja tal cual.
 *
 * El idioma es un argumento: estaba fijado a `"es"`, así que en inglés la
 * pantalla seguía diciendo «1 sept 2026».
 */
function fechaCorta(valor: string, locale: string) {
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(fecha);
}

/**
 * Importes y cifras en el idioma de la APLICACIÓN, no el del navegador.
 *
 * `undefined` como locale delega en el idioma del sistema, así que alguien
 * con la aplicación en inglés y el navegador en español veía «5.480,20 US$»
 * en medio de una pantalla en inglés. La divisa sigue cableada a USD porque
 * el backend no la entrega; adivinarla sería peor que asumirla.
 */
function formatoMoneda(valor: number, locale: string) {
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(valor);
}

function formatoNumero(valor: number, locale: string) {
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-US", { maximumFractionDigits: 2 }).format(valor);
}

function exportarCsv(nombre: string, filas: unknown[][]) {
  const csv = filas
    .map((fila) => fila.map((valor) => `"${String(valor ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = nombre;
  anchor.click();
  URL.revokeObjectURL(url);
}
