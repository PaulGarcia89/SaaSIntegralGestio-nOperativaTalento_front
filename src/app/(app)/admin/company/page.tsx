import Link from "next/link";
import { ModuleHeader, SectionCard, InfoList, SplitPanel } from "@/components/ui";
import { Button } from "@/components/ui/button";

export default function CompanySettingsPage() {
  return (
    <>
      <ModuleHeader
        eyebrow="Configuración de empresa"
        title="Marca, dominios, parámetros y plantillas por empresa."
        description="La administración de empresa necesita orden, jerarquía y acciones claras para evitar cambios accidentales."
        actions={
            <Button asChild>
            <Link href="/admin/company/career-portal">Configurar portal de empleos</Link>
          </Button>
        }
        metrics={[
          { label: "Dominios conectados", value: "2", detail: "Portal de empleos y acceso corporativo" },
          { label: "Plantillas activas", value: "14", detail: "Incorporación, firma y comunicación automatizada" },
          { label: "Integraciones listas", value: "5", detail: "SSO, correo, firma y productividad" },
        ]}
      />
      <SplitPanel
        left={
          <SectionCard title="Bloques de configuración" subtitle="Base empresarial">
            <InfoList
              items={[
                { title: "Identidad visual", description: "Logo, colores secundarios y assets de portal de empleos", badge: "Marca" },
                { title: "Parametros de proceso", description: "Checklists de incorporación y formularios por cargo", badge: "Flujo" },
                { title: "Integraciones", description: "SSO, correo, firma y sistemas operativos externos", badge: "Conexión" },
              ]}
            />
          </SectionCard>
        }
        right={
          <SectionCard title="Guardrails operativos" subtitle="Gobernanza">
            <InfoList
              items={[
                { title: "Control de cambios", description: "Las modificaciones sensibles deben registrarse en auditoría y notificarse al administrador principal." },
                { title: "Separación por sucursal", description: "Los formularios y listas de verificación pueden variar por sede sin romper la consistencia central", badge: "Multi-sede" },
                { title: "Políticas de acceso", description: "Las integraciones críticas se exponen solo a perfiles con permisos administrativos", badge: "RBAC" },
              ]}
            />
          </SectionCard>
        }
      />
    </>
  );
}
