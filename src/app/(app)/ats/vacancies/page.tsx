"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DrawerPreview, DomainTable, FilterToolbar, StateCard } from "@/components/domain";
import { PageIntro, SectionCard, SplitPanel } from "@/components/ui";
import { useAppStore } from "@/store/app-store";

export default function VacanciesPage() {
  const { datasets, can, hasModule } = useAppStore();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(datasets.vacancies[0]?.id ?? "");

  const filtered = useMemo(
    () =>
      datasets.vacancies.filter((job) =>
        [job.title, job.area, job.mode, job.status, job.location]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [datasets.vacancies, query],
  );

  const selected = filtered.find((job) => job.id === selectedId) ?? filtered[0];

  if (!hasModule("ats")) {
    return (
      <StateCard
        tone="restricted"
        title="ATS no habilitado para este tenant"
        description="El plan o la configuracion actual de empresa no incluye el modulo de reclutamiento."
        action={<Link className="primary-button" href="/admin/subscription">Revisar suscripcion</Link>}
      />
    );
  }

  if (!can("ats.view")) {
    return (
      <StateCard
        tone="restricted"
        title="Sin permiso para consultar vacantes"
        description="Este rol no puede visualizar ni operar el ATS. Cambia el rol demo o revisa la matriz de permisos."
      />
    );
  }

  return (
    <>
      <PageIntro
        eyebrow="Gestion de vacantes"
        title="Publicaciones, filtros y seguimiento operativo del ATS."
        description="La vista combina tabla densa, acciones prioritarias, búsqueda y un drawer lateral para revisión rápida sin romper el flujo."
        actions={
          <>
            <Link className="ghost-button dark" href="/jobs">
              Portal de empleos
            </Link>
            <button className="primary-button" type="button" disabled={!can("ats.manage")}>
              Publicar vacante
            </button>
          </>
        }
      />

      <FilterToolbar
        searchPlaceholder="Buscar por cargo, area, ciudad o estado"
        options={[
          { label: "Todas", value: "" },
          { label: "Activas", value: "activa" },
          { label: "Entrevistas", value: "entrevistas" },
          { label: "Borrador", value: "borrador" },
        ]}
        activeValue={query}
        onChange={setQuery}
      />

      {filtered.length === 0 ? (
        <StateCard
          tone="empty"
          title="No hay vacantes para este contexto"
          description="Prueba otro tenant, cambia el filtro o crea una nueva publicacion para poblar el pipeline."
          action={<button className="primary-button" type="button">Crear vacante</button>}
        />
      ) : (
        <SplitPanel
          left={
            <SectionCard title="Vacantes activas" subtitle="ATS con filtros">
              <DomainTable
                data={filtered}
                getKey={(job) => job.id}
                onSelect={(job) => setSelectedId(job.id)}
                columns={[
                  { key: "title", header: "Cargo", render: (job) => job.title },
                  { key: "area", header: "Area", render: (job) => job.area },
                  { key: "mode", header: "Modalidad", render: (job) => job.mode },
                  { key: "status", header: "Estado", render: (job) => job.status },
                  { key: "applicants", header: "Postulantes", render: (job) => job.applicants },
                ]}
              />
            </SectionCard>
          }
          right={
            selected ? (
              <DrawerPreview title={selected.title} subtitle="Preview lateral">
                <div className="detail-stack">
                  <div className="detail-row"><span>Area</span><strong>{selected.area}</strong></div>
                  <div className="detail-row"><span>Ciudad</span><strong>{selected.location}</strong></div>
                  <div className="detail-row"><span>Estado</span><strong>{selected.status}</strong></div>
                  <div className="detail-row"><span>Owner</span><strong>{selected.owner}</strong></div>
                  <div className="detail-row"><span>Postulaciones</span><strong>{selected.applicants}</strong></div>
                </div>
              </DrawerPreview>
            ) : (
              <StateCard
                tone="empty"
                title="Selecciona una vacante"
                description="El drawer lateral mostrara detalle, actividad reciente y siguientes acciones."
              />
            )
          }
        />
      )}
    </>
  );
}
