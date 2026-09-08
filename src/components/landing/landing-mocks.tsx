"use client";

import type { ReactNode } from "react";
import { BadgeCheck, Bell, CalendarDays, Check, ChevronRight, Clock3, FileText, Play, Search, TrendingUp, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";

/* ==========================================================================
   MAQUETAS DE PRODUCTO
   ==========================================================================
   Piezas de interfaz reales —los mismos tokens, radios y tipografía que usa
   la aplicación— para enseñar el producto sin capturas de pantalla. Son
   decorativas: cada bloque va con `aria-hidden` y el texto que importa lo
   dice la sección que lo rodea. Los nombres son ficticios.
   ========================================================================== */

export function MockFrame({ title, children, className, dark = false }: { title: string; children: ReactNode; className?: string; dark?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "overflow-hidden rounded-xl border shadow-e4",
        dark ? "border-surface-dark-ink/10 bg-surface-dark-2 text-surface-dark-ink" : "border-line bg-surface-1 text-ink-1",
        className,
      )}
    >
      <div className={cn("flex items-center gap-2 border-b px-3 py-2", dark ? "border-surface-dark-ink/10" : "border-line bg-surface-2/60")}>
        <span className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-status-danger/70" />
          <span className="size-2.5 rounded-full bg-status-warning/70" />
          <span className="size-2.5 rounded-full bg-status-success/70" />
        </span>
        <span className={cn("ml-2 truncate text-2xs font-medium", dark ? "text-surface-dark-ink/70" : "text-ink-3")}>{title}</span>
      </div>
      {children}
    </div>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name.split(" ").map((part) => part[0]).slice(0, 2).join("");
  return <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-dark-3 text-2xs font-semibold text-surface-dark-ink", className)}>{initials}</span>;
}

function Tile({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "warning" | "success" }) {
  return (
    <div className="min-w-0 rounded-lg border border-line bg-surface-1 p-3">
      <p className="truncate text-2xs text-ink-3">{label}</p>
      <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-ink-1">{value}</p>
      <span className={cn("mt-2 inline-block size-1.5 rounded-full", tone === "warning" ? "bg-status-warning" : tone === "success" ? "bg-status-success" : "bg-ink-3/40")} />
    </div>
  );
}

function Bars({ values, accent = 4, className }: { values: number[]; accent?: number; className?: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className={cn("flex h-16 items-end gap-1.5", className)}>
      {values.map((value, index) => (
        <span
          key={index}
          className={cn("flex-1 rounded-sm", index === accent ? "bg-accent-fill" : "bg-ink-3/25")}
          style={{ height: `${Math.max(12, (value / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

/* ---- Panel principal (hero) ---------------------------------------------- */

export function MockDashboard() {
  const { t } = useLocale();
  return (
    <MockFrame title={t("landing.mock.windowTitle")}>
      <div className="grid gap-3 bg-canvas p-3 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-ink-3">{t("landing.mock.dashboard.eyebrow")}</p>
            <p className="text-sm font-semibold text-ink-1">{t("landing.mock.dashboard.title")}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-1 px-2 py-1 text-2xs text-ink-2">
            <Search className="size-3" />
            {t("landing.mock.search")}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Tile label={t("landing.mock.dashboard.tile1")} value="12" tone="warning" />
          <Tile label={t("landing.mock.dashboard.tile2")} value="4" />
          <Tile label={t("landing.mock.dashboard.tile3")} value="97%" tone="success" />
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-accent-line/40 bg-accent-fill/10 px-3 py-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent-fill text-surface-dark-1">
            <ChevronRight className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-2xs font-medium text-accent-ink">{t("landing.mock.dashboard.nextLabel")}</p>
            <p className="truncate text-xs font-semibold text-ink-1">{t("landing.mock.dashboard.next")}</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1.2fr_1fr]">
          <div className="rounded-lg border border-line bg-surface-1 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-ink-1">{t("landing.mock.dashboard.chart")}</p>
              <span className="inline-flex items-center gap-1 text-2xs text-status-success"><TrendingUp className="size-3" />+18%</span>
            </div>
            <Bars className="mt-3" values={[5, 8, 6, 9, 12, 7, 10]} />
          </div>
          <div className="rounded-lg border border-line bg-surface-1 p-3">
            <p className="text-xs font-semibold text-ink-1">{t("landing.mock.dashboard.pipeline")}</p>
            <ul className="mt-2 space-y-1.5">
              {[["Ana Torres", 82], ["Luis Mora", 61], ["Sofia Vega", 37]].map(([name, pct]) => (
                <li key={String(name)} className="flex min-w-0 items-center gap-2">
                  <Avatar name={String(name)} className="size-6 text-[9px]" />
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                    <span className="block h-full rounded-full bg-accent-line" style={{ width: `${pct}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </MockFrame>
  );
}

/** Tarjeta flotante: candidato listo para entrevista. */
export function MockCandidateCard({ className }: { className?: string }) {
  const { t } = useLocale();
  return (
    <div aria-hidden="true" className={cn("w-56 rounded-xl border border-line bg-surface-1 p-3 shadow-e3", className)}>
      <div className="flex items-center gap-2.5">
        <Avatar name="Ana Torres" className="size-9 bg-accent-fill text-surface-dark-1" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink-1">Ana Torres</p>
          <p className="truncate text-2xs text-ink-2">{t("landing.mock.candidate.role")}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-2xs text-ink-2">
        <CalendarDays className="size-3.5 text-accent-ink" />
        {t("landing.mock.candidate.when")}
      </div>
      <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-status-success/40 bg-status-success/10 px-2 py-0.5 text-2xs font-medium text-status-success">
        <Check className="size-3" />
        {t("landing.mock.candidate.status")}
      </span>
    </div>
  );
}

/** Tarjeta flotante: tarea de incorporación completada. */
export function MockTaskDone({ className }: { className?: string }) {
  const { t } = useLocale();
  return (
    <div aria-hidden="true" className={cn("flex w-52 items-center gap-3 rounded-xl border border-line bg-surface-1 p-3 shadow-e3", className)}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-status-success text-white">
        <BadgeCheck className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-ink-1">{t("landing.mock.task.title")}</p>
        <p className="truncate text-2xs text-ink-2">{t("landing.mock.task.detail")}</p>
      </div>
    </div>
  );
}

/** Tarjeta flotante: aviso. */
export function MockAlert({ className }: { className?: string }) {
  const { t } = useLocale();
  return (
    <div aria-hidden="true" className={cn("flex w-56 items-center gap-3 rounded-xl border border-status-warning/40 bg-surface-1 p-3 shadow-e3", className)}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-status-warning/15 text-status-warning">
        <Bell className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-ink-1">{t("landing.mock.alert.title")}</p>
        <p className="truncate text-2xs text-ink-2">{t("landing.mock.alert.detail")}</p>
      </div>
    </div>
  );
}

/* ---- Vistas por módulo --------------------------------------------------- */

export function MockRecruiting() {
  const { t } = useLocale();
  const columns = [
    { key: "review", people: ["Ana Torres", "Luis Mora", "Sofia Vega"] },
    { key: "interview", people: ["Marco Ruiz", "Nicole Salas"] },
    { key: "offer", people: ["Paula Leon"] },
  ] as const;
  return (
    <MockFrame title={t("landing.mock.recruiting.window")}>
      <div className="bg-canvas p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-ink-1">{t("landing.mock.recruiting.title")}</p>
          <span className="shrink-0 whitespace-nowrap rounded-full bg-accent-fill px-2.5 py-1 text-2xs font-semibold text-surface-dark-1">{t("landing.mock.recruiting.cta")}</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 [&>*]:min-w-0">
          {columns.map((column) => (
            <div key={column.key} className="min-w-0 rounded-lg border border-line bg-surface-2/60 p-2">
              <p className="flex items-center justify-between text-2xs font-semibold text-ink-2">
                {t(`landing.mock.recruiting.${column.key}`)}
                <span className="font-mono text-ink-3">{column.people.length}</span>
              </p>
              <ul className="mt-2 space-y-1.5">
                {column.people.map((name) => (
                  <li key={name} className="flex min-w-0 items-center gap-2 rounded-md border border-line bg-surface-1 p-1.5">
                    <Avatar name={name} className="hidden size-6 text-[9px] sm:flex" />
                    <span className="truncate text-2xs font-medium text-ink-1">{name}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </MockFrame>
  );
}

export function MockOnboarding() {
  const { t } = useLocale();
  const tasks = [
    { key: "contract", done: true },
    { key: "documents", done: true },
    { key: "signature", done: true },
    { key: "equipment", done: false },
    { key: "training", done: false },
  ] as const;
  return (
    <MockFrame title={t("landing.mock.onboarding.window")}>
      <div className="bg-canvas p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <Avatar name="Luis Mora" className="size-10 bg-accent-fill text-surface-dark-1" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-1">Luis Mora</p>
            <p className="text-2xs text-ink-2">{t("landing.mock.onboarding.subtitle")}</p>
          </div>
          <span className="font-mono text-sm font-semibold tabular-nums text-ink-1">60%</span>
        </div>
        <ol className="mt-3 flex gap-1">
          {tasks.map((task) => (
            <li key={task.key} className={cn("h-2 flex-1 rounded-full", task.done ? "bg-status-success" : "bg-surface-3")} />
          ))}
        </ol>
        <ul className="mt-3 space-y-1.5">
          {tasks.map((task) => (
            <li key={task.key} className="flex items-center gap-2.5 rounded-md border border-line bg-surface-1 px-2.5 py-2">
              <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full", task.done ? "bg-status-success text-white" : "border border-line-strong text-ink-3")}>
                {task.done ? <Check className="size-3" strokeWidth={3} /> : <Clock3 className="size-3" />}
              </span>
              <span className={cn("flex-1 text-xs", task.done ? "text-ink-2 line-through decoration-ink-3/50" : "font-medium text-ink-1")}>{t(`landing.mock.onboarding.${task.key}`)}</span>
              {!task.done ? <span className="rounded-full bg-accent-fill/15 px-2 py-0.5 text-2xs font-medium text-accent-ink">{t("landing.mock.onboarding.pending")}</span> : null}
            </li>
          ))}
        </ul>
      </div>
    </MockFrame>
  );
}

export function MockTraining() {
  const { t } = useLocale();
  return (
    <MockFrame title={t("landing.mock.training.window")}>
      <div className="grid gap-3 bg-canvas p-3 sm:grid-cols-[1.4fr_1fr] sm:p-4">
        <div>
          <div className="relative aspect-video overflow-hidden rounded-lg bg-surface-dark-1">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,hsl(38_94%_52%_/_.35),transparent_45%)]" />
            <span className="absolute left-1/2 top-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-surface-1 text-surface-dark-1 shadow-e2">
              <Play className="ml-0.5 size-5" fill="currentColor" />
            </span>
            <span className="absolute bottom-2 left-2 right-2 h-1 overflow-hidden rounded-full bg-surface-dark-ink/20">
              <span className="block h-full w-2/3 rounded-full bg-accent-fill" />
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold text-ink-1">{t("landing.mock.training.course")}</p>
          <p className="text-2xs text-ink-2">{t("landing.mock.training.lesson")}</p>
        </div>
        <div className="rounded-lg border border-line bg-surface-1 p-2.5">
          <p className="text-2xs font-semibold text-ink-2">{t("landing.mock.training.outline")}</p>
          <ol className="mt-2 space-y-1.5">
            {[true, true, false, false].map((done, index) => (
              <li key={index} className="flex items-center gap-2 text-2xs">
                <span className={cn("flex size-4 shrink-0 items-center justify-center rounded-full", done ? "bg-status-success text-white" : index === 2 ? "bg-accent-fill text-surface-dark-1" : "border border-line-strong text-ink-3")}>
                  {done ? <Check className="size-2.5" strokeWidth={3} /> : <span className="text-[8px] font-bold">{index + 1}</span>}
                </span>
                <span className={cn("truncate", index === 2 ? "font-semibold text-ink-1" : "text-ink-2")}>{t(`landing.mock.training.l${index + 1}`)}</span>
              </li>
            ))}
          </ol>
          <div className="mt-3 flex items-center gap-2 rounded-md bg-status-success/10 px-2 py-1.5 text-2xs font-medium text-status-success">
            <BadgeCheck className="size-3.5" />
            {t("landing.mock.training.certificate")}
          </div>
        </div>
      </div>
    </MockFrame>
  );
}

export function MockPeople() {
  const { t } = useLocale();
  const rows = [
    ["Ana Torres", "kitchen", "active"],
    ["Luis Mora", "floor", "onboarding"],
    ["Sofia Vega", "warehouse", "active"],
    ["Marco Ruiz", "kitchen", "active"],
  ] as const;
  return (
    <MockFrame title={t("landing.mock.people.window")}>
      <div className="bg-canvas p-3 sm:p-4">
        <div className="grid grid-cols-3 gap-2">
          <Tile label={t("landing.mock.people.tile1")} value="48" tone="success" />
          <Tile label={t("landing.mock.people.tile2")} value="3" tone="warning" />
          <Tile label={t("landing.mock.people.tile3")} value="2" />
        </div>
        <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-surface-1">
          {rows.map(([name, area, status]) => (
            <li key={name} className="flex items-center gap-2.5 px-2.5 py-2">
              <Avatar name={name} className="size-7 text-[10px]" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium text-ink-1">{name}</span>
                <span className="block truncate text-2xs text-ink-3">{t(`landing.mock.people.${area}`)}</span>
              </span>
              <span className={cn("rounded-full px-2 py-0.5 text-2xs font-medium", status === "active" ? "bg-status-success/10 text-status-success" : "bg-accent-fill/15 text-accent-ink")}>{t(`landing.mock.people.${status}`)}</span>
            </li>
          ))}
        </ul>
      </div>
    </MockFrame>
  );
}

export function MockInventory() {
  const { t } = useLocale();
  const items = [
    { key: "tomato", stock: 32, min: 40 },
    { key: "chicken", stock: 78, min: 30 },
    { key: "flour", stock: 55, min: 25 },
    { key: "oil", stock: 12, min: 20 },
  ] as const;
  return (
    <MockFrame title={t("landing.mock.inventory.window")}>
      <div className="bg-canvas p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-ink-1">{t("landing.mock.inventory.title")}</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-fill px-2.5 py-1 text-2xs font-semibold text-surface-dark-1">
            <Truck className="size-3" />
            {t("landing.mock.inventory.cta")}
          </span>
        </div>
        <ul className="mt-3 space-y-2">
          {items.map((item) => {
            const low = item.stock < item.min;
            return (
              <li key={item.key} className="rounded-lg border border-line bg-surface-1 p-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-ink-1">{t(`landing.mock.inventory.${item.key}`)}</span>
                  <span className={cn("font-mono tabular-nums", low ? "font-semibold text-status-warning" : "text-ink-2")}>{item.stock} kg</span>
                </div>
                <div className="relative mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-3">
                  <span className={cn("block h-full rounded-full", low ? "bg-status-warning" : "bg-status-success")} style={{ width: `${item.stock}%` }} />
                  <span className="absolute top-0 h-full w-0.5 bg-ink-1/50" style={{ left: `${item.min}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </MockFrame>
  );
}

export function MockProductivity() {
  const { t } = useLocale();
  return (
    <MockFrame title={t("landing.mock.productivity.window")}>
      <div className="grid gap-3 bg-canvas p-3 sm:grid-cols-[1.3fr_1fr] sm:p-4">
        <div className="rounded-lg border border-line bg-surface-1 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-ink-1">{t("landing.mock.productivity.chart")}</p>
            <span className="text-2xs text-ink-3">{t("landing.mock.productivity.period")}</span>
          </div>
          <Bars className="mt-3 h-24" values={[6, 9, 7, 11, 10, 13, 12, 15, 11, 14]} accent={7} />
        </div>
        <ul className="space-y-2">
          {[["kitchen", 92, "success"], ["floor", 74, "warning"], ["warehouse", 88, "success"]].map(([zone, value, tone]) => (
            <li key={String(zone)} className="rounded-lg border border-line bg-surface-1 p-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-ink-1">{t(`landing.mock.productivity.${zone}`)}</span>
                <span className="font-mono tabular-nums text-ink-2">{value}%</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-3">
                <span className={cn("block h-full rounded-full", tone === "warning" ? "bg-status-warning" : "bg-status-success")} style={{ width: `${value}%` }} />
              </div>
            </li>
          ))}
          <li className="flex items-center gap-2 rounded-lg border border-line bg-surface-1 p-2.5 text-2xs text-ink-2">
            <FileText className="size-3.5 text-ink-3" />
            {t("landing.mock.productivity.report")}
          </li>
        </ul>
      </div>
    </MockFrame>
  );
}
