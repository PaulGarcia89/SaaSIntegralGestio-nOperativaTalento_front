"use client";

import { useUiText } from "@/components/ui-copy";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ModuleHeader, SectionCard, InfoList, SplitPanel } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/language-selector";
import { useLocale } from "@/components/locale-provider";

export default function ProfilePage() {
  const uiText = useUiText();
  const { locale, t } = useLocale();
  return (
    <>
      <ModuleHeader
        eyebrow={uiText("Perfil del usuario")}
        title={uiText("Preferencias, seguridad y sesiones activas.")}
        description={uiText("Control personal de acceso y preferencias.")}
        actions={
          <Button asChild>
            <Link href="/notifications">{uiText("Ver notificaciones")}</Link>
          </Button>
        }
        metrics={[
          { label: "Sesiónes activas", value: "3", detail: "Equipos conectados" },
          { label: "Ultimo acceso", value: "09:14", detail: "Miami, Florida · hoy" },
          { label: "Nivel de seguridad", value: "Alto", detail: "Politica activa" },
        ]}
      />
      <SectionCard title={uiText("Idioma y región")} subtitle="Preferencia de interfaz">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-medium">{uiText("Idioma de la interfaz")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{uiText("El cambio se aplica inmediatamente y se conserva en este dispositivo.")}</p>
          </div>
          <LanguageSelector />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{t("language.current")}: {locale === "es" ? t("language.spanish") : t("language.english")}</p>
      </SectionCard>
      <SplitPanel
        left={
          <SectionCard title={uiText("Cuenta personal")} subtitle="Identidad y acceso">
            <div className="space-y-5">
              <div className="flex items-start gap-4 rounded-3xl border border-border/70 bg-secondary/35 p-5">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-fill to-accent-line text-lg font-semibold text-surface-dark-ink">
                  AT
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold">Ava Thompson</h3>
                    <Badge variant="secondary" className="rounded-full">{uiText("Conectada")}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{uiText("Superadministrador · TalentOS Cloud USA")}</p>
                  <p className="text-sm text-muted-foreground">ava.thompson@talentoscloud.com</p>
                </div>
              </div>
              <InfoList
                items={[
                  { title: "Autenticacion multifactor", description: "Mejora planificada", badge: "Ruta" },
                  { title: uiText("Zona horaria"), description: "America/New_York" },
                  { title: "Preferencias de notificacion", description: "Email y centro de alertas" },
                ]}
              />
            </div>
          </SectionCard>
        }
        right={
          <SectionCard title={uiText("Seguridad reciente")} subtitle="Actividad">
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
