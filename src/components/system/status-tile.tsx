"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge, type Tone } from "@/components/system/feedback";
import { useLocale } from "@/components/locale-provider";
import { SkeletonLine } from "@/components/system/feedback";

/* ==========================================================================
   TARJETA DE ESTADO
   ==========================================================================
   La pieza con la que abre el panel de cada módulo. Responde, en este orden:

     ¿de qué habla?    título en lenguaje corriente, no el nombre del endpoint
     ¿cuánto?          el valor, grande y en cifras de ancho fijo
     ¿de qué alcance?  contexto: sucursal, periodo, «de las vacantes abiertas»
     ¿está bien?       estado con icono y palabra, nunca solo color
     ¿qué hago?        una acción, y la tarjeta entera lleva a ella

   Reglas que no son de estilo
   ---------------------------
   · Sin dato NO es cero. Mientras carga se muestra una silueta; si el servidor
     no lo entrega, la tarjeta lo dice. Un «0» inventado se lee como «todo en
     orden», que es justo lo contrario de lo que se sabe.
   · La variación es opcional y exige periodo. Sin periodo, «+12 %» no
     significa nada, y sin historial real no se muestra en absoluto.
   · El estado no se deduce del número por su cuenta: lo decide quien conoce el
     dominio y se pasa como `tone`. Doce candidatos sin revisar es urgente en
     una empresa y normal en otra.
   ========================================================================== */

export type StatusTileProps = {
  /** En lenguaje corriente: «Candidatos sin revisar», no «applications.pending». */
  title: string;
  /** `undefined` mientras carga; `null` si el servidor no entrega el dato. */
  value: number | string | null | undefined;
  /** De qué habla la cifra: alcance, sucursal, periodo. */
  context?: string;
  status?: { label: string; tone?: Tone };
  /** Adónde lleva la tarjeta. Sin él, la tarjeta informa pero no resuelve. */
  href?: string;
  actionLabel?: string;
  /** Periodo o alcance del dato, al pie. Obligatorio si hay `trend`. */
  scope?: string;
  /** Variación real, con su periodo. Si no hay historial, se omite. */
  trend?: { label: string; tone?: Tone };
  icon?: ReactNode;
  className?: string;
};

export function StatusTile({
  title,
  value,
  context,
  status,
  href,
  actionLabel,
  scope,
  trend,
  icon,
  className,
}: StatusTileProps) {
  const { t } = useLocale();
  const cargando = value === undefined;
  const sinDato = value === null;

  return (
    <article
      className={cn(
        "relative flex h-full min-w-0 flex-col gap-3 rounded-lg border border-line bg-surface-1 p-4",
        href && "transition hover:border-line-strong",
        "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus",
        className,
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <p className="min-w-0 text-sm font-medium text-ink-2">{title}</p>
        {icon ? (
          <span aria-hidden="true" className="shrink-0 text-ink-3">
            {icon}
          </span>
        ) : null}
      </div>

      <div className="min-w-0">
        {cargando ? (
          <SkeletonLine className="h-8 w-20" />
        ) : sinDato ? (
          // Decirlo es más útil que un cero: el cero afirma algo que no se sabe.
          <p className="text-sm text-ink-3">{t("common.noDataAvailable")}</p>
        ) : (
          <p className="font-mono text-3xl font-semibold tabular-figures text-ink-1">{value}</p>
        )}
        {context ? <p className="mt-1 text-sm text-ink-2">{context}</p> : null}
      </div>

      {status || trend ? (
        <div className="flex flex-wrap items-center gap-2">
          {status ? <StatusBadge size="sm" tone={status.tone ?? "neutral"} label={status.label} /> : null}
          {trend ? <StatusBadge size="sm" tone={trend.tone ?? "neutral"} label={trend.label} /> : null}
        </div>
      ) : null}

      {href || scope ? (
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
          {scope ? <p className="min-w-0 text-2xs text-ink-3">{scope}</p> : <span />}
          {href ? (
            <Link
              href={href}
              className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-accent-ink after:absolute after:inset-0 hover:underline"
            >
              {actionLabel ?? t("common.open")}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

/**
 * Fila de tarjetas de estado.
 *
 * Cuatro como máximo por fila en escritorio: a partir de ahí dejan de ser
 * «lo que hay que mirar» y vuelven a ser una lista. Una sola columna en móvil.
 */
export function StatusTileRow({
  children,
  label,
  className,
}: {
  children: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <ul aria-label={label} className={cn("grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {children}
    </ul>
  );
}
