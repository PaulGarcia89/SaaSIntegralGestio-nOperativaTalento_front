"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import type { BranchDto } from "@/lib/contracts";
import {
  createBranch,
  deleteBranch,
  fetchBranchesForTenants,
  fetchSubscriptions,
  fetchTenants,
  getApiErrorMessage,
  updateBranch,
} from "@/lib/backend";
import { ConfirmDeleteDialog } from "@/components/admin-crud";
import { DomainTable, FilterToolbar, matchesSearchAndFilter } from "@/components/domain";
import {
  BlockedState,
  EmptyState,
  ErrorState,
  InlineNote,
  PageHeader,
  PageSection,
  SkeletonRows,
} from "@/components/system";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSelect } from "@/components/ui/form-select";
import { billingCycleLabel, formatPrice, planTierLabel, subscriptionStatusInfo } from "@/lib/platform-labels";
import { useAppStore } from "@/store/app-store";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { useLocale } from "@/components/locale-provider";

/**
 * Sucursales.
 *
 * El defecto grande era el mismo que en roles, pero en tres campos a la vez.
 * El formulario pedía **responsable**, **empleados** y **estado**; zod los
 * validaba; y `createBranch`/`updateBranch` solo envían `name` y `location`.
 * Los tres se descartaban en silencio al guardar.
 *
 * Peor todavía: `mapBranch` los inventa al leer. Devuelve siempre
 * `manager: "Pendiente"`, `employees: 0` y `status: "active"`. Es decir, la
 * columna «Responsable» decía «Pendiente» en TODAS las filas, la de
 * «Empleados» decía 0 en todas, la suma de dotación de la empresa daba
 * siempre cero, y el filtro «Inactivas» no podía devolver nada nunca porque
 * ninguna sucursal puede estar inactiva.
 *
 * Se dejan de pedir y de mostrar esos tres campos. No se pierde ninguna
 * función: no existía. Lo que se gana es que la pantalla deje de afirmar
 * cosas falsas sobre las sucursales de la empresa. `BranchDto` se conserva
 * intacto, porque otras pantallas filtran por `status`.
 *
 * De paso: la columna «Empresa» imprimía el UUID cuando el nombre no estaba
 * cargado; el plan y el estado de la suscripción salían en código; el borrado
 * decía «esta acción es permanente» sin nombrar lo que arrastra; y los
 * errores del servidor se sustituían por «Error al guardar la sucursal».
 */

const branchSchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(2),
  city: z.string().min(2),
});

type BranchFormValues = z.output<typeof branchSchema>;

export default function BranchesPage() {
  const { t } = useLocale();
  const { can, currentTenant, canAccessGlobalGovernance } = useAppStore();
  const canViewBranches = can("branches.view");
  const canCreateBranch = can("branches.create");
  const canUpdateBranch = can("branches.update");
  const canDeleteBranch = can("branches.delete");
  const queryClient = useQueryClient();
  const hasGlobalGovernance = canAccessGlobalGovernance;
  const tenantsQuery = useQuery({
    queryKey: ["admin-tenants", hasGlobalGovernance ? "global" : currentTenant.id],
    queryFn: () => (hasGlobalGovernance ? fetchTenants() : Promise.resolve([currentTenant])),
    enabled: Boolean(currentTenant.id),
  });
  const tenantIds = useMemo(() => (tenantsQuery.data ?? []).map((tenant) => tenant.id), [tenantsQuery.data]);
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

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: { tenantId: currentTenant.id, name: "", city: "" },
  });
  useUnsavedChanges(open && form.formState.isDirty, "branch-form");
  const selectedTenantId = useWatch({ control: form.control, name: "tenantId" });

  const filtered = useMemo(
    () =>
      (branchesQuery.data ?? []).filter((branch) =>
        matchesSearchAndFilter(
          [branch.name, branch.city, tenantsQuery.data?.find((tenant) => tenant.id === branch.tenantId)?.name ?? ""],
          query,
          activeFilter,
        ),
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
  const deletingTenant = tenantsQuery.data?.find((tenant) => tenant.id === deleting?.tenantId) ?? null;
  const deletingSiblings = (branchesQuery.data ?? []).filter(
    (branch) => branch.tenantId === deleting?.tenantId && branch.id !== deleting?.id,
  ).length;

  const saveMutation = useMutation({
    // Se envía lo que el backend guarda: nombre y ciudad. Antes viajaban seis
    // campos y llegaban dos.
    mutationFn: async (values: BranchFormValues) => {
      const payload = {
        ...values,
        manager: editing?.manager ?? "",
        employees: editing?.employees ?? 0,
        status: editing?.status ?? ("active" as const),
      };
      return editing ? updateBranch(editing.id, payload) : createBranch(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
      toast.success(editing ? t("branches.updated") : t("branches.created"));
      setOpen(false);
      setEditing(null);
      form.reset();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t("branches.saveError"))),
  });

  const deleteMutation = useMutation({
    mutationFn: (branch: BranchDto) => deleteBranch(branch.id, branch.tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
      toast.success(t("branches.deleted"));
      setDeleting(null);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t("branches.deleteError"))),
  });

  if (!canViewBranches) {
    return (
      <BlockedState
        title={t("branches.noAccess")}
        cause={t("branches.noAccessCause")}
        owner={t("branches.noAccessOwner")}
        resolution={t("branches.noAccessResolution")}
      />
    );
  }

  function startCreating() {
    setEditing(null);
    form.reset({ tenantId: currentTenant.id, name: "", city: "" });
    setOpen(true);
  }

  function tenantName(tenantId: string) {
    return tenantsQuery.data?.find((tenant) => tenant.id === tenantId)?.name ?? t("branches.unknownCompany");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("branches.eyebrow")}
        title={t("branches.title")}
        description={t("branches.pageDescription")}
        actions={canCreateBranch ? <Button onClick={startCreating}>{t("branches.new")}</Button> : undefined}
      />

      {branchesQuery.isLoading || tenantsQuery.isLoading || subscriptionsQuery.isLoading ? (
        <SkeletonRows rows={6} label={t("branches.loading")} />
      ) : branchesQuery.isError || tenantsQuery.isError || subscriptionsQuery.isError ? (
        <ErrorState
          title={t("branches.error")}
          detail={getApiErrorMessage(
            branchesQuery.error ?? tenantsQuery.error ?? subscriptionsQuery.error,
            t("branches.errorDetail"),
          )}
          onRetry={() => {
            void branchesQuery.refetch();
            void tenantsQuery.refetch();
            if (hasGlobalGovernance) void subscriptionsQuery.refetch();
          }}
        />
      ) : (
        <>
          {/* Las tres cifras (sucursales, empresas, ciudades) viven en el panel
              del módulo; aquí lo que se administra es la lista. */}

          {open ? (
            <PageSection
              boxed
              title={editing ? t("branches.edit") : t("branches.create")}
              description={t("branches.formDescription")}
            >
              <form
                id="branch-form"
                className="space-y-5"
                onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
              >
                {hasGlobalGovernance ? (
                  <div className="min-w-0 space-y-2">
                    <Label>{t("branches.company")}</Label>
                    <FormSelect
                      placeholder={t("branches.selectCompany")}
                      value={selectedTenantId}
                      onValueChange={(value) => form.setValue("tenantId", value, { shouldDirty: true })}
                      options={(tenantsQuery.data ?? []).map((tenant) => ({ label: tenant.name, value: tenant.id }))}
                    />
                  </div>
                ) : null}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="min-w-0 space-y-2">
                    <Label htmlFor="branch-name">{t("branches.name")}</Label>
                    <Input id="branch-name" autoComplete="off" {...form.register("name")} />
                    {form.formState.errors.name ? (
                      <p className="text-2xs text-status-danger">{t("branches.nameError")}</p>
                    ) : null}
                  </div>
                  <div className="min-w-0 space-y-2">
                    <Label htmlFor="branch-city">{t("branches.city")}</Label>
                    <Input id="branch-city" autoComplete="off" {...form.register("city")} />
                    {form.formState.errors.city ? (
                      <p className="text-2xs text-status-danger">{t("branches.cityError")}</p>
                    ) : null}
                  </div>
                </div>

                <InlineNote tone="info" title={t("branches.scopeNoteTitle")}>
                  {t("branches.scopeNote")}
                </InlineNote>

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
                    {t("branches.cancel")}
                  </Button>
                  <Button type="submit" loading={saveMutation.isPending} loadingLabel={t("branches.saving")}>
                    {t("branches.save")}
                  </Button>
                </div>
              </form>
            </PageSection>
          ) : null}

          <FilterToolbar
            searchPlaceholder={t("branches.searchPlaceholder")}
            options={[{ label: t("branches.all"), value: "" }]}
            searchValue={query}
            onSearchChange={setQuery}
            filterValue={activeFilter}
            onFilterChange={setActiveFilter}
          />

          {filtered.length === 0 ? (
            <EmptyState
              reason={query ? "no-matches" : "no-records"}
              title={query ? t("branches.noMatches") : t("branches.empty")}
              description={query ? t("branches.noMatchesDescription") : t("branches.emptyDescription")}
              onClearFilters={query ? () => setQuery("") : undefined}
            />
          ) : (
            <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
              <div className="min-w-0">
                <DomainTable
                  exportable
                  data={filtered}
                  getKey={(branch) => branch.id}
                  onSelect={(branch) => setSelectedBranchId(branch.id)}
                  columns={[
                    { key: "name", header: t("branches.name"), sortable: true, render: (branch) => branch.name },
                    { key: "city", header: t("branches.city"), sortable: true, render: (branch) => branch.city },
                    ...(hasGlobalGovernance
                      ? [
                          {
                            key: "tenant",
                            header: t("branches.company"),
                            sortable: true,
                            render: (branch: BranchDto) => tenantName(branch.tenantId),
                          },
                        ]
                      : []),
                    {
                      key: "actions",
                      header: t("branches.actions"),
                      render: (branch) => (
                        <div className="flex flex-wrap gap-2">
                          {canUpdateBranch ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setEditing(branch);
                                form.reset({
                                  tenantId: branch.tenantId,
                                  name: branch.name,
                                  city: branch.city,
                                });
                                setOpen(true);
                              }}
                            >
                              {t("branches.edit")}
                            </Button>
                          ) : null}
                          {canDeleteBranch ? (
                            <Button size="sm" variant="destructive" onClick={() => setDeleting(branch)}>
                              {t("branches.delete")}
                            </Button>
                          ) : null}
                        </div>
                      ),
                    },
                  ]}
                />
              </div>

              {selectedBranch ? (
                <PageSection
                  boxed
                  title={selectedBranch.name}
                  description={`${selectedTenant?.name ?? t("branches.noCompany")} · ${selectedBranch.city}`}
                  className="min-w-0 self-start"
                >
                  <div className="space-y-4">
                    <dl className="divide-y divide-line rounded-md border border-line">
                      <div className="flex items-baseline justify-between gap-3 px-4 py-3">
                        <dt className="text-sm text-ink-2">{t("branches.company")}</dt>
                        <dd className="text-right text-sm font-medium text-ink-1">
                          {selectedTenant?.name ?? t("branches.noCompany")}
                        </dd>
                      </div>
                      {hasGlobalGovernance ? (
                        <div className="flex items-baseline justify-between gap-3 px-4 py-3">
                          <dt className="text-sm text-ink-2">{t("branches.subscription")}</dt>
                          <dd className="text-right text-sm font-medium text-ink-1">
                            {selectedSubscription
                              ? `${planTierLabel(selectedSubscription.plan)} · ${
                                  subscriptionStatusInfo(selectedSubscription.status).label
                                }`
                              : t("branches.noSubscription")}
                          </dd>
                        </div>
                      ) : null}
                      {hasGlobalGovernance && selectedSubscription ? (
                        <div className="flex items-baseline justify-between gap-3 px-4 py-3">
                          <dt className="text-sm text-ink-2">{t("branches.billing")}</dt>
                          <dd className="text-right text-sm font-medium text-ink-1">
                            {formatPrice(selectedSubscription.price)} ·{" "}
                            {billingCycleLabel(selectedSubscription.billingCycle)}
                          </dd>
                        </div>
                      ) : null}
                      <div className="flex items-baseline justify-between gap-3 px-4 py-3">
                        <dt className="text-sm text-ink-2">{t("branches.network")}</dt>
                        <dd className="text-right text-sm font-medium text-ink-1">
                          {t("branches.count", { count: String(siblingBranches.length + 1) })}
                        </dd>
                      </div>
                    </dl>

                    {siblingBranches.length > 0 ? (
                      <div>
                        <p className="mb-2 text-2xs text-ink-3">
                          {t("branches.related", { count: String(siblingBranches.length) })}
                        </p>
                        <ul className="space-y-1">
                          {siblingBranches.map((branch) => (
                            <li
                              key={branch.id}
                              className="flex items-baseline justify-between gap-3 rounded-md border border-line bg-surface-2 px-3 py-2 text-sm"
                            >
                              <span className="min-w-0 truncate text-ink-1">{branch.name}</span>
                              <span className="shrink-0 text-2xs text-ink-3">{branch.city}</span>
                            </li>
                          ))}
                        </ul>
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
        title={deleting ? t("branches.deleteDescription", { name: deleting.name }) : t("branches.deleteTitle")}
        description={t("branches.deleteIntro")}
        confirmLabel={t("branches.deleteDefinitely")}
        pending={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
        consequences={
          deleting ? (
            <ul className="list-disc space-y-1 pl-5">
              <li>{t("branches.deleteConsequencePeople")}</li>
              <li>{t("branches.deleteConsequenceHistory")}</li>
              <li>
                {deletingSiblings === 0
                  ? t("branches.deleteConsequenceLast", { company: deletingTenant?.name ?? currentTenant.name })
                  : t("branches.deleteConsequenceRemaining", { count: String(deletingSiblings) })}
              </li>
            </ul>
          ) : null
        }
      />
    </div>
  );
}
