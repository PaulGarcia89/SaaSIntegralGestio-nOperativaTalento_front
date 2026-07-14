"use client";

import Link from "next/link";
import { ModuleHeader, SectionCard, DataTable, SplitPanel, InfoList } from "@/components/ui";
import { documents } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";

export default function DocumentsPage() {
  return (
    <>
      <ModuleHeader
        eyebrow="Gestion documental"
        title="Documentos, versiones, vencimientos y estado del ingreso."
        description="Una interfaz clara para revisar archivos, detectar pendientes y acelerar la incorporacion."
        actions={
          <Button asChild>
            <Link href="/onboarding/signatures">Ver firmas</Link>
          </Button>
        }
        metrics={[
          { label: "Expedientes activos", value: "3", detail: "Ingresos en seguimiento documental esta semana" },
          { label: "Pendientes criticos", value: "1", detail: "Documento necesario antes de fecha de inicio" },
          { label: "Revision completada", value: "67%", detail: "Progreso promedio de los paquetes activos" },
        ]}
      />
      <SplitPanel
        left={
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
        }
        right={
          <SectionCard title="Subir documento" subtitle="Onboarding">
            <FileUpload maxFiles={3} onFiles={(files) => console.log("Archivos seleccionados:", files)} />
            <div className="mt-4">
              <InfoList
                items={[
                  { title: "Foco inmediato", description: "La verificacion de antecedentes de Lauren Bennett requiere seguimiento hoy", badge: "Pendiente" },
                  { title: "Proceso estable", description: "Los acuerdos ya firmados avanzan sin riesgo operativo para la fecha de ingreso" },
                  { title: "Siguiente paso", description: "La vista puede escalar hacia preview del documento, versionado y firma contextual", badge: "Roadmap" },
                ]}
              />
            </div>
          </SectionCard>
        }
      />
    </>
  );
}
