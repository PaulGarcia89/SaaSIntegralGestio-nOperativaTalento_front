"use client";

import { cn } from "@/lib/utils";

/* ==========================================================================
   INICIO · PIEZAS DEL CENTRO OPERATIVO
   ==========================================================================
   Dos piezas que solo tienen sentido en esta pantalla, así que viven aquí y
   no en `components/system`: el medidor de salud y la fila de filtros que
   acompaña a cada gráfico.
   ========================================================================== */

export type UrgencyTone = "danger" | "warning" | "info" | "neutral";

/**
 * Color de cada nivel de urgencia.
 *
 * Son tonos de ESTADO, no una paleta categórica: rojo y ámbar están
 * reservados a «vencido» y «vence hoy», y todo lo demás cae en el grafito de
 * la serie principal. Cada nivel lleva además su nombre escrito al lado, de
 * modo que el color nunca es el único portador del significado.
 */
export const URGENCY_COLOR_CLASS: Record<UrgencyTone, string> = {
  danger: "text-status-danger",
  warning: "text-status-warning",
  info: "text-series-2",
  neutral: "text-ink-3",
};

/* ==========================================================================
   MEDIDOR DE SALUD
   ==========================================================================
   Antes «Salud operativa 67 %» era una cifra más dentro de una fila de siete,
   con el mismo peso que «Vacantes activas 18». Pero es el resumen de toda la
   pantalla: una proporción contra un límite, que es exactamente lo que un
   medidor sabe contar. Nada de aguja ni de rosquilla —el sistema construye la
   jerarquía con superficies y líneas de 1px, no con adornos—: una pista, un
   relleno y la cifra grande al lado.
   ========================================================================== */

export function HealthMeter({
  label,
  value,
  summary,
  tone,
  breakdown,
  footnote,
  className,
}: {
  label: string;
  /** 0-100. */
  value: number;
  summary: string;
  tone: UrgencyTone;
  /** Lo que penaliza la cifra. Cada entrada puede filtrar la pantalla. */
  breakdown?: readonly {
    id: string;
    label: string;
    count: number;
    tone: UrgencyTone;
    onSelect?: () => void;
    selected?: boolean;
  }[];
  footnote?: string;
  className?: string;
}) {
  const acotado = Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0)));
  const colorCifra =
    tone === "danger" ? "text-status-danger" : tone === "warning" ? "text-status-warning" : "text-status-success";
  const colorRelleno =
    tone === "danger" ? "bg-status-danger" : tone === "warning" ? "bg-status-warning" : "bg-status-success";

  return (
    <section
      aria-labelledby="salud-operativa"
      className={cn("flex flex-col gap-4 rounded-xl border border-line bg-surface-1 p-5", className)}
    >
      <div>
        <h3 id="salud-operativa" className="text-xs font-medium text-ink-2">
          {label}
        </h3>
        <p className={cn("mt-1 font-mono text-5xl font-semibold leading-none tabular-figures", colorCifra)}>
          {acotado}
          <span className="text-3xl">%</span>
        </p>
      </div>

      {/* La pista lleva `role="meter"` con sus tres valores: un lector de
          pantalla anuncia «67 de 100», no «una barra». */}
      <div
        role="meter"
        aria-valuenow={acotado}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-labelledby="salud-operativa"
        aria-valuetext={`${acotado}% · ${summary}`}
        className="h-2 w-full overflow-hidden rounded-full bg-surface-3"
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-[var(--dur-slow)] ease-[var(--ease-out)] motion-reduce:transition-none",
            colorRelleno,
          )}
          style={{ width: `${acotado}%` }}
        />
      </div>

      <p className="text-sm text-ink-2">{summary}</p>

      {breakdown && breakdown.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2 border-t border-line pt-4">
          {breakdown.map((entrada) => {
            const contenido = (
              <>
                <span
                  className={cn("font-mono text-xl font-semibold tabular-figures", URGENCY_COLOR_CLASS[entrada.tone])}
                >
                  {entrada.count}
                </span>
                <span className="mt-0.5 block text-2xs leading-tight text-ink-2">{entrada.label}</span>
              </>
            );
            // Sin nada que contar no hay nada que filtrar: la entrada se
            // muestra apagada y no finge ser pulsable.
            const pulsable = Boolean(entrada.onSelect) && entrada.count > 0;
            return (
              <li key={entrada.id} className="min-w-0">
                {pulsable ? (
                  <button
                    type="button"
                    onClick={entrada.onSelect}
                    aria-pressed={entrada.selected}
                    className={cn(
                      "flex min-h-11 w-full flex-col items-start rounded-lg px-2 py-1 text-left transition-colors",
                      "hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                      entrada.selected && "bg-surface-2 ring-1 ring-line-strong",
                    )}
                  >
                    {contenido}
                  </button>
                ) : (
                  <div className="flex min-h-11 flex-col items-start px-2 py-1">{contenido}</div>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}

      {footnote ? <p className="text-2xs leading-5 text-ink-3">{footnote}</p> : null}
    </section>
  );
}

/* ==========================================================================
   FILTROS DE UN GRÁFICO
   ==========================================================================
   Un gráfico dibujado en SVG no es pulsable sin inventar zonas activas que
   ningún teclado alcanza. Esta fila hace las dos cosas a la vez: es la
   etiqueta directa de cada categoría —con su color y su cifra, de modo que
   el gráfico se entiende sin pasar el ratón— y es el control que filtra las
   listas de abajo. Botones de verdad: teclado y lector de pantalla gratis.
   ========================================================================== */

export function ChartFilterChips({
  label,
  options,
  selected,
  onSelect,
  className,
}: {
  /** Para qué sirve la fila. Va al `aria-label` del grupo. */
  label: string;
  options: readonly { value: string; label: string; count: number; colorClassName?: string }[];
  selected: string | null;
  /** Se llama con `null` cuando se vuelve a pulsar la opción activa. */
  onSelect: (value: string | null) => void;
  className?: string;
}) {
  const utiles = options.filter((opcion) => opcion.count > 0);
  if (utiles.length === 0) return null;

  return (
    <div role="group" aria-label={label} className={cn("flex flex-wrap gap-1.5", className)}>
      {utiles.map((opcion) => {
        const activa = selected === opcion.value;
        return (
          <button
            key={opcion.value}
            type="button"
            aria-pressed={activa}
            onClick={() => onSelect(activa ? null : opcion.value)}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-full border px-3 text-sm transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
              activa
                ? "border-line-strong bg-surface-2 font-medium text-ink-1"
                : "border-line bg-surface-1 text-ink-2 hover:border-line-strong hover:text-ink-1",
            )}
          >
            <span
              aria-hidden="true"
              className={cn("size-2.5 shrink-0 rounded-sm bg-current", opcion.colorClassName ?? "text-series-1")}
            />
            <span className="truncate">{opcion.label}</span>
            <span className="font-mono text-2xs tabular-figures text-ink-3">{opcion.count}</span>
          </button>
        );
      })}
    </div>
  );
}
