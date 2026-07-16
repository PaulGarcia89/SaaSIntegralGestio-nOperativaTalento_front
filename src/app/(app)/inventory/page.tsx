"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  confirmInventoryAssignmentAutomation,
  fetchInventory,
  fetchInventoryActivations,
} from "@/lib/mock-backend";
import { MasterWorkflowCard } from "@/components/master-workflow-card";
import { useAppStore } from "@/store/app-store";
import { DrawerPreview, DomainTable, FilterToolbar, StateCard } from "@/components/domain";
import { ModuleHeader, SectionCard } from "@/components/ui";
import { Button } from "@/components/ui/button";

export default function InventoryPage() {
  const { currentTenant, can, hasModule } = useAppStore();
  const queryClient = useQueryClient();
  const inventoryQuery = useQuery({
    queryKey: ["inventory", currentTenant.id],
    queryFn: () => fetchInventory(currentTenant.id),
  });
  const activationQuery = useQuery({
    queryKey: ["inventory-activations", currentTenant.id],
    queryFn: () => fetchInventoryActivations(currentTenant.id),
  });
  const assignMutation = useMutation({
    mutationFn: (employeeName: string) => confirmInventoryAssignmentAutomation(employeeName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-activations", currentTenant.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary", currentTenant.id] });
      queryClient.invalidateQueries({ queryKey: ["productivity-workspace", currentTenant.id] });
      queryClient.invalidateQueries({ queryKey: ["onboarding-workspace", currentTenant.id] });
      queryClient.invalidateQueries({ queryKey: ["training-workspace", currentTenant.id] });
      queryClient.invalidateQueries({ queryKey: ["master-workflow-card", currentTenant.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-compliance-workspace", currentTenant.id] });
      queryClient.invalidateQueries({ queryKey: ["automation-summary", currentTenant.id] });
      toast.success("Activo asignado y flujo maestro actualizado");
    },
    onError: (error: Error) => toast.error(error.message || "No se pudo confirmar la asignacion"),
  });
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const filtered = useMemo(
    () =>
      (inventoryQuery.data ?? []).filter((item) =>
        [item.item, item.status, item.location]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [inventoryQuery.data, query],
  );

  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0];

  if (!hasModule("inventory")) {
    return (
      <StateCard
        tone="restricted"
        title="Modulo de inventario no disponible"
        description="La suscripcion de esta empresa no incluye actualmente gestion de inventario y activos."
      />
    );
  }

  if (!can("inventory.view")) {
    return (
      <StateCard
        tone="restricted"
        title="Acceso a inventario restringido"
        description="El rol demo actual no puede inspeccionar inventario ni movimientos de stock."
      />
    );
  }

  if (inventoryQuery.isLoading) {
    return <SectionCard title="Cargando inventario" subtitle="Activos y stock">Preparando registros de inventario por empresa.</SectionCard>;
  }

  return (
    <>
      <ModuleHeader
        eyebrow="Inventario"
        title="Stock, asignaciones y salud de activos para supervisores y equipos operativos."
        description="Pensado para soportar alertas, mantenimiento, seguimiento por sucursal y asignacion de activos a empleados desde un sistema reutilizable."
        actions={
          <Button asChild>
            <Link href="/reports">Abrir reportes</Link>
          </Button>
        }
        metrics={[
          { label: "Activos visibles", value: `${filtered.length}`, detail: "Inventario filtrado para la empresa y criterios activos" },
          { label: "Sucursales monitoreadas", value: "3", detail: "Miami, Orlando y Tampa con trazabilidad operativa" },
          { label: "Riesgos de stock", value: "2", detail: "Reposiciones y niveles criticos priorizados hoy" },
        ]}
      />

      <div className="space-y-12 xl:space-y-14">
        <MasterWorkflowCard />

        <FilterToolbar
          searchPlaceholder="Buscar por item, sucursal o estado de stock"
          options={[
            { label: "Todos", value: "" },
            { label: "Critico", value: "critico" },
            { label: "Reposicion", value: "reposicion" },
            { label: "Estable", value: "estable" },
          ]}
          activeValue={query}
          onChange={setQuery}
        />

        {filtered.length === 0 ? (
            <StateCard
              tone="empty"
              title="No se encontraron activos"
              description="Esta empresa aun no ha cargado datos de inventario o la busqueda actual excluyo todas las filas."
            />
        ) : (
          <div className="grid gap-5 xl:grid-cols-[1.18fr_0.82fr]">
            <SectionCard title="Tabla de inventario" subtitle="Activos y stock">
              <div className="space-y-5">
                <DomainTable
                  data={filtered}
                  getKey={(item) => item.id}
                  onSelect={(item) => setSelectedId(item.id)}
                  columns={[
                    { key: "item", header: "Item", render: (item) => item.item },
                    { key: "stock", header: "Stock", render: (item) => item.stock },
                    { key: "assigned", header: "Asignado", render: (item) => item.assigned },
                    { key: "status", header: "Estado", render: (item) => item.status },
                  ]}
                />

                <div className="space-y-3">
                  {(activationQuery.data ?? []).map((item) => (
                    <div key={item.id} className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{item.employeeName}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.item} · {item.branch}
                          </p>
                          <p className="text-sm leading-6 text-muted-foreground">
                            Estado: {item.status}. Objetivo: {item.dueLabel}.
                          </p>
                        </div>
                        <Button
                          variant={item.status === "Asignado" ? "secondary" : "default"}
                          disabled={item.status === "Asignado" || assignMutation.isPending}
                          onClick={() => assignMutation.mutate(item.employeeName)}
                        >
                          {item.status === "Asignado"
                            ? "Activo confirmado"
                            : assignMutation.isPending
                              ? "Actualizando..."
                              : "Confirmar activo"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>

            {selected ? (
              <DrawerPreview title={selected.item} subtitle="Detalle del activo">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b py-3"><span className="text-sm text-muted-foreground">Sucursal</span><strong>{selected.location}</strong></div>
                <div className="flex items-center justify-between border-b py-3"><span className="text-sm text-muted-foreground">Stock disponible</span><strong>{selected.stock}</strong></div>
                <div className="flex items-center justify-between border-b py-3"><span className="text-sm text-muted-foreground">Asignado</span><strong>{selected.assigned}</strong></div>
                <div className="flex items-center justify-between border-b py-3"><span className="text-sm text-muted-foreground">Estado</span><strong>{selected.status}</strong></div>
                <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                  <p className="text-sm font-medium text-foreground">Automatizacion sugerida</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Cuando un colaborador cambia de etapa o sucursal, esta vista puede disparar reasignacion de activos y refresco de capacitación obligatoria.
                  </p>
                </div>
                <div className="space-y-2">
                  {(activationQuery.data ?? []).slice(0, 3).map((item) => (
                    <div key={item.id} className="rounded-2xl border border-border/70 bg-card/90 p-3">
                      <p className="text-sm font-medium text-foreground">{item.employeeName}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {item.item} · {item.branch}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        {item.status} · {item.dueLabel}
                      </p>
                      {item.status !== "Asignado" ? (
                        <Button
                          size="sm"
                          className="mt-3"
                          onClick={() => assignMutation.mutate(item.employeeName)}
                          disabled={assignMutation.isPending}
                        >
                          {assignMutation.isPending ? "Actualizando..." : "Marcar activo asignado"}
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </DrawerPreview>
          ) : null}
        </div>
        )}
      </div>
    </>
  );
}
