"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ModuleHeader, SectionCard, DataTable, InfoList, SplitPanel } from "@/components/ui";
import { automationJourneys } from "@/lib/mock-data";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { completeComplianceAutomation, fetchAdminComplianceWorkspace } from "@/lib/mock-backend";
import { roleLabels } from "@/lib/ui-labels";

export default function AdminPanelPage() {
  const { currentRole, currentTenant, tenantBranches, tenantUsers, tenants } = useAppStore();
  const queryClient = useQueryClient();
  const complianceQuery = useQuery({
    queryKey: ["admin-compliance-workspace", currentTenant.id],
    queryFn: () => fetchAdminComplianceWorkspace(currentTenant.id),
  });
  const refreshAdminFlowQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-compliance-workspace", currentTenant.id] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-summary", currentTenant.id] });
    queryClient.invalidateQueries({ queryKey: ["master-workflow-card", currentTenant.id] });
    queryClient.invalidateQueries({ queryKey: ["productivity-workspace", currentTenant.id] });
    queryClient.invalidateQueries({ queryKey: ["training-workspace", currentTenant.id] });
    queryClient.invalidateQueries({ queryKey: ["automation-summary", currentTenant.id] });
  };
  const complianceMutation = useMutation({
    mutationFn: (employeeName: string) => completeComplianceAutomation(employeeName),
    onSuccess: () => {
      refreshAdminFlowQueries();
      toast.success("Cierre administrativo y de cumplimiento completado");
    },
    onError: (error: Error) => toast.error(error.message || "No se pudo cerrar cumplimiento"),
  });

  const tenantRows = useMemo(
    () => [
      ["TalentOS Cloud USA", "Empresarial", "Todos los modulos", "Activo"],
      ["Sunrise Health Florida", "Crecimiento", "ATS + Incorporacion + Capacitacion", "Prueba"],
      ["Gulfshore Logistics", "Inicial", "Inventario + Perfil", "Activo"],
    ],
    [],
  );

  const branchRows = useMemo(
    () =>
      tenantBranches.map((branch) => [
        branch.name,
        branch.city,
        branch.manager,
        `${branch.employees} personas`,
      ]),
    [tenantBranches],
  );

  const userRows = useMemo(
    () =>
      tenantUsers.map((user) => [
        user.fullName,
        roleLabels[user.role],
        user.email,
        user.status,
      ]),
    [tenantUsers],
  );

  const isSaasAdmin = currentRole === "admin_saas";

  if (isSaasAdmin) {
    return (
      <>
        <ModuleHeader
          eyebrow="Gobierno SaaS"
        title="Gobierno global de empresas, planes, modulos y suscripciones en una sola capa."
          description="Esta vista separa claramente la administracion de plataforma del trabajo interno de cada empresa para reforzar seguridad, claridad funcional y escalabilidad comercial."
          actions={
            <Button asChild>
              <Link href="/admin/tenants">Gestionar empresas</Link>
            </Button>
          }
          metrics={[
            { label: "Empresas activas", value: `${tenants.length}`, detail: "Cartera visible para el gobierno central del SaaS" },
            { label: "Provisionamiento promedio", value: "90 s", detail: "Desde alta comercial hasta acceso inicial" },
            { label: "Alertas de auditoria", value: "7", detail: "Cambios privilegiados pendientes de revision" },
          ]}
        />
        <SplitPanel
          left={
            <SectionCard title="Gobierno multiempresa" subtitle="Superadministrador SaaS">
              <DataTable columns={["Empresa", "Plan", "Modulos", "Estado"]} rows={tenantRows} />
            </SectionCard>
          }
          right={
            <SectionCard title="Salud del gobierno global" subtitle="Monitoreo SaaS">
              <div className="space-y-5">
                <InfoList
                  items={[
                    { title: "Suscripciones activas", description: "La lectura global prioriza empresas, modulos, ciclos de facturacion y riesgo de expansion.", badge: "Portafolio" },
                    { title: "Gobierno de modulos", description: "La habilitacion por plan ya no se mezcla con la operacion interna por empresa.", badge: "Separado" },
                    { title: "Auditoria privilegiada", description: "Los cambios de alto impacto deben revisarse desde esta capa y no desde la consola empresarial.", badge: "Control" },
                  ]}
                />

                <InfoList
                  items={automationJourneys.map((journey) => ({
                    title: journey.title,
                    description: `${journey.description} ${journey.systems}.`,
                    badge: journey.status,
                  }))}
                />
              </div>
            </SectionCard>
          }
        />
      </>
    );
  }

  return (
    <>
      <ModuleHeader
        eyebrow="Operacion de empresa"
        title={`Control interno de ${currentTenant.name} para usuarios, sucursales, roles y configuracion.`}
        description="Esta capa esta enfocada en operar la empresa activa, no en gobernar toda la plataforma SaaS. Asi la experiencia del administrador empresarial queda mas clara y segura."
        actions={
          <Button asChild>
            <Link href="/admin/users">Gestionar usuarios</Link>
          </Button>
        }
        metrics={[
          { label: "Usuarios internos", value: `${tenantUsers.length}`, detail: "Identidades visibles dentro de la empresa activa" },
          { label: "Sucursales activas", value: `${tenantBranches.length}`, detail: "Operacion local y supervisores por sede" },
          { label: "Configuraciones clave", value: "4", detail: "Roles, empresa, sucursales y accesos internos" },
        ]}
      />
      <SplitPanel
        left={
          <SectionCard title="Operacion por sucursal" subtitle="Administrador de empresa">
            <div className="space-y-5">
              <DataTable columns={["Sucursal", "Ciudad", "Supervisor", "Dotacion"]} rows={branchRows} />

              <div className="space-y-3">
                {(complianceQuery.data?.compliance ?? []).map((checkpoint) => {
                  const isCompleted = checkpoint.status === "Completado";
                  return (
                    <div
                      key={checkpoint.id}
                      className="rounded-2xl border border-border/70 bg-secondary/25 p-4"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">
                            {checkpoint.employeeName} · {checkpoint.branch}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {checkpoint.owner}. {checkpoint.nextAction}
                          </p>
                        </div>
                        <Button
                          variant={isCompleted ? "secondary" : "default"}
                          disabled={isCompleted || complianceMutation.isPending}
                          onClick={() => complianceMutation.mutate(checkpoint.employeeName)}
                        >
                          {isCompleted
                            ? "Cumplimiento cerrado"
                            : complianceMutation.isPending
                              ? "Actualizando..."
                              : "Cerrar cumplimiento"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </SectionCard>
        }
        right={
          <SectionCard title="Usuarios, handoffs y gobierno interno" subtitle="Empresa activa">
            <div className="space-y-5">
              <DataTable columns={["Usuario", "Rol", "Correo", "Estado"]} rows={userRows} />

              <InfoList
                items={(complianceQuery.data?.handoffs ?? []).map((handoff) => ({
                  title: `${handoff.employeeName} · operación`,
                  description: `${handoff.branch}. ${handoff.nextAction}`,
                  badge: handoff.status,
                }))}
              />

              <InfoList
                items={(complianceQuery.data?.automationAudit ?? []).slice(0, 3).map((entry) => ({
                  title: `${entry.employeeName} · ${entry.ruleName}`,
                  description: `${entry.summary} ${entry.executedAt}.`,
                  badge: entry.status,
                }))}
              />

              <InfoList
                items={[
                  { title: "Alcance correcto", description: "Esta capa administra la operacion interna de la empresa y no el gobierno global del SaaS.", badge: "Empresa" },
                  { title: "Seguridad funcional", description: "Usuarios, sucursales, roles y configuracion viven aqui para evitar mezclar permisos de plataforma con permisos empresariales." },
                  { title: "Escalabilidad comercial", description: "La separacion mejora demos, incorporacion comercial y lectura de valor por perfil administrador." },
                ]}
              />
            </div>
          </SectionCard>
        }
      />
    </>
  );
}
