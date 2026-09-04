"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCareerPortalConfig, updateCareerPortalConfig } from "@/lib/backend";
import type { CareerPortalChannelConfigInput, CareerPortalConfigResponse, CareerPortalContext } from "@/lib/career-portals";
import { useAppStore } from "@/store/app-store";
import { AsyncState } from "@/components/async-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type PortalForm = Pick<CareerPortalContext, "type" | "accessType" | "requireLoginToViewJobs" | "requireLoginToApply" | "allowApplicantRegistration" | "domain" | "branding"> & { slug: string; subdomain: string; pathPrefix: string };
const defaultBranding: CareerPortalContext["branding"] = { primary: "#0f766e", secondary: "#155e75", accent: "#f59e0b", background: "#f8fafc", text: "#0f172a", title: "Oportunidades que mueven tu carrera", subtitle: "Encuentra el próximo lugar donde crecer", description: "Conoce nuestras vacantes y postúlate de forma segura.", footerText: "", supportEmail: "" };

function formFrom(config: CareerPortalConfigResponse | undefined, companyName: string): PortalForm {
  const channel = config?.brandedCareerSite.enabled ? config.brandedCareerSite.portal : config?.companyPortal.enabled ? config.companyPortal.portal : null;
  const branding = channel?.branding ?? {};
  return {
    type: channel?.type === "CAREER_SITE" ? "BRANDED" : channel?.type === "COMPANY_PORTAL" ? "PRIVATE_STANDARD" : "PUBLIC",
    accessType: channel?.access === "PUBLIC" ? "OPEN" : channel?.access === "PRIVATE" ? "LOGIN_REQUIRED" : channel?.access ?? "OPEN",
    requireLoginToViewJobs: channel?.access === "PRIVATE" || channel?.access === "INVITATION_ONLY",
    requireLoginToApply: channel?.access === "PRIVATE" || channel?.access === "INVITATION_ONLY",
    allowApplicantRegistration: channel?.access !== "INVITATION_ONLY",
    domain: channel?.domain ?? "", slug: channel?.slug ?? "", subdomain: channel?.subdomain ?? "", pathPrefix: channel?.pathPrefix ?? "",
    branding: { ...defaultBranding, title: branding.title ?? branding.seoTitle ?? `${companyName} | Vacantes`, subtitle: branding.subtitle, description: branding.seoDescription ?? defaultBranding.description, logo: branding.logoUrl, favicon: branding.faviconUrl, primary: branding.primaryColor, secondary: branding.secondaryColor, accent: branding.accentColor, background: branding.backgroundColor, text: branding.textColor, heroImage: branding.heroImageUrl, footerText: branding.footerText, supportEmail: branding.supportEmail, fontFamily: branding.fontFamily, customCss: branding.customCss },
  };
}

export function CareerPortalSettings() {
  const { currentTenant } = useAppStore();
  const queryClient = useQueryClient();
  const config = useQuery({ queryKey: ["career-portal-config", currentTenant.id], queryFn: fetchCareerPortalConfig });
  const [form, setForm] = useState<PortalForm>(() => formFrom(undefined, currentTenant.name));
  useEffect(() => { if (config.data) queueMicrotask(() => setForm(formFrom(config.data, currentTenant.name))); }, [config.data, currentTenant.name]);

  const save = useMutation({
    mutationFn: () => {
      const channel: CareerPortalChannelConfigInput = { enabled: true, slug: form.slug || undefined, name: currentTenant.name, access: form.accessType === "OPEN" ? "PUBLIC" : form.accessType === "INVITATION_ONLY" ? "INVITATION_ONLY" : "PRIVATE", domain: form.domain || undefined, subdomain: form.subdomain || undefined, pathPrefix: form.pathPrefix || undefined, branding: { logoUrl: form.branding.logo || undefined, faviconUrl: form.branding.favicon || undefined, primaryColor: form.branding.primary || undefined, secondaryColor: form.branding.secondary || undefined, accentColor: form.branding.accent || undefined, backgroundColor: form.branding.background || undefined, textColor: form.branding.text || undefined, heroImageUrl: form.branding.heroImage || undefined, footerText: form.branding.footerText || undefined, supportEmail: form.branding.supportEmail || undefined, fontFamily: form.branding.fontFamily || undefined, customCss: form.branding.customCss || undefined, title: form.branding.title || undefined, subtitle: form.branding.subtitle || undefined, seoTitle: form.branding.title || undefined, seoDescription: form.branding.description || undefined } };
      const disabled = { enabled: false };
      if (form.type === "PUBLIC") return updateCareerPortalConfig({ marketplaceEnabled: true, companyPortal: disabled, brandedCareerSite: disabled });
      if (form.type === "BRANDED") return updateCareerPortalConfig({ marketplaceEnabled: false, companyPortal: disabled, brandedCareerSite: channel });
      return updateCareerPortalConfig({ marketplaceEnabled: false, companyPortal: channel, brandedCareerSite: disabled });
    },
    onSuccess: async (saved) => { queryClient.setQueryData(["career-portal-config", currentTenant.id], saved); setForm(formFrom(saved, currentTenant.name)); },
  });
  const updateBranding = (key: keyof PortalForm["branding"], value: string) => setForm((current) => ({ ...current, branding: { ...current.branding, [key]: value } }));
  if (config.isLoading) return <AsyncState state="loading" title="Cargando configuración del portal" />;
  if (config.isError) return <AsyncState state="error" title="No pudimos cargar el portal" description="El backend debe habilitar la configuración de career portals para este tenant." onRetry={() => void config.refetch()} />;
  const colors = { primary: form.branding.primary ?? defaultBranding.primary!, accent: form.branding.accent ?? defaultBranding.accent!, background: form.branding.background ?? defaultBranding.background!, text: form.branding.text ?? defaultBranding.text! };

  return <div className="space-y-6">
    <header><p className="text-sm font-medium text-brand">Administración de talento</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Portal de empleos</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Configura la experiencia pública o privada de {currentTenant.name}. El tenant se resuelve por la sesión del administrador y nunca por un `companyId` enviado desde el navegador.</p></header>
    <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
      <Card><CardHeader><CardTitle>Acceso y publicación</CardTitle></CardHeader><CardContent className="space-y-5"><div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium">Tipo de portal<select className="h-11 w-full rounded-xl border bg-background px-3" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as PortalForm["type"] })}><option value="PUBLIC">Público</option><option value="PRIVATE_STANDARD">Privado estándar</option><option value="BRANDED">Branded</option></select></label>
        <label className="space-y-2 text-sm font-medium">Acceso<select className="h-11 w-full rounded-xl border bg-background px-3" value={form.accessType} onChange={(event) => setForm({ ...form, accessType: event.target.value as PortalForm["accessType"] })}><option value="OPEN">Abierto</option><option value="LOGIN_REQUIRED">Requiere login</option><option value="INVITATION_ONLY">Solo invitación</option></select></label>
      </div><div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium">Slug<Input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="mi-empresa" /></label><label className="space-y-2 text-sm font-medium">Dominio<Input value={form.domain ?? ""} onChange={(event) => setForm({ ...form, domain: event.target.value })} placeholder="careers.empresa.com" /></label>
        <label className="space-y-2 text-sm font-medium">Subdominio<Input value={form.subdomain} onChange={(event) => setForm({ ...form, subdomain: event.target.value })} placeholder="careers" /></label><label className="space-y-2 text-sm font-medium">Prefijo de ruta<Input value={form.pathPrefix} onChange={(event) => setForm({ ...form, pathPrefix: event.target.value })} placeholder="/careers" /></label>
      </div><div className="space-y-3">{([["requireLoginToViewJobs", "Requerir login para ver vacantes"], ["requireLoginToApply", "Requerir login para postularse"], ["allowApplicantRegistration", "Permitir registro de candidatos"]] as const).map(([key, label]) => <label key={key} className="flex items-center gap-3 rounded-xl border p-3 text-sm"><input type="checkbox" checked={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.checked })} />{label}</label>)}</div></CardContent></Card>
      <Card><CardHeader><CardTitle>Identidad visual</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-4 sm:grid-cols-2">{(["primary", "secondary", "accent", "background", "text"] as const).map((key) => <label key={key} className="space-y-2 text-sm font-medium">{key}<Input type="text" value={form.branding[key] ?? ""} onChange={(event) => updateBranding(key, event.target.value)} placeholder="#0f766e" /></label>)}</div><label className="space-y-2 text-sm font-medium">Logo<Input value={form.branding.logo ?? ""} onChange={(event) => updateBranding("logo", event.target.value)} placeholder="https://..." /></label><label className="space-y-2 text-sm font-medium">Favicon<Input value={form.branding.favicon ?? ""} onChange={(event) => updateBranding("favicon", event.target.value)} placeholder="https://..." /></label><label className="space-y-2 text-sm font-medium">Familia tipográfica<Input value={form.branding.fontFamily ?? ""} onChange={(event) => updateBranding("fontFamily", event.target.value)} placeholder="Inter, sans-serif" /></label><label className="space-y-2 text-sm font-medium">Imagen hero<Input value={form.branding.heroImage ?? ""} onChange={(event) => updateBranding("heroImage", event.target.value)} placeholder="https://..." /></label><label className="space-y-2 text-sm font-medium">Correo de soporte<Input type="email" value={form.branding.supportEmail ?? ""} onChange={(event) => updateBranding("supportEmail", event.target.value)} /></label></CardContent></Card>
    </div>
    <Card><CardHeader><CardTitle>Contenido y SEO</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><label className="space-y-2 text-sm font-medium">Título<Input value={form.branding.title ?? ""} onChange={(event) => updateBranding("title", event.target.value)} /></label><label className="space-y-2 text-sm font-medium">Subtítulo<Input value={form.branding.subtitle ?? ""} onChange={(event) => updateBranding("subtitle", event.target.value)} /></label><label className="space-y-2 text-sm font-medium md:col-span-2">Descripción<textarea className="min-h-24 w-full rounded-xl border bg-background p-3 text-base sm:text-sm" value={form.branding.description ?? ""} onChange={(event) => updateBranding("description", event.target.value)} /></label><label className="space-y-2 text-sm font-medium md:col-span-2">CSS personalizado<textarea className="min-h-32 w-full rounded-xl border bg-background p-3 font-mono text-base sm:text-xs" value={form.branding.customCss ?? ""} onChange={(event) => updateBranding("customCss", event.target.value)} placeholder=":root { --brand-color: #0f766e; }" /></label><label className="space-y-2 text-sm font-medium md:col-span-2">Texto del pie<textarea className="min-h-20 w-full rounded-xl border bg-background p-3 text-base sm:text-sm" value={form.branding.footerText ?? ""} onChange={(event) => updateBranding("footerText", event.target.value)} /></label></CardContent></Card>
    <Card><CardHeader className="flex-row items-center justify-between"><CardTitle>Previsualización</CardTitle><Badge style={{ backgroundColor: colors.accent, color: colors.text }}>En vivo</Badge></CardHeader><CardContent><div className="rounded-2xl p-6" style={{ backgroundColor: colors.background, color: colors.text }}><p className="text-sm font-semibold" style={{ color: colors.primary }}>{currentTenant.name}</p><h2 className="mt-3 text-2xl font-semibold">{form.branding.title}</h2><p className="mt-2 text-sm opacity-75">{form.branding.subtitle}</p><Button className="mt-5" style={{ backgroundColor: colors.primary }}>Ver vacantes</Button></div></CardContent></Card>
    <div className="flex items-center justify-end gap-3">{save.isError ? <p role="alert" className="text-sm text-destructive">No fue posible guardar la configuración.</p> : null}{save.isSuccess ? <p role="status" className="text-sm text-emerald-700">Configuración guardada.</p> : null}<Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Guardando..." : "Guardar cambios"}</Button></div>
  </div>;
}
