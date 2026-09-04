"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, Plus, ShieldCheck, Trash2 } from "lucide-react";
import {
  addTrainingPathCourse, createTrainingLearningPath, createTrainingOnboardingRule, deleteTrainingOnboardingRule,
  fetchOnboardingTemplates, fetchTrainingCourses, fetchTrainingLearningPaths, fetchTrainingOnboardingRules,
  removeTrainingPathCourse,
} from "@/lib/backend";
import type { TrainingLearningPathDto } from "@/lib/contracts";
import { useAppStore } from "@/store/app-store";
import { AsyncState } from "@/components/async-state";
import { InlineFeedback, PageHeader } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function TrainingPathsManager() {
  const searchParams = useSearchParams();
  const requestedFlowId = searchParams.get("flowId") ?? "";
  const requestedTemplateId = searchParams.get("templateId") ?? "";
  const queryClient = useQueryClient();
  const { currentBranch } = useAppStore();
  const [selectedId, setSelectedId] = useState("");
  const [dialog, setDialog] = useState<"path" | "course" | "rule" | null>(() => requestedFlowId ? "rule" : null);
  const paths = useQuery({ queryKey: ["training-learning-paths"], queryFn: fetchTrainingLearningPaths });
  const rules = useQuery({ queryKey: ["training-onboarding-rules"], queryFn: fetchTrainingOnboardingRules });
  const courses = useQuery({ queryKey: ["training-published-courses"], queryFn: () => fetchTrainingCourses({ page: 1, pageSize: 100, status: "PUBLISHED" }) });
  const templates = useQuery({ queryKey: ["onboarding-templates"], queryFn: fetchOnboardingTemplates });
  const selected = useMemo(() => paths.data?.find(path => path.id === selectedId) ?? paths.data?.[0] ?? null, [paths.data, selectedId]);
  const refresh = () => Promise.all([queryClient.invalidateQueries({ queryKey: ["training-learning-paths"] }), queryClient.invalidateQueries({ queryKey: ["training-onboarding-rules"] })]);

  return <div className="space-y-6">
    <PageHeader eyebrow="Aprendizaje" title="Rutas, vencimientos y automatización" description="Ordena cursos con prerrequisitos y asigna formación automáticamente desde la incorporación." actions={<><Button variant="secondary" onClick={() => setDialog("rule")}><Link2 className="size-4" />Regla de incorporación</Button><Button onClick={() => setDialog("path")}><Plus className="size-4" />Nueva ruta</Button></>} />
    {requestedFlowId ? <InlineFeedback tone="success" title="Incorporación preseleccionada">Configura la formación para el expediente {requestedFlowId}; la plantilla de origen ya está seleccionada.</InlineFeedback> : null}
    {paths.data?.length ? <PathSummary paths={paths.data} rules={rules.data?.length ?? 0} /> : null}
    {paths.isLoading ? <AsyncState state="loading" title="Cargando rutas formativas" /> : null}
    {paths.isError ? <AsyncState state="error" title="No pudimos cargar las rutas" onRetry={() => void paths.refetch()} /> : null}
    {paths.isSuccess && !paths.data.length ? <InlineFeedback tone="info" title="Todavía no hay rutas">Crea una ruta y agrega cursos publicados en el orden requerido.</InlineFeedback> : null}
    {selected ? <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]"><aside className="space-y-3" aria-label="Rutas de aprendizaje"><p className="px-1 text-sm font-semibold">Rutas disponibles</p>{paths.data?.map(path => <button type="button" key={path.id} aria-pressed={path.id === selected.id} onClick={() => setSelectedId(path.id)} className={`w-full rounded-2xl border p-4 text-left ${path.id === selected.id ? "border-primary bg-primary/5" : "bg-surface-section"}`}><div className="flex justify-between gap-3"><div><p className="font-semibold">{path.title}</p><p className="text-sm text-text-secondary">{path.pathCourses.length} cursos · {path._count.assignments} asignaciones</p></div><Badge>{path.isPublished ? "Publicada" : "Borrador"}</Badge></div></button>)}</aside><main className="space-y-5">
      <Card level={1}><CardHeader><div className="flex flex-wrap justify-between gap-3"><div><CardTitle>{selected.title}</CardTitle><p className="text-sm text-text-secondary">{selected.description || "Sin descripción"}</p></div><Button size="sm" onClick={() => setDialog("course")}><Plus className="size-4" />Agregar curso</Button></div></CardHeader><CardContent>{!selected.pathCourses.length ? <InlineFeedback tone="info" title="Ruta vacía">Agrega el primer curso publicado.</InlineFeedback> : <ol className="space-y-3">{selected.pathCourses.map((entry, index) => <li key={entry.id} className="flex items-start gap-4 rounded-xl border p-4"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-brand">{index + 1}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{entry.course.title}</p>{entry.isRequired ? <Badge>Obligatorio</Badge> : null}</div><p className="text-sm text-text-secondary">{entry.prerequisiteCourse ? `Requiere completar: ${entry.prerequisiteCourse.title}` : "Disponible desde el inicio"}{entry.unlockAfterDays ? ` · se habilita después de ${entry.unlockAfterDays} días` : ""}</p></div><Button size="icon" variant="ghost" aria-label={`Quitar ${entry.course.title}`} onClick={() => void removeTrainingPathCourse(selected.id, entry.courseId).then(refresh)}><Trash2 className="size-4" /></Button></li>)}</ol>}</CardContent></Card>
      <Rules rules={rules.data ?? []} onDelete={id => void deleteTrainingOnboardingRule(id).then(refresh)} />
    </main></div> : <Rules rules={rules.data ?? []} onDelete={id => void deleteTrainingOnboardingRule(id).then(refresh)} />}
    <PathDialog kind={dialog} selected={selected} paths={paths.data ?? []} courses={courses.data?.items ?? []} templates={templates.data ?? []} branchId={currentBranch?.id} initialTemplateId={requestedTemplateId} onClose={() => setDialog(null)} onSuccess={async () => { await refresh(); setDialog(null); }} />
  </div>;
}

function PathSummary({ paths, rules }: { paths: TrainingLearningPathDto[]; rules: number }) {
  const published = paths.filter(path => path.isPublished).length;
  const courses = paths.reduce((total, path) => total + path.pathCourses.length, 0);
  const assignments = paths.reduce((total, path) => total + path._count.assignments, 0);
  return <section aria-labelledby="path-summary-title" className="space-y-3"><div><h2 id="path-summary-title" className="text-lg font-semibold">Resumen de rutas</h2><p className="text-sm text-text-secondary">Comprueba el alcance del catálogo antes de editar una secuencia.</p></div><div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><PathMetric label="Rutas" value={paths.length} /><PathMetric label="Publicadas" value={published} tone="success" /><PathMetric label="Cursos incluidos" value={courses} /><PathMetric label="Asignaciones" value={assignments} detail={`${rules} reglas automáticas`} /></div></section>;
}

function PathMetric({ label, value, detail, tone = "normal" }: { label: string; value: number; detail?: string; tone?: "normal" | "success" }) {
  return <Card level={2}><CardContent className="p-4"><p className="text-xs text-text-secondary">{label}</p><p className={`mt-1 text-2xl font-semibold ${tone === "success" ? "text-status-success" : "text-text-primary"}`}>{value}</p>{detail ? <p className="mt-1 text-xs text-text-secondary">{detail}</p> : null}</CardContent></Card>;
}

function Rules({ rules, onDelete }: { rules: Array<{ id: string; name: string; dueDays: number; isRequired: boolean; onboardingTemplate?: { name: string; version: number } | null; curriculum?: { title: string } | null; course?: { title: string } | null; jobTitlePattern?: string | null; roleCode?: string | null }>; onDelete: (id: string) => void }) {
  return <Card level={2}><CardHeader><CardTitle>Asignación automática desde incorporación</CardTitle></CardHeader><CardContent className="space-y-3">{!rules.length ? <InlineFeedback tone="info" title="Sin reglas automáticas">Crea una regla para conectar una plantilla de incorporación con un curso o ruta.</InlineFeedback> : rules.map(rule => <div key={rule.id} className="flex flex-wrap items-center gap-4 rounded-xl border p-4"><ShieldCheck className="size-5 text-brand" /><div className="min-w-0 flex-1"><p className="font-semibold">{rule.name}</p><p className="text-sm text-text-secondary">{rule.curriculum?.title || rule.course?.title} · vence en {rule.dueDays} días · {rule.onboardingTemplate ? `${rule.onboardingTemplate.name} v${rule.onboardingTemplate.version}` : "cualquier plantilla"}{rule.jobTitlePattern ? ` · puesto: ${rule.jobTitlePattern}` : ""}{rule.roleCode ? ` · rol: ${rule.roleCode}` : ""}</p></div><Button size="icon" variant="ghost" aria-label={`Eliminar ${rule.name}`} onClick={() => onDelete(rule.id)}><Trash2 className="size-4" /></Button></div>)}</CardContent></Card>;
}

function PathDialog({ kind, selected, paths, courses, templates, branchId, initialTemplateId, onClose, onSuccess }: { kind: string | null; selected: TrainingLearningPathDto | null; paths: TrainingLearningPathDto[]; courses: Array<{ id: string; title: string }>; templates: Array<{ id: string; name: string; version: number }>; branchId?: string; initialTemplateId?: string; onClose: () => void; onSuccess: () => Promise<void> }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const set = (key: string, value: string) => setValues(current => ({ ...current, [key]: value }));
  const mutation = useMutation({ mutationFn: () => {
    if (kind === "path") return createTrainingLearningPath({ title: values.title, description: values.description, objective: values.objective, targetAudience: values.targetAudience, isPublished: true });
    if (kind === "course" && selected) return addTrainingPathCourse(selected.id, { courseId: values.courseId, prerequisiteCourseId: values.prerequisiteCourseId === "NONE" ? undefined : values.prerequisiteCourseId, sortOrder: selected.pathCourses.length, isRequired: values.required !== "false", unlockAfterDays: values.unlockAfterDays ? Number(values.unlockAfterDays) : undefined });
    const targetType = values.targetType || "PATH";
    const templateId = values.templateId || initialTemplateId || "ANY"; return createTrainingOnboardingRule({ name: values.name, onboardingTemplateId: templateId === "ANY" ? undefined : templateId, branchId: values.branchScope === "CURRENT" ? branchId : undefined, curriculumId: targetType === "PATH" ? values.pathId : undefined, courseId: targetType === "COURSE" ? values.courseId : undefined, jobTitlePattern: values.jobTitlePattern || undefined, roleCode: values.roleCode || undefined, dueDays: Number(values.dueDays || 30), isRequired: true });
  }, onSuccess });
  return <Dialog open={Boolean(kind)} onOpenChange={open => !open && onClose()}><DialogContent><DialogHeader><DialogTitle>{kind === "path" ? "Nueva ruta de aprendizaje" : kind === "course" ? "Agregar curso a la ruta" : "Nueva regla de incorporación"}</DialogTitle><DialogDescription>La configuración se aplica con permisos, trazabilidad y fechas límite reales.</DialogDescription></DialogHeader><div className="space-y-4">
    {kind === "path" ? <><Field label="Título" value={values.title} onChange={value => set("title", value)} /><Field label="Descripción" value={values.description} onChange={value => set("description", value)} /><Field label="Objetivo" value={values.objective} onChange={value => set("objective", value)} /><Field label="Audiencia objetivo" value={values.targetAudience} onChange={value => set("targetAudience", value)} /></> : null}
    {kind === "course" ? <><Choice label="Curso publicado" value={values.courseId} onChange={value => set("courseId", value)} options={courses.map(course => ({ value: course.id, label: course.title }))} /><Choice label="Prerrequisito" value={values.prerequisiteCourseId} onChange={value => set("prerequisiteCourseId", value)} options={[{ value: "NONE", label: "Sin prerrequisito" }, ...(selected?.pathCourses.map(entry => ({ value: entry.courseId, label: entry.course.title })) ?? [])]} /><Field label="Habilitar después de días" value={values.unlockAfterDays} onChange={value => set("unlockAfterDays", value)} type="number" /></> : null}
    {kind === "rule" ? <><Field label="Nombre de la regla" value={values.name} onChange={value => set("name", value)} /><Choice label="Plantilla de incorporación" value={values.templateId || initialTemplateId || "ANY"} onChange={value => set("templateId", value)} options={[{ value: "ANY", label: "Cualquier plantilla" }, ...templates.map(template => ({ value: template.id, label: `${template.name} v${template.version}` }))]} />{branchId ? <Choice label="Alcance de sucursal" value={values.branchScope || "ANY"} onChange={value => set("branchScope", value)} options={[{ value: "ANY", label: "Todas las sucursales permitidas" }, { value: "CURRENT", label: "Solo la sucursal activa" }]} /> : null}<Choice label="Asignar" value={values.targetType || "PATH"} onChange={value => set("targetType", value)} options={[{ value: "PATH", label: "Ruta de aprendizaje" }, { value: "COURSE", label: "Curso individual" }]} />{values.targetType === "COURSE" ? <Choice label="Curso" value={values.courseId} onChange={value => set("courseId", value)} options={courses.map(course => ({ value: course.id, label: course.title }))} /> : <Choice label="Ruta" value={values.pathId} onChange={value => set("pathId", value)} options={paths.map(path => ({ value: path.id, label: path.title }))} />}<Field label="Puesto contiene (opcional)" value={values.jobTitlePattern} onChange={value => set("jobTitlePattern", value)} /><Field label="Código de rol (opcional)" value={values.roleCode} onChange={value => set("roleCode", value)} /><Field label="Días para completar" value={values.dueDays || "30"} onChange={value => set("dueDays", value)} type="number" /></> : null}
    {mutation.isError ? <p role="alert" className="text-sm text-status-danger">No fue posible guardar la configuración. Revisa los campos y vuelve a intentarlo.</p> : null}<Button className="w-full" disabled={mutation.isPending || (kind === "path" && !values.title) || (kind === "course" && !values.courseId) || (kind === "rule" && (!values.name || (!(values.targetType === "COURSE" ? values.courseId : values.pathId))))} onClick={() => mutation.mutate()}>{mutation.isPending ? "Guardando…" : "Guardar configuración"}</Button>
  </div></DialogContent></Dialog>;
}

function Field({ label, value = "", onChange, type = "text" }: { label: string; value?: string; onChange: (value: string) => void; type?: string }) { const id = label.toLowerCase().replaceAll(" ", "-"); return <div><Label htmlFor={id}>{label}</Label><Input id={id} type={type} value={value} onChange={event => onChange(event.target.value)} /></div>; }
function Choice({ label, value = "", onChange, options }: { label: string; value?: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) { return <div><Label>{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger><SelectContent>{options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>; }
