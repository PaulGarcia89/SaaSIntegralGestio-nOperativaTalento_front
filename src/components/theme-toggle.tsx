"use client";

import { Moon, Rows3, Rows4, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-provider";
import { useAppearance } from "@/components/appearance";

/**
 * Conmutador de tema.
 *
 * La preferencia y su persistencia viven ahora en `AppearanceProvider`. Este
 * componente solo la lee y la cambia: antes hacía su propio `fetch` de
 * preferencias al montar, que se repetía en cada pantalla.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useLocale();
  const { theme, setTheme, ready } = useAppearance();
  // Hasta que se conoce la preferencia real se pinta el valor por defecto, que
  // es el mismo que renderiza el servidor. Así el marcado que React hidrata
  // coincide en los dos lados y no hay discrepancia. El tema VISIBLE ya es el
  // correcto: lo aplicó el script de arranque sobre el DOM.
  const shown = ready ? theme : "light";
  const nextTheme = shown === "dark" ? "light" : "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(nextTheme)}
      className={className}
      disabled={!ready}
      aria-label={shown === "dark" ? t("appearance.switchLight") : t("appearance.switchDark")}
    >
      {shown === "dark" ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
    </Button>
  );
}

/**
 * Conmutador de densidad.
 *
 * Existe porque el producto atiende a dos usos legítimamente distintos: quien
 * registra una operación desde el móvil necesita objetivos grandes y texto de
 * 17-18px, y quien supervisa desde un escritorio amplio necesita ver más filas
 * a la vez. Es la misma interfaz reescalada por tokens, no dos interfaces.
 *
 * El icono cambia para reflejar el estado ACTUAL, y la etiqueta accesible dice
 * a qué se cambiará: sin eso, un icono solo no comunica cuál de los dos modos
 * está activo.
 */
export function DensityToggle({ className }: { className?: string }) {
  const { t } = useLocale();
  const { density, setDensity, ready } = useAppearance();
  // Mismo criterio que en el conmutador de tema: hasta conocer la preferencia
  // real se pinta la densidad por defecto, que es la que renderiza el servidor.
  const isCompact = ready && density === "compact";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setDensity(isCompact ? "comfortable" : "compact")}
      className={className}
      disabled={!ready}
      aria-pressed={isCompact}
      aria-label={isCompact ? t("appearance.switchComfortable") : t("appearance.switchCompact")}
      title={isCompact ? t("appearance.compactActive") : t("appearance.comfortableActive")}
    >
      {isCompact ? <Rows4 className="size-4" aria-hidden="true" /> : <Rows3 className="size-4" aria-hidden="true" />}
    </Button>
  );
}
