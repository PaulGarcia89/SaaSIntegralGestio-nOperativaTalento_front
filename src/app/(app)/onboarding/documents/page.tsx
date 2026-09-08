"use client";

import { useUiText } from "@/components/ui-copy";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  FileCheck2,
  FileSignature,
  History,
  Plus,
  Upload,
  UserRoundCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  applyOnboardingTemplate,
  approveOnboardingTemplate,
  completeOnboardingFlow,
  createOnboardingTask,
  createOnboardingTemplate,
  deleteOnboardingDocument,
  deleteOnboardingTask,
  downloadOnboardingDocument,
  fetchOnboardingContext,
  fetchOnboardingFlows,
  fetchOnboardingTemplates,
  getApiErrorMessage,
  reviewOnboardingDocument,
  reviseOnboardingTemplate,
  reorderOnboardingTasks,
  replaceOnboardingDocument,
  updateOnboardingDocumentLifecycle,
  updateOnboardingTemplateStatus,
  updateOnboardingTask,
  uploadOnboardingDocument,
} from "@/lib/backend";
import type {
  EmployeeOnboardingDocumentDto,
  EmployeeOnboardingFlowDto,
  EmployeeOnboardingTaskDto,
  OnboardingContextDto,
  OnboardingOwnerType,
  OnboardingTemplateTaskConfigDto,
} from "@/lib/contracts";
import { getOnboardingTaskOwnerInput } from "@/lib/onboarding-assignment";
import {
  buildOnboardingBlockingReason,
  ONBOARDING_BLOCK_REASONS,
  type OnboardingBlockReasonCode,
} from "@/lib/onboarding-blocking";
import { getOnboardingTimelineActor } from "@/lib/onboarding-timeline";
import {
  createOnboardingTemplateTask,
  moveOnboardingTemplateTask,
  onboardingTemplateTaskErrors,
  prepareOnboardingTemplateTasks,
  removeOnboardingTemplateTask,
} from "@/lib/onboarding-template-editor";
import {
  getOnboardingDocumentSecurity,
  MAX_ONBOARDING_DOCUMENT_SIZE_BYTES,
  ONBOARDING_DOCUMENT_MIME_TYPES,
  validateOnboardingDocumentFile,
} from "@/lib/onboarding-document-security";
import { useAppStore } from "@/store/app-store";
import { InlineFeedback } from "@/components/design-system";
import {
  ActionBar,
  BlockerList,
  EmptyState,
  EntityCard,
  EntityCardList,
  ErrorState,
  FilterBar,
  InlineNote,
  PageHeader,
  SkeletonRows,
  StatusBadge,
  type Tone,
} from "@/components/system";
import {
  blockerOwner,
  onboardingBlockers,
  onboardingHeadline,
  onboardingProgress,
} from "@/lib/onboarding-operation";
import { FileUpload } from "@/components/ui/file-upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * Estado de una incorporación, derivado de sus tareas.
 *
 * No hay un campo «estado legible» en el contrato, y en vez de inventar una
 * escala se cuenta lo que sí existe: `task.overdue` marca el retraso y
 * `status === "COMPLETED"` el avance. Cuatro estados y ninguno depende del
 * color: `StatusBadge` pone icono y palabra.
 */
function estadoDeIncorporacion(flow: EmployeeOnboardingFlowDto): { label: string; tone: Tone } {
  const { total, completed, pending, overdue } = onboardingProgress(flow);
  if (overdue > 0) return { label: overdue === 1 ? "1 tarea vencida" : `${overdue} tareas vencidas`, tone: "danger" };
  if (total > 0 && pending === 0) return { label: "Completa", tone: "success" };
  if (completed > 0) return { label: "En curso", tone: "info" };
  if (total === 0) return { label: "Sin plantilla", tone: "neutral" };
  return { label: "Sin empezar", tone: "neutral" };
}

const starterTasks: OnboardingTemplateTaskConfigDto[] = [
  { taskKey: "documents", taskType: "DOCUMENT_COLLECTION", title: "Documentos de ingreso", description: "Recopilar y validar documentos obligatorios.", ownerType: "SYSTEM", dueOffsetDays: 2, dependsOnKeys: [], required: true, sortOrder: 0 },
  { taskKey: "hr-checklist", taskType: "HR_CHECKLIST", title: "Validación de RRHH", description: "Confirmar expediente, datos laborales y políticas.", ownerType: "SYSTEM", dueOffsetDays: 4, dependsOnKeys: ["documents"], required: true, sortOrder: 1 },
  { taskKey: "manager-checklist", taskType: "MANAGER_CHECKLIST", title: "Preparación del supervisor", description: "Definir objetivos, agenda y acompañamiento del primer día.", ownerType: "SYSTEM", dueOffsetDays: 5, dependsOnKeys: ["hr-checklist"], required: true, sortOrder: 2 },
  { taskKey: "day-one", taskType: "DAY_ONE_READINESS", title: "Preparación del primer día", description: "Verificar accesos, equipo, agenda y persona responsable.", ownerType: "SYSTEM", dueOffsetDays: 7, dependsOnKeys: ["manager-checklist"], required: true, sortOrder: 3 },
  { taskKey: "asset-delivery", taskType: "ASSET_DELIVERY", title: "Entrega de equipo de trabajo", description: "Asignar el activo, confirmar custodia y conservar evidencia.", ownerType: "SYSTEM", dueOffsetDays: 6, dependsOnKeys: ["hr-checklist"], required: true, sortOrder: 4 },
];

const taskTypeOptions: Array<{
  value: OnboardingTemplateTaskConfigDto["taskType"];
  label: string;
}> = [
  { value: "DOCUMENT_COLLECTION", label: "Recopilación documental" },
  { value: "POLICY_REVIEW", label: "Revisión de políticas" },
  { value: "HR_CHECKLIST", label: "Lista de verificación de RRHH" },
  { value: "MANAGER_CHECKLIST", label: "Lista de verificación del supervisor" },
  { value: "DAY_ONE_READINESS", label: "Preparación del primer día" },
  { value: "ASSET_DELIVERY", label: "Entrega de activos" },
];

const ownerTypeOptions: Array<{
  value: NonNullable<OnboardingTemplateTaskConfigDto["ownerType"]>;
  label: string;
}> = [
  { value: "SYSTEM", label: "Sin responsable nominal" },
  { value: "USER", label: "Persona específica" },
  { value: "EMPLOYEE", label: "Empleado" },
  { value: "CANDIDATE", label: "Candidato" },
  { value: "BRANCH", label: "Sucursal" },
  { value: "INVENTORY", label: "Equipo de inventario" },
  { value: "TRAINING", label: "Equipo de capacitación" },
  { value: "ACCESS", label: "Equipo de accesos" },
  { value: "SIGNATURE", label: "Equipo de firmas" },
  { value: "ONBOARDING", label: "Equipo de incorporación" },
  { value: "PRODUCTIVITY", label: "Equipo de productividad" },
];

type TaskUpdate = {
  id: string;
  status?: string;
  blockingReason?: string | null;
  dueDate?: string;
  ownerType?: OnboardingOwnerType;
  ownerId?: string | null;
};

export default function OnboardingDocumentsPage() {
  const uiText = useUiText();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const { currentBranch, can } = useAppStore();
  const [selectedId, setSelectedId] = useState(() =>
    typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("flowId") ?? "",
  );
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateLibraryOpen, setTemplateLibraryOpen] = useState(false);
  const [uploadTask, setUploadTask] = useState<EmployeeOnboardingTaskDto | null>(null);
  const [assignmentTask, setAssignmentTask] = useState<EmployeeOnboardingTaskDto | null>(null);
  const [blockingTask, setBlockingTask] = useState<EmployeeOnboardingTaskDto | null>(null);
  const [blockingReasonCode, setBlockingReasonCode] = useState<OnboardingBlockReasonCode | "">("");
  const [blockingObservations, setBlockingObservations] = useState("");
  const [assignmentOwnerType, setAssignmentOwnerType] = useState<OnboardingOwnerType>("SYSTEM");
  const [assignmentOwnerId, setAssignmentOwnerId] = useState("");
  const [assignmentDueDate, setAssignmentDueDate] = useState("");
  const [templateName, setTemplateName] = useState("Incorporación estándar");
  const [templateDescription, setTemplateDescription] = useState(
    "Lista de verificación reutilizable con dependencias y fechas relativas.",
  );
  const [templateIsDefault, setTemplateIsDefault] = useState(true);
  const [revisionSourceId, setRevisionSourceId] = useState<string | null>(null);
  const [templateTasks, setTemplateTasks] = useState<OnboardingTemplateTaskConfigDto[]>(
    () => starterTasks.map((task) => ({ ...task, dependsOnKeys: [...(task.dependsOnKeys ?? [])] })),
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploadValidationError, setUploadValidationError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [flowStatus, setFlowStatus] = useState("");
  const [flowPage, setFlowPage] = useState(1);
  const [taskDraft, setTaskDraft] = useState<OnboardingTemplateTaskConfigDto | null>(null);
  const [taskDraftId, setTaskDraftId] = useState<string | null>(null);
  const [reviewDocument, setReviewDocument] = useState<EmployeeOnboardingDocumentDto | null>(null);
  const [reviewReason, setReviewReason] = useState("");
  const [lifecycleDocument, setLifecycleDocument] = useState<EmployeeOnboardingDocumentDto | null>(null);
  const [documentExpiresAt, setDocumentExpiresAt] = useState("");
  const [replacementDocument, setReplacementDocument] = useState<EmployeeOnboardingDocumentDto | null>(null);
  const [replacementFiles, setReplacementFiles] = useState<File[]>([]);

  const flows = useQuery({
    queryKey: ["onboarding-flows", currentBranch?.id, deferredSearch, flowStatus, flowPage],
    queryFn: () => fetchOnboardingFlows({
      branchId: currentBranch?.id,
      search: deferredSearch || undefined,
      status: flowStatus || undefined,
      page: flowPage,
      pageSize: 12,
    }),
  });
  const templates = useQuery({
    queryKey: ["onboarding-templates"],
    queryFn: fetchOnboardingTemplates,
  });
  const context = useQuery({
    queryKey: ["onboarding-context", currentBranch?.id],
    queryFn: () => fetchOnboardingContext(currentBranch?.id),
    enabled: can("onboarding.manage"),
  });
  const selected = useMemo(
    () => flows.data?.items.find((flow) => flow.id === selectedId) ?? flows.data?.items[0] ?? null,
    [flows.data, selectedId],
  );
  const templateErrors = useMemo(
    () => onboardingTemplateTaskErrors(templateTasks),
    [templateTasks],
  );
  const assignmentOwnerInput = useMemo(
    () => getOnboardingTaskOwnerInput(assignmentOwnerType, assignmentOwnerId),
    [assignmentOwnerId, assignmentOwnerType],
  );
  const blockingReason = useMemo(
    () => buildOnboardingBlockingReason(blockingReasonCode, blockingObservations),
    [blockingObservations, blockingReasonCode],
  );

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["onboarding-flows"] });
  };
  const createTemplate = useMutation({
    mutationFn: () => revisionSourceId
      ? reviseOnboardingTemplate(revisionSourceId, {
        description: templateDescription.trim() || undefined,
        tasks: prepareOnboardingTemplateTasks(templateTasks),
      })
      : createOnboardingTemplate({
        name: templateName.trim(),
        description: templateDescription.trim() || undefined,
        isDefault: templateIsDefault,
        tasks: prepareOnboardingTemplateTasks(templateTasks),
      }),
    onSuccess: async (template) => {
      await queryClient.invalidateQueries({ queryKey: ["onboarding-templates"] });
      setSelectedTemplateId(template.id);
      setTemplateOpen(false);
      setRevisionSourceId(null);
      setTemplateName("Incorporación estándar");
      setTemplateDescription("Lista de verificación reutilizable con dependencias y fechas relativas.");
      setTemplateIsDefault(true);
      setTemplateTasks(
        starterTasks.map((task) => ({ ...task, dependsOnKeys: [...(task.dependsOnKeys ?? [])] })),
      );
      toast.success("Plantilla creada");
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible crear la plantilla.")),
  });
  const applyTemplate = useMutation({
    mutationFn: () => applyOnboardingTemplate(selected!.id, selectedTemplateId),
    onSuccess: async () => {
      await refresh();
      toast.success("Lista de verificación aplicada al expediente");
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible aplicar la plantilla.")),
  });
  const updateTask = useMutation({
    mutationFn: ({ id, ...input }: TaskUpdate) => updateOnboardingTask(id, input),
    onSuccess: async () => {
      await refresh();
      setAssignmentTask(null);
      setBlockingTask(null);
      setBlockingReasonCode("");
      setBlockingObservations("");
      toast.success("Tarea actualizada");
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible actualizar la tarea.")),
  });
  const createTask = useMutation({
    mutationFn: () =>
      createOnboardingTask(selected!.id, {
        ...taskDraft!,
        taskKey: taskDraft!.taskKey.trim(),
        title: taskDraft!.title.trim(),
        description: taskDraft!.description?.trim() || null,
        dependsOnKeys: (taskDraft!.dependsOnKeys ?? []).filter((key) => key !== taskDraft!.taskKey),
      }),
    onSuccess: async () => { await refresh(); setTaskDraft(null); setTaskDraftId(null); toast.success("Tarea creada"); },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible crear la tarea.")),
  });
  const editTask = useMutation({
    mutationFn: () => updateOnboardingTask(taskDraftId!, {
      title: taskDraft!.title,
      description: taskDraft!.description ?? undefined,
      taskType: taskDraft!.taskType,
      ownerType: taskDraft!.ownerType,
      ownerId: taskDraft!.ownerType === "USER" ? taskDraft!.ownerId : null,
      dependsOnKeys: taskDraft!.dependsOnKeys,
      required: taskDraft!.required,
    }),
    onSuccess: async () => { await refresh(); setTaskDraft(null); setTaskDraftId(null); toast.success("Tarea editada"); },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible editar la tarea.")),
  });
  const removeTask = useMutation({
    mutationFn: deleteOnboardingTask,
    onSuccess: async () => { await refresh(); toast.success("Tarea eliminada"); },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible eliminar la tarea.")),
  });
  const reorderTasks = useMutation({
    mutationFn: (tasks: EmployeeOnboardingTaskDto[]) => reorderOnboardingTasks(selected!.id, tasks.map((task, index) => ({ id: task.id, sortOrder: index }))),
    onSuccess: async () => { await refresh(); toast.success("Lista de verificación reordenada"); },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible reordenar las tareas.")),
  });
  const upload = useMutation({
    mutationFn: () =>
      uploadOnboardingDocument(selected!.id, {
        file: files[0],
        taskId: uploadTask?.id,
        category: uploadTask?.taskType ?? "OTHER",
      }),
    onSuccess: async () => {
      await refresh();
      setUploadTask(null);
      setFiles([]);
      setUploadValidationError(null);
      toast.success("Archivo recibido; esperando confirmación de escaneo y almacenamiento privado");
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible cargar el documento.")),
  });
  const review = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: "APPROVED" | "REJECTED"; reason?: string }) =>
      reviewOnboardingDocument(id, status, reason),
    onSuccess: async () => {
      await refresh();
      setReviewDocument(null);
      setReviewReason("");
      toast.success("Revisión registrada");
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible revisar el documento.")),
  });
  const replaceDocument = useMutation({
    mutationFn: () => replaceOnboardingDocument(replacementDocument!.id, replacementFiles[0]),
    onSuccess: async () => { await refresh(); setReplacementDocument(null); setReplacementFiles([]); toast.success("Nueva versión documental cargada"); },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible reemplazar el documento.")),
  });
  const lifecycle = useMutation({
    mutationFn: () => updateOnboardingDocumentLifecycle(lifecycleDocument!.id, documentExpiresAt ? new Date(`${documentExpiresAt}T12:00:00`).toISOString() : undefined),
    onSuccess: async () => { await refresh(); setLifecycleDocument(null); toast.success("Vigencia actualizada"); },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible actualizar la vigencia.")),
  });
  const removeDocument = useMutation({
    mutationFn: deleteOnboardingDocument,
    onSuccess: async () => { await refresh(); toast.success("Documento eliminado"); },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible eliminar el documento.")),
  });
  const closeFlow = useMutation({
    mutationFn: () => completeOnboardingFlow(selected!.id),
    onSuccess: async () => { await refresh(); toast.success("Expediente cerrado y listo para operación"); },
    onError: (error) => toast.error(getApiErrorMessage(error, "El expediente todavía tiene requisitos pendientes.")),
  });
  const templateStatus = useMutation({
    mutationFn: ({ id, input }: { id: string; input: { isActive?: boolean; isDefault?: boolean } }) => updateOnboardingTemplateStatus(id, input),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["onboarding-templates"] }); toast.success("Plantilla actualizada"); },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible actualizar la plantilla.")),
  });
  const approveTemplate = useMutation({
    mutationFn: (id: string) => approveOnboardingTemplate(id, { isDefault: templateIsDefault }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["onboarding-templates"] }); toast.success("Plantilla aprobada y publicada"); },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible aprobar la plantilla.")),
  });
  const download = useMutation({
    mutationFn: async (document: EmployeeOnboardingDocumentDto) => ({
      document,
      blob: await downloadOnboardingDocument(document.id),
    }),
    onSuccess: ({ document, blob }) => {
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = document.originalName;
      link.click();
      URL.revokeObjectURL(url);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible descargar el documento.")),
  });

  const selectFlow = (flowId: string) => {
    setSelectedId(flowId);
    const params = new URLSearchParams(window.location.search);
    params.set("flowId", flowId);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const openAssignment = (task: EmployeeOnboardingTaskDto) => {
    setAssignmentTask(task);
    setAssignmentOwnerType(task.ownerType);
    setAssignmentOwnerId(task.ownerType === "USER" && task.ownerId ? task.ownerId : "");
    setAssignmentDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
  };

  const openBlocking = (task: EmployeeOnboardingTaskDto) => {
    setBlockingTask(task);
    setBlockingReasonCode("");
    setBlockingObservations("");
  };

  const openTaskEditor = (task?: EmployeeOnboardingTaskDto) => {
    if (task) {
      setTaskDraftId(task.id);
      setTaskDraft({
        taskKey: task.taskKey,
        taskType: task.taskType,
        title: task.title,
        description: task.description,
        ownerType: task.ownerType,
        ownerId: task.ownerId,
        dependsOnKeys: task.dependsOnKeys ?? [],
        required: task.required ?? true,
        sortOrder: task.sortOrder ?? 0,
      });
      return;
    }
    setTaskDraftId(null);
    setTaskDraft(createOnboardingTemplateTask(
      selected?.tasks.map((item) => ({
        taskKey: item.taskKey,
        taskType: item.taskType,
        title: item.title,
      })) ?? [],
    ));
  };

  const moveRuntimeTask = (index: number, direction: -1 | 1) => {
    if (!selected) return;
    const destination = index + direction;
    if (destination < 0 || destination >= selected.tasks.length) return;
    const reordered = [...selected.tasks];
    [reordered[index], reordered[destination]] = [reordered[destination], reordered[index]];
    reorderTasks.mutate(reordered);
  };

  const createTemplateVersion = (template: NonNullable<typeof templates.data>[number]) => {
    setRevisionSourceId(template.id);
    setTemplateName(template.name);
    setTemplateDescription(template.description ?? "");
    setTemplateIsDefault(template.isDefault);
    setTemplateTasks(template.tasks.map((task) => ({ ...task, id: undefined, dependsOnKeys: [...(task.dependsOnKeys ?? [])] })));
    setTemplateLibraryOpen(false);
    setTemplateOpen(true);
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={uiText("Personas")}
        title={uiText("Incorporaciones")}
        description={uiText("Cada persona que entra, con sus tareas, responsables y evidencias hasta el primer día.")}
        actions={
          can("onboarding.manage") ? (
            <>
              {/*
                Antes había SEIS botones secundarios seguidos, y dos de ellos
                —«Cumplimiento» y «Documentos y políticas»— llevaban a la misma
                ruta con nombres distintos. Queda una acción principal y los
                destinos, sin repetir ninguno.
              */}
              {/* Automatización, analítica y cumplimiento viven en el
                  dashboard del módulo; aquí solo lo que se hace en esta pantalla. */}
              <Button variant="secondary" onClick={() => setTemplateLibraryOpen(true)}>{uiText("Plantillas")}</Button>
              <Button onClick={() => { setRevisionSourceId(null); setTemplateOpen(true); }}>
                <Plus className="size-4" aria-hidden="true" />
                {uiText("Nueva plantilla")}</Button>
            </>
          ) : undefined
        }
      />

      <FilterBar
        search={search}
        onSearchChange={(value) => { setSearch(value); setFlowPage(1); }}
        searchLabel="Empleado, correo o puesto"
        activeCount={(search ? 1 : 0) + (flowStatus ? 1 : 0)}
        onClear={() => { setSearch(""); setFlowStatus(""); setFlowPage(1); }}
      >
        <label className="min-w-0 flex-1 space-y-1.5 sm:max-w-56">
          <span className="block text-xs font-medium text-ink-2">{uiText("Estado")}</span>
          <Select value={flowStatus || "ALL"} onValueChange={(value) => { setFlowStatus(value === "ALL" ? "" : value); setFlowPage(1); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{uiText("Todos")}</SelectItem>
              <SelectItem value="PENDING">{uiText("Pendiente")}</SelectItem>
              <SelectItem value="IN_PROGRESS">{uiText("En incorporación")}</SelectItem>
              <SelectItem value="BLOCKED">{uiText("Bloqueado")}</SelectItem>
              <SelectItem value="COMPLETED">{uiText("Completado")}</SelectItem>
              <SelectItem value="CANCELLED">{uiText("Cancelado")}</SelectItem>
            </SelectContent>
          </Select>
        </label>
      </FilterBar>

      {flows.isLoading ? <SkeletonRows rows={4} label={uiText("Cargando incorporaciones")} /> : null}
      {flows.isError ? (
        <ErrorState
          title={uiText("No pudimos cargar las incorporaciones")}
          detail={getApiErrorMessage(flows.error, "Conservamos tu contexto. Vuelve a intentarlo.")}
          onRetry={() => void flows.refetch()}
        />
      ) : null}
      {flows.isSuccess && !flows.data.items.length ? (
        <EmptyState
          reason={search || flowStatus ? "no-matches" : "no-records"}
          title={search || flowStatus ? undefined : "Todavía no hay incorporaciones"}
          description={
            search || flowStatus
              ? undefined
              : "Al contratar formalmente a un candidato se creará aquí su expediente y recorrido de ingreso."
          }
          onClearFilters={search || flowStatus ? () => { setSearch(""); setFlowStatus(""); setFlowPage(1); } : undefined}
        />
      ) : null}

      {selected ? (
        <section aria-labelledby="expediente-actual" className="space-y-5 rounded-xl border border-line bg-surface-1 p-5 shadow-e1 sm:p-6">
          {/*
            Este bloque sustituye a una tarjeta que dedicaba dos párrafos a
            explicar qué es la incorporación en general —«convierte la
            contratación en operación real», «checklist aplicado y evidencias
            listas»— y resumía el estado con un distintivo que decía «Bloqueado
            por documentación» ante CUALQUIER alerta, incluidas las que solo
            eran avisos y las que no tenían que ver con documentación.

            Ahora el espacio lo ocupa el estado real de ESTE expediente: cuánto
            lleva, qué lo detiene, quién lo resuelve y cómo. La lógica está en
            `lib/onboarding-operation.ts`, que está probada.
          */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 id="expediente-actual" className="text-xl font-semibold text-ink-1">
                {selected.employee.name}
              </h2>
              <p className="text-sm text-ink-2">
                {selected.employee.jobTitle || "Puesto por confirmar"} · {selected.branch.name}
              </p>
            </div>
            <StatusBadge label={onboardingHeadline(selected).label} tone={onboardingHeadline(selected).tone} />
          </div>

          {/* Avance gráfico: un tramo por tarea. Verde = hecha, ámbar =
              bloqueada, rojo = vencida, gris = pendiente. Sustituye a cuatro
              cifras que decían lo mismo en números. */}
          <TaskProgress flow={selected} />

          {/* La siguiente tarea, en singular y con su responsable. */}
          {selected.nextAction ? (
            <div className="relative overflow-hidden rounded-lg border border-accent-line/40 bg-surface-2 p-4">
              <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-accent-fill" />
              <div className="pl-3">
                <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-accent-ink">{uiText("Lo siguiente")}</p>
                <p className="mt-0.5 font-medium text-ink-1">{selected.nextAction.title}</p>
                <p className="text-sm text-ink-2">
                  {uiText("Responsable:")}{blockerOwner(selected.nextAction)}
                  {selected.nextAction.dueDate
                    ? ` · Vence el ${new Intl.DateTimeFormat(uiText.locale, { dateStyle: "medium" }).format(new Date(selected.nextAction.dueDate))}`
                    : ""}
                </p>
              </div>
            </div>
          ) : null}

          {/* Bloqueos y avisos, con causa, responsable y salida. Separados a
              propósito: pintarlos igual enseña a ignorar los dos. */}
          <BlockerList blockers={onboardingBlockers(selected).blocking} />
          {onboardingBlockers(selected).warnings.length > 0 ? (
            <InlineNote
              tone="warning"
              title={
                onboardingBlockers(selected).warnings.length === 1
                  ? "Un aviso que no impide continuar"
                  : `${onboardingBlockers(selected).warnings.length} avisos que no impiden continuar`
              }
            >
              <ul className="space-y-1">
                {onboardingBlockers(selected).warnings.map((warning) => (
                  <li key={warning.code}>
                    {warning.cause} <span className="text-ink-3">· {warning.resolution}</span>
                  </li>
                ))}
              </ul>
            </InlineNote>
          ) : null}

          <ActionBar label={uiText("Continuar la incorporación en otro módulo")}>
            <Button asChild variant="secondary">
              <Link href={`/onboarding/signatures?flowId=${encodeURIComponent(selected.id)}&action=create`}>
                <FileSignature className="size-4" aria-hidden="true" />
                {uiText("Firmas")}</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={`/inventory?flowId=${encodeURIComponent(selected.id)}&employeeId=${encodeURIComponent(selected.employee.id)}`}>
                {uiText("Inventario")}</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={`/training/paths?flowId=${encodeURIComponent(selected.id)}&employeeId=${encodeURIComponent(selected.employee.id)}&templateId=${encodeURIComponent(selected.template?.id ?? "")}`}>
                {uiText("Capacitación")}</Link>
            </Button>
          </ActionBar>
        </section>
      ) : null}

      {selected ? (
        <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="min-w-0" aria-label={uiText("Empleados en incorporación")}>
            <EntityCardList label={uiText("Empleados en incorporación")} columns={1} className="sm:grid-cols-2 xl:grid-cols-1">
              {flows.data?.items.map((flow) => {
                const avance = onboardingProgress(flow);
                return (
                  <li key={flow.id} className="min-w-0">
                    <EntityCard
                      avatarName={flow.employee.name}
                      title={flow.employee.name}
                      subtitle={`${flow.employee.jobTitle || "Puesto por confirmar"} · ${flow.branch.name}`}
                      status={estadoDeIncorporacion(flow)}
                      facts={
                        avance.total === 0
                          ? [{ label: uiText("Tareas"), value: "Sin tareas" }]
                          : [
                              { label: uiText("Pendientes"), value: avance.pending },
                              ...(avance.overdue > 0
                                ? [{ label: uiText("Vencidas"), value: avance.overdue }]
                                : []),
                            ]
                      }
                      progress={
                        avance.total === 0
                          ? undefined
                          : {
                              label: "Avance",
                              value: flow.progressPercent,
                              detail: `${avance.completed} de ${avance.total} tareas`,
                            }
                      }
                      nextStep={
                        flow.nextAction
                          ? `Siguiente: ${flow.nextAction.title}`
                          : "Sin tareas disponibles"
                      }
                      onSelect={() => selectFlow(flow.id)}
                      selected={flow.id === selected.id}
                    />
                  </li>
                );
              })}
            </EntityCardList>
            {flows.data && flows.data.totalPages > 1 ? (
              <div className="flex items-center justify-between gap-2 pt-3">
                <Button size="sm" variant="secondary" disabled={flowPage <= 1} onClick={() => setFlowPage((page) => page - 1)}>{uiText("Anterior")}</Button>
                <span className="text-xs text-text-secondary">{flowPage} {uiText(" de ")}{flows.data.totalPages}</span>
                <Button size="sm" variant="secondary" disabled={flowPage >= flows.data.totalPages} onClick={() => setFlowPage((page) => page + 1)}>{uiText("Siguiente")}</Button>
              </div>
            ) : null}
          </aside>

          <main className="space-y-5">

            {!selected.template ? (
              <InlineFeedback
                tone="warning"
                title={uiText("Esta incorporación no tiene plantilla")}
                action={
                  can("onboarding.manage") ? (
                    <div className="flex flex-wrap gap-2">
                      <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                        <SelectTrigger className="min-w-52">
                          <SelectValue placeholder={uiText("Seleccionar plantilla")} />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.data?.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name} v{template.version}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        disabled={!selectedTemplateId || applyTemplate.isPending}
                        onClick={() => applyTemplate.mutate()}
                      >
                        {uiText("Aplicar")}</Button>
                    </div>
                  ) : undefined
                }
              >
                {uiText("Aplica una plantilla para estandarizar responsables, fechas y dependencias.")}</InlineFeedback>
            ) : null}

            {/* Las alertas ya están arriba, con causa, responsable y salida
                (`BlockerList` y los avisos). Repetirlas aquí era leerlas dos veces. */}
            <section className="space-y-3" aria-labelledby="onboarding-checklist">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="onboarding-checklist" className="text-lg font-semibold text-ink-1">
                  {uiText("Tareas")}<span className="ml-2 font-mono text-sm font-normal text-ink-2 tabular-figures">
                    {selected.tasks.filter((task) => task.status === "COMPLETED").length}/{selected.tasks.length}
                  </span>
                </h2>
                {can("onboarding.manage") ? (
                  <Button size="sm" variant="secondary" onClick={() => openTaskEditor()}>
                    <Plus className="size-4" />
                    {uiText("Agregar tarea")}</Button>
                ) : null}
              </div>
              <ol className="space-y-3">
              {selected.tasks.map((task, index) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  index={index}
                  canManage={can("onboarding.manage")}
                  onAssign={() => openAssignment(task)}
                  onEdit={() => openTaskEditor(task)}
                  onMoveUp={() => moveRuntimeTask(index, -1)}
                  onMoveDown={() => moveRuntimeTask(index, 1)}
                  onCancel={() => updateTask.mutate({ id: task.id, status: "CANCELLED" })}
                  onDelete={() => removeTask.mutate(task.id)}
                  onComplete={() => updateTask.mutate({ id: task.id, status: "COMPLETED" })}
                  onBlock={() => openBlocking(task)}
                  onUnblock={() =>
                    updateTask.mutate({ id: task.id, status: "IN_PROGRESS", blockingReason: null })
                  }
                  onUpload={() => setUploadTask(task)}
                  pending={updateTask.isPending}
                  first={index === 0}
                  last={index === selected.tasks.length - 1}
                />
              ))}
              </ol>
            </section>

            <Timeline flow={selected} />

            <section className="space-y-3" aria-labelledby="onboarding-signatures">
              <div className="flex items-center justify-between gap-3">
                <h2 id="onboarding-signatures" className="text-lg font-semibold">
                  {uiText("Firmas de incorporación")}</h2>
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/onboarding/signatures?flowId=${encodeURIComponent(selected.id)}&action=create`}>
                    <FileSignature className="size-4" />
                    {uiText("Gestionar firmas")}</Link>
                </Button>
              </div>
              {selected.signaturePackages?.length ? (
                selected.signaturePackages.map((item) => (
                  <Card key={item.id} level={3}>
                    <CardContent className="flex flex-wrap items-center gap-4 p-4">
                      <FileSignature className="size-5 text-brand" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-text-secondary">
                          {item.participants.filter((participant) => participant.status === "SIGNED").length}/
                          {item.participants.length} {uiText(" firmantes ·")}{" "}
                          {item.dueDate
                            ? `vence ${new Date(item.dueDate).toLocaleDateString()}`
                            : "sin fecha límite"}
                        </p>
                      </div>
                      <Badge>{item.status}</Badge>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <InlineFeedback tone="info" title={uiText("Sin paquetes de firma")}>
                  {uiText("Crea el paquete desde Firma electrónica; al completarse actualizará automáticamente este onboarding.")}</InlineFeedback>
              )}
            </section>

            <Documents
              flow={selected}
              canManage={can("onboarding.manage")}
              downloadingId={download.isPending ? download.variables?.id : undefined}
              onDownload={(document) => download.mutate(document)}
              onReview={(document, status) => {
                if (status === "REJECTED") {
                  setReviewDocument(document);
                  setReviewReason("");
                } else review.mutate({ id: document.id, status });
              }}
              onReplace={setReplacementDocument}
              onLifecycle={(document) => {
                setLifecycleDocument(document);
                setDocumentExpiresAt(document.expiresAt?.slice(0, 10) ?? "");
              }}
              onDelete={(document) => removeDocument.mutate(document.id)}
            />

            {can("onboarding.manage") ? (
              <Card level={1}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div>
                    <p className="font-semibold">{uiText("Cierre del expediente")}</p>
                    <p className="text-sm text-text-secondary">
                      {selected.readinessStatus === "READY"
                        ? "El expediente está cerrado y listo para operación."
                        : selected.readinessStatus === "READY_FOR_REVIEW"
                          ? "Lista de verificación lista. Confirma documentos y firmas para cerrar."
                          : "Completa las tareas obligatorias antes de solicitar el cierre."}
                    </p>
                  </div>
                  <Button disabled={selected.readinessStatus !== "READY_FOR_REVIEW" || closeFlow.isPending} onClick={() => closeFlow.mutate()}>
                    {closeFlow.isPending ? "Validando…" : "Confirmar cierre"}
                  </Button>
                </CardContent>
              </Card>
            ) : null}
          </main>
        </div>
      ) : null}

      <Dialog open={templateLibraryOpen} onOpenChange={setTemplateLibraryOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{uiText("Versiones de plantillas")}</DialogTitle>
            <DialogDescription>{uiText("Crea nuevas versiones sin modificar los expedientes que ya utilizan una versión anterior.")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {templates.data?.map((template) => (
              <Card key={template.id} level={2}>
                <CardContent className="flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{template.name} v{template.version}</p>
                    <p className="text-xs text-text-secondary">{template.tasks.length} {uiText(" tareas · ")}{template.status === "DRAFT" ? "Borrador pendiente de aprobación" : "Publicada"} · {template.isActive === false ? uiText("Inactiva") : uiText("Activa")}{template.isDefault ? " · predeterminada" : ""}</p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => createTemplateVersion(template)}>{uiText("Nueva versión")}</Button>
                  {template.status === "DRAFT" ? <Button size="sm" onClick={() => approveTemplate.mutate(template.id)} disabled={approveTemplate.isPending}>{uiText("Aprobar")}</Button> : null}
                  {!template.isDefault && template.isActive !== false ? <Button size="sm" variant="ghost" onClick={() => templateStatus.mutate({ id: template.id, input: { isDefault: true } })}>{uiText("Predeterminada")}</Button> : null}
                  <Button size="sm" variant="ghost" onClick={() => templateStatus.mutate({ id: template.id, input: { isActive: template.isActive === false } })}>{template.isActive === false ? uiText("Activar") : uiText("Desactivar")}</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <RuntimeTaskDialog
        task={taskDraft}
        editing={Boolean(taskDraftId)}
        existingTasks={selected?.tasks ?? []}
        assignableUsers={context.data?.assignableUsers ?? []}
        pending={createTask.isPending || editTask.isPending}
        onChange={setTaskDraft}
        onClose={() => { setTaskDraft(null); setTaskDraftId(null); }}
        onSave={() => taskDraftId ? editTask.mutate() : createTask.mutate()}
      />

      <Dialog open={Boolean(reviewDocument)} onOpenChange={(open) => !open && setReviewDocument(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{uiText("Rechazar documento")}</DialogTitle><DialogDescription>{reviewDocument?.originalName}{uiText(". La observación quedará visible y auditada.")}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div><Label htmlFor="document-rejection-reason">{uiText("Motivo y observaciones")}</Label><textarea id="document-rejection-reason" rows={5} maxLength={1000} value={reviewReason} onChange={(event) => setReviewReason(event.target.value)} className="w-full rounded-2xl border border-border-default bg-surface-elevated p-3 text-base sm:text-sm" /></div>
            <Button variant="destructive" className="w-full" disabled={!reviewReason.trim() || review.isPending} onClick={() => reviewDocument && review.mutate({ id: reviewDocument.id, status: "REJECTED", reason: reviewReason.trim() })}>{uiText("Confirmar rechazo")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(lifecycleDocument)} onOpenChange={(open) => !open && setLifecycleDocument(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{uiText("Vigencia documental")}</DialogTitle><DialogDescription>{uiText("Define la caducidad de ")}{lifecycleDocument?.originalName} {uiText(" o déjala vacía si no expira.")}</DialogDescription></DialogHeader>
          <div className="space-y-4"><div><Label htmlFor="document-expiry">{uiText("Fecha de caducidad")}</Label><Input id="document-expiry" type="date" value={documentExpiresAt} onChange={(event) => setDocumentExpiresAt(event.target.value)} /></div><Button className="w-full" disabled={lifecycle.isPending} onClick={() => lifecycle.mutate()}>{uiText("Guardar vigencia")}</Button></div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(replacementDocument)} onOpenChange={(open) => { if (!open) { setReplacementDocument(null); setReplacementFiles([]); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{uiText("Renovar documento")}</DialogTitle><DialogDescription>{uiText("La nueva carga será la versión ")}{(replacementDocument?.version ?? 1) + 1}{uiText("; la anterior conservará su trazabilidad.")}</DialogDescription></DialogHeader>
          <FileUpload accept={ONBOARDING_DOCUMENT_MIME_TYPES.join(",")} maxFiles={1} maxSizeBytes={MAX_ONBOARDING_DOCUMENT_SIZE_BYTES} validateFile={validateOnboardingDocumentFile} onFiles={setReplacementFiles} />
          <Button className="w-full" disabled={!replacementFiles[0] || replaceDocument.isPending} onClick={() => replaceDocument.mutate()}>{uiText("Cargar nueva versión")}</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{revisionSourceId ? uiText("Nueva versión de plantilla") : "Nueva plantilla de incorporación"}</DialogTitle>
            <DialogDescription>
              {uiText("Diseña un checklist reutilizable. El orden determina qué tareas pueden configurarse como dependencias.")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
              <div className="space-y-2">
                <Label htmlFor="template-name">{uiText("Nombre")}</Label>
                <Input
                  id="template-name"
                  value={templateName}
                  onChange={(event) => setTemplateName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-description">{uiText("Descripción")}</Label>
                <Input
                  id="template-description"
                  value={templateDescription}
                  onChange={(event) => setTemplateDescription(event.target.value)}
                />
              </div>
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-border-default bg-surface-section p-3 text-sm">
              <input
                type="checkbox"
                checked={templateIsDefault}
                onChange={(event) => setTemplateIsDefault(event.target.checked)}
                className="size-4 accent-primary"
              />
              <span>
                <strong className="block font-medium">{uiText("Plantilla predeterminada")}</strong>
                <span className="text-xs text-text-secondary">
                  {uiText("Se propondrá automáticamente durante nuevas contrataciones.")}</span>
              </span>
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">{uiText("Tareas de la lista de verificación")}</h3>
                <p className="text-sm text-text-secondary">
                  {uiText("Configura responsables, vencimientos y dependencias antes de guardar.")}</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setTemplateTasks((current) => [
                    ...current,
                    createOnboardingTemplateTask(current),
                  ])
                }
              >
                <Plus className="size-4" />
                {uiText("Agregar tarea")}</Button>
            </div>

            {templateTasks.length ? (
              <ol className="space-y-4">
                {templateTasks.map((task, index) => (
                  <TemplateTaskEditor
                    key={task.taskKey}
                    task={task}
                    index={index}
                    tasks={templateTasks}
                    assignableUsers={context.data?.assignableUsers ?? []}
                    onChange={(patch) =>
                      setTemplateTasks((current) =>
                        current.map((item, taskIndex) =>
                          taskIndex === index ? { ...item, ...patch } : item,
                        ),
                      )
                    }
                    onMove={(direction) =>
                      setTemplateTasks((current) =>
                        moveOnboardingTemplateTask(current, index, direction),
                      )
                    }
                    onRemove={() =>
                      setTemplateTasks((current) =>
                        removeOnboardingTemplateTask(current, index),
                      )
                    }
                  />
                ))}
              </ol>
            ) : (
              <InlineFeedback tone="warning" title={uiText("La plantilla está vacía")}>
                {uiText("Agrega una tarea para poder crear el checklist.")}</InlineFeedback>
            )}

            {templateErrors.length ? (
              <div
                role="alert"
                className="rounded-xl border border-status-warning/35 bg-status-warning/10 p-4 text-sm"
              >
                <p className="font-medium">{uiText("Revisa la configuración")}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-text-secondary">
                  {templateErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-border-default bg-card pt-4">
              <p className="text-xs text-text-secondary">
                {templateTasks.length} {templateTasks.length === 1 ? "tarea configurada" : "tareas configuradas"}
              </p>
              <Button
                disabled={
                  !templateName.trim() ||
                  Boolean(templateErrors.length) ||
                  createTemplate.isPending
                }
                onClick={() => createTemplate.mutate()}
              >
                {createTemplate.isPending ? uiText("Creando…") : uiText("Crear plantilla")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(assignmentTask)} onOpenChange={(open) => !open && setAssignmentTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{uiText("Responsable y fecha límite")}</DialogTitle>
            <DialogDescription>
              {assignmentTask?.title}{uiText(". Asigna una persona concreta o deriva la tarea al equipo operativo correspondiente.")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-owner-type">{uiText("Tipo de responsable")}</Label>
              <Select
                value={assignmentOwnerType}
                onValueChange={(ownerType) => {
                  setAssignmentOwnerType(ownerType as OnboardingOwnerType);
                  setAssignmentOwnerId("");
                }}
              >
                <SelectTrigger id="task-owner-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ownerTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-text-secondary">
                {ownerTypeDescription(assignmentOwnerType)}
              </p>
            </div>

            {assignmentOwnerType === "USER" ? (
              <div className="space-y-2">
                <Label htmlFor="task-owner-user">{uiText("Persona responsable")}</Label>
                <Select value={assignmentOwnerId} onValueChange={setAssignmentOwnerId}>
                  <SelectTrigger id="task-owner-user">
                    <SelectValue placeholder={uiText("Selecciona una persona")} />
                  </SelectTrigger>
                  <SelectContent>
                    {context.data?.assignableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} · {user.roles.map((role) => role.name).join(", ") || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {context.isLoading ? (
                  <p className="text-xs text-text-secondary">{uiText("Cargando personas de la sucursal…")}</p>
                ) : null}
                {context.isSuccess && !context.data.assignableUsers.length ? (
                  <p className="text-xs text-status-warning">
                    {uiText("No hay personas activas disponibles en esta sucursal.")}</p>
                ) : null}
                {context.isError ? (
                  <p role="alert" className="text-sm text-status-danger">
                    {getApiErrorMessage(context.error, "No fue posible cargar los responsables.")}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="rounded-xl border border-border-default bg-surface-section p-3 text-sm">
                <p className="font-medium">{ownerTypeLabel(assignmentOwnerType)}</p>
                <p className="mt-1 text-xs text-text-secondary">
                  {uiText("La tarea aparecerá en la cola funcional de este responsable sin vincularse a una persona concreta.")}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="task-due-date">{uiText("Fecha límite")}</Label>
              <Input
                id="task-due-date"
                type="date"
                value={assignmentDueDate}
                onChange={(event) => setAssignmentDueDate(event.target.value)}
              />
            </div>
            <Button
              className="w-full"
              disabled={
                !assignmentTask ||
                !assignmentDueDate ||
                !assignmentOwnerInput ||
                updateTask.isPending
              }
              onClick={() =>
                assignmentTask &&
                assignmentOwnerInput &&
                updateTask.mutate({
                  id: assignmentTask.id,
                  dueDate: new Date(`${assignmentDueDate}T12:00:00`).toISOString(),
                  ...assignmentOwnerInput,
                })
              }
            >
              {updateTask.isPending ? uiText("Guardando…") : uiText("Guardar asignación")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(blockingTask)}
        onOpenChange={(open) => {
          if (!open) {
            setBlockingTask(null);
            setBlockingReasonCode("");
            setBlockingObservations("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{uiText("Bloquear tarea")}</DialogTitle>
            <DialogDescription>
              {blockingTask?.title}{uiText(". Registra la causa y el contexto necesario para que el responsable pueda resolverla.")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{uiText("Motivo del bloqueo")}</Label>
              <Select
                value={blockingReasonCode}
                onValueChange={(value) =>
                  setBlockingReasonCode(value as OnboardingBlockReasonCode)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={uiText("Selecciona un motivo")} />
                </SelectTrigger>
                <SelectContent>
                  {ONBOARDING_BLOCK_REASONS.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="task-blocking-observations">{uiText("Observaciones")}</Label>
                <span className="text-xs text-text-secondary">
                  {blockingObservations.length}/1000
                </span>
              </div>
              <textarea
                id="task-blocking-observations"
                rows={5}
                maxLength={1000}
                value={blockingObservations}
                placeholder={uiText("Describe qué falta, quién debe intervenir y cualquier dato útil para resolver el bloqueo.")}
                onChange={(event) => setBlockingObservations(event.target.value)}
                className="w-full rounded-2xl border border-border-default bg-surface-elevated px-4 py-3 text-base sm:text-sm outline-none transition focus-visible:border-border-focus focus-visible:ring-2 focus-visible:ring-border-focus/30"
              />
              <p className="text-xs text-text-secondary">
                {uiText("Esta observación quedará visible en el checklist y registrada en el timeline.")}</p>
            </div>

            <Button
              className="w-full"
              variant="destructive"
              disabled={!blockingTask || !blockingReason || updateTask.isPending}
              onClick={() =>
                blockingTask &&
                blockingReason &&
                updateTask.mutate({
                  id: blockingTask.id,
                  status: "BLOCKED",
                  blockingReason,
                })
              }
            >
              {updateTask.isPending ? "Registrando bloqueo…" : "Confirmar bloqueo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(uploadTask)}
        onOpenChange={(open) => {
          if (!open) {
            setUploadTask(null);
            setFiles([]);
            setUploadValidationError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{uiText("Cargar documento seguro")}</DialogTitle>
            <DialogDescription>
              {uiText("PDF, JPEG o PNG, máximo 15 MB. El archivo se analiza, almacena de forma privada y queda pendiente de revisión.")}</DialogDescription>
          </DialogHeader>
          <FileUpload
            accept={ONBOARDING_DOCUMENT_MIME_TYPES.join(",")}
            maxFiles={1}
            maxSizeBytes={MAX_ONBOARDING_DOCUMENT_SIZE_BYTES}
            validateFile={validateOnboardingDocumentFile}
            onValidationError={setUploadValidationError}
            onFiles={setFiles}
          />
          {uploadValidationError ? (
            <InlineFeedback tone="danger" title={uiText("Archivo no permitido")}>
              {uploadValidationError}
            </InlineFeedback>
          ) : null}
          <InlineFeedback tone="info" title={uiText("Validación en dos etapas")}>
            {uiText("El navegador valida formato y tamaño antes del envío. La revisión y descarga solo se habilitan cuando el servidor confirma escaneo seguro y almacenamiento privado.")}</InlineFeedback>
          <Button
            disabled={!files[0] || Boolean(uploadValidationError) || upload.isPending}
            onClick={() => upload.mutate()}
          >
            {upload.isPending ? "Protegiendo y cargando…" : "Cargar al expediente"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TemplateTaskEditor({
  task,
  index,
  tasks,
  assignableUsers,
  onChange,
  onMove,
  onRemove,
}: {
  task: OnboardingTemplateTaskConfigDto;
  index: number;
  tasks: OnboardingTemplateTaskConfigDto[];
  assignableUsers: OnboardingContextDto["assignableUsers"];
  onChange: (patch: Partial<OnboardingTemplateTaskConfigDto>) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  const uiText = useUiText();
  const availableDependencies = tasks.slice(0, index);
  const dependencies = task.dependsOnKeys ?? [];

  const toggleDependency = (taskKey: string, checked: boolean) => {
    onChange({
      dependsOnKeys: checked
        ? [...dependencies, taskKey]
        : dependencies.filter((key) => key !== taskKey),
    });
  };

  return (
    <li className="rounded-2xl border border-border-default bg-surface-section p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {index + 1}
          </span>
          <div>
            <p className="font-semibold">{task.title.trim() || `Tarea ${index + 1}`}</p>
            <p className="text-xs text-text-secondary">{task.taskKey}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            disabled={index === 0}
            aria-label={`Subir ${task.title || `tarea ${index + 1}`}`}
            onClick={() => onMove(-1)}
          >
            <ChevronUp className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            disabled={index === tasks.length - 1}
            aria-label={`Bajar ${task.title || `tarea ${index + 1}`}`}
            onClick={() => onMove(1)}
          >
            <ChevronDown className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={`Eliminar ${task.title || `tarea ${index + 1}`}`}
            onClick={onRemove}
          >
            <Trash2 className="size-4 text-status-danger" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`template-task-title-${task.taskKey}`}>{uiText("Título")}</Label>
          <Input
            id={`template-task-title-${task.taskKey}`}
            value={task.title}
            onChange={(event) => onChange({ title: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>{uiText("Tipo de tarea")}</Label>
          <Select
            value={task.taskType}
            onValueChange={(taskType) =>
              onChange({
                taskType: taskType as OnboardingTemplateTaskConfigDto["taskType"],
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {taskTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor={`template-task-description-${task.taskKey}`}>{uiText("Descripción")}</Label>
          <textarea
            id={`template-task-description-${task.taskKey}`}
            rows={2}
            value={task.description ?? ""}
            onChange={(event) => onChange({ description: event.target.value })}
            className="w-full rounded-2xl border border-border-default bg-surface-elevated px-4 py-3 text-base sm:text-sm outline-none transition focus-visible:border-border-focus focus-visible:ring-2 focus-visible:ring-border-focus/30"
          />
        </div>

        <div className="space-y-2">
          <Label>{uiText("Responsable")}</Label>
          <Select
            value={task.ownerType ?? "SYSTEM"}
            onValueChange={(ownerType) =>
              onChange({
                ownerType: ownerType as NonNullable<
                  OnboardingTemplateTaskConfigDto["ownerType"]
                >,
                ownerId: undefined,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ownerTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`template-task-due-${task.taskKey}`}>{uiText("Vence después de")}</Label>
          <div className="relative">
            <Input
              id={`template-task-due-${task.taskKey}`}
              type="number"
              min={0}
              value={task.dueOffsetDays ?? ""}
              onChange={(event) =>
                onChange({
                  dueOffsetDays: event.target.value === "" ? null : Number(event.target.value),
                })
              }
              className="pr-14"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-secondary">
              {uiText("días")}</span>
          </div>
        </div>

        {task.ownerType === "USER" ? (
          <div className="space-y-2 md:col-span-2">
            <Label>{uiText("Persona responsable")}</Label>
            <Select value={task.ownerId ?? ""} onValueChange={(ownerId) => onChange({ ownerId })}>
              <SelectTrigger>
                <SelectValue placeholder={uiText("Selecciona una persona")} />
              </SelectTrigger>
              <SelectContent>
                {assignableUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} · {user.roles.map((role) => role.name).join(", ") || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!assignableUsers.length ? (
              <p className="text-xs text-status-warning">
                {uiText("No hay personas asignables disponibles en esta sucursal.")}</p>
            ) : null}
          </div>
        ) : null}

        <fieldset className="space-y-2 md:col-span-2">
          <legend className="text-sm font-medium">{uiText("Dependencias")}</legend>
          {availableDependencies.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {availableDependencies.map((dependency) => (
                <label
                  key={dependency.taskKey}
                  className="flex items-center gap-2 rounded-xl border border-border-default bg-card p-3 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={dependencies.includes(dependency.taskKey)}
                    onChange={(event) =>
                      toggleDependency(dependency.taskKey, event.target.checked)
                    }
                    className="size-4 accent-primary"
                  />
                  <span>{dependency.title || dependency.taskKey}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-secondary">
              {uiText("Es la primera tarea y puede comenzar sin dependencias.")}</p>
          )}
        </fieldset>

        <label className="flex items-center gap-3 md:col-span-2">
          <input
            type="checkbox"
            checked={task.required ?? false}
            onChange={(event) => onChange({ required: event.target.checked })}
            className="size-4 accent-primary"
          />
          <span className="text-sm">
            {uiText("Tarea obligatoria para completar la incorporación")}</span>
        </label>
      </div>
    </li>
  );
}

function RuntimeTaskDialog({
  task,
  editing,
  existingTasks,
  assignableUsers,
  pending,
  onChange,
  onClose,
  onSave,
}: {
  task: OnboardingTemplateTaskConfigDto | null;
  editing: boolean;
  existingTasks: EmployeeOnboardingTaskDto[];
  assignableUsers: OnboardingContextDto["assignableUsers"];
  pending: boolean;
  onChange: (task: OnboardingTemplateTaskConfigDto | null) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const uiText = useUiText();
  if (!task) return null;
  const dependencies = task.dependsOnKeys ?? [];
  const valid = Boolean(task.title.trim() && (task.ownerType !== "USER" || task.ownerId));
  const update = (patch: Partial<OnboardingTemplateTaskConfigDto>) => onChange({ ...task, ...patch });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
          <DialogDescription>{uiText("Configura el trabajo individual sin modificar la plantilla de origen.")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div><Label htmlFor="runtime-task-title">{uiText("Título")}</Label><Input id="runtime-task-title" value={task.title} onChange={(event) => update({ title: event.target.value })} /></div>
          <div><Label htmlFor="runtime-task-description">{uiText("Descripción")}</Label><textarea id="runtime-task-description" rows={3} value={task.description ?? ""} onChange={(event) => update({ description: event.target.value })} className="w-full rounded-2xl border border-border-default bg-surface-elevated p-3 text-base sm:text-sm" /></div>
          <div><Label>{uiText("Tipo")}</Label><Select value={task.taskType} onValueChange={(value) => update({ taskType: value as OnboardingTemplateTaskConfigDto["taskType"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{taskTypeOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>{uiText("Responsable")}</Label><Select value={task.ownerType ?? "SYSTEM"} onValueChange={(value) => update({ ownerType: value as OnboardingOwnerType, ownerId: undefined })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ownerTypeOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
          {task.ownerType === "USER" ? <div><Label>{uiText("Persona")}</Label><Select value={task.ownerId ?? ""} onValueChange={(ownerId) => update({ ownerId })}><SelectTrigger><SelectValue placeholder={uiText("Selecciona una persona")} /></SelectTrigger><SelectContent>{assignableUsers.map((user) => <SelectItem key={user.id} value={user.id}>{user.name} · {user.email}</SelectItem>)}</SelectContent></Select></div> : null}
          <fieldset className="space-y-2"><legend className="text-sm font-medium">{uiText("Dependencias")}</legend>{existingTasks.filter((item) => item.taskKey !== task.taskKey).map((item) => <label key={item.id} className="flex items-center gap-2 rounded-xl border p-3 text-sm"><input type="checkbox" checked={dependencies.includes(item.taskKey)} onChange={(event) => update({ dependsOnKeys: event.target.checked ? [...dependencies, item.taskKey] : dependencies.filter((key) => key !== item.taskKey) })} className="size-4 accent-primary" />{item.title}</label>)}</fieldset>
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={task.required ?? true} onChange={(event) => update({ required: event.target.checked })} className="size-4 accent-primary" />{uiText("Obligatoria para cerrar el expediente")}</label>
          <Button className="w-full" disabled={!valid || pending} onClick={onSave}>{pending ? uiText("Guardando…") : editing ? uiText("Guardar cambios") : "Crear tarea"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TaskRow({
  task,
  index,
  canManage,
  onAssign,
  onEdit,
  onMoveUp,
  onMoveDown,
  onCancel,
  onDelete,
  onComplete,
  onBlock,
  onUnblock,
  onUpload,
  pending,
  first,
  last,
}: {
  task: EmployeeOnboardingTaskDto;
  index: number;
  canManage: boolean;
  onAssign: () => void;
  onEdit: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onComplete: () => void;
  onBlock: () => void;
  onUnblock: () => void;
  onUpload: () => void;
  pending: boolean;
  first: boolean;
  last: boolean;
}) {
  const uiText = useUiText();
  const done = task.status === "COMPLETED";
  const cancelled = task.status === "CANCELLED";
  const due = task.dueDate ? new Intl.DateTimeFormat(uiText.locale, { dateStyle: "medium" }).format(new Date(task.dueDate)) : null;
  return (
    <li
      className={`flex min-w-0 items-start gap-3 rounded-lg border bg-surface-1 p-4 ${
        task.overdue && !done ? "border-status-danger/40" : task.blocked ? "border-status-warning/40" : "border-line"
      }`}
    >
      {/* Marca de estado: hecha, bloqueada, vencida o su número de orden. */}
      <span
        aria-hidden="true"
        className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
          done
            ? "bg-status-success text-white"
            : task.blocked
              ? "bg-status-warning/15 text-status-warning"
              : task.overdue
                ? "bg-status-danger/10 text-status-danger"
                : "border-2 border-line-strong text-ink-2"
        }`}
      >
        {done ? <Check className="size-5" strokeWidth={2.5} /> : task.blocked ? <AlertTriangle className="size-4" /> : index + 1}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={`font-semibold ${done || cancelled ? "text-ink-2" : "text-ink-1"}`}>{task.title}</h3>
          {done ? null : (
            <StatusBadge
              size="sm"
              tone={cancelled ? "neutral" : task.overdue ? "danger" : task.blocked ? "warning" : task.status === "IN_PROGRESS" ? "progress" : "neutral"}
              label={task.overdue && !cancelled ? uiText("Vencida") : taskStatusLabel(task.status)}
            />
          )}
        </div>
        {task.description && !done ? <p className="mt-1 line-clamp-2 text-sm text-ink-2">{task.description}</p> : null}
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
          <span>{task.owner?.name ?? ownerTypeLabel(task.ownerType)}</span>
          {due ? <span>{done ? "" : "Vence "}{due}</span> : null}
          {task.waitingForLabels.length ? <span className="text-ink-3">{uiText("Espera a: ")}{task.waitingForLabels.join(", ")}</span> : null}
        </p>
        {task.blockingReason && !done ? <p className="mt-2 text-sm text-status-warning">{task.blockingReason}</p> : null}

        {/* Una acción principal visible; el resto, plegado en «Más». Antes
            cada tarea enseñaba nueve botones a la vez. */}
        {canManage && !done && !cancelled ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {task.status === "BLOCKED" ? (
              <Button size="sm" onClick={onUnblock} disabled={pending}>{uiText("Desbloquear")}</Button>
            ) : (
              <Button size="sm" onClick={onComplete} disabled={task.blocked || pending}>
                <Check className="size-4" aria-hidden="true" />
                {uiText("Completar")}</Button>
            )}
            <Button size="sm" variant="secondary" onClick={onUpload}>
              <Upload className="size-4" aria-hidden="true" />
              {uiText("Evidencia")}</Button>
            <details className="group relative">
              <summary className="inline-flex min-h-[var(--control-h-base)] cursor-pointer list-none items-center gap-1 rounded-md px-3 text-sm font-medium text-ink-2 hover:bg-surface-2 hover:text-ink-1 [&::-webkit-details-marker]:hidden">
                {uiText("Más")}<ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="absolute left-0 top-full z-[var(--z-popover)] mt-1 flex min-w-44 flex-col rounded-md border border-line bg-surface-1 p-1 shadow-e3">
                <Button size="sm" variant="ghost" className="justify-start" onClick={onAssign}>{uiText("Asignar responsable")}</Button>
                <Button size="sm" variant="ghost" className="justify-start" onClick={onEdit}>{uiText("Editar")}</Button>
                <Button size="sm" variant="ghost" className="justify-start" disabled={first || pending} onClick={onMoveUp}>{uiText("Subir")}</Button>
                <Button size="sm" variant="ghost" className="justify-start" disabled={last || pending} onClick={onMoveDown}>{uiText("Bajar")}</Button>
                {task.status !== "BLOCKED" ? (
                  <Button size="sm" variant="ghost" className="justify-start" onClick={onBlock} disabled={pending}>{uiText("Bloquear")}</Button>
                ) : null}
                <Button size="sm" variant="ghost" className="justify-start" onClick={onCancel} disabled={pending}>{uiText("Cancelar tarea")}</Button>
                <Button size="sm" variant="ghost" className="justify-start text-status-danger" onClick={onDelete} disabled={pending}>{uiText("Eliminar")}</Button>
              </div>
            </details>
          </div>
        ) : null}
      </div>
    </li>
  );
}

/** Un tramo por tarea. Se lee de un vistazo cuántas faltan y cuáles están mal. */
function TaskProgress({ flow }: { flow: EmployeeOnboardingFlowDto }) {
  const uiText = useUiText();
  const tasks = flow.tasks.filter((task) => task.status !== "CANCELLED");
  const done = tasks.filter((task) => task.status === "COMPLETED").length;
  if (tasks.length === 0) return <p className="text-sm text-ink-2">{uiText("Esta incorporación todavía no tiene tareas.")}</p>;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <p className="font-medium text-ink-1">{done} {uiText(" de ")}{tasks.length} {uiText(" tareas completadas")}</p>
        <p className="font-mono text-ink-2 tabular-figures">{flow.progressPercent} %</p>
      </div>
      <ol
        className="mt-2 flex gap-1"
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={tasks.length}
        aria-valuetext={`${done} de ${tasks.length} tareas completadas`}
      >
        {tasks.map((task) => (
          <li
            key={task.id}
            title={task.title}
            className={`h-2 flex-1 rounded-full ${
              task.status === "COMPLETED" ? "bg-status-success" : task.overdue ? "bg-status-danger" : task.blocked ? "bg-status-warning" : "bg-surface-3"
            }`}
          />
        ))}
      </ol>
      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
        <Legend className="bg-status-success" label={uiText("Completada")} />
        <Legend className="bg-status-warning" label={uiText("Bloqueada")} />
        <Legend className="bg-status-danger" label={uiText("Vencida")} />
        <Legend className="bg-surface-3" label={uiText("Pendiente")} />
      </p>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden="true" className={`inline-block size-2.5 rounded-full ${className}`} />
      {label}
    </span>
  );
}

function Timeline({ flow }: { flow: EmployeeOnboardingFlowDto }) {
  const uiText = useUiText();
  return (
    <section className="space-y-3" aria-labelledby="onboarding-timeline">
      <div className="flex items-center gap-2">
        <History className="size-5 text-brand" />
        <h2 id="onboarding-timeline" className="text-lg font-semibold">
          Timeline
        </h2>
      </div>
      {flow.timeline.length ? (
        <ol className="relative space-y-0 border-l border-border-default pl-6">
          {flow.timeline.map((event) => {
            const actor = getOnboardingTimelineActor(event);
            return (
              <li key={event.id} className="relative pb-5 last:pb-0">
                <span className="absolute -left-[29px] top-1.5 size-2.5 rounded-full bg-primary ring-4 ring-surface-page" />
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{event.title}</p>
                    {event.description ? (
                      <p className="text-sm text-text-secondary">{event.description}</p>
                    ) : null}
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-text-secondary">
                      <UserRoundCheck className="size-3.5" aria-hidden="true" />
                      <span>
                        {uiText("Responsable:")}<strong className="font-medium text-foreground">{actor.name}</strong>
                        {actor.detail ? ` · ${actor.detail}` : ""}
                      </span>
                    </p>
                  </div>
                  <time className="text-xs text-text-secondary" dateTime={event.occurredAt}>
                    {new Date(event.occurredAt).toLocaleString()}
                  </time>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <InlineFeedback tone="info" title={uiText("Sin actividad registrada")}>
          {uiText("Las actualizaciones de tareas y documentos aparecerán aquí con fecha y responsable.")}</InlineFeedback>
      )}
    </section>
  );
}

function Documents({
  flow,
  canManage,
  downloadingId,
  onDownload,
  onReview,
  onReplace,
  onLifecycle,
  onDelete,
}: {
  flow: EmployeeOnboardingFlowDto;
  canManage: boolean;
  downloadingId?: string;
  onDownload: (document: EmployeeOnboardingDocumentDto) => void;
  onReview: (document: EmployeeOnboardingDocumentDto, status: "APPROVED" | "REJECTED") => void;
  onReplace: (document: EmployeeOnboardingDocumentDto) => void;
  onLifecycle: (document: EmployeeOnboardingDocumentDto) => void;
  onDelete: (document: EmployeeOnboardingDocumentDto) => void;
}) {
  const uiText = useUiText();
  return (
    <section className="space-y-3" aria-labelledby="employee-documents">
      <h2 id="employee-documents" className="text-lg font-semibold">
        {uiText("Expediente documental")}</h2>
      {!flow.documents.length ? (
        <InlineFeedback tone="info" title={uiText("Sin documentos cargados")}>
          {uiText("Usa “Evidencia” en una tarea para incorporar archivos al expediente privado.")}</InlineFeedback>
      ) : (
        flow.documents.map((document) => {
          const security = getOnboardingDocumentSecurity(document);
          return (
            <Card key={document.id} level={security.ready ? 3 : 1}>
              <CardContent className="flex flex-wrap items-center gap-4 p-4">
                <FileCheck2 className={security.ready ? "size-5 text-brand" : "size-5 text-status-warning"} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{document.originalName}</p>
                  <p className="text-xs text-text-secondary">
                    {document.category} · v{document.version ?? 1} · {(document.sizeBytes / 1024).toFixed(0)} KB
                    {document.expiresAt ? ` · vence ${new Date(document.expiresAt).toLocaleDateString()}` : ""}
                  </p>
                  {document.rejectionReason ? <p className="mt-1 text-xs text-status-danger">{uiText("Rechazo: ")}{document.rejectionReason}</p> : null}
                  <p className={`mt-1 text-xs ${security.ready ? "text-status-success" : "text-status-warning"}`}>
                    {security.label} · {security.detail}
                  </p>
                </div>
                <Badge>{documentStatusLabel(document.status)}</Badge>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!security.ready || downloadingId === document.id}
                  title={!security.ready ? security.detail : undefined}
                  onClick={() => onDownload(document)}
                >
                  <Download className="size-4" />
                  {downloadingId === document.id ? "Descargando…" : uiText("Descargar")}
                </Button>
                {canManage && document.status === "PENDING_REVIEW" ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={!security.ready}
                      onClick={() => onReview(document, "REJECTED")}
                    >
                      {uiText("Rechazar")}</Button>
                    <Button
                      size="sm"
                      disabled={!security.ready}
                      onClick={() => onReview(document, "APPROVED")}
                    >
                      {uiText("Aprobar")}</Button>
                  </div>
                ) : null}
                {canManage && document.status !== "SUPERSEDED" ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => onReplace(document)}>{uiText("Renovar")}</Button>
                    <Button size="sm" variant="ghost" onClick={() => onLifecycle(document)}>{uiText("Vigencia")}</Button>
                    <Button size="icon" variant="ghost" onClick={() => onDelete(document)} aria-label={`Eliminar ${document.originalName}`}><Trash2 className="size-4 text-status-danger" /></Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })
      )}
    </section>
  );
}

function taskStatusLabel(status: EmployeeOnboardingTaskDto["status"]) {
  return {
    PENDING: "Pendiente",
    IN_PROGRESS: "En curso",
    BLOCKED: "Bloqueada",
    COMPLETED: "Completada",
    CANCELLED: "Cancelada",
  }[status];
}

function documentStatusLabel(status: EmployeeOnboardingDocumentDto["status"]) {
  return {
    PENDING_REVIEW: "Pendiente de revisión",
    APPROVED: "Aprobado",
    REJECTED: "Rechazado",
    SUPERSEDED: "Versión anterior",
    DELETED: "Eliminado",
  }[status];
}

function ownerTypeLabel(ownerType: EmployeeOnboardingTaskDto["ownerType"]) {
  return {
    SYSTEM: "Sin responsable nominal",
    USER: "Usuario no disponible",
    EMPLOYEE: "Empleado",
    CANDIDATE: "Candidato",
    BRANCH: "Sucursal",
    INVENTORY: "Equipo de inventario",
    TRAINING: "Equipo de formación",
    ACCESS: "Equipo de accesos",
    SIGNATURE: "Equipo de firmas",
    ONBOARDING: "Equipo de incorporación",
    PRODUCTIVITY: "Equipo de productividad",
  }[ownerType];
}

function ownerTypeDescription(ownerType: OnboardingOwnerType) {
  return {
    SYSTEM: "La tarea permanecerá disponible sin una asignación nominal.",
    USER: "Selecciona una persona activa dentro del alcance de la sucursal.",
    EMPLOYEE: "La acción corresponde al empleado que está completando su incorporación.",
    CANDIDATE: "La acción corresponde al candidato vinculado al proceso de contratación.",
    BRANCH: "La responsabilidad se deriva a la operación general de la sucursal.",
    INVENTORY: "La tarea se deriva al equipo encargado de activos y entregas.",
    TRAINING: "La tarea se deriva al equipo encargado de capacitación.",
    ACCESS: "La tarea se deriva al equipo encargado de cuentas y accesos.",
    SIGNATURE: "La tarea se deriva al equipo encargado de documentos y firmas.",
    ONBOARDING: "La tarea se deriva al equipo coordinador de incorporación.",
    PRODUCTIVITY: "La tarea se deriva al equipo encargado de seguimiento productivo.",
  }[ownerType];
}
