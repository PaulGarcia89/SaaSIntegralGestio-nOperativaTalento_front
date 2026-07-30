"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DomainTable } from "@/components/domain";
import { PageHeader } from "@/components/design-system";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="space-y-8 pb-4 xl:space-y-10 xl:pb-6">
      <PageHeader eyebrow={eyebrow} title={title} description={description} actions={actions} />
      <div className="grid gap-x-8 gap-y-8 md:grid-cols-2 2xl:grid-cols-3">
        {metrics.map((metric) => (
          <MetricCard
            key={`${metric.label}-${metric.value}`}
            label={metric.label}
            value={metric.value}
            detail={metric.detail}
          />
        ))}
      </div>
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
    <Card className="overflow-hidden border-border/70 bg-card/90">
      <CardContent className="space-y-4 p-7">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
        <p className="text-sm text-muted-foreground">{detail}</p>
        <p className="border-t pt-3 text-xs text-muted-foreground">Periodo: {period ?? "no informado"}</p>
      </CardContent>
    </Card>
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
    <Card className={cn("border-border/70 bg-card/85", className)}>
      <CardHeader className="pb-5">
        {subtitle ? (
          <Badge variant="outline" className="w-fit rounded-full">
            {subtitle}
          </Badge>
        ) : null}
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
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
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={`${item.title}-${item.description}`}
          className="flex flex-col gap-3 rounded-xl border border-border/70 bg-secondary/40 p-4 md:flex-row md:items-start md:justify-between"
        >
          <div className="space-y-1">
            <p className="font-medium text-foreground">{item.title}</p>
            <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
          </div>
          {item.badge ? (
            <Badge variant="secondary" className="w-fit rounded-full">
              {item.badge}
            </Badge>
          ) : null}
        </div>
      ))}
    </div>
  );
}

type DataTableProps = {
  columns: string[];
  rows: string[][];
  pageSize?: number;
};

export function DataTable({ columns, rows, pageSize = 10 }: DataTableProps) {
  const data = rows.map((cells, index) => ({ id: `${index}-${cells.join("-")}`, cells }));
  return <DomainTable<{ id: string; cells: string[] }> data={data} getKey={(row) => row.id} pageSize={pageSize} columns={columns.map((header, index) => ({ key: `${index}-${header}`, header, render: (row) => row.cells[index] ?? "", exportValue: (row) => row.cells[index] ?? "" }))} />;
}

type SplitPanelProps = {
  left: ReactNode;
  right: ReactNode;
};

export function SplitPanel({ left, right }: SplitPanelProps) {
  return <div className="grid gap-x-8 gap-y-10 2xl:gap-x-10 2xl:gap-y-12 xl:grid-cols-[1.15fr_0.85fr]">{left}{right}</div>;
}

export function LoadingPanel() {
  return (
    <div className="space-y-8 xl:space-y-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-5">
          <div className="h-7 w-24 animate-pulse rounded-full bg-secondary" />
          <div className="space-y-4">
            <div className="h-9 w-80 animate-pulse rounded-xl bg-secondary" />
            <div className="h-5 w-96 animate-pulse rounded-lg bg-secondary" />
          </div>
        </div>
        <div className="h-10 w-32 animate-pulse rounded-full bg-secondary" />
      </div>
      <div className="grid gap-8 md:grid-cols-2 2xl:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden border-border/70 bg-card/90">
            <CardContent className="space-y-4 p-7">
              <div className="h-4 w-28 animate-pulse rounded bg-secondary" />
              <div className="h-9 w-20 animate-pulse rounded-lg bg-secondary" />
              <div className="h-4 w-48 animate-pulse rounded bg-secondary" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-8 2xl:gap-10 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-dashed border-border/70 bg-card/80">
          <CardContent className="space-y-3 p-6">
            <div className="h-5 w-28 animate-pulse rounded-full bg-secondary" />
            <div className="h-8 w-48 animate-pulse rounded-xl bg-secondary" />
            <div className="grid gap-3 pt-4 md:grid-cols-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-secondary" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="border-dashed border-border/70 bg-card/80">
          <CardContent className="space-y-3 p-6">
            <div className="h-5 w-36 animate-pulse rounded-full bg-secondary" />
            <div className="space-y-3 pt-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
