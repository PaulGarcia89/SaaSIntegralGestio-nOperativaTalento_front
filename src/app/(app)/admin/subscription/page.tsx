"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import type { PlanTier, SubscriptionDto } from "@/lib/contracts";
import {
  createSubscription,
  deleteSubscription,
  fetchPlanCatalog,
  fetchSubscriptions,
  fetchTenants,
  getApiErrorMessage,
  updateSubscription,
} from "@/lib/backend";
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
  WarningList,
} from "@/components/system";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSelect } from "@/components/ui/form-select";
import { DatePicker } from "@/components/ui/date-picker";
import { moduleLabels } from "@/lib/ui-labels";
import {
  PLAN_TIER_OPTIONS,
  billingCycleLabel,
  defaultRenewalDate,
  formatDate,
  formatPrice,
  planCatalogCode,
  planLimitBreaches,
  planTierLabel,
  shortId,
  subscriptionStatusInfo,
  tenantStatusInfo,
} from "@/lib/platform-labels";
import { useAppStore } from "@/store/app-store";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

/**
 * Suscripciones de las empresas.
 *
 * El defecto grave era funcional, no visual: **el precio que la pantalla
 * mostraba no era el que se guardaba.** El campo «Precio del catálogo» era de
 * solo lectura y se calculaba a partir del plan y el ciclo, pero nunca se
 * escribía en el formulario: `price` se quedaba con el valor por defecto (0)
 * al crear. Es decir, se creaba una suscripción de 0 mientras en pantalla se
 * leía el precio real del plan. Ahora el precio del catálogo se escribe en el
 * formulario en cuanto cambia el plan o el ciclo, y lo que se ve es lo que se
 * guarda.
 *
 * El resto:
 * · La fecha de renovación por defecto era la cadena fija «2026-08-01»,
 *   escrita a mano en dos sitios. Ahora se calcula desde hoy según el ciclo.
 * · El diálogo de borrado decía «Se eliminará la suscripción
 *   3f2a91c4-…-8e1b»: el UUID en la frase que sostiene la decisión.
 * · El precio se imprimía como `$49` sin separadores ni moneda.
 * · Los estados de la suscripción se traducían con el diccionario de estados
 *   de EMPRESA, parcheando `past_due` con un ternario. Son dos vocabularios
 *   distintos: una empresa activa puede tener el pago vencido.
 * · La correspondencia plan → catálogo (`starter`→`BASIC`) vivía dentro de un
 *   `find` de tres condiciones.
 * · «Renovacion» sin tilde, y los desplegables en minúscula.
 * · Los errores del servidor se sustituían por un mensaje genérico.
 *
 * Y una revisión que no existía: bajar de plan a una empresa que ya está por
 * encima de los topes del plan nuevo ahora se avisa con las cifras.
 */

const subscriptionSchema = z.object({
  tenantId: z.string().min(1, "Elige la empresa."),
  plan: z.enum(["starter", "growth", "enterprise"]),
  billingCycle: z.enum(["monthly", "annual"]),
  status: z.enum(["active", "trial", "past_due"]),
  price: z.coerce.number().min(0),
  renewalDate: z.string().min(4, "Indica la fecha de renovación."),
});

type SubscriptionFormValues = z.output<typeof subscriptionSchema>;
type SubscriptionFormInput = z.input<typeof subscriptionSchema>;

const CYCLE_OPTIONS = [
  { label: "Mensual", value: "monthly" },
  { label: "Anual", value: "annual" },
];

const STATUS_OPTIONS = (["active", "trial", "past_due"] as const).map((value) => ({
  value,
  label: subscriptionStatusInfo(value).label,
}));

export default function SubscriptionPage() {
  const { can, canAccessGlobalGovernance } = useAppStore();
  const queryClient = useQueryClient();
  const tenantsQuery = useQuery({
    queryKey: ["admin-tenants"],
    queryFn: fetchTenants,
    enabled: canAccessGlobalGovernance,
  });
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
      renewalDate: defaultRenewalDate("monthly"),
    },
  });
  useUnsavedChanges(open && form.formState.isDirty, "subscription-form");
  const formValues = useWatch({ control: form.control });

  const catalogPlan = plansQuery.data?.find((plan) => plan.code === planCatalogCode(formValues.plan));
  const catalogPrice =
    formValues.billingCycle === "annual" ? (catalogPlan?.priceYearly ?? 0) : (catalogPlan?.priceMonthly ?? 0);

  const formTenant = tenantsQuery.data?.find((tenant) => tenant.id === formValues.tenantId) ?? null;
  const breaches = planLimitBreaches(catalogPlan?.limits, {
    employeeCount: formTenant?.employeeCount,
    branchCount: formTenant?.branchCount,
  });

  /**
   * El precio de catálogo se escribe en el formulario en el momento de
   * cambiar plan o ciclo. Antes solo se PINTABA, y lo que viajaba al servidor
   * era otra cosa.
   */
  function applyPlan(plan: PlanTier) {
    form.setValue("plan", plan, { shouldDirty: true });
    const nextCatalog = plansQuery.data?.find((item) => item.code === planCatalogCode(plan));
    const price = formValues.billingCycle === "annual" ? nextCatalog?.priceYearly : nextCatalog?.priceMonthly;
    form.setValue("price", price ?? 0, { shouldDirty: true });
  }

  function applyCycle(cycle: "monthly" | "annual") {
    form.setValue("billingCycle", cycle, { shouldDirty: true });
    const price = cycle === "annual" ? catalogPlan?.priceYearly : catalogPlan?.priceMonthly;
    form.setValue("price", price ?? 0, { shouldDirty: true });
    // Al crear, la fecha sigue al ciclo; al editar se respeta la pactada.
    if (!editing) form.setValue("renewalDate", defaultRenewalDate(cycle), { shouldDirty: true });
  }

  const filtered = useMemo(
    () =>
      (subscriptionsQuery.data ?? []).filter((subscription) =>
        matchesSearchAndFilter(
          [
            subscription.plan,
            subscription.billingCycle,
            subscription.status,
            tenantsQuery.data?.find((tenant) => tenant.id === subscription.tenantId)?.name ?? "",
          ],
          query,
          activeFilter,
        ),
      ),
    [activeFilter, query, subscriptionsQuery.data, tenantsQuery.data],
  );

  const selectedSubscription =
    filtered.find((subscription) => subscription.id === selectedSubscriptionId) ?? filtered[0] ?? null;
  const selectedTenant = tenantsQuery.data?.find((tenant) => tenant.id === selectedSubscription?.tenantId) ?? null;
  const deletingTenant = tenantsQuery.data?.find((tenant) => tenant.id === deleting?.tenantId) ?? null;

  const saveMutation = useMutation({
    mutationFn: (values: SubscriptionFormValues) =>
      editing ? updateSubscription(editing.id, values) : createSubscription(values),
    onSuccess: () => {
      toast.success(editing ? "Suscripción actualizada" : "Suscripción creada");
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
      setOpen(false);
      setEditing(null);
      form.reset();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible guardar la suscripción.")),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSubscription,
    onSuccess: () => {
      const name = deletingTenant?.name ?? "La empresa";
      toast.success(`${name} se queda sin suscripción registrada`);
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      setDeleting(null);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible eliminar la suscripción.")),
  });

  if (!can("admin.subscription")) {
    return (
      <BlockedState
        title="Sin acceso a las suscripciones"
        cause="Gestionar planes, ciclos y renovaciones es una tarea de la administración de la plataforma."
        owner="Quien administra la plataforma"
        resolution="Si necesitas consultarlas, pide el permiso «Administrar suscripciones»."
      />
    );
  }

  const subscriptions = subscriptionsQuery.data ?? [];

  function tenantName(tenantId: string) {
    return tenantsQuery.data?.find((tenant) => tenant.id === tenantId)?.name ?? `Empresa sin cargar (${shortId(tenantId)})`;
  }

  function startCreating() {
    setEditing(null);
    const firstTenant = tenantsQuery.data?.[0];
    const starterCatalog = plansQuery.data?.find((plan) => plan.code === "BASIC");
    form.reset({
      tenantId: firstTenant?.id ?? "",
      plan: "starter",
      billingCycle: "monthly",
      status: "active",
      price: starterCatalog?.priceMonthly ?? 0,
      renewalDate: defaultRenewalDate("monthly"),
    });
    setOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gobierno de la plataforma"
        title="Suscripciones"
        description="Plan, ciclo de cobro, precio y fecha de renovación de cada empresa. El precio que se guarda es el del catálogo del plan elegido."
        actions={<Button onClick={startCreating}>Nueva suscripción</Button>}
      />

      {subscriptionsQuery.isLoading || tenantsQuery.isLoading || plansQuery.isLoading ? (
        <SkeletonRows rows={6} label="Cargando las suscripciones" />
      ) : subscriptionsQuery.isError || tenantsQuery.isError || plansQuery.isError ? (
        <ErrorState
          title="No fue posible cargar las suscripciones"
          detail={getApiErrorMessage(
            subscriptionsQuery.error ?? tenantsQuery.error ?? plansQuery.error,
            "Reintenta la consulta para continuar.",
          )}
          onRetry={() => {
            void subscriptionsQuery.refetch();
            void tenantsQuery.refetch();
            void plansQuery.refetch();
          }}
        />
      ) : (
        <>
          <MetricRow>
            <Metric label="Suscripciones" value={String(subscriptions.length)} />
            <Metric
              label="Al día"
              value={String(subscriptions.filter((item) => item.status === "active").length)}
              tone="success"
            />
            <Metric
              label="Con pago vencido"
              value={String(subscriptions.filter((item) => item.status === "past_due").length)}
              detail="El acceso sigue abierto"
              tone={subscriptions.some((item) => item.status === "past_due") ? "danger" : undefined}
            />
            <Metric
              label="Empresas sin suscripción"
              value={String(
                (tenantsQuery.data ?? []).filter(
                  (tenant) => !subscriptions.some((item) => item.tenantId === tenant.id),
                ).length,
              )}
            />
          </MetricRow>

          {open ? (
            <PageSection
              boxed
              title={editing ? `Editar la suscripción de ${tenantName(editing.tenantId)}` : "Nueva suscripción"}
              description="El precio lo fija el catálogo del plan y del ciclo elegidos: no se escribe a mano."
            >
              <form
                id="subscription-form"
                className="space-y-5"
                onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="min-w-0 space-y-2 md:col-span-2">
                    <Label>Empresa</Label>
                    <FormSelect
                      placeholder="Selecciona la empresa"
                      value={formValues.tenantId}
                      onValueChange={(value) => form.setValue("tenantId", value, { shouldDirty: true })}
                      options={(tenantsQuery.data ?? []).map((tenant) => ({ label: tenant.name, value: tenant.id }))}
                    />
                    {formTenant ? (
                      <p className="text-2xs text-ink-3">
                        {formTenant.employeeCount ?? 0} personas · {formTenant.branchCount ?? 0} sucursales ·{" "}
                        {tenantStatusInfo(formTenant.status ?? "active").label}
                      </p>
                    ) : null}
                  </div>
                  <div className="min-w-0 space-y-2">
                    <Label>Plan</Label>
                    <FormSelect
                      value={formValues.plan}
                      onValueChange={(value) => applyPlan(value as PlanTier)}
                      options={PLAN_TIER_OPTIONS}
                    />
                    {catalogPlan ? <p className="text-2xs text-ink-3">{catalogPlan.description}</p> : null}
                  </div>
                  <div className="min-w-0 space-y-2">
                    <Label>Ciclo de cobro</Label>
                    <FormSelect
                      value={formValues.billingCycle}
                      onValueChange={(value) => applyCycle(value as "monthly" | "annual")}
                      options={CYCLE_OPTIONS}
                    />
                  </div>
                  <div className="min-w-0 space-y-2">
                    <Label>Estado del cobro</Label>
                    <FormSelect
                      value={formValues.status}
                      onValueChange={(value) =>
                        form.setValue("status", value as SubscriptionFormValues["status"], { shouldDirty: true })
                      }
                      options={STATUS_OPTIONS}
                    />
                    <p className="text-2xs text-ink-3">
                      {subscriptionStatusInfo(formValues.status ?? "active").detail}
                    </p>
                  </div>
                  <div className="min-w-0 space-y-2">
                    <Label htmlFor="subscription-price">Precio que se cobrará</Label>
                    <Input
                      id="subscription-price"
                      readOnly
                      aria-describedby="catalog-price-help"
                      value={formatPrice(catalogPrice)}
                    />
                    <p id="catalog-price-help" className="text-2xs text-ink-3">
                      Sale del catálogo: plan {planTierLabel(formValues.plan)},{" "}
                      {billingCycleLabel(formValues.billingCycle).toLocaleLowerCase("es")}. Es exactamente el importe
                      que se guarda.
                    </p>
                  </div>
                  <div className="min-w-0 space-y-2">
                    <DatePicker
                      label="Fecha de renovación"
                      value={formValues.renewalDate ?? ""}
                      onChange={(value) => form.setValue("renewalDate", value, { shouldDirty: true })}
                    />
                  </div>
                </div>

                {breaches.length > 0 ? (
                  <WarningList
                    warnings={breaches.map((breach) => ({
                      code: breach.label,
                      message: `${breach.label.toLocaleLowerCase("es")}: ${formTenant?.name ?? "la empresa"} tiene ${
                        breach.current
                      } y el plan ${planTierLabel(formValues.plan)} permite ${breach.cap}. El plan no borra lo que ya existe, pero la deja por encima de su propio tope.`,
                    }))}
                  />
                ) : null}

                {formValues.status === "past_due" ? (
                  <InlineNote tone="warning" title="Marcar el pago como vencido no corta el acceso">
                    La empresa sigue entrando con normalidad. Para cortar el acceso hay que suspenderla desde la
                    pantalla de empresas: son dos decisiones distintas y se toman por separado a propósito.
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
                  <Button type="submit" loading={saveMutation.isPending} loadingLabel="Guardando…">
                    {editing ? "Guardar cambios" : "Crear la suscripción"}
                  </Button>
                </div>
              </form>
            </PageSection>
          ) : null}

          <FilterToolbar
            searchPlaceholder="Buscar por empresa, plan o estado"
            options={[
              { label: "Todas", value: "" },
              { label: "Al día", value: "active" },
              { label: "En prueba", value: "trial" },
              { label: "Pago vencido", value: "past_due" },
            ]}
            searchValue={query}
            onSearchChange={setQuery}
            filterValue={activeFilter}
            onFilterChange={setActiveFilter}
          />

          {filtered.length === 0 ? (
            <EmptyState
              reason={query || activeFilter ? "no-matches" : "no-records"}
              title={query || activeFilter ? "Ninguna suscripción coincide" : "Todavía no hay suscripciones"}
              description={
                query || activeFilter
                  ? "Prueba con otro texto o quita el filtro de estado."
                  : "Crea la primera suscripción para empezar a cobrar un plan."
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
            <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
              <div className="min-w-0">
                <DomainTable
                  exportable
                  data={filtered}
                  getKey={(subscription) => subscription.id}
                  onSelect={(subscription) => setSelectedSubscriptionId(subscription.id)}
                  columns={[
                    {
                      key: "tenant",
                      header: "Empresa",
                      sortable: true,
                      render: (subscription) => tenantName(subscription.tenantId),
                    },
                    {
                      key: "plan",
                      header: "Plan",
                      sortable: true,
                      render: (subscription) => planTierLabel(subscription.plan),
                    },
                    {
                      key: "status",
                      header: "Cobro",
                      sortable: true,
                      render: (subscription) => {
                        const info = subscriptionStatusInfo(subscription.status);
                        return <StatusBadge size="sm" tone={info.tone} label={info.label} />;
                      },
                    },
                    {
                      key: "price",
                      header: "Precio",
                      sortable: true,
                      render: (subscription) => formatPrice(subscription.price),
                    },
                    {
                      key: "cycle",
                      header: "Ciclo",
                      sortable: true,
                      render: (subscription) => billingCycleLabel(subscription.billingCycle),
                    },
                    {
                      key: "renewal",
                      header: "Renueva",
                      sortable: true,
                      mobileHidden: true,
                      render: (subscription) => formatDate(subscription.renewalDate),
                    },
                    {
                      key: "branches",
                      header: "Sucursales",
                      sortable: true,
                      mobileHidden: true,
                      render: (subscription) =>
                        tenantsQuery.data?.find((tenant) => tenant.id === subscription.tenantId)?.branchCount ?? 0,
                    },
                    {
                      key: "actions",
                      header: "Acciones",
                      render: (subscription) => (
                        <div className="flex flex-wrap gap-2">
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
              </div>

              {selectedSubscription ? (
                <PageSection
                  boxed
                  title={selectedTenant?.name ?? tenantName(selectedSubscription.tenantId)}
                  description={selectedTenant?.branding.supportEmail ?? "Sin correo de soporte registrado"}
                  className="min-w-0 self-start"
                >
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge
                        size="sm"
                        tone={subscriptionStatusInfo(selectedSubscription.status).tone}
                        label={subscriptionStatusInfo(selectedSubscription.status).label}
                      />
                      <StatusBadge size="sm" tone="neutral" label={planTierLabel(selectedSubscription.plan)} />
                    </div>

                    <dl className="divide-y divide-line rounded-md border border-line">
                      <div className="flex items-baseline justify-between gap-3 px-4 py-3">
                        <dt className="text-sm text-ink-2">Importe</dt>
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
                      <div className="flex items-baseline justify-between gap-3 px-4 py-3">
                        <dt className="text-sm text-ink-2">Estado de la empresa</dt>
                        <dd className="text-right text-sm font-medium text-ink-1">
                          {tenantStatusInfo(selectedTenant?.status ?? "active").label}
                        </dd>
                      </div>
                      <div className="flex items-baseline justify-between gap-3 px-4 py-3">
                        <dt className="text-sm text-ink-2">Cobertura</dt>
                        <dd className="text-right text-sm font-medium text-ink-1">
                          {selectedTenant?.branchCount ?? 0} sucursales · {selectedTenant?.employeeCount ?? 0} personas
                        </dd>
                      </div>
                    </dl>

                    {(selectedTenant?.enabledModules ?? []).length > 0 ? (
                      <div>
                        <p className="mb-2 text-2xs text-ink-3">Módulos habilitados en la empresa</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(selectedTenant?.enabledModules ?? []).map((module) => (
                            <span
                              key={module}
                              className="rounded-md border border-line bg-surface-2 px-2 py-1 text-2xs text-ink-2"
                            >
                              {moduleLabels[module]}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
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
        title={deleting ? `¿Eliminar la suscripción de ${tenantName(deleting.tenantId)}?` : "Eliminar suscripción"}
        description="La empresa se queda sin plan registrado. Su gente sigue entrando: cortar el acceso es otra decisión, y se toma desde la pantalla de empresas."
        confirmLabel="Eliminar la suscripción"
        pending={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        consequences={
          deleting ? (
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Deja de constar el plan {planTierLabel(deleting.plan)} por {formatPrice(deleting.price)}{" "}
                {billingCycleLabel(deleting.billingCycle).toLocaleLowerCase("es")}.
              </li>
              <li>Se pierde la renovación pactada para el {formatDate(deleting.renewalDate)}.</li>
              <li>
                {deletingTenant?.name ?? "La empresa"} aparecerá como «Sin registro» hasta que se le cree otra
                suscripción.
              </li>
              <li>El acceso de sus {deletingTenant?.employeeCount ?? 0} personas no cambia.</li>
            </ul>
          ) : null
        }
      />
    </div>
  );
}
