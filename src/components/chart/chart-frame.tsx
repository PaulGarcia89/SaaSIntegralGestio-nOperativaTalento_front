"use client";

import * as React from "react";
import { ChartColumn, FilterX, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Marco compartido por todos los gráficos: tarjeta, ejes, rejilla, leyenda,
 * resumen textual, tabla de respaldo, estado vacío, esqueleto y globo de dato.
 *
 * Ningún gráfico dibuja su propio armazón. Así el resumen en prosa y la tabla
 * de datos —las dos vías de escape para quien no puede leer el dibujo— no
 * dependen de que el autor de cada gráfico se acuerde de ponerlas.
 *
 * Es cliente porque mide su contenedor: el `viewBox` se calcula en píxeles
 * reales (1:1 con la pantalla) en lugar de estirarse con
 * `preserveAspectRatio="none"`, que deformaría el texto de los ejes.
 */

/* ── Paleta y patrones de serie ─────────────────────────────────────────── */

/**
 * Color de serie como clase de texto: dentro del SVG el trazo y el relleno son
 * `currentColor`, así el color sale del token y cambia solo con el tema.
 */
export const SERIES_COLOR_CLASSES = [
  "text-series-1",
  "text-series-2",
  "text-series-3",
  "text-series-4",
  "text-series-5",
] as const;

/**
 * Patrón de trazo por serie. Es obligatorio: el color nunca distingue dos
 * series por sí solo (daltonismo, impresión en gris, pantalla con poco brillo).
 * La cadena vacía es el trazo continuo de la serie principal.
 */
export const SERIES_DASH_PATTERNS = ["", "6 4", "2 3", "10 4 2 4", "1 5"] as const;

export function seriesColorClass(index: number): string {
  return SERIES_COLOR_CLASSES[index % SERIES_COLOR_CLASSES.length];
}

export function seriesDash(index: number): string | undefined {
  const patron = SERIES_DASH_PATTERNS[index % SERIES_DASH_PATTERNS.length];
  return patron === "" ? undefined : patron;
}

/**
 * `useId` devuelve identificadores con dos puntos («:r1:») y `url(#…)` no los
 * digiere de forma fiable en todos los navegadores. Esto los deja limpios.
 */
export function safeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, "");
}

/**
 * Textura de relleno por serie para superficies macizas (barras, embudo).
 * Es el equivalente del patrón de trazo en las líneas: dos series contiguas se
 * distinguen aunque el color no llegue. La serie 0 va maciza porque es la
 * principal y no compite con nadie.
 */
export function SeriesPattern({ id, index }: { id: string; index: number }): React.ReactElement | null {
  const tipo = index % SERIES_COLOR_CLASSES.length;
  if (tipo === 0) return null;
  const fondo = <rect width={6} height={6} fill="currentColor" fillOpacity={0.32} />;
  if (tipo === 1) {
    return (
      <pattern id={id} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        {fondo}
        <line x1={0} y1={0} x2={0} y2={6} stroke="currentColor" strokeWidth={3} />
      </pattern>
    );
  }
  if (tipo === 2) {
    return (
      <pattern id={id} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
        {fondo}
        <line x1={0} y1={0} x2={0} y2={6} stroke="currentColor" strokeWidth={2} />
      </pattern>
    );
  }
  if (tipo === 3) {
    return (
      <pattern id={id} width={6} height={6} patternUnits="userSpaceOnUse">
        {fondo}
        <circle cx={3} cy={3} r={1.7} fill="currentColor" />
      </pattern>
    );
  }
  return (
    <pattern id={id} width={6} height={6} patternUnits="userSpaceOnUse">
      {fondo}
      <line x1={0} y1={3} x2={6} y2={3} stroke="currentColor" strokeWidth={2.5} />
    </pattern>
  );
}

/** Relleno de la serie: macizo para la principal, con textura para el resto. */
export function seriesFill(index: number, patternId: string): string {
  return index % SERIES_COLOR_CLASSES.length === 0 ? "currentColor" : `url(#${patternId})`;
}

/* ── Geometría ──────────────────────────────────────────────────────────── */

export type ChartMargin = { top: number; right: number; bottom: number; left: number };

/** Margen por defecto: sitio para las etiquetas de los dos ejes y nada más. */
export const CHART_MARGIN: ChartMargin = { top: 16, right: 16, bottom: 34, left: 46 };

export type ChartPlotArea = {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly innerWidth: number;
  readonly innerHeight: number;
};

export function plotArea(width: number, height: number, margin: ChartMargin = CHART_MARGIN): ChartPlotArea {
  const left = margin.left;
  const top = margin.top;
  const right = Math.max(left + 1, width - margin.right);
  const bottom = Math.max(top + 1, height - margin.bottom);
  return { left, top, right, bottom, innerWidth: right - left, innerHeight: bottom - top };
}

/**
 * Alto del gráfico por punto de corte. Es un alto FIJO en píxeles: el ancho es
 * fluido y el `viewBox` va 1:1 con la pantalla, de modo que el texto conserva su
 * tamaño real (nunca por debajo de 11px) sea cual sea el ancho del contenedor.
 */
export function chartHeightFor(width: number): number {
  if (width < 480) return 200;
  if (width < 768) return 244;
  return 288;
}

/** Cuántas marcas caben en el eje horizontal sin que las etiquetas choquen. */
export function maxXTicksFor(width: number): number {
  if (width < 480) return 3;
  if (width < 768) return 5;
  return 8;
}

/**
 * Reduce una lista de marcas conservando la primera, la última y un reparto
 * regular por el medio. En móvil quedan tres (primera, central y última): es
 * preferible a encoger la tipografía, que deja el eje ilegible.
 */
export function reduceTicks<T>(items: readonly T[], max: number): T[] {
  if (max <= 0) return [];
  if (items.length <= max) return [...items];
  if (max <= 3) {
    const centro = Math.floor((items.length - 1) / 2);
    const indices = [...new Set([0, centro, items.length - 1])].slice(0, max);
    return indices.map((indice) => items[indice]);
  }
  const paso = Math.ceil((items.length - 1) / (max - 1));
  const seleccion: T[] = [];
  for (let i = 0; i < items.length; i += paso) seleccion.push(items[i]);
  const ultimo = items[items.length - 1];
  if (seleccion[seleccion.length - 1] !== ultimo) seleccion.push(ultimo);
  return seleccion;
}

/** Mide el contenedor para que el gráfico se adapte sin desplazamiento lateral. */
export function useChartWidth(fallback = 640): {
  ref: React.RefObject<HTMLDivElement | null>;
  width: number;
} {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = React.useState(fallback);

  React.useEffect(() => {
    const nodo = ref.current;
    if (!nodo) return;
    const aplicar = (ancho: number) => {
      if (ancho > 0) setWidth(Math.round(ancho));
    };
    aplicar(nodo.getBoundingClientRect().width);
    if (typeof ResizeObserver === "undefined") return;
    const observador = new ResizeObserver((entradas) => {
      for (const entrada of entradas) aplicar(entrada.contentRect.width);
    });
    observador.observe(nodo);
    return () => observador.disconnect();
  }, []);

  return { ref, width };
}

/* ── Tarjeta ────────────────────────────────────────────────────────────── */

export type ChartCardProps = {
  title: string;
  subtitle?: string;
  /** Acción opcional de la cabecera (exportar, cambiar periodo…). */
  action?: React.ReactNode;
  /** Procedencia del dato. Un gráfico sin fuente no es auditable. */
  source?: string;
  /** Periodo que cubre el dato. */
  period?: string;
  className?: string;
  children: React.ReactNode;
};

export function ChartCard({ title, subtitle, action, source, period, className, children }: ChartCardProps) {
  const pie = [source, period].filter(Boolean).join(" · ");
  return (
    <section className={cn("flex flex-col rounded-2xl border border-line bg-surface-1 shadow-e1", className)}>
      <header className="flex flex-wrap items-start justify-between gap-3 px-4 pt-4 sm:px-5">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-ink-1">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-ink-2">{subtitle}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className="min-w-0 px-4 py-4 sm:px-5">{children}</div>
      {pie ? (
        <footer className="border-t border-line px-4 py-2 text-2xs text-ink-3 sm:px-5">{pie}</footer>
      ) : null}
    </section>
  );
}

/* ── Marco del gráfico ──────────────────────────────────────────────────── */

export type ChartAxisTick = {
  /** Coordenada en el espacio del viewBox. */
  readonly position: number;
  readonly label: string;
};

export type ChartLegendEntry = {
  readonly id: string;
  readonly label: string;
  /** Clase de color de la serie: `text-series-n` o un `text-status-*`. */
  readonly colorClassName: string;
  /** Patrón real de la línea, para que la leyenda muestre lo que se dibuja. */
  readonly dash?: string;
  readonly shape?: "line" | "bar";
  /** Índice de serie: decide la textura de la muestra en las barras. */
  readonly patternIndex?: number;
};

export type ChartTableRow = { readonly key: string; readonly cells: readonly string[] };

export type ChartTable = {
  readonly caption: string;
  readonly headers: readonly string[];
  readonly rows: readonly ChartTableRow[];
};

export type ChartFrameProps = {
  width: number;
  height: number;
  margin?: ChartMargin;
  /** Marcas del eje horizontal, ya convertidas a coordenadas del viewBox. */
  xTicks?: readonly ChartAxisTick[];
  /** Marcas del eje vertical. Dibujan además la rejilla horizontal. */
  yTicks?: readonly ChartAxisTick[];
  /**
   * Rejilla horizontal a la altura de las marcas verticales. Se apaga en las
   * barras horizontales, donde una línea por categoría atravesaría las barras.
   */
  showGrid?: boolean;
  /** Línea base del eje horizontal. */
  showBaseline?: boolean;
  /** Resumen en prosa generado con los datos. Obligatorio. */
  summary: string;
  legend?: readonly ChartLegendEntry[];
  table?: ChartTable;
  /** Capa HTML sobre el lienzo: es donde vive el globo de dato. */
  overlay?: React.ReactNode;
  svgProps?: React.SVGProps<SVGSVGElement>;
  className?: string;
  children: React.ReactNode;
};

/** Trazo de muestra de la leyenda: el patrón real, no un cuadradito de color. */
function LegendSwatch({
  colorClassName,
  dash,
  shape,
  patternIndex = 0,
}: Pick<ChartLegendEntry, "colorClassName" | "dash" | "shape" | "patternIndex">) {
  const idPatron = `${safeId(React.useId())}-muestra`;
  if (shape === "bar") {
    return (
      <svg width="20" height="12" viewBox="0 0 20 12" aria-hidden="true" className={cn("shrink-0", colorClassName)}>
        <defs>
          <SeriesPattern id={idPatron} index={patternIndex} />
        </defs>
        <rect x="0" y="0" width="20" height="12" fill={seriesFill(patternIndex, idPatron)} />
      </svg>
    );
  }
  return (
    <svg width="24" height="10" viewBox="0 0 24 10" aria-hidden="true" className={cn("shrink-0", colorClassName)}>
      <line x1="0" y1="5" x2="24" y2="5" stroke="currentColor" strokeWidth={2} strokeDasharray={dash} strokeLinecap="butt" />
      <circle cx="12" cy="5" r="2.5" fill="currentColor" />
    </svg>
  );
}

export function ChartFrame({
  width,
  height,
  margin = CHART_MARGIN,
  xTicks = [],
  yTicks = [],
  showGrid = true,
  showBaseline = true,
  summary,
  legend,
  table,
  overlay,
  svgProps,
  className,
  children,
}: ChartFrameProps) {
  const idBase = React.useId();
  const idResumen = `${idBase}-resumen`;
  const area = plotArea(width, height, margin);

  return (
    <figure className={cn("m-0 flex min-w-0 flex-col gap-3", className)}>
      <div className="relative min-w-0">
        <svg
          role="graphics-document"
          aria-labelledby={idResumen}
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="block w-full overflow-visible"
          {...svgProps}
        >
          {/* Rejilla horizontal solamente: las verticales compiten con el dato
              y no aportan lectura. 1px nítido, sin antialias. */}
          <g className="text-grid" aria-hidden="true">
            {(showGrid ? yTicks : []).map((marca) => (
              <line
                key={`rejilla-${marca.position}-${marca.label}`}
                x1={area.left}
                x2={area.right}
                y1={marca.position}
                y2={marca.position}
                stroke="currentColor"
                strokeWidth={1}
                shapeRendering="crispEdges"
              />
            ))}
          </g>

          {/* Etiquetas del eje vertical. */}
          <g className="fill-current font-mono text-2xs text-ink-3 tabular-figures" aria-hidden="true">
            {yTicks.map((marca) => (
              <text
                key={`ejey-${marca.position}-${marca.label}`}
                x={area.left - 8}
                y={marca.position}
                textAnchor="end"
                dominantBaseline="middle"
              >
                {marca.label}
              </text>
            ))}
          </g>

          {/* Etiquetas del eje horizontal. */}
          <g className="fill-current font-mono text-2xs text-ink-3 tabular-figures" aria-hidden="true">
            {xTicks.map((marca) => (
              <text
                key={`ejex-${marca.position}-${marca.label}`}
                x={marca.position}
                y={height - margin.bottom + 16}
                textAnchor="middle"
              >
                {marca.label}
              </text>
            ))}
          </g>

          {/* Línea base del eje horizontal: separa el dato del eje. */}
          {showBaseline ? (
            <line
              x1={area.left}
              x2={area.right}
              y1={area.bottom}
              y2={area.bottom}
              stroke="currentColor"
              strokeWidth={1}
              shapeRendering="crispEdges"
              className="text-line-strong"
              aria-hidden="true"
            />
          ) : null}

          {/* Entrada corta. Con `prefers-reduced-motion` la clase no llega a
              aplicarse y el gráfico aparece ya dibujado. */}
          <g className="motion-safe:animate-rise-in">{children}</g>
        </svg>
        {overlay}
      </div>

      {legend && legend.length > 0 ? (
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {legend.map((entrada) => (
            <li key={entrada.id} className="flex items-center gap-2 text-2xs text-ink-2">
              <LegendSwatch
                colorClassName={entrada.colorClassName}
                dash={entrada.dash}
                shape={entrada.shape}
                patternIndex={entrada.patternIndex}
              />
              <span>{entrada.label}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Resumen textual generado con los datos: mismo contenido para quien no
          ve el dibujo. Va en el DOM, no solo en un `aria-label`. */}
      <figcaption id={idResumen} className="sr-only">
        {summary}
      </figcaption>

      {table ? <ChartDataTable table={table} /> : null}
    </figure>
  );
}

/** Tabla de respaldo: la vía de escape para el dato exacto. */
export function ChartDataTable({ table }: { table: ChartTable }) {
  return (
    <details className="rounded-md border border-line bg-surface-2">
      <summary className="cursor-pointer px-3 py-2 text-2xs font-medium text-ink-2">Ver los datos</summary>
      <div className="max-h-80 overflow-auto px-3 pb-3">
        <table className="w-full border-collapse text-left text-2xs">
          <caption className="sr-only">{table.caption}</caption>
          <thead>
            <tr>
              {table.headers.map((cabecera, indice) => (
                <th
                  key={cabecera}
                  scope="col"
                  className={cn(
                    "border-b border-line py-1.5 pr-3 font-medium text-ink-2",
                    indice > 0 && "text-right font-mono",
                  )}
                >
                  {cabecera}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((fila) => (
              <tr key={fila.key}>
                {fila.cells.map((celda, indice) =>
                  indice === 0 ? (
                    <th key={`${fila.key}-0`} scope="row" className="border-b border-line py-1.5 pr-3 font-normal text-ink-2">
                      {celda}
                    </th>
                  ) : (
                    <td
                      key={`${fila.key}-${indice}`}
                      className="border-b border-line py-1.5 pr-3 text-right font-mono text-ink-1 tabular-figures"
                    >
                      {celda}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/* ── Estados ────────────────────────────────────────────────────────────── */

export type ChartEmptyReason = "sin-registros" | "sin-resultados";

export type ChartEmptyProps = {
  /**
   * Por qué no hay datos. No es lo mismo «todavía no ha pasado nada» que «has
   * filtrado de más»: la primera se resuelve trabajando y la segunda tocando
   * un filtro, y el texto tiene que decir cuál de las dos es.
   */
  reason?: ChartEmptyReason;
  title?: string;
  description?: string;
  /** Acción que resuelve la situación (quitar filtros, registrar el primer dato…). */
  action?: React.ReactNode;
  /** Mismo alto que el gráfico para que la maqueta no salte al llegar los datos. */
  height?: number;
  className?: string;
};

const TEXTOS_VACIO: Record<ChartEmptyReason, { title: string; description: string }> = {
  "sin-registros": {
    title: "Todavía no hay registros",
    description:
      "Este gráfico se dibujará en cuanto se registre la primera actividad del periodo. No hay nada mal configurado.",
  },
  "sin-resultados": {
    title: "Ningún dato cumple los filtros",
    description:
      "Hay datos en el sistema, pero ninguno encaja con los filtros aplicados. Amplía el periodo o quita algún filtro para volver a verlos.",
  },
};

export function ChartEmpty({
  reason = "sin-registros",
  title,
  description,
  action,
  height = 244,
  className,
}: ChartEmptyProps) {
  const textos = TEXTOS_VACIO[reason];
  const Icono = reason === "sin-resultados" ? FilterX : Inbox;
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong bg-surface-2 px-4 py-6 text-center",
        className,
      )}
      style={{ minHeight: height }}
    >
      <Icono className="size-6 text-ink-3" aria-hidden="true" />
      <p className="text-sm font-medium text-ink-1">{title ?? textos.title}</p>
      <p className="max-w-prose text-2xs text-ink-2">{description ?? textos.description}</p>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

export type ChartSkeletonProps = {
  /** El mismo alto que tendrá el gráfico: sin esto la maqueta salta al cargar. */
  height?: number;
  label?: string;
  className?: string;
};

export function ChartSkeleton({ height = 244, label = "Cargando el gráfico…", className }: ChartSkeletonProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)} role="status" aria-live="polite" aria-busy="true">
      <div className="skeleton w-full rounded-lg" style={{ height }} />
      <div className="flex gap-3" aria-hidden="true">
        <div className="skeleton h-3 w-24 rounded-xs" />
        <div className="skeleton h-3 w-16 rounded-xs" />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

/* ── Globo de dato ──────────────────────────────────────────────────────── */

export type ChartTooltipRow = {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly colorClassName?: string;
  readonly dash?: string;
};

export type ChartTooltipProps = {
  title: string;
  rows: readonly ChartTooltipRow[];
  /** Posición horizontal en píxeles dentro del contenedor del gráfico. */
  x: number;
  /** Posición vertical. Si no se indica, se ancla arriba. */
  y?: number;
  /** Ancho del contenedor: decide si el globo abre a izquierda o a derecha. */
  containerWidth: number;
  className?: string;
};

/**
 * Globo de dato. Es HTML, no SVG: hereda la tipografía del sistema y se lee
 * igual con el texto ampliado al 200 %. No captura el ratón ni el foco.
 */
export function ChartTooltip({ title, rows, x, y = 8, containerWidth, className }: ChartTooltipProps) {
  const abreAIzquierda = x > containerWidth / 2;
  return (
    <div
      className={cn(
        "pointer-events-none absolute z-10 min-w-36 max-w-56 rounded-md border border-line-strong bg-surface-1 px-3 py-2 shadow-e2",
        className,
      )}
      style={{
        top: y,
        left: abreAIzquierda ? undefined : x + 12,
        right: abreAIzquierda ? containerWidth - x + 12 : undefined,
      }}
      aria-hidden="true"
    >
      <p className="text-2xs font-medium text-ink-1">{title}</p>
      <ul className="mt-1 flex flex-col gap-0.5">
        {rows.map((fila) => (
          <li key={fila.id} className="flex items-center justify-between gap-3 text-2xs">
            <span className="flex min-w-0 items-center gap-1.5 text-ink-2">
              {fila.colorClassName ? (
                <LegendSwatch colorClassName={fila.colorClassName} dash={fila.dash} />
              ) : null}
              <span className="truncate">{fila.label}</span>
            </span>
            <span className="shrink-0 font-mono text-ink-1 tabular-figures">{fila.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Icono neutro para cabeceras de tarjeta de gráfico. */
export function ChartGlyph({ className }: { className?: string }) {
  return <ChartColumn className={cn("size-4 text-ink-3", className)} aria-hidden="true" />;
}
