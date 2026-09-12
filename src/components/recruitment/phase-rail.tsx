"use client";

import { BriefcaseBusiness, CircleCheck, Inbox, MessagesSquare, type LucideIcon } from "lucide-react";
import { recruitmentStageLabel } from "@/lib/recruitment-stage-label";
import { cn } from "@/lib/utils";
import { MAIN_PHASES, phaseTitle, recruitmentPhaseOf, type RecruitmentPhaseId } from "@/lib/recruitment-ux";
import type { VacancyStageDto } from "@/lib/contracts";

/** Mismo icono por fase en el dashboard, el perfil y las listas. */
export const PHASE_ICONS: Partial<Record<RecruitmentPhaseId, LucideIcon>> = {
  POSTULARON: Inbox,
  CONOCIENDO: MessagesSquare,
  DECIDIDO: CircleCheck,
  TRABAJANDO: BriefcaseBusiness,
};

type Paso = { clave: string; titulo: string; icono: LucideIcon };

/** Etapas en vertical en móvil y conectadas en escritorio. Las anteriores no implican aprobación. */
function Recorrido({ pasos, actual, locale }: { pasos: Paso[]; actual: number; locale: "es" | "en" }) {
  return (
    <ol className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-0 sm:overflow-x-auto sm:pb-3" aria-label={locale === "en" ? "Process stages" : "Etapas del proceso"}>
      {pasos.map((paso, index) => {
        const done = index < actual;
        const active = index === actual;
        const Icon = paso.icono;
        const last = index === pasos.length - 1;
        return (
          <li key={paso.clave} aria-current={active ? "step" : undefined} className="relative flex min-w-0 items-center gap-3 sm:min-w-28 sm:flex-1 sm:flex-col sm:gap-0 sm:px-2">
            {!last ? (
              <span aria-hidden="true" className={cn("absolute left-5 top-5 h-[calc(100%+0.75rem)] w-0.5 sm:left-1/2 sm:h-0.5 sm:w-full", done ? "bg-line-strong" : "bg-line")} />
            ) : null}
            <span
              aria-hidden="true"
              className={cn(
                "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 bg-surface-1",
                done && "border-line-strong bg-surface-2 text-ink-2",
                active && "border-action bg-action text-on-action shadow-e2",
                !done && !active && "border-line-strong text-ink-3",
              )}
            >
              {done ? <span className="text-sm">{index + 1}</span> : <Icon className="size-4" strokeWidth={1.75} />}
            </span>
            <span
              className={cn(
                "block text-sm leading-snug sm:mt-2 sm:max-w-[7rem] sm:text-center",
                active ? "font-semibold text-ink-1" : done ? "text-ink-1" : "text-ink-3",

              )}
            >
              {paso.titulo}
              <span className="block text-xs font-normal text-ink-2">{done ? (locale === "en" ? "Previous" : "Anterior") : active ? (locale === "en" ? "Current stage" : "Etapa actual") : locale === "en" ? "Pending" : "Pendiente"}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Recorrido por las cuatro fases resumidas. */
export function RecruitmentPhaseRail({ currentStep, locale }: { currentStep: number; locale: "es" | "en" }) {
  const pasos: Paso[] = MAIN_PHASES.map((phase) => ({
    clave: phase.id,
    titulo: phaseTitle(phase.id, locale),
    icono: PHASE_ICONS[phase.id] ?? CircleCheck,
  }));
  return <Recorrido pasos={pasos} actual={Math.max(0, currentStep - 1)} locale={locale} />;
}

/**
 * Recorrido por las etapas REALES de la vacante.
 *
 * El recorrido de cuatro fases resumía seis etapas en cuatro círculos:
 * «Postulación» y «Revisión» se dibujaban como un solo punto, así que quien
 * revisaba un expediente no veía la etapa en la que estaba —la suya no
 * aparecía— ni cuántas quedaban de verdad. Aquí se dibuja el proceso tal como
 * lo configuró la empresa, con sus nombres.
 *
 * El descarte se queda fuera a propósito: no es un paso del camino, es salirse
 * de él, y a quien está descartado la ficha le enseña un texto en vez de un
 * recorrido con etapas que ya no va a recorrer.
 */
export function RecruitmentStageRail({ stages, currentStageCode, locale }: { stages: VacancyStageDto[]; currentStageCode?: string | null; locale: "es" | "en" }) {
  const camino = stages
    .filter((stage) => stage.applicationStatus !== "REJECTED" && stage.applicationStatus !== "WITHDRAWN")
    .sort((left, right) => left.position - right.position);

  if (!camino.length) return null;

  const actual = Math.max(0, camino.findIndex((stage) => stage.code === currentStageCode));
  const pasos: Paso[] = camino.map((stage) => ({
    clave: stage.code,
    // Only standard stage names follow the interface language.
    titulo: recruitmentStageLabel(stage, locale),
    icono: PHASE_ICONS[recruitmentPhaseOf(stage.applicationStatus)] ?? CircleCheck,
  }));

  return <Recorrido pasos={pasos} actual={actual} locale={locale} />;
}
