"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  ChartEmpty,
  ChartFrame,
  SeriesPattern,
  safeId,
  seriesColorClass,
  seriesFill,
  useChartWidth,
  type ChartEmptyReason,
  type ChartTable,
} from "./chart-frame";
import { formatCompact, formatPercent } from "./scales";

/**
 * Embudo de conversión.
 *
 * Cada etapa lleva su nombre y su cifra escritos: la anchura de la banda es un
 * apoyo, no el dato. Entre etapas se escribe el porcentaje que sobrevive, y la
 * mayor caída se marca con `status-warning` porque es la única lectura
 * accionable del gráfico —dónde se está perdiendo a la gente—.
 */

export type FunnelStage = {
  readonly id: string;
  readonly name: string;
  readonly value: number;
};

export type FunnelChartProps = {
  stages: readonly FunnelStage[];
  caption?: string;
  stageLabel?: string;
  formatValue?: (value: number) => string;
  emptyReason?: ChartEmptyReason;
  emptyAction?: React.ReactNode;
  className?: string;
};

/** Alto de cada etapa: banda, rótulo y hueco para el salto de conversión. */
const ALTO_ETAPA = 62;
const ALTO_BANDA = 22;

export function FunnelChart({
  stages,
  caption,
  stageLabel = "Etapa",
  formatValue = formatCompact,
  emptyReason = "sin-registros",
  emptyAction,
  className,
}: FunnelChartProps) {
  const { ref, width } = useChartWidth();
  const idBase = safeId(React.useId());
  const [indiceFoco, setIndiceFoco] = React.useState<number | null>(null);
  const zonasRef = React.useRef<(SVGGElement | null)[]>([]);

  const utiles = stages.filter((etapa) => Number.isFinite(etapa.value));

  if (utiles.length === 0) {
    return (
      <div ref={ref} className={cn("min-w-0", className)}>
        <ChartEmpty reason={emptyReason} action={emptyAction} height={200} />
      </div>
    );
  }

  const margen = { top: 8, right: 8, bottom: 8, left: 8 };
  const height = utiles.length * ALTO_ETAPA + margen.top + margen.bottom;
  const anchoUtil = Math.max(1, width - margen.left - margen.right);
  const centro = margen.left + anchoUtil / 2;
  const referencia = Math.max(...utiles.map((etapa) => Math.max(0, etapa.value)), 1);

  /** Conversión respecto a la etapa anterior, en porcentaje. */
  const conversiones = utiles.map((etapa, indice) => {
    if (indice === 0) return null;
    const previa = utiles[indice - 1].value;
    if (previa <= 0) return null;
    return (etapa.value / previa) * 100;
  });

  // La mayor caída: el punto donde más gente se queda por el camino.
  let peorIndice = -1;
  let peorCaida = -1;
  conversiones.forEach((conversion, indice) => {
    if (conversion === null) return;
    const caida = 100 - conversion;
    if (caida > peorCaida) {
      peorCaida = caida;
      peorIndice = indice;
    }
  });
  const hayDescalabro = peorIndice > 0 && peorCaida > 0;

  const tabla: ChartTable = {
    caption: caption ?? "Etapas del embudo de conversión",
    headers: [stageLabel, "Valor", "Conversión respecto a la etapa anterior", "Sobre el total"],
    rows: utiles.map((etapa, indice) => ({
      key: etapa.id,
      cells: [
        etapa.name,
        formatValue(etapa.value),
        conversiones[indice] === null ? "—" : formatPercent(conversiones[indice] as number, 1),
        utiles[0].value > 0 ? formatPercent((etapa.value / utiles[0].value) * 100, 1) : "—",
      ],
    })),
  };

  const resumen = [
    caption ? `${caption}.` : null,
    `Embudo de ${utiles.length} etapas. Empieza en ${utiles[0].name} con ${formatValue(utiles[0].value)} y termina en ${utiles[utiles.length - 1].name} con ${formatValue(utiles[utiles.length - 1].value)}.`,
    utiles[0].value > 0
      ? `La conversión total es del ${formatPercent((utiles[utiles.length - 1].value / utiles[0].value) * 100, 1)}.`
      : null,
    hayDescalabro
      ? `La mayor caída ocurre entre ${utiles[peorIndice - 1].name} y ${utiles[peorIndice].name}: se pierde el ${formatPercent(peorCaida, 1)}.`
      : null,
    ...utiles.map(
      (etapa, indice) =>
        `${etapa.name}: ${formatValue(etapa.value)}${conversiones[indice] === null ? "" : `, ${formatPercent(conversiones[indice] as number, 1)} de la etapa anterior`}.`,
    ),
  ]
    .filter(Boolean)
    .join(" ");

  const moverFoco = (destino: number) => {
    const acotado = Math.max(0, Math.min(utiles.length - 1, destino));
    setIndiceFoco(acotado);
    zonasRef.current[acotado]?.focus();
  };

  return (
    <div ref={ref} className={cn("min-w-0", className)}>
      <ChartFrame
        width={width}
        height={height}
        margin={margen}
        showGrid={false}
        showBaseline={false}
        summary={resumen}
        table={tabla}
      >
        {utiles.map((etapa, indice) => {
          const y = margen.top + indice * ALTO_ETAPA;
          const proporcion = Math.max(0, etapa.value) / referencia;
          const ancho = Math.max(2, proporcion * anchoUtil);
          const idPatron = `${idBase}-embudo-${indice}`;
          const conversion = conversiones[indice];
          // El rótulo que va DEBAJO de esta banda describe el salto hacia la
          // etapa siguiente: es el hueco que separa las dos bandas.
          const conversionSiguiente = indice + 1 < utiles.length ? conversiones[indice + 1] : null;
          // «Peor entrada»: esta etapa es la que más gente pierde respecto a la
          // anterior. «Peor salida»: el salto que se rotula bajo esta banda.
          const esPeorEntrada = hayDescalabro && peorIndice === indice;
          const esPeorSalida = hayDescalabro && peorIndice === indice + 1;
          const activo = indiceFoco === indice;

          return (
            <g
              key={etapa.id}
              ref={(nodo) => {
                zonasRef.current[indice] = nodo;
              }}
              role="graphics-symbol"
              aria-label={`${etapa.name}: ${formatValue(etapa.value)}${
                conversion === null ? "" : `, ${formatPercent(conversion, 1)} de la etapa anterior`
              }${esPeorEntrada ? ". Es la mayor caída del embudo" : ""}`}
              tabIndex={indice === (indiceFoco ?? 0) ? 0 : -1}
              onFocus={() => setIndiceFoco(indice)}
              onBlur={() => setIndiceFoco((previo) => (previo === indice ? null : previo))}
              onKeyDown={(evento) => {
                if (evento.key === "ArrowDown" || evento.key === "ArrowRight") {
                  evento.preventDefault();
                  moverFoco(indice + 1);
                } else if (evento.key === "ArrowUp" || evento.key === "ArrowLeft") {
                  evento.preventDefault();
                  moverFoco(indice - 1);
                } else if (evento.key === "Home") {
                  evento.preventDefault();
                  moverFoco(0);
                } else if (evento.key === "End") {
                  evento.preventDefault();
                  moverFoco(utiles.length - 1);
                }
              }}
            >
              {/* Nombre y cifra, siempre escritos. */}
              <text x={margen.left} y={y + 12} fill="currentColor" className="text-2xs font-medium text-ink-1">
                {etapa.name}
              </text>
              <text
                x={width - margen.right}
                y={y + 12}
                textAnchor="end"
                fill="currentColor"
                className="font-mono text-2xs text-ink-1 tabular-figures"
              >
                {formatValue(etapa.value)}
              </text>

              {/* Carril de referencia: deja ver cuánto falta para el total. */}
              <rect
                x={margen.left}
                y={y + 20}
                width={anchoUtil}
                height={ALTO_BANDA}
                fill="currentColor"
                className="text-surface-2"
              />

              <g className={seriesColorClass(indice)}>
                <defs>
                  <SeriesPattern id={idPatron} index={indice} />
                </defs>
                <rect
                  x={centro - ancho / 2}
                  y={y + 20}
                  width={ancho}
                  height={ALTO_BANDA}
                  fill={seriesFill(indice, idPatron)}
                  opacity={activo ? 1 : 0.92}
                />
              </g>

              {/* Indicador de foco dentro del SVG. */}
              {activo ? (
                <rect
                  x={margen.left}
                  y={y + 20}
                  width={anchoUtil}
                  height={ALTO_BANDA}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="text-focus"
                />
              ) : null}

              {/* Conversión respecto a la etapa anterior. La mayor caída se
                  marca con el color de aviso Y con la palabra «mayor caída»:
                  el color nunca es el único portador del mensaje. */}
              {conversionSiguiente !== null ? (
                <text
                  x={centro}
                  y={y + 56}
                  textAnchor="middle"
                  fill="currentColor"
                  className={cn(
                    "font-mono text-2xs tabular-figures",
                    esPeorSalida ? "text-status-warning font-semibold" : "text-ink-2",
                  )}
                >
                  {`${formatPercent(conversionSiguiente, 1)} continúa${esPeorSalida ? " · mayor caída" : ""}`}
                </text>
              ) : null}
            </g>
          );
        })}
      </ChartFrame>
    </div>
  );
}
