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
  zoneId: string;
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

const STORAGE_KEY = "talentos-productivity-demo";

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function fallbackCamera(branchName?: string): ProductivityDemoCamera {
  return {
    id: "demo-camera-1",
    name: branchName ? `${branchName} - recepción` : "Recepción principal",
    sourceType: "RTSP",
    status: "ACTIVE",
    lastHeartbeatAt: new Date().toISOString(),
  };
}

function fallbackZone(cameraId: string): ProductivityDemoZone {
  return {
    id: "demo-zone-1",
    cameraId,
    name: "Mostrador A",
    zoneType: "WORKSTATION",
  };
}

export function createDemoSession(input: {
  branchName?: string;
  cameras?: ProductivityDemoCamera[];
  zones?: ProductivityDemoZone[];
}): ProductivityDemoSession {
  const baseCamera = input.cameras?.[0] ?? fallbackCamera(input.branchName);
  const baseZone = input.zones?.find((zone) => zone.cameraId === baseCamera.id) ?? fallbackZone(baseCamera.id);

  return {
    running: true,
    lastTickAt: new Date().toISOString(),
    frame: 1,
    cameras: input.cameras?.length ? input.cameras : [baseCamera],
    zones: input.zones?.length ? input.zones : [baseZone],
    events: [
      {
        id: makeId("event"),
        occurredAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        cameraId: baseCamera.id,
        cameraName: baseCamera.name,
        zoneId: baseZone.id,
        zoneName: baseZone.name,
        label: "Inicio de grabación",
        productivityScore: 91,
        peopleDetected: 4,
        activeSeconds: 820,
        idleSeconds: 120,
        note: "La cámara quedó conectada y empezó a generar telemetría demo.",
      },
    ],
  };
}

export function loadDemoSession(input: {
  branchName?: string;
  cameras?: ProductivityDemoCamera[];
  zones?: ProductivityDemoZone[];
}): ProductivityDemoSession {
  if (typeof window === "undefined") {
    return createDemoSession(input);
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ProductivityDemoSession;
      if (parsed?.cameras?.length && parsed?.zones?.length) {
        return parsed;
      }
    }
  } catch {
    // Ignore localStorage errors and fall back to a fresh session.
  }

  const session = createDemoSession(input);
  saveDemoSession(session);
  return session;
}

export function saveDemoSession(session: ProductivityDemoSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function resetDemoSession(input: {
  branchName?: string;
  cameras?: ProductivityDemoCamera[];
  zones?: ProductivityDemoZone[];
}): ProductivityDemoSession {
  const session = createDemoSession(input);
  saveDemoSession(session);
  return session;
}

export function toggleDemoRunning(session: ProductivityDemoSession) {
  const next = {
    ...session,
    running: !session.running,
    lastTickAt: new Date().toISOString(),
  };
  saveDemoSession(next);
  return next;
}

export function advanceDemoSession(session: ProductivityDemoSession): ProductivityDemoSession {
  if (!session.running) {
    return session;
  }

  const camera = session.cameras[session.frame % session.cameras.length] ?? session.cameras[0];
  const zone = session.zones.filter((item) => item.cameraId === camera.id)[session.frame % Math.max(1, session.zones.filter((item) => item.cameraId === camera.id).length)] ?? session.zones[0];
  const productivityScore = Math.max(64, Math.min(99, 89 + ((session.frame % 7) - 3) + Math.floor(Math.random() * 4)));
  const peopleDetected = 2 + ((session.frame + 1) % 5);
  const activeSeconds = 780 + session.frame * 54;
  const idleSeconds = Math.max(80, 140 - session.frame * 5);

  const event: ProductivityDemoEvent = {
    id: makeId("event"),
    occurredAt: new Date().toISOString(),
    cameraId: camera.id,
    cameraName: camera.name,
    zoneId: zone.id,
    zoneName: zone.name,
    label: productivityScore >= 90 ? "Flujo eficiente" : productivityScore >= 82 ? "Actividad estable" : "Requiere revisión",
    productivityScore,
    peopleDetected,
    activeSeconds,
    idleSeconds,
    note: productivityScore >= 90
      ? "La escena está mostrando una operación ágil con menos interrupciones."
      : "El demo refleja variación normal en ocupación y uso del espacio.",
  };

  const next = {
    ...session,
    frame: session.frame + 1,
    lastTickAt: event.occurredAt,
    events: [event, ...session.events].slice(0, 12),
    cameras: session.cameras.map((item) => item.id === camera.id ? { ...item, lastHeartbeatAt: event.occurredAt, status: "ACTIVE" } : item),
  };

  saveDemoSession(next);
  return next;
}

export function summarizeDemoSession(session: ProductivityDemoSession) {
  const totalEvents = session.events.length;
  const activeSeconds = session.events.reduce((sum, event) => sum + event.activeSeconds, 0);
  const idleSeconds = session.events.reduce((sum, event) => sum + event.idleSeconds, 0);
  const averageProductivity = session.events.length
    ? session.events.reduce((sum, event) => sum + event.productivityScore, 0) / session.events.length
    : 0;

  const byZone = session.zones.map((zone) => {
    const zoneEvents = session.events.filter((event) => event.zoneId === zone.id);
    const zoneActiveSeconds = zoneEvents.reduce((sum, event) => sum + event.activeSeconds, 0);
    const zoneIdleSeconds = zoneEvents.reduce((sum, event) => sum + event.idleSeconds, 0);
    const confidence = Math.max(72, Math.min(99, Math.round(86 + zoneEvents.length * 2.5)));

    return {
      zone,
      events: zoneEvents.length,
      activeSeconds: zoneActiveSeconds,
      idleSeconds: zoneIdleSeconds,
      confidence,
      productivity: zoneEvents.length
        ? Math.round(zoneEvents.reduce((sum, event) => sum + event.productivityScore, 0) / zoneEvents.length)
        : 0,
      lastEvent: zoneEvents[0],
    };
  });

  const alerts = session.events.filter((event) => event.productivityScore < 82).length;
  const activeCameras = session.cameras.filter((camera) => camera.status === "ACTIVE").length;

  return {
    totalEvents,
    activeSeconds,
    idleSeconds,
    averageProductivity,
    alerts,
    activeCameras,
    byZone,
    latestEvent: session.events[0] ?? null,
  };
}
