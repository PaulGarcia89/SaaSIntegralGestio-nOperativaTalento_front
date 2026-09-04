"use client";

import { CalendarDays, CircleAlert, CircleCheck, Clock3, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { HiringContractDto, JobOfferVersionDto } from "@/lib/contracts";
import {
  explainHiringBlocker,
  hiringStatusLabel,
  hiringWaitingLabel,
  type HiringCaseState,
} from "@/lib/hiring-ux";
import { HiringProgressBar, HiringStageRail } from "@/components/hiring/hiring-stage-rail";
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
 * Encabezado del centro de contratación.
 *
 * Responde en un vistazo las tres primeras preguntas del rediseño: a quién
 * estoy contratando, en qué etapa estoy y quién tiene que actuar ahora. Todo
 * en texto de 16 px o mayor, sin abreviaturas y sin depender del color.
 */
export function HiringCaseHeader({ contract, state }: { contract: HiringContractDto; state: HiringCaseState }) {
  const { locale, t } = useLocale();
  const version = currentOfferVersion(contract);
  const startDate = longDate(version?.employmentStartDate);
  const deadline = longDate(contract.deadlineAt);
  const waiting = hiringWaitingLabel(state.waitingOn, contract.candidate.fullName.split(" ")[0] || "la persona");

  return (
    <Card level={1}>
      <CardContent className="space-y-7 p-5 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span aria-hidden="true" className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-xl font-semibold text-text-on-accent">
              {initials(contract.candidate.fullName)}
            </span>
            <div className="min-w-0">
              <p className="text-base font-medium text-text-secondary">{t("hiring.header.forPerson")}</p>
              <h1 className="mt-1 text-3xl font-semibold leading-tight text-text-primary sm:text-4xl">{contract.candidate.fullName}</h1>
              <p className="mt-2 text-lg text-text-primary">{contract.roleTitle ?? contract.vacancy.title}</p>
              <p className="mt-1 text-base text-text-secondary">
                {contract.vacancy.tenant?.name ?? t("hiring.activeCompany")} · {contract.branch.name}
              </p>
              <p className="mt-1 text-base text-text-secondary">{contract.candidate.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={state.completed ? "success" : state.cancelled ? "destructive" : state.blockers.length ? "warning" : "secondary"}
              className="text-sm"
            >
              {hiringStatusLabel(contract.status, locale)}
            </Badge>
            <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium", state.waitingOn === "CANDIDATO" ? "border-status-warning/40 bg-status-warning/10 text-text-primary" : state.waitingOn === "EMPRESA" ? "border-primary/40 bg-primary/10 text-text-primary" : "border-border-default text-text-secondary")}>
              {state.waitingOn === "CANDIDATO" ? <Clock3 className="size-4" aria-hidden="true" /> : state.waitingOn === "EMPRESA" ? <UserRound className="size-4" aria-hidden="true" /> : <CircleCheck className="size-4" aria-hidden="true" />}
              {waiting}
            </span>
          </div>
        </div>

        <dl className="grid gap-4 border-t border-border-default pt-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-base text-text-secondary">{t("hiring.header.startDate")}</dt>
            <dd className="mt-1 flex items-center gap-2 text-base font-medium text-text-primary">
              <CalendarDays className="size-5 text-text-secondary" aria-hidden="true" />
              {startDate ?? t("hiring.header.toBeSet")}
            </dd>
          </div>
          <div>
            <dt className="text-base text-text-secondary">{t("hiring.header.processDeadline")}</dt>
            <dd className="mt-1 text-base font-medium text-text-primary">{deadline ?? t("hiring.header.noDeadline")}</dd>
          </div>
          <div>
            <dt className="text-base text-text-secondary">Sueldo ofrecido</dt>
            <dd className="mt-1 text-base font-medium text-text-primary">{salaryText(version, locale) ?? t("hiring.header.toBeSet")}</dd>
          </div>
        </dl>

        <HiringProgressBar state={state} />
        <HiringStageRail state={state} />
      </CardContent>
    </Card>
  );
}

/**
 * Bloqueos explicados.
 *
 * La regla es que nunca se enseña un botón apagado sin decir por qué. Cada
 * bloqueo responde qué falta, por qué hace falta, quién lo resuelve y qué se
 * habilita después.
 */
export function HiringBlockerList({ state, candidateName }: { state: HiringCaseState; candidateName: string }) {
  const { locale, t } = useLocale();
  if (!state.blockers.length) return null;
  return (
    <div className="space-y-3">
      {state.blockers.map((blocker) => {
        const explanation = explainHiringBlocker(blocker, candidateName, locale);
        return (
          <div key={`${explanation.code}-${explanation.what}`} role="status" className="rounded-2xl border border-status-warning/40 bg-status-warning/[0.06] p-4">
            <p className="flex items-start gap-2 text-base font-semibold text-text-primary">
              <CircleAlert className="mt-0.5 size-5 shrink-0 text-status-warning" aria-hidden="true" />
              {explanation.what}
            </p>
            <dl className="mt-3 grid gap-2 pl-7 text-base text-text-secondary sm:grid-cols-3">
              <div>
                <dt className="font-medium text-text-primary">{t("hiring.blocker.whyLabel")}</dt>
                <dd>{explanation.why}</dd>
              </div>
              <div>
                <dt className="font-medium text-text-primary">{t("hiring.blocker.whoLabel")}</dt>
                <dd>{explanation.who}</dd>
              </div>
              <div>
                <dt className="font-medium text-text-primary">{t("hiring.blocker.nextLabel")}</dt>
                <dd>{explanation.unlocks}</dd>
              </div>
            </dl>
          </div>
        );
      })}
    </div>
  );
}
