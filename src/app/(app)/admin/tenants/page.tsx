"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import {
  createTenant,
  deleteTenant,
  fetchSubscriptions,
  fetchTenants,
  getApiErrorMessage,
  updateTenant,
} from "@/lib/backend";
import type { ModuleKey, PlanTier, TenantDto } from "@/lib/contracts";
import { ConfirmDeleteDialog } from "@/components/admin-crud";
import { FilterToolbar, matchesSearchAndFilter } from "@/components/domain";
import {
  BlockedState,
  DataView,
  EmptyState,
  ErrorState,
  InlineNote,
  Metric,
  MetricRow,
  PageHeader,
  PageSection,
  SkeletonRows,
  StatusBadge,
  type DataColumn,
} from "@/components/system";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSelect } from "@/components/ui/form-select";
import { moduleLabels } from "@/lib/ui-labels";
import {
  PLAN_TIER_OPTIONS,
  TENANT_STATUS_OPTIONS,
  billingCycleLabel,
  formatDate,
  formatPrice,
  planTierInfo,
  planTierLabel,
  subscriptionStatusInfo,
  tenantStatusChangeWarning,
  tenantStatusInfo,
} from "@/lib/platform-labels";
import { useAppStore } from "@/store/app-store";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { PermissionGate } from "@/components/permission-gate";

/**
 * Empresas suscritas.
 *
 * Es la pantalla con las dos acciones de mayor alcance del producto entero, y
 * ninguna de las dos decía lo que hacía.
 *
 * · **Suspender** cortaba el acceso a todas las personas de una empresa desde
 *   un desplegable de «Estado», guardado con el botón genérico «Guardar
 *   cambios». Ni un aviso. Ahora el cambio de estado se anuncia dentro del
 *   propio formulario, antes de guardar, con las cifras de a cuánta gente
 *   afecta, y el botón deja de ser genérico: dice «Guardar y suspender».
 * · **Eliminar** decía «esta acción es permanente» sin nombrar jamás lo que se
 *   lleva por delante. Ahora enumera sucursales, personas, módulos y
 *   suscripción con las cifras reales de esa empresa.
 *
 * Además: seis sitios imprimían códigos del backend (`starter`, `past_due`,
 * `monthly`), el color de marca por defecto era un hexadecimal escrito a mano
 * y el rótulo del identificador decía «Slug». Los errores del servidor se
 * sustituían por «Error al guardar la empresa», que es exactamente la frase
 * que impide distinguir «ese identificador ya existe» de «no tienes permiso».
 *
 * La tabla pasa a `DataView`: en móvil deja de ser una tabla de siete columnas
 * con desplazamiento horizontal y se convierte en fichas.
 */

const moduleOptions: ModuleKey[] = [
  "dashboard",
  "ats",
  "onboarding",
  "training",
  "productivity",
  "asset_inventory",
  "restaurant_inventory",
  "admin",
  "reports",
  "notifications",
  "profile",
];

/** Sin panel ni perfil no queda ninguna pantalla a la que entrar. */
const REQUIRED_MODULES: ModuleKey[] = ["dashboard", "profile"];

const tenantSchema = z.object({
  name: z.string().min(2, "Escribe el nombre de la empresa."),
  slug: z
    .string()
    .min(2, "El identificador necesita al menos dos caracteres.")
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones: sin espacios ni acentos."),
  plan: z.enum(["starter", "growth", "enterprise"]),
  status: z.enum(["active", "trial", "suspended"]),
  supportEmail: z.email("Escribe un correo válido."),
  accent: z.string().min(4, "Indica el color de marca."),
  enabledModules: z
    .array(z.string())
    .min(1, "Habilita al menos un módulo.")
    .refine((values) => values.every((value) => moduleOptions.includes(value as ModuleKey)), "Módulo desconocido.")
    .refine(
      (values) => REQUIRED_MODULES.every((module) => values.includes(module)),
      "Panel y Perfil no pueden desactivarse: sin ellos nadie puede entrar.",
    ),
});

type TenantFormValues = z.infer<typeof tenantSchema>;

const DEFAULT_MODULES: ModuleKey[] = ["dashboard", "profile", "notifications"];
const DEFAULT_ACCENT = "#0F766E";

export default function TenantsPage() {
  const { can, canAccessGlobalGovernance } = useAppStore();
  const queryClient = useQueryClient();
  const tenantsQuery = useQuery({
    queryKey: ["admin-tenants"],
    queryFn: fetchTenants,
    enabled: canAccessGlobalGovernance,
  });
  const subscriptionsQuery = useQuery({
    queryKey: ["subscriptions"],
    queryFn: fetchSubscriptions,
  });
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TenantDto | null>(null);
  const [deleting, setDeleting] = useState<TenantDto | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState("");

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: "",
      slug: "",
      plan: "starter",
      status: "active",
      supportEmail: "",
      accent: DEFAULT_ACCENT,
      enabledModules: DEFAULT_MODULES,
    },
  });
  useUnsavedChanges(open && form.formState.isDirty, "tenant-form");
  const selectedModules = useWatch({
    control: form.control,
    name: "enabledModules",
    defaultValue: DEFAULT_MODULES,
  });
  const selectedPlan = useWatch({ control: form.control, name: "plan" });
  const selectedStatus = useWatch({ control: form.control, name: "status" });
  const selectedAccent = useWatch({ control: form.control, name: "accent" });

  /**
   * El aviso se calcula contra el estado GUARDADO, no contra el valor inicial
   * del formulario: al crear una empresa nueva no hay ningún acceso que cortar.
   */
  const statusWarning = editing ? tenantStatusChangeWarning(editing.status ?? "active", selectedStatus) : null;
  const suspending = Boolean(statusWarning) && selectedStatus === "suspended";

  const filtered = useMemo(
    () =>
      (tenantsQuery.data ?? []).filter((tenant) =>
        matchesSearchAndFilter([tenant.name, tenant.slug, tenant.plan, tenant.status ?? ""], query, activeFilter),
      ),
    [activeFilter, query, tenantsQuery.data],
  );

  const selectedTenant = filtered.find((tenant) => tenant.id === selectedTenantId) ?? filtered[0] ?? null;
  const selectedSubscription = useMemo(
    () => (subscriptionsQuery.data ?? []).find((subscription) => subscription.tenantId === selectedTenant?.id) ?? null,
    [subscriptionsQuery.data, selectedTenant?.id],
  );
  const deletingSubscription = useMemo(
    () => (subscriptionsQuery.data ?? []).find((subscription) => subscription.tenantId === deleting?.id) ?? null,
    [subscriptionsQuery.data, deleting?.id],
  );

  function startEditing(tenant: TenantDto) {
    setEditing(tenant);
    form.reset({
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan,
      status: tenant.status ?? "active",
      supportEmail: tenant.branding.supportEmail,
      accent: tenant.branding.accent,
      enabledModules: tenant.enabledModules,
    });
    setOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: async (values: TenantFormValues) =>
      editing
        ? updateTenant(editing.id, {
            id: editing.id,
            name: values.name,
            slug: values.slug,
            plan: values.plan,
            status: values.status,
            branding: {
              accent: values.accent,
              supportEmail: values.supportEmail,
            },
            enabledModules: values.enabledModules as ModuleKey[],
          } as Omit<TenantDto, "id">)
        : createTenant({
            name: values.name,
            slug: values.slug,
            plan: values.plan,
            status: values.status,
            branding: {
              accent: values.accent,
              supportEmail: values.supportEmail,
            },
            enabledModules: values.enabledModules as ModuleKey[],
          }),
    onSuccess: (_data, values) => {
      queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      queryClient.invalidateQueries({ queryKey: ["module-assignments"] });
      const wasSuspending = Boolean(editing) && suspending;
      setOpen(false);
      setEditing(null);
      form.reset();
      toast.success(
        wasSuspending
          ? `${values.name} queda suspendida: su gente ya no puede entrar`
          : editing
            ? "Empresa actualizada"
            : "Empresa creada",
      );
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible guardar la empresa.")),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      queryClient.invalidateQueries({ queryKey: ["module-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      const name = deleting?.name ?? "La empresa";
      setDeleting(null);
      toast.success(`${name} y todo su contenido se eliminaron`);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible eliminar la empresa.")),
  });

  if (!can("tenants.view")) {
    return (
      <BlockedState
        title="Sin acceso a las empresas"
        cause="Gestionar empresas suscritas es una tarea de la administración de la plataforma."
        owner="Quien administra la plataforma"
        resolution="Si necesitas consultarlas, pide el permiso «Ver empresas»."
      />
    );
  }

  const tenants = tenantsQuery.data ?? [];
  const subscriptions = subscriptionsQuery.data ?? [];

  const columns: DataColumn<TenantDto>[] = [
    {
      key: "name",
      header: "Empresa",
      priority: "identity",
      sortValue: (tenant) => tenant.name,
      render: (tenant) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-1">{tenant.name}</p>
          <p className="truncate text-2xs text-ink-3">{tenant.slug}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Estado",
      priority: "primary",
      sortValue: (tenant) => tenantStatusInfo(tenant.status ?? "active").label,
      render: (tenant) => {
        const info = tenantStatusInfo(tenant.status ?? "active");
        return <StatusBadge size="sm" tone={info.tone} label={info.label} />;
      },
    },
    {
      key: "plan",
      header: "Plan",
      priority: "primary",
      sortValue: (tenant) => planTierLabel(tenant.plan),
      render: (tenant) => planTierLabel(tenant.plan),
    },
    {
      key: "subscription",
      header: "Suscripción",
      priority: "secondary",
      sortValue: (tenant) => {
        const subscription = subscriptions.find((item) => item.tenantId === tenant.id);
        return subscription ? subscriptionStatusInfo(subscription.status).label : "Sin registro";
      },
      render: (tenant) => {
        const subscription = subscriptions.find((item) => item.tenantId === tenant.id);
        if (!subscription) return <span className="text-ink-3">Sin registro</span>;
        const info = subscriptionStatusInfo(subscription.status);
        return <StatusBadge size="sm" tone={info.tone} label={info.label} />;
      },
    },
    {
      key: "branches",
      header: "Sucursales",
      priority: "secondary",
      numeric: true,
      sortValue: (tenant) => tenant.branchCount ?? 0,
      render: (tenant) => tenant.branchCount ?? 0,
    },
    {
      key: "people",
      header: "Personas",
      priority: "secondary",
      numeric: true,
      sortValue: (tenant) => tenant.employeeCount ?? 0,
      render: (tenant) => tenant.employeeCount ?? 0,
    },
    {
      key: "supportEmail",
      header: "Soporte",
      priority: "detail",
      sortValue: (tenant) => tenant.branding.supportEmail,
      render: (tenant) => <span className="break-all">{tenant.branding.supportEmail}</span>,
    },
  ];


  const hasFilters = Boolean(query) || activeFilter !== "";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gobierno de la plataforma"
        title="Empresas"
        description="Alta, edición y control operativo de las empresas suscritas. Suspender o eliminar una afecta a todas las personas que trabajan dentro."
        actions={
          <PermissionGate permission="tenants.create">
            <Button
              onClick={() => {
                setEditing(null);
                form.reset();
                setOpen(true);
              }}
            >
              Nueva empresa
            </Button>
          </PermissionGate>
        }
      />

      {tenantsQuery.isLoading || subscriptionsQuery.isLoading ? (
        <SkeletonRows rows={6} label="Cargando las empresas" />
      ) : tenantsQuery.isError || subscriptionsQuery.isError ? (
        <ErrorState
          title="No fue posible cargar las empresas"
          detail={getApiErrorMessage(
            tenantsQuery.error ?? subscriptionsQuery.error,
            "Reintenta la consulta para continuar.",
          )}
          onRetry={() => {
            void tenantsQuery.refetch();
            void subscriptionsQuery.refetch();
          }}
        />
      ) : (
        <>
          <MetricRow>
            <Metric label="Empresas" value={String(tenants.length)} />
            <Metric
              label="Suspendidas"
              value={String(tenants.filter((tenant) => tenant.status === "suspended").length)}
              detail="Su gente no puede entrar"
              tone={tenants.some((tenant) => tenant.status === "suspended") ? "warning" : undefined}
            />
            <Metric
              label="Con pago vencido"
              value={String(subscriptions.filter((item) => item.status === "past_due").length)}
              detail="El acceso sigue abierto"
              tone={subscriptions.some((item) => item.status === "past_due") ? "danger" : undefined}
            />
            <Metric
              label="Personas en total"
              value={String(tenants.reduce((total, tenant) => total + (tenant.employeeCount ?? 0), 0))}
            />
          </MetricRow>

          {open ? (
            <PageSection
              boxed
              title={editing ? `Editar ${editing.name}` : "Crear empresa"}
              description={
                editing
                  ? "Los cambios se aplican a toda la empresa en cuanto se guarden."
                  : "La empresa queda creada con el plan y los módulos que marques aquí."
              }
            >
              <form
                id="tenant-form"
                className="space-y-5"
                onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="min-w-0 space-y-2">
                    <Label htmlFor="tenant-name">Nombre de la empresa</Label>
                    <Input id="tenant-name" {...form.register("name")} />
                    {form.formState.errors.name ? (
                      <p className="text-2xs text-status-danger">{form.formState.errors.name.message}</p>
                    ) : null}
                  </div>
                  <div className="min-w-0 space-y-2">
                    <Label htmlFor="tenant-slug">Identificador en la dirección web</Label>
                    <Input id="tenant-slug" placeholder="acme-retail" autoComplete="off" {...form.register("slug")} />
                    <p className="text-2xs text-ink-3">
                      Es lo que aparece en el enlace del portal público. Cambiarlo rompe los enlaces ya compartidos.
                    </p>
                    {form.formState.errors.slug ? (
                      <p className="text-2xs text-status-danger">{form.formState.errors.slug.message}</p>
                    ) : null}
                  </div>
                  <div className="min-w-0 space-y-2">
                    <Label>Plan contratado</Label>
                    <FormSelect
                      value={selectedPlan}
                      onValueChange={(value) => form.setValue("plan", value as PlanTier, { shouldDirty: true })}
                      options={PLAN_TIER_OPTIONS}
                    />
                    <p className="text-2xs text-ink-3">{planTierInfo(selectedPlan).detail}</p>
                  </div>
                  <div className="min-w-0 space-y-2">
                    <Label>Estado</Label>
                    <FormSelect
                      value={selectedStatus}
                      onValueChange={(value) =>
                        form.setValue("status", value as TenantFormValues["status"], { shouldDirty: true })
                      }
                      options={TENANT_STATUS_OPTIONS}
                    />
                    <p className="text-2xs text-ink-3">{tenantStatusInfo(selectedStatus).detail}</p>
                  </div>
                  <div className="min-w-0 space-y-2">
                    <Label htmlFor="tenant-support">Correo de soporte</Label>
                    <Input id="tenant-support" inputMode="email" autoComplete="off" {...form.register("supportEmail")} />
                    {form.formState.errors.supportEmail ? (
                      <p className="text-2xs text-status-danger">{form.formState.errors.supportEmail.message}</p>
                    ) : null}
                  </div>
                  <div className="min-w-0 space-y-2">
                    <Label htmlFor="tenant-accent">Color de marca</Label>
                    <div className="flex min-w-0 items-center gap-2">
                      <input
                        type="color"
                        aria-label="Elegir el color de marca"
                        value={/^#[0-9a-fA-F]{6}$/.test(selectedAccent ?? "") ? selectedAccent : DEFAULT_ACCENT}
                        onChange={(event) => form.setValue("accent", event.target.value, { shouldDirty: true })}
                        className="size-11 shrink-0 cursor-pointer rounded-md border border-line-control bg-surface-1 p-1"
                      />
                      <Input id="tenant-accent" className="min-w-0" autoComplete="off" {...form.register("accent")} />
                    </div>
                    {form.formState.errors.accent ? (
                      <p className="text-2xs text-status-danger">{form.formState.errors.accent.message}</p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Módulos habilitados</Label>
                  <p className="text-2xs text-ink-3">
                    Un módulo apagado desaparece del menú de todas las personas de la empresa. Los datos se conservan y
                    vuelven a estar accesibles si se rehabilita.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {moduleOptions.map((module) => {
                      const enabled = selectedModules.includes(module);
                      const required = REQUIRED_MODULES.includes(module);
                      return (
                        <button
                          key={module}
                          type="button"
                          disabled={required}
                          aria-pressed={enabled}
                          title={required ? "Este módulo no puede desactivarse" : undefined}
                          className={`min-h-[var(--control-h-touch)] rounded-md border px-3 text-sm transition-colors ${
                            enabled
                              ? "border-accent-line bg-accent-fill text-accent-ink"
                              : "border-line bg-surface-2 text-ink-2 hover:border-line-strong"
                          } ${required ? "cursor-not-allowed opacity-70" : ""}`}
                          onClick={() => {
                            const current = form.getValues("enabledModules");
                            form.setValue(
                              "enabledModules",
                              enabled ? current.filter((item) => item !== module) : [...current, module],
                              { shouldDirty: true },
                            );
                          }}
                        >
                          {moduleLabels[module]}
                        </button>
                      );
                    })}
                  </div>
                  {form.formState.errors.enabledModules ? (
                    <p className="text-2xs text-status-danger">{form.formState.errors.enabledModules.message}</p>
                  ) : null}
                </div>

                {statusWarning && editing ? (
                  <InlineNote tone={suspending ? "danger" : "warning"} title={statusWarning.title}>
                    {statusWarning.detail}
                    {(editing.employeeCount ?? 0) > 0 ? (
                      <>
                        {" "}
                        Afecta a {editing.employeeCount} {editing.employeeCount === 1 ? "persona" : "personas"} en{" "}
                        {editing.branchCount ?? 0} {(editing.branchCount ?? 0) === 1 ? "sucursal" : "sucursales"}.
                      </>
                    ) : null}
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
                    variant={suspending ? "destructive" : "default"}
                    loading={saveMutation.isPending}
                    loadingLabel="Guardando…"
                  >
                    {!editing ? "Crear empresa" : suspending ? "Guardar y suspender la empresa" : "Guardar cambios"}
                  </Button>
                </div>
              </form>
            </PageSection>
          ) : null}

          <FilterToolbar
            searchPlaceholder="Buscar por nombre, identificador, plan o estado"
            searchValue={query}
            onSearchChange={setQuery}
            filterValue={activeFilter}
            onFilterChange={setActiveFilter}
            options={[
              { label: "Todas", value: "" },
              { label: "Activas", value: "active" },
              { label: "En prueba", value: "trial" },
              { label: "Suspendidas", value: "suspended" },
            ]}
          />

          {filtered.length === 0 ? (
            <EmptyState
              reason={hasFilters ? "no-matches" : "no-records"}
              title={hasFilters ? "Ninguna empresa coincide" : "Todavía no hay empresas"}
              description={
                hasFilters
                  ? "Prueba con otro texto o quita el filtro de estado."
                  : "Crea la primera empresa o aprueba una solicitud de alta pendiente."
              }
              onClearFilters={
                hasFilters
                  ? () => {
                      setQuery("");
                      setActiveFilter("");
                    }
                  : undefined
              }
            />
          ) : (
            <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,0.8fr)]">
              <div className="min-w-0">
                <DataView
                  caption="Empresas suscritas"
                  rows={filtered}
                  getKey={(tenant) => tenant.id}
                  columns={columns}
                  onRowAction={(tenant) => setSelectedTenantId(tenant.id)}
                  rowActionLabel={(tenant) => `Ver el detalle de ${tenant.name}`}
                  rowActions={(tenant) => (
                    <div className="flex flex-wrap gap-2">
                      <PermissionGate permission="tenants.update">
                        <Button size="sm" variant="secondary" onClick={() => startEditing(tenant)}>
                          Editar
                        </Button>
                      </PermissionGate>
                      <PermissionGate permission="tenants.update">
                        <Button size="sm" variant="destructive" onClick={() => setDeleting(tenant)}>
                          Eliminar
                        </Button>
                      </PermissionGate>
                    </div>
                  )}
                />
              </div>

              {selectedTenant ? (
                <PageSection
                  boxed
                  title={selectedTenant.name}
                  description={selectedTenant.branding.supportEmail}
                  className="min-w-0 self-start"
                >
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge
                        size="sm"
                        tone={tenantStatusInfo(selectedTenant.status ?? "active").tone}
                        label={tenantStatusInfo(selectedTenant.status ?? "active").label}
                      />
                      <StatusBadge size="sm" tone="neutral" label={planTierLabel(selectedTenant.plan)} />
                    </div>

                    <dl className="divide-y divide-line rounded-md border border-line">
                      <div className="flex items-baseline justify-between gap-3 px-4 py-3">
                        <dt className="text-sm text-ink-2">Suscripción</dt>
                        <dd className="text-right text-sm font-medium text-ink-1">
                          {selectedSubscription
                            ? subscriptionStatusInfo(selectedSubscription.status).label
                            : "Sin registro"}
                        </dd>
                      </div>
                      {selectedSubscription ? (
                        <>
                          <div className="flex items-baseline justify-between gap-3 px-4 py-3">
                            <dt className="text-sm text-ink-2">Cobro</dt>
                            <dd className="text-right text-sm font-medium text-ink-1">
                              {formatPrice(selectedSubscription.price)} ·{" "}
                              {billingCycleLabel(selectedSubscription.billingCycle)}
                            </dd>
                          </div>
                          <div className="flex items-baseline justify-between gap-3 px-4 py-3">
                            <dt className="text-sm text-ink-2">Próxima renovación</dt>
                            <dd className="text-right text-sm font-medium text-ink-1">
                              {formatDate(selectedSubscription.renewalDate)}
                            </dd>
                          </div>
                        </>
                      ) : null}
                      <div className="flex items-baseline justify-between gap-3 px-4 py-3">
                        <dt className="text-sm text-ink-2">Sucursales</dt>
                        <dd className="text-right text-sm font-medium text-ink-1">{selectedTenant.branchCount ?? 0}</dd>
                      </div>
                      <div className="flex items-baseline justify-between gap-3 px-4 py-3">
                        <dt className="text-sm text-ink-2">Personas</dt>
                        <dd className="text-right text-sm font-medium text-ink-1">
                          {selectedTenant.employeeCount ?? 0}
                        </dd>
                      </div>
                    </dl>

                    <div>
                      <p className="mb-2 text-2xs text-ink-3">
                        {selectedTenant.enabledModules.length} módulos habilitados
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedTenant.enabledModules.map((module) => (
                          <span
                            key={module}
                            className="rounded-md border border-line bg-surface-2 px-2 py-1 text-2xs text-ink-2"
                          >
                            {moduleLabels[module]}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </PageSection>
              ) : null}
            </div>
          )}
        </>
      )}

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(next) => !next && setDeleting(null)}
        title={deleting ? `¿Eliminar ${deleting.name}?` : "Eliminar empresa"}
        description="El borrado arrastra todo lo que cuelga de esta empresa. No hay papelera ni forma de recuperarlo."
        confirmLabel="Eliminar la empresa y su contenido"
        pending={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        consequences={
          deleting ? (
            <ul className="list-disc space-y-1 pl-5">
              <li>
                {deleting.branchCount ?? 0} {(deleting.branchCount ?? 0) === 1 ? "sucursal" : "sucursales"} con su
                configuración.
              </li>
              <li>
                {deleting.employeeCount ?? 0} {(deleting.employeeCount ?? 0) === 1 ? "persona" : "personas"} y sus
                accesos: dejarán de poder entrar de inmediato.
              </li>
              <li>{deleting.enabledModules.length} módulos asignados y los datos registrados dentro de ellos.</li>
              <li>
                {deletingSubscription
                  ? `Su suscripción (${subscriptionStatusInfo(deletingSubscription.status).label}, ${formatPrice(
                      deletingSubscription.price,
                    )} ${billingCycleLabel(deletingSubscription.billingCycle).toLocaleLowerCase("es")}).`
                  : "No tiene suscripción registrada."}
              </li>
            </ul>
          ) : null
        }
      />
    </div>
  );
}
