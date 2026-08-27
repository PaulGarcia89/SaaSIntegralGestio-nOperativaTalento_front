"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPublicVacancy, getCandidateSession } from "@/lib/backend";
import type { PublicVacancyDto } from "@/lib/contracts";
import { CandidateAuthCard } from "@/components/candidate-auth-card";
import { useCareerPortal } from "@/components/portal-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AsyncState } from "@/components/async-state";

export function CareerVacancyDetailLoader({ jobSlug }: { jobSlug: string }) {
  const { portal, isResolving } = useCareerPortal();
  const vacancy = useQuery({ queryKey: ["public-vacancy", portal?.portalId ?? "pending", jobSlug], queryFn: () => fetchPublicVacancy(jobSlug, portal?.slug), enabled: !isResolving && Boolean(portal?.slug), retry: false });
  if (isResolving || vacancy.isLoading) return <AsyncState state="loading" title="Cargando vacante" />;
  if (vacancy.isError || !vacancy.data) return <AsyncState state="error" title="No encontramos esta vacante" description="La publicación puede haber cerrado o no pertenece a este portal." />;
  return <CareerVacancyDetail vacancy={vacancy.data} />;
}

export function CareerVacancyDetail({ vacancy }: { vacancy: PublicVacancyDto }) {
  const { portal, isResolving } = useCareerPortal();
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(() => Boolean(getCandidateSession()));
  const requiresAuthentication = Boolean(portal?.requireLoginToViewJobs || portal?.accessType === "LOGIN_REQUIRED" || portal?.accessType === "INVITATION_ONLY");
  if (isResolving) return <main className="mx-auto max-w-4xl px-4 py-14 text-center">Resolviendo acceso...</main>;
  if (requiresAuthentication && !authenticated) return <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10"><section className="text-center"><Badge variant="secondary">Acceso protegido</Badge><h1 className="mt-3 text-3xl font-semibold">Inicia sesión para consultar esta vacante</h1><p className="mt-2 text-muted-foreground">Volverás al detalle después de autenticarte.</p></section><CandidateAuthCard returnPath={pathname} portalLabel={portal?.company?.name ? `el portal de ${portal.company.name}` : "este portal"} onAuthenticated={() => setAuthenticated(true)} /></main>;
  if (portal?.accessType === "ACCESS_CODE") return <main className="mx-auto max-w-2xl px-4 py-14 text-center"><Badge variant="warning">Código requerido</Badge><h1 className="mt-4 text-3xl font-semibold">Vacante protegida</h1><p className="mt-3 text-muted-foreground">Solicita a la empresa un código de acceso para consultar esta oportunidad.</p></main>;
  const requiresApplyLogin = Boolean(portal?.requireLoginToApply || portal?.accessType === "LOGIN_REQUIRED" || portal?.accessType === "INVITATION_ONLY");
  const applyPath = `/apply?vacancyId=${encodeURIComponent(vacancy.id)}`;
  const loginPath = `/applicant/login?returnUrl=${encodeURIComponent(applyPath)}`;
  return <main className="mx-auto w-full max-w-4xl px-4 py-10"><Card><CardContent className="space-y-5 p-6 md:p-8"><Badge>{vacancy.status ?? "OPEN"}</Badge><h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{vacancy.title}</h1><p className="text-muted-foreground">{vacancy.tenant?.name}</p><p className="whitespace-pre-line leading-7">{vacancy.description ?? vacancy.summary ?? "Consulta los detalles de esta oportunidad."}</p><Button asChild><Link href={requiresApplyLogin ? loginPath : applyPath}>Aplicar</Link></Button></CardContent></Card></main>;
}
