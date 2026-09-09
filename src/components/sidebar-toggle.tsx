"use client";

import type * as React from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-provider";
import { useAppearance } from "@/components/appearance";

/**
 * Contrae y expande la barra lateral de escritorio.
 *
 * Vive en la franja superior y NO dentro de la barra, a propósito: un
 * conmutador que se mueve al pulsarlo obliga a buscarlo otra vez cada vez. En
 * la franja ocupa siempre el mismo sitio —el mismo que el botón de menú en
 * móvil— en los dos estados.
 *
 * El icono refleja lo que va a pasar al pulsar, y la etiqueta accesible lo
 * dice con palabras; `aria-pressed` comunica el estado actual, que es lo que
 * un icono solo no puede transmitir. `aria-controls` lo enlaza con la barra.
 *
 * Mientras la preferencia real no ha llegado del servidor se pinta el valor
 * por defecto —igual que el conmutador de tema y el de densidad— para que el
 * marcado que hidrata React coincida con el del servidor.
 */
export function SidebarToggle({
  className,
  controls,
  ref,
}: {
  className?: string;
  controls: string;
  /** Permite devolverle el foco al cerrar el asomo con Esc. */
  ref?: React.Ref<HTMLButtonElement>;
}) {
  const { t } = useLocale();
  const { navCollapsed, setNavCollapsed, ready } = useAppearance();
  const collapsed = ready && navCollapsed;

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      onClick={() => setNavCollapsed(!collapsed)}
      className={className}
      disabled={!ready}
      aria-pressed={collapsed}
      aria-controls={controls}
      aria-label={collapsed ? t("workspace.expandNav") : t("workspace.collapseNav")}
      title={collapsed ? t("workspace.expandNav") : t("workspace.collapseNav")}
    >
      {collapsed ? <PanelLeftOpen className="size-4" aria-hidden="true" /> : <PanelLeftClose className="size-4" aria-hidden="true" />}
    </Button>
  );
}
