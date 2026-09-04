"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { fetchPlatformAudit } from "@/lib/backend";
import { AsyncState } from "@/components/async-state";
import { PageHeader } from "@/components/design-system";
import { FilterToolbar } from "@/components/domain";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function AuditPage() {
  const [action, setAction] = useState("");
  const audit = useQuery({ queryKey: ["platform-audit", action], queryFn: () => fetchPlatformAudit({ action, page: 1, pageSize: 50 }) });
  if (audit.isLoading) return <AsyncState state="loading" title="Cargando auditoría" />;
  if (audit.isError) return <AsyncState state="error" title="No fue posible cargar la auditoría" onRetry={() => void audit.refetch()} />;
  return <div className="space-y-5"><PageHeader eyebrow="Gobierno de plataforma" title="Auditoría" description="Consulta cambios y eventos dentro del alcance autorizado. Los registros no pueden editarse desde esta vista." /><FilterToolbar searchPlaceholder="Filtrar por acción" options={[{ label: "Todas", value: "" }, { label: "Usuarios", value: "USER" }, { label: "Empresa", value: "TENANT" }, { label: "Seguridad", value: "AUTH" }]} searchValue={action} onSearchChange={setAction} filterValue={action} onFilterChange={setAction} /><p className="text-sm text-text-secondary">{audit.data?.total ?? 0} eventos encontrados</p><div className="space-y-3">{audit.data?.items.length ? audit.data.items.map((item) => <Card key={item.id} level={2}><CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex items-center gap-2"><History className="size-4 text-brand" /><p className="font-medium">{item.action}</p></div><p className="mt-1 truncate text-sm text-text-secondary">{item.route ?? "Ruta no registrada"}</p></div><div className="flex items-center gap-2 text-xs text-text-secondary"><Badge variant="secondary">{item.branchId ? "Sucursal" : "Empresa"}</Badge><time>{new Intl.DateTimeFormat("es", { dateStyle: "short", timeStyle: "short" }).format(new Date(item.createdAt))}</time></div></CardContent></Card>) : <Card level={3}><CardContent className="p-6 text-sm text-text-secondary">No hay eventos para el filtro seleccionado.</CardContent></Card>}</div></div>;
}
