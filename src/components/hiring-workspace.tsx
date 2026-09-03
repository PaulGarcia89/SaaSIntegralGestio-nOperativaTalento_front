"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Clock3, FileCheck2, FileSignature, History, LockKeyhole, Search, UserRound } from "lucide-react";
import { AsyncState } from "@/components/async-state";
import { ActionBar, InlineFeedback, PageHeader, ResponsiveDataView } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchApplication, fetchApplications, fetchDocuSealHiringBundleStatus, fetchJobOffers, fetchHiringContext, hireCandidate } from "@/lib/backend";
import type { ApplicationTimelineEventDto, JobOfferDto, VacancyApplicationDto } from "@/lib/contracts";
import { applicationStageLabel, formatApplicationDate } from "@/lib/applications";
import { useAppStore } from "@/store/app-store";

const steps = ["Información", "Oferta", "Documentos", "Firmas", "Revisión", "Confirmación"] as const;

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
}

function dateLabel(value?: string | null) {
  return value ? new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date(value)) : "Sin fecha límite";
}

function offerStatus(offers: JobOfferDto[]) {
  return offers[0]?.status;
}

export function currentStep(application: VacancyApplicationDto, offers: JobOfferDto[], signatureComplete: boolean, signatureSent: boolean) {
  if (application.status === "HIRED") return signatureComplete ? 5 : signatureSent ? 4 : 3;
  const status = offerStatus(offers);
  if (status === "ACCEPTED") return signatureComplete ? 5 : 3;
  if (["SENT", "COUNTERED"].includes(status ?? "")) return 1;
  if (status) return 1;
  if (application.status === "APPROVED") return 1;
  return 0;
}

export function statusLabel(application: VacancyApplicationDto, offers: JobOfferDto[]) {
  if (application.status === "HIRED") return "Contratación confirmada";
  const offer = offerStatus(offers);
  if (offer === "ACCEPTED") return "Oferta aceptada";
  if (offer === "SENT" || offer === "COUNTERED") return "Esperando candidato";
  if (application.status === "APPROVED") return "Lista para preparar";
  return applicationStageLabel(application.status);
}

export function nextAction(application: VacancyApplicationDto, offers: JobOfferDto[], signatureComplete: boolean, signatureSent: boolean) {
  if (application.status === "HIRED" && signatureComplete) return "Iniciar onboarding";
  if (application.status === "HIRED" && signatureSent) return "Revisar documentos y firmas";
  if (application.status === "HIRED") return "Solicitar documentos";
  if (offerStatus(offers) === "ACCEPTED") return "Confirmar contratación";
  if (offerStatus(offers) === "SENT" || offerStatus(offers) === "COUNTERED") return "Esperar respuesta del candidato";
  if (application.status === "APPROVED") return "Configurar oferta laboral";
  return "Completar evaluación del candidato";
}

function listAction(application: VacancyApplicationDto, offers: JobOfferDto[]) {
  const offer = offerStatus(offers);
  if (application.status === "HIRED") return "Revisar resultado";
  if (offer === "ACCEPTED") return "Confirmar contratación";
  if (offer === "SENT" || offer === "COUNTERED") return "Esperar respuesta";
  if (application.status === "APPROVED") return "Configurar oferta";
  return "Completar evaluación";
}

function documentState(application: VacancyApplicationDto) {
  if (application.status === "HIRED") return "Revisar expediente";
  if (application.status === "APPROVED") return "Pendientes de solicitar";
  return "Aún no aplica";
}

function applicationOfferStatus(application: VacancyApplicationDto) {
  const event = [...(application.tracking?.timelineEvents ?? [])]
    .filter((item) => item.type.startsWith("OFFER_"))
    .sort((a, b) => new Date(b.at ?? 0).getTime() - new Date(a.at ?? 0).getTime())[0];
  return event?.type === "OFFER_ACCEPTED" ? "ACCEPTED" : event?.type === "OFFER_SENT" ? "SENT" : event?.type === "OFFER_COUNTERED" ? "COUNTERED" : event?.type === "OFFER_REJECTED" ? "REJECTED" : event?.type === "OFFER_EXPIRED" ? "EXPIRED" : undefined;
}

function listOffers(application: VacancyApplicationDto) {
  const status = applicationOfferStatus(application);
  return status ? [{ status } as JobOfferDto] : [];
}

function matchesHiringView(view: string, application: VacancyApplicationDto) {
  const offer = applicationOfferStatus(application);
  if (view === "ATTENTION") return Boolean(application.isStageOverdue || application.pendingTransitions?.length || ["REJECTED", "EXPIRED"].includes(offer ?? ""));
  if (view === "WAITING") return ["SENT", "COUNTERED"].includes(offer ?? "");
  if (view === "READY") return offer === "ACCEPTED" && application.status !== "HIRED";
  if (view === "COMPLETED") return application.status === "HIRED";
  return true;
}

function timeline(application: VacancyApplicationDto, offers: JobOfferDto[]) {
  const events: ApplicationTimelineEventDto[] = [...(application.tracking?.timelineEvents ?? [])];
  const offer = offers[0];
  if (offer?.acceptedAt) events.push({ type: "OFFER_ACCEPTED", at: offer.acceptedAt, note: "La oferta laboral fue aceptada." });
  return events.sort((a, b) => new Date(b.at ?? 0).getTime() - new Date(a.at ?? 0).getTime()).slice(0, 8);
}

function Responsible({ application }: { application: VacancyApplicationDto }) {
  const user = application.assignedRecruiter;
  return <div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{initials(user ? `${user.firstName} ${user.lastName}` : "RRHH")}</div><div><p className="text-sm font-medium">{user ? `${user.firstName} ${user.lastName}` : "Responsable de reclutamiento"}</p><p className="text-xs text-text-secondary">{user?.email ?? "Sin responsable asignado"}</p></div></div>;
}

function HiringHeader({ application, offers, signatureComplete, signatureSent }: { application: VacancyApplicationDto; offers: JobOfferDto[]; signatureComplete: boolean; signatureSent: boolean }) {
  const step = currentStep(application, offers, signatureComplete, signatureSent);
  const progress = Math.round((step / (steps.length - 1)) * 100);
  return <Card level={1} className="overflow-hidden"><CardContent className="p-5 sm:p-7"><div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between"><div className="flex min-w-0 items-start gap-4"><div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-semibold text-text-on-accent">{initials(application.candidate.fullName)}</div><div className="min-w-0"><p className="text-sm font-medium text-primary">Caso de contratación</p><h1 className="mt-1 truncate text-2xl font-semibold text-text-primary sm:text-3xl">{application.candidate.fullName}</h1><p className="mt-1 text-sm text-text-secondary">{application.vacancy.title} · {application.vacancy.branch?.name ?? "Sucursal no disponible"}</p><p className="mt-1 text-xs text-text-secondary">{application.candidate.email}</p></div></div><div className="flex flex-wrap items-center gap-2"><Badge variant={application.status === "HIRED" ? "success" : application.status === "REJECTED" ? "destructive" : "default"}>{statusLabel(application, offers)}</Badge><Badge variant="secondary">{progress}% de avance</Badge></div></div><div className="mt-7" aria-label="Avance de contratación"><div className="mb-2 flex items-center justify-between text-xs font-medium text-text-secondary"><span>Avance del proceso</span><span>{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-surface-section"><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${progress}%` }} /></div></div><ol className="mt-7 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">{steps.map((label, index) => <li key={label} className="flex items-center gap-2 text-sm"><span className={`flex size-7 shrink-0 items-center justify-center rounded-full border ${index < step ? "border-status-success/40 bg-status-success/10 text-status-success" : index === step ? "border-primary bg-primary text-text-on-accent" : "border-border-default text-text-secondary"}`}>{index < step ? <Check className="size-4" /> : index + 1}</span><span className={index <= step ? "font-medium text-text-primary" : "text-text-secondary"}>{label}</span></li>)}</ol></CardContent></Card>;
}

function Blockers({ application, offers, signatureComplete }: { application: VacancyApplicationDto; offers: JobOfferDto[]; signatureComplete: boolean }) {
  const blockers: string[] = [];
  if (application.pendingTransitions?.length) blockers.push("Hay un cambio de etapa esperando aprobación.");
  if (application.status !== "APPROVED" && application.status !== "HIRED") blockers.push("La postulación todavía no está aprobada para contratación.");
  if (offers[0]?.status === "PENDING_APPROVAL") blockers.push("La oferta laboral está pendiente de aprobación interna.");
  if (offers[0]?.status === "REJECTED" || offers[0]?.status === "EXPIRED") blockers.push("La oferta actual no puede continuar; prepara una nueva versión.");
  if (application.status === "HIRED" && !signatureComplete) blockers.push("Faltan documentos o firmas para completar el expediente.");
  return blockers.length ? <Card level={2}><CardHeader><CardTitle className="flex items-center gap-2"><LockKeyhole className="size-5 text-status-warning" />Alertas y bloqueos</CardTitle></CardHeader><CardContent className="space-y-3">{blockers.map((blocker) => <InlineFeedback key={blocker} tone="warning" title="Requiere atención">{blocker}</InlineFeedback>)}</CardContent></Card> : <InlineFeedback tone="success" title="Sin bloqueos críticos">La contratación puede continuar según los permisos y requisitos configurados.</InlineFeedback>;
}

function ActionPanel({ application, offers, signatureComplete, signatureSent, canHire, onHire }: { application: VacancyApplicationDto; offers: JobOfferDto[]; signatureComplete: boolean; signatureSent: boolean; canHire: boolean; onHire: () => void }) {
  const action = nextAction(application, offers, signatureComplete, signatureSent);
  const link = action === "Configurar oferta laboral" ? "#offer" : action === "Solicitar documentos" ? "#documents" : action === "Revisar documentos y firmas" ? "#documents" : action === "Iniciar onboarding" ? "/onboarding/documents" : `/ats/candidates/${application.id}`;
  const button = action === "Confirmar contratación" ? canHire ? <Button onClick={onHire}>Confirmar contratación<ArrowRight className="size-4" /></Button> : <InlineFeedback tone="warning" title="Acción restringida">Tu rol o los requisitos actuales no permiten confirmar esta contratación.</InlineFeedback> : <Button asChild><Link href={link}>{action}<ArrowRight className="size-4" /></Link></Button>;
  return <Card level={1} className="border-primary/30 bg-primary/[0.03]"><CardContent className="space-y-4 p-5"><div><p className="text-sm font-medium text-primary">Próxima acción recomendada</p><h2 className="mt-1 text-xl font-semibold">{action}</h2><p className="mt-1 text-sm text-text-secondary">El proceso continuará con el siguiente paso cuando se cumplan los requisitos obligatorios.</p></div><div className="grid gap-4 border-t border-border-default pt-4 sm:grid-cols-2"><div><p className="text-xs uppercase tracking-wide text-text-secondary">Responsable actual</p><div className="mt-2"><Responsible application={application} /></div></div><div><p className="text-xs uppercase tracking-wide text-text-secondary">Fecha límite</p><p className="mt-2 flex items-center gap-2 text-sm font-medium"><Clock3 className="size-4 text-text-secondary" />{dateLabel(application.stageDueAt)}</p></div></div><ActionBar>{button}<Button asChild variant="secondary"><Link href={`/ats/candidates/${application.id}`}>Ver perfil ATS</Link></Button></ActionBar></CardContent></Card>;
}

function SummaryCards({ application, offers, signatureStatus }: { application: VacancyApplicationDto; offers: JobOfferDto[]; signatureStatus?: { allSent: boolean; allCompleted: boolean } }) {
  const offer = offers[0];
  return <div className="grid gap-4 md:grid-cols-3"><Card level={2}><CardContent className="space-y-2 p-5"><p className="text-xs uppercase tracking-wide text-text-secondary">Oferta laboral</p><p className="font-semibold">{offer ? offer.status : "No preparada"}</p><p className="text-sm text-text-secondary">{offer ? `Versión ${offer.currentVersion}` : "La oferta se configurará en este caso."}</p></CardContent></Card><Card level={2}><CardContent className="space-y-2 p-5"><p className="text-xs uppercase tracking-wide text-text-secondary">Documentos y firmas</p><p className="font-semibold">{signatureStatus?.allCompleted ? "Completos" : signatureStatus?.allSent ? "Esperando firma" : "Pendientes"}</p><p className="text-sm text-text-secondary">{signatureStatus?.allCompleted ? "Listos para revisión final." : "Se validan antes de confirmar."}</p></CardContent></Card><Card level={2}><CardContent className="space-y-2 p-5"><p className="text-xs uppercase tracking-wide text-text-secondary">Resultado posterior</p><p className="font-semibold">{application.status === "HIRED" ? "Empleado creado" : "Aún no creado"}</p><p className="text-sm text-text-secondary">Onboarding se gestiona después de confirmar.</p></CardContent></Card></div>;
}

function Activity({ application, offers }: { application: VacancyApplicationDto; offers: JobOfferDto[] }) {
  const events = timeline(application, offers);
  return <Card level={2}><CardHeader><CardTitle className="flex items-center gap-2"><History className="size-5 text-primary" />Actividad reciente</CardTitle></CardHeader><CardContent>{events.length ? <ol className="space-y-4">{events.map((event, index) => <li key={`${event.id ?? event.type}-${index}`} className="flex gap-3"><span className="mt-1 size-2 shrink-0 rounded-full bg-primary" /><div><p className="text-sm font-medium">{event.note ?? event.type}</p><p className="text-xs text-text-secondary">{formatApplicationDate(event.at)}{event.actorDisplayName ? ` · ${event.actorDisplayName}` : ""}</p></div></li>)}</ol> : <InlineFeedback tone="info" title="Sin actividad registrada">Los cambios del caso aparecerán aquí.</InlineFeedback>}</CardContent></Card>;
}

export function HiringCasesPage() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState("ALL");
  const [filters, setFilters] = useState({ company: "", branch: "", jobTitle: "", status: "", offerStatus: "", responsible: "", updatedFrom: "" });
  const { can } = useAppStore();
  const applications = useQuery({ queryKey: ["hiring-cases", search], queryFn: () => fetchApplications({ search: search || undefined, page: 1, pageSize: 100 }), enabled: can("candidates.view") });
  const items = useMemo(() => (applications.data?.data ?? []).filter((item) => !["REJECTED", "WITHDRAWN"].includes(item.status)).filter((item) => {
    const company = item.vacancy.tenant?.name ?? "Empresa activa";
    const responsible = item.assignedRecruiter ? `${item.assignedRecruiter.firstName} ${item.assignedRecruiter.lastName}` : "Sin responsable";
    const matchesView = matchesHiringView(view, item);
    return matchesView && (!filters.company || company.toLocaleLowerCase().includes(filters.company.toLocaleLowerCase())) && (!filters.branch || (item.vacancy.branch?.name ?? "").toLocaleLowerCase().includes(filters.branch.toLocaleLowerCase())) && (!filters.jobTitle || item.vacancy.title.toLocaleLowerCase().includes(filters.jobTitle.toLocaleLowerCase())) && (!filters.status || item.status === filters.status) && (!filters.offerStatus || applicationOfferStatus(item) === filters.offerStatus) && (!filters.responsible || responsible.toLocaleLowerCase().includes(filters.responsible.toLocaleLowerCase())) && (!filters.updatedFrom || item.updatedAt.slice(0, 10) >= filters.updatedFrom);
  }), [applications.data, filters, view]);
  const card = (item: VacancyApplicationDto) => <div className="space-y-4"><div className="flex items-start gap-3"><div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-semibold text-primary">{initials(item.candidate.fullName)}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">{item.candidate.fullName}</p><p className="text-sm text-text-secondary">{item.vacancy.title}</p></div><Badge variant="secondary">{statusLabel(item, listOffers(item))}</Badge></div><p className="mt-2 text-sm text-text-secondary">{item.vacancy.branch?.name ?? "Sucursal no disponible"}</p></div></div><div className="grid gap-2 text-sm sm:grid-cols-2"><p><span className="font-medium">Próxima acción:</span> {listAction(item, listOffers(item))}</p><p><span className="font-medium">Documentos:</span> {documentState(item)}</p><p><span className="font-medium">Última actividad:</span> {formatApplicationDate(item.updatedAt)}</p></div><Button asChild className="w-full" variant="secondary"><Link href={`/hiring/${item.id}`}>Abrir contratación<ArrowRight className="size-4" /></Link></Button></div>;
  const field = (key: keyof typeof filters, label: string, placeholder: string) => <label className="space-y-1.5 text-sm font-medium"><span>{label}</span><Input value={filters[key]} placeholder={placeholder} onChange={(event) => setFilters((current) => ({ ...current, [key]: event.target.value }))} /></label>;
  return <div className="space-y-7"><PageHeader eyebrow="Personas" title="Contrataciones" description="Un centro guiado para llevar cada candidato aprobado hasta su contratación y entrega a onboarding." actions={<Button asChild variant="secondary"><Link href="/ats/candidates"><UserRound className="size-4" />Ver candidatos</Link></Button>} /><div className="flex gap-1 overflow-x-auto border-b border-border-default" role="tablist" aria-label="Vistas de contrataciones">{[["ALL", "Todas"], ["ATTENTION", "Requieren atención"], ["WAITING", "Esperando candidato"], ["READY", "Listas para confirmar"], ["COMPLETED", "Completadas"]].map(([key, label]) => <button type="button" role="tab" aria-selected={view === key} key={key} onClick={() => setView(key)} className={`min-h-11 whitespace-nowrap border-b-2 px-4 text-sm font-medium ${view === key ? "border-primary text-text-primary" : "border-transparent text-text-secondary"}`}>{label}</button>)}</div><Card level={2}><CardContent className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4"><label className="flex items-center gap-3 md:col-span-2 xl:col-span-4"><Search className="size-4 text-text-secondary" /><span className="sr-only">Buscar contrataciones</span><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar candidato, vacante o correo" /></label>{field("company", "Empresa", "Empresa activa")}{field("branch", "Sucursal", "Todas las sucursales")}{field("jobTitle", "Cargo", "Todos los cargos")}{field("responsible", "Responsable", "Cualquier responsable")}<label className="space-y-1.5 text-sm font-medium"><span>Estado de contratación</span><select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="h-10 w-full rounded-xl border border-border-default bg-surface-elevated px-3 text-sm"><option value="">Todos los estados</option><option value="APPROVED">Lista para preparar</option><option value="HIRED">Contratada</option><option value="TRAINING">En formación</option></select></label><label className="space-y-1.5 text-sm font-medium"><span>Estado de oferta</span><select value={filters.offerStatus} onChange={(event) => setFilters((current) => ({ ...current, offerStatus: event.target.value }))} className="h-10 w-full rounded-xl border border-border-default bg-surface-elevated px-3 text-sm"><option value="">Todas las ofertas</option><option value="SENT">Enviada</option><option value="COUNTERED">Contrapropuesta</option><option value="ACCEPTED">Aceptada</option><option value="REJECTED">Rechazada</option><option value="EXPIRED">Vencida</option></select></label><label className="space-y-1.5 text-sm font-medium"><span>Desde última actividad</span><Input type="date" value={filters.updatedFrom} onChange={(event) => setFilters((current) => ({ ...current, updatedFrom: event.target.value }))} /></label><Button variant="ghost" className="self-end" onClick={() => setFilters({ company: "", branch: "", jobTitle: "", status: "", offerStatus: "", responsible: "", updatedFrom: "" })}>Limpiar filtros</Button></CardContent></Card>{applications.isLoading ? <AsyncState state="loading" title="Cargando contrataciones" /> : null}{applications.isError ? <AsyncState state="error" title="No fue posible cargar contrataciones" onRetry={() => void applications.refetch()} /> : null}{applications.isSuccess && !items.length ? <InlineFeedback tone="info" title="No hay contrataciones en esta vista">Las postulaciones aprobadas o contratadas aparecerán aquí cuando estén disponibles.</InlineFeedback> : null}{applications.isSuccess && items.length ? <ResponsiveDataView data={items} getKey={(item) => item.id} mobile={card} desktop={<div className="overflow-x-auto rounded-2xl border border-border-default"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-surface-section text-xs uppercase tracking-wide text-text-secondary"><tr><th className="p-4">Candidato</th><th className="p-4">Vacante</th><th className="p-4">Estado</th><th className="p-4">Documentos</th><th className="p-4">Próxima acción</th><th className="p-4">Última actividad</th><th className="p-4">Acción</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-t border-border-default"><td className="p-4"><p className="font-medium">{item.candidate.fullName}</p><p className="text-xs text-text-secondary">{item.candidate.email}</p></td><td className="p-4">{item.vacancy.title}<p className="text-xs text-text-secondary">{item.vacancy.branch?.name ?? "Sucursal no disponible"}</p></td><td className="p-4"><Badge variant="secondary">{statusLabel(item, listOffers(item))}</Badge></td><td className="p-4 text-text-secondary">{documentState(item)}</td><td className="p-4">{listAction(item, listOffers(item))}</td><td className="p-4">{formatApplicationDate(item.updatedAt)}</td><td className="p-4"><Button asChild size="sm"><Link href={`/hiring/${item.id}`}>Abrir</Link></Button></td></tr>)}</tbody></table></div>} /> : null}</div>;
}

export function HiringCasePage({ applicationId }: { applicationId: string }) {
  const queryClient = useQueryClient();
  const { can } = useAppStore();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const application = useQuery({ queryKey: ["application", applicationId], queryFn: () => fetchApplication(applicationId), enabled: Boolean(applicationId) && can("candidates.view") });
  const offers = useQuery({ queryKey: ["job-offers", applicationId], queryFn: () => fetchJobOffers(applicationId), enabled: Boolean(application.data) });
  const signature = useQuery({ queryKey: ["docuseal-hiring-status", applicationId], queryFn: () => fetchDocuSealHiringBundleStatus(applicationId), enabled: application.data?.status === "HIRED", refetchInterval: (query) => query.state.data?.allCompleted ? false : 5000 });
  const context = useQuery({ queryKey: ["hiring-context", applicationId], queryFn: () => fetchHiringContext(applicationId), enabled: confirmOpen && application.data?.status === "APPROVED" && can("applications.hire") });
  const hire = useMutation({ mutationFn: () => { const item = application.data!; return hireCandidate({ applicationId: item.id, branchId: item.vacancy.branchId, employeeName: item.candidate.fullName, employeeEmail: item.candidate.email, jobTitle: item.vacancy.title, onboardingTemplateId: context.data?.onboardingTemplates.find((template) => template.isDefault)?.id ?? context.data?.onboardingTemplates[0]?.id, metadata: { source: "hiring-case" } }); }, onSuccess: async () => { setConfirmOpen(false); await queryClient.invalidateQueries({ queryKey: ["application", applicationId] }); await queryClient.invalidateQueries({ queryKey: ["hiring-cases"] }); } });
  if (application.isLoading) return <AsyncState state="loading" title="Cargando contratación" />;
  if (application.isError || !application.data) return <AsyncState state="error" title="No fue posible cargar la contratación" onRetry={() => void application.refetch()} />;
  const item = application.data;
  const offerItems = offers.data ?? [];
  const signatureStatus = signature.data;
  const signatureComplete = Boolean(signatureStatus?.allCompleted);
  const signatureSent = Boolean(signatureStatus?.allSent);
  return <div className="space-y-7"><PageHeader eyebrow="Personas · Contratación" title={item.candidate.fullName} description={`${item.vacancy.title} · ${item.vacancy.branch?.name ?? "Sucursal no disponible"}`} actions={<Button asChild variant="secondary"><Link href="/hiring"><ArrowLeft className="size-4" />Volver a contrataciones</Link></Button>} /><HiringHeader application={item} offers={offerItems} signatureComplete={signatureComplete} signatureSent={signatureSent} /><div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]"><div className="space-y-5"><ActionPanel application={item} offers={offerItems} signatureComplete={signatureComplete} signatureSent={signatureSent} canHire={can("applications.hire") && Boolean(context.data?.canHire ?? item.status === "APPROVED")} onHire={() => setConfirmOpen(true)} /><SummaryCards application={item} offers={offerItems} signatureStatus={signatureStatus} /><Card id="documents" level={2}><CardHeader><CardTitle className="flex items-center gap-2"><FileCheck2 className="size-5 text-primary" />Documentos y firmas</CardTitle></CardHeader><CardContent className="space-y-3">{item.status === "HIRED" ? <InlineFeedback tone={signatureComplete ? "success" : signatureSent ? "warning" : "info"} title={signatureComplete ? "Documentos y firmas completos" : signatureSent ? "Esperando firma" : "Documentos pendientes"}>{signatureComplete ? "Puedes revisar el expediente y continuar con onboarding." : "La contratación se formalizó; completa los requisitos documentales antes del ingreso."}</InlineFeedback> : <InlineFeedback tone="info" title="Se habilitará después de aceptar la oferta">La solicitud de documentos aparece cuando la oferta esté aceptada o la contratación sea confirmada.</InlineFeedback>}{signatureSent ? <p className="text-sm text-text-secondary">DocuSeal reporta {signatureStatus?.documents.length ?? 0} documentos en el paquete actual.</p> : null}</CardContent></Card><Card id="offer" level={2}><CardHeader><CardTitle className="flex items-center gap-2"><FileSignature className="size-5 text-primary" />Oferta laboral</CardTitle></CardHeader><CardContent>{offerItems.length ? <div className="space-y-3">{offerItems.slice(0, 1).map((offer) => <div key={offer.id} className="rounded-xl border border-border-default p-4"><div className="flex items-center justify-between gap-3"><p className="font-medium">{offer.versions.find((version) => version.version === offer.currentVersion)?.jobTitle ?? item.vacancy.title}</p><Badge variant="secondary">{offer.status}</Badge></div><p className="mt-2 text-sm text-text-secondary">Versión {offer.currentVersion} · {offer.acceptedAt ? `Aceptada ${formatApplicationDate(offer.acceptedAt)}` : "Sin aceptación registrada"}</p></div>)}</div> : <InlineFeedback tone="info" title="Oferta no preparada">La gestión detallada de la oferta continúa disponible desde el perfil ATS.</InlineFeedback>}<Button asChild className="mt-4" variant="secondary"><Link href={`/ats/candidates/${item.id}#job-offers`}>Gestionar oferta</Link></Button></CardContent></Card></div><aside className="space-y-5"><Blockers application={item} offers={offerItems} signatureComplete={signatureComplete} /><Card level={2}><CardHeader><CardTitle>Tareas pendientes</CardTitle></CardHeader><CardContent className="space-y-3"><Task done={item.status === "APPROVED" || item.status === "HIRED"} label="Decisión aprobada" /><Task done={Boolean(offerItems[0]?.status === "ACCEPTED" || item.status === "HIRED")} label="Oferta aceptada" /><Task done={signatureComplete} label="Documentos y firmas revisados" /><Task done={item.status === "HIRED"} label="Contratación confirmada" /></CardContent></Card><Card level={2}><CardHeader><CardTitle>Responsable y contexto</CardTitle></CardHeader><CardContent className="space-y-4"><Responsible application={item} /><dl className="grid gap-3 border-t border-border-default pt-4 text-sm"><div><dt className="text-text-secondary">Empresa</dt><dd className="font-medium">{item.vacancy.tenant?.name ?? "Empresa activa"}</dd></div><div><dt className="text-text-secondary">Sucursal</dt><dd className="font-medium">{item.vacancy.branch?.name ?? "No disponible"}</dd></div><div><dt className="text-text-secondary">Fecha límite</dt><dd className="font-medium">{dateLabel(item.stageDueAt)}</dd></div></dl></CardContent></Card><Activity application={item} offers={offerItems} /></aside></div>{confirmOpen ? <Card level={1} className="border-primary/40 bg-surface-elevated"><CardContent className="space-y-4 p-5"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 size-5 text-status-warning" /><div><h2 className="font-semibold">Confirmar contratación</h2><p className="mt-1 text-sm text-text-secondary">Esta acción creará o vinculará el empleado y preparará el expediente. Verifica que la oferta y los requisitos obligatorios estén completos.</p></div></div>{context.isLoading ? <InlineFeedback tone="info" title="Validando requisitos">Consultando permisos, sucursal y plantilla de onboarding.</InlineFeedback> : null}{context.isError ? <InlineFeedback tone="danger" title="No fue posible validar la contratación" /> : null}{hire.isError ? <InlineFeedback tone="danger" title="No fue posible confirmar la contratación">{hire.error instanceof Error ? hire.error.message : "El servidor rechazó la operación."}</InlineFeedback> : null}<ActionBar><Button variant="secondary" onClick={() => setConfirmOpen(false)}>Volver a revisar</Button><Button onClick={() => hire.mutate()} disabled={hire.isPending || context.isLoading || context.isError || !context.data?.canHire}>{hire.isPending ? "Confirmando…" : "Confirmar contratación"}</Button></ActionBar></CardContent></Card> : null}</div>;
}

function Task({ done, label }: { done: boolean; label: string }) { return <div className="flex items-center gap-3 text-sm"><span className={`flex size-6 items-center justify-center rounded-full ${done ? "bg-status-success/10 text-status-success" : "border border-border-default text-text-secondary"}`}>{done ? <Check className="size-4" /> : ""}</span><span className={done ? "text-text-secondary line-through" : "font-medium"}>{label}</span></div>; }
