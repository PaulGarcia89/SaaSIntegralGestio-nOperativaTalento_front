"use client";

import { ChevronDown, Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";

/**
 * Selector de idioma.
 *
 * Antes era un `<select>` nativo con tokens heredados (`border-border`,
 * `bg-background`, `focus:ring-primary`): en cualquier pantalla se leía como
 * un widget del sistema operativo pegado entre botones del diseño —galón del
 * navegador, tipografía del SO, radio distinto—. Era el único control de la
 * aplicación que no salía del sistema de diseño.
 *
 * Ahora el `<select>` sigue siendo el mismo elemento nativo (misma semántica,
 * mismo selector nativo en móvil, mismo teclado), pero va transparente encima
 * de una superficie propia: icono, etiqueta y galón los dibujamos nosotros con
 * los mismos tokens que `Button`. No cambia ningún contrato: mismas opciones,
 * mismo `setLocale`, mismo `aria-label`.
 *
 * - `shape="control"` (por defecto) copia `Button variant="secondary"`:
 *   `rounded-md` y altura de `--control-h-*`. Es lo que rodea al selector en la
 *   barra de la aplicación, en el perfil y en el acceso.
 * - `shape="pill"` copia las píldoras de `CandidateNav` y del portal público.
 * - `tone="dark"` es solo color, para fondos grafito.
 */
export function LanguageSelector({
  compact = false,
  tone = "light",
  shape = "control",
  className,
}: {
  compact?: boolean;
  tone?: "light" | "dark";
  shape?: "control" | "pill";
  className?: string;
}) {
  const { locale, enabledLocales, setLocale, t } = useLocale();
  if (enabledLocales.length < 2) return null;
  const dark = tone === "dark";
  const nombres: Record<string, string> = { es: t("language.spanish"), en: t("language.english") };
  const etiqueta = compact ? locale.toUpperCase() : (nombres[locale] ?? locale.toUpperCase());

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center gap-2 border text-sm font-medium",
        "transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]",
        "focus-within:outline-2 focus-within:outline-offset-2",
        shape === "pill"
          ? "min-h-11 rounded-full px-4 py-2"
          : "min-h-[var(--control-h-touch)] rounded-md px-3 sm:min-h-[var(--control-h-base)]",
        dark
          ? "border-surface-dark-ink/15 bg-surface-dark-ink/[0.06] text-surface-dark-ink/80 hover:border-surface-dark-ink/30 hover:text-surface-dark-ink focus-within:outline-accent-fill"
          : "border-line bg-surface-1 text-ink-1 hover:border-line-strong hover:bg-surface-2 focus-within:outline-focus",
        className,
      )}
    >
      <Languages className="size-4 shrink-0 opacity-80" aria-hidden="true" />
      <span aria-hidden="true">{etiqueta}</span>
      <ChevronDown className="size-4 shrink-0 opacity-60" aria-hidden="true" />
      {/*
        El `<select>` real ocupa todo el control y va transparente: conserva el
        comportamiento nativo (incluido el selector a pantalla completa de iOS)
        sin imponer su aspecto. El anillo de foco lo pinta el contenedor con
        `focus-within`, así que el foco de teclado sigue siendo visible.
      */}
      <select
        value={locale}
        onChange={(event) => setLocale(event.target.value as "es" | "en")}
        aria-label={t("language.select")}
        className="absolute -inset-px cursor-pointer appearance-none rounded-[inherit] border-0 bg-transparent p-0 text-transparent opacity-0 outline-none"
      >
        <option value="es">{compact ? "ES" : t("language.spanish")}</option>
        <option value="en">{compact ? "EN" : t("language.english")}</option>
      </select>
    </span>
  );
}
