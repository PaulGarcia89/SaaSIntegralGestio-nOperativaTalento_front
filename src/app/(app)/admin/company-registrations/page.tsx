"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Check, Clock3, Mail, MapPin, X } from "lucide-react";
import { approveCompanyRegistrationRequest, fetchCompanyRegistrationRequests, rejectCompanyRegistrationRequest, type CompanyRegistrationRequestDto } from "@/lib/backend";
import { AsyncState } from "@/components/async-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StateCard } from "@/components/domain";
import { useAppStore } from "@/store/app-store";

const statusLabels: Record<CompanyRegistrationRequestDto["status"], string> = { PENDING: "Pendiente", APPROVED: "Aprobada", REJECTED: "Rechazada" };

export default function CompanyRegistrationsPage() {
  const { can } = useAppStore();
  const client = useQueryClient();
  const [active, setActive] = useState<CompanyRegistrationRequestDto | null>(null);
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [notes, setNotes] = useState("");
  const registrations = useQuery({ queryKey: ["company-registration-requests"], queryFn: () => fetchCompanyRegistrationRequests() });
  const review = useMutation({
    mutationFn: async () => {
      if (!active || !decision) throw new Error("Selecciona una solicitud.");
      return decision === "approve" ? approveCompanyRegistrationRequest(active.id, notes) : rejectCompanyRegistrationRequest(active.id, notes);
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["company-registration-requests"] });
      void client.invalidateQueries({ queryKey: ["admin-tenants"] });
      setActive(null);
      setDecision(null);
      setNotes("");
    },
  });

  if (!can("tenants.view")) return <StateCard tone="restricted" title="Sin acceso a solicitudes" description="Sólo la administración de plataforma puede revisar registros de empresas." />;
  if (registrations.isLoading) return <AsyncState state="loading" title="Cargando solicitudes de empresa" />;
  if (registrations.isError) return <AsyncState state="error" title="No fue posible cargar las solicitudes" onRetry={() => void registrations.refetch()} />;

  const pending = (registrations.data ?? []).filter((item) => item.status === "PENDING");
  return <div className="space-y-6"><header className="flex flex-col gap-4 rounded-3xl border border-cyan-100 bg-[linear-gradient(135deg,#ecfeff,#f8fafc)] p-6 sm:flex-row sm:items-end sm:justify-between"><div><Badge className="bg-cyan-100 text-cyan-800 hover:bg-cyan-100">Gobierno SaaS</Badge><h1 className="mt-3 text-3xl font-semibold tracking-tight">Solicitudes de empresa</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Revisa los registros antes de crear un tenant, la suscripción, la sede principal y su administrador.</p></div><div className="rounded-2xl bg-white px-4 py-3 text-sm shadow-sm"><span className="text-2xl font-semibold text-cyan-800">{pending.length}</span><span className="ml-2 text-muted-foreground">pendientes</span></div></header><div className="grid gap-4 xl:grid-cols-2">{(registrations.data ?? []).map((item) => <article key={item.id} className="rounded-3xl border border-border bg-card p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-800"><Building2 className="size-5" /></span><div><h2 className="font-semibold">{item.companyName}</h2><p className="text-sm text-muted-foreground">Plan {item.plan}</p></div></div><Badge variant="secondary" className={item.status === "PENDING" ? "bg-amber-100 text-amber-800" : item.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}>{statusLabels[item.status]}</Badge></div><dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2"><div className="rounded-xl bg-slate-50 p-3"><dt className="flex items-center gap-2 text-xs text-slate-500"><MapPin className="size-3.5" />Sede principal</dt><dd className="mt-1 font-medium">{item.branchName}</dd><dd className="text-slate-600">{item.branchLocation}</dd></div><div className="rounded-xl bg-slate-50 p-3"><dt className="flex items-center gap-2 text-xs text-slate-500"><Mail className="size-3.5" />Administrador</dt><dd className="mt-1 font-medium">{item.adminName}</dd><dd className="truncate text-slate-600">{item.adminEmail}</dd></div></dl><div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" />{new Date(item.requestedAt).toLocaleString("es")}</span>{item.reviewNotes ? <span className="max-w-56 truncate">{item.reviewNotes}</span> : null}</div>{item.status === "PENDING" ? <div className="mt-5 flex gap-3"><Button className="flex-1" onClick={() => { setActive(item); setDecision("approve"); setNotes(""); }}><Check className="size-4" />Aprobar</Button><Button className="flex-1" variant="secondary" onClick={() => { setActive(item); setDecision("reject"); setNotes(""); }}><X className="size-4" />Rechazar</Button></div> : null}</article>)}</div>{registrations.data?.length === 0 ? <StateCard tone="empty" title="No hay solicitudes" description="Las solicitudes enviadas desde el registro público aparecerán aquí." /> : null}{active && decision ? <div className="fixed inset-0 z-50 flex items-end bg-slate-950/35 p-4 sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-labelledby="registration-review-title"><div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"><Badge className={decision === "approve" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}>{decision === "approve" ? "Aprobar solicitud" : "Rechazar solicitud"}</Badge><h2 id="registration-review-title" className="mt-3 text-xl font-semibold">{active.companyName}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{decision === "approve" ? "Esta acción creará la empresa, la suscripción de prueba, la sede y el acceso TENANT_ADMIN de forma transaccional." : "Explica al solicitante qué debe corregir antes de enviar una nueva solicitud."}</p><label className="mt-5 block text-sm font-medium">Observación {decision === "reject" ? "(obligatoria)" : "(opcional)"}<textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-2 min-h-28 w-full rounded-2xl border border-border bg-surface-elevated p-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20" placeholder={decision === "approve" ? "Ej. Aprobada para trial de 14 días" : "Indica el motivo del rechazo"} /></label>{review.isError ? <p className="mt-3 text-sm text-red-600">No fue posible guardar la decisión. Inténtalo nuevamente.</p> : null}<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button variant="secondary" onClick={() => { setActive(null); setDecision(null); }}>Cancelar</Button><Button variant={decision === "approve" ? "default" : "destructive"} disabled={review.isPending || (decision === "reject" && !notes.trim())} onClick={() => review.mutate()}>{review.isPending ? "Guardando..." : decision === "approve" ? "Confirmar aprobación" : "Confirmar rechazo"}</Button></div></div></div> : null}</div>;
}
