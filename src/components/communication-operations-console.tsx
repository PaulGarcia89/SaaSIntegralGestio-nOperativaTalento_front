"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, ArrowLeft, Clock3, Inbox, MailCheck, MailPlus, Paperclip, RefreshCw, Reply, Search, Send, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import {
  composeCandidateEmail,
  configureCommunicationDomain,
  fetchApplications,
  fetchAtsAttachmentAccess,
  fetchAtsConversation,
  fetchAtsConversations,
  fetchCommunicationDomain,
  fetchUnmatchedInbound,
  fetchUsers,
  ignoreUnmatchedInbound,
  linkUnmatchedInbound,
  markAtsConversationRead,
  replyCandidateEmail,
  retryAtsCommunication,
  updateAtsConversation,
  verifyCommunicationDomain,
} from "@/lib/backend";
import type { AtsConversationDto, AtsConversationStatus, AtsMessageDto, AtsUnmatchedInboundDto, VacancyApplicationDto } from "@/lib/contracts";
import { AsyncState } from "@/components/async-state";
import { InlineFeedback, Pagination } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ALL = "ALL";

export function CommunicationOperationsConsole() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AtsConversationStatus | typeof ALL>(ALL);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [archived, setArchived] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [unmatchedOpen, setUnmatchedOpen] = useState(false);
  const [domainOpen, setDomainOpen] = useState(false);

  const filters = { page, pageSize: 25, search: search || undefined, status: status === ALL ? undefined : status, unreadOnly: unreadOnly || undefined, assignedToMe: assignedToMe || undefined, archived: archived || undefined };
  const conversations = useQuery({ queryKey: ["ats-conversations", filters], queryFn: () => fetchAtsConversations(filters) });
  const selected = useQuery({ queryKey: ["ats-conversation", selectedId], queryFn: () => fetchAtsConversation(selectedId!), enabled: Boolean(selectedId) });
  const users = useQuery({ queryKey: ["users", "communication-assignees"], queryFn: fetchUsers });

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["ats-conversations"] }),
      queryClient.invalidateQueries({ queryKey: ["ats-conversation"] }),
      queryClient.invalidateQueries({ queryKey: ["ats-unmatched"] }),
    ]);
  }

  useEffect(() => {
    if (!selectedId || !selected.data?.unreadCount) return;
    void markAtsConversationRead(selectedId).then(async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ats-conversations"] }),
        queryClient.invalidateQueries({ queryKey: ["ats-conversation", selectedId] }),
      ]);
    }).catch(() => undefined);
  }, [queryClient, selectedId, selected.data?.unreadCount]);

  const summary = conversations.data?.summary;
  return <section className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-3">
      <SummaryCard label="Conversaciones abiertas" value={summary?.openConversations} icon={<Inbox className="size-5" />} />
      <SummaryCard label="Sin leer" value={summary?.unreadConversations} icon={<MailCheck className="size-5" />} tone="primary" />
      <button type="button" onClick={() => setUnmatchedOpen(true)} className="text-left"><SummaryCard label="Sin asociar" value={summary?.unmatched} icon={<Search className="size-5" />} tone={summary?.unmatched ? "warning" : undefined} /></button>
    </div>

    <Card level={1}><CardContent className="p-0"><div className="grid min-h-[680px] lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside className={`${selectedId ? "hidden lg:flex" : "flex"} flex-col border-r border-border-default`}>
        <div className="space-y-3 border-b border-border-default p-4">
          <div className="flex gap-2"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} className="pl-9" placeholder="Candidato, vacante o mensaje" /></div><Button size="icon" aria-label="Nuevo correo" onClick={() => setComposeOpen(true)}><MailPlus className="size-4" /></Button></div>
          <div className="grid grid-cols-2 gap-2"><Select value={status} onValueChange={(value) => { setStatus(value as AtsConversationStatus | typeof ALL); setPage(1); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Todos los estados</SelectItem><SelectItem value="OPEN">Abiertas</SelectItem><SelectItem value="PENDING">Pendientes</SelectItem><SelectItem value="CLOSED">Cerradas</SelectItem></SelectContent></Select><Button variant={assignedToMe ? "default" : "secondary"} onClick={() => setAssignedToMe((value) => !value)}><UserRound className="size-4" />Mías</Button></div>
          <div className="flex gap-2"><Button size="sm" variant={unreadOnly ? "default" : "ghost"} onClick={() => setUnreadOnly((value) => !value)}>Sin leer</Button><Button size="sm" variant={archived ? "default" : "ghost"} onClick={() => setArchived((value) => !value)}><Archive className="size-4" />Archivadas</Button><Button size="sm" variant="ghost" onClick={() => setDomainOpen(true)}>Dominio</Button></div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.isLoading ? <AsyncState state="loading" title="Cargando conversaciones" /> : null}
          {conversations.isError ? <AsyncState state="error" title="No fue posible cargar la bandeja" onRetry={() => void conversations.refetch()} /> : null}
          {conversations.data?.data.map((conversation) => <ConversationRow key={conversation.id} conversation={conversation} selected={selectedId === conversation.id} onClick={() => setSelectedId(conversation.id)} />)}
          {conversations.isSuccess && !conversations.data.data.length ? <div className="p-5"><InlineFeedback tone="info" title="Bandeja vacía">No hay conversaciones para estos filtros.</InlineFeedback></div> : null}
        </div>
        {conversations.data?.meta.totalPages ? <div className="border-t p-3"><Pagination page={conversations.data.meta.page - 1} totalPages={conversations.data.meta.totalPages} totalItems={conversations.data.meta.total} pageSize={conversations.data.meta.pageSize} onPageChange={(next) => setPage(next + 1)} /></div> : null}
      </aside>
      <main className={`${selectedId ? "flex" : "hidden lg:flex"} min-w-0 flex-col bg-surface-section/40`}>
        {!selectedId ? <EmptyThread onCompose={() => setComposeOpen(true)} /> : selected.isLoading ? <AsyncState state="loading" title="Abriendo conversación" /> : selected.isError ? <AsyncState state="error" title="No fue posible abrir la conversación" onRetry={() => void selected.refetch()} /> : selected.data ? <ThreadPanel conversation={selected.data} users={users.data ?? []} onBack={() => setSelectedId(null)} onRefresh={refresh} /> : null}
      </main>
    </div></CardContent></Card>
    <ComposeDialog open={composeOpen} onOpenChange={setComposeOpen} onSent={async (conversationId) => { setComposeOpen(false); await refresh(); if (conversationId) setSelectedId(conversationId); }} />
    <UnmatchedDialog open={unmatchedOpen} onOpenChange={setUnmatchedOpen} onResolved={refresh} />
    <DomainDialog open={domainOpen} onOpenChange={setDomainOpen} />
  </section>;
}

function ConversationRow({ conversation, selected, onClick }: { conversation: AtsConversationDto; selected: boolean; onClick: () => void }) {
  const latest = conversation.messages[0];
  return <button type="button" onClick={onClick} className={`w-full border-b border-border-default p-4 text-left transition ${selected ? "bg-primary/10" : "hover:bg-surface-section"}`}><div className="flex items-start gap-3"><span className={`mt-1 size-2.5 shrink-0 rounded-full ${conversation.unreadCount ? "bg-primary" : "bg-border-default"}`} /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className={`truncate ${conversation.unreadCount ? "font-bold" : "font-semibold"}`}>{conversation.application.candidate.fullName}</p><time className="shrink-0 text-[11px] text-text-secondary">{relativeTime(conversation.lastMessageAt)}</time></div><p className="truncate text-xs text-text-secondary">{conversation.application.vacancy.title}</p><p className="mt-2 truncate text-sm">{latest?.direction === "INBOUND" ? "Candidato: " : "Equipo: "}{latest?.body ?? "Sin contenido"}</p><div className="mt-2 flex items-center gap-2"><StatusBadge status={conversation.status} />{conversation.unreadCount ? <Badge>{conversation.unreadCount} nuevo{conversation.unreadCount === 1 ? "" : "s"}</Badge> : null}</div></div></div></button>;
}

function ThreadPanel({ conversation, users, onBack, onRefresh }: { conversation: AtsConversationDto; users: Awaited<ReturnType<typeof fetchUsers>>; onBack: () => void; onRefresh: () => Promise<void> }) {
  const [body, setBody] = useState("");
  const latest = conversation.messages.at(-1);
  const update = useMutation({ mutationFn: (input: { status?: AtsConversationStatus; assignedUserId?: string | null; snoozedUntil?: string | null; archived?: boolean }) => updateAtsConversation(conversation.id, input), onSuccess: onRefresh, onError: showError });
  const reply = useMutation({ mutationFn: () => replyCandidateEmail(latest!.id, { subject: replySubject(latest?.subject ?? conversation.application.vacancy.title), body }), onSuccess: async () => { setBody(""); toast.success("Correo agregado a la cola de envío"); await onRefresh(); }, onError: showError });
  const retry = useMutation({ mutationFn: retryAtsCommunication, onSuccess: async () => { toast.success("Correo reenviado a la cola"); await onRefresh(); }, onError: showError });
  const attachment = useMutation({ mutationFn: fetchAtsAttachmentAccess, onSuccess: (result) => window.open(result.url, "_blank", "noopener,noreferrer"), onError: showError });
  const assignee = users.find((user) => user.id === conversation.assignedUserId);
  return <><header className="border-b border-border-default bg-surface-elevated p-4"><div className="flex items-start gap-3"><Button size="icon" variant="ghost" className="lg:hidden" onClick={onBack}><ArrowLeft className="size-4" /></Button><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold">{conversation.application.candidate.fullName}</h2><StatusBadge status={conversation.status} /></div><p className="text-sm text-text-secondary">{conversation.application.candidate.email} · {conversation.application.vacancy.title}</p><div className="mt-2 flex flex-wrap gap-2"><Link className="text-xs font-medium text-brand hover:underline" href={`/ats/candidates/${conversation.application.id}`}>Abrir expediente</Link><span className="text-xs text-text-secondary">{conversation.application.vacancy.branch?.name}</span></div></div><Button size="icon" variant="ghost" aria-label="Archivar conversación" onClick={() => update.mutate({ archived: true })}><Archive className="size-4" /></Button></div><div className="mt-4 grid gap-2 sm:grid-cols-3"><Select value={conversation.status} onValueChange={(value) => update.mutate({ status: value as AtsConversationStatus })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="OPEN">Abierta</SelectItem><SelectItem value="PENDING">Pendiente</SelectItem><SelectItem value="CLOSED">Cerrada</SelectItem></SelectContent></Select><Select value={conversation.assignedUserId ?? "unassigned"} onValueChange={(value) => update.mutate({ assignedUserId: value === "unassigned" ? null : value })}><SelectTrigger><SelectValue placeholder="Sin responsable" /></SelectTrigger><SelectContent><SelectItem value="unassigned">Sin responsable</SelectItem>{users.map((user) => <SelectItem key={user.id} value={user.id}>{user.fullName}</SelectItem>)}</SelectContent></Select><Button variant="secondary" onClick={() => update.mutate({ snoozedUntil: new Date(Date.now() + 24 * 60 * 60_000).toISOString() })}><Clock3 className="size-4" />Posponer 24 h</Button></div>{assignee ? <p className="mt-2 text-xs text-text-secondary">Responsable: {assignee.fullName}</p> : null}</header>
    <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">{conversation.messages.map((message) => <MessageBubble key={message.id} message={message} onAttachment={(id) => attachment.mutate(id)} onRetry={(id) => retry.mutate(id)} retrying={retry.isPending} />)}</div>
    <footer className="border-t border-border-default bg-surface-elevated p-4"><label className="sr-only" htmlFor="email-reply">Respuesta</label><textarea id="email-reply" className="min-h-28 w-full resize-y rounded-xl border border-border-default bg-surface-elevated p-3 text-base sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus" value={body} onChange={(event) => setBody(event.target.value)} placeholder="Escribe una respuesta al candidato…" /><div className="mt-3 flex items-center justify-between gap-3"><p className="text-xs text-text-secondary">Se enviará únicamente por correo y quedará auditado.</p><Button onClick={() => reply.mutate()} disabled={!latest || body.trim().length < 2 || reply.isPending}><Send className="size-4" />{reply.isPending ? "Enviando…" : "Enviar respuesta"}</Button></div></footer></>;
}

function MessageBubble({ message, onAttachment, onRetry, retrying }: { message: AtsMessageDto; onAttachment: (id: string) => void; onRetry: (id: string) => void; retrying: boolean }) {
  const inbound = message.direction === "INBOUND";
  const emailDelivery = message.notification?.deliveries.find((item) => item.channel === "EMAIL");
  const deliveryStatus = emailDelivery?.status ?? message.status;
  const canRetry = !inbound && deliveryStatus !== "DELIVERED";
  return <article className={`flex ${inbound ? "justify-start" : "justify-end"}`}><div className={`max-w-[86%] rounded-2xl p-4 shadow-sm ${inbound ? "rounded-tl-sm border border-border-default bg-surface-elevated" : "rounded-tr-sm bg-primary text-primary-foreground"}`}><div className="flex flex-wrap items-center gap-2 text-xs opacity-75"><span>{inbound ? message.senderEmail : "Equipo de selección"}</span><span>·</span><time>{new Date(message.createdAt).toLocaleString()}</time></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.body}</p>{message.attachments?.length ? <div className="mt-3 flex flex-wrap gap-2">{message.attachments.map((item) => <button key={item.id} type="button" onClick={() => onAttachment(item.id)} className="inline-flex items-center gap-2 rounded-lg border border-current/20 px-2.5 py-1.5 text-xs"><Paperclip className="size-3.5" />{item.filename}</button>)}</div> : null}{!inbound ? <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] opacity-75"><span>{deliveryLabel(deliveryStatus)}</span>{emailDelivery?.openedAt ? <span>Abierto</span> : null}{emailDelivery?.clickedAt ? <span>Enlace abierto</span> : null}{emailDelivery?.bouncedAt ? <span>Rebotado</span> : null}</div> : null}{canRetry ? <div className="mt-3 border-t border-current/20 pt-3"><Button size="sm" variant="secondary" onClick={() => onRetry(message.id)} disabled={retrying}><RefreshCw className="size-3.5" />{retrying ? "Reenviando..." : "Reenviar"}</Button>{emailDelivery?.lastError ? <p className="mt-2 text-[11px] opacity-75">{emailDelivery.lastError}</p> : null}</div> : null}</div></article>;
}

function ComposeDialog({ open, onOpenChange, onSent }: { open: boolean; onOpenChange: (open: boolean) => void; onSent: (conversationId?: string) => Promise<void> }) {
  const [search, setSearch] = useState(""); const [application, setApplication] = useState<VacancyApplicationDto | null>(null); const [subject, setSubject] = useState(""); const [body, setBody] = useState("");
  const applications = useQuery({ queryKey: ["applications", "compose-email", search], queryFn: () => fetchApplications({ search, page: 1, pageSize: 10 }), enabled: open && search.trim().length >= 2 });
  const send = useMutation({ mutationFn: () => composeCandidateEmail(application!.id, { subject, body }), onSuccess: async () => { setApplication(null); setSearch(""); setSubject(""); setBody(""); toast.success("Correo agregado a la cola de envío"); await onSent(); }, onError: showError });
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Nuevo correo al candidato</DialogTitle><DialogDescription>Selecciona un expediente para conservar tenant, sucursal y trazabilidad correctos.</DialogDescription></DialogHeader><div className="space-y-4">{!application ? <><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Busca por nombre o correo" /><div className="max-h-52 space-y-2 overflow-y-auto">{applications.data?.data.map((item) => <button type="button" key={item.id} onClick={() => setApplication(item)} className="flex w-full items-center justify-between rounded-xl border border-border-default p-3 text-left hover:bg-surface-section"><div><p className="font-medium">{item.candidate.fullName}</p><p className="text-xs text-text-secondary">{item.candidate.email} · {item.vacancy.title}</p></div><Reply className="size-4" /></button>)}</div></> : <div className="flex items-center justify-between rounded-xl bg-surface-section p-3"><div><p className="font-medium">{application.candidate.fullName}</p><p className="text-xs text-text-secondary">{application.candidate.email} · {application.vacancy.title}</p></div><Button size="icon" variant="ghost" onClick={() => setApplication(null)}><X className="size-4" /></Button></div>}<Input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={240} placeholder="Asunto" /><textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={12000} rows={8} className="w-full rounded-xl border border-border-default bg-surface-elevated p-3 text-sm" placeholder="Mensaje" /><Button className="w-full" disabled={!application || subject.trim().length < 2 || body.trim().length < 2 || send.isPending} onClick={() => send.mutate()}><Send className="size-4" />Enviar correo</Button></div></DialogContent></Dialog>;
}

function UnmatchedDialog({ open, onOpenChange, onResolved }: { open: boolean; onOpenChange: (open: boolean) => void; onResolved: () => Promise<void> }) {
  const unmatched = useQuery({ queryKey: ["ats-unmatched"], queryFn: () => fetchUnmatchedInbound(), enabled: open });
  const [selected, setSelected] = useState<AtsUnmatchedInboundDto | null>(null); const [search, setSearch] = useState(""); const [reason, setReason] = useState("");
  const applications = useQuery({ queryKey: ["applications", "match-inbound", search], queryFn: () => fetchApplications({ search, page: 1, pageSize: 10 }), enabled: Boolean(selected) && search.trim().length >= 2 });
  const link = useMutation({ mutationFn: (applicationId: string) => linkUnmatchedInbound(selected!.id, applicationId), onSuccess: async () => { setSelected(null); setSearch(""); toast.success("Correo vinculado al expediente"); await onResolved(); }, onError: showError });
  const ignore = useMutation({ mutationFn: () => ignoreUnmatchedInbound(selected!.id, reason), onSuccess: async () => { setSelected(null); setReason(""); await onResolved(); }, onError: showError });
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>Correos sin asociar</DialogTitle><DialogDescription>Ningún correo se pierde. Vincúlalo a una postulación o documenta por qué debe ignorarse.</DialogDescription></DialogHeader>{unmatched.isLoading ? <AsyncState state="loading" title="Cargando correos" /> : null}{!selected ? <div className="space-y-3">{unmatched.data?.data.map((item) => <button key={item.id} type="button" onClick={() => { setSelected(item); setSearch(item.senderEmail); }} className="w-full rounded-xl border border-border-default p-4 text-left hover:bg-surface-section"><div className="flex justify-between gap-2"><p className="font-semibold">{item.subject}</p><time className="text-xs text-text-secondary">{new Date(item.occurredAt).toLocaleString()}</time></div><p className="text-xs text-text-secondary">{item.senderEmail} → {item.recipientEmail}</p><p className="mt-2 line-clamp-2 text-sm">{item.body}</p></button>)}{unmatched.isSuccess && !unmatched.data.data.length ? <InlineFeedback tone="success" title="Todo asociado">No hay correos pendientes de clasificación.</InlineFeedback> : null}</div> : <div className="space-y-4"><Button variant="ghost" onClick={() => setSelected(null)}><ArrowLeft className="size-4" />Volver</Button><div className="rounded-xl bg-surface-section p-4"><p className="font-semibold">{selected.subject}</p><p className="text-xs text-text-secondary">{selected.senderEmail}</p><p className="mt-3 whitespace-pre-wrap text-sm">{selected.body}</p></div><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar candidato o vacante" /><div className="max-h-48 space-y-2 overflow-y-auto">{applications.data?.data.map((item) => <button key={item.id} type="button" onClick={() => link.mutate(item.id)} className="w-full rounded-xl border p-3 text-left"><p className="font-medium">{item.candidate.fullName}</p><p className="text-xs text-text-secondary">{item.candidate.email} · {item.vacancy.title}</p></button>)}</div><div className="border-t pt-4"><Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Motivo para ignorar este correo" /><Button className="mt-2" variant="destructive" disabled={reason.trim().length < 3 || ignore.isPending} onClick={() => ignore.mutate()}>Ignorar con motivo</Button></div></div>}</DialogContent></Dialog>;
}

function DomainDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient(); const domain = useQuery({ queryKey: ["communication-domain"], queryFn: fetchCommunicationDomain, enabled: open });
  const [override, setOverride] = useState<{ domain: string; fromName: string; fromEmail: string; replyToEmail: string; dkimSelector: string } | null>(null);
  const form = override ?? (domain.data ? { domain: domain.data.domain, fromName: domain.data.fromName, fromEmail: domain.data.fromEmail, replyToEmail: domain.data.replyToEmail ?? "", dkimSelector: domain.data.dkimSelector } : { domain: "", fromName: "Talentos", fromEmail: "", replyToEmail: "", dkimSelector: "resend" });
  const save = useMutation({ mutationFn: () => configureCommunicationDomain({ ...form, replyToEmail: form.replyToEmail || undefined }), onSuccess: async () => { setOverride(null); toast.success("Dominio guardado"); await queryClient.invalidateQueries({ queryKey: ["communication-domain"] }); }, onError: showError });
  const verify = useMutation({ mutationFn: verifyCommunicationDomain, onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["communication-domain"] }), onError: showError });
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Dominio y entregabilidad</DialogTitle><DialogDescription>Configura envío y recepción con SPF, DKIM, DMARC y MX en Resend.</DialogDescription></DialogHeader><div className="grid gap-3 sm:grid-cols-2"><Input placeholder="dominio.com" value={form.domain} onChange={(event) => setOverride({ ...form, domain: event.target.value })} /><Input placeholder="Nombre remitente" value={form.fromName} onChange={(event) => setOverride({ ...form, fromName: event.target.value })} /><Input type="email" placeholder="talento@dominio.com" value={form.fromEmail} onChange={(event) => setOverride({ ...form, fromEmail: event.target.value })} /><Input type="email" placeholder="respuestas@dominio.com" value={form.replyToEmail} onChange={(event) => setOverride({ ...form, replyToEmail: event.target.value })} /></div><div className="flex gap-2"><Button onClick={() => save.mutate()} disabled={!form.domain || !form.fromEmail || save.isPending}>Guardar</Button><Button variant="secondary" onClick={() => verify.mutate()} disabled={!domain.data || verify.isPending}><RefreshCw className="size-4" />Verificar DNS</Button></div>{domain.data ? <div className="flex flex-wrap gap-2"><Badge variant={domain.data.spfVerified ? "default" : "secondary"}>SPF</Badge><Badge variant={domain.data.dkimVerified ? "default" : "secondary"}>DKIM</Badge><Badge variant={domain.data.dmarcVerified ? "default" : "secondary"}>DMARC</Badge></div> : null}</DialogContent></Dialog>;
}

function EmptyThread({ onCompose }: { onCompose: () => void }) { return <div className="m-auto max-w-sm p-8 text-center"><span className="mx-auto grid size-16 place-items-center rounded-3xl bg-primary/10 text-brand"><Inbox className="size-7" /></span><h2 className="mt-5 text-xl font-semibold">Selecciona una conversación</h2><p className="mt-2 text-sm text-text-secondary">Consulta todo el historial, responde y coordina el siguiente paso desde un solo lugar.</p><Button className="mt-5" onClick={onCompose}><MailPlus className="size-4" />Nuevo correo</Button></div>; }
function SummaryCard({ label, value, icon, tone }: { label: string; value?: number; icon: React.ReactNode; tone?: "primary" | "warning" }) { return <Card level={2}><CardContent className="flex items-center gap-4 p-4"><span className={`grid size-10 place-items-center rounded-2xl ${tone === "warning" ? "bg-status-warning/10 text-status-warning" : tone === "primary" ? "bg-primary/10 text-brand" : "bg-surface-section"}`}>{icon}</span><div><p className="text-sm text-text-secondary">{label}</p><p className="text-2xl font-semibold">{value ?? "—"}</p></div></CardContent></Card>; }
function StatusBadge({ status }: { status: AtsConversationStatus }) { return <Badge variant={status === "OPEN" ? "default" : status === "PENDING" ? "secondary" : "outline"}>{status === "OPEN" ? "Abierta" : status === "PENDING" ? "Pendiente" : "Cerrada"}</Badge>; }
function replySubject(subject: string) { return /^re:/i.test(subject.trim()) ? subject.trim() : `Re: ${subject.trim()}`; }
function relativeTime(value: string) { const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60_000)); return minutes < 1 ? "Ahora" : minutes < 60 ? `${minutes} min` : minutes < 1440 ? `${Math.floor(minutes / 60)} h` : `${Math.floor(minutes / 1440)} d`; }
function deliveryLabel(status: AtsMessageDto["status"]) { return ({ PENDING: "Pendiente", PROCESSING: "Enviando", DELIVERED: "Entregado", FAILED: "Falló", DEAD_LETTER: "Requiere atención", CANCELLED: "Cancelado", SKIPPED: "Omitido" } as const)[status]; }
function showError(error: unknown) { toast.error(error instanceof Error ? error.message : "No fue posible completar la operación"); }
