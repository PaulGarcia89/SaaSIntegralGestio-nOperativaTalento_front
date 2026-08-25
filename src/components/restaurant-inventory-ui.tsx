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
  const config = normalized === "CONFIRMED" || normalized === "ACTIVE" ? { label: "Activo", icon: CheckCircle2, variant: "default" as const } : normalized === "DRAFT" || normalized === "PENDING" ? { label: "Pendiente", icon: Clock3, variant: "secondary" as const } : normalized === "CANCELLED" || normalized === "ARCHIVED" ? { label: "Cerrado", icon: PackageX, variant: "outline" as const } : { label: status, icon: AlertCircle, variant: "destructive" as const };
  const Icon = config.icon;
  return <Badge variant={config.variant}><Icon className="mr-1 size-3" />{config.label}</Badge>;
}
