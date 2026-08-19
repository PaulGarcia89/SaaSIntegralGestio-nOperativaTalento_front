"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BriefcaseBusiness, MapPin, Search } from "lucide-react";
import { fetchPublicVacancies } from "@/lib/backend";
import { AsyncState } from "@/components/async-state";
import { CandidateNav } from "@/components/candidate-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { technicalLabel } from "@/lib/ui-labels";

export default function JobsPortalPage() {
  const [search, setSearch] = useState("");
  const vacanciesQuery = useQuery({ queryKey: ["public-vacancies"], queryFn: () => fetchPublicVacancies() });
  const vacancies = vacanciesQuery.data?.data ?? [];
  const normalized = search.trim().toLocaleLowerCase("es");
  const visible = vacancies.filter((vacancy) => !normalized || [vacancy.title, vacancy.department, vacancy.city, vacancy.workMode, vacancy.tenant?.name].some((value) => value?.toLocaleLowerCase("es").includes(normalized)));

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 pb-14 pt-2">
      <CandidateNav />
      <section className="space-y-6 rounded-[2rem] border border-border/70 bg-card/92 p-6 shadow-[0_18px_60px_-32px_rgba(15,23,42,0.28)] md:p-10">
        <Badge variant="secondary" className="rounded-full">Portal de empleos</Badge>
        <div className="max-w-3xl space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Encuentra una oportunidad que encaje contigo.</h1>
          <p className="text-base leading-8 text-muted-foreground">Todas las vacantes mostradas provienen del servicio de contratación y aceptan postulaciones reales.</p>
        </div>
        <label className="relative block max-w-2xl">
          <span className="sr-only">Buscar vacantes</span>
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cargo, área, ciudad, empresa o modalidad" className="h-12 rounded-2xl pl-12" />
        </label>
      </section>

      {vacanciesQuery.isLoading ? <AsyncState state="loading" title="Consultando vacantes" /> : null}
      {vacanciesQuery.isError ? <AsyncState state="error" description="No pudimos consultar las vacantes reales. Ningún dato demostrativo fue utilizado." onRetry={() => void vacanciesQuery.refetch()} /> : null}
      {vacanciesQuery.isSuccess && visible.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-14 text-center"><h2 className="text-xl font-semibold">No hay vacantes que coincidan</h2><p className="mt-2 text-sm text-muted-foreground">Prueba otra búsqueda o vuelve más tarde.</p></CardContent></Card>
      ) : null}
      {visible.length > 0 ? (
        <section aria-label="Vacantes disponibles" className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((vacancy) => (
            <Card key={vacancy.id} className="flex flex-col overflow-hidden border-border/70 bg-card/95">
              <VacancyImage imageUrl={vacancy.imageUrl} title={vacancy.title} />
              <CardContent className="flex flex-1 flex-col gap-5 p-6">
                <div className="flex flex-wrap gap-2"><Badge>{vacancy.department || "Vacante"}</Badge>{vacancy.employmentType ? <Badge variant="secondary">{vacancy.employmentType}</Badge> : null}</div>
                <div className="space-y-2"><h2 className="text-2xl font-semibold tracking-tight">{vacancy.title}</h2><p className="text-sm text-muted-foreground">{vacancy.tenant?.name}</p></div>
                <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{vacancy.summary || vacancy.description || "Consulta el detalle y los requisitos antes de postularte."}</p>
                <div className="mt-auto flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5"><MapPin className="size-4" />{[vacancy.city, vacancy.country].filter(Boolean).join(", ") || vacancy.branch?.location || "Ubicación por confirmar"}</span>
                  {vacancy.workMode ? <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5"><BriefcaseBusiness className="size-4" />{technicalLabel(vacancy.workMode)}</span> : null}
                </div>
                <Button asChild className="w-full"><Link href={`/apply?vacancyId=${encodeURIComponent(vacancy.id)}`}>Ver y postularme <ArrowRight className="size-4" /></Link></Button>
              </CardContent>
            </Card>
          ))}
        </section>
      ) : null}
    </div>
  );
}

function VacancyImage({ imageUrl, title }: { imageUrl?: string | null; title: string }) {
  const [hasError, setHasError] = useState(false);
  const source = !imageUrl || hasError ? "/images/vacancies/operations-leadership-fallback.png" : imageUrl;
  const alt = imageUrl
    ? `Imagen representativa del cargo ${title}`
    : `Equipo de liderazgo operativo, imagen descriptiva para la vacante ${title}`;

  return (
    <div className="relative flex aspect-[16/7] items-center justify-center overflow-hidden bg-gradient-to-br from-primary/15 via-secondary to-cyan-100/50">
      <Image
        src={source}
        alt={alt}
        fill
        unoptimized
        className="object-cover transition duration-300 hover:scale-[1.02]"
        onError={() => setHasError(true)}
      />
      {!imageUrl || hasError ? <span className="absolute bottom-3 left-3 rounded-full bg-slate-950/65 px-3 py-1 text-xs font-medium text-white">Imagen ilustrativa</span> : null}
    </div>
  );
}
