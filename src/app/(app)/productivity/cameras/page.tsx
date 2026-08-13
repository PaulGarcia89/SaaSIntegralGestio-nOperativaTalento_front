"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, MapPinned, Plus, Radio, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { createProductivityCamera, createProductivityZone, fetchProductivityCameras, fetchProductivityZones } from "@/lib/backend";
import { useAppStore } from "@/store/app-store";
import { AsyncState } from "@/components/async-state";
import { PageHeader } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const zoneTypes = [
  { value: "WORKSTATION", label: "Estación de trabajo" },
  { value: "CHECKOUT", label: "Punto de atención" },
  { value: "WAREHOUSE", label: "Almacén" },
  { value: "RESTRICTED", label: "Zona restringida" },
] as const;

export default function CamerasPage() {
  const { can, currentBranch } = useAppStore();
  const queryClient = useQueryClient();
  const [cameraForm, setCameraForm] = useState({ name: "", sourceType: "RTSP", streamUrl: "" });
  const [zoneForm, setZoneForm] = useState({ cameraId: "", name: "", zoneType: "WORKSTATION" });
  const cameras = useQuery({ queryKey: ["productivity-cameras", currentBranch?.id], queryFn: () => fetchProductivityCameras(currentBranch?.id), enabled: Boolean(currentBranch?.id) });
  const zones = useQuery({ queryKey: ["productivity-zones", currentBranch?.id], queryFn: () => fetchProductivityZones(), enabled: Boolean(currentBranch?.id) });

  const refresh = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ["productivity-cameras", currentBranch?.id] }),
    queryClient.invalidateQueries({ queryKey: ["productivity-zones"] }),
  ]);
  const cameraMutation = useMutation({
    mutationFn: () => createProductivityCamera({ branchId: currentBranch!.id, name: cameraForm.name.trim(), sourceType: cameraForm.sourceType, streamUrl: cameraForm.streamUrl.trim() || undefined }),
    onSuccess: async () => { await refresh(); setCameraForm({ name: "", sourceType: "RTSP", streamUrl: "" }); toast.success("Cámara registrada"); },
    onError: () => toast.error("No fue posible registrar la cámara"),
  });
  const zoneMutation = useMutation({
    mutationFn: () => createProductivityZone({ cameraId: zoneForm.cameraId, name: zoneForm.name.trim(), zoneType: zoneForm.zoneType, polygonCoordinates: [[0, 0], [1, 0], [1, 1], [0, 1]] }),
    onSuccess: async () => { await refresh(); setZoneForm({ cameraId: "", name: "", zoneType: "WORKSTATION" }); toast.success("Zona registrada"); },
    onError: () => toast.error("No fue posible registrar la zona"),
  });

  if (!can("productivity.manage")) return <Card level={2}><CardContent className="p-6"><h1 className="font-semibold">Sin permiso para administrar cámaras</h1><p className="mt-2 text-sm text-text-secondary">Solicita a un administrador el permiso de gestión de productividad.</p></CardContent></Card>;
  if (!currentBranch) return <Card level={2}><CardContent className="p-6"><h1 className="font-semibold">Selecciona una sucursal</h1><p className="mt-2 text-sm text-text-secondary">Las cámaras y zonas siempre se configuran dentro de una sucursal autorizada.</p></CardContent></Card>;
  if (cameras.isLoading || zones.isLoading) return <AsyncState state="loading" title="Cargando cámaras y zonas" />;
  if (cameras.isError || zones.isError) return <AsyncState state="error" title="No fue posible cargar la configuración" onRetry={() => { void cameras.refetch(); void zones.refetch(); }} />;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Configuración operativa" title="Cámaras y zonas" description="Registra fuentes por sucursal y delimita las áreas que se analizarán. La fuente se almacena protegida y su URL nunca vuelve a mostrarse." actions={<Button variant="secondary" onClick={() => void refresh()}><RefreshCw className="size-4" />Actualizar</Button>} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card level={2}><CardContent className="space-y-4 p-5"><Camera className="size-5 text-primary" aria-hidden="true" /><div><h2 className="font-semibold">Registrar cámara</h2><p className="mt-1 text-sm text-text-secondary">Conecta una fuente ya autorizada por el equipo de infraestructura.</p></div><label className="space-y-2"><Label htmlFor="camera-name">Nombre</Label><Input id="camera-name" placeholder="Ej. Recepción principal" value={cameraForm.name} onChange={(event) => setCameraForm({ ...cameraForm, name: event.target.value })} /></label><label className="space-y-2"><Label>Tipo de fuente</Label><Select value={cameraForm.sourceType} onValueChange={(sourceType) => setCameraForm({ ...cameraForm, sourceType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="RTSP">RTSP</SelectItem><SelectItem value="HLS">HLS</SelectItem><SelectItem value="WEBRTC">WebRTC</SelectItem></SelectContent></Select></label><label className="space-y-2"><Label htmlFor="stream-url">URL de stream</Label><Input id="stream-url" placeholder="rtsp://…" type="password" autoComplete="off" value={cameraForm.streamUrl} onChange={(event) => setCameraForm({ ...cameraForm, streamUrl: event.target.value })} /><p className="text-xs text-text-secondary">Opcional cuando el procesador de video administra la fuente por separado.</p></label><Button disabled={!cameraForm.name.trim() || cameraMutation.isPending} onClick={() => cameraMutation.mutate()}><Plus className="size-4" />{cameraMutation.isPending ? "Guardando…" : "Guardar cámara"}</Button></CardContent></Card>
        <Card level={2}><CardContent className="space-y-4 p-5"><MapPinned className="size-5 text-primary" aria-hidden="true" /><div><h2 className="font-semibold">Definir zona</h2><p className="mt-1 text-sm text-text-secondary">La primera zona usa un contorno base; podrás ajustarlo al conectar el editor visual.</p></div><label className="space-y-2"><Label>Cámara</Label><Select value={zoneForm.cameraId} onValueChange={(cameraId) => setZoneForm({ ...zoneForm, cameraId })}><SelectTrigger><SelectValue placeholder="Selecciona una cámara" /></SelectTrigger><SelectContent>{cameras.data?.map((camera) => <SelectItem key={camera.id} value={camera.id}>{camera.name}</SelectItem>)}</SelectContent></Select></label><label className="space-y-2"><Label htmlFor="zone-name">Nombre de zona</Label><Input id="zone-name" placeholder="Ej. Mostrador A" value={zoneForm.name} onChange={(event) => setZoneForm({ ...zoneForm, name: event.target.value })} /></label><label className="space-y-2"><Label>Tipo de zona</Label><Select value={zoneForm.zoneType} onValueChange={(zoneType) => setZoneForm({ ...zoneForm, zoneType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{zoneTypes.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent></Select></label><Button disabled={!zoneForm.cameraId || !zoneForm.name.trim() || zoneMutation.isPending} onClick={() => zoneMutation.mutate()}><Plus className="size-4" />{zoneMutation.isPending ? "Guardando…" : "Guardar zona"}</Button></CardContent></Card>
      </div>
      <section aria-labelledby="registered-cameras"><div className="mb-3 flex items-center gap-2"><Radio className="size-4 text-primary" aria-hidden="true" /><h2 id="registered-cameras" className="font-semibold">Fuentes registradas</h2></div>{cameras.data?.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{cameras.data.map((camera) => <Card key={camera.id} level={2}><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><p className="font-semibold">{camera.name}</p><Badge variant={camera.status === "ACTIVE" ? "success" : "secondary"}>{camera.status === "ACTIVE" ? "Activa" : camera.status}</Badge></div><p className="mt-2 text-sm text-text-secondary">{camera.sourceType}</p><p className="mt-1 text-xs text-text-secondary">{camera.lastHeartbeatAt ? `Última señal: ${new Intl.DateTimeFormat("es", { dateStyle: "short", timeStyle: "short" }).format(new Date(camera.lastHeartbeatAt))}` : "Sin señal registrada todavía"}</p><div className="mt-4 flex flex-wrap gap-2">{zones.data?.filter((zone) => zone.cameraId === camera.id).map((zone) => <Badge key={zone.id} variant="secondary">{zone.name}</Badge>)}</div></CardContent></Card>)}</div> : <Card level={3}><CardContent className="p-5 text-sm text-text-secondary">Aún no hay cámaras configuradas en {currentBranch.name}.</CardContent></Card>}</section>
    </div>
  );
}
