"use client";

import { useUiText } from "@/components/ui-copy";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Boxes, ChefHat, type LucideIcon } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { BlockedState, PageHeader, SkeletonRows } from "@/components/system";

/**
 * Selector entre los dos inventarios de la empresa.
 *
 * Qué cambió
 * ----------
 * · Mientras arrancaba la sesión se devolvía un `<div>Cargando inventario...</div>`
 *   que borraba el encabezado: la persona perdía el título y el contexto.
 * · Los dos bloqueos —sin empresa, sin módulos— eran avisos sin salida: decían
 *   que no se puede seguir, pero no a quién pedirlo ni qué hacer. Ahora usan
 *   `BlockedState`, que nombra al responsable.
 * · Cuando solo había un módulo activo se añadía un aviso —«el otro inventario
 *   no está habilitado»— que no lleva a ninguna decisión. Fuera.
 * · Solo el botón era clicable, no la tarjeta entera.
 * · Con un único inventario contratado seguía habiendo que elegir entre una
 *   sola opción. Ahora se entra directamente: los dos inventarios son módulos
 *   independientes, no dos variantes de uno.
 */
export function InventoryEntry() {
  const uiText = useUiText();
  const router = useRouter();
  const { hasModule, isBootstrapping, accessContextVerified, currentTenant } = useAppStore();
  const assetEnabled = hasModule("asset_inventory");
  const restaurantEnabled = hasModule("restaurant_inventory");
  const enabledCount = Number(assetEnabled) + Number(restaurantEnabled);
  const ready = !isBootstrapping && accessContextVerified && Boolean(currentTenant.id);
  const only = enabledCount === 1 ? (assetEnabled ? "/inventory/assets/dashboard" : "/inventory/restaurant/dashboard") : null;

  // Elegir entre una sola opción no es elegir. Con un único inventario
  // contratado esta pantalla era una tarjeta y un clic de más.
  useEffect(() => {
    if (ready && only) router.replace(only);
  }, [only, ready, router]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={uiText("Operaciones")}
        title={uiText("Inventario")}
        description={uiText("Elige con qué inventario vas a trabajar.")}
      />

      {isBootstrapping || !accessContextVerified || only ? (
        <SkeletonRows rows={2} label={uiText("Cargando los módulos de inventario")} />
      ) : !currentTenant.id ? (
        <BlockedState
          title={uiText("Falta elegir la empresa")}
          cause="Los módulos de inventario dependen de la empresa activa, y ahora mismo no hay ninguna seleccionada."
          owner="Tú, desde el selector de empresa"
          resolution="Elige una empresa en el selector de la barra superior."
        />
      ) : enabledCount === 0 ? (
        <BlockedState
          title={uiText("Esta empresa no tiene inventario activo")}
          cause="Ni el inventario de activos ni el de restaurante están habilitados para esta empresa."
          owner={uiText("Quien administra la empresa")}
          resolution="Se habilitan desde Administración › Módulos."
        />
      ) : (
        <div className={`grid gap-4 ${enabledCount > 1 ? "md:grid-cols-2" : "max-w-3xl"}`}>
          {assetEnabled ? (
            <EntryCard
              icon={Boxes}
              title={uiText("Inventario de activos")}
              description={uiText("Equipos, mobiliario y herramientas: custodia, entregas, devoluciones y mantenimiento.")}
              href="/inventory/assets/dashboard"
            />
          ) : null}
          {restaurantEnabled ? (
            <EntryCard
              icon={ChefHat}
              title={uiText("Inventario de restaurante")}
              description={uiText("Ingredientes y recetas: entradas, consumo, producción, mermas y conteos.")}
              href="/inventory/restaurant/dashboard"
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

function EntryCard({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
}) {
  const uiText = useUiText();
  return (
    <Link
      href={href}
      className="group flex flex-col gap-4 rounded-lg border border-line bg-surface-1 p-6 transition-colors hover:border-line-strong"
    >
      <Icon className="size-8 text-ink-3" aria-hidden="true" />
      <div>
        <h2 className="text-lg font-semibold text-ink-1">{title}</h2>
        <p className="mt-2 text-sm text-ink-2">{description}</p>
      </div>
      <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-ink-1">
        {uiText("Abrir")}<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </Link>
  );
}
