"use client";
import { useQuery } from "@tanstack/react-query";
import { Laptop, MapPin, ShieldCheck } from "lucide-react";
import { fetchMyInventoryAssets } from "@/lib/backend";
import { AsyncState } from "@/components/async-state";
import { InlineFeedback, PageHeader } from "@/components/design-system";
import { Card, CardContent } from "@/components/ui/card";
export default function MyInventoryAssetsPage(){const assets=useQuery({queryKey:["my-inventory-assets"],queryFn:fetchMyInventoryAssets});return <div className="space-y-6"><PageHeader eyebrow="Autoservicio" title="Mis activos" description="Consulta los equipos y recursos que están bajo tu custodia."/>{assets.isLoading?<AsyncState state="loading" title="Cargando tus activos"/>:null}{assets.isSuccess&&!assets.data.length?<InlineFeedback tone="info" title="Sin activos asignados">No hay activos bajo tu custodia en este momento.</InlineFeedback>:null}<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{assets.data?.map(a=><Card key={a.id} level={2}><CardContent className="space-y-3 p-5"><Laptop className="size-5 text-brand"/><div><p className="font-semibold">{a.item.name}</p><p className="text-sm text-text-secondary">{a.assetTag} · {a.serialNumber||"Sin serie"}</p></div><p className="rounded-lg bg-surface-section p-2 text-sm"><ShieldCheck className="mr-2 inline size-4 text-brand"/>{a.status}</p><p className="text-sm text-text-secondary"><MapPin className="mr-1 inline size-4"/>{a.branch.name}</p></CardContent></Card>)}</div></div>}
