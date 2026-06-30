import { PageIntro, SectionCard, InfoList } from "@/components/ui";

export default function ProfilePage() {
  return (
    <>
      <PageIntro
        eyebrow="Perfil del usuario"
        title="Preferencias, seguridad y sesiones activas."
        description="Pantalla pensada para autonomia del usuario sin exponer configuraciones criticas del tenant."
      />
      <SectionCard title="Cuenta personal" subtitle="Seguridad">
        <InfoList
          items={[
            { title: "Email principal", description: "sofia.herrera@grupoandina.com" },
            { title: "MFA", description: "Disponible como siguiente mejora del flujo de acceso", badge: "Roadmap" },
            { title: "Sesiones activas", description: "MacBook Pro · iPhone · navegador corporativo" },
          ]}
        />
      </SectionCard>
    </>
  );
}
