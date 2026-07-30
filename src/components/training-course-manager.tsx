"use client";

import {
  Archive,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CirclePause,
  Copy,
  Eye,
  FileText,
  Link2,
  Pencil,
  Plus,
  Send,
  Trash2,
  Video,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { AsyncState } from "@/components/async-state";
import { ConfirmDeleteDialog, FormDialog } from "@/components/admin-crud";
import {
  ActionBar,
  InlineFeedback,
  PageHeader,
  Pagination,
  ResponsiveDataView,
} from "@/components/design-system";
import { FormErrorSummary } from "@/components/form-error-summary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  createTrainingCategory,
  createTrainingContentBlock,
  createTrainingCourse,
  createTrainingCourseModule,
  createTrainingLesson,
  deleteTrainingContentBlock,
  deleteTrainingCourse,
  deleteTrainingCourseModule,
  deleteTrainingLesson,
  duplicateTrainingCourse,
  fetchTrainingCategories,
  fetchTrainingCourse,
  fetchTrainingCoursePreview,
  fetchTrainingCourses,
  getApiErrorMessage,
  transitionTrainingCourse,
  updateTrainingContentBlock,
  updateTrainingCourse,
  updateTrainingCourseModule,
  updateTrainingLesson,
} from "@/lib/backend";
import type {
  TrainingContentBlockDto,
  TrainingContentBlockType,
  TrainingCourseDto,
  TrainingCourseInput,
  TrainingCourseStatus,
} from "@/lib/contracts";
import { useAppStore } from "@/store/app-store";

const statusLabels: Record<TrainingCourseStatus, string> = {
  DRAFT: "Borrador",
  IN_REVIEW: "En revisión",
  APPROVED: "Aprobado",
  SCHEDULED: "Programado",
  PUBLISHED: "Publicado",
  PAUSED: "Pausado",
  ARCHIVED: "Archivado",
  RETIRED: "Retirado",
};

const statusTones: Record<TrainingCourseStatus, "default" | "success" | "warning" | "destructive"> = {
  DRAFT: "default",
  IN_REVIEW: "default",
  APPROVED: "success",
  SCHEDULED: "default",
  PUBLISHED: "success",
  PAUSED: "warning",
  ARCHIVED: "default",
  RETIRED: "destructive",
};

const blockLabels: Record<TrainingContentBlockType, string> = {
  RICH_TEXT: "Texto",
  VIDEO: "Video",
  FILE: "Archivo",
  LINK: "Enlace",
  QUIZ: "Cuestionario",
  TASK: "Tarea",
};

const emptyCourse: TrainingCourseInput = {
  title: "",
  summary: "",
  description: "",
  difficulty: "BEGINNER",
  estimatedMinutes: 0,
  language: "es",
  tags: [],
  scope: "TENANT",
};

function formatDate(value?: string | null) {
  return value
    ? new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    : "Sin fecha";
}

function CourseStatusBadge({ status }: { status: TrainingCourseStatus }) {
  return <Badge variant={statusTones[status]}>{statusLabels[status]}</Badge>;
}

export function TrainingCourseManager() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { can, currentRole } = useAppStore();
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const scope = (searchParams.get("scope") ?? "") as "" | "TENANT" | "GLOBAL";
  const categoryId = searchParams.get("category") ?? "";
  const [createOpen, setCreateOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [editorId, setEditorId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TrainingCourseDto | null>(null);

  const coursesQuery = useQuery({
    queryKey: ["training-admin-courses", page, search, status, scope, categoryId],
    queryFn: () =>
      fetchTrainingCourses({
        page,
        pageSize: 20,
        search: search || undefined,
        status: status || undefined,
        scope: scope || undefined,
        categoryId: categoryId || undefined,
      }),
  });
  const categoriesQuery = useQuery({
    queryKey: ["training-categories"],
    queryFn: fetchTrainingCategories,
  });
  const deleteMutation = useMutation({
    mutationFn: deleteTrainingCourse,
    onSuccess: async () => {
      setDeleteTarget(null);
      toast.success("Curso eliminado");
      await queryClient.invalidateQueries({ queryKey: ["training-admin-courses"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible eliminar el curso.")),
  });

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  const canCreate = can("courses.create");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Aprendizaje"
        title="Gestión de cursos"
        description="Diseña, revisa y publica experiencias formativas con trazabilidad editorial."
        actions={
          canCreate ? (
            <>
              <Button type="button" variant="secondary" onClick={() => setCategoryOpen(true)}>
                <Plus className="size-4" aria-hidden="true" />
                Categoría
              </Button>
              <Button type="button" onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" aria-hidden="true" />
                Nuevo curso
              </Button>
            </>
          ) : undefined
        }
      />

      <Card level={2}>
        <CardContent className="grid gap-3 p-4 lg:grid-cols-[minmax(240px,1fr)_repeat(3,minmax(150px,220px))]">
          <div className="space-y-2">
            <Label htmlFor="course-search">Buscar</Label>
            <Input
              id="course-search"
              type="search"
              placeholder="Título, resumen o identificador"
              value={search}
              onChange={(event) => setFilter("search", event.target.value)}
            />
          </div>
          <FilterSelect
            label="Estado"
            value={status || "ALL"}
            onValueChange={(value) => setFilter("status", value === "ALL" ? "" : value)}
            options={[
              { value: "ALL", label: "Todos" },
              ...Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
            ]}
          />
          <FilterSelect
            label="Alcance"
            value={scope || "ALL"}
            onValueChange={(value) => setFilter("scope", value === "ALL" ? "" : value)}
            options={[
              { value: "ALL", label: "Todos" },
              { value: "TENANT", label: "Empresa" },
              { value: "GLOBAL", label: "Global" },
            ]}
          />
          <FilterSelect
            label="Categoría"
            value={categoryId || "ALL"}
            onValueChange={(value) => setFilter("category", value === "ALL" ? "" : value)}
            options={[
              { value: "ALL", label: "Todas" },
              ...(categoriesQuery.data ?? []).map((category) => ({
                value: category.id,
                label: category.name,
              })),
            ]}
          />
        </CardContent>
      </Card>

      {coursesQuery.isLoading ? <AsyncState state="loading" title="Cargando cursos" /> : null}
      {coursesQuery.isError ? (
        <AsyncState
          state="error"
          title="No fue posible cargar los cursos"
          description={getApiErrorMessage(coursesQuery.error, "Reintenta la consulta.")}
          onRetry={() => void coursesQuery.refetch()}
        />
      ) : null}
      {coursesQuery.data ? (
        <div className="space-y-4">
          <ResponsiveDataView
            data={coursesQuery.data.items}
            getKey={(course) => course.id}
            empty={
              <InlineFeedback tone="info" title="No hay cursos">
                Ajusta los filtros o crea el primer curso autorizado.
              </InlineFeedback>
            }
            desktop={
              <CourseTable
                courses={coursesQuery.data.items}
                canEdit={can("courses.update")}
                canDelete={can("courses.delete")}
                canDuplicate={canCreate}
                onEdit={setEditorId}
                onPreview={setPreviewId}
                onDelete={setDeleteTarget}
              />
            }
            mobile={(course) => (
              <CourseCard
                course={course}
                canEdit={can("courses.update")}
                canDelete={can("courses.delete")}
                canDuplicate={canCreate}
                onEdit={setEditorId}
                onPreview={setPreviewId}
                onDelete={setDeleteTarget}
              />
            )}
          />
          <Pagination
            page={coursesQuery.data.page - 1}
            totalPages={Math.max(1, coursesQuery.data.totalPages)}
            totalItems={coursesQuery.data.total}
            pageSize={coursesQuery.data.pageSize}
            onPageChange={(nextPage) => setFilter("page", String(nextPage + 1))}
          />
        </div>
      ) : null}

      <CourseFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        categories={categoriesQuery.data ?? []}
        globalAllowed={currentRole === "admin_saas"}
        onSaved={(course) => {
          setCreateOpen(false);
          setEditorId(course.id);
          void queryClient.invalidateQueries({ queryKey: ["training-admin-courses"] });
        }}
      />
      <CategoryFormDialog
        open={categoryOpen}
        onOpenChange={setCategoryOpen}
        categories={categoriesQuery.data ?? []}
        globalAllowed={currentRole === "admin_saas"}
        onSaved={async () => {
          setCategoryOpen(false);
          await queryClient.invalidateQueries({ queryKey: ["training-categories"] });
        }}
      />
      <CourseEditorDialog
        courseId={editorId}
        open={Boolean(editorId)}
        onOpenChange={(open) => !open && setEditorId(null)}
      />
      <CoursePreviewDialog
        courseId={previewId}
        open={Boolean(previewId)}
        onOpenChange={(open) => !open && setPreviewId(null)}
      />
      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Eliminar curso"
        description={`Eliminarás “${deleteTarget?.title ?? ""}”. Solo es posible si no tiene asignaciones ni progreso.`}
        pending={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </div>
  );
}

function CategoryFormDialog({
  open,
  onOpenChange,
  categories,
  globalAllowed,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Array<{ id: string; name: string }>;
  globalAllowed: boolean;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentCategoryId, setParentCategoryId] = useState("NONE");
  const [scope, setScope] = useState<"TENANT" | "GLOBAL">("TENANT");
  const create = useMutation({
    mutationFn: () =>
      createTrainingCategory({
        name,
        description: description || undefined,
        parentCategoryId: parentCategoryId === "NONE" ? undefined : parentCategoryId,
        scope,
      }),
    onSuccess: async () => {
      toast.success("Categoría creada");
      setName("");
      setDescription("");
      setParentCategoryId("NONE");
      await onSaved();
    },
  });
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title="Nueva categoría" description="Agrupa cursos y crea subcategorías para facilitar su descubrimiento.">
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); if (name.trim()) create.mutate(); }}>
        <FormErrorSummary serverError={create.error} />
        <FormField id="category-name" label="Nombre" required>
          {(field) => <Input {...field} value={name} onChange={(event) => setName(event.target.value)} />}
        </FormField>
        <FormField id="category-description" label="Descripción">
          {(field) => <textarea {...field} className="min-h-24 w-full rounded-2xl border border-border-default bg-surface-elevated p-4" value={description} onChange={(event) => setDescription(event.target.value)} />}
        </FormField>
        <FormField id="category-parent" label="Categoría superior">
          {(field) => <Select value={parentCategoryId} onValueChange={setParentCategoryId}><SelectTrigger {...field}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="NONE">Categoría principal</SelectItem>{categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent></Select>}
        </FormField>
        {globalAllowed ? (
          <FormField id="category-scope" label="Alcance">
            {(field) => <Select value={scope} onValueChange={(value) => setScope(value as "TENANT" | "GLOBAL")}><SelectTrigger {...field}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TENANT">Empresa activa</SelectItem><SelectItem value="GLOBAL">Toda la plataforma</SelectItem></SelectContent></Select>}
          </FormField>
        ) : null}
        <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="submit" disabled={!name.trim() || create.isPending}>{create.isPending ? "Creando…" : "Crear categoría"}</Button></div>
      </form>
    </FormDialog>
  );
}

function FilterSelect({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger aria-label={label}><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

type CourseActionsProps = {
  course: TrainingCourseDto;
  canEdit: boolean;
  canDelete: boolean;
  canDuplicate: boolean;
  onEdit: (id: string) => void;
  onPreview: (id: string) => void;
  onDelete: (course: TrainingCourseDto) => void;
};

function CourseActions(props: CourseActionsProps) {
  const queryClient = useQueryClient();
  const duplicate = useMutation({
    mutationFn: () => duplicateTrainingCourse(props.course.id),
    onSuccess: async () => {
      toast.success("Curso duplicado como borrador");
      await queryClient.invalidateQueries({ queryKey: ["training-admin-courses"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible duplicar.")),
  });
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" variant="secondary" onClick={() => props.onPreview(props.course.id)}>
        <Eye className="size-4" />Vista previa
      </Button>
      {props.canEdit ? (
        <Button type="button" size="sm" variant="secondary" onClick={() => props.onEdit(props.course.id)}>
          <Pencil className="size-4" />Editar
        </Button>
      ) : null}
      {props.canDuplicate ? (
        <Button type="button" size="icon" variant="ghost" aria-label={`Duplicar ${props.course.title}`} disabled={duplicate.isPending} onClick={() => duplicate.mutate()}>
          <Copy className="size-4" />
        </Button>
      ) : null}
      {props.canDelete && ["DRAFT", "ARCHIVED"].includes(props.course.status) ? (
        <Button type="button" size="icon" variant="ghost" aria-label={`Eliminar ${props.course.title}`} onClick={() => props.onDelete(props.course)}>
          <Trash2 className="size-4 text-status-danger" />
        </Button>
      ) : null}
    </div>
  );
}

function CourseTable(props: Omit<CourseActionsProps, "course"> & { courses: TrainingCourseDto[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border-default">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-surface-section text-text-secondary">
          <tr>
            <th className="px-4 py-3">Curso</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Alcance</th>
            <th className="px-4 py-3">Estructura</th>
            <th className="px-4 py-3">Actualizado</th>
            <th className="px-4 py-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {props.courses.map((course) => (
            <tr key={course.id} className="border-t border-border-default align-top">
              <td className="px-4 py-4">
                <p className="font-semibold">{course.title}</p>
                <p className="mt-1 max-w-sm text-text-secondary">{course.summary || "Sin resumen"}</p>
              </td>
              <td className="px-4 py-4"><CourseStatusBadge status={course.status} /></td>
              <td className="px-4 py-4">{course.tenantId ? "Empresa" : "Global"}</td>
              <td className="px-4 py-4">{course._count?.modules ?? course.modules?.length ?? 0} módulos · v{course.version}</td>
              <td className="px-4 py-4">{formatDate(course.updatedAt)}</td>
              <td className="px-4 py-4"><CourseActions {...props} course={course} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CourseCard(props: CourseActionsProps) {
  const { course } = props;
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{course.title}</h2>
          <p className="mt-1 text-sm text-text-secondary">{course.summary || "Sin resumen"}</p>
        </div>
        <CourseStatusBadge status={course.status} />
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-text-secondary">Alcance</dt><dd>{course.tenantId ? "Empresa" : "Global"}</dd></div>
        <div><dt className="text-text-secondary">Versión</dt><dd>{course.version}</dd></div>
      </dl>
      <CourseActions {...props} />
    </div>
  );
}

function CourseFormDialog({
  open,
  onOpenChange,
  categories,
  globalAllowed,
  onSaved,
  course,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Array<{ id: string; name: string }>;
  globalAllowed: boolean;
  onSaved: (course: TrainingCourseDto) => void;
  course?: TrainingCourseDto;
}) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={course ? "Editar información del curso" : "Crear curso"}
      description="Define los datos que ayudarán a identificar y encontrar el contenido."
    >
      <CourseMetadataForm
        key={course?.id ?? "new-course"}
        course={course}
        categories={categories}
        globalAllowed={globalAllowed}
        onSaved={onSaved}
        onCancel={() => onOpenChange(false)}
      />
    </FormDialog>
  );
}

function CourseMetadataForm({
  course,
  categories,
  globalAllowed,
  onSaved,
  onCancel,
}: {
  course?: TrainingCourseDto;
  categories: Array<{ id: string; name: string }>;
  globalAllowed: boolean;
  onSaved: (course: TrainingCourseDto) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<TrainingCourseInput>(() =>
    course
      ? {
          title: course.title,
          slug: course.slug,
          summary: course.summary ?? "",
          description: course.description ?? "",
          categoryId: course.categoryId ?? undefined,
          coverImageUrl: course.coverImageUrl ?? "",
          introVideoUrl: course.introVideoUrl ?? "",
          difficulty: course.difficulty,
          estimatedMinutes: course.estimatedMinutes,
          language: course.language,
          tags: course.tags,
          scope: course.tenantId ? "TENANT" : "GLOBAL",
        }
      : emptyCourse,
  );
  const save = useMutation({
    mutationFn: () =>
      course ? updateTrainingCourse(course.id, form) : createTrainingCourse(form),
    onSuccess: (saved) => {
      toast.success(course ? "Información actualizada" : "Curso creado como borrador");
      onSaved(saved);
    },
  });
  const errors = [
    !form.title.trim() ? { fieldId: "course-title", label: "Título", message: "Es obligatorio." } : null,
  ].filter(Boolean) as Array<{ fieldId: string; label: string; message: string }>;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (errors.length) return;
    save.mutate();
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <FormErrorSummary errors={errors} serverError={save.error} />
      <FormField id="course-title" label="Título" required>
        {(field) => <Input {...field} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />}
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="course-category" label="Categoría">
          {(field) => <Select value={form.categoryId ?? "NONE"} onValueChange={(value) => setForm({ ...form, categoryId: value === "NONE" ? undefined : value })}>
            <SelectTrigger {...field}><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="NONE">Sin categoría</SelectItem>{categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent>
          </Select>}
        </FormField>
        <FormField id="course-difficulty" label="Dificultad">
          {(field) => <Select value={form.difficulty} onValueChange={(value) => setForm({ ...form, difficulty: value as TrainingCourseDto["difficulty"] })}>
            <SelectTrigger {...field}><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="BEGINNER">Inicial</SelectItem><SelectItem value="INTERMEDIATE">Intermedio</SelectItem><SelectItem value="ADVANCED">Avanzado</SelectItem></SelectContent>
          </Select>}
        </FormField>
      </div>
      <FormField id="course-summary" label="Resumen">
        {(field) => <textarea {...field} className="min-h-24 w-full rounded-2xl border border-border-default bg-surface-elevated p-4" value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} />}
      </FormField>
      <FormField id="course-description" label="Descripción">
        {(field) => <textarea {...field} className="min-h-32 w-full rounded-2xl border border-border-default bg-surface-elevated p-4" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />}
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="course-duration" label="Duración estimada (minutos)">
          {(field) => <Input {...field} type="number" min={0} value={form.estimatedMinutes} onChange={(event) => setForm({ ...form, estimatedMinutes: Number(event.target.value) })} />}
        </FormField>
        <FormField id="course-language" label="Idioma">
          {(field) => <Input {...field} value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })} />}
        </FormField>
      </div>
      <FormField id="course-cover" label="URL de portada">
        {(field) => <Input {...field} type="url" value={form.coverImageUrl} onChange={(event) => setForm({ ...form, coverImageUrl: event.target.value })} />}
      </FormField>
      <FormField id="course-tags" label="Etiquetas separadas por coma">
        {(field) => <Input {...field} value={form.tags?.join(", ")} onChange={(event) => setForm({ ...form, tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} />}
      </FormField>
      {globalAllowed && !course ? (
        <FormField id="course-scope" label="Alcance">
          {(field) => <Select value={form.scope} onValueChange={(value) => setForm({ ...form, scope: value as "TENANT" | "GLOBAL" })}>
            <SelectTrigger {...field}><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="TENANT">Empresa activa</SelectItem><SelectItem value="GLOBAL">Toda la plataforma</SelectItem></SelectContent>
          </Select>}
        </FormField>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={save.isPending || Boolean(errors.length)}>{save.isPending ? "Guardando…" : "Guardar"}</Button>
      </div>
    </form>
  );
}

function CourseEditorDialog({ courseId, open, onOpenChange }: { courseId: string | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const { can, currentRole } = useAppStore();
  const [metadataOpen, setMetadataOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const query = useQuery({
    queryKey: ["training-course", courseId],
    queryFn: () => fetchTrainingCourse(courseId!),
    enabled: Boolean(courseId && open),
  });
  const categories = useQuery({ queryKey: ["training-categories"], queryFn: fetchTrainingCategories, enabled: open });
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["training-course", courseId] });
    await queryClient.invalidateQueries({ queryKey: ["training-admin-courses"] });
  };
  const transition = useMutation({
    mutationFn: ({ action, input }: { action: Parameters<typeof transitionTrainingCourse>[1]; input?: Parameters<typeof transitionTrainingCourse>[2] }) =>
      transitionTrainingCourse(courseId!, action, input),
    onSuccess: async (course) => {
      toast.success(`Curso: ${statusLabels[course.status]}`);
      await refresh();
      setScheduleOpen(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible cambiar el estado.")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] max-w-6xl flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border-default p-6 pr-14">
          <DialogTitle>{query.data?.title ?? "Editor de curso"}</DialogTitle>
          <DialogDescription>Configura contenido, revisa la estructura y controla la publicación.</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {query.isLoading ? <AsyncState state="loading" /> : null}
          {query.isError ? <AsyncState state="error" onRetry={() => void query.refetch()} /> : null}
          {query.data ? (
            <div className="space-y-6">
              <EditorSummary course={query.data} />
              <WorkflowActions
                course={query.data}
                can={can}
                pending={transition.isPending}
                onTransition={(action) => action === "schedule" ? setScheduleOpen(true) : transition.mutate({ action })}
                onEdit={() => setMetadataOpen(true)}
              />
              <CourseStructure course={query.data} editable={can("courses.update")} onChanged={refresh} />
            </div>
          ) : null}
        </div>
      </DialogContent>
      {query.data ? (
        <CourseFormDialog
          open={metadataOpen}
          onOpenChange={setMetadataOpen}
          categories={categories.data ?? []}
          globalAllowed={currentRole === "admin_saas"}
          course={query.data}
          onSaved={async () => { setMetadataOpen(false); await refresh(); }}
        />
      ) : null}
      <ScheduleDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        pending={transition.isPending}
        onConfirm={(input) => transition.mutate({ action: "schedule", input })}
      />
    </Dialog>
  );
}

function EditorSummary({ course }: { course: TrainingCourseDto }) {
  const lessons = course.modules.reduce((total, module) => total + module.lessons.length, 0);
  const blocks = course.modules.reduce((total, module) => total + module.lessons.reduce((sum, lesson) => sum + lesson.blocks.length, 0), 0);
  return (
    <Card level={1}>
      <CardContent className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5">
        <Summary label="Estado"><CourseStatusBadge status={course.status} /></Summary>
        <Summary label="Alcance">{course.tenantId ? "Empresa" : "Global"}</Summary>
        <Summary label="Versión">{course.version}</Summary>
        <Summary label="Estructura">{course.modules.length} módulos · {lessons} lecciones</Summary>
        <Summary label="Contenido">{blocks} bloques</Summary>
      </CardContent>
    </Card>
  );
}

function Summary({ label, children }: { label: string; children: ReactNode }) {
  return <div><p className="text-xs font-medium uppercase tracking-wide text-text-secondary">{label}</p><div className="mt-2 font-medium">{children}</div></div>;
}

function WorkflowActions({
  course,
  can,
  pending,
  onTransition,
  onEdit,
}: {
  course: TrainingCourseDto;
  can: (permission: Parameters<ReturnType<typeof useAppStore>["can"]>[0]) => boolean;
  pending: boolean;
  onTransition: (action: Parameters<typeof transitionTrainingCourse>[1]) => void;
  onEdit: () => void;
}) {
  const actions: Array<{ status: TrainingCourseStatus[]; permission: Parameters<typeof can>[0]; action: Parameters<typeof onTransition>[0]; label: string; icon: ReactNode }> = [
    { status: ["DRAFT"], permission: "courses.review", action: "submit-review", label: "Enviar a revisión", icon: <Send className="size-4" /> },
    { status: ["IN_REVIEW"], permission: "courses.review", action: "return-draft", label: "Devolver a borrador", icon: <Pencil className="size-4" /> },
    { status: ["IN_REVIEW"], permission: "courses.approve", action: "approve", label: "Aprobar", icon: <CheckCircle2 className="size-4" /> },
    { status: ["APPROVED"], permission: "courses.publish", action: "schedule", label: "Programar", icon: <CalendarClock className="size-4" /> },
    { status: ["APPROVED", "PAUSED"], permission: "courses.publish", action: "publish", label: "Publicar", icon: <BookOpen className="size-4" /> },
    { status: ["PUBLISHED"], permission: "courses.publish", action: "pause", label: "Pausar", icon: <CirclePause className="size-4" /> },
    { status: ["DRAFT", "APPROVED", "SCHEDULED", "PUBLISHED", "PAUSED"], permission: "courses.archive", action: "archive", label: "Archivar", icon: <Archive className="size-4" /> },
    { status: ["PUBLISHED", "PAUSED", "ARCHIVED"], permission: "courses.archive", action: "retire", label: "Retirar", icon: <Archive className="size-4" /> },
  ];
  return (
    <ActionBar label="Flujo editorial">
      {can("courses.update") && ["DRAFT", "IN_REVIEW", "APPROVED", "PAUSED"].includes(course.status) ? (
        <Button type="button" variant="secondary" onClick={onEdit}><Pencil className="size-4" />Información</Button>
      ) : null}
      {actions.filter((item) => item.status.includes(course.status) && can(item.permission)).map((item) => (
        <Button key={item.action} type="button" variant={item.action === "archive" || item.action === "retire" ? "secondary" : "default"} disabled={pending} onClick={() => onTransition(item.action)}>
          {item.icon}{item.label}
        </Button>
      ))}
    </ActionBar>
  );
}

function CourseStructure({ course, editable, onChanged }: { course: TrainingCourseDto; editable: boolean; onChanged: () => Promise<void> }) {
  const [moduleTitle, setModuleTitle] = useState("");
  const createModule = useMutation({
    mutationFn: () => createTrainingCourseModule(course.id, { title: moduleTitle, sortOrder: course.modules.length }),
    onSuccess: async () => { setModuleTitle(""); toast.success("Módulo añadido"); await onChanged(); },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible añadir el módulo.")),
  });
  return (
    <section className="space-y-4" aria-labelledby="course-structure-title">
      <div>
        <h2 id="course-structure-title" className="text-xl font-semibold">Estructura del curso</h2>
        <p className="text-sm text-text-secondary">Organiza el aprendizaje en módulos, lecciones y bloques.</p>
      </div>
      {course.modules.length ? course.modules.map((module) => (
        <ModuleEditor key={module.id} module={module} editable={editable} onChanged={onChanged} />
      )) : <InlineFeedback tone="info" title="Sin módulos">Añade un módulo para comenzar a estructurar el curso.</InlineFeedback>}
      {editable ? (
        <form className="flex flex-col gap-2 rounded-2xl border border-dashed border-border-strong p-4 sm:flex-row" onSubmit={(event) => { event.preventDefault(); if (moduleTitle.trim()) createModule.mutate(); }}>
          <Input aria-label="Título del nuevo módulo" placeholder="Título del nuevo módulo" value={moduleTitle} onChange={(event) => setModuleTitle(event.target.value)} />
          <Button type="submit" disabled={!moduleTitle.trim() || createModule.isPending}><Plus className="size-4" />Añadir módulo</Button>
        </form>
      ) : null}
    </section>
  );
}

function ModuleEditor({ module, editable, onChanged }: { module: TrainingCourseDto["modules"][number]; editable: boolean; onChanged: () => Promise<void> }) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(module.title);
  const [lessonTitle, setLessonTitle] = useState("");
  const update = useMutation({ mutationFn: () => updateTrainingCourseModule(module.id, { title }), onSuccess: async () => { setEditing(false); await onChanged(); } });
  const remove = useMutation({ mutationFn: () => deleteTrainingCourseModule(module.id), onSuccess: onChanged });
  const createLesson = useMutation({
    mutationFn: () => createTrainingLesson(module.id, { title: lessonTitle, sortOrder: module.lessons.length }),
    onSuccess: async () => { setLessonTitle(""); await onChanged(); },
  });
  return (
    <Card level={2}>
      <CardHeader className="flex-row items-center gap-3">
        <Button type="button" size="icon" variant="ghost" aria-label={expanded ? "Contraer módulo" : "Expandir módulo"} onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronDown /> : <ChevronRight />}
        </Button>
        <div className="min-w-0 flex-1">
          {editing ? <Input aria-label="Título del módulo" value={title} onChange={(event) => setTitle(event.target.value)} /> : <CardTitle>{module.title}</CardTitle>}
          <p className="mt-1 text-sm text-text-secondary">{module.lessons.length} lecciones</p>
        </div>
        {editable ? <div className="flex gap-1">{editing ? <Button type="button" size="sm" onClick={() => update.mutate()} disabled={!title.trim()}>Guardar</Button> : <Button type="button" size="icon" variant="ghost" aria-label={`Editar ${module.title}`} onClick={() => setEditing(true)}><Pencil className="size-4" /></Button>}<Button type="button" size="icon" variant="ghost" aria-label={`Eliminar ${module.title}`} onClick={() => remove.mutate()} disabled={remove.isPending}><Trash2 className="size-4 text-status-danger" /></Button></div> : null}
      </CardHeader>
      {expanded ? <CardContent className="space-y-3">{module.lessons.map((lesson) => <LessonEditor key={lesson.id} lesson={lesson} editable={editable} onChanged={onChanged} />)}{editable ? <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(event) => { event.preventDefault(); if (lessonTitle.trim()) createLesson.mutate(); }}><Input aria-label="Título de la nueva lección" placeholder="Nueva lección" value={lessonTitle} onChange={(event) => setLessonTitle(event.target.value)} /><Button type="submit" variant="secondary" disabled={!lessonTitle.trim()}><Plus className="size-4" />Lección</Button></form> : null}</CardContent> : null}
    </Card>
  );
}

function LessonEditor({ lesson, editable, onChanged }: { lesson: TrainingCourseDto["modules"][number]["lessons"][number]; editable: boolean; onChanged: () => Promise<void> }) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(lesson.title);
  const [blockOpen, setBlockOpen] = useState(false);
  const update = useMutation({ mutationFn: () => updateTrainingLesson(lesson.id, { title }), onSuccess: async () => { setEditing(false); await onChanged(); } });
  const remove = useMutation({ mutationFn: () => deleteTrainingLesson(lesson.id), onSuccess: onChanged });
  return (
    <div className="rounded-xl border border-border-default bg-surface-section p-3">
      <div className="flex items-center gap-2">
        <Button type="button" size="icon" variant="ghost" aria-label={expanded ? "Contraer lección" : "Expandir lección"} onClick={() => setExpanded(!expanded)}>{expanded ? <ChevronDown /> : <ChevronRight />}</Button>
        <div className="min-w-0 flex-1">{editing ? <Input aria-label="Título de la lección" value={title} onChange={(event) => setTitle(event.target.value)} /> : <p className="font-medium">{lesson.title}</p>}</div>
        {editable ? <div className="flex gap-1">{editing ? <Button type="button" size="sm" onClick={() => update.mutate()}>Guardar</Button> : <Button type="button" size="icon" variant="ghost" aria-label={`Editar ${lesson.title}`} onClick={() => setEditing(true)}><Pencil className="size-4" /></Button>}<Button type="button" size="icon" variant="ghost" aria-label={`Eliminar ${lesson.title}`} onClick={() => remove.mutate()}><Trash2 className="size-4 text-status-danger" /></Button></div> : null}
      </div>
      {expanded ? <div className="mt-3 space-y-2 pl-0 sm:pl-12">{lesson.blocks.map((block) => <BlockEditor key={block.id} block={block} editable={editable} onChanged={onChanged} />)}{editable ? <Button type="button" size="sm" variant="secondary" onClick={() => setBlockOpen(true)}><Plus className="size-4" />Bloque</Button> : null}</div> : null}
      <BlockFormDialog lessonId={lesson.id} open={blockOpen} onOpenChange={setBlockOpen} onSaved={onChanged} />
    </div>
  );
}

function BlockEditor({ block, editable, onChanged }: { block: TrainingContentBlockDto; editable: boolean; onChanged: () => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const remove = useMutation({ mutationFn: () => deleteTrainingContentBlock(block.id), onSuccess: onChanged });
  const Icon = block.type === "VIDEO" ? Video : block.type === "LINK" ? Link2 : FileText;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border-default bg-surface-elevated p-3">
      <Icon className="size-5 text-primary" />
      <div className="min-w-0 flex-1"><p className="font-medium">{block.title || blockLabels[block.type]}</p><p className="text-xs text-text-secondary">{blockLabels[block.type]}</p></div>
      {editable ? <><Button type="button" size="icon" variant="ghost" aria-label="Editar bloque" onClick={() => setEditing(true)}><Pencil className="size-4" /></Button><Button type="button" size="icon" variant="ghost" aria-label="Eliminar bloque" onClick={() => remove.mutate()}><Trash2 className="size-4 text-status-danger" /></Button></> : null}
      <BlockFormDialog lessonId={block.lessonId} block={block} open={editing} onOpenChange={setEditing} onSaved={onChanged} />
    </div>
  );
}

function BlockFormDialog({ lessonId, block, open, onOpenChange, onSaved }: { lessonId: string; block?: TrainingContentBlockDto; open: boolean; onOpenChange: (open: boolean) => void; onSaved: () => Promise<void> }) {
  const [type, setType] = useState<TrainingContentBlockType>(block?.type ?? "RICH_TEXT");
  const [title, setTitle] = useState(block?.title ?? "");
  const [value, setValue] = useState(block?.resourceUrl ?? String(block?.content?.text ?? ""));
  const resource = ["VIDEO", "FILE", "LINK"].includes(type);
  const save = useMutation({
    mutationFn: () => {
      const input = { type, title: title || undefined, ...(resource ? { resourceUrl: value } : { content: { text: value } }) };
      return block ? updateTrainingContentBlock(block.id, input) : createTrainingContentBlock(lessonId, input);
    },
    onSuccess: async () => { toast.success(block ? "Bloque actualizado" : "Bloque añadido"); onOpenChange(false); await onSaved(); },
  });
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={block ? "Editar bloque" : "Añadir bloque"} description="Selecciona el formato y agrega el contenido correspondiente.">
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); if (value.trim()) save.mutate(); }}>
        <FormErrorSummary serverError={save.error} />
        <FormField id="block-type" label="Tipo">{(field) => <Select value={type} onValueChange={(next) => { setType(next as TrainingContentBlockType); setValue(""); }}><SelectTrigger {...field}><SelectValue /></SelectTrigger><SelectContent>{Object.entries(blockLabels).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select>}</FormField>
        <FormField id="block-title" label="Título">{(field) => <Input {...field} value={title} onChange={(event) => setTitle(event.target.value)} />}</FormField>
        <FormField id="block-value" label={resource ? "URL del recurso" : "Contenido"} required>{(field) => resource ? <Input {...field} type="url" value={value} onChange={(event) => setValue(event.target.value)} /> : <textarea {...field} className="min-h-32 w-full rounded-2xl border border-border-default bg-surface-elevated p-4" value={value} onChange={(event) => setValue(event.target.value)} />}</FormField>
        <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="submit" disabled={!value.trim() || save.isPending}>Guardar</Button></div>
      </form>
    </FormDialog>
  );
}

function ScheduleDialog({ open, onOpenChange, pending, onConfirm }: { open: boolean; onOpenChange: (open: boolean) => void; pending: boolean; onConfirm: (input: { scheduledPublishAt: string; scheduledRetireAt?: string }) => void }) {
  const [publishAt, setPublishAt] = useState("");
  const [retireAt, setRetireAt] = useState("");
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title="Programar publicación" description="El backend publicará el curso automáticamente en la fecha indicada.">
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); if (publishAt) onConfirm({ scheduledPublishAt: new Date(publishAt).toISOString(), scheduledRetireAt: retireAt ? new Date(retireAt).toISOString() : undefined }); }}>
        <FormField id="publish-at" label="Publicar el" required>{(field) => <Input {...field} type="datetime-local" value={publishAt} onChange={(event) => setPublishAt(event.target.value)} />}</FormField>
        <FormField id="retire-at" label="Retirar el (opcional)">{(field) => <Input {...field} type="datetime-local" value={retireAt} onChange={(event) => setRetireAt(event.target.value)} />}</FormField>
        <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="submit" disabled={!publishAt || pending}>{pending ? "Programando…" : "Programar"}</Button></div>
      </form>
    </FormDialog>
  );
}

function CoursePreviewDialog({ courseId, open, onOpenChange }: { courseId: string | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const query = useQuery({ queryKey: ["training-course-preview", courseId], queryFn: () => fetchTrainingCoursePreview(courseId!), enabled: Boolean(courseId && open) });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-4xl overflow-y-auto">
        <DialogHeader><DialogTitle>Vista previa del curso</DialogTitle><DialogDescription>Así se organiza el contenido antes de asignarlo.</DialogDescription></DialogHeader>
        {query.isLoading ? <AsyncState state="loading" /> : null}
        {query.isError ? <AsyncState state="error" onRetry={() => void query.refetch()} /> : null}
        {query.data ? <article className="space-y-6">{query.data.coverImageUrl ? <div role="img" aria-label={`Portada de ${query.data.title}`} className="aspect-[16/6] w-full rounded-2xl bg-cover bg-center" style={{ backgroundImage: `url("${query.data.coverImageUrl.replace(/"/g, "%22")}")` }} /> : null}<div><div className="flex flex-wrap gap-2"><CourseStatusBadge status={query.data.status} /><Badge>{query.data.difficulty}</Badge><Badge>{query.data.estimatedMinutes} min</Badge></div><h2 className="mt-4 text-3xl font-semibold">{query.data.title}</h2><p className="mt-2 text-text-secondary">{query.data.summary}</p></div>{query.data.modules.map((module) => <section key={module.id} className="space-y-3"><h3 className="text-xl font-semibold">{module.title}</h3>{module.lessons.map((lesson) => <div key={lesson.id} className="rounded-xl border border-border-default p-4"><h4 className="font-medium">{lesson.title}</h4><ul className="mt-3 space-y-2">{lesson.blocks.map((block) => <li key={block.id} className="flex gap-2 text-sm text-text-secondary"><FileText className="size-4 shrink-0" />{block.title || blockLabels[block.type]}</li>)}</ul></div>)}</section>)}</article> : null}
      </DialogContent>
    </Dialog>
  );
}
