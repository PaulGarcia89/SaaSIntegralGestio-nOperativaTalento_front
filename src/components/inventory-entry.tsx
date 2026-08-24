"use client";

import Link from "next/link";
import { Boxes, ChefHat, ArrowRight } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InlineFeedback, PageHeader } from "@/components/design-system";

export function InventoryEntry() {
  const { hasModule, isBootstrapping, accessContextVerified, currentTenant } = useAppStore();
  const assetEnabled = hasModule("asset_inventory");
  const restaurantEnabled = hasModule("restaurant_inventory");
  const enabledCount = Number(assetEnabled) + Number(restaurantEnabled);

  if (isBootstrapping || !accessContextVerified) return <div className="p-6">Cargando inventario...</div>;
  if (!currentTenant.id) return <InlineFeedback tone="warning" title="Sin empresa seleccionada">Selecciona una empresa para ver los módulos disponibles.</InlineFeedback>;
  if (enabledCount === 0) return <InlineFeedback tone="info" title="Inventario no disponible">Esta empresa no tiene módulos de inventario activos.</InlineFeedback>;

  return <div className="space-y-6">
    <PageHeader eyebrow="Operaciones" title="Inventario" description="Elige el módulo de inventario disponible para esta empresa." />
    <div className="grid gap-4 md:grid-cols-2">
      <EntryCard icon={Boxes} title="Inventario de activos" description="Administra equipos, mobiliario, herramientas, asignaciones y mantenimiento" href="/inventory/assets" enabled={assetEnabled} />
      <EntryCard icon={ChefHat} title="Inventario de restaurante" description="Administra ingredientes, entradas, recetas, consumo, producción y desperdicios" href="/inventory/restaurant" enabled={restaurantEnabled} />
    </div>
    {enabledCount === 1 ? <InlineFeedback tone="info" title="Sólo hay un módulo activo">El otro inventario no está contratado o habilitado para la empresa actual. Un administrador puede activarlo desde la gestión de módulos.</InlineFeedback> : null}
  </div>;
}

function EntryCard({ icon: Icon, title, description, href, enabled }: { icon: typeof Boxes; title: string; description: string; href: string; enabled: boolean }) {
  return <Card level={2} className={!enabled ? "opacity-75" : undefined}><CardContent className="space-y-4 p-6"><Icon className="size-8 text-primary" /><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold">{title}</h2>{!enabled ? <span className="rounded-full bg-surface-interactive px-2 py-1 text-xs text-text-secondary">No habilitado</span> : null}</div><p className="mt-2 text-sm text-text-secondary">{description}</p></div>{enabled ? <Button asChild><Link href={href}>Abrir módulo <ArrowRight className="size-4" /></Link></Button> : <Button disabled variant="secondary">Solicitar activación</Button>}</CardContent></Card>;
}
