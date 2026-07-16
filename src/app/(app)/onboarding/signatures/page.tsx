"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  completeOnboardingAutomation,
  fetchOnboardingWorkspace,
} from "@/lib/mock-backend";
import { useAppStore } from "@/store/app-store";
import { ModuleHeader, SectionCard, InfoList, SplitPanel } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SignaturesPage() {
  const { currentTenant } = useAppStore();
  const queryClient = useQueryClient();
  const onboardingQuery = useQuery({
    queryKey: ["onboarding-workspace", currentTenant.id],
    queryFn: () => fetchOnboardingWorkspace(currentTenant.id),
  });

  const completeMutation = useMutation({
    mutationFn: (employeeName: string) => completeOnboardingAutomation(employeeName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-workspace", currentTenant.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary", currentTenant.id] });
      queryClient.invalidateQueries({ queryKey: ["productivity-workspace", currentTenant.id] });
      queryClient.invalidateQueries({ queryKey: ["inventory-activations", currentTenant.id] });
      queryClient.invalidateQueries({ queryKey: ["training-workspace", currentTenant.id] });
      queryClient.invalidateQueries({ queryKey: ["master-workflow-card", currentTenant.id] });
      queryClient.invalidateQueries({ queryKey: ["automation-summary", currentTenant.id] });
      toast.success("Incorporacion completada y flujo maestro actualizado");
    },
    onError: (error: Error) => toast.error(error.message || "No se pudo completar la incorporacion"),
  });

  if (onboardingQuery.isLoading || !onboardingQuery.data) {
    return <SectionCard title="Cargando firmas" subtitle="Firma electronica">Preparando paquetes documentales y estados por colaborador.</SectionCard>;
  }

  const signaturePackages = onboardingQuery.data.signaturePackages;

  return (
    <>
      <ModuleHeader
        eyebrow="Firma electronica"
        title="Seguimiento visual del proceso de firma para cada documento y participante."
        description="El diseno contempla preview del contrato, progreso por firmante y estados accionables como enviado, firmado o rechazado."
        actions={
          <Button asChild>
            <Link href="/onboarding/documents">Ver documentos</Link>
          </Button>
        }
        metrics={[
          {
            label: "Firmas completas",
            value: `${signaturePackages.filter((pkg) => pkg.status === "Completado").length}`,
            detail: "Paquetes finalizados sin intervencion manual",
          },
          {
            label: "Pendientes",
            value: `${signaturePackages.filter((pkg) => pkg.status.includes("Pendiente")).length}`,
            detail: "Firmante principal aun no completa el proceso",
          },
          {
            label: "En transito",
            value: `${signaturePackages.filter((pkg) => pkg.status.includes("En transito")).length}`,
            detail: "Paquetes enviados recientemente",
          },
        ]}
      />
      <SplitPanel
        left={
          <SectionCard title="Flujo de firma" subtitle="Documentos activos">
            <div className="space-y-4">
              <InfoList
                items={[
                  { title: "Contrato laboral", description: "Firmado por empresa y candidato", badge: "Completado" },
                  { title: "Acuerdo de confidencialidad", description: "Pendiente firma del colaborador", badge: "Pendiente" },
                  { title: "Autorizacion de datos", description: "Enviado hace 30 minutos", badge: "En transito" },
                ]}
              />

              <div className="space-y-3">
                {signaturePackages.map((pkg) => (
                  <div key={pkg.id} className="rounded-2xl border border-border/70 bg-card/90 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{pkg.title}</p>
                        <p className="text-sm text-muted-foreground">Participantes: {pkg.participants}</p>
                        <p className="text-sm leading-6 text-muted-foreground">{pkg.nextAction}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={pkg.status === "Completado" ? "secondary" : "outline"} className="rounded-full">
                          {pkg.status}
                        </Badge>
                        {pkg.status !== "Completado" ? (
                          <Button
                            size="sm"
                            onClick={() => completeMutation.mutate(pkg.employeeName)}
                            disabled={completeMutation.isPending}
                          >
                            {completeMutation.isPending ? "Actualizando..." : "Marcar incorporacion completa"}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        }
        right={
          <SectionCard title="Orquestacion de firma" subtitle="Estado">
            <InfoList
              items={[
                { title: "Secuencia clara por actor", description: "Empresa, colaborador, supervisor y RRHH pueden firmar en distinto orden según el paquete documental.", badge: "Flujo" },
                { title: "Riesgo controlado", description: "Los paquetes pendientes deben escalar si la firma no ocurre antes de la fecha limite o impacta fecha de inicio." },
                { title: "Cumplimiento visible", description: "El expediente no debe quedar listo si cumplimiento no marca el paquete como auditable.", badge: "Control" },
                { title: "Cierre del ingreso", description: "El expediente solo debe pasar a listo cuando firma y checklist por actor están completos.", badge: "Regla" },
              ]}
            />
          </SectionCard>
        }
      />
    </>
  );
}
