"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { submitCompanyRegistration } from "@/lib/backend";
import { FormErrorSummary } from "@/components/form-error-summary";
import { FormField } from "@/components/ui/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/components/locale-provider";

// Los planes, los pasos y los mensajes de validación se construyen DENTRO del
// componente: declarados aquí arriba no alcanzan a `t`, así que se quedaban en
// español por mucho que la persona eligiera inglés.
const PLAN_CODES = ["BASIC", "PRO", "ENTERPRISE"] as const;
const STEP_KEYS = ["company", "admin", "plan", "confirm"] as const;

const schema = z.object({
  companyName: z.string().trim().min(2),
  branchName: z.string().trim().min(2),
  branchLocation: z.string().trim().min(2),
  adminName: z.string().trim().min(5),
  adminEmail: z.email(),
  password: z.string().min(8),
  plan: z.enum(PLAN_CODES),
  acceptTerms: z.boolean(),
  acceptPrivacy: z.boolean(),
  marketingConsent: z.boolean(),
});

type Values = z.infer<typeof schema>;

export default function RegisterCompanyPage() {
  const { t } = useLocale();
  const [step, setStep] = useState(0);
  const plans = useMemo(
    () => PLAN_CODES.map((code) => ({ code, name: t(`register.plan.${code}.name`), description: t(`register.plan.${code}.description`) })),
    [t],
  );
  const steps = useMemo(() => STEP_KEYS.map((key) => t(`register.step.${key}`)), [t]);
  // Se extiende el esquema base en vez de reescribirlo: una sola definición de
  // la forma, y aquí solo los mensajes en el idioma activo.
  const traducido = useMemo(
    () =>
      schema.extend({
        companyName: z.string().trim().min(2, t("register.error.companyName")),
        branchName: z.string().trim().min(2, t("register.error.branchName")),
        branchLocation: z.string().trim().min(2, t("register.error.branchLocation")),
        adminName: z.string().trim().min(5, t("register.error.adminName")),
        adminEmail: z.email(t("auth.invalidEmail")),
        password: z.string().min(8, t("register.error.password")),
        acceptTerms: z.boolean().refine((value) => value, t("register.error.terms")),
        acceptPrivacy: z.boolean().refine((value) => value, t("register.error.privacy")),
      }),
    [t],
  );
  const [showPassword, setShowPassword] = useState(false);
  const idempotencyKey = useRef(typeof crypto === "undefined" ? `registration-${Date.now()}` : crypto.randomUUID());
  const form = useForm<Values>({
    resolver: zodResolver(traducido),
    defaultValues: { companyName: "", branchName: "", branchLocation: "", adminName: "", adminEmail: "", password: "", plan: "PRO", acceptTerms: false, acceptPrivacy: false, marketingConsent: false },
  });
  const request = useMutation({
    mutationFn: (values: Values) => submitCompanyRegistration({ ...values, idempotencyKey: idempotencyKey.current }),
  });
  const moveNext = async () => {
    const fields = step === 0 ? ["companyName", "branchName", "branchLocation"] : step === 1 ? ["adminName", "adminEmail", "password"] : step === 2 ? ["plan"] : ["acceptTerms", "acceptPrivacy"];
    if (await form.trigger(fields as Array<keyof Values>)) setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  if (request.isSuccess) {
    return <main className="flex min-h-screen items-center justify-center bg-surface-2 px-4"><Card className="w-full max-w-lg border-accent-line/25 shadow-xl shadow-surface-dark-1/5"><CardContent className="space-y-5 p-7 text-center sm:p-10"><CheckCircle2 className="mx-auto size-14 text-status-success" /><Badge className="bg-status-success/15 text-status-success hover:bg-status-success/15">{t("register.done.badge")}</Badge><div><h1 className="text-3xl font-semibold tracking-tight">{t("register.done.title")}</h1><p className="mt-3 leading-7 text-muted-foreground">{t("register.done.description", { company: request.data.companyName })}</p></div><div className="rounded-2xl bg-surface-2 p-4 text-left text-sm text-ink-2"><p className="font-semibold text-ink-1">{t("register.done.nextTitle")}</p><p className="mt-1">{t("register.done.nextDetail", { email: request.data.adminEmail })}</p></div><Button asChild className="w-full"><Link href="/">{t("auth.backToPublicSite")}</Link></Button></CardContent></Card></main>;
  }

  return <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(38_94%_52%_/_.2),transparent_30%),hsl(210_24%_96%)] px-4 py-6 sm:px-6"><div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-line bg-surface-1 shadow-[0_24px_70px_hsl(213_40%_10%_/_.10)] lg:grid-cols-[.76fr_1.24fr]"><aside className="hidden bg-[linear-gradient(150deg,hsl(213_40%_10%),hsl(206_30%_21%))] p-10 text-surface-dark-ink lg:flex lg:flex-col lg:justify-between"><div><Link href="/" className="inline-flex items-center gap-3 font-semibold"><span className="flex size-9 items-center justify-center rounded-xl bg-accent-fill text-surface-dark-1">T</span>TalentOS</Link><Badge className="mt-12 border border-accent-line/15 bg-accent-fill/10 text-accent-fill hover:bg-accent-fill/10">{t("register.aside.badge")}</Badge><h1 className="mt-4 text-4xl font-semibold tracking-tight">{t("register.aside.title")}</h1><p className="mt-5 leading-8 text-surface-dark-ink/75">{t("register.aside.description")}</p></div><div className="space-y-4 rounded-3xl border border-surface-dark-ink/10 bg-surface-1/8 p-5"><ShieldCheck className="size-5 text-accent-fill" /><p className="text-sm font-semibold">{t("register.aside.safeTitle")}</p><p className="text-sm leading-6 text-surface-dark-ink/70">{t("register.aside.safeCopy")}</p></div></aside><CardContent className="p-6 sm:p-10"><div className="mx-auto max-w-2xl"><Badge variant="secondary" className="lg:hidden">{t("register.aside.badge")}</Badge><h1 className="mt-3 text-3xl font-semibold tracking-tight">{t("register.form.title")}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{t("register.form.description")}</p><ol className="mt-7 grid grid-cols-4 gap-2" aria-label={t("register.form.progress")}>{steps.map((label, index) => <li key={label} className="min-w-0"><div className={`h-1.5 rounded-full ${index <= step ? "bg-accent-line" : "bg-surface-3"}`} /><p className={`mt-2 truncate text-xs font-medium ${index === step ? "text-accent-ink" : "text-ink-3"}`}>{index + 1}. {label}</p></li>)}</ol><form className="mt-8" onSubmit={form.handleSubmit((values) => request.mutate(values))} noValidate><FormErrorSummary subject={t("register.form.subject")} errors={Object.entries(form.formState.errors).map(([field, issue]) => ({ fieldId: `registration-${field}`, label: field, message: issue?.message ?? t("forms.checkField") }))} serverError={request.error} />{step === 0 ? <section className="space-y-4"><h2 className="text-lg font-semibold">{t("register.section.company")}</h2><FormField id="registration-companyName" label={t("register.field.companyName")} error={form.formState.errors.companyName?.message} required>{(props) => <Input {...props} {...form.register("companyName")} autoComplete="organization" placeholder={t("register.placeholder.companyName")} />}</FormField><div className="grid gap-4 sm:grid-cols-2"><FormField id="registration-branchName" label={t("register.field.branchName")} error={form.formState.errors.branchName?.message} required>{(props) => <Input {...props} {...form.register("branchName")} placeholder={t("register.placeholder.branchName")} />}</FormField><FormField id="registration-branchLocation" label={t("register.field.branchLocation")} error={form.formState.errors.branchLocation?.message} required>{(props) => <Input {...props} {...form.register("branchLocation")} placeholder={t("register.placeholder.branchLocation")} />}</FormField></div></section> : null}{step === 1 ? <section className="space-y-4"><h2 className="text-lg font-semibold">{t("register.section.admin")}</h2><FormField id="registration-adminName" label={t("register.field.adminName")} error={form.formState.errors.adminName?.message} required>{(props) => <Input {...props} {...form.register("adminName")} autoComplete="name" placeholder={t("register.placeholder.adminName")} />}</FormField><FormField id="registration-adminEmail" label={t("register.field.adminEmail")} error={form.formState.errors.adminEmail?.message} required>{(props) => <Input {...props} {...form.register("adminEmail")} type="email" autoComplete="email" placeholder={t("register.placeholder.adminEmail")} />}</FormField><FormField id="registration-password" label={t("register.field.password")} description={t("register.field.passwordHint")} error={form.formState.errors.password?.message} required>{(props) => <div className="relative"><Input {...props} {...form.register("password")} type={showPassword ? "text" : "password"} autoComplete="new-password" className="pr-11" /><button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div>}</FormField></section> : null}{step === 2 ? <section><h2 className="text-lg font-semibold">{t("register.section.plan")}</h2><p className="mt-1 text-sm text-muted-foreground">{t("register.section.planHint")}</p><div className="mt-5 grid gap-3 sm:grid-cols-3">{plans.map((plan) => { const active = form.watch("plan") === plan.code; return <button key={plan.code} type="button" aria-pressed={active} onClick={() => form.setValue("plan", plan.code, { shouldDirty: true })} className={`rounded-2xl border p-4 text-left ${active ? "border-accent-line bg-accent-fill/10 shadow-sm" : "border-line hover:border-accent-line/40"}`}><p className="font-semibold text-ink-1">{plan.name}</p><p className="mt-1 text-xs leading-5 text-ink-2">{plan.description}</p></button>; })}</div></section> : null}{step === 3 ? <section className="space-y-5"><h2 className="text-lg font-semibold">{t("register.section.confirm")}</h2><div className="rounded-2xl border border-line bg-surface-2 p-4 text-sm leading-6 text-ink-2"><p className="font-semibold text-ink-1">{form.watch("companyName") || t("register.confirm.yourCompany")}</p><p>{form.watch("branchName")} · {form.watch("branchLocation")}</p><p>{form.watch("adminName")} · {form.watch("adminEmail")}</p></div><label className="flex gap-3 text-sm leading-6 text-ink-2"><input type="checkbox" className="mt-1 size-4 accent-[hsl(var(--accent-line))]" {...form.register("acceptTerms")} />{t("register.consent.terms")}</label><label className="flex gap-3 text-sm leading-6 text-ink-2"><input type="checkbox" className="mt-1 size-4 accent-[hsl(var(--accent-line))]" {...form.register("acceptPrivacy")} />{t("register.consent.privacy")}</label><label className="flex gap-3 text-sm leading-6 text-ink-2"><input type="checkbox" className="mt-1 size-4 accent-[hsl(var(--accent-line))]" {...form.register("marketingConsent")} />{t("register.consent.marketing")} <span className="text-ink-3">{t("forms.optional")}</span></label></section> : null}<div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><Button asChild variant="ghost"><Link href={step === 0 ? "/" : "#"} onClick={(event) => { if (step > 0) { event.preventDefault(); setStep((current) => current - 1); } }}><ArrowLeft className="size-4" />{step === 0 ? t("actions.back") : t("register.action.previous")}</Link></Button>{step < steps.length - 1 ? <Button type="button" onClick={() => void moveNext()}>{t("actions.continue")}</Button> : <Button type="submit" disabled={request.isPending}>{request.isPending ? t("actions.sending") : t("register.action.submit")}</Button>}</div></form></div></CardContent></div></main>;
}
