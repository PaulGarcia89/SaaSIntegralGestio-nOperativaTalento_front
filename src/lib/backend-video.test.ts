import { afterEach, describe, expect, it, vi } from "vitest";
import { startTrainingVideo, heartbeatTrainingVideo, recordTrainingVideoEvent } from "./backend";

const identity = { assignmentId: "assignment", lessonId: "lesson", playbackSessionId: "session" };
const position = { currentTimeSeconds: 5, durationSeconds: 162 };
const event = { ...identity, ...position, eventType: "PLAY" };
afterEach(() => vi.unstubAllGlobals());

describe("video API request contracts", () => {
  it.each(["start", "heartbeat", "pause", "ended"] as const)("sends only accepted fields for %s even when passed a full player event", async (kind) => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ serverCompletionPercentage: 3 }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { setTimeout, clearTimeout, localStorage: { getItem: () => null }, sessionStorage: { getItem: () => null } });
    const heartbeat = { ...event, isPlaying: true, playbackRate: 1, clientTimestamp: "2026-09-08T17:00:00.000Z" };
    if (kind === "start") await startTrainingVideo(event);
    else if (kind === "heartbeat") await heartbeatTrainingVideo(heartbeat);
    else await recordTrainingVideoEvent(kind, event);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain(`/training/video/${kind}`);
    expect(JSON.parse(init.body)).toEqual(kind === "start" ? identity : kind === "heartbeat" ? {
      ...identity, ...position, isPlaying: true, playbackRate: 1, clientTimestamp: heartbeat.clientTimestamp,
    } : { ...identity, ...position });
  });
});
