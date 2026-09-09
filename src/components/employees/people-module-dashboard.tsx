"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, ChevronRight, FileCheck, FileSpreadsheet, History, UserPlus, UserRoundX, Users } from "lucide-react";
import type { ReactNode } from "react";
import { EmployeesModulePanel } from "@/components/employees/employees-module-panel";
import { EmptyState, ErrorState, InlineNote, PageHeader, PageSection, SkeletonRows, StatusTile, StatusTileRow } from "@/components/system";
import { Button } from "@/components/ui/button";
import { fetchEmployeesSummary, fetchOnboardingAnalytics, getApiErrorMessage } from "@/lib/backend";
import { auditActionLabel } from "@/lib/audit-labels";
import { cn } from "@/lib/utils";
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
     · `/employees/summary` (nuevo, 2026-09-08) para perfiles incompletos,
       documentos por vencer o sin revisar y los últimos cambios. Antes eso
       existía solo expediente por expediente y aquí se decía que faltaba.
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

      <PeopleAttention branchId={currentBranch?.id} branchName={currentBranch?.name} tenantId={currentTenant.id} />

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

/* ==========================================================================
   ATENCIÓN Y CAMBIOS RECIENTES — `GET /employees/summary`
   ==========================================================================
   Lo que antes estaba anotado como «el servidor no lo agrega»: perfiles
   incompletos, documentos por vencer o vencidos, documentos sin revisar y
   los últimos cambios sobre expedientes. Ahora lo cuenta el servidor para
   la sucursal activa, con el mismo recorte que la lista de empleados.

   Sin dato no es cero: mientras carga se muestran siluetas y si el servidor
   falla se dice, con reintento.
   ========================================================================== */

function PeopleAttention({
  branchId,
  branchName,
  tenantId,
}: {
  branchId?: string;
  branchName?: string;
  tenantId: string;
}) {
  const { t } = useLocale();
  const resumen = useQuery({
    queryKey: ["employees-summary", tenantId, branchId ?? null],
    queryFn: () => fetchEmployeesSummary(branchId),
    staleTime: 60_000,
  });
  const data = resumen.data;
  const cargando = resumen.isPending;
  const valor = (n: number | undefined) => (resumen.isError ? null : cargando ? undefined : n);

  const documentosUrgentes = data ? data.documents.expired + data.documents.expiringWithin30Days : undefined;

  /*
   * Alcance de estas cifras.
   *
   * `GET /employees/summary` EXIGE una sucursal: si no se le pasa una, usa la
   * activa de la sesión. O sea que esta sección habla siempre de UNA sucursal,
   * mientras que las cifras de plantilla de más arriba cuentan toda la empresa
   * cuando no hay sucursal seleccionada. Dos filas de la misma pantalla
   * contando poblaciones distintas y sin decirlo es peor que no enseñar la
   * segunda: por eso cada tarjeta lleva su alcance y, cuando las dos no
   * coinciden, se avisa en una línea.
   */
  const alcance = branchName ?? (data ? t("people.panel.attentionOneBranch") : undefined);
  const contradice = !branchName && Boolean(data);

  return (
    <>
      <PageSection title={t("people.panel.attentionTitle")} description={t("people.panel.attentionHelp")} id="atencion">
        {resumen.isError ? (
          <ErrorState
            title={t("people.panel.attentionError")}
            detail={getApiErrorMessage(resumen.error, t("people.panel.attentionErrorDetail"))}
            onRetry={() => void resumen.refetch()}
          />
        ) : (
          <StatusTileRow label={t("people.panel.attentionTitle")} className="xl:grid-cols-3">
            <li className="min-w-0">
              <StatusTile
                title={t("people.panel.incompleteProfiles")}
                value={valor(data?.incompleteProfiles.count)}
                context={t("people.panel.incompleteProfilesContext")}
                status={data ? { label: data.incompleteProfiles.count ? t("people.panel.needsAttention") : t("people.panel.allGood"), tone: data.incompleteProfiles.count ? "warning" : "success" } : undefined}
                href="/employees?status=ACTIVE"
                actionLabel={t("people.panel.quickDirectory")}
                scope={alcance}
                icon={<UserRoundX className="size-5" aria-hidden="true" />}
              />
            </li>
            <li className="min-w-0">
              <StatusTile
                title={t("people.panel.documentsDue")}
                value={valor(documentosUrgentes)}
                context={data ? t("people.panel.documentsDueContext", { expired: data.documents.expired, soon: data.documents.expiringWithin30Days }) : t("people.panel.documentsDueContextLoading")}
                status={data ? { label: data.documents.expired ? t("people.panel.expired") : documentosUrgentes ? t("people.panel.needsAttention") : t("people.panel.allGood"), tone: data.documents.expired ? "danger" : documentosUrgentes ? "warning" : "success" } : undefined}
                scope={alcance}
                icon={<CalendarClock className="size-5" aria-hidden="true" />}
              />
            </li>
            <li className="min-w-0">
              <StatusTile
                title={t("people.panel.documentsToReview")}
                value={valor(data?.documents.pendingReview)}
                context={t("people.panel.documentsToReviewContext")}
                status={data ? { label: data.documents.pendingReview ? t("people.panel.needsAttention") : t("people.panel.allGood"), tone: data.documents.pendingReview ? "progress" : "success" } : undefined}
                scope={alcance}
                icon={<FileCheck className="size-5" aria-hidden="true" />}
              />
            </li>
          </StatusTileRow>
        )}

        {contradice ? (
          <InlineNote tone="info" title={t("people.panel.scopeMismatchTitle")} className="mt-4">
            {t("people.panel.scopeMismatchHelp")}
          </InlineNote>
        ) : null}

        {/* La regla que produce la cifra, tal como la manda el servidor en
            `criteria`. Un recuento sin su criterio no se puede discutir. */}
        {data && data.incompleteProfiles.criteria.length ? (
          <p className="mt-3 text-2xs leading-5 text-ink-3">
            {t("people.panel.incompleteCriteria", {
              fields: data.incompleteProfiles.criteria
                .map((campo) => t(`people.panel.field.${campo}`))
                .join(", "),
            })}
          </p>
        ) : null}

        {data && (data.incompleteProfiles.sample.length || data.documents.sample.length) ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
            {data.incompleteProfiles.sample.length ? (
              <SampleList
                title={t("people.panel.incompleteProfiles")}
                more={data.incompleteProfiles.count - data.incompleteProfiles.sample.length}
                items={data.incompleteProfiles.sample.map((persona) => ({
                  key: persona.id,
                  href: `/employees/${persona.id}`,
                  name: persona.name,
                  detail: `${t("people.panel.missing")}: ${persona.missing.map((campo) => t(`people.panel.field.${campo}`)).join(", ")}`,
                  tone: "warning" as const,
                }))}
              />
            ) : null}
            {data.documents.sample.length ? (
              <SampleList
                title={t("people.panel.documentsDue")}
                more={data.documents.expired + data.documents.expiringWithin30Days - data.documents.sample.length}
                items={data.documents.sample.map((documento) => ({
                  key: documento.id,
                  href: `/employees/${documento.employeeId}`,
                  name: documento.employeeName,
                  detail: `${documento.category} · ${documento.expired ? t("people.panel.expiredOn") : t("people.panel.expiresOn")} ${fechaCorta(documento.expiresAt)}`,
                  tone: documento.expired ? ("danger" as const) : ("warning" as const),
                }))}
              />
            ) : null}
          </div>
        ) : null}
      </PageSection>

      <PageSection title={t("people.panel.recentTitle")} description={t("people.panel.recentHelp")} id="cambios">
        {resumen.isError ? (
          <p className="text-sm text-ink-2">{t("people.panel.attentionError")}</p>
        ) : cargando ? (
          <SkeletonRows rows={4} label={t("people.panel.recentTitle")} />
        ) : data && data.recentChanges.length ? (
          <ol className="divide-y divide-line rounded-lg border border-line bg-surface-1">
            {data.recentChanges.map((cambio) => (
              <li key={cambio.id} className="flex items-start gap-3 px-4 py-3">
                <History className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink-1">
                    <span className="font-medium">{auditActionLabel(cambio.action)}</span>
                    {cambio.employeeName ? (
                      <>
                        {" · "}
                        {cambio.employeeId ? <Link href={`/employees/${cambio.employeeId}`} className="underline-offset-4 hover:underline">{cambio.employeeName}</Link> : cambio.employeeName}
                      </>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-ink-3">
                    {fechaHora(cambio.createdAt)}
                    {cambio.actorEmail ? ` · ${cambio.actorEmail}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState reason="no-records" title={t("people.panel.recentEmpty")} description={t("people.panel.recentEmptyHelp")} />
        )}
      </PageSection>
    </>
  );
}

function SampleList({ title, items, more }: { title: string; items: Array<{ key: string; href: string; name: string; detail: string; tone: "warning" | "danger" }>; more: number }) {
  const { t } = useLocale();
  return (
    <div className="rounded-lg border border-line bg-surface-1">
      <h3 className="border-b border-line px-4 py-2.5 text-sm font-semibold text-ink-1">{title}</h3>
      <ul className="divide-y divide-line">
        {items.map((item) => (
          <li key={item.key}>
            <Link href={item.href} className="flex min-h-[var(--control-h-touch)] items-center gap-3 px-4 py-2 hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus">
              <span aria-hidden="true" className={cn("size-2.5 shrink-0 rounded-full", item.tone === "danger" ? "bg-status-danger" : "bg-status-warning")} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink-1">{item.name}</span>
                <span className="block truncate text-xs text-ink-2">{item.detail}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-ink-3" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
      {more > 0 ? <p className="border-t border-line px-4 py-2 text-xs text-ink-3">{t("people.panel.andMore", { count: more })}</p> : null}
    </div>
  );
}

function fechaCorta(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("es", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function fechaHora(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
