import { PageIntro, SectionCard, InfoList } from "@/components/ui";

export default function CompanySettingsPage() {
  return (
    <>
      <PageIntro
        eyebrow="Configuracion de empresa"
        title="Branding, dominios, parametros y plantillas por tenant."
        description="La administracion de empresa necesita orden, jerarquia y acciones claras para evitar cambios accidentales."
      />
      <SectionCard title="Bloques de configuracion" subtitle="Tenant setup">
        <InfoList
          items={[
            { title: "Identidad visual", description: "Logo, colores secundarios y assets de portal de empleos" },
            { title: "Parametros de proceso", description: "Checklists de onboarding y formularios por cargo" },
            { title: "Integraciones", description: "SSO, correo, firma y sistemas operativos externos" },
          ]}
        />
      </SectionCard>
    </>
  );
}
