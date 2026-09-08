"use client";

import { useUiText } from "@/components/ui-copy";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CircleAlert, CircleCheck, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BlockerList, StatusBadge, WarningList } from "@/components/system/feedback";
import { Stepper } from "@/components/system/stepper";
import {
  OPERATION_STEPS,
  OPERATION_STEP_LABELS,
  adverseCount,
  canConfirm,
  canNavigateTo,
  confirmBlockedReason,
  confirmLabel,
  consequenceSentence,
  stepIndex,
  type OperationImpact,
  type OperationOutcome,
  type OperationState,
  type OperationStepId,
} from "@/lib/operation-flow";
import { useLocale } from "@/components/locale-provider";

/* ==========================================================================
   PATRÓN UNIVERSAL DE OPERACIONES
   ==========================================================================
   Seleccionar → Registrar → Revisar impacto → Confirmar → Ver resultado.

   Las reglas viven en `lib/operation-flow.ts`, que es puro y está probado.
   Aquí solo se pinta. Ningún componente de esta familia decide por su cuenta
   si se puede confirmar: se lo pregunta a `canConfirm`.
   ========================================================================== */

export function OperationStepper({
  state,
  onStepChange,
}: {
  state: OperationState;
  onStepChange?: (step: OperationStepId) => void;
}) {
  const uiText = useUiText();
  const { t } = useLocale();
  const current = stepIndex(state.step);

  // El mismo paso a paso gráfico que en contratación, cursos y entradas de
  // mercancía: círculos unidos por una línea. Solo se puede volver a los pasos
  // que la operación permite (`canNavigateTo`); los demás no son botones.
  return (
    <div>
      <Stepper
        label={t("sys.operationProgress")}
        steps={OPERATION_STEPS.map((step) => ({ label: OPERATION_STEP_LABELS[step] }))}
        current={current}
        onSelect={
          onStepChange
            ? (index) => {
                const target = OPERATION_STEPS[index];
                if (canNavigateTo(state, target)) onStepChange(target);
              }
            : undefined
        }
      />
      {/* Redundancia textual: el estado del paso no puede depender solo del
          color del círculo. */}
      <p className="sr-only" aria-live="polite">
        {uiText("Paso")}{current + 1} {uiText(" de ")}{OPERATION_STEPS.length}: {OPERATION_STEP_LABELS[state.step]}
      </p>
    </div>
  );
}

/* ==========================================================================
   REVISIÓN DEL IMPACTO
   ==========================================================================
   El paso que existe para que nadie confirme a ciegas. Muestra, en este orden:
   estado actual y resultado esperado, cuántos registros cambian, el impacto
   económico, los avisos, los bloqueos y quién queda como responsable.
   ========================================================================== */

export function ImpactReview({ impact }: { impact: OperationImpact }) {
  const uiText = useUiText();
  const { t } = useLocale();
  const adverse = adverseCount(impact);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-line bg-surface-1 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h2 className="text-base font-semibold text-ink-1">{impact.headline}</h2>
            <p className="text-sm text-ink-2">
              {uiText("Afecta a")}{" "}
              <span className="font-mono font-semibold text-ink-1 tabular-figures">{impact.affectedCount}</span>{" "}
              {impact.affectedLabel}
            </p>
          </div>
          {adverse > 0 ? (
            <StatusBadge
              tone="warning"
              label={adverse === 1 ? "1 cambio desfavorable" : `${adverse} cambios desfavorables`}
            />
          ) : (
            <StatusBadge tone="success" label={t("sys.noAdverseChanges")} />
          )}
        </div>

        {impact.lines.length > 0 ? (
          <table className="mt-4 w-full border-collapse text-sm">
            <caption className="sr-only">{t("sys.impactCaption")}</caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="pb-2 text-left text-2xs font-semibold uppercase tracking-[0.08em] text-ink-2">
                  {t("sys.item")}
                </th>
                <th scope="col" className="pb-2 text-right text-2xs font-semibold uppercase tracking-[0.08em] text-ink-2">
                  {t("sys.now")}
                </th>
                <th scope="col" className="pb-2 text-right text-2xs font-semibold uppercase tracking-[0.08em] text-ink-2">
                  {t("sys.after")}
                </th>
              </tr>
            </thead>
            <tbody>
              {impact.lines.map((line) => (
                <tr key={line.label} className="border-b border-line last:border-0">
                  <td className="py-2 pr-2 text-ink-1">{line.label}</td>
                  <td className="py-2 text-right font-mono text-ink-2 tabular-figures">{line.before}</td>
                  <td
                    className={cn(
                      "py-2 text-right font-mono font-semibold tabular-figures",
                      line.adverse ? "text-status-warning" : "text-ink-1",
                    )}
                  >
                    {line.after}
                    {/* El color no basta: se dice con palabras. */}
                    {line.adverse ? <span className="sr-only"> {uiText(" (desfavorable)")}</span> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}

        {impact.cost ? (
          <div
            className={cn(
              "mt-4 flex flex-wrap items-baseline justify-between gap-2 rounded-lg border p-4",
              impact.cost.adverse ? "border-status-warning/30 bg-status-warning/5" : "border-line bg-surface-2",
            )}
          >
            <span className="text-sm text-ink-2">{impact.cost.label}</span>
            <span className="flex items-baseline gap-2">
              <span className="font-mono text-xl font-semibold text-ink-1 tabular-figures">{impact.cost.amount}</span>
              {impact.cost.variation ? (
                <span
                  className={cn(
                    "font-mono text-xs tabular-figures",
                    impact.cost.adverse ? "text-status-warning" : "text-ink-2",
                  )}
                >
                  {impact.cost.variation}
                </span>
              ) : null}
            </span>
          </div>
        ) : null}
      </div>

      <WarningList warnings={impact.warnings} />
      <BlockerList blockers={impact.blockers} />

      <p className="text-xs text-ink-3">
        {t("sys.recordedUnder")} <span className="text-ink-2">{impact.responsible}</span>.
      </p>
    </div>
  );
}

/* ==========================================================================
   CONFIRMACIÓN
   ==========================================================================
   El punto de no retorno. Dice con todas las letras qué va a pasar y si se
   puede deshacer, y cuando NO se puede, exige una casilla explícita: la
   fricción está puesta a propósito.
   ========================================================================== */

export function ConfirmPanel({
  state,
  operationName,
  onConfirm,
  onBack,
  acknowledged,
  onAcknowledgedChange,
}: {
  state: OperationState;
  /** Verbo de la operación: "Registrar merma", "Confirmar contratación". */
  operationName: string;
  onConfirm: () => void;
  onBack?: () => void;
  /** Solo se usa si la operación es irreversible. */
  acknowledged?: boolean;
  onAcknowledgedChange?: (value: boolean) => void;
}) {
  const uiText = useUiText();
  const { t } = useLocale();
  const impact = state.impact;
  if (!impact) return null;

  const blockedReason = confirmBlockedReason(state);
  const irreversible = impact.irreversible;
  const needsAck = irreversible && onAcknowledgedChange !== undefined;
  const ready = canConfirm(state) && (!needsAck || acknowledged === true);

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "rounded-xl border p-5",
          irreversible ? "border-status-danger/40 bg-status-danger/5" : "border-line bg-surface-1",
        )}
      >
        <h2 className="flex items-start gap-2 text-base font-semibold text-ink-1">
          {irreversible ? (
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-status-danger" aria-hidden="true" />
          ) : (
            <CircleAlert className="mt-0.5 size-5 shrink-0 text-ink-3" aria-hidden="true" />
          )}
          {irreversible ? t("sys.irreversible") : t("sys.reviewBeforeConfirm")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">{consequenceSentence(impact)}</p>

        {needsAck ? (
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-status-danger/30 bg-surface-1 p-3">
            <input
              type="checkbox"
              checked={acknowledged ?? false}
              onChange={(event) => onAcknowledgedChange?.(event.target.checked)}
              className="mt-0.5 size-5 shrink-0 rounded-xs border-line-control accent-[hsl(var(--status-danger))]"
            />
            <span className="text-sm text-ink-1">
              {uiText("Entiendo que esta operación es definitiva y que afectará a")}{impact.affectedCount}{" "}
              {impact.affectedLabel}.
            </span>
          </label>
        ) : null}
      </div>

      {blockedReason ? (
        <p role="status" className="text-sm text-status-danger">
          {blockedReason}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onBack ? (
          <Button type="button" variant="secondary" onClick={onBack} className="sm:w-auto">
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t("sys.backToReview")}
          </Button>
        ) : null}
        <Button
          type="button"
          size="lg"
          onClick={onConfirm}
          disabled={!ready}
          loading={state.submitting}
          loadingLabel={t("sys.recording")}
          variant={irreversible ? "destructive" : "default"}
        >
          {confirmLabel(operationName, irreversible)}
        </Button>
      </div>
    </div>
  );
}

/* ==========================================================================
   RESULTADO
   ==========================================================================
   El quinto acto. No es un aviso emergente que se desvanece: es una pantalla
   que dice qué pasó y ofrece lo siguiente. Un toast se pierde justo cuando el
   usuario aparta la vista para anotar algo.
   ========================================================================== */

export function OperationResultView({
  outcome,
  onRetry,
  onStartAnother,
  startAnotherLabel,
}: {
  outcome: OperationOutcome;
  onRetry?: () => void;
  onStartAnother?: () => void;
  startAnotherLabel?: string;
}) {
  const uiText = useUiText();
  const { t } = useLocale();
  const headingRef = useRef<HTMLHeadingElement>(null);

  // El foco viaja al resultado: sin esto, quien navega con teclado o lector se
  // queda en el botón de confirmar, que ya no existe, y no se entera de nada.
  useEffect(() => {
    headingRef.current?.focus();
  }, [outcome.status, outcome.headline]);

  const tone =
    outcome.status === "success" ? "success" : outcome.status === "partial" ? "warning" : "danger";
  const Icon = outcome.status === "success" ? CircleCheck : outcome.status === "partial" ? TriangleAlert : CircleAlert;

  return (
    <section
      role={outcome.status === "error" ? "alert" : "status"}
      className={cn(
        "rounded-xl border p-6",
        tone === "success" && "border-status-success/30 bg-status-success/5",
        tone === "warning" && "border-status-warning/30 bg-status-warning/5",
        tone === "danger" && "border-status-danger/30 bg-status-danger/5",
      )}
    >
      <Icon
        className={cn(
          "size-8",
          tone === "success" && "text-status-success",
          tone === "warning" && "text-status-warning",
          tone === "danger" && "text-status-danger",
        )}
        aria-hidden="true"
      />
      <h2 ref={headingRef} tabIndex={-1} className="mt-3 text-xl font-semibold text-ink-1 outline-none">
        {outcome.headline}
      </h2>

      {outcome.status !== "success" || outcome.detail ? (
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-2">{outcome.detail}</p>
      ) : null}

      {outcome.status === "partial" && outcome.failures.length > 0 ? (
        <>
          <h3 className="mt-4 text-sm font-semibold text-ink-1">{t("sys.notRecorded")}</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-2">
            {outcome.failures.map((failure) => (
              <li key={failure}>{failure}</li>
            ))}
          </ul>
        </>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {outcome.status === "success" && outcome.nextAction ? (
          <Button asChild>
            <Link href={outcome.nextAction.href}>
              {outcome.nextAction.label}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        ) : null}
        {outcome.status === "error" && outcome.retryable && onRetry ? (
          <Button type="button" onClick={onRetry}>
            {uiText("Reintentar")}</Button>
        ) : null}
        {onStartAnother ? (
          <Button type="button" variant="secondary" onClick={onStartAnother}>
            {startAnotherLabel ?? t("sys.recordAnother")}
          </Button>
        ) : null}
      </div>
    </section>
  );
}

/* ==========================================================================
   LÍNEA DE TIEMPO
   ==========================================================================
   Historia de un expediente. Es una `<ol>` de verdad para que se anuncie como
   una secuencia ordenada; el hilo vertical es decorativo.
   ========================================================================== */

export type TimelineEntry = {
  id: string;
  title: string;
  detail?: ReactNode;
  when: string;
  who?: string;
  tone?: "neutral" | "success" | "warning" | "danger";
};

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <ol className="relative space-y-5 pl-6">
      <span aria-hidden="true" className="absolute bottom-2 left-[7px] top-2 w-px bg-line" />
      {entries.map((entry) => (
        <li key={entry.id} className="relative">
          <span
            aria-hidden="true"
            className={cn(
              "absolute -left-6 top-1.5 size-[15px] rounded-full border-2 bg-surface-1",
              entry.tone === "success" && "border-status-success",
              entry.tone === "warning" && "border-status-warning",
              entry.tone === "danger" && "border-status-danger",
              (!entry.tone || entry.tone === "neutral") && "border-line-strong",
            )}
          />
          <p className="font-medium text-ink-1">{entry.title}</p>
          <p className="font-mono text-2xs text-ink-3 tabular-figures">
            {entry.when}
            {entry.who ? <span className="font-sans"> · {entry.who}</span> : null}
          </p>
          {entry.detail ? <div className="mt-1 text-sm text-ink-2">{entry.detail}</div> : null}
        </li>
      ))}
    </ol>
  );
}
