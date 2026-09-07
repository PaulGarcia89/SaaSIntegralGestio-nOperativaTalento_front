import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Tone } from "@/components/system/feedback";

/* ==========================================================================
   CABECERA DE PÁGINA
   ==========================================================================
   Es el ÚNICO `h1` de la pantalla. Antes había dos: `app-shell` pintaba una
   tarjeta con el nombre de la empresa como `h1` y encima cada página pintaba
   el suyo, con dos filas de acciones que competían. El armazón conserva el
   contexto (empresa, sucursal, rol) pero ya no titula.
   ========================================================================== */

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
  className,
}: {
  /** Módulo al que pertenece la pantalla. Da ubicación sin gastar un `h2`. */
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  /** Acciones de PÁGINA. Las globales viven en el armazón y no se repiten. */
  actions?: ReactNode;
  /** Procedencia del dato: periodo, alcance, última actualización. */
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between", className)}>
      <div className="min-w-0 space-y-2">
        {eyebrow ? (
          <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-ink-3">{eyebrow}</p>
        ) : null}
        <h1 className="text-2xl font-semibold text-ink-1 sm:text-3xl">{title}</h1>
        {description ? <div className="max-w-prose text-sm leading-relaxed text-ink-2">{description}</div> : null}
        {meta ? <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-2xs text-ink-3">{meta}</div> : null}
      </div>
      {actions ? <ActionBar>{actions}</ActionBar> : null}
    </header>
  );
}

/**
 * Fila de acciones.
 *
 * `role="toolbar"` con etiqueta para que un lector de pantalla la anuncie como
 * un grupo y no como botones sueltos repartidos por la página.
 */
export function ActionBar({
  children,
  label = "Acciones de la página",
  className,
}: {
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <div role="toolbar" aria-label={label} className={cn("flex flex-wrap items-center gap-2", className)}>
      {children}
    </div>
  );
}

/**
 * Barra de acción fija en móvil.
 *
 * Se apila POR ENCIMA de la navegación inferior del armazón usando
 * `--mobile-nav-space`, que ya incluye el área segura. Emite además un
 * espaciador en el flujo normal: sin él, el último elemento de la lista queda
 * bajo una barra `fixed` y es inalcanzable.
 */
export function MobileActionBar({ children, label = "Acción principal" }: { children: ReactNode; label?: string }) {
  return (
    <>
      <div aria-hidden="true" className="h-20 sm:hidden" />
      <div
        role="toolbar"
        aria-label={label}
        className="fixed inset-x-0 bottom-0 z-[var(--z-action-bar)] border-t border-line bg-surface-1/95 p-3 backdrop-blur sm:hidden"
        style={{ paddingBottom: "calc(0.75rem + var(--mobile-nav-space, env(safe-area-inset-bottom)))" }}
      >
        {children}
      </div>
    </>
  );
}

/* ==========================================================================
   SECCIONES
   ==========================================================================
   Una sección es un bloque con título accesible. No es una tarjeta por
   defecto: el encargo pedía dejar de saturar cada pantalla con tarjetas, así
   que la caja es opcional y la jerarquía la da el titular.
   ========================================================================== */

export function PageSection({
  title,
  description,
  actions,
  children,
  boxed = false,
  className,
  id,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  /** `true` la encierra en una superficie elevada. Úsalo con moderación. */
  boxed?: boolean;
  className?: string;
  id?: string;
}) {
  const headingId = `${id ?? title.toLowerCase().replace(/\s+/g, "-")}-title`;
  return (
    <section
      aria-labelledby={headingId}
      id={id}
      className={cn(boxed && "rounded-xl border border-line bg-surface-1 p-5 shadow-e1", "space-y-4", className)}
    >
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 id={headingId} className="text-base font-semibold text-ink-1">
            {title}
          </h2>
          {description ? <p className="text-sm text-ink-2">{description}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

/* ==========================================================================
   ACCIÓN RECOMENDADA
   ==========================================================================
   El principio nº 4 del encargo: mostrar siempre la SIGUIENTE acción
   recomendada, en singular. Este componente existe para que sea imposible
   pintar dos a la vez en la misma pantalla: recibe una, no una lista.
   ========================================================================== */

export function NextAction({
  label,
  title,
  detail,
  href,
  onAction,
  actionLabel,
  tone = "progress",
}: {
  /** Rótulo pequeño: "Lo siguiente", "Pendiente más urgente"… */
  label: string;
  /** Qué hay que hacer, en una frase. */
  title: string;
  /** Por qué es lo siguiente: desde cuándo espera, a quién afecta. */
  detail?: string;
  href?: string;
  onAction?: () => void;
  actionLabel: string;
  tone?: Extract<Tone, "progress" | "warning" | "danger">;
}) {
  const accent =
    tone === "danger"
      ? "border-status-danger/40"
      : tone === "warning"
        ? "border-status-warning/40"
        : "border-accent-line/40";

  return (
    <section
      aria-labelledby="next-action-title"
      className={cn(
        "relative overflow-hidden rounded-xl border bg-surface-1 p-5 shadow-e2 sm:p-6",
        accent,
      )}
    >
      {/* Filo ámbar a la izquierda: la marca del sistema para "esto es lo
          siguiente". Es decorativo, así que no lleva rol ni etiqueta. */}
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-accent-fill" />
      <div className="flex flex-col gap-4 pl-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-1">
          <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-accent-ink">{label}</p>
          <h2 id="next-action-title" className="text-lg font-semibold text-ink-1 sm:text-xl">
            {title}
          </h2>
          {detail ? <p className="text-sm text-ink-2">{detail}</p> : null}
        </div>
        <div className="shrink-0">
          {href ? (
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href={href}>
                {actionLabel}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          ) : (
            <Button type="button" size="lg" className="w-full sm:w-auto" onClick={onAction}>
              {actionLabel}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   MÉTRICAS
   ==========================================================================
   Sin tarjeta y sin sombra: una métrica es una cifra con su rótulo, y meterla
   en una caja con borde y sombra multiplica el ruido cuando hay cuatro
   seguidas. La separación la da una línea vertical de 1px.
   ========================================================================== */

export function Metric({
  label,
  value,
  detail,
  trend,
  tone,
  className,
}: {
  label: string;
  value: string;
  /** Procedencia o matiz: "en los últimos 30 días", "sobre 120 activos".
   *  Acepta nodos para poder colgar un enlace al listado de origen. */
  detail?: ReactNode;
  /** Variación ya formateada. El signo lo pone quien llama. */
  trend?: { value: string; direction: "up" | "down" | "flat"; adverse?: boolean };
  tone?: Extract<Tone, "success" | "warning" | "danger">;
  className?: string;
}) {
  const valueTone =
    tone === "danger"
      ? "text-status-danger"
      : tone === "warning"
        ? "text-status-warning"
        : tone === "success"
          ? "text-status-success"
          : "text-ink-1";

  return (
    <div className={cn("min-w-0 space-y-1", className)}>
      <p className="truncate text-xs font-medium text-ink-2">{label}</p>
      {/* La monoespaciada con `tabular-figures` alinea columnas de cifras; en
          una palabra solo la afea y, con el cero barrado, la hace parecer un
          dato técnico. «Activa» y «Empresarial» no son cifras. */}
      <p
        className={cn(
          "text-2xl font-semibold",
          /^[\d\s.,%+\-/$€£¥]+$/.test(value) ? "font-mono tabular-figures" : "hyphens-auto",
          valueTone,
        )}
        lang="es"
      >
        {value}
      </p>
      {trend ? (
        <p
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            trend.direction === "flat"
              ? "text-ink-3"
              : trend.adverse
                ? "text-status-danger"
                : "text-status-success",
          )}
        >
          {/* La flecha va acompañada de la palabra, no la sustituye. */}
          <span aria-hidden="true">
            {trend.direction === "up" ? "▲" : trend.direction === "down" ? "▼" : "—"}
          </span>
          <span className="font-mono tabular-figures">{trend.value}</span>
          <span className="sr-only">
            {trend.direction === "up" ? "al alza" : trend.direction === "down" ? "a la baja" : "sin cambio"}
            {trend.adverse ? ", desfavorable" : ""}
          </span>
        </p>
      ) : null}
      {detail ? <div className="text-2xs text-ink-3">{detail}</div> : null}
    </div>
  );
}

/**
 * Fila de métricas separadas por una línea, no por tarjetas.
 *
 * En móvil pasa a dos columnas: cuatro métricas en una columna obligan a
 * desplazarse antes de ver nada más, y en un iPhone de 390px dos caben.
 */
export function MetricRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-5 rounded-xl border border-line bg-surface-1 p-5",
        "sm:grid-cols-3 lg:grid-cols-4",
        "[&>*+*]:sm:border-l [&>*+*]:sm:border-line [&>*+*]:sm:pl-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
