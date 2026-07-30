"use client";

import type { ReactNode } from "react";
import type { PermissionKey } from "@/lib/contracts";
import { useAppStore } from "@/store/app-store";

type PermissionGateProps = {
  permission?: PermissionKey;
  anyOf?: PermissionKey[];
  allOf?: PermissionKey[];
  fallback?: ReactNode;
  children: ReactNode;
};

export function PermissionGate({
  permission,
  anyOf,
  allOf,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { can, canAny, canAll } = useAppStore();
  const allowed =
    (!permission || can(permission)) &&
    (!anyOf?.length || canAny(anyOf)) &&
    (!allOf?.length || canAll(allOf));

  return allowed ? children : fallback;
}
