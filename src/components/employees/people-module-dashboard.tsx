"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FileSpreadsheet, FileText, UserPlus, Users } from "lucide-react";
import type { ReactNode } from "react";
import { EmployeesModulePanel } from "@/components/employees/employees-module-panel";
import { EmptyState, InlineNote, PageHeader, PageSection, StatusTile } from "@/components/system";
import { Button } from "@/components/ui/button";
import { fetchOnboardingAnalytics } from "@/lib/backend";
import { useLocale } from "@/components/locale-provider";
import { useAppStore } from "@/store/app-store";

/* ==========================================================================
   PANEL DEL MÓDULO DE PERSONAS — /people
   ==========================================================================
   La primera página de Personas. Antes no existía: el módulo abría en el
   directorio (/employees) y compartía sección de menú con Productividad,
   aunque el backend las protege por caminos distintos.

   Solo empleados. Aquí no hay cámaras, zonas ni indicadores de
   productividad: eso vive en /productivity y tiene su propio panel.

   Lo que se muestra sale de tres fuentes reales:
     · `/employees` con `pageSize: 1` para los recuentos por estado y sucursal
       (cuenta el servidor; el navegador no recibe expedientes que no mostrará).
     · `/onboarding/analytics` para las incorporaciones en curso, SOLO si la
       empresa tiene contratado el módulo de incorporación y quien mira tiene
       permiso para verlo.
   Lo que NO se muestra —perfiles incompletos, documentos por vencer,
   actividad reciente— es porque el backend lo expone por empleado, no
   agregado. Está anotado como trabajo de servidor pendiente, no inventado.
   ========================================================================== */

export function PeopleModuleDashboard() {
  const { t } = useLocale();
  const { can, hasModule, currentTenant, currentBranch } = useAppStore();
  const puedeVer = can("employees.read");
  const puedeCrear = can("employees.create");
  const veIncorporaciones = hasModule("onboarding") && can("onboarding.view");

  const incorporaciones = useQuery({
    queryKey: ["onboarding-analytics", "people-panel", currentTenant.id, currentBranch?.id ?? null],
    queryFn: () => fetchOnboardingAnalytics(currentBranch?.id),
    enabled: puedeVer && veIncorporaciones,
    staleTime: 60_000,
  });

  if (!puedeVer) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow={t("people.panel.eyebrow")} title={t("people.panel.title")} />
        <EmptyState
          reason="no-records"
          title={t("people.panel.noAccessTitle")}
          description={t("people.panel.noAccessHelp")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        eyebrow={t("people.panel.eyebrow")}
        title={t("people.panel.title")}
        description={t("people.panel.description")}
        actions={
          puedeCrear ? (
            <Button asChild>
              <Link href="/employees/new">
                <UserPlus className="size-4" aria-hidden="true" />
                {t("people.panel.register")}
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* Estado del personal y reparto por sucursal. Cada tarjeta abre el
          directorio ya filtrado. */}
      <EmployeesModulePanel />

      {/* Incorporaciones en curso: dato de Incorporación, no de Personas.
          Se enseña aquí porque responde a «¿quién está entrando?», pero se
          administra en su módulo, y solo aparece si la empresa lo tiene. */}
      {veIncorporaciones ? (
        <PageSection
          title={t("people.panel.onboardingTitle")}
          description={t("people.panel.onboardingHelp")}
          id="incorporaciones"
        >
          <ul className="grid gap-3 [&>li]:min-w-0 sm:grid-cols-2">
            <li>
              <StatusTile
                title={t("people.panel.onboardingActive")}
                value={
                  incorporaciones.isError
                    ? null
                    : incorporaciones.data
                      ? incorporaciones.data.summary.totalFlows
                      : undefined
                }
                context={t("people.panel.onboardingActiveContext")}
                href="/onboarding/documents"
                actionLabel={t("people.panel.seeOnboarding")}
              />
            </li>
            <li>
              <StatusTile
                title={t("people.panel.onboardingAtRisk")}
                value={
                  incorporaciones.isError
                    ? null
                    : incorporaciones.data
                      ? incorporaciones.data.summary.atRisk
                      : undefined
                }
                context={t("people.panel.onboardingAtRiskContext")}
                status={
                  incorporaciones.data && incorporaciones.data.summary.atRisk > 0
                    ? { label: t("people.panel.needsAttention"), tone: "warning" as const }
                    : undefined
                }
                href="/onboarding/documents"
                actionLabel={t("people.panel.review")}
              />
            </li>
          </ul>
        </PageSection>
      ) : null}

      {/* Accesos rápidos: icono Y texto, tarjeta entera pulsable. */}
      <PageSection title={t("people.panel.quickTitle")} id="accesos">
        <ul className="grid gap-3 [&>li]:min-w-0 sm:grid-cols-2 xl:grid-cols-3">
          <QuickAction
            href="/employees"
            icon={<Users className="size-5" aria-hidden="true" />}
            title={t("people.panel.quickDirectory")}
            detail={t("people.panel.quickDirectoryHelp")}
          />
          {puedeCrear ? (
            <QuickAction
              href="/employees/new"
              icon={<UserPlus className="size-5" aria-hidden="true" />}
              title={t("people.panel.register")}
              detail={t("people.panel.registerHelp")}
            />
          ) : null}
          {puedeCrear ? (
            <QuickAction
              href="/employees/import"
              icon={<FileSpreadsheet className="size-5" aria-hidden="true" />}
              title={t("people.panel.bulkImport")}
              detail={t("people.panel.bulkImportHelp")}
            />
          ) : null}
        </ul>
      </PageSection>

      <InlineNote tone="info" title={t("people.panel.pendingTitle")}>
        <span className="flex items-start gap-2">
          <FileText className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{t("people.panel.pendingHelp")}</span>
        </span>
      </InlineNote>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  title,
  detail,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="group flex h-full min-w-0 items-start gap-3 rounded-lg border border-line bg-surface-1 p-4 transition-colors hover:border-line-strong hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 text-ink-2">
          {icon}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-ink-1">{title}</span>
          <span className="mt-0.5 block text-sm text-ink-2">{detail}</span>
        </span>
      </Link>
    </li>
  );
}
