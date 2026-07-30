"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function AccessLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6" aria-busy="true">
      <Card className="w-full max-w-md border-border/70 bg-card/90">
        <CardContent className="flex items-center gap-4 p-6">
          <LoaderCircle className="size-5 animate-spin text-primary" aria-hidden="true" />
          <div>
            <h1 className="font-semibold">Verificando acceso</h1>
            <p className="mt-1 text-sm text-muted-foreground">Estamos validando tu sesión y espacio de trabajo.</p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

type AccessCode = "AUTH_REQUIRED" | "TENANT_ACCESS_DENIED" | "SUBSCRIPTION_BLOCKED" | "MODULE_NOT_ENABLED" | "FEATURE_NOT_ENABLED" | "ROUTE_NOT_READY" | "ROLE_NOT_ALLOWED" | "PERMISSION_DENIED" | "BRANCH_REQUIRED";

export function AccessDenied({ reason, code, requestId }: { reason: string; code: AccessCode; requestId?: string }) {
  const router = useRouter();
  const actions: Record<AccessCode, { label: string; href?: string; back?: boolean }> = {
    AUTH_REQUIRED: { label: "Iniciar sesión", href: "/login" },
    TENANT_ACCESS_DENIED: { label: "Cambiar contexto", href: "/profile" },
    BRANCH_REQUIRED: { label: "Seleccionar sucursal", href: "/profile" },
    MODULE_NOT_ENABLED: { label: "Solicitar activación", href: "mailto:soporte@talentos.cloud?subject=Solicitud%20de%20activación" },
    FEATURE_NOT_ENABLED: { label: "Solicitar activación", href: "mailto:soporte@talentos.cloud?subject=Solicitud%20de%20activación" },
    ROUTE_NOT_READY: { label: "Volver a la página anterior", back: true },
    SUBSCRIPTION_BLOCKED: { label: "Revisar suscripción", href: "/admin/company/subscription" },
    ROLE_NOT_ALLOWED: { label: "Volver a la página anterior", back: true },
    PERMISSION_DENIED: { label: "Volver a la página anterior", back: true },
  };
  const action = actions[code];
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-lg border-border/70 bg-card/90">
        <CardContent className="flex flex-col items-center gap-5 p-8 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
            <ShieldAlert className="size-7 text-amber-700 dark:text-amber-300" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">No tienes acceso a esta sección</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{reason}</p>
          </div>
          {action.back ? <Button type="button" onClick={() => router.back()}>{action.label}</Button> : <Button asChild><Link href={action.href ?? "/login"}>{action.label}</Link></Button>}
          {requestId ? <p className="text-xs text-muted-foreground">Código de soporte: <code>{requestId}</code></p> : null}
        </CardContent>
      </Card>
    </main>
  );
}
