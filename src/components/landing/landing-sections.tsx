"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Activity, ArrowRight, BarChart3, BriefcaseBusiness, Building2, CalendarCheck2, Check, ChevronRight, ClipboardCheck, FileCheck2, GraduationCap, Handshake, PackageCheck, Sparkles, TrendingUp, UserPlus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-provider";

/**
 * Los datos de la portada llevan CLAVE, no texto. El texto vive en el
 * diccionario y se resuelve dentro del componente, que es el único sitio con
 * acceso al idioma activo: escrito aquí arriba quedaba fuera del alcance de
 * `useLocale` y por eso el selector no lo cambiaba.
 */
const modules = [
  { icon: BriefcaseBusiness, key: "recruiting" },
  { icon: ClipboardCheck, key: "onboarding" },
  { icon: GraduationCap, key: "training" },
  { icon: PackageCheck, key: "inventory" },
  { icon: BarChart3, key: "productivity" },
] as const;
const lifecycle = [
  { key: "vacancy", icon: BriefcaseBusiness },
  { key: "application", icon: UserPlus },
  { key: "interview", icon: CalendarCheck2 },
  { key: "hire", icon: Handshake },
  { key: "onboarding", icon: FileCheck2 },
  { key: "training", icon: GraduationCap },
  { key: "employee", icon: Users },
  { key: "productivity", icon: BarChart3 },
] as const;

export function HeroSection() { const { t } = useLocale(); return <section className="grid gap-10 py-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:py-14"><div className="space-y-7"><Badge className="w-fit border border-accent-line/20 bg-accent-fill/10 text-accent-fill">{t("landing.hero.eyebrow")}</Badge><div className="space-y-5"><h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight text-surface-dark-ink sm:text-5xl lg:text-6xl">{t("landing.hero.title")}</h1><p className="max-w-2xl text-base leading-8 text-surface-dark-ink/85 sm:text-lg">{t("landing.hero.description")}</p></div><div className="flex flex-col gap-3 sm:flex-row"><Button asChild size="lg" className="bg-accent-fill text-surface-dark-1 shadow-lg shadow-accent-fill/20 hover:bg-accent-fill"><Link href="/register-company">{t("landing.hero.start")} <ArrowRight className="size-4" /></Link></Button><Button asChild size="lg" variant="secondary" className="border-surface-dark-ink/20 bg-surface-dark-ink/10 text-surface-dark-ink hover:bg-surface-dark-ink/15"><a href="#producto">{t("landing.hero.explore")}</a></Button></div><p className="text-sm text-surface-dark-ink/75">{t("landing.hero.note")}</p></div><ProductPreview /></section>; }

function ProductPreview() {
  const { t, locale } = useLocale();
  const metrics = [
    ["24", t("landing.preview.metric.vacancies"), "+12%", "text-accent-fill"],
    ["86", t("landing.preview.metric.candidates"), "+18%", "text-surface-dark-ink/70"],
    ["12", t("landing.preview.metric.onboarding"), t("landing.preview.metric.todayCount", { count: 4 }), "text-accent-fill"],
    ["91%", t("landing.preview.metric.courses"), "+6%", "text-surface-dark-ink/70"],
  ];
  const activity = [35, 58, 44, 78, 62, 92, 70];
  // Los días salían escritos a mano en español, así que en inglés el gráfico
  // marcaba «X» un miércoles. `narrow` da «L M X J V S D» y «M T W T F S S».
  // El 1 de enero de 2024 fue lunes: es el ancla para empezar la semana ahí.
  const weekdays = useMemo(() => {
    const formato = new Intl.DateTimeFormat(locale, { weekday: "narrow", timeZone: "UTC" });
    return Array.from({ length: 7 }, (_, index) => formato.format(new Date(Date.UTC(2024, 0, 1 + index))));
  }, [locale]);

  return <div className="relative mx-auto w-full max-w-xl overflow-hidden rounded-[2rem] border border-surface-dark-ink/15 bg-[radial-gradient(circle_at_90%_7%,hsl(38_94%_52%_/_.18),transparent_28%),radial-gradient(circle_at_5%_100%,hsl(205_80%_55%_/_.16),transparent_35%),linear-gradient(145deg,hsl(213_38%_12%),hsl(213_40%_10%)_58%,hsl(213_34%_15%))] p-4 shadow-[0_30px_80px_hsl(213_40%_10%_/_.45)] sm:p-5">
    <div aria-hidden="true" className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-accent-fill/80 to-transparent" />
    <div aria-hidden="true" className="absolute -right-16 -top-16 size-48 rounded-full bg-accent-fill/15 blur-3xl" />
    <div className="relative mb-5 flex items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent-fill shadow-[0_0_12px_hsl(38_94%_52%_/_.9)]" /><p className="text-[11px] font-semibold uppercase tracking-[.2em] text-accent-fill">{t("landing.preview.illustrative")}</p></div>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-surface-dark-ink">{t("landing.preview.title")}</h2>
        <p className="mt-1 text-xs text-surface-dark-ink/75">{t("landing.preview.subtitle")}</p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-accent-line/40 bg-surface-dark-1/70 px-2.5 py-1.5 text-[11px] font-medium text-accent-fill"><Activity className="size-3" />{t("landing.preview.realtime")}</span>
    </div>
    <div className="relative grid grid-cols-2 gap-3">
      {metrics.map(([value, label, trend, accent], index) => <div key={label} className="group rounded-2xl border border-surface-dark-ink/10 bg-surface-1/[.065] p-3.5 shadow-[inset_0_1px_hsl(210_22%_96%_/_.08)] transition duration-300 hover:-translate-y-0.5 hover:bg-surface-1/[.1] sm:p-4">
        <div className="flex items-start justify-between gap-2"><p className="text-2xl font-semibold tracking-tight text-surface-dark-ink sm:text-3xl">{value}</p><span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${accent}`}><TrendingUp className="size-3" />{trend}</span></div>
        <p className="mt-1 text-xs leading-5 text-surface-dark-ink/75">{label}</p>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-dark-ink/10"><span className="block h-full rounded-full bg-gradient-to-r from-accent-fill to-accent-fill/60" style={{ width: `${[64, 82, 42, 91][index]}%` }} /></div>
      </div>)}
    </div>
    <div className="relative mt-4 grid gap-3 sm:grid-cols-[.82fr_1.18fr]">
      <div className="rounded-2xl border border-surface-dark-ink/10 bg-surface-dark-1/35 p-4 shadow-[inset_0_1px_hsl(210_22%_96%_/_.05)]">
        <div className="flex items-center justify-between"><p className="text-xs font-medium text-surface-dark-ink/85">{t("landing.preview.pipeline")}</p><span className="text-[10px] font-semibold text-accent-fill">{t("landing.preview.total", { count: 86 })}</span></div>
        <div className="mt-4 flex items-center gap-3"><div className="relative flex size-[5.25rem] shrink-0 items-center justify-center rounded-full" style={{ background: "conic-gradient(hsl(38_94%_52%) 0 42%, hsl(210_22%_96%_/_.55) 42% 68%, hsl(210_22%_96%_/_.3) 68% 84%, hsl(210_22%_96%_/_.12) 84% 100%)" }}><div className="flex size-[3.45rem] items-center justify-center rounded-full bg-surface-dark-2 text-sm font-semibold text-surface-dark-ink">86</div></div><div className="min-w-0 space-y-1.5 text-[11px] text-surface-dark-ink/75"><p className="flex items-center justify-between gap-3"><span><i className="mr-1.5 inline-block size-2 rounded-full bg-accent-fill" />{t("landing.preview.stage.review")}</span><b className="font-medium text-surface-dark-ink">42%</b></p><p className="flex items-center justify-between gap-3"><span><i className="mr-1.5 inline-block size-2 rounded-full bg-surface-dark-ink/55" />{t("landing.preview.stage.interview")}</span><b className="font-medium text-surface-dark-ink">26%</b></p><p className="flex items-center justify-between gap-3"><span><i className="mr-1.5 inline-block size-2 rounded-full bg-surface-dark-ink/30" />{t("landing.preview.stage.offer")}</span><b className="font-medium text-surface-dark-ink">16%</b></p></div></div>
      </div>
      <div className="rounded-2xl border border-surface-dark-ink/10 bg-surface-dark-1/35 p-4 shadow-[inset_0_1px_hsl(210_22%_96%_/_.05)]"><div className="flex items-center justify-between"><div><p className="text-xs font-medium text-surface-dark-ink/85">{t("landing.preview.activity")}</p><p className="mt-0.5 text-[10px] text-surface-dark-ink/70">{t("landing.preview.activitySub")}</p></div><Sparkles className="size-4 text-accent-fill" /></div><div className="mt-4 flex h-20 items-end gap-1.5">{activity.map((height, index) => <div key={index} className="flex flex-1 flex-col items-center gap-1"><span className="w-full rounded-t-[7px] bg-gradient-to-t from-accent-line/80 via-accent-fill to-accent-fill/60 shadow-[0_-4px_16px_hsl(38_94%_52%_/_.12)]" style={{ height: `${height}%`, opacity: 0.55 + index * 0.06 }} /><small className="text-[9px] text-surface-dark-ink/70">{weekdays[index]}</small></div>)}</div></div>
    </div>
    <div className="relative mt-4 overflow-hidden rounded-2xl border border-accent-line/15 bg-surface-dark-1/35 p-4 shadow-[inset_0_1px_hsl(210_22%_96%_/_.05)]"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-surface-dark-ink">{t("landing.preview.cycle")}</p><span className="text-[10px] font-medium text-accent-fill">{t("landing.preview.cycleHint")}</span></div><div className="mt-3 flex min-w-0 items-center gap-1">{["vacancy", "candidates", "interviews", "onboarding", "training"].map((step, index) => <div key={step} className="flex min-w-0 items-center gap-1"><span className={`whitespace-nowrap rounded-full border px-2 py-1 text-[10px] xl:px-2.5 xl:text-[11px] ${index === 0 ? "border-accent-line/40 bg-accent-fill/15 font-medium text-accent-fill" : "border-surface-dark-ink/10 bg-surface-1/[.06] text-surface-dark-ink/85"}`}>{t(`landing.preview.chip.${step}`)}</span>{index < 4 ? <ChevronRight className="size-3 shrink-0 text-accent-fill/80" aria-hidden="true" /> : null}</div>)}</div></div>
  </div>;
}

export function ModulesSection() { const { t } = useLocale(); return <section id="producto" className="scroll-mt-8 py-10 sm:py-16"><div className="max-w-2xl"><p className="text-sm font-semibold text-brand">{t("landing.product.eyebrow")}</p><h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{t("landing.product.title")}</h2><p className="mt-4 text-base leading-7 text-muted-foreground">{t("landing.product.description")}</p></div><div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-6">{modules.map(({ icon: Icon, key }, index) => <article key={key} className={`group rounded-2xl border border-border/70 bg-card p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary/35 hover:shadow-lg motion-reduce:transform-none ${index === 4 ? "md:col-span-2 xl:col-span-3" : index > 2 ? "xl:col-span-3" : "xl:col-span-2"}`}><div className="flex items-start justify-between gap-4"><span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-brand"><Icon className="size-5" /></span><span className="text-xs font-medium text-brand/70">0{index + 1}</span></div><h3 className="mt-5 text-xl font-semibold">{t(`landing.modules.${key}.title`)}</h3><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{t(`landing.modules.${key}.copy`)}</p><ul className="mt-5 grid gap-2 text-sm text-foreground sm:grid-cols-3">{[1, 2, 3].map((n) => <li key={n} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-brand" />{t(`landing.modules.${key}.f${n}`)}</li>)}</ul></article>)}</div></section>; }

export function EmployeeLifecycle() { const { t } = useLocale(); return <section id="soluciones" className="relative scroll-mt-8 overflow-hidden rounded-[2rem] border border-accent-line/25 bg-[radial-gradient(circle_at_92%_10%,hsl(38_94%_52%_/_.17),transparent_25%),linear-gradient(135deg,hsl(0_0%_100%)_0%,hsl(38_60%_96%)_52%,hsl(38_70%_94%)_100%)] px-5 py-10 text-surface-dark-1 shadow-[0_18px_50px_hsl(213_40%_10%_/_.07)] sm:px-8 sm:py-14"><div aria-hidden="true" className="pointer-events-none absolute -left-20 bottom-0 size-64 rounded-full bg-accent-fill/25 blur-3xl" /><div className="relative"><div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"><div className="max-w-2xl"><p className="text-sm font-semibold text-accent-ink">{t("landing.flow.eyebrow")}</p><h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{t("landing.flow.title")}</h2><p className="mt-4 max-w-xl leading-7 text-ink-2">{t("landing.flow.description")}</p></div><div className="inline-flex w-fit items-center gap-3 rounded-2xl border border-accent-line/50 bg-surface-1/80 px-4 py-3 text-sm shadow-sm backdrop-blur"><span className="flex size-9 items-center justify-center rounded-xl bg-accent-fill font-semibold text-surface-dark-1">8</span><span className="font-medium text-ink-1">{t("landing.flow.stages")}<br /><span className="text-xs font-normal text-ink-3">{t("landing.flow.stagesHint")}</span></span></div></div><ol className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{lifecycle.map(({ key, icon: Icon }, index) => <li key={key} className="group relative overflow-hidden rounded-2xl border border-line bg-surface-1/85 p-5 shadow-[0_10px_25px_hsl(213_40%_10%_/_.07)] transition duration-200 hover:-translate-y-1 hover:border-accent-line hover:shadow-[0_16px_34px_hsl(206_30%_28%_/_.14)] motion-reduce:transform-none"><span aria-hidden="true" className="absolute -right-2 -top-5 text-7xl font-semibold tracking-tighter text-accent-line/[.07]">0{index + 1}</span><div className="relative flex items-start justify-between gap-4"><span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-fill to-accent-line text-surface-dark-1 shadow-lg shadow-accent-line/20"><Icon className="size-5" /></span><span className="rounded-full bg-accent-fill/10 px-2.5 py-1 text-xs font-semibold text-accent-ink">{t("landing.flow.stageBadge", { number: `0${index + 1}` })}</span></div><div className="relative mt-8 flex items-center justify-between gap-3"><span className="text-lg font-semibold text-ink-1">{t(`landing.lifecycle.${key}`)}</span>{index < lifecycle.length - 1 ? <ArrowRight className="size-4 text-accent-ink transition-transform group-hover:translate-x-1 motion-reduce:transform-none" /> : <Check className="size-4 text-status-success" />}</div></li>)}</ol></div></section>; }

export function MultiBranchSection() { const { t } = useLocale(); return <section className="grid gap-10 py-12 lg:grid-cols-2 lg:items-center"><div><p className="text-sm font-semibold text-brand">{t("landing.branches.eyebrow")}</p><h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{t("landing.branches.title")}</h2><p className="mt-4 max-w-xl leading-7 text-muted-foreground">{t("landing.branches.description")}</p><ul className="mt-6 space-y-3 text-sm">{[1, 2, 3, 4].map((n) => <li key={n} className="flex items-center gap-3"><Check className="size-4 text-brand" />{t(`landing.branches.f${n}`)}</li>)}</ul></div><div className="rounded-3xl border border-border/70 bg-surface-section p-6"><div className="flex items-center gap-3 font-semibold"><Building2 className="size-5 text-brand" />{t("landing.branches.parent")}</div><div className="mt-5 space-y-3 border-l-2 border-primary/25 pl-5">{[1, 2, 3].map((n) => <div key={n} className="rounded-xl bg-card p-4 text-sm font-medium shadow-sm">{t(`landing.branches.b${n}`)}<p className="mt-1 font-normal text-muted-foreground">{t("landing.branches.branchNote")}</p></div>)}</div></div></section>; }

export function FlexibleModulesAndRoles() { const { t } = useLocale(); const roles = ["admin", "hr", "supervisor", "instructor", "employee", "candidate"]; return <><section id="planes" className="scroll-mt-8 rounded-3xl border border-border/70 bg-card p-6 sm:p-10"><div className="grid gap-8 lg:grid-cols-2"><div><p className="text-sm font-semibold text-brand">{t("landing.plans.eyebrow")}</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">{t("landing.plans.title")}</h2><p className="mt-4 leading-7 text-muted-foreground">{t("landing.plans.description")}</p></div><ul className="grid gap-3 sm:grid-cols-2">{modules.map(({ key }, index) => <li key={key} className="flex items-center gap-3 rounded-xl bg-surface-section p-4 text-sm font-medium"><span className={`flex size-5 items-center justify-center rounded-md ${index < 3 ? "bg-primary text-primary-foreground" : "border border-border bg-background text-muted-foreground"}`}>{index < 3 ? <Check className="size-3.5" /> : null}</span>{t(`landing.modules.${key}.title`)}</li>)}</ul></div></section><section className="py-12"><div className="text-center"><p className="text-sm font-semibold text-brand">{t("landing.roles.eyebrow")}</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">{t("landing.roles.title")}</h2><p className="mx-auto mt-4 max-w-2xl leading-7 text-muted-foreground">{t("landing.roles.description")}</p></div><div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{roles.map((role) => <div key={role} className="rounded-2xl border border-border/70 bg-card p-4 text-center text-sm font-medium"><Users className="mx-auto mb-3 size-5 text-brand" />{t(`landing.roles.${role}`)}</div>)}</div></section></>; }

export function HowItWorks() { const { t } = useLocale(); const steps = [{ icon: Building2, key: "register" }, { icon: Users, key: "configure" }, { icon: PackageCheck, key: "modules" }, { icon: BarChart3, key: "operate" }]; return <section id="como-funciona" className="scroll-mt-8 py-10 sm:py-16"><div className="max-w-2xl"><p className="text-sm font-semibold text-brand">{t("landing.how.eyebrow")}</p><h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{t("landing.how.title")}</h2></div><ol className="relative mt-8 grid gap-4 md:grid-cols-4"><div aria-hidden="true" className="absolute left-[12%] right-[12%] top-10 hidden h-px bg-gradient-to-r from-primary/20 via-primary to-primary/20 md:block" />{steps.map(({ icon: Icon, key }, index) => <li key={key} className="relative rounded-2xl border border-border/70 bg-card p-5 shadow-sm"><div className="flex items-center justify-between"><span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20"><Icon className="size-5" /></span><span className="text-sm font-semibold text-brand">0{index + 1}</span></div><p className="mt-8 font-semibold">{t(`landing.how.${key}.title`)}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{t(`landing.how.${key}.copy`)}</p></li>)}</ol></section>; }

export function CandidateSection() {
  const { t } = useLocale();
  const steps = ["application", "interview", "offer"] as const;

  // Un bloque de portada para quien busca empleo, con la misma paleta que el
  // resto de la página (lavado ámbar, grafito para la acción). A la derecha,
  // una ficha ILUSTRATIVA —rotulada como tal— de cómo se ve el seguimiento de
  // una postulación; no son datos reales.
  return <section id="candidatos" className="relative scroll-mt-8 overflow-hidden rounded-[2rem] border border-accent-line/25 bg-[radial-gradient(circle_at_88%_0%,hsl(38_94%_52%_/_.16),transparent_28%),linear-gradient(135deg,hsl(0_0%_100%)_0%,hsl(38_60%_96%)_55%,hsl(38_70%_94%)_100%)] px-5 py-10 shadow-[0_18px_50px_hsl(213_40%_10%_/_.07)] sm:px-8 sm:py-14">
    <div aria-hidden="true" className="pointer-events-none absolute -left-20 bottom-0 size-64 rounded-full bg-accent-fill/20 blur-3xl" />
    <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:items-center">
      <div>
        <p className="text-sm font-semibold text-accent-ink">{t("landing.candidates.eyebrow")}</p>
        <h2 className="mt-3 text-4xl font-semibold tracking-tight text-ink-1 sm:text-5xl">{t("landing.candidates.title")}</h2>
        <p className="mt-4 max-w-xl text-lg leading-8 text-ink-2">{t("landing.candidates.detail")}</p>
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

      <div aria-hidden="true" className="rounded-2xl border border-line bg-surface-1/90 p-5 shadow-[0_16px_40px_hsl(213_40%_10%_/_.10)] backdrop-blur sm:p-6">
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
  </section>;
}

export function FinalCTA() { const { t } = useLocale(); return <section className="rounded-[2rem] bg-[linear-gradient(135deg,hsl(206_30%_21%),hsl(206_30%_28%))] px-6 py-12 text-surface-dark-ink sm:px-10"><div className="max-w-3xl"><p className="text-sm font-semibold text-accent-fill">TalentOS</p><h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{t("landing.final.title")}</h2><p className="mt-4 leading-7 text-surface-dark-ink/85">{t("landing.final.description")}</p><div className="mt-7 flex flex-col gap-3 sm:flex-row"><Button asChild size="lg" className="bg-surface-1 text-surface-dark-1 hover:bg-accent-fill/10"><Link href="/register-company">{t("landing.cta.register")}</Link></Button><Button asChild size="lg" variant="secondary" className="border-surface-dark-ink/25 bg-transparent text-surface-dark-ink hover:bg-surface-dark-ink/10"><Link href="/login">{t("auth.login")}</Link></Button></div></div></section>; }

export function LandingFooter() { const { t } = useLocale(); return <footer className="grid gap-8 border-t border-border/70 py-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,1fr)]"><div><p className="text-lg font-semibold">TalentOS</p><p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">{t("landing.footer.tagline")}</p></div><FooterColumn title={t("landing.product.eyebrow")} links={modules.map(({ key }) => [t(`landing.modules.${key}.title`), "#producto"])} /><FooterColumn title={t("landing.footer.resources")} links={[[t("landing.nav.jobs"), "/jobs"], [t("landing.nav.trackApplication"), "/application-status"], [t("auth.login"), "/login"]]} /><FooterColumn title={t("landing.footer.company")} links={[[t("landing.cta.register"), "/register-company"], [t("landing.nav.modules"), "#planes"], [t("landing.nav.howItWorks"), "#como-funciona"]]} /><p className="text-xs text-muted-foreground sm:col-span-2 lg:col-span-4">{t("landing.footer.rights", { year: new Date().getFullYear() })}</p></footer>; }
function FooterColumn({ title, links }: { title: string; links: string[][] }) { return <div><p className="text-sm font-semibold">{title}</p><ul className="mt-3 space-y-2">{links.map(([label, href]) => <li key={label}><Link href={href} className="text-sm text-muted-foreground hover:text-brand">{label}</Link></li>)}</ul></div>; }
