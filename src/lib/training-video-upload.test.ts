import { describe, expect, it } from "vitest";
import { LIMITE_VIDEO_BYTES, megabytes, revisarVideo } from "./training-video-upload";

function archivo(name: string, type: string, size: number) {
  return { name, type, size } as File;
}

describe("revisión del video antes de subirlo", () => {
  it("acepta un mp4 dentro del límite", () => {
    expect(revisarVideo(archivo("clase.mp4", "video/mp4", 10 * 1024 * 1024))).toBeNull();
  });

  it("acepta un .mp4 cuyo navegador no declara tipo", () => {
    // Ocurre de verdad: hay equipos donde `file.type` llega vacío. Rechazarlo
    // sería rechazar un archivo válido por una carencia del navegador.
    expect(revisarVideo(archivo("clase.mp4", "", 1024))).toBeNull();
  });

  it("rechaza lo que no es mp4, por extensión o por tipo declarado", () => {
    expect(revisarVideo(archivo("clase.mov", "video/quicktime", 1024))).toBe("tipo");
    expect(revisarVideo(archivo("clase.mp4", "video/quicktime", 1024))).toBe("tipo");
    expect(revisarVideo(archivo("clase.MP4", "video/mp4", 1024))).toBeNull();
  });

  it("rechaza un archivo vacío antes que por tamaño", () => {
    expect(revisarVideo(archivo("clase.mp4", "video/mp4", 0))).toBe("vacio");
  });

  it("rechaza lo que supera el límite", () => {
    expect(revisarVideo(archivo("clase.mp4", "video/mp4", LIMITE_VIDEO_BYTES + 1))).toBe("tamano");
    expect(revisarVideo(archivo("clase.mp4", "video/mp4", LIMITE_VIDEO_BYTES))).toBeNull();
  });

  it("redondea a megabytes para el mensaje", () => {
    expect(megabytes(LIMITE_VIDEO_BYTES)).toBe(500);
    expect(megabytes(1024 * 1024 * 3.4)).toBe(3);
  });
});
