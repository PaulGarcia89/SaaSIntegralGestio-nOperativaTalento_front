import Link from "next/link";
import { ModuleHeader, SectionCard, InfoList, SplitPanel } from "@/components/ui";
import { Button } from "@/components/ui/button";

export default function CompanySettingsPage() {
  return (
    <>
      <ModuleHeader
        eyebrow="Configuracion de empresa"
        title="Branding, dominios, parametros y plantillas por empresa."
        description="La administracion de empresa necesita orden, jerarquia y acciones claras para evitar cambios accidentales."
        actions={
          <Button asChild>
            <Link href="/admin/users">Gestionar usuarios</Link>
          </Button>
        }
        metrics={[
          { label: "Dominios conectados", value: "2", detail: "Portal de empleos y acceso corporativo" },
          { label: "Plantillas activas", value: "14", detail: "Incorporacion, firma y comunicacion automatizada" },
          { label: "Integraciones listas", value: "5", detail: "SSO, correo, firma y productividad" },
        ]}
      />
      <SplitPanel
        left={
          <SectionCard title="Bloques de configuracion" subtitle="Base empresarial">
            <InfoList
              items={[
                { title: "Identidad visual", description: "Logo, colores secundarios y assets de portal de empleos", badge: "Marca" },
                { title: "Parametros de proceso", description: "Checklists de incorporacion y formularios por cargo", badge: "Flujo" },
                { title: "Integraciones", description: "SSO, correo, firma y sistemas operativos externos", badge: "Conexion" },
              ]}
            />
          </SectionCard>
        }
        right={
          <SectionCard title="Guardrails operativos" subtitle="Gobernanza">
            <InfoList
              items={[
                { title: "Control de cambios", description: "Las modificaciones sensibles deben registrarse en auditoria y notificar al administrador principal" },
                { title: "Separacion por sucursal", description: "Los formularios y checklist pueden variar por sede sin romper consistencia central", badge: "Multi-sede" },
                { title: "Politicas de acceso", description: "Las integraciones criticas se exponen solo a perfiles con permisos administrativos", badge: "RBAC" },
              ]}
            />
          </SectionCard>
        }
      />
    </>
  );
}
