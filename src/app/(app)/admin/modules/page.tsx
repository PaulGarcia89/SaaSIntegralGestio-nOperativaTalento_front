"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchModuleAssignments, fetchTenants, updateModuleAssignment } from "@/lib/mock-backend";
import { CrudHeader, CrudPanel } from "@/components/admin-crud";
import { DomainTable, FilterToolbar, StateCard } from "@/components/domain";
import { Button } from "@/components/ui/button";
import { moduleLabels, moduleSourceLabels } from "@/lib/ui-labels";
import { useAppStore } from "@/store/app-store";

export default function ModulesPage() {
  const { can } = useAppStore();
  const queryClient = useQueryClient();
  const tenantsQuery = useQuery({ queryKey: ["admin-tenants"], queryFn: fetchTenants });
  const modulesQuery = useQuery({ queryKey: ["module-assignments"], queryFn: () => fetchModuleAssignments() });
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      (modulesQuery.data ?? []).filter((assignment) =>
        [assignment.module, assignment.source, assignment.enabled ? "enabled" : "disabled"]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [modulesQuery.data, query],
  );

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
        title="Sin acceso a modulos"
        description="El rol actual no puede configurar modulos por empresa."
      />
    );
  }

  return (
    <div className="space-y-5">
      <CrudHeader
        title="Gestion de modulos"
        description="Consulta y modifica los modulos habilitados por empresa, de acuerdo con el plan o activacion manual."
        badge="Administracion"
      />
      <FilterToolbar
        searchPlaceholder="Buscar por modulo, origen o estado"
        options={[
          { label: "Todos", value: "" },
          { label: "Habilitados", value: "enabled" },
          { label: "Deshabilitados", value: "disabled" },
          { label: "Plan", value: "plan" },
        ]}
        activeValue={query}
        onChange={setQuery}
      />
      <CrudPanel>
        <DomainTable
          data={filtered}
          getKey={(assignment) => assignment.id}
          columns={[
            {
              key: "tenant",
              header: "Empresa",
              render: (assignment) =>
                tenantsQuery.data?.find((tenant) => tenant.id === assignment.tenantId)?.name ?? assignment.tenantId,
            },
            { key: "module", header: "Modulo", render: (assignment) => moduleLabels[assignment.module] },
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
    </div>
  );
}
