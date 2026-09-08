import { afterEach, describe, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { createPlaybackSessionId } from "./playback-session-id";

afterEach(() => vi.unstubAllGlobals());
describe("playback session IDs", () => {
  it("uses native UUIDs when available", () => {
    const randomUUID = vi.fn(() => "d5416310-4495-4af4-b390-9cf8d4912bc7");
    vi.stubGlobal("crypto", { randomUUID });
    expect(createPlaybackSessionId()).toBe("d5416310-4495-4af4-b390-9cf8d4912bc7");
    expect(randomUUID).toHaveBeenCalledOnce();
  });
  it("works on HTTP LAN origins without randomUUID and produces distinct v4 UUIDs", () => {
    vi.stubGlobal("crypto", { getRandomValues: webcrypto.getRandomValues.bind(webcrypto) });
    const ids = Array.from({ length: 100 }, () => createPlaybackSessionId());
    expect(new Set(ids).size).toBe(100);
    for (const id of ids) expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
  it("sets the version and variant bits even at the random-byte extremes", () => {
    for (const value of [0, 255]) {
      vi.stubGlobal("crypto", { getRandomValues: (bytes: Uint8Array) => bytes.fill(value) });
      expect(createPlaybackSessionId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    }
  });
});
