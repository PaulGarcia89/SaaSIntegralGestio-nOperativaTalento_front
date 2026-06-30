"use client";

import { useMemo, useState } from "react";
import { DomainTable, DrawerPreview, FilterToolbar, StateCard } from "@/components/domain";
import { PageIntro, SectionCard, SplitPanel } from "@/components/ui";
import { useAppStore } from "@/store/app-store";

export default function CandidatesPage() {
  const { datasets, can, hasModule } = useAppStore();
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () =>
      datasets.candidates.filter((candidate) =>
        [candidate.name, candidate.role, candidate.stage, candidate.summary]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [datasets.candidates, query],
  );
  const [selectedId, setSelectedId] = useState(filtered[0]?.id ?? "");
  const selected = filtered.find((candidate) => candidate.id === selectedId) ?? filtered[0];

  if (!hasModule("ats") || !can("ats.view")) {
    return (
      <StateCard
        tone="restricted"
        title="Postulantes no disponibles"
        description="El tenant o el rol actual no tienen acceso a esta vista del pipeline."
      />
    );
  }

  return (
    <>
      <PageIntro
        eyebrow="Gestion de postulantes"
        title="Pipeline visible, tabla filtrable y perfil 360 en una sola pantalla."
        description="Esta configuracion esta pensada para escalar luego hacia timeline, feedback colaborativo y scorecards."
      />
      <FilterToolbar
        searchPlaceholder="Buscar por candidato, rol o etapa"
        options={[
          { label: "Todos", value: "" },
          { label: "Entrevista", value: "entrevista" },
          { label: "Oferta", value: "oferta" },
          { label: "Filtro", value: "filtro" },
        ]}
        activeValue={query}
        onChange={setQuery}
      />
      {filtered.length === 0 ? (
        <StateCard
          tone="empty"
          title="No hay postulantes para mostrar"
          description="Este tenant aun no tiene candidatos o el filtro dejo la tabla vacia."
        />
      ) : (
        <SplitPanel
          left={
            <SectionCard title="Candidatos en proceso" subtitle="Vista analitica">
              <DomainTable
                data={filtered}
                getKey={(candidate) => candidate.id}
                onSelect={(candidate) => setSelectedId(candidate.id)}
                columns={[
                  { key: "name", header: "Nombre", render: (candidate) => candidate.name },
                  { key: "role", header: "Rol", render: (candidate) => candidate.role },
                  { key: "stage", header: "Etapa", render: (candidate) => candidate.stage },
                  { key: "score", header: "Score IA", render: (candidate) => candidate.score },
                ]}
              />
            </SectionCard>
          }
          right={
            selected ? (
              <DrawerPreview title={selected.name} subtitle="Perfil 360">
                <div className="detail-stack">
                  <div className="detail-row"><span>Rol</span><strong>{selected.role}</strong></div>
                  <div className="detail-row"><span>Etapa</span><strong>{selected.stage}</strong></div>
                  <div className="detail-row"><span>Score IA</span><strong>{selected.score}</strong></div>
                  <p className="drawer-copy">{selected.summary}</p>
                </div>
              </DrawerPreview>
            ) : null
          }
        />
      )}
    </>
  );
}
