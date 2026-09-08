"use client";

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
import { moduleLabels, roleLabels } from "@/lib/ui-labels";
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

export function AdminModuleDashboard() {
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
        <PageHeader eyebrow="Administración" title="Dashboard de la empresa" />
        <EmptyState
          reason="no-records"
          title="No tienes acceso a la administración"
          description="Pide a quien administra la empresa el permiso de administración."
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
  const estadoCobro = suscripcion ? subscriptionStatusInfo(suscripcion.status) : null;
  const diasRenovacion = suscripcion ? diasHasta(suscripcion.renewalDate) : null;

  const modulos = currentTenant.enabledModules ?? [];

  /** `undefined` mientras carga · `null` si no hay permiso o el servidor falló. */
  const cifra = (consulta: { isLoading: boolean; isError: boolean }, permitido: boolean, valor?: number) =>
    !permitido ? null : consulta.isError ? null : consulta.isLoading ? undefined : (valor ?? 0);

  const accion = siguienteAccion({
    veSuscripcion,
    suscripcion,
    diasRenovacion,
    usuariosInvitados,
    veUsuarios,
    sinSucursalActiva: typeof sucursalesActivas === "number" && sucursalesActivas === 0,
  });

  const cambios: TimelineEntry[] = (auditoria.data?.items ?? []).map((entrada) => ({
    id: entrada.id,
    title: auditActionLabel(entrada.action),
    detail: entrada.route ?? undefined,
    when: formatDateTime(entrada.createdAt),
    who: entrada.userId ? nombreUsuario(entrada.userId, usuarios.data) : undefined,
  }));

  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        eyebrow="Administración"
        title="Dashboard de la empresa"
        description={`Cómo está ${currentTenant.name}: sucursales, usuarios, módulos y plan. Qué necesita atención y qué cambió hace poco.`}
        actions={
          <Button asChild variant="secondary">
            <Link href="/admin">Ver el centro administrativo</Link>
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

      <StatusTileRow label="Estado de la empresa">
        <li className="min-w-0">
          <StatusTile
            title="Sucursales activas"
            value={veSucursales ? cifra(sucursales, veSucursales, sucursalesActivas) : tenantBranches.length}
            context={
              listaSucursales && listaSucursales.length !== sucursalesActivas
                ? `${listaSucursales.length - (sucursalesActivas ?? 0)} inactivas.`
                : "Cada persona y cada movimiento pertenece a una."
            }
            href={veSucursales ? "/admin/branches" : undefined}
            actionLabel="Ver sucursales"
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title="Usuarios activos"
            value={cifra(usuarios, veUsuarios, usuariosActivos)}
            context={
              !veUsuarios
                ? "Tu rol no ve la lista de usuarios."
                : usuariosInvitados > 0
                  ? `${usuariosInvitados} ${usuariosInvitados === 1 ? "invitación sin aceptar" : "invitaciones sin aceptar"}.`
                  : usuariosSuspendidos > 0
                    ? `${usuariosSuspendidos} ${usuariosSuspendidos === 1 ? "suspendido" : "suspendidos"}.`
                    : "Todas las invitaciones aceptadas."
            }
            status={usuariosInvitados > 0 ? { label: "Invitaciones pendientes", tone: "warning" as const } : undefined}
            href={veUsuarios ? "/admin/users" : undefined}
            actionLabel="Ver usuarios"
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title="Módulos habilitados"
            value={modulos.length}
            context={modulos.length > 0 ? modulos.map((modulo) => moduleLabels[modulo] ?? modulo).join(", ") : "Ningún módulo habilitado."}
            href={veSuscripcion ? "/admin/company/subscription" : undefined}
            actionLabel="Ver plan"
          />
        </li>
        <li className="min-w-0">
          <StatusTile
            title="Plan contratado"
            value={
              !veSuscripcion
                ? planTierLabel(currentTenant.plan)
                : suscripciones.isLoading
                  ? undefined
                  : suscripciones.isError
                    ? null
                    : suscripcion
                      ? planTierLabel(suscripcion.plan)
                      : planTierLabel(currentTenant.plan)
            }
            context={
              suscripcion
                ? `Renueva ${formatDate(suscripcion.renewalDate)}${typeof diasRenovacion === "number" ? ` (${describirDias(diasRenovacion)})` : ""}.`
                : veSuscripcion && suscripciones.data
                  ? "Sin suscripción registrada para esta empresa."
                  : "Qué está contratado y cuándo renueva."
            }
            status={
              estadoCobro && estadoCobro.tone === "danger"
                ? { label: estadoCobro.label, tone: "danger" as const }
                : typeof diasRenovacion === "number" && diasRenovacion <= DIAS_AVISO_RENOVACION
                  ? { label: "Renueva pronto", tone: "warning" as const }
                  : undefined
            }
            href={veSuscripcion ? "/admin/company/subscription" : undefined}
            actionLabel="Ver plan"
          />
        </li>
      </StatusTileRow>

      {usuarios.isError ? (
        <InlineNote tone="danger" title="No fue posible cargar los usuarios">
          {getApiErrorMessage(usuarios.error, "Reintenta la consulta para continuar.")}
        </InlineNote>
      ) : null}
      {sucursales.isError ? (
        <InlineNote tone="danger" title="No fue posible cargar las sucursales">
          {getApiErrorMessage(sucursales.error, "Reintenta la consulta para continuar.")}
        </InlineNote>
      ) : null}

      <PageSection title="Operaciones de administración" description="Cada pantalla dice para qué sirve, con icono y texto.">
        <ul className="grid gap-3 [&>li]:min-w-0 sm:grid-cols-2 xl:grid-cols-3">
          {can("admin.company") ? (
            <Destino href="/admin/company" icon={Building2} label="Configuración de empresa" detail="Marca, portal de empleo y correo saliente." />
          ) : null}
          {veSucursales ? (
            <Destino href="/admin/branches" icon={GitBranch} label="Sucursales" detail="Dónde opera la empresa." />
          ) : null}
          {veUsuarios ? (
            <Destino href="/admin/users" icon={UsersRound} label="Usuarios" detail="Quién puede entrar, con qué rol y en qué estado." />
          ) : null}
          {can("roles.view") ? (
            <Destino href="/admin/roles" icon={ShieldCheck} label="Roles y permisos" detail="Qué puede hacer cada rol." />
          ) : null}
          {veSuscripcion ? (
            <Destino href="/admin/company/subscription" icon={CreditCard} label="Plan contratado" detail="Qué se paga y cuándo renueva." />
          ) : null}
          {veAuditoria ? (
            <Destino href="/admin/audit" icon={ClipboardList} label="Auditoría" detail="Qué se hizo, quién y cuándo." />
          ) : null}
        </ul>
      </PageSection>

      <div className="grid gap-6 xl:grid-cols-2 [&>*]:min-w-0">
        <PageSection title="Sucursales" description="Estado de cada sede de la empresa." boxed>
          {!veSucursales && tenantBranches.length === 0 ? (
            <p className="text-sm text-ink-2">Tu rol no ve la lista de sucursales.</p>
          ) : sucursales.isLoading ? (
            <SkeletonRows rows={3} />
          ) : !listaSucursales || listaSucursales.length === 0 ? (
            <EmptyState
              reason="no-records"
              title="Todavía no hay sucursales"
              description="Sin una sucursal activa no se pueden registrar personas ni movimientos."
              action={
                veSucursales ? (
                  <Button asChild variant="outline">
                    <Link href="/admin/branches">Crear sucursal</Link>
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
                    label={sucursal.status === "active" ? "Activa" : "Inactiva"}
                  />
                </li>
              ))}
            </ul>
          )}
        </PageSection>

        <PageSection title="Cambió hace poco" description="Últimas acciones registradas en la auditoría de la empresa." boxed>
          {!veAuditoria ? (
            <p className="text-sm text-ink-2">Tu rol no ve la auditoría.</p>
          ) : auditoria.isLoading ? (
            <SkeletonRows rows={3} />
          ) : auditoria.isError ? (
            <ErrorState
              title="No fue posible cargar la auditoría"
              detail={getApiErrorMessage(auditoria.error, "Reintenta la consulta para continuar.")}
              onRetry={() => void auditoria.refetch()}
            />
          ) : cambios.length === 0 ? (
            <EmptyState reason="no-records" title="Sin acciones registradas" description="Cuando alguien cambie algo, quedará aquí." />
          ) : (
            <>
              <Timeline entries={cambios} />
              <p className="mt-4 text-sm">
                <Link href="/admin/audit" className="inline-flex min-h-[var(--control-h-base)] items-center gap-1 font-medium text-ink-1 hover:underline">
                  Ver toda la auditoría
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </p>
            </>
          )}
        </PageSection>
      </div>

      {veUsuarios && usuarios.data ? (
        <PageSection title="Usuarios por rol" description="Cuántas personas tienen cada rol en la empresa." boxed>
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
                  <span className="min-w-0 truncate text-sm font-medium text-ink-1">{roleLabels[rol as keyof typeof roleLabels] ?? rol}</span>
                  <span className="font-mono text-lg font-semibold tabular-figures text-ink-1">{total}</span>
                </li>
              ))}
          </ul>
        </PageSection>
      ) : null}
    </div>
  );
}

function siguienteAccion({
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
      label: "Lo más urgente",
      title: "Regularizar el cobro del plan",
      detail: "El último cobro no se completó. Mientras siga así, la empresa puede perder acceso.",
      href: "/admin/company/subscription",
      actionLabel: "Ver plan",
      tone: "danger" as const,
    };
  }
  if (sinSucursalActiva) {
    return {
      label: "Lo más urgente",
      title: "Activar al menos una sucursal",
      detail: "Sin sucursal activa no se pueden registrar personas ni movimientos.",
      href: "/admin/branches",
      actionLabel: "Ver sucursales",
      tone: "danger" as const,
    };
  }
  if (veSuscripcion && typeof diasRenovacion === "number" && diasRenovacion <= DIAS_AVISO_RENOVACION) {
    return {
      label: "Lo siguiente",
      title: "Revisar la renovación del plan",
      detail: `El plan renueva ${describirDias(diasRenovacion)}.`,
      href: "/admin/company/subscription",
      actionLabel: "Ver plan",
      tone: "warning" as const,
    };
  }
  if (veUsuarios && usuariosInvitados > 0) {
    return {
      label: "Lo siguiente",
      title: "Hay invitaciones sin aceptar",
      detail: `${usuariosInvitados} ${usuariosInvitados === 1 ? "persona todavía no entró" : "personas todavía no entraron"} con su invitación. Reenvíala o revisa el correo.`,
      href: "/admin/users?status=invited",
      actionLabel: "Ver usuarios",
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

function describirDias(dias: number) {
  if (dias < 0) return `hace ${Math.abs(dias)} ${Math.abs(dias) === 1 ? "día" : "días"}`;
  if (dias === 0) return "hoy";
  return `en ${dias} ${dias === 1 ? "día" : "días"}`;
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
