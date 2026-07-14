"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchInventory } from "@/lib/mock-backend";
import { useAppStore } from "@/store/app-store";
import { DrawerPreview, DomainTable, FilterToolbar, StateCard } from "@/components/domain";
import { ModuleHeader, SectionCard } from "@/components/ui";
import { Button } from "@/components/ui/button";

export default function InventoryPage() {
  const { currentTenant, can, hasModule } = useAppStore();
  const inventoryQuery = useQuery({
    queryKey: ["inventory", currentTenant.id],
    queryFn: () => fetchInventory(currentTenant.id),
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
            </SectionCard>

            {selected ? (
              <DrawerPreview title={selected.item} subtitle="Detalle del activo">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b py-3"><span className="text-sm text-muted-foreground">Sucursal</span><strong>{selected.location}</strong></div>
                  <div className="flex items-center justify-between border-b py-3"><span className="text-sm text-muted-foreground">Stock disponible</span><strong>{selected.stock}</strong></div>
                  <div className="flex items-center justify-between border-b py-3"><span className="text-sm text-muted-foreground">Asignado</span><strong>{selected.assigned}</strong></div>
                  <div className="flex items-center justify-between border-b py-3"><span className="text-sm text-muted-foreground">Estado</span><strong>{selected.status}</strong></div>
                </div>
              </DrawerPreview>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
