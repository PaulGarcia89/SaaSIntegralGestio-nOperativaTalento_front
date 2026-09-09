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
 * 1. El texto nunca baja de 16 px. Los 16 px además impiden que Safari haga
 *    zoom al enfocar un campo.
 * 2. Cualquier cosa que se pulse llega al objetivo táctil de la densidad
 *    activa, que en móvil nunca baja de 44 px.
 * 3. Ningún estado se comunica solo con color: siempre lleva icono y palabra.
 *
 * Qué cambió con el rediseño «Grafito y ámbar»
 * --------------------------------------------
 * Los tamaños y las alturas dejan de estar escritos a mano (`text-lg`,
 * `min-h-14`) y pasan a leer los TOKENS de densidad. Antes este módulo definía
 * su propia escala, así que el conmutador de densidad no lo habría afectado y
 * `/ats` y `/hiring` se habrían quedado congelados en la escala cómoda
 * mientras el resto del producto se compactaba.
 *
 * Los colores pasan a los tokens nuevos (`ink-*`, `surface-*`, `line`,
 * `accent-*`). Los antiguos (`text-text-primary`, `bg-surface-elevated`) siguen
 * existiendo y apuntando a los mismos valores, así que esto es un cambio de
 * vocabulario, no de aspecto.
 */

/**
 * Texto base del módulo. Se aplica al contenedor, no elemento por elemento.
 *
 * `text-base` ya vale 17px en densidad cómoda y 15px en compacta, así que la
 * escala la decide el token y no esta constante.
 */
export const SIMPLE_TEXT = "text-base leading-relaxed";

/** Altura mínima de cualquier control pulsable, según la densidad activa. */
export const TAP_TARGET = "min-h-[var(--control-h-touch)] sm:min-h-[var(--control-h-base)]";

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
      <h1 className="text-2xl font-semibold text-ink-1 sm:text-3xl">{title}</h1>
      {help ? <p className="max-w-prose text-ink-2">{help}</p> : null}
    </header>
  );
}

/**
 * Tarjeta de tarea.
 *
 * Responde en este orden: qué pasó, a quién, desde cuándo, y qué hago. El botón
 * ocupa el ancho completo en móvil porque es el único destino posible.
 *
 * Lo urgente se marca con un filo de color Y con el icono de alerta, no solo
 * con el borde: un borde teñido es justo lo que no se distingue en una pantalla
 * con reflejos.
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
    <article
      className={cn(
        "relative overflow-hidden rounded-lg border bg-surface-1 p-4 sm:p-5",
        urgent ? "border-status-warning/50" : "border-line",
      )}
    >
      {urgent ? (
        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-status-warning" />
      ) : null}
      <div className={cn(urgent && "pl-2")}>
        <p className="flex items-start gap-2 font-semibold text-ink-1">
          {urgent ? (
            <CircleAlert className="mt-1 size-5 shrink-0 text-status-warning" aria-hidden="true" />
          ) : (
            <Clock3 className="mt-1 size-5 shrink-0 text-ink-3" aria-hidden="true" />
          )}
          <span>{title}</span>
        </p>
        {who ? <p className="mt-2 text-lg font-semibold text-ink-1">{who}</p> : null}
        {detail ? <p className="mt-1 text-ink-2">{detail}</p> : null}
        <p className="mt-1 font-mono text-sm text-ink-3 tabular-figures">{when}</p>
        <Link
          href={href}
          className={cn(
            TAP_TARGET,
            // `inline-flex`, no `flex`: un elemento de BLOQUE con `width:auto`
            // ocupa todo el ancho disponible, así que el `sm:w-auto` de al lado
            // no encogía nada y en escritorio salían tres botones oscuros a
            // todo el ancho, compitiendo entre ellos y con la acción
            // recomendada de arriba.
            "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-action px-5 font-medium text-on-action shadow-e1 transition-colors hover:bg-action/90 sm:w-auto",
          )}
        >
          {actionLabel}
          <ChevronRight className="size-5" aria-hidden="true" />
        </Link>
      </div>
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
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium",
        tone === "done" && "border-status-success/40 bg-status-success/10 text-status-success",
        tone === "attention" && "border-status-warning/40 bg-status-warning/10 text-status-warning",
        tone === "waiting" && "border-accent-line/40 bg-accent-fill/10 text-accent-ink",
        tone === "neutral" && "border-line bg-surface-2 text-ink-2",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
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
    <details className="group rounded-lg border border-line bg-surface-1">
      <summary
        className={cn(
          TAP_TARGET,
          "flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-4 py-3 font-medium text-ink-1",
        )}
      >
        <span>
          {title}
          {hint ? <span className="mt-0.5 block font-normal text-ink-2">{hint}</span> : null}
        </span>
        <ChevronDown
          className="size-5 shrink-0 text-ink-3 motion-safe:transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="border-t border-line p-4">{children}</div>
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
    <div className="rounded-lg border border-dashed border-line bg-surface-1/60 p-6 text-center">
      <CircleCheck className="mx-auto size-8 text-status-success" aria-hidden="true" />
      <p className="mt-3 text-lg font-semibold text-ink-1">{title}</p>
      {help ? <p className="mx-auto mt-2 max-w-prose text-ink-2">{help}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

/**
 * Barra inferior fija con la acción principal, solo en móvil.
 *
 * Se apila POR ENCIMA de la barra de navegación flotante de `app-shell`, que
 * en móvil ocupa la franja inferior. Antes esta barra estaba en `bottom-0` con
 * `z-30`, así que la navegación se dibujaba encima y tapaba el botón principal
 * justo en las dos pantallas rediseñadas. El desplazamiento se calcula con
 * `--mobile-nav-space`, que define `app-shell`, para que las dos barras no se
 * solapen aunque cambie el alto de la navegación.
 *
 * `--mobile-nav-space` ya incluye `env(safe-area-inset-bottom)`, así que aquí
 * el relleno inferior es una separación normal: sumar otra vez el área segura
 * desperdiciaría ~34 px de pantalla en un iPhone 12 en adelante. Cuando esta
 * barra se use fuera de `app-shell` (sin navegación inferior), el valor de
 * reserva vuelve a ser `env(safe-area-inset-bottom)`, que es lo que hace falta
 * en ese caso.
 *
 * El z-index sale ahora de la escala nombrada de `globals.css`: antes era un
 * `z-30` suelto que había que comparar a mano con el `z-40` de la navegación.
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
      <div className="fixed inset-x-0 bottom-[var(--mobile-nav-space,env(safe-area-inset-bottom))] z-[var(--z-action-bar)] border-t border-line bg-surface-1/95 px-4 py-3 backdrop-blur sm:hidden">
        {children}
      </div>
    </>
  );
}
