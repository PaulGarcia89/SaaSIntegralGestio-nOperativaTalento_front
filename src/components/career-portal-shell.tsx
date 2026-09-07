"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, Search } from "lucide-react";
import { fetchPublicVacancies, getApiErrorMessage, getCandidateSession } from "@/lib/backend";
import { useCareerPortal } from "@/components/portal-context";
import { CandidateAuthCard } from "@/components/candidate-auth-card";
import { CandidateNav } from "@/components/candidate-nav";
import {
  BlockedState,
  EmptyState,
  ErrorState,
  PageHeader,
  SkeletonRows,
  StatusBadge,
} from "@/components/system";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { technicalLabel } from "@/lib/ui-labels";
import type { PublicVacancyDto } from "@/lib/contracts";
import { useLocale } from "@/components/locale-provider";

/**
 * Portal público de empleo.
 *
 * Se había quedado con el modelo anterior mientras el resto del producto
 * cambiaba, y es la única pantalla que ve alguien que todavía no es cliente:
 * la primera impresión del producto se daba con la geometría vieja.
 *
 * Qué cambió
 * ----------
 * · Radios de `2rem` y `2xl`, titulares a `text-5xl` y un campo de búsqueda de
 *   48 px de alto: la escala anterior. Ahora usa `PageHeader` y los radios del
 *   sistema, los mismos que el producto al que se entra después.
 * · Los tres estados —cargando, error, sin resultados— estaban resueltos a
 *   mano con tarjetas propias. Pasan a `SkeletonRows`, `ErrorState` y
 *   `EmptyState`, que además distinguen «no hay vacantes» de «tu búsqueda no
 *   encuentra nada», que es lo único que quien busca necesita saber.
 * · El error decía siempre lo mismo y ocultaba lo que respondió el servidor.
 * · El acceso restringido por código era un texto centrado sin salida: quien
 *   llega sin código no sabía a quién pedirlo. Pasa a `BlockedState`, que
 *   nombra al responsable.
 * · La imagen de la vacante usaba un degradado `from-primary/15 via-secondary`
 *   que en la práctica no se ve nunca, porque encima va la foto a `object-cover`.
 *
 * Lo que se conserva: la tipografía de marca del inquilino
 * (`--career-font-family`) sigue aplicándose al titular y a la descripción,
 * que es donde una empresa quiere reconocerse.
 */
export function CareerPortalShell({ basePath = "/jobs" }: { basePath?: string }) {
  const { portal, isResolving } = useCareerPortal();
  const { locale, t } = useLocale();
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(() => Boolean(getCandidateSession()));
  const [search, setSearch] = useState("");
  const requiresAuthentication = Boolean(
    portal?.requireLoginToViewJobs ||
      portal?.accessType === "LOGIN_REQUIRED" ||
      portal?.accessType === "INVITATION_ONLY",
  );
  const vacanciesQuery = useQuery({
    queryKey: ["public-vacancies", portal?.portalId ?? "pending", search, locale],
    queryFn: () => fetchPublicVacancies(search, portal?.slug),
    enabled: !isResolving && (!requiresAuthentication || authenticated),
  });
  const vacancies = vacanciesQuery.data?.data ?? [];
  const normalized = search.trim().toLocaleLowerCase(locale);
  const visible = useMemo(
    () =>
      vacancies.filter(
        (vacancy) =>
          !normalized ||
          [vacancy.title, vacancy.department, vacancy.city, vacancy.workMode, vacancy.tenant?.name].some((value) =>
            value?.toLocaleLowerCase(locale).includes(normalized),
          ),
      ),
    [vacancies, normalized, locale],
  );

  if (isResolving) {
    return (
      <div className="mx-auto w-full max-w-[1440px] px-4 py-8">
        <SkeletonRows rows={4} label={t("jobs.resolvingPortal")} />
      </div>
    );
  }

  if (requiresAuthentication && !authenticated) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-14 pt-8">
        <PageHeader
          eyebrow={t("jobs.protectedAccess")}
          title={t("jobs.loginToView")}
          description={t("jobs.protectedDescription")}
        />
        <CandidateAuthCard
          returnPath={pathname}
          portalLabel={portal?.company?.name ?? t("applicant.portalFallback")}
          onAuthenticated={() => setAuthenticated(true)}
        />
      </div>
    );
  }

  if (portal?.accessType === "ACCESS_CODE") {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-14">
        <BlockedState
          title={t("jobs.invitationRequired")}
          cause={t("jobs.requestCode")}
          owner={portal?.company?.name ?? t("applicant.portalFallback")}
          resolution={t("jobs.requestCodeResolution")}
        />
      </div>
    );
  }

  const searching = normalized.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-[1440px] min-w-0 flex-col gap-6 pb-14 pt-2">
      <CandidateNav vacanciesHref={basePath} />

      <div className="min-w-0 px-4">
        {portal?.branding.logo ? (
          <div className="mb-5 flex items-center gap-3">
            <Image
              src={portal.branding.logo}
              alt={`Logo de ${portal.company?.name ?? "la empresa"}`}
              width={40}
              height={40}
              unoptimized
              className="size-10 rounded-md object-contain"
            />
            <span className="min-w-0 truncate text-base font-semibold text-ink-1">{portal.company?.name}</span>
          </div>
        ) : null}

        <div style={{ fontFamily: "var(--career-font-family)" }}>
          <PageHeader
            eyebrow={
              portal?.type === "BRANDED"
                ? t("jobs.careerSite")
                : portal?.type === "PRIVATE_STANDARD"
                  ? t("jobs.privatePortal")
                  : t("jobs.jobsPortal")
            }
            title={portal?.branding.title ?? t("jobs.defaultTitle")}
            description={portal?.branding.description ?? t("jobs.defaultDescription")}
          />
        </div>

        <label className="relative mt-6 block max-w-2xl">
          <span className="sr-only">{t("jobs.searchLabel")}</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("jobs.searchPlaceholder")}
            className="pl-10"
            autoComplete="off"
          />
        </label>
      </div>

      <div className="min-w-0 px-4">
        {vacanciesQuery.isLoading ? (
          <SkeletonRows rows={6} label={t("jobs.loading")} />
        ) : vacanciesQuery.isError ? (
          <ErrorState
            title={t("jobs.error")}
            detail={getApiErrorMessage(vacanciesQuery.error, t("jobs.tryAgain"))}
            onRetry={() => void vacanciesQuery.refetch()}
          />
        ) : visible.length === 0 ? (
          // Distinguir «no hay vacantes» de «tu búsqueda no encuentra nada» es
          // lo único que quien busca necesita saber para decidir qué hacer.
          <EmptyState
            reason={searching ? "no-matches" : "no-records"}
            title={searching ? t("jobs.noMatches") : t("jobs.noVacancies")}
            description={searching ? t("jobs.tryAgain") : t("jobs.noVacanciesHelp")}
            onClearFilters={searching ? () => setSearch("") : undefined}
          />
        ) : (
          <section aria-label={t("jobs.available")} className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((vacancy) => (
              <article
                key={vacancy.id}
                className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-line bg-surface-1"
              >
                <VacancyImage imageUrl={vacancy.imageUrl} title={vacancy.title} />
                <div className="flex flex-1 flex-col gap-4 p-5">
                  <div className="flex flex-wrap gap-2">
                    {vacancy.department ? (
                      <StatusBadge size="sm" tone="neutral" label={vacancy.department} />
                    ) : null}
                    {vacancy.employmentType ? (
                      <StatusBadge size="sm" tone="neutral" label={technicalLabel(vacancy.employmentType)} />
                    ) : null}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <h2 className="text-lg font-semibold text-ink-1">{vacancy.title}</h2>
                    <p className="truncate text-sm text-ink-2">{vacancy.tenant?.name}</p>
                  </div>

                  <p className="line-clamp-3 text-sm leading-relaxed text-ink-2">
                    {vacancy.summary || vacancy.description || t("jobs.defaultSummary")}
                  </p>

                  <p className="flex flex-wrap items-center gap-2 text-2xs text-ink-3">
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-line px-2 py-1">
                      <BriefcaseBusiness className="size-3.5" aria-hidden="true" />
                      {technicalLabel(vacancy.workMode)}
                    </span>
                    {vacancy.city ? <span>{vacancy.city}</span> : null}
                  </p>

                  <Button asChild className="mt-auto w-full">
                    <Link
                      href={`${basePath}/${encodeURIComponent((vacancy as PublicVacancyDto).slug ?? vacancy.id)}`}
                    >
                      {t("jobs.viewAndApply")}
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}

function VacancyImage({ imageUrl, title }: { imageUrl?: string | null; title: string }) {
  const [hasError, setHasError] = useState(false);
  const source = !imageUrl || hasError ? "/images/vacancies/operations-leadership-fallback.png" : imageUrl;
  return (
    // El degradado anterior no se veía nunca: encima va la foto a `object-cover`.
    <div className="relative flex aspect-[16/7] items-center justify-center overflow-hidden bg-surface-2">
      <Image
        src={source}
        alt={`Imagen representativa del cargo ${title}`}
        fill
        unoptimized
        className="object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  );
}
