"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Send } from "lucide-react";
import { trackProductEvent } from "@/lib/product-analytics";
import { ApiError, authenticateCandidate, deletePublicApplicationDraft, exchangeCandidateSocialCode, fetchCandidateApplicationDraft, fetchCandidateProfile, fetchPublicApplicationDraft, fetchPublicVacancy, getCandidateSession, parseCandidateResume, saveCandidateApplicationDraft, savePublicApplicationDraft, startCandidateSocialLogin, submitCandidateApplication } from "@/lib/backend";
import type { ParsedResumeDto, PublicApplicationInput } from "@/lib/contracts";
import type { VacancyApplicationField } from "@/lib/contracts";
import { getApplicationFields, missingRequiredApplicationFields } from "@/lib/application-form";
import { AsyncState } from "@/components/async-state";
import { CandidateNav } from "@/components/candidate-nav";
import { CandidateAuthCard } from "@/components/candidate-auth-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/ui/file-upload";
import { validateAtsResumeFile } from "@/lib/ats-file-security";
import { useCareerPortal } from "@/components/portal-context";
import { useLocale } from "@/components/locale-provider";

const builtInQuestionKeys = new Set(["is18OrOlder", "authorizedToWorkInUS", "workedForCompany", "familyWorksForCompany", "felonyConviction", "workedForCompanyExplanation", "familyWorksForCompanyExplanation", "felonyConvictionExplanation", "employmentPreference", "shiftPreference", "employmentType", "desiredHourlyWage", "previousEmployerMayContactSupervisor", "previousEmployerCompany", "previousEmployerPosition", "previousEmployerAddress", "previousEmployerLocation", "previousEmployerStartDate", "previousEmployerEndDate", "previousEmployerEndingSalary", "previousEmployerSupervisor", "previousEmployerPhone", "previousEmployerLeavingReason", "reference1Name", "reference1Relationship", "reference1Phone", "reference2Name", "reference2Relationship", "reference2Phone", "reference3Name", "reference3Relationship", "reference3Phone", "applicationDeclaration", "signatureName"]);
const normalizeQuestionLabel = (label: string) => label.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
// ATENCION: estas cadenas NO son texto visible y NO deben traducirse. Son
// claves de comparacion contra el `applicationFormSchema` que envia el
// backend, normalizadas sin acentos y en minusculas. Traducirlas rompe la
// deteccion de preguntas heredadas y el formulario mostraria duplicados.
// Un barrido automatico las tomo por rotulos una vez; de ahi este aviso.
const builtInQuestionLabels = new Set(["si respondiste si, explica si has trabajado para esta empresa", "si respondiste si, explica si un familiar trabaja para esta empresa", "si respondiste si, explica la condena", "preferencia de puesto", "preferencia de turno", "tipo de jornada", "salario deseado por hora"]);
const emptyForm: PublicApplicationInput = { fullName: "", email: "", phone: "", city: "", linkedinUrl: "", portfolioUrl: "", coverLetter: "", dynamicResponses: {} };
type PublicApplicationDraftState = { step: number; form: PublicApplicationInput; flowVersion?: number; pausedAt?: string };
type PublicApplicationProgress = { step: number; form: PublicApplicationInput; flowVersion: 3; pausedAt?: string; resumedAt?: string };
// El formulario ya no tiene pasos, así que cualquier borrador guardado con el
// flujo anterior abre directamente la página completa con sus datos intactos.
// Solo se respeta el 6, que es el acuse de recibo.
const normalizeDraftStep = (draft: PublicApplicationDraftState) => (draft.step === 6 ? 6 : 1);
// No es un componente: recibe la funcion de traduccion de quien la llama.
const candidateAccessError = (cause: unknown, fallback: string, t: (key: string) => string) => {
  if (cause instanceof ApiError && cause.status === 401) return t("apply.wrongPassword");
  if (cause instanceof ApiError && cause.status === 409) return t("apply.accountExists");
  return cause instanceof Error ? cause.message : fallback;
};

function ApplyWizard() {
  const params = useSearchParams();
  const router = useRouter();
  const vacancyId = params.get("vacancyId") ?? "";
  const vacancySlug = params.get("vacancySlug") ?? vacancyId;
  const { portal } = useCareerPortal();
  const { locale, t } = useLocale();
  const socialCode = params.get("socialCode");
  const [authenticated, setAuthenticated] = useState(() => Boolean(getCandidateSession()));
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<PublicApplicationInput>(emptyForm);
  const [consent, setConsent] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [candidatePassword, setCandidatePassword] = useState("");
  const [accountMode, setAccountMode] = useState<"login" | "register">("login");
  const [resumeBlockedByScanner, setResumeBlockedByScanner] = useState(false);
  const [error, setError] = useState("");
  const [parsedResume, setParsedResume] = useState<ParsedResumeDto | null>(null);
  const [formStartedAt] = useState(() => new Date().toISOString());
  const [website, setWebsite] = useState("");
  const [draftLoaded, setDraftLoaded] = useState(false);
  const draftTimer = useRef<number | null>(null);
  const pausing = useRef(false);
  const draftRestored = useRef(false);
  const vacancyQuery = useQuery({ queryKey: ["public-vacancy", portal?.portalId ?? "pending", vacancySlug, locale], queryFn: () => fetchPublicVacancy(vacancySlug, portal?.slug), enabled: Boolean(vacancySlug && portal?.slug), retry: false });
  const savedProfile = useQuery({ queryKey: ["candidate-profile", "apply"], queryFn: fetchCandidateProfile, enabled: authenticated, retry: false });
  const draftQuery = useQuery({ queryKey: ["public-application-draft", vacancyId], queryFn: () => fetchPublicApplicationDraft(vacancyId), enabled: Boolean(vacancyId), retry: false });
  const accountDraft = useQuery({ queryKey: ["candidate-application-draft", vacancyId], queryFn: () => fetchCandidateApplicationDraft(vacancyId), enabled: Boolean(vacancyId && authenticated), retry: false });
  const submitMutation = useMutation({ mutationFn: async () => {
    if (!getCandidateSession()) await authenticateCandidate(form.email, candidatePassword, accountMode);
    return submitCandidateApplication(vacancyId, form, resumeFile, consent, { website, formStartedAt });
  }, onSuccess: async () => { await deletePublicApplicationDraft(vacancyId).catch(() => undefined); trackProductEvent({ name: "flow_completed", flow: "vacancy" }); setStep(6); }, onError: (cause) => {
    if (cause instanceof ApiError && cause.status === 503 && resumeFile) {
      setResumeBlockedByScanner(true);
      setError(t("apply.cvAnalysisDown"));
      return;
    }
    setError(candidateAccessError(cause, t("apply.submitFailed"), t));
  } });
  const parseResume = useMutation({ mutationFn: async () => { if (!resumeFile) throw new Error(t("apply.pickCv")); if (!getCandidateSession()) { await authenticateCandidate(form.email, candidatePassword, accountMode); setAuthenticated(true); } return parseCandidateResume(resumeFile); }, onSuccess: setParsedResume, onError: (cause) => setError(candidateAccessError(cause, t("apply.cvParseFailed"), t)) });
  const social = useMutation({ mutationFn: (provider: "linkedin" | "indeed") => startCandidateSocialLogin(provider, window.location.href), onSuccess: ({ authorizationUrl }) => window.location.assign(authorizationUrl), onError: (cause) => setError(cause instanceof Error ? cause.message : t("apply.socialUnavailable")) });

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
    }).catch((cause) => setError(cause instanceof Error ? cause.message : t("apply.importFailed")));
  }, [socialCode, t]);

  useEffect(() => {
    if (!savedProfile.data) return;
    queueMicrotask(() => setForm((current) => ({
      ...current,
      email: current.email || savedProfile.data.email,
      fullName: current.fullName || savedProfile.data.fullName || "",
      phone: current.phone || savedProfile.data.phone || "",
      city: current.city || savedProfile.data.city || "",
      linkedinUrl: current.linkedinUrl || savedProfile.data.linkedinUrl || "",
      portfolioUrl: current.portfolioUrl || savedProfile.data.portfolioUrl || "",
      dynamicResponses: { ...savedProfile.data.applicationProfile, ...current.dynamicResponses },
    })));
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
  /**
   * Validación de la página completa.
   *
   * Antes había una comprobación por paso, y el usuario descubría los
   * requisitos de a poco. Ahora se comprueba todo junto al enviar y el mensaje
   * dice exactamente qué falta.
   *
   * Las validaciones de Seguro Social y fecha de nacimiento desaparecieron con
   * los campos: ya no se piden en el formulario público.
   */
  const validate = () => {
    if (!form.fullName.trim()) return t("apply.writeName");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return t("apply.checkEmail");
    const missing = missingRequiredApplicationFields(vacancyQuery.data?.applicationFormSchema, form.dynamicResponses);
    if (missing.length) return `Falta responder: ${missing.map((field) => field.label).join(", ")}.`;
    if (!getCandidateSession() && candidatePassword.length < 10) return t("apply.passwordMin");
    if (!consent) return t("apply.checkBox");
    return "";
  };

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
      setError(cause instanceof Error ? cause.message : t("apply.saveFailed"));
    }
  };
  const location = useMemo(() => [vacancyQuery.data?.city, vacancyQuery.data?.country].filter(Boolean).join(", "), [vacancyQuery.data]);

  if (!vacancyId) return <><CandidateNav /><Card className="mx-auto max-w-2xl border-dashed"><CardContent className="space-y-5 py-14 text-center"><h1 className="text-2xl font-semibold">{t("application.selectJob")}</h1><p className="text-muted-foreground">{t("application.associateInfo")}</p><Button asChild><Link href="/jobs">{t("application.exploreJobs")}</Link></Button></CardContent></Card></>;
  if (vacancyQuery.isLoading || draftQuery.isLoading) return <AsyncState state="loading" title={t("application.loading")} />;
  if (vacancyQuery.isError || !vacancyQuery.data) return <AsyncState state="error" description={t("application.verifyError")} onRetry={() => void vacancyQuery.refetch()} />;
  const vacancy = vacancyQuery.data;
  const receipt = submitMutation.data;
  const empresa = vacancy.tenant?.name?.trim() || "la empresa";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-14 pt-2">
      <CandidateNav />
      {step === 0 && !authenticated ? <CandidateAuthCard returnPath={`/apply?${params.toString()}`} portalLabel={portal?.company?.name ? `el portal de ${portal.company.name}` : "este portal"} onAuthenticated={() => { setAuthenticated(true); setError(""); setStep(1); }} /> : <>
      <section className="space-y-4 rounded-[2rem] border bg-card p-6 md:p-8">
        <Badge variant="secondary">{t("application.secure")}</Badge><h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{vacancy.title}</h1><p className="text-muted-foreground">{vacancy.tenant?.name}{location ? ` · ${location}` : ""}</p>
        {draftLoaded ? <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-brand">{t("application.resumeSaved")}</div> : null}
      </section>
      <Card><CardContent className="space-y-8 pt-6">
        {!receipt ? <div className="space-y-4"><p className="leading-7 text-muted-foreground">{vacancy.description || vacancy.summary || t("apply.reviewBeforeContinue")}</p>{vacancy.requirements ? <div><h2 className="font-semibold">{t("apply.requirements")}</h2><p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">{vacancy.requirements}</p></div> : null}</div> : null}
        {!receipt ? <CandidateProfileFields form={form} onChange={(key, value) => { if (["fullName", "email", "phone", "city"].includes(key)) setField(key as keyof PublicApplicationInput, String(value)); else setResponse(key, value); }} /> : null}
        {!receipt ? <><DynamicQuestions fields={getApplicationFields(vacancy.applicationFormSchema).filter((field) => !builtInQuestionKeys.has(field.key) && !builtInQuestionLabels.has(normalizeQuestionLabel(field.label)))} responses={form.dynamicResponses ?? {}} onChange={setResponse} /><EmploymentAndReferenceQuestions responses={form.dynamicResponses ?? {}} onChange={setResponse} /></> : null}
        {!receipt ? <div className="space-y-4"><div><h2 className="font-semibold">{t("apply.resumeOptional")}</h2><p className="mt-1 text-sm text-muted-foreground">{t("apply.resumeOptionalBody")}</p></div><FileUpload accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" maxFiles={1} maxSizeBytes={15 * 1024 * 1024} onFiles={(files) => { setResumeFile(files[0] ?? null); setParsedResume(null); setResumeBlockedByScanner(false); }} />{resumeFile ? <div className="space-y-3 rounded-xl border p-4 text-sm"><div className="flex flex-wrap items-center justify-between gap-3"><span>{resumeFile.name} · {(resumeFile.size / 1024 / 1024).toFixed(2)} MB</span><Button type="button" size="sm" variant="ghost" onClick={() => { setResumeFile(null); setParsedResume(null); setResumeBlockedByScanner(false); }}>{t("apply.remove")}</Button></div>{!getCandidateSession() ? <div className="space-y-3 border-t pt-3"><p className="text-muted-foreground">{t("apply.signInToAutofill")}</p><div className="flex gap-2"><Button type="button" size="sm" variant={accountMode === "login" ? "default" : "secondary"} onClick={() => setAccountMode("login")}>{t("apply.haveAccount")}</Button><Button type="button" size="sm" variant={accountMode === "register" ? "default" : "secondary"} onClick={() => setAccountMode("register")}>{t("apply.createAccount")}</Button></div><Field label={t("apply.portalPassword")} type="password" required value={candidatePassword} onChange={setCandidatePassword} /></div> : null}<Button type="button" variant="secondary" disabled={parseResume.isPending || (!getCandidateSession() && candidatePassword.length < 10)} onClick={() => parseResume.mutate()}>{parseResume.isPending ? t("apply.analyzing") : t("apply.autofillFromCv")}</Button></div> : null}{parsedResume ? <div role="status" className="space-y-3 rounded-xl bg-secondary/40 p-4"><p className="font-medium">{t("apply.detectedData", { confidence: parsedResume.confidence })}</p><dl className="grid gap-2 text-sm md:grid-cols-2"><div><dt className="text-muted-foreground">{t("apply.name")}</dt><dd>{parsedResume.fields.fullName || t("apply.notDetected")}</dd></div><div><dt className="text-muted-foreground">{t("apply.email")}</dt><dd>{parsedResume.fields.email || t("apply.notDetected")}</dd></div><div><dt className="text-muted-foreground">{t("apply.phone")}</dt><dd>{parsedResume.fields.phone || t("apply.notDetected")}</dd></div><div><dt className="text-muted-foreground">LinkedIn</dt><dd className="break-all">{parsedResume.fields.linkedinUrl || t("apply.notDetected")}</dd></div></dl><Button type="button" onClick={applyParsedResume}>{t("apply.fillEmptyOnly")}</Button></div> : null}</div> : null}
        {!receipt ? <div className="space-y-5"><input tabIndex={-1} aria-hidden="true" autoComplete="off" name="website" value={website} onChange={(event) => setWebsite(event.target.value)} className="absolute -left-[10000px] h-px w-px opacity-0" /><dl className="grid gap-3 rounded-xl bg-secondary/40 p-5 text-sm"><div><dt className="text-muted-foreground">{t("apply.name")}</dt><dd className="font-medium">{form.fullName}</dd></div><div><dt className="text-muted-foreground">{t("apply.email")}</dt><dd className="font-medium">{form.email}</dd></div><div><dt className="text-muted-foreground">{t("apply.vacancy")}</dt><dd className="font-medium">{vacancy.title}</dd></div>{resumeFile ? <div><dt className="text-muted-foreground">CV privado</dt><dd className="font-medium">{resumeFile.name}</dd></div> : null}</dl><div className="rounded-xl border bg-muted/20 p-5 text-sm leading-7" aria-labelledby="application-disclaimer-title"><h2 id="application-disclaimer-title" className="font-semibold">{t("apply.whatYouAccept")}</h2><p className="mt-3">{t("apply.readCalmly")}</p><ul className="mt-3 list-disc space-y-3 pl-5"><li><strong>{t("apply.canVerify")}</strong> Autorizas a {empresa} a verificar lo que escribiste aquí, y autorizas a tus empleadores anteriores y a las personas que indiques a darnos información sobre tu trabajo, tu preparación y tu idoneidad para el puesto.</li><li><strong>{t("apply.noOneLiable")}</strong> Liberas a {empresa}, a tus empleadores anteriores y a las personas consultadas de cualquier responsabilidad por habérnosla dado.</li><li><strong>{t("apply.mustBeTrue")}</strong> {t("apply.falseConsequences")}</li><li><strong>{t("apply.notAContract")}</strong> Enviar esta solicitud no garantiza que haya un puesto disponible ni obliga a {empresa} a ofrecerte uno, y el empleo puede terminarse en cualquier momento.</li></ul></div><label className="flex min-h-14 items-start gap-3 rounded-xl border p-4"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 size-5" /><span className="text-base leading-7">He leído lo anterior, confirmo que lo que escribí es cierto y autorizo que {empresa} use mis datos para este proceso.</span></label></div> : null}
        {receipt ? <div className="space-y-5 text-center" role="status"><div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Check /></div><h2 className="text-2xl font-semibold">{t("apply.sent")}</h2><p className="text-muted-foreground">{t("apply.applicationNumber")} <strong className="text-foreground">{receipt.id}</strong></p><p className="text-sm text-muted-foreground">{t("apply.checkStatus")}</p><div className="flex flex-wrap justify-center gap-2"><Button asChild variant="secondary"><Link href={`/application-status?reference=${encodeURIComponent(receipt.id)}`}>{t("apply.goToTracking")}</Link></Button><Button asChild><Link href="/candidate/portal">{t("apply.openPortal")}</Link></Button></div></div> : null}
        {receipt ? <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-left"><p className="font-medium">{t("apply.whatsNext")}</p><p className="mt-1 text-sm text-muted-foreground">Consulta el estado de esta postulación y revisa aquí las próximas entrevistas o mensajes de {vacancy.tenant?.name ?? "la empresa"}.</p></div> : null}
        {error ? <div className="space-y-3" role="alert"><p className="text-sm text-destructive">{error}</p>{resumeBlockedByScanner ? <Button type="button" variant="secondary" onClick={() => { setResumeFile(null); setParsedResume(null); setResumeBlockedByScanner(false); setError(""); }}>{t("apply.removeToContinue")}</Button> : null}</div> : null}
        {!receipt ? <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row-reverse sm:items-center sm:justify-between">
          <Button type="button" className="min-h-14 w-full text-base sm:w-auto" onClick={submit} disabled={!consent || submitMutation.isPending}>
            {submitMutation.isPending ? t("application.sending") : t("apply.submit")}<Send className="size-5" />
          </Button>
          <Button type="button" variant="ghost" className="min-h-14 w-full text-base sm:w-auto" onClick={pause}>{t("apply.saveAndContinueLater")}</Button>
        </div> : null}
      </CardContent></Card>
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

/**
 * Datos de la persona.
 *
 * Se retiraron del formulario público: Seguro Social, fecha de nacimiento,
 * dirección con apartamento, estado, código postal y contacto de emergencia.
 *
 * No se pierde nada. El backend ya descartaba el Seguro Social al postular
 * (`applications.service.ts:241`), el expediente del empleado lo recoge por su
 * propia vía (`employees.service.ts:135`), y el resto se pide en la etapa de
 * Documentos de la contratación, que ya existe y ya funciona. Pedirlos antes de
 * una oferta alarga el formulario y amplía la superficie de datos sensibles de
 * personas que quizá nunca sean contratadas.
 */
function CandidateProfileFields({ form, onChange }: { form: PublicApplicationInput; onChange: (key: string, value: unknown) => void }) {
  const { t } = useLocale();
  const response = (key: string) => String(form.dynamicResponses?.[key] ?? "");
  return <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-2">
      <Field label={t("apply.name")} required value={form.fullName} onChange={(value) => onChange("fullName", value)} />
      <Field label="Apellido" required value={response("lastName")} onChange={(value) => onChange("lastName", value)} />
      <Field label={t("apply.emailField")} type="email" required value={form.email} onChange={(value) => onChange("email", value)} />
      <Field label={t("apply.phone")} type="tel" value={form.phone || ""} onChange={(value) => onChange("phone", value)} />
      <Field label={t("apply.cityField")} value={form.city || ""} onChange={(value) => onChange("city", value)} />
    </div>

    <fieldset className="space-y-4">
      <legend className="text-base font-semibold">{t("apply.fiveQuickQuestions")}</legend>
      <div className="grid gap-4 md:grid-cols-2">
        <BinaryField label={t("apply.is18")} value={form.dynamicResponses?.is18OrOlder} onChange={(value) => onChange("is18OrOlder", value)} />
        <BinaryField label={t("apply.canWorkUs")} value={form.dynamicResponses?.authorizedToWorkInUS} onChange={(value) => onChange("authorizedToWorkInUS", value)} />
        <div><BinaryField label={t("apply.workedHereBefore")} value={form.dynamicResponses?.workedForCompany} onChange={(value) => onChange("workedForCompany", value)} />{form.dynamicResponses?.workedForCompany === true ? <div className="mt-4"><TextAreaField label={t("apply.whenAndRole")} value={response("workedForCompanyExplanation")} onChange={(value) => onChange("workedForCompanyExplanation", value)} /></div> : null}</div>
        <div><BinaryField label={t("apply.familyWorksHere")} value={form.dynamicResponses?.familyWorksForCompany} onChange={(value) => onChange("familyWorksForCompany", value)} />{form.dynamicResponses?.familyWorksForCompany === true ? <div className="mt-4"><TextAreaField label={t("apply.whoAndRole")} value={response("familyWorksForCompanyExplanation")} onChange={(value) => onChange("familyWorksForCompanyExplanation", value)} /></div> : null}</div>
        <div><BinaryField label={t("apply.felony")} value={form.dynamicResponses?.felonyConviction} onChange={(value) => onChange("felonyConviction", value)} />{form.dynamicResponses?.felonyConviction === true ? <div className="mt-4"><TextAreaField label={t("apply.whatHappened")} value={response("felonyConvictionExplanation")} onChange={(value) => onChange("felonyConvictionExplanation", value)} /></div> : null}</div>
      </div>
    </fieldset>
  </div>;
}

function BinaryField({ label, value, onChange }: { label: string; value: unknown; onChange: (value: boolean) => void }) {
  const { t } = useLocale();
  return <fieldset className="space-y-3 rounded-xl border bg-background p-4"><legend className="px-1 text-sm font-medium">{label}</legend><p className="text-xs text-muted-foreground">{t("apply.pickAnswer")}</p><div className="flex gap-3"><label className="flex min-h-10 flex-1 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm"><input type="radio" name={label} checked={value === true} onChange={() => onChange(true)} />{t("apply.yes")}</label><label className="flex min-h-10 flex-1 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm"><input type="radio" name={label} checked={value === false} onChange={() => onChange(false)} />{t("apply.no")}</label></div></fieldset>;
}

function DynamicQuestions({ fields, responses, onChange }: { fields: VacancyApplicationField[]; responses: Record<string, unknown>; onChange: (key: string, value: unknown) => void }) {
  const { t } = useLocale();
  if (!fields.length) return null;
  const required = fields.filter((field) => field.required);
  const optional = fields.filter((field) => !field.required);
  return <div className="space-y-5"><div><h2 className="font-semibold">{t("apply.vacancyQuestions")}</h2><p className="mt-1 text-sm text-muted-foreground">{t("apply.onlyRequired")}</p></div>{required.map((field) => <ApplicationQuestion key={field.key} field={field} value={responses[field.key]} onChange={onChange} />)}{optional.length ? <details className="rounded-xl border p-4"><summary className="cursor-pointer font-medium">Agregar {optional.length} pregunta(s) opcional(es)</summary><div className="mt-5 space-y-5">{optional.map((field) => <ApplicationQuestion key={field.key} field={field} value={responses[field.key]} onChange={onChange} />)}</div></details> : null}</div>;
}

/**
 * Experiencia, preferencias y referencias.
 *
 * Son veinticuatro campos y ninguno es obligatorio: no los valida el frontend
 * ni el backend. Antes se mostraban siempre, así que todo el mundo veía un muro
 * de veinticuatro casillas para postularse a un puesto de cajero.
 *
 * Ahora nacen plegados. Quien quiera detallar su experiencia puede hacerlo, y
 * el backend los guarda en `ApplicantProfile.reusableData` para que no tenga
 * que volver a escribirlos en su próxima postulación.
 */
function EmploymentAndReferenceQuestions({ responses, onChange }: { responses: Record<string, unknown>; onChange: (key: string, value: unknown) => void }) {
  const { t } = useLocale();
  const value = (key: string) => String(responses[key] ?? "");
  return <details className="rounded-2xl border p-5">
    <summary className="min-h-12 cursor-pointer list-none text-base font-semibold">
      Añadir tu experiencia y referencias
      <span className="mt-1 block text-sm font-normal text-muted-foreground">{t("apply.optionalReuse")}</span>
    </summary>
    <div className="mt-6 space-y-8">
    <section className="space-y-4 rounded-2xl border p-5"><div><h2 className="text-lg font-semibold">{t("apply.lastJob")}</h2><p className="mt-1 text-sm text-muted-foreground">{t("apply.lastJobHint")}</p></div><div className="grid gap-4 md:grid-cols-2"><Field label={t("apply.company")} value={value("previousEmployerCompany")} onChange={(next) => onChange("previousEmployerCompany", next)} /><Field label={t("apply.role")} value={value("previousEmployerPosition")} onChange={(next) => onChange("previousEmployerPosition", next)} /><Field label={t("apply.address")} value={value("previousEmployerAddress")} onChange={(next) => onChange("previousEmployerAddress", next)} /><Field label={t("apply.cityStateZip")} value={value("previousEmployerLocation")} onChange={(next) => onChange("previousEmployerLocation", next)} /><Field label={t("apply.startDate")} type="date" value={value("previousEmployerStartDate")} onChange={(next) => onChange("previousEmployerStartDate", next)} /><Field label={t("apply.endDate")} type="date" value={value("previousEmployerEndDate")} onChange={(next) => onChange("previousEmployerEndDate", next)} /><Field label={t("apply.finalSalary")} type="number" value={value("previousEmployerEndingSalary")} onChange={(next) => onChange("previousEmployerEndingSalary", next)} /><Field label={t("apply.supervisorName")} value={value("previousEmployerSupervisor")} onChange={(next) => onChange("previousEmployerSupervisor", next)} /><Field label={t("apply.supervisorPhone")} type="tel" value={value("previousEmployerPhone")} onChange={(next) => onChange("previousEmployerPhone", next)} /><Field label={t("apply.reasonLeaving")} value={value("previousEmployerLeavingReason")} onChange={(next) => onChange("previousEmployerLeavingReason", next)} /></div><BinaryField label={t("apply.canContactSupervisor")} value={responses.previousEmployerMayContactSupervisor} onChange={(next) => onChange("previousEmployerMayContactSupervisor", next)} /></section>
    <section className="space-y-4 rounded-2xl border p-5"><div><h2 className="text-lg font-semibold">{t("apply.whatYouSeek")}</h2><p className="mt-1 text-sm text-muted-foreground">{t("apply.whatYouSeekHint")}</p></div><div className="grid gap-4 md:grid-cols-2"><Field label={t("apply.preferredRole")} value={value("employmentPreference")} onChange={(next) => onChange("employmentPreference", next)} /><Field label="Turno preferido" value={value("shiftPreference")} onChange={(next) => onChange("shiftPreference", next)} /><Field label={t("apply.scheduleType")} value={value("employmentType")} onChange={(next) => onChange("employmentType", next)} /><Field label={t("apply.desiredHourly")} type="number" value={value("desiredHourlyWage")} onChange={(next) => onChange("desiredHourlyWage", next)} /></div></section>
    <section className="space-y-4 rounded-2xl border p-5"><div><h2 className="text-lg font-semibold">{t("apply.references")}</h2><p className="mt-1 text-sm text-muted-foreground">{t("apply.referencesHint")}</p></div><div className="space-y-5">{[1, 2, 3].map((number) => <div key={number} className="grid gap-4 rounded-xl border bg-muted/10 p-4 md:grid-cols-3"><Field label={`Nombre de la referencia ${number}`} value={value(`reference${number}Name`)} onChange={(next) => onChange(`reference${number}Name`, next)} /><Field label={t("apply.relationship")} value={value(`reference${number}Relationship`)} onChange={(next) => onChange(`reference${number}Relationship`, next)} /><Field label={t("apply.phone")} type="tel" value={value(`reference${number}Phone`)} onChange={(next) => onChange(`reference${number}Phone`, next)} /></div>)}</div></section>
    </div>
  </details>;
}

function ApplicationQuestion({ field, value, onChange }: { field: VacancyApplicationField; value: unknown; onChange: (key: string, value: unknown) => void }) {
  const { t } = useLocale();
  const id = `question-${field.key}`;
  return <div className="space-y-2"><Label htmlFor={id}>{field.label}{field.required ? " *" : ""}</Label>{field.type === "TEXTAREA" ? <textarea id={id} required={field.required} value={String(value ?? "")} placeholder={field.placeholder} onChange={(event) => onChange(field.key, event.target.value)} className="min-h-28 w-full rounded-xl border bg-background p-3" /> : field.type === "SINGLE_SELECT" ? <select id={id} required={field.required} value={String(value ?? "")} onChange={(event) => onChange(field.key, event.target.value)} className="h-12 w-full rounded-xl border bg-background px-3"><option value="">{t("apply.pickOption")}</option>{field.options?.map((option) => <option key={option}>{option}</option>)}</select> : field.type === "MULTI_SELECT" ? <fieldset className="space-y-2"><legend className="sr-only">{field.label}</legend>{field.options?.map((option) => <label key={option} className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={Array.isArray(value) && value.includes(option)} onChange={(event) => { const current = Array.isArray(value) ? value : []; onChange(field.key, event.target.checked ? [...current, option] : current.filter((entry) => entry !== option)); }} />{option}</label>)}</fieldset> : field.type === "BOOLEAN" ? <label className="flex min-h-11 items-center gap-3"><input id={id} type="checkbox" checked={value === true} onChange={(event) => onChange(field.key, event.target.checked)} />{t("apply.yes")}</label> : <Input id={id} required={field.required} type={field.type === "URL" ? "url" : field.type === "NUMBER" ? "number" : "text"} value={String(value ?? "")} placeholder={field.placeholder} onChange={(event) => onChange(field.key, field.type === "NUMBER" && event.target.value !== "" ? Number(event.target.value) : event.target.value)} className="h-12 rounded-xl" />}{field.helperText ? <p className="text-sm text-muted-foreground">{field.helperText}</p> : null}</div>;
}

export default function ApplyPage() { return <Suspense fallback={<AsyncState state="loading" />}><ApplyWizard /></Suspense>; }
