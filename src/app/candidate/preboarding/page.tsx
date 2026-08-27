"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileUp, PenLine } from "lucide-react";
import { CandidateAuthCard } from "@/components/candidate-auth-card";
import { CandidateNav } from "@/components/candidate-nav";
import { AsyncState } from "@/components/async-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { completeCandidatePreboardingTask, fetchCandidatePreboarding, getCandidateSession, uploadCandidatePreboardingDocument } from "@/lib/backend";
import { useLocale } from "@/components/locale-provider";

const copy = {
  es: { loading: "Preparando tu incorporación", unavailable: "No hay una incorporación disponible", support: "Inicia sesión con la misma cuenta usada durante tu postulación o contacta a tu equipo de selección.", greeting: "Hola", newHire: "Tu nueva incorporación", completed: "completado", tasks: "Tus tareas", due: "Fecha límite", complete: "Completar", upload: "Cargar documento", file: "Seleccionar documento", association: "Asociar documento a tarea", general: "Documento general", uploading: "Cargando...", uploadAction: "Cargar documento", security: "PDF, JPG o PNG, máximo 15 MB. El archivo queda privado y pasa por escaneo antes de revisión.", signatures: "Firmas", viewSignature: "Ver firma", noSignatures: "No hay firmas pendientes." },
  en: { loading: "Preparing your onboarding", unavailable: "No onboarding is available", support: "Sign in with the account used during your application or contact your recruiting team.", greeting: "Hello", newHire: "Your new onboarding", completed: "completed", tasks: "Your tasks", due: "Due date", complete: "Complete", upload: "Upload document", file: "Select document", association: "Link document to a task", general: "General document", uploading: "Uploading...", uploadAction: "Upload document", security: "PDF, JPG or PNG, up to 15 MB. The file remains private and is scanned before review.", signatures: "Signatures", viewSignature: "View signature", noSignatures: "There are no pending signatures." },
} as const;

export default function CandidatePreboardingPage() {
  return <Suspense fallback={<main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6"><AsyncState state="loading" title={copy.es.loading} /></main>}><CandidatePreboardingContent /></Suspense>;
}

function CandidatePreboardingContent() {
  const { locale } = useLocale();
  const lang = locale;
  const t = copy[lang];
  const [authenticated, setAuthenticated] = useState(() => Boolean(getCandidateSession()));
  const [file, setFile] = useState<File | null>(null);
  const [taskId, setTaskId] = useState("");
  const queryClient = useQueryClient();
  const preboarding = useQuery({ queryKey: ["candidate-preboarding", authenticated, locale], queryFn: fetchCandidatePreboarding, enabled: authenticated, retry: false });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["candidate-preboarding"] });
  const complete = useMutation({ mutationFn: completeCandidatePreboardingTask, onSuccess: refresh });
  const upload = useMutation({ mutationFn: () => { if (!file) throw new Error("Selecciona un archivo"); return uploadCandidatePreboardingDocument({ file, taskId: taskId || undefined }); }, onSuccess: () => { setFile(null); void refresh(); } });

  return <main lang={lang} className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pb-10 pt-3 sm:px-6">
    <CandidateNav />
    {!authenticated ? <CandidateAuthCard lang={lang} returnPath={`/candidate/preboarding?lang=${lang}`} onAuthenticated={() => setAuthenticated(true)} /> : null}
    {preboarding.isLoading ? <AsyncState state="loading" title={t.loading} /> : null}
    {preboarding.isError ? <AsyncState state="error" title={t.unavailable} description={t.support} onRetry={() => void preboarding.refetch()} /> : null}
    {preboarding.data ? <>
      <header className="rounded-3xl bg-slate-950 p-6 text-white"><p className="text-sm text-cyan-200">Preboarding</p><h1 className="mt-2 text-3xl font-semibold">{t.greeting}, {preboarding.data.employee.name}</h1><p className="mt-2 text-slate-300">{preboarding.data.employee.jobTitle || t.newHire} · {preboarding.data.progressPercent}% {t.completed}</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-cyan-300" style={{ width: `${preboarding.data.progressPercent}%` }} /></div></header>
      <section className="space-y-3"><h2 className="text-xl font-semibold">{t.tasks}</h2>{preboarding.data.tasks.map((task) => <Card key={task.id}><CardContent className="flex gap-3 p-4"><CheckCircle2 className={`mt-0.5 size-5 ${task.status === "COMPLETED" ? "text-emerald-600" : "text-muted-foreground"}`} /><div className="min-w-0 flex-1"><p className="font-medium">{task.title}</p><p className="mt-1 text-sm text-muted-foreground">{task.description}</p>{task.dueDate ? <p className="mt-1 text-xs text-muted-foreground">{t.due}: {new Date(task.dueDate).toLocaleDateString(lang)}</p> : null}</div>{["EMPLOYEE", "CANDIDATE"].includes(task.ownerType) && task.status !== "COMPLETED" ? <Button size="sm" onClick={() => complete.mutate(task.id)} disabled={complete.isPending}>{t.complete}</Button> : <Badge variant="secondary">{task.status}</Badge>}</CardContent></Card>)}</section>
      <section className="space-y-3"><h2 className="text-xl font-semibold">{t.upload}</h2><Card><CardContent className="space-y-3 p-4"><label className="block text-sm font-medium">{t.file}<input aria-label={t.file} className="mt-1 block w-full" type="file" accept="application/pdf,image/jpeg,image/png" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label><label className="block text-sm font-medium">{t.association}<select aria-label={t.association} className="mt-1 w-full rounded-lg border bg-background p-2" value={taskId} onChange={(event) => setTaskId(event.target.value)}><option value="">{t.general}</option>{preboarding.data.tasks.filter((task) => ["EMPLOYEE", "CANDIDATE"].includes(task.ownerType)).map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select></label><Button onClick={() => upload.mutate()} disabled={!file || upload.isPending}><FileUp className="size-4" />{upload.isPending ? t.uploading : t.uploadAction}</Button><p className="text-xs text-muted-foreground">{t.security}</p></CardContent></Card></section>
      <section className="space-y-3"><h2 className="text-xl font-semibold">{t.signatures}</h2>{preboarding.data.signatures.map((item) => <Card key={item.id}><CardContent className="flex items-center justify-between gap-3 p-4"><div><p className="font-medium">{item.title}</p><p className="text-sm text-muted-foreground">{item.status}</p></div><Button asChild size="sm" variant="secondary"><Link href="/candidate/portal"><PenLine className="size-4" />{t.viewSignature}</Link></Button></CardContent></Card>)}{!preboarding.data.signatures.length ? <p className="text-sm text-muted-foreground">{t.noSignatures}</p> : null}</section>
    </> : null}
  </main>;
}
