"use client";

import Link from "next/link";
import { ArrowRight, Building2, CreditCard, Mail, Megaphone, ShieldCheck, Users } from "lucide-react";
import { Metric, MetricRow, PageHeader, PageSection } from "@/components/system";
import { Button } from "@/components/ui/button";
import { CompanyEmailSettings } from "@/components/company-email-settings";
import { moduleLabels } from "@/lib/ui-labels";
import { planTierLabel, tenantStatusInfo } from "@/lib/platform-labels";
import { useAppStore } from "@/store/app-store";

/**
 * Configuración de la empresa.
 *
 * Esta pantalla mostraba tres cifras —«2 dominios», «14 plantillas», «5
 * integraciones»— escritas a mano en el propio archivo. No venían de ninguna
 * consulta: eran constantes. La pantalla presentaba números inventados como si
 * fueran datos de la empresa, que es la peor cosa que puede hacer un panel de
 * administración. Ahora las cifras salen de la empresa activa (sucursales,
 * personas, módulos habilitados) o no se muestran.
 *
 * El resto era prosa estática dentro de dos `InfoList`: seis párrafos que
 * describían conceptos («separación por sucursal», «políticas de acceso») sin
 * llevar a ninguna parte, con una insignia que decía «RBAC» —un acrónimo de
 * documentación técnica—. Se sustituyen por accesos a las pantallas que sí
 * existen y hacen ese trabajo.
 *
 * Lo único con función real de la pantalla anterior, la configuración de
 * correo saliente, se conserva intacta.
 */

export default function CompanySettingsPage() {
  const { currentTenant, can } = useAppStore();

  const destinations = [
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
      title: "Sucursales",
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
      title: "Roles y permisos",
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
        eyebrow="Configuración"
        title={currentTenant.name}
        description="Los ajustes que afectan a toda la empresa: dónde opera, quién entra, cómo se presenta y desde qué dirección envía correo."
        actions={
          <Button asChild>
            <Link href="/admin/company/career-portal">Ver el portal de empleo</Link>
          </Button>
        }
      />

      <MetricRow>
        <Metric label="Estado" value={status.label} detail={status.detail} />
        <Metric label="Plan" value={planTierLabel(currentTenant.plan)} />
        <Metric label="Sucursales" value={String(currentTenant.branchCount ?? 0)} />
        <Metric label="Personas" value={String(currentTenant.employeeCount ?? 0)} />
      </MetricRow>

      <PageSection title="Ajustes de la empresa" description="Cada uno abre la pantalla donde se cambia de verdad.">
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
        title="Módulos habilitados"
        description="Lo que la empresa tiene contratado y aparece en el menú de su gente."
      >
        {currentTenant.enabledModules.length === 0 ? (
          <p className="text-sm text-ink-2">
            Esta empresa no tiene ningún módulo habilitado. Quien administra la plataforma puede activarlos.
          </p>
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

      <PageSection
        title="Correo saliente"
        description="Desde qué dirección salen las invitaciones, las ofertas y los recordatorios de la empresa."
      >
        <div className="flex items-start gap-3 rounded-lg border border-line bg-surface-2 p-4 text-sm text-ink-2">
          <Mail className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden="true" />
          <p>
            Si no se configura, el producto envía desde su remitente por defecto y quien recibe el correo no reconoce a
            la empresa.
          </p>
        </div>
        <div className="mt-4">
          <CompanyEmailSettings />
        </div>
      </PageSection>
    </div>
  );
}
