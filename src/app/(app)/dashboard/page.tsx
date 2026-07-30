"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "@/store/app-store";
import type { RoleKey } from "@/lib/contracts";
import { fetchApplications, fetchVacancies } from "@/lib/backend";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineFeedback, MetricWithProvenance, PageHeader } from "@/components/design-system";

const roleDashboard: Partial<Record<RoleKey, { title: string; items: Array<[string, string]> }>> = {
  admin_empresa: { title: "Lo que requiere atención en tu empresa", items: [["Estado de la suscripción", "/admin/company/subscription"], ["Incorporaciones en curso", "/onboarding/documents"], ["Vacantes activas", "/ats/vacancies"], ["Inventario pendiente", "/inventory"]] },
  rrhh: { title: "Lo que requiere atención en reclutamiento", items: [["Candidatos por revisar", "/ats/candidates"], ["Entrevistas próximas", "/ats/interviews"], ["Pipeline", "/ats/pipeline"], ["Documentos pendientes", "/onboarding/documents"]] },
  reclutador: { title: "Lo que requiere atención en reclutamiento", items: [["Candidatos por revisar", "/ats/candidates"], ["Entrevistas próximas", "/ats/interviews"], ["Vacantes", "/ats/vacancies"], ["Pipeline", "/ats/pipeline"]] },
  supervisor: { title: "Lo que requiere atención en tu equipo", items: [["Equipo", "/employees"], ["Productividad", "/productivity"], ["Activos asignados", "/inventory"], ["Alertas", "/notifications"]] },
  empleado: { title: "Lo que requiere tu atención", items: [["Mi incorporación", "/onboarding/documents"], ["Mis cursos", "/training"], ["Mis documentos", "/onboarding/signatures"], ["Mis activos", "/inventory"]] },
};

export default function DashboardPage() {
  const { currentRole, currentBranch, allowedNav, can, hasModule } = useAppStore();
  const canReadAts = hasModule("ats") && can("ats.view");
  const applications = useQuery({ queryKey: ["dashboard-applications", currentBranch?.id], queryFn: () => fetchApplications({ branchId: currentBranch?.id }), enabled: canReadAts && Boolean(currentBranch) });
  const vacancies = useQuery({ queryKey: ["dashboard-vacancies", currentBranch?.id], queryFn: fetchVacancies, enabled: canReadAts && Boolean(currentBranch) });
  const configuration = roleDashboard[currentRole] ?? { title: currentRole === "admin_saas" || currentRole === "admin_plataforma" ? "Lo que requiere atención en la plataforma" : "Lo que requiere tu atención", items: allowedNav.filter((item) => item.href !== "/dashboard" && item.href !== "/profile").slice(0, 4).map((item) => [item.label, item.href] as [string, string]) };
  const visibleItems = configuration.items.filter(([, href]) => allowedNav.some((item) => item.href === href));
  const applicationItems = applications.data?.data ?? [];
  const vacancyItems = vacancies.data?.data ?? [];
  const updatedAt = applications.dataUpdatedAt ? new Date(applications.dataUpdatedAt) : new Date();
  const atsMetrics = [
    { label: "Nuevas por revisar", value: applicationItems.filter((item) => item.status === "SUBMITTED").length, href: "/ats/pipeline?stage=SUBMITTED" },
    { label: "En revisión", value: applicationItems.filter((item) => item.status === "REVIEWING").length, href: "/ats/pipeline?stage=REVIEWING" },
    { label: "En entrevistas", value: applicationItems.filter((item) => item.status === "INTERVIEW").length, href: "/ats/pipeline?stage=INTERVIEW" },
    { label: "Vacantes publicadas", value: vacancyItems.filter((item) => String(item.status).toUpperCase() === "OPEN" || String(item.status).toUpperCase() === "PUBLISHED").length, href: "/ats/vacancies" },
  ];
  return <div className="space-y-7">
    <PageHeader eyebrow="Inicio personalizado" title={configuration.title} description="Prioriza tus siguientes acciones. Los contadores aparecerán únicamente cuando el resumen operativo real esté disponible." />
    {canReadAts && applications.isSuccess && vacancies.isSuccess ? <section aria-label="Resumen real de reclutamiento" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{atsMetrics.map((metric) => <MetricWithProvenance key={metric.label} label={metric.label} value={metric.value} period="Estado actual de la sucursal" updatedAt={updatedAt} action={<Button asChild variant="secondary" className="w-full"><Link href={metric.href}>Revisar<ArrowRight className="size-4" /></Link></Button>} />)}</section> : <InlineFeedback tone="warning" title="Resumen operativo pendiente de integración">No mostramos métricas, alertas ni prioridades simuladas. Puedes entrar directamente a las áreas autorizadas.</InlineFeedback>}
    {canReadAts && (applications.isError || vacancies.isError) ? <InlineFeedback tone="danger" title="No pudimos actualizar el resumen">Las áreas operativas siguen disponibles. Reintenta desde Candidatos o Vacantes.</InlineFeedback> : null}
    <section aria-label="Accesos prioritarios" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{visibleItems.map(([label, href]) => <Card level={2} key={href}><CardHeader><CardTitle className="text-lg">{label}</CardTitle></CardHeader><CardContent><Button asChild variant="secondary" className="w-full"><Link href={href}>Abrir <ArrowRight className="size-4" /></Link></Button></CardContent></Card>)}</section>
  </div>;
}
