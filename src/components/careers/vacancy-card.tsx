"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ArrowRight, Building2, ChefHat, ClipboardList, Clock3, MapPin, Package, Sparkles, UtensilsCrossed, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";
import { technicalLabel } from "@/lib/ui-labels";
import type { PublicVacancyDto } from "@/lib/contracts";

/* ==========================================================================
   TARJETA DE VACANTE
   ==========================================================================
   La tarjeta que decide si alguien abre la oferta o sigue de largo. Lleva,
   en este orden: qué puesto es, dónde y con quién, de qué va, y las tres
   condiciones que más se preguntan (modalidad, jornada, sueldo si lo hay).

   La tarjeta entera es pulsable —el título lleva el enlace y se estira sobre
   toda la superficie— para no tener dos elementos enfocables por oferta.
   Cuando la vacante no trae fotografía NO se pone una de archivo: se pinta
   un panel de marca con el icono del área, que es honesto y no finge.
   ========================================================================== */

/**
 * Icono del área, deducido del área y del título de la vacante. Se devuelve
 * el elemento ya construido (y no el componente) porque una función que
 * devuelve componentes distintos en cada render confunde a React.
 */
function AreaIcon({ vacancy, className }: { vacancy: PublicVacancyDto; className?: string }) {
  const haystack = `${vacancy.department ?? ""} ${vacancy.title}`;
  if (/cocina|kitchen|chef|cocinero/i.test(haystack)) return <ChefHat className={className} aria-hidden="true" />;
  if (/sal[óo]n|mesero|server|waiter|barista|atenci[óo]n/i.test(haystack)) return <UtensilsCrossed className={className} aria-hidden="true" />;
  if (/almac[ée]n|bodega|warehouse|log[íi]stica|inventario/i.test(haystack)) return <Package className={className} aria-hidden="true" />;
  if (/administraci[óo]n|admin|oficina|office|rr\.? ?hh|recursos/i.test(haystack)) return <ClipboardList className={className} aria-hidden="true" />;
  return <Building2 className={className} aria-hidden="true" />;
}

function salaryText(vacancy: PublicVacancyDto, locale: string) {
  const { salaryMin, salaryMax, currency } = vacancy;
  if (!salaryMin && !salaryMax) return null;
  const format = (value: number) =>
    new Intl.NumberFormat(locale, { style: "currency", currency: currency || "USD", maximumFractionDigits: 0 }).format(value);
  if (salaryMin && salaryMax && salaryMin !== salaryMax) return `${format(salaryMin)} – ${format(salaryMax)}`;
  return format((salaryMin ?? salaryMax)!);
}

export function VacancyCard({ vacancy, href }: { vacancy: PublicVacancyDto; href: string }) {
  const { locale, t } = useLocale();
  const [imageFailed, setImageFailed] = useState(false);
  const image = vacancy.imageUrl && !imageFailed ? vacancy.imageUrl : null;
  const salary = salaryText(vacancy, locale);
  const place = [vacancy.city, vacancy.branch?.name].filter(Boolean)[0];

  return (
    <article className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-surface-1 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-e3 focus-within:border-accent-line focus-within:shadow-e3 motion-reduce:transform-none">
      {/* ---- Imagen o panel de marca ---------------------------------- */}
      <div className="relative aspect-[16/9] shrink-0 overflow-hidden bg-surface-dark-2">
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            unoptimized
            sizes="(min-width: 1280px) 380px, (min-width: 768px) 45vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transform-none"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,hsl(38_94%_52%_/_.28),transparent_55%)]">
            <span className="public-grid public-grid-dark absolute inset-0" />
            <span className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-surface-dark-ink/15 bg-surface-dark-1/70 text-accent-fill backdrop-blur">
              <AreaIcon vacancy={vacancy} className="size-7" />
            </span>
          </div>
        )}
        {/* Velo inferior: el texto blanco de la insignia siempre contrasta. */}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-surface-dark-1/85 to-transparent" />
        <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-center gap-1.5">
          {vacancy.workMode ? (
            <span className="rounded-full bg-accent-fill px-2.5 py-1 text-2xs font-semibold text-surface-dark-1">
              {technicalLabel(vacancy.workMode)}
            </span>
          ) : null}
          {vacancy.department ? (
            <span className="rounded-full border border-surface-dark-ink/25 bg-surface-dark-1/70 px-2.5 py-1 text-2xs font-medium text-surface-dark-ink backdrop-blur">
              {vacancy.department}
            </span>
          ) : null}
        </div>
      </div>

      {/* ---- Contenido ------------------------------------------------- */}
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-5">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold leading-snug text-ink-1">
            <Link
              href={href}
              className="after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              {vacancy.title}
            </Link>
          </h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-2">
            {vacancy.tenant?.name ? <span className="truncate font-medium">{vacancy.tenant.name}</span> : null}
            {place ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5 shrink-0 text-ink-3" aria-hidden="true" />
                {place}
              </span>
            ) : null}
          </p>
        </div>

        <p className="line-clamp-2 text-sm leading-6 text-ink-2">
          {vacancy.summary || vacancy.description || t("jobs.defaultSummary")}
        </p>

        <dl className="mt-auto flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line pt-4 text-sm">
          {vacancy.employmentType ? (
            <div className="flex items-center gap-1.5">
              <Clock3 className="size-4 shrink-0 text-ink-3" aria-hidden="true" />
              <dt className="sr-only">{t("careers.facet.employmentType")}</dt>
              <dd className="text-ink-1">{technicalLabel(vacancy.employmentType)}</dd>
            </div>
          ) : null}
          {salary ? (
            <div className="flex items-center gap-1.5">
              <Wallet className="size-4 shrink-0 text-ink-3" aria-hidden="true" />
              <dt className="sr-only">{t("careers.salary")}</dt>
              <dd className="font-medium text-ink-1">{salary}</dd>
            </div>
          ) : null}
          {vacancy.openings && vacancy.openings > 1 ? (
            <div className="flex items-center gap-1.5">
              <Sparkles className="size-4 shrink-0 text-ink-3" aria-hidden="true" />
              <dt className="sr-only">{t("careers.openings")}</dt>
              <dd className="text-ink-1">{t("careers.openingsValue", { count: vacancy.openings })}</dd>
            </div>
          ) : null}
        </dl>

        <p className={cn("flex items-center gap-1.5 text-sm font-semibold text-accent-ink", "transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none")}>
          {t("jobs.viewAndApply")}
          <ArrowRight className="size-4" aria-hidden="true" />
        </p>
      </div>
    </article>
  );
}
