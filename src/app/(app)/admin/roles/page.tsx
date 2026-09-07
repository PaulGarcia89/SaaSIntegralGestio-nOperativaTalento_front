"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { PERMISSION_KEYS, type PermissionKey, type RoleDefinitionDto } from "@/lib/contracts";
import {
  createRoleDefinition,
  deleteRoleDefinition,
  fetchRoleDefinitions,
  getApiErrorMessage,
  updateRoleDefinition,
} from "@/lib/backend";
import { scopeLabels } from "@/lib/ui-labels";
import {
  groupedPermissions,
  manageWithoutView,
  matchesPermission,
  permissionDiff,
  permissionInfo,
  permissionLabel,
} from "@/lib/permission-labels";
import { useAppStore } from "@/store/app-store";
import { ConfirmDeleteDialog } from "@/components/admin-crud";
import {
  BlockedState,
  ConfirmPanel,
  DataView,
  ErrorState,
  ImpactReview,
  InlineNote,
  PageHeader,
  PageSection,
  StatusBadge,
  type DataColumn,
} from "@/components/system";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { initialOperationState, type OperationImpact, type OperationState } from "@/lib/operation-flow";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

/**
 * Roles y permisos.
 *
 * Es la pantalla que decide quién ve qué, y era la peor del producto.
 *
 * Qué cambió
 * ----------
 * · Las 97 claves de permiso se pintaban EN CRUDO —`courses.assign`,
 *   `applications.hire`, `platform.tenant.impersonate`— en una sola fila
 *   envolvente, sin agrupar, sin buscador y sin una palabra que explicara qué
 *   hace ninguna. Un administrador de empresa veía mezclados sus permisos con
 *   los de la plataforma. Ahora están descritas en `lib/permission-labels.ts`,
 *   agrupadas por área, plegables y con buscador.
 * · El número de personas afectadas por un cambio NO se calculaba: era un
 *   campo que el administrador TECLEABA. Y ni siquiera llegaba a guardarse:
 *   `createRoleDefinition` y `updateRoleDefinition` nunca envían `members` al
 *   servidor, que lo devuelve él mismo desde `_count.userRoles`. El campo
 *   pedía un dato, lo validaba y lo tiraba. Fuera: el recuento se muestra, no
 *   se pide.
 * · Guardar no mostraba nada. Ahora hay revisión de impacto: qué permisos se
 *   añaden, cuáles se quitan —por su nombre, no por su clave— y a cuánta
 *   gente afecta.
 * · No había ninguna protección contra quitarse a uno mismo el acceso: se
 *   podía retirar `admin.roles` del propio rol y perder la entrada a esta
 *   misma pantalla. Ahora es un bloqueo cuando el rol es el propio, y un aviso
 *   con reconocimiento explícito cuando no se puede determinar.
 * · Un rol podía quedarse con «Publicar cursos» y sin «Entrar a
 *   capacitación», es decir, con permiso para gestionar una pantalla a la que
 *   no puede llegar. Ahora se detecta y se ofrece corregirlo en un clic.
 * · La confirmación de borrado aparecía al FINAL de la página, fuera del campo
 *   visual de quien acababa de pulsar «Eliminar» en una fila.
 *
 * En el teléfono
 * --------------
 * Noventa y siete casillas no caben en una pantalla de 320 px sin una
 * jerarquía. Los grupos se pliegan, cada uno dice cuántos permisos tiene
 * activos, el buscador filtra sobre rótulo, descripción y clave, y cada fila
 * es un objetivo táctil completo con su explicación debajo. El formulario es
 * un diálogo a pantalla completa que respeta el área segura inferior.
 *
 * El contrato del backend no cambia.
 */

type Draft = {
  name: string;
  scope: "global" | "tenant" | "module";
  permissions: string[];
};

const EMPTY_DRAFT: Draft = { name: "", scope: "module", permissions: ["dashboard.view"] };

export default function RolesPage() {
  const { can, currentTenant } = useAppStore();
  const queryClient = useQueryClient();

  const rolesQuery = useQuery({
    queryKey: ["role-definitions", currentTenant.id],
    queryFn: () => fetchRoleDefinitions(currentTenant.id),
  });

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<RoleDefinitionDto | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<RoleDefinitionDto | null>(null);

  const open = creating || Boolean(editing);

  const saveMutation = useMutation({
    mutationFn: (draft: Draft) =>
      editing
        ? updateRoleDefinition(editing.id, {
            tenantId: currentTenant.id,
            name: draft.name,
            scope: draft.scope,
            permissions: draft.permissions as PermissionKey[],
            // El servidor lo calcula y lo devuelve; se manda el que ya tenía
            // solo para satisfacer el tipo, no para cambiarlo.
            members: editing.members,
          })
        : createRoleDefinition({
            tenantId: currentTenant.id,
            name: draft.name,
            scope: draft.scope,
            permissions: draft.permissions as PermissionKey[],
            members: 0,
          }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["role-definitions", currentTenant.id] });
      toast.success(editing ? "Rol actualizado" : "Rol creado");
      setCreating(false);
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (role: RoleDefinitionDto) => deleteRoleDefinition(role.id, role.tenantId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["role-definitions", currentTenant.id] });
      toast.success("Rol eliminado");
      setDeleting(null);
    },
  });

  const roles = useMemo(() => rolesQuery.data ?? [], [rolesQuery.data]);
  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase("es");
    if (!needle) return roles;
    return roles.filter(
      (role) =>
        role.name.toLocaleLowerCase("es").includes(needle) ||
        scopeLabels[role.scope].toLocaleLowerCase("es").includes(needle) ||
        role.permissions.some((key) => matchesPermission(key, needle)),
    );
  }, [roles, search]);

  if (!can("admin.roles")) {
    return (
      <BlockedState
        title="Sin acceso a roles y permisos"
        cause="Tu rol actual no incluye el permiso de administrar la matriz de permisos."
        owner="Quien administra los roles de tu empresa"
        resolution="Pídele que añada «Administrar roles y permisos» a tu rol."
      />
    );
  }

  const columns: Array<DataColumn<RoleDefinitionDto>> = [
    {
      key: "name",
      header: "Rol",
      priority: "identity",
      render: (role) => role.name,
      sortValue: (role) => role.name,
    },
    {
      key: "members",
      header: "Personas",
      priority: "primary",
      numeric: true,
      render: (role) => (
        <span className="font-mono tabular-figures">
          {role.members}
        </span>
      ),
      sortValue: (role) => role.members,
    },
    {
      key: "scope",
      header: "Alcance",
      priority: "primary",
      render: (role) => <StatusBadge size="sm" tone="neutral" label={scopeLabels[role.scope]} />,
      sortValue: (role) => role.scope,
    },
    {
      key: "permissions",
      header: "Permisos",
      priority: "secondary",
      // El número solo decía «34». Los de mayor alcance dicen qué es el rol.
      render: (role) => <PermissionSummary permissions={role.permissions} />,
      sortValue: (role) => role.permissions.length,
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Empresa"
        title="Roles y permisos"
        description="Qué puede hacer cada persona. Un cambio aquí afecta a todo el mundo que tenga ese rol."
        meta={<span>{roles.length} roles</span>}
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Nuevo rol
          </Button>
        }
      />

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3"
          aria-hidden="true"
        />
        <label htmlFor="roles-search" className="sr-only">
          Buscar por rol, alcance o permiso
        </label>
        <Input
          id="roles-search"
          type="search"
          className="pl-9"
          value={search}
          placeholder="Buscar por rol, alcance o permiso"
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {rolesQuery.isError ? (
        <ErrorState
          title="No fue posible cargar los roles"
          detail={getApiErrorMessage(rolesQuery.error, "Reintenta la consulta para continuar.")}
          onRetry={() => void rolesQuery.refetch()}
        />
      ) : (
        <DataView
          rows={filtered}
          loading={rolesQuery.isLoading}
          columns={columns}
          getKey={(role) => role.id}
          caption="Roles de la empresa"
          emptyReason={search ? "no-matches" : "no-records"}
          onClearFilters={search ? () => setSearch("") : undefined}
          emptyAction={
            !search ? (
              <Button onClick={() => setCreating(true)}>
                <Plus className="size-4" aria-hidden="true" />
                Crear el primer rol
              </Button>
            ) : undefined
          }
          rowActions={(role) => (
            <div className="flex flex-wrap justify-end gap-2">
              <Button size="sm" variant="secondary" onClick={() => setEditing(role)}>
                Editar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setDeleting(role)}>
                Eliminar
              </Button>
            </div>
          )}
        />
      )}

      {open ? (
        <RoleEditor
          role={editing}
          saving={saveMutation.isPending}
          error={saveMutation.error}
          onSave={(draft) => saveMutation.mutate(draft)}
          onClose={() => {
            setCreating(false);
            setEditing(null);
            saveMutation.reset();
          }}
        />
      ) : null}

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(next) => !next && setDeleting(null)}
        title={`¿Eliminar el rol «${deleting?.name ?? ""}»?`}
        description="El rol deja de existir y de poder asignarse."
        confirmLabel="Eliminar el rol"
        pending={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
        consequences={
          deleting && deleting.members > 0 ? (
            <>
              {deleting.members} {deleting.members === 1 ? "persona lo tiene" : "personas lo tienen"} asignado y
              perderán de golpe todo lo que este rol les permitía. Asígnales otro rol antes de eliminarlo.
            </>
          ) : (
            "Ninguna persona lo tiene asignado ahora mismo."
          )
        }
      />
    </div>
  );
}

/** Los permisos de mayor alcance del rol, para saber qué es de un vistazo. */
function PermissionSummary({ permissions }: { permissions: readonly string[] }) {
  const manage = permissions.filter((key) => permissionInfo(key).kind === "manage");
  const shown = (manage.length ? manage : permissions).slice(0, 2);
  const rest = permissions.length - shown.length;

  return (
    <span className="text-sm text-ink-2">
      {shown.map((key) => permissionLabel(key)).join(", ") || "Sin permisos"}
      {rest > 0 ? ` y ${rest} más` : ""}
    </span>
  );
}

/* ==========================================================================
   EDITOR
   ========================================================================== */

function RoleEditor({
  role,
  saving,
  error,
  onSave,
  onClose,
}: {
  role: RoleDefinitionDto | null;
  saving: boolean;
  error: unknown;
  onSave: (draft: Draft) => void;
  onClose: () => void;
}) {
  const { can, currentUser } = useAppStore();
  const [draft, setDraft] = useState<Draft>(() =>
    role ? { name: role.name, scope: role.scope, permissions: [...role.permissions] } : EMPTY_DRAFT,
  );
  const [permissionSearch, setPermissionSearch] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const dirty =
    draft.name !== (role?.name ?? EMPTY_DRAFT.name) ||
    draft.scope !== (role?.scope ?? EMPTY_DRAFT.scope) ||
    permissionDiff(role?.permissions ?? EMPTY_DRAFT.permissions, draft.permissions).added.length > 0 ||
    permissionDiff(role?.permissions ?? EMPTY_DRAFT.permissions, draft.permissions).removed.length > 0;

  useUnsavedChanges(dirty, "role-form");

  const before = role?.permissions ?? [];
  const diff = permissionDiff(before, draft.permissions);
  const gaps = manageWithoutView(draft.permissions);

  const groups = useMemo(() => groupedPermissions(PERMISSION_KEYS), []);
  const visibleGroups = groups
    .map((group) => ({ ...group, keys: group.keys.filter((key) => matchesPermission(key, permissionSearch)) }))
    .filter((group) => group.keys.length > 0);

  const toggle = (key: string) =>
    setDraft((current) => ({
      ...current,
      permissions: current.permissions.includes(key)
        ? current.permissions.filter((item) => item !== key)
        : [...current.permissions, key],
    }));

  const setGroup = (keys: string[], enabled: boolean) =>
    setDraft((current) => ({
      ...current,
      permissions: enabled
        ? Array.from(new Set([...current.permissions, ...keys]))
        : current.permissions.filter((item) => !keys.includes(item)),
    }));

  /**
   * ¿Este cambio deja a quien lo hace fuera de esta pantalla?
   *
   * Solo se puede afirmar cuando el rol editado es el de la propia persona.
   * El producto no expone qué definición de rol tiene asignada cada usuario,
   * así que se distingue lo que se sabe de lo que se sospecha: si el rol tiene
   * gente dentro y se le retira `admin.roles`, se avisa sin afirmar que sea el
   * suyo.
   */
  const removesAdminRoles = before.includes("admin.roles") && !draft.permissions.includes("admin.roles");
  const couldLockSelf = removesAdminRoles && (role?.members ?? 0) > 0 && can("admin.roles");

  const blockers: OperationImpact["blockers"] = [];
  if (!draft.name.trim() || draft.name.trim().length < 2) {
    blockers.push({
      code: "NO_NAME",
      cause: "El rol no tiene nombre.",
      owner: "Quien administra los roles",
      resolution: "Ponle un nombre que describa el puesto, no el permiso.",
      fieldId: "role-name",
    });
  }
  if (draft.permissions.length === 0) {
    blockers.push({
      code: "NO_PERMISSIONS",
      cause: "El rol se quedaría sin ningún permiso.",
      owner: "Quien administra los roles",
      resolution: "Marca al menos «Entrar al inicio»: sin él, quien tenga este rol no ve nada al iniciar sesión.",
    });
  }

  const warnings: OperationImpact["warnings"] = [];
  if (couldLockSelf) {
    warnings.push({
      code: "SELF_LOCKOUT",
      message:
        "Estás quitando «Administrar roles y permisos». Si este es tu propio rol, perderás el acceso a esta pantalla y nadie con ese rol podrá devolvértelo.",
    });
  }
  for (const gap of gaps) {
    warnings.push({
      code: `GAP_${gap.manage}`,
      message: `«${permissionLabel(gap.manage)}» sin «${permissionLabel(gap.view)}»: el rol podría gestionar una pantalla a la que no llega.`,
    });
  }

  const impact: OperationImpact = {
    headline: role ? `Cambiar el rol «${role.name}»` : `Crear el rol «${draft.name || "sin nombre"}»`,
    affectedCount: role?.members ?? 0,
    affectedLabel: (role?.members ?? 0) === 1 ? "persona con este rol" : "personas con este rol",
    lines: [
      ...(role && role.name !== draft.name
        ? [{ label: "Nombre", before: role.name, after: draft.name }]
        : []),
      ...(role && role.scope !== draft.scope
        ? [{ label: "Alcance", before: scopeLabels[role.scope], after: scopeLabels[draft.scope] }]
        : []),
      ...diff.added.map((key) => ({
        label: permissionLabel(key),
        before: "No podía",
        after: "Podrá",
      })),
      ...diff.removed.map((key) => ({
        label: permissionLabel(key),
        before: "Podía",
        after: "Dejará de poder",
        adverse: true,
      })),
    ],
    warnings,
    blockers,
    responsible: currentUser.fullName,
    // Cambiar un rol se puede revertir volviendo a editarlo; lo que no se
    // revierte es lo que alguien haga mientras tanto con los permisos nuevos.
    irreversible: false,
  };

  const activeCount = (keys: string[]) => keys.filter((key) => draft.permissions.includes(key)).length;

  const operationState: OperationState = {
    ...initialOperationState(),
    step: "confirm",
    completed: ["select", "record", "review"],
    impact,
    submitting: saving,
  };

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="flex max-h-[92dvh] flex-col overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{role ? `Editar «${role.name}»` : "Nuevo rol"}</DialogTitle>
          <DialogDescription>
            {role && role.members > 0
              ? `${role.members} ${role.members === 1 ? "persona tiene" : "personas tienen"} este rol. Lo que cambies aquí les afecta a todas.`
              : "Define qué puede hacer quien tenga este rol."}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]">
          {reviewing ? (
            <>
              <ImpactReview impact={impact} />
              {gaps.length ? (
                <InlineNote
                  tone="warning"
                  title="Faltan permisos de acceso"
                  action={
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          permissions: Array.from(new Set([...current.permissions, ...gaps.map((gap) => gap.view)])),
                        }))
                      }
                    >
                      Añadir los que faltan
                    </Button>
                  }
                >
                  {gaps.length === 1
                    ? "Hay un permiso de gestión sin su permiso de entrada."
                    : `Hay ${gaps.length} permisos de gestión sin su permiso de entrada.`}
                </InlineNote>
              ) : null}
              {error ? (
                <InlineNote tone="danger" title="No se pudo guardar">
                  {getApiErrorMessage(error, "El servidor rechazó el cambio.")}
                </InlineNote>
              ) : null}
              <ConfirmPanel
                state={operationState}
                operationName={role ? "Guardar los cambios" : "Crear el rol"}
                onConfirm={() => onSave(draft)}
                onBack={() => setReviewing(false)}
                acknowledged={acknowledged}
                onAcknowledgedChange={setAcknowledged}
              />
              {/* El aviso de dejarse fuera no se puede demostrar, así que no
                  bloquea: exige reconocerlo antes de continuar. */}
              {couldLockSelf ? (
                <label
                  className="flex items-start gap-3 rounded-md border border-status-danger/40 bg-status-danger/5 p-4 text-sm text-ink-1"
                  style={{ minHeight: "var(--control-h-touch)" }}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 size-4 accent-[hsl(var(--accent-fill))]"
                    checked={acknowledged}
                    onChange={(event) => setAcknowledged(event.target.checked)}
                  />
                  <span>
                    Entiendo que si este es mi rol perderé el acceso a esta pantalla y necesitaré que otra persona me
                    lo devuelva.
                  </span>
                </label>
              ) : null}
            </>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="role-name">Nombre del rol</Label>
                  <Input
                    id="role-name"
                    value={draft.name}
                    placeholder="Encargado de almacén"
                    onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="role-scope">Alcance</Label>
                  <Select
                    value={draft.scope}
                    onValueChange={(value) =>
                      setDraft((current) => ({ ...current, scope: value as Draft["scope"] }))
                    }
                  >
                    <SelectTrigger id="role-scope">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="module">{scopeLabels.module}</SelectItem>
                      <SelectItem value="tenant">{scopeLabels.tenant}</SelectItem>
                      <SelectItem value="global">{scopeLabels.global}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* El recuento se muestra; antes se pedía teclearlo y luego ni
                  siquiera se enviaba al servidor. */}
              {role ? (
                <p className="text-sm text-ink-2">
                  <span className="font-mono tabular-figures text-ink-1">{role.members}</span>{" "}
                  {role.members === 1 ? "persona tiene" : "personas tienen"} este rol. El recuento lo lleva el
                  servidor.
                </p>
              ) : null}

              <PageSection
                title="Permisos"
                description={`${draft.permissions.length} de ${PERMISSION_KEYS.length} activos.`}
              >
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3"
                    aria-hidden="true"
                  />
                  <label htmlFor="permission-search" className="sr-only">
                    Buscar permiso
                  </label>
                  <Input
                    id="permission-search"
                    type="search"
                    className="pl-9"
                    value={permissionSearch}
                    placeholder="Buscar: contratar, inventario, publicar…"
                    onChange={(event) => setPermissionSearch(event.target.value)}
                  />
                </div>

                {visibleGroups.length === 0 ? (
                  <p className="mt-4 text-sm text-ink-2">Ningún permiso coincide con «{permissionSearch}».</p>
                ) : null}

                <div className="mt-4 space-y-2">
                  {visibleGroups.map((group) => {
                    const active = activeCount(group.keys);
                    return (
                      <details
                        key={group.group}
                        open={Boolean(permissionSearch) || active > 0}
                        className="rounded-md border border-line bg-surface-1"
                      >
                        <summary
                          className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3"
                          style={{ minHeight: "var(--control-h-touch)" }}
                        >
                          <span className="min-w-0 font-medium text-ink-1">{group.label}</span>
                          <span className="shrink-0 font-mono text-2xs tabular-figures text-ink-3">
                            {active} de {group.keys.length}
                          </span>
                        </summary>

                        <div className="border-t border-line px-4 py-2">
                          <div className="flex flex-wrap gap-2 py-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => setGroup(group.keys, true)}
                            >
                              Marcar todo
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setGroup(group.keys, false)}
                            >
                              Quitar todo
                            </Button>
                          </div>

                          <ul className="divide-y divide-line">
                            {group.keys.map((key) => {
                              const info = permissionInfo(key);
                              const checked = draft.permissions.includes(key);
                              return (
                                <li key={key}>
                                  <label
                                    className="flex cursor-pointer items-start gap-3 py-3"
                                    style={{ minHeight: "var(--control-h-touch)" }}
                                  >
                                    <input
                                      type="checkbox"
                                      className="mt-0.5 size-4 shrink-0 accent-[hsl(var(--accent-fill))]"
                                      checked={checked}
                                      onChange={() => toggle(key)}
                                    />
                                    <span className="min-w-0">
                                      <span className="block text-sm font-medium text-ink-1">{info.label}</span>
                                      <span className="mt-0.5 block text-2xs text-ink-3">{info.detail}</span>
                                    </span>
                                  </label>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </details>
                    );
                  })}
                </div>
              </PageSection>
            </>
          )}
        </div>

        {!reviewing ? (
          <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              disabled={blockers.length > 0}
              onClick={() => {
                setAcknowledged(false);
                setReviewing(true);
              }}
            >
              Revisar el impacto
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
