"use client";

import {
  Archive,
  ArrowLeft,
  ArrowDown,
  ArrowUp,
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
  Award,
  ClipboardCheck,
  Rocket,
  Target,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { AsyncState } from "@/components/async-state";
import { ConfirmDeleteDialog, FormDialog } from "@/components/admin-crud";
import {
  ActionBar,
  InlineFeedback,
  PageHeader,
  Pagination,
  ResponsiveDialog,
  ResponsiveDataView,
} from "@/components/design-system";
import { FormErrorSummary } from "@/components/form-error-summary";
import { TrainingCourseFoundation } from "@/components/training-course-foundation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  createTrainingCategory,
  createTrainingContentBlock,
  createTrainingCourse,
  createTrainingCoursePilot,
  createTrainingCourseModule,
  createTrainingLesson,
  deleteTrainingContentBlock,
  deleteTrainingCourse,
  deleteTrainingCourseModule,
  deleteTrainingLesson,
  duplicateTrainingContentBlock,
  duplicateTrainingCourse,
  duplicateTrainingCourseModule,
  duplicateTrainingLesson,
  fetchTrainingCategories,
  fetchTrainingCourse,
  fetchTrainingCourseDesign,
  fetchTrainingCoursePreview,
  fetchTrainingAdminVideo,
  fetchTrainingCourseQuality,
  fetchTrainingCertificationPolicy,
  fetchTrainingCourses,
  fetchUsers,
  getApiErrorMessage,
  reorderTrainingContentBlocks,
  reorderTrainingCourseModules,
  reorderTrainingLessons,
  requestTrainingQualityReviews,
  decideTrainingQualityReview,
  ApiError,
  resolveTrainingAssetUrl,
  transitionTrainingCourse,
  updateTrainingContentBlock,
  updateTrainingCourse,
  updateTrainingCourseModule,
  updateTrainingCertificationPolicy,
  updateTrainingCoursePilotStatus,
  updateTrainingLesson,
  uploadTrainingVideo,
} from "@/lib/backend";
import type {
  TrainingContentBlockDto,
  TrainingContentBlockType,
  TrainingCourseDto,
  TrainingCourseInput,
  TrainingCourseStatus,
  TrainingQualityReviewDto,
} from "@/lib/contracts";
import { REQUIRED_TRAINING_REVIEW_TYPES } from "@/lib/training-quality";
import { useAppStore } from "@/store/app-store";
import {
  getTrainingCourseWizardState,
  nextTrainingCourseWizardStep,
  previousTrainingCourseWizardStep,
  TRAINING_COURSE_WIZARD_STEPS,
  type TrainingCourseWizardStep,
} from "@/lib/training-course-wizard";
import { moveTrainingEntity, trainingBlockSummary } from "@/lib/training-content-editor";
import { getTrainingAssessmentReadiness } from "@/lib/training-assessment";

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
  TASK: "Actividad práctica",
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
  const { can, currentRole, currentTenant } = useAppStore();
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const scope = (searchParams.get("scope") ?? "") as "" | "TENANT" | "GLOBAL";
  const categoryId = searchParams.get("category") ?? "";
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TrainingCourseDto | null>(null);

  useEffect(() => {
    setPreviewId(null);
  }, [currentTenant?.id]);

  const coursesQuery = useQuery({
    queryKey: ["training-admin-courses", currentTenant?.id, page, search, status, scope, categoryId],
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
    onError: (error) => {
      if (error instanceof ApiError && error.status === 403) {
        toast.error(error.message || "No tienes permiso para borrar este curso.");
        return;
      }

      toast.error(getApiErrorMessage(error, "No fue posible eliminar el curso."));
    },
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
              <Button asChild type="button" variant="secondary">
                <Link href="/training/integrations">
                  <Link2 className="size-4" aria-hidden="true" />
                  Ayuda SCORM e integraciones
                </Link>
              </Button>
              <Button type="button" variant="secondary" onClick={() => setCategoryOpen(true)}>
                <Plus className="size-4" aria-hidden="true" />
                Categoría
              </Button>
              <Button asChild type="button">
                <Link href="/training/content/new">
                <Plus className="size-4" aria-hidden="true" />
                Nuevo curso
                </Link>
              </Button>
            </>
          ) : undefined
        }
      />

      <section className="grid gap-3 md:grid-cols-3" aria-label="Guía rápida para crear cursos">
        <Card level={2}><CardContent className="space-y-2 p-4"><p className="text-sm font-semibold">1. Parte de un curso existente</p><p className="text-sm text-text-secondary">Usa “Duplicar” en cualquier curso para reutilizar su estructura, lecciones y bloques sin publicar cambios.</p></CardContent></Card>
        <Card level={2}><CardContent className="space-y-2 p-4"><p className="text-sm font-semibold">2. Diseña por bloques</p><p className="text-sm text-text-secondary">El editor organiza texto, video, archivos, enlaces, cuestionarios y actividades en una secuencia vertical.</p></CardContent></Card>
        <Card level={2}><CardContent className="space-y-2 p-4"><p className="text-sm font-semibold">3. Guarda y publica con control</p><p className="text-sm text-text-secondary">Cada curso inicia como borrador y el asistente valida diseño, evaluación y vista previa antes de publicarlo.</p></CardContent></Card>
      </section>

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
                onEdit={(courseId) => router.push(`/training/content/${encodeURIComponent(courseId)}`)}
                onPreview={(courseId) => {
                  if (coursesQuery.data?.items.some((course) => course.id === courseId)) setPreviewId(courseId);
                }}
                onDelete={setDeleteTarget}
              />
            }
            mobile={(course) => (
              <CourseCard
                course={course}
                canEdit={can("courses.update")}
                canDelete={can("courses.delete")}
                canDuplicate={canCreate}
                onEdit={(courseId) => router.push(`/training/content/${encodeURIComponent(courseId)}`)}
                onPreview={(courseId) => {
                  if (coursesQuery.data?.items.some((course) => course.id === courseId)) setPreviewId(courseId);
                }}
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
    <><div className="grid gap-3 md:hidden">{props.courses.map((course) => <Card key={course.id} level={2}><CardContent className="p-4"><CourseCard {...props} course={course} /></CardContent></Card>)}</div><div className="hidden overflow-x-auto rounded-2xl border border-border-default md:block">
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
    </div></>
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

export function TrainingCourseCreatePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [categoryId, setCategoryId] = useState("NONE");
  const categories = useQuery({ queryKey: ["training-categories"], queryFn: fetchTrainingCategories });
  const create = useMutation({
    mutationFn: () => createTrainingCourse({
      title: title.trim(),
      summary: summary.trim() || undefined,
      categoryId: categoryId === "NONE" ? undefined : categoryId,
      scope: "TENANT",
    }),
    onSuccess: (course) => {
      toast.success("Curso creado como borrador");
      router.replace(`/training/content/${encodeURIComponent(course.id)}`);
    },
  });
  const errors = !title.trim()
    ? [{ fieldId: "course-title", label: "Título", message: "Es obligatorio." }]
    : [];

  return <div className="mx-auto max-w-4xl space-y-6">
    <PageHeader
      eyebrow="Aprendizaje"
      title="Crear curso"
      description="Empieza con lo esencial. Podrás añadir contenido, evaluaciones, certificación y configuración avanzada en el editor."
      actions={<Button asChild variant="secondary"><Link href="/training/content"><ArrowLeft className="size-4" />Volver a cursos</Link></Button>}
    />
    <Card level={2}>
      <CardHeader><CardTitle>Información inicial</CardTitle></CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); if (!errors.length) create.mutate(); }}>
          <FormErrorSummary errors={errors} serverError={create.error} />
          <FormField id="course-title" label="Título del curso" description="Usa un nombre claro para que las personas lo encuentren fácilmente." required>
            {(field) => <Input {...field} autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ej. Seguridad básica en el trabajo" />}
          </FormField>
          <FormField id="course-summary" label="Resumen" description="Opcional. Una frase breve sobre lo que aprenderán las personas.">
            {(field) => <textarea {...field} className="min-h-28 w-full rounded-2xl border border-border-default bg-surface-elevated p-4" value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Ej. Principios y prácticas para trabajar de forma segura." />}
          </FormField>
          <FormField id="course-category" label="Categoría" description="Opcional. Puedes crear o cambiar categorías más adelante.">
            {(field) => <Select value={categoryId} onValueChange={setCategoryId} disabled={categories.isLoading}><SelectTrigger {...field}><SelectValue placeholder="Sin categoría" /></SelectTrigger><SelectContent><SelectItem value="NONE">Sin categoría</SelectItem>{(categories.data ?? []).map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent></Select>}
          </FormField>
          <InlineFeedback tone="info" title="El resto se configura después">Dificultad, duración, idioma, etiquetas, portada y visibilidad no son necesarios para crear el borrador.</InlineFeedback>
          <div className="flex flex-col-reverse gap-3 border-t border-border-default pt-5 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={() => router.push("/training/content")}>Cancelar</Button><Button type="submit" disabled={create.isPending || Boolean(errors.length)}>{create.isPending ? "Creando…" : "Crear y diseñar curso"}</Button></div>
        </form>
      </CardContent>
    </Card>
  </div>;
}

function CourseMetadataForm({
  course,
  categories,
  onSaved,
  onCancel,
  showCancel = true,
  submitLabel,
}: {
  course?: TrainingCourseDto;
  categories: Array<{ id: string; name: string }>;
  onSaved: (course: TrainingCourseDto) => void;
  onCancel?: () => void;
  showCancel?: boolean;
  submitLabel?: string;
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
    mutationFn: () => {
      // Optional URL and text fields must be omitted when empty. Sending an
      // empty string makes backend validation treat them as invalid values.
      const payload: TrainingCourseInput = {
        title: form.title.trim(),
        slug: form.slug?.trim() || undefined,
        summary: form.summary?.trim() || undefined,
        description: form.description?.trim() || undefined,
        categoryId: form.categoryId,
        coverImageUrl: form.coverImageUrl?.trim() || undefined,
        introVideoUrl: form.introVideoUrl?.trim() || undefined,
        difficulty: form.difficulty,
        estimatedMinutes: form.estimatedMinutes,
        language: form.language?.trim() || undefined,
        tags: form.tags?.filter(Boolean),
        scope: form.scope,
      };
      return course ? updateTrainingCourse(course.id, payload) : createTrainingCourse(payload);
    },
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
      <FormField id="course-category" label="Categoría">
        {(field) => <Select value={form.categoryId ?? "NONE"} onValueChange={(value) => setForm({ ...form, categoryId: value === "NONE" ? undefined : value })}>
          <SelectTrigger {...field}><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="NONE">Sin categoría</SelectItem>{categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent>
        </Select>}
      </FormField>
      <FormField id="course-summary" label="Resumen">
        {(field) => <textarea {...field} className="min-h-24 w-full rounded-2xl border border-border-default bg-surface-elevated p-4" value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} />}
      </FormField>
      <FormField id="course-description" label="Descripción">
        {(field) => <textarea {...field} className="min-h-32 w-full rounded-2xl border border-border-default bg-surface-elevated p-4" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />}
      </FormField>
      <FormField id="course-duration" label="Duración estimada (minutos)" description="Puedes ajustar este valor cuando definas las lecciones.">
        {(field) => <Input {...field} type="number" min={0} value={form.estimatedMinutes} onChange={(event) => setForm({ ...form, estimatedMinutes: Number(event.target.value) })} />}
      </FormField>
      <div className="flex justify-end gap-2">
        {showCancel ? <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button> : null}
        <Button type="submit" disabled={save.isPending || Boolean(errors.length)}>{save.isPending ? "Guardando…" : submitLabel ?? "Guardar"}</Button>
      </div>
    </form>
  );
}

export function TrainingCourseEditor({ courseId }: { courseId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { can } = useAppStore();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [step, setStep] = useState<TrainingCourseWizardStep>("GENERAL");
  const [previewed, setPreviewed] = useState(false);
  const query = useQuery({
    queryKey: ["training-course", courseId],
    queryFn: () => fetchTrainingCourse(courseId),
  });
  const design = useQuery({
    queryKey: ["training-course-design", courseId],
    queryFn: () => fetchTrainingCourseDesign(courseId),
  });
  const categories = useQuery({ queryKey: ["training-categories"], queryFn: fetchTrainingCategories });

  function selectStep(next: TrainingCourseWizardStep) {
    setStep(next);
  }

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["training-course", courseId] });
    await queryClient.invalidateQueries({ queryKey: ["training-course-design", courseId] });
    await queryClient.invalidateQueries({ queryKey: ["training-admin-courses"] });
  };
  const transition = useMutation({
    mutationFn: ({ action, input }: { action: Parameters<typeof transitionTrainingCourse>[1]; input?: Parameters<typeof transitionTrainingCourse>[2] }) =>
      transitionTrainingCourse(courseId, action, input),
    onSuccess: async (course) => {
      toast.success(`Curso: ${statusLabels[course.status]}`);
      await refresh();
      setScheduleOpen(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible cambiar el estado.")),
  });
  const wizard = query.data ? getTrainingCourseWizardState(query.data, design.data, previewed) : null;
  const currentIndex = TRAINING_COURSE_WIZARD_STEPS.findIndex((item) => item.id === step);
  const currentStep = TRAINING_COURSE_WIZARD_STEPS[currentIndex] ?? TRAINING_COURSE_WIZARD_STEPS[0];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Aprendizaje"
        title={query.data?.title ?? "Editor de curso"}
        description="Asistente editorial con guardado por etapa y requisitos de publicación."
        actions={<Button type="button" variant="secondary" onClick={() => router.push("/training/content")}><ArrowLeft className="size-4" />Volver a cursos</Button>}
      />
      <section className="overflow-hidden rounded-3xl border border-border-default bg-card shadow-sm">
        <header className="border-b border-border-default p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="text-sm font-medium text-text-secondary">Borrador y publicación</p><p className="mt-1 text-sm text-text-secondary">Completa cada etapa a tu ritmo; los campos avanzados son opcionales.</p></div>
            {wizard ? (
              <div className="min-w-48">
                <div className="mb-2 flex justify-between text-xs font-medium"><span>Avance editorial</span><span>{wizard.progressPercent}%</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-section"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${wizard.progressPercent}%` }} /></div>
              </div>
            ) : null}
          </div>
        </header>
        <div className="grid lg:grid-cols-[280px_minmax(0,1fr)]">
          {query.data && wizard ? <WizardSidebar step={step} wizard={wizard} onSelect={selectStep} /> : null}
          <div className="min-w-0 p-5 sm:p-6">
          {query.isLoading ? <AsyncState state="loading" /> : null}
          {query.isError || design.isError ? <AsyncState state="error" onRetry={() => { void query.refetch(); void design.refetch(); }} /> : null}
          {query.data && design.data && wizard ? (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Paso {currentIndex + 1} de {TRAINING_COURSE_WIZARD_STEPS.length}</p>
                <h2 className="mt-1 text-2xl font-semibold">{currentStep.label}</h2>
                <p className="text-sm text-text-secondary">{currentStep.description}</p>
              </div>
              {step === "GENERAL" ? (
                <Card level={2}><CardContent className="p-5"><CourseMetadataForm
                  course={query.data}
                  categories={categories.data ?? []}
                  showCancel={false}
                  submitLabel="Guardar y continuar"
                  onSaved={async () => { await refresh(); selectStep("FOUNDATION"); }}
                /></CardContent></Card>
              ) : null}
              {step === "FOUNDATION" ? (
                <TrainingCourseFoundation
                  courseId={query.data.id}
                  courseTenantId={query.data.tenantId}
                  editable={can("courses.update")}
                  onChanged={refresh}
                  onSaved={() => selectStep("STRUCTURE")}
                />
              ) : null}
              {step === "STRUCTURE" ? (
                <>
                  <CourseStructure course={query.data} editable={can("courses.update")} onChanged={refresh} />
                  <WizardContinue onClick={() => selectStep("ASSESSMENT")} label="Continuar a evaluación" />
                </>
              ) : null}
              {step === "ASSESSMENT" ? <AssessmentWizardStep course={query.data} onContinue={() => selectStep("CERTIFICATION")} /> : null}
              {step === "CERTIFICATION" ? <CertificationWizardStep course={query.data} onChanged={refresh} onContinue={() => selectStep("PREVIEW")} /> : null}
              {step === "PREVIEW" ? (
                <PreviewWizardStep
                  previewed={previewed}
                  onPreview={() => {
                    setPreviewOpen(true);
                    setPreviewed(true);
                  }}
                  onContinue={() => selectStep("PUBLISH")}
                />
              ) : null}
              {step === "PUBLISH" ? (
                <PublishWizardStep
                  course={query.data}
                  wizard={wizard}
                  can={can}
                  pending={transition.isPending}
                  onChanged={refresh}
                  onTransition={(action) => action === "schedule" ? setScheduleOpen(true) : transition.mutate({ action })}
                  onGoTo={selectStep}
                />
              ) : null}
              <WizardFooter
                step={step}
                onPrevious={() => selectStep(previousTrainingCourseWizardStep(step))}
                onNext={() => selectStep(nextTrainingCourseWizardStep(step))}
              />
            </div>
          ) : null}
          </div>
        </div>
      </section>
      <ScheduleDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        pending={transition.isPending}
        onConfirm={(input) => transition.mutate({ action: "schedule", input })}
      />
      <CoursePreviewDialog courseId={courseId} open={previewOpen} onOpenChange={setPreviewOpen} />
    </div>
  );
}

type CourseWizardState = ReturnType<typeof getTrainingCourseWizardState>;

function WizardSidebar({
  step,
  wizard,
  onSelect,
}: {
  step: TrainingCourseWizardStep;
  wizard: CourseWizardState;
  onSelect: (step: TrainingCourseWizardStep) => void;
}) {
  const icons: Record<TrainingCourseWizardStep, ReactNode> = {
    GENERAL: <FileText className="size-4" />,
    FOUNDATION: <Target className="size-4" />,
    STRUCTURE: <BookOpen className="size-4" />,
    ASSESSMENT: <ClipboardCheck className="size-4" />,
    CERTIFICATION: <Award className="size-4" />,
    PREVIEW: <Eye className="size-4" />,
    PUBLISH: <Rocket className="size-4" />,
  };
  return (
    <aside className="overflow-y-auto border-b border-border-default bg-surface-section p-4 lg:border-b-0 lg:border-r">
      <nav aria-label="Etapas del curso" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
        {TRAINING_COURSE_WIZARD_STEPS.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            aria-current={step === item.id ? "step" : undefined}
            className={`flex min-h-14 items-start gap-3 rounded-xl border p-3 text-left transition-colors ${step === item.id ? "border-primary bg-surface-elevated shadow-sm" : "border-transparent hover:border-border-default hover:bg-surface-elevated"}`}
          >
            <span className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${wizard.completed[item.id] ? "bg-status-success-soft text-status-success" : "bg-surface-elevated text-text-secondary"}`}>
              {wizard.completed[item.id] ? <CheckCircle2 className="size-4" /> : icons[item.id]}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{index + 1}. {item.label}</span>
              <span className="block text-xs text-text-secondary">{item.description}</span>
              {!item.required ? <span className="mt-1 block text-[11px] text-text-secondary">Recomendado</span> : null}
            </span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

function AssessmentWizardStep({ course, onContinue }: { course: TrainingCourseDto; onContinue: () => void }) {
  return (
    <Card level={2}>
      <CardHeader><CardTitle>Comprobación del aprendizaje</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {course.quizzes?.length ? (
          <div className="space-y-2">
            {course.quizzes.map((quiz) => (
              <div key={quiz.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-default p-4">
                <div><strong>{quiz.title}</strong><p className="text-sm text-text-secondary">{quiz.questions.length} preguntas · Aprobación {quiz.passingScore}% · {quiz.maxAttempts ?? "∞"} intentos</p></div>
                <Badge variant={getTrainingAssessmentReadiness(quiz).ready ? "success" : "warning"}>
                  {getTrainingAssessmentReadiness(quiz).ready ? "Lista" : "Requiere ajustes"}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <InlineFeedback tone="info" title="Evaluación recomendada">
            El curso todavía no tiene una evaluación. Puedes continuar, pero una evaluación permitirá comprobar los objetivos en la fase de medición.
          </InlineFeedback>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <Button asChild variant="secondary"><Link href={`/training/evaluations?courseId=${encodeURIComponent(course.id)}`}>Gestionar evaluaciones</Link></Button>
          <Button type="button" onClick={onContinue}>Continuar</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CertificationWizardStep({ course, onChanged, onContinue }: { course: TrainingCourseDto; onChanged: () => Promise<void>; onContinue: () => void }) {
  const query = useQuery({
    queryKey: ["training-certification-policy", course.id],
    queryFn: () => fetchTrainingCertificationPolicy(course.id),
  });
  const save = useMutation({
    mutationFn: (input: Parameters<typeof updateTrainingCertificationPolicy>[1]) =>
      updateTrainingCertificationPolicy(course.id, input),
    onSuccess: async () => {
      toast.success("Política de certificación guardada");
      await query.refetch();
      await onChanged();
      onContinue();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible guardar la certificación.")),
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    save.mutate({
      isEnabled: data.get("isEnabled") === "on",
      autoIssue: data.get("autoIssue") === "on",
      requireAssessment: data.get("requireAssessment") === "on",
      requireAllRequiredLessons: data.get("requireAllRequiredLessons") === "on",
      validityDays: Number(data.get("validityDays")) || undefined,
      renewalWindowDays: Number(data.get("renewalWindowDays")) || 0,
      reminderDays: String(data.get("reminderDays") || "").split(",").map(Number).filter((value) => Number.isInteger(value) && value >= 0),
      certificateTitle: String(data.get("certificateTitle") || "") || undefined,
      certificateDescription: String(data.get("certificateDescription") || "") || undefined,
      signatoryName: String(data.get("signatoryName") || "") || undefined,
      signatoryTitle: String(data.get("signatoryTitle") || "") || undefined,
      badgeImageUrl: String(data.get("badgeImageUrl") || "") || undefined,
    });
  }
  if (query.isLoading) return <AsyncState state="loading" />;
  if (query.isError || !query.data) return <AsyncState state="error" onRetry={() => void query.refetch()} />;
  const policy = query.data.policy;
  return (
    <Card level={2}>
      <CardHeader><CardTitle>Certificación, vigencia y renovación</CardTitle></CardHeader>
      <CardContent>
        <form key={policy.version} className="space-y-5" onSubmit={submit}>
          <FormErrorSummary serverError={save.error} />
          {!query.data.readiness.ready && policy.isEnabled ? <InlineFeedback tone="warning" title="Configuración incompleta">{query.data.readiness.errors.join(" · ")}</InlineFeedback> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-xl border border-border-default p-4"><input type="checkbox" name="isEnabled" defaultChecked={policy.isEnabled} /><span><strong>Emitir certificado</strong><span className="block text-sm text-text-secondary">Habilita una credencial verificable para este curso.</span></span></label>
            <label className="flex items-center gap-3 rounded-xl border border-border-default p-4"><input type="checkbox" name="autoIssue" defaultChecked={policy.autoIssue} /><span><strong>Emisión automática</strong><span className="block text-sm text-text-secondary">Se emite al cumplir toda la evidencia.</span></span></label>
            <label className="flex items-center gap-3 rounded-xl border border-border-default p-4"><input type="checkbox" name="requireAssessment" defaultChecked={policy.requireAssessment} /><span><strong>Exigir evaluación</strong><span className="block text-sm text-text-secondary">Todas las evaluaciones deben estar aprobadas.</span></span></label>
            <label className="flex items-center gap-3 rounded-xl border border-border-default p-4"><input type="checkbox" name="requireAllRequiredLessons" defaultChecked={policy.requireAllRequiredLessons} /><span><strong>Exigir lecciones obligatorias</strong><span className="block text-sm text-text-secondary">Valida progreso antes de emitir.</span></span></label>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField id="cert-validity" label="Vigencia (días)">{(field) => <Input {...field} name="validityDays" type="number" min={1} max={3650} defaultValue={policy.validityDays ?? ""} placeholder="Sin vencimiento" />}</FormField>
            <FormField id="cert-renewal-window" label="Ventana de renovación">{(field) => <Input {...field} name="renewalWindowDays" type="number" min={0} max={365} defaultValue={policy.renewalWindowDays} />}</FormField>
            <FormField id="cert-reminders" label="Avisos antes de vencer">{(field) => <Input {...field} name="reminderDays" defaultValue={policy.reminderDays.join(",")} placeholder="30,7,1" />}</FormField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="cert-title" label="Título de la credencial">{(field) => <Input {...field} name="certificateTitle" defaultValue={policy.certificateTitle ?? course.title} />}</FormField>
            <FormField id="cert-badge" label="URL de insignia">{(field) => <Input {...field} name="badgeImageUrl" type="url" defaultValue={policy.badgeImageUrl ?? ""} />}</FormField>
            <FormField id="cert-signatory" label="Nombre del firmante">{(field) => <Input {...field} name="signatoryName" defaultValue={policy.signatoryName ?? ""} />}</FormField>
            <FormField id="cert-signatory-title" label="Cargo del firmante">{(field) => <Input {...field} name="signatoryTitle" defaultValue={policy.signatoryTitle ?? ""} />}</FormField>
          </div>
          <FormField id="cert-description" label="Descripción de la credencial">{(field) => <textarea {...field} name="certificateDescription" className="min-h-24 w-full rounded-xl border border-border-default bg-surface-elevated p-3" defaultValue={policy.certificateDescription ?? ""} />}</FormField>
          <div className="flex flex-wrap justify-end gap-2"><Button asChild variant="secondary"><Link href={`/training/certificates?courseId=${encodeURIComponent(course.id)}`}>Ver certificados</Link></Button><Button type="submit" disabled={save.isPending}>{save.isPending ? "Guardando…" : "Guardar y continuar"}</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}

function PreviewWizardStep({ previewed, onPreview, onContinue }: { previewed: boolean; onPreview: () => void; onContinue: () => void }) {
  return (
    <Card level={2}>
      <CardHeader><CardTitle>Experiencia del participante</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-text-secondary">Abre una simulación de solo lectura para revisar portada, secuencia, títulos y recursos. No guarda progreso ni modifica el curso.</p>
        {previewed ? <InlineFeedback tone="success" title="Vista previa revisada">Esta sesión ya abrió la experiencia del participante.</InlineFeedback> : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onPreview}><Eye className="size-4" />Abrir vista previa</Button>
          <Button type="button" onClick={onContinue}>Continuar a revisión</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PublishWizardStep({
  course,
  wizard,
  can,
  pending,
  onChanged,
  onTransition,
  onGoTo,
}: {
  course: TrainingCourseDto;
  wizard: CourseWizardState;
  can: (permission: Parameters<ReturnType<typeof useAppStore>["can"]>[0]) => boolean;
  pending: boolean;
  onChanged: () => Promise<void>;
  onTransition: (action: Parameters<typeof transitionTrainingCourse>[1]) => void;
  onGoTo: (step: TrainingCourseWizardStep) => void;
}) {
  const missing = TRAINING_COURSE_WIZARD_STEPS.filter((item) => item.required && item.id !== "PUBLISH" && !wizard.completed[item.id]);
  return (
    <div className="space-y-5">
      <EditorSummary course={course} />
      {missing.length ? (
        <InlineFeedback tone="warning" title="El curso todavía no puede enviarse a revisión">
          <div className="mt-2 flex flex-wrap gap-2">{missing.map((item) => <Button key={item.id} type="button" size="sm" variant="secondary" onClick={() => onGoTo(item.id)}>Completar {item.label}</Button>)}</div>
        </InlineFeedback>
      ) : (
        <InlineFeedback tone="success" title="Requisitos editoriales completos">
          Información, fundamento pedagógico y estructura están preparados para revisión.
        </InlineFeedback>
      )}
      {!wizard.completed.ASSESSMENT ? <InlineFeedback tone="info" title="Recomendación">Añade una evaluación antes de publicar para medir el aprendizaje.</InlineFeedback> : null}
      <CourseQualityGate course={course} canApprove={can("courses.approve")} onChanged={onChanged} />
      <WorkflowActions
        course={course}
        can={can}
        pending={pending}
        reviewReady={wizard.requiredReady}
        onTransition={onTransition}
        onEdit={() => onGoTo("GENERAL")}
      />
    </div>
  );
}

const qualityReviewLabels = {
  CONTENT: "Contenido",
  PEDAGOGY: "Pedagogía",
  ACCESSIBILITY: "Accesibilidad",
  COMPLIANCE: "Cumplimiento",
} as const;

function CourseQualityGate({ course, canApprove, onChanged }: { course: TrainingCourseDto; canApprove: boolean; onChanged: () => Promise<void> }) {
  const [decisionReview, setDecisionReview] = useState<TrainingQualityReviewDto | null>(null);
  const [pilotOpen, setPilotOpen] = useState(false);
  const query = useQuery({
    queryKey: ["training-course-quality", course.id, course.version],
    queryFn: () => fetchTrainingCourseQuality(course.id),
  });
  const refresh = async () => {
    await query.refetch();
    await onChanged();
  };
  const requestReviews = useMutation({
    mutationFn: () => requestTrainingQualityReviews(course.id, REQUIRED_TRAINING_REVIEW_TYPES),
    onSuccess: async () => { toast.success("Revisiones solicitadas"); await refresh(); },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible solicitar las revisiones.")),
  });
  const pilotStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "COMPLETED" | "CANCELLED" }) =>
      updateTrainingCoursePilotStatus(id, status),
    onSuccess: async () => { toast.success("Estado del piloto actualizado"); await refresh(); },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible actualizar el piloto.")),
  });
  if (query.isLoading) return <AsyncState state="loading" />;
  if (query.isError || !query.data) return <AsyncState state="error" onRetry={() => void query.refetch()} />;
  const quality = query.data;
  return (
    <Card level={2}>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div><CardTitle>Control de calidad · versión {quality.courseVersion}</CardTitle><p className="mt-1 text-sm text-text-secondary">Las aprobaciones anteriores no se reutilizan cuando cambia la versión.</p></div>
        <Badge variant={quality.readiness.ready ? "success" : "warning"}>{quality.readiness.ready ? "Go" : "Gates pendientes"}</Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {REQUIRED_TRAINING_REVIEW_TYPES.map((type) => {
            const review = quality.reviews.find((item) => item.reviewType === type);
            return (
              <div key={type} className="rounded-xl border border-border-default p-4">
                <div className="flex items-center justify-between gap-3"><strong>{qualityReviewLabels[type]}</strong><Badge variant={review?.status === "APPROVED" ? "success" : review?.status === "CHANGES_REQUESTED" ? "destructive" : "secondary"}>{review?.status === "APPROVED" ? "Aprobada" : review?.status === "CHANGES_REQUESTED" ? "Cambios" : review ? "Pendiente" : "No solicitada"}</Badge></div>
                {review?.summary ? <p className="mt-2 text-sm text-text-secondary">{review.summary}</p> : null}
                {review && canApprove && review.status === "PENDING" ? <Button className="mt-3 w-full" size="sm" variant="secondary" onClick={() => setDecisionReview(review)}>Revisar gate</Button> : null}
              </div>
            );
          })}
        </div>
        {!quality.reviews.length && course.status === "IN_REVIEW" ? <Button type="button" variant="secondary" onClick={() => requestReviews.mutate()} disabled={requestReviews.isPending}>Solicitar las cuatro revisiones</Button> : null}
        {!quality.reviews.length && course.status === "DRAFT" ? <InlineFeedback tone="info" title="Primero envía el curso a revisión">El envío abrirá una nueva versión editorial y creará automáticamente los cuatro gates.</InlineFeedback> : null}
        <div className="border-t border-border-default pt-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">Piloto de la versión</h3><p className="text-sm text-text-secondary">Opcional; si se crea, debe cumplir sus criterios antes del go-live.</p></div>{course.status === "IN_REVIEW" ? <Button type="button" variant="secondary" onClick={() => setPilotOpen(true)}><Plus className="size-4" />Crear piloto</Button> : null}</div>
          {quality.pilots.length ? <div className="space-y-3">{quality.pilots.map((pilot) => (
            <div key={pilot.id} className="rounded-xl border border-border-default p-4">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><strong>{pilot.name}</strong><p className="text-sm text-text-secondary">{pilot.metrics?.responses ?? 0}/{pilot.metrics?.participants ?? pilot.participantIds.length} respuestas · promedio {pilot.metrics?.averageRating ?? 0}/5 · {pilot.metrics?.blockingIssues ?? 0} bloqueos</p></div><Badge>{pilot.status}</Badge></div>
              <div className="mt-3 flex flex-wrap gap-2">
                {pilot.status === "DRAFT" ? <Button size="sm" onClick={() => pilotStatus.mutate({ id: pilot.id, status: "ACTIVE" })}>Activar piloto</Button> : null}
                {pilot.status === "ACTIVE" ? <><Button size="sm" onClick={() => pilotStatus.mutate({ id: pilot.id, status: "COMPLETED" })}>Cerrar con éxito</Button><Button size="sm" variant="secondary" onClick={() => pilotStatus.mutate({ id: pilot.id, status: "CANCELLED" })}>Cancelar</Button></> : null}
              </div>
            </div>
          ))}</div> : <p className="text-sm text-text-secondary">No se creó un piloto para esta versión.</p>}
        </div>
        {!quality.readiness.ready ? <InlineFeedback tone="warning" title="Pendiente para aprobar">{quality.readiness.errors.join(" · ")}</InlineFeedback> : <InlineFeedback tone="success" title="Go-live autorizado">Todos los gates de calidad están aprobados.</InlineFeedback>}
      </CardContent>
      <QualityDecisionDialog review={decisionReview} onClose={() => setDecisionReview(null)} onSaved={refresh} />
      <PilotDialog courseId={course.id} open={pilotOpen} onOpenChange={setPilotOpen} onSaved={refresh} />
    </Card>
  );
}

function QualityDecisionDialog({ review, onClose, onSaved }: { review: TrainingQualityReviewDto | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const mutation = useMutation({
    mutationFn: ({ status, checklist, summary }: { status: "APPROVED" | "CHANGES_REQUESTED"; checklist: Record<string, boolean>; summary: string }) =>
      decideTrainingQualityReview(review!.id, { status, checklist, summary }),
    onSuccess: async () => { toast.success("Decisión registrada"); onClose(); await onSaved(); },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible registrar la decisión.")),
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const status = String(data.get("decision")) as "APPROVED" | "CHANGES_REQUESTED";
    const summary = String(data.get("summary") || "");
    mutation.mutate({
      status,
      summary,
      checklist: {
        accurate: data.get("accurate") === "on",
        complete: data.get("complete") === "on",
        usable: data.get("usable") === "on",
        traceable: data.get("traceable") === "on",
      },
    });
  }
  return (
    <FormDialog open={Boolean(review)} onOpenChange={(open) => !open && onClose()} title={`Revisión de ${review ? qualityReviewLabels[review.reviewType] : ""}`} description="Registra evidencia y una decisión explícita para esta versión.">
      <form className="space-y-4" onSubmit={submit}>
        {["accurate:Información correcta", "complete:Cobertura completa", "usable:Experiencia utilizable", "traceable:Evidencia trazable"].map((item) => { const [name, label] = item.split(":"); return <label key={name} className="flex items-center gap-3 rounded-xl border border-border-default p-3"><input type="checkbox" name={name} />{label}</label>; })}
        <div><Label>Decisión</Label><Select name="decision" defaultValue="APPROVED"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="APPROVED">Aprobar</SelectItem><SelectItem value="CHANGES_REQUESTED">Solicitar cambios</SelectItem></SelectContent></Select></div>
        <div><Label htmlFor="quality-summary">Observaciones</Label><textarea id="quality-summary" name="summary" className="min-h-28 w-full rounded-xl border border-border-default bg-surface-elevated p-3" required /></div>
        <Button className="w-full" disabled={mutation.isPending}>Registrar decisión</Button>
      </form>
    </FormDialog>
  );
}

function PilotDialog({ courseId, open, onOpenChange, onSaved }: { courseId: string; open: boolean; onOpenChange: (open: boolean) => void; onSaved: () => Promise<void> }) {
  const users = useQuery({ queryKey: ["training-pilot-users"], queryFn: fetchUsers, enabled: open });
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const mutation = useMutation({
    mutationFn: (input: Parameters<typeof createTrainingCoursePilot>[1]) => createTrainingCoursePilot(courseId, input),
    onSuccess: async () => { toast.success("Piloto creado"); setParticipantIds([]); onOpenChange(false); await onSaved(); },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible crear el piloto.")),
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    mutation.mutate({
      name: String(data.get("name")),
      participantIds,
      successCriteria: {
        minResponses: Number(data.get("minResponses")) || 1,
        minAverageRating: Number(data.get("minAverageRating")) || 4,
      },
    });
  }
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title="Crear piloto" description="Selecciona participantes y define la evidencia mínima para autorizar el go-live.">
      <form className="space-y-4" onSubmit={submit}>
        <div><Label htmlFor="pilot-name">Nombre</Label><Input id="pilot-name" name="name" required placeholder="Piloto operaciones · cohorte 1" /></div>
        <div className="grid gap-3 sm:grid-cols-2"><div><Label>Respuestas mínimas</Label><Input name="minResponses" type="number" min={1} defaultValue={3} /></div><div><Label>Promedio mínimo</Label><Input name="minAverageRating" type="number" min={1} max={5} step="0.1" defaultValue={4} /></div></div>
        <div><Label>Participantes</Label><div className="mt-2 max-h-56 space-y-2 overflow-y-auto">{users.data?.map((user) => <label key={user.id} className="flex items-center gap-3 rounded-xl border border-border-default p-3"><input type="checkbox" checked={participantIds.includes(user.id)} onChange={(event) => setParticipantIds(event.target.checked ? [...participantIds, user.id] : participantIds.filter((id) => id !== user.id))} /><span>{user.fullName}<span className="block text-xs text-text-secondary">{user.email}</span></span></label>)}</div></div>
        <Button className="w-full" disabled={!participantIds.length || mutation.isPending}>Crear piloto</Button>
      </form>
    </FormDialog>
  );
}

function WizardContinue({ onClick, label }: { onClick: () => void; label: string }) {
  return <div className="flex justify-end"><Button type="button" onClick={onClick}>{label}<ChevronRight className="size-4" /></Button></div>;
}

function WizardFooter({ step, onPrevious, onNext }: { step: TrainingCourseWizardStep; onPrevious: () => void; onNext: () => void }) {
  const first = step === TRAINING_COURSE_WIZARD_STEPS[0].id;
  const last = step === TRAINING_COURSE_WIZARD_STEPS[TRAINING_COURSE_WIZARD_STEPS.length - 1].id;
  return (
    <div className="flex justify-between border-t border-border-default pt-4">
      <Button type="button" variant="ghost" disabled={first} onClick={onPrevious}>Anterior</Button>
      <Button type="button" variant="ghost" disabled={last} onClick={onNext}>Siguiente</Button>
    </div>
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
  reviewReady = true,
}: {
  course: TrainingCourseDto;
  can: (permission: Parameters<ReturnType<typeof useAppStore>["can"]>[0]) => boolean;
  pending: boolean;
  onTransition: (action: Parameters<typeof transitionTrainingCourse>[1]) => void;
  onEdit: () => void;
  reviewReady?: boolean;
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
        <Button key={item.action} type="button" variant={item.action === "archive" || item.action === "retire" ? "secondary" : "default"} disabled={pending || (item.action === "submit-review" && !reviewReady)} onClick={() => onTransition(item.action)}>
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
  const reorder = useMutation({
    mutationFn: (entityIds: string[]) => reorderTrainingCourseModules(course.id, entityIds),
    onSuccess: onChanged,
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible reordenar los módulos.")),
  });
  const moveModule = (moduleId: string, direction: -1 | 1) => {
    reorder.mutate(moveTrainingEntity(course.modules.map((item) => item.id), moduleId, direction));
  };
  return (
    <section className="space-y-4" aria-labelledby="course-structure-title">
      <div>
        <h2 id="course-structure-title" className="text-xl font-semibold">Estructura del curso</h2>
        <p className="text-sm text-text-secondary">Construye módulos, lecciones, recursos y práctica en el orden exacto que seguirá el participante.</p>
      </div>
      {course.modules.length ? course.modules.map((module, index) => (
        <ModuleEditor key={module.id} module={module} index={index} total={course.modules.length} editable={editable} moving={reorder.isPending} onMove={moveModule} onChanged={onChanged} />
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

function OrderButtons({ label, index, total, pending, onMove }: { label: string; index: number; total: number; pending: boolean; onMove: (direction: -1 | 1) => void }) {
  return (
    <div className="flex gap-1">
      <Button type="button" size="icon" variant="ghost" aria-label={`Subir ${label}`} disabled={index === 0 || pending} onClick={() => onMove(-1)}><ArrowUp className="size-4" /></Button>
      <Button type="button" size="icon" variant="ghost" aria-label={`Bajar ${label}`} disabled={index === total - 1 || pending} onClick={() => onMove(1)}><ArrowDown className="size-4" /></Button>
    </div>
  );
}

function ModuleEditor({ module, index, total, editable, moving, onMove, onChanged }: { module: TrainingCourseDto["modules"][number]; index: number; total: number; editable: boolean; moving: boolean; onMove: (moduleId: string, direction: -1 | 1) => void; onChanged: () => Promise<void> }) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(module.title);
  const [description, setDescription] = useState(module.description ?? "");
  const [isRequired, setIsRequired] = useState(module.isRequired);
  const [lessonTitle, setLessonTitle] = useState("");
  const update = useMutation({ mutationFn: () => updateTrainingCourseModule(module.id, { title, description: description || undefined, isRequired }), onSuccess: async () => { setEditing(false); await onChanged(); } });
  const remove = useMutation({ mutationFn: () => deleteTrainingCourseModule(module.id), onSuccess: onChanged });
  const duplicate = useMutation({ mutationFn: () => duplicateTrainingCourseModule(module.id), onSuccess: async () => { toast.success("Módulo duplicado"); await onChanged(); } });
  const createLesson = useMutation({
    mutationFn: () => createTrainingLesson(module.id, { title: lessonTitle, sortOrder: module.lessons.length }),
    onSuccess: async () => { setLessonTitle(""); await onChanged(); },
  });
  const reorder = useMutation({
    mutationFn: (entityIds: string[]) => reorderTrainingLessons(module.id, entityIds),
    onSuccess: onChanged,
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible reordenar las lecciones.")),
  });
  const moveLesson = (lessonId: string, direction: -1 | 1) => {
    reorder.mutate(moveTrainingEntity(module.lessons.map((item) => item.id), lessonId, direction));
  };
  return (
    <Card level={2}>
      <CardHeader className="flex-row items-start gap-3">
        <Button type="button" size="icon" variant="ghost" aria-label={expanded ? "Contraer módulo" : "Expandir módulo"} onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronDown /> : <ChevronRight />}
        </Button>
        <div className="min-w-0 flex-1">
          {editing ? <div className="space-y-2"><Input aria-label="Título del módulo" value={title} onChange={(event) => setTitle(event.target.value)} /><textarea aria-label="Descripción del módulo" className="min-h-20 w-full rounded-xl border border-border-default bg-surface-elevated p-3 text-sm" placeholder="Qué logrará el participante en este módulo" value={description} onChange={(event) => setDescription(event.target.value)} /><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isRequired} onChange={(event) => setIsRequired(event.target.checked)} />Módulo obligatorio</label></div> : <><CardTitle>{module.title}</CardTitle>{module.description ? <p className="mt-1 text-sm text-text-secondary">{module.description}</p> : null}</>}
          <p className="mt-1 text-xs text-text-secondary">{module.lessons.length} lecciones · {module.isRequired ? "Obligatorio" : "Opcional"}</p>
        </div>
        {editable ? <div className="flex flex-wrap justify-end gap-1"><OrderButtons label={module.title} index={index} total={total} pending={moving} onMove={(direction) => onMove(module.id, direction)} />{editing ? <Button type="button" size="sm" onClick={() => update.mutate()} disabled={!title.trim() || update.isPending}>Guardar</Button> : <Button type="button" size="icon" variant="ghost" aria-label={`Editar ${module.title}`} onClick={() => setEditing(true)}><Pencil className="size-4" /></Button>}<Button type="button" size="icon" variant="ghost" aria-label={`Duplicar ${module.title}`} onClick={() => duplicate.mutate()} disabled={duplicate.isPending}><Copy className="size-4" /></Button><Button type="button" size="icon" variant="ghost" aria-label={`Eliminar ${module.title}`} onClick={() => remove.mutate()} disabled={remove.isPending}><Trash2 className="size-4 text-status-danger" /></Button></div> : null}
      </CardHeader>
      {expanded ? <CardContent className="space-y-3">{module.lessons.map((lesson, lessonIndex) => <LessonEditor key={lesson.id} courseId={module.courseId} lesson={lesson} index={lessonIndex} total={module.lessons.length} editable={editable} moving={reorder.isPending} onMove={moveLesson} onChanged={onChanged} />)}{editable ? <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(event) => { event.preventDefault(); if (lessonTitle.trim()) createLesson.mutate(); }}><Input aria-label="Título de la nueva lección" placeholder="Nueva lección" value={lessonTitle} onChange={(event) => setLessonTitle(event.target.value)} /><Button type="submit" variant="secondary" disabled={!lessonTitle.trim() || createLesson.isPending}><Plus className="size-4" />Lección</Button></form> : null}</CardContent> : null}
    </Card>
  );
}

function LessonEditor({ courseId, lesson, index, total, editable, moving, onMove, onChanged }: { courseId: string; lesson: TrainingCourseDto["modules"][number]["lessons"][number]; index: number; total: number; editable: boolean; moving: boolean; onMove: (lessonId: string, direction: -1 | 1) => void; onChanged: () => Promise<void> }) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(lesson.title);
  const [description, setDescription] = useState(lesson.description ?? "");
  const [estimatedMinutes, setEstimatedMinutes] = useState(lesson.estimatedMinutes ?? 0);
  const [isRequired, setIsRequired] = useState(lesson.isRequired);
  const [blockOpen, setBlockOpen] = useState(false);
  const upload = useMutation({
    mutationFn: async (file: File) => uploadTrainingVideo(courseId, { file, lessonId: lesson.id, title, description: description || undefined, durationSeconds: await readVideoDuration(file), isMandatory: isRequired }),
    onSuccess: async () => { toast.success("Video cargado en el almacenamiento de Railway"); await onChanged(); },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible cargar el video.")),
  });
  const update = useMutation({ mutationFn: () => updateTrainingLesson(lesson.id, { title, description: description || undefined, estimatedMinutes, isRequired }), onSuccess: async () => { setEditing(false); await onChanged(); } });
  const remove = useMutation({ mutationFn: () => deleteTrainingLesson(lesson.id), onSuccess: onChanged });
  const duplicate = useMutation({ mutationFn: () => duplicateTrainingLesson(lesson.id), onSuccess: async () => { toast.success("Lección duplicada"); await onChanged(); } });
  const reorder = useMutation({
    mutationFn: (entityIds: string[]) => reorderTrainingContentBlocks(lesson.id, entityIds),
    onSuccess: onChanged,
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible reordenar los bloques.")),
  });
  const moveBlock = (blockId: string, direction: -1 | 1) => {
    reorder.mutate(moveTrainingEntity(lesson.blocks.map((item) => item.id), blockId, direction));
  };
  return (
    <div className="rounded-xl border border-border-default bg-surface-section p-3">
      <div className="flex items-start gap-2">
        <Button type="button" size="icon" variant="ghost" aria-label={expanded ? "Contraer lección" : "Expandir lección"} onClick={() => setExpanded(!expanded)}>{expanded ? <ChevronDown /> : <ChevronRight />}</Button>
        <div className="min-w-0 flex-1">{editing ? <div className="grid gap-2 sm:grid-cols-[1fr_9rem]"><Input aria-label="Título de la lección" value={title} onChange={(event) => setTitle(event.target.value)} /><Input aria-label="Duración estimada en minutos" type="number" min={0} value={estimatedMinutes} onChange={(event) => setEstimatedMinutes(Number(event.target.value))} /><textarea aria-label="Descripción de la lección" className="min-h-20 rounded-xl border border-border-default bg-surface-elevated p-3 text-sm sm:col-span-2" placeholder="Objetivo y contexto de la lección" value={description} onChange={(event) => setDescription(event.target.value)} /><label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={isRequired} onChange={(event) => setIsRequired(event.target.checked)} />Lección obligatoria</label></div> : <><p className="font-medium">{lesson.title}</p>{lesson.description ? <p className="text-sm text-text-secondary">{lesson.description}</p> : null}<p className="text-xs text-text-secondary">{lesson.estimatedMinutes || 0} min · {lesson.isRequired ? "Obligatoria" : "Opcional"} · {lesson.blocks.length} bloques</p></>}</div>
        {editable ? <div className="flex flex-wrap gap-1"><OrderButtons label={lesson.title} index={index} total={total} pending={moving} onMove={(direction) => onMove(lesson.id, direction)} />{editing ? <Button type="button" size="sm" onClick={() => update.mutate()} disabled={!title.trim() || update.isPending}>Guardar</Button> : <Button type="button" size="icon" variant="ghost" aria-label={`Editar ${lesson.title}`} onClick={() => setEditing(true)}><Pencil className="size-4" /></Button>}<label className="inline-flex cursor-pointer items-center justify-center rounded-md px-2 text-sm hover:bg-muted" title="Cargar video MP4"><Video className="size-4" /><input className="sr-only" type="file" accept="video/mp4,.mp4" disabled={upload.isPending} onChange={(event) => { const file = event.target.files?.[0]; if (file) upload.mutate(file); event.currentTarget.value = ""; }} /></label><Button type="button" size="icon" variant="ghost" aria-label={`Duplicar ${lesson.title}`} onClick={() => duplicate.mutate()} disabled={duplicate.isPending}><Copy className="size-4" /></Button><Button type="button" size="icon" variant="ghost" aria-label={`Eliminar ${lesson.title}`} onClick={() => remove.mutate()}><Trash2 className="size-4 text-status-danger" /></Button></div> : null}
      </div>
      {expanded ? <div className="mt-3 space-y-2 pl-0 sm:pl-12">{lesson.blocks.map((block, blockIndex) => <BlockEditor key={block.id} block={block} index={blockIndex} total={lesson.blocks.length} editable={editable} moving={reorder.isPending} onMove={moveBlock} onChanged={onChanged} />)}{editable ? <Button type="button" size="sm" variant="secondary" onClick={() => setBlockOpen(true)}><Plus className="size-4" />Agregar contenido</Button> : null}</div> : null}
      <BlockFormDialog lessonId={lesson.id} open={blockOpen} onOpenChange={setBlockOpen} onSaved={onChanged} />
    </div>
  );
}

function readVideoDuration(file: File) {
  return new Promise<number>((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    video.preload = "metadata";
    video.onloadedmetadata = () => { URL.revokeObjectURL(url); const duration = Math.round(video.duration); duration > 0 ? resolve(duration) : reject(new Error("El video no tiene una duración válida.")); };
    video.onerror = () => { URL.revokeObjectURL(url); reject(new Error("No fue posible leer el video MP4.")); };
    video.src = url;
  });
}

function BlockEditor({ block, index, total, editable, moving, onMove, onChanged }: { block: TrainingContentBlockDto; index: number; total: number; editable: boolean; moving: boolean; onMove: (blockId: string, direction: -1 | 1) => void; onChanged: () => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const remove = useMutation({ mutationFn: () => deleteTrainingContentBlock(block.id), onSuccess: onChanged });
  const duplicate = useMutation({ mutationFn: () => duplicateTrainingContentBlock(block.id), onSuccess: async () => { toast.success("Bloque duplicado"); await onChanged(); } });
  const Icon = block.type === "VIDEO" ? Video : block.type === "LINK" ? Link2 : FileText;
  const summary = trainingBlockSummary(block.type, block.content);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border-default bg-surface-elevated p-3">
      <Icon className="size-5 text-primary" />
      <div className="min-w-0 flex-1"><p className="font-medium">{block.title || blockLabels[block.type]}</p><p className="text-xs text-text-secondary">{blockLabels[block.type]} · {block.isRequired ? "Obligatorio" : "Opcional"}{summary ? ` · ${summary}` : ""}</p></div>
      {editable ? <div className="flex flex-wrap gap-1"><OrderButtons label={block.title || blockLabels[block.type]} index={index} total={total} pending={moving} onMove={(direction) => onMove(block.id, direction)} /><Button type="button" size="icon" variant="ghost" aria-label="Editar bloque" onClick={() => setEditing(true)}><Pencil className="size-4" /></Button><Button type="button" size="icon" variant="ghost" aria-label="Duplicar bloque" onClick={() => duplicate.mutate()} disabled={duplicate.isPending}><Copy className="size-4" /></Button><Button type="button" size="icon" variant="ghost" aria-label="Eliminar bloque" onClick={() => remove.mutate()}><Trash2 className="size-4 text-status-danger" /></Button></div> : null}
      <BlockFormDialog lessonId={block.lessonId} block={block} open={editing} onOpenChange={setEditing} onSaved={onChanged} />
    </div>
  );
}

function BlockFormDialog({ lessonId, block, open, onOpenChange, onSaved }: { lessonId: string; block?: TrainingContentBlockDto; open: boolean; onOpenChange: (open: boolean) => void; onSaved: () => Promise<void> }) {
  const [type, setType] = useState<TrainingContentBlockType>(block?.type ?? "RICH_TEXT");
  const [title, setTitle] = useState(block?.title ?? "");
  const initialContent = block?.content ?? {};
  const [value, setValue] = useState(block?.resourceUrl ?? String(initialContent.text ?? initialContent.instructions ?? initialContent.quizId ?? ""));
  const [transcriptUrl, setTranscriptUrl] = useState(String(initialContent.transcriptUrl ?? ""));
  const [captionsUrl, setCaptionsUrl] = useState(String(initialContent.captionsUrl ?? ""));
  const [accessibilityNote, setAccessibilityNote] = useState(String(initialContent.accessibilityNote ?? ""));
  const [evidenceType, setEvidenceType] = useState(String(initialContent.evidenceType ?? "Archivo entregable"));
  const [rubric, setRubric] = useState(String(initialContent.rubric ?? ""));
  const [isRequired, setIsRequired] = useState(block?.isRequired ?? true);
  const resource = ["VIDEO", "FILE", "LINK"].includes(type);
  const save = useMutation({
    mutationFn: () => {
      const content = type === "TASK"
        ? { instructions: value, evidenceType, rubric }
        : type === "QUIZ"
          ? { quizId: value }
          : resource
            ? { transcriptUrl, captionsUrl, accessibilityNote }
            : { text: value };
      const input = { type, title: title || undefined, isRequired, content, ...(resource ? { resourceUrl: value } : {}) };
      return block ? updateTrainingContentBlock(block.id, input) : createTrainingContentBlock(lessonId, input);
    },
    onSuccess: async () => { toast.success(block ? "Bloque actualizado" : "Bloque añadido"); onOpenChange(false); await onSaved(); },
  });
  const valueLabel = resource ? "URL del recurso" : type === "TASK" ? "Instrucciones para el participante" : type === "QUIZ" ? "ID de la evaluación" : "Contenido";
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={block ? "Editar contenido" : "Añadir contenido"} description="Configura el recurso, la actividad o la evaluación con criterios claros para el participante.">
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); if (value.trim()) save.mutate(); }}>
        <FormErrorSummary serverError={save.error} />
        <FormField id="block-type" label="Tipo">{(field) => <Select value={type} onValueChange={(next) => { setType(next as TrainingContentBlockType); setValue(""); }}><SelectTrigger {...field}><SelectValue /></SelectTrigger><SelectContent>{Object.entries(blockLabels).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select>}</FormField>
        <FormField id="block-title" label="Título">{(field) => <Input {...field} value={title} onChange={(event) => setTitle(event.target.value)} />}</FormField>
        <FormField id="block-value" label={valueLabel} required>{(field) => resource || type === "QUIZ" ? <Input {...field} type={resource ? "url" : "text"} value={value} onChange={(event) => setValue(event.target.value)} /> : <textarea {...field} className="min-h-32 w-full rounded-2xl border border-border-default bg-surface-elevated p-4" value={value} onChange={(event) => setValue(event.target.value)} />}</FormField>
        {type === "VIDEO" ? <div className="grid gap-4 sm:grid-cols-2"><FormField id="block-transcript" label="URL de transcripción">{(field) => <Input {...field} type="url" value={transcriptUrl} onChange={(event) => setTranscriptUrl(event.target.value)} />}</FormField><FormField id="block-captions" label="URL de subtítulos">{(field) => <Input {...field} type="url" value={captionsUrl} onChange={(event) => setCaptionsUrl(event.target.value)} />}</FormField></div> : null}
        {type === "FILE" || type === "LINK" ? <FormField id="block-accessibility" label="Nota de accesibilidad">{(field) => <Input {...field} placeholder="Ej. PDF etiquetado y apto para lector de pantalla" value={accessibilityNote} onChange={(event) => setAccessibilityNote(event.target.value)} />}</FormField> : null}
        {type === "TASK" ? <div className="grid gap-4 sm:grid-cols-2"><FormField id="block-evidence" label="Evidencia esperada" required>{(field) => <Select value={evidenceType} onValueChange={setEvidenceType}><SelectTrigger {...field}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Archivo entregable">Archivo entregable</SelectItem><SelectItem value="Respuesta escrita">Respuesta escrita</SelectItem><SelectItem value="Enlace externo">Enlace externo</SelectItem><SelectItem value="Validación del supervisor">Validación del supervisor</SelectItem></SelectContent></Select>}</FormField><FormField id="block-rubric" label="Criterios de aceptación">{(field) => <Input {...field} placeholder="Qué debe demostrar para aprobar" value={rubric} onChange={(event) => setRubric(event.target.value)} />}</FormField></div> : null}
        <label className="flex items-center gap-2 rounded-xl bg-surface-section p-3 text-sm"><input type="checkbox" checked={isRequired} onChange={(event) => setIsRequired(event.target.checked)} />Este contenido es obligatorio para completar la lección</label>
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
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Vista previa del participante"
      description="Revisión de solo lectura: no guarda progreso ni modifica el curso."
      className="sm:h-[min(52rem,calc(100dvh-3rem))] sm:max-w-5xl"
      footer={<div className="flex justify-end"><Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cerrar vista previa</Button></div>}
    >
      {query.isLoading ? <AsyncState state="loading" title="Preparando vista previa" /> : null}
      {query.isError ? <AsyncState state="error" title="No fue posible abrir la vista previa" onRetry={() => void query.refetch()} /> : null}
      {query.data ? <article className="mx-auto max-w-4xl space-y-6 pb-2">{query.data.coverImageUrl ? <div role="img" aria-label={`Portada de ${query.data.title}`} className="aspect-[16/6] w-full rounded-2xl bg-cover bg-center shadow-sm" style={{ backgroundImage: `url("${query.data.coverImageUrl.replace(/"/g, "%22")}")` }} /> : null}<div><div className="flex flex-wrap gap-2"><CourseStatusBadge status={query.data.status} /><Badge>{query.data.difficulty}</Badge><Badge>{query.data.estimatedMinutes} min</Badge><Badge variant="secondary">Solo lectura</Badge></div><h2 className="mt-4 text-3xl font-semibold">{query.data.title}</h2><p className="mt-2 text-text-secondary">{query.data.summary}</p></div>{query.data.modules.map((module, moduleIndex) => <section key={module.id} className="space-y-3 rounded-2xl border border-border-default bg-surface-section/40 p-4 sm:p-5"><div className="flex items-center gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{moduleIndex + 1}</span><h3 className="text-xl font-semibold">{module.title}</h3></div>{module.lessons.map((lesson, lessonIndex) => { const externalVideoUrl = lesson.videoUrl ?? lesson.blocks.find((block) => block.type === "VIDEO" && block.resourceUrl)?.resourceUrl; const storedVideo = lesson.type === "VIDEO" && !externalVideoUrl && Boolean(lesson.durationSeconds); return <div key={lesson.id} className="rounded-xl border border-border-default bg-card p-4"><p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Lección {moduleIndex + 1}.{lessonIndex + 1}</p><h4 className="mt-1 font-medium">{lesson.title}</h4>{externalVideoUrl ? <video className="mt-4 aspect-video w-full rounded-xl bg-black" controls playsInline preload="metadata" src={resolveTrainingAssetUrl(externalVideoUrl) ?? externalVideoUrl} aria-label={`Video de ${lesson.title}`} /> : storedVideo && courseId ? <AuthenticatedTrainingVideo courseId={courseId} lessonId={lesson.id} title={lesson.title} /> : null}<ul className="mt-3 space-y-2">{lesson.blocks.map((block) => <li key={block.id} className="flex gap-2 text-sm text-text-secondary"><FileText className="size-4 shrink-0" />{block.title || blockLabels[block.type]}</li>)}</ul></div>; })}</section>)}</article> : null}
    </ResponsiveDialog>
  );
}

function AuthenticatedTrainingVideo({ courseId, lessonId, title }: { courseId: string; lessonId: string; title: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    void fetchTrainingAdminVideo(courseId, lessonId).then((blob) => {
      if (!active) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [courseId, lessonId]);
  if (error) return <p className="mt-4 rounded-xl bg-status-danger/10 p-3 text-sm text-status-danger">No fue posible cargar el video.</p>;
  if (!url) return <div className="mt-4 aspect-video w-full animate-pulse rounded-xl bg-muted" aria-label="Cargando video" />;
  return <video className="mt-4 aspect-video w-full rounded-xl bg-black" controls playsInline preload="metadata" src={url} aria-label={`Video de ${title}`} />;
}
