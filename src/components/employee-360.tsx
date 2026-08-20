"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, BriefcaseBusiness, Clock3, Download, FilePenLine, FileText, MapPin, Pencil, ShieldCheck, Upload, UserRound, WalletCards } from "lucide-react";
import { AsyncState } from "@/components/async-state";
import { InlineFeedback, PageHeader } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  fetchEmployeeDetail,
  fetchEmployeeDocumentFile,
  fetchEmployeeDossier360,
  fetchEmployeePayrollCompliance,
  getApiErrorMessage,
  replaceEmployeeDocument,
  updateEmployeeDocument,
  uploadEmployeeDocument,
} from "@/lib/backend";
import type { EmployeeDossier360Snapshot, EmployeePayrollComplianceSnapshot } from "@/lib/backend";
import { useAppStore } from "@/store/app-store";

type DossierDocument = EmployeeDossier360Snapshot["documents"]["documents"][number];
type DossierRequirement = EmployeeDossier360Snapshot["compliance"]["requirements"][number];

export function Employee360Page({ employeeId }: { employeeId: string }) {
  const { can, currentRole } = useAppStore();
  const queryClient = useQueryClient();
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [documentExpiresAt, setDocumentExpiresAt] = useState("");
  const [documentNotes, setDocumentNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [requirementDialogOpen, setRequirementDialogOpen] = useState(false);
  const [targetRequirement, setTargetRequirement] = useState<DossierRequirement | null>(null);
  const [requirementFile, setRequirementFile] = useState<File | null>(null);
  const [requirementExpiresAt, setRequirementExpiresAt] = useState("");
  const [requirementNotes, setRequirementNotes] = useState("");

  const dossier = useQuery({ queryKey: ["employee-360", employeeId], queryFn: () => fetchEmployeeDetail(employeeId) });
  const payrollCompliance = useQuery({
    queryKey: ["employee-payroll-compliance", employeeId],
    queryFn: () => fetchEmployeePayrollCompliance(employeeId),
    enabled: can("employees.read"),
  });
  const dossier360 = useQuery({ queryKey: ["employee-dossier-360", employeeId], queryFn: () => fetchEmployeeDossier360(employeeId) });
  const canManageFiles = currentRole === "admin_empresa";

  const selectedDocument = dossier360.data?.documents.documents.find((document) => document.id === selectedDocumentId) ?? null;

  const refreshDocuments = () => {
    void queryClient.invalidateQueries({ queryKey: ["employee-dossier-360", employeeId] });
    void queryClient.invalidateQueries({ queryKey: ["employee-360", employeeId] });
  };

  const addDocument = useMutation({
    mutationFn: ({ file, documentType, expiresAt, notes }: { file: File; documentType: string; expiresAt?: string | null; notes?: string | null }) =>
      uploadEmployeeDocument(employeeId, { file, section: "employment", documentType, expiresAt: expiresAt ?? null, notes: notes ?? undefined }),
    onSuccess: refreshDocuments,
    onError: (error) => setDocumentError(getApiErrorMessage(error, "No fue posible cargar el documento.")),
  });

  const updateDocument = useMutation({
    mutationFn: ({ documentId, expiresAt, notes }: { documentId: string; expiresAt?: string | null; notes?: string | null }) =>
      updateEmployeeDocument(employeeId, documentId, { expiresAt: expiresAt ?? null, notes: notes ?? undefined }),
    onSuccess: () => {
      setDocumentError(null);
      setDocumentDialogOpen(false);
      setSelectedDocumentId(null);
      refreshDocuments();
    },
    onError: (error) => setDocumentError(getApiErrorMessage(error, "No fue posible actualizar el documento.")),
  });

  const replaceDocument = useMutation({
    mutationFn: ({ documentId, file, expiresAt, notes }: { documentId: string; file: File; expiresAt?: string | null; notes?: string | null }) =>
      replaceEmployeeDocument(employeeId, documentId, { file, expiresAt: expiresAt ?? null, notes: notes ?? undefined }),
    onSuccess: () => {
      setDocumentError(null);
      setSelectedFile(null);
      setDocumentDialogOpen(false);
      setSelectedDocumentId(null);
      refreshDocuments();
    },
    onError: (error) => setDocumentError(getApiErrorMessage(error, "No fue posible reemplazar el documento.")),
  });

  if (dossier.isLoading) return <AsyncState state="loading" title="Cargando expediente" description="Preparamos la información laboral y la trazabilidad del empleado." />;
  if (dossier.isError || !dossier.data) return <AsyncState state="error" title="No fue posible cargar el expediente" description={getApiErrorMessage(dossier.error, "El expediente no está disponible en este contexto.")} onRetry={() => void dossier.refetch()} />;

  const { employee, documents, history } = dossier.data;
  const primary = employee.branchAssignments.find((assignment) => assignment.isPrimary) ?? employee.branchAssignments[0];
  const complianceSnapshot = dossier360.data?.compliance ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Personas / Empleados"
        title={employee.name}
        description={<span className="flex flex-wrap gap-x-3 gap-y-1"><span>{employee.jobTitle ?? primary?.role ?? "Cargo sin definir"}</span><span>{primary?.branch.name ?? "Sucursal sin asignar"}</span></span>}
        actions={<><Button asChild variant="secondary"><Link href="/employees"><ArrowLeft className="size-4" />Directorio</Link></Button>{can("employees.update") ? <Button asChild><Link href={`/employees/${employeeId}/edit`}><Pencil className="size-4" />Editar</Link></Button> : null}</>}
      />

      <Card level={2}>
        <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xl font-semibold text-primary">{initials(employee.name)}</div>
            <div className="min-w-0">
              <p className="truncate text-xl font-semibold">{employee.name}</p>
              <p className="mt-1 truncate text-sm text-text-secondary">{employee.email}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant={employee.status === "ACTIVE" ? "success" : "secondary"}>{statusLabel(employee.status)}</Badge>
                {primary ? <Badge variant="outline"><MapPin className="mr-1 size-3.5" />{primary.branch.name}</Badge> : null}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-64">
            <Metric label="Documentos" value={String(dossier360.data?.documents.summary.total ?? documents.length)} />
            <Metric label="Asignaciones" value={String(employee.branchAssignments.length)} />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-5">
        <div className="overflow-x-auto pb-1">
          <TabsList className="min-w-max">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="employment">Empleo</TabsTrigger>
            {can("employees.read") ? <TabsTrigger value="payroll">Nómina</TabsTrigger> : null}
            {can("employees.read") ? <TabsTrigger value="tax">Impuestos y elegibilidad</TabsTrigger> : null}
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="compliance">Cumplimiento</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
            {can("employees.read") ? <TabsTrigger value="audit">Auditoría</TabsTrigger> : null}
          </TabsList>
        </div>
        <TabsContent value="overview">
          <Overview employee={employee} documents={dossier360.data?.documents.summary.total ?? documents.length} snapshot={complianceSnapshot} />
        </TabsContent>
        <TabsContent value="employment"><Employment employee={employee} /></TabsContent>
        {can("employees.read") ? <TabsContent value="payroll"><Payroll snapshot={payrollCompliance.data} isLoading={payrollCompliance.isLoading} error={payrollCompliance.error} onRetry={() => void payrollCompliance.refetch()} /></TabsContent> : null}
        {can("employees.read") ? <TabsContent value="tax"><TaxEligibility snapshot={payrollCompliance.data} isLoading={payrollCompliance.isLoading} error={payrollCompliance.error} onRetry={() => void payrollCompliance.refetch()} /></TabsContent> : null}
        <TabsContent value="documents">
          <Documents
            employeeId={employeeId}
            documents={dossier360.data?.documents.documents ?? []}
            summary={dossier360.data?.documents.summary ?? null}
            isLoading={dossier360.isLoading}
            canManageFiles={canManageFiles}
            onOpenDocument={(id) => {
              setSelectedDocumentId(id);
              setDocumentError(null);
              setDocumentDialogOpen(true);
            }}
            onUpload={(file, documentType, expiresAt, notes) => addDocument.mutate({ file, documentType, expiresAt, notes })}
            onCompleteRequirement={(requirement) => {
              setTargetRequirement(requirement);
              setRequirementFile(null);
              setRequirementExpiresAt("");
              setRequirementNotes("");
              setDocumentError(null);
              setRequirementDialogOpen(true);
            }}
          />
        </TabsContent>
        <TabsContent value="compliance">
          <Compliance
            snapshot={complianceSnapshot}
            isLoading={dossier360.isLoading}
            canView={can("employees.read")}
            onCompleteRequirement={(requirement) => {
              setTargetRequirement(requirement);
              setRequirementFile(null);
              setRequirementExpiresAt("");
              setRequirementNotes("");
              setDocumentError(null);
              setRequirementDialogOpen(true);
            }}
          />
        </TabsContent>
        <TabsContent value="history"><History events={history} /></TabsContent>
        {can("employees.read") ? <TabsContent value="audit"><Audit snapshot={payrollCompliance.data} isLoading={payrollCompliance.isLoading} error={payrollCompliance.error} onRetry={() => void payrollCompliance.refetch()} /></TabsContent> : null}
      </Tabs>

      <Dialog
        open={documentDialogOpen}
        onOpenChange={(open) => {
          setDocumentDialogOpen(open);
          if (!open) {
            setSelectedDocumentId(null);
            setSelectedFile(null);
            setDocumentExpiresAt("");
            setDocumentNotes("");
            setDocumentError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Documento del expediente</DialogTitle>
            <DialogDescription>Solo el administrador de empresa puede ver o reemplazar el archivo sensible.</DialogDescription>
          </DialogHeader>
          {selectedDocument ? (
            canManageFiles ? (
              <div className="space-y-4">
                <div className="grid gap-3 rounded-2xl border border-border-default bg-surface-elevated p-4 sm:grid-cols-2">
                  <Summary label="Documento" value={selectedDocument.originalName} />
                  <Summary label="Estado" value={selectedDocument.status.replaceAll("_", " ")} />
                  <Summary label="Tipo" value={selectedDocument.category} />
                  <Summary label="Versión" value={`v${selectedDocument.version}`} />
                  <Summary label="Tamaño" value={formatFileSize(selectedDocument.sizeBytes)} />
                  <Summary label="Vigencia" value={selectedDocument.expiresAt ? formatDate(selectedDocument.expiresAt) : "Sin vencimiento"} />
                </div>
                <InlineFeedback tone="info" title="Acceso permitido">Puedes abrir, reemplazar y actualizar la vigencia de este archivo.</InlineFeedback>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" onClick={() => void openDocumentFile(employeeId, selectedDocument, setDocumentError)}><Download className="size-4" />Ver archivo</Button>
                </div>
                <div className="space-y-4 rounded-2xl border border-border-default p-4">
                  <FormField id="employee-document-expires-at" label="Vigencia">{(field) => <Input {...field} type="date" value={documentExpiresAt} onChange={(event) => setDocumentExpiresAt(event.target.value)} />}</FormField>
                  <FormField id="employee-document-notes" label="Notas">{(field) => <Input {...field} value={documentNotes} onChange={(event) => setDocumentNotes(event.target.value)} placeholder="Notas internas del expediente" />}</FormField>
                  <FormField id="employee-document-file" label="Nuevo archivo">{(field) => <Input {...field} type="file" accept=".pdf,image/jpeg,image/png" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} />}</FormField>
                  {documentError ? <InlineFeedback tone="danger" title="No se pudo completar">{documentError}</InlineFeedback> : null}
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={() => updateDocument.mutate({ documentId: selectedDocument.id, expiresAt: documentExpiresAt || null, notes: documentNotes || null })} disabled={updateDocument.isPending}>Actualizar vigencia</Button>
                    <Button
                      type="button"
                      onClick={() => {
                        if (!selectedFile) {
                          setDocumentError("Selecciona un archivo para reemplazar.");
                          return;
                        }
                        replaceDocument.mutate({ documentId: selectedDocument.id, file: selectedFile, expiresAt: documentExpiresAt || null, notes: documentNotes || null });
                      }}
                      disabled={replaceDocument.isPending}
                    >
                      Reemplazar documento
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <InlineFeedback tone="warning" title="Acceso restringido">Solo el administrador de empresa puede ver o reemplazar archivos sensibles.</InlineFeedback>
            )
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={requirementDialogOpen}
        onOpenChange={(open) => {
          setRequirementDialogOpen(open);
          if (!open) {
            setTargetRequirement(null);
            setRequirementFile(null);
            setRequirementExpiresAt("");
            setRequirementNotes("");
            setDocumentError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Completar documento requerido</DialogTitle>
            <DialogDescription>Sube el archivo asociado al requisito para dejar trazabilidad en el expediente.</DialogDescription>
          </DialogHeader>
          {targetRequirement ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border-default bg-surface-elevated p-4">
                <p className="font-medium">{targetRequirement.title}</p>
                <p className="mt-1 text-sm text-text-secondary">{targetRequirement.category} · {targetRequirement.jurisdiction} · {targetRequirement.required ? "Requerido" : "No requerido"}</p>
              </div>
              <div className="space-y-4">
                <FormField id="requirement-document-file" label="Archivo">{(field) => <Input {...field} type="file" accept=".pdf,image/jpeg,image/png" onChange={(event) => setRequirementFile(event.target.files?.[0] ?? null)} />}</FormField>
                <FormField id="requirement-document-expires" label="Vigencia">{(field) => <Input {...field} type="date" value={requirementExpiresAt} onChange={(event) => setRequirementExpiresAt(event.target.value)} />}</FormField>
                <FormField id="requirement-document-notes" label="Notas">{(field) => <Input {...field} value={requirementNotes} onChange={(event) => setRequirementNotes(event.target.value)} placeholder="Notas internas del expediente" />}</FormField>
                {documentError ? <InlineFeedback tone="danger" title="No se pudo completar">{documentError}</InlineFeedback> : null}
                <div className="flex flex-wrap justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={() => setRequirementDialogOpen(false)}>Cancelar</Button>
                  <Button
                    type="button"
                    disabled={addDocument.isPending}
                    onClick={() => {
                      if (!requirementFile) {
                        setDocumentError("Selecciona un archivo para continuar.");
                        return;
                      }
                      addDocument.mutate(
                        {
                          file: requirementFile,
                          documentType: targetRequirement.code,
                          expiresAt: requirementExpiresAt || null,
                          notes: requirementNotes || null,
                        },
                        {
                          onSuccess: () => {
                            setRequirementDialogOpen(false);
                            setTargetRequirement(null);
                            setRequirementFile(null);
                            setRequirementExpiresAt("");
                            setRequirementNotes("");
                          },
                        },
                      );
                    }}
                  >
                    Completar documento
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Overview({ employee, documents, snapshot }: { employee: Awaited<ReturnType<typeof fetchEmployeeDetail>>["employee"]; documents: number; snapshot: EmployeeDossier360Snapshot["compliance"] | null }) {
  const primary = employee.branchAssignments.find((assignment) => assignment.isPrimary) ?? employee.branchAssignments[0];
  const source = "recordSource" in employee ? employee.recordSource : undefined;

  return (
    <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
      <Card level={2}><CardContent className="p-5"><SectionTitle icon={<UserRound className="size-4" />} title="Información básica" /><dl className="mt-4 grid gap-4 sm:grid-cols-2"><Datum label="ID de empleado" value={employee.id} /><Datum label="Correo" value={employee.email} /><Datum label="Estado" value={statusLabel(employee.status)} /><Datum label="Origen" value={source === "CANDIDATE_CONVERSION" ? "Conversión de candidato" : "Directorio"} /></dl></CardContent></Card>
      <div className="space-y-5">
        <Card level={2}><CardContent className="p-5"><SectionTitle icon={<BriefcaseBusiness className="size-4" />} title="Relación laboral" /><dl className="mt-4 grid gap-4"><Datum label="Cargo" value={employee.jobTitle ?? primary?.role ?? "Sin definir"} /><Datum label="Sucursal" value={primary?.branch.name ?? "Sin asignar"} /></dl></CardContent></Card>
        <Card level={2}><CardContent className="p-5"><SectionTitle icon={<FileText className="size-4" />} title="Documentos" /><p className="mt-3 text-3xl font-semibold">{documents}</p><p className="mt-1 text-sm text-text-secondary">documentos en el expediente</p></CardContent></Card>
      </div>
      {snapshot ? <InlineFeedback tone="info" title="Cumplimiento del expediente">{snapshot.requirements.length} requisitos activos y {snapshot.alerts?.length ?? 0} alertas de cumplimiento.</InlineFeedback> : <InlineFeedback tone="info" title="Sin datos de cumplimiento">Aún no hay datos de cumplimiento asociados a este expediente.</InlineFeedback>}
    </div>
  );
}

function Employment({ employee }: { employee: Awaited<ReturnType<typeof fetchEmployeeDetail>>["employee"] }) {
  return <div className="space-y-5"><Card level={2}><CardContent className="p-5"><SectionTitle icon={<BriefcaseBusiness className="size-4" />} title="Asignaciones activas" /><div className="mt-4 divide-y divide-border-default">{employee.branchAssignments.length ? employee.branchAssignments.map((assignment) => <div key={assignment.id} className="flex flex-col gap-2 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{assignment.branch.name}</p><p className="text-sm text-text-secondary">{assignment.role}</p></div><Badge variant={assignment.isPrimary ? "success" : "secondary"}>{assignment.isPrimary ? "Principal" : "Secundaria"}</Badge></div>) : <p className="text-sm text-text-secondary">No hay una sucursal asignada.</p>}</div></CardContent></Card></div>;
}

function Payroll({ snapshot, isLoading, error, onRetry }: SnapshotSectionProps) {
  if (isLoading) return <AsyncState state="loading" title="Cargando nómina" description="Consultamos la configuración de nómina autorizada." />;
  if (error) return <AsyncState state="error" title="No fue posible cargar nómina" description={getApiErrorMessage(error, "No tienes permiso para consultar esta sección del expediente.")} onRetry={onRetry} />;
  if (!snapshot) return null;

  const payroll = snapshot.payroll;
  const configured = Boolean(payroll.payType || payroll.payrollProvider || payroll.payrollEmployeeId);
  return <div className="space-y-5"><Card level={2}><CardContent className="p-5"><SectionTitle icon={<WalletCards className="size-4" />} title="Configuración de nómina" />{configured ? <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Datum label="Tipo de pago" value={payroll.payType ?? "Sin configurar"} /><Datum label="Frecuencia" value={payroll.payFrequency ?? "Sin configurar"} /><Datum label="Elegible para horas extra" value={booleanLabel(payroll.overtimeEligible)} /><Datum label="Semana laboral" value={payroll.workweekStartDay ?? "Sin configurar"} /><Datum label="Proveedor" value={payroll.payrollProvider ?? "Sin configurar"} /><Datum label="ID de nómina" value={payroll.payrollEmployeeId ?? "Sin configurar"} /></dl> : <EmptyState title="Nómina aún no configurada" description="El expediente está preparado para enlazar una integración de nómina, pero el proveedor aún no ha registrado datos para este empleado." />}</CardContent></Card><InlineFeedback tone="info" title="Información protegida">Las tasas de pago y referencias externas no se solicitan ni se muestran hasta que el backend publique permisos y operaciones específicas de compensación.</InlineFeedback></div>;
}

function TaxEligibility({ snapshot, isLoading, error, onRetry }: SnapshotSectionProps) {
  if (isLoading) return <AsyncState state="loading" title="Cargando impuestos y elegibilidad" />;
  if (error) return <AsyncState state="error" title="No fue posible cargar impuestos y elegibilidad" description={getApiErrorMessage(error, "No tienes permiso para consultar esta sección del expediente.")} onRetry={onRetry} />;
  if (!snapshot) return null;

  const items = [
    { label: "SSN", status: snapshot.tax.ssnMasked ? "Registrado" : "No registrado", detail: snapshot.tax.ssnMasked ?? "No se ha registrado un identificador fiscal visible." },
    { label: "W-4", status: snapshot.tax.w4Status, detail: snapshot.tax.w4CompletedAt ? `Actualizado ${formatDate(snapshot.tax.w4CompletedAt)}` : "Sin documento asociado" },
    { label: "I-9", status: snapshot.i9.status, detail: snapshot.i9.verificationCompletedAt ? `Verificado ${formatDate(snapshot.i9.verificationCompletedAt)}` : "Sin verificación registrada" },
    { label: "E-Verify", status: snapshot.eVerify.status, detail: snapshot.eVerify.required ? (snapshot.eVerify.completedAt ? `Completado ${formatDate(snapshot.eVerify.completedAt)}` : "Requerido por la política aplicable") : "No requerido" },
    { label: "Florida New Hire", status: snapshot.floridaNewHire.status, detail: snapshot.floridaNewHire.required ? (snapshot.floridaNewHire.dueDate ? `Vence ${formatDate(snapshot.floridaNewHire.dueDate)}` : "Pendiente de reporte") : "No requerido" },
  ];

  return <div className="space-y-5"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((item) => <Card key={item.label} level={2}><CardContent className="p-5"><p className="font-semibold">{item.label}</p><div className="mt-3"><ComplianceBadge status={item.status} /></div><p className="mt-3 text-sm text-text-secondary">{item.detail}</p></CardContent></Card>)}</div><InlineFeedback tone="info" title="Datos fiscales protegidos">El expediente solo muestra valores enmascarados. Las configuraciones y documentos sensibles se gestionan mediante permisos y endpoints específicos.</InlineFeedback></div>;
}

function Documents({
  employeeId,
  documents,
  summary,
  isLoading,
  canManageFiles,
  onOpenDocument,
  onUpload,
  onCompleteRequirement,
}: {
  employeeId: string;
  documents: DossierDocument[];
  summary: EmployeeDossier360Snapshot["documents"]["summary"] | null;
  isLoading: boolean;
  canManageFiles: boolean;
  onOpenDocument: (id: string) => void;
  onUpload: (file: File, documentType: string, expiresAt?: string | null, notes?: string | null) => void;
  onCompleteRequirement: (requirement: DossierRequirement) => void;
}) {
  if (isLoading) return <AsyncState state="loading" title="Cargando documentos" description="Consultamos el expediente documental." />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Documentos del expediente</h2>
          <p className="mt-1 text-sm text-text-secondary">{summary ? `${summary.total} documento${summary.total === 1 ? "" : "s"} en expediente` : "Resumen no disponible"}</p>
        </div>
        {canManageFiles ? (
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-text-on-accent">
            <Upload className="size-4" />
            Adjuntar documento
            <Input
              className="sr-only"
              type="file"
              accept=".pdf,image/jpeg,image/png"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                if (file) onUpload(file, "ADDITIONAL");
                event.currentTarget.value = "";
              }}
            />
          </label>
        ) : null}
      </div>
      {!canManageFiles ? <InlineFeedback tone="warning" title="Acceso restringido">Solo el administrador de empresa puede ver o reemplazar archivos sensibles.</InlineFeedback> : null}
      {documents.length ? (
        <div className="grid gap-3">
          {documents.map((document) => (
            <Card key={document.id} level={2}>
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <FileText className="size-4 text-primary" />
                    <p className="truncate font-medium">{document.originalName}</p>
                    <Badge variant={document.status === "APPROVED" ? "success" : document.status === "REJECTED" ? "destructive" : "secondary"}>{document.status.replaceAll("_", " ")}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-text-secondary">{document.category} · {formatFileSize(document.sizeBytes)} · v{document.version}</p>
                  <p className="mt-1 text-xs text-text-secondary">Escaneo: {document.scanStatus} · {document.expiresAt ? `Vence ${formatDate(document.expiresAt)}` : "Sin vencimiento"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {canManageFiles ? <Button variant="secondary" size="sm" onClick={() => onOpenDocument(document.id)}><Download className="size-4" />Ver archivo</Button> : null}
                  {canManageFiles ? <Button variant="secondary" size="sm" onClick={() => onOpenDocument(document.id)}><FilePenLine className="size-4" />Reemplazar</Button> : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="Aún no hay documentos" description={canManageFiles ? "Carga el primer archivo para incorporarlo al expediente." : "No hay archivos visibles para este rol."} />
      )}
      {summary ? (
        <Card level={2}>
          <CardContent className="p-5">
            <SectionTitle icon={<ShieldCheck className="size-4" />} title="Requisitos del expediente" />
            <div className="mt-4 divide-y divide-border-default">
              {summary.byCategory ? Object.entries(summary.byCategory).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between py-3">
                  <p className="font-medium">{category}</p>
                  <Badge variant="outline">{count}</Badge>
                </div>
              )) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Compliance({
  snapshot,
  isLoading,
  canView,
  onCompleteRequirement,
}: {
  snapshot: EmployeeDossier360Snapshot["compliance"] | null;
  isLoading: boolean;
  canView: boolean;
  onCompleteRequirement: (requirement: DossierRequirement) => void;
}) {
  if (!canView) return <InlineFeedback tone="info" title="Sin permiso de cumplimiento">No cuentas con acceso al cumplimiento de este empleado.</InlineFeedback>;
  if (isLoading) return <AsyncState state="loading" title="Cargando cumplimiento" description="Calculamos el estado del expediente." />;
  if (!snapshot) return <EmptyState title="Sin datos de cumplimiento" description="El cumplimiento se habilita cuando exista información disponible para este expediente." />;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Requisitos" value={String(snapshot.requirements.length)} icon={<ShieldCheck className="size-5" />} />
        <MetricCard label="Alertas" value={String(snapshot.alerts?.length ?? 0)} icon={<AlertTriangle className="size-5" />} />
        <MetricCard label="Expediente" value="Activo" icon={<FileText className="size-5" />} />
      </div>
      <Card level={2}>
        <CardContent className="p-5">
          <SectionTitle icon={<ShieldCheck className="size-4" />} title="Requisitos del expediente" />
          <div className="mt-4 divide-y divide-border-default">
            {snapshot.requirements.length ? snapshot.requirements.map((item) => (
              <div key={item.id} className="flex flex-col gap-3 py-4 first:pt-0 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {item.category} · {item.jurisdiction}
                    {item.dueDate ? ` · vence ${formatDate(item.dueDate)}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-text-secondary">Código: {item.code}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={item.required ? "secondary" : "outline"}>{item.status.replaceAll("_", " ")}</Badge>
                  <Badge variant="outline">{item.expiresAt ? `Expira ${formatDate(item.expiresAt)}` : "Sin expiración"}</Badge>
                  {item.required && item.status !== "COMPLETE" ? (
                    <Button type="button" size="sm" variant="secondary" onClick={() => onCompleteRequirement(item)}>
                      Completar documento
                    </Button>
                  ) : null}
                </div>
              </div>
            )) : <p className="text-sm text-text-secondary">No hay requisitos configurados en este expediente.</p>}
          </div>
          <InlineFeedback tone="info" title="Dónde se completan los documentos">Desde aquí se sube el archivo asociado a cada requisito. Si el backend lo mantiene pendiente, el archivo queda guardado en el expediente para su revisión.</InlineFeedback>
        </CardContent>
      </Card>
      {snapshot.alerts?.length ? <InlineFeedback tone="warning" title="Alertas del expediente">{snapshot.alerts.map((alert) => alert.message).join(" · ")}</InlineFeedback> : null}
    </div>
  );
}

function History({ events }: { events: Awaited<ReturnType<typeof fetchEmployeeDetail>>["history"] }) {
  return <Card level={2}><CardContent className="p-5"><SectionTitle icon={<Clock3 className="size-4" />} title="Actividad del expediente" /><ol className="mt-5 space-y-5 border-l border-border-default pl-5">{events.length ? events.map((event) => <li key={event.id} className="relative"><span className="absolute -left-[1.7rem] top-1 size-3 rounded-full border-2 border-card bg-primary" /><p className="font-medium">{event.title}</p><p className="mt-1 text-sm text-text-secondary">{event.detail}</p><time className="mt-2 block text-xs text-text-secondary">{formatDate(event.at)}</time></li>) : <li className="text-sm text-text-secondary">Todavía no hay eventos de historial.</li>}</ol></CardContent></Card>;
}

function Audit({ snapshot, isLoading, error, onRetry }: SnapshotSectionProps) {
  if (isLoading) return <AsyncState state="loading" title="Cargando auditoría" />;
  if (error) return <AsyncState state="error" title="No fue posible cargar auditoría" description={getApiErrorMessage(error, "No tienes permiso para consultar esta sección del expediente.")} onRetry={onRetry} />;
  if (!snapshot) return null;
  return <div className="space-y-5">{snapshot.alerts.length ? <InlineFeedback tone="warning" title="Alertas del expediente">{snapshot.alerts.map((alert) => alert.message).join(" · ")}</InlineFeedback> : null}<Card level={2}><CardContent className="p-5"><SectionTitle icon={<Clock3 className="size-4" />} title="Trazabilidad del expediente" /><div className="mt-4 divide-y divide-border-default">{snapshot.auditTrail.length ? snapshot.auditTrail.map((event) => <div key={event.id} className="flex flex-col gap-1 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{event.action}</p><p className="text-sm text-text-secondary">{event.actorEmail ?? event.actorRole ?? "Sistema"}</p></div><time className="text-xs text-text-secondary">{formatDate(event.createdAt)}</time></div>) : <p className="text-sm text-text-secondary">No hay eventos auditables disponibles.</p>}</div></CardContent></Card></div>;
}

type SnapshotSectionProps = { snapshot?: EmployeePayrollComplianceSnapshot; isLoading: boolean; error: unknown; onRetry: () => void };

async function openDocumentFile(employeeId: string, document: DossierDocument, setError: (value: string | null) => void) {
  try {
    const blob = await fetchEmployeeDocumentFile(employeeId, document.id);
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  } catch (error) {
    setError(getApiErrorMessage(error, "No fue posible abrir el archivo."));
  }
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) { return <h2 className="flex items-center gap-2 font-semibold">{icon}{title}</h2>; }
function Datum({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">{label}</dt><dd className="mt-1 break-words font-medium">{value}</dd></div>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-border-default bg-surface-section p-3"><p className="text-xs text-text-secondary">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div>; }
function MetricCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <Card level={2}><CardContent className="p-5"><div className="flex items-center justify-between text-text-secondary"><p className="text-sm">{label}</p>{icon}</div><p className="mt-3 text-3xl font-semibold">{value}</p></CardContent></Card>; }
function EmptyState({ title, description }: { title: string; description: string }) { return <Card level={2}><CardContent className="p-8 text-center"><FileText className="mx-auto size-8 text-text-secondary" /><h2 className="mt-3 font-semibold">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">{description}</p></CardContent></Card>; }
function Summary({ label, value }: { label: string; value: string }) { return <div><p className="text-xs uppercase tracking-wide text-text-secondary">{label}</p><p className="mt-1 font-medium">{value}</p></div>; }
function ComplianceBadge({ status }: { status: string }) { const normalized = status.replaceAll("_", " ").toLowerCase(); const label = normalized.charAt(0).toUpperCase() + normalized.slice(1); const variant = /complete|verified|authorized|registered/.test(normalized) ? "success" : /expired|rejected|failed/.test(normalized) ? "destructive" : "secondary"; return <Badge variant={variant}>{label}</Badge>; }
function initials(name: string) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
function statusLabel(status: string) { return ({ ACTIVE: "Activo", INACTIVE: "Inactivo", TERMINATED: "Finalizado" } as Record<string, string>)[status] ?? status; }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(date); }
function formatFileSize(bytes: number) { if (bytes < 1024) return `${bytes} B`; if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`; return `${(bytes / (1024 * 1024)).toFixed(1)} MB`; }
function booleanLabel(value: boolean | null) { return value === null ? "Sin configurar" : value ? "Sí" : "No"; }
