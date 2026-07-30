"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { applicationStageLabel } from "@/lib/applications";
import type { ApplicationStatusKey, VacancyApplicationDto } from "@/lib/contracts";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function RecruitmentWorkspaceNav() {
  const pathname = usePathname();
  const items = [
    { href: "/ats/candidates", label: "Candidatos" },
    { href: "/ats/pipeline", label: "Pipeline" },
  ];
  return <nav aria-label="Vistas de candidatos" className="flex gap-1 overflow-x-auto border-b border-border-default">
    {items.map((item) => {
      const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
      return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn("flex min-h-11 items-center border-b-2 px-4 text-sm font-medium", active ? "border-primary text-text-primary" : "border-transparent text-text-secondary hover:text-text-primary")}>{item.label}</Link>;
    })}
  </nav>;
}

const consequences: Record<ApplicationStatusKey, string> = {
  SUBMITTED: "La postulación volverá a la bandeja de nuevas candidaturas.",
  REVIEWING: "Quedará marcada para revisión del equipo de reclutamiento.",
  INTERVIEW: "El siguiente paso recomendado será programar una entrevista.",
  APPROVED: "Quedará lista para iniciar la decisión de contratación.",
  REJECTED: "Se cerrará el proceso para esta postulación. No se enviará comunicación automática desde esta pantalla.",
  TRAINING: "Quedará pendiente de las actividades formativas configuradas.",
  HIRED: "Se marcará como contratada. La creación del empleado y onboarding requiere confirmación en el flujo correspondiente.",
};

export function StageChangeDialog({ application, targetStatus, open, pending, onOpenChange, onConfirm }: { application: VacancyApplicationDto | null; targetStatus: ApplicationStatusKey | null; open: boolean; pending: boolean; onOpenChange: (open: boolean) => void; onConfirm: () => void }) {
  if (!application || !targetStatus) return null;
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Confirmar cambio de etapa</DialogTitle><DialogDescription>Revisa el impacto antes de actualizar la postulación.</DialogDescription></DialogHeader><div className="space-y-4"><dl className="grid gap-3 rounded-xl bg-surface-section p-4 text-sm"><div><dt className="text-text-secondary">Candidato</dt><dd className="font-medium">{application.candidate.fullName}</dd></div><div><dt className="text-text-secondary">Cambio</dt><dd className="font-medium">{applicationStageLabel(application.status)} → {applicationStageLabel(targetStatus)}</dd></div></dl><div className="flex gap-3 rounded-xl border border-status-warning/30 bg-status-warning/5 p-4 text-sm"><AlertTriangle className="size-5 shrink-0" aria-hidden="true" /><p>{consequences[targetStatus]}</p></div><div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="secondary" onClick={() => onOpenChange(false)} disabled={pending}>Seguir revisando</Button><Button onClick={onConfirm} disabled={pending}>{pending ? "Actualizando…" : "Confirmar cambio"}<ArrowRight className="size-4" /></Button></div></div></DialogContent></Dialog>;
}

export function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return <label className="space-y-1.5 text-sm font-medium"><span>{label}</span>{children}</label>;
}

export function CandidatePreviewDialog({ application, open, onOpenChange }: { application: VacancyApplicationDto | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  if (!application) return null;
  const responses = Object.entries(application.dynamicResponses ?? {});
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>{application.candidate.fullName}</DialogTitle><DialogDescription>{application.vacancy.title} · {applicationStageLabel(application.status)}</DialogDescription></DialogHeader><div className="space-y-5"><dl className="grid gap-3 rounded-xl bg-surface-section p-4 text-sm sm:grid-cols-2"><div><dt className="text-text-secondary">Correo</dt><dd className="break-all font-medium">{application.candidate.email}</dd></div><div><dt className="text-text-secondary">Teléfono</dt><dd className="font-medium">{application.candidate.phone || "No informado"}</dd></div><div><dt className="text-text-secondary">Ciudad</dt><dd className="font-medium">{application.candidate.city || "No informada"}</dd></div><div><dt className="text-text-secondary">Sucursal</dt><dd className="font-medium">{application.vacancy.branch?.name || "No informada"}</dd></div></dl><section><h3 className="font-semibold">Carta de presentación</h3><p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">{application.coverLetter || "No se adjuntó una carta de presentación."}</p></section>{responses.length ? <section><h3 className="font-semibold">Respuestas destacadas</h3><dl className="mt-3 grid gap-3 sm:grid-cols-2">{responses.slice(0, 4).map(([key, value]) => <div key={key} className="rounded-xl border border-border-default p-3"><dt className="text-xs text-text-secondary">{key.replaceAll("_", " ")}</dt><dd className="mt-1 text-sm">{Array.isArray(value) ? value.join(", ") : String(value)}</dd></div>)}</dl></section> : null}<Button asChild className="w-full"><Link href={`/ats/candidates/${application.id}`}>Abrir perfil completo<ArrowRight className="size-4" /></Link></Button></div></DialogContent></Dialog>;
}
