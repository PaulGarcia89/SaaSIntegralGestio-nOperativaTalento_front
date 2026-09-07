"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRoutePolicy } from "@/lib/navigation";
import { useLocale } from "@/components/locale-provider";

type BreadcrumbSegment = {
  label: string;
  href?: string;
};

const routeLabels: Record<string, string> = {
  dashboard: "Panel principal",
  admin: "Administración",
  company: "Empresa",
  tenants: "Empresas",
  users: "Usuarios",
  branches: "Sucursales",
  roles: "Roles",
  subscription: "Suscripción",
  modules: "Módulos",
  ats: "ATS",
  vacancies: "Vacantes",
  candidates: "Postulaciones",
  "talent-crm": "Base de talento",
  avanzado: "Vista avanzada",
  interviews: "Entrevistas",
  communications: "Comunicaciones",
  scorecards: "Evaluaciones de entrevista",
  analytics: "Analítica ATS",
  onboarding: "Incorporación",
  documents: "Documentos",
  signatures: "Firmas",
  training: "Capacitación",
  evaluations: "Evaluaciones",
  productivity: "Productividad",
  reports: "Reportes",
  inventory: "Inventario",
  notifications: "Notificaciones",
  automations: "Automatizaciones",
  profile: "Perfil",
  jobs: "Empleos",
  apply: "Aplicar",
  login: "Iniciar sesión",
  "forgot-password": "Recuperar contraseña",
  "register-company": "Registrar empresa",
};

export function AppBreadcrumb({ pathname }: { pathname: string }) {
  const { t } = useLocale();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs: BreadcrumbSegment[] = segments.map((segment, index) => {
    const path = `/${segments.slice(0, index + 1).join("/")}`;
    const exactPolicy = getRoutePolicy(path);
    const policyLabel = exactPolicy?.href === path ? exactPolicy.label : undefined;
    return {
      label: localizedLabel(policyLabel ?? routeLabels[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1), t),
      href: index < segments.length - 1 ? path : undefined,
    };
  });

  return (
    // En un teléfono la miga sobra —el título de la página dice lo mismo unos
    // centímetros más abajo— y, al ser un flex sin `min-w-0`, ensanchaba la
    // cabecera hasta dejar al nombre de la empresa sin sitio.
    <nav
      aria-label="Breadcrumb"
      className="hidden min-w-0 items-center gap-1 overflow-hidden text-xs text-muted-foreground sm:flex"
    >
      {/* El icono es decorativo: el nombre accesible del enlace lo aporta el
          texto oculto. Sin el, este enlace no tiene nombre y axe lo marca como
          `link-name` en todas las pantallas del producto. */}
      <Link href="/dashboard" className="flex items-center gap-1 transition hover:text-foreground">
        <Home className="size-3" aria-hidden="true" />
        <span className="sr-only">{localizedLabel("Inicio", t)}</span>
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.href ?? crumb.label} className="flex min-w-0 items-center gap-1">
          <ChevronRight className="size-3" aria-hidden="true" />
          {crumb.href ? (
            <Link href={crumb.href} className={cn("truncate transition hover:text-foreground")}>
              {crumb.label}
            </Link>
          ) : (
            <span className="truncate font-medium text-foreground">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

function localizedLabel(label: string, t: (key: string) => string) {
  const key = `nav.${label}`;
  const translated = t(key);
  return translated === key ? label : translated;
}
