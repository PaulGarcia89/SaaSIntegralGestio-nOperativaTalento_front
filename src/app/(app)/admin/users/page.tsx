"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { ROLE_KEYS, type RoleKey, type UserDto } from "@/lib/contracts";
import {
  createTenantUser,
  deleteTenantUser,
  fetchGlobalUsers,
  fetchTenantUsers,
  getApiErrorMessage,
  updateTenantUser,
} from "@/lib/backend";
import { roleLabels, userStatusLabels } from "@/lib/ui-labels";
import { shortId } from "@/lib/platform-labels";
import { useAppStore } from "@/store/app-store";
import { ConfirmDeleteDialog } from "@/components/admin-crud";
import { DomainTable, FilterToolbar, matchesSearchAndFilter } from "@/components/domain";
import {
  BlockedState,
  EmptyState,
  ErrorState,
  InlineNote,
  Metric,
  MetricRow,
  PageHeader,
  PageSection,
  SkeletonRows,
  StatusBadge,
  type Tone,
} from "@/components/system";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSelect } from "@/components/ui/form-select";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

/**
 * Usuarios de la empresa (y de toda la plataforma, en la vista global).
 *
 * Qué estaba mal
 * --------------
 * · Cuando el nombre de la empresa no estaba cargado, la columna «Empresa»
 *   imprimía el UUID del tenant. Un identificador interno no es un nombre.
 * · «Email» en medio de una pantalla en español, y las opciones de rol y
 *   estado en minúscula («activo», «invitado») mientras la tabla los mostraba
 *   capitalizados: dos vocabularios para lo mismo en la misma pantalla.
 * · Eliminar decía «esta acción es permanente» sin decir que la persona pierde
 *   el acceso en el acto, ni distinguirlo de suspender —que hace casi lo mismo
 *   y sí se puede deshacer—. Ahora el diálogo enumera qué pasa y ofrece
 *   suspender como alternativa.
 * · **Nada impedía eliminar o suspender tu propia cuenta.** Un administrador
 *   de empresa podía dejarse fuera y quedarse sin poder volver a entrar. Ahora
 *   está bloqueado, con el motivo escrito.
 * · Suspender a alguien se hacía con un desplegable y el botón «Guardar», sin
 *   ningún aviso de que esa persona deja de poder entrar.
 * · El error del servidor al eliminar se sustituía por «Error al eliminar el
 *   usuario», que oculta lo único que explica por qué falló.
 * · La vista global no decía por qué no hay botones de editar: aparecía una
 *   tabla sin acciones y sin explicación.
 */

const userSchema = z.object({
  fullName: z.string().min(2, "Escribe el nombre completo."),
  email: z.email("Escribe un correo válido."),
  role: z.enum(ROLE_KEYS),
  status: z.enum(["active", "invited", "suspended"]),
});

type UserFormValues = z.infer<typeof userSchema>;

const STATUS_TONE: Record<UserDto["status"], Tone> = {
  active: "success",
  invited: "info",
  suspended: "warning",
};

const STATUS_DETAIL: Record<UserDto["status"], string> = {
  active: "Entra con normalidad y usa lo que su rol le permite.",
  invited: "Tiene invitación enviada, pero todavía no ha entrado nunca.",
  suspended: "No puede entrar. Sus datos y su historial se conservan.",
};

const STATUS_OPTIONS = (["active", "invited", "suspended"] as const).map((value) => ({
  value,
  label: userStatusLabels[value],
}));

export default function UsersPage() {
  const { can, currentTenant, currentRole, currentUser, impersonation, tenants } = useAppStore();
  const isGlobalView = currentRole === "admin_saas" && !impersonation?.active;
  const queryClient = useQueryClient();
  const usersQuery = useQuery({
    queryKey: isGlobalView ? ["global-users"] : ["tenant-users", currentTenant.id],
    queryFn: () => (isGlobalView ? fetchGlobalUsers() : fetchTenantUsers(currentTenant.id)),
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

  /** Nadie puede dejarse a sí mismo fuera del producto. */
  const editingSelf = Boolean(editing && editing.id === currentUser.id);
  const suspendingSelf = editingSelf && selectedStatus === "suspended";
  const losingOwnAccess = editingSelf && editing!.role === "admin_empresa" && selectedRole !== "admin_empresa";
  const suspendingOther = Boolean(editing) && !editingSelf && editing!.status !== "suspended" && selectedStatus === "suspended";

  const saveMutation = useMutation({
    mutationFn: (values: UserFormValues) =>
      editing
        ? updateTenantUser(editing.id, { ...editing, ...values, tenantId: currentTenant.id })
        : createTenantUser({ ...values, tenantId: currentTenant.id }),
    onSuccess: (_data, values) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-users", currentTenant.id] });
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      queryClient.invalidateQueries({ queryKey: ["global-users"] });
      const suspended = suspendingOther;
      setOpen(false);
      setEditing(null);
      form.reset();
      toast.success(
        suspended
          ? `${values.fullName} queda suspendida: ya no puede entrar`
          : editing
            ? "Usuario actualizado"
            : values.status === "invited"
              ? `Invitación registrada para ${values.email}`
              : "Usuario creado",
      );
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible guardar el usuario.")),
  });

  const deleteMutation = useMutation({
    mutationFn: (user: UserDto) => deleteTenantUser(user.id, user.tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-users", currentTenant.id] });
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      queryClient.invalidateQueries({ queryKey: ["global-users"] });
      const name = deleting?.fullName ?? "El usuario";
      setDeleting(null);
      toast.success(`${name} ya no tiene acceso`);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible eliminar el usuario.")),
  });

  if (!can("admin.users")) {
    return (
      <BlockedState
        title="Sin acceso a la gestión de usuarios"
        cause="Ver y modificar identidades, invitaciones y accesos es una tarea de administración."
        owner="Quien administra la empresa"
        resolution="Si necesitas entrar, pide el permiso «Administrar usuarios»."
      />
    );
  }

  const users = usersQuery.data ?? [];

  function tenantName(user: UserDto) {
    const match = tenants.find((tenant) => tenant.id === user.tenantId);
    return match?.name ?? `Empresa sin cargar (${shortId(user.tenantId)})`;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={isGlobalView ? "Gobierno de la plataforma" : currentTenant.name}
        title="Usuarios"
        description={
          isGlobalView
            ? "Todas las personas con acceso al producto, de todas las empresas. Para modificar a alguien, entra a su empresa."
            : "Quién puede entrar, con qué rol y en qué estado. Suspender o eliminar corta el acceso de inmediato."
        }
        actions={
          isGlobalView ? undefined : (
            <Button
              onClick={() => {
                setEditing(null);
                form.reset();
                setOpen(true);
              }}
            >
              Nuevo usuario
            </Button>
          )
        }
      />

      {usersQuery.isLoading ? (
        <SkeletonRows rows={6} label="Cargando los usuarios" />
      ) : usersQuery.isError ? (
        <ErrorState
          title="No fue posible cargar los usuarios"
          detail={getApiErrorMessage(usersQuery.error, "Reintenta la consulta para continuar.")}
          onRetry={() => void usersQuery.refetch()}
        />
      ) : (
        <>
          <MetricRow>
            <Metric label="Con acceso" value={String(users.filter((user) => user.status === "active").length)} />
            <Metric
              label="Invitaciones sin usar"
              value={String(users.filter((user) => user.status === "invited").length)}
              detail="Todavía no han entrado"
            />
            <Metric
              label="Suspendidos"
              value={String(users.filter((user) => user.status === "suspended").length)}
              detail="No pueden entrar"
              tone={users.some((user) => user.status === "suspended") ? "warning" : undefined}
            />
            <Metric
              label="Con permisos de administración"
              value={String(users.filter((user) => user.role === "admin_empresa" || user.role === "admin_saas").length)}
            />
          </MetricRow>

          {isGlobalView ? (
            <InlineNote tone="info" title="Vista de solo lectura">
              Desde la vista global se consulta, no se modifica. Para crear, editar o eliminar a alguien, entra a su
              empresa: así el cambio queda registrado dentro del alcance correcto.
            </InlineNote>
          ) : null}

          {!isGlobalView && open ? (
            <PageSection
              boxed
              title={editing ? `Editar a ${editing.fullName}` : "Nuevo usuario"}
              description={
                editing
                  ? "El cambio de rol o de estado se aplica en cuanto se guarda."
                  : `Se dará de alta en ${currentTenant.name} con el rol que elijas.`
              }
            >
              <form
                id="user-form"
                className="space-y-5"
                onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="min-w-0 space-y-2">
                    <Label htmlFor="user-name">Nombre completo</Label>
                    <Input id="user-name" autoComplete="off" {...form.register("fullName")} />
                    {form.formState.errors.fullName ? (
                      <p className="text-2xs text-status-danger">{form.formState.errors.fullName.message}</p>
                    ) : null}
                  </div>
                  <div className="min-w-0 space-y-2">
                    <Label htmlFor="user-email">Correo electrónico</Label>
                    <Input id="user-email" inputMode="email" autoComplete="off" {...form.register("email")} />
                    <p className="text-2xs text-ink-3">Es con lo que entra al producto.</p>
                    {form.formState.errors.email ? (
                      <p className="text-2xs text-status-danger">{form.formState.errors.email.message}</p>
                    ) : null}
                  </div>
                  <div className="min-w-0 space-y-2">
                    <Label>Rol</Label>
                    <FormSelect
                      value={selectedRole}
                      onValueChange={(value) => form.setValue("role", value as RoleKey, { shouldDirty: true })}
                      options={ROLE_KEYS.map((role) => ({ label: roleLabels[role], value: role }))}
                    />
                    <p className="text-2xs text-ink-3">Decide qué pantallas ve y qué puede hacer en cada una.</p>
                  </div>
                  <div className="min-w-0 space-y-2">
                    <Label>Estado</Label>
                    <FormSelect
                      value={selectedStatus}
                      onValueChange={(value) =>
                        form.setValue("status", value as UserFormValues["status"], { shouldDirty: true })
                      }
                      options={STATUS_OPTIONS}
                    />
                    <p className="text-2xs text-ink-3">{STATUS_DETAIL[selectedStatus]}</p>
                  </div>
                </div>

                {suspendingSelf ? (
                  <InlineNote tone="blocked" title="No puedes suspenderte a ti mismo">
                    Quedarías sin poder entrar y sin nadie que pueda revertirlo desde tu propia sesión. Si quieres
                    dejar de administrar, pide a otra persona con permiso de administración que haga el cambio.
                  </InlineNote>
                ) : losingOwnAccess ? (
                  <InlineNote tone="warning" title="Estás quitándote tus propios permisos de administración">
                    Al guardar dejarás de ver esta pantalla y no podrás deshacerlo tú mismo. Asegúrate de que queda otra
                    persona con rol de administración en la empresa.
                  </InlineNote>
                ) : suspendingOther ? (
                  <InlineNote tone="warning" title={`${editing!.fullName} dejará de poder entrar`}>
                    La sesión que tenga abierta deja de servir en cuanto recargue. Sus datos, su historial y sus
                    asignaciones se conservan intactos: reactivarla le devuelve el acceso tal como estaba.
                  </InlineNote>
                ) : null}

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
                  <Button
                    type="submit"
                    variant={suspendingOther ? "destructive" : "default"}
                    disabled={suspendingSelf}
                    loading={saveMutation.isPending}
                    loadingLabel="Guardando…"
                  >
                    {!editing ? "Crear usuario" : suspendingOther ? "Guardar y suspender el acceso" : "Guardar cambios"}
                  </Button>
                </div>
              </form>
            </PageSection>
          ) : null}

          <FilterToolbar
            searchPlaceholder="Buscar por nombre, correo, rol o estado"
            options={[
              { label: "Todos", value: "" },
              { label: "Con acceso", value: "active" },
              { label: "Invitados", value: "invited" },
              { label: "Suspendidos", value: "suspended" },
            ]}
            searchValue={query}
            onSearchChange={setQuery}
            filterValue={activeFilter}
            onFilterChange={setActiveFilter}
          />

          {scopedUsers.length === 0 ? (
            <EmptyState
              reason={query || activeFilter ? "no-matches" : "no-records"}
              title={query || activeFilter ? "Nadie coincide con la búsqueda" : "Todavía no hay usuarios"}
              description={
                query || activeFilter
                  ? "Prueba con otro texto o quita el filtro de estado."
                  : "Da de alta a la primera persona para que pueda entrar."
              }
              onClearFilters={
                query || activeFilter
                  ? () => {
                      setQuery("");
                      setActiveFilter("");
                    }
                  : undefined
              }
            />
          ) : (
            <DomainTable
              exportable
              preferencesKey="admin.users.table"
              data={scopedUsers}
              getKey={(user) => user.id}
              columns={[
                ...(isGlobalView
                  ? [
                      {
                        key: "tenant",
                        header: "Empresa",
                        sortable: true,
                        render: (user: UserDto) => tenantName(user),
                      },
                    ]
                  : []),
                {
                  key: "name",
                  header: "Nombre",
                  sortable: true,
                  render: (user) => (
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink-1">
                        {user.fullName}
                        {user.id === currentUser.id ? <span className="text-ink-3"> · tú</span> : null}
                      </p>
                      <p className="truncate text-2xs text-ink-3">{user.email}</p>
                    </div>
                  ),
                },
                { key: "role", header: "Rol", sortable: true, render: (user) => roleLabels[user.role] },
                {
                  key: "status",
                  header: "Estado",
                  sortable: true,
                  render: (user) => (
                    <StatusBadge size="sm" tone={STATUS_TONE[user.status]} label={userStatusLabels[user.status]} />
                  ),
                },
                {
                  key: "email",
                  header: "Correo",
                  mobileHidden: true,
                  sortable: true,
                  render: (user) => <span className="break-all">{user.email}</span>,
                },
                ...(!isGlobalView
                  ? [
                      {
                        key: "actions",
                        header: "Acciones",
                        render: (user: UserDto) => (
                          <div className="flex flex-wrap gap-2">
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
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={user.id === currentUser.id}
                              title={
                                user.id === currentUser.id
                                  ? "No puedes eliminar tu propia cuenta"
                                  : undefined
                              }
                              onClick={() => setDeleting(user)}
                            >
                              Eliminar
                            </Button>
                          </div>
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          )}
        </>
      )}

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(next) => !next && setDeleting(null)}
        title={deleting ? `¿Eliminar a ${deleting.fullName}?` : "Eliminar usuario"}
        description="Eliminar borra la cuenta. Si solo quieres que deje de entrar por un tiempo, suspéndela: se puede deshacer."
        confirmLabel="Eliminar la cuenta"
        pending={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
        consequences={
          deleting ? (
            <ul className="list-disc space-y-1 pl-5">
              <li>Pierde el acceso de inmediato: la sesión que tenga abierta deja de servir al recargar.</li>
              <li>
                Deja de constar como {roleLabels[deleting.role].toLocaleLowerCase("es")} en {currentTenant.name}.
              </li>
              <li>Lo que ya registró (vacantes, cursos, movimientos) sigue existiendo y conserva su firma.</li>
              <li>Volver a darle acceso exige crear la cuenta otra vez desde cero.</li>
            </ul>
          ) : null
        }
      />
    </div>
  );
}
