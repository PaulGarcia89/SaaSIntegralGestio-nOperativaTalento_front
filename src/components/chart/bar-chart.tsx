"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  CHART_MARGIN,
  ChartEmpty,
  ChartFrame,
  ChartTooltip,
  SeriesPattern,
  chartHeightFor,
  maxXTicksFor,
  plotArea,
  reduceTicks,
  safeId,
  seriesColorClass,
  seriesFill,
  useChartWidth,
  type ChartAxisTick,
  type ChartEmptyReason,
  type ChartLegendEntry,
  type ChartTable,
  type ChartTooltipRow,
} from "./chart-frame";
import { bandScale, formatCompact, linearScale, niceTicks } from "./scales";

/**
 * Gráfico de barras: vertical, agrupado y apilado.
 *
 * En un teléfono, ocho categorías verticales dejan etiquetas de tres letras
 * giradas 45°; por eso, a partir de ahí, el gráfico se pasa solo a barras
 * horizontales, que es la orientación que de verdad funciona en pantalla
 * estrecha: la etiqueta se lee en horizontal y la longitud sigue comparándose
 * de un vistazo.
 */

export type BarChartSeries = {
  readonly id: string;
  readonly name: string;
  /** Un valor por categoría, en el mismo orden que `categories`. */
  readonly values: readonly number[];
};

export type BarChartProps = {
  categories: readonly string[];
  series: readonly BarChartSeries[];
  /** `stacked` acumula las series; `grouped` las pone una al lado de la otra. */
  mode?: "grouped" | "stacked";
  caption?: string;
  categoryLabel?: string;
  formatValue?: (value: number) => string;
  emptyReason?: ChartEmptyReason;
  emptyAction?: React.ReactNode;
  /** Fuerza la orientación en lugar de decidirla por el ancho disponible. */
  orientation?: "vertical" | "horizontal";
  className?: string;
};

const MAX_SERIES = 5;

/** A partir de aquí, en pantalla estrecha, las barras se tumban. */
const CATEGORIAS_PARA_TUMBAR = 8;

/** Alto reservado por barra cuando el gráfico es horizontal. */
const ALTO_POR_CATEGORIA = 30;

const valorSeguro = (valor: number | undefined): number => (Number.isFinite(valor) ? (valor as number) : 0);

export function BarChart({
  categories,
  series,
  mode = "grouped",
  caption,
  categoryLabel = "Categoría",
  formatValue = formatCompact,
  emptyReason = "sin-registros",
  emptyAction,
  orientation,
  className,
}: BarChartProps) {
  const { ref, width } = useChartWidth();
  const idBase = safeId(React.useId());
  const [indiceRaton, setIndiceRaton] = React.useState<number | null>(null);
  const [indiceFoco, setIndiceFoco] = React.useState<number | null>(null);
  const zonasRef = React.useRef<(SVGGElement | null)[]>([]);

  const utiles = series.slice(0, MAX_SERIES).filter((serie) => serie.values.some((valor) => Number.isFinite(valor)));

  if (categories.length === 0 || utiles.length === 0) {
    return (
      <div ref={ref} className={cn("min-w-0", className)}>
        <ChartEmpty reason={emptyReason} action={emptyAction} height={chartHeightFor(width)} />
      </div>
    );
  }

  const horizontal =
    orientation === "horizontal" ||
    (orientation === undefined && categories.length > CATEGORIAS_PARA_TUMBAR && width < 640);

  const apilado = mode === "stacked";

  // Totales y extremos. En apilado los negativos no tienen lectura posible, así
  // que se tratan como cero y se avisa en la tabla con el valor real.
  const totales = categories.map((_, indice) =>
    utiles.reduce((suma, serie) => suma + Math.max(0, valorSeguro(serie.values[indice])), 0),
  );
  const planos = utiles.flatMap((serie) => serie.values.filter((valor) => Number.isFinite(valor)));
  const minimo = apilado ? 0 : Math.min(0, ...planos);
  const maximo = apilado ? Math.max(...totales, 0) : Math.max(...planos, 0);

  const marcasValor = niceTicks(minimo, maximo, 5);
  const dominioValor: [number, number] = [
    Math.min(minimo, marcasValor.length > 0 ? marcasValor[0] : minimo),
    Math.max(maximo, marcasValor.length > 0 ? marcasValor[marcasValor.length - 1] : maximo),
  ];

  const margen = horizontal
    ? { top: 12, right: 20, bottom: 30, left: Math.min(140, Math.max(88, Math.round(width * 0.32))) }
    : CHART_MARGIN;
  const height = horizontal
    ? Math.max(chartHeightFor(width), categories.length * ALTO_POR_CATEGORIA + margen.top + margen.bottom)
    : chartHeightFor(width);
  const area = plotArea(width, height, margen);

  const escalaCategoria = bandScale({
    domain: categories,
    range: horizontal ? [area.top, area.bottom] : [area.left, area.right],
    padding: 0.28,
  });
  const escalaValor = linearScale({
    domain: dominioValor,
    range: horizontal ? [area.left, area.right] : [area.bottom, area.top],
  });

  const anchoBanda = escalaCategoria.bandwidth();
  const anchoSubbarra = apilado ? anchoBanda : anchoBanda / utiles.length;
  const cero = escalaValor(0);

  const marcasValorEje: ChartAxisTick[] = marcasValor.map((valor) => ({
    position: escalaValor(valor),
    label: formatValue(valor),
  }));
  const marcasCategoria: ChartAxisTick[] = reduceTicks(
    categories.map((categoria) => ({ position: escalaCategoria.center(categoria), label: categoria })),
    horizontal ? categories.length : maxXTicksFor(width),
  );

  const activo = indiceRaton ?? indiceFoco;

  const leyenda: ChartLegendEntry[] = utiles.map((serie, indice) => ({
    id: serie.id,
    label: serie.name,
    colorClassName: seriesColorClass(indice),
    shape: "bar",
    patternIndex: indice,
  }));

  const tabla: ChartTable = {
    caption: caption ?? "Datos representados en el gráfico de barras",
    headers: [categoryLabel, ...utiles.map((serie) => serie.name), ...(apilado ? ["Total"] : [])],
    rows: categories.map((categoria, indice) => ({
      key: `fila-${categoria}`,
      cells: [
        categoria,
        ...utiles.map((serie) =>
          Number.isFinite(serie.values[indice]) ? formatValue(serie.values[indice]) : "sin dato",
        ),
        ...(apilado ? [formatValue(totales[indice])] : []),
      ],
    })),
  };

  const mayor = totales.indexOf(Math.max(...totales));
  const resumen = [
    caption ? `${caption}.` : null,
    `Gráfico de barras ${horizontal ? "horizontales" : "verticales"}${apilado ? " apiladas" : ""} con ${categories.length} categorías y ${utiles.length} ${utiles.length === 1 ? "serie" : "series"}.`,
    `Los valores van de ${formatValue(minimo)} a ${formatValue(maximo)}.`,
    categories.length > 0
      ? `La categoría con más peso es ${categories[mayor]}, con ${formatValue(totales[mayor])}.`
      : null,
    ...utiles.map(
      (serie) =>
        `${serie.name}: ${categories
          .map((categoria, indice) => `${categoria} ${formatValue(valorSeguro(serie.values[indice]))}`)
          .join(", ")}.`,
    ),
  ]
    .filter(Boolean)
    .join(" ");

  const filasGlobo = (indice: number): ChartTooltipRow[] =>
    utiles.map((serie, posicion) => ({
      id: serie.id,
      label: serie.name,
      value: Number.isFinite(serie.values[indice]) ? formatValue(serie.values[indice]) : "sin dato",
      colorClassName: seriesColorClass(posicion),
    }));

  const descripcionCategoria = (indice: number): string =>
    `${categories[indice]}: ${filasGlobo(indice)
      .map((fila) => `${fila.label} ${fila.value}`)
      .join("; ")}${apilado ? `. Total ${formatValue(totales[indice])}` : ""}`;

  const moverFoco = (destino: number) => {
    const acotado = Math.max(0, Math.min(categories.length - 1, destino));
    setIndiceFoco(acotado);
    zonasRef.current[acotado]?.focus();
  };

  const indiceMasCercano = (pixel: number): number => {
    let mejor = 0;
    let distancia = Number.POSITIVE_INFINITY;
    categories.forEach((categoria, indice) => {
      const separacion = Math.abs(escalaCategoria.center(categoria) - pixel);
      if (separacion < distancia) {
        distancia = separacion;
        mejor = indice;
      }
    });
    return mejor;
  };

  /** Geometría de una barra concreta, en coordenadas del viewBox. */
  const rectangulo = (indiceSerie: number, indiceCategoria: number) => {
    const categoria = categories[indiceCategoria];
    const inicioBanda = escalaCategoria(categoria);
    const valor = valorSeguro(utiles[indiceSerie].values[indiceCategoria]);

    if (apilado) {
      const previos = utiles
        .slice(0, indiceSerie)
        .reduce((suma, serie) => suma + Math.max(0, valorSeguro(serie.values[indiceCategoria])), 0);
      const desde = escalaValor(previos);
      const hasta = escalaValor(previos + Math.max(0, valor));
      return horizontal
        ? { x: Math.min(desde, hasta), y: inicioBanda, width: Math.abs(hasta - desde), height: anchoBanda }
        : { x: inicioBanda, y: Math.min(desde, hasta), width: anchoBanda, height: Math.abs(hasta - desde) };
    }

    const extremo = escalaValor(valor);
    return horizontal
      ? {
          x: Math.min(cero, extremo),
          y: inicioBanda + indiceSerie * anchoSubbarra,
          width: Math.abs(extremo - cero),
          height: anchoSubbarra,
        }
      : {
          x: inicioBanda + indiceSerie * anchoSubbarra,
          y: Math.min(cero, extremo),
          width: anchoSubbarra,
          height: Math.abs(extremo - cero),
        };
  };

  return (
    <div ref={ref} className={cn("min-w-0", className)}>
      <ChartFrame
        width={width}
        height={height}
        margin={margen}
        xTicks={horizontal ? marcasValorEje : marcasCategoria}
        yTicks={horizontal ? marcasCategoria : marcasValorEje}
        showGrid={!horizontal}
        summary={resumen}
        legend={utiles.length > 1 ? leyenda : undefined}
        table={tabla}
        svgProps={{
          onMouseMove: (evento) => {
            const caja = evento.currentTarget.getBoundingClientRect();
            setIndiceRaton(
              indiceMasCercano(horizontal ? evento.clientY - caja.top : evento.clientX - caja.left),
            );
          },
          onMouseLeave: () => setIndiceRaton(null),
        }}
        overlay={
          activo !== null ? (
            <ChartTooltip
              title={categories[activo]}
              rows={filasGlobo(activo)}
              x={horizontal ? area.right : escalaCategoria.center(categories[activo])}
              y={horizontal ? escalaCategoria.center(categories[activo]) : 8}
              containerWidth={width}
            />
          ) : null
        }
      >
        {/* En horizontal la rejilla del valor es vertical: es el mismo eje, solo
            que tumbado. */}
        {horizontal
          ? marcasValorEje.map((marca) => (
              <line
                key={`rejilla-v-${marca.label}`}
                x1={marca.position}
                x2={marca.position}
                y1={area.top}
                y2={area.bottom}
                stroke="currentColor"
                strokeWidth={1}
                shapeRendering="crispEdges"
                className="text-grid"
                aria-hidden="true"
              />
            ))
          : null}

        {utiles.map((serie, indiceSerie) => {
          const idPatron = `${idBase}-patron-${indiceSerie}`;
          return (
            <g key={serie.id} className={seriesColorClass(indiceSerie)}>
              <defs>
                <SeriesPattern id={idPatron} index={indiceSerie} />
              </defs>
              {categories.map((categoria, indiceCategoria) => {
                const caja = rectangulo(indiceSerie, indiceCategoria);
                if (!Number.isFinite(caja.x) || !Number.isFinite(caja.y)) return null;
                return (
                  <rect
                    key={`${serie.id}-${categoria}`}
                    x={caja.x}
                    y={caja.y}
                    width={Math.max(0, caja.width)}
                    height={Math.max(0, caja.height)}
                    fill={seriesFill(indiceSerie, idPatron)}
                    opacity={activo === null || activo === indiceCategoria ? 1 : 0.55}
                  />
                );
              })}
            </g>
          );
        })}

        {/* Cifra sobre la barra cuando hay una sola serie: el número exacto sin
            pasar por el globo ni por la tabla. */}
        {utiles.length === 1
          ? categories.map((categoria, indice) => {
              const caja = rectangulo(0, indice);
              const valor = valorSeguro(utiles[0].values[indice]);
              if (!Number.isFinite(caja.x)) return null;
              return horizontal ? (
                <text
                  key={`cifra-${categoria}`}
                  x={caja.x + caja.width + 6}
                  y={caja.y + caja.height / 2}
                  dominantBaseline="middle"
                  fill="currentColor"
                  className="font-mono text-2xs text-ink-2 tabular-figures"
                >
                  {formatValue(valor)}
                </text>
              ) : anchoBanda >= 22 ? (
                <text
                  key={`cifra-${categoria}`}
                  x={caja.x + caja.width / 2}
                  y={caja.y - 6}
                  textAnchor="middle"
                  fill="currentColor"
                  className="font-mono text-2xs text-ink-2 tabular-figures"
                >
                  {formatValue(valor)}
                </text>
              ) : null;
            })
          : null}

        {/* Zona focalizable por categoría: teclado y ratón dan el mismo detalle. */}
        <g>
          {categories.map((categoria, indice) => {
            const inicio = escalaCategoria(categoria);
            const paso = escalaCategoria.step();
            return (
              <g
                key={`zona-${categoria}`}
                ref={(nodo) => {
                  zonasRef.current[indice] = nodo;
                }}
                role="graphics-symbol"
                aria-label={descripcionCategoria(indice)}
                tabIndex={indice === (indiceFoco ?? 0) ? 0 : -1}
                onFocus={() => setIndiceFoco(indice)}
                onBlur={() => setIndiceFoco((previo) => (previo === indice ? null : previo))}
                onKeyDown={(evento) => {
                  if (evento.key === "ArrowRight" || evento.key === "ArrowDown") {
                    evento.preventDefault();
                    moverFoco(indice + 1);
                  } else if (evento.key === "ArrowLeft" || evento.key === "ArrowUp") {
                    evento.preventDefault();
                    moverFoco(indice - 1);
                  } else if (evento.key === "Home") {
                    evento.preventDefault();
                    moverFoco(0);
                  } else if (evento.key === "End") {
                    evento.preventDefault();
                    moverFoco(categories.length - 1);
                  }
                }}
              >
                {/* El foco se dibuja dentro del SVG: el contorno del navegador
                    sobre un `<g>` no es fiable en todos ellos. */}
                <rect
                  x={horizontal ? area.left : inicio - (paso - anchoBanda) / 2}
                  y={horizontal ? inicio - (paso - anchoBanda) / 2 : area.top}
                  width={horizontal ? area.innerWidth : paso}
                  height={horizontal ? paso : area.innerHeight}
                  fill="transparent"
                  stroke={indiceFoco === indice ? "currentColor" : "none"}
                  strokeWidth={2}
                  className={indiceFoco === indice ? "text-focus" : undefined}
                />
              </g>
            );
          })}
        </g>
      </ChartFrame>
    </div>
  );
}
