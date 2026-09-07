import type { ReactNode } from "react";
import {
  CircleAlert,
  CircleCheck,
  CircleDot,
  CircleSlash,
  Clock3,
  Info,
  OctagonAlert,
  RotateCw,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { OperationBlocker, OperationWarning } from "@/lib/operation-flow";
import { sortBlockers } from "@/lib/operation-flow";

/* ==========================================================================
   ESTADOS
   ==========================================================================
   Regla del sistema: ningún estado se comunica solo con color. Cada uno lleva
   icono Y palabra. Así funciona igual para quien no distingue el verde del
   gris, en una pantalla con reflejos y en una impresión en blanco y negro.
   ========================================================================== */

export type Tone = "neutral" | "info" | "progress" | "success" | "warning" | "danger" | "blocked";

const toneIcon: Record<Tone, typeof Info> = {
  neutral: CircleDot,
  info: Info,
  progress: Clock3,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: OctagonAlert,
  blocked: CircleSlash,
};

/**
 * Clases por tono. El texto usa el token de estado, que está validado a 4,5:1
 * contra la superficie teñida al 10 % en la que se apoya, no solo contra el
 * fondo puro. Ver la nota de contraste en `globals.css`.
 */
const toneClasses: Record<Tone, string> = {
  neutral: "border-line text-ink-2 bg-surface-2",
  info: "border-status-info/30 text-status-info bg-status-info/10",
  progress: "border-accent-line/30 text-accent-ink bg-accent-fill/10",
  success: "border-status-success/30 text-status-success bg-status-success/10",
  warning: "border-status-warning/30 text-status-warning bg-status-warning/10",
  danger: "border-status-danger/30 text-status-danger bg-status-danger/10",
  blocked: "border-status-danger/40 text-status-danger bg-status-danger/10",
};

/**
 * Distintivo de estado.
 *
 * `label` debe estar en lenguaje de persona, no ser el código del backend:
 * "Esperando firma", no `AWAITING_SIGNATURE`. La traducción de códigos vive en
 * `lib/ui-labels.ts`; aquí solo se pinta.
 */
export function StatusBadge({
  tone = "neutral",
  label,
  className,
  size = "md",
}: {
  tone?: Tone;
  label: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const Icon = toneIcon[tone];
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-2xs" : "px-2.5 py-1 text-xs",
        toneClasses[tone],
        className,
      )}
    >
      <Icon className={cn("shrink-0", size === "sm" ? "size-3" : "size-3.5")} aria-hidden="true" />
      <span className="truncate">{label}</span>
    </span>
  );
}

/* ==========================================================================
   BLOQUEOS
   ========================================================================== */

/**
 * Un bloqueo, con sus tres respuestas obligatorias: causa, responsable y
 * salida.
 *
 * Un bloqueo que solo dice "no se puede continuar" deja al usuario mirando un
 * botón apagado sin saber a quién escribir. Por eso las tres se pintan siempre,
 * y `normalizeBlocker` garantiza que ninguna llegue vacía.
 */
export function BlockerCard({
  blocker,
  onFocusField,
}: {
  blocker: OperationBlocker;
  /** Lleva el foco al campo que causa el bloqueo, si apunta a uno. */
  onFocusField?: (fieldId: string) => void;
}) {
  return (
    <li className="rounded-lg border border-status-danger/30 bg-status-danger/5 p-4">
      <p className="flex items-start gap-2 font-semibold text-ink-1">
        <CircleSlash className="mt-0.5 size-4 shrink-0 text-status-danger" aria-hidden="true" />
        <span>{blocker.cause}</span>
      </p>
      <dl className="mt-2 grid gap-x-6 gap-y-1 pl-6 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="text-ink-2">Responsable</dt>
        <dd className="text-ink-1">{blocker.owner}</dd>
        <dt className="text-ink-2">Cómo se resuelve</dt>
        <dd className="text-ink-1">{blocker.resolution}</dd>
      </dl>
      {blocker.fieldId && onFocusField ? (
        <div className="mt-3 pl-6">
          <Button type="button" variant="secondary" size="sm" onClick={() => onFocusField(blocker.fieldId!)}>
            Ir al campo
          </Button>
        </div>
      ) : null}
    </li>
  );
}

/**
 * Lista de bloqueos.
 *
 * `role="alert"` porque la aparición de un bloqueo cambia lo que el usuario
 * puede hacer y debe anunciarse sin que tenga que ir a buscarlo. Los que se
 * arreglan en esta misma pantalla van primero (`sortBlockers`).
 */
export function BlockerList({
  blockers,
  title = "No se puede continuar todavía",
  onFocusField,
}: {
  blockers: OperationBlocker[];
  title?: string;
  onFocusField?: (fieldId: string) => void;
}) {
  if (blockers.length === 0) return null;
  return (
    <section role="alert" aria-labelledby="blockers-title" className="space-y-3">
      <h3 id="blockers-title" className="text-sm font-semibold text-ink-1">
        {title}
      </h3>
      <ul className="space-y-2">
        {sortBlockers(blockers).map((blocker) => (
          <BlockerCard key={blocker.code + (blocker.fieldId ?? "")} blocker={blocker} onFocusField={onFocusField} />
        ))}
      </ul>
    </section>
  );
}

/**
 * Avisos no bloqueantes.
 *
 * Se distinguen visualmente de los bloqueos a propósito: si un aviso se pinta
 * como un bloqueo, la gente aprende a ignorar los dos.
 */
export function WarningList({ warnings }: { warnings: OperationWarning[] }) {
  if (warnings.length === 0) return null;
  return (
    <section role="status" aria-labelledby="warnings-title" className="rounded-lg border border-status-warning/30 bg-status-warning/5 p-4">
      <h3 id="warnings-title" className="flex items-center gap-2 text-sm font-semibold text-ink-1">
        <TriangleAlert className="size-4 shrink-0 text-status-warning" aria-hidden="true" />
        {warnings.length === 1 ? "Ten en cuenta" : `Ten en cuenta ${warnings.length} cosas`}
      </h3>
      <ul className="mt-2 space-y-1 pl-6 text-sm text-ink-2">
        {warnings.map((warning) => (
          <li key={warning.code} className="list-disc">
            {warning.message}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ==========================================================================
   NOTA EN LÍNEA
   ========================================================================== */

/**
 * Mensaje contextual dentro del contenido.
 *
 * Sustituye a `InlineFeedback`, que solo aceptaba cuatro tonos y no distinguía
 * un bloqueo de un aviso.
 */
export function InlineNote({
  tone = "info",
  title,
  children,
  action,
  className,
}: {
  tone?: Tone;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const Icon = toneIcon[tone];
  const isAlert = tone === "danger" || tone === "blocked";
  return (
    <div
      role={isAlert ? "alert" : "status"}
      className={cn(
        "flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start",
        toneClasses[tone],
        className,
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink-1">{title}</p>
        {children ? <div className="mt-1 text-sm text-ink-2">{children}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/* ==========================================================================
   ESTADOS DE PANTALLA
   ==========================================================================
   Vacío, error y bloqueado son tres cosas distintas y se pintan distinto. Antes
   las tres acababan en el mismo recuadro gris con el mismo texto, y el usuario
   no podía saber si tenía que esperar, reintentar o pedir un permiso.
   ========================================================================== */

function StateShell({
  icon,
  title,
  description,
  action,
  tone = "neutral",
}: {
  icon: ReactNode;
  title: string;
  description: ReactNode;
  action?: ReactNode;
  tone?: Tone;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 py-12 text-center",
        tone === "neutral" ? "border-line bg-surface-1/60" : toneClasses[tone],
      )}
      aria-live="polite"
    >
      {icon}
      <div className="max-w-prose space-y-2">
        <h2 className="text-lg font-semibold text-ink-1">{title}</h2>
        <p className="text-sm leading-relaxed text-ink-2">{description}</p>
      </div>
      {action}
    </div>
  );
}

/**
 * Pantalla vacía.
 *
 * `reason` distingue los dos vacíos que la gente confunde: no haber creado
 * nunca nada, y haber filtrado hasta no dejar nada. Mandar a "probar otro
 * filtro" a quien no filtró le hace perder el tiempo y le sugiere que se
 * equivocó él.
 */
export function EmptyState({
  reason,
  title,
  description,
  action,
  onClearFilters,
}: {
  reason: "no-records" | "no-matches";
  title?: string;
  description?: string;
  action?: ReactNode;
  onClearFilters?: () => void;
}) {
  const filtered = reason === "no-matches";
  return (
    <StateShell
      icon={<CircleDot className="size-7 text-ink-3" aria-hidden="true" />}
      title={title ?? (filtered ? "Ningún resultado con estos filtros" : "Todavía no hay registros")}
      description={
        description ??
        (filtered
          ? "Prueba a quitar algún filtro o a ampliar el periodo consultado."
          : "Cuando exista información dentro de tu alcance, aparecerá aquí.")
      }
      action={
        filtered && onClearFilters ? (
          <Button type="button" variant="secondary" onClick={onClearFilters}>
            Quitar los filtros
          </Button>
        ) : (
          action
        )
      }
    />
  );
}

/**
 * Error de carga.
 *
 * `detail` es el mensaje real del servidor y se muestra: ocultarlo deja al
 * usuario y a quien da soporte sin nada con lo que trabajar.
 */
export function ErrorState({
  title = "No fue posible cargar la información",
  detail,
  requestId,
  onRetry,
}: {
  title?: string;
  detail?: string;
  requestId?: string;
  onRetry?: () => void;
}) {
  return (
    <StateShell
      tone="danger"
      icon={<CircleAlert className="size-7 text-status-danger" aria-hidden="true" />}
      title={title}
      description={
        <>
          {detail ?? "Conservamos tu contexto. Reintenta la consulta para continuar."}
          {requestId ? (
            <>
              {" "}
              <span className="font-mono text-2xs text-ink-3">Referencia de soporte: {requestId}</span>
            </>
          ) : null}
        </>
      }
      action={
        onRetry ? (
          <Button type="button" variant="secondary" onClick={onRetry}>
            <RotateCw className="size-4" aria-hidden="true" />
            Reintentar
          </Button>
        ) : null
      }
    />
  );
}

/**
 * Acceso o módulo bloqueado.
 *
 * Se separa del error porque la salida es otra: aquí no hay nada que
 * reintentar, hay alguien a quien pedírselo.
 */
export function BlockedState({
  title,
  cause,
  owner,
  resolution,
  action,
}: {
  title: string;
  cause: string;
  owner: string;
  resolution: string;
  action?: ReactNode;
}) {
  return (
    <StateShell
      tone="blocked"
      icon={<CircleSlash className="size-7 text-status-danger" aria-hidden="true" />}
      title={title}
      description={
        <span className="block space-y-1 text-left sm:text-center">
          <span className="block">{cause}</span>
          <span className="block text-ink-2">
            Responsable: <span className="text-ink-1">{owner}</span>
          </span>
          <span className="block text-ink-2">{resolution}</span>
        </span>
      }
      action={action}
    />
  );
}

/* ==========================================================================
   SILUETAS DE CARGA
   ==========================================================================
   La silueta tiene la forma y la altura de lo que va a llegar. Un spinner
   centrado ocupa una altura fija y provoca un salto cuando entra el contenido
   real, que casi siempre es más alto.
   ========================================================================== */

export function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn("skeleton h-4 rounded-sm", className)} />;
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-lg", className)} />;
}

/** Silueta de una lista de filas, que es la forma más común del producto. */
export function SkeletonRows({ rows = 6, label = "Cargando registros" }: { rows?: number; label?: string }) {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-2">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 rounded-lg border border-line bg-surface-1 p-4">
          <SkeletonBlock className="size-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonLine className="w-1/3" />
            <SkeletonLine className="w-1/2" />
          </div>
          <SkeletonBlock className="hidden h-7 w-24 sm:block" />
        </div>
      ))}
    </div>
  );
}
