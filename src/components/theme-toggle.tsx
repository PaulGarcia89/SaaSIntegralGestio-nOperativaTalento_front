"use client";

import { Moon, Rows3, Rows4, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppearance } from "@/components/appearance";

/**
 * Conmutador de tema.
 *
 * La preferencia y su persistencia viven ahora en `AppearanceProvider`. Este
 * componente solo la lee y la cambia: antes hacía su propio `fetch` de
 * preferencias al montar, que se repetía en cada pantalla.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, ready } = useAppearance();
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(nextTheme)}
      className={className}
      disabled={!ready}
      aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {theme === "dark" ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
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
  const { density, setDensity, ready } = useAppearance();
  const isCompact = density === "compact";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setDensity(isCompact ? "comfortable" : "compact")}
      className={className}
      disabled={!ready}
      aria-pressed={isCompact}
      aria-label={isCompact ? "Cambiar a vista cómoda" : "Cambiar a vista compacta"}
      title={isCompact ? "Vista compacta activa" : "Vista cómoda activa"}
    >
      {isCompact ? <Rows4 className="size-4" aria-hidden="true" /> : <Rows3 className="size-4" aria-hidden="true" />}
    </Button>
  );
}
