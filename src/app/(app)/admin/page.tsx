import { PageIntro, SectionCard, DataTable, InfoList } from "@/components/ui";

const tenants = [
  ["Grupo Andina", "Enterprise", "Todos", "Activa"],
  ["Salud Integral", "Growth", "ATS + Onboarding", "Trial"],
  ["Educa Norte", "Scale", "Training + Admin", "Pendiente renovacion"],
];

export default function AdminPanelPage() {
  return (
    <>
      <PageIntro
        eyebrow="Panel de administracion"
        title="Vista central para empresas, planes, modulos y estado del negocio SaaS."
        description="Diseno enfocado en gobernanza, monitoreo de suscripciones y control de configuracion por tenant."
      />

      <div className="split-grid">
        <SectionCard title="Empresas activas" subtitle="Tenants">
          <DataTable columns={["Empresa", "Plan", "Modulos", "Estado"]} rows={tenants} />
        </SectionCard>
        <SectionCard title="Salud del sistema" subtitle="Monitoreo">
          <InfoList
            items={[
              { title: "Suscripciones activas", description: "142 empresas con facturacion al dia", badge: "99.2%" },
              { title: "Provisionamiento", description: "Nuevos tenants listos en menos de 90 segundos", badge: "SLA" },
              { title: "Auditoria", description: "12 cambios criticos pendientes de aprobacion", badge: "Revision" },
            ]}
          />
        </SectionCard>
      </div>
    </>
  );
}
