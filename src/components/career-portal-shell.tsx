"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, Search } from "lucide-react";
import { fetchPublicVacancies, getCandidateSession } from "@/lib/backend";
import { useCareerPortal } from "@/components/portal-context";
import { CandidateAuthCard } from "@/components/candidate-auth-card";
import { AsyncState } from "@/components/async-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { technicalLabel } from "@/lib/ui-labels";
import type { PublicVacancyDto } from "@/lib/contracts";

export function CareerPortalShell({ basePath = "/jobs" }: { basePath?: string }) {
  const { portal, isResolving } = useCareerPortal();
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(() => Boolean(getCandidateSession()));
  const [search, setSearch] = useState("");
  const requiresAuthentication = Boolean(portal?.requireLoginToViewJobs || portal?.accessType === "LOGIN_REQUIRED" || portal?.accessType === "INVITATION_ONLY");
  const vacanciesQuery = useQuery({ queryKey: ["public-vacancies", portal?.portalId ?? "pending", search], queryFn: () => fetchPublicVacancies(search, portal?.slug), enabled: !isResolving && (!requiresAuthentication || authenticated) });
  const vacancies = vacanciesQuery.data?.data ?? [];
  const normalized = search.trim().toLocaleLowerCase("es");
  const visible = useMemo(
    () => vacancies.filter((vacancy) => !normalized || [vacancy.title, vacancy.department, vacancy.city, vacancy.workMode, vacancy.tenant?.name].some((value) => value?.toLocaleLowerCase("es").includes(normalized))),
    [vacancies, normalized],
  );

  if (isResolving) return <AsyncState state="loading" title="Resolviendo portal" />;
  if (requiresAuthentication && !authenticated) return <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 pb-14 pt-8"><section className="space-y-3 text-center"><Badge variant="secondary">Acceso protegido</Badge><h1 className="text-4xl font-semibold tracking-tight">Inicia sesión para ver las vacantes</h1><p className="mx-auto max-w-2xl text-muted-foreground">Este portal está reservado para candidatos autorizados. Después de autenticarte volverás automáticamente a esta página.</p></section><CandidateAuthCard returnPath={pathname} portalLabel={portal?.company?.name ? `el portal de ${portal.company.name}` : "este portal"} onAuthenticated={() => setAuthenticated(true)} /></div>;
  if (portal?.accessType === "ACCESS_CODE") return <div className="mx-auto max-w-2xl px-4 py-14 text-center"><Badge variant="warning">Código requerido</Badge><h1 className="mt-4 text-3xl font-semibold">Este portal requiere una invitación</h1><p className="mt-3 text-muted-foreground">Solicita a la empresa un código de acceso válido para continuar.</p></div>;

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 pb-14 pt-2">
      <section className="space-y-6 rounded-[2rem] border border-border/70 bg-card/92 p-6 shadow-[0_18px_60px_-32px_rgba(15,23,42,0.28)] md:p-10">
        <Badge variant="secondary" className="rounded-full">{portal?.type === "BRANDED" ? "Career site" : portal?.type === "PRIVATE_STANDARD" ? "Portal privado" : "Portal de empleos"}</Badge>
        <div className="max-w-3xl space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{portal?.branding.title ?? "Encuentra una oportunidad que encaje contigo."}</h1>
          <p className="text-base leading-8 text-muted-foreground">{portal?.branding.description ?? "Vacantes reales publicadas por las empresas autorizadas en este portal."}</p>
        </div>
        <label className="relative block max-w-2xl">
          <span className="sr-only">Buscar vacantes</span>
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cargo, área, ciudad, empresa o modalidad" className="h-12 rounded-2xl pl-12" />
        </label>
      </section>
      {vacanciesQuery.isLoading ? <AsyncState state="loading" title="Consultando vacantes" /> : null}
      {vacanciesQuery.isError ? <AsyncState state="error" description="No pudimos consultar las vacantes reales." onRetry={() => void vacanciesQuery.refetch()} /> : null}
      {vacanciesQuery.isSuccess && visible.length === 0 ? <Card className="border-dashed"><CardContent className="py-14 text-center"><h2 className="text-xl font-semibold">No hay vacantes que coincidan</h2><p className="mt-2 text-sm text-muted-foreground">Prueba otra búsqueda o vuelve más tarde.</p></CardContent></Card> : null}
      {visible.length > 0 ? <section aria-label="Vacantes disponibles" className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{visible.map((vacancy) => <Card key={vacancy.id} className="flex flex-col overflow-hidden border-border/70 bg-card/95"><VacancyImage imageUrl={vacancy.imageUrl} title={vacancy.title} /><CardContent className="flex flex-1 flex-col gap-5 p-6"><div className="flex flex-wrap gap-2"><Badge>{vacancy.department || "Vacante"}</Badge>{vacancy.employmentType ? <Badge variant="secondary">{vacancy.employmentType}</Badge> : null}</div><div className="space-y-2"><h2 className="text-2xl font-semibold tracking-tight">{vacancy.title}</h2><p className="text-sm text-muted-foreground">{vacancy.tenant?.name}</p></div><p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{vacancy.summary || vacancy.description || "Consulta el detalle y los requisitos antes de postularte."}</p><div className="mt-auto flex flex-wrap gap-2 text-sm text-muted-foreground"><span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5"><BriefcaseBusiness className="size-4" />{technicalLabel(vacancy.workMode)}</span></div><Button asChild className="w-full"><Link href={`${basePath}/${encodeURIComponent((vacancy as PublicVacancyDto).slug ?? vacancy.id)}`}>Ver y postularme <ArrowRight className="size-4" /></Link></Button></CardContent></Card>)}</section> : null}
    </div>
  );
}

function VacancyImage({ imageUrl, title }: { imageUrl?: string | null; title: string }) {
  const [hasError, setHasError] = useState(false);
  const source = !imageUrl || hasError ? "/images/vacancies/operations-leadership-fallback.png" : imageUrl;
  return <div className="relative flex aspect-[16/7] items-center justify-center overflow-hidden bg-gradient-to-br from-primary/15 via-secondary to-cyan-100/50"><Image src={source} alt={`Imagen representativa del cargo ${title}`} fill unoptimized className="object-cover transition duration-300 hover:scale-[1.02]" onError={() => setHasError(true)} /></div>;
}
