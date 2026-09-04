"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, CircleCheck, FileText, PenLine } from "lucide-react";
import { InlineFeedback } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { HiringConfirmDialog, HiringReasonDialog } from "@/components/hiring/hiring-action-dialog";
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
import type { HiringContractDocumentDto, HiringContractDto } from "@/lib/contracts";
import {
  HIRING_STAGES,
  hiringDocumentStatusLabel,
  hiringDocumentTypeLabel,
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

function StagePanel({ stage, children, onBack }: { stage: HiringStageId; children: React.ReactNode; onBack?: () => void }) {
  const { locale, t } = useLocale();
  const info = hiringStage(stage);
  return (
    <Card level={1}>
      <CardContent className="space-y-6 p-5 sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-base font-medium text-text-secondary">{t("hiring.stepOf", { step: info.step, total: HIRING_STAGES.length })}</p>
            <h2 className="mt-1 text-2xl font-semibold text-text-primary">{hiringStageTitle(stage, locale)}</h2>
            <p className="mt-2 max-w-2xl text-base text-text-secondary">{hiringStageSummary(stage, locale)}</p>
          </div>
          {onBack ? (
            <Button variant="secondary" onClick={onBack}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Volver al paso anterior
            </Button>
          ) : null}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b border-border-default py-3 last:border-b-0">
      <dt className="text-base text-text-secondary">{label}</dt>
      <dd className="mt-1 text-base font-medium text-text-primary">{value}</dd>
    </div>
  );
}

/* ------------------------------- Etapa 1 -------------------------------- */

export function PreparationPanel({ contract, state, onAdvance }: { contract: HiringContractDto; state: HiringCaseState; onAdvance: () => void }) {
  const { t } = useLocale();
  const responsible = contract.hrResponsibleUser ?? contract.hiringManagerUser;
  const responsibleName = responsible ? [responsible.firstName, responsible.lastName].filter(Boolean).join(" ") : null;
  return (
    <StagePanel stage="PREPARACION">
      <p className="text-base text-text-primary">{t("hiring.panel.checkData")}</p>
      <dl className="rounded-2xl border border-border-default bg-surface-elevated px-4">
        <DataRow label={t("hiring.panel.person")} value={contract.candidate.fullName} />
        <DataRow label={t("hiring.panel.role")} value={contract.roleTitle ?? contract.vacancy.title} />
        <DataRow label={t("hiring.panel.company")} value={contract.vacancy.tenant?.name ?? t("hiring.activeCompany")} />
        <DataRow label={t("hiring.panel.branch")} value={contract.branch.name} />
        <DataRow label={t("hiring.panel.owner")} value={responsibleName ?? t("hiring.panel.unassigned")} />
      </dl>
      <HiringBlockerList state={state} candidateName={contract.candidate.fullName.split(" ")[0] || "la persona"} />
      <div className="flex flex-col gap-3 border-t border-border-default pt-5 sm:flex-row sm:items-center">
        <Button size="lg" onClick={onAdvance}>
          Preparar oferta
          <ArrowRight className="size-5" aria-hidden="true" />
        </Button>
        <p className="text-base text-text-secondary">Después elegirás la oferta laboral que recibirá {contract.candidate.fullName.split(" ")[0]}.</p>
      </div>
    </StagePanel>
  );
}

/* ------------------------------- Etapa 2 -------------------------------- */

export function OfferPanel({ contract, state, onBack, onRefresh }: { contract: HiringContractDto; state: HiringCaseState; onBack?: () => void; onRefresh: () => Promise<void> }) {
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

  return (
    <StagePanel stage="OFERTA" onBack={onBack}>
      {contract.jobOfferId && version ? (
        <section aria-labelledby="oferta-condiciones" className="rounded-2xl border border-border-default bg-surface-elevated p-4">
          <h3 id="oferta-condiciones" className="text-lg font-semibold text-text-primary">{t("hiring.panel.offerTerms")}</h3>
          <dl className="mt-2">
            <DataRow label={t("hiring.panel.role")} value={version.jobTitle} />
            <DataRow label={t("hiring.panel.salary")} value={salaryText(version) ?? t("hiring.panel.notSpecified")} />
            <DataRow label={t("hiring.panel.startDate")} value={longDate(version.employmentStartDate) ?? t("hiring.panel.undefined")} />
            <DataRow label={t("hiring.panel.offerExpires")} value={longDate(version.validUntil) ?? t("hiring.panel.noExpiry")} />
            <DataRow label="Estado" value={hiringOfferStatusLabel(contract.jobOffer?.status)} />
          </dl>
        </section>
      ) : (
        <InlineFeedback tone="info" title={t("hiring.panel.noOfferLinked")}>
          La oferta se redacta en el perfil de reclutamiento de la persona. Aquí eliges cuál enviar.
        </InlineFeedback>
      )}

      <HiringBlockerList state={state} candidateName={contract.candidate.fullName.split(" ")[0] || "la persona"} />

      {canUpdate && !contract.jobOfferId ? (
        <div className="space-y-3 border-t border-border-default pt-5">
          {offers.isLoading ? <p className="text-base text-text-secondary">{t("hiring.panel.loadingOffers")}</p> : null}
          {offers.isError ? <InlineFeedback tone="danger" title={t("hiring.panel.offersError")}>{t("hiring.panel.offersRetry")}</InlineFeedback> : null}
          {offers.data?.length ? (
            <>
              <label className="block space-y-2 text-base font-medium text-text-primary" htmlFor="hiring-offer-select">
                Elige la oferta que se enviará
                <select
                  id="hiring-offer-select"
                  value={selectedOfferId}
                  onChange={(event) => setSelectedOfferId(event.target.value)}
                  className="min-h-11 w-full rounded-xl border border-border-default bg-surface-elevated px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
                >
                  <option value="">{t("hiring.panel.selectOffer")}</option>
                  {offers.data.map((offer) => (
                    <option key={offer.id} value={offer.id}>
                      Versión {offer.currentVersion} · {hiringOfferStatusLabel(offer.status)}
                    </option>
                  ))}
                </select>
              </label>
              <Button size="lg" onClick={() => link.mutate()} loading={link.isPending} loadingLabel={t("hiring.panel.linkingOffer")} disabled={!selectedOfferId}>
                Vincular oferta
              </Button>
            </>
          ) : offers.isSuccess ? (
            <InlineFeedback tone="info" title={t("hiring.panel.noOffers")} action={<Button asChild variant="secondary"><Link href={`/ats/candidates/${contract.applicationId}#job-offers`}>{t("hiring.panel.createOffer")}</Link></Button>}>
              Primero hay que redactar la oferta en el perfil de reclutamiento. Cuando exista, vuelve aquí para enviarla.
            </InlineFeedback>
          ) : null}
        </div>
      ) : null}

      {canUpdate && contract.jobOfferId && !waitingResponse && !state.completed && !state.cancelled ? (
        <div className="flex flex-col gap-3 border-t border-border-default pt-5 sm:flex-row sm:items-center">
          <Button size="lg" onClick={() => send.mutate()} loading={send.isPending} loadingLabel={t("hiring.panel.sendingOffer")}>
            Enviar oferta
            <ArrowRight className="size-5" aria-hidden="true" />
          </Button>
          <p className="text-base text-text-secondary">{contract.candidate.fullName.split(" ")[0]} recibirá la oferta y podrá aceptarla o rechazarla.</p>
        </div>
      ) : null}

      {canUpdate && waitingResponse ? (
        <div className="space-y-3 border-t border-border-default pt-5">
          <p className="text-base text-text-primary">Cuando {contract.candidate.fullName.split(" ")[0]} te dé su respuesta, regístrala aquí.</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={() => respond.mutate({ accepted: true })} loading={respond.isPending} loadingLabel={t("vacancies.saving")}>
              Aceptó la oferta
            </Button>
            <Button size="lg" variant="secondary" onClick={() => setRejecting(true)} disabled={respond.isPending}>
              No aceptó la oferta
            </Button>
          </div>
        </div>
      ) : null}

      {send.isSuccess ? <InlineFeedback tone="success" title={`Oferta enviada a ${contract.candidate.fullName}`}>{t("hiring.panel.waitingAnswer")}</InlineFeedback> : null}
      {respond.isSuccess ? <InlineFeedback tone="success" title="Respuesta registrada">{t("hiring.panel.advanced")}</InlineFeedback> : null}
      {failure ? <InlineFeedback tone="danger" title={t("hiring.panel.actionFailed")}>{hiringErrorMessage(failure, locale)}</InlineFeedback> : null}

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
  return (
    <li className="flex flex-col gap-3 border-b border-border-default py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-base font-medium text-text-primary">
          {settled ? <CircleCheck className="size-5 shrink-0 text-status-success" aria-hidden="true" /> : <FileText className="size-5 shrink-0 text-text-secondary" aria-hidden="true" />}
          {document.title}
        </p>
        <p className="mt-1 text-base text-text-secondary">
          {hiringDocumentTypeLabel(document.type, locale)} · {hiringDocumentStatusLabel(document.status, locale)}
          {document.required ? "" : t("hiring.panel.optional")}
        </p>
        {document.rejectionReason ? <p className="mt-1 text-base text-text-primary">{t("hiring.panel.fixReason")} {document.rejectionReason}</p> : null}
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

  return (
    <StagePanel stage="DOCUMENTOS" onBack={onBack}>
      <HiringBlockerList state={state} candidateName={firstName} />

      <section aria-labelledby="documentos-lista">
        <h3 id="documentos-lista" className="text-lg font-semibold text-text-primary">{t("hiring.panel.documents")}</h3>
        {documents.length ? (
          <ul className="mt-2 rounded-2xl border border-border-default bg-surface-elevated px-4">
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
          <p className="mt-2 text-base text-text-secondary">{t("hiring.panel.noDocsYet")}</p>
        )}
      </section>

      {canRequest && !state.completed && !state.cancelled ? (
        <section aria-labelledby="documentos-solicitar" className="space-y-3 border-t border-border-default pt-5">
          <h3 id="documentos-solicitar" className="text-lg font-semibold text-text-primary">{t("hiring.panel.askDocFrom", { name: firstName })}</h3>
          {missing.length ? (
            <div className="flex flex-wrap gap-2">
              {missing.map((template) => (
                <Button key={template.type} variant="secondary" onClick={() => request.mutate({ type: template.type, title: t(template.titleKey) })} loading={request.isPending} loadingLabel={t("hiring.panel.requesting")}>
                  {t(template.titleKey)}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-base text-text-secondary">{t("hiring.panel.threeAsked")}</p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="flex-1 space-y-2 text-base font-medium text-text-primary" htmlFor="hiring-custom-document">
              ¿Necesitas otro documento?
              <Input id="hiring-custom-document" value={customTitle} onChange={(event) => setCustomTitle(event.target.value)} placeholder={t("hiring.panel.docPlaceholder")} className="text-base" />
            </label>
            <Button className="sm:self-end" onClick={() => request.mutate({ type: "OTHER", title: customTitle.trim() })} disabled={!customTitle.trim()} loading={request.isPending} loadingLabel="Pidiendo…">
              Pedir este documento
            </Button>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="documentos-firmas" className="space-y-3 border-t border-border-default pt-5">
        <h3 id="documentos-firmas" className="flex items-center gap-2 text-lg font-semibold text-text-primary">
          <PenLine className="size-5 text-text-secondary" aria-hidden="true" />
          Firmas electrónicas
        </h3>
        <InlineFeedback tone="info" title={t("hiring.panel.signAtConfirm")}>
          El sistema necesita el expediente del empleado creado para poder enviar los documentos a firma, y ese expediente se crea al confirmar. Primero reúne y aprueba los documentos de arriba.
        </InlineFeedback>
      </section>

      {request.isSuccess ? <InlineFeedback tone="success" title={t("hiring.panel.docRequested")}>{firstName} verá el documento en su lista de pendientes.</InlineFeedback> : null}
      {review.isSuccess ? <InlineFeedback tone="success" title={t("hiring.panel.docUpdated")}>{t("hiring.panel.progressRecalculated")}</InlineFeedback> : null}
      {request.error || review.error ? <InlineFeedback tone="danger" title={t("hiring.panel.actionFailed")}>{hiringErrorMessage(request.error ?? review.error, locale)}</InlineFeedback> : null}

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
  const { locale, t } = useLocale();
  const { can } = useAppStore();
  const canUpdate = can("applications.update");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const client = useQueryClient();
  const confirm = useMutation({ mutationFn: () => confirmHiringContract(contract.id), onSuccess: async () => { await onRefresh(); await client.invalidateQueries({ queryKey: ["hiring-contracts"] }); } });

  const version = currentOfferVersion(contract);
  const approved = documents.filter((document) => ["APPROVED", "SIGNED", "WAIVED"].includes(document.status)).length;
  const firstName = contract.candidate.fullName.split(" ")[0] || "la persona";

  return (
    <StagePanel stage="REVISION" onBack={onBack}>
      <p className="text-base text-text-primary">{t("hiring.panel.reviewSummary")}</p>

      <dl className="rounded-2xl border border-border-default bg-surface-elevated px-4">
        <DataRow label={t("hiring.panel.person")} value={`${contract.candidate.fullName} · ${contract.candidate.email}`} />
        <DataRow label={t("hiring.panel.roleAndBranch")} value={`${contract.roleTitle ?? contract.vacancy.title} · ${contract.branch.name}`} />
        <DataRow label={t("hiring.panel.agreedSalary")} value={salaryText(version) ?? t("hiring.panel.notInOffer")} />
        <DataRow label={t("hiring.panel.startDate")} value={longDate(version?.employmentStartDate) ?? t("hiring.panel.undefined")} />
        <DataRow label="Oferta" value={contract.jobOffer?.acceptedAt ? `Aceptada el ${longDate(contract.jobOffer.acceptedAt)}` : hiringOfferStatusLabel(contract.jobOffer?.status)} />
        <DataRow label={t("hiring.panel.docsLabel")} value={documents.length ? `${approved} de ${documents.length} aprobados` : t("hiring.panel.noDocsRequested")} />
        <DataRow label={t("hiring.panel.pendingRequirements")} value={state.pendingDocuments ? `${state.pendingDocuments} documento(s) por aprobar` : "Ninguno"} />
        <DataRow label={t("hiring.panel.accessGranted")} value={t("hiring.panel.accessDescription")} />
      </dl>

      <HiringBlockerList state={state} candidateName={firstName} />

      {canUpdate && state.canConfirm ? (
        <div className="space-y-3 border-t border-border-default pt-5">
          <InlineFeedback tone="info" title={t("hiring.panel.whatHappens")}>
            Se creará el perfil de empleado de {contract.candidate.fullName}, sus documentos pasarán a su expediente y se preparará su acceso a la plataforma. Si tu empresa tiene incorporación, también se abrirá su plan de bienvenida.
          </InlineFeedback>
          <Button size="lg" onClick={() => setConfirmOpen(true)} loading={confirm.isPending} loadingLabel="Confirmando…">
            Confirmar contratación
            <ArrowRight className="size-5" aria-hidden="true" />
          </Button>
        </div>
      ) : canUpdate ? (
        <InlineFeedback tone="warning" title={t("hiring.panel.cannotConfirm")}>
          {state.pendingDocuments ? `Faltan ${state.pendingDocuments} documento(s) obligatorio(s) por aprobar. Vuelve al paso de documentos para revisarlos.` : t("hiring.panel.needOfferAccepted")}
        </InlineFeedback>
      ) : (
        <InlineFeedback tone="info" title={t("hiring.panel.readOnly")}>
          Tu perfil permite revisar esta contratación, pero no cerrarla. Pídeselo a la persona responsable de recursos humanos.
        </InlineFeedback>
      )}

      {confirm.error ? <InlineFeedback tone="danger" title={t("hiring.panel.closeFailed")}>{hiringErrorMessage(confirm.error, locale)}</InlineFeedback> : null}

      <HiringConfirmDialog
        open={confirmOpen}
        title={t("hiring.panel.confirmHiring")}
        description={`Se creará el perfil de empleado de ${contract.candidate.fullName}, se vincularán sus documentos y se preparará su acceso a la plataforma.`}
        confirmLabel={t("hiring.panel.confirmYes")}
        onOpenChange={setConfirmOpen}
        onConfirm={() => confirm.mutate()}
      />
    </StagePanel>
  );
}

/* ------------------------------- Etapa 5 -------------------------------- */

export function OutcomePanel({ contract, onRefresh }: { contract: HiringContractDto; onRefresh: () => Promise<void> }) {
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
      <InlineFeedback tone="success" title={t("hiring.panel.completed")}>
        {contract.employee ? `${contract.employee.name} ya forma parte del equipo.` : t("hiring.panel.profileCreated")}
      </InlineFeedback>

      <dl className="rounded-2xl border border-border-default bg-surface-elevated px-4">
        <DataRow label="Empleado" value={contract.employee ? `${contract.employee.name} · ${contract.employee.email}` : contract.candidate.fullName} />
        <DataRow label={t("hiring.panel.activationDate")} value={longDate(contract.hiredAt) ?? "Hoy"} />
        <DataRow label="Acceso" value={t("hiring.panel.accountConfigured")} />
        <DataRow label={t("hiring.panel.welcomePlan")} value={contract.onboardingFlowId ? t("hiring.panel.openAndReady") : t("hiring.panel.noOnboarding")} />
      </dl>

      <section aria-labelledby="resultado-firmas" className="space-y-3 border-t border-border-default pt-5">
        <h3 id="resultado-firmas" className="text-lg font-semibold text-text-primary">{t("hiring.panel.signatures")}</h3>
        {signatures.isLoading ? <p className="text-base text-text-secondary">{t("hiring.panel.loadingSignatures")}</p> : null}
        {status?.allCompleted ? (
          <InlineFeedback tone="success" title={t("hiring.panel.allSigned")}>{t("hiring.panel.nothingToSign")}</InlineFeedback>
        ) : status?.allSent ? (
          <InlineFeedback tone="warning" title={`Esperando la firma de ${contract.candidate.fullName.split(" ")[0]}`}>{t("hiring.panel.gotByEmail")}</InlineFeedback>
        ) : (
          <InlineFeedback tone="info" title={t("hiring.panel.needToSend")}>{t("hiring.panel.canSendNow")}</InlineFeedback>
        )}
        {status?.documents?.length ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {status.documents.map((document) => (
              <li key={document.templateKey} className="rounded-xl border border-border-default p-3">
                <p className="text-base font-medium text-text-primary">{hiringTemplateLabel(document.templateKey)}</p>
                <p className="mt-1 text-base text-text-secondary">{hiringSignatureStatusLabel(document.status)}</p>
              </li>
            ))}
          </ul>
        ) : null}
        {canSign ? (
          <Button size="lg" variant={status?.allSent ? "secondary" : "default"} onClick={() => send.mutate()} loading={send.isPending} loadingLabel="Enviando…">
            {status?.allSent ? t("hiring.panel.sendReminder") : t("hiring.panel.sendToSign")}
          </Button>
        ) : null}
        {send.error ? <InlineFeedback tone="danger" title={t("hiring.panel.sendFailed")}>{hiringErrorMessage(send.error, locale)}</InlineFeedback> : null}
      </section>

      <div className="flex flex-col gap-3 border-t border-border-default pt-5 sm:flex-row">
        {contract.employeeId ? (
          <Button asChild size="lg">
            <Link href={`/employees/${contract.employeeId}`}>{t("hiring.panel.seeEmployee")}<ArrowRight className="size-5" aria-hidden="true" /></Link>
          </Button>
        ) : null}
        {contract.onboardingFlowId ? (
          <Button asChild size="lg" variant="secondary">
            <Link href="/onboarding">{t("hiring.panel.openWelcome")}</Link>
          </Button>
        ) : null}
      </div>
    </StagePanel>
  );
}

/* ------------------------------ Cancelada ------------------------------- */

export function CancelledPanel({ contract }: { contract: HiringContractDto }) {
  const { t } = useLocale();
  return (
    <Card level={1}>
      <CardHeader>
        <CardTitle className="text-2xl">{t("hiring.panel.cancelled")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-5 pt-0 sm:p-7 sm:pt-0">
        <p className="text-base text-text-primary">{t("hiring.panel.cancelledBody")}</p>
        {contract.cancelledReason ? (
          <div className="rounded-2xl border border-border-default bg-surface-elevated p-4">
            <p className="text-base text-text-secondary">{t("hiring.panel.reasonOnFile")}</p>
            <p className="mt-1 text-base font-medium text-text-primary">{contract.cancelledReason}</p>
          </div>
        ) : null}
        <Badge variant="destructive" className="text-sm">Cancelada el {longDate(contract.cancelledAt) ?? "—"}</Badge>
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
