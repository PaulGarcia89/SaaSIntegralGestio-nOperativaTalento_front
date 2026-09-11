"use client";

import { useUiText } from "@/components/ui-copy";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, ExternalLink, FileText, Globe, Mail, MapPin, Phone, UserX } from "lucide-react";
import { toast } from "sonner";
import { ReasonDialog } from "@/components/simple/reason-dialog";
import { SimpleSection } from "@/components/simple/simple-ui";
import { RecruitmentPhaseRail } from "@/components/recruitment/phase-rail";
import { ScheduleInterviewPanel } from "@/components/recruitment/schedule-interview";
import { ErrorState, SkeletonRows, StatusBadge, Timeline, type TimelineEntry } from "@/components/system";
import { Button } from "@/components/ui/button";
import {
  createHiringContract,
  fetchApplication,
  fetchAtsCommunicationHistory,
  fetchRejectionReasons,
  fetchResumeAccess,
  undoApplicationTransition,
  updateApplication,
} from "@/lib/backend";
import type { VacancyApplicationDto, VacancyStageDto } from "@/lib/contracts";
import { formatApplicationDate } from "@/lib/applications";
import {
  firstNameOf,
  recruitmentPhase,
  recruitmentPhaseOf,
  splitRejection,
  stageMovesFor,
  waitingLabel,
  type StageMove,
  phaseMeaning,
  phaseTitle,
} from "@/lib/recruitment-ux";
import { useAppStore } from "@/store/app-store";
import { useLocale } from "@/components/locale-provider";

/**
 * Ficha de una persona.
 *
 * La ficha anterior montaba seis secciones abiertas a la vez y cinco
 * componentes pesados —comité de decisión, gestor de ofertas, evaluaciones,
 * asistente de competencias— aunque el usuario solo entrara a ver un teléfono.
 *
 * Esta responde primero las tres preguntas del rediseño: quién es, en qué fase
 * va y qué hago ahora. Todo lo demás está plegado, y las herramientas de
 * especialista siguen intactas en la ficha avanzada.
 *
 * Qué cambió con el rediseño visual
 * ---------------------------------
 * La fase deja de ser solo un distintivo y pasa a ser un RECORRIDO: se ve de un
 * vistazo cuánto queda por delante, que es la pregunta que el distintivo no
 * respondía. Y la historia del expediente se muestra como línea de tiempo en
 * vez de como una fecha suelta dentro de una lista de datos.
 */

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b border-line py-2.5 last:border-b-0">
      <dt className="text-xs text-ink-3">{label}</dt>
      <dd className="mt-0.5 text-ink-1">{value}</dd>
    </div>
  );
}

/**
 * Recorrido por las fases del proceso.
 *
 * Se dibuja como una `<ol>` real para que se anuncie como una secuencia. El
 * estado no depende del color: la fase hecha lleva una marca, la actual lleva
 * `aria-current="step"` y el texto «Aquí».
 *
 * Quien fue descartado sale del camino principal, así que no se le dibuja un
 * recorrido con fases futuras que ya no va a recorrer.
 */
function PersonProfile({ application }: { application: VacancyApplicationDto }) {
  const uiText = useUiText();
  const { locale, t } = useLocale();
  const client = useQueryClient();
  const { can } = useAppStore();
  const canUpdate = can("applications.update");
  const canSchedule = can("interviews.schedule");
  const [notes, setNotes] = useState(application.notes ?? "");
  const [rejecting, setRejecting] = useState<StageMove | null>(null);

  const stages: VacancyStageDto[] = application.vacancy.stages ?? [];
  const moves = splitRejection(stageMovesFor(application, stages));
  const phase = recruitmentPhase(recruitmentPhaseOf(application.status));
  const name = application.candidate.fullName;
  const firstName = firstNameOf(name);

  const communications = useQuery({ queryKey: ["ats-communications", application.id], queryFn: () => fetchAtsCommunicationHistory(application.id) });
  const rejectionReasons = useQuery({ queryKey: ["application-rejection-reasons"], queryFn: fetchRejectionReasons });

  const refresh = async () => {
    await client.invalidateQueries({ queryKey: ["application", application.id] });
    await client.invalidateQueries({ queryKey: ["applications"] });
  };

  const undo = useMutation({
    mutationFn: ({ applicationId, expectedUpdatedAt }: { applicationId: string; expectedUpdatedAt: string }) => undoApplicationTransition(applicationId, expectedUpdatedAt),
    onSuccess: async () => { toast.success(uiText("Listo, lo dejamos como estaba.")); await refresh(); },
  });

  const move = useMutation({
    mutationFn: ({ stage, reason, rejectionReasonId }: { stage: VacancyStageDto; reason?: string; rejectionReasonId?: string }) =>
      updateApplication(application.id, {
        currentStageId: stage.id,
        reason,
        rejectionReasonId,
        notes: application.notes ?? undefined,
        expectedUpdatedAt: application.updatedAt,
      }),
    onSuccess: async (updated, variables) => {
      await refresh();
      toast.success(`Listo. ${firstName} pasó a ${variables.stage.name}.`, {
        action: { label: t("profile.undo"), onClick: () => undo.mutate({ applicationId: updated.id, expectedUpdatedAt: updated.updatedAt }) },
      });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t("profile.moveFailed")),
  });

  const saveNotes = useMutation({
    mutationFn: () => updateApplication(application.id, { notes: notes.trim() || undefined, expectedUpdatedAt: application.updatedAt }),
    onSuccess: async () => { toast.success(t("profile.noteSaved")); await refresh(); },
    onError: () => toast.error(t("profile.noteFailed")),
  });

  const resume = useMutation({
    mutationFn: () => fetchResumeAccess(application.id),
    onSuccess: (access) => window.open(access.url, "_blank", "noopener,noreferrer"),
    onError: () => toast.error(t("profile.resumeFailed")),
  });

  const contract = useMutation({
    mutationFn: () => createHiringContract(application.id, { roleTitle: application.vacancy.title }),
    onSuccess: (created) => window.location.assign(`/hiring/${created.id}`),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("profile.hiringFailed")),
  });

  const readyToHire = application.status === "APPROVED" && can("applications.hire");
  const discarded = phase.id === "DESCARTADOS";

  /* Historia del expediente. Solo con lo que el registro afirma de verdad: si
     el backend no manda un historial de transiciones, no se inventa uno. */
  const timeline: TimelineEntry[] = [
    {
      id: "applied",
      title: `${firstName} se postuló`,
      when: formatApplicationDate(application.appliedAt),
      detail: application.vacancy.title,
      tone: "neutral",
    },
    {
      id: "current",
      title: application.currentStage?.name ?? phaseTitle(phase.id, locale),
      when: waitingLabel(application.appliedAt),
      detail: phaseMeaning(phase.id, locale),
      tone: discarded ? "danger" : phase.id === "TRABAJANDO" ? "success" : "warning",
    },
  ];

  return (
    <div className="space-y-5 pb-4">
      <nav aria-label={t("profile.backAria")}>
        <Button asChild variant="ghost" size="sm">
          <Link href="/ats/candidates">
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t("profile.back")}
          </Link>
        </Button>
      </nav>

      {/* ---- Quién es ---------------------------------------------------- */}
      <header className="rounded-xl border border-line bg-surface-1 p-5 shadow-e1 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span
              aria-hidden="true"
              className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-action font-display text-lg font-semibold text-on-action"
            >
              {initials(name)}
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold text-ink-1 sm:text-3xl">{name}</h1>
              <p className="mt-1 text-ink-1">{uiText("Se postuló para ")}{application.vacancy.title}</p>
              <p className="text-sm text-ink-2">{application.vacancy.branch?.name ?? t("people.noBranch")}</p>
              <p className="font-mono text-xs text-ink-3 tabular-figures">{waitingLabel(application.appliedAt)}</p>
            </div>
          </div>
          <StatusBadge
            label={phaseTitle(phase.id, locale)}
            tone={discarded ? "neutral" : phase.id === "TRABAJANDO" ? "success" : "progress"}
          />
        </div>

        {/* ---- En qué fase va ------------------------------------------- */}
        <div className="mt-5 border-t border-line pt-4">
          {discarded ? (
            <p className="text-sm text-ink-2">
              {firstName} {uiText("salió del proceso. Su expediente se conserva y sigue apareciendo en la fase «")}{phaseTitle(phase.id, locale)}».
            </p>
          ) : (
            <RecruitmentPhaseRail currentStep={phase.step ?? 1} locale={locale} />
          )}
        </div>

        <dl className="mt-5 grid gap-4 border-t border-line pt-4 sm:grid-cols-3">
          <div className="min-w-0">
            <dt className="text-xs text-ink-3">{t("profile.email")}</dt>
            <dd className="mt-1 flex items-center gap-2 text-ink-1">
              <Mail className="size-4 shrink-0 text-ink-3" aria-hidden="true" />
              <a href={`mailto:${application.candidate.email}`} className="truncate underline underline-offset-4">
                {application.candidate.email}
              </a>
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-ink-3">{t("profile.phone")}</dt>
            <dd className="mt-1 flex items-center gap-2 text-ink-1">
              <Phone className="size-4 shrink-0 text-ink-3" aria-hidden="true" />
              {application.candidate.phone ? (
                <a href={`tel:${application.candidate.phone}`} className="underline underline-offset-4">
                  {application.candidate.phone}
                </a>
              ) : (
                <span className="text-ink-2">{t("profile.notGivenM")}</span>
              )}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-ink-3">{t("profile.city")}</dt>
            <dd className="mt-1 flex items-center gap-2 text-ink-1">
              <MapPin className="size-4 shrink-0 text-ink-3" aria-hidden="true" />
              {application.candidate.city ?? <span className="text-ink-2">{t("profile.notGivenF")}</span>}
            </dd>
          </div>
        </dl>

        {/* LinkedIn, portafolio y las fechas del expediente ya venían en la
            respuesta y no se dibujaban en ninguna parte: la ficha enseñaba
            correo, teléfono y ciudad, y nada más. */}
        {application.candidate.linkedinUrl || application.candidate.portfolioUrl ? (
          <div className="mt-4 flex flex-wrap gap-4 border-t border-line pt-4 text-sm">
            {application.candidate.linkedinUrl ? (
              <a href={application.candidate.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-ink-1 underline underline-offset-4">
                <ExternalLink className="size-4 shrink-0 text-ink-3" aria-hidden="true" />LinkedIn
              </a>
            ) : null}
            {application.candidate.portfolioUrl ? (
              <a href={application.candidate.portfolioUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-ink-1 underline underline-offset-4">
                <Globe className="size-4 shrink-0 text-ink-3" aria-hidden="true" />{uiText("Portafolio")}
              </a>
            ) : null}
          </div>
        ) : null}

        <dl className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-3">
          <DataRow label={uiText("Se postuló el")} value={formatApplicationDate(application.appliedAt)} />
          <DataRow
            label={uiText("En esta fase desde")}
            value={application.stageEnteredAt ? formatApplicationDate(application.stageEnteredAt) : uiText("Sin registro")}
          />
          <DataRow
            label={uiText("Responsable")}
            value={application.assignedRecruiter ? `${application.assignedRecruiter.firstName} ${application.assignedRecruiter.lastName}` : t("profile.unassigned")}
          />
        </dl>

        {/* El retraso lo calcula el servidor (`isStageOverdue`) y no se
            mostraba: la ficha no distinguía a quien lleva dos días de quien
            lleva doce fuera de plazo. */}
        {application.isStageOverdue ? (
          <p className="mt-3 rounded-lg border border-status-warning/40 bg-status-warning/10 px-3 py-2 text-sm text-ink-1">
            {uiText("Esta fase lleva más tiempo del previsto.")}
          </p>
        ) : null}

        {application.candidate.resumeAvailable ? (
          <Button
            type="button"
            variant="secondary"
            className="mt-4 w-full sm:w-auto"
            onClick={() => resume.mutate()}
            loading={resume.isPending}
            loadingLabel="Abriendo…"
          >
            <FileText className="size-4" aria-hidden="true" />
            {uiText("Ver el currículum de")}{firstName}
          </Button>
        ) : null}
      </header>

      {/* ---- Qué hago ahora --------------------------------------------- */}
      <section
        aria-labelledby="que-hago"
        className="relative overflow-hidden rounded-xl border border-accent-line/40 bg-surface-1 p-5 shadow-e2 sm:p-6"
      >
        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-accent-fill" />
        <div className="pl-3">
          <h2 id="que-hago" className="text-lg font-semibold text-ink-1">
            {t("profile.whatNow")}
          </h2>

          {!canUpdate ? (
            <p className="mt-2 text-sm text-ink-2">{t("profile.readOnly")}</p>
          ) : readyToHire ? (
            <>
              <p className="mt-1 text-ink-2">{t("profile.decidedToHire", { name: firstName })}</p>
              <Button
                type="button"
                size="lg"
                className="mt-4 w-full sm:w-auto"
                onClick={() => contract.mutate()}
                loading={contract.isPending}
                loadingLabel={t("profile.preparing")}
              >
                {t("profile.prepareHiring", { name: firstName })}
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </>
          ) : moves.primary ? (
            <>
              <p className="mt-1 text-ink-2">{phaseMeaning(phase.id, locale)}</p>
              <Button
                type="button"
                size="lg"
                className="mt-4 w-full sm:w-auto"
                onClick={() => move.mutate({ stage: moves.primary!.stage })}
                loading={move.isPending}
              >
                {moves.primary.label}
              </Button>
            </>
          ) : (
            <p className="mt-2 text-sm text-ink-2">{t("profile.nothingPending", { name: firstName })}</p>
          )}

          {/* Descartar deja de vivir dentro de «Otras opciones», que iba
              plegado y no lo nombraba. La plantilla por defecto permite el
              descarte desde TODAS las etapas no terminales, así que la acción
              estaba disponible siempre y no se veía nunca. Va al lado de la
              principal, en rojo y con su verbo. */}
          {canUpdate && moves.reject ? (
            <Button
              type="button"
              variant="destructive"
              className="mt-3 w-full sm:ml-3 sm:mt-4 sm:w-auto"
              disabled={move.isPending}
              onClick={() => setRejecting(moves.reject!)}
            >
              <UserX className="size-4" aria-hidden="true" />
              {uiText("Descartar a {{nombre}}", { nombre: firstName })}
            </Button>
          ) : null}

          {/* En la fase de entrevista, el paso siguiente NO es mover de etapa:
              es acordar día y hora. Esa herramienta existía solo en la ficha
              avanzada, así que desde aquí había que salir de la pantalla para
              dar el paso que esta misma pantalla acaba de pedir. Ahora se
              agenda aquí, contra el mismo endpoint. */}
          {phase.id === "CONOCIENDO" ? (
            <ScheduleInterviewPanel application={application} canSchedule={canSchedule} />
          ) : null}

          {canUpdate && moves.others.length ? (
            <div className="mt-4">
              <SimpleSection
                title={t("people.otherOptions")}
                hint={moves.others.length === 1 ? t("people.availableOne") : t("people.availableMany", { count: moves.others.length })}
              >
                <div className="flex flex-wrap gap-2">
                  {moves.others.map((option) => (
                    <Button
                      key={option.stage.code}
                      type="button"
                      variant={option.needsReason ? "destructive" : "secondary"}
                      disabled={move.isPending}
                      onClick={() => (option.needsReason ? setRejecting(option) : move.mutate({ stage: option.stage }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </SimpleSection>
            </div>
          ) : null}
        </div>
      </section>

      {/* ---- Historia --------------------------------------------------- */}
      <section aria-labelledby="historia" className="space-y-3">
        <h2 id="historia" className="text-base font-semibold text-ink-1">
          {uiText("Cómo llegó hasta aquí")}</h2>
        <Timeline entries={timeline} />
      </section>

      {/* ---- El resto, plegado ------------------------------------------ */}
      <section aria-labelledby="mas-de" className="space-y-2">
        <h2 id="mas-de" className="text-base font-semibold text-ink-1">
          {t("profile.moreAbout", { name: firstName })}
        </h2>

        <SimpleSection title={t("profile.theirApplication")} hint={formatApplicationDate(application.appliedAt)}>
          <dl>
            <DataRow label={t("profile.role")} value={application.vacancy.title} />
            <DataRow label={t("profile.currentStage")} value={application.currentStage?.name ?? phaseTitle(phase.id, locale)} />
            <DataRow label={t("profile.appliedOn")} value={formatApplicationDate(application.appliedAt)} />
            <DataRow
              label={t("profile.owner")}
              value={application.assignedRecruiter ? `${application.assignedRecruiter.firstName} ${application.assignedRecruiter.lastName}` : t("profile.unassigned")}
            />
            {application.coverLetter ? <DataRow label={t("profile.whatTheyWrote")} value={application.coverLetter} /> : null}
          </dl>
        </SimpleSection>

        <SimpleSection title={t("profile.internalNotes")} hint={t("profile.internalNotesHint")}>
          <label className="block space-y-2 font-medium text-ink-1" htmlFor="person-notes">
            {uiText("Escribe lo que quieras recordar")}<textarea
              id="person-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={!canUpdate}
              className="min-h-32 w-full rounded-md border border-line-control bg-surface-1 p-3 text-base font-normal text-ink-1 disabled:bg-surface-2 disabled:text-ink-disabled sm:text-sm"
              placeholder={t("profile.notesPlaceholder")}
            />
          </label>
          {canUpdate ? (
            <Button
              type="button"
              className="mt-3"
              onClick={() => saveNotes.mutate()}
              disabled={notes === (application.notes ?? "")}
              loading={saveNotes.isPending}
              loadingLabel={t("vacancies.saving")}
            >
              {t("profile.saveNote")}
            </Button>
          ) : null}
        </SimpleSection>

        <SimpleSection
          title={t("profile.messages")}
          hint={communications.data?.length ? t("profile.messagesCount", { count: communications.data.length }) : t("profile.noneYet")}
        >
          {communications.data?.length ? (
            <ol className="space-y-3">
              {communications.data.slice(0, 10).map((message) => (
                <li key={message.id} className="border-l-2 border-line pl-3">
                  <p className="font-medium text-ink-1">{message.subject}</p>
                  <p className="mt-0.5 font-mono text-xs text-ink-3 tabular-figures">
                    {formatApplicationDate(message.createdAt)}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-ink-2">{t("profile.noMessages")}</p>
          )}
        </SimpleSection>

        <SimpleSection title={t("people.advancedTools")} hint={t("profile.advancedHint")}>
          <p className="mb-3 text-sm text-ink-2">
            {uiText("La ficha completa tiene todo lo anterior más las evaluaciones de entrevista, el comité de decisión, el gestor de ofertas y la agenda. Nada se perdió: sigue ahí.")}</p>
          <Button asChild variant="secondary" className="w-full sm:w-auto">
            <Link href={`/ats/candidates/${application.id}/avanzado`}>
              {t("profile.openFullRecord", { name: firstName })}
            </Link>
          </Button>
        </SimpleSection>
      </section>

      <ReasonDialog
        open={Boolean(rejecting)}
        title={`Descartar a ${firstName}`}
        description={t("people.rejectDescription")}
        confirmLabel={t("people.confirmReject")}
        options={rejectionReasons.data?.map((reason) => ({ id: reason.id, label: reason.label }))}
        onOpenChange={(open) => !open && setRejecting(null)}
        onConfirm={({ reasonId, reason }) => {
          if (rejecting) move.mutate({ stage: rejecting.stage, reason, rejectionReasonId: reasonId });
          setRejecting(null);
        }}
      />
    </div>
  );
}

export function PersonProfilePage({ applicationId }: { applicationId: string }) {
  const { t } = useLocale();
  const application = useQuery({ queryKey: ["application", applicationId], queryFn: () => fetchApplication(applicationId), enabled: Boolean(applicationId) });
  if (application.isLoading) return <SkeletonRows rows={4} label={t("profile.loading")} />;
  if (application.isError || !application.data) {
    return <ErrorState title={t("profile.errorTitle")} onRetry={() => void application.refetch()} />;
  }
  return <PersonProfile application={application.data} />;
}
