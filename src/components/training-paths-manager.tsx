"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, Plus, ShieldCheck, Trash2 } from "lucide-react";
import {
  addTrainingPathCourse,
  createTrainingLearningPath,
  createTrainingOnboardingRule,
  deleteTrainingOnboardingRule,
  fetchOnboardingTemplates,
  fetchTrainingCourses,
  fetchTrainingLearningPaths,
  fetchTrainingOnboardingRules,
  getApiErrorMessage,
  removeTrainingPathCourse,
} from "@/lib/backend";
import type { TrainingLearningPathDto } from "@/lib/contracts";
import { useAppStore } from "@/store/app-store";
import {
  EmptyState,
  ErrorState,
  InlineNote,
  Metric,
  MetricRow,
  PageHeader,
  PageSection,
  SkeletonRows,
  StatusBadge,
} from "@/components/system";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * Rutas de aprendizaje y asignación automática desde la incorporación.
 *
 * Qué cambió
 * ----------
 * · El aviso de preselección decía «Configura la formación para el expediente
 *   9c2f-…»: el identificador del expediente de incorporación, en crudo, en
 *   texto visible. Ahora se nombra la plantilla, que es lo que la persona
 *   reconoce; el identificador sigue viajando en la URL y en la petición.
 * · El encabezado tenía dos acciones del mismo peso —«Regla de incorporación»
 *   y «Nueva ruta»— sin decir cuál es el siguiente paso.
 * · Los estados vacíos eran avisos informativos sin salida: decían que no hay
 *   nada, pero no ofrecían crear lo que falta.
 * · El error del diálogo era una frase genérica —«Revisa los campos»— que no
 *   nombraba ningún campo ni mostraba lo que respondió el servidor.
 * · Quitar un curso de la ruta y borrar una regla se ejecutaban al primer clic,
 *   sin confirmación, siendo acciones destructivas.
 * · Cargar reemplazaba la lista por un aro girando.
 *
 * El contrato del backend no cambia: los mismos endpoints y los mismos campos.
 */

export function TrainingPathsManager() {
  const searchParams = useSearchParams();
  const requestedFlowId = searchParams.get("flowId") ?? "";
  const requestedTemplateId = searchParams.get("templateId") ?? "";
  const queryClient = useQueryClient();
  const { currentBranch } = useAppStore();

  const [selectedId, setSelectedId] = useState("");
  const [dialog, setDialog] = useState<"path" | "course" | "rule" | null>(() => (requestedFlowId ? "rule" : null));
  const [pendingRemoval, setPendingRemoval] = useState<{ courseId: string; title: string } | null>(null);
  const [pendingRuleRemoval, setPendingRuleRemoval] = useState<{ id: string; name: string } | null>(null);

  const paths = useQuery({ queryKey: ["training-learning-paths"], queryFn: fetchTrainingLearningPaths });
  const rules = useQuery({ queryKey: ["training-onboarding-rules"], queryFn: fetchTrainingOnboardingRules });
  const courses = useQuery({
    queryKey: ["training-published-courses"],
    queryFn: () => fetchTrainingCourses({ page: 1, pageSize: 100, status: "PUBLISHED" }),
  });
  const templates = useQuery({ queryKey: ["onboarding-templates"], queryFn: fetchOnboardingTemplates });

  const selected = useMemo(
    () => paths.data?.find((path) => path.id === selectedId) ?? paths.data?.[0] ?? null,
    [paths.data, selectedId],
  );

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["training-learning-paths"] }),
      queryClient.invalidateQueries({ queryKey: ["training-onboarding-rules"] }),
    ]);

  const removeCourse = useMutation({
    mutationFn: (courseId: string) => removeTrainingPathCourse(selected!.id, courseId),
    onSuccess: async () => {
      setPendingRemoval(null);
      await refresh();
    },
  });

  const removeRule = useMutation({
    mutationFn: (id: string) => deleteTrainingOnboardingRule(id),
    onSuccess: async () => {
      setPendingRuleRemoval(null);
      await refresh();
    },
  });

  // La plantilla es lo que la persona reconoce; el identificador del
  // expediente no significa nada fuera de la base de datos.
  const preselectedTemplate = templates.data?.find((template) => template.id === requestedTemplateId);

  const rulesPanel = (
    <Rules
      rules={rules.data ?? []}
      loading={rules.isLoading}
      error={rules.error}
      onRetry={() => void rules.refetch()}
      onCreate={() => setDialog("rule")}
      onDelete={(id, name) => setPendingRuleRemoval({ id, name })}
      deleting={removeRule.isPending ? pendingRuleRemoval?.id : undefined}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Aprendizaje"
        title="Rutas y automatización"
        description="Ordena cursos con prerrequisitos y asigna formación automáticamente desde la incorporación."
        actions={
          <Button onClick={() => setDialog("path")}>
            <Plus className="size-4" aria-hidden="true" />
            Nueva ruta
          </Button>
        }
      />

      {requestedFlowId ? (
        <InlineNote tone="info" title="Incorporación preseleccionada">
          {preselectedTemplate
            ? `La regla que crees quedará ligada a la plantilla «${preselectedTemplate.name}» (versión ${preselectedTemplate.version}).`
            : "La regla que crees quedará ligada a la plantilla de incorporación desde la que llegaste."}
        </InlineNote>
      ) : null}

      {paths.isLoading ? (
        <SkeletonRows rows={5} label="Cargando las rutas formativas" />
      ) : paths.isError ? (
        <ErrorState
          title="No fue posible cargar las rutas"
          detail={getApiErrorMessage(paths.error, "Reintenta la consulta para continuar.")}
          onRetry={() => void paths.refetch()}
        />
      ) : !paths.data?.length ? (
        <>
          <EmptyState
            reason="no-records"
            title="Todavía no hay rutas de aprendizaje"
            description="Una ruta ordena varios cursos publicados con sus prerrequisitos, para que cada persona los haga en el orden correcto."
            action={
              <Button onClick={() => setDialog("path")}>
                <Plus className="size-4" aria-hidden="true" />
                Crear la primera ruta
              </Button>
            }
          />
          {rulesPanel}
        </>
      ) : (
        <>
          <PathSummary paths={paths.data} rules={rules.data?.length ?? 0} />

          {selected ? (
            <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
              <PageSection title="Rutas disponibles">
                <ul className="space-y-2">
                  {paths.data.map((path) => {
                    const active = path.id === selected.id;
                    return (
                      <li key={path.id}>
                        <button
                          type="button"
                          aria-current={active ? "true" : undefined}
                          onClick={() => setSelectedId(path.id)}
                          className={`w-full rounded-md border p-4 text-left transition-colors ${
                            active
                              ? "border-accent-line/50 bg-accent-fill/10"
                              : "border-line bg-surface-1 hover:border-line-strong"
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate font-medium text-ink-1">{path.title}</p>
                              <p className="font-mono text-2xs text-ink-3 tabular-figures">
                                {path.pathCourses.length}{" "}
                                {path.pathCourses.length === 1 ? "curso" : "cursos"} ·{" "}
                                {path._count.assignments}{" "}
                                {path._count.assignments === 1 ? "asignación" : "asignaciones"}
                              </p>
                            </div>
                            <StatusBadge
                              size="sm"
                              tone={path.isPublished ? "success" : "neutral"}
                              label={path.isPublished ? "Publicada" : "Borrador"}
                            />
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </PageSection>

              <div className="space-y-5">
                <PageSection
                  title={selected.title}
                  description={selected.description || "Sin descripción"}
                  boxed
                  actions={
                    <Button size="sm" onClick={() => setDialog("course")}>
                      <Plus className="size-4" aria-hidden="true" />
                      Agregar curso
                    </Button>
                  }
                >
                  {removeCourse.error ? (
                    <InlineNote tone="danger" title="No se pudo quitar el curso">
                      {getApiErrorMessage(removeCourse.error, "El servidor rechazó la operación.")}
                    </InlineNote>
                  ) : null}

                  {!selected.pathCourses.length ? (
                    <EmptyState
                      reason="no-records"
                      title="Esta ruta todavía está vacía"
                      description="Agrega el primer curso publicado para definir por dónde empieza."
                      action={
                        <Button variant="secondary" onClick={() => setDialog("course")}>
                          Agregar el primer curso
                        </Button>
                      }
                    />
                  ) : (
                    <ol className="space-y-3">
                      {selected.pathCourses.map((entry, index) => (
                        <li key={entry.id} className="flex items-start gap-4 rounded-md border border-line p-4">
                          <span
                            aria-hidden="true"
                            className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line bg-surface-2 font-mono text-xs tabular-figures text-ink-2"
                          >
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium text-ink-1">{entry.course.title}</p>
                              {entry.isRequired ? <StatusBadge size="sm" tone="info" label="Obligatorio" /> : null}
                            </div>
                            <p className="mt-1 text-sm text-ink-2">
                              {entry.prerequisiteCourse
                                ? `Requiere completar antes: ${entry.prerequisiteCourse.title}`
                                : "Disponible desde el primer día"}
                              {entry.unlockAfterDays
                                ? ` · se habilita ${entry.unlockAfterDays} días después`
                                : ""}
                            </p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Quitar ${entry.course.title} de la ruta`}
                            onClick={() => setPendingRemoval({ courseId: entry.courseId, title: entry.course.title })}
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </Button>
                        </li>
                      ))}
                    </ol>
                  )}
                </PageSection>

                {rulesPanel}
              </div>
            </div>
          ) : (
            rulesPanel
          )}
        </>
      )}

      <PathDialog
        kind={dialog}
        selected={selected}
        paths={paths.data ?? []}
        courses={courses.data?.items ?? []}
        templates={templates.data ?? []}
        branchId={currentBranch?.id}
        initialTemplateId={requestedTemplateId}
        onClose={() => setDialog(null)}
        onSuccess={async () => {
          await refresh();
          setDialog(null);
        }}
      />

      {/* Quitar un curso de la ruta cambia el orden formativo de quien ya la
          tiene asignada: se pregunta antes, en vez de ejecutarlo al primer
          clic como hacía la papelera. */}
      <Dialog open={Boolean(pendingRemoval)} onOpenChange={(open) => !open && setPendingRemoval(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Quitar «{pendingRemoval?.title}» de la ruta?</DialogTitle>
            <DialogDescription>
              Deja de formar parte de la secuencia. Las personas que ya lo completaron conservan su avance; a las que
              no lo hayan empezado dejará de exigírseles dentro de esta ruta.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setPendingRemoval(null)}>
              Conservarlo
            </Button>
            <Button
              variant="destructive"
              loading={removeCourse.isPending}
              loadingLabel="Quitando…"
              onClick={() => pendingRemoval && removeCourse.mutate(pendingRemoval.courseId)}
            >
              Quitar de la ruta
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(pendingRuleRemoval)} onOpenChange={(open) => !open && setPendingRuleRemoval(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar la regla «{pendingRuleRemoval?.name}»?</DialogTitle>
            <DialogDescription>
              Las próximas incorporaciones dejarán de recibir esta formación automáticamente. Las asignaciones que la
              regla ya creó se conservan.
            </DialogDescription>
          </DialogHeader>
          {removeRule.error ? (
            <InlineNote tone="danger" title="No se pudo eliminar la regla">
              {getApiErrorMessage(removeRule.error, "El servidor rechazó la operación.")}
            </InlineNote>
          ) : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setPendingRuleRemoval(null)}>
              Conservarla
            </Button>
            <Button
              variant="destructive"
              loading={removeRule.isPending}
              loadingLabel="Eliminando…"
              onClick={() => pendingRuleRemoval && removeRule.mutate(pendingRuleRemoval.id)}
            >
              Eliminar la regla
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PathSummary({ paths, rules }: { paths: TrainingLearningPathDto[]; rules: number }) {
  const published = paths.filter((path) => path.isPublished).length;
  const courses = paths.reduce((total, path) => total + path.pathCourses.length, 0);
  const assignments = paths.reduce((total, path) => total + path._count.assignments, 0);

  return (
    <MetricRow>
      <Metric label="Rutas" value={String(paths.length)} />
      <Metric label="Publicadas" value={String(published)} detail={`de ${paths.length}`} />
      <Metric label="Cursos incluidos" value={String(courses)} />
      <Metric
        label="Asignaciones"
        value={String(assignments)}
        detail={`${rules} ${rules === 1 ? "regla automática" : "reglas automáticas"}`}
      />
    </MetricRow>
  );
}

function Rules({
  rules,
  loading,
  error,
  onRetry,
  onCreate,
  onDelete,
  deleting,
}: {
  rules: Array<{
    id: string;
    name: string;
    dueDays: number;
    isRequired: boolean;
    onboardingTemplate?: { name: string; version: number } | null;
    curriculum?: { title: string } | null;
    course?: { title: string } | null;
    jobTitlePattern?: string | null;
    roleCode?: string | null;
  }>;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  onCreate: () => void;
  onDelete: (id: string, name: string) => void;
  deleting?: string;
}) {
  return (
    <PageSection
      title="Asignación automática desde la incorporación"
      description="Cada regla conecta una plantilla de incorporación con un curso o una ruta."
      boxed
      actions={
        <Button size="sm" variant="secondary" onClick={onCreate}>
          <Link2 className="size-4" aria-hidden="true" />
          Nueva regla
        </Button>
      }
    >
      {loading ? (
        <SkeletonRows rows={3} label="Cargando las reglas de incorporación" />
      ) : error ? (
        <ErrorState
          title="No fue posible cargar las reglas"
          detail={getApiErrorMessage(error, "Reintenta la consulta para continuar.")}
          onRetry={onRetry}
        />
      ) : !rules.length ? (
        <EmptyState
          reason="no-records"
          title="Sin reglas automáticas"
          description="Con una regla, cada persona que se incorpora recibe su formación sin que nadie tenga que asignarla a mano."
          action={
            <Button variant="secondary" onClick={onCreate}>
              Crear la primera regla
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-line">
          {rules.map((rule) => (
            <li key={rule.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
              <ShieldCheck className="size-5 shrink-0 text-ink-3" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink-1">{rule.name}</p>
                <p className="text-sm text-ink-2">
                  {rule.curriculum?.title || rule.course?.title || "Sin destino definido"} · vence a los{" "}
                  {rule.dueDays} días ·{" "}
                  {rule.onboardingTemplate
                    ? `plantilla ${rule.onboardingTemplate.name} v${rule.onboardingTemplate.version}`
                    : "cualquier plantilla"}
                  {rule.jobTitlePattern ? ` · puesto: ${rule.jobTitlePattern}` : ""}
                  {rule.roleCode ? ` · rol: ${rule.roleCode}` : ""}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                disabled={deleting === rule.id}
                aria-label={`Eliminar la regla ${rule.name}`}
                onClick={() => onDelete(rule.id, rule.name)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </PageSection>
  );
}

function PathDialog({
  kind,
  selected,
  paths,
  courses,
  templates,
  branchId,
  initialTemplateId,
  onClose,
  onSuccess,
}: {
  kind: string | null;
  selected: TrainingLearningPathDto | null;
  paths: TrainingLearningPathDto[];
  courses: Array<{ id: string; title: string }>;
  templates: Array<{ id: string; name: string; version: number }>;
  branchId?: string;
  initialTemplateId?: string;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const set = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }));

  const mutation = useMutation({
    mutationFn: () => {
      if (kind === "path") {
        return createTrainingLearningPath({
          title: values.title,
          description: values.description,
          objective: values.objective,
          targetAudience: values.targetAudience,
          isPublished: true,
        });
      }
      if (kind === "course" && selected) {
        return addTrainingPathCourse(selected.id, {
          courseId: values.courseId,
          prerequisiteCourseId:
            values.prerequisiteCourseId === "NONE" ? undefined : values.prerequisiteCourseId,
          sortOrder: selected.pathCourses.length,
          isRequired: values.required !== "false",
          unlockAfterDays: values.unlockAfterDays ? Number(values.unlockAfterDays) : undefined,
        });
      }
      const targetType = values.targetType || "PATH";
      const templateId = values.templateId || initialTemplateId || "ANY";
      return createTrainingOnboardingRule({
        name: values.name,
        onboardingTemplateId: templateId === "ANY" ? undefined : templateId,
        branchId: values.branchScope === "CURRENT" ? branchId : undefined,
        curriculumId: targetType === "PATH" ? values.pathId : undefined,
        courseId: targetType === "COURSE" ? values.courseId : undefined,
        jobTitlePattern: values.jobTitlePattern || undefined,
        roleCode: values.roleCode || undefined,
        dueDays: Number(values.dueDays || 30),
        isRequired: true,
      });
    },
    onSuccess,
  });

  // El botón se apaga cuando falta algo obligatorio, pero apagarlo sin decir
  // qué falta deja a la persona adivinando: la lista se muestra.
  const missing: string[] = [];
  if (kind === "path" && !values.title) missing.push("el título de la ruta");
  if (kind === "course" && !values.courseId) missing.push("el curso");
  if (kind === "rule") {
    if (!values.name) missing.push("el nombre de la regla");
    const targetType = values.targetType || "PATH";
    if (targetType === "COURSE" && !values.courseId) missing.push("el curso a asignar");
    if (targetType === "PATH" && !values.pathId) missing.push("la ruta a asignar");
  }

  return (
    <Dialog open={Boolean(kind)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {kind === "path"
              ? "Nueva ruta de aprendizaje"
              : kind === "course"
                ? "Agregar curso a la ruta"
                : "Nueva regla de incorporación"}
          </DialogTitle>
          <DialogDescription>
            La configuración se aplica respetando permisos, trazabilidad y fechas límite reales.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {kind === "path" ? (
            <>
              <Field label="Título" value={values.title} onChange={(value) => set("title", value)} />
              <Field label="Descripción" value={values.description} onChange={(value) => set("description", value)} />
              <Field label="Objetivo" value={values.objective} onChange={(value) => set("objective", value)} />
              <Field
                label="Audiencia objetivo"
                value={values.targetAudience}
                onChange={(value) => set("targetAudience", value)}
              />
            </>
          ) : null}

          {kind === "course" ? (
            <>
              <Choice
                label="Curso publicado"
                value={values.courseId}
                onChange={(value) => set("courseId", value)}
                options={courses.map((course) => ({ value: course.id, label: course.title }))}
              />
              <Choice
                label="Prerrequisito"
                value={values.prerequisiteCourseId}
                onChange={(value) => set("prerequisiteCourseId", value)}
                options={[
                  { value: "NONE", label: "Sin prerrequisito" },
                  ...(selected?.pathCourses.map((entry) => ({
                    value: entry.courseId,
                    label: entry.course.title,
                  })) ?? []),
                ]}
              />
              <Field
                label="Habilitar después de días"
                value={values.unlockAfterDays}
                onChange={(value) => set("unlockAfterDays", value)}
                type="number"
              />
            </>
          ) : null}

          {kind === "rule" ? (
            <>
              <Field label="Nombre de la regla" value={values.name} onChange={(value) => set("name", value)} />
              <Choice
                label="Plantilla de incorporación"
                value={values.templateId || initialTemplateId || "ANY"}
                onChange={(value) => set("templateId", value)}
                options={[
                  { value: "ANY", label: "Cualquier plantilla" },
                  ...templates.map((template) => ({
                    value: template.id,
                    label: `${template.name} v${template.version}`,
                  })),
                ]}
              />
              {branchId ? (
                <Choice
                  label="Alcance de sucursal"
                  value={values.branchScope || "ANY"}
                  onChange={(value) => set("branchScope", value)}
                  options={[
                    { value: "ANY", label: "Todas las sucursales permitidas" },
                    { value: "CURRENT", label: "Solo la sucursal activa" },
                  ]}
                />
              ) : null}
              <Choice
                label="Asignar"
                value={values.targetType || "PATH"}
                onChange={(value) => set("targetType", value)}
                options={[
                  { value: "PATH", label: "Ruta de aprendizaje" },
                  { value: "COURSE", label: "Curso individual" },
                ]}
              />
              {values.targetType === "COURSE" ? (
                <Choice
                  label="Curso"
                  value={values.courseId}
                  onChange={(value) => set("courseId", value)}
                  options={courses.map((course) => ({ value: course.id, label: course.title }))}
                />
              ) : (
                <Choice
                  label="Ruta"
                  value={values.pathId}
                  onChange={(value) => set("pathId", value)}
                  options={paths.map((path) => ({ value: path.id, label: path.title }))}
                />
              )}
              <Field
                label="Puesto contiene (opcional)"
                value={values.jobTitlePattern}
                onChange={(value) => set("jobTitlePattern", value)}
              />
              <Field
                label="Código de rol (opcional)"
                value={values.roleCode}
                onChange={(value) => set("roleCode", value)}
              />
              <Field
                label="Días para completar"
                value={values.dueDays || "30"}
                onChange={(value) => set("dueDays", value)}
                type="number"
              />
            </>
          ) : null}

          {mutation.isError ? (
            <InlineNote tone="danger" title="No se pudo guardar la configuración">
              {getApiErrorMessage(mutation.error, "El servidor rechazó la configuración.")}
            </InlineNote>
          ) : null}

          {missing.length ? (
            <p className="text-sm text-ink-2">
              Falta {missing.length === 1 ? missing[0] : `${missing.slice(0, -1).join(", ")} y ${missing.at(-1)}`}.
            </p>
          ) : null}

          <Button
            className="w-full"
            disabled={missing.length > 0}
            loading={mutation.isPending}
            loadingLabel="Guardando…"
            onClick={() => mutation.mutate()}
          >
            Guardar configuración
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value = "",
  onChange,
  type = "text",
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  const id = label.toLowerCase().replaceAll(" ", "-").replaceAll("(", "").replaceAll(")", "");
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function Choice({
  label,
  value = "",
  onChange,
  options,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  const id = label.toLowerCase().replaceAll(" ", "-");
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder="Seleccionar" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
