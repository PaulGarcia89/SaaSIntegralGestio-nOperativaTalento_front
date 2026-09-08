"use client";

import { useUiText } from "@/components/ui-copy";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DomainTable } from "@/components/domain";
import {
  Metric,
  MetricRow,
  PageHeader,
  PageSection,
  SkeletonBlock,
  SkeletonRows,
  StatusBadge,
} from "@/components/system";

/**
 * Primitivas heredadas que todavía usan nueve pantallas.
 *
 * Se conservan los nombres y las props para no editar esas pantallas una por
 * una; lo que cambia es de qué están hechas por dentro.
 *
 * Qué cambia
 * ----------
 * · `MetricCard` era una tarjeta de 28 px de relleno con borde y fondo
 *   propios, y siempre imprimía «Periodo: no informado» aunque nadie hubiera
 *   pasado un periodo: una línea de ruido en todas las métricas del producto.
 *   Ahora es `Metric` del sistema, y el periodo solo aparece cuando existe.
 * · `ModuleHeader` colocaba las métricas en una rejilla de hasta tres
 *   columnas con 32 px de separación; en un iPhone eso es una columna de
 *   tarjetas altísimas con mucho aire desperdiciado. `MetricRow` las pone en
 *   dos columnas desde 320 px y las separa con una línea, no con un hueco.
 * · `LoadingPanel` era una maqueta falsa de treinta bloques `animate-pulse`
 *   que no se parecía a la pantalla que venía después, así que al llegar el
 *   contenido todo saltaba. Ahora son las siluetas del sistema.
 * · Los colores (`border-border/70`, `bg-card/90`, `bg-secondary/40`) venían
 *   de la paleta anterior y no respondían a los tokens.
 */

type PageIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

type ModuleMetric = {
  label: string;
  value: string;
  detail: string;
};

export function ModuleHeader({
  eyebrow,
  title,
  description,
  actions,
  metrics,
}: PageIntroProps & { metrics: ModuleMetric[] }) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={title} description={description} actions={actions} />
      {metrics.length ? (
        <MetricRow>
          {metrics.map((metric) => (
            <Metric
              key={`${metric.label}-${metric.value}`}
              label={metric.label}
              value={metric.value}
              detail={metric.detail}
            />
          ))}
        </MetricRow>
      ) : null}
    </div>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  period?: string;
};

export function MetricCard({ label, value, detail, period }: MetricCardProps) {
  return (
    <Metric
      label={label}
      value={value}
      // El periodo se decía siempre, incluso para afirmar que no se sabe.
      // Cuando no lo hay, la procedencia es simplemente el detalle.
      detail={period ? `${detail} · ${period}` : detail}
    />
  );
}

type SectionCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
};

export function SectionCard({ title, subtitle, children, className }: SectionCardProps) {
  return (
    <PageSection title={title} boxed className={className}>
      {subtitle ? (
        <div className="mb-4">
          <StatusBadge size="sm" tone="neutral" label={subtitle} />
        </div>
      ) : null}
      {children}
    </PageSection>
  );
}

type InfoListProps = {
  items: Array<{
    title: string;
    description: string;
    badge?: string;
  }>;
};

export function InfoList({ items }: InfoListProps) {
  return (
    <ul className="divide-y divide-line">
      {items.map((item) => (
        <li
          key={`${item.title}-${item.description}`}
          className="flex flex-col gap-2 py-4 md:flex-row md:items-start md:justify-between md:gap-4"
        >
          <div className="min-w-0 space-y-1">
            <p className="font-medium text-ink-1">{item.title}</p>
            <p className="text-sm leading-6 text-ink-2">{item.description}</p>
          </div>
          {item.badge ? (
            <div className="shrink-0">
              <StatusBadge size="sm" tone="neutral" label={item.badge} />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

type DataTableProps = {
  columns: string[];
  rows: string[][];
  pageSize?: number;
};

export function DataTable({ columns, rows, pageSize = 10 }: DataTableProps) {
  const data = rows.map((cells, index) => ({ id: `${index}-${cells.join("-")}`, cells }));
  return (
    <DomainTable<{ id: string; cells: string[] }>
      data={data}
      getKey={(row) => row.id}
      pageSize={pageSize}
      caption={columns.join(", ")}
      columns={columns.map((header, index) => ({
        key: `${index}-${header}`,
        header,
        render: (row) => row.cells[index] ?? "",
        exportValue: (row) => row.cells[index] ?? "",
      }))}
    />
  );
}

type SplitPanelProps = {
  left: ReactNode;
  right: ReactNode;
};

export function SplitPanel({ left, right }: SplitPanelProps) {
  // Una sola columna hasta `xl`: en tablet vertical y en teléfono, dos
  // columnas obligan a leer en zigzag.
  return (
    <div className={cn("grid min-w-0 gap-5", "xl:grid-cols-[1.15fr_0.85fr] xl:gap-8")}>
      <div className="min-w-0">{left}</div>
      <div className="min-w-0">{right}</div>
    </div>
  );
}

/**
 * Espera de una pantalla de módulo.
 *
 * La versión anterior dibujaba treinta bloques pulsando que no guardaban
 * ninguna relación con la pantalla real, así que al llegar el contenido la
 * maqueta saltaba entera. Estas siluetas tienen la forma de lo que viene:
 * encabezado, fila de cifras y una lista.
 */
export function LoadingPanel() {
  const uiText = useUiText();
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-6">
      <span className="sr-only">{uiText("Cargando la pantalla")}</span>
      <div className="space-y-3">
        <SkeletonBlock className="h-4 w-24" />
        <SkeletonBlock className="h-8 w-72 max-w-full" />
        <SkeletonBlock className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-5 rounded-xl border border-line bg-surface-1 p-5 sm:grid-cols-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-7 w-16" />
          </div>
        ))}
      </div>
      <SkeletonRows rows={5} label={uiText("Cargando los registros")} />
    </div>
  );
}
