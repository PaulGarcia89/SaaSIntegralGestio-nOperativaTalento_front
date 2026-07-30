"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, ExternalLink } from "lucide-react";
import { authenticateCandidate, fetchCandidateApplications } from "@/lib/backend";
import { CandidateNav } from "@/components/candidate-nav";
import { AsyncState } from "@/components/async-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ApplicationStatusPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const login = useMutation({
    mutationFn: () => authenticateCandidate(email, password),
    onSuccess: () => setAuthenticated(true),
  });
  const applications = useQuery({
    queryKey: ["candidate-applications", authenticated],
    queryFn: fetchCandidateApplications,
    enabled: authenticated,
    retry: false,
  });

  return <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 pb-10 pt-2"><CandidateNav />
    {!authenticated ? <Card className="mx-auto w-full max-w-lg"><CardHeader><CardTitle>Seguimiento seguro de postulaciones</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">Ingresa con la cuenta de candidato usada al enviar tu postulación.</p><div className="space-y-2"><Label htmlFor="candidate-email">Correo</Label><Input id="candidate-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="candidate-password">Contraseña</Label><Input id="candidate-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></div>{login.isError ? <p role="alert" className="text-sm text-destructive">El correo o la contraseña no son correctos.</p> : null}<Button className="w-full" onClick={() => login.mutate()} disabled={!email || password.length < 10 || login.isPending}>{login.isPending ? "Verificando…" : "Ingresar a mis postulaciones"}</Button></CardContent></Card> : null}
    {applications.isLoading ? <AsyncState state="loading" title="Cargando tus postulaciones" /> : null}
    {applications.isError ? <AsyncState state="error" title="No pudimos cargar tus postulaciones" onRetry={() => void applications.refetch()} /> : null}
    {applications.isSuccess && !applications.data.length ? <Card className="mx-auto w-full max-w-lg"><CardContent className="space-y-4 py-10 text-center"><h2 className="text-xl font-semibold">Aún no tienes postulaciones</h2><Button asChild><Link href="/jobs">Explorar vacantes</Link></Button></CardContent></Card> : null}
    {applications.data?.length ? <section className="grid gap-4 lg:grid-cols-2">{applications.data.map((application) => <Card key={application.id}><CardHeader><div className="flex items-start justify-between gap-3"><CardTitle>{application.vacancy.title}</CardTitle><Badge>{application.status}</Badge></div></CardHeader><CardContent className="space-y-5"><p className="text-sm text-muted-foreground">Postulación #{application.id}</p><ol className="space-y-3 border-l pl-5">{application.tracking?.timelineEvents?.map((event) => <li key={event.type} className="relative"><span className="absolute -left-[1.65rem] top-1 size-3 rounded-full bg-primary" /><p className="font-medium">{timelineLabel(event.type)}</p><p className="text-sm text-muted-foreground">{event.at ? new Date(event.at).toLocaleString() : "Pendiente"}{event.note ? ` · ${event.note}` : ""}</p></li>)}</ol>{application.interviews?.map((interview) => <div key={interview.id} className="rounded-xl border bg-secondary/30 p-4"><div className="flex items-center gap-2 font-medium"><CalendarDays className="size-4" />{interview.title}</div><p className="mt-2 text-sm">{new Date(interview.startsAt).toLocaleString([], { timeZone: interview.timezone })} · {interview.timezone}</p><p className="text-sm text-muted-foreground">{interview.interviewer ? `Con ${interview.interviewer.firstName} ${interview.interviewer.lastName}` : "Entrevistador por confirmar"}</p>{interview.meetingUrl ? <Button asChild size="sm" className="mt-3"><a href={interview.meetingUrl} target="_blank" rel="noreferrer">Abrir reunión<ExternalLink className="size-4" /></a></Button> : null}</div>)}{application.status === "HIRED" ? <div className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="size-5" />Proceso completado</div> : null}</CardContent></Card>)}</section> : null}
  </div>;
}

function timelineLabel(type: string) {
  return ({ VACANCY_PUBLISHED: "Vacante publicada", APPLIED: "Postulación enviada", CONTACTED: "Contacto realizado", INTERVIEW_SCHEDULED: "Entrevista programada", INTERVIEW_COMPLETED: "Entrevista completada", HIRED: "Contratación formalizada" } as Record<string, string>)[type] ?? type;
}
