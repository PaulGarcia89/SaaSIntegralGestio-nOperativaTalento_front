"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  CHART_MARGIN,
  ChartEmpty,
  ChartFrame,
  ChartTooltip,
  chartHeightFor,
  maxXTicksFor,
  plotArea,
  reduceTicks,
  safeId,
  seriesColorClass,
  seriesDash,
  useChartWidth,
  type ChartAxisTick,
  type ChartEmptyReason,
  type ChartLegendEntry,
  type ChartTable,
  type ChartTooltipRow,
} from "./chart-frame";
import {
  buildAreaPath,
  buildLinePath,
  describeSeries,
  downsample,
  formatCompact,
  formatNumber,
  linearScale,
  niceTicks,
  type ChartPoint,
} from "./scales";

/**
 * Gráfico de líneas y de área, hasta cinco series.
 *
 * Cada serie se distingue por color, por patrón de trazo y —cuando hay sitio—
 * por una etiqueta directa al final de la línea, de modo que el gráfico sigue
 * siendo legible en escala de grises y para quien no distingue los colores.
 */

export type LineChartSeries = {
  readonly id: string;
  readonly name: string;
  readonly points: readonly ChartPoint[];
  /** `area` añade el relleno degradado bajo la línea. */
  readonly variant?: "line" | "area";
};

export type LineChartProps = {
  series: readonly LineChartSeries[];
  /** Qué mide el gráfico. Encabeza el resumen textual. */
  caption?: string;
  /** Nombre de la columna de categorías en la tabla de respaldo. */
  xLabel?: string;
  formatValue?: (value: number) => string;
  formatX?: (value: number) => string;
  emptyReason?: ChartEmptyReason;
  emptyAction?: React.ReactNode;
  className?: string;
};

/** Cinco series es el límite legible; a partir de ahí el gráfico es un ovillo. */
const MAX_SERIES = 5;

/** Con menos de 40 puntos el punto se ve; con más, ensucia la línea. */
const MAX_PUNTOS_VISIBLES = 40;

export function LineChart({
  series,
  caption,
  xLabel = "Periodo",
  formatValue = formatCompact,
  formatX,
  emptyReason = "sin-registros",
  emptyAction,
  className,
}: LineChartProps) {
  const { ref, width } = useChartWidth();
  const idBase = safeId(React.useId());
  const [indiceRaton, setIndiceRaton] = React.useState<number | null>(null);
  const [indiceFoco, setIndiceFoco] = React.useState<number | null>(null);
  const columnasRef = React.useRef<(SVGGElement | null)[]>([]);

  const utiles = series
    .slice(0, MAX_SERIES)
    .filter((serie) => serie.points.some((punto) => Number.isFinite(punto.x) && Number.isFinite(punto.y)));

  if (utiles.length === 0) {
    return (
      <div ref={ref} className={cn("min-w-0", className)}>
        <ChartEmpty reason={emptyReason} action={emptyAction} height={chartHeightFor(width)} />
      </div>
    );
  }

  const height = chartHeightFor(width);
  const etiquetasDirectas = width >= 560;
  const margen = { ...CHART_MARGIN, right: etiquetasDirectas ? 96 : CHART_MARGIN.right };
  const area = plotArea(width, height, margen);

  // Muestreo: un `path` de mil vértices y sus círculos bloquean el repintado.
  const maxPuntos = Math.min(400, Math.max(24, Math.floor(area.innerWidth / 3)));
  const reducidas = utiles.map((serie) => ({ ...serie, points: downsample(serie.points, maxPuntos) }));

  // Eje horizontal común: la unión de las x de todas las series.
  const ejeX = [...new Set(reducidas.flatMap((serie) => serie.points.map((punto) => punto.x)))]
    .filter((valor) => Number.isFinite(valor))
    .sort((a, b) => a - b);

  const porX = reducidas.map((serie) => {
    const mapa = new Map<number, ChartPoint>();
    for (const punto of serie.points) if (Number.isFinite(punto.x)) mapa.set(punto.x, punto);
    return mapa;
  });

  const etiquetaDeX = (x: number): string => {
    for (const mapa of porX) {
      const punto = mapa.get(x);
      if (punto?.label) return punto.label;
    }
    return formatX ? formatX(x) : formatNumber(x);
  };

  const valores = reducidas.flatMap((serie) => serie.points.map((punto) => punto.y)).filter((valor) => Number.isFinite(valor));
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);
  const marcasY = niceTicks(minimo, maximo, 5);
  const dominioY: [number, number] = [
    Math.min(minimo, marcasY.length > 0 ? marcasY[0] : minimo),
    Math.max(maximo, marcasY.length > 0 ? marcasY[marcasY.length - 1] : maximo),
  ];

  const escalaX = linearScale({ domain: [ejeX[0], ejeX[ejeX.length - 1]], range: [area.left, area.right] });
  const escalaY = linearScale({ domain: dominioY, range: [area.bottom, area.top] });

  const marcasEjeX: ChartAxisTick[] = reduceTicks(ejeX, maxXTicksFor(width)).map((x) => ({
    position: escalaX(x),
    label: etiquetaDeX(x),
  }));
  const marcasEjeY: ChartAxisTick[] = marcasY.map((valor) => ({ position: escalaY(valor), label: formatValue(valor) }));

  const activo = indiceRaton ?? indiceFoco;
  const xActiva = activo !== null && activo >= 0 && activo < ejeX.length ? ejeX[activo] : null;

  const leyenda: ChartLegendEntry[] = reducidas.map((serie, indice) => ({
    id: serie.id,
    label: serie.name,
    colorClassName: seriesColorClass(indice),
    dash: seriesDash(indice),
    shape: "line",
  }));

  const tabla: ChartTable = {
    caption: caption ?? "Datos representados en el gráfico de líneas",
    headers: [xLabel, ...reducidas.map((serie) => serie.name)],
    rows: ejeX.map((x) => ({
      key: `fila-${x}`,
      cells: [
        etiquetaDeX(x),
        ...porX.map((mapa) => {
          const punto = mapa.get(x);
          return punto && Number.isFinite(punto.y) ? formatValue(punto.y) : "sin dato";
        }),
      ],
    })),
  };

  const resumen = [
    caption ? `${caption}.` : null,
    `Gráfico de líneas con ${reducidas.length} ${reducidas.length === 1 ? "serie" : "series"} y ${ejeX.length} ${ejeX.length === 1 ? "punto" : "puntos"} en el eje horizontal, de ${etiquetaDeX(ejeX[0])} a ${etiquetaDeX(ejeX[ejeX.length - 1])}.`,
    ...reducidas.map((serie) => describeSeries(serie.name, serie.points, formatValue)),
  ]
    .filter(Boolean)
    .join(" ");

  const indiceMasCercano = (pixelX: number): number => {
    let mejor = 0;
    let distancia = Number.POSITIVE_INFINITY;
    ejeX.forEach((x, indice) => {
      const separacion = Math.abs(escalaX(x) - pixelX);
      if (separacion < distancia) {
        distancia = separacion;
        mejor = indice;
      }
    });
    return mejor;
  };

  const moverFoco = (destino: number) => {
    const acotado = Math.max(0, Math.min(ejeX.length - 1, destino));
    setIndiceFoco(acotado);
    columnasRef.current[acotado]?.focus();
  };

  const filasGlobo = (indice: number): ChartTooltipRow[] =>
    reducidas.map((serie, posicion) => {
      const punto = porX[posicion].get(ejeX[indice]);
      return {
        id: serie.id,
        label: serie.name,
        value: punto && Number.isFinite(punto.y) ? formatValue(punto.y) : "sin dato",
        colorClassName: seriesColorClass(posicion),
        dash: seriesDash(posicion),
      };
    });

  const descripcionPunto = (indice: number): string =>
    `${etiquetaDeX(ejeX[indice])}: ${filasGlobo(indice)
      .map((fila) => `${fila.label} ${fila.value}`)
      .join("; ")}`;

  const anchoColumna = ejeX.length > 1 ? area.innerWidth / (ejeX.length - 1) : area.innerWidth;

  return (
    <div ref={ref} className={cn("min-w-0", className)}>
      <ChartFrame
        width={width}
        height={height}
        margin={margen}
        xTicks={marcasEjeX}
        yTicks={marcasEjeY}
        summary={resumen}
        legend={leyenda}
        table={tabla}
        svgProps={{
          onMouseMove: (evento) => {
            const caja = evento.currentTarget.getBoundingClientRect();
            setIndiceRaton(indiceMasCercano(evento.clientX - caja.left));
          },
          onMouseLeave: () => setIndiceRaton(null),
        }}
        overlay={
          activo !== null ? (
            <ChartTooltip
              title={etiquetaDeX(ejeX[activo])}
              rows={filasGlobo(activo)}
              x={escalaX(ejeX[activo])}
              containerWidth={width}
            />
          ) : null
        }
      >
        {/* Cursor vertical: marca el instante que se está leyendo. */}
        {xActiva !== null ? (
          <line
            x1={escalaX(xActiva)}
            x2={escalaX(xActiva)}
            y1={area.top}
            y2={area.bottom}
            stroke="currentColor"
            strokeWidth={1}
            className="text-line-strong"
            shapeRendering="crispEdges"
            aria-hidden="true"
          />
        ) : null}

        {reducidas.map((serie, indice) => {
          const puntos = serie.points.map((punto) => ({
            x: escalaX(punto.x),
            y: escalaY(punto.y),
            label: punto.label,
          }));
          const idDegradado = `${idBase}-area-${indice}`;
          const ultimoValido = [...serie.points].reverse().find((punto) => Number.isFinite(punto.y));
          const mostrarPuntos = serie.points.length < MAX_PUNTOS_VISIBLES;

          return (
            <g key={serie.id} className={seriesColorClass(indice)}>
              {serie.variant === "area" ? (
                <>
                  <defs>
                    {/* El degradado se construye con `currentColor`: el color
                        sale del token de la serie y cambia solo con el tema. */}
                    <linearGradient id={idDegradado} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="currentColor" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <path d={buildAreaPath(puntos, area.bottom)} fill={`url(#${idDegradado})`} stroke="none" />
                </>
              ) : null}

              <path
                d={buildLinePath(puntos)}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeDasharray={seriesDash(indice)}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {mostrarPuntos
                ? puntos.map((punto, posicion) =>
                    Number.isFinite(punto.x) && Number.isFinite(punto.y) ? (
                      <circle
                        key={`${serie.id}-p-${posicion}`}
                        cx={punto.x}
                        cy={punto.y}
                        r={2.5}
                        fill="currentColor"
                      />
                    ) : null,
                  )
                : null}

              {/* Punto resaltado del instante activo: un halo del color de la
                  superficie lo separa de la línea, y el relleno conserva el
                  color de la serie. */}
              {xActiva !== null && Number.isFinite(escalaY(porX[indice].get(xActiva)?.y ?? Number.NaN)) ? (
                <>
                  <circle
                    cx={escalaX(xActiva)}
                    cy={escalaY(porX[indice].get(xActiva)?.y ?? Number.NaN)}
                    r={5.5}
                    fill="currentColor"
                    className="text-surface-1"
                  />
                  <circle
                    cx={escalaX(xActiva)}
                    cy={escalaY(porX[indice].get(xActiva)?.y ?? Number.NaN)}
                    r={3.5}
                    fill="currentColor"
                  />
                </>
              ) : null}

              {/* Etiqueta directa al final de la línea: leer la leyenda obliga a
                  ir y volver con la vista; esto no. */}
              {etiquetasDirectas && ultimoValido ? (
                <text
                  x={escalaX(ultimoValido.x) + 8}
                  y={escalaY(ultimoValido.y)}
                  dominantBaseline="middle"
                  fill="currentColor"
                  className="text-2xs font-medium"
                >
                  {serie.name.length > 12 ? `${serie.name.slice(0, 11)}…` : serie.name}
                </text>
              ) : null}
            </g>
          );
        })}

        {/* Zonas focalizables: una por punto del eje. Teclado y ratón muestran
            exactamente el mismo detalle. */}
        <g>
          {ejeX.map((x, indice) => (
            <g
              key={`zona-${x}`}
              ref={(nodo) => {
                columnasRef.current[indice] = nodo;
              }}
              role="graphics-symbol"
              aria-label={descripcionPunto(indice)}
              tabIndex={indice === (indiceFoco ?? 0) ? 0 : -1}
              onFocus={() => setIndiceFoco(indice)}
              onBlur={() => setIndiceFoco((previo) => (previo === indice ? null : previo))}
              onKeyDown={(evento) => {
                if (evento.key === "ArrowRight") {
                  evento.preventDefault();
                  moverFoco(indice + 1);
                } else if (evento.key === "ArrowLeft") {
                  evento.preventDefault();
                  moverFoco(indice - 1);
                } else if (evento.key === "Home") {
                  evento.preventDefault();
                  moverFoco(0);
                } else if (evento.key === "End") {
                  evento.preventDefault();
                  moverFoco(ejeX.length - 1);
                }
              }}
              className="outline-offset-2"
            >
              {/* El foco se dibuja además dentro del SVG: el contorno del
                  navegador sobre un `<g>` no es fiable en todos ellos. */}
              <rect
                x={escalaX(x) - anchoColumna / 2}
                y={area.top}
                width={anchoColumna}
                height={area.innerHeight}
                fill="transparent"
                stroke={indiceFoco === indice ? "currentColor" : "none"}
                strokeWidth={2}
                className={indiceFoco === indice ? "text-focus" : undefined}
              />
            </g>
          ))}
        </g>
      </ChartFrame>
    </div>
  );
}
