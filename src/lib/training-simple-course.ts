import type { TrainingCourseDesignInput } from "@/lib/contracts";

/**
 * Camino rápido para publicar un video como curso.
 *
 * El asistente completo tiene siete pasos y reparte en varias pantallas —con
 * diálogos anidados— lo que el servidor exige para que un curso sea
 * publicable. Quien solo quiere subir un video y asignarlo tiene que recorrer
 * los siete y adivinar cuáles son obligatorios.
 *
 * Lo obligatorio, en realidad, es una lista corta y fija:
 *
 * | Paso del asistente | Lo que exige el servidor |
 * |---|---|
 * | GENERAL | título, resumen, descripción y duración mayor que cero |
 * | FOUNDATION | necesidad del negocio, resultado esperado, KPI, audiencia, una competencia y un objetivo |
 * | STRUCTURE | un módulo con una lección que tenga duración y al menos un bloque |
 *
 * Este módulo traduce ocho preguntas en lenguaje llano a esa lista. No inventa
 * contenido: cada campo del servidor sale de algo que la persona escribió. Un
 * mismo texto puede alimentar dos campos —lo que se aprende es a la vez la
 * descripción del curso y el enunciado del objetivo— y eso se dice en la
 * pantalla, en vez de rellenarlo por detrás con texto fabricado.
 *
 * La duración no se pregunta: sale del propio archivo de video.
 */

export type RespuestasCursoRapido = {
  titulo: string;
  resumen: string;
  loQueAprenden: string;
  paraQuien: string;
  porQue: string;
  comoSeSabe: string;
  competenciaId: string;
  competenciaNueva: string;
  comoSeComprueba: string;
};

export const RESPUESTAS_VACIAS: RespuestasCursoRapido = {
  titulo: "",
  resumen: "",
  loQueAprenden: "",
  paraQuien: "",
  porQue: "",
  comoSeSabe: "",
  competenciaId: "",
  competenciaNueva: "",
  comoSeComprueba: "OBSERVACION",
};

export type CampoRapido = keyof RespuestasCursoRapido | "video";

export type FaltaRapida = { campo: CampoRapido; etiqueta: string; mensaje: string };

const ETIQUETAS: Record<Exclude<CampoRapido, "competenciaNueva">, string> = {
  titulo: "Nombre del curso",
  resumen: "De qué trata",
  loQueAprenden: "Qué aprenderán",
  paraQuien: "Para quiénes es",
  porQue: "Por qué hace falta",
  comoSeSabe: "Cómo sabrás que funcionó",
  competenciaId: "Competencia",
  comoSeComprueba: "Cómo lo comprobarás",
  video: "El video",
};

/**
 * Qué falta para poder crear el curso.
 *
 * Devuelve la lista completa, no el primer fallo: un formulario que corrige de
 * uno en uno obliga a enviar seis veces para enterarse de seis huecos.
 */
export function faltaParaCrear(respuestas: RespuestasCursoRapido, tieneVideo: boolean): FaltaRapida[] {
  const faltas: FaltaRapida[] = [];
  const pedir = (campo: Exclude<CampoRapido, "competenciaNueva">, vacio: boolean) => {
    if (vacio) faltas.push({ campo, etiqueta: ETIQUETAS[campo], mensaje: "Hace falta para poder publicar el curso." });
  };

  pedir("titulo", !respuestas.titulo.trim());
  pedir("resumen", !respuestas.resumen.trim());
  pedir("loQueAprenden", !respuestas.loQueAprenden.trim());
  pedir("paraQuien", !respuestas.paraQuien.trim());
  pedir("porQue", !respuestas.porQue.trim());
  pedir("comoSeSabe", !respuestas.comoSeSabe.trim());
  pedir("competenciaId", !respuestas.competenciaId.trim() && !respuestas.competenciaNueva.trim());
  pedir("comoSeComprueba", !respuestas.comoSeComprueba.trim());
  pedir("video", !tieneVideo);
  return faltas;
}

/** Código de competencia a partir de su nombre: sin acentos, en mayúsculas. */
export function codigoDeCompetencia(nombre: string) {
  const limpio = nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return limpio || "COMPETENCIA";
}

/** Minutos del curso a partir de la duración real del archivo. */
export function minutosDeVideo(segundos: number) {
  return Math.max(1, Math.ceil(segundos / 60));
}

export const METODOS_COMPROBACION = [
  { id: "OBSERVACION", etiqueta: "Observando cómo lo hace en su puesto" },
  { id: "PREGUNTAS", etiqueta: "Con preguntas al terminar el curso" },
  { id: "RESPONSABLE", etiqueta: "Con la revisión de su responsable" },
] as const;

export function metodoLegible(id: string) {
  return METODOS_COMPROBACION.find((metodo) => metodo.id === id)?.etiqueta ?? id;
}

/**
 * Traduce las respuestas al contrato de diseño del curso.
 *
 * `competenciaId` se recibe ya resuelto: si la persona escribió una
 * competencia nueva, quien llama la crea antes y pasa el identificador. Así
 * esta función se mantiene pura y comprobable.
 */
export function disenoDesdeRespuestas(respuestas: RespuestasCursoRapido, competenciaId: string): TrainingCourseDesignInput {
  const loQueAprenden = respuestas.loQueAprenden.trim();
  const comoSeSabe = respuestas.comoSeSabe.trim();
  return {
    brief: {
      businessNeed: respuestas.porQue.trim(),
      targetOutcome: loQueAprenden,
      successKpi: comoSeSabe,
      audienceDescription: respuestas.paraQuien.trim(),
    },
    competencies: [{ competencyId: competenciaId, targetLevel: "WORKING", isRequired: true, sortOrder: 0 }],
    objectives: [
      {
        competencyId: competenciaId,
        statement: loQueAprenden,
        successCriteria: comoSeSabe,
        assessmentMethod: metodoLegible(respuestas.comoSeComprueba),
        targetLevel: "WORKING",
        isRequired: true,
        sortOrder: 0,
      },
    ],
    audienceRules: [],
  };
}
