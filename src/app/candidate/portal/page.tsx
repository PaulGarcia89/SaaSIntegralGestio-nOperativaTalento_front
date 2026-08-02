"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, FileText, Mail, Send, Signature } from "lucide-react";
import { exchangeCandidateSocialCode, fetchCandidateApplications, fetchCandidatePortalOverview, fetchCandidateResumeAccess, getCandidateSession } from "@/lib/backend";
import { CandidateNav } from "@/components/candidate-nav";
import { CandidateAuthCard } from "@/components/candidate-auth-card";
import { AsyncState } from "@/components/async-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function CandidatePortalContent() {
  const params = useSearchParams();
  const lang = params.get("lang") === "en" ? "en" : "es";
  const [authenticated, setAuthenticated] = useState(() => Boolean(getCandidateSession()));
  const socialCode = params.get("socialCode");
  useEffect(() => {
    if (!socialCode || authenticated) return;
    void exchangeCandidateSocialCode(socialCode).then(() => setAuthenticated(true));
  }, [authenticated, socialCode]);
  const applications = useQuery({ queryKey: ["candidate-applications", authenticated], queryFn: fetchCandidateApplications, enabled: authenticated });
  const overview = useQuery({ queryKey: ["candidate-portal", authenticated], queryFn: fetchCandidatePortalOverview, enabled: authenticated });
  const en = lang === "en";
  return <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 pb-12 pt-2"><CandidateNav />
    {!authenticated ? <CandidateAuthCard lang={lang} returnPath={"/candidate/portal?lang=" + lang} onAuthenticated={() => setAuthenticated(true)} /> : null}
    {applications.isLoading || overview.isLoading ? <AsyncState state="loading" title={en ? "Preparing your candidate center" : "Preparando tu centro del candidato"} /> : null}
    {applications.isError || overview.isError ? <AsyncState state="error" title={en ? "We could not load your portal" : "No pudimos cargar tu portal"} onRetry={() => { void applications.refetch(); void overview.refetch(); }} /> : null}
    {authenticated && applications.data && overview.data ? <>
      <header className="rounded-[2rem] border bg-card p-6 md:p-8"><Badge variant="secondary">{en ? "Private candidate area" : "Área privada del candidato"}</Badge><h1 className="mt-3 text-3xl font-semibold tracking-tight">{en ? "Your recruitment center" : "Tu centro de reclutamiento"}</h1><p className="mt-2 max-w-3xl text-muted-foreground">{en ? "Interviews, offers, messages and documents organized by application." : "Entrevistas, ofertas, comunicaciones y documentos organizados por postulación."}</p><Button asChild className="mt-5"><Link href={"/candidate/profile?lang=" + lang}>{en ? "Manage profile and privacy" : "Gestionar perfil y privacidad"}</Link></Button></header>
      <section aria-labelledby="portal-summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><h2 id="portal-summary" className="sr-only">{en ? "Portal summary" : "Resumen del portal"}</h2><Metric icon={<Send />} label={en ? "Applications" : "Postulaciones"} value={applications.data.length} /><Metric icon={<CalendarDays />} label={en ? "Interviews" : "Entrevistas"} value={applications.data.flatMap((item) => item.interviews ?? []).length} /><Metric icon={<Mail />} label={en ? "Offers" : "Ofertas"} value={overview.data.offers.length} /><Metric icon={<FileText />} label={en ? "Documents" : "Documentos"} value={overview.data.resumes.length + overview.data.signatureDocuments.length} /></section>
      <section aria-labelledby="interviews-title" className="space-y-3"><h2 id="interviews-title" className="text-2xl font-semibold">{en ? "Interviews" : "Entrevistas"}</h2>{applications.data.flatMap((application) => (application.interviews ?? []).map((interview) => <Card key={interview.id}><CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_auto]"><div><p className="font-semibold">{interview.title}</p><p className="mt-1 text-sm text-muted-foreground">{application.vacancy.title} · {new Date(interview.startsAt).toLocaleString(lang, { timeZone: interview.timezone })}</p><p className="text-sm text-muted-foreground">{interview.timezone} · {interview.status}</p></div>{interview.meetingUrl ? <Button asChild><a href={interview.meetingUrl} target="_blank" rel="noreferrer">{en ? "Join meeting" : "Entrar a la reunión"}</a></Button> : null}</CardContent></Card>))}{!applications.data.some((item) => item.interviews?.length) ? <Empty text={en ? "No interviews are currently scheduled." : "No tienes entrevistas programadas actualmente."} /> : null}</section>
      <section aria-labelledby="offers-title" className="space-y-3"><h2 id="offers-title" className="text-2xl font-semibold">{en ? "Offers and messages" : "Ofertas y comunicaciones"}</h2>{overview.data.communications.map((message) => <Card key={message.id}><CardHeader><div className="flex items-start justify-between gap-3"><CardTitle>{message.subject}</CardTitle><Badge variant={message.type === "OFFER" ? "default" : "secondary"}>{message.type}</Badge></div></CardHeader><CardContent><p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">{message.body}</p><time className="mt-3 block text-xs text-muted-foreground">{new Date(message.createdAt).toLocaleString(lang)}</time></CardContent></Card>)}{!overview.data.communications.length ? <Empty text={en ? "No messages yet." : "Aún no tienes comunicaciones."} /> : null}</section>
      <section aria-labelledby="documents-title" className="space-y-3"><h2 id="documents-title" className="text-2xl font-semibold">{en ? "Documents" : "Documentos"}</h2><div className="grid gap-4 lg:grid-cols-2">{overview.data.resumes.map((document) => <Card key={document.id}><CardContent className="flex items-center gap-3 p-5"><FileText className="size-5" /><div className="min-w-0 flex-1"><p className="truncate font-medium">{document.originalName}</p><p className="text-sm text-muted-foreground">CV · v{document.version} · {document.status}</p></div><Button size="sm" variant="secondary" onClick={() => void fetchCandidateResumeAccess(document.id).then(({ url }) => window.open(url, "_blank", "noopener,noreferrer"))}>{en ? "Open" : "Abrir"}</Button></CardContent></Card>)}{overview.data.signatureDocuments.map((document) => <Card key={document.id}><CardContent className="flex items-center gap-3 p-5"><Signature className="size-5" /><div><p className="font-medium">{document.signaturePackage.title}</p><p className="text-sm text-muted-foreground">{document.status}</p></div></CardContent></Card>)}</div>{!overview.data.resumes.length && !overview.data.signatureDocuments.length ? <Empty text={en ? "No documents available." : "No hay documentos disponibles."} /> : null}</section>
    </> : null}
  </main>;
}

export default function CandidatePortalPage() { return <Suspense fallback={<AsyncState state="loading" />}><CandidatePortalContent /></Suspense>; }

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) { return <Card><CardContent className="flex items-center gap-4 p-5"><span className="text-primary">{icon}</span><div><p className="text-2xl font-semibold">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div></CardContent></Card>; }
function Empty({ text }: { text: string }) { return <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">{text}</p>; }
