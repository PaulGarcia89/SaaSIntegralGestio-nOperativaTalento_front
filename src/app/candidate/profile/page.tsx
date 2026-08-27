"use client";

import { Suspense, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Trash2 } from "lucide-react";
import { cancelCandidatePrivacyRequest, createCandidatePrivacyRequest, fetchCandidatePortalOverview, fetchCandidateProfile, getCandidateSession, updateCandidateProfile } from "@/lib/backend";
import type { CandidatePortalProfileDto } from "@/lib/contracts";
import { CandidateNav } from "@/components/candidate-nav";
import { CandidateAuthCard } from "@/components/candidate-auth-card";
import { AsyncState } from "@/components/async-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { technicalLabel } from "@/lib/ui-labels";
import { useLocale } from "@/components/locale-provider";

function CandidateProfileContent() {
  const { locale, setLocale } = useLocale();
  const lang = locale;
  const queryClient = useQueryClient();
  const [authenticated, setAuthenticated] = useState(() => Boolean(getCandidateSession()));
  const [formOverride, setForm] = useState<Partial<CandidatePortalProfileDto> | null>(null);
  const [privacyReason, setPrivacyReason] = useState("");
  const profile = useQuery({ queryKey: ["candidate-profile", authenticated, locale], queryFn: fetchCandidateProfile, enabled: authenticated });
  const overview = useQuery({ queryKey: ["candidate-portal", authenticated, locale], queryFn: fetchCandidatePortalOverview, enabled: authenticated });
  const form = formOverride ?? profile.data ?? {};
  const save = useMutation({ mutationFn: () => updateCandidateProfile(form), onSuccess: (data) => { setForm(data); void queryClient.invalidateQueries({ queryKey: ["candidate-profile"] }); } });
  const privacy = useMutation({ mutationFn: (type: "EXPORT" | "ANONYMIZE" | "DELETE") => createCandidatePrivacyRequest(type, privacyReason), onSuccess: () => { setPrivacyReason(""); void queryClient.invalidateQueries({ queryKey: ["candidate-portal"] }); } });
  const cancel = useMutation({ mutationFn: cancelCandidatePrivacyRequest, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["candidate-portal"] }) });
  const field = <K extends keyof CandidatePortalProfileDto>(key: K, value: CandidatePortalProfileDto[K]) => setForm((current) => ({ ...(current ?? profile.data), [key]: value }));
  return <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-12 pt-2"><CandidateNav />
    {!authenticated ? <CandidateAuthCard lang={lang} returnPath={"/candidate/profile?lang=" + lang} onAuthenticated={() => setAuthenticated(true)} /> : null}
    {profile.isLoading || overview.isLoading ? <AsyncState state="loading" title="Cargando tu perfil" /> : null}
    {profile.data && overview.data ? <>
      <header><Badge variant="secondary"><ShieldCheck className="mr-2 inline size-4" />Controles de privacidad</Badge><h1 className="mt-3 text-3xl font-semibold">Perfil y preferencias</h1><p className="mt-2 text-muted-foreground">Tus cambios se sincronizan con todas tus postulaciones activas.</p></header>
      <Card><CardHeader><CardTitle>Datos personales</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><Field label="Nombre completo" value={form.fullName ?? ""} onChange={(value) => field("fullName", value)} /><Field label="Teléfono" value={form.phone ?? ""} onChange={(value) => field("phone", value)} /><Field label="Ciudad" value={form.city ?? ""} onChange={(value) => field("city", value)} /><Field label="LinkedIn" type="url" value={form.linkedinUrl ?? ""} onChange={(value) => field("linkedinUrl", value)} /><Field label="Portafolio" type="url" value={form.portfolioUrl ?? ""} onChange={(value) => field("portfolioUrl", value)} /><Field label="Zona horaria" value={form.timezone ?? "UTC"} onChange={(value) => field("timezone", value)} /><label className="space-y-2 text-sm font-medium">Idioma<select className="h-11 w-full rounded-xl border bg-background px-3" value={form.locale ?? locale} onChange={(event) => { const nextLocale = event.target.value as "es" | "en"; field("locale", nextLocale); setLocale(nextLocale); }}><option value="es">Español</option><option value="en">English</option></select></label><div className="flex items-end"><Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Guardando…" : "Guardar perfil"}</Button></div></CardContent></Card>
      <Card><CardHeader><CardTitle>Preferencias de comunicación</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2"><Preference label="Cambios de estado" checked={Boolean(form.statusUpdates)} onChange={(value) => field("statusUpdates", value)} /><Preference label="Recordatorios de entrevistas" checked={Boolean(form.interviewReminders)} onChange={(value) => field("interviewReminders", value)} /><Preference label="Notificaciones de ofertas" checked={Boolean(form.offerNotifications)} onChange={(value) => field("offerNotifications", value)} /><Preference label="Comunicaciones opcionales del producto" checked={Boolean(form.marketingConsent)} onChange={(value) => field("marketingConsent", value)} /><Button className="md:col-span-2 md:w-fit" onClick={() => save.mutate()} disabled={save.isPending}>Guardar preferencias</Button></CardContent></Card>
      <Card><CardHeader><CardTitle>Tus derechos sobre los datos</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">Las solicitudes se revisan antes de ejecutarse para proteger procesos activos y obligaciones legales.</p><Label htmlFor="privacy-reason">Contexto o motivo (opcional)</Label><textarea id="privacy-reason" className="min-h-24 w-full rounded-xl border bg-background p-3" value={privacyReason} onChange={(event) => setPrivacyReason(event.target.value)} /><div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => privacy.mutate("EXPORT")}>Solicitar copia</Button><Button variant="secondary" onClick={() => privacy.mutate("ANONYMIZE")}>Solicitar anonimización</Button><Button variant="destructive" onClick={() => privacy.mutate("DELETE")}><Trash2 className="size-4" />Solicitar eliminación</Button></div><div className="space-y-2">{overview.data.privacyRequests.map((request) => <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 text-sm"><span><strong>{technicalLabel(request.type)}</strong> · {technicalLabel(request.status)} · {new Date(request.requestedAt).toLocaleDateString(lang)}</span>{request.status === "PENDING" ? <Button size="sm" variant="ghost" onClick={() => cancel.mutate(request.id)}>Cancelar</Button> : null}</div>)}</div></CardContent></Card>
    </> : null}
  </main>;
}

export default function CandidateProfilePage() { return <Suspense fallback={<AsyncState state="loading" />}><CandidateProfileContent /></Suspense>; }

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { const id = "profile-" + label.toLowerCase().replace(/\W+/g, "-"); return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} /></div>; }
function Preference({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="flex min-h-12 items-center gap-3 rounded-xl border p-3 text-sm font-medium"><input className="size-4" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />{label}</label>; }
