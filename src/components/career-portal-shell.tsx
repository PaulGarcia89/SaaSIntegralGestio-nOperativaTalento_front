"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
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
} from "@/components/system";
import { RevealGroup, RevealItem } from "@/components/public/motion";
import { CareersFilters, CareersHero, CareersProcess, type Facet } from "@/components/careers/careers-sections";
import { VacancyCard } from "@/components/careers/vacancy-card";
import { technicalLabel } from "@/lib/ui-labels";
import type { PublicVacancyDto } from "@/lib/contracts";
import { useLocale } from "@/components/locale-provider";

/**
 * Portal público de empleo.
 *
 * Es la única pantalla que ve alguien que todavía no es cliente ni empleado,
 * así que se rehízo con la misma gramática de la portada: fondo grafito con
 * retícula y luz ámbar, entradas cortas y escalonadas, y el producto contado
 * con piezas de verdad.
 *
 * Qué cambió respecto de la versión anterior
 * ------------------------------------------
 * · El buscador era un campo suelto bajo el titular. Ahora vive DENTRO del
 *   hero, con 56 px de alto y botón de borrar: en un portal de empleo,
 *   buscar es la primera acción, no una más.
 * · No había forma de acotar. Se añaden facetas —modalidad, área, ciudad—
 *   calculadas sobre las vacantes que hay: si nadie publica remoto, «Remoto»
 *   no aparece. Cada botón lleva su recuento.
 * · Las tarjetas eran una foto, dos insignias y un botón. Ahora dicen lo que
 *   se pregunta antes de abrir una oferta: jornada, sueldo cuando existe y
 *   número de plazas; la tarjeta entera es pulsable con un solo elemento
 *   enfocable.
 * · Sin fotografía, la tarjeta ya no pone una imagen de archivo: pinta un
 *   panel de marca con el icono del área.
 * · Se añade «cómo es postularse» y el acceso a seguir la postulación, que
 *   es la duda que de verdad tiene quien está mirando ofertas.
 *
 * Se conserva: la tipografía de marca del inquilino
 * (`--career-font-family`) en titular y descripción, los tres estados
 * (cargando, error, vacío) resueltos con los componentes del sistema, y el
 * comportamiento de portales protegidos y por invitación.
 */
export function CareerPortalShell({ basePath = "/jobs" }: { basePath?: string }) {
  const { portal, isResolving } = useCareerPortal();
  const { locale, t } = useLocale();
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(() => Boolean(getCandidateSession()));
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string | null>>({ workMode: null, department: null, city: null });

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
  const vacancies = useMemo(() => vacanciesQuery.data?.data ?? [], [vacanciesQuery.data]);
  const normalized = search.trim().toLocaleLowerCase(locale);

  /** Texto libre: título, área, ciudad, modalidad o empresa. */
  const searched = useMemo(
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

  // Las facetas se calculan sobre lo que la búsqueda deja, para que los
  // recuentos digan la verdad: pulsar un filtro da exactamente ese número.
  const facets = useMemo(() => {
    const build = (pick: (vacancy: PublicVacancyDto) => string | null | undefined, label: (value: string) => string): Facet[] => {
      const counts = new Map<string, number>();
      for (const vacancy of searched) {
        const value = pick(vacancy)?.trim();
        if (!value) continue;
        counts.set(value, (counts.get(value) ?? 0) + 1);
      }
      return [...counts.entries()]
        .sort(([a, countA], [b, countB]) => countB - countA || a.localeCompare(b, locale))
        .slice(0, 6)
        .map(([value, count]) => ({ value, label: label(value), count }));
    };
    return [
      { key: "workMode", label: t("careers.facet.workMode"), options: build((vacancy) => vacancy.workMode, (value) => technicalLabel(value)) },
      { key: "department", label: t("careers.facet.department"), options: build((vacancy) => vacancy.department, (value) => value) },
      { key: "city", label: t("careers.facet.city"), options: build((vacancy) => vacancy.city, (value) => value) },
    ];
  }, [searched, locale, t]);

  const visible = useMemo(
    () =>
      searched.filter(
        (vacancy) =>
          (!filters.workMode || vacancy.workMode === filters.workMode) &&
          (!filters.department || vacancy.department === filters.department) &&
          (!filters.city || vacancy.city === filters.city),
      ),
    [searched, filters],
  );

  const cities = useMemo(() => new Set(vacancies.map((vacancy) => vacancy.city).filter(Boolean)).size, [vacancies]);
  const companies = useMemo(() => new Set(vacancies.map((vacancy) => vacancy.tenant?.id).filter(Boolean)).size, [vacancies]);
  const filtering = Object.values(filters).some(Boolean);
  const searching = normalized.length > 0;

  if (isResolving) {
    return (
      <div className="mx-auto w-full max-w-[1280px] px-4 py-8">
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

  return (
    <div className="min-w-0 bg-canvas">
      <CareersHero
        portal={portal}
        search={search}
        onSearch={setSearch}
        total={vacanciesQuery.isSuccess ? vacancies.length : null}
        cities={cities}
        companies={companies}
      >
        <div className="mb-8">
          <CandidateNav vacanciesHref={basePath} tone="dark" />
        </div>
      </CareersHero>

      <div className="mx-auto w-full min-w-0 max-w-[1280px] px-4 sm:px-6">
        <section aria-labelledby="vacantes" className="py-10 sm:py-14">
          <h2 id="vacantes" className="sr-only">
            {t("jobs.available")}
          </h2>

          {vacanciesQuery.isSuccess && vacancies.length > 0 ? (
            <div className="mb-8">
              <CareersFilters
                facets={facets}
                selected={filters}
                onSelect={(key, value) => setFilters((current) => ({ ...current, [key]: value }))}
                onClear={() => setFilters({ workMode: null, department: null, city: null })}
                resultCount={visible.length}
                totalCount={vacancies.length}
              />
            </div>
          ) : null}

          {vacanciesQuery.isLoading ? (
            <SkeletonRows rows={6} label={t("jobs.loading")} />
          ) : vacanciesQuery.isError ? (
            <ErrorState
              title={t("jobs.error")}
              detail={getApiErrorMessage(vacanciesQuery.error, t("jobs.tryAgain"))}
              onRetry={() => void vacanciesQuery.refetch()}
            />
          ) : visible.length === 0 ? (
            // Distinguir «no hay vacantes» de «tu búsqueda no encuentra nada»
            // es lo único que quien busca necesita saber para decidir qué hacer.
            <EmptyState
              reason={searching || filtering ? "no-matches" : "no-records"}
              title={searching || filtering ? t("jobs.noMatches") : t("jobs.noVacancies")}
              description={searching || filtering ? t("jobs.tryAgain") : t("jobs.noVacanciesHelp")}
              onClearFilters={
                searching || filtering
                  ? () => {
                      setSearch("");
                      setFilters({ workMode: null, department: null, city: null });
                    }
                  : undefined
              }
            />
          ) : (
            <RevealGroup as="ul" className="grid min-w-0 gap-5 md:grid-cols-2 xl:grid-cols-3 [&>li]:min-w-0" stagger={0.06}>
              {visible.map((vacancy) => (
                <RevealItem as="li" key={vacancy.id}>
                  <VacancyCard
                    vacancy={vacancy}
                    href={`${basePath}/${encodeURIComponent((vacancy as PublicVacancyDto).slug ?? vacancy.id)}`}
                  />
                </RevealItem>
              ))}
            </RevealGroup>
          )}
        </section>

        <CareersProcess trackHref="/application-status" />
      </div>
    </div>
  );
}
