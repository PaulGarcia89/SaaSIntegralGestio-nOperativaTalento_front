"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  ChartFrame,
  safeId,
  useChartWidth,
  type ChartAxisTick,
  type ChartTable,
} from "./chart-frame";
import { formatCompact, formatPercent, linearScale, niceTicks } from "./scales";

/**
 * Indicador contra objetivo (bullet chart).
 *
 * El número y el objetivo van escritos al lado de la barra, no solo dibujados:
 * la barra sirve para ver de un golpe si se llega o no, pero la cifra exacta
 * tiene que poder leerse sin medir píxeles.
 */

export type BulletBand = {
  /** Límite superior de la banda, en unidades del dato. */
  readonly upTo: number;
  readonly label: string;
};

export type BulletChartProps = {
  label: string;
  value: number;
  target: number;
  /** Bandas de umbral ascendentes (flojo / aceptable / bueno). */
  bands?: readonly BulletBand[];
  /** Tope del eje. Por defecto, lo mayor entre valor, objetivo y última banda. */
  max?: number;
  formatValue?: (value: number) => string;
  /**
   * Lectura semántica del valor. Los colores de estado solo se usan aquí, para
   * decir «bien / aviso / bloqueo»; nunca como paleta categórica.
   */
  status?: "neutral" | "success" | "warning" | "danger";
  caption?: string;
  className?: string;
};

const ALTO_BULLET = 46;
const ALTO_BARRA = 14;

const CLASES_ESTADO: Record<NonNullable<BulletChartProps["status"]>, string> = {
  neutral: "text-series-1",
  success: "text-status-success",
  warning: "text-status-warning",
  danger: "text-status-danger",
};

/** Grises de las bandas de umbral: de más flojo a más sólido. */
const CLASES_BANDA = ["text-surface-2", "text-surface-3", "text-line"] as const;

export function BulletChart({
  label,
  value,
  target,
  bands = [],
  max,
  formatValue = formatCompact,
  status = "neutral",
  caption,
  className,
}: BulletChartProps) {
  const { ref, width } = useChartWidth();
  const idBase = safeId(React.useId());

  const valorSeguro = Number.isFinite(value) ? value : 0;
  const objetivoSeguro = Number.isFinite(target) ? target : 0;
  const bandasValidas = bands.filter((banda) => Number.isFinite(banda.upTo)).slice().sort((a, b) => a.upTo - b.upTo);
  const tope = Math.max(
    Number.isFinite(max ?? Number.NaN) ? (max as number) : 0,
    valorSeguro,
    objetivoSeguro,
    bandasValidas.length > 0 ? bandasValidas[bandasValidas.length - 1].upTo : 0,
    1,
  );

  const margen = { top: 6, right: 12, bottom: 24, left: 12 };
  const height = ALTO_BULLET + margen.top + margen.bottom;
  const izquierda = margen.left;
  const derecha = Math.max(izquierda + 1, width - margen.right);

  const escala = linearScale({ domain: [0, tope], range: [izquierda, derecha] });
  const marcas: ChartAxisTick[] = niceTicks(0, tope, width < 480 ? 3 : 5).map((marca) => ({
    position: escala(marca),
    label: formatValue(marca),
  }));

  const cumplimiento = objetivoSeguro !== 0 ? (valorSeguro / objetivoSeguro) * 100 : null;
  const yBarra = margen.top + (ALTO_BULLET - ALTO_BARRA) / 2;

  const tabla: ChartTable = {
    caption: caption ?? `Valores del indicador ${label}`,
    headers: ["Concepto", "Valor"],
    rows: [
      { key: "actual", cells: ["Valor actual", formatValue(valorSeguro)] },
      { key: "objetivo", cells: ["Objetivo", formatValue(objetivoSeguro)] },
      {
        key: "cumplimiento",
        cells: ["Cumplimiento del objetivo", cumplimiento === null ? "—" : formatPercent(cumplimiento, 1)],
      },
      ...bandasValidas.map((banda, indice) => ({
        key: `banda-${indice}`,
        cells: [`Umbral ${banda.label}`, formatValue(banda.upTo)],
      })),
    ],
  };

  const resumen = [
    caption ? `${caption}.` : null,
    `${label}: valor actual ${formatValue(valorSeguro)} frente a un objetivo de ${formatValue(objetivoSeguro)}.`,
    cumplimiento === null
      ? "No hay objetivo con el que comparar."
      : `Cubre el ${formatPercent(cumplimiento, 1)} del objetivo; ${
          valorSeguro >= objetivoSeguro
            ? "el objetivo está cumplido"
            : `faltan ${formatValue(objetivoSeguro - valorSeguro)}`
        }.`,
    bandasValidas.length > 0
      ? `Umbrales de referencia: ${bandasValidas.map((banda) => `${banda.label} hasta ${formatValue(banda.upTo)}`).join(", ")}.`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={ref} className={cn("flex min-w-0 flex-col gap-1", className)}>
      {/* La cifra y el objetivo, en texto y no solo en la barra. */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-sm text-ink-2">{label}</span>
        <span className="flex items-baseline gap-2">
          <span className={cn("font-mono text-base font-semibold tabular-figures", CLASES_ESTADO[status])}>
            {formatValue(valorSeguro)}
          </span>
          <span className="font-mono text-2xs text-ink-3 tabular-figures">
            {`objetivo ${formatValue(objetivoSeguro)}`}
            {cumplimiento === null ? "" : ` · ${formatPercent(cumplimiento, 0)}`}
          </span>
        </span>
      </div>

      <ChartFrame
        width={width}
        height={height}
        margin={margen}
        xTicks={marcas}
        showGrid={false}
        showBaseline={false}
        summary={resumen}
        table={tabla}
      >
        {/* Bandas de umbral: el contexto contra el que se juzga el valor. */}
        {(bandasValidas.length > 0
          ? bandasValidas
          : ([{ upTo: tope, label: "rango" }] as readonly BulletBand[])
        ).map((banda, indice, lista) => {
          const desde = indice === 0 ? 0 : lista[indice - 1].upTo;
          const x = escala(desde);
          const ancho = Math.max(0, escala(banda.upTo) - x);
          return (
            <rect
              key={`${idBase}-banda-${indice}`}
              x={x}
              y={margen.top}
              width={ancho}
              height={ALTO_BULLET}
              fill="currentColor"
              className={CLASES_BANDA[indice % CLASES_BANDA.length]}
            />
          );
        })}

        {/* Valor medido. */}
        <g
          role="graphics-symbol"
          tabIndex={0}
          aria-label={`${label}: ${formatValue(valorSeguro)} de un objetivo de ${formatValue(objetivoSeguro)}${
            cumplimiento === null ? "" : `, un ${formatPercent(cumplimiento, 1)} del objetivo`
          }`}
          className={CLASES_ESTADO[status]}
        >
          <rect
            x={escala(0)}
            y={yBarra}
            width={Math.max(0, escala(Math.max(0, valorSeguro)) - escala(0))}
            height={ALTO_BARRA}
            fill="currentColor"
          />
        </g>

        {/* Marca del objetivo: una pleca vertical, el convenio del bullet chart. */}
        <line
          x1={escala(objetivoSeguro)}
          x2={escala(objetivoSeguro)}
          y1={margen.top + 2}
          y2={margen.top + ALTO_BULLET - 2}
          stroke="currentColor"
          strokeWidth={3}
          className="text-ink-1"
          shapeRendering="crispEdges"
          aria-hidden="true"
        />
      </ChartFrame>
    </div>
  );
}
