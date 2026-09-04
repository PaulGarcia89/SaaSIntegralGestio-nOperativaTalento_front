"use client";

import Link from "next/link";
import { Building2, Cable, GitBranch, ShieldCheck, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/design-system";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";

export default function AdminPage() {
  const { can } = useAppStore();
  const sections = [
    { href: "/admin/company", permission: "admin.company" as const, label: "Empresa", description: "Marca, contexto operativo e integraciones por empresa.", icon: Building2 },
    { href: "/admin/branches", permission: "branches.view" as const, label: "Sucursales", description: "Crea y administra las sedes disponibles para la operación.", icon: GitBranch },
    { href: "/admin/users", permission: "users.view" as const, label: "Usuarios", description: "Administra identidades, roles y estados de acceso internos.", icon: UsersRound },
    { href: "/admin/roles", permission: "roles.view" as const, label: "Roles y permisos", description: "Revisa el alcance de cada perfil antes de otorgar acceso.", icon: ShieldCheck },
    { href: "/admin/automations", permission: "admin.view" as const, label: "Automatizaciones", description: "Crea, simula y audita reglas operativas sin código.", icon: Cable },
  ].filter((section) => can(section.permission));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administración"
        title="Centro administrativo"
        description="Configura la empresa y accede a los controles operativos disponibles para tu rol."
        actions={<Button asChild><Link href="/admin/company/subscription">Ver suscripción</Link></Button>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sections.map(({ href, label, description, icon: Icon }) => (
          <Card key={href} level={2} className="group transition-shadow hover:shadow-md">
            <CardContent className="flex min-h-44 flex-col p-5">
              <Icon className="size-5 text-brand" aria-hidden="true" />
              <h2 className="mt-4 font-semibold">{label}</h2>
              <p className="mt-1 text-sm leading-6 text-text-secondary">{description}</p>
              <Button asChild variant="ghost" size="sm" className="mt-auto w-fit px-0 text-brand hover:bg-transparent hover:text-brand">
                <Link href={href}>Abrir sección</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
