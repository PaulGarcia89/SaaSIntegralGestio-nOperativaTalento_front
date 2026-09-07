"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BlockedState, SkeletonRows } from "@/components/system";
import { Button } from "@/components/ui/button";

/**
 * Estados de la comprobación de acceso.
 *
 * `AccessDenied` decía «No tienes acceso a esta sección» y un motivo, sin
 * nombrar nunca a quién hay que pedírselo. Es la pantalla en la que alguien
 * queda parado sin saber qué hacer, así que ahora usa `BlockedState`, que
 * exige por firma decir la causa, el responsable y la salida.
 *
 * El icono estaba pintado con `bg-status-warning/15 / text-amber-700` y su variante
 * oscura escrita a mano; ahora sale del tono de aviso del sistema.
 */

export function AccessLoading() {
  return (
    <main className="mx-auto w-full max-w-3xl p-6" aria-busy="true">
      <SkeletonRows rows={4} label="Verificando tu sesión y tu espacio de trabajo" />
    </main>
  );
}

type AccessCode =
  | "AUTH_REQUIRED"
  | "TENANT_ACCESS_DENIED"
  | "SUBSCRIPTION_BLOCKED"
  | "MODULE_NOT_ENABLED"
  | "FEATURE_NOT_ENABLED"
  | "ROUTE_NOT_READY"
  | "ROLE_NOT_ALLOWED"
  | "PERMISSION_DENIED"
  | "BRANCH_REQUIRED";

/**
 * Quién resuelve cada bloqueo y cómo. Antes solo se ofrecía un botón; el
 * texto de «quién» no existía en ninguna parte, y es lo primero que hace
 * falta para desbloquearse.
 */
const CASES: Record<
  AccessCode,
  { title: string; owner: string; resolution: string; label: string; href?: string; back?: boolean }
> = {
  AUTH_REQUIRED: {
    title: "Necesitas iniciar sesión",
    owner: "Tú",
    resolution: "Entra con tu cuenta para continuar donde estabas.",
    label: "Iniciar sesión",
    href: "/login",
  },
  TENANT_ACCESS_DENIED: {
    title: "Esta empresa no está en tu alcance",
    owner: "Quien administra la empresa",
    resolution: "Cambia de contexto desde tu perfil o pide que te asignen a esta empresa.",
    label: "Cambiar contexto",
    href: "/profile",
  },
  BRANCH_REQUIRED: {
    title: "Falta elegir una sucursal",
    owner: "Tú",
    resolution: "Casi todo lo que se registra pertenece a una sucursal. Elige una en tu perfil.",
    label: "Seleccionar sucursal",
    href: "/profile",
  },
  MODULE_NOT_ENABLED: {
    title: "El módulo no está habilitado en esta empresa",
    owner: "Quien administra la plataforma",
    resolution: "El módulo existe, pero esta empresa no lo tiene activado. Solicita su activación.",
    label: "Solicitar activación",
    href: "mailto:soporte@talentos.cloud?subject=Solicitud%20de%20activaci%C3%B3n%20de%20m%C3%B3dulo",
  },
  FEATURE_NOT_ENABLED: {
    title: "Esta función no está habilitada",
    owner: "Quien administra la plataforma",
    resolution: "Forma parte del producto, pero no está activada para tu empresa.",
    label: "Solicitar activación",
    href: "mailto:soporte@talentos.cloud?subject=Solicitud%20de%20activaci%C3%B3n%20de%20funci%C3%B3n",
  },
  ROUTE_NOT_READY: {
    title: "Esta pantalla todavía no está disponible",
    owner: "El equipo del producto",
    resolution: "Aparece en el menú pero aún no se ha publicado. No hay nada que puedas hacer desde aquí.",
    label: "Volver a la página anterior",
    back: true,
  },
  SUBSCRIPTION_BLOCKED: {
    title: "La suscripción no permite entrar ahora mismo",
    owner: "Quien administra la empresa",
    resolution: "Revisa el estado del plan contratado para restablecer el acceso.",
    label: "Revisar suscripción",
    href: "/admin/company/subscription",
  },
  ROLE_NOT_ALLOWED: {
    title: "Tu rol no llega a esta sección",
    owner: "Quien administra la empresa",
    resolution: "El acceso depende del rol, no de un permiso suelto: hay que cambiarte de rol.",
    label: "Volver a la página anterior",
    back: true,
  },
  PERMISSION_DENIED: {
    title: "Te falta un permiso para esta sección",
    owner: "Quien administra la empresa",
    resolution: "Pide que añadan el permiso correspondiente a tu rol en Administración › Roles.",
    label: "Volver a la página anterior",
    back: true,
  },
};

export function AccessDenied({ reason, code, requestId }: { reason: string; code: AccessCode; requestId?: string }) {
  const router = useRouter();
  const detail = CASES[code];

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6">
      <BlockedState
        title={detail.title}
        cause={reason}
        owner={detail.owner}
        resolution={detail.resolution}
        action={
          detail.back ? (
            <Button type="button" onClick={() => router.back()}>
              {detail.label}
            </Button>
          ) : (
            <Button asChild>
              <Link href={detail.href ?? "/login"}>{detail.label}</Link>
            </Button>
          )
        }
      />
      {requestId ? (
        <p className="text-center text-2xs text-ink-3">
          Código de soporte: <code className="font-mono">{requestId}</code>
        </p>
      ) : null}
    </main>
  );
}
