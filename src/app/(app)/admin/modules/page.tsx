"use client";

import { useUiText } from "@/components/ui-copy";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchModuleAssignments,
  fetchTenants,
  getApiErrorMessage,
  updateModuleAssignment,
} from "@/lib/backend";
import { CrudHeader, CrudPanel } from "@/components/admin-crud";
import { DomainTable, FilterToolbar, StateCard, matchesSearchAndFilter } from "@/components/domain";
import { confirmAction } from "@/components/confirm-action";
import { Button } from "@/components/ui/button";
import { moduleLabels, moduleSourceLabels } from "@/lib/ui-labels";
import { useAppStore } from "@/store/app-store";
import { Badge } from "@/components/ui/badge";
import { BlockedState } from "@/components/system";
import { planTierLabel, shortId, tenantStatusInfo } from "@/lib/platform-labels";
import { InfoList, SectionCard } from "@/components/ui";
import { AsyncState } from "@/components/async-state";

export default function ModulesPage() {
  const uiText = useUiText();
  const { can, canAccessGlobalGovernance } = useAppStore();
  const queryClient = useQueryClient();
  const tenantsQuery = useQuery({
    queryKey: ["admin-tenants"],
    queryFn: fetchTenants,
    enabled: canAccessGlobalGovernance,
  });
  const modulesQuery = useQuery({ queryKey: ["module-assignments"], queryFn: () => fetchModuleAssignments() });
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");

  const filtered = useMemo(
    () =>
      (modulesQuery.data ?? []).filter((assignment) =>
        matchesSearchAndFilter([assignment.module, assignment.source, assignment.enabled ? "enabled" : "disabled"], query, activeFilter),
      ),
    [activeFilter, modulesQuery.data, query],
  );

  const selectedAssignment =
    filtered.find((assignment) => assignment.id === selectedAssignmentId) ?? filtered[0] ?? null;
  const selectedTenant =
    tenantsQuery.data?.find((tenant) => tenant.id === selectedAssignment?.tenantId) ?? null;

  const toggleMutation = useMutation({
    mutationFn: ({ id, tenantId, module, enabled, source }: (typeof filtered)[number]) =>
      updateModuleAssignment(id, { tenantId, module, enabled: !enabled, source }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
      toast.success("Módulo actualizado");
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible cambiar el módulo.")),
  });

  if (!can("admin.company")) {
    return (
      <BlockedState
        title={uiText("Sin acceso a los módulos por empresa")}
        cause="Habilitar o apagar un módulo afecta al menú de todas las personas de una empresa."
        owner="Quien administra la plataforma"
        resolution="Si necesitas consultarlo, pide el permiso «Configuración de empresa»."
      />
    );
  }

  if (modulesQuery.isLoading || tenantsQuery.isLoading) return <AsyncState state="loading" title={uiText("Cargando módulos")} />;
  if (modulesQuery.isError || tenantsQuery.isError) return <AsyncState state="error" title={uiText("No fue posible cargar los módulos")} onRetry={() => { void modulesQuery.refetch(); void tenantsQuery.refetch(); }} />;

  return (
    <div className="space-y-5">
      <CrudHeader
        title={uiText("Gestión de módulos")}
        description={uiText("Qué módulos ve cada empresa. Apagar uno lo quita del menú de todas sus personas de inmediato; los datos se conservan.")}
        badge="Gobierno SaaS"
      />
      <FilterToolbar
        searchPlaceholder="Buscar por módulo, origen o estado"
        options={[
          { label: uiText("Todos"), value: "" },
          { label: "Habilitados", value: "enabled" },
          { label: "Deshabilitados", value: "disabled" },
          { label: "Plan", value: "plan" },
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
            title={uiText("No hay módulos visibles")}
            description={uiText("Ajusta el filtro para revisar las asignaciones disponibles.")}
          />
        </CrudPanel>
      ) : (
        <div className="grid min-w-0 gap-x-6 gap-y-8 2xl:gap-x-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)] [&>*]:min-w-0">
          <CrudPanel>
            <DomainTable
              data={filtered}
              getKey={(assignment) => assignment.id}
              onSelect={(assignment) => setSelectedAssignmentId(assignment.id)}
              columns={[
                {
                  key: "tenant",
                  header: uiText("Empresa"),
                  render: (assignment) =>
                    tenantsQuery.data?.find((tenant) => tenant.id === assignment.tenantId)?.name ??
                    `Empresa sin cargar (${shortId(assignment.tenantId)})`,
                },
                { key: "module", header: "Módulo", render: (assignment) => moduleLabels[assignment.module] },
                { key: "source", header: uiText("Origen"), render: (assignment) => moduleSourceLabels[assignment.source] },
                { key: "status", header: uiText("Estado"), render: (assignment) => (assignment.enabled ? "Habilitado" : "Deshabilitado") },
                {
                  key: "actions",
                  header: uiText("Acciones"),
                  render: (assignment) => (
                    <Button
                      size="sm"
                      variant={assignment.enabled ? "destructive" : "secondary"}
                      onClick={() =>
                        void confirmAction({
                          title: assignment.enabled
                            ? `¿Deshabilitar ${moduleLabels[assignment.module]}?`
                            : `¿Habilitar ${moduleLabels[assignment.module]}?`,
                          description: assignment.enabled
                            ? "El módulo desaparece del menú de todas las personas de esta empresa."
                            : "El módulo aparece en el menú de quien tenga permiso para verlo.",
                          consequence: assignment.enabled
                            ? "Quien esté trabajando dentro ahora mismo perderá el acceso en cuanto recargue. Los datos no se borran: vuelven a estar disponibles si se rehabilita."
                            : "Los datos que ya existieran del módulo vuelven a estar accesibles.",
                          confirmLabel: assignment.enabled ? "Deshabilitar el módulo" : "Habilitar el módulo",
                        }).then((ok) => ok && toggleMutation.mutate(assignment))
                      }
                    >
                      {assignment.enabled ? "Deshabilitar" : "Habilitar"}
                    </Button>
                  ),
                },
              ]}
            />
          </CrudPanel>

          {selectedAssignment ? (
            <SectionCard title={moduleLabels[selectedAssignment.module]} subtitle="Detalle del módulo" className="self-start">
              <div className="space-y-4">
                <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{uiText("Asignación")}</p>
                    <h3 className="text-xl font-semibold tracking-tight text-foreground">
                      {selectedTenant?.name ?? "Sin empresa"}
                    </h3>
                    <p className="text-xs text-muted-foreground">{moduleLabels[selectedAssignment.module]}</p>
                  </div>
                </div>

                <InfoList
                  items={[
                    { title: uiText("Estado"), description: selectedAssignment.enabled ? "Módulo habilitado" : "Módulo deshabilitado", badge: selectedAssignment.enabled ? "Activo" : "Inactivo" },
                    { title: uiText("Origen"), description: moduleSourceLabels[selectedAssignment.source] },
                    {
                      title: "Plan de la empresa",
                      description: selectedTenant ? planTierLabel(selectedTenant.plan) : "Sin plan",
                      badge: tenantStatusInfo(selectedTenant?.status ?? "active").label,
                    },
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
    </div>
  );
}
