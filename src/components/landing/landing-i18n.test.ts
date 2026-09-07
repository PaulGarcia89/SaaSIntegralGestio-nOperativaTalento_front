import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import esCommon from "@/i18n/locales/es/common.json";
import enCommon from "@/i18n/locales/en/common.json";

/**
 * La portada tiene que cambiar de idioma ENTERA.
 *
 * Por qué existe esta prueba
 * --------------------------
 * El selector de idioma cambiaba 23 cadenas —cabecera, hero y poco más— y
 * dejaba en español las otras ~120: los módulos de producto, las etapas del
 * ciclo, multiempresa, roles, cómo funciona, el bloque final, el pie y todo el
 * panel ilustrativo. En inglés la página quedaba a medias, que se lee peor que
 * si estuviera entera en español: parece rota, no bilingüe.
 *
 * La causa era que los textos estaban escritos a mano dentro del JSX y dentro
 * de arrays a nivel de módulo, fuera del alcance de `useLocale`. Nada lo
 * detectaba: es código válido que compila y renderiza.
 *
 * Cómo detecta
 * ------------
 * En vez de intentar distinguir «prosa» de una clase de Tailwind —que es
 * ambiguo y da falsos positivos—, busca ESPAÑOL: vocal acentuada, eñe, signos
 * de apertura, o una palabra funcional española suelta. Una clase de Tailwind
 * no contiene ninguna de esas cosas, así que la señal es limpia. Antes de
 * mirar se quitan los comentarios y las claves de `t("…")`, que sí pueden
 * llevarlas.
 */

const DIR = join(process.cwd(), "src/components/landing");

/** Marcas inequívocas de español en un texto de interfaz. */
const ACENTOS = /[áéíóúüñÁÉÍÓÚÜÑ¿¡]/;
const PALABRAS = /(^|[\s.,;:(])(de|del|la|el|los|las|una|unas|unos|para|con|que|tu|tus|su|sus|cada|sin|desde|hasta|según|entre|sobre|cuando|donde)([\s.,;:)]|$)/i;

/** El nombre de marca no se traduce, y la inicial del logotipo tampoco. */
const PERMITIDOS = new Set(["TalentOS", "T"]);

function esEspanol(texto: string) {
  return ACENTOS.test(texto) || PALABRAS.test(texto);
}

/** Quita comentarios y claves de traducción, que legítimamente llevan español. */
function limpiar(fuente: string) {
  return fuente
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ")
    .replace(/\bt\(\s*(["'`])[^"'`]*\1/g, "t(KEY")
    .replace(/\bt\(\s*`[^`]*`/g, "t(KEY");
}

const archivos = readdirSync(DIR).filter((nombre) => nombre.endsWith(".tsx"));

describe("la portada no lleva texto escrito a mano", () => {
  it("encuentra los componentes de la portada", () => {
    expect(archivos.length).toBeGreaterThan(0);
  });

  for (const nombre of archivos) {
    it(`${nombre} saca todos sus textos del diccionario`, () => {
      const fuente = limpiar(readFileSync(join(DIR, nombre), "utf8"));
      const hallazgos: string[] = [];

      // Nodos de texto JSX: lo que se lee literalmente entre dos etiquetas.
      for (const [, texto] of fuente.matchAll(/>([^<>{}\n]{2,})</g)) {
        const limpio = texto.trim();
        if (!limpio || PERMITIDOS.has(limpio)) continue;
        if (esEspanol(limpio)) hallazgos.push(`texto JSX: «${limpio.slice(0, 60)}»`);
      }

      // Literales de cadena: los arrays de datos y las props visibles.
      for (const [, texto] of fuente.matchAll(/"([^"\\\n]{3,})"/g)) {
        if (PERMITIDOS.has(texto)) continue;
        if (esEspanol(texto)) hallazgos.push(`literal: «${texto.slice(0, 60)}»`);
      }

      expect(hallazgos).toEqual([]);
    });
  }
});

describe("los dos diccionarios van al mismo paso", () => {
  const es = esCommon as Record<string, string>;
  const en = enCommon as Record<string, string>;

  it("tienen exactamente las mismas claves", () => {
    // Una clave que solo existe en uno cae al idioma de reserva sin avisar: en
    // pantalla aparece una frase en español dentro de una página en inglés.
    expect([...new Set(Object.keys(es))].filter((k) => !(k in en))).toEqual([]);
    expect([...new Set(Object.keys(en))].filter((k) => !(k in es))).toEqual([]);
  });

  it("ninguna clave de la portada quedó sin traducir", () => {
    // Mismo texto en los dos idiomas es señal de traducción olvidada, salvo
    // cuando la cadena es solo un valor con formato.
    const sospechosas = Object.keys(es)
      .filter((clave) => clave.startsWith("landing."))
      .filter((clave) => es[clave] === en[clave])
      .filter((clave) => es[clave].replace(/\{\{\w+\}\}/g, "").trim().length > 12)
      // Términos que en este producto se escriben igual en los dos idiomas.
      .filter((clave) => !["landing.modules.onboarding.title", "landing.lifecycle.onboarding", "landing.preview.chip.onboarding"].includes(clave));

    expect(sospechosas).toEqual([]);
  });

  it("los marcadores {{…}} coinciden entre idiomas", () => {
    const marcadores = (texto: string) => [...texto.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort();
    const desajustes = Object.keys(es)
      .filter((clave) => clave in en)
      .filter((clave) => marcadores(es[clave]).join() !== marcadores(en[clave]).join());
    expect(desajustes).toEqual([]);
  });
});
