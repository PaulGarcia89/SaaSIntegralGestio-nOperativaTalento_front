"use client";

import { useUiText } from "@/components/ui-copy";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, CircleAlert, CircleCheck, Clock3, FileText, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HIRING_STAGE_ICONS } from "@/components/hiring/hiring-stage-rail";
import { Input } from "@/components/ui/input";
import { HiringReasonDialog } from "@/components/hiring/hiring-action-dialog";
import { ConfirmPanel, ImpactReview, InlineNote } from "@/components/system";
import { hiringConfirmationImpact } from "@/lib/hiring-operation";
import { initialOperationState, type OperationStepId } from "@/lib/operation-flow";
import { HiringBlockerList, currentOfferVersion, longDate, salaryText } from "@/components/hiring/hiring-case-header";
import {
  configureHiringOffer,
  confirmHiringContract,
  fetchDocuSealHiringBundleStatus,
  fetchJobOffers,
  requestHiringDocument,
  respondHiringOffer,
  reviewHiringDocument,
  sendHiringDocuments,
  sendHiringOffer,
} from "@/lib/backend";
import type {
  HiringContractBlockerDto,
  HiringContractDocumentDto,
  HiringContractDto,
} from "@/lib/contracts";
import {
  HIRING_STAGES,
  hiringDocumentStatusLabel,
  hiringOfferStatusLabel,
  hiringSignatureStatusLabel,
  hiringStage,
  hiringStageIndex,
  hiringTemplateLabel,
  type HiringCaseState,
  type HiringStageId,
  hiringStageTitle,
  hiringStageSummary,
} from "@/lib/hiring-ux";
import { useAppStore } from "@/store/app-store";
import { useLocale } from "@/components/locale-provider";
import { translate } from "@/i18n";
import type { SupportedLocale } from "@/i18n/types";

/**
 * Traduce el error del servidor a algo accionable.
 *
 * "Error desconocido" y "Algo salió mal" no le sirven a nadie: la persona no
 * sabe si debe reintentar, avisar a alguien o corregir un dato.
 */
/**
 * ATENCIÓN: esta función reconoce el error del servidor buscando palabras
 * ESPAÑOLAS dentro del mensaje ("oferta debe estar aceptada"). Funciona hoy
 * porque esos mensajes del backend siguen escritos en español, pero es la misma
 * fragilidad que se corrigió en `todayActionLabel`: en cuanto el backend
 * traduzca estos textos, ninguna expresión coincidirá y todos los errores
 * caerán en el mensaje genérico.
 *
 * La corrección de verdad es que el backend devuelva un CÓDIGO de error junto
 * al mensaje, y que aquí se compare el código. Queda pendiente porque cambia el
 * contrato de esos endpoints.
 */
export function hiringErrorMessage(error: unknown, locale: SupportedLocale = "es") {
  const t = (key: string) => translate(locale, key);
  const raw = error instanceof Error ? error.message : "";
  if (/empleado asociado/i.test(raw)) return t("hiring.panel.signAtConfirmBody");
  if (/oferta debe estar aceptada/i.test(raw)) return t("hiring.error.notAccepted");
  if (/faltan documentos obligatorios/i.test(raw)) return t("hiring.error.docsPending");
  if (/ya está cerrada/i.test(raw)) return t("hiring.error.alreadyClosed");
  if (/network|fetch|failed/i.test(raw)) return t("hiring.error.offline");
  return raw || t("hiring.error.serverFailed");
}

/**
 * Panel de la etapa.
 *
 * Orden fijo, pensado para leerse de arriba abajo sin volver atrás:
 *   1. Icono y nombre de la etapa, con una frase de qué se hace aquí.
 *   2. La acción principal (`action`), ANTES del detalle: es lo que la persona
 *      vino a hacer. Si hay bloqueos, la acción no se pinta y se ven ellos.
 *   3. Solo el detalle necesario para decidir.
 *
 * El «Paso 2 de 5» ya lo dice el paso a paso de la cabecera; aquí no se
 * repite. «Volver al paso anterior» pasa a ser un enlace discreto: también se
 * puede volver pulsando la etapa en el paso a paso.
 */
function StagePanel({ stage, children, onBack, action }: { stage: HiringStageId; children: React.ReactNode; onBack?: () => void; action?: React.ReactNode }) {
  const { locale, t } = useLocale();
  const info = hiringStage(stage);
  const Icon = HIRING_STAGE_ICONS[stage];
  return (
    <section aria-labelledby={`hiring-stage-${stage}`} className="rounded-lg border border-line bg-surface-1 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent-fill/15 text-accent-ink">
          <Icon className="size-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={`hiring-stage-${stage}`} className="text-xl font-semibold text-ink-1">
            {hiringStageTitle(stage, locale)}
            <span className="sr-only"> · {t("hiring.stepOf", { step: info.step, total: HIRING_STAGES.length })}</span>
          </h2>
          <p className="mt-1 max-w-2xl text-base text-ink-2">{hiringStageSummary(stage, locale)}</p>
        </div>
      </div>

      {action ? <div className="mt-5 rounded-lg border border-accent-line/40 bg-accent-fill/5 p-4">{action}</div> : null}

      <div className="mt-5 space-y-5">{children}</div>

      {onBack ? (
        <div className="mt-5 border-t border-line pt-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t("hiring.panel.backStep")}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

/** Botón principal + qué pasa después, en una sola línea. */
function StageAction({ button, after }: { button: React.ReactNode; after?: string }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      {button}
      {after ? <p className="text-base text-ink-2">{after}</p> : null}
    </div>
  );
}

/** Lista de comprobación gráfica: cada dato con su marca. */
function CheckItem({ ok, label, value }: { ok: boolean; label: string; value: React.ReactNode }) {
  const uiText = useUiText();
  return (
    <li className={cn("flex items-start gap-3 rounded-lg border p-3", ok ? "border-line bg-surface-1" : "border-status-warning/40 bg-status-warning/5")}>
      <span aria-hidden="true" className={cn("mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full", ok ? "bg-status-success text-white" : "bg-status-warning/15 text-status-warning")}>
        {ok ? <Check className="size-3.5" strokeWidth={3} /> : <CircleAlert className="size-4" />}
      </span>
      <span className="min-w-0">
        <span className="block text-sm text-ink-2">{label}</span>
        <span className="block truncate text-base font-medium text-ink-1">{value}</span>
        <span className="sr-only">{ok ? "Correcto" : uiText("Requiere atención")}</span>
      </span>
    </li>
  );
}

/** Dato con rótulo pequeño encima; tres caben en una fila. */
function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border border-line bg-surface-1 p-3">
      <dt className="text-sm text-ink-2">{label}</dt>
      <dd className="mt-0.5 truncate text-base font-medium text-ink-1">{value}</dd>
    </div>
  );
}


/* ------------------------------- Etapa 1 -------------------------------- */

export function PreparationPanel({ contract, state, onAdvance }: { contract: HiringContractDto; state: HiringCaseState; onAdvance: () => void }) {
  const uiText = useUiText();
  const { t } = useLocale();
  const responsible = contract.hrResponsibleUser ?? contract.hiringManagerUser;
  const responsibleName = responsible ? [responsible.firstName, responsible.lastName].filter(Boolean).join(" ") : null;
  return (
    <StagePanel
      stage="PREPARACION"
      action={
        <StageAction
          button={
            <Button size="lg" onClick={onAdvance}>
              {uiText("Preparar oferta")}<ArrowRight className="size-5" aria-hidden="true" />
            </Button>
          }
          after={`Después elegirás la oferta laboral que recibirá ${contract.candidate.fullName.split(" ")[0]}.`}
        />
      }
    >
      <HiringBlockerList state={state} candidateName={contract.candidate.fullName.split(" ")[0] || "la persona"} />
      <ul className="grid gap-3 sm:grid-cols-2" aria-label={t("hiring.panel.checkData")}>
        <CheckItem ok label={t("hiring.panel.person")} value={contract.candidate.fullName} />
        <CheckItem ok label={t("hiring.panel.role")} value={contract.roleTitle ?? contract.vacancy.title} />
        <CheckItem ok label={t("hiring.panel.branch")} value={contract.branch.name} />
        <CheckItem ok={Boolean(responsibleName)} label={t("hiring.panel.owner")} value={responsibleName ?? t("hiring.panel.unassigned")} />
      </ul>
    </StagePanel>
  );
}

/* ------------------------------- Etapa 2 -------------------------------- */

export function OfferPanel({ contract, state, onBack, onRefresh }: { contract: HiringContractDto; state: HiringCaseState; onBack?: () => void; onRefresh: () => Promise<void> }) {
  const uiText = useUiText();
  const { locale, t } = useLocale();
  const { can } = useAppStore();
  const canUpdate = can("applications.update");
  const [selectedOfferId, setSelectedOfferId] = useState(contract.jobOfferId ?? "");
  const [rejecting, setRejecting] = useState(false);
  const offers = useQuery({ queryKey: ["hiring-offers", contract.applicationId], queryFn: () => fetchJobOffers(contract.applicationId), enabled: Boolean(contract.applicationId) });

  const link = useMutation({ mutationFn: () => configureHiringOffer(contract.id, { jobOfferId: selectedOfferId }), onSuccess: onRefresh });
  const send = useMutation({ mutationFn: () => sendHiringOffer(contract.id), onSuccess: onRefresh });
  const respond = useMutation({ mutationFn: ({ accepted, reason }: { accepted: boolean; reason?: string }) => respondHiringOffer(contract.id, accepted, reason), onSuccess: onRefresh });

  const version = currentOfferVersion(contract);
  const waitingResponse = ["OFFER_SENT", "AWAITING_OFFER_RESPONSE"].includes(contract.status);
  const failure = link.error ?? send.error ?? respond.error;

  const primary =
    canUpdate && contract.jobOfferId && !waitingResponse && !state.completed && !state.cancelled ? (
      <StageAction
        button={
          <Button size="lg" onClick={() => send.mutate()} loading={send.isPending} loadingLabel={t("hiring.panel.sendingOffer")}>
            {uiText("Enviar oferta")}<ArrowRight className="size-5" aria-hidden="true" />
          </Button>
        }
        after={`${contract.candidate.fullName.split(" ")[0]} recibirá la oferta y podrá aceptarla o rechazarla.`}
      />
    ) : canUpdate && waitingResponse ? (
      <div className="space-y-3">
        <p className="text-base text-ink-1">{uiText("Cuando ")}{contract.candidate.fullName.split(" ")[0]} {uiText(" te dé su respuesta, regístrala aquí.")}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" onClick={() => respond.mutate({ accepted: true })} loading={respond.isPending} loadingLabel={t("vacancies.saving")}>
            <Check className="size-5" aria-hidden="true" />
            {uiText("Aceptó la oferta")}</Button>
          <Button size="lg" variant="secondary" onClick={() => setRejecting(true)} disabled={respond.isPending}>
            {uiText("No aceptó la oferta")}</Button>
        </div>
      </div>
    ) : null;

  return (
    <StagePanel stage="OFERTA" onBack={onBack} action={primary}>
      {contract.jobOfferId && version ? (
        <section aria-labelledby="oferta-condiciones" className="rounded-lg border border-line bg-surface-1 p-4">
          <h3 id="oferta-condiciones" className="flex items-center justify-between gap-3 text-base font-semibold text-ink-1">
            {t("hiring.panel.offerTerms")}
            <Badge variant={contract.jobOffer?.status === "ACCEPTED" ? "success" : "secondary"} className="text-sm">
              {hiringOfferStatusLabel(contract.jobOffer?.status)}
            </Badge>
          </h3>
          <dl className="mt-3 grid gap-3 sm:grid-cols-3">
            <Fact label={t("hiring.panel.role")} value={version.jobTitle} />
            <Fact label={t("hiring.panel.salary")} value={salaryText(version) ?? t("hiring.panel.notSpecified")} />
            <Fact label={t("hiring.panel.startDate")} value={longDate(version.employmentStartDate) ?? t("hiring.panel.undefined")} />
          </dl>
          {version.validUntil ? (
            <p className="mt-3 text-sm text-ink-2">
              {t("hiring.panel.offerExpires")}: <span className="font-medium text-ink-1">{longDate(version.validUntil)}</span>
            </p>
          ) : null}
        </section>
      ) : (
        <InlineNote tone="info" title={t("hiring.panel.noOfferLinked")}>
          {uiText("La oferta se redacta en el perfil de reclutamiento de la persona. Aquí eliges cuál enviar.")}</InlineNote>
      )}

      <HiringBlockerList state={state} candidateName={contract.candidate.fullName.split(" ")[0] || "la persona"} />

      {canUpdate && !contract.jobOfferId ? (
        <div className="space-y-3 border-t border-line pt-5">
          {offers.isLoading ? <p className="text-base text-ink-2">{t("hiring.panel.loadingOffers")}</p> : null}
          {offers.isError ? <InlineNote tone="danger" title={t("hiring.panel.offersError")}>{t("hiring.panel.offersRetry")}</InlineNote> : null}
          {offers.data?.length ? (
            <>
              <label className="block space-y-2 text-base font-medium text-ink-1" htmlFor="hiring-offer-select">
                {uiText("Elige la oferta que se enviará")}<select
                  id="hiring-offer-select"
                  value={selectedOfferId}
                  onChange={(event) => setSelectedOfferId(event.target.value)}
                  className="field w-full text-base"
                >
                  <option value="">{t("hiring.panel.selectOffer")}</option>
                  {offers.data.map((offer) => (
                    <option key={offer.id} value={offer.id}>
                      {uiText("Versión")}{offer.currentVersion} · {hiringOfferStatusLabel(offer.status)}
                    </option>
                  ))}
                </select>
              </label>
              <Button size="lg" onClick={() => link.mutate()} loading={link.isPending} loadingLabel={t("hiring.panel.linkingOffer")} disabled={!selectedOfferId}>
                {uiText("Vincular oferta")}</Button>
            </>
          ) : offers.isSuccess ? (
            <InlineNote tone="info" title={t("hiring.panel.noOffers")} action={<Button asChild variant="secondary"><Link href={`/ats/candidates/${contract.applicationId}#job-offers`}>{t("hiring.panel.createOffer")}</Link></Button>}>
              {uiText("Primero hay que redactar la oferta en el perfil de reclutamiento. Cuando exista, vuelve aquí para enviarla.")}</InlineNote>
          ) : null}
        </div>
      ) : null}

      {send.isSuccess ? <InlineNote tone="success" title={`Oferta enviada a ${contract.candidate.fullName}`}>{t("hiring.panel.waitingAnswer")}</InlineNote> : null}
      {respond.isSuccess ? <InlineNote tone="success" title={uiText("Respuesta registrada")}>{t("hiring.panel.advanced")}</InlineNote> : null}
      {failure ? <InlineNote tone="danger" title={t("hiring.panel.actionFailed")}>{hiringErrorMessage(failure, locale)}</InlineNote> : null}

      <HiringReasonDialog
        open={rejecting}
        title={t("hiring.panel.recordRejection")}
        description={t("hiring.panel.rejectionReason")}
        confirmLabel={t("hiring.panel.saveAnswer")}
        onOpenChange={setRejecting}
        onConfirm={(reason) => respond.mutate({ accepted: false, reason })}
      />
    </StagePanel>
  );
}

/* ------------------------------- Etapa 3 -------------------------------- */

const DOCUMENT_TEMPLATES = [
  // El título del documento se guarda en la contratación: es un dato de la
  // empresa. Se crea en el idioma activo y no se vuelve a traducir después.
  { type: "IDENTIFICATION", titleKey: "hiring.docType.IDENTIFICATION" },
  { type: "TAX", titleKey: "hiring.docType.TAX" },
  { type: "ELIGIBILITY", titleKey: "hiring.docType.ELIGIBILITY" },
];

function DocumentRow({ document, onApprove, onReject, canUpdate, pending }: { document: HiringContractDocumentDto; onApprove: () => void; onReject: () => void; canUpdate: boolean; pending: boolean }) {
  const { locale, t } = useLocale();
  const settled = ["APPROVED", "SIGNED", "WAIVED"].includes(document.status);
  const reviewable = ["RECEIVED", "UNDER_REVIEW", "REJECTED"].includes(document.status);
  const rejected = document.status === "REJECTED";
  const StatusIcon = settled ? CircleCheck : rejected ? CircleAlert : reviewable ? FileText : Clock3;
  return (
    <li className="flex flex-col gap-3 border-b border-line py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
            settled ? "bg-status-success/15 text-status-success" : rejected ? "bg-status-danger/10 text-status-danger" : reviewable ? "bg-accent-fill/15 text-accent-ink" : "bg-surface-2 text-ink-3",
          )}
        >
          <StatusIcon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-base font-medium text-ink-1">{document.title}</p>
          <p className="mt-0.5 text-sm text-ink-2">
            {hiringDocumentStatusLabel(document.status, locale)}
            {document.required ? "" : t("hiring.panel.optional")}
          </p>
          {document.rejectionReason ? <p className="mt-1 text-sm text-ink-1">{t("hiring.panel.fixReason")} {document.rejectionReason}</p> : null}
        </div>
      </div>
      {canUpdate && reviewable ? (
        <div className="flex flex-wrap gap-2">
          <Button onClick={onApprove} loading={pending} loadingLabel={t("vacancies.saving")}>{t("hiring.panel.approveDoc")}</Button>
          <Button variant="secondary" onClick={onReject} disabled={pending}>{t("hiring.panel.requestFix")}</Button>
        </div>
      ) : null}
    </li>
  );
}

export function DocumentsPanel({ contract, state, documents, onBack, onRefresh }: { contract: HiringContractDto; state: HiringCaseState; documents: HiringContractDocumentDto[]; onBack?: () => void; onRefresh: () => Promise<void> }) {
  const uiText = useUiText();
  const { locale, t } = useLocale();
  const { can } = useAppStore();
  const canUpdate = can("applications.update");
  const canRequest = can("documents.request") || canUpdate;
  const [customTitle, setCustomTitle] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const request = useMutation({ mutationFn: (input: { type: string; title: string }) => requestHiringDocument(contract.id, { ...input, required: true, source: "INTERNAL" }), onSuccess: async () => { setCustomTitle(""); await onRefresh(); } });
  const review = useMutation({ mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) => reviewHiringDocument(contract.id, id, { status, reason }), onSuccess: onRefresh });

  const missing = DOCUMENT_TEMPLATES.filter((template) => !documents.some((document) => document.type === template.type && document.required && !["REJECTED", "WAIVED"].includes(document.status)));
  const firstName = contract.candidate.fullName.split(" ")[0] || "la persona";
  const required = documents.filter((document) => document.required && document.status !== "WAIVED");
  const approved = required.filter((document) => ["APPROVED", "SIGNED"].includes(document.status)).length;
  const toReview = documents.filter((document) => ["RECEIVED", "UNDER_REVIEW"].includes(document.status)).length;

  return (
    <StagePanel
      stage="DOCUMENTOS"
      onBack={onBack}
      action={
        canRequest && !state.completed && !state.cancelled && documents.length === 0 && missing.length ? (
          <StageAction
            button={
              <Button size="lg" onClick={() => request.mutate({ type: missing[0].type, title: t(missing[0].titleKey) })} loading={request.isPending} loadingLabel={t("hiring.panel.requesting")}>
                {t("hiring.panel.askDocFrom", { name: firstName })}
                <ArrowRight className="size-5" aria-hidden="true" />
              </Button>
            }
            after={t("hiring.panel.askDocAfter", { name: firstName })}
          />
        ) : toReview > 0 ? (
          <p className="text-base font-medium text-ink-1">{t("hiring.panel.toReviewCount", { n: toReview })}</p>
        ) : undefined
      }
    >
      <HiringBlockerList state={state} candidateName={firstName} />

      {required.length ? (
        <div>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <p className="font-medium text-ink-1">{t("hiring.panel.docsProgress", { approved, total: required.length })}</p>
            <p className="font-mono text-ink-2 tabular-figures">{Math.round((approved / required.length) * 100)} %</p>
          </div>
          <div
            role="progressbar"
            aria-valuenow={approved}
            aria-valuemin={0}
            aria-valuemax={required.length}
            aria-valuetext={t("hiring.panel.docsProgress", { approved, total: required.length })}
            className="mt-2 h-2 overflow-hidden rounded-full bg-surface-3"
          >
            <div className="h-full rounded-full bg-status-success motion-safe:transition-[width]" style={{ width: `${(approved / required.length) * 100}%` }} />
          </div>
        </div>
      ) : null}

      <section aria-labelledby="documentos-lista">
        <h3 id="documentos-lista" className="text-base font-semibold text-ink-1">{t("hiring.panel.documents")}</h3>
        {documents.length ? (
          <ul className="mt-2 rounded-lg border border-line bg-surface-1 px-4">
            {documents.map((document) => (
              <DocumentRow
                key={document.id}
                document={document}
                canUpdate={canUpdate}
                pending={review.isPending}
                onApprove={() => review.mutate({ id: document.id, status: "APPROVED" })}
                onReject={() => setRejectingId(document.id)}
              />
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-base text-ink-2">{t("hiring.panel.noDocsYet")}</p>
        )}
      </section>

      {canRequest && !state.completed && !state.cancelled ? (
        <section aria-labelledby="documentos-solicitar" className="space-y-3 border-t border-line pt-5">
          <h3 id="documentos-solicitar" className="text-base font-semibold text-ink-1">{t("hiring.panel.askDocFrom", { name: firstName })}</h3>
          {missing.length ? (
            <div className="flex flex-wrap gap-2">
              {missing.map((template) => (
                <Button key={template.type} variant="secondary" onClick={() => request.mutate({ type: template.type, title: t(template.titleKey) })} loading={request.isPending} loadingLabel={t("hiring.panel.requesting")}>
                  {t(template.titleKey)}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-base text-ink-2">{t("hiring.panel.threeAsked")}</p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="flex-1 space-y-2 text-base font-medium text-ink-1" htmlFor="hiring-custom-document">
              {uiText("¿Necesitas otro documento?")}<Input id="hiring-custom-document" value={customTitle} onChange={(event) => setCustomTitle(event.target.value)} placeholder={t("hiring.panel.docPlaceholder")} className="text-base" />
            </label>
            <Button className="sm:self-end" onClick={() => request.mutate({ type: "OTHER", title: customTitle.trim() })} disabled={!customTitle.trim()} loading={request.isPending} loadingLabel={uiText("Pidiendo…")}>
              {uiText("Pedir este documento")}</Button>
          </div>
        </section>
      ) : null}

      <details className="group rounded-lg border border-line bg-surface-1">
        <summary className="flex min-h-[var(--control-h-base)] cursor-pointer list-none items-center gap-2 px-4 py-2 text-base font-medium text-ink-1 [&::-webkit-details-marker]:hidden">
          <PenLine className="size-5 text-ink-2" aria-hidden="true" />
          {uiText("Firmas electrónicas")}<span className="ml-auto text-sm font-normal text-ink-2">{t("hiring.panel.signAtConfirm")}</span>
        </summary>
        <p className="border-t border-line px-4 py-3 text-base text-ink-2">
          {uiText("El sistema necesita el expediente del empleado creado para poder enviar los documentos a firma, y ese expediente se crea al confirmar. Primero reúne y aprueba los documentos de arriba.")}</p>
      </details>

      {request.isSuccess ? <InlineNote tone="success" title={t("hiring.panel.docRequested")}>{firstName} {uiText(" verá el documento en su lista de pendientes.")}</InlineNote> : null}
      {review.isSuccess ? <InlineNote tone="success" title={t("hiring.panel.docUpdated")}>{t("hiring.panel.progressRecalculated")}</InlineNote> : null}
      {request.error || review.error ? <InlineNote tone="danger" title={t("hiring.panel.actionFailed")}>{hiringErrorMessage(request.error ?? review.error, locale)}</InlineNote> : null}

      <HiringReasonDialog
        open={Boolean(rejectingId)}
        title={t("hiring.panel.requestFixTitle")}
        description={`${firstName} verá este motivo y podrá volver a enviar el documento.`}
        confirmLabel={t("hiring.panel.requestFix")}
        onOpenChange={(open) => !open && setRejectingId(null)}
        onConfirm={(reason) => { if (rejectingId) review.mutate({ id: rejectingId, status: "REJECTED", reason }); setRejectingId(null); }}
      />
    </StagePanel>
  );
}

/* ------------------------------- Etapa 4 -------------------------------- */

export function ReviewPanel({ contract, state, documents, onBack, onRefresh }: { contract: HiringContractDto; state: HiringCaseState; documents: HiringContractDocumentDto[]; onBack?: () => void; onRefresh: () => Promise<void> }) {
  const uiText = useUiText();
  const { locale, t } = useLocale();
  const { can, currentUser } = useAppStore();
  const canUpdate = can("applications.update");
  const [acknowledged, setAcknowledged] = useState(false);
  const client = useQueryClient();
  const confirm = useMutation({ mutationFn: () => confirmHiringContract(contract.id), onSuccess: async () => { await onRefresh(); await client.invalidateQueries({ queryKey: ["hiring-contracts"] }); } });

  const version = currentOfferVersion(contract);
  const approved = documents.filter((document) => ["APPROVED", "SIGNED", "WAIVED"].includes(document.status)).length;
  const firstName = contract.candidate.fullName.split(" ")[0] || "la persona";

  /*
   * Esta etapa pasa a usar el patrón universal de operaciones.
   *
   * Antes había un párrafo escrito a mano que enumeraba lo que iba a pasar y,
   * por separado, la comprobación de si se podía confirmar; los dos podían
   * discrepar y ninguno decía si la acción era reversible. Ahora el impacto se
   * calcula en `hiringConfirmationImpact` —probado— y la decisión de si se
   * puede confirmar la toma `canConfirm` a partir de ese mismo impacto.
   *
   * Se retira el diálogo de «¿Estás seguro?». Lo sustituye una casilla que
   * exige reconocer que la operación es definitiva, junto al detalle de qué
   * cambia: un modal con un sí y un no informa menos y se responde por reflejo.
   */
  const impact = hiringConfirmationImpact({
    candidateName: contract.candidate.fullName,
    roleTitle: contract.roleTitle ?? contract.vacancy.title,
    branchName: contract.branch.name,
    salaryText: salaryText(version) ?? null,
    startDateText: longDate(version?.employmentStartDate) ?? null,
    documentsTotal: documents.length,
    documentsApproved: approved,
    pendingDocuments: state.pendingDocuments,
    hasOnboardingFlow: Boolean(contract.onboardingFlowId),
    responsible: currentUser.fullName,
    // El backend es la autoridad sobre si acepta la confirmación. Si no la
    // acepta y no ha explicado por qué, se declara un bloqueo genérico en vez
    // de mostrar un botón que el servidor va a rechazar.
    blockers: state.canConfirm
      ? []
      : state.blockers.length > 0
        ? state.blockers
        : [{ code: "NOT_CONFIRMABLE", message: t("hiring.panel.needOfferAccepted") } as HiringContractBlockerDto],
    locale,
  });

  const operationState = {
    ...initialOperationState(),
    step: "confirm" as const,
    completed: ["select", "record", "review"] as OperationStepId[],
    impact,
    submitting: confirm.isPending,
  };

  return (
    <StagePanel stage="REVISION" onBack={onBack}>
      <ul className="grid gap-3 sm:grid-cols-2" aria-label={t("hiring.panel.reviewSummary")}>
        <CheckItem ok label={t("hiring.panel.roleAndBranch")} value={`${contract.roleTitle ?? contract.vacancy.title} · ${contract.branch.name}`} />
        <CheckItem ok={Boolean(salaryText(version))} label={t("hiring.panel.agreedSalary")} value={salaryText(version) ?? t("hiring.panel.notInOffer")} />
        <CheckItem ok={Boolean(version?.employmentStartDate)} label={t("hiring.panel.startDate")} value={longDate(version?.employmentStartDate) ?? t("hiring.panel.undefined")} />
        <CheckItem ok={Boolean(contract.jobOffer?.acceptedAt)} label={uiText("Oferta")} value={contract.jobOffer?.acceptedAt ? `Aceptada el ${longDate(contract.jobOffer.acceptedAt)}` : hiringOfferStatusLabel(contract.jobOffer?.status)} />
        <CheckItem ok={state.pendingDocuments === 0} label={t("hiring.panel.docsLabel")} value={documents.length ? `${approved} de ${documents.length} aprobados` : t("hiring.panel.noDocsRequested")} />
      </ul>

      {/* Qué cambia si confirmo: estado actual, resultado esperado, avisos,
          bloqueos con causa/responsable/salida, y quién queda registrado. */}
      <ImpactReview impact={impact} />

      {canUpdate ? (
        <ConfirmPanel
          state={operationState}
          operationName={t("hiring.panel.confirmHiring")}
          onConfirm={() => confirm.mutate()}
          acknowledged={acknowledged}
          onAcknowledgedChange={setAcknowledged}
        />
      ) : (
        <InlineNote tone="info" title={t("hiring.panel.readOnly")}>
          {uiText("Tu perfil permite revisar esta contratación, pero no cerrarla. Pídeselo a la persona responsable de recursos humanos.")}</InlineNote>
      )}

      {confirm.error ? <InlineNote tone="danger" title={t("hiring.panel.closeFailed")}>{hiringErrorMessage(confirm.error, locale)}</InlineNote> : null}

      {/* El bloque de blockers específico de contratación ya no se pinta aparte:
          `ImpactReview` los muestra con causa, responsable y cómo se resuelven.
          `HiringBlockerList` sigue usándose en las etapas anteriores. */}
      <span className="sr-only">{firstName}</span>
    </StagePanel>
  );
}

/* ------------------------------- Etapa 5 -------------------------------- */

export function OutcomePanel({ contract, onRefresh }: { contract: HiringContractDto; onRefresh: () => Promise<void> }) {
  const uiText = useUiText();
  const { locale, t } = useLocale();
  const { can } = useAppStore();
  const canSign = can("documents.sign") || can("applications.update");
  const signatures = useQuery({
    queryKey: ["hiring-signatures", contract.id],
    queryFn: () => fetchDocuSealHiringBundleStatus(contract.applicationId),
    enabled: Boolean(contract.applicationId),
    refetchInterval: (query) => (query.state.data?.allCompleted ? false : 15000),
  });
  const send = useMutation({ mutationFn: () => sendHiringDocuments(contract.id), onSuccess: async () => { await onRefresh(); await signatures.refetch(); } });
  const status = signatures.data;

  return (
    <StagePanel stage="CONFIRMACION">
      <InlineNote tone="success" title={t("hiring.panel.completed")}>
        {contract.employee ? `${contract.employee.name} ya forma parte del equipo.` : t("hiring.panel.profileCreated")}
      </InlineNote>

      <dl className="grid gap-3 sm:grid-cols-3">
        <Fact label={uiText("Empleado")} value={contract.employee ? contract.employee.name : contract.candidate.fullName} />
        <Fact label={t("hiring.panel.activationDate")} value={longDate(contract.hiredAt) ?? "Hoy"} />
        <Fact label={t("hiring.panel.welcomePlan")} value={contract.onboardingFlowId ? t("hiring.panel.openAndReady") : t("hiring.panel.noOnboarding")} />
      </dl>

      <section aria-labelledby="resultado-firmas" className="space-y-3 border-t border-line pt-5">
        <h3 id="resultado-firmas" className="text-base font-semibold text-ink-1">{t("hiring.panel.signatures")}</h3>
        {signatures.isLoading ? <p className="text-base text-ink-2">{t("hiring.panel.loadingSignatures")}</p> : null}
        {status?.allCompleted ? (
          <InlineNote tone="success" title={t("hiring.panel.allSigned")}>{t("hiring.panel.nothingToSign")}</InlineNote>
        ) : status?.allSent ? (
          <InlineNote tone="warning" title={`Esperando la firma de ${contract.candidate.fullName.split(" ")[0]}`}>{t("hiring.panel.gotByEmail")}</InlineNote>
        ) : (
          <InlineNote tone="info" title={t("hiring.panel.needToSend")}>{t("hiring.panel.canSendNow")}</InlineNote>
        )}
        {status?.documents?.length ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {status.documents.map((document) => (
              <li key={document.templateKey} className="rounded-md border border-line p-3">
                <p className="text-base font-medium text-ink-1">{hiringTemplateLabel(document.templateKey)}</p>
                <p className="mt-1 text-base text-ink-2">{hiringSignatureStatusLabel(document.status)}</p>
              </li>
            ))}
          </ul>
        ) : null}
        {canSign ? (
          <Button size="lg" variant={status?.allSent ? "secondary" : "default"} onClick={() => send.mutate()} loading={send.isPending} loadingLabel={uiText("Enviando…")}>
            {status?.allSent ? t("hiring.panel.sendReminder") : t("hiring.panel.sendToSign")}
          </Button>
        ) : null}
        {send.error ? <InlineNote tone="danger" title={t("hiring.panel.sendFailed")}>{hiringErrorMessage(send.error, locale)}</InlineNote> : null}
      </section>

      <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row">
        {contract.employeeId ? (
          <Button asChild size="lg">
            <Link href={`/employees/${contract.employeeId}`}>{t("hiring.panel.seeEmployee")}<ArrowRight className="size-5" aria-hidden="true" /></Link>
          </Button>
        ) : null}
        {contract.onboardingFlowId ? (
          <Button asChild size="lg" variant="secondary">
            <Link href={`/onboarding/documents?flowId=${encodeURIComponent(contract.onboardingFlowId ?? "")}`}>{t("hiring.panel.openWelcome")}</Link>
          </Button>
        ) : null}
      </div>
    </StagePanel>
  );
}

/* ------------------------------ Cancelada ------------------------------- */

export function CancelledPanel({ contract }: { contract: HiringContractDto }) {
  const uiText = useUiText();
  const { t } = useLocale();
  return (
    <Card level={1}>
      <CardHeader>
        <CardTitle className="text-xl">{t("hiring.panel.cancelled")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-5 pt-0 sm:p-6 sm:pt-0">
        <p className="text-base text-ink-1">{t("hiring.panel.cancelledBody")}</p>
        {contract.cancelledReason ? (
          <div className="rounded-lg border border-line bg-surface-1 p-4">
            <p className="text-base text-ink-2">{t("hiring.panel.reasonOnFile")}</p>
            <p className="mt-1 text-base font-medium text-ink-1">{contract.cancelledReason}</p>
          </div>
        ) : null}
        <Badge variant="destructive" className="text-sm">{uiText("Cancelada el ")}{longDate(contract.cancelledAt) ?? "—"}</Badge>
      </CardContent>
    </Card>
  );
}

export function stageForView(state: HiringCaseState, requested: HiringStageId | null): HiringStageId {
  if (!requested) return state.stage;
  // Solo se permite retroceder a etapas ya alcanzadas o avanzar una posición:
  // así el usuario puede volver a mirar la oferta sin perder nada, pero no
  // salta a "Confirmar" sin haber pasado por los requisitos.
  const limit = Math.min(state.stageIndex + 1, HIRING_STAGES.length - 1);
  return hiringStageIndex(requested) <= limit ? requested : state.stage;
}
