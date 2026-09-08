"use client";

import { useUiText } from "@/components/ui-copy";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, MapPinned, Plus, Radio, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  createProductivityCamera,
  createProductivityZone,
  fetchProductivityCameras,
  fetchProductivityZones,
} from "@/lib/backend";
import { useAppStore } from "@/store/app-store";
import { AsyncState } from "@/components/async-state";
import { InlineFeedback, PageHeader } from "@/components/design-system";
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

function formatTime(iso?: string | null) {
  if (!iso) return "Sin señal";
  return new Intl.DateTimeFormat("es", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
}

export default function CamerasPage() {
  const uiText = useUiText();
  const { can, currentBranch } = useAppStore();
  const queryClient = useQueryClient();
  const branchId = currentBranch?.id;
  const [cameraForm, setCameraForm] = useState({ name: "", sourceType: "RTSP", streamUrl: "" });
  const [zoneForm, setZoneForm] = useState({ cameraId: "", name: "", zoneType: "WORKSTATION" });
  const cameras = useQuery({
    queryKey: ["productivity-cameras", branchId],
    queryFn: () => fetchProductivityCameras(branchId),
    enabled: Boolean(branchId),
  });
  const zones = useQuery({
    queryKey: ["productivity-zones", branchId],
    queryFn: () => fetchProductivityZones(),
    enabled: Boolean(branchId),
  });

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["productivity-cameras", branchId] }),
      queryClient.invalidateQueries({ queryKey: ["productivity-zones"] }),
    ]);

  const cameraMutation = useMutation({
    mutationFn: () =>
      createProductivityCamera({
        branchId: currentBranch!.id,
        name: cameraForm.name.trim(),
        sourceType: cameraForm.sourceType,
        streamUrl: cameraForm.streamUrl.trim() || undefined,
      }),
    onSuccess: async () => {
      await refresh();
      setCameraForm({ name: "", sourceType: "RTSP", streamUrl: "" });
      toast.success("Cámara registrada");
    },
    onError: () => toast.error("No fue posible registrar la cámara"),
  });

  const zoneMutation = useMutation({
    mutationFn: () =>
      createProductivityZone({
        cameraId: zoneForm.cameraId,
        name: zoneForm.name.trim(),
        zoneType: zoneForm.zoneType,
        polygonCoordinates: [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ],
      }),
    onSuccess: async () => {
      await refresh();
      setZoneForm({ cameraId: "", name: "", zoneType: "WORKSTATION" });
      toast.success("Zona registrada");
    },
    onError: () => toast.error("No fue posible registrar la zona"),
  });

  if (!can("productivity.manage")) {
    return (
      <Card level={2}>
        <CardContent className="p-6">
          <h1 className="font-semibold">{uiText("Sin permiso para administrar cámaras")}</h1>
          <p className="mt-2 text-sm text-text-secondary">{uiText("Solicita a un administrador el permiso de gestión de productividad.")}</p>
        </CardContent>
      </Card>
    );
  }

  if (!currentBranch) {
    return (
      <Card level={2}>
        <CardContent className="p-6">
          <h1 className="font-semibold">{uiText("Selecciona una sucursal")}</h1>
          <p className="mt-2 text-sm text-text-secondary">{uiText("Las cámaras y zonas siempre se configuran dentro de una sucursal autorizada.")}</p>
        </CardContent>
      </Card>
    );
  }

  if (cameras.isLoading || zones.isLoading) {
    return <AsyncState state="loading" title={uiText("Cargando cámaras y zonas")} />;
  }
  if (cameras.isError || zones.isError) {
    return <AsyncState state="error" title={uiText("No fue posible cargar la configuración")} onRetry={() => void refresh()} />;
  }

  const currentZones = zones.data ?? [];
  const currentCameras = cameras.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={uiText("Configuración operativa")}
        title={uiText("Cámaras y zonas")}
        description={uiText("Registra fuentes por sucursal y define las zonas que se analizarán en Productividad.")}
        actions={
          <Button onClick={() => void refresh()}>
            <RefreshCw className="size-4" />
            {uiText("Actualizar")}</Button>
        }
      />

      {/* Primero lo que existe (fuentes y zonas); el alta va plegada y solo
          se abre sola cuando todavía no hay ninguna cámara. */}
      <details className="group rounded-lg border border-line bg-surface-1" open={currentCameras.length === 0}>
        <summary className="flex min-h-[var(--control-h-touch)] cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 text-base font-semibold text-ink-1 [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2"><Plus className="size-4" aria-hidden="true" />{uiText("Agregar cámara o zona")}</span>
          <span className="text-sm font-normal text-ink-2 group-open:hidden">{currentCameras.length} {currentCameras.length === 1 ? "cámara" : "cámaras"} · {currentZones.length} {currentZones.length === 1 ? "zona" : "zonas"}</span>
        </summary>
      <div className="grid gap-5 border-t border-line p-4 lg:grid-cols-2">
        <Card level={2}>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start gap-3">
              <Camera className="size-5 text-brand" aria-hidden="true" />
              <div>
                <h2 className="font-semibold">{uiText("Registrar cámara")}</h2>
                <p className="mt-1 text-sm text-text-secondary">{uiText("Conecta una fuente ya autorizada por el equipo de infraestructura.")}</p>
              </div>
            </div>
            <label className="space-y-2">
              <Label htmlFor="camera-name">{uiText("Nombre")}</Label>
              <Input
                id="camera-name"
                placeholder={uiText("Ej. Recepción principal")}
                value={cameraForm.name}
                onChange={(event) => setCameraForm({ ...cameraForm, name: event.target.value })}
              />
            </label>
            <label className="space-y-2">
              <Label>{uiText("Tipo de fuente")}</Label>
              <Select value={cameraForm.sourceType} onValueChange={(sourceType) => setCameraForm({ ...cameraForm, sourceType })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RTSP">RTSP</SelectItem>
                  <SelectItem value="HLS">HLS</SelectItem>
                  <SelectItem value="WEBRTC">WebRTC</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <label className="space-y-2">
              <Label htmlFor="stream-url">{uiText("URL de stream")}</Label>
              <Input
                id="stream-url"
                placeholder="rtsp://…"
                type="password"
                autoComplete="off"
                value={cameraForm.streamUrl}
                onChange={(event) => setCameraForm({ ...cameraForm, streamUrl: event.target.value })}
              />
              <p className="text-xs text-text-secondary">{uiText("Opcional cuando el procesador de video administra la fuente por separado.")}</p>
            </label>
            <Button
              disabled={!cameraForm.name.trim() || cameraMutation.isPending}
              onClick={() => cameraMutation.mutate()}
            >
              <Plus className="size-4" />
              {cameraMutation.isPending ? uiText("Guardando…") : "Guardar cámara"}
            </Button>
          </CardContent>
        </Card>

        <Card level={2}>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start gap-3">
              <MapPinned className="size-5 text-brand" aria-hidden="true" />
              <div>
                <h2 className="font-semibold">{uiText("Definir zona")}</h2>
                <p className="mt-1 text-sm text-text-secondary">{uiText("La primera zona usa un contorno base; podrás ajustarlo al conectar el editor visual.")}</p>
              </div>
            </div>
            <label className="space-y-2">
              <Label>{uiText("Cámara")}</Label>
              <Select value={zoneForm.cameraId} onValueChange={(cameraId) => setZoneForm({ ...zoneForm, cameraId })}>
                <SelectTrigger>
                  <SelectValue placeholder={uiText("Selecciona una cámara")} />
                </SelectTrigger>
                <SelectContent>
                  {currentCameras.map((camera) => (
                    <SelectItem key={camera.id} value={camera.id}>
                      {camera.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="space-y-2">
              <Label htmlFor="zone-name">{uiText("Nombre de zona")}</Label>
              <Input
                id="zone-name"
                placeholder={uiText("Ej. Mostrador A")}
                value={zoneForm.name}
                onChange={(event) => setZoneForm({ ...zoneForm, name: event.target.value })}
              />
            </label>
            <label className="space-y-2">
              <Label>{uiText("Tipo de zona")}</Label>
              <Select value={zoneForm.zoneType} onValueChange={(zoneType) => setZoneForm({ ...zoneForm, zoneType })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {zoneTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <Button
              disabled={!zoneForm.cameraId || !zoneForm.name.trim() || zoneMutation.isPending}
              onClick={() => zoneMutation.mutate()}
            >
              <Plus className="size-4" />
              {zoneMutation.isPending ? uiText("Guardando…") : "Guardar zona"}
            </Button>
          </CardContent>
        </Card>
      </div>
      </details>

      <section aria-labelledby="registered-cameras" className="space-y-4">
        <div className="flex items-center gap-2">
          <Radio className="size-4 text-brand" aria-hidden="true" />
          <h2 id="registered-cameras" className="font-semibold">{uiText("Fuentes registradas")}</h2>
        </div>
        {currentCameras.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {currentCameras.map((camera) => (
              <Card key={camera.id} level={2}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{camera.name}</p>
                      <p className="mt-1 text-sm text-text-secondary">{camera.sourceType}</p>
                    </div>
                    <Badge variant={camera.status === "ACTIVE" ? "success" : "secondary"}>{camera.status === "ACTIVE" ? uiText("Activa") : camera.status}</Badge>
                  </div>
                  <div className="rounded-2xl bg-surface-section p-3">
                    <p className="text-xs uppercase tracking-[0.24em] text-text-secondary">{uiText("Última señal")}</p>
                    <p className="mt-1 text-sm font-medium">{formatTime(camera.lastHeartbeatAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentZones
                      .filter((zone) => zone.cameraId === camera.id)
                      .map((zone) => (
                        <Badge key={zone.id} variant="secondary">
                          {zone.name}
                        </Badge>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card level={3}>
            <CardContent className="p-5 text-sm text-text-secondary">{uiText("Aún no hay cámaras configuradas en ")}{currentBranch.name}.</CardContent>
          </Card>
        )}
      </section>

      <section aria-labelledby="zones-registered" className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPinned className="size-4 text-brand" aria-hidden="true" />
          <h2 id="zones-registered" className="font-semibold">{uiText("Zonas configuradas")}</h2>
        </div>
        {currentZones.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {currentZones.map((zone) => (
              <Card key={zone.id} level={2}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{zone.name}</p>
                    <Badge variant="secondary">{zone.zoneType}</Badge>
                  </div>
                  <p className="text-sm text-text-secondary">
                    {uiText("Cámara:")}{currentCameras.find((camera) => camera.id === zone.cameraId)?.name ?? zone.cameraId}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <InlineFeedback tone="info" title={uiText("Sin zonas todavía")}>
            {uiText("Define al menos una zona para que la simulación empiece a generar productividad por área.")}</InlineFeedback>
        )}
      </section>

    </div>
  );
}
