import { describe, expect, it } from "vitest";
import { intercalar } from "@/components/training/training-module-panel";

/**
 * Por qué existe esta prueba.
 *
 * La lista de «lo que debo completar» concatenaba vencidos, por vencer, en
 * curso y nuevos y cortaba a cuatro fichas. Con tres vencidos y cinco en
 * curso no aparecía NI UN SOLO curso por empezar, aunque el rótulo de la
 * sección dijera que estaban ahí. Repartir por rondas arregla eso sin dejar
 * de poner delante lo urgente.
 */
describe("intercalar", () => {
  it("reparte por rondas, uno de cada lista", () => {
    expect(intercalar([["a1", "a2"], ["b1", "b2"], ["c1"]])).toEqual(["a1", "b1", "c1", "a2", "b2"]);
  });

  it("las primeras posiciones representan a todas las categorías", () => {
    const vencidos = ["v1", "v2", "v3"];
    const nuevos = ["n1", "n2"];
    // Concatenando, las cuatro primeras eran v1 v2 v3 y solo entonces n1.
    expect(intercalar([vencidos, nuevos]).slice(0, 4)).toEqual(["v1", "n1", "v2", "n2"]);
  });

  it("conserva la prioridad: a igualdad de ronda manda la primera lista", () => {
    expect(intercalar([["urgente"], ["normal"]])[0]).toBe("urgente");
  });

  it("no pierde ni duplica elementos", () => {
    const entrada = [["a", "b", "c"], [], ["d"], ["e", "f"]];
    const salida = intercalar(entrada);
    expect(salida).toHaveLength(6);
    expect([...salida].sort()).toEqual(["a", "b", "c", "d", "e", "f"]);
  });

  it("aguanta listas vacías y ninguna lista", () => {
    expect(intercalar([])).toEqual([]);
    expect(intercalar([[], []])).toEqual([]);
  });
});
