"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { BranchDto } from "@/lib/contracts";
import { createBranch, deleteBranch, fetchBranches, fetchTenants, updateBranch } from "@/lib/backend";
import { CrudHeader, CrudPanel, ConfirmDeleteDialog, FormDialog } from "@/components/admin-crud";
import { DomainTable, FilterToolbar, StateCard } from "@/components/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FormSelect } from "@/components/ui/form-select";
import { branchStatusLabels } from "@/lib/ui-labels";
import { useAppStore } from "@/store/app-store";

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
  const { can, currentTenant } = useAppStore();
  const queryClient = useQueryClient();
  const tenantsQuery = useQuery({ queryKey: ["admin-tenants"], queryFn: fetchTenants });
  const branchesQuery = useQuery({ queryKey: ["branches", currentTenant.id], queryFn: () => fetchBranches(currentTenant.id) });
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BranchDto | null>(null);
  const [deleting, setDeleting] = useState<BranchDto | null>(null);

  const form = useForm<BranchFormInput, unknown, BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      tenantId: "",
      name: "",
      city: "",
      manager: "",
      employees: 0,
      status: "active",
    },
  });

  const filtered = useMemo(
    () =>
      (branchesQuery.data ?? []).filter((branch) =>
        [branch.name, branch.city, branch.manager, branch.status]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [branchesQuery.data, query],
  );

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
    mutationFn: deleteBranch,
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

  return (
    <div className="space-y-5">
      <CrudHeader
        title="Gestion de sucursales"
        description="Consulta, crea, modifica y elimina sucursales o sedes operativas por empresa."
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
            description="Asocia una sede a una empresa y manten su informacion operativa."
            trigger={<Button onClick={() => setOpen(true)}>Nueva sucursal</Button>}
          >
            <form className="space-y-4" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}>
              <div className="space-y-2">
                <Label>Empresa</Label>
                <FormSelect
                  className="h-11 w-full rounded-2xl"
                  placeholder="Selecciona empresa"
                  value={form.watch("tenantId")}
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
                  value={form.watch("status")}
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
        searchPlaceholder="Buscar por sucursal, ciudad, responsable o estado"
        options={[
          { label: "Todas", value: "" },
          { label: "Activas", value: "active" },
          { label: "Inactivas", value: "inactive" },
        ]}
        activeValue={query}
        onChange={setQuery}
      />

      <CrudPanel>
        <DomainTable exportable
          data={filtered}
          getKey={(branch) => branch.id}
          columns={[
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

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(value) => !value && setDeleting(null)}
        title="Eliminar sucursal"
        description={`Se eliminara ${deleting?.name ?? "la sucursal"} de la empresa asociada.`}
        pending={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}
