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
import { CandidateNav } from "@/components/candidate-nav";
import { AsyncState } from "@/components/async-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { technicalLabel } from "@/lib/ui-labels";
import type { PublicVacancyDto } from "@/lib/contracts";
import { useLocale } from "@/components/locale-provider";

export function CareerPortalShell({ basePath = "/jobs" }: { basePath?: string }) {
  const { portal, isResolving } = useCareerPortal();
  const { locale, t } = useLocale();
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(() => Boolean(getCandidateSession()));
  const [search, setSearch] = useState("");
  const requiresAuthentication = Boolean(portal?.requireLoginToViewJobs || portal?.accessType === "LOGIN_REQUIRED" || portal?.accessType === "INVITATION_ONLY");
  const vacanciesQuery = useQuery({ queryKey: ["public-vacancies", portal?.portalId ?? "pending", search, locale], queryFn: () => fetchPublicVacancies(search, portal?.slug), enabled: !isResolving && (!requiresAuthentication || authenticated) });
  const vacancies = vacanciesQuery.data?.data ?? [];
  const normalized = search.trim().toLocaleLowerCase(locale);
  const visible = useMemo(
    () => vacancies.filter((vacancy) => !normalized || [vacancy.title, vacancy.department, vacancy.city, vacancy.workMode, vacancy.tenant?.name].some((value) => value?.toLocaleLowerCase(locale).includes(normalized))),
    [vacancies, normalized, locale],
  );

  if (isResolving) return <AsyncState state="loading" title={t("jobs.resolvingPortal")} />;
  if (requiresAuthentication && !authenticated) return <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 pb-14 pt-8"><section className="space-y-3 text-center"><Badge variant="secondary">{t("jobs.protectedAccess")}</Badge><h1 className="text-4xl font-semibold tracking-tight">{t("jobs.loginToView")}</h1><p className="mx-auto max-w-2xl text-muted-foreground">{t("jobs.protectedDescription")}</p></section><CandidateAuthCard returnPath={pathname} portalLabel={portal?.company?.name ?? t("applicant.portalFallback")} onAuthenticated={() => setAuthenticated(true)} /></div>;
  if (portal?.accessType === "ACCESS_CODE") return <div className="mx-auto max-w-2xl px-4 py-14 text-center"><Badge variant="warning">{t("jobs.codeRequired")}</Badge><h1 className="mt-4 text-3xl font-semibold">{t("jobs.invitationRequired")}</h1><p className="mt-3 text-muted-foreground">{t("jobs.requestCode")}</p></div>;

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 pb-14 pt-2">
      <CandidateNav vacanciesHref={basePath} />
      {portal?.branding.logo ? <div className="flex items-center gap-3 px-1" style={{ fontFamily: "var(--career-font-family)" }}><Image src={portal.branding.logo} alt={`Logo de ${portal.company?.name ?? "la empresa"}`} width={48} height={48} unoptimized className="size-12 rounded-xl object-contain" /><span className="text-lg font-semibold">{portal.company?.name}</span></div> : null}
      <section className="space-y-6 rounded-[2rem] border border-border/70 bg-card/92 p-6 shadow-[0_18px_60px_-32px_rgba(15,23,42,0.28)] md:p-10">
        <Badge variant="secondary" className="rounded-full">{portal?.type === "BRANDED" ? t("jobs.careerSite") : portal?.type === "PRIVATE_STANDARD" ? t("jobs.privatePortal") : t("jobs.jobsPortal")}</Badge>
        <div className="max-w-3xl space-y-3" style={{ fontFamily: "var(--career-font-family)" }}>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{portal?.branding.title ?? t("jobs.defaultTitle")}</h1>
          <p className="text-base leading-8 text-muted-foreground">{portal?.branding.description ?? t("jobs.defaultDescription")}</p>
        </div>
        <label className="relative block max-w-2xl">
          <span className="sr-only">{t("jobs.searchLabel")}</span>
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("jobs.searchPlaceholder")} className="h-12 rounded-2xl pl-12" />
        </label>
      </section>
      {vacanciesQuery.isLoading ? <AsyncState state="loading" title={t("jobs.loading")} /> : null}
      {vacanciesQuery.isError ? <AsyncState state="error" description={t("jobs.error")} onRetry={() => void vacanciesQuery.refetch()} /> : null}
      {vacanciesQuery.isSuccess && visible.length === 0 ? <Card className="border-dashed"><CardContent className="py-14 text-center"><h2 className="text-xl font-semibold">{t("jobs.noMatches")}</h2><p className="mt-2 text-sm text-muted-foreground">{t("jobs.tryAgain")}</p></CardContent></Card> : null}
      {visible.length > 0 ? <section aria-label={t("jobs.available")} className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{visible.map((vacancy) => <Card key={vacancy.id} className="flex flex-col overflow-hidden border-border/70 bg-card/95"><VacancyImage imageUrl={vacancy.imageUrl} title={vacancy.title} /><CardContent className="flex flex-1 flex-col gap-5 p-6"><div className="flex flex-wrap gap-2"><Badge>{vacancy.department || t("jobs.job")}</Badge>{vacancy.employmentType ? <Badge variant="secondary">{vacancy.employmentType}</Badge> : null}</div><div className="space-y-2"><h2 className="text-2xl font-semibold tracking-tight">{vacancy.title}</h2><p className="text-sm text-muted-foreground">{vacancy.tenant?.name}</p></div><p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{vacancy.summary || vacancy.description || t("jobs.defaultSummary")}</p><div className="mt-auto flex flex-wrap gap-2 text-sm text-muted-foreground"><span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5"><BriefcaseBusiness className="size-4" />{technicalLabel(vacancy.workMode)}</span></div><Button asChild className="w-full"><Link href={`${basePath}/${encodeURIComponent((vacancy as PublicVacancyDto).slug ?? vacancy.id)}`}>{t("jobs.viewAndApply")} <ArrowRight className="size-4" /></Link></Button></CardContent></Card>)}</section> : null}
    </div>
  );
}

function VacancyImage({ imageUrl, title }: { imageUrl?: string | null; title: string }) {
  const [hasError, setHasError] = useState(false);
  const source = !imageUrl || hasError ? "/images/vacancies/operations-leadership-fallback.png" : imageUrl;
  return <div className="relative flex aspect-[16/7] items-center justify-center overflow-hidden bg-gradient-to-br from-primary/15 via-secondary to-cyan-100/50"><Image src={source} alt={`Imagen representativa del cargo ${title}`} fill unoptimized className="object-cover transition duration-300 hover:scale-[1.02]" onError={() => setHasError(true)} /></div>;
}
