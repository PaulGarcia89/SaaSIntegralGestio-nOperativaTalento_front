"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { createTenant, deleteTenant, fetchSubscriptions, fetchTenants, updateTenant } from "@/lib/backend";
import type { ModuleKey, PlanTier, TenantDto } from "@/lib/contracts";
import { CrudHeader, CrudPanel } from "@/components/admin-crud";
import { DomainTable, FilterToolbar, StateCard, matchesSearchAndFilter } from "@/components/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FormSelect } from "@/components/ui/form-select";
import { moduleLabels, tenantStatusLabels } from "@/lib/ui-labels";
import { useAppStore } from "@/store/app-store";
import { InfoList, SectionCard } from "@/components/ui";
import { AsyncState } from "@/components/async-state";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { PermissionGate } from "@/components/permission-gate";

const moduleOptions: ModuleKey[] = [
  "dashboard",
  "ats",
  "onboarding",
  "training",
  "productivity",
  "inventory",
  "admin",
  "reports",
  "notifications",
  "profile",
];

const tenantSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  plan: z.enum(["starter", "growth", "enterprise"]),
  status: z.enum(["active", "trial", "suspended"]),
  supportEmail: z.email(),
  accent: z.string().min(4),
  enabledModules: z
    .array(z.string())
    .min(1)
    .refine((values) => values.every((value) => moduleOptions.includes(value as ModuleKey))),
});

type TenantFormValues = z.infer<typeof tenantSchema>;

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
      accent: "#0EA5B7",
      enabledModules: ["dashboard", "profile", "notifications"],
    },
  });
  useUnsavedChanges(open && form.formState.isDirty, "tenant-form");
  const selectedModules = useWatch({
    control: form.control,
    name: "enabledModules",
    defaultValue: ["dashboard", "profile", "notifications"],
  });
  const selectedPlan = useWatch({ control: form.control, name: "plan" });
  const selectedStatus = useWatch({ control: form.control, name: "status" });

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setOpen(false);
      setEditing(null);
      form.reset();
      toast.success(editing ? "Empresa actualizada" : "Empresa creada");
    },
    onError: () => toast.error("Error al guardar la empresa"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      queryClient.invalidateQueries({ queryKey: ["module-assignments"] });
      setDeleting(null);
      toast.success("Empresa eliminada");
    },
    onError: () => toast.error("Error al eliminar la empresa"),
  });

  if (!can("tenants.view")) {
    return (
      <StateCard
        tone="restricted"
        title="Sin acceso a empresas"
        description="Solo perfiles de administración superior pueden gestionar empresas suscritas."
      />
    );
  }

  if (tenantsQuery.isLoading || subscriptionsQuery.isLoading) return <AsyncState state="loading" title="Cargando empresas" />;
  if (tenantsQuery.isError || subscriptionsQuery.isError) return <AsyncState state="error" title="No fue posible cargar las empresas" onRetry={() => { void tenantsQuery.refetch(); void subscriptionsQuery.refetch(); }} />;

  return (
    <div className="space-y-5">
      <CrudHeader
        title="Gestión de empresas"
        description="Alta, edicion y control operativo de empresas."
        badge="Gobierno SaaS"
        action={
          <PermissionGate permission="tenants.create">
            <Button onClick={() => setOpen(true)}>Nueva empresa</Button>
          </PermissionGate>
        }
      />
      {open ? (
        <Card level={2}>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">{editing ? "Editar empresa" : "Crear empresa"}</h2>
              <p className="text-sm text-text-secondary">Configura la compañía y sus módulos habilitados sin ventanas emergentes.</p>
            </div>
            <form id="tenant-form" className="space-y-4" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input {...form.register("name")} />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input {...form.register("slug")} />
                </div>
                <div className="space-y-2">
                  <Label>Plan</Label>
                  <FormSelect
                    className="h-11 rounded-2xl"
                    value={selectedPlan}
                    onValueChange={(v) => form.setValue("plan", v as "starter" | "growth" | "enterprise")}
                    options={(["starter", "growth", "enterprise"] as PlanTier[]).map((plan) => ({ label: plan, value: plan }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <FormSelect
                    className="h-11 rounded-2xl"
                    value={selectedStatus}
                    onValueChange={(v) => form.setValue("status", v as "active" | "trial" | "suspended")}
                    options={[
                      { label: "activo", value: "active" },
                      { label: "prueba", value: "trial" },
                      { label: "suspendido", value: "suspended" },
                    ]}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email soporte</Label>
                  <Input {...form.register("supportEmail")} />
                </div>
                <div className="space-y-2">
                  <Label>Color de marca</Label>
                  <Input {...form.register("accent")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Módulos habilitados</Label>
                <div className="flex flex-wrap gap-2">
                  {moduleOptions.map((module) => {
                    const enabled = selectedModules.includes(module);
                    return (
                      <button
                        key={module}
                        type="button"
                        className={`rounded-full border px-3 py-1 text-sm ${enabled ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                        onClick={() => {
                          const current = form.getValues("enabledModules");
                          form.setValue(
                            "enabledModules",
                            enabled ? current.filter((item) => item !== module) : [...current, module],
                          );
                        }}
                      >
                        {moduleLabels[module]}
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
                  {saveMutation.isPending ? "Guardando..." : editing ? "Guardar cambios" : "Crear empresa"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <FilterToolbar
        searchPlaceholder="Buscar empresa, plan o estado"
        options={[
          { label: "Todos", value: "" },
          { label: "Activos", value: "active" },
          { label: "Prueba", value: "trial" },
          { label: "Empresarial", value: "enterprise" },
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
            title="No hay empresas visibles"
            description="Ajusta el filtro o crea una nueva empresa para comenzar."
          />
        </CrudPanel>
      ) : (
        <div className="grid gap-x-6 gap-y-8 2xl:gap-x-8 xl:grid-cols-[minmax(0,2fr)_minmax(320px,0.72fr)]">
          <CrudPanel>
            <DomainTable
              data={filtered}
              getKey={(tenant) => tenant.id}
              exportable
              tableClassName="table-fixed text-[13px] [&_th]:px-2.5 [&_td]:px-2.5"
              columns={[
                {
                  key: "name",
                  header: "Empresa",
                  render: (tenant) => tenant.name,
                  sortable: true,
                  headerClassName: "w-[15%]",
                  cellClassName: "break-words",
                },
                {
                  key: "slug",
                  header: "Slug",
                  render: (tenant) => tenant.slug,
                  sortable: true,
                  headerClassName: "w-[14%]",
                  cellClassName: "break-words",
                },
                {
                  key: "plan",
                  header: "Plan",
                  render: (tenant) => tenant.plan,
                  sortable: true,
                  headerClassName: "w-[9%]",
                },
                {
                  key: "branches",
                  header: "Sucursales",
                  sortable: true,
                  render: (tenant) => tenant.branchCount ?? 0,
                  headerClassName: "w-[9%]",
                },
                {
                  key: "subscription",
                  header: "Suscripción",
                  sortable: true,
                  render: (tenant) =>
                    (subscriptionsQuery.data ?? []).find((subscription) => subscription.tenantId === tenant.id)?.status ?? "Sin registro",
                  headerClassName: "w-[11%]",
                },
                {
                  key: "supportEmail",
                  header: "Soporte",
                  render: (tenant) => tenant.branding.supportEmail,
                  headerClassName: "w-[21%]",
                  cellClassName: "break-all",
                },
                {
                  key: "actions",
                  header: "Acciones",
                  headerClassName: "w-[21%]",
                  render: (tenant) => (
                    <div className="flex flex-wrap justify-end gap-2">
                      <PermissionGate permission="tenants.update"><Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
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
                        }}
                      >
                        Editar
                      </Button></PermissionGate>
                      <PermissionGate permission="tenants.update"><Button size="sm" variant="destructive" onClick={() => setDeleting(tenant)}>
                        Eliminar
                      </Button></PermissionGate>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSelectedTenantId(tenant.id)}
                      >
                        Ver detalle
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          </CrudPanel>

          {selectedTenant ? (
            <SectionCard title={selectedTenant.name} subtitle="Detalle de empresa" className="self-start">
              <div className="space-y-4">
                <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Resumen</p>
                      <h3 className="text-xl font-semibold tracking-tight text-foreground">{selectedTenant.name}</h3>
                      <p className="text-xs text-muted-foreground">{selectedTenant.slug} · {selectedTenant.branding.supportEmail}</p>
                    </div>
                    <Badge variant="secondary">{tenantStatusLabels[selectedTenant.status ?? "active"]}</Badge>
                  </div>
                </div>

                <InfoList
                  items={[
                    { title: "Plan", description: selectedSubscription?.plan ?? selectedTenant.plan, badge: selectedSubscription?.billingCycle === "annual" ? "Anual" : "Mensual" },
                    { title: "Suscripción", description: selectedSubscription?.status ?? "Sin suscripción", badge: selectedSubscription?.renewalDate ?? "Pendiente" },
                    { title: "Sucursales", description: `${selectedTenant.branchCount ?? 0} registradas`, badge: `${selectedTenant.employeeCount ?? 0} personas` },
                    { title: "Módulos", description: `${selectedTenant.enabledModules.length} activos`, badge: selectedTenant.plan },
                  ]}
                />

                <div className="flex flex-wrap gap-2">
                  {selectedTenant.enabledModules.slice(0, 6).map((module) => (
                    <Badge key={module} variant="outline" className="rounded-full">
                      {moduleLabels[module]}
                    </Badge>
                  ))}
                  {selectedTenant.enabledModules.length > 6 ? (
                    <Badge variant="outline" className="rounded-full">
                      +{selectedTenant.enabledModules.length - 6}
                    </Badge>
                  ) : null}
                </div>

              </div>
            </SectionCard>
          ) : null}
        </div>
      )}

      {deleting ? (
        <Card level={2}>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Eliminar empresa</h2>
              <p className="text-sm text-text-secondary">Se eliminará {deleting.name}.</p>
            </div>
            <div className="rounded-2xl border border-status-danger/20 bg-status-danger/5 px-4 py-3 text-sm leading-6 text-text-secondary">
              Esta acción es permanente. No podrás recuperar este registro una vez eliminado.
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setDeleting(null)} disabled={deleteMutation.isPending}>
                Cancelar
              </Button>
              <Button type="button" variant="destructive" onClick={() => deleteMutation.mutate(deleting.id)} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? "Eliminando..." : "Eliminar definitivamente"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
