/**
 * Motor de gráficos SVG propio.
 *
 * Sin dependencias: la matemática vive en `scales.ts` y los componentes solo
 * pintan. Todo gráfico entrega, además del dibujo, un resumen en prosa y una
 * tabla con los mismos números, porque el dibujo es una vía de lectura, no la
 * única.
 */

export {
  CHART_MARGIN,
  ChartCard,
  ChartDataTable,
  ChartEmpty,
  ChartFrame,
  ChartGlyph,
  ChartSkeleton,
  ChartTooltip,
  SERIES_COLOR_CLASSES,
  SERIES_DASH_PATTERNS,
  SeriesPattern,
  chartHeightFor,
  maxXTicksFor,
  plotArea,
  reduceTicks,
  safeId,
  seriesColorClass,
  seriesDash,
  seriesFill,
  useChartWidth,
} from "./chart-frame";
export type {
  ChartAxisTick,
  ChartCardProps,
  ChartEmptyProps,
  ChartEmptyReason,
  ChartFrameProps,
  ChartLegendEntry,
  ChartMargin,
  ChartPlotArea,
  ChartSkeletonProps,
  ChartTable,
  ChartTableRow,
  ChartTooltipProps,
  ChartTooltipRow,
} from "./chart-frame";

export { LineChart } from "./line-chart";
export type { LineChartProps, LineChartSeries } from "./line-chart";

export { BarChart } from "./bar-chart";
export type { BarChartProps, BarChartSeries } from "./bar-chart";

export { FunnelChart } from "./funnel-chart";
export type { FunnelChartProps, FunnelStage } from "./funnel-chart";

export { BulletChart } from "./bullet-chart";
export type { BulletBand, BulletChartProps } from "./bullet-chart";

export { Sparkline } from "./sparkline";
export type { SparklineProps } from "./sparkline";

export {
  bandScale,
  buildAreaPath,
  buildLinePath,
  describeSeries,
  downsample,
  extent,
  formatCompact,
  formatNumber,
  formatPercent,
  linearScale,
  niceTicks,
} from "./scales";
export type { BandScale, ChartPoint, LinearScale, NumericRange } from "./scales";
