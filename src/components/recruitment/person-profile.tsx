"use client";

import { useUiText } from "@/components/ui-copy";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, ArrowRight, Briefcase, CalendarClock, CalendarPlus, Check, CheckCircle2, Circle, CircleDot, ClipboardCheck, Download, ExternalLink, Lock, Mail, MapPin, Phone, RotateCcw, User } from "lucide-react";
import { toast } from "sonner";
import { AsyncState } from "@/components/async-state";
import { DecisionCommitteeCard } from "@/components/decision-committee-card";
import { JobOfferManager } from "@/components/job-offer-manager";
import { ScorecardDialog } from "@/components/scorecard-dialog";
import { ActionBar, InlineFeedback, PageHeader } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { applicationStageLabel, formatApplicationDate } from "@/lib/applications";
import { agruparRespuestas } from "@/lib/application-answers";
import { planDeContratacion, type PasoContratacion, type PasoId } from "@/lib/hiring-next-step";

/** Las operaciones que un paso puede pedir que se ejecuten. */
type OperacionDePaso = "agendar-entrevista" | "crear-contratacion" | "enviar-documentos";
import { createDocuSealHiringBundle, createDocuSealHiringBundleForApplication, createHiringContract, fetchApplication, fetchApplicationDecisionEvidence, fetchAtsCommunicationHistory, fetchDocuSealHiringBundleStatus, fetchHiringContracts, fetchInterviewScorecardComparison, fetchInterviewerProfiles, fetchJobOffers, fetchRejectionReasons, fetchResumeAccess, retryAtsCommunication, scheduleRecruitmentInterview, updateApplication, getApiErrorMessage } from "@/lib/backend";
import type { AtsMessageDto, CalendarProvider, JobOfferDto, ScorecardComparisonDto, VacancyApplicationDto } from "@/lib/contracts";
import { cn } from "@/lib/utils";
import { technicalLabel } from "@/lib/ui-labels";
import { useAppStore } from "@/store/app-store";
import { useLocale } from "@/components/locale-provider";

export function PersonProfilePage({ applicationId: id }: { applicationId: string }) {
  const { t } = useLocale();
  const application = useQuery({ queryKey: ["application", id], queryFn: () => fetchApplication(id), enabled: Boolean(id) });
  return <div className="space-y-6"><Button asChild variant="ghost"><Link href="/ats/candidates"><ArrowLeft className="size-4" />{t("p360.back")}</Link></Button>{application.isLoading ? <AsyncState state="loading" title={t("p360.loading")} /> : null}{application.isError ? <AsyncState state="error" title={t("p360.loadError")} onRetry={() => void application.refetch()} /> : null}{application.data ? <CandidateProfile application={application.data} /> : null}</div>;
}

function CandidateProfile({ application }: { application: VacancyApplicationDto }) {
  const uiText = useUiText();
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { can } = useAppStore();
  /*
   * Qué paso se está mirando. Antes había DOS navegaciones para el mismo
   * proceso: la cadena de siete pasos y, debajo, cuatro pestañas con otros
   * nombres —Revisar, Evaluar, Decidir, Transferir— que eran otra partición de
   * lo mismo. Dos mapas del mismo viaje: ninguno se aprende. Ahora la cadena ES
   * la navegación, y cada paso trae debajo lo suyo y su botón para avanzar.
   *
   * `null` significa «el que toca»: al abrir la ficha se mira el paso actual
   * del plan, sin tener que elegir nada.
   */
  const [pasoVisible, setPasoVisible] = useState<PasoId | null>(null);
  /* El agendado se abre desde la cabecera del paso: su estado vive aquí, no
     dentro de la tarjeta de entrevistas. */
  const [agendaAbierta, setAgendaAbierta] = useState(false);
  const [scoreInterviewId, setScoreInterviewId] = useState("");
  const [currentStageId, setCurrentStageId] = useState(application.currentStageId ?? application.currentStage?.id ?? "");
  const [notes, setNotes] = useState(application.notes ?? "");
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionReasonId, setRejectionReasonId] = useState("");
  const [transferOpen, setTransferOpen] = useState(false);
  const [jobTitle, setJobTitle] = useState(application.vacancy.title);
  const [docuSealSent, setDocuSealSent] = useState(false);
  const communications = useQuery({
    queryKey: ["ats-communications", application.id],
    queryFn: () => fetchAtsCommunicationHistory(application.id),
    // Keep delivery badges current while the background worker is processing.
    refetchInterval: (query) => query.state.data?.some((message) => ["PENDING", "PROCESSING"].includes(message.status)) ? 5000 : false,
  });
  const offers = useQuery({ queryKey: ["job-offers", application.id], queryFn: () => fetchJobOffers(application.id) });
  /*
   * ¿Ya existe un expediente de contratación para esta postulación?
   *
   * Sin esta consulta la pantalla ofrecía «Enviar a contratación» aunque ya
   * hubiera uno abierto, y el servidor respondía 409 —«Ya existe una
   * contratación activa»— DESPUÉS de que la persona confirmara en un diálogo.
   * El endpoint no filtra por postulación, así que se busca por el nombre de
   * la persona y se compara por `applicationId`, que sí viene en la respuesta.
   */
  const contrataciones = useQuery({
    queryKey: ["hiring-contracts", "por-postulacion", application.id],
    queryFn: () => fetchHiringContracts({ search: application.candidate.fullName, pageSize: 50 }),
    enabled: application.status === "APPROVED" || application.status === "HIRED",
  });
  const contratacionAbierta = contrataciones.data?.data.find((contrato) => contrato.applicationId === application.id && contrato.isActive !== false) ?? null;
  const rejectionReasons = useQuery({ queryKey: ["application-rejection-reasons"], queryFn: fetchRejectionReasons });
  const resumeAccess = useMutation({ mutationFn: () => fetchResumeAccess(application.id), onSuccess: (access) => window.open(access.url, "_blank", "noopener,noreferrer") });
  const decisionEvidence = useMutation({
    mutationFn: () => fetchApplicationDecisionEvidence(application.id),
    onSuccess: (evidence) => {
      const url = URL.createObjectURL(new Blob([JSON.stringify(evidence, null, 2)], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `expediente-decision-${application.candidate.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    },
  });
  const save = useMutation({ mutationFn: () => updateApplication(application.id, { currentStageId: currentStageId || undefined, reason: rejectionReason.trim() || undefined, rejectionReasonId: rejectionReasonId || undefined, notes: notes.trim() || undefined, interview: application.interview?.type ? { type: application.interview.type, scheduledAt: application.interview.scheduledAt, followUpAt: application.interview.followUpAt, observations: application.interview.observations } : undefined }), onSuccess: async (updated) => { queryClient.setQueryData(["application", application.id], updated); setCurrentStageId(updated.currentStageId ?? updated.currentStage?.id ?? ""); setRejectionReason(""); setRejectionReasonId(""); await queryClient.invalidateQueries({ queryKey: ["applications"] }); } });
  const hiringDocuments = useMutation({ mutationFn: createDocuSealHiringBundle, onSuccess: () => setDocuSealSent(true) });
  const createContract = useMutation({ mutationFn: () => createHiringContract(application.id, { roleTitle: jobTitle.trim() || application.vacancy.title }), onSuccess: async (contract) => { await queryClient.invalidateQueries({ queryKey: ["hiring-contracts"] }); window.location.assign(`/hiring/${contract.id}`); } });
  const docuSealStatus = useQuery({ queryKey: ["docuseal-hiring-status", application.id], queryFn: () => fetchDocuSealHiringBundleStatus(application.id), enabled: application.status === "HIRED", refetchInterval: (query) => query.state.data?.allCompleted ? false : 5000 });
  const resendHiringDocuments = useMutation({ mutationFn: () => createDocuSealHiringBundleForApplication(application.id), onSuccess: async () => { setDocuSealSent(true); await docuSealStatus.refetch(); } });
  const retryMessage = useMutation({ mutationFn: retryAtsCommunication, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["ats-communications", application.id] }); } });
  const gruposDeRespuestas = agruparRespuestas(application.dynamicResponses, application.vacancy.applicationFormSchema);
  const plan = planDeContratacion({
    status: application.status,
    entrevistaAgendada: application.interviews?.some((interview) => interview.status !== "CANCELED") ?? false,
    entrevistaCompletada: application.interviews?.some((interview) => interview.status === "COMPLETED") ?? false,
    oferta: offers.data?.[0]?.status === "ACCEPTED" ? "aceptada" : offers.data?.length ? "enviada" : "ninguna",
    contratacionId: contratacionAbierta?.id ?? null,
    documentos: docuSealStatus.data?.allCompleted ? "completos" : docuSealStatus.data?.allSent || docuSealSent ? "enviados" : "sin-enviar",
    puedeGestionar: can("applications.change_stage"),
    puedeCrearContratacion: can("applications.update") || can("candidates.update") || can("applications.hire"),
    puedeEnviarDocumentos: can("employees.update"),
  });
  const pasoActual = plan.pasos[plan.actual];
  const seleccionado = pasoVisible ?? pasoActual.id;
  const pasoSeleccionado = plan.pasos.find((paso) => paso.id === seleccionado) ?? pasoActual;
  /* Los destinos internos del plan son pasos de la misma cadena. */
  const pasoDeDestino: Record<string, PasoId> = { "#revisar": "postulacion", "#evaluar": "evaluacion", "#decidir": "decision", "#oferta": "contratacion", "#mensajes": "contratacion" };
  const abrirPaso = (paso: PasoId) => {
    setPasoVisible(paso);
    /* La postulación —contacto y formulario— está SIEMPRE a la vista, encima
       de los paneles: es lo que se consulta a cada rato, no un paso que se
       abre y se cierra. Su ficha lleva ahí, no al panel de abajo. */
    const destino = paso === "postulacion" ? "perfil" : "panel-actual";
    requestAnimationFrame(() => document.getElementById(destino)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const stages = [...(application.vacancy.stages ?? [])].sort((a, b) => a.position - b.position);
  const originalStageId = application.currentStageId ?? application.currentStage?.id ?? "";
  const allowedCodes = application.currentStage?.allowedNextStageCodes ?? [];
  const movableStages = stages.filter((stage) => stage.applicationStatus !== "HIRED" && (stage.id === originalStageId || allowedCodes.includes(stage.code)));
  const selectedStage = stages.find((stage) => stage.id === currentStageId);
  const currentStageLabel = application.currentStage?.name ?? applicationStageLabel(application.status);
  const apellidoDelFormulario = typeof application.dynamicResponses?.lastName === "string" ? application.dynamicResponses.lastName.trim() : "";
  const nombreCompleto = apellidoDelFormulario && !application.candidate.fullName.toLowerCase().includes(apellidoDelFormulario.toLowerCase())
    ? `${application.candidate.fullName} ${apellidoDelFormulario}`
    : application.candidate.fullName;
  const links = [{ label: "LinkedIn", href: application.candidate.linkedinUrl }, { label: uiText("Portafolio"), href: application.candidate.portfolioUrl }].filter((item): item is { label: string; href: string } => Boolean(item.href));
  const scorecards = (application.interviews ?? []).flatMap((interview) => (interview.scorecards ?? []).map((scorecard) => ({ interview, scorecard })));

  return <div className="space-y-6"><PageHeader eyebrow={uiText("Perfil 360°")} title={application.candidate.fullName} description={`${application.vacancy.title} · ${application.vacancy.branch?.name ?? t("p360.noBranch")}`} actions={<div className="flex flex-wrap gap-2"><Badge variant="secondary">{currentStageLabel}</Badge>{can("reports.export") ? <Button variant="secondary" onClick={() => decisionEvidence.mutate()} disabled={decisionEvidence.isPending}><Download className="size-4" />{decisionEvidence.isPending ? "Preparando evidencia…" : t("p360.exportRecord")}</Button> : null}</div>} />
    <HiringProgressGuide
      plan={plan}
      creatingContract={createContract.isPending}
      sendingDocuments={resendHiringDocuments.isPending}
      canManage={can("applications.change_stage")}
      canHire={can("applications.hire")}
      onOperar={(operacion) => {
        if (operacion === "agendar-entrevista") { abrirPaso("evaluacion"); setAgendaAbierta(true); return; }
        if (operacion === "crear-contratacion") { setTransferOpen(true); return; }
        resendHiringDocuments.mutate();
      }}
      seleccionado={seleccionado}
      onAbrirPaso={abrirPaso}
      onNavigate={(destino) => abrirPaso(pasoDeDestino[destino] ?? "postulacion")}
    />
    {createContract.isError ? <InlineFeedback tone="danger" title={t("p360.sendFailed")}>{getApiErrorMessage(createContract.error, t("p360.sendFailedBody"))}</InlineFeedback> : null}
    <CandidateContextSummary application={application} />
    {/* Todo lo que la persona dejó al postularse, en un sitio: los datos de
        contacto, sus enlaces y el currículum. Antes el apellido, que viaja en
        las respuestas del formulario, caía al final entre «Otras respuestas»
        en vez de estar junto al nombre. */}
    <Card id="perfil" level={2}>
      <CardHeader><CardTitle>{t("p360.contactInfo")}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Detail icon={<User />} label={uiText("Nombre completo")} value={nombreCompleto} />
          <Detail icon={<Mail />} label={t("p360.email")} value={application.candidate.email} />
          <Detail icon={<Phone />} label={t("p360.phone")} value={application.candidate.phone ?? t("p360.notReported")} />
          <Detail icon={<MapPin />} label={t("p360.city")} value={application.candidate.city ?? t("p360.notReportedF")} />
          <Detail icon={<CalendarClock />} label={uiText("Se postuló el")} value={formatApplicationDate(application.appliedAt)} />
        </dl>
        <div className="flex flex-wrap gap-2 border-t border-line pt-4">
          {links.map((link) => <Button key={link.label} asChild variant="secondary"><a href={link.href} target="_blank" rel="noreferrer">{link.label}<ExternalLink className="size-4" /></a></Button>)}
          {application.candidate.resumeAvailable
            ? <Button variant="secondary" onClick={() => resumeAccess.mutate()} disabled={resumeAccess.isPending}>{resumeAccess.isPending ? uiText("Generando acceso…") : `${uiText("Abrir CV")}${application.candidate.resumeFile ? ` v${application.candidate.resumeFile.version}` : ""}`}<ExternalLink className="size-4" /></Button>
            : <p className="text-sm text-ink-2">{uiText("No adjuntó currículum.")}</p>}
        </div>
        {resumeAccess.isError ? <p className="text-sm text-status-danger">{t("p360.cvError")}</p> : null}
      </CardContent>
    </Card>
    {/* Lo que respondió en el formulario de la vacante, agrupado como se le
        preguntó. Las preguntas propias de la vacante se leen con su propio
        texto y aparecen aunque quedaran en blanco: el hueco también dice
        algo, y no verlo hace pensar que nunca se preguntó. */}
    <Card level={2}>
      <CardHeader><CardTitle>{t("p360.application")}</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <Section title={t("p360.coverLetter")} empty={t("p360.noCoverLetter")}>{application.coverLetter}</Section>
        <section>
          <h3 className="font-semibold text-ink-1">{t("p360.formAnswers")}</h3>
          {gruposDeRespuestas.length ? (
            <div className="mt-3 space-y-5">
              {gruposDeRespuestas.map((grupo) => (
                <div key={grupo.id}>
                  <p className="text-sm font-medium text-ink-2">{uiText(grupo.titulo)}</p>
                  <dl className="mt-2 grid gap-3 sm:grid-cols-2">
                    {grupo.respuestas.map((respuesta) => (
                      <div key={respuesta.clave} className="rounded-lg border border-line bg-surface-2 p-3">
                        <dt className="text-xs text-ink-3">{uiText(respuesta.etiqueta)}</dt>
                        <dd className={cn("mt-1 text-sm", respuesta.valor === "Sin responder" ? "text-ink-3" : "text-ink-1")}>
                          {respuesta.telefono ? (
                            <a href={`tel:${respuesta.telefono}`} className="underline underline-offset-4">{respuesta.telefono}</a>
                          ) : (
                            uiText(respuesta.valor)
                          )}
                          {respuesta.detalle ? <span className="mt-1 block text-ink-2">{respuesta.detalle}</span> : null}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-ink-2">{uiText("El formulario de esta vacante no pedía nada más que los datos de contacto.")}</p>
          )}
        </section>
      </CardContent>
    </Card>

    {/* Un solo sitio para el panel de la pestaña elegida.

        Antes cada pestaña pintaba en un lugar distinto: «Revisar» y «Evaluar»
        en la columna ancha, «Decidir» en la columna estrecha de la derecha y
        «Transferir» ENCIMA de las propias pestañas. Elegir una pestaña movía el
        contenido de sitio y dejaba la columna ancha vacía. */}
    <div id="panel-actual" className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]"><div className="space-y-5">
      {/* Cabecera del paso que se está mirando, con SU botón para avanzarlo.
          Cada etapa tiene el suyo: antes solo había una acción, la del paso
          que tocaba, y para las demás no había ninguna. Si el paso está
          bloqueado, en lugar del botón se dice QUÉ falta para llegar. */}
      <div className="rounded-xl border border-line bg-surface-1 p-4 shadow-e1 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs text-ink-3">
              {uiText("Paso {{numero}} de {{total}}", { numero: plan.pasos.findIndex((paso) => paso.id === seleccionado) + 1, total: plan.pasos.length })}
              {seleccionado === pasoActual.id ? <span className="ml-2 font-medium text-accent-ink">{uiText("· el que toca ahora")}</span> : null}
            </p>
            <h2 className="mt-0.5 text-lg font-semibold text-ink-1">{uiText(pasoSeleccionado.titulo)}</h2>
            <p className="mt-0.5 text-sm text-ink-2">{uiText(pasoSeleccionado.detalle)}</p>
          </div>
          <BotonDePaso
            paso={pasoSeleccionado}
            ocupado={createContract.isPending || resendHiringDocuments.isPending}
            onNavigate={(destino) => abrirPaso(pasoDeDestino[destino] ?? "postulacion")}
            onOperar={(operacion) => {
        if (operacion === "agendar-entrevista") { abrirPaso("evaluacion"); setAgendaAbierta(true); return; }
        if (operacion === "crear-contratacion") { setTransferOpen(true); return; }
        resendHiringDocuments.mutate();
      }}
          />
        </div>

        {/* Un paso bloqueado no se explica con un botón apagado: se explica
            con la lista de lo que falta, y cada línea dice si ya está. */}
        {pasoSeleccionado.bloqueado ? (
          <div className="mt-4 border-t border-line pt-4">
            <p className="text-sm font-medium text-ink-1">{uiText("Para llegar a este paso falta:")}</p>
            <ul className="mt-2 space-y-1.5">
              {plan.pasos
                .slice(0, plan.pasos.findIndex((paso) => paso.id === seleccionado))
                .flatMap((paso) => paso.requisitos.filter((requisito) => !requisito.cumplido).map((requisito) => ({ paso, requisito })))
                .map(({ paso, requisito }) => (
                  <li key={`${paso.id}-${requisito.texto}`} className="flex items-center gap-2 text-sm text-ink-2">
                    <Circle className="size-3.5 shrink-0 text-ink-3" aria-hidden="true" />
                    {uiText(requisito.texto)}
                    <button type="button" className="text-accent-ink underline underline-offset-4" onClick={() => abrirPaso(paso.id)}>
                      {uiText(paso.titulo)}
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        ) : pasoSeleccionado.requisitos.length ? (
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line pt-4">
            {pasoSeleccionado.requisitos.map((requisito) => (
              <li key={requisito.texto} className={cn("flex items-center gap-1.5 text-sm", requisito.cumplido ? "text-ink-2" : "text-ink-3")}>
                {requisito.cumplido
                  ? <Check className="size-3.5 shrink-0 text-status-success" aria-hidden="true" />
                  : <Circle className="size-3.5 shrink-0" aria-hidden="true" />}
                {uiText(requisito.texto)}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {seleccionado === "contratacion" ? <JobOfferManager applicationId={application.id} jobTitle={application.vacancy.title} canManage={can("applications.change_stage")} /> : null}
      {seleccionado === "evaluacion" ? <div className="space-y-5" aria-label={t("p360.evaluateCandidate")}>
      <EvaluationStatusCard application={application} onComplete={(interviewId) => setScoreInterviewId(interviewId)} canEvaluate={can("scorecards.complete")} />
      <InterviewScheduler application={application} canSchedule={can("interviews.schedule")} abierta={agendaAbierta} onAbierta={setAgendaAbierta} />
      {/* La tarjeta de evaluaciones solo aparece cuando hay alguna: vacía
          ocupaba un bloque entero para decir que no hay nada. */}
      {scorecards.length ? <Card level={2}><CardHeader><CardTitle>{t("p360.scorecards")}</CardTitle></CardHeader><CardContent className="space-y-4">{scorecards.length ? <><div className="grid gap-3 sm:grid-cols-3"><Summary label={uiText("Evaluaciones")} value={String(scorecards.length)} /><Summary label={uiText("Firmadas")} value={String(scorecards.filter(({ scorecard }) => scorecard.status === "SIGNED").length)} /><Summary label={uiText("Promedio simple")} value={`${(scorecards.reduce((total, { scorecard }) => total + Number(scorecard.weightedScore ?? (scorecard.overallRating ?? 0) * 20), 0) / scorecards.length).toFixed(1)}/100`} /></div>{(application.interviews ?? []).filter((interview) => interview.scorecards?.length).map((interview) => <ScorecardConsensus key={interview.id} interviewId={interview.id} stageName={interview.stage?.name ?? t("p360.interview")} />)}{scorecards.map(({ interview, scorecard }) => <div key={scorecard.id} className="rounded-xl border border-border-default p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold">{interview.stage?.name ?? t("p360.interview")} · {interview.interviewer ? `${interview.interviewer.firstName} ${interview.interviewer.lastName}` : t("p360.noEvaluator")}</p><p className="text-sm text-text-secondary">{scorecard.status}{scorecard.signedAt ? ` · firmada ${formatApplicationDate(scorecard.signedAt)}` : ""}</p></div><Badge variant="secondary">{Number(scorecard.weightedScore ?? (scorecard.overallRating ?? 0) * 20).toFixed(1)}/100</Badge></div><div className="mt-3 grid gap-2 sm:grid-cols-3"><Summary label={t("p360.recommendation")} value={scorecard.recommendation} /><Summary label={uiText("Fortalezas")} value={scorecard.strengths || "Sin registrar"} /><Summary label={uiText("Riesgos")} value={scorecard.concerns || "Sin registrar"} /></div></div>)}</> : <p className="text-sm text-text-secondary">{t("p360.noScorecards")}</p>}</CardContent></Card> : null}
      {/* El asistente de competencias sale de la ficha por decisión del
          equipo. El componente sigue existiendo (`competency-ai-assistant.tsx`)
          y su endpoint también: volver a colgarlo es una línea. */}
      <ScorecardDialog interviewId={scoreInterviewId} onClose={() => setScoreInterviewId("")} />
      </div> : null}
      {/* Contratación, Documentos e Incorporación no tienen contenido propio
          aquí: viven en el expediente de contratación y en incorporación. En
          vez de un panel vacío, se dice dónde están y se deja el paso a mano. */}
      {seleccionado === "contratacion" ? (
        <Card level={2}>
          <CardHeader><CardTitle>{uiText(pasoSeleccionado.titulo)}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-text-secondary">{uiText(pasoSeleccionado.detalle)}</p>
            {pasoSeleccionado.accion ? null : (
              <p className="text-sm text-text-secondary">{uiText("Se habilita al terminar el paso anterior.")}</p>
            )}
          </CardContent>
        </Card>
      ) : null}
      {seleccionado === "decision" ? <div className="space-y-5" aria-label={t("p360.decideApplication")}>
      <DecisionCommitteeCard applicationId={application.id} />
      <Card id="proceso" level={1}><CardHeader><CardTitle>{t("p360.nextSuggested")}</CardTitle></CardHeader><CardContent className="space-y-4">{application.status === "HIRED" ? <InlineFeedback tone="success" title={t("p360.hiringFormalized")}>{t("p360.finalStageNote")}</InlineFeedback> : can("applications.change_stage") ? <>{application.pendingTransitions?.[0] ? <InlineFeedback tone="warning" title={t("p360.pendingApproval")}>{uiText("Destino: ")}{application.pendingTransitions[0].toStage.name} · {application.pendingTransitions[0].approvals.length}/{application.pendingTransitions[0].requiredApprovals} {uiText(" aprobaciones.")}</InlineFeedback> : null}<label className="space-y-2 text-sm font-medium">{t("p360.vacancyStage")}<Select value={currentStageId || undefined} onValueChange={setCurrentStageId}><SelectTrigger><SelectValue placeholder={t("p360.pickStage")} /></SelectTrigger><SelectContent>{movableStages.map((stage) => <SelectItem key={stage.id} value={stage.id!}>{stage.name}</SelectItem>)}</SelectContent></Select></label>{selectedStage?.applicationStatus === "REJECTED" && selectedStage.id !== originalStageId ? <div className="space-y-3"><label className="block space-y-2 text-sm font-medium">{t("p360.rejectionReason")} <span className="text-status-danger">*</span><Select value={rejectionReasonId} onValueChange={setRejectionReasonId}><SelectTrigger><SelectValue placeholder={t("p360.pickAnalyticReason")} /></SelectTrigger><SelectContent>{rejectionReasons.data?.map((reason) => <SelectItem key={reason.id} value={reason.id}>{reason.label}</SelectItem>)}</SelectContent></Select></label><label className="block space-y-2 text-sm font-medium" htmlFor="candidate-rejection-reason">{uiText("Observaciones ")}<span className="text-status-danger">*</span><textarea id="candidate-rejection-reason" value={rejectionReason} maxLength={2000} rows={3} onChange={(event) => setRejectionReason(event.target.value)} className="w-full rounded-xl border border-border-default bg-surface-elevated p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus" /></label></div> : null}<label className="block space-y-2 text-sm font-medium" htmlFor="candidate-notes">{t("p360.internalNotes")}<textarea id="candidate-notes" value={notes} maxLength={4000} rows={6} onChange={(event) => setNotes(event.target.value)} className="w-full rounded-xl border border-border-default bg-surface-elevated p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus" /></label><ActionBar><Button onClick={() => save.mutate()} disabled={save.isPending || (selectedStage?.applicationStatus === "REJECTED" && selectedStage.id !== originalStageId && (!rejectionReasonId || !rejectionReason.trim())) || (currentStageId === originalStageId && notes === (application.notes ?? ""))}>{save.isPending ? uiText("Guardando…") : selectedStage?.requiresApproval && selectedStage.id !== originalStageId ? uiText("Solicitar aprobación") : uiText("Guardar cambios")}</Button></ActionBar></> : <p className="text-sm text-text-secondary">{t("p360.readOnly")}</p>}</CardContent></Card>
      </div> : null}
    </div><aside className="space-y-5">
      {seleccionado === "postulacion" || seleccionado === "contratacion" ? <Card id="mensajes" level={2}><CardHeader><CardTitle>{t("p360.messages")}</CardTitle></CardHeader><CardContent>{communications.isLoading ? <p className="text-sm text-text-secondary">{t("p360.loadingHistory")}</p> : communications.isError ? <InlineFeedback tone="danger" title={t("p360.messagesError")}>{t("p360.retryDeliveries")}</InlineFeedback> : communications.data?.length ? <CommunicationHistory messages={communications.data} retryPending={retryMessage.isPending} onRetry={(messageId) => retryMessage.mutate(messageId)} /> : <p className="text-sm text-text-secondary">{t("p360.noMessages")}</p>}</CardContent></Card> : null}
    </aside></div>
    {resendHiringDocuments.isSuccess ? <InlineFeedback tone="success" title={t("p360.docusealSent")}>{t("p360.docusealSentBody")}</InlineFeedback> : null}
    {resendHiringDocuments.isError ? <InlineFeedback tone="danger" title={t("p360.docusealError")}>{getApiErrorMessage(resendHiringDocuments.error, t("p360.docusealRetry"))}</InlineFeedback> : null}
    <Dialog open={transferOpen} onOpenChange={setTransferOpen}><DialogContent><DialogHeader><DialogTitle>{t("p360.sendToHiring")}</DialogTitle><DialogDescription>{t("p360.sendToHiringBody")}</DialogDescription></DialogHeader><div className="space-y-4"><dl className="grid gap-3 rounded-xl bg-surface-section p-4 text-sm sm:grid-cols-2"><Summary label={t("p360.candidate")} value={application.candidate.fullName} /><Summary label={t("p360.vacancy")} value={application.vacancy.title} /><Summary label={t("p360.company")} value={application.vacancy.tenant?.name ?? t("p360.activeCompany")} /><Summary label={t("p360.branch")} value={application.vacancy.branch?.name ?? application.vacancy.branchId} /><Summary label={uiText("Cargo")} value={jobTitle || application.vacancy.title} /><Summary label={uiText("Resultado")} value={t("p360.selectedForHiring")} /></dl><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-status-success/30 bg-status-success/5 p-4 text-sm"><p className="font-semibold">{t("p360.willTransfer")}</p><p className="mt-2 text-text-secondary">{t("p360.willTransferBody")}</p></div><div className="rounded-xl border border-border-default p-4 text-sm"><p className="font-semibold">{t("p360.willStay")}</p><p className="mt-2 text-text-secondary">{t("p360.willStayBody")}</p></div></div>{createContract.isError ? <InlineFeedback tone="danger" title={t("p360.sendFailed")}>{getApiErrorMessage(createContract.error, t("p360.checkActive"))}</InlineFeedback> : null}<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="secondary" onClick={() => setTransferOpen(false)} disabled={createContract.isPending}>{t("actions.cancel")}</Button><Button onClick={() => createContract.mutate()} disabled={createContract.isPending || application.status !== "APPROVED"}>{createContract.isPending ? uiText("Enviando…") : t("p360.confirmSend")}<ArrowRight className="size-4" /></Button></div></div></DialogContent></Dialog>

  </div>;
}

function EvaluationStatusCard({ application, onComplete, canEvaluate }: { application: VacancyApplicationDto; onComplete: (interviewId: string) => void; canEvaluate: boolean }) {
  const uiText = useUiText();
  const { t } = useLocale();
  const interviews = application.interviews ?? [];
  const [now] = useState(() => Date.now());
  const pending = interviews.find((interview) => interview.status === "COMPLETED" && (!interview.scorecards?.length || interview.scorecards.some((scorecard) => scorecard.status !== "SIGNED")));
  const upcoming = interviews.find((interview) => ["SCHEDULED", "CONFIRMED"].includes(interview.status) && new Date(interview.startsAt).getTime() >= now);
  /*
   * Solo habla cuando pide algo.
   *
   * Tenía cuatro variantes y tres no pedían nada: «Aún no hay entrevista» y
   * «Próxima entrevista: …» repetían lo que la tarjeta de entrevistas —justo
   * debajo— ya dice con más detalle, y «Evaluaciones al día» era un cartel
   * verde para informar de que no hay trabajo. Quedan las que sí piden algo.
   */
  if (pending) return <InlineFeedback tone="warning" title={t("p360.pendingEvaluation")}><span>{uiText("La entrevista de ")}{formatApplicationDate(pending.startsAt)} {uiText(" necesita una recomendación y resultado.")}</span>{canEvaluate ? <Button className="mt-3" size="sm" onClick={() => onComplete(pending.id)}><ClipboardCheck className="size-4" />{t("p360.completeScorecard")}</Button> : <p className="mt-2 text-sm">{t("p360.authorizedEvaluator")}</p>}</InlineFeedback>;
  return null;
}

function CandidateContextSummary({ application }: { application: VacancyApplicationDto }) {
  const uiText = useUiText();
  const { t } = useLocale();
  const responsible = application.assignedRecruiter ? `${application.assignedRecruiter.firstName} ${application.assignedRecruiter.lastName}` : t("p360.unassigned");
  /*
   * Tres datos, no cinco. «Etapa» y «Próxima acción» decían lo mismo que la
   * cadena de arriba con otras palabras —«En revisión» / «Evaluación»—, a
   * 300 px de distancia. Queda lo que no está en ningún otro sitio.
   */
  return <section className="grid gap-4 rounded-xl border border-line bg-surface-2 p-4 sm:grid-cols-3"><Summary label={t("p360.vacancy")} value={application.vacancy.title} /><Summary label={t("p360.owner")} value={responsible} /><Summary label={t("p360.lastActivity")} value={formatApplicationDate(application.updatedAt)} />{application.isStageOverdue ? <div className="sm:col-span-3"><InlineFeedback tone="danger" title={uiText("Lleva más tiempo del previsto")}>{t("p360.priorityAttention")}</InlineFeedback></div> : null}{application.pendingTransitions?.some((transition) => transition.status === "PENDING") ? <div className="sm:col-span-3"><InlineFeedback tone="warning" title={uiText("Cambio pendiente")}>{t("p360.transitionWaiting")}</InlineFeedback></div> : null}</section>;
}

/**
 * El botón que hace avanzar UN paso.
 *
 * Vive aparte porque lo usan dos sitios: la cabecera de la guía —donde muestra
 * la acción del paso que TOCA— y la cabecera del panel —donde muestra la del
 * paso que se está mirando. Un solo componente evita que las dos versiones se
 * separen, que es justo lo que le pasó al texto y al botón de esta pantalla.
 */
function BotonDePaso({ paso, ocupado, tamano = "default", onNavigate, onOperar }: {
  paso: PasoContratacion;
  ocupado: boolean;
  tamano?: "sm" | "default";
  onNavigate: (destino: string) => void;
  onOperar: (operacion: OperacionDePaso) => void;
}) {
  const uiText = useUiText();
  const accion = paso.accion;
  if (!accion) return null;
  if (accion.tipo === "hacer") {
    return (
      <Button size={tamano} className="shrink-0" onClick={() => onOperar(accion.operacion)} disabled={ocupado}>
        {ocupado ? uiText("Enviando…") : uiText(accion.etiqueta)}
        <ArrowRight className="size-4" aria-hidden="true" />
      </Button>
    );
  }
  if (accion.destino.startsWith("/")) {
    return (
      <Button asChild size={tamano} className="shrink-0">
        <Link href={accion.destino}>{uiText(accion.etiqueta)}<ArrowRight className="size-4" aria-hidden="true" /></Link>
      </Button>
    );
  }
  return (
    <Button type="button" size={tamano} className="shrink-0" onClick={() => onNavigate(accion.destino)}>
      {uiText(accion.etiqueta)}<ArrowRight className="size-4" aria-hidden="true" />
    </Button>
  );
}

/**
 * Guía de contratación: en qué paso va la persona y qué toca hacer ahora.
 *
 * Lo que se arregló aquí
 * ----------------------
 * 1. El texto y el botón se calculaban por separado, y el botón tenía un caso
 *    por omisión que ofrecía «Preparar oferta» a CUALQUIER postulación que no
 *    estuviera aprobada, rechazada o contratada. La pantalla decía «programa la
 *    entrevista» encima de un botón que proponía el penúltimo paso. Ahora los
 *    dos leen el mismo objeto (`planDeContratacion`), y una prueba comprueba
 *    que la acción pertenece siempre al paso actual.
 * 2. La cadena se dibujaba DOS veces: como fichas y otra vez como lista con el
 *    detalle de cada paso. El detalle ahora vive donde hace falta —el paso
 *    actual— y los demás lo llevan en su `title`.
 * 3. «Contratación» e «Incorporación» tenían ternarios con las dos ramas
 *    iguales: prometían un final que su propio código no podía alcanzar.
 */
function HiringProgressGuide({ plan, seleccionado, sendingDocuments, creatingContract, onNavigate, onAbrirPaso, onOperar, canManage, canHire }: {
  plan: ReturnType<typeof planDeContratacion>;
  seleccionado: PasoId;
  sendingDocuments: boolean;
  creatingContract: boolean;
  onNavigate: (destino: string) => void;
  onAbrirPaso: (paso: PasoId) => void;
  onOperar: (operacion: OperacionDePaso) => void;
  canManage: boolean;
  canHire: boolean;
}) {
  const uiText = useUiText();
  const { t } = useLocale();
  const pasoActual = plan.pasos[plan.actual];
  const ocupado = sendingDocuments || creatingContract;
  const hechos = plan.pasos.filter((paso) => paso.estado === "hecho").length;
  const avance = Math.round((hechos / plan.pasos.length) * 100);

  const nombreEstado = (estado: PasoContratacion["estado"]) =>
    estado === "hecho" ? uiText("hecho") : estado === "atencion" ? uiText("necesita atención") : estado === "encurso" ? uiText("en curso") : uiText("pendiente");

  return (
    <section aria-labelledby="guia-contratacion" className="rounded-xl border border-line bg-surface-1 p-5 shadow-e1 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-3">{t("p360.transferToHiring")}</p>
          <h2 id="guia-contratacion" className="mt-1 text-xl font-semibold text-ink-1">{uiText(pasoActual.detalle)}</h2>
          <p className="mt-1 text-sm text-ink-2">
            {uiText("Paso {{numero}} de {{total}}", { numero: plan.actual + 1, total: plan.pasos.length })} · <span className="font-medium text-ink-1">{uiText(pasoActual.titulo)}</span>
          </p>
        </div>
        {/* Si ya estás mirando el paso que toca, su botón está en la cabecera
            del panel, justo debajo: repetirlo aquí sería decir lo mismo dos
            veces. Cuando miras otro paso, este botón es la vuelta a lo que toca. */}
        {seleccionado === pasoActual.id ? null : <BotonDePaso paso={pasoActual} ocupado={ocupado} onNavigate={onNavigate} onOperar={onOperar} />}
      </div>

      {/* Cuánto llevas del proceso, de un vistazo y sin contar círculos. */}
      <div className="mt-5 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
          <motion.div
            className="h-full rounded-full bg-status-success"
            initial={false}
            animate={{ width: `${avance}%` }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
        <p className="shrink-0 font-mono text-xs text-ink-3 tabular-figures">
          {uiText("{{hechos}} de {{total}}", { hechos, total: plan.pasos.length })}
        </p>
      </div>

      <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label={t("p360.hiringProgressAria")}>
        {plan.pasos.map((paso, index) => {
          const esActual = index === plan.actual;
          const esVisible = paso.id === seleccionado;
          return (
            <li key={paso.id} className="min-w-0" aria-current={esActual ? "step" : undefined}>
              {/* Cada paso abre su propio contenido debajo: la cadena es la
                  navegación, no un adorno encima de otra navegación. Un paso
                  bloqueado se puede mirar —para ver qué traerá— y se dice con
                  el candado, no con un botón inerte sin explicación. */}
              <button
                type="button"
                onClick={() => onAbrirPaso(paso.id)}
                aria-pressed={esVisible}
                title={uiText(paso.detalle)}
                className={cn(
                  "flex min-h-[var(--control-h-base)] w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left",
                  "transition-[background-color,border-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-out)]",
                  /* El seleccionado se marca con el borde de acción y una
                     sombra, no con el relleno de acento: el acento de este
                     tema es ámbar y una ficha ámbar se lee como advertencia. */
                  esVisible
                    ? "border-action bg-surface-2 shadow-e1"
                    : esActual
                      ? "border-action/40 bg-surface-1 hover:border-action"
                      : "border-line bg-surface-1 hover:border-line-strong",
                  paso.bloqueado && !esVisible && "opacity-70",
                )}
              >
                <MarcaDePaso paso={paso} numero={index + 1} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-1">
                  {uiText(paso.titulo)}
                  <span className="sr-only">{`, ${nombreEstado(paso.estado)}${esActual ? `, ${uiText("paso actual")}` : ""}${paso.bloqueado ? `, ${uiText("bloqueado")}` : ""}`}</span>
                </span>
                {paso.bloqueado ? <Lock className="size-3.5 shrink-0 text-ink-3" aria-hidden="true" /> : null}
              </button>
            </li>
          );
        })}
      </ol>

      {!canManage && !canHire ? <p className="mt-4 text-xs text-ink-3">{t("p360.viewAccessNote")}</p> : null}
    </section>
  );
}

/**
 * La marca de un paso: hecho, en curso, con atención, o su número.
 *
 * El paso pendiente lleva su NÚMERO, no un círculo vacío: con círculos, la
 * fila de siete se leía como un grupo de botones de radio —algo que se
 * elige— cuando es un recorrido que se recorre.
 */
function MarcaDePaso({ paso, numero }: { paso: PasoContratacion; numero: number }) {
  if (paso.estado === "hecho") {
    return (
      <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-full bg-status-success text-white">
        <Check className="size-3.5" strokeWidth={3} />
      </span>
    );
  }
  if (paso.estado === "atencion") {
    return (
      <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-full bg-status-warning/15 text-status-warning">
        <AlertTriangle className="size-3.5" />
      </span>
    );
  }
  if (paso.estado === "encurso") {
    return (
      <span aria-hidden="true" className="relative flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-fill text-accent-ink">
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-action"
          initial={false}
          animate={{ opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <CircleDot className="size-3.5" />
      </span>
    );
  }
  return (
    <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-full border border-line-strong font-mono text-[0.6875rem] text-ink-3 tabular-figures">
      {numero}
    </span>
  );
}

function ScorecardConsensus({ interviewId, stageName }: { interviewId: string; stageName: string }) {
  const { t } = useLocale();
  const comparison = useQuery({ queryKey: ["scorecard-comparison", interviewId], queryFn: () => fetchInterviewScorecardComparison(interviewId) });
  if (comparison.isLoading || comparison.isError || !comparison.data?.evaluatorCount) return null;
  if (comparison.data.feedbackLocked) return <InlineFeedback tone="info" title={`Comparación protegida · ${stageName}`}>{t("p360.crossResultsHidden")}</InlineFeedback>;
  return <ScorecardConsensusSummary stageName={stageName} comparison={comparison.data} />;
}

function ScorecardConsensusSummary({ stageName, comparison }: { stageName: string; comparison: ScorecardComparisonDto }) {
  const uiText = useUiText();
  const { t } = useLocale();
  const scores = comparison.evaluatorScores.map((item) => item.weightedScore);
  const average = scores.reduce((total, score) => total + score, 0) / scores.length;
  const spread = Math.max(...scores) - Math.min(...scores);
  const disagreements = comparison.criteria.filter((criterion) => (criterion.spread ?? 0) >= 2);
  return <section className="rounded-xl border border-primary/25 bg-primary/5 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{uiText("Consenso de evaluadores · ")}{stageName}</p><p className="text-sm text-text-secondary">{comparison.evaluatorCount} {uiText(" evaluación(es) firmada(s) comparables.")}</p></div><Badge variant={spread >= 20 ? "warning" : "success"}>{spread >= 20 ? t("p360.needsCalibration") : "Acuerdo estable"}</Badge></div><div className="mt-3 grid gap-3 sm:grid-cols-3"><Summary label={uiText("Promedio ponderado")} value={`${average.toFixed(1)}/100`} /><Summary label={t("p360.evaluatorSpread")} value={`${spread.toFixed(1)} puntos`} /><Summary label={t("p360.reviewSignals")} value={String(comparison.biasSignals.length)} /></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{comparison.evaluatorScores.map((item) => <div key={item.reviewer.id} className="rounded-lg bg-surface-elevated p-3 text-sm"><p className="font-medium">{item.reviewer.firstName} {item.reviewer.lastName}</p><p className="text-text-secondary">{item.weightedScore.toFixed(1)}/100 · {item.recommendation}</p></div>)}</div>{disagreements.length ? <div className="mt-3 rounded-lg border border-status-warning/30 bg-status-warning/5 p-3 text-sm"><p className="font-medium">{t("p360.mostDisagreement")}</p><p className="mt-1 text-text-secondary">{disagreements.slice(0, 3).map((item) => `${item.label ?? item.key} (${item.min ?? "-"}–${item.max ?? "-"})`).join(" · ")}</p></div> : null}{comparison.biasSignals.length ? <p className="mt-3 text-sm text-status-warning">{comparison.biasSignals[0]?.message}</p> : null}</section>;
}

/**
 * Tarjeta de entrevistas.
 *
 * Su botón de agendar SOLO aparece cuando ya hay alguna entrevista, y entonces
 * dice «Agendar otra»: la primera se agenda desde la cabecera del paso, que es
 * donde vive la acción que hace avanzar la etapa. Antes había dos botones a la
 * vez —uno de ellos, el de la cabecera, llevaba al panel que ya se estaba
 * mirando— y solo uno servía.
 */
function InterviewScheduler({ application, canSchedule, abierta, onAbierta }: { application: VacancyApplicationDto; canSchedule: boolean; abierta?: boolean; onAbierta?: (abierta: boolean) => void }) {
  const uiText = useUiText();
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [openPropio, setOpenPropio] = useState(false);
  const open = abierta ?? openPropio;
  const setOpen = (valor: boolean) => {
    if (abierta === undefined) setOpenPropio(valor);
    onAbierta?.(valor);
  };
  const [title, setTitle] = useState(`Entrevista · ${application.vacancy.title}`);
  const [type, setType] = useState<"PRESENTIAL" | "VIRTUAL" | "PHONE">("VIRTUAL");
  const [interviewerUserId, setInterviewerUserId] = useState("");
  const [startsAt, setStartsAt] = useState(() => defaultInterviewDate(60));
  const [duration, setDuration] = useState("60");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [location, setLocation] = useState("");
  const [calendarProvider, setCalendarProvider] = useState<"NONE" | CalendarProvider>("NONE");
  const [timezone, setTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  const interviewers = useQuery({ queryKey: ["interviewer-profiles"], queryFn: fetchInterviewerProfiles, enabled: open && canSchedule });
  const schedule = useMutation({
    mutationFn: () => {
      if (!interviewerUserId) throw new Error(t("p360.pickInterviewer"));
      const start = new Date(startsAt);
      const end = new Date(start.getTime() + Number(duration) * 60_000);
      return scheduleRecruitmentInterview({ applicationId: application.id, interviewerUserId, title: title.trim(), type, timezone, startsAt: start.toISOString(), endsAt: end.toISOString(), calendarProvider: calendarProvider === "NONE" ? undefined : calendarProvider, meetingUrl: type === "VIRTUAL" ? meetingUrl.trim() || undefined : undefined, location: type === "PRESENTIAL" ? location.trim() || undefined : undefined });
    },
    onSuccess: async () => {
      setOpen(false);
      /* El correo lo dispara el servidor al crear la entrevista. Decirlo aquí
         cierra el gesto: quien confirma sabe que la persona ya fue avisada, y
         a dónde. Si la entrega falla, aparece en «Mensajes» con su error. */
      toast.success(uiText("Entrevista agendada. Le avisamos por correo a {{correo}}.", { correo: application.candidate.email }));
      await queryClient.invalidateQueries({ queryKey: ["application", application.id] });
      await queryClient.invalidateQueries({ queryKey: ["recruitment-interviews"] });
      await queryClient.invalidateQueries({ queryKey: ["ats-communications", application.id] });
    },
  });
  const interviews = application.interviews ?? [];
  return <Card id="entrevistas" level={2}><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>{t("p360.interviews")}</CardTitle>{canSchedule && interviews.length ? <Button size="sm" variant="secondary" onClick={() => setOpen(true)}><CalendarPlus className="size-4" />{uiText("Agendar otra")}</Button> : null}</div></CardHeader><CardContent>{interviews.length ? <div className="space-y-3">{interviews.map((interview) => <div key={interview.id} className="rounded-xl border border-border-default p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{interview.title}</p><p className="text-sm text-text-secondary">{interview.type} · {formatApplicationDate(interview.startsAt)} · {interview.timezone}</p><p className="text-sm text-text-secondary">{uiText("Entrevistador: ")}{interview.interviewer ? `${interview.interviewer.firstName} ${interview.interviewer.lastName}` : t("p360.unassigned")}</p></div><Badge variant="secondary">{technicalLabel(interview.status)}</Badge></div>{interview.meetingUrl ? <Button asChild size="sm" variant="secondary" className="mt-3"><a href={interview.meetingUrl} target="_blank" rel="noreferrer">{uiText("Abrir reunión ")}<ExternalLink className="size-4" /></a></Button> : null}</div>)}</div> : application.interview ? <dl className="grid gap-3 sm:grid-cols-2"><Summary label={t("p360.type")} value={application.interview.type ?? t("p360.undefinedValue")} /><Summary label={uiText("Programada")} value={formatApplicationDate(application.interview.scheduledAt)} /><Summary label={uiText("Seguimiento")} value={formatApplicationDate(application.interview.followUpAt)} /><Summary label={t("p360.observations")} value={application.interview.observations ?? t("p360.noObservations")} /></dl> : <p className="text-sm text-text-secondary">{t("p360.noInterviewScheduled")}</p>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="sm:max-w-3xl"><DialogHeader><DialogTitle>{t("p360.scheduleInterview")}</DialogTitle><DialogDescription>{t("p360.scheduleBody")}</DialogDescription></DialogHeader><div className="space-y-4"><label className="block space-y-2 text-sm font-medium" htmlFor="interview-title">{t("p360.titleField")}<Input id="interview-title" value={title} onChange={(event) => setTitle(event.target.value)} /></label><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium" htmlFor="interview-type">{t("p360.type")}<Select value={type} onValueChange={(value) => setType(value as typeof type)}><SelectTrigger id="interview-type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="VIRTUAL">Virtual</SelectItem><SelectItem value="PRESENTIAL">{uiText("Presencial")}</SelectItem><SelectItem value="PHONE">{t("p360.typePhone")}</SelectItem></SelectContent></Select></label><label className="space-y-2 text-sm font-medium" htmlFor="interview-interviewer">{t("p360.interviewer")}<Select value={interviewerUserId} onValueChange={setInterviewerUserId}><SelectTrigger id="interview-interviewer"><SelectValue placeholder={interviewers.isLoading ? uiText("Cargando...") : t("p360.pickPerson")} /></SelectTrigger><SelectContent>{interviewers.data?.map((person) => <SelectItem key={person.id} value={person.id}>{person.firstName} {person.lastName}</SelectItem>)}</SelectContent></Select></label><div className="space-y-2 sm:col-span-2"><span className="text-sm font-medium">{t("p360.dateTime")}</span><div className="grid gap-2 sm:grid-cols-2"><label className="space-y-1 text-xs text-muted-foreground" htmlFor="interview-date">{t("p360.date")}<Input id="interview-date" type="date" value={startsAt.slice(0, 10)} onChange={(event) => setStartsAt(`${event.target.value}T${startsAt.slice(11, 16)}`)} /></label><label className="space-y-1 text-xs text-muted-foreground" htmlFor="interview-time">{uiText("Hora")}<Input id="interview-time" type="time" value={startsAt.slice(11, 16)} onChange={(event) => setStartsAt(`${startsAt.slice(0, 10)}T${event.target.value}`)} /></label></div></div><label className="space-y-2 text-sm font-medium" htmlFor="interview-duration">{t("p360.duration")}<Select value={duration} onValueChange={setDuration}><SelectTrigger id="interview-duration"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="30">{uiText("30 minutos")}</SelectItem><SelectItem value="45">{uiText("45 minutos")}</SelectItem><SelectItem value="60">{uiText("60 minutos")}</SelectItem><SelectItem value="90">{uiText("90 minutos")}</SelectItem></SelectContent></Select></label><label className="space-y-2 text-sm font-medium" htmlFor="interview-calendar">{uiText("Calendario")}<Select value={calendarProvider} onValueChange={(value) => setCalendarProvider(value as typeof calendarProvider)}><SelectTrigger id="interview-calendar"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="NONE">{t("p360.internalOnly")}</SelectItem><SelectItem value="GOOGLE">Google Calendar</SelectItem><SelectItem value="MICROSOFT">Microsoft Outlook</SelectItem><SelectItem value="ZOOM">Zoom</SelectItem></SelectContent></Select></label><label className="space-y-2 text-sm font-medium" htmlFor="interview-timezone">{uiText("Zona horaria")}<Input id="interview-timezone" value={timezone} onChange={(event) => setTimezone(event.target.value)} /></label></div>{type === "VIRTUAL" ? <label className="block space-y-2 text-sm font-medium" htmlFor="interview-meeting-url">{t("p360.meetingLink")}<Input id="interview-meeting-url" type="url" placeholder="https://..." value={meetingUrl} onChange={(event) => setMeetingUrl(event.target.value)} /></label> : null}{type === "PRESENTIAL" ? <label className="block space-y-2 text-sm font-medium" htmlFor="interview-location">{t("p360.location")}<Input id="interview-location" value={location} onChange={(event) => setLocation(event.target.value)} /></label> : null}{schedule.isError ? <InlineFeedback tone="danger" title={t("p360.scheduleFailed")}>{getApiErrorMessage(schedule.error, t("p360.checkAndRetry"))}</InlineFeedback> : null}<ActionBar><Button variant="secondary" onClick={() => setOpen(false)}>{t("actions.cancel")}</Button><Button onClick={() => schedule.mutate()} disabled={schedule.isPending || !interviewerUserId || !title.trim()}>{schedule.isPending ? "Programando..." : t("p360.confirmInterview")}</Button></ActionBar></div></DialogContent></Dialog>
  </CardContent></Card>;
}

function defaultInterviewDate(minutesFromNow: number) {
  const date = new Date(Date.now() + minutesFromNow * 60_000);
  date.setSeconds(0, 0);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="flex gap-3 [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0"><span aria-hidden="true">{icon}</span><div><p className="text-xs text-text-secondary">{label}</p><p className="break-words text-sm font-medium">{value}</p></div></div>; }
function Summary({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs text-text-secondary">{label}</dt><dd className="mt-1 text-sm font-medium">{value}</dd></div>; }
function Section({ title, empty, children }: { title: string; empty: string; children?: string | null }) { return <section><h3 className="font-semibold">{title}</h3><p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">{children || empty}</p></section>; }
function CommunicationHistory({ messages, retryPending, onRetry }: { messages: AtsMessageDto[]; retryPending: boolean; onRetry: (messageId: string) => void }) {
  const uiText = useUiText();
  const { t } = useLocale();
  const groups = Array.from(messages.reduce((grouped, message) => {
    const key = message.eventKey ?? `message:${message.id}`;
    const group = grouped.get(key) ?? [];
    group.push(message);
    grouped.set(key, group);
    return grouped;
  }, new Map<string, AtsMessageDto[]>()));

  return <ol className="space-y-4">{groups.map(([eventKey, copies]) => {
    const message = copies[0];
    return <li key={eventKey} className="rounded-xl border border-border-default p-3"><div><p className="font-medium">{message.subject}</p><p className="mt-1 text-xs text-text-secondary">{copies.length} {copies.length === 1 ? "destinatario" : "destinatarios"}</p></div><p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-text-secondary">{message.body}</p><div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-secondary"><span>{formatApplicationDate(message.createdAt)}</span><span>{technicalLabel(message.type)}</span>{message.template ? <span>{message.template.name} v{message.template.version}</span> : <span>{t("p360.systemTemplate")}</span>}</div><ul className="mt-3 space-y-2 border-t border-border-default pt-3">{copies.map((copy) => { const delivery = copy.notification?.deliveries.find((item) => item.channel === "EMAIL"); const retryable = delivery?.status === "FAILED" || delivery?.status === "DEAD_LETTER"; return <li key={copy.id} className="flex flex-wrap items-center justify-between gap-2 text-xs"><div><span className="font-medium">{copy.recipientName || copy.recipientEmail}</span><span className="text-text-secondary"> · {copy.audience === "CANDIDATE" ? t("p360.candidate") : t("p360.owner")}{delivery ? ` · ${delivery.attempts}/${delivery.maxAttempts} intentos` : ""}</span>{delivery?.lastError ? <p className="mt-1 text-status-danger">{delivery.lastError}</p> : null}</div><div className="flex items-center gap-2"><Badge variant={copy.status === "DELIVERED" ? "default" : copy.status === "FAILED" || copy.status === "DEAD_LETTER" ? "destructive" : "secondary"}>{communicationStatusLabel(copy.status, t)}</Badge>{retryable ? <Button size="sm" variant="secondary" onClick={() => onRetry(copy.id)} disabled={retryPending}><RotateCcw className="size-4" />{uiText("Reintentar")}</Button> : null}</div></li>; })}</ul></li>;
  })}</ol>;
}
// No es un componente: recibe la funcion de traduccion de quien la llama.
function communicationStatusLabel(status: string, t: (key: string) => string) {
  const keys: Record<string, string> = { PENDING: "p360.comm.PENDING", PROCESSING: "p360.comm.PROCESSING", DELIVERED: "p360.comm.DELIVERED", FAILED: "p360.comm.FAILED", DEAD_LETTER: "p360.retriesExhausted", CANCELLED: "p360.comm.CANCELLED", SKIPPED: "p360.notSent" };
  return keys[status] ? t(keys[status]) : status;
}
