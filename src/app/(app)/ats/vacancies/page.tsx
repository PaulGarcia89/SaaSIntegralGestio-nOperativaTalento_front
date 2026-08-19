"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, ClipboardCheck, Copy, History, Pencil, Plus, RotateCcw, Trash2, Upload } from "lucide-react";
import { archiveVacancy, cloneVacancy, createPersonnelRequisition, createVacancy, decidePersonnelRequisition, fetchPersonnelRequisitions, fetchVacancies, fetchVacancyHistory, updateVacancy, uploadVacancyImage } from "@/lib/backend";
import type { CreateVacancyInput, PersonnelRequisitionDto, PersonnelRequisitionInput, PublicVacancyDto, VacancyResponsibleDto, VacancyResponsibleRole, VacancyStageDto, VacancyStageInput } from "@/lib/contracts";
import { useAppStore } from "@/store/app-store";
import { technicalLabel } from "@/lib/ui-labels";
import { ActionBar, InlineFeedback, PageHeader, Wizard } from "@/components/design-system";
import { AsyncState } from "@/components/async-state";
import { FormErrorSummary } from "@/components/form-error-summary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEFAULT_DRAFT_TTL_MS, loadScopedDraft, removeScopedDraft, saveScopedDraft } from "@/lib/draft-storage";

const steps = ["Información", "Contenido", "Condiciones", "Formulario", "Proceso", "Responsables", "Revisión"];
const initial = (branchId: string): CreateVacancyInput => ({ branchId, title: "", summary: "", description: "", requirements: "", responsibilities: "", benefits: "", city: "", country: "", department: "", seniority: "", workMode: "HYBRID", employmentType: "FULL_TIME", openings: 1, applicationFormSchema: { version: 1, fields: [] }, status: "DRAFT" });
const initialStages = (): VacancyStageDto[] => [
  { code: "APPLIED", name: "Postulación", position: 0, applicationStatus: "SUBMITTED", allowedNextStageCodes: ["SCREENING", "REJECTED"], slaHours: 24 },
  { code: "SCREENING", name: "Revisión inicial", position: 1, applicationStatus: "REVIEWING", allowedNextStageCodes: ["INTERVIEW", "REJECTED"], requiredFields: ["candidate.phone", "candidate.resumeUrl"], slaHours: 48 },
  { code: "INTERVIEW", name: "Entrevistas", position: 2, applicationStatus: "INTERVIEW", allowedNextStageCodes: ["DECISION", "REJECTED"], slaHours: 72 },
  { code: "DECISION", name: "Decisión", position: 3, applicationStatus: "APPROVED", allowedNextStageCodes: ["HIRED", "REJECTED"], requiredFields: ["interview.completed", "scorecard"], requiresApproval: true, requiredApprovals: 1, slaHours: 48 },
  { code: "REJECTED", name: "No continúa", position: 4, applicationStatus: "REJECTED", isTerminal: true, allowedNextStageCodes: ["SCREENING"], allowReopen: true },
  { code: "HIRED", name: "Contratación", position: 5, applicationStatus: "HIRED", isTerminal: true, allowedNextStageCodes: [] },
];
interface VacancyDraft { form: CreateVacancyInput; stages: VacancyStageDto[]; responsibles: VacancyResponsibleDto[] }
function toVacancyStageInput(stage: VacancyStageDto): VacancyStageInput {
  const { code, name, position, color, applicationStatus, isTerminal, allowedNextStageCodes, requiredFields, requiresApproval, requiredApprovals, allowReopen, slaHours, slaWarningHoursBefore, slaEscalationHours, autoReassignAfterHours } = stage;
  return { code, name, position, color, applicationStatus, isTerminal, allowedNextStageCodes, requiredFields, requiresApproval, requiredApprovals, allowReopen, slaHours, slaWarningHoursBefore, slaEscalationHours, autoReassignAfterHours };
}

function sameVacancySetup<T>(current: T, initialValue: T) {
  return JSON.stringify(current) === JSON.stringify(initialValue);
}

function changedVacancyFields(current: CreateVacancyInput, initialValue: CreateVacancyInput): Partial<CreateVacancyInput> {
  return Object.fromEntries(
    Object.entries(current).filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(initialValue[key as keyof CreateVacancyInput])),
  ) as Partial<CreateVacancyInput>;
}

function responsibleInput(responsible: VacancyResponsibleDto) {
  return { userId: responsible.userId, role: responsible.role };
}

export function VacanciesPage({ editId }: { editId?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient(); const { currentBranch, currentTenant, currentUser, branches, tenantUsers, can } = useAppStore();
  const [open, setOpen] = useState(false); const [step, setStep] = useState(0); const [form, setForm] = useState<CreateVacancyInput>(() => initial(currentBranch?.id ?? "")); const [errors, setErrors] = useState<Array<{ fieldId: string; label: string; message: string }>>([]);
  const [stages, setStages] = useState<VacancyStageDto[]>(initialStages);
  const [responsibles, setResponsibles] = useState<VacancyResponsibleDto[]>([]);
  const [initialStagesForEdit, setInitialStagesForEdit] = useState<VacancyStageDto[]>([]);
  const [initialResponsiblesForEdit, setInitialResponsiblesForEdit] = useState<VacancyResponsibleDto[]>([]);
  const [initialFormForEdit, setInitialFormForEdit] = useState<CreateVacancyInput | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [storedImagePreview, setStoredImagePreview] = useState("");
  const [imageUploadMessage, setImageUploadMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<PublicVacancyDto | null>(null);
  const [archiveReason, setArchiveReason] = useState("");
  const [draftReady, setDraftReady] = useState(false);
  const draftTimer = useRef<number | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const vacancies = useQuery({ queryKey: ["vacancies", currentBranch?.id], queryFn: fetchVacancies, enabled: Boolean(currentBranch) });
  const save = useMutation({ mutationFn: async (input: CreateVacancyInput) => {
    const stageInput = stages.map(toVacancyStageInput);
    const responsibleSetup = responsibles.map(responsibleInput);
    const initialStageInput = initialStagesForEdit.map(toVacancyStageInput);
    const initialResponsibleSetup = initialResponsiblesForEdit.map(responsibleInput);
    const updateSetup = {
      ...(sameVacancySetup(stageInput, initialStageInput) ? {} : { stages: stageInput }),
      ...(sameVacancySetup(responsibleSetup, initialResponsibleSetup) ? {} : { responsibles }),
    };
    let vacancyId: string;
    if (editingId) {
      const changedFields = changedVacancyFields(input, initialFormForEdit ?? input);
      if (Object.keys(changedFields).length || Object.keys(updateSetup).length) {
        await updateVacancy(editingId, changedFields, updateSetup);
      }
      vacancyId = editingId;
    } else {
      const vacancy = await createVacancy({ ...input, imageUrl: undefined }, { stages: stageInput, responsibles });
      vacancyId = vacancy.id;
    }
    if (imageFile) await uploadVacancyImage(vacancyId, imageFile);
    return vacancyId;
  }, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["vacancies"] }); if (draftScope) await removeScopedDraft(draftScope); setOpen(false); setEditingId(null); setStep(0); setForm(initial(currentBranch?.id ?? "")); setStages(initialStages()); setResponsibles([]); setInitialStagesForEdit([]); setInitialResponsiblesForEdit([]); setInitialFormForEdit(null); setImageFile(null); setImagePreview(""); setStoredImagePreview(""); setImageUploadMessage(null); if (editId) router.push("/ats/vacancies"); } });
  const replaceImage = useMutation({
    mutationFn: ({ vacancyId, file }: { vacancyId: string; file: File }) => uploadVacancyImage(vacancyId, file),
    onSuccess: async (uploaded) => {
      setImageFile(null);
      setImagePreview(uploaded.url);
      setStoredImagePreview(uploaded.url);
      setImageUploadMessage("Imagen actualizada y guardada.");
      await queryClient.invalidateQueries({ queryKey: ["vacancies"] });
    },
    onError: () => setImageUploadMessage(null),
  });
  const clone = useMutation({ mutationFn: (id: string) => cloneVacancy(id, "Clonación administrada desde ATS"), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vacancies"] }) });
  const archive = useMutation({ mutationFn: () => archiveVacancy(archiveTarget!.id, archiveReason), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["vacancies"] }); setArchiveTarget(null); setArchiveReason(""); } });
  const restore = useMutation({ mutationFn: (vacancy: PublicVacancyDto) => updateVacancy(vacancy.id, { ...vacancyToInput(vacancy), status: "PAUSED" }, { stages: (vacancy.stages ?? []).map(toVacancyStageInput), responsibles: vacancy.responsibles ?? [] }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vacancies"] }) });
  const history = useQuery({ queryKey: ["vacancy-history", historyId], queryFn: () => fetchVacancyHistory(historyId!), enabled: Boolean(historyId) });
  const update = <K extends keyof CreateVacancyInput>(key: K, value: CreateVacancyInput[K]) => setForm((current) => ({ ...current, [key]: value }));
  const selectVacancyImage = (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setErrors((current) => [...current.filter((item) => item.fieldId !== "vacancy-image"), { fieldId: "vacancy-image", label: "Imagen del cargo", message: "Selecciona una imagen JPG, PNG o WebP de hasta 5 MB" }]);
      return;
    }
    if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageUploadMessage(editingId ? "Guardando la nueva imagen..." : null);
    setErrors((current) => current.filter((item) => item.fieldId !== "vacancy-image"));
    if (editingId) replaceImage.mutate({ vacancyId: editingId, file });
  };
  const discardSelectedImage = () => {
    if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(storedImagePreview);
    setImageUploadMessage(null);
  };
  const fields = form.applicationFormSchema?.fields ?? [];
  const validateAll = () => {
    const normalizedCodes = stages.map((stage) => stage.code.trim().toUpperCase());
    const positions = stages.map((stage) => stage.position);
    return [...(!form.title.trim() ? [{ fieldId: "vacancy-title", label: "Título", message: "Es obligatorio" }] : []), ...(!form.branchId ? [{ fieldId: "vacancy-branch", label: "Sucursal", message: "Selecciona una sucursal" }] : []), ...(!imageFile ? [{ fieldId: "vacancy-image", label: "Imagen del cargo", message: "Carga una imagen representativa" }] : []), ...(!(form.description ?? "").trim() ? [{ fieldId: "vacancy-description", label: "Descripción", message: "Describe la oportunidad" }] : []), ...((form.openings ?? 0) < 1 ? [{ fieldId: "vacancy-openings", label: "Plazas", message: "Debe existir al menos una plaza" }] : []), ...((form.salaryMin ?? 0) > (form.salaryMax ?? Number.MAX_SAFE_INTEGER) ? [{ fieldId: "vacancy-salary-max", label: "Salario máximo", message: "Debe ser mayor o igual al salario mínimo" }] : []), ...fields.flatMap((field, index) => !field.label.trim() ? [{ fieldId: `question-${index}`, label: `Pregunta ${index + 1}`, message: "Escribe la pregunta" }] : []), ...stages.flatMap((stage, index) => [!stage.name.trim() ? { fieldId: `stage-name-${index}`, label: `Etapa ${index + 1}`, message: "Escribe un nombre" } : null, !stage.code.trim() ? { fieldId: `stage-code-${index}`, label: `Código de etapa ${index + 1}`, message: "Escribe un código" } : null].filter((item): item is { fieldId: string; label: string; message: string } => Boolean(item))), ...(new Set(normalizedCodes).size !== normalizedCodes.length ? [{ fieldId: "stage-code-0", label: "Códigos de etapa", message: "Cada código debe ser único" }] : []), ...(new Set(positions).size !== positions.length ? [{ fieldId: "stage-position-0", label: "Orden de etapas", message: "Cada posición debe ser única" }] : [])];
  };
  const errorsForStep = (value: number) => validateAll().filter((item) => editingId && item.fieldId === "vacancy-image" ? false : value === 0 ? ["vacancy-title", "vacancy-branch", "vacancy-image"].includes(item.fieldId) : value === 1 ? item.fieldId === "vacancy-description" : value === 2 ? ["vacancy-openings", "vacancy-salary-max"].includes(item.fieldId) : value === 3 ? item.fieldId.startsWith("question-") : value === 4 ? item.fieldId.startsWith("stage-") : false);
  const next = () => { const nextErrors = errorsForStep(step); setErrors(nextErrors); if (!nextErrors.length) setStep((value) => Math.min(steps.length - 1, value + 1)); };
  const submit = (status: CreateVacancyInput["status"]) => { const nextErrors = (status === "PUBLISHED" || status === "OPEN" ? validateAll() : []).filter((item) => !(editingId && item.fieldId === "vacancy-image")); setErrors(nextErrors); if (!nextErrors.length) save.mutate({ ...form, status }); };
  const draftScope = useMemo(() => currentUser && currentTenant && currentBranch && !editingId ? { namespace: "vacancy", tenantId: currentTenant.id, userId: currentUser.id, resourceId: currentBranch.id } : null, [currentBranch, currentTenant, currentUser, editingId]);
  const openWizard = () => { setEditingId(null); setForm(initial(currentBranch?.id ?? "")); setStages(initialStages()); setResponsibles([]); setInitialStagesForEdit([]); setInitialResponsiblesForEdit([]); setInitialFormForEdit(null); setImageFile(null); setImagePreview(""); setStoredImagePreview(""); setImageUploadMessage(null); setErrors([]); setDraftReady(false); setOpen(true); };
  const editVacancy = (vacancy: PublicVacancyDto) => {
    const vacancyStages = vacancy.stages ?? initialStages();
    const vacancyResponsibles = vacancy.responsibles ?? [];
    const vacancyForm = vacancyToInput(vacancy);
    setEditingId(vacancy.id); setForm(vacancyForm); setInitialFormForEdit(vacancyForm); setStages(vacancyStages); setResponsibles(vacancyResponsibles);
    setInitialStagesForEdit(vacancyStages); setInitialResponsiblesForEdit(vacancyResponsibles);
    setImageFile(null); setImagePreview(vacancy.imageUrl ?? ""); setStoredImagePreview(vacancy.imageUrl ?? ""); setImageUploadMessage(null); setErrors([]); setStep(0); setOpen(true);
  };
  const setFields = (nextFields: typeof fields) => update("applicationFormSchema", { version: 1, fields: nextFields });
  const addQuestion = () => setFields([...fields, { key: `question_${crypto.randomUUID().slice(0, 8)}`, label: "", type: "TEXT", required: false }]);
  const items = vacancies.data?.data ?? [];

  useEffect(() => {
    if (!editId || editingId === editId) return;
    const vacancy = items.find((item) => item.id === editId);
    if (vacancy) editVacancy(vacancy);
  }, [editId, editingId, items]);

  useEffect(() => {
    if (!open || editingId || !draftScope) return;
    let cancelled = false;
    setDraftReady(false);
    void loadScopedDraft<VacancyDraft>(draftScope).then((draft) => {
      if (cancelled) return;
      if (draft?.value) {
        setForm(draft.value.form);
        setStages(draft.value.stages);
        setResponsibles(draft.value.responsibles);
      }
      setDraftReady(true);
    });
    return () => { cancelled = true; };
  }, [draftScope, editingId, open]);

  useEffect(() => {
    if (!open || editingId || !draftScope || !draftReady) return;
    if (draftTimer.current) window.clearTimeout(draftTimer.current);
    draftTimer.current = window.setTimeout(() => {
      void saveScopedDraft<VacancyDraft>(draftScope, { form, stages, responsibles }, DEFAULT_DRAFT_TTL_MS);
    }, 300);
    return () => {
      if (draftTimer.current) window.clearTimeout(draftTimer.current);
    };
  }, [draftReady, draftScope, editingId, form, open, responsibles, stages]);

  useEffect(() => {
    if (!open || editingId || !draftScope || !draftReady) return;
    if (step === 6) {
      void removeScopedDraft(draftScope);
    }
  }, [draftReady, draftScope, editingId, open, step]);

  return <div className="space-y-7">{editId ? <PageHeader eyebrow="Reclutamiento" title="Editar vacante" description="Actualiza contenido, condiciones, ubicaciones, pipeline y responsables." actions={<Button variant="secondary" asChild><Link href="/ats/vacancies">Volver a vacantes</Link></Button>} /> : null}{!editId ? <><PageHeader eyebrow="Reclutamiento" title="Vacantes" description="Crea borradores, revisa el contenido y publica únicamente después de validar el resumen." actions={can("jobs.create") ? <Button onClick={openWizard}><Plus className="size-4" />Nueva vacante</Button> : undefined} />
    {vacancies.isLoading ? <AsyncState state="loading" title="Cargando vacantes" /> : null}{vacancies.isError ? <AsyncState state="error" onRetry={() => void vacancies.refetch()} /> : null}
    {vacancies.isSuccess && !items.length ? <InlineFeedback tone="info" title="No hay vacantes registradas">Crea un borrador para iniciar el proceso de revisión.</InlineFeedback> : null}
    <RequisitionsPanel onCreateVacancy={(requisition) => { setEditingId(null); setForm({ ...initial(requisition.locations[0]?.branchId ?? currentBranch?.id ?? ""), requisitionId: requisition.id, locationBranchIds: requisition.locations.map((item) => item.branchId), title: requisition.title, department: requisition.department, openings: requisition.openings, salaryMin: requisition.budgetMin, salaryMax: requisition.budgetMax, currency: requisition.currency }); setStages(initialStages()); setResponsibles([]); setImageFile(null); setImagePreview(""); setStoredImagePreview(""); setStep(0); setOpen(true); }} />
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((vacancy) => <Card level={2} key={vacancy.id} className="overflow-hidden"><VacancyImage imageUrl={vacancy.imageUrl} title={vacancy.title} /><CardHeader><div className="flex items-start justify-between gap-3"><CardTitle>{vacancy.title}</CardTitle><Badge variant="secondary">{vacancy.status ?? "PAUSED"}</Badge></div></CardHeader><CardContent className="space-y-3 text-sm text-text-secondary"><p>{vacancy.department || "Sin área"} · {vacancy.workMode ?? "Sin modalidad"}</p><p>{vacancy.locations?.map((item) => item.branch.name).join(", ") || [vacancy.city, vacancy.country].filter(Boolean).join(", ") || "Sin ubicación"}</p>{vacancy.requisition ? <p className="rounded-lg bg-surface-section px-3 py-2"><ClipboardCheck className="mr-2 inline size-4" />{vacancy.requisition.title}</p> : null}<div className="flex flex-wrap gap-2 pt-2">{vacancy.status === "ARCHIVED" ? <Button size="sm" variant="secondary" onClick={() => restore.mutate(vacancy)} disabled={restore.isPending}><RotateCcw className="size-4" />Restaurar</Button> : <><Button size="sm" variant="secondary" asChild><Link href={`/ats/vacancies/${vacancy.id}/edit`}><Pencil className="size-4" />Editar</Link></Button><Button size="sm" variant="secondary" onClick={() => clone.mutate(vacancy.id)} disabled={clone.isPending}><Copy className="size-4" />Clonar</Button><Button size="sm" variant="ghost" onClick={() => setArchiveTarget(vacancy)}><Archive className="size-4" />Archivar</Button></>}<Button size="sm" variant="ghost" onClick={() => setHistoryId(vacancy.id)}><History className="size-4" />Historial</Button></div></CardContent></Card>)}</section></> : null}
    <VacancyWizardSurface isEditingPage={Boolean(editId)} open={open} onOpenChange={setOpen}><Wizard steps={steps} current={step} onStepChange={(target) => { if (target <= step) { setErrors([]); setStep(target); } }}><FormErrorSummary errors={errors} serverError={save.error ?? replaceImage.error} />{step === 0 ? <MultiLocationEditor branches={branches} primaryBranchId={form.branchId} selected={form.locationBranchIds ?? [form.branchId]} onChange={(ids) => update("locationBranchIds", ids)} /> : null}
      {step === 0 ? <div className="grid gap-4 md:grid-cols-2"><label className="space-y-2 text-sm font-medium" htmlFor="vacancy-branch">Sucursal<Select value={form.branchId} onValueChange={(value) => update("branchId", value)}><SelectTrigger id="vacancy-branch"><SelectValue placeholder="Selecciona una sucursal" /></SelectTrigger><SelectContent>{branches.map((branch) => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}</SelectContent></Select></label><Field id="vacancy-title" label="Título" value={form.title} onChange={(value) => update("title", value)} /><Field id="vacancy-department" label="Área" value={form.department ?? ""} onChange={(value) => update("department", value)} /><Field id="vacancy-seniority" label="Nivel de experiencia" value={form.seniority ?? ""} onChange={(value) => update("seniority", value)} /><Field id="vacancy-city" label="Ciudad" value={form.city ?? ""} onChange={(value) => update("city", value)} /><Field id="vacancy-country" label="País" value={form.country ?? ""} onChange={(value) => update("country", value)} /><Field id="vacancy-summary" label="Resumen" value={form.summary ?? ""} maxLength={240} onChange={(value) => update("summary", value)} className="md:col-span-2" /><div id="vacancy-image" className="space-y-3 md:col-span-2"><div><p className="text-sm font-medium">Imagen del cargo <span className="text-status-danger">*</span></p><p className="mt-1 text-xs text-text-secondary">JPG, PNG o WebP de hasta 5 MB. Se escaneará y almacenará de forma privada.</p></div>{imagePreview ? <><div className="relative aspect-[16/7] overflow-hidden rounded-2xl border border-border-default"><Image src={imagePreview} alt={`Vista previa para ${form.title || "la vacante"}`} fill unoptimized className="object-cover" /><div className="absolute right-3 top-3 flex items-center gap-2"><Button type="button" size="sm" variant="secondary" onClick={() => imageInputRef.current?.click()} disabled={replaceImage.isPending}><Upload className="size-4" />{replaceImage.isPending ? "Subiendo imagen..." : "Reemplazar imagen"}</Button>{imageFile && !replaceImage.isPending ? <Button type="button" size="icon" variant="destructive" aria-label="Descartar la imagen nueva" onClick={discardSelectedImage}><Trash2 className="size-4" /></Button> : null}</div>{imageFile ? <p className="absolute bottom-3 left-3 rounded-lg bg-surface-base/90 px-3 py-2 text-xs font-medium shadow-sm">{editingId ? "Nueva imagen seleccionada. Se está guardando ahora." : "Nueva imagen seleccionada. Se actualizará al guardar."}</p> : null}{imageUploadMessage ? <p className="absolute bottom-3 left-3 rounded-lg bg-surface-base/90 px-3 py-2 text-xs font-medium text-status-success shadow-sm">{imageUploadMessage}</p> : null}</div><input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={replaceImage.isPending} onChange={(event) => { selectVacancyImage(event.target.files?.[0]); event.target.value = ""; }} /></> : <FileUpload accept="image/jpeg,image/png,image/webp" maxFiles={1} maxSizeBytes={5 * 1024 * 1024} onFiles={(selected) => selectVacancyImage(selected[0])} />}</div></div> : null}
      {step === 1 ? <div className="grid gap-4"><TextArea label="Descripción" value={form.description ?? ""} onChange={(value) => update("description", value)} /><TextArea label="Responsabilidades" value={form.responsibilities ?? ""} onChange={(value) => update("responsibilities", value)} /><TextArea label="Requisitos" value={form.requirements ?? ""} onChange={(value) => update("requirements", value)} /></div> : null}
      {step === 2 ? <div className="grid gap-4 md:grid-cols-2"><label className="space-y-2 text-sm font-medium">Modalidad<Select value={technicalLabel(form.workMode)} onValueChange={(value) => update("workMode", value as CreateVacancyInput["workMode"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="REMOTE">Remoto</SelectItem><SelectItem value="HYBRID">Híbrido</SelectItem><SelectItem value="ONSITE">Presencial</SelectItem></SelectContent></Select></label><label className="space-y-2 text-sm font-medium">Tipo de empleo<Select value={form.employmentType} onValueChange={(value) => update("employmentType", value as CreateVacancyInput["employmentType"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="FULL_TIME">Tiempo completo</SelectItem><SelectItem value="PART_TIME">Tiempo parcial</SelectItem><SelectItem value="CONTRACT">Contrato</SelectItem><SelectItem value="TEMPORARY">Temporal</SelectItem><SelectItem value="INTERNSHIP">Prácticas</SelectItem></SelectContent></Select></label><Field id="vacancy-openings" label="Número de plazas" type="number" value={String(form.openings ?? 1)} onChange={(value) => update("openings", Math.max(1, Number(value)))} /><Field id="vacancy-currency" label="Moneda" value={form.currency ?? "USD"} maxLength={8} onChange={(value) => update("currency", value.toUpperCase())} /><Field id="vacancy-salary-min" label="Salario mínimo" type="number" value={form.salaryMin == null ? "" : String(form.salaryMin)} onChange={(value) => update("salaryMin", value ? Number(value) : undefined)} /><Field id="vacancy-salary-max" label="Salario máximo" type="number" value={form.salaryMax == null ? "" : String(form.salaryMax)} onChange={(value) => update("salaryMax", value ? Number(value) : undefined)} /><Field id="vacancy-benefits" label="Beneficios" value={form.benefits ?? ""} onChange={(value) => update("benefits", value)} className="md:col-span-2" /></div> : null}
      {step === 3 ? <div className="space-y-4"><div className="flex items-center justify-between gap-3"><div><h3 className="font-semibold">Preguntas adicionales</h3><p className="text-sm text-text-secondary">Los datos básicos del candidato se solicitan automáticamente.</p></div><Button variant="secondary" onClick={addQuestion} disabled={fields.length >= 20}><Plus className="size-4" />Agregar pregunta</Button></div>{!fields.length ? <InlineFeedback tone="info" title="Sin preguntas adicionales">Puedes continuar con el formulario básico o agregar preguntas específicas.</InlineFeedback> : fields.map((field, index) => <Card level={3} key={field.key}><CardContent className="grid gap-4 p-4 md:grid-cols-[1fr_180px_auto]"><Field id={`question-${index}`} label={`Pregunta ${index + 1}`} value={field.label} onChange={(value) => setFields(fields.map((item, itemIndex) => itemIndex === index ? { ...item, label: value } : item))} /><label className="space-y-2 text-sm font-medium">Tipo<Select value={field.type} onValueChange={(value) => setFields(fields.map((item, itemIndex) => itemIndex === index ? { ...item, type: value as typeof field.type } : item))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TEXT">Texto corto</SelectItem><SelectItem value="TEXTAREA">Texto largo</SelectItem><SelectItem value="NUMBER">Número</SelectItem><SelectItem value="URL">Enlace</SelectItem><SelectItem value="BOOLEAN">Sí / No</SelectItem></SelectContent></Select></label><div className="flex items-end gap-2"><label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(field.required)} onChange={(event) => setFields(fields.map((item, itemIndex) => itemIndex === index ? { ...item, required: event.target.checked } : item))} />Obligatoria</label><Button size="icon" variant="ghost" aria-label={`Eliminar pregunta ${index + 1}`} onClick={() => setFields(fields.filter((_, itemIndex) => itemIndex !== index))}><Trash2 /></Button></div></CardContent></Card>)}</div> : null}
      {step === 4 ? <VacancyStagesEditor stages={stages} onChange={setStages} /> : null}
      {step === 5 ? <div className="space-y-4"><div><h3 className="font-semibold">Responsables y función</h3><p className="text-sm text-text-secondary">Solo se muestran usuarios de la empresa activa.</p></div><Select onValueChange={(userId) => { if (!responsibles.some((item) => item.userId === userId)) setResponsibles((current) => [...current, { userId, role: "RECRUITER" }]); }}><SelectTrigger><SelectValue placeholder="Agregar responsable" /></SelectTrigger><SelectContent>{tenantUsers.map((user) => <SelectItem key={user.id} value={user.id}>{user.fullName}</SelectItem>)}</SelectContent></Select>{responsibles.map((responsible, index) => { const user = tenantUsers.find((item) => item.id === responsible.userId); return <Card level={3} key={`${responsible.userId}-${index}`}><CardContent className="grid items-end gap-3 p-4 md:grid-cols-[1fr_220px_auto]"><div><p className="font-medium">{user?.fullName ?? responsible.userId}</p><p className="text-sm text-text-secondary">{user?.email}</p></div><label className="space-y-2 text-sm font-medium">Función<Select value={responsible.role} onValueChange={(role) => setResponsibles((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, role: role as VacancyResponsibleRole } : item))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="OWNER">Responsable principal</SelectItem><SelectItem value="RECRUITER">Reclutador</SelectItem><SelectItem value="HIRING_MANAGER">Líder contratante</SelectItem><SelectItem value="INTERVIEWER">Entrevistador</SelectItem></SelectContent></Select></label><Button size="icon" variant="ghost" aria-label={`Quitar a ${user?.fullName ?? "responsable"}`} onClick={() => setResponsibles((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 /></Button></CardContent></Card>; })}</div> : null}
      {step === 6 ? <div className="space-y-4"><InlineFeedback tone="warning" title="Revisa antes de publicar">Al publicar, la vacante, sus etapas y responsables quedarán disponibles para operar el proceso.</InlineFeedback>{imagePreview ? <div className="relative aspect-[16/6] overflow-hidden rounded-2xl"><Image src={imagePreview} alt="" fill unoptimized className="object-cover" /></div> : null}<dl className="grid gap-3 rounded-xl bg-surface-section p-5 md:grid-cols-2"><Summary label="Título" value={form.title} /><Summary label="Área" value={form.department} /><Summary label="Ubicación" value={[form.city, form.country].filter(Boolean).join(", ")} /><Summary label="Modalidad" value={technicalLabel(form.workMode)} /><Summary label="Plazas" value={String(form.openings)} /><Summary label="Preguntas adicionales" value={String(fields.length)} /><Summary label="Etapas" value={String(stages.length)} /><Summary label="Responsables" value={String(responsibles.length)} /><Summary label="Rango salarial" value={form.salaryMin || form.salaryMax ? `${form.salaryMin ?? "—"} – ${form.salaryMax ?? "—"} ${form.currency ?? "USD"}` : "No informado"} /></dl></div> : null}
      <ActionBar label="Acciones del asistente" sticky><Button variant="secondary" onClick={() => { setErrors([]); setStep((value) => Math.max(0, value - 1)); }} disabled={step === 0}>Anterior</Button>{step < steps.length - 1 ? <Button onClick={next}>Continuar</Button> : editingId ? <Button onClick={() => submit(form.status ?? "PAUSED")} disabled={save.isPending}>{save.isPending ? "Guardando…" : "Guardar todos los cambios"}</Button> : <><Button variant="secondary" onClick={() => submit("DRAFT")} disabled={save.isPending}>Guardar borrador</Button><Button onClick={() => submit("PUBLISHED")} disabled={save.isPending} data-loading={save.isPending}>{save.isPending ? "Publicando…" : "Publicar"}</Button></>}</ActionBar>
    </Wizard></VacancyWizardSurface>
    <Dialog open={Boolean(archiveTarget)} onOpenChange={(value) => { if (!value) setArchiveTarget(null); }}><DialogContent><DialogHeader><DialogTitle>Archivar vacante</DialogTitle><DialogDescription>La vacante dejará de publicarse, pero conservará candidatos, flujo de selección e historial.</DialogDescription></DialogHeader><TextArea label="Motivo de archivado" value={archiveReason} onChange={setArchiveReason} /><Button variant="destructive" disabled={!archiveReason.trim() || archive.isPending} onClick={() => archive.mutate()}>{archive.isPending ? "Archivando…" : "Confirmar archivado"}</Button></DialogContent></Dialog>
    <Dialog open={Boolean(historyId)} onOpenChange={(value) => { if (!value) setHistoryId(null); }}><DialogContent className="max-h-[80vh] overflow-y-auto"><DialogHeader><DialogTitle>Historial de la vacante</DialogTitle><DialogDescription>Registro inmutable de cambios y responsables.</DialogDescription></DialogHeader>{history.isLoading ? <AsyncState state="loading" title="Cargando historial" /> : history.data?.map((event) => <div key={event.id} className="rounded-xl border border-border-default p-4"><div className="flex items-center justify-between gap-3"><Badge variant="secondary">{event.type}</Badge><time className="text-xs text-text-secondary">{new Date(event.createdAt).toLocaleString()}</time></div><p className="mt-2 text-sm font-medium">{event.actor ? `${event.actor.firstName} ${event.actor.lastName}` : "Sistema"}</p>{event.reason ? <p className="mt-1 text-sm text-text-secondary">{event.reason}</p> : null}</div>)}</DialogContent></Dialog>
  </div>;
}

export default function VacanciesDirectoryPage() {
  return <VacanciesPage />;
}

function VacancyWizardSurface({ children, isEditingPage, onOpenChange, open }: { children: ReactNode; isEditingPage: boolean; onOpenChange: (open: boolean) => void; open: boolean }) {
  if (isEditingPage) {
    return <Card level={1}><CardContent className="space-y-6 p-5 md:p-7">{children}</CardContent></Card>;
  }

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto"><DialogHeader><DialogTitle>Crear vacante</DialogTitle><DialogDescription>Completa y revisa la vacante. El borrador local caduca en 24 horas.</DialogDescription></DialogHeader>{children}</DialogContent></Dialog>;
}

function vacancyToInput(vacancy: PublicVacancyDto): CreateVacancyInput {
  return {
    branchId: vacancy.branchId ?? vacancy.branch?.id ?? "",
    locationBranchIds: vacancy.locations?.map((item) => item.branchId),
    requisitionId: vacancy.requisitionId ?? undefined,
    title: vacancy.title,
    summary: vacancy.summary ?? "",
    description: vacancy.description ?? "",
    requirements: vacancy.requirements ?? "",
    responsibilities: vacancy.responsibilities ?? "",
    benefits: vacancy.benefits ?? "",
    city: vacancy.city ?? "",
    country: vacancy.country ?? "",
    department: vacancy.department ?? "",
    seniority: vacancy.seniority ?? "",
    workMode: vacancy.workMode === "ON_SITE" ? "ONSITE" : vacancy.workMode as CreateVacancyInput["workMode"],
    employmentType: vacancy.employmentType as CreateVacancyInput["employmentType"],
    openings: vacancy.openings ?? 1,
    salaryMin: vacancy.salaryMin ?? undefined,
    salaryMax: vacancy.salaryMax ?? undefined,
    currency: vacancy.currency ?? "USD",
    applicationFormSchema: vacancy.applicationFormSchema ?? { version: 1, fields: [] },
    status: vacancy.status as CreateVacancyInput["status"],
  };
}

function MultiLocationEditor({ branches, primaryBranchId, selected, onChange }: { branches: Array<{ id: string; name: string }>; primaryBranchId: string; selected: string[]; onChange: (ids: string[]) => void }) {
  const values = [...new Set([primaryBranchId, ...selected].filter(Boolean))];
  return <fieldset className="mb-5 rounded-xl border border-border-default bg-surface-section p-4"><legend className="px-2 text-sm font-semibold">Sucursales o ubicaciones de la vacante</legend><p className="mb-3 text-xs text-text-secondary">La sucursal principal controla el expediente; las demás amplían el alcance y la publicación.</p><div className="grid gap-2 sm:grid-cols-2">{branches.map((branch) => <label key={branch.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={values.includes(branch.id)} disabled={branch.id === primaryBranchId} onChange={(event) => onChange(event.target.checked ? [...values, branch.id] : values.filter((id) => id !== branch.id))} />{branch.name}{branch.id === primaryBranchId ? " · principal" : ""}</label>)}</div></fieldset>;
}

function RequisitionsPanel({ onCreateVacancy }: { onCreateVacancy: (requisition: PersonnelRequisitionDto) => void }) {
  const queryClient = useQueryClient();
  const { branches, tenantUsers, currentBranch } = useAppStore();
  const [open, setOpen] = useState(false);
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({});
  const [form, setForm] = useState<PersonnelRequisitionInput>({ title: "", department: "", justification: "", openings: 1, currency: "USD", branchIds: currentBranch ? [currentBranch.id] : [], approverUserIds: [], status: "PENDING_APPROVAL" });
  const requisitions = useQuery({ queryKey: ["personnel-requisitions"], queryFn: fetchPersonnelRequisitions });
  const create = useMutation({ mutationFn: createPersonnelRequisition, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["personnel-requisitions"] }); setOpen(false); } });
  const decide = useMutation({ mutationFn: ({ id, approved }: { id: string; approved: boolean }) => decidePersonnelRequisition(id, approved, decisionNotes[id]), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["personnel-requisitions"] }) });
  const toggle = (values: string[], id: string, checked: boolean) => checked ? [...new Set([...values, id])] : values.filter((value) => value !== id);
  const valid = form.title.trim().length > 2 && form.justification.trim().length > 4 && form.branchIds.length > 0 && (form.status === "DRAFT" || form.approverUserIds.length > 0) && (form.budgetMin ?? 0) <= (form.budgetMax ?? Number.MAX_SAFE_INTEGER);

  return <Card level={1}><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle>Requisiciones y dotación</CardTitle><p className="mt-1 text-sm text-text-secondary">Autoriza plazas y presupuesto antes de abrir la vacante.</p></div><Button variant="secondary" onClick={() => setOpen(true)}><ClipboardCheck className="size-4" />Nueva requisición</Button></div></CardHeader><CardContent className="space-y-3">{requisitions.isLoading ? <AsyncState state="loading" title="Cargando requisiciones" /> : null}{requisitions.data?.slice(0, 8).map((item) => <div key={item.id} className="grid gap-3 rounded-xl border border-border-default p-4 lg:grid-cols-[1fr_auto]"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{item.title}</p><Badge variant="secondary">{item.status}</Badge></div><p className="mt-1 text-sm text-text-secondary">{item.openings} plaza(s) · {item.budgetMin ?? "—"} - {item.budgetMax ?? "—"} {item.currency} · {item.locations.map((location) => location.branch.name).join(", ")}</p><p className="mt-2 text-sm">{item.justification}</p>{item.status === "PENDING_APPROVAL" ? <Input className="mt-3" placeholder="Nota de aprobación o motivo obligatorio de rechazo" value={decisionNotes[item.id] ?? ""} onChange={(event) => setDecisionNotes((current) => ({ ...current, [item.id]: event.target.value }))} /> : null}</div><div className="flex flex-wrap items-start gap-2">{item.status === "PENDING_APPROVAL" ? <><Button size="sm" onClick={() => decide.mutate({ id: item.id, approved: true })}>Aprobar</Button><Button size="sm" variant="destructive" disabled={!decisionNotes[item.id]?.trim()} onClick={() => decide.mutate({ id: item.id, approved: false })}>Rechazar</Button></> : null}{item.status === "APPROVED" && !item.vacancies.length ? <Button size="sm" onClick={() => onCreateVacancy(item)}>Crear vacante</Button> : null}</div></div>)}</CardContent>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Nueva requisición de personal</DialogTitle><DialogDescription>Define necesidad, dotación, presupuesto, ubicaciones y cadena de aprobación.</DialogDescription></DialogHeader><div className="grid gap-4 md:grid-cols-2"><Field id="req-title" label="Cargo solicitado" value={form.title} onChange={(title) => setForm({ ...form, title })} /><Field id="req-department" label="Área" value={form.department ?? ""} onChange={(department) => setForm({ ...form, department })} /><Field id="req-openings" label="Plazas" type="number" value={String(form.openings)} onChange={(value) => setForm({ ...form, openings: Math.max(1, Number(value)) })} /><Field id="req-currency" label="Moneda" value={form.currency} onChange={(currency) => setForm({ ...form, currency: currency.toUpperCase() })} /><Field id="req-budget-min" label="Presupuesto mínimo" type="number" value={form.budgetMin == null ? "" : String(form.budgetMin)} onChange={(value) => setForm({ ...form, budgetMin: value ? Number(value) : undefined })} /><Field id="req-budget-max" label="Presupuesto máximo" type="number" value={form.budgetMax == null ? "" : String(form.budgetMax)} onChange={(value) => setForm({ ...form, budgetMax: value ? Number(value) : undefined })} /><Field id="req-start" label="Fecha objetivo" type="date" value={form.targetStartDate ?? ""} onChange={(targetStartDate) => setForm({ ...form, targetStartDate })} /><div className="md:col-span-2"><TextArea label="Justificación" value={form.justification} onChange={(justification) => setForm({ ...form, justification })} /></div><fieldset className="space-y-2"><legend className="text-sm font-semibold">Ubicaciones</legend>{branches.map((branch) => <label key={branch.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.branchIds.includes(branch.id)} onChange={(event) => setForm({ ...form, branchIds: toggle(form.branchIds, branch.id, event.target.checked) })} />{branch.name}</label>)}</fieldset><fieldset className="space-y-2"><legend className="text-sm font-semibold">Aprobadores</legend>{tenantUsers.map((user) => <label key={user.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.approverUserIds.includes(user.id)} onChange={(event) => setForm({ ...form, approverUserIds: toggle(form.approverUserIds, user.id, event.target.checked) })} />{user.fullName}</label>)}</fieldset></div><div className="flex justify-end gap-2"><Button variant="secondary" disabled={!valid || create.isPending} onClick={() => create.mutate({ ...form, status: "DRAFT" })}>Guardar borrador</Button><Button disabled={!valid || create.isPending} onClick={() => create.mutate({ ...form, status: "PENDING_APPROVAL" })}>Enviar a aprobación</Button></div></DialogContent></Dialog>
  </Card>;
}

const requiredFieldOptions = [
  ["candidate.fullName", "Nombre del candidato"],
  ["candidate.email", "Correo del candidato"],
  ["candidate.phone", "Teléfono"],
  ["candidate.city", "Ciudad"],
  ["candidate.resumeUrl", "Currículum"],
  ["application.coverLetter", "Carta de presentación"],
  ["interview.completed", "Entrevista completada"],
  ["scorecard", "Ficha de evaluación de entrevista"],
] as const;

function VacancyStagesEditor({ stages, onChange }: { stages: VacancyStageDto[]; onChange: (stages: VacancyStageDto[]) => void }) {
  const updateStage = (index: number, patch: Partial<VacancyStageDto>) => onChange(stages.map((stage, itemIndex) => itemIndex === index ? { ...stage, ...patch } : stage));
  const renameStageCode = (index: number, nextCode: string) => {
    const previousCode = stages[index].code;
    onChange(stages.map((stage, itemIndex) => ({
      ...stage,
      ...(itemIndex === index ? { code: nextCode } : {}),
      allowedNextStageCodes: (stage.allowedNextStageCodes ?? []).map((code) => code === previousCode ? nextCode : code),
    })));
  };
  const toggleValue = (values: string[] | undefined, value: string, checked: boolean) => checked ? [...new Set([...(values ?? []), value])] : (values ?? []).filter((item) => item !== value);
  const removeStage = (index: number) => {
    const removedCode = stages[index]?.code;
    onChange(stages.filter((_, itemIndex) => itemIndex !== index).map((stage, position) => ({
      ...stage,
      position,
      allowedNextStageCodes: (stage.allowedNextStageCodes ?? []).filter((code) => code !== removedCode),
    })));
  };

  return <div className="space-y-4">
    <div className="flex items-center justify-between gap-3"><div><h3 className="font-semibold">Etapas y reglas del proceso</h3><p className="text-sm text-text-secondary">Configura rutas válidas, evidencias, aprobaciones y tiempo máximo por etapa.</p></div><Button variant="secondary" onClick={() => onChange([...stages, { code: `STAGE_${stages.length + 1}`, name: "Nueva etapa", position: stages.length, applicationStatus: "REVIEWING", allowedNextStageCodes: [], requiredFields: [], slaHours: 48 }])}><Plus className="size-4" />Etapa</Button></div>
    {stages.map((stage, index) => <Card level={3} key={`${stage.code}-${index}`}><CardContent className="space-y-5 p-4">
      <div className="grid gap-3 lg:grid-cols-[80px_1fr_1fr_200px_auto]">
        <Field id={`stage-position-${index}`} label="Orden" type="number" value={String(stage.position + 1)} onChange={(value) => updateStage(index, { position: Math.max(0, Number(value) - 1) })} />
        <Field id={`stage-name-${index}`} label="Nombre" value={stage.name} onChange={(value) => updateStage(index, { name: value })} />
        <Field id={`stage-code-${index}`} label="Código" value={stage.code} onChange={(value) => renameStageCode(index, value.toUpperCase().replace(/\W+/g, "_"))} />
        <label className="space-y-2 text-sm font-medium">Efecto<Select value={stage.applicationStatus} onValueChange={(applicationStatus) => updateStage(index, { applicationStatus: applicationStatus as VacancyStageDto["applicationStatus"], isTerminal: ["REJECTED", "HIRED"].includes(applicationStatus) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SUBMITTED">Recibida</SelectItem><SelectItem value="REVIEWING">En revisión</SelectItem><SelectItem value="INTERVIEW">Entrevista</SelectItem><SelectItem value="APPROVED">Aprobada</SelectItem><SelectItem value="REJECTED">Rechazada</SelectItem><SelectItem value="TRAINING">Capacitación</SelectItem><SelectItem value="HIRED">Contratada</SelectItem></SelectContent></Select></label>
        <Button size="icon" variant="ghost" className="self-end" aria-label={`Eliminar ${stage.name}`} disabled={stages.length <= 2} onClick={() => removeStage(index)}><Trash2 /></Button>
      </div>
      <div className="grid gap-5 border-t border-border-default pt-4 lg:grid-cols-2">
        <fieldset className="space-y-2"><legend className="text-sm font-semibold">Puede avanzar a</legend><div className="grid gap-2 sm:grid-cols-2">{stages.filter((target) => target.code !== stage.code).map((target) => <label key={target.code} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={(stage.allowedNextStageCodes ?? []).includes(target.code)} onChange={(event) => updateStage(index, { allowedNextStageCodes: toggleValue(stage.allowedNextStageCodes, target.code, event.target.checked) })} />{target.name}</label>)}</div></fieldset>
        <fieldset className="space-y-2"><legend className="text-sm font-semibold">Datos obligatorios para entrar</legend><div className="grid gap-2 sm:grid-cols-2">{requiredFieldOptions.map(([value, label]) => <label key={value} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={(stage.requiredFields ?? []).includes(value)} onChange={(event) => updateStage(index, { requiredFields: toggleValue(stage.requiredFields, value, event.target.checked) })} />{label}</label>)}</div></fieldset>
      </div>
      <div className="grid items-end gap-4 border-t border-border-default pt-4 sm:grid-cols-2 xl:grid-cols-4">
        <Field id={`stage-sla-${index}`} label="SLA máximo (horas)" type="number" value={stage.slaHours == null ? "" : String(stage.slaHours)} onChange={(value) => updateStage(index, { slaHours: value ? Math.max(1, Number(value)) : null })} />
        <Field id={`stage-sla-warning-${index}`} label="Avisar antes (horas)" type="number" value={String(stage.slaWarningHoursBefore ?? 4)} onChange={(value) => updateStage(index, { slaWarningHoursBefore: Math.max(0, Number(value)) })} />
        <Field id={`stage-sla-escalation-${index}`} label="Escalar después (horas)" type="number" value={String(stage.slaEscalationHours ?? 8)} onChange={(value) => updateStage(index, { slaEscalationHours: Math.max(0, Number(value)) })} />
        <Field id={`stage-sla-reassign-${index}`} label="Reasignar después (horas)" type="number" value={stage.autoReassignAfterHours == null ? "" : String(stage.autoReassignAfterHours)} onChange={(value) => updateStage(index, { autoReassignAfterHours: value ? Math.max(1, Number(value)) : null })} />
        <label className="flex min-h-11 items-center gap-2 text-sm font-medium"><input type="checkbox" checked={Boolean(stage.requiresApproval)} onChange={(event) => updateStage(index, { requiresApproval: event.target.checked, requiredApprovals: event.target.checked ? Math.max(1, stage.requiredApprovals ?? 1) : 0 })} />Requiere aprobación</label>
        {stage.requiresApproval ? <Field id={`stage-approvals-${index}`} label="Número de aprobaciones" type="number" value={String(Math.max(1, stage.requiredApprovals ?? 1))} onChange={(value) => updateStage(index, { requiredApprovals: Math.max(1, Number(value)) })} /> : null}
        {stage.applicationStatus === "REJECTED" ? <label className="flex min-h-11 items-center gap-2 text-sm font-medium"><input type="checkbox" checked={Boolean(stage.allowReopen)} onChange={(event) => updateStage(index, { allowReopen: event.target.checked })} />Permitir reapertura</label> : null}
      </div>
    </CardContent></Card>)}
  </div>;
}

function Field({ id, label, value, onChange, type = "text", className, maxLength }: { id: string; label: string; value: string; onChange: (value: string) => void; type?: string; className?: string; maxLength?: number }) { return <label className={`space-y-2 text-sm font-medium ${className ?? ""}`} htmlFor={id}>{label}<Input id={id} type={type} min={type === "number" ? 0 : undefined} maxLength={maxLength} value={value} onChange={(event) => onChange(event.target.value)} /></label>; }
function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { const id = `vacancy-${label.toLocaleLowerCase("es")}`; return <label className="space-y-2 text-sm font-medium" htmlFor={id}>{label}<textarea id={id} value={value} onChange={(event) => onChange(event.target.value)} rows={4} className="w-full rounded-xl border border-border-default bg-surface-elevated p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus" /></label>; }
function Summary({ label, value }: { label: string; value?: string }) { return <div><dt className="text-xs text-text-secondary">{label}</dt><dd className="mt-1 font-medium">{value || "No informado"}</dd></div>; }
function VacancyImage({ imageUrl, title }: { imageUrl?: string | null; title: string }) {
  const source = imageUrl || "/images/vacancies/operations-leadership-fallback.png";
  const alt = imageUrl
    ? `Imagen representativa del cargo ${title}`
    : `Equipo de liderazgo operativo, imagen descriptiva para la vacante ${title}`;
  return <div className="relative aspect-[16/7] overflow-hidden bg-gradient-to-br from-primary/15 via-surface-section to-info/15"><Image src={source} alt={alt} fill unoptimized className="object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-slate-950/25 via-transparent to-transparent" />{!imageUrl ? <span className="absolute bottom-3 left-3 rounded-full bg-slate-950/65 px-3 py-1 text-xs font-medium text-white">Imagen ilustrativa</span> : null}</div>;
}
