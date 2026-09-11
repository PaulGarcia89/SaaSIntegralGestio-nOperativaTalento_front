import { describe, expect, it } from "vitest";
import { agruparRespuestas, contarRespuestas, humanizarClave, textoDeRespuesta } from "./application-answers";

describe("textoDeRespuesta", () => {
  it("traduce los booleanos a la palabra que se leyó en el formulario", () => {
    expect(textoDeRespuesta(true)).toBe("Sí");
    expect(textoDeRespuesta(false)).toBe("No");
  });

  it("un «no» no es lo mismo que no haber respondido", () => {
    // Si `false` devolviera cadena vacía, «¿Ha sido condenado? No» desaparecería
    // de la ficha y parecería que la persona no contestó.
    expect(textoDeRespuesta(false)).not.toBe("");
    expect(textoDeRespuesta(null)).toBe("");
    expect(textoDeRespuesta(undefined)).toBe("");
    expect(textoDeRespuesta("   ")).toBe("");
  });

  it("junta las respuestas de opción múltiple", () => {
    expect(textoDeRespuesta(["Mañana", "Tarde"])).toBe("Mañana, Tarde");
  });
});

describe("humanizarClave", () => {
  it("separa el camelCase", () => {
    expect(humanizarClave("desiredHourlyWage")).toBe("Desired hourly wage");
  });

  it("convierte guiones y guiones bajos en espacios", () => {
    expect(humanizarClave("turno_preferido")).toBe("Turno preferido");
  });
});

describe("agruparRespuestas con el formulario de la vacante", () => {
  const esquema = {
    sections: [
      {
        title: "Disponibilidad",
        fields: [
          { key: "turnoNoche", label: "¿Puedes trabajar de noche?", type: "BOOLEAN" as const },
          { key: "vehiculoPropio", label: "¿Tienes vehículo propio?", type: "BOOLEAN" as const },
        ],
      },
    ],
  };

  it("usa la pregunta tal como se le hizo a la persona, no la clave", () => {
    const grupos = agruparRespuestas({ turnoNoche: true }, esquema);
    const vacante = grupos.find((grupo) => grupo.id === "vacante-0");
    expect(vacante?.titulo).toBe("Disponibilidad");
    expect(vacante?.respuestas[0]).toMatchObject({ etiqueta: "¿Puedes trabajar de noche?", valor: "Sí" });
  });

  it("una pregunta sin responder se enseña igual: el hueco es información", () => {
    const grupos = agruparRespuestas({ turnoNoche: true }, esquema);
    const vacante = grupos.find((grupo) => grupo.id === "vacante-0");
    expect(vacante?.respuestas[1]).toMatchObject({ etiqueta: "¿Tienes vehículo propio?", valor: "Sin responder" });
  });

  it("lo del esquema no se repite en «Otras respuestas»", () => {
    const grupos = agruparRespuestas({ turnoNoche: true, otraCosa: "valor" }, esquema);
    const otras = grupos.find((grupo) => grupo.id === "otras");
    expect(otras?.respuestas.map((respuesta) => respuesta.clave)).toEqual(["otraCosa"]);
  });

  it("sin esquema se comporta como antes", () => {
    expect(agruparRespuestas({ turnoNoche: true }).find((grupo) => grupo.id === "vacante-0")).toBeUndefined();
  });
});

describe("agruparRespuestas", () => {
  it("sin respuestas no inventa grupos vacíos", () => {
    expect(agruparRespuestas(null)).toEqual([]);
    expect(agruparRespuestas({})).toEqual([]);
  });

  it("agrupa las cinco preguntas y pega la explicación a su pregunta", () => {
    const grupos = agruparRespuestas({
      is18OrOlder: true,
      authorizedToWorkInUS: true,
      workedForCompany: true,
      workedForCompanyExplanation: "En 2019, como cajero.",
      felonyConviction: false,
    });
    const rapidas = grupos.find((grupo) => grupo.id === "rapidas");
    expect(rapidas?.respuestas).toHaveLength(4);
    expect(rapidas?.respuestas[2]).toMatchObject({ valor: "Sí", detalle: "En 2019, como cajero." });
    expect(rapidas?.respuestas[3]).toMatchObject({ valor: "No" });
  });

  it("la explicación no vuelve a aparecer suelta en «Otras respuestas»", () => {
    const grupos = agruparRespuestas({ workedForCompany: true, workedForCompanyExplanation: "En 2019." });
    expect(grupos.find((grupo) => grupo.id === "otras")).toBeUndefined();
  });

  it("junta cada referencia en una sola fila", () => {
    const grupos = agruparRespuestas({
      reference1Name: "Ana Pérez",
      reference1Relationship: "Jefa anterior",
      reference1Phone: "3051234567",
      reference3Phone: "3059876543",
    });
    const referencias = grupos.find((grupo) => grupo.id === "referencias");
    expect(referencias?.respuestas).toHaveLength(2);
    expect(referencias?.respuestas[0]).toMatchObject({ valor: "Ana Pérez", detalle: "Jefa anterior", telefono: "3051234567" });
    // Una referencia con solo teléfono se enseña igual: el dato existe.
    expect(referencias?.respuestas[1]).toMatchObject({ valor: "Sin nombre", telefono: "3059876543" });
  });

  it("el apellido no se repite: ya se enseña junto al nombre", () => {
    expect(agruparRespuestas({ lastName: "Rivera" })).toEqual([]);
  });

  it("agrupa los datos personales cuando la postulación los trae", () => {
    const grupos = agruparRespuestas({ dateOfBirth: "1990-04-12", address: "123 SW 8th St", zipCode: "33130" });
    const personales = grupos.find((grupo) => grupo.id === "personales");
    expect(personales?.respuestas.map((respuesta) => respuesta.etiqueta)).toEqual(["Fecha de nacimiento", "Dirección", "Código postal"]);
  });

  it("junta el contacto de emergencia en una fila con su teléfono", () => {
    const grupos = agruparRespuestas({ emergencyContactName: "Marta Rivera", emergencyContactRelationship: "Hermana", emergencyContactPhone: "3055550000" });
    const emergencia = grupos.find((grupo) => grupo.id === "emergencia");
    expect(emergencia?.respuestas[0]).toMatchObject({ valor: "Marta Rivera", detalle: "Hermana", telefono: "3055550000" });
  });

  it("el número de seguridad social no se enseña, venga como venga", () => {
    // El servidor lo descarta al postular, pero un expediente antiguo podría
    // traerlo y habría caído en «Otras respuestas», a la vista de cualquiera.
    const grupos = agruparRespuestas({ socialSecurityNumber: "123-45-6789", ssn: "123456789", numeroDeSeguridadSocial: "1", otraCosa: "visible" });
    const todas = grupos.flatMap((grupo) => grupo.respuestas.map((respuesta) => respuesta.valor));
    expect(todas).toEqual(["visible"]);
  });

  it("una pregunta propia de la vacante no se pierde", () => {
    const grupos = agruparRespuestas({ tieneLicenciaDeConducir: "Sí, categoría B" });
    const otras = grupos.find((grupo) => grupo.id === "otras");
    expect(otras?.respuestas[0]).toMatchObject({ etiqueta: "Tiene licencia de conducir", valor: "Sí, categoría B" });
  });

  it("descarta lo que quedó vacío en vez de enseñar filas sin dato", () => {
    const grupos = agruparRespuestas({ employmentPreference: "", shiftPreference: "Noche" });
    const busqueda = grupos.find((grupo) => grupo.id === "busqueda");
    expect(busqueda?.respuestas).toHaveLength(1);
    expect(busqueda?.respuestas[0].valor).toBe("Noche");
  });

  it("respeta el orden del formulario", () => {
    const grupos = agruparRespuestas({
      reference1Name: "Ana",
      signatureName: "Carlos Díaz",
      is18OrOlder: true,
      previousEmployerCompany: "Acme",
      employmentPreference: "Bodega",
    });
    expect(grupos.map((grupo) => grupo.id)).toEqual(["rapidas", "busqueda", "empleo", "referencias", "declaracion"]);
  });

  it("marca los teléfonos para poder pulsarlos", () => {
    const grupos = agruparRespuestas({ previousEmployerPhone: "3051112222" });
    expect(grupos[0].respuestas[0]).toMatchObject({ valor: "3051112222", telefono: "3051112222" });
  });

  it("cuenta todas las respuestas para poder anunciarlas sin desplegar", () => {
    const grupos = agruparRespuestas({ is18OrOlder: true, shiftPreference: "Noche", reference1Name: "Ana" });
    expect(contarRespuestas(grupos)).toBe(3);
  });
});
