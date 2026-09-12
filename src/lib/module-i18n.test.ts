import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import english from "@/i18n/locales/en/ui-copy.json";

const diccionario = english as Record<string, string>;

/* ==========================================================================
   EL TEXTO QUE LA GUARDIA DE `uiText` NO PUEDE VER
   ==========================================================================
   `ui-copy.test.ts` recorre las llamadas `uiText("literal")` y exige su
   entrada en inglés. Es una buena red, pero sólo ve el literal cuando está
   DENTRO del paréntesis, y por ahí se coló medio producto:

     · `confirmAction({ title: "¿Cancelar la transferencia?" })` — el diálogo
       pinta ese texto tal cual, así que las confirmaciones del inventario
       —los momentos irreversibles— salían en español con la aplicación en
       inglés.
     · `header: "Situación"`, junto a otras cabeceras que sí usaban `uiText`.
     · Las tablas de constantes que se traducen al pintarse con
       `uiText(item.label)`: el literal vive lejos de la llamada, así que una
       entrada que falte no la nota nadie hasta verlo en pantalla.
     · Y en capacitación, tablas enteras de constantes que ni siquiera se
       traducían al pintarse: los niveles de competencia, los estados de una
       credencial, los rótulos de las columnas de seguimiento.

   Esta prueba mira el problema por el otro lado: no por dónde se llama al
   traductor, sino por lo que hay escrito. Cualquier cadena en español
   asignada a una clave que se PINTA tiene que poder traducirse, esté
   envuelta o no.
   ========================================================================== */

/** Los módulos cubiertos, y cómo se reconocen sus archivos. */
const MODULOS: Array<{ nombre: string; patron: RegExp; minimo: number }> = [
  { nombre: "inventario de restaurante", patron: /restaurant/i, minimo: 15 },
  { nombre: "capacitación", patron: /training/i, minimo: 10 },
];

/** Claves cuyo valor acaba en pantalla. */
const CLAVES_VISIBLES = [
  "label", "short", "detail", "title", "description", "headline", "header", "note", "hint",
  "searchLabel", "consequence", "confirmLabel", "cancelLabel", "eyebrow", "subtitle", "etiqueta",
];

function archivosDe(patron: RegExp, dir = "src/components"): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
    const ruta = join(dir, entrada.name);
    if (entrada.isDirectory()) return archivosDe(patron, ruta);
    return ruta.endsWith(".tsx") && patron.test(ruta) ? [ruta] : [];
  });
}

/** ¿Es una frase escrita para una persona, y no un código o una ruta? */
function esTextoParaUnaPersona(valor: string): boolean {
  const texto = valor.trim();
  if (texto.length < 3) return false;
  if (/^[A-Z0-9_.:\-/]+$/.test(texto)) return false;          // ACTIVE, restaurant_inventory.view
  if (/^(https?:|\/|#|\.|@)/.test(texto)) return false;        // rutas y enlaces
  if (/^[\d\s.,%$€-]+$/.test(texto)) return false;             // cifras
  if (/[{}<>]/.test(texto)) return false;                      // plantillas y marcado
  if (/^[A-Za-z]+\/[A-Za-z_]+$/.test(texto)) return false;     // America/New_York
  /*
   * Basta con que empiece por mayúscula o lleve acento: exigir un espacio o
   * una tilde dejaba pasar las palabras sueltas sin acentuar, y así se coló
   * `header: "Existencia"` entre dos cabeceras que sí estaban traducidas.
   */
  return /^[A-ZÁÉÍÓÚÑ¿¡]/.test(texto) || /[áéíóúñ]/.test(texto);
}

const PATRON_CLAVES = new RegExp(`\\b(${CLAVES_VISIBLES.join("|")})\\s*[:=]\\s*"([^"]+)"`, "g");

/**
 * Términos que se escriben igual en los dos idiomas. Cada uno está aquí
 * porque es la palabra correcta en inglés, no porque falte traducirlo.
 */
const IGUALES_A_PROPOSITO = new Set([
  "Kardex", "SKU", "OCR", "Total", "Stock", "Control", "Webhooks", "Antivirus",
  "Email", "Password", "Marketing", "Pipeline", "Onboarding", "Dashboard",
]);

describe.each(MODULOS)("el módulo de $nombre se puede leer en inglés", ({ patron, minimo }) => {
  const archivos = archivosDe(patron);

  it("encuentra sus pantallas", () => {
    expect(archivos.length).toBeGreaterThanOrEqual(minimo);
  });

  it("toda cadena escrita para una persona tiene su entrada en inglés", () => {
    const sinTraducir: string[] = [];
    for (const ruta of archivos) {
      for (const [, clave, valor] of readFileSync(ruta, "utf8").matchAll(PATRON_CLAVES)) {
        if (!esTextoParaUnaPersona(valor)) continue;
        if (!diccionario[valor.trim()]?.trim()) sinTraducir.push(`${ruta}  ${clave}: ${valor}`);
      }
    }
    expect(sinTraducir, "añade estas cadenas a src/i18n/locales/en/ui-copy.json").toEqual([]);
  });

  /**
   * Una traducción copiada sin traducir es indistinguible de una que falta,
   * salvo porque esta prueba la ve.
   */
  it("no deja traducciones que son la misma frase en español", () => {
    const sospechosas: string[] = [];
    for (const ruta of archivos) {
      for (const [, , valor] of readFileSync(ruta, "utf8").matchAll(PATRON_CLAVES)) {
        const clave = valor.trim();
        if (!esTextoParaUnaPersona(clave) || IGUALES_A_PROPOSITO.has(clave)) continue;
        if (diccionario[clave] === clave && /[áéíóúñ¿¡]/i.test(clave)) sospechosas.push(`${ruta}  ${clave}`);
      }
    }
    expect(sospechosas, "estas se guardaron en inglés con el texto español").toEqual([]);
  });
});
