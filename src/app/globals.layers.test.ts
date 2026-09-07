import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Ninguna regla de elemento fuera de una capa.
 *
 * Por qué existe esta prueba
 * --------------------------
 * `globals.css` importa Tailwind, que declara el orden `theme, base,
 * components, utilities`. Una regla escrita FUERA de toda capa gana a
 * cualquier capa, sea cual sea su especificidad. Es decir: una sola línea sin
 * capa anula, en silencio, todas las utilidades que toquen esa propiedad.
 *
 * Eso ocurrió de verdad y no lo vio nadie. `h1, h2, ... { color }` sin capa
 * dejaba sin efecto los 32 `text-*` puestos sobre titulares —entre ellos el
 * de la portada, que salía casi negro sobre fondo oscuro— y
 * `*, *::before, *::after { border-color }` pintaba del mismo gris los bordes
 * ámbar de acción y los rojos de peligro de toda la aplicación. En total, 337
 * utilidades escritas que no hacían nada.
 *
 * Ni el typecheck ni el build ni las demás pruebas pueden verlo: el CSS es
 * válido y las clases existen. `tokens.test.ts` comprueba que la clase EXISTA;
 * esta comprueba que pueda APLICARSE.
 *
 * Cómo leer un fallo
 * ------------------
 * Mueve la regla dentro de `@layer base`. Si de verdad tiene que ganar a las
 * utilidades —una barrera, no un valor predeterminado—, añádela a
 * `BARRERAS` con el motivo escrito.
 */

const CSS = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

/**
 * Propiedades con utilidad equivalente en Tailwind. Declararlas sin capa
 * significa que la utilidad correspondiente no podrá cambiarlas nunca.
 */
const CON_UTILIDAD = [
  "color",
  "background",
  "background-color",
  "background-image",
  "border-color",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "font-family",
  "font-size",
  "font-weight",
  "letter-spacing",
  "line-height",
  "text-align",
  "text-wrap",
  "overflow-wrap",
  "text-decoration",
  "opacity",
];

/**
 * Reglas que se quedan fuera de la capa A PROPÓSITO, con el motivo.
 * Son barreras: tienen que ganar a la utilidad allí donde se ponga.
 */
const BARRERAS: ReadonlyArray<{ selector: string; motivo: string }> = [
  {
    selector: ".skeleton",
    motivo:
      "Bajo `prefers-reduced-motion` el esqueleto tiene que dejar de barrer. " +
      "Es una garantía de accesibilidad: ninguna utilidad debería poder devolver el movimiento.",
  },
  {
    selector: "input, select, textarea",
    motivo:
      "Safari de iOS hace zoom al enfocar un control con tipografía menor de 16px. " +
      "Dentro de `base`, un `text-sm` sobre el campo ganaría y el zoom volvería.",
  },
];

/** Quita los comentarios: si no, el comentario que precede a una regla acaba
 *  pegado a su selector y `@layer base` deja de reconocerse como at-rule. */
function sinComentarios(css: string) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/** Reglas de nivel superior que NO están dentro de ningún `@layer`. */
function reglasSinCapa(cssConComentarios: string) {
  const css = sinComentarios(cssConComentarios);
  const fuera: Array<{ selector: string; declaraciones: string }> = [];
  const pila: string[] = [];
  let i = 0;
  let inicioBloque = 0;

  while (i < css.length) {
    const c = css[i];
    if (c === "{") {
      const cabecera = css.slice(inicioBloque, i).trim().replace(/\s+/g, " ");
      if (cabecera.startsWith("@")) {
        pila.push(cabecera);
        i += 1;
        inicioBloque = i;
        continue;
      }
      let profundidad = 1;
      let j = i + 1;
      while (j < css.length && profundidad > 0) {
        if (css[j] === "{") profundidad += 1;
        else if (css[j] === "}") profundidad -= 1;
        j += 1;
      }
      // `@keyframes` contiene pasos (`from`, `to`, `50%`), no reglas de estilo.
      const dentroDeKeyframes = pila.some((at) => at.startsWith("@keyframes"));
      if (!dentroDeKeyframes && !pila.some((at) => at.startsWith("@layer"))) {
        fuera.push({ selector: cabecera, declaraciones: css.slice(i + 1, j - 1) });
      }
      i = j;
      inicioBloque = i;
      continue;
    }
    if (c === "}") {
      pila.pop();
      i += 1;
      inicioBloque = i;
      continue;
    }
    if (c === ";" && css.slice(inicioBloque, i).trim().startsWith("@")) {
      i += 1;
      inicioBloque = i;
      continue;
    }
    i += 1;
  }
  return fuera;
}

describe("globals.css no anula utilidades sin querer", () => {
  const fuera = reglasSinCapa(CSS);

  it("encuentra reglas para analizar", () => {
    // Si el analizador se rompe y no ve nada, la prueba pasaría vacía.
    expect(fuera.length).toBeGreaterThan(0);
  });

  it("ninguna regla sin capa declara una propiedad que tenga utilidad", () => {
    const permitidos = new Set(BARRERAS.map((b) => b.selector));
    const infracciones: string[] = [];

    for (const regla of fuera) {
      if (permitidos.has(regla.selector)) continue;
      for (const propiedad of CON_UTILIDAD) {
        const declara = new RegExp(`(^|;|\\n)\\s*${propiedad}\\s*:`).test(regla.declaraciones);
        if (declara) {
          infracciones.push(
            `«${regla.selector}» declara ${propiedad} fuera de toda capa: ` +
              `ninguna utilidad de Tailwind podrá cambiarla`,
          );
        }
      }
    }

    expect(infracciones).toEqual([]);
  });

  it("cada barrera declarada sigue existiendo en la hoja", () => {
    // Una barrera que ya no está en el CSS es una excepción caducada que
    // taparía una regla nueva con el mismo selector.
    for (const barrera of BARRERAS) {
      expect(
        fuera.some((regla) => regla.selector === barrera.selector),
        `la barrera «${barrera.selector}» ya no está sin capa: ${barrera.motivo}`,
      ).toBe(true);
    }
  });

  it("las reglas de elemento viven dentro de `@layer base`", () => {
    const capaBase = CSS.match(/@layer base \{([\s\S]*?)\n\}/);
    expect(capaBase, "no hay bloque `@layer base` en globals.css").not.toBeNull();
    const contenido = capaBase![1];
    for (const selector of ["h1, h2, h3, h4, h5, h6", "body", "html", "*,"]) {
      expect(contenido.includes(selector), `«${selector}» debería estar en @layer base`).toBe(true);
    }
  });

  it("los titulares no fijan color: lo heredan de su contenedor", () => {
    // Fijarlo rompe la herencia y un titular dentro de una sección oscura sale
    // con la tinta de superficie clara. El valor por defecto ya lo pone `body`.
    const bloque = CSS.match(/h1, h2, h3, h4, h5, h6 \{([\s\S]*?)\n  \}/);
    expect(bloque).not.toBeNull();
    expect(/(^|;|\n)\s*color\s*:/.test(bloque![1])).toBe(false);
  });
});
