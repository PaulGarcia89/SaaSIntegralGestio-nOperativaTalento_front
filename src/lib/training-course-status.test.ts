import { describe, expect, it } from "vitest";
import { ESTADOS_CONTENIDO_EDITABLE, contenidoEsEditable, salidaDelBloqueo } from "./training-course-status";

describe("estados editables de un curso", () => {
  it("coincide exactamente con la lista del backend", () => {
    // `editableStatuses` en training-admin.service.ts. Si allí cambia, esta
    // prueba tiene que fallar: una pantalla que crea poder editar algo que el
    // servidor rechaza es peor que una que no deja editar nada.
    expect([...ESTADOS_CONTENIDO_EDITABLE].sort()).toEqual(["APPROVED", "DRAFT", "IN_REVIEW", "PAUSED"]);
  });

  it("bloquea publicado, programado, archivado y retirado", () => {
    for (const status of ["PUBLISHED", "SCHEDULED", "ARCHIVED", "RETIRED"] as const) {
      expect(contenidoEsEditable(status)).toBe(false);
    }
    for (const status of ESTADOS_CONTENIDO_EDITABLE) {
      expect(contenidoEsEditable(status)).toBe(true);
    }
  });

  it("no propone salida cuando el contenido ya es editable", () => {
    for (const status of ESTADOS_CONTENIDO_EDITABLE) {
      expect(salidaDelBloqueo(status)).toBeNull();
    }
  });

  it("propone pausar lo publicado y devolver a borrador lo programado", () => {
    expect(salidaDelBloqueo("PUBLISHED")).toEqual({ tipo: "transicion", accion: "pause" });
    expect(salidaDelBloqueo("SCHEDULED")).toEqual({ tipo: "transicion", accion: "return-draft" });
  });

  it("admite que lo archivado y lo retirado no tienen vuelta", () => {
    expect(salidaDelBloqueo("ARCHIVED")).toEqual({ tipo: "sin-salida" });
    expect(salidaDelBloqueo("RETIRED")).toEqual({ tipo: "sin-salida" });
  });
});
