/**
 * Sistema de diseño de TalentOS.
 *
 * Punto de entrada único. Las pantallas importan de aquí y no de los archivos
 * sueltos: así se puede reorganizar el sistema por dentro sin tocar ~300
 * pantallas, y una importación de `@/components/system` deja claro que lo que
 * se usa es del sistema y no un componente local.
 *
 * Qué sustituye a qué (la migración es gradual, no de golpe):
 *
 *   components/ui.tsx           ModuleHeader  → PageHeader + MetricRow
 *                               MetricCard    → Metric
 *                               SectionCard   → PageSection boxed
 *                               DataTable     → DataView
 *                               LoadingPanel  → SkeletonRows
 *   components/design-system    PageHeader    → PageHeader
 *                               InlineFeedback→ InlineNote
 *                               Pagination    → Pagination
 *                               Wizard        → OperationStepper
 *   components/simple/simple-ui SimpleEmpty   → EmptyState
 *                               PhaseChip     → StatusBadge
 *
 * Los tres módulos anteriores siguen existiendo y funcionando; lo que cambia
 * es a dónde apuntan las pantallas nuevas.
 */

export {
  StatusBadge,
  BlockerCard,
  BlockerList,
  WarningList,
  InlineNote,
  EmptyState,
  ErrorState,
  BlockedState,
  SkeletonLine,
  SkeletonBlock,
  SkeletonRows,
  type Tone,
} from "@/components/system/feedback";

export {
  PageHeader,
  ActionBar,
  MobileActionBar,
  PageSection,
  NextAction,
  Metric,
  MetricRow,
} from "@/components/system/layout";

export {
  DataView,
  FilterBar,
  Pagination,
  nextSort,
  type ColumnPriority,
  type DataColumn,
  type DataSelection,
  type DataViewProps,
  type SortState,
} from "@/components/system/data-view";

export {
  OperationStepper,
  ImpactReview,
  ConfirmPanel,
  OperationResultView,
  Timeline,
  type TimelineEntry,
} from "@/components/system/operation";

/* Tarjeta de entidad: la ficha visual de una persona, un documento, una tarea,
   una vacante, un curso o un recurso. Ver `entity-card.tsx`. */
export { Avatar, EntityCard, EntityCardList, ProgressMeter, initialsOf } from "./entity-card";
export type { EntityCardProps, EntityFact } from "./entity-card";

/* Tarjeta de estado: la pieza con la que abre el panel de cada módulo.
   Ver `status-tile.tsx`. */
export { StatusTile, StatusTileRow } from "./status-tile";
export type { StatusTileProps } from "./status-tile";

/* Contexto activo: empresa y sucursal sobre las que hablan las cifras.
   Ver `active-context.tsx`. */
export { ActiveContext } from "./active-context";
