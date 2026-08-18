"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { ROLE_KEYS, type RoleKey, type UserDto } from "@/lib/contracts";
import { createTenantUser, deleteTenantUser, fetchGlobalUsers, fetchTenantUsers, updateTenantUser } from "@/lib/backend";
import { roleLabels, userStatusLabels } from "@/lib/ui-labels";
import { useAppStore } from "@/store/app-store";
import { CrudHeader, CrudPanel } from "@/components/admin-crud";
import { DomainTable, FilterToolbar, StateCard, matchesSearchAndFilter } from "@/components/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSelect } from "@/components/ui/form-select";
import { Card, CardContent } from "@/components/ui/card";
import { AsyncState } from "@/components/async-state";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

const userSchema = z.object({
  fullName: z.string().min(2),
  email: z.email(),
  role: z.enum(ROLE_KEYS),
  status: z.enum(["active", "invited", "suspended"]),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function UsersPage() {
  const { can, currentTenant, currentRole, impersonation, tenants } = useAppStore();
  const isGlobalView = currentRole === "admin_saas" && !impersonation?.active;
  const queryClient = useQueryClient();
  const usersQuery = useQuery({
    queryKey: isGlobalView ? ["global-users"] : ["tenant-users", currentTenant.id],
    queryFn: () => isGlobalView ? fetchGlobalUsers() : fetchTenantUsers(currentTenant.id),
  });
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserDto | null>(null);
  const [deleting, setDeleting] = useState<UserDto | null>(null);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      fullName: "",
      email: "",
      role: "empleado",
      status: "active",
    },
  });
  useUnsavedChanges(open && form.formState.isDirty, "user-form");
  const selectedRole = useWatch({ control: form.control, name: "role" });
  const selectedStatus = useWatch({ control: form.control, name: "status" });

  const scopedUsers = useMemo(
    () =>
      (usersQuery.data ?? []).filter((user) =>
        matchesSearchAndFilter([user.fullName, user.email, user.role, user.status], query, activeFilter),
      ),
    [activeFilter, query, usersQuery.data],
  );

  const saveMutation = useMutation({
    mutationFn: (values: UserFormValues) =>
      editing
        ? updateTenantUser(editing.id, { ...editing, ...values, tenantId: currentTenant.id })
        : createTenantUser({ ...values, tenantId: currentTenant.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-users", currentTenant.id] });
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      setOpen(false);
      setEditing(null);
      form.reset();
      toast.success(editing ? "Usuario actualizado" : "Usuario creado");
    },
    onError: () => toast.error("Error al guardar el usuario"),
  });

  const deleteMutation = useMutation({
    mutationFn: (user: UserDto) => deleteTenantUser(user.id, user.tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-users", currentTenant.id] });
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      setDeleting(null);
      toast.success("Usuario eliminado");
    },
    onError: () => toast.error("Error al eliminar el usuario"),
  });

  if (!can("admin.users")) {
    return (
      <StateCard
        tone="restricted"
        title="Administración de usuarios bloqueada"
        description="El rol actual no tiene permiso para inspeccionar identidades, invitaciones o gobierno de accesos."
      />
    );
  }

  if (usersQuery.isLoading) return <AsyncState state="loading" title="Cargando usuarios" />;
  if (usersQuery.isError) return <AsyncState state="error" title="No fue posible cargar los usuarios" onRetry={() => { void usersQuery.refetch(); }} />;

  return (
    <div className="space-y-5">
      <CrudHeader
        title="Gestión de usuarios"
        description="Consulta, crea, modifica y elimina usuarios internos de la empresa, incluyendo rol y estado de acceso."
        badge={isGlobalView ? "Plataforma" : "Empresa"}
        action={
          isGlobalView ? undefined : <Button onClick={() => setOpen(true)}>Nuevo usuario</Button>
        }
      />
      {!isGlobalView && open ? (
        <Card level={2}>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">{editing ? "Editar usuario" : "Crear usuario"}</h2>
              <p className="text-sm text-text-secondary">Invita o actualiza usuarios de la empresa activa.</p>
            </div>
            <form id="user-form" className="space-y-4" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}>
              <div className="space-y-2">
                <Label>Nombre completo</Label>
                <Input {...form.register("fullName")} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input {...form.register("email")} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Rol</Label>
                  <FormSelect
                    className="h-11 w-full rounded-2xl"
                    value={selectedRole}
                    onValueChange={(v) => form.setValue("role", v as RoleKey)}
                    options={ROLE_KEYS.map((role) => ({ label: roleLabels[role], value: role }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <FormSelect
                    className="h-11 w-full rounded-2xl"
                    value={selectedStatus}
                    onValueChange={(v) => form.setValue("status", v as "active" | "invited" | "suspended")}
                    options={[
                      { label: "activo", value: "active" },
                      { label: "invitado", value: "invited" },
                      { label: "suspendido", value: "suspended" },
                    ]}
                  />
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
        searchPlaceholder="Buscar por nombre, correo, rol o estado"
        options={[
          { label: "Todos", value: "" },
          { label: "Activos", value: "active" },
          { label: "Invitados", value: "invited" },
          { label: "Suspendidos", value: "suspended" },
        ]}
        searchValue={query}
        onSearchChange={setQuery}
        filterValue={activeFilter}
        onFilterChange={setActiveFilter}
      />

      <CrudPanel>
        {scopedUsers.length === 0 ? (
          <StateCard
            tone="empty"
            title="No se encontraron usuarios"
            description="Esta empresa no tiene usuarios visibles para los filtros seleccionados."
          />
        ) : (
          <DomainTable exportable preferencesKey="admin.users.table"
            data={scopedUsers}
            getKey={(user) => user.id}
            columns={[
              ...(isGlobalView ? [{
                key: "tenant",
                header: "Empresa",
                sortable: true,
                render: (user: UserDto) => tenants.find((tenant) => tenant.id === user.tenantId)?.name ?? user.tenantId,
              }] : []),
              { key: "name", header: "Nombre", sortable: true, render: (user) => user.fullName },
              { key: "role", header: "Rol", sortable: true, render: (user) => roleLabels[user.role] },
              { key: "status", header: "Estado", sortable: true, render: (user) => userStatusLabels[user.status] },
              { key: "email", header: "Email", sortable: true, render: (user) => user.email },
              ...(!isGlobalView ? [{
                  key: "actions",
                  header: "Acciones",
                  render: (user: UserDto) => (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setEditing(user);
                        form.reset({
                          fullName: user.fullName,
                          email: user.email,
                          role: user.role,
                          status: user.status,
                        });
                        setOpen(true);
                      }}
                    >
                      Editar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setDeleting(user)}>
                      Eliminar
                    </Button>
                    </div>
                  ),
              }] : []),
            ]}
          />
        )}
      </CrudPanel>

      {deleting ? (
        <Card level={2}>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Eliminar usuario</h2>
              <p className="text-sm text-text-secondary">Se eliminará el usuario {deleting.fullName}.</p>
            </div>
            <div className="rounded-2xl border border-status-danger/20 bg-status-danger/5 px-4 py-3 text-sm leading-6 text-text-secondary">
              Esta acción es permanente. No podrás recuperar este registro una vez eliminado.
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDeleting(null)}
                disabled={deleteMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => deleteMutation.mutate(deleting)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Eliminando..." : "Eliminar definitivamente"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
