"use client";

import { useUiText } from "@/components/ui-copy";

import { Check, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepperStep = { label: string; icon?: LucideIcon };

/**
 * Paso a paso gráfico, el mismo para todos los flujos por pasos del
 * producto (vacante nueva, entrada de mercancía, contratación, importaciones).
 *
 * Círculos unidos por una línea que se rellena: hecho = verde con marca,
 * actual = relleno oscuro y rótulo en negrita, pendiente = hueco. Nada
 * depende solo del color: la marca, el relleno y las palabras para lectores
 * de pantalla llevan la misma información. En móvil se rotula solo el paso
 * actual (los demás quedan en `sr-only`), porque cinco rótulos en 390 px no
 * se leen.
 *
 * `current` es un índice desde 0. Con `onSelect`, los pasos ya recorridos se
 * pueden pulsar para volver; los posteriores no son botones.
 *
 * Para asistentes que no son lineales (el editor de cursos, donde cada etapa
 * se completa por su cuenta), `completed` dice qué pasos están hechos y
 * `freeNavigation` deja pulsar cualquiera.
 */
export function Stepper({
  steps,
  current,
  onSelect,
  completed,
  freeNavigation = false,
  label = "Pasos",
  className,
}: {
  steps: StepperStep[];
  current: number;
  onSelect?: (index: number) => void;
  /** Hecho por paso; si falta, hecho = anterior al actual. */
  completed?: boolean[];
  /** Permite pulsar pasos posteriores y no solo los ya recorridos. */
  freeNavigation?: boolean;
  label?: string;
  className?: string;
}) {
  const uiText = useUiText();
  return (
    <nav aria-label={label} className={className}>
      <ol className="flex items-start">
        {steps.map((step, index) => {
          const active = index === current;
          const done = !active && (completed ? Boolean(completed[index]) : index < current);
          const last = index === steps.length - 1;
          const Icon = step.icon;
          const clickable = Boolean(onSelect) && !active && (freeNavigation || done);
          const circle = (
            <span
              aria-hidden="true"
              className={cn(
                "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 bg-surface-1 text-sm font-semibold transition-colors",
                done && "border-status-success bg-status-success text-white",
                active && "border-action bg-action text-on-action shadow-e2",
                !done && !active && "border-line-strong text-ink-3",
              )}
            >
              {done ? <Check className="size-4" strokeWidth={2.5} /> : Icon ? <Icon className="size-4" strokeWidth={1.75} /> : index + 1}
            </span>
          );
          const text = (
            <span
              className={cn(
                "mt-2 block max-w-[7.5rem] text-center text-sm leading-tight",
                active ? "font-semibold text-ink-1" : done ? "text-ink-1" : "text-ink-3",
                !active && "sr-only sm:not-sr-only",
              )}
            >
              {step.label}
              <span className="sr-only">{done ? ", completado" : active ? ", paso actual" : ", pendiente"}</span>
            </span>
          );
          return (
            <li key={step.label} aria-current={active ? "step" : undefined} className="relative flex min-w-0 flex-1 flex-col items-center">
              {!last ? <span aria-hidden="true" className={cn("absolute left-1/2 top-5 h-0.5 w-full", done ? "bg-status-success" : "bg-line")} /> : null}
              {clickable ? (
                <button
                  type="button"
                  onClick={() => onSelect?.(index)}
                  className="flex min-h-[var(--control-h-touch)] flex-col items-center rounded-md px-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  aria-label={`${done ? "Volver al" : "Ir al"} paso ${index + 1}: ${step.label}`}
                >
                  {circle}
                  {text}
                </button>
              ) : (
                <span className="flex min-h-[var(--control-h-touch)] flex-col items-center px-1">
                  {circle}
                  {text}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-center text-sm text-ink-2 sm:hidden" aria-hidden="true">
        {uiText("Paso")}{current + 1} {uiText(" de ")}{steps.length}
      </p>
    </nav>
  );
}
