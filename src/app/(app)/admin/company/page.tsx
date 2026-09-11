"use client";

import { useUiText } from "@/components/ui-copy";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchBranches, fetchTenantUsers } from "@/lib/backend";
import { ArrowRight, Building2, CalendarDays, CreditCard, Mail, Megaphone, ShieldCheck, Users } from "lucide-react";
import { Metric, MetricRow, PageHeader, PageSection } from "@/components/system";
import { Button } from "@/components/ui/button";
import { moduleLabels } from "@/lib/ui-labels";
import { planTierLabel, tenantStatusInfo } from "@/lib/platform-labels";
import { useAppStore } from "@/store/app-store";

/** Ajustes de empresa con accesos a cada pantalla de configuración. */

export default function CompanySettingsPage() {
  const uiText = useUiText();
  const { currentTenant, can } = useAppStore();
  const canViewBranches = can("branches.view");
  const canViewUsers = can("users.view");
  // Share the dashboard queries so both screens show the same live totals.
  const branches = useQuery({
    queryKey: ["branches", currentTenant.id],
    queryFn: () => fetchBranches(currentTenant.id),
    enabled: canViewBranches && Boolean(currentTenant.id),
    staleTime: 60_000,
  });
  const users = useQuery({
    queryKey: ["tenant-users", currentTenant.id],
    queryFn: () => fetchTenantUsers(currentTenant.id),
    enabled: canViewUsers && Boolean(currentTenant.id),
    staleTime: 60_000,
  });
  const activeBranches = canViewBranches && !branches.isError ? branches.data?.filter((branch) => branch.status === "active").length : undefined;
  const activeUsers = canViewUsers && !users.isError ? users.data?.filter((user) => user.status === "active").length : undefined;


  const destinations = [
    { href: "/admin/company/smtp", icon: Mail, title: uiText("Correo saliente (SMTP)"), detail: uiText("Configura el remitente de la empresa, el servidor SMTP y los envíos de prueba."), visible: can("admin.company") },
    { href: "/admin/company/calendar", icon: CalendarDays, title: "Calendarios y entrevistas", detail: "Conecta Google o Microsoft para agendar entrevistas y crear enlaces de reunión.", visible: can("admin.company") },
    {
      href: "/admin/company/career-portal",
      icon: Megaphone,
      title: "Portal de empleo",
      detail: "Cómo ven la empresa las personas candidatas: marca, textos y vacantes publicadas.",
      visible: true,
    },
    {
      href: "/admin/branches",
      icon: Building2,
      title: uiText("Sucursales"),
      detail: "Dónde opera la empresa. Cada persona y cada movimiento pertenece a una sucursal.",
      visible: can("branches.view"),
    },
    {
      href: "/admin/users",
      icon: Users,
      title: "Personas y accesos",
      detail: "Quién puede entrar y con qué rol.",
      visible: can("admin.users"),
    },
    {
      href: "/admin/roles",
      icon: ShieldCheck,
      title: uiText("Roles y permisos"),
      detail: "Qué puede hacer cada rol dentro de cada módulo.",
      visible: can("admin.roles"),
    },
    {
      href: "/admin/company/subscription",
      icon: CreditCard,
      title: "Plan y facturación",
      detail: "Qué está contratado, qué se paga y cuándo renueva.",
      visible: true,
    },
  ].filter((item) => item.visible);

  const status = tenantStatusInfo(currentTenant.status ?? "active");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={uiText("Configuración")}
        title={currentTenant.name}
        description={uiText("Los ajustes que afectan a toda la empresa: dónde opera, quién entra, cómo se presenta y desde qué dirección envía correo.")}
        actions={
          <Button asChild>
            <Link href="/admin/company/career-portal">{uiText("Ver el portal de empleo")}</Link>
          </Button>
        }
      />

      <MetricRow>
        <Metric label={uiText("Estado")} value={status.label} detail={status.detail} />
        <Metric label="Plan" value={planTierLabel(currentTenant.plan)} />
        <Metric label={uiText("Sucursales activas")} value={activeBranches === undefined ? "—" : String(activeBranches)} detail={!canViewBranches ? uiText("Sin permiso para consultar") : branches.isError ? uiText("No se pudo cargar el conteo") : branches.isLoading ? uiText("Cargando...") : undefined} />
        <Metric label={uiText("Usuarios activos")} value={activeUsers === undefined ? "—" : String(activeUsers)} detail={!canViewUsers ? uiText("Sin permiso para consultar") : users.isError ? uiText("No se pudo cargar el conteo") : users.isLoading ? uiText("Cargando...") : undefined} />
      </MetricRow>

      <PageSection title={uiText("Ajustes de la empresa")} description={uiText("Cada uno abre la pantalla donde se cambia de verdad.")}>
        <ul className="grid gap-3 md:grid-cols-2">
          {destinations.map((destination) => {
            const Icon = destination.icon;
            return (
              <li key={destination.href}>
                <Link
                  href={destination.href}
                  className="flex min-h-[var(--control-h-touch)] items-start gap-3 rounded-lg border border-line bg-surface-1 p-4 transition-colors hover:border-line-strong hover:bg-surface-2"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-md border border-line bg-surface-2 text-ink-2"
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1 font-medium text-ink-1">
                      {destination.title}
                      <ArrowRight className="size-3.5 text-ink-3" aria-hidden="true" />
                    </span>
                    <span className="mt-1 block text-sm text-ink-2">{destination.detail}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </PageSection>

      <PageSection
        title={uiText("Módulos habilitados")}
        description={uiText("Lo que la empresa tiene contratado y aparece en el menú de su gente.")}
      >
        {currentTenant.enabledModules.length === 0 ? (
          <p className="text-sm text-ink-2">
            {uiText("Esta empresa no tiene ningún módulo habilitado. Quien administra la plataforma puede activarlos.")}</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {currentTenant.enabledModules.map((module) => (
              <span key={module} className="rounded-md border border-line bg-surface-2 px-2 py-1 text-2xs text-ink-2">
                {moduleLabels[module]}
              </span>
            ))}
          </div>
        )}
      </PageSection>


    </div>
  );
}
