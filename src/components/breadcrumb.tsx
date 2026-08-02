"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRoutePolicy } from "@/lib/navigation";

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
  candidates: "Postulantes",
  interviews: "Entrevistas",
  communications: "Comunicaciones",
  scorecards: "Fichas de evaluación",
  onboarding: "Incorporación",
  documents: "Documentos",
  signatures: "Firmas",
  training: "Capacitación",
  evaluations: "Evaluaciones",
  productivity: "Productividad",
  reports: "Reportes",
  inventory: "Inventario",
  notifications: "Notificaciones",
  profile: "Perfil",
  jobs: "Empleos",
  apply: "Aplicar",
  login: "Iniciar sesión",
  "forgot-password": "Recuperar contraseña",
  "register-company": "Registrar empresa",
};

export function AppBreadcrumb({ pathname }: { pathname: string }) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs: BreadcrumbSegment[] = segments.map((segment, index) => {
    const path = `/${segments.slice(0, index + 1).join("/")}`;
    const exactPolicy = getRoutePolicy(path);
    const policyLabel = exactPolicy?.href === path ? exactPolicy.label : undefined;
    return {
      label: policyLabel ?? routeLabels[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1),
      href: index < segments.length - 1 ? path : undefined,
    };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground">
      <Link href="/dashboard" className="flex items-center gap-1 transition hover:text-foreground">
        <Home className="size-3" />
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.href ?? crumb.label} className="flex items-center gap-1">
          <ChevronRight className="size-3" />
          {crumb.href ? (
            <Link href={crumb.href} className={cn("transition hover:text-foreground")}>
              {crumb.label}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
