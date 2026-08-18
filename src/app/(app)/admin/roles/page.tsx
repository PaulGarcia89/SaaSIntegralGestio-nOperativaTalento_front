"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { PERMISSION_KEYS, type PermissionKey, type RoleDefinitionDto } from "@/lib/contracts";
import { createRoleDefinition, deleteRoleDefinition, fetchRoleDefinitions, updateRoleDefinition } from "@/lib/backend";
import { scopeLabels } from "@/lib/ui-labels";
import { useAppStore } from "@/store/app-store";
import { CrudHeader, CrudPanel } from "@/components/admin-crud";
import { DomainTable, FilterToolbar, StateCard, matchesSearchAndFilter } from "@/components/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { FormSelect } from "@/components/ui/form-select";
import { AsyncState } from "@/components/async-state";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

const permissionOptions = [...PERMISSION_KEYS] as PermissionKey[];

const roleSchema = z.object({
  name: z.string().min(2),
  scope: z.enum(["global", "tenant", "module"]),
  permissions: z
    .array(z.string())
    .min(1)
    .refine((values) => values.every((value) => permissionOptions.includes(value as PermissionKey))),
  members: z.coerce.number().min(0),
});

type RoleFormValues = z.output<typeof roleSchema>;
type RoleFormInput = z.input<typeof roleSchema>;

export default function RolesPage() {
  const { can, currentTenant } = useAppStore();
  const queryClient = useQueryClient();
  const rolesQuery = useQuery({
    queryKey: ["role-definitions", currentTenant.id],
    queryFn: () => fetchRoleDefinitions(currentTenant.id),
  });
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RoleDefinitionDto | null>(null);
  const [deleting, setDeleting] = useState<RoleDefinitionDto | null>(null);

  const form = useForm<RoleFormInput, unknown, RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      scope: "module",
      permissions: ["dashboard.view"],
      members: 0,
    },
  });
  useUnsavedChanges(open && form.formState.isDirty, "role-form");
  const selectedPermissions = useWatch({
    control: form.control,
    name: "permissions",
    defaultValue: ["dashboard.view"],
  });
  const selectedScope = useWatch({ control: form.control, name: "scope" });

  const filtered = useMemo(
    () =>
      (rolesQuery.data ?? []).filter((role) =>
        matchesSearchAndFilter([role.name, role.scope, Array.isArray(role.permissions) ? role.permissions.join(" ") : ""], query, activeFilter),
      ),
    [activeFilter, query, rolesQuery.data],
  );

  const saveMutation = useMutation({
    mutationFn: (values: RoleFormValues) =>
      editing
        ? updateRoleDefinition(editing.id, {
            tenantId: currentTenant.id,
            ...values,
            permissions: values.permissions as PermissionKey[],
          })
        : createRoleDefinition({
            tenantId: currentTenant.id,
            ...values,
            permissions: values.permissions as PermissionKey[],
          }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-definitions", currentTenant.id] });
      toast.success(editing ? "Rol actualizado" : "Rol creado");
      setOpen(false);
      setEditing(null);
      form.reset();
    },
    onError: () => toast.error("Error al guardar el rol"),
  });

  const deleteMutation = useMutation({
    mutationFn: (role: RoleDefinitionDto) => deleteRoleDefinition(role.id, role.tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-definitions", currentTenant.id] });
      toast.success("Rol eliminado");
      setDeleting(null);
    },
    onError: () => toast.error("Error al eliminar el rol"),
  });

  if (!can("admin.roles")) {
    return (
      <StateCard
        tone="restricted"
        title="Sin acceso a roles"
        description="Tu rol actual no puede gestionar la matriz de permisos."
      />
    );
  }

  if (rolesQuery.isLoading) return <AsyncState state="loading" title="Cargando roles" />;
  if (rolesQuery.isError) return <AsyncState state="error" title="No fue posible cargar los roles" onRetry={() => { void rolesQuery.refetch(); }} />;

  return (
    <div className="space-y-5">
      <CrudHeader
        title="Gestión de roles y permisos"
        description="Consulta, crea, modifica y elimina roles internos con conjuntos de permisos asociados."
        badge="Empresa"
        action={
          <Button onClick={() => setOpen(true)}>Nuevo rol</Button>
        }
      />
      {open ? (
        <Card level={2}>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">{editing ? "Editar rol" : "Crear rol"}</h2>
              <p className="text-sm text-text-secondary">Define alcance, cantidad de miembros y permisos heredados o personalizados.</p>
            </div>
            <form id="role-form" className="space-y-4" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input {...form.register("name")} />
                </div>
                <div className="space-y-2">
                  <Label>Alcance</Label>
                  <FormSelect
                    className="h-11 w-full rounded-2xl"
                    value={selectedScope}
                    onValueChange={(v) => form.setValue("scope", v as "global" | "tenant" | "module")}
                    options={[
                      { label: scopeLabels.global, value: "global" },
                      { label: scopeLabels.tenant, value: "tenant" },
                      { label: scopeLabels.module, value: "module" },
                    ]}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Miembros</Label>
                <Input type="number" {...form.register("members")} />
              </div>
              <div className="space-y-2">
                <Label>Permisos</Label>
                <div className="flex flex-wrap gap-2">
                  {permissionOptions.map((permission) => {
                    const enabled = selectedPermissions.includes(permission);
                    return (
                      <button
                        key={permission}
                        type="button"
                        className={`rounded-full border px-3 py-1 text-sm ${enabled ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                        onClick={() => {
                          const current = form.getValues("permissions");
                          form.setValue(
                            "permissions",
                            enabled ? current.filter((item) => item !== permission) : [...current, permission],
                          );
                        }}
                      >
                        {permission}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setOpen(false);
                    setEditing(null);
                    form.reset();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}
      <FilterToolbar
        searchPlaceholder="Buscar por rol, alcance o permiso"
        options={[
          { label: "Todos", value: "" },
          { label: "Empresa", value: "tenant" },
          { label: "Módulo", value: "module" },
        ]}
        searchValue={query}
        onSearchChange={setQuery}
        filterValue={activeFilter}
        onFilterChange={setActiveFilter}
      />
      <CrudPanel>
        <DomainTable exportable
          data={filtered}
          getKey={(role) => role.id}
          columns={[
            { key: "name", header: "Rol", sortable: true, render: (role) => role.name },
            { key: "scope", header: "Alcance", sortable: true, render: (role) => scopeLabels[role.scope] },
            { key: "permissions", header: "Permisos", sortable: true, render: (role) => role.permissions.length },
            { key: "members", header: "Miembros", sortable: true, render: (role) => role.members },
            {
              key: "actions",
              header: "Acciones",
              render: (role) => (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEditing(role);
                      form.reset({
                        name: role.name,
                        scope: role.scope,
                        permissions: role.permissions,
                        members: role.members,
                      });
                      setOpen(true);
                    }}
                  >
                    Editar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setDeleting(role)}>
                    Eliminar
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </CrudPanel>
      {deleting ? (
        <Card level={2}>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Eliminar rol</h2>
              <p className="text-sm text-text-secondary">Se eliminará el rol {deleting.name}.</p>
            </div>
            <div className="rounded-2xl border border-status-danger/20 bg-status-danger/5 px-4 py-3 text-sm leading-6 text-text-secondary">
              Esta acción es permanente. No podrás recuperar este registro una vez eliminado.
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setDeleting(null)} disabled={deleteMutation.isPending}>
                Cancelar
              </Button>
              <Button type="button" variant="destructive" onClick={() => deleteMutation.mutate(deleting)} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? "Eliminando..." : "Eliminar definitivamente"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
