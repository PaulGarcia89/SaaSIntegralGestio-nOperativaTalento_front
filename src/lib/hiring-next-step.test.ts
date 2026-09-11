import { describe, expect, it } from "vitest";
import { planDeContratacion, type EntradaContratacion } from "./hiring-next-step";

const base: EntradaContratacion = {
  status: "SUBMITTED",
  entrevistaAgendada: false,
  entrevistaCompletada: false,
  oferta: "ninguna",
  contratacionId: null,
  documentos: "sin-enviar",
  puedeGestionar: true,
  puedeCrearContratacion: true,
  puedeEnviarDocumentos: true,
};

describe("planDeContratacion", () => {
  it("son cuatro pasos, no siete", () => {
    // Oferta, expediente, documentos e incorporación ocurren en el módulo de
    // contratación: aquí son requisitos de un solo paso, no cuatro casillas.
    expect(planDeContratacion(base).pasos.map((paso) => paso.id)).toEqual(["postulacion", "evaluacion", "decision", "contratacion"]);
  });

  it("una postulación recién recibida no propone preparar la oferta", () => {
    // El defecto de origen: el texto decía «programa la entrevista» y el botón,
    // «Preparar oferta», porque cada uno se calculaba por su cuenta.
    const plan = planDeContratacion(base);
    expect(plan.pasos[plan.actual].id).toBe("evaluacion");
    expect(plan.accion).toEqual({ tipo: "hacer", etiqueta: "Programar entrevista", operacion: "agendar-entrevista" });
  });

  it("no se puede ejecutar un paso si el anterior no está cumplido", () => {
    // Sin entrevista, «Preparar la oferta» no debe existir como acción: antes
    // el botón estaba disponible desde el primer día.
    const plan = planDeContratacion(base);
    const contratacion = plan.pasos.find((paso) => paso.id === "contratacion");
    expect(contratacion?.bloqueado).toBe(true);
    expect(contratacion?.accion).toBeNull();
  });

  it("el paso que toca nunca está bloqueado", () => {
    const plan = planDeContratacion(base);
    expect(plan.pasos[plan.actual].bloqueado).toBe(false);
  });

  it("cada paso dice qué le falta", () => {
    const plan = planDeContratacion(base);
    const evaluacion = plan.pasos.find((paso) => paso.id === "evaluacion");
    expect(evaluacion?.requisitos).toEqual([
      { texto: "Una entrevista agendada", cumplido: false },
      { texto: "La entrevista realizada", cumplido: false },
    ]);
  });

  it("con la entrevista agendada, la acción deja de ser agendar", () => {
    // Dos botones para lo mismo era el defecto: la cabecera llevaba al panel
    // que ya se estaba mirando mientras la acción real vivía más abajo.
    const plan = planDeContratacion({ ...base, entrevistaAgendada: true });
    expect(plan.accion).toEqual({ tipo: "ir", etiqueta: "Registrar el resultado", destino: "#evaluar" });
  });

  it("con la entrevista agendada, el primer requisito ya está cumplido", () => {
    const plan = planDeContratacion({ ...base, entrevistaAgendada: true });
    const evaluacion = plan.pasos.find((paso) => paso.id === "evaluacion");
    expect(evaluacion?.requisitos[0].cumplido).toBe(true);
    expect(evaluacion?.requisitos[1].cumplido).toBe(false);
    // Sigue sin poder avanzarse a la decisión.
    expect(plan.pasos.find((paso) => paso.id === "decision")?.bloqueado).toBe(true);
  });

  it("se desbloquea en cadena a medida que se cumplen los pasos", () => {
    const plan = planDeContratacion({ ...base, status: "APPROVED", entrevistaAgendada: true, entrevistaCompletada: true, oferta: "aceptada" });
    expect(plan.pasos.find((paso) => paso.id === "contratacion")?.bloqueado).toBe(false);
    // Y con todo cumplido hasta la decisión, la contratación es el paso actual.
    expect(plan.pasos[plan.actual].id).toBe("contratacion");
  });

  it("la acción siempre pertenece al paso actual", () => {
    const estados: EntradaContratacion["status"][] = ["SUBMITTED", "REVIEWING", "INTERVIEW", "APPROVED", "HIRED", "REJECTED", "WITHDRAWN"];
    const ofertas: EntradaContratacion["oferta"][] = ["ninguna", "enviada", "aceptada"];
    const documentos: EntradaContratacion["documentos"][] = ["sin-enviar", "enviados", "completos"];
    for (const status of estados) {
      for (const oferta of ofertas) {
        for (const docs of documentos) {
          for (const contratacionId of [null, "con-1"]) {
            for (const entrevistaCompletada of [false, true]) {
              const plan = planDeContratacion({ ...base, status, oferta, documentos: docs, contratacionId, entrevistaCompletada });
              expect(plan.accion).toBe(plan.pasos[plan.actual].accion);
            }
          }
        }
      }
    }
  });

  it("con un expediente abierto lo abre en vez de crear otro", () => {
    // Crear otro devuelve 409 del servidor después de confirmar en un diálogo.
    const plan = planDeContratacion({ ...base, status: "APPROVED", entrevistaAgendada: true, entrevistaCompletada: true, oferta: "aceptada", contratacionId: "con-9" });
    expect(plan.pasos[plan.actual].id).toBe("contratacion");
    expect(plan.accion).toEqual({ tipo: "ir", etiqueta: "Abrir la contratación", destino: "/hiring/con-9" });
  });

  it("sin expediente y ya aprobado, ofrece enviarlo a contratación", () => {
    const plan = planDeContratacion({ ...base, status: "APPROVED", entrevistaAgendada: true, entrevistaCompletada: true, oferta: "aceptada" });
    expect(plan.accion).toEqual({ tipo: "hacer", etiqueta: "Enviar a contratación", operacion: "crear-contratacion" });
  });

  it("con todo firmado, el siguiente paso es la incorporación", () => {
    // La ficha no recibe el estado del plan de incorporación: decir «hecho»
    // sería inventarlo.
    const plan = planDeContratacion({ ...base, status: "HIRED", entrevistaAgendada: true, entrevistaCompletada: true, oferta: "aceptada", documentos: "completos", contratacionId: "con-9" });
    const contratacion = plan.pasos.find((paso) => paso.id === "contratacion");
    expect(contratacion?.estado).toBe("hecho");
    expect(plan.accion).toEqual({ tipo: "ir", etiqueta: "Abrir la incorporación", destino: "/onboarding/documents" });
  });

  it("quien solo mira no recibe acciones", () => {
    const plan = planDeContratacion({ ...base, puedeGestionar: false, puedeCrearContratacion: false, puedeEnviarDocumentos: false });
    expect(plan.accion).toBeNull();
  });

  it("una postulación cerrada no propone seguir adelante", () => {
    const plan = planDeContratacion({ ...base, status: "REJECTED" });
    expect(plan.pasos[plan.actual].id).toBe("decision");
    expect(plan.accion).toEqual({ tipo: "ir", etiqueta: "Ver el expediente", destino: "#revisar" });
  });

  it("un candidato contratado con documentos pendientes los pide", () => {
    const plan = planDeContratacion({ ...base, status: "HIRED", entrevistaAgendada: true, entrevistaCompletada: true, oferta: "aceptada", contratacionId: "con-9" });
    expect(plan.pasos[plan.actual].id).toBe("contratacion");
    expect(plan.accion).toEqual({ tipo: "hacer", etiqueta: "Enviar los documentos", operacion: "enviar-documentos" });
  });
});
