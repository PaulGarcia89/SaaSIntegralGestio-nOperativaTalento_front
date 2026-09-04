"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { fetchInventoryAuditTrail } from "@/lib/backend";
import { useAppStore } from "@/store/app-store";
import { AsyncState } from "@/components/async-state";
import { PageHeader } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
export default function InventoryAuditPage(){const {currentBranch}=useAppStore();const [page,setPage]=useState(1);const audit=useQuery({queryKey:["inventory-audit",currentBranch?.id,page],queryFn:()=>fetchInventoryAuditTrail({branchId:currentBranch?.id,page})});if(audit.isLoading)return <AsyncState state="loading" title="Cargando auditoría"/>;if(audit.isError)return <AsyncState state="error" title="No pudimos cargar la auditoría" onRetry={()=>void audit.refetch()}/>;return <div className="space-y-6"><PageHeader eyebrow="Gobierno" title="Auditoría de inventario" description="Revisa operaciones críticas, actor, resultado y trazabilidad de solicitudes."/><Card level={2}><CardContent className="divide-y p-0">{audit.data?.items.map(item=><div key={item.id} className="flex gap-3 p-4"><History className="mt-0.5 size-4 text-brand"/><div><p className="font-medium">{item.action}</p><p className="text-sm text-text-secondary">{item.email||"Sistema"} · {item.actorRole||"Sin rol"} · {new Date(item.createdAt).toLocaleString()}</p><p className="text-xs text-text-secondary">{item.route} · HTTP {item.statusCode}{item.correlationId?` · ${item.correlationId}`:""}</p></div></div>)}</CardContent></Card>{audit.data&&audit.data.totalPages>1?<div className="flex justify-between"><Button variant="secondary" disabled={page===1} onClick={()=>setPage(page-1)}>Anterior</Button><Button variant="secondary" disabled={page===audit.data.totalPages} onClick={()=>setPage(page+1)}>Siguiente</Button></div>:null}</div>}
