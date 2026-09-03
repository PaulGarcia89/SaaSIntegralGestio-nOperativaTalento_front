"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchCompanyEmailSettings, saveCompanyEmailSettings, testCompanyEmailSettings, type CompanyEmailSettings } from "@/lib/backend";

type FormState = {
  smtpHost: string;
  smtpPort: string;
  smtpSecure: boolean;
  smtpUsername: string;
  smtpPassword: string;
  fromName: string;
  fromEmail: string;
  enabled: boolean;
};

const emptyForm: FormState = {
  smtpHost: "",
  smtpPort: "465",
  smtpSecure: true,
  smtpUsername: "",
  smtpPassword: "",
  fromName: "",
  fromEmail: "",
  enabled: true,
};

function formFromSettings(settings: CompanyEmailSettings): FormState {
  return { ...emptyForm, smtpHost: settings.smtpHost, smtpPort: String(settings.smtpPort), smtpSecure: settings.smtpSecure, smtpUsername: settings.smtpUsername, fromName: settings.fromName, fromEmail: settings.fromEmail, enabled: settings.enabled };
}

export function CompanyEmailSettings() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testRecipient, setTestRecipient] = useState("");
  const [savedSettings, setSavedSettings] = useState<CompanyEmailSettings | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  useEffect(() => {
    fetchCompanyEmailSettings().then((settings) => {
      if (settings) { setSavedSettings(settings); setForm(formFromSettings(settings)); }
    }).catch((error) => setFeedback({ tone: "danger", text: error instanceof Error ? error.message : "No fue posible cargar la configuración" })).finally(() => setLoading(false));
  }, []);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));

  async function save() {
    setSaving(true); setFeedback(null);
    try {
      const settings = await saveCompanyEmailSettings({ ...form, smtpPort: Number(form.smtpPort), ...(form.smtpPassword ? { smtpPassword: form.smtpPassword } : {}) });
      setSavedSettings(settings); setForm((current) => ({ ...current, smtpPassword: "" }));
      setFeedback({ tone: "success", text: "Configuración SMTP guardada de forma segura." });
    } catch (error) { setFeedback({ tone: "danger", text: error instanceof Error ? error.message : "No fue posible guardar la configuración" }); }
    finally { setSaving(false); }
  }

  async function test() {
    setTesting(true); setFeedback(null);
    try { const result = await testCompanyEmailSettings(testRecipient); setFeedback({ tone: "success", text: `Correo de prueba enviado a ${result.recipient}.` }); }
    catch (error) { setFeedback({ tone: "danger", text: error instanceof Error ? error.message : "No fue posible enviar la prueba" }); }
    finally { setTesting(false); }
  }

  return (
    <Card className="mt-8 border-border/70 bg-card/90">
      <CardHeader>
        <CardTitle>Correo electrónico de la empresa</CardTitle>
        <CardDescription>Configura el SMTP propio de esta empresa. La contraseña se cifra y nunca se muestra en pantalla.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? <p className="text-sm text-muted-foreground">Cargando configuración...</p> : <div className="space-y-6">
          <div className="grid gap-5 md:grid-cols-[1fr_150px]">
            <div className="space-y-2"><Label htmlFor="smtpHost">Servidor SMTP</Label><Input id="smtpHost" value={form.smtpHost} onChange={(event) => update("smtpHost", event.target.value)} placeholder="mail.tudominio.com" /></div>
            <div className="space-y-2"><Label htmlFor="smtpPort">Puerto</Label><Input id="smtpPort" type="number" min="1" max="65535" value={form.smtpPort} onChange={(event) => update("smtpPort", event.target.value)} /></div>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="smtpUsername">Usuario</Label><Input id="smtpUsername" type="email" value={form.smtpUsername} onChange={(event) => update("smtpUsername", event.target.value)} placeholder="info@tudominio.com" /></div>
            <div className="space-y-2"><Label htmlFor="smtpPassword">Contraseña</Label><Input id="smtpPassword" type="password" value={form.smtpPassword} onChange={(event) => update("smtpPassword", event.target.value)} placeholder={savedSettings?.passwordConfigured ? "Sin cambios" : "Contraseña SMTP"} autoComplete="new-password" /><p className="text-xs text-muted-foreground">Déjala vacía para conservar la actual.</p></div>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="fromName">Nombre del remitente</Label><Input id="fromName" value={form.fromName} onChange={(event) => update("fromName", event.target.value)} placeholder="Mi empresa" /></div>
            <div className="space-y-2"><Label htmlFor="fromEmail">Correo remitente</Label><Input id="fromEmail" type="email" value={form.fromEmail} onChange={(event) => update("fromEmail", event.target.value)} placeholder="info@tudominio.com" /></div>
          </div>
          <div className="flex flex-wrap gap-6 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={form.smtpSecure} onChange={(event) => update("smtpSecure", event.target.checked)} /> Usar SSL/TLS</label><label className="flex items-center gap-2"><input type="checkbox" checked={form.enabled} onChange={(event) => update("enabled", event.target.checked)} /> Activar este SMTP para los envíos</label></div>
          {feedback ? <p className={feedback.tone === "success" ? "text-sm text-status-success" : "text-sm text-status-danger"}>{feedback.text}</p> : null}
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end"><div className="space-y-2"><Label htmlFor="testRecipient">Destinatario de prueba</Label><Input id="testRecipient" type="email" value={testRecipient} onChange={(event) => setTestRecipient(event.target.value)} placeholder="datalinkprotech@gmail.com" /></div><Button variant="outline" onClick={test} disabled={testing || !savedSettings || !testRecipient.trim()}>{testing ? "Enviando..." : "Enviar correo de prueba"}</Button></div>
          {savedSettings?.lastTestStatus === "FAILED" ? <p className="text-xs text-status-danger">Último intento fallido: {savedSettings.lastTestError}</p> : null}
        </div>}
      </CardContent>
    </Card>
  );
}
