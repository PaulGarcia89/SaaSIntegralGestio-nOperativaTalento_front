"use client";

import { CalendarDays, CircleAlert, CircleCheck, Clock3, UserRound, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HiringContractDto, JobOfferVersionDto } from "@/lib/contracts";
import {
  explainHiringBlocker,
  hiringStatusLabel,
  hiringWaitingLabel,
  type HiringCaseState,
  type HiringStageId,
} from "@/lib/hiring-ux";
import { HiringStageRail } from "@/components/hiring/hiring-stage-rail";
import { useLocale } from "@/components/locale-provider";
import { translate } from "@/i18n";
import type { SupportedLocale } from "@/i18n/types";

export function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
}

export function longDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("es", { dateStyle: "long" }).format(date);
}

export function currentOfferVersion(contract: HiringContractDto): JobOfferVersionDto | undefined {
  const offer = contract.jobOffer;
  if (!offer) return undefined;
  return offer.versions?.find((version) => version.version === offer.currentVersion) ?? offer.versions?.[0];
}

export function salaryText(version?: JobOfferVersionDto, locale: SupportedLocale = "es") {
  if (!version) return null;
  const keys: Record<string, string> = { HOURLY: "hiring.pay.HOURLY", WEEKLY: "hiring.pay.WEEKLY", BIWEEKLY: "hiring.pay.biweekly", MONTHLY: "hiring.pay.MONTHLY", ANNUAL: "hiring.pay.yearly" };
  const key = keys[version.periodicity];
  const periodicity = key ? translate(locale, key) : "";
  const amount = Number(version.salaryAmount);
  if (Number.isNaN(amount)) return null;
  // El idioma decide tambien el formato del numero: en ingles el separador de
  // miles es la coma y el decimal el punto, al reves que en espanol.
  const formatted = new Intl.NumberFormat(locale, { style: "currency", currency: version.currency || "USD", maximumFractionDigits: 0 }).format(amount);
  return `${formatted} ${periodicity}`.trim();
}

/**
 * Cabecera del centro de contratación.
 *
 * Responde tres preguntas y solo tres: a quién contrato, en qué paso estoy y
 * quién tiene que actuar ahora.
 *
 * Antes decía además el correo, la empresa, el estado técnico, el plazo del
 * proceso, «Etapa 2 de 5», «40 % completado» y un raíl con la palabra
 * «Pendiente» bajo tres tarjetas: la etapa aparecía tres veces y la persona
 * tenía que leer dos pantallas antes de llegar al botón. Todo eso sigue
 * disponible en «Más detalles», abajo, plegado.
 *
 * El sueldo y la fecha de inicio se muestran solo cuando existen, como dos
 * datos con icono; sin oferta no hay nada que decir y no se enseña «Por
 * definir» dos veces.
 */
export function HiringCaseHeader({
  contract,
  state,
  viewing,
  onSelectStage,
}: {
  contract: HiringContractDto;
  state: HiringCaseState;
  viewing?: HiringStageId;
  onSelectStage?: (stage: HiringStageId) => void;
}) {
  const { locale, t } = useLocale();
  const version = currentOfferVersion(contract);
  const startDate = longDate(version?.employmentStartDate);
  const salary = salaryText(version, locale);
  const firstName = contract.candidate.fullName.split(" ")[0] || "la persona";
  const waiting = state.cancelled
    ? hiringStatusLabel(contract.status, locale)
    : state.completed
      ? t("hiring.rail.completed")
      : hiringWaitingLabel(state.waitingOn, firstName);

  const pillTone = state.cancelled
    ? "border-status-danger/40 bg-status-danger/10 text-status-danger"
    : state.completed
      ? "border-status-success/40 bg-status-success/10 text-status-success"
      : state.waitingOn === "CANDIDATO"
        ? "border-status-warning/40 bg-status-warning/10 text-status-warning"
        : "border-accent-line/50 bg-accent-fill/10 text-ink-1";
  const PillIcon = state.cancelled ? CircleAlert : state.completed ? CircleCheck : state.waitingOn === "CANDIDATO" ? Clock3 : UserRound;

  return (
    <section aria-labelledby="hiring-case-title" className="rounded-lg border border-line bg-surface-1 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span
            aria-hidden="true"
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-action text-lg font-semibold text-on-action"
          >
            {initials(contract.candidate.fullName)}
          </span>
          <div className="min-w-0">
            <h1 id="hiring-case-title" className="line-clamp-2 break-words text-2xl font-semibold leading-tight text-ink-1 sm:text-3xl">
              {contract.candidate.fullName}
            </h1>
            <p className="mt-1 truncate text-base text-ink-2">
              {contract.roleTitle ?? contract.vacancy.title} · {contract.branch.name}
            </p>
          </div>
        </div>

        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-2 self-start rounded-full border px-3 py-1.5 text-sm font-medium",
            pillTone,
          )}
        >
          <PillIcon className="size-4" aria-hidden="true" />
          {waiting}
        </span>
      </div>

      {salary || startDate ? (
        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-2">
          {salary ? (
            <div className="flex items-center gap-2">
              <Wallet className="size-4 text-ink-3" aria-hidden="true" />
              <dt className="sr-only">{t("hiring.panel.salary")}</dt>
              <dd className="font-medium text-ink-1">{salary}</dd>
            </div>
          ) : null}
          {startDate ? (
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-ink-3" aria-hidden="true" />
              <dt className="sr-only">{t("hiring.header.startDate")}</dt>
              <dd>
                {t("hiring.header.startsOn")} <span className="font-medium text-ink-1">{startDate}</span>
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      <div className="mt-6 border-t border-line pt-6">
        <HiringStageRail state={state} viewing={viewing} onSelect={onSelectStage} />
      </div>
    </section>
  );
}

/**
 * Bloqueos, en una línea cada uno.
 *
 * Antes cada bloqueo era una caja con tres columnas (por qué · quién · qué
 * sigue). Aquí se dice lo imprescindible —qué falta y quién lo resuelve— y
 * el porqué se abre solo si alguien lo pide. La regla se conserva: nunca un
 * botón apagado sin explicación.
 */
export function HiringBlockerList({ state, candidateName }: { state: HiringCaseState; candidateName: string }) {
  const { locale, t } = useLocale();
  if (!state.blockers.length) return null;
  return (
    <ul className="space-y-2" aria-label={t("hiring.blocker.listAria")}>
      {state.blockers.map((blocker) => {
        const explanation = explainHiringBlocker(blocker, candidateName, locale);
        return (
          <li key={`${explanation.code}-${explanation.what}`} role="status" className="rounded-lg border border-status-warning/40 bg-status-warning/5 px-4 py-3">
            <details className="group">
              <summary className="flex min-h-[var(--control-h-base)] cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
                <CircleAlert className="size-5 shrink-0 text-status-warning" aria-hidden="true" />
                <span className="min-w-0 flex-1 text-base">
                  <span className="block font-semibold text-ink-1">{explanation.what}</span>
                  <span className="block text-sm text-ink-2">{t("hiring.blocker.whoLabel")}: {explanation.who}</span>
                </span>
                <span className="shrink-0 self-center text-sm font-medium text-ink-2 group-open:hidden">{t("hiring.blocker.why")}</span>
              </summary>
              <dl className="mt-2 grid gap-2 pl-8 text-sm text-ink-2 sm:grid-cols-2">
                <div>
                  <dt className="font-medium text-ink-1">{t("hiring.blocker.whyLabel")}</dt>
                  <dd>{explanation.why}</dd>
                </div>
                <div>
                  <dt className="font-medium text-ink-1">{t("hiring.blocker.nextLabel")}</dt>
                  <dd>{explanation.unlocks}</dd>
                </div>
              </dl>
            </details>
          </li>
        );
      })}
    </ul>
  );
}
