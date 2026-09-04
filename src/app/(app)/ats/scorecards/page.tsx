"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Copy, Plus, Power, Scale, Trash2 } from "lucide-react";
import {
  createScorecardTemplate,
  duplicateScorecardTemplate,
  fetchScorecardTemplates,
  fetchVacancies,
  fetchVacancySetup,
  updateScorecardTemplateAdmin,
} from "@/lib/backend";
import type {
  CreateScorecardTemplateInput,
  ScorecardCriterionType,
} from "@/lib/contracts";
import { ScorecardGovernanceConsole } from "@/components/scorecard-governance-console";
import { InlineFeedback, PageHeader } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { technicalLabel } from "@/lib/ui-labels";

type CriterionDraft = CreateScorecardTemplateInput["criteria"][number] & {
  localId: string;
  lowAnchor?: string;
  highAnchor?: string;
};

const newCriterion = (index: number): CriterionDraft => ({
  localId: crypto.randomUUID(),
  key: `CRITERIO_${index + 1}`,
  label: "",
  type: "RATING",
  weight: 0,
  isRequired: true,
  requiresEvidence: false,
  lowAnchor: "",
  highAnchor: "",
});

export default function ScorecardsPage() {
  const queryClient = useQueryClient();
  const [vacancyId, setVacancyId] = useState("");
  const [stageId, setStageId] = useState("ALL");
  const [scope, setScope] = useState<"VACANCY" | "TENANT">("VACANCY");
  const [feedbackVisibility, setFeedbackVisibility] = useState<"IMMEDIATE" | "AFTER_OWN_SUBMISSION" | "AFTER_ALL_SUBMITTED" | "HIRING_MANAGER_ONLY">("AFTER_ALL_SUBMITTED");
  const [name, setName] = useState("Evaluación estructurada");
  const [instructions, setInstructions] = useState("");
  const [criteria, setCriteria] = useState<CriterionDraft[]>([
    { ...newCriterion(0), key: "EXPERIENCIA", label: "Experiencia relevante", weight: 50, competencyName: "Experiencia" },
    { ...newCriterion(1), key: "RESOLUCION", label: "Resolución de problemas", weight: 50, competencyName: "Pensamiento crítico" },
  ]);
  const vacancies = useQuery({ queryKey: ["vacancies", "scorecards"], queryFn: fetchVacancies });
  const setup = useQuery({
    queryKey: ["vacancy-setup", vacancyId],
    queryFn: () => fetchVacancySetup(vacancyId),
    enabled: Boolean(vacancyId),
  });
  const templates = useQuery({
    queryKey: ["scorecard-templates", vacancyId],
    queryFn: () => fetchScorecardTemplates(vacancyId || undefined),
  });
  const totalWeight = criteria
    .filter((criterion) => criterion.type === "RATING")
    .reduce((sum, criterion) => sum + criterion.weight, 0);
  const save = useMutation({
    mutationFn: () => createScorecardTemplate({
      vacancyId: scope === "VACANCY" ? vacancyId : undefined,
      scope,
      feedbackVisibility,
      stageId: stageId === "ALL" ? undefined : stageId,
      name,
      instructions: instructions || undefined,
      criteria: criteria.map(({ localId, lowAnchor, highAnchor, ...criterion }) => {
        void localId;
        return {
          ...criterion,
          ratingAnchors: criterion.type === "RATING" && (lowAnchor || highAnchor)
            ? { "1": lowAnchor || "Evidencia insuficiente", "5": highAnchor || "Evidencia sobresaliente" }
            : undefined,
        };
      }),
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["scorecard-templates", vacancyId] });
    },
  });
  const templateAdmin = useMutation({ mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => updateScorecardTemplateAdmin(id, { isActive }), onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["scorecard-templates"] }) });
  const duplicate = useMutation({ mutationFn: (id: string) => duplicateScorecardTemplate(id, { vacancyId: scope === "VACANCY" ? vacancyId : undefined, scope }), onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["scorecard-templates"] }) });

  function updateCriterion(localId: string, patch: Partial<CriterionDraft>) {
    setCriteria((current) => current.map((item) => item.localId === localId ? { ...item, ...patch } : item));
  }

  function move(localId: string, direction: -1 | 1) {
    setCriteria((current) => {
      const index = current.findIndex((item) => item.localId === localId);
      const destination = index + direction;
      if (index < 0 || destination < 0 || destination >= current.length) return current;
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  }

  const canSave = Boolean(
    (scope === "TENANT" || vacancyId)
    && name.trim()
    && criteria.length
    && criteria.every((criterion) => criterion.key.trim() && criterion.label.trim())
    && totalWeight === 100,
  );

  return <div className="space-y-7">
    <PageHeader eyebrow="Reclutamiento estructurado" title="Diseñador de fichas de evaluación" description="Crea una rúbrica por vacante y etapa. Cada publicación genera una versión nueva y conserva intactas las evaluaciones firmadas." />
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,.7fr)]">
      <Card level={1}><CardHeader><CardTitle>Nueva versión</CardTitle></CardHeader><CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Alcance" value={scope} onChange={(value) => { setScope(value as "VACANCY" | "TENANT"); if (value === "TENANT") setStageId("ALL"); }} options={[{ value: "VACANCY", label: "Vacante específica" }, { value: "TENANT", label: "Compartida entre vacantes" }]} />
          <SelectField label="Visibilidad de la retroalimentación" value={feedbackVisibility} onChange={(value) => setFeedbackVisibility(value as typeof feedbackVisibility)} options={[{ value: "IMMEDIATE", label: "Inmediata" }, { value: "AFTER_OWN_SUBMISSION", label: "Después de enviar la propia" }, { value: "AFTER_ALL_SUBMITTED", label: "Cuando todos terminen" }, { value: "HIRING_MANAGER_ONLY", label: "Solo gerente de contratación" }]} />
          <SelectField label="Vacante" value={vacancyId} onChange={(value) => { setVacancyId(value); setStageId("ALL"); }} options={(vacancies.data?.data ?? []).map((item) => ({ value: item.id, label: item.title }))} />
          <SelectField label="Etapa" value={stageId} onChange={setStageId} options={[{ value: "ALL", label: "Toda la vacante" }, ...(setup.data?.stages ?? []).map((item) => ({ value: item.id!, label: item.name }))]} />
        </div>
        <Field label="Nombre de la plantilla" value={name} onChange={setName} />
        <label className="space-y-2 text-sm font-medium">Instrucciones para evaluadores<textarea className="w-full rounded-xl border border-border-default bg-background p-3" rows={3} value={instructions} onChange={(event) => setInstructions(event.target.value)} /></label>
        <div className="flex items-center justify-between gap-3">
          <div><h2 className="font-semibold">Criterios y preguntas</h2><p className="text-sm text-text-secondary">Los criterios de calificación deben sumar exactamente 100%.</p></div>
          <Button variant="secondary" onClick={() => setCriteria((current) => [...current, newCriterion(current.length)])}><Plus className="size-4" />Agregar</Button>
        </div>
        <div className="space-y-4">{criteria.map((criterion, index) => <div key={criterion.localId} className="rounded-2xl border border-border-default bg-surface-section p-4">
          <div className="mb-4 flex items-center justify-between"><p className="font-semibold">{index + 1}. {criterion.label || "Criterio sin nombre"}</p><div className="flex"><Button size="icon" variant="ghost" aria-label="Subir criterio" onClick={() => move(criterion.localId, -1)} disabled={index === 0}><ArrowUp className="size-4" /></Button><Button size="icon" variant="ghost" aria-label="Bajar criterio" onClick={() => move(criterion.localId, 1)} disabled={index === criteria.length - 1}><ArrowDown className="size-4" /></Button><Button size="icon" variant="ghost" aria-label="Eliminar criterio" onClick={() => setCriteria((current) => current.filter((item) => item.localId !== criterion.localId))}><Trash2 className="size-4" /></Button></div></div>
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Clave" value={criterion.key} onChange={(key) => updateCriterion(criterion.localId, { key: key.toUpperCase().replace(/\W+/g, "_") })} /><Field label="Pregunta o criterio" value={criterion.label} onChange={(label) => updateCriterion(criterion.localId, { label })} /><Field label="Competencia" value={criterion.competencyName ?? ""} onChange={(competencyName) => updateCriterion(criterion.localId, { competencyName })} /><SelectField label="Tipo" value={criterion.type} onChange={(type) => updateCriterion(criterion.localId, { type: type as ScorecardCriterionType, weight: type === "RATING" ? criterion.weight : 0 })} options={[{ value: "RATING", label: "Calificación 1-5" }, { value: "TEXT", label: "Respuesta abierta" }, { value: "BOOLEAN", label: "Sí / No" }]} />{criterion.type === "RATING" ? <><Field label="Peso (%)" type="number" value={String(criterion.weight)} onChange={(weight) => updateCriterion(criterion.localId, { weight: Number(weight) })} /><div /><Field label="Ancla 1 (evidencia débil)" value={criterion.lowAnchor ?? ""} onChange={(lowAnchor) => updateCriterion(criterion.localId, { lowAnchor })} /><Field label="Ancla 5 (evidencia fuerte)" value={criterion.highAnchor ?? ""} onChange={(highAnchor) => updateCriterion(criterion.localId, { highAnchor })} /></> : null}</div>
          <div className="mt-4 flex flex-wrap gap-5 text-sm"><Checkbox label="Obligatorio" checked={criterion.isRequired ?? false} onChange={(isRequired) => updateCriterion(criterion.localId, { isRequired })} /><Checkbox label="Exigir evidencia" checked={criterion.requiresEvidence ?? false} onChange={(requiresEvidence) => updateCriterion(criterion.localId, { requiresEvidence })} /></div>
        </div>)}</div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-primary/5 p-4"><div className="flex items-center gap-2"><Scale className="size-5 text-brand" /><span className="font-semibold">Peso total: {totalWeight}%</span></div><span className={`text-sm ${totalWeight === 100 ? "text-status-success" : "text-status-danger"}`}>{totalWeight === 100 ? "Distribución válida" : "Debe sumar 100%"}</span></div>
        {save.isError ? <InlineFeedback tone="danger" title="No fue posible publicar">{save.error instanceof Error ? save.error.message : "Revisa los criterios."}</InlineFeedback> : null}
        {save.isSuccess ? <InlineFeedback tone="success" title="Versión publicada">La versión {save.data.version} quedó activa; las versiones anteriores permanecen como historial.</InlineFeedback> : null}
        <Button className="w-full" disabled={!canSave || save.isPending} onClick={() => save.mutate()}>{save.isPending ? "Publicando…" : "Publicar nueva versión"}</Button>
      </CardContent></Card>
      <aside><Card level={2}><CardHeader><CardTitle>Versiones publicadas</CardTitle></CardHeader><CardContent>{templates.isLoading ? <p className="text-sm text-text-secondary">Cargando versiones…</p> : templates.data?.length ? <ol className="space-y-3">{templates.data.map((template) => <li key={template.id} className="rounded-xl border border-border-default p-3"><div className="flex items-start justify-between gap-2"><div><p className="font-medium">{template.name}</p><p className="text-xs text-text-secondary">{template.scope === "TENANT" ? "Compartida" : template.stage?.name ?? "Toda la vacante"} · {template.criteria.length} criterios</p><p className="mt-1 text-xs text-text-secondary">Visibilidad de la retroalimentación: {technicalLabel(template.feedbackVisibility)}</p></div><span className="rounded-full bg-secondary px-2 py-1 text-xs">v{template.version}{template.isActive ? " · Activa" : ""}</span></div><div className="mt-3 flex gap-2"><Button size="sm" variant="ghost" onClick={() => duplicate.mutate(template.id)}><Copy className="size-3.5" />Duplicar</Button><Button size="sm" variant="ghost" onClick={() => templateAdmin.mutate({ id: template.id, isActive: !template.isActive })}><Power className="size-3.5" />{template.isActive ? "Desactivar" : "Activar"}</Button><Button size="sm" variant="ghost" onClick={() => { setName(template.name); setInstructions(template.instructions ?? ""); setFeedbackVisibility(template.feedbackVisibility ?? "AFTER_ALL_SUBMITTED"); setCriteria(template.criteria.map((item) => ({ ...item, localId: crypto.randomUUID(), lowAnchor: item.ratingAnchors?.["1"] ?? "", highAnchor: item.ratingAnchors?.["5"] ?? "" }))); }}>Editar como nueva versión</Button></div></li>)}</ol> : <p className="text-sm text-text-secondary">No hay plantillas disponibles.</p>}</CardContent></Card></aside>
    </section>
    <ScorecardGovernanceConsole />
  </div>;
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  const id = label.toLowerCase().replace(/\W+/g, "-");
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} /></div>;
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return <div className="space-y-2"><Label>{label}</Label><Select value={value || undefined} onValueChange={onChange}><SelectTrigger><SelectValue placeholder={`Selecciona ${label.toLowerCase()}`} /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>;
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex items-center gap-2"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />{label}</label>;
}
