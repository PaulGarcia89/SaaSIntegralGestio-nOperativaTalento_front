"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Download, FileSignature, Plus, Send, X } from "lucide-react";
import { InlineFeedback } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  cancelJobOffer,
  createJobOffer,
  decideJobOfferApproval,
  downloadJobOfferPdf,
  fetchJobOffers,
  fetchUsers,
  reviseJobOffer,
  retryJobOfferConversion,
  sendStructuredJobOffer,
} from "@/lib/backend";
import type { CompensationPeriodicity, CreateJobOfferInput, JobOfferDto, JobOfferVersionDto } from "@/lib/contracts";
import { technicalLabel } from "@/lib/ui-labels";

const periodicities: Array<{ value: CompensationPeriodicity; label: string }> = [
  { value: "HOURLY", label: "Por hora" },
  { value: "WEEKLY", label: "Semanal" },
  { value: "BIWEEKLY", label: "Quincenal" },
  { value: "MONTHLY", label: "Mensual" },
  { value: "ANNUAL", label: "Anual" },
];

function initialForm(jobTitle: string): OfferForm {
  const start = new Date(Date.now() + 14 * 86_400_000);
  const expiration = new Date(Date.now() + 7 * 86_400_000);
  return { salaryAmount: "", currency: "USD", periodicity: "ANNUAL", benefits: "", jobTitle, employmentStartDate: start.toISOString().slice(0, 10), validUntil: expiration.toISOString().slice(0, 10), message: "", financialApproverId: "", managerialApproverId: "" };
}

type OfferForm = Omit<CreateJobOfferInput, "salaryAmount" | "benefits" | "employmentStartDate" | "validUntil"> & {
  salaryAmount: string;
  benefits: string;
  employmentStartDate: string;
  validUntil: string;
  financialApproverId: string;
  managerialApproverId: string;
};

export function JobOfferManager({ applicationId, jobTitle, canManage }: { applicationId: string; jobTitle: string; canManage: boolean }) {
  const queryClient = useQueryClient();
  const offers = useQuery({ queryKey: ["job-offers", applicationId], queryFn: () => fetchJobOffers(applicationId) });
  const users = useQuery({ queryKey: ["users", "job-offer-approvers"], queryFn: fetchUsers, enabled: canManage });
  const [editing, setEditing] = useState(false);
  const [revisionOf, setRevisionOf] = useState<string | null>(null);
  const [form, setForm] = useState<OfferForm>(() => initialForm(jobTitle));
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["job-offers", applicationId] }),
      queryClient.invalidateQueries({ queryKey: ["ats-communications", applicationId] }),
      queryClient.invalidateQueries({ queryKey: ["application", applicationId] }),
    ]);
  };
  const save = useMutation({
    mutationFn: () => {
      const input = toInput(form);
      return revisionOf ? reviseJobOffer(revisionOf, input) : createJobOffer(applicationId, input);
    },
    onSuccess: async () => { setEditing(false); setRevisionOf(null); setForm(initialForm(jobTitle)); await refresh(); },
  });
  const approval = useMutation({ mutationFn: ({ offerId, type, approved }: { offerId: string; type: "FINANCIAL" | "MANAGERIAL"; approved: boolean }) => decideJobOfferApproval(offerId, { type, approved }), onSuccess: refresh });
  const send = useMutation({ mutationFn: sendStructuredJobOffer, onSuccess: refresh });
  const cancel = useMutation({ mutationFn: (offerId: string) => cancelJobOffer(offerId), onSuccess: refresh });
  const conversion = useMutation({ mutationFn: retryJobOfferConversion, onSuccess: refresh });
  const operationError = save.error ?? approval.error ?? send.error ?? cancel.error ?? conversion.error;
  const active = offers.data?.[0];

  function beginRevision(offer: JobOfferDto) {
    const version = currentVersion(offer);
    setRevisionOf(offer.id);
    setForm({
      salaryAmount: String(version.salaryAmount), currency: version.currency, periodicity: version.periodicity,
      benefits: benefits(version).join("\n"), jobTitle: version.jobTitle,
      employmentStartDate: version.employmentStartDate.slice(0, 10), validUntil: version.validUntil.slice(0, 10),
      message: version.message ?? "", financialApproverId: offer.financialApproverId ?? "", managerialApproverId: offer.managerialApproverId ?? "",
    });
    setEditing(true);
  }

  return <section id="job-offers" className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Oferta estructurada</h2><p className="text-sm text-text-secondary">Compensación, aprobaciones, PDF, firma y conversión en un solo expediente.</p></div>{canManage && !editing && (!active || terminal(active.status)) ? <Button onClick={() => { setRevisionOf(null); setForm(initialForm(jobTitle)); setEditing(true); }}><Plus className="size-4" />Nueva oferta</Button> : null}</div>
    {offers.isLoading ? <p className="text-sm text-text-secondary">Cargando ofertas…</p> : null}
    {offers.data?.map((offer) => <OfferCard key={offer.id} offer={offer} canManage={canManage} pending={approval.isPending || send.isPending || cancel.isPending || conversion.isPending} onApprove={(type, approved) => approval.mutate({ offerId: offer.id, type, approved })} onSend={() => send.mutate(offer.id)} onRevise={() => beginRevision(offer)} onCancel={() => cancel.mutate(offer.id)} onRetryConversion={() => conversion.mutate(offer.id)} />)}
    {!offers.isLoading && !offers.data?.length && !editing ? <InlineFeedback tone="info" title="Sin oferta preparada">Crea la primera oferta para iniciar las aprobaciones financiera y gerencial.</InlineFeedback> : null}
    {editing ? <OfferEditor form={form} users={users.data ?? []} pending={save.isPending} revision={Boolean(revisionOf)} onChange={setForm} onCancel={() => { setEditing(false); setRevisionOf(null); }} onSave={() => save.mutate()} /> : null}
    {operationError ? <InlineFeedback tone="danger" title="No fue posible completar la operación">{operationError instanceof Error ? operationError.message : "Revisa los datos e intenta nuevamente."}</InlineFeedback> : null}
  </section>;
}

function OfferCard({ offer, canManage, pending, onApprove, onSend, onRevise, onCancel, onRetryConversion }: { offer: JobOfferDto; canManage: boolean; pending: boolean; onApprove: (type: "FINANCIAL" | "MANAGERIAL", approved: boolean) => void; onSend: () => void; onRevise: () => void; onCancel: () => void; onRetryConversion: () => void }) {
  const version = currentVersion(offer);
  const currentApprovals = offer.approvals.filter((item) => item.version === offer.currentVersion);
  return <Card level={1}><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle>{version.jobTitle} · versión {version.version}</CardTitle><p className="text-sm text-text-secondary">Creada el {new Date(version.createdAt).toLocaleString("es")}</p></div><Badge>{offer.status}</Badge></div></CardHeader><CardContent className="space-y-4">
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Summary label="Compensación" value={`${version.currency} ${Number(version.salaryAmount).toLocaleString("es")} · ${technicalLabel(version.periodicity)}`} /><Summary label="Ingreso" value={new Date(version.employmentStartDate).toLocaleDateString("es")} /><Summary label="Vigencia" value={new Date(version.validUntil).toLocaleDateString("es")} /><Summary label="Origen" value={version.source === "CANDIDATE" ? "Contrapropuesta" : "Empresa"} /></dl>
    {benefits(version).length ? <div><p className="text-sm font-medium">Beneficios</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-secondary">{benefits(version).map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
    {version.counterproposalReason ? <InlineFeedback tone="warning" title="Contrapropuesta del candidato">{version.counterproposalReason}</InlineFeedback> : null}
    <div className="grid gap-2 sm:grid-cols-2">{currentApprovals.map((item) => <div key={item.id} className="rounded-xl border p-3"><div className="flex items-center justify-between"><span className="text-sm font-medium">{item.type === "FINANCIAL" ? "Aprobación financiera" : "Aprobación gerencial"}</span><Badge variant={item.status === "APPROVED" ? "default" : item.status === "REJECTED" ? "destructive" : "secondary"}>{item.status}</Badge></div>{canManage && item.status === "PENDING" ? <div className="mt-3 flex gap-2"><Button size="sm" onClick={() => onApprove(item.type, true)} disabled={pending}><Check className="size-4" />Aprobar</Button><Button size="sm" variant="destructive" onClick={() => onApprove(item.type, false)} disabled={pending}><X className="size-4" />Rechazar</Button></div> : null}</div>)}</div>
    {offer.conversionWorkflowId ? <InlineFeedback tone="success" title="Conversión completada">La aceptación creó automáticamente el flujo de contratación {offer.conversionWorkflowId}.</InlineFeedback> : offer.status === "ACCEPTED" && offer.conversionError ? <InlineFeedback tone="warning" title="Aceptada, conversión pendiente">{offer.conversionError}</InlineFeedback> : null}
    <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => openPdf(() => downloadJobOfferPdf(offer.id, version.version))}><Download className="size-4" />Descargar PDF</Button>{canManage && offer.status === "APPROVED" ? <Button onClick={onSend} disabled={pending}><Send className="size-4" />Enviar a firma</Button> : null}{canManage && offer.status === "ACCEPTED" && offer.conversionError ? <Button onClick={onRetryConversion} disabled={pending}>Reintentar conversión</Button> : null}{canManage && ["DRAFT", "COUNTERED", "REJECTED", "EXPIRED"].includes(offer.status) ? <Button variant="secondary" onClick={onRevise}><Plus className="size-4" />Nueva versión</Button> : null}{canManage && !["ACCEPTED", "CANCELLED"].includes(offer.status) ? <Button variant="ghost" onClick={onCancel} disabled={pending}>Cancelar oferta</Button> : null}{version.signaturePackage ? <Badge variant="secondary"><FileSignature className="mr-1 inline size-3.5" />Firma: {technicalLabel(version.signaturePackage.status)}</Badge> : null}</div>
  </CardContent></Card>;
}

function OfferEditor({ form, users, pending, revision, onChange, onCancel, onSave }: { form: OfferForm; users: Array<{ id: string; fullName: string }>; pending: boolean; revision: boolean; onChange: (form: OfferForm) => void; onCancel: () => void; onSave: () => void }) {
  const set = (patch: Partial<OfferForm>) => onChange({ ...form, ...patch });
  const valid = Number(form.salaryAmount) > 0 && form.currency.length === 3 && form.jobTitle.trim().length > 1 && Boolean(form.employmentStartDate) && Boolean(form.validUntil);
  return <Card level={2}><CardHeader><CardTitle>{revision ? "Preparar nueva versión" : "Preparar oferta"}</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><Field label="Salario" type="number" value={form.salaryAmount} onChange={(salaryAmount) => set({ salaryAmount })} /><Field label="Moneda ISO" value={form.currency} onChange={(currency) => set({ currency: currency.toUpperCase().slice(0, 3) })} /><SelectField label="Periodicidad" value={form.periodicity} onChange={(periodicity) => set({ periodicity: periodicity as CompensationPeriodicity })} options={periodicities} /><Field label="Puesto" value={form.jobTitle} onChange={(jobTitle) => set({ jobTitle })} /><Field label="Fecha de ingreso" type="date" value={form.employmentStartDate} onChange={(employmentStartDate) => set({ employmentStartDate })} /><Field label="Vigente hasta" type="date" value={form.validUntil} onChange={(validUntil) => set({ validUntil })} /><SelectField label="Aprobador financiero" value={form.financialApproverId || "ANY"} onChange={(value) => set({ financialApproverId: value === "ANY" ? "" : value })} options={[{ value: "ANY", label: "Cualquier usuario autorizado" }, ...users.map((user) => ({ value: user.id, label: user.fullName }))]} /><SelectField label="Aprobador gerencial" value={form.managerialApproverId || "ANY"} onChange={(value) => set({ managerialApproverId: value === "ANY" ? "" : value })} options={[{ value: "ANY", label: "Cualquier usuario autorizado" }, ...users.map((user) => ({ value: user.id, label: user.fullName }))]} /></div><label className="block space-y-2 text-sm font-medium">Beneficios, uno por línea<textarea rows={4} value={form.benefits} onChange={(event) => set({ benefits: event.target.value })} className="w-full rounded-xl border border-border-default bg-background p-3" /></label><label className="block space-y-2 text-sm font-medium">Mensaje para el candidato<textarea rows={5} maxLength={12000} value={form.message ?? ""} onChange={(event) => set({ message: event.target.value })} className="w-full rounded-xl border border-border-default bg-background p-3" /></label><InlineFeedback tone="info" title="Flujo controlado">Al guardar se solicitarán por separado las aprobaciones financiera y gerencial. Solo entonces podrá enviarse el PDF a firma.</InlineFeedback><div className="flex justify-end gap-2"><Button variant="ghost" onClick={onCancel}>Cancelar</Button><Button onClick={onSave} disabled={!valid || pending}>{pending ? "Guardando…" : revision ? "Crear nueva versión" : "Crear y solicitar aprobaciones"}</Button></div></CardContent></Card>;
}

function toInput(form: OfferForm): CreateJobOfferInput { return { salaryAmount: Number(form.salaryAmount), currency: form.currency, periodicity: form.periodicity, benefits: form.benefits.split("\n").map((item) => item.trim()).filter(Boolean), jobTitle: form.jobTitle.trim(), employmentStartDate: new Date(`${form.employmentStartDate}T12:00:00`).toISOString(), validUntil: new Date(`${form.validUntil}T23:59:59`).toISOString(), message: form.message?.trim() || undefined, financialApproverId: form.financialApproverId || undefined, managerialApproverId: form.managerialApproverId || undefined }; }
function currentVersion(offer: JobOfferDto) { return offer.versions.find((item) => item.version === offer.currentVersion) ?? offer.versions[0]; }
function benefits(version: JobOfferVersionDto) { return Array.isArray(version.benefits) ? version.benefits : []; }
function terminal(status: JobOfferDto["status"]) { return ["REJECTED", "EXPIRED", "CANCELLED"].includes(status); }
async function openPdf(loader: () => Promise<Blob>) { const blob = await loader(); const url = URL.createObjectURL(blob); window.open(url, "_blank", "noopener,noreferrer"); window.setTimeout(() => URL.revokeObjectURL(url), 60_000); }
function Summary({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs text-text-secondary">{label}</dt><dd className="mt-1 text-sm font-medium">{value}</dd></div>; }
function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { const id = `offer-${label.toLowerCase().replace(/\W+/g, "-")}`; return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} /></div>; }
function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) { return <div className="space-y-2"><Label>{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>; }
