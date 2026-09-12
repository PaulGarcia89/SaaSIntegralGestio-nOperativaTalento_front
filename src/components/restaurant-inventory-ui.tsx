"use client";

import { useUiText } from "@/components/ui-copy";

import type { ReactNode } from "react";
import { ErrorState, SkeletonRows, StatusBadge, type Tone } from "@/components/system";

/**
 * Estado de una consulta del módulo de restaurante.
 *
 * Pasa a las siluetas del sistema: un spinner centrado ocupa una altura fija y
 * provoca un salto de maqueta cuando llega el contenido real, que casi siempre
 * es más alto.
 */
export function RestaurantQueryState({
  loading,
  error,
  retry,
  children,
  label = "Cargando información",
}: {
  loading: boolean;
  error: unknown;
  retry: () => void;
  children: ReactNode;
  label?: string;
}) {
  const uiText = useUiText();
  if (loading) return <SkeletonRows rows={5} label={label} />;
  if (error) {
    return (
      <ErrorState
        title={uiText("No fue posible cargar la información")}
        detail={uiText("Conservamos tu contexto. Reintenta la consulta para continuar.")}
        onRetry={retry}
      />
    );
  }
  return <>{children}</>;
}

/**
 * Estados de los documentos de inventario, en lenguaje de persona.
 *
 * El mapa de rótulos se conserva íntegro: son los términos que la operación ya
 * usa («Aplicado», «Esperando recepción», «Pendiente de aprobación»).
 *
 * Lo que cambia es el TONO. Antes «Aplicado», «Activo», «Aprobado» y «Recibido»
 * salían con la variante de marca del tenant, que es el color que configura
 * cada empresa: un final feliz se pintaba del color corporativo en vez de
 * verde, y en una empresa con marca roja se leía como un problema. Ahora el
 * tono lo decide el significado.
 */
const LABELS: Record<string, string> = {
  CONFIRMED: "Aplicado",
  ACTIVE: "Activo",
  AVAILABLE: "Disponible",
  APPROVED: "Aprobado",
  DRAFT: "Pendiente de confirmación",
  PENDING: "Pendiente",
  IN_PROGRESS: "En progreso",
  IN_REVIEW: "Pendiente de aprobación",
  REVIEW: "Pendiente de aprobación",
  SENT: "Esperando recepción",
  IN_TRANSIT: "En tránsito",
  RECEIVED: "Recibido",
  CANCELLED: "Cancelado",
  ARCHIVED: "Archivado",
  DEPLETED: "Agotado",
  INACTIVE: "Inactivo",
  UNKNOWN: "Sin estado",
  EXPIRED: "Vencido",
  BLOCKED: "Bloqueado",
};

/** Terminado y bien. */
const DONE = new Set(["CONFIRMED", "ACTIVE", "AVAILABLE", "APPROVED", "RECEIVED"]);
/** En curso: nadie tiene que alarmarse, pero tampoco está cerrado. */
const IN_FLIGHT = new Set(["DRAFT", "PENDING", "IN_PROGRESS", "IN_REVIEW", "REVIEW", "SENT", "IN_TRANSIT"]);
/** Terminado sin efecto. Neutro: ni éxito ni problema. */
const CLOSED = new Set(["CANCELLED", "ARCHIVED", "DEPLETED", "INACTIVE", "UNKNOWN"]);
/** Exige actuar. */
const NEEDS_ACTION = new Set(["EXPIRED", "BLOCKED"]);

export function restaurantStatusTone(status: string): Tone {
  const normalized = status.toUpperCase();
  if (DONE.has(normalized)) return "success";
  if (IN_FLIGHT.has(normalized)) return "progress";
  if (CLOSED.has(normalized)) return "neutral";
  if (NEEDS_ACTION.has(normalized)) return "danger";
  // Un estado que el frontend no conoce no es un error del usuario: se muestra
  // tal cual y en neutro, en vez de pintarlo de rojo como hacía antes.
  return "neutral";
}

export function restaurantStatusLabel(status: string): string {
  return LABELS[status.toUpperCase()] ?? status;
}

/**
 * El distintivo traduce su rótulo.
 *
 * `restaurantStatusLabel` devuelve el término español del mapa de arriba y se
 * pintaba tal cual: con la aplicación en inglés, «Disponible», «Aplicado» y
 * «Esperando recepción» salían en español dentro de tablas cuyas cabeceras ya
 * estaban traducidas. El mapa se conserva intacto —son los términos que la
 * operación usa— y lo que cambia es que ahora pasa por el traductor.
 */
export function RestaurantStatusBadge({ status, size = "md" }: { status: string; size?: "sm" | "md" }) {
  const uiText = useUiText();
  return <StatusBadge size={size} label={uiText(restaurantStatusLabel(status))} tone={restaurantStatusTone(status)} />;
}
