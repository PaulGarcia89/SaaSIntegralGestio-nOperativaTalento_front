"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileSpreadsheet, Upload, UserPlus, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { FormDialog } from "@/components/admin-crud";
import { AsyncState } from "@/components/async-state";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FilterToolbar } from "@/components/domain";
import { InlineFeedback, PageHeader, ResponsiveDataView } from "@/components/design-system";
import { ApiError, bulkCreateEmployees, createEmployee, fetchBranches, fetchEmployees, getApiErrorMessage, type CreateEmployeeInput, type EmployeeDirectoryItem } from "@/lib/backend";
import { useAppStore } from "@/store/app-store";

type EmployeeStatus = NonNullable<CreateEmployeeInput["status"]>;
type ImportRow = CreateEmployeeInput & { row: number; branchLabel: string; errors: string[] };

const initialEmployee: CreateEmployeeInput = { name: "", email: "", primaryBranchId: "", primaryRole: "", status: "ACTIVE" };

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const { can } = useAppStore();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const employees = useQuery({ queryKey: ["employees", search, status], queryFn: () => fetchEmployees({ search, status, page: 1, pageSize: 50 }) });
  const branches = useQuery({ queryKey: ["employee-import-branches"], queryFn: () => fetchBranches(), enabled: can("employees.create") });
  const refresh = async () => { await queryClient.invalidateQueries({ queryKey: ["employees"] }); };

  if (employees.isLoading) return <AsyncState state="loading" title="Cargando empleados" />;
  if (employees.isError) {
    const apiError = employees.error instanceof ApiError ? employees.error : null;
    const fallback = "No fue posible cargar el directorio";
    const description = apiError
      ? `(${apiError.code ?? `HTTP ${apiError.status}`}) ${getApiErrorMessage(employees.error, fallback)}`
      : getApiErrorMessage(employees.error, fallback);

    return (
      <AsyncState
        state="error"
        title="No fue posible cargar el directorio"
        description={description}
        onRetry={() => void employees.refetch()}
      />
    );
  }
  const data = employees.data?.data ?? [];
  const canCreate = can("employees.create");

  return <div className="space-y-5"><PageHeader eyebrow="Personas" title="Directorio de empleados" description="Consulta el equipo de la sucursal activa, su estado y sus asignaciones actuales." actions={canCreate ? <div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" onClick={() => setImportOpen(true)}><FileSpreadsheet className="size-4" />Subir documento</Button><Button type="button" onClick={() => setCreateOpen(true)}><UserPlus className="size-4" />Agregar empleado</Button></div> : null} /><FilterToolbar searchPlaceholder="Buscar por nombre o correo" options={[{ label: "Todos", value: "" }, { label: "Activos", value: "ACTIVE" }, { label: "Inactivos", value: "INACTIVE" }, { label: "Finalizados", value: "TERMINATED" }]} searchValue={search} onSearchChange={setSearch} filterValue={status} onFilterChange={setStatus} /><p className="text-sm text-text-secondary">{employees.data?.meta.total ?? 0} empleados encontrados</p><ResponsiveDataView data={data} getKey={(employee) => employee.id} desktop={<div className="grid gap-3 lg:grid-cols-2">{data.map((employee) => <EmployeeCard key={employee.id} employee={employee} />)}</div>} mobile={(employee) => <EmployeeCard employee={employee} />} empty={<Card level={3}><CardContent className="p-6 text-sm text-text-secondary">No hay empleados que coincidan con los filtros de la sucursal activa.</CardContent></Card>} />{canCreate ? <><CreateEmployeeDialog open={createOpen} onOpenChange={setCreateOpen} branches={branches.data ?? []} onCreated={refresh} /><ImportEmployeesDialog open={importOpen} onOpenChange={setImportOpen} branches={branches.data ?? []} branchesLoading={branches.isLoading} onImported={refresh} /></> : null}</div>;
}

function CreateEmployeeDialog({ open, onOpenChange, branches, onCreated }: { open: boolean; onOpenChange: (open: boolean) => void; branches: Awaited<ReturnType<typeof fetchBranches>>; onCreated: () => Promise<void> }) {
  const [form, setForm] = useState<CreateEmployeeInput>(initialEmployee);
  const create = useMutation({ mutationFn: () => createEmployee(form), onSuccess: async () => { toast.success("Empleado agregado al directorio"); setForm(initialEmployee); onOpenChange(false); await onCreated(); }, onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible crear el empleado.")) });
  const valid = form.name.trim().length >= 2 && /^\S+@\S+\.\S+$/.test(form.email) && Boolean(form.primaryBranchId) && form.primaryRole.trim().length >= 2;
  return <FormDialog open={open} onOpenChange={onOpenChange} title="Agregar empleado" description="Crea el perfil laboral de una persona que ya trabaja en tu empresa."><form className="space-y-4" onSubmit={(event) => { event.preventDefault(); if (valid) create.mutate(); }}><FormField id="employee-name" label="Nombre completo" required>{(field) => <Input {...field} autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />}</FormField><FormField id="employee-email" label="Correo corporativo" required>{(field) => <Input {...field} type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />}</FormField><div className="grid gap-4 sm:grid-cols-2"><FormField id="employee-branch" label="Sucursal principal" required>{(field) => <Select value={form.primaryBranchId} onValueChange={(primaryBranchId) => setForm({ ...form, primaryBranchId })}><SelectTrigger {...field}><SelectValue placeholder="Selecciona una sucursal" /></SelectTrigger><SelectContent>{branches.filter((branch) => branch.status === "active").map((branch) => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}</SelectContent></Select>}</FormField><FormField id="employee-role" label="Cargo o función" required>{(field) => <Input {...field} placeholder="Ej. Supervisor de tienda" value={form.primaryRole} onChange={(event) => setForm({ ...form, primaryRole: event.target.value })} />}</FormField></div><FormField id="employee-status" label="Estado inicial" description="Por defecto queda activo si la persona ya trabaja contigo.">{(field) => <Select value={form.status ?? "ACTIVE"} onValueChange={(status) => setForm({ ...form, status: status as EmployeeStatus })}><SelectTrigger {...field}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ACTIVE">Activo</SelectItem><SelectItem value="INACTIVE">Inactivo</SelectItem></SelectContent></Select>}</FormField><div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="submit" disabled={!valid || create.isPending}>{create.isPending ? "Guardando..." : "Agregar empleado"}</Button></div></form></FormDialog>;
}

function ImportEmployeesDialog({ open, onOpenChange, branches, branchesLoading, onImported }: { open: boolean; onOpenChange: (open: boolean) => void; branches: Awaited<ReturnType<typeof fetchBranches>>; branchesLoading: boolean; onImported: () => Promise<void> }) {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const validRows = rows.filter((row) => row.errors.length === 0);
  const invalidRows = rows.filter((row) => row.errors.length > 0);
  const importEmployees = useMutation({ mutationFn: () => bulkCreateEmployees(validRows.map((item) => ({ name: item.name, email: item.email, status: item.status, primaryBranchId: item.primaryBranchId, primaryRole: item.primaryRole }))), onSuccess: async (result) => { toast.success(`${result.created} empleados importados correctamente`); setRows([]); setFileName(""); onOpenChange(false); await onImported(); }, onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible importar los empleados.")) });
  const handleFile = async (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    setRows(await parseEmployeeFile(file, branches));
  };
  return <FormDialog open={open} onOpenChange={(next) => { if (!next) { setRows([]); setFileName(""); } onOpenChange(next); }} title="Importar empleados" description="Carga hasta 500 empleados desde un archivo CSV o Excel. Primero revisa los errores y luego confirma la creación."><div className="space-y-4"><div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">Documento de empleados</p><p className="mt-1 text-sm text-text-secondary">Formato recomendado: XLSX, CSV o TSV con columnas nombre, correo, sucursal, cargo y estado opcional.</p></div><div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" onClick={downloadEmployeeTemplate}><Download className="size-4" />Plantilla</Button><label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-text-on-accent"><Upload className="size-4" />Subir archivo<input className="sr-only" type="file" accept=".xlsx,.csv,.tsv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/tab-separated-values" onChange={(event) => { void handleFile(event.target.files?.[0]); event.currentTarget.value = ""; }} /></label></div></div><p className="mt-3 text-xs text-text-secondary">Si tu archivo viene desde Excel, puedes subirlo directamente en .xlsx o exportarlo como CSV/TSV.</p></div>{branchesLoading ? <AsyncState state="loading" title="Cargando sucursales" /> : null}{fileName ? <p className="text-sm text-text-secondary">Archivo seleccionado: <strong className="text-text-primary">{fileName}</strong></p> : null}{rows.length ? <><div className="grid gap-3 sm:grid-cols-3"><ImportMetric label="Filas leídas" value={rows.length} /><ImportMetric label="Listas para importar" value={validRows.length} tone="success" /><ImportMetric label="Con errores" value={invalidRows.length} tone={invalidRows.length ? "danger" : "default"} /></div>{invalidRows.length ? <InlineFeedback tone="danger" title="Corrige el archivo antes de importar">Cada fila debe tener nombre, correo válido, sucursal existente y cargo. También se bloquean correos repetidos.</InlineFeedback> : <InlineFeedback tone="success" title="Archivo listo">Todas las filas son válidas. La importación se ejecutará en una sola operación.</InlineFeedback>}<div className="max-h-64 overflow-auto rounded-xl border border-border-default"><table className="w-full min-w-[680px] text-left text-sm"><thead className="sticky top-0 bg-surface-section text-text-secondary"><tr><th className="px-3 py-2">Fila</th><th className="px-3 py-2">Empleado</th><th className="px-3 py-2">Sucursal</th><th className="px-3 py-2">Cargo</th><th className="px-3 py-2">Validación</th></tr></thead><tbody>{rows.slice(0, 20).map((row) => <tr key={row.row} className="border-t border-border-default"><td className="px-3 py-2">{row.row}</td><td className="px-3 py-2"><p className="font-medium">{row.name || "Sin nombre"}</p><p className="text-xs text-text-secondary">{row.email || "Sin correo"}</p></td><td className="px-3 py-2">{row.branchLabel || "-"}</td><td className="px-3 py-2">{row.primaryRole || "-"}</td><td className="px-3 py-2">{row.errors.length ? <span className="text-status-danger">{row.errors.join(" · ")}</span> : <span className="text-status-success">Lista</span>}</td></tr>)}</tbody></table></div>{rows.length > 20 ? <p className="text-xs text-text-secondary">Se muestran las primeras 20 filas de {rows.length}.</p> : null}</> : null}<div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="button" disabled={!validRows.length || invalidRows.length > 0 || importEmployees.isPending} onClick={() => importEmployees.mutate()}>{importEmployees.isPending ? "Importando..." : `Importar ${validRows.length || ""} empleados`}</Button></div></div></FormDialog>;
}

function ImportMetric({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "success" | "danger" }) {
  return <div className="rounded-xl border border-border-default p-3"><p className="text-xs text-text-secondary">{label}</p><p className={tone === "success" ? "text-xl font-semibold text-status-success" : tone === "danger" ? "text-xl font-semibold text-status-danger" : "text-xl font-semibold"}>{value}</p></div>;
}

function EmployeeCard({ employee }: { employee: EmployeeDirectoryItem }) {
  const primary = employee.branchAssignments.find((assignment) => assignment.isPrimary) ?? employee.branchAssignments[0];
  return <Card level={2}><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><UsersRound className="size-4 text-primary" /><h2 className="truncate font-semibold">{employee.name}</h2></div><p className="mt-1 truncate text-sm text-text-secondary">{employee.email}</p></div><Badge variant={employee.status === "ACTIVE" ? "success" : "secondary"}>{employee.status === "ACTIVE" ? "Activo" : employee.status}</Badge></div><p className="mt-4 text-sm text-text-secondary">{primary ? `${primary.branch.name} · ${primary.role}` : "Sin asignación activa"}</p></CardContent></Card>;
}

async function parseEmployeeFile(file: File, branches: Awaited<ReturnType<typeof fetchBranches>>): Promise<ImportRow[]> {
  const normalizedName = file.name.toLocaleLowerCase("es");
  if (normalizedName.endsWith(".xlsx")) {
    const xlsx = await import("xlsx");
    const workbook = xlsx.read(await file.arrayBuffer(), { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return [];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = xlsx.utils.sheet_to_json<string[]>(worksheet, { header: 1, raw: false, defval: "" }) as string[][];
    return parseEmployeeRows(rows, branches);
  }

  const separatorHint = normalizedName.endsWith(".tsv") ? "\t" : normalizedName.endsWith(".txt") ? "," : undefined;
  return parseEmployeeRows(parseDelimitedTable(await file.text(), separatorHint), branches);
}

function parseEmployeeRows(records: string[][], branches: Awaited<ReturnType<typeof fetchBranches>>) {
  if (records.length < 2) return [];
  const index = Object.fromEntries(records[0].map((header, column) => [normalizeHeader(header), column]));
  const find = (record: string[], names: string[]) => record[names.map(normalizeHeader).map((name) => index[name]).find((column) => column !== undefined) ?? -1]?.trim() ?? "";
  const rows = records.slice(1).filter((record) => record.some((cell) => cell.trim())).map((record, offset) => {
    const name = find(record, ["nombre", "name"]);
    const email = find(record, ["correo", "email", "correo electronico"]);
    const branchLabel = find(record, ["sucursal", "branch"]);
    const primaryRole = find(record, ["cargo", "rol", "role", "puesto"]);
    const branch = branches.find((item) => item.name.trim().toLocaleLowerCase("es") === branchLabel.toLocaleLowerCase("es"));
    const status = parseStatus(find(record, ["estado", "status"]));
    const errors = [!name ? "Falta nombre" : "", !/^\S+@\S+\.\S+$/.test(email) ? "Correo inválido" : "", !branch ? "Sucursal no encontrada" : "", !primaryRole ? "Falta cargo" : "", !status ? "Estado inválido" : ""].filter(Boolean);
    return { row: offset + 2, name, email: email.toLowerCase(), branchLabel, primaryBranchId: branch?.id ?? "", primaryRole, status: status ?? "ACTIVE", errors };
  });
  const duplicated = new Set(rows.filter((row, index) => rows.findIndex((candidate) => candidate.email === row.email) !== index).map((row) => row.email));
  return rows.map((row) => duplicated.has(row.email) ? { ...row, errors: [...row.errors, "Correo repetido en el archivo"] } : row);
}

function parseDelimitedTable(source: string, separatorHint?: "," | ";" | "\t") {
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let quoted = false;
  const firstLine = source.split(/\r?\n/, 1)[0] ?? "";
  const separator = separatorHint ?? (firstLine.includes(";") ? ";" : firstLine.includes("\t") ? "\t" : ",");
  for (let index = 0; index < source.length; index += 1) { const char = source[index]; const next = source[index + 1]; if (char === '"' && quoted && next === '"') { cell += '"'; index += 1; } else if (char === '"') quoted = !quoted; else if (char === separator && !quoted) { row.push(cell); cell = ""; } else if ((char === "\n" || char === "\r") && !quoted) { if (char === "\r" && next === "\n") index += 1; row.push(cell); rows.push(row); row = []; cell = ""; } else cell += char; }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

function normalizeHeader(value: string) { return value.replace(/^\uFEFF/, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("es"); }
function parseStatus(value: string): EmployeeStatus | null { const normalized = normalizeHeader(value); if (!normalized || normalized === "activo" || normalized === "active") return "ACTIVE"; if (normalized === "inactivo" || normalized === "inactive") return "INACTIVE"; if (normalized === "finalizado" || normalized === "terminated") return "TERMINATED"; return null; }
function downloadEmployeeTemplate() {
  const csv = [
    "nombre,correo,sucursal,cargo,estado",
    "Ana Perez,ana.perez@empresa.com,Sede principal,Supervisor de tienda,ACTIVO",
    "Luis Gomez,luis.gomez@empresa.com,Sede principal,Analista de operaciones,ACTIVO",
    "Maria Torres,maria.torres@empresa.com,Sucursal Norte,Asistente administrativo,INACTIVO",
  ].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "plantilla-empleados.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}
