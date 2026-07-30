"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchModuleAssignments, fetchTenants, updateModuleAssignment } from "@/lib/backend";
import { CrudHeader, CrudPanel } from "@/components/admin-crud";
import { DomainTable, FilterToolbar, StateCard, matchesSearchAndFilter } from "@/components/domain";
import { Button } from "@/components/ui/button";
import { moduleLabels, moduleSourceLabels } from "@/lib/ui-labels";
import { useAppStore } from "@/store/app-store";
import { Badge } from "@/components/ui/badge";
import { InfoList, SectionCard } from "@/components/ui";
import { AsyncState } from "@/components/async-state";

export default function ModulesPage() {
  const { can } = useAppStore();
  const queryClient = useQueryClient();
  const tenantsQuery = useQuery({ queryKey: ["admin-tenants"], queryFn: fetchTenants });
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
    },
  });

  if (!can("admin.company")) {
    return (
      <StateCard
        tone="restricted"
        title="Sin acceso a módulos"
        description="El rol actual no puede configurar módulos por empresa."
      />
    );
  }

  if (modulesQuery.isLoading || tenantsQuery.isLoading) return <AsyncState state="loading" title="Cargando módulos" />;
  if (modulesQuery.isError || tenantsQuery.isError) return <AsyncState state="error" title="No fue posible cargar los módulos" onRetry={() => { void modulesQuery.refetch(); void tenantsQuery.refetch(); }} />;

  return (
    <div className="space-y-5">
      <CrudHeader
        title="Gestion de módulos"
        description="Consulta y modifica los módulos habilitados por empresa, de acuerdo con el plan o activacion manual."
        badge="Gobierno SaaS"
      />
      <FilterToolbar
        searchPlaceholder="Buscar por módulo, origen o estado"
        options={[
          { label: "Todos", value: "" },
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
            title="No hay módulos visibles"
            description="Ajusta el filtro para revisar las asignaciones disponibles."
          />
        </CrudPanel>
      ) : (
        <div className="grid gap-x-6 gap-y-8 2xl:gap-x-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">
          <CrudPanel>
            <DomainTable
              data={filtered}
              getKey={(assignment) => assignment.id}
              onSelect={(assignment) => setSelectedAssignmentId(assignment.id)}
              columns={[
                {
                  key: "tenant",
                  header: "Empresa",
                  render: (assignment) =>
                    tenantsQuery.data?.find((tenant) => tenant.id === assignment.tenantId)?.name ?? assignment.tenantId,
                },
                { key: "module", header: "Módulo", render: (assignment) => moduleLabels[assignment.module] },
                { key: "source", header: "Origen", render: (assignment) => moduleSourceLabels[assignment.source] },
                { key: "status", header: "Estado", render: (assignment) => (assignment.enabled ? "Habilitado" : "Deshabilitado") },
                {
                  key: "actions",
                  header: "Acciones",
                  render: (assignment) => (
                    <Button
                      size="sm"
                      variant={assignment.enabled ? "destructive" : "secondary"}
                      onClick={() => toggleMutation.mutate(assignment)}
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
                    <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Asignación</p>
                    <h3 className="text-xl font-semibold tracking-tight text-foreground">
                      {selectedTenant?.name ?? "Sin empresa"}
                    </h3>
                    <p className="text-xs text-muted-foreground">{moduleLabels[selectedAssignment.module]}</p>
                  </div>
                </div>

                <InfoList
                  items={[
                    { title: "Estado", description: selectedAssignment.enabled ? "Módulo habilitado" : "Módulo deshabilitado", badge: selectedAssignment.enabled ? "Activo" : "Inactivo" },
                    { title: "Origen", description: moduleSourceLabels[selectedAssignment.source], badge: selectedAssignment.source },
                    { title: "Plan de empresa", description: selectedTenant?.plan ?? "Sin plan", badge: selectedTenant?.status ?? "Sin estado" },
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
