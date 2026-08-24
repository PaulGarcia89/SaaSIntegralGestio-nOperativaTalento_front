"use client";

import Link from "next/link";
import { ChefHat, ArrowRight } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InlineFeedback, PageHeader } from "@/components/design-system";

export function InventoryEntry() {
  const { hasModule, isBootstrapping, accessContextVerified, currentTenant } = useAppStore();
  const restaurantEnabled = hasModule("restaurant_inventory");

  if (isBootstrapping || !accessContextVerified) return <div className="p-6">Cargando inventario...</div>;
  if (!currentTenant.id) return <InlineFeedback tone="warning" title="Sin empresa seleccionada">Selecciona una empresa para ver los módulos disponibles.</InlineFeedback>;
  if (!restaurantEnabled) return <InlineFeedback tone="info" title="Inventario de restaurante no habilitado">El inventario de activos se administra desde su módulo separado. Solicita la activación del inventario de restaurante para acceder a ingredientes, recetas y consumos.</InlineFeedback>;

  return <div className="space-y-6">
    <PageHeader eyebrow="Operaciones" title="Inventario de restaurante" description="Administra ingredientes, entradas, recetas, consumo, producción y desperdicios." />
    <div className="max-w-3xl">
      <EntryCard icon={ChefHat} title="Inventario de restaurante" description="Consulta y opera el inventario de alimentos sin mezclarlo con el inventario de activos." href="/inventory/restaurant" enabled />
    </div>
  </div>;
}

function EntryCard({ icon: Icon, title, description, href, enabled }: { icon: typeof ChefHat; title: string; description: string; href: string; enabled: boolean }) {
  return <Card level={2} className={!enabled ? "opacity-75" : undefined}><CardContent className="space-y-4 p-6"><Icon className="size-8 text-primary" /><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold">{title}</h2>{!enabled ? <span className="rounded-full bg-surface-interactive px-2 py-1 text-xs text-text-secondary">No habilitado</span> : null}</div><p className="mt-2 text-sm text-text-secondary">{description}</p></div>{enabled ? <Button asChild><Link href={href}>Abrir módulo <ArrowRight className="size-4" /></Link></Button> : <Button disabled variant="secondary">Solicitar activación</Button>}</CardContent></Card>;
}
