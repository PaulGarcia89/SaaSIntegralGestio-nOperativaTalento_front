"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import type { BranchDto } from "@/lib/contracts";
import { createBranch, deleteBranch, fetchBranchesForTenants, fetchSubscriptions, fetchTenants, updateBranch } from "@/lib/backend";
import { CrudHeader, CrudPanel, ConfirmDeleteDialog, FormDialog } from "@/components/admin-crud";
import { DomainTable, FilterToolbar, StateCard, matchesSearchAndFilter } from "@/components/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FormSelect } from "@/components/ui/form-select";
import { branchStatusLabels } from "@/lib/ui-labels";
import { useAppStore } from "@/store/app-store";
import { DataTable, InfoList, SectionCard } from "@/components/ui";
import { AsyncState } from "@/components/async-state";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

const branchSchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(2),
  city: z.string().min(2),
  manager: z.string().min(2),
  employees: z.coerce.number().min(0),
  status: z.enum(["active", "inactive"]),
});

type BranchFormValues = z.output<typeof branchSchema>;
type BranchFormInput = z.input<typeof branchSchema>;

export default function BranchesPage() {
  const { can, currentTenant, currentRole } = useAppStore();
  const queryClient = useQueryClient();
  const hasGlobalGovernance = currentRole === "admin_saas" || currentRole === "admin_plataforma";
  const tenantsQuery = useQuery({
    queryKey: ["admin-tenants", hasGlobalGovernance ? "global" : currentTenant.id],
    queryFn: () => hasGlobalGovernance ? fetchTenants() : Promise.resolve([currentTenant]),
    enabled: Boolean(currentTenant.id),
  });
  const tenantIds = useMemo(
    () => (tenantsQuery.data ?? []).map((tenant) => tenant.id),
    [tenantsQuery.data],
  );
  const branchesQuery = useQuery({
    queryKey: ["branches", "global", tenantIds],
    queryFn: () => fetchBranchesForTenants(tenantIds),
    enabled: tenantsQuery.isSuccess,
  });
  const subscriptionsQuery = useQuery({
    queryKey: ["subscriptions"],
    queryFn: fetchSubscriptions,
    enabled: hasGlobalGovernance,
  });
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BranchDto | null>(null);
  const [deleting, setDeleting] = useState<BranchDto | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState("");

  const form = useForm<BranchFormInput, unknown, BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      tenantId: currentTenant.id,
      name: "",
      city: "",
      manager: "",
      employees: 0,
      status: "active",
    },
  });
  useUnsavedChanges(open && form.formState.isDirty, "branch-form");
  const selectedTenantId = useWatch({ control: form.control, name: "tenantId" });
  const selectedStatus = useWatch({ control: form.control, name: "status" });

  const filtered = useMemo(
    () =>
      (branchesQuery.data ?? []).filter((branch) =>
        matchesSearchAndFilter([
          branch.name,
          branch.city,
          branch.manager,
          branch.status,
          tenantsQuery.data?.find((tenant) => tenant.id === branch.tenantId)?.name ?? "",
        ], query, activeFilter),
      ),
    [activeFilter, branchesQuery.data, query, tenantsQuery.data],
  );

  const selectedBranch = filtered.find((branch) => branch.id === selectedBranchId) ?? filtered[0] ?? null;
  const selectedTenant = tenantsQuery.data?.find((tenant) => tenant.id === selectedBranch?.tenantId) ?? null;
  const selectedSubscription =
    subscriptionsQuery.data?.find((subscription) => subscription.tenantId === selectedBranch?.tenantId) ?? null;
  const siblingBranches = (branchesQuery.data ?? []).filter(
    (branch) => branch.tenantId === selectedBranch?.tenantId && branch.id !== selectedBranch?.id,
  );
  const tenantBranchTotal =
    (branchesQuery.data ?? []).filter((branch) => branch.tenantId === selectedBranch?.tenantId).length;
  const tenantEmployees =
    (branchesQuery.data ?? [])
      .filter((branch) => branch.tenantId === selectedBranch?.tenantId)
      .reduce((total, branch) => total + branch.employees, 0);

  const saveMutation = useMutation({
    mutationFn: async (values: BranchFormValues) =>
      editing
        ? updateBranch(editing.id, values)
        : createBranch(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success(editing ? "Sucursal actualizada" : "Sucursal creada");
      setOpen(false);
      setEditing(null);
      form.reset();
    },
    onError: () => toast.error("Error al guardar la sucursal"),
  });

  const deleteMutation = useMutation({
    mutationFn: (branch: BranchDto) => deleteBranch(branch.id, branch.tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success("Sucursal eliminada");
      setDeleting(null);
    },
    onError: () => toast.error("Error al eliminar la sucursal"),
  });

  if (!can("admin.company")) {
    return (
      <StateCard
        tone="restricted"
        title="Sin acceso a sucursales"
        description="Solo roles administrativos pueden gestionar sedes o sucursales."
      />
    );
  }

  if (branchesQuery.isLoading || tenantsQuery.isLoading || subscriptionsQuery.isLoading) return <AsyncState state="loading" title="Cargando sucursales" />;
  if (branchesQuery.isError || tenantsQuery.isError || subscriptionsQuery.isError) return <AsyncState state="error" title="No fue posible cargar las sucursales" onRetry={() => { void branchesQuery.refetch(); void tenantsQuery.refetch(); if (hasGlobalGovernance) void subscriptionsQuery.refetch(); }} />;

  return (
    <div className="space-y-5">
      <CrudHeader
        title="Gestión de sucursales"
        description="Alta, edicion y control de sedes operativas."
        badge="Empresa"
        action={
          <FormDialog
            open={open}
            onOpenChange={(value) => {
              setOpen(value);
              if (!value) {
                setEditing(null);
                form.reset();
              }
            }}
            title={editing ? "Editar sucursal" : "Crear sucursal"}
            trigger={<Button onClick={() => {
              form.reset({
                tenantId: currentTenant.id,
                name: "",
                city: "",
                manager: "",
                employees: 0,
                status: "active",
              });
              setOpen(true);
            }}>Nueva sucursal</Button>}
          >
            <form id="branch-form" className="space-y-4" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}>
              <div className="space-y-2">
                <Label>Empresa</Label>
                <FormSelect
                  className="h-11 w-full rounded-2xl"
                  placeholder="Selecciona empresa"
                  value={selectedTenantId}
                  onValueChange={(v) => form.setValue("tenantId", v)}
                  options={(tenantsQuery.data ?? []).map((tenant) => ({ label: tenant.name, value: tenant.id }))}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input {...form.register("name")} />
                </div>
                <div className="space-y-2">
                  <Label>Ciudad</Label>
                  <Input {...form.register("city")} />
                </div>
                <div className="space-y-2">
                <Label>Responsable</Label>
                <Input {...form.register("manager")} />
                </div>
                <div className="space-y-2">
                  <Label>Empleados</Label>
                  <Input type="number" {...form.register("employees")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <FormSelect
                  className="h-11 w-full rounded-2xl"
                  value={selectedStatus}
                  onValueChange={(v) => form.setValue("status", v as "active" | "inactive")}
                  options={[
                    { label: "activa", value: "active" },
                    { label: "inactiva", value: "inactive" },
                  ]}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </FormDialog>
        }
      />

      <FilterToolbar
        searchPlaceholder="Buscar sucursal, ciudad o responsable"
        options={[
          { label: "Todas", value: "" },
          { label: "Activas", value: "active" },
          { label: "Inactivas", value: "inactive" },
        ]}
        searchValue={query}
        onSearchChange={setQuery}
        filterValue={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {filtered.length === 0 ? (
        <CrudPanel>
          <StateCard
            tone="empty"
            title="No hay sucursales visibles"
            description="Ajusta el filtro o crea una sucursal para comenzar."
          />
        </CrudPanel>
      ) : (
        <div className="grid gap-x-6 gap-y-8 2xl:gap-x-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">
          <CrudPanel>
            <DomainTable exportable
              data={filtered}
              getKey={(branch) => branch.id}
              onSelect={(branch) => setSelectedBranchId(branch.id)}
              columns={[
                {
                  key: "tenant",
                  header: "Empresa",
                  sortable: true,
                  render: (branch) =>
                    tenantsQuery.data?.find((tenant) => tenant.id === branch.tenantId)?.name ?? branch.tenantId,
                },
                { key: "name", header: "Sucursal", sortable: true, render: (branch) => branch.name },
                { key: "city", header: "Ciudad", sortable: true, render: (branch) => branch.city },
                { key: "manager", header: "Responsable", sortable: true, render: (branch) => branch.manager },
                { key: "employees", header: "Empleados", sortable: true, render: (branch) => branch.employees },
                { key: "status", header: "Estado", sortable: true, render: (branch) => branchStatusLabels[branch.status] },
                {
                  key: "actions",
                  header: "Acciones",
                  render: (branch) => (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditing(branch);
                          form.reset(branch);
                          setOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setDeleting(branch)}>
                        Eliminar
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          </CrudPanel>

          {selectedBranch ? (
            <SectionCard title={selectedBranch.name} subtitle="Detalle de sucursal" className="self-start">
              <div className="space-y-4">
                <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Contexto</p>
                    <h3 className="text-xl font-semibold tracking-tight text-foreground">{selectedBranch.name}</h3>
                    <p className="text-xs text-muted-foreground">{selectedTenant?.name ?? "Sin empresa"} · {selectedBranch.city}</p>
                  </div>
                </div>

                <InfoList
                  items={[
                    { title: "Responsable", description: selectedBranch.manager, badge: branchStatusLabels[selectedBranch.status] },
                    { title: "Dotacion", description: `${selectedBranch.employees} personas`, badge: `${tenantEmployees} total` },
                    { title: "Suscripción", description: selectedSubscription?.plan ?? "Sin suscripción", badge: selectedSubscription?.status ?? "Pendiente" },
                    { title: "Red", description: `${tenantBranchTotal} sucursales`, badge: `${siblingBranches.length} relacionadas` },
                  ]}
                />

                <DataTable
                  columns={["Sucursal", "Ciudad"]}
                  rows={siblingBranches.map((branch) => [branch.name, branch.city])}
                  pageSize={4}
                />
              </div>
            </SectionCard>
          ) : null}
        </div>
      )}

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(value) => !value && setDeleting(null)}
        title="Eliminar sucursal"
        description={`Se eliminara ${deleting?.name ?? "la sucursal"}.`}
        pending={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
      />
    </div>
  );
}
