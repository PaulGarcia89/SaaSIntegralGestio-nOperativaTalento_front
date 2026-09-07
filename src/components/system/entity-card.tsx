"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { StatusBadge, type Tone } from "@/components/system/feedback";

/* ==========================================================================
   TARJETA DE ENTIDAD
   ==========================================================================
   La ficha visual de una persona, un documento, una tarea, una vacante, un
   curso o un recurso. Responde de un vistazo a cuatro preguntas, siempre en el
   mismo orden y en el mismo sitio:

     1. ¿Quién o qué es?        media + título + subtítulo
     2. ¿En qué estado está?    `StatusBadge` — icono Y palabra, nunca color solo
     3. ¿Qué se sabe de esto?   hasta tres datos esenciales
     4. ¿Qué sigue?             el próximo paso en palabras, y su botón

   Por qué un componente y no cada pantalla a su manera
   ----------------------------------------------------
   El mismo objeto —un empleado en incorporación— se dibujaba distinto en cada
   pantalla: aquí con un `Badge` de porcentaje, allá con una fila de tabla,
   más allá con una tarjeta propia. Quien usa el producto tiene que aprender
   tres lecturas para la misma cosa.

   Decisiones que no son de estilo
   -------------------------------
   · El porcentaje se dice CON PALABRAS además de dibujarse. Una barra sin
     número obliga a estimar; y quien usa lector de pantalla no ve la barra.
   · El estado nunca se comunica solo con color: `StatusBadge` lleva icono y
     texto.
   · La tarjeta entera es pulsable mediante un enlace extendido sobre el
     título, no envolviendo todo en un `<button>`: así el destino tiene nombre
     accesible propio y las acciones secundarias siguen siendo pulsables.
   · Altura mínima de 44px en todo lo pulsable, que es el mínimo de WCAG 2.5.8.
   ========================================================================== */

/** Iniciales a partir de un nombre: una o dos, nunca más. */
export function initialsOf(name: string) {
  const partes = name
    .trim()
    .split(/\s+/)
    .filter((parte) => parte.length > 0 && /\p{L}/u.test(parte[0]));
  if (partes.length === 0) return "?";
  // Solo LETRAS: un correo colado en el campo del nombre daba «A@» dibujado
  // dentro del círculo.
  if (partes.length === 1) {
    const letras = [...partes[0]].filter((caracter) => /\p{L}/u.test(caracter));
    return (letras.slice(0, 2).join("") || "?").toLocaleUpperCase();
  }
  return (partes[0][0] + partes[partes.length - 1][0]).toLocaleUpperCase();
}

/**
 * Avatar.
 *
 * Monocromo a propósito: teñir el avatar según el nombre mete color donde el
 * sistema reserva el color para el estado, y compite con el distintivo que sí
 * significa algo.
 */
export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const medidas = { sm: "size-8 text-2xs", md: "size-10 text-xs", lg: "size-12 text-sm" }[size];
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-surface-3 font-semibold text-ink-2",
        medidas,
        className,
      )}
    >
      {src ? (
        // La foto es decorativa: el nombre ya está escrito al lado, y repetirlo
        // hace que un lector de pantalla lo lea dos veces.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <span aria-hidden="true">{initialsOf(name)}</span>
      )}
    </span>
  );
}

/**
 * Barra de avance con su cifra.
 *
 * `Progress` ya expone los valores ARIA; lo que añade esto es el rótulo y el
 * número visibles, para que el avance se pueda leer sin interpretar el dibujo.
 */
export function ProgressMeter({
  label,
  value,
  max = 100,
  detail,
  className,
}: {
  label: string;
  value: number;
  max?: number;
  /** Lo que hay detrás de la cifra: «7 de 12 tareas». */
  detail?: string;
  className?: string;
}) {
  const porcentaje = max === 0 ? 0 : Math.round((Math.max(0, Math.min(max, value)) / max) * 100);
  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-xs">
        <span className="text-ink-2">{label}</span>
        <span className="font-mono font-medium tabular-figures text-ink-1">{porcentaje}%</span>
      </p>
      <Progress value={value} max={max} label={detail ? `${label}: ${detail}` : label} />
      {detail ? <p className="text-2xs text-ink-3">{detail}</p> : null}
    </div>
  );
}

export type EntityFact = { label: string; value: ReactNode };

export type EntityCardProps = {
  /** Nombre de la persona o título del objeto. Es el nombre accesible del enlace. */
  title: string;
  subtitle?: ReactNode;
  /** Avatar por nombre, o un icono para objetos que no son personas. */
  avatarName?: string;
  avatarSrc?: string | null;
  /**
   * Portada rectangular, para objetos que se reconocen por su imagen: un
   * curso, un artículo de inventario, un documento escaneado. Un rectángulo y
   * no un círculo, porque recortar una portada en redondo se come justo lo
   * que la hace reconocible.
   */
  coverSrc?: string | null;
  icon?: ReactNode;
  status?: { label: string; tone?: Tone };
  /** Hasta tres. Más que eso deja de leerse de un vistazo y vuelve a ser una tabla. */
  facts?: EntityFact[];
  progress?: { label: string; value: number; max?: number; detail?: string };
  /** El próximo paso, en palabras. Sin él, la tarjeta informa pero no orienta. */
  nextStep?: string;
  /** Acción principal de la tarjeta. Va por encima del enlace extendido. */
  action?: ReactNode;
  href?: string;
  onSelect?: () => void;
  selected?: boolean;
  className?: string;
};

export function EntityCard({
  title,
  subtitle,
  avatarName,
  avatarSrc,
  coverSrc,
  icon,
  status,
  facts,
  progress,
  nextStep,
  action,
  href,
  onSelect,
  selected = false,
  className,
}: EntityCardProps) {
  const visibles = (facts ?? []).slice(0, 3);

  // El enlace extendido cubre la tarjeta con un pseudoelemento. El resto de
  // controles se elevan con `relative z-10` para seguir siendo pulsables.
  const tituloComun = "min-w-0 truncate text-sm font-semibold text-ink-1";
  const titulo = href ? (
    <Link href={href} className={cn(tituloComun, "after:absolute after:inset-0 hover:underline")}>
      {title}
    </Link>
  ) : onSelect ? (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      className={cn(tituloComun, "text-left after:absolute after:inset-0 hover:underline")}
    >
      {title}
    </button>
  ) : (
    <span className={tituloComun}>{title}</span>
  );

  return (
    <article
      className={cn(
        "relative flex min-w-0 flex-col gap-3 rounded-lg border bg-surface-1 p-4 transition",
        selected ? "border-accent-line bg-accent-fill/[.06]" : "border-line hover:border-line-strong",
        "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {coverSrc ? (
          // Decorativa: el título va escrito al lado y repetirlo hace que un
          // lector de pantalla lo lea dos veces.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverSrc}
            alt=""
            className="size-12 shrink-0 rounded-lg border border-line bg-surface-2 object-cover"
          />
        ) : avatarName ? (
          <Avatar name={avatarName} src={avatarSrc} />
        ) : icon ? (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 text-ink-2">
            {icon}
          </span>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-3 gap-y-1">
            {titulo}
            {status ? <StatusBadge size="sm" tone={status.tone ?? "neutral"} label={status.label} /> : null}
          </div>
          {subtitle ? <p className="mt-0.5 truncate text-xs text-ink-2">{subtitle}</p> : null}
        </div>
      </div>

      {visibles.length > 0 ? (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-3">
          {visibles.map((fact) => (
            <div key={fact.label} className="min-w-0">
              <dt className="truncate text-ink-3">{fact.label}</dt>
              <dd className="line-clamp-2 break-words font-medium text-ink-1">{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {progress ? (
        <ProgressMeter
          label={progress.label}
          value={progress.value}
          max={progress.max}
          detail={progress.detail}
        />
      ) : null}

      {nextStep || action ? (
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
          {nextStep ? <p className="min-w-0 flex-1 text-xs text-ink-2">{nextStep}</p> : <span />}
          {action ? <span className="relative z-10 shrink-0">{action}</span> : null}
        </div>
      ) : null}
    </article>
  );
}

/**
 * Rejilla de tarjetas.
 *
 * Una columna en móvil siempre: dos tarjetas de 180px de ancho no se leen, y
 * partirlas en dos columnas es la forma más rápida de reintroducir el
 * desplazamiento horizontal.
 */
export function EntityCardList({
  children,
  label,
  columns = 2,
  className,
}: {
  children: ReactNode;
  /** Nombre accesible de la lista. */
  label: string;
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  const rejilla = { 1: "", 2: "md:grid-cols-2", 3: "md:grid-cols-2 xl:grid-cols-3" }[columns];
  return (
    <ul aria-label={label} className={cn("grid min-w-0 gap-3", rejilla, className)}>
      {children}
    </ul>
  );
}
