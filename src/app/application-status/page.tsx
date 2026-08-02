"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, ExternalLink, LogOut } from "lucide-react";
import { clearCandidateSession, fetchCandidateApplications, getCandidateSession, withdrawCandidateApplication } from "@/lib/backend";
import { CandidateNav } from "@/components/candidate-nav";
import { CandidateAuthCard } from "@/components/candidate-auth-card";
import { AsyncState } from "@/components/async-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function ApplicationStatusContent() {
  const lang = useSearchParams().get("lang") === "en" ? "en" : "es";
  const en = lang === "en";
  const queryClient = useQueryClient();
  const [authenticated, setAuthenticated] = useState(() => Boolean(getCandidateSession()));
  const [withdrawId, setWithdrawId] = useState<string | null>(null);
  const [withdrawReason, setWithdrawReason] = useState("");
  const applications = useQuery({ queryKey: ["candidate-applications", authenticated], queryFn: fetchCandidateApplications, enabled: authenticated, retry: false });
  const withdraw = useMutation({ mutationFn: () => withdrawCandidateApplication(withdrawId!, withdrawReason), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["candidate-applications"] }); setWithdrawId(null); setWithdrawReason(""); } });
  return <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 pb-10 pt-2"><CandidateNav />
    {!authenticated ? <CandidateAuthCard lang={lang} returnPath={"/application-status?lang=" + lang} onAuthenticated={() => setAuthenticated(true)} /> : <div className="flex justify-end"><Button variant="ghost" onClick={() => { clearCandidateSession(); setAuthenticated(false); }}><LogOut className="size-4" />{en ? "Sign out" : "Cerrar sesión"}</Button></div>}
    {applications.isLoading ? <AsyncState state="loading" title={en ? "Loading your applications" : "Cargando tus postulaciones"} /> : null}
    {applications.isError ? <AsyncState state="error" title={en ? "We could not load your applications" : "No pudimos cargar tus postulaciones"} onRetry={() => void applications.refetch()} /> : null}
    {applications.isSuccess && !applications.data.length ? <Card className="mx-auto w-full max-w-lg"><CardContent className="space-y-4 py-10 text-center"><h1 className="text-xl font-semibold">{en ? "You have no applications yet" : "Aún no tienes postulaciones"}</h1><Button asChild><Link href={"/jobs?lang=" + lang}>{en ? "Explore jobs" : "Explorar vacantes"}</Link></Button></CardContent></Card> : null}
    {applications.data?.length ? <section aria-labelledby="applications-title" className="grid gap-4 lg:grid-cols-2"><h1 id="applications-title" className="sr-only">{en ? "My applications" : "Mis postulaciones"}</h1>{applications.data.map((application) => <Card key={application.id}><CardHeader><div className="flex items-start justify-between gap-3"><CardTitle>{application.vacancy.title}</CardTitle><Badge>{application.currentStage?.name ?? application.status}</Badge></div></CardHeader><CardContent className="space-y-5"><p className="text-sm text-muted-foreground">{en ? "Application" : "Postulación"} #{application.id}</p><ol aria-label={en ? "Application timeline" : "Historial de la postulación"} className="space-y-3 border-l pl-5">{application.tracking?.timelineEvents?.map((event) => <li key={event.id ?? event.type} className="relative"><span aria-hidden="true" className="absolute -left-[1.65rem] top-1 size-3 rounded-full bg-primary" /><p className="font-medium">{timelineLabel(event.type, en)}</p><p className="text-sm text-muted-foreground">{event.at ? new Date(event.at).toLocaleString(lang) : (en ? "Pending" : "Pendiente")}{event.note ? ` · ${event.note}` : ""}</p></li>)}</ol>{application.interviews?.map((interview) => <div key={interview.id} className="rounded-xl border bg-secondary/30 p-4"><div className="flex items-center gap-2 font-medium"><CalendarDays className="size-4" aria-hidden="true" />{interview.title}</div><p className="mt-2 text-sm">{new Date(interview.startsAt).toLocaleString(lang, { timeZone: interview.timezone })} · {interview.timezone}</p>{interview.meetingUrl ? <Button asChild size="sm" className="mt-3"><a href={interview.meetingUrl} target="_blank" rel="noreferrer">{en ? "Open meeting" : "Abrir reunión"}<ExternalLink className="size-4" /></a></Button> : null}</div>)}{application.status === "HIRED" ? <div className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="size-5" />{en ? "Process completed" : "Proceso completado"}</div> : null}{!["HIRED", "WITHDRAWN"].includes(application.status) ? <Button variant="destructive" onClick={() => setWithdrawId(application.id)}>{en ? "Withdraw application" : "Retirar postulación"}</Button> : null}</CardContent></Card>)}</section> : null}
    <Dialog open={Boolean(withdrawId)} onOpenChange={(value) => { if (!value) setWithdrawId(null); }}><DialogContent><DialogHeader><DialogTitle>{en ? "Withdraw application" : "Retirar postulación"}</DialogTitle><DialogDescription>{en ? "This will cancel future interviews and notify the recruitment record. It does not delete your personal data." : "Esto cancelará entrevistas futuras y dejará constancia en el expediente. No elimina tus datos personales."}</DialogDescription></DialogHeader><label className="space-y-2 text-sm font-medium" htmlFor="withdraw-reason">{en ? "Reason (optional)" : "Motivo (opcional)"}<textarea id="withdraw-reason" className="min-h-28 w-full rounded-xl border bg-background p-3" value={withdrawReason} onChange={(event) => setWithdrawReason(event.target.value)} /></label><Button variant="destructive" onClick={() => withdraw.mutate()} disabled={withdraw.isPending}>{withdraw.isPending ? (en ? "Withdrawing…" : "Retirando…") : (en ? "Confirm withdrawal" : "Confirmar retiro")}</Button></DialogContent></Dialog>
  </main>;
}

export default function ApplicationStatusPage() { return <Suspense fallback={<AsyncState state="loading" />}><ApplicationStatusContent /></Suspense>; }

function timelineLabel(type: string, en: boolean) {
  const labels: Record<string, [string, string]> = {
    VACANCY_PUBLISHED: ["Vacante publicada", "Job published"], APPLIED: ["Postulación enviada", "Application submitted"], CONTACTED: ["Contacto realizado", "Contacted"], INTERVIEW_SCHEDULED: ["Entrevista programada", "Interview scheduled"], INTERVIEW_RESCHEDULED: ["Entrevista reprogramada", "Interview rescheduled"], INTERVIEW_CANCELLED: ["Entrevista cancelada", "Interview cancelled"], INTERVIEW_COMPLETED: ["Entrevista completada", "Interview completed"], STAGE_CHANGED: ["Cambio de etapa", "Stage changed"], HIRED: ["Contratación formalizada", "Hired"], APPLICATION_WITHDRAWN: ["Postulación retirada", "Application withdrawn"],
  };
  return labels[type]?.[en ? 1 : 0] ?? type;
}
