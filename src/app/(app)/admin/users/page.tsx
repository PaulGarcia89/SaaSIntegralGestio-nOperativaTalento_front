"use client";

import { useMemo, useState } from "react";
import { DomainTable, DrawerPreview, FilterToolbar, StateCard } from "@/components/domain";
import { PageIntro, SectionCard, SplitPanel } from "@/components/ui";
import { useAppStore } from "@/store/app-store";

export default function UsersPage() {
  const { can, currentTenant, users } = useAppStore();
  const [query, setQuery] = useState("");
  const scopedUsers = useMemo(
    () =>
      users
        .filter((user) => user.tenantId === currentTenant.id)
        .filter((user) =>
          [user.fullName, user.email, user.role, user.status]
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase()),
        ),
    [currentTenant.id, query, users],
  );
  const [selectedId, setSelectedId] = useState(scopedUsers[0]?.id ?? "");
  const selected = scopedUsers.find((user) => user.id === selectedId) ?? scopedUsers[0];

  if (!can("admin.users")) {
    return (
      <StateCard
        tone="restricted"
        title="Sin acceso a gestion de usuarios"
        description="El rol actual no puede invitar, suspender ni revisar accesos de otros usuarios."
      />
    );
  }

  return (
    <>
      <PageIntro
        eyebrow="Gestion de usuarios"
        title="Accesos, estados y gobierno de identidad por tenant."
        description="La tabla permite revisar usuarios, mientras el drawer lateral ayuda a decidir invitaciones, suspensiones o ajustes de rol."
      />

      <FilterToolbar
        searchPlaceholder="Buscar por nombre, correo, rol o estado"
        options={[
          { label: "Todos", value: "" },
          { label: "Activos", value: "active" },
          { label: "Invitados", value: "invited" },
          { label: "Suspendidos", value: "suspended" },
        ]}
        activeValue={query}
        onChange={setQuery}
      />

      <SplitPanel
        left={
          <SectionCard title="Usuarios por empresa" subtitle={currentTenant.name}>
            <DomainTable
              data={scopedUsers}
              getKey={(user) => user.id}
              onSelect={(user) => setSelectedId(user.id)}
              columns={[
                { key: "name", header: "Nombre", render: (user) => user.fullName },
                { key: "role", header: "Rol", render: (user) => user.role },
                { key: "status", header: "Estado", render: (user) => user.status },
                { key: "email", header: "Correo", render: (user) => user.email },
              ]}
            />
          </SectionCard>
        }
        right={
          selected ? (
            <DrawerPreview title={selected.fullName} subtitle="Acceso y permisos">
              <div className="detail-stack">
                <div className="detail-row"><span>Correo</span><strong>{selected.email}</strong></div>
                <div className="detail-row"><span>Rol</span><strong>{selected.role}</strong></div>
                <div className="detail-row"><span>Estado</span><strong>{selected.status}</strong></div>
                <div className="detail-row"><span>Tenant</span><strong>{currentTenant.name}</strong></div>
              </div>
            </DrawerPreview>
          ) : (
            <StateCard tone="empty" title="Sin usuarios visibles" description="No hay usuarios para este tenant o el filtro actual no devolvio resultados." />
          )
        }
      />
    </>
  );
}
