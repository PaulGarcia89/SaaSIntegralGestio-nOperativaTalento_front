"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, LockKeyhole, Scale } from "lucide-react";
import { fetchInterviewScorecardContext, submitInterviewScorecard } from "@/lib/backend";
import type {
  InterviewRecommendation,
  ScorecardContextDto,
  ScorecardResponseDto,
  ScorecardTemplateDto,
} from "@/lib/contracts";
import { InlineFeedback } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { technicalLabel } from "@/lib/ui-labels";

export function ScorecardDialog({ interviewId, onClose }: { interviewId: string; onClose: () => void }) {
  const context = useQuery({
    queryKey: ["scorecard-context", interviewId],
    queryFn: () => fetchInterviewScorecardContext(interviewId),
    enabled: Boolean(interviewId),
  });
  return <Dialog open={Boolean(interviewId)} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
      <DialogHeader><DialogTitle>Ficha de evaluación estructurada</DialogTitle><DialogDescription>Evalúa evidencia observable. La puntuación se calcula por peso y la firma bloquea cambios posteriores.</DialogDescription></DialogHeader>
      {context.isLoading ? <p className="py-8 text-center text-sm text-text-secondary">Preparando criterios y evaluación…</p> : null}
      {context.isError ? <InlineFeedback tone="danger" title="No fue posible cargar la ficha de evaluación">{context.error instanceof Error ? context.error.message : "Intenta nuevamente."}</InlineFeedback> : null}
      {context.data ? <ScorecardForm key={`${context.data.template?.id ?? "legacy"}-${context.data.scorecard?.id ?? "new"}`} interviewId={interviewId} context={context.data} onClose={onClose} /> : null}
    </DialogContent>
  </Dialog>;
}

function ScorecardForm({ interviewId, context, onClose }: { interviewId: string; context: ScorecardContextDto; onClose: () => void }) {
  const queryClient = useQueryClient();
  const template = context.template;
  const [responses, setResponses] = useState<Record<string, ScorecardResponseDto>>(
    () => Object.fromEntries((context.scorecard?.responses ?? []).map((item) => [item.criterionId, item])),
  );
  const [legacyRating, setLegacyRating] = useState(context.scorecard?.overallRating ?? 3);
  const [recommendation, setRecommendation] = useState<InterviewRecommendation>(context.scorecard?.recommendation ?? "YES");
  const [strengths, setStrengths] = useState(context.scorecard?.strengths ?? "");
  const [concerns, setConcerns] = useState(context.scorecard?.concerns ?? "");
  const [comments, setComments] = useState(context.scorecard?.comments ?? "");
  const weighted = calculateWeighted(template, responses);
  const submit = useMutation({
    mutationFn: (sign: boolean) => submitInterviewScorecard(interviewId, {
      responses: template ? template.criteria.map((criterion) => ({
        criterionId: criterion.id,
        ...(criterion.type === "RATING" ? { rating: responses[criterion.id]?.rating ?? undefined } : {}),
        ...(criterion.type === "TEXT" ? { textValue: responses[criterion.id]?.textValue ?? undefined } : {}),
        ...(criterion.type === "BOOLEAN" ? { booleanValue: responses[criterion.id]?.booleanValue ?? undefined } : {}),
        evidence: responses[criterion.id]?.evidence || undefined,
      })) : undefined,
      criteria: template ? undefined : { overall: legacyRating },
      overallRating: template ? undefined : legacyRating,
      recommendation,
      strengths: strengths || undefined,
      concerns: concerns || undefined,
      comments: comments || undefined,
      sign,
    }),
    onSuccess: async (_, sign) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["recruitment-interviews"] }),
        queryClient.invalidateQueries({ queryKey: ["scorecard-context", interviewId] }),
      ]);
      if (sign) onClose();
    },
  });
  const locked = context.scorecard?.status === "SIGNED" || !context.canEdit;

  function update(criterionId: string, patch: Partial<ScorecardResponseDto>) {
    setResponses((current) => ({
      ...current,
      [criterionId]: { ...current[criterionId], ...patch, criterionId },
    }));
  }

  if (locked) {
    return <div className="space-y-5">
      <InlineFeedback tone="success" title="Evaluación firmada e inmutable">Firmada el {context.scorecard?.signedAt ? new Date(context.scorecard.signedAt).toLocaleString() : "día de envío"}. Crea una nueva entrevista si se requiere otra evaluación.</InlineFeedback>
      <ScoreSummary context={context} />
      <Comparison context={context} />
      <Button className="w-full" variant="secondary" onClick={onClose}>Cerrar</Button>
    </div>;
  }

  return <div className="space-y-6">
    {template ? <><div className="rounded-2xl bg-primary/5 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{template.name} <span className="text-text-secondary">v{template.version}</span></p><p className="mt-1 text-sm text-text-secondary">{template.instructions || "Registra una calificación basada en evidencia para cada criterio."}</p></div><Badge variant="secondary">{template.stage?.name ?? "Vacante completa"}</Badge></div></div>
      <div className="space-y-4">{template.criteria.map((criterion, index) => {
        const response = responses[criterion.id];
        return <section key={criterion.id} className="rounded-2xl border border-border-default p-4">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{index + 1}. {criterion.label}{criterion.isRequired ? <span className="text-status-danger"> *</span> : null}</p>{criterion.competencyName ? <p className="mt-1 text-xs font-medium uppercase tracking-wide text-primary">Competencia: {criterion.competencyName}</p> : null}{criterion.description ? <p className="mt-2 text-sm text-text-secondary">{criterion.description}</p> : null}</div>{criterion.type === "RATING" ? <Badge variant="secondary">Peso {criterion.weight}%</Badge> : <Badge variant="secondary">{criterion.type === "TEXT" ? "Pregunta" : "Verificación"}</Badge>}</div>
          <div className="mt-4">{criterion.type === "RATING" ? <div className="grid grid-cols-5 gap-2">{[1, 2, 3, 4, 5].map((rating) => <Button key={rating} type="button" variant={response?.rating === rating ? "default" : "secondary"} onClick={() => update(criterion.id, { rating })}>{rating}</Button>)}</div> : null}{criterion.type === "TEXT" ? <textarea aria-label={criterion.label} rows={4} value={response?.textValue ?? ""} onChange={(event) => update(criterion.id, { textValue: event.target.value })} className="w-full rounded-xl border border-border-default bg-background p-3" /> : null}{criterion.type === "BOOLEAN" ? <Select value={response?.booleanValue == null ? "unset" : String(response.booleanValue)} onValueChange={(value) => update(criterion.id, { booleanValue: value === "unset" ? undefined : value === "true" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unset">Selecciona una respuesta</SelectItem><SelectItem value="true">Sí</SelectItem><SelectItem value="false">No</SelectItem></SelectContent></Select> : null}</div>
          {criterion.type === "RATING" && criterion.ratingAnchors ? <div className="mt-2 flex justify-between gap-4 text-xs text-text-secondary"><span>1: {criterion.ratingAnchors["1"]}</span><span className="text-right">5: {criterion.ratingAnchors["5"]}</span></div> : null}
          {criterion.requiresEvidence ? <label className="mt-4 block space-y-2 text-sm font-medium">Evidencia observable <span className="text-status-danger">*</span><textarea rows={3} value={response?.evidence ?? ""} onChange={(event) => update(criterion.id, { evidence: event.target.value })} className="w-full rounded-xl border border-border-default bg-background p-3" placeholder="Describe hechos, ejemplos o respuestas concretas." /></label> : null}
        </section>;
      })}</div>
      <div className="flex items-center justify-between rounded-xl bg-surface-section p-4"><div className="flex items-center gap-2"><Scale className="size-5 text-primary" /><span className="font-semibold">Puntuación ponderada</span></div><span className="text-2xl font-bold">{weighted.toFixed(1)}<small className="text-sm font-normal text-text-secondary">/100</small></span></div>
    </> : <InlineFeedback tone="warning" title="Plantilla no configurada">Esta entrevista usa la ficha de evaluación general heredada. <Link className="font-semibold underline" href="/ats/scorecards">Configura criterios por vacante y etapa</Link> para habilitar pesos y competencias.<div className="mt-4"><Label>Calificación general: {legacyRating}/5</Label><input aria-label="Calificación general" className="mt-2 w-full" type="range" min={1} max={5} value={legacyRating} onChange={(event) => setLegacyRating(Number(event.target.value))} /></div></InlineFeedback>}
    <SelectField label="Recomendación" value={recommendation} onChange={(value) => setRecommendation(value as InterviewRecommendation)} options={[{ value: "STRONG_YES", label: "Avanzar con alta confianza" }, { value: "YES", label: "Avanzar" }, { value: "MIXED", label: "Revisar en comité" }, { value: "NO", label: "No avanzar" }]} />
    <div className="grid gap-4 md:grid-cols-2"><TextArea label="Fortalezas" value={strengths} onChange={setStrengths} /><TextArea label="Riesgos o reservas" value={concerns} onChange={setConcerns} /></div>
    <TextArea label="Comentarios adicionales" value={comments} onChange={setComments} />
    {submit.isError ? <InlineFeedback tone="danger" title="No fue posible guardar">{submit.error instanceof Error ? submit.error.message : "Revisa las respuestas obligatorias."}</InlineFeedback> : null}
    {submit.isSuccess ? <InlineFeedback tone="success" title="Borrador guardado">Puedes continuar editando hasta firmarlo.</InlineFeedback> : null}
    <InlineFeedback tone="warning" title="Firma definitiva"><span className="inline-flex items-center gap-2"><LockKeyhole className="size-4" />Al firmar, la ficha de evaluación y sus respuestas quedan bloqueadas para preservar la auditoría.</span></InlineFeedback>
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="secondary" onClick={() => submit.mutate(false)} disabled={submit.isPending}>Guardar borrador</Button><Button onClick={() => submit.mutate(true)} disabled={submit.isPending}>{submit.isPending ? "Procesando…" : "Firmar evaluación"}<CheckCircle2 className="size-4" /></Button></div>
    <Comparison context={context} />
  </div>;
}

function ScoreSummary({ context }: { context: ScorecardContextDto }) {
  return <div className="grid gap-3 rounded-xl bg-surface-section p-4 sm:grid-cols-3"><Summary label="Puntuación" value={`${Number(context.scorecard?.weightedScore ?? (context.scorecard?.overallRating ?? 0) * 20).toFixed(1)}/100`} /><Summary label="Recomendación" value={technicalLabel(context.scorecard?.recommendation)} /><Summary label="Evaluador" value={context.scorecard?.reviewer ? `${context.scorecard.reviewer.firstName} ${context.scorecard.reviewer.lastName}` : "Usuario actual"} /></div>;
}

function Comparison({ context }: { context: ScorecardContextDto }) {
  const comparison = context.comparisons;
  if (!comparison.evaluatorCount) return null;
  if (comparison.feedbackLocked) return <InlineFeedback tone="info" title="Retroalimentación protegida">La comparación se revelará según la política configurada: {technicalLabel(comparison.visibility)}. Esto evita influencia entre evaluadores antes de cerrar sus respuestas.</InlineFeedback>;
  return <section className="space-y-4 border-t border-border-default pt-5"><div><h3 className="font-semibold">Comparación entre evaluadores</h3><p className="text-sm text-text-secondary">{comparison.evaluatorCount} evaluación(es) firmada(s). Las alertas apoyan revisión humana y no deciden automáticamente.</p></div><div className="grid gap-3 sm:grid-cols-2">{comparison.evaluatorScores.map((item) => <div key={item.reviewer.id} className="rounded-xl bg-surface-section p-3"><p className="font-medium">{item.reviewer.firstName} {item.reviewer.lastName}</p><p className="text-sm text-text-secondary">{item.weightedScore.toFixed(1)}/100 · {technicalLabel(item.recommendation)}</p></div>)}</div>{comparison.criteria.some((item) => (item.spread ?? 0) > 0) ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-2">Criterio</th><th className="p-2">Promedio</th><th className="p-2">Rango</th></tr></thead><tbody>{comparison.criteria.map((item) => <tr key={item.key} className="border-b border-border-default"><td className="p-2">{item.label}</td><td className="p-2">{item.mean ?? "—"}</td><td className="p-2">{item.min ?? "—"}–{item.max ?? "—"}</td></tr>)}</tbody></table></div> : null}{comparison.biasSignals.length ? <div className="space-y-2">{comparison.biasSignals.map((signal, index) => <div key={`${signal.code}-${index}`} className="flex gap-3 rounded-xl border border-status-warning/30 bg-status-warning/5 p-3 text-sm"><AlertTriangle className="size-4 shrink-0" /><div><p className="font-semibold">{biasLabel(signal.code)}</p><p>{signal.message}</p></div></div>)}</div> : <InlineFeedback tone="success" title="Sin señales de revisión automática">No se detectaron discrepancias amplias, lenguaje sensible ni patrones extremos en las evaluaciones firmadas.</InlineFeedback>}</section>;
}

function calculateWeighted(template: ScorecardTemplateDto | null | undefined, responses: Record<string, ScorecardResponseDto>) {
  return template?.criteria.reduce((sum, criterion) => sum + (criterion.type === "RATING" ? ((responses[criterion.id]?.rating ?? 0) / 5) * criterion.weight : 0), 0) ?? 0;
}
function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="space-y-2 text-sm font-medium">{label}<textarea rows={4} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-border-default bg-background p-3" /></label>; }
function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) { return <div className="space-y-2"><Label>{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>; }
function Summary({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-text-secondary">{label}</p><p className="font-semibold">{value}</p></div>; }
function biasLabel(code: string) { return ({ EVALUATOR_DISAGREEMENT: "Discrepancia entre evaluadores", OUTLIER_EVALUATOR: "Puntuación atípica", POTENTIALLY_SENSITIVE_LANGUAGE: "Lenguaje sensible", EXTREME_WITHOUT_EVIDENCE: "Extremo sin evidencia", HALO_PATTERN: "Patrón uniforme" } as Record<string, string>)[code] ?? "Señal para revisión"; }
