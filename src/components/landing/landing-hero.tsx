"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BarChart3, BriefcaseBusiness, Building2, ClipboardCheck, GraduationCap, PackageCheck, ShieldCheck, Users, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-provider";
import { Float, RotatingWord } from "@/components/landing/landing-motion";
import { MockAlert, MockCandidateCard, MockDashboard, MockTaskDone } from "@/components/landing/landing-mocks";

/* ==========================================================================
   PORTADA · HERO
   ==========================================================================
   Una promesa, dos botones y el producto de verdad al lado: el panel de un
   módulo tal como se ve dentro, con tres tarjetas que asoman por encima
   para contar lo que pasa en él (una candidata confirmada, una tarea
   cerrada, un aviso). Nada de personas de archivo ni de formas abstractas.
   ========================================================================== */

const MODULES = [
  { key: "recruiting", icon: BriefcaseBusiness },
  { key: "onboarding", icon: ClipboardCheck },
  { key: "training", icon: GraduationCap },
  { key: "people", icon: Users },
  { key: "inventory", icon: PackageCheck },
  { key: "restaurant", icon: UtensilsCrossed },
  { key: "productivity", icon: BarChart3 },
  { key: "branches", icon: Building2 },
] as const;

export function HeroSection() {
  const { t } = useLocale();
  const reduce = useReducedMotion();
  const words = [t("landing.hero.word1"), t("landing.hero.word2"), t("landing.hero.word3"), t("landing.hero.word4")];

  const enter = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 24, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const, delay: reduce ? 0 : delay },
  });

  return (
    <section className="relative isolate">
      {/* Fondo: rejilla fina y dos luces que se mueven muy despacio. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="landing-grid landing-grid-dark absolute inset-0" />
        <div className="landing-glow absolute -top-40 right-[-10%] size-[42rem] rounded-full bg-accent-fill/25 blur-3xl" />
        <div className="landing-glow-2 absolute -bottom-52 left-[-15%] size-[36rem] rounded-full bg-surface-dark-3 blur-3xl" />
      </div>

      <div className="grid gap-12 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:py-20">
        <div className="max-w-2xl">
          <motion.p {...enter(0)} className="inline-flex items-center gap-2 rounded-full border border-accent-fill/30 bg-accent-fill/10 px-3 py-1.5 text-sm font-medium text-accent-fill">
            <span className="size-1.5 rounded-full bg-accent-fill" />
            {t("landing.hero.eyebrow")}
          </motion.p>

          <motion.h1 {...enter(0.08)} className="mt-6 text-balance text-[2.6rem] font-semibold leading-[1.02] tracking-tight text-surface-dark-ink sm:text-6xl lg:text-[4.1rem]">
            <RotatingWord words={words} className="text-accent-fill" /> {t("landing.hero.titleRest")}
          </motion.h1>

          <motion.p {...enter(0.16)} className="mt-6 max-w-xl text-pretty text-lg leading-8 text-surface-dark-ink/80">
            {t("landing.hero.description")}
          </motion.p>

          <motion.div {...enter(0.24)} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 bg-accent-fill px-6 text-base text-surface-dark-1 shadow-lg shadow-accent-fill/25 hover:bg-accent-fill/90">
              <Link href="/register-company">
                {t("landing.hero.start")}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="h-12 border-surface-dark-ink/20 bg-surface-dark-ink/10 px-6 text-base text-surface-dark-ink hover:bg-surface-dark-ink/15">
              <a href="#producto">{t("landing.hero.explore")}</a>
            </Button>
          </motion.div>

          <motion.ul {...enter(0.32)} className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-surface-dark-ink/70">
            {(["trust1", "trust2", "trust3"] as const).map((key) => (
              <li key={key} className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-accent-fill" aria-hidden="true" />
                {t(`landing.hero.${key}`)}
              </li>
            ))}
          </motion.ul>
        </div>

        {/* ---- Composición de producto ------------------------------------ */}
        <div className="relative mx-auto w-full max-w-[640px] lg:max-w-none">
          <p className="sr-only">{t("landing.hero.compositionAlt")}</p>
          <motion.div {...enter(0.2)} className="relative">
            <div className="landing-tilt">
              <MockDashboard />
            </div>
          </motion.div>

          <motion.div {...enter(0.55)} className="absolute -left-4 top-[64%] hidden sm:block lg:-left-14">
            <Float delay={0.4}>
              <MockCandidateCard />
            </Float>
          </motion.div>

          <motion.div {...enter(0.7)} className="absolute -right-3 -top-10 hidden sm:block lg:-right-10 lg:-top-12">
            <Float delay={1.2} amplitude={5}>
              <MockAlert />
            </Float>
          </motion.div>

          <motion.div {...enter(0.85)} className="absolute -bottom-8 right-6 hidden sm:block lg:-bottom-10 lg:-right-6">
            <Float delay={2} amplitude={7}>
              <MockTaskDone />
            </Float>
          </motion.div>
        </div>
      </div>

      {/* ---- Cinta de módulos ------------------------------------------- */}
      <div className="border-t border-surface-dark-ink/10 py-6">
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.16em] text-surface-dark-ink/50">{t("landing.hero.strip")}</p>
        <div className="landing-marquee-mask overflow-hidden">
          <ul className="landing-marquee flex w-max gap-3" aria-label={t("landing.hero.stripAria")}>
            {[...MODULES, ...MODULES].map(({ key, icon: Icon }, index) => (
              <li
                key={`${key}-${index}`}
                aria-hidden={index >= MODULES.length ? "true" : undefined}
                className="flex items-center gap-2.5 rounded-full border border-surface-dark-ink/12 bg-surface-dark-ink/[0.06] px-4 py-2 text-sm font-medium text-surface-dark-ink/85"
              >
                <Icon className="size-4 text-accent-fill" aria-hidden="true" />
                {t(`landing.strip.${key}`)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
