"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import type { PlanTier, SubscriptionDto } from "@/lib/contracts";
import { createSubscription, deleteSubscription, fetchPlanCatalog, fetchSubscriptions, fetchTenants, updateSubscription } from "@/lib/backend";
import { CrudHeader, CrudPanel, ConfirmDeleteDialog, FormDialog } from "@/components/admin-crud";
import { DomainTable, FilterToolbar, StateCard, matchesSearchAndFilter } from "@/components/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { tenantStatusLabels } from "@/lib/ui-labels";
import { FormSelect } from "@/components/ui/form-select";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { useAppStore } from "@/store/app-store";
import { Badge } from "@/components/ui/badge";
import { InfoList, SectionCard } from "@/components/ui";
import { moduleLabels } from "@/lib/ui-labels";
import { AsyncState } from "@/components/async-state";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

const subscriptionSchema = z.object({
  tenantId: z.string().min(1),
  plan: z.enum(["starter", "growth", "enterprise"]),
  billingCycle: z.enum(["monthly", "annual"]),
  status: z.enum(["active", "trial", "past_due"]),
  price: z.coerce.number().min(0),
  renewalDate: z.string().min(4),
});

type SubscriptionFormValues = z.output<typeof subscriptionSchema>;
type SubscriptionFormInput = z.input<typeof subscriptionSchema>;

export default function SubscriptionPage() {
  const { can } = useAppStore();
  const queryClient = useQueryClient();
  const tenantsQuery = useQuery({ queryKey: ["admin-tenants"], queryFn: fetchTenants });
  const subscriptionsQuery = useQuery({ queryKey: ["subscriptions"], queryFn: fetchSubscriptions });
  const plansQuery = useQuery({ queryKey: ["plan-catalog"], queryFn: fetchPlanCatalog });
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionDto | null>(null);
  const [deleting, setDeleting] = useState<SubscriptionDto | null>(null);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState("");

  const form = useForm<SubscriptionFormInput, unknown, SubscriptionFormValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      tenantId: "",
      plan: "starter",
      billingCycle: "monthly",
      status: "active",
      price: 0,
      renewalDate: "2026-08-01",
    },
  });
  useUnsavedChanges(open && form.formState.isDirty, "subscription-form");
  const formValues = useWatch({ control: form.control });
  const selectedPlan = plansQuery.data?.find((plan) =>
    (formValues.plan === "starter" && plan.code === "BASIC") ||
    (formValues.plan === "growth" && plan.code === "PRO") ||
    (formValues.plan === "enterprise" && plan.code === "ENTERPRISE"),
  );
  const catalogPrice = formValues.billingCycle === "annual"
    ? selectedPlan?.priceYearly ?? 0
    : selectedPlan?.priceMonthly ?? 0;

  const filtered = useMemo(
    () =>
      (subscriptionsQuery.data ?? []).filter((subscription) =>
        matchesSearchAndFilter([
          subscription.plan,
          subscription.billingCycle,
          subscription.status,
          tenantsQuery.data?.find((tenant) => tenant.id === subscription.tenantId)?.name ?? "",
        ], query, activeFilter),
      ),
    [activeFilter, query, subscriptionsQuery.data, tenantsQuery.data],
  );

  const selectedSubscription =
    filtered.find((subscription) => subscription.id === selectedSubscriptionId) ?? filtered[0] ?? null;
  const selectedTenant = tenantsQuery.data?.find((tenant) => tenant.id === selectedSubscription?.tenantId) ?? null;

  const saveMutation = useMutation({
    mutationFn: (values: SubscriptionFormValues) =>
      editing ? updateSubscription(editing.id, values) : createSubscription(values),
    onSuccess: () => {
      toast.success(editing ? "Suscripción actualizada" : "Suscripción creada");
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      setOpen(false);
      setEditing(null);
      form.reset();
    },
    onError: () => toast.error("Error al guardar la suscripción"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSubscription,
    onSuccess: () => {
      toast.success("Suscripción eliminada");
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      setDeleting(null);
    },
    onError: () => toast.error("Error al eliminar la suscripción"),
  });

  if (!can("admin.subscription")) {
    return (
      <StateCard
        tone="restricted"
        title="Sin acceso a suscripciones"
        description="El rol actual no puede gestionar planes, ciclos ni renovaciones."
      />
    );
  }

  if (subscriptionsQuery.isLoading || tenantsQuery.isLoading || plansQuery.isLoading) return <AsyncState state="loading" title="Cargando suscripciones" />;
  if (subscriptionsQuery.isError || tenantsQuery.isError || plansQuery.isError) return <AsyncState state="error" title="No fue posible cargar las suscripciones" onRetry={() => { void subscriptionsQuery.refetch(); void tenantsQuery.refetch(); void plansQuery.refetch(); }} />;

  return (
    <div className="space-y-5">
      <CrudHeader
        title="Gestión de suscripciones"
        description="Control de plan, ciclo, precio y renovación."
        badge="Gobierno SaaS"
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
            title={editing ? "Editar suscripción" : "Crear suscripción"}
            trigger={<Button onClick={() => {
              form.reset({
                tenantId: tenantsQuery.data?.[0]?.id ?? "",
                plan: "starter",
                billingCycle: "monthly",
                status: "active",
                price: 0,
                renewalDate: "2026-08-01",
              });
              setOpen(true);
            }}>Nueva suscripción</Button>}
          >
            <form id="subscription-form" className="space-y-4" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}>
              <div className="space-y-2">
                <Label>Empresa</Label>
                <FormSelect
                  className="h-11 w-full rounded-2xl"
                  placeholder="Selecciona empresa"
                  value={formValues.tenantId}
                  onValueChange={(v) => form.setValue("tenantId", v)}
                  options={(tenantsQuery.data ?? []).map((tenant) => ({ label: tenant.name, value: tenant.id }))}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Plan</Label>
                  <FormSelect
                    className="h-11 w-full rounded-2xl"
                    value={formValues.plan}
                    onValueChange={(v) => form.setValue("plan", v as "starter" | "growth" | "enterprise")}
                    options={(["starter", "growth", "enterprise"] as PlanTier[]).map((plan) => ({ label: plan, value: plan }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ciclo</Label>
                  <FormSelect
                    className="h-11 w-full rounded-2xl"
                    value={formValues.billingCycle}
                    onValueChange={(v) => form.setValue("billingCycle", v as "monthly" | "annual")}
                    options={[
                      { label: "mensual", value: "monthly" },
                      { label: "anual", value: "annual" },
                    ]}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <FormSelect
                    className="h-11 w-full rounded-2xl"
                    value={formValues.status}
                    onValueChange={(v) => form.setValue("status", v as "active" | "trial" | "past_due")}
                    options={[
                      { label: "activa", value: "active" },
                      { label: "prueba", value: "trial" },
                      { label: "vencida", value: "past_due" },
                    ]}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Precio del catálogo</Label>
                  <Input type="number" value={catalogPrice} readOnly aria-describedby="catalog-price-help" />
                  <p id="catalog-price-help" className="text-xs text-text-secondary">Se obtiene del plan y ciclo seleccionados.</p>
                </div>
              </div>
              <DatePicker
                label="Renovacion"
                value={formValues.renewalDate}
                onChange={(v) => form.setValue("renewalDate", v)}
              />
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
        searchPlaceholder="Buscar empresa, plan o estado"
        options={[
          { label: "Todas", value: "" },
          { label: "Activas", value: "active" },
          { label: "Prueba", value: "trial" },
          { label: "Anual", value: "annual" },
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
            title="No hay suscripciones visibles"
            description="Ajusta el filtro o crea una suscripción para comenzar."
          />
        </CrudPanel>
      ) : (
        <div className="grid gap-x-6 gap-y-8 2xl:gap-x-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">
          <CrudPanel>
            <DomainTable exportable
              data={filtered}
              getKey={(subscription) => subscription.id}
              onSelect={(subscription) => setSelectedSubscriptionId(subscription.id)}
              columns={[
                {
                  key: "tenant",
                  header: "Empresa",
                  sortable: true,
                  render: (subscription) =>
                    tenantsQuery.data?.find((tenant) => tenant.id === subscription.tenantId)?.name ??
                    subscription.tenantId,
                },
                { key: "plan", header: "Plan", sortable: true, render: (subscription) => subscription.plan },
                {
                  key: "branches",
                  header: "Sucursales",
                  sortable: true,
                  render: (subscription) =>
                    tenantsQuery.data?.find((tenant) => tenant.id === subscription.tenantId)?.branchCount ?? 0,
                },
                {
                  key: "cycle",
                  header: "Ciclo",
                  sortable: true,
                  render: (subscription) => (subscription.billingCycle === "monthly" ? "Mensual" : "Anual"),
                },
                {
                  key: "status",
                  header: "Estado",
                  sortable: true,
                  render: (subscription) =>
                    subscription.status === "past_due"
                      ? "Vencida"
                      : tenantStatusLabels[subscription.status],
                },
                { key: "price", header: "Precio", sortable: true, render: (subscription) => `$${subscription.price}` },
                {
                  key: "actions",
                  header: "Acciones",
                  render: (subscription) => (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditing(subscription);
                          form.reset(subscription);
                          setOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setDeleting(subscription)}>
                        Eliminar
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          </CrudPanel>

          {selectedSubscription ? (
            <SectionCard title={selectedTenant?.name ?? "Suscripción"} subtitle="Detalle de suscripción" className="self-start">
              <div className="space-y-4">
                <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Cobertura</p>
                    <h3 className="text-xl font-semibold tracking-tight text-foreground">{selectedSubscription.plan}</h3>
                    <p className="text-xs text-muted-foreground">{selectedTenant?.branding.supportEmail ?? "Sin correo"} · {selectedSubscription.renewalDate}</p>
                  </div>
                </div>

                <InfoList
                  items={[
                    { title: "Empresa", description: selectedTenant?.name ?? "Sin empresa", badge: selectedTenant?.status ?? "Sin estado" },
                    { title: "Ciclo", description: selectedSubscription.billingCycle === "monthly" ? "Mensual" : "Anual", badge: `$${selectedSubscription.price}` },
                    { title: "Cobertura", description: `${selectedTenant?.branchCount ?? 0} sucursales`, badge: `${selectedTenant?.employeeCount ?? 0} personas` },
                    { title: "Estado", description: selectedSubscription.status === "past_due" ? "Vencida" : tenantStatusLabels[selectedSubscription.status], badge: selectedTenant?.plan ?? selectedSubscription.plan },
                  ]}
                />

                <div className="flex flex-wrap gap-2">
                  {(selectedTenant?.enabledModules ?? []).slice(0, 6).map((module) => (
                    <Badge key={module} variant="outline" className="rounded-full">
                      {moduleLabels[module]}
                    </Badge>
                  ))}
                  {(selectedTenant?.enabledModules.length ?? 0) > 6 ? (
                    <Badge variant="outline" className="rounded-full">
                      +{(selectedTenant?.enabledModules.length ?? 0) - 6}
                    </Badge>
                  ) : null}
                </div>

              </div>
            </SectionCard>
          ) : null}
        </div>
      )}
      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(value) => !value && setDeleting(null)}
        title="Eliminar suscripción"
        description={`Se eliminara la suscripción ${deleting?.id ?? ""}.`}
        pending={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}
