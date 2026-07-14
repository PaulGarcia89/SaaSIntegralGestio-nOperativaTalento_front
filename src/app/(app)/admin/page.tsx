import Link from "next/link";
import { ModuleHeader, SectionCard, DataTable, InfoList, SplitPanel } from "@/components/ui";
import { Button } from "@/components/ui/button";

const tenants = [
  ["TalentOS Cloud USA", "Empresarial", "Todos los modulos", "Activo"],
  ["Sunrise Health Florida", "Crecimiento", "ATS + Onboarding + Capacitacion", "Prueba"],
  ["Gulfshore Logistics", "Inicial", "Inventario + Perfil", "Activo"],
];

export default function AdminPanelPage() {
  return (
    <>
      <ModuleHeader
        eyebrow="Panel de administracion"
        title="Vista central para empresas, planes, modulos y estado del negocio SaaS."
        description="Diseno enfocado en gobernanza, monitoreo de suscripciones y control de configuracion por empresa."
        actions={
          <Button asChild>
            <Link href="/admin/tenants">Gestionar empresas</Link>
          </Button>
        }
        metrics={[
          { label: "Empresas activas", value: "36", detail: "Portafolio operando entre Florida y otros estados" },
          { label: "Provisionamiento promedio", value: "90 s", detail: "Desde alta comercial hasta acceso inicial" },
          { label: "Alertas de auditoria", value: "7", detail: "Cambios privilegiados pendientes de revision" },
        ]}
      />
      <SplitPanel
        left={
          <SectionCard title="Empresas activas" subtitle="Multiempresa">
            <DataTable columns={["Empresa", "Plan", "Modulos", "Estado"]} rows={tenants} />
          </SectionCard>
        }
        right={
          <SectionCard title="Salud del sistema" subtitle="Monitoreo">
            <InfoList
              items={[
                { title: "Suscripciones activas", description: "36 empresas entre Florida y Estados Unidos facturan al dia", badge: "99.4%" },
                { title: "Provisionamiento", description: "Las nuevas empresas quedan listas en menos de 90 segundos", badge: "SLA" },
                { title: "Auditoria", description: "7 cambios de acceso privilegiado estan pendientes de revision", badge: "Revision" },
                { title: "Escalamiento comercial", description: "4 cuentas enterprise tienen expansion modular sugerida para este trimestre", badge: "Growth" },
              ]}
            />
          </SectionCard>
        }
      />
    </>
  );
}
