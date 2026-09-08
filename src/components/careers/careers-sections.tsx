"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BellRing, Building2, CheckCircle2, FileText, MapPin, Search, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-provider";
import { Reveal, RevealGroup, RevealItem } from "@/components/public/motion";
import type { CareerPortalContext } from "@/lib/career-portals";

/* ==========================================================================
   PORTAL DE EMPLEOS · SECCIONES
   ==========================================================================
   La misma gramática visual de la portada —fondo grafito con retícula, luz
   ámbar que deriva, entradas cortas— aplicada a la única pantalla que ve
   alguien que busca trabajo. Aquí el protagonista no es el producto sino el
   buscador: por eso el campo vive dentro del hero y es lo primero que se
   puede tocar.
   ========================================================================== */

export type Facet = { value: string; label: string; count: number };

export function CareersHero({
  portal,
  search,
  onSearch,
  total,
  cities,
  companies,
  children,
}: {
  portal: CareerPortalContext | null;
  search: string;
  onSearch: (value: string) => void;
  total: number | null;
  cities: number;
  companies: number;
  children?: React.ReactNode;
}) {
  const { t } = useLocale();
  const reduce = useReducedMotion();
  const enter = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const, delay: reduce ? 0 : delay },
  });

  const eyebrow =
    portal?.type === "BRANDED"
      ? t("jobs.careerSite")
      : portal?.type === "PRIVATE_STANDARD"
        ? t("jobs.privatePortal")
        : t("jobs.jobsPortal");

  return (
    <section className="relative isolate overflow-hidden bg-[linear-gradient(160deg,hsl(213_40%_10%),hsl(213_34%_15%)_55%,hsl(206_30%_19%))] text-surface-dark-ink">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="public-grid public-grid-dark absolute inset-0" />
        <div className="public-glow absolute -right-32 -top-40 size-[34rem] rounded-full bg-accent-fill/25 blur-3xl" />
        <div className="public-glow-2 absolute -bottom-48 -left-24 size-[28rem] rounded-full bg-surface-dark-3 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-[1280px] px-4 pb-12 pt-8 sm:px-6 sm:pb-16 lg:pt-12">
        {children}

        <div className="mx-auto max-w-3xl text-center">
          {portal?.branding.logo ? (
            <motion.div {...enter(0)} className="mb-6 flex justify-center">
              <span className="flex items-center gap-3 rounded-full border border-surface-dark-ink/15 bg-surface-dark-ink/[0.06] py-2 pl-2 pr-4">
                <Image
                  src={portal.branding.logo}
                  alt={t("jobs.logoAlt", { company: portal.company?.name ?? t("applicant.portalFallback") })}
                  width={32}
                  height={32}
                  unoptimized
                  className="size-8 rounded-full bg-surface-1 object-contain"
                />
                <span className="min-w-0 truncate text-sm font-medium">{portal.company?.name}</span>
              </span>
            </motion.div>
          ) : (
            <motion.p {...enter(0)} className="inline-flex items-center gap-2 rounded-full border border-accent-fill/30 bg-accent-fill/10 px-3 py-1.5 text-sm font-medium text-accent-fill">
              <span className="size-1.5 rounded-full bg-accent-fill" />
              {eyebrow}
            </motion.p>
          )}

          <motion.h1
            {...enter(0.08)}
            style={{ fontFamily: "var(--career-font-family)" }}
            className="mt-6 text-balance text-center text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
          >
            {portal?.branding.title ?? t("jobs.defaultTitle")}
          </motion.h1>

          <motion.p
            {...enter(0.16)}
            style={{ fontFamily: "var(--career-font-family)" }}
            className="mx-auto mt-5 max-w-2xl text-pretty text-center text-lg leading-8 text-surface-dark-ink/80"
          >
            {portal?.branding.description ?? t("jobs.defaultDescription")}
          </motion.p>

          {/* ---- Buscador: lo primero que se puede tocar ----------------- */}
          <motion.div {...enter(0.24)} className="mx-auto mt-8 max-w-2xl">
            <label className="relative block">
              <span className="sr-only">{t("jobs.searchLabel")}</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-3" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => onSearch(event.target.value)}
                placeholder={t("jobs.searchPlaceholder")}
                autoComplete="off"
                className="h-14 w-full rounded-full border border-surface-dark-ink/15 bg-surface-1 pl-12 pr-12 text-base text-ink-1 shadow-e3 placeholder:text-ink-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-fill"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => onSearch("")}
                  aria-label={t("careers.clearSearch")}
                  className="absolute right-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-ink-3 hover:text-ink-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              ) : null}
            </label>
          </motion.div>

          {/* ---- Tres cifras reales del propio listado ------------------- */}
          {total !== null ? (
            <motion.dl {...enter(0.32)} className="mx-auto mt-8 flex max-w-xl flex-wrap items-center justify-center gap-x-8 gap-y-3">
              <Stat icon={<Send className="size-4" />} value={String(total)} label={t("careers.stat.openings")} />
              {cities > 0 ? <Stat icon={<MapPin className="size-4" />} value={String(cities)} label={t("careers.stat.cities")} /> : null}
              {companies > 1 ? <Stat icon={<Building2 className="size-4" />} value={String(companies)} label={t("careers.stat.companies")} /> : null}
            </motion.dl>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-full bg-surface-dark-ink/[0.08] text-accent-fill">{icon}</span>
      <span>
        <dt className="sr-only">{label}</dt>
        <dd className="text-left">
          <span className="block font-mono text-xl font-semibold leading-none tabular-nums">{value}</span>
          <span className="block text-2xs text-surface-dark-ink/65">{label}</span>
        </dd>
      </span>
    </div>
  );
}

/* ==========================================================================
   FILTROS
   ==========================================================================
   Las facetas salen de las vacantes que hay, no de una lista inventada: si
   nadie publica teletrabajo, «Remoto» no aparece. Cada faceta es un grupo de
   botones de selección única con `aria-pressed`, y el recuento va dentro del
   botón para que se sepa el resultado antes de pulsarlo.
   ========================================================================== */
export function CareersFilters({
  facets,
  selected,
  onSelect,
  onClear,
  resultCount,
  totalCount,
}: {
  facets: Array<{ key: string; label: string; options: Facet[] }>;
  selected: Record<string, string | null>;
  onSelect: (key: string, value: string | null) => void;
  onClear: () => void;
  resultCount: number;
  totalCount: number;
}) {
  const { t } = useLocale();
  const active = Object.values(selected).filter(Boolean).length;
  const visible = facets.filter((facet) => facet.options.length > 1);
  if (!visible.length && !active) {
    return (
      <p className="text-sm text-ink-2" role="status">
        {t("careers.results", { count: resultCount })}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {visible.map((facet) => (
        <div key={facet.key} className="flex flex-wrap items-center gap-2">
          <span className="mr-1 shrink-0 text-2xs font-semibold uppercase tracking-[0.12em] text-ink-3">{facet.label}</span>
          <div role="group" aria-label={facet.label} className="flex flex-wrap gap-2">
            {facet.options.map((option) => {
              const on = selected[facet.key] === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onSelect(facet.key, on ? null : option.value)}
                  className={cn(
                    "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                    on
                      ? "border-action bg-action text-on-action"
                      : "border-line bg-surface-1 text-ink-2 hover:border-line-strong hover:text-ink-1",
                  )}
                >
                  {option.label}
                  <span className={cn("font-mono text-2xs tabular-nums", on ? "text-on-action/70" : "text-ink-3")}>{option.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <p className="flex flex-wrap items-center gap-3 text-sm text-ink-2" role="status">
        {resultCount === totalCount
          ? t("careers.results", { count: resultCount })
          : t("careers.resultsFiltered", { count: resultCount, total: totalCount })}
        {active ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 font-medium text-accent-ink underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <X className="size-4" aria-hidden="true" />
            {t("careers.clearFilters")}
          </button>
        ) : null}
      </p>
    </div>
  );
}

/* ==========================================================================
   CÓMO ES POSTULARSE + CIERRE
   ==========================================================================
   Tres pasos y qué pasa después. Quien busca trabajo teme el silencio: lo
   que se promete aquí es exactamente lo que el producto hace —avisar en cada
   cambio de etapa—, no un plazo de respuesta que nadie puede garantizar.
   ========================================================================== */
export function CareersProcess({ trackHref }: { trackHref: string }) {
  const { t } = useLocale();
  const steps = [
    { key: "apply", icon: FileText },
    { key: "track", icon: BellRing },
    { key: "decide", icon: CheckCircle2 },
  ] as const;

  return (
    <section className="border-t border-line py-16 sm:py-20">
      <Reveal className="mx-auto max-w-2xl">
        <p className="text-center text-sm font-semibold text-accent-ink">{t("careers.process.eyebrow")}</p>
        <h2 className="mt-3 text-balance text-center text-3xl font-semibold tracking-tight text-ink-1 sm:text-4xl">{t("careers.process.title")}</h2>
        <p className="mt-4 text-pretty text-center text-base leading-7 text-ink-2">{t("careers.process.description")}</p>
      </Reveal>

      <RevealGroup as="ol" className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-3" stagger={0.1}>
        {steps.map(({ key, icon: Icon }, index) => (
          <RevealItem as="li" key={key} className="relative rounded-xl border border-line bg-surface-1 p-5">
            <span aria-hidden="true" className="absolute right-4 top-3 font-mono text-4xl font-semibold text-ink-3/15">0{index + 1}</span>
            <span className="flex size-11 items-center justify-center rounded-xl bg-surface-dark-1 text-accent-fill">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <p className="mt-5 text-base font-semibold text-ink-1">{t(`careers.process.${key}.title`)}</p>
            <p className="mt-1.5 text-sm leading-6 text-ink-2">{t(`careers.process.${key}.copy`)}</p>
          </RevealItem>
        ))}
      </RevealGroup>

      <Reveal delay={0.15} className="mx-auto mt-10 max-w-4xl">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-accent-line/30 bg-[radial-gradient(circle_at_88%_0%,hsl(38_94%_52%_/_.16),transparent_30%),linear-gradient(135deg,hsl(0_0%_100%),hsl(38_60%_96%))] px-6 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="min-w-0">
            <p className="text-lg font-semibold text-ink-1">{t("careers.track.title")}</p>
            <p className="mt-1 text-sm leading-6 text-ink-2">{t("careers.track.copy")}</p>
          </div>
          <Button asChild size="lg" className="shrink-0">
            <Link href={trackHref}>
              {t("landing.candidates.track")}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
