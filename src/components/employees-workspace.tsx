"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowLeft, ArrowUp, ArrowUpDown, BriefcaseBusiness, CheckCircle2, ChevronRight, Download, FileSpreadsheet, Filter, LayoutList, MapPin, Search, ShieldCheck, Upload, UserPlus, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { AsyncState } from "@/components/async-state";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { InlineFeedback, PageHeader, Pagination, ResponsiveDataView } from "@/components/design-system";
import { ApiError, bulkCreateEmployees, bulkUpdateEmployeeStatus, createEmployee, fetchBranches, fetchEmployees, fetchMyPreferences, getApiErrorMessage, updateMyPreference, type CreateEmployeeInput, type EmployeeDirectoryItem } from "@/lib/backend";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

type EmployeeStatus = NonNullable<CreateEmployeeInput["status"]>;
type ImportRow = CreateEmployeeInput & { row: number; branchLabel: string; errors: string[] };

const initialEmployee: CreateEmployeeInput = { name: "", email: "", primaryBranchId: "", primaryRole: "", status: "ACTIVE" };

export function EmployeesDirectoryPage() {
  const { can, currentTenant, currentBranch, tenantBranches } = useAppStore();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [branchFilter, setBranchFilter] = useState(currentBranch?.id ?? "");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [sortField, setSortField] = useState<"name" | "email" | "status" | "documents" | "assignments">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [savedFiltersReady, setSavedFiltersReady] = useState(false);
  const [loadedEmployees, setLoadedEmployees] = useState<EmployeeDirectoryItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const employees = useQuery({
    queryKey: ["employees", search, status, branchFilter, page, pageSize],
    queryFn: () => fetchEmployees({ search, status, branchId: branchFilter || undefined, page, pageSize }),
  });

  useEffect(() => {
    setPage(1);
    setLoadedEmployees([]);
    setHasMore(true);
  }, [search, status, branchFilter, pageSize]);

  if (employees.isLoading && page === 1) return <AsyncState state="loading" title="Cargando empleados" />;
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

  const data = Array.isArray(employees.data?.data) ? employees.data.data : [];
  const meta = employees.data?.meta;
  const canCreate = can("employees.create");
  const totalItems = meta?.total ?? data.length;
  const totalPages = meta?.totalPages ?? 1;
  const selectionCount = selectedIds.length;
  useEffect(() => {
    if (!employees.data) return;
    setLoadedEmployees((current) => {
      const next = page === 1 ? employees.data!.data : [...current, ...employees.data!.data];
      const seen = new Set<string>();
      return next.filter((employee) => {
        if (seen.has(employee.id)) return false;
        seen.add(employee.id);
        return true;
      });
    });
    setHasMore(Boolean(meta && meta.page < meta.totalPages));
    setIsLoadingMore(false);
  }, [employees.data, meta, page]);

  const visibleEmployees = loadedEmployees.length ? loadedEmployees : data;
  const sortedData = useMemo(() => [...visibleEmployees].sort((left, right) => compareEmployees(left, right, sortField, sortDirection)), [visibleEmployees, sortField, sortDirection]);

  useEffect(() => {
    setSelectedIds([]);
  }, [search, status, branchFilter, page, pageSize, viewMode, sortField, sortDirection]);

  useEffect(() => {
    let active = true;
    void fetchMyPreferences()
      .then((preferences) => {
        if (!active) return;
        const stored = preferences["employees-directory"] as {
          search?: string;
          status?: string;
          branchFilter?: string;
          pageSize?: number;
          viewMode?: "table" | "cards";
          sortField?: typeof sortField;
          sortDirection?: "asc" | "desc";
        } | undefined;
        if (stored) {
          if (stored.search !== undefined) setSearch(stored.search);
          if (stored.status !== undefined) setStatus(stored.status);
          if (stored.branchFilter !== undefined) setBranchFilter(stored.branchFilter);
          if (stored.pageSize && [10, 20, 50, 100].includes(stored.pageSize)) setPageSize(stored.pageSize);
          if (stored.viewMode) setViewMode(stored.viewMode);
          if (stored.sortField) setSortField(stored.sortField);
          if (stored.sortDirection) setSortDirection(stored.sortDirection);
        }
        setSavedFiltersReady(true);
      })
      .catch(() => {
        if (active) setSavedFiltersReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!savedFiltersReady) return;
    void updateMyPreference("employees-directory", { search, status, branchFilter, pageSize, viewMode, sortField, sortDirection }).catch(() => undefined);
  }, [savedFiltersReady, search, status, branchFilter, pageSize, viewMode, sortField, sortDirection]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortField(field);
    setSortDirection("asc");
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const toggleSelectAll = () => {
    if (!sortedData.length) return;
    const allSelected = sortedData.every((employee) => selectedIds.includes(employee.id));
    setSelectedIds(allSelected ? [] : sortedData.map((employee) => employee.id));
  };
  const selectionData = sortedData.filter((employee) => selectedIds.includes(employee.id));
  const bulkStatus = useMutation({
    mutationFn: (status: "ACTIVE" | "INACTIVE" | "TERMINATED") => bulkUpdateEmployeeStatus({ employeeIds: selectedIds, status }),
    onSuccess: async (result) => {
      toast.success(`${result.updated.length} empleados actualizados`);
      setSelectedIds([]);
      await employees.refetch();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible aplicar la acción masiva.")),
  });
  const exportName = buildEmployeesExportName({ branchName: branchFilter ? tenantBranches.find((branch) => branch.id === branchFilter)?.name : currentBranch?.name, status, pageSize, page });

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] border border-border-default bg-gradient-to-br from-surface-section via-card to-primary/5 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div>
              <p className="text-sm font-medium text-primary">Personas</p>
              <h2 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">Directorio de empleados</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary sm:text-base">
                Gestión rápida para equipos pequeños o muy grandes. Busca, filtra, navega por páginas y entra al expediente sin cargar información innecesaria.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{currentTenant.name}</Badge>
              <Badge variant="secondary">{currentBranch?.name ?? "Sucursal activa"}</Badge>
              <Badge variant="outline">{totalItems} expedientes</Badge>
              <Badge variant="outline">{totalPages} páginas</Badge>
              {selectionCount ? <Badge variant="outline">{selectionCount} seleccionados</Badge> : null}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:w-[420px]">
            <MiniStat label="Total" value={String(totalItems)} />
            <MiniStat label="Página" value={`${page} / ${Math.max(totalPages, 1)}`} />
            <MiniStat label="Tamaño" value={`${pageSize} filas`} />
          </div>
        </div>
      </section>
      <PageHeader
        eyebrow="Personas"
        title="Explorar expedientes"
        description="Usa los filtros para reducir resultados y entra al detalle solo cuando lo necesites."
        actions={
          canCreate ? (
            <div className="flex flex-wrap gap-2">
              <Button asChild type="button" variant="secondary">
                <Link href="/employees/import">
                  <FileSpreadsheet className="size-4" />
                  Carga masiva
                </Link>
              </Button>
              <Button asChild type="button">
                <Link href="/employees/new">
                  <UserPlus className="size-4" />
                  Registrar empleado
                </Link>
              </Button>
            </div>
          ) : null
        }
      />
      <Card level={2}>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div className="grid flex-1 gap-3 xl:grid-cols-[minmax(0,1.1fr)_220px_220px_180px]">
            <label className="space-y-2">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                <Search className="size-4" />
                Buscar
              </span>
              <Input placeholder="Nombre o correo" value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
            <label className="space-y-2">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                <Filter className="size-4" />
                Estado
              </span>
              <Select value={status || "all"} onValueChange={(value) => setStatus(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ACTIVE">Activos</SelectItem>
                  <SelectItem value="INACTIVE">Inactivos</SelectItem>
                  <SelectItem value="TERMINATED">Finalizados</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <label className="space-y-2">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                <LayoutList className="size-4" />
                Sucursal
              </span>
              <Select value={branchFilter || "all"} onValueChange={(value) => setBranchFilter(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las sucursales</SelectItem>
                  {tenantBranches.map((branch) => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </label>
              <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Por página</span>
              <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </label>
            </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant={viewMode === "table" ? "default" : "secondary"} onClick={() => setViewMode("table")}>
                  <LayoutList className="size-4" />
                  Tabla
                </Button>
              <Button type="button" variant={viewMode === "cards" ? "default" : "secondary"} onClick={() => setViewMode("cards")}>
                <UsersRound className="size-4" />
                Tarjetas
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-default pt-4 text-sm">
            <p className="text-text-secondary">
              {meta ? `${meta.total} empleados encontrados` : `${data.length} empleados encontrados`}
            </p>
            <p className="text-text-secondary">La vista muestra resultados paginados para mantener la pantalla rápida.</p>
          </div>
          {selectionCount ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-border-default bg-surface-elevated p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-text-secondary">
                {selectionCount} empleados seleccionados para acciones masivas.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={() => void exportEmployeesCsv(selectionData, `${exportName}-seleccion`)}>
                  Exportar selección
                </Button>
                <Button type="button" variant="secondary" onClick={() => setSelectedIds([])}>
                  Limpiar selección
                </Button>
                <Button type="button" variant="secondary" onClick={() => void copySelectedEmails(sortedData, selectedIds)}>
                  Copiar correos
                </Button>
                <Button type="button" variant="secondary" disabled={bulkStatus.isPending} onClick={() => bulkStatus.mutate("ACTIVE")}>
                  Marcar activos
                </Button>
                <Button type="button" variant="secondary" disabled={bulkStatus.isPending} onClick={() => bulkStatus.mutate("INACTIVE")}>
                  Marcar inactivos
                </Button>
                <Button type="button" variant="secondary" disabled={bulkStatus.isPending} onClick={() => bulkStatus.mutate("TERMINATED")}>
                  Marcar finalizados
                </Button>
              </div>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => void exportEmployeesCsv(sortedData, exportName)}>
              Exportar resultado
            </Button>
            <Button type="button" variant="secondary" onClick={() => setSelectedIds(sortedData.map((employee) => employee.id))}>
              Seleccionar visibles
            </Button>
          </div>
        </CardContent>
      </Card>
      {viewMode === "table" ? (
        <Card level={2}>
          <CardContent className="p-0">
            <div className="overflow-hidden rounded-2xl border border-border-default bg-card shadow-sm">
              <div className="grid grid-cols-[52px_minmax(0,1.3fr)_180px_180px_120px_1fr_130px] gap-4 border-b border-border-default bg-surface-section px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                <button type="button" className="flex items-center justify-center" onClick={toggleSelectAll} aria-label="Seleccionar todas">
                  {sortedData.length && sortedData.every((employee) => selectedIds.includes(employee.id)) ? "☑" : "☐"}
                </button>
                <SortHeader label="Empleado" active={sortField === "name"} direction={sortDirection} onClick={() => toggleSort("name")} />
                <SortHeader label="Correo" active={sortField === "email"} direction={sortDirection} onClick={() => toggleSort("email")} />
                <SortHeader label="Sucursal" active={sortField === "assignments"} direction={sortDirection} onClick={() => toggleSort("assignments")} />
                <SortHeader label="Docs" active={sortField === "documents"} direction={sortDirection} onClick={() => toggleSort("documents")} />
                <SortHeader label="Asignaciones" active={sortField === "assignments"} direction={sortDirection} onClick={() => toggleSort("assignments")} />
                <SortHeader label="Estado" active={sortField === "status"} direction={sortDirection} onClick={() => toggleSort("status")} />
              </div>
              <div>
                {sortedData.map((employee, index) => (
                  <EmployeeRow
                    key={employee.id}
                    employee={employee}
                    compact={index >= 10}
                    selected={selectedIds.includes(employee.id)}
                    onToggleSelect={() => toggleSelection(employee.id)}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ResponsiveDataView
          data={sortedData}
          getKey={(employee) => employee.id}
          desktop={<div className="grid gap-3 lg:grid-cols-2">{sortedData.map((employee) => <EmployeeCard key={employee.id} employee={employee} selected={selectedIds.includes(employee.id)} onToggleSelect={() => toggleSelection(employee.id)} />)}</div>}
          mobile={(employee) => <EmployeeCard employee={employee} selected={selectedIds.includes(employee.id)} onToggleSelect={() => toggleSelection(employee.id)} />}
          empty={<Card level={3}><CardContent className="p-6 text-sm text-text-secondary">No hay empleados que coincidan con los filtros actuales.</CardContent></Card>}
        />
      )}
      <div className="flex items-center justify-center py-2">
        {hasMore ? (
          <Button type="button" variant="secondary" disabled={isLoadingMore} onClick={() => { setIsLoadingMore(true); setPage((current) => current + 1); }}>
            {isLoadingMore ? "Cargando más..." : "Cargar más empleados"}
          </Button>
        ) : (
          <p className="text-sm text-text-secondary">No hay más empleados para cargar.</p>
        )}
      </div>
    </div>
  );
}

export function EmployeeCreatePage() {
  const queryClient = useQueryClient();
  const { can } = useAppStore();
  const branches = useQuery({ queryKey: ["employee-import-branches"], queryFn: () => fetchBranches(), enabled: can("employees.create") });
  const [form, setForm] = useState<CreateEmployeeInput>(initialEmployee);
  const create = useMutation({
    mutationFn: () => createEmployee(form),
    onSuccess: async () => {
      toast.success("Empleado agregado al directorio");
      setForm(initialEmployee);
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible crear el empleado.")),
  });
  const valid = form.name.trim().length >= 2 && /^\S+@\S+\.\S+$/.test(form.email) && Boolean(form.primaryBranchId) && form.primaryRole.trim().length >= 2;
  const activeBranches = branches.data?.filter((branch) => branch.status === "active") ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Personas"
        title="Registrar empleado"
        description="Registra a las personas que ya trabajan en la empresa y construye una base documental lista para auditorías y gestión continua."
        actions={
          <Button asChild type="button" variant="secondary">
            <Link href="/employees">
              <ArrowLeft className="size-4" />
              Volver al directorio
            </Link>
          </Button>
        }
      />
      <section aria-labelledby="employee-hiring-flow" className="rounded-2xl border border-border-default bg-surface-section p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="employee-hiring-flow" className="font-semibold">Base documental del empleado</h2>
            <p className="mt-1 text-sm text-text-secondary">Consolida datos, documentos y asignaciones de personas que ya forman parte de la empresa.</p>
          </div>
          <Badge variant="outline">Objetivo: gestión continua</Badge>
        </div>
        <ol className="mt-5 grid gap-3 md:grid-cols-4">
          <HiringStep number="1" title="Identificación" description="Nombre, correo, contacto, sucursal principal y cargo actual de la persona." />
          <HiringStep number="2" title="Perfil laboral" description="Rol, estado, asignaciones y datos útiles para mantener el directorio actualizado." />
          <HiringStep current number="3" title="Documentación" description="Centraliza contratos, identificaciones, soportes y archivos necesarios para auditoría." />
          <HiringStep number="4" title="Historial" description="Consulta cambios, movimientos, archivos cargados y trazabilidad de gestión." />
        </ol>
      </section>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
        <Card level={2}>
          <CardContent className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-text-secondary">Alta individual</p>
                <h3 className="mt-1 text-xl font-semibold">Registrar una persona manualmente</h3>
              </div>
              <Badge variant="secondary">1 a 1</Badge>
            </div>
            <InlineFeedback tone="info" title="Solo datos necesarios para esta etapa">
              Usa este formulario cuando necesitas capturar o corregir un solo expediente con trazabilidad completa.
            </InlineFeedback>
            <form
              className="mt-5 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (valid) create.mutate();
              }}
            >
              <FormField id="employee-name" label="Nombre completo" required>
                {(field) => <Input {...field} autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />}
              </FormField>
              <FormField id="employee-email" label="Correo electrónico" description="Usaremos este correo como dato de contacto y para trazabilidad interna." required>
                {(field) => <Input {...field} type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />}
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField id="employee-branch" label="Sucursal principal" required>
                  {(field) => (
                    <Select value={form.primaryBranchId} onValueChange={(primaryBranchId) => setForm({ ...form, primaryBranchId })}>
                      <SelectTrigger {...field}>
                        <SelectValue placeholder="Selecciona una sucursal" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeBranches.map((branch) => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </FormField>
                <FormField id="employee-role" label="Cargo o función" required>
                  {(field) => <Input {...field} placeholder="Ej. Supervisor de tienda" value={form.primaryRole} onChange={(event) => setForm({ ...form, primaryRole: event.target.value })} />}
                </FormField>
              </div>
              <FormField id="employee-status" label="Estado inicial" description="Por defecto queda activo si la persona ya trabaja contigo.">
                {(field) => (
                  <Select value={form.status ?? "ACTIVE"} onValueChange={(status) => setForm({ ...form, status: status as EmployeeStatus })}>
                    <SelectTrigger {...field}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Activo</SelectItem>
                      <SelectItem value="INACTIVE">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </FormField>
              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <Button asChild type="button" variant="secondary">
                  <Link href="/employees">Cancelar</Link>
                </Button>
                <Button type="submit" disabled={!valid || create.isPending}>{create.isPending ? "Guardando..." : "Registrar empleado"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card level={2}>
            <CardContent className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-text-secondary">Carga masiva</p>
                  <h3 className="mt-1 text-xl font-semibold">Cargar empleados en lote</h3>
                </div>
                <Badge variant="secondary">CSV / Excel</Badge>
              </div>
              <div className="mt-4 rounded-2xl border border-border-default bg-surface-elevated p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Upload className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Ideal para altas de equipo completas</p>
                    <p className="mt-1 text-sm leading-6 text-text-secondary">
                      Revisa el archivo antes de confirmar y crea expedientes con validación previa.
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <Metric label="Formato" value="XLSX" />
                  <Metric label="Límite" value="500" />
                  <Metric label="Flujo" value="Prevalidado" />
                </div>
                <ol className="mt-4 grid gap-3 sm:grid-cols-3">
                  <GuideStep number="1" title="Preparar" description="Descarga la plantilla y organiza nombre, correo, sucursal y cargo." icon={<FileSpreadsheet className="size-4" />} accent="primary" />
                  <GuideStep number="2" title="Validar" description="Sube el archivo y revisa errores antes de confirmar la carga." icon={<ShieldCheck className="size-4" />} accent="info" />
                  <GuideStep number="3" title="Confirmar" description="Ejecuta la carga cuando todas las filas estén listas." icon={<CheckCircle2 className="size-4" />} accent="success" />
                </ol>
              </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild type="button" variant="secondary" className="w-full sm:w-auto">
                <Link href="/employees/import">
                  <FileSpreadsheet className="size-4" />
                  Cargar empleados
                </Link>
              </Button>
            </div>
            </CardContent>
          </Card>

          <Card level={2}>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-text-secondary">Qué queda centralizado</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-text-secondary">
                <li>Datos personales y de contacto.</li>
                <li>Sucursal principal y cargo actual.</li>
                <li>Estado del empleado y trazabilidad de cambios.</li>
                <li>Documentos y soportes asociados para auditoría.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function HiringStep({ current = false, description, number, title }: { current?: boolean; description: string; number: string; title: string }) {
  return (
    <li className={current ? "rounded-xl border border-primary/30 bg-primary/5 p-4" : "rounded-xl border border-border-default bg-surface-elevated p-4"}>
      <span className={current ? "text-xs font-semibold text-primary" : "text-xs font-semibold text-text-secondary"}>Paso {number}</span>
      <p className="mt-1 font-medium">{title}</p>
      <p className="mt-2 text-xs leading-5 text-text-secondary">{description}</p>
    </li>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-default bg-card p-3">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border-default bg-surface-elevated p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">{label}</p>
      <p className="mt-2 text-lg font-semibold text-text-primary">{value}</p>
    </div>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border-default bg-surface-elevated px-3 py-1.5 text-xs">
      <span className="font-medium text-text-secondary">{label}:</span>
      <span className="max-w-[14rem] truncate font-semibold text-text-primary">{value}</span>
    </div>
  );
}

function GuideStep({ number, title, description, icon, accent }: { number: string; title: string; description: string; icon: React.ReactNode; accent: "primary" | "info" | "success" }) {
  return (
    <li className="rounded-2xl border border-border-default bg-card p-4">
      <div className="flex items-start gap-3">
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
          accent === "primary" ? "bg-primary/10 text-primary" : accent === "info" ? "bg-info/10 text-info" : "bg-status-success/10 text-status-success"
        }`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-primary">Paso {number}</p>
          <p className="mt-1 font-medium">{title}</p>
          <p className="mt-2 text-xs leading-5 text-text-secondary">{description}</p>
        </div>
      </div>
    </li>
  );
}

type EmployeeDirectoryWithDocuments = EmployeeDirectoryItem & {
  documentSummary?: { totalDocuments: number };
};

export function EmployeeImportPage() {
  const queryClient = useQueryClient();
  const { can } = useAppStore();
  const branches = useQuery({ queryKey: ["employee-import-branches"], queryFn: () => fetchBranches(), enabled: can("employees.create") });
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const validRows = rows.filter((row) => row.errors.length === 0);
  const invalidRows = rows.filter((row) => row.errors.length > 0);
  const importEmployees = useMutation({
    mutationFn: () => bulkCreateEmployees(validRows.map((item) => ({ name: item.name, email: item.email, status: item.status, primaryBranchId: item.primaryBranchId, primaryRole: item.primaryRole }))),
    onSuccess: async (result) => {
      toast.success(`${result.created} empleados importados correctamente`);
      setRows([]);
      setFileName("");
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible cargar los empleados.")),
  });
  const handleFile = async (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    setRows(await parseEmployeeFile(file, branches.data ?? []));
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Personas"
        title="Cargar empleados"
        description="Carga hasta 500 empleados desde un archivo CSV o Excel. Primero revisa los errores y luego confirma la creación."
        actions={
          <Button asChild type="button" variant="secondary">
            <Link href="/employees">
              <ArrowLeft className="size-4" />
              Volver al directorio
            </Link>
          </Button>
        }
      />
      <Card level={2}>
        <CardContent className="space-y-4 p-6">
          <div className="overflow-hidden rounded-2xl border border-dashed border-primary/40 bg-gradient-to-br from-primary/10 via-surface-section to-info/10 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Documento de empleados</p>
                <p className="mt-1 text-sm text-text-secondary">Formato recomendado: XLSX, CSV o TSV con columnas nombre, correo, sucursal, cargo y estado opcional.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={downloadEmployeeTemplate}>
                  <Download className="size-4" />
                  Plantilla
                </Button>
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-text-on-accent">
                  <Upload className="size-4" />
                  Subir archivo
                  <input
                    className="sr-only"
                    type="file"
                    accept=".xlsx,.csv,.tsv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/tab-separated-values"
                    onChange={(event) => {
                      void handleFile(event.target.files?.[0]);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
            <p className="mt-3 text-xs text-text-secondary">Si tu archivo viene desde Excel, puedes subirlo directamente en .xlsx o exportarlo como CSV/TSV.</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-surface-elevated p-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileSpreadsheet className="size-4" />
                </div>
              </div>
              <div className="rounded-2xl bg-surface-elevated p-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-info/10 text-info">
                  <UsersRound className="size-4" />
                </div>
              </div>
              <div className="rounded-2xl bg-surface-elevated p-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-status-success/10 text-status-success">
                  <Upload className="size-4" />
                </div>
              </div>
            </div>
            {fileName ? (
              <div className="mt-4 rounded-2xl border border-border-default bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary">Archivo listo para validar</p>
                    <p className="mt-1 truncate text-xs text-text-secondary">{fileName}</p>
                  </div>
                  <Badge variant={invalidRows.length ? "secondary" : "success"}>{invalidRows.length ? "Revisar" : "Listo"}</Badge>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-elevated">
                  <div
                    className={cn("h-full rounded-full transition-all", invalidRows.length ? "bg-status-warning" : "bg-status-success")}
                    style={{ width: rows.length ? `${Math.max(35, Math.min(100, (validRows.length / rows.length) * 100))}%` : "0%" }}
                  />
                </div>
                <p className="mt-2 text-xs text-text-secondary">
                  {rows.length ? `${validRows.length} de ${rows.length} filas listas para cargar` : "Todavía no hay filas cargadas"}
                </p>
              </div>
            ) : null}
            <ol className="mt-4 grid gap-3 sm:grid-cols-3">
              <GuideStep number="1" title="Preparar" description="Descarga la plantilla y organiza nombre, correo, sucursal y cargo." icon={<FileSpreadsheet className="size-4" />} accent="primary" />
              <GuideStep number="2" title="Validar" description="Sube el archivo y revisa errores antes de confirmar la carga." icon={<ShieldCheck className="size-4" />} accent="info" />
              <GuideStep number="3" title="Confirmar" description="Ejecuta la carga cuando todas las filas estén listas." icon={<CheckCircle2 className="size-4" />} accent="success" />
            </ol>
          </div>
          {branches.isLoading ? <AsyncState state="loading" title="Cargando sucursales" /> : null}
          {fileName ? <p className="text-sm text-text-secondary">Archivo seleccionado: <strong className="text-text-primary">{fileName}</strong></p> : null}
          {rows.length ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <ImportMetric label="Filas leídas" value={rows.length} />
                <ImportMetric label="Listas para cargar" value={validRows.length} tone="success" />
                <ImportMetric label="Con errores" value={invalidRows.length} tone={invalidRows.length ? "danger" : "default"} />
              </div>
              {invalidRows.length ? (
                <InlineFeedback tone="danger" title="Corrige el archivo antes de cargar">
                  Cada fila debe tener nombre, correo válido, sucursal existente y cargo. También se bloquean correos repetidos.
                </InlineFeedback>
              ) : (
                <InlineFeedback tone="success" title="Archivo listo">
                  Todas las filas son válidas. La carga se ejecutará en una sola operación.
                </InlineFeedback>
              )}
              <div className="max-h-64 overflow-auto rounded-xl border border-border-default">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="sticky top-0 bg-surface-section text-text-secondary">
                    <tr>
                      <th className="px-3 py-2">Fila</th>
                      <th className="px-3 py-2">Empleado</th>
                      <th className="px-3 py-2">Sucursal</th>
                      <th className="px-3 py-2">Cargo</th>
                      <th className="px-3 py-2">Validación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 20).map((row) => (
                      <tr key={row.row} className="border-t border-border-default">
                        <td className="px-3 py-2">{row.row}</td>
                        <td className="px-3 py-2">
                          <p className="font-medium">{row.name || "Sin nombre"}</p>
                          <p className="text-xs text-text-secondary">{row.email || "Sin correo"}</p>
                        </td>
                        <td className="px-3 py-2">{row.branchLabel || "-"}</td>
                        <td className="px-3 py-2">{row.primaryRole || "-"}</td>
                        <td className="px-3 py-2">{row.errors.length ? <span className="text-status-danger">{row.errors.join(" · ")}</span> : <span className="text-status-success">Lista</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 20 ? <p className="text-xs text-text-secondary">Se muestran las primeras 20 filas de {rows.length}.</p> : null}
            </>
          ) : null}
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button asChild type="button" variant="secondary">
              <Link href="/employees">Cancelar</Link>
            </Button>
            <Button type="button" disabled={!validRows.length || invalidRows.length > 0 || importEmployees.isPending} onClick={() => importEmployees.mutate()}>
              {importEmployees.isPending ? "Cargando..." : `Cargar ${validRows.length || ""} empleados`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EmployeeCard({ employee, selected = false, onToggleSelect }: { employee: EmployeeDirectoryItem; selected?: boolean; onToggleSelect?: () => void }) {
  const assignments = Array.isArray(employee.branchAssignments) ? employee.branchAssignments : [];
  const primary = assignments.find((assignment) => assignment.isPrimary) ?? assignments[0];
  const activeAssignments = assignments.filter((assignment) => assignment.branch?.name);
  const documentSummary = (employee as EmployeeDirectoryWithDocuments).documentSummary;
  return (
    <Card level={2} className={cn(selected && "ring-2 ring-primary/35")}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {onToggleSelect ? (
                <button
                  type="button"
                  className="rounded-full border border-border-default bg-surface-section px-2 py-1 text-[11px] font-semibold text-text-secondary"
                  onClick={onToggleSelect}
                >
                  {selected ? "Seleccionada" : "Seleccionar"}
                </button>
              ) : null}
              <UsersRound className="size-4 text-primary" />
              <h2 className="truncate font-semibold">{employee.name}</h2>
            </div>
            <p className="mt-1 truncate text-sm text-text-secondary">{employee.email}</p>
          </div>
          <Badge variant={employee.status === "ACTIVE" ? "success" : "secondary"}>{employee.status === "ACTIVE" ? "Activo" : employee.status}</Badge>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusPill label="Sucursal" value={primary?.branch?.name ?? "Sin nombre"} />
          <StatusPill label="Rol" value={primary?.role ?? "Sin asignación"} />
          <StatusPill label="Asignaciones" value={String(activeAssignments.length)} />
          {documentSummary ? <StatusPill label="Documentos" value={`${documentSummary.totalDocuments} documentos`} /> : null}
        </div>
        <div className="mt-4 grid gap-3 rounded-2xl border border-border-default bg-surface-elevated p-4 text-sm">
          <div className="flex items-center gap-2 text-text-secondary">
            <BriefcaseBusiness className="size-4 shrink-0" />
            <span className="min-w-0 truncate">{primary ? primary.role : "Sin asignación activa"}</span>
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <MapPin className="size-4 shrink-0" />
            <span className="min-w-0 truncate">{primary?.branch?.name ?? "Sucursal sin nombre"}</span>
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <CheckCircle2 className="size-4 shrink-0 text-status-success" />
            <span>{activeAssignments.length ? `${activeAssignments.length} asignación${activeAssignments.length === 1 ? "" : "es"} registrada${activeAssignments.length === 1 ? "" : "s"}` : "Sin asignaciones adicionales"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmployeeRow({ employee, compact = false, selected = false, onToggleSelect }: { employee: EmployeeDirectoryItem; compact?: boolean; selected?: boolean; onToggleSelect?: () => void }) {
  const assignments = Array.isArray(employee.branchAssignments) ? employee.branchAssignments : [];
  const primary = assignments.find((assignment) => assignment.isPrimary) ?? assignments[0];
  const activeAssignments = assignments.filter((assignment) => assignment.branch?.name);
  const documentSummary = (employee as EmployeeDirectoryWithDocuments).documentSummary;

  return (
    <div className={cn("grid grid-cols-1 gap-3 border-b border-border-default px-4 py-4 last:border-b-0 md:grid-cols-[52px_minmax(0,1.3fr)_180px_180px_120px_1fr_130px] md:items-center", selected && "bg-primary/5", compact && "opacity-95")}>
      <button type="button" className="flex items-center justify-center rounded-full border border-border-default bg-surface-section p-2 text-xs font-semibold" onClick={onToggleSelect} aria-label={`Seleccionar ${employee.name}`}>
        {selected ? "☑" : "☐"}
      </button>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <UsersRound className="size-4 shrink-0 text-primary" />
          <p className="truncate font-semibold">{employee.name}</p>
        </div>
        <p className="mt-1 truncate text-sm text-text-secondary">{employee.email}</p>
      </div>
      <div className="flex items-center gap-2 text-sm text-text-secondary md:min-w-0">
        <MapPin className="size-4 shrink-0" />
        <span className="truncate">{primary?.branch?.name ?? "Sin nombre"}</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-text-secondary md:min-w-0">
        <BriefcaseBusiness className="size-4 shrink-0" />
        <span className="truncate">{primary?.role ?? "Sin asignación"}</span>
      </div>
      <div className="text-sm text-text-secondary">{documentSummary ? <span className="font-medium text-text-primary">{documentSummary.totalDocuments}</span> : "0"} docs</div>
      <div className="text-sm text-text-secondary">{activeAssignments.length} asignación{activeAssignments.length === 1 ? "" : "es"}</div>
      <div className="flex items-center justify-between gap-3 md:justify-end">
        <Badge variant={employee.status === "ACTIVE" ? "success" : "secondary"}>{employee.status === "ACTIVE" ? "Activo" : employee.status}</Badge>
        <ChevronRight className="hidden size-4 shrink-0 text-text-secondary md:block" />
      </div>
    </div>
  );
}

function SortHeader({ label, active, direction, onClick }: { label: string; active: boolean; direction: "asc" | "desc"; onClick: () => void }) {
  return (
    <button type="button" className="flex items-center gap-1 text-left transition hover:text-text-primary" onClick={onClick}>
      <span>{label}</span>
      {active ? direction === "asc" ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" /> : <ArrowUpDown className="size-3.5 opacity-60" />}
    </button>
  );
}

function ImportMetric({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "success" | "danger" }) {
  return (
    <div className="rounded-xl border border-border-default p-3">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className={tone === "success" ? "text-xl font-semibold text-status-success" : tone === "danger" ? "text-xl font-semibold text-status-danger" : "text-xl font-semibold"}>{value}</p>
    </div>
  );
}

async function copySelectedEmails(data: EmployeeDirectoryItem[], selectedIds: string[]) {
  const emails = data.filter((employee) => selectedIds.includes(employee.id)).map((employee) => employee.email);
  if (!emails.length) return;
  await navigator.clipboard.writeText(emails.join("\n"));
  toast.success(`${emails.length} correos copiados`);
}

async function exportEmployeesCsv(data: EmployeeDirectoryItem[], filename: string) {
  if (!data.length) return;
  const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const rows = [
    ["Nombre", "Correo", "Estado", "Sucursal", "Rol", "Documentos", "Asignaciones"],
    ...data.map((employee) => {
      const assignments = Array.isArray(employee.branchAssignments) ? employee.branchAssignments : [];
      const primary = assignments.find((assignment) => assignment.isPrimary) ?? assignments[0];
      const documentSummary = (employee as EmployeeDirectoryWithDocuments).documentSummary;
      return [
        employee.name,
        employee.email,
        employee.status,
        primary?.branch?.name ?? "",
        primary?.role ?? "",
        String(documentSummary?.totalDocuments ?? 0),
        String(assignments.length),
      ];
    }),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(escape).join(",")).join("\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${filename}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
  toast.success(`Exportados ${data.length} empleados`);
}

function buildEmployeesExportName(input: { branchName?: string; status?: string; pageSize: number; page: number }) {
  const parts = ["empleados"];
  if (input.branchName) parts.push(slugify(input.branchName));
  if (input.status) parts.push(slugify(input.status));
  parts.push(`p${input.page}`);
  parts.push(`x${input.pageSize}`);
  return parts.filter(Boolean).join("-");
}

function compareEmployees(left: EmployeeDirectoryItem, right: EmployeeDirectoryItem, field: "name" | "email" | "status" | "documents" | "assignments", direction: "asc" | "desc") {
  const factor = direction === "asc" ? 1 : -1;
  const leftAssignments = Array.isArray(left.branchAssignments) ? left.branchAssignments : [];
  const rightAssignments = Array.isArray(right.branchAssignments) ? right.branchAssignments : [];
  const leftPrimary = leftAssignments.find((assignment) => assignment.isPrimary) ?? leftAssignments[0];
  const rightPrimary = rightAssignments.find((assignment) => assignment.isPrimary) ?? rightAssignments[0];
  const leftDocs = (left as EmployeeDirectoryWithDocuments).documentSummary?.totalDocuments ?? 0;
  const rightDocs = (right as EmployeeDirectoryWithDocuments).documentSummary?.totalDocuments ?? 0;
  const compareText = (a: string, b: string) => a.localeCompare(b, "es");

  if (field === "email") return compareText(left.email, right.email) * factor;
  if (field === "status") return compareText(left.status, right.status) * factor;
  if (field === "documents") return (leftDocs - rightDocs) * factor;
  if (field === "assignments") return ((leftAssignments.length - rightAssignments.length) || compareText(leftPrimary?.branch?.name ?? "", rightPrimary?.branch?.name ?? "")) * factor;
  return compareText(left.name, right.name) * factor;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
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
  const rows = records
    .slice(1)
    .filter((record) => record.some((cell) => cell.trim()))
    .map((record, offset) => {
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
  return rows.map((row) => (duplicated.has(row.email) ? { ...row, errors: [...row.errors, "Correo repetido en el archivo"] } : row));
}

function parseDelimitedTable(source: string, separatorHint?: "," | ";" | "\t") {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const firstLine = source.split(/\r?\n/, 1)[0] ?? "";
  const separator = separatorHint ?? (firstLine.includes(";") ? ";" : firstLine.includes("\t") ? "\t" : ",");
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === separator && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function normalizeHeader(value: string) {
  return value.replace(/^\uFEFF/, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("es");
}

function parseStatus(value: string): EmployeeStatus | null {
  const normalized = normalizeHeader(value);
  if (!normalized || normalized === "activo" || normalized === "active") return "ACTIVE";
  if (normalized === "inactivo" || normalized === "inactive") return "INACTIVE";
  if (normalized === "finalizado" || normalized === "terminated") return "TERMINATED";
  return null;
}

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
