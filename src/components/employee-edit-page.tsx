"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileText, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AsyncState } from "@/components/async-state";
import { InlineFeedback, PageHeader } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  fetchBranches,
  fetchEmployeeEditor,
  getApiErrorMessage,
  uploadEmployeeDocument,
  updateEmployeeContact,
  updateEmployeeEmergencyContact,
  updateEmployeeEmployment,
  updateEmployeeFloridaNewHire,
  updateEmployeePayroll,
  updateEmployeePersonal,
  updateEmployeeTax,
  updateEmployeeWorkEligibility,
  type EmployeeEditorRecord,
} from "@/lib/backend";
import { useAppStore } from "@/store/app-store";

type EditorForm = {
  personal: Record<string, string>;
  contact: Record<string, string>;
  employment: Record<string, string>;
  payroll: Record<string, string | boolean>;
  tax: Record<string, string>;
  eligibility: Record<string, string | boolean>;
  floridaNewHire: Record<string, string | boolean>;
  emergencyContact: Record<string, string>;
};

type EvidenceDraft = {
  id: string;
  section: "tax" | "eligibility" | "floridaNewHire";
  label: string;
  file: File;
};

export function EmployeeEditPage({ employeeId }: { employeeId: string }) {
  const { can, tenantUsers } = useAppStore();
  const queryClient = useQueryClient();
  const editor = useQuery({ queryKey: ["employee-editor", employeeId], queryFn: () => fetchEmployeeEditor(employeeId) });
  const branches = useQuery({ queryKey: ["employee-editor-branches"], queryFn: () => fetchBranches(), enabled: can("employees.update") });
  const [form, setForm] = useState<EditorForm | null>(null);
  const [evidenceDrafts, setEvidenceDrafts] = useState<EvidenceDraft[]>([]);

  useEffect(() => {
    if (editor.data) setForm(toEditorForm(editor.data));
  }, [editor.data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!form || !editor.data) return;
      const initialBranchId = editor.data.employment.primaryBranchId ?? "";
      const employment = { ...form.employment };
      if (employment.primaryBranchId === initialBranchId) delete employment.primaryBranchId;
      if (!employment.primaryBranchId) delete employment.primaryBranchId;
      await Promise.all([
        updateEmployeePersonal(employeeId, form.personal),
        updateEmployeeContact(employeeId, form.contact),
        updateEmployeeEmployment(employeeId, employment),
        updateEmployeePayroll(employeeId, withoutBlankSecrets(form.payroll, ["payRate", "regularHourlyRate"])),
        updateEmployeeTax(employeeId, withoutBlankSecrets(form.tax, ["ssn"])),
        updateEmployeeWorkEligibility(employeeId, form.eligibility),
        updateEmployeeFloridaNewHire(employeeId, form.floridaNewHire),
        updateEmployeeEmergencyContact(employeeId, form.emergencyContact),
      ]);
      if (evidenceDrafts.length) {
        await Promise.all(evidenceDrafts.map((draft) => uploadEmployeeDocument(employeeId, { file: draft.file, section: draft.section, documentType: draft.label })));
      }
    },
    onSuccess: async () => {
      toast.success("Expediente del empleado actualizado");
      setEvidenceDrafts([]);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["employees"] }),
        queryClient.invalidateQueries({ queryKey: ["employee-editor", employeeId] }),
        queryClient.invalidateQueries({ queryKey: ["employee-360", employeeId] }),
      ]);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible actualizar el expediente.")),
  });

  const addEvidence = async (section: EvidenceDraft["section"], label: string, file: File | null) => {
    if (!file) return;
    setEvidenceDrafts((current) => [...current.filter((item) => item.label !== label), { id: `${section}-${label}-${file.name}-${file.size}`, section, label, file }]);
    toast.success(`Archivo preparado para ${label.toLowerCase()}`);
  };

  if (editor.isLoading || !form) return <AsyncState state="loading" title="Cargando expediente editable" description="Preparamos los datos laborales, nómina y cumplimiento del empleado." />;
  if (editor.isError || !editor.data) return <AsyncState state="error" title="No fue posible cargar el editor" description={getApiErrorMessage(editor.error, "El expediente no está disponible.")} onRetry={() => void editor.refetch()} />;

  const update = (section: keyof EditorForm, key: string, value: string | boolean) => setForm((current) => current ? { ...current, [section]: { ...current[section], [key]: value } } : current);
  const activeBranches = (branches.data ?? []).filter((branch) => branch.status === "active");
  const requirements = editor.data.requirements;

  return <div className="space-y-6">
    <PageHeader
      eyebrow="Personas / Empleados"
      title={`Editar expediente: ${editor.data.employee.name}`}
      description={`Employee ID ${editor.data.employee.employeeNumber}. Esta es una pantalla completa de edición, no un modal, para actualizar todo el expediente sin perder contexto.`}
      actions={<div className="flex flex-wrap gap-2"><Button asChild variant="secondary"><Link href={`/employees/${employeeId}`}><FileText className="size-4" />Ver expediente</Link></Button><Button asChild variant="secondary"><Link href="/employees"><ArrowLeft className="size-4" />Directorio</Link></Button><Button onClick={() => save.mutate()} disabled={save.isPending || !can("employees.update")}><Save className="size-4" />{save.isPending ? "Guardando..." : "Guardar expediente"}</Button></div>}
    />
    <InlineFeedback tone="info" title="Edición completa y auditable">Cada bloque se guarda en su dominio de backend y genera trazabilidad. SSN y tasas existentes permanecen protegidos; introduce un valor solo cuando quieras reemplazarlo.</InlineFeedback>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-5">
        <EditorSection title="Información personal" description="Identidad legal y datos protegidos del expediente.">
          <TextField label="Nombre legal" value={stringValue(form.personal.legalFirstName)} onChange={(value) => update("personal", "legalFirstName", value)} required />
          <TextField label="Segundo nombre" value={stringValue(form.personal.middleName)} onChange={(value) => update("personal", "middleName", value)} />
          <TextField label="Apellidos legales" value={stringValue(form.personal.legalLastName)} onChange={(value) => update("personal", "legalLastName", value)} required />
          <TextField label="Nombre preferido" value={stringValue(form.personal.preferredName)} onChange={(value) => update("personal", "preferredName", value)} />
          <TextField label="Fecha de nacimiento" type="date" value={stringValue(form.personal.dateOfBirth)} onChange={(value) => update("personal", "dateOfBirth", value)} />
          <TextField label="Número de seguridad social parcial" value={stringValue(form.tax.ssnLast4)} onChange={(value) => update("tax", "ssnLast4", value)} />
        </EditorSection>
        <EditorSection title="Contacto" description="Canales personales y de trabajo para el expediente.">
          <TextField label="Email laboral" type="email" value={stringValue(form.contact.workEmail)} onChange={(value) => update("contact", "workEmail", value)} required />
          <TextField label="Email personal" type="email" value={stringValue(form.contact.personalEmail)} onChange={(value) => update("contact", "personalEmail", value)} />
          <TextField label="Teléfono" value={stringValue(form.contact.phone)} onChange={(value) => update("contact", "phone", value)} />
          <TextField label="Dirección" value={stringValue(form.contact.addressLine1)} onChange={(value) => update("contact", "addressLine1", value)} />
          <TextField label="Apartamento / línea 2" value={stringValue(form.contact.addressLine2)} onChange={(value) => update("contact", "addressLine2", value)} />
          <TextField label="Ciudad" value={stringValue(form.contact.city)} onChange={(value) => update("contact", "city", value)} />
          <TextField label="Estado" value={stringValue(form.contact.state)} onChange={(value) => update("contact", "state", value)} />
          <TextField label="ZIP" value={stringValue(form.contact.postalCode)} onChange={(value) => update("contact", "postalCode", value)} />
          <TextField label="País" value={stringValue(form.contact.country)} onChange={(value) => update("contact", "country", value)} />
        </EditorSection>
        <EditorSection title="Información laboral" description="Cargo, sucursal, supervisor, fechas y estado de la relación laboral.">
          <SelectField label="Sucursal principal" value={stringValue(form.employment.primaryBranchId)} onChange={(value) => update("employment", "primaryBranchId", value)} options={activeBranches.map((branch) => ({ value: branch.id, label: branch.name }))} placeholder="Selecciona una sucursal" />
          <TextField label="Cargo" value={stringValue(form.employment.jobTitle)} onChange={(value) => update("employment", "jobTitle", value)} required />
          <TextField label="Departamento" value={stringValue(form.employment.department)} onChange={(value) => update("employment", "department", value)} />
          <SelectField label="Supervisor" value={stringValue(form.employment.supervisorUserId)} onChange={(value) => update("employment", "supervisorUserId", value)} options={tenantUsers.map((user) => ({ value: user.id, label: user.fullName }))} placeholder="Sin supervisor" allowEmpty />
          <TextField label="Fecha de contratación" type="date" value={stringValue(form.employment.hireDate)} onChange={(value) => update("employment", "hireDate", value)} />
          <TextField label="Fecha de inicio" type="date" value={stringValue(form.employment.startDate)} onChange={(value) => update("employment", "startDate", value)} />
          <SelectField label="Tipo de empleo" value={stringValue(form.employment.employmentType)} onChange={(value) => update("employment", "employmentType", value)} options={employmentTypeOptions} />
          <SelectField label="Estado de la relación laboral" value={stringValue(form.employment.employmentStatus)} onChange={(value) => update("employment", "employmentStatus", value)} options={employmentStatusOptions} />
          <SelectField label="Estado del empleado" value={stringValue(form.employment.status)} onChange={(value) => update("employment", "status", value)} options={[{ value: "ACTIVE", label: "Activo" }, { value: "INACTIVE", label: "Inactivo" }, { value: "TERMINATED", label: "Finalizado" }]} />
          <TextField label="Clasificación laboral" value={stringValue(form.employment.workerClassification)} onChange={(value) => update("employment", "workerClassification", value)} />
        </EditorSection>
        <EditorSection title="Nómina" description="Configuración de pago, frecuencia, overtime y referencia de payroll.">
          <SelectField label="Tipo de pago" value={stringValue(form.payroll.payType)} onChange={(value) => update("payroll", "payType", value)} options={paymentTypeOptions} />
          <SecretField label="Salario o tarifa" current={editor.data.payroll?.payRateMasked} value={stringValue(form.payroll.payRate)} onChange={(value) => update("payroll", "payRate", value)} />
          <SelectField label="Frecuencia de pago" value={stringValue(form.payroll.payFrequency)} onChange={(value) => update("payroll", "payFrequency", value)} options={frequencyOptions} />
          <SelectField label="Método de pago" value={stringValue(form.payroll.paymentMethod)} onChange={(value) => update("payroll", "paymentMethod", value)} options={paymentMethodOptions} />
          <TextField label="Proveedor de nómina" value={stringValue(form.payroll.payrollProvider)} onChange={(value) => update("payroll", "payrollProvider", value)} />
          <TextField label="Payroll Employee ID" value={stringValue(form.payroll.payrollEmployeeId)} onChange={(value) => update("payroll", "payrollEmployeeId", value)} />
          <TextField label="Referencia externa" value={stringValue(form.payroll.externalPayrollReference)} onChange={(value) => update("payroll", "externalPayrollReference", value)} />
          <TextField label="Inicio de semana laboral" value={stringValue(form.payroll.workweekStartDay)} onChange={(value) => update("payroll", "workweekStartDay", value)} />
          <TextField label="Hora de inicio" type="time" value={stringValue(form.payroll.workweekStartTime)} onChange={(value) => update("payroll", "workweekStartTime", value)} />
          <ToggleField label="Elegible para overtime" checked={Boolean(form.payroll.overtimeEligible)} onChange={(value) => update("payroll", "overtimeEligible", value)} />
        </EditorSection>
        <EditorSection title="Tax & Work Eligibility" description="W-4, I-9, E-Verify y Florida New Hire para el expediente de Florida.">
          <SecretField label="SSN" current={editor.data.tax?.ssnMasked} value={stringValue(form.tax.ssn)} onChange={(value) => update("tax", "ssn", value)} />
          <SelectField label="Estado Form W-4" value={stringValue(form.tax.w4Status)} onChange={(value) => update("tax", "w4Status", value)} options={w4Options} />
          <TextField label="Referencia W-2" value={stringValue(form.tax.w2Reference)} onChange={(value) => update("tax", "w2Reference", value)} />
          <SelectField label="Estado Form I-9" value={stringValue(form.eligibility.i9Status)} onChange={(value) => update("eligibility", "i9Status", value)} options={i9Options} />
          <TextField label="Primer día de empleo" type="date" value={stringValue(form.eligibility.firstDayOfEmployment)} onChange={(value) => update("eligibility", "firstDayOfEmployment", value)} />
          <SelectField label="Estado E-Verify" value={stringValue(form.eligibility.eVerifyStatus)} onChange={(value) => update("eligibility", "eVerifyStatus", value)} options={eVerifyOptions} />
          <ToggleField label="E-Verify requerido" checked={Boolean(form.eligibility.eVerifyRequired)} onChange={(value) => update("eligibility", "eVerifyRequired", value)} />
          <ToggleField label="Reverificación requerida" checked={Boolean(form.eligibility.reverificationRequired)} onChange={(value) => update("eligibility", "reverificationRequired", value)} />
          <SelectField label="Florida New Hire" value={stringValue(form.floridaNewHire.status)} onChange={(value) => update("floridaNewHire", "status", value)} options={floridaOptions} />
          <TextField label="Fecha límite Florida New Hire" type="date" value={stringValue(form.floridaNewHire.dueDate)} onChange={(value) => update("floridaNewHire", "dueDate", value)} />
          <ToggleField label="Florida New Hire requerido" checked={Boolean(form.floridaNewHire.required)} onChange={(value) => update("floridaNewHire", "required", value)} />
          <div className="sm:col-span-2 rounded-2xl border border-dashed border-border-default bg-surface-elevated p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">Evidencia documental</p>
                <p className="mt-1 text-sm text-text-secondary">Adjunta foto o PDF para SSN, W-4, I-9 o Florida New Hire. Los archivos quedan preparados para el expediente.</p>
              </div>
              <Badge variant="outline">{evidenceDrafts.length} archivo{evidenceDrafts.length === 1 ? "" : "s"}</Badge>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                { key: "tax" as const, label: "W-4 / SSN" },
                { key: "eligibility" as const, label: "I-9 / E-Verify" },
                { key: "floridaNewHire" as const, label: "Florida New Hire" },
              ].map((item) => (
                <label key={item.label} className="rounded-xl border border-border-default bg-card p-3 text-sm">
                  <span className="font-medium">{item.label}</span>
                  <Input
                    className="mt-2"
                    type="file"
                    accept=".pdf,image/jpeg,image/png"
                    onChange={(event) => void addEvidence(item.key, item.label, event.target.files?.[0] ?? null)}
                  />
                </label>
              ))}
            </div>
            {evidenceDrafts.length ? (
              <ul className="mt-4 space-y-2 text-sm text-text-secondary">
                {evidenceDrafts.map((draft) => (
                  <li key={draft.id} className="flex items-center justify-between gap-3 rounded-xl border border-border-default bg-card px-3 py-2">
                    <span>{draft.label}: {draft.file.name}</span>
                    <span>{Math.round(draft.file.size / 1024)} KB</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </EditorSection>
        <EditorSection title="Contacto de emergencia" description="Información operativa, separada de payroll.">
          <TextField label="Nombre" value={stringValue(form.emergencyContact.name)} onChange={(value) => update("emergencyContact", "name", value)} />
          <TextField label="Relación" value={stringValue(form.emergencyContact.relationship)} onChange={(value) => update("emergencyContact", "relationship", value)} />
          <TextField label="Teléfono" value={stringValue(form.emergencyContact.phone)} onChange={(value) => update("emergencyContact", "phone", value)} />
        </EditorSection>
      </div>
      <aside className="space-y-5 xl:sticky xl:top-5 xl:self-start">
        <Card level={2}><CardContent className="p-5"><div className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary" /><h2 className="font-semibold">Checklist y evidencia</h2></div><p className="mt-2 text-sm text-text-secondary">Los documentos, licencias, capacitación, seguridad y activos se administran desde el expediente, sin perder su trazabilidad.</p><Button asChild variant="secondary" className="mt-4 w-full"><Link href={`/employees/${employeeId}`}>Gestionar documentos y compliance</Link></Button></CardContent></Card>
        <Card level={2}><CardContent className="p-5"><h2 className="font-semibold">Requisitos actuales</h2><div className="mt-4 space-y-3">{requirements.length ? requirements.map((item) => <div key={item.id} className="flex items-start justify-between gap-3 border-b border-border-default pb-3 last:border-0 last:pb-0"><div><p className="text-sm font-medium">{item.title}</p><p className="mt-1 text-xs text-text-secondary">{item.category}</p></div><Badge variant={/complete|verified|approved/i.test(item.status) ? "success" : "secondary"}>{item.status.replaceAll("_", " ")}</Badge></div>) : <p className="text-sm text-text-secondary">El checklist aparecerá al crear los requisitos aplicables.</p>}</div></CardContent></Card>
        <Button className="w-full" onClick={() => save.mutate()} disabled={save.isPending || !can("employees.update")}><Save className="size-4" />{save.isPending ? "Guardando..." : "Guardar todos los cambios"}</Button>
      </aside>
    </div>
  </div>;
}

function EditorSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <Card level={2}><CardContent className="p-5"><h2 className="text-lg font-semibold">{title}</h2><p className="mt-1 text-sm text-text-secondary">{description}</p><div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div></CardContent></Card>; }
function TextField({ label, value, onChange, required = false, type = "text" }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string }) { const id = `employee-edit-${label.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`; return <FormField id={id} label={label} required={required}>{(field) => <Input {...field} type={type} value={value} onChange={(event) => onChange(event.target.value)} />}</FormField>; }
function SecretField({ label, current, value, onChange }: { label: string; current?: string | null; value: string; onChange: (value: string) => void }) { return <FormField id={`employee-edit-${label.toLowerCase()}`} label={label}>{(field) => <div className="space-y-1"><Input {...field} type="password" value={value} placeholder={current ? `Actual: ${current}` : "Sin valor registrado"} onChange={(event) => onChange(event.target.value)} /><p className="text-xs text-text-secondary">Déjalo vacío para conservar el valor protegido.</p></div>}</FormField>; }
function SelectField({ label, value, onChange, options, placeholder, allowEmpty = false }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; placeholder?: string; allowEmpty?: boolean }) { const id = `employee-edit-${label.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`; return <FormField id={id} label={label}>{(field) => <Select value={value || (allowEmpty ? "none" : undefined)} onValueChange={(next) => onChange(next === "none" ? "" : next)}><SelectTrigger {...field}><SelectValue placeholder={placeholder ?? "Selecciona una opción"} /></SelectTrigger><SelectContent>{allowEmpty ? <SelectItem value="none">{placeholder ?? "Sin seleccionar"}</SelectItem> : null}{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>}</FormField>; }
function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="flex min-h-11 items-center gap-3 rounded-xl border border-border-default bg-surface-section px-3 text-sm font-medium"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />{label}</label>; }
function stringValue(value: unknown) {
  if (typeof value !== "string") return "";
  return /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : value;
}
function withoutBlankSecrets<T extends Record<string, unknown>>(input: T, sensitive: string[]) { return Object.fromEntries(Object.entries(input).filter(([key, value]) => !sensitive.includes(key) || value !== "")); }
function toEditorForm(record: EmployeeEditorRecord): EditorForm {
  return {
    personal: strings(record.employee.personal),
    contact: strings(record.employee.contact),
    employment: { ...strings(record.employment), status: record.employee.status },
    payroll: {
      payType: record.payroll?.payType ?? "SALARY",
      payRate: "",
      payFrequency: record.payroll?.payFrequency ?? "BIWEEKLY",
      overtimeEligible: record.payroll?.overtimeEligible ?? false,
      regularHourlyRate: "",
      workweekStartDay: record.payroll?.workweekStartDay ?? "",
      workweekStartTime: record.payroll?.workweekStartTime ?? "",
      paymentMethod: record.payroll?.paymentMethod ?? "DIRECT_DEPOSIT",
      payrollProvider: record.payroll?.payrollProvider ?? "",
      payrollEmployeeId: record.payroll?.payrollEmployeeId ?? "",
      externalPayrollReference: record.payroll?.externalPayrollReference ?? "",
    },
    tax: { w4Status: record.tax?.w4Status ?? "PENDING", w2Reference: record.tax?.w2Reference ?? "", ssn: "", ssnLast4: "" },
    eligibility: { i9Status: record.eligibility?.i9Status ?? "PENDING", firstDayOfEmployment: record.eligibility?.firstDayOfEmployment ?? "", eVerifyStatus: record.eligibility?.eVerifyStatus ?? "NOT_REQUIRED", eVerifyRequired: record.eligibility?.eVerifyRequired ?? false, reverificationRequired: record.eligibility?.reverificationRequired ?? false },
    floridaNewHire: { required: record.floridaNewHire?.required ?? true, status: record.floridaNewHire?.status ?? "PENDING", dueDate: record.floridaNewHire?.dueDate ?? "" },
    emergencyContact: strings(record.employee.emergencyContact),
  };
}
function strings(values: Record<string, string | null>) { return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value ?? ""])); }
const paymentTypeOptions = [{ value: "SALARY", label: "Salario" }, { value: "HOURLY", label: "Por hora" }, { value: "COMMISSION", label: "Comisión" }, { value: "TIP_BASED", label: "Propinas" }];
const employmentTypeOptions = [{ value: "FULL_TIME", label: "Tiempo completo" }, { value: "PART_TIME", label: "Medio tiempo" }, { value: "CONTRACT", label: "Contrato" }, { value: "TEMPORARY", label: "Temporal" }, { value: "INTERNSHIP", label: "Pasantía" }];
const employmentStatusOptions = [{ value: "ACTIVE", label: "Activo" }, { value: "INACTIVE", label: "Inactivo" }, { value: "LEAVE", label: "En licencia" }, { value: "TERMINATED", label: "Finalizado" }, { value: "DRAFT", label: "Borrador" }];
const frequencyOptions = [{ value: "WEEKLY", label: "Semanal" }, { value: "BIWEEKLY", label: "Quincenal" }, { value: "SEMIMONTHLY", label: "Dos veces al mes" }, { value: "MONTHLY", label: "Mensual" }];
const paymentMethodOptions = [{ value: "DIRECT_DEPOSIT", label: "Direct deposit" }, { value: "CHECK", label: "Cheque" }, { value: "PAY_CARD", label: "Tarjeta de pago" }, { value: "OTHER", label: "Otro" }];
const w4Options = [{ value: "PENDING", label: "Pendiente" }, { value: "COMPLETE", label: "Completado" }, { value: "NOT_REQUIRED", label: "No requerido" }];
const i9Options = [{ value: "PENDING", label: "Pendiente" }, { value: "VERIFIED", label: "Verificado" }, { value: "NOT_REQUIRED", label: "No requerido" }];
const eVerifyOptions = [{ value: "NOT_REQUIRED", label: "No requerido" }, { value: "PENDING", label: "Pendiente" }, { value: "AUTHORIZED", label: "Autorizado" }];
const floridaOptions = [{ value: "PENDING", label: "Pendiente" }, { value: "SUBMITTED", label: "Reportado" }, { value: "CONFIRMED", label: "Confirmado" }, { value: "NOT_REQUIRED", label: "No requerido" }];
