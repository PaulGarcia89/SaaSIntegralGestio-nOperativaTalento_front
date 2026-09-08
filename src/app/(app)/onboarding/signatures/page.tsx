"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, CalendarDays, CircleCheck, CircleX, Clipboard, Clock3, FileSignature, Plus, Send } from "lucide-react";
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
import type { ElectronicSignaturePackageDto, ElectronicSignatureParticipantDto } from "@/lib/contracts";
import { findSignaturePackageFlowPrefill } from "@/lib/signature-prefill";
import { useAppStore } from "@/store/app-store";
import { AsyncState } from "@/components/async-state";
import { InlineFeedback } from "@/components/design-system";
import { EmptyState, PageHeader, ProgressMeter, StatusBadge, StatusTile, StatusTileRow, type Tone } from "@/components/system";
import { useLocale } from "@/components/locale-provider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SigningLink = { participantId: string; email: string; url: string };
type PackageFilter = "OPEN" | "COMPLETED" | "ALL";

/**
 * Firma electrónica.
 *
 * La pantalla responde en este orden: cuántos paquetes esperan firma, cuál es
 * el siguiente que necesita algo, y —por paquete— quién firmó y quién falta.
 *
 * Antes abría con tres tarjetas de métrica (una decía «Proveedor activo:
 * Interno», que no ayuda a nadie a decidir nada), un aviso explicando qué es
 * un checksum y tarjetas con el estado técnico en inglés (`PARTIALLY_SIGNED`).
 * Ahora cada paquete es una tarjeta con una barra «2 de 3 firmas», los
 * firmantes con icono y palabra, y un solo botón: enviar o recordar. El
 * proveedor, la fecha exacta y el último evento de auditoría siguen ahí,
 * plegados en «Más».
 */
export default function ElectronicSignaturesPage() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { currentBranch, can } = useAppStore();
  const requestedFlowId = searchParams.get("flowId") ?? "";
  const shouldCreatePackage = searchParams.get("action") === "create";
  const [templateOpen, setTemplateOpen] = useState(false);
  const [packageOpen, setPackageOpen] = useState(false);
  const [automaticPackageDismissed, setAutomaticPackageDismissed] = useState(false);
  const [links, setLinks] = useState<SigningLink[]>([]);
  const [filter, setFilter] = useState<PackageFilter>("OPEN");
  // «Hoy» se fija al abrir la pantalla: así el vencido no cambia entre renders.
  const [now] = useState(() => Date.now());
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

  const all = useMemo(() => packages.data ?? [], [packages.data]);
  const open = useMemo(() => all.filter((item) => item.status !== "COMPLETED" && item.status !== "CANCELLED"), [all]);
  const completed = useMemo(() => all.filter((item) => item.status === "COMPLETED"), [all]);
  const visible = filter === "OPEN" ? open : filter === "COMPLETED" ? completed : all;

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
  const createPackage = useMutation({ mutationFn: () => createSignaturePackage({ onboardingFlowId: effectivePackageForm.onboardingFlowId, templateId: effectivePackageForm.templateId, dueDate: effectivePackageForm.dueDate ? new Date(effectivePackageForm.dueDate).toISOString() : undefined, participants: [{ fullName: effectivePackageForm.fullName, email: effectivePackageForm.email, roleLabel: t("signatures.employeeRole") }] }), onSuccess: async () => { await refresh(); setPackageOpen(false); setAutomaticPackageDismissed(true); } });

  function chooseFlow(flowId: string) {
    const flow = flows.data?.items.find((item) => item.id === flowId);
    setPackageForm((current) => ({ ...current, onboardingFlowId: flowId, fullName: flow?.employee.name ?? "", email: flow?.employee.email ?? "" }));
  }

  const canManage = can("onboarding.manage");
  const activeProvider = providers.data?.find((provider) => provider.configured)?.name;

  return <div className="space-y-7">
    <PageHeader
      eyebrow={t("signatures.eyebrow")}
      title={t("signatures.title")}
      description={t("signatures.description")}
      meta={activeProvider ? `${t("signatures.provider")}: ${activeProvider}` : undefined}
      actions={canManage ? <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => setTemplateOpen(true)}><Plus className="size-4" />{t("signatures.newTemplate")}</Button><Button onClick={() => setPackageOpen(true)}><FileSignature className="size-4" />{t("signatures.newPackage")}</Button></div> : undefined}
    />
    {requestedFlow ? <InlineFeedback tone="success" title={t("signatures.preselectedTitle")}>{t("signatures.preselectedBody", { employee: requestedFlow.employee.name, branch: requestedFlow.branch.name })}</InlineFeedback> : null}
    {invalidRequestedFlow ? <InlineFeedback tone="warning" title={t("signatures.invalidFlowTitle")}>{t("signatures.invalidFlowBody")}</InlineFeedback> : null}

    <StatusTileRow label={t("signatures.summaryAria")} className="sm:grid-cols-2 xl:grid-cols-2">
      <StatusTile
        title={t("signatures.awaiting")}
        value={packages.isSuccess ? open.length : packages.isError ? null : undefined}
        context={t("signatures.awaitingContext")}
        status={packages.isSuccess ? { label: open.length ? t("signatures.needsFollowUp") : t("signatures.allSigned"), tone: open.length ? "progress" : "success" } : undefined}
        onAction={() => setFilter("OPEN")}
        actionLabel={t("signatures.show")}
        icon={<Clock3 className="size-5" aria-hidden="true" />}
      />
      <StatusTile
        title={t("signatures.completed")}
        value={packages.isSuccess ? completed.length : packages.isError ? null : undefined}
        context={t("signatures.completedContext")}
        onAction={() => setFilter("COMPLETED")}
        actionLabel={t("signatures.show")}
        icon={<CircleCheck className="size-5" aria-hidden="true" />}
      />
    </StatusTileRow>

    {packages.isLoading ? <AsyncState state="loading" title={t("signatures.loading")} /> : null}
    {packages.isError ? <AsyncState state="error" title={t("signatures.loadError")} onRetry={() => void packages.refetch()} /> : null}
    {packages.isSuccess ? (
      <section aria-labelledby="signature-list-title" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="signature-list-title" className="text-lg font-semibold text-ink-1">
            {filter === "OPEN" ? t("signatures.awaiting") : filter === "COMPLETED" ? t("signatures.completed") : t("signatures.all")}
            <span className="ml-2 font-mono text-base font-normal tabular-nums text-ink-3">{visible.length}</span>
          </h2>
          <div role="group" aria-label={t("signatures.filterAria")} className="flex gap-1 rounded-full border border-line bg-surface-2 p-1">
            {(["OPEN", "COMPLETED", "ALL"] as PackageFilter[]).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={filter === option}
                onClick={() => setFilter(option)}
                className={cn(
                  "min-h-[var(--control-h-base)] rounded-full px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                  filter === option ? "bg-action text-on-action shadow-e1" : "text-ink-2 hover:text-ink-1",
                )}
              >
                {option === "OPEN" ? t("signatures.awaitingShort") : option === "COMPLETED" ? t("signatures.completed") : t("signatures.all")}
              </button>
            ))}
          </div>
        </div>
        {!all.length ? (
          <EmptyState
            reason="no-records"
            title={t("signatures.emptyTitle")}
            description={canManage ? t("signatures.emptyHelp") : undefined}
            action={canManage ? <Button onClick={() => setPackageOpen(true)}><FileSignature className="size-4" />{t("signatures.newPackage")}</Button> : undefined}
          />
        ) : !visible.length ? (
          <EmptyState reason="no-matches" onClearFilters={() => setFilter("ALL")} />
        ) : (
          <ul aria-label={t("signatures.listAria")} className="grid gap-4 xl:grid-cols-2 [&>li]:min-w-0">
            {visible.map((item) => <PackageCard key={item.id} item={item} now={now} canManage={canManage} sending={sendPackage.isPending || remind.isPending} onSend={() => sendPackage.mutate(item.id)} onRemind={() => remind.mutate(item.id)} />)}
          </ul>
        )}
      </section>
    ) : null}

    <Dialog open={templateOpen} onOpenChange={setTemplateOpen}><DialogContent><DialogHeader><DialogTitle>{t("signatures.templateDialogTitle")}</DialogTitle><DialogDescription>{t("signatures.templateDialogBody")}</DialogDescription></DialogHeader><div className="space-y-4"><Field label={t("signatures.field.name")} value={templateForm.name} onChange={(value) => setTemplateForm({ ...templateForm, name: value })} /><Field label={t("signatures.field.documentTitle")} value={templateForm.title} onChange={(value) => setTemplateForm({ ...templateForm, title: value })} /><TextField label={t("signatures.field.content")} value={templateForm.content} onChange={(value) => setTemplateForm({ ...templateForm, content: value })} /><TextField label={t("signatures.field.consentText")} value={templateForm.consentText} onChange={(value) => setTemplateForm({ ...templateForm, consentText: value })} /><div className="space-y-2"><Label>{t("signatures.field.provider")}</Label><Select value={templateForm.provider} onValueChange={(provider) => setTemplateForm({ ...templateForm, provider })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{providers.data?.map((provider) => <SelectItem key={provider.code} value={provider.code} disabled={!provider.configured}>{provider.name}{provider.configured ? "" : ` · ${t("signatures.providerNotConfigured")}`}</SelectItem>)}</SelectContent></Select></div><Button className="w-full" onClick={() => createTemplate.mutate()} disabled={!templateForm.name || !templateForm.content || createTemplate.isPending}>{createTemplate.isPending ? t("signatures.creating") : t("signatures.createTemplate")}</Button></div></DialogContent></Dialog>
    <Dialog open={packageDialogOpen} onOpenChange={(open) => { setPackageOpen(open); if (!open) setAutomaticPackageDismissed(true); }}><DialogContent><DialogHeader><DialogTitle>{t("signatures.packageDialogTitle")}</DialogTitle><DialogDescription>{t("signatures.packageDialogBody")}</DialogDescription></DialogHeader><div className="space-y-4"><SelectField label={t("signatures.field.onboarding")} value={effectivePackageForm.onboardingFlowId} onValueChange={chooseFlow} options={flows.data?.items.map((flow) => ({ value: flow.id, label: `${flow.employee.name} · ${flow.branch.name}` })) ?? []} /><SelectField label={t("signatures.field.template")} value={effectivePackageForm.templateId} onValueChange={(templateId) => setPackageForm({ ...effectivePackageForm, templateId })} options={templates.data?.map((template) => ({ value: template.id, label: `${template.name} v${template.version}` })) ?? []} /><Field label={t("signatures.field.signer")} value={effectivePackageForm.fullName} onChange={(fullName) => setPackageForm({ ...effectivePackageForm, fullName })} /><Field label={t("signatures.field.signerEmail")} type="email" value={effectivePackageForm.email} onChange={(email) => setPackageForm({ ...effectivePackageForm, email })} /><Field label={t("signatures.field.dueDate")} type="date" value={effectivePackageForm.dueDate} onChange={(dueDate) => setPackageForm({ ...effectivePackageForm, dueDate })} /><Button className="w-full" onClick={() => createPackage.mutate()} disabled={!effectivePackageForm.onboardingFlowId || !effectivePackageForm.templateId || !effectivePackageForm.fullName || !effectivePackageForm.email || createPackage.isPending}>{createPackage.isPending ? t("signatures.preparing") : t("signatures.createPackage")}</Button></div></DialogContent></Dialog>
    <Dialog open={Boolean(links.length)} onOpenChange={(open) => !open && setLinks([])}><DialogContent><DialogHeader><DialogTitle>{t("signatures.linksTitle")}</DialogTitle><DialogDescription>{t("signatures.linksBody")}</DialogDescription></DialogHeader><div className="space-y-3">{links.map((link) => <div key={link.participantId} className="rounded-lg border border-line p-3"><p className="font-medium text-ink-1">{link.email}</p><p className="truncate text-xs text-ink-3">{link.url}</p><Button className="mt-2" size="sm" variant="secondary" onClick={() => void navigator.clipboard.writeText(link.url)}><Clipboard className="size-4" />{t("signatures.copyLink")}</Button></div>)}</div></DialogContent></Dialog>
  </div>;
}

const PACKAGE_STATUS: Record<ElectronicSignaturePackageDto["status"], { key: string; tone: Tone }> = {
  DRAFT: { key: "signatures.status.DRAFT", tone: "neutral" },
  PENDING: { key: "signatures.status.PENDING", tone: "progress" },
  PARTIALLY_SIGNED: { key: "signatures.status.PARTIALLY_SIGNED", tone: "progress" },
  COMPLETED: { key: "signatures.status.COMPLETED", tone: "success" },
  CANCELLED: { key: "signatures.status.CANCELLED", tone: "danger" },
};

const PARTICIPANT_STATUS: Record<ElectronicSignatureParticipantDto["status"], { key: string; icon: typeof CircleCheck; className: string }> = {
  PENDING: { key: "signatures.participant.PENDING", icon: Clock3, className: "text-status-warning" },
  SIGNED: { key: "signatures.participant.SIGNED", icon: CircleCheck, className: "text-status-success" },
  REJECTED: { key: "signatures.participant.REJECTED", icon: CircleX, className: "text-status-danger" },
};

function shortDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : new Intl.DateTimeFormat("es", { day: "numeric", month: "short" }).format(date);
}

/**
 * Un paquete de firma, de un vistazo: título, para quién, cuántas firmas
 * faltan y qué toca hacer. El botón cambia con el estado —«Enviar a firma» si
 * nunca se envió, «Recordar» si ya se envió— y desaparece cuando ya no hay
 * nada que hacer.
 */
function PackageCard({ item, now, canManage, sending, onSend, onRemind }: { item: ElectronicSignaturePackageDto; now: number; canManage: boolean; sending: boolean; onSend: () => void; onRemind: () => void }) {
  const { t } = useLocale();
  const signed = item.participants.filter((participant) => participant.status === "SIGNED").length;
  const total = item.participants.length;
  const status = PACKAGE_STATUS[item.status] ?? { key: item.status, tone: "neutral" as Tone };
  const pendingNames = item.participants.filter((participant) => participant.status === "PENDING").map((participant) => participant.fullName.split(" ")[0]);
  const due = shortDate(item.dueDate);
  const overdue = Boolean(item.dueDate && new Date(item.dueDate).getTime() < now && item.status !== "COMPLETED" && item.status !== "CANCELLED");
  const actionable = canManage && item.status !== "COMPLETED" && item.status !== "CANCELLED";
  const nextStep = item.status === "COMPLETED"
    ? t("signatures.next.done")
    : item.status === "CANCELLED"
      ? t("signatures.next.cancelled")
      : !item.sentAt
        ? t("signatures.next.send")
        : pendingNames.length
          ? t("signatures.next.waiting", { names: pendingNames.join(", ") })
          : t("signatures.next.review");

  return (
    <li className={cn("flex flex-col gap-4 rounded-lg border bg-surface-1 p-4 sm:p-5", overdue ? "border-status-warning/50" : "border-line")}>
      {/* En móvil la insignia baja a su propia fila: al lado del título le
          robaba la mitad del ancho y el título quedaba en «Acuerdo y cons…». */}
      <div className="flex flex-wrap items-start gap-3">
        <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-fill/15 text-accent-ink">
          <FileSignature className="size-5" />
        </span>
        <div className="min-w-0 flex-1 basis-40">
          <h3 className="line-clamp-2 break-words text-base font-semibold leading-snug text-ink-1">{item.title}</h3>
          <p className="mt-0.5 truncate text-sm text-ink-2">{item.employee?.name ?? t("signatures.noEmployee")}</p>
        </div>
        <div className="order-last basis-full sm:order-none sm:basis-auto sm:shrink-0"><StatusBadge tone={status.tone} label={t(status.key)} /></div>
      </div>

      {total ? <ProgressMeter label={t("signatures.progress")} value={signed} max={total} detail={t("signatures.progressDetail", { signed, total })} /> : null}

      <p className="flex items-start gap-2 text-sm text-ink-1">
        <Send className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden="true" />
        <span><span className="font-medium">{t("signatures.nextLabel")}:</span> {nextStep}</span>
      </p>

      <ul aria-label={t("signatures.signersAria")} className="space-y-1.5">
        {item.participants.map((participant) => {
          const state = PARTICIPANT_STATUS[participant.status] ?? PARTICIPANT_STATUS.PENDING;
          const Icon = state.icon;
          return (
            <li key={participant.id} className="flex items-start gap-2 text-sm">
              <Icon className={cn("mt-0.5 size-4 shrink-0", state.className)} aria-hidden="true" />
              <span className="min-w-0 flex-1 text-ink-1">{participant.fullName}<span className="block truncate text-xs text-ink-3 sm:ml-1 sm:inline">{participant.email}</span></span>
              <span className="shrink-0 text-xs text-ink-2">{t(state.key)}</span>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        {actionable ? (item.sentAt
          ? <Button variant="secondary" onClick={onRemind} disabled={sending}><BellRing className="size-4" />{t("signatures.remind")}</Button>
          : <Button onClick={onSend} disabled={sending || !item.template}><Send className="size-4" />{t("signatures.send")}</Button>) : null}
        {due ? (
          <span className={cn("inline-flex items-center gap-1.5 text-sm", overdue ? "font-medium text-status-warning" : "text-ink-2")}>
            <CalendarDays className="size-4" aria-hidden="true" />
            {overdue ? t("signatures.overdue", { date: due }) : t("signatures.dueOn", { date: due })}
          </span>
        ) : null}
        <details className="group ml-auto min-w-0 basis-full sm:basis-auto">
          <summary className="inline-flex min-h-[var(--control-h-base)] cursor-pointer list-none items-center gap-1 text-sm font-medium text-ink-2 hover:text-ink-1 [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">{t("signatures.more")}</span>
            <span className="hidden group-open:inline">{t("signatures.less")}</span>
          </summary>
          <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            <Fact label={t("signatures.template")} value={item.template ? `${item.template.name} v${item.template.version}` : t("signatures.noTemplate")} />
            <Fact label={t("signatures.provider")} value={item.externalProvider ?? t("signatures.internalProvider")} />
            {item.sentAt ? <Fact label={t("signatures.sentAt")} value={new Date(item.sentAt).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" })} /> : null}
            {item.auditEvents[0] ? <Fact label={t("signatures.lastEvent")} value={`${item.auditEvents[0].action} · ${new Date(item.auditEvents[0].occurredAt).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" })}`} /> : null}
          </dl>
        </details>
      </div>
    </li>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><dt className="text-xs text-ink-3">{label}</dt><dd className="truncate text-ink-1">{value}</dd></div>;
}
function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { const id = `signature-${label.toLowerCase().replace(/\W+/g, "-")}`; return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} /></div>; }
function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { const id = `signature-${label.toLowerCase().replace(/\W+/g, "-")}`; return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><textarea id={id} rows={5} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-md border border-line bg-surface-1 p-3 text-base" /></div>; }
function SelectField({ label, value, onValueChange, options }: { label: string; value: string; onValueChange: (value: string) => void; options: Array<{ value: string; label: string }> }) { const { t } = useLocale(); return <div className="space-y-2"><Label>{label}</Label><Select value={value} onValueChange={onValueChange}><SelectTrigger><SelectValue placeholder={t("signatures.selectPlaceholder", { label: label.toLowerCase() })} /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>; }
