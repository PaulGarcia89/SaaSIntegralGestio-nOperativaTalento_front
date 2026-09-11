import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Un `Select` se ata a un VALOR, nunca a una etiqueta.
 *
 * Por qué existe esta prueba
 * --------------------------
 * El selector de modalidad de la vacante estaba escrito así:
 *
 *     <Select value={technicalLabel(form.workMode)} …>
 *       <SelectItem value="REMOTE">…
 *
 * `technicalLabel("HYBRID")` devuelve «Híbrido», que no es el `value` de
 * ninguna opción. Radix no encuentra coincidencia y NO PINTA NADA, así que la
 * persona elegía una opción, el estado se guardaba bien y el campo se veía
 * vacío. Parecía que el control no funcionaba cuando lo único roto era lo que
 * mostraba.
 *
 * El fallo es invisible para TypeScript —ambas cosas son `string`— y para las
 * pruebas de render, porque el estado sí cambia. Por eso se vigila en el
 * código: cualquier `Select value={algoLabel(...)}` es el mismo error.
 */
const SOSPECHOSO = /<Select\s+value=\{[A-Za-z]*[Ll]abel\(/g;

function archivos(dir: string): string[] {
  const raiz = join(process.cwd(), dir);
  const encontrados: string[] = [];
  const recorrer = (actual: string) => {
    for (const entrada of readdirSync(actual, { withFileTypes: true })) {
      const ruta = join(actual, entrada.name);
      if (entrada.isDirectory()) recorrer(ruta);
      else if (entrada.name.endsWith(".tsx")) encontrados.push(ruta);
    }
  };
  recorrer(raiz);
  return encontrados;
}

describe("los Select se atan al valor, no a la etiqueta", () => {
  const rutas = [...archivos("src/app"), ...archivos("src/components")];

  it("encuentra archivos que revisar", () => {
    expect(rutas.length).toBeGreaterThan(50);
  });

  it("ningún Select recibe una función de etiqueta como value", () => {
    const infracciones: string[] = [];
    for (const ruta of rutas) {
      const contenido = readFileSync(ruta, "utf8");
      for (const encontrado of contenido.matchAll(SOSPECHOSO)) {
        infracciones.push(`${ruta.replace(`${process.cwd()}/`, "")}: ${encontrado[0]}`);
      }
    }
    expect(infracciones).toEqual([]);
  });
});
