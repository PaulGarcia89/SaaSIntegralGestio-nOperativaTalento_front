"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CalendarDays, CheckCircle2, ArrowLeft, ExternalLink, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store/app-store";
import { authorizeCompanyCalendar, completeCompanyCalendarOAuth, disconnectCompanyCalendar, fetchCompanyCalendarSettings, getApiErrorMessage, listCompanyCalendars, saveCompanyCalendarCredentials, saveCompanyCalendarDefaults, testCompanyCalendar, type CompanyCalendarProvider, type CompanyCalendarSettings, type CompanyInterviewDefaults } from "@/lib/backend";

const callbackPath = "/admin/company/calendar";
const pendingKey = "talentos-company-calendar-oauth";

export function CompanyCalendarSettingsPanel() {
  const { currentTenant, can } = useAppStore();
  return <CalendarPanel key={currentTenant?.id ?? "none"} tenantId={currentTenant?.id} editable={can("admin.company")} />;
}

function CalendarPanel({ tenantId, editable }: { tenantId?: string; editable: boolean }) {
  const [settings, setSettings] = useState<CompanyCalendarSettings>();
  const [defaults, setDefaults] = useState<CompanyInterviewDefaults>();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ error?: boolean; text: string }>();
  const initialized = useRef(false);
  async function reload() { const value = await fetchCompanyCalendarSettings(); setSettings(value); setDefaults(value.defaults); }
  async function run(action: () => Promise<void>) {
    setBusy(true); setFeedback(undefined);
    try { await action(); } catch (error) { setFeedback({ error: true, text: getApiErrorMessage(error, "No fue posible completar la operación. Inténtalo de nuevo.") }); }
    finally { setBusy(false); }
  }
  useEffect(() => {
    if (!tenantId || initialized.current) return;
    initialized.current = true;
    void run(async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code"), state = params.get("state");
      if (params.has("error")) {
        sessionStorage.removeItem(pendingKey);
        window.history.replaceState({}, "", callbackPath);
        setFeedback({ error: true, text: "No se autorizó el acceso al calendario. Puedes volver a conectar tu cuenta." });
      } else if (code || state) {
        const raw = sessionStorage.getItem(pendingKey);
        sessionStorage.removeItem(pendingKey);
        window.history.replaceState({}, "", callbackPath);
        const pending = raw ? JSON.parse(raw) as { state: string; provider: CompanyCalendarProvider; tenantId: string; createdAt: number } : null;
        if (!code || !state || !pending || pending.state !== state || pending.tenantId !== tenantId || Date.now() - pending.createdAt > 600_000) throw new Error("La autorización no corresponde a esta empresa o ha expirado. Vuelve a conectar tu cuenta.");
        await completeCompanyCalendarOAuth(pending.provider, { code, state, redirectUri: window.location.origin + callbackPath });
        setFeedback({ text: "Cuenta conectada. Ya puedes usar su calendario para las entrevistas." });
      }
      await reload();
    });
  // Each tenant remounts this panel; consume an OAuth callback only once.
  }, [tenantId]);
  const updateDefaults = <K extends keyof CompanyInterviewDefaults>(key: K, value: CompanyInterviewDefaults[K]) => setDefaults((previous) => previous ? { ...previous, [key]: value } : previous);
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Administración / Empresa</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Calendarios y entrevistas</h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">Conecta la cuenta que organizará las entrevistas y elige las preferencias de tu empresa.</p></div><Button asChild variant="outline"><Link href="/admin/company"><ArrowLeft className="size-4" /> Volver a configuración</Link></Button></div>
    {feedback && <div role={feedback.error ? "alert" : "status"} className={`rounded-xl border p-4 text-sm ${feedback.error ? "border-red-300 bg-red-50 text-red-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>{feedback.text}</div>}
    {!settings && <div className="rounded-xl border p-6">{busy ? "Cargando configuración…" : <Button variant="outline" onClick={() => void run(reload)}>Volver a cargar</Button>}</div>}
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]"><div className="space-y-5">{settings?.providers.map((provider) => <ProviderCard key={provider.provider} value={provider} busy={busy} editable={editable} onSave={(input) => run(async () => { await saveCompanyCalendarCredentials(provider.provider, input); await reload(); setFeedback({ text: "Configuración guardada." }); })} onConnect={() => run(async () => {
      const result = await authorizeCompanyCalendar(provider.provider, window.location.origin + callbackPath);
      const url = new URL(result.authorizationUrl);
      if (url.protocol !== "https:" || !["accounts.google.com", "login.microsoftonline.com"].includes(url.hostname)) throw new Error("Dirección de autorización no válida.");
      sessionStorage.setItem(pendingKey, JSON.stringify({ state: result.state, provider: provider.provider, tenantId, createdAt: Date.now() }));
      window.location.assign(url.toString());
    })} onTest={() => run(async () => { const result = await testCompanyCalendar(provider.provider); await reload(); setFeedback({ text: `Conexión verificada: ${result.email}.` }); })} onDisconnect={() => run(async () => { await disconnectCompanyCalendar(provider.provider); await reload(); setFeedback({ text: "Cuenta desconectada de esta empresa." }); })} />)}</div>
    {defaults && <form className="self-start rounded-2xl border bg-card p-6" onSubmit={(event) => { event.preventDefault(); void run(async () => { await saveCompanyCalendarDefaults(defaults); await reload(); setFeedback({ text: "Preferencias de entrevista guardadas." }); }); }}><CalendarDays className="mb-3 size-6 text-primary" /><h2 className="text-lg font-semibold">Preferencias de entrevista</h2><p className="mt-1 text-sm text-muted-foreground">Se aplican al abrir una nueva entrevista.</p><fieldset disabled={busy || !editable} className="mt-5 space-y-5"><div className="space-y-2"><Label htmlFor="default-modality">Modalidad predeterminada</Label><select id="default-modality" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={defaults.defaultModality} onChange={(event) => updateDefaults("defaultModality", event.target.value as CompanyInterviewDefaults["defaultModality"])}><option value="CUSTOM">Virtual con enlace propio</option><option value="GOOGLE_MEET" disabled={!settings?.providers.find((p) => p.provider === "GOOGLE")?.connected}>Google Meet</option><option value="MICROSOFT_TEAMS" disabled={!settings?.providers.find((p) => p.provider === "MICROSOFT")?.connected}>Microsoft Teams</option><option value="PRESENTIAL">Presencial</option><option value="PHONE">Teléfono</option></select></div><div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label htmlFor="duration">Duración (min)</Label><Input id="duration" type="number" min={15} max={480} required value={defaults.durationMinutes} onChange={(event) => updateDefaults("durationMinutes", Number(event.target.value))} /></div><div className="space-y-2"><Label htmlFor="reminder">Recordatorio (min)</Label><Input id="reminder" type="number" min={0} max={10080} required value={defaults.reminderMinutes} onChange={(event) => updateDefaults("reminderMinutes", Number(event.target.value))} /></div></div><div className="space-y-2"><Label htmlFor="calendar-timezone">Zona horaria</Label><Input id="calendar-timezone" required value={defaults.timezone} onChange={(event) => updateDefaults("timezone", event.target.value)} placeholder="America/New_York" /></div><Button type="submit" className="w-full">Guardar preferencias</Button></fieldset></form>}</div>
  </div>;
}

function ProviderCard({ value, busy, editable, onSave, onConnect, onTest, onDisconnect }: { value: CompanyCalendarSettings["providers"][number]; busy: boolean; editable: boolean; onSave: (input: { clientId?: string; clientSecret?: string; calendarId?: string; authority?: string }) => Promise<void>; onConnect: () => Promise<void>; onTest: () => Promise<void>; onDisconnect: () => Promise<void> }) {
  const google = value.provider === "GOOGLE";
  const name = google ? "Google" : "Microsoft";
  const [clientId, setClientId] = useState(value.clientId ?? "");
  const [secret, setSecret] = useState("");
  const [authority, setAuthority] = useState(value.authority ?? "common");
  const [calendars, setCalendars] = useState<{ id: string; name: string }[]>([]);
  const [listError, setListError] = useState("");
  const [listing, setListing] = useState(false);
  return <section className="rounded-2xl border bg-card p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-muted"><CalendarDays className="size-5" /></span><div><h2 className="text-lg font-semibold">{google ? "Google Calendar y Meet" : "Outlook y Microsoft Teams"}</h2><p className="mt-1 text-sm text-muted-foreground">{value.connected ? value.email : "Agenda y genera el enlace de la reunión automáticamente."}</p></div></div><span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${value.connected ? "bg-emerald-50 text-emerald-800" : "bg-muted text-muted-foreground"}`}>{value.connected && <CheckCircle2 className="size-3.5" />}{value.connected ? "Conectado" : "Sin conectar"}</span></div>
    <div className="mt-5 flex flex-wrap gap-3">{value.connected ? <><Button variant="outline" disabled={busy || !editable} onClick={() => void onTest()}>Probar conexión</Button><Button variant="ghost" disabled={busy || !editable} onClick={() => void onDisconnect()}>Desconectar cuenta</Button></> : <Button disabled={busy || !editable || !value.configured} onClick={() => void onConnect()}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}Conectar con {name}<ExternalLink className="size-3.5" /></Button>}</div>
    <p className="mt-3 text-xs text-muted-foreground">{value.connected ? "Las entrevistas utilizarán esta cuenta como organizadora." : `Se abrirá el inicio de sesión oficial de ${name} para elegir tu cuenta y autorizar el calendario.`}</p>
    {!value.configured && <p className="mt-3 rounded-lg bg-muted p-3 text-sm">Para habilitar la conexión, configura primero la aplicación de {name}. Este paso se realiza una sola vez.</p>}
    {value.connected && <div className="mt-5 border-t pt-4"><Label htmlFor={`calendar-${value.provider}`}>Calendario de entrevistas</Label><div className="mt-2 flex flex-wrap gap-2"><select id={`calendar-${value.provider}`} disabled={busy || !editable} value={value.calendarId ?? "primary"} className="h-10 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm" onChange={(event) => void onSave({ calendarId: event.target.value })}><option value="primary">Calendario principal</option>{value.calendarId && value.calendarId !== "primary" && !calendars.some((c) => c.id === value.calendarId) && <option value={value.calendarId}>Calendario seleccionado</option>}{calendars.map((calendar) => <option key={calendar.id} value={calendar.id}>{calendar.name}</option>)}</select><Button variant="outline" disabled={listing || busy || !editable} onClick={async () => { setListing(true); setListError(""); try { setCalendars(await listCompanyCalendars(value.provider)); } catch (error) { setListError(getApiErrorMessage(error, "No se pudieron cargar los calendarios.")); } finally { setListing(false); } }}>Cargar calendarios</Button></div>{listError && <p role="alert" className="mt-2 text-sm text-red-700">{listError}</p>}</div>}
    <details className="mt-5 border-t pt-4"><summary className="cursor-pointer text-sm font-medium">Configuración de la aplicación</summary><form className="mt-4 space-y-4" onSubmit={async (event) => { event.preventDefault(); await onSave({ clientId, clientSecret: secret || undefined, authority: google ? undefined : authority }); setSecret(""); }}><p className="text-xs text-muted-foreground">Credenciales OAuth de la aplicación, disponibles en {google ? "Google Cloud Console" : "Microsoft Entra"}. La contraseña personal se ingresa únicamente en {name}.</p><fieldset disabled={busy || !editable || value.connected} className="space-y-4"><div className="space-y-2"><Label htmlFor={`client-${value.provider}`}>Client ID</Label><Input id={`client-${value.provider}`} value={clientId} required onChange={(event) => setClientId(event.target.value)} /></div><div className="space-y-2"><Label htmlFor={`secret-${value.provider}`}>Client secret</Label><Input id={`secret-${value.provider}`} type="password" value={secret} autoComplete="new-password" required={!value.hasClientSecret} placeholder={value.hasClientSecret ? "Guardado; déjalo vacío para conservarlo" : "Se guardará cifrado"} onChange={(event) => setSecret(event.target.value)} /></div>{!google && <div className="space-y-2"><Label htmlFor="authority">Tenant ID de Microsoft</Label><Input id="authority" value={authority} onChange={(event) => setAuthority(event.target.value)} /></div>}<Button variant="outline" type="submit">Guardar configuración</Button></fieldset><div className="rounded-lg bg-muted p-3 text-xs"><p className="font-medium">URL de retorno autorizada</p><code className="mt-1 block break-all">{typeof window === "undefined" ? callbackPath : window.location.origin + callbackPath}</code></div></form></details>
  </section>;
}
