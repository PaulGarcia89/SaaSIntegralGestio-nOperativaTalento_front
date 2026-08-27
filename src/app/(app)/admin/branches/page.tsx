"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import type { BranchDto } from "@/lib/contracts";
import { createBranch, deleteBranch, fetchBranchesForTenants, fetchSubscriptions, fetchTenants, updateBranch } from "@/lib/backend";
import { CrudHeader, CrudPanel } from "@/components/admin-crud";
import { DomainTable, FilterToolbar, StateCard, matchesSearchAndFilter } from "@/components/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { FormSelect } from "@/components/ui/form-select";
import { useAppStore } from "@/store/app-store";
import { DataTable, InfoList, SectionCard } from "@/components/ui";
import { AsyncState } from "@/components/async-state";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { useLocale } from "@/components/locale-provider";

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

function localizedBranchStatus(status: BranchDto["status"], t: (key: string) => string) {
  return status === "active" ? t("branches.active") : t("branches.inactive");
}

export default function BranchesPage() {
  const { t } = useLocale();
  const { can, currentTenant, currentRole, canAccessGlobalGovernance } = useAppStore();
  const canViewBranches = can("branches.view");
  const canCreateBranch = can("branches.create");
  const canUpdateBranch = can("branches.update");
  const canDeleteBranch = can("branches.delete");
  const queryClient = useQueryClient();
  const hasGlobalGovernance = canAccessGlobalGovernance;
  const tenantsQuery = useQuery({
    queryKey: ["admin-tenants", hasGlobalGovernance ? "global" : currentTenant.id],
    queryFn: () => hasGlobalGovernance ? fetchTenants() : Promise.resolve([currentTenant]),
    enabled: Boolean(currentTenant.id),
  });
  const tenantIds = useMemo(
    () => (tenantsQuery.data ?? []).map((tenant) => tenant.id),
    [tenantsQuery.data],
  );
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

  const form = useForm<BranchFormInput, unknown, BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      tenantId: currentTenant.id,
      name: "",
      city: "",
      manager: "",
      employees: 0,
      status: "active",
    },
  });
  useUnsavedChanges(open && form.formState.isDirty, "branch-form");
  const selectedTenantId = useWatch({ control: form.control, name: "tenantId" });
  const selectedStatus = useWatch({ control: form.control, name: "status" });

  const filtered = useMemo(
    () =>
      (branchesQuery.data ?? []).filter((branch) =>
        matchesSearchAndFilter([
          branch.name,
          branch.city,
          branch.manager,
          branch.status,
          tenantsQuery.data?.find((tenant) => tenant.id === branch.tenantId)?.name ?? "",
        ], query, activeFilter),
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
  const tenantBranchTotal =
    (branchesQuery.data ?? []).filter((branch) => branch.tenantId === selectedBranch?.tenantId).length;
  const tenantEmployees =
    (branchesQuery.data ?? [])
      .filter((branch) => branch.tenantId === selectedBranch?.tenantId)
      .reduce((total, branch) => total + branch.employees, 0);

  const saveMutation = useMutation({
    mutationFn: async (values: BranchFormValues) =>
      editing
        ? updateBranch(editing.id, values)
        : createBranch(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success(editing ? t("branches.updated") : t("branches.created"));
      setOpen(false);
      setEditing(null);
      form.reset();
    },
    onError: () => toast.error(t("branches.saveError")),
  });

  const deleteMutation = useMutation({
    mutationFn: (branch: BranchDto) => deleteBranch(branch.id, branch.tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success(t("branches.deleted"));
      setDeleting(null);
    },
    onError: () => toast.error(t("branches.deleteError")),
  });

  if (!canViewBranches) {
    return (
      <StateCard
        tone="restricted"
        title={t("branches.noAccess")}
        description={t("branches.noAccessDescription")}
      />
    );
  }

  if (branchesQuery.isLoading || tenantsQuery.isLoading || subscriptionsQuery.isLoading) return <AsyncState state="loading" title={t("branches.loading")} />;
  if (branchesQuery.isError || tenantsQuery.isError || subscriptionsQuery.isError) return <AsyncState state="error" title={t("branches.error")} onRetry={() => { void branchesQuery.refetch(); void tenantsQuery.refetch(); if (hasGlobalGovernance) void subscriptionsQuery.refetch(); }} />;

  return (
    <div className="space-y-5">
      <CrudHeader
        title={t("branches.title")}
        description={t("branches.description")}
        badge={t("branches.eyebrow")}
        action={
          canCreateBranch ? <Button onClick={() => {
              form.reset({
                tenantId: currentTenant.id,
                name: "",
                city: "",
                manager: "",
                employees: 0,
                status: "active",
              });
              setOpen(true);
            }}>{t("branches.new")}</Button> : null
        }
      />
      {open ? (
        <Card level={2}>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">{editing ? t("branches.edit") : t("branches.create")}</h2>
              <p className="text-sm text-text-secondary">{t("branches.manageDescription")}</p>
            </div>
            <form id="branch-form" className="space-y-4" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}>
              <div className="space-y-2">
                <Label>{t("branches.company")}</Label>
                <FormSelect
                  className="h-11 w-full rounded-2xl"
                  placeholder={t("branches.selectCompany")}
                  value={selectedTenantId}
                  onValueChange={(v) => form.setValue("tenantId", v)}
                  options={(tenantsQuery.data ?? []).map((tenant) => ({ label: tenant.name, value: tenant.id }))}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("branches.name")}</Label>
                  <Input {...form.register("name")} />
                </div>
                <div className="space-y-2">
                  <Label>{t("branches.city")}</Label>
                  <Input {...form.register("city")} />
                </div>
                <div className="space-y-2">
                <Label>{t("branches.manager")}</Label>
                <Input {...form.register("manager")} />
                </div>
                <div className="space-y-2">
                  <Label>{t("branches.employees")}</Label>
                  <Input type="number" {...form.register("employees")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("branches.status")}</Label>
                <FormSelect
                  className="h-11 w-full rounded-2xl"
                  value={selectedStatus}
                  onValueChange={(v) => form.setValue("status", v as "active" | "inactive")}
                  options={[
                    { label: t("branches.active"), value: "active" },
                    { label: t("branches.inactive"), value: "inactive" },
                  ]}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => {
                  setOpen(false);
                  setEditing(null);
                  form.reset();
                }}>
                  {t("branches.cancel")}
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? t("branches.saving") : t("branches.save")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <FilterToolbar
        searchPlaceholder={t("branches.search")}
        options={[
          { label: t("branches.all"), value: "" },
          { label: t("branches.activeFilter"), value: "active" },
          { label: t("branches.inactiveFilter"), value: "inactive" },
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
            title={t("branches.empty")}
            description={t("branches.emptyDescription")}
          />
        </CrudPanel>
      ) : (
        <div className="grid gap-x-6 gap-y-8 2xl:gap-x-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">
          <CrudPanel>
            <DomainTable exportable
              data={filtered}
              getKey={(branch) => branch.id}
              onSelect={(branch) => setSelectedBranchId(branch.id)}
              columns={[
                {
                  key: "tenant",
                  header: t("branches.company"),
                  sortable: true,
                  render: (branch) =>
                    tenantsQuery.data?.find((tenant) => tenant.id === branch.tenantId)?.name ?? branch.tenantId,
                },
                { key: "name", header: t("branches.name"), sortable: true, render: (branch) => branch.name },
                { key: "city", header: t("branches.city"), sortable: true, render: (branch) => branch.city },
                { key: "manager", header: t("branches.manager"), sortable: true, render: (branch) => branch.manager },
                { key: "employees", header: t("branches.employees"), sortable: true, render: (branch) => branch.employees },
                { key: "status", header: t("branches.status"), sortable: true, render: (branch) => localizedBranchStatus(branch.status, t) },
                {
                  key: "actions",
                  header: t("branches.actions"),
                  render: (branch) => (
                    <div className="flex gap-2">
                      {canUpdateBranch ? <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditing(branch);
                          form.reset(branch);
                          setOpen(true);
                        }}
                      >
                        {t("branches.edit")}
                      </Button> : null}
                      {canDeleteBranch ? <Button size="sm" variant="destructive" onClick={() => setDeleting(branch)}>
                        {t("branches.delete")}
                      </Button> : null}
                    </div>
                  ),
                },
              ]}
            />
          </CrudPanel>

          {selectedBranch ? (
            <SectionCard title={selectedBranch.name} subtitle={t("branches.detail")} className="self-start">
              <div className="space-y-4">
                <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{t("branches.context")}</p>
                    <h3 className="text-xl font-semibold tracking-tight text-foreground">{selectedBranch.name}</h3>
                    <p className="text-xs text-muted-foreground">{selectedTenant?.name ?? t("branches.noCompany")} · {selectedBranch.city}</p>
                  </div>
                </div>

                <InfoList
                  items={[
                    { title: t("branches.manager"), description: selectedBranch.manager, badge: localizedBranchStatus(selectedBranch.status, t) },
                    { title: t("branches.staffing"), description: t("branches.people", { count: String(selectedBranch.employees) }), badge: t("branches.total", { count: String(tenantEmployees) }) },
                    { title: t("branches.subscription"), description: selectedSubscription?.plan ?? t("branches.noSubscription"), badge: selectedSubscription?.status ?? t("branches.pending") },
                    { title: t("branches.network"), description: t("branches.count", { count: String(tenantBranchTotal) }), badge: t("branches.related", { count: String(siblingBranches.length) }) },
                  ]}
                />

                <DataTable
                  columns={["Sucursal", "Ciudad"]}
                  rows={siblingBranches.map((branch) => [branch.name, branch.city])}
                  pageSize={4}
                />
              </div>
            </SectionCard>
          ) : null}
        </div>
      )}

      {deleting ? (
        <Card level={2}>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">{t("branches.deleteTitle")}</h2>
              <p className="text-sm text-text-secondary">{t("branches.deleteDescription", { name: deleting.name ?? t("branches.branch") })}</p>
            </div>
            <div className="rounded-2xl border border-status-danger/20 bg-status-danger/5 px-4 py-3 text-sm leading-6 text-text-secondary">
              {t("branches.permanent")}
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setDeleting(null)} disabled={deleteMutation.isPending}>
                {t("branches.cancel")}
              </Button>
              <Button type="button" variant="destructive" onClick={() => deleting && deleteMutation.mutate(deleting)} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? t("branches.deleting") : t("branches.deleteDefinitely")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
