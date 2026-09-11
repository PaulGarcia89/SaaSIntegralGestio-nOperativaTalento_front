/**
 * Lo que la persona respondió al postularse, en forma legible.
 *
 * El formulario público pide bastante más que nombre y correo: cinco preguntas
 * de filtro, el último empleo, qué tipo de trabajo busca, hasta tres
 * referencias y una declaración firmada. Todo eso viaja en `dynamicResponses`
 * dentro de la postulación… y no se dibujaba en la ficha. Quien revisaba a un
 * candidato veía correo, teléfono y ciudad, y para saber si dijo que puede
 * trabajar legalmente tenía que abrir la ficha avanzada, donde aparecía como
 * `authorizedToWorkInUS` junto a `reference2Phone`: los nombres internos del
 * programa, sin agrupar y sin orden.
 *
 * Este módulo traduce esas claves a preguntas en español, las agrupa como
 * estaban en el formulario y descarta lo vacío. Lo que no reconoce —preguntas
 * propias de una vacante— no se pierde: cae en «Otras respuestas» con la clave
 * humanizada, porque callar un dato que la persona sí escribió es peor que
 * enseñarlo con un nombre imperfecto.
 */

/**
 * `telefono` marca las respuestas que son un número para llamar. Quien revisa
 * referencias suele hacerlo desde el teléfono: que el número se pueda pulsar
 * ahorra copiarlo a mano, que es donde se equivoca uno de cada varios dígitos.
 */
import type { VacancyApplicationFormSchema } from "@/lib/contracts";

export type RespuestaLegible = { clave: string; etiqueta: string; valor: string; detalle?: string; telefono?: string };
export type GrupoRespuestas = { id: string; titulo: string; respuestas: RespuestaLegible[] };

const PREGUNTAS_RAPIDAS: Array<{ clave: string; etiqueta: string; explicacion?: string }> = [
  { clave: "is18OrOlder", etiqueta: "¿Tiene 18 años o más?" },
  { clave: "authorizedToWorkInUS", etiqueta: "¿Puede trabajar legalmente en Estados Unidos?" },
  { clave: "workedForCompany", etiqueta: "¿Trabajó antes en esta empresa?", explicacion: "workedForCompanyExplanation" },
  { clave: "familyWorksForCompany", etiqueta: "¿Tiene familiares trabajando aquí?", explicacion: "familyWorksForCompanyExplanation" },
  { clave: "felonyConviction", etiqueta: "¿Ha sido condenado por un delito grave?", explicacion: "felonyConvictionExplanation" },
];

const BUSQUEDA: Array<{ clave: string; etiqueta: string }> = [
  { clave: "employmentPreference", etiqueta: "Puesto preferido" },
  { clave: "shiftPreference", etiqueta: "Turno preferido" },
  { clave: "employmentType", etiqueta: "Tipo de jornada" },
  { clave: "desiredHourlyWage", etiqueta: "Salario deseado por hora" },
];

const ULTIMO_EMPLEO: Array<{ clave: string; etiqueta: string }> = [
  { clave: "previousEmployerCompany", etiqueta: "Empresa" },
  { clave: "previousEmployerPosition", etiqueta: "Puesto" },
  { clave: "previousEmployerAddress", etiqueta: "Dirección" },
  { clave: "previousEmployerLocation", etiqueta: "Ciudad, estado y código postal" },
  { clave: "previousEmployerStartDate", etiqueta: "Fecha de inicio" },
  { clave: "previousEmployerEndDate", etiqueta: "Fecha de salida" },
  { clave: "previousEmployerEndingSalary", etiqueta: "Salario final" },
  { clave: "previousEmployerSupervisor", etiqueta: "Nombre del supervisor" },
  { clave: "previousEmployerPhone", etiqueta: "Teléfono del supervisor" },
  { clave: "previousEmployerLeavingReason", etiqueta: "Motivo de salida" },
  { clave: "previousEmployerMayContactSupervisor", etiqueta: "¿Podemos contactar a ese supervisor?" },
];

/*
 * Datos personales.
 *
 * El formulario público dejó de pedirlos —dirección, fecha de nacimiento y
 * contacto de emergencia se piden en la etapa de Documentos de la contratación,
 * para no acumular datos sensibles de personas que quizá nunca sean
 * contratadas—, pero el servidor los sigue aceptando y hay postulaciones
 * antiguas que los traen. Si vienen, se enseñan agrupados y con su nombre; si
 * no, esta sección simplemente no aparece.
 */
const PERSONALES: Array<{ clave: string; etiqueta: string }> = [
  { clave: "dateOfBirth", etiqueta: "Fecha de nacimiento" },
  { clave: "address", etiqueta: "Dirección" },
  { clave: "apartmentNumber", etiqueta: "Apartamento" },
  { clave: "state", etiqueta: "Estado" },
  { clave: "zipCode", etiqueta: "Código postal" },
];

/*
 * El número de seguridad social NO se enseña, venga como venga.
 *
 * El servidor ya lo descarta al postular, pero un expediente antiguo podría
 * traerlo y habría caído en «Otras respuestas» —el cajón de lo desconocido— a
 * la vista de cualquiera que abra la ficha. Una lista de lo que nunca se pinta
 * es más barata que confiar en que nadie lo mande.
 */
const NUNCA_SE_ENSENA = /social.?security|\bssn\b|seguro.?social|numero.?de.?seguridad/i;

const DECLARACION: Array<{ clave: string; etiqueta: string }> = [
  { clave: "signatureName", etiqueta: "Firmó como" },
  { clave: "applicationDeclaration", etiqueta: "Aceptó la declaración" },
];

const CLAVES_DE_REFERENCIA = [1, 2, 3].flatMap((numero) => [
  `reference${numero}Name`,
  `reference${numero}Relationship`,
  `reference${numero}Phone`,
]);

/** Texto de un valor suelto. Devuelve cadena vacía cuando no hay nada que enseñar. */
export function textoDeRespuesta(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  if (Array.isArray(valor)) return valor.map((parte) => textoDeRespuesta(parte)).filter(Boolean).join(", ");
  if (typeof valor === "object") return "";
  return String(valor).trim();
}

/** `desiredHourlyWage` → «Desired hourly wage»; `turno_preferido` → «Turno preferido». */
export function humanizarClave(clave: string) {
  const texto = clave
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim()
    .toLowerCase();
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : clave;
}

/**
 * Preguntas propias de la vacante, en el orden y con las palabras del
 * formulario.
 *
 * Sin el esquema, una pregunta como `tieneLicenciaDeConducir` se enseñaba
 * humanizada —«Tiene licencia de conducir»— y solo si la persona la había
 * respondido. Con el esquema se enseña la pregunta TAL COMO SE LE HIZO, en su
 * sección, y las que quedaron en blanco aparecen como «Sin responder»: el
 * hueco es información, y no verlo hace pensar que no se preguntó.
 */
function gruposDelEsquema(datos: Record<string, unknown>, esquema: VacancyApplicationFormSchema | null | undefined, usadas: Set<string>): GrupoRespuestas[] {
  if (!esquema) return [];
  const secciones = esquema.sections?.length
    ? esquema.sections
    : esquema.fields?.length
      ? [{ title: "Preguntas de la vacante", fields: esquema.fields }]
      : [];

  return secciones
    .map((seccion, indice) => {
      const respuestas = (seccion.fields ?? [])
        .map((campo) => {
          usadas.add(campo.key);
          const valor = textoDeRespuesta(datos[campo.key]);
          return { clave: campo.key, etiqueta: campo.label || humanizarClave(campo.key), valor: valor || "Sin responder" };
        });
      return { id: `vacante-${indice}`, titulo: seccion.title || "Preguntas de la vacante", respuestas };
    })
    .filter((grupo) => grupo.respuestas.length);
}

export function agruparRespuestas(
  respuestas: Record<string, unknown> | null | undefined,
  esquema?: VacancyApplicationFormSchema | null,
): GrupoRespuestas[] {
  const datos = respuestas ?? {};
  const usadas = new Set<string>();
  const tomar = (clave: string) => {
    usadas.add(clave);
    return textoDeRespuesta(datos[clave]);
  };

  /*
   * El apellido se enseña junto al nombre, arriba: repetirlo al final entre
   * «Otras respuestas» como «Last name» era ver el mismo dato dos veces, y la
   * segunda con nombre de programador.
   */
  usadas.add("lastName");

  const grupos: GrupoRespuestas[] = [];
  const agregar = (id: string, titulo: string, lista: RespuestaLegible[]) => {
    if (lista.length) grupos.push({ id, titulo, respuestas: lista });
  };

  agregar(
    "rapidas",
    "Las cinco preguntas rápidas",
    PREGUNTAS_RAPIDAS.map((pregunta) => {
      const valor = tomar(pregunta.clave);
      const detalle = pregunta.explicacion ? tomar(pregunta.explicacion) : "";
      if (!valor) return null;
      const fila: RespuestaLegible = { clave: pregunta.clave, etiqueta: pregunta.etiqueta, valor };
      if (detalle) fila.detalle = detalle;
      return fila;
    }).filter((item): item is RespuestaLegible => item !== null),
  );

  const esTelefono = (clave: string) => /phone|telefono|teléfono/i.test(clave);
  const simple = (lista: Array<{ clave: string; etiqueta: string }>) =>
    lista
      .map((campo) => {
        const valor = tomar(campo.clave);
        if (!valor) return null;
        const fila: RespuestaLegible = { clave: campo.clave, etiqueta: campo.etiqueta, valor };
        if (esTelefono(campo.clave)) fila.telefono = valor;
        return fila;
      })
      .filter((item): item is RespuestaLegible => item !== null);

  agregar("personales", "Sus datos personales", simple(PERSONALES));

  const emergencia = (() => {
    const nombre = textoDeRespuesta(datos.emergencyContactName);
    const relacion = textoDeRespuesta(datos.emergencyContactRelationship);
    const telefono = textoDeRespuesta(datos.emergencyContactPhone);
    ["emergencyContactName", "emergencyContactRelationship", "emergencyContactPhone"].forEach((clave) => usadas.add(clave));
    if (!nombre && !relacion && !telefono) return [];
    const fila: RespuestaLegible = { clave: "emergencia", etiqueta: "Contacto de emergencia", valor: nombre || "Sin nombre" };
    if (relacion) fila.detalle = relacion;
    if (telefono) fila.telefono = telefono;
    return [fila];
  })();
  agregar("emergencia", "A quién avisar si pasa algo", emergencia);

  agregar("busqueda", "Qué tipo de trabajo busca", simple(BUSQUEDA));
  agregar("empleo", "Su último empleo", simple(ULTIMO_EMPLEO));

  const referencias = [1, 2, 3]
    .map((numero) => {
      const nombre = textoDeRespuesta(datos[`reference${numero}Name`]);
      const relacion = textoDeRespuesta(datos[`reference${numero}Relationship`]);
      const telefono = textoDeRespuesta(datos[`reference${numero}Phone`]);
      if (!nombre && !relacion && !telefono) return null;
      const fila: RespuestaLegible = {
        clave: `reference${numero}`,
        etiqueta: `Referencia ${numero}`,
        valor: nombre || "Sin nombre",
      };
      if (relacion) fila.detalle = relacion;
      if (telefono) fila.telefono = telefono;
      return fila;
    })
    .filter((item): item is RespuestaLegible => item !== null);
  CLAVES_DE_REFERENCIA.forEach((clave) => usadas.add(clave));
  agregar("referencias", "Personas que lo recomiendan", referencias);

  agregar("declaracion", "Su declaración", simple(DECLARACION));

  /* Las preguntas que configuró la empresa para esta vacante, con su propio
     texto y sus huecos a la vista. */
  gruposDelEsquema(datos, esquema, usadas).forEach((grupo) => grupos.push(grupo));

  const otras = Object.keys(datos)
    .filter((clave) => !usadas.has(clave) && !NUNCA_SE_ENSENA.test(clave))
    .map((clave) => {
      const valor = textoDeRespuesta(datos[clave]);
      return valor ? { clave, etiqueta: humanizarClave(clave), valor } : null;
    })
    .filter((item): item is RespuestaLegible => item !== null);
  agregar("otras", "Otras respuestas", otras);

  return grupos;
}

/** Cuántas respuestas hay en total, para poder decirlo sin desplegar el bloque. */
export function contarRespuestas(grupos: GrupoRespuestas[]) {
  return grupos.reduce((total, grupo) => total + grupo.respuestas.length, 0);
}
