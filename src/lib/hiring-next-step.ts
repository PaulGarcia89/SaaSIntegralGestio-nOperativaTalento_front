import type { ApplicationStatusKey } from "@/lib/contracts";

/**
 * El plan de contratación de una persona: en qué paso va y qué toca hacer.
 *
 * Por qué existe
 * --------------
 * En la ficha, el texto del paso actual y el botón de la acción se calculaban
 * por separado. El texto recorría los pasos y tomaba el primero sin completar;
 * el botón era una cadena de condiciones sobre el estado que cubría RECHAZADO,
 * CONTRATADO y APROBADO, y mandaba TODO lo demás a un caso por omisión:
 * «Preparar oferta». Como la mayoría de las postulaciones no están aprobadas,
 * la pantalla decía «Revisa el perfil y programa la entrevista» encima de un
 * botón que ofrecía preparar la oferta —el penúltimo paso del proceso.
 *
 * Aquí la acción es UNA PROPIEDAD DEL PASO. No se puede volver a desalinear:
 * quien dibuja el texto y quien dibuja el botón leen el mismo objeto, y una
 * prueba comprueba que la acción devuelta pertenece siempre al paso actual.
 *
 * Qué NO hace
 * -----------
 * No decide reglas de negocio ni valida transiciones: eso sigue en el backend.
 * Solo ordena lo que la pantalla ya sabía, y se queda callado —sin acción—
 * cuando la persona no tiene permiso para dar el paso.
 */

export type PasoId = "postulacion" | "evaluacion" | "decision" | "contratacion";

/** «encurso» es un estado honesto: empezó y no hay dato de que terminara. */
export type EstadoPaso = "hecho" | "encurso" | "pendiente" | "atencion";

export type AccionContratacion =
  | { tipo: "ir"; etiqueta: string; destino: string }
  | { tipo: "hacer"; etiqueta: string; operacion: "agendar-entrevista" | "crear-contratacion" | "enviar-documentos" };

/** Un requisito concreto del paso, con su cumplimiento comprobable. */
export type RequisitoPaso = { texto: string; cumplido: boolean };

export type PasoContratacion = {
  id: PasoId;
  titulo: string;
  estado: EstadoPaso;
  detalle: string;
  accion: AccionContratacion | null;
  /** Lo que este paso exige para darse por terminado. */
  requisitos: RequisitoPaso[];
  /**
   * `true` cuando un paso ANTERIOR sigue sin cumplirse. Un paso bloqueado se
   * puede mirar —para saber qué llegará— pero no se puede ejecutar: su acción
   * es `null` y la pantalla enseña qué falta antes.
   */
  bloqueado: boolean;
};

export type EntradaContratacion = {
  status: ApplicationStatusKey;
  entrevistaAgendada: boolean;
  entrevistaCompletada: boolean;
  oferta: "ninguna" | "enviada" | "aceptada";
  /** Identificador del caso de contratación abierto, si ya existe. */
  contratacionId: string | null;
  documentos: "sin-enviar" | "enviados" | "completos";
  puedeGestionar: boolean;
  puedeCrearContratacion: boolean;
  puedeEnviarDocumentos: boolean;
};

export function planDeContratacion(entrada: EntradaContratacion): {
  pasos: PasoContratacion[];
  actual: number;
  accion: AccionContratacion | null;
} {
  const aprobado = entrada.status === "APPROVED" || entrada.status === "HIRED";
  const contratado = entrada.status === "HIRED";
  const fuera = entrada.status === "REJECTED" || entrada.status === "WITHDRAWN";
  const evaluado = aprobado || entrada.entrevistaCompletada;

  const pasos: PasoContratacion[] = [
    {
      id: "postulacion",
      titulo: "Postulación",
      estado: "hecho",
      detalle: "Recibida, con el perfil disponible.",
      accion: null,
      requisitos: [],
      bloqueado: false,
    },
    {
      id: "evaluacion",
      titulo: "Evaluación",
      estado: evaluado ? "hecho" : entrada.entrevistaAgendada ? "encurso" : "pendiente",
      detalle: evaluado
        ? "La entrevista ya se hizo."
        : entrada.entrevistaAgendada
          ? "La entrevista está agendada: al terminarla, registra el resultado."
          : "Revisa el perfil y acuerda la entrevista.",
      /*
       * La acción del paso es AGENDAR, no «ir a la sección de entrevistas».
       *
       * Cuando se miraba este mismo paso, el botón de la cabecera llevaba al
       * panel que ya se estaba viendo —no hacía nada— y la acción de verdad
       * vivía en un segundo botón, dentro de la tarjeta de abajo. Dos botones
       * a la vista, uno inerte. Ahora la cabecera abre el agendado y la
       * tarjeta se queda con la lista.
       */
      accion: evaluado || fuera || !entrada.puedeGestionar
        ? null
        : entrada.entrevistaAgendada
          ? { tipo: "ir", etiqueta: "Registrar el resultado", destino: "#evaluar" }
          : { tipo: "hacer", etiqueta: "Programar entrevista", operacion: "agendar-entrevista" },
      requisitos: [
        { texto: "Una entrevista agendada", cumplido: entrada.entrevistaAgendada || entrada.entrevistaCompletada || aprobado },
        { texto: "La entrevista realizada", cumplido: evaluado },
      ],
      bloqueado: false,
    },
    {
      id: "decision",
      titulo: "Decisión",
      estado: aprobado ? "hecho" : fuera ? "atencion" : "pendiente",
      detalle: aprobado ? "Aprobada." : fuera ? "El proceso se cerró sin contratar." : "Registra si continúa o no.",
      accion: aprobado || !entrada.puedeGestionar
        ? null
        : fuera
          ? { tipo: "ir", etiqueta: "Ver el expediente", destino: "#revisar" }
          : { tipo: "ir", etiqueta: "Registrar la decisión", destino: "#decidir" },
      requisitos: [{ texto: "La decisión registrada", cumplido: aprobado || fuera }],
      bloqueado: false,
    },
    /*
     * Oferta, expediente, documentos e incorporación eran CUATRO pasos en esta
     * cadena, y los cuatro ocurren de verdad en el módulo de contratación, con
     * sus propios nombres. Siete casillas para un proceso que esta pantalla
     * solo acompaña: aquí van como un paso con sus requisitos a la vista, y el
     * detalle vive donde se hace el trabajo.
     */
    {
      id: "contratacion",
      titulo: "Contratación",
      estado: contratado && entrada.documentos === "completos"
        ? "hecho"
        : contratado || entrada.contratacionId
          ? "encurso"
          : entrada.oferta === "enviada"
            ? "atencion"
            : "pendiente",
      detalle: contratado && entrada.documentos === "completos"
        ? "Formalizada y con los documentos firmados."
        : contratado
          ? entrada.documentos === "enviados"
            ? "Documentos enviados: falta la firma."
            : "Falta enviar los documentos para firmar."
          : entrada.contratacionId
            ? "El expediente de contratación está abierto."
            : entrada.oferta === "aceptada"
              ? "Abre el expediente de contratación."
              : entrada.oferta === "enviada"
                ? "La oferta está enviada: falta la respuesta."
                : "Prepara la oferta para la persona.",
      accion: !aprobado
        ? null
        : contratado && entrada.documentos === "completos"
          ? { tipo: "ir", etiqueta: "Abrir la incorporación", destino: "/onboarding/documents" }
          : contratado && entrada.documentos === "enviados"
            ? { tipo: "ir", etiqueta: "Ver el envío", destino: "#mensajes" }
            : contratado && entrada.puedeEnviarDocumentos
              ? { tipo: "hacer", etiqueta: "Enviar los documentos", operacion: "enviar-documentos" }
              : entrada.contratacionId
                ? { tipo: "ir", etiqueta: "Abrir la contratación", destino: `/hiring/${entrada.contratacionId}` }
                : entrada.oferta === "aceptada" && entrada.puedeCrearContratacion
                  ? { tipo: "hacer", etiqueta: "Enviar a contratación", operacion: "crear-contratacion" }
                  : entrada.puedeGestionar
                    ? { tipo: "ir", etiqueta: entrada.oferta === "enviada" ? "Ver la oferta" : "Preparar la oferta", destino: "#oferta" }
                    : null,
      requisitos: [
        { texto: "La oferta aceptada", cumplido: entrada.oferta === "aceptada" || contratado },
        { texto: "El expediente abierto", cumplido: Boolean(entrada.contratacionId) || contratado },
        { texto: "Los documentos firmados", cumplido: entrada.documentos === "completos" },
      ],
      bloqueado: false,
    },
  ];

  /*
   * Un proceso cerrado se detiene en la decisión: seguir señalando «falta la
   * entrevista» a alguien que ya no continúa es pedir un paso que nadie va a
   * dar.
   */
  const primeroSinTerminar = pasos.findIndex((paso) => paso.estado !== "hecho");
  const actual = fuera
    ? pasos.findIndex((paso) => paso.id === "decision")
    : primeroSinTerminar === -1
      ? pasos.length - 1
      : primeroSinTerminar;
  /*
   * Nadie se salta un paso.
   *
   * Antes se podía pulsar la acción de cualquier etapa: «Preparar la oferta»
   * estaba disponible sin haber entrevistado ni decidido nada, y el orden del
   * proceso lo sostenía la buena voluntad de quien lo usaba.
   *
   * Un paso queda BLOQUEADO cuando otro anterior tiene requisitos sin cumplir.
   * Se puede abrir para ver qué traerá —mirar no es avanzar— pero su acción
   * desaparece. El paso que toca nunca se bloquea a sí mismo: es precisamente
   * el que hay que poder hacer.
   */
  let pendienteAntes = false;
  pasos.forEach((paso, index) => {
    paso.bloqueado = index > actual && pendienteAntes;
    if (paso.bloqueado) paso.accion = null;
    if (paso.requisitos.some((requisito) => !requisito.cumplido)) pendienteAntes = true;
  });

  return { pasos, actual, accion: pasos[actual].accion };
}
