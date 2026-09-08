"use client";

import { BriefcaseBusiness, Check, CircleCheck, Inbox, MessagesSquare, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAIN_PHASES, phaseTitle, type RecruitmentPhaseId } from "@/lib/recruitment-ux";

/** Mismo icono por fase en el dashboard, el perfil y las listas. */
export const PHASE_ICONS: Partial<Record<RecruitmentPhaseId, LucideIcon>> = {
  POSTULARON: Inbox,
  CONOCIENDO: MessagesSquare,
  DECIDIDO: CircleCheck,
  TRABAJANDO: BriefcaseBusiness,
};

/**
 * Paso a paso de la persona en el proceso: círculos con icono unidos por una
 * línea que se rellena. Es el mismo dibujo que en Contratación, para que la
 * persona reconozca «dónde está» sin leer. Completada = verde con marca,
 * actual = relleno oscuro y título en negrita, pendiente = hueco. En móvil
 * solo se rotula la fase actual (las demás quedan para lectores de pantalla).
 */
export function RecruitmentPhaseRail({ currentStep, locale }: { currentStep: number; locale: "es" | "en" }) {
  return (
    <ol className="flex items-start" aria-label={locale === "en" ? "Process stages" : "Fases del proceso"}>
      {MAIN_PHASES.map((phase, index) => {
        const step = phase.step ?? 0;
        const done = step < currentStep;
        const active = step === currentStep;
        const Icon = PHASE_ICONS[phase.id] ?? CircleCheck;
        const last = index === MAIN_PHASES.length - 1;
        return (
          <li key={phase.id} aria-current={active ? "step" : undefined} className="relative flex min-w-0 flex-1 flex-col items-center">
            {!last ? (
              <span aria-hidden="true" className={cn("absolute left-1/2 top-5 h-0.5 w-full", done ? "bg-status-success" : "bg-line")} />
            ) : null}
            <span
              aria-hidden="true"
              className={cn(
                "relative z-10 flex size-10 items-center justify-center rounded-full border-2 bg-surface-1",
                done && "border-status-success bg-status-success text-white",
                active && "border-action bg-action text-on-action shadow-e2",
                !done && !active && "border-line-strong text-ink-3",
              )}
            >
              {done ? <Check className="size-4" strokeWidth={2.5} /> : <Icon className="size-4" strokeWidth={1.75} />}
            </span>
            <span
              className={cn(
                "mt-2 block max-w-[7rem] text-center text-sm leading-tight",
                active ? "font-semibold text-ink-1" : done ? "text-ink-1" : "text-ink-3",
                !active && "sr-only sm:not-sr-only",
              )}
            >
              {phaseTitle(phase.id, locale)}
              <span className="sr-only">{done ? (locale === "en" ? ", done" : ", completada") : active ? (locale === "en" ? ", current" : ", actual") : locale === "en" ? ", pending" : ", pendiente"}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
