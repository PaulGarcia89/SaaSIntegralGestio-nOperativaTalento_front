"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Boxes,
  Building2,
  Cable,
  ClipboardList,
  CreditCard,
  FileStack,
  GitBranch,
  Layers,
  Receipt,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { PageHeader, PageSection } from "@/components/system";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";

/**
 * Centro administrativo.
 *
 * Listaba cinco tarjetas. Bajo `/admin` hay doce pantallas reales, así que
 * siete quedaban fuera: suscripciones, planes, módulos, empresas, solicitudes
 * de alta, auditoría y facturación. Quien entraba aquí creía que eso era todo
 * lo que hay, y solo llegaba al resto por el menú lateral —que en móvil está
 * plegado—.
 *
 * Ahora están las doce, separadas en dos grupos porque son dos trabajos
 * distintos: administrar la empresa propia y gobernar la plataforma entera.
 * Cada tarjeta sigue apareciendo solo si el permiso lo permite, así que quien
 * administra una empresa ve exactamente el mismo bloque de antes.
 *
 * Cada destino dice para qué sirve, no qué es. «Corta el acceso de toda una
 * empresa» le dice más a quien decide que «gobierno SaaS».
 */

type Destination = {
  href: string;
  label: string;
  description: string;
  icon: typeof Building2;
  visible: boolean;
};

export default function AdminPage() {
  const { can, canAccessGlobalGovernance, currentTenant, impersonation } = useAppStore();
  const globalScope = canAccessGlobalGovernance && !impersonation?.active;

  const company: Destination[] = [
    {
      href: "/admin/company",
      label: "Configuración de empresa",
      description: "Marca, portal de empleo y desde qué dirección sale el correo.",
      icon: Building2,
      visible: can("admin.company"),
    },
    {
      href: "/admin/branches",
      label: "Sucursales",
      description: "Dónde opera la empresa. Cada persona y cada movimiento pertenece a una.",
      icon: GitBranch,
      visible: can("branches.view"),
    },
    {
      href: "/admin/users",
      label: "Usuarios",
      description: "Quién puede entrar, con qué rol y en qué estado.",
      icon: UsersRound,
      visible: can("users.view"),
    },
    {
      href: "/admin/roles",
      label: "Roles y permisos",
      description: "Qué puede hacer cada rol. Cambiarlo afecta a todas las personas que lo tengan.",
      icon: ShieldCheck,
      visible: can("roles.view"),
    },
    {
      href: "/admin/automations",
      label: "Automatizaciones",
      description: "Reglas que actúan solas sobre datos reales. Simúlalas antes de activarlas.",
      icon: Cable,
      visible: can("admin.view"),
    },
    {
      href: "/admin/company/subscription",
      label: "Plan contratado",
      description: "Qué está contratado, qué se paga y cuándo renueva.",
      icon: CreditCard,
      visible: can("admin.subscription"),
    },
    {
      href: "/admin/audit",
      label: "Auditoría",
      description: "Qué se hizo, quién y cuándo. No se puede editar ni borrar: es su razón de ser.",
      icon: ClipboardList,
      visible: can("audit.view"),
    },
  ].filter((item) => item.visible);

  const platform: Destination[] = [
    {
      href: "/admin/tenants",
      label: "Empresas",
      description: "Alta, edición y suspensión. Suspender corta el acceso de toda su gente.",
      icon: Layers,
      visible: globalScope && can("tenants.view"),
    },
    {
      href: "/admin/company-registrations",
      label: "Solicitudes de empresa",
      description: "Altas pendientes de revisar. Aprobar crea la empresa y su primer acceso.",
      icon: FileStack,
      visible: globalScope && can("tenants.view"),
    },
    {
      href: "/admin/plans",
      label: "Planes",
      description: "El catálogo que se puede contratar, con sus topes y sus precios.",
      icon: Boxes,
      visible: globalScope && can("admin.subscription"),
    },
    {
      href: "/admin/subscription",
      label: "Suscripciones",
      description: "Qué plan tiene cada empresa, a qué precio y cuándo renueva.",
      icon: CreditCard,
      visible: globalScope && can("admin.subscription"),
    },
    {
      href: "/admin/billing",
      label: "Facturación",
      description: "Facturas emitidas y cuáles quedaron sin pagar.",
      icon: Receipt,
      visible: globalScope && can("admin.subscription"),
    },
    {
      href: "/admin/modules",
      label: "Módulos por empresa",
      description: "Qué módulos ve cada empresa. Apagar uno lo quita del menú de toda su gente.",
      icon: Boxes,
      visible: globalScope && can("admin.company"),
    },
    {
      href: "/admin/integrations",
      label: "Integraciones y colas",
      description: "Procesamiento, reintentos y eventos descartados de toda la plataforma.",
      icon: Activity,
      visible: globalScope && can("platform.integrations.manage"),
    },
  ].filter((item) => item.visible);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administración"
        title="Centro administrativo"
        description={`Todo lo que puedes configurar en ${currentTenant.name} con tu rol actual.`}
        actions={
          can("admin.subscription") ? (
            <Button asChild>
              <Link href="/admin/company/subscription">Ver el plan contratado</Link>
            </Button>
          ) : undefined
        }
      />

      {company.length > 0 ? (
        <PageSection title="Tu empresa" description="Ajustes que afectan a las personas que trabajan dentro.">
          <DestinationGrid items={company} />
        </PageSection>
      ) : null}

      {platform.length > 0 ? (
        <PageSection
          title="Gobierno de la plataforma"
          description="Alcanza a todas las empresas a la vez. Los cambios de aquí afectan a gente de fuera de la tuya."
        >
          <DestinationGrid items={platform} />
        </PageSection>
      ) : null}

      {company.length === 0 && platform.length === 0 ? (
        <p className="rounded-lg border border-line bg-surface-1 p-6 text-sm text-ink-2">
          Tu rol no tiene ninguna pantalla de administración asignada. Si necesitas alguna, pídesela a quien administra
          la empresa.
        </p>
      ) : null}
    </div>
  );
}

function DestinationGrid({ items }: { items: Destination[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map(({ href, label, description, icon: Icon }) => (
        <li key={href}>
          <Link
            href={href}
            className="flex h-full min-h-[var(--control-h-touch)] items-start gap-3 rounded-lg border border-line bg-surface-1 p-4 transition-colors hover:border-line-strong hover:bg-surface-2"
          >
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-md border border-line bg-surface-2 text-ink-2"
            >
              <Icon className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1 font-medium text-ink-1">
                {label}
                <ArrowRight className="size-3.5 shrink-0 text-ink-3" aria-hidden="true" />
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-ink-2">{description}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
