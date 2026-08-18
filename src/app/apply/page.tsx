"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { trackProductEvent } from "@/lib/product-analytics";
import { authenticateCandidate, deletePublicApplicationDraft, exchangeCandidateSocialCode, fetchPublicApplicationDraft, fetchPublicVacancy, getCandidateSession, parseCandidateResume, savePublicApplicationDraft, startCandidateSocialLogin, submitCandidateApplication } from "@/lib/backend";
import type { ParsedResumeDto, PublicApplicationInput } from "@/lib/contracts";
import type { VacancyApplicationField } from "@/lib/contracts";
import { getApplicationFields, missingRequiredApplicationFields } from "@/lib/application-form";
import { AsyncState } from "@/components/async-state";
import { CandidateNav } from "@/components/candidate-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wizard } from "@/components/design-system";
import { FileUpload } from "@/components/ui/file-upload";
import { validateAtsResumeFile } from "@/lib/ats-file-security";

const steps = ["Vacante", "Tu perfil", "Preguntas", "CV", "Enviar", "Confirmación"];
const emptyForm: PublicApplicationInput = { fullName: "", email: "", phone: "", city: "", linkedinUrl: "", portfolioUrl: "", coverLetter: "", dynamicResponses: {} };
type PublicApplicationDraftState = { step: number; form: PublicApplicationInput; flowVersion?: number; pausedAt?: string };
type PublicApplicationProgress = { step: number; form: PublicApplicationInput; flowVersion: 2; pausedAt?: string; resumedAt?: string };
const normalizeDraftStep = (draft: PublicApplicationDraftState) => draft.flowVersion === 2 ? Math.min(Math.max(draft.step, 0), 4) : [0, 1, 1, 2, 3, 4][Math.min(Math.max(draft.step, 0), 5)] ?? 0;

function ApplyWizard() {
  const params = useSearchParams();
  const router = useRouter();
  const vacancyId = params.get("vacancyId") ?? "";
  const socialCode = params.get("socialCode");
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<PublicApplicationInput>(emptyForm);
  const [consent, setConsent] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [candidatePassword, setCandidatePassword] = useState("");
  const [accountMode, setAccountMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [parsedResume, setParsedResume] = useState<ParsedResumeDto | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const draftTimer = useRef<number | null>(null);
  const pausing = useRef(false);
  const vacancyQuery = useQuery({ queryKey: ["public-vacancy", vacancyId], queryFn: () => fetchPublicVacancy(vacancyId), enabled: Boolean(vacancyId), retry: false });
  const draftQuery = useQuery({ queryKey: ["public-application-draft", vacancyId], queryFn: () => fetchPublicApplicationDraft(vacancyId), enabled: Boolean(vacancyId), retry: false });
  const submitMutation = useMutation({ mutationFn: async () => {
    if (!getCandidateSession()) await authenticateCandidate(form.email, candidatePassword, accountMode);
    return submitCandidateApplication(vacancyId, form, resumeFile, consent);
  }, onSuccess: async () => { await deletePublicApplicationDraft(vacancyId).catch(() => undefined); trackProductEvent({ name: "flow_completed", flow: "vacancy" }); setStep(5); }, onError: (cause) => setError(cause instanceof Error ? cause.message : "No fue posible enviar la postulación.") });
  const parseResume = useMutation({ mutationFn: async () => { if (!resumeFile) throw new Error("Selecciona un CV."); if (!getCandidateSession()) { await authenticateCandidate(form.email, candidatePassword, accountMode); setAccountMode("login"); } return parseCandidateResume(resumeFile); }, onSuccess: setParsedResume, onError: (cause) => setError(cause instanceof Error ? cause.message : "No fue posible analizar el CV.") });
  const social = useMutation({ mutationFn: (provider: "linkedin" | "indeed") => startCandidateSocialLogin(provider, window.location.href), onSuccess: ({ authorizationUrl }) => window.location.assign(authorizationUrl), onError: (cause) => setError(cause instanceof Error ? cause.message : "La integración social no está disponible.") });

  useEffect(() => {
    if (!draftQuery.data?.value) return;
    const draft = draftQuery.data.value as unknown as PublicApplicationDraftState;
    if (draft.form) setForm(draft.form);
    const restoredStep = normalizeDraftStep(draft);
    if (typeof draft.step === "number") setStep(restoredStep);
    setDraftLoaded(true);
    setDraftSavedAt(draftQuery.data.expiresAt);
    if (draft.pausedAt) void savePublicApplicationDraft(vacancyId, { step: restoredStep, form: draft.form, flowVersion: 2, resumedAt: new Date().toISOString() }).catch(() => undefined);
    trackProductEvent({ name: "flow_step_viewed", flow: "vacancy", step: restoredStep });
  }, [draftQuery.data]);

  useEffect(() => {
    if (!vacancyId || !draftQuery.isSuccess || pausing.current) return;
    if (draftTimer.current) window.clearTimeout(draftTimer.current);
    draftTimer.current = window.setTimeout(() => {
      const progress: PublicApplicationProgress = { step, form, flowVersion: 2 };
      void savePublicApplicationDraft(vacancyId, progress).catch(() => undefined);
    }, 300);
    return () => {
      if (draftTimer.current) window.clearTimeout(draftTimer.current);
    };
  }, [form, step, vacancyId, draftQuery.isSuccess]);

  useEffect(() => {
    if (!socialCode) return;
    void exchangeCandidateSocialCode(socialCode).then((session) => {
      setForm((current) => ({ ...current, email: session.candidate.email, fullName: session.candidate.fullName ?? current.fullName, phone: session.candidate.phone ?? current.phone, city: session.candidate.city ?? current.city, linkedinUrl: session.candidate.linkedinUrl ?? current.linkedinUrl, portfolioUrl: session.candidate.portfolioUrl ?? current.portfolioUrl }));
      setAccountMode("login");
    }).catch((cause) => setError(cause instanceof Error ? cause.message : "No fue posible importar el perfil."));
  }, [socialCode]);

  useEffect(() => {
    if (!resumeFile) return;
    let cancelled = false;
    void validateAtsResumeFile(resumeFile).then((message) => {
      if (cancelled || !message) return;
      setResumeFile(null);
      setParsedResume(null);
      setError(message);
    });
    return () => { cancelled = true; };
  }, [resumeFile]);

  const setField = (field: keyof PublicApplicationInput, value: string) => { setForm((current) => ({ ...current, [field]: value })); setError(""); };
  const setResponse = (key: string, value: unknown) => { setForm((current) => ({ ...current, dynamicResponses: { ...current.dynamicResponses, [key]: value } })); setError(""); };
  const applyParsedResume = () => setForm((current) => {
    const next = { ...current };
    (Object.entries(parsedResume?.fields ?? {}) as Array<[keyof PublicApplicationInput, string | null | undefined]>).forEach(([field, value]) => {
      if (!value) return;
      const currentValue = current[field];
      if (typeof currentValue === "string" && currentValue.trim()) return;
      next[field] = value as never;
    });
    return next;
  });
  const validate = () => {
    if (step === 1 && (!form.fullName.trim() || !/^\S+@\S+\.\S+$/.test(form.email))) return "Ingresa tu nombre completo y un correo válido.";
    if (step === 2) { const missing = missingRequiredApplicationFields(vacancyQuery.data?.applicationFormSchema, form.dynamicResponses); if (missing.length) return `Responde los campos obligatorios: ${missing.map((field) => field.label).join(", ")}.`; }
    if (step === 4 && !getCandidateSession() && candidatePassword.length < 10) return "La contraseña del portal debe tener al menos 10 caracteres.";
    if (step === 4 && !consent) return "Debes aceptar la declaración y el tratamiento de datos antes de enviar.";
    return "";
  };
  const next = () => { const message = validate(); if (message) return setError(message); setError(""); trackProductEvent({ name: "flow_step_viewed", flow: "vacancy", step: step + 1 }); setStep((value) => Math.min(value + 1, 4)); };
  const back = () => { trackProductEvent({ name: "flow_step_back", flow: "vacancy", from: step, to: Math.max(0, step - 1) }); setStep((value) => Math.max(0, value - 1)); };
  const pause = async () => {
    pausing.current = true;
    if (draftTimer.current) window.clearTimeout(draftTimer.current);
    try {
      await savePublicApplicationDraft(vacancyId, { step, form, flowVersion: 2, pausedAt: new Date().toISOString() });
      router.push(`/application-resume?vacancyId=${encodeURIComponent(vacancyId)}`);
    } catch (cause) {
      pausing.current = false;
      setError(cause instanceof Error ? cause.message : "No fue posible guardar tu progreso. Intenta nuevamente antes de salir.");
    }
  };
  const resume = () => { void draftQuery.refetch(); };
  const location = useMemo(() => [vacancyQuery.data?.city, vacancyQuery.data?.country].filter(Boolean).join(", "), [vacancyQuery.data]);

  if (!vacancyId) return <><CandidateNav /><Card className="mx-auto max-w-2xl border-dashed"><CardContent className="space-y-5 py-14 text-center"><h1 className="text-2xl font-semibold">Selecciona una vacante antes de comenzar</h1><p className="text-muted-foreground">Así podremos asociar tu información con la oportunidad correcta.</p><Button asChild><Link href="/jobs">Explorar vacantes</Link></Button></CardContent></Card></>;
  if (vacancyQuery.isLoading || draftQuery.isLoading) return <AsyncState state="loading" title="Preparando tu postulación" />;
  if (vacancyQuery.isError || !vacancyQuery.data) return <AsyncState state="error" description="No pudimos verificar esta vacante. No ingreses datos personales hasta recuperar la conexión." onRetry={() => void vacancyQuery.refetch()} />;
  const vacancy = vacancyQuery.data;
  const receipt = submitMutation.data;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-14 pt-2">
      <CandidateNav />
      <section className="space-y-4 rounded-[2rem] border bg-card p-6 md:p-8">
        <Badge variant="secondary">Postulación segura</Badge><h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{vacancy.title}</h1><p className="text-muted-foreground">{vacancy.tenant?.name}{location ? ` · ${location}` : ""}</p>
        {draftLoaded ? <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-primary">Tu borrador está guardado en Railway y se reanudará automáticamente si vuelves desde este navegador o con el mismo enlace.</div> : null}
      </section>
      <Wizard steps={steps} current={step} onStepChange={step < 5 ? setStep : undefined}>
      {step === 3 ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Tu CV es opcional. Si lo adjuntas, aceptamos solo PDF o DOCX y lo protegemos con validación y análisis de seguridad.</p> : null}
      <Card><CardHeader><CardTitle>{steps[step]}</CardTitle></CardHeader><CardContent className="space-y-6">
        {step === 0 ? <div className="space-y-4"><p className="leading-7 text-muted-foreground">{vacancy.description || vacancy.summary || "Revisa la información disponible antes de continuar."}</p>{vacancy.requirements ? <div><h2 className="font-semibold">Requisitos</h2><p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">{vacancy.requirements}</p></div> : null}</div> : null}
        {step === 1 ? <div className="space-y-5"><div><h2 className="font-semibold">Lo esencial</h2><p className="mt-1 text-sm text-muted-foreground">Solo necesitamos tu nombre y correo para continuar. El resto puedes completarlo después.</p></div><div className="grid gap-4 md:grid-cols-2"><Field label="Nombre completo" required value={form.fullName} onChange={(value) => setField("fullName", value)} /><Field label="Correo electrónico" type="email" required value={form.email} onChange={(value) => setField("email", value)} /></div><div className="rounded-xl border p-4"><p className="font-medium">¿Quieres ahorrar tiempo?</p><p className="mt-1 text-sm text-muted-foreground">Importa datos de tu perfil; puedes revisarlos antes de enviar.</p><div className="mt-3 flex flex-wrap gap-2"><Button type="button" variant="secondary" onClick={() => social.mutate("linkedin")} disabled={social.isPending}>Usar LinkedIn</Button><Button type="button" variant="secondary" onClick={() => social.mutate("indeed")} disabled={social.isPending}>Usar Indeed</Button></div></div><details className="rounded-xl border p-4"><summary className="cursor-pointer font-medium">Añadir información opcional</summary><div className="mt-4 space-y-4"><div className="grid gap-4 md:grid-cols-2"><Field label="Teléfono" value={form.phone || ""} onChange={(value) => setField("phone", value)} /><Field label="Ciudad" value={form.city || ""} onChange={(value) => setField("city", value)} /><Field label="LinkedIn" type="url" value={form.linkedinUrl || ""} onChange={(value) => setField("linkedinUrl", value)} /><Field label="Portafolio" type="url" value={form.portfolioUrl || ""} onChange={(value) => setField("portfolioUrl", value)} /></div><div className="space-y-2"><Label htmlFor="coverLetter">Experiencia o motivación</Label><textarea id="coverLetter" maxLength={4000} value={form.coverLetter || ""} onChange={(event) => setField("coverLetter", event.target.value)} placeholder="Opcional: comparte lo que quieras destacar." className="min-h-32 w-full rounded-xl border bg-background p-3" /></div></div></details></div> : null}
        {step === 2 ? <DynamicQuestions fields={getApplicationFields(vacancy.applicationFormSchema)} responses={form.dynamicResponses ?? {}} onChange={setResponse} /> : null}
        {step === 3 ? <div className="space-y-4"><div><h2 className="font-semibold">Currículum opcional</h2><p className="mt-1 text-sm text-muted-foreground">Puedes enviarlo ahora o continuar sin archivo. Te pediremos información adicional solo si el proceso la requiere.</p></div><FileUpload accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" maxFiles={1} maxSizeBytes={15 * 1024 * 1024} onFiles={(files) => { setResumeFile(files[0] ?? null); setParsedResume(null); }} />{resumeFile ? <div className="space-y-3 rounded-xl border p-4 text-sm"><div className="flex flex-wrap items-center justify-between gap-3"><span>{resumeFile.name} · {(resumeFile.size / 1024 / 1024).toFixed(2)} MB</span><Button type="button" size="sm" variant="ghost" onClick={() => { setResumeFile(null); setParsedResume(null); }}>Quitar</Button></div>{!getCandidateSession() ? <div className="space-y-3 border-t pt-3"><p className="text-muted-foreground">Inicia sesión o crea una cuenta solo si quieres analizar y autocompletar desde el CV.</p><div className="flex gap-2"><Button type="button" size="sm" variant={accountMode === "login" ? "default" : "secondary"} onClick={() => setAccountMode("login")}>Ya tengo cuenta</Button><Button type="button" size="sm" variant={accountMode === "register" ? "default" : "secondary"} onClick={() => setAccountMode("register")}>Crear cuenta</Button></div><Field label="Contraseña del portal" type="password" required value={candidatePassword} onChange={setCandidatePassword} /></div> : null}<Button type="button" variant="secondary" disabled={parseResume.isPending || (!getCandidateSession() && candidatePassword.length < 10)} onClick={() => parseResume.mutate()}>{parseResume.isPending ? "Analizando…" : "Autocompletar desde CV"}</Button></div> : null}{parsedResume ? <div role="status" className="space-y-3 rounded-xl bg-secondary/40 p-4"><p className="font-medium">Datos detectados · confianza {parsedResume.confidence}</p><dl className="grid gap-2 text-sm md:grid-cols-2"><div><dt className="text-muted-foreground">Nombre</dt><dd>{parsedResume.fields.fullName || "No detectado"}</dd></div><div><dt className="text-muted-foreground">Correo</dt><dd>{parsedResume.fields.email || "No detectado"}</dd></div><div><dt className="text-muted-foreground">Teléfono</dt><dd>{parsedResume.fields.phone || "No detectado"}</dd></div><div><dt className="text-muted-foreground">LinkedIn</dt><dd className="break-all">{parsedResume.fields.linkedinUrl || "No detectado"}</dd></div></dl><Button type="button" onClick={applyParsedResume}>Completar solo campos vacíos</Button></div> : null}</div> : null}
        {step === 4 ? <div className="space-y-5"><dl className="grid gap-3 rounded-xl bg-secondary/40 p-5 text-sm"><div><dt className="text-muted-foreground">Nombre</dt><dd className="font-medium">{form.fullName}</dd></div><div><dt className="text-muted-foreground">Correo</dt><dd className="font-medium">{form.email}</dd></div><div><dt className="text-muted-foreground">Vacante</dt><dd className="font-medium">{vacancy.title}</dd></div>{resumeFile ? <div><dt className="text-muted-foreground">CV privado</dt><dd className="font-medium">{resumeFile.name}</dd></div> : null}</dl><div className="space-y-3 rounded-xl border p-4"><h2 className="font-semibold">Acceso al seguimiento</h2><p className="text-sm text-muted-foreground">Solo te pedimos una cuenta al enviar, para que puedas consultar el estado de la postulación después.</p><div className="flex gap-2"><Button type="button" size="sm" variant={accountMode === "login" ? "default" : "secondary"} onClick={() => setAccountMode("login")}>Ya tengo cuenta</Button><Button type="button" size="sm" variant={accountMode === "register" ? "default" : "secondary"} onClick={() => setAccountMode("register")}>Crear cuenta</Button></div><Field label="Contraseña del portal" type="password" required value={candidatePassword} onChange={setCandidatePassword} /></div><label className="flex items-start gap-3"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 size-4" /><span className="text-sm leading-6">Confirmo que la información es correcta y autorizo su tratamiento para este proceso.</span></label></div> : null}
        {step === 5 && receipt ? <div className="space-y-5 text-center" role="status"><div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Check /></div><h2 className="text-2xl font-semibold">Postulación enviada correctamente</h2><p className="text-muted-foreground">Número de postulación: <strong className="text-foreground">{receipt.id}</strong></p><p className="text-sm text-muted-foreground">Puedes revisar el estado desde el portal de candidatos con el mismo correo y acceso.</p><div className="flex flex-wrap justify-center gap-2"><Button asChild variant="secondary"><Link href={`/application-status?reference=${encodeURIComponent(receipt.id)}`}>Ir al seguimiento</Link></Button><Button asChild><Link href="/candidate/portal">Abrir portal</Link></Button></div></div> : null}
        {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
        {step < 5 ? <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-2"><Button type="button" variant="secondary" onClick={back} disabled={step === 0}><ChevronLeft className="size-4" />Anterior</Button>{step > 0 ? <Button type="button" variant="ghost" onClick={pause}>Guardar y salir</Button> : null}</div>{step < 4 ? <Button type="button" onClick={next}>Siguiente<ChevronRight className="size-4" /></Button> : <Button type="button" onClick={() => submitMutation.mutate()} disabled={!consent || submitMutation.isPending}>{submitMutation.isPending ? "Enviando…" : "Enviar postulación"}<Send className="size-4" /></Button>}</div> : null}
      </CardContent></Card></Wizard>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  const id = label.toLowerCase().replace(/\W+/g, "-");
  return <div className="space-y-2"><Label htmlFor={id}>{label}{required ? " *" : ""}</Label><Input id={id} type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-xl" /></div>;
}

function DynamicQuestions({ fields, responses, onChange }: { fields: VacancyApplicationField[]; responses: Record<string, unknown>; onChange: (key: string, value: unknown) => void }) {
  if (!fields.length) return <div className="rounded-xl border border-dashed p-5"><h2 className="font-medium">No hay preguntas adicionales</h2><p className="mt-2 text-sm text-muted-foreground">Puedes continuar sin completar más información.</p></div>;
  const required = fields.filter((field) => field.required);
  const optional = fields.filter((field) => !field.required);
  return <div className="space-y-5"><div><h2 className="font-semibold">Preguntas de la vacante</h2><p className="mt-1 text-sm text-muted-foreground">Completa solo las preguntas marcadas como obligatorias.</p></div>{required.map((field) => <ApplicationQuestion key={field.key} field={field} value={responses[field.key]} onChange={onChange} />)}{optional.length ? <details className="rounded-xl border p-4"><summary className="cursor-pointer font-medium">Agregar {optional.length} pregunta(s) opcional(es)</summary><div className="mt-5 space-y-5">{optional.map((field) => <ApplicationQuestion key={field.key} field={field} value={responses[field.key]} onChange={onChange} />)}</div></details> : null}</div>;
}

function ApplicationQuestion({ field, value, onChange }: { field: VacancyApplicationField; value: unknown; onChange: (key: string, value: unknown) => void }) {
  const id = `question-${field.key}`;
  return <div className="space-y-2"><Label htmlFor={id}>{field.label}{field.required ? " *" : ""}</Label>{field.type === "TEXTAREA" ? <textarea id={id} required={field.required} value={String(value ?? "")} placeholder={field.placeholder} onChange={(event) => onChange(field.key, event.target.value)} className="min-h-28 w-full rounded-xl border bg-background p-3" /> : field.type === "SINGLE_SELECT" ? <select id={id} required={field.required} value={String(value ?? "")} onChange={(event) => onChange(field.key, event.target.value)} className="h-12 w-full rounded-xl border bg-background px-3"><option value="">Selecciona una opción</option>{field.options?.map((option) => <option key={option}>{option}</option>)}</select> : field.type === "MULTI_SELECT" ? <fieldset className="space-y-2"><legend className="sr-only">{field.label}</legend>{field.options?.map((option) => <label key={option} className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={Array.isArray(value) && value.includes(option)} onChange={(event) => { const current = Array.isArray(value) ? value : []; onChange(field.key, event.target.checked ? [...current, option] : current.filter((entry) => entry !== option)); }} />{option}</label>)}</fieldset> : field.type === "BOOLEAN" ? <label className="flex min-h-11 items-center gap-3"><input id={id} type="checkbox" checked={value === true} onChange={(event) => onChange(field.key, event.target.checked)} />Sí</label> : <Input id={id} required={field.required} type={field.type === "URL" ? "url" : field.type === "NUMBER" ? "number" : "text"} value={String(value ?? "")} placeholder={field.placeholder} onChange={(event) => onChange(field.key, field.type === "NUMBER" && event.target.value !== "" ? Number(event.target.value) : event.target.value)} className="h-12 rounded-xl" />}{field.helperText ? <p className="text-sm text-muted-foreground">{field.helperText}</p> : null}</div>;
}

export default function ApplyPage() { return <Suspense fallback={<AsyncState state="loading" />}><ApplyWizard /></Suspense>; }
