"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BrainCircuit, BriefcaseBusiness, CircleDot, FileText, Sparkles } from "lucide-react";
import { fetchCandidates } from "@/lib/mock-backend";
import { useAppStore } from "@/store/app-store";
import { DomainTable, FilterToolbar, StateCard } from "@/components/domain";
import { ModuleHeader, SectionCard } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function CandidatesPage() {
  const { currentTenant, can, hasModule } = useAppStore();
  const candidatesQuery = useQuery({
    queryKey: ["candidates", currentTenant.id],
    queryFn: () => fetchCandidates(currentTenant.id),
  });
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      (candidatesQuery.data ?? []).filter((candidate) =>
        [candidate.name, candidate.role, candidate.stage, candidate.summary]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [candidatesQuery.data, query],
  );

  const [selectedId, setSelectedId] = useState("");
  const selected = filtered.find((candidate) => candidate.id === selectedId) ?? filtered[0];

  if (!hasModule("ats") || !can("ats.view")) {
    return (
      <StateCard
        tone="restricted"
        title="Pipeline de postulantes no disponible"
        description="Esta empresa o rol no tiene acceso actualmente a la gestion de postulantes del ATS."
      />
    );
  }

  if (candidatesQuery.isLoading) {
    return <SectionCard title="Cargando postulantes" subtitle="ATS">Obteniendo perfiles de postulantes y etapas del pipeline.</SectionCard>;
  }

  return (
    <>
      <ModuleHeader
        eyebrow="Postulantes"
        title="Visibilidad del pipeline, busqueda de candidatos y detalle 360º en un solo flujo empresarial."
        description="Disenado para evolucionar hacia feedback colaborativo, scorecards, notas de entrevista y revision de perfil asistida por IA."
        actions={
          <Button asChild>
            <Link href="/ats/interviews">Ver entrevistas</Link>
          </Button>
        }
        metrics={[
          { label: "Postulantes activos", value: `${filtered.length}`, detail: "Perfiles visibles para la empresa y filtros actuales" },
          { label: "Etapas abiertas", value: "4", detail: "Filtro, entrevista, oferta y cierre en seguimiento" },
          { label: "Score promedio IA", value: "86", detail: "Promedio ponderado de compatibilidad sobre la muestra" },
        ]}
      />
      <div className="space-y-6 xl:space-y-8">
        <FilterToolbar
          searchPlaceholder="Buscar por postulante, cargo o etapa"
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
            title="No hay postulantes disponibles"
            description="La empresa seleccionada aun no tiene postulantes o el filtro activo no produjo resultados."
          />
        ) : (
          <div className="grid gap-5 xl:grid-cols-[1.18fr_0.82fr]">
            <SectionCard title="Tabla de postulantes" subtitle="Analitica ATS">
              <DomainTable
                data={filtered}
                getKey={(candidate) => candidate.id}
                onSelect={(candidate) => setSelectedId(candidate.id)}
                columns={[
                  { key: "name", header: "Postulante", render: (candidate) => candidate.name },
                  { key: "role", header: "Cargo", render: (candidate) => candidate.role },
                  { key: "stage", header: "Etapa", render: (candidate) => candidate.stage },
                  { key: "score", header: "Puntaje IA", render: (candidate) => candidate.score },
                ]}
              />
            </SectionCard>

            {selected ? (
              <SectionCard title={selected.name} subtitle="Vista 360 del postulante" className="h-full">
                <div className="space-y-6">
                  <div className="rounded-3xl border border-border/70 bg-secondary/25 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Perfil seleccionado</p>
                        <h3 className="text-2xl font-semibold tracking-tight text-foreground">{selected.name}</h3>
                        <p className="text-sm leading-6 text-muted-foreground">
                          Perfil con mayor tracción actual dentro del pipeline visible para esta empresa.
                        </p>
                      </div>
                      <Badge className="rounded-full px-3 py-1">{selected.score} pts IA</Badge>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div className="rounded-2xl border border-border/70 bg-card/90 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-2xl bg-secondary/60 text-primary">
                          <BriefcaseBusiness className="size-4" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Cargo</p>
                          <p className="font-medium text-foreground">{selected.role}</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-card/90 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-2xl bg-secondary/60 text-primary">
                          <CircleDot className="size-4" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Etapa actual</p>
                          <p className="font-medium text-foreground">{selected.stage}</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-card/90 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-2xl bg-secondary/60 text-primary">
                          <BrainCircuit className="size-4" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Puntaje IA</p>
                          <p className="font-medium text-foreground">{selected.score} / 100</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-secondary/20 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-2xl bg-secondary/60 text-primary">
                        <Sparkles className="size-4" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Resumen destacado</p>
                        <p className="mt-1 text-sm leading-7 text-muted-foreground">{selected.summary}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-dashed border-border/70 bg-secondary/15 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-2xl bg-secondary/60 text-primary">
                        <FileText className="size-4" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Siguiente accion sugerida</p>
                        <p className="mt-1 text-sm leading-7 text-muted-foreground">
                          Revisar scorecard, validar disponibilidad y preparar siguiente contacto desde entrevista o propuesta.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
