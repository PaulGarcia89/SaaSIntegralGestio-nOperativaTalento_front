"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, ExternalLink, FileText, LogOut, ShieldCheck } from "lucide-react";
import { clearCandidateSession, fetchCandidateApplications, fetchCandidatePortalOverview, getCandidateSession, withdrawCandidateApplication } from "@/lib/backend";
import { CandidateNav } from "@/components/candidate-nav";
import { CandidateAuthCard } from "@/components/candidate-auth-card";
import { AsyncState } from "@/components/async-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function ApplicationStatusContent() {
  const queryClient = useQueryClient();
  const [authenticated, setAuthenticated] = useState(() => Boolean(getCandidateSession()));
  const [withdrawId, setWithdrawId] = useState<string | null>(null);
  const [withdrawReason, setWithdrawReason] = useState("");
  const applications = useQuery({ queryKey: ["candidate-applications", authenticated], queryFn: fetchCandidateApplications, enabled: authenticated, retry: false });
  const overview = useQuery({ queryKey: ["candidate-portal", authenticated], queryFn: fetchCandidatePortalOverview, enabled: authenticated, retry: false });
  const withdraw = useMutation({ mutationFn: () => withdrawCandidateApplication(withdrawId!, withdrawReason), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["candidate-applications"] }); setWithdrawId(null); setWithdrawReason(""); } });
  return <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 pb-10 pt-2"><CandidateNav />
    {!authenticated ? <CandidateAuthCard returnPath="/application-status" onAuthenticated={() => setAuthenticated(true)} /> : <div className="flex justify-end"><Button variant="ghost" onClick={() => { clearCandidateSession(); setAuthenticated(false); }}><LogOut className="size-4" />Cerrar sesión</Button></div>}
    {applications.isLoading ? <AsyncState state="loading" title="Cargando tus postulaciones" /> : null}
    {applications.isError ? <AsyncState state="error" title="No pudimos cargar tus postulaciones" onRetry={() => void applications.refetch()} /> : null}
    {authenticated && applications.data ? <header className="rounded-[2rem] border bg-card p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-medium text-primary">Seguimiento personal</p><h1 className="mt-1 text-3xl font-semibold">Tus postulaciones</h1><p className="mt-2 text-sm text-muted-foreground">Revisa estado, entrevistas, documentos y solicitudes sin depender de correos aislados.</p></div><div className="grid grid-cols-3 gap-2 text-center text-sm"><div className="rounded-xl bg-secondary/50 p-3"><p className="text-xl font-semibold">{applications.data.length}</p><p className="text-muted-foreground">Procesos</p></div><div className="rounded-xl bg-secondary/50 p-3"><p className="text-xl font-semibold">{overview.data?.resumes.length ?? 0}</p><p className="text-muted-foreground">CVs</p></div><div className="rounded-xl bg-secondary/50 p-3"><p className="text-xl font-semibold">{overview.data?.privacyRequests.filter((item) => ["PENDING", "PROCESSING"].includes(item.status)).length ?? 0}</p><p className="text-muted-foreground">Solicitudes</p></div></div></div><div className="mt-4 flex flex-wrap gap-2"><Button asChild variant="secondary"><Link href="/candidate/portal"><FileText className="size-4" />Centro de documentos</Link></Button><Button asChild variant="secondary"><Link href="/candidate/profile"><ShieldCheck className="size-4" />Privacidad y soporte</Link></Button></div></header> : null}
    {applications.isSuccess && !applications.data.length ? <Card className="mx-auto w-full max-w-lg"><CardContent className="space-y-4 py-10 text-center"><h1 className="text-xl font-semibold">Aún no tienes postulaciones</h1><Button asChild><Link href="/jobs">Explorar vacantes</Link></Button></CardContent></Card> : null}
    {applications.data?.length ? <section aria-labelledby="applications-title" className="grid gap-4 lg:grid-cols-2"><h1 id="applications-title" className="sr-only">Mis postulaciones</h1>{applications.data.map((application) => <Card key={application.id}><CardHeader><div className="flex items-start justify-between gap-3"><CardTitle>{application.vacancy.title}</CardTitle><Badge>{application.currentStage?.name ?? application.status}</Badge></div></CardHeader><CardContent className="space-y-5"><p className="text-sm text-muted-foreground">Postulación #{application.id}</p><ol aria-label="Historial de la postulación" className="space-y-3 border-l pl-5">{application.tracking?.timelineEvents?.map((event) => <li key={event.id ?? event.type} className="relative"><span aria-hidden="true" className="absolute -left-[1.65rem] top-1 size-3 rounded-full bg-primary" /><p className="font-medium">{timelineLabel(event.type)}</p><p className="text-sm text-muted-foreground">{event.at ? new Date(event.at).toLocaleString("es") : "Pendiente"}{event.note ? ` · ${event.note}` : ""}</p></li>)}</ol>{application.interviews?.map((interview) => <div key={interview.id} className="rounded-xl border bg-secondary/30 p-4"><div className="flex items-center gap-2 font-medium"><CalendarDays className="size-4" aria-hidden="true" />{interview.title}</div><p className="mt-2 text-sm">{new Date(interview.startsAt).toLocaleString("es", { timeZone: interview.timezone })} · {interview.timezone}</p>{interview.meetingUrl ? <Button asChild size="sm" className="mt-3"><a href={interview.meetingUrl} target="_blank" rel="noreferrer">Abrir reunión<ExternalLink className="size-4" /></a></Button> : null}</div>)}{application.status === "HIRED" ? <div className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="size-5" />Proceso completado</div> : null}{!["HIRED", "WITHDRAWN"].includes(application.status) ? <Button variant="destructive" onClick={() => setWithdrawId(application.id)}>Retirar postulación</Button> : null}</CardContent></Card>)}</section> : null}
    <Dialog open={Boolean(withdrawId)} onOpenChange={(value) => { if (!value) setWithdrawId(null); }}><DialogContent><DialogHeader><DialogTitle>Retirar postulación</DialogTitle><DialogDescription>Esto cancelará entrevistas futuras y dejará constancia en el expediente. No elimina tus datos personales.</DialogDescription></DialogHeader><label className="space-y-2 text-sm font-medium" htmlFor="withdraw-reason">Motivo (opcional)<textarea id="withdraw-reason" className="min-h-28 w-full rounded-xl border bg-background p-3" value={withdrawReason} onChange={(event) => setWithdrawReason(event.target.value)} /></label><Button variant="destructive" onClick={() => withdraw.mutate()} disabled={withdraw.isPending}>{withdraw.isPending ? "Retirando…" : "Confirmar retiro"}</Button></DialogContent></Dialog>
  </main>;
}

export default function ApplicationStatusPage() { return <Suspense fallback={<AsyncState state="loading" />}><ApplicationStatusContent /></Suspense>; }

function timelineLabel(type: string) {
  const labels: Record<string, string> = {
    VACANCY_PUBLISHED: "Vacante publicada", APPLIED: "Postulación enviada", CONTACTED: "Contacto realizado", INTERVIEW_SCHEDULED: "Entrevista programada", INTERVIEW_RESCHEDULED: "Entrevista reprogramada", INTERVIEW_CANCELLED: "Entrevista cancelada", INTERVIEW_COMPLETED: "Entrevista completada", STAGE_CHANGED: "Cambio de etapa", HIRED: "Contratación formalizada", APPLICATION_WITHDRAWN: "Postulación retirada",
  };
  return labels[type] ?? type;
}
