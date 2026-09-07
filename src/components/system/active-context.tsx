"use client";

import { Building2 } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

/* ==========================================================================
   CONTEXTO ACTIVO
   ==========================================================================
   Empresa y sucursal sobre las que hablan las cifras de la pantalla.

   Sin esto, el panel de un módulo enseña números distintos según el contexto
   elegido en la cabecera y no hay forma de saber por qué: la misma pantalla,
   los mismos rótulos, otras cifras. Es una línea de texto, no una tarjeta,
   porque es una aclaración permanente y no algo que haya que mirar.

   Va justo debajo del encabezado y por encima de todo lo demás, que es donde
   se busca cuando una cifra sorprende.
   ========================================================================== */

export function ActiveContext({
  extra,
  className,
}: {
  /** Alcance adicional: almacén, periodo, «solo mis casos». */
  extra?: string;
  className?: string;
}) {
  const { currentTenant, currentBranch } = useAppStore();
  const { t } = useLocale();

  const partes = [currentBranch?.name ?? t("common.allBranches"), extra].filter(
    (parte): parte is string => Boolean(parte),
  );

  return (
    <p className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-2", className)}>
      <Building2 className="size-4 shrink-0 text-ink-3" aria-hidden="true" />
      {/* El rótulo existe para quien escucha la página: sin él, dos nombres
          propios seguidos no dicen cuál es la empresa y cuál la sucursal. */}
      <span className="sr-only">{t("common.company")}:</span>
      <span className="font-medium text-ink-1">{currentTenant.name}</span>
      {partes.map((parte, indice) => (
        <span key={`${parte}-${indice}`} className="flex items-center gap-2">
          <span aria-hidden="true" className="text-ink-3">
            ·
          </span>
          {indice === 0 ? <span className="sr-only">{t("common.branch")}:</span> : null}
          <span>{parte}</span>
        </span>
      ))}
    </p>
  );
}
