import { describe, expect, it } from "vitest";
import { initialsOf } from "@/components/system/entity-card";

/**
 * Las iniciales sustituyen a la foto cuando no hay foto, así que tienen que
 * salir bien en los nombres reales de este producto: compuestos, con partícula,
 * con acento y, en el peor caso, vacíos.
 */
describe("iniciales de un nombre", () => {
  it("toma la primera y la última palabra, no las dos primeras", () => {
    // «María del Carmen Pérez» → MP, no MD: el apellido identifica más que la
    // partícula.
    expect(initialsOf("María del Carmen Pérez")).toBe("MP");
    expect(initialsOf("Ana Lucía Rodríguez Salas")).toBe("AS");
  });

  it("con una sola palabra usa sus dos primeras letras", () => {
    expect(initialsOf("Madonna")).toBe("MA");
  });

  it("conserva los acentos en mayúscula", () => {
    expect(initialsOf("Ángela Ñuñez")).toBe("ÁÑ");
  });

  it("no se rompe con espacios de más ni con un nombre vacío", () => {
    expect(initialsOf("   Luis   Soto  ")).toBe("LS");
    expect(initialsOf("")).toBe("?");
    expect(initialsOf("   ")).toBe("?");
  });

  it("nunca produce puntuación ni más de dos caracteres", () => {
    // Un paréntesis, un identificador o un correo colados en el campo del
    // nombre no deben acabar dibujados dentro del círculo.
    for (const entrada of ["(sin nombre)", "Luis (temporal)", "#4821", "a@b.com", "· ·"]) {
      const iniciales = initialsOf(entrada);
      expect(iniciales.length).toBeLessThanOrEqual(2);
      expect(iniciales).toMatch(/^(\?|\p{L}{1,2})$/u);
    }
  });
});
