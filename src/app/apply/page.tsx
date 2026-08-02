"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { authenticateCandidate, exchangeCandidateSocialCode, fetchPublicVacancy, getCandidateSession, parseCandidateResume, startCandidateSocialLogin, submitCandidateApplication } from "@/lib/backend";
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

const steps = ["Vacante", "Datos personales", "Experiencia", "Preguntas", "Documentos", "Revisión y consentimiento", "Confirmación"];
const emptyForm: PublicApplicationInput = { fullName: "", email: "", phone: "", city: "", linkedinUrl: "", portfolioUrl: "", coverLetter: "", dynamicResponses: {} };
const DRAFT_TTL_MS = 30 * 60 * 1000;

function ApplyWizard() {
  const params = useSearchParams();
  const vacancyId = params.get("vacancyId") ?? "";
  const socialCode = params.get("socialCode");
  const draftKey = `talentos.application-draft.${vacancyId}`;
  const initialDraft = useMemo(() => {
    if (!vacancyId || typeof window === "undefined") return null;
    try {
      const draft = JSON.parse(sessionStorage.getItem(draftKey) ?? "null") as { form: PublicApplicationInput; savedAt: string; expiresAt: number } | null;
      return draft;
    } catch { sessionStorage.removeItem(draftKey); return null; }
  }, [draftKey, vacancyId]);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<PublicApplicationInput>(() => ({ ...emptyForm, ...initialDraft?.form }));
  const [consent, setConsent] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [candidatePassword, setCandidatePassword] = useState("");
  const [accountMode, setAccountMode] = useState<"login" | "register">("login");
  const [savedAt, setSavedAt] = useState<Date | null>(() => initialDraft?.savedAt ? new Date(initialDraft.savedAt) : null);
  const [error, setError] = useState("");
  const [parsedResume, setParsedResume] = useState<ParsedResumeDto | null>(null);
  const vacancyQuery = useQuery({ queryKey: ["public-vacancy", vacancyId], queryFn: () => fetchPublicVacancy(vacancyId), enabled: Boolean(vacancyId), retry: false });
  const submitMutation = useMutation({ mutationFn: async () => {
    if (!getCandidateSession()) await authenticateCandidate(form.email, candidatePassword, accountMode);
    return submitCandidateApplication(vacancyId, form, resumeFile, consent);
  }, onSuccess: (receipt) => { sessionStorage.removeItem(draftKey); sessionStorage.setItem(`talentos.application-receipt.${receipt.id}`, JSON.stringify(receipt)); setStep(6); }, onError: (cause) => setError(cause instanceof Error ? cause.message : "No fue posible enviar la postulación.") });
  const parseResume = useMutation({ mutationFn: async () => { if (!resumeFile) throw new Error("Selecciona un CV."); if (!getCandidateSession()) { await authenticateCandidate(form.email, candidatePassword, accountMode); setAccountMode("login"); } return parseCandidateResume(resumeFile); }, onSuccess: setParsedResume, onError: (cause) => setError(cause instanceof Error ? cause.message : "No fue posible analizar el CV.") });
  const social = useMutation({ mutationFn: (provider: "linkedin" | "indeed") => startCandidateSocialLogin(provider, window.location.href), onSuccess: ({ authorizationUrl }) => window.location.assign(authorizationUrl), onError: (cause) => setError(cause instanceof Error ? cause.message : "La integración social no está disponible.") });

  useEffect(() => {
    if (!initialDraft?.expiresAt) return;
    const timeout = window.setTimeout(() => { sessionStorage.removeItem(draftKey); setForm(emptyForm); setSavedAt(null); }, Math.max(0, initialDraft.expiresAt - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [draftKey, initialDraft?.expiresAt]);

  useEffect(() => {
    if (!socialCode) return;
    void exchangeCandidateSocialCode(socialCode).then((session) => {
      setForm((current) => ({ ...current, email: session.candidate.email, fullName: session.candidate.fullName ?? current.fullName, phone: session.candidate.phone ?? current.phone, city: session.candidate.city ?? current.city, linkedinUrl: session.candidate.linkedinUrl ?? current.linkedinUrl, portfolioUrl: session.candidate.portfolioUrl ?? current.portfolioUrl }));
      setAccountMode("login");
    }).catch((cause) => setError(cause instanceof Error ? cause.message : "No fue posible importar el perfil."));
  }, [socialCode]);

  useEffect(() => {
    if (!vacancyId || step === 6) return;
    const timeout = window.setTimeout(() => {
      const now = new Date();
      const minimized = Object.fromEntries(Object.entries(form).filter(([, value]) => value !== "" && value != null && (typeof value !== "object" || Object.keys(value).length > 0)));
      sessionStorage.setItem(draftKey, JSON.stringify({ form: minimized, savedAt: now.toISOString(), expiresAt: now.getTime() + DRAFT_TTL_MS }));
      setSavedAt(now);
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [draftKey, form, step, vacancyId]);

  const setField = (field: keyof PublicApplicationInput, value: string) => { setForm((current) => ({ ...current, [field]: value })); setError(""); };
  const setResponse = (key: string, value: unknown) => { setForm((current) => ({ ...current, dynamicResponses: { ...current.dynamicResponses, [key]: value } })); setError(""); };
  const validate = () => {
    if (step === 1 && (!form.fullName.trim() || !/^\S+@\S+\.\S+$/.test(form.email))) return "Ingresa tu nombre completo y un correo válido.";
    if (step === 3) { const missing = missingRequiredApplicationFields(vacancyQuery.data?.applicationFormSchema, form.dynamicResponses); if (missing.length) return `Responde los campos obligatorios: ${missing.map((field) => field.label).join(", ")}.`; }
    if (step === 5 && !getCandidateSession() && candidatePassword.length < 10) return "La contraseña del portal debe tener al menos 10 caracteres.";
    if (step === 5 && !consent) return "Debes aceptar la declaración y el tratamiento de datos antes de enviar.";
    return "";
  };
  const next = () => { const message = validate(); if (message) return setError(message); setError(""); setStep((value) => Math.min(value + 1, 5)); };
  const location = useMemo(() => [vacancyQuery.data?.city, vacancyQuery.data?.country].filter(Boolean).join(", "), [vacancyQuery.data]);

  if (!vacancyId) return <><CandidateNav /><Card className="mx-auto max-w-2xl border-dashed"><CardContent className="space-y-5 py-14 text-center"><h1 className="text-2xl font-semibold">Selecciona una vacante antes de comenzar</h1><p className="text-muted-foreground">Así podremos asociar tu información con la oportunidad correcta.</p><Button asChild><Link href="/jobs">Explorar vacantes</Link></Button></CardContent></Card></>;
  if (vacancyQuery.isLoading) return <AsyncState state="loading" title="Preparando tu postulación" />;
  if (vacancyQuery.isError || !vacancyQuery.data) return <AsyncState state="error" description="No pudimos verificar esta vacante. No ingreses datos personales hasta recuperar la conexión." onRetry={() => void vacancyQuery.refetch()} />;
  const vacancy = vacancyQuery.data;
  const receipt = submitMutation.data;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-14 pt-2">
      <CandidateNav />
      <section className="space-y-4 rounded-[2rem] border bg-card p-6 md:p-8">
        <Badge variant="secondary">Postulación segura</Badge><h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{vacancy.title}</h1><p className="text-muted-foreground">{vacancy.tenant?.name}{location ? ` · ${location}` : ""}</p>
        {step < 6 ? <div className="space-y-2"><p className="text-sm text-muted-foreground" aria-live="polite">{savedAt ? `Borrador temporal guardado a las ${savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}; se eliminará después de 30 minutos o al cerrar el navegador.` : "El borrador permanecerá únicamente durante esta sesión y caducará en 30 minutos."}</p><p className="text-xs text-amber-700">Si compartes este dispositivo, elimina el borrador antes de retirarte.</p>{savedAt ? <Button type="button" size="sm" variant="ghost" onClick={() => { sessionStorage.removeItem(draftKey); setForm(emptyForm); setSavedAt(null); }}>Eliminar borrador</Button> : null}</div> : null}
      </section>
      <Wizard steps={steps} current={step} onStepChange={step < 6 ? setStep : undefined}>
      <Card><CardHeader><CardTitle>{steps[step]}</CardTitle></CardHeader><CardContent className="space-y-6">
        {step === 0 ? <div className="space-y-4"><p className="leading-7 text-muted-foreground">{vacancy.description || vacancy.summary || "Revisa la información disponible antes de continuar."}</p>{vacancy.requirements ? <div><h2 className="font-semibold">Requisitos</h2><p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">{vacancy.requirements}</p></div> : null}</div> : null}
        {step === 1 ? <div className="space-y-5"><div className="grid gap-4 md:grid-cols-2"><Field label="Nombre completo" required value={form.fullName} onChange={(value) => setField("fullName", value)} /><Field label="Correo electrónico" type="email" required value={form.email} onChange={(value) => setField("email", value)} /><Field label="Teléfono" value={form.phone || ""} onChange={(value) => setField("phone", value)} /><Field label="Ciudad" value={form.city || ""} onChange={(value) => setField("city", value)} /></div><div className="rounded-xl border p-4"><h2 className="font-semibold">Importar perfil</h2><p className="mt-1 text-sm text-muted-foreground">LinkedIn e Indeed requieren autorización OAuth y nunca comparten tu contraseña con el ATS.</p><div className="mt-3 flex flex-wrap gap-2"><Button type="button" variant="secondary" onClick={() => social.mutate("linkedin")} disabled={social.isPending}>Continuar con LinkedIn</Button><Button type="button" variant="secondary" onClick={() => social.mutate("indeed")} disabled={social.isPending}>Continuar con Indeed</Button></div></div></div> : null}
        {step === 2 ? <div className="space-y-4"><Field label="LinkedIn (opcional)" type="url" value={form.linkedinUrl || ""} onChange={(value) => setField("linkedinUrl", value)} /><Field label="Portafolio (opcional)" type="url" value={form.portfolioUrl || ""} onChange={(value) => setField("portfolioUrl", value)} /><div className="space-y-2"><Label htmlFor="coverLetter">Experiencia y motivación</Label><textarea id="coverLetter" maxLength={4000} value={form.coverLetter || ""} onChange={(event) => setField("coverLetter", event.target.value)} className="min-h-40 w-full rounded-xl border bg-background p-3" /></div></div> : null}
        {step === 3 ? <DynamicQuestions fields={getApplicationFields(vacancy.applicationFormSchema)} responses={form.dynamicResponses ?? {}} onChange={setResponse} /> : null}
        {step === 4 ? <div className="space-y-4"><div><h2 className="font-semibold">Currículum</h2><p className="mt-1 text-sm text-muted-foreground">PDF o DOCX de hasta 15 MB. Se valida, escanea y procesa en memoria; tú decides si aplicar los datos detectados.</p></div><FileUpload accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" maxFiles={1} maxSizeBytes={15 * 1024 * 1024} onFiles={(files) => { setResumeFile(files[0] ?? null); setParsedResume(null); }} />{resumeFile ? <div className="space-y-3 rounded-xl border p-4 text-sm"><div className="flex flex-wrap items-center justify-between gap-3"><span>{resumeFile.name} · {(resumeFile.size / 1024 / 1024).toFixed(2)} MB</span><Button type="button" size="sm" variant="ghost" onClick={() => { setResumeFile(null); setParsedResume(null); }}>Quitar</Button></div>{!getCandidateSession() ? <div className="space-y-3 border-t pt-3"><p className="text-muted-foreground">Para proteger el CV, inicia sesión o crea tu cuenta antes del análisis.</p><div className="flex gap-2"><Button type="button" size="sm" variant={accountMode === "login" ? "default" : "secondary"} onClick={() => setAccountMode("login")}>Ya tengo cuenta</Button><Button type="button" size="sm" variant={accountMode === "register" ? "default" : "secondary"} onClick={() => setAccountMode("register")}>Crear cuenta</Button></div><Field label="Contraseña del portal para analizar CV" type="password" required value={candidatePassword} onChange={setCandidatePassword} /></div> : null}<Button type="button" variant="secondary" disabled={parseResume.isPending || (!getCandidateSession() && candidatePassword.length < 10)} onClick={() => parseResume.mutate()}>{parseResume.isPending ? "Analizando…" : "Analizar y autocompletar"}</Button></div> : null}{parsedResume ? <div role="status" className="space-y-3 rounded-xl bg-secondary/40 p-4"><p className="font-medium">Datos detectados · confianza {parsedResume.confidence}</p><dl className="grid gap-2 text-sm md:grid-cols-2"><div><dt className="text-muted-foreground">Nombre</dt><dd>{parsedResume.fields.fullName || "No detectado"}</dd></div><div><dt className="text-muted-foreground">Correo</dt><dd>{parsedResume.fields.email || "No detectado"}</dd></div><div><dt className="text-muted-foreground">Teléfono</dt><dd>{parsedResume.fields.phone || "No detectado"}</dd></div><div><dt className="text-muted-foreground">LinkedIn</dt><dd className="break-all">{parsedResume.fields.linkedinUrl || "No detectado"}</dd></div></dl><Button type="button" onClick={() => setForm((current) => ({ ...current, ...Object.fromEntries(Object.entries(parsedResume.fields).filter(([, value]) => Boolean(value))) }))}>Aplicar datos revisados</Button></div> : null}</div> : null}
        {step === 5 ? <div className="space-y-5"><dl className="grid gap-3 rounded-xl bg-secondary/40 p-5 text-sm"><div><dt className="text-muted-foreground">Nombre</dt><dd className="font-medium">{form.fullName}</dd></div><div><dt className="text-muted-foreground">Correo</dt><dd className="font-medium">{form.email}</dd></div><div><dt className="text-muted-foreground">Vacante</dt><dd className="font-medium">{vacancy.title}</dd></div>{resumeFile ? <div><dt className="text-muted-foreground">CV privado</dt><dd className="font-medium">{resumeFile.name}</dd></div> : null}</dl><div className="space-y-3 rounded-xl border p-4"><h2 className="font-semibold">Acceso al seguimiento</h2><p className="text-sm text-muted-foreground">Tu postulación quedará vinculada a un portal autenticado. Usa el mismo correo indicado arriba.</p><div className="flex gap-2"><Button type="button" size="sm" variant={accountMode === "login" ? "default" : "secondary"} onClick={() => setAccountMode("login")}>Ya tengo cuenta</Button><Button type="button" size="sm" variant={accountMode === "register" ? "default" : "secondary"} onClick={() => setAccountMode("register")}>Crear cuenta</Button></div><Field label="Contraseña del portal" type="password" required value={candidatePassword} onChange={setCandidatePassword} /></div><label className="flex items-start gap-3"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 size-4" /><span className="text-sm leading-6">Declaro que la información es correcta y autorizo el tratamiento de mis datos y del CV para este proceso. El consentimiento, su versión, fecha y contexto de envío quedarán registrados.</span></label></div> : null}
        {step === 6 && receipt ? <div className="space-y-5 text-center" role="status"><div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Check /></div><h2 className="text-2xl font-semibold">Postulación enviada correctamente</h2><p className="text-muted-foreground">Número de postulación: <strong className="text-foreground">{receipt.id}</strong></p><Button asChild variant="secondary"><Link href={`/application-status?reference=${encodeURIComponent(receipt.id)}`}>Ir al seguimiento</Link></Button></div> : null}
        {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
        {step < 6 ? <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-between"><Button type="button" variant="secondary" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0}><ChevronLeft className="size-4" />Anterior</Button>{step < 5 ? <Button type="button" onClick={next}>Siguiente<ChevronRight className="size-4" /></Button> : <Button type="button" onClick={() => submitMutation.mutate()} disabled={!consent || submitMutation.isPending}>{submitMutation.isPending ? "Enviando…" : "Enviar postulación"}<Send className="size-4" /></Button>}</div> : null}
      </CardContent></Card></Wizard>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  const id = label.toLowerCase().replace(/\W+/g, "-");
  return <div className="space-y-2"><Label htmlFor={id}>{label}{required ? " *" : ""}</Label><Input id={id} type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-xl" /></div>;
}

function DynamicQuestions({ fields, responses, onChange }: { fields: VacancyApplicationField[]; responses: Record<string, unknown>; onChange: (key: string, value: unknown) => void }) {
  if (!fields.length) return <div className="rounded-xl border border-dashed p-5"><h2 className="font-medium">Sin preguntas adicionales</h2><p className="mt-2 text-sm text-muted-foreground">Esta vacante no solicita respuestas adicionales.</p></div>;
  return <div className="space-y-5">{fields.map((field) => { const id = `question-${field.key}`; const value = responses[field.key]; return <div key={field.key} className="space-y-2"><Label htmlFor={id}>{field.label}{field.required ? " *" : ""}</Label>{field.type === "TEXTAREA" ? <textarea id={id} required={field.required} value={String(value ?? "")} placeholder={field.placeholder} onChange={(event) => onChange(field.key, event.target.value)} className="min-h-28 w-full rounded-xl border bg-background p-3" /> : field.type === "SINGLE_SELECT" ? <select id={id} required={field.required} value={String(value ?? "")} onChange={(event) => onChange(field.key, event.target.value)} className="h-12 w-full rounded-xl border bg-background px-3"><option value="">Selecciona una opción</option>{field.options?.map((option) => <option key={option}>{option}</option>)}</select> : field.type === "MULTI_SELECT" ? <fieldset className="space-y-2"><legend className="sr-only">{field.label}</legend>{field.options?.map((option) => <label key={option} className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={Array.isArray(value) && value.includes(option)} onChange={(event) => { const current = Array.isArray(value) ? value : []; onChange(field.key, event.target.checked ? [...current, option] : current.filter((entry) => entry !== option)); }} />{option}</label>)}</fieldset> : field.type === "BOOLEAN" ? <label className="flex min-h-11 items-center gap-3"><input id={id} type="checkbox" checked={value === true} onChange={(event) => onChange(field.key, event.target.checked)} />Sí</label> : <Input id={id} required={field.required} type={field.type === "URL" ? "url" : field.type === "NUMBER" ? "number" : "text"} value={String(value ?? "")} placeholder={field.placeholder} onChange={(event) => onChange(field.key, field.type === "NUMBER" && event.target.value !== "" ? Number(event.target.value) : event.target.value)} className="h-12 rounded-xl" />}{field.helperText ? <p className="text-sm text-muted-foreground">{field.helperText}</p> : null}</div>; })}</div>;
}

export default function ApplyPage() { return <Suspense fallback={<AsyncState state="loading" />}><ApplyWizard /></Suspense>; }
