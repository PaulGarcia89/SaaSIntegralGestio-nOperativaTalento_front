import { PageIntro, SectionCard, DataTable } from "@/components/ui";
import { documents } from "@/lib/mock-data";

export default function DocumentsPage() {
  return (
    <>
      <PageIntro
        eyebrow="Gestion documental"
        title="Documentos, versiones, vencimientos y estado del ingreso."
        description="Una interfaz clara para revisar archivos, detectar pendientes y acelerar la incorporacion."
      />
      <SectionCard title="Estado documental" subtitle="Onboarding">
        <DataTable
          columns={["Documento", "Colaborador", "Estado", "Vencimiento"]}
          rows={documents.map((document) => [
            document.name,
            document.owner,
            document.status,
            document.expires,
          ])}
        />
      </SectionCard>
    </>
  );
}
