"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BarChart3, BriefcaseBusiness, Building2, CalendarCheck2, Check, ClipboardCheck, FileCheck2, GraduationCap, Handshake, KeyRound, LayoutGrid, MapPin, PackageCheck, Rocket, ShieldCheck, UserPlus, Users, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-provider";
import { Reveal, RevealGroup, RevealItem } from "@/components/public/motion";

/**
 * Los datos de la portada llevan CLAVE, no texto. El texto vive en el
 * diccionario y se resuelve dentro del componente, que es el único sitio con
 * acceso al idioma activo.
 */
const modules = [
  { icon: BriefcaseBusiness, key: "recruiting" },
  { icon: ClipboardCheck, key: "onboarding" },
  { icon: GraduationCap, key: "training" },
  { icon: Users, key: "people" },
  { icon: PackageCheck, key: "inventory" },
  { icon: UtensilsCrossed, key: "restaurant" },
  { icon: BarChart3, key: "productivity" },
] as const;

const lifecycle: ReadonlyArray<{ key: string; icon: LucideIcon }> = [
  { key: "vacancy", icon: BriefcaseBusiness },
  { key: "application", icon: UserPlus },
  { key: "interview", icon: CalendarCheck2 },
  { key: "hire", icon: Handshake },
  { key: "onboarding", icon: FileCheck2 },
  { key: "training", icon: GraduationCap },
  { key: "employee", icon: Users },
  { key: "productivity", icon: BarChart3 },
];

function SectionHeading({ eyebrow, title, description, align = "left", dark = false }: { eyebrow: string; title: string; description?: string; align?: "left" | "center"; dark?: boolean }) {
  return (
    <Reveal className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      <p className={cn("text-sm font-semibold", dark ? "text-accent-fill" : "text-accent-ink", align === "center" && "text-center")}>{eyebrow}</p>
      <h2 className={cn("mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl", dark ? "text-surface-dark-ink" : "text-ink-1", align === "center" && "text-center")}>{title}</h2>
      {description ? <p className={cn("mt-4 text-pretty text-base leading-7 sm:text-lg", dark ? "text-surface-dark-ink/80" : "text-ink-2", align === "center" && "text-center")}>{description}</p> : null}
    </Reveal>
  );
}

/* ==========================================================================
   CICLO DEL EMPLEADO
   ==========================================================================
   Ocho etapas sobre una línea que se dibuja al entrar en pantalla. Es el
   mismo paso a paso que la aplicación usa por dentro, así que quien entre
   después reconocerá el dibujo.
   ========================================================================== */
export function EmployeeLifecycle() {
  const { t } = useLocale();
  const reduce = useReducedMotion();
  return (
    <section id="soluciones" className="scroll-mt-24 py-16 sm:py-24">
      <SectionHeading eyebrow={t("landing.flow.eyebrow")} title={t("landing.flow.title")} description={t("landing.flow.description")} />

      <div className="relative mt-12">
        {/* Línea que se dibuja de izquierda a derecha (escritorio).

            Por debajo de `lg` esta línea NO existía, y con ella se perdía lo
            único que decía la sección: que son ocho etapas CONSECUTIVAS de un
            mismo flujo. En un teléfono quedaban ocho iconos sueltos en dos
            columnas, que es exactamente lo contrario —ocho funciones
            inconexas—. Debajo se dibuja el mismo trazo en vertical.

            El corte pasa de `lg` a `xl` porque entre 1024 y 1280 la lista era
            de cuatro columnas en DOS filas y esta línea, que es una sola
            horizontal, solo cruzaba la primera: la segunda fila de etapas se
            quedaba igual de suelta que en el teléfono. La horizontal solo tiene
            sentido donde las ocho etapas caben en una fila.

            Y el trazo ya no llega al borde: empieza en el centro del primer
            icono y termina en el del último. Antes seguía más allá de
            «Productividad» hasta el margen, como si el flujo continuara. */}
        <div aria-hidden="true" className="pointer-events-none absolute left-8 right-[calc(12.5%-2rem)] top-8 hidden h-1 xl:block">
        <svg className="h-full w-full" viewBox="0 0 100 1" preserveAspectRatio="none">
          <line x1="0" y1="0.5" x2="100" y2="0.5" stroke="hsl(var(--line))" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <motion.line
            x1="0"
            y1="0.5"
            x2="100"
            y2="0.5"
            stroke="hsl(var(--accent-line))"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, margin: "-20% 0px" }}
            transition={{ duration: 1.6, ease: "easeInOut" }}
          />
        </svg>
        </div>

        {/* Por debajo de `xl` cada etapa es una TARJETA, no un renglón.

            Un riel fino con ocho iconos y ocho palabras sueltas es un gráfico
            de líneas, no una pieza de portada: deja media pantalla vacía a la
            derecha y no tiene dónde apoyar la vista. La tarjeta ocupa el ancho,
            da sitio al rótulo de etapa —`landing.flow.stageBadge`, que ya
            estaba traducido en los dos idiomas y no lo usaba nadie— y convierte
            el trazo en un eslabón corto entre piezas, que es lo que se lee como
            cadena.

            El tramo entre tarjetas crece de arriba abajo al entrar en pantalla,
            uno detrás de otro: la animación del flujo se conserva, y ahora
            además se ve, porque es ámbar sobre la separación y no un pelo de
            1px cruzando iconos. */}
        {/* De `md` a `xl` la tarjeta a ancho completo dejaba media pantalla
            vacía a su derecha, así que ahí van dos columnas. Se llenan por
            COLUMNAS (`grid-flow-col` con cuatro filas): 1-4 a la izquierda y
            5-8 a la derecha, de modo que la cadena sigue leyéndose hacia abajo
            y el eslabón entre tarjetas sigue significando lo que significa. */}
        <RevealGroup
          as="ol"
          className="grid grid-cols-1 gap-4 md:grid-flow-col md:grid-cols-2 md:grid-rows-4 xl:grid-flow-row xl:grid-cols-8 xl:grid-rows-1"
          stagger={0.07}
        >
          {lifecycle.map(({ key, icon: Icon }, index) => (
            <RevealItem as="li" key={key} className="relative">
              {index > 0 ? (
                <motion.span
                  aria-hidden="true"
                  className={cn(
                    "absolute -top-4 left-[2.375rem] h-4 w-0.5 origin-top -translate-x-1/2 rounded-full bg-accent-line/60 xl:hidden",
                    // La quinta etapa encabeza la segunda columna: ahí no hay
                    // nada encima con lo que encadenar.
                    index === 4 && "md:hidden",
                  )}
                  initial={reduce ? { scaleY: 1 } : { scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true, margin: "-15% 0px" }}
                  transition={{ duration: 0.3, ease: "easeOut", delay: reduce ? 0 : 0.04 * index }}
                />
              ) : null}

              <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface-1 px-4 py-3.5 shadow-e1 transition-colors hover:border-line-strong xl:block xl:rounded-none xl:border-0 xl:bg-transparent xl:p-0 xl:shadow-none xl:hover:border-0">
                <span className="relative z-10 flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-fill/15 text-accent-ink xl:size-16 xl:rounded-2xl xl:border xl:border-line xl:bg-surface-1 xl:shadow-e2">
                  <Icon className="size-5 xl:size-6" aria-hidden="true" />
                  {/* En escritorio el número vive sobre el icono; en tarjeta
                      sería un segundo distintivo diciendo lo mismo que el
                      rótulo «Etapa N», así que allí no se dibuja. */}
                  <span className="absolute -right-1.5 -top-1.5 hidden size-6 items-center justify-center rounded-full bg-accent-fill font-mono text-2xs font-semibold text-surface-dark-1 xl:flex">{index + 1}</span>
                </span>
                <span className="min-w-0 flex-1 xl:mt-3 xl:block">
                  <span className="block text-2xs font-medium uppercase tracking-[0.12em] text-ink-3 xl:hidden">
                    {t("landing.flow.stageBadge", { number: index + 1 })}
                  </span>
                  <span className="mt-0.5 block text-base font-semibold text-ink-1 xl:mt-0">{t(`landing.lifecycle.${key}`)}</span>
                </span>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>

      <Reveal delay={0.2} className="mt-10 grid gap-4 sm:grid-cols-3">
        {(["context", "history", "handoff"] as const).map((key) => (
          <div key={key} className="rounded-xl border border-line bg-surface-1 p-5">
            <p className="text-base font-semibold text-ink-1">{t(`landing.flow.${key}.title`)}</p>
            <p className="mt-2 text-sm leading-6 text-ink-2">{t(`landing.flow.${key}.copy`)}</p>
          </div>
        ))}
      </Reveal>
    </section>
  );
}

/* ==========================================================================
   MULTIEMPRESA · MULTISUCURSAL
   ==========================================================================
   Un dibujo de la estructura real: la empresa arriba, las sucursales debajo,
   conectadas; y en cada sucursal las cosas que viven dentro de su alcance.
   ========================================================================== */
export function MultiBranchSection() {
  const { t } = useLocale();
  const reduce = useReducedMotion();
  const branches = ["b1", "b2", "b3"] as const;
  return (
    <section className="py-16 sm:py-24">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHeading eyebrow={t("landing.branches.eyebrow")} title={t("landing.branches.title")} description={t("landing.branches.description")} />
          <RevealGroup as="ul" className="mt-8 grid gap-3 sm:grid-cols-2" stagger={0.06}>
            {([["f1", KeyRound], ["f2", Users], ["f3", LayoutGrid], ["f4", BarChart3]] as const).map(([key, Icon]) => (
              <RevealItem as="li" key={key} className="flex items-center gap-3 rounded-xl border border-line bg-surface-1 p-4 text-sm font-medium text-ink-1">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-fill/15 text-accent-ink">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                {t(`landing.branches.${key}`)}
              </RevealItem>
            ))}
          </RevealGroup>
        </div>

        <Reveal delay={0.1}>
          <figure className="relative rounded-2xl border border-line bg-[linear-gradient(160deg,hsl(var(--surface-2)),hsl(var(--canvas)))] p-6 sm:p-8">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 public-grid rounded-2xl opacity-40" />
            <figcaption className="sr-only">{t("landing.branches.figureAlt")}</figcaption>
            <div className="relative">
              <div className="mx-auto flex w-fit items-center gap-3 rounded-xl border border-surface-dark-ink/10 bg-surface-dark-1 px-5 py-3 text-surface-dark-ink shadow-e3">
                <Building2 className="size-5 text-accent-fill" aria-hidden="true" />
                <span className="text-sm font-semibold">{t("landing.branches.parent")}</span>
                <span className="ml-2 rounded-full bg-surface-dark-ink/10 px-2 py-0.5 text-2xs">{t("landing.branches.parentTag")}</span>
              </div>

              {/* Abanico, solo cuando las tres sucursales están en fila.

                  Dos correcciones: el ancho estaba limitado a `max-w-md` y
                  centrado mientras que las tarjetas ocupaban todo el
                  contenedor, así que las curvas exteriores no llegaban al
                  centro de su tarjeta; y los extremos estaban en el 15% y el
                  85% cuando los centros de tres columnas iguales están en 1/6 y
                  5/6. Con `preserveAspectRatio="none"` el trazo se estira con
                  el contenedor y aterriza donde debe a cualquier ancho;
                  `non-scaling-stroke` evita que ese estirado deforme el grosor. */}
              <svg aria-hidden="true" className="mx-auto mt-2 hidden h-14 w-full sm:block" viewBox="0 0 400 56" fill="none" preserveAspectRatio="none">
                {[200 / 3, 200, 1000 / 3].map((x, index) => (
                  <motion.path
                    key={x}
                    d={`M200 0 C200 28, ${x} 28, ${x} 56`}
                    stroke="hsl(var(--accent-line))"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, delay: 0.15 * index, ease: "easeInOut" }}
                  />
                ))}
              </svg>

              {/* En teléfono las tres tarjetas se apilan: en tres columnas
                  medían 85px, el nombre de la ciudad se recortaba a «Mia…» y
                  cada elemento del alcance caía en tres líneas. El abanico se
                  sustituye por un tronco vertical al costado, que dice lo
                  mismo —cuelgan de la empresa— sin pedir tres columnas. */}
              <div className="relative mt-4 pl-6 sm:mt-0 sm:pl-0">
                <div aria-hidden="true" className="pointer-events-none absolute -top-4 bottom-6 left-1.5 w-0.5 sm:hidden">
                <svg className="h-full w-full" viewBox="0 0 1 100" preserveAspectRatio="none">
                  <motion.line
                    x1="0.5"
                    y1="0"
                    x2="0.5"
                    y2="100"
                    stroke="hsl(var(--accent-line))"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, ease: "easeInOut" }}
                  />
                </svg>
                </div>
                <RevealGroup as="ul" className="grid grid-cols-1 gap-3 sm:grid-cols-3" stagger={0.12}>
                {branches.map((branch) => (
                  <RevealItem as="li" key={branch} className="min-w-0 rounded-xl border border-line bg-surface-1 p-3 shadow-e1 sm:p-4">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-ink-1">
                      <MapPin className="size-3.5 shrink-0 text-accent-ink" aria-hidden="true" />
                      <span className="truncate">{t(`landing.branches.city.${branch}`)}</span>
                    </p>
                    <ul className="mt-3 space-y-1.5">
                      {(["scope1", "scope2", "scope3"] as const).map((scope) => (
                        <li key={scope} className="flex items-start gap-1.5 text-2xs leading-4 text-ink-2 sm:text-xs">
                          <span className="mt-1 size-1.5 shrink-0 rounded-full bg-status-success" />
                          <span>{t(`landing.branches.${scope}`)}</span>
                        </li>
                      ))}
                    </ul>
                  </RevealItem>
                ))}
                </RevealGroup>
              </div>
              <p className="mt-4 flex items-center justify-center gap-2 text-xs text-ink-2">
                <ShieldCheck className="size-4 text-status-success" aria-hidden="true" />
                {t("landing.branches.branchNote")}
              </p>
            </div>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}

/* ==========================================================================
   MÓDULOS A MEDIDA · ROLES
   ========================================================================== */
export function FlexibleModulesAndRoles() {
  const { t } = useLocale();
  const [enabled, setEnabled] = useState<Record<string, boolean>>({ recruiting: true, onboarding: true, training: true, people: true });
  const roles = ["admin", "hr", "supervisor", "instructor", "employee", "candidate"] as const;
  const count = Object.values(enabled).filter(Boolean).length;

  return (
    <>
      <section id="planes" className="scroll-mt-24 py-16 sm:py-24">
        <div className="rounded-3xl border border-surface-dark-ink/10 bg-surface-dark-1 p-6 text-surface-dark-ink sm:p-10 lg:p-14">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] lg:items-center">
            <SectionHeading dark eyebrow={t("landing.plans.eyebrow")} title={t("landing.plans.title")} description={t("landing.plans.description")} />
            <Reveal delay={0.1}>
              <p className="mb-3 text-sm text-surface-dark-ink/70">{t("landing.plans.hint")}</p>
              <ul className="grid gap-2 sm:grid-cols-2" aria-label={t("landing.plans.listAria")}>
                {modules.map(({ key, icon: Icon }) => {
                  const on = Boolean(enabled[key]);
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={on}
                        onClick={() => setEnabled((current) => ({ ...current, [key]: !current[key] }))}
                        className={cn(
                          "flex min-h-[var(--control-h-touch)] w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-fill",
                          on ? "border-accent-fill/50 bg-accent-fill/10 text-surface-dark-ink" : "border-surface-dark-ink/10 bg-surface-dark-ink/[0.04] text-surface-dark-ink/70 hover:bg-surface-dark-ink/[0.08]",
                        )}
                      >
                        <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-md transition-colors", on ? "bg-accent-fill text-surface-dark-1" : "border border-surface-dark-ink/25")}>
                          {on ? <Check className="size-3.5" strokeWidth={3} aria-hidden="true" /> : null}
                        </span>
                        <Icon className="size-4 shrink-0 text-accent-fill" aria-hidden="true" />
                        {t(`landing.modules.${key}.title`)}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 text-sm text-surface-dark-ink/70" aria-live="polite">{t("landing.plans.count", { count })}</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="pb-16 sm:pb-24">
        <SectionHeading align="center" eyebrow={t("landing.roles.eyebrow")} title={t("landing.roles.title")} description={t("landing.roles.description")} />
        <RevealGroup as="ul" className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" stagger={0.06}>
          {roles.map((role) => (
            <RevealItem as="li" key={role} className="rounded-xl border border-line bg-surface-1 p-4 text-center">
              <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-surface-dark-1 text-sm font-semibold text-surface-dark-ink">{t(`landing.roles.${role}`).slice(0, 1)}</span>
              <p className="mt-3 text-center text-sm font-semibold text-ink-1">{t(`landing.roles.${role}`)}</p>
              <p className="mt-1 text-center text-xs leading-5 text-ink-2">{t(`landing.roles.${role}Hint`)}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>
    </>
  );
}

/* ==========================================================================
   CÓMO FUNCIONA
   ========================================================================== */
export function HowItWorks() {
  const { t } = useLocale();
  const steps = [
    { icon: Building2, key: "register" },
    { icon: Users, key: "configure" },
    { icon: LayoutGrid, key: "modules" },
    { icon: Rocket, key: "operate" },
  ] as const;
  return (
    <section id="como-funciona" className="scroll-mt-24 py-16 sm:py-24">
      <SectionHeading eyebrow={t("landing.how.eyebrow")} title={t("landing.how.title")} description={t("landing.how.description")} />
      <RevealGroup as="ol" className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4" stagger={0.1}>
        {steps.map(({ icon: Icon, key }, index) => (
          <RevealItem as="li" key={key} className="relative rounded-2xl border border-line bg-surface-1 p-6 shadow-e1">
            <span aria-hidden="true" className="absolute right-5 top-4 font-mono text-5xl font-semibold text-ink-3/15">0{index + 1}</span>
            <span className="flex size-12 items-center justify-center rounded-xl bg-surface-dark-1 text-accent-fill shadow-e2">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <p className="mt-6 text-lg font-semibold text-ink-1">{t(`landing.how.${key}.title`)}</p>
            <p className="mt-2 text-sm leading-6 text-ink-2">{t(`landing.how.${key}.copy`)}</p>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}

/* ==========================================================================
   PORTAL DE CANDIDATOS (se conserva el bloque aprobado)
   ========================================================================== */
export function CandidateSection() {
  const { t } = useLocale();
  const steps = ["application", "interview", "offer"] as const;
  return (
    <Reveal as="section" className="relative scroll-mt-24 overflow-hidden rounded-3xl border border-accent-line/25 bg-[radial-gradient(circle_at_88%_0%,hsl(38_94%_52%_/_.16),transparent_28%),linear-gradient(135deg,hsl(0_0%_100%)_0%,hsl(38_60%_96%)_55%,hsl(38_70%_94%)_100%)] px-5 py-10 shadow-e2 sm:px-8 sm:py-14">
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 bottom-0 size-64 rounded-full bg-accent-fill/20 blur-3xl" />
      <div id="candidatos" className="relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:items-center">
        <div>
          <p className="text-sm font-semibold text-accent-ink">{t("landing.candidates.eyebrow")}</p>
          <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight text-ink-1 sm:text-5xl">{t("landing.candidates.title")}</h2>
          <p className="mt-4 max-w-xl text-pretty text-lg leading-8 text-ink-2">{t("landing.candidates.detail")}</p>
          <ul className="mt-5 flex flex-wrap gap-2" aria-label={t("landing.candidates.eyebrow")}>
            {["jobs", "tracking"].map((chip) => (
              <li key={chip} className="rounded-full border border-line bg-surface-1/80 px-4 py-1.5 text-sm font-medium text-ink-1">
                {t(`landing.candidates.chip.${chip}`)}
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="sm:min-w-48">
              <Link href="/jobs">{t("landing.candidates.viewJobs")}<ArrowRight className="size-4" aria-hidden="true" /></Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="sm:min-w-48">
              <Link href="/application-status">{t("landing.candidates.track")}</Link>
            </Button>
          </div>
        </div>

        <div aria-hidden="true" className="rounded-2xl border border-line bg-surface-1/90 p-5 shadow-e3 backdrop-blur sm:p-6">
          <div className="flex flex-wrap items-start gap-3 sm:gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent-fill/15 text-accent-ink">
              <BriefcaseBusiness className="size-5" />
            </span>
            <div className="min-w-0 flex-1 basis-40">
              <p className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-ink">{t("landing.candidates.preview.label")}</p>
              <p className="mt-0.5 text-lg font-semibold text-ink-1">{t("landing.candidates.preview.title")}</p>
              <p className="text-sm text-ink-2">{t("landing.candidates.preview.role")}</p>
            </div>
            <span className="shrink-0 rounded-full bg-status-success/10 px-3 py-1 text-xs font-semibold text-status-success sm:ml-auto">{t("landing.candidates.preview.status")}</span>
          </div>
          <ol className="mt-6 grid grid-cols-3 gap-2">
            {steps.map((step, index) => (
              <li key={step}>
                <span className={`block h-2 rounded-full ${index < 2 ? "bg-accent-fill" : "bg-accent-fill/20"}`} />
                <span className="mt-2 block text-sm text-ink-2">{t(`landing.candidates.preview.step.${step}`)}</span>
              </li>
            ))}
          </ol>
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-accent-line/30 bg-accent-fill/[.07] p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-1 text-accent-ink shadow-sm">
              <CalendarCheck2 className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-1">{t("landing.candidates.preview.nextLabel")}</p>
              <p className="text-sm text-ink-2">{t("landing.candidates.preview.next")}</p>
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            <div className="min-w-0 rounded-xl bg-surface-2 p-3 sm:p-4">
              <dt className="text-xs text-ink-2 sm:text-sm">{t("landing.candidates.preview.stagesLabel")}</dt>
              <dd className="mt-1 text-xl font-semibold text-ink-1">{t("landing.candidates.preview.stagesValue")}</dd>
            </div>
            <div className="min-w-0 rounded-xl bg-surface-2 p-3 sm:p-4">
              <dt className="text-xs text-ink-2 sm:text-sm">{t("landing.candidates.preview.updatesLabel")}</dt>
              <dd className="mt-1 text-xl font-semibold text-ink-1">{t("landing.candidates.preview.updatesValue")}</dd>
            </div>
          </dl>
          <p className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-surface-1 px-4 py-3 text-sm text-ink-1">
            <Check className="size-4 shrink-0 text-status-success" />
            {t("landing.candidates.preview.note")}
          </p>
        </div>
      </div>
    </Reveal>
  );
}

/* ==========================================================================
   CIERRE Y PIE
   ========================================================================== */
export function FinalCTA() {
  const { t } = useLocale();
  return (
    <Reveal as="section" className="relative overflow-hidden rounded-3xl bg-surface-dark-1 px-6 py-14 text-surface-dark-ink sm:px-12 sm:py-20">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="public-grid public-grid-dark absolute inset-0" />
        <div className="public-glow absolute -right-24 -top-24 size-96 rounded-full bg-accent-fill/25 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-3xl text-center">
        <p className="text-center text-sm font-semibold text-accent-fill">TalentOS</p>
        <h2 className="mt-3 text-balance text-center text-3xl font-semibold tracking-tight sm:text-5xl">{t("landing.final.title")}</h2>
        <p className="mt-4 text-pretty text-center text-lg leading-8 text-surface-dark-ink/80">{t("landing.final.description")}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-12 bg-accent-fill px-6 text-base text-surface-dark-1 shadow-lg shadow-accent-fill/25 hover:bg-accent-fill/90">
            <Link href="/register-company">{t("landing.cta.register")}<ArrowRight className="size-4" aria-hidden="true" /></Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="h-12 border-surface-dark-ink/25 bg-transparent px-6 text-base text-surface-dark-ink hover:bg-surface-dark-ink/10">
            <Link href="/login">{t("auth.login")}</Link>
          </Button>
        </div>
      </div>
    </Reveal>
  );
}

export function LandingFooter() {
  const { t } = useLocale();
  return (
    <footer className="grid gap-8 border-t border-line py-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
      <div>
        <p className="flex items-center gap-2 text-lg font-semibold text-ink-1">
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent-fill text-sm font-bold text-surface-dark-1">T</span>
          TalentOS
        </p>
        <p className="mt-3 max-w-xs text-sm leading-6 text-ink-2">{t("landing.footer.tagline")}</p>
      </div>
      <FooterColumn title={t("landing.product.eyebrow")} links={modules.map(({ key }) => [t(`landing.modules.${key}.title`), "#producto"])} />
      <FooterColumn title={t("landing.footer.resources")} links={[[t("landing.nav.jobs"), "/jobs"], [t("landing.nav.trackApplication"), "/application-status"], [t("auth.login"), "/login"]]} />
      <FooterColumn title={t("landing.footer.company")} links={[[t("landing.cta.register"), "/register-company"], [t("landing.nav.modules"), "#planes"], [t("landing.nav.howItWorks"), "#como-funciona"]]} />
      <p className="text-xs text-ink-3 sm:col-span-2 lg:col-span-4">{t("landing.footer.rights", { year: new Date().getFullYear() })}</p>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: string[][] }) {
  return (
    <div>
      <p className="text-sm font-semibold text-ink-1">{title}</p>
      <ul className="mt-2 space-y-0">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="inline-flex min-h-11 items-center text-sm text-ink-2 hover:text-ink-1">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
