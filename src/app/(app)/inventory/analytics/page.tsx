"use client";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Boxes, ClipboardList, Wrench } from "lucide-react";
import { fetchInventoryAnalytics } from "@/lib/backend";
import { useAppStore } from "@/store/app-store";
import { AsyncState } from "@/components/async-state";
import { PageHeader } from "@/components/design-system";
import { Card, CardContent } from "@/components/ui/card";
export default function InventoryAnalyticsPage(){const {currentBranch}=useAppStore();const data=useQuery({queryKey:["inventory-analytics",currentBranch?.id],queryFn:()=>fetchInventoryAnalytics(currentBranch?.id)});if(data.isLoading)return <AsyncState state="loading" title="Cargando analítica"/>;if(data.isError)return <AsyncState state="error" title="No pudimos cargar la analítica" onRetry={()=>void data.refetch()}/>;const d=data.data!;const metrics=[[Boxes,"Activos totales",d.assets.total],[ClipboardList,"En custodia",d.assets.assigned],[AlertTriangle,"Reposición requerida",d.stock.reorder],[Wrench,"Mantenimientos abiertos",d.operations.openMaintenance],[AlertTriangle,"Bajo mínimo",d.stock.belowMinimum],[ClipboardList,"Compras en curso",d.operations.purchaseOrdersInProgress]] as const;return <div className="space-y-6"><PageHeader eyebrow="Analítica operativa" title="Inventario en contexto" description="Indicadores de disponibilidad, reposición y mantenimiento para la sucursal activa."/><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{metrics.map(([Icon,label,value])=><Card key={label} level={2}><CardContent className="flex items-center gap-4 p-5"><Icon className="size-5 text-brand"/><div><p className="text-sm text-text-secondary">{label}</p><p className="text-3xl font-semibold">{value}</p></div></CardContent></Card>)}</div></div>}
