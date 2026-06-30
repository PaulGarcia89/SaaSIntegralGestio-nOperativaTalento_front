"use client";

import { useMemo, useState } from "react";
import { DrawerPreview, DomainTable, FilterToolbar, StateCard } from "@/components/domain";
import { PageIntro, SectionCard, SplitPanel } from "@/components/ui";
import { useAppStore } from "@/store/app-store";

export default function InventoryPage() {
  const { datasets, can, hasModule } = useAppStore();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(datasets.inventory[0]?.id ?? "");

  const filtered = useMemo(
    () =>
      datasets.inventory.filter((item) =>
        [item.item, item.status, item.location].join(" ").toLowerCase().includes(query.toLowerCase()),
      ),
    [datasets.inventory, query],
  );

  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0];

  if (!hasModule("inventory")) {
    return (
      <StateCard
        tone="restricted"
        title="Inventario no disponible en este plan"
        description="Este tenant no tiene habilitado el modulo de stock y activos."
      />
    );
  }

  if (!can("inventory.view")) {
    return (
      <StateCard
        tone="restricted"
        title="Acceso restringido a inventario"
        description="Tu rol actual no permite consultar ni administrar activos."
      />
    );
  }

  return (
    <>
      <PageIntro
        eyebrow="Inventario"
        title="Stock, asignaciones y alertas de reposicion con lectura operativa inmediata."
        description="Esta vista ya soporta estados vacios y restringidos, tabla interactiva y panel lateral para detalle del activo."
      />

      <FilterToolbar
        searchPlaceholder="Buscar por item, sede o estado"
        options={[
          { label: "Todo", value: "" },
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
          title="Sin activos para mostrar"
          description="Este tenant no tiene inventario cargado o el filtro actual no produce resultados."
        />
      ) : (
        <SplitPanel
          left={
            <SectionCard title="Estado de activos" subtitle="Inventario y stock">
              <DomainTable
                data={filtered}
                getKey={(item) => item.id}
                onSelect={(item) => setSelectedId(item.id)}
                columns={[
                  { key: "item", header: "Item", render: (item) => item.item },
                  { key: "stock", header: "Stock", render: (item) => item.stock },
                  { key: "assigned", header: "Asignados", render: (item) => item.assigned },
                  { key: "status", header: "Estado", render: (item) => item.status },
                ]}
              />
            </SectionCard>
          }
          right={
            selected ? (
              <DrawerPreview title={selected.item} subtitle="Detalle de activo">
                <div className="detail-stack">
                  <div className="detail-row"><span>Sede</span><strong>{selected.location}</strong></div>
                  <div className="detail-row"><span>Stock disponible</span><strong>{selected.stock}</strong></div>
                  <div className="detail-row"><span>Asignados</span><strong>{selected.assigned}</strong></div>
                  <div className="detail-row"><span>Estado</span><strong>{selected.status}</strong></div>
                </div>
              </DrawerPreview>
            ) : null
          }
        />
      )}
    </>
  );
}
