import { describe, expect, it } from "vitest";
import {
  RESPUESTAS_VACIAS,
  codigoDeCompetencia,
  disenoDesdeRespuestas,
  faltaParaCrear,
  metodoLegible,
  minutosDeVideo,
} from "./training-simple-course";

const completas = {
  titulo: "Uso seguro del montacargas",
  resumen: "Cómo operar el montacargas sin accidentes.",
  loQueAprenden: "Revisar el equipo antes de usarlo y circular sin poner en riesgo a nadie.",
  paraQuien: "Personal de bodega y despacho",
  porQue: "Hubo dos incidentes en el último trimestre.",
  comoSeSabe: "Ningún incidente en los próximos seis meses.",
  competenciaId: "comp-1",
  competenciaNueva: "",
  comoSeComprueba: "OBSERVACION",
};

describe("faltaParaCrear", () => {
  it("señala todos los huecos de una vez, no el primero", () => {
    const faltas = faltaParaCrear(RESPUESTAS_VACIAS, false);
    expect(faltas.map((falta) => falta.campo)).toEqual([
      "titulo",
      "resumen",
      "loQueAprenden",
      "paraQuien",
      "porQue",
      "comoSeSabe",
      "competenciaId",
      "video",
    ]);
  });

  it("no falta nada cuando está todo y hay video", () => {
    expect(faltaParaCrear(completas, true)).toEqual([]);
  });

  it("pide el video aunque el formulario esté completo", () => {
    expect(faltaParaCrear(completas, false).map((falta) => falta.campo)).toEqual(["video"]);
  });

  it("una competencia nueva escrita a mano vale igual que una elegida", () => {
    const respuestas = { ...completas, competenciaId: "", competenciaNueva: "Seguridad operativa" };
    expect(faltaParaCrear(respuestas, true)).toEqual([]);
  });

  it("el espacio en blanco no cuenta como respuesta", () => {
    expect(faltaParaCrear({ ...completas, titulo: "   " }, true).map((falta) => falta.campo)).toEqual(["titulo"]);
  });
});

describe("codigoDeCompetencia", () => {
  it("quita acentos y separa con guiones bajos", () => {
    expect(codigoDeCompetencia("Operación segura")).toBe("OPERACION_SEGURA");
  });

  it("no deja guiones bajos sueltos en los extremos", () => {
    expect(codigoDeCompetencia("  ¡Seguridad!  ")).toBe("SEGURIDAD");
  });

  it("tiene respaldo cuando el nombre no deja nada utilizable", () => {
    expect(codigoDeCompetencia("¿?¡!")).toBe("COMPETENCIA");
  });
});

describe("minutosDeVideo", () => {
  it("redondea hacia arriba", () => {
    expect(minutosDeVideo(61)).toBe(2);
  });

  it("un video muy corto sigue durando un minuto, nunca cero", () => {
    // Cero minutos deja el curso sin cumplir el paso de información general.
    expect(minutosDeVideo(4)).toBe(1);
  });
});

describe("disenoDesdeRespuestas", () => {
  it("cada campo del servidor sale de algo que la persona escribió", () => {
    const diseno = disenoDesdeRespuestas(completas, "comp-1");
    expect(diseno.brief.businessNeed).toBe(completas.porQue);
    expect(diseno.brief.targetOutcome).toBe(completas.loQueAprenden);
    expect(diseno.brief.successKpi).toBe(completas.comoSeSabe);
    expect(diseno.brief.audienceDescription).toBe(completas.paraQuien);
  });

  it("deja una competencia y un objetivo, que es lo mínimo que el servidor exige", () => {
    const diseno = disenoDesdeRespuestas(completas, "comp-1");
    expect(diseno.competencies).toHaveLength(1);
    expect(diseno.competencies[0].competencyId).toBe("comp-1");
    expect(diseno.objectives).toHaveLength(1);
    expect(diseno.objectives[0].statement).toBe(completas.loQueAprenden);
    expect(diseno.objectives[0].assessmentMethod).toBe(metodoLegible("OBSERVACION"));
  });

  it("recorta los espacios antes de enviarlos", () => {
    const diseno = disenoDesdeRespuestas({ ...completas, porQue: "  Hubo incidentes.  " }, "comp-1");
    expect(diseno.brief.businessNeed).toBe("Hubo incidentes.");
  });
});
