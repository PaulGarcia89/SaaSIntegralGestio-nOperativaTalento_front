"use client";

import { useLocale } from "@/components/locale-provider";
import type { TranslationParams } from "@/i18n/types";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, ClipboardList, CreditCard, GitBranch, ShieldCheck, UsersRound } from "lucide-react";
import {
  ActiveContext,
  EmptyState,
  ErrorState,
  InlineNote,
  NextAction,
  PageHeader,
  PageSection,
  SkeletonRows,
  StatusBadge,
  StatusTile,
  StatusTileRow,
  Timeline,
  type TimelineEntry,
} from "@/components/system";
import { Button } from "@/components/ui/button";
import { fetchBranches, fetchPlatformAudit, fetchSubscriptions, fetchTenantUsers, getApiErrorMessage } from "@/lib/backend";
import { auditActionLabel } from "@/lib/audit-labels";
import { formatDate, formatDateTime, planTierLabel, subscriptionStatusInfo } from "@/lib/platform-labels";
import { useAppStore } from "@/store/app-store";

/**
 * Dashboard de Empresas y sucursales: primera pantalla de Administración.
 *
 * El centro administrativo (`/admin`) es un índice de destinos y sigue
 * existiendo. Este dashboard responde lo que el índice no responde: cómo está
 * la empresa —sucursales activas, usuarios activos e invitados, módulos
 * habilitados, plan y renovación—, qué necesita atención y qué cambió hace
 * poco según la auditoría.
 *
 * Cada bloque se pide solo si el rol tiene permiso para verlo, y si no lo
 * tiene se dice en vez de dejar un hueco. Nada se calcula en el navegador
 * sobre datos que no llegaron: los usuarios y sucursales vienen completos
 * (son listas cortas por naturaleza), la auditoría viene paginada y aquí se
 * enseña la primera página.
 */

const DIAS_AVISO_RENOVACION = 15;
const MAX_CAMBIOS = 6;

export function AdminModuleDashboard({ reports = false }: { reports?: boolean } = {}) {
  const { t, locale } = useLocale();
  const { can, currentTenant, tenantBranches } = useAppStore();
  const puedeVer = can("admin.view");
  const veUsuarios = can("users.view");
  const veSucursales = can("branches.view");
  const veSuscripcion = can("admin.subscription");
  const veAuditoria = can("audit.view");

  const usuarios = useQuery({
    queryKey: ["tenant-users", currentTenant.id],
    queryFn: () => fetchTenantUsers(currentTenant.id),
    enabled: puedeVer && veUsuarios && Boolean(currentTenant.id),
    staleTime: 60_000,
  });
  const sucursales = useQuery({
    queryKey: ["branches", currentTenant.id],
    queryFn: () => fetchBranches(currentTenant.id),
    enabled: puedeVer && veSucursales && Boolean(currentTenant.id),
    staleTime: 60_000,
  });
  const suscripciones = useQuery({
    queryKey: ["subscriptions"],
    queryFn: fetchSubscriptions,
    enabled: puedeVer && veSuscripcion,
    staleTime: 60_000,
  });
  const auditoria = useQuery({
    queryKey: ["platform-audit", "admin-dashboard"],
    queryFn: () => fetchPlatformAudit({ page: 1, pageSize: MAX_CAMBIOS }),
    enabled: puedeVer && veAuditoria,
    staleTime: 60_000,
  });

  if (!puedeVer) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow={t("admin.dashboard.administration")} title={reports ? t("nav.Reportes") : t("admin.dashboard.companyDashboard")} />
        <EmptyState
          reason="no-records"
          title={t("admin.dashboard.youDoNotHaveAccessToAdministration")}
          description={t("admin.dashboard.askYourCompanyAdministratorForAdministrationAccess")}
        />
      </div>
    );
  }

  const listaSucursales = sucursales.data ?? (veSucursales ? undefined : tenantBranches);
  const sucursalesActivas = listaSucursales?.filter((sucursal) => sucursal.status === "active").length;
  const usuariosActivos = usuarios.data?.filter((usuario) => usuario.status === "active").length;
  const usuariosInvitados = usuarios.data?.filter((usuario) => usuario.status === "invited").length ?? 0;
  const usuariosSuspendidos = usuarios.data?.filter((usuario) => usuario.status === "suspended").length ?? 0;

  const suscripcion = suscripciones.data?.find((item) => item.tenantId === currentTenant.id) ?? null;
  const estadoCobro = suscripcion ? subscriptionStatusInfo(suscripcion.status, locale) : null;
  const diasRenovacion = suscripcion ? diasHasta(suscripcion.renewalDate) : null;

  const modulos = currentTenant.enabledModules ?? [];

  /** `undefined` mientras carga · `null` si no hay permiso o el servidor falló. */
  const cifra = (consulta: { isLoading: boolean; isError: boolean }, permitido: boolean, valor?: number) =>
    !permitido ? null : consulta.isError ? null : consulta.isLoading ? undefined : (valor ?? 0);

  const accion = siguienteAccion(t, locale, {
    veSuscripcion,
    suscripcion,
    diasRenovacion,
    usuariosInvitados,
    veUsuarios,
    sinSucursalActiva: typeof sucursalesActivas === "number" && sucursalesActivas === 0,
  });

  const cambios: TimelineEntry[] = (auditoria.data?.items ?? []).map((entrada) => ({
    id: entrada.id,
    title: auditActionLabel(entrada.action, locale),
    detail: entrada.route ?? undefined,
    when: formatDateTime(entrada.createdAt, locale),
    who: entrada.userId ? nombreUsuario(entrada.userId, usuarios.data) : undefined,
  }));

  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        eyebrow={t("admin.dashboard.administration")}
        title={reports ? t("nav.Reportes") : t("admin.dashboard.companyDashboard")}
        description={t("admin.dashboard.description", { company: currentTenant.name })}
        actions={
          <Button asChild variant="secondary">
            <Link href="/admin">{t("admin.dashboard.openAdministrationCenter")}</Link>
          </Button>
        }
      />

      <ActiveContext />

      {accion ? (
        <NextAction
          label={accion.label}
          title={accion.title}
          detail={accion.detail}
          href={accion.href}
          actionLabel={accion.actionLabel}
          tone={accion.tone}
        />
      ) : null}

      <StatusTileRow label={t("admin.dashboard.companyStatus")}>
        <li className="min-w-0">
          <StatusTile
            title={t("admin.dashboard.activeBranches")}
            value={veSucursales ? cifra(sucursales, veSucursales, sucursalesActivas) : tenantBranches.length}
            context={
              listaSucursales && listaSucursales.length !== sucursalesActivas
                ? t("admin.dashboard.inactiveCount", { count: listaSucursales.length - (sucursalesActivas ?? 0) })
                : t("admin.dashboard.everyPersonAndTransactionBelongsToABranch")
            }
            href={veSucursales ? "/admin/branches" : undefined}
            actionLabel={t("admin.dashboard.viewBranches")}
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title={t("admin.dashboard.activeUsers")}
            value={cifra(usuarios, veUsuarios, usuariosActivos)}
            context={
              !veUsuarios
                ? t("admin.dashboard.yourRoleCannotViewTheUserList")
                : usuariosInvitados > 0
                  ? t(usuariosInvitados === 1 ? "admin.dashboard.invitedOne" : "admin.dashboard.invitedMany", { count: usuariosInvitados })
                  : usuariosSuspendidos > 0
                    ? t(usuariosSuspendidos === 1 ? "admin.dashboard.suspendedOne" : "admin.dashboard.suspendedMany", { count: usuariosSuspendidos })
                    : t("admin.dashboard.allInvitationsHaveBeenAccepted")
            }
            status={usuariosInvitados > 0 ? { label: t("admin.dashboard.pendingInvitations"), tone: "warning" as const } : undefined}
            href={veUsuarios ? "/admin/users" : undefined}
            actionLabel={t("admin.dashboard.viewUsers")}
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title={t("admin.dashboard.enabledModules")}
            value={modulos.length}
            context={modulos.length > 0 ? modulos.map((modulo) => t(`module.${modulo}`)).join(", ") : t("admin.dashboard.noModulesEnabled")}
            href={veSuscripcion ? "/admin/company/subscription" : undefined}
            actionLabel={t("admin.dashboard.viewPlan")}
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title={t("admin.dashboard.subscriptionPlan")}
            value={
              !veSuscripcion
                ? planTierLabel(currentTenant.plan, locale)
                : suscripciones.isLoading
                  ? undefined
                  : suscripciones.isError
                    ? null
                    : suscripcion
                      ? planTierLabel(suscripcion.plan, locale)
                      : planTierLabel(currentTenant.plan, locale)
            }
            context={
              suscripcion
                ? t("admin.dashboard.renews", { date: formatDate(suscripcion.renewalDate, locale), relative: typeof diasRenovacion === "number" ? ` (${describirDias(diasRenovacion, locale)})` : "" })
                : veSuscripcion && suscripciones.data
                  ? t("admin.dashboard.noSubscriptionIsRegisteredForThisCompany")
                  : t("admin.dashboard.yourSubscriptionAndItsRenewalDate")
            }
            status={
              estadoCobro && estadoCobro.tone === "danger"
                ? { label: estadoCobro.label, tone: "danger" as const }
                : typeof diasRenovacion === "number" && diasRenovacion <= DIAS_AVISO_RENOVACION
                  ? { label: t("admin.dashboard.renewingSoon"), tone: "warning" as const }
                  : undefined
            }
            href={veSuscripcion ? "/admin/company/subscription" : undefined}
            actionLabel={t("admin.dashboard.viewPlan")}
          />
        </li>
      </StatusTileRow>

      {usuarios.isError ? (
        <InlineNote tone="danger" title={t("admin.dashboard.unableToLoadUsers")}>
          {getApiErrorMessage(usuarios.error, t("admin.dashboard.retryTheRequestToContinue"))}
        </InlineNote>
      ) : null}
      {sucursales.isError ? (
        <InlineNote tone="danger" title={t("admin.dashboard.unableToLoadBranches")}>
          {getApiErrorMessage(sucursales.error, t("admin.dashboard.retryTheRequestToContinue"))}
        </InlineNote>
      ) : null}

      <PageSection title={t("admin.dashboard.administrationTools")} description={t("admin.dashboard.chooseAToolToManageYourCompany")}>
        <ul className="grid gap-3 [&>li]:min-w-0 sm:grid-cols-2 xl:grid-cols-3">
          {can("admin.company") ? (
            <Destino href="/admin/company" icon={Building2} label={t("admin.dashboard.companySettings")} detail={t("admin.dashboard.brandingCareersPortalAndOutgoingEmail")} />
          ) : null}
          {veSucursales ? (
            <Destino href="/admin/branches" icon={GitBranch} label={t("admin.dashboard.branches")} detail={t("admin.dashboard.whereYourCompanyOperates")} />
          ) : null}
          {veUsuarios ? (
            <Destino href="/admin/users" icon={UsersRound} label={t("admin.dashboard.users")} detail={t("admin.dashboard.whoCanSignInTheirRoleAndAccountStatus")} />
          ) : null}
          {can("roles.view") ? (
            <Destino href="/admin/roles" icon={ShieldCheck} label={t("admin.dashboard.rolesAndPermissions")} detail={t("admin.dashboard.whatEachRoleCanDo")} />
          ) : null}
          {veSuscripcion ? (
            <Destino href="/admin/company/subscription" icon={CreditCard} label={t("admin.dashboard.subscriptionPlan")} detail={t("admin.dashboard.yourBillingAndRenewalDetails")} />
          ) : null}
          {veAuditoria ? (
            <Destino href="/admin/audit" icon={ClipboardList} label={t("admin.dashboard.auditLog")} detail={t("admin.dashboard.whatHappenedWhoDidItAndWhen")} />
          ) : null}
        </ul>
      </PageSection>

      <div className="grid gap-6 xl:grid-cols-2 [&>*]:min-w-0">
        <PageSection title={t("admin.dashboard.branches")} description={t("admin.dashboard.theStatusOfEachCompanyLocation")} boxed>
          {!veSucursales && tenantBranches.length === 0 ? (
            <p className="text-sm text-ink-2">{t("admin.dashboard.yourRoleCannotViewTheBranchList")}</p>
          ) : sucursales.isLoading ? (
            <SkeletonRows rows={3} />
          ) : !listaSucursales || listaSucursales.length === 0 ? (
            <EmptyState
              reason="no-records"
              title={t("admin.dashboard.noBranchesYet")}
              description={t("admin.dashboard.anActiveBranchIsRequiredToRegisterPeopleOrTransactions")}
              action={
                veSucursales ? (
                  <Button asChild variant="outline">
                    <Link href="/admin/branches">{t("admin.dashboard.createBranch")}</Link>
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <ul className="divide-y divide-line">
              {listaSucursales.slice(0, 8).map((sucursal) => (
                <li key={sucursal.id} className="flex min-w-0 items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink-1">{sucursal.name}</p>
                    {"location" in sucursal && sucursal.location ? (
                      <p className="truncate text-sm text-ink-2">{String(sucursal.location)}</p>
                    ) : null}
                  </div>
                  <StatusBadge
                    size="sm"
                    tone={sucursal.status === "active" ? "success" : "neutral"}
                    label={sucursal.status === "active" ? t("admin.dashboard.active") : t("admin.dashboard.inactive")}
                  />
                </li>
              ))}
            </ul>
          )}
        </PageSection>

        <PageSection title={t("admin.dashboard.recentChanges")} description={t("admin.dashboard.theLatestActionsInYourCompanyAuditLog")} boxed>
          {!veAuditoria ? (
            <p className="text-sm text-ink-2">{t("admin.dashboard.yourRoleCannotViewTheAuditLog")}</p>
          ) : auditoria.isLoading ? (
            <SkeletonRows rows={3} />
          ) : auditoria.isError ? (
            <ErrorState
              title={t("admin.dashboard.unableToLoadTheAuditLog")}
              detail={getApiErrorMessage(auditoria.error, t("admin.dashboard.retryTheRequestToContinue"))}
              onRetry={() => void auditoria.refetch()}
            />
          ) : cambios.length === 0 ? (
            <EmptyState reason="no-records" title={t("admin.dashboard.noActionsRecorded")} description={t("admin.dashboard.changesWillAppearHereWhenTheyAreRecorded")} />
          ) : (
            <>
              <Timeline entries={cambios} />
              <p className="mt-4 text-sm">
                <Link href="/admin/audit" className="inline-flex min-h-[var(--control-h-base)] items-center gap-1 font-medium text-ink-1 hover:underline">
                  {t("admin.dashboard.viewFullAuditLog")}<ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </p>
            </>
          )}
        </PageSection>
      </div>

      {veUsuarios && usuarios.data ? (
        <PageSection title={t("admin.dashboard.usersByRole")} description={t("admin.dashboard.theNumberOfPeopleWithEachRoleInYourCompany")} boxed>
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {Object.entries(
              usuarios.data.reduce<Record<string, number>>((acumulado, usuario) => {
                acumulado[usuario.role] = (acumulado[usuario.role] ?? 0) + 1;
                return acumulado;
              }, {}),
            )
              .sort((a, b) => b[1] - a[1])
              .map(([rol, total]) => (
                <li key={rol} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-1 px-4 py-3">
                  <span className="min-w-0 truncate text-sm font-medium text-ink-1">{t(`role.${rol}`)}</span>
                  <span className="font-mono text-lg font-semibold tabular-figures text-ink-1">{total}</span>
                </li>
              ))}
          </ul>
        </PageSection>
      ) : null}
    </div>
  );
}

function siguienteAccion(t: (key: string, params?: TranslationParams) => string, locale: "es" | "en", {
  veSuscripcion,
  suscripcion,
  diasRenovacion,
  usuariosInvitados,
  veUsuarios,
  sinSucursalActiva,
}: {
  veSuscripcion: boolean;
  suscripcion: { status: string } | null;
  diasRenovacion: number | null;
  usuariosInvitados: number;
  veUsuarios: boolean;
  sinSucursalActiva: boolean;
}) {
  if (veSuscripcion && suscripcion?.status === "past_due") {
    return {
      label: t("admin.dashboard.mostUrgent"),
      title: t("admin.dashboard.resolveTheSubscriptionPayment"),
      detail: t("admin.dashboard.theLastPaymentFailedYourCompanyMayLoseAccessIfItRemainsUnpaid"),
      href: "/admin/company/subscription",
      actionLabel: t("admin.dashboard.viewPlan"),
      tone: "danger" as const,
    };
  }
  if (sinSucursalActiva) {
    return {
      label: t("admin.dashboard.mostUrgent"),
      title: t("admin.dashboard.activateAtLeastOneBranch"),
      detail: t("admin.dashboard.anActiveBranchIsRequiredToRegisterPeopleOrTransactions"),
      href: "/admin/branches",
      actionLabel: t("admin.dashboard.viewBranches"),
      tone: "danger" as const,
    };
  }
  if (veSuscripcion && typeof diasRenovacion === "number" && diasRenovacion <= DIAS_AVISO_RENOVACION) {
    return {
      label: t("admin.dashboard.nextStep"),
      title: t("admin.dashboard.reviewSubscriptionRenewal"),
      detail: t("admin.dashboard.planRenews", { relative: describirDias(diasRenovacion, locale) }),
      href: "/admin/company/subscription",
      actionLabel: t("admin.dashboard.viewPlan"),
      tone: "warning" as const,
    };
  }
  if (veUsuarios && usuariosInvitados > 0) {
    return {
      label: t("admin.dashboard.nextStep"),
      title: t("admin.dashboard.someInvitationsHaveNotBeenAccepted"),
      detail: t(usuariosInvitados === 1 ? "admin.dashboard.inviteActionOne" : "admin.dashboard.inviteActionMany", { count: usuariosInvitados }),
      href: "/admin/users?status=invited",
      actionLabel: t("admin.dashboard.viewUsers"),
      tone: "progress" as const,
    };
  }
  return null;
}

function diasHasta(fecha: string) {
  const objetivo = new Date(fecha).getTime();
  if (Number.isNaN(objetivo)) return null;
  return Math.ceil((objetivo - Date.now()) / 86_400_000);
}

function describirDias(dias: number, locale: "es" | "en") {
  return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(dias, "day");
}

function nombreUsuario(id: string, usuarios?: Array<{ id: string; name?: string | null; email?: string | null }>) {
  const usuario = usuarios?.find((item) => item.id === id);
  return usuario?.name ?? usuario?.email ?? undefined;
}

function Destino({ href, icon: Icon, label, detail }: { href: string; icon: typeof Building2; label: string; detail: string }) {
  return (
    <li className="min-w-0">
      <Link
        href={href}
        className="flex h-full min-h-[var(--control-h-touch)] items-start gap-3 rounded-lg border border-line bg-surface-1 p-4 transition-colors hover:border-line-strong hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-md border border-line bg-surface-2 text-ink-2">
          <Icon className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1 font-medium text-ink-1">
            {label}
            <ArrowRight className="size-3.5 shrink-0 text-ink-3" aria-hidden="true" />
          </span>
          <span className="mt-1 block text-sm leading-relaxed text-ink-2">{detail}</span>
        </span>
      </Link>
    </li>
  );
}
