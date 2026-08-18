import type { ProductivityEventDto } from "./backend";

export type ProductivityDemoCamera = {
  id: string;
  name: string;
  sourceType: string;
  status: string;
  lastHeartbeatAt?: string;
};

export type ProductivityDemoZone = {
  id: string;
  cameraId: string;
  name: string;
  zoneType: string;
};

export type ProductivityDemoEvent = {
  id: string;
  occurredAt: string;
  cameraId: string;
  cameraName: string;
  zoneId: string | null;
  zoneName: string;
  label: string;
  productivityScore: number;
  peopleDetected: number;
  activeSeconds: number;
  idleSeconds: number;
  note: string;
};

export type ProductivityDemoSession = {
  running: boolean;
  lastTickAt: string | null;
  frame: number;
  cameras: ProductivityDemoCamera[];
  zones: ProductivityDemoZone[];
  events: ProductivityDemoEvent[];
};

function numberMetadata(metadata: Record<string, unknown> | null | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function stringMetadata(
  metadata: Record<string, unknown> | null | undefined,
  key: string,
  fallback: string,
) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function mapEvent(event: ProductivityEventDto): ProductivityDemoEvent {
  return {
    id: event.id,
    occurredAt: event.startedAt,
    cameraId: event.cameraId,
    cameraName: event.cameraName ?? "Cámara registrada",
    zoneId: event.zoneId ?? null,
    zoneName: event.zoneName ?? "Sin zona configurada",
    label: stringMetadata(event.metadata, "label", event.eventType),
    productivityScore: numberMetadata(event.metadata, "productivityScore"),
    peopleDetected: numberMetadata(event.metadata, "peopleDetected"),
    activeSeconds: event.durationSeconds ?? numberMetadata(event.metadata, "activeSeconds"),
    idleSeconds: numberMetadata(event.metadata, "idleSeconds"),
    note: stringMetadata(
      event.metadata,
      "note",
      "Evento almacenado por el servicio de productividad.",
    ),
  };
}

export function createDemoSession(input: {
  cameras?: ProductivityDemoCamera[];
  zones?: ProductivityDemoZone[];
  events?: ProductivityEventDto[];
  running?: boolean;
  frame?: number;
}): ProductivityDemoSession {
  const events = (input.events ?? []).map(mapEvent);
  const activeCameras = (input.cameras ?? []).filter((camera) =>
    ["ACTIVE", "ONLINE"].includes(camera.status),
  );
  const activeCameraIds = new Set(activeCameras.map((camera) => camera.id));
  return {
    running: input.running ?? true,
    lastTickAt: events[0]?.occurredAt ?? null,
    frame: input.frame ?? events.length,
    cameras: activeCameras,
    zones: (input.zones ?? []).filter((zone) => activeCameraIds.has(zone.cameraId)),
    events,
  };
}

function makeIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `demo-${crypto.randomUUID()}`;
  }
  return `demo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createNextDemoEvent(session: ProductivityDemoSession) {
  const camera = session.cameras[session.frame % Math.max(1, session.cameras.length)];
  if (!camera) return null;

  const cameraZones = session.zones.filter((zone) => zone.cameraId === camera.id);
  const zone = cameraZones[session.frame % Math.max(1, cameraZones.length)];
  const productivityScore = Math.max(
    64,
    Math.min(99, 88 + ((session.frame % 7) - 3) + Math.floor(Math.random() * 4)),
  );
  const peopleDetected = 2 + ((session.frame + 1) % 5);
  const activeSeconds = 45 + (session.frame % 5) * 12;
  const idleSeconds = productivityScore < 82 ? 18 : 5 + (session.frame % 4) * 2;
  const startedAt = new Date();
  const endedAt = new Date(startedAt.getTime() + activeSeconds * 1000);

  return {
    cameraId: camera.id,
    ...(zone ? { zoneId: zone.id } : {}),
    eventType: session.frame % 4 === 3 ? "ACTIVITY_STOPPED" : "TASK_DETECTED",
    startedAt: startedAt.toISOString(),
    endedAt: endedAt.toISOString(),
    confidence: Math.min(0.99, 0.86 + (session.frame % 8) / 100),
    idempotencyKey: makeIdempotencyKey(),
    metadata: {
      label:
        productivityScore >= 90
          ? "Flujo eficiente"
          : productivityScore >= 82
            ? "Actividad estable"
            : "Requiere revisión",
      productivityScore,
      peopleDetected,
      activeSeconds,
      idleSeconds,
      note:
        productivityScore >= 90
          ? "La escena está mostrando una operación ágil con menos interrupciones."
          : "El demo refleja variación normal en ocupación y uso del espacio.",
    },
  };
}

export function summarizeDemoSession(session: ProductivityDemoSession) {
  const totalEvents = session.events.length;
  const activeSeconds = session.events.reduce((sum, event) => sum + event.activeSeconds, 0);
  const idleSeconds = session.events.reduce((sum, event) => sum + event.idleSeconds, 0);
  const averageProductivity = session.events.length
    ? session.events.reduce((sum, event) => sum + event.productivityScore, 0) /
      session.events.length
    : 0;

  const byZone = session.zones.map((zone) => {
    const zoneEvents = session.events.filter((event) => event.zoneId === zone.id);
    return {
      zone,
      events: zoneEvents.length,
      activeSeconds: zoneEvents.reduce((sum, event) => sum + event.activeSeconds, 0),
      idleSeconds: zoneEvents.reduce((sum, event) => sum + event.idleSeconds, 0),
      confidence: zoneEvents.length
        ? Math.max(72, Math.min(99, Math.round(86 + zoneEvents.length * 2.5)))
        : 0,
      productivity: zoneEvents.length
        ? Math.round(
            zoneEvents.reduce((sum, event) => sum + event.productivityScore, 0) /
              zoneEvents.length,
          )
        : 0,
      lastEvent: zoneEvents[0],
    };
  });

  return {
    totalEvents,
    activeSeconds,
    idleSeconds,
    averageProductivity,
    alerts: session.events.filter((event) => event.productivityScore < 82).length,
    activeCameras: session.cameras.filter((camera) =>
      ["ACTIVE", "ONLINE"].includes(camera.status),
    ).length,
    byZone,
    latestEvent: session.events[0] ?? null,
  };
}
