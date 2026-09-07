import type { ReactNode } from "react";
import {
  EmptyState,
  ErrorState,
  SkeletonRows,
} from "@/components/system";
import { SkeletonCards, SkeletonTable, SkeletonText } from "@/components/ui/skeleton";

/**
 * Silueta de carga acorde al contenido que se espera.
 *
 * `spinner` se conserva por compatibilidad, pero ya no dibuja un spinner: se
 * comprobó que **ninguna** de las 35 pantallas que usan `AsyncState` pasa
 * `shape`, así que todas caían en el valor por defecto y todas mostraban el
 * spinner centrado dentro de una caja de 240 px de alto —exactamente el salto
 * de diseño contra el que advertía el comentario original de este archivo—.
 * Ahora el valor por defecto es la silueta de filas del sistema, que ocupa el
 * sitio del contenido real.
 */
export type LoadingShape = "spinner" | "table" | "cards" | "text";

/**
 * Estado de una consulta: cargando, con error o sin resultados.
 *
 * Ya no dibuja nada propio: reenvía a `SkeletonRows`, `ErrorState` y
 * `EmptyState` del sistema. Antes tenía sus propias tarjetas de error y de
 * vacío, con otra tipografía y otro icono que las del sistema, así que una
 * pantalla de reclutamiento y una de administración mostraban el mismo estado
 * de dos formas distintas.
 *
 * `empty` se añadió en su día porque no existía: cada pantalla resolvía el
 * vacío por su cuenta con `InlineFeedback`, y el resultado era desigual. La
 * acción sigue siendo parte de la firma para que ofrecer una salida sea lo
 * normal y no la excepción.
 */
export function AsyncState({
  state,
  title,
  description,
  onRetry,
  action,
  shape = "spinner",
}: {
  state: "loading" | "error" | "empty";
  title?: string;
  description?: string;
  onRetry?: () => void;
  /** Acción sugerida para salir del estado vacío (p. ej. "Publicar una vacante"). */
  action?: ReactNode;
  shape?: LoadingShape;
}) {
  if (state === "loading") {
    if (shape === "table") return <SkeletonTable />;
    if (shape === "cards") return <SkeletonCards />;
    if (shape === "text") return <SkeletonText lines={4} />;
    return <SkeletonRows rows={6} label={title ?? "Cargando información"} />;
  }

  if (state === "error") {
    return (
      <ErrorState
        title={title ?? "No fue posible cargar la información"}
        detail={description ?? "Conservamos tu contexto. Reintenta la consulta para continuar."}
        onRetry={onRetry}
      />
    );
  }

  return (
    <EmptyState
      reason="no-records"
      title={title}
      description={description}
      action={action}
    />
  );
}
