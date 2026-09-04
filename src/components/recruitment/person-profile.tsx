"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, FileText, Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { AsyncState } from "@/components/async-state";
import { ReasonDialog } from "@/components/simple/reason-dialog";
import { PhaseChip, SimpleSection, SimpleScreen, TAP_TARGET } from "@/components/simple/simple-ui";
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
  stageMovesFor,
  waitingLabel,
  type StageMove,
  phaseMeaning,
  phaseTitle,
} from "@/lib/recruitment-ux";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";
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
 */

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b border-border-default py-3 last:border-b-0">
      <dt className="text-text-secondary">{label}</dt>
      <dd className="mt-1 text-text-primary">{value}</dd>
    </div>
  );
}

function PersonProfile({ application }: { application: VacancyApplicationDto }) {
  const { locale, t } = useLocale();
  const client = useQueryClient();
  const { can } = useAppStore();
  const canUpdate = can("applications.update");
  const [notes, setNotes] = useState(application.notes ?? "");
  const [rejecting, setRejecting] = useState<StageMove | null>(null);

  const stages: VacancyStageDto[] = application.vacancy.stages ?? [];
  const moves = stageMovesFor(application, stages);
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
    onSuccess: async () => { toast.success("Listo, lo dejamos como estaba."); await refresh(); },
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

  return (
    <SimpleScreen>
      <nav aria-label={t("profile.backAria")}>
        <Link href="/ats/candidates" className={cn(TAP_TARGET, "inline-flex items-center gap-2 rounded-full border border-border-default px-5 font-semibold text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus")}>
          <ArrowLeft className="size-5" aria-hidden="true" />
          {t("profile.back")}
        </Link>
      </nav>

      <header className="rounded-2xl border border-border-default bg-surface-elevated p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span aria-hidden="true" className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-xl font-semibold text-text-on-accent">
              {initials(name)}
            </span>
            <div className="min-w-0">
              <h1 className="text-3xl font-semibold leading-tight text-text-primary sm:text-4xl">{name}</h1>
              <p className="mt-2 text-lg text-text-primary">Se postuló para {application.vacancy.title}</p>
              <p className="mt-1 text-text-secondary">{application.vacancy.branch?.name ?? t("people.noBranch")}</p>
              <p className="mt-1 text-text-secondary">{waitingLabel(application.appliedAt)}</p>
            </div>
          </div>
          <PhaseChip label={phaseTitle(phase.id, locale)} tone={phase.id === "DESCARTADOS" ? "neutral" : "waiting"} />
        </div>

        <dl className="mt-6 grid gap-4 border-t border-border-default pt-5 sm:grid-cols-3">
          <div>
            <dt className="text-text-secondary">{t("profile.email")}</dt>
            <dd className="mt-1 flex items-center gap-2 text-text-primary">
              <Mail className="size-5 shrink-0 text-text-secondary" aria-hidden="true" />
              <a href={`mailto:${application.candidate.email}`} className="underline underline-offset-4">{application.candidate.email}</a>
            </dd>
          </div>
          <div>
            <dt className="text-text-secondary">{t("profile.phone")}</dt>
            <dd className="mt-1 flex items-center gap-2 text-text-primary">
              <Phone className="size-5 shrink-0 text-text-secondary" aria-hidden="true" />
              {application.candidate.phone ? <a href={`tel:${application.candidate.phone}`} className="underline underline-offset-4">{application.candidate.phone}</a> : t("profile.notGivenM")}
            </dd>
          </div>
          <div>
            <dt className="text-text-secondary">{t("profile.city")}</dt>
            <dd className="mt-1 flex items-center gap-2 text-text-primary">
              <MapPin className="size-5 shrink-0 text-text-secondary" aria-hidden="true" />
              {application.candidate.city ?? t("profile.notGivenF")}
            </dd>
          </div>
        </dl>

        {application.candidate.resumeAvailable ? (
          <button
            type="button"
            onClick={() => resume.mutate()}
            disabled={resume.isPending}
            className={cn(TAP_TARGET, "mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-border-default px-5 font-semibold text-text-primary disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus sm:w-auto")}
          >
            <FileText className="size-5" aria-hidden="true" />
            {resume.isPending ? "Abriendo…" : `Ver el currículum de ${firstName}`}
          </button>
        ) : null}
      </header>

      <section aria-labelledby="que-hago" className="rounded-2xl border border-primary/30 bg-primary/[0.04] p-5 sm:p-7">
        <h2 id="que-hago" className="text-2xl font-semibold text-text-primary">{t("profile.whatNow")}</h2>

        {!canUpdate ? (
          <p className="mt-3 text-text-secondary">{t("profile.readOnly")}</p>
        ) : readyToHire ? (
          <>
            <p className="mt-2 text-text-primary">{t("profile.decidedToHire", { name: firstName })}</p>
            <button
              type="button"
              onClick={() => contract.mutate()}
              disabled={contract.isPending}
              className={cn(TAP_TARGET, "mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 font-semibold text-text-on-accent disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus sm:w-auto")}
            >
              {contract.isPending ? t("profile.preparing") : t("profile.prepareHiring", { name: firstName })}
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </>
        ) : moves.primary ? (
          <>
            <p className="mt-2 text-text-primary">{phaseMeaning(phase.id, locale)}</p>
            <button
              type="button"
              onClick={() => move.mutate({ stage: moves.primary!.stage })}
              disabled={move.isPending}
              className={cn(TAP_TARGET, "mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 font-semibold text-text-on-accent disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus sm:w-auto")}
            >
              {moves.primary.label}
            </button>
          </>
        ) : (
          <p className="mt-3 text-text-secondary">{t("profile.nothingPending", { name: firstName })}</p>
        )}

        {canUpdate && moves.others.length ? (
          <div className="mt-4">
            <SimpleSection title={t("people.otherOptions")} hint={moves.others.length === 1 ? t("people.availableOne") : t("people.availableMany", { count: moves.others.length })}>
              <div className="flex flex-col gap-2">
                {moves.others.map((option) => (
                  <button
                    key={option.stage.code}
                    type="button"
                    disabled={move.isPending}
                    onClick={() => (option.needsReason ? setRejecting(option) : move.mutate({ stage: option.stage }))}
                    className={cn(TAP_TARGET, "rounded-full border px-5 font-semibold disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus", option.needsReason ? "border-status-danger/50 text-text-primary" : "border-border-default text-text-primary")}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </SimpleSection>
          </div>
        ) : null}
      </section>

      <section aria-labelledby="mas-de" className="space-y-3">
        <h2 id="mas-de" className="text-xl font-semibold text-text-primary">{t("profile.moreAbout", { name: firstName })}</h2>

        <SimpleSection title={t("profile.theirApplication")} hint={formatApplicationDate(application.appliedAt)}>
          <dl>
            <DataRow label={t("profile.role")} value={application.vacancy.title} />
            <DataRow label={t("profile.currentStage")} value={application.currentStage?.name ?? phaseTitle(phase.id, locale)} />
            <DataRow label={t("profile.appliedOn")} value={formatApplicationDate(application.appliedAt)} />
            <DataRow label={t("profile.owner")} value={application.assignedRecruiter ? `${application.assignedRecruiter.firstName} ${application.assignedRecruiter.lastName}` : t("profile.unassigned")} />
            {application.coverLetter ? <DataRow label={t("profile.whatTheyWrote")} value={application.coverLetter} /> : null}
          </dl>
        </SimpleSection>

        <SimpleSection title={t("profile.internalNotes")} hint={t("profile.internalNotesHint")}>
          <label className="block space-y-2 font-medium text-text-primary" htmlFor="person-notes">
            Escribe lo que quieras recordar
            <textarea
              id="person-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={!canUpdate}
              className="min-h-32 w-full rounded-xl border border-border-default bg-surface-elevated p-3 text-base disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
              placeholder={t("profile.notesPlaceholder")}
            />
          </label>
          {canUpdate ? (
            <button
              type="button"
              onClick={() => saveNotes.mutate()}
              disabled={saveNotes.isPending || notes === (application.notes ?? "")}
              className={cn(TAP_TARGET, "mt-3 rounded-full bg-primary px-5 font-semibold text-text-on-accent disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus")}
            >
              {saveNotes.isPending ? t("vacancies.saving") : t("profile.saveNote")}
            </button>
          ) : null}
        </SimpleSection>

        <SimpleSection title={t("profile.messages")} hint={communications.data?.length ? t("profile.messagesCount", { count: communications.data.length }) : t("profile.noneYet")}>
          {communications.data?.length ? (
            <ol className="space-y-3">
              {communications.data.slice(0, 10).map((message) => (
                <li key={message.id} className="border-l-2 border-border-default pl-3">
                  <p className="font-medium text-text-primary">{message.subject}</p>
                  <p className="mt-0.5 text-text-secondary">{formatApplicationDate(message.createdAt)}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-text-secondary">{t("profile.noMessages")}</p>
          )}
        </SimpleSection>

        <SimpleSection title={t("people.advancedTools")} hint={t("profile.advancedHint")}>
          <p className="mb-3 text-text-secondary">
            La ficha completa tiene todo lo anterior más las evaluaciones de entrevista, el comité de decisión, el gestor de ofertas y la agenda. Nada se perdió: sigue ahí.
          </p>
          <Link
            href={`/ats/candidates/${application.id}/avanzado`}
            className={cn(TAP_TARGET, "flex items-center justify-center rounded-full border border-border-default px-5 font-semibold text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus")}
          >
            {t("profile.openFullRecord", { name: firstName })}
          </Link>
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
    </SimpleScreen>
  );
}

export function PersonProfilePage({ applicationId }: { applicationId: string }) {
  const { t } = useLocale();
  const application = useQuery({ queryKey: ["application", applicationId], queryFn: () => fetchApplication(applicationId), enabled: Boolean(applicationId) });
  if (application.isLoading) return <AsyncState state="loading" title={t("profile.loading")} />;
  if (application.isError || !application.data) return <AsyncState state="error" title={t("profile.errorTitle")} onRetry={() => void application.refetch()} />;
  return <PersonProfile application={application.data} />;
}
