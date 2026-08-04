"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BrainCircuit, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { InlineFeedback } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchAiCompetencyAssessment, generateAiCompetencyAssessment, signAiCompetencyAssessment } from "@/lib/backend";
import type { AiCompetencyAssessmentDto, AiCompetencyAssessmentItemDto, AiEvidenceSufficiency } from "@/lib/contracts";

export function CompetencyAiAssistant({ applicationId, canManage }: { applicationId: string; canManage: boolean }) {
  const queryClient = useQueryClient();
  const context = useQuery({ queryKey: ["competency-ai-assessment", applicationId], queryFn: () => fetchAiCompetencyAssessment(applicationId) });
  const generate = useMutation({
    mutationFn: () => generateAiCompetencyAssessment(applicationId),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["competency-ai-assessment", applicationId] }); },
  });
  const assessment = context.data?.assessment;

  return <Card level={2}>
    <CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle className="flex items-center gap-2"><BrainCircuit className="size-5" />Asistente de competencias</CardTitle>{assessment ? <Badge variant="secondary">Versión {assessment.version}</Badge> : null}</div></CardHeader>
    <CardContent className="space-y-5">
      <InlineFeedback tone="info" title="Asistencia, no decisión automática">{context.data?.guardrail.message ?? "La IA analiza evidencias y sugiere preguntas. El reclutador conserva la decisión y debe firmar la revisión."}</InlineFeedback>
      {context.isLoading ? <p className="text-sm text-text-secondary">Cargando evaluación asistida…</p> : null}
      {context.isError ? <InlineFeedback tone="danger" title="No fue posible cargar el análisis">Reintenta al actualizar el expediente.</InlineFeedback> : null}
      {context.data ? <div className="rounded-xl bg-surface-section p-4 text-sm"><p className="font-medium">Fuentes disponibles</p><div className="mt-2 flex flex-wrap gap-2"><SourceBadge active={context.data.sourceAvailability.coverLetter} label="Carta" /><SourceBadge active={context.data.sourceAvailability.applicationAnswers} label="Formulario" /><SourceBadge active={context.data.sourceAvailability.interviewEvidence} label="Entrevistas" /><SourceBadge active={context.data.sourceAvailability.externalAssessments} label="Assessments" /></div><p className="mt-2 text-xs text-text-secondary">{context.data.sourceAvailability.resumeNotice}</p></div> : null}
      {!assessment && !context.isLoading ? <div className="space-y-3 text-sm text-text-secondary"><p>Genera una lectura explicable usando las competencias configuradas en la vacante y solo las evidencias internas disponibles.</p>{canManage ? <Button onClick={() => generate.mutate()} disabled={generate.isPending}><Sparkles className="size-4" />{generate.isPending ? "Analizando evidencias…" : "Generar análisis asistido"}</Button> : <p>Tienes acceso de consulta. Un responsable de selección puede generar la evaluación.</p>}</div> : null}
      {generate.isError ? <InlineFeedback tone="danger" title="No fue posible generar el análisis">{generate.error instanceof Error ? generate.error.message : "Verifica que la vacante tenga competencias configuradas."}</InlineFeedback> : null}
      {assessment ? <AssessmentReview key={assessment.id} applicationId={applicationId} assessment={assessment} canManage={canManage} onSigned={async () => { await queryClient.invalidateQueries({ queryKey: ["competency-ai-assessment", applicationId] }); }} onRegenerate={() => generate.mutate()} regenerating={generate.isPending} /> : null}
    </CardContent>
  </Card>;
}

function AssessmentReview({ applicationId, assessment, canManage, onSigned, onRegenerate, regenerating }: { applicationId: string; assessment: AiCompetencyAssessmentDto; canManage: boolean; onSigned: () => Promise<void>; onRegenerate: () => void; regenerating: boolean }) {
  const [reviews, setReviews] = useState(() => Object.fromEntries(assessment.items.map((item) => [item.id, { humanScore: item.humanScore == null ? Number(item.aiScore) : Number(item.humanScore), reviewerNotes: item.reviewerNotes ?? "", confirmed: item.reviewerConfirmed }])));
  const [reviewerNotes, setReviewerNotes] = useState(assessment.reviewerNotes ?? "");
  const [acknowledgement, setAcknowledgement] = useState(false);
  const sign = useMutation({
    mutationFn: () => signAiCompetencyAssessment(applicationId, assessment.id, { items: assessment.items.map((item) => ({ itemId: item.id, humanScore: reviews[item.id].humanScore, reviewerNotes: reviews[item.id].reviewerNotes.trim() || undefined, confirmed: reviews[item.id].confirmed })), reviewerNotes: reviewerNotes.trim() || undefined, acknowledgement }),
    onSuccess: onSigned,
  });
  const signed = assessment.status === "SIGNED";
  const allConfirmed = assessment.items.every((item) => reviews[item.id]?.confirmed);

  return <div className="space-y-5">
    <div><p className="text-sm">{assessment.summary}</p><p className="mt-1 text-xs text-text-secondary">Generado por {fullName(assessment.generatedBy)} · {new Date(assessment.generatedAt).toLocaleString("es")}</p></div>
    <ol className="space-y-4">{assessment.items.map((item) => <CompetencyItem key={item.id} item={item} signed={signed || !canManage} review={reviews[item.id]} onChange={(next) => setReviews((current) => ({ ...current, [item.id]: next }))} />)}</ol>
    {signed ? <InlineFeedback tone="success" title="Revisión humana firmada"><span className="flex items-center gap-2"><ShieldCheck className="size-4" />Firmada por {assessment.signedBy ? fullName(assessment.signedBy) : "responsable"} el {assessment.signedAt ? new Date(assessment.signedAt).toLocaleString("es") : "-"}. Esta versión es inmutable.</span>{assessment.reviewerNotes ? <p className="mt-2">{assessment.reviewerNotes}</p> : null}</InlineFeedback> : canManage ? <div className="space-y-4 rounded-xl border border-border-default p-4"><label className="block space-y-2 text-sm font-medium">Conclusión del reclutador<textarea value={reviewerNotes} maxLength={4000} rows={3} onChange={(event) => setReviewerNotes(event.target.value)} className="w-full rounded-xl border border-border-default bg-surface-elevated p-3 font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus" placeholder="Resume tu validación humana, discrepancias y evidencia adicional." /></label><label className="flex items-start gap-3 text-sm"><input className="mt-1 size-4" type="checkbox" checked={acknowledgement} onChange={(event) => setAcknowledgement(event.target.checked)} /><span>Confirmo que revisé la evidencia y que esta firma no rechaza, aprueba ni cambia de etapa automáticamente al candidato.</span></label><Button onClick={() => sign.mutate()} disabled={sign.isPending || !allConfirmed || !acknowledgement}><CheckCircle2 className="size-4" />{sign.isPending ? "Firmando revisión…" : "Firmar revisión humana"}</Button>{!allConfirmed ? <p className="text-xs text-text-secondary">Confirma cada competencia antes de firmar.</p> : null}{sign.isError ? <InlineFeedback tone="danger" title="No fue posible firmar">{sign.error instanceof Error ? sign.error.message : "Revisa las confirmaciones e intenta nuevamente."}</InlineFeedback> : null}</div> : null}
    {signed && canManage ? <Button variant="secondary" onClick={onRegenerate} disabled={regenerating}><Sparkles className="size-4" />{regenerating ? "Generando nueva versión…" : "Generar nueva versión"}</Button> : null}
  </div>;
}

function CompetencyItem({ item, review, signed, onChange }: { item: AiCompetencyAssessmentItemDto; review: { humanScore: number; reviewerNotes: string; confirmed: boolean }; signed: boolean; onChange: (value: { humanScore: number; reviewerNotes: string; confirmed: boolean }) => void }) {
  return <li className="rounded-xl border border-border-default p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{item.competencyName}</p><p className="text-xs text-text-secondary">{item.competencyCode}{item.weight ? ` · Peso ${item.weight}%` : ""}</p></div><div className="flex gap-2"><Badge variant="secondary">IA {Number(item.aiScore).toFixed(1)}/5</Badge><SufficiencyBadge value={item.sufficiency} /></div></div><p className="mt-3 text-sm">{item.explanation}</p><p className="mt-1 text-xs text-text-secondary">Confianza: {Math.round(Number(item.confidence) * 100)}%</p>{item.evidence.length ? <div className="mt-4 space-y-2"><p className="text-sm font-medium">Evidencia verificable</p>{item.evidence.map((evidence, index) => <blockquote key={`${evidence.sourceId}-${index}`} className="border-l-2 border-border-strong pl-3 text-sm"><p>“{evidence.quote}”</p><footer className="mt-1 text-xs text-text-secondary">{evidence.sourceLabel}{evidence.relevance ? ` · ${evidence.relevance}` : ""}</footer></blockquote>)}</div> : <p className="mt-3 text-sm text-status-warning">No se encontró evidencia textual verificable.</p>}{item.missingInformation.length ? <div className="mt-4"><p className="text-sm font-medium">Información insuficiente</p><ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-text-secondary">{item.missingInformation.map((value) => <li key={value}>{value}</li>)}</ul></div> : null}{item.suggestedQuestions.length ? <div className="mt-4"><p className="text-sm font-medium">Preguntas sugeridas</p><ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-text-secondary">{item.suggestedQuestions.map((value) => <li key={value}>{value}</li>)}</ol></div> : null}<div className="mt-4 grid gap-3 sm:grid-cols-[120px_1fr]"><label className="space-y-1 text-xs font-medium">Puntuación humana<Input type="number" min={1} max={5} step={0.1} value={review.humanScore} disabled={signed} onChange={(event) => onChange({ ...review, humanScore: Math.min(5, Math.max(1, Number(event.target.value))) })} /></label><label className="space-y-1 text-xs font-medium">Observación<textarea value={review.reviewerNotes} maxLength={2000} rows={2} disabled={signed} onChange={(event) => onChange({ ...review, reviewerNotes: event.target.value })} className="w-full rounded-xl border border-border-default bg-surface-elevated p-2 text-sm font-normal disabled:opacity-60" /></label></div><label className="mt-3 flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="size-4" checked={review.confirmed} disabled={signed} onChange={(event) => onChange({ ...review, confirmed: event.target.checked })} />Revisada por una persona</label></li>;
}

function SourceBadge({ active, label }: { active: boolean; label: string }) { return <Badge variant={active ? "default" : "secondary"}>{active ? "Disponible" : "Sin datos"} · {label}</Badge>; }
function SufficiencyBadge({ value }: { value: AiEvidenceSufficiency }) { return <Badge variant={value === "SUFFICIENT" ? "default" : value === "PARTIAL" ? "secondary" : "destructive"}>{({ SUFFICIENT: "Evidencia suficiente", PARTIAL: "Evidencia parcial", INSUFFICIENT: "Información insuficiente" } as const)[value]}</Badge>; }
function fullName(user: { firstName: string; lastName: string }) { return `${user.firstName} ${user.lastName}`.trim(); }
