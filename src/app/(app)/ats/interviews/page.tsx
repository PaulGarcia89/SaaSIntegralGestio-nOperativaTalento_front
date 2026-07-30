"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Plus, Star } from "lucide-react";
import { fetchApplications, fetchRecruitmentInterviews, scheduleRecruitmentInterview, submitInterviewScorecard } from "@/lib/backend";
import type { ApplicationInterviewType, InterviewRecommendation, ScheduleInterviewInput } from "@/lib/contracts";
import { useAppStore } from "@/store/app-store";
import { InlineFeedback, PageHeader } from "@/components/design-system";
import { AsyncState } from "@/components/async-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export default function InterviewsPage() {
  const queryClient = useQueryClient();
  const { tenantUsers, can } = useAppStore();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scoreInterviewId, setScoreInterviewId] = useState("");
  const [form, setForm] = useState<ScheduleInterviewInput>({ applicationId: "", interviewerUserId: "", title: "Entrevista", type: "VIRTUAL", timezone: defaultTimezone, startsAt: "", endsAt: "" });
  const [rating, setRating] = useState(3);
  const [recommendation, setRecommendation] = useState<InterviewRecommendation>("YES");
  const [comments, setComments] = useState("");
  const interviews = useQuery({ queryKey: ["recruitment-interviews"], queryFn: () => fetchRecruitmentInterviews() });
  const applications = useQuery({ queryKey: ["applications", "interview-scheduler"], queryFn: () => fetchApplications() });
  const schedule = useMutation({ mutationFn: scheduleRecruitmentInterview, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["recruitment-interviews"] }); setScheduleOpen(false); } });
  const score = useMutation({ mutationFn: () => submitInterviewScorecard(scoreInterviewId, { criteria: { overall: rating }, overallRating: rating, recommendation, comments }), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["recruitment-interviews"] }); setScoreInterviewId(""); } });
  const candidates = applications.data?.data ?? [];
  const sorted = useMemo(() => [...(interviews.data ?? [])].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()), [interviews.data]);

  return <div className="space-y-7"><PageHeader eyebrow="Reclutamiento" title="Entrevistas y decisiones" description="Coordina horarios con zona horaria explícita, concentra scorecards y conserva la decisión de cada entrevistador." actions={can("interviews.schedule") ? <Button onClick={() => setScheduleOpen(true)}><Plus className="size-4" />Programar entrevista</Button> : undefined} />
    {interviews.isLoading ? <AsyncState state="loading" title="Cargando agenda" /> : null}
    {interviews.isError ? <AsyncState state="error" title="No pudimos cargar la agenda" onRetry={() => void interviews.refetch()} /> : null}
    {interviews.isSuccess && !sorted.length ? <InlineFeedback tone="info" title="No hay entrevistas programadas">Programa una entrevista desde una candidatura activa.</InlineFeedback> : null}
    <section className="grid gap-4 xl:grid-cols-2">{sorted.map((interview) => <Card key={interview.id} level={2}><CardHeader><div className="flex items-start justify-between gap-3"><CardTitle>{interview.title}</CardTitle><Badge>{interview.status}</Badge></div></CardHeader><CardContent className="space-y-4"><div className="flex gap-3"><CalendarDays className="mt-1 size-5 text-primary" /><div><p className="font-medium">{new Date(interview.startsAt).toLocaleString([], { timeZone: interview.timezone })}</p><p className="text-sm text-text-secondary">{interview.timezone} · {interview.type}</p></div></div><dl className="grid gap-2 text-sm sm:grid-cols-2"><Summary label="Candidato" value={interview.application?.candidate.fullName} /><Summary label="Vacante" value={interview.application?.vacancy.title} /><Summary label="Entrevistador" value={interview.interviewer ? `${interview.interviewer.firstName} ${interview.interviewer.lastName}` : undefined} /><Summary label="Etapa" value={interview.stage?.name} /></dl>{interview.scorecards?.length ? <div className="rounded-xl bg-secondary/40 p-3 text-sm">{interview.scorecards.map((item) => <p key={item.id}><strong>{item.overallRating}/5</strong> · {item.recommendation} · {item.reviewer?.firstName} {item.reviewer?.lastName}</p>)}</div> : null}{can("scorecards.complete") ? <Button variant="secondary" onClick={() => setScoreInterviewId(interview.id)}><Star className="size-4" />Completar scorecard</Button> : null}</CardContent></Card>)}</section>
    <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}><DialogContent><DialogHeader><DialogTitle>Programar entrevista</DialogTitle><DialogDescription>La hora se guardará en UTC junto con la zona horaria elegida.</DialogDescription></DialogHeader><div className="grid gap-4"><SelectField label="Candidatura" value={form.applicationId} onValueChange={(value) => setForm({ ...form, applicationId: value })} options={candidates.map((item) => ({ value: item.id, label: `${item.candidate.fullName} · ${item.vacancy.title}` }))} /><SelectField label="Entrevistador" value={form.interviewerUserId} onValueChange={(value) => setForm({ ...form, interviewerUserId: value })} options={tenantUsers.map((user) => ({ value: user.id, label: `${user.fullName} · ${user.role}` }))} /><Field label="Título" value={form.title} onChange={(value) => setForm({ ...form, title: value })} /><SelectField label="Tipo" value={form.type} onValueChange={(value) => setForm({ ...form, type: value as ApplicationInterviewType })} options={[{ value: "VIRTUAL", label: "Virtual" }, { value: "PRESENTIAL", label: "Presencial" }, { value: "PHONE", label: "Teléfono" }]} /><Field label="Zona horaria IANA" value={form.timezone} onChange={(value) => setForm({ ...form, timezone: value })} /><Field label="Inicio" type="datetime-local" value={form.startsAt} onChange={(value) => setForm({ ...form, startsAt: new Date(value).toISOString() })} /><Field label="Fin" type="datetime-local" value={form.endsAt} onChange={(value) => setForm({ ...form, endsAt: new Date(value).toISOString() })} /><Field label="Enlace de reunión" type="url" value={form.meetingUrl ?? ""} onChange={(value) => setForm({ ...form, meetingUrl: value })} /><Button onClick={() => schedule.mutate(form)} disabled={!form.applicationId || !form.interviewerUserId || !form.startsAt || !form.endsAt || schedule.isPending}>{schedule.isPending ? "Programando…" : "Confirmar entrevista"}</Button>{schedule.isError ? <p className="text-sm text-destructive">No fue posible programar la entrevista.</p> : null}</div></DialogContent></Dialog>
    <Dialog open={Boolean(scoreInterviewId)} onOpenChange={(open) => !open && setScoreInterviewId("")}><DialogContent><DialogHeader><DialogTitle>Scorecard y recomendación</DialogTitle><DialogDescription>Tu evaluación queda firmada con tu usuario y no reemplaza la decisión humana final.</DialogDescription></DialogHeader><div className="space-y-4"><Label>Calificación general: {rating}/5</Label><input aria-label="Calificación general" type="range" min={1} max={5} value={rating} onChange={(event) => setRating(Number(event.target.value))} className="w-full" /><SelectField label="Recomendación" value={recommendation} onValueChange={(value) => setRecommendation(value as InterviewRecommendation)} options={[{ value: "STRONG_YES", label: "Avanzar con alta confianza" }, { value: "YES", label: "Avanzar" }, { value: "MIXED", label: "Revisar en comité" }, { value: "NO", label: "No avanzar" }]} /><label className="space-y-2 text-sm font-medium">Comentarios<textarea value={comments} onChange={(event) => setComments(event.target.value)} rows={5} className="w-full rounded-xl border bg-background p-3" /></label><Button onClick={() => score.mutate()} disabled={score.isPending}>{score.isPending ? "Guardando…" : "Enviar scorecard"}</Button></div></DialogContent></Dialog>
  </div>;
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { const id = label.toLowerCase().replace(/\W+/g, "-"); return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} type={type} value={type === "datetime-local" && value ? value.slice(0, 16) : value} onChange={(event) => onChange(event.target.value)} /></div>; }
function SelectField({ label, value, onValueChange, options }: { label: string; value: string; onValueChange: (value: string) => void; options: Array<{ value: string; label: string }> }) { return <div className="space-y-2"><Label>{label}</Label><Select value={value} onValueChange={onValueChange}><SelectTrigger><SelectValue placeholder={`Selecciona ${label.toLowerCase()}`} /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>; }
function Summary({ label, value }: { label: string; value?: string | null }) { return <div><dt className="text-text-secondary">{label}</dt><dd className="font-medium">{value || "Sin definir"}</dd></div>; }
