"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, CheckCircle2, Clipboard, FileSignature, Plus, Send, ShieldCheck } from "lucide-react";
import {
  createSignaturePackage,
  createSignatureTemplate,
  fetchOnboardingFlows,
  fetchSignaturePackages,
  fetchSignatureProviders,
  fetchSignatureTemplates,
  remindSignaturePackage,
  sendSignaturePackage,
} from "@/lib/backend";
import type { ElectronicSignaturePackageDto } from "@/lib/contracts";
import { findSignaturePackageFlowPrefill } from "@/lib/signature-prefill";
import { useAppStore } from "@/store/app-store";
import { AsyncState } from "@/components/async-state";
import { InlineFeedback, PageHeader } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SigningLink = { participantId: string; email: string; url: string };

export default function ElectronicSignaturesPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { currentBranch, can } = useAppStore();
  const requestedFlowId = searchParams.get("flowId") ?? "";
  const shouldCreatePackage = searchParams.get("action") === "create";
  const [templateOpen, setTemplateOpen] = useState(false);
  const [packageOpen, setPackageOpen] = useState(false);
  const [automaticPackageDismissed, setAutomaticPackageDismissed] = useState(false);
  const [links, setLinks] = useState<SigningLink[]>([]);
  const [templateForm, setTemplateForm] = useState({ name: "Documentos de ingreso", title: "Acuerdo y consentimiento de incorporación", content: "Declaro que la información entregada durante mi incorporación es correcta y que he recibido los documentos y políticas aplicables.", consentText: "Acepto utilizar mi nombre escrito como firma electrónica y confirmo mi intención de firmar este documento.", provider: "INTERNAL" });
  const [packageForm, setPackageForm] = useState({ onboardingFlowId: "", templateId: "", dueDate: "", fullName: "", email: "" });

  const providers = useQuery({ queryKey: ["signature-providers"], queryFn: fetchSignatureProviders });
  const templates = useQuery({ queryKey: ["signature-templates"], queryFn: fetchSignatureTemplates });
  const packages = useQuery({ queryKey: ["signature-packages"], queryFn: fetchSignaturePackages });
  const flows = useQuery({ queryKey: ["onboarding-flows", currentBranch?.id, "signature"], queryFn: () => fetchOnboardingFlows(currentBranch?.id) });
  const refresh = async () => queryClient.invalidateQueries({ queryKey: ["signature-packages"] });

  const createTemplate = useMutation({ mutationFn: () => createSignatureTemplate({ ...templateForm, isDefault: true }), onSuccess: async (template) => { await queryClient.invalidateQueries({ queryKey: ["signature-templates"] }); setPackageForm((current) => ({ ...current, templateId: template.id })); setTemplateOpen(false); } });
  const sendPackage = useMutation({ mutationFn: (id: string) => sendSignaturePackage(id), onSuccess: async (result) => { setLinks(result.signingLinks); await refresh(); } });
  const remind = useMutation({ mutationFn: (id: string) => remindSignaturePackage(id), onSuccess: async (result) => { setLinks(result.signingLinks); await refresh(); } });
  const stats = useMemo(() => ({ pending: packages.data?.filter((item) => item.status === "PENDING" || item.status === "PARTIALLY_SIGNED").length ?? 0, complete: packages.data?.filter((item) => item.status === "COMPLETED").length ?? 0 }), [packages.data]);
  const requestedFlow = flows.data?.items.find((flow) => flow.id === requestedFlowId);
  const requestedPrefill = flows.data
    ? findSignaturePackageFlowPrefill(flows.data.items, requestedFlowId)
    : null;
  const effectivePackageForm = packageForm.onboardingFlowId || !requestedPrefill
    ? packageForm
    : { ...packageForm, ...requestedPrefill };
  const automaticPackageOpen = Boolean(
    requestedPrefill &&
    shouldCreatePackage &&
    can("onboarding.manage") &&
    !automaticPackageDismissed,
  );
  const packageDialogOpen = packageOpen || automaticPackageOpen;
  const invalidRequestedFlow = Boolean(requestedFlowId && flows.isSuccess && !requestedFlow);
  const createPackage = useMutation({ mutationFn: () => createSignaturePackage({ onboardingFlowId: effectivePackageForm.onboardingFlowId, templateId: effectivePackageForm.templateId, dueDate: effectivePackageForm.dueDate ? new Date(effectivePackageForm.dueDate).toISOString() : undefined, participants: [{ fullName: effectivePackageForm.fullName, email: effectivePackageForm.email, roleLabel: "Empleado" }] }), onSuccess: async () => { await refresh(); setPackageOpen(false); setAutomaticPackageDismissed(true); } });

  function chooseFlow(flowId: string) {
    const flow = flows.data?.items.find((item) => item.id === flowId);
    setPackageForm((current) => ({ ...current, onboardingFlowId: flowId, fullName: flow?.employee.name ?? "", email: flow?.employee.email ?? "" }));
  }

  return <div className="space-y-7">
    <PageHeader eyebrow="Personas" title="Firma electrónica" description="Prepara paquetes, recoge consentimiento verificable y conserva evidencias y auditoría dentro de cada incorporación." actions={can("onboarding.manage") ? <div className="flex gap-2"><Button variant="secondary" onClick={() => setTemplateOpen(true)}><Plus className="size-4" />Plantilla</Button><Button onClick={() => setPackageOpen(true)}><FileSignature className="size-4" />Nuevo paquete</Button></div> : undefined} />
    {requestedFlow ? <InlineFeedback tone="success" title="Incorporación preseleccionada">{requestedFlow.employee.name} · {requestedFlow.branch.name}. El nuevo paquete quedará vinculado a este expediente.</InlineFeedback> : null}
    {invalidRequestedFlow ? <InlineFeedback tone="warning" title="Incorporación no disponible">El expediente solicitado no existe o no pertenece a la sucursal activa. Puedes seleccionar otra incorporación manualmente.</InlineFeedback> : null}
    <section className="grid gap-4 md:grid-cols-3">
      <Metric icon={ShieldCheck} label="Proveedor activo" value={providers.data?.find((provider) => provider.configured)?.name ?? "Verificando"} />
      <Metric icon={BellRing} label="Pendientes" value={String(stats.pending)} />
      <Metric icon={CheckCircle2} label="Completados" value={String(stats.complete)} />
    </section>
    <InlineFeedback tone="info" title="Evidencias verificables">El proveedor interno registra versión del consentimiento, fecha, checksum del documento y huellas no reversibles de red y dispositivo. DocuSign y Dropbox Sign solo se habilitan cuando sus credenciales estén configuradas.</InlineFeedback>
    {packages.isLoading ? <AsyncState state="loading" title="Cargando paquetes de firma" /> : null}
    {packages.isError ? <AsyncState state="error" title="No pudimos cargar las firmas" onRetry={() => void packages.refetch()} /> : null}
    {packages.isSuccess && !packages.data.length ? <InlineFeedback tone="info" title="No hay paquetes de firma">Crea una plantilla y genera el primer paquete desde una incorporación activa.</InlineFeedback> : null}
    <section className="grid gap-4 xl:grid-cols-2">{packages.data?.map((item) => <PackageCard key={item.id} item={item} canManage={can("onboarding.manage")} sending={sendPackage.isPending || remind.isPending} onSend={() => sendPackage.mutate(item.id)} onRemind={() => remind.mutate(item.id)} />)}</section>
    <Dialog open={templateOpen} onOpenChange={setTemplateOpen}><DialogContent><DialogHeader><DialogTitle>Nueva plantilla de firma</DialogTitle><DialogDescription>La plantilla queda versionada; cada paquete conserva el contenido y consentimiento utilizados.</DialogDescription></DialogHeader><div className="space-y-4"><Field label="Nombre" value={templateForm.name} onChange={(value) => setTemplateForm({ ...templateForm, name: value })} /><Field label="Título del documento" value={templateForm.title} onChange={(value) => setTemplateForm({ ...templateForm, title: value })} /><TextField label="Contenido" value={templateForm.content} onChange={(value) => setTemplateForm({ ...templateForm, content: value })} /><TextField label="Texto de consentimiento" value={templateForm.consentText} onChange={(value) => setTemplateForm({ ...templateForm, consentText: value })} /><div className="space-y-2"><Label>Proveedor</Label><Select value={templateForm.provider} onValueChange={(provider) => setTemplateForm({ ...templateForm, provider })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{providers.data?.map((provider) => <SelectItem key={provider.code} value={provider.code} disabled={!provider.configured}>{provider.name}{provider.configured ? "" : " · no configurado"}</SelectItem>)}</SelectContent></Select></div><Button className="w-full" onClick={() => createTemplate.mutate()} disabled={!templateForm.name || !templateForm.content || createTemplate.isPending}>{createTemplate.isPending ? "Creando…" : "Crear plantilla"}</Button></div></DialogContent></Dialog>
    <Dialog open={packageDialogOpen} onOpenChange={(open) => { setPackageOpen(open); if (!open) setAutomaticPackageDismissed(true); }}><DialogContent><DialogHeader><DialogTitle>Preparar paquete de firma</DialogTitle><DialogDescription>Asócialo a una incorporación para que el resultado actualice automáticamente su checklist.</DialogDescription></DialogHeader><div className="space-y-4"><SelectField label="Incorporación" value={effectivePackageForm.onboardingFlowId} onValueChange={chooseFlow} options={flows.data?.items.map((flow) => ({ value: flow.id, label: `${flow.employee.name} · ${flow.branch.name}` })) ?? []} /><SelectField label="Plantilla" value={effectivePackageForm.templateId} onValueChange={(templateId) => setPackageForm({ ...effectivePackageForm, templateId })} options={templates.data?.map((template) => ({ value: template.id, label: `${template.name} v${template.version}` })) ?? []} /><Field label="Firmante" value={effectivePackageForm.fullName} onChange={(fullName) => setPackageForm({ ...effectivePackageForm, fullName })} /><Field label="Correo del firmante" type="email" value={effectivePackageForm.email} onChange={(email) => setPackageForm({ ...effectivePackageForm, email })} /><Field label="Fecha límite" type="date" value={effectivePackageForm.dueDate} onChange={(dueDate) => setPackageForm({ ...effectivePackageForm, dueDate })} /><Button className="w-full" onClick={() => createPackage.mutate()} disabled={!effectivePackageForm.onboardingFlowId || !effectivePackageForm.templateId || !effectivePackageForm.fullName || !effectivePackageForm.email || createPackage.isPending}>{createPackage.isPending ? "Preparando…" : "Crear paquete"}</Button></div></DialogContent></Dialog>
    <Dialog open={Boolean(links.length)} onOpenChange={(open) => !open && setLinks([])}><DialogContent><DialogHeader><DialogTitle>Solicitudes listas para entregar</DialogTitle><DialogDescription>El proveedor interno generó enlaces de un solo uso. Compártelos por un canal verificado; no se simula un correo enviado.</DialogDescription></DialogHeader><div className="space-y-3">{links.map((link) => <div key={link.participantId} className="rounded-xl border p-3"><p className="font-medium">{link.email}</p><p className="truncate text-xs text-text-secondary">{link.url}</p><Button className="mt-2" size="sm" variant="secondary" onClick={() => void navigator.clipboard.writeText(link.url)}><Clipboard className="size-4" />Copiar enlace</Button></div>)}</div></DialogContent></Dialog>
  </div>;
}

function PackageCard({ item, canManage, sending, onSend, onRemind }: { item: ElectronicSignaturePackageDto; canManage: boolean; sending: boolean; onSend: () => void; onRemind: () => void }) {
  const signed = item.participants.filter((participant) => participant.status === "SIGNED").length;
  return <Card level={item.status === "COMPLETED" ? 2 : 1}><CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle>{item.title}</CardTitle><p className="text-sm text-text-secondary">{item.employee?.name ?? "Sin empleado"} · {item.template ? `${item.template.name} v${item.template.version}` : "Plantilla no disponible"}</p></div><Badge>{item.status}</Badge></div></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-3"><Summary label="Firmas" value={`${signed}/${item.participants.length}`} /><Summary label="Proveedor" value={item.externalProvider ?? "Sin definir"} /><Summary label="Vence" value={item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "Sin fecha"} /></div><div className="space-y-2">{item.participants.map((participant) => <div key={participant.id} className="flex items-center justify-between rounded-xl bg-secondary/40 p-3 text-sm"><span>{participant.fullName}<span className="block text-xs text-text-secondary">{participant.email}</span></span><Badge>{participant.status}</Badge></div>)}</div>{item.auditEvents[0] ? <p className="text-xs text-text-secondary">Último evento: {item.auditEvents[0].action} · {new Date(item.auditEvents[0].occurredAt).toLocaleString()}{item.auditEvents[0].requestId ? ` · ${item.auditEvents[0].requestId}` : ""}</p> : null}{canManage && item.status !== "COMPLETED" ? <div className="flex gap-2">{item.sentAt ? <Button variant="secondary" onClick={onRemind} disabled={sending}><BellRing className="size-4" />Recordar</Button> : <Button onClick={onSend} disabled={sending || !item.template}><Send className="size-4" />Enviar a firma</Button>}</div> : null}</CardContent></Card>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof ShieldCheck; label: string; value: string }) { return <Card level={2}><CardContent className="flex items-center gap-3 p-4"><Icon className="size-5 text-primary" /><div><p className="text-xs text-text-secondary">{label}</p><p className="font-semibold">{value}</p></div></CardContent></Card>; }
function Summary({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-text-secondary">{label}</p><p className="font-medium">{value}</p></div>; }
function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { const id = `signature-${label.toLowerCase().replace(/\W+/g, "-")}`; return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} /></div>; }
function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { const id = `signature-${label.toLowerCase().replace(/\W+/g, "-")}`; return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><textarea id={id} rows={5} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border bg-background p-3 text-sm" /></div>; }
function SelectField({ label, value, onValueChange, options }: { label: string; value: string; onValueChange: (value: string) => void; options: Array<{ value: string; label: string }> }) { return <div className="space-y-2"><Label>{label}</Label><Select value={value} onValueChange={onValueChange}><SelectTrigger><SelectValue placeholder={`Selecciona ${label.toLowerCase()}`} /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>; }
