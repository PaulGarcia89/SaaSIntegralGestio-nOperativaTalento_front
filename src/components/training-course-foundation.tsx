"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AsyncState } from "@/components/async-state";
import { InlineFeedback } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  createTrainingCompetency,
  fetchTrainingCompetencies,
  fetchTrainingCourseDesign,
  fetchUsers,
  getApiErrorMessage,
  updateTrainingCourseDesign,
} from "@/lib/backend";
import type {
  TrainingAudienceOperator,
  TrainingAudienceRuleDto,
  TrainingAudienceRuleType,
  TrainingCompetencyDto,
  TrainingCompetencyLevel,
  TrainingCourseDesignDto,
  TrainingCourseDesignInput,
  TrainingLearningObjectiveDto,
  UserDto,
} from "@/lib/contracts";
import { getTrainingCourseDesignErrors } from "@/lib/training-course-design";

const levels: Array<{ value: TrainingCompetencyLevel; label: string }> = [
  { value: "AWARENESS", label: "Conocimiento" },
  { value: "WORKING", label: "Aplicación guiada" },
  { value: "PROFICIENT", label: "Dominio operativo" },
  { value: "EXPERT", label: "Experto" },
];

const ruleTypes: Array<{ value: TrainingAudienceRuleType; label: string }> = [
  { value: "ROLE", label: "Rol" },
  { value: "JOB_TITLE", label: "Puesto" },
  { value: "BRANCH", label: "Sucursal" },
  { value: "GROUP", label: "Grupo" },
];

const emptyBrief: TrainingCourseDesignInput["brief"] = {
  businessNeed: "",
  targetOutcome: "",
  successKpi: "",
  audienceDescription: "",
  baselineMetric: "",
  targetMetric: "",
  riskIfNotCompleted: "",
};

export function TrainingCourseFoundation({
  courseId,
  courseTenantId,
  editable,
  onChanged,
  onSaved,
}: {
  courseId: string;
  courseTenantId?: string | null;
  editable: boolean;
  onChanged: () => Promise<void>;
  onSaved?: () => void;
}) {
  const design = useQuery({
    queryKey: ["training-course-design", courseId],
    queryFn: () => fetchTrainingCourseDesign(courseId),
  });
  const competencies = useQuery({
    queryKey: ["training-competencies"],
    queryFn: fetchTrainingCompetencies,
  });
  const users = useQuery({ queryKey: ["training-foundation-users"], queryFn: fetchUsers });

  if (design.isLoading || competencies.isLoading) return <AsyncState state="loading" title="Cargando diseño pedagógico" />;
  if (design.isError || competencies.isError) {
    return <AsyncState state="error" title="No fue posible cargar el diseño pedagógico" onRetry={() => { void design.refetch(); void competencies.refetch(); }} />;
  }
  if (!design.data || !competencies.data) return null;

  return (
    <FoundationForm
      key={JSON.stringify(design.data)}
      courseId={courseId}
      initial={design.data}
      availableCompetencies={competencies.data.filter((item) =>
        courseTenantId === null ? item.tenantId == null : item.tenantId == null || item.tenantId === courseTenantId,
      )}
      globalCourse={courseTenantId === null}
      users={users.data ?? []}
      editable={editable}
      onChanged={onChanged}
      onSaved={onSaved}
    />
  );
}

function FoundationForm({
  courseId,
  initial,
  availableCompetencies,
  globalCourse,
  users,
  editable,
  onChanged,
  onSaved,
}: {
  courseId: string;
  initial: TrainingCourseDesignDto;
  availableCompetencies: TrainingCompetencyDto[];
  globalCourse: boolean;
  users: UserDto[];
  editable: boolean;
  onChanged: () => Promise<void>;
  onSaved?: () => void;
}) {
  const queryClient = useQueryClient();
  const [brief, setBrief] = useState<TrainingCourseDesignInput["brief"]>({ ...emptyBrief, ...initial.brief });
  const [selected, setSelected] = useState<TrainingCourseDesignInput["competencies"]>(
    initial.competencies.map(({ competencyId, targetLevel, isRequired, sortOrder }) => ({ competencyId, targetLevel, isRequired, sortOrder })),
  );
  const [objectives, setObjectives] = useState<TrainingCourseDesignInput["objectives"]>(
    initial.objectives.map(stripObjective),
  );
  const [audienceRules, setAudienceRules] = useState<TrainingCourseDesignInput["audienceRules"]>(
    initial.audienceRules.map(stripRule),
  );
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");

  const save = useMutation({
    mutationFn: () => updateTrainingCourseDesign(courseId, { brief, competencies: selected, objectives, audienceRules }),
    onSuccess: async () => {
      toast.success("Fundación pedagógica guardada");
      await queryClient.invalidateQueries({ queryKey: ["training-course-design", courseId] });
      await onChanged();
      onSaved?.();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible guardar el diseño pedagógico.")),
  });
  const createCompetency = useMutation({
    mutationFn: () => createTrainingCompetency({ code: newCode, name: newName, scope: globalCourse ? "GLOBAL" : "TENANT" }),
    onSuccess: async (competency) => {
      setSelected((items) => [...items, { competencyId: competency.id, targetLevel: "WORKING", isRequired: true, sortOrder: items.length }]);
      setNewCode("");
      setNewName("");
      await queryClient.invalidateQueries({ queryKey: ["training-competencies"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible crear la competencia.")),
  });

  const localErrors = getTrainingCourseDesignErrors({
    brief,
    competencies: selected,
    objectives,
    audienceRules,
  });

  return (
    <section className="space-y-4" aria-labelledby="foundation-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="foundation-title" className="text-xl font-semibold">Fundación pedagógica</h2>
          <p className="text-sm text-text-secondary">Define por qué existe el curso, a quién sirve y qué desempeño debe producir.</p>
        </div>
        <Badge variant={localErrors.length ? "warning" : "success"}>
          {localErrors.length ? `${localErrors.length} requisitos pendientes` : "Listo para revisión"}
        </Badge>
      </div>

      {localErrors.length ? (
        <InlineFeedback tone="warning" title="Antes de enviar a revisión">
          <ul className="list-disc space-y-1 pl-5">{localErrors.map((error) => <li key={error}>{error}</li>)}</ul>
        </InlineFeedback>
      ) : null}

      <Card level={2}>
        <CardHeader><CardTitle>Brief del curso</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TextArea label="Necesidad del negocio" value={brief.businessNeed} disabled={!editable} onChange={(businessNeed) => setBrief({ ...brief, businessNeed })} />
          <TextArea label="Resultado esperado" value={brief.targetOutcome} disabled={!editable} onChange={(targetOutcome) => setBrief({ ...brief, targetOutcome })} />
          <Field label="KPI de éxito" value={brief.successKpi} disabled={!editable} onChange={(successKpi) => setBrief({ ...brief, successKpi })} />
          <Field label="Audiencia general" value={brief.audienceDescription ?? ""} disabled={!editable} onChange={(audienceDescription) => setBrief({ ...brief, audienceDescription })} />
          <Field label="Línea base" value={brief.baselineMetric ?? ""} disabled={!editable} onChange={(baselineMetric) => setBrief({ ...brief, baselineMetric })} />
          <Field label="Meta" value={brief.targetMetric ?? ""} disabled={!editable} onChange={(targetMetric) => setBrief({ ...brief, targetMetric })} />
          <UserChoice label="Responsable del contenido" value={brief.contentOwnerId ?? "NONE"} users={users} disabled={!editable} onChange={(value) => setBrief({ ...brief, contentOwnerId: value === "NONE" ? undefined : value })} />
          <UserChoice label="Experto de negocio" value={brief.subjectMatterExpertId ?? "NONE"} users={users} disabled={!editable} onChange={(value) => setBrief({ ...brief, subjectMatterExpertId: value === "NONE" ? undefined : value })} />
          <Field label="Fecha objetivo" type="date" value={brief.targetDate?.slice(0, 10) ?? ""} disabled={!editable} onChange={(targetDate) => setBrief({ ...brief, targetDate: targetDate ? new Date(`${targetDate}T12:00:00`).toISOString() : undefined })} />
          <TextArea label="Riesgo de no completar" value={brief.riskIfNotCompleted ?? ""} disabled={!editable} onChange={(riskIfNotCompleted) => setBrief({ ...brief, riskIfNotCompleted })} />
        </CardContent>
      </Card>

      <Card level={2}>
        <CardHeader><CardTitle>Competencias</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            {availableCompetencies.filter((item) => item.isActive).map((competency) => {
              const current = selected.find((item) => item.competencyId === competency.id);
              return (
                <div key={competency.id} className="rounded-xl border border-border-default p-3">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={Boolean(current)}
                      disabled={!editable}
                      onChange={(event) => setSelected(event.target.checked
                        ? [...selected, { competencyId: competency.id, targetLevel: "WORKING", isRequired: true, sortOrder: selected.length }]
                        : selected.filter((item) => item.competencyId !== competency.id))}
                    />
                    <span className="flex-1"><strong>{competency.name}</strong><span className="block text-xs text-text-secondary">{competency.code}{competency.framework ? ` · ${competency.framework}` : ""}</span></span>
                  </label>
                  {current ? <LevelChoice value={current.targetLevel} disabled={!editable} onChange={(targetLevel) => setSelected(selected.map((item) => item.competencyId === competency.id ? { ...item, targetLevel } : item))} /> : null}
                </div>
              );
            })}
          </div>
          {editable ? (
            <div className="grid gap-2 rounded-xl border border-dashed border-border-strong p-3 sm:grid-cols-[160px_1fr_auto]">
              <Input aria-label="Código de competencia" placeholder="Código" value={newCode} onChange={(event) => setNewCode(event.target.value)} />
              <Input aria-label="Nombre de competencia" placeholder="Nueva competencia" value={newName} onChange={(event) => setNewName(event.target.value)} />
              <Button type="button" variant="secondary" disabled={!newCode.trim() || !newName.trim() || createCompetency.isPending} onClick={() => createCompetency.mutate()}><Plus className="size-4" />Crear</Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card level={2}>
        <CardHeader><CardTitle>Objetivos de aprendizaje</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {objectives.map((objective, index) => (
            <div key={index} className="grid gap-3 rounded-xl border border-border-default p-4 lg:grid-cols-2">
              <TextArea label="Al finalizar, la persona podrá…" value={objective.statement} disabled={!editable} onChange={(statement) => updateObjective(index, { statement }, objectives, setObjectives)} />
              <TextArea label="Criterio de éxito" value={objective.successCriteria} disabled={!editable} onChange={(successCriteria) => updateObjective(index, { successCriteria }, objectives, setObjectives)} />
              <Field label="Método de evaluación" value={objective.assessmentMethod} disabled={!editable} onChange={(assessmentMethod) => updateObjective(index, { assessmentMethod }, objectives, setObjectives)} />
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <Select value={objective.competencyId ?? "NONE"} disabled={!editable} onValueChange={(competencyId) => updateObjective(index, { competencyId: competencyId === "NONE" ? undefined : competencyId }, objectives, setObjectives)}><SelectTrigger><SelectValue placeholder="Competencia" /></SelectTrigger><SelectContent><SelectItem value="NONE">Sin competencia</SelectItem>{selected.map((item) => { const competency = availableCompetencies.find((candidate) => candidate.id === item.competencyId); return competency ? <SelectItem key={competency.id} value={competency.id}>{competency.name}</SelectItem> : null; })}</SelectContent></Select>
                <LevelChoice value={objective.targetLevel} disabled={!editable} onChange={(targetLevel) => updateObjective(index, { targetLevel }, objectives, setObjectives)} />
                {editable ? <Button type="button" size="icon" variant="ghost" aria-label="Eliminar objetivo" onClick={() => setObjectives(objectives.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="size-4 text-status-danger" /></Button> : null}
              </div>
            </div>
          ))}
          {editable ? <Button type="button" variant="secondary" onClick={() => setObjectives([...objectives, { statement: "", successCriteria: "", assessmentMethod: "", targetLevel: "WORKING", isRequired: true, sortOrder: objectives.length }])}><Plus className="size-4" />Objetivo</Button> : null}
        </CardContent>
      </Card>

      <Card level={2}>
        <CardHeader><CardTitle>Reglas de audiencia</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {audienceRules.map((rule, index) => (
            <div key={index} className="grid gap-2 rounded-xl border border-border-default p-3 md:grid-cols-[180px_160px_1fr_auto]">
              <Select value={rule.ruleType} disabled={!editable} onValueChange={(ruleType) => updateRule(index, { ruleType: ruleType as TrainingAudienceRuleType }, audienceRules, setAudienceRules)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ruleTypes.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>
              <Select value={rule.operator} disabled={!editable} onValueChange={(operator) => updateRule(index, { operator: operator as TrainingAudienceOperator }, audienceRules, setAudienceRules)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="EQUALS">Es igual a</SelectItem><SelectItem value="CONTAINS">Contiene</SelectItem></SelectContent></Select>
              <Input aria-label="Valor de audiencia" value={rule.value} disabled={!editable} onChange={(event) => updateRule(index, { value: event.target.value }, audienceRules, setAudienceRules)} />
              {editable ? <Button type="button" size="icon" variant="ghost" aria-label="Eliminar regla" onClick={() => setAudienceRules(audienceRules.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="size-4 text-status-danger" /></Button> : null}
            </div>
          ))}
          {editable ? <Button type="button" variant="secondary" onClick={() => setAudienceRules([...audienceRules, { ruleType: "JOB_TITLE", operator: "CONTAINS", value: "", sortOrder: audienceRules.length }])}><Plus className="size-4" />Regla</Button> : null}
        </CardContent>
      </Card>

      {editable ? <div className="flex justify-end"><Button type="button" disabled={save.isPending} onClick={() => save.mutate()}>{save.isPending ? "Guardando…" : "Guardar fundación pedagógica"}</Button></div> : null}
    </section>
  );
}

function stripObjective(objective: TrainingLearningObjectiveDto): TrainingCourseDesignInput["objectives"][number] {
  return { competencyId: objective.competencyId, statement: objective.statement, successCriteria: objective.successCriteria, assessmentMethod: objective.assessmentMethod, targetLevel: objective.targetLevel, isRequired: objective.isRequired, sortOrder: objective.sortOrder };
}

function stripRule(rule: TrainingAudienceRuleDto): TrainingCourseDesignInput["audienceRules"][number] {
  return { ruleType: rule.ruleType, operator: rule.operator, value: rule.value, description: rule.description, sortOrder: rule.sortOrder };
}

function updateObjective(index: number, patch: Partial<TrainingCourseDesignInput["objectives"][number]>, items: TrainingCourseDesignInput["objectives"], setItems: (items: TrainingCourseDesignInput["objectives"]) => void) {
  setItems(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
}

function updateRule(index: number, patch: Partial<TrainingCourseDesignInput["audienceRules"][number]>, items: TrainingCourseDesignInput["audienceRules"], setItems: (items: TrainingCourseDesignInput["audienceRules"]) => void) {
  setItems(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
}

function Field({ label, value, onChange, disabled, type = "text" }: { label: string; value: string; onChange: (value: string) => void; disabled: boolean; type?: string }) {
  return <label className="space-y-2 text-sm font-medium">{label}<Input type={type} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} /></label>;
}

function TextArea({ label, value, onChange, disabled }: { label: string; value: string; onChange: (value: string) => void; disabled: boolean }) {
  return <label className="space-y-2 text-sm font-medium">{label}<textarea className="min-h-24 w-full rounded-2xl border border-border-default bg-surface-elevated p-3 disabled:opacity-60" value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} /></label>;
}

function LevelChoice({ value, onChange, disabled }: { value: TrainingCompetencyLevel; onChange: (value: TrainingCompetencyLevel) => void; disabled: boolean }) {
  return <Select value={value} disabled={disabled} onValueChange={(next) => onChange(next as TrainingCompetencyLevel)}><SelectTrigger aria-label="Nivel objetivo"><SelectValue /></SelectTrigger><SelectContent>{levels.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>;
}

function UserChoice({ label, value, users, onChange, disabled }: { label: string; value: string; users: UserDto[]; onChange: (value: string) => void; disabled: boolean }) {
  return <label className="space-y-2 text-sm font-medium">{label}<Select value={value} disabled={disabled} onValueChange={onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="NONE">Sin asignar</SelectItem>{users.map((user) => <SelectItem key={user.id} value={user.id}>{user.fullName}</SelectItem>)}</SelectContent></Select></label>;
}
