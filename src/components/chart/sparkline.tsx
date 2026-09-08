"use client";

import { useUiText } from "@/components/ui-copy";

import { cn } from "@/lib/utils";
import { buildAreaPath, buildLinePath, describeSeries, downsample, formatCompact, linearScale, type ChartPoint } from "./scales";

/**
 * Microtendencia sin ejes, para incrustar junto a una métrica.
 *
 * No lleva ejes, ni rejilla, ni tabla: no es un gráfico que se lea, es un
 * adjetivo del número que tiene al lado. Toda su información está además en el
 * `aria-label`, que dice el recorrido y la variación.
 *
 * Es el único gráfico del motor que usa `preserveAspectRatio="none"`: no
 * contiene texto que se pueda deformar, y `vector-effect="non-scaling-stroke"`
 * mantiene el grosor del trazo constante al estirarse.
 */

export type SparklineProps = {
  /** Valores en orden cronológico. */
  values: readonly number[];
  /** Qué mide la serie: se usa para construir la descripción accesible. */
  label: string;
  /** Etiquetas por posición (fechas, semanas…) para la descripción. */
  pointLabels?: readonly string[];
  formatValue?: (value: number) => string;
  /** Color del trazo. Los `status-*` solo para semántica de bien/aviso/bloqueo. */
  toneClassName?: string;
  /** Relleno degradado bajo la línea. */
  withArea?: boolean;
  className?: string;
};

/** Espacio de trabajo interno. El SVG se estira; las proporciones no importan. */
const ANCHO = 120;
const ALTO = 32;

export function Sparkline({
  values,
  label,
  pointLabels,
  formatValue = formatCompact,
  toneClassName = "text-series-1",
  withArea = false,
  className,
}: SparklineProps) {
  const uiText = useUiText();
  const puntos: ChartPoint[] = values
    .map((valor, indice) => ({ x: indice, y: valor, label: pointLabels?.[indice] }))
    .filter((punto) => Number.isFinite(punto.y));

  if (puntos.length === 0) {
    return (
      <span className={cn("font-mono text-2xs text-ink-3", className)}>{uiText("Sin datos suficientes para la tendencia")}</span>
    );
  }

  const reducidos = downsample(puntos, 80);
  const valores = reducidos.map((punto) => punto.y);
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);

  const escalaX = linearScale({
    domain: [reducidos[0].x, reducidos[reducidos.length - 1].x],
    range: [1, ANCHO - 1],
  });
  // Un margen de 3px arriba y abajo evita que el trazo se corte al llegar al
  // máximo o al mínimo de la serie.
  const escalaY = linearScale({ domain: [minimo, maximo], range: [ALTO - 3, 3] });

  const enPixeles = reducidos.map((punto) => ({ x: escalaX(punto.x), y: escalaY(punto.y) }));
  const ultimo = enPixeles[enPixeles.length - 1];
  const descripcion = describeSeries(label, reducidos, formatValue);
  // El degradado depende solo del tono, así que su identificador se deriva del
  // tono y no de un `useId`: sin hooks, este componente puede renderizarse en
  // servidor. Dos microtendencias del mismo tono comparten una definición
  // idéntica, de modo que compartir identificador no cambia lo que se ve.
  const idDegradado = `sparkline-area-${toneClassName.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <svg
      role="img"
      aria-label={descripcion}
      viewBox={`0 0 ${ANCHO} ${ALTO}`}
      preserveAspectRatio="none"
      className={cn("block h-8 w-full", toneClassName, className)}
    >
      {withArea ? (
        <>
          <defs>
            <linearGradient id={idDegradado} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity={0.18} />
              <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={buildAreaPath(enPixeles, ALTO)} fill={`url(#${idDegradado})`} stroke="none" />
        </>
      ) : null}
      <path
        d={buildLinePath(enPixeles)}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {Number.isFinite(ultimo.x) && Number.isFinite(ultimo.y) ? (
        <circle cx={ultimo.x} cy={ultimo.y} r={1.8} fill="currentColor" vectorEffect="non-scaling-stroke" />
      ) : null}
    </svg>
  );
}
