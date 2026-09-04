import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";
import { HIRING_STAGES, hiringStageTitle, type HiringCaseState } from "@/lib/hiring-ux";

/**
 * Barra de avance de la contratación.
 *
 * Antes era un `div` con un ancho en porcentaje: visualmente correcto y
 * completamente mudo para un lector de pantalla. Ahora expone el rol y el
 * valor, y `aria-valuetext` dice la etapa en palabras, que es lo que la
 * persona quiere oír ("Etapa 2 de 5: Oferta laboral"), no "40 por ciento".
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
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-base font-medium text-text-primary">{valueText}</p>
        <p className="text-base text-text-secondary">{state.progressPercent}% completado</p>
      </div>
      <div
        role="progressbar"
        aria-valuenow={state.progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={valueText}
        className="h-3 overflow-hidden rounded-full bg-surface-section"
      >
        <div
          className="h-full rounded-full bg-primary motion-safe:transition-[width] motion-safe:duration-500"
          style={{ width: `${state.progressPercent}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Las cinco etapas, siempre visibles.
 *
 * El estado de cada paso no se transmite solo con color: el paso completado
 * lleva una marca de verificación, el actual lleva su número en un círculo
 * relleno y un texto "Etapa actual", y los pendientes quedan en gris con la
 * palabra "Pendiente" para lectores de pantalla. Así funciona igual para
 * alguien que no distingue el verde del gris.
 */
export function HiringStageRail({ state }: { state: HiringCaseState }) {
  const { locale, t } = useLocale();
  return (
    <nav aria-label={t("hiring.rail.aria")}>
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {HIRING_STAGES.map((stage, index) => {
          const done = state.completed || index < state.stageIndex;
          const current = !state.completed && index === state.stageIndex;
          const stateWord = done ? t("hiring.rail.done") : current ? t("hiring.rail.current") : t("hiring.rail.pending");
          return (
            <li
              key={stage.id}
              aria-current={current ? "step" : undefined}
              className={cn(
                "flex items-start gap-3 rounded-2xl border p-3",
                current ? "border-primary bg-primary/[0.06]" : done ? "border-status-success/40 bg-status-success/[0.05]" : "border-border-default bg-surface-elevated",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full border text-base font-semibold",
                  done && "border-status-success bg-status-success/15 text-status-success",
                  current && "border-primary bg-primary text-text-on-accent",
                  !done && !current && "border-border-default text-text-secondary",
                )}
              >
                {done ? <Check className="size-5" /> : stage.step}
              </span>
              <span className="min-w-0">
                <span className={cn("block text-base", current ? "font-semibold text-text-primary" : done ? "font-medium text-text-primary" : "text-text-secondary")}>
                  {hiringStageTitle(stage.id, locale)}
                </span>
                <span className={cn("mt-0.5 block text-sm", current ? "text-text-primary" : "text-text-secondary")}>{stateWord}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
