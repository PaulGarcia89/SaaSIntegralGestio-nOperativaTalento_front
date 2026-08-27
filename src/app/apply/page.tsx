"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { trackProductEvent } from "@/lib/product-analytics";
import { ApiError, authenticateCandidate, deletePublicApplicationDraft, exchangeCandidateSocialCode, fetchCandidateApplicationDraft, fetchCandidateProfile, fetchPublicApplicationDraft, fetchPublicVacancy, getCandidateSession, parseCandidateResume, requestCandidatePasswordReset, saveCandidateApplicationDraft, savePublicApplicationDraft, startCandidateSocialLogin, submitCandidateApplication } from "@/lib/backend";
import type { ParsedResumeDto, PublicApplicationInput } from "@/lib/contracts";
import type { VacancyApplicationField } from "@/lib/contracts";
import { getApplicationFields, missingRequiredApplicationFields } from "@/lib/application-form";
import { AsyncState } from "@/components/async-state";
import { CandidateNav } from "@/components/candidate-nav";
import { CandidateAuthCard } from "@/components/candidate-auth-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wizard } from "@/components/design-system";
import { FileUpload } from "@/components/ui/file-upload";
import { validateAtsResumeFile } from "@/lib/ats-file-security";
import { useCareerPortal } from "@/components/portal-context";

const steps = ["Acceso del postulante", "Vacante", "Tu perfil", "Preguntas", "CV", "Enviar", "Confirmación"];
const builtInQuestionKeys = new Set(["is18OrOlder", "authorizedToWorkInUS", "workedForCompany", "familyWorksForCompany", "felonyConviction", "workedForCompanyExplanation", "familyWorksForCompanyExplanation", "felonyConvictionExplanation", "employmentPreference", "shiftPreference", "employmentType", "desiredHourlyWage", "previousEmployerMayContactSupervisor", "previousEmployerCompany", "previousEmployerPosition", "previousEmployerAddress", "previousEmployerLocation", "previousEmployerStartDate", "previousEmployerEndDate", "previousEmployerEndingSalary", "previousEmployerSupervisor", "previousEmployerPhone", "previousEmployerLeavingReason", "reference1Name", "reference1Relationship", "reference1Phone", "reference2Name", "reference2Relationship", "reference2Phone", "reference3Name", "reference3Relationship", "reference3Phone", "applicationDeclaration", "signatureName"]);
const normalizeQuestionLabel = (label: string) => label.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const builtInQuestionLabels = new Set(["si respondiste si, explica si has trabajado para esta empresa", "si respondiste si, explica si un familiar trabaja para esta empresa", "si respondiste si, explica la condena", "preferencia de puesto", "preferencia de turno", "tipo de jornada", "salario deseado por hora"]);
const emptyForm: PublicApplicationInput = { fullName: "", email: "", phone: "", city: "", linkedinUrl: "", portfolioUrl: "", coverLetter: "", dynamicResponses: {} };
type PublicApplicationDraftState = { step: number; form: PublicApplicationInput; flowVersion?: number; pausedAt?: string };
type PublicApplicationProgress = { step: number; form: PublicApplicationInput; flowVersion: 3; pausedAt?: string; resumedAt?: string };
const normalizeDraftStep = (draft: PublicApplicationDraftState) => draft.flowVersion === 3 ? Math.min(Math.max(draft.step, 0), 6) : draft.flowVersion === 2 ? [1, 0, 2, 3, 4, 5, 6][Math.min(Math.max(draft.step, 0), 6)] ?? 0 : [1, 2, 3, 4, 5, 6][Math.min(Math.max(draft.step, 0), 5)] ?? 0;
const candidateAccessError = (cause: unknown, fallback: string) => {
  if (cause instanceof ApiError && cause.status === 401) return "La contraseña no coincide con esta cuenta. Intenta nuevamente o solicita un enlace para restablecerla.";
  if (cause instanceof ApiError && cause.status === 409) return "Ya existe una cuenta con este correo. Selecciona \"Ya tengo cuenta\" e ingresa tu contraseña.";
  return cause instanceof Error ? cause.message : fallback;
};

function ApplyWizard() {
  const params = useSearchParams();
  const router = useRouter();
  const vacancyId = params.get("vacancyId") ?? "";
  const vacancySlug = params.get("vacancySlug") ?? vacancyId;
  const { portal } = useCareerPortal();
  const socialCode = params.get("socialCode");
  const [authenticated, setAuthenticated] = useState(() => Boolean(getCandidateSession()));
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<PublicApplicationInput>(emptyForm);
  const [consent, setConsent] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [candidatePassword, setCandidatePassword] = useState("");
  const [accountMode, setAccountMode] = useState<"login" | "register">("login");
  const [recoverySent, setRecoverySent] = useState(false);
  const [resumeBlockedByScanner, setResumeBlockedByScanner] = useState(false);
  const [error, setError] = useState("");
  const [parsedResume, setParsedResume] = useState<ParsedResumeDto | null>(null);
  const [formStartedAt] = useState(() => new Date().toISOString());
  const [website, setWebsite] = useState("");
  const [draftLoaded, setDraftLoaded] = useState(false);
  const draftTimer = useRef<number | null>(null);
  const pausing = useRef(false);
  const draftRestored = useRef(false);
  const vacancyQuery = useQuery({ queryKey: ["public-vacancy", portal?.portalId ?? "pending", vacancySlug], queryFn: () => fetchPublicVacancy(vacancySlug, portal?.slug), enabled: Boolean(vacancySlug && portal?.slug), retry: false });
  const savedProfile = useQuery({ queryKey: ["candidate-profile", "apply"], queryFn: fetchCandidateProfile, enabled: authenticated, retry: false });
  const draftQuery = useQuery({ queryKey: ["public-application-draft", vacancyId], queryFn: () => fetchPublicApplicationDraft(vacancyId), enabled: Boolean(vacancyId), retry: false });
  const accountDraft = useQuery({ queryKey: ["candidate-application-draft", vacancyId], queryFn: () => fetchCandidateApplicationDraft(vacancyId), enabled: Boolean(vacancyId && authenticated), retry: false });
  const submitMutation = useMutation({ mutationFn: async () => {
    if (!getCandidateSession()) await authenticateCandidate(form.email, candidatePassword, accountMode);
    return submitCandidateApplication(vacancyId, form, resumeFile, consent, { website, formStartedAt });
  }, onSuccess: async () => { await deletePublicApplicationDraft(vacancyId).catch(() => undefined); trackProductEvent({ name: "flow_completed", flow: "vacancy" }); setStep(6); }, onError: (cause) => {
    if (cause instanceof ApiError && cause.status === 503 && resumeFile) {
      setResumeBlockedByScanner(true);
      setError("El análisis seguro del CV no está disponible temporalmente. Puedes enviar la postulación sin el archivo o guardarla y volver más tarde.");
      return;
    }
    setError(candidateAccessError(cause, "No fue posible enviar la postulación."));
  } });
  const parseResume = useMutation({ mutationFn: async () => { if (!resumeFile) throw new Error("Selecciona un CV."); if (!getCandidateSession()) { await authenticateCandidate(form.email, candidatePassword, accountMode); setAuthenticated(true); } return parseCandidateResume(resumeFile); }, onSuccess: setParsedResume, onError: (cause) => setError(candidateAccessError(cause, "No fue posible analizar el CV.")) });
  const passwordRecovery = useMutation({ mutationFn: () => requestCandidatePasswordReset(form.email), onSuccess: () => { setRecoverySent(true); setError(""); }, onError: (cause) => setError(candidateAccessError(cause, "No fue posible solicitar la recuperación.")) });
  const social = useMutation({ mutationFn: (provider: "linkedin" | "indeed") => startCandidateSocialLogin(provider, window.location.href), onSuccess: ({ authorizationUrl }) => window.location.assign(authorizationUrl), onError: (cause) => setError(cause instanceof Error ? cause.message : "La integración social no está disponible.") });

  useEffect(() => {
    const source = accountDraft.data?.value ? accountDraft.data : draftQuery.data;
    if (!source?.value || draftRestored.current) return;
    draftRestored.current = true;
    const draft = source.value as unknown as PublicApplicationDraftState;
    if (draft.form) queueMicrotask(() => setForm(draft.form));
    const restoredStep = authenticated ? normalizeDraftStep(draft) : 0;
    if (typeof draft.step === "number") queueMicrotask(() => setStep(restoredStep));
    queueMicrotask(() => setDraftLoaded(true));
    if (draft.pausedAt) void (authenticated ? saveCandidateApplicationDraft(vacancyId, { step: restoredStep, form: draft.form, flowVersion: 3, resumedAt: new Date().toISOString() }) : savePublicApplicationDraft(vacancyId, { step: restoredStep, form: draft.form, flowVersion: 3, resumedAt: new Date().toISOString() })).catch(() => undefined);
    trackProductEvent({ name: "flow_step_viewed", flow: "vacancy", step: restoredStep });
  }, [draftQuery.data, accountDraft.data]);

  useEffect(() => {
    if (!vacancyId || !draftQuery.isSuccess || pausing.current) return;
    if (draftTimer.current) window.clearTimeout(draftTimer.current);
    draftTimer.current = window.setTimeout(() => {
      const progress: PublicApplicationProgress = { step, form, flowVersion: 3 };
      void (authenticated ? saveCandidateApplicationDraft(vacancyId, progress) : savePublicApplicationDraft(vacancyId, progress)).catch(() => undefined);
    }, 300);
    return () => {
      if (draftTimer.current) window.clearTimeout(draftTimer.current);
    };
  }, [authenticated, form, step, vacancyId, draftQuery.isSuccess]);

  useEffect(() => {
    if (!socialCode) return;
    void exchangeCandidateSocialCode(socialCode).then((session) => {
      queueMicrotask(() => {
        setForm((current) => ({ ...current, email: session.candidate.email, fullName: session.candidate.fullName ?? current.fullName, phone: session.candidate.phone ?? current.phone, city: session.candidate.city ?? current.city, linkedinUrl: session.candidate.linkedinUrl ?? current.linkedinUrl, portfolioUrl: session.candidate.portfolioUrl ?? current.portfolioUrl }));
        setAccountMode("login");
      });
    }).catch((cause) => setError(cause instanceof Error ? cause.message : "No fue posible importar el perfil."));
  }, [socialCode]);

  useEffect(() => {
    if (!savedProfile.data) return;
    queueMicrotask(() => setForm((current) => ({ ...current, email: current.email || savedProfile.data.email, fullName: current.fullName || savedProfile.data.fullName || "", phone: current.phone || savedProfile.data.phone || "", city: current.city || savedProfile.data.city || "", linkedinUrl: current.linkedinUrl || savedProfile.data.linkedinUrl || "", portfolioUrl: current.portfolioUrl || savedProfile.data.portfolioUrl || "" })));
  }, [savedProfile.data]);

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
    if (step === 0 && !authenticated) return "Inicia sesión o crea tu cuenta para continuar.";
    if (step === 2 && (!form.fullName.trim() || !/^\S+@\S+\.\S+$/.test(form.email))) return "Ingresa tu nombre completo y un correo válido.";
    if (step === 3) { const missing = missingRequiredApplicationFields(vacancyQuery.data?.applicationFormSchema, form.dynamicResponses); if (missing.length) return `Responde los campos obligatorios: ${missing.map((field) => field.label).join(", ")}.`; }
    if (step === 5 && !getCandidateSession() && candidatePassword.length < 10) return "La contraseña del portal debe tener al menos 10 caracteres.";
    if (step === 5 && !consent) return "Debes aceptar la declaración y el tratamiento de datos antes de enviar.";
    return "";
  };
  const next = () => { const message = validate(); if (message) return setError(message); setError(""); trackProductEvent({ name: "flow_step_viewed", flow: "vacancy", step: step + 1 }); setStep((value) => Math.min(value + 1, 6)); };
  const back = () => { trackProductEvent({ name: "flow_step_back", flow: "vacancy", from: step, to: Math.max(0, step - 1) }); setStep((value) => Math.max(0, value - 1)); };
  const submit = () => {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setError("");
    submitMutation.mutate();
  };
  const pause = async () => {
    pausing.current = true;
    if (draftTimer.current) window.clearTimeout(draftTimer.current);
    try {
      await (authenticated ? saveCandidateApplicationDraft(vacancyId, { step, form, flowVersion: 3, pausedAt: new Date().toISOString() }) : savePublicApplicationDraft(vacancyId, { step, form, flowVersion: 3, pausedAt: new Date().toISOString() }));
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
      {step === 0 ? <CandidateAuthCard returnPath={`/apply?${params.toString()}`} portalLabel={portal?.company?.name ? `el portal de ${portal.company.name}` : "este portal"} onAuthenticated={() => { setAuthenticated(true); setError(""); setStep(1); }} /> : <>
      <section className="space-y-4 rounded-[2rem] border bg-card p-6 md:p-8">
        <Badge variant="secondary">Postulación segura</Badge><h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{vacancy.title}</h1><p className="text-muted-foreground">{vacancy.tenant?.name}{location ? ` · ${location}` : ""}</p>
        {draftLoaded ? <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-primary">Tu borrador está guardado en Railway y se reanudará automáticamente si vuelves desde este navegador o con el mismo enlace.</div> : null}
      </section>
      <Wizard steps={steps} current={step} onStepChange={step < 6 ? setStep : undefined}>
      {step === 4 ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Tu CV es opcional. Si lo adjuntas, aceptamos solo PDF o DOCX y lo protegemos con validación y análisis de seguridad.</p> : null}
      <Card><CardHeader><CardTitle>{steps[step]}</CardTitle></CardHeader><CardContent className="space-y-6">
        {step === 1 ? <div className="space-y-4"><p className="leading-7 text-muted-foreground">{vacancy.description || vacancy.summary || "Revisa la información disponible antes de continuar."}</p>{vacancy.requirements ? <div><h2 className="font-semibold">Requisitos</h2><p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">{vacancy.requirements}</p></div> : null}</div> : null}
        {step === 2 ? <CandidateProfileFields form={form} onChange={(key, value) => { if (["fullName", "email", "phone", "city"].includes(key)) setField(key as keyof PublicApplicationInput, String(value)); else setResponse(key, value); }} /> : null}
        {step === 3 ? <><DynamicQuestions fields={getApplicationFields(vacancy.applicationFormSchema).filter((field) => !builtInQuestionKeys.has(field.key) && !builtInQuestionLabels.has(normalizeQuestionLabel(field.label)))} responses={form.dynamicResponses ?? {}} onChange={setResponse} /><EmploymentAndReferenceQuestions responses={form.dynamicResponses ?? {}} onChange={setResponse} /></> : null}
        {step === 4 ? <div className="space-y-4"><div><h2 className="font-semibold">Currículum opcional</h2><p className="mt-1 text-sm text-muted-foreground">Puedes enviarlo ahora o continuar sin archivo. Te pediremos información adicional solo si el proceso la requiere.</p></div><FileUpload accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" maxFiles={1} maxSizeBytes={15 * 1024 * 1024} onFiles={(files) => { setResumeFile(files[0] ?? null); setParsedResume(null); setResumeBlockedByScanner(false); }} />{resumeFile ? <div className="space-y-3 rounded-xl border p-4 text-sm"><div className="flex flex-wrap items-center justify-between gap-3"><span>{resumeFile.name} · {(resumeFile.size / 1024 / 1024).toFixed(2)} MB</span><Button type="button" size="sm" variant="ghost" onClick={() => { setResumeFile(null); setParsedResume(null); setResumeBlockedByScanner(false); }}>Quitar</Button></div>{!getCandidateSession() ? <div className="space-y-3 border-t pt-3"><p className="text-muted-foreground">Inicia sesión o crea una cuenta solo si quieres analizar y autocompletar desde el CV.</p><div className="flex gap-2"><Button type="button" size="sm" variant={accountMode === "login" ? "default" : "secondary"} onClick={() => setAccountMode("login")}>Ya tengo cuenta</Button><Button type="button" size="sm" variant={accountMode === "register" ? "default" : "secondary"} onClick={() => setAccountMode("register")}>Crear cuenta</Button></div><Field label="Contraseña del portal" type="password" required value={candidatePassword} onChange={setCandidatePassword} /></div> : null}<Button type="button" variant="secondary" disabled={parseResume.isPending || (!getCandidateSession() && candidatePassword.length < 10)} onClick={() => parseResume.mutate()}>{parseResume.isPending ? "Analizando…" : "Autocompletar desde CV"}</Button></div> : null}{parsedResume ? <div role="status" className="space-y-3 rounded-xl bg-secondary/40 p-4"><p className="font-medium">Datos detectados · confianza {parsedResume.confidence}</p><dl className="grid gap-2 text-sm md:grid-cols-2"><div><dt className="text-muted-foreground">Nombre</dt><dd>{parsedResume.fields.fullName || "No detectado"}</dd></div><div><dt className="text-muted-foreground">Correo</dt><dd>{parsedResume.fields.email || "No detectado"}</dd></div><div><dt className="text-muted-foreground">Teléfono</dt><dd>{parsedResume.fields.phone || "No detectado"}</dd></div><div><dt className="text-muted-foreground">LinkedIn</dt><dd className="break-all">{parsedResume.fields.linkedinUrl || "No detectado"}</dd></div></dl><Button type="button" onClick={applyParsedResume}>Completar solo campos vacíos</Button></div> : null}</div> : null}
        {step === 5 ? <div className="space-y-5"><input tabIndex={-1} aria-hidden="true" autoComplete="off" name="website" value={website} onChange={(event) => setWebsite(event.target.value)} className="absolute -left-[10000px] h-px w-px opacity-0" /><dl className="grid gap-3 rounded-xl bg-secondary/40 p-5 text-sm"><div><dt className="text-muted-foreground">Nombre</dt><dd className="font-medium">{form.fullName}</dd></div><div><dt className="text-muted-foreground">Correo</dt><dd className="font-medium">{form.email}</dd></div><div><dt className="text-muted-foreground">Vacante</dt><dd className="font-medium">{vacancy.title}</dd></div>{resumeFile ? <div><dt className="text-muted-foreground">CV privado</dt><dd className="font-medium">{resumeFile.name}</dd></div> : null}</dl><div className="space-y-3 rounded-xl border p-4"><h2 className="font-semibold">Acceso al seguimiento</h2><p className="text-sm text-muted-foreground">Solo te pedimos una cuenta al enviar, para que puedas consultar el estado de la postulación después.</p><div className="flex gap-2"><Button type="button" size="sm" variant={accountMode === "login" ? "default" : "secondary"} onClick={() => { setAccountMode("login"); setRecoverySent(false); setError(""); }}>Ya tengo cuenta</Button><Button type="button" size="sm" variant={accountMode === "register" ? "default" : "secondary"} onClick={() => { setAccountMode("register"); setRecoverySent(false); setError(""); }}>Crear cuenta</Button></div><p className="text-sm text-muted-foreground">{accountMode === "login" ? "Ingresa la contraseña de una cuenta existente con este correo." : "Crea una cuenta solo si este correo no se ha usado antes en el portal."}</p><Field label="Contraseña del portal" type="password" required value={candidatePassword} onChange={(value) => { setCandidatePassword(value); setError(""); }} /><p className="text-sm text-muted-foreground">Usa al menos 10 caracteres. Esta cuenta te permitirá consultar el estado de tu postulación.</p>{accountMode === "login" ? <div className="space-y-2"><Button type="button" variant="ghost" className="h-auto px-0 text-primary hover:bg-transparent hover:text-primary" onClick={() => passwordRecovery.mutate()} disabled={!form.email || passwordRecovery.isPending}>{passwordRecovery.isPending ? "Solicitando enlace…" : "¿Olvidaste tu contraseña?"}</Button>{recoverySent ? <p role="status" className="text-sm text-emerald-700">Si existe una cuenta con este correo, enviamos un enlace seguro para restablecer la contraseña.</p> : null}</div> : null}</div><label className="flex items-start gap-3"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 size-4" /><span className="text-sm leading-6">Confirmo que la información es correcta y autorizo su tratamiento para este proceso.</span></label></div> : null}
        {step === 6 && receipt ? <div className="space-y-5 text-center" role="status"><div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Check /></div><h2 className="text-2xl font-semibold">Postulación enviada correctamente</h2><p className="text-muted-foreground">Número de postulación: <strong className="text-foreground">{receipt.id}</strong></p><p className="text-sm text-muted-foreground">Puedes revisar el estado desde el portal de candidatos con el mismo correo y acceso.</p><div className="flex flex-wrap justify-center gap-2"><Button asChild variant="secondary"><Link href={`/application-status?reference=${encodeURIComponent(receipt.id)}`}>Ir al seguimiento</Link></Button><Button asChild><Link href="/candidate/portal">Abrir portal</Link></Button></div></div> : null}
        {error ? <div className="space-y-3" role="alert"><p className="text-sm text-destructive">{error}</p>{resumeBlockedByScanner ? <Button type="button" variant="secondary" onClick={() => { setResumeFile(null); setParsedResume(null); setResumeBlockedByScanner(false); setError(""); }}>Quitar CV para continuar</Button> : null}</div> : null}
        {step < 6 ? <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-2"><Button type="button" variant="secondary" onClick={back} disabled={step === 0}><ChevronLeft className="size-4" />Anterior</Button>{step > 0 ? <Button type="button" variant="ghost" onClick={pause}>Guardar y salir</Button> : null}</div>{step < 5 ? <Button type="button" onClick={next}>Siguiente<ChevronRight className="size-4" /></Button> : <Button type="button" onClick={submit} disabled={!consent || submitMutation.isPending}>{submitMutation.isPending ? "Enviando…" : "Enviar postulación"}<Send className="size-4" /></Button>}</div> : null}
      </CardContent></Card></Wizard>
      </>}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  const id = label.toLowerCase().replace(/\W+/g, "-");
  return <div className="space-y-2"><Label htmlFor={id}>{label}{required ? " *" : ""}</Label><Input id={id} type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-xl" /></div>;
}

function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const id = label.toLowerCase().replace(/\W+/g, "-");
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><textarea id={id} value={value} onChange={(event) => onChange(event.target.value)} className="min-h-28 w-full rounded-xl border bg-background p-3" /></div>;
}

function CandidateProfileFields({ form, onChange }: { form: PublicApplicationInput; onChange: (key: string, value: unknown) => void }) {
  const response = (key: string) => String(form.dynamicResponses?.[key] ?? "");
  return <div className="flex flex-col space-y-6 [&>details:first-of-type]:order-last">
    <p className="text-sm text-muted-foreground">Completa tu información personal y laboral en español.</p>
    <details className="mt-6 rounded-xl border p-4"><summary className="cursor-pointer font-medium">Añadir información opcional</summary><div className="mt-5 space-y-5"><fieldset className="space-y-3"><legend className="text-sm font-medium">Nivel educativo más alto completado</legend><div className="grid gap-3 sm:grid-cols-2"><label className="flex items-center gap-2 text-sm"><input type="radio" name="educationLevel" checked={form.dynamicResponses?.educationLevel === "PRIMARIA"} onChange={() => onChange("educationLevel", "PRIMARIA")} />Primaria (grados 1 a 8)</label><label className="flex items-center gap-2 text-sm"><input type="radio" name="educationLevel" checked={form.dynamicResponses?.educationLevel === "SECUNDARIA"} onChange={() => onChange("educationLevel", "SECUNDARIA")} />Secundaria (grados 9 a 12)</label><label className="flex items-center gap-2 text-sm"><input type="radio" name="educationLevel" checked={form.dynamicResponses?.educationLevel === "GED"} onChange={() => onChange("educationLevel", "GED")} />GED</label><label className="flex items-center gap-2 text-sm"><input type="radio" name="educationLevel" checked={form.dynamicResponses?.educationLevel === "UNIVERSIDAD"} onChange={() => onChange("educationLevel", "UNIVERSIDAD")} />Universidad</label><label className="flex items-center gap-2 text-sm"><input type="radio" name="educationLevel" checked={form.dynamicResponses?.educationLevel === "OTRO"} onChange={() => onChange("educationLevel", "OTRO")} />Otro</label></div></fieldset><div className="grid gap-4 md:grid-cols-2"><Field label="Nombre de la escuela o institución" value={response("schoolName")} onChange={(value) => onChange("schoolName", value)} /><Field label="Ubicación de la escuela" value={response("schoolLocation")} onChange={(value) => onChange("schoolLocation", value)} /></div></div></details>
    <div className="grid gap-4 md:grid-cols-2"><Field label="Nombre completo" required value={form.fullName} onChange={(value) => onChange("fullName", value)} /><Field label="Apellido" required value={response("lastName")} onChange={(value) => onChange("lastName", value)} /><Field label="Dirección" value={response("address")} onChange={(value) => onChange("address", value)} /><Field label="Apartamento / número" value={response("apartmentNumber")} onChange={(value) => onChange("apartmentNumber", value)} /><Field label="Ciudad" value={form.city || ""} onChange={(value) => onChange("city", value)} /><Field label="Estado" value={response("state")} onChange={(value) => onChange("state", value)} /><Field label="Código postal" value={response("zipCode")} onChange={(value) => onChange("zipCode", value)} /><Field label="Fecha de nacimiento" type="date" value={response("dateOfBirth")} onChange={(value) => onChange("dateOfBirth", value)} /><Field label="Número de Seguro Social" type="password" value={response("socialSecurityNumber")} onChange={(value) => onChange("socialSecurityNumber", value)} /><Field label="Teléfono" type="tel" value={form.phone || ""} onChange={(value) => onChange("phone", value)} /><Field label="Correo electrónico" type="email" required value={form.email} onChange={(value) => onChange("email", value)} /></div>
    <div className="grid gap-4 md:grid-cols-2"><Field label="Contacto de emergencia" value={response("emergencyContactName")} onChange={(value) => onChange("emergencyContactName", value)} /><Field label="Relación con el contacto" value={response("emergencyContactRelationship")} onChange={(value) => onChange("emergencyContactRelationship", value)} /><Field label="Teléfono del contacto" type="tel" value={response("emergencyContactPhone")} onChange={(value) => onChange("emergencyContactPhone", value)} /></div>
    <div className="grid gap-4 md:grid-cols-2"><BinaryField label="¿Tienes 18 años o más?" value={form.dynamicResponses?.is18OrOlder} onChange={(value) => onChange("is18OrOlder", value)} /><BinaryField label="¿Estás autorizado para trabajar en Estados Unidos?" value={form.dynamicResponses?.authorizedToWorkInUS} onChange={(value) => onChange("authorizedToWorkInUS", value)} /><div><BinaryField label="¿Has trabajado antes para esta empresa?" value={form.dynamicResponses?.workedForCompany} onChange={(value) => onChange("workedForCompany", value)} />{form.dynamicResponses?.workedForCompany === true ? <div className="mt-4"><TextAreaField label="Explica si has trabajado para esta empresa" value={response("workedForCompanyExplanation")} onChange={(value) => onChange("workedForCompanyExplanation", value)} /></div> : null}</div><div><BinaryField label="¿Algún familiar trabaja para esta empresa?" value={form.dynamicResponses?.familyWorksForCompany} onChange={(value) => onChange("familyWorksForCompany", value)} />{form.dynamicResponses?.familyWorksForCompany === true ? <div className="mt-4"><TextAreaField label="Explica si un familiar trabaja para esta empresa" value={response("familyWorksForCompanyExplanation")} onChange={(value) => onChange("familyWorksForCompanyExplanation", value)} /></div> : null}</div><div><BinaryField label="¿Has sido condenado por un delito grave?" value={form.dynamicResponses?.felonyConviction} onChange={(value) => onChange("felonyConviction", value)} />{form.dynamicResponses?.felonyConviction === true ? <div className="mt-4"><TextAreaField label="Explica la condena" value={response("felonyConvictionExplanation")} onChange={(value) => onChange("felonyConvictionExplanation", value)} /></div> : null}</div></div>
  </div>;
}

function BinaryField({ label, value, onChange }: { label: string; value: unknown; onChange: (value: boolean) => void }) {
  return <fieldset className="space-y-3 rounded-xl border bg-background p-4"><legend className="px-1 text-sm font-medium">{label}</legend><p className="text-xs text-muted-foreground">Selecciona una respuesta</p><div className="flex gap-3"><label className="flex min-h-10 flex-1 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm"><input type="radio" name={label} checked={value === true} onChange={() => onChange(true)} />Sí</label><label className="flex min-h-10 flex-1 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm"><input type="radio" name={label} checked={value === false} onChange={() => onChange(false)} />No</label></div></fieldset>;
}

function DynamicQuestions({ fields, responses, onChange }: { fields: VacancyApplicationField[]; responses: Record<string, unknown>; onChange: (key: string, value: unknown) => void }) {
  if (!fields.length) return null;
  const required = fields.filter((field) => field.required);
  const optional = fields.filter((field) => !field.required);
  return <div className="space-y-5"><div><h2 className="font-semibold">Preguntas de la vacante</h2><p className="mt-1 text-sm text-muted-foreground">Completa solo las preguntas marcadas como obligatorias.</p></div>{required.map((field) => <ApplicationQuestion key={field.key} field={field} value={responses[field.key]} onChange={onChange} />)}{optional.length ? <details className="rounded-xl border p-4"><summary className="cursor-pointer font-medium">Agregar {optional.length} pregunta(s) opcional(es)</summary><div className="mt-5 space-y-5">{optional.map((field) => <ApplicationQuestion key={field.key} field={field} value={responses[field.key]} onChange={onChange} />)}</div></details> : null}</div>;
}

function EmploymentAndReferenceQuestions({ responses, onChange }: { responses: Record<string, unknown>; onChange: (key: string, value: unknown) => void }) {
  const value = (key: string) => String(responses[key] ?? "");
  return <div className="mt-8 space-y-8">
    <section className="space-y-4 rounded-2xl border bg-muted/20 p-5"><div><h2 className="text-lg font-semibold">1. Elegibilidad</h2><p className="mt-1 text-sm text-muted-foreground">Responde cada pregunta. Si eliges “Sí”, aparecerá inmediatamente el campo para explicar tu respuesta.</p></div><div className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><BinaryField label="¿Tienes 18 años o más?" value={responses.is18OrOlder} onChange={(next) => onChange("is18OrOlder", next)} /><BinaryField label="¿Estás autorizado para trabajar en Estados Unidos?" value={responses.authorizedToWorkInUS} onChange={(next) => onChange("authorizedToWorkInUS", next)} /></div><BinaryField label="¿Has trabajado antes para esta empresa?" value={responses.workedForCompany} onChange={(next) => onChange("workedForCompany", next)} />{responses.workedForCompany === true ? <TextAreaField label="Explica si has trabajado para esta empresa" value={value("workedForCompanyExplanation")} onChange={(next) => onChange("workedForCompanyExplanation", next)} /> : null}<BinaryField label="¿Algún familiar trabaja para esta empresa?" value={responses.familyWorksForCompany} onChange={(next) => onChange("familyWorksForCompany", next)} />{responses.familyWorksForCompany === true ? <TextAreaField label="Explica si un familiar trabaja para esta empresa" value={value("familyWorksForCompanyExplanation")} onChange={(next) => onChange("familyWorksForCompanyExplanation", next)} /> : null}<BinaryField label="¿Has sido condenado por un delito grave?" value={responses.felonyConviction} onChange={(next) => onChange("felonyConviction", next)} />{responses.felonyConviction === true ? <TextAreaField label="Explica la condena" value={value("felonyConvictionExplanation")} onChange={(next) => onChange("felonyConvictionExplanation", next)} /> : null}</div></section>
    <section className="space-y-4 rounded-2xl border p-5"><div><h2 className="text-lg font-semibold">2. Historial laboral</h2><p className="mt-1 text-sm text-muted-foreground">Indica tu empleo más reciente. Si no aplica, puedes dejar estos campos vacíos.</p></div><div className="grid gap-4 md:grid-cols-2"><Field label="Empresa" value={value("previousEmployerCompany")} onChange={(next) => onChange("previousEmployerCompany", next)} /><Field label="Puesto" value={value("previousEmployerPosition")} onChange={(next) => onChange("previousEmployerPosition", next)} /><Field label="Dirección" value={value("previousEmployerAddress")} onChange={(next) => onChange("previousEmployerAddress", next)} /><Field label="Ciudad, estado y código postal" value={value("previousEmployerLocation")} onChange={(next) => onChange("previousEmployerLocation", next)} /><Field label="Fecha de inicio" type="date" value={value("previousEmployerStartDate")} onChange={(next) => onChange("previousEmployerStartDate", next)} /><Field label="Fecha de finalización" type="date" value={value("previousEmployerEndDate")} onChange={(next) => onChange("previousEmployerEndDate", next)} /><Field label="Salario final" type="number" value={value("previousEmployerEndingSalary")} onChange={(next) => onChange("previousEmployerEndingSalary", next)} /><Field label="Nombre del supervisor" value={value("previousEmployerSupervisor")} onChange={(next) => onChange("previousEmployerSupervisor", next)} /><Field label="Teléfono del supervisor" type="tel" value={value("previousEmployerPhone")} onChange={(next) => onChange("previousEmployerPhone", next)} /><Field label="Motivo de salida" value={value("previousEmployerLeavingReason")} onChange={(next) => onChange("previousEmployerLeavingReason", next)} /></div><BinaryField label="¿Podemos contactar a tu supervisor anterior?" value={responses.previousEmployerMayContactSupervisor} onChange={(next) => onChange("previousEmployerMayContactSupervisor", next)} /></section>
    <section className="space-y-4 rounded-2xl border p-5"><div><h2 className="text-lg font-semibold">4. Preferencias laborales</h2><p className="mt-1 text-sm text-muted-foreground">Cuéntanos qué tipo de trabajo buscas.</p></div><div className="grid gap-4 md:grid-cols-2"><Field label="Puesto preferido" value={value("employmentPreference")} onChange={(next) => onChange("employmentPreference", next)} /><Field label="Turno preferido" value={value("shiftPreference")} onChange={(next) => onChange("shiftPreference", next)} /><Field label="Tipo de jornada" value={value("employmentType")} onChange={(next) => onChange("employmentType", next)} /><Field label="Salario deseado por hora" type="number" value={value("desiredHourlyWage")} onChange={(next) => onChange("desiredHourlyWage", next)} /></div></section>
    <section className="space-y-4 rounded-2xl border p-5"><div><h2 className="text-lg font-semibold">5. Referencias</h2><p className="mt-1 text-sm text-muted-foreground">Incluye hasta tres referencias laborales o personales que podamos contactar.</p></div><div className="space-y-5">{[1, 2, 3].map((number) => <div key={number} className="grid gap-4 rounded-xl border bg-muted/10 p-4 md:grid-cols-3"><Field label={`Nombre de la referencia ${number}`} value={value(`reference${number}Name`)} onChange={(next) => onChange(`reference${number}Name`, next)} /><Field label="Relación" value={value(`reference${number}Relationship`)} onChange={(next) => onChange(`reference${number}Relationship`, next)} /><Field label="Teléfono" type="tel" value={value(`reference${number}Phone`)} onChange={(next) => onChange(`reference${number}Phone`, next)} /></div>)}</div></section>
    <label className="flex items-start gap-3 rounded-xl border p-4 text-sm"><input type="checkbox" checked={responses.applicationDeclaration === true} onChange={(event) => onChange("applicationDeclaration", event.target.checked)} className="mt-1 size-4" /><span>Declaro que la información proporcionada es verdadera y autorizo su verificación. Firma: <input aria-label="Nombre para firma" value={value("signatureName")} onChange={(event) => onChange("signatureName", event.target.value)} className="ml-1 border-b bg-transparent px-1 outline-none" /></span></label>
  </div>;
}

function ApplicationQuestion({ field, value, onChange }: { field: VacancyApplicationField; value: unknown; onChange: (key: string, value: unknown) => void }) {
  const id = `question-${field.key}`;
  return <div className="space-y-2"><Label htmlFor={id}>{field.label}{field.required ? " *" : ""}</Label>{field.type === "TEXTAREA" ? <textarea id={id} required={field.required} value={String(value ?? "")} placeholder={field.placeholder} onChange={(event) => onChange(field.key, event.target.value)} className="min-h-28 w-full rounded-xl border bg-background p-3" /> : field.type === "SINGLE_SELECT" ? <select id={id} required={field.required} value={String(value ?? "")} onChange={(event) => onChange(field.key, event.target.value)} className="h-12 w-full rounded-xl border bg-background px-3"><option value="">Selecciona una opción</option>{field.options?.map((option) => <option key={option}>{option}</option>)}</select> : field.type === "MULTI_SELECT" ? <fieldset className="space-y-2"><legend className="sr-only">{field.label}</legend>{field.options?.map((option) => <label key={option} className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={Array.isArray(value) && value.includes(option)} onChange={(event) => { const current = Array.isArray(value) ? value : []; onChange(field.key, event.target.checked ? [...current, option] : current.filter((entry) => entry !== option)); }} />{option}</label>)}</fieldset> : field.type === "BOOLEAN" ? <label className="flex min-h-11 items-center gap-3"><input id={id} type="checkbox" checked={value === true} onChange={(event) => onChange(field.key, event.target.checked)} />Sí</label> : <Input id={id} required={field.required} type={field.type === "URL" ? "url" : field.type === "NUMBER" ? "number" : "text"} value={String(value ?? "")} placeholder={field.placeholder} onChange={(event) => onChange(field.key, field.type === "NUMBER" && event.target.value !== "" ? Number(event.target.value) : event.target.value)} className="h-12 rounded-xl" />}{field.helperText ? <p className="text-sm text-muted-foreground">{field.helperText}</p> : null}</div>;
}

export default function ApplyPage() { return <Suspense fallback={<AsyncState state="loading" />}><ApplyWizard /></Suspense>; }
