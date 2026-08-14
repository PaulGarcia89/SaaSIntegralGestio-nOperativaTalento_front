"use client";

import Link from "next/link";
import { useRef, useState } from "react";
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

const plans = [
  { code: "BASIC", name: "Inicial", description: "Reclutamiento e incorporación" },
  { code: "PRO", name: "Profesional", description: "La suite operativa para tu equipo" },
  { code: "ENTERPRISE", name: "Empresarial", description: "Todos los módulos y analítica" },
] as const;

const schema = z.object({
  companyName: z.string().trim().min(2, "Ingresa el nombre de la empresa"),
  branchName: z.string().trim().min(2, "Ingresa la sede principal"),
  branchLocation: z.string().trim().min(2, "Ingresa ciudad y país o región"),
  adminName: z.string().trim().min(5, "Ingresa nombre y apellido"),
  adminEmail: z.email("Ingresa un correo corporativo válido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  plan: z.enum(["BASIC", "PRO", "ENTERPRISE"]),
  acceptTerms: z.boolean().refine((value) => value, "Debes aceptar los Términos de servicio"),
  acceptPrivacy: z.boolean().refine((value) => value, "Debes aceptar la Política de privacidad"),
  marketingConsent: z.boolean(),
});

type Values = z.infer<typeof schema>;
const steps = ["Empresa", "Administrador", "Plan", "Confirmar"];

export default function RegisterCompanyPage() {
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const idempotencyKey = useRef(typeof crypto === "undefined" ? `registration-${Date.now()}` : crypto.randomUUID());
  const form = useForm<Values>({
    resolver: zodResolver(schema),
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
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4"><Card className="w-full max-w-lg border-cyan-100 shadow-xl shadow-cyan-950/5"><CardContent className="space-y-5 p-7 text-center sm:p-10"><CheckCircle2 className="mx-auto size-14 text-emerald-600" /><Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Solicitud pendiente de revisión</Badge><div><h1 className="text-3xl font-semibold tracking-tight">Recibimos tu solicitud</h1><p className="mt-3 leading-7 text-muted-foreground">Un superadministrador revisará los datos de <strong>{request.data.companyName}</strong>. Cuando la apruebe se crearán tu empresa, sede, suscripción y acceso de administrador.</p></div><div className="rounded-2xl bg-slate-50 p-4 text-left text-sm text-slate-600"><p className="font-semibold text-slate-900">Próximo paso</p><p className="mt-1">Te notificaremos en {request.data.adminEmail} cuando puedas iniciar sesión.</p></div><Button asChild className="w-full"><Link href="/">Volver al sitio público</Link></Button></CardContent></Card></main>;
  }

  return <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,.2),transparent_30%),#f8fafc] px-4 py-6 sm:px-6"><div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,.10)] lg:grid-cols-[.76fr_1.24fr]"><aside className="hidden bg-[linear-gradient(150deg,#082f49,#0f766e)] p-10 text-white lg:flex lg:flex-col lg:justify-between"><div><Link href="/" className="inline-flex items-center gap-3 font-semibold"><span className="flex size-9 items-center justify-center rounded-xl bg-cyan-300 text-slate-950">T</span>TalentOS</Link><Badge className="mt-12 border border-cyan-200/15 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/10">Solicitud de empresa</Badge><h1 className="mt-4 text-4xl font-semibold tracking-tight">Tu espacio de trabajo, revisado antes de activarse.</h1><p className="mt-5 leading-8 text-cyan-50/75">Enviamos la solicitud al equipo administrador para validar empresa, plan y acceso inicial.</p></div><div className="space-y-4 rounded-3xl border border-white/10 bg-white/8 p-5"><ShieldCheck className="size-5 text-cyan-200" /><p className="text-sm font-semibold">Creación segura y transaccional</p><p className="text-sm leading-6 text-white/70">Ningún tenant ni usuario se activa hasta aprobar la solicitud.</p></div></aside><CardContent className="p-6 sm:p-10"><div className="mx-auto max-w-2xl"><Badge variant="secondary" className="lg:hidden">Solicitud de empresa</Badge><h1 className="mt-3 text-3xl font-semibold tracking-tight">Registra tu empresa</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Completa la solicitud en pocos pasos. Podrás revisar la información antes de enviarla.</p><ol className="mt-7 grid grid-cols-4 gap-2" aria-label="Progreso del registro">{steps.map((label, index) => <li key={label} className="min-w-0"><div className={`h-1.5 rounded-full ${index <= step ? "bg-cyan-600" : "bg-slate-200"}`} /><p className={`mt-2 truncate text-xs font-medium ${index === step ? "text-cyan-800" : "text-slate-500"}`}>{index + 1}. {label}</p></li>)}</ol><form className="mt-8" onSubmit={form.handleSubmit((values) => request.mutate(values))} noValidate><FormErrorSummary errors={Object.entries(form.formState.errors).map(([field, issue]) => ({ fieldId: `registration-${field}`, label: field, message: issue?.message ?? "Revisa este campo" }))} serverError={request.error} />{step === 0 ? <section className="space-y-4"><h2 className="text-lg font-semibold">Datos de la empresa</h2><FormField id="registration-companyName" label="Nombre comercial" error={form.formState.errors.companyName?.message} required>{(props) => <Input {...props} {...form.register("companyName")} autoComplete="organization" placeholder="Ej. Grupo Horizonte" />}</FormField><div className="grid gap-4 sm:grid-cols-2"><FormField id="registration-branchName" label="Sede principal" error={form.formState.errors.branchName?.message} required>{(props) => <Input {...props} {...form.register("branchName")} placeholder="Ej. Oficina central" />}</FormField><FormField id="registration-branchLocation" label="Ubicación" error={form.formState.errors.branchLocation?.message} required>{(props) => <Input {...props} {...form.register("branchLocation")} placeholder="Ciudad, país" />}</FormField></div></section> : null}{step === 1 ? <section className="space-y-4"><h2 className="text-lg font-semibold">Administrador inicial</h2><FormField id="registration-adminName" label="Nombre completo" error={form.formState.errors.adminName?.message} required>{(props) => <Input {...props} {...form.register("adminName")} autoComplete="name" placeholder="Nombre y apellido" />}</FormField><FormField id="registration-adminEmail" label="Correo corporativo" error={form.formState.errors.adminEmail?.message} required>{(props) => <Input {...props} {...form.register("adminEmail")} type="email" autoComplete="email" placeholder="nombre@empresa.com" />}</FormField><FormField id="registration-password" label="Contraseña para activación" description="Se guarda cifrada y sólo se habilita si la solicitud es aprobada." error={form.formState.errors.password?.message} required>{(props) => <div className="relative"><Input {...props} {...form.register("password")} type={showPassword ? "text" : "password"} autoComplete="new-password" className="pr-11" /><button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div>}</FormField></section> : null}{step === 2 ? <section><h2 className="text-lg font-semibold">Plan solicitado</h2><p className="mt-1 text-sm text-muted-foreground">El equipo administrador validará la disponibilidad y módulos permitidos.</p><div className="mt-5 grid gap-3 sm:grid-cols-3">{plans.map((plan) => { const active = form.watch("plan") === plan.code; return <button key={plan.code} type="button" aria-pressed={active} onClick={() => form.setValue("plan", plan.code, { shouldDirty: true })} className={`rounded-2xl border p-4 text-left ${active ? "border-cyan-500 bg-cyan-50 shadow-sm" : "border-slate-200 hover:border-cyan-200"}`}><p className="font-semibold text-slate-900">{plan.name}</p><p className="mt-1 text-xs leading-5 text-slate-600">{plan.description}</p></button>; })}</div></section> : null}{step === 3 ? <section className="space-y-5"><h2 className="text-lg font-semibold">Confirma la solicitud</h2><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600"><p className="font-semibold text-slate-900">{form.watch("companyName") || "Tu empresa"}</p><p>{form.watch("branchName")} · {form.watch("branchLocation")}</p><p>{form.watch("adminName")} · {form.watch("adminEmail")}</p></div><label className="flex gap-3 text-sm leading-6 text-slate-600"><input type="checkbox" className="mt-1 size-4 accent-cyan-700" {...form.register("acceptTerms")} />Acepto los Términos de servicio.</label><label className="flex gap-3 text-sm leading-6 text-slate-600"><input type="checkbox" className="mt-1 size-4 accent-cyan-700" {...form.register("acceptPrivacy")} />Acepto la Política de privacidad.</label><label className="flex gap-3 text-sm leading-6 text-slate-600"><input type="checkbox" className="mt-1 size-4 accent-cyan-700" {...form.register("marketingConsent")} />Deseo recibir novedades de producto. <span className="text-slate-400">Opcional.</span></label></section> : null}<div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><Button asChild variant="ghost"><Link href={step === 0 ? "/" : "#"} onClick={(event) => { if (step > 0) { event.preventDefault(); setStep((current) => current - 1); } }}><ArrowLeft className="size-4" />{step === 0 ? "Volver" : "Atrás"}</Link></Button>{step < steps.length - 1 ? <Button type="button" onClick={() => void moveNext()}>Continuar</Button> : <Button type="submit" disabled={request.isPending}>{request.isPending ? "Enviando..." : "Enviar para aprobación"}</Button>}</div></form></div></CardContent></div></main>;
}
