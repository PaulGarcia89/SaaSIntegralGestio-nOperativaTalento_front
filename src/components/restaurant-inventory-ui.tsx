"use client";

import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Clock3, PackageX } from "lucide-react";
import { AsyncState } from "@/components/async-state";
import { Badge } from "@/components/ui/badge";

export function RestaurantQueryState({ loading, error, retry, children }: { loading: boolean; error: unknown; retry: () => void; children: ReactNode }) {
  if (loading) return <AsyncState state="loading" />;
  if (error) return <AsyncState state="error" onRetry={retry} description="No fue posible cargar la información. Intenta nuevamente." />;
  return <>{children}</>;
}

export function RestaurantStatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const labels: Record<string, string> = { CONFIRMED: "Aplicado", ACTIVE: "Activo", AVAILABLE: "Disponible", APPROVED: "Aprobado", DRAFT: "Pendiente de confirmación", PENDING: "Pendiente", IN_PROGRESS: "En progreso", IN_REVIEW: "Pendiente de aprobación", REVIEW: "Pendiente de aprobación", SENT: "Esperando recepción", IN_TRANSIT: "En tránsito", RECEIVED: "Recibido", CANCELLED: "Cancelado", ARCHIVED: "Archivado", DEPLETED: "Agotado", INACTIVE: "Inactivo", UNKNOWN: "Sin estado", EXPIRED: "Vencido", BLOCKED: "Bloqueado" };
  const config = normalized === "CONFIRMED" || normalized === "ACTIVE" || normalized === "AVAILABLE" || normalized === "APPROVED" || normalized === "RECEIVED" ? { label: labels[normalized], icon: CheckCircle2, variant: "default" as const } : normalized === "DRAFT" || normalized === "PENDING" || normalized === "IN_PROGRESS" || normalized === "IN_REVIEW" || normalized === "REVIEW" || normalized === "SENT" || normalized === "IN_TRANSIT" ? { label: labels[normalized], icon: Clock3, variant: "secondary" as const } : normalized === "CANCELLED" || normalized === "ARCHIVED" || normalized === "DEPLETED" ? { label: labels[normalized], icon: PackageX, variant: "outline" as const } : normalized === "INACTIVE" || normalized === "UNKNOWN" ? { label: labels[normalized], icon: AlertCircle, variant: "secondary" as const } : normalized === "EXPIRED" || normalized === "BLOCKED" ? { label: labels[normalized], icon: AlertCircle, variant: "destructive" as const } : { label: status, icon: AlertCircle, variant: "destructive" as const };
  const Icon = config.icon;
  return <Badge variant={config.variant}><Icon className="mr-1 size-3" />{config.label}</Badge>;
}
