"use client";

import type { ReactNode } from "react";
import { useAppStore } from "@/store/app-store";
import { AccessDenied, AccessLoading } from "@/components/access-state";

type ModuleRouteGuardProps = {
  module: "asset_inventory" | "restaurant_inventory";
  permission: "asset_inventory.view" | "asset_inventory.manage" | "restaurant_inventory.view" | "restaurant_inventory.manage";
  children: ReactNode;
};

export function ModuleRouteGuard({ module, permission, children }: ModuleRouteGuardProps) {
  const { isBootstrapping, accessContextVerified, currentTenant, hasModule, can } = useAppStore();

  if (isBootstrapping || !accessContextVerified) return <AccessLoading />;
  if (!currentTenant.id) return <AccessDenied code="AUTH_REQUIRED" reason="Selecciona una empresa para continuar." />;
  if (!hasModule(module)) return <AccessDenied code="MODULE_NOT_ENABLED" reason="Este módulo no está activo para la empresa seleccionada." />;
  if (!can(permission)) return <AccessDenied code="PERMISSION_DENIED" reason="No tienes el permiso requerido para entrar a este módulo." />;

  return children;
}
