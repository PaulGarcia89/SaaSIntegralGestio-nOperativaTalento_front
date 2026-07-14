import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ModuleHeader, SectionCard, InfoList, SplitPanel } from "@/components/ui";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  return (
    <>
      <ModuleHeader
        eyebrow="Perfil del usuario"
        title="Preferencias, seguridad y sesiones activas."
        description="Pantalla pensada para autonomia del usuario sin exponer configuraciones criticas de la empresa."
        actions={
          <Button asChild>
            <Link href="/notifications">Ver notificaciones</Link>
          </Button>
        }
        metrics={[
          { label: "Sesiones activas", value: "3", detail: "MacBook Pro, iPhone y navegador corporativo" },
          { label: "Ultimo acceso", value: "09:14", detail: "Miami, Florida · hoy" },
          { label: "Nivel de seguridad", value: "Alto", detail: "Politica corporativa y alertas habilitadas" },
        ]}
      />
      <SplitPanel
        left={
          <SectionCard title="Cuenta personal" subtitle="Identidad y acceso">
            <div className="space-y-5">
              <div className="flex items-start gap-4 rounded-3xl border border-border/70 bg-secondary/35 p-5">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 to-indigo-500 text-lg font-semibold text-white">
                  AT
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold">Ava Thompson</h3>
                    <Badge variant="secondary" className="rounded-full">Conectada</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Superadministrador · TalentOS Cloud USA</p>
                  <p className="text-sm text-muted-foreground">ava.thompson@talentoscloud.com</p>
                </div>
              </div>
              <InfoList
                items={[
                  { title: "Autenticacion multifactor", description: "Disponible como siguiente mejora del flujo de acceso", badge: "Roadmap" },
                  { title: "Zona horaria", description: "America/New_York · horario corporativo de Florida" },
                  { title: "Preferencias de notificacion", description: "Alertas operativas por email y centro de notificaciones" },
                ]}
              />
            </div>
          </SectionCard>
        }
        right={
          <SectionCard title="Seguridad reciente" subtitle="Actividad">
            <InfoList
              items={[
                { title: "MacBook Pro", description: "Sesion principal iniciada hace 12 minutos desde Miami", badge: "Actual" },
                { title: "iPhone corporativo", description: "Acceso consultivo validado con Face ID", badge: "Movil" },
                { title: "Navegador secundario", description: "Lectura de reportes desde Jacksonville hace 2 horas", badge: "Auditoria" },
              ]}
            />
          </SectionCard>
        }
      />
    </>
  );
}
