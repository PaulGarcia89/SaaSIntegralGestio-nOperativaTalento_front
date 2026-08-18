import { describe, expect, it } from "vitest";
import {
  createDemoSession,
  createNextDemoEvent,
  summarizeDemoSession,
} from "./productivity-demo";
import type { ProductivityEventDto } from "./backend";

const persistedEvent: ProductivityEventDto = {
  id: "event-1",
  cameraId: "camera-1",
  cameraName: "Recepcion",
  zoneId: "zone-1",
  zoneName: "Mostrador",
  eventType: "TASK_DETECTED",
  startedAt: "2026-08-18T14:00:00.000Z",
  endedAt: "2026-08-18T14:01:00.000Z",
  durationSeconds: 60,
  confidence: 0.94,
  source: "DEMO",
  metadata: {
    label: "Flujo eficiente",
    productivityScore: 92,
    peopleDetected: 4,
    activeSeconds: 60,
    idleSeconds: 6,
    note: "Evento persistido",
  },
  createdAt: "2026-08-18T14:01:00.000Z",
};

describe("productivity demo persistence mapping", () => {
  it("builds the demo only from active persisted cameras and their zones", () => {
    const session = createDemoSession({
      cameras: [
        { id: "camera-1", name: "Recepcion", sourceType: "RTSP", status: "ONLINE" },
        { id: "camera-2", name: "Bodega", sourceType: "RTSP", status: "DISABLED" },
      ],
      zones: [
        { id: "zone-1", cameraId: "camera-1", name: "Mostrador", zoneType: "WORKSTATION" },
        { id: "zone-2", cameraId: "camera-2", name: "Carga", zoneType: "WORKSTATION" },
      ],
      events: [persistedEvent],
    });

    expect(session.cameras.map((camera) => camera.id)).toEqual(["camera-1"]);
    expect(session.zones.map((zone) => zone.id)).toEqual(["zone-1"]);
    expect(session.events[0]).toMatchObject({
      id: "event-1",
      productivityScore: 92,
      peopleDetected: 4,
      activeSeconds: 60,
    });
  });

  it("creates an idempotent API payload tied to a persisted camera and zone", () => {
    const session = createDemoSession({
      cameras: [{ id: "camera-1", name: "Recepcion", sourceType: "RTSP", status: "ACTIVE" }],
      zones: [{ id: "zone-1", cameraId: "camera-1", name: "Mostrador", zoneType: "WORKSTATION" }],
    });

    const event = createNextDemoEvent(session);

    expect(event).toMatchObject({ cameraId: "camera-1", zoneId: "zone-1" });
    expect(event?.idempotencyKey).toMatch(/^demo-/);
    expect(new Date(event?.endedAt ?? 0).getTime()).toBeGreaterThan(
      new Date(event?.startedAt ?? 0).getTime(),
    );
  });

  it("summarizes values returned by the persistence API", () => {
    const summary = summarizeDemoSession(
      createDemoSession({
        cameras: [{ id: "camera-1", name: "Recepcion", sourceType: "RTSP", status: "ONLINE" }],
        zones: [{ id: "zone-1", cameraId: "camera-1", name: "Mostrador", zoneType: "WORKSTATION" }],
        events: [persistedEvent],
      }),
    );

    expect(summary).toMatchObject({
      totalEvents: 1,
      activeSeconds: 60,
      idleSeconds: 6,
      averageProductivity: 92,
      activeCameras: 1,
    });
    expect(summary.byZone[0]).toMatchObject({ events: 1, productivity: 92 });
  });
});
