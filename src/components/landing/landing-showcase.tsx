"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BarChart3, BriefcaseBusiness, Check, ClipboardCheck, GraduationCap, PackageCheck, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";
import { Reveal } from "@/components/landing/landing-motion";
import { MockInventory, MockOnboarding, MockPeople, MockProductivity, MockRecruiting, MockTraining } from "@/components/landing/landing-mocks";

/* ==========================================================================
   PORTADA · MÓDULOS
   ==========================================================================
   Un módulo cada vez, con su pantalla al lado. La lista de la izquierda es
   una lista de pestañas (teclado: flechas) y rota sola cada siete segundos
   hasta que alguien elige; entonces se queda donde está. La barra bajo la
   pestaña activa es el tiempo que falta para pasar a la siguiente.
   ========================================================================== */

const SHOWCASE: ReadonlyArray<{ key: string; icon: LucideIcon; mock: () => React.JSX.Element }> = [
  { key: "recruiting", icon: BriefcaseBusiness, mock: MockRecruiting },
  { key: "onboarding", icon: ClipboardCheck, mock: MockOnboarding },
  { key: "training", icon: GraduationCap, mock: MockTraining },
  { key: "people", icon: Users, mock: MockPeople },
  { key: "inventory", icon: PackageCheck, mock: MockInventory },
  { key: "productivity", icon: BarChart3, mock: MockProductivity },
];

const INTERVAL = 7000;

export function ModulesShowcase() {
  const { t } = useLocale();
  const reduce = useReducedMotion();
  const baseId = useId();
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const [paused, setPaused] = useState(false);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!auto || paused || reduce) return;
    const id = window.setTimeout(() => setActive((current) => (current + 1) % SHOWCASE.length), INTERVAL);
    return () => window.clearTimeout(id);
  }, [active, auto, paused, reduce]);

  const choose = (index: number) => {
    setActive(index);
    setAuto(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const delta = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = (index + delta + SHOWCASE.length) % SHOWCASE.length;
    choose(next);
    tabRefs.current[next]?.focus();
  };

  const current = SHOWCASE[active];
  const Mock = current.mock;

  return (
    <section id="producto" className="scroll-mt-24 py-16 sm:py-24">
      <Reveal className="max-w-2xl">
        <p className="text-sm font-semibold text-accent-ink">{t("landing.product.eyebrow")}</p>
        <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-ink-1 sm:text-4xl lg:text-5xl">{t("landing.product.title")}</h2>
        <p className="mt-4 text-pretty text-base leading-7 text-ink-2 sm:text-lg">{t("landing.product.description")}</p>
      </Reveal>

      <div
        className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.35fr)] lg:items-start [&>*]:min-w-0"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <Reveal className="min-w-0">
          {/* Móvil: fila de fichas desplazable; escritorio: lista vertical con el texto del módulo activo. */}
          <div role="tablist" aria-orientation="vertical" aria-label={t("landing.product.tabsAria")} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] lg:mx-0 lg:grid lg:overflow-visible lg:px-0 lg:pb-0">
            {SHOWCASE.map(({ key, icon: Icon }, index) => {
              const selected = index === active;
              return (
                <button
                  key={key}
                  ref={(node) => { tabRefs.current[index] = node; }}
                  id={`${baseId}-tab-${key}`}
                  role="tab"
                  type="button"
                  aria-selected={selected}
                  aria-controls={`${baseId}-panel`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => choose(index)}
                  onKeyDown={(event) => onKeyDown(event, index)}
                  className={cn(
                    "group relative shrink-0 overflow-hidden rounded-xl border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus lg:w-full lg:p-4",
                    selected ? "border-accent-line/50 bg-surface-1 shadow-e2" : "border-line bg-surface-1/60 hover:border-line-strong lg:border-transparent lg:bg-transparent lg:hover:border-line lg:hover:bg-surface-1/70",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors", selected ? "bg-accent-fill text-surface-dark-1" : "bg-surface-2 text-ink-2 group-hover:text-ink-1")}>
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className={cn("block whitespace-nowrap text-sm font-semibold lg:whitespace-normal lg:text-base", selected ? "text-ink-1" : "text-ink-2 group-hover:text-ink-1")}>{t(`landing.modules.${key}.title`)}</span>
                      <AnimatePresence initial={false}>
                        {selected ? (
                          <motion.span
                            key="copy"
                            className="hidden overflow-hidden text-sm leading-6 text-ink-2 lg:block"
                            initial={reduce ? false : { height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={reduce ? undefined : { height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                          >
                            {t(`landing.modules.${key}.copy`)}
                          </motion.span>
                        ) : null}
                      </AnimatePresence>
                    </span>
                  </span>
                  {selected && auto && !reduce ? (
                    <motion.span
                      key={`progress-${active}`}
                      aria-hidden="true"
                      className="absolute bottom-0 left-0 h-0.5 bg-accent-fill"
                      initial={{ width: "0%" }}
                      animate={{ width: paused ? undefined : "100%" }}
                      transition={{ duration: INTERVAL / 1000, ease: "linear" }}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </Reveal>

        <Reveal delay={0.1} className="min-w-0">
          <div
            id={`${baseId}-panel`}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-${current.key}`}
            className="relative min-w-0 overflow-hidden rounded-2xl border border-line bg-[linear-gradient(160deg,hsl(var(--surface-2)),hsl(var(--canvas)))] p-3 sm:p-6 [&>*]:min-w-0"
          >
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 landing-grid rounded-2xl opacity-40" />
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={current.key}
                className="relative"
                initial={reduce ? false : { opacity: 0, y: 14, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduce ? undefined : { opacity: 0, y: -10, scale: 0.99 }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              >
                <Mock />
              </motion.div>
            </AnimatePresence>
          </div>
          <p className="mt-4 text-sm leading-6 text-ink-2 lg:hidden">{t(`landing.modules.${current.key}.copy`)}</p>
          <ul className="mt-3 flex flex-wrap gap-2 lg:mt-4" aria-label={t("landing.product.featuresAria")}>
            {[1, 2, 3].map((n) => (
              <li key={`${current.key}-${n}`} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-1 px-3 py-1.5 text-sm text-ink-1">
                <Check className="size-3.5 text-status-success" aria-hidden="true" />
                {t(`landing.modules.${current.key}.f${n}`)}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
