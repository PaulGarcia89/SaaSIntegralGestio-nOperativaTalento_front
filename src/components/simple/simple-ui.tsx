"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronDown, ChevronRight, CircleAlert, CircleCheck, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Primitivas de interfaz sencilla.
 *
 * Pensadas para alguien que nunca usó una computadora ni un teléfono. Tres
 * reglas gobiernan todo lo de aquí:
 *
 * 1. El texto nunca baja de 16 px. Base de 18 px en móvil, 17 px en escritorio.
 *    Los 16 px además impiden que Safari haga zoom al enfocar un campo.
 * 2. Cualquier cosa que se pulse mide al menos 56 px de alto en móvil. El dedo
 *    de una persona mayor no acierta en 40 px.
 * 3. Ningún estado se comunica solo con color: siempre lleva icono y palabra.
 */

/** Texto base del módulo. Se aplica al contenedor, no elemento por elemento. */
export const SIMPLE_TEXT = "text-lg sm:text-[17px] leading-relaxed";

/** Altura mínima de cualquier control pulsable. */
export const TAP_TARGET = "min-h-14 sm:min-h-12";

export function SimpleScreen({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(SIMPLE_TEXT, "space-y-5 pb-28 sm:pb-8", className)}>{children}</div>;
}

/**
 * Encabezado de pantalla.
 *
 * Una sola pregunta como título. Si el usuario no sabe responderla mirando la
 * pantalla, la pantalla está mal.
 */
export function SimpleHeader({ title, help }: { title: string; help?: string }) {
  return (
    <header className="space-y-2">
      <h1 className="text-3xl font-semibold leading-tight text-text-primary sm:text-4xl">{title}</h1>
      {help ? <p className="max-w-2xl text-text-secondary">{help}</p> : null}
    </header>
  );
}

/**
 * Tarjeta de tarea.
 *
 * Responde en este orden: qué pasó, a quién, desde cuándo, y qué hago. El botón
 * ocupa el ancho completo en móvil porque es el único destino posible.
 */
export function TaskCard({ title, who, detail, when, urgent, href, actionLabel }: {
  title: string;
  who: string;
  detail?: string;
  when: string;
  urgent?: boolean;
  href: string;
  actionLabel: string;
}) {
  return (
    <article className={cn("rounded-2xl border bg-surface-elevated p-4 sm:p-5", urgent ? "border-status-warning/50" : "border-border-default")}>
      <p className="flex items-start gap-2 font-semibold text-text-primary">
        {urgent ? <CircleAlert className="mt-1 size-5 shrink-0 text-status-warning" aria-hidden="true" /> : <Clock3 className="mt-1 size-5 shrink-0 text-text-secondary" aria-hidden="true" />}
        <span>{title}</span>
      </p>
      {who ? <p className="mt-2 text-xl font-semibold text-text-primary">{who}</p> : null}
      {detail ? <p className="mt-1 text-text-secondary">{detail}</p> : null}
      <p className="mt-1 text-text-secondary">{when}</p>
      <Link
        href={href}
        className={cn(TAP_TARGET, "mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 font-semibold text-text-on-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus sm:w-auto")}
      >
        {actionLabel}
        <ChevronRight className="size-5" aria-hidden="true" />
      </Link>
    </article>
  );
}

/**
 * Estado de una persona en el proceso.
 *
 * Icono más palabra, nunca solo color: así funciona igual para quien no
 * distingue el verde del gris.
 */
export function PhaseChip({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "done" | "waiting" | "attention" }) {
  const Icon = tone === "done" ? CircleCheck : tone === "attention" ? CircleAlert : Clock3;
  return (
    <span className={cn(
      "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-base font-medium",
      tone === "done" && "border-status-success/40 bg-status-success/10 text-text-primary",
      tone === "attention" && "border-status-warning/40 bg-status-warning/10 text-text-primary",
      tone === "waiting" && "border-primary/40 bg-primary/10 text-text-primary",
      tone === "neutral" && "border-border-default text-text-secondary",
    )}>
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </span>
  );
}

/**
 * Sección plegable.
 *
 * Se usa `<details>` a propósito: el navegador ya le da teclado, foco y
 * anuncio correcto en lectores de pantalla. Nacen cerradas — mostrar todo a la
 * vez es justo lo que agobia a quien empieza.
 */
export function SimpleSection({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <details className="group rounded-2xl border border-border-default bg-surface-elevated">
      <summary className={cn(TAP_TARGET, "flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 font-medium text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus")}>
        <span>
          {title}
          {hint ? <span className="mt-0.5 block font-normal text-text-secondary">{hint}</span> : null}
        </span>
        <ChevronDown className="size-5 shrink-0 text-text-secondary motion-safe:transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="border-t border-border-default p-4">{children}</div>
    </details>
  );
}

/**
 * Pantalla vacía.
 *
 * Dice la verdad sobre por qué está vacía y ofrece la acción que corresponde.
 * Mandar a "probar otro filtro" cuando el usuario no filtró nada le hace
 * perder el tiempo y le sugiere que se equivocó él.
 */
export function SimpleEmpty({ title, help, action }: { title: string; help?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border-default bg-surface-elevated p-6 text-center">
      <CircleCheck className="mx-auto size-8 text-status-success" aria-hidden="true" />
      <p className="mt-3 text-xl font-semibold text-text-primary">{title}</p>
      {help ? <p className="mx-auto mt-2 max-w-md text-text-secondary">{help}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

/**
 * Barra inferior fija con la acción principal, solo en móvil.
 *
 * Se apila POR ENCIMA de la barra de navegación flotante de `app-shell`, que
 * en móvil ocupa la franja inferior (`fixed ... bottom-[max(0.75rem,safe-area)]`,
 * `z-40`, alto 60px). Antes esta barra estaba en `bottom-0` con `z-30`, así que
 * la navegación se dibujaba encima y tapaba el botón principal justo en las dos
 * pantallas rediseñadas («Hoy» y «Personas»). El desplazamiento se calcula con
 * `--mobile-nav-space`, que define `app-shell`, para que las dos barras no se
 * solapen aunque cambie el alto de la navegación.
 *
 * `--mobile-nav-space` ya incluye `env(safe-area-inset-bottom)`, así que aquí
 * el relleno inferior es una separación normal: sumar otra vez el área segura
 * desperdiciaría ~34px de pantalla en un iPhone 12 en adelante. Cuando esta
 * barra se use fuera de `app-shell` (sin navegación inferior), el valor de
 * reserva vuelve a ser `env(safe-area-inset-bottom)`, que es lo que hace falta
 * en ese caso.
 */
export function MobileActionBar({ children }: { children: ReactNode }) {
  return (
    <>
      {/*
        Reserva el alto de la barra en el flujo normal. Sin esto, el último
        elemento de la lista queda debajo de una barra `fixed` y no hay forma
        de alcanzarlo: el desplazamiento ya llegó al final.
      */}
      <div aria-hidden="true" className="h-20 sm:hidden" />
      <div className="fixed inset-x-0 bottom-[var(--mobile-nav-space,env(safe-area-inset-bottom))] z-30 border-t border-border-default bg-surface-elevated/95 px-4 py-3 backdrop-blur sm:hidden">
        {children}
      </div>
    </>
  );
}
