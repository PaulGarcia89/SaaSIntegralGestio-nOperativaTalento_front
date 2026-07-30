import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ModuleHeader, SectionCard, InfoList, SplitPanel } from "@/components/ui";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  return (
    <>
      <ModuleHeader
        eyebrow="Perfil del usuario"
        title="Preferencias, seguridad y sesiónes activas."
        description="Control personal de acceso y preferencias."
        actions={
          <Button asChild>
            <Link href="/notifications">Ver notificaciones</Link>
          </Button>
        }
        metrics={[
          { label: "Sesiónes activas", value: "3", detail: "Equipos conectados" },
          { label: "Ultimo acceso", value: "09:14", detail: "Miami, Florida · hoy" },
          { label: "Nivel de seguridad", value: "Alto", detail: "Politica activa" },
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
                  { title: "Autenticacion multifactor", description: "Mejora planificada", badge: "Ruta" },
                  { title: "Zona horaria", description: "America/New_York" },
                  { title: "Preferencias de notificacion", description: "Email y centro de alertas" },
                ]}
              />
            </div>
          </SectionCard>
        }
        right={
          <SectionCard title="Seguridad reciente" subtitle="Actividad">
            <InfoList
              items={[
                { title: "MacBook Pro", description: "Sesión principal en Miami", badge: "Actual" },
                { title: "iPhone corporativo", description: "Acceso movil validado", badge: "Movil" },
                { title: "Navegador secundario", description: "Consulta de reportes", badge: "Auditoría" },
              ]}
            />
          </SectionCard>
        }
      />
    </>
  );
}
