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
} from "@/lib/hiring-ux";
import { useAppStore } from "@/store/app-store";

/**
 * Traduce el error del servidor a algo accionable.
 *
 * "Error desconocido" y "Algo salió mal" no le sirven a nadie: la persona no
 * sabe si debe reintentar, avisar a alguien o corregir un dato.
 */
export function hiringErrorMessage(error: unknown) {
  const raw = error instanceof Error ? error.message : "";
  if (/empleado asociado/i.test(raw)) return "Las firmas electrónicas todavía no se pueden enviar porque el expediente del empleado aún no existe. Se creará al confirmar la contratación.";
  if (/oferta debe estar aceptada/i.test(raw)) return "Todavía no se puede cerrar la contratación: falta que la persona acepte la oferta.";
  if (/faltan documentos obligatorios/i.test(raw)) return "Faltan documentos obligatorios por aprobar. Revísalos en la etapa de documentos y vuelve a intentarlo.";
  if (/ya está cerrada/i.test(raw)) return "Esta contratación ya fue cerrada. Actualiza la página para ver el resultado.";
  if (/network|fetch|failed/i.test(raw)) return "No hay conexión con el servidor. Revisa tu conexión e inténtalo otra vez; no se perdió nada de lo que escribiste.";
  return raw || "El servidor no pudo completar la acción. Inténtalo otra vez en unos segundos.";
}

function StagePanel({ stage, children, onBack }: { stage: HiringStageId; children: React.ReactNode; onBack?: () => void }) {
  const info = hiringStage(stage);
  return (
    <Card level={1}>
      <CardContent className="space-y-6 p-5 sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-base font-medium text-text-secondary">Paso {info.step} de {HIRING_STAGES.length}</p>
            <h2 className="mt-1 text-2xl font-semibold text-text-primary">{info.title}</h2>
            <p className="mt-2 max-w-2xl text-base text-text-secondary">{info.summary}</p>
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
  const responsible = contract.hrResponsibleUser ?? contract.hiringManagerUser;
  const responsibleName = responsible ? [responsible.firstName, responsible.lastName].filter(Boolean).join(" ") : null;
  return (
    <StagePanel stage="PREPARACION">
      <p className="text-base text-text-primary">Comprobemos que estos datos son correctos. Vienen de la postulación, así que no hace falta volver a escribirlos.</p>
      <dl className="rounded-2xl border border-border-default bg-surface-elevated px-4">
        <DataRow label="Persona" value={contract.candidate.fullName} />
        <DataRow label="Puesto" value={contract.roleTitle ?? contract.vacancy.title} />
        <DataRow label="Empresa" value={contract.vacancy.tenant?.name ?? "Empresa activa"} />
        <DataRow label="Sucursal" value={contract.branch.name} />
        <DataRow label="Responsable de la contratación" value={responsibleName ?? "Sin asignar todavía"} />
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
          <h3 id="oferta-condiciones" className="text-lg font-semibold text-text-primary">Condiciones de la oferta</h3>
          <dl className="mt-2">
            <DataRow label="Puesto" value={version.jobTitle} />
            <DataRow label="Sueldo" value={salaryText(version) ?? "No especificado"} />
            <DataRow label="Fecha de inicio" value={longDate(version.employmentStartDate) ?? "Sin definir"} />
            <DataRow label="La oferta vence el" value={longDate(version.validUntil) ?? "Sin vencimiento"} />
            <DataRow label="Estado" value={hiringOfferStatusLabel(contract.jobOffer?.status)} />
          </dl>
        </section>
      ) : (
        <InlineFeedback tone="info" title="Todavía no hay una oferta vinculada">
          La oferta se redacta en el perfil de reclutamiento de la persona. Aquí eliges cuál enviar.
        </InlineFeedback>
      )}

      <HiringBlockerList state={state} candidateName={contract.candidate.fullName.split(" ")[0] || "la persona"} />

      {canUpdate && !contract.jobOfferId ? (
        <div className="space-y-3 border-t border-border-default pt-5">
          {offers.isLoading ? <p className="text-base text-text-secondary">Buscando las ofertas disponibles…</p> : null}
          {offers.isError ? <InlineFeedback tone="danger" title="No pudimos cargar las ofertas">Vuelve a intentarlo o revisa la oferta desde el perfil de reclutamiento.</InlineFeedback> : null}
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
                  <option value="">Selecciona una oferta</option>
                  {offers.data.map((offer) => (
                    <option key={offer.id} value={offer.id}>
                      Versión {offer.currentVersion} · {hiringOfferStatusLabel(offer.status)}
                    </option>
                  ))}
                </select>
              </label>
              <Button size="lg" onClick={() => link.mutate()} loading={link.isPending} loadingLabel="Vinculando la oferta…" disabled={!selectedOfferId}>
                Vincular oferta
              </Button>
            </>
          ) : offers.isSuccess ? (
            <InlineFeedback tone="info" title="No hay ninguna oferta preparada" action={<Button asChild variant="secondary"><Link href={`/ats/candidates/${contract.applicationId}#job-offers`}>Crear la oferta</Link></Button>}>
              Primero hay que redactar la oferta en el perfil de reclutamiento. Cuando exista, vuelve aquí para enviarla.
            </InlineFeedback>
          ) : null}
        </div>
      ) : null}

      {canUpdate && contract.jobOfferId && !waitingResponse && !state.completed && !state.cancelled ? (
        <div className="flex flex-col gap-3 border-t border-border-default pt-5 sm:flex-row sm:items-center">
          <Button size="lg" onClick={() => send.mutate()} loading={send.isPending} loadingLabel="Enviando la oferta…">
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
            <Button size="lg" onClick={() => respond.mutate({ accepted: true })} loading={respond.isPending} loadingLabel="Guardando…">
              Aceptó la oferta
            </Button>
            <Button size="lg" variant="secondary" onClick={() => setRejecting(true)} disabled={respond.isPending}>
              No aceptó la oferta
            </Button>
          </div>
        </div>
      ) : null}

      {send.isSuccess ? <InlineFeedback tone="success" title={`Oferta enviada a ${contract.candidate.fullName}`}>Ahora estamos esperando su respuesta. Te avisaremos cuando conteste.</InlineFeedback> : null}
      {respond.isSuccess ? <InlineFeedback tone="success" title="Respuesta registrada">La contratación avanzó al siguiente paso.</InlineFeedback> : null}
      {failure ? <InlineFeedback tone="danger" title="No pudimos completar la acción">{hiringErrorMessage(failure)}</InlineFeedback> : null}

      <HiringReasonDialog
        open={rejecting}
        title="Registrar que no aceptó la oferta"
        description="Escribe el motivo. Quedará guardado en el historial de la contratación."
        confirmLabel="Guardar respuesta"
        onOpenChange={setRejecting}
        onConfirm={(reason) => respond.mutate({ accepted: false, reason })}
      />
    </StagePanel>
  );
}

/* ------------------------------- Etapa 3 -------------------------------- */

const DOCUMENT_TEMPLATES = [
  { type: "IDENTIFICATION", title: "Identificación oficial" },
  { type: "TAX", title: "Información fiscal" },
  { type: "ELIGIBILITY", title: "Permiso para trabajar" },
];

function DocumentRow({ document, onApprove, onReject, canUpdate, pending }: { document: HiringContractDocumentDto; onApprove: () => void; onReject: () => void; canUpdate: boolean; pending: boolean }) {
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
          {hiringDocumentTypeLabel(document.type)} · {hiringDocumentStatusLabel(document.status)}
          {document.required ? "" : " · Opcional"}
        </p>
        {document.rejectionReason ? <p className="mt-1 text-base text-text-primary">Motivo de la corrección: {document.rejectionReason}</p> : null}
      </div>
      {canUpdate && reviewable ? (
        <div className="flex flex-wrap gap-2">
          <Button onClick={onApprove} loading={pending} loadingLabel="Guardando…">Aprobar documento</Button>
          <Button variant="secondary" onClick={onReject} disabled={pending}>Pedir corrección</Button>
        </div>
      ) : null}
    </li>
  );
}

export function DocumentsPanel({ contract, state, documents, onBack, onRefresh }: { contract: HiringContractDto; state: HiringCaseState; documents: HiringContractDocumentDto[]; onBack?: () => void; onRefresh: () => Promise<void> }) {
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
        <h3 id="documentos-lista" className="text-lg font-semibold text-text-primary">Documentos de esta contratación</h3>
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
          <p className="mt-2 text-base text-text-secondary">Todavía no has pedido ningún documento. Empieza por los tres habituales.</p>
        )}
      </section>

      {canRequest && !state.completed && !state.cancelled ? (
        <section aria-labelledby="documentos-solicitar" className="space-y-3 border-t border-border-default pt-5">
          <h3 id="documentos-solicitar" className="text-lg font-semibold text-text-primary">Pedir un documento a {firstName}</h3>
          {missing.length ? (
            <div className="flex flex-wrap gap-2">
              {missing.map((template) => (
                <Button key={template.type} variant="secondary" onClick={() => request.mutate(template)} loading={request.isPending} loadingLabel="Pidiendo…">
                  {template.title}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-base text-text-secondary">Ya pediste los tres documentos habituales.</p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="flex-1 space-y-2 text-base font-medium text-text-primary" htmlFor="hiring-custom-document">
              ¿Necesitas otro documento?
              <Input id="hiring-custom-document" value={customTitle} onChange={(event) => setCustomTitle(event.target.value)} placeholder="Por ejemplo: Licencia de conducir" className="text-base" />
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
        <InlineFeedback tone="info" title="Las firmas se envían al confirmar la contratación">
          El sistema necesita el expediente del empleado creado para poder enviar los documentos a firma, y ese expediente se crea al confirmar. Primero reúne y aprueba los documentos de arriba.
        </InlineFeedback>
      </section>

      {request.isSuccess ? <InlineFeedback tone="success" title="Documento solicitado">{firstName} verá el documento en su lista de pendientes.</InlineFeedback> : null}
      {review.isSuccess ? <InlineFeedback tone="success" title="Documento actualizado">El avance de la contratación se recalculó.</InlineFeedback> : null}
      {request.error || review.error ? <InlineFeedback tone="danger" title="No pudimos completar la acción">{hiringErrorMessage(request.error ?? review.error)}</InlineFeedback> : null}

      <HiringReasonDialog
        open={Boolean(rejectingId)}
        title="Pedir una corrección"
        description={`${firstName} verá este motivo y podrá volver a enviar el documento.`}
        confirmLabel="Pedir corrección"
        onOpenChange={(open) => !open && setRejectingId(null)}
        onConfirm={(reason) => { if (rejectingId) review.mutate({ id: rejectingId, status: "REJECTED", reason }); setRejectingId(null); }}
      />
    </StagePanel>
  );
}

/* ------------------------------- Etapa 4 -------------------------------- */

export function ReviewPanel({ contract, state, documents, onBack, onRefresh }: { contract: HiringContractDto; state: HiringCaseState; documents: HiringContractDocumentDto[]; onBack?: () => void; onRefresh: () => Promise<void> }) {
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
      <p className="text-base text-text-primary">Revisa este resumen. Si todo está bien, ya puedes cerrar la contratación.</p>

      <dl className="rounded-2xl border border-border-default bg-surface-elevated px-4">
        <DataRow label="Persona" value={`${contract.candidate.fullName} · ${contract.candidate.email}`} />
        <DataRow label="Puesto y sucursal" value={`${contract.roleTitle ?? contract.vacancy.title} · ${contract.branch.name}`} />
        <DataRow label="Sueldo acordado" value={salaryText(version) ?? "No especificado en la oferta"} />
        <DataRow label="Fecha de inicio" value={longDate(version?.employmentStartDate) ?? "Sin definir"} />
        <DataRow label="Oferta" value={contract.jobOffer?.acceptedAt ? `Aceptada el ${longDate(contract.jobOffer.acceptedAt)}` : hiringOfferStatusLabel(contract.jobOffer?.status)} />
        <DataRow label="Documentos" value={documents.length ? `${approved} de ${documents.length} aprobados` : "No se pidieron documentos"} />
        <DataRow label="Requisitos pendientes" value={state.pendingDocuments ? `${state.pendingDocuments} documento(s) por aprobar` : "Ninguno"} />
        <DataRow label="Acceso que recibirá" value="Cuenta de empleado en la plataforma, con el perfil de su puesto" />
      </dl>

      <HiringBlockerList state={state} candidateName={firstName} />

      {canUpdate && state.canConfirm ? (
        <div className="space-y-3 border-t border-border-default pt-5">
          <InlineFeedback tone="info" title="Qué ocurrirá al confirmar">
            Se creará el perfil de empleado de {contract.candidate.fullName}, sus documentos pasarán a su expediente y se preparará su acceso a la plataforma. Si tu empresa tiene incorporación, también se abrirá su plan de bienvenida.
          </InlineFeedback>
          <Button size="lg" onClick={() => setConfirmOpen(true)} loading={confirm.isPending} loadingLabel="Confirmando…">
            Confirmar contratación
            <ArrowRight className="size-5" aria-hidden="true" />
          </Button>
        </div>
      ) : canUpdate ? (
        <InlineFeedback tone="warning" title="Todavía no puedes confirmar la contratación">
          {state.pendingDocuments ? `Faltan ${state.pendingDocuments} documento(s) obligatorio(s) por aprobar. Vuelve al paso de documentos para revisarlos.` : "Falta que la oferta esté aceptada antes de poder cerrar la contratación."}
        </InlineFeedback>
      ) : (
        <InlineFeedback tone="info" title="Solo puedes consultar">
          Tu perfil permite revisar esta contratación, pero no cerrarla. Pídeselo a la persona responsable de recursos humanos.
        </InlineFeedback>
      )}

      {confirm.error ? <InlineFeedback tone="danger" title="No pudimos cerrar la contratación">{hiringErrorMessage(confirm.error)}</InlineFeedback> : null}

      <HiringConfirmDialog
        open={confirmOpen}
        title="Confirmar contratación"
        description={`Se creará el perfil de empleado de ${contract.candidate.fullName}, se vincularán sus documentos y se preparará su acceso a la plataforma.`}
        confirmLabel="Sí, confirmar contratación"
        onOpenChange={setConfirmOpen}
        onConfirm={() => confirm.mutate()}
      />
    </StagePanel>
  );
}

/* ------------------------------- Etapa 5 -------------------------------- */

export function OutcomePanel({ contract, onRefresh }: { contract: HiringContractDto; onRefresh: () => Promise<void> }) {
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
      <InlineFeedback tone="success" title="Contratación completada">
        {contract.employee ? `${contract.employee.name} ya forma parte del equipo.` : "El perfil del empleado fue creado correctamente."}
      </InlineFeedback>

      <dl className="rounded-2xl border border-border-default bg-surface-elevated px-4">
        <DataRow label="Empleado" value={contract.employee ? `${contract.employee.name} · ${contract.employee.email}` : contract.candidate.fullName} />
        <DataRow label="Fecha de activación" value={longDate(contract.hiredAt) ?? "Hoy"} />
        <DataRow label="Acceso" value="Cuenta de empleado configurada en la plataforma" />
        <DataRow label="Plan de bienvenida" value={contract.onboardingFlowId ? "Abierto y listo para continuar" : "Tu empresa no tiene incorporación activada"} />
      </dl>

      <section aria-labelledby="resultado-firmas" className="space-y-3 border-t border-border-default pt-5">
        <h3 id="resultado-firmas" className="text-lg font-semibold text-text-primary">Firmas electrónicas</h3>
        {signatures.isLoading ? <p className="text-base text-text-secondary">Consultando el estado de las firmas…</p> : null}
        {status?.allCompleted ? (
          <InlineFeedback tone="success" title="Todo firmado">No queda nada pendiente de firma.</InlineFeedback>
        ) : status?.allSent ? (
          <InlineFeedback tone="warning" title={`Esperando la firma de ${contract.candidate.fullName.split(" ")[0]}`}>Ya recibió los documentos por correo. Puedes enviarle un recordatorio.</InlineFeedback>
        ) : (
          <InlineFeedback tone="info" title="Falta enviar los documentos a firma">Ahora que el expediente existe, puedes enviarlos.</InlineFeedback>
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
            {status?.allSent ? "Enviar recordatorio" : "Enviar a firma"}
          </Button>
        ) : null}
        {send.error ? <InlineFeedback tone="danger" title="No pudimos enviar los documentos">{hiringErrorMessage(send.error)}</InlineFeedback> : null}
      </section>

      <div className="flex flex-col gap-3 border-t border-border-default pt-5 sm:flex-row">
        {contract.employeeId ? (
          <Button asChild size="lg">
            <Link href={`/employees/${contract.employeeId}`}>Ver empleado<ArrowRight className="size-5" aria-hidden="true" /></Link>
          </Button>
        ) : null}
        {contract.onboardingFlowId ? (
          <Button asChild size="lg" variant="secondary">
            <Link href="/onboarding">Abrir plan de bienvenida</Link>
          </Button>
        ) : null}
      </div>
    </StagePanel>
  );
}

/* ------------------------------ Cancelada ------------------------------- */

export function CancelledPanel({ contract }: { contract: HiringContractDto }) {
  return (
    <Card level={1}>
      <CardHeader>
        <CardTitle className="text-2xl">Esta contratación fue cancelada</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-5 pt-0 sm:p-7 sm:pt-0">
        <p className="text-base text-text-primary">No hay nada pendiente por hacer. Puedes consultar lo que ocurrió en el historial.</p>
        {contract.cancelledReason ? (
          <div className="rounded-2xl border border-border-default bg-surface-elevated p-4">
            <p className="text-base text-text-secondary">Motivo registrado</p>
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
