"use client";

import { BadgeCheck, Check, ClipboardCheck, FileText, Send, ShieldCheck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";
import { HIRING_STAGES, hiringStageIndex, hiringStageTitle, type HiringCaseState, type HiringStageId } from "@/lib/hiring-ux";

/**
 * Icono de cada etapa. Es la parte «gráfica» del flujo: la misma figura
 * aparece en el paso a paso, en la cabecera del panel y en la lista, así que
 * la persona reconoce la etapa sin leer.
 */
export const HIRING_STAGE_ICONS: Record<HiringStageId, LucideIcon> = {
  PREPARACION: ClipboardCheck,
  OFERTA: Send,
  DOCUMENTOS: FileText,
  REVISION: ShieldCheck,
  CONFIRMACION: BadgeCheck,
};

/**
 * Barra de avance (compatibilidad).
 *
 * El paso a paso de abajo ya expone el progreso con `role="progressbar"`;
 * esta barra queda para quien la siga importando, pero la cabecera no la
 * pinta: decir «Etapa 2 de 5», «40 % completado» y además marcar la etapa en
 * el raíl era decir lo mismo tres veces.
 */
export function HiringProgressBar({ state }: { state: HiringCaseState }) {
  const { locale, t } = useLocale();
  const stage = HIRING_STAGES[state.stageIndex];
  const valueText = state.cancelled
    ? t("hiring.rail.cancelled")
    : state.completed
      ? t("hiring.rail.completed")
      : t("hiring.stageOf", { step: stage.step, total: HIRING_STAGES.length, title: hiringStageTitle(stage.id, locale) });
  return (
    <div
      role="progressbar"
      aria-valuenow={state.progressPercent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={valueText}
      className="h-2 overflow-hidden rounded-full bg-surface-3"
    >
      <div className="h-full rounded-full bg-action motion-safe:transition-[width] motion-safe:duration-500" style={{ width: `${state.progressPercent}%` }} />
    </div>
  );
}

/**
 * Paso a paso de la contratación: cinco círculos con icono unidos por una
 * línea que se va rellenando.
 *
 *   · Completada → círculo verde con marca.
 *   · Actual     → círculo relleno con el color de acción y título en negrita.
 *   · Pendiente  → círculo hueco gris.
 *
 * Nada depende solo del color: la marca, el relleno y las palabras
 * «Completada / Etapa actual / Pendiente» (para lectores de pantalla) llevan
 * la misma información. La etapa actual lleva `aria-current="step"`.
 *
 * Si se pasa `onSelect`, las etapas ya alcanzadas (y la siguiente) se pueden
 * pulsar para volver a mirarlas; las demás no son botones, para no prometer
 * un salto que la máquina de estados del servidor no permite.
 *
 * En móvil los títulos de las etapas que no son la actual se ocultan (siguen
 * en `sr-only`): cinco rótulos en 390 px se pisan y no se leen.
 */
export function HiringStageRail({
  state,
  viewing,
  onSelect,
}: {
  state: HiringCaseState;
  /** Etapa que se está mirando, si es distinta de la actual. */
  viewing?: HiringStageId;
  onSelect?: (stage: HiringStageId) => void;
}) {
  const { locale, t } = useLocale();
  const shown = viewing ?? state.stage;
  const reachable = Math.min(state.stageIndex + 1, HIRING_STAGES.length - 1);
  const valueText = state.cancelled
    ? t("hiring.rail.cancelled")
    : state.completed
      ? t("hiring.rail.completed")
      : t("hiring.stageOf", { step: HIRING_STAGES[state.stageIndex].step, total: HIRING_STAGES.length, title: hiringStageTitle(state.stage, locale) });

  return (
    <nav aria-label={t("hiring.rail.aria")}>
      <p className="sr-only" role="progressbar" aria-valuenow={state.progressPercent} aria-valuemin={0} aria-valuemax={100} aria-valuetext={valueText}>
        {valueText}
      </p>
      <ol className="flex items-start">
        {HIRING_STAGES.map((stage, index) => {
          const Icon = HIRING_STAGE_ICONS[stage.id];
          const done = state.completed || index < state.stageIndex;
          const current = !state.completed && index === state.stageIndex;
          const viewingThis = shown === stage.id;
          const clickable = Boolean(onSelect) && !state.cancelled && !state.completed && index <= reachable && !viewingThis;
          const stateWord = done ? t("hiring.rail.done") : current ? t("hiring.rail.current") : t("hiring.rail.pending");
          const title = hiringStageTitle(stage.id, locale);
          const last = index === HIRING_STAGES.length - 1;

          const circle = (
            <span
              aria-hidden="true"
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-full border-2 transition-colors sm:size-12",
                done && "border-status-success bg-status-success text-white",
                current && !state.cancelled && "border-action bg-action text-on-action shadow-e2",
                current && state.cancelled && "border-status-danger bg-status-danger/10 text-status-danger",
                !done && !current && "border-line-strong bg-surface-1 text-ink-3",
                viewingThis && !current && "ring-2 ring-focus ring-offset-2 ring-offset-surface-1",
              )}
            >
              {done ? <Check className="size-5" strokeWidth={2.5} /> : <Icon className="size-5" strokeWidth={1.75} />}
            </span>
          );

          const label = (
            <span
              className={cn(
                "mt-2 block max-w-[7.5rem] text-center text-sm leading-tight",
                current ? "font-semibold text-ink-1" : done ? "text-ink-1" : "text-ink-3",
                !current && "sr-only sm:not-sr-only",
              )}
            >
              {title}
              <span className="sr-only">, {stateWord}</span>
            </span>
          );

          return (
            <li
              key={stage.id}
              aria-current={current ? "step" : undefined}
              className="relative flex min-w-0 flex-1 flex-col items-center"
            >
              {/* Línea hacia la etapa siguiente: verde si esta ya se completó. */}
              {!last ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-1/2 top-[22px] h-0.5 w-full sm:top-6",
                    done ? "bg-status-success" : "bg-line",
                  )}
                />
              ) : null}
              {clickable ? (
                <button
                  type="button"
                  onClick={() => onSelect?.(stage.id)}
                  className="relative z-10 flex min-h-[var(--control-h-touch)] flex-col items-center rounded-md px-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  aria-label={`${t("hiring.rail.goTo")}: ${title}`}
                >
                  {circle}
                  {label}
                </button>
              ) : (
                <span className="relative z-10 flex min-h-[var(--control-h-touch)] flex-col items-center px-1">
                  {circle}
                  {label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {/* En móvil solo se ve el título de la etapa actual; si se está mirando
          otra, se dice cuál. */}
      {viewing && viewing !== state.stage ? (
        <p className="mt-3 text-center text-sm text-ink-2 sm:hidden">
          {t("hiring.rail.viewing", { title: hiringStageTitle(viewing, locale) })}
        </p>
      ) : null}
    </nav>
  );
}

export function hiringStageStep(stage: HiringStageId) {
  return hiringStageIndex(stage) + 1;
}
